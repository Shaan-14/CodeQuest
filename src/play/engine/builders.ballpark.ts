/**
 * Harborview Park props: a painted field with real proportions, the curved outfield wall and warning track, tiered stands with a crowd, dugouts,
 * a backstop, the player tunnel and the TEAM (players who appear when the analysis sets a lineup, and play the simulated game).
 */
import { CanvasTexture, DoubleSide, ExtrudeGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, Shape, SRGBColorSpace } from 'three';
import type { Play } from '../logic/baseballSim';
import { BASE_PATH, FOUL_ANGLE, fencePoints, fenceRadius } from '../logic/ballparkGeom';
import { createBallplay } from './ballplay';
import { createRig, type Rig } from './rig';
import { mat, rbox, rcyl, shape, sign } from './kit';
import { col, num } from './props';
import type { Builder, BuildCtx, Dyn } from './builders';

const G1 = '#3c8a4b', G2 = '#47995a', DIRT = '#c4915a', TRACK = '#a8744a', OUTSIDE = '#2d6a3e';

/** Positions (relative to home plate; north is -z). The base path is BASE_PATH long and the mound sits at 0.67 of it, as on a real field. */
const B = BASE_PATH / Math.SQRT2;
export const BASE = { home: [0, 0], first: [B, -B], second: [0, -2 * B], third: [-B, -B] } as const;
export const POS: Record<string, [number, number]> = { P: [0, -BASE_PATH * 0.672], C: [0, 1.4], '1B': [B * 0.86, -B * 0.9], '2B': [B * 0.42, -B * 1.62], SS: [-B * 0.42, -B * 1.62], '3B': [-B * 0.86, -B * 0.9], LF: [-17, -27], CF: [0, -31], RF: [17, -27] };

/* ------------------------------------------------------------------ the field, painted from above (one plane, one draw call) */

const FIELD = { px: 12, x0: -64, z0: -72, size: 128 };
function paintField(): CanvasTexture {
  const { px, x0, z0, size } = FIELD, N = size * px;
  const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d')!;
  const X = (x: number) => (x - x0) * px, Z = (z: number) => (z - z0) * px;
  g.fillStyle = OUTSIDE; g.fillRect(0, 0, N, N);
  // mown stripes, a band every 5 m across the line to centre field
  for (let i = 0; i < size / 5; i++) { g.fillStyle = i % 2 ? G1 : G2; g.fillRect(0, Z(z0 + i * 5), N, 5 * px); }
  const poly = (pts: { x: number; z: number }[], fill: string) => { g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(X(q.x), Z(q.z)) : g.moveTo(X(q.x), Z(q.z)))); g.closePath(); g.fillStyle = fill; g.fill(); };
  const wall = fencePoints(1), inner = fencePoints(1, 4.2);
  // beyond the wall is not the field
  poly([...wall, { x: 64, z: z0 }, { x: -64, z: z0 }], OUTSIDE);
  // the warning track: a dirt band along the wall
  poly([...wall, ...inner.slice().reverse()], TRACK);
  // the infield: a circle of dirt round the mound, a circle round home plate
  const mound = { x: 0, z: -BASE_PATH * 0.672 };
  const disc = (x: number, z: number, r: number, fill: string) => { g.beginPath(); g.arc(X(x), Z(z), r * px, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); };
  disc(mound.x, mound.z, BASE_PATH * 1.06, DIRT);
  disc(0, 0, 4.6, DIRT);
  // the infield grass, inside the base paths, with softly rounded corners
  const half = B - 1.25 * Math.SQRT2 * 0.9, cz = -B;
  g.beginPath();
  const corner = (ax: number, az: number, bx: number, bz: number, cx: number, cz2: number) => { g.lineTo(X(ax), Z(az)); g.quadraticCurveTo(X(bx), Z(bz), X(cx), Z(cz2)); };
  const k = 0.9;
  g.moveTo(X(-k * 0.7), Z(cz + half * 0.55 + 0.2));
  corner(-half + k, cz - k * 0.3, -half, cz, -half + k, cz - k);
  corner(-k, cz - half + k * 0.4, 0, cz - half, k, cz - half + k * 0.4);
  corner(half - k, cz - k, half, cz, half - k, cz + k * 0.3);
  corner(k * 0.7, cz + half * 0.55 + 0.2, 0, cz + half, -k * 0.7, cz + half * 0.55 + 0.2);
  g.closePath(); g.fillStyle = G2; g.fill();
  // dirt cut-outs: home, the mound, and a circle round each base
  disc(0, 0, 3.4, DIRT); disc(mound.x, mound.z, 2.9, DIRT);
  for (const [x, z] of [BASE.first, BASE.second, BASE.third]) disc(x, z, 1.9, DIRT);
  // grain, so nothing is a flat colour
  for (let i = 0; i < 14000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.06)'; g.fillRect(Math.random() * N, Math.random() * N, 2 + Math.random() * 3, 2 + Math.random() * 3); }
  // chalk: the foul lines out to the poles, the batter's boxes, the catcher's box
  g.strokeStyle = '#f4f4f0'; g.lineCap = 'butt';
  const line = (x1: number, z1: number, x2: number, z2: number, w = 0.14) => { g.lineWidth = w * px; g.beginPath(); g.moveTo(X(x1), Z(z1)); g.lineTo(X(x2), Z(z2)); g.stroke(); };
  for (const sgn of [-1, 1]) { const r = fenceRadius(sgn * FOUL_ANGLE); line(0, 0, sgn * Math.sin(FOUL_ANGLE) * r, -Math.cos(FOUL_ANGLE) * r); }
  g.lineWidth = 0.1 * px;
  for (const sgn of [-1, 1]) g.strokeRect(X(sgn > 0 ? 0.55 : -1.55), Z(-0.8), 1.0 * px, 1.8 * px);
  g.strokeRect(X(-0.55), Z(1.25), 1.1 * px, 1.5 * px);
  // coach's boxes, the on-deck circles
  for (const sgn of [-1, 1]) { g.strokeRect(X(sgn * (B + 3.1) - 0.5), Z(-B + 3.1 - 0.5), 1, 1); g.beginPath(); g.arc(X(sgn * 5.2), Z(2.6), 0.9 * px, 0, Math.PI * 2); g.stroke(); }
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/** The whole playing field at home plate's origin: the painted ground, the mound, the bases and home plate. */
const diamond: Builder = () => {
  const g = new Group();
  const field = new Mesh(new PlaneGeometry(FIELD.size, FIELD.size), new MeshStandardMaterial({ map: paintField(), roughness: 0.96, metalness: 0 }));
  field.rotation.x = -Math.PI / 2; field.position.set(FIELD.x0 + FIELD.size / 2, 0.012, FIELD.z0 + FIELD.size / 2); field.receiveShadow = true;
  g.add(field);
  const mz = POS.P![1];
  g.add(rcyl(2.1, 3.0, 0.3, 0xc4915a, { z: mz, rough: 0.95, r: 0 }), rbox(0.9, 0.07, 0.17, 0xffffff, { z: mz, y: 0.3, rough: 0.5 }));
  for (const [x, z] of [BASE.first, BASE.second, BASE.third]) g.add(rbox(0.62, 0.11, 0.62, 0xffffff, { x, z, y: 0.012, ry: Math.PI / 4, rough: 0.5, r: 0.02 }));
  // home plate: the five-sided slab
  const sh = new Shape(); sh.moveTo(-0.34, 0.0); sh.lineTo(0.34, 0.0); sh.lineTo(0.34, 0.34); sh.lineTo(0, 0.68); sh.lineTo(-0.34, 0.34); sh.closePath();
  const plate = new Mesh(new ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false }), mat(0xffffff, 0, { rough: 0.5 }));
  plate.rotation.x = Math.PI / 2; plate.position.set(0, 0.075, -0.34); plate.receiveShadow = true;
  g.add(plate);
  return { object: g };
};

/* ------------------------------------------------------------------ the wall, the poles, the sign boards, the batter's eye */

const ads = ['HERON BANK', 'GULL AIR', 'HARBOR COFFEE', 'TIDE & CO', 'NORTHLINE', 'PIER 9 PIZZA'];
const fence: Builder = () => {
  const g = new Group();
  const pts = fencePoints(2.2);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!, b = pts[i + 1]!, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, len = Math.hypot(b.x - a.x, b.z - a.z) + 0.06, ry = Math.atan2(-(b.z - a.z), b.x - a.x) * -1;
    const yaw = -Math.atan2(b.z - a.z, b.x - a.x);
    g.add(rbox(len, 2.3, 0.5, 0x1b5a3f, { x: mx, z: mz, ry: yaw, rough: 0.8, r: 0.04 }), rbox(len + 0.02, 0.14, 0.58, 0xffd23f, { x: mx, z: mz, y: 2.3, ry: yaw, rough: 0.5, r: 0.03 }));
    if (i % 3 === 1) { const s = sign([ads[(i / 3 | 0) % ads.length]!], len * 0.95, 1.2, { bg: ['#103a7a', '#7a1028', '#0c4a3a', '#5a3a0c'][(i / 3 | 0) % 4]!, fg: '#ffffff', font: 38 }); s.position.set(mx + Math.sin(yaw) * -0.27, 1.2, mz + Math.cos(yaw) * -0.27); s.rotation.y = yaw + Math.PI; g.add(s); void ry; }
  }
  // foul poles, with the netting of a real one
  for (const sgn of [-1, 1]) { const q = pts[sgn < 0 ? 0 : pts.length - 1]!; g.add(rcyl(0.1, 0.12, 9, 0xffd23f, { x: q.x, z: q.z, rough: 0.4 }), rbox(0.05, 7, 1.4, 0xffd23f, { x: q.x, z: q.z, y: 2, rough: 0.5, r: 0.01, transparent: 0.35, cast: false })); }
  // the batter's eye: a dark wall behind centre field with the scoreboard on it
  const c = pts[Math.floor(pts.length / 2)]!;
  g.add(rbox(22, 10.5, 1.2, 0x10201a, { x: c.x, z: c.z - 1.6, rough: 0.9 }), rbox(22.4, 0.3, 1.5, 0xffd23f, { x: c.x, z: c.z - 1.6, y: 10.5, rough: 0.5 }));
  return { object: g };
};

/* ------------------------------------------------------------------ stands, with a crowd that stands out against the seats */

let seatTex: CanvasTexture | null = null, crowdTex: CanvasTexture | null = null;
const seatTexture = (): CanvasTexture => {
  if (seatTex) return seatTex;
  const c = document.createElement('canvas'); c.width = 128; c.height = 32; const g = c.getContext('2d')!;
  g.fillStyle = '#1b2a55'; g.fillRect(0, 0, 128, 32);
  for (let i = 0; i < 16; i++) { g.fillStyle = '#2f58b8'; g.fillRect(i * 8 + 1, 3, 6, 24); g.fillStyle = '#183478'; g.fillRect(i * 8 + 1, 22, 6, 5); }
  seatTex = new CanvasTexture(c); seatTex.wrapS = RepeatWrapping; seatTex.colorSpace = SRGBColorSpace; seatTex.userData.shared = true; return seatTex;
};
/** Spectators as busts with an alpha edge: heads, shoulders, the odd raised arm, gaps where nobody came. */
const crowdTexture = (): CanvasTexture => {
  if (crowdTex) return crowdTex;
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d')!;
  const shirts = ['#ff5d73', '#ffd166', '#06d6a0', '#f4f4f0', '#b48cff', '#ff9f1c', '#3aa0ff', '#d94a2b'], skins = ['#f0c9a0', '#d9a877', '#c99267', '#8d5a3b'], hair = ['#2a1a12', '#5a3a22', '#1f1a1a', '#c9a24d', '#7a7a7a'];
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 32; i++) {
    if (rnd() < 0.14) continue;
    const x = i * 8 + 4, h = 34 + rnd() * 6;
    g.fillStyle = shirts[(rnd() * shirts.length) | 0]!; g.fillRect(x - 4, h + 6, 8, 24);
    g.fillStyle = skins[(rnd() * skins.length) | 0]!; g.beginPath(); g.arc(x, h, 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = hair[(rnd() * hair.length) | 0]!; g.beginPath(); g.arc(x, h - 1.5, 4.2, Math.PI, 0); g.fill();
    if (rnd() < 0.12) { g.fillStyle = skins[0]!; g.fillRect(x + 3, h - 12, 2, 12); }
  }
  crowdTex = new CanvasTexture(c); crowdTex.wrapS = RepeatWrapping; crowdTex.colorSpace = SRGBColorSpace; crowdTex.userData.shared = true; return crowdTex;
};
const planeGeo = new PlaneGeometry(1, 1); planeGeo.userData.shared = true;

/** A grandstand: stepped concrete, a seat strip and a standing crowd on every row, a padded rail at the front, a back wall and a roof. The field is at local -z. */
const stands: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 30), rows = num(p, 'rows', 7), rise = 0.62, run = 0.95;
  const depth = rows * run;
  g.add(rbox(w, 1.15, 0.3, 0x1d3f8c, { z: -0.3, rough: 0.7, r: 0.04 }), rbox(w, 0.08, 0.4, 0xffffff, { z: -0.3, y: 1.15, rough: 0.5, r: 0.02 }));
  for (let r = 0; r < rows; r++) {
    const top = 0.45 + (r + 1) * rise;
    g.add(rbox(w, top, run, r % 2 ? 0x8d93a6 : 0x9aa0b3, { z: r * run + run / 2, rough: 0.9, r: 0.02 }));
    const seats = new Mesh(planeGeo, new MeshBasicMaterial({ map: seatTexture() })); seats.scale.set(w, run * 0.62, 1); seats.rotation.x = -Math.PI / 2; seats.position.set(0, top + 0.012, r * run + run * 0.62); (seats.material as MeshBasicMaterial).map!.repeat.set(w / 8, 1);
    g.add(seats);
    const crowd = new Mesh(planeGeo, new MeshBasicMaterial({ map: crowdTexture(), transparent: true, alphaTest: 0.5, side: DoubleSide })); crowd.scale.set(w, 0.95, 1); crowd.position.set(0, top + 0.5, r * run + run * 0.62); crowd.rotation.y = Math.PI;
    (crowd.material as MeshBasicMaterial).map!.repeat.set(w / 7, 1);
    g.add(crowd);
  }
  const back = 0.45 + rows * rise;
  g.add(rbox(w, back + 3.2, 0.4, 0x6c7388, { z: depth + 0.2, rough: 0.9, r: 0.03 }));
  // the roof, on slim columns, with a lit underside
  const roofY = back + 3.1;
  g.add(rbox(w + 0.6, 0.3, depth + 1.2, 0x2a3350, { y: roofY, z: depth / 2 + 0.1, rough: 0.6, r: 0.05 }), rbox(w, 0.06, depth * 0.9, 0xfff3c0, { y: roofY - 0.05, z: depth / 2 + 0.1, glow: 0.8, flat: true, cast: false }));
  const cols = Math.max(2, Math.round(w / 8));
  for (let i = 0; i <= cols; i++) g.add(rcyl(0.14, 0.14, roofY - back, 0x596080, { x: -w / 2 + (w * i) / cols, z: depth * 0.95, y: back, rough: 0.5, metal: 0.3 }));
  return { object: g };
};

/** The tunnel the players use: out of the concourse, through the stands, onto the field. */
const tunnel: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 5), d = num(p, 'd', 9), h = num(p, 'h', 3.4);
  g.add(rbox(0.6, h, d, 0x4a5168, { x: -w / 2 - 0.3, rough: 0.9, r: 0.03 }), rbox(0.6, h, d, 0x4a5168, { x: w / 2 + 0.3, rough: 0.9, r: 0.03 }), rbox(w + 1.8, 0.5, d + 0.6, 0x39405c, { y: h, rough: 0.8, r: 0.04 }));
  g.add(rbox(w, 0.04, d, 0x2a2f45, { y: 0.0, rough: 0.9, flat: true, cast: false }), rbox(w - 0.4, 0.06, 0.12, 0xffd23f, { y: h - 0.2, z: -d / 2 + 0.3, glow: 0.9, flat: true, cast: false }), rbox(w - 0.4, 0.06, 0.12, 0xffd23f, { y: h - 0.2, z: d / 2 - 0.3, glow: 0.9, flat: true, cast: false }));
  const s = sign(['TO THE FIELD'], 3.4, 0.6, { bg: '#10203f', fg: '#ffd23f', font: 40 }); s.position.set(0, h + 0.2, d / 2 + 0.02); g.add(s);
  const s2 = sign(['HARBORVIEW PARK'], 3.4, 0.6, { bg: '#10203f', fg: '#ffffff', font: 36 }); s2.position.set(0, h + 0.2, -d / 2 - 0.02); s2.rotation.y = Math.PI; g.add(s2);
  return { object: g };
};

/** A dugout: a roofed bench with a rail at the front, a back wall and steps, open toward the field (local -z). */
const dugout: Builder = () => {
  const g = new Group();
  g.add(rbox(8, 2.1, 0.35, 0x1d3f8c, { z: 1.1, rough: 0.8, r: 0.04 }), rbox(0.35, 2.1, 2.5, 0x1d3f8c, { x: -3.9, rough: 0.8, r: 0.04 }), rbox(0.35, 2.1, 2.5, 0x1d3f8c, { x: 3.9, rough: 0.8, r: 0.04 }));
  g.add(rbox(8.6, 0.3, 3.0, 0xe8ecf7, { y: 2.1, rough: 0.6, r: 0.05 }), rbox(7.2, 0.14, 0.6, 0x8a5a33, { y: 0.55, z: 0.7, rough: 0.8, r: 0.02 }), rbox(7.6, 0.03, 2.2, 0x2a2f45, { y: 0.0, flat: true, cast: false }));
  g.add(rbox(7.6, 0.1, 0.12, 0xffffff, { y: 1.05, z: -1.2, rough: 0.4, r: 0.02 }), rbox(7.6, 0.08, 0.1, 0xffffff, { y: 0.5, z: -1.2, rough: 0.4, r: 0.02 }));
  for (const x of [-3.6, -1.2, 1.2, 3.6]) g.add(rcyl(0.05, 0.05, 1.1, 0xffffff, { x, z: -1.2, rough: 0.4 }));
  return { object: g };
};

/** The backstop behind home plate: a padded wall, tall posts and netting. */
const backstop: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 16), h = num(p, 'h', 7.5);
  g.add(rbox(w, 1.2, 0.35, 0x1d3f8c, { rough: 0.7, r: 0.04 }), rbox(w, 0.08, 0.45, 0xffffff, { y: 1.2, rough: 0.5, r: 0.02 }));
  for (let i = 0; i <= 4; i++) g.add(rcyl(0.1, 0.1, h, 0x39405c, { x: -w / 2 + (w * i) / 4, y: 0.1, rough: 0.5, metal: 0.4 }));
  const net = new Mesh(planeGeo, new MeshBasicMaterial({ color: 0xcfd6ea, transparent: true, opacity: 0.16, side: DoubleSide, depthWrite: false })); net.scale.set(w, h - 1.3, 1); net.position.set(0, 1.3 + (h - 1.3) / 2, 0); g.add(net);
  for (const sgn of [-1, 1]) { const wing = new Mesh(planeGeo, new MeshBasicMaterial({ color: 0xcfd6ea, transparent: true, opacity: 0.16, side: DoubleSide, depthWrite: false })); wing.scale.set(4.5, h - 2.5, 1); wing.position.set(sgn * (w / 2 + 1.9), 1.3 + (h - 2.5) / 2 - 0.4, -1.6); wing.rotation.y = sgn * 0.9 + Math.PI / 2 * 0; g.add(wing); }
  return { object: g };
};

/** A light tower: a tall pole carrying banks of lamps. */
const lightTower: Builder = (p) => {
  const g = new Group(); const h = num(p, 'h', 18);
  g.add(rcyl(0.3, 0.55, h, 0x596080, { rough: 0.5, metal: 0.4 }), rbox(5.2, 3.0, 0.5, 0x2a2f45, { y: h, rough: 0.6 }));
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) g.add(rbox(0.65, 0.5, 0.2, 0xfff3c0, { x: -2.1 + i * 0.84, y: h + 0.3 + r * 0.9, z: 0.3, glow: 1.4, flat: true, cast: false }));
  return { object: g };
};

/**
 * THE TEAM. Before the analysis sets a lineup nobody is in position. When `set` happens nine players jog to their positions, in uniform, each
 * with their batting-order number. `run('sim', plays)` then plays a simulated game: pitch, swing, the ball's flight, the fielder, the runner.
 */
const team: Builder = (p, ctx) => {
  const g = new Group();
  const rigs = new Map<string, Rig>();
  const uniform = { body: 0x2b6cb0, head: 0xd9a877, accent: 0xffd166, hair: 0x2a1a12, hat: 'cap' as const, legs: 0xe8ecf7, scale: 1.18 };
  const order = ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF'];
  // before the analysis sets a lineup the players are loosely warming up in front of the first-base dugout: the ballpark is never empty
  const warm: [number, number][] = [[7.5, -3.6], [9.3, -4.4], [11.1, -3.6], [12.9, -4.4], [8.4, -5.6], [10.2, -6.0], [12.0, -5.6], [13.8, -6.4], [9.0, -7.4]];
  order.forEach((pos, i) => {
    const rig = createRig({ ...uniform, head: [0xd9a877, 0xc99267, 0xf0c9a0, 0x8d5a3b][i % 4]!, hair: [0x2a1a12, 0x1f1a1a, 0x5a3a22, 0xc94f6d][i % 4]! });
    g.add(rig.group); rigs.set(pos, rig);
    rig.group.position.set(warm[i]![0], 0, warm[i]![1]); rig.setFacing(((i * 2.1) % 6.28) - 3.14, true);
    if (i % 3 === 0) rig.hold('stretch'); else if (i % 3 === 1) rig.hold('lift');
  });
  const batter = createRig({ ...uniform, body: 0x1d4d8f, hat: 'helmet' as const }); batter.group.position.set(-1.3, 0, 0.3); batter.setFacing(-Math.PI / 2, true); batter.hold('ready'); g.add(batter.group);
  const runner = createRig({ ...uniform, body: 0x1d4d8f, hat: 'helmet' as const }); runner.group.visible = false; g.add(runner.group);
  const marks: Mesh[] = [BASE.first, BASE.second, BASE.third].map(([x, z]) => { const m = shape('cyl', 0.6, 0.5, 0.6, 0xffd166, { x, z, y: 0.3, glow: 1 }); m.visible = false; g.add(m); return m; });
  const bp = createBallplay({ group: g, ctx, field: { P: POS.P!, base: BASE, pos: POS }, rigs, batter, runner, marks, home: { x: p.x, z: p.z } });
  let isSet = false;
  /** Send every fielder to their position at a jog; `instant` places them (a loaded save). */
  const place = (instant: boolean) => {
    for (const [pos, rig] of rigs) {
      rig.release();
      const [x, z] = POS[pos]!;
      if (instant || ctx.reduced) { rig.group.position.set(x, 0, z); rig.setFacing(pos === 'C' ? 0 : Math.PI, true); rig.hold('ready'); continue; }
      void bp.move(rig, [[x, z]], Math.min(4.8, 3.2), pos === 'C' ? 0 : Math.PI).then(() => rig.hold('ready'));
    }
  };
  const dyn: Dyn = {
    id: p.id ?? 'team', object: g, states: () => (isSet ? ['set'] : []),
    // the camera and effects follow the ball while it is in play, else the plate
    at: () => { const b = bp.ball(); return b ? { x: p.x + b.x, y: Math.max(0.6, b.y), z: p.z + b.z } : { x: p.x, y: 1.5, z: p.z - 9 }; },
    where: (name) => { const r = name === 'batter' ? batter : name === 'runner' ? runner : rigs.get(name); return r ? { x: p.x + r.group.position.x, y: 1.2, z: p.z + r.group.position.z } : null; },
    busy: () => bp.busy(),
    setState(s, instant) { if (s === 'set' && !isSet) { isSet = true; place(instant); if (!instant) { ctx.audio.sfx('cheer'); ctx.say('Nine players jog onto the field in your lineup. Batting order: by the numbers you found.'); } } },
    /** `seq:<kind>[:n]` plays one plate appearance of that kind (hit, homerun, strikeout, groundout, flyout, walk, single, double, steal, predict). */
    play(name) {
      const [head, kind, n] = name.split(':');
      if (head !== 'seq' || !kind) return;
      if (!isSet) { isSet = true; place(true); }
      const alias: Record<string, string> = { hit: 'single', field: 'groundout', pitch: 'strikeout' };
      void bp.plate((alias[kind] ?? kind) as Parameters<typeof bp.plate>[0], Number(n ?? 0));
    },
    update(dt) { bp.update(dt); },
    /** Play a simulated game. `plays` come from logic/baseballSim. Resolves when the last play is done. */
    async run(name, arg) {
      if (name !== 'sim') return;
      const { plays, onPlay } = arg as { plays: Play[]; onPlay?: (p: Play) => void; speed?: number };
      if (!isSet) { isSet = true; place(true); }
      for (const pl of plays) {
        onPlay?.(pl);
        if (pl.half === 'them') { await new Promise<void>((res) => ctx.tweens.after(0.05, res)); continue; } // the opponent's half is summarised by the caller
        await bp.plate(pl.type, pl.batter);
        marks.forEach((m, bi) => (m.visible = pl.bases[bi]! >= 0));
      }
      marks.forEach((m) => (m.visible = false));
    },
  };
  return { object: g, dyn };
};

void sign; void mat; void col; void (null as unknown as BuildCtx);
export const ballparkBuilders: Record<string, Builder> = { diamond, fence, stands, dugout, lightTower, backstop, tunnel, team };
