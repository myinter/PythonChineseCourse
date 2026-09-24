/* ============================================================
   明暗主题
   默认跟随系统偏好；用户手动切换后记住选择。
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'pyt.theme';
  var mq = global.matchMedia ? matchMedia('(prefers-color-scheme: light)') : null;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function systemTheme() {
    return (mq && mq.matches) ? 'light' : 'dark';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    // 同步浏览器 UI 配色（移动端地址栏）
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme === 'light' ? '#ffffff' : '#0a0e14';
    updateButton(theme);
  }

  function updateButton(theme) {
    var btns = document.querySelectorAll('[data-act="theme"]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].innerHTML = global.PYT.icons.get(theme === 'light' ? 'moon' : 'sun');
      btns[i].setAttribute('title', theme === 'light' ? '切换到深色' : '切换到浅色');
      btns[i].setAttribute('aria-label', btns[i].title);
    }
  }

  function current() {
    return document.documentElement.getAttribute('data-theme') || systemTheme();
  }

  var theme = {
    init: function () {
      apply(stored() || systemTheme());
      // 用户没手动选过时，跟随系统变化
      if (mq && mq.addEventListener) {
        mq.addEventListener('change', function () {
          if (!stored()) apply(systemTheme());
        });
      }
    },
    toggle: function () {
      var next = current() === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(KEY, next); } catch (e) { /* 隐私模式 */ }
      apply(next);
      return next;
    },
    current: current
  };

  global.PYT = global.PYT || {};
  global.PYT.theme = theme;
})(window);
