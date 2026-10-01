import type { Prop, SceneDef } from '../../../play/logic/sceneTypes';
import { C, room } from './kit';

/** A glowing guide line set into the floor, from (x0,z0) to (x1,z1) (axis-aligned), in a doorway's colour. */
const line = (x0: number, z0: number, x1: number, z1: number, color: number): Prop => (x0 === x1
  ? { kind: 'glowstrip', x: x0, z: (z0 + z1) / 2, ry: Math.PI / 2, p: { w: Math.abs(z1 - z0), d: 0.14, color, pulse: true } }
  : { kind: 'glowstrip', x: (x0 + x1) / 2, z: z0, p: { w: Math.abs(x1 - x0), d: 0.14, color, pulse: true } });

/**
 * ROBOTICS ACADEMY ATRIUM: the hall that connects the Maintenance Bay, the Manufacturing Floor, the Simulation Room (Training Grounds) and the
 * plaza. The glowing lines in the floor lead from the entrance to each door in that door's colour: even without the objective trail the hall
 * says where things are. A new game begins here.
 */
export const roboticsAtrium: SceneDef = {
  id: 'robotics-atrium', world: 'robotics', title: 'Robotics Academy Atrium', blurb: 'Doors lead to the Maintenance Bay, the Manufacturing Floor and the Simulation Room.',
  bounds: { minX: -14, maxX: 14, minZ: -12, maxZ: 10 },
  spawns: { default: { x: 0, z: 8, ry: 0 }, 'from-plaza': { x: 0, z: 8, ry: 0 }, 'from-bay': { x: -8, z: -10, ry: Math.PI }, 'from-floor': { x: 8, z: -10, ry: Math.PI }, 'from-sim': { x: -12, z: 0, ry: -Math.PI / 2 } },
  look: {
    sky: 0x141a33, fog: 0x141a33, fogNear: 34, fogFar: 80, ground: 0x232a48, ambient: 0.35, sun: 0.55, sunDir: [0.3, 1, 0.5],
    lights: [{ x: 0, y: 4.6, z: 3, color: 0xffc27a, intensity: 9, dist: 16 }, { x: 0, y: 5.5, z: -3, color: 0x4fd1ff, intensity: 14, dist: 16 }, { x: -8, y: 3.5, z: -9, color: 0x7dffb3, intensity: 5, dist: 9 }, { x: 8, y: 3.5, z: -9, color: 0xff9f1c, intensity: 5, dist: 9 }],
  },
  ambience: 'workshop',
  props: [
    { kind: 'floorMetal', x: 0, z: -1, p: { w: 28, d: 22, color: 0x2f3652, color2: 0x39415f, tile: 2.5 } },
    { kind: 'floorEmblem', x: 0, z: -3, p: { w: 9.5, text: 'ROBOTICS|ACADEMY', color: C.yellow, bg: 0x1d2440 } },
    ...room(-14, 14, -12, 10, { h: 5, color: 0x56607f, band: 0x4fd1ff, gaps: { north: [[-8, 3.2], [8, 3.2]], south: [0, 4], west: [0, 3.2] } }),
    { kind: 'gateway', x: -8, z: -11.6, p: { w: 3.2, h: 3.4, text: 'MAINTENANCE BAY', color: C.green } },
    { kind: 'gateway', x: 8, z: -11.6, p: { w: 3.2, h: 3.4, text: 'MANUFACTURING FLOOR', color: C.orange } },
    { kind: 'gateway', x: -13.6, z: 0, ry: Math.PI / 2, p: { w: 3.2, h: 3.4, text: 'SIMULATION ROOM', color: C.cyan } },
    { kind: 'gateway', x: 0, z: 9.6, p: { w: 4, h: 3.6, text: 'BYTEHAVEN PLAZA', color: C.yellow, portal: false } },
    // wayfinding in the floor: each door has its colour
    line(-3.8, 8.4, -3.8, -8, C.green), line(-3.8, -8, -8, -8, C.green), line(-8, -8, -8, -10.2, C.green),
    line(3.8, 8.4, 3.8, -8, C.orange), line(3.8, -8, 8, -8, C.orange), line(8, -8, 8, -10.2, C.orange),
    line(-3.8, 0, -12.2, 0, C.cyan),
    // the sculpture: a turning gear on a plinth
    { kind: 'gearsculpt', x: 0, z: -3, p: { r: 1.5 }, solid: { w: 4.4, d: 4.4 } },
    { kind: 'sign', x: 0, z: -6.2, p: { w: 3.6, h: 0.7, text: 'ROBOTICS ACADEMY|est. before the first bug', fg: '#ffd166', bg: '#1b1b2f' } },
    // reception
    { kind: 'reception', x: 0, z: 3.6, p: { w: 4.2 }, solid: { w: 4.4, d: 1.3 } },
    { kind: 'planter', x: -3.4, z: 3.6, solid: { w: 1.4, d: 0.7 } }, { kind: 'planter', x: 3.4, z: 3.6, solid: { w: 1.4, d: 0.7 } },
    { kind: 'board', x: 7, z: 4, id: 'notice-board', solid: { w: 2.6, d: 0.3 } },
    { kind: 'bench', x: -6, z: 4, solid: { w: 1.6, d: 0.5 } }, { kind: 'bench', x: 6, z: -6, solid: { w: 1.6, d: 0.5 } },
    ...[[-10, 6], [10, 6], [-10, -8], [10, -8]].map(([x, z]): Prop => ({ kind: 'pillar', x: x!, z: z!, p: { h: 4.7, color: 0x7a84a8 }, solid: { w: 0.8, d: 0.8 } })),
    { kind: 'lamppost', x: -12.5, z: 8.5, p: { h: 3 } }, { kind: 'lamppost', x: 12.5, z: 8.5, p: { h: 3 } },
    { kind: 'hologram', x: 11, z: -1, solid: { w: 1.4, d: 1.4 } },
    // the east wall: charging docks, a vending machine and a status kiosk
    { kind: 'dock', x: 13.1, z: -5.5, ry: -Math.PI / 2 }, { kind: 'dock', x: 13.1, z: -3, ry: -Math.PI / 2, p: { color: C.cyan } }, { kind: 'dock', x: 13.1, z: 2.5, ry: -Math.PI / 2, p: { color: C.yellow } },
    { kind: 'vending', x: 13.2, z: 6.5, ry: -Math.PI / 2, solid: { w: 0.9, d: 1.1 } },
    { kind: 'kiosk', x: -11.6, z: 5.5, p: { text: 'ACADEMY|STATUS: OK', color: C.green }, solid: { w: 1.0, d: 0.8 } },
    // north wall: screens, pipes and cables
    { kind: 'monitorwall', x: 0, z: -11.78, p: { cols: 3, rows: 2 } },
    { kind: 'pipe', x: -13.7, z: -11.5, p: { dx: 27.4, dz: 0, y: 3.6, r: 0.1 } }, { kind: 'pipe', x: -13.7, z: -11.45, p: { dx: 27.4, dz: 0, y: 3.2, r: 0.07, color: 0x4a6fb0 } },
    { kind: 'cable', x: -10, z: -8, p: { dx: 20, dz: 0, y: 4.5, sag: 0.9 } },
    { kind: 'drone', x: 0, z: 0, p: { y: 3.4, path: '-9,6;-9,-5;9,-5;9,6' } },
    { kind: 'drone', x: 0, z: 0, p: { y: 4.1, path: '6,7;-6,7;-6,-1;6,-1' } },
    { kind: 'warnlight', x: -10.4, z: -11.5 }, { kind: 'warnlight', x: 10.4, z: -11.5, p: { color: C.cyan } },
    { kind: 'planter', x: -12.8, z: 8.6, solid: { w: 1.4, d: 0.7 } }, { kind: 'planter', x: 12.8, z: 9, solid: { w: 1.4, d: 0.7 } },
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
