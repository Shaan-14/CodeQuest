/**
 * The shared toolbox of the 3D layer: one geometry per primitive and one material per colour, reused by every mesh (memory and draw-call
 * friendly), canvas-drawn labels, and small helpers. Everything it makes can be released with `disposeKit()` when the player leaves 3D.
 */
import {
  BoxGeometry, CanvasTexture, ConeGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, SphereGeometry, SRGBColorSpace, TorusGeometry,
  type BufferGeometry, type Material, type Object3D,
} from 'three';

const geo = {
  box: new BoxGeometry(1, 1, 1),
  cyl: new CylinderGeometry(0.5, 0.5, 1, 14),
  cylLow: new CylinderGeometry(0.5, 0.5, 1, 8),
  sphere: new SphereGeometry(0.5, 14, 10),
  cone: new ConeGeometry(0.5, 1, 10),
  plane: new PlaneGeometry(1, 1),
  torus: new TorusGeometry(0.5, 0.06, 6, 20),
};
export type GeoKey = keyof typeof geo;

const mats = new Map<string, Material>();
/** A flat-lit material for a colour (shared). `glow` adds emissive light so screens, lamps and magic read in any lighting. */
export function mat(color: number, glow = 0, opts: { transparent?: number; flat?: boolean } = {}): Material {
  const key = `${color}|${glow}|${opts.transparent ?? 1}|${opts.flat ?? false}`;
  let m = mats.get(key);
  if (!m) {
    m = opts.flat
      ? new MeshBasicMaterial({ color, transparent: opts.transparent !== undefined, opacity: opts.transparent ?? 1 })
      : new MeshLambertMaterial({ color, emissive: glow ? color : 0x000000, emissiveIntensity: glow, transparent: opts.transparent !== undefined, opacity: opts.transparent ?? 1 });
    m.userData.shared = true;
    mats.set(key, m);
  }
  return m;
}

/** A primitive scaled to size (w,h,d), base on the ground at y (so heights read naturally). */
export function shape(kind: GeoKey, w: number, h: number, d: number, color: number, o: { x?: number; y?: number; z?: number; glow?: number; transparent?: number; flat?: boolean; ry?: number; rx?: number; rz?: number; cast?: boolean } = {}): Mesh {
  const m = new Mesh(geo[kind] as BufferGeometry, mat(color, o.glow ?? 0, { transparent: o.transparent, flat: o.flat }));
  m.scale.set(w, h, d);
  m.position.set(o.x ?? 0, (o.y ?? 0) + h / 2, o.z ?? 0);
  if (o.ry) m.rotation.y = o.ry;
  if (o.rx) m.rotation.x = o.rx;
  if (o.rz) m.rotation.z = o.rz;
  m.castShadow = o.cast ?? kind !== 'plane';
  m.receiveShadow = true;
  return m;
}

/** Group helper: adds children and returns the group. */
export function group(...children: Object3D[]): Group { const g = new Group(); for (const c of children) g.add(c); return g; }

/* ------------------------------------------------------------------ labels (canvas text, cached) */

const labelCache = new Map<string, CanvasTexture>();
/** A crisp text texture: for signs, screens, scoreboards. Lines are drawn centred; cached by content. */
export function labelTexture(lines: string[], o: { bg?: string; fg?: string; w?: number; h?: number; font?: number } = {}): CanvasTexture {
  const key = JSON.stringify([lines, o]);
  const hit = labelCache.get(key);
  if (hit) return hit;
  const w = o.w ?? 256, h = o.h ?? 128;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = o.bg ?? '#0d1b2a'; g.fillRect(0, 0, w, h);
  g.fillStyle = o.fg ?? '#7dffb3';
  const size = o.font ?? Math.min(34, Math.floor((h / Math.max(lines.length, 1)) * 0.7));
  g.font = `600 ${size}px ui-monospace, Menlo, Consolas, monospace`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((t, i) => g.fillText(t, w / 2, (h / (lines.length + 1)) * (i + 1), w - 12));
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.userData.shared = true;
  labelCache.set(key, tex);
  return tex;
}
/** A flat plane showing a label. */
export function sign(lines: string[], w: number, h: number, o: { bg?: string; fg?: string; font?: number; x?: number; y?: number; z?: number; ry?: number } = {}): Mesh {
  const m = new Mesh(geo.plane, new MeshBasicMaterial({ map: labelTexture(lines, { bg: o.bg, fg: o.fg, w: 256, h: Math.round(256 * (h / w)), font: o.font }), toneMapped: false }));
  m.scale.set(w, h, 1);
  m.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
  m.rotation.y = o.ry ?? 0;
  return m;
}

/** Release every shared GPU resource (call when leaving the 3D layer for good). */
export function disposeKit(): void {
  for (const g of Object.values(geo)) g.dispose();
  for (const m of mats.values()) m.dispose();
  mats.clear();
  for (const t of labelCache.values()) t.dispose();
  labelCache.clear();
}
