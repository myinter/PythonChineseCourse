# Python 入门教程（网页版）

由七份 PPT 课件整理而成的一套可交互网页教程，共 7 章。

代码不是截图——**在浏览器里真实运行 Python**，可以直接修改后重跑。

---

## 怎么打开

```bash
cd web
python3 serve.py
```

浏览器会自动打开 <http://localhost:8000>。

> **为什么不能直接双击 index.html？**
> 直接打开（`file://`）时，幻灯片、动画、讲师讲解都能正常看，
> 但「运行」按钮不可用——浏览器的安全策略会拦截 Web Worker。
> `serve.py` 会顺带处理 `.mjs` / `.wasm` 的 MIME 类型和缓存头。

---

## 操作方式

### 翻页

| 操作 | 说明 |
|---|---|
| <kbd>←</kbd> <kbd>→</kbd> / <kbd>空格</kbd> | 上一页 / 下一页 |
| <kbd>PgUp</kbd> <kbd>PgDn</kbd> <kbd>Home</kbd> <kbd>End</kbd> | 翻页控制 |
| 触屏左右滑动 | 移动端翻页 |
| 点击左右边缘 | 桌面端翻页热区 |

### 功能

| 快捷键 | 功能 |
|---|---|
| <kbd>O</kbd> | 本页总览（缩略网格，点击跳转） |
| <kbd>S</kbd> | 讲师讲解抽屉（来自 PPT 的演讲者备注） |
| <kbd>F</kbd> | 全屏，适合课堂投影 |
| <kbd>Esc</kbd> | 关闭总览 / 讲解 |

顶栏右侧还有明暗主题切换（默认跟随系统）与讲授/自学模式切换。

### 代码

- **运行** — 真实执行，输出显示在下方终端区
- **编辑** — 可改代码，<kbd>Ctrl</kbd>+<kbd>Enter</kbd> 运行，<kbd>Esc</kbd> 退出编辑
- **还原** — 恢复成原始示例
- **显示全部** — 跳过打字机动画（也可以直接点代码区域）

### 两种模式

| | 课堂讲授 | 课后自学（默认） |
|---|---|---|
| 讲解文字 | 收进侧边抽屉 | 直接展开在页面上 |
| 字号 | 放大一档 | 常规 |
| 学习进度 | 不记录 | 记住学到哪一页 |

---

## 目录结构

```
web/
├── index.html              课程首页
├── chapter.html            章节页（?ch=N，七章共用一套引擎）
├── serve.py                本地服务器
├── favicon.svg
├── assets/
│   ├── css/
│   │   ├── tokens.css      设计令牌：配色、字号、明暗主题变量
│   │   ├── deck.css        幻灯片布局与翻页外壳
│   │   ├── code.css        代码块、高亮、终端、编辑器
│   │   ├── anim.css        入场动画、打字机、知识地图
│   │   ├── responsive.css  窄屏重排
│   │   └── home.css        首页
│   ├── js/
│   │   ├── icons.js        内联 SVG 图标
│   │   ├── code.js         Python 词法高亮 + 逐 token 揭示
│   │   ├── render.js       数据 → DOM 布局模板
│   │   ├── deck.js         翻页引擎
│   │   ├── runner.js       Worker 池、超时恢复、编辑器
│   │   ├── py-worker.js    Pyodide Worker（模块化）
│   │   ├── trace.js        单步追踪播放器
│   │   ├── theme.js        明暗主题
│   │   ├── mode.js         双模式与学习进度
│   │   ├── home.js         首页逻辑
│   │   └── main.js         章节页启动流程
│   ├── data/
│   │   ├── ch1.js … ch7.js 各章内容
│   │   └── manifest.js     章节目录
│   └── vendor/pyodide/     内置 Python 运行时（约 29MB，含 numpy/pandas/matplotlib）
└── tools/                  仅开发期使用，不随站点发布
    ├── extract_pptx.py     从 PPT 提取素材
    ├── verify_examples.mjs 实跑所有代码片段并比对预期输出
    ├── qa.mjs              无头浏览器截图与错误检查
    ├── CONTENT-SPEC.md     内容编写规范
    └── out/                PPT 提取结果
```

---

## 离线可用

Python 运行时（Pyodide 314.0.7）连同 numpy、pandas、matplotlib 全部内置于
`assets/vendor/pyodide/`，**断网也能运行代码**。

首次点「运行」时加载约 10MB 的 wasm。页面在空闲时会提前预热，
所以实际点下去通常已经就绪（实测约 0.4 秒）。

---

## 运行环境的边界

浏览器里的 Python 是真实 CPython（编译成 WebAssembly），但不是完整的桌面环境：

| 限制 | 说明 |
|---|---|
| `input()` | 没有键盘输入通道，会给出中文提示 |
| `requests` | 无底层网络套接字，无法真实发请求 |
| 文件系统 | 是内存虚拟盘，重启即清空；示例用到的文件已在代码里预置 |
| 死循环 | 5 秒超时后强制停止，运行时会自动重启，**页面不受影响** |

页面上遇到这些限制都会明确标注，不会假装能跑。

---

## 修改内容

### 改某一页的文字

编辑 `assets/data/chN.js`，找到对应页改字段即可。

### 加一页

在该章的数组里插入一个对象，`type` 可选：

`title` `map` `toc` `section` `cards` `split` `code` `compare` `end`

字段说明见 `tools/CONTENT-SPEC.md`。

### 改配色

全部颜色定义在 `assets/css/tokens.css`，深色在 `[data-theme="dark"]`、
浅色在 `[data-theme="light"]` 两个块里。改一处即全局生效。

---

## 开发者：质量检查

改完内容后跑这两条：

```bash
node tools/verify_examples.mjs          # 实跑所有代码，比对预期输出
node tools/qa.mjs errors                # 无头浏览器检查控制台错误
node tools/qa.mjs variants 1 3,5        # 截图：深/浅 × 桌面/手机
```

`verify_examples.mjs` 是本项目的质量闸——页面上写了「点击运行看看结果」，
就必须真的能跑出那个结果。
