/**
 * All game state transitions. Every function is PURE: (save, ...args) => { save, events }.
 * The input save is never mutated. The store (store.ts) persists the result and shows the events.
 * Keeping this free of UI and storage makes the rules (XP, unlocks, evidence) unit-testable.
 */
import { getChallenge, getLesson } from '../content';
import { items, quests } from '../content/world';
import { areas } from '../content/world';
import { MAX_FOCUS, newSave, type ChallengeProgress, type SaveData } from '../core/save';
import { supportFor, type EvidenceRecord } from '../learning/mastery';
import { newlyEarned } from './achievements';
import type { GameEvent } from './events';
import { levelFromXp, rewardFor } from './progression';
import { isAreaUnlocked } from './world';

export interface Result {
  save: SaveData;
  events: GameEvent[];
}

export const FOCUS_LOSS_PER_FAILED_SUBMIT = 10;
const now = () => new Date().toISOString();

/** Copy so callers' saves are never mutated. */
function draft(save: SaveData): { s: SaveData; events: GameEvent[] } {
  return { s: structuredClone(save), events: [] };
}

/** Recompute derived unlocks/achievements. Call at the end of any action that could change them. */
function settle(s: SaveData, events: GameEvent[]): void {
  for (const area of areas) {
    if (isAreaUnlocked(area, s) && !s.unlockedAreas.includes(area.id)) {
      s.unlockedAreas.push(area.id);
      if (events.length || s.player) events.push({ type: 'areaUnlocked', id: area.id });
    }
  }
  // Achievements can unlock each other only via quests/levels, so two passes is plenty.
  for (let i = 0; i < 2; i++) {
    for (const id of newlyEarned(s)) {
      s.achievements[id] = now();
      events.push({ type: 'achievement', id });
    }
  }
}

function gain(s: SaveData, events: GameEvent[], xp: number, coins: number, note?: string): void {
  const before = levelFromXp(s.stats.xp);
  s.stats.xp += xp;
  s.stats.coins += coins;
  if (xp > 0) events.push({ type: 'xp', amount: xp, note });
  if (coins > 0) events.push({ type: 'coins', amount: coins });
  const after = levelFromXp(s.stats.xp);
  if (after > before) events.push({ type: 'levelUp', level: after });
}

function progressFor(s: SaveData, challengeId: string): ChallengeProgress {
  return (s.learning.challenges[challengeId] ??= { attempts: 0, runs: 0, hintsUsed: 0, passed: false, xpAwarded: 0, coinsAwarded: 0, timeMs: 0 });
}

export function createPlayer(save: SaveData, name: string, avatar: string): Result {
  const { s, events } = draft(save);
  s.player = { name: name.trim().slice(0, 20) || 'Adventurer', avatar, createdAt: now() };
  settle(s, events);
  return { save: s, events };
}

export function setFlag(save: SaveData, flag: string, value = true): Result {
  const { s, events } = draft(save);
  s.flags[flag] = value;
  return { save: s, events };
}

export function acceptQuest(save: SaveData, questId: string): Result {
  const { s, events } = draft(save);
  if (!s.quests[questId] && quests.some((q) => q.id === questId)) {
    s.quests[questId] = { status: 'active', acceptedAt: now() };
    events.push({ type: 'questAccepted', id: questId });
  }
  settle(s, events);
  return { save: s, events };
}

/** The Run button (or a demo run). challengeId is undefined for lesson demos. */
export function recordRun(save: SaveData, challengeId?: string): Result {
  const { s, events } = draft(save);
  s.flags['ran-code'] = true;
  if (challengeId) progressFor(s, challengeId).runs++;
  settle(s, events);
  return { save: s, events };
}

/** Reveals the next hint (if any). Hints used only ever increases and is part of the evidence. */
export function revealHint(save: SaveData, challengeId: string): Result {
  const { s, events } = draft(save);
  const c = getChallenge(challengeId);
  const p = progressFor(s, challengeId);
  if (c && c.mode !== 'independent' && p.hintsUsed < c.hints.length) p.hintsUsed++;
  return { save: s, events };
}

/**
 * Replay an already-passed challenge as a fresh round: hints reset to 0 and the draft is cleared.
 * A hint-free pass then records stronger (independent) evidence and pays only the extra reward.
 */
export function startReplay(save: SaveData, challengeId: string): Result {
  const { s, events } = draft(save);
  const p = s.learning.challenges[challengeId];
  if (p?.passed) {
    p.hintsUsed = 0;
    delete p.code;
  }
  return { save: s, events };
}

export function saveDraftCode(save: SaveData, challengeId: string, code: string, addedMs = 0): Result {
  const { s, events } = draft(save);
  const p = progressFor(s, challengeId);
  p.code = code;
  p.timeMs += addedMs;
  return { save: s, events };
}

/**
 * A graded submission. Always records an EvidenceRecord (pass OR fail). On the first pass pays
 * XP/coins; a later, less-assisted pass pays only the difference, so replaying with fewer hints
 * is rewarded but grinding the same solve is not.
 */
export function submitChallenge(save: SaveData, challengeId: string, passed: boolean, timeMs: number, code: string): Result {
  const { s, events } = draft(save);
  const c = getChallenge(challengeId);
  if (!c) return { save: s, events };
  const p = progressFor(s, challengeId);
  p.attempts++;
  p.timeMs += timeMs;
  p.code = code;

  const record: EvidenceRecord = {
    at: now(),
    challengeId,
    skillIds: c.skillIds,
    concepts: c.concepts,
    mode: c.mode,
    difficulty: c.difficulty,
    passed,
    support: supportFor(c.mode, p.hintsUsed, c.transfer),
    hintsUsed: p.hintsUsed,
    attemptNumber: p.attempts,
    timeMs: p.timeMs,
    executed: true,
  };
  s.evidence.push(record);

  if (passed) {
    const reward = rewardFor(c, p.hintsUsed);
    const xp = Math.max(0, reward.xp - p.xpAwarded);
    const coins = Math.max(0, reward.coins - p.coinsAwarded);
    p.xpAwarded += xp;
    p.coinsAwarded += coins;
    p.passed = true;
    p.passedAt ??= now();
    p.bestHintsUsed = Math.min(p.bestHintsUsed ?? Infinity, p.hintsUsed);
    gain(s, events, xp, coins, reward.note);
  } else {
    const lost = Math.min(s.stats.focus, FOCUS_LOSS_PER_FAILED_SUBMIT);
    s.stats.focus -= lost;
    if (lost) events.push({ type: 'focusLost', amount: lost });
  }
  settle(s, events);
  return { save: s, events };
}

/** Player has moved to a later step of a lesson. */
export function advanceStep(save: SaveData, lessonId: string, stepIndex: number): Result {
  const { s, events } = draft(save);
  const lp = (s.learning.lessons[lessonId] ??= { stepIndex: 0, completed: false });
  lp.stepIndex = Math.max(lp.stepIndex, stepIndex);
  return { save: s, events };
}

/** Finish a lesson: pays the lesson XP once, advances quests, unlocks areas. */
export function completeLesson(save: SaveData, lessonId: string): Result {
  const { s, events } = draft(save);
  const lesson = getLesson(lessonId);
  if (!lesson) return { save: s, events };
  const lp = (s.learning.lessons[lessonId] ??= { stepIndex: 0, completed: false });
  if (!lp.completed) {
    lp.completed = true;
    lp.completedAt = now();
    lp.stepIndex = lesson.steps.length;
    events.push({ type: 'lessonComplete', id: lessonId });
    gain(s, events, lesson.xpReward, 0, 'Lesson complete');
    for (const q of quests) {
      const state = s.quests[q.id];
      if (state?.status === 'active' && q.objectives.every((o) => s.learning.lessons[o.lessonId]?.completed)) {
        state.status = 'complete';
        state.completedAt = now();
        events.push({ type: 'questComplete', id: q.id });
        gain(s, events, q.reward.xp, q.reward.coins, `Quest: ${q.title}`);
        for (const id of q.reward.items ?? []) {
          s.inventory[id] = (s.inventory[id] ?? 0) + 1;
          events.push({ type: 'item', id });
        }
      }
    }
  }
  settle(s, events);
  return { save: s, events };
}

export function buyItem(save: SaveData, itemId: string): Result {
  const { s, events } = draft(save);
  const item = items.find((i) => i.id === itemId);
  if (!item || item.price === null || s.stats.coins < item.price) return { save: s, events };
  if (item.kind === 'cosmetic' && s.inventory[itemId]) return { save: s, events };
  s.stats.coins -= item.price;
  s.inventory[itemId] = (s.inventory[itemId] ?? 0) + 1;
  s.flags['bought-item'] = true;
  events.push({ type: 'item', id: itemId });
  settle(s, events);
  return { save: s, events };
}

export function useItem(save: SaveData, itemId: string): Result {
  const { s, events } = draft(save);
  const item = items.find((i) => i.id === itemId);
  if (!item || item.kind !== 'consumable' || !s.inventory[itemId] || s.stats.focus >= MAX_FOCUS) return { save: s, events };
  s.inventory[itemId]!--;
  if (s.inventory[itemId] === 0) delete s.inventory[itemId];
  s.stats.focus = Math.min(MAX_FOCUS, s.stats.focus + (item.restoreFocus ?? 0));
  return { save: s, events };
}

/** Free full recovery, available at the Academy. */
export function rest(save: SaveData): Result {
  const { s, events } = draft(save);
  s.stats.focus = MAX_FOCUS;
  return { save: s, events };
}

/** Start over completely. Keeps nothing (the UI asks for confirmation first). */
export function resetAll(): Result {
  return { save: newSave(), events: [] };
}
