/** Robotics / engineering props: consoles, the repairable robot Bolt-7, assembly arm, conveyor, doors. */
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { ease } from './tween';
import { mat, rbox, rcyl, rsph, shape, sign, labelTexture } from './kit';
import { col, num, str } from './props';
import type { Builder, BuildCtx, Dyn } from './builders';
import { ASSEMBLY_ARM, assemblyPoints, buildArm, plannerFor, type PartMaker } from './arm';
import type { Move, V3 } from './armMotion';

/** A working console: a desk with a bezelled, slanted screen showing the station's name, a keyboard strip and blinking status lights. */
const consoleB: Builder = (p) => {
  const g = new Group();
  const c = col(p, 'color', 0x7dffb3);
  g.add(rbox(1.7, 0.9, 0.85, 0x2b3048, { rough: 0.5, metal: 0.2 }), rbox(1.82, 0.07, 0.97, 0x3d4466, { y: 0.9, metal: 0.3, rough: 0.4 }), rbox(1.5, 0.05, 0.28, 0x1c2036, { y: 0.97, z: 0.27, rx: -0.12, r: 0.02 }));
  for (let i = 0; i < 9; i++) g.add(rbox(0.1, 0.02, 0.06, i % 3 === 0 ? c : 0x596080, { x: -0.62 + i * 0.155, y: 1.0, z: 0.27, rx: -0.12, glow: i % 3 === 0 ? 0.6 : 0, r: 0.01, cast: false }));
  const screen = new Group(); screen.position.set(0, 1.3, -0.2); screen.rotation.x = -0.25; g.add(screen);
  screen.add(rbox(1.6, 0.98, 0.1, 0x161a2b, { y: -0.49, r: 0.04, metal: 0.2 }));
  screen.add(sign(str(p, 'text', 'CONSOLE').split('|'), 1.4, 0.78, { bg: '#08150f', fg: `#${c.toString(16).padStart(6, '0')}`, z: 0.06, y: -0.5 }));
  g.add(rbox(0.16, 0.12, 0.16, 0x1c2036, { y: 0.97, z: -0.15, metal: 0.3 }), rbox(1.6, 0.04, 0.04, c, { y: 0.05, z: 0.44, glow: 1 }));
  const leds = [GREENISH, 0xffd166, 0xff6b6b].map((col2, i) => { const m = rsph(0.035, col2, { x: 0.62 + i * 0.1 - 0.1, y: 0.94, z: -0.3, glow: 1.2 }); g.add(m); return m; });
  return { object: g, tick: (_dt, t) => { leds.forEach((m, i) => { m.scale.setScalar(0.8 + 0.4 * (0.5 + 0.5 * Math.sin(t * (2 + i) + p.x))); }); } };
};
const GREENISH = 0x7dffb3;

/** The rows of a conveyor belt: a moving striped surface, boxes riding it, a status lamp. */
const conveyor: Builder = (p, ctx) => {
  const g = new Group();
  const w = num(p, 'w', 6), d = num(p, 'd', 1.1);
  g.add(rbox(w, 0.5, d, 0x2b3048, { rough: 0.5, metal: 0.25, r: 0.05 }), rbox(w + 0.12, 0.1, d + 0.14, 0x596080, { y: 0.5, metal: 0.4, rough: 0.35, r: 0.04 }), rbox(w, 0.05, 0.05, 0xff9f1c, { y: 0.22, z: d / 2 + 0.04, glow: 0.9 }), rbox(w, 0.05, 0.05, 0xff9f1c, { y: 0.22, z: -d / 2 - 0.04, glow: 0.9 }));
  for (const x of [-w / 2 + 0.4, w / 2 - 0.4]) for (const z of [-d / 2, d / 2]) g.add(rbox(0.16, 0.1, 0.16, 0x1c2036, { x, z, y: 0 }));
  const tex = labelTexture(['▌ ▌ ▌ ▌ ▌ ▌ ▌ ▌'], { bg: '#20243a', fg: '#3b4266', w: 512, h: 64, font: 40 });
  const belt = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: tex }));
  belt.rotation.x = -Math.PI / 2; belt.scale.set(w - 0.2, d - 0.1, 1); belt.position.y = 0.655;
  g.add(belt);
  const lamp = shape('sphere', 0.22, 0.22, 0.22, 0xff4d4d, { y: 0.95, x: -w / 2 + 0.3, z: -d / 2 - 0.15, glow: 0.9 });
  g.add(lamp, shape('cyl', 0.06, 0.4, 0.06, 0x2a2f45, { y: 0.6, x: -w / 2 + 0.3, z: -d / 2 - 0.15 }));
  const boxes: Mesh[] = [];
  for (let i = 0; i < Math.floor(w / 1.5); i++) { const b = shape('box', 0.6, 0.45, 0.6, 0xb8863b, { y: 0.66, x: -w / 2 + 0.6 + i * 1.5 }); b.visible = false; boxes.push(b); g.add(b); }
  let running = false, jam = false, t = 0, flaky = false, sinceJam = 0;
  const dyn: Dyn = {
    id: p.id ?? 'conveyor', object: g, states: () => [running ? 'run' : '', flaky ? 'flaky' : 'steady'].filter(Boolean),
    at: () => ({ x: p.x, y: 0.9, z: p.z }),
    setState(s) {
      if (s === 'run') { running = true; flaky = true; jam = false; boxes.forEach((b) => (b.visible = true)); lamp.material = mat(0x7dffb3, 0.9); }
      if (s === 'repair') { flaky = false; if (running) { lamp.material = mat(0x7dffb3, 0.9); ctx.audio.sfx('success'); ctx.fx.burst('heal', p.x, 1, p.z, 16); } }
      if (s === 'jam') { jam = true; }
    },
    play(name) {
      if (name === 'malfunction') { jam = true; lamp.material = mat(0xff4d4d, 1.4); ctx.fx.burst('sparks', p.x + 0.5, 0.9, p.z, 20); ctx.fx.flash(p.x, 1.2, p.z, 0xff4d4d, 10, 0.5); ctx.audio.sfx('fail'); ctx.tweens.after(1.6, () => { jam = false; if (running) lamp.material = mat(0x7dffb3, 0.9); }); }
    },
    update(dt) {
      t += dt;
      // until the bug is found and fixed, the line jams now and then (the story Ori tells)
      if (running && flaky && !jam) { sinceJam += dt; if (sinceJam > 22) { sinceJam = 0; dyn.play!('malfunction'); } }
      if (running && !jam) {
        for (const b of boxes) { b.position.x += dt * 0.9; if (b.position.x > w / 2 - 0.4) b.position.x = -w / 2 + 0.4; }
        (belt.material as MeshBasicMaterial).map!.offset.x -= dt * 0.25;
      } else if (!running) lamp.material = mat(0xff4d4d, 0.5 + Math.sin(t * 3) * 0.3);
    },
  };
  return { object: g, dyn };
};

/** Centred, standard-shaded parts for the arm kit (the factory's look). */
const kitMaker: PartMaker = {
  box: (w, h, d, c, o = {}) => rbox(w, h, d, c, { x: o.x, y: (o.y ?? 0) - h / 2, z: o.z, rx: o.rx, rz: o.rz, glow: o.glow, rough: 0.4, metal: 0.3, r: 0.05 }),
  cyl: (rt, rb, h, c, o = {}) => rcyl(rt, rb, h, c, { x: o.x, y: (o.y ?? 0) - h / 2, z: o.z, rx: o.rx, rz: o.rz, glow: o.glow, rough: 0.4, metal: 0.35 }),
  sph: (r, c, o = {}) => rsph(r, c, { x: o.x, y: o.y, z: o.z, glow: o.glow, rough: 0.4, metal: 0.3 }),
};

/**
 * An assembly arm. When the line is `run`ning it does a real pick-and-place cycle (armMotion.ts): swing over the belt, lower in a straight line,
 * close the gripper and pause, lift, swing to the drop point, lower, release, lift and settle at rest before the next part. Joint moves are
 * coordinated S-curves with travel limits; `precise` (cleaner functions) makes it faster and tidier. It stands still, folded, until the line runs.
 */
const arm: Builder = (p, ctx) => {
  const OPT = ASSEMBLY_ARM;
  const facing = num(p, 'face', -Math.PI / 2); // toward the belt (south)
  const { pick, drop, rest, beltY, clear } = assemblyPoints(p, num(p, 'beltZ', -1.5));
  const rig = buildArm(kitMaker, OPT, facing);
  const planner = plannerFor(OPT, { x: p.x, z: p.z }, facing, rest, 1);
  const crate = rbox(0.34, 0.3, 0.34, 0xb8863b, { y: -0.3 - 0.3 }); crate.visible = false; rig.tool.add(crate);
  let on = false, precise = false, broken = 0, grip = 1, gripTo = 1, cycle = 0;
  const J = (to: V3, o: Partial<Move> = {}) => planner.plan({ kind: 'J', to, speed: precise ? 1.15 : 0.85, ...o });
  const L = (to: V3, o: Partial<Move> = {}) => planner.plan({ kind: 'L', to, speed: precise ? 1.1 : 0.85, ...o });
  const near = () => { const q = ctx.player(); return Math.hypot(q.x - p.x, q.z - p.z) < 14; };
  const servo = () => { if (near()) ctx.audio.sfx('servo'); };
  const plan = () => {
    cycle++;
    J({ x: pick.x, y: clear + 0.1, z: pick.z }, { onStart: servo, hold: 0.1 });
    L({ x: pick.x, y: beltY + 0.1, z: pick.z }, { hold: 0.4, onDone: () => { gripTo = 0; crate.visible = true; } });
    L({ x: pick.x, y: clear, z: pick.z }, { hold: 0.05 });
    J({ x: drop.x, y: clear, z: drop.z }, { onStart: servo });
    L({ x: drop.x, y: beltY + 0.2, z: drop.z }, { hold: 0.35, onDone: () => { gripTo = 1; crate.visible = false; } });
    L({ x: drop.x, y: clear, z: drop.z }, { hold: 0.05 });
    J(rest, { onStart: servo, hold: precise ? 0.5 : 1.0 + (cycle % 3) * 0.3 });
  };
  const dyn: Dyn = {
    id: p.id ?? 'arm', object: rig.group, at: () => ({ x: p.x, y: 1.6, z: p.z }),
    states: () => [on ? 'run' : '', precise ? 'precise' : ''].filter(Boolean),
    setState(s) { if (s === 'run') on = true; if (s === 'precise') precise = true; },
    busy: () => planner.busy,
    play(name) { if (name === 'malfunction') { broken = 1.2; ctx.fx.burst('sparks', p.x, 2.2, p.z, 26); ctx.fx.flash(p.x, 2.2, p.z, 0xffb347, 12, 0.5); ctx.audio.sfx('spark'); } },
    update(dt) {
      if (on && !planner.busy && broken <= 0) plan();
      const q = planner.update(dt);
      if (broken > 0) { broken -= dt; q.yaw += Math.sin(broken * 50) * 0.05; q.el += Math.sin(broken * 37) * 0.1; }
      rig.apply(q);
      grip += (gripTo - grip) * (1 - Math.exp(-dt * 10)); rig.setGrip(grip);
    },
  };
  rig.apply(planner.q);
  return { object: rig.group, dyn };
};

/** A sliding door: state `open` slides the panel into the wall. */
const door: Builder = (p, ctx) => {
  const g = new Group();
  const w = num(p, 'w', 2.4), h = num(p, 'h', 3);
  g.add(shape('box', 0.3, h + 0.3, 0.5, 0x596080, { x: -w / 2 - 0.15 }), shape('box', 0.3, h + 0.3, 0.5, 0x596080, { x: w / 2 + 0.15 }), shape('box', w + 0.6, 0.3, 0.5, 0x596080, { y: h }));
  const panel = shape('box', w, h, 0.18, col(p, 'color', 0x7a84a8));
  const light = shape('box', 0.3, 0.08, 0.2, 0xff4d4d, { x: 0, y: h - 0.2, z: 0.12, glow: 1 });
  panel.add?.(light); g.add(panel);
  let open = 0;
  const apply = (k: number) => { open = k; panel.position.x = k * (w - 0.1); };
  const dyn: Dyn = {
    id: p.id ?? 'door', object: g, at: () => ({ x: p.x, y: 1.4, z: p.z }),
    setState(s, instant) {
      if (s !== 'open') return;
      if (instant) { apply(1); return; }
      ctx.audio.sfx('open');
      ctx.tweens.add(0.9, (k) => apply(k), { ease: ease.inOut });
    },
  };
  void open;
  return { object: g, dyn };
};

/** The hologram table: a glowing disc that shows a rotating diamond when active. */
const hologram: Builder = (p) => {
  const g = new Group();
  g.add(shape('cyl', 1.4, 0.3, 1.4, 0x2a2f45), shape('cyl', 1.1, 0.04, 1.1, 0x4fd1ff, { y: 0.3, glow: 0.9 }));
  const gem = shape('cone', 0.5, 0.7, 0.5, col(p, 'color', 0x4fd1ff), { y: 0.9, glow: 0.8, transparent: 0.75 });
  const gem2 = shape('cone', 0.5, 0.4, 0.5, col(p, 'color', 0x4fd1ff), { y: 0.5, glow: 0.8, transparent: 0.75, rx: Math.PI });
  g.add(gem, gem2);
  let t = 0;
  return { object: g, dyn: { id: p.id ?? 'holo', object: g, at: () => ({ x: p.x, y: 1.2, z: p.z }), setState() { /* always on */ }, update(dt) { t += dt; gem.rotation.y = t; gem2.rotation.y = t; gem.position.y = 0.3 + 0.45 + Math.sin(t * 2) * 0.06; } } };
};

/** A test dummy / target for movement tests. */
const dummy: Builder = () => { const g = new Group(); g.add(shape('cyl', 0.9, 0.12, 0.9, 0x596080), shape('cyl', 0.16, 1.1, 0.16, 0xb8863b, { y: 0.12 }), shape('sphere', 0.5, 0.5, 0.5, 0xf2c14e, { y: 1.2 }), shape('box', 0.9, 0.12, 0.12, 0xb8863b, { y: 0.95 })); return { object: g }; };

const workbench: Builder = () => { const g = new Group(); g.add(rbox(2.2, 0.12, 0.9, 0x8a5a33, { y: 0.85, rough: 0.8, r: 0.03 }), rbox(0.1, 0.85, 0.8, 0x39405c, { x: -1, metal: 0.3 }), rbox(0.1, 0.85, 0.8, 0x39405c, { x: 1, metal: 0.3 }), rbox(2.0, 0.3, 0.7, 0x2b3048, { y: 0.45, r: 0.03 }), rbox(0.3, 0.1, 0.3, 0xe8a93a, { y: 0.97, x: -0.6, r: 0.03 }), rcyl(0.1, 0.1, 0.3, 0xff6b6b, { y: 0.97, x: 0.3 }), rbox(0.5, 0.35, 0.04, 0x0b1d17, { y: 1.1, x: 0.8, z: -0.3, rx: -0.2, glow: 0.4 })); return { object: g }; };

const toolrack: Builder = () => { const g = new Group(); g.add(rbox(2, 1.6, 0.12, 0x39405c, { y: 0.7, metal: 0.3, r: 0.03 })); [-0.6, -0.2, 0.2, 0.6].forEach((x, i) => g.add(shape('box', 0.1, 0.7 - i * 0.05, 0.08, [0xe8a93a, 0x4fd1ff, 0xff6b6b, 0x7dffb3][i]!, { x, y: 1.0, z: 0.1 }))); return { object: g }; };

const gantry: Builder = (p) => { const g = new Group(); const w = num(p, 'w', 8), h = num(p, 'h', 4.5); g.add(shape('box', 0.3, h, 0.3, 0xf2c14e, { x: -w / 2 }), shape('box', 0.3, h, 0.3, 0xf2c14e, { x: w / 2 }), shape('box', w + 0.3, 0.35, 0.4, 0xf2c14e, { y: h }), shape('box', 0.5, 0.25, 0.5, 0x2a2f45, { y: h - 0.25 })); return { object: g }; };

/** A big wall screen for status text. */
const screen: Builder = (p) => { const g = new Group(); const w = num(p, 'w', 3), h = num(p, 'h', 1.6); g.add(shape('box', w + 0.15, h + 0.15, 0.12, 0x11131f, { y: num(p, 'y', 1.6) }), sign(str(p, 'text', '').split('|'), w, h, { bg: str(p, 'bg', '#0b1d17'), fg: str(p, 'fg', '#7dffb3'), z: 0.07, y: num(p, 'y', 1.6) + h / 2 })); return { object: g }; };


/**
 * A status screen that changes when the world does: `off` text until a state is set, then `on` text (glowing). The states it reacts to are
 * whatever the scene's reactions name (light, open, online...).
 */
const statusScreen: Builder = (p, ctx) => {
  const g = new Group();
  const w = num(p, 'w', 3.2), h = num(p, 'h', 1.7), y = num(p, 'y', 1.7);
  g.add(shape('box', w + 0.16, h + 0.16, 0.12, 0x11131f, { y }));
  const off = sign(str(p, 'off', 'OFFLINE').split('|'), w, h, { bg: '#1a1d2a', fg: '#58607a', z: 0.07, y: y + h / 2 });
  const face = (text: string) => sign(text.split('|'), w, h, { bg: str(p, 'bg', '#0b1d17'), fg: str(p, 'fg', '#7dffb3'), z: 0.071, y: y + h / 2 });
  let on = face(str(p, 'on', 'ONLINE'));
  on.visible = false;
  const cover = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: str(p, 'bg', '#0b1d17') })); cover.position.set(0, y + h / 2, 0.0725); cover.scale.set(w, h, 1); cover.visible = false;
  const scan = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: 0x7dffb3, toneMapped: false })); scan.position.set(0, y + h, 0.073); scan.scale.set(w, 0.035, 1); scan.visible = false;
  g.add(off, on, cover, scan);
  const dyn: Dyn = {
    id: p.id ?? 'status', object: g, at: () => ({ x: p.x, y: y + h / 2, z: p.z }), states: () => (on.visible ? ['on'] : []),
    play(name) {
      // `text:LINE|LINE` rewrites the lit display (a scoreboard changing) and keeps it lit
      if (name.startsWith('text:')) { g.remove(on); on = face(name.slice(5)); off.visible = false; g.add(on); return; }
      if (name === 'malfunction') { ctx.audio.sfx('fail'); const was = on.visible; let n = 0; const tick = () => { if (n++ > 6) { on.visible = was; off.visible = !was; return; } on.visible = !on.visible; off.visible = !off.visible; ctx.tweens.after(0.08, tick); }; tick(); ctx.fx.burst('sparks', p.x, y + h / 2, p.z + 0.3, 14); } },
    setState(_s, instant) {
      if (on.visible) return;
      on.visible = true; off.visible = false;
      if (instant || ctx.reduced) return;
      // the display fills in from the top, a bright scan line leading, like a screen refreshing with new data
      ctx.audio.sfx('interact');
      cover.visible = true; scan.visible = true;
      const fg = col(p, 'scan', 0x7dffb3); (scan.material as MeshBasicMaterial).color.setHex(fg);
      ctx.tweens.add(1.1, (k) => { const rest = h * (1 - k); cover.scale.set(w, Math.max(0.001, rest), 1); cover.position.y = y + rest / 2; scan.position.y = y + rest; scan.visible = k < 1; if (k >= 1) cover.visible = false; }, { ease: ease.inOut });
      ctx.fx.flash(p.x, y + h / 2, p.z + 0.6, fg, 6, 0.9);
    },
  };
  return { object: g, dyn };
};

/** A scanner gate that sweeps a light beam once it is online. */
const scanner: Builder = (p, ctx) => {
  const g = new Group();
  g.add(shape('box', 0.25, 2.2, 0.25, 0x596080, { x: -0.9 }), shape('box', 0.25, 2.2, 0.25, 0x596080, { x: 0.9 }), shape('box', 2.05, 0.25, 0.25, 0x596080, { y: 2.2 }));
  const beam = shape('box', 1.6, 0.05, 0.05, 0xff4d4d, { y: 1.0, glow: 1.2, transparent: 0.85 }); beam.visible = false; g.add(beam);
  let on = false, t = 0;
  return { object: g, dyn: { id: p.id ?? 'scanner', object: g, at: () => ({ x: p.x, y: 1.2, z: p.z }), states: () => (on ? ['online'] : []), setState(_s, instant) { if (on) return; on = true; beam.visible = true; if (!instant) { ctx.audio.sfx('success'); ctx.fx.burst('magic', p.x, 1.2, p.z, 18); } }, update(dt) { if (!on) return; t += dt; beam.position.y = 0.3 + (Math.sin(t * 2) * 0.5 + 0.5) * 1.6; } } };
};

/** A simulation pod: a glass cylinder with a hologram inside (the Training Grounds' look). */
const pod: Builder = (p) => {
  const g = new Group();
  g.add(shape('cyl', 1.6, 0.25, 1.6, 0x39405c), shape('cyl', 1.5, 2.4, 1.5, 0x9fe8ff, { y: 0.25, transparent: 0.18, cast: false }), shape('cyl', 1.6, 0.2, 1.6, 0x39405c, { y: 2.65 }));
  const core = shape('sphere', 0.5, 0.5, 0.5, col(p, 'color', 0x7dffb3), { y: 1.2, glow: 1, transparent: 0.8 });
  g.add(core);
  let t = 0;
  return { object: g, dyn: { id: p.id ?? 'pod', object: g, at: () => ({ x: p.x, y: 1.4, z: p.z }), setState() { /* always running */ }, update(dt) { t += dt; core.position.y = 0.95 + Math.sin(t * 1.5 + p.x) * 0.15; core.rotation.y = t; } } };
};

/** A gate/archway with a glowing name: doors between worlds. */
const archway: Builder = (p) => {
  const g = new Group();
  const w = num(p, 'w', 4), h = num(p, 'h', 4.2), c = col(p, 'color', 0x7dffb3);
  g.add(shape('box', 0.6, h, 0.8, 0x596080, { x: -w / 2 }), shape('box', 0.6, h, 0.8, 0x596080, { x: w / 2 }), shape('box', w + 1.2, 0.7, 0.9, 0x596080, { y: h }));
  g.add(shape('box', w - 0.4, 0.12, 0.3, c, { y: h - 0.1, glow: 1 }), sign(str(p, 'text', '').split('|'), w, 0.9, { bg: '#0d1020', fg: `#${c.toString(16).padStart(6, '0')}`, y: h + 0.35, z: 0.47 }));
  if (p.p?.portal !== false) g.add(shape('box', w - 0.4, h - 0.4, 0.06, c, { y: 0.1, glow: 0.35, transparent: 0.35, cast: false }));
  return { object: g };
};

const board: Builder = (p) => { const g = new Group(); g.add(shape('box', 0.12, 1.4, 0.12, 0x596080, { x: -1.1 }), shape('box', 0.12, 1.4, 0.12, 0x596080, { x: 1.1 }), shape('box', 2.6, 1.3, 0.1, 0x8a5a33, { y: 1.0 }), sign(str(p, 'text', 'NOTICES').split('|'), 2.3, 1.0, { bg: '#d9c9a0', fg: '#3a2a12', y: 1.15, z: 0.07 })); return { object: g }; };


export const roboticsBuilders: Record<string, Builder> = { console: consoleB, conveyor, arm, door, hologram, dummy, workbench, toolrack, gantry, screen, statusScreen, scanner, pod, archway, board };
void labelTexture; void (null as unknown as BuildCtx);
