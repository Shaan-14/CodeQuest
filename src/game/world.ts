import { areas } from '../content/world';
import type { Area, Quest } from '../content/schema';
import type { SaveData } from '../core/save';

export function isAreaUnlocked(area: Area, save: SaveData): boolean {
  const rule = area.lock;
  switch (rule.type) {
    case 'none':
      return true;
    case 'questAccepted':
      return !!save.quests[rule.questId];
    case 'questComplete':
      return save.quests[rule.questId]?.status === 'complete';
    case 'lesson':
      return !!save.learning.lessons[rule.lessonId]?.completed;
    case 'future':
      return false;
  }
}

export function lockReason(area: Area): string {
  return area.lock.type === 'none' ? '' : area.lock.reason;
}

export function areaIsFuture(area: Area): boolean {
  return area.lock.type === 'future';
}

/** Ids of areas that are unlocked by the current state. */
export function unlockedAreaIds(save: SaveData): string[] {
  return areas.filter((a) => isAreaUnlocked(a, save)).map((a) => a.id);
}

/** A quest is offered once the quest it `requires` (story order) is complete. */
export function questOffered(quest: Quest, save: SaveData): boolean {
  return !quest.requires || save.quests[quest.requires]?.status === 'complete';
}
