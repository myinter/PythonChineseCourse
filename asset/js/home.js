/* ============================================================
   课程首页逻辑
   ============================================================ */
(function (global) {
  'use strict';

  var PYT = global.PYT;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderChapters() {
    var grid = document.getElementById('chapter-grid');
    var progress = PYT.mode.all();
    var frag = document.createDocumentFragment();

    PYT.manifest.forEach(function (ch, i) {
      var a = document.createElement('a');
      a.className = 'ch-card';
      a.href = 'chapter.html?ch=' + ch.num;
      a.style.animationDelay = (i * 60) + 'ms';

      var top = el('div', 'ch-top');
      var ic = el('div', 'ch-icon');
      ic.innerHTML = PYT.icons.get(ch.icon);
      top.appendChild(ic);
      var meta = el('div');
      meta.appendChild(el('div', 'ch-num', '第 ' + ch.num + ' 章'));
      meta.appendChild(el('div', 'ch-name', ch.title));
      meta.appendChild(el('div', 'ch-sub', ch.subtitle));
      top.appendChild(meta);
      a.appendChild(top);

      a.appendChild(el('div', 'ch-desc', ch.desc));

      var topics = el('div', 'ch-topics');
      ch.topics.forEach(function (t) {
        topics.appendChild(el('span', 'ch-topic', t));
      });
      a.appendChild(topics);

      // 自学模式才显示进度
      var rec = progress['ch' + ch.num];
      if (rec && typeof rec.slide === 'number' && PYT.mode.current() !== 'teach') {
        var pct = ch.slides > 1 ? (rec.slide / (ch.slides - 1)) : 1;
        var row = el('div', 'ch-progress');
        row.appendChild(el('span', null, '已看到 ' + (rec.slide + 1) + ' / ' + ch.slides + ' 页'));
        var bar = el('div', 'ch-bar');
        var fill = el('div', 'ch-bar-fill');
        fill.style.setProperty('--p', String(Math.max(0.02, Math.min(1, pct))));
        bar.appendChild(fill);
        row.appendChild(bar);
        a.appendChild(row);
      }

      frag.appendChild(a);
    });
    grid.replaceChildren(frag);
  }

  function renderContinue() {
    // 找出最近看过的章节，作为"继续上次进度"入口
    var prog = PYT.mode.all();
    var best = null;
    Object.keys(prog).forEach(function (k) {
      var r = prog[k];
      if (r && (!best || (r.at || 0) > (best.at || 0))) best = r;
      if (r && best && r === best) best.ch = k;
    });
    if (!best) return;

    var num = parseInt(String(best.ch).replace('ch', ''), 10);
    var ch = PYT.getChapter(num);
    if (!ch) return;

    var btn = document.getElementById('cta-continue');
    var start = document.getElementById('cta-start');
    btn.hidden = false;
    btn.addEventListener('click', function () {
      location.href = 'chapter.html?ch=' + num + '#/' + (best.slide + 1);
    });
    start.href = 'chapter.html?ch=1';
    start.querySelector('span').textContent = '从第一章开始';

    var meta = document.getElementById('hero-meta');
    meta.textContent = '上次学到：第 ' + num + ' 章「' + ch.title + '」第 ' + (best.slide + 1) + ' 页';
  }

  function showFileWarning() {
    if (location.protocol !== 'file:') return;
    var host = document.getElementById('file-warning');
    if (!host) return;
    var box = el('div', 'file-warn');
    var ic = el('span');
    ic.innerHTML = PYT.icons.get('alert');
    box.appendChild(ic);
    var body = el('div');

    var t = el('strong', null, '提示：代码运行功能需要本地服务器');
    body.appendChild(t);
    body.appendChild(el('br'));
    body.appendChild(document.createTextNode(
      '你现在是直接打开文件（file://），幻灯片、动画、讲解都可以正常看，但「运行」按钮不可用。'
    ));
    body.appendChild(el('br'));
    body.appendChild(document.createTextNode('在 web 目录下执行 '));
    var c = el('code', null, 'python3 serve.py');
    body.appendChild(c);
    body.appendChild(document.createTextNode(' 然后访问 http://localhost:8000 即可运行代码。'));
    box.appendChild(body);
    host.appendChild(box);
  }

  function boot() {
    PYT.theme.init();
    PYT.mode.init();

    document.getElementById('brand-icon').innerHTML = PYT.icons.get('python');

    renderChapters();
    renderContinue();
    showFileWarning();

    var total = PYT.manifest.reduce(function (n, c) { return n + c.slides; }, 0);
    document.getElementById('hero-meta').textContent =
      document.getElementById('hero-meta').textContent ||
      ('共 ' + PYT.manifest.length + ' 章 · ' + total + ' 页 · 全部带讲师讲解');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
