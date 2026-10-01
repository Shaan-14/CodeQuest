/**
 * PROP BUILDERS: turn `Prop { kind, p }` into meshes. A builder may also return a `Dyn`: a controller whose STATE the world changes when the
 * player's code changes the world (a robot repairs, a door opens, a lamp lights). Scenes are data; adding a kind here is how new things appear.
 */
import type { Group, Object3D } from 'three';
import type { Prop } from '../logic/sceneTypes';
import type { Audio } from './audio';
import type { Fx } from './fx';
import type { Tweens } from './tween';

/** What a builder needs from the stage. */
export interface BuildCtx {
  fx: Fx;
  tweens: Tweens;
  audio: Audio;
  /** Show a caption (also announced to screen readers). */
  say: (text: string) => void;
  /** True when motion should be replaced by instant state changes. */
  reduced: boolean;
  /** Change the light of the whole place: 0 = as authored, 1 = dawn (the Summit finale). */
  mood: (k: number) => void;
  /** Take the camera to a fixed viewpoint for a moment (null returns it to the player). */
  cinema: (v: { x: number; z: number; y?: number; yaw: number; pitch: number; dist: number } | null) => void;
  /** Another prop's controller (a repair arm reaches for a robot's part). Resolves at call time, not build time. */
  dyn: (id: string) => Dyn | undefined;
  /** Where the player stands now (props that watch the player). */
  player: () => { x: number; z: number };
}

/** A thing in the world whose look depends on what the player has done. */
export interface Dyn {
  id: string;
  object: Group;
  /** Enter a state. `instant` is true when the state was already earned (scene loaded, reduced motion): no animation, just the result. */
  setState(state: string, instant: boolean): void;
  /** One-shot reactions that do not change state (a failed attempt: sparks and a flicker). */
  play?(name: string): void;
  update?(dt: number, t: number): void;
  /** World position for effects. */
  at(): { x: number; y: number; z: number };
  /** World position of a named part (a loose arm, a socket) so another prop can work on it. */
  where?(name: string): { x: number; y: number; z: number } | null;
  /** Run a longer scripted sequence (a simulated game, a race start). Resolves when it ends. */
  run?(name: string, arg?: unknown): Promise<void>;
  /** States entered so far (for tests and the accessibility summary). */
  states?(): string[];
}

export interface Built { object: Object3D; dyn?: Dyn }
export type Builder = (p: Prop, ctx: BuildCtx) => Built;


import { num, col, str, flag } from './props';
export { num, col, str, flag };
import { coreBuilders } from './builders.core';
import { roboticsBuilders } from './builders.robotics';
import { boltBuilders } from './builders.bolt';
import { academyBuilders } from './builders.academy';
import { ballparkBuilders } from './builders.ballpark';
import { racingBuilders } from './builders.racing';
import { summitBuilders } from './builders.summit';

export const builders: Record<string, Builder> = { ...coreBuilders, ...roboticsBuilders, ...boltBuilders, ...academyBuilders, ...ballparkBuilders, ...racingBuilders, ...summitBuilders };
