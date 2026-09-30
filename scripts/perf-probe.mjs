/**
 * Performance probe (real Chromium, production build). Usage: node scripts/perf-probe.mjs [heavy]
 * Reports: transferred JS/CSS/wasm per phase, time to interactive title, time to the Academy with a late-game save,
 * long tasks (>50 ms) while navigating, JS heap, and the cost of the store's save write.
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
const root = process.env.PW_ROOT ?? '/opt/pw-browsers';
const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const exe = process.env.CHROMIUM_PATH ?? `${root}/${dir}/chrome-linux/chrome`;
const PORT = 4396;
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const b = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--enable-precise-memory-info'] });
const heavy = process.argv[2] === 'heavy' && existsSync('/tmp/cq-heavy-save.json') ? readFileSync('/tmp/cq-heavy-save.json', 'utf8') : null;

async function session(label, save) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.__long = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] }); } catch {} });
  if (save) await p.addInitScript((s) => { if (!localStorage.getItem('codequest.save')) localStorage.setItem('codequest.save', s); }, save);
  const t0 = Date.now();
  await p.goto(`http://localhost:${PORT}`);
  await p.locator(save ? '[data-testid=hud]' : '[data-testid=name-input]').waitFor();
  const tInteractive = Date.now() - t0;
  const nav = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) }; });
  const res = await p.evaluate(() => performance.getEntriesByType('resource').filter((e) => /\.(js|css|wasm|mjs)(\?|$)/.test(e.name)).map((e) => ({ u: e.name.split('/').slice(-2).join('/'), bytes: e.encodedBodySize || e.transferSize || 0 })));
  const out = { label, tInteractiveMs: tInteractive, ...nav, startupBytesKB: Math.round(res.reduce((a, r) => a + r.bytes, 0) / 1024), startupFiles: res.map((r) => `${r.u}:${Math.round(r.bytes / 1024)}K`) };
  if (save) {
    // Interaction latency: enter each world from the Academy and come back.
    const times = [];
    for (const w of ['python', 'sql', 'web', 'sheets']) {
      const t = Date.now();
      await p.getByTestId('enter-' + w).click();
      await p.locator('[data-testid^=area-screen-], [data-testid=grounds]').first().waitFor();
      times.push([w, Date.now() - t]);
      await p.locator('button[title="World map"]').click(); await p.getByTestId('worldmap').waitFor();
      await p.getByTestId('area-academy').click(); await p.getByTestId('world-chooser').waitFor();
    }
    out.enterWorldMs = times;
  }
  out.longTasks = await p.evaluate(() => window.__long);
  out.heapMB = await p.evaluate(() => Math.round((performance.memory?.usedJSHeapSize ?? 0) / 1048576));
  if (save) out.saveWriteMs = await p.evaluate(() => { const s = localStorage.getItem('codequest.save'); const t = performance.now(); for (let i = 0; i < 20; i++) { JSON.parse(s); localStorage.setItem('codequest.save', s); } return Math.round((performance.now() - t) / 20 * 10) / 10; });
  await ctx.close();
  return out;
}
console.log(JSON.stringify(await session('cold (new player)', null), null, 1));
if (heavy) console.log(JSON.stringify(await session('late-game save (126 lessons, 378 evidence)', heavy), null, 1));
await b.close(); srv.kill();
