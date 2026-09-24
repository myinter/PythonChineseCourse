/* ============================================================
   第二章 · 控制逻辑流

   代码说明：原 PPT 里的代码块缩进全部丢失、变量跨文本框拆散、
   并混入了全角引号（print(f"Index: {idx}”) 这类写法会直接 SyntaxError）。
   此处所有代码都已按规范重新校订并补成完整片段，
   由 tools/verify_examples.mjs 实际跑通验证，expectedOutput 是真实输出。

   单步追踪：for 循环、while 循环、break/continue 三页
   （第 8、10、11 页）标了 traceable: true。
   ============================================================ */
(function (global) {
  'use strict';
  global.PYT = global.PYT || {};
  global.PYT.data = global.PYT.data || {};

  global.PYT.data.ch2 = [

    /* ---------- 1. 封面 ---------- */
    {
      type: 'title',
      eyebrow: '第二章',
      title: '控制逻辑流',
      lead: '条件分支决定走哪条路 · 循环结构负责重复劳动 · 进阶技巧让代码更精炼',
      notes: '大家好，欢迎来到本次Python教程的第二章——控制逻辑流。在这一章中，我们将深入探讨Python中用于控制程序执行流程的核心结构，包括条件分支、循环结构以及一些进阶技巧。本PPT采用卡片式设计，方便大家快速查阅各个知识点，希望能帮助大家更好地掌握这些重要的编程概念。'
    },

    /* ---------- 2. 知识地图 ---------- */
    {
      type: 'map',
      eyebrow: '本章脉络',
      title: '一张图看懂本章',
      lead: '让程序学会判断、学会重复，再把逻辑写得更精炼——三部分内容层层递进。',
      map: {
        aria: '本章知识地图：条件分支、循环结构、进阶技巧',
        root: { title: '第二章 · 控制逻辑流', sub: '让程序学会判断与重复' },
        branches: [
          {
            title: '条件分支',
            sub: '决定走哪条路',
            leaves: [
              { title: 'if / elif / else', sub: '多路条件判断' },
              { title: '三元表达式', sub: '一行写完的二选一' },
              { title: '条件赋值', sub: '把结果存进变量' }
            ]
          },
          {
            title: '循环结构',
            sub: '重复的活交给它',
            leaves: [
              { title: 'for 循环', sub: '遍历列表与字符串' },
              { title: 'range 等内置函数', sub: 'range / enumerate / zip' },
              { title: 'while 循环', sub: '按条件重复执行' },
              { title: '循环控制关键字', sub: 'break / continue / pass' }
            ]
          },
          {
            title: '进阶技巧',
            sub: '更 Pythonic 的写法',
            leaves: [
              { title: '推导式', sub: '循环与条件浓缩成一行' },
              { title: '嵌套循环', sub: '处理二维结构' },
              { title: 'Truthy / Falsy', sub: '直接拿对象做判断' }
            ]
          }
        ]
      },
      notes: '这张图是本章的全貌。控制逻辑流说到底就是三件事：先让程序会判断，用条件分支决定走哪条路；再让程序会重复，用循环把重复的活干掉；最后是进阶技巧，用推导式和嵌套循环把代码写得更精炼。三条线索是层层递进的：不会判断，循环就没法在中途停下来；不懂循环，推导式也就无从谈起。'
    },

    /* ---------- 3. 目录 ---------- */
    {
      type: 'toc',
      eyebrow: '课程目录',
      title: '本次教程的三部分',
      lead: '从判断到重复，再到把逻辑浓缩成一行，一路走下来就是一套完整的控制逻辑流。',
      items: [
        {
          num: '01',
          title: '条件分支',
          body: '`if` / `elif` / `else` 条件语句\n三元表达式与条件赋值'
        },
        {
          num: '02',
          title: '循环结构',
          body: '`for` 循环与遍历迭代\n`while` 循环与循环控制'
        },
        {
          num: '03',
          title: '进阶技巧',
          body: '推导式与条件结合\n嵌套循环与 Truthy / Falsy 值'
        }
      ],
      notes: '本次教程将分为三个主要部分。首先，我们会学习条件分支，包括最基础的if语句、简洁的三元表达式以及Python 3.10+引入的模式匹配。接着，我们将深入循环结构，探讨for循环和while循环的使用方法，以及如何通过关键字控制循环流程。最后，我们会介绍一些进阶技巧，如推导式的高级用法、嵌套循环的应用以及Python中特殊的Truthy和Falsy值概念。'
    },

    /* ---------- 4. 分节页 01 ---------- */
    {
      type: 'section',
      num: '01',
      title: '条件分支',
      sub: 'Conditional Branching',
      lead: '让程序根据不同的条件执行不同的代码块，这是程序拥有判断能力的起点。',
      notes: '现在，让我们进入第一部分：条件分支。条件分支是编程中最基础也是最重要的概念之一，它允许程序根据不同的条件执行不同的代码块，从而实现程序的逻辑判断能力。'
    },

    /* ---------- 5. if / elif / else（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '01 条件分支',
      title: 'if / elif / else 条件语句',
      lead: '最基础的分支结构：从上往下依次检查条件，命中一个就执行它下面的代码块，然后跳出整个结构。',
      cards: [
        {
          icon: 'branch',
          heading: 'if 语句（条件入口）',
          body: '检查一个条件是否为真，如果为真，则执行其内部的代码块。'
        },
        {
          icon: 'logic',
          heading: 'elif 语句（条件分支）',
          body: 'else if 的缩写，用于在 `if` 条件不成立时检查另一个条件，可存在多个。'
        },
        {
          icon: 'check',
          heading: 'else 语句（默认分支）',
          body: '当所有 `if` 和 `elif` 条件都不成立时执行的代码块，它是可选的。'
        }
      ],
      code: {
        file: 'demo.py',
        source: `x = 10

if x > 0:
    print("x是正数")
elif x == 0:
    print("x是零")
else:
    print("x是负数")`,
        runnable: true,
        expectedOutput: `x是正数`
      },
      notes: '最基础的条件分支结构是if/elif/else语句。if语句是入口，当条件满足时执行相应代码。如果if的条件不满足，程序会依次检查每个elif的条件，一旦找到满足的条件，就执行对应的代码块。如果所有if和elif的条件都不满足，程序会执行else块中的代码。这个结构非常灵活，可以处理多种情况的判断。'
    },

    /* ---------- 6. 三元表达式与条件赋值（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '01 条件分支',
      title: '三元表达式与条件赋值',
      lead: '简单的二选一不必写满四行 if / else，一行就能把值算出来。',
      cards: [
        {
          icon: 'convert',
          heading: '三元表达式 Ternary Expression',
          body: '一种简洁的条件判断写法，把简单的 `if-else` 结构浓缩为一行：`值1 if 条件 else 值2`，提升代码可读性与简洁度。'
        },
        {
          icon: 'variable',
          heading: '条件赋值 Conditional Assignment',
          body: '把三元表达式的计算结果直接赋值给变量，是三元表达式最常见、最实用的应用场景。'
        }
      ],
      note: {
        icon: 'target',
        title: '核心优势',
        text: '相比传统的 `if-else` 语句，三元表达式在处理简单二选一逻辑时，能减少代码行数，使逻辑更加紧凑直观。'
      },
      code: {
        file: 'ternary.py',
        source: `x = 10

# 语法：值1 if 条件 else 值2
result = "Positive" if x > 0 else "Negative"
print(result)

# 场景：根据状态设置变量
is_active = True
status = "Active" if is_active else "Inactive"
print(status)

# 也可以直接写进 print()
n = 7
print("偶数" if n % 2 == 0 else "奇数")`,
        runnable: true,
        expectedOutput: `Positive
Active
奇数`
      },
      notes: '对于简单的条件判断，我们可以使用三元表达式来简化代码。它的语法非常直观，先写满足条件时的值，然后是if条件，最后是不满足条件时的值。\n将三元表达式的结果赋值给变量，就构成了条件赋值。这种写法让代码更加简洁明了，尤其适合处理简单的二选一情况。'
    },

    /* ---------- 7. 分节页 02 ---------- */
    {
      type: 'section',
      num: '02',
      title: '循环结构',
      sub: 'Loop Structures',
      lead: '高效处理重复任务 · For & While',
      notes: '接下来，我们进入第二部分：循环结构。循环是编程中用于重复执行一段代码的强大工具，它能帮助我们高效地处理重复性任务，比如遍历列表、计算累加和等。Python主要提供了两种循环结构：for循环和while循环。'
    },

    /* ---------- 8. for 循环与遍历（单步追踪） ---------- */
    {
      type: 'split',
      traceable: true,
      eyebrow: '02 循环结构',
      title: 'for 循环与遍历迭代',
      lead: 'for 循环的核心是遍历：把列表、字符串这类可迭代对象里的元素依次取出来，每取一个就执行一次循环体。',
      points: [
        '`for 变量 in 可迭代对象:` —— 循环体必须缩进',
        '列表、字符串都可以直接遍历',
        '`range(5)` 生成 `0` 到 `4`，常用来指定循环次数',
        '循环变量每轮自动更新，不需要手动维护'
      ],
      code: {
        file: 'main.py',
        source: `# 1. 遍历列表
fruits = ["apple", "banana"]
for fruit in fruits:
    print(fruit)

# 2. 用 range() 生成数字序列
for i in range(5):
    print(i)`,
        runnable: true,
        expectedOutput: `apple
banana
0
1
2
3
4`
      },
      notes: 'for循环是Python中最常用的循环结构。它的核心是遍历。我们可以直接遍历列表、字符串等数据。'
    },

    /* ---------- 9. range / enumerate / zip（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '02 循环结构',
      title: 'range / enumerate / zip 三大助手',
      lead: 'Python 提供了几个非常实用的内置函数来增强 for 循环：要次数用 `range()`，要索引用 `enumerate()`，要同时遍历多个列表就用 `zip()`。',
      cards: [
        {
          icon: 'sequence',
          heading: 'range() 生成序列',
          body: '生成数字序列，常用于指定循环次数。'
        },
        {
          icon: 'index',
          heading: 'enumerate() 获取索引',
          body: '遍历的同时获取元素的索引值。'
        },
        {
          icon: 'merge',
          heading: 'zip() 并行遍历',
          body: '将多个可迭代对象打包，同时遍历。'
        }
      ],
      code: {
        file: 'helpers.py',
        source: `fruits = ["apple", "banana"]
names = ["小明", "小红"]
scores = [95, 88]

# enumerate()：同时拿到索引和元素
for idx, fruit in enumerate(fruits):
    print(f"Index: {idx}")

# zip()：把多个列表打包，并行遍历
for name, score in zip(names, scores):
    print(f"{name}: {score}")`,
        runnable: true,
        expectedOutput: `Index: 0
Index: 1
小明: 95
小红: 88`
      },
      notes: '同时，Python提供了一些非常实用的内置函数来增强for循环的功能。比如，range函数可以让我们轻松地执行指定次数的循环；enumerate函数可以在遍历元素的同时获取其索引；而zip函数则可以让我们同时遍历多个列表，非常方便。'
    },

    /* ---------- 10. while 循环（单步追踪） ---------- */
    {
      type: 'split',
      traceable: true,
      eyebrow: '02 循环结构',
      title: 'while 循环',
      lead: 'while 不依赖可迭代对象，它只看一个条件：条件为真就一直转，条件为假就停下来。',
      points: [
        '`while 条件:` —— 条件为真时反复执行循环体',
        '适合循环次数不确定的场景',
        '循环体内要让条件有机会变成 `False`，比如 `count += 1`',
        '忘了更新变量，程序就会陷入无限循环'
      ],
      code: {
        file: 'while_demo.py',
        source: `count = 0
while count < 5:
    print(count)
    count += 1                 # 一定要更新变量，否则会无限循环
print(f"循环结束，count = {count}")`,
        runnable: true,
        expectedOutput: `0
1
2
3
4
循环结束，count = 5`
      },
      notes: 'while循环与for循环不同，它不依赖于可迭代对象，而是基于一个条件来决定是否继续循环。这使得它非常适合处理不确定循环次数的场景。但使用时必须小心，确保循环条件最终会变为False，否则会陷入无限循环。'
    },

    /* ---------- 11. break / continue / pass（单步追踪） ---------- */
    {
      type: 'split',
      traceable: true,
      eyebrow: '02 循环结构',
      title: 'break / continue / pass 循环控制',
      lead: '三个关键字让循环更灵活：`break` 直接结束整个循环，`continue` 跳过本轮剩下的代码，`pass` 什么都不做，只占个位置。',
      cards: [
        {
          icon: 'stop',
          heading: 'break',
          body: '立即终止整个循环，程序跳转到循环之后的代码。'
        },
        {
          icon: 'skip',
          heading: 'continue',
          body: '跳过当前迭代的剩余代码，直接进入下一次循环。'
        },
        {
          icon: 'none',
          heading: 'pass',
          body: '空语句，作为占位符使用，不执行任何操作。'
        }
      ],
      note: {
        icon: 'alert',
        title: '提示',
        text: '合理使用循环控制关键字能让程序逻辑更灵活，配合 while 循环需时刻警惕死循环风险。'
      },
      code: {
        file: 'control.py',
        source: `# break：条件满足就结束整个循环
# continue：跳过本轮剩余代码，直接进入下一轮
for n in range(1, 11):
    if n == 8:
        print("遇到 8，提前结束")
        break
    if n % 2 == 0:
        continue
    print(f"奇数：{n}")

# pass：空语句，只占位，不执行任何操作
flag = True
if flag:
    pass                       # 以后再来这里补代码
print("pass 不输出内容，程序继续往下走")`,
        runnable: true,
        expectedOutput: `奇数：1
奇数：3
奇数：5
奇数：7
遇到 8，提前结束
pass 不输出内容，程序继续往下走`
      },
      notes: '此外，我们还可以使用break、continue和pass这三个关键字来更精细地控制循环的流程，让我们的程序更加灵活。'
    },

    /* ---------- 12. 分节页 03 ---------- */
    {
      type: 'section',
      num: '03',
      title: '进阶技巧',
      sub: 'Advanced Techniques',
      lead: '让代码更简洁、更高效，也更像 Python。',
      notes: '掌握了基础的条件分支和循环结构后，我们来学习一些进阶技巧。这些技巧能让你的代码更加简洁、高效，也是区分初级和高级Python程序员的关键所在。'
    },

    /* ---------- 13. 推导式与条件结合（可运行） ---------- */
    {
      type: 'code',
      eyebrow: '03 进阶技巧',
      title: '推导式与条件结合',
      lead: '推导式把「循环 + 条件判断」浓缩进一行代码，是 Python「优雅」哲学的体现。',
      points: [
        '列表推导式：`[表达式 for x in 可迭代对象]`，替代传统的 `for` 循环 + `append`',
        '在推导过程里加一个 `if`，就能边生成边筛选',
        '字典推导式：`{键: 值 for x in ...}`，快速构建键值对映射',
        '核心优势：代码量少、执行速度快、逻辑清晰直观'
      ],
      code: {
        file: 'comprehension.py',
        source: `# 1. 列表推导式：0-9 的平方
squares = [x ** 2 for x in range(10)]
print(squares)

# 2. 结合条件筛选：只保留偶数的平方
even = [x ** 2 for x in range(10) if x % 2 == 0]
print(even)

# 3. 字典推导式：数字 → 平方 的映射
d = {x: x ** 2 for x in range(5)}
print(d)`,
        runnable: true,
        expectedOutput: `[0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
[0, 4, 16, 36, 64]
{0: 0, 1: 1, 2: 4, 3: 9, 4: 16}`
      },
      notes: '推导式是Python的一大特色，它能让你用一行代码完成原本需要多行循环才能实现的功能。\n最常见的是列表推导式，如左图所示，它可以快速生成一个新列表，比如0到9的平方数。\n更强大的是，我们可以在推导式中加入条件判断，如中间的例子，只筛选出偶数的平方，从而在生成数据的同时进行筛选，非常高效。\n除了列表，我们还可以创建字典推导式，如右图，这在处理键值对数据时非常实用。掌握推导式，能让你的Python代码更加Pythonic。'
    },

    /* ---------- 14. 嵌套循环（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '03 进阶技巧',
      title: '嵌套循环',
      lead: '在一个循环内部再写一个循环，常用于处理矩阵、嵌套列表这类二维结构。',
      points: [
        '外层循环每执行一次，内层循环都要从头到尾完整跑一遍',
        '`i` 管行、`j` 管列，两层循环的缩进不能写错',
        '`print()` 不传参数就只输出一个换行，正好用来结束一行'
      ],
      code: {
        file: 'nested.py',
        source: `# 外层循环控制「行」，内层循环控制「列」
for i in range(3):
    for j in range(2):
        print(f"i={i}, j={j}", end=" ")
    print()                  # 内层跑完一轮，换行`,
        runnable: true,
        // end=" " 会让每行末尾多出一个空格，下面 \n 前面的空格不能删
        expectedOutput: 'i=0, j=0 i=0, j=1 \ni=1, j=0 i=1, j=1 \ni=2, j=0 i=2, j=1'
      },
      notes: '嵌套循环是处理复杂数据结构的常用手段，比如遍历一个二维列表。理解嵌套循环的执行顺序非常重要：外层循环每迭代一次，内层循环都会从头执行到尾。'
    },

    /* ---------- 15. Truthy / Falsy（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '03 进阶技巧',
      title: 'Truthy 与 Falsy',
      lead: 'Python 中任何对象都可以被判断为真或假，所以你可以直接把对象放进条件里，不必显式地和 `True` / `False` 比较。',
      points: [
        'Truthy：非零数字、非空序列 / 集合等',
        'Falsy：`0`、`0.0`、`""`、`[]`、`{}`、`None` 等',
        '所以判断列表是否为空，写 `if not my_list:` 就够了',
        '拿不准的时候，用 `bool(值)` 看一眼'
      ],
      code: {
        file: 'truthy.py',
        source: `# 非空字符串是 Truthy
if "Hello":
    print("Truthy string")

# 空列表是 Falsy，所以 not [] 为 True
if not []:
    print("List is empty")

# 这些值都会被判定为 Falsy
for v in [0, 0.0, "", [], {}, None]:
    print(bool(v), repr(v))`,
        runnable: true,
        expectedOutput: `Truthy string
List is empty
False 0
False 0.0
False ''
False []
False {}
False None`
      },
      notes: '另外，理解Python中的Truthy和Falsy值概念也很关键。它允许我们在条件判断中直接使用对象本身，而无需显式地与True或False比较，这让代码更加简洁。例如，检查一个列表是否为空，只需写 if not my_list: 即可。'
    },

    /* ---------- 16. 结尾小结 ---------- */
    {
      type: 'end',
      icon: 'python',
      title: '本章小结',
      lead: '条件分支、循环结构、进阶技巧——这三样构成了 Python 程序的控制逻辑流。',
      cards: [
        {
          icon: 'branch',
          heading: '条件分支',
          body: '`if` / `elif` / `else` 依次判断、命中即停；简单二选一用三元表达式'
        },
        {
          icon: 'loop',
          heading: '循环结构',
          body: '`for` 负责遍历，`while` 负责按条件重复，`break` / `continue` / `pass` 精细控场'
        },
        {
          icon: 'sparkle',
          heading: '进阶技巧',
          body: '推导式一行顶一个循环，嵌套循环处理二维结构，Truthy / Falsy 让判断更简洁'
        }
      ],
      notes: '本章的内容就到这里。我们回顾了条件分支、循环结构以及一些进阶技巧，这些都是Python编程的基础和核心。希望通过这次学习，大家能对Python的控制逻辑流有更深入的理解，并能熟练运用这些知识解决实际问题。感谢大家的观看！'
    }
  ];
})(window);
