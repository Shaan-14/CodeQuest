import type { Collider, Prop, SceneDef } from '../../../play/logic/sceneTypes';
import { centreLine, REDLINE, startGrid } from '../../../play/logic/track';

const cl = centreLine(REDLINE);
const grid = startGrid(cl, 14);
const s0 = cl.pts[0]!;

/** Tyre-stack barriers just outside selected corners (static, derived from the same centre-line the physics uses). */
const stacks: Prop[] = [];
const walls: Collider[] = [];
for (const i of [38, 52, 66, 98, 112, 128, 152, 170, 196, 214, 240, 256, 276, 288]) {
  const p = cl.pts[i]!, q = cl.pts[(i + 1) % cl.pts.length]!;
  const dx = q.x - p.x, dz = q.z - p.z, len = Math.hypot(dx, dz) || 1, nx = -dz / len, nz = dx / len;
  for (const side of [-1, 1]) {
    // keep stacks to the outside of each corner only (where a car runs wide)
    const x = p.x + nx * side * (cl.width / 2 + 4.2), z = p.z + nz * side * (cl.width / 2 + 4.2);
    if ((i + (side > 0 ? 0 : 1)) % 2 === 0) { stacks.push({ kind: 'tyreStack', x, z }); walls.push({ kind: 'circle', x, z, r: 1.1 }); }
  }
}

/** THE REDLINE CIRCUIT and its paddock. Drive from the paddock car (press E), complete a lap through every checkpoint, leave the car by the paddock (E when slow) and walk back into the garage. */
export const track: SceneDef = {
  id: 'track', world: 'racing', title: 'Redline Raceway', blurb: 'A closed circuit: front straight, sweeper, hairpin, chicane, back straight. The car is in the paddock.',
  bounds: { minX: -190, maxX: 215, minZ: -108, maxZ: 135 },
  spawns: { default: { x: -40, z: 106, ry: 0 }, paddock: { x: -40, z: 106, ry: 0 }, grid: { x: grid.x, z: grid.z, ry: grid.heading } },
  look: { sky: 0x8fc6ff, fog: 0xc9e2ff, fogNear: 70, fogFar: 190, ground: 0x3a7d44, ambient: 0.6, sun: 1.3, sunDir: [0.4, 1, 0.3] },
  ambience: 'engine',
  walls,
  zones: [{ id: 'paddock', label: 'Paddock', x: -40, z: 108, w: 60, d: 20 }, { id: 'start', label: 'Start / finish', x: s0.x, z: s0.z, w: 10, d: 16 }],
  props: [
    { kind: 'circuit', x: 0, z: 0 },
    { kind: 'startGantry', x: s0.x, z: s0.z, ry: Math.PI / 2, p: { w: 19 } },
    { kind: 'pitwall', x: -10, z: 96, p: { w: 100 } },
    { kind: 'stands', x: 0, z: 58, ry: Math.PI, p: { w: 70, rows: 6 } },
    // the paddock and the garage door
    { kind: 'ground', x: -40, z: 110, p: { w: 70, d: 22, color: 0x8a8d98, lift: 0.02 } },
    { kind: 'box', x: -40, z: 124, p: { w: 62, h: 6, d: 8, color: 0x4b5068 }, solid: { w: 62, d: 8 } },
    { kind: 'box', x: -40, z: 124, y: 6, p: { w: 63, h: 0.5, d: 9, color: 0xe63946 } },
    { kind: 'archway', x: -40, z: 119.6, ry: Math.PI, p: { w: 5, h: 4, text: 'GARAGE', color: 0xe63946, portal: false } },
    { kind: 'car', x: -28, z: 106, ry: 0.1, id: 'paddock-car', p: { number: '7' }, solid: { w: 2.2, d: 4.6 } },
    { kind: 'tyreRack', x: -62, z: 112, ry: Math.PI / 2, solid: { w: 0.4, d: 2.4 } },
    { kind: 'lamppost', x: -66, z: 100, p: { h: 4 } }, { kind: 'lamppost', x: -14, z: 100, p: { h: 4 } },
    ...stacks,
    ...[[-150, 60], [-140, -40], [120, 70], [150, -60], [-20, -70], [60, -70], [-110, 90], [170, 50], [-170, 10], [200, 20]].map(([x, z]) => ({ kind: 'tree', x: x!, z: z!, p: { scale: 1.6 } })),
  ],
  npcs: [{ npc: 'marisol', x: -34, z: 110, ry: Math.PI / 2 }],
  interactables: [
    { id: 'talk-marisol-track', verb: 'Talk', label: 'Crew Chief Marisol', x: -34, z: 110, action: { type: 'talk', npc: 'marisol' } },
    { id: 'drive-paddock-car', verb: 'Drive', label: 'the car', x: -28, z: 108.4, range: 3.6, action: { type: 'vehicle', vehicle: 'car' } },
  ],
  exits: [{ id: 'to-garage', label: 'the garage', x: -40, z: 119, to: 'garage', spawn: 'from-track' }],
  reactions: [
    { prop: 'paddock-car', effect: 'garage.car:tyres', state: 'tyres' }, { prop: 'paddock-car', effect: 'garage.car:brakes', state: 'brakes' },
    { prop: 'paddock-car', effect: 'garage.car:fuel', state: 'fuel' }, { prop: 'paddock-car', effect: 'garage.car:aero', state: 'aero' },
  ],
};
