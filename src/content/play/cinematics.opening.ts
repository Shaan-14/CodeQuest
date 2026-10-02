import type { Cinematic, Cue } from '../../play/logic/cinematic';
import { centreLine, REDLINE } from '../../play/logic/track';
import { OPENING_LINES } from './openingText';

/**
 * THE OPENING (about 85 seconds, played over the real world, see content/play/opening.ts):
 *   1. Bytehaven at its best: the plaza, then each world doing what it is for (machines, a ballgame, a hall of living pages, a car on its lap).
 *   2. The failure, world by world: machines wind down, a scoreboard dies, a connection drops, an engine cuts, and the plaza goes dark gate by gate.
 *   3. A newcomer walks into a beautiful but offline Bytehaven; Juno says what happened and what is needed.
 *   4. The four worlds and the chain that joins them (a machine makes data, a database keeps it, an interface shows it, analysis explains it,
 *      optimisation acts on it, and all of it feeds the core), then the camera becomes the player's own.
 * It only presents: a skipped opening ends in the same world (the screen loads the real plaza at its start).
 */
const [L1, L2, L3, L4] = OPENING_LINES.map((l) => l.text) as [string, string, string, string];
const cl = centreLine(REDLINE), mid = cl.pts[Math.round(cl.pts.length * 0.035)]!; // the middle of the section the car runs, and the side to watch it from
const JUNO = 'Mentor Juno';

const gateFlash = (t: number, at: [number, number], color: number): Cue[] => [{ t, do: 'flash', at: { at }, color, power: 16, dur: 0.7, y: 3.4 }, { t, do: 'sfx', name: 'chime' }];

/** The same moment in the dying place: power flutters, then falls and machines wind down. */
const flicker = (t: number): Cue[] => [
  { t, do: 'power', k: 0.45, over: 0.08 }, { t: t + 0.18, do: 'power', k: 0.95, over: 0.08 }, { t: t + 0.36, do: 'power', k: 0.25, over: 0.08 }, { t: t + 0.52, do: 'power', k: 0.7, over: 0.08 },
];
const fall = (t: number, over = 1.4): Cue[] => [{ t, do: 'power', k: 0, over, motion: 0 }];

export const OPENING_SHEETS: Record<string, Cinematic> = {
  // ---------------------------------------------------------------- 1. Bytehaven at its best
  'opening:plaza-bright': {
    id: 'opening:plaza-bright', len: 5.4,
    cues: [
      { t: 0, do: 'cam', at: { at: [0, 0] }, dist: 16, yaw: -0.8, pitch: 0.12, height: 1.6, blend: 0.05 },
      { t: 0.1, do: 'sfx', name: 'power' },
      { t: 0.2, do: 'cam', at: { at: [0, 0] }, dist: 15.5, yaw: -0.15, pitch: 0.36, height: 4.2, blend: 4.0, spin: 0.07 },
      { t: 0.5, do: 'banner', title: 'BYTEHAVEN', sub: 'Four worlds. One core. Everything working together.', kind: 'info' },
      { t: 0.9, do: 'npc', id: 'pip', anim: 'wave' }, { t: 1.4, do: 'npc', id: 'vera', anim: 'point' }, { t: 1.9, do: 'npc', id: 'otto', anim: 'nod' },
      { t: 2.1, do: 'fx', kind: 'magic', at: { at: [0, 0] }, n: 26, y: 3.4 },
      ...gateFlash(2.6, [-18, 0], 0x7dffb3), ...gateFlash(3.0, [0, -14], 0xbd93f9), ...gateFlash(3.4, [18, 0], 0x4fd1ff), ...gateFlash(3.8, [0, 14], 0xff5d73),
      { t: 4.3, do: 'flash', at: { at: [0, 0] }, color: 0x9fe8ff, power: 14, dur: 0.9, y: 3.2 },
    ],
  },
  'opening:robotics-bright': {
    id: 'opening:robotics-bright', len: 5,
    cues: [
      { t: 0, do: 'cam', at: { at: [-4, -4.2, 1.5] }, dist: 6.2, yaw: 0.6, pitch: 0.18, height: 1.6, blend: 0.05 },
      { t: 0.3, do: 'banner', title: 'ROBOTICS ACADEMY', sub: 'Machines that run on code', kind: 'info' },
      { t: 0.4, do: 'sfx', name: 'servo' },
      { t: 1.5, do: 'cam', at: { at: [0, -2.4, 1] }, dist: 9.5, yaw: Math.PI / 2, pitch: 0.2, height: 1.1, blend: 2.4 },
      { t: 2.5, do: 'sfx', name: 'weld' }, { t: 2.5, do: 'flash', at: { prop: 'arm-a' }, color: 0xffffff, power: 9, dur: 0.4, y: 1.4 },
      { t: 3.0, do: 'cam', at: { prop: 'scanner' }, dist: 4.8, yaw: -Math.PI / 2 + 0.3, pitch: 0.16, height: 1.3, blend: 1.2 },
      { t: 3.1, do: 'sfx', name: 'chime' },
      { t: 3.8, do: 'cam', at: { prop: 'dashboard' }, dist: 12, yaw: 0, pitch: 0.1, height: 2.4, blend: 1.4 },
      { t: 3.9, do: 'npc', id: 'ori-floor', anim: 'nod' },
    ],
  },
  'opening:ballpark-bright': {
    id: 'opening:ballpark-bright', len: 6.0,
    cues: [
      { t: 0, do: 'cam', at: { at: [0, -3.4] }, dist: 4.8, yaw: 0.5, pitch: 0.14, height: 1.5, blend: 0.05 },
      { t: 0.15, do: 'banner', title: 'HARBORVIEW PARK', sub: 'Where data wins games', kind: 'info' },
      { t: 0.2, do: 'sfx', name: 'crowd' },
      { t: 0.3, do: 'prop', id: 'team', play: 'seq:homerun:2' },
      { t: 0.85, do: 'cam', at: { at: [-0.4, 6] }, dist: 5, yaw: -1.2, pitch: 0.12, height: 1.3, blend: 0.4 },
      { t: 1.35, do: 'cam', at: { prop: 'team' }, follow: true, dist: 11, yaw: 0.25, pitch: 0.22, blend: 0.5 },
      { t: 3.2, do: 'cam', at: { at: [0, -4] }, dist: 30, yaw: 0.35, pitch: 0.3, height: 2, blend: 1.2 },
      { t: 3.8, do: 'sfx', name: 'cheer' }, { t: 3.8, do: 'fx', kind: 'confetti', at: { at: [-9.5, 14] }, n: 30, y: 4 }, { t: 3.8, do: 'fx', kind: 'confetti', at: { at: [9.5, 14] }, n: 30, y: 4 },
      { t: 4.4, do: 'cam', at: { prop: 'scoreboard' }, dist: 26, yaw: 0, pitch: 0.12, height: 5, blend: 1.0 },
      { t: 4.6, do: 'prop', id: 'scoreboard', play: 'text:HOME RUN|HERONS 4  GULLS 2|LINEUP SET BY DATA' },
    ],
  },
  'opening:web-bright': {
    id: 'opening:web-bright', len: 5,
    cues: [
      { t: 0, do: 'cam', at: { at: [0, -3, 2] }, dist: 11, yaw: 0.25, pitch: 0.14, height: 2.2, blend: 0.05 },
      { t: 0.3, do: 'banner', title: 'LANTERNHOLLOW', sub: 'Pages, wards and spells that talk to each other', kind: 'info' },
      { t: 0.5, do: 'sfx', name: 'spell' },
      { t: 1.4, do: 'cam', at: { prop: 'portal' }, dist: 7, yaw: 0.5, pitch: 0.15, height: 1.8, blend: 2.0 },
      { t: 1.9, do: 'fx', kind: 'magic', at: { prop: 'portal' }, n: 22, y: 1.8 },
      { t: 2.8, do: 'cam', at: { prop: 'runes' }, dist: 7, yaw: -0.4, pitch: 0.3, height: 1.5, blend: 1.4 },
      { t: 3.6, do: 'cam', at: { prop: 'banner' }, dist: 13, yaw: 0, pitch: 0.2, height: 3.5, blend: 1.4 }, { t: 3.7, do: 'sfx', name: 'chime' },
      { t: 3.9, do: 'npc', id: 'bram', anim: 'cheer' },
    ],
  },
  'opening:racing-bright': {
    id: 'opening:racing-bright', len: 5.4,
    cues: [
      { t: 0, do: 'cam', at: { prop: 'paddock-car' }, dist: 7, yaw: 0.8, pitch: 0.16, height: 0.9, blend: 0.05 },
      { t: 0.2, do: 'banner', title: 'REDLINE RACEWAY', sub: 'Numbers that win races', kind: 'info' },
      { t: 0.3, do: 'sfx', name: 'power' }, { t: 0.3, do: 'prop', id: 'paddock-car', play: 'rev' }, { t: 0.4, do: 'fx', kind: 'smoke', at: { prop: 'paddock-car' }, n: 14, y: 0.5 },
      { t: 1.3, do: 'cam', at: { at: [mid.x, mid.z] }, dist: 24, yaw: mid.heading + Math.PI / 2, pitch: 0.16, height: 1.4, blend: 0.4 },
      { t: 1.5, do: 'lap', from: 0, to: 0.07, board: { id: 'timing-board', text: 'LAP TIMING|SECTION {t} s|PERSONAL BEST' } },
      { t: 1.6, do: 'cam', at: { prop: 'timing-board' }, dist: 16, yaw: Math.PI, pitch: 0.1, height: 2.6, blend: 1.0 },
      { t: 1.7, do: 'sfx', name: 'chime' },
    ],
  },

  // ---------------------------------------------------------------- 2. The failure, world by world
  'opening:robotics-fail': {
    id: 'opening:robotics-fail', len: 3.8,
    cues: [
      { t: 0, do: 'cam', at: { at: [4, -4.2, 1.6] }, dist: 6.5, yaw: -0.5, pitch: 0.2, height: 1.6, blend: 0.05 },
      { t: 0.2, do: 'music', name: 'loss', fade: 1.2 }, { t: 0.3, do: 'sfx', name: 'blackout' },
      { t: 0.4, do: 'prop', id: 'arm-b', play: 'malfunction' }, { t: 0.45, do: 'fx', kind: 'sparks', at: { prop: 'arm-b' }, n: 24, y: 2 }, { t: 0.5, do: 'shake', amount: 0.25 },
      ...flicker(0.7), ...fall(1.4, 1.5),
      { t: 1.5, do: 'cam', at: { at: [0, -2.4, 1] }, dist: 9.5, yaw: -Math.PI / 2, pitch: 0.2, height: 1.1, blend: 1.4 }, { t: 1.6, do: 'prop', id: 'belt', play: 'malfunction' },
      { t: 2.3, do: 'prop', id: 'dashboard', play: 'malfunction' }, { t: 2.8, do: 'prop', id: 'dashboard', play: 'text:LINE 1|OFFLINE' },
      { t: 2.6, do: 'cam', at: { prop: 'dashboard' }, dist: 12, yaw: 0, pitch: 0.1, height: 2.3, blend: 1.2 },
    ],
  },
  'opening:ballpark-fail': {
    id: 'opening:ballpark-fail', len: 3.6,
    cues: [
      { t: 0, do: 'cam', at: { at: [0, -4] }, dist: 30, yaw: 0.3, pitch: 0.3, height: 2, blend: 0.05 },
      { t: 0.05, do: 'prop', id: 'team', play: 'seq:hit:1' },
      { t: 0.7, do: 'sfx', name: 'blackout' }, { t: 0.7, do: 'prop', id: 'scoreboard', play: 'malfunction' }, { t: 0.75, do: 'flash', at: { prop: 'scoreboard' }, color: 0xff4d6d, power: 14, dur: 0.6, y: 5 },
      { t: 0.8, do: 'cam', at: { prop: 'scoreboard' }, dist: 24, yaw: 0, pitch: 0.12, height: 5, blend: 1.0 },
      ...flicker(1.0), { t: 1.7, do: 'prop', id: 'scoreboard', play: 'text:ANALYTICS|SIGNAL LOST' }, ...fall(1.9, 1.3),
      { t: 2.4, do: 'cam', at: { at: [0, -2] }, dist: 24, yaw: -0.4, pitch: 0.24, height: 3, blend: 1.4 },
    ],
  },
  'opening:web-fail': {
    id: 'opening:web-fail', len: 3.4,
    cues: [
      { t: 0, do: 'cam', at: { prop: 'portal' }, dist: 7, yaw: 0.5, pitch: 0.15, height: 1.8, blend: 0.05 },
      { t: 0.4, do: 'sfx', name: 'blackout' }, { t: 0.5, do: 'prop', id: 'crest', play: 'malfunction' }, { t: 0.5, do: 'prop', id: 'dome', play: 'malfunction' }, { t: 0.55, do: 'shake', amount: 0.2 },
      ...flicker(0.7), { t: 1.3, do: 'prop', id: 'crest', play: 'text:CONNECTION|LOST' }, ...fall(1.4, 1.2),
      { t: 1.6, do: 'cam', at: { at: [0, -3, 2] }, dist: 11, yaw: 0.25, pitch: 0.14, height: 2.2, blend: 1.4 },
    ],
  },
  'opening:racing-fail': {
    id: 'opening:racing-fail', len: 3.6,
    cues: [
      { t: 0, do: 'cam', at: { prop: 'car' }, dist: 6.5, yaw: 0.7, pitch: 0.18, height: 1.1, blend: 0.05 },
      { t: 0.1, do: 'prop', id: 'car', play: 'rev' }, { t: 0.2, do: 'sfx', name: 'power' },
      { t: 0.8, do: 'sfx', name: 'blackout' }, { t: 0.9, do: 'prop', id: 'car', play: 'malfunction' }, { t: 0.9, do: 'fx', kind: 'smoke', at: { prop: 'car' }, n: 18, y: 0.8 },
      ...flicker(1.0), ...fall(1.7, 1.2),
      { t: 1.9, do: 'cam', at: { at: [0, -8.6, 1.8] }, dist: 11, yaw: 0, pitch: 0.1, height: 1.8, blend: 1.4 },
    ],
  },
  'opening:plaza-fail': {
    id: 'opening:plaza-fail', len: 4.8,
    cues: [
      { t: 0, do: 'cam', at: { at: [0, 0] }, dist: 15.5, yaw: -0.2, pitch: 0.36, height: 4.2, blend: 0.05, spin: 0.05 },
      { t: 0.3, do: 'sfx', name: 'blackout' }, { t: 0.4, do: 'shake', amount: 0.3 },
      { t: 0.4, do: 'power', k: 0, over: 0.8, world: 'robotics' }, { t: 0.8, do: 'power', k: 0, over: 0.8, world: 'academy' }, { t: 1.2, do: 'power', k: 0, over: 0.8, world: 'ballpark' }, { t: 1.6, do: 'power', k: 0, over: 0.8, world: 'racing' },
      { t: 2.2, do: 'power', k: 0, over: 1.5, motion: 0, world: '' }, { t: 2.2, do: 'power', k: 0, over: 1.5, motion: 0 },
      { t: 2.5, do: 'flash', at: { at: [0, 0] }, color: 0xff5d73, power: 10, dur: 0.5, y: 3.2 },
      { t: 2.8, do: 'music', name: null, fade: 1.6 },
      { t: 3.3, do: 'cam', at: { at: [0, 0] }, dist: 24, yaw: -0.2, pitch: 0.5, height: 5, blend: 2.4 },
    ],
  },

  // ---------------------------------------------------------------- 3. Arrival: a beautiful place, offline
  'opening:arrive': {
    id: 'opening:arrive', len: 5.4,
    cues: [
      { t: 0, do: 'music', name: 'loss', fade: 2.5 },
      { t: 0, do: 'cam', at: { player: true }, dist: 6.5, yaw: 0, pitch: 0.2, height: 1.7, blend: 0.05 },
      { t: 0.3, do: 'player', walk: [0, 9.4] },
      { t: 0.6, do: 'npc', id: 'pip', anim: 'shrug' }, { t: 1.1, do: 'npc', id: 'tamsin', anim: 'think' }, { t: 1.5, do: 'npc', id: 'vera', release: true, anim: 'think' }, { t: 2.0, do: 'npc', id: 'otto', release: true, anim: 'shrug' },
      { t: 1.4, do: 'cam', at: { at: [0, 3] }, dist: 13, yaw: 0.12, pitch: 0.3, height: 2.4, blend: 2.4 },
      { t: 3.4, do: 'npc', id: 'juno-hub', face: { player: true }, look: { player: true }, anim: 'wave' },
    ],
  },
  // Juno: what happened, and what is needed (the four lines, with room to breathe)
  'opening:juno': {
    id: 'opening:juno', len: 14.2,
    cues: [
      { t: 0, do: 'cam', at: { npc: 'juno-hub' }, dist: 3.6, yaw: 1.2, pitch: 0.14, height: 1.5, blend: 1.4 },
      { t: 0.1, do: 'npc', id: 'juno-hub', face: { player: true }, look: { player: true }, talk: true, mood: 'worried' },
      { t: 0.4, do: 'say', who: JUNO, text: L1, for: 3.2 },
      { t: 3.6, do: 'cam', at: { at: [0, -2] }, dist: 22, yaw: 0, pitch: 0.34, height: 3, blend: 2.0 },
      { t: 3.8, do: 'say', who: JUNO, text: L2, for: 3.4 },
      { t: 7.2, do: 'cam', at: { at: [0, 0] }, dist: 6, yaw: 0.4, pitch: 0.5, height: 3.6, blend: 2.2, spin: 0.08 },
      { t: 7.4, do: 'say', who: JUNO, text: L3, for: 2.5 },
      { t: 9.9, do: 'cam', at: { npc: 'juno-hub' }, dist: 3.4, yaw: 0.9, pitch: 0.12, height: 1.55, blend: 1.8 },
      // a held silence, then the ask
      { t: 11.0, do: 'say', who: JUNO, text: L4, for: 3.2 },
      { t: 11.1, do: 'npc', id: 'juno-hub', mood: 'neutral', anim: 'point', point: { player: true } },
    ],
  },
  // ---------------------------------------------------------------- 4. The four worlds and what joins them
  'opening:worlds': {
    id: 'opening:worlds', len: 16.2,
    cues: [
      { t: 0, do: 'npc', id: 'juno-hub', talk: false, release: true, look: null },
      { t: 0, do: 'cam', at: { at: [-21.5, 0] }, dist: 14, yaw: Math.PI / 2, pitch: 0.15, height: 3, blend: 1.1 },
      ...gateFlash(0.4, [-21.5, 0], 0x7dffb3), { t: 0.5, do: 'say', who: JUNO, text: 'Robotics: machines that run on Python.', for: 2.2 },
      { t: 2.4, do: 'cam', at: { at: [21.5, 0] }, dist: 14, yaw: -Math.PI / 2, pitch: 0.15, height: 3, blend: 1.1 },
      ...gateFlash(2.8, [21.5, 0], 0x4fd1ff), { t: 2.9, do: 'say', who: JUNO, text: 'Harborview: SQL, statistics and R.', for: 2.1 },
      { t: 4.8, do: 'cam', at: { at: [0, -17.5] }, dist: 14, yaw: 0, pitch: 0.15, height: 3, blend: 1.1 },
      ...gateFlash(5.2, [0, -17.5], 0xbd93f9), { t: 5.3, do: 'say', who: JUNO, text: 'Lanternhollow: HTML, CSS, JavaScript and APIs.', for: 2.3 },
      { t: 7.2, do: 'cam', at: { at: [0, 17.5] }, dist: 14, yaw: Math.PI, pitch: 0.15, height: 3, blend: 1.1 },
      ...gateFlash(7.6, [0, 17.5], 0xff5d73), { t: 7.7, do: 'say', who: JUNO, text: 'Redline: spreadsheets and models.', for: 2.1 },
      // the chain: a machine makes data, a database keeps it, an interface shows it, analysis explains it, optimisation acts, and it all feeds the core
      { t: 9.7, do: 'cam', at: { at: [0, 0] }, dist: 24, yaw: -0.2, pitch: 0.6, height: 3, blend: 1.5, spin: 0.06 },
      { t: 9.9, do: 'say', who: JUNO, text: 'A machine makes data. A database keeps it. An interface shows it. All of it feeds the core.', for: 4.8 },
      ...gateFlash(10.2, [-18, 0], 0x7dffb3), ...gateFlash(10.9, [18, 0], 0x4fd1ff), ...gateFlash(11.6, [0, -14], 0xbd93f9), ...gateFlash(12.3, [0, 14], 0xff5d73),
      { t: 13.1, do: 'flash', at: { at: [0, 0] }, color: 0x9fe8ff, power: 12, dur: 1.2, y: 3.2 }, { t: 13.1, do: 'fx', kind: 'magic', at: { at: [0, 0] }, n: 18, y: 3.2 },
      { t: 14.8, do: 'cam', at: 'player', blend: 1.6 },
    ],
  },
};
