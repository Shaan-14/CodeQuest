/**
 * BALANCE: every number that shapes pacing, in one readable place. The values live next to the rules that use them (so the rule and
 * its tuning are read together); this module gathers them, and balance.test.ts proves the table stays sensible whenever one changes.
 * None of them can ever affect mastery: mastery is computed from evidence only (learning/mastery.ts).
 */
import { MAX_FOCUS, type PlanLevel } from '../core/save';
import { FAILURE_LEVELS, HINTED_PASS_LOSS, PLAN_ORDER, STEP_WEIGHT } from './focus';
import { shapeFor } from './trainingPlan';
import { DAILY_PERIOD_MS } from './daily';
import { dailyReward, RECENT_CHALLENGE_WINDOW, RECENT_SKILL_WINDOW } from './dailySelect';
import { FAILED_INTERVAL_DAYS, GUIDED_INTERVAL_DAYS, STREAK_INTERVAL_DAYS, TROUBLE_INTERVAL_DAYS } from './retention';

export const BALANCE = {
  focus: { max: MAX_FOCUS, failureLevels: FAILURE_LEVELS, hintedPassLoss: HINTED_PASS_LOSS, stepWeight: STEP_WEIGHT },
  training: {
    planOrder: PLAN_ORDER,
    /** What each plan depth consists of, in order. */
    shapes: Object.fromEntries(PLAN_ORDER.map((l) => [l, shapeFor(l)])) as Record<PlanLevel, ReturnType<typeof shapeFor>>,
  },
  review: { streakDays: STREAK_INTERVAL_DAYS, guidedDays: GUIDED_INTERVAL_DAYS, failedDays: FAILED_INTERVAL_DAYS, troubleDays: TROUBLE_INTERVAL_DAYS },
  daily: {
    periodMs: DAILY_PERIOD_MS,
    recentSkillWindow: RECENT_SKILL_WINDOW,
    recentChallengeWindow: RECENT_CHALLENGE_WINDOW,
    reward: (difficulty: number, kind: 'current' | 'review' | 'mixed') => dailyReward(difficulty, kind),
  },
} as const;
