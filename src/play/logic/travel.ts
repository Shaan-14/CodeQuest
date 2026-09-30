/** TRAVEL (pure): where a door leads, and whether the player may go through it yet. */
import type { SaveData } from '../../core/save';
import { areas } from '../../content/world';
import { areaGaps } from '../../game/graph';
import { isAreaUnlocked } from '../../game/world';
import type { Exit, SceneDef } from './sceneTypes';

export interface TravelCheck { ok: boolean; /** Plain reason when closed. */ reason: string; /** The learning-graph area that explains what is missing. */ areaId?: string }

/** A door gated by an area uses that area's unlock rule (the skill graph stays the only authority). */
export function canUseExit(save: SaveData, exit: Pick<Exit, 'area'>): TravelCheck {
  if (!exit.area) return { ok: true, reason: '' };
  const area = areas.find((a) => a.id === exit.area);
  if (!area) return { ok: true, reason: '' };
  if (isAreaUnlocked(area, save)) return { ok: true, reason: '' };
  const gaps = areaGaps(save, area);
  return { ok: false, areaId: area.id, reason: gaps.length ? `Prerequisite required: ${gaps.slice(0, 3).map((g) => g.title).join(', ')}` : 'Not open yet.' };
}

/** Every spawn a door can lead to actually exists (used by content tests). */
export const spawnExists = (scene: SceneDef, key: string | undefined): boolean => key === undefined ? true : !!scene.spawns[key];
