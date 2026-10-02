/**
 * RESTORATION (pure): how much of each world is working again. It is NOT a second progression system: it is a reading of the world effects the
 * player's own work already caused (`PLAY_EFFECTS`, derived from evidence by `deriveWorldState`), so it can never be raised by XP, levels,
 * coins or time, and it is rebuilt identically after a reload. The Summit's end restores everything.
 *
 * The scenes turn the number into light and life (stage `power`), and the milestones into short "the grid reconnects" moments.
 */
import type { SaveData } from '../../core/save';
import { PLAY_EFFECTS } from '../../content/play/effects';
import { hasEffect } from './conditions';

export type RestoreWorld = 'robotics' | 'academy' | 'ballpark' | 'racing';
export const RESTORE_WORLDS: readonly RestoreWorld[] = ['robotics', 'academy', 'ballpark', 'racing'];

/** The object prefix of a world effect (`bay.bolt` -> `bay`) says which world it restores. */
const WORLD_OF_AREA: Record<string, RestoreWorld> = { bay: 'robotics', floor: 'robotics', hall: 'academy', ward: 'academy', arena: 'academy', office: 'ballpark', field: 'ballpark', garage: 'racing' };

const REFS: Record<RestoreWorld, string[]> = { robotics: [], academy: [], ballpark: [], racing: [] };
for (const list of Object.values(PLAY_EFFECTS)) for (const e of list) { const w = WORLD_OF_AREA[e.target.split('.')[0]!]; if (w) REFS[w].push(`${e.target}:${e.action}`); }

/** How many effects a world can still gain. */
export const effectsOf = (w: RestoreWorld): readonly string[] => REFS[w];

/** 0..1: the share of a world's effects the player has caused. The Summit's end restores every world completely. */
export function restoration(save: SaveData, w: RestoreWorld): number {
  if (save.campaign.completedAt) return 1;
  const refs = REFS[w]; if (!refs.length) return 0;
  let n = 0; for (const r of refs) if (hasEffect(save, r)) n++;
  return n / refs.length;
}

/** The whole of Bytehaven: the mean of its four worlds. */
export const restorationTotal = (save: SaveData): number => RESTORE_WORLDS.reduce((a, w) => a + restoration(save, w), 0) / RESTORE_WORLDS.length;

/** A world's stage, 0..4: offline, stirring (25%), running (50%), humming (75%), restored (all of it). A stage change is a milestone worth a moment. */
export const stageOf = (frac: number): 0 | 1 | 2 | 3 | 4 => (frac >= 0.999 ? 4 : frac >= 0.75 ? 3 : frac >= 0.5 ? 2 : frac >= 0.25 ? 1 : 0);

/**
 * How lit a world is for a restoration fraction. An offline Bytehaven is dim but never a wasteland: the displays are dark and the machines are
 * still, yet the place is plainly beautiful and waiting. 1 is fully alive.
 */
export const powerOf = (frac: number): number => 0.2 + 0.8 * Math.max(0, Math.min(1, frac));

/** Offline (0), as authored for the opening's "everything is working" shots (1). */
export const OFFLINE = powerOf(0);
export const ALIVE = 1;

/** Which restoring world a scene belongs to ('hub' and the Summit are the whole of Bytehaven). */
export const restoreWorldOf = (world: string): RestoreWorld | 'all' => (world === 'robotics' || world === 'academy' || world === 'ballpark' || world === 'racing' ? world : 'all');

/** The restoration of a district as the scenes use it: a world, or 'all' (the plaza and the Summit show Bytehaven as a whole). 0..1. */
export function fractionFor(save: SaveData, world: string): number {
  const w = restoreWorldOf(world);
  return w === 'all' ? restorationTotal(save) : restoration(save, w);
}

/** Which districts have reached a new stage since `seen` (stage numbers by district), and the stage each is at now: the moments worth a cinematic. Pure, so it can be tested without a renderer. */
export function stagesReached(seen: Readonly<Record<string, number>>, save: SaveData): { world: RestoreWorld; stage: 1 | 2 | 3 | 4 }[] {
  const out: { world: RestoreWorld; stage: 1 | 2 | 3 | 4 }[] = [];
  for (const w of RESTORE_WORLDS) { const st = stageOf(restoration(save, w)); if (st > (seen[w] ?? 0)) out.push({ world: w, stage: st as 1 | 2 | 3 | 4 }); }
  return out;
}
