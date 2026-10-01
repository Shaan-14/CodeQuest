/** World integrity report: loads every scene in the production build and compares what is drawn with what blocks. Usage: node scripts/integrity3d.mjs (after npm run build) */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4471;
const srv = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
await p.goto(`http://localhost:${PORT}/`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
const scenes = ['plaza', 'robotics-atrium', 'maintenance-bay', 'manufacturing-floor', 'sim-room', 'lantern-courtyard', 'spell-classroom', 'arena', 'ballpark', 'analytics-office', 'garage', 'track', 'summit'];
let total = 0;
for (const s of scenes) {
  await p.evaluate((s) => window.__cq3d.travel(s), s); await p.waitForTimeout(500);
  const issues = await p.evaluate(() => window.__cq3d.integrity());
  total += issues.length;
  console.log(`${s}: ${issues.length}`);
  for (const i of issues) console.log(`   ${i.kind}: ${i.what}`);
}
console.log('total', total);
await b.close(); srv.kill();
