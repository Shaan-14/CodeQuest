import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAnyChallenge, lessonOfChallenge, lessons, variantsOf } from '../content';
import { moduleFor } from '../content/training/modules';
import { loadSave, migrate, newSave, writeSave, SAVE_VERSION, type SaveData } from '../core/save';
import { summarizeSkill, type EvidenceRecord, type FailureDetail } from '../learning/mastery';
import { getSkill } from '../content';
import * as A from './actions';
import { answerPrediction, beginStep, completeReadingStep, activePlan, planFor, requiredTraining, startTraining, submitTrainingStep, abandonTraining } from './training';

const started = () => A.acceptQuest(A.createPlayer(newSave(), 'Ada', 'spellwright').save, 'wake-the-robot').save;
const reach = (s: SaveData, lessonId: string) => {
  let out = s;
  for (const l of lessons) {
    if (l.id === lessonId) break;
    out = A.completeLesson(out, l.id).save;
  }
  return A.advanceStep(out, lessonId, 1).save;
};
const detail = (failed: number, total = 4): FailureDetail => ({ errorKind: 'wrong-output', failedChecks: Array.from({ length: failed }, (_, i) => `Case ${i + 1}`), visibleFailed: failed, hiddenFailed: 0, totalChecks: total, constraintsFailed: 0 });
const failInLesson = (s: SaveData, id: string, d = detail(4)) => A.submitChallenge(s, id, false, 1000, 'x', { detail: d }).save;
const withMastery = (s: SaveData, skillId: string, n = 4): SaveData => {
  const out = structuredClone(s);
  const contexts = ['finance', 'science', 'retail', 'games'];
  for (let i = 0; i < n; i++) out.evidence.push({ at: new Date(Date.now() - (n - i + 5) * 86400000).toISOString(), challengeId: `old-${skillId}-${i}`, objectiveId: `old-${skillId}-${i}`, context: contexts[i % 4]!, skillIds: [skillId], concepts: [], mode: 'challenge', difficulty: 3, passed: true, support: 'independent', hintsUsed: 0, lookups: 0, attemptNumber: 1, priorFailures: 0, project: false, timeMs: 1, executed: true } as EvidenceRecord);
  return out;
};
/** Plays a whole plan the way a player would: read, predict, practise, then pass the one proof alone. */
const finishPlan = (save: SaveData, planId: string): SaveData => {
  let r = save;
  for (let guard = 0; guard < 40; guard++) {
    const p = r.training.plans.find((x) => x.id === planId)!;
    const st = p.steps.find((x) => !x.done);
    if (!st || p.status !== 'active') break;
    if (st.kind === 'review' || st.kind === 'example') r = completeReadingStep(r, p.id, st.id).save;
    else if (st.kind === 'predict') { const w = r.training.weaknesses.find((x) => x.id === p.weaknessId)!; r = answerPrediction(r, p.id, st.id, moduleFor(w.skillIds)!.predict!.correct).save; }
    else { r = beginStep(r, p.id, st.id).save; r = submitTrainingStep(r, p.id, st.id, true, 1000, 'ok').save; }
  }
  return r;
};
const snapshot = (s: SaveData) => JSON.stringify({ lessons: s.learning.lessons, quests: s.quests, areas: s.unlockedAreas });

const [a, b] = variantsOf('py-obj-divmod');
const atLesson5 = () => reach(started(), 'py-05-numbers');

describe('required training: the normal flow', () => {
  it('a meaningful failure blocks the curriculum, and only the training unlocks it', () => {
    const s0 = atLesson5();
    const s = failInLesson(s0, a!.id);
    const w = requiredTraining(s)!;
    expect(w).toBeDefined();
    expect(w.required).toBe(true);
    const plan = activePlan(s)!;
    expect(plan.required).toBe(true);
    expect(plan.returnTo).toMatchObject({ kind: 'lesson', lessonId: 'py-05-numbers', challengeId: a!.id });

    // no way around it: retry, other variant, next step, finishing, another lesson
    const frozen = snapshot(s);
    expect(A.submitChallenge(s, a!.id, true, 1, 'x').save.evidence.length).toBe(s.evidence.length);
    expect(A.submitChallenge(s, b!.id, true, 1, 'x').save.evidence.length).toBe(s.evidence.length);
    expect(snapshot(A.advanceStep(s, 'py-05-numbers', 3).save)).toBe(frozen);
    expect(snapshot(A.completeLesson(s, 'py-05-numbers').save)).toBe(frozen);
    expect(snapshot(A.completeLesson(s, 'py-06-input-conversion').save)).toBe(frozen);
    expect(abandonTraining(s, plan.id).save.training.activePlanId).toBe(plan.id);

    // the training completes it, and the player is exactly where they were
    const done = finishPlan(s, plan.id);
    expect(requiredTraining(done)).toBeUndefined();
    expect(done.training.plans.find((p) => p.id === plan.id)!.status).toBe('complete');
    expect(snapshot(done)).toBe(frozen);
    expect(A.submitChallenge(done, b!.id, true, 1, 'x').save.learning.challenges[b!.id]?.passed).toBe(true);
  });

  it('a failed fresh proof keeps the curriculum held, adds targeted training and exactly one NEW proof', () => {
    const s = failInLesson(atLesson5(), a!.id);
    let r = s;
    const p0 = activePlan(r)!;
    for (const st of p0.steps.filter((x) => x.kind !== 'independent')) {
      r = st.kind === 'review' || st.kind === 'example' ? completeReadingStep(r, p0.id, st.id).save : r;
    }
    const proof = activePlan(r)!.steps.find((x) => x.kind === 'independent')!;
    r = beginStep(r, p0.id, proof.id).save;
    r = submitTrainingStep(r, p0.id, proof.id, false, 1000, 'x', detail(2)).save;
    const p1 = activePlan(r)!;
    expect(requiredTraining(r)).toBeDefined();
    expect(p1.status).toBe('active');
    const open = p1.steps.filter((x) => x.kind === 'independent' && !x.done);
    expect(open).toHaveLength(1);
    expect(open[0]!.challengeId).not.toBe(proof.challengeId);
    expect(p1.steps.length).toBeGreaterThan(p0.steps.length);
    expect(A.submitChallenge(r, b!.id, true, 1, 'x').save.evidence.length).toBe(r.evidence.length); // still held
  });

  it('survives closing the browser in the middle of required training', () => {
    let r = failInLesson(atLesson5(), a!.id);
    const p = activePlan(r)!;
    r = completeReadingStep(r, p.id, p.steps[0]!.id).save;
    const m = new Map<string, string>();
    const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    writeSave(store, r);
    const loaded = loadSave(store).save;
    expect(requiredTraining(loaded)?.id).toBe(requiredTraining(r)!.id);
    expect(activePlan(loaded)!.steps[0]!.done).toBe(true);
    expect(A.submitChallenge(loaded, a!.id, true, 1, 'x').save.evidence.length).toBe(loaded.evidence.length);
  });
});

describe('training is not the failed lesson', () => {
  it('uses authored reframing, different problems, different contexts and one proof with no help', () => {
    const s = failInLesson(atLesson5(), a!.id);
    const w = requiredTraining(s)!;
    const plan = activePlan(s)!;
    expect(moduleFor(w.skillIds)).toBeDefined(); // authored "see it differently" content exists for this skill
    const failedLesson = lessonOfChallenge(a!.id)!;
    const probs = plan.steps.filter((x) => x.challengeId).map((x) => getAnyChallenge(x.challengeId!)!);
    expect(probs.length).toBeGreaterThan(0);
    for (const c of probs) {
      expect(c.id).not.toBe(a!.id);
      expect(variantsOf('py-obj-divmod').map((v) => v.id)).not.toContain(c.id);
      expect(lessonOfChallenge(c.id)?.id).not.toBe(failedLesson.id);
      expect(c.context).not.toBe(a!.context);
    }
    const proofs = plan.steps.filter((x) => x.kind === 'independent');
    expect(proofs).toHaveLength(1);
    expect(plan.steps.at(-1)!.kind).toBe('independent');
    const proof = getAnyChallenge(proofs[0]!.challengeId!)!;
    expect(proof.mode).toBe('independent');
    expect(proof.hints).toHaveLength(0);
  });
});

describe('a composite failure is diagnosed as the combination and keeps earlier mastery', () => {
  it('names loops + dictionaries, trains that combination, and never lowers the parts', () => {
    let s = reach(started(), 'py-16-dicts');
    s = withMastery(withMastery(s, 'py.loops', 6), 'py.dicts', 6);
    const before = summarizeSkill(s.evidence, getSkill('py.loops')!);
    s = failInLesson(s, 'py-16-defect-tally', detail(2));
    const w = requiredTraining(s)!;
    expect(w.kind).toBe('combination');
    expect(w.skillIds).toEqual(expect.arrayContaining(['py.loops', 'py.dicts']));
    expect(w.reasons.join(' ')).toMatch(/together|combin/i);
    const m = moduleFor(w.skillIds)!;
    expect(m.skills.length).toBeGreaterThanOrEqual(2); // the authored module is about the combination, not one part
    const after = summarizeSkill(s.evidence, getSkill('py.loops')!);
    expect(after.independentPasses).toBe(before.independentPasses);
    const plan = planFor(s, w.id)!;
    expect(plan.steps.filter((x) => x.kind === 'independent')).toHaveLength(1);
  });
});

describe('hints', () => {
  it('a hinted pass in a challenge means short reinforcement then one fresh proof', () => {
    let s = atLesson5();
    s = A.revealHint(s, a!.id).save;
    s = A.submitChallenge(s, a!.id, true, 1000, 'x').save;
    expect(requiredTraining(s)?.kind).toBe('hint-reliance');
    expect(activePlan(s)!.steps.map((x) => x.kind)).toEqual(['review', 'independent']);
  });
  it('a hint used inside a guided learning exercise never blocks anything', () => {
    let s = reach(started(), 'py-01-first-program');
    const first = lessons.find((l) => l.id === 'py-01-first-program')!.steps.find((x) => x.kind === 'challenge')!;
    const id = (first as { challengeId: string }).challengeId;
    s = A.revealHint(s, id).save;
    s = A.submitChallenge(s, id, true, 1000, 'x').save;
    expect(requiredTraining(s)).toBeUndefined();
  });
});

describe('interface simplicity (static checks on the screens)', () => {
  const src = (p: string) => readFileSync(new URL(`../app/${p}`, import.meta.url), 'utf8');
  it('the Mentor card has one action and no retry or fresh-problem path', () => {
    const card = src('components/DiagnosisCard.tsx');
    expect(card.match(/<button/g)).toHaveLength(1);
    expect(card).not.toMatch(/fresh problem|try again|other-variant|train-now/i);
  });
  it('the failed-lesson screen offers no retry while training is required, and the Training Grounds start one plan', () => {
    const step = src('components/ChallengeStep.tsx');
    expect(step).toMatch(/held/);
    expect(step).not.toMatch(/train-now/);
    expect(src('screens/TrainingYard.tsx').match(/<button/g)).toHaveLength(1 + 1); // required: Start/Continue; otherwise: back
    expect(src('screens/TrainingRun.tsx').match(/data-testid="training-start-step"/g)).toHaveLength(1);
  });
});

describe('save migration v5 -> current', () => {
  it('keeps existing weaknesses (as optional), plans and evidence, and stamps the new version', () => {
    let s = startTraining(atLesson5(), (() => { const t = A.submitChallenge(atLesson5(), a!.id, false, 1, 'x', { detail: detail(1), source: 'practice' }).save; return t.training.weaknesses[0]?.id ?? ''; })(), { kind: 'map' }).save;
    const v5 = { ...structuredClone(s), version: 5 } as Record<string, unknown>;
    const m = migrate(v5)!;
    expect(m.version).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(8);
    expect(m.player?.name).toBe('Ada');
    expect(requiredTraining(m)).toBeUndefined(); // nothing an old save had becomes a sudden block
    s = withMastery(s, 'py.numbers');
    expect(migrate({ ...structuredClone(s), version: 5 })!.evidence).toHaveLength(s.evidence.length);
  });
});
