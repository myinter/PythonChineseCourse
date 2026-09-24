/* ============================================================
   代码运行器（主线程侧）

   职责：Worker 池管理、超时恢复、输出渲染、编辑器、友好报错。
   deck.js / trace.js 不直接接触 Worker，全部经由这里。

   热点备 Worker：超时 terminate 后，备用的 worker 已经预热好，
   直接顶上（实测约 1 秒就绪），用户几乎无感。
   ============================================================ */
(function (global) {
  'use strict';

  var WORKER_URL = 'assets/js/py-worker.js';
  var RUN_TIMEOUT = 5000;      // 超过则判定死循环
  var MAX_TERM_LINES = 2000;

  var active = null;           // 当前执行用的 worker 槽
  var standby = null;          // 热备
  var bootStarted = false;

  var env = {
    protocol: location.protocol,
    isFile: location.protocol === 'file:',
    running: false
  };

  /* ============================================================
     Worker 槽
     ============================================================ */
  function makeSlot() {
    var w = new Worker(WORKER_URL, { type: 'module' });
    var slot = {
      worker: w,
      ready: false,
      failed: null,
      source: null,
      current: null,     // 当前任务回调
      onReady: null
    };

    w.onmessage = function (e) {
      var m = e.data || {};
      switch (m.type) {
        case 'ready':
          slot.ready = true;
          if (slot.onReady) { slot.onReady(slot); slot.onReady = null; }
          break;
        case 'boot-error':
          slot.failed = m.text;
          if (slot.onReady) { slot.onReady(slot); slot.onReady = null; }
          break;
        case 'boot-src':
          slot.source = m.text;
          break;
        case 'boot-note':
          break;
        case 'out':
        case 'pkg': {
          var c = slot.current;
          if (!c) return;
          if (m.type === 'out') c.onOut(m.stream, m.text);
          else c.onPkg(m.text);
          break;
        }
        case 'done': {
          var c2 = slot.current; slot.current = null;
          if (c2) c2.onDone(m);
          break;
        }
        case 'error': {
          var c3 = slot.current; slot.current = null;
          if (c3) c3.onError(m);
          break;
        }
        case 'trace-result': {
          var c4 = slot.current; slot.current = null;
          if (c4) c4.onTrace(m.steps);
          break;
        }
        case 'trace-error': {
          var c5 = slot.current; slot.current = null;
          if (c5) c5.onError(m);
          break;
        }
      }
    };

    w.onerror = function (ev) {
      var c = slot.current; slot.current = null;
      slot.failed = ev.message || '运行时加载失败';
      if (c) c.onError({ text: '运行时加载失败：' + slot.failed });
    };

    w.postMessage({ type: 'boot' });
    return slot;
  }

  function waitReady(slot) {
    if (slot.ready || slot.failed) return Promise.resolve(slot);
    return new Promise(function (res) {
      slot.onReady = res;
    });
  }

  /* ============================================================
     启动：空闲时预热，不等用户点击
     ============================================================ */
  function boot() {
    if (bootStarted) return;
    bootStarted = true;
    active = makeSlot();
    // 备用的延后一点启动，避免和主 worker 抢带宽
    var idle = global.requestIdleCallback || function (fn) { return setTimeout(fn, 1200); };
    idle(function () {
      if (!standby) standby = makeSlot();
    });
  }

  /** 超时后：杀掉当前 worker，热备顶上 */
  function recover(slot) {
    try { slot.worker.terminate(); } catch (e) { /* 已终止 */ }

    if (slot === active) {
      if (standby) {
        active = standby;
        standby = null;
      } else {
        active = null;
      }
    } else if (slot === standby) {
      standby = null;
    }

    // 无论哪种情况都补一个备用的，保证下次超时仍能秒恢复
    var idle = global.requestIdleCallback || function (fn) { return setTimeout(fn, 600); };
    idle(function () {
      if (!standby) standby = makeSlot();
      if (!active) active = standby;
    });
  }

  function getActive() {
    if (!active) { active = makeSlot(); bootStarted = true; }
    return active;
  }

  /* ============================================================
     执行
     ============================================================ */

  /**
   * 运行代码。
   * @param {object} task { code, files, packages }
   * @param {object} cb { onOut(stream,text), onPkg(text), onDone(info), onError(info) }
   */
  function execute(task, cb) {
    var slot = getActive();

    waitReady(slot).then(function (s) {
      if (s.failed) {
        cb.onError({ text: 'Python 运行时加载失败：' + s.failed });
        return;
      }

      var finished = false;
      var timer = setTimeout(function () {
        if (finished) return;
        finished = true;
        s.current = null;
        cb.onError({ text: 'TIMEOUT' });
        recover(s);
      }, RUN_TIMEOUT);

      function wrap(fn) {
        return function (info) {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          fn(info);
        };
      }

      s.current = {
        onOut: cb.onOut,
        onPkg: cb.onPkg || function () {},
        onDone: wrap(cb.onDone),
        onError: wrap(cb.onError),
        onTrace: wrap(cb.onTrace || function () {})
      };

      s.worker.postMessage({
        type: 'run',
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        code: task.code,
        files: task.files || null,
        packages: task.packages || null
      });
    });
  }

  /** 单步追踪：先录制执行轨迹，再由 trace.js 回放 */
  function recordTrace(task, cb) {
    var slot = getActive();
    waitReady(slot).then(function (s) {
      if (s.failed) { cb.onError({ text: 'Python 运行时加载失败：' + s.failed }); return; }

      var finished = false;
      var timer = setTimeout(function () {
        if (finished) return;
        finished = true;
        s.current = null;
        cb.onError({ text: 'TIMEOUT' });
        recover(s);
      }, RUN_TIMEOUT * 2);

      s.current = {
        onOut: function () {},
        onPkg: function () {},
        onDone: function () {},
        onTrace: function (steps) {
          if (finished) return; finished = true; clearTimeout(timer);
          cb.onTrace(steps);
        },
        onError: function (info) {
          if (finished) return; finished = true; clearTimeout(timer);
          cb.onError(info);
        }
      };

      s.worker.postMessage({
        type: 'trace',
        id: 'tr-' + Date.now(),
        code: task.code,
        files: task.files || null,
        packages: task.packages || null
      });
    });
  }

  /* ============================================================
     终端输出渲染
     ============================================================ */
  function Term(panel) {
    this.root = panel.querySelector('[data-term]');
    this.body = panel.querySelector('[data-term-body]');
    this.status = panel.querySelector('[data-term-status]');
    this.lines = 0;
    this.cleared = false;
    this.pending = '';      // 尚未凑成完整行的尾巴
  }

  Term.prototype.reset = function () {
    this.body.innerHTML = '';
    this.lines = 0;
    this.cleared = true;
    this.pending = '';
    if (this.status) this.status.textContent = '输出';
  };

  Term.prototype.show = function () {
    if (this.root) this.root.hidden = false;
  };

  Term.prototype.hide = function () {
    if (this.root) this.root.hidden = true;
  };

  Term.prototype._renderLines = function (lines, cls) {
    if (!lines.length) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < lines.length; i++) {
      var line = document.createElement('span');
      line.className = 'term-line' + (cls ? ' is-' + cls : '');
      line.textContent = lines[i];
      frag.appendChild(line);
      this.lines++;
    }
    this.body.appendChild(frag);
    this.root.scrollTop = this.root.scrollHeight;
  };

  /**
   * 追加一段输出。
   *
   * text 是若干「以换行结尾的片段」拼接而成的，不能逐段去掉末尾换行再切分 ——
   * 那样会把片段交界处的空行吞掉（例如 print 一个本身以换行结尾的字符串时，
   * 真实输出里的空行会消失）。这里改为缓存未完成的行，只渲染确定完整的行。
   */
  Term.prototype.append = function (text, cls) {
    if (this.lines > MAX_TERM_LINES) return;
    this.show();
    if (this.cleared) { this.body.innerHTML = ''; this.cleared = false; }
    var empty = this.body.querySelector('.term-empty');
    if (empty) empty.remove();

    this.pending += String(text);
    var cut = this.pending.lastIndexOf('\n');
    if (cut === -1) return;                       // 还没有完整的一行

    var complete = this.pending.slice(0, cut);    // 末尾换行是行终止符，不是空行
    this.pending = this.pending.slice(cut + 1);

    if (complete) this._renderLines(complete.split('\n'), cls);

    if (this.lines > MAX_TERM_LINES) {
      var warn = document.createElement('span');
      warn.className = 'term-line is-system';
      warn.textContent = '…… 输出过多，后续内容已省略';
      this.body.appendChild(warn);
    }
  };

  /** 运行结束时调用：把没有以换行收尾的残留输出显示出来 */
  Term.prototype.end = function () {
    if (this.pending) {
      this._renderLines([this.pending], null);
      this.pending = '';
    }
  };

  /**
   * 追加一行系统提示（命令行回显、环境说明等）。
   * 必须自带换行 —— 否则这行会滞留在 pending 里，
   * 把紧随其后的第一行程序输出粘成一串，看起来就像输出丢了一行。
   */
  Term.prototype.system = function (text) {
    this.append(String(text) + '\n', 'system');
  };

  Term.prototype.setStatus = function (text) {
    if (this.status) this.status.textContent = text;
  };

  /* ============================================================
     编辑器
     ============================================================ */
  function Editor(panel, onRun) {
    this.panel = panel;
    this.block = panel._codeBlock;
    this.area = panel.querySelector('.code-area');
    this.pre = panel.querySelector('.code-pre');
    this.gutter = panel.querySelector('.code-gutter');
    this.original = panel._spec.source;
    this.onRun = onRun || function () {};
    this.ta = null;
    this.active = false;
    this._debounce = null;
  }

  Editor.prototype.open = function () {
    if (this.active) return;
    var self = this;

    var ta = document.createElement('textarea');
    ta.className = 'code-input';
    ta.value = this.currentSource();
    ta.spellcheck = false;
    ta.autocapitalize = 'off';
    ta.autocomplete = 'off';
    ta.autocorrect = 'off';
    ta.setAttribute('aria-label', '编辑代码');
    ta.wrap = 'off';

    // Tab 键插入 4 个空格（用 setRangeText 以保留撤销历史）
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var s = ta.selectionStart, en = ta.selectionEnd;
        ta.setRangeText('    ', s, en, 'end');
        self.onInput();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        self.onRun();
      } else if (e.key === 'Escape') {
        ta.blur();
      }
    });

    ta.addEventListener('input', function () { self.onInput(); });

    // 滚动同步：textarea 是滚动主体，pre 与行号跟着走
    ta.addEventListener('scroll', function () {
      self.pre.scrollTop = ta.scrollTop;
      self.pre.scrollLeft = ta.scrollLeft;
      if (self.gutter) {
        self.gutter.style.transform = 'translateY(' + (-ta.scrollTop) + 'px)';
      }
    });

    this.area.classList.add('is-editing');
    this.area.appendChild(ta);
    this.ta = ta;
    this.active = true;

    // 提示条
    var hint = document.createElement('div');
    hint.className = 'editor-hint';
    hint.innerHTML = '可直接修改代码后按 <kbd>Ctrl</kbd>+<kbd>Enter</kbd> 运行，<kbd>Esc</kbd> 退出编辑';
    this.panel.insertBefore(hint, this.panel.querySelector('.term'));
    this.hint = hint;

    ta.focus();
    var len = ta.value.length;
    ta.setSelectionRange(len, len);
  };

  Editor.prototype.currentSource = function () {
    if (this.ta) return this.ta.value;
    return this.block && this.block._meta ? this.block._meta.source : this.original;
  };

  Editor.prototype.onInput = function () {
    var self = this;
    clearTimeout(this._debounce);
    // 防抖 300ms：逐键重新高亮会在长代码上卡顿
    this._debounce = setTimeout(function () { self.rehighlight(); }, 300);
  };

  Editor.prototype.rehighlight = function () {
    if (!this.ta) return;
    var src = this.ta.value;
    var fresh = global.PYT.code.render(src, { reveal: false, byLine: false });
    var newPre = fresh.querySelector('.code-pre');
    var newGut = fresh.querySelector('.code-gutter');

    // 只换内容，保留 textarea 与滚动位置
    var st = this.ta.scrollTop, sl = this.ta.scrollLeft;
    this.pre.replaceChildren.apply(this.pre, Array.prototype.slice.call(newPre.childNodes));
    if (newGut && this.gutter) {
      this.gutter.replaceChildren.apply(this.gutter, Array.prototype.slice.call(newGut.childNodes));
    }
    this.pre.scrollTop = st;
    this.pre.scrollLeft = sl;
  };

  Editor.prototype.close = function () {
    if (!this.active) return;
    clearTimeout(this._debounce);
    if (this.ta) { this.ta.remove(); this.ta = null; }
    if (this.hint) { this.hint.remove(); this.hint = null; }
    this.area.classList.remove('is-editing');
    if (this.gutter) this.gutter.style.transform = '';
    this.active = false;
    // 用编辑后的内容重建高亮
    var src = this.lastSource || this.original;
    var fresh = global.PYT.code.render(src, { reveal: false });
    var newPre = fresh.querySelector('.code-pre');
    var newGut = fresh.querySelector('.code-gutter');
    this.pre.replaceChildren.apply(this.pre, Array.prototype.slice.call(newPre.childNodes));
    if (newGut && this.gutter) {
      this.gutter.replaceChildren.apply(this.gutter, Array.prototype.slice.call(newGut.childNodes));
    }
    this.block.classList.add('is-revealed');
  };

  Editor.prototype.reset = function () {
    if (this.ta) this.ta.value = this.original;
    this.lastSource = this.original;
    this.rehighlight();
  };

  /* ============================================================
     面板装配
     ============================================================ */
  function attach(panel) {
    if (panel._attached) return;
    panel._attached = true;

    var spec = panel._spec;
    var term = new Term(panel);
    var editor = new Editor(panel, function () { doRun(panel); });
    var actions = panel.querySelector('[data-code-actions]');
    var runBtn = actions && actions.querySelector('[data-action="run"]');
    var editBtn = actions && actions.querySelector('[data-action="edit"]');
    var resetBtn = actions && actions.querySelector('[data-action="reset"]');
    var revealBtn = actions && actions.querySelector('[data-action="reveal"]');
    var busy = false;

    // file:// 下 Worker 会被 CORS 拦截，提前说明而不是等报错
    if (env.isFile && runBtn) {
      runBtn.disabled = true;
      runBtn.title = '需要通过本地服务器打开才能运行代码';
    }

    function setBusy(on) {
      busy = on;
      env.running = on;
      if (!runBtn) return;
      runBtn.disabled = on || (env.isFile);
      runBtn.classList.toggle('is-running', on);
      runBtn.innerHTML = on
        ? global.PYT.icons.get('reset') + '<span>运行中</span>'
        : global.PYT.icons.get('play') + '<span>' + (spec.runLabel || '运行') + '</span>';
    }

    function doRun(panel) {
      if (busy) return;
      if (env.isFile) {
        if (global.PYT.deck) global.PYT.deck.toast('请通过本地服务器打开（见 README），file:// 下无法运行代码', 'warn');
        return;
      }
      var code = editor.currentSource();
      editor.lastSource = code;

      setBusy(true);
      term.reset();
      term.show();
      term.setStatus('运行中');
      term.system('$ python ' + (spec.file || 'demo.py'));

      execute({
        code: code,
        files: spec.files,
        packages: spec.packages
      }, {
        onOut: function (stream, text) {
          term.append(text, stream === 'stderr' ? 'stderr' : null);
        },
        onPkg: function (text) {
          term.system(text);
        },
        onDone: function (info) {
          setBusy(false);
          term.end();          // 输出可能没有以换行收尾，补渲染残留部分
          if (info.truncated) {
            term.system('（输出过多，已截断）');
            term.setStatus('已截断');
          } else {
            term.setStatus('完成');
          }
        },
        onError: function (info) {
          setBusy(false);
          term.end();
          if (info.text === 'TIMEOUT') {
            term.setStatus('超时');
            term.append('执行超过 ' + (RUN_TIMEOUT / 1000) + ' 秒，已强制停止。', 'stderr');
            term.append('常见原因：循环没有终止条件，或条件永远为真。', 'system');
            if (global.PYT.deck) global.PYT.deck.toast('执行超时，运行时已自动重启，可以继续使用', 'warn');
          } else {
            term.setStatus('出错');
            term.append(info.text, 'stderr');
          }
        }
      });
    }

    if (actions) {
      actions.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var act = btn.getAttribute('data-action');

        if (act === 'run') {
          doRun(panel);
        } else if (act === 'reveal') {
          global.PYT.code.revealAll(panel);
        } else if (act === 'edit') {
          if (editor.active) { editor.close(); btn.classList.remove('is-on'); }
          else { editor.open(); btn.classList.add('is-on'); }
        } else if (act === 'reset') {
          editor.reset();
          if (editor.active) editor.ta.focus();
        }
      });
    }

    // 点击代码区即可跳过打字动画
    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-code-actions]')) return;
      if (e.target.closest('.code-area') && editor.active) return;
      if (spec.shell) return;
      global.PYT.code.revealAll(panel);
    });

    panel._term = term;
    panel._editor = editor;
  }

  /* ============================================================
     对外接口
     ============================================================ */
  var runner = {
    init: boot,
    attach: attach,
    execute: execute,
    recordTrace: recordTrace,
    env: env,
    RUN_TIMEOUT: RUN_TIMEOUT,

    /** 页面进入某个代码面板时调用 */
    activate: function (panel) {
      attach(panel);
    },

    /** 停止当前执行（切换页面时调用） */
    stop: function () {
      if (active && active.current) {
        active.current = null;
        recover(active);
      }
    }
  };

  global.PYT = global.PYT || {};
  global.PYT.runner = runner;
})(window);
