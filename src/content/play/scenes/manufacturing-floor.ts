import type { SceneDef } from '../../../play/logic/sceneTypes';
import { C, room } from './kit';

/**
 * MANUFACTURING FLOOR: the assembly line died in the surge. The console before the gate holds the line's control programs; each lesson finished
 * brings one part of the line back (gate, belt, arm, scanner, logs, dashboard). Until the jam bug is fixed the belt jams now and then.
 */
export const manufacturingFloor: SceneDef = {
  id: 'manufacturing-floor', world: 'robotics', title: 'Manufacturing Floor', blurb: 'The assembly line has been dead since the surge. The controller is by the entrance.',
  bounds: { minX: -14, maxX: 14, minZ: -10, maxZ: 10 },
  spawns: { default: { x: 0, z: 8, ry: 0 }, door: { x: 0, z: 8, ry: 0 } },
  look: { sky: 0x141a33, fog: 0x141a33, fogNear: 32, fogFar: 72, ground: 0x232a48, ambient: 0.35, sun: 0.55, lights: [{ x: 0, y: 3.4, z: -1.5, color: 0xffa62b, intensity: 12, dist: 16 }, { x: -8, y: 3.4, z: -3, color: 0xfff0d0, intensity: 8, dist: 12 }, { x: 8, y: 3.4, z: -3, color: 0xfff0d0, intensity: 8, dist: 12 }, { x: 5, y: 2.6, z: 6.8, color: 0xff9f1c, intensity: 6, dist: 8 }] },
  ambience: 'workshop',
  zones: [{ id: 'intake', label: 'Intake', x: 0, z: 7, w: 28, d: 6 }, { id: 'line', label: 'Assembly line', x: 0, z: -2, w: 28, d: 14 }],
  props: [
    { kind: 'floorMetal', x: 0, z: 0, p: { w: 28, d: 20, color: 0x2f3652, color2: 0x39415f, tile: 2.5 } },
    ...room(-14, 14, -10, 10, { h: 5, color: 0x56607f, band: 0xff9f1c, gaps: { south: [0, 4] } }),
    { kind: 'door', x: 0, z: 10, id: 'door-south', p: { w: 4, h: 3.4 } },
    // the gate that separates the intake from the line; it stays shut until the independent trial is passed
    { kind: 'wall', x: -7.75, z: 4, p: { w: 12.5, h: 3.4, d: 0.4, color: C.steel }, solid: { w: 12.5, d: 0.4 } },
    { kind: 'wall', x: 7.75, z: 4, p: { w: 12.5, h: 3.4, d: 0.4, color: C.steel }, solid: { w: 12.5, d: 0.4 } },
    { kind: 'door', x: 0, z: 4, id: 'floor-gate', p: { w: 3, h: 3 }, solid: { w: 3, d: 0.4 } },
    { kind: 'sign', x: 0, z: 4.3, p: { w: 3.6, h: 0.6, text: 'LINE ACCESS: TRIAL REQUIRED', fg: '#ff9f1c', bg: '#20140a', post: 3.4 } },
    { kind: 'hazardstrip', x: 0, z: 5.2, p: { w: 4, d: 0.4 } }, { kind: 'hazardstrip', x: 0, z: 3.4, p: { w: 4, d: 0.4 } },
    { kind: 'hazardstrip', x: 0, z: -1.5, p: { w: 21, d: 0.3 } }, { kind: 'hazardstrip', x: 0, z: 0.0, p: { w: 21, d: 0.3 } },
    // intake: console, engineer, board
    { kind: 'console', x: 6, z: 7.6, id: 'line-console', ry: Math.PI, p: { text: 'LINE CONTROLLER|> program_', color: C.orange }, solid: { w: 1.7, d: 0.9 } },
    { kind: 'crate', x: -10, z: 8, p: { w: 1.2 }, solid: { w: 1.2, d: 1.2 } }, { kind: 'crate', x: -11.3, z: 7.4, p: { w: 0.9, color: 0x9c6b2f }, solid: { w: 0.9, d: 0.9 } },
    { kind: 'barrel', x: 11, z: 8.5, solid: { w: 0.7, d: 0.7 } },
    { kind: 'workbench', x: -6, z: 8.6, solid: { w: 2.2, d: 0.9, h: 1 } },
    // the line
    { kind: 'conveyor', x: 0, z: -1.5, id: 'belt', p: { w: 20, d: 1.3 }, solid: { w: 20, d: 1.3, h: 0.7 } },
    { kind: 'arm', x: -4, z: -4.2, id: 'arm-a', solid: { w: 1.1, d: 1.1 } },
    { kind: 'arm', x: 4, z: -4.2, id: 'arm-b', solid: { w: 1.1, d: 1.1 } },
    { kind: 'scanner', x: 8.5, z: -1.5, ry: Math.PI / 2, id: 'scanner' },
    { kind: 'statusScreen', x: 0, z: -9.6, id: 'dashboard', p: { w: 6, h: 2.2, y: 1.9, off: 'LINE DASHBOARD|OFFLINE', on: 'LINE 1|OUTPUT 240 / HOUR|UPTIME 99.2%|ALL SYSTEMS NOMINAL' } },
    { kind: 'statusScreen', x: -13.6, z: -2, ry: Math.PI / 2, id: 'logs-screen', p: { w: 4.2, h: 1.8, y: 1.6, off: 'MACHINE LOGS|LOCKED', on: 'MACHINE LOGS|14:02 jam belt-3|14:41 jam belt-3|15:20 jam belt-3', fg: '#ffd166', bg: '#20140a' } },
    { kind: 'machine', x: -11, z: -2.5, p: { w: 2.6, h: 2.4, d: 1.6, color: 0xc2603a }, solid: { w: 2.6, d: 1.6 } },
    { kind: 'machine', x: 11.4, z: -4, p: { w: 2.6, h: 2.0, d: 1.6, color: 0x3f6fb0 }, solid: { w: 2.6, d: 1.6 } },
    { kind: 'shelf', x: -8, z: -9.5, p: { w: 3, h: 2.6, rows: 4 }, solid: { w: 3, d: 0.6 } }, { kind: 'shelf', x: 8, z: -9.5, p: { w: 3, h: 2.6, rows: 4 }, solid: { w: 3, d: 0.6 } },
    { kind: 'stack', x: -12, z: 6, solid: { w: 1.4, d: 1.2 } }, { kind: 'cart', x: 3.4, z: 8.4, solid: { w: 1.2, d: 0.6 } },
    { kind: 'pipe', x: -13.7, z: -9.7, p: { dx: 27.4, dz: 0, y: 3.8 } }, { kind: 'pipe', x: -13.7, z: -9.65, p: { dx: 27.4, dz: 0, y: 3.4, r: 0.07, color: 0xc2603a } },
    { kind: 'cable', x: -9, z: 3.6, p: { dx: 18, dz: 0, y: 3.2, sag: 0.8 } },
    { kind: 'warnlight', x: -13, z: 3, y: 3.6 }, { kind: 'warnlight', x: 13, z: 3, y: 3.6 }, { kind: 'warnlight', x: 0, z: 3.6, y: 3.7 },
    { kind: 'drone', x: 0, z: 0, p: { y: 3.5, path: '-10,7;10,7;10,-6;-10,-6' } },
    { kind: 'planter', x: 12.6, z: 8.8, solid: { w: 1.4, d: 0.7 } }, { kind: 'planter', x: -12.6, z: 9, solid: { w: 1.4, d: 0.7 } },
    { kind: 'lamppost', x: -13, z: 9, p: { h: 2.8 } }, { kind: 'lamppost', x: 13, z: 9, p: { h: 2.8 } },
    { kind: 'crate', x: -10, z: -6, p: { w: 1 }, solid: { w: 1, d: 1 } }, { kind: 'crate', x: 10, z: -6.5, p: { w: 1.1, color: 0x9c6b2f }, solid: { w: 1.1, d: 1.1 } },
  ],
  npcs: [{ npc: 'ori-floor', x: 2.5, z: 6.4, ry: Math.PI - 0.3 }],
  interactables: [
    { id: 'talk-ori', verb: 'Talk', label: 'Engineer Ori', x: 2.5, z: 6.4, action: { type: 'talk', npc: 'ori-floor' } },
    { id: 'line-console', verb: 'Use', label: 'the Line Controller', x: 6, z: 6.3, range: 2.2, action: { type: 'terminal', station: 'line-console' } },
    { id: 'belt-look', verb: 'Inspect', label: 'the belt', x: 0, z: 0.4, range: 2.5, when: { effect: 'floor.gate:open' }, action: { type: 'inspect', id: 'belt', text: 'The belt carries part crates past two arms to the scanner. When the controller runs it, it is loud and steady. When it jams, a red lamp flashes at the start of the line.', after: { effect: 'floor.belt:repair', text: 'The belt runs smooth and steady. The red lamp has not flashed since you fixed the bug.' } } },
  ],
  exits: [{ id: 'to-atrium', label: 'the atrium', x: 0, z: 9.3, to: 'robotics-atrium', spawn: 'from-floor' }],
  reactions: [
    { prop: 'floor-gate', effect: 'floor.gate:open', state: 'open', say: 'The line gate slides open.' },
    { prop: 'belt', effect: 'floor.belt:run', state: 'run', say: 'The conveyor groans, then starts to move.' },
    { prop: 'arm-a', effect: 'floor.arm:run', state: 'run' }, { prop: 'arm-b', effect: 'floor.arm:run', state: 'run', say: 'Both assembly arms come alive.' },
    { prop: 'scanner', effect: 'floor.scanner:online', state: 'online', say: 'The scanner gate sweeps a red beam across the belt.' },
    { prop: 'arm-a', effect: 'floor.arm:precise', state: 'precise' }, { prop: 'arm-b', effect: 'floor.arm:precise', state: 'precise', say: 'The arms move more smoothly: your functions are cleaner.' },
    { prop: 'belt', effect: 'floor.belt:repair', state: 'repair', say: 'The jam bug is fixed. The belt runs steadily.' },
    { prop: 'logs-screen', effect: 'floor.logs:open', state: 'on', say: 'The machine logs unlock on the wall screen.' },
    { prop: 'dashboard', effect: 'floor.dashboard:light', state: 'on', say: 'The plant dashboard lights up with clean data.' },
  ],
};
