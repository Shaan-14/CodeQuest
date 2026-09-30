/** Validates every Git challenge by REPLAYING transcripts in the Git simulator: starter fails, reference transcripts pass, wrong attempts fail. */
import { describe, expect, it } from 'vitest';
import { challenges, lessons } from '../index';
import { gradeGit } from '../../learning/git/grade';
import { replay } from '../../learning/git/replay';
import { gitSolutions } from './solutions.testdata';

const gitChallenges = challenges.filter((c) => c.language === 'git');
const grade = (id: string, code: string) => { const c = gitChallenges.find((x) => x.id === id)!; return gradeGit(code, c.git!.start, c.checks as never, c.constraints); };

describe('Git curriculum', () => {
  it('has a solution entry for every Git challenge and no orphans', () => {
    expect(gitChallenges.length).toBeGreaterThanOrEqual(20);
    for (const c of gitChallenges) { expect(gitSolutions[c.id], c.id).toBeDefined(); expect(c.git, c.id).toBeDefined(); expect(c.starterCode, c.id).toBe(''); }
    for (const id of Object.keys(gitSolutions)) expect(gitChallenges.some((c) => c.id === id), id).toBe(true);
  });
  for (const c of gitChallenges) {
    describe(c.id, () => {
      it('the starting state does not already pass', () => { expect(grade(c.id, '').passed).toBe(false); });
      gitSolutions[c.id]?.valid.forEach((code, i) => it(`valid transcript #${i + 1} passes`, () => { const r = grade(c.id, code); expect(r.passed, JSON.stringify(r.checks.filter((k) => !k.passed))).toBe(true); }));
      gitSolutions[c.id]?.wrong.forEach((code, i) => it(`wrong attempt #${i + 1} fails`, () => { expect(grade(c.id, code).passed).toBe(false); }));
    });
  }
  it('every Git demo runs without unknown commands', () => {
    for (const l of lessons) for (const s of l.steps) if (s.kind === 'demo' && s.language === 'git') {
      const { steps } = replay(s.git ?? {}, s.code);
      for (const st of steps) expect(st.err, `${l.id}: ${st.line}`).not.toMatch(/not a git command|command not found|not a git repository/);
    }
  });
});
