import type { Prop, SceneDef } from '../../../play/logic/sceneTypes';
import { C } from './kit';

/** BYTEHAVEN PLAZA: the hub. Four gates lead to the four worlds; the Summit trail climbs from the north-east. Every foundation world is open from the first minute. */
export const plaza: SceneDef = {
  id: 'plaza', world: 'hub', title: 'Bytehaven Plaza', blurb: 'Four gates, four worlds. Begin anywhere; leave whenever you like.',
  bounds: { minX: -24, maxX: 24, minZ: -20, maxZ: 20 },
  spawns: { default: { x: 0, z: 10, ry: 0 }, start: { x: 0, z: 12.6, ry: 0 }, 'from-robotics': { x: -16, z: 0, ry: -Math.PI / 2 }, 'from-academy': { x: 0, z: -12, ry: Math.PI }, 'from-ballpark': { x: 16, z: 0, ry: Math.PI / 2 }, 'from-racing': { x: 0, z: 14, ry: 0 }, 'from-summit': { x: 13, z: -11, ry: Math.PI } },
  // dusk: a deep blue sky and warm low sun, with one coloured light at each gate, so the four ways read as four places and the core glows
  look: { sky: 0x1a2550, fog: 0x34447a, fogNear: 34, fogFar: 95, ground: 0x2c5a40, ambient: 0.5, sun: 0.85, sunDir: [0.35, 0.7, 0.5], lights: [{ x: -17, y: 3.4, z: 0, color: 0x7dffb3, intensity: 11, dist: 13, world: 'robotics' }, { x: 0, y: 3.4, z: -13, color: 0xbd93f9, intensity: 11, dist: 13, world: 'academy' }, { x: 17, y: 3.4, z: 0, color: 0x4fd1ff, intensity: 11, dist: 13, world: 'ballpark' }, { x: 0, y: 3.4, z: 13, color: 0xff5d73, intensity: 11, dist: 13, world: 'racing' }] },
  ambience: 'wind',
  zones: [{ id: 'robotics', label: 'Robotics Academy', x: -18, z: 0, w: 6, d: 8 }, { id: 'academy', label: 'Lanternhollow Academy', x: 0, z: -15, w: 8, d: 6 }, { id: 'ballpark', label: 'Harborview Park', x: 18, z: 0, w: 6, d: 8 }, { id: 'racing', label: 'Redline Raceway', x: 0, z: 16, w: 8, d: 6 }],
  props: [
    // the floor shows the lanes; the core is the landmark; four gatehouses say what lies through each gate
    { kind: 'hubskyline', x: 0, z: 0, p: { r: 46 } },
    { kind: 'hubfloor', x: 0, z: 0, p: { w: 46, d: 38 } },
    { kind: 'hubdais', x: 0, z: 0 }, { kind: 'hubcore', x: 0, z: 0, p: { text: 'BYTEHAVEN' } },
    { kind: 'gatehouse', x: -21.5, z: 0, ry: Math.PI / 2, p: { w: 4.4, h: 4.4, text: 'ROBOTICS ACADEMY', sub: 'PYTHON · MANUFACTURING', color: 0x7dffb3, accent: 0xff9f1c, theme: 'robotics', world: 'robotics' } },
    { kind: 'gatehouse', x: 0, z: -17.5, p: { w: 4.4, h: 4.4, text: 'LANTERNHOLLOW', sub: 'HTML · CSS · JAVASCRIPT', color: 0xbd93f9, accent: 0x4fd1ff, theme: 'web', world: 'academy' } },
    { kind: 'gatehouse', x: 21.5, z: 0, ry: -Math.PI / 2, p: { w: 4.4, h: 4.4, text: 'HARBORVIEW PARK', sub: 'SQL · DATA · ANALYTICS', color: 0x4fd1ff, accent: 0xffd166, theme: 'ballpark', world: 'ballpark' } },
    { kind: 'gatehouse', x: 0, z: 17.5, ry: Math.PI, p: { w: 4.4, h: 4.4, text: 'REDLINE RACEWAY', sub: 'SPREADSHEETS · MODELS', color: 0xff5d73, accent: 0xf5f5f5, theme: 'racing', world: 'racing' } },
    { kind: 'archway', x: 16.5, z: -14.5, ry: Math.PI, p: { w: 3.4, h: 3.6, text: 'SUMMIT TRAIL', color: C.yellow } },
    // boards, the shop and information
    { kind: 'hubboard', x: 5, z: 5, id: 'map-board', p: { text: 'WORLD MAP|WHERE YOU HAVE BEEN', color: 0x4fd1ff }, solid: { w: 2.6, d: 0.3 } },
    { kind: 'hubboard', x: -5, z: 6.5, id: 'daily-board', p: { text: 'DISPATCH|ONE DAILY PROBLEM', color: 0xffd166 }, solid: { w: 2.6, d: 0.3 } },
    { kind: 'kiosk', x: -10, z: 7.5, ry: Math.PI / 2, id: 'shop-kiosk', p: { text: 'BOLT & BARREL|GEAR FOR COINS', color: 0xffd166 }, solid: { w: 1.0, d: 0.8 } },
    { kind: 'datapanel', x: -8.5, z: -5.5, ry: 0.6, p: { text: 'ROBOTICS|WEST GATE|PYTHON', color: 0x7dffb3, world: 'robotics' }, solid: { w: 0.9, d: 0.5 } },
    { kind: 'datapanel', x: 8.5, z: -5.5, ry: -0.6, p: { text: 'HARBORVIEW|EAST GATE|SQL', color: 0x4fd1ff, world: 'ballpark' }, solid: { w: 0.9, d: 0.5 } },
    // lamps along the lanes, in each district's colour
    ...([[-10, 3.4, 0x7dffb3], [-16, -3.4, 0x7dffb3], [10, -3.4, 0x4fd1ff], [16, 3.4, 0x4fd1ff], [3.4, 10, 0xff5d73], [-3.4, 15, 0xff5d73], [-3.4, -10, 0xbd93f9], [3.4, -14, 0xbd93f9]] as [number, number, number][]).map(([x, z, color]): Prop => ({ kind: 'hublamp', x, z, p: { color, world: color === 0x7dffb3 ? 'robotics' : color === 0x4fd1ff ? 'ballpark' : color === 0xff5d73 ? 'racing' : 'academy' }, solid: { w: 0.35, d: 0.35 } })),
    // seating round the core and by the lanes, planters and trees
    { kind: 'bench', x: -6.5, z: -6.5, ry: Math.PI / 4, solid: { w: 1.6, d: 0.5 } }, { kind: 'bench', x: 6.5, z: 6.5, ry: Math.PI + Math.PI / 4, solid: { w: 1.6, d: 0.5 } },
    { kind: 'bench', x: -6.5, z: 6.5, ry: -Math.PI / 4 + Math.PI, solid: { w: 1.6, d: 0.5 } }, { kind: 'bench', x: 6.5, z: -6.5, ry: -Math.PI / 4, solid: { w: 1.6, d: 0.5 } },
    { kind: 'planter', x: -12, z: -5.4, solid: { w: 1.4, d: 0.7 } }, { kind: 'planter', x: 12, z: 5.4, solid: { w: 1.4, d: 0.7 } },
    ...[[-12, -10], [-14, 10], [12, 10], [14, 12], [-10, -14], [10, -14], [-18, 12], [18, -10]].map(([x, z]) => ({ kind: 'tree', x: x!, z: z!, p: { scale: 1 + ((x! + z!) % 3) * 0.12 }, solid: { w: 0.6, d: 0.6 } })),
    ...[[-9, 14], [9, -17], [-19, -6], [19, 6]].map(([x, z]) => ({ kind: 'bush', x: x!, z: z!, p: { w: 1.4, h: 0.9 } })),
  ],
  npcs: [
    { npc: 'pip', x: 3, z: 6.5, ry: 0.4, patrol: [{ x: 3, z: 6.5 }, { x: 7, z: 4 }, { x: 7, z: -3 }, { x: 3, z: -6.5 }, { x: -3, z: -7 }, { x: -7, z: 0 }, { x: -3, z: 6.5 }] },
    { npc: 'tamsin', x: -12, z: 2, ry: -Math.PI / 2, patrol: [{ x: -12, z: 2 }, { x: -6.5, z: 0.5 }, { x: 0, z: 8.5 }, { x: 8, z: 1.5 }, { x: 14, z: -1.5 }, { x: 8, z: -2 }, { x: 0, z: -9 }, { x: -8, z: -1.5 }] },
    { npc: 'vera', x: 5, z: 3.4, ry: Math.PI, activity: 'point' },
    { npc: 'otto', x: -5.9, z: -2.6, ry: -1.99, activity: 'work' },
    // the guide of the story waits by the core; the rest of the plaza fills with people as the worlds come back
    { npc: 'juno-hub', x: -2.8, z: 6.9, ry: -2.2 },
    { npc: 'halden', x: -14.5, z: 1.5, ry: -Math.PI / 2, minRestore: 0.1, patrol: [{ x: -14.5, z: 1.5 }, { x: -9.5, z: 3.5 }, { x: -12.5, z: -3 }] },
    { npc: 'fenn', x: 14.5, z: 2, ry: Math.PI / 2, minRestore: 0.3, patrol: [{ x: 14.5, z: 2 }, { x: 10, z: 3.8 }, { x: 12.5, z: -3 }] },
    { npc: 'quill', x: 2.5, z: -12.5, ry: Math.PI, minRestore: 0.5, patrol: [{ x: 2.5, z: -12.5 }, { x: 6, z: -8.5 }, { x: -1, z: -9.5 }] },
    { npc: 'jory', x: -2.5, z: 13.2, ry: 0, minRestore: 0.7, patrol: [{ x: -2.5, z: 13.2 }, { x: -7, z: 10.5 }, { x: 2, z: 10.8 }] },
  ],
  interactables: [
    { id: 'talk-pip', verb: 'Talk', label: 'Pip the guide', x: 3, z: 6.5, action: { type: 'talk', npc: 'pip' } },
    { id: 'talk-tamsin', verb: 'Talk', label: 'Courier Tam', x: -12, z: 2, action: { type: 'talk', npc: 'tamsin' } },
    { id: 'talk-vera', verb: 'Talk', label: 'Cartographer Vera', x: 5, z: 3.4, action: { type: 'talk', npc: 'vera' } },
    { id: 'talk-otto', verb: 'Talk', label: 'Technician Otto', x: -5.9, z: -2.6, action: { type: 'talk', npc: 'otto' } },
    { id: 'talk-juno-hub', verb: 'Talk', label: 'Mentor Juno', x: -2.8, z: 6.9, action: { type: 'talk', npc: 'juno-hub' } },
    { id: 'talk-halden', verb: 'Talk', label: 'Engineer Halden', x: -14.5, z: 1.5, action: { type: 'talk', npc: 'halden' } },
    { id: 'talk-fenn', verb: 'Talk', label: 'Scout Fenn', x: 14.5, z: 2, action: { type: 'talk', npc: 'fenn' } },
    { id: 'talk-quill', verb: 'Talk', label: 'Scribe Quill', x: 2.5, z: -12.5, action: { type: 'talk', npc: 'quill' } },
    { id: 'talk-jory', verb: 'Talk', label: 'Pit Chief Jory', x: -2.5, z: 13.2, action: { type: 'talk', npc: 'jory' } },
    { id: 'daily-board', verb: 'Read', label: 'the dispatch board', x: -5, z: 6.9, action: { type: 'panel', panel: 'daily' } },
    { id: 'map-board', verb: 'Read', label: 'the world map', x: 5, z: 3.9, action: { type: 'panel', panel: 'map' } },
    { id: 'shop-kiosk', verb: 'Browse', label: 'the Bolt & Barrel kiosk', x: -8.7, z: 7.5, action: { type: 'panel', panel: 'shop' } },
  ],
  exits: [
    { id: 'to-robotics', label: 'the Robotics Academy', x: -20.4, z: 0, to: 'robotics-atrium', spawn: 'from-plaza' },
    { id: 'to-academy', label: 'Lanternhollow Academy', x: 0, z: -16.4, to: 'lantern-courtyard', spawn: 'from-plaza' },
    { id: 'to-ballpark', label: 'Harborview Park', x: 20.4, z: 0, to: 'ballpark', spawn: 'from-plaza' },
    { id: 'to-racing', label: 'the Redline Raceway', x: 0, z: 16.4, to: 'garage', spawn: 'from-plaza' },
    { id: 'to-summit', label: 'the Summit Trail', x: 16.5, z: -13.4, to: 'summit', spawn: 'from-plaza', area: 'summit' },
  ],
};
