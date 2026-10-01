/** Samples the repair rig's tool position, the loose arm and the socket during the arm-repair cinematic (dev server). */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4420;
const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 800, height: 500 } });
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
await p.goto(`http://localhost:${PORT}/`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
if (await p.getByTestId('welcome-start').count()) await p.getByTestId('welcome-start').click();
await p.evaluate(() => window.__cq3d.travel('maintenance-bay')); await p.waitForTimeout(600);
await p.evaluate(() => { window.__cq3d.stage.timeScale = 3; window.__cq3d.stage.react([{ type: 'worldEffect', target: 'bay.bolt', action: 'eyes', challengeId: 'x' }]); });
await p.waitForTimeout(400); await p.keyboard.press('Space'); await p.waitForTimeout(900);
await p.evaluate(() => {
  const st = window.__cq3d.stage; window.__trace = [];
  const tick = () => { const rig = st.dyn('repair-rig'), bolt = st.dyn('bolt'); const o = rig.object.getObjectByName('arm-tool'); const v = o.getWorldPosition(new o.position.constructor());
    const la = bolt.where('looseArm'), so = bolt.where('socket');
    window.__trace.push({ t: +st.t.toFixed(2), tool: [v.x, v.y, v.z].map((n) => +n.toFixed(2)), loose: la && [la.x, la.y, la.z].map((n) => +n.toFixed(2)), socket: so && [so.x, so.y, so.z].map((n) => +n.toFixed(2)), busy: rig.busy(), bolt: bolt.states().join(',') }); if (window.__trace.length < 900) requestAnimationFrame(tick); };
  tick(); st.react([{ type: 'worldEffect', target: 'bay.bolt', action: 'arm', challengeId: 'x' }]);
});
await p.waitForFunction(() => window.__trace.length > 60 && window.__trace.slice(-30).every((x) => !x.busy) && document.querySelector('[data-testid=cine]')?.getAttribute('data-active') === '0', null, { timeout: 120000 });
const tr = await p.evaluate(() => window.__trace);
let last = -9;
for (const x of tr) if (x.t - last >= 0.35) { last = x.t; console.log(JSON.stringify(x)); }
await b.close(); srv.kill();
