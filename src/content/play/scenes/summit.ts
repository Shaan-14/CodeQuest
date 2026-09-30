import type { SceneDef } from '../../../play/logic/sceneTypes';

const GUARDIANS: { id: string; color: number; boss: string }[] = [
  { id: 'python', color: 0x7dffb3, boss: 'mastery-python' }, { id: 'sql', color: 0x4fd1ff, boss: 'mastery-sql' }, { id: 'works', color: 0xff9f1c, boss: 'mastery-data-eng' },
  { id: 'web', color: 0xb48cff, boss: 'mastery-web' }, { id: 'analytics', color: 0xff79c6, boss: 'mastery-analytics' }, { id: 'sheets', color: 0xffd166, boss: 'mastery-sheets' }, { id: 'r', color: 0x7aa2ff, boss: 'mastery-r' },
];
const R = 17, CZ = -5;

/**
 * THE SUMMIT: where the Great Outage is faced. Seven guardian beacons stand in an arc; each lights when its mastery trial is passed (by any
 * technology). The outage console opens the Boss Hall: the same hint-free trials as always, with the player's choice of tools. When the final
 * trial is passed the great beacon ignites and the dawn comes.
 */
export const summit: SceneDef = {
  id: 'summit', world: 'summit', title: 'The Summit', blurb: 'Seven beacons, all dark. The outage console stands at the centre.',
  bounds: { minX: -30, maxX: 30, minZ: -30, maxZ: 18 },
  spawns: { default: { x: 0, z: 13, ry: 0 }, 'from-plaza': { x: 0, z: 13, ry: 0 } },
  look: { sky: 0x0a0d1e, fog: 0x10142a, fogNear: 30, fogFar: 80, ground: 0x3a3f58, ambient: 0.4, sun: 0.4, night: true },
  ambience: 'summit',
  zones: [{ id: 'console', label: 'Outage console', x: 0, z: -2, w: 8, d: 8 }],
  props: [
    { kind: 'ground', x: 0, z: -6, p: { w: 60, d: 50, color: 0x4a5070, lift: 0.01 } },
    { kind: 'cyl', x: 0, z: -4, p: { w: 40, h: 0.3, color: 0x596080 } },
    { kind: 'peak', x: -40, z: -34, p: { scale: 1.6 } }, { kind: 'peak', x: 38, z: -38, p: { scale: 1.8 } }, { kind: 'peak', x: -46, z: 10, p: { scale: 1.2 } }, { kind: 'peak', x: 46, z: 8, p: { scale: 1.4 } },
    { kind: 'controlTower', x: 0, z: -2, solid: { w: 7, d: 7, h: 1.6 } },
    { kind: 'console', x: 0, z: 2.2, ry: 0, id: 'outage-console', p: { text: 'OUTAGE CONTROL|> report_', color: 0xffd166 }, solid: { w: 1.7, d: 0.9 } },
    { kind: 'statusScreen', x: 0, z: -4.6, id: 'outage-status', p: { w: 6, h: 2.6, y: 2.4, off: 'GREAT OUTAGE|STATUS: CRITICAL|7 OF 7 BEACONS DARK', on: 'POWER RESTORED|ALL DISTRICTS ONLINE|THE REPORT IS YOURS', fg: '#ff8c8c', bg: '#1a0d0d' } },
    ...GUARDIANS.map((g, i) => {
      const a = (-68 + (i * 136) / 6) * (Math.PI / 180);
      return { kind: 'beacon', x: Math.sin(a) * R, z: CZ - Math.cos(a) * R + 4, id: `b-${g.id}`, p: { color: g.color }, solid: { w: 1.8, d: 1.8 } };
    }),
    { kind: 'beacon', x: 0, z: -26, id: 'b-great', p: { color: 0xffd166, big: 1 }, solid: { w: 3.4, d: 3.4 } },
    { kind: 'lamppost', x: -5, z: 10, p: { h: 2.6, color: 0xffb3b3 } }, { kind: 'lamppost', x: 5, z: 10, p: { h: 2.6, color: 0xffb3b3 } },
  ],
  npcs: [{ npc: 'aurel', x: -6.5, z: 5, ry: 0.6 }],
  interactables: [
    { id: 'talk-aurel', verb: 'Talk', label: 'Keeper Aurel', x: -6.5, z: 5, action: { type: 'talk', npc: 'aurel' } },
    { id: 'outage-console', verb: 'Use', label: 'the Outage Console', x: 0, z: 4, range: 2.4, action: { type: 'boss', boss: 'hall' } },
  ],
  exits: [{ id: 'to-plaza', label: 'the trail down to the plaza', x: 0, z: 16.6, to: 'plaza', spawn: 'from-summit' }],
  reactions: [
    ...GUARDIANS.map((g) => ({ prop: `b-${g.id}`, effect: `summit.beacon-${g.id}:light`, state: 'light', say: `The ${g.id === 'works' ? 'data engineering' : g.id} beacon lights: a guardian beaten.` })),
    { prop: 'b-great', effect: 'summit.beacon:ignite', state: 'ignite' },
    { prop: 'outage-status', effect: 'summit.beacon:ignite', state: 'on' },
  ],
};
void GUARDIANS;
