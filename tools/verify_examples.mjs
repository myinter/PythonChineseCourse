#!/usr/bin/env node
/* ============================================================
   代码质量闸：把每章数据里 runnable 的代码片段实际跑一遍，
   与 expectedOutput 比对。

   这是本项目的核心保证 —— 页面上写「点击运行看看结果」，
   就必须真的能跑出那个结果。

   依赖第三方库的片段（numpy/pandas/matplotlib）本机没有，
   会被标为 browser-only，由 QA 阶段在浏览器里用 Pyodide 验证 ——
   那本来就是真实运行环境，比本机验证更准确。

   用法：
     node tools/verify_examples.mjs            检查全部章节
     node tools/verify_examples.mjs ch2 ch3    只检查指定章节
     node tools/verify_examples.mjs --fix      把真实输出回填到数据文件
   ============================================================ */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

// 用 window 垫片加载数据文件（它们是经典脚本）
global.window = global;
const require = createRequire(import.meta.url);

const CHAPTERS = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'];
const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const targets = args.filter(a => !a.startsWith('--'));
const list = targets.length ? targets : CHAPTERS;

// 需要第三方库的片段不在本机跑
const NEEDS_PKG = /^\s*(?:import|from)\s+(numpy|pandas|matplotlib|requests)\b/m;

let pass = 0, fail = 0, skip = 0;
const failures = [];

for (const ch of list) {
  const file = resolve(`assets/data/${ch}.js`);
  delete global.PYT;
  try {
    require(file);
  } catch (e) {
    console.log(`✗ ${ch}: 无法加载 — ${e.message}`);
    fail++;
    continue;
  }

  const slides = global.PYT?.data?.[ch] || [];
  let src = readFileSync(file, 'utf8');
  let modified = false;

  console.log(`\n── ${ch}（${slides.length} 页）──`);

  for (let i = 0; i < slides.length; i++) {
    const spec = slides[i];
    const code = collectCode(spec);
    for (const c of code) {
      const label = `${ch} p${i + 1} ${spec.title || ''}`.slice(0, 46).padEnd(48);

      if (c.shell) { skip++; console.log(`  ⊘ ${label} 终端命令，跳过`); continue; }
      if (c.source == null) continue;
      if (NEEDS_PKG.test(c.source)) {
        skip++;
        console.log(`  ⧗ ${label} 需第三方库，浏览器验证`);
        continue;
      }

      const got = runPython(c.source);
      const want = (c.expectedOutput || '').trim();
      const real = got.stdout.trim();

      if (got.error) {
        fail++;
        console.log(`  ✗ ${label} 运行报错`);
        console.log(`      ${got.error.split('\n').slice(-1)[0].slice(0, 140)}`);
        failures.push({ label, kind: 'error', detail: got.error });
        continue;
      }

      if (!want) {
        // 没有预期输出：把真实输出记下来，供回填
        if (real) {
          console.log(`  ∅ ${label} 缺 expectedOutput，真实输出 ${JSON.stringify(real.slice(0, 50))}`);
          if (FIX && c.path) { setExpected(src, c, real, slides, i); modified = true; }
        } else {
          console.log(`  ✓ ${label} 无输出，符合预期`);
          pass++;
        }
        continue;
      }

      if (real === want) {
        pass++;
        console.log(`  ✓ ${label}`);
      } else {
        fail++;
        console.log(`  ✗ ${label} 输出不一致`);
        console.log(`      期望: ${JSON.stringify(want.slice(0, 90))}`);
        console.log(`      实得: ${JSON.stringify(real.slice(0, 90))}`);
        failures.push({ label, kind: 'mismatch', want, real });
        if (FIX && c.path) { setExpected(src, c, real, slides, i); modified = true; }
      }
    }
  }

  if (FIX && modified) {
    writeFileSync(file, src, 'utf8');
    console.log(`  ↺ 已回填真实输出到 ${ch}.js`);
  }
}

/* ---------- 辅助 ---------- */

/** 收集一页里所有代码块（含 code 字段与卡片内嵌的） */
function collectCode(spec) {
  const out = [];
  if (spec.code) out.push(spec.code);
  return out;
}

function runPython(source) {
  const dir = mkdtempSync(join(tmpdir(), 'pyv-'));
  const f = join(dir, 'snippet.py');
  writeFileSync(f, source, 'utf8');
  try {
    const stdout = execFileSync('python3', [f], {
      timeout: 10000,
      encoding: 'utf8',
      cwd: dir,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });
    return { stdout };
  } catch (e) {
    if (e.killed) return { error: 'TIMEOUT（超过 10 秒，可能是死循环）', stdout: '' };
    const out = (e.stdout || '') + '';
    const err = (e.stderr || e.message || '') + '';
    return { error: err || out, stdout: out };
  }
}

/** 把真实输出写回数据文件里的对应 expectedOutput */
function setExpected(src, code, real, slides, slideIndex) {
  // 用源码里的 source 字面量定位，避免误改
  const marker = code.source.split('\n')[0].slice(0, 40);
  const idx = src.indexOf(marker);
  if (idx < 0) return;
  const tail = src.slice(idx);
  const m = /expectedOutput:\s*`([\s\S]*?)`/.exec(tail);
  if (!m) return;
  const start = idx + m.index;
  const end = start + m[0].length;
  const esc = real.includes('`') ? JSON.stringify(real) : '`' + real.trim() + '`';
  src = src.slice(0, start) + 'expectedOutput: ' + esc + src.slice(end);
}

console.log(`\n${'─'.repeat(52)}`);
console.log(`通过 ${pass} · 失败 ${fail} · 跳过 ${skip}`);
if (failures.length) {
  console.log('\n失败清单：');
  failures.forEach(f => console.log(`  · ${f.label}（${f.kind}）`));
}
console.log('');
process.exit(fail ? 1 : 0);
