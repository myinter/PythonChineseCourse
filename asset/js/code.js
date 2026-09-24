/* ============================================================
   代码高亮与逐 token 揭示
   零依赖的 Python 词法分析器。

   设计要点：
   1. 一次性把源码切准并高亮，动画只做 opacity 揭示——
      按字符重新着色会在多字符 token（**kwargs、f"..."、三引号）
      上出现破碎的中间态，且对缩进敏感。
   2. 错峰交给 CSS（--i + animation-delay），零逐帧 JS。
   3. 跳过动画 = 容器加一个 class，不取消 250 个动画，任意时刻跳过都不闪。
   4. 支持中文标识符（第七章有 def 制作(self)）。
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- Python 关键字 ---------- */
  var KEYWORDS = new Set([
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
    'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
    'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
    'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
    'while', 'with', 'yield', 'match', 'case'
  ]);

  /* ---------- 常用内置函数 ---------- */
  var BUILTINS = new Set([
    'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'bytearray', 'bytes',
    'callable', 'chr', 'classmethod', 'compile', 'complex', 'delattr',
    'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec', 'filter',
    'float', 'format', 'frozenset', 'getattr', 'globals', 'hasattr',
    'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance',
    'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max',
    'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow',
    'print', 'property', 'range', 'repr', 'reversed', 'round', 'set',
    'setattr', 'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super',
    'tuple', 'type', 'vars', 'zip',
    // 常用异常类型
    'Exception', 'ValueError', 'TypeError', 'KeyError', 'IndexError',
    'FileNotFoundError', 'PermissionError', 'ZeroDivisionError',
    'AttributeError', 'ImportError', 'ModuleNotFoundError', 'RuntimeError',
    'StopIteration', 'KeyboardInterrupt', 'NameError', 'OSError'
  ]);

  /* ---------- 词法规则（按优先级排列） ---------- */
  // 标识符含中文（Python 3 允许 Unicode 标识符，第七章有 def 制作(self)）
  //   一-鿿 常用汉字，㐀-䶿 扩展 A 区
  var RULES = [
    // 注释（含中文全角标点）
    ['comment', /#[^\n]*/y],

    // 字符串：可选 r/b/u/f 前缀，支持三引号（跨行）与转义
    // 前缀用 {0,3} 并允许回溯为 0，因此 f(x) 这类调用不会被误判成字符串
    ['string', /[rRbBuUfF]{0,3}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/y],

    // 未闭合字符串的兜底：学员打字中途引号还没配对时，
    // 仍按字符串着色，避免高亮在输入过程中闪烁（编辑器常见做法）
    ['string', /[rRbBuUfF]{0,3}(?:"[^"\n]*|'[^'\n]*)$/ym],

    // 装饰器
    ['decorator', /@[A-Za-z_一-鿿㐀-䶿][A-Za-z0-9_一-鿿㐀-䶿]*(?:\.[A-Za-z_一-鿿㐀-䶿][A-Za-z0-9_一-鿿㐀-䶿]*)*/y],

    // 数字：十六/八/二进制、浮点、科学计数、虚数、下划线分隔
    ['number', /\b(?:0[xX][0-9a-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?j?)/y],

    // 标识符（含中文）
    ['word', /[A-Za-z_一-鿿㐀-䶿][A-Za-z0-9_一-鿿㐀-䶿]*/y],

    // 运算符（长符号在前，避免 == 被切成两个 =）
    ['op', /(?:\*\*=|\/\/=|>>=|<<=|:=|->|\*\*|\/\/|==|!=|<=|>=|<<|>>|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|[-+*/%@&|^~<>]=?)/y],

    // 标点
    ['punct', /[\[\]{}():,.;]/y],

    // 空白与换行必须原样保留，保证渲染结果与源码逐字符一致
    ['ws', /[ \t]+/y],
    ['nl', /\n/y],

    // 兜底：任何未识别字符按普通文本处理，确保 tokenizer 永不卡住
    ['plain', /[\s\S]/y]
  ];

  /**
   * 把源码切成 token 数组。
   * 不变式：所有 token.text 拼接后 === 源码（逐字符相等）。
   * @param {string} src
   * @returns {Array<{cls:string, text:string}>}
   */
  function tokenize(src) {
    var tokens = [];
    var i = 0;
    var n = src.length;

    while (i < n) {
      var matched = false;
      for (var r = 0; r < RULES.length; r++) {
        var cls = RULES[r][0];
        var re = RULES[r][1];
        re.lastIndex = i;
        var m = re.exec(src);
        if (m && m[0].length > 0) {
          var text = m[0];
          tokens.push({ cls: classify(cls, text, src, i), text: text });
          i += text.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // 理论上不会到这里（plain 规则能匹配任意字符），保底防死循环
        tokens.push({ cls: 'tok-plain', text: src[i] });
        i++;
      }
    }
    return tokens;
  }

  /** 对基础类别做细分：关键字 / 内置 / 类名 / 函数名 */
  function classify(baseCls, text, src, pos) {
    if (baseCls === 'word') {
      if (KEYWORDS.has(text)) return 'tok-kw';
      if (BUILTINS.has(text)) return 'tok-builtin';

      // 后面紧跟 ( 的视为函数调用
      var after = src.slice(pos + text.length);
      var m = /^[ \t]*\(/.exec(after);
      if (m) return 'tok-func';

      // 首字母大写的视为类名（含中文无法判断大小写时，靠 def class 上下文）
      if (/^[A-Z]/.test(text)) return 'tok-class';

      // self / cls 参数
      if (text === 'self' || text === 'cls') return 'tok-param';

      // def / class 后面跟的名字
      var before = src.slice(0, pos);
      if (/\b(?:def|class)\s+$/.test(before)) {
        return /^class\s/.test(before.slice(-12)) ? 'tok-class' : 'tok-func';
      }

      return 'tok-plain';
    }
    if (baseCls === 'op') return 'tok-op';
    if (baseCls === 'punct') return 'tok-punct';
    // 换行与空白必须区分：buildHighlighted 靠 tok-nl 切分代码行，
    // 若两者都归为 tok-ws，整段代码会挤进同一个 .code-line，
    // 按行高亮与按行揭示都会失效（而 white-space:pre 让视觉上看不出来）
    if (baseCls === 'nl') return 'tok-nl';
    if (baseCls === 'ws') return 'tok-ws';
    return 'tok-' + baseCls;
  }

  /* ============================================================
     构建 DOM
     ============================================================ */

  /**
   * 把源码渲染成高亮 DOM。
   * 每行包一层 .code-line（供按行揭示与行号高亮定位），
   * 行内每个 token 带 --i 序号用于错峰。
   */
  function buildHighlighted(src) {
    var tokens = tokenize(src);
    var frag = document.createDocumentFragment();

    var lineEl = document.createElement('span');
    lineEl.className = 'code-line';
    var lineStart = 0;   // 当前行第一个 token 的全局序号
    var tokenIndex = 0;
    var gutterLines = [];

    function flushLine() {
      frag.appendChild(lineEl);
      gutterLines.push(lineStart);
      lineEl = document.createElement('span');
      lineEl.className = 'code-line';
      lineStart = tokenIndex;
    }

    for (var t = 0; t < tokens.length; t++) {
      var tk = tokens[t];
      if (tk.cls === 'tok-ws') {
        // 空白原样输出，不包 span（省 token 数，且不影响揭示视觉）
        lineEl.appendChild(document.createTextNode(tk.text));
        continue;
      }
      if (tk.cls === 'tok-nl') {
        flushLine();
        tokenIndex++;
        continue;
      }
      var span = document.createElement('span');
      span.className = 'tok ' + tk.cls;
      span.style.setProperty('--i', String(tokenIndex));
      span.textContent = tk.text;
      lineEl.appendChild(span);
      tokenIndex++;
    }
    // 最后一行
    frag.appendChild(lineEl);
    gutterLines.push(lineStart);

    return {
      frag: frag,
      lineCount: gutterLines.length,
      tokenCount: tokenIndex
    };
  }

  /** 生成行号 gutter */
  function buildGutter(lineCount) {
    var g = document.createElement('div');
    g.className = 'code-gutter';
    g.setAttribute('aria-hidden', 'true');
    var buf = [];
    for (var i = 1; i <= lineCount; i++) {
      buf.push('<span data-line="' + i + '">' + i + '</span>');
    }
    g.innerHTML = buf.join('');
    return g;
  }

  /* ============================================================
     对外接口
     ============================================================ */

  var code = {
    tokenize: tokenize,

    /**
     * 渲染一个代码块主体（不含操作栏）。
     * @param {string} src 源码
     * @param {object} opts { reveal:boolean, byLine:boolean }
     * @returns {HTMLElement} .code-block
     */
    render: function (src, opts) {
      opts = opts || {};
      var built = buildHighlighted(src);

      var block = document.createElement('div');
      block.className = 'code-block';

      var body = document.createElement('div');
      body.className = 'code-body';

      // .code-area 是编辑器的定位容器：编辑时 pre 转为绝对定位，
      // textarea 叠在它上面，两者字体度量完全一致才不会错位
      var area = document.createElement('div');
      area.className = 'code-area';

      var pre = document.createElement('pre');
      pre.className = 'code-pre';
      pre.appendChild(built.frag);
      area.appendChild(pre);

      body.appendChild(buildGutter(built.lineCount));
      body.appendChild(area);

      // 打字光标：贴在最后一行的末尾
      var caret = document.createElement('span');
      caret.className = 'caret';
      caret.setAttribute('aria-hidden', 'true');
      var lastLine = pre.querySelector('.code-line:last-child');
      if (lastLine) lastLine.appendChild(caret);

      block.appendChild(body);

      // 长代码改用按行揭示，避免几十秒才显示完
      var byLine = opts.byLine != null ? opts.byLine : built.tokenCount > 400;
      if (byLine) {
        block.classList.add('reveal-by-line');
        var lines = pre.querySelectorAll('.code-line');
        for (var i = 0; i < lines.length; i++) {
          lines[i].style.setProperty('--i', String(i));
        }
      }

      block._meta = {
        source: src,
        lineCount: built.lineCount,
        tokenCount: built.tokenCount,
        byLine: byLine
      };

      if (opts.reveal !== false) {
        // 下一帧启动动画，确保动画能在元素已挂载后触发
        requestAnimationFrame(function () {
          block.classList.add('is-typing');
          var delay = byLine
            ? built.lineCount * 45
            : Math.min(built.tokenCount * 18, 2600);
          setTimeout(function () { block.classList.remove('is-typing'); }, delay);
        });
      }
      return block;
    },

    /** 跳过揭示动画：加一个 class 即可，任意时刻调用都不闪 */
    revealAll: function (root) {
      var blocks = root ? root.querySelectorAll('.code-block') : [];
      for (var i = 0; i < blocks.length; i++) {
        blocks[i].classList.add('is-revealed');
        blocks[i].classList.remove('is-typing');
      }
    },

    /** 高亮指定行（单步追踪用），line 为 1 起始 */
    highlightLine: function (block, line) {
      if (!block) return;
      var prev = block.querySelectorAll('.code-line.is-hot, .code-gutter span.is-hot');
      for (var i = 0; i < prev.length; i++) prev[i].classList.remove('is-hot');
      if (!line) return;
      var pre = block.querySelector('.code-pre');
      var gut = block.querySelector('.code-gutter');
      var lineEl = pre && pre.querySelectorAll('.code-line')[line - 1];
      var numEl = gut && gut.querySelector('span[data-line="' + line + '"]');
      if (lineEl) lineEl.classList.add('is-hot');
      if (numEl) numEl.classList.add('is-hot');
    },

    /**
     * 标出横向可滚动的代码块。
     * 窄屏上长代码行会被右侧裁掉，虽然能滑动，但界面上没有任何提示，
     * 看起来就像「代码被截断了」。这里真实测量后加类，由 CSS 显示渐隐提示。
     * 无条件加渐变是不对的 —— 代码放得下时也会盖一层阴影，反而误导。
     */
    markOverflow: function (root) {
      var areas = (root || document).querySelectorAll('.code-area');
      for (var i = 0; i < areas.length; i++) {
        var pre = areas[i].querySelector('.code-pre');
        if (!pre) continue;
        var over = pre.scrollWidth > pre.clientWidth + 2;
        areas[i].classList.toggle('is-overflowing', over);
      }
    },

    /** 把纯文本转义成安全 HTML */
    escape: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
  };

  global.PYT = global.PYT || {};
  global.PYT.code = code;
})(window);
