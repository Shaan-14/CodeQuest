/**
 * CINEMATICS (pure data + helpers): a short scripted moment in the world, written as a CUE SHEET. Each cue says WHEN (seconds from the start)
 * and WHAT: move the camera, set a prop's state, play a particle burst, make an NPC react, put a line of dialogue on screen, show a banner.
 * The same sheet works for any world; the engine's Director (engine/director.ts) plays it. Nothing here knows three.js, and no cue changes
 * what the player has learned: world state still comes from `deriveWorldState`, a cue only SHOWS the state change with some drama.
 *
 * Skipping (Space/E/Esc) or reduced motion fast-forwards: every state-changing cue still runs, instantly, so the world always ends up right.
 */
import type { FxKind } from '../engine/fx';
import type { Sfx } from '../engine/audio';
import type { Mood, OneShot } from '../engine/rig';

/** A place or thing in the current scene: a prop by id, an NPC by id, the player, or a fixed point (x, z, optional height). */
export type Target = { prop: string } | { npc: string } | { player: true } | { at: [number, number] | [number, number, number] };

export type CueAction =
  /** Move the camera to look at `at` from a distance/angle (yaw 0 = looking north from the south). `blend` = seconds to get there; `spin` = slow orbit in rad/s. 'player' hands the camera back. */
  | { do: 'cam'; at: Target | 'player'; dist?: number; yaw?: number; pitch?: number; height?: number; blend?: number; spin?: number; /** Keep the shot on the target as it moves (a ball in flight). */ follow?: boolean; /** Keep the shot out of walls and tall things (the same spring arm as play): for shots framed on the player in places the author has not seen. */ safe?: boolean; /** Field of view in degrees (a slow push-in narrows it); default 48. */ fov?: number }
  /** A line of dialogue / narration shown as a subtitle (and announced to screen readers). */
  | { do: 'say'; text: string; who?: string; for?: number }
  /** Put a prop into a state (the world change itself) and/or run one of its animations (`play`, optionally with an argument). */
  | { do: 'prop'; id: string; state?: string; play?: string }
  /** Hold the clock of this sheet until the prop has finished what it was asked to do (an arm mid-move), for at most `max` seconds. */
  | { do: 'await'; id: string; max?: number }
  | { do: 'fx'; kind: FxKind; at: Target; n?: number; scale?: number; y?: number }
  | { do: 'flash'; at: Target; color?: number; power?: number; dur?: number; y?: number }
  | { do: 'sfx'; name: Sfx }
  /** The musical bed (see Audio.music): the working city, the outage, the restored one; null fades it out. */
  | { do: 'music'; name: 'hope' | 'loss' | 'dawn' | null; fade?: number }
  /** An NPC reacts: a one-shot or held gesture, turns to face something, walks somewhere, changes mood, talks, points. */
  | { do: 'npc'; id: string; anim?: OneShot; hold?: OneShot; release?: boolean; face?: Target; walk?: [number, number]; mood?: Mood; talk?: boolean; point?: Target; look?: Target | null }
  | { do: 'player'; anim?: OneShot; face?: Target; walk?: [number, number]; look?: Target | null; mood?: Mood; /** Hide the player (they have got into the car) or show them again. */ show?: boolean }
  /** Run a real SECTION of the replay lap (from..to as fractions of the circuit) with the setup the player's work earned. The sheet's clock waits for it; `board` then rewrites a display with the section time (`{t}` becomes seconds). */
  | { do: 'lap'; from: number; to: number; board?: { id: string; text: string } }
  | { do: 'shake'; amount: number }
  /** Light the place toward dawn (0..1). */
  | { do: 'mood'; k: number }
  /** Take the glow of the whole place to `k` (0 offline .. 1 alive) over `over` seconds, or `'save'` to hand it back to what the player has restored. */
  | { do: 'power'; k: number | 'save'; over?: number; /** How much machinery keeps moving (0 stopped .. 1 running). */ motion?: number; /** Only this district's glow (robotics, academy, ballpark, racing); omitted = the whole place. */ world?: string }
  /** A banner moment: quest complete, level up, something unlocked. */
  | { do: 'banner'; title: string; sub?: string; kind?: 'quest' | 'level' | 'unlock' | 'info' };

export type Cue = { t: number } & CueAction;

export interface Cinematic {
  id: string;
  cues: Cue[];
  /** Total length in seconds; defaults to the last cue plus a short hold. */
  len?: number;
}

/** Cues in firing order (stable for equal times, so authors can rely on the written order). */
export const sortedCues = (c: Cinematic): Cue[] => c.cues.map((q, i) => [q, i] as const).sort((a, b) => a[0].t - b[0].t || a[1] - b[1]).map(([q]) => q);

export function lengthOf(c: Cinematic): number {
  if (c.len !== undefined) return c.len;
  let end = 0;
  for (const q of c.cues) end = Math.max(end, q.t + (q.do === 'say' ? q.for ?? 3 : q.do === 'banner' ? 3 : q.do === 'cam' ? (q.blend ?? 1) : 0.5));
  return end + 0.4;
}

/** The cues that fire when time moves from `from` (exclusive) to `to` (inclusive), in order. */
export function cuesBetween(sorted: readonly Cue[], from: number, to: number): Cue[] { return sorted.filter((q) => q.t > from && q.t <= to); }

/** Does the cue change what the world IS (as opposed to how it is shown)? Those run even when the cinematic is skipped. */
export const changesWorld = (q: CueAction): boolean => (q.do === 'prop' && !!q.state) || q.do === 'npc' || q.do === 'mood' || q.do === 'power' || q.do === 'banner';

/** Every prop id and NPC id a cinematic refers to (so content tests can check them against the scene and cast). */
export function referencedIds(c: Cinematic): { props: string[]; npcs: string[] } {
  const props = new Set<string>(), npcs = new Set<string>();
  const t = (x: Target | 'player' | null | undefined) => { if (x && typeof x === 'object') { if ('prop' in x) props.add(x.prop); if ('npc' in x) npcs.add(x.npc); } };
  for (const q of c.cues) {
    if (q.do === 'prop' || q.do === 'await') props.add(q.id);
    if (q.do === 'lap' && q.board) props.add(q.board.id);
    if (q.do === 'cam' || q.do === 'fx' || q.do === 'flash') t(q.at);
    if (q.do === 'npc') { npcs.add(q.id); t(q.face); t(q.point); t(q.look); }
    if (q.do === 'player') { t(q.face); t(q.look); }
  }
  return { props: [...props], npcs: [...npcs] };
}
