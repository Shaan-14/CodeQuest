/** Which props cost the most draw calls in a scene (dev server). Usage: node scripts/calls.mjs <scene> */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4417;
const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 900, height: 600 } });
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
await p.goto(`http://localhost:${PORT}/`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
await p.getByTestId('welcome-start').click();
await p.evaluate((sc) => window.__cq3d.travel(sc), process.argv[2] ?? 'maintenance-bay');
await p.waitForTimeout(1500);
const rows = await p.evaluate(async () => {
  const st = window.__cq3d.stage; const out = {};
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await frame(); out.total = st.stats().calls;
  const world = st.worldGroup; world.visible = false; await frame(); out.noWorld = st.stats().calls; world.visible = true;
  const npcs = st.npcs.map((n) => n.rig.group); npcs.forEach((g) => (g.visible = false)); await frame(); out.noNpcs = st.stats().calls; npcs.forEach((g) => (g.visible = true));
  st.playerRigRef.group.visible = false; await frame(); out.noPlayer = st.stats().calls; st.playerRigRef.group.visible = true;
  out.npcCount = npcs.length;
  return out;
});
console.log(JSON.stringify(rows));
await b.close(); srv.kill();
