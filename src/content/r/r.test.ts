/** Validates every R challenge with real R (webR in Node): starter fails, reference solutions pass, wrong attempts fail. */
import { afterAll, describe, expect, it } from 'vitest';
import { challenges } from '../index';
import { RRunner } from '../../learning/r/RRunner';
import { solutionsR } from './solutions.testdata';

const r = new RRunner();
afterAll(async () => { await (r as unknown as { webR?: { close(): void } }).webR?.close(); });
const rChallenges = challenges.filter((c) => c.language === 'r');
const grade = (id: string, code: string) => {
  const c = rChallenges.find((x) => x.id === id)!;
  return r.grade({ language: 'r', code, checks: c.checks as never, constraints: c.constraints as never, fixtures: c.fixtures, timeoutMs: 120000 });
};

describe('R curriculum', () => {
  it('has a solution entry for every R challenge and no orphans', () => {
    for (const c of rChallenges) expect(solutionsR[c.id], c.id).toBeDefined();
    for (const id of Object.keys(solutionsR)) expect(rChallenges.some((c) => c.id === id), id).toBe(true);
  });
  for (const c of rChallenges) {
    describe(c.id, () => {
      it('the starter does not already pass', async () => { expect((await grade(c.id, c.starterCode)).passed).toBe(false); }, 180000);
      solutionsR[c.id]?.valid.forEach((code, i) => it(`valid solution #${i + 1} passes`, async () => {
        const res = await grade(c.id, code);
        expect(res.passed, JSON.stringify([res.error, ...res.checks.filter((k) => !k.passed), ...res.constraints.filter((k) => !k.passed)])).toBe(true);
      }, 180000));
      solutionsR[c.id]?.wrong.forEach((code, i) => it(`wrong attempt #${i + 1} fails`, async () => { expect((await grade(c.id, code)).passed).toBe(false); }, 180000));
    });
  }
  it('no hint contains a complete reference solution', () => {
    for (const c of rChallenges) for (const h of c.hints) for (const code of solutionsR[c.id]?.valid ?? []) expect(h.includes(code.trim()), c.id).toBe(false);
  });
});
