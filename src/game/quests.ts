/**
 * QUESTS: one place that says what state a quest is in and moves it forward.
 *
 *   unavailable -> available -> accepted -> in-progress -> completed
 *
 * `unavailable`: the quest it follows is not finished (the player is told which one). `available`: it can be accepted now, and only now is an
 * "Accept" button honest. `accepted`: taken, nothing done yet. `in-progress`: at least one objective is done. `completed`: every objective is
 * done and the reward was paid (once). The state is DERIVED from the save (saved quest entry + evidence + play facts), so it survives reloads
 * and cannot disagree with what the player actually did. Progress never depends on XP or levels and is never proof of mastery.
 */
import { getAnyChallenge, getLesson } from '../content';
import { quests } from '../content/world';
import type { Quest, QuestObjective } from '../content/schema';
import type { SaveData } from '../core/save';
import type { GameEvent } from './events';
import { deriveWorldState } from './worldEvents';

export type QuestStatus = 'unavailable' | 'available' | 'accepted' | 'in-progress' | 'completed';

export const getQuest = (id: string): Quest | undefined => quests.find((q) => q.id === id);

/** Has the player done this step? */
export function objectiveDone(save: SaveData, o: QuestObjective): boolean {
  switch (o.kind ?? 'lesson') {
    case 'lesson': return !!save.learning.lessons[(o as { lessonId: string }).lessonId]?.completed;
    case 'talk': return (save.play.talked[(o as { ref: string }).ref] ?? 0) > 0;
    case 'inspect': return !!save.play.seen[(o as { ref: string }).ref];
    case 'challenge': {
      const ref = (o as { ref: string }).ref;
      return save.evidence.some((r) => r.passed && r.executed && (r.challengeId === ref || r.objectiveId === ref));
    }
    case 'effect': {
      const [target, action] = (o as { ref: string }).ref.split(':');
      return !!deriveWorldState(save)[target!]?.actions.includes(action ?? '');
    }
  }
}

/** The steps the player has finished, for "3 of 5". */
export const questProgress = (save: SaveData, q: Quest): { done: number; total: number } => ({ done: q.objectives.filter((o) => objectiveDone(save, o)).length, total: q.objectives.length });

/** Why a quest cannot be accepted yet, in plain words ('' when it can). */
export function unavailableReason(save: SaveData, q: Quest): string {
  if (q.requires && save.quests[q.requires]?.status !== 'complete') return `Finish “${getQuest(q.requires)?.title ?? q.requires}” first.`;
  return '';
}

export function questStatus(save: SaveData, q: Quest): QuestStatus {
  const st = save.quests[q.id];
  if (st?.status === 'complete') return 'completed';
  if (st) return questProgress(save, q).done > 0 ? 'in-progress' : 'accepted';
  return unavailableReason(save, q) ? 'unavailable' : 'available';
}

export const STATUS_LABEL: Record<QuestStatus, string> = { unavailable: 'Not available yet', available: 'Available', accepted: 'Accepted', 'in-progress': 'In progress', completed: 'Completed' };

/** The next unfinished objective of an accepted quest (what the player should do now). */
export const nextObjective = (save: SaveData, q: Quest): QuestObjective | undefined => q.objectives.find((o) => !objectiveDone(save, o));

/** Lesson titles and other labels an objective can be shown with. */
export const objectiveHint = (o: QuestObjective): string => ((o.kind ?? 'lesson') === 'lesson' ? (getLesson((o as { lessonId: string }).lessonId)?.title ?? '') : (o.kind === 'challenge' ? (getAnyChallenge((o as { ref: string }).ref)?.title ?? '') : ''));

/**
 * Complete every accepted quest whose objectives are all done. Pays the reward once and emits the events. Called after anything that can
 * finish an objective (a lesson, a passed challenge, a conversation, an inspection). `gain` and inventory are injected to avoid a cycle with actions.
 */
export function advanceQuests(s: SaveData, events: GameEvent[], pay: (xp: number, coins: number, note: string) => void, now: () => string): void {
  for (const q of quests) {
    const state = s.quests[q.id];
    if (state?.status !== 'active' || !q.objectives.every((o) => objectiveDone(s, o))) continue;
    state.status = 'complete';
    state.completedAt = now();
    events.push({ type: 'questComplete', id: q.id });
    pay(q.reward.xp, q.reward.coins, `Quest: ${q.title}`);
    for (const id of q.reward.items ?? []) {
      s.inventory[id] = (s.inventory[id] ?? 0) + 1;
      events.push({ type: 'item', id });
    }
  }
}
