/**
 * Photographs a scene as it was (pristine) or as it is (offline) from a chosen camera, on the dev server.
 * Usage: node scripts/lookshot.mjs <out-prefix> "<scene>|<spawn>|<power|save>|<pristine 0/1>|<x,z,yaw,pitch,dist,y>" ...
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4414;
const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
process.on('exit', () => srv.kill()); process.on('SIGTERM', () => process.exit(1)); // never leave a dev server behind
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e.stack || e).slice(0, 500))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
await p.goto(`http://localhost:${PORT}/`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
await p.waitForTimeout(800);
if (await p.getByTestId('cine-skip').count()) await p.getByTestId('cine-skip').click();
await p.waitForTimeout(800);
if (await p.getByTestId('welcome-start').count()) await p.getByTestId('welcome-start').evaluate((b) => b.click());
const [out, ...shots] = process.argv.slice(2);
let n = 0;
for (const s of shots) {
  const [scene, spawnName, power, pristine, cam, wait] = s.split('|');
  const [x, z, yaw, pitch, dist, y] = (cam ?? '').split(',').map(Number);
  await p.evaluate(([scene, spawnName, power, pristine, cam]) => window.__cq3d.look(scene, { spawn: spawnName || undefined, power: power === 'save' || power === '' ? null : Number(power), pristine: pristine === '1', cam }), [scene, spawnName, power, pristine, cam ? { x, z, yaw, pitch, dist, y: y ?? 1.2 } : undefined]);
  await p.waitForTimeout(Number(wait ?? 900));
  await p.screenshot({ path: `${out}-${n++}.png` });
  console.log(s, JSON.stringify(await p.evaluate(() => window.__cq3d.stage.stats())));
}
if (process.env.EVAL) console.log(JSON.stringify(await p.evaluate(process.env.EVAL)));
console.log('errors:', errs.length ? errs.slice(0, 6) : 'none');
await b.close(); srv.kill();
