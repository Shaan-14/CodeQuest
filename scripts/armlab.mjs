/**
 * Character lab: renders the rigs side by side in a poses strip (idle, walk, run, jump, wave, cheer, point, talk) on the dev server, for art review.
 * Usage: node scripts/riglab.mjs <out.png> [look-json]
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4411;
const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const CLOSE = process.argv.includes('--close');
const p = await b.newPage({ viewport: { width: 1600, height: 640 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e.stack || e).slice(0, 400)));
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
const cx = process.argv.find((a) => a.startsWith('--cx='))?.slice(5) ?? '-3.2';
await p.goto(`http://localhost:${PORT}/?cx=${cx}`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
if (await p.getByTestId('welcome-start').count()) await p.getByTestId('welcome-start').click();
const out = process.argv[2] ?? '/tmp/armlab';
const scenarios = (process.argv[3] ?? 'idle,walk,run,stop,jump,land,turn,type,swing,pitch,catch').split(',');
for (const sc of scenarios) {
  await p.evaluate(async (sc) => {
    const stage = window.__cq3d.stage; stage.updateCamera = () => {}; stage.snapCamera = () => {}; stage.worldGroup.visible = false; stage.npcs.forEach((n) => { n.rig.group.visible = false; }); stage.scene.background = new (stage.scene.background.constructor)(0x2a2f45); stage.scene.fog = null;
    if (window.__lab) for (const r of window.__lab) stage.scene.remove(r.group);
    const { createRig } = await import('/src/play/engine/rig.ts');
    const look = { body: 0x5b6bd6, head: 0xf2c9a0, accent: 0xf2c14e, hair: 0xe8d9b0, hairStyle: 'short', hat: 'none', outfit: 'tech', accessory: 'techpack', legs: 0x232a42 };
    // four copies of the same rig stepped identically, seen from the front, three-quarter, side and back
    const yaws = [Math.PI, Math.PI - 0.8, Math.PI / 2, 0];
    window.__lab = yaws.map((y, i) => { const rig = createRig(look); rig.group.position.set(-2.4 + i * 1.6, 0, 0); rig.setFacing(y, true); stage.scene.add(rig.group); return rig; });
    const dt = 1 / 60; const step = (n, pose, speed, f) => { for (let k = 0; k < n; k++) { if (f) f(k); for (const r of window.__lab) r.update(dt, pose, speed); } };
    for (const r of window.__lab) r.update(dt, 'idle', 0);
    if (sc === 'idle') step(240, 'idle', 0);
    if (sc === 'walk') step(130, 'walk', 3.2);
    if (sc === 'run') step(150, 'run', 5.6);
    if (sc === 'stop') { step(150, 'run', 5.6); step(9, 'idle', 0); }
    if (sc === 'jump') { step(120, 'run', 5.6); step(18, 'jump', 5.6); }
    if (sc === 'land') { step(120, 'run', 5.6); step(30, 'jump', 5.6); step(4, 'run', 5.6); }
    if (sc === 'turn') { step(120, 'run', 5.6); for (const r of window.__lab) r.setFacing(r.facing() + 1.4); step(14, 'run', 5.6); }
    if (sc === 'type') { for (const r of window.__lab) r.hold('type'); step(70, 'idle', 0); }
    if (sc === 'swing') { for (const r of window.__lab) r.play('swing'); step(26, 'idle', 0); }
    if (sc === 'pitch') { for (const r of window.__lab) r.play('pitch'); step(34, 'idle', 0); }
    if (sc === 'catch') { for (const r of window.__lab) r.hold('catch'); step(40, 'idle', 0); }
    stage.hooks.length = 0;
    const cam = stage.camera; cam.position.set(0, 1.1, 4.6); cam.lookAt(0, 0.95, 0); cam.updateMatrixWorld(true);
    stage.renderer.setSize(1600, 640, false); cam.aspect = 1600 / 640; cam.updateProjectionMatrix();
    document.querySelector('.play-overlay')?.setAttribute('style', 'display:none');
  }, sc);
  await p.waitForTimeout(500);
  await p.locator('[data-testid=play-canvas]').screenshot({ path: `${out}-${sc}.png` });
}
console.log('errors:', errs.join('\n') || 'none');
await b.close(); srv.kill();
