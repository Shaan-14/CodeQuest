/**
 * Launches the production build in real Chromium (software WebGL), creates a player, enters the 3D world and saves screenshots.
 * Usage: node scripts/shot3d.mjs <out-prefix> [scene] [x,z,ry] ...   (extra args: "scene:x,z,ry" sequences to visit and photograph)
 * Prints console errors and the renderer statistics (draw calls, triangles) for each shot.
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = process.env.PW_ROOT ?? '/opt/pw-browsers';
const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4394;
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? `${root}/${dir}/chrome-linux/chrome`, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
await p.addInitScript(() => localStorage.setItem('codequest.e2e', '1'));
await p.goto(`http://localhost:${PORT}`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 30000 });
const out = process.argv[2] ?? '/tmp/shot';
const shots = process.argv.slice(3).length ? process.argv.slice(3) : ['maintenance-bay:0,7,0'];
let n = 0;
for (const s of shots) {
  const [scene, pos] = s.split(':'); const [x, z, ry] = (pos ?? '').split(',').map(Number);
  if (scene) await p.evaluate(([sc]) => window.__cq3d.travel(sc), [scene]);
  if (pos) await p.evaluate(([x, z, ry]) => window.__cq3d.teleport(x, z, ry), [x, z, ry ?? 0]);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}-${n++}.png` });
  console.log(s, JSON.stringify(await p.evaluate(() => ({ ...window.__cq3d.state(), stats: window.__cq3d.stage.stats() }))));
}
console.log('errors:', errs.length ? errs.slice(0, 8) : 'none');
await b.close(); srv.kill();
