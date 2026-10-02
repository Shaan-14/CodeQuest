/**
 * Plays one cue sheet in one place on the dev server and photographs it at intervals.
 * Usage: node scripts/sheetshot.mjs <out-prefix> <scene> <spawn|-> <pristine 0/1> <power|save> <sheet> <every-ms> <count> [timeScale=1] [player 0/1]
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = Number(process.env.PORT ?? 4417);
const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
process.on('exit', () => srv.kill()); process.on('SIGTERM', () => process.exit(1)); // never leave a dev server behind
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 500)); }
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e.stack || e).slice(0, 500))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
// SAVE=<key of e2e/.saves.json>[,done]: start from a prepared save (done = the campaign is complete) instead of a new game
if (process.env.SAVE) {
  const { readFileSync } = await import('node:fs');
  const [key, flag] = process.env.SAVE.split(','); const sv = JSON.parse(readFileSync('e2e/.saves.json', 'utf8'))[key];
  if (flag === 'done') sv.campaign = { completedAt: new Date().toISOString() };
  sv.play.seen.opening = 'x'; sv.play.seen['play-welcome'] = 'x';
  await p.addInitScript((t) => { if (!localStorage.getItem('codequest.save')) localStorage.setItem('codequest.save', t); }, JSON.stringify(sv));
}
await p.goto(`http://localhost:${PORT}/`);
if (!process.env.SAVE) { await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click(); }
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
await p.waitForTimeout(800);
if (await p.getByTestId('welcome-start').count()) await p.getByTestId('welcome-start').evaluate((b) => b.click());
const [out, scene, spawnName, pristine, power, sheet, every, count, ts = '1', player = '1'] = process.argv.slice(2);
await p.evaluate(([scene, spawnName, pristine, power, ts, player]) => { const w = window.__cq3d; w.look(scene, { spawn: spawnName === '-' ? undefined : spawnName, power: power === 'save' ? null : Number(power), pristine: pristine === '1' }); w.stage.timeScale = Number(ts); w.stage.setPlayerVisible(player === '1'); }, [scene, spawnName, pristine, power, ts, player]);
await p.waitForTimeout(600);
await p.evaluate((s) => window.__cq3d.play(s), sheet);
for (let i = 0; i < Number(count); i++) {
  await p.waitForTimeout(Number(every));
  await p.screenshot({ path: `${out}-${String(i).padStart(2, '0')}.png` });
  const info = await p.evaluate(() => { const st = window.__cq3d.stage; return { t: +st.t.toFixed(1), sub: document.querySelector('[data-testid=cine-subtitle]')?.textContent ?? null, active: document.querySelector('[data-testid=cine]')?.getAttribute('data-active') }; });
  console.log(i, JSON.stringify(info));
  if (info.active === '0' && i > 1) break;
}
console.log('errors:', errs.length ? errs.slice(0, 6) : 'none');
await b.close(); srv.kill();
