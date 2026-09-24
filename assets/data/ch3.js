/* ============================================================
   第三章 · 组合数据容器

   代码说明：原 PPT 里的代码块缩进全部丢失、等号两侧空格被吃掉，
   部分内容还跨文本框拆散了（例如单独一行 `defget_size():`），
   无法直接运行。此处所有代码都已重新校订，并由 tools/verify_examples.mjs
   实际跑通验证，expectedOutput 是真实输出。

   另外：集合的打印顺序不作保证，涉及集合的示例统一先 sorted() 再打印，
   避免输出随 Python 版本或哈希随机化而变化。
   ============================================================ */
(function (global) {
  'use strict';
  global.PYT = global.PYT || {};
  global.PYT.data = global.PYT.data || {};

  global.PYT.data.ch3 = [

    /* ---------- 1. 封面 ---------- */
    {
      type: 'title',
      eyebrow: '第三章',
      title: '组合数据容器',
      lead: '列表 · 元组 · 字典 · 集合 —— 把数据成批组织起来',
      notes: '大家好，欢迎来到本次Python教程的第三章——组合数据容器。在这一章中，我们将系统学习Python中四种最常用的数据容器：列表、元组、字典和集合。这些容器是组织和管理数据的核心工具，掌握它们的特性和用法对于编写高效、清晰的Python代码至关重要。本PPT同样采用卡片式设计，方便大家快速查阅各个数据容器的方法和技巧。'
    },

    /* ---------- 2. 知识地图 ---------- */
    {
      type: 'map',
      eyebrow: '本章脉络',
      title: '一张图看懂本章',
      lead: '四种容器按「怎么存、怎么取」分成两类，再加上三项让代码更利落的进阶技巧。',
      map: {
        aria: '本章知识地图：序列容器、映射与集合容器、进阶技巧',
        root: { title: '第三章 · 组合数据容器', sub: '把数据成批组织起来' },
        branches: [
          {
            title: '序列容器',
            sub: '按位置存放',
            leaves: [
              { title: '列表 List', sub: '有序 · 可变' },
              { title: '元组 Tuple', sub: '有序 · 不可变' }
            ]
          },
          {
            title: '映射与去重',
            sub: '按键取值 / 自动去重',
            leaves: [
              { title: '字典 Dictionary', sub: '键值对映射' },
              { title: '集合 Set', sub: '无序 · 不重复' }
            ]
          },
          {
            title: '进阶技巧',
            sub: '写得更简洁',
            leaves: [
              { title: '推导式 · 星号解包', sub: '一行创建 · 拆开数据' },
              { title: 'zip · enumerate', sub: '并行遍历 · 索引遍历' },
              { title: '浅拷贝 · 深拷贝', sub: '引用与独立副本' }
            ]
          }
        ]
      },
      notes: '这张图是本章的全貌。左边的两类都是「容器」：列表和元组靠位置存取，字典和集合靠键或成员关系存取，它们的差别主要就在有序性、可变性和能否重复这三点上。右边是三项进阶技巧，它们不引入新容器，只是让我们把已有的容器用得更简洁、更安全——尤其是最后的深浅拷贝，是嵌套数据最容易踩坑的地方。'
    },

    /* ---------- 3. 目录 ---------- */
    {
      type: 'toc',
      eyebrow: '本章目录',
      title: '目录',
      lead: '先逐一摸清四种容器的脾气，再学三项进阶技巧。',
      items: [
        {
          num: '01',
          title: '四大数据容器',
          body: '列表 (List)：有序可变的元素集合；元组 (Tuple)：有序不可变的元素集合；字典 (Dictionary)：键值对映射关系；集合 (Set)：无序不重复的元素集合'
        },
        {
          num: '02',
          title: '进阶技巧',
          body: '推导式与星号解包：高效创建与展开数据；zip与enumerate函数：并行迭代与索引遍历；浅拷贝与深拷贝：数据引用与内存管理'
        }
      ],
      notes: '本次教程将分为两个主要部分。首先，我们会逐一介绍列表、元组、字典和集合这四种核心数据容器，了解它们各自的特性、常用方法和适用场景。接着，我们将学习一些进阶技巧，包括如何利用推导式快速创建数据容器、如何使用zip和enumerate函数进行高效遍历，以及如何理解和处理浅拷贝与深拷贝的问题。'
    },

    /* ---------- 4. 分节页 01 ---------- */
    {
      type: 'section',
      num: '01',
      title: '四大数据容器',
      sub: 'Core Data Containers',
      lead: '列表、元组、字典、集合，各有各的特点与用途，适用于不同的数据处理场景。',
      notes: '现在，让我们进入第一部分：四大数据容器。这四种容器是Python编程的基石，它们各自有着独特的特点和用途，适用于不同的数据处理场景。掌握它们是成为Python高手的必经之路。'
    },

    /* ---------- 5. 列表 (List) ---------- */
    {
      type: 'split',
      eyebrow: '01 四大数据容器',
      title: '列表 (List)',
      lead: '需要频繁增删改查、而且顺序重要的数据，交给列表。它是 Python 中最灵活、最常用的容器。',
      points: [
        { strong: '核心特性：', text: '有序排列、可变类型、允许存储重复元素' },
        { strong: '核心用途：', text: '存储和操作一系列需要频繁增删改查的动态数据集合' },
        '`append(x)` 末尾添加元素，`remove(x)` 删除指定元素',
        '`pop(i)` 删除并返回索引 `i` 的元素，`sort()` 对列表排序',
        '切片 `fruits[1:3]` 可以一次取出子列表'
      ],
      code: {
        file: 'list_operations.py',
        source: `# 创建列表
fruits = ["apple", "banana", "cherry"]

# 增加元素：append(x) 在末尾添加
fruits.append("blueberry")
print(fruits)

# 删除元素：remove(x) 删除指定值
fruits.remove("banana")
print(fruits)

# 切片操作：获取子列表
print(fruits[1:3])

# sort()：按字母顺序排序
fruits.sort()
print(fruits)

# pop(i)：删除并返回索引 i 处的元素
first = fruits.pop(0)
print(first, fruits)`,
        runnable: true,
        expectedOutput: `['apple', 'banana', 'cherry', 'blueberry']
['apple', 'cherry', 'blueberry']
['cherry', 'blueberry']
['apple', 'blueberry', 'cherry']
apple ['blueberry', 'cherry']`
      },
      notes: '首先是列表（List），它是Python中最灵活、最常用的数据结构。列表是有序的，我们可以通过索引访问其中的元素；它也是可变的，意味着我们可以随时添加、删除或修改其中的元素。这使得列表非常适合用于存储需要动态变化的数据集合，比如一个待办事项列表或者一系列用户输入。'
    },

    /* ---------- 6. 元组 (Tuple) ---------- */
    {
      type: 'split',
      eyebrow: '01 四大数据容器',
      title: '元组 (Tuple)',
      lead: '创建之后就不能再改——这份「不可变」不是限制，而是数据安全的保证。',
      points: [
        { strong: '核心特性：', text: '有序（元素位置固定）、不可变（创建后不可修改）、允许重复元素' },
        { strong: '典型场景：', text: '存储不可变配置数据；函数多返回值传递' },
        { strong: '解包 (Unpacking)：', text: '将元组元素一次性赋值给多个变量，简化数据提取' },
        { strong: '具名元组 (Named Tuple)：', text: '通过 `collections.namedtuple` 创建，兼具元组的性能和字典的可读性' },
        '不可变性还带来哈希能力，元组可以直接作为字典的键。'
      ],
      code: {
        file: 'tuple_demo.py',
        source: `# 创建元组：小括号 + 逗号
point = (10, 20)
print(point)

# 解包：一次性赋给多个变量
x, y = point
print(x, y)

# 函数返回多个值，本质上是返回一个元组
def get_size():
    return 100, 200

w, h = get_size()
print(w, h)

# 不可变：试图修改元素会报错
try:
    point[0] = 99
except TypeError as e:
    print("元组不可变：", e)

# 不可变 + 可哈希：可以作为字典的键
sizes = {point: "起点"}
print(sizes[(10, 20)])`,
        runnable: true,
        expectedOutput: `(10, 20)
10 20
100 200
元组不可变： 'tuple' object does not support item assignment
起点`
      },
      notes: '接下来是元组（Tuple）。元组与列表非常相似，也是有序的，并且允许重复元素。但它的关键特性是不可变，一旦创建就无法修改。这种不可变性带来了数据安全性，确保数据在程序运行过程中不会被意外篡改。元组常用于表示一组相关联但不应被修改的数据，比如一个坐标点，或者作为函数返回多个值的便捷方式。'
    },

    /* ---------- 7. 字典 (Dictionary) ---------- */
    {
      type: 'split',
      eyebrow: '01 四大数据容器',
      title: '字典 (Dictionary)',
      lead: '不靠位置、而靠键来取值——表示「一个对象的各项属性」时，字典最合适。',
      points: [
        { strong: '核心特性：', text: '由键值对 (Key-Value) 组成，键唯一且不可变；Python 3.7+ 中保持插入顺序' },
        { strong: '核心用途：', text: '存储映射关系数据（如配置、用户信息），通过键实现快速查找' },
        '访问 `dict[key]`，增 / 改 `dict[key] = value`',
        '删除 `del dict[key]`，遍历 `for k, v in dict.items()`'
      ],
      code: {
        file: 'dict_demo.py',
        source: `# 创建字典：键与值用冒号分隔
person = {"name": "Alice", "age": 30, "city": "NY"}

# 访问：dict[key]
print(person["name"])

# 修改值
person["age"] = 31

# 新增键值对
person["job"] = "Engineer"

# 删除键值对
del person["city"]

# 遍历：items() 同时拿到键和值
for k, v in person.items():
    print(f"{k}: {v}")`,
        runnable: true,
        expectedOutput: `Alice
name: Alice
age: 31
job: Engineer`
      },
      notes: '第三种数据容器是字典（Dictionary）。字典是一种非常强大的数据结构，它不像列表或元组那样通过位置索引来访问元素，而是通过键（key）来查找对应的值（value）。\n这种键值对的结构非常适合表示对象的属性，比如一个人的姓名、年龄、地址等信息。字典的查找速度非常快，是处理大量数据映射关系的首选。\n在 Python 3.7 及以上版本中，字典还保留了插入顺序。我们可以通过简单的赋值操作添加或修改数据，使用 del 语句删除数据，并通过 items() 方法方便地遍历所有键值对。'
    },

    /* ---------- 8. 集合 (Set) ---------- */
    {
      type: 'split',
      eyebrow: '01 四大数据容器',
      title: '集合 (Set)',
      lead: '自动去重、判断「在不在」又快又直观，还能直接做数学上的集合运算。',
      points: [
        { strong: '特性：', text: '无序、可变、元素唯一（自动去重）' },
        { strong: '用途：', text: '数据去重、快速成员关系测试、执行数学集合运算' },
        '交集 `&`：获取两个集合的共同元素',
        '并集 `|`：合并两个集合的所有元素',
        '差集 `-`：获取集合 A 独有的元素'
      ],
      code: {
        file: 'set_demo.py',
        source: `# 1. 去重：列表转集合，重复项被自动剔除
numbers = [1, 2, 2, 3, 3, 3]
unique = set(numbers)
print(sorted(unique))

# 2. 集合运算
s1 = {1, 2, 3, 4, 5}
s2 = {4, 5, 6, 7, 8}
print(sorted(s1 & s2))   # 交集：共同元素
print(sorted(s1 | s2))   # 并集：全部元素
print(sorted(s1 - s2))   # 差集：s1 独有的元素

# 3. 成员关系测试：in 判断元素是否存在
print(3 in s1, 9 in s1)`,
        runnable: true,
        expectedOutput: `[1, 2, 3]
[4, 5]
[1, 2, 3, 4, 5, 6, 7, 8]
[1, 2, 3]
True False`
      },
      note: {
        icon: 'alert',
        title: '关于打印顺序',
        text: '集合是「无序」的，直接 `print(集合)` 时显示顺序并不保证。上面的例子统一先 `sorted()` 再打印，输出才是稳定的——你自己写代码时也可以这样做。'
      },
      notes: '最后一种核心数据容器是集合（Set）。集合最大的特点是无序和元素唯一。它会自动剔除重复的元素，这使得它非常适合用于去重操作。\n此外，集合还支持一系列数学运算，比如求两个集合的交集、并集和差集，这在处理数据关系时非常有用。\n在代码实战部分，大家可以看到，将列表转换为集合是Python中最高效的去重方式之一。同时，使用 &、|、- 这些符号可以非常直观地完成集合运算。'
    },

    /* ---------- 9. 分节页 02 ---------- */
    {
      type: 'section',
      num: '02',
      title: '进阶技巧',
      sub: 'Advanced Techniques',
      lead: '掌握了基础用法之后，这些技巧能让你的代码更简洁、更高效。',
      notes: '掌握了四大数据容器的基础用法后，我们来学习一些进阶技巧。这些技巧能帮助你写出更简洁、更高效的Python代码，让你的编程水平更上一层楼。'
    },

    /* ---------- 10. 推导式 ---------- */
    {
      type: 'split',
      eyebrow: '02 进阶技巧',
      title: '推导式 (Comprehensions)',
      lead: '把「循环 + 条件 + 追加」压缩成一行——原本要写好几行的事，一行就够了。',
      points: [
        '将循环和条件判断结合在一行代码中，简洁高效地创建列表或字典',
        '列表推导式：`[表达式 for x in 可迭代对象]`',
        '字典推导式：`{键: 值 for x in 可迭代对象}`',
        '在末尾加上 `if` 条件，只保留需要的元素'
      ],
      code: {
        file: 'comprehension.py',
        source: `# 列表推导式：生成 0-4 的平方
squares = [x ** 2 for x in range(5)]
print(squares)

# 字典推导式：数字到平方的映射
square_dict = {x: x ** 2 for x in range(5)}
print(square_dict)

# 加条件：只保留偶数
evens = [x for x in range(10) if x % 2 == 0]
print(evens)`,
        runnable: true,
        expectedOutput: `[0, 1, 4, 9, 16]
{0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
[0, 2, 4, 6, 8]`
      },
      notes: '推导式是Python的一大亮点，它能让你用一行代码完成原本需要多行循环才能实现的创建操作，大大简化了代码。'
    },

    /* ---------- 11. 星号解包 ---------- */
    {
      type: 'code',
      eyebrow: '02 进阶技巧',
      title: '星号解包 (Unpacking)',
      lead: '一个 `*` 把可迭代对象「拆开」，合并数据和传递参数都靠它。',
      points: [
        '使用 `*` 拆解可迭代对象（列表、元组等），常用于合并数据或传递参数',
        '`[*[1, 2, 3], *[4, 5, 6]]` 把两个列表合并成一个',
        '`add(*[10, 20, 30])` 等同于 `add(10, 20, 30)`',
        '元组解包 `x, y = point`：一次赋值给多个变量'
      ],
      code: {
        file: 'unpacking.py',
        source: `# 合并两个列表
combined = [*[1, 2, 3], *[4, 5, 6]]
print(combined)

# 解包成函数参数
def add(a, b, c):
    return a + b + c

print(add(*[10, 20, 30]))    # 等同于 add(10, 20, 30)

# 元组解包：一次赋值给多个变量
point = (10, 20)
x, y = point
print(x, y)`,
        runnable: true,
        expectedOutput: `[1, 2, 3, 4, 5, 6]
60
10 20`
      },
      notes: '而星号解包操作则提供了极大的灵活性，无论是合并多个列表，还是将列表中的元素作为参数传递给函数，都非常方便。这两个技巧是提升代码简洁度的利器。'
    },

    /* ---------- 12. zip ---------- */
    {
      type: 'split',
      traceable: true,
      trace: true,
      eyebrow: '02 进阶技巧',
      title: 'zip：并行遍历多个序列',
      lead: '手里有两个（或多个）列表要一起处理时，zip 能把它们一一配对。',
      points: [
        '将多个可迭代对象打包成一个元组的迭代器，用于并行遍历多个序列，一一对应',
        '`zip(names, scores)` 把姓名和分数配成对',
        '`for name, score in zip(...)` 循环里直接解包成两个变量',
        '点击「播放」可以逐步看清每一轮循环里变量的变化'
      ],
      code: {
        file: 'zip_demo.py',
        source: `# 并行遍历两个列表
names = ["Alice", "Bob", "Charlie"]
scores = [85, 90, 78]

for name, score in zip(names, scores):
    print(f"Student: {name}, Score: {score}")

# zip 打包出的是元组的迭代器
print(list(zip(names, scores)))`,
        runnable: true,
        expectedOutput: `Student: Alice, Score: 85
Student: Bob, Score: 90
Student: Charlie, Score: 78
[('Alice', 85), ('Bob', 90), ('Charlie', 78)]`
      },
      notes: 'zip和enumerate是两个非常实用的内置函数。当你需要同时处理多个列表时，zip函数可以帮你轻松地将它们配对。'
    },

    /* ---------- 13. enumerate ---------- */
    {
      type: 'split',
      traceable: true,
      trace: true,
      eyebrow: '02 进阶技巧',
      title: 'enumerate：遍历时同时拿到索引',
      lead: '既要知道元素是什么，又想知道它在第几位——不需要自己维护计数器。',
      points: [
        '在遍历可迭代对象时，同时获取元素的索引（位置）和对应的值，默认索引从 0 开始',
        '`for idx, fruit in enumerate(fruits)` 索引与元素成对取出',
        '需要从 1 开始编号时，传入 `start=1`',
        '点击「播放」可以逐步看清索引与元素的变化'
      ],
      code: {
        file: 'enumerate_demo.py',
        source: `# 遍历列表并获取索引
fruits = ["apple", "banana", "cherry"]

for idx, fruit in enumerate(fruits):
    print(f"Index: {idx}, Fruit: {fruit}")

# 索引默认从 0 开始，也可以指定起点
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}. {fruit}")`,
        runnable: true,
        expectedOutput: `Index: 0, Fruit: apple
Index: 1, Fruit: banana
Index: 2, Fruit: cherry
1. apple
2. banana
3. cherry`
      },
      notes: '而当你在遍历列表时需要知道元素的位置（索引）时，enumerate函数就显得尤为方便。掌握这两个函数，可以让你的循环代码更加清晰和高效。'
    },

    /* ---------- 14. 浅拷贝与深拷贝 ---------- */
    {
      type: 'split',
      eyebrow: '02 进阶技巧',
      title: '浅拷贝与深拷贝',
      lead: '处理嵌套列表时最容易踩的坑：明明改的是副本，原数据却跟着变了。',
      cards: [
        {
          icon: 'copy',
          heading: '浅拷贝 (Shallow Copy)',
          body: '仅复制容器对象，内部元素仍为引用。修改嵌套子对象会影响原对象。'
        },
        {
          icon: 'clone',
          heading: '深拷贝 (Deep Copy)',
          body: '递归复制所有层级元素，创建完全独立的副本。修改拷贝不影响原对象。'
        }
      ],
      code: {
        file: 'copy_demo.py',
        source: `import copy

original = [[1, 2], [3, 4]]

# 浅拷贝：只复制最外层，内部的子列表仍是同一个对象
shallow = copy.copy(original)
shallow[0][0] = 99
print("浅拷贝改动后 original =", original)

# 深拷贝：递归复制所有层级，是完全独立的副本
deep = copy.deepcopy(original)
deep[1][0] = 100
print("深拷贝改动后 original =", original)
print("深拷贝副本 deep =", deep)`,
        runnable: true,
        expectedOutput: `浅拷贝改动后 original = [[99, 2], [3, 4]]
深拷贝改动后 original = [[99, 2], [3, 4]]
深拷贝副本 deep = [[99, 2], [100, 4]]`
      },
      note: {
        icon: 'import',
        title: 'Python 实现',
        text: '需要导入 `copy` 模块：`copy.copy()` 是浅拷贝，`copy.deepcopy()` 是深拷贝。'
      },
      notes: '在处理复杂的数据结构（如嵌套列表）时，拷贝操作需要特别注意。浅拷贝只复制了最外层的容器，内部的元素仍然是引用，这可能导致意外的副作用。而深拷贝则会递归地复制所有层级的元素，创建一个完全独立的副本。理解浅拷贝和深拷贝的区别，是避免程序中出现难以调试的bug的关键。'
    },

    /* ---------- 15. 总结与对比 ---------- */
    {
      type: 'compare',
      eyebrow: '本章总结',
      title: '总结与对比',
      lead: '四种容器的核心特性摆在一起，选型时对照这张表就够了。',
      table: {
        head: ['容器', '有序性', '可变性', '能否重复', '典型用途'],
        rows: [
          ['列表 `list`', '有序', '可变', '可以重复', '存储需要频繁增删改查的动态数据集合'],
          ['元组 `tuple`', '有序', '不可变', '可以重复', '不可变配置数据、函数多返回值传递'],
          ['字典 `dict`', '有序（3.7+ 保持插入顺序）', '可变', '键唯一', '键值对映射：配置、用户信息等'],
          ['集合 `set`', '无序', '可变', '元素唯一（自动去重）', '数据去重、成员关系测试、集合运算']
        ]
      },
      note: {
        icon: 'target',
        title: '怎么选',
        text: '要有序且需要修改，用列表；要不可变、要安全，用元组；要按键快速查找，用字典；要去重或做集合运算，用集合。'
      },
      notes: '最后，我们通过一个表格来总结和对比这四种数据容器的核心特性。列表适合存储有序且需要修改的数据；元组适合存储不可变的数据；字典适合存储键值对映射关系；集合则适合去重和集合运算。理解它们各自的特点和适用场景，能帮助我们在编程时做出最合适的选择。'
    },

    /* ---------- 16. 结尾小结 ---------- */
    {
      type: 'end',
      icon: 'layers',
      title: '本章小结',
      lead: '四种容器 + 三项进阶技巧，它们是构建复杂 Python 应用的基础。',
      cards: [
        {
          icon: 'layers',
          heading: '核心数据容器',
          body: '列表 (List) · 元组 (Tuple)\n字典 (Dict) · 集合 (Set)'
        },
        {
          icon: 'sparkle',
          heading: '进阶操作技巧',
          body: '推导式 · 星号解包 · Zip / Enumerate\n深浅拷贝机制'
        },
        {
          icon: 'target',
          heading: '一句话记住',
          body: '掌握基础容器与进阶技巧，是编写高效、优雅 Python 代码的关键基石。'
        }
      ],
      notes: '本章的内容就到这里。我们学习了Python中最核心的四种数据容器及其进阶用法，这些知识是构建复杂Python应用的基础。希望通过这次学习，大家能熟练掌握并灵活运用这些数据结构，编写出更高效、更优雅的代码。感谢大家的观看！'
    }
  ];
})(window);
