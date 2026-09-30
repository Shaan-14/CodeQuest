/**
 * QUEST MARKERS (pure): which things in a scene the player should look at next. A marker is a hint about WHERE the story continues (a
 * glowing "!" over a person who has a quest, a pulse on the console that holds the next step); it never says how to solve anything.
 */
import type { SaveData } from '../../core/save';
import { nextObjective, questStatus } from '../../game/quests';
import { quests } from '../../content/world';
import type { QuestObjective } from '../../content/schema';
import { conversationWith } from './dialogue';
import type { Npc3D } from './dialogue';
import type { Interactable, SceneDef } from './sceneTypes';

export type MarkerKind = 'offer' | 'step';
export interface Marker { id: string; kind: MarkerKind; x: number; z: number }

/** Does this objective point at this interactable? (talk → the NPC, inspect → the object, challenge/effect/lesson → the station whose lessons lead there.) */
function pointsAt(o: QuestObjective, it: Interactable, stationMatches: (station: string, o: QuestObjective) => boolean): boolean {
  const a = it.action;
  switch (o.kind ?? 'lesson') {
    case 'talk': return a.type === 'talk' && a.npc === (o as { ref: string }).ref;
    case 'inspect': return a.type === 'inspect' && a.id === (o as { ref: string }).ref;
    default: return a.type === 'terminal' && stationMatches(a.station, o);
  }
}

export function markersFor(save: SaveData, scene: SceneDef, interactables: readonly Interactable[], cast: (id: string) => Npc3D | undefined, stationMatches: (station: string, o: QuestObjective) => boolean): Marker[] {
  const out: Marker[] = [];
  const steps: QuestObjective[] = [];
  for (const q of quests) {
    const st = questStatus(save, q);
    if (st === 'accepted' || st === 'in-progress') { const n = nextObjective(save, q); if (n) steps.push(n); }
  }
  for (const it of interactables) {
    if (it.action.type === 'talk') {
      const npc = cast(it.action.npc);
      if (npc && conversationWith(save, npc).canOffer) { out.push({ id: it.id, kind: 'offer', x: it.x, z: it.z }); continue; }
    }
    if (steps.some((o) => pointsAt(o, it, stationMatches))) out.push({ id: it.id, kind: 'step', x: it.x, z: it.z });
  }
  void scene;
  return out;
}
