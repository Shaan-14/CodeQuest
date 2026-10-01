/**
 * INDUSTRIAL SET DRESSING: the things that make a robotics facility look like one. Rounded, shaded pieces with a shared palette (steel, graphite,
 * safety yellow, cyan indicators), a few animated touches (gears turning, a drone on patrol, beacons, a press) and nothing that costs more than
 * a handful of draw calls. Each builder may return a `tick` (per-frame animation without an id).
 */
import { CatmullRomCurve3, Group, Mesh, TubeGeometry, Vector3 } from 'three';
import { rbox, rcyl, rsph, shape, sign } from './kit';
import { grate, hazard, metalTiles, wallPanel, emblem } from './tex';
import { mat } from './kit';
import { col, flag, num, str } from './props';
import type { Builder } from './builders';
import { MeshBasicMaterial, PlaneGeometry, RepeatWrapping, MeshStandardMaterial } from 'three';
import { torusG } from './rig.parts';

const STEEL = 0x8b95b5, GRAPHITE = 0x2b3048, DARK = 0x1c2036, YELLOW = 0xf2c14e, CYAN = 0x4fd1ff, AMBER = 0xffa62b, GREEN = 0x7dffb3, RED = 0xff5d5d;
const hexs = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
const planeGeo = new PlaneGeometry(1, 1); planeGeo.userData.shared = true;
const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

/** Floor of polished panels (a texture, so one draw call whatever the size). */
const floorMetal: Builder = (p) => {
  const w = num(p, 'w', 4), d = num(p, 'd', 4), tile = num(p, 'tile', 2.5);
  const tex = metalTiles(col(p, 'color', 0x4a5472), col(p, 'color2', 0x56607f)).clone(); tex.needsUpdate = true; tex.userData.shared = false;
  tex.wrapS = tex.wrapT = RepeatWrapping; tex.repeat.set(w / tile / 2 * 2 / 2, d / tile / 2 * 2 / 2);
  const m = new Mesh(planeGeo, new MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.25 }));
  m.rotation.x = -Math.PI / 2; m.scale.set(w, d, 1); m.position.y = num(p, 'lift', 0.01); m.receiveShadow = true;
  return { object: m };
};

/** A strip of light set into the floor (also the wayfinding lines): optionally pulsing. */
const glowstrip: Builder = (p) => {
  const w = num(p, 'w', 4), d = num(p, 'd', 0.12), c = col(p, 'color', CYAN);
  const m = new Mesh(planeGeo, new MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.scale.set(w, d, 1); m.position.y = num(p, 'lift', 0.025);
  const pulse = flag(p, 'pulse', false);
  return { object: m, tick: pulse ? (_dt, t) => { (m.material as MeshBasicMaterial).opacity = 0.55 + 0.35 * Math.sin(t * 2.2 + p.x); } : undefined };
};

/** A big round floor emblem. */
const floorEmblem: Builder = (p) => {
  const s = num(p, 'w', 6);
  const m = new Mesh(planeGeo, new MeshBasicMaterial({ map: emblem(str(p, 'text', 'ACADEMY'), col(p, 'color', YELLOW), col(p, 'bg', 0x20263f)), transparent: true, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.scale.set(s, s, 1); m.position.y = 0.03;
  return { object: m };
};

/** The great gear sculpture: a turning gear on a plinth, halo rings, a glowing core. */
const gearsculpt: Builder = (p) => {
  const g = new Group(); const r = num(p, 'r', 1.6), teeth = 14;
  g.add(rcyl(r * 1.45, r * 1.6, 0.5, GRAPHITE, { rough: 0.4, metal: 0.4 }), rcyl(r * 1.3, r * 1.4, 0.12, CYAN, { y: 0.5, glow: 0.8 }));
  g.add(rcyl(0.4, 0.5, 1.7, STEEL, { y: 0.6, metal: 0.5, rough: 0.35 }));
  const gear = new Group(); gear.position.y = 2.9; g.add(gear);
  gear.add(rcyl(r, r, 0.34, YELLOW, { rx: Math.PI / 2, y: 0, metal: 0.35, rough: 0.4 }));
  const hub = rcyl(r * 0.35, r * 0.35, 0.5, GRAPHITE, { rx: Math.PI / 2 }); gear.add(hub);
  for (let i = 0; i < teeth; i++) { const a = (i / teeth) * Math.PI * 2; const t = rbox(0.42, 0.52, 0.34, YELLOW, { r: 0.05, metal: 0.35, rough: 0.4 }); t.position.set(Math.cos(a) * (r + 0.2), Math.sin(a) * (r + 0.2) - 0.26, 0); t.rotation.z = a - Math.PI / 2 + Math.PI; gear.add(t); }
  const core = rsph(0.34, CYAN, { glow: 1.4, y: 0, z: 0.22 }); gear.add(core);
  const halo = new Group(); halo.position.y = 2.9; g.add(halo);
  for (const [rad, tilt] of [[r * 1.55, 1.2], [r * 1.75, -0.9]] as const) { const ring = new Mesh(torusG(rad, 0.025), mat(CYAN, 1.2, { transparent: 0.7 })); ring.rotation.x = tilt; halo.add(ring); }
  return { object: g, tick: (dt, t) => { gear.rotation.z += dt * 0.35; halo.rotation.y += dt * 0.6; core.scale.setScalar(1 + 0.08 * Math.sin(t * 3)); } };
};

/** A reception desk with a monitor, a holo-sign and an under-glow. */
const reception: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 4.2);
  g.add(rbox(w, 1.0, 1.1, GRAPHITE, { rough: 0.45, metal: 0.25 }), rbox(w + 0.2, 0.1, 1.3, 0xcfd6ea, { y: 1.0, rough: 0.3, metal: 0.2 }), rbox(w - 0.2, 0.06, 0.04, CYAN, { y: 0.55, z: -0.57, glow: 1.1 }));
  g.add(rbox(0.9, 0.55, 0.06, DARK, { y: 1.1, z: 0.1, rx: -0.15 }), rbox(0.84, 0.48, 0.02, 0x0b1d17, { y: 1.13, z: 0.07, rx: -0.15, glow: 0.3 }), rcyl(0.06, 0.1, 0.15, STEEL, { y: 1.1, z: 0.2 }));
  g.add(rcyl(0.04, 0.05, 0.5, STEEL, { x: w / 2 - 0.5, y: 1.1, metal: 0.4 }), rbox(0.3, 0.12, 0.3, 0xffd166, { x: w / 2 - 0.5, y: 1.55, glow: 1, r: 0.05 })); // desk lamp
  return { object: g };
};

/** A wall of screens with changing readouts. */
const monitorwall: Builder = (p) => {
  const g = new Group(); const cols = num(p, 'cols', 3), rows = num(p, 'rows', 2), sw = 1.5, sh = 0.9, gap = 0.12;
  const texts = [['TEMP 41C', 'RPM 3200'], ['LINE 2: OK', 'JOBS 18'], ['POWER 98%', 'AIR 21C'], ['ALERTS 0', 'QUEUE 4'], ['ARM 3: IDLE', 'LOAD 62%'], ['TESTS 142', 'PASS 142']];
  g.add(rbox(cols * (sw + gap) + 0.2, rows * (sh + gap) + 0.2, 0.12, DARK, { y: 0.9, rough: 0.5 }));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c; const tx = texts[i % texts.length]!; const ok = i % 5 !== 3;
    const s = sign(tx, sw, sh, { bg: ok ? '#0b1d17' : '#241a0a', fg: ok ? '#7dffb3' : '#ffa62b', x: (c - (cols - 1) / 2) * (sw + gap), y: 0.9 + 0.1 + (r + 0.5) * (sh + gap) + 0.02, z: 0.075 });
    g.add(s);
  }
  return { object: g };
};

/** A robot charging dock: an alcove with a glowing pad. */
const dock: Builder = (p) => {
  const g = new Group(); const c = col(p, 'color', GREEN);
  g.add(rbox(1.4, 0.16, 1.4, GRAPHITE), rcyl(0.55, 0.55, 0.03, c, { y: 0.16, glow: 1.1 }), rbox(1.4, 2.0, 0.2, GRAPHITE, { z: -0.6, rough: 0.5 }), rbox(1.0, 0.1, 0.05, c, { y: 1.6, z: -0.48, glow: 1 }), rbox(0.1, 1.5, 0.06, c, { x: -0.55, y: 0.3, z: -0.48, glow: 0.7 }), rbox(0.1, 1.5, 0.06, c, { x: 0.55, y: 0.3, z: -0.48, glow: 0.7 }));
  return { object: g, tick: (_d, t) => { (g.children[1] as Mesh).scale.setScalar(1 + 0.05 * Math.sin(t * 3 + p.x)); } };
};

/** A little hover drone that patrols a loop and bobs. `path` = "x,z;x,z;..." (world), `y` = height. */
const drone: Builder = (p, ctx) => {
  const g = new Group(); const y = num(p, 'y', 2.6);
  g.add(rsph(0.22, 0xe5e9f5, { sy: 0.7, metal: 0.3 }), rbox(0.5, 0.05, 0.12, CYAN, { y: -0.04, glow: 1 }), rsph(0.06, CYAN, { z: -0.2, y: 0.02, glow: 1.4 }));
  const rotors: Mesh[] = [];
  for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]] as const) { g.add(rcyl(0.02, 0.02, 0.2, GRAPHITE, { x: x * 0.8, z: z * 0.8, y: 0, rz: 0.0 })); const r = rcyl(0.18, 0.18, 0.015, STEEL, { x, z, y: 0.14, transparent: 0.5, cast: false }); rotors.push(r); g.add(r); }
  const pts = str(p, 'path', '0,0;3,0;3,3;0,3').split(';').map((s) => { const [x, z] = s.split(',').map(Number); return new Vector3(x! - p.x, 0, z! - p.z); });
  const curve = new CatmullRomCurve3(pts, true, 'catmullrom', 0.4); let u = (p.x * 0.13) % 1; const len = curve.getLength();
  g.position.y = y;
  return { object: g, tick: (dt, t) => {
    u = (u + (Math.max(0, dt) * 1.1) / len) % 1; const a = curve.getPointAt(u), b = curve.getPointAt((u + 0.01) % 1);
    g.position.set(a.x, y + Math.sin(t * 2 + p.x) * 0.12, a.z); g.rotation.y = Math.atan2(-(b.x - a.x), -(b.z - a.z)); g.rotation.z = Math.sin(t * 1.5) * 0.06;
    for (const r of rotors) r.rotation.y += dt * 40;
    void ctx;
  } };
};

/** Shelving with parts bins: deterministic contents. */
const shelf: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 2.4), h = num(p, 'h', 2.2), d = num(p, 'd', 0.6), rows = num(p, 'rows', 4); const rnd = seeded(Math.floor(p.x * 31 + p.z * 17) + 7);
  for (const x of [-w / 2, w / 2]) g.add(rbox(0.07, h, d, GRAPHITE, { x, r: 0.02 }));
  g.add(rbox(w, h, 0.03, DARK, { z: -d / 2 + 0.015, r: 0.01 }));
  const palette = [0xb8863b, 0x3f6fb0, 0xc2603a, 0x5aa87a, 0xe5e9f5, 0x8b95b5];
  for (let r = 0; r < rows; r++) {
    const y = 0.18 + (r * (h - 0.3)) / rows; g.add(rbox(w, 0.05, d, STEEL, { y, r: 0.01, metal: 0.3 }));
    let x = -w / 2 + 0.16;
    while (x < w / 2 - 0.3) { const bw = 0.22 + rnd() * 0.3, bh = 0.18 + rnd() * 0.3; if (x + bw > w / 2 - 0.1) break; g.add(rbox(bw, bh, d * 0.7, palette[Math.floor(rnd() * palette.length)]!, { x: x + bw / 2, y: y + 0.05, z: 0.02, r: 0.02 })); x += bw + 0.06; }
  }
  return { object: g };
};

/** A rotating warning beacon. */
const warnlight: Builder = (p) => {
  const g = new Group(); const c = col(p, 'color', AMBER);
  g.add(rcyl(0.18, 0.22, 0.12, GRAPHITE), rcyl(0.14, 0.16, 0.2, c, { y: 0.12, glow: 1.2, transparent: 0.85 }));
  const bar = rbox(0.5, 0.04, 0.04, 0xffffff, { y: 0.22, glow: 1.5 }); g.add(bar);
  return { object: g, tick: (dt) => { bar.rotation.y += dt * 4; } };
};

/** A planter with low-poly greenery. */
const planter: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 1.4); const rnd = seeded(Math.floor(p.x * 13 + p.z * 7) + 3);
  g.add(rbox(w, 0.5, 0.7, 0x39405c, { rough: 0.6 }), rbox(w - 0.1, 0.06, 0.6, 0x3a2b1f, { y: 0.5 }));
  for (let i = 0; i < 6; i++) { const h = 0.5 + rnd() * 0.6; const leaf = rcyl(0.01, 0.1 + rnd() * 0.07, h, [0x3fae6a, 0x2f8f5b, 0x56c27f][i % 3]!, { x: (rnd() - 0.5) * (w - 0.3), z: (rnd() - 0.5) * 0.4, y: 0.52, rz: (rnd() - 0.5) * 0.4, rough: 0.9 }); g.add(leaf); }
  return { object: g };
};

/** A machine: housing, control panel, a press that moves, indicator lights, occasional steam. */
const machine: Builder = (p, ctx) => {
  const g = new Group(); const w = num(p, 'w', 2.2), h = num(p, 'h', 2.2), d = num(p, 'd', 1.4), c = col(p, 'color', 0x3f6fb0);
  g.add(rbox(w, h, d, c, { rough: 0.5, metal: 0.3 }), rbox(w + 0.1, 0.12, d + 0.1, GRAPHITE, { y: h }), rbox(w * 0.6, 0.55, 0.06, DARK, { y: h * 0.45, z: d / 2 + 0.01 }), rbox(w * 0.5, 0.4, 0.02, 0x0b1d17, { y: h * 0.45 + 0.07, z: d / 2 + 0.045, glow: 0.4 }));
  for (let i = 0; i < 3; i++) g.add(rsph(0.05, [GREEN, AMBER, RED][i]!, { x: -0.25 + i * 0.25, y: h * 0.45 + 0.65, z: d / 2 + 0.05, glow: 1.1 }));
  const press = rbox(0.5, 0.5, 0.5, STEEL, { y: h + 0.12, metal: 0.4, rough: 0.35 }); const rod = rcyl(0.07, 0.07, 0.7, GRAPHITE, { y: h + 0.5 }); g.add(press, rod);
  let steam = 3 + (p.x % 3);
  return { object: g, tick: (dt, t) => { const k = 0.5 + 0.5 * Math.sin(t * 1.6 + p.z); press.position.y = h + 0.12 + 0.25 - k * 0.3 + 0.25; steam -= dt; if (steam <= 0) { steam = 5 + Math.random() * 4; ctx.fx.burst('steam', p.x, h + 0.3, p.z, 10, 0.5); } } };
};

/** The overhead lamp arm above the repair table. */
const lamparm: Builder = () => {
  const g = new Group();
  g.add(rcyl(0.25, 0.3, 0.2, GRAPHITE), rcyl(0.06, 0.06, 2.6, STEEL, { y: 0.2, metal: 0.4 }));
  const a = new Group(); a.position.y = 2.8; g.add(a); a.rotation.z = -0.9;
  a.add(rcyl(0.05, 0.05, 1.8, STEEL, { rz: Math.PI / 2, x: 0.9, y: -0.0, metal: 0.4 }));
  const head = new Group(); head.position.x = 1.8; a.add(head);
  head.add(rcyl(0.4, 0.22, 0.2, GRAPHITE, { y: -0.2 }), rcyl(0.36, 0.36, 0.03, 0xffffff, { y: -0.22, glow: 1.6 }));
  return { object: g, tick: (_d, t) => { a.rotation.z = -0.9 + Math.sin(t * 0.3) * 0.02; } };
};

/** The repair table: a pedestal, a padded top with a steel rim, side light strips and a trolley of instruments. Surface at y = 1.0. */
const optable: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 3.6), d = num(p, 'd', 1.5);
  g.add(rbox(w - 0.5, 0.2, d - 0.3, GRAPHITE, { rough: 0.5 }), rbox(w * 0.45, 0.8, d * 0.45, 0x39405c, { y: 0.2, rough: 0.5, metal: 0.3 }), rbox(w + 0.15, 0.1, d + 0.15, 0xcfd6ea, { y: 0.9, rough: 0.3, metal: 0.4, r: 0.04 }));
  g.add(rbox(w - 0.1, 0.05, d - 0.1, 0x3b4a6a, { y: 1.0, rough: 0.9, r: 0.03 }));
  g.add(rbox(w - 0.3, 0.04, 0.05, CYAN, { y: 0.93, z: d / 2 + 0.09, glow: 1.2 }), rbox(w - 0.3, 0.04, 0.05, CYAN, { y: 0.93, z: -d / 2 - 0.09, glow: 1.2 }));
  return { object: g };
};

/** A vending machine. */
const vending: Builder = (p) => {
  const g = new Group(); const c = col(p, 'color', 0xc2603a); const rnd = seeded(Math.floor(p.x * 5 + p.z * 3) + 9);
  g.add(rbox(1.1, 2.0, 0.8, c, { rough: 0.4, metal: 0.25 }), rbox(0.8, 1.3, 0.04, 0x10142c, { x: -0.06, y: 0.5, z: 0.4, glow: 0.2 }));
  for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) g.add(rbox(0.12, 0.2, 0.05, [GREEN, CYAN, AMBER, RED, 0xffffff][Math.floor(rnd() * 5)]!, { x: -0.3 + i * 0.16, y: 0.62 + r * 0.3, z: 0.38, glow: 0.4, r: 0.02 }));
  g.add(rbox(0.16, 0.7, 0.04, DARK, { x: 0.43, y: 0.7, z: 0.4 }), rbox(1.0, 0.1, 0.05, 0xffffff, { y: 1.88, z: 0.4, glow: 1 }));
  return { object: g };
};

/** A pipe run from the prop's position to (dx, dz) at height y, with clamps. */
const pipe: Builder = (p) => {
  const g = new Group(); const dx = num(p, 'dx', 4), dz = num(p, 'dz', 0), y = num(p, 'y', 2.4), r = num(p, 'r', 0.09), c = col(p, 'color', 0x7a84a8);
  const len = Math.hypot(dx, dz); const body = rcyl(r, r, len, c, { rz: Math.PI / 2, x: len / 2, y, metal: 0.45, rough: 0.4 }); g.add(body);
  for (let s = 0.5; s < len; s += 1.8) g.add(rbox(0.1, r * 2 + 0.1, r * 2 + 0.08, GRAPHITE, { x: s, y: y - r - 0.04, r: 0.02 }));
  g.rotation.y = Math.atan2(-dz, dx);
  return { object: g };
};

/** A cable hanging between the prop and (dx, dz) with sag. */
const cable: Builder = (p) => {
  const dx = num(p, 'dx', 3), dz = num(p, 'dz', 0), y = num(p, 'y', 3), sag = num(p, 'sag', 0.6), c = col(p, 'color', 0x1c2036);
  const a = new Vector3(0, y, 0), b = new Vector3(dx, num(p, 'y2', y), dz), m = a.clone().lerp(b, 0.5); m.y -= sag;
  const curve = new CatmullRomCurve3([a, a.clone().lerp(m, 0.5), m, m.clone().lerp(b, 0.5), b]);
  const mesh = new Mesh(new TubeGeometry(curve, 16, 0.045, 6), mat(c, col(p, 'glowColor', 0) ? 0.5 : 0, { rough: 0.8 }));
  return { object: mesh };
};

/** A tall display or notice stand, glowing. */
const kiosk: Builder = (p) => {
  const g = new Group();
  g.add(rbox(0.9, 0.12, 0.7, GRAPHITE), rbox(0.14, 1.1, 0.14, STEEL, { y: 0.12, metal: 0.4 }), rbox(1.2, 0.8, 0.08, DARK, { y: 1.1, rx: -0.2, z: 0 }));
  g.add(sign(str(p, 'text', 'INFO').split('|'), 1.1, 0.7, { bg: '#0b1d17', fg: hexs(col(p, 'color', GREEN)), y: 1.5, z: 0.045, ry: 0 }));
  (g.children[g.children.length - 1] as Mesh).rotation.x = -0.2;
  return { object: g };
};

/** A stack of crates and barrels with variety. */
const stack: Builder = (p) => {
  const g = new Group(); const rnd = seeded(Math.floor(p.x * 11 + p.z * 5) + 1);
  g.add(rbox(1.0, 0.9, 1.0, 0xb8863b, { rough: 0.8 }), rbox(0.8, 0.7, 0.8, 0x9c6b2f, { x: 0.1, y: 0.9, rough: 0.8, ry: (rnd() - 0.5) * 0.5 }), rcyl(0.35, 0.35, 0.9, 0x3f6fb0, { x: 0.95, z: 0.2, metal: 0.3 }), rcyl(0.37, 0.37, 0.06, DARK, { x: 0.95, z: 0.2, y: 0.4 }));
  return { object: g };
};

/** A tool cart. */
const cart: Builder = () => {
  const g = new Group();
  g.add(rbox(1.2, 0.08, 0.6, STEEL, { y: 0.35, metal: 0.4 }), rbox(1.2, 0.08, 0.6, STEEL, { y: 0.85, metal: 0.4 }), rbox(1.2, 0.5, 0.04, GRAPHITE, { y: 0.4, z: -0.28 }));
  for (const [x, z] of [[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]] as const) g.add(rcyl(0.07, 0.07, 0.07, DARK, { x, z, y: 0.02, rz: Math.PI / 2 }), rbox(0.05, 0.5, 0.05, STEEL, { x, z, y: 0.35 }));
  g.add(rbox(0.3, 0.1, 0.18, RED, { x: -0.3, y: 0.93, r: 0.03 }), rcyl(0.05, 0.05, 0.3, YELLOW, { x: 0.3, y: 0.93, rz: Math.PI / 2 }), rbox(0.2, 0.2, 0.2, 0x3f6fb0, { x: 0.4, y: 0.43, r: 0.03 }));
  return { object: g };
};

/** An upgraded archway: heavy frame, glowing inner rim, a softly pulsing portal plane and a sign. */
const gateway: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 4), h = num(p, 'h', 4.2), c = col(p, 'color', GREEN);
  g.add(rbox(0.7, h, 0.9, GRAPHITE, { x: -w / 2 - 0.1, rough: 0.5, metal: 0.3 }), rbox(0.7, h, 0.9, GRAPHITE, { x: w / 2 + 0.1, rough: 0.5, metal: 0.3 }), rbox(w + 1.5, 0.8, 1.0, GRAPHITE, { y: h, rough: 0.5, metal: 0.3 }));
  g.add(rbox(0.12, h - 0.2, 0.14, c, { x: -w / 2 + 0.28, y: 0.1, z: 0.4, glow: 1 }), rbox(0.12, h - 0.2, 0.14, c, { x: w / 2 - 0.08, y: 0.1, z: 0.4, glow: 1 }), rbox(w - 0.2, 0.12, 0.14, c, { y: h - 0.14, z: 0.4, glow: 1 }));
  g.add(sign(str(p, 'text', '').split('|'), w + 0.2, 0.9, { bg: '#0d1020', fg: hexs(c), y: h + 0.1, z: 0.52 }));
  let field: Mesh | null = null;
  if (p.p?.portal !== false) { field = new Mesh(planeGeo, new MeshBasicMaterial({ color: c, transparent: true, opacity: 0.22, toneMapped: false, depthWrite: false })); field.scale.set(w - 0.1, h - 0.3, 1); field.position.set(0, h / 2 - 0.1, 0); g.add(field); }
  return { object: g, tick: (_d, t) => { if (field) (field.material as MeshBasicMaterial).opacity = 0.16 + 0.08 * Math.sin(t * 2 + p.x); } };
};

/** A vent / drain grate set in the floor or wall. */
const vent: Builder = (p) => {
  const w = num(p, 'w', 1.2), d = num(p, 'd', 0.8);
  const m = new Mesh(planeGeo, new MeshStandardMaterial({ map: grate(col(p, 'color', 0x4a5472)), roughness: 0.6, metalness: 0.4 })); m.rotation.x = -Math.PI / 2; m.scale.set(w, d, 1); m.position.y = 0.03;
  return { object: m };
};

/** Hazard-striped edging (a real texture, not a stack of boxes). */
const hazardstrip: Builder = (p) => {
  const w = num(p, 'w', 4), d = num(p, 'd', 0.35);
  const tex = hazard(YELLOW, 0x1b1b24).clone(); tex.needsUpdate = true; tex.userData.shared = false; tex.wrapS = tex.wrapT = RepeatWrapping; tex.repeat.set(w / 0.7, 1);
  const m = new Mesh(planeGeo, new MeshStandardMaterial({ map: tex, roughness: 0.7 })); m.rotation.x = -Math.PI / 2; m.scale.set(w, d, 1); m.position.y = 0.025; m.receiveShadow = true;
  return { object: m };
};

/** The pit building: a long garage block with a roof overhang, bay doors with glowing frames and a sponsor sign. */
const pitbuilding: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 40), d = num(p, 'd', 8), h = num(p, 'h', 6), c = col(p, 'color', 0x4b5068), accent = col(p, 'accent', 0xe63946), bays = num(p, 'bays', 6);
  g.add(rbox(w, h, d, c, { rough: 0.6, r: 0.15 }), rbox(w + 1.2, 0.5, d + 3.2, 0x2a2f45, { y: h, z: 1.5, r: 0.1, metal: 0.3 }), rbox(w + 1.2, 0.18, 0.4, accent, { y: h - 0.3, z: d / 2 + 2.9, glow: 0.8, r: 0.05 }));
  const bw = (w - 4) / bays;
  for (let i = 0; i < bays; i++) { const x = -w / 2 + 2 + bw * (i + 0.5); g.add(rbox(bw - 1.2, h - 2.2, 0.2, 0x1c2036, { x, y: 0.1, z: d / 2 + 0.05, r: 0.05, metal: 0.3 }), rbox(bw - 0.9, 0.18, 0.28, accent, { x, y: h - 2.2, z: d / 2 + 0.1, glow: 0.9, r: 0.04 }), rbox(0.14, h - 2.1, 0.28, accent, { x: x - (bw - 0.9) / 2, y: 0.1, z: d / 2 + 0.1, glow: 0.6 }), rbox(0.14, h - 2.1, 0.28, accent, { x: x + (bw - 0.9) / 2, y: 0.1, z: d / 2 + 0.1, glow: 0.6 })); }
  g.add(sign(str(p, 'text', 'REDLINE').split('|'), Math.min(14, w * 0.4), 1.1, { bg: '#1b1b2f', fg: hexs(accent), y: h - 1.1, z: d / 2 + 0.3, font: 56 }));
  return { object: g };
};

/** A flag on a pole that ripples. */
const pennant: Builder = (p) => {
  const g = new Group(); const h = num(p, 'h', 7), c = col(p, 'color', 0xe63946);
  g.add(rcyl(0.07, 0.1, h, 0xcfd6ea, { metal: 0.5, rough: 0.3 }), rsph(0.11, 0xffd166, { y: h + 0.05, glow: 0.5 }));
  const cloth = new Mesh(planeGeo, new MeshStandardMaterial({ color: c, roughness: 0.8, side: 2 })); cloth.scale.set(2.4, 1.4, 1); cloth.position.set(1.25, h - 0.8, 0); g.add(cloth);
  return { object: g, tick: (_dt, t) => { cloth.rotation.y = Math.sin(t * 2 + p.x) * 0.25; cloth.scale.x = 2.4 + Math.sin(t * 3 + p.z) * 0.12; } };
};

/** An awning tent with posts and a striped roof (hospitality, a pit-lane shelter). */
const tent: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 6), d = num(p, 'd', 4), c = col(p, 'color', 0xe63946);
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) g.add(rcyl(0.06, 0.06, 2.6, 0xcfd6ea, { x, z, metal: 0.4 }));
  for (let i = 0; i < 6; i++) g.add(rbox(w / 6, 0.14, d + 0.8, i % 2 ? 0xf5f5f5 : c, { x: -w / 2 + (i + 0.5) * (w / 6), y: 2.6 + (i < 3 ? i : 5 - i) * 0.12, r: 0.03, rough: 0.9 }));
  g.add(rbox(w - 0.6, 0.12, 0.9, 0x8a5a33, { y: 0.8, z: d / 2 - 0.6 }), rbox(0.6, 0.12, 0.6, 0xf5f5f5, { x: -1, y: 0.95, z: d / 2 - 0.6 }));
  return { object: g };
};

/** A row of traffic cones. */
const cones: Builder = (p) => {
  const g = new Group(); const n = num(p, 'n', 6), step = num(p, 'step', 2);
  for (let i = 0; i < n; i++) g.add(rcyl(0.04, 0.2, 0.6, 0xff7b00, { x: i * step, glow: 0.15 }), rbox(0.42, 0.04, 0.42, 0xff7b00, { x: i * step }), rcyl(0.1, 0.16, 0.08, 0xffffff, { x: i * step, y: 0.28 }));
  return { object: g };
};

/** The timing tower: a tall block with a glass band, a glowing board and a roof deck. */
const timingtower: Builder = (p) => {
  const g = new Group(); const h = num(p, 'h', 14);
  g.add(rbox(5, h, 4, 0x39405c, { rough: 0.5, metal: 0.3, r: 0.12 }), rbox(5.4, 0.5, 4.4, 0x2a2f45, { y: h }));
  for (let i = 0; i < 3; i++) g.add(rbox(4.4, 1.2, 0.1, 0x8be9fd, { y: 3 + i * 3.4, z: 2.05, glow: 0.5, transparent: 0.7, r: 0.03 }));
  g.add(sign(['LAP TIMES', '1  #7   0:38.3', '2  #3   0:39.1', '3  #11  0:40.4'], 4.2, 2.2, { bg: '#0a0f1c', fg: '#ffd166', y: h - 3, z: 2.08, font: 30 }));
  return { object: g };
};

export const industrialBuilders: Record<string, Builder> = { pitbuilding, pennant, tent, cones, timingtower, optable, floorMetal, glowstrip, floorEmblem, gearsculpt, reception, monitorwall, dock, drone, shelf, warnlight, planter, machine, lamparm, vending, pipe, cable, kiosk, stack, cart, gateway, vent, hazardstrip };
void shape; void wallPanel;
