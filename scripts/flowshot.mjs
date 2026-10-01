/** A short scripted walk through the first minutes (dev server), photographing each beat. Usage: node scripts/flowshot.mjs <out-prefix> */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4418;
const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e.stack || e).slice(0, 400)));
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
const out = process.argv[2] ?? '/tmp/claude-0/flow';
await p.goto(`http://localhost:${PORT}/`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
await p.screenshot({ path: `${out}-0-welcome.png` });
await p.getByTestId('welcome-start').click(); await p.waitForTimeout(800);
await p.evaluate(() => { window.__cq3d.stage.timeScale = 3; });
let n = 1; const shot = async (name) => { await p.waitForTimeout(500); await p.screenshot({ path: `${out}-${n++}-${name}.png` }); };
await shot('spawn');
await p.evaluate(() => window.__cq3d.teleport(0, 5.4, 0)); await p.waitForTimeout(600);
await p.keyboard.press('e'); await p.waitForTimeout(1500); await shot('kip-dialogue');
await p.keyboard.press('Space'); await p.waitForTimeout(400); await p.keyboard.press('Space'); await p.waitForTimeout(1800); await shot('kip-line2');
for (let i = 0; i < 8; i++) { if (await p.getByTestId('play-dialogue').count()) { await p.keyboard.press('Space'); await p.waitForTimeout(250); } }
await p.waitForTimeout(800); await shot('after-kip');
await p.evaluate(() => window.__cq3d.travel('maintenance-bay'));
await p.evaluate(() => window.__cq3d.teleport(3, 3.4, 0)); await p.waitForTimeout(700);
await p.keyboard.press('e'); await p.waitForTimeout(2500); await shot('juno-dialogue');
console.log('errors:', errs.join('\n') || 'none');
await b.close(); srv.kill();
