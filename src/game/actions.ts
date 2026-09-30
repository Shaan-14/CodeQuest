/**
 * All game state transitions. Every function is PURE: (save, ...args) => { save, events }.
 * The input save is never mutated. The store (store.ts) persists the result and shows the events.
 * Keeping this free of UI and storage makes the rules (XP, unlocks, evidence) unit-testable.
 */
import { getChallenge, getLesson } from '../content';
import { items, quests } from '../content/world';
import { areas } from '../content/world';
import { newSave, type ChallengeProgress, type SaveData } from '../core/save';
import { newlyEarned } from './achievements';
import type { GameEvent } from './events';
import { levelFromXp, rewardFor } from './progression';
import { isAreaUnlocked } from './world';
import { buildEvidence, failuresSinceLastPass } from './evidence';
import { applyDiagnosis } from './weakness';
import { ensureRequiredPlan, requiredTraining, returnToFor } from './training';
import { FAILURE_LEVELS, HINTED_PASS_LOSS, failureLevelOf, focusReady, loseFocus } from './focus';
import { resolveOnPass } from './weakness';
import type { EvidenceSource, FailureDetail } from '../learning/mastery';

export { failuresSinceLastPass };

export interface Result {
  save: SaveData;
  events: GameEvent[];
}

const now = () => new Date().toISOString();

/** Copy so callers' saves are never mutated. */
export function draft(save: SaveData): { s: SaveData; events: GameEvent[] } {
  return { s: structuredClone(save), events: [] };
}

/** Recompute derived unlocks/achievements. Call at the end of any action that could change them. */
export function settle(s: SaveData, events: GameEvent[]): void {
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

export function gain(s: SaveData, events: GameEvent[], xp: number, coins: number, note?: string): void {
  const before = levelFromXp(s.stats.xp);
  s.stats.xp += xp;
  s.stats.coins += coins;
  if (xp > 0) events.push({ type: 'xp', amount: xp, note });
  if (coins > 0) events.push({ type: 'coins', amount: coins });
  const after = levelFromXp(s.stats.xp);
  if (after > before) events.push({ type: 'levelUp', level: after });
}

export function progressFor(s: SaveData, challengeId: string): ChallengeProgress {
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
  if (!focusReady(s)) return { save: s, events }; // not ready: no attempt, so no hints either
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

/** The player opened a reference-manual entry while working on a challenge (research behaviour). */
export function recordLookup(save: SaveData, challengeId: string): Result {
  const { s, events } = draft(save);
  const p = progressFor(s, challengeId);
  p.lookups = (p.lookups ?? 0) + 1;
  return { save: s, events };
}

/**
 * A graded submission. Always records an EvidenceRecord (pass OR fail). On the first pass pays
 * XP/coins; a later, less-assisted pass pays only the difference, so replaying with fewer hints
 * is rewarded but grinding the same solve is not.
 */
export interface SubmitOptions {
  detail?: FailureDetail;
  source?: EvidenceSource;
}

export function submitChallenge(save: SaveData, challengeId: string, passed: boolean, timeMs: number, code: string, opts: SubmitOptions = {}): Result {
  const { s, events } = draft(save);
  const c = getChallenge(challengeId);
  if (!c) return { save: s, events };
  // THE FOCUS GATE (enforced here, not only in the UI): below 100 Focus the player is not ready to attempt anything graded.
  // Required training holds the curriculum too: the two always agree (training is what restores Focus).
  if (!focusReady(s) || requiredTraining(s)) return { save: s, events };
  const p = progressFor(s, challengeId);
  p.attempts++;
  p.timeMs += timeMs;
  p.code = code;

  const record = buildEvidence(s, c, { passed, at: now(), timeMs: p.timeMs, hintsUsed: p.hintsUsed, lookups: p.lookups ?? 0, attemptNumber: p.attempts, source: opts.source, detail: opts.detail });
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
  }
  // Phase 4: resolve superseded weaknesses, then diagnose this attempt.
  resolveOnPass(s, events, record);
  // Only real attempts at lesson work cost Focus: guided (learning-mode) exercises just give feedback, and Practice Yard
  // attempts are free. A failure, or a pass that needed hints, is a setback that only training repairs.
  const setback = (opts.source ?? 'lesson') === 'lesson' && c.mode !== 'learning' && (!passed || p.hintsUsed > 0);
  const level = failureLevelOf(c);
  const weakness = applyDiagnosis(s, events, c, record, setback);
  if (setback && weakness) {
    weakness.required = true;
    weakness.focusLevel = Math.max(weakness.focusLevel ?? 0, level);
    loseFocus(s, events, passed ? HINTED_PASS_LOSS : FAILURE_LEVELS[level].loss);
    ensureRequiredPlan(s, events, weakness, returnToFor(s, c));
  }
  settle(s, events);
  return { save: s, events };
}

/** Player has moved to a later step of a lesson. */
export function advanceStep(save: SaveData, lessonId: string, stepIndex: number): Result {
  const { s, events } = draft(save);
  if (requiredTraining(s)) return { save: s, events };
  const lp = (s.learning.lessons[lessonId] ??= { stepIndex: 0, completed: false });
  lp.stepIndex = Math.max(lp.stepIndex, stepIndex);
  return { save: s, events };
}

/** Finish a lesson: pays the lesson XP once, advances quests, unlocks areas. */
export function completeLesson(save: SaveData, lessonId: string): Result {
  const { s, events } = draft(save);
  const lesson = getLesson(lessonId);
  if (!lesson) return { save: s, events };
  // Required training holds every lesson's completion until it is done (rule enforced here, not only in the UI).
  if (!s.learning.lessons[lessonId]?.completed && requiredTraining(s)) return { save: s, events };
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

/** Start over completely. Keeps nothing (the UI asks for confirmation first). */
export function resetAll(): Result {
  return { save: newSave(), events: [] };
}
