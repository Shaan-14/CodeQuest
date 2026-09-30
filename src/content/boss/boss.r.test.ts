/** Validates the R boss problems with real R (webR in Node): starter fails, reference programs pass, wrong attempts fail. */
import { afterAll, describe, expect, it } from 'vitest';
import { rBossChallenges } from './r';
import { RRunner } from '../../learning/r/RRunner';
import { bossRSolutions } from './solutions.r.testdata';

const runner = new RRunner();
afterAll(async () => { await (runner as unknown as { webR?: { close(): void } }).webR?.close(); });
const grade = (id: string, code: string) => { const c = rBossChallenges.find((x) => x.id === id)!; return runner.grade({ language: 'r', code, checks: c.checks as never, constraints: c.constraints as never, fixtures: c.fixtures, timeoutMs: 120000 }); };

describe('R boss problems', () => {
  it('follow the boss rules and have solutions', () => {
    for (const c of rBossChallenges) {
      expect(c.mode, c.id).toBe('independent');
      expect(c.hints, c.id).toEqual([]);
      expect(c.starterCode, c.id).toBe('');
      expect(c.checks.every((k) => k.visible === false), `${c.id}: every check hidden`).toBe(true);
      expect(bossRSolutions[c.id], c.id).toBeDefined();
      expect(c.prompt, `${c.id} names no R functions`).not.toMatch(/\b(read\.csv|aggregate|tapply|t\.test|prop\.test|quantile|sprintf|which\.max)\b/);
    }
    for (const id of Object.keys(bossRSolutions)) expect(rBossChallenges.some((c) => c.id === id), id).toBe(true);
  });
  for (const c of rBossChallenges) {
    describe(c.id, () => {
      it('the starter does not already pass', async () => { expect((await grade(c.id, c.starterCode)).passed).toBe(false); }, 180000);
      bossRSolutions[c.id]?.valid.forEach((code, i) => it(`valid solution #${i + 1} passes`, async () => { const r = await grade(c.id, code); expect(r.passed, JSON.stringify([r.error, ...r.checks.filter((k) => !k.passed)])).toBe(true); }, 180000));
      bossRSolutions[c.id]?.wrong.forEach((code, i) => it(`wrong attempt #${i + 1} fails`, async () => { expect((await grade(c.id, code)).passed).toBe(false); }, 180000));
    });
  }
});
