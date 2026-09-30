/**
 * TRAINING ACTIONS (pure: (save, ...) => { save, events }). Training is a DETOUR from the curriculum, never a step
 * backwards: nothing here touches `save.learning.lessons`, unlocked areas, quests or achievements' progress. A plan
 * remembers where the player was (`returnTo`) and hands them back when the independent demonstration is done.
 *
 * Training is not a punishment: failed training steps cost no Focus, passed steps give a little Focus back, there is
 * no failure limit and no waiting timer. A failed independent step makes the plan GROW with fresh problems.
 */
import { getAnyChallenge } from '../content';
import { MAX_FOCUS, type PlanLevel, type ReturnPoint, type SaveData, type TrainingPlan, type TrainingStep, type Weakness } from '../core/save';
import type { FailureDetail } from '../learning/mastery';
import { draft, progressFor, settle, type Result } from './actions';
import { LEVEL_OF, maxSeverity, SEVERITY_ORDER } from './diagnosis';
import { buildEvidence, independentPassesOn } from './evidence';
import { buildSteps, shakyPrerequisites } from './trainingPlan';
import { nextTrainingId } from './weakness';

const now = () => new Date().toISOString();
export const TRAINING_FOCUS_REWARD = 8;

export const weaknessOf = (s: SaveData, id: string): Weakness | undefined => s.training.weaknesses.find((w) => w.id === id);
export const planOf = (s: SaveData, id: string): TrainingPlan | undefined => s.training.plans.find((p) => p.id === id);
export const activePlan = (s: SaveData): TrainingPlan | undefined => (s.training.activePlanId ? planOf(s, s.training.activePlanId) : undefined);

/** Level of plan a weakness deserves. A hinted pass earns a targeted (never larger than its severity) plan. */
export function levelFor(w: Weakness): PlanLevel {
  if (w.kind === 'hint-reliance') return w.severity === 'minor' || w.severity === 'moderate' ? 'targeted' : w.severity === 'serious' ? 'extended' : 'deep';
  if (w.kind === 'rust' || w.kind === 'prerequisite' || w.kind === 'review' || w.kind === 'boss-prep') return w.severity === 'minor' ? 'refresher' : LEVEL_OF[w.severity];
  return LEVEL_OF[w.severity];
}

/** A major weakness that surfaced inside a lesson holds that lesson's completion until training is done. */
export function lessonBlockedBy(s: SaveData, lessonId: string): Weakness | undefined {
  return s.training.weaknesses.find((w) => w.status !== 'resolved' && w.severity === 'major' && w.source === 'lesson' && w.exposedBy.lessonId === lessonId);
}

const countBefore = (s: SaveData, w: Weakness) => ({ independentPasses: independentPassesOn(s.evidence, w.skillIds), failures: s.evidence.filter((r) => !r.passed && w.skillIds.some((k) => r.skillIds.includes(k))).length });

/** Start (or resume) training for a weakness. Curriculum progress is untouched. */
export function startTraining(save: SaveData, weaknessId: string, returnTo: ReturnPoint): Result {
  const { s, events } = draft(save);
  const w = weaknessOf(s, weaknessId);
  if (!w || w.status === 'resolved') return { save: s, events };
  const existing = s.training.plans.find((p) => p.weaknessId === w.id && p.status === 'active');
  if (existing) { s.training.activePlanId = existing.id; return { save: s, events }; }
  // Only one plan at a time: an unfinished plan for another weakness stays active (it can be abandoned explicitly).
  const other = activePlan(s);
  if (other) return { save: s, events };
  const level = levelFor(w);
  const plan: TrainingPlan = {
    id: nextTrainingId(s, 'p'), weaknessId: w.id, level, required: w.severity === 'major' && w.source === 'lesson', createdAt: now(), returnTo,
    steps: [], status: 'active', escalations: 0, before: countBefore(s, w),
  };
  plan.steps = buildSteps(s, w, level);
  s.training.plans.push(plan);
  s.training.activePlanId = plan.id;
  w.status = 'training';
  w.planIds.push(plan.id);
  events.push({ type: 'trainingStarted', planId: plan.id });
  return { save: s, events };
}

export function abandonTraining(save: SaveData, planId: string): Result {
  const { s, events } = draft(save);
  const p = planOf(s, planId);
  if (!p || p.status !== 'active') return { save: s, events };
  p.status = 'abandoned';
  if (s.training.activePlanId === planId) s.training.activePlanId = null;
  const w = weaknessOf(s, p.weaknessId);
  if (w && w.status === 'training') w.status = 'open';
  return { save: s, events };
}

/** Review/example steps are read, not graded. */
export function completeReadingStep(save: SaveData, planId: string, stepId: string): Result {
  const { s, events } = draft(save);
  const p = planOf(s, planId);
  const st = p?.steps.find((x) => x.id === stepId);
  if (!p || p.status !== 'active' || !st || (st.kind !== 'review' && st.kind !== 'example') || st.done) return { save: s, events };
  st.done = true;
  events.push({ type: 'trainingStep', planId });
  finishIfDone(s, events, p);
  return { save: s, events };
}

/** Fresh start for a training problem: hints and draft reset (the evidence history is never edited). */
export function beginStep(save: SaveData, planId: string, stepId: string): Result {
  const { s, events } = draft(save);
  const st = planOf(s, planId)?.steps.find((x) => x.id === stepId);
  if (st?.challengeId) {
    const pr = progressFor(s, st.challengeId);
    pr.hintsUsed = 0;
    delete pr.code;
  }
  return { save: s, events };
}

const isDemonstration = (st: TrainingStep) => st.kind === 'independent' || st.kind === 'combined';

/** A graded submission of a training step. Costs no Focus; never changes curriculum progress. */
export function submitTrainingStep(save: SaveData, planId: string, stepId: string, passed: boolean, timeMs: number, code: string, detail?: FailureDetail): Result {
  const { s, events } = draft(save);
  const p = planOf(s, planId);
  const st = p?.steps.find((x) => x.id === stepId);
  const c = st?.challengeId ? getAnyChallenge(st.challengeId) : undefined;
  if (!p || p.status !== 'active' || !st || !c) return { save: s, events };
  const pr = progressFor(s, c.id);
  pr.attempts++;
  pr.timeMs += timeMs;
  pr.code = code;
  const rec = buildEvidence(s, c, { passed, at: now(), timeMs: pr.timeMs, hintsUsed: pr.hintsUsed, lookups: pr.lookups ?? 0, attemptNumber: pr.attempts, source: 'training', detail, training: { planId, stepId, kind: st.kind }, forceIndependent: c.mode === 'independent' });
  s.evidence.push(rec);
  st.attempts++;
  if (passed) {
    pr.passed = true;
    pr.passedAt ??= now();
    pr.bestHintsUsed = Math.min(pr.bestHintsUsed ?? Infinity, pr.hintsUsed);
    // A demonstration only counts when it was done alone: a hinted pass is guided evidence, so the step stays open.
    if (!isDemonstration(st) || pr.hintsUsed === 0) {
      st.done = true;
      st.passed = true;
      const before = s.stats.focus;
      s.stats.focus = Math.min(MAX_FOCUS, s.stats.focus + TRAINING_FOCUS_REWARD);
      if (s.stats.focus > before) events.push({ type: 'focusGained', amount: s.stats.focus - before });
      events.push({ type: 'trainingStep', planId });
    }
  } else if (isDemonstration(st)) escalate(s, p);
  finishIfDone(s, events, p);
  settle(s, events);
  return { save: s, events };
}

/** A failed independent step means the weakness runs deeper than planned: add fresh problems (and, from the second time, foundations). */
function escalate(s: SaveData, p: TrainingPlan): void {
  const w = weaknessOf(s, p.weaknessId);
  if (!w) return;
  p.escalations++;
  w.failures++;
  const sev = SEVERITY_ORDER[Math.min(SEVERITY_ORDER.length - 1, SEVERITY_ORDER.indexOf(w.severity) + (p.escalations % 2 === 0 ? 1 : 0))]!;
  w.severity = maxSeverity(w.severity, sev);
  const target: PlanLevel = p.escalations >= 2 && p.level !== 'deep' ? levelFor(w) : p.level;
  const extra = buildSteps(s, w, p.escalations >= 2 ? 'extended' : 'targeted').filter((x) => x.kind !== 'review' || !p.steps.some((y) => y.kind === 'review' && y.skillId === x.skillId));
  // Never leave a stale unfinished demonstration in front of the new ones: the newest independent step is the test.
  const pending = p.steps.filter((x) => !x.done && isDemonstration(x));
  for (const x of pending) x.done = true, (x.passed = false);
  if (p.escalations >= 2) for (const pre of shakyPrerequisites(s, w.skillIds)) if (!p.steps.some((x) => x.kind === 'review' && x.skillId === pre)) p.steps.push({ id: nextTrainingId(s, 't'), kind: 'review', skillId: pre, done: false, attempts: 0 });
  p.steps.push(...extra);
  if (SEVERITY_ORDER.indexOf(LEVEL_TO_SEV[target]) > SEVERITY_ORDER.indexOf(LEVEL_TO_SEV[p.level])) p.level = target;
}
const LEVEL_TO_SEV: Record<PlanLevel, Weakness['severity']> = { refresher: 'minor', targeted: 'moderate', extended: 'serious', deep: 'major' };

function finishIfDone(s: SaveData, events: Result['events'], p: TrainingPlan): void {
  if (p.status !== 'active') return;
  const lastDemo = [...p.steps].reverse().find(isDemonstration);
  // Complete when every step is done AND the last demonstration was passed alone (superseded failed ones don't count).
  if (!p.steps.every((x) => x.done) || (lastDemo && !lastDemo.passed)) return;
  p.status = 'complete';
  p.completedAt = now();
  const w = weaknessOf(s, p.weaknessId);
  if (w) {
    w.status = 'resolved';
    w.resolvedAt = p.completedAt;
    w.resolvedBy = lastDemo?.challengeId;
    p.after = { independentPasses: independentPassesOn(s.evidence, w.skillIds) };
    events.push({ type: 'weaknessResolved', id: w.id });
  }
  if (s.training.activePlanId === p.id) s.training.activePlanId = null;
  events.push({ type: 'trainingComplete', planId: p.id });
}

/** Where to send the player when training ends. The lesson's own progress is exactly as they left it. */
export const returnPointOf = (s: SaveData, planId: string): ReturnPoint | undefined => planOf(s, planId)?.returnTo;
