/* ============================================================
   第六章 · 文件读写与异常

   代码说明：原 PPT 里的代码块缩进全部丢失、注释用了 `//`（在 Python 里
   是语法错误）、并混入了全角标点，无法直接运行；try / except / with
   还被拆散在不同的文本框里。此处所有代码都已重新校订补全，并由
   tools/verify_examples.mjs 实际跑通验证，expectedOutput 是真实输出。

   运行环境说明：网页版跑在 Pyodide 的内存虚拟文件系统里，open() 可以
   正常使用，但要读的文件必须先存在。因此下面每个例子都先用代码把文件
   写出来，再读它 —— 这样一次运行就能看到完整的「写入 → 读取」流程。
   ============================================================ */
(function (global) {
  'use strict';
  global.PYT = global.PYT || {};
  global.PYT.data = global.PYT.data || {};

  global.PYT.data.ch6 = [

    /* ---------- 1. 封面 ---------- */
    {
      type: 'title',
      eyebrow: '第六章',
      title: '文件读写与异常',
      lead: '让程序拥有持久记忆 · 让错误的处理从主流程中分离出去',
      notes: '大家好，欢迎来到第六章的学习。本章我们将探讨两个非常重要的主题：文件读写和异常处理。它们分别让我们的程序学会了如何“记忆”数据和如何“应对意外”，是编写健壮程序的关键。'
    },

    /* ---------- 2. 知识地图 ---------- */
    {
      type: 'map',
      eyebrow: '本章脉络',
      title: '一张图看懂本章',
      lead: '两条线索：一条让程序「记得住」数据，一条让程序「摔不坏」。学完本章，你将能够理解文件操作、掌握文件读写、认识并学会异常处理，最终编写出能处理文件、并优雅应对错误的程序。',
      map: {
        aria: '本章知识地图：文件读写与异常处理',
        root: { title: '第六章 · 文件读写与异常', sub: '掌握数据持久化，构建鲁棒性程序' },
        branches: [
          {
            title: '文件读写',
            sub: '让程序拥有持久记忆',
            leaves: [
              { title: '为什么需要文件', sub: '持久化 / 交换 / 配置' },
              { title: '操作三步曲', sub: '打开 → 读写 → 关闭' },
              { title: '打开模式', sub: 'r / w / a' },
              { title: 'with 语句', sub: '自动关闭，更安全' }
            ]
          },
          {
            title: '异常处理',
            sub: '让错误处理从主流程分离',
            leaves: [
              { title: '什么是异常', sub: '运行时的意外' },
              { title: '常见异常类型', sub: '文件 / 除零 / 参数' },
              { title: 'try...except', sub: '捕获并处理' },
              { title: 'else 与 finally', sub: '更精细的控制流' }
            ]
          }
        ]
      },
      notes: '在本章结束时，大家将能够理解文件操作的意义，掌握文件读写的基本方法，并学会如何使用异常处理机制来提高程序的健壮性，最终编写出能够处理文件并优雅应对错误的程序。'
    },

    /* ---------- 3. 分节：文件读写 ---------- */
    {
      type: 'section',
      num: '01',
      title: '持久化存储 · 文件读写',
      sub: '让程序拥有持久记忆',
      lead: '文件是程序与外部世界交换数据最通用的接口。这一节我们从「为什么需要文件」讲到「怎样读写才安全」。'
    },

    /* ---------- 4. 为什么需要读写文件 ---------- */
    {
      type: 'cards',
      eyebrow: '场景与动机',
      title: '为什么程序需要读写文件？',
      lead: '程序运行时的数据都待在内存里，一旦程序退出就消失了。想让数据留下来、想让别的程序也能用，就得落到文件上。',
      cards: [
        {
          icon: 'fileWrite',
          heading: '1. 数据持久化',
          body: '将内存中的临时数据写入硬盘，实现程序退出后数据依然长期保存。\n场景：游戏存档、软件配置'
        },
        {
          icon: 'copy',
          heading: '2. 数据交换',
          body: '文件是程序间通用的数据接口，一个程序的输出文件可直接作为另一个程序的输入。\n场景：爬虫数据、数据分析'
        },
        {
          icon: 'wrench',
          heading: '3. 配置存储',
          body: '将运行参数保存在外部文件中，无需修改代码即可灵活调整程序的行为和逻辑。\n场景：服务器参数、游戏设置'
        }
      ],
      note: {
        icon: 'target',
        title: '核心目标',
        text: '掌握数据持久化方法，构建能够抵御错误输入的鲁棒性程序。'
      },
      notes: '首先，我们来理解为什么程序需要读写文件。主要有三个原因：数据持久化，即将内存中的数据保存到硬盘；数据交换，即不同程序通过文件共享数据；以及配置存储，即用文件来保存程序的设置。'
    },

    /* ---------- 5. 三步曲（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '核心流程',
      title: '操作文件的「三步曲」',
      lead: 'Open → Operate → Close。顺序不能乱，最后一步尤其不能省。',
      points: [
        '**1. 打开 (Open)**　建立连接，获取操作文件的「句柄」。句柄其实就是在程序里面文件的「身份证号」。',
        '**2. 读写 (Read/Write)**　通过句柄读取内容或写入新数据。',
        '**3. 关闭 (Close)**　释放系统资源，确保数据写入硬盘。',
        '打开时用 `\'w\'` 模式，文件不存在会自动创建；写完再用 `\'r\'` 模式读回来验证。'
      ],
      code: {
        file: 'three_steps.py',
        source: `# 第 1 步：打开文件（'w' 模式，文件不存在会自动创建）
file = open('test.txt', 'w', encoding='utf-8')

# 第 2 步：读写数据
file.write("Hello, 文件！\\n")
file.write("第二行内容\\n")

# 第 3 步：关闭文件，释放系统资源
file.close()

# 再看看写进去的内容
with open('test.txt', 'r', encoding='utf-8') as f:
    print(f.read())`,
        runnable: true,
        expectedOutput: `Hello, 文件！
第二行内容`
      },
      note: {
        icon: 'alert',
        title: '重要提醒',
        text: '忘记关闭文件是初学者最常见的错误，可能导致资源泄漏或数据丢失！'
      },
      notes: '操作文件通常遵循“打开-操作-关闭”的三步曲。首先用open函数打开文件，然后进行读写操作，最后一定要用close函数关闭文件，以释放资源。'
    },

    /* ---------- 6. 打开模式详解 ---------- */
    {
      type: 'compare',
      eyebrow: '关键细节',
      title: '文件打开模式详解',
      lead: '模式写在 `open()` 的第二个参数里，比如 `open(\'file.txt\', \'r\')`。选错模式，轻则读不到东西，重则把原文件清空。',
      table: {
        head: ['模式', '含义', '文件不存在时', '文件已存在时'],
        rows: [
          ['`r`', '只读（默认模式）', '抛出 `FileNotFoundError`', '从开头读取'],
          ['`w`', '只写', '自动创建新文件', '**清空并覆盖**原有内容'],
          ['`a`', '追加', '自动创建新文件', '在文件末尾追加数据'],
          ['`r+`', '读写', '抛出 `FileNotFoundError`', '可读可写，写入从开头覆盖'],
          ['`b`', '二进制模式', '配合其他模式使用（如 `rb`）', '用于图片、视频等二进制文件']
        ]
      },
      note: {
        icon: 'alert',
        title: '核心警告',
        text: '使用 `w` 模式前务必确认！该模式会直接清空并覆盖文件原有内容，数据不可恢复。'
      },
      notes: '在打开文件时，我们需要指定模式。r是只读，w是写入并会覆盖文件，a是追加。特别要注意，w模式会清空文件原有内容，使用时一定要小心。'
    },

    /* ---------- 7. 模式实测（可运行） ---------- */
    {
      type: 'code',
      eyebrow: '动手试试',
      title: '模式实测：覆盖还是追加？',
      lead: '同一份 `notes.txt`，先用 `a` 追加一次，再用 `w` 写一次，看看文件的命运有什么不同。',
      points: [
        '`a` 追加模式：在末尾添内容，原有的一行都不会少',
        '`w` 模式：一打开文件就已经清空了，之前追加的全白费',
        '写中文时一定要带 `encoding="utf-8"`，否则容易出现乱码'
      ],
      code: {
        file: 'modes.py',
        source: `# 先用 'w' 模式写入初始内容
with open('notes.txt', 'w', encoding='utf-8') as f:
    f.write("第一行\\n第二行\\n")

# 'a' 追加模式：在文件末尾追加，不覆盖原有内容
with open('notes.txt', 'a', encoding='utf-8') as f:
    f.write("第三行\\n")

with open('notes.txt', 'r', encoding='utf-8') as f:
    print("追加后的内容：")
    print(f.read())

# 'w' 模式：先清空，再写入
with open('notes.txt', 'w', encoding='utf-8') as f:
    f.write("只剩这一行\\n")

with open('notes.txt', 'r', encoding='utf-8') as f:
    print("被 'w' 覆盖后：")
    print(f.read())`,
        runnable: true,
        expectedOutput: `追加后的内容：
第一行
第二行
第三行

被 'w' 覆盖后：
只剩这一行`
      },
      notes: '这里的对比非常直观：a 模式像在本子后面续写，w 模式则是把本子撕掉重写。所以保存日志、追加记录时用 a，而 w 只在你确实想重新开始时才用。'
    },

    /* ---------- 8. with 语句 ---------- */
    {
      type: 'split',
      eyebrow: '最佳实践',
      title: '推荐的文件操作方式：with 语句',
      lead: '它替你把「关闭」这件事包了下来 —— 代码块一结束就自动关闭，哪怕中间抛了异常也一样。',
      cards: [
        {
          icon: 'bug',
          heading: '传统方式：冗长且易错',
          body: '要自己 `open()`、自己 `close()`；为了在出错时也能关闭，还得套一层 `try-finally`。**容易遗漏 `close()`**，造成资源泄漏。'
        },
        {
          icon: 'shield',
          heading: 'with 语句：简洁且安全',
          body: '结构清晰、可读性强；**无论是否发生异常**，离开 `with` 块都会自动关闭文件，资源自动释放。'
        }
      ],
      code: {
        file: 'with_demo.py',
        source: `# 传统方式：手动打开，必须记得手动关闭
file = open('demo.txt', 'w', encoding='utf-8')
try:
    file.write("传统方式写入的内容\\n")
finally:
    file.close()

# 推荐方式：with 语句，离开代码块自动关闭
with open('demo.txt', 'r', encoding='utf-8') as file:
    content = file.read()

print(content, end='')
print("离开 with 块后，文件是否已关闭：", file.closed)`,
        runnable: true,
        expectedOutput: `传统方式写入的内容
离开 with 块后，文件是否已关闭： True`
      },
      note: {
        icon: 'sparkle',
        title: '核心建议',
        text: '从一开始就养成使用 `with` 语句操作文件的好习惯！'
      },
      notes: '为了避免忘记关闭文件的问题，Python提供了更优雅的with语句。它能自动管理文件资源，代码块结束后自动关闭文件，既简洁又安全。我们应该从一开始就养成使用with语句的好习惯。'
    },

    /* ---------- 9. 分节：异常处理 ---------- */
    {
      type: 'section',
      num: '02',
      title: '程序健壮性 · 异常处理',
      sub: '让错误的处理从主流程中分离出去',
      lead: '程序不可能永远遇见正确的输入。这一节我们学会在意外发生时「接住」它，而不是让程序直接崩溃。'
    },

    /* ---------- 10. 什么是异常 ---------- */
    {
      type: 'split',
      eyebrow: '问题三 · 什么是异常',
      title: '什么是异常？程序运行中的「意外」',
      lead: '执行时检测到错误会引发异常；如果没人处理，程序就终止并报错。异常处理就像一张安全网，在错误发生时把它接住。',
      cards: [
        {
          icon: 'file',
          heading: 'FileNotFoundError · 文件缺失',
          body: '`open("non_existent_file.txt", "r")`'
        },
        {
          icon: 'calculator',
          heading: 'ZeroDivisionError · 除零错误',
          body: '`result = 10 / 0`'
        },
        {
          icon: 'alert',
          heading: 'ValueError · 参数无效',
          body: '`num = int("abc")`'
        }
      ],
      code: {
        file: 'exceptions.py',
        source: `print("=== 1. 文件缺失 ===")
try:
    with open('non_existent_file.txt', 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError as e:
    print(type(e).__name__, "-> 文件找不到，程序没有崩溃")

print("=== 2. 除以零 ===")
try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(type(e).__name__, "-> 数学上不允许除以零")

print("=== 3. 参数无效 ===")
try:
    num = int("abc")
except ValueError as e:
    print(type(e).__name__, "-> 类型对了，但值不合适")

print("三个异常都已妥善处理，程序正常结束。")`,
        runnable: true,
        expectedOutput: `=== 1. 文件缺失 ===
FileNotFoundError -> 文件找不到，程序没有崩溃
=== 2. 除以零 ===
ZeroDivisionError -> 数学上不允许除以零
=== 3. 参数无效 ===
ValueError -> 类型对了，但值不合适
三个异常都已妥善处理，程序正常结束。`
      },
      notes: '接下来我们谈谈异常。异常就是程序运行时发生的意外情况，比如文件找不到、除以零等。如果不处理这些异常，程序就会直接崩溃。\n左侧我们列出了几个最常见的异常类型：\n1. FileNotFoundError：当你试图打开一个不存在的文件时发生。\n2. ZeroDivisionError：数学上的除以零错误。\n3. ValueError：当你给函数传入了正确类型但不合适的值时，比如试图把字符串转成数字。\n右侧的图片形象地展示了异常处理的作用——它就像一张安全网，在错误发生时能接住它，防止程序直接摔落崩溃。'
    },

    /* ---------- 11. 为什么需要异常处理 ---------- */
    {
      type: 'cards',
      eyebrow: '问题四 · 为什么要处理',
      title: '为什么需要异常处理？',
      lead: '同样一句出错的代码，不处理就是一堆红字和一个死掉程序；处理了，程序还能继续为用户服务。',
      cards: [
        {
          icon: 'shield',
          heading: '防止程序崩溃',
          body: '捕获异常可避免程序因错误直接终止，让系统在遇到问题时能优雅降级并继续运行。'
        },
        {
          icon: 'branch',
          heading: '分离正常和错误流程',
          body: '我们希望错误流程的兜底操作不要混入主要操作流程中，让主流程保持干净、一眼看懂。'
        },
        {
          icon: 'bulb',
          heading: '提供友好的用户提示',
          body: '将开发者视角的技术错误信息，转化为普通用户能理解的通俗语言，提升交互体验与易用性。'
        }
      ],
      notes: '那么为什么需要异常处理呢？它主要有三个作用：防止程序崩溃，让程序更健壮，以及给用户提供友好的错误提示，而不是一堆难懂的代码错误。'
    },

    /* ---------- 12. try...except 机制 ---------- */
    {
      type: 'split',
      eyebrow: '核心语法',
      title: '如何捕获并处理异常：try...except 机制',
      lead: '把可能出错的代码放进 `try`，把出事的应对方案写进 `except`。异常真的发生时，程序走的是 `except`，而不是直接崩溃。',
      cards: [
        {
          icon: 'blocks',
          heading: '语法结构核心',
          body: '把可能引发错误的代码放入 `try` 块。\n针对特定错误类型，在 `except` 块中定义处理逻辑。'
        },
        {
          icon: 'sequence',
          heading: '执行逻辑三步走',
          body: '1. 执行 `try` 子句代码\n2. 若无异常，忽略所有 `except` 子句\n3. 若有异常，匹配并执行首个对应 `except`'
        }
      ],
      code: {
        file: 'try_except.py',
        source: `def read_file(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            content = file.read()
        print("读取成功，内容是：")
        print(content, end='')
    except FileNotFoundError:
        print(f"错误：文件 '{filename}' 不存在")

# 先准备一个真实存在的文件
with open('data.txt', 'w', encoding='utf-8') as f:
    f.write("这是 data.txt 里的内容\\n")

# 情况一：文件存在
read_file('data.txt')

# 情况二：文件不存在（网页版没有键盘输入，用变量代替 input()）
read_file('missing.txt')`,
        runnable: true,
        expectedOutput: `读取成功，内容是：
这是 data.txt 里的内容
错误：文件 'missing.txt' 不存在`
      },
      note: {
        icon: 'alert',
        title: '网页版说明',
        text: '原示例用 `input()` 让用户输入文件名，网页环境没有键盘输入通道。这里改成把文件名直接传给函数，两种情况一次跑完。'
      },
      notes: '我们使用`try...except`语句来捕获异常。把可能出错的代码放在`try`块里，然后在`except`块里处理特定类型的异常。这样，当异常发生时，程序就会执行`except`里的代码，而不是直接崩溃。'
    },

    /* ---------- 13. else 与 finally ---------- */
    {
      type: 'split',
      eyebrow: '进阶控制流',
      title: '更精细的异常控制流：else 和 finally',
      traceable: true,
      lead: '`else` 管「一切顺利之后要做的事」，`finally` 管「无论发生什么都要做的收尾」。',
      points: [
        '**`else`**　当 `try` 中没有抛出任何异常时，跳过 `except`，直接执行 `else`。',
        '**`finally`**　无论是否发生异常、是否匹配到 `except`，`finally` 里的代码**始终**执行。',
        '常用于资源释放：关闭文件、释放网络连接，保证资源不会泄漏。',
        '看代码时留意：`except` 分支里没有使用 `num`，因为 `num` 只在 `try` 成功时才会被赋值。'
      ],
      code: {
        file: 'else_finally.py',
        source: `def convert(text):
    try:
        num = int(text)
    except ValueError:
        print("输入无效！")
    else:
        print(f"你输入的数字是 {num}")
    finally:
        print("无论如何都会执行")

convert("42")
print("-" * 12)
convert("abc")`,
        runnable: true,
        expectedOutput: `你输入的数字是 42
无论如何都会执行
------------
输入无效！
无论如何都会执行`
      },
      notes: '除了 try 和 except，我们还可以使用 else 和 finally 来完善异常处理逻辑。\n首先看左边的 else 子句。它的逻辑很简单：只有当 try 块中的代码完全正常运行，没有触发任何异常时，程序才会执行 else 块里的代码。在示例中，如果用户输入的是有效数字，我们就会在 else 里打印出这个数字。\n再看右边的 finally 子句。它的特点是“强制性”：无论 try 块中是否发生异常，也不管是否匹配到了 except，finally 块里的代码**始终**会被执行。这在编程中非常重要，特别是当你需要释放外部资源（比如关闭打开的文件、释放网络连接）时，把这些清理代码放在 finally 里可以确保资源总是能被正确释放，避免资源泄漏。'
    },

    /* ---------- 14. 实战：安全文件复制程序 ---------- */
    {
      type: 'split',
      eyebrow: '动手试试',
      title: '实战演练：一个安全的文件复制程序',
      lead: '把这一章的两条线索合起来：用 `with` 管资源，用 `try...except` 管意外。一次运行，成功与失败两条路径都跑给你看。',
      cards: [
        {
          icon: 'lock',
          heading: '资源安全管理',
          body: '`with` 语句自动关闭文件，避免因异常导致的资源泄漏，代码更简洁。'
        },
        {
          icon: 'shield',
          heading: '异常防御体系',
          body: '针对文件操作中最常见的「文件不存在」和「权限不足」进行精准捕获。'
        },
        {
          icon: 'terminal',
          heading: '用户交互体验',
          body: '通过控制台输入动态获取路径，适应不同场景，提升程序的灵活性。'
        }
      ],
      code: {
        file: 'copy_file.py',
        source: `def copy_file(source, destination):
    try:
        # 将 source 路径的文件以只读方式打开，句柄命名为 src_file
        with open(source, 'r', encoding='utf-8') as src_file:
            content = src_file.read()
        with open(destination, 'w', encoding='utf-8') as dest_file:
            dest_file.write(content)
        print("文件复制成功。")
    except FileNotFoundError:
        print(f"错误：源文件不存在 {source}")
    except PermissionError:
        print("错误：权限不足")
    except Exception as e:
        print(f"未知错误：{e}")

# 先准备一个源文件
with open('source.txt', 'w', encoding='utf-8') as f:
    f.write("这是要复制的第一行\\n这是第二行\\n")

# 情况一：正常复制
copy_file('source.txt', 'backup.txt')

# 检查复制的结果
with open('backup.txt', 'r', encoding='utf-8') as f:
    print(f.read(), end='')

# 情况二：源文件不存在
copy_file('missing.txt', 'backup.txt')`,
        runnable: true,
        expectedOutput: `文件复制成功。
这是要复制的第一行
这是第二行
错误：源文件不存在 missing.txt`
      },
      note: {
        icon: 'target',
        title: '核心思想',
        text: '将异常处理与主流程分离：主流程只讲「正常该怎么做」，兜底方案集中在 `except` 里。'
      },
      notes: '让我们来看一个综合示例：一个安全的文件复制程序。这个程序结合了文件操作和异常处理，能够处理文件不存在、权限不足等多种错误情况，非常健壮。\n左侧的代码展示了完整的实现逻辑，重点关注try-except代码块的结构。右侧列出了三个关键设计亮点：首先是利用with语句保证了文件资源的安全释放；其次是针对特定错误类型的防御性编程；最后是支持用户输入路径的交互设计。这是一个非常典型的“生产级”小程序模板。'
    },

    /* ---------- 15. 知识点回顾 ---------- */
    {
      type: 'cards',
      eyebrow: '本章回顾',
      title: '本节课核心知识点回顾',
      lead: '文件操作与异常处理，一边一句口诀：资源要用 `with` 管，意外要用 `try` 接。',
      cards: [
        {
          icon: 'fileWrite',
          heading: '文件操作核心要点',
          body: '• 核心目的：数据持久化、交换与配置存储\n• 标准流程：打开 → 读写 → 关闭\n• 常用模式：`r`（读）、`w`（写）、`a`（追加）\n• 最佳实践：`with` 语句自动管理资源释放'
        },
        {
          icon: 'shield',
          heading: '异常处理核心要点',
          body: '• 定义识别：程序运行时的意外或错误\n• 主要目的：防止崩溃，提升健壮性与体验\n• 关键语法：`try...except...finally`\n• 避坑指南：精准捕获已知异常，严禁空 `except`'
        }
      ],
      note: {
        icon: 'bulb',
        title: '一句话总结',
        text: '规范操作资源（`with`） + 精准捕获异常（`try`） = 高质量代码'
      },
      notes: '让我们来回顾一下本章的核心知识点。文件操作的核心是实现数据持久化，最佳实践是使用with语句。异常处理的核心是提高程序健壮性，语法是try...except。'
    },

    /* ---------- 16. 动手练习 ---------- */
    {
      type: 'cards',
      eyebrow: '动手练习',
      title: '动手练习，巩固所学',
      lead: '从最简单的读写练起，一步步走到能真正用起来的小程序。',
      cards: [
        {
          icon: 'file',
          heading: '基础：文件读写',
          body: '1. 编写程序统计文本文件的行数与单词数\n2. 将多行文本输入保存到 `notes.txt` 文件中'
        },
        {
          icon: 'toolbox',
          heading: '进阶：实战与异常',
          body: '1. 实现通讯录程序，将信息存入 `contacts.txt`\n2. 读取数字文件计算平均值，处理 IO 与数值异常'
        },
        {
          icon: 'question',
          heading: '思考：拓展知识',
          body: '1. 探索：Python 还能处理哪些格式？(CSV / JSON)\n2. 挑战：如何继承 `Exception` 类创建自定义异常？'
        }
      ],
      note: {
        icon: 'sparkle',
        title: '实践出真知',
        text: '动手敲代码吧！改一改上面的例子，看看输出会怎么变。'
      },
      notes: '理论学习之后，实践是最好的巩固方式。这里有一些练习题，从基础的文件读写到进阶的通讯录程序，希望大家能动手尝试，真正掌握本章的内容。'
    },

    /* ---------- 17. 结尾 ---------- */
    {
      type: 'end',
      icon: 'python',
      title: '本章小结',
      lead: '感谢大家的聆听与参与，欢迎提出宝贵意见',
      cards: [
        { icon: 'fileWrite', heading: '文件读写', body: '三步曲：打开 → 读写 → 关闭；最佳实践是用 `with` 管好资源' },
        { icon: 'shield', heading: '异常处理', body: '`try...except...finally` 接住意外，让程序优雅地继续或退出' },
        { icon: 'target', heading: '下一步', body: '动手完成练习：文件统计、通讯录、平均值计算' }
      ],
      notes: '本章的内容就到这里。感谢大家的聆听！现在是提问环节，欢迎大家就本章内容提出任何疑问，我们一起交流探讨。'
    }
  ];
})(window);
