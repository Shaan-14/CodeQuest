import { describe, expect, it } from 'vitest';
import { detectPatterns, summarizeSkill, supportFor, type EvidenceRecord } from './mastery';
import type { Skill } from '../content/schema';

const skill: Skill = { id: 's', title: 'S', area: 'python', category: 'c', prerequisites: [], masteryRequirements: { independentPasses: 2, distinctChallenges: 2, minDifficulty: 2 } };
let n = 0;
const rec = (o: Partial<EvidenceRecord> = {}): EvidenceRecord => ({
  at: 't', challengeId: 'c' + n++, skillIds: ['s'], concepts: [], mode: 'challenge', difficulty: 2, passed: true, support: 'independent', hintsUsed: 0, attemptNumber: 1, timeMs: 1, executed: true, ...o,
});

describe('supportFor', () => {
  it('reduces independence when guided or hinted', () => {
    expect(supportFor('learning', 0)).toBe('guided');
    expect(supportFor('challenge', 2)).toBe('hinted');
    expect(supportFor('challenge', 0)).toBe('independent');
    expect(supportFor('independent', 0, true)).toBe('transfer');
  });
});

describe('summarizeSkill', () => {
  it('has no status without evidence', () => expect(summarizeSkill([], skill).status).toBe('none'));
  it('is only "attempted" when nothing passed', () => expect(summarizeSkill([rec({ passed: false })], skill).status).toBe('attempted'));
  it('is "guided" when passes are all assisted, no matter how many', () => {
    const many = Array.from({ length: 20 }, () => rec({ support: 'guided', mode: 'learning' }));
    const s = summarizeSkill(many, skill);
    expect(s.status).toBe('guided');
    expect(s.independentPasses).toBe(0);
  });
  it('needs enough DISTINCT independent challenges', () => {
    const same = { challengeId: 'same' };
    expect(summarizeSkill([rec(same), rec(same), rec(same)], skill).status).toBe('developing');
    expect(summarizeSkill([rec(), rec()], skill).status).toBe('demonstrated');
  });
  it('needs the minimum difficulty', () => {
    expect(summarizeSkill([rec({ difficulty: 1 }), rec({ difficulty: 1 })], skill).status).toBe('developing');
  });
  it('ignores evidence that was not executed', () => {
    expect(summarizeSkill([rec({ executed: false }), rec({ executed: false })], skill).status).toBe('none');
  });
  it('counts hints and failures', () => {
    const s = summarizeSkill([rec({ passed: false, hintsUsed: 1 }), rec({ support: 'hinted', hintsUsed: 2 })], skill);
    expect(s.failures).toBe(1);
    expect(s.hintsUsed).toBe(3);
    expect(s.status).toBe('guided');
  });
});

describe('detectPatterns', () => {
  const kinds = (r: EvidenceRecord[]) => detectPatterns(r, 's').map((p) => p.kind);
  it('detects repeated failure', () => expect(kinds(Array.from({ length: 5 }, () => rec({ passed: false })))).toContain('repeated-failure'));
  it('detects hint reliance', () => expect(kinds(Array.from({ length: 4 }, () => rec({ hintsUsed: 2, support: 'hinted' })))).toContain('hint-reliant'));
  it('detects guided-only success', () => expect(kinds(Array.from({ length: 3 }, () => rec({ support: 'guided', mode: 'learning' })))).toContain('guided-only'));
  it('detects solving easily', () => expect(kinds(Array.from({ length: 4 }, () => rec()))).toContain('solving-easily'));
  it('detects independent success', () => expect(kinds([rec(), rec()])).toContain('independent-success'));
  it('reports nothing for no evidence', () => expect(kinds([])).toEqual([]));
});
