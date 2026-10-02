import type { SceneDef } from '../../../play/logic/sceneTypes';
import { C, room } from './kit';

/**
 * SIMULATION ROOM = the Training Grounds, as a place. When something goes wrong in the world the player comes here; the console builds a
 * short plan from what went wrong, in different contexts, and finishing it restores Focus. It works the same for every world.
 */
export const simRoom: SceneDef = {
  id: 'sim-room', world: 'robotics', alwaysOn: true, title: 'Simulation Room: the Training Grounds', blurb: 'When something goes wrong out there, train here. A failure is a measurement.',
  bounds: { minX: -10, maxX: 10, minZ: -8, maxZ: 8 },
  spawns: { default: { x: 7.5, z: 0, ry: Math.PI / 2 }, door: { x: 8, z: 0, ry: Math.PI / 2 }, training: { x: 0, z: -2.6, ry: 0 } },
  look: { sky: 0x0d1530, fog: 0x0d1530, fogNear: 24, fogFar: 56, ground: 0x182640, ambient: 0.32, sun: 0.4, night: true, lights: [{ x: 0, y: 3.2, z: -1.6, color: 0x4fd1ff, intensity: 12, dist: 12 }, { x: -6, y: 3, z: -5, color: 0x7dffb3, intensity: 7, dist: 8 }, { x: 6, y: 3, z: -5, color: 0xff79c6, intensity: 7, dist: 8 }, { x: 0, y: 3, z: 5, color: 0xfff0d0, intensity: 6, dist: 10 }] },
  ambience: 'workshop',
  props: [
    { kind: 'floorMetal', x: 0, z: 0, p: { w: 20, d: 16, color: 0x1f3552, color2: 0x274261, tile: 2.2 } },
    { kind: 'floorEmblem', x: 0, z: 1.5, p: { w: 6.5, text: 'TRAINING|GROUNDS', color: 0x4fd1ff, bg: 0x10203a } },
    ...room(-10, 10, -8, 8, { h: 4.4, color: 0x34507a, trim: C.cyan, band: 0x4fd1ff, gaps: { east: [0, 3.2] } }),
    { kind: 'gateway', x: 9.6, z: 0, ry: -Math.PI / 2, p: { w: 3.2, h: 3.2, text: 'ATRIUM', color: C.cyan, portal: false } },
    { kind: 'pod', x: -6, z: -5, p: { color: 0x7dffb3 }, solid: { w: 1.6, d: 1.6 } }, { kind: 'pod', x: -2, z: -6, p: { color: 0x4fd1ff }, solid: { w: 1.6, d: 1.6 } },
    { kind: 'pod', x: 2, z: -6, p: { color: 0xffd166 }, solid: { w: 1.6, d: 1.6 } }, { kind: 'pod', x: 6, z: -5, p: { color: 0xff79c6 }, solid: { w: 1.6, d: 1.6 } },
    { kind: 'console', x: 0, z: -1.6, ry: 0, id: 'training-console', p: { text: 'TRAINING GROUNDS|> diagnose_', color: C.cyan }, solid: { w: 1.7, d: 0.9 } },
    { kind: 'screen', x: 0, z: -7.7, p: { w: 7, h: 1.8, y: 2.1, text: 'FAILURE IS A MEASUREMENT|what did you expect?|what happened instead?', fg: '#9fe8ff', bg: '#0d1b2a' } },
    { kind: 'hologram', x: -7, z: 3, p: { color: 0x7dffb3 }, solid: { w: 1.4, d: 1.4 } },
    // what a finished plan brings to life, one for each family of skill (content/play/cinematics.training.ts plays them): a practice arm, a data console, a workstation, a chart and a tuning display
    { kind: 'arm', x: -8.2, z: -2.6, id: 'train-arm', p: { beltZ: -0.4 }, solid: { w: 1.1, d: 1.1 } },
    { kind: 'statusScreen', x: -9.72, z: -6.2, ry: Math.PI / 2, id: 'train-data', p: { w: 3, h: 1.5, y: 1.7, off: 'DATA CONSOLE|WAITING', on: 'ROWS 38|FLAGGED 3|NOTHING GUESSED', fg: '#7dffb3', bg: '#07161a' } },
    { kind: 'statusScreen', x: 9.72, z: -5.2, ry: -Math.PI / 2, id: 'train-web', p: { w: 3, h: 1.5, y: 1.7, off: 'WORKSTATION|IDLE', on: '<main> LOADED|FORM SENT|200 OK', fg: '#ff9ed2', bg: '#1a0d1c' } },
    { kind: 'statusScreen', x: -6.8, z: -7.72, id: 'train-stats', p: { w: 3, h: 1.5, y: 1.7, off: 'DISTRIBUTION|NO DATA', on: '▁▃▆█▆▃▁|MEAN 4.2  MEDIAN 4|n − 1 USED', fg: '#ffd166', bg: '#1c1608' } },
    { kind: 'statusScreen', x: 6.8, z: -7.72, id: 'train-sheet', p: { w: 3, h: 1.5, y: 1.7, off: 'PERFORMANCE|WAITING', on: 'CONFIG SAVED|TYRE 1.9 BAR|LAP −0.4 s', fg: '#9fe8ff', bg: '#071622' } },
    { kind: 'bench', x: 5, z: 5, solid: { w: 1.6, d: 0.5 } }, { kind: 'bench', x: -4, z: 6, solid: { w: 1.6, d: 0.5 } },
    { kind: 'glowstrip', x: 4.5, z: 0, p: { w: 9, d: 0.14, color: 0x4fd1ff, pulse: true } }, { kind: 'glowstrip', x: 0, z: -1, ry: Math.PI / 2, p: { w: 2, d: 0.14, color: 0x4fd1ff, pulse: true } },
    { kind: 'drone', x: 0, z: 0, p: { y: 3.0, path: '-7,5;7,5;7,-3;-7,-3' } },
    { kind: 'planter', x: -8.8, z: 6.6, solid: { w: 1.4, d: 0.7 } }, { kind: 'planter', x: 8.8, z: 6.6, solid: { w: 1.4, d: 0.7 } },
    { kind: 'lamppost', x: -9, z: 7, p: { h: 2.6, color: 0x9fe8ff } }, { kind: 'lamppost', x: 9, z: 7, p: { h: 2.6, color: 0x9fe8ff } },
  ],
  npcs: [{ npc: 'sana-sim', x: -2.2, z: 1.4, ry: 0.5 }],
  interactables: [
    { id: 'talk-sana', verb: 'Talk', label: 'Analyst Sana', x: -2.2, z: 1.4, action: { type: 'talk', npc: 'sana-sim' } },
    { id: 'training-console', verb: 'Use', label: 'the Training Console', x: 0, z: -0.4, range: 2.4, action: { type: 'panel', panel: 'training' } },
  ],
  exits: [{ id: 'to-atrium', label: 'the atrium', x: 9, z: 0, to: 'robotics-atrium', spawn: 'from-sim' }],
};
