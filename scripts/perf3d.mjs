/**
 * 3D performance report on the PRODUCTION build (vite preview): for every scene, the time to load it, draw calls, triangles, GPU objects, and
 * the JavaScript cost of one frame (update + render submission, measured around renderer.render; the GPU's own time is not measurable in
 * software WebGL). Also the JS heap after a tour of every scene (leak check) and the startup bundle size.
 * Usage: node scripts/perf3d.mjs [out.json]
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync, writeFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4414;
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* */ } });
await p.goto(`http://localhost:${PORT}/`);
await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
if (await p.getByTestId('welcome-start').count()) await p.getByTestId('welcome-start').click();
const scenes = ['plaza', 'robotics-atrium', 'maintenance-bay', 'manufacturing-floor', 'sim-room', 'lantern-courtyard', 'spell-classroom', 'arena', 'ballpark', 'analytics-office', 'garage', 'track', 'summit'];
const rows = [];
for (const sc of scenes) {
  const r = await p.evaluate(async (id) => {
    const stage = window.__cq3d.stage; const t0 = performance.now(); window.__cq3d.travel(id); const load = performance.now() - t0;
    await new Promise((res) => setTimeout(res, 800));
    // JS cost of frames: wrap render
    let n = 0, total = 0; const orig = stage.renderer.render.bind(stage.renderer);
    stage.renderer.render = (...a) => { const s = performance.now(); orig(...a); total += performance.now() - s; n++; };
    await new Promise((res) => setTimeout(res, 2500));
    stage.renderer.render = orig;
    const st = stage.stats();
    return { id, loadMs: +load.toFixed(1), calls: st.calls, triangles: st.triangles, geometries: st.geometries, textures: st.textures, renderSubmitMs: n ? +(total / n).toFixed(2) : null, frames: n, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null };
  }, sc);
  rows.push(r); console.log(JSON.stringify(r));
}
// leak check: tour again and compare the heap and GPU object counts
const before = await p.evaluate(() => ({ g: window.__cq3d.stage.stats().geometries, t: window.__cq3d.stage.stats().textures }));
for (const sc of [...scenes, ...scenes]) await p.evaluate((id) => window.__cq3d.travel(id), sc);
await p.evaluate(() => window.__cq3d.travel('plaza'));
await p.waitForTimeout(600);
const after = await p.evaluate(() => ({ g: window.__cq3d.stage.stats().geometries, t: window.__cq3d.stage.stats().textures, heap: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null }));
console.log('after 26 scene changes: geometries', before.g, '->', after.g, ' textures', before.t, '->', after.t, ' heapMB', after.heap);
// bundle: startup JS (gzip) and the 3D chunk
const assets = readdirSync('dist/assets').filter((f) => f.endsWith('.js'));
const sizes = assets.map((f) => ({ f, kb: +(gzipSync(readFileSync(`dist/assets/${f}`)).length / 1024).toFixed(0) })).sort((a, c) => c.kb - a.kb);
console.log('largest chunks (gzip KB):', sizes.slice(0, 6).map((s) => `${s.f.replace(/-[\w-]{8}\.js$/, '')}:${s.kb}`).join('  '));
void statSync;
writeFileSync(process.argv[2] ?? '/tmp/claude-0/perf3d.json', JSON.stringify({ rows, before, after, sizes: sizes.slice(0, 8) }, null, 2));
await b.close(); srv.kill();
