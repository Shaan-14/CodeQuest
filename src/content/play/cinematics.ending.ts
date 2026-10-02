import type { Cinematic, Cue } from '../../play/logic/cinematic';

/**
 * THE ENDING, the answer to the opening. The Great Outage is over: the summit, then each world waking from the dark in the same order it failed,
 * the plaza with its core and its four lanes lighting up, the credits over that plaza, and a last quiet scene among the people who were there.
 * Every scene here is the real world at the end of the campaign (`campaign.completedAt` restores every district), so nothing in it is faked: the
 * restoration it shows is the one the player's evidence has earned, and a skipped ending leaves the same world.
 */
const JUNO = 'Mentor Juno', AUREL = 'Keeper Aurel';
const gate = (t: number, at: [number, number], color: number): Cue[] => [{ t, do: 'flash', at: { at }, color, power: 18, dur: 0.9, y: 3.4 }, { t, do: 'sfx', name: 'chime' }];

export const ENDING_SHEETS: Record<string, Cinematic> = {
  // ---- the summit: the task is done; a held breath; then the whole city answers
  'ending:summit': {
    id: 'ending:summit', len: 11.4,
    cues: [
      { t: 0, do: 'cam', at: { player: true }, dist: 5.2, yaw: 0.35, pitch: 0.14, height: 1.5, blend: 1.2 },
      { t: 0.2, do: 'music', name: null, fade: 1.2 },
      { t: 0.4, do: 'player', face: { prop: 'b-great' }, look: { prop: 'b-great' } },
      // the pause: nothing happens, and everyone knows it is about to
      { t: 2.2, do: 'npc', id: 'aurel', face: { player: true }, look: { player: true }, mood: 'happy' },
      { t: 2.6, do: 'say', who: AUREL, text: 'Listen.', for: 2.0 },
      { t: 4.4, do: 'cam', at: { at: [0, -14, 6] }, dist: 24, yaw: 0, pitch: 0.3, height: 6, blend: 2.4 },
      { t: 4.8, do: 'sfx', name: 'surge' }, { t: 4.9, do: 'music', name: 'dawn', fade: 2.2 },
      { t: 5.0, do: 'flash', at: { prop: 'b-great' }, color: 0xffd166, power: 30, dur: 1.6, y: 10 },
      { t: 5.2, do: 'say', who: AUREL, text: 'That is the sound of every district answering at once.', for: 3.6 },
      { t: 6.6, do: 'fx', kind: 'magic', at: { prop: 'b-great' }, n: 40, y: 8 },
      { t: 7.4, do: 'cam', at: { at: [0, -8, 4] }, dist: 36, yaw: 0.2, pitch: 0.5, height: 5, blend: 3 },
      { t: 8.6, do: 'sfx', name: 'swell' },
      { t: 9.0, do: 'banner', title: 'The Great Outage is over', sub: 'Every district is answering. Watch them wake.', kind: 'info' },
    ],
  },
  // ---- robotics: the line starts, arm by arm
  'ending:robotics': {
    id: 'ending:robotics', len: 7,
    cues: [
      { t: 0, do: 'cam', at: { at: [0, -2.4, 1] }, dist: 12, yaw: 1.2, pitch: 0.25, height: 1.6, blend: 0.05 },
      { t: 0.3, do: 'sfx', name: 'surge' }, { t: 0.5, do: 'power', k: 1, over: 2.4, motion: 1 },
      { t: 0.8, do: 'flash', at: { prop: 'arm-a' }, color: 0x7dffb3, power: 12, dur: 0.8, y: 2 }, { t: 1.0, do: 'flash', at: { prop: 'arm-b' }, color: 0x7dffb3, power: 12, dur: 0.8, y: 2 },
      { t: 1.8, do: 'cam', at: { prop: 'arm-b' }, dist: 6, yaw: 0.5, pitch: 0.16, height: 1.5, blend: 1.4 }, { t: 1.9, do: 'sfx', name: 'servo' }, { t: 2.2, do: 'fx', kind: 'sparks', at: { prop: 'arm-b' }, n: 18, y: 2.2 },
      { t: 3.2, do: 'cam', at: { at: [0, -2.4, 1] }, dist: 8, yaw: -1.2, pitch: 0.18, height: 1.0, blend: 1.6 },
      { t: 3.8, do: 'npc', id: 'ori-floor', anim: 'cheer', mood: 'happy', look: { prop: 'belt' } }, { t: 3.9, do: 'say', who: 'Engineer Ori', text: 'The line is moving. Look at that belt go.', for: 3 },
      { t: 5.2, do: 'cam', at: { prop: 'dashboard' }, dist: 12, yaw: 0, pitch: 0.1, height: 2.4, blend: 1.2 }, { t: 5.4, do: 'banner', title: 'Robotics Academy', sub: 'Online', kind: 'info' },
    ],
  },
  'ending:ballpark': {
    id: 'ending:ballpark', len: 9.4,
    cues: [
      { t: 0, do: 'cam', at: { at: [0, -4] }, dist: 34, yaw: 0.3, pitch: 0.3, height: 3, blend: 0.05 },
      { t: 0.3, do: 'sfx', name: 'surge' }, { t: 0.4, do: 'power', k: 1, over: 2.6, motion: 1 }, { t: 0.8, do: 'sfx', name: 'crowd' },
      { t: 1.8, do: 'cam', at: { at: [0, -3.4] }, dist: 4.8, yaw: 0.5, pitch: 0.14, height: 1.5, blend: 0.5 },
      { t: 2.1, do: 'prop', id: 'team', play: 'seq:homerun:3' },
      { t: 2.65, do: 'cam', at: { at: [-0.4, 6] }, dist: 5, yaw: -1.2, pitch: 0.12, height: 1.3, blend: 0.4 },
      { t: 3.15, do: 'cam', at: { prop: 'team' }, follow: true, dist: 11, yaw: 0.25, pitch: 0.22, blend: 0.5 },
      { t: 5.6, do: 'cam', at: { at: [0, -4] }, dist: 30, yaw: 0.35, pitch: 0.3, height: 2, blend: 1.4 },
      { t: 6.1, do: 'sfx', name: 'cheer' }, { t: 6.1, do: 'fx', kind: 'confetti', at: { at: [-9.5, 14] }, n: 34, y: 4 }, { t: 6.1, do: 'fx', kind: 'confetti', at: { at: [9.5, 14] }, n: 34, y: 4 },
      { t: 6.6, do: 'cam', at: { prop: 'scoreboard' }, dist: 26, yaw: 0, pitch: 0.12, height: 5, blend: 1.0 },
      { t: 6.8, do: 'prop', id: 'scoreboard', play: 'text:HARBORVIEW PARK|ALL SYSTEMS ONLINE|PLAY BALL' },
      { t: 7.3, do: 'npc', id: 'reyes', anim: 'salute', mood: 'happy' },
    ],
  },
  'ending:web': {
    id: 'ending:web', len: 7,
    cues: [
      { t: 0, do: 'cam', at: { at: [0, -3, 2] }, dist: 11, yaw: 0.25, pitch: 0.14, height: 2.2, blend: 0.05 },
      { t: 0.3, do: 'sfx', name: 'surge' }, { t: 0.4, do: 'power', k: 1, over: 2.4, motion: 1 }, { t: 0.9, do: 'sfx', name: 'spell' },
      { t: 1.2, do: 'prop', id: 'crest', play: 'text:LANTERNHOLLOW|CONNECTED' },
      { t: 1.8, do: 'cam', at: { prop: 'portal' }, dist: 7, yaw: 0.5, pitch: 0.15, height: 1.8, blend: 1.4 }, { t: 2.0, do: 'fx', kind: 'magic', at: { prop: 'portal' }, n: 30, y: 1.8 },
      { t: 3.4, do: 'cam', at: { prop: 'runes' }, dist: 7, yaw: -0.4, pitch: 0.3, height: 1.5, blend: 1.4 }, { t: 3.6, do: 'sfx', name: 'chime' },
      { t: 4.2, do: 'npc', id: 'bram', anim: 'cheer', mood: 'happy' }, { t: 4.3, do: 'say', who: 'Tutor Bram', text: 'Every page, every ward, every call: it all answers.', for: 3 },
      { t: 5.4, do: 'banner', title: 'Lanternhollow', sub: 'Connected', kind: 'info' },
    ],
  },
  'ending:racing': {
    id: 'ending:racing', len: 6.4,
    cues: [
      { t: 0, do: 'cam', at: { prop: 'car' }, dist: 6.5, yaw: 0.7, pitch: 0.18, height: 1.1, blend: 0.05 },
      { t: 0.3, do: 'sfx', name: 'surge' }, { t: 0.4, do: 'power', k: 1, over: 2.2, motion: 1 },
      { t: 1.3, do: 'prop', id: 'car', play: 'rev' }, { t: 1.3, do: 'sfx', name: 'power' }, { t: 1.4, do: 'fx', kind: 'smoke', at: { prop: 'car' }, n: 16, y: 0.7 }, { t: 1.5, do: 'flash', at: { prop: 'car' }, color: 0xff7b00, power: 9, dur: 0.7, y: 0.9 },
      { t: 2.6, do: 'cam', at: { at: [0, -8.6, 1.8] }, dist: 11, yaw: 0, pitch: 0.1, height: 1.8, blend: 1.4 },
      { t: 3.2, do: 'npc', id: 'marisol', anim: 'cheer', mood: 'happy' }, { t: 3.3, do: 'say', who: 'Crew Chief Marisol', text: 'The board says we are back. And the board does not lie.', for: 3 },
      { t: 5.2, do: 'banner', title: 'Redline Raceway', sub: 'Online', kind: 'info' },
    ],
  },
  // ---- the plaza: the core first, then the four lanes, then the people
  'ending:plaza': {
    id: 'ending:plaza', len: 13.6,
    cues: [
      { t: 0, do: 'cam', at: { at: [0, 0] }, dist: 20, yaw: 0.5, pitch: 0.3, height: 3, blend: 0.05 },
      { t: 0.5, do: 'sfx', name: 'swell' }, { t: 0.5, do: 'music', name: 'dawn', fade: 2.4 },
      { t: 1.0, do: 'power', k: 1, over: 2.4, motion: 1, world: '' }, { t: 1.0, do: 'flash', at: { at: [0, 0] }, color: 0x9fe8ff, power: 20, dur: 1.4, y: 3.2 }, { t: 1.1, do: 'fx', kind: 'magic', at: { at: [0, 0] }, n: 44, y: 3.4 },
      { t: 2.6, do: 'cam', at: { at: [0, 0] }, dist: 9, yaw: -0.3, pitch: 0.45, height: 5, blend: 2.2, spin: 0.06 },
      { t: 3.4, do: 'power', k: 1, over: 1.2, world: 'robotics' }, ...gate(3.4, [-18, 0], 0x7dffb3),
      { t: 4.0, do: 'power', k: 1, over: 1.2, world: 'academy' }, ...gate(4.0, [0, -14], 0xbd93f9),
      { t: 4.6, do: 'power', k: 1, over: 1.2, world: 'ballpark' }, ...gate(4.6, [18, 0], 0x4fd1ff),
      { t: 5.2, do: 'power', k: 1, over: 1.2, world: 'racing' }, ...gate(5.2, [0, 14], 0xff5d73),
      { t: 5.8, do: 'power', k: 'save', over: 0.4 },
      { t: 5.9, do: 'cam', at: { at: [0, 0] }, dist: 24, yaw: 0.4, pitch: 0.34, height: 3, blend: 2.2 },
      { t: 6.2, do: 'npc', id: 'pip', anim: 'cheer' }, { t: 6.5, do: 'npc', id: 'vera', anim: 'cheer', release: true }, { t: 6.8, do: 'npc', id: 'tamsin', anim: 'wave' }, { t: 7.0, do: 'npc', id: 'otto', anim: 'cheer', release: true },
      { t: 7.2, do: 'npc', id: 'halden', anim: 'cheer' }, { t: 7.4, do: 'npc', id: 'fenn', anim: 'cheer' }, { t: 7.6, do: 'npc', id: 'quill', anim: 'bow' }, { t: 7.8, do: 'npc', id: 'jory', anim: 'cheer' },
      { t: 8.0, do: 'sfx', name: 'cheer' }, { t: 8.1, do: 'fx', kind: 'confetti', at: { at: [0, 0] }, n: 40, y: 5 },
      { t: 9.2, do: 'cam', at: { npc: 'juno-hub' }, dist: 4, yaw: 0.9, pitch: 0.12, height: 1.5, blend: 1.6 }, { t: 9.3, do: 'npc', id: 'juno-hub', face: { player: true }, look: { player: true }, anim: 'cheer', mood: 'happy' },
      { t: 10.2, do: 'say', who: JUNO, text: 'All of it. Every gate, every light. Look at it.', for: 3.2 },
    ],
  },
  // ---- the credits play over the restored plaza: a slow orbit, the core turning, the lanes alight
  'ending:credits': {
    id: 'ending:credits', len: 30,
    cues: [
      { t: 0, do: 'cam', at: { at: [0, 0] }, dist: 26, yaw: -0.4, pitch: 0.34, height: 3, blend: 1.6, spin: 0.045 },
      { t: 6, do: 'flash', at: { at: [0, 0] }, color: 0x9fe8ff, power: 12, dur: 1, y: 3.2 },
      { t: 12, do: 'fx', kind: 'magic', at: { at: [0, 0] }, n: 30, y: 3.4 },
      { t: 18, do: 'flash', at: { at: [0, 0] }, color: 0xffd166, power: 12, dur: 1, y: 3.2 },
      { t: 24, do: 'fx', kind: 'confetti', at: { at: [0, 0] }, n: 36, y: 5 },
    ],
  },
  // ---- after the credits: the plaza, alive; the people who were there; the whole city from above
  'ending:after': {
    id: 'ending:after', len: 18.4,
    cues: [
      { t: 0, do: 'music', name: 'dawn', fade: 1.5 },
      { t: 0, do: 'cam', at: { player: true }, dist: 6.5, yaw: 0.5, pitch: 0.2, height: 1.7, blend: 1.2 },
      { t: 0.3, do: 'player', walk: [3.2, 3.4] },
      { t: 1.8, do: 'npc', id: 'pip', face: { player: true }, look: { player: true }, anim: 'wave' }, { t: 1.9, do: 'say', who: 'Pip', text: 'There they are.', for: 2.4 },
      { t: 4.0, do: 'cam', at: { npc: 'vera' }, dist: 4.4, yaw: 1.0, pitch: 0.12, height: 1.5, blend: 1.4 },
      { t: 4.2, do: 'npc', id: 'vera', face: { player: true }, look: { player: true }, point: { player: true }, mood: 'happy' }, { t: 4.4, do: 'say', who: 'Cartographer Vera', text: 'The one who brought Bytehaven back.', for: 3 },
      { t: 7.6, do: 'cam', at: { npc: 'juno-hub' }, dist: 3.6, yaw: 0.8, pitch: 0.1, height: 1.55, blend: 1.6 },
      { t: 7.8, do: 'npc', id: 'juno-hub', face: { player: true }, look: { player: true }, mood: 'happy', anim: 'nod' },
      { t: 9.4, do: 'npc', id: 'juno-hub', anim: 'bow' }, { t: 9.5, do: 'say', who: JUNO, text: 'You came to learn. You stayed to bring it back.', for: 3.2 },
      // the whole city from above
      { t: 12.4, do: 'cam', at: { at: [0, 0] }, dist: 18, yaw: -0.3, pitch: 0.42, height: 4, blend: 1.4 },
      { t: 13.4, do: 'cam', at: { at: [0, 0] }, dist: 40, yaw: -0.3, pitch: 0.7, height: 14, blend: 4.2 },
      { t: 13.8, do: 'sfx', name: 'swell' }, { t: 14.2, do: 'fx', kind: 'confetti', at: { at: [0, 0] }, n: 30, y: 6 },
      { t: 15.0, do: 'say', text: 'Bytehaven is alive again.', for: 3.2 },
    ],
  },
};
