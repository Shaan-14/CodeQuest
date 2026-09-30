/** INTERACTION (pure): which thing is the player close enough to use right now, and what does the prompt say. */
import type { Interactable } from './sceneTypes';

export const DEFAULT_RANGE = 2.2;

/**
 * The interactable to offer: within its range, and (when the player is facing somewhere) roughly in front, nearest first.
 * Two things overlapping resolve to the nearer one, so the prompt never flickers between them.
 */
export function nearestInteractable(px: number, pz: number, ry: number, list: readonly Interactable[]): Interactable | null {
  let best: Interactable | null = null;
  let bestScore = Infinity;
  const fx = -Math.sin(ry), fz = -Math.cos(ry);
  for (const it of list) {
    const dx = it.x - px, dz = it.z - pz, d = Math.hypot(dx, dz);
    if (d > (it.range ?? DEFAULT_RANGE)) continue;
    // Angle between facing and the thing: behind the player costs more than beside them, but very close things always count.
    const cos = d < 0.9 ? 1 : (dx * fx + dz * fz) / d;
    if (cos < -0.2) continue;
    const score = d + (1 - cos) * 0.8;
    if (score < bestScore) { bestScore = score; best = it; }
  }
  return best;
}

/** `[E] Talk to Engineer Ori`-style text. */
export const promptText = (it: Interactable): string => `[E] ${it.verb}${it.label ? ` ${/^(Talk|Speak)/i.test(it.verb) ? 'to ' : ''}${it.label}` : ''}`.replace(/\s+/g, ' ').trim();
