/**
 * Validates the web curriculum in REAL CHROMIUM (the same sandbox page the game uses): for every web challenge the
 * starter must not pass, reference solutions must pass, plausible wrong attempts must fail, hints must not leak a
 * solution, and structural rules hold. Requires a Chromium (CHROMIUM_PATH or /opt/pw-browsers).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startWebHarness, type WebHarness } from '../../learning/web/testHarness';
import { challenges, lessons } from '../index';
import type { WebFiles } from '../schema';
import { blank } from './helpers';
import { webSolutions } from './solutions.testdata';
import { reference } from '../reference';
import { dailyChallenges } from '../daily';
import { webDailySolutions } from '../daily/solutions.web.testdata';
import { S, web as webCheck } from './helpers';

const web = challenges.filter((c) => c.language === 'web');
let harness: WebHarness;
beforeAll(async () => {
  harness = await startWebHarness();
}, 60_000);
afterAll(async () => {
  await harness?.close();
});

const grade = (id: string, files: WebFiles) => harness.grade(files, web.find((c) => c.id === id)!.checks);
const flat = (f: WebFiles) => [f.html, f.css, f.js].map((x) => x.trim()).filter((x) => x.length > 25);

describe('web curriculum structure', () => {
  it('has reference solutions for every web challenge and none for unknown ones', () => {
    for (const c of web) expect(webSolutions[c.id], c.id).toBeDefined();
    for (const id of Object.keys(webSolutions)) expect(web.some((c) => c.id === id), id).toBe(true);
  });
  it('web challenges only use web checks and start from files', () => {
    for (const c of web) {
      expect(c.checks.every((k) => k.kind === 'web'), c.id).toBe(true);
      expect(c.starterFiles, c.id).toBeDefined();
      expect(c.web?.tabs.length, c.id).toBeGreaterThan(0);
    }
  });
  it('every web lesson is in the web track and demos have files', () => {
    for (const l of lessons.filter((x) => x.language === 'web')) {
      expect(l.id.startsWith('web-'), l.id).toBe(true);
      for (const s of l.steps) if (s.kind === 'demo') expect(s.files, `${l.id}: ${s.title}`).toBeDefined();
    }
  });
});

describe('web challenges behave correctly in real Chromium', () => {
  for (const c of web) {
    describe(c.id, () => {
      const sol = webSolutions[c.id];
      it('the starter files do not already pass', async () => {
        expect((await grade(c.id, c.starterFiles ?? blank)).passed).toBe(false);
      });
      sol?.valid.forEach((files, i) => it(`valid solution #${i + 1} passes`, async () => {
        const r = await grade(c.id, files);
        expect(r.passed, JSON.stringify(r.checks.filter((k) => !k.passed), null, 1)).toBe(true);
      }));
      sol?.wrong.forEach((files, i) => it(`wrong attempt #${i + 1} fails`, async () => {
        expect((await grade(c.id, files)).passed).toBe(false);
      }));
      it('hints never contain a complete solution', () => {
        for (const hint of c.hints) for (const v of sol?.valid ?? []) for (const part of flat(v)) expect(hint.includes(part)).toBe(false);
      });
    });
  }
});

describe('Field Manual web entries run in real Chromium', () => {
  for (const e of reference.filter((x) => x.language === 'web')) {
    it(`${e.id}: the example page runs without errors`, async () => {
      const r = await harness.grade(e.run!, [webCheck('runs', S.noErrors)]);
      expect(r.passed, JSON.stringify(r.checks)).toBe(true);
    });
  }
});

describe('web Daily Challenges behave correctly in real Chromium', () => {
  const dailies = dailyChallenges.filter((c) => c.language === 'web');
  it('has solutions for every web daily and none for unknown ones', () => {
    for (const c of dailies) expect(webDailySolutions[c.id], c.id).toBeDefined();
    for (const id of Object.keys(webDailySolutions)) expect(dailies.some((c) => c.id === id), id).toBe(true);
  });
  for (const c of dailies) {
    describe(c.id, () => {
      const sol = webDailySolutions[c.id];
      const run = (f: WebFiles) => harness.grade(f, c.checks);
      it('the starter files do not already pass', async () => {
        expect((await run(c.starterFiles ?? blank)).passed).toBe(false);
      });
      sol?.valid.forEach((f, i) => it(`valid solution #${i + 1} passes`, async () => {
        const r = await run(f);
        expect(r.passed, JSON.stringify(r.checks.filter((k) => !k.passed), null, 1)).toBe(true);
      }));
      sol?.wrong.forEach((f, i) => it(`wrong attempt #${i + 1} fails`, async () => {
        expect((await run(f)).passed).toBe(false);
      }));
    });
  }
});
