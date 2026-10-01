/**
 * The 3D world on the Vite DEV server (unbundled ES modules), in real Chromium. The production bundle orders modules differently from the dev
 * server, and "Cannot access 'col' before initialization" (a circular import) only appeared there, so e2e/play.mjs (built app) missed it.
 * Starts the world, visits every scene and fails on any page error or the "cannot start" screen.
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const PORT = 4410;
const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
const dir = process.env.CHROMIUM_PATH ? null : (existsSync(root) ? readdirSync(root).find((d) => d.startsWith('chromium-')) : undefined);
const exe = process.env.CHROMIUM_PATH || `${root}/${dir}/chrome-linux/chrome`;
const srv = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
let code = 0;
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 500)); }
  const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e).slice(0, 500)));
  await page.addInitScript(() => { try { localStorage.setItem('codequest.e2e', '1'); } catch { /* sandboxed iframe */ } });
  await page.goto(`http://localhost:${PORT}/`);
  await page.getByTestId('name-input').fill('Ada'); await page.getByTestId('begin').click();
  await page.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 60000 });
  if (await page.getByTestId('welcome-start').count()) await page.getByTestId('welcome-start').click();
  const scenes = ['plaza', 'robotics-atrium', 'maintenance-bay', 'manufacturing-floor', 'sim-room', 'lantern-courtyard', 'spell-classroom', 'arena', 'ballpark', 'analytics-office', 'garage', 'track', 'summit'];
  for (const s of scenes) {
    await page.evaluate((id) => window.__cq3d.travel(id), s);
    await page.waitForFunction((id) => window.__cq3d.state().scene === id, s, { timeout: 20000 });
    await page.waitForTimeout(300);
  }
  if (await page.getByTestId('play-unavailable').count()) errors.push('the "3D world cannot start" screen is showing');
  if (errors.length) { console.log('✗ 3D world on the dev server:\n  ' + errors.join('\n  ')); code = 1; } else console.log(`✓ 3D world on the dev server: started and visited ${scenes.length} scenes with no errors`);
  await browser.close();
} catch (e) { console.log('✗ ' + (e.stack || e)); code = 1; } finally { srv.kill(); }
process.exit(code);
