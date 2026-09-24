/* ============================================================
   第一章 · 变量与基本运算

   代码说明：原 PPT 里的代码块缩进全部丢失、并混入了全角引号，
   无法直接运行。此处所有代码都已重新校订，并由 tools/verify_examples.py
   实际跑通验证，expectedOutput 是真实输出。
   ============================================================ */
(function (global) {
  'use strict';
  global.PYT = global.PYT || {};
  global.PYT.data = global.PYT.data || {};

  global.PYT.data.ch1 = [

    /* ---------- 1. 封面 ---------- */
    {
      type: 'title',
      eyebrow: '第一章',
      title: '变量与基本运算',
      lead: '数据长什么样 · 数据存在哪里 · 数据能做什么运算',
      notes: '大家好，欢迎来到 Python 编程的第一课。今天我们将一起搭建 Python 学习的地基，核心是理解三个关键概念：数据长什么样，数据存在哪里，以及数据能做什么运算。这一章是后续所有编程学习的基础，希望大家能认真掌握。'
    },

    /* ---------- 2. 知识地图 ---------- */
    {
      type: 'map',
      eyebrow: '本章脉络',
      title: '一张图看懂本章',
      lead: '三个问题对应三个知识点，它们共同构成 Python 语法的地基。',
      map: {
        aria: '本章知识地图：数据类型、变量与赋值、运算符体系',
        root: { title: '第一章 · 变量与基本运算', sub: 'Python 语法的基石' },
        branches: [
          {
            title: '数据类型',
            sub: '数据长什么样',
            leaves: [
              { title: '数字类型', sub: 'int / float' },
              { title: '字符串 str', sub: '"文本"' },
              { title: '布尔与空值', sub: 'bool / None' }
            ]
          },
          {
            title: '变量与赋值',
            sub: '数据存在哪里',
            leaves: [
              { title: '类型转换', sub: 'int() str() float()' },
              { title: '命名规则', sub: '字母数字下划线' },
              { title: '输入 / 输出', sub: 'input() · print()' }
            ]
          },
          {
            title: '运算符体系',
            sub: '数据能做什么',
            leaves: [
              { title: '算术运算符', sub: '+ - * / // % **' },
              { title: '比较运算符', sub: '> < == !=' },
              { title: '逻辑运算符', sub: 'and / or / not' }
            ]
          }
        ]
      },
      notes: '这张图是本章的全貌。我们从"数据长什么样"出发认识数据类型，接着学习用什么容器把数据存起来，也就是变量，最后看这些数据能做哪些运算。三条线索是层层递进的：不知道类型就不知道该用哪个运算符，不知道变量就没法把结果留住。'
    },

    /* ---------- 3. 数据类型 ---------- */
    {
      type: 'cards',
      eyebrow: '问题一 · 数据长什么样',
      title: '数据类型系统',
      lead: 'Python 中的数据有不同的「长相」，我们称之为数据类型。类型决定了数据能进行哪些操作——这正是它们存在的意义。',
      cards: [
        {
          icon: 'number',
          heading: '数字型 Number',
          body: '包含整数 `int` 和浮点数 `float`，用于数值计算。\n示例：`1`、`3.14`、`-5`'
        },
        {
          icon: 'text',
          heading: '字符串 String',
          body: '用于表示文本信息，需用单引号或双引号包裹。\n示例：`\'Hello\'`、`"Python"`'
        },
        {
          icon: 'boolean',
          heading: '布尔值 Boolean',
          body: '用于逻辑判断，只有 `True`（真）和 `False`（假）两个值。\n示例：`True`、`False`'
        },
        {
          icon: 'none',
          heading: '空值 None',
          body: '表示一个不存在的值或空对象，**不同于** `0` 或空字符串。\n示例：`None`'
        }
      ],
      note: {
        icon: 'convert',
        title: '类型转换',
        text: '用 `int()`、`float()`、`str()` 可以在不同类型之间转换数据，这在实际编程中非常有用。'
      },
      notes: '首先，我们来看看数据长什么样。在 Python 中，数据不是杂乱无章的，它们有自己的类型。最常见的包括数字，比如整数和小数；字符串，也就是我们平时说的文本；布尔值，用来表示真或假；还有一个特殊的空值 None。理解这些类型非常重要，因为不同类型的数据能进行的操作是不同的。'
    },

    /* ---------- 4. 类型转换（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '动手试试',
      title: '类型转换',
      lead: '`input()` 拿到的永远是字符串，想参与计算就必须先转成数字。这是初学者最常踩的坑。',
      points: [
        '`int("18")` 把字符串转成整数',
        '`float("3.14")` 转成小数',
        '`str(100)` 把数字转成字符串',
        '`type(x)` 查看一个值的类型'
      ],
      code: {
        file: 'convert.py',
        source: `# 字符串 → 数字
age = int("18")
price = float("3.14")

# 数字 → 字符串
text = str(100)

print(age + 1)       # 数字相加
print(price * 2)     # 小数相乘
print(text + "分")   # 字符串拼接
print(type(age), type(price), type(text))`,
        runnable: true,
        expectedOutput: `19
6.28
100分
<class 'int'> <class 'float'> <class 'str'>`
      },
      notes: '这里的第一个坑是：从键盘读进来的 input() 结果永远被当成字符串。如果你直接拿它做加法，Python 会把两个字符串首尾相接，而不是做数学加法。所以我们要用 int() 把字符串变成整数。这一点请大家务必记牢。'
    },

    /* ---------- 5. 变量与赋值 ---------- */
    {
      type: 'split',
      eyebrow: '问题二 · 数据存在哪里',
      title: '变量与赋值',
      lead: '变量是贴了标签的盒子。你把数据放进去，之后就能通过标签（变量名）找到它。',
      cards: [
        {
          icon: 'variable',
          heading: '赋值',
          body: '用等号 `=` 把右边的值放进左边的变量。\n示例：`name = "Alice"`'
        },
        {
          icon: 'tag',
          heading: '命名规则',
          body: '只能含字母、数字、下划线；不能以数字开头；不能用 Python 关键字。\n推荐 `user_age` 这样的写法。'
        }
      ],
      code: {
        file: 'assign.py',
        source: `name = "Alice"
user_age = 18

# 一行同时给多个变量赋值
a, b, c = 1, 2, 3

print(f"{name} 今年 {user_age} 岁")
print(a, b, c)`,
        runnable: true,
        expectedOutput: `Alice 今年 18 岁
1 2 3`
      },
      notes: '知道了数据的类型，接下来我们要学习数据存在哪里。在编程中，我们使用变量来存储数据。你可以把变量想象成一个贴了标签的盒子，我们把数据放进去，以后就可以通过这个标签，也就是变量名，来找到它。创建变量的过程叫做赋值。这里有几个重要的命名规则需要记住，比如不能用数字开头，不能用 Python 的关键字。'
    },

    /* ---------- 6. 命名规则纠错 ---------- */
    {
      type: 'compare',
      eyebrow: '常见错误',
      title: '命名规则：哪些名字不能用',
      lead: 'Python 对变量名的限制不多，但踩到这几条会直接报错。',
      table: {
        head: ['写法', '合法？', '原因'],
        rows: [
          ['`user_age`', '合法', '字母、下划线组合，清晰易读'],
          ['`_count`', '合法', '以下划线开头是允许的'],
          ['`123name`', '不合法', '不能以数字开头'],
          ['`user-age`', '不合法', '减号会被当成运算符'],
          ['`if`', '不合法', '`if` 是 Python 关键字，已被语言占用'],
          ['`userAge`', '合法但不推荐', 'Python 习惯用下划线 `user_age`']
        ]
      },
      notes: '命名规则只有三条硬性限制：只能包含字母、数字和下划线；不能以数字开头；不能使用 Python 的关键字。除此之外，建议使用有意义的名称，比如用 user_age 而不是 a，这样代码更容易读懂。'
    },

    /* ---------- 7. 输入与输出 ---------- */
    {
      type: 'code',
      eyebrow: '动手试试',
      title: '输入与输出',
      lead: '`print()` 把结果显示出来，`input()` 从键盘读入内容。注意 `input()` 读到的永远是字符串。',
      points: [
        '`print()` 可以一次输出多个值，用逗号隔开',
        '`input()` 的结果要用 `int()` 转换后才能做数学运算',
        'f-string 写法 `f"{变量}"` 能把变量嵌进文本里'
      ],
      code: {
        file: 'io.py',
        source: `name = "小明"
age = 18

# 用 f-string 把变量嵌进文本
print(f"你好，{name}！")
print(f"明年你就 {age + 1} 岁了。")

# input() 读到的永远是字符串，需要转换
raw = "20"              # 相当于 input() 的结果
score = int(raw)
print(f"分数加 5 分后是 {score + 5}。")`,
        runnable: true,
        expectedOutput: `你好，小明！
明年你就 19 岁了。
分数加 5 分后是 25。`
      },
      note: {
        icon: 'alert',
        title: '网页版说明',
        text: '网页环境没有键盘输入通道，`input()` 无法使用。上面的例子用变量赋值代替了 `input()`，这正是你在浏览器里练习时的推荐做法。'
      },
      notes: 'print 用于输出，input 用于获取用户输入。这里要特别提醒：input 拿到的永远是字符串，哪怕你输入的是数字。如果不做转换，age + 1 会直接报错。'
    },

    /* ---------- 8. 运算符体系 ---------- */
    {
      type: 'cards',
      eyebrow: '问题三 · 数据能做什么',
      title: '运算符体系',
      lead: 'Python 提供了丰富的运算符。理解它们的用法和优先级，决定了你的代码能否按预期执行。',
      cards: [
        {
          icon: 'calculator',
          heading: '算术运算符',
          body: '用于数值计算：\n`+` 加　`-` 减　`*` 乘\n`/` 除　`**` 幂　`%` 取余\n`//` 整除'
        },
        {
          icon: 'compare',
          heading: '比较运算符',
          body: '比较两个值，结果**总是布尔值**：\n`==` 等于　`!=` 不等于\n`>` 大于　`<` 小于　`>=` 大于等于'
        },
        {
          icon: 'logic',
          heading: '逻辑运算符',
          body: '用于组合多个布尔值：\n`and` 与：全真才真\n`or` 或：一真即真\n`not` 非：取反'
        }
      ],
      note: {
        icon: 'target',
        title: '运算符优先级',
        text: '括号 `( )` → 幂 `**` → 乘除 `* / //` → 加减 `+ -`。逻辑运算遵循「非 → 与 → 或」。**拿不准就加括号**，这是最实用的技巧。'
      },
      notes: '最后，我们来看看数据能做什么运算。算术运算符帮助我们进行数学计算，比如加减乘除、取余和幂运算。比较运算符让我们可以判断大小关系，它的结果总是布尔值 True 或 False。逻辑运算符则用于更复杂的条件判断。理解这些运算符的用法和优先级至关重要。'
    },

    /* ---------- 9. 运算符实战（可运行） ---------- */
    {
      type: 'code',
      eyebrow: '动手试试',
      title: '运算符实战',
      lead: '注意除法 `/` 的结果永远是小数，想要整数结果要用整除 `//`。',
      points: [
        '`/` 除法：`10 / 3` 得到 `3.333...`',
        '`//` 整除：只保留整数部分',
        '`%` 取余：常用来判断奇偶',
        '`**` 幂运算：`10 ** 3` 是 1000'
      ],
      code: {
        file: 'operators.py',
        source: `x = 10
y = 3

print(x + y, x - y, x * y)
print(x / y)     # 除法结果总是小数
print(x // y)    # 整除，只留整数部分
print(x % y)     # 取余
print(x ** y)    # 幂运算

print(x > y, x == y, x != y)
print(x > 5 and y < 5)`,
        runnable: true,
        expectedOutput: `13 7 30
3.3333333333333335
3
1
1000
True False True
True`
      },
      notes: '这里最容易混淆的是除法和整除。一个斜杠的除法，结果永远是浮点数，10 除以 3 得到 3.333...。两个斜杠才是整除，只保留整数部分。取余运算用百分号，常用来判断一个数是奇数还是偶数。'
    },

    /* ---------- 10. 小结 ---------- */
    {
      type: 'end',
      icon: 'python',
      title: '本章小结',
      lead: '三个问题，三个知识点。掌握它们，你就具备了编写简单 Python 程序的基本能力。',
      cards: [
        { icon: 'number', heading: '数据类型', body: '数字、字符串、布尔、None——类型决定了能做什么运算' },
        { icon: 'variable', heading: '变量', body: '贴标签的盒子，用 `=` 赋值，命名要规范' },
        { icon: 'calculator', heading: '运算符', body: '算术、比较、逻辑，拿不准优先级就加括号' }
      ],
      notes: '本章的内容就到这里。我们回答了三个问题：数据长什么样、存在哪里、能做什么运算。这些是后续所有 Python 学习的基础。建议你动手改一改上面例子里的数字和字符串，看看输出会怎么变化。'
    }
  ];
})(window);
