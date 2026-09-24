/* ============================================================
   Pyodide Worker（必须作为 { type: 'module' } 加载）

   为什么用 Worker：学员可以改代码，一旦写出 while True:，
   主线程方案会整页卡死且无法恢复。Worker 可以被 terminate() 后重建
   （实测重建仅约 1 秒），页面始终可用。

   为什么用模块化 Worker + 动态 import()：Pyodide 314.x 已移除
   pyodide.asm.js（改名 .asm.mjs），importScripts 的老式写法不再支持。
   动态 import 同时让"本地优先、CDN 兜底"变得很自然。
   ============================================================ */

const LOCAL_URL = new URL('../vendor/pyodide/', import.meta.url).href;
const CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';

/* 输出上限：防止学员写 while True: print(x) 刷爆 DOM */
const MAX_OUTPUT_BYTES = 200 * 1024;
const MAX_STEPS = 4000;

let pyodide = null;
let source = 'local';
let outputBytes = 0;
let truncated = false;

/* stdout / stderr 各自缓冲。
   注意：Pyodide 的 batched 回调会把换行符剥掉，必须补回，
   否则所有输出会粘成一行（实测 "1\n3" 会变成 "13"）。
   缓冲区按"同步时钟 + 大小"节流 —— 不能用 setTimeout，
   因为 wasm 执行期间 worker 的事件循环被阻塞，定时器根本不会触发。 */
function makeWriter(stream) {
  let buf = [];
  let bytes = 0;
  let last = performance.now();

  function flush() {
    if (!buf.length) return;
    self.postMessage({ type: 'out', stream, text: buf.join('') });
    buf = [];
    bytes = 0;
    last = performance.now();
  }

  const write = (chunk) => {
    outputBytes += chunk.length + 1;
    if (outputBytes > MAX_OUTPUT_BYTES) {
      truncated = true;
      // 抛错才能真正中止 Python 侧的疯狂输出，而不是任由它继续跑
      throw new Error('__OUTPUT_LIMIT__');
    }
    buf.push(chunk + '\n');
    bytes += chunk.length + 1;
    if (bytes > 8192 || performance.now() - last > 32) flush();
  };
  write.flush = flush;
  return write;
}

let outWriter = null;
let errWriter = null;

/* ---------- 启动 ---------- */
async function boot() {
  let mod;
  try {
    mod = await import(/* @vite-ignore */ LOCAL_URL + 'pyodide.mjs');
    source = 'local';
  } catch (localErr) {
    self.postMessage({ type: 'boot-note', text: '本地运行时不可用，改用 CDN 加载…' });
    mod = await import(/* @vite-ignore */ CDN_URL + 'pyodide.mjs');
    source = 'cdn';
  }
  self.postMessage({ type: 'boot-src', text: source });

  pyodide = await mod.loadPyodide({
    indexURL: source === 'local' ? LOCAL_URL : CDN_URL
  });

  outWriter = makeWriter('stdout');
  errWriter = makeWriter('stderr');
  pyodide.setStdout({ batched: outWriter });
  pyodide.setStderr({ batched: errWriter });

  // 网页里没有标准输入。setStdin({error:true}) 保证不挂起，
  // Python 侧再覆写 input() 给出学员看得懂的中文提示。
  pyodide.setStdin({ error: true });
  pyodide.runPython(`
import builtins as _b
def _no_input(prompt=""):
    raise RuntimeError(
        "网页版没有键盘输入通道，input() 无法使用。\\n"
        "请把输入值直接写进代码，例如把 name = input() 改成 name = \\"小明\\"。"
    )
_b.input = _no_input
del _b
`);

  self.postMessage({ type: 'ready' });
}

/* ---------- 虚拟文件系统 ---------- */
/* 第四章需要 math_operations.py 才能 import，
   第六章的示例要读写 test.txt，都在这里预置。 */
function seedFiles(files) {
  if (!files) return;
  const FS = pyodide.FS;
  const dir = '/home/pyodide';
  for (const name of Object.keys(files)) {
    const path = dir + '/' + name;
    try { FS.unlink(path); } catch (e) { /* 不存在则忽略 */ }
    FS.writeFile(path, files[name], { encoding: 'utf8' });
  }
}

/* ---------- 运行 ---------- */
async function run(msg) {
  truncated = false;
  outputBytes = 0;

  try {
    if (msg.packages && msg.packages.length) {
      self.postMessage({ type: 'pkg', text: '正在加载 ' + msg.packages.join('、') + '…' });
      await pyodide.loadPackage(msg.packages, {
        messageCallback: (s) => self.postMessage({ type: 'pkg', text: s }),
        errorCallback: (s) => self.postMessage({ type: 'pkg', text: s })
      });
    }

    seedFiles(msg.files);

    // 每次运行都用一个全新的 globals：否则上一页的变量会泄漏到下一页，
    // 本该报 NameError 的例子会静默跑通，教学上是错的。
    const g = pyodide.toPy({ __name__: '__main__' });
    try {
      await pyodide.runPythonAsync(msg.code, {
        globals: g,
        filename: '<示例>',
        // 关掉自动 dedent：学员若粘贴了整体缩进的代码，
        // 我们宁可如实报 IndentationError，也不要静默改写缩进
        dedent: false
      });
      outWriter.flush();
      errWriter.flush();
      self.postMessage({
        type: 'done',
        id: msg.id,
        truncated
      });
    } finally {
      // PyProxy 不销毁会持续占用 wasm 内存
      g.destroy();
    }
  } catch (err) {
    try { outWriter.flush(); errWriter.flush(); } catch (e) { /* 限额已触发 */ }
    self.postMessage({
      type: 'error',
      id: msg.id,
      text: friendlyError(err),
      raw: String((err && err.message) || err),
      truncated,
      limitHit: /__OUTPUT_LIMIT__/.test(String((err && err.message) || err))
    });
  }
}

/* 把报错翻译成学员看得懂的说明 */
function friendlyError(err) {
  const raw = String((err && err.message) || err);

  if (/__OUTPUT_LIMIT__/.test(raw)) {
    return '输出内容过多，已自动中止。请检查是不是写了没有终止条件的循环。';
  }
  if (/no input|标准输入|input\(\)|RuntimeError: 网页版/.test(raw)) {
    return raw.replace(/^.*RuntimeError:\s*/, '');
  }
  if (/ModuleNotFoundError|No module named/i.test(raw)) {
    const m = /No module named '?([\w.]+)'?/.exec(raw);
    const name = m ? m[1] : '该模块';
    if (name === 'requests') {
      return '浏览器环境没有底层网络套接字，requests 无法在这里真实发送请求。\n本页展示的是示例代码，输出为预置结果。';
    }
    return '找不到模块 ' + name + '。网页版内置了常用标准库，以及 numpy、pandas、matplotlib。';
  }
  if (/IndentationError/i.test(raw)) {
    return '缩进有误。Python 用缩进表示代码块，请检查冒号后的行是否对齐。\n\n' + raw;
  }
  if (/SyntaxError/i.test(raw)) {
    return '语法错误。常见原因是引号没有配对、括号不匹配、或把全角符号（""（））当成了半角。\n\n' + raw;
  }
  if (/ZeroDivisionError/i.test(raw)) {
    return '除以零了。请检查除数是否可能为 0。';
  }
  if (/FileNotFoundError/i.test(raw)) {
    return '文件不存在。本页的示例运行在浏览器的虚拟文件系统里，只包含示例预置的文件。\n\n' + raw;
  }
  if (/KeyboardInterrupt/i.test(raw)) {
    return '执行被中断。';
  }
  return raw;
}

/* ---------- 单步追踪录制 ----------
   sys.settrace 在 Pyodide 中可用（已实测行号与局部变量快照正确）。
   关键约束：trace 函数不能是 async，无法边跑边等用户按键，
   因此这里只负责"全速录制"，播放交给主线程。

   三个必须做的防护，缺一就崩：
   1. 按文件名过滤 —— 否则会追踪进整个标准库，第一个 print() 就爆
   2. 步数上限 —— 否则遇到循环会无限录制
   3. 捕获时 repr() 快照 —— 直接存 f_locals 拿到的是引用，
      列表被修改后只能看到最终状态
*/
const TRACER_SRC = `
import sys, builtins

def _record(src, cap=${MAX_STEPS}):
    steps = []
    code = compile(src, '<示例>', 'exec')
    ns = {'__name__': '__main__', '__builtins__': builtins}
    st = {'n': 0, 'done': False}

    def tracer(frame, event, arg):
        if st['done']:
            return None
        if frame.f_code.co_filename != '<示例>':
            return None
        if event == 'line':
            st['n'] += 1
            if st['n'] > cap:
                st['done'] = True
                sys.settrace(None)
                return None
            steps.append([
                frame.f_lineno,
                {k: repr(v)[:60] for k, v in frame.f_locals.items()
                 if not k.startswith('__')}
            ])
        return tracer

    sys.settrace(tracer)
    try:
        exec(code, ns)
    except BaseException:
        st['done'] = True
        raise
    finally:
        sys.settrace(None)
    return steps
`;

async function trace(msg) {
  try {
    if (msg.packages && msg.packages.length) {
      await pyodide.loadPackage(msg.packages);
    }
    seedFiles(msg.files);

    pyodide.runPython(TRACER_SRC);
    pyodide.globals.set('_SRC', msg.code);

    const proxy = pyodide.runPython('_record(_SRC)');
    const steps = proxy.toJs();
    proxy.destroy();          // PyProxy 不销毁会持续占用 wasm 内存
    pyodide.globals.delete('_SRC');
    pyodide.globals.delete('_record');

    self.postMessage({ type: 'trace-result', id: msg.id, steps });
  } catch (err) {
    self.postMessage({
      type: 'trace-error',
      id: msg.id,
      text: friendlyError(err)
    });
  }
}

/* ---------- 消息分发 ---------- */
self.onmessage = async (e) => {
  const msg = e.data || {};
  switch (msg.type) {
    case 'boot':
      try {
        await boot();
      } catch (err) {
        self.postMessage({ type: 'boot-error', text: String((err && err.message) || err) });
      }
      break;
    case 'run':
      if (!pyodide) { self.postMessage({ type: 'error', id: msg.id, text: '运行时尚未就绪。' }); return; }
      await run(msg);
      break;
    case 'trace':
      if (!pyodide) { self.postMessage({ type: 'trace-error', id: msg.id, text: '运行时尚未就绪。' }); return; }
      await trace(msg);
      break;
  }
};
