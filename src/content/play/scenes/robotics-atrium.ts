import type { SceneDef } from '../../../play/logic/sceneTypes';
import { C, room } from './kit';

/** ROBOTICS ACADEMY ATRIUM: the hall that connects the Maintenance Bay, the Manufacturing Floor, the Simulation Room (Training Grounds) and the plaza. */
export const roboticsAtrium: SceneDef = {
  id: 'robotics-atrium', world: 'robotics', title: 'Robotics Academy Atrium', blurb: 'Doors lead to the Maintenance Bay, the Manufacturing Floor and the Simulation Room.',
  bounds: { minX: -14, maxX: 14, minZ: -12, maxZ: 10 },
  spawns: { default: { x: 0, z: 8, ry: 0 }, 'from-plaza': { x: 0, z: 8, ry: 0 }, 'from-bay': { x: -8, z: -10, ry: Math.PI }, 'from-floor': { x: 8, z: -10, ry: Math.PI }, 'from-sim': { x: -12, z: 0, ry: -Math.PI / 2 } },
  look: { sky: 0x1b2340, fog: 0x1b2340, fogNear: 30, fogFar: 70, ground: 0x2c3352, ambient: 0.6, sun: 1.0 },
  ambience: 'workshop',
  props: [
    { kind: 'floor', x: 0, z: -1, p: { w: 28, d: 22, color: 0x5a6686, color2: 0x647196, tile: 2 } },
    ...room(-14, 14, -12, 10, { h: 5, gaps: { north: [[-8, 3.2], [8, 3.2]], south: [0, 4], west: [0, 3.2] } }),
    { kind: 'archway', x: -8, z: -11.6, p: { w: 3.2, h: 3.4, text: 'MAINTENANCE BAY', color: C.green } },
    { kind: 'archway', x: 8, z: -11.6, p: { w: 3.2, h: 3.4, text: 'MANUFACTURING FLOOR', color: C.orange } },
    { kind: 'archway', x: -13.6, z: 0, ry: Math.PI / 2, p: { w: 3.2, h: 3.4, text: 'SIMULATION ROOM', color: C.cyan } },
    { kind: 'archway', x: 0, z: 9.6, p: { w: 4, h: 3.6, text: 'BYTEHAVEN PLAZA', color: C.yellow, portal: false } },
    // centrepiece: a great gear sculpture
    { kind: 'cyl', x: 0, z: -3, p: { w: 4.4, h: 0.5, color: 0x39405c }, solid: { w: 4.4, d: 4.4 } },
    { kind: 'cyl', x: 0, z: -3, y: 0.5, p: { w: 1.0, h: 2.4, color: C.yellow } },
    { kind: 'cyl', x: 0, z: -3, y: 2.9, p: { w: 3.0, h: 0.35, color: C.yellow, glow: 0.3 } },
    { kind: 'sphere', x: 0, z: -3, y: 3.6, p: { w: 0.9, h: 0.9, color: C.cyan, glow: 1 } },
    { kind: 'sign', x: 0, z: -5.4, p: { w: 3.6, h: 0.7, text: 'ROBOTICS ACADEMY|est. before the first bug', fg: '#ffd166', bg: '#1b1b2f' } },
    // reception
    { kind: 'box', x: 0, z: 3.6, p: { w: 4, h: 1.0, d: 1.1, color: 0x39405c }, solid: { w: 4, d: 1.1 } },
    { kind: 'box', x: 0, z: 3.6, y: 1.0, p: { w: 4.2, h: 0.1, d: 1.3, color: 0x8892b0 } },
    { kind: 'board', x: 7, z: 4, id: 'notice-board', solid: { w: 2.6, d: 0.3 } },
    { kind: 'bench', x: -6, z: 4, solid: { w: 1.6, d: 0.5 } }, { kind: 'bench', x: 6, z: -6, solid: { w: 1.6, d: 0.5 } },
    { kind: 'pillar', x: -10, z: 6, p: { h: 4.6, color: 0x7a84a8 }, solid: { w: 0.8, d: 0.8 } }, { kind: 'pillar', x: 10, z: 6, p: { h: 4.6, color: 0x7a84a8 }, solid: { w: 0.8, d: 0.8 } },
    { kind: 'pillar', x: -10, z: -8, p: { h: 4.6, color: 0x7a84a8 }, solid: { w: 0.8, d: 0.8 } }, { kind: 'pillar', x: 10, z: -8, p: { h: 4.6, color: 0x7a84a8 }, solid: { w: 0.8, d: 0.8 } },
    { kind: 'lamppost', x: -12.5, z: 8.5, p: { h: 3 } }, { kind: 'lamppost', x: 12.5, z: 8.5, p: { h: 3 } },
    { kind: 'hologram', x: 11, z: -1, solid: { w: 1.4, d: 1.4 } },
  ],
  npcs: [{ npc: 'kip', x: 0, z: 2.2, ry: 0 }],
  interactables: [
    { id: 'talk-kip', verb: 'Talk', label: 'Kip the receptionist', x: 0, z: 2.2, action: { type: 'talk', npc: 'kip' } },
    { id: 'notice-board', verb: 'Read', label: 'the notice board', x: 7, z: 3, action: { type: 'inspect', id: 'notice-board', text: 'NOTICES. Maintenance Bay: Bolt-7 needs a programmer. Manufacturing Floor: the line is down since the surge (see Engineer Ori). Simulation Room: if a task goes wrong, this is where you train before you try again. Nobody here will think less of you for it.' } },
  ],
  exits: [
    { id: 'to-bay', label: 'the Maintenance Bay', x: -8, z: -10.6, to: 'maintenance-bay', spawn: 'door' },
    { id: 'to-floor', label: 'the Manufacturing Floor', x: 8, z: -10.6, to: 'manufacturing-floor', spawn: 'door' },
    { id: 'to-sim', label: 'the Simulation Room', x: -12.6, z: 0, to: 'sim-room', spawn: 'door' },
    { id: 'to-plaza', label: 'Bytehaven Plaza', x: 0, z: 9, to: 'plaza', spawn: 'from-robotics' },
  ],
};
