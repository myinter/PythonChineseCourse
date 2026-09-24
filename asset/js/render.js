/* ============================================================
   幻灯片渲染器：数据 → DOM
   纯函数式（同样的数据产出同样的结构），便于翻页引擎按 type 回收复用 DOM。
   所有文本走 textContent，只有自己控制的图标用 innerHTML。
   ============================================================ */
(function (global) {
  'use strict';

  var ICON = global.PYT.icons.get;

  /* ---------- DOM 小工具 ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function frag() { return document.createDocumentFragment(); }

  /**
   * 渲染正文的轻量标记：`内联代码` 与 **加粗**，其余按纯文本处理。
   *
   * 刻意只支持这两种，且在数据里写标记而不是 HTML —— 这样数据文件
   * 保持可读可 diff，同时不存在把内容当 HTML 注入的风险。
   */
  var INLINE_RE = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g;

  function richText(container, text) {
    var parts = String(text).split(INLINE_RE);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p) continue;
      var len = p.length;
      if (len > 2 && p.charAt(0) === '`' && p.charAt(len - 1) === '`') {
        container.appendChild(el('code', null, p.slice(1, -1)));
      } else if (len > 4 && p.slice(0, 2) === '**' && p.slice(-2) === '**') {
        // 递归处理内层，这样 **`else`** 会渲染成「加粗的代码小块」
        // 而不是把反引号原样吐出来
        var strong = el('strong');
        richText(strong, p.slice(2, -2));
        container.appendChild(strong);
      } else {
        container.appendChild(document.createTextNode(p));
      }
    }
    return container;
  }

  /** 逐级添加入场动画标记：--i 控制错峰 */
  function anim(node, kind, i) {
    node.setAttribute('data-anim', kind || 'rise');
    node.style.setProperty('--i', String(i || 0));
    return node;
  }

  /* ============================================================
     各类型的渲染函数
     每个函数返回一个 .slide-inner 的内容
     ============================================================ */

  var TYPES = {};

  /* ---- title：章封面 ---- */
  TYPES.title = function (s) {
    var inner = el('div', 'slide-inner');
    var glow = el('div', 'title-glow');
    glow.setAttribute('aria-hidden', 'true');
    inner.appendChild(glow);

    if (s.eyebrow) inner.appendChild(anim(el('div', 'title-chapter', s.eyebrow), 'fade', 0));
    inner.appendChild(anim(el('h1', 'title-main', s.title), 'scale', 1));
    inner.appendChild(anim(el('div', 'title-rule'), 'fade', 2));
    if (s.lead) inner.appendChild(anim(el('p', 'title-sub', s.lead), 'rise', 3));
    return inner;
  };

  /* ---- toc：目录 ---- */
  TYPES.toc = function (s) {
    var inner = el('div', 'slide-inner');
    inner.appendChild(anim(head(s), 'rise', 0));

    var grid = el('div', 'toc-grid');
    (s.items || []).forEach(function (it, i) {
      var card = el('div', 'toc-item');
      if (it.num) card.appendChild(el('div', 'toc-num', it.num));
      card.appendChild(el('div', 'toc-heading', it.title));
      if (it.body) card.appendChild(richText(el('div', 'toc-body'), it.body));
      grid.appendChild(anim(card, 'rise', i + 1));
    });
    inner.appendChild(grid);
    return inner;
  };

  /* ---- section：分节页 ---- */
  TYPES.section = function (s) {
    var inner = el('div', 'slide-inner');
    if (s.num) {
      var n = el('div', 'section-num', s.num);
      n.setAttribute('data-count', s.num);
      inner.appendChild(anim(n, 'left', 0));
    }
    inner.appendChild(anim(el('h2', 'section-title', s.title), 'left', 1));
    if (s.sub) inner.appendChild(anim(el('div', 'section-sub', s.sub), 'left', 2));
    if (s.lead) inner.appendChild(anim(richText(el('p', 'slide-lead'), s.lead), 'left', 3));
    return inner;
  };

  /* ---- cards：卡片组 ---- */
  TYPES.cards = function (s) {
    var inner = el('div', 'slide-inner');
    inner.appendChild(anim(head(s), 'rise', 0));

    var grid = el('div', 'cards');
    (s.cards || []).forEach(function (c, i) {
      var card = el('div', 'card');
      var h = el('div', 'card-head');
      if (c.icon) {
        var ic = el('div', 'card-icon');
        ic.innerHTML = ICON(c.icon);
        h.appendChild(ic);
      }
      if (c.heading) h.appendChild(el('div', 'card-heading', c.heading));
      card.appendChild(h);
      if (c.body) card.appendChild(richText(el('div', 'card-body'), c.body));
      grid.appendChild(anim(card, 'rise', i + 1));
    });
    inner.appendChild(grid);

    if (s.note) inner.appendChild(anim(noteBox(s.note), 'rise', (s.cards || []).length + 2));
    if (s.code) inner.appendChild(anim(codePanel(s.code, s.traceable), 'rise', (s.cards || []).length + 3));
    return inner;
  };

  /* ---- split：左讲解右代码 ---- */
  TYPES.split = function (s) {
    var inner = el('div', 'slide-inner');
    inner.appendChild(anim(head(s), 'rise', 0));

    var wrap = el('div', 'split');
    var side = el('div', 'split-side');
    var main = el('div', 'split-main');

    if (s.points) {
      var list = el('div', 'points');
      s.points.forEach(function (p, i) {
        var row = el('div', 'point');
        row.appendChild(el('div', 'point-mark'));
        var body = richText(el('div', 'point-body'), typeof p === 'string' ? p : p.text);
        if (typeof p === 'object' && p.strong) {
          body.insertBefore(el('strong', null, p.strong), body.firstChild);
        }
        row.appendChild(body);
        list.appendChild(anim(row, 'left', i + 1));
      });
      side.appendChild(list);
    }
    if (s.cards) {
      var grid = el('div', 'cards');
      s.cards.forEach(function (c, i) {
        var card = el('div', 'card');
        var h = el('div', 'card-head');
        if (c.icon) { var ic = el('div', 'card-icon'); ic.innerHTML = ICON(c.icon); h.appendChild(ic); }
        if (c.heading) h.appendChild(el('div', 'card-heading', c.heading));
        card.appendChild(h);
        if (c.body) card.appendChild(richText(el('div', 'card-body'), c.body));
        grid.appendChild(anim(card, 'left', i + 1));
      });
      side.appendChild(grid);
    }
    wrap.appendChild(side);

    if (s.code) main.appendChild(anim(codePanel(s.code, s.traceable), 'right', 1));
    if (s.note) main.appendChild(anim(noteBox(s.note), 'right', 2));
    wrap.appendChild(main);

    inner.appendChild(wrap);
    return inner;
  };

  /* ---- code：代码为主 ---- */
  TYPES.code = function (s) {
    var inner = el('div', 'slide-inner');
    inner.appendChild(anim(head(s), 'rise', 0));
    if (s.points) {
      var list = el('div', 'points');
      s.points.forEach(function (p, i) {
        var row = el('div', 'point');
        row.appendChild(el('div', 'point-mark'));
        row.appendChild(richText(el('div', 'point-body'), typeof p === 'string' ? p : p.text));
        list.appendChild(anim(row, 'rise', i + 1));
      });
      inner.appendChild(list);
    }
    if (s.code) inner.appendChild(anim(codePanel(s.code, s.traceable), 'rise', 2));
    if (s.note) inner.appendChild(anim(noteBox(s.note), 'rise', 3));
    return inner;
  };

  /* ---- compare：对比表格 / 左右对照 ---- */
  TYPES.compare = function (s) {
    var inner = el('div', 'slide-inner');
    inner.appendChild(anim(head(s), 'rise', 0));

    if (s.versus) {
      var v = el('div', 'versus');
      ['a', 'b'].forEach(function (k, ki) {
        var col = s.versus[k];
        if (!col) return;
        var box = el('div', 'versus-col is-' + k);
        var h = el('h4');
        if (col.icon) { var ic = el('span'); ic.innerHTML = ICON(col.icon); h.appendChild(ic); }
        h.appendChild(document.createTextNode(col.title));
        box.appendChild(h);
        var list = el('div', 'points');
        (col.items || []).forEach(function (t) {
          var row = el('div', 'point');
          row.appendChild(el('div', 'point-mark'));
          row.appendChild(richText(el('div', 'point-body'), t));
          list.appendChild(row);
        });
        box.appendChild(list);
        v.appendChild(anim(box, ki === 0 ? 'left' : 'right', ki + 1));
        if (ki === 0) v.appendChild(anim(el('div', 'versus-divider', 'VS'), 'fade', 2));
      });
      inner.appendChild(v);
    }

    if (s.table) {
      var wrap = el('div', 'compare-wrap');
      var tbl = el('table', 'compare');
      if (s.table.head) {
        var thead = el('thead');
        var tr = el('tr');
        s.table.head.forEach(function (h) { tr.appendChild(el('th', null, h)); });
        thead.appendChild(tr);
        tbl.appendChild(thead);
      }
      var tbody = el('tbody');
      (s.table.rows || []).forEach(function (row, ri) {
        var tr = el('tr');
        tr.style.setProperty('--i', String(ri + 1));
        row.forEach(function (cell, ci) {
          var td = el('td');
          richText(td, cell);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      wrap.appendChild(tbl);
      inner.appendChild(anim(wrap, 'rise', 1));
    }

    if (s.note) inner.appendChild(anim(noteBox(s.note), 'rise', 2));
    return inner;
  };

  /* ---- map：知识地图（重做自第一章的思维导图）---- */
  TYPES.map = function (s) {
    var inner = el('div', 'slide-inner');
    inner.appendChild(anim(head(s), 'rise', 0));

    // 同一份数据渲染两种形态：
    //   宽屏用 SVG 思维导图（连线的视觉效果是它的价值所在）
    //   窄屏用纵向列表（780px 宽的图在 390px 屏上横向滚动体验很差，
    //   而且第一眼看到的是残缺的图）
    var wrap = el('div', 'km-wrap');
    wrap.appendChild(buildKnowledgeMap(s.map));
    inner.appendChild(anim(wrap, 'fade', 1));

    var list = el('div', 'km-list');
    buildKnowledgeList(list, s.map);
    inner.appendChild(anim(list, 'rise', 1));

    if (s.note) inner.appendChild(anim(noteBox(s.note), 'rise', 2));
    return inner;
  };

  /** 窄屏用的纵向列表形态，与 SVG 同源数据 */
  function buildKnowledgeList(host, map) {
    if (!map) return host;

    if (map.root) {
      var root = el('div', 'km-list-root');
      root.appendChild(el('div', 'km-list-root-title', map.root.title));
      if (map.root.sub) root.appendChild(el('div', 'km-list-root-sub', map.root.sub));
      host.appendChild(root);
    }

    var branches = el('div', 'km-list-branches');
    (map.branches || []).forEach(function (b) {
      var box = el('div', 'km-list-branch');
      var head = el('div', 'km-list-branch-head');
      head.appendChild(el('span', 'km-list-branch-title', b.title || ''));
      if (b.sub) head.appendChild(el('span', 'km-list-branch-sub', b.sub));
      box.appendChild(head);

      if (b.leaves && b.leaves.length) {
        var ul = el('ul', 'km-list-leaves');
        b.leaves.forEach(function (leaf) {
          var li = el('li');
          li.appendChild(el('span', 'km-list-leaf-title', leaf.title || ''));
          if (leaf.sub) li.appendChild(el('span', 'km-list-leaf-sub', leaf.sub));
          ul.appendChild(li);
        });
        box.appendChild(ul);
      }
      branches.appendChild(box);
    });
    host.appendChild(branches);
    return host;
  }

  /* ---- end：结尾页 ---- */
  TYPES.end = function (s) {
    var inner = el('div', 'slide-inner');
    var logo = el('div', 'end-logo');
    logo.innerHTML = ICON(s.icon || 'python');
    inner.appendChild(anim(logo, 'scale', 0));
    inner.appendChild(anim(el('h2', 'end-title', s.title || '感谢聆听'), 'rise', 1));
    if (s.lead) inner.appendChild(anim(el('p', 'end-sub', s.lead), 'rise', 2));

    if (s.cards) {
      var grid = el('div', 'end-cards');
      s.cards.forEach(function (c, i) {
        var card = el('div', 'card');
        var h = el('div', 'card-head');
        if (c.icon) { var ic = el('div', 'card-icon'); ic.innerHTML = ICON(c.icon); h.appendChild(ic); }
        if (c.heading) h.appendChild(el('div', 'card-heading', c.heading));
        card.appendChild(h);
        if (c.body) card.appendChild(richText(el('div', 'card-body'), c.body));
        grid.appendChild(anim(card, 'rise', i + 3));
      });
      inner.appendChild(grid);
    }
    return inner;
  };

  /* ============================================================
     共用零件
     ============================================================ */

  /** 页头：小标签 + 标题 + 引导句 */
  function head(s) {
    var h = el('div', 'slide-head');
    if (s.eyebrow) h.appendChild(el('div', 'eyebrow', s.eyebrow));
    if (s.title) h.appendChild(el('h2', 'slide-title', s.title));
    if (s.lead) h.appendChild(richText(el('p', 'slide-lead'), s.lead));
    return h;
  }

  /** 环境限制提示卡 */
  function noteBox(n) {
    var box = el('div', 'limit-note');
    var ic = el('span');
    ic.innerHTML = ICON(n.icon || 'bulb');
    box.appendChild(ic);
    var body = el('div');
    if (n.title) body.appendChild(el('strong', null, n.title));
    if (n.title && n.text) body.appendChild(document.createTextNode('　'));
    body.appendChild(richText(el('span'), n.text || n));
    box.appendChild(body);
    return box;
  }

  /**
   * 代码面板：头部（文件名 + 操作按钮）+ 代码块 + 终端输出
   * 具体行为（运行、编辑、跳过动画）由 runner.js 绑定。
   */
  function codePanel(c, traceable) {
    var panel = el('div', 'code-panel');
    if (c.shell) panel.classList.add('is-shell');

    var headEl = el('div', 'code-panel-head');
    var dots = el('div', 'code-dots');
    for (var d = 0; d < 3; d++) dots.appendChild(el('span', 'code-dot'));
    headEl.appendChild(dots);
    headEl.appendChild(el('span', 'code-file', c.file || (c.lang || 'python') + '.py'));

    var actions = el('div', 'code-panel-actions');
    actions.setAttribute('data-code-actions', '');
    headEl.appendChild(actions);
    panel.appendChild(headEl);

    // 代码块
    var block = global.PYT.code.render(c.source, { byLine: c.byLine });
    panel.appendChild(block);
    panel._codeBlock = block;

    // 操作按钮
    if (!c.shell && c.runnable !== false) {
      actions.appendChild(mkBtn('btn-run', 'play', c.runLabel || '运行', 'run'));
      if (c.editable !== false) {
        actions.appendChild(mkBtn('btn-edit', 'edit', '编辑', 'edit'));
      }
      actions.appendChild(mkBtn('btn-reset', 'reset', '还原', 'reset'));
    }
    actions.appendChild(mkBtn('btn-reveal', 'check', '显示全部', 'reveal'));

    // 单步追踪控制条：它控制的是这个代码块的执行，
    // 必须放在面板内部（既是视觉归属，也让 runner/trace 能按面板找到它）
    if (traceable) panel.appendChild(tracePlayer(c));

    // 终端输出区（运行后才显示）。
    // 用 role="log" 而非普通 aria-live：输出是逐行追加的日志，
    // log 语义下屏幕阅读器只播报新增内容，不会反复重读整块。
    var term = el('div', 'term');
    term.hidden = true;
    term.setAttribute('data-term', '');
    term.innerHTML =
      '<div class="term-head">' +
        '<span data-term-status role="status" aria-live="polite">输出</span>' +
      '</div>' +
      '<div class="term-body" data-term-body role="log" aria-label="程序输出">' +
        '<span class="term-empty">点击「运行」查看结果</span>' +
      '</div>';
    panel.appendChild(term);

    panel._spec = c;
    return panel;
  }

  function mkBtn(cls, iconName, label, action) {
    var b = el('button', 'btn ' + cls);
    b.type = 'button';
    b.setAttribute('data-action', action);
    b.innerHTML = ICON(iconName);
    b.appendChild(el('span', null, label));
    return b;
  }

  /** 单步追踪播放器（由 trace.js 接管行为） */
  function tracePlayer(spec) {
    var box = el('div', 'trace-bar');
    // 预置轨迹的兜底通道：若某段代码追踪不稳，可在数据里直接给 traceScript
    if (spec && spec.traceScript) box.setAttribute('data-trace-script', '');
    box.setAttribute('data-trace', '');
    box.innerHTML =
      '<button class="icon-btn" data-action="trace-play" type="button" aria-label="播放">' + ICON('play') + '</button>' +
      '<button class="icon-btn" data-action="trace-prev" type="button" aria-label="上一步">' + ICON('skipBack') + '</button>' +
      '<button class="icon-btn" data-action="trace-next" type="button" aria-label="下一步">' + ICON('skipFwd') + '</button>' +
      '<input class="trace-range" type="range" min="0" max="0" value="0" data-action="trace-range" aria-label="执行进度">' +
      '<span class="trace-step" data-trace-step>0 / 0</span>';
    return box;
  }

  /* ============================================================
     知识地图：SVG 布局
     root 居中在上，每个分支占一列，叶子在列内纵向排列
     ============================================================ */
  function buildKnowledgeMap(map) {
    if (!map) return el('div');

    var branches = map.branches || [];
    // 尺寸按"一屏放得下"来定：纵向过高会被视口截断，
    // 因此行高与间距都取紧凑值，配合 .km 的 max-height 一起保证完整可见
    var COL_W = 240;                 // 每列宽度
    var ROOT_W = 300, ROOT_H = 52;
    var BR_W = 200, BR_H = 48;
    var LEAF_W = 186, LEAF_H = 38, LEAF_GAP = 9;
    var PAD_X = 24, PAD_TOP = 10, PAD_BOT = 12;
    var GAP_Y1 = 42;                 // root → branch
    var GAP_Y2 = 34;                 // branch → leaves

    var maxLeaves = 0;
    branches.forEach(function (b) {
      maxLeaves = Math.max(maxLeaves, (b.leaves || []).length);
    });

    var width = Math.max(COL_W * branches.length + PAD_X * 2, ROOT_W + PAD_X * 2);
    var rootY = PAD_TOP;
    var branchY = rootY + ROOT_H + GAP_Y1;
    var leafY0 = branchY + BR_H + GAP_Y2;
    var height = leafY0 + maxLeaves * (LEAF_H + LEAF_GAP) + PAD_BOT;

    var cx = width / 2;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'km');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', map.aria || (map.root && map.root.title) || '知识地图');

    var animIdx = 0;

    // ---- 连线（先画，压在节点下方）----
    var links = document.createElementNS(svg.namespaceURI, 'g');
    var branchCenters = [];

    branches.forEach(function (b, bi) {
      var bx = PAD_X + COL_W * bi + (COL_W - BR_W) / 2;
      var bcx = bx + BR_W / 2;
      branchCenters.push(bcx);

      // root → branch：用折线，先垂直再水平再垂直，视觉更清爽
      var d = 'M' + cx + ',' + (rootY + ROOT_H) +
              ' C' + cx + ',' + (rootY + ROOT_H + GAP_Y1 * 0.6) + ' ' +
              bcx + ',' + (branchY - GAP_Y1 * 0.6) + ' ' +
              bcx + ',' + branchY;
      links.appendChild(mkLink(d, animIdx++));

      // branch → leaves
      (b.leaves || []).forEach(function (leaf, li) {
        var ly = leafY0 + li * (LEAF_H + LEAF_GAP);
        var lx = bx + (BR_W - LEAF_W) / 2;
        var lcx = lx + LEAF_W / 2;
        var dl = 'M' + bcx + ',' + (branchY + BR_H) +
                 ' C' + bcx + ',' + (branchY + BR_H + GAP_Y2 * 0.6) + ' ' +
                 lcx + ',' + (ly - GAP_Y2 * 0.6) + ' ' +
                 lcx + ',' + ly;
        links.appendChild(mkLink(dl, animIdx++));
      });
    });
    svg.appendChild(links);

    // ---- 节点 ----
    svg.appendChild(mkNode(cx - ROOT_W / 2, rootY, ROOT_W, ROOT_H,
      (map.root && map.root.title) || '', (map.root && map.root.sub) || '',
      'is-root', animIdx++, true));

    branches.forEach(function (b, bi) {
      var bx = PAD_X + COL_W * bi + (COL_W - BR_W) / 2;
      svg.appendChild(mkNode(bx, branchY, BR_W, BR_H,
        b.title || '', b.sub || '', 'is-branch', animIdx++, false));

      (b.leaves || []).forEach(function (leaf, li) {
        var ly = leafY0 + li * (LEAF_H + LEAF_GAP);
        var lx = bx + (BR_W - LEAF_W) / 2;
        svg.appendChild(mkNode(lx, ly, LEAF_W, LEAF_H,
          leaf.title || '', leaf.sub || '', 'is-leaf', animIdx++, false));
      });
    });

    return svg;
  }

  function mkLink(d, i) {
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('class', 'km-link');
    p.setAttribute('d', d);
    // pathLength=1 把路径总长归一化成 1，dasharray/dashoffset 就与真实几何无关。
    // 之前写死 --dash: 260，而 5 分支布局下曲线实际长约 486，
    // 线只画到一半就没了（第 4 章的图因此缺了两条连线）。
    p.setAttribute('pathLength', '1');
    p.style.setProperty('--i', String(i));
    p.style.setProperty('--dash', '1');
    return p;
  }

  function mkNode(x, y, w, h, title, sub, cls, i, isRoot) {
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'km-node ' + cls);
    g.style.setProperty('--i', String(i));

    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', w); rect.setAttribute('height', h);
    rect.setAttribute('rx', isRoot ? 14 : 10);
    g.appendChild(rect);

    var hasSub = !!sub;
    var t1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t1.setAttribute('x', x + w / 2);
    t1.setAttribute('y', y + (hasSub ? h / 2 - 9 : h / 2));
    t1.textContent = title;
    g.appendChild(t1);

    if (hasSub) {
      var t2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t2.setAttribute('class', 'km-sub');
      t2.setAttribute('x', x + w / 2);
      t2.setAttribute('y', y + h / 2 + 11);
      t2.textContent = sub;
      g.appendChild(t2);
    }
    return g;
  }

  /* ============================================================
     对外接口
     ============================================================ */

  function renderSlide(spec, index) {
    var type = spec.type || 'cards';
    var fn = TYPES[type] || TYPES.cards;

    var slide = el('section', 'slide');
    slide.setAttribute('data-type', type);
    slide.setAttribute('data-index', String(index));
    slide.id = 'slide-' + index;
    var inner = fn(spec);
    slide.appendChild(inner);

    slide._spec = spec;
    slide._inner = inner;
    return slide;
  }

  global.PYT = global.PYT || {};
  global.PYT.render = {
    slide: renderSlide,
    codePanel: codePanel,
    icon: ICON,
    types: Object.keys(TYPES)
  };
})(window);
