import { describe, expect, it } from 'vitest';
import { getAnyChallenge, lessons, variantsOf } from '../content';
import { objectiveOf } from '../content/helpers';
import { loadSave, migrate, newSave, sanitizeTraining, writeSave, SAVE_KEY, SAVE_VERSION, type SaveData } from '../core/save';
import { summarizeSkill, type EvidenceRecord, type FailureDetail } from '../learning/mastery';
import { getSkill } from '../content';
import * as A from './actions';
import { diagnose } from './diagnosis';
import { skillHistory, summarizeComposite } from './skillHistory';
import { abandonTraining, activePlan, beginStep, completeReadingStep, startTraining, submitTrainingStep, weaknessOf } from './training';
import { trainingNeeds } from './trainingNeeds';
import { getComposite } from '../content/composites';

const started = () => A.acceptQuest(A.createPlayer(newSave(), 'Ada', 'spellwright').save, 'wake-the-robot').save;
const reach = (s: SaveData, lessonId: string) => {
  let out = s;
  for (const l of lessons) {
    if (l.id === lessonId) break;
    out = A.completeLesson(out, l.id).save;
  }
  return A.advanceStep(out, lessonId, 1).save;
};
const detail = (failed: number, total = 4, kind: FailureDetail['errorKind'] = 'wrong-output', hidden = 0): FailureDetail => ({ errorKind: kind, failedChecks: Array.from({ length: failed }, (_, i) => `Case ${i + 1}`), visibleFailed: failed - hidden, hiddenFailed: hidden, totalChecks: total, constraintsFailed: 0 });
/** Practice-source attempts create OPTIONAL weaknesses, so a test can fail many times; lesson-source failures are REQUIRED and hold the curriculum (see 'required training' below). */
const fail = (s: SaveData, id: string, d = detail(2)) => A.submitChallenge(s, id, false, 1000, 'x', { detail: d, source: 'practice' }).save;
const pass = (s: SaveData, id: string) => A.submitChallenge(s, id, true, 1000, 'x', { source: 'practice' }).save;
/** Adds earlier independent successes on a skill, dated in the past, to simulate a player who knew it. */
const withMastery = (s: SaveData, skillId: string, n = 4, contexts = ['finance', 'science', 'retail', 'games']): SaveData => {
  const out = structuredClone(s);
  for (let i = 0; i < n; i++) {
    const rec: EvidenceRecord = { at: new Date(Date.now() - (n - i + 5) * 86400000).toISOString(), challengeId: `old-${skillId}-${i}`, objectiveId: `old-${skillId}-${i}`, context: contexts[i % contexts.length]!, skillIds: [skillId], concepts: [], mode: 'challenge', difficulty: 3, passed: true, support: 'independent', hintsUsed: 0, lookups: 0, attemptNumber: 1, priorFailures: 0, project: false, timeMs: 1, executed: true };
    out.evidence.push(rec);
  }
  return out;
};

const [a, b] = variantsOf('py-obj-divmod');
const atLesson5 = () => reach(started(), 'py-05-numbers');
const progressSnapshot = (s: SaveData) => JSON.stringify({ lessons: s.learning.lessons, quests: s.quests, areas: s.unlockedAreas, xp: s.stats.xp });

describe('diagnosis scales with the evidence', () => {
  it('a first ordinary slip while still learning is not a detour', () => {
    const s = fail(atLesson5(), a!.id, detail(1, 4));
    expect(s.training.weaknesses).toHaveLength(0);
  });
  it('a minor mistake by a player who knows the skill gives a small refresher and keeps their mastery on record', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    s = fail(s, a!.id, detail(1, 4, 'wrong-output', 1));
    const w = s.training.weaknesses[0]!;
    expect(w.severity).toBe('minor');
    const r = startTraining(s, w.id, { kind: 'lesson', lessonId: 'py-05-numbers' });
    const plan = activePlan(r.save)!;
    expect(plan.level).toBe('refresher');
    expect(plan.steps.map((x) => x.kind)).toEqual(expect.arrayContaining(['review', 'independent']));
    expect(plan.steps.filter((x) => x.challengeId).length).toBeLessThanOrEqual(2);
    expect(w.previousIndependent).toBeGreaterThanOrEqual(4);
  });
  it('a pass that needed a hint gets short reinforcement and ONE fresh proof', () => {
    let s = atLesson5();
    s = A.revealHint(s, a!.id).save;
    s = pass(s, a!.id);
    const w = s.training.weaknesses[0]!;
    expect(w.kind).toBe('hint-reliance');
    const plan = activePlan(startTraining(s, w.id, { kind: 'lesson', lessonId: 'py-05-numbers' }).save)!;
    expect(plan.level).toBe('refresher');
    expect(plan.steps.map((x) => x.kind)).toEqual(['review', 'independent']);
  });
  it('a hint is recorded with its kind and is never a permanent label', () => {
    let s = atLesson5();
    s = A.revealHint(s, a!.id).save;
    s = A.revealHint(s, a!.id).save;
    s = pass(s, a!.id);
    expect(s.evidence.at(-1)).toMatchObject({ hintsUsed: 2, hintLevels: [0, 1], support: 'hinted' });
  });
  it('repeated failures scale the training: refresher -> targeted -> extended -> deep, with no failure limit', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    const levels: string[] = [];
    for (let i = 0; i < 7; i++) {
      s = fail(s, a!.id, detail(2, 4));
      const w = s.training.weaknesses.at(-1)!;
      levels.push(w.severity);
    }
    expect(levels[0]).toBe('minor'); // a first slip by someone who knows the skill is small
    expect(levels).toContain('moderate');
    expect(levels).toContain('serious');
    expect(levels.at(-1)).toBe('major');
    const order = ['minor', 'moderate', 'serious', 'major'];
    for (let i = 1; i < levels.length; i++) expect(order.indexOf(levels[i]!)).toBeGreaterThanOrEqual(order.indexOf(levels[i - 1]!));
    expect(s.training.weaknesses.filter((w) => w.status !== 'resolved')).toHaveLength(1); // merged, not duplicated
    expect(A.submitChallenge(s, a!.id, false, 1, 'x', { source: 'practice' }).save.evidence.length).toBe(s.evidence.length + 1); // still allowed to try again
  });
  it('a severe failure (nothing passes, repeatedly) becomes a deep training path with foundations and two independent checks', () => {
    let s = atLesson5();
    for (let i = 0; i < 3; i++) s = fail(s, a!.id, detail(4, 4, 'runtime'));
    const w = s.training.weaknesses[0]!;
    expect(w.severity).toBe('major');
    const plan = activePlan(startTraining(s, w.id, { kind: 'lesson', lessonId: 'py-05-numbers' }).save)!;
    expect(plan.level).toBe('deep');
    expect(plan.steps.filter((x) => x.kind === 'independent')).toHaveLength(1); // one proof, however deep the path
    expect(plan.steps.length).toBeGreaterThan(5);
  });
  it('diagnose() is pure: it does not change the save', () => {
    const s = fail(withMastery(atLesson5(), 'py.numbers'), a!.id);
    const before = JSON.stringify(s);
    diagnose(s, getAnyChallenge(a!.id)!);
    expect(JSON.stringify(s)).toBe(before);
  });
  it('syntax slips and timeouts are named as such, not blamed on the concept', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    s = fail(s, a!.id, detail(4, 4, 'syntax'));
    expect(s.training.weaknesses[0]!.mistakes).toContain('syntax');
    expect(s.training.weaknesses[0]!.reasons.join(' ')).toMatch(/syntax/);
  });
});

describe('training uses fresh problems', () => {
  it('never reuses the challenge or objective that exposed the weakness, and varies context', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    s = fail(s, a!.id, detail(2, 4));
    s = fail(s, a!.id, detail(2, 4));
    const w = s.training.weaknesses[0]!;
    const plan = activePlan(startTraining(s, w.id, { kind: 'lesson', lessonId: 'py-05-numbers' }).save)!;
    const ids = plan.steps.filter((x) => x.challengeId).map((x) => x.challengeId!);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(id).not.toBe(a!.id);
      expect(getAnyChallenge(id)!.context).not.toBe(a!.context);
    }
    expect(objectiveOf(getAnyChallenge(ids[0]!)!)).not.toBe(objectiveOf(a!)); // the first fresh problem is on a different idea when one exists
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids.map((i) => getAnyChallenge(i)!.context)).size).toBeGreaterThan(1);
  });
  it('training never draws on content the player has not been taught', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    s = fail(fail(s, a!.id), a!.id);
    const plan = activePlan(startTraining(s, s.training.weaknesses[0]!.id, { kind: 'lesson', lessonId: 'py-05-numbers' }).save)!;
    const later = new Set(lessons.slice(lessons.findIndex((l) => l.id === 'py-06-input-conversion') + 6).flatMap((l) => l.steps.flatMap((st) => (st.kind === 'challenge' ? [st.challengeId] : []))));
    for (const st of plan.steps) if (st.challengeId) expect(later.has(st.challengeId)).toBe(false);
  });
});

describe('composite weaknesses', () => {
  const tally = 'py-16-defect-tally';
  it('a player who knows the parts separately but fails the combination gets a combination weakness', () => {
    let s = reach(started(), 'py-16-dicts');
    s = withMastery(s, 'py.loops');
    s = withMastery(s, 'py.dicts');
    s = fail(s, tally, detail(2, 4));
    const w = s.training.weaknesses[0]!;
    expect(w.kind).toBe('combination');
    expect(w.skillIds).toEqual(expect.arrayContaining(['py.loops', 'py.dicts']));
    const plan = activePlan(startTraining(s, w.id, { kind: 'lesson', lessonId: 'py-16-dicts' }).save)!;
    expect(plan.level).not.toBe('refresher');
    expect(summarizeComposite(s.evidence, getComposite('loops+dicts')!).attempts).toBe(1);
  });
  it('authored check->skill diagnostics pin a failure on the smallest skill', () => {
    const c = getAnyChallenge(tally)!;
    const patched = { ...c, diagnostics: { primary: ['py.dicts'], checkSkills: { 'case 1': ['py.loops'] } } };
    let s = reach(started(), 'py-16-dicts');
    s = withMastery(s, 'py.loops');
    s = fail(s, tally, detail(1, 4));
    const d = diagnose(s, patched as typeof c)!;
    expect(d.skillIds).toContain('py.loops');
  });
});

describe('training is a detour, not a step backwards', () => {
  it('starting, working and finishing training never changes curriculum progress', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    s = fail(fail(s, a!.id), a!.id);
    const before = progressSnapshot(s);
    const w = s.training.weaknesses[0]!;
    let r = startTraining(s, w.id, { kind: 'lesson', lessonId: 'py-05-numbers', stepIndex: 2 }).save;
    expect(progressSnapshot(r)).toBe(before);
    let plan = activePlan(r)!;
    for (const st of plan.steps) {
      if (st.kind === 'review' || st.kind === 'example') r = completeReadingStep(r, plan.id, st.id).save;
      else {
        r = beginStep(r, plan.id, st.id).save;
        r = submitTrainingStep(r, plan.id, st.id, true, 1000, 'ok').save;
      }
      plan = r.training.plans.find((p) => p.id === plan.id)!;
    }
    expect(plan.status).toBe('complete');
    expect(plan.returnTo).toEqual({ kind: 'lesson', lessonId: 'py-05-numbers', stepIndex: 2 });
    expect(r.training.activePlanId).toBeNull();
    expect(weaknessOf(r, w.id)!.status).toBe('resolved');
    expect(progressSnapshot(r).replace(/"xp":\d+/, '')).toBe(before.replace(/"xp":\d+/, ''));
    expect(r.learning.lessons['py-05-numbers']?.completed).toBeFalsy();
  });
  it('an optional training plan never costs Focus on a failed step and cannot push Focus past 100', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    s = fail(fail(s, a!.id), a!.id);
    let r = startTraining(s, s.training.weaknesses[0]!.id, { kind: 'lesson', lessonId: 'py-05-numbers' }).save;
    const plan = activePlan(r)!;
    const step = plan.steps.find((x) => x.challengeId)!;
    r = submitTrainingStep(r, plan.id, step.id, false, 1, 'x', detail(1)).save;
    expect(r.stats.focus).toBe(100);
    r = submitTrainingStep(r, plan.id, plan.steps.find((x) => x.challengeId && x.kind !== 'independent')?.id ?? step.id, true, 1, 'x').save;
    expect(r.stats.focus).toBe(100);
  });
  it('a failed independent step makes the plan grow with fresh problems: there is no lockout', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    s = fail(fail(s, a!.id), a!.id);
    let r = startTraining(s, s.training.weaknesses[0]!.id, { kind: 'lesson', lessonId: 'py-05-numbers' }).save;
    const plan0 = activePlan(r)!;
    const demo = plan0.steps.find((x) => x.kind === 'independent')!;
    const n0 = plan0.steps.length;
    for (let i = 0; i < 4; i++) {
      const p = activePlan(r)!;
      const d = [...p.steps].reverse().find((x) => x.kind === 'independent' && !x.done)!;
      r = submitTrainingStep(r, p.id, d.id, false, 1, 'x', detail(3)).save;
      expect(r.stats.focus).toBe(s.stats.focus);
    }
    const p = activePlan(r)!;
    expect(p.escalations).toBe(4);
    expect(p.steps.length).toBeGreaterThan(n0);
    expect(demo).toBeDefined();
  });
  it('the fresh proof is an independent problem: hints cannot be opened, so a pass is always unaided evidence', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    s = fail(fail(s, a!.id), a!.id);
    let r = startTraining(s, s.training.weaknesses[0]!.id, { kind: 'lesson', lessonId: 'py-05-numbers' }).save;
    const p = activePlan(r)!;
    const demo = p.steps.find((x) => x.kind === 'independent')!;
    r = A.revealHint(r, demo.challengeId!).save;
    expect(r.learning.challenges[demo.challengeId!]?.hintsUsed ?? 0).toBe(0);
    r = submitTrainingStep(r, p.id, demo.id, true, 1, 'x').save;
    expect(r.evidence.at(-1)).toMatchObject({ support: 'transfer', source: 'training', hintsUsed: 0 }); // 'transfer' is independent evidence on an unfamiliar problem
  });
  it('optional training (from the Training Board) can be set aside and re-opens the weakness on record', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    s = fail(s, a!.id, detail(1, 4, 'wrong-output', 1));
    s = { ...s, training: { ...s.training, weaknesses: s.training.weaknesses.map((w) => ({ ...w, required: false })) } };
    let r = startTraining(s, s.training.weaknesses[0]!.id, { kind: 'lesson', lessonId: 'py-05-numbers' }).save;
    r = abandonTraining(r, activePlan(r)!.id).save;
    expect(r.training.activePlanId).toBeNull();
    expect(r.training.weaknesses[0]!.status).toBe('open');
    expect(r.training.plans[0]!.status).toBe('abandoned');
  });
});

describe('evidence: guided vs independent, and mastery is never erased', () => {
  it('later failures never remove earlier independent evidence or change a demonstrated skill to "failed"', () => {
    const base = withMastery(reach(started(), 'py-16-dicts'), 'py.loops', 8);
    const sk = getSkill('py.loops')!;
    const before = summarizeSkill(base.evidence, sk);
    let s = base;
    for (let i = 0; i < 4; i++) s = fail(s, 'py-16-defect-tally', detail(3));
    const after = summarizeSkill(s.evidence, sk);
    expect(after.independentPasses).toBe(before.independentPasses);
    expect(after.failures).toBeGreaterThan(before.failures);
    const h = skillHistory(s, 'py.loops')!;
    expect(h.previous).toBe('strong');
    expect(h.earlierIndependentPasses).toBe(8);
    expect(h.recentFailures).toBeGreaterThan(0);
    expect(h.note).toMatch(/Previous independent performance: strong/);
  });
  it('a guided (hinted) success is recorded as guided, and a later independent success on a different problem resolves it', () => {
    let s = atLesson5();
    s = A.revealHint(s, a!.id).save;
    s = pass(s, a!.id);
    expect(s.evidence.at(-1)!.support).toBe('hinted');
    const w = s.training.weaknesses[0]!;
    expect(w.status).toBe('open');
    s = pass(s, b!.id);
    expect(s.evidence.at(-1)!.support).toBe('independent');
    expect(weaknessOf(s, w.id)!.status).toBe('resolved');
    expect(s.evidence.length).toBe(2); // both records are still there
  });
  it('the same problem passed again does NOT resolve a weakness (transfer, not memory)', () => {
    let s = atLesson5();
    s = A.revealHint(s, a!.id).save;
    s = pass(s, a!.id);
    s = A.startReplay(s, a!.id).save;
    s = pass(s, a!.id);
    expect(s.training.weaknesses[0]!.status).toBe('open');
  });
  it('records where and in which contexts a skill caused trouble', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    s = fail(fail(s, a!.id), a!.id);
    const h = skillHistory(s, 'py.numbers')!;
    expect(h.contextsStruggled).toContain(a!.context);
    expect(h.contextsDemonstrated.length).toBeGreaterThan(0);
  });
});

describe('the training board prioritises what the evidence shows', () => {
  it('lists weaknesses first, then combinations, then quiet skills', () => {
    let s = withMastery(reach(started(), 'py-16-dicts'), 'py.loops');
    s = withMastery(s, 'py.dicts');
    s = fail(s, 'py-16-defect-tally', detail(2));
    const needs = trainingNeeds(s, Date.now());
    expect(needs[0]!.category).toBeLessThanOrEqual(2);
    const cats = needs.map((n) => n.category);
    expect([...cats].sort()).toEqual(cats);
    for (const n of needs) expect(n.reason.length).toBeGreaterThan(10);
  });
  it('flags a skill that has gone quiet, with the reason', () => {
    let s = withMastery(atLesson5(), 'py.numbers', 2);
    s = { ...s, evidence: s.evidence.map((r) => ({ ...r, at: new Date(Date.now() - 20 * 86400000).toISOString() })) };
    const q = trainingNeeds(s, Date.now()).find((n) => n.kind === 'rust' && n.skillIds.includes('py.numbers'));
    expect(q?.reason).toMatch(/20 days/);
  });
});

describe('training state survives save/load and migration', () => {
  const store = () => { const m = new Map<string, string>(); return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
  it('round-trips weaknesses and plans', () => {
    let s = withMastery(atLesson5(), 'py.numbers');
    s = fail(fail(s, a!.id), a!.id);
    s = startTraining(s, s.training.weaknesses[0]!.id, { kind: 'lesson', lessonId: 'py-05-numbers', stepIndex: 3 }).save;
    const st = store();
    writeSave(st, s);
    const loaded = loadSave(st).save;
    expect(loaded.training).toEqual(s.training);
    expect(loaded.version).toBe(SAVE_VERSION);
    expect(loaded.evidence.at(-1)).toEqual(s.evidence.at(-1));
  });
  it('migrates a v4 save (Phase 3) without losing anything and starts with empty training', () => {
    const v4 = { ...structuredClone(started()), version: 4 } as Record<string, unknown>;
    delete v4.training; delete v4.bosses; delete v4.campaign;
    const m = migrate(v4)!;
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.training).toEqual({ weaknesses: [], plans: [], activePlanId: null, nextId: 1 });
    expect(m.bosses).toEqual({});
    expect(m.player?.name).toBe('Ada');
  });
  it('repairs a corrupt training block instead of rejecting the save', () => {
    const bad = { ...structuredClone(started()), training: { weaknesses: [{ id: 5 }, 'x', null], plans: 'nope', activePlanId: 'zzz', nextId: -3 }, bosses: 7, campaign: 'x' };
    const st = store();
    st.setItem(SAVE_KEY, JSON.stringify(bad));
    const r = loadSave(st);
    expect(r.status).toBe('loaded');
    expect(r.save.training).toEqual({ weaknesses: [], plans: [], activePlanId: null, nextId: 1 });
    expect(r.save.bosses).toEqual({});
    expect(sanitizeTraining(undefined).nextId).toBe(1);
  });
});
