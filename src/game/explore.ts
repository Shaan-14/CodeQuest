/**
 * EXPLORATION: which learning worlds the player has entered, and where they were last. Purely navigational (it powers "you are here" and
 * "continue where you left off" on the map); it never unlocks anything and is never read by the rules that decide access or mastery.
 */
import { worlds, worldOfArea, type Track } from '../content/worlds';
import type { SaveData } from '../core/save';
import { draft, type Result } from './actions';

/** Record that the player entered the world that owns `areaId` (no-op for areas that are not learning worlds). */
export function visitArea(save: SaveData, areaId: string): Result {
  const { s, events } = draft(save);
  const w = worldOfArea(areaId);
  if (!w) return { save: s, events };
  if (!s.explore.visited.includes(w.track)) s.explore.visited.push(w.track);
  s.explore.last = w.track;
  return { save: s, events };
}

export const visited = (save: SaveData, track: Track): boolean => save.explore.visited.includes(track);
/** Foundation worlds the player has never entered: suggested on the map as places to start. */
export const unvisitedFoundations = (save: SaveData) => worlds.filter((w) => w.foundation && !visited(save, w.track));
export const lastWorld = (save: SaveData) => worlds.find((w) => w.track === save.explore.last);
