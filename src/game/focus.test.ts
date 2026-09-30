import { describe, expect, it } from 'vitest';
import { getAnyChallenge, lessons, variantsOf } from '../content';
import { objectiveOf } from '../content/helpers';
import { getBoss } from '../content/bosses';
import { moduleFor } from '../content/training/modules';
import { loadSave, MAX_FOCUS, newSave, sanitizeTraining, writeSave, type SaveData } from '../core/save';
import * as A from './actions';
import { bossStatus, currentBossChallenge, submitBoss } from './boss';
import { canSubmitDaily, submitDaily } from './daily';
import { FAILURE_LEVELS, HINTED_PASS_LOSS, assignStepFocus, failureLevelOf, gainFocus, loseFocus, STEP_WEIGHT } from './focus';
import { pickVariant } from './selection';
import { activePlan, answerPrediction, beginStep, completeReadingStep, requiredTraining, submitTrainingStep } from './training';

const started = () => A.acceptQuest(A.createPlayer(newSave(), 'Ada', 'spellwright').save, 'wake-the-robot').save;
const reach = (s: SaveData, lessonId: string) => {
  let out = s;
  for (const l of lessons) {
    if (l.id === lessonId) break;
    out = A.completeLesson(out, l.id).save;
  }
  return A.advanceStep(out, lessonId, 1).save;
};
const failIn = (s: SaveData, id: string) => A.submitChallenge(s, id, false, 1000, 'x').save;
const lastStep = (p: { steps: { id: string }[] }) => p.steps.at(-1)!;

/** One step of a required plan, the way a player would do it. */
function doStep(r: SaveData, planId: string, stepId: string): SaveData {
  const p = r.training.plans.find((x) => x.id === planId)!;
  const st = p.steps.find((x) => x.id === stepId)!;
  if (st.kind === 'review' || st.kind === 'example') return completeReadingStep(r, planId, stepId).save;
  if (st.kind === 'predict') { const w = r.training.weaknesses.find((x) => x.id === p.weaknessId)!; return answerPrediction(r, planId, stepId, moduleFor(w.skillIds)!.predict!.correct).save; }
  return submitTrainingStep(beginStep(r, planId, stepId).save, planId, stepId, true, 1000, 'ok').save;
}

const [a, b] = variantsOf('py-obj-divmod');
const atLesson5 = () => reach(started(), 'py-05-numbers');

describe('the Focus gate', () => {
  it('a wrong answer on a real challenge costs Focus and the challenge cannot be attempted again', () => {
    const s0 = atLesson5();
    expect(s0.stats.focus).toBe(MAX_FOCUS);
    const s = failIn(s0, a!.id);
    expect(s.stats.focus).toBe(MAX_FOCUS - FAILURE_LEVELS[1].loss);
    expect(s.stats.focus).toBeLessThan(MAX_FOCUS);
    // no retry of the same problem, no other variant, no hint, no pass
    for (const id of [a!.id, b!.id]) {
      expect(A.submitChallenge(s, id, true, 1, 'x').save.evidence.length).toBe(s.evidence.length);
      expect(A.submitChallenge(s, id, false, 1, 'x').save.stats.focus).toBe(s.stats.focus);
      expect(A.revealHint(s, id).save.learning.challenges[id]?.hintsUsed ?? 0).toBe(0);
    }
  });
  it('even one point short is not ready: 99 and 50 both refuse the attempt, whatever else is true', () => {
    const base = atLesson5();
    for (const f of [99, 50, 0]) {
      const s = { ...base, stats: { ...base.stats, focus: f } };
      expect(A.submitChallenge(s, a!.id, true, 1, 'x').save.evidence).toHaveLength(0);
      expect(A.submitChallenge(s, a!.id, true, 1, 'x', { source: 'practice' }).save.evidence).toHaveLength(0);
    }
  });
  it('there is no Rest and no item that restores Focus', () => {
    expect((A as Record<string, unknown>).rest).toBeUndefined();
    expect((A as Record<string, unknown>).useItem).toBeUndefined();
  });
  it('reloading does not restore Focus or remove the requirement', () => {
    const s = failIn(atLesson5(), a!.id);
    const m = new Map<string, string>();
    const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    writeSave(store, s);
    const loaded = loadSave(store).save;
    expect(loaded.stats.focus).toBe(s.stats.focus);
    expect(requiredTraining(loaded)).toBeDefined();
    expect(A.submitChallenge(loaded, a!.id, true, 1, 'x').save.evidence.length).toBe(loaded.evidence.length);
  });
  it('a save that somehow has low Focus but nothing to train is repaired, never left stuck', () => {
    const m = new Map<string, string>();
    const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    const s = started();
    s.stats.focus = 40;
    writeSave(store, s);
    expect(loadSave(store).save.stats.focus).toBe(MAX_FOCUS);
    expect(sanitizeTraining(undefined).plans).toEqual([]);
  });
  it('guided (learning-mode) exercises give feedback only: no Focus loss and they can be retried', () => {
    let s = reach(started(), 'py-05-numbers');
    const id = 'py-05-power-draw';
    expect(getAnyChallenge(id)!.mode).toBe('learning');
    s = failIn(s, id);
    expect(s.stats.focus).toBe(MAX_FOCUS);
    expect(requiredTraining(s)).toBeUndefined();
    expect(A.submitChallenge(s, id, false, 1, 'x').save.evidence.length).toBe(s.evidence.length + 1);
  });
  it('Focus stops at 100 and never goes below 0', () => {
    const s = started();
    s.stats.focus = 90;
    expect(gainFocus(s, [], 25)).toBe(10);
    expect(s.stats.focus).toBe(100);
    expect(loseFocus(s, [], 500)).toBe(100);
    expect(s.stats.focus).toBe(0);
  });
  it('the other gates agree: lessons cannot advance or finish, and the daily cannot be attempted', () => {
    const s = failIn(atLesson5(), a!.id);
    const frozen = JSON.stringify(s.learning.lessons);
    expect(JSON.stringify(A.advanceStep(s, 'py-05-numbers', 4).save.learning.lessons)).toBe(frozen);
    expect(JSON.stringify(A.completeLesson(s, 'py-05-numbers').save.learning.lessons)).toBe(frozen);
    const d = { ...s, daily: { ...s.daily, current: { challengeId: 'x', status: 'open' } } } as SaveData;
    expect(submitDaily(d, Date.now(), true, 1).save).toEqual(d);
    expect(typeof canSubmitDaily).toBe('function');
  });
});

describe('failure levels', () => {
  it('map the kind of work to a level, and the configurable losses grow with it', () => {
    expect(failureLevelOf(getAnyChallenge(a!.id)!)).toBe(1);
    expect(failureLevelOf(getAnyChallenge('py-06-temperature')!)).toBe(2);
    expect(failureLevelOf(getAnyChallenge('py-14-warehouse-audit')!)).toBe(3);
    expect(failureLevelOf(getAnyChallenge(a!.id)!, 'mini')).toBe(4);
    expect(failureLevelOf(getAnyChallenge(a!.id)!, 'mastery')).toBe(5);
    const losses = ([1, 2, 3, 4, 5] as const).map((l) => FAILURE_LEVELS[l].loss);
    expect([...losses].sort((x, y) => x - y)).toEqual(losses);
    expect(losses[0]).toBe(50);
    expect(losses[4]).toBe(MAX_FOCUS);
  });
});

describe('training earns the Focus back', () => {
  it('a small failure: a short plan whose steps add up to exactly what was lost, then a NEW variant at the same place', () => {
    const failed = failIn(atLesson5(), a!.id);
    const plan = activePlan(failed)!;
    expect(plan.required).toBe(true);
    expect(plan.focusLost).toBe(FAILURE_LEVELS[1].loss);
    expect(plan.steps.length).toBeLessThanOrEqual(4);
    expect(plan.steps.reduce((n, x) => n + (x.focus ?? 0), 0)).toBe(FAILURE_LEVELS[1].loss);
    let r = failed;
    let prev = r.stats.focus;
    for (const st of plan.steps) {
      expect(requiredTraining(r)).toBeDefined(); // still training until the last step
      r = doStep(r, plan.id, st.id);
      expect(r.stats.focus).toBeGreaterThanOrEqual(prev);
      prev = r.stats.focus;
    }
    expect(r.stats.focus).toBe(MAX_FOCUS);
    expect(requiredTraining(r)).toBeUndefined();
    expect(r.training.plans.find((p) => p.id === plan.id)!.returnTo).toMatchObject({ kind: 'lesson', lessonId: 'py-05-numbers', challengeId: a!.id });
    // ready again, and the retry is a different problem on the same idea
    const next = pickVariant(r, objectiveOf(a!), a!.id)!;
    expect(next.id).not.toBe(a!.id);
    expect(A.submitChallenge(r, next.id, true, 1, 'x').save.learning.challenges[next.id]?.passed).toBe(true);
  });
  it('the proof is what finishes it: without the last step Focus stays below 100', () => {
    const failed = failIn(atLesson5(), a!.id);
    const plan = activePlan(failed)!;
    let r = failed;
    for (const st of plan.steps.slice(0, -1)) r = doStep(r, plan.id, st.id);
    expect(r.stats.focus).toBeLessThan(MAX_FOCUS);
    expect(A.submitChallenge(r, b!.id, true, 1, 'x').save.evidence.length).toBe(r.evidence.length);
    expect(lastStep(plan).id).toBe(plan.steps.at(-1)!.id);
    expect(plan.steps.at(-1)!.kind).toBe('independent');
  });
  it('a failed proof earns nothing, grows the plan, and Focus is still owed', () => {
    const failed = failIn(atLesson5(), a!.id);
    let plan = activePlan(failed)!;
    let r = failed;
    for (const st of plan.steps.slice(0, -1)) r = doStep(r, plan.id, st.id);
    const before = r.stats.focus;
    const proof = plan.steps.at(-1)!;
    r = submitTrainingStep(beginStep(r, plan.id, proof.id).save, plan.id, proof.id, false, 1, 'x').save;
    expect(r.stats.focus).toBe(before);
    plan = activePlan(r)!;
    const open = plan.steps.filter((x) => !x.done);
    expect(open.length).toBeGreaterThan(1);
    expect(open.reduce((n, x) => n + (x.focus ?? 0), 0)).toBe(MAX_FOCUS - before);
  });
  it('a pass that needed hints costs a little and needs a short refresher plus one proof', () => {
    let s = atLesson5();
    s = A.revealHint(s, a!.id).save;
    s = A.submitChallenge(s, a!.id, true, 1000, 'x').save;
    expect(s.stats.focus).toBe(MAX_FOCUS - HINTED_PASS_LOSS);
    const plan = activePlan(s)!;
    expect(plan.steps.map((x) => x.kind)).toEqual(['review', 'independent']);
    expect(plan.steps.reduce((n, x) => n + (x.focus ?? 0), 0)).toBe(HINTED_PASS_LOSS);
  });
  it('rewards are shared by weight and always add up (no more work than the Focus needs)', () => {
    const s = started();
    s.stats.focus = 60;
    const plan = { id: 'p', required: true, steps: (['review', 'example', 'practice', 'independent'] as const).map((k, i) => ({ id: `s${i}`, kind: k, skillId: 'x', done: false, attempts: 0 })) } as unknown as Parameters<typeof assignStepFocus>[1];
    assignStepFocus(s, plan);
    expect(plan.steps.reduce((n, x) => n + (x.focus ?? 0), 0)).toBe(40);
    expect(plan.steps[3]!.focus!).toBeGreaterThan(plan.steps[0]!.focus!);
    expect(STEP_WEIGHT.independent).toBeGreaterThan(STEP_WEIGHT.review);
  });
});

describe('a major failure needs much more', () => {
  const atTrial = () => reach(started(), 'py-14-independent-trial');
  it('failing an independent challenge costs all Focus and gives a deeper plan with smaller rewards', () => {
    const small = activePlan(failIn(atLesson5(), a!.id))!;
    const s = failIn(atTrial(), 'py-14-warehouse-audit');
    expect(s.stats.focus).toBe(MAX_FOCUS - FAILURE_LEVELS[3].loss);
    const big = activePlan(s)!;
    expect(big.focusLevel).toBe(3);
    expect(big.steps.length).toBeGreaterThan(small.steps.length);
    expect(big.steps.length).toBeGreaterThanOrEqual(8);
    expect(Math.max(...big.steps.slice(0, -1).map((x) => x.focus ?? 0))).toBeLessThanOrEqual(15); // many small increments, not one big one
    // do everything but the proof: still not ready
    let r = s;
    for (const st of big.steps.slice(0, -1)) r = doStep(r, big.id, st.id);
    expect(r.stats.focus).toBeLessThan(MAX_FOCUS);
    r = doStep(r, big.id, big.steps.at(-1)!.id);
    expect(r.stats.focus).toBe(MAX_FOCUS);
    expect(requiredTraining(r)).toBeUndefined();
  });
});

describe('boss failure', () => {
  const mini = () => getBoss('mini-python-functions')!;
  const atGate = () => {
    let s = started();
    for (const l of lessons) { s = A.completeLesson(s, l.id).save; if (l.id === 'py-14-independent-trial') break; }
    return s;
  };
  it('removes Focus, forbids an immediate retry, needs substantial training to 100, then offers a NEW version', () => {
    const fail = (s: SaveData) => submitBoss(s, mini().id, false, 5000, { errorKind: 'wrong-output', failedChecks: ['Case 1'], visibleFailed: 0, hiddenFailed: 1, totalChecks: 3, constraintsFailed: 0 }).save;
    const first = currentBossChallenge(atGate(), mini())!.id;
    const failed = fail(atGate());
    expect(failed.stats.focus).toBe(MAX_FOCUS - FAILURE_LEVELS[4].loss);
    expect(bossStatus(failed, mini())).toBe('sealed');
    expect(submitBoss(failed, mini().id, true, 1).save.bosses[mini().id]!.passedAt).toBeUndefined();
    const plan = activePlan(failed)!;
    expect(plan.steps.length).toBeGreaterThan(4);
    expect(plan.returnTo).toMatchObject({ kind: 'boss', bossId: mini().id });
    let r = failed;
    for (const st of plan.steps) {
      expect(r.stats.focus).toBeLessThan(MAX_FOCUS);
      r = doStep(r, plan.id, st.id);
    }
    expect(r.stats.focus).toBe(MAX_FOCUS);
    expect(bossStatus(r, mini())).toBe('ready');
    expect(currentBossChallenge(r, mini())!.id).not.toBe(first);
  });
});
