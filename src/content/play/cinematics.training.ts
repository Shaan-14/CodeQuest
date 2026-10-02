import type { Cinematic, Cue } from '../../play/logic/cinematic';
import type { FxKind } from '../../play/engine/fx';

/**
 * TRAINING GROUNDS SUCCESS: what the Simulation Room does when a training plan is finished, one scene for each family of skill. The player has
 * done real work at the console; the room answers with something that WORKS because of it, and the coach reacts to what it sees. Then the game
 * walks the player back to the exact lesson they left, with no button in between. Every scene is about 6 seconds, skippable, and only plays after
 * a plan is complete, so a failed step never shows one.
 *   code (Python/Git) -> the practice arm powers up and performs a pick-and-place while the coach watches
 *   data (SQL/pipelines) -> the data console fills in its rows and flags what it did not guess
 *   web -> the workstation loads its page and the form is sent
 *   stats and R -> a distribution draws itself and the method is named
 *   spreadsheets -> the tuning display saves a configuration and shows the result
 */
interface Win { target: string; prop: { state?: string; play?: string }; color: number; look: [number, number, number]; yaw: number; dist: number; sfx: Cue; fx: FxKind; coach: string; after: string; away?: [number, number]; reaction: 'cheer' | 'nod' | 'point' | 'think' }

function win(kind: string, o: Win): Cinematic {
  const at = { prop: o.target };
  return {
    id: `trainwin:${kind}`, len: 6.6,
    cues: [
      { t: 0, do: 'cam', at: { player: true }, dist: 4.4, yaw: 0.4, pitch: 0.16, height: 1.5, blend: 0.05 },
      { t: 0.2, do: 'player', anim: 'success', mood: 'happy' },
      ...(o.away ? [{ t: 0.9, do: 'player', walk: o.away, face: at } as Cue] : [{ t: 0.9, do: 'player', face: at } as Cue]),
      { t: 1.0, do: 'npc', id: 'sana-sim', look: at, face: at },
      { t: 1.0, do: 'cam', at: { at: [o.look[0], o.look[1], o.look[2]] }, dist: o.dist, yaw: o.yaw, pitch: 0.18, height: o.look[2], blend: 1.3 },
      { t: 1.8, do: 'prop', id: o.target, ...(o.prop.state ? { state: o.prop.state } : {}), ...(o.prop.play ? { play: o.prop.play } : {}) },
      o.sfx,
      { t: 1.9, do: 'flash', at, color: o.color, power: 9, dur: 0.9, y: o.look[2] },
      { t: 2.0, do: 'fx', kind: o.fx, at, n: 18, y: o.look[2] },
      { t: 3.0, do: 'cam', at: { npc: 'sana-sim' }, dist: 3.6, yaw: 0.6, pitch: 0.12, height: 1.5, blend: 1.2 },
      { t: 3.2, do: 'npc', id: 'sana-sim', anim: o.reaction, mood: 'happy' },
      { t: 3.4, do: 'say', who: 'Analyst Sana', text: o.coach, for: 3.2 },
      { t: 5.2, do: 'banner', title: 'Training complete', sub: o.after, kind: 'info' },
      { t: 5.4, do: 'cam', at: 'player', blend: 1.0 },
      { t: 6.0, do: 'npc', id: 'sana-sim', mood: 'neutral', look: null },
    ],
  };
}

export const TRAINING_WINS: Record<string, Cinematic> = {
  python: win('python', { target: 'train-arm', prop: { state: 'run' }, color: 0x7dffb3, look: [-8.2, -2.6, 1.5], yaw: 0.9, dist: 6, sfx: { t: 1.9, do: 'sfx', name: 'servo' }, fx: 'sparks', coach: 'You predicted it, ran it and it did what you said it would. Watch it work.', after: 'Focus restored. Back to your challenge.', away: [-4.6, -0.6], reaction: 'cheer' }),
  data: win('data', { target: 'train-data', prop: { state: 'on' }, color: 0x7dffb3, look: [-9.7, -6.2, 1.7], yaw: 1.1, dist: 5.2, sfx: { t: 1.9, do: 'sfx', name: 'chime' }, fx: 'heal', coach: 'Thirty-eight rows, three flagged, nothing guessed. That is a query you can trust.', after: 'Focus restored. Back to your challenge.', away: [-5, -3.2], reaction: 'point' }),
  web: win('web', { target: 'train-web', prop: { state: 'on' }, color: 0xff79c6, look: [9.7, -5.2, 1.7], yaw: -1.1, dist: 5.2, sfx: { t: 1.9, do: 'sfx', name: 'interact' }, fx: 'magic', coach: 'The page loaded, the form went through. You tested it the way a visitor would.', after: 'Focus restored. Back to your challenge.', away: [5, -3], reaction: 'nod' }),
  stats: win('stats', { target: 'train-stats', prop: { state: 'on' }, color: 0xffd166, look: [-6.8, -7.7, 1.7], yaw: 0.2, dist: 6.5, sfx: { t: 1.9, do: 'sfx', name: 'chime' }, fx: 'ember', coach: 'You named the method and the denominator before you computed anything. The graph agrees.', after: 'Focus restored. Back to your challenge.', away: [-4, -3.5], reaction: 'think' }),
  sheet: win('sheet', { target: 'train-sheet', prop: { state: 'on' }, color: 0x9fe8ff, look: [6.8, -7.7, 1.7], yaw: -0.2, dist: 6.5, sfx: { t: 1.9, do: 'sfx', name: 'servo' }, fx: 'shield', coach: 'Change one input and watch what moves. Your configuration moved the number you wanted.', after: 'Focus restored. Back to your challenge.', away: [4, -3.5], reaction: 'nod' }),
};
