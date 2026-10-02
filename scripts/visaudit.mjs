/** Walks the player up to things in every scene and reports what is hidden or culled. Usage: node scripts/visaudit.mjs (dev server) */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4431;
const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 900, height: 560 } });
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
await p.goto(`http://localhost:${PORT}/`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
if (await p.getByTestId('welcome-start').count()) await p.getByTestId('welcome-start').click();
const scenes = process.argv.slice(2).length ? process.argv.slice(2) : ['plaza', 'robotics-atrium', 'maintenance-bay', 'manufacturing-floor', 'lantern-courtyard', 'spell-classroom', 'arena', 'ballpark', 'garage', 'track', 'summit'];
for (const s of scenes) {
  await p.evaluate((s) => window.__cq3d.travel(s), s); await p.waitForTimeout(500);
  const spots = await p.evaluate(() => { const st = window.__cq3d.stage; const out = []; for (const c of st.solidColliders) { if (c.kind === 'box') { out.push([c.x, c.z + c.d / 2 + 1.0, 0], [c.x, c.z - c.d / 2 - 1.0, Math.PI], [c.x + c.w / 2 + 1.0, c.z, -Math.PI / 2], [c.x - c.w / 2 - 1.0, c.z, Math.PI / 2]); } else out.push([c.x, c.z + c.r + 1.0, 0], [c.x - c.r - 1.0, c.z, Math.PI / 2]); } return out.slice(0, 60); });
  const agg = new Map();
  for (const [x, z, ry] of spots) {
    await p.evaluate(([x, z, ry]) => { window.__cq3d.teleport(x, z, ry); }, [x, z, ry]); await p.waitForTimeout(120);
    const v = await p.evaluate(() => window.__cq3d.visibility());
    for (const k of ['hidden', 'culled']) for (const n of v[k]) { const key = `${k}: ${n}`; agg.set(key, (agg.get(key) ?? 0) + 1); }
  }
  console.log(`${s}: ${spots.length} spots`); for (const [k, n] of [...agg].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`   ${n}x ${k}`);
}
await b.close(); srv.kill();
