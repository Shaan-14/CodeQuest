/**
 * Plays a world effect's cinematic on the dev server and photographs it at intervals.
 * Usage: node scripts/cineshot.mjs <out-prefix> <scene> <target:action[,target:action...]> <every-ms> <count> [pre-effects]
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4413;
const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e.stack || e).slice(0, 500))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
const [out, scene, effects, every, count, pre] = process.argv.slice(2);
await p.goto(`http://localhost:${PORT}/`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
if (await p.getByTestId('welcome-start').count()) await p.getByTestId('welcome-start').click();
await p.evaluate((sc) => window.__cq3d.travel(sc), scene);
await p.evaluate(() => window.__cq3d.teleport(0, 4, 0));
const ev = (list) => list.split(',').filter(Boolean).map((s) => { const [t, a] = s.split(':'); return { type: 'worldEffect', target: t, action: a, challengeId: 'x' }; });
if (pre) { // earlier effects, shown instantly by re-loading the scene is not possible without the save: play them and skip
  await p.evaluate((e) => { window.__cq3d.stage.react(e); }, ev(pre));
  await p.waitForTimeout(500); await p.keyboard.press('Space'); await p.waitForTimeout(800); await p.keyboard.press('Space'); await p.waitForTimeout(500);
}
await p.evaluate((e) => { window.__cq3d.stage.react(e); }, ev(effects));
for (let i = 0; i < Number(count); i++) { await p.waitForTimeout(Number(every)); await p.screenshot({ path: `${out}-${String(i).padStart(2, '0')}.png` }); }
console.log('errors:', errs.join('\n') || 'none');
await b.close(); srv.kill();
