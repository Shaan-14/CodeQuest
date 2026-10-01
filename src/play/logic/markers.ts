/**
 * THE MARKER (pure): the one thing in a scene the objective points at gets a glowing diamond. It is the same target the trail and the light
 * column lead to (see objective.ts), so there is exactly one answer to "where do I go?": no second set of quest hints that could disagree.
 * It says WHERE, never how to solve anything.
 */
import type { Waypoint } from './objective';
import type { Interactable } from './sceneTypes';

export type MarkerKind = 'step';
export interface Marker { id: string; kind: MarkerKind; x: number; z: number }

/** The interactable the waypoint stands on (a doorway on the way is marked by the trail and the beam, not a diamond). */
export function markersAt(w: Waypoint | null, interactables: readonly Interactable[]): Marker[] {
  if (!w || w.via) return [];
  const it = interactables.find((i) => Math.abs(i.x - w.x) < 0.01 && Math.abs(i.z - w.z) < 0.01 && i.action.type !== 'exit');
  return it ? [{ id: it.id, kind: 'step', x: it.x, z: it.z }] : [];
}
