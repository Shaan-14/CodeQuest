/**
 * Character lab: renders the rigs side by side in a poses strip (idle, walk, run, jump, wave, cheer, point, talk) on the dev server, for art review.
 * Usage: node scripts/riglab.mjs <out.png> [look-json]
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4411;
const srv = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const CLOSE = process.argv.includes('--close');
const p = await b.newPage({ viewport: { width: 1600, height: 560 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e.stack || e).slice(0, 400)));
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
const cx = process.argv.find((a) => a.startsWith('--cx='))?.slice(5) ?? '-3.2';
await p.goto(`http://localhost:${PORT}/?cx=${cx}`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
if (await p.getByTestId('welcome-start').count()) await p.getByTestId('welcome-start').click();
const out = process.argv[2] ?? '/tmp/riglab.png';
const close = CLOSE;
await p.evaluate(async (close) => {
  const stage = window.__cq3d.stage; stage.updateCamera = () => {}; stage.snapCamera = () => {};
  const { createRig } = await import('/src/play/engine/rig.ts');
  const looks = [
    { name: 'player', look: { body: 0x5b6bd6, head: 0xf2c9a0, accent: 0xf2c14e, hair: 0xe8d9b0, hat: 'none' }, pose: 'idle' },
    { name: 'walk', look: { body: 0x5b6bd6, head: 0xf2c9a0, accent: 0xf2c14e, hair: 0xe8d9b0, hat: 'none' }, pose: 'walk', speed: 3.2 },
    { name: 'run', look: { body: 0x3f8f5a, head: 0xd9a877, accent: 0xc9b37e, hair: 0x5a3a22, hat: 'none', hairStyle: 'long' }, pose: 'run', speed: 5.6 },
    { name: 'jump', look: { body: 0xc2603a, head: 0x8d5a3b, accent: 0x4fd1c5, hair: 0x1f1a1a, hat: 'none', hairStyle: 'curly' }, pose: 'jump', speed: 2 },
    { name: 'rowan', look: { body: 0xd98a2b, head: 0xd9a877, accent: 0xf2c14e, hair: 0x3a2a1a, hat: 'hardhat' }, pose: 'idle', one: 'wave' },
    { name: 'wizard', look: { body: 0x4b3a7a, head: 0xd9b48f, accent: 0xffd98a, hair: 0xd8d8e8, hat: 'wizard' }, pose: 'idle', one: 'cheer' },
    { name: 'juno', look: { body: 0xe8ecf7, head: 0xf2c9a0, accent: 0x2f9e8f, hair: 0xb8c0d8, hat: 'none', outfit: 'coat', accessory: 'lanyard' }, pose: 'idle', hold: 'point' },
    { name: 'robot', look: { body: 0x7dffb3, head: 0xcfd6ea, accent: 0x2f9e8f, shape: 'robot' }, pose: 'idle', talk: true },
  ];
  window.__lab = [];
  looks.forEach((l, i) => {
    const rig = createRig(l.look); rig.group.position.set(-7 + i * 2, 0, 0); rig.setFacing(Math.PI - 0.45, true); // facing the camera, turned a little
    stage.scene.add(rig.group);
    if (l.hold) rig.hold(l.hold); if (l.one) rig.play(l.one); if (l.talk) rig.talk(true);
    window.__lab.push({ rig, l });
  });
  stage.hooks.push((dt) => { for (const { rig, l } of window.__lab) rig.update(dt, l.pose, l.speed ?? 0); });
  const cam = stage.camera; if (close) { window.__lab.forEach(({ rig }, i) => rig.group.position.set(-7 + i * 2, 0, 0)); const cx = Number(new URLSearchParams(location.search).get('cx') ?? -3.2); cam.position.set(cx, 1.45, 4.2); cam.lookAt(cx, 1.2, 0); } else { cam.position.set(0, 1.35, 6.2); cam.lookAt(0, 0.95, 0); } cam.aspect = 1600 / 560; cam.fov = 40; cam.updateProjectionMatrix();
  stage.renderer.setSize(1600, 560, false);
  document.querySelector('.play-overlay')?.setAttribute('style', 'display:none');
}, close);
await p.waitForTimeout(1500);
await p.locator('[data-testid=play-canvas]').screenshot({ path: out });
console.log('errors:', errs.join('\n') || 'none');
await b.close(); srv.kill();
