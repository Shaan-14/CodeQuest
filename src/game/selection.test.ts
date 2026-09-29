import { describe, expect, it } from 'vitest';
import { newSave, type SaveData } from '../core/save';
import { getChallenge, lessons, objectives, variantsOf } from '../content';
import { objectiveOf } from '../content/helpers';
import * as A from './actions';
import { availableObjectives, hasAlternate, objectiveStatus, pickVariant, recommendPractice } from './selection';

const started = () => A.acceptQuest(A.createPlayer(newSave(), 'Ada', 'spellwright').save, 'wake-the-robot').save;
const fail = (s: SaveData, id: string) => A.submitChallenge(s, id, false, 1, 'x').save;
const pass = (s: SaveData, id: string) => A.submitChallenge(s, id, true, 1, 'x').save;
/** Play up to a lesson the way the game requires: every earlier lesson completed, then this one started. */
const reach = (s: SaveData, lessonId: string) => {
  let out = s;
  for (const l of lessons) {
    if (l.id === lessonId) break;
    out = A.completeLesson(out, l.id).save;
  }
  return A.advanceStep(out, lessonId, 1).save;
};

describe('variant selection', () => {
  const obj = 'py-obj-divmod';
  const [a, b] = variantsOf(obj);

  it('has authored variants that keep the objective, mode, and difficulty', () => {
    expect(variantsOf(obj).length).toBeGreaterThanOrEqual(2);
    expect(b!.difficulty).toBe(a!.difficulty);
    expect(b!.mode).toBe(a!.mode);
    expect(objectiveOf(b!)).toBe(obj);
  });
  it('offers a different problem on retry (never the same one when an alternate exists)', () => {
    const s = fail(started(), a!.id);
    expect(pickVariant(s, obj, a!.id)!.id).toBe(b!.id);
    expect(hasAlternate(obj, a!.id)).toBe(true);
  });
  it('prefers an unplayed variant, then rotates deterministically', () => {
    let s = started();
    expect(pickVariant(s, obj)!.id).toBe(a!.id); // nothing played: authoring order
    s = fail(s, a!.id);
    expect(pickVariant(s, obj)!.id).toBe(b!.id); // b is unplayed
    s = pass(s, b!.id);
    expect(pickVariant(s, obj)!.id).toBe(a!.id); // a is not yet passed
  });
  it('once everything is passed, picks the least-attempted variant that is not the current one', () => {
    let s = started();
    s = pass(pass(s, a!.id), b!.id);
    s = pass(s, a!.id); // a now has 2 attempts
    expect(pickVariant(s, obj)!.id).toBe(b!.id);
    expect(pickVariant(s, obj, b!.id)!.id).toBe(a!.id);
  });
  it('is deterministic', () => {
    const s = fail(started(), a!.id);
    expect(pickVariant(s, obj, a!.id)!.id).toBe(pickVariant(s, obj, a!.id)!.id);
  });
  it('falls back to the only variant when there is no alternate', () => {
    const single = objectives.find((o) => variantsOf(o.id).length === 1)!;
    const only = variantsOf(single.id)[0]!;
    expect(pickVariant(started(), single.id, only.id)!.id).toBe(only.id);
    expect(hasAlternate(single.id, only.id)).toBe(false);
  });
  it('returns undefined for an unknown objective', () => {
    expect(pickVariant(started(), 'nope')).toBeUndefined();
  });
});

describe('objective status', () => {
  const obj = 'py-obj-divmod';
  const [a, b] = variantsOf(obj);
  it('tracks tried/passed variants and failures across variants', () => {
    let s = started();
    s = fail(fail(s, a!.id), a!.id);
    s = pass(s, b!.id);
    const st = objectiveStatus(s, obj);
    expect(st).toMatchObject({ variants: variantsOf(obj).length, tried: 2, passedVariants: 1, passed: true, failedAttempts: 2, independentPasses: 1 });
  });
});

describe('retry evidence is preserved', () => {
  const obj = 'py-obj-divmod';
  const [a, b] = variantsOf(obj);
  it('records failures on the objective and how many preceded a pass on another variant', () => {
    let s = started();
    s = fail(s, a!.id);
    s = fail(s, a!.id);
    s = pass(s, b!.id); // solved the DIFFERENT variant
    const last = s.evidence.at(-1)!;
    expect(s.evidence).toHaveLength(3);
    expect(s.evidence.filter((r) => !r.passed)).toHaveLength(2); // failures still in the record
    expect(last).toMatchObject({ passed: true, challengeId: b!.id, objectiveId: obj, priorFailures: 2, support: 'independent' });
    expect(last.context).toBe(b!.context);
  });
  it('failures count only since the last pass on that objective', () => {
    let s = started();
    s = fail(s, a!.id);
    s = pass(s, a!.id);
    s = fail(s, b!.id);
    expect(s.evidence.at(-1)!.priorFailures).toBe(0); // first failure after a pass
    s = pass(s, b!.id);
    expect(s.evidence.at(-1)!.priorFailures).toBe(1);
  });
  it('records hints and support on a retry', () => {
    let s = started();
    s = fail(s, a!.id);
    s = A.revealHint(s, b!.id).save;
    s = pass(s, b!.id);
    expect(s.evidence.at(-1)).toMatchObject({ hintsUsed: 1, support: 'hinted', priorFailures: 1 });
  });
  it('records reference-manual lookups as research evidence', () => {
    let s = started();
    s = A.recordLookup(s, a!.id).save;
    s = A.recordLookup(s, a!.id).save;
    s = pass(s, a!.id);
    expect(s.evidence.at(-1)!.lookups).toBe(2);
  });
  it('passing a retry does not mark anything mastered by itself', () => {
    let s = started();
    s = fail(s, a!.id);
    s = pass(s, b!.id);
    expect(s.evidence.some((r) => r.passed)).toBe(true);
    expect(Object.keys(s.achievements)).not.toContain('mastered');
  });
});

describe('recommendations', () => {
  const [a, b] = variantsOf('py-obj-divmod');
  const atLesson5 = () => reach(started(), 'py-05-numbers');
  it('suggests a DIFFERENT problem on the same objective after failures, with a reason', () => {
    let s = fail(fail(atLesson5(), a!.id), a!.id);
    s = reach(s, 'py-05-numbers');
    const rec = recommendPractice(s).find((r) => r.kind === 'retry' && r.objectiveId === 'py-obj-divmod');
    expect(rec).toBeDefined();
    expect(rec!.challengeId).toBe(b!.id);
    expect(getChallenge(rec!.challengeId!)!.difficulty).toBe(a!.difficulty);
    expect(rec!.reason).toContain('2 failed attempts');
  });
  it('stops suggesting a retry once the objective is passed', () => {
    let s = fail(atLesson5(), a!.id);
    s = pass(s, b!.id);
    expect(recommendPractice(s).some((r) => r.kind === 'retry' && r.objectiveId === 'py-obj-divmod')).toBe(false);
  });
  it('suggests less support after a hinted pass', () => {
    let s = A.revealHint(atLesson5(), a!.id).save;
    s = pass(s, a!.id);
    const rec = recommendPractice(s, 5).find((r) => r.kind === 'less-support' && r.objectiveId === 'py-obj-divmod');
    expect(rec).toBeDefined();
    expect(rec!.reason).toContain('hints');
  });
  it('does not suggest objectives the player has not reached yet (no spoilers)', () => {
    expect(availableObjectives(started())).not.toContain('py-obj-divmod');
    const s = A.advanceStep(started(), 'py-01-first-program', 1).save;
    expect(recommendPractice(s).every((r) => r.kind === 'next-lesson')).toBe(true);
  });
  it('always offers the next lesson when nothing else applies, and never more than requested', () => {
    const recs = recommendPractice(started(), 2);
    expect(recs.length).toBeLessThanOrEqual(2);
    expect(recs[0]!.kind).toBe('next-lesson');
  });
});
