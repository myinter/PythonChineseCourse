# 章节内容编写规范

你要为已搭好的网页幻灯片引擎，编写一章的内容数据文件 `assets/data/chN.js`。

**先读 `assets/data/ch1.js`** —— 那是已完成的范例，也是唯一权威的格式参考。
本文件只补充约束与注意事项。

---

## 一、产物

一个 `.js` 文件，形如：

```js
(function (global) {
  'use strict';
  global.PYT = global.PYT || {};
  global.PYT.data = global.PYT.data || {};
  global.PYT.data.chN = [ /* 幻灯片数组 */ ];
})(window);
```

- **必须能通过 `node --check assets/data/chN.js`**（没有语法错误）
- 字符串一律用单引号；需要多行时用模板字符串（反引号）
- 正文里的内联代码用反引号包裹，例如 `` '`print()` 用于输出' ``，
  引擎会把它渲染成 `<code>`。**注意反引号与引号成对，别漏掉闭合引号。**

---

## 二、内容来源

**只使用 PPT 原文与演讲者备注的内容**，不要杜撰 PPT 里没有的技术点。

素材已提取到 `tools/out/chN.json`，结构：

```json
{
  "slides": [
    {
      "n": 1,
      "title_guess": "…",
      "notes": "演讲者备注原文（讲师逐字讲稿）",
      "blocks": [ { "text": "…", "lines": ["…"], "pos": {"x":…,"y":…}, "is_code": true } ]
    }
  ]
}
```

- `notes` 是**讲师讲稿**，绝大多数页面都有。**必须原样放进 `notes` 字段**，
  它是这套课件的精华，学员点「讲师讲解」就能看到。
  可以整理标点与分段，但不要改写内容、不要增删语义。
- 正文与卡片文字也来自 PPT，可以做**措辞润色与结构化**（PPT 上是大段文字，
  网页上拆成卡片更好读），但不要改变技术含义。

---

## 三、幻灯片类型

`type` 取值与所需字段：

| type | 用途 | 必填字段 | 选填 |
|---|---|---|---|
| `title` | 章封面 | `title` | `eyebrow`, `lead`, `notes` |
| `map` | 知识地图 | `map.root`, `map.branches[]` | `eyebrow`, `title`, `lead`, `notes` |
| `toc` | 目录 | `items[{num,title,body}]` | `eyebrow`, `title`, `lead`, `notes` |
| `section` | 分节页 | `num`, `title` | `sub`, `lead`, `notes` |
| `cards` | 卡片组 | `cards[{icon,heading,body}]` | `eyebrow`, `title`, `lead`, `note`, `code`, `notes` |
| `split` | 左讲解右代码 | `code` | `points[]`, `cards[]`, `note`, `traceable`, `notes` |
| `code` | 代码为主 | `code` | `points[]`, `note`, `notes` |
| `compare` | 对比 | `table{head,rows}` 或 `versus{a,b}` | `eyebrow`, `title`, `lead`, `notes` |
| `end` | 结尾 | `title` | `icon`, `lead`, `cards[]`, `notes` |

**建议的页面编排**（参考第一章的 10 页节奏）：

封面 → 知识地图 → 分节页(01) → 内容页… → 分节页(02) → 内容页…
→ 分节页(03) → 内容页… → 结尾小结

PPT 里 12–15 页的内容，扩成 12–18 页网页幻灯片是合适的
（PPT 一页常塞了太多东西，拆开更好读）。

### `icon` 可选值

```
number text boolean none variable tag convert calculator compare logic
branch loop sequence index merge stop skip sparkle layers truthy
list tuple dictionary set unbox copy clone
fn params return scope lambda module toolbox blocks import
os sys math random clock json regex package download cloud chart table tree
file fileWrite lock shield alert bug steps
object blueprint house inherit poly encapsulate cat coffee
play pause check close grid notes sun moon python book terminal wrench target bulb question
```

---

## 四、代码块（最重要）

```js
code: {
  file: 'demo.py',            // 面板标题显示的文件名
  source: `x = 10
if x > 0:
    print("正数")`,
  runnable: true,             // 默认 true；终端命令用 shell: true 代替
  expectedOutput: `正数`,      // 必须与真实输出逐字符一致
  files: { 'helper.py': '…' },// 可选：预写入虚拟文件系统
  packages: ['numpy'],        // 可选：需按需加载的第三方库
  editable: false             // 可选：禁止编辑
}
```

### 硬性规则

1. **缩进必须正确**。PPT 导出的代码缩进全部丢失，`for` / `if` / `def` /
   `with` / `try` 的块体必须缩进 4 空格。
2. **禁止全角标点进入代码**。PPT 里混进了 `“ ” ‘ ’`，
   直接导致 `SyntaxError`。代码里只用半角 `" ' ( ) , :`。
3. **`//` 不是 Python 注释**，注释一律用 `#`。
4. **等号两侧加空格**：写 `x = 10`，不要 `x =10` / `x= 10` / `x=10`。
5. **必须是完整可运行的片段**。PPT 里很多是跨文本框拆散的碎片
   （如单独一行的 `try:`），必须补成完整例子。
6. **`expectedOutput` 必须真实**。写完后实际运行确认，不要凭想象填写。

### 运行环境限制

运行在浏览器里的 Pyodide（CPython 3.14）上，因此：

| 情况 | 处理 |
|---|---|
| `input()` | **不可用**（无键盘输入通道）。要么改用变量赋值，要么在 `note` 里说明 |
| `pip install` | 不是 Python 语法 → 用 `shell: true` 标记，不设 `runnable` |
| `requests` | 浏览器无底层套接字，真实请求会失败 → `runnable: false`，并加 `note` 说明这是预置输出 |
| `os.makedirs` / 真实路径 | 虚拟文件系统可写，但路径要用相对路径（如 `'demo.txt'`） |
| 文件读取 | 要读的文件必须先在 `files` 里预置，否则会 `FileNotFoundError` |
| 需要联网的操作 | 标 `runnable: false` |

### 可用性

- **标准库**：全部可用
- **numpy / pandas / matplotlib**：已内置，用 `packages: ['numpy']` 声明即可
- 其他第三方库：不可用

### 局限性要如实说明

不能跑的例子（如 `requests`）**不要假装能跑**。用
`runnable: false` 关闭运行按钮，并加一条 `note`：

```js
note: { icon: 'alert', title: '运行环境说明', text: '…具体原因…' }
```

---

## 五、可选：单步追踪

适合「循环逐次执行」这类需要看清每步的页面，加 `traceable: true`：

```js
{
  type: 'split',
  traceable: true,          // 只需这一个字段，播放器会自动装上
  code: { … }
}
```

若某段代码的追踪结果不理想，可以用 `traceScript` 直接给一份预置轨迹
（格式 `[[行号, {变量: 值字符串}], …]`），播放器分辨不出差别。

- 只在**代码较短（一般 ≤ 15 行）且逻辑清晰**时使用
- 代码里有循环或逐行变化时才值得，纯赋值没必要
- 一章用 1–2 次即可，多了反而干扰

---

## 六、自检（提交前必做）

```bash
node --check assets/data/chN.js          # 语法必须通过
node tools/verify_examples.mjs chN       # 代码必须全部跑通
```

第二条会把每个 `runnable` 的片段实际执行一遍并比对 `expectedOutput`，
**必须全绿**。若有失败，修正代码或改正 `expectedOutput`，
直到输出一致为止。

---

## 七、质量要求

- **讲解文字**：`lead` / `card.body` 要写得像讲师在对学员说话，
  不要堆砌名词。参考第一章的语感。
- **不要留占位内容**：不能有「此处待补充」「TODO」之类。
- **详略得当**：一页讲清一个点，不要把整章塞进一页。
- **中文排版**：中英文之间不加空格亦可，但同一个文件内保持一致；
  代码与中文之间建议留一个空格，如「用 `print()` 输出」。
