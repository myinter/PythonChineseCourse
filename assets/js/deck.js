/* ============================================================
   翻页引擎

   关键设计：
   1. 用 Web Animations API 而非 CSS transition —— CSS transition 无法
      干净地中途取消，快速连按方向键会动画打架。WAAPI 有 cancel/commitStyles。
   2. latest-wins 令牌：新导航先"落定"进行中的过渡（定格到终态），
      再从头开始新的过渡，因此连按表现为快速响应而非错乱。
   3. 幻灯片虚拟化：87 页不全部建 DOM，只保留当前页与相邻页，
      按 type 回收复用，避免合成层堆积耗尽 GPU 显存。
   4. 只动 transform / opacity；进度条用 scaleX 而非 width（不触发重排）。
   ============================================================ */
(function (global) {
  'use strict';

  var REDUCE_MQ = global.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;

  function Deck(opts) {
    this.slides = opts.slides || [];
    this.mount = opts.mount;
    this.chapter = opts.chapter || {};
    this.onEnter = opts.onEnter || function () {};
    this.onLeave = opts.onLeave || function () {};

    this.cur = -1;
    this.live = new Map();     // index -> DOM 节点
    this.token = 0;            // latest-wins 令牌
    this.inFlight = [];        // 进行中的动画记录
    this.pendingEnter = null;
    this.reduced = REDUCE_MQ ? REDUCE_MQ.matches : false;

    var self = this;
    if (REDUCE_MQ && REDUCE_MQ.addEventListener) {
      REDUCE_MQ.addEventListener('change', function (e) { self.reduced = e.matches; });
    }

    this._buildChrome();
    this._bindInput();

    // 后台标签页暂停动画，避免白烧 GPU
    document.addEventListener('visibilitychange', function () {
      document.body.classList.toggle('is-backgrounded', document.hidden);
    });
  }

  /* ============================================================
     初始化与骨架
     ============================================================ */

  Deck.prototype._buildChrome = function () {
    var self = this;

    // 顶栏
    var chrome = document.createElement('header');
    chrome.className = 'chrome';
    chrome.innerHTML =
      '<div class="chrome-left">' +
        '<a class="chrome-link" href="index.html" title="返回目录">' + PYT.icons.get('chevronL') + '<span>目录</span></a>' +
        '<span class="chrome-chapter" data-chapter-name></span>' +
      '</div>' +
      '<div class="chrome-right">' +
        '<span class="page-counter"><b data-counter-cur>1</b> / <span data-counter-all>1</span></span>' +
        '<button class="icon-btn" data-act="notes" type="button" title="讲师讲解 (S)" aria-label="讲师讲解">' + PYT.icons.get('notes') + '</button>' +
        '<button class="icon-btn" data-act="overview" type="button" title="总览 (O)" aria-label="总览">' + PYT.icons.get('grid') + '</button>' +
        '<button class="icon-btn" data-act="mode" type="button" title="讲授/自学模式" aria-label="切换模式">' + PYT.icons.get('presentation') + '</button>' +
        '<button class="icon-btn" data-act="theme" type="button" title="明暗主题" aria-label="切换主题">' + PYT.icons.get('moon') + '</button>' +
        '<button class="icon-btn" data-act="fullscreen" type="button" title="全屏 (F)" aria-label="全屏">' + PYT.icons.get('target') + '</button>' +
      '</div>';
    document.body.appendChild(chrome);
    this.chrome = chrome;

    var nameEl = chrome.querySelector('[data-chapter-name]');
    nameEl.textContent = this.chapter.title || '';

    // 进度条
    var prog = document.createElement('div');
    prog.className = 'progress';
    prog.innerHTML = '<div class="progress-fill"></div>';
    document.body.appendChild(prog);
    this.progressFill = prog.firstChild;

    // 左右热区
    var self2 = this;
    ['prev', 'next'].forEach(function (dir) {
      var z = document.createElement('button');
      z.type = 'button';
      z.className = 'nav-zone ' + dir;
      z.setAttribute('aria-label', dir === 'prev' ? '上一页' : '下一页');
      z.innerHTML = PYT.icons.get(dir === 'prev' ? 'chevronL' : 'chevronR');
      z.addEventListener('click', function () {
        dir === 'prev' ? self2.prev() : self2.next();
      });
      document.body.appendChild(z);
    });
    this.navPrev = document.querySelector('.nav-zone.prev');
    this.navNext = document.querySelector('.nav-zone.next');

    // Toast 容器
    var toastHost = document.createElement('div');
    toastHost.className = 'toast-host';
    document.body.appendChild(toastHost);
    this.toastHost = toastHost;

    // 讲解抽屉
    var scrim = document.createElement('div');
    scrim.className = 'scrim';
    document.body.appendChild(scrim);
    this.scrim = scrim;

    var drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.innerHTML =
      '<div class="drawer-head">' +
        '<span class="drawer-title">讲师讲解</span>' +
        '<button class="icon-btn" data-act="notes-close" type="button" aria-label="关闭" style="margin-left:auto">' + PYT.icons.get('close') + '</button>' +
      '</div>' +
      '<div class="drawer-body" data-drawer-body></div>';
    document.body.appendChild(drawer);
    this.drawer = drawer;
    this.drawerBody = drawer.querySelector('[data-drawer-body]');

    // 总览
    var ov = document.createElement('div');
    ov.className = 'overview';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', '幻灯片总览');
    ov.innerHTML =
      '<div class="overview-head">' +
        '<h2 class="overview-title">' + (this.chapter.title || '总览') + '</h2>' +
        '<span class="muted" style="font-size:var(--fs-small)">' + this.slides.length + ' 页</span>' +
        '<button class="icon-btn" data-act="overview-close" type="button" aria-label="关闭" style="margin-left:auto">' + PYT.icons.get('close') + '</button>' +
      '</div>' +
      '<div class="overview-grid" data-ov-grid></div>';
    document.body.appendChild(ov);
    this.overview = ov;

    this._buildOverviewGrid();

    // 顶栏按钮事件
    chrome.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'overview') self2.toggleOverview(true);
      else if (act === 'notes') self2.toggleDrawer();
      else if (act === 'fullscreen') self2.toggleFullscreen();
      else if (act === 'theme') global.PYT.theme && PYT.theme.toggle();
      else if (act === 'mode') global.PYT.mode && PYT.mode.toggle();
    });

    drawer.addEventListener('click', function (e) {
      if (e.target.closest('[data-act="notes-close"]')) self2.toggleDrawer(false);
    });
    scrim.addEventListener('click', function () { self2.toggleDrawer(false); });

    ov.addEventListener('click', function (e) {
      if (e.target.closest('[data-act="overview-close"]')) { self2.toggleOverview(false); return; }
      var item = e.target.closest('[data-ov-index]');
      if (item) {
        self2.toggleOverview(false);
        self2.go(parseInt(item.getAttribute('data-ov-index'), 10), { history: 'push' });
      }
    });

    // 顶栏空闲自动隐藏
    this._idleTimer = null;
    var showChrome = function () {
      chrome.classList.remove('is-hidden');
      clearTimeout(self2._idleTimer);
      self2._idleTimer = setTimeout(function () {
        if (!self2.overview.classList.contains('is-open')) chrome.classList.add('is-hidden');
      }, 3200);
    };
    document.addEventListener('mousemove', showChrome);
    document.addEventListener('focusin', showChrome);
    showChrome();
  };

  Deck.prototype._buildOverviewGrid = function () {
    var grid = this.overview.querySelector('[data-ov-grid]');
    var html = [];
    for (var i = 0; i < this.slides.length; i++) {
      var s = this.slides[i];
      var t = s.title || s.heading || (s.type === 'title' ? '封面' : '第 ' + (i + 1) + ' 页');
      html.push(
        '<button class="ov-item" type="button" data-ov-index="' + i + '">' +
          '<span class="ov-num">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="ov-title">' + PYT.code.escape(t) + '</span>' +
          '<span class="ov-type">' + (s.type || 'cards') + '</span>' +
        '</button>'
      );
    }
    grid.innerHTML = html.join('');
    this.ovItems = grid.querySelectorAll('.ov-item');
  };

  /* ============================================================
     虚拟化：只为当前页与相邻页建 DOM
     ============================================================ */

  Deck.prototype._ensure = function (i) {
    if (i < 0 || i >= this.slides.length) return null;
    var node = this.live.get(i);
    if (node) return node;

    node = PYT.render.slide(this.slides[i], i);
    this.live.set(i, node);
    this.mount.appendChild(node);
    return node;
  };

  Deck.prototype._prune = function (center) {
    var self = this;
    this.live.forEach(function (node, i) {
      if (Math.abs(i - center) > 1) {
        node.remove();
        self.live.delete(i);
      }
    });
  };

  /* ============================================================
     过渡
     ============================================================ */

  /** 把进行中的过渡立即定格到终态，清理残留 */
  Deck.prototype._settle = function () {
    // 1) 硬定格进行中的动画（commitStyles 会写入等价的 inline 样式，避免闪回）
    for (var i = 0; i < this.inFlight.length; i++) {
      try {
        this.inFlight[i].anim.commitStyles();
        this.inFlight[i].anim.cancel();
      } catch (e) { /* 已被取消，忽略 */ }
    }
    this.inFlight = [];

    var target = this.pendingEnter;
    this.pendingEnter = null;

    // 2) 所有页先恢复到"干净"状态
    this.live.forEach(function (node) {
      node.classList.remove('is-active', 'is-leaving', 'is-animating');
      node.style.transform = '';
      node.style.opacity = '';
      node.style.zIndex = '';
    });

    // 3) 只让在飞的目标页保持可见，并把逻辑位置推进到它 ——
    //    这样被中断后视觉状态与 this.cur 始终一致，不会出现两页同时可见
    if (target != null) {
      var node = this.live.get(target);
      if (node) {
        node.classList.add('is-active', 'is-settled');
        this.cur = target;
      }
    }
  };

  /** 核心：跳转到 target。dir>0 前进，dir<0 后退 */
  Deck.prototype.go = function (target, opts) {
    opts = opts || {};
    var n = this.slides.length;
    if (target < 0 || target >= n) return;

    // 1) 先落定进行中的过渡。这一步可能把 this.cur 推进到在飞的目标页，
    //    因此 prev 必须在落定之后才能取。
    var wasAnimating = this.inFlight.length > 0;
    this._settle();

    var prev = this.cur;
    if (target === prev) return;         // 已经在该页

    var dir = opts.dir != null ? opts.dir : (target > prev ? 1 : -1);
    var my = ++this.token;

    // 2) 建/取目标页
    var toNode = this._ensure(target);
    var fromNode = prev >= 0 ? this.live.get(prev) : null;

    // 离开当前页前的清理（如停止追踪播放）
    if (fromNode && fromNode._cleanup) fromNode._cleanup();

    // 3) 先挂载并强制一次样式计算，确保入场动画从第一帧开始
    if (!toNode.parentNode) this.mount.appendChild(toNode);
    void toNode.offsetWidth;

    this.cur = target;
    this.pendingEnter = target;

    var self = this;
    var done = false;
    var finish = function () {
      if (done) return;                // Promise 与兜底定时器可能都触发，只收尾一次
      done = true;
      if (my !== self.token) return;   // 已被更新的导航取代，交给它收尾
      var settled = self.cur;
      self._settle();
      self.onEnter(self.slides[settled], settled, self.live.get(settled));
      self._prune(settled);
      self._updateChrome();
      self._updateHash(opts.history);
    };

    // 内容少的页面无需动画（例如快速连按时只做最短过渡）
    var reduce = this.reduced;
    var dur = reduce ? 90 : (wasAnimating ? 200 : 380);
    var ease = reduce ? 'linear' : 'cubic-bezier(0.22, 0.61, 0.36, 1)';

    if (fromNode && fromNode !== toNode) {
      toNode.classList.add('is-active', 'is-animating');
      toNode.style.zIndex = '2';
      fromNode.classList.add('is-leaving', 'is-animating');
      fromNode.style.zIndex = '1';

      var dx = dir > 0 ? 1 : -1;
      var aIn = toNode.animate(
        reduce
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [{ transform: 'translate3d(' + (dx * 100) + '%,0,0)', opacity: 0.25 },
             { transform: 'translate3d(0,0,0)', opacity: 1 }],
        { duration: dur, easing: ease, fill: 'both' }
      );
      // 离开页只平移 30%，形成轻微的视差感，比整页飞出更利落
      var aOut = fromNode.animate(
        reduce
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [{ transform: 'translate3d(0,0,0)', opacity: 1 },
             { transform: 'translate3d(' + (-dx * 30) + '%,0,0)', opacity: 0 }],
        { duration: dur, easing: ease, fill: 'both' }
      );
      this.inFlight = [{ anim: aIn, node: toNode }, { anim: aOut, node: fromNode }];

      // finish 自带幂等与令牌双重保护，两条路径谁先到都行
      Promise.allSettled([aIn.finished, aOut.finished]).then(finish);
      // 兜底：标签页切到后台时 finished 可能不触发，定时器保证一定收尾
      setTimeout(finish, dur + 140);
    } else {
      toNode.classList.add('is-active', 'is-animating');
      finish();
    }
  };

  Deck.prototype.next = function () { this.go(this.cur + 1); };
  Deck.prototype.prev = function () { this.go(this.cur - 1); };

  /* ============================================================
     输入
     ============================================================ */

  Deck.prototype._bindInput = function () {
    var self = this;

    document.addEventListener('keydown', function (e) {
      // 在输入框里打字时不拦截按键
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'textarea' || tag === 'input' || e.target.isContentEditable) {
        if (e.key === 'Escape') e.target.blur();
        return;
      }

      if (self.overview.classList.contains('is-open')) {
        if (e.key === 'Escape' || e.key === 'o' || e.key === 'O') { self.toggleOverview(false); e.preventDefault(); }
        return;
      }

      switch (e.key) {
        case 'ArrowRight': case 'PageDown': case ' ': case 'Spacebar':
          self.next(); e.preventDefault(); break;
        case 'ArrowLeft': case 'PageUp':
          self.prev(); e.preventDefault(); break;
        case 'Home': self.go(0, { history: 'push' }); e.preventDefault(); break;
        case 'End': self.go(self.slides.length - 1, { history: 'push' }); e.preventDefault(); break;
        case 'ArrowDown': case 'ArrowUp':
          // 页面内可滚动时交给浏览器，否则翻页
          if (!self._canScroll(e.key === 'ArrowDown' ? 1 : -1)) {
            e.key === 'ArrowDown' ? self.next() : self.prev();
            e.preventDefault();
          }
          break;
        case 'o': case 'O': self.toggleOverview(true); e.preventDefault(); break;
        case 's': case 'S': self.toggleDrawer(); e.preventDefault(); break;
        case 'f': case 'F': self.toggleFullscreen(); e.preventDefault(); break;
        case 'Escape':
          if (self.drawer.classList.contains('is-open')) self.toggleDrawer(false);
          break;
      }
    });

    // 触屏滑动
    var sx = 0, sy = 0, tracking = false;
    var mount = this.mount;
    mount.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });

    mount.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      // 横向位移足够大、且明显大于纵向位移，才判定为翻页
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        dx < 0 ? self.next() : self.prev();
      }
    }, { passive: true });

    // 滚轮翻页（节流，避免一次滚动连翻多页）
    var wheelLock = false, wheelAcc = 0;
    mount.addEventListener('wheel', function (e) {
      // 页面内容可滚动时优先让内容滚
      var target = e.target.closest('.slide');
      if (target && target.scrollHeight > target.clientHeight + 4) {
        var atTop = target.scrollTop <= 0;
        var atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 2;
        if (!(e.deltaY > 0 && atBottom) && !(e.deltaY < 0 && atTop)) return;
      }
      if (wheelLock) return;
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) < 60) return;
      wheelLock = true;
      wheelAcc > 0 ? self.next() : self.prev();
      wheelAcc = 0;
      setTimeout(function () { wheelLock = false; }, 520);
    }, { passive: true });
  };

  /** 当前页是否还能继续纵向滚动 */
  Deck.prototype._canScroll = function (dir) {
    var node = this.live.get(this.cur);
    if (!node) return false;
    if (node.scrollHeight <= node.clientHeight + 4) return false;
    if (dir > 0) return node.scrollTop + node.clientHeight < node.scrollHeight - 2;
    return node.scrollTop > 0;
  };

  /* ============================================================
     界面状态
     ============================================================ */

  Deck.prototype._updateChrome = function () {
    var cur = this.cur, n = this.slides.length;
    var c = this.chrome.querySelector('[data-counter-cur]');
    var a = this.chrome.querySelector('[data-counter-all]');
    if (c) c.textContent = String(cur + 1);
    if (a) a.textContent = String(n);
    if (this.progressFill) {
      var p = n > 1 ? cur / (n - 1) : 1;
      this.progressFill.style.setProperty('--p', String(p));
    }
    this.navPrev.disabled = cur <= 0;
    this.navNext.disabled = cur >= n - 1;

    if (this.ovItems) {
      for (var i = 0; i < this.ovItems.length; i++) {
        this.ovItems[i].classList.toggle('is-current', i === cur);
      }
    }

    // 更新讲解抽屉内容
    var spec = this.slides[cur] || {};
    var notes = spec.notes;
    if (notes) {
      this.drawerBody.classList.remove('drawer-empty');
      this.drawerBody.textContent = notes;
    } else {
      this.drawerBody.classList.add('drawer-empty');
      this.drawerBody.textContent = '本页没有讲师讲解。';
    }

    if (global.PYT.mode && PYT.mode.record) PYT.mode.record(this.chapter.num, cur);
  };

  /** 连续翻页用 replaceState（不污染历史），跳转才 push */
  Deck.prototype._updateHash = function (mode) {
    var h = '#/' + (this.cur + 1);
    try {
      if (mode === 'push') location.hash = h;
      else history.replaceState(null, '', h);
    } catch (e) { /* file:// 或沙箱环境下降级 */ }
  };

  Deck.prototype.toggleDrawer = function (force) {
    var open = force != null ? force : !this.drawer.classList.contains('is-open');
    this.drawer.classList.toggle('is-open', open);
    this.scrim.classList.toggle('is-open', open);
    if (open) this.drawer.querySelector('[data-act="notes-close"]').focus();
    else this.drawerBody.parentNode.scrollTop = 0;
  };

  Deck.prototype.toggleOverview = function (force) {
    var open = force != null ? force : !this.overview.classList.contains('is-open');
    this.overview.classList.toggle('is-open', open);
    if (open) {
      var cur = this.overview.querySelector('.ov-item.is-current');
      if (cur) cur.focus();
    }
  };

  Deck.prototype.toggleFullscreen = function () {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch (e) { /* 某些环境不允许 */ }
  };

  Deck.prototype.toast = function (msg, kind) {
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' is-' + kind : '');
    t.textContent = msg;
    this.toastHost.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .3s';
      t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 320);
    }, 2600);
  };

  /* ============================================================
     启动
     ============================================================ */

  /**
   * 安排"落定"标记。只在入场动画播完之后才加 is-settled ——
   * 它同时承担两个职责：释放 will-change 合成层，以及兜底保证内容可见。
   * 若加得太早，会盖掉入场动画；若不加，动画异常时页面会一片空白。
   */
  Deck.prototype._scheduleSettled = function (node) {
    if (!node) return;
    clearTimeout(node._settleTimer);
    var wait = this.reduced ? 120 : 1500;   // 覆盖最长动画延迟 + 时长
    node._settleTimer = setTimeout(function () {
      node.classList.add('is-settled');
    }, wait);
  };

  Deck.prototype.start = function (startAt) {
    var n = this.slides.length;
    var i = Math.max(0, Math.min(n - 1, startAt || 0));

    this.cur = -1;
    var node = this._ensure(i);

    // 强制一次样式计算，确保首屏的入场动画从第一帧开始播
    void node.offsetWidth;
    node.classList.add('is-active');
    this._scheduleSettled(node);

    this.cur = i;
    this._prune(i);
    this._updateChrome();
    this._updateHash();
    this.onEnter(this.slides[i], i, node);
    return this;
  };

  /** 从 URL 哈希解析起始页 */
  Deck.parseHash = function (total) {
    var m = /^#\/?(\d+)/.exec(location.hash || '');
    if (!m) return 0;
    var i = parseInt(m[1], 10) - 1;
    return (i >= 0 && i < total) ? i : 0;
  };

  global.PYT = global.PYT || {};
  global.PYT.Deck = Deck;
})(window);
