/* ============================================================
   内联 SVG 图标
   用内联而非图片：零请求、可跟随主题变色、矢量清晰。
   替换原 PPT 里那约 340 张 0.4 英寸的位图小图标。
   统一 24x24 视野、1.8 描边、圆头圆角，保持视觉一致。
   ============================================================ */
(function (global) {
  'use strict';

  function wrap(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
           'aria-hidden="true">' + paths + '</svg>';
  }

  var ICONS = {
    /* ---- 第一章：数据类型与运算 ---- */
    number:    '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    text:      '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
    boolean:   '<path d="M9 12h6"/><circle cx="12" cy="12" r="9"/>',
    none:      '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    variable:  '<path d="M3 7l9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
    tag:       '<path d="M3 11V4h7l10 10-7 7L3 11Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    convert:   '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    calculator:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    compare:   '<path d="M9 4 5 8l4 4M5 8h11M15 20l4-4-4-4M19 16H8"/>',
    logic:     '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.5 6H13a5 5 0 0 1 0 12H8.5M8.5 12H11"/>',

    /* ---- 第二章：控制流 ---- */
    branch:    '<path d="M6 3v6M6 21v-6"/><circle cx="6" cy="12" r="3"/><path d="M9 12h4a4 4 0 0 0 4-4V6M17 12v2a4 4 0 0 1-4 4h-4"/>',
    loop:      '<path d="M4 9a8 8 0 0 1 13.7-3.6L20 8M20 15a8 8 0 0 1-13.7 3.6L4 16"/><path d="M20 4v4h-4M4 20v-4h4"/>',
    sequence:  '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    index:     '<path d="M4 6h16M4 12h10M4 18h6"/><circle cx="18" cy="17" r="3"/><path d="M18 15.5v1.5l1 .8"/>',
    merge:     '<path d="M5 4v4a4 4 0 0 0 4 4h6a4 4 0 0 1 4 4v4"/><path d="M5 20v-4a4 4 0 0 1 4-4h6a4 4 0 0 0 4-4V4"/>',
    stop:      '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    skip:      '<path d="M5 12h11l-4-4M16 12l-4 4"/><path d="M19 5v14"/>',
    sparkle:   '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3Z"/><path d="M18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8L18 16Z"/>',
    layers:    '<path d="M12 3 3 7.5 12 12l9-4.5L12 3Z"/><path d="M3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>',
    truthy:    '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>',

    /* ---- 第三章：数据容器 ---- */
    list:      '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 6v12M13 6v12M18 6v12"/>',
    tuple:     '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 6v12M16 6v12"/><path d="M10.5 11.5v1M13.5 11.5v1"/>',
    dictionary:'<path d="M4 5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v16l-7-3-8 3V5Z"/>',
    set:       '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="15" r="5"/>',
    unbox:     '<path d="M12 3v12M12 15l-3.5-3.5M12 15l3.5-3.5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    copy:      '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    clone:     '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M12 12h4M12 16h4"/>',

    /* ---- 第四章：函数与模块 ---- */
    fn:        '<path d="M9 21c-2 0-3-1.2-3-3V9c0-1.8-1-3-3-3"/><path d="M3 12h8M14 7l4 5-4 5"/>',
    params:    '<path d="M4 7h6M4 12h4M4 17h6"/><circle cx="17" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    return:    '<path d="M20 12H7"/><path d="M11 8l-4 4 4 4"/><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/>',
    scope:     '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1.5"/><circle cx="12" cy="12" r="1.5"/>',
    lambda:    '<path d="M6 6l8 12"/><path d="M14 6l-4 6"/><path d="M15 18h5"/>',
    module:    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M12 9h5M12 13h5"/>',
    toolbox:   '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18M10 13v2h4v-2"/>',
    blocks:    '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    import:    '<path d="M12 3v10M12 13l-3.5-3.5M12 13l3.5-3.5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',

    /* ---- 第五章：标准库与第三方库 ---- */
    os:        '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3"/><path d="M7 9l2 2-2 2M12 13h5"/>',
    sys:       '<path d="M8 6 2 12l6 6M16 6l6 6-6 6M13.5 4l-3 16"/>',
    math:      '<path d="M4 4h6l-6 16h6"/><path d="M14 8h6M17 5v6M14 16h6"/>',
    random:    '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.3"/><circle cx="15.5" cy="15.5" r="1.3"/><circle cx="12" cy="12" r="1.3"/>',
    clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    json:      '<path d="M8 3H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1"/>',
    regex:     '<path d="M12 12a4 4 0 1 0 0-.01"/><path d="M12 8v8M8.5 10l7 4M15.5 10l-7 4"/><circle cx="19" cy="6" r="1.5"/>',
    package:   '<path d="M21 8v8a2 2 0 0 1-1 1.7l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.7l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8Z"/><path d="M3.3 7 12 12l8.7-5M12 12v10"/>',
    download:  '<path d="M12 3v12M12 15l-4-4M12 15l4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    cloud:     '<path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.2 10.5 4 4 0 0 0 6.5 19h11Z"/>',
    chart:     '<path d="M3 3v18h18"/><path d="M7 15l3.5-4 3 2.5L20 7"/>',
    table:     '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>',
    tree:      '<path d="M12 3v5M12 8H7v4M12 8h5v4M7 12v4M17 12v4"/><circle cx="12" cy="3" r="1.6"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/>',

    /* ---- 第六章：文件与异常 ---- */
    file:      '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/>',
    fileWrite: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    lock:      '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    shield:    '<path d="M12 3l8 3v6c0 5-3.5 8.2-8 9.5C7.5 20.2 4 17 4 12V6l8-3Z"/><path d="M9 12l2 2 4-4"/>',
    alert:     '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
    bug:       '<rect x="8" y="6" width="8" height="14" rx="4"/><path d="M8 11H4M20 11h-4M8 16H4M20 16h-4M9 6 7 4M15 6l2-2"/>',
    steps:     '<path d="M4 20h4v-4h4v-4h4V8h4V4"/><circle cx="4" cy="20" r="1.4"/><circle cx="20" cy="4" r="1.4"/>',

    /* ---- 第七章：面向对象 ---- */
    object:    '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="10" r="1.4"/><path d="M7 16c.6-1.4 4-1.4 4.6 0M14.5 9.5h3M14.5 13h3"/>',
    blueprint: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11M12 13h5M12 16h3"/>',
    house:     '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z"/><path d="M10 21v-6h4v6"/>',
    inherit:   '<rect x="8" y="3" width="8" height="6" rx="1.5"/><rect x="2" y="15" width="8" height="6" rx="1.5"/><rect x="14" y="15" width="8" height="6" rx="1.5"/><path d="M12 9v3M6 15v-3h12v3"/>',
    poly:      '<circle cx="12" cy="7" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
    encapsulate:'<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.5"/>',
    cat:       '<path d="M5 9 4 4l4 2.5M19 9l1-5-4 2.5"/><path d="M5 9a7 7 0 0 0 14 0"/><path d="M9 13h.01M15 13h.01M12 16l1 1h-2l1-1Z"/>',
    coffee:    '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2"/><path d="M7 3v2M11 3v2"/>',

    /* ---- 通用 ---- */
    play:      '<path d="M7 4.5v15l12-7.5-12-7.5Z"/>',
    pause:     '<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>',
    skipBack:  '<path d="M18 6v12L9 12l9-6Z"/><path d="M6 5v14"/>',
    skipFwd:   '<path d="M6 6v12l9-6-9-6Z"/><path d="M18 5v14"/>',
    reset:     '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    edit:      '<path d="M4 20h4L20 8l-4-4L4 16v4Z"/><path d="M14 6l4 4"/>',
    check:     '<path d="M4 12.5 9 18 20 6"/>',
    close:     '<path d="M6 6l12 12M18 6 6 18"/>',
    chevronL:  '<path d="M15 5l-7 7 7 7"/>',
    chevronR:  '<path d="M9 5l7 7-7 7"/>',
    grid:      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    notes:     '<path d="M4 4h16v12l-4 4H4V4Z"/><path d="M8 9h8M8 13h5"/>',
    sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon:      '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
    presentation:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',
    book:      '<path d="M4 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4V4Z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20V4Z"/>',
    terminal:  '<path d="M7 8l4 4-4 4M13 16h5"/><rect x="3" y="4" width="18" height="16" rx="2"/>',
    wrench:    '<path d="M15 3a5.5 5.5 0 0 0-4.6 8.5L4 18v2h3l6.5-6.4A5.5 5.5 0 1 0 15 3Z"/><circle cx="16.5" cy="7.5" r="1"/>',
    target:    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    bulb:      '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 1 3.5 10.9c-.5.4-.6 1-.6 1.6v.5h-5.8v-.5c0-.6-.1-1.2-.6-1.6A6 6 0 0 1 12 3Z"/>',
    question:  '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.3M12 17h.01"/>',
    python:    '<path d="M12 2c-3.3 0-6 .7-6 2.5V8h6v1H5.5C3.7 9 2 10.7 2 14s1.7 5 3.5 5H7v-3.5C7 13.6 8.6 12 10.5 12h5c1.4 0 2.5-1.1 2.5-2.5v-5C18 2.7 15.3 2 12 2Z"/><path d="M12 22c3.3 0 6-.7 6-2.5V16h-6v-1h6.5c1.8 0 3.5-1.7 3.5-5s-1.7-5-3.5-5H17v3.5c0 1.9-1.6 3.5-3.5 3.5h-5C7.1 12 6 13.1 6 14.5v5c0 1.8 2.7 2.5 6 2.5Z"/><circle cx="9" cy="5.5" r=".9" fill="currentColor"/><circle cx="15" cy="18.5" r=".9" fill="currentColor"/>'
  };

  /**
   * 取图标 SVG 字符串。
   * @param {string} name
   * @param {number} [size] 不传则由 CSS 控制尺寸
   */
  function icon(name, size) {
    var body = ICONS[name] || ICONS.sparkle;
    var svg = wrap(body);
    if (size) svg = svg.replace('<svg ', '<svg width="' + size + '" height="' + size + '" ');
    return svg;
  }

  global.PYT = global.PYT || {};
  global.PYT.icons = { get: icon, has: function (n) { return !!ICONS[n]; }, all: ICONS };
})(typeof window !== 'undefined' ? window : globalThis);
