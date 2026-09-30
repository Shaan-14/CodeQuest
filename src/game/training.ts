/**
 * TRAINING ACTIONS (pure: (save, ...) => { save, events }). Training is a DETOUR from the curriculum, never a step
 * backwards: nothing here touches `save.learning.lessons`, unlocked areas, quests or achievements' progress. A plan
 * remembers where the player was (`returnTo`) and hands them back when the independent demonstration is done.
 *
 * Training is not a punishment: failed training steps cost no Focus, passed steps give a little Focus back, there is
 * no failure limit and no waiting timer. A failed final proof makes the plan GROW (more practice, then a NEW proof).
 *
 * A weakness that came from a lesson or a boss is REQUIRED (`Weakness.required`): the curriculum is blocked until its
 * plan is complete (`requiredTraining`). Nothing is rolled back; the plan remembers the exact place to return to.
 */
import { getAnyChallenge, lessonOfChallenge } from '../content';
import type { Challenge } from '../content/schema';
import { type PlanLevel, type ReturnPoint, type SaveData, type TrainingPlan, type TrainingStep, type Weakness } from '../core/save';
import type { FailureDetail } from '../learning/mastery';
import { draft, progressFor, settle, type Result } from './actions';
import { LEVEL_OF, maxSeverity, SEVERITY_ORDER } from './diagnosis';
import { buildEvidence, independentPassesOn } from './evidence';
import { buildSteps, shakyPrerequisites } from './trainingPlan';
import { moduleFor } from '../content/training/modules';
import { nextTrainingId } from './weakness';
import { FAILURE_LEVELS, assignStepFocus, focusNeeded, gainFocus, maxPlan, type FailureLevel } from './focus';

const now = () => new Date().toISOString();

export const weaknessOf = (s: SaveData, id: string): Weakness | undefined => s.training.weaknesses.find((w) => w.id === id);
export const planOf = (s: SaveData, id: string): TrainingPlan | undefined => s.training.plans.find((p) => p.id === id);
export const activePlan = (s: SaveData): TrainingPlan | undefined => (s.training.activePlanId ? planOf(s, s.training.activePlanId) : undefined);

/** Level of plan a weakness deserves. A hinted pass earns a targeted (never larger than its severity) plan. */
export function levelFor(w: Weakness): PlanLevel {
  // A hint means short reinforcement and ONE fresh problem; only a serious or major pattern of hints earns more.
  if (w.kind === 'hint-reliance') return w.severity === 'minor' || w.severity === 'moderate' ? 'refresher' : w.severity === 'serious' ? 'targeted' : 'extended';
  if (w.kind === 'rust' || w.kind === 'prerequisite' || w.kind === 'review' || w.kind === 'boss-prep') return w.severity === 'minor' ? 'refresher' : LEVEL_OF[w.severity];
  return LEVEL_OF[w.severity];
}

/** The weakness whose training is REQUIRED before the player may go on with the curriculum (undefined when nothing blocks). */
export const requiredTraining = (s: SaveData): Weakness | undefined => s.training.weaknesses.find((w) => w.required && w.status !== 'resolved');

/** The plan for a weakness (active or the newest), if any. */
export const planFor = (s: SaveData, weaknessId: string): TrainingPlan | undefined => [...s.training.plans].reverse().find((p) => p.weaknessId === weaknessId && p.status !== 'abandoned');

/** Where a failure in a lesson challenge hands the player back to: the same lesson, the same step. */
export function returnToFor(s: SaveData, c: Challenge): ReturnPoint {
  const l = lessonOfChallenge(c.id);
  return l ? { kind: 'lesson', lessonId: l.id, stepIndex: s.learning.lessons[l.id]?.stepIndex ?? 0, challengeId: c.id } : { kind: 'map' };
}

const countBefore = (s: SaveData, w: Weakness) => ({ independentPasses: independentPassesOn(s.evidence, w.skillIds), failures: s.evidence.filter((r) => !r.passed && w.skillIds.some((k) => r.skillIds.includes(k))).length });

/** Creates the plan for a weakness on a DRAFT save (no other plan may be active). */
function beginPlan(s: SaveData, events: Result['events'], w: Weakness, returnTo: ReturnPoint): TrainingPlan {
  // Training is never lighter than the failure deserves: a failed independent challenge or boss always gets a deeper plan.
  const fl = (w.focusLevel ?? 0) as FailureLevel | 0;
  const level = w.required && fl ? maxPlan(levelFor(w), FAILURE_LEVELS[fl].minPlan) : levelFor(w);
  const plan: TrainingPlan = {
    id: nextTrainingId(s, 'p'), weaknessId: w.id, level, required: !!w.required, createdAt: now(), returnTo, focusLevel: fl || undefined, focusLost: w.required ? focusNeeded(s) : undefined,
    steps: [], status: 'active', escalations: 0, before: countBefore(s, w),
  };
  plan.steps = buildSteps(s, w, level);
  assignStepFocus(s, plan);
  s.training.plans.push(plan);
  s.training.activePlanId = plan.id;
  w.status = 'training';
  w.planIds.push(plan.id);
  events.push({ type: 'trainingStarted', planId: plan.id });
  return plan;
}

/**
 * Called right after a meaningful failure created (or deepened) a required weakness: makes sure a plan exists and is the
 * active one, so the Training Grounds already knows what to do. An optional plan the player had started is set aside.
 */
export function ensureRequiredPlan(s: SaveData, events: Result['events'], w: Weakness, returnTo: ReturnPoint): void {
  if (!w.required || w.status === 'resolved') return;
  if (s.training.plans.some((p) => p.weaknessId === w.id && p.status === 'active')) return;
  const other = activePlan(s);
  if (other) { other.status = 'abandoned'; const ow = weaknessOf(s, other.weaknessId); if (ow && ow.status === 'training') ow.status = 'open'; s.training.activePlanId = null; }
  beginPlan(s, events, w, returnTo);
}

/** Start (or resume) training for a weakness. Curriculum progress is untouched. */
export function startTraining(save: SaveData, weaknessId: string, returnTo: ReturnPoint): Result {
  const { s, events } = draft(save);
  const w = weaknessOf(s, weaknessId);
  if (!w || w.status === 'resolved') return { save: s, events };
  const existing = s.training.plans.find((p) => p.weaknessId === w.id && p.status === 'active');
  if (existing) { s.training.activePlanId = existing.id; return { save: s, events }; }
  // A required plan always wins; an optional one waits while another plan is active.
  if (w.required) ensureRequiredPlan(s, events, w, returnTo);
  else if (!activePlan(s)) beginPlan(s, events, w, returnTo);
  return { save: s, events };
}

export function abandonTraining(save: SaveData, planId: string): Result {
  const { s, events } = draft(save);
  const p = planOf(s, planId);
  if (!p || p.status !== 'active' || p.required) return { save: s, events }; // required training cannot be set aside
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
  gainFocus(s, events, st.focus ?? 0);
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

/** The final proof (and the legacy `combined` kind from older saves). */
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
      gainFocus(s, events, st.focus ?? 0);
      events.push({ type: 'trainingStep', planId });
    }
  } else if (isDemonstration(st)) escalate(s, p);
  finishIfDone(s, events, p);
  settle(s, events);
  return { save: s, events };
}

/**
 * A failed final proof means the weakness runs deeper than planned: the plan grows with more practice (from the second
 * time also foundations and a prediction) and ends with a NEW proof. Exactly one unfinished proof exists at any time.
 */
function escalate(s: SaveData, p: TrainingPlan): void {
  const w = weaknessOf(s, p.weaknessId);
  if (!w) return;
  p.escalations++;
  w.failures++;
  const sev = SEVERITY_ORDER[Math.min(SEVERITY_ORDER.length - 1, SEVERITY_ORDER.indexOf(w.severity) + (p.escalations % 2 === 0 ? 1 : 0))]!;
  w.severity = maxSeverity(w.severity, sev);
  const target: PlanLevel = p.escalations >= 2 && p.level !== 'deep' ? levelFor(w) : p.level;
  for (const x of p.steps.filter((y) => !y.done && isDemonstration(y))) { x.done = true; x.passed = false; }
  if (p.escalations >= 2) for (const pre of shakyPrerequisites(s, w.skillIds)) if (!p.steps.some((x) => x.kind === 'review' && x.skillId === pre)) p.steps.push({ id: nextTrainingId(s, 't'), kind: 'review', skillId: pre, done: false, attempts: 0 });
  const extra: ('practice' | 'predict' | 'independent')[] = [...(p.escalations >= 2 ? (['predict'] as const) : []), 'practice', ...(p.escalations >= 2 ? (['practice'] as const) : []), 'independent'];
  p.steps.push(...buildSteps(s, w, p.level, undefined, extra));
  assignStepFocus(s, p);
  if (SEVERITY_ORDER.indexOf(LEVEL_TO_SEV[target]) > SEVERITY_ORDER.indexOf(LEVEL_TO_SEV[p.level])) p.level = target;
}
const LEVEL_TO_SEV: Record<PlanLevel, Weakness['severity']> = { refresher: 'minor', targeted: 'moderate', extended: 'serious', deep: 'major' };

/** A prediction step: the answer is a choice. A wrong choice costs nothing and shows why; the step is done on the right one. */
export function answerPrediction(save: SaveData, planId: string, stepId: string, choice: number): Result & { correct?: boolean } {
  const { s, events } = draft(save);
  const p = planOf(s, planId);
  const st = p?.steps.find((x) => x.id === stepId);
  const w = p ? weaknessOf(s, p.weaknessId) : undefined;
  const q = w ? moduleFor(w.skillIds)?.predict : undefined;
  if (!p || p.status !== 'active' || !st || st.kind !== 'predict' || st.done || !q) return { save: s, events };
  st.attempts++;
  const correct = choice === q.correct;
  if (correct) { st.done = true; st.passed = true; gainFocus(s, events, st.focus ?? 0); events.push({ type: 'trainingStep', planId }); finishIfDone(s, events, p); }
  return { save: s, events, correct };
}

function finishIfDone(s: SaveData, events: Result['events'], p: TrainingPlan): void {
  if (p.status !== 'active') return;
  const lastDemo = [...p.steps].reverse().find(isDemonstration);
  // Complete when every step is done AND the last demonstration was passed alone (superseded failed ones don't count).
  if (!p.steps.every((x) => x.done) || (lastDemo && !lastDemo.passed)) return;
  p.status = 'complete';
  p.completedAt = now();
  if (p.required) gainFocus(s, events, focusNeeded(s)); // the shares add up to exactly what was lost; this only absorbs rounding
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
