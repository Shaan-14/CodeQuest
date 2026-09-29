import { describe, expect, it } from 'vitest';
import { newSave } from '../core/save';
import { backfillEvidence } from './backfill';

const oldRecord = (challengeId: string) => ({
  at: 't', challengeId, objectiveId: challengeId, context: '', skillIds: ['py.numbers'], concepts: [], mode: 'challenge' as const, difficulty: 2, passed: true,
  support: 'independent' as const, hintsUsed: 0, lookups: 0, attemptNumber: 1, priorFailures: 0, project: false, timeMs: 1, executed: true,
});

describe('backfillEvidence', () => {
  it('fills real-world context and objective from current content', () => {
    const s = newSave();
    s.evidence = [oldRecord('py-05-crates')];
    const r = backfillEvidence(s);
    expect(r.evidence[0]).toMatchObject({ context: 'manufacturing', objectiveId: 'py-obj-divmod' });
  });
  it('is idempotent and returns the same object when nothing changes', () => {
    const s = newSave();
    s.evidence = [oldRecord('py-05-crates')];
    const once = backfillEvidence(s);
    expect(backfillEvidence(once)).toBe(once);
  });
  it('never drops records, including ones whose challenge no longer exists', () => {
    const s = newSave();
    s.evidence = [oldRecord('removed-challenge'), oldRecord('py-05-crates')];
    expect(backfillEvidence(s).evidence).toHaveLength(2);
  });
});
