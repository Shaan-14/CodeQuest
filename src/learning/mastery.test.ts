import { describe, expect, it } from 'vitest';
import { detectPatterns, summarizeSkill, supportFor, unmetRequirements, type EvidenceRecord } from './mastery';
import type { Skill } from '../content/schema';

const skill: Skill = { id: 's', title: 'S', area: 'python', category: 'c', prerequisites: [], masteryRequirements: { independentPasses: 2, distinctChallenges: 2, minDifficulty: 2 } };
let n = 0;
const rec = (o: Partial<EvidenceRecord> = {}): EvidenceRecord => {
  const challengeId = o.challengeId ?? 'c' + n++;
  return {
    at: 't', challengeId, objectiveId: challengeId, context: 'ctx' + challengeId, skillIds: ['s'], concepts: [], mode: 'challenge', difficulty: 2, passed: true,
    support: 'independent', hintsUsed: 0, lookups: 0, attemptNumber: 1, priorFailures: 0, project: false, timeMs: 1, executed: true, ...o,
  };
};

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

describe('variety requirements (Phase 2)', () => {
  const strict: Skill = { ...skill, masteryRequirements: { independentPasses: 3, distinctChallenges: 3, minDifficulty: 2, distinctObjectives: 2, distinctContexts: 2 } };
  it('does not count variants of ONE objective as varied ability', () => {
    const three = [rec({ objectiveId: 'o1', context: 'a' }), rec({ objectiveId: 'o1', context: 'b' }), rec({ objectiveId: 'o1', context: 'a' })];
    const sum = summarizeSkill(three, strict);
    expect(sum.status).toBe('developing');
    expect(sum.distinctIndependentObjectives).toBe(1);
    expect(unmetRequirements(sum, strict).join(' ')).toContain('different concepts');
  });
  it('does not count one context repeated as varied ability', () => {
    const three = [rec({ objectiveId: 'o1', context: 'a' }), rec({ objectiveId: 'o2', context: 'a' }), rec({ objectiveId: 'o3', context: 'a' })];
    const sum = summarizeSkill(three, strict);
    expect(sum.status).toBe('developing');
    expect(unmetRequirements(sum, strict).join(' ')).toContain('contexts');
  });
  it('demonstrates only with varied objectives AND contexts', () => {
    const three = [rec({ objectiveId: 'o1', context: 'a' }), rec({ objectiveId: 'o2', context: 'b' }), rec({ objectiveId: 'o3', context: 'a' })];
    const sum = summarizeSkill(three, strict);
    expect(sum.status).toBe('demonstrated');
    expect(unmetRequirements(sum, strict)).toEqual([]);
  });
  it('treats missing new fields (old saves) as a single objective/context safely', () => {
    const old = { ...rec(), objectiveId: undefined as unknown as string, context: '' };
    expect(() => summarizeSkill([old], strict)).not.toThrow();
  });
});

describe('retries are preserved as evidence', () => {
  it('counts a pass after failures as recovered, and keeps the failures', () => {
    const fail = rec({ objectiveId: 'o', passed: false });
    const win = rec({ objectiveId: 'o', priorFailures: 1 });
    const sum = summarizeSkill([fail, win], skill);
    expect(sum.failures).toBe(1);
    expect(sum.recoveredPasses).toBe(1);
  });
  it('is not "solving easily" if the passes followed failures', () => {
    const passes = Array.from({ length: 4 }, () => rec({ priorFailures: 1 }));
    expect(detectPatterns(passes, 's').map((p) => p.kind)).not.toContain('solving-easily');
  });
  it('counts project passes', () => {
    expect(summarizeSkill([rec({ project: true })], skill).projectPasses).toBe(1);
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
