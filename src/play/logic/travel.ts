/** TRAVEL (pure): where a door leads, and whether the player may go through it yet. */
import type { SaveData } from '../../core/save';
import { areas } from '../../content/world';
import { areaGaps } from '../../game/graph';
import { isAreaUnlocked } from '../../game/world';
import type { SkillReq } from '../../content/schema';
import { gapsFor } from '../../game/graph';
import type { Exit, SceneDef } from './sceneTypes';

export interface TravelCheck { ok: boolean; /** Plain reason when closed. */ reason: string; /** What the player must show: the prerequisite panel lists exactly what is missing. */ reqs?: SkillReq[]; title?: string }

/** A door gated by an area uses that area's unlock rule (the skill graph stays the only authority). */
export function canUseExit(save: SaveData, exit: Pick<Exit, 'area' | 'requires' | 'reason' | 'label'>): TravelCheck {
  if (exit.requires?.length) {
    const gaps = gapsFor(save, exit.requires);
    return gaps.length ? { ok: false, reqs: exit.requires, title: exit.label, reason: exit.reason ?? `Prerequisite required: ${gaps.slice(0, 3).map((g) => g.title).join(', ')}` } : { ok: true, reason: '' };
  }
  if (!exit.area) return { ok: true, reason: '' };
  const area = areas.find((a) => a.id === exit.area);
  if (!area) return { ok: true, reason: '' };
  if (isAreaUnlocked(area, save)) return { ok: true, reason: '' };
  const gaps = areaGaps(save, area);
  return { ok: false, reqs: area.lock.type === 'skills' ? area.lock.requires : undefined, title: area.name, reason: gaps.length ? `Prerequisite required: ${gaps.slice(0, 3).map((g) => g.title).join(', ')}` : 'Not open yet.' };
}

/** Every spawn a door can lead to actually exists (used by content tests). */
export const spawnExists = (scene: SceneDef, key: string | undefined): boolean => key === undefined ? true : !!scene.spawns[key];
