import type { Cinematic, Cue } from '../../play/logic/cinematic';
import type { FxKind } from '../../play/engine/fx';
import type { Sfx } from '../../play/engine/audio';
import type { OneShot } from '../../play/engine/rig';
import { quests } from '../world';
import { cast } from './cast';
import { BASEBALL_SEQUENCES } from './cinematics.baseball';
import { RACING_SEQUENCES } from './cinematics.racing';
import { OPENING_SHEETS } from './cinematics.opening';
import { MILESTONES } from './cinematics.milestones';
import { ENDING_SHEETS } from './cinematics.ending';
import { TRAINING_WINS } from './cinematics.training';

/**
 * THE CINEMATICS of the world: short cue sheets (see play/logic/cinematic.ts) that SHOW what the player's code just did. A scene's
 * `reactions[].cinematic` names one of these; quest completions look theirs up by `quest:<id>`. A cinematic only presents: it sets the same prop states the bare reaction would.
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

  // ---- the arm repair: the repair rig fetches the arm, carries it and welds it on. The sheet's clock waits for the machine (`await`), so the
  // camera is always on the right thing at the right moment however long a real arm takes to swing, lower and grip.
  'bolt-arm': {
    id: 'bolt-arm', len: 4.6,
    cues: [
      // establishing shot: the whole table, the rig and the technician
      { t: 0, do: 'cam', at: { at: [-5.6, -2.9, 1.2] }, dist: 9.5, yaw: 0.5, pitch: 0.4, height: 1.2, blend: 1.3 },
      { t: 0.2, do: 'npc', id: 'rowan', face: { prop: 'repair-rig' }, look: { prop: 'repair-rig' }, point: { prop: 'repair-rig' }, mood: 'focused' },
      { t: 0.4, do: 'say', who: 'Technician Rowan', text: 'Fault log is clean. Stand back: the rig takes it from here.', for: 1.8 },
      { t: 0.6, do: 'prop', id: 'repair-rig', play: 'wake' },
      { t: 0.7, do: 'await', id: 'repair-rig' },
      // the machine reaches for the loose arm: a medium shot with the gripper and the part in frame
      { t: 0.8, do: 'npc', id: 'rowan', release: true, look: { prop: 'bolt' }, face: { prop: 'bolt' } },
      { t: 0.8, do: 'cam', at: { at: [-5.0, -2.4, 1.4] }, dist: 5.4, yaw: 0.25, pitch: 0.3, height: 1.4, blend: 1.1 },
      { t: 0.9, do: 'prop', id: 'repair-rig', play: 'fetch' },
      { t: 1.0, do: 'await', id: 'repair-rig' },
      // carrying it across: a wider shot from the foot of the table so the whole sweep is seen
      { t: 1.1, do: 'cam', at: { at: [-5.2, -2.7, 1.5] }, dist: 6.4, yaw: -0.15, pitch: 0.3, height: 1.5, blend: 1.2 },
      { t: 1.2, do: 'prop', id: 'repair-rig', play: 'carry' },
      { t: 1.3, do: 'await', id: 'repair-rig' },
      // the weld: close on the shoulder, the torch coming in from the left
      { t: 1.4, do: 'cam', at: { at: [-4.8, -2.7, 1.3] }, dist: 3.0, yaw: -0.4, pitch: 0.22, height: 1.3, blend: 0.8 },
      { t: 1.5, do: 'prop', id: 'repair-rig', play: 'weld' },
      { t: 1.6, do: 'prop', id: 'bolt', state: 'arm' },
      { t: 1.7, do: 'shake', amount: 0.12 },
      { t: 1.8, do: 'await', id: 'repair-rig' },
      { t: 1.9, do: 'flash', at: { prop: 'bolt' }, color: 0xffffff, power: 14, dur: 0.5, y: 1.3 },
      { t: 1.9, do: 'prop', id: 'repair-rig', play: 'retract' },
      // reaction: the technician, from the front
      { t: 2.1, do: 'cam', at: { npc: 'rowan' }, dist: 3.6, yaw: 1.3, pitch: 0.16, height: 1.5, blend: 1.0 },
      { t: 2.2, do: 'npc', id: 'rowan', anim: 'cheer', mood: 'happy', look: { prop: 'bolt' } },
      { t: 2.4, do: 'say', who: 'Technician Rowan', text: 'A fault log you could read, and a fault you fixed. That arm is yours.', for: 2.4 },
      { t: 2.8, do: 'prop', id: 'bolt', play: 'flex' },
      { t: 3.2, do: 'cam', at: { prop: 'bolt' }, dist: 5.2, yaw: 0.3, pitch: 0.28, height: 1.3, blend: 1.2 },
      { t: 4.2, do: 'cam', at: 'player', blend: 1.2 },
      { t: 4.4, do: 'npc', id: 'rowan', mood: 'neutral', look: null },
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
    id: 'bolt-awake', len: 9.6,
    cues: [
      { t: 0, do: 'cam', at: { prop: 'bolt' }, dist: 8.5, yaw: 0.3, pitch: 0.4, height: 1.3, blend: 1.3 },
      { t: 0.3, do: 'npc', id: 'juno', face: { prop: 'bolt' }, look: { prop: 'bolt' }, mood: 'focused' },
      { t: 0.3, do: 'npc', id: 'rowan', face: { prop: 'bolt' }, look: { prop: 'bolt' } },
      { t: 0.9, do: 'say', who: 'Mentor Juno', text: 'Every module is in. Run it.', for: 1.8 },
      { t: 1.6, do: 'sfx', name: 'power' },
      { t: 1.8, do: 'shake', amount: 0.12 },
      { t: 2.0, do: 'prop', id: 'bolt', state: 'awake' },
      { t: 2.0, do: 'flash', at: { prop: 'bolt' }, color: 0x7dffb3, power: 12, dur: 1.2, y: 1.4 },
      { t: 2.4, do: 'cam', at: { prop: 'bolt' }, dist: 6.2, yaw: 0.1, pitch: 0.18, height: 1.6, blend: 2.2 },
      { t: 3.6, do: 'sfx', name: 'success' },
      { t: 3.9, do: 'fx', kind: 'confetti', at: { prop: 'bolt' }, n: 42, y: 2.2 },
      { t: 4.0, do: 'npc', id: 'rowan', anim: 'cheer', mood: 'happy' },
      { t: 4.2, do: 'npc', id: 'juno', anim: 'cheer', mood: 'happy' },
      { t: 4.6, do: 'say', who: 'Bolt-7', text: 'Systems online. Hello, programmer.', for: 2.4 },
      { t: 4.7, do: 'prop', id: 'bolt', play: 'talk' },
      { t: 7.2, do: 'say', who: 'Technician Rowan', text: 'Eleven years fixing robots, and I still get a lump in my throat.', for: 2.4 },
      { t: 8.9, do: 'cam', at: 'player', blend: 1.4 },
      { t: 9.1, do: 'npc', id: 'juno', mood: 'neutral', look: null },
      { t: 9.1, do: 'npc', id: 'rowan', mood: 'neutral', look: null },
    ],
  },
};

/* ------------------------------------------------------------------ one beat per world change (every world uses the same shape) */

/**
 * How the camera treats a change. Every world change is a SHORT scene with the same grammar (establish, change, reaction, return) but not the
 * same camera: a screen fills in under a slow push, a machine or a car is circled while it changes, a hit lands from a low angle with a shake,
 * and a wide reveal shows a whole hall rising.
 */
type Style = 'reveal' | 'push' | 'orbit' | 'impact';

interface Beat {
  /** The prop that changes, and the state it enters. `also` lists other props set to a state at the same moment (a cascade of lanterns). */
  prop: string; state: string; also?: { id: string; state: string }[];
  /** The person who reacts (an NPC id in the scene) and what they say. */
  npc?: string; who?: string; line?: string; anim?: OneShot;
  dist?: number; yaw?: number; pitch?: number; height?: number;
  fx?: FxKind; fxN?: number; sfx?: Sfx; flash?: number; shake?: number;
  /** The player gestures as it happens (casting a spell). */
  player?: OneShot;
  style?: Style;
}

/** Establishing shot, the change (its own camera move, light, sound, particles), the person's reaction, then the camera hands back. About 4-6 seconds. */
function beat(id: string, b: Beat): Cinematic {
  const at = { prop: b.prop };
  const d = b.dist ?? 7, yaw = b.yaw ?? 0.3, pitch = b.pitch ?? 0.3, h = b.height ?? 1.5;
  const style = b.style ?? 'reveal';
  const change = style === 'impact' ? 1.0 : 1.2;
  const cues: Cue[] = [
    // establishing: a little wider than the detail, so the place and the thing are both read
    { t: 0, do: 'cam', at, dist: d * (style === 'push' ? 1.5 : 1.2), yaw, pitch: pitch + 0.05, height: h, blend: 0.9 },
    ...(b.npc ? [{ t: 0.25, do: 'npc', id: b.npc, face: at, look: at, mood: 'focused' } as Cue] : []),
    ...(b.player ? [{ t: change - 0.4, do: 'player', anim: b.player, face: at } as Cue] : []),
    ...(b.sfx ? [{ t: change - 0.1, do: 'sfx', name: b.sfx } as Cue] : []),
    { t: change, do: 'prop', id: b.prop, state: b.state },
    ...(b.also ?? []).map((a, i): Cue => ({ t: change + 0.15 * (i + 1), do: 'prop', id: a.id, state: a.state })),
    ...(b.fx ? [{ t: change + 0.1, do: 'fx', kind: b.fx, at, n: b.fxN ?? 26 } as Cue] : []),
    ...(b.flash ? [{ t: change + 0.1, do: 'flash', at, color: b.flash, power: 11, dur: 0.7 } as Cue] : []),
    ...(b.shake ? [{ t: change + 0.1, do: 'shake', amount: b.shake } as Cue] : []),
  ];
  // the camera's own move while it happens
  if (style === 'push') cues.push({ t: change - 0.1, do: 'cam', at, dist: d * 0.62, yaw: yaw * 0.6, pitch, height: h, blend: 1.7 });
  else if (style === 'orbit') cues.push({ t: change - 0.2, do: 'cam', at, dist: d * 0.85, yaw, pitch, height: h * 0.9, blend: 0.8, spin: 0.5 });
  else if (style === 'impact') cues.push({ t: change - 0.05, do: 'cam', at, dist: d * 0.7, yaw: yaw + 0.5, pitch: pitch * 0.45, height: h * 0.6, blend: 0.3 });
  else cues.push({ t: change + 0.4, do: 'cam', at, dist: d * 0.82, yaw: yaw + 0.15, pitch, height: h, blend: 1.4 });
  // reaction: the person has been watching; now they react and say one thing, while the camera eases back to show them
  const react = change + 1.1;
  if (b.npc && b.anim !== undefined) cues.push({ t: react, do: 'npc', id: b.npc, anim: b.anim, mood: 'happy' });
  if (b.line) cues.push({ t: react + 0.2, do: 'say', who: b.who, text: b.line, for: 2.8 });
  cues.push({ t: react, do: 'cam', at, dist: d * 1.05, yaw: yaw + 0.3, pitch, height: h, blend: 1.3 });
  const end = react + (b.line ? 3.0 : 0.9);
  return { id, cues: [...cues, { t: end, do: 'cam', at: 'player', blend: 1.2 }, ...(b.npc ? [{ t: end + 0.2, do: 'npc', id: b.npc, mood: 'neutral', look: null } as Cue] : [])], len: end + 1.3 };
}

const BEATS: Record<string, Beat> = {
  // Lanternhollow: runes raise the hall
  'acad-banner': { style: 'push', prop: 'banner', state: 'unfurl', npc: 'bram', who: 'Tutor Bram', line: 'A heading is a promise about what comes next. The hall just kept it.', anim: 'cheer', fx: 'magic', sfx: 'whoosh', flash: 0xbd93f9, dist: 8, height: 3 },
  'acad-portal-frame': { style: 'impact', prop: 'portal', state: 'frame', npc: 'bram', who: 'Tutor Bram', line: 'Stones rising in the order you wrote them. Lists keep their order, and so does the hall.', anim: 'nod', fx: 'dust', sfx: 'crack', shake: 0.25, dist: 8 },
  'acad-portal-open': { style: 'push', prop: 'portal', state: 'open', npc: 'bram', who: 'Tutor Bram', line: 'A form that works opens a door. Mind what goes through it.', anim: 'cheer', fx: 'magic', fxN: 40, sfx: 'spell', flash: 0x8be9fd, dist: 8 },
  'acad-crest': { style: 'orbit', prop: 'crest', state: 'on', npc: 'bram', who: 'Tutor Bram', line: 'The Trial of Runes, passed with no hints. The crest shines for you.', anim: 'cheer', fx: 'magic', sfx: 'success', flash: 0xffd166, dist: 7, height: 3 },
  'acad-dome-color': { style: 'orbit', prop: 'dome', state: 'color', npc: 'bram', who: 'Tutor Bram', line: 'You chose the colour; the ward obeys. Selectors say which things, and the style says how.', anim: 'nod', fx: 'magic', sfx: 'spell', flash: 0x4fd1ff, dist: 12, height: 2 },
  'acad-dome-thick': { style: 'orbit', prop: 'dome', state: 'thick', npc: 'bram', who: 'Tutor Bram', line: 'Padding, border, margin: every box has layers, and now the ward does too.', anim: 'nod', fx: 'shield', sfx: 'spell', dist: 12, height: 2 },
  'acad-runes-align': { style: 'push', prop: 'runes', state: 'align', npc: 'bram', who: 'Tutor Bram', line: 'Flexbox: one line, one direction, and the glyphs fall in.', anim: 'cheer', fx: 'magic', sfx: 'whoosh', dist: 8 },
  'acad-runes-grid': { style: 'push', prop: 'runes', state: 'grid', npc: 'bram', who: 'Tutor Bram', line: 'Rows and columns together. Grid is flexbox in two directions.', anim: 'cheer', fx: 'magic', sfx: 'whoosh', dist: 8 },
  'acad-dome-adapt': { style: 'orbit', prop: 'dome', state: 'adapt', npc: 'bram', who: 'Tutor Bram', line: 'It fits the hall however the hall is shaped. That is responsive design.', anim: 'nod', fx: 'shield', sfx: 'spell', dist: 12, height: 2 },
  'acad-dome-aegis': { style: 'orbit', prop: 'dome', state: 'aegis', npc: 'bram', who: 'Tutor Bram', line: 'The Aegis: complete, teal and whole. You built that with nothing but your own reasoning.', anim: 'cheer', fx: 'magic', fxN: 50, sfx: 'success', flash: 0x2dd4bf, dist: 12, height: 2 },
  // the Dueling Ring
  'arena-shield': { style: 'orbit', prop: 'shield', state: 'raise', npc: 'nim', who: 'Apprentice Nim', line: 'It caught the error! That is what handling one means: expecting it, and surviving it.', anim: 'cheer', fx: 'shield', fxN: 40, sfx: 'spell', flash: 0x2dd4bf, dist: 7 },
  'arena-orb': { style: 'push', prop: 'orb', state: 'spark', npc: 'nim', who: 'Apprentice Nim', line: 'Your first incantation, running. The orb woke up!', anim: 'cheer', fx: 'magic', fxN: 36, sfx: 'spell', flash: 0xbd93f9, dist: 6 },
  'arena-hit1': { style: 'impact', prop: 'hound', state: 'hit1', npc: 'nim', who: 'Apprentice Nim', line: 'A clean hit! It recoiled!', anim: 'cheer', fx: 'sparks', sfx: 'hit', flash: 0xff79c6, shake: 0.3, player: 'cast', dist: 9 },
  'arena-hit2': { style: 'impact', prop: 'hound', state: 'hit2', npc: 'nim', who: 'Apprentice Nim', line: 'A click casts it. The Gloomhound staggers.', anim: 'cheer', fx: 'sparks', sfx: 'hit', flash: 0xff79c6, shake: 0.3, player: 'cast', dist: 9 },
  'arena-hit3': { style: 'impact', prop: 'hound', state: 'hit3', npc: 'nim', who: 'Apprentice Nim', line: 'The form spell landed! Listen to it howl.', anim: 'cheer', fx: 'sparks', sfx: 'hit', flash: 0xff79c6, shake: 0.35, player: 'cast', dist: 9 },
  'arena-hit4': { style: 'impact', prop: 'hound', state: 'hit4', npc: 'nim', who: 'Apprentice Nim', line: 'Right on time. It is nearly gone.', anim: 'cheer', fx: 'sparks', sfx: 'hit', flash: 0xff79c6, shake: 0.4, player: 'cast', dist: 9 },
  'arena-oracle': { style: 'push', prop: 'oracle', state: 'answer', npc: 'nim', who: 'Apprentice Nim', line: 'Your request went out and an answer came back. The oracle talks to you!', anim: 'cheer', fx: 'magic', fxN: 40, sfx: 'spell', dist: 7 },
  'arena-defeat': { style: 'impact', prop: 'hound', state: 'defeat', npc: 'nim', who: 'Apprentice Nim', line: 'It is gone. The Dueling Ring is safe, and you did that with spells that really work.', anim: 'cheer', fx: 'confetti', fxN: 50, sfx: 'success', flash: 0xffffff, shake: 0.5, player: 'cast', dist: 10 },
  // Harborview Park: the numbers become a team
  'park-lineup': { prop: 'team', state: 'set', also: [{ id: 'scoreboard', state: 'on' }], npc: 'reyes', who: 'Coach Reyes', line: 'Nine names in the order the data chose. Take the field!', anim: 'cheer', fx: 'confetti', fxN: 40, sfx: 'cheer', dist: 24, pitch: 0.5, height: 1 },
  // the analytics office: boards fill in
  'office-roster': { style: 'push', prop: 'roster-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Thirty-eight players, six teams, all in one table. Now we can ask it questions.', anim: 'nod', fx: 'magic', sfx: 'chime', dist: 6 },
  'office-ranking': { style: 'push', prop: 'ranking-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Ordered, best first. Sorting is how a pile of numbers starts to say something.', anim: 'nod', fx: 'magic', sfx: 'chime', dist: 6 },
  'office-clean': { style: 'push', prop: 'clean-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Missing is not zero. Good: you flagged the gaps instead of hiding them.', anim: 'cheer', fx: 'magic', sfx: 'chime', dist: 6 },
  'office-stats': { style: 'push', prop: 'stats-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Totals and averages: a whole season in one glance.', anim: 'nod', fx: 'magic', sfx: 'chime', dist: 6 },
  'office-positions': { style: 'push', prop: 'positions-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Group by position, and the pattern appears. That is aggregation.', anim: 'nod', fx: 'magic', sfx: 'chime', dist: 6 },
  'office-lineup': { style: 'push', prop: 'lineup-board', state: 'on', npc: 'dara', who: 'Analyst Dara', line: 'Lineup set. The card goes to Coach Reyes: your analysis, on the field.', anim: 'cheer', fx: 'confetti', fxN: 30, sfx: 'success', dist: 6 },
  // the Manufacturing Floor: the line comes back, one machine at a time, each with its own way of being shown
  'floor-gate': { style: 'reveal', prop: 'floor-gate', state: 'open', npc: 'ori-floor', who: 'Engineer Ori', line: 'Gate is live. A trial with no hints: that is the real thing.', anim: 'cheer', fx: 'dust', sfx: 'door', dist: 9, yaw: 0.25, height: 1.6 },
  'floor-belt': { style: 'push', prop: 'belt', state: 'run', npc: 'ori-floor', who: 'Engineer Ori', line: 'Belt is moving. A list in, parts out, in the order you said.', anim: 'nod', fx: 'dust', sfx: 'servo', dist: 9, yaw: 0.5, pitch: 0.34, height: 0.8 },
  'floor-arms': { style: 'orbit', prop: 'arm-a', state: 'run', also: [{ id: 'arm-b', state: 'run' }], npc: 'ori-floor', who: 'Engineer Ori', line: 'Both arms off your catalogue. A name for every part, and they never mix them up.', anim: 'cheer', fx: 'sparks', sfx: 'servo', flash: 0xffb347, dist: 11, yaw: 0.2, pitch: 0.3, height: 1.4 },
  'floor-scanner': { style: 'push', prop: 'scanner', state: 'online', npc: 'ori-floor', who: 'Engineer Ori', line: 'Scanner reading every part. A record per crate: that is how it knows what it is looking at.', anim: 'nod', fx: 'magic', sfx: 'chime', flash: 0xff4d4d, dist: 8, yaw: 0.9, pitch: 0.22, height: 1.4 },
  'floor-precise': { style: 'orbit', prop: 'arm-a', state: 'precise', also: [{ id: 'arm-b', state: 'precise' }], npc: 'ori-floor', who: 'Engineer Ori', line: 'Smoother, faster, no wasted motion. Functions you can trust do that to a machine.', anim: 'nod', fx: 'magic', sfx: 'servo', dist: 11, yaw: 0.3, pitch: 0.3, height: 1.4 },
  'floor-repair': { style: 'impact', prop: 'belt', state: 'repair', npc: 'ori-floor', who: 'Engineer Ori', line: 'Forty minutes, every time, and you found it by reading. No more jams.', anim: 'cheer', fx: 'sparks', sfx: 'success', flash: 0x7dffb3, shake: 0.2, dist: 8, yaw: 0.7, pitch: 0.3, height: 0.8 },
  'floor-logs': { style: 'push', prop: 'logs-screen', state: 'on', npc: 'ori-floor', who: 'Engineer Ori', line: 'The machine logs, from the files themselves. Every jam, with a time.', anim: 'nod', fx: 'magic', sfx: 'chime', dist: 7, yaw: -0.6, pitch: 0.12, height: 1.7 },
  'floor-dashboard': { style: 'push', prop: 'dashboard', state: 'on', npc: 'ori-floor', who: 'Engineer Ori', line: 'Clean data on the dashboard. Output, uptime, all green, and all true.', anim: 'cheer', fx: 'confetti', fxN: 30, sfx: 'success', flash: 0x7dffb3, dist: 9, yaw: 0.1, pitch: 0.12, height: 2, },
  // Redline Raceway: the data becomes a car that behaves differently
  'car-tyres': { style: 'orbit', prop: 'car', state: 'tyres', npc: 'marisol', who: 'Crew Chief Marisol', line: 'Fresh rubber at the pressures your spreadsheet found. Look at the banding.', anim: 'nod', fx: 'sparks', sfx: 'servo', flash: 0xffd166, dist: 8, yaw: 0.9, pitch: 0.2, height: 0.8 },
  'car-brakes': { style: 'orbit', prop: 'car', state: 'brakes', npc: 'marisol', who: 'Crew Chief Marisol', line: 'Brakes balanced: the discs glow because they are finally doing equal work.', anim: 'nod', fx: 'ember', sfx: 'servo', flash: 0xff7b00, dist: 6, yaw: 1.1, pitch: 0.18, height: 0.8 },
  'car-fuel': { style: 'orbit', prop: 'car', state: 'fuel', npc: 'marisol', who: 'Crew Chief Marisol', line: 'The right load, no more: weight you do not need costs you tenths every lap.', anim: 'nod', fx: 'steam', sfx: 'servo', flash: 0xffa64d, dist: 7, yaw: 2.6, pitch: 0.2, height: 0.8 },
  'car-aero': { style: 'orbit', prop: 'car', state: 'aero', npc: 'marisol', who: 'Crew Chief Marisol', line: 'Bigger wings: more grip through the corners, a little less at the end of the straight. That trade is yours.', anim: 'cheer', fx: 'magic', sfx: 'servo', flash: 0x4fd1ff, dist: 7, yaw: 2.4, pitch: 0.25, height: 1.2 },
  'arena-lanterns': { style: 'reveal', prop: 'ring-0', state: 'light', also: [1, 2, 3, 4, 5].map((i) => ({ id: `ring-${i}`, state: 'light' })), npc: 'nim', who: 'Apprentice Nim', line: 'You changed the page itself, and the lanterns light one after another around the ring.', anim: 'cheer', fx: 'magic', fxN: 30, sfx: 'spell', dist: 14, height: 1.5, pitch: 0.45 },
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
  if (giver) cues.push({ t: 0.9, do: 'npc', id: giver, anim: 'cheer', mood: 'happy', look: { player: true } }, { t: 1.1, do: 'say', who: q.giver, text: line, for: 2.8 }, { t: 3.7, do: 'npc', id: giver, mood: 'neutral', look: null });
  else cues.push({ t: 1.1, do: 'say', who: q.giver, text: line, for: 2.8 });
  cues.push({ t: 3.8, do: 'player', mood: 'neutral', look: null });
  return { id: `quest:${questId}`, cues, len: 4.2 };
}

/**
 * TRAINING: plays by itself when a failure sends the player to the Simulation Room (no button between arriving and the console). Sana walks
 * over, the camera frames the console, the player does the kind of work the plan is about, the machines answer, and a banner says what the
 * plan will do. Short on purpose: it is a transition into work, not a reward, and nothing in it is a mastery claim.
 */
function training(kind: string, o: { act: Cue[]; light: number; line: string; cam?: number; fx?: Cue[] }): Cinematic {
  const cues: Cue[] = [
    { t: 0, do: 'cam', at: { npc: 'sana-sim' }, dist: 5.2, yaw: 0.6, pitch: 0.22, height: 1.5, blend: 0.9 },
    { t: 0.2, do: 'npc', id: 'sana-sim', walk: [-1.9, -1.9], mood: 'focused' },
    { t: 1.1, do: 'cam', at: { at: [-0.5, -2.2, 1.0] }, dist: o.cam ?? 5.0, yaw: 0.85, pitch: 0.2, height: 1.3, blend: 1.3 },
    { t: 1.5, do: 'npc', id: 'sana-sim', face: { at: [0, -2.6] }, look: { at: [0, -2.6, 1.4] }, anim: 'point' },
    { t: 1.8, do: 'say', who: 'Analyst Sana', text: o.line, for: 3 },
    ...o.act,
    { t: 3.6, do: 'sfx', name: 'power' },
    { t: 3.7, do: 'flash', at: { at: [0, -1.6] }, color: o.light, power: 9, dur: 0.9, y: 1.4 },
    ...(o.fx ?? []),
    { t: 4.6, do: 'npc', id: 'sana-sim', anim: 'nod', mood: 'happy' },
    { t: 4.8, do: 'banner', title: 'Training plan ready', sub: 'Each step you finish earns Focus back. You return to exactly where you stopped.', kind: 'info' },
    { t: 5.8, do: 'cam', at: 'player', blend: 1.0 },
    { t: 6.2, do: 'npc', id: 'sana-sim', mood: 'neutral', look: null },
  ];
  return { id: `training:${kind}`, cues, len: 7 };
}

Object.assign(CINEMATICS, BASEBALL_SEQUENCES, RACING_SEQUENCES, OPENING_SHEETS, MILESTONES, ENDING_SHEETS);
for (const [k, c] of Object.entries(TRAINING_WINS)) CINEMATICS[`trainwin:${k}`] = c;

CINEMATICS['training:python'] = training('python', {
  line: 'Predict first, then run it. A program shows what it does, not what you meant.', light: 0x4fd1ff,
  act: [{ t: 2.4, do: 'player', face: { at: [0, -1.6] }, anim: 'type' }, { t: 3.2, do: 'sfx', name: 'click' }],
  fx: [{ t: 3.8, do: 'fx', kind: 'magic', at: { at: [0, -1.6] }, n: 14, y: 1.5 }],
});
CINEMATICS['training:data'] = training('data', {
  line: 'Look at the rows before you trust the query. What should come back, and what did?', light: 0x7dffb3, cam: 4.6,
  act: [{ t: 2.4, do: 'player', face: { at: [0, -1.6] }, anim: 'think' }, { t: 3.1, do: 'player', anim: 'point' }, { t: 3.2, do: 'sfx', name: 'chime' }],
  fx: [{ t: 3.8, do: 'fx', kind: 'heal', at: { at: [-7, 3] }, n: 16, y: 1.4 }, { t: 3.9, do: 'flash', at: { at: [-7, 3] }, color: 0x7dffb3, power: 6, dur: 0.8, y: 1.6 }],
});
CINEMATICS['training:web'] = training('web', {
  line: 'Open the page and click it like a visitor would. The browser is the judge.', light: 0xff79c6,
  act: [{ t: 2.4, do: 'player', face: { at: [0, -1.6] }, anim: 'interact' }, { t: 3.1, do: 'player', anim: 'type' }, { t: 3.2, do: 'sfx', name: 'interact' }],
  fx: [{ t: 3.8, do: 'fx', kind: 'sparks', at: { at: [6, -5] }, n: 14, y: 1.8 }, { t: 3.9, do: 'flash', at: { at: [6, -5] }, color: 0xff79c6, power: 6, dur: 0.8, y: 1.8 }],
});
CINEMATICS['training:stats'] = training('stats', {
  line: 'Say the method and the denominator out loud before you compute anything.', light: 0xffd166,
  act: [{ t: 2.4, do: 'player', face: { at: [0, -1.6] }, anim: 'stretch' }, { t: 3.2, do: 'sfx', name: 'chime' }],
  fx: [{ t: 3.8, do: 'fx', kind: 'ember', at: { at: [2, -6] }, n: 14, y: 1.6 }, { t: 3.9, do: 'flash', at: { at: [2, -6] }, color: 0xffd166, power: 6, dur: 0.8, y: 1.6 }],
});
CINEMATICS['training:sheet'] = training('sheet', {
  line: 'Change one input and watch what moves. If nothing moves, the formula is not connected.', light: 0x9fe8ff,
  act: [{ t: 2.4, do: 'player', face: { at: [0, -1.6] }, anim: 'work' }, { t: 3.2, do: 'sfx', name: 'servo' }],
  fx: [{ t: 3.8, do: 'fx', kind: 'shield', at: { at: [-2, -6] }, n: 14, y: 1.4 }],
});

/** The cinematic for a reaction id or `quest:<id>`. (A level-up is a banner, not a cutscene: the stage shows it without taking control.) */
export function cinematicFor(ref: string): Cinematic | undefined {
  if (CINEMATICS[ref]) return CINEMATICS[ref];
  if (ref.startsWith('quest:')) return questComplete(ref.slice(6));
  return undefined;
}
