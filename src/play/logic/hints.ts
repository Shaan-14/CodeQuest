/**
 * Progress-aware remarks (pure): which one thing, if any, an NPC adds after their usual line. Reads the same journal and training record the Quest
 * Journal and Skills view read; every remark in content/play/hints.ts is said once (it is marked seen when heard).
 */
import { HINTS, type Hint } from '../../content/play/hints';
import { trackOfSkillId, worldOfTrack, worlds, type Track } from '../../content/worlds';
import type { SaveData } from '../../core/save';
import { journalFor } from '../../game/journal';

export interface WorldStanding { strong: boolean; begun: boolean; trouble: boolean }

/** Where the player stands in every world, from evidence only. */
export function standings(save: SaveData): Record<Track, WorldStanding> {
  const out = {} as Record<Track, WorldStanding>;
  const troubled = new Set<Track>(save.training.weaknesses.filter((w) => w.status !== 'resolved').map((w) => trackOfSkillId(w.skillIds[0] ?? '')));
  for (const j of journalFor(save)) out[j.track] = { strong: j.skills.counts.developing + j.skills.counts.demonstrated >= 2, begun: j.begun, trouble: troubled.has(j.track) };
  return out;
}

export interface Remark { id: string; text: string }

export function remarkFor(save: SaveData, npcId: string, hints: readonly Hint[] = HINTS): Remark | undefined {
  const st = standings(save);
  const strongN = worlds.filter((w) => st[w.track].strong).length;
  const trouble = worlds.find((w) => st[w.track].trouble);
  for (const h of hints) {
    if (!h.npcs.includes(npcId) || save.play.seen[`hint:${h.id}`]) continue;
    const w = h.when;
    if (w.strong && !w.strong.every((t) => st[t].strong)) continue;
    if (w.untouched && !w.untouched.every((t) => !st[t].begun)) continue;
    if (w.trouble && !trouble) continue;
    if (w.strongWorlds !== undefined && strongN < w.strongWorlds) continue;
    return { id: h.id, text: h.line.replace('{world}', trouble ? worldOfTrack(trouble.track).name : '').replace('{n}', String(strongN)) };
  }
  return undefined;
}
