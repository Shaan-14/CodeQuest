/**
 * DAILY CHALLENGE state transitions (pure: (save, nowMs, ...) => { save, events }). See dailySelect.ts for how a
 * challenge is chosen and ARCHITECTURE.md for the rules. In short:
 *  - a new challenge is issued every 12 hours; the offer, its expiry and the clock guard are persisted, so
 *    reloading, closing the browser or navigating cannot re-roll or extend it;
 *  - ONE graded attempt: no retries, no hints, no solution reveal; failing costs nothing but the reward;
 *  - a solve pays coins/XP/Focus and is recorded as ordinary independent EVIDENCE: it never marks a skill mastered.
 */
import { getAnyChallenge, getSkill } from '../content';
import { objectiveOf } from '../content/helpers';
import { DAILY_HISTORY_LIMIT, MAX_FOCUS, type DailyRecord, type SaveData } from '../core/save';
import { supportFor, type EvidenceRecord } from '../learning/mastery';
import { draft, failuresSinceLastPass, gain, settle, type Result } from './actions';
import { pickDaily } from './dailySelect';

export const DAILY_PERIOD_MS = 12 * 3600 * 1000;

/** Milestone cosmetics (unpriced, never sold): number of dailies passed -> item id. */
export const DAILY_ITEM_MILESTONES: Record<number, string> = { 10: 'daily-medal', 25: 'sharp-monocle', 50: 'golden-hourglass' };

/**
 * The time the game acts on. It never moves backwards: setting the system clock back cannot extend an offer or
 * bring an expired one back. (Setting it FORWARD cannot be prevented client-side; see the security note.)
 */
export function effectiveNow(save: SaveData, nowMs: number): number {
  const seen = save.daily.lastSeenAt ? Date.parse(save.daily.lastSeenAt) : 0;
  return Math.max(nowMs, Number.isFinite(seen) ? seen : 0);
}

export function passedCount(save: SaveData): number {
  return save.daily.history.filter((h) => h.outcome === 'passed').length;
}

function pushHistory(s: SaveData, rec: DailyRecord): void {
  s.daily.history.push(rec);
  if (s.daily.history.length > DAILY_HISTORY_LIMIT) s.daily.history.splice(0, s.daily.history.length - DAILY_HISTORY_LIMIT);
}

/**
 * Advance the daily clock. Call on load and on a timer. Expires an unfinished offer (recorded as 'missed',
 * with no penalty) and issues a new one. Safe to call as often as you like: within a period it changes nothing.
 */
export function refreshDaily(save: SaveData, nowMs: number): Result {
  const { s, events } = draft(save);
  if (!s.player) return { save: s, events };
  const now = effectiveNow(s, nowMs);
  s.daily.lastSeenAt = new Date(now).toISOString();
  const cur = s.daily.current;
  if (cur && now < Date.parse(cur.expiresAt)) return { save: s, events };
  if (cur && cur.status === 'open') {
    const c = getAnyChallenge(cur.challengeId);
    pushHistory(s, { challengeId: cur.challengeId, focus: cur.focus, skillIds: c?.skillIds ?? [cur.skillId], category: cur.category, difficulty: cur.difficulty, issuedAt: cur.issuedAt, outcome: 'missed', coins: 0, xp: 0 });
  }
  s.daily.current = null;
  const pick = pickDaily(s, now);
  if (!pick) return { save: s, events };
  s.daily.current = {
    challengeId: pick.challenge.id,
    focus: pick.focus,
    skillId: pick.skill.skill.id,
    category: pick.skill.skill.category,
    difficulty: pick.challenge.difficulty,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DAILY_PERIOD_MS).toISOString(),
    status: 'open',
    attempts: 0,
    reason: pick.reason,
    reward: pick.reward,
  };
  return { save: s, events };
}

/** Milliseconds until the current offer is replaced (0 if none). */
export function timeRemainingMs(save: SaveData, nowMs: number): number {
  const cur = save.daily.current;
  if (!cur) return 0;
  return Math.max(0, Date.parse(cur.expiresAt) - effectiveNow(save, nowMs));
}

/** "7h 42m", "42m", "under a minute". */
export function formatRemaining(ms: number): string {
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin <= 0) return 'under a minute';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** True while the offer can still be submitted: open, unattempted, not expired. */
export function canSubmitDaily(save: SaveData, nowMs: number): boolean {
  const cur = save.daily.current;
  return !!cur && cur.status === 'open' && cur.attempts === 0 && effectiveNow(save, nowMs) < Date.parse(cur.expiresAt);
}

/**
 * The single graded submission. A second call, a call after expiry, or a call with nothing on offer changes nothing
 * (that is the "no retries" rule, enforced here and not only in the UI).
 */
export function submitDaily(save: SaveData, nowMs: number, passed: boolean, timeMs: number): Result {
  const { s, events } = draft(save);
  const cur = s.daily.current;
  if (!cur || !canSubmitDaily(s, nowMs)) return { save: s, events };
  const c = getAnyChallenge(cur.challengeId);
  if (!c) return { save: s, events };
  const now = effectiveNow(s, nowMs);
  s.daily.lastSeenAt = new Date(now).toISOString();

  const objectiveId = objectiveOf(c);
  const record: EvidenceRecord = {
    at: new Date(now).toISOString(),
    challengeId: c.id,
    objectiveId,
    context: c.context ?? '',
    lookups: 0,
    priorFailures: failuresSinceLastPass(s, objectiveId),
    project: !!c.project,
    skillIds: c.skillIds,
    concepts: c.concepts,
    mode: 'independent',
    difficulty: c.difficulty,
    passed,
    support: supportFor('independent', 0, c.transfer),
    hintsUsed: 0,
    attemptNumber: 1,
    timeMs,
    executed: true,
  };
  s.evidence.push(record);

  cur.attempts = 1;
  cur.status = passed ? 'passed' : 'failed';
  cur.resolvedAt = new Date(now).toISOString();
  pushHistory(s, {
    challengeId: c.id, focus: cur.focus, skillIds: c.skillIds, category: cur.category, difficulty: cur.difficulty,
    issuedAt: cur.issuedAt, resolvedAt: cur.resolvedAt, outcome: passed ? 'passed' : 'failed',
    coins: passed ? cur.reward.coins : 0, xp: passed ? cur.reward.xp : 0,
  });

  if (passed) {
    gain(s, events, cur.reward.xp, cur.reward.coins, 'Daily Challenge');
    const before = s.stats.focus;
    s.stats.focus = Math.min(MAX_FOCUS, s.stats.focus + cur.reward.focus);
    if (s.stats.focus > before) events.push({ type: 'focusGained', amount: s.stats.focus - before });
    const item = DAILY_ITEM_MILESTONES[passedCount(s)];
    if (item) {
      s.inventory[item] = (s.inventory[item] ?? 0) + 1;
      events.push({ type: 'item', id: item });
    }
    events.push({ type: 'dailyPassed' });
  } else {
    events.push({ type: 'dailyFailed' });
  }
  settle(s, events);
  return { save: s, events };
}

/** Skill title for the UI. */
export const dailySkillTitle = (skillId: string): string => getSkill(skillId)?.title ?? skillId;
