import type { Collider, SceneDef } from '../../../play/logic/sceneTypes';

const HOME = { x: 0, z: 6 };
/** Invisible circles along the outfield fence, so nobody walks through it. */
const fenceWalls: Collider[] = Array.from({ length: 30 }, (_, i) => {
  const a = -Math.PI / 4 - 0.16 + (i / 29) * (Math.PI / 2 + 0.32);
  return { kind: 'circle' as const, x: HOME.x + Math.sin(a) * 38.6, z: HOME.z - Math.cos(a) * 38.6, r: 1.4 };
});

/** HARBORVIEW PARK: a ballpark that runs on data. Walk the field, meet the manager, then press E at home plate to play a game with the lineup your analysis built. */
export const ballpark: SceneDef = {
  id: 'ballpark', world: 'ballpark', title: 'Harborview Park', blurb: 'The ballpark. The Analytics Office is behind third base; home plate is where games start.',
  bounds: { minX: -46, maxX: 46, minZ: -44, maxZ: 26 },
  spawns: { default: { x: 0, z: 18, ry: 0 }, 'from-plaza': { x: 0, z: 22, ry: 0 }, 'from-office': { x: -21, z: 12.6, ry: Math.PI / 2 } },
  look: { sky: 0x8fc6ff, fog: 0xc9e2ff, fogNear: 55, fogFar: 140, ground: 0x2f6a45, ambient: 0.55, sun: 1.3, sunDir: [0.4, 1, 0.5] },
  ambience: 'crowd',
  zones: [{ id: 'home', label: 'Home plate', x: 0, z: 6, w: 6, d: 6 }, { id: 'office', label: 'Analytics Office', x: -26, z: 10, w: 8, d: 8 }],
  walls: fenceWalls,
  props: [
    { kind: 'ground', x: 0, z: -8, p: { w: 100, d: 66, color: 0x2f6a45, lift: 0.005 } },
    { kind: 'diamond', x: HOME.x, z: HOME.z }, { kind: 'fence', x: HOME.x, z: HOME.z }, { kind: 'plate', x: HOME.x, z: HOME.z },
    { kind: 'team', x: HOME.x, z: HOME.z, id: 'team' },
    // stands: behind home plate and along both baselines
    { kind: 'stands', x: 0, z: 13, p: { w: 34, rows: 7 }, solid: { w: 34, d: 4 } },
    { kind: 'stands', x: -29, z: 7, ry: -Math.PI / 2 - 0.5, p: { w: 24, rows: 6 } }, { kind: 'stands', x: 29, z: 7, ry: Math.PI / 2 + 0.5, p: { w: 24, rows: 6 } },
    { kind: 'dugout', x: -11, z: 10, solid: { w: 7, d: 2.4 } }, { kind: 'dugout', x: 11, z: 10, solid: { w: 7, d: 2.4 } },
    { kind: 'lightTower', x: -34, z: -6, p: { h: 20 } }, { kind: 'lightTower', x: 34, z: -6, p: { h: 20 } }, { kind: 'lightTower', x: -16, z: 24, p: { h: 18 } }, { kind: 'lightTower', x: 16, z: 24, p: { h: 18 } },
    { kind: 'statusScreen', x: 0, z: -41, id: 'scoreboard', p: { w: 14, h: 5, y: 7, off: 'HARBORVIEW PARK|HERONS  vs  GULLS|LINEUP: NOT SET', on: 'HARBORVIEW PARK|HERONS  vs  GULLS|LINEUP: SET BY DATA', fg: '#ffd166', bg: '#0d1b2a' } },
    // the Analytics Office, behind third base
    { kind: 'box', x: -28, z: 10, p: { w: 9, h: 4.6, d: 7, color: 0x596080 }, solid: { w: 9, d: 7 } },
    { kind: 'box', x: -28, z: 10, y: 4.6, p: { w: 9.6, h: 0.4, d: 7.6, color: 0x39405c } },
    { kind: 'sign', x: -23.3, z: 10, ry: Math.PI / 2, p: { w: 4.4, h: 0.8, text: 'ANALYTICS OFFICE', fg: '#7dffb3', bg: '#0d1b2a', post: 2.4 } },
    { kind: 'archway', x: -23.6, z: 12.6, ry: Math.PI / 2, p: { w: 1.6, h: 2.6, text: '', color: 0x7dffb3, portal: false } },
    { kind: 'board', x: 6, z: 16, id: 'lineup-card', ry: Math.PI, solid: { w: 2.6, d: 0.3 } },
    { kind: 'lamppost', x: -20, z: 16, p: { h: 3.2 } }, { kind: 'lamppost', x: 20, z: 16, p: { h: 3.2 } },
    ...[[-18, 20], [18, 20], [-8, 23], [8, 23]].map(([x, z]) => ({ kind: 'bush', x: x!, z: z!, p: { w: 2, h: 1.1 } })),
  ],
  npcs: [{ npc: 'reyes', x: 5, z: 12, ry: Math.PI }],
  interactables: [
    { id: 'talk-reyes', verb: 'Talk', label: 'Coach Reyes', x: 5, z: 12, action: { type: 'talk', npc: 'reyes' } },
    { id: 'home-plate', verb: 'Play ball', label: '', x: 0, z: 8.2, range: 3.4, action: { type: 'sim', sim: 'baseball' } },
    { id: 'lineup-card', verb: 'Read', label: 'the lineup card', x: 6, z: 14.4, range: 2.4, action: { type: 'inspect', id: 'lineup-card', text: 'The lineup card is written in pencil and has been rubbed out several times. Batting order: jersey 3, jersey 7, jersey 12, jersey 14… Someone has written in the margin: “There has to be a better way than numbers on a shirt.”', after: { effect: 'field.lineup:set', text: 'The lineup card is typed, not pencilled. Each name sits in a position, in an order a query can justify. In the margin: “Because the data said so.”' } } },
  ],
  exits: [
    { id: 'to-office', label: 'the Analytics Office', x: -23.6, z: 12.6, to: 'analytics-office', spawn: 'door' },
    { id: 'to-plaza', label: 'Bytehaven Plaza', x: 0, z: 25, to: 'plaza', spawn: 'from-ballpark' },
  ],
  reactions: [
    { prop: 'team', effect: 'field.lineup:set', state: 'set' },
    { prop: 'scoreboard', effect: 'field.lineup:set', state: 'on', say: 'The scoreboard lights up: LINEUP: SET BY DATA.' },
  ],
};
