/* ============================================================
   单步追踪播放器

   trace 函数不能是 async，因此无法"边跑边等用户按键"。
   做法是：先用 sys.settrace 全速录制执行轨迹（在 Worker 里），
   主线程拿到录制结果后再做动画回放。

   录制结果是纯 JSON 数组 [[行号, {变量: 值快照}], ...]，
   因此也可以手工预置（spec.traceScript）——若某段代码追踪不稳，
   预置轨迹能无缝替代，播放器完全无感。
   ============================================================ */
(function (global) {
  'use strict';

  var PLAY_INTERVAL = 620;   // 自动播放每步间隔

  function Player(panel) {
    this.panel = panel;
    this.spec = panel._spec;
    this.bar = panel.querySelector('[data-trace]');
    this.block = panel._codeBlock;
    this.steps = this.spec.traceScript || null;
    this.index = -1;
    this.timer = null;
    this.recording = false;
    this.varsEl = null;
    this._buildVars();
    this._bind();
  }

  Player.prototype._buildVars = function () {
    var v = document.createElement('div');
    v.className = 'trace-vars';
    v.setAttribute('data-trace-vars', '');
    v.innerHTML = '<span class="dim" style="font-size:var(--fs-small)">点击播放开始单步追踪</span>';
    // 放在代码块之后、终端之前
    var term = this.panel.querySelector('[data-term]');
    this.panel.insertBefore(v, term);
    this.varsEl = v;
  };

  Player.prototype._bind = function () {
    var self = this;
    if (!this.bar) return;
    this.bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var act = btn.getAttribute('data-action');
      if (act === 'trace-play') self.togglePlay();
      else if (act === 'trace-prev') { self.pause(); self.stepTo(self.index - 1); }
      else if (act === 'trace-next') { self.pause(); self.stepTo(self.index + 1); }
    });

    var range = this.bar.querySelector('[data-action="trace-range"]');
    if (range) {
      range.addEventListener('input', function () {
        self.pause();
        self.stepTo(parseInt(range.value, 10), true);
      });
    }
  };

  Player.prototype.togglePlay = function () {
    if (this.timer) { this.pause(); return; }

    var self = this;
    if (!this.steps) {
      // 首次播放：先录制
      if (this.recording) return;
      this.recording = true;
      this._setHint('正在录制执行轨迹…');
      global.PYT.runner.recordTrace({
        code: this.spec.source,
        files: this.spec.files,
        packages: this.spec.packages
      }, {
        onTrace: function (steps) {
          self.recording = false;
          self.steps = steps || [];
          if (!self.steps.length) {
            self._setHint('这段代码没有可追踪的执行步骤。');
            return;
          }
          self._fillRange();
          self.stepTo(0);
          self.play();
        },
        onError: function (info) {
          self.recording = false;
          self._setHint(info.text === 'TIMEOUT'
            ? '录制超时，可能是死循环。'
            : '无法追踪：' + (info.text || '未知错误'));
        }
      });
      return;
    }

    if (this.index >= this.steps.length - 1) this.stepTo(0);
    this.play();
  };

  Player.prototype.play = function () {
    var self = this;
    this.pause();
    this._setPlayIcon(true);
    this.timer = setInterval(function () {
      if (self.index >= self.steps.length - 1) { self.pause(); return; }
      self.stepTo(self.index + 1);
    }, PLAY_INTERVAL);
  };

  Player.prototype.pause = function () {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this._setPlayIcon(false);
  };

  Player.prototype._setPlayIcon = function (playing) {
    if (!this.bar) return;
    var btn = this.bar.querySelector('[data-action="trace-play"]');
    if (btn) {
      btn.innerHTML = global.PYT.icons.get(playing ? 'pause' : 'play');
      btn.setAttribute('aria-label', playing ? '暂停' : '播放');
    }
  };

  Player.prototype.stepTo = function (i, fromRange) {
    if (!this.steps || !this.steps.length) return;
    i = Math.max(0, Math.min(this.steps.length - 1, i));
    this.index = i;

    var step = this.steps[i];
    var line = step[0];
    var vars = step[1] || {};

    global.PYT.code.highlightLine(this.block, line);
    this._renderVars(vars, i > 0 ? (this.steps[i - 1][1] || {}) : {});

    var counter = this.bar && this.bar.querySelector('[data-trace-step]');
    if (counter) counter.textContent = (i + 1) + ' / ' + this.steps.length;

    var range = this.bar && this.bar.querySelector('[data-action="trace-range"]');
    if (range && !fromRange) range.value = String(i);

    // 让高亮行保持在可视区域
    var hot = this.block && this.block.querySelector('.code-line.is-hot');
    if (hot && hot.scrollIntoView) {
      hot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  Player.prototype._renderVars = function (vars, prev) {
    if (!this.varsEl) return;
    var keys = Object.keys(vars);
    if (!keys.length) {
      this.varsEl.innerHTML = '<span class="dim" style="font-size:var(--fs-small)">（此刻还没有变量）</span>';
      return;
    }
    var frag = document.createDocumentFragment();
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var row = document.createElement('span');
      row.className = 'trace-var';
      if (prev[k] !== vars[k]) row.classList.add('is-changed');

      var name = document.createElement('span');
      name.className = 'trace-var-name';
      name.textContent = k;

      var eq = document.createElement('span');
      eq.className = 'trace-var-eq';
      eq.textContent = '=';

      var val = document.createElement('span');
      val.className = 'trace-var-val';
      val.textContent = vars[k];

      row.appendChild(name);
      row.appendChild(eq);
      row.appendChild(val);
      frag.appendChild(row);
    }
    this.varsEl.replaceChildren(frag);
  };

  Player.prototype._fillRange = function () {
    var range = this.bar && this.bar.querySelector('[data-action="trace-range"]');
    if (range) {
      range.max = String(Math.max(0, this.steps.length - 1));
      range.value = '0';
    }
    var counter = this.bar && this.bar.querySelector('[data-trace-step]');
    if (counter) counter.textContent = '0 / ' + this.steps.length;
  };

  Player.prototype._setHint = function (text) {
    if (!this.varsEl) return;
    this.varsEl.innerHTML = '';
    var s = document.createElement('span');
    s.className = 'dim';
    s.style.fontSize = 'var(--fs-small)';
    s.textContent = text;
    this.varsEl.appendChild(s);
  };

  /** 离开页面时停止播放，避免后台继续跑定时器 */
  Player.prototype.stop = function () {
    this.pause();
    if (this.block) global.PYT.code.highlightLine(this.block, 0);
  };

  /* ============================================================
     对外接口
     ============================================================ */
  var trace = {
    attach: function (panel) {
      if (!panel || panel._player) return panel && panel._player;
      if (!panel.querySelector('[data-trace]')) return null;
      panel._player = new Player(panel);
      return panel._player;
    },
    stop: function (panel) {
      if (panel && panel._player) panel._player.stop();
    }
  };

  global.PYT = global.PYT || {};
  global.PYT.trace = trace;
})(window);
