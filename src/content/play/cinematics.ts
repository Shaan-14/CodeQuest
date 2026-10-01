import type { Cinematic, Cue } from '../../play/logic/cinematic';
import type { FxKind } from '../../play/engine/fx';
import type { Sfx } from '../../play/engine/audio';
import type { OneShot } from '../../play/engine/rig';
import { quests } from '../world';
import { cast } from './cast';

/**
 * THE CINEMATICS of the world: short cue sheets (see play/logic/cinematic.ts) that SHOW what the player's code just did. A scene's
 * `reactions[].cinematic` names one of these; quest completions and level-ups look theirs up by `quest:<id>` /
 * `level:<n>` (with a generic one when none is authored). A cinematic only presents: it sets the same prop states the bare reaction would.
 */

/** A short beat for one repaired module: camera to the robot, the change, a line, back to the player. */
function bolt(id: string, state: string, o: { dist?: number; yaw?: number; height?: number; sfx?: Cue[]; lines: { who?: string; text: string }[]; react?: Cue[]; len?: number }): Cinematic {
  const cues: Cue[] = [
    { t: 0, do: 'cam', at: { prop: 'bolt' }, dist: o.dist ?? 5.5, yaw: o.yaw ?? 0.3, pitch: 0.33, height: o.height ?? 1.2, blend: 1.3 },
    { t: 0.3, do: 'npc', id: 'rowan', face: { prop: 'bolt' }, look: { prop: 'bolt' } },
    { t: 1.2, do: 'prop', id: 'bolt', state },
    ...(o.sfx ?? []),
    ...o.lines.map((l, i): Cue => ({ t: 1.8 + i * 3.1, do: 'say', who: l.who, text: l.text, for: 3 })),
    ...(o.react ?? []),
  ];
  const end = 1.8 + o.lines.length * 3.1 + 0.4;
  return { id, cues: [...cues, { t: o.len ?? end, do: 'cam', at: 'player', blend: 1.3 }], len: (o.len ?? end) + 1.2 };
}

export const CINEMATICS: Record<string, Cinematic> = {
  // ---- the showcase: the first program lights Bolt's eyes
  'bolt-eyes': {
    id: 'bolt-eyes', len: 8,
    cues: [
      { t: 0, do: 'cam', at: { prop: 'bolt' }, dist: 6.5, yaw: 0.25, pitch: 0.4, height: 1.1, blend: 1.4 },
      { t: 0.2, do: 'npc', id: 'juno', face: { prop: 'bolt' }, look: { prop: 'bolt' }, mood: 'focused' },
      { t: 1.3, do: 'cam', at: { prop: 'bolt' }, dist: 3.2, yaw: 0.15, pitch: 0.22, height: 1.4, blend: 2.4 },
      { t: 1.8, do: 'sfx', name: 'power' },
      { t: 2.0, do: 'flash', at: { prop: 'bolt' }, color: 0x4fd1ff, power: 10, dur: 0.9 },
      { t: 2.1, do: 'prop', id: 'bolt', state: 'eyes' },
      { t: 2.2, do: 'fx', kind: 'magic', at: { prop: 'bolt' }, n: 24, y: 1.6 },
      { t: 3.0, do: 'npc', id: 'juno', anim: 'cheer', mood: 'happy' },
      { t: 3.2, do: 'say', who: 'Mentor Juno', text: 'There. Two blue eyes, and every line of that came from you.', for: 3.4 },
      { t: 5.8, do: 'cam', at: 'player', blend: 1.6 },
      { t: 6.2, do: 'npc', id: 'juno', mood: 'neutral', look: null },
    ],
  },

  // ---- the arm repair: the repair rig fetches the arm, carries it and welds it on
  'bolt-arm': {
    id: 'bolt-arm', len: 17.5,
    cues: [
      { t: 0, do: 'cam', at: { prop: 'bolt' }, dist: 9, yaw: 0.35, pitch: 0.42, height: 1.2, blend: 1.6 },
      { t: 0.3, do: 'npc', id: 'rowan', face: { prop: 'repair-rig' }, look: { prop: 'repair-rig' }, point: { prop: 'repair-rig' } },
      { t: 0.8, do: 'say', who: 'Technician Rowan', text: 'Fault log is clean. Stand back: the repair rig takes it from here.', for: 3 },
      { t: 1.4, do: 'prop', id: 'repair-rig', play: 'wake' },
      { t: 2.4, do: 'npc', id: 'rowan', release: true },
      { t: 3.6, do: 'prop', id: 'repair-rig', play: 'fetch' },
      { t: 3.7, do: 'cam', at: { prop: 'bolt' }, dist: 6, yaw: 0.9, pitch: 0.3, height: 1.4, blend: 2.2 },
      { t: 4.2, do: 'sfx', name: 'servo' },
      { t: 6.4, do: 'sfx', name: 'servo' },
      { t: 7.6, do: 'prop', id: 'repair-rig', play: 'carry' },
      { t: 7.8, do: 'cam', at: { prop: 'bolt' }, dist: 4.6, yaw: 0.4, pitch: 0.28, height: 1.3, blend: 2.0 },
      { t: 8.0, do: 'sfx', name: 'servo' },
      { t: 10.1, do: 'cam', at: { prop: 'bolt' }, dist: 2.6, yaw: 0.15, pitch: 0.2, height: 1.2, blend: 1.2 },
      { t: 10.3, do: 'prop', id: 'repair-rig', play: 'weld' },
      { t: 10.4, do: 'prop', id: 'bolt', state: 'arm' },
      { t: 10.6, do: 'shake', amount: 0.18 },
      { t: 11.0, do: 'sfx', name: 'weld' },
      { t: 12.3, do: 'flash', at: { prop: 'bolt' }, color: 0xffffff, power: 14, dur: 0.5, y: 1.3 },
      { t: 12.4, do: 'prop', id: 'repair-rig', play: 'retract' },
      { t: 12.8, do: 'cam', at: { prop: 'bolt' }, dist: 5, yaw: 0.35, pitch: 0.3, height: 1.2, blend: 1.6 },
      { t: 13.0, do: 'prop', id: 'bolt', play: 'flex' },
      { t: 13.1, do: 'npc', id: 'rowan', anim: 'cheer', mood: 'happy', look: { prop: 'bolt' } },
      { t: 13.4, do: 'say', who: 'Technician Rowan', text: 'Look at that: a fault log you could read, and a fault you fixed. That arm is yours.', for: 3.6 },
      { t: 16.3, do: 'cam', at: 'player', blend: 1.6 },
      { t: 16.6, do: 'npc', id: 'rowan', mood: 'neutral', look: null },
    ],
  },

  'bolt-power': bolt('bolt-power', 'power', {
    dist: 5, sfx: [{ t: 1.2, do: 'sfx', name: 'success' }, { t: 1.3, do: 'fx', kind: 'heal', at: { prop: 'bolt' }, n: 22, y: 1.3 }],
    lines: [{ who: 'Technician Rowan', text: 'A variable that remembers: that is what a battery is, to a program. It holds a charge.' }],
    react: [{ t: 2.0, do: 'npc', id: 'rowan', anim: 'nod', mood: 'happy' }],
  }),
  'bolt-voice': bolt('bolt-voice', 'voice', {
    dist: 3.6, height: 1.6, sfx: [{ t: 1.4, do: 'sfx', name: 'interact' }, { t: 1.6, do: 'prop', id: 'bolt', play: 'talk' }],
    lines: [{ who: 'Bolt-7', text: 'B-b-bzzt… hello?' }, { who: 'Technician Rowan', text: 'He is greeting you. Strings are how a robot talks.' }],
    react: [{ t: 2.6, do: 'npc', id: 'rowan', anim: 'cheer', mood: 'happy' }],
  }),
  'bolt-servo': bolt('bolt-servo', 'servo', {
    dist: 3.8, height: 1.6, sfx: [{ t: 1.4, do: 'sfx', name: 'servo' }],
    lines: [{ who: 'Bolt-7', text: 'Head servo calibrated.' }],
  }),
  'bolt-ears': bolt('bolt-ears', 'ears', {
    dist: 3.8, height: 1.7, sfx: [{ t: 1.4, do: 'sfx', name: 'chime' }],
    lines: [{ who: 'Technician Rowan', text: 'The antenna lit: he is listening now. Input is how a robot notices the world.' }],
  }),
  'bolt-decide': bolt('bolt-decide', 'decide', {
    dist: 4.4, sfx: [{ t: 1.4, do: 'sfx', name: 'interact' }],
    lines: [{ who: 'Bolt-7', text: 'Yes… no… yes. I can decide.' }],
  }),
  'bolt-senses': bolt('bolt-senses', 'senses', {
    dist: 4, height: 1.6, sfx: [{ t: 1.4, do: 'sfx', name: 'chime' }],
    lines: [{ who: 'Technician Rowan', text: 'Amber visor: he is weighing a choice. That is an if-statement doing its job.' }],
  }),
  'bolt-cycle': bolt('bolt-cycle', 'cycle', { dist: 4.4, sfx: [{ t: 1.4, do: 'sfx', name: 'servo' }], lines: [{ who: 'Bolt-7', text: 'Again. Again. Until I am told to stop.' }] }),
  'bolt-loop': bolt('bolt-loop', 'loop', { dist: 4.4, sfx: [{ t: 1.4, do: 'sfx', name: 'servo' }], lines: [{ who: 'Technician Rowan', text: 'Exactly as many times as you said. No more, no fewer.' }] }),
  'bolt-routine': bolt('bolt-routine', 'routine', { dist: 5, sfx: [{ t: 1.4, do: 'sfx', name: 'cheer' }], lines: [{ who: 'Technician Rowan', text: 'A routine he can run whenever he needs it. That is what a function is for.' }] }),

  // ---- the finale of the bay: Bolt stands
  'bolt-awake': {
    id: 'bolt-awake', len: 14,
    cues: [
      { t: 0, do: 'cam', at: { prop: 'bolt' }, dist: 8.5, yaw: 0.3, pitch: 0.4, height: 1.3, blend: 1.6 },
      { t: 0.3, do: 'npc', id: 'juno', face: { prop: 'bolt' }, look: { prop: 'bolt' }, mood: 'focused' },
      { t: 0.3, do: 'npc', id: 'rowan', face: { prop: 'bolt' }, look: { prop: 'bolt' } },
      { t: 1.2, do: 'say', who: 'Mentor Juno', text: 'Every module is in. Run it.', for: 2.4 },
      { t: 2.2, do: 'sfx', name: 'power' },
      { t: 2.4, do: 'shake', amount: 0.12 },
      { t: 2.6, do: 'prop', id: 'bolt', state: 'awake' },
      { t: 2.6, do: 'flash', at: { prop: 'bolt' }, color: 0x7dffb3, power: 12, dur: 1.2, y: 1.4 },
      { t: 3.0, do: 'cam', at: { prop: 'bolt' }, dist: 7, yaw: 0.1, pitch: 0.18, height: 1.5, blend: 3.0 },
      { t: 4.6, do: 'sfx', name: 'success' },
      { t: 5.0, do: 'fx', kind: 'confetti', at: { prop: 'bolt' }, n: 42, y: 2.2 },
      { t: 5.2, do: 'npc', id: 'rowan', anim: 'cheer', mood: 'happy' },
      { t: 5.4, do: 'npc', id: 'juno', anim: 'cheer', mood: 'happy' },
      { t: 6.0, do: 'say', who: 'Bolt-7', text: 'Systems online. Hello, programmer.', for: 3 },
      { t: 6.1, do: 'prop', id: 'bolt', play: 'talk' },
      { t: 9.3, do: 'say', who: 'Technician Rowan', text: 'Eleven years I have been fixing robots, and I still get a lump in my throat.', for: 3.4 },
      { t: 12.6, do: 'cam', at: 'player', blend: 1.8 },
      { t: 13.0, do: 'npc', id: 'juno', mood: 'neutral', look: null },
      { t: 13.0, do: 'npc', id: 'rowan', mood: 'neutral', look: null },
    ],
  },
};

/* ------------------------------------------------------------------ one beat per world change (every world uses the same shape) */

interface Beat {
  /** The prop that changes, and the state it enters. `also` lists other props set to a state at the same moment (a cascade of lanterns). */
  prop: string; state: string; also?: { id: string; state: string }[];
  /** The person who reacts (an NPC id in the scene) and what they say. */
  npc?: string; who?: string; line?: string; anim?: OneShot;
  dist?: number; yaw?: number; pitch?: number; height?: number;
  fx?: FxKind; fxN?: number; sfx?: Sfx; flash?: number; shake?: number;
  /** The player gestures as it happens (casting a spell). */
  player?: OneShot;
}

/** Camera to the thing, a breath, the change with its light/sound/particles, the person's reaction and line, camera back. About 6-8 seconds. */
function beat(id: string, b: Beat): Cinematic {
  const cues: Cue[] = [
    { t: 0, do: 'cam', at: { prop: b.prop }, dist: b.dist ?? 7, yaw: b.yaw ?? 0.3, pitch: b.pitch ?? 0.3, height: b.height ?? 1.5, blend: 1.4 },
    ...(b.npc ? [{ t: 0.3, do: 'npc', id: b.npc, face: { prop: b.prop }, look: { prop: b.prop } } as Cue] : []),
    ...(b.player ? [{ t: 0.9, do: 'player', anim: b.player, face: { prop: b.prop } } as Cue] : []),
    ...(b.sfx ? [{ t: 1.3, do: 'sfx', name: b.sfx } as Cue] : []),
    { t: 1.4, do: 'prop', id: b.prop, state: b.state },
    ...(b.also ?? []).map((a, i): Cue => ({ t: 1.4 + 0.18 * (i + 1), do: 'prop', id: a.id, state: a.state })),
    ...(b.fx ? [{ t: 1.5, do: 'fx', kind: b.fx, at: { prop: b.prop }, n: b.fxN ?? 26 } as Cue] : []),
    ...(b.flash ? [{ t: 1.5, do: 'flash', at: { prop: b.prop }, color: b.flash, power: 11, dur: 0.7 } as Cue] : []),
    ...(b.shake ? [{ t: 1.5, do: 'shake', amount: b.shake } as Cue] : []),
    ...(b.npc && b.anim !== undefined ? [{ t: 2.3, do: 'npc', id: b.npc, anim: b.anim, mood: 'happy' } as Cue] : []),
    ...(b.line ? [{ t: 2.5, do: 'say', who: b.who, text: b.line, for: 3.4 } as Cue] : []),
  ];
  const end = b.line ? 6.3 : 4.2;
  return { id, cues: [...cues, { t: end, do: 'cam', at: 'player', blend: 1.4 }, ...(b.npc ? [{ t: end + 0.2, do: 'npc', id: b.npc, mood: 'neutral', look: null } as Cue] : [])], len: end + 1.6 };
}

const BEATS: Record<string, Beat> = {
  // Lanternhollow: runes raise the hall
  'acad-banner': { prop: 'banner', state: 'unfurl', npc: 'bram', who: 'Tutor Bram', line: 'A heading is a promise about what comes next. The hall just kept it.', anim: 'cheer', fx: 'magic', sfx: 'whoosh', flash: 0xbd93f9, dist: 8, height: 3 },
  'acad-portal-frame': { prop: 'portal', state: 'frame', npc: 'bram', who: 'Tutor Bram', line: 'Stones rising in the order you wrote them. Lists keep their order, and so does the hall.', anim: 'nod', fx: 'dust', sfx: 'crack', shake: 0.25, dist: 8 },
  'acad-portal-open': { prop: 'portal', state: 'open', npc: 'bram', who: 'Tutor Bram', line: 'A form that works opens a door. Mind what goes through it.', anim: 'cheer', fx: 'magic', fxN: 40, sfx: 'spell', flash: 0x8be9fd, dist: 8 },
  'acad-crest': { prop: 'crest', state: 'on', npc: 'bram', who: 'Tutor Bram', line: 'The Trial of Runes, passed with no hints. The crest shines for you.', anim: 'cheer', fx: 'magic', sfx: 'success', flash: 0xffd166, dist: 7, height: 3 },
  'acad-dome-color': { prop: 'dome', state: 'color', npc: 'bram', who: 'Tutor Bram', line: 'You chose the colour; the ward obeys. Selectors say which things, and the style says how.', anim: 'nod', fx: 'magic', sfx: 'spell', flash: 0x4fd1ff, dist: 12, height: 2 },
  'acad-dome-thick': { prop: 'dome', state: 'thick', npc: 'bram', who: 'Tutor Bram', line: 'Padding, border, margin: every box has layers, and now the ward does too.', anim: 'nod', fx: 'shield', sfx: 'spell', dist: 12, height: 2 },
  'acad-runes-align': { prop: 'runes', state: 'align', npc: 'bram', who: 'Tutor Bram', line: 'Flexbox: one line, one direction, and the glyphs fall in.', anim: 'cheer', fx: 'magic', sfx: 'whoosh', dist: 8 },
  'acad-runes-grid': { prop: 'runes', state: 'grid', npc: 'bram', who: 'Tutor Bram', line: 'Rows and columns together. Grid is flexbox in two directions.', anim: 'cheer', fx: 'magic', sfx: 'whoosh', dist: 8 },
  'acad-dome-adapt': { prop: 'dome', state: 'adapt', npc: 'bram', who: 'Tutor Bram', line: 'It fits the hall however the hall is shaped. That is responsive design.', anim: 'nod', fx: 'shield', sfx: 'spell', dist: 12, height: 2 },
  'acad-dome-aegis': { prop: 'dome', state: 'aegis', npc: 'bram', who: 'Tutor Bram', line: 'The Aegis: complete, teal and whole. You built that with nothing but your own reasoning.', anim: 'cheer', fx: 'magic', fxN: 50, sfx: 'success', flash: 0x2dd4bf, dist: 12, height: 2 },
  // the Dueling Ring
  'arena-shield': { prop: 'shield', state: 'raise', npc: 'nim', who: 'Apprentice Nim', line: 'It caught the error! That is what handling one means: expecting it, and surviving it.', anim: 'cheer', fx: 'shield', fxN: 40, sfx: 'spell', flash: 0x2dd4bf, dist: 7 },
  'arena-orb': { prop: 'orb', state: 'spark', npc: 'nim', who: 'Apprentice Nim', line: 'Your first incantation, running. The orb woke up!', anim: 'cheer', fx: 'magic', fxN: 36, sfx: 'spell', flash: 0xbd93f9, dist: 6 },
  'arena-hit1': { prop: 'hound', state: 'hit1', npc: 'nim', who: 'Apprentice Nim', line: 'A clean hit! It recoiled!', anim: 'cheer', fx: 'sparks', sfx: 'hit', flash: 0xff79c6, shake: 0.3, player: 'cast', dist: 9 },
  'arena-hit2': { prop: 'hound', state: 'hit2', npc: 'nim', who: 'Apprentice Nim', line: 'A click casts it. The Gloomhound staggers.', anim: 'cheer', fx: 'sparks', sfx: 'hit', flash: 0xff79c6, shake: 0.3, player: 'cast', dist: 9 },
  'arena-hit3': { prop: 'hound', state: 'hit3', npc: 'nim', who: 'Apprentice Nim', line: 'The form spell landed! Listen to it howl.', anim: 'cheer', fx: 'sparks', sfx: 'hit', flash: 0xff79c6, shake: 0.35, player: 'cast', dist: 9 },
  'arena-hit4': { prop: 'hound', state: 'hit4', npc: 'nim', who: 'Apprentice Nim', line: 'Right on time. It is nearly gone.', anim: 'cheer', fx: 'sparks', sfx: 'hit', flash: 0xff79c6, shake: 0.4, player: 'cast', dist: 9 },
  'arena-oracle': { prop: 'oracle', state: 'answer', npc: 'nim', who: 'Apprentice Nim', line: 'Your request went out and an answer came back. The oracle talks to you!', anim: 'cheer', fx: 'magic', fxN: 40, sfx: 'spell', dist: 7 },
  'arena-defeat': { prop: 'hound', state: 'defeat', npc: 'nim', who: 'Apprentice Nim', line: 'It is gone. The Dueling Ring is safe, and you did that with spells that really work.', anim: 'cheer', fx: 'confetti', fxN: 50, sfx: 'success', flash: 0xffffff, shake: 0.5, player: 'cast', dist: 10 },
  // Harborview Park: the numbers become a team
  'park-lineup': { prop: 'team', state: 'set', also: [{ id: 'scoreboard', state: 'on' }], npc: 'reyes', who: 'Coach Reyes', line: 'Nine names in the order the data chose. Take the field!', anim: 'cheer', fx: 'confetti', fxN: 40, sfx: 'cheer', dist: 24, pitch: 0.5, height: 1 },
  // the analytics office: boards fill in
  'office-roster': { prop: 'roster-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Thirty-eight players, six teams, all in one table. Now we can ask it questions.', anim: 'nod', fx: 'magic', sfx: 'chime', dist: 6 },
  'office-ranking': { prop: 'ranking-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Ordered, best first. Sorting is how a pile of numbers starts to say something.', anim: 'nod', fx: 'magic', sfx: 'chime', dist: 6 },
  'office-clean': { prop: 'clean-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Missing is not zero. Good: you flagged the gaps instead of hiding them.', anim: 'cheer', fx: 'magic', sfx: 'chime', dist: 6 },
  'office-stats': { prop: 'stats-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Totals and averages: a whole season in one glance.', anim: 'nod', fx: 'magic', sfx: 'chime', dist: 6 },
  'office-positions': { prop: 'positions-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Group by position, and the pattern appears. That is aggregation.', anim: 'nod', fx: 'magic', sfx: 'chime', dist: 6 },
  'office-lineup': { prop: 'lineup-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Lineup set. The card goes to Coach Reyes: your analysis, on the field.', anim: 'cheer', fx: 'confetti', fxN: 30, sfx: 'success', dist: 6 },
  // Redline Raceway: the data becomes a car that behaves differently
  'car-tyres': { prop: 'car', state: 'tyres', npc: 'marisol', who: 'Crew Chief Marisol', line: 'Fresh rubber at the pressures your spreadsheet found. Look at the banding.', anim: 'nod', fx: 'sparks', sfx: 'servo', flash: 0xffd166, dist: 8, yaw: 0.9, pitch: 0.2, height: 0.8 },
  'car-brakes': { prop: 'car', state: 'brakes', npc: 'marisol', who: 'Crew Chief Marisol', line: 'Brakes balanced: the discs glow because they are finally doing equal work.', anim: 'nod', fx: 'ember', sfx: 'servo', flash: 0xff7b00, dist: 6, yaw: 1.1, pitch: 0.18, height: 0.8 },
  'car-fuel': { prop: 'car', state: 'fuel', npc: 'marisol', who: 'Crew Chief Marisol', line: 'The right load, no more: weight you do not need costs you tenths every lap.', anim: 'nod', fx: 'steam', sfx: 'servo', flash: 0xffa64d, dist: 7, yaw: 2.6, pitch: 0.2, height: 0.8 },
  'car-aero': { prop: 'car', state: 'aero', npc: 'marisol', who: 'Crew Chief Marisol', line: 'Bigger wings: more grip through the corners, a little less at the end of the straight. That trade is yours.', anim: 'cheer', fx: 'magic', sfx: 'servo', flash: 0x4fd1ff, dist: 7, yaw: 2.4, pitch: 0.25, height: 1.2 },
  'arena-lanterns': { prop: 'ring-0', state: 'light', also: [1, 2, 3, 4, 5].map((i) => ({ id: `ring-${i}`, state: 'light' })), npc: 'nim', who: 'Apprentice Nim', line: 'You changed the page itself, and the lanterns light one after another around the ring.', anim: 'cheer', fx: 'magic', fxN: 30, sfx: 'spell', dist: 14, height: 1.5, pitch: 0.45 },
};
// the Summit: a guardian's beacon lights (one cinematic per guardian)
for (const g of ['python', 'sql', 'works', 'web', 'analytics', 'sheets', 'r']) BEATS[`summit-beacon-${g}`] = { prop: `b-${g}`, state: 'light', npc: 'aurel', who: 'Keeper Aurel', line: 'Another beacon answers. The mountain remembers what you can really do.', anim: 'cheer', fx: 'ember', fxN: 40, sfx: 'chime', flash: 0xffc27a, dist: 14, height: 3 };
for (const [id, b] of Object.entries(BEATS)) CINEMATICS[id] = beat(id, b);

/* ------------------------------------------------------------------ quest completions and level-ups */

/** What the person who gave the quest says when it is finished. Written in their voice; never an answer to anything. */
const QUEST_LINES: Record<string, string> = {
  'q-bay-briefing': 'His display is on. That was your program. Rowan has the next job.',
  'q-bay-repair': 'An arm, a charge and a voice. Three faults, and you read each one before you touched it.',
  'q-bay-brain': 'Numbers, hearing, decisions, loops. He can react now. One stage left.',
  'q-bay-awaken': 'He stands on your code. Remember why it worked: that is the skill, not the program.',
  'q-floor-line': 'The line is moving. Gate, belt, arm and scanner. My shift just got a lot quieter.',
  'q-floor-logs': 'Logs readable, dashboard lit, jam fixed. You kept a production line alive.',
  'q-lantern-briefing': 'The first lanterns answer to your runes. The rest of the work is a matter of care.',
  'q-lantern-wards': 'The wards hold, and they look good doing it. Well made.',
  'q-lantern-duel': 'The Gloomhound is gone. You wrote incantations that really work: that is more than most.',
  'q-park-numbers': 'Numbers that tell a story. Now we can pick a lineup on evidence, not on hunches.',
  'q-park-lineup': 'Nine names in an order the data chose. Let us see how the Herons play it.',
  'q-race-setup': 'Telemetry does not lie, and now neither does the car. Look at that grip.',
  'q-race-fast': 'That lap time is yours. Every tenth came from something you measured.',
};

const npcIdByName = (name: string): string | undefined => cast.find((n) => n.name === name)?.id;

export function questComplete(questId: string): Cinematic | undefined {
  const q = quests.find((x) => x.id === questId); if (!q) return undefined;
  const giver = npcIdByName(q.giver);
  const reward = [q.reward.xp ? `+${q.reward.xp} XP` : '', q.reward.coins ? `+${q.reward.coins} coins` : ''].filter(Boolean).join('  ·  ');
  const line = QUEST_LINES[q.id] ?? 'Well done. That was real work.';
  const cues: Cue[] = [
    { t: 0, do: 'sfx', name: 'quest' },
    { t: 0.1, do: 'banner', title: q.title, sub: reward, kind: 'quest' },
    { t: 0.2, do: 'player', anim: 'cheer', mood: 'happy' },
    { t: 0.3, do: 'fx', kind: 'confetti', at: { player: true }, n: 36, y: 2.2 },
    { t: 0.5, do: 'flash', at: { player: true }, color: 0xffd166, power: 9, dur: 0.8, y: 2 },
  ];
  if (giver) cues.push({ t: 1.2, do: 'npc', id: giver, anim: 'cheer', mood: 'happy', look: { player: true } }, { t: 1.6, do: 'say', who: q.giver, text: line, for: 3.4 }, { t: 5.2, do: 'npc', id: giver, mood: 'neutral', look: null });
  else cues.push({ t: 1.6, do: 'say', who: q.giver, text: line, for: 3.4 });
  cues.push({ t: 5.4, do: 'player', mood: 'neutral', look: null });
  return { id: `quest:${questId}`, cues, len: 5.8 };
}

export function levelUp(level: number): Cinematic {
  return { id: `level:${level}`, len: 3.8, cues: [{ t: 0, do: 'sfx', name: 'success' }, { t: 0.1, do: 'banner', title: `Level ${level}`, sub: 'XP shows how far you have adventured, not what you can do: your Skills view shows that.', kind: 'level' }, { t: 0.2, do: 'player', anim: 'cheer' }, { t: 0.3, do: 'fx', kind: 'magic', at: { player: true }, n: 30, y: 1 }] };
}

/** The cinematic for a reaction id, `quest:<id>` or `level:<n>`. */
export function cinematicFor(ref: string): Cinematic | undefined {
  if (CINEMATICS[ref]) return CINEMATICS[ref];
  if (ref.startsWith('quest:')) return questComplete(ref.slice(6));
  if (ref.startsWith('level:')) return levelUp(Number(ref.slice(6)));
  return undefined;
}
