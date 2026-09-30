/**
 * End-to-end tests of the PLAYABLE 3D WORLD (real Chromium, software WebGL, the production build). Run: node e2e/play.mjs   (after npm run build)
 * Movement uses real key presses; long walks use the e2e-only teleport hook (enabled by localStorage 'codequest.e2e').
 * Usage: E2E_ONLY='substr|substr' node e2e/play.mjs
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { solutions as solutionsPhase1 } from '../src/content/python/solutions.testdata.ts';
import { solutionsPhase2Python } from '../src/content/python/solutions.phase2.testdata.ts';
import { solutionsPhase3Python } from '../src/content/python/solutions.phase3.testdata.ts';
import { solutionsPhase4Python } from '../src/content/python/solutions.phase4.testdata.ts';
import { trainingSolutions } from '../src/content/training/solutions.testdata.ts';

const solutions = { ...solutionsPhase1, ...solutionsPhase2Python, ...solutionsPhase3Python, ...solutionsPhase4Python, ...trainingSolutions };
const PORT = 4181;
const BASE = `http://localhost:${PORT}/`;
const SHOTS = new URL('./screenshots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });
const assert = (c, m) => { if (!c) throw new Error('assertion failed: ' + m); };
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const dir = existsSync(root) ? readdirSync(root).find((d) => d.startsWith('chromium-')) : undefined;
  return dir ? `${root}/${dir}/chrome-linux/chrome` : undefined;
}
let passed = 0; const failures = [];
async function test(name, fn) {
  if (process.env.E2E_ONLY && !process.env.E2E_ONLY.split('|').some((k) => name.includes(k))) return;
  const t = Date.now();
  try { await fn(); passed++; console.log(`  ✓ ${name} (${Date.now() - t}ms)`); } catch (e) { failures.push(name); console.log(`  ✗ ${name}\n      ${String(e.message).split('\n').slice(0, 5).join('\n      ')}`); }
}
let browser;
const tid = (p, id) => p.getByTestId(id);

/** A new player in the 3D world. */
async function newGame(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && page.errors.push(m.text()));
  await page.addInitScript(() => localStorage.setItem('codequest.e2e', '1'));
  if (opts.save) await page.addInitScript((s) => { if (!localStorage.getItem('codequest.save')) localStorage.setItem('codequest.save', s); }, opts.save);
  await page.goto(BASE);
  if (!opts.save) { await tid(page, 'name-input').fill(opts.name ?? 'Ada'); await tid(page, 'begin').click(); }
  await page.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 30000 });
  return page;
}
const st = (p) => p.evaluate(() => window.__cq3d.state());
const save = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('codequest.save')));
const tp = (p, x, z, ry = 0) => p.evaluate(([x, z, ry]) => window.__cq3d.teleport(x, z, ry), [x, z, ry]);
const go = (p, scene, spawn) => p.evaluate(([s, sp]) => window.__cq3d.travel(s, sp), [scene, spawn]);
/** Press E in the world and wait for the prompt target to be the one we expect. */
async function interact(p, target) {
  await p.locator(`[data-testid=play-prompt][data-target="${target}"]`).waitFor({ timeout: 8000 });
  await p.keyboard.press('e');
}
async function talkThrough(p, { accept = false } = {}) {
  await tid(p, 'play-dialogue').waitFor();
  for (let i = 0; i < 12; i++) {
    if (await tid(p, 'dialogue-accept').count()) { await tid(p, accept ? 'dialogue-accept' : 'dialogue-decline').click(); break; }
    if (await tid(p, 'dialogue-close').count()) { await tid(p, 'dialogue-close').click(); break; }
    await tid(p, 'dialogue-next').click();
  }
  await tid(p, 'play-dialogue').waitFor({ state: 'detached' });
}
async function stepKind(p, n) { const b = p.locator(`.lesson-body[data-step="${n}"]`); await b.waitFor(); return b.getAttribute('data-kind'); }
/** Play the open lesson from its first step to "Complete lesson", solving challenges with the reference solutions. */
async function playLesson(p) {
  for (let step = 0; step < 30; step++) {
    const kind = await stepKind(p, step);
    if (kind === 'challenge') {
      const cid = await tid(p, 'briefing').getAttribute('data-challenge');
      await p.locator('.cm-content').first().click(); await p.keyboard.press('Control+A'); await p.keyboard.insertText(solutions[cid].valid[0]);
      await tid(p, 'submit').click();
      await tid(p, 'result').waitFor({ timeout: 30000 });
      assert(await p.locator('.result.pass').count() === 1, `challenge ${cid} should pass`);
    } else if (kind === 'demo') {
      await tid(p, 'run').click();
      await p.locator('[data-testid=stdout], [data-testid=stderr]').first().waitFor({ timeout: 30000 });
    }
    if (await tid(p, 'finish').count()) { await tid(p, 'finish').click(); return; }
    await tid(p, 'continue').click();
  }
  throw new Error('lesson did not finish');
}

async function main() {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    console.log('3D world: robotics vertical slice');

    await test('A new player lands in the 3D world and can walk with WASD and the arrow keys (collision stops them at the wall)', async () => {
      const p = await newGame();
      eq((await st(p)).scene, 'maintenance-bay', 'first scene');
      const a = await st(p);
      await p.keyboard.down('w'); await p.waitForTimeout(700); await p.keyboard.up('w');
      const b = await st(p);
      assert(b.z < a.z - 0.4, `W moves forward (north): ${a.z} -> ${b.z}`);
      await p.keyboard.down('ArrowRight'); await p.waitForTimeout(500); await p.keyboard.up('ArrowRight');
      assert((await st(p)).x > b.x + 0.3, 'the right arrow moves right');
      // run into the north wall: position is clamped inside the room
      await tp(p, 0, -6); await p.keyboard.down('w'); await p.keyboard.down('Shift'); await p.waitForTimeout(2500); await p.keyboard.up('Shift'); await p.keyboard.up('w');
      assert((await st(p)).z >= -9 + 0.3, 'cannot leave the room');
      await p.screenshot({ path: SHOTS + 'play-01-bay.png' });
      await p.context().close();
    });

    await test('Quest flow: talk to Juno, accept, inspect Bolt, use the console, write real Python, and the robot visibly repairs', async () => {
      const p = await newGame();
      // Juno has work for the player: a diamond marks her
      assert((await st(p)).markers.includes('talk-juno'), 'Juno is marked');
      await tp(p, 3, 3.2, 0);
      await interact(p, 'talk-juno');
      await talkThrough(p, { accept: true });
      let s = await save(p);
      eq(s.quests['q-bay-briefing']?.status, 'active', 'quest accepted and saved');
      assert((await tid(p, 'tracker-q-bay-briefing').innerText()).includes('Inspect Bolt-7'), 'the tracker names the next steps');
      // the quest is not complete just because the player walked: code has not run yet
      await tp(p, -4, 0.2, 0);
      await interact(p, 'bolt-table');
      await tid(p, 'play-dialogue').waitFor();
      assert((await tid(p, 'dialogue-line').innerText()).includes('scorched'), 'inspecting describes the damaged robot');
      await talkThrough(p);
      assert((await save(p)).play.seen['bolt-table'], 'inspection recorded');
      eq(JSON.stringify(await p.evaluate(() => window.__cq3d.dynStates('bolt'))), '[]', 'Bolt is still dead');
      // the console: a real lesson with a real editor and real Python
      await tp(p, 1.5, -5.4, 0);
      await interact(p, 'bolt-console');
      await tid(p, 'play-terminal').waitFor();
      await p.screenshot({ path: SHOTS + 'play-02-terminal.png' });
      await tid(p, 'terminal-next').click();
      await tid(p, 'lesson').waitFor();
      await playLesson(p);
      await tid(p, 'terminal-close').click();
      await tid(p, 'play-terminal').waitFor({ state: 'detached' });
      // the world reacts
      await p.waitForFunction(() => window.__cq3d.dynStates('bolt').includes('eyes'), null, { timeout: 8000 });
      assert((await tid(p, 'play-caption').innerText()).toLowerCase().includes('display'), 'the caption says what changed');
      await p.screenshot({ path: SHOTS + 'play-03-bolt-eyes.png' });
      s = await save(p);
      eq(s.quests['q-bay-briefing']?.status, 'complete', 'quest completes through code');
      assert(s.stats.xp > 0, 'reward paid');
      // persistence: reload; Bolt's eyes are still on, instantly
      await p.reload();
      await p.locator('[data-testid=play][data-ready="1"]').waitFor({ timeout: 30000 });
      assert((await p.evaluate(() => window.__cq3d.dynStates('bolt'))).includes('eyes'), 'the repair persists across a reload');
      await p.context().close();
    });
  } finally { await browser.close(); server.kill(); }
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log('FAILED: ' + failures.join('; ')); process.exit(1); }
}
main().catch((e) => { console.error(e); process.exit(1); });
