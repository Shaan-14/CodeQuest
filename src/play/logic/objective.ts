/**
 * THE CURRENT OBJECTIVE (pure): what the player should do next and WHERE, from the save alone. It answers "what now and where is it?" without
 * ever saying how to solve anything: a required training plan outranks everything (the player is not ready), then the next step of an accepted
 * quest, then the nearest person with work to give. The engine turns it into a trail on the ground, a beam over the place and a compass; the
 * HUD turns it into a line of text. Cross-world routes go door by door (a trail to the right exit, then on).
 */
import type { SaveData } from '../../core/save';
import { quests } from '../../content/world';
import type { QuestObjective } from '../../content/schema';
import { nextObjective, questStatus } from '../../game/quests';
import { holds } from './conditions';
import { conversationWith, type Npc3D } from './dialogue';
import type { Interactable, SceneDef } from './sceneTypes';

export interface Objective {
  kind: 'quest' | 'offer' | 'training';
  /** Heading: the quest's title, or what kind of errand this is. */
  title: string;
  /** What to do, in the quest's own words. */
  text: string;
  sceneId: string;
  /** Where in that scene the player must stand. */
  x: number; z: number;
  /** The place or person it points to ("Bolt-7 Repair Console", "Mentor Juno"). */
  label: string;
  questId?: string;
  objectiveId?: string;
}

export interface ObjectiveDeps {
  scenes: readonly SceneDef[];
  getNpc(id: string): Npc3D | undefined;
  stationMatches(station: string, o: QuestObjective): boolean;
  /** Is a training plan holding the player back (Focus below 100 after a failure)? */
  trainingOwed: boolean;
}

function pointsAt(o: QuestObjective, it: Interactable, deps: ObjectiveDeps): boolean {
  const a = it.action;
  switch (o.kind ?? 'lesson') {
    case 'talk': return a.type === 'talk' && a.npc === (o as { ref: string }).ref;
    case 'inspect': return a.type === 'inspect' && a.id === (o as { ref: string }).ref;
    default: return a.type === 'terminal' && deps.stationMatches(a.station, o);
  }
}

/** Scene ids in order from `from` to `to` through the doors, or null. */
export function route(scenes: readonly SceneDef[], from: string, to: string): string[] | null {
  if (from === to) return [from];
  const by = new Map(scenes.map((s) => [s.id, s])); const prev = new Map<string, string>(); const q = [from]; prev.set(from, '');
  while (q.length) {
    const id = q.shift()!;
    for (const e of by.get(id)?.exits ?? []) if (!prev.has(e.to) && by.has(e.to)) { prev.set(e.to, id); if (e.to === to) { const out = [to]; for (let c = id; c; c = prev.get(c)!) out.unshift(c); return out; } q.push(e.to); }
  }
  return null;
}

/** The player's current objective, or null when they are free to explore. `fromScene` breaks ties between offers by distance (fewest doors). */
export function objectiveFor(save: SaveData, fromScene: string, deps: ObjectiveDeps): Objective | null {
  const live = (sc: SceneDef) => sc.interactables.filter((i) => holds(save, i.when));
  if (deps.trainingOwed) {
    for (const sc of deps.scenes) for (const it of live(sc)) if (it.action.type === 'panel' && it.action.panel === 'training') return { kind: 'training', title: 'Train first', text: 'You are not ready to try again: your Focus is below 100. Train in the Simulation Room.', sceneId: sc.id, x: it.x, z: it.z, label: it.label };
  }
  for (const q of quests) {
    const st = questStatus(save, q);
    if (st !== 'accepted' && st !== 'in-progress') continue;
    const o = nextObjective(save, q); if (!o) continue;
    for (const sc of deps.scenes) for (const it of live(sc)) if (pointsAt(o, it, deps)) return { kind: 'quest', title: q.title, text: o.text, sceneId: sc.id, x: it.x, z: it.z, label: it.label, questId: q.id, objectiveId: o.id };
  }
  // nobody has asked anything of the player yet: the nearest person with work to give
  let best: { obj: Objective; hops: number } | null = null;
  for (const sc of deps.scenes) for (const it of live(sc)) {
    if (it.action.type !== 'talk') continue;
    const npc = deps.getNpc(it.action.npc); if (!npc) continue;
    const conv = conversationWith(save, npc); if (!conv.canOffer) continue;
    const r = route(deps.scenes, fromScene, sc.id); if (!r) continue;
    if (!best || r.length < best.hops) best = { hops: r.length, obj: { kind: 'offer', title: 'Someone needs help', text: `Talk to ${npc.name}: ${npc.role.toLowerCase()}, with work for you.`, sceneId: sc.id, x: it.x, z: it.z, label: npc.name } };
  }
  return best?.obj ?? null;
}

export interface Waypoint { x: number; z: number; label: string; /** True when this is a doorway on the way, not the destination. */ via: boolean; /** Scenes still to cross, including the destination. */ hops: number; toScene?: string }

/** Where to walk now: the objective itself if it is in this scene, otherwise the doorway that leads toward it. */
export function nextWaypoint(obj: Objective, currentScene: string, scenes: readonly SceneDef[]): Waypoint | null {
  if (obj.sceneId === currentScene) return { x: obj.x, z: obj.z, label: obj.label, via: false, hops: 0 };
  const r = route(scenes, currentScene, obj.sceneId); if (!r || r.length < 2) return null;
  const cur = scenes.find((s) => s.id === currentScene), exit = cur?.exits.find((e) => e.to === r[1]); if (!exit) return null;
  const toScene = scenes.find((s) => s.id === r[1]);
  return { x: exit.x, z: exit.z, label: `to ${toScene?.title ?? exit.label}`, via: true, hops: r.length - 1, toScene: r[1] };
}
