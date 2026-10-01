/**
 * Screenshots of the 3D world on the Vite dev server (no build needed).
 * Usage: node scripts/devshot.mjs <out-prefix> [--bare] [--save=<fixture-key>] <scene:x,z,ry[:frames]> ...
 *   --col draws every blocking footprint in red from above; --bare hides the HUD; frames = how long (ms) to let the world animate before the shot.
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4412;
const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e.stack || e).slice(0, 400))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
const args = process.argv.slice(2); const out = args.shift() ?? '/tmp/shot'; const bare = args.includes('--bare'); const col = args.includes('--col');
await p.goto(`http://localhost:${PORT}/`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
if (await p.getByTestId('welcome-start').count()) await p.getByTestId('welcome-start').click();
let n = 0;
for (const a of args.filter((x) => !x.startsWith('--'))) {
  const [scene, pos, ms] = a.split(':'); const [x, z, ry] = (pos ?? '').split(',').map(Number);
  if (scene) await p.evaluate((sc) => window.__cq3d.travel(sc), scene);
  if (pos) await p.evaluate(([x, z, ry]) => window.__cq3d.teleport(x, z, ry), [x, z, ry ?? 0]);
  if (col) { await p.evaluate(() => window.__cq3d.colliders(true)); await p.evaluate(() => { window.__cq3d.stage.pitch = 1.15; window.__cq3d.stage.dist = 12; }); }
  if (bare) await p.evaluate(() => document.querySelector('.play-overlay')?.setAttribute('style', 'display:none'));
  await p.waitForTimeout(Number(ms ?? 700));
  const st = await p.evaluate(() => window.__cq3d.stage.stats());
  await p.screenshot({ path: `${out}-${n++}.png` });
  console.log(a, JSON.stringify(st));
}
console.log('errors:', errs.join('\n') || 'none');
await b.close(); srv.kill();
