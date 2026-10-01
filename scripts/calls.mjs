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
const rows = await p.evaluate(() => {
  const st = window.__cq3d.stage; const out = [];
  const count = (o) => { let n = 0; o.traverse((c) => { if (c.isMesh && c.visible) n++; }); return n; };
  st.worldGroup.children.forEach((c, i) => out.push([i, count(c), c.position.x.toFixed(1), c.position.z.toFixed(1)]));
  let chars = 0; st.scene.children.forEach((c) => { if (c !== st.worldGroup && c.type === 'Group') chars += count(c); });
  return { world: out.sort((a, c) => c[1] - a[1]).slice(0, 14), chars, total: st.stats().calls };
});
console.log(JSON.stringify(rows));
await b.close(); srv.kill();
