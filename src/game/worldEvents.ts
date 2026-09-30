/**
 * WORLD EVENTS: the boundary between learning and any visual world (Phase 6).
 *
 *     code -> (graded) evidence -> `worldEffect` event -> derived WorldState -> (future) scene / animation
 *
 * The learning engine decides only THAT something was demonstrated (a first pass of a challenge that declares effects, see
 * content/worldEffects.ts). It emits an event (for toasts and animations to react to) and can always rebuild the current state of the world
 * from the evidence log, so a scene needs no saved data of its own and a reloaded game looks exactly as it did. Nothing here knows about
 * graphics, themes or coordinates, and XP, levels and shop items never appear in it: the world reflects what the player can DO.
 */
import { getAnyChallenge } from '../content';
import type { Challenge } from '../content/schema';
import type { SaveData } from '../core/save';
import type { EvidenceRecord } from '../learning/mastery';
import type { GameEvent } from './events';

/** What has happened to one object of the world so far. */
export interface WorldObjectState {
  target: string;
  /** Actions applied, in the order the player earned them (each at most once). */
  actions: string[];
  /** The latest action. */
  last: string;
  /** Challenges whose first pass caused those actions. */
  sources: string[];
}
export type WorldState = Record<string, WorldObjectState>;

/** True when `record` is the first PASS of its challenge in the save (evidence not yet appended). */
const isFirstPass = (s: SaveData, challengeId: string): boolean => !s.evidence.some((r) => r.challengeId === challengeId && r.passed && r.executed);

/** Emit the world effects of a passed challenge, once. Call BEFORE pushing the new evidence record, so "first" is still knowable. */
export function emitWorldEffects(s: SaveData, events: GameEvent[], c: Challenge, passed: boolean): void {
  if (!passed || !c.worldEffects?.length || !isFirstPass(s, c.id)) return;
  for (const e of c.worldEffects) events.push({ type: 'worldEffect', target: e.target, action: e.action, detail: e.detail, challengeId: c.id });
}

/** Rebuild the world from the evidence log alone (pure, deterministic, the same after a reload). */
export function deriveWorldState(save: SaveData): WorldState {
  const world: WorldState = {};
  const seen = new Set<string>();
  const passes: EvidenceRecord[] = save.evidence.filter((r) => r.passed && r.executed).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  for (const r of passes) {
    if (seen.has(r.challengeId)) continue;
    seen.add(r.challengeId);
    for (const e of getAnyChallenge(r.challengeId)?.worldEffects ?? []) {
      const o = (world[e.target] ??= { target: e.target, actions: [], last: e.action, sources: [] });
      if (!o.actions.includes(e.action)) o.actions.push(e.action);
      o.last = e.action;
      o.sources.push(r.challengeId);
    }
  }
  return world;
}
