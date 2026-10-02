/**
 * Plays the opening on the dev server from a brand-new game and photographs it at intervals (game-clock seconds), printing which place each frame is in.
 * Usage: node scripts/openshot.mjs <out-prefix> [every-ms=1500] [max-shots=80]
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4416;
const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
process.on('exit', () => srv.kill()); process.on('SIGTERM', () => process.exit(1)); // never leave a dev server behind
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e.stack || e).slice(0, 500))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); localStorage.setItem('codequest.opening', 'play'); } catch { /* */ } });
await p.goto(`http://localhost:${PORT}/`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
const [out, every = '1500', max = '80'] = process.argv.slice(2);
if (process.env.TS) await p.evaluate((k) => { window.__cq3d.stage.timeScale = Number(k); }, process.env.TS);
const t0 = Date.now(); let n = 0;
while (n < Number(max)) {
  await p.waitForTimeout(Number(every));
  const info = await p.evaluate(() => { const st = window.__cq3d?.stage; return { scene: st?.def?.id, t: st ? +st.t.toFixed(1) : null, skip: !!document.querySelector('[data-testid=cine-skip]'), sub: document.querySelector('[data-testid=cine-subtitle]')?.textContent ?? null, calls: st ? st.stats().calls : 0, geo: st ? st.stats().geometries : 0 }; });
  await p.screenshot({ path: `${out}-${String(n).padStart(2, '0')}.png` });
  console.log(n, Math.round((Date.now() - t0) / 1000) + 's', JSON.stringify(info));
  n++;
  if (!info.skip && n > 2) break;
}
console.log('done after', Math.round((Date.now() - t0) / 1000), 's wall');
console.log('errors:', errs.length ? errs.slice(0, 8) : 'none');
await b.close(); srv.kill();
