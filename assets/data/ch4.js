/* ============================================================
   第四章 · 代码复用：函数与模块

   代码说明：原 PPT 里的代码块缩进全部丢失、注释写成了 //、
   等号两侧空格错乱，还有跨文本框拆散的碎片，无法直接运行。
   此处所有代码都已按 Python 语法重新校订，并由
   tools/verify_examples.mjs 实际跑通验证，expectedOutput 是真实输出。

   模块部分：PPT 演示的 import math_operations 需要 math_operations.py
   真实存在。示例用 files 预置了这个模块文件；同时示例开头用
   open() 把同一份内容写进虚拟磁盘，这样这段代码在任何环境
  （浏览器 Pyodide / 本地 python3）里都能独立运行。
   ============================================================ */
(function (global) {
  'use strict';
  global.PYT = global.PYT || {};
  global.PYT.data = global.PYT.data || {};

  global.PYT.data.ch4 = [

    /* ---------- 1. 封面 ---------- */
    {
      type: 'title',
      eyebrow: '第四章',
      title: '代码复用：函数与模块',
      lead: '像搭积木一样，写出优雅、高效、可复用的代码',
      notes: '大家好，欢迎来到第四章的学习。本章的主题是“复用”，我们将学习如何使用函数和模块，写出更优雅、高效且易于维护的代码。这是从初级程序员迈向中级程序员的关键一步。'
    },

    /* ---------- 2. 知识地图 ---------- */
    {
      type: 'map',
      eyebrow: '本章脉络',
      title: '一张图看懂本章',
      lead: '函数是零件，模块是工具箱，库是现成的整套工具——复用的尺度一层比一层大。',
      map: {
        aria: '本章知识地图：定义与调用函数、函数的四种参数、返回值与作用域、Lambda 表达式、模块与库',
        root: { title: '第四章 · 代码复用', sub: '函数与模块' },
        branches: [
          {
            title: '定义与调用',
            sub: '把逻辑打包成积木',
            leaves: [
              { title: 'def 关键字', sub: '函数名 · 参数 · 函数体' },
              { title: '调用函数', sub: '函数名(参数)' },
              { title: '文档字符串', sub: '"""说明功能"""' }
            ]
          },
          {
            title: '函数的参数',
            sub: '四种输入方式',
            leaves: [
              { title: '位置参数', sub: '顺序必须一致' },
              { title: '关键字参数', sub: '写明名字，顺序随意' },
              { title: '默认参数', sub: '不传就用默认值' },
              { title: '可变参数', sub: '*args / **kwargs' }
            ]
          },
          {
            title: '产出与作用域',
            sub: '结果与活动范围',
            leaves: [
              { title: 'return 返回值', sub: '单个值 / 元组' },
              { title: '局部变量', sub: '只在函数内可见' },
              { title: 'global 全局', sub: '函数内改全局要声明' }
            ]
          },
          {
            title: 'Lambda 表达式',
            sub: '一次性的小函数',
            leaves: [
              { title: 'lambda 语法', sub: '匿名函数，一行搞定' },
              { title: 'map 与 filter', sub: '高频使用场景' }
            ]
          },
          {
            title: '模块与库',
            sub: '更高层级的复用',
            leaves: [
              { title: '一个 .py 即模块', sub: '文件级代码复用' },
              { title: 'import 三种写法', sub: '整包 / 别名 / 单个成员' },
              { title: '标准库与第三方库', sub: '站在巨人的肩膀上' }
            ]
          }
        ]
      },
      notes: '这张图是本章的全貌。前半程围绕函数展开：怎么定义、怎么调用、参数怎么传、结果怎么拿，以及变量在什么范围内活动。后半程把视野抬高一层——把函数装进一个 .py 文件就成了模块，把模块攒起来就成了库。抓住“从小到大”这条线索，复用的思路就通了。'
    },

    /* ---------- 3. 分节页 01 ---------- */
    {
      type: 'section',
      num: '01',
      title: '函数：代码的积木块',
      sub: '把一段逻辑打包起来，随取随用',
      lead: '这一部分回答四个问题：函数是什么、怎么定义和调用、参数怎么传、结果怎么拿。',
      notes: '我们先从最小的复用单元开始——函数。这一部分要弄清楚四件事：函数到底是什么、怎么定义和调用它、参数怎么传进去、结果怎么拿出来。把这四件事弄清楚，你就有了封装逻辑的能力。'
    },

    /* ---------- 4. 什么是函数 ---------- */
    {
      type: 'cards',
      eyebrow: '认识函数',
      title: '什么是函数？—— 代码的“积木块”',
      lead: '函数是一段组织好的、可以重复使用的代码，负责实现一个特定的功能。就像把原材料（输入）放进加工厂，经过处理，产出成品（输出）。',
      cards: [
        {
          icon: 'blocks',
          heading: '代码复用',
          body: '封装重复逻辑，一次编写多次调用。\n比如计算圆面积，定义一次函数，之后每次只需调用函数名。'
        },
        {
          icon: 'layers',
          heading: '结构模块化',
          body: '化繁为简，把复杂问题拆成小模块，让程序结构清晰。'
        },
        {
          icon: 'wrench',
          heading: '易维护性',
          body: '一处修改，所有调用处同步生效——再也不用改几十处。'
        },
        {
          icon: 'bulb',
          heading: '高可读性',
          body: '语义化命名，逻辑一目了然。\n`calculate_area(r)` 比散落的公式好读得多。'
        }
      ],
      note: {
        icon: 'target',
        title: '关键记忆公式',
        text: '函数 = 输入（参数）+ 处理（逻辑）+ 输出（返回值）'
      },
      notes: '那么，什么是函数呢？简单来说，函数就是代码的“积木块”。它是一段组织好的、可以重复使用的代码，负责实现一个特定的功能。\n大家可以把函数想象成一个“加工厂”。我们给它一些原材料，也就是“参数”；它在内部进行一系列的加工操作；最后，产出我们需要的产品，也就是“返回值”。\n通过使用函数，我们可以实现代码复用、模块化、提高可维护性和可读性。比如计算圆的面积，定义一次函数，之后每次计算只需调用函数名即可，既高效又不易出错。'
    },

    /* ---------- 5. 定义与调用（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '动手试试',
      title: '如何定义和使用函数？',
      lead: '定义函数是“写配方”，调用函数是“照着做菜”。定义好的函数不会自己执行，必须调用它。',
      points: [
        '用 `def` 声明函数：函数名、参数列表、函数体三件套',
        '函数体要缩进 4 个空格，这一层缩进就是“属于这个函数”的标志',
        '`"""说明"""` 是文档字符串，用来描述函数的功能',
        '调用函数：`函数名(参数)`，传入的实参数量要和形参匹配',
        '`return` 把计算结果交回给调用者，没有 `return` 则返回 `None`'
      ],
      code: {
        file: 'define.py',
        source: `# 定义函数：def 关键字
def greet(name):
    """问候函数：向指定的人打招呼"""
    print(f"Hello, {name}!")

def add(a, b):
    """累加函数：将 a 和 b 相加并返回结果"""
    return a + b

# 调用函数：函数名 + 括号
greet("Alice")
sum_val = add(5, 3)
print(sum_val)`,
        runnable: true,
        expectedOutput: `Hello, Alice!
8`
      },
      notes: '在 Python 中，我们使用 def 关键字来定义函数。定义好函数后，就可以通过函数名加括号的方式来调用它。这里展示了两个简单的例子：一个打招呼的函数和一个计算加法的函数，大家可以看到定义和调用的基本语法。'
    },

    /* ---------- 6. 位置参数与关键字参数（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '函数的输入 · 一',
      title: '灵活的输入：位置参数与关键字参数',
      lead: '核心区别：位置参数看顺序，关键字参数看名字（键值对）。',
      points: [
        '位置参数：调用时实参顺序必须与形参完全一致，顺序错了结果就错了',
        '关键字参数：用 `键=值` 的形式传递，参数顺序就无关紧要了',
        '参数一多，关键字参数能让代码自解释，可读性极强，推荐使用'
      ],
      code: {
        file: 'params.py',
        source: `def describe_pet(animal_type, name):
    print(f"I have a {animal_type}.")
    print(f"My {animal_type}'s name is {name}.")

# 位置参数：顺序必须与形参完全一致
describe_pet('hamster', 'Harry')

# 顺序颠倒不会报错，但结果是滑稽的
describe_pet('Harry', 'hamster')

# 关键字参数：写明“参数名=值”，顺序随意
describe_pet(animal_type='dog', name='Willie')
describe_pet(name='Willie', animal_type='dog')`,
        runnable: true,
        expectedOutput: `I have a hamster.
My hamster's name is Harry.
I have a Harry.
My Harry's name is hamster.
I have a dog.
My dog's name is Willie.
I have a dog.
My dog's name is Willie.`
      },
      notes: '函数的参数传递方式非常灵活。最基础的是位置参数，要求实参和形参的顺序严格对应。\n为了避免顺序错误，我们可以使用关键字参数，通过“键-值”对的形式传递，这样参数的顺序就无关紧要了，代码也更清晰。'
    },

    /* ---------- 7. 默认参数与可变参数（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '函数的输入 · 二',
      title: '更智能的输入：默认参数与可变参数',
      lead: '默认参数让调用更省事，可变参数让函数更通用——想要几个参数就给几个。',
      points: [
        '默认参数：定义时给参数一个默认值，调用时没传就自动用它',
        '传了实参就用传进来的值，也就是“覆盖默认值”',
        '`*args`：接收任意数量的位置参数，打包成元组',
        '`**kwargs`：接收任意数量的关键字参数，打包成字典'
      ],
      code: {
        file: 'params2.py',
        source: `# 默认参数：不传 animal 时就用 'dog'
def describe_pet(pet_name, animal='dog'):
    print(f"I have a {animal}.")
    print(f"My {animal}'s name is {pet_name}.")

describe_pet('Willie')              # 使用默认值
describe_pet('Harry', 'hamster')    # 覆盖默认值

# 可变参数：*args 收位置参数，**kwargs 收关键字参数
def make_pizza(*toppings):
    print(toppings)                 # 打包成元组
    for t in toppings:
        print(f"- {t}")

def build_profile(first, last, **info):
    info['first'] = first
    info['last'] = last
    return info

make_pizza('mushrooms', 'pepperoni')
print(build_profile('albert', 'einstein', location='princeton'))`,
        runnable: true,
        expectedOutput: `I have a dog.
My dog's name is Willie.
I have a hamster.
My hamster's name is Harry.
('mushrooms', 'pepperoni')
- mushrooms
- pepperoni
{'location': 'princeton', 'first': 'albert', 'last': 'einstein'}`
      },
      notes: '除了位置和关键字参数，Python 还提供了更智能的参数类型。默认参数允许我们为参数设置默认值，使函数调用更灵活。而可变参数 *args 和 **kwargs 则允许函数接收任意数量的参数，极大地增强了函数的通用性。'
    },

    /* ---------- 8. return 语句（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '函数的产出',
      title: '函数的“产出”：return 语句',
      lead: '函数执行到 `return` 就立即结束，并把后面的值交回给调用者。',
      points: [
        '返回单个值：调用处可以直接用变量接住',
        '返回多个值：Python 会自动把它们打包成一个**元组**',
        '解包接收：`add, mul = calculate(3, 4)`',
        '没有写 `return` 的函数，返回值是 `None`'
      ],
      code: {
        file: 'return.py',
        source: `# 01 返回单个值
def square(x):
    return x * x

result = square(5)
print(result)

# 02 返回多个值：Python 自动打包成元组
def calculate(a, b):
    return a + b, a * b

add, mul = calculate(3, 4)          # 解包接收
print(f"和: {add}, 积: {mul}")
print(calculate(3, 4))              # 原样返回，其实是个元组`,
        runnable: true,
        expectedOutput: `25
和: 7, 积: 12
(7, 12)`
      },
      notes: '函数执行完毕后，可以通过 return 语句向调用者返回结果。我们可以返回单个值，也可以返回多个值。当返回多个值时，Python 会自动将它们打包成一个元组，调用者可以方便地用多个变量来接收。'
    },

    /* ---------- 9. 作用域（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '变量的活动范围',
      title: '变量的“活动范围”：全局与局部',
      lead: '变量不是在哪里都能访问的，它有自己的活动范围，这就是作用域。',
      points: [
        '局部变量：在函数内部定义，只能在函数内部访问，外部拿不到',
        '全局变量：在函数外部定义，整个程序范围内都能访问，函数内部也能读',
        '想在函数内部**修改**全局变量，必须先声明 `global`',
        '不声明 `global` 就直接赋值，Python 会把它当成一个新的局部变量'
      ],
      code: {
        file: 'scope.py',
        source: `# 1. 局部变量：只能在函数内部访问
def func():
    x = 10                      # 局部变量
    print(f"函数内部：x = {x}")

func()
# print(x)                      # 取消注释会报 NameError：函数外访问不到

# 2. 全局变量：函数内外都能读
y = 20                          # 全局变量
def show():
    print(f"函数内部读全局：y = {y}")

show()
print(f"函数外部读全局：y = {y}")

# 3. 在函数内部修改全局变量，必须先用 global 声明
count = 0
def inc():
    global count
    count += 1

inc()
print(f"调用 inc() 之后：count = {count}")`,
        runnable: true,
        expectedOutput: `函数内部：x = 10
函数内部读全局：y = 20
函数外部读全局：y = 20
调用 inc() 之后：count = 1`
      },
      notes: '变量并不是在任何地方都能访问的，它们有自己的“活动范围”，也就是作用域。\n在函数内部定义的是局部变量，只能在函数内部使用，外部无法访问，就像左卡片展示的 x 变量。\n在函数外部定义的是全局变量，可以在整个程序中访问，包括函数内部，如中间卡片的 y 变量。\n如果需要在函数内部修改全局变量，就需要使用 global 关键字进行声明，否则 Python 会将其视为局部变量，如右侧卡片所示。'
    },

    /* ---------- 10. Lambda 表达式（可运行） ---------- */
    {
      type: 'split',
      eyebrow: '更简洁的写法',
      title: '带有数据的函数：Lambda 表达式',
      lead: '对一些只用一次的短小函数，Python 提供了一种更简洁的定义方式——匿名函数。',
      points: [
        '无需定义函数名，所以也叫匿名函数，语法极简',
        '写法：`lambda 参数: 表达式`，表达式算出来的就是返回值',
        '函数体内可以直接访问外面的变量，把当时的内容一起打包带走',
        '高频场景：作为 `map()`（映射）、`filter()`（过滤）的参数'
      ],
      code: {
        file: 'lambda.py',
        source: `# 普通函数写法
def add(a, b):
    return a + b

# Lambda 写法：一行搞定，连函数名都省了
add2 = lambda a, b: a + b

print(add(2, 3))
print(add2(2, 3))

# 高频场景：作为 map() / filter() 的参数
nums = [1, 2, 3, 4, 5]
print(list(map(lambda n: n * 2, nums)))          # 批量 ×2
print(list(filter(lambda n: n % 2 == 0, nums)))  # 只留偶数`,
        runnable: true,
        expectedOutput: `5
5
[2, 4, 6, 8, 10]
[2, 4]`
      },
      notes: '对于一些简单的函数，Python 提供了一种更简洁的定义方式——Lambda 表达式，也叫匿名函数。它非常适合创建那些只使用一次的短小函数，尤其是在作为 map、filter 等高阶函数的参数时，能让代码更加简洁优雅。'
    },

    /* ---------- 11. 分节页 02 ---------- */
    {
      type: 'section',
      num: '02',
      title: '从函数到模块：代码的工具箱',
      sub: '让复用从“一段代码”升级到“一个文件”',
      lead: '函数解决了重复写一段逻辑的问题；模块解决的是更高层级的组织与复用。',
      notes: '函数解决了“一段代码重复写”的问题。但代码一多，还需要更高层级的组织方式——这就是模块。一个 .py 文件就是一个工具箱，把相关的函数装进去，哪里需要就导入到哪里；再往上，是 Python 庞大的库生态。'
    },

    /* ---------- 12. 从函数到模块 ---------- */
    {
      type: 'cards',
      eyebrow: '认识模块',
      title: '从函数到模块：代码的“工具箱”',
      lead: '一个 `.py` 文件就是一个模块，里面可以装着各种函数、变量和类。',
      cards: [
        {
          icon: 'file',
          heading: '01 核心定义',
          body: '一个 `.py` 文件就是一个模块，可以包含函数、类、变量及可执行的代码。'
        },
        {
          icon: 'layers',
          heading: '02 核心价值',
          body: '• 更高复用：实现文件级的代码复用\n• 避免冲突：隔离命名空间\n• 结构清晰：利于大型项目协作维护'
        },
        {
          icon: 'toolbox',
          heading: '03 形象类比',
          body: '函数是单个工具（螺丝刀），模块是装满工具的工具箱。'
        }
      ],
      note: {
        icon: 'bulb',
        title: '核心洞察',
        text: '模块是组织代码的更高层级，让你的编程工作从“零散零件”升级为“标准化组件”。'
      },
      notes: '学完了函数，我们来看看更高层次的代码组织方式——模块。简单来说，一个 .py 文件就是一个模块。它就像一个工具箱，里面可以装着各种函数、变量和类。使用模块可以实现文件级别的代码复用，避免命名冲突，并让大型项目的结构更加清晰。'
    },

    /* ---------- 13. 创建模块（可运行） ---------- */
    {
      type: 'code',
      eyebrow: '如何制作和使用自己的工具盒？',
      title: '第一步：创建模块 —— 保存为 .py 文件',
      lead: '把功能代码封装并保存成 `.py` 后缀的文件，一个自定义模块就诞生了。下面就是我们的数学工具盒。',
      points: [
        '文件名（去掉 `.py`）就是模块名，所以这个文件叫 `math_operations.py`',
        '模块里可以放常量、函数、类，它们都是工具箱里的工具',
        '`if __name__ == "__main__":` 里的代码只在直接运行本文件时执行，被 `import` 时不会执行'
      ],
      code: {
        file: 'math_operations.py',
        source: `# math_operations.py —— 一个 .py 文件就是一个模块
# 文件名（去掉 .py）就是模块名

PI = 3.14159                    # 模块里的常量

def add(a, b):
    return a + b

def circle_area(r):
    return PI * r * r

# 直接运行本文件时执行；被 import 时不会执行
if __name__ == "__main__":
    print("This is the math module.")`,
        runnable: true,
        expectedOutput: `This is the math module.`
      },
      notes: '创建模块非常简单，把代码保存成 .py 文件就行。'
    },

    /* ---------- 14. import 三种写法（可运行） ---------- */
    {
      type: 'code',
      eyebrow: '如何制作和使用自己的工具盒？',
      title: '第二步：使用模块 —— import 的三种写法',
      lead: '工具盒做好了，接下来把它拿进来用。三种写法各有各的适用场景。',
      points: [
        '方法一 `import 模块名`：最通用，用 `模块名.成员` 访问',
        '方法二 `import 模块名 as 别名`：起个短名字，代码更简洁',
        '方法三 `from 模块名 import 成员`：只拿需要的成员，直接用名字访问'
      ],
      code: {
        file: 'main.py',
        source: `# ① 把工具盒保存成 math_operations.py
#   （网页环境已预置；现实中在编辑器里新建这个文件即可）
with open('math_operations.py', 'w') as f:
    f.write('''PI = 3.14159

def add(a, b):
    return a + b

def circle_area(r):
    return PI * r * r

if __name__ == "__main__":
    print("This is the math module.")
''')

# ② 方法一：导入整个模块（最通用）
import math_operations
print(math_operations.PI)

# ③ 方法二：导入并指定别名（更简洁）
import math_operations as mo
print(mo.add(2, 3))

# ④ 方法三：只导入特定成员（最灵活）
from math_operations import circle_area
print(circle_area(1))`,
        files: {
          'math_operations.py': `PI = 3.14159

def add(a, b):
    return a + b

def circle_area(r):
    return PI * r * r

if __name__ == "__main__":
    print("This is the math module.")
`
        },
        runnable: true,
        expectedOutput: `3.14159
5
3.14159`
      },
      note: {
        icon: 'alert',
        title: '网页环境说明',
        text: '网页版已经在虚拟磁盘里预置了 `math_operations.py`；示例开头那段 `with open(...)` 负责把同一个文件写出来，因此这段代码复制到本地 python3 里也一样能跑。注意输出里没有那句 `This is the math module.`——被 `import` 时，`__main__` 块不会执行。'
      },
      notes: '使用模块则需要用到 import 语句。我们可以导入整个模块，也可以只导入模块中的特定函数或变量，还可以给模块起一个别名，让代码更简洁。'
    },

    /* ---------- 15. 标准库与第三方库（可运行） ---------- */
    {
      type: 'cards',
      eyebrow: '站在巨人的肩膀上',
      title: '标准库与第三方库',
      lead: 'Python 生态的核心力量：开箱即用的标准工具 + 无限扩展的社区智慧。',
      cards: [
        {
          icon: 'package',
          heading: '标准库 (Standard Library)',
          body: '安装时自带的模块集合，无需额外安装，开箱即用。\n常用：`math`、`random`、`json` 等。'
        },
        {
          icon: 'download',
          heading: '第三方库 (Third-Party Libraries)',
          body: '社区贡献的扩展库，需要 `pip` 安装。\n常用：`pandas`（数据）、`requests`（网络）、`django`（Web）。'
        }
      ],
      note: {
        icon: 'alert',
        title: '关于 pip 与 requests',
        text: '`pip install requests` 是终端命令，不是 Python 语句，所以它不在右边的代码块里。网页环境也没有网络通道，真实发起请求会失败——这里只演示安装命令的写法：`pip install requests`，装好之后就能 `import requests` 来用了。'
      },
      code: {
        file: 'stdlib.py',
        source: `# 标准库：随 Python 一起安装，无需额外配置
import math
import random

print(math.sqrt(16))        # 开平方
print(math.pi)              # 圆周率

# random 每次结果都不同，固定随机种子后才好对照输出
random.seed(7)
print(random.randint(1, 100))
print(random.choice(['A', 'B', 'C']))`,
        runnable: true,
        expectedOutput: `4.0
3.141592653589793
42
A`
      },
      notes: 'Python 的强大之处在于其丰富的库生态。标准库是 Python 自带的工具集，开箱即用。而海量的第三方库则极大地扩展了 Python 的能力，覆盖了数据分析、Web 开发等各个领域。学会使用这些库，就是站在巨人的肩膀上编程。'
    },

    /* ---------- 16. 本章总结 ---------- */
    {
      type: 'cards',
      eyebrow: '回顾',
      title: '本章总结：回顾与要点',
      lead: '函数、模块、库——从小到大的三层复用，构成了本章的主线。',
      cards: [
        {
          icon: 'fn',
          heading: '核心：函数 (Function)',
          body: '• 定义：使用 `def` 关键字\n• 参数：位置 / 关键字 / 默认 / 可变\n• 作用域：区分局部与全局变量\n• 特殊：Lambda 匿名函数'
        },
        {
          icon: 'module',
          heading: '结构：模块 (Module)',
          body: '• 本质：一个 `.py` 文件即一个模块\n• 导入：使用 `import` 语句\n• 作用：组织代码、封装功能\n• 优势：避免命名冲突，便于维护'
        },
        {
          icon: 'package',
          heading: '工具：库 (Library)',
          body: '• 标准库：随 Python 安装，开箱即用\n• 第三方库：需 `pip` 安装扩展功能\n• 核心价值：避免重复造轮子\n• 场景：数据处理、Web 开发等'
        }
      ],
      note: {
        icon: 'target',
        title: '核心思想',
        text: '将复杂问题拆解为小模块，通过函数和库实现代码复用，这是编写高质量代码的关键。'
      },
      notes: '让我们来回顾一下本章的核心要点。我们学习了函数的定义、参数、返回值和作用域，以及 lambda 表达式。我们还了解了模块的概念，如何创建和使用模块，以及强大的标准库和第三方库。核心思想就是通过模块化和复用，编写出更高质量的代码。'
    },

    /* ---------- 17. 动手实践 ---------- */
    {
      type: 'cards',
      eyebrow: '练习与思考',
      title: '动手实践：练习与思考',
      lead: '理论学习之后，实践是巩固知识的最好方式。下面四道题，从函数一直练到模块。',
      cards: [
        {
          icon: 'convert',
          heading: '01 温度转换',
          body: '编写两个函数：摄氏度转华氏度（`C * 9 / 5 + 32`）与反向转换，实现温度的双向换算。'
        },
        {
          icon: 'object',
          heading: '02 个人信息收集',
          body: '定义函数构建个人信息字典，参数包含名、姓及可选年龄；没有传年龄时，字典里不显示该键。'
        },
        {
          icon: 'module',
          heading: '03 创建模块',
          body: '把温度转换函数保存为 `temperature.py`，在新文件中导入并调用，体验模块化编程。'
        },
        {
          icon: 'random',
          heading: '04 猜数字游戏',
          body: '使用 `random` 模块生成 1–100 的随机数，编写逻辑让用户循环猜测直到猜对。'
        }
      ],
      note: {
        icon: 'bulb',
        title: '学习小贴士',
        text: '动手敲代码是掌握编程的最佳捷径，记得边写边思考代码逻辑哦！第 4 题要反复读入玩家的猜测，而网页环境没有键盘输入通道，可以先把猜测序列写成一个列表来模拟 `input()`。'
      },
      notes: '理论学习之后，实践是巩固知识的最好方式。这里有几个练习题，包括温度转换、创建模块以及使用标准库编写小游戏。希望大家能动手尝试，真正掌握本章的内容。'
    },

    /* ---------- 18. Q & A ---------- */
    {
      type: 'end',
      icon: 'python',
      title: 'Q & A',
      lead: '再接再厉！欢迎提出疑问与建议，让我们一起交流探讨技术细节，共同进步。',
      cards: [
        { icon: 'fn', heading: '函数', body: '把一段逻辑封装起来，一次编写、多次调用' },
        { icon: 'module', heading: '模块', body: '一个 `.py` 文件就是一个工具箱' },
        { icon: 'package', heading: '库', body: '标准库开箱即用，第三方库站在巨人的肩膀上' }
      ],
      notes: '本章的内容就到这里。感谢大家的聆听！现在是提问环节，欢迎大家就本章内容提出任何疑问，我们一起交流探讨。'
    }
  ];
})(window);
