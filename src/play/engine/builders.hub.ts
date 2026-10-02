/**
 * BYTEHAVEN HUB props: the plaza's own pieces. A painted floor that shows where each path leads, the central Bytehaven core (a dais, a data
 * column, orbiting rings and a ring of lettering), four district gatehouses that each say what lies beyond them in their own materials and
 * motifs, and lamps. Static pieces are merged by the batcher; only the core animates, and it is a dozen meshes.
 */
import { BoxGeometry, CanvasTexture, CylinderGeometry, FrontSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, TorusGeometry } from 'three';
import { labelTexture, mat, rbox, rcyl, rsph, sign } from './kit';
import { col, num, str } from './props';
import type { Builder } from './builders';

const ringGeo = new TorusGeometry(0.5, 0.012, 6, 64); ringGeo.userData.shared = true;
const planeGeo = new PlaneGeometry(1, 1); planeGeo.userData.shared = true;
const hexs = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
const GRAPHITE = 0x2a2f45, STEEL = 0x596080, PANEL = 0x39405c, CYAN = 0x4fd1ff;

/** Where each district lies from the core and its colour (the floor, the gatehouses and the lights all use these). */
export const HUB_PATHS = [
  { id: 'robotics', dx: -1, dz: 0, color: 0x7dffb3, accent: 0xff9f1c },
  { id: 'web', dx: 0, dz: -1, color: 0xbd93f9, accent: 0x4fd1ff },
  { id: 'ballpark', dx: 1, dz: 0, color: 0x4fd1ff, accent: 0xffd166 },
  { id: 'racing', dx: 0, dz: 1, color: 0xff5d73, accent: 0xf5f5f5 },
] as const;

/** The plaza floor, painted once as a single plane: stone tiles, rings round the core, a coloured lane to each gate with chevrons that point outward. */
function paintFloor(w: number, d: number): CanvasTexture {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!;
  const X = (x: number) => (x / w + 0.5) * S, Z = (z: number) => (z / d + 0.5) * S;
  g.fillStyle = '#2b3148'; g.fillRect(0, 0, S, S);
  // stone tiles, a few slightly different so it is not one flat colour
  for (let ix = -12; ix < 12; ix++) for (let iz = -10; iz < 10; iz++) { const v = ((ix * 7 + iz * 13) & 3); g.fillStyle = ['#2f3650', '#2b3148', '#323a55', '#2d344c'][v]!; g.fillRect(X(ix * 2) + 1, Z(iz * 2) + 1, (S / w) * 2 - 2, (S / d) * 2 - 2); }
  const glowLine = (col: string, wid: number, f: () => void) => { g.strokeStyle = col; g.lineWidth = wid; g.beginPath(); f(); g.stroke(); };
  // rings round the core
  for (const [r, a] of [[5.8, 0.7], [8.4, 0.35], [11.5, 0.2]] as const) glowLine(`rgba(79,209,255,${a})`, r === 5.8 ? 5 : 3, () => g.ellipse(X(0), Z(0), (r / w) * S, (r / d) * S, 0, 0, Math.PI * 2));
  // a lane to each gate, in its district colour, with a dashed centre line and outward chevrons
  for (const p of HUB_PATHS) {
    const horiz = p.dx !== 0, len = horiz ? w / 2 : d / 2, wid = 4.4, hex = hexs(p.color);
    g.save(); g.translate(X(0), Z(0)); if (!horiz) g.rotate(Math.PI / 2); const sgn = horiz ? p.dx : p.dz;
    const L = (len / (horiz ? w : d)) * S, W = (wid / (horiz ? d : w)) * S;
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(sgn > 0 ? 0 : -L, -W / 2, L, W);
    g.fillStyle = hex; g.globalAlpha = 0.85; g.fillRect(sgn > 0 ? 0 : -L, -W / 2 - 3, L, 6); g.fillRect(sgn > 0 ? 0 : -L, W / 2 - 3, L, 6); g.globalAlpha = 1;
    g.strokeStyle = hex; g.globalAlpha = 0.55; g.lineWidth = 3; g.setLineDash([22, 18]); g.beginPath(); g.moveTo(0, 0); g.lineTo(sgn * L, 0); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    g.fillStyle = hex; for (let k = 0; k < 4; k++) { const x = sgn * (L * (0.28 + k * 0.17)); g.globalAlpha = 0.9 - k * 0.15; g.beginPath(); g.moveTo(x + sgn * 16, 0); g.lineTo(x - sgn * 10, -16); g.lineTo(x - sgn * 4, 0); g.lineTo(x - sgn * 10, 16); g.closePath(); g.fill(); }
    g.restore();
  }
  g.globalAlpha = 1;
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; t.userData.shared = false;
  return t;
}
const floorGeo = new PlaneGeometry(1, 1); floorGeo.userData.shared = true;
const hubfloor: Builder = (p) => {
  const w = num(p, 'w', 46), d = num(p, 'd', 38);
  const m = new Mesh(floorGeo, new MeshBasicMaterial({ map: paintFloor(w, d) }));
  m.rotation.x = -Math.PI / 2; m.scale.set(w, d, 1); m.position.y = num(p, 'lift', 0.012);
  return { object: m };
};

/** The central dais: two steps, a pedestal and four data pylons. Static (the animated part is `hubcore`). */
const hubdais: Builder = () => {
  const g = new Group();
  g.add(rcyl(5.0, 5.0, 0.12, CYAN, { glow: 0.7 }), rcyl(4.85, 4.85, 0.26, GRAPHITE, { rough: 0.6, metal: 0.3 }), rcyl(3.3, 3.4, 0.3, STEEL, { y: 0.26, rough: 0.5, metal: 0.4 }), rcyl(3.1, 3.1, 0.04, GRAPHITE, { y: 0.56 }), rcyl(3.18, 3.18, 0.05, CYAN, { y: 0.53, glow: 0.6 }));
  g.add(rcyl(1.0, 1.25, 1.2, GRAPHITE, { y: 0.56, metal: 0.4 }), rcyl(1.02, 1.02, 0.08, CYAN, { y: 1.1, glow: 0.9 }), rcyl(0.7, 0.9, 0.35, PANEL, { y: 1.76 }));
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + (i * Math.PI) / 2, x = Math.cos(a) * 4.2, z = Math.sin(a) * 4.2; g.add(rbox(0.5, 1.9, 0.5, STEEL, { x, z, y: 0.26, metal: 0.4 }), rbox(0.54, 0.1, 0.54, CYAN, { x, z, y: 2.1, glow: 1.3 }), rbox(0.3, 0.6, 0.04, CYAN, { x, z, y: 0.9, glow: 0.9, ry: -a + Math.PI / 2 })); }
  return { object: g };
};

/** The animated core: a light column, three orbiting rings, a spinning ring of lettering and data cubes round a bright orb. */
const hubcore: Builder = (p, ctx) => {
  const g = new Group(); const text = str(p, 'text', 'BYTEHAVEN').toUpperCase();
  g.add(rcyl(0.22, 0.22, 7.2, CYAN, { y: 2.1, glow: 1.1, transparent: 0.28, cast: false }));
  const orb = rsph(0.62, CYAN, { y: 3.2, glow: 1.6 }); g.add(orb);
  const rings = [3.0, 3.9, 4.8].map((dia, i) => { const r = new Mesh(ringGeo, mat(i === 1 ? 0xffd166 : CYAN, 1.1)); r.scale.setScalar(dia); r.position.y = 3.2; r.rotation.x = 0.9 + i * 0.45; r.rotation.z = i * 0.7; g.add(r); return r; });
  // a ring of lettering: an open cylinder wrapped in a text texture (the text twice round)
  const tex = labelTexture([`${text}  ·  ${text}`], { bg: '#06101c', fg: '#9fe8ff', w: 1024, h: 64, font: 40 });
  const band = new Mesh(new CylinderGeometry(2.1, 2.1, 0.55, 40, 1, true), new MeshBasicMaterial({ map: tex, side: FrontSide, transparent: true, opacity: 0.92, toneMapped: false }));
  band.position.y = 6.3; g.add(band);
  const cubes = [0, 1, 2, 3].map((i) => { const c = new Mesh(new BoxGeometry(0.28, 0.28, 0.28), mat(i % 2 ? 0xffd166 : CYAN, 1.2)); c.userData.i = i; g.add(c); return c; });
  g.children.forEach((c) => { if ((c as Mesh).isMesh) (c as Mesh).castShadow = false; });
  return { object: g, tick: (dt0, t) => {
    const u = ctx.level(''), dt = dt0 * (0.12 + 0.88 * u); // an offline core barely turns: it wakes as the place is restored
    band.rotation.y += dt * 0.35; rings.forEach((r, i) => { r.rotation.y += dt * (0.5 + i * 0.3) * (i % 2 ? -1 : 1); r.rotation.x += dt * 0.12; });
    orb.scale.setScalar(1 + 0.06 * Math.sin(t * 2.4));
    cubes.forEach((c, i) => { const a = t * 0.9 + (i * Math.PI) / 2; c.position.set(Math.cos(a) * 1.9, 3.2 + Math.sin(t * 1.3 + i) * 0.5, Math.sin(a) * 1.9); c.rotation.y = a * 2; });
  } };
};

/** A district title board: the name big and the disciplines under it, drawn once at 1024 px (one texture, one draw call). */
function titleBoard(title: string, sub: string, c: number, acc: number, w: number, h: number): Mesh {
  const W = 1024, H = Math.round(W * (h / w)), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#0b1020'; g.fillRect(0, 0, W, H);
  g.fillStyle = hexs(c); g.font = `700 ${Math.round(H * 0.5)}px ui-monospace, Menlo, Consolas, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, W / 2, H * 0.36, W - 40);
  g.fillStyle = hexs(acc); g.font = `600 ${Math.round(H * 0.22)}px ui-monospace, Menlo, Consolas, monospace`; g.fillText(sub, W / 2, H * 0.78, W - 60);
  g.fillStyle = hexs(c); g.globalAlpha = 0.8; g.fillRect(20, H * 0.58, W - 40, 3); g.globalAlpha = 1;
  const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace;
  const m = new Mesh(planeGeo, new MeshBasicMaterial({ map: t, toneMapped: false })); m.scale.set(w, h, 1); return m;
}

/** A district gatehouse: two pylons, a lintel and canopy with the destination in big letters, and motifs that say what is through it. `theme` picks them.
 *  Built from few materials on purpose (structure, detail metal, the district's colour, its accent, one sign): about seven draw calls each. */
const gatehouse: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 4.4), h = num(p, 'h', 4.4), c = col(p, 'color', CYAN), acc = col(p, 'accent', 0xffd166), theme = str(p, 'theme', 'web');
  const px = w / 2 + 0.55;
  g.add(rbox(1.0, h, 1.3, GRAPHITE, { x: -px, rough: 0.5, metal: 0.3 }), rbox(1.0, h, 1.3, GRAPHITE, { x: px, rough: 0.5, metal: 0.3 }), rbox(w + 2.6, 1.1, 1.5, GRAPHITE, { y: h, rough: 0.5, metal: 0.3 }), rbox(w + 3.0, 0.14, 1.9, STEEL, { y: h + 1.1 }));
  g.add(rbox(0.14, h - 0.3, 0.16, c, { x: -w / 2 + 0.02, y: 0.1, z: 0.55, glow: 1 }), rbox(0.14, h - 0.3, 0.16, c, { x: w / 2 - 0.02, y: 0.1, z: 0.55, glow: 1 }), rbox(w, 0.14, 0.16, c, { y: h - 0.12, z: 0.55, glow: 1 }));
  const board = titleBoard(str(p, 'text', ''), str(p, 'sub', ''), c, acc, w + 2.2, 1.0); board.position.set(0, h + 0.55, 0.77); g.add(board);
  g.add(rbox(w - 0.6, 0.06, 0.3, 0xffffff, { y: h - 0.16, z: 0.2, glow: 1.4 })); // the entrance is the brightest thing near it
  const A = { glow: 1 };
  if (theme === 'robotics') {
    // hazard stripes on the pylon feet, a gear emblem, a robot-arm silhouette beside the lintel
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) if (i % 2 === 0) g.add(rbox(0.22, 0.34, 0.06, acc, { x: s * px - 0.38 + i * 0.25, y: 0.05, z: 0.68, ...A }));
    g.add(rcyl(0.5, 0.5, 0.12, acc, { x: -px, y: h * 0.62, z: 0.68, rx: Math.PI / 2, ...A }), rcyl(0.22, 0.22, 0.14, GRAPHITE, { x: -px, y: h * 0.62, z: 0.7, rx: Math.PI / 2 }));
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; g.add(rbox(0.16, 0.2, 0.12, acc, { x: -px + Math.cos(a) * 0.55, y: h * 0.62 + Math.sin(a) * 0.55 - 0.1, z: 0.68, rz: a, ...A })); }
    g.add(rbox(0.16, 1.5, 0.16, STEEL, { x: px + 1.0, y: h + 0.84 }), rbox(1.3, 0.14, 0.14, STEEL, { x: px + 0.4, y: h + 2.24, rz: 0.12 }), rcyl(0.1, 0.1, 0.4, acc, { x: px - 0.2, y: h + 1.84, ...A }), rsph(0.14, acc, { x: px, y: h + 1.4, z: 0.4, ...A }), rsph(0.14, acc, { x: -px, y: h + 1.4, z: 0.4, ...A }));
  } else if (theme === 'ballpark') {
    // scoreboard-style panel, baseball emblems, a floodlight mast
    const sb = sign(['HERONS  3', 'GULLS   2'], 2.4, 0.8, { bg: '#10203a', fg: '#ffd166', x: -px - 0.1, y: h * 0.55 + 0.5, z: 0.76, font: 26 }); g.add(sb);
    for (const s of [-1, 1]) { g.add(rsph(0.32, 0xf5f5f5, { x: s * px, y: h * 0.62, z: 0.7 }), rbox(0.5, 0.04, 0.04, acc, { x: s * px, y: h * 0.62, z: 0.99, rz: 0.5, ...A }), rbox(0.5, 0.04, 0.04, acc, { x: s * px, y: h * 0.62, z: 0.99, rz: -0.5, ...A })); }
    g.add(rbox(0.22, 3.0, 0.22, STEEL, { x: px + 1.4, y: 0 }), rbox(1.2, 0.5, 0.18, GRAPHITE, { x: px + 1.4, y: 3.0 }));
    for (let i = 0; i < 6; i++) g.add(rsph(0.1, 0xffffff, { x: px + 1.0 + (i % 3) * 0.4, y: 3.12 + Math.floor(i / 3) * 0.24, z: 0.12, glow: 1.4 }));
  } else if (theme === 'web') {
    // an interface panel and a node graph
    g.add(sign(['<div>', '  <nav/>', '</div>'], 1.4, 0.9, { bg: '#0b1020', fg: '#bd93f9', x: -px - 0.2, y: h * 0.5 + 0.5, z: 0.75, font: 20 }));
    const nodes: [number, number][] = [[0, 0], [0.5, 0.35], [1.0, -0.05], [0.7, -0.5], [0.2, -0.45]];
    nodes.forEach(([x, y], i) => { g.add(rsph(0.09, i % 2 ? c : acc, { x: px - 0.5 + x, y: h * 0.55 + y, z: 0.72, ...A })); if (i) { const [ax, ay] = nodes[i - 1]!; const dx = x - ax, dy = y - ay, len = Math.hypot(dx, dy); g.add(rbox(len, 0.025, 0.025, c, { x: px - 0.5 + (x + ax) / 2, y: h * 0.55 + (y + ay) / 2, z: 0.72, rz: Math.atan2(dy, dx), ...A })); } });
    for (let i = 0; i < 3; i++) g.add(rbox(0.5, 0.05, 0.05, i === 1 ? acc : c, { x: 0, y: h + 1.35 + i * 0.12, z: 0.1, ...A }));
  } else if (theme === 'racing') {
    // chequered pylon faces, kerb stripes, a timing board
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) g.add(rbox(0.3, 0.3, 0.05, 0xf5f5f5, { x: s * px + (j - 1) * 0.3, y: 1.0 + i * 0.3, z: 0.67 }));
    for (const s of [-1, 1]) for (let i = 0; i < 6; i += 2) g.add(rbox(0.5, 0.18, 0.5, acc, { x: s * px, y: i * 0.18 + 0.02, z: 0.9, r: 0.02 }));
    g.add(sign(['LAP  1:21.4', 'S1 24.1  S2 31.8'], 1.6, 0.6, { bg: '#140d0a', fg: '#ffd166', x: px + 1.4, y: 2.45, z: 0.36, font: 22 }), rbox(0.12, 2.1, 0.12, STEEL, { x: px + 1.4, y: 0 }));
  }
  return { object: g };
};

/** A plaza lamp: a slim mast with a glowing head in the district colour (emissive only, no light cost). */
const hublamp: Builder = (p) => {
  const g = new Group(); const c = col(p, 'color', CYAN), h = num(p, 'h', 3.0);
  g.add(rcyl(0.17, 0.2, 0.2, GRAPHITE), rcyl(0.05, 0.06, h, GRAPHITE, { y: 0.2 }), rbox(0.26, 0.14, 0.26, c, { y: h + 0.2, glow: 0.7 }));
  return { object: g };
};

/** A holographic notice panel on a short plinth: a glowing tilted frame with text. */
const datapanel: Builder = (p) => {
  const g = new Group(); const c = col(p, 'color', CYAN);
  g.add(rbox(0.9, 0.5, 0.5, GRAPHITE, { metal: 0.3 }), rbox(0.1, 0.9, 0.1, GRAPHITE, { y: 0.5 }), sign(str(p, 'text', 'DATA').split('|'), 1.6, 0.9, { bg: '#06101c', fg: hexs(c), y: 1.5, z: 0.04, font: 22 }));
  (g.children[g.children.length - 1] as Mesh).rotation.x = -0.15;
  return { object: g };
};

/** A ring of distant towers with lit window strips: depth behind the plaza (one batched prop, a handful of draw calls). */
const hubskyline: Builder = (p) => {
  const g = new Group(); const R = num(p, 'r', 44); let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const cols = [0x4fd1ff, 0xffd166, 0xbd93f9, 0x7dffb3];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rnd() * 0.1, r = R + rnd() * 8, w = 3 + rnd() * 4, d = 3 + rnd() * 4, h = 6 + rnd() * 14, x = Math.cos(a) * r, z = Math.sin(a) * r;
    g.add(rbox(w, h, d, i % 3 === 0 ? 0x1c2340 : 0x232b4a, { x, z, rough: 0.8, r: 0.05 }));
    const c = cols[i % 4]!, len = Math.hypot(x, z), dx = -x / len, dz = -z / len, ry = Math.atan2(dx, dz), off = Math.max(w, d) / 2 + 0.03;
    for (let k = 0; k < 3; k++) g.add(rbox(Math.min(w, d) * 0.8, 0.18, 0.05, c, { x: x + dx * off, z: z + dz * off, y: h * (0.3 + k * 0.22), ry, glow: 1.1 }));
  }
  return { object: g };
};

/** A notice board in the hub's own style: a dark frame, a lit screen with its title and a line of what it is for. */
const hubboard: Builder = (p) => {
  const g = new Group(); const c = col(p, 'color', CYAN);
  const tex = labelTexture(str(p, 'text', 'NOTICES').split('|'), { bg: '#07111f', fg: hexs(c), w: 512, h: 256, font: 52 });
  const scr = new Mesh(planeGeo, new MeshBasicMaterial({ map: tex, toneMapped: false })); scr.scale.set(2.3, 1.15, 1); scr.position.set(0, 1.85, 0.07);
  g.add(rbox(0.14, 2.0, 0.2, GRAPHITE, { x: -1.2 }), rbox(0.14, 2.0, 0.2, GRAPHITE, { x: 1.2 }), rbox(2.7, 1.4, 0.12, GRAPHITE, { y: 1.15 }), rbox(2.7, 0.06, 0.14, c, { y: 2.5, glow: 0.9 }), rbox(2.7, 0.06, 0.14, c, { y: 1.1, glow: 0.9 }), scr);
  const back = scr.clone(); back.rotation.y = Math.PI; back.position.z = -0.07; g.add(back);
  return { object: g };
};

export const hubBuilders: Record<string, Builder> = { hubfloor, hubdais, hubcore, gatehouse, hublamp, datapanel, hubskyline, hubboard };
