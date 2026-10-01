/**
 * CHARACTER PARTS: the stylised low-poly look of every person and robot. Shared (cached) rounded geometry, one toon-shaded material per colour
 * and an inverted-hull outline on the big forms give a hand-drawn silhouette that stays readable at any distance, for a few dozen draw calls
 * per character. Skeleton convention: a character FACES -Z (north) at rotation 0, hanging limbs rotate about X, +X rotation swings a limb forward.
 */
import {
  BackSide, CapsuleGeometry, CylinderGeometry, DataTexture, Group, Mesh, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat, SphereGeometry, TorusGeometry,
  type BufferGeometry, type Material,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { NpcLook } from '../logic/dialogue';

/* ------------------------------------------------------------------ shared resources */

const ramp = new DataTexture(new Uint8Array([70, 140, 205, 255]), 4, 1, RedFormat);
ramp.minFilter = ramp.magFilter = NearestFilter; ramp.needsUpdate = true; ramp.userData.shared = true;

const mats = new Map<string, Material>();
/** A toon-shaded material for a colour (shared). `glow` adds emissive light (eyes, visors, indicator lights). */
export function toon(color: number, glow = 0): Material {
  const key = `${color}|${glow}`;
  let m = mats.get(key);
  if (!m) { m = new MeshToonMaterial({ color, gradientMap: ramp, emissive: glow ? color : 0x000000, emissiveIntensity: glow }); m.userData.shared = true; mats.set(key, m); }
  return m;
}
const outlineMat = new MeshBasicMaterial({ color: 0x10142c, side: BackSide }); outlineMat.userData.shared = true;

const geos = new Map<string, BufferGeometry>();
function cached(key: string, make: () => BufferGeometry): BufferGeometry { let g = geos.get(key); if (!g) { g = make(); g.userData.shared = true; geos.set(key, g); } return g; }
const q = (n: number) => Math.round(n * 1000) / 1000;
export const sphereG = (r: number) => cached(`s${q(r)}`, () => new SphereGeometry(r, 16, 12));
export const capsuleG = (r: number, len: number) => cached(`c${q(r)}|${q(len)}`, () => new CapsuleGeometry(r, len, 4, 10));
/** A rounded box. Bevel segments scale down with size: small pieces get 1 (a chamfer), others 2, so a busy scene stays cheap. */
export const boxG = (w: number, h: number, d: number, r = 0.02) => cached(`b${q(w)}|${q(h)}|${q(d)}|${q(r)}`, () => new RoundedBoxGeometry(w, h, d, Math.min(w, h, d) < 0.12 ? 1 : 2, r));
export const cylG = (rt: number, rb: number, h: number, seg = 14) => cached(`y${q(rt)}|${q(rb)}|${q(h)}|${seg}`, () => new CylinderGeometry(rt, rb, h, seg));
export const torusG = (r: number, t: number) => cached(`t${q(r)}|${q(t)}`, () => new TorusGeometry(r, t, 8, 20));
export const domeG = (r: number, theta: number, phiStart = 0, phiLen = Math.PI * 2, thetaStart = 0) => cached(`d${q(r)}|${q(theta)}|${q(phiStart)}|${q(phiLen)}|${q(thetaStart)}`, () => new SphereGeometry(r, 18, 10, phiStart, phiLen, thetaStart, theta));

/** Whether big forms get the dark outline (off on the low quality preset: it doubles their draw calls). */
let outlines = true;
export function setOutlines(on: boolean): void { outlines = on; }

export interface PartOpts { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; sx?: number; sy?: number; sz?: number; glow?: number; outline?: boolean }
/** A mesh of shared geometry and a toon material; `outline` adds the hull. */
export function part(geo: BufferGeometry, color: number, o: PartOpts = {}): Mesh {
  const m = new Mesh(geo, toon(color, o.glow ?? 0));
  m.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
  m.rotation.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
  m.scale.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
  m.castShadow = true;
  if (o.outline && outlines) { const h = new Mesh(geo, outlineMat); h.scale.setScalar(1.075); h.userData.outline = true; m.add(h); }
  return m;
}
export function disposeRigKit(): void { for (const g of geos.values()) g.dispose(); geos.clear(); for (const m of mats.values()) m.dispose(); mats.clear(); }

/* ------------------------------------------------------------------ the skeleton */

/** Named joints shared by every character, so one animation drives people and robots alike. */
export interface Skeleton {
  root: Group;
  hips: Group; torso: Group; head: Group;
  thighL: Group; thighR: Group; shinL: Group; shinR: Group;
  upperL: Group; upperR: Group; foreL: Group; foreR: Group;
  /** Face parts (people) or eyes (robots): blink and expression. */
  eyes: Mesh[]; brows: Mesh[]; mouth: Mesh;
  /** Hanging cloth that swings with movement: a skirt/robe and a cape. */
  skirt?: Group; cape?: Group;
  /** Lights that can pulse (robots). */
  lights: Mesh[];
  height: number;
}

const SKIN_SHADE = (c: number) => { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; return (Math.round(r * 0.82) << 16) | (Math.round(g * 0.74) << 8) | Math.round(b * 0.72); };
const darken = (c: number, k: number) => { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; return (Math.round(r * k) << 16) | (Math.round(g * k) << 8) | Math.round(b * k); };

const HIPS_Y = 0.89, THIGH = 0.42, SHIN = 0.40, ANKLE = 0.07;

function joint(parent: Group, x: number, y: number, z = 0): Group { const g = new Group(); g.position.set(x, y, z); parent.add(g); return g; }

/** The shared body plan: hips → torso → head, arms from the shoulders, legs from the hips. The caller fills in the forms. */
function frame(): Skeleton {
  const root = new Group();
  const hips = joint(root, 0, HIPS_Y);
  const torso = joint(hips, 0, 0.08);
  const head = joint(torso, 0, 0.7);
  const thighL = joint(hips, -0.1, 0), thighR = joint(hips, 0.1, 0);
  const shinL = joint(thighL, 0, -THIGH), shinR = joint(thighR, 0, -THIGH);
  const upperL = joint(torso, -0.225, 0.5), upperR = joint(torso, 0.225, 0.5);
  const foreL = joint(upperL, 0, -0.28), foreR = joint(upperR, 0, -0.28);
  return { root, hips, torso, head, thighL, thighR, shinL, shinR, upperL, upperR, foreL, foreR, eyes: [], brows: [], mouth: new Mesh(), lights: [], height: 1.74 };
}

/* ------------------------------------------------------------------ people */

type Hat = NonNullable<NpcLook['hat']>;
const DEFAULT_OUTFIT: Record<Hat, NonNullable<NpcLook['outfit']>> = { hardhat: 'overalls', cap: 'jacket', wizard: 'robe', hood: 'robe', visor: 'jacket', helmet: 'jacket', headband: 'vest', none: 'jacket' };

function hat(sk: Skeleton, kind: Hat, c: number): void {
  const h = sk.head;
  switch (kind) {
    case 'hardhat': h.add(part(domeG(0.145, Math.PI * 0.55), c, { y: 0.03 }), part(cylG(0.17, 0.17, 0.025), c, { y: 0.045 }), part(boxG(0.05, 0.03, 0.16, 0.012), c, { y: 0.095 }), part(boxG(0.05, 0.03, 0.04), 0xfff1a8, { y: 0.07, z: -0.15, glow: 0.8 })); break;
    case 'cap': h.add(part(domeG(0.14, Math.PI * 0.52), c, { y: 0.035 }), part(boxG(0.2, 0.015, 0.14, 0.008), c, { y: 0.045, z: -0.15, rx: 0.12 })); break;
    case 'wizard': h.add(part(cylG(0.24, 0.24, 0.02, 20), c, { y: 0.06, outline: true }), part(cylG(0.004, 0.145, 0.46, 16), c, { y: 0.3, rx: -0.14, outline: true }), part(torusG(0.15, 0.018), 0xffd166, { y: 0.1, rx: Math.PI / 2, glow: 0.5 })); break;
    case 'hood': h.add(part(domeG(0.158, Math.PI * 0.8), c, { y: 0.0, ry: 0 }), part(sphereG(0.07), c, { y: -0.12, z: 0.1, sx: 1.5, sy: 0.9, sz: 1 })); break;
    case 'visor': h.add(part(boxG(0.26, 0.05, 0.05, 0.02), c, { y: 0.03, z: -0.115, glow: 1 })); break;
    case 'helmet': h.add(part(domeG(0.152, Math.PI * 0.62), c, { y: 0.01 })); break;
    case 'headband': h.add(part(torusG(0.128, 0.014), c, { y: 0.055, rx: Math.PI / 2 })); break;
    case 'none': break;
  }
}

function hair(sk: Skeleton, style: NonNullable<NpcLook['hairStyle']>, c: number): void {
  const h = sk.head;
  if (style === 'bald') return;
  h.add(part(domeG(0.138, Math.PI * 0.46), c, { y: 0.022 }));            // crown
  h.add(part(domeG(0.136, Math.PI * 0.42, Math.PI * 0.28, Math.PI * 1.44, Math.PI * 0.4), c, { y: 0.0, z: 0.012 })); // back and sides
  if (style === 'long') h.add(part(capsuleG(0.11, 0.2), c, { y: -0.17, z: 0.075, sz: 0.7, outline: true }));
  if (style === 'bun') h.add(part(sphereG(0.07), c, { y: 0.17, z: 0.06, outline: true }));
  if (style === 'curly') h.add(part(sphereG(0.075), c, { y: 0.1, z: -0.1, x: 0.07 }), part(sphereG(0.075), c, { y: 0.1, z: -0.1, x: -0.07 }), part(sphereG(0.08), c, { y: 0.14, z: 0.0 }));
  if (style === 'short') h.add(part(boxG(0.18, 0.04, 0.05, 0.02), c, { y: 0.075, z: -0.115 })); // fringe
}

/** Build a person: head, face, hair, outfit, accessories. `look` colours: body = clothing, head = skin, accent = trim, hair. */
export function buildPerson(look: NpcLook): Skeleton {
  const sk = frame();
  const skin = look.head, cloth = look.body, trim = look.accent, hairC = look.hair ?? 0x2a1a12;
  const outfit = look.outfit ?? DEFAULT_OUTFIT[look.hat ?? 'none'];
  const legC = look.legs ?? (outfit === 'robe' ? darken(cloth, 0.6) : 0x2c3350), bootC = darken(legC, 0.55);
  const broad = look.build === 'broad' ? 1.12 : look.build === 'slim' ? 0.92 : 1;

  // legs: thigh + shin capsules, boot
  for (const [thigh, shin, side] of [[sk.thighL, sk.shinL, -1], [sk.thighR, sk.shinR, 1]] as const) {
    thigh.add(part(capsuleG(0.072, THIGH - 0.14), legC, { y: -THIGH / 2, outline: true }));
    shin.add(part(capsuleG(0.06, SHIN - 0.12), legC, { y: -SHIN / 2, outline: true }));
    shin.add(part(boxG(0.115, 0.085, 0.26, 0.035), bootC, { y: -SHIN - 0.005, z: -0.045, outline: true }), part(boxG(0.1, 0.035, 0.22, 0.015), darken(bootC, 0.6), { y: -SHIN - 0.045, z: -0.045 }));
    void side;
  }
  // pelvis, belly and chest
  sk.hips.add(part(boxG(0.34 * broad, 0.17, 0.21, 0.07), legC, { y: 0.0, outline: true }));
  const chest = part(boxG(0.38 * broad, 0.5, 0.23, 0.1), cloth, { y: 0.3, outline: true });
  sk.torso.add(chest);
  sk.torso.add(part(boxG(0.34 * broad, 0.14, 0.215, 0.06), cloth, { y: 0.06 }));
  sk.torso.add(part(boxG(0.4 * broad, 0.045, 0.245, 0.02), trim, { y: 0.1 })); // belt / hem line
  // neck + head
  sk.torso.add(part(cylG(0.05, 0.055, 0.09), skin, { y: 0.585 }));
  sk.head.position.y = 0.7;
  const headM = part(sphereG(0.135), skin, { sy: 1.05, sz: 1.0, outline: true });
  sk.head.add(headM);
  // face: -Z is the front
  for (const s of [-1, 1]) {
    const white = part(sphereG(0.026), 0xffffff, { x: s * 0.048, y: 0.012, z: -0.108, sx: 1, sy: 1.15, sz: 0.55 });
    const pupil = part(sphereG(0.0145), 0x1b1b2f, { x: s * 0.048, y: 0.012, z: -0.1175, sz: 0.5 });
    const eye = new Group(); eye.add(white, pupil); eye.position.set(0, 0, 0); sk.head.add(eye); sk.eyes.push(white, pupil);
    const brow = part(boxG(0.05, 0.011, 0.016, 0.005), hairC, { x: s * 0.048, y: 0.058, z: -0.112 }); sk.head.add(brow); sk.brows.push(brow);
    sk.head.add(part(sphereG(0.026), skin, { x: s * 0.125, y: -0.005, sx: 0.5, sy: 1.2, sz: 0.8 }));
  }
  sk.head.add(part(sphereG(0.02), SKIN_SHADE(skin), { y: -0.012, z: -0.123, sx: 0.9, sy: 0.9, sz: 0.8 }));
  sk.mouth = part(boxG(0.05, 0.011, 0.012, 0.005), 0x7a3f2b, { y: -0.062, z: -0.112 }); sk.head.add(sk.mouth);
  hair(sk, look.hairStyle ?? (look.hat === 'wizard' || look.hat === 'hood' ? 'long' : 'short'), hairC);
  if (look.hat && look.hat !== 'none') hat(sk, look.hat, trim);
  // arms: sleeves in the clothing colour, cuff in trim, hand in skin
  for (const [up, fore] of [[sk.upperL, sk.foreL], [sk.upperR, sk.foreR]] as const) {
    up.add(part(sphereG(0.07), cloth, { outline: true }), part(capsuleG(0.052, 0.17), cloth, { y: -0.14, outline: true }));
    fore.add(part(capsuleG(0.045, 0.14), outfit === 'vest' ? skin : cloth, { y: -0.12, outline: true }), part(cylG(0.05, 0.05, 0.03), trim, { y: -0.2 }), part(sphereG(0.05), skin, { y: -0.25, outline: true }));
  }
  // outfit
  if (outfit === 'jacket' || outfit === 'overalls' || outfit === 'coat') {
    sk.torso.add(part(boxG(0.13, 0.05, 0.1, 0.02), trim, { y: 0.56, z: -0.07 }));               // collar
    sk.torso.add(part(boxG(0.025, 0.4, 0.012, 0.005), darken(cloth, 0.7), { y: 0.3, z: -0.118 })); // zip
  }
  if (outfit === 'overalls') {
    for (const s of [-1, 1]) sk.torso.add(part(boxG(0.045, 0.34, 0.025, 0.01), trim, { x: s * 0.1, y: 0.36, z: -0.118 }));
    sk.torso.add(part(boxG(0.17, 0.12, 0.03, 0.01), trim, { y: 0.17, z: -0.122 }));
  }
  if (outfit === 'coat') sk.hips.add(part(cylG(0.2 * broad, 0.25 * broad, 0.36, 16), cloth, { y: -0.17, outline: true }));
  if (outfit === 'robe') {
    const skirt = new Group(); skirt.position.y = 0.04; sk.hips.add(skirt); sk.skirt = skirt;
    skirt.add(part(cylG(0.2 * broad, 0.34, 0.66, 18), cloth, { y: -0.33, outline: true }), part(torusG(0.335, 0.018), trim, { y: -0.655, rx: Math.PI / 2 }));
    sk.torso.add(part(boxG(0.1, 0.5, 0.012, 0.005), trim, { y: 0.3, z: -0.12 })); // front panel
    sk.torso.add(part(torusG(0.12, 0.034), trim, { y: 0.57, rx: Math.PI / 2 }));       // mantle edge
  }
  if (outfit === 'vest') { sk.torso.add(part(boxG(0.39 * broad, 0.4, 0.235, 0.09), trim, { y: 0.33 })); }
  // accessories
  const acc = look.accessory;
  if (acc === 'toolbelt' || outfit === 'overalls') {
    sk.hips.add(part(torusG(0.19, 0.03), 0x7a5230, { y: 0.1, rx: Math.PI / 2 }));
    for (const s of [-1, 1]) sk.hips.add(part(boxG(0.08, 0.1, 0.06, 0.02), 0x8a5a33, { x: s * 0.16, y: 0.04, z: -0.06 }));
    sk.hips.add(part(boxG(0.02, 0.15, 0.02, 0.005), 0xcfd6ea, { x: 0.17, y: 0.1, z: -0.09, rx: 0.3 }));
  }
  if (acc === 'backpack') sk.torso.add(part(boxG(0.28, 0.34, 0.14, 0.05), trim, { y: 0.3, z: 0.18, outline: true }));
  if (acc === 'scarf') sk.torso.add(part(torusG(0.075, 0.032), trim, { y: 0.58, rx: Math.PI / 2 }), part(boxG(0.06, 0.22, 0.02, 0.01), trim, { x: 0.05, y: 0.45, z: -0.12 }));
  if (acc === 'goggles') sk.head.add(part(torusG(0.128, 0.012), 0x2a2f45, { y: 0.07, rx: Math.PI / 2 }), part(boxG(0.1, 0.045, 0.02, 0.01), 0x8be9fd, { x: -0.05, y: 0.095, z: -0.12, glow: 0.7 }), part(boxG(0.1, 0.045, 0.02, 0.01), 0x8be9fd, { x: 0.05, y: 0.095, z: -0.12, glow: 0.7 }));
  if (acc === 'satchel') sk.torso.add(part(boxG(0.2, 0.17, 0.07, 0.03), 0x8a5a33, { x: 0.2, y: 0.12, z: -0.02, outline: true }), part(boxG(0.03, 0.55, 0.012, 0.005), 0x6f4527, { y: 0.3, z: -0.12, rz: 0.55 }));
  if (acc === 'cape') {
    const cape = new Group(); cape.position.set(0, 0.52, 0.12); sk.torso.add(cape); sk.cape = cape;
    cape.add(part(boxG(0.4 * broad, 0.78, 0.03, 0.01), trim, { y: -0.39, outline: true }));
  }
  if (acc === 'lanyard') sk.torso.add(part(boxG(0.014, 0.28, 0.012, 0.004), trim, { y: 0.42, z: -0.12 }), part(boxG(0.07, 0.09, 0.012, 0.004), 0xffffff, { y: 0.26, z: -0.123 }));
  void headM;
  return sk;
}

/* ------------------------------------------------------------------ robots */

/** Build a robot: rounded plating, a dark visor with glowing eyes, an antenna, segmented limbs. `body` = plating, `head` = head plating, `accent` = lights. */
export function buildRobot(look: NpcLook): Skeleton {
  const sk = frame();
  const plate = look.body, head = look.head, glow = look.accent, dark = 0x2a2f45, steel = 0x8fa3c7;
  sk.hips.add(part(boxG(0.3, 0.16, 0.2, 0.06), dark, { outline: true }));
  sk.torso.add(part(boxG(0.4, 0.46, 0.27, 0.09), plate, { y: 0.3, outline: true }), part(boxG(0.3, 0.16, 0.22, 0.05), dark, { y: 0.06 }));
  const panel = part(boxG(0.24, 0.17, 0.02, 0.01), 0x10142c, { y: 0.36, z: -0.14 }); sk.torso.add(panel);
  const chestLight = part(boxG(0.14, 0.07, 0.015, 0.006), glow, { y: 0.36, z: -0.152, glow: 1.1 }); sk.torso.add(chestLight); sk.lights.push(chestLight);
  sk.torso.add(part(boxG(0.34, 0.03, 0.01, 0.004), glow, { y: 0.2, z: -0.139, glow: 0.8 }));
  sk.torso.add(part(cylG(0.07, 0.08, 0.1), dark, { y: 0.58 }));
  sk.head.position.y = 0.71;
  sk.head.add(part(boxG(0.3, 0.24, 0.26, 0.07), head, { outline: true }), part(boxG(0.25, 0.1, 0.02, 0.04), 0x10142c, { y: 0.015, z: -0.132 }));
  for (const s of [-1, 1]) { const e = part(boxG(0.07, 0.04, 0.014, 0.012), glow, { x: s * 0.052, y: 0.015, z: -0.143, glow: 1.3 }); sk.head.add(e); sk.eyes.push(e); sk.lights.push(e); sk.head.add(part(cylG(0.03, 0.03, 0.05), dark, { x: s * 0.158, y: -0.01, rz: Math.PI / 2 })); }
  sk.mouth = part(boxG(0.1, 0.012, 0.012, 0.004), glow, { y: -0.075, z: -0.134, glow: 0.7 }); sk.head.add(sk.mouth);
  sk.head.add(part(cylG(0.012, 0.012, 0.13), dark, { y: 0.18 }), part(sphereG(0.032), glow, { y: 0.255, glow: 1.2 }));
  sk.lights.push(sk.head.children[sk.head.children.length - 1] as Mesh);
  for (const [up, fore] of [[sk.upperL, sk.foreL], [sk.upperR, sk.foreR]] as const) {
    up.add(part(sphereG(0.075), dark, { outline: true }), part(capsuleG(0.048, 0.18), plate, { y: -0.14, outline: true }));
    fore.add(part(sphereG(0.052), dark), part(capsuleG(0.044, 0.15), steel, { y: -0.13, outline: true }), part(boxG(0.09, 0.09, 0.07, 0.03), glow, { y: -0.27, glow: 0.35, outline: true }));
  }
  for (const [thigh, shin] of [[sk.thighL, sk.shinL], [sk.thighR, sk.shinR]] as const) {
    thigh.add(part(capsuleG(0.062, THIGH - 0.14), steel, { y: -THIGH / 2, outline: true }));
    shin.add(part(sphereG(0.064), dark), part(capsuleG(0.052, SHIN - 0.14), plate, { y: -SHIN / 2, outline: true }), part(boxG(0.13, 0.085, 0.26, 0.04), dark, { y: -SHIN - 0.005, z: -0.05, outline: true }));
  }
  if (look.accessory === 'cape') { /* robots do not wear capes */ }
  sk.height = 1.74;
  return sk;
}

export const ANKLE_HEIGHT = ANKLE;
