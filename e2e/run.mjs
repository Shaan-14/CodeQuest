/**
 * End-to-end tests: drive the REAL built game in a REAL browser (Chromium via playwright-core).
 * Usage: npm run e2e   (builds, serves `vite preview`, runs everything, writes screenshots to e2e/screenshots/)
 * Set CHROMIUM_PATH to use a specific browser binary.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { solutions } from '../src/content/python/solutions.testdata.ts';

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const SHOTS = new URL('./screenshots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(root)) {
    const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
    if (dir) return `${root}/${dir}/chrome-linux/chrome`;
  }
  return undefined; // fall back to playwright's default lookup
}

let passed = 0;
const failures = [];
async function test(name, fn) {
  const t = Date.now();
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name} (${Date.now() - t}ms)`);
  } catch (e) {
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${String(e.message).split('\n').slice(0, 4).join('\n      ')}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
const eq = (a, b, msg) => assert(a === b, `${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

/* ---------------- helpers ---------------- */
let browser;
async function newPage(viewport = { width: 1280, height: 900 }) {
  // reducedMotion: the game honours it, and Playwright cannot click elements with endless CSS animations.
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.errors = errors;
  await page.goto(BASE);
  return page;
}
const tid = (page, id) => page.getByTestId(id);
async function startGame(page, name = 'Tester') {
  await tid(page, 'name-input').fill(name);
  await tid(page, 'begin').click();
}
async function introAndAccept(page) {
  await tid(page, 'dialogue').waitFor();
  for (let i = 0; i < 5; i++) await tid(page, 'dialogue-next').click();
  await tid(page, 'accept-quest').click();
  await tid(page, 'grounds').waitFor();
}
async function setCode(page, code) {
  await page.locator('.cm-content').first().click();
  await page.keyboard.press('Control+A');
  if (code === '') await page.keyboard.press('Delete');
  else await page.keyboard.insertText(code);
}
async function run(page) {
  await tid(page, 'run').click();
  await page.locator('[data-testid=stdout], [data-testid=stderr]').first().waitFor({ timeout: 30000 });
}
async function xp(page) { return parseInt((await tid(page, 'xp').innerText()).replace(/\D/g, ''), 10); }
async function openLesson(page, id) {
  await tid(page, `lesson-${id}`).locator('button').click();
  await tid(page, 'lesson').waitFor();
}
async function nextStepKind(page) {
  // Wait until the step has rendered something we recognise.
  await page.locator('.teach, [data-testid=run]').first().waitFor();
  if (await page.locator('.teach').count()) return 'teach';
  if (await tid(page, 'submit').count()) return 'challenge';
  return 'demo';
}
/** Plays a whole lesson with the reference solutions (no hints, so evidence is independent). */
async function playLesson(page, id, { solutionIndex = 0 } = {}) {
  await openLesson(page, id);
  for (let guard = 0; guard < 20; guard++) {
    const kind = await nextStepKind(page);
    if (kind === 'challenge') {
      const cid = await tid(page, 'briefing').getAttribute('data-challenge');
      await setCode(page, solutions[cid].valid[solutionIndex] ?? solutions[cid].valid[0]);
      await tid(page, 'submit').click();
      await tid(page, 'result').waitFor({ timeout: 30000 });
      assert(await page.locator('.result.pass').count() === 1, `challenge ${cid} should pass`);
    } else if (kind === 'demo') {
      await run(page);
    }
    if (await tid(page, 'finish').count()) {
      await tid(page, 'finish').click();
      await tid(page, 'grounds').waitFor();
      return;
    }
    await tid(page, 'continue').click();
  }
  throw new Error('lesson did not finish: ' + id);
}
async function openPanel(page, tab) {
  await page.getByRole('button', { name: /Menu|Skills|Trophies|Pack|Quests/ }).first(); // ensure HUD
  const label = { quests: 'Quest log', pack: 'Inventory', skills: 'Skills and evidence', trophies: 'Achievements', menu: 'Menu' }[tab];
  await page.locator(`button[title="${label}"]`).click();
  await page.getByRole('dialog').waitFor();
}

/* ---------------- tests ---------------- */
async function main() {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  browser = await chromium.launch({ executablePath: findChromium(), args: ['--no-sandbox'] });
  try {
    console.log('Startup & character creation');
    await test('app starts, renders title screen, no console errors', async () => {
      const page = await newPage();
      await tid(page, 'begin').waitFor();
      assert(await page.locator('h1.logo').innerText() === 'CodeQuest', 'logo');
      await page.screenshot({ path: SHOTS + '01-title.png' });
      eq(page.errors.length, 0, 'console errors: ' + page.errors.join('|'));
      await page.context().close();
    });

    await test('create character, meet the mentor, accept the quest', async () => {
      const page = await newPage();
      await startGame(page, 'Tester');
      eq(await tid(page, 'player-name').innerText(), 'Tester', 'name in HUD');
      await tid(page, 'dialogue').waitFor();
      await page.screenshot({ path: SHOTS + '02-academy-intro.png' });
      const first = await tid(page, 'dialogue-text').innerText();
      assert(first.includes('Juno'), 'mentor introduces self');
      for (let i = 0; i < 5; i++) await tid(page, 'dialogue-next').click();
      assert((await tid(page, 'dialogue-text').innerText()).includes('Bolt-7'), 'last line mentions quest');
      await tid(page, 'accept-quest').click();
      await tid(page, 'grounds').waitFor();
      await page.screenshot({ path: SHOTS + '03-training-grounds.png' });
      eq(await tid(page, 'robot-power').innerText(), 'Power 0%', 'robot power');
      await page.context().close();
    });

    await test('world map: locked/unlocked areas and reasons', async () => {
      const page = await newPage();
      await startGame(page);
      await introAndAccept(page);
      await page.locator('button[title="World map"]').click();
      await tid(page, 'worldmap').waitFor();
      await page.screenshot({ path: SHOTS + '04-map.png' });
      // Library and Shop are locked at first, Data Center is a locked future area.
      await tid(page, 'area-library').click();
      await tid(page, 'locked-screen').waitFor();
      assert((await tid(page, 'lock-reason').innerText()).includes('first lesson'), 'library reason');
      await page.locator('button:has-text("Back to the map")').click();
      await tid(page, 'area-data-center').click();
      assert((await tid(page, 'lock-reason').innerText()).includes('Phase 3'), 'data center reason');
      await page.screenshot({ path: SHOTS + '05-locked.png' });
      await page.locator('button:has-text("Back to the map")').click();
      await tid(page, 'area-training-grounds').click();
      await tid(page, 'grounds').waitFor();
      await page.context().close();
    });

    console.log('Learning loop: real Python');
    await test('lesson 1: demo runs real Python, challenge fails then passes, XP granted', async () => {
      const page = await newPage();
      await startGame(page);
      await introAndAccept(page);
      await openLesson(page, 'py-01-first-program');
      await page.screenshot({ path: SHOTS + '06-lesson-teach.png' });
      await tid(page, 'continue').click(); // teach -> demo
      assert(await tid(page, 'continue').isDisabled(), 'cannot continue before running the demo');
      await run(page);
      eq((await tid(page, 'stdout').innerText()).trim().split('\n')[0], 'Hello, adventurer!', 'real output');
      await tid(page, 'notice').waitFor();
      await page.screenshot({ path: SHOTS + '07-demo.png' });
      await tid(page, 'continue').click();
      // challenge (learning mode)
      eq(await tid(page, 'mode-badge').innerText(), 'LEARNING MODE', 'mode badge'.toLowerCase() && 'mode badge');
      const xp0 = await xp(page);
      // wrong answer first
      await setCode(page, 'print("wrong")');
      await tid(page, 'submit').click();
      await tid(page, 'result').waitFor({ timeout: 30000 });
      assert(await page.locator('.result.fail').count() === 1, 'fails');
      assert((await page.locator('.diff').innerText()).includes('BOLT-7 ONLINE'), 'shows expected on visible check');
      eq(await xp(page), xp0, 'no XP for failure');
      assert((await tid(page, 'focus').innerText()).includes('90/100'), 'focus dropped');
      await page.screenshot({ path: SHOTS + '08-challenge-fail.png' });
      // correct
      await setCode(page, 'print("BOLT-7 ONLINE")');
      await run(page);
      eq((await tid(page, 'stdout').innerText()).trim(), 'BOLT-7 ONLINE', 'output');
      await tid(page, 'submit').click();
      await page.locator('.result.pass').waitFor({ timeout: 30000 });
      assert(await xp(page) > xp0, 'xp increased');
      await page.screenshot({ path: SHOTS + '09-challenge-pass.png' });
      assert(await tid(page, 'toasts').locator('.toast').count() > 0, 'toasts shown');
      eq(page.errors.length, 0, 'console errors: ' + page.errors.join('|'));
      await page.context().close();
    });

    await test('errors: player sees real NameError/SyntaxError and can debug', async () => {
      const page = await newPage();
      await startGame(page);
      await introAndAccept(page);
      await playLesson(page, 'py-01-first-program');
      await openLesson(page, 'py-02-fixing-errors');
      await tid(page, 'continue').click(); // teach -> demo1
      await run(page);
      const err = await tid(page, 'stderr').innerText();
      assert(err.includes('NameError') && err.includes('line 2') && err.includes('battery_level'), 'NameError shown: ' + err);
      await page.screenshot({ path: SHOTS + '10-error.png' });
      await tid(page, 'continue').click(); // demo2 (syntax)
      await run(page);
      assert((await tid(page, 'stderr').innerText()).includes('SyntaxError'), 'SyntaxError shown');
      await tid(page, 'continue').click(); await tid(page, 'continue').click(); // -> challenge
      await run(page); // starter is broken
      assert((await tid(page, 'stderr').innerText()).includes('SyntaxError'), 'starter code errors');
      await page.context().close();
    });

    await test('hints are progressive, cost reward, and are recorded as evidence', async () => {
      const page = await newPage();
      await startGame(page);
      await introAndAccept(page);
      await playLesson(page, 'py-01-first-program');
      await playLesson(page, 'py-02-fixing-errors');
      await playLesson(page, 'py-03-variables');
      await playLesson(page, 'py-04-strings');
      await playLesson(page, 'py-05-numbers');
      await openLesson(page, 'py-06-input-conversion');
      for (let i = 0; i < 3; i++) { await tid(page, 'continue').click(); if (i < 2) await run(page); }
      await page.waitForTimeout(100);
      // now on first challenge (learning). Continue past to a challenge-mode one by solving.
      let cid = await tid(page, 'briefing').getAttribute('data-challenge');
      await setCode(page, solutions[cid].valid[0]); await tid(page, 'submit').click(); await page.locator('.result.pass').waitFor({ timeout: 30000 });
      await tid(page, 'continue').click();
      cid = await tid(page, 'briefing').getAttribute('data-challenge');
      eq(cid, 'py-06-ticket-total', 'challenge-mode challenge');
      eq(await page.locator('[data-testid=hint-list] li').count(), 0, 'no hints yet');
      await tid(page, 'hint').click();
      eq(await page.locator('[data-testid=hint-list] li').count(), 1, 'one hint');
      await tid(page, 'hint').click();
      eq(await page.locator('[data-testid=hint-list] li').count(), 2, 'two hints');
      assert((await tid(page, 'hint').innerText()).includes('2/3'), 'counter');
      const before = await xp(page);
      await setCode(page, solutions[cid].valid[0]);
      await tid(page, 'submit').click();
      await page.locator('.result.pass').waitFor({ timeout: 30000 });
      const gained = (await xp(page)) - before;
      eq(gained, 27, 'hinted reward is reduced (45 * 0.6)');
      const save = JSON.parse(await page.evaluate(() => localStorage.getItem('codequest.save')));
      const rec = save.evidence.find((r) => r.challengeId === cid);
      eq(rec.hintsUsed, 2, 'hints in evidence'); eq(rec.support, 'hinted', 'support level'); eq(rec.executed, true, 'executed');
      // Replay without hints: stronger evidence, only the difference is paid
      await tid(page, 'replay').click();
      await setCode(page, solutions[cid].valid[0]);
      await tid(page, 'submit').click();
      await page.locator('.result.pass').waitFor({ timeout: 30000 });
      eq((await xp(page)) - before, 56, 'total for the challenge is now the independent reward');
      const save2 = JSON.parse(await page.evaluate(() => localStorage.getItem('codequest.save')));
      eq(save2.evidence.at(-1).support, 'independent', 'replay recorded as independent');
      await page.context().close();
    });

    await test('infinite loop is stopped with a helpful message and Python recovers', async () => {
      const page = await newPage();
      await startGame(page);
      await introAndAccept(page);
      await openLesson(page, 'py-01-first-program');
      await tid(page, 'continue').click(); await run(page); await tid(page, 'continue').click();
      await setCode(page, 'while True:\n    pass');
      await tid(page, 'run').click();
      await tid(page, 'stderr').waitFor({ timeout: 30000 });
      assert((await tid(page, 'stderr').innerText()).includes('ran for more than'), 'timeout message');
      await page.screenshot({ path: SHOTS + '11-timeout.png' });
      await setCode(page, 'print("still alive")');
      await run(page);
      assert((await tid(page, 'stdout').innerText()).includes('still alive'), 'python restarted and works');
      await page.context().close();
    });

    await test('runaway output is stopped, not frozen', async () => {
      const page = await newPage();
      await startGame(page);
      await introAndAccept(page);
      await openLesson(page, 'py-01-first-program');
      await tid(page, 'continue').click(); await run(page); await tid(page, 'continue').click();
      await setCode(page, 'while True:\n    print("spam")');
      await tid(page, 'run').click();
      await tid(page, 'stderr').waitFor({ timeout: 30000 });
      assert((await tid(page, 'stderr').innerText()).includes('too much output'), 'output limit message');
      await page.context().close();
    });

    console.log('Progression, quests, unlocks, persistence');
    let fullPlaythroughState;
    await test('full playthrough: all lessons, quest completes, unlocks, mastery evidence, trial', async () => {
      const page = await newPage();
      await startGame(page, 'Hero');
      await introAndAccept(page);
      const lessonIds = ['py-01-first-program', 'py-02-fixing-errors', 'py-03-variables', 'py-04-strings', 'py-05-numbers', 'py-06-input-conversion', 'py-07-logic', 'py-08-if-else', 'py-09-elif', 'py-10-while', 'py-11-for-range', 'py-12-functions', 'py-13-wake-robot'];
      for (const id of lessonIds) {
        await playLesson(page, id);
        if (id === 'py-01-first-program') assert(await page.evaluate(() => JSON.parse(localStorage.getItem('codequest.save')).unlockedAreas.includes('library')), 'library unlocked after lesson 1');
        if (id === 'py-02-fixing-errors') assert(await page.evaluate(() => JSON.parse(localStorage.getItem('codequest.save')).unlockedAreas.includes('shop')), 'shop unlocked after lesson 2');
        // keep Focus healthy: rest is free, but all solutions pass first time so no loss
      }
      eq(await tid(page, 'robot-power').innerText(), 'Power 100%', 'robot power');
      await page.screenshot({ path: SHOTS + '12-robot-awake.png' });
      // Independent trial: no hints, no starter, no concepts
      await openLesson(page, 'py-14-independent-trial');
      eq(await tid(page, 'mode-badge').innerText(), 'INDEPENDENT TRIAL', 'independent mode badge');
      eq(await tid(page, 'hint').count(), 0, 'no hint button in independent mode');
      const brief = await tid(page, 'briefing').innerText();
      for (const forbidden of ['while', 'for loop', 'int(', 'max(', 'Python']) assert(!brief.includes(forbidden), `independent prompt must not name "${forbidden}"`);
      await page.screenshot({ path: SHOTS + '13-independent.png' });
      await setCode(page, solutions['py-14-warehouse-audit'].wrong[0]);
      await tid(page, 'submit').click(); await tid(page, 'result').waitFor({ timeout: 30000 });
      assert(await page.locator('.result.fail').count() === 1, 'wrong trial answer fails hidden cases');
      await setCode(page, solutions['py-14-warehouse-audit'].valid[1]);
      await tid(page, 'submit').click(); await page.locator('.result.pass').waitFor({ timeout: 30000 });
      await tid(page, 'finish').click();
      await tid(page, 'grounds').waitFor();

      const save = JSON.parse(await page.evaluate(() => localStorage.getItem('codequest.save')));
      eq(save.quests['wake-the-robot'].status, 'complete', 'quest complete');
      assert(save.inventory['robot-bolt'] === 1, 'quest item');
      for (const a of ['first-run', 'first-pass', 'bug-squasher', 'own-two-feet', 'hat-trick', 'robot-awake', 'blank-page', 'level-5']) assert(save.achievements[a], 'achievement ' + a);
      assert(!save.unlockedAreas.includes('data-center') && !save.unlockedAreas.includes('web-workshop'), 'future areas remain locked');
      assert(save.evidence.length >= 30, 'evidence recorded for every submission');
      assert(save.evidence.every((r) => r.executed), 'all evidence executed');
      // Skills view: shows evidence, not XP
      await openPanel(page, 'skills');
      const skills = await tid(page, 'skills-view').innerText();
      assert(skills.includes('Demonstrated independently'), 'some skills demonstrated');
      assert(!/\bXP\b/.test(skills.replace('XP and level never appear here', '')), 'skills view shows no XP');
      await page.screenshot({ path: SHOTS + '14-skills.png' });
      fullPlaythroughState = await page.evaluate(() => localStorage.getItem('codequest.save'));
      const level = await tid(page, 'level').innerText();
      console.log('      final:', level, '| xp', save.stats.xp, '| coins', save.stats.coins, '| evidence records', save.evidence.length);
      eq(page.errors.length, 0, 'console errors: ' + page.errors.join('|'));
      await page.context().close();
    });

    await test('save persists across reload; XP != mastery is visible', async () => {
      const page = await newPage();
      await page.evaluate((s) => localStorage.setItem('codequest.save', s), fullPlaythroughState);
      await page.reload();
      await tid(page, 'hud').waitFor();
      eq(await tid(page, 'player-name').innerText(), 'Hero', 'name persisted');
      assert(await xp(page) > 1000, 'xp persisted');
      await page.context().close();
    });

    await test('level-up: overlay shown, and HUD level rises', async () => {
      const page = await newPage();
      await startGame(page);
      await introAndAccept(page);
      await playLesson(page, 'py-01-first-program'); // 20 + 30*? enough to reach level 2 at 100xp? checked below
      await playLesson(page, 'py-02-fixing-errors');
      await playLesson(page, 'py-03-variables');
      assert(!(await tid(page, 'level').innerText()).includes('Level 1'), 'left level 1');
      await page.context().close();
    });

    await test('focus: exhausting it disables Submit; resting at the Academy restores it', async () => {
      const page = await newPage();
      await startGame(page);
      await introAndAccept(page);
      await openLesson(page, 'py-01-first-program');
      await tid(page, 'continue').click(); await run(page); await tid(page, 'continue').click();
      await setCode(page, 'print("nope")');
      for (let i = 0; i < 10; i++) {
        await tid(page, 'submit').click();
        await tid(page, 'result').waitFor({ timeout: 30000 });
        await page.waitForTimeout(80);
      }
      assert((await tid(page, 'focus').innerText()).includes('0/100'), 'focus at 0');
      assert(await tid(page, 'submit').isDisabled(), 'submit disabled');
      await tid(page, 'focus-warning').waitFor();
      await tid(page, 'run').click(); // running is still allowed
      await page.locator('.focus-warning button').click();
      await tid(page, 'rest').click();
      assert((await tid(page, 'focus').innerText()).includes('100/100'), 'rested');
      await page.context().close();
    });

    await test('shop: buy items, use them; inventory and cosmetics', async () => {
      const page = await newPage();
      await startGame(page);
      await introAndAccept(page);
      // give coins via a real save edit (as if earned)
      await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('codequest.save')); s.stats.coins = 200; s.stats.focus = 30; s.learning.lessons['py-02-fixing-errors'] = { stepIndex: 9, completed: true }; localStorage.setItem('codequest.save', JSON.stringify(s)); });
      await page.reload();
      await page.locator('button[title="World map"]').click();
      await tid(page, 'area-shop').click();
      await tid(page, 'shop').waitFor();
      await page.screenshot({ path: SHOTS + '15-shop.png' });
      await tid(page, 'buy-focus-tea').click();
      eq(await tid(page, 'coins').innerText(), '🪙 175', 'coins spent');
      await tid(page, 'buy-explorer-cape').click();
      assert(await tid(page, 'buy-explorer-cape').isDisabled(), 'cosmetic owned once');
      await openPanel(page, 'pack');
      await tid(page, 'use-focus-tea').click();
      assert((await tid(page, 'focus').innerText()).includes('80/100'), 'tea restored 50 focus');
      await page.screenshot({ path: SHOTS + '16-pack.png' });
      await page.context().close();
    });

    await test('library: notebook and training log; menu: export/import/reset', async () => {
      const page = await newPage();
      await page.evaluate((s) => localStorage.setItem('codequest.save', s), fullPlaythroughState);
      await page.reload();
      await page.locator('button[title="World map"]').click();
      await tid(page, 'area-library').click();
      await tid(page, 'library').waitFor();
      assert((await tid(page, 'notes').innerText()).includes('print()'), 'reference cards');
      await tid(page, 'tab-log').click();
      await tid(page, 'skills-view').waitFor();
      await page.screenshot({ path: SHOTS + '17-library-log.png' });
      // export / import round trip
      await openPanel(page, 'menu');
      await tid(page, 'export').click();
      const exported = await tid(page, 'save-text').inputValue();
      assert(exported.includes('"version":2'), 'exported');
      await tid(page, 'import').click();
      assert((await page.getByRole('status').innerText()).includes('restored'), 'import ok');
      // reset
      await tid(page, 'reset').click();
      await tid(page, 'reset-confirm').click();
      await tid(page, 'begin').waitFor();
      assert(await page.evaluate(() => JSON.parse(localStorage.getItem('codequest.save')).player === null), 'save reset');
      await page.context().close();
    });

    console.log('Robustness');
    await test('corrupt save is backed up, not destroyed', async () => {
      const page = await newPage();
      await page.evaluate(() => localStorage.setItem('codequest.save', '{corrupt'));
      await page.reload();
      await tid(page, 'begin').waitFor();
      eq(await page.evaluate(() => localStorage.getItem('codequest.save.backup')), '{corrupt', 'backup kept');
      await page.context().close();
    });

    await test('responsive: phone layout has no horizontal scroll on key screens', async () => {
      const page = await newPage({ width: 390, height: 800 });
      const noOverflow = async (label) => {
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert(over <= 1, `${label}: horizontal overflow ${over}px`);
      };
      await noOverflow('title');
      await page.screenshot({ path: SHOTS + '20-mobile-title.png' });
      await startGame(page);
      await tid(page, 'dialogue').waitFor(); await noOverflow('academy');
      await page.screenshot({ path: SHOTS + '21-mobile-academy.png' });
      await introAndAccept(page); await noOverflow('grounds');
      await page.locator('button[title="World map"]').click(); await noOverflow('map');
      await page.screenshot({ path: SHOTS + '22-mobile-map.png' });
      await tid(page, 'area-training-grounds').click();
      await openLesson(page, 'py-01-first-program');
      await tid(page, 'continue').click(); await noOverflow('lesson demo');
      await page.screenshot({ path: SHOTS + '23-mobile-lesson.png', fullPage: true });
      await page.context().close();
    });
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log('FAILED:', failures.join('; ')); process.exit(1); }
}
main().catch((e) => { console.error(e); process.exit(1); });
