/**
 * Plays the opening from a new game on a production build (vite preview) and reports where the main thread stalls:
 * every scene load (ms), frames whose non-draw work exceeded 16 ms, the worst frames, and the draw cost spikes.
 * Software WebGL makes the draw itself slow, so `upd` (everything but the draw) and the load times are the meaningful numbers.
 * Usage: node scripts/openperf.mjs [label]   (needs `npm run build` first; TS=<time scale> default 1)
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4466;
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' }); process.on('exit', () => srv.kill()); process.on('SIGTERM', () => process.exit(1));
await new Promise((r) => setTimeout(r, 3000));
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
await p.addInitScript(() => { localStorage.setItem('codequest.e2e', '1'); localStorage.setItem('codequest.opening', 'play'); window.__long = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] }); } catch { /* */ } });
await p.goto(`http://localhost:${PORT}/`); await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.getByTestId('cine-skip').waitFor({ timeout: 60000 });
await p.evaluate((k) => { window.__cq3d.stage.timeScale = Number(k); window.__cq3d.perf().frames.length = 0; }, process.env.TS ?? '1');
const t0 = Date.now(); while (await p.getByTestId('cine-skip').count() && Date.now() - t0 < 600000) await p.waitForTimeout(500);
const r = await p.evaluate(() => { const pf = window.__cq3d.perf(); return { loads: pf.loads, frames: pf.frames, long: window.__long }; });
const f = r.frames; const upd = f.map((x) => x.upd).sort((a, c) => a - c), ren = f.map((x) => x.ren).sort((a, c) => a - c);
const q = (a, k) => a.length ? +a[Math.min(a.length - 1, Math.floor(a.length * k))].toFixed(1) : 0;
const out = { label: process.argv[2] ?? 'run', frames: f.length, updMed: q(upd, 0.5), updP95: q(upd, 0.95), updMax: q(upd, 1), updOver16: f.filter((x) => x.upd > 16).length, updOver50: f.filter((x) => x.upd > 50).length, renMed: q(ren, 0.5), renMax: q(ren, 1), loads: r.loads.map((l) => `${l.scene}${l.prepared ? '*' : ''}:${Math.round(l.ms)}ms`), longTasks: r.long.length, spikes: f.filter((x) => x.upd > 16 || x.ren > 400).map((x) => `at ${Math.round(x.at)} upd ${x.upd.toFixed(0)} ren ${x.ren.toFixed(0)} prep ${x.prep.toFixed(0)}`).slice(0, 40), loadAt: r.loads.map((l) => `${l.scene}@${Math.round(l.at)}`), worstFrames: [...f].sort((a, c) => (c.upd + c.ren) - (a.upd + a.ren)).slice(0, 6).map((x) => `upd ${x.upd.toFixed(0)} ren ${x.ren.toFixed(0)}`) };
console.log(JSON.stringify(out, null, 1)); writeFileSync(`/tmp/claude-0/openperf-${out.label}.json`, JSON.stringify(out));
await b.close(); srv.kill();
