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
  /** States entered so far (for tests and the accessibility summary). */
  states?(): string[];
}

export interface Built { object: Object3D; dyn?: Dyn }
export type Builder = (p: Prop, ctx: BuildCtx) => Built;

export const num = (p: Prop, key: string, d: number): number => { const v = p.p?.[key]; return typeof v === 'number' ? v : d; };
export const col = (p: Prop, key: string, d: number): number => { const v = p.p?.[key]; return typeof v === 'number' ? v : d; };
export const str = (p: Prop, key: string, d: string): string => { const v = p.p?.[key]; return typeof v === 'string' ? v : d; };
export const flag = (p: Prop, key: string, d = false): boolean => { const v = p.p?.[key]; return typeof v === 'boolean' ? v : d; };

import { coreBuilders } from './builders.core';
import { roboticsBuilders } from './builders.robotics';
import { academyBuilders } from './builders.academy';
import { ballparkBuilders } from './builders.ballpark';
import { racingBuilders } from './builders.racing';

export const builders: Record<string, Builder> = { ...coreBuilders, ...roboticsBuilders, ...academyBuilders, ...ballparkBuilders, ...racingBuilders };
