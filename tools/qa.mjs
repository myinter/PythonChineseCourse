#!/usr/bin/env node
/* ============================================================
   开发期 QA 工具：用 CDP 驱动无头 Chrome
   - 捕获控制台错误、页面异常、请求失败
   - 可翻到指定页并截图
   不属于站点，仅开发时使用。

   用法：
     node tools/qa.mjs shots           截图 index + 各章首页
     node tools/qa.mjs errors          只收集错误
     node tools/qa.mjs ch2 5           第2章第5页截图
   ============================================================ */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE || 'http://localhost:8000';
const OUT = 'tools/qa-out';
const PORT = 9333;

mkdirSync(OUT, { recursive: true });

/* ---------- 极简 CDP 客户端 ---------- */
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expr, timeoutMs = 30000) {
    // 加超时兜底：页面被 Pyodide 占住时，等待 Promise 的求值可能永不返回
    const r = await Promise.race([
      this.send('Runtime.evaluate', {
        expression: expr, awaitPromise: true, returnByValue: true
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('evaluate 超时')), timeoutMs))
    ]);
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
    }
    return r.result.value;
  }
}

async function launch() {
  const proc = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run', '--no-default-browser-check',
    '--disable-gpu', '--no-sandbox',
    '--hide-scrollbars',
    '--window-size=1440,900',
    '--user-data-dir=/tmp/qa-chrome-profile',
    'about:blank'
  ], { stdio: 'ignore' });

  // 等 CDP 端口就绪
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) break;
    } catch { /* 还没起来 */ }
    await sleep(250);
  }
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  const cdp = new CDP(ws);
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  return { proc, cdp };
}

function collectProblems(cdp) {
  const problems = [];
  for (const ev of cdp.events) {
    if (ev.method === 'Runtime.exceptionThrown') {
      const d = ev.params.exceptionDetails;
      problems.push({
        kind: 'exception',
        text: d.exception?.description || d.text,
        url: d.url, line: d.lineNumber
      });
    } else if (ev.method === 'Log.entryAdded') {
      const e = ev.params.entry;
      if (e.level === 'error' || e.level === 'warning') {
        problems.push({ kind: e.level, text: e.text, url: e.url });
      }
    } else if (ev.method === 'Network.loadingFailed') {
      const t = ev.params;
      if (!/favicon/.test(t.url || '')) {
        problems.push({ kind: 'netfail', text: `${t.type} ${t.errorText}`, url: t.url });
      }
    }
  }
  return problems;
}

async function visit(cdp, url, waitMs = 1800) {
  cdp.events.length = 0;
  await cdp.send('Page.navigate', { url });
  // 等章节数据加载完成
  for (let i = 0; i < 40; i++) {
    const ready = await cdp.evaluate(
      `!!(window.PYT && PYT.deck && document.querySelector('.slide.is-active'))`
    ).catch(() => false);
    if (ready) break;
    await sleep(150);
  }
  await sleep(waitMs);
}

/** 等入场动画播完再截图，否则会拍到 opacity:0 的中间态。
    注意：进行中的 CSS 动画优先级高于普通样式声明，
    因此加 is-settled 不足以盖过它，必须显式 finish() 所有动画。 */
async function settle(cdp) {
  // 轮询直到动画真正结束，而不是固定 sleep ——
  // 固定等待会在冷启动或忙帧时拍到 opacity:0 的中间态，出现"整页空白"的假象。
  // 也不用 requestAnimationFrame 等待：页面被 Pyodide 占住时 rAF 不触发会永久挂起。
  for (let attempt = 0; attempt < 25; attempt++) {
    const state = await cdp.evaluate(`(()=>{
      const s = document.querySelector('.slide.is-active');
      if (!s) return { ok: false, n: -1 };
      // 打字机光标是无限动画，finish() 不掉，直接收掉动画态
      s.querySelectorAll('.code-block.is-typing').forEach(b => b.classList.remove('is-typing'));
      let anims = [];
      try { anims = document.getAnimations(); } catch (e) { anims = []; }
      anims.forEach(a => {
        // 无限循环的装饰动画（辉光呼吸等）不参与"是否落定"的判断
        const inf = a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity;
        if (inf) return;
        try { a.finish(); } catch (e) {}
      });
      const pending = anims.filter(a => {
        const t = a.effect && a.effect.getTiming && a.effect.getTiming();
        return t && t.iterations !== Infinity && a.playState !== 'finished';
      }).length;
      s.classList.add('is-settled');
      return { ok: pending === 0, n: pending };
    })()`, 8000).catch(() => ({ ok: false, n: -1 }));

    if (state && state.ok) break;
    await sleep(150);
  }
  await sleep(260);
}

async function shot(cdp, name, opts = {}) {
  if (opts.width) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: opts.width, height: opts.height || 900,
      deviceScaleFactor: 1, mobile: !!opts.mobile
    });
    await sleep(400);
  }
  const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const file = `${OUT}/${name}.png`;
  writeFileSync(file, Buffer.from(r.data, 'base64'));
  if (opts.width) await cdp.send('Emulation.clearDeviceMetricsOverride');
  return file;
}

/* ---------- 场景 ---------- */
const cmd = process.argv[2] || 'shots';

const { proc, cdp } = await launch();
let exitCode = 0;

try {
  if (cmd === 'errors' || cmd === 'shots') {
    const targets = [
      ['index', `${BASE}/index.html`],
      ...Array.from({ length: 7 }, (_, i) => [`ch${i + 1}`, `${BASE}/chapter.html?ch=${i + 1}`])
    ];
    const allProblems = [];

    for (const [name, url] of targets) {
      await visit(cdp, url);
      const problems = collectProblems(cdp);
      const slideCount = await cdp.evaluate(
        `(document.querySelectorAll('.slide').length) + '/' + (window.PYT && PYT.data ? Object.keys(PYT.data).length : 0)`
      ).catch(() => '?');
      const rendered = await cdp.evaluate(
        `document.querySelector('.slide.is-active') ? document.querySelector('.slide.is-active').getAttribute('data-type') : 'NONE'`
      ).catch(() => '?');

      console.log(`${problems.length ? '⚠' : '✓'} ${name.padEnd(6)} 活动页=${rendered}  已渲染=${slideCount}`);
      problems.forEach(p => console.log(`    [${p.kind}] ${String(p.text).split('\n')[0].slice(0, 160)}`));
      allProblems.push(...problems.map(p => ({ page: name, ...p })));

      if (cmd === 'shots') await shot(cdp, name);
    }

    console.log(`\n共 ${allProblems.length} 个问题`);
    if (allProblems.length) exitCode = 1;

  } else if (cmd === 'verify') {
    /* 终极质量闸：在真实浏览器里把每一页的可运行代码点一遍，
       与实际输出比对。这是唯一能证明"页面上写的输出就是真实输出"的办法，
       也能覆盖必须靠 Pyodide 才能跑的 numpy/pandas 片段。 */
    const chapters = (process.argv[3] || '1,2,3,4,5,6,7').split(',').map(Number);
    let ok = 0, bad = 0, skipped = 0;
    const badList = [];

    for (const ch of chapters) {
      await visit(cdp, `${BASE}/chapter.html?ch=${ch}`, 1200);
      const total = await cdp.evaluate(`(PYT.data.ch${ch}||[]).length`).catch(() => 0);
      console.log(`\n── 第 ${ch} 章（${total} 页）──`);

      for (let i = 0; i < total; i++) {
        try {
          // 一次取回本页所需的全部信息，避免多次往返之间页面状态漂移
          const info = await cdp.evaluate(`(()=>{
            const s = PYT.data && PYT.data.ch${ch} && PYT.data.ch${ch}[${i}];
            if (!s || !s.code) return null;
            return { runnable: s.code.runnable !== false && !s.code.shell,
                     shell: !!s.code.shell,
                     pkg: s.code.packages || null,
                     want: (s.code.expectedOutput || '').trim(),
                     title: s.title || s.eyebrow || '' };
          })()`);
          if (!info) continue;
          if (!info.runnable) { skipped++; console.log(`  ⊘ p${i + 1} ${info.title} — 不可运行（预期）`); continue; }

          await settle(cdp);
          await cdp.evaluate(`PYT.deck.go(${i}, {history:'replace'})`);
          await sleep(700);
          await settle(cdp);

          const clicked = await cdp.evaluate(`(()=>{
            const b = document.querySelector('.slide.is-active [data-action="run"]');
            if (!b) return false; b.click(); return true;
          })()`);
          if (!clicked) { bad++; console.log(`  ✗ p${i + 1} ${info.title} — 找不到运行按钮`); badList.push(`ch${ch} p${i+1} 无运行按钮`); continue; }

          // 等执行结束。matplotlib 要拉 Pillow/contourpy/fonttools 等依赖，
          // 首次可能超过 30 秒，所以给足时间
          let status = '';
          for (let k = 0; k < 240; k++) {
            await sleep(500);
            status = await cdp.evaluate(`document.querySelector('.slide.is-active [data-term-status]')?.textContent||''`);
            if (status === '完成' || status === '出错' || status === '超时' || status === '已截断') break;
          }

          // 按 DOM 结构取文本，不用 innerText ——
          // innerText 依赖渲染结果，空行的行盒容易被吞掉，导致测量失真
          const got = await cdp.evaluate(`(()=>{
            const b = document.querySelector('.slide.is-active [data-term-body]');
            if (!b) return '';
            return [...b.querySelectorAll('.term-line')].map(l => l.textContent).join('\\n')
              // 去掉终端自己加的命令回显行
              .split('\\n').filter(l => !l.startsWith('$ '))
              // 去掉运行时加载第三方库的提示，那不是程序输出
              .filter(l => !/^(正在加载|Loading |Loaded |.*already loaded)/.test(l))
              .join('\\n').trim();
          })()`);

          if (status !== '完成' && status !== '已截断') {
            bad++;
            console.log(`  ✗ p${i + 1} ${info.title} — 状态 ${status}`);
            console.log(`      ${String(got).split('\n').slice(-2).join(' ').slice(0, 150)}`);
            badList.push(`ch${ch} p${i+1} ${status}`);
          } else if (got !== info.want) {
            bad++;
            console.log(`  ✗ p${i + 1} ${info.title} — 输出与预期不符`);
            console.log(`      期望: ${JSON.stringify(info.want.slice(0, 110))}`);
            console.log(`      实得: ${JSON.stringify(got.slice(0, 110))}`);
            badList.push(`ch${ch} p${i+1} 输出不符`);
          } else {
            ok++;
            console.log(`  ✓ p${i + 1} ${info.title}${info.pkg ? ' [' + info.pkg.join(',') + ']' : ''}`);
          }
        } catch (err) {
          // 单页异常不应中断整轮验证
          bad++;
          console.log(`  ✗ p${i + 1} — 检查过程出错：${String(err.message).slice(0, 120)}`);
          badList.push(`ch${ch} p${i+1} 检查出错`);
        }
      }
    }

    console.log(`\n${'─'.repeat(52)}`);
    console.log(`通过 ${ok} · 失败 ${bad} · 跳过 ${skipped}`);
    if (badList.length) { console.log('\n失败清单:'); badList.forEach(x => console.log('  · ' + x)); }
    if (bad) exitCode = 1;

  } else if (cmd === 'variants') {
    // 同一页在 深色/浅色 × 桌面/手机 四种组合下的表现
    const ch = process.argv[3] || '1';
    const slides = (process.argv[4] || '1').split(',').map(Number);
    await visit(cdp, `${BASE}/chapter.html?ch=${ch}`);
    const combos = [
      ['dark', 'desktop', null],
      ['light', 'desktop', null],
      ['dark', 'mobile', { width: 390, height: 844, mobile: true }],
      ['light', 'mobile', { width: 390, height: 844, mobile: true }]
    ];
    for (const s of slides) {
      await settle(cdp);
      await cdp.evaluate(`PYT.deck.go(${s - 1}, {history:'push'})`);
      await sleep(900);
      await settle(cdp);
      for (const [theme, size, metrics] of combos) {
        await cdp.evaluate(`document.documentElement.setAttribute('data-theme','${theme}')`);
        await sleep(250);
        const f = await shot(cdp, `ch${ch}-p${s}-${theme}-${size}`, metrics || {});
        console.log(`${f}`);
      }
      await cdp.evaluate(`document.documentElement.setAttribute('data-theme','dark')`);
    }

  } else if (/^ch\d$/.test(cmd)) {
    const ch = cmd.slice(2);
    const slides = process.argv[3] ? process.argv[3].split(',').map(Number) : [1];
    const url = `${BASE}/chapter.html?ch=${ch}`;
    await visit(cdp, url);
    for (const s of slides) {
      // 先落定再跳页，避免在动画中途截图
      await settle(cdp);
      await cdp.evaluate(`PYT.deck.go(${s - 1}, {history:'push'})`);
      await sleep(900);
      await settle(cdp);
      const f = await shot(cdp, `ch${ch}-p${s}`);
      const probs = collectProblems(cdp);
      console.log(`ch${ch} p${s} -> ${f}${probs.length ? '  ⚠ ' + probs.length : ''}`);
      probs.forEach(p => console.log(`    [${p.kind}] ${String(p.text).split('\n')[0].slice(0,160)}`));
    }
  }
} finally {
  proc.kill();
}

process.exit(exitCode);
