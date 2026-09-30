import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, RepeatWrapping, CanvasTexture, SRGBColorSpace, MeshLambertMaterial, NearestFilter } from 'three';
import { mat, shape, sign } from './kit';
import { col, flag, num, str, type Builder } from './builders';

/** A checker/tile floor texture (cached per colour pair). */
const tileCache = new Map<string, CanvasTexture>();
function tileTexture(a: number, b: number, lines: number): CanvasTexture {
  const key = `${a}|${b}|${lines}`;
  let t = tileCache.get(key);
  if (t) return t;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
  g.fillStyle = hex(a); g.fillRect(0, 0, 64, 64);
  if (lines) { g.fillStyle = hex(b); g.fillRect(0, 0, 64, 2); g.fillRect(0, 0, 2, 64); } else { g.fillStyle = hex(b); g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32); }
  t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = SRGBColorSpace; t.magFilter = NearestFilter;
  tileCache.set(key, t);
  return t;
}

const floorGeo = new PlaneGeometry(1, 1);
floorGeo.userData.shared = true;

export const coreBuilders: Record<string, Builder> = {
  box: (p) => ({ object: shape('box', num(p, 'w', 1), num(p, 'h', 1), num(p, 'd', 1), col(p, 'color', 0x8892b0), { glow: num(p, 'glow', 0) }) }),
  cyl: (p) => ({ object: shape('cyl', num(p, 'w', 1), num(p, 'h', 1), num(p, 'w', 1), col(p, 'color', 0x8892b0), { glow: num(p, 'glow', 0) }) }),
  sphere: (p) => ({ object: shape('sphere', num(p, 'w', 1), num(p, 'h', num(p, 'w', 1)), num(p, 'w', 1), col(p, 'color', 0x8892b0), { glow: num(p, 'glow', 0) }) }),
  cone: (p) => ({ object: shape('cone', num(p, 'w', 1), num(p, 'h', 1), num(p, 'w', 1), col(p, 'color', 0x8892b0), { glow: num(p, 'glow', 0) }) }),
  glass: (p) => ({ object: shape('box', num(p, 'w', 1), num(p, 'h', 1), num(p, 'd', 0.1), col(p, 'color', 0x9fe8ff), { transparent: 0.28, cast: false }) }),
  /** A ground patch: checker or tiled floor (y slightly above the world ground to avoid z-fighting). */
  floor: (p) => {
    const w = num(p, 'w', 4), d = num(p, 'd', 4);
    const tex = tileTexture(col(p, 'color', 0x3a4058), col(p, 'color2', 0x444b66), flag(p, 'lines', true) ? 1 : 0).clone();
    tex.needsUpdate = true; tex.userData.shared = false; tex.repeat.set(w / num(p, 'tile', 2), d / num(p, 'tile', 2));
    const m = new Mesh(floorGeo, new MeshLambertMaterial({ map: tex }));
    m.rotation.x = -Math.PI / 2; m.scale.set(w, d, 1); m.position.y = num(p, 'lift', 0.01); m.receiveShadow = true;
    return { object: m };
  },
  wall: (p) => {
    const w = num(p, 'w', 4), h = num(p, 'h', 3), d = num(p, 'd', 0.3);
    const g = new Group();
    g.add(shape('box', w, h, d, col(p, 'color', 0x596080)));
    if (flag(p, 'trim', true)) g.add(shape('box', w + 0.04, 0.12, d + 0.06, col(p, 'trimColor', 0xf2c14e), { y: 0 }));
    return { object: g };
  },
  sign: (p) => {
    const w = num(p, 'w', 2), h = num(p, 'h', 0.7);
    const g = new Group();
    g.add(shape('box', 0.08, num(p, 'post', 0), 0.08, 0x333a52, { x: -w / 2 + 0.1 }), shape('box', 0.08, num(p, 'post', 0), 0.08, 0x333a52, { x: w / 2 - 0.1 }));
    g.add(shape('box', w + 0.12, h + 0.12, 0.08, col(p, 'frame', 0x22283d), { y: num(p, 'post', 0) }));
    g.add(sign(str(p, 'text', '').split('|'), w, h, { bg: str(p, 'bg', '#0d1b2a'), fg: str(p, 'fg', '#7dffb3'), z: 0.05, y: num(p, 'post', 0) + h / 2 }));
    return { object: g };
  },
  tree: (p) => {
    const g = new Group(); const s = num(p, 'scale', 1);
    g.add(shape('cyl', 0.3 * s, 1.2 * s, 0.3 * s, 0x6b4a2b), shape('cone', 1.5 * s, 1.6 * s, 1.5 * s, col(p, 'color', 0x2f8f5b), { y: 0.9 * s }), shape('cone', 1.2 * s, 1.3 * s, 1.2 * s, col(p, 'color', 0x36a266), { y: 1.7 * s }));
    return { object: g };
  },
  bush: (p) => ({ object: shape('sphere', num(p, 'w', 1), num(p, 'h', 0.7), num(p, 'w', 1), col(p, 'color', 0x2f8f5b)) }),
  lamppost: (p) => {
    const g = new Group(); const h = num(p, 'h', 3.4);
    g.add(shape('cyl', 0.12, h, 0.12, 0x2a2f45), shape('sphere', 0.42, 0.42, 0.42, col(p, 'color', 0xffe9a8), { y: h, glow: 1 }));
    return { object: g };
  },
  bench: () => { const g = new Group(); g.add(shape('box', 1.6, 0.12, 0.5, 0x8a5a33, { y: 0.45 }), shape('box', 1.6, 0.5, 0.1, 0x8a5a33, { y: 0.6, z: -0.22 }), shape('box', 0.1, 0.45, 0.4, 0x333a52, { x: -0.7 }), shape('box', 0.1, 0.45, 0.4, 0x333a52, { x: 0.7 })); return { object: g }; },
  crate: (p) => { const g = new Group(); const s = num(p, 'w', 1); g.add(shape('box', s, s, s, col(p, 'color', 0xb8863b)), shape('box', s + 0.02, 0.08, s + 0.02, 0x6b4a2b, { y: s * 0.46 }), shape('box', s + 0.02, 0.08, s + 0.02, 0x6b4a2b, { y: 0.02 })); return { object: g }; },
  barrel: (p) => { const g = new Group(); g.add(shape('cyl', 0.7, 1, 0.7, col(p, 'color', 0x2b6cb0)), shape('cyl', 0.74, 0.08, 0.74, 0x1a365d, { y: 0.25 }), shape('cyl', 0.74, 0.08, 0.74, 0x1a365d, { y: 0.7 })); return { object: g }; },
  pillar: (p) => { const g = new Group(); const h = num(p, 'h', 3); g.add(shape('cyl', num(p, 'w', 0.6), h, num(p, 'w', 0.6), col(p, 'color', 0x9aa3c0)), shape('box', num(p, 'w', 0.6) + 0.3, 0.2, num(p, 'w', 0.6) + 0.3, col(p, 'color', 0x9aa3c0), { y: h })); return { object: g }; },
  ground: (p) => {
    const m = new Mesh(floorGeo, new MeshBasicMaterial({ color: col(p, 'color', 0x2a2f45) }));
    m.rotation.x = -Math.PI / 2; m.scale.set(num(p, 'w', 10), num(p, 'd', 10), 1); m.position.y = num(p, 'lift', 0.005);
    return { object: m };
  },
  fountain: () => { const g = new Group(); g.add(shape('cyl', 3.2, 0.5, 3.2, 0x8892b0), shape('cyl', 2.7, 0.52, 2.7, 0x4fb3d9, { glow: 0.3 }), shape('cyl', 0.5, 1.6, 0.5, 0xb8c0dd), shape('sphere', 0.7, 0.35, 0.7, 0x9fe8ff, { y: 1.6, glow: 0.7 })); return { object: g }; },
  void: () => ({ object: new Group() }),
};
void mat;
