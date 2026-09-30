import type { SceneDef } from '../../../play/logic/sceneTypes';
import { C, room } from './kit';

/**
 * SIMULATION ROOM = the Training Grounds, as a place. When something goes wrong in the world the player comes here; the console builds a
 * short plan from what went wrong, in different contexts, and finishing it restores Focus. It works the same for every world.
 */
export const simRoom: SceneDef = {
  id: 'sim-room', world: 'robotics', title: 'Simulation Room: the Training Grounds', blurb: 'When something goes wrong out there, train here. A failure is a measurement.',
  bounds: { minX: -10, maxX: 10, minZ: -8, maxZ: 8 },
  spawns: { default: { x: 7.5, z: 0, ry: Math.PI / 2 }, door: { x: 8, z: 0, ry: Math.PI / 2 }, training: { x: 0, z: -2.6, ry: 0 } },
  look: { sky: 0x101a30, fog: 0x101a30, fogNear: 22, fogFar: 50, ground: 0x20304a, ambient: 0.5, sun: 0.7, night: true },
  ambience: 'workshop',
  props: [
    { kind: 'floor', x: 0, z: 0, p: { w: 20, d: 16, color: 0x27405e, color2: 0x2f4d70, tile: 1.6 } },
    ...room(-10, 10, -8, 8, { h: 4.4, color: 0x34507a, trim: C.cyan, gaps: { east: [0, 3.2] } }),
    { kind: 'archway', x: 9.6, z: 0, ry: -Math.PI / 2, p: { w: 3.2, h: 3.2, text: 'ATRIUM', color: C.cyan, portal: false } },
    { kind: 'pod', x: -6, z: -5, p: { color: 0x7dffb3 }, solid: { w: 1.6, d: 1.6 } }, { kind: 'pod', x: -2, z: -6, p: { color: 0x4fd1ff }, solid: { w: 1.6, d: 1.6 } },
    { kind: 'pod', x: 2, z: -6, p: { color: 0xffd166 }, solid: { w: 1.6, d: 1.6 } }, { kind: 'pod', x: 6, z: -5, p: { color: 0xff79c6 }, solid: { w: 1.6, d: 1.6 } },
    { kind: 'console', x: 0, z: -1.6, ry: 0, id: 'training-console', p: { text: 'TRAINING GROUNDS|> diagnose_', color: C.cyan }, solid: { w: 1.7, d: 0.9 } },
    { kind: 'screen', x: 0, z: -7.7, p: { w: 7, h: 1.8, y: 2.1, text: 'FAILURE IS A MEASUREMENT|what did you expect?|what happened instead?', fg: '#9fe8ff', bg: '#0d1b2a' } },
    { kind: 'hologram', x: -7, z: 3, p: { color: 0x7dffb3 }, solid: { w: 1.4, d: 1.4 } },
    { kind: 'bench', x: 5, z: 5, solid: { w: 1.6, d: 0.5 } }, { kind: 'bench', x: -4, z: 6, solid: { w: 1.6, d: 0.5 } },
    { kind: 'lamppost', x: -9, z: 7, p: { h: 2.6, color: 0x9fe8ff } }, { kind: 'lamppost', x: 9, z: 7, p: { h: 2.6, color: 0x9fe8ff } },
  ],
  npcs: [{ npc: 'sana-sim', x: -2.2, z: 1.4, ry: 0.5 }],
  interactables: [
    { id: 'talk-sana', verb: 'Talk', label: 'Analyst Sana', x: -2.2, z: 1.4, action: { type: 'talk', npc: 'sana-sim' } },
    { id: 'training-console', verb: 'Use', label: 'the Training Console', x: 0, z: -0.4, range: 2.4, action: { type: 'panel', panel: 'training' } },
  ],
  exits: [{ id: 'to-atrium', label: 'the atrium', x: 9, z: 0, to: 'robotics-atrium', spawn: 'from-sim' }],
};
