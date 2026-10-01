/**
 * PLAY ACTIONS: what the playable 3D world may write to the save. Conversations, inspections, where the player stands and view settings,
 * all as pure `(save, ...) => { save, events }` like every other action. Nothing here grants skill: the world a player's CODE changed is
 * derived from evidence, never stored, so none of these functions can repair a robot.
 */
import type { PlayState, SaveData } from '../core/save';
import { acceptQuest, gain, settle, type Result } from './actions';
import { getQuest, objectiveDone, questStatus } from './quests';
import type { GameEvent } from './events';

const draftOf = (save: SaveData): { s: SaveData; events: GameEvent[] } => ({ s: structuredClone(save), events: [] });
const now = () => new Date().toISOString();

/** The player spoke to an NPC. Counts conversations (the first one is "meeting"). */
export function recordTalk(save: SaveData, npcId: string): Result {
  const { s, events } = draftOf(save);
  const n = (s.play.talked[npcId] ?? 0) + 1;
  s.play.talked[npcId] = n;
  events.push({ type: 'talked', npc: npcId, first: n === 1 });
  settle(s, events);
  return { save: s, events };
}

/** The player examined or used something (a fact quest steps can ask for). Only the first time is an event. */
export function recordSeen(save: SaveData, id: string): Result {
  const { s, events } = draftOf(save);
  if (!s.play.seen[id]) { s.play.seen[id] = now(); events.push({ type: 'inspected', id }); }
  settle(s, events);
  return { save: s, events };
}

/** Remember where the player stands so a reload resumes there. Rate-limited by the caller. */
export function setPosition(save: SaveData, scene: string, x: number, z: number, ry: number): Result {
  const { s, events } = draftOf(save);
  s.play.scene = scene;
  s.play.pos = { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100, ry: Math.round(ry * 100) / 100 };
  return { save: s, events };
}

/** Arriving through a door: the position is the door's spawn point, not wherever the player stood before. */
export function enterScene(save: SaveData, scene: string, spawn: { x: number; z: number; ry: number }): Result {
  return setPosition(save, scene, spawn.x, spawn.z, spawn.ry);
}

export function setPlaySettings(save: SaveData, patch: Partial<PlayState['settings']>): Result {
  const { s, events } = draftOf(save);
  s.play.settings = { ...s.play.settings, ...patch };
  return { save: s, events };
}

/** Coins and XP for a world event that is its own reward (e.g. finishing a simulated game). Never changes mastery. */
export function worldReward(save: SaveData, xp: number, coins: number, note: string): Result {
  const { s, events } = draftOf(save);
  gain(s, events, xp, coins, note);
  settle(s, events);
  return { save: s, events };
}

/**
 * Story quests are taken up by DOING the work, not by finding the person who hands them out: the first time a step of an available quest is
 * done in the world, the quest is accepted on the spot (and completes at once if that was its last step). Talking to the quest giver stays
 * possible and optional. Repeats until nothing more can start, because finishing one quest can make the next available.
 */
export function acceptWorkedQuests(save: SaveData, questIds: readonly string[]): Result {
  let cur = save;
  const events: GameEvent[] = [];
  for (let guard = 0; guard < questIds.length + 1; guard++) {
    const q = questIds.map(getQuest).find((x) => x && questStatus(cur, x) === 'available' && x.objectives.some((o) => objectiveDone(cur, o)));
    if (!q) break;
    const r = acceptQuest(cur, q.id);
    cur = r.save; events.push(...r.events);
  }
  return { save: cur, events };
}
