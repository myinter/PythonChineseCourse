/* ============================================================
   双模式：课堂讲授 / 课后自学

   同一套内容，两种界面重心：
   - 讲授：字号放大一档，讲解收进侧边抽屉（讲师看得到、学员看不到），
           隐藏进度等次要 chrome，界面极简。
   - 自学：讲解直接展开在页面内作为正文，显示进度，记录学到哪。
   ============================================================ */
(function (global) {
  'use strict';

  var MODE_KEY = 'pyt.mode';
  var PROG_KEY = 'pyt.progress';

  function read(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { /* 隐私模式 */ }
  }

  var mode = {
    init: function () {
      var m = read(MODE_KEY, 'self');
      this.apply(m);
    },

    current: function () {
      return document.documentElement.getAttribute('data-mode') || 'self';
    },

    apply: function (m) {
      document.documentElement.setAttribute('data-mode', m);
      // 讲授模式整体放大一档字号，方便后排看清
      document.documentElement.style.setProperty('--scale-mode', m === 'teach' ? '1.14' : '1');
      updateButton(m);
      // 讲授模式下讲解默认收起
      if (m === 'teach' && global.PYT.deck) {
        global.PYT.deck.toggleDrawer(false);
      }
    },

    toggle: function () {
      var next = this.current() === 'teach' ? 'self' : 'teach';
      write(MODE_KEY, next);
      this.apply(next);
      if (global.PYT.deck) {
        global.PYT.deck.toast(next === 'teach' ? '已切换到课堂讲授模式' : '已切换到课后自学模式');
      }
      return next;
    },

    /* ---------- 学习进度（仅自学模式记录）---------- */

    record: function (chapterNum, slideIndex) {
      if (this.current() === 'teach') return;
      var prog = this.all();
      var key = 'ch' + chapterNum;
      var prev = prog[key];
      // 只往前推进，避免来回翻页把进度改小
      if (!prev || slideIndex > prev.slide) {
        prog[key] = { slide: slideIndex, at: Date.now() };
        write(PROG_KEY, JSON.stringify(prog));
      }
    },

    all: function () {
      try { return JSON.parse(read(PROG_KEY, '{}')) || {}; }
      catch (e) { return {}; }
    },

    /** 取某章的续读位置，没有则返回 0 */
    resume: function (chapterNum) {
      var p = this.all()['ch' + chapterNum];
      return p && typeof p.slide === 'number' ? p.slide : 0;
    },

    clear: function () {
      write(PROG_KEY, '{}');
    }
  };

  function updateButton(m) {
    var btns = document.querySelectorAll('[data-act="mode"]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('is-on', m === 'teach');
      btns[i].innerHTML = global.PYT.icons.get(m === 'teach' ? 'presentation' : 'book');
      btns[i].setAttribute('title', m === 'teach' ? '课堂讲授模式（点击切到自学）' : '课后自学模式（点击切到讲授）');
      btns[i].setAttribute('aria-label', btns[i].title);
    }
  }

  global.PYT = global.PYT || {};
  global.PYT.mode = mode;
})(window);
