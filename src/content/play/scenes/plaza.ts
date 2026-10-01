import type { SceneDef } from '../../../play/logic/sceneTypes';
import { C } from './kit';

/** BYTEHAVEN PLAZA: the hub. Four gates lead to the four worlds; the Summit trail climbs from the north-east. Every foundation world is open from the first minute. */
export const plaza: SceneDef = {
  id: 'plaza', world: 'hub', title: 'Bytehaven Plaza', blurb: 'Four gates, four worlds. Begin anywhere; leave whenever you like.',
  bounds: { minX: -24, maxX: 24, minZ: -20, maxZ: 20 },
  spawns: { default: { x: 0, z: 10, ry: 0 }, 'from-robotics': { x: -16, z: 0, ry: -Math.PI / 2 }, 'from-academy': { x: 0, z: -12, ry: Math.PI }, 'from-ballpark': { x: 16, z: 0, ry: Math.PI / 2 }, 'from-racing': { x: 0, z: 14, ry: 0 }, 'from-summit': { x: 13, z: -11, ry: Math.PI } },
  look: { sky: 0x7fb4ff, fog: 0xbcd6ff, fogNear: 40, fogFar: 100, ground: 0x5c8f4e, ambient: 0.5, sun: 1.25, sunDir: [0.5, 1, 0.3] },
  ambience: 'wind',
  zones: [{ id: 'robotics', label: 'Robotics Academy', x: -18, z: 0, w: 6, d: 8 }, { id: 'academy', label: 'Lanternhollow Academy', x: 0, z: -15, w: 8, d: 6 }, { id: 'ballpark', label: 'Harborview Park', x: 18, z: 0, w: 6, d: 8 }, { id: 'racing', label: 'Redline Raceway', x: 0, z: 16, w: 8, d: 6 }],
  props: [
    { kind: 'ground', x: 0, z: 0, p: { w: 40, d: 32, color: 0xb9b2a0, lift: 0.01 } },
    { kind: 'ground', x: 0, z: 0, p: { w: 6, d: 40, color: 0xcbc3ae, lift: 0.015 } }, { kind: 'ground', x: 0, z: 0, p: { w: 48, d: 6, color: 0xcbc3ae, lift: 0.015 } },
    { kind: 'fountain', x: 0, z: 0, solid: { w: 3.4, d: 3.4 } },
    { kind: 'archway', x: -21.5, z: 0, ry: Math.PI / 2, p: { w: 4.4, h: 4.4, text: 'ROBOTICS ACADEMY', color: C.green } },
    { kind: 'archway', x: 0, z: -17.5, p: { w: 4.4, h: 4.4, text: 'LANTERNHOLLOW ACADEMY', color: 0xbd93f9 } },
    { kind: 'archway', x: 21.5, z: 0, ry: -Math.PI / 2, p: { w: 4.4, h: 4.4, text: 'HARBORVIEW PARK', color: 0x4fd1ff } },
    { kind: 'archway', x: 0, z: 17.5, ry: Math.PI, p: { w: 4.4, h: 4.4, text: 'REDLINE RACEWAY', color: 0xff5d73 } },
    { kind: 'archway', x: 16.5, z: -14.5, ry: Math.PI, p: { w: 3.4, h: 3.6, text: 'SUMMIT TRAIL', color: C.yellow } },
    { kind: 'board', x: 5, z: 5, id: 'map-board', solid: { w: 2.6, d: 0.3 } },
    { kind: 'board', x: -5, z: 6.5, id: 'daily-board', solid: { w: 2.6, d: 0.3 } },
    { kind: 'lamppost', x: -5, z: -5 }, { kind: 'lamppost', x: 5, z: -5 }, { kind: 'lamppost', x: -5, z: 5 }, { kind: 'lamppost', x: 5, z: 8 },
    { kind: 'bench', x: -8, z: 4, solid: { w: 1.6, d: 0.5 } }, { kind: 'bench', x: 8, z: -4, solid: { w: 1.6, d: 0.5 } },
    ...[[-12, -10], [-14, 10], [12, 10], [14, 12], [-10, -14], [10, -14], [-18, 12], [18, -10], [-18, -12], [18, 12], [-20, 4], [20, -4]].map(([x, z]) => ({ kind: 'tree', x: x!, z: z!, p: { scale: 1 + ((x! + z!) % 3) * 0.12 }, solid: { w: 0.6, d: 0.6 } })),
    ...[[-9, 14], [9, -17], [-19, -6], [19, 6]].map(([x, z]) => ({ kind: 'bush', x: x!, z: z!, p: { w: 1.4, h: 0.9 } })),
  ],
  npcs: [{ npc: 'pip', x: 3, z: 3.5, ry: 0.4, patrol: [{ x: 3, z: 3.5 }, { x: 3, z: 8 }, { x: 8, z: 8 }, { x: 8, z: 3.5 }] }],
  interactables: [
    { id: 'talk-pip', verb: 'Talk', label: 'Pip the guide', x: 3, z: 3.5, action: { type: 'talk', npc: 'pip' } },
    { id: 'daily-board', verb: 'Read', label: 'the dispatch board', x: -5, z: 6.9, action: { type: 'panel', panel: 'daily' } },
    { id: 'map-board', verb: 'Read', label: 'the world map', x: 5, z: 3.9, action: { type: 'panel', panel: 'map' } },
  ],
  exits: [
    { id: 'to-robotics', label: 'the Robotics Academy', x: -20.4, z: 0, to: 'robotics-atrium', spawn: 'from-plaza' },
    { id: 'to-academy', label: 'Lanternhollow Academy', x: 0, z: -16.4, to: 'lantern-courtyard', spawn: 'from-plaza' },
    { id: 'to-ballpark', label: 'Harborview Park', x: 20.4, z: 0, to: 'ballpark', spawn: 'from-plaza' },
    { id: 'to-racing', label: 'the Redline Raceway', x: 0, z: 16.4, to: 'garage', spawn: 'from-plaza' },
    { id: 'to-summit', label: 'the Summit Trail', x: 16.5, z: -13.4, to: 'summit', spawn: 'from-plaza', area: 'summit' },
  ],
};
