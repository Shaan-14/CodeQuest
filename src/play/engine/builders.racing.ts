/** Redline Raceway props: the car (whose look follows its setup), the circuit ribbon, barriers, pit-wall and garage items. */
import { BufferAttribute, BufferGeometry, CanvasTexture, Group, Mesh, MeshBasicMaterial, RepeatWrapping, SRGBColorSpace } from 'three';
import { centreLine, checkpoints, REDLINE } from '../logic/track';
import { mat, shape, sign } from './kit';
import { col, num, type Builder, type Dyn } from './builders';

const RED = 0xe63946, WHITE = 0xf5f5f5, DARK = 0x1b1f2e;

/** The race car: low body, cockpit, nose, wings and four wheels. Its parts show the setup: tyres (worn grey or fresh red-banded), brakes (glowing discs), fuel (exhaust), aero (big wings). */
const car: Builder = (p, ctx) => {
  const g = new Group(); const c = col(p, 'color', RED);
  const body = new Group(); g.add(body);
  body.add(shape('box', 1.7, 0.45, 4.2, c, { y: 0.3 }), shape('box', 1.0, 0.4, 1.4, DARK, { y: 0.7, z: 0.2 }), shape('box', 0.9, 0.3, 1.8, c, { y: 0.3, z: -2.6 }));
  body.add(shape('box', 0.25, 0.3, 0.25, WHITE, { x: 0, y: 0.92, z: 0.25 }));                       // head
  body.add(sign([str(p, 'number', '7')], 0.8, 0.8, { bg: '#e63946', fg: '#ffffff', y: 0.72, z: 2.11, font: 90 }));
  const wing = new Group(); wing.position.set(0, 0.6, 2.2); body.add(wing);
  const wingTop = shape('box', 1.9, 0.08, 0.5, DARK, { y: 0.35 }); wing.add(shape('box', 0.1, 0.4, 0.3, DARK, { x: -0.6 }), shape('box', 0.1, 0.4, 0.3, DARK, { x: 0.6 }), wingTop);
  const front = shape('box', 1.9, 0.06, 0.45, DARK, { y: 0.1, z: -3.4 }); body.add(front);
  const wheels: Mesh[] = []; const discs: Mesh[] = []; const sidewalls: Mesh[] = [];
  for (const [x, z] of [[-1.0, -1.4], [1.0, -1.4], [-1.05, 1.5], [1.05, 1.5]] as const) {
    const w = shape('cyl', 0.8, 0.5, 0.8, 0x1a1a1a, { x, z, y: 0.0, rz: Math.PI / 2 }); w.position.y = 0.4; wheels.push(w); g.add(w);
    const sw = shape('cyl', 0.82, 0.04, 0.82, 0x8a8a8a, { x: x + Math.sign(x) * 0.26, z, rz: Math.PI / 2 }); sw.position.y = 0.4; sidewalls.push(sw); g.add(sw);
    const d = shape('cyl', 0.42, 0.06, 0.42, 0x555555, { x: x + Math.sign(x) * 0.32, z, rz: Math.PI / 2 }); d.position.y = 0.4; discs.push(d); g.add(d);
  }
  const exhaust = shape('cyl', 0.2, 0.5, 0.2, 0x444444, { x: 0, y: 0.45, z: 2.2, rx: Math.PI / 2 }); body.add(exhaust);
  const state = { tyres: false, brakes: false, fuel: false, aero: false };
  const paint = () => {
    for (const s of sidewalls) s.material = mat(state.tyres ? RED : 0x6a6a6a);
    for (const d of discs) d.material = mat(state.brakes ? 0xff7b00 : 0x555555, state.brakes ? 0.7 : 0);
    exhaust.material = mat(state.fuel ? 0xffa64d : 0x444444, state.fuel ? 0.8 : 0);
    wingTop.scale.set(state.aero ? 2.3 : 1.9, 0.08, state.aero ? 0.75 : 0.5); front.scale.set(state.aero ? 2.2 : 1.9, 0.06, state.aero ? 0.7 : 0.45);
  };
  paint();
  let rot = 0;
  const dyn: Dyn = {
    id: p.id ?? 'car', object: g, at: () => ({ x: p.x, y: 0.8, z: p.z }), states: () => Object.entries(state).filter(([, v]) => v).map(([k]) => k),
    setState(s, instant) {
      if (!(s in state) || state[s as keyof typeof state]) return;
      state[s as keyof typeof state] = true; paint();
      if (!instant) { ctx.audio.sfx('success'); ctx.fx.burst('sparks', p.x, 0.8, p.z, 16); ctx.fx.flash(p.x, 1.2, p.z, 0xffd166, 7, 0.4); ctx.say(({ tyres: 'Fresh tyres go on: the pressures your spreadsheet found.', brakes: 'The brakes are balanced: the discs glow evenly.', fuel: 'The fuel load is right: the car is lighter and quicker.', aero: 'The new aero package goes on: bigger wings, more grip at speed.' } as Record<string, string>)[s] ?? ''); }
    },
    play(name) { if (name === 'malfunction') { ctx.audio.sfx('fail'); ctx.fx.burst('smoke', p.x, 0.6, p.z, 14); } },
    update(dt) { rot += dt; void rot; },
  };
  void wheels; void num;
  return { object: g, dyn };
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
