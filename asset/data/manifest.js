/* ============================================================
   章节目录
   注意：原 PPT 内部的章节编号是乱的（第五章的讲稿说"欢迎来到第六章"、
   第六章标题写"第7节"、第七章讲稿说"第八章"）。
   这里统一按文件顺序重编为第 1–7 章。
   ============================================================ */
(function (global) {
  'use strict';

  global.PYT = global.PYT || {};

  global.PYT.manifest = [
    {
      num: 1,
      slug: 'ch1',
      title: '变量与基本运算',
      subtitle: 'Python 语法的基石',
      desc: '数据长什么样、存在哪里、能做什么运算——搭建 Python 学习的地基。',
      icon: 'variable',
      slides: 10,
      topics: ['数据类型', '变量与赋值', '运算符体系'],
      file: 'assets/data/ch1.js'
    },
    {
      num: 2,
      slug: 'ch2',
      title: '控制逻辑流',
      subtitle: '让程序学会判断与重复',
      desc: '条件分支决定走哪条路，循环结构负责重复劳动，推导式让代码更精炼。',
      icon: 'branch',
      slides: 16,
      topics: ['if / elif / else', 'for / while 循环', '推导式与嵌套'],
      file: 'assets/data/ch2.js'
    },
    {
      num: 3,
      slug: 'ch3',
      title: '组合数据容器',
      subtitle: '把数据成批组织起来',
      desc: '列表、元组、字典、集合——四种容器的特性、取舍与适用场景。',
      icon: 'layers',
      slides: 16,
      topics: ['列表与元组', '字典与集合', '浅拷贝与深拷贝'],
      file: 'assets/data/ch3.js'
    },
    {
      num: 4,
      slug: 'ch4',
      title: '代码复用',
      subtitle: '从重复造轮子到乐高式编程',
      desc: '函数把逻辑打包，模块把代码分文件组织，让程序像搭积木一样组装。',
      icon: 'blocks',
      slides: 18,
      topics: ['函数的定义与参数', '作用域与返回值', '模块与 import'],
      file: 'assets/data/ch4.js'
    },
    {
      num: 5,
      slug: 'ch5',
      title: '标准库与第三方库',
      subtitle: '站在前人的肩膀上',
      desc: '自带工具箱加上全球开发者的生态，用现成的轮子解决实际问题。',
      icon: 'package',
      slides: 19,
      topics: ['os / sys / math / random', 'datetime / json / re', 'pip 与第三方库'],
      file: 'assets/data/ch5.js'
    },
    {
      num: 6,
      slug: 'ch6',
      title: '文件读写与异常',
      subtitle: '让程序有记忆，也能应对意外',
      desc: '文件操作实现数据持久化，异常处理让程序在出错时仍然体面地继续。',
      icon: 'fileWrite',
      slides: 17,
      topics: ['open 与 with 语句', 'try / except / finally', '健壮的文件处理'],
      file: 'assets/data/ch6.js'
    },
    {
      num: 7,
      slug: 'ch7',
      title: '面向对象',
      subtitle: '以映射世界的方式设计程序',
      desc: '从"怎么做"转向"谁来做"——类、对象、封装、继承与多态。',
      icon: 'object',
      slides: 17,
      topics: ['类与对象', '属性与方法', '封装 · 继承 · 多态'],
      file: 'assets/data/ch7.js'
    }
  ];

  global.PYT.getChapter = function (num) {
    var list = global.PYT.manifest;
    for (var i = 0; i < list.length; i++) {
      if (list[i].num === num) return list[i];
    }
    return null;
  };
})(window);
