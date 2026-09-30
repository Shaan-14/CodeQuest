/**
 * FOCUS: the player's readiness to attempt difficult work. The one universal rule:
 *
 *     Focus = 100  ->  ready to attempt.      Focus < 100  ->  train first.
 *
 * Failing a graded attempt costs Focus (how much depends on the FAILURE LEVEL below), and the only way back is training
 * in the Training Grounds: every step of a required plan earns a share of the Focus that was lost, and the last step (the
 * fresh proof) earns the rest, so a plan ends with exactly 100. There is no Rest and no item that restores Focus.
 *
 * Everything tunable lives in this file so the balance can change without touching the rules.
 */
import type { Challenge } from '../content/schema';
import { MAX_FOCUS, type PlanLevel, type SaveData, type TrainingPlan, type TrainingStepKind } from '../core/save';
import type { GameEvent } from './events';

export type FailureLevel = 1 | 2 | 3 | 4 | 5;

export interface LevelRule {
  label: string;
  /** Focus lost by one failed attempt at this level (capped at what the player has). */
  loss: number;
  /** The training is never lighter than this, however small the weakness looks. */
  minPlan: PlanLevel;
  /** Mentor wording: a small setback, or a major one. */
  weight: 'small' | 'major';
}

export const FAILURE_LEVELS: Record<FailureLevel, LevelRule> = {
  1: { label: 'Small task', loss: 50, minPlan: 'refresher', weight: 'small' },
  2: { label: 'Difficult task', loss: 75, minPlan: 'targeted', weight: 'small' },
  3: { label: 'Independent challenge', loss: 100, minPlan: 'deep', weight: 'major' },
  4: { label: 'Mini-boss', loss: 100, minPlan: 'deep', weight: 'major' },
  5: { label: 'Mastery boss', loss: 100, minPlan: 'deep', weight: 'major' },
};

/** A pass that needed hints in a challenge is a small setback: short reinforcement and a fresh proof. */
export const HINTED_PASS_LOSS = 25;

/**
 * How a plan's Focus is shared out: each undone step gets `need * weight / sum(weights)`, the proof takes what is left.
 * Bigger steps (practice, the proof) pay more; reading steps pay a little.
 */
export const STEP_WEIGHT: Record<TrainingStepKind, number> = { review: 1, example: 1, predict: 1, guided: 1.5, practice: 1.5, combined: 2, independent: 2 };

export const PLAN_ORDER: PlanLevel[] = ['refresher', 'targeted', 'extended', 'deep'];
export const maxPlan = (a: PlanLevel, b: PlanLevel): PlanLevel => (PLAN_ORDER.indexOf(a) >= PLAN_ORDER.indexOf(b) ? a : b);

/** Level of a failed attempt: what kind of work it was. Guided (learning-mode) exercises never cost Focus. */
export function failureLevelOf(c: Challenge, bossKind?: 'mini' | 'mastery' | 'summit'): FailureLevel {
  if (bossKind) return bossKind === 'mini' ? 4 : 5;
  if (c.mode === 'independent') return 3;
  return c.difficulty >= 3 ? 2 : 1;
}

export const focusReady = (s: SaveData): boolean => s.stats.focus >= MAX_FOCUS;
export const focusNeeded = (s: SaveData): number => Math.max(0, MAX_FOCUS - s.stats.focus);

/** Subtracts Focus (never below zero). Returns the amount actually lost. */
export function loseFocus(s: SaveData, events: GameEvent[], amount: number): number {
  const lost = Math.max(0, Math.min(s.stats.focus, Math.round(amount)));
  s.stats.focus -= lost;
  if (lost) events.push({ type: 'focusLost', amount: lost });
  return lost;
}

/** Adds Focus, stopping at the maximum. Returns the amount actually gained. */
export function gainFocus(s: SaveData, events: GameEvent[], amount: number): number {
  const gained = Math.max(0, Math.min(MAX_FOCUS - s.stats.focus, Math.round(amount)));
  s.stats.focus += gained;
  if (gained) events.push({ type: 'focusGained', amount: gained });
  return gained;
}

/**
 * Shares the Focus still owed over the plan's unfinished steps, in proportion to STEP_WEIGHT, so finishing the plan is
 * exactly what brings the player back to 100 (never more work than the Focus needs, never less than the plan's proof).
 * Called when a required plan is built and again whenever it grows.
 */
export function assignStepFocus(s: SaveData, plan: TrainingPlan): void {
  if (!plan.required) return;
  const open = plan.steps.filter((x) => !x.done);
  if (!open.length) return;
  const need = focusNeeded(s);
  const total = open.reduce((n, x) => n + STEP_WEIGHT[x.kind], 0);
  let left = need;
  open.forEach((x, i) => {
    const share = i === open.length - 1 ? left : Math.min(left, Math.round((need * STEP_WEIGHT[x.kind]) / total));
    x.focus = share;
    left -= share;
  });
}
