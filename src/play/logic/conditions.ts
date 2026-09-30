/** Conditions on a save (pure). Used by dialogue, interactables and scene logic so "what is true of the world now" has one definition. */
import type { SaveData } from '../../core/save';
import { getQuest, questStatus } from '../../game/quests';
import { deriveWorldState, type WorldState } from '../../game/worldEvents';
import type { Condition } from './sceneTypes';

// The derived world is rebuilt from the whole evidence log, so keep one per save object (saves are immutable once applied).
const worldCache = new WeakMap<SaveData, WorldState>();
export function worldOf(save: SaveData): WorldState {
  let w = worldCache.get(save);
  if (!w) { w = deriveWorldState(save); worldCache.set(save, w); }
  return w;
}

/** Has code caused `target:action` in the world? */
export function hasEffect(save: SaveData, ref: string): boolean {
  const [target, action] = ref.split(':');
  return !!worldOf(save)[target!]?.actions.includes(action ?? '');
}

export function holds(save: SaveData, c: Condition | undefined): boolean {
  if (!c) return true;
  if (c.quest) { const q = getQuest(c.quest.id); if (!q || !c.quest.status.includes(questStatus(save, q))) return false; }
  if (c.effect && !hasEffect(save, c.effect)) return false;
  if (c.notEffect && hasEffect(save, c.notEffect)) return false;
  if (c.lessonDone && !save.learning.lessons[c.lessonDone]?.completed) return false;
  if (c.met && !((save.play.talked[c.met] ?? 0) > 0)) return false;
  if (c.notMet && (save.play.talked[c.notMet] ?? 0) > 0) return false;
  if (c.seen && !save.play.seen[c.seen]) return false;
  if (c.notSeen && save.play.seen[c.notSeen]) return false;
  if (c.bossPassed && !save.bosses[c.bossPassed]?.passedAt) return false;
  if (c.not && holds(save, c.not)) return false;
  if (c.any && !c.any.some((x) => holds(save, x))) return false;
  return true;
}
