/** Redline Raceway props: the car (whose look follows its setup), the circuit ribbon, barriers, pit-wall and garage items. */
import { BufferAttribute, BufferGeometry, CanvasTexture, Group, Mesh, MeshBasicMaterial, RepeatWrapping, SRGBColorSpace } from 'three';
import { centreLine, checkpoints, REDLINE } from '../logic/track';
import { mat, rbox, rcyl, rsph, shape, sign } from './kit';
import { col, num } from './props';
import type { Builder, Dyn } from './builders';

const RED = 0xe63946, WHITE = 0xf5f5f5, DARK = 0x1b1f2e;

/** The race car: a glossy monocoque with sidepods, halo, wings and four wheels that spin. Its parts show the setup: tyres (a red sidewall band), brakes (glowing discs), fuel (a lit exhaust), aero (bigger wings). */
const car: Builder = (p, ctx) => {
  const g = new Group(); const c = col(p, 'color', RED);
  const body = new Group(); g.add(body);
  const gloss = { rough: 0.22, metal: 0.35 };
  // tub, nose, sidepods, engine cover
  body.add(rbox(0.95, 0.4, 3.2, c, { y: 0.22, z: -0.1, r: 0.16, ...gloss }), rcyl(0.14, 0.44, 1.7, c, { y: 0.42, z: -2.5, rx: -Math.PI / 2, ...gloss }), rbox(0.28, 0.05, 2.6, 0xf5f5f5, { y: 0.63, z: -0.3, r: 0.02 }));
  for (const sx of [-1, 1]) body.add(rbox(0.6, 0.38, 1.9, c, { x: sx * 0.82, y: 0.2, z: 0.35, r: 0.14, ...gloss }), rbox(0.5, 0.2, 0.06, DARK, { x: sx * 0.82, y: 0.34, z: -0.62 }), rbox(0.1, 0.25, 1.2, WHITE, { x: sx * 1.13, y: 0.26, z: 0.35, r: 0.03 }));
  body.add(rbox(0.55, 0.55, 1.2, c, { y: 0.55, z: 0.95, r: 0.18, ...gloss }), rbox(0.08, 0.65, 0.9, c, { y: 0.9, z: 1.3, r: 0.03 }));
  // cockpit: opening, driver, halo
  body.add(rbox(0.6, 0.12, 0.9, DARK, { y: 0.6, z: -0.25, r: 0.05 }), rsph(0.21, 0xf5c518, { y: 0.78, z: -0.15, ...gloss }), rbox(0.28, 0.09, 0.2, 0x10142c, { y: 0.8, z: -0.34, r: 0.03, glow: 0.2 }));
  body.add(rbox(0.07, 0.4, 0.07, DARK, { y: 0.62, z: -0.75 }), rbox(0.06, 0.06, 0.8, DARK, { x: -0.3, y: 1.0, z: -0.4, r: 0.02 }), rbox(0.06, 0.06, 0.8, DARK, { x: 0.3, y: 1.0, z: -0.4, r: 0.02 }));
  body.add(sign([str(p, 'number', '7')], 0.55, 0.55, { bg: '#e63946', fg: '#ffffff', y: 0.64, z: -1.75, font: 90 }));
  (body.children[body.children.length - 1] as Mesh).rotation.x = -Math.PI / 2 + 0.05;
  // wings
  const rear = new Group(); rear.position.set(0, 0.95, 2.05); body.add(rear);
  const rearPlane = rbox(1.9, 0.07, 0.55, DARK, { r: 0.03, ...gloss }); rear.add(rearPlane, rbox(0.06, 0.55, 0.5, c, { x: -0.95, y: -0.2, r: 0.02 }), rbox(0.06, 0.55, 0.5, c, { x: 0.95, y: -0.2, r: 0.02 }));
  const front = new Group(); front.position.set(0, 0.12, -3.35); body.add(front);
  const frontPlane = rbox(1.9, 0.06, 0.5, DARK, { r: 0.03, ...gloss }); front.add(frontPlane, rbox(0.06, 0.2, 0.5, c, { x: -0.95, y: -0.04, r: 0.02 }), rbox(0.06, 0.2, 0.5, c, { x: 0.95, y: -0.04, r: 0.02 }));
  // wheels: tyre, rim, disc, a band that shows the tyre set
  const wheels: Group[] = []; const bands: Mesh[] = []; const discs: Mesh[] = [];
  for (const [x, z] of [[-1.05, -1.4], [1.05, -1.4], [-1.1, 1.5], [1.1, 1.5]] as const) {
    const w = new Group(); w.position.set(x, 0.46, z); g.add(w); wheels.push(w);
    const sx = Math.sign(x);
    w.add(rcyl(0.46, 0.46, 0.55, 0x16161a, { rz: Math.PI / 2, y: -0.0, rough: 0.9, cast: true }));
    w.children[0]!.position.y = 0; w.children[0]!.position.x = 0;
    const band = rcyl(0.47, 0.47, 0.05, 0x8a8a8a, { rz: Math.PI / 2, x: sx * 0.28, rough: 0.7 }); bands.push(band); w.add(band);
    w.add(rcyl(0.28, 0.28, 0.58, 0xcfd6ea, { rz: Math.PI / 2, metal: 0.6, rough: 0.3 }));
    const d = rcyl(0.2, 0.2, 0.62, 0x555555, { rz: Math.PI / 2 }); discs.push(d); w.add(d);
    for (let k = 0; k < 5; k++) { const sp = rbox(0.04, 0.5, 0.04, 0x8b95b5, { x: sx * 0.3, rx: (k / 5) * Math.PI, r: 0.01 }); w.add(sp); }
    g.add(rbox(Math.abs(x) - 0.35, 0.05, 0.08, DARK, { x: x / 2 - sx * 0.05, y: 0.32, z, r: 0.01 }));
  }
  const exhaust = rcyl(0.1, 0.13, 0.5, 0x444444, { x: 0, y: 0.5, z: 1.9, rx: Math.PI / 2 }); body.add(exhaust);
  const state = { tyres: false, brakes: false, fuel: false, aero: false };
  const paint = () => {
    for (const s of bands) s.material = mat(state.tyres ? RED : 0x6a6a6a, state.tyres ? 0.2 : 0);
    for (const d of discs) d.material = mat(state.brakes ? 0xff7b00 : 0x555555, state.brakes ? 1.0 : 0);
    exhaust.material = mat(state.fuel ? 0xffa64d : 0x444444, state.fuel ? 0.9 : 0);
    rear.scale.set(state.aero ? 1.25 : 1, state.aero ? 1.4 : 1, state.aero ? 1.4 : 1); front.scale.set(state.aero ? 1.2 : 1, state.aero ? 1.5 : 1, state.aero ? 1.5 : 1);
  };
  paint();
  let spin = 0, rev = 0, t = 0;
  const dyn: Dyn = {
    id: p.id ?? 'car', object: g, at: () => ({ x: p.x, y: 0.8, z: p.z }), states: () => Object.entries(state).filter(([, v]) => v).map(([k]) => k),
    where(name) { return name === 'front-left' ? { x: p.x - 1.05, y: 0.5, z: p.z - 1.4 } : name === 'rear' ? { x: p.x, y: 0.7, z: p.z + 2 } : null; },
    setState(s, instant) {
      if (!(s in state) || state[s as keyof typeof state]) return;
      state[s as keyof typeof state] = true; paint();
      if (!instant) { ctx.audio.sfx('success'); ctx.fx.burst('sparks', p.x, 0.8, p.z, 16); ctx.fx.flash(p.x, 1.2, p.z, 0xffd166, 7, 0.4); ctx.say(({ tyres: 'Fresh tyres go on: the pressures your spreadsheet found.', brakes: 'The brakes are balanced: the discs glow as they do equal work.', fuel: 'The fuel load is exactly right: less weight, more speed.', aero: 'Bigger wings: more grip through the corners.' } as Record<string, string>)[s] ?? ''); rev = 1.6; }
    },
    play(name) { if (name === 'malfunction') { ctx.audio.sfx('fail'); ctx.fx.burst('smoke', p.x, 0.6, p.z, 14); } if (name === 'rev') rev = 2.4; },
    update(dt) { t += dt; if (rev > 0) { rev -= dt; spin += dt * 38; if (Math.random() < dt * 8) ctx.fx.burst('ember', p.x, 0.5, p.z + 2.2, 2, 0.4); } else if (g.userData.spin) spin += g.userData.spin * dt; for (const w of wheels) w.rotation.x = spin; },
  };
  return { object: g, dyn, tick: p.id ? undefined : (dt) => dyn.update?.(dt, t) }; // a car with an id is animated as a named prop; a driven or replayed one by its driver
};
const str = (p: { p?: Record<string, number | string | boolean> }, k: string, d: string) => { const v = p.p?.[k]; return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : d; };

const stripeTex = (() => {
  let t: CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d')!;
    g.fillStyle = '#e63946'; g.fillRect(0, 0, 32, 8); g.fillStyle = '#f5f5f5'; g.fillRect(32, 0, 32, 8);
    t = new CanvasTexture(c); t.wrapS = RepeatWrapping; t.colorSpace = SRGBColorSpace; t.userData.shared = true;
    return t;
  };
})();

/** Builds a flat ribbon along the centre-line between two offsets. */
function ribbon(cl: ReturnType<typeof centreLine>, from: number, to: number, y: number, uScale = 0): BufferGeometry {
  const n = cl.pts.length, pos = new Float32Array((n + 1) * 2 * 3), uv = new Float32Array((n + 1) * 2 * 2), idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const p = cl.pts[i % n]!, q = cl.pts[(i + 1) % n]!;
    const dx = q.x - p.x, dz = q.z - p.z, len = Math.hypot(dx, dz) || 1, nx = -dz / len, nz = dx / len;
    pos.set([p.x + nx * from, y, p.z + nz * from, p.x + nx * to, y, p.z + nz * to], i * 6);
    const u = (i / n) * cl.length * uScale;
    uv.set([u, 0, u, 1], i * 4);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(pos, 3)); g.setAttribute('uv', new BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

/** The circuit: asphalt, red/white kerbs, white edge lines and the start line. */
const circuit: Builder = () => {
  const cl = centreLine(REDLINE); const half = cl.width / 2;
  const g = new Group();
  const asphalt = new Mesh(ribbon(cl, -half, half, 0.03), new MeshBasicMaterial({ color: 0x3a3d48 })); g.add(asphalt);
  const kerbMat = new MeshBasicMaterial({ map: stripeTex() });
  g.add(new Mesh(ribbon(cl, half, half + 1.6, 0.035, 1 / 3), kerbMat), new Mesh(ribbon(cl, -half - 1.6, -half, 0.035, 1 / 3), kerbMat));
  const line = new MeshBasicMaterial({ color: 0xf5f5f5 });
  g.add(new Mesh(ribbon(cl, half - 0.35, half - 0.1, 0.04), line), new Mesh(ribbon(cl, -half + 0.1, -half + 0.35, 0.04), line));
  // start line: a chequered strip across the track at the first point
  const p = cl.pts[0]!;
  const start = shape('box', 1.2, 0.04, cl.width, 0xf5f5f5, { x: p.x, z: p.z, y: 0.045, ry: p.heading + Math.PI / 2, cast: false });
  g.add(start, shape('box', 0.4, 0.05, cl.width, 0x111111, { x: p.x - Math.sin(p.heading) * 0.8, z: p.z - Math.cos(p.heading) * 0.8, y: 0.05, ry: p.heading + Math.PI / 2, cast: false }));
  // checkpoint gates (low posts) so the driver sees where the lap goes
  for (const i of checkpoints(cl, 6).slice(1)) {
    const c = cl.pts[i]!, nx = Math.cos(c.heading), nz = -Math.sin(c.heading);
    for (const s of [-1, 1]) g.add(shape('cyl', 0.4, 2.2, 0.4, 0xffd166, { x: c.x + nx * (half + 2.2) * s, z: c.z + nz * (half + 2.2) * s, glow: 0.7 }));
  }
  return { object: g };
};

const tyreStack: Builder = () => { const g = new Group(); for (let i = 0; i < 3; i++) g.add(shape('cyl', 1.3, 0.45, 1.3, i % 2 ? WHITE : RED, { y: i * 0.45 })); return { object: g }; };
const pitwall: Builder = (p) => { const g = new Group(); g.add(shape('box', num(p, 'w', 30), 1.0, 0.6, 0x596080), shape('box', num(p, 'w', 30), 0.2, 0.9, 0xf5f5f5, { y: 1.0 })); return { object: g }; };
const startGantry: Builder = (p) => { const g = new Group(); const w = num(p, 'w', 18); g.add(shape('box', 0.6, 7, 0.6, 0x39405c, { x: -w / 2 }), shape('box', 0.6, 7, 0.6, 0x39405c, { x: w / 2 }), shape('box', w + 0.6, 1.4, 0.8, 0x2a2f45, { y: 6.6 }), sign(['REDLINE', 'RACEWAY'], 7, 1.2, { bg: '#2a2f45', fg: '#ff5d73', y: 7.3, z: 0.42, font: 40 })); for (let i = 0; i < 5; i++) g.add(shape('sphere', 0.5, 0.5, 0.5, 0xff2d2d, { x: -2 + i, y: 6.4, z: 0.45, glow: 0.8 })); return { object: g }; };
const liftStand: Builder = () => { const g = new Group(); g.add(shape('box', 3, 0.3, 5.4, 0x39405c), shape('box', 0.4, 0.8, 0.4, 0xf2c14e, { x: -1.2, z: -2.2, y: 0.3 }), shape('box', 0.4, 0.8, 0.4, 0xf2c14e, { x: 1.2, z: -2.2, y: 0.3 }), shape('box', 0.4, 0.8, 0.4, 0xf2c14e, { x: -1.2, z: 2.2, y: 0.3 }), shape('box', 0.4, 0.8, 0.4, 0xf2c14e, { x: 1.2, z: 2.2, y: 0.3 })); return { object: g }; };
const tyreRack: Builder = () => { const g = new Group(); g.add(shape('box', 0.2, 2.4, 2.4, 0x596080)); for (let i = 0; i < 4; i++) g.add(shape('cyl', 0.9, 0.4, 0.9, 0x1a1a1a, { x: 0.4, y: 0.3 + i * 0.55, z: -0.6 + (i % 2) * 1.2, rz: Math.PI / 2 })); return { object: g }; };

export const racingBuilders: Record<string, Builder> = { car, circuit, tyreStack, pitwall, startGantry, liftStand, tyreRack };
