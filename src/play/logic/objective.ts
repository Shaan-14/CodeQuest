/**
 * THE CURRENT OBJECTIVE (pure): what the player should do next and WHERE, from the save and the place they stand in. It answers "what now and
 * where is it?" without ever saying how to solve anything.
 *
 *   hub (the plaza)     -> nothing: the player chooses a world, so no world's lesson is announced here.
 *   a learning world    -> that world's own next step, read from the learning record: a required training plan, then a review that is due
 *                          there, then the next open lesson of the world (`nextLesson`, the same ordering the classic game uses), then an
 *                          in-world activity the story asks for (win a game, drive a lap), and when all of that is done, a plain "all done".
 *   anywhere            -> a required training plan always comes first (Focus below 100 means the player is not ready).
 *
 * The engine turns it into a trail on the ground, a beam over the place and a compass; the HUD turns it into a line of text. Cross-scene routes
 * go door by door (a trail to the right exit, then on). Leaving a world drops that world's objective: it is recomputed from where the player is.
 */
import type { SaveData } from '../../core/save';
import { challenges, lessons } from '../../content';
import { quests } from '../../content/world';
import type { QuestObjective } from '../../content/schema';
import { stationOfLesson } from '../../content/play/stations';
import { worldOfScene, type World3D } from '../../content/play/worlds3d';
import { trackOfLessonId, worldOfTrack, type Track } from '../../content/worlds';
import { nextObjective, questStatus } from '../../game/quests';
import { reviewsDue } from '../../game/retention';
import { lessonTeaching } from '../../game/graph';
import { lessonStatus } from '../../game/lessons';
import { holds } from './conditions';
import type { Npc3D } from './dialogue';
import type { Interactable, SceneDef } from './sceneTypes';

export interface Objective {
  /** `choose`: the hub, the player picks; `free`: everything here is done. Neither has a place to walk to. */
  kind: 'lesson' | 'review' | 'activity' | 'training' | 'choose' | 'free';
  /** Heading: what kind of errand this is, or the lesson. */
  title: string;
  /** What to do, in plain words. */
  text: string;
  /** Where in the world the player must go. Empty for `choose` and `free`. */
  sceneId: string;
  x: number; z: number;
  /** The place or person it points to ("Bolt-7 Repair Console"). */
  label: string;
  questId?: string;
  objectiveId?: string;
  lessonId?: string;
}

export interface ObjectiveDeps {
  scenes: readonly SceneDef[];
  getNpc?(id: string): Npc3D | undefined;
  stationMatches(station: string, o: QuestObjective): boolean;
  /** Is a training plan holding the player back (Focus below 100 after a failure)? */
  trainingOwed: boolean;
  /** Clock for reviews (tests inject one). */
  now?: number;
}

const NOWHERE = { sceneId: '', x: 0, z: 0 } as const;

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

/** The terminal that serves a lesson, if it stands in this world. */
function consoleFor(lessonId: string, world: World3D, deps: ObjectiveDeps, save: SaveData): { sc: SceneDef; it: Interactable } | undefined {
  const st = stationOfLesson(lessonId);
  if (!st || !world.scenes.includes(st.scene)) return undefined;
  const sc = deps.scenes.find((s) => s.id === st.scene);
  const it = sc?.interactables.find((i) => i.action.type === 'terminal' && i.action.station === st.id && holds(save, i.when));
  return sc && it ? { sc, it } : undefined;
}

const tracksOf = (w: World3D): Track[] => w.tracks as Track[];

/** The player's current objective, or null when there is nothing to guide (the plaza; or a world with nothing to say). */
export function objectiveFor(save: SaveData, fromScene: string, deps: ObjectiveDeps): Objective | null {
  const live = (sc: SceneDef) => sc.interactables.filter((i) => holds(save, i.when));
  if (deps.trainingOwed) {
    for (const sc of deps.scenes) for (const it of live(sc)) if (it.action.type === 'panel' && it.action.panel === 'training') return { kind: 'training', title: 'Train first', text: 'You are not ready to try again: your Focus is below 100. Train in the Simulation Room.', sceneId: sc.id, x: it.x, z: it.z, label: it.label };
  }
  const world = worldOfScene(fromScene);
  if (!world) return null;
  if (world.id === 'hub') return { kind: 'choose', title: 'Choose your path', text: 'Every gate leads somewhere to learn. Pick the one you want: nothing here is asking for you.', ...NOWHERE, label: '' };
  if (world.id === 'summit') {
    for (const sc of deps.scenes.filter((s) => world.scenes.includes(s.id))) for (const it of live(sc)) if (it.action.type === 'boss') return { kind: 'activity', title: 'The Summit Trial', text: 'The Great Outage is waiting. Choose how you will face it.', sceneId: sc.id, x: it.x, z: it.z, label: it.label };
    return null;
  }
  const tracks = tracksOf(world);
  const now = deps.now ?? Date.now();

  // a review that is due for something this world teaches: say why, and point at the terminal where it was learned
  const due = reviewsDue(save, now, (id) => challenges.find((c) => c.id === id)?.skillIds);
  for (const d of due) {
    const l = lessonTeaching(d.skill.id); if (!l || !tracks.includes(trackOfLessonId(l.id))) continue;
    const c = consoleFor(l.id, world, deps, save); if (!c) continue;
    return { kind: 'review', title: `Review: ${d.skill.title}`, text: d.reason, sceneId: c.sc.id, x: c.it.x, z: c.it.z, label: c.it.label, lessonId: l.id };
  }

  // the next lesson, in the order the learning system keeps them (the same list and the same "open" test as `nextLesson`), that a terminal in
  // this world can open. Nothing about the order lives here: finishing a lesson (or being sent to train) is all it takes to move it on.
  for (const t of tracks) {
    const pick = lessons.find((l) => trackOfLessonId(l.id) === t && (lessonStatus(save, l) === 'available' || lessonStatus(save, l) === 'in-progress') && consoleFor(l.id, world, deps, save));
    if (!pick) continue;
    const c = consoleFor(pick.id, world, deps, save)!;
    const started = lessonStatus(save, pick) === 'in-progress';
    return { kind: 'lesson', title: pick.title, text: `${started ? 'Pick up where you left off' : 'Next up'} at ${c.it.label}: ${pick.blurb}`, sceneId: c.sc.id, x: c.it.x, z: c.it.z, label: c.it.label, lessonId: pick.id };
  }

  // what the story asks for in this world beyond lessons (win a game, drive a lap)
  for (const q of quests) {
    const st = questStatus(save, q);
    if (st !== 'accepted' && st !== 'in-progress') continue;
    const o = nextObjective(save, q); if (!o) continue;
    for (const sc of deps.scenes.filter((s) => world.scenes.includes(s.id))) for (const it of live(sc)) if (pointsAt(o, it, deps)) return { kind: 'activity', title: q.title, text: o.text, sceneId: sc.id, x: it.x, z: it.z, label: it.label, questId: q.id, objectiveId: o.id };
  }

  const left = tracks.some((t) => lessons.some((l) => trackOfLessonId(l.id) === t && !save.learning.lessons[l.id]?.completed));
  return { kind: 'free', title: 'All caught up here', text: left ? `You have done everything ${world.name} offers right now. More of ${tracks.map((t) => worldOfTrack(t).name).join(' and ')} waits behind other gates and in the Practice Yard.` : `You have finished everything ${world.name} teaches. Walk back to the plaza for another path, or open the map (M).`, ...NOWHERE, label: '' };
}

export interface Waypoint { x: number; z: number; label: string; /** True when this is a doorway on the way, not the destination. */ via: boolean; /** Scenes still to cross, including the destination. */ hops: number; toScene?: string }

/** Where to walk now: the objective itself if it is in this scene, otherwise the doorway that leads toward it. */
export function nextWaypoint(obj: Objective, currentScene: string, scenes: readonly SceneDef[]): Waypoint | null {
  if (!obj.sceneId) return null;
  if (obj.sceneId === currentScene) return { x: obj.x, z: obj.z, label: obj.label, via: false, hops: 0 };
  const r = route(scenes, currentScene, obj.sceneId); if (!r || r.length < 2) return null;
  const cur = scenes.find((s) => s.id === currentScene), exit = cur?.exits.find((e) => e.to === r[1]); if (!exit) return null;
  const toScene = scenes.find((s) => s.id === r[1]);
  return { x: exit.x, z: exit.z, label: `to ${toScene?.title ?? exit.label}`, via: true, hops: r.length - 1, toScene: r[1] };
}
