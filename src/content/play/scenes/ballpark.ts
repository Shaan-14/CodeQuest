import type { Collider, Prop, SceneDef } from '../../../play/logic/sceneTypes';
import { chain, fencePoints, fenceRadius, HOME } from '../../../play/logic/ballparkGeom';

const at = (x: number, z: number) => ({ x: HOME.x + x, z: HOME.z + z });
const ring = (pts: { x: number; z: number }[], r: number): Collider[] => pts.map((q) => ({ kind: 'circle' as const, x: q.x, z: q.z, r }));

/** The outfield wall (a chain of round colliders just behind the drawn wall), and the short walls that close the foul ground at both ends of the stands. */
const fenceWalls: Collider[] = [
  ...ring(fencePoints(1.4, -0.95).map((q) => at(q.x, q.z)), 1.2),
  ...[-1, 1].flatMap((s) => ring(chain(s * 33.2, HOME.z - 20.5, s * 31.4, HOME.z - 25.6, 1.2), 1.0)),
];

/** HARBORVIEW PARK: a ballpark that runs on data. Arrive on the concourse, walk through the tunnel onto the field, meet the manager, then press E at home plate to play a game with the lineup your analysis built. */
export const ballpark: SceneDef = {
  id: 'ballpark', world: 'ballpark', title: 'Harborview Park', blurb: 'The ballpark. Walk the tunnel onto the field; the Analytics Office is off the concourse.',
  bounds: { minX: -40, maxX: 40, minZ: -58, maxZ: 30.4 },
  spawns: { default: { x: 0, z: 25.5, ry: 0 }, 'from-plaza': { x: 0, z: 27.5, ry: 0 }, 'from-office': { x: -26.2, z: 27.3, ry: -Math.PI / 2 } },
  look: { sky: 0x8fc6ff, fog: 0xc9e2ff, fogNear: 60, fogFar: 150, ground: 0x2d6a3e, ambient: 0.55, sun: 1.3, sunDir: [0.4, 1, 0.5] },
  ambience: 'crowd',
  zones: [{ id: 'home', label: 'Home plate', x: 0, z: 6, w: 8, d: 8 }, { id: 'concourse', label: 'Concourse', x: 0, z: 25, w: 80, d: 9 }, { id: 'office', label: 'Analytics Office', x: -33, z: 25, w: 9, d: 7 }],
  walls: fenceWalls,
  props: [
    // the field: painted ground, bases, mound and home plate, the curved wall with its warning track
    { kind: 'diamond', x: HOME.x, z: HOME.z }, { kind: 'fence', x: HOME.x, z: HOME.z }, { kind: 'team', x: HOME.x, z: HOME.z, id: 'team' },
    { kind: 'backstop', x: 0, z: HOME.z + 4, p: { w: 16 } },
    { kind: 'dugout', x: -10.5, z: 4.5 }, { kind: 'dugout', x: 10.5, z: 4.5 },
    // the grandstand behind home plate (two blocks and the player tunnel between them) and the baseline stands
    { kind: 'stands', x: -9.55, z: HOME.z + 7, p: { w: 12.9, rows: 8 } }, { kind: 'stands', x: 9.55, z: HOME.z + 7, p: { w: 12.9, rows: 8 } },
    { kind: 'tunnel', x: 0, z: HOME.z + 11.5, p: { w: 5, d: 9, h: 3.4 } },
    { kind: 'stands', x: 24.7, z: -6, ry: Math.PI / 4, p: { w: 24, rows: 6 } }, { kind: 'stands', x: -24.7, z: -6, ry: -Math.PI / 4, p: { w: 24, rows: 6 } },
    { kind: 'wall', x: 16.2, z: 7.7, ry: Math.PI / 2, p: { w: 10.8, h: 2.6, d: 0.4, color: 0x39507a, trimColor: 0xffd23f }, solid: { w: 10.8, d: 0.4 } },
    { kind: 'wall', x: -16.2, z: 7.7, ry: Math.PI / 2, p: { w: 10.8, h: 2.6, d: 0.4, color: 0x39507a, trimColor: 0xffd23f }, solid: { w: 10.8, d: 0.4 } },
    { kind: 'lightTower', x: -35, z: -27, p: { h: 22 } }, { kind: 'lightTower', x: 35, z: -27, p: { h: 22 } }, { kind: 'lightTower', x: -26, z: 22, p: { h: 20 } }, { kind: 'lightTower', x: 26, z: 22, p: { h: 20 } },
    { kind: 'statusScreen', x: 0, z: HOME.z - fenceRadius(0) - 1.6 + 0.7, id: 'scoreboard', p: { w: 15, h: 5.2, y: 4.6, off: 'HARBORVIEW PARK|HERONS  vs  GULLS|LINEUP: NOT SET', on: 'HARBORVIEW PARK|HERONS  vs  GULLS|LINEUP: SET BY DATA', fg: '#ffd166', bg: '#0d1b2a' } },
    // the concourse behind the stands: a concrete floor, the gate to the plaza, food stands, benches, lamps
    { kind: 'ground', x: 0, z: 25.6, p: { w: 82, d: 9.6, color: 0x9099ad, lift: 0.02 } },
    { kind: 'wall', x: -21.4, z: 29.9, p: { w: 37.5, h: 3.4, d: 0.5, color: 0x39507a, trimColor: 0xffd23f }, solid: { w: 37.5, d: 0.5 } }, { kind: 'wall', x: 21.4, z: 29.9, p: { w: 37.5, h: 3.4, d: 0.5, color: 0x39507a, trimColor: 0xffd23f }, solid: { w: 37.5, d: 0.5 } },
    { kind: 'archway', x: 0, z: 29.7, p: { w: 3.6, h: 3.2, text: 'BYTEHAVEN PLAZA', color: 0xffd23f, portal: false } },
    { kind: 'kiosk', x: -13, z: 27.4 }, { kind: 'kiosk', x: 13, z: 27.4 },
    { kind: 'bench', x: -7, z: 28.5 }, { kind: 'bench', x: 7, z: 28.5 },
    { kind: 'lamppost', x: -4.5, z: 23.5, p: { h: 3.4 } }, { kind: 'lamppost', x: 4.5, z: 23.5, p: { h: 3.4 } }, { kind: 'lamppost', x: -20, z: 23.5, p: { h: 3.4 } }, { kind: 'lamppost', x: 20, z: 23.5, p: { h: 3.4 } },
    // the Analytics Office, off the concourse on third-base side
    { kind: 'box', x: -33, z: 25, p: { w: 9, h: 4.6, d: 7, color: 0x596080 }, solid: { w: 9, d: 7 } },
    { kind: 'box', x: -33, z: 25, y: 4.6, p: { w: 9.6, h: 0.4, d: 7.6, color: 0x39405c } },
    { kind: 'sign', x: -28.3, z: 23.2, ry: Math.PI / 2, p: { w: 3.8, h: 0.8, text: 'ANALYTICS OFFICE', fg: '#7dffb3', bg: '#0d1b2a', post: 2.4 } },
    { kind: 'archway', x: -28.4, z: 27.3, ry: Math.PI / 2, p: { w: 1.6, h: 2.6, text: '', color: 0x7dffb3, portal: false } },
    { kind: 'board', x: -5.4, z: 12.5, id: 'lineup-card', ry: Math.PI, solid: { w: 2.6, d: 0.3 } },
  ] as Prop[],
  npcs: [{ npc: 'reyes', x: 10.5, z: 1.9, ry: 0.25 }],
  interactables: [
    { id: 'talk-reyes', verb: 'Talk', label: 'Coach Reyes', x: 10.5, z: 1.9, action: { type: 'talk', npc: 'reyes' } },
    { id: 'home-plate', verb: 'Play ball', label: '', x: 0, z: 8.2, range: 3.4, action: { type: 'sim', sim: 'baseball' } },
    { id: 'lineup-card', verb: 'Read', label: 'the lineup card', x: -5.4, z: 11.2, range: 2.4, action: { type: 'inspect', id: 'lineup-card', text: 'The lineup card is written in pencil and has been rubbed out several times. Batting order: jersey 3, jersey 7, jersey 12, jersey 14… Someone has written in the margin: “There has to be a better way than numbers on a shirt.”', after: { effect: 'field.lineup:set', text: 'The lineup card is typed, not pencilled. Each name sits in a position, in an order a query can justify. In the margin: “Because the data said so.”' } } },
  ],
  exits: [
    { id: 'to-office', label: 'the Analytics Office', x: -28.4, z: 27.3, to: 'analytics-office', spawn: 'door' },
    { id: 'to-plaza', label: 'Bytehaven Plaza', x: 0, z: 29.1, to: 'plaza', spawn: 'from-ballpark' },
  ],
  reactions: [
    { prop: 'team', effect: 'field.lineup:set', state: 'set', cinematic: 'park-lineup' },
    { prop: 'scoreboard', effect: 'field.lineup:set', state: 'on', say: 'The scoreboard lights up: LINEUP: SET BY DATA.', loadOnly: true },
  ],
};
