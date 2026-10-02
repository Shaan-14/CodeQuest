/** What does the first real frame after a scene swap still have to create? Logs renderer resource counts around every frame longer than 300 ms during the opening (production build, vite preview). */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
const root = '/opt/pw-browsers'; const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
const PORT = 4467;
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' }); process.on('exit', () => srv.kill());
await new Promise((r) => setTimeout(r, 3000));
const b = await chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome`, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
await p.addInitScript(() => { localStorage.setItem('codequest.e2e', '1'); localStorage.setItem('codequest.opening', 'play'); });
await p.goto(`http://localhost:${PORT}/`); await p.getByTestId('name-input').fill('Ada'); await p.getByTestId('begin').click();
await p.getByTestId('cine-skip').waitFor({ timeout: 60000 });
await p.evaluate(() => {
  const st = window.__cq3d.stage, r = st.renderer, log = (window.__ff = []);
  let prev = null;
  const orig = r.render.bind(r);
  r.render = (...a) => { const gl = r.getContext(); const f0 = performance.now(); gl.finish(); const fin = performance.now() - f0; const t0 = performance.now(), i0 = { p: r.info.programs?.length ?? 0, g: r.info.memory.geometries, t: r.info.memory.textures }; orig(...a); const dt = performance.now() - t0; if (dt > 300 || fin > 300) log.push({ dt: Math.round(dt), finishBefore: Math.round(fin), shadows: r.shadowMap.enabled, rendered: (() => { const f1 = performance.now(); gl.finish(); return Math.round(performance.now() - f1); })(), target: !!r.getRenderTarget(), scene: st.def?.id, progsBefore: i0.p, progsAfter: r.info.programs?.length ?? 0, geoBefore: i0.g, geoAfter: r.info.memory.geometries, texBefore: i0.t, texAfter: r.info.memory.textures, calls: r.info.render.calls }); };
});
const t0 = Date.now(); while (await p.getByTestId('cine-skip').count() && Date.now() - t0 < 400000) await p.waitForTimeout(500);
console.log(JSON.stringify(await p.evaluate(() => window.__ff), null, 1));
await b.close(); srv.kill();
