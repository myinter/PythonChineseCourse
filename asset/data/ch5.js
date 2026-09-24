/* ============================================================
   第五章 · 标准库与第三方库

   代码说明：原 PPT 里的代码块缩进全部丢失（p14 的 pandas 示例甚至被压成
   一行），并混入了全角引号，无法直接运行。此处所有代码都已重新校订。

   运行环境处理（本章最复杂，逐条说明）：
   - 标准库片段（os / sys / math / random / datetime / json / re）全部真实可运行，
     已由 tools/verify_examples.mjs 实际跑通，expectedOutput 是真实输出。
   - pip 命令不是 Python 语法，用 shell: true 标记为终端命令，不设 runnable。
   - requests 不能假装能跑：浏览器沙箱没有底层网络套接字，用 runnable: false
     关掉运行按钮，并加 note 说明输出是预置的。
   - numpy / pandas / matplotlib 已内置，用 packages 声明。本机没有这三个库，
     验证脚本会跳过它们；expectedOutput 是在 Pyodide
     （CPython 3.14.2 + numpy 2.4.6 / pandas 3.0.2 / matplotlib 3.10.8）
     里实际跑出来的真实输出，连对齐空格都逐字符核对过。
   - 原 PPT 的 p14 把 pandas 与 matplotlib 挤在一页。这里拆成两页：两者合在
     一段代码里时，首次运行要加载 pandas + matplotlib 及其全部依赖，实测
     逼近 runner.js 的 5 秒执行上限（冷缓存时直接超时），拆开后各自都留有余量。
   - 不确定的输出一律消除：datetime 用固定日期，random 固定种子，
     os.getcwd() 与 sys.argv 只判断结构不打印具体值。
   ============================================================ */
(function (global) {
  'use strict';
  global.PYT = global.PYT || {};
  global.PYT.data = global.PYT.data || {};

  global.PYT.data.ch5 = [

    /* ---------- 1. 封面 ---------- */
    {
      type: 'title',
      eyebrow: '第五章',
      title: '标准库与第三方库',
      lead: '站在前人的肩膀上 —— 解锁 Python 的无限可能',
      notes: '大家好，欢迎来到第五章的学习。本章我们将探索 Python 的两大核心支柱：标准库和第三方库。它们是 Python 之所以如此强大和受欢迎的关键所在，掌握它们，将帮助我们解锁 Python 的无限可能。'
    },

    /* ---------- 2. 知识地图 ---------- */
    {
      type: 'map',
      eyebrow: '本章脉络',
      title: '一张图看懂本章',
      lead: '标准库是随 Python 一起装好的底座，Pip 是把外部资源装进来的工具，第三方库则是这些资源本身。',
      map: {
        aria: '本章知识地图：标准库、Pip 包管理与第三方库',
        root: { title: '第五章 · 标准库与第三方库', sub: '站在前人的肩膀上' },
        branches: [
          {
            title: '标准库',
            sub: '内置军火库',
            leaves: [
              { title: 'os / sys', sub: '系统与解释器' },
              { title: 'math / random', sub: '数学与随机数' },
              { title: 'datetime', sub: '日期与时间' },
              { title: 'json / re', sub: '数据交换与文本' }
            ]
          },
          {
            title: 'Pip',
            sub: '包管理工具',
            leaves: [
              { title: 'install / upgrade', sub: '安装与升级' },
              { title: 'uninstall / list / show', sub: '卸载与查看' },
              { title: 'requirements.txt', sub: '依赖清单' }
            ]
          },
          {
            title: '第三方库',
            sub: '生态扩展',
            leaves: [
              { title: 'requests', sub: 'HTTP 请求' },
              { title: 'NumPy', sub: '科学计算基石' },
              { title: 'pandas & matplotlib', sub: '数据处理与可视化' }
            ]
          }
        ]
      },
      notes: '这张图是本章的全貌。上面这条线是标准库：它随 Python 一起装好，import 就能用，我们挑最常用的几组模块来看。中间这条线是 Pip：标准库不够用时，靠它把外部的库装进来。下面这条线是第三方库：装进来的那些库长什么样、能干什么。三条线索连起来就是一句话——先看自己有什么，再学会怎么拿别人的，最后看别人都给了什么。'
    },

    /* ---------- 3. 学习目标 ---------- */
    {
      type: 'cards',
      eyebrow: '学习目标',
      title: '本章，你将学会什么？',
      lead: '学完这一章，你不仅能看懂别人代码里的那些 `import`，还能自己去找库、装库、用库。',
      cards: [
        {
          icon: 'bulb',
          heading: '理解核心概念',
          body: '• 什么是 Python 标准库及其核心优势\n• 什么是第三方库及扩展能力\n• Pip 包管理工具的重要性'
        },
        {
          icon: 'wrench',
          heading: '掌握实用技能',
          body: '• 熟练使用 `os`、`sys`、`math` 等常用库\n• 掌握 Pip 的安装、升级与卸载\n• 管理 `requirements.txt` 与第三方库'
        },
        {
          icon: 'target',
          heading: '培养实践能力',
          body: '• 通过代码示例把理论变成实操\n• 建立利用库解决复杂问题的思维\n• 积累常用的开发工具经验'
        }
      ],
      notes: '在本章结束时，大家将能够理解标准库、第三方库和 Pip 的核心概念，并掌握它们的实用技能。更重要的是，我们将培养利用这些强大工具解决实际问题的能力。'
    },

    /* ---------- 4. 分节：标准库 ---------- */
    {
      type: 'section',
      num: '01',
      title: 'Python 标准库',
      sub: '随安装自带的内置军火库',
      lead: '不用装任何东西，`import` 一下就能用——这就是标准库。',
      notes: '先看标准库。它是 Python 的底座：装上 Python 就已经拥有，用 import 直接引入即可。这一部分我们先认识它的定位与核心价值，再逐个看几个最常用的模块。'
    },

    /* ---------- 5. 标准库是什么 ---------- */
    {
      type: 'cards',
      eyebrow: '01 · 标准库',
      title: 'Python 标准库：内置军火库',
      lead: '标准库是 Python 语言的核心组件，包含大量预编写的模块与包。它随 Python 安装自动附带，只需通过 `import` 直接使用，无需额外下载。',
      cards: [
        {
          icon: 'toolbox',
          heading: '开箱即用 Batteries Included',
          body: '遵循「自带电池」的设计哲学，常见任务都有成熟方案，省去重复造轮子的时间。'
        },
        {
          icon: 'shield',
          heading: '高质量与稳定性',
          body: '由 Python 核心团队维护，经过严格测试，性能可靠。'
        },
        {
          icon: 'layers',
          heading: '跨平台兼容性',
          body: '用统一接口屏蔽系统差异，代码一次编写，多处运行。'
        }
      ],
      note: {
        icon: 'bulb',
        title: '关键提示',
        text: '标准库随安装包一起附带，`import` 就能用，不需要 `pip install`。功能也极其丰富，从文件操作到网络编程都有覆盖。'
      },
      notes: '首先我们来认识 Python 标准库。你可以把它想象成 Python 自带的「内置军火库」。左侧我们定义了什么是标准库：它是语言的核心，随安装即拥有，开箱即用。它的核心价值体现在四个方面：一是「自带电池」的设计哲学，让我们省去重复造轮子的时间；二是由官方团队维护，质量极高；三是完美的跨平台特性；四是功能极其丰富，覆盖了从文件操作到网络编程的方方面面。右侧的图片直观地展示了标准库（工具箱）与庞大的第三方生态（树木）的关系，标准库是我们编程时最坚实的基础工具。'
    },

    /* ---------- 6. os / sys ---------- */
    {
      type: 'split',
      eyebrow: '01 · 标准库',
      title: '常用标准库（1）：与系统对话',
      lead: '`os` 负责和操作系统打交道，`sys` 负责和 Python 解释器打交道——一个管外部，一个管内部。',
      points: [
        '`os`：文件目录操作、路径管理、进程控制，是 Python 与操作系统沟通的桥梁',
        '`os.getcwd()` 取当前路径，`os.makedirs()` 建目录，`os.path.join()` 拼路径',
        '`sys`：访问解释器的内部变量与函数，常用于取运行参数、版本信息、程序退出',
        '`sys.argv` 是命令行参数列表，`sys.version_info` 是解释器版本'
      ],
      code: {
        file: 'os_sys_demo.py',
        source: `import os
import sys

# ---------- os：与操作系统打交道 ----------
# os.getcwd() 取当前工作目录（每台机器都不一样）
cwd = os.getcwd()
print("拿到的是绝对路径:", os.path.isabs(cwd))

# os.makedirs() 创建目录，exist_ok=True 表示目录已存在也不报错
os.makedirs("new_dir", exist_ok=True)
print("new_dir 是否已创建:", os.path.isdir("new_dir"))

# os.path.join() 按系统习惯拼接路径，不用自己写斜杠
print("拼接后的路径:", os.path.join("new_dir", "data.txt"))

# ---------- sys：与 Python 解释器打交道 ----------
# sys.argv 是命令行参数列表，第 0 个是脚本名本身
print("额外命令行参数:", sys.argv[1:])

# sys.version_info 是解释器版本，常用来做版本判断
print("Python 版本:", sys.version_info.major, sys.version_info.minor)`,
        runnable: true,
        expectedOutput: `拿到的是绝对路径: True
new_dir 是否已创建: True
拼接后的路径: new_dir/data.txt
额外命令行参数: []
Python 版本: 3 14`
      },
      note: {
        icon: 'terminal',
        title: '为什么看不到具体的路径',
        text: '每台机器的工作目录都不一样，把 `os.getcwd()` 原样打印出来，结果就没法对照。这里改判它「是不是绝对路径」，你在自己电脑上把 `os.path.isabs(cwd)` 换成 `cwd`，就能看到完整路径了。'
      },
      notes: '我们来看两个最常用的标准库。`os` 库用于和操作系统打交道，比如创建文件夹、获取当前路径。`sys` 库则用于和 Python 解释器交互，比如获取命令行参数和 Python 版本信息。'
    },

    /* ---------- 7. math / random ---------- */
    {
      type: 'split',
      eyebrow: '01 · 标准库',
      title: '常用标准库（2）：数学计算与随机数',
      lead: '`math` 把计算器升级成科学计算器，`random` 让程序学会掷骰子。',
      points: [
        '`math`：比内置运算更全面的数学功能，三角函数、指数对数、常量（如 π）都在里面',
        '`math.sqrt(16)` 求平方根，`math.pi` 是圆周率',
        '`random`：生成各种分布的伪随机数，广泛用于游戏、模拟、随机抽样',
        '`random.randint(1, 100)` 取随机整数，`random.choice()` 从列表里挑一个元素'
      ],
      code: {
        file: 'math_random.py',
        source: `import math
import random

# ---------- math：数学函数与常量 ----------
print(f"√16 = {math.sqrt(16)}")
print(f"π ≈ {math.pi}")

# ---------- random：伪随机数 ----------
random.seed(42)          # 固定种子，随机序列就变得可复现
print("1-100 随机整数:", random.randint(1, 100))
print("随机挑一个:", random.choice(['A', 'B', 'C']))`,
        runnable: true,
        expectedOutput: `√16 = 4.0
π ≈ 3.141592653589793
1-100 随机整数: 82
随机挑一个: A`
      },
      note: {
        icon: 'bulb',
        title: '为什么要 random.seed(42)',
        text: '不加种子的话，每次运行拿到的随机数都不一样，示例的输出就没法对照。`random.seed(42)` 把随机序列固定下来，结果完全可复现——写测试、做实验时同样常用。'
      },
      notes: '接下来是 `math` 和 `random` 库。`math` 库提供了各种数学函数和常量，如平方根和圆周率。`random` 库则用于生成随机数，非常适合用于游戏、模拟等场景。'
    },

    /* ---------- 8. datetime ---------- */
    {
      type: 'split',
      eyebrow: '01 · 标准库',
      title: '常用标准库（3）：处理日期与时间',
      lead: 'Python 的 `datetime` 模块提供了处理日期和时间的高级接口，支持时间获取、算术运算及格式转换。',
      points: [
        { strong: '获取当前时间', text: '　`now()` / `today()` 一行拿到' },
        { strong: '日期算术运算', text: '　用 `timedelta` 做加减，天数、小时都能直接算' },
        { strong: '格式化输出', text: '　`strftime()` 把时间对象转成指定格式的字符串' },
        { strong: '解析字符串', text: '　`strptime()` 把字符串解析回时间对象' }
      ],
      code: {
        file: 'datetime_demo.py',
        source: `from datetime import datetime, timedelta

# 真实项目里这里写 datetime.now()；为了每次输出一致，先用固定时间
now = datetime(2025, 3, 24, 10, 30, 0)

# strftime()：把时间对象格式化成字符串
print("格式化时间:", now.strftime("%Y-%m-%d %H:%M:%S"))

# timedelta：表示「一段时间」，可以直接和时间做加减
later = now + timedelta(days=3)
print("3天后:", later.strftime("%Y-%m-%d"))

# strptime()：把字符串解析回时间对象
parsed = datetime.strptime("2025-03-24 10:30:00", "%Y-%m-%d %H:%M:%S")
print("解析结果:", parsed)
print("和原时间相同:", parsed == now)`,
        runnable: true,
        expectedOutput: `格式化时间: 2025-03-24 10:30:00
3天后: 2025-03-27
解析结果: 2025-03-24 10:30:00
和原时间相同: True`
      },
      note: {
        icon: 'clock',
        title: '为什么不用 datetime.now()',
        text: '`datetime.now()` 每次都不同，输出就没法对照。这里先造一个固定时间，把重点放在格式化与运算上；真实项目里把它换成 `datetime.now()` 即可。'
      },
      notes: '处理日期和时间是编程中常见的需求，datetime 库就是为此而生。它可以轻松地获取当前时间、进行日期运算，以及将日期格式化为我们需要的字符串形式。\n左侧展示了它的核心功能，包括获取时间、进行算术运算、格式化输出和解析字符串。右侧的代码示例展示了如何导入模块、获取当前时间并进行简单的日期加法运算。通过 strftime 方法，我们可以将时间对象转换为任意格式的字符串，这在日志记录或用户界面展示中非常实用。'
    },

    /* ---------- 9. json / re ---------- */
    {
      type: 'split',
      eyebrow: '01 · 标准库',
      title: '常用标准库（4）：数据交换与文本处理',
      lead: '`json` 负责和外部世界交换数据，`re` 负责在文本里找规律。',
      points: [
        '`json`：实现 Python 对象与 JSON 字符串的双向转换',
        '`json.dumps()` 转成字符串，`json.loads()` 解析回字典——API 交互与配置文件的核心工具',
        '`re`：提供正则表达式支持，快速查找、替换、分割复杂格式的文本',
        '`re.findall()` 一次捞出所有匹配项，比如从一句话里提取邮箱、URL'
      ],
      code: {
        file: 'json_re_demo.py',
        source: `import json
import re

# ---------- json：Python 对象与 JSON 字符串互转 ----------
person = {"name": "Alice", "age": 30}

j_str = json.dumps(person, indent=4)    # 转成 JSON 字符串（带缩进）
print(j_str)

p_load = json.loads(j_str)              # 再解析回 Python 字典
print("解析回来:", p_load["name"], p_load["age"])

# ---------- re：用正则从文本里挑出想要的部分 ----------
text = "Contact: support@example.com"
pat = r'\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b'
print("找到的邮箱:", re.findall(pat, text))`,
        runnable: true,
        expectedOutput: `{
    "name": "Alice",
    "age": 30
}
解析回来: Alice 30
找到的邮箱: ['support@example.com']`
      },
      note: {
        icon: 'regex',
        title: '那串正则看不懂也没关系',
        text: '`\\b` 表示单词边界，`[A-Za-z0-9._%+-]+` 匹配邮箱的用户名部分，`\\.` 匹配中间那个点。正则可以慢慢学，先记住「用 `re.findall()` 把想要的内容捞出来」这一招就够用了。'
      },
      notes: '在数据交换和文本处理方面，`json` 和 `re` 库非常有用。`json` 库帮助我们在 Python 对象和 JSON 格式之间转换，这在 API 交互中非常常见。`re` 库则提供了正则表达式支持，让我们可以高效地处理和分析文本。'
    },

    /* ---------- 10. 分节：Pip ---------- */
    {
      type: 'section',
      num: '02',
      title: 'Pip：包管理工具',
      sub: 'Python Installs Packages',
      lead: '标准库不够用时，Pip 负责把全世界开发者写好的库装进你的环境。',
      notes: '学完了标准库，我们来看看如何扩展 Python 的能力。这就需要用到 Pip，Python 的包管理工具。它是我们安装和管理第三方库的入口，是连接我们与庞大 Python 生态的桥梁。'
    },

    /* ---------- 11. Pip 是什么 + 核心命令 ---------- */
    {
      type: 'split',
      eyebrow: '02 · 包管理工具',
      title: '掌握 Pip 的核心命令',
      lead: 'Pip 是 Python 官方的包管理工具，用于查找、下载、安装、升级和卸载第三方库。它是连接开发者与庞大 Python 生态的核心桥梁。',
      cards: [
        {
          icon: 'cloud',
          heading: '连接生态',
          body: '打通开源社区资源，想用什么库就装什么库。'
        },
        {
          icon: 'download',
          heading: '简化安装',
          body: '自动处理依赖关系，把前置的包一起装好。'
        },
        {
          icon: 'package',
          heading: '依赖管理',
          body: '统一环境配置标准，团队里人人装出一样的环境。'
        },
        {
          icon: 'layers',
          heading: '版本控制',
          body: '灵活升降级库版本，需要锁定版本也能做到。'
        }
      ],
      code: {
        file: 'bash',
        shell: true,
        source: `# 01 安装包 Install
pip install requests
pip install requests==2.31.0        # 需要指定版本时用 ==

# 02 升级包 Upgrade
pip install -U requests             # -U 等同于 --upgrade

# 03 卸载包 Uninstall
pip uninstall requests

# 04 列出包 List
pip list

# 05 查看信息 Show
pip show requests`
      },
      note: {
        icon: 'terminal',
        title: '这是终端命令，不是 Python 代码',
        text: '这些命令要在系统的终端里执行（macOS / Linux 叫 Terminal，Windows 用 PowerShell 或 CMD），所以本页没有「运行」按钮。Python 3.4 以后的版本已经默认集成 Pip，先用 `pip --version` 确认装好了；想查看完整命令列表用 `pip --help`，看某个子命令的帮助用 `pip install --help`。'
      },
      notes: '学完了标准库，我们来看看如何扩展 Python 的能力。这就需要用到 Pip，Python 的包管理工具。\n它是我们安装和管理第三方库的入口，是连接我们与庞大 Python 生态的桥梁。通过 Pip，我们可以非常方便地安装如 Requests、Django 等优秀的第三方库，极大地提高开发效率。\n大家注意底部的提示，在较新的 Python 版本中，Pip 已经默认安装好了，大家课后可以尝试在终端输入命令来验证一下。\n\nPip 的使用非常简单，主要通过几个核心命令。我们可以使用 pip install 来安装包，pip install -U 来升级包，pip uninstall 来卸载包，以及 pip list 来查看已安装的包。'
    },

    /* ---------- 12. requirements.txt ---------- */
    {
      type: 'split',
      eyebrow: '02 · 包管理工具',
      title: '用 requirements.txt 管理依赖',
      lead: '这是一个记录项目所有第三方库及其精确版本号的文本文件，是 Python 项目协作与部署的标准规范。',
      cards: [
        {
          icon: 'steps',
          heading: '方便团队协作',
          body: '无需手动沟通，成员之间快速同步开发环境。'
        },
        {
          icon: 'cloud',
          heading: '简化部署流程',
          body: '服务器上线时，一条命令搞定所有安装。'
        },
        {
          icon: 'lock',
          heading: '版本锁定安全',
          body: '防止库自动更新引发的代码兼容性 Bug。'
        }
      ],
      code: {
        file: 'bash',
        shell: true,
        source: `# 1. 生成依赖清单：把当前环境装好的库导出到文件
pip freeze > requirements.txt

# 2. 在新环境一键装齐所有依赖
pip install -r requirements.txt`
      },
      note: {
        icon: 'shield',
        title: '最佳实践',
        text: '建议在虚拟环境（venv）里操作，避免污染全局 Python 环境。'
      },
      notes: '在团队协作或项目部署时，确保所有人使用相同版本的库非常重要。`requirements.txt` 文件就是为此而生。我们可以用 `pip freeze` 命令生成它，然后用 `pip install -r` 命令在新环境中一键安装所有依赖。'
    },

    /* ---------- 13. 分节：第三方库 ---------- */
    {
      type: 'section',
      num: '03',
      title: '第三方库',
      sub: '众人拾柴火焰高',
      lead: '由社区贡献的海量软件包，覆盖 Web 开发、人工智能、数据分析等专业领域。',
      notes: '如果说标准库是 Python 的基础，那么第三方库就是它的「超级插件」。这些由社区贡献的库极大地扩展了 Python 的能力，让它在数据分析、人工智能等专业领域大放异彩。'
    },

    /* ---------- 14. 第三方库是什么 ---------- */
    {
      type: 'cards',
      eyebrow: '03 · 第三方库',
      title: '第三方库：众人拾柴火焰高',
      lead: '第三方库是由 Python 社区开发者编写的软件包，不属于标准库，需要通过 Pip 等工具手动安装。它正是 Python 生态强大的关键。',
      cards: [
        {
          icon: 'grid',
          heading: '专业领域全覆盖',
          body: '专注解决特定问题，如数据分析（pandas）、AI（scikit-learn）、Web（Django）。'
        },
        {
          icon: 'wrench',
          heading: '拒绝重复造轮子',
          body: '直接复用成熟高效的代码，把精力集中在业务逻辑上，节省大量开发时间。'
        },
        {
          icon: 'sparkle',
          heading: '推动技术创新',
          body: '活跃的开源社区持续贡献新库，让 Python 始终站在技术发展的前沿。'
        }
      ],
      note: {
        icon: 'tree',
        title: '生态示意',
        text: '第三方库如同繁茂的大树般不断生长，支撑起 Python 在数据、AI 等各领域的无限可能。'
      },
      notes: '如果说标准库是 Python 的基础，那么第三方库就是它的「超级插件」。这些由社区贡献的库极大地扩展了 Python 的能力，让它在数据分析、人工智能等专业领域大放异彩。'
    },

    /* ---------- 15. requests ---------- */
    {
      type: 'split',
      eyebrow: '03 · 第三方库',
      title: '常用第三方库（1）：requests',
      lead: '优雅而简单的 HTTP 库，比 Python 标准库 `urllib` 更易用，是爬虫与 API 交互的首选工具。',
      points: [
        '安装：在终端执行 `pip install requests`',
        '`requests.get(url)` 一行就能发出 GET 请求',
        '`res.status_code` 判断请求是否成功，200 表示正常',
        '核心亮点：自动编码解码、会话保持、连接池'
      ],
      code: {
        file: 'requests_demo.py',
        runnable: false,
        source: `import requests

# 发送 GET 请求到 GitHub API
url = 'https://api.github.com'
res = requests.get(url)

if res.status_code == 200:
    print("请求成功！状态码: 200")`,
        expectedOutput: `请求成功！状态码: 200`
      },
      note: {
        icon: 'alert',
        title: '运行环境说明',
        text: '这段代码不能在这个网页里真实运行：浏览器沙箱没有底层网络套接字，`requests.get()` 无法真正把请求发出去。上面展示的输出（`请求成功！状态码: 200`）是预置结果，只用来演示写法；请在你本地的 Python 环境里练习这一页。'
      },
      notes: '我们来看几个最流行的第三方库。首先是 requests，它让发送 HTTP 请求变得异常简单，是进行网络爬虫和 API 交互的必备工具。\n在左侧，大家可以看到它的生态定位，作为一个第三方库，它极大地丰富了 Python 的工具箱。安装非常方便，只需一条 pip 命令。\n右侧是一个极简的入门示例，展示了如何发送一个 GET 请求并检查状态码。通过 requests.get() 方法，几行代码就能完成复杂的网络请求操作。'
    },

    /* ---------- 16. NumPy ---------- */
    {
      type: 'split',
      eyebrow: '03 · 第三方库',
      title: '常用第三方库（2）：NumPy 科学计算基石',
      lead: 'NumPy（Numerical Python）是 Python 科学计算的核心基础。它提供了高性能的多维数组对象（ndarray）和丰富的数学函数，是 pandas、matplotlib 等数据分析库的底层依赖。',
      points: [
        '安装：在终端执行 `pip install numpy`，导入时通常写成 `import numpy as np`',
        '`np.array()` 创建数组，套一层方括号就是二维数组（矩阵）',
        '向量化运算：`arr * 2` 整体乘 2，不用写循环',
        '聚合计算：`np.mean()` 一步算出平均值'
      ],
      code: {
        file: 'numpy_demo.py',
        packages: ['numpy'],
        source: `import numpy as np

# 1. 创建二维数组（矩阵）
arr2 = np.array([[1, 2, 3], [4, 5, 6]])
print(f"二维数组:\\n{arr2}")

# 2. 向量化运算：整体乘以 2，不用写循环
arr3 = arr2 * 2
print(f"乘 2 之后:\\n{arr3}")

# 3. 聚合计算：平均值
print(f"平均值: {np.mean(arr2)}")`,
        runnable: true,
        expectedOutput: `二维数组:
[[1 2 3]
 [4 5 6]]
乘 2 之后:
[[ 2  4  6]
 [ 8 10 12]]
平均值: 3.5`
      },
      note: {
        icon: 'sparkle',
        title: 'NumPy 为什么快',
        text: '`arr2 * 2` 这样的写法叫向量化运算：它把整块数据交给底层的 C 代码一次算完，避免了 Python 层面的循环，这正是 NumPy 速度快的关键原因。'
      },
      notes: '接下来是 numpy，它是 Python 科学计算的基石。它提供了强大的数组对象和高效的数学运算功能，是后续学习 pandas 和 matplotlib 的基础。\n左侧展示了它在 Python 生态中的地位，它就像工具箱里最基础的扳手，或者生态树的根基。安装非常简单，使用 pip 即可。\n右侧的代码展示了 numpy 最基础的用法：创建数组、进行向量化运算（比如整体乘以 2）以及计算统计值（如平均值）。请注意，numpy 的向量化运算避免了 Python 层面的循环，这是它速度快的关键原因。'
    },

    /* ---------- 17. pandas ---------- */
    {
      type: 'split',
      eyebrow: '03 · 第三方库',
      title: '常用第三方库（3）：pandas 数据分析',
      lead: '构建在 NumPy 之上，pandas 提供了 DataFrame 等结构，把表格数据的处理流程极大地简化了。',
      points: [
        '安装：在终端执行 `pip install pandas`，导入时惯例写成 `import pandas as pd`',
        '`pd.DataFrame(data)` 把字典变成一张表：键是列名，值是这一列的数据',
        '`df.shape` 看行数与列数，`df.columns` 看列名',
        '`df["Age"].mean()` 直接对这一列做统计'
      ],
      code: {
        file: 'pandas_demo.py',
        packages: ['pandas'],
        source: `import pandas as pd

# 用字典构造一张表：键是列名，值是这一列的数据
data = {'Name': ['Alice', 'Bob'], 'Age': [25, 30]}
df = pd.DataFrame(data)
print(df)

print("行数与列数:", df.shape)
print("列名:", list(df.columns))
print("平均年龄:", df['Age'].mean())`,
        runnable: true,
        expectedOutput: `    Name  Age
0  Alice   25
1    Bob   30
行数与列数: (2, 2)
列名: ['Name', 'Age']
平均年龄: 27.5`
      },
      note: {
        icon: 'table',
        title: 'DataFrame 是什么',
        text: '先把 DataFrame 理解成「带列名的 Excel 表格」：`print(df)` 出来就是一张对齐的表，最左边那列是自动生成的行号。到了数据分析阶段，它就是主角。'
      },
      notes: '最后介绍 pandas 和 matplotlib。pandas 是处理表格数据的利器，而 matplotlib 则可以将数据以图表的形式可视化出来。这两个库结合使用，构成了 Python 数据分析的黄金组合。'
    },

    /* ---------- 18. matplotlib ---------- */
    {
      type: 'split',
      eyebrow: '03 · 第三方库',
      title: '常用第三方库（4）：matplotlib 可视化',
      lead: 'Python 最常用的绘图库，支持折线图、柱状图等多种高质量图表的生成——pandas 算出来的结果，靠它画成图。',
      points: [
        '安装：在终端执行 `pip install matplotlib`，导入时惯例写成 `import matplotlib.pyplot as plt`',
        '`plt.subplots()` 一次拿到画布（Figure）和坐标轴（Axes）',
        '`ax.plot(x, y)` 画折线，`ax.set_title()` 给图起标题',
        '最后调用 `plt.show()` 展示图片'
      ],
      code: {
        file: 'matplotlib_demo.py',
        packages: ['matplotlib'],
        source: `import matplotlib.pyplot as plt

# 创建画布（Figure）和坐标轴（Axes），这一步不会弹窗
fig, ax = plt.subplots()

x = [1, 2, 3]
y = [2, 4, 3]

ax.plot(x, y)                 # 画一条折线
ax.set_title("Demo")          # 设置标题

print("画布类型:", type(fig).__name__)
print("坐标轴类型:", type(ax).__name__)
print("图表标题:", ax.get_title())
print("数据点数:", len(ax.lines[0].get_ydata()))`,
        runnable: true,
        expectedOutput: `画布类型: Figure
坐标轴类型: Axes
图表标题: Demo
数据点数: 3`
      },
      note: {
        icon: 'chart',
        title: '网页里的 matplotlib',
        text: '网页版的 `plt.show()` 不会像本地那样弹出窗口，而是把图渲染到 canvas 上，所以这一页只演示创建画布、画折线和设置标题，并打印对象类型——这些依然是真实执行的结果。在你自己电脑上，最后加一行 `plt.show()` 就能看到图。'
      },
      notes: '最后介绍 pandas 和 matplotlib。pandas 是处理表格数据的利器，而 matplotlib 则可以将数据以图表的形式可视化出来。这两个库结合使用，构成了 Python 数据分析的黄金组合。'
    },

    /* ---------- 19. 小结 ---------- */
    {
      type: 'end',
      icon: 'python',
      title: '总结与下一步',
      lead: '编程之路，始于足下。不断学习，不断实践，你将解锁 Python 的全部潜力！',
      cards: [
        { icon: 'toolbox', heading: '标准库 · 基石', body: '内置功能丰富，无需安装即用' },
        { icon: 'package', heading: 'Pip · 引擎', body: '第三方包的安装与管理神器' },
        { icon: 'tree', heading: '第三方库 · 扩展', body: '海量资源，助力项目快速落地' }
      ],
      notes: '本章我们学习了标准库、Pip 和第三方库。标准库是基础，Pip 是工具，第三方库是扩展。希望大家能动手实践，将这些知识应用到实际项目中。编程之路，始于足下，不断学习和实践，才能真正解锁 Python 的全部潜力。感谢大家！'
    }
  ];
})(window);
