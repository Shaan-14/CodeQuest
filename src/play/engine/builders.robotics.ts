/** Robotics / engineering props: consoles, the repairable robot Bolt-7, assembly arm, conveyor, doors. */
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { ease } from './tween';
import { mat, shape, sign, labelTexture } from './kit';
import { col, num, str } from './props';
import type { Builder, BuildCtx, Dyn } from './builders';

const STAGE_ORDER = ['eyes', 'arm', 'power', 'voice', 'servo', 'ears', 'decide', 'senses', 'cycle', 'loop', 'routine', 'awake'] as const;

/** A working console: desk, slanted glowing screen with the station's name. State `active` pulses the screen. */
const consoleB: Builder = (p) => {
  const g = new Group();
  const c = col(p, 'color', 0x7dffb3);
  g.add(shape('box', 1.6, 0.85, 0.8, 0x2a2f45), shape('box', 1.7, 0.08, 0.9, 0x3d4466, { y: 0.85 }));
  const screen = new Group();
  screen.position.set(0, 1.35, -0.18); screen.rotation.x = -0.25;
  screen.add(shape('box', 1.45, 0.85, 0.08, 0x11131f, { y: -0.425 }));
  const face = sign(str(p, 'text', 'CONSOLE').split('|'), 1.3, 0.7, { bg: '#0b1d17', fg: `#${c.toString(16).padStart(6, '0')}`, z: 0.05, y: 0 });
  screen.add(face);
  g.add(screen);
  g.add(shape('box', 0.9, 0.04, 0.3, 0x3d4466, { y: 0.9, z: 0.22 }), shape('box', 0.1, 0.03, 0.1, c, { y: 0.93, z: 0.2, x: -0.3, glow: 0.8 }), shape('box', 0.1, 0.03, 0.1, 0xffd166, { y: 0.93, z: 0.2, x: 0, glow: 0.8 }));
  return { object: g };
};

/** The rows of a conveyor belt: a moving striped surface, boxes riding it, a status lamp. */
const conveyor: Builder = (p, ctx) => {
  const g = new Group();
  const w = num(p, 'w', 6), d = num(p, 'd', 1.1);
  g.add(shape('box', w, 0.6, d, 0x39405c), shape('box', w + 0.1, 0.06, d + 0.1, 0x596080, { y: 0.6 }));
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

/** An assembly arm that works when `run`: swings, lowers, rises. Sparks on malfunction. */
const arm: Builder = (p, ctx) => {
  const g = new Group();
  g.add(shape('cyl', 1.1, 0.25, 1.1, 0x39405c), shape('cyl', 0.5, 0.7, 0.5, 0x596080, { y: 0.25 }));
  const shoulder = new Group(); shoulder.position.y = 0.95; g.add(shoulder);
  shoulder.add(shape('sphere', 0.5, 0.5, 0.5, 0xf2c14e, { y: -0.25 }));
  const upper = new Group(); shoulder.add(upper);
  upper.add(shape('box', 0.3, 1.6, 0.3, 0xf2c14e, { y: 0 }));
  const fore = new Group(); fore.position.y = 1.6; upper.add(fore);
  fore.add(shape('box', 0.26, 1.3, 0.26, 0xe8a93a, { y: -0.1 }), shape('box', 0.5, 0.12, 0.2, 0x2a2f45, { y: 1.15 }));
  let on = false, t = 0, broken = false, precise = false;
  const dyn: Dyn = {
    id: p.id ?? 'arm', object: g, at: () => ({ x: p.x, y: 1.6, z: p.z }),
    states: () => [on ? 'run' : '', precise ? 'precise' : ''].filter(Boolean),
    setState(s) { if (s === 'run') on = true; if (s === 'precise') precise = true; },
    play(name) { if (name === 'malfunction') { broken = true; ctx.fx.burst('sparks', p.x, 2.2, p.z, 26); ctx.fx.flash(p.x, 2.2, p.z, 0xffb347, 12, 0.5); ctx.audio.sfx('spark'); ctx.tweens.after(1.4, () => { broken = false; }); } },
    update(dt) {
      t += dt;
      if (broken) { shoulder.rotation.y += Math.sin(t * 40) * 0.05; fore.rotation.x = Math.sin(t * 30) * 0.3; return; }
      if (on) { const k = precise ? 0.6 : 1; shoulder.rotation.y = Math.sin(t * 0.9 * k) * 1.0; upper.rotation.x = 0.4 + Math.sin(t * 1.8) * 0.35; fore.rotation.x = -0.7 + Math.sin(t * 1.8 + 1) * 0.5; } else { upper.rotation.x = 0.15; fore.rotation.x = -0.3; }
    },
  };
  return { object: g, dyn };
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

const workbench: Builder = () => { const g = new Group(); g.add(shape('box', 2.2, 0.12, 0.9, 0x8a5a33, { y: 0.85 }), shape('box', 0.12, 0.85, 0.8, 0x596080, { x: -1 }), shape('box', 0.12, 0.85, 0.8, 0x596080, { x: 1 }), shape('box', 0.3, 0.08, 0.3, 0xe8a93a, { y: 0.97, x: -0.6 }), shape('cyl', 0.12, 0.3, 0.12, 0xff6b6b, { y: 0.97, x: 0.3 })); return { object: g }; };

const toolrack: Builder = () => { const g = new Group(); g.add(shape('box', 2, 1.6, 0.12, 0x39405c, { y: 0.7 })); [-0.6, -0.2, 0.2, 0.6].forEach((x, i) => g.add(shape('box', 0.1, 0.7 - i * 0.05, 0.08, [0xe8a93a, 0x4fd1ff, 0xff6b6b, 0x7dffb3][i]!, { x, y: 1.0, z: 0.1 }))); return { object: g }; };

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
  const on = sign(str(p, 'on', 'ONLINE').split('|'), w, h, { bg: str(p, 'bg', '#0b1d17'), fg: str(p, 'fg', '#7dffb3'), z: 0.071, y: y + h / 2 });
  on.visible = false;
  g.add(off, on);
  const dyn: Dyn = {
    id: p.id ?? 'status', object: g, at: () => ({ x: p.x, y: y + h / 2, z: p.z }), states: () => (on.visible ? ['on'] : []),
    play(name) { if (name === 'malfunction') { ctx.audio.sfx('fail'); const was = on.visible; let n = 0; const tick = () => { if (n++ > 6) { on.visible = was; off.visible = !was; return; } on.visible = !on.visible; off.visible = !off.visible; ctx.tweens.after(0.08, tick); }; tick(); ctx.fx.burst('sparks', p.x, y + h / 2, p.z + 0.3, 14); } },
    setState(_s, instant) { if (on.visible) return; on.visible = true; off.visible = false; if (!instant) { ctx.audio.sfx('interact'); ctx.fx.burst('magic', p.x, y + h / 2, p.z + 0.3, 14, 0.8); ctx.fx.flash(p.x, y + h / 2, p.z + 0.6, 0x7dffb3, 6, 0.5); } },
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

/** The repairable robot. Stages accumulate (eyes, arm, power, voice, ears, senses, loop, routine, awake); a failed attempt makes it malfunction. */
const bolt: Builder = (p, ctx) => {
  const root = new Group();
  const tableTop = num(p, 'table', 0.95) / num(p, 'scale', 1);
  root.scale.setScalar(num(p, 'scale', 1));
  const standingZ = num(p, 'outZ', 1.9);
  const pivot = new Group(); root.add(pivot);
  const body = new Group(); pivot.add(body);
  const steel = 0x8fa3c7, dark = 0x39405c, yellow = 0xf2c14e;
  body.add(shape('box', 0.75, 0.85, 0.5, steel, { y: 0.9 }), shape('box', 0.6, 0.22, 0.08, dark, { y: 1.2, z: 0.26 }));
  const chest = shape('box', 0.34, 0.2, 0.06, 0x3a4058, { y: 0.98, z: 0.27, glow: 0 });
  body.add(chest);
  // head
  const head = new Group(); head.position.y = 1.78; body.add(head);
  head.add(shape('box', 0.6, 0.5, 0.5, steel, { y: -0.25 }), shape('cyl', 0.05, 0.28, 0.05, dark, { y: 0.25 }));
  const eyeMat = mat(0x2a2f45); const eye = new Mesh(shape('box', 0.44, 0.12, 0.05, 0x000000).geometry, eyeMat); eye.scale.set(0.44, 0.12, 0.05); eye.position.set(0, -0.14, 0.26); head.add(eye);
  const bulb = shape('sphere', 0.12, 0.12, 0.12, 0x3a4058, { y: 0.52 }); head.add(bulb);
  // legs
  const legL = shape('box', 0.24, 0.75, 0.26, dark, { x: -0.22, y: 0.0 }), legR = shape('box', 0.24, 0.75, 0.26, dark, { x: 0.22, y: 0.0 });
  body.add(legL, legR);
  // arms: the right one is detached at first and lies beside the table
  const armL = new Group(); armL.position.set(-0.5, 1.6, 0); armL.add(shape('box', 0.2, 0.75, 0.2, steel, { y: -0.75 }), shape('box', 0.26, 0.22, 0.26, yellow, { y: -0.95 })); body.add(armL);
  const armR = new Group(); armR.add(shape('box', 0.2, 0.75, 0.2, steel, { y: -0.75 }), shape('box', 0.26, 0.22, 0.26, yellow, { y: -0.95 })); root.add(armR);
  const cell = shape('box', 0.3, 0.3, 0.12, 0x2b2f44, { y: 1.05, z: -0.3 }); body.add(cell);
  const wire = shape('cyl', 0.03, 0.5, 0.03, 0xff6b6b, { x: 0.55, y: 1.4, rx: 0.6 }); body.add(wire);

  let up = 0; // 0 = lying on the table, 1 = standing on the floor
  let stageDone = new Set<string>();
  let t = 0, malf = 0, nod = 0, sweep = 0, routine = 0;
  const lay = (k: number) => {
    up = k;
    // lying: rotated back onto the table; standing: upright beside it
    pivot.rotation.x = -(Math.PI / 2) * (1 - k);
    pivot.position.set(0, tableTop + (0.05 - tableTop) * k + 0.35 * (1 - k), standingZ * k);
    if (!stageDone.has('arm')) { armR.position.set(0.9, tableTop + 0.06, 0.25); armR.rotation.set(Math.PI / 2, 0, 0.3); } else { armR.position.set(0.5, tableTop + 0.06 + (1.6 - tableTop + 0.0) * 0, 0); }
  };
  const attachArm = () => { stageDone.add('arm'); root.remove(armR); armR.position.set(0.5, 1.6, 0); armR.rotation.set(0, 0, 0); body.add(armR); wire.visible = false; };
  const glow = (m: Mesh, c: number, k: number) => { m.material = mat(c, k); };
  const apply = (s: string, instant: boolean) => {
    const quick = instant || ctx.reduced;
    const fxAt = () => { const a = { x: p.x, y: tableTop + 0.7 + up * 0.4, z: p.z + standingZ * up }; return a; };
    switch (s) {
      case 'eyes': glow(eye, 0x4fd1ff, 1.2); glow(chest, 0x4fd1ff, 0.7); if (!quick) { ctx.audio.sfx('interact'); ctx.fx.burst('magic', fxAt().x, fxAt().y + 0.7, fxAt().z, 14, 0.6); } break;
      case 'arm': attachArm(); if (!quick) { const a = fxAt(); ctx.audio.sfx('spark'); ctx.fx.burst('sparks', a.x + 0.5, a.y + 0.5, a.z, 28); ctx.fx.flash(a.x + 0.5, a.y + 0.6, a.z, 0xffd166, 12, 0.5); } break;
      case 'power': glow(cell, 0x7dffb3, 1); glow(chest, 0x7dffb3, 1); if (!quick) { const a = fxAt(); ctx.audio.sfx('success'); ctx.fx.burst('heal', a.x, a.y + 0.6, a.z, 18); } break;
      case 'voice': head.add(shape('box', 0.3, 0.06, 0.04, 0xffd166, { y: -0.36, z: 0.26, glow: 1 })); if (!quick) { ctx.audio.sfx('interact'); ctx.say('Bolt-7: “B-b-bzzt… hello?”'); } break;
      case 'servo': nod = quick ? 0 : 2; if (!quick) ctx.audio.sfx('click'); break;
      case 'decide': glow(chest, 0xffd166, 1); if (!quick) { ctx.audio.sfx('interact'); ctx.say('Bolt-7’s chest lights blink yes… no… yes.'); } break;
      case 'cycle': routine = quick ? 0 : 2; break;
      case 'ears': glow(bulb, 0xffd166, 1.3); if (!quick) { ctx.audio.sfx('interact'); ctx.fx.burst('magic', p.x, tableTop + 2.2, p.z, 10, 0.5); } break;
      case 'senses': glow(eye, 0xffd166, 1.3); sweep = quick ? 0 : 2.5; break;
      case 'loop': nod = quick ? 0 : 3; break;
      case 'routine': routine = quick ? 0 : 3; break;
      case 'awake':
        glow(eye, 0x7dffb3, 1.4); glow(bulb, 0x7dffb3, 1.4);
        if (quick) lay(1); else { ctx.audio.sfx('success'); ctx.fx.burst('confetti', p.x, 2.2, p.z + 1, 40); ctx.say('Bolt-7 sits up, plants his feet on the floor, and stands.'); ctx.tweens.add(2.2, lay, { ease: ease.back }); }
        break;
    }
    stageDone.add(s);
  };
  // initial: dim, detached arm, on the table
  legL.position.y = 0; legR.position.y = 0; body.position.y = 0;
  lay(0);
  const dyn: Dyn = {
    id: p.id ?? 'bolt', object: root, at: () => ({ x: p.x, y: 1.4, z: p.z + standingZ * up }), states: () => [...stageDone],
    setState(s, instant) { if ((STAGE_ORDER as readonly string[]).includes(s) && !stageDone.has(s)) apply(s, instant); },
    play(name) {
      if (name !== 'malfunction') return;
      malf = 1.6;
      const a = { x: p.x, y: tableTop + 0.9 + up * 0.6, z: p.z + standingZ * up };
      ctx.audio.sfx('fail'); ctx.audio.sfx('spark');
      ctx.fx.burst('sparks', a.x, a.y, a.z, 34); ctx.fx.burst('smoke', a.x, a.y + 0.3, a.z, 12); ctx.fx.flash(a.x, a.y, a.z, 0xff4d4d, 14, 0.7);
    },
    update(dt) {
      t += dt;
      if (malf > 0) { malf -= dt; pivot.position.x = Math.sin(t * 60) * 0.03 * Math.min(1, malf); eye.material = mat(0xff4d4d, 1 + Math.sin(t * 30) * 0.5); if (malf <= 0) { pivot.position.x = 0; eye.material = mat(stageDone.has('awake') ? 0x7dffb3 : stageDone.has('senses') ? 0xffd166 : stageDone.has('eyes') ? 0x4fd1ff : 0x2a2f45, stageDone.has('eyes') ? 1.2 : 0); } return; }
      if (sweep > 0) { sweep -= dt; head.rotation.y = Math.sin(t * 4) * 0.6; if (sweep <= 0) head.rotation.y = 0; }
      if (nod > 0) { nod -= dt; head.rotation.x = Math.sin(t * 8) * 0.25; if (nod <= 0) head.rotation.x = 0; }
      if (routine > 0) { routine -= dt; armL.rotation.z = Math.sin(t * 6) * 0.8; armR.rotation.z = -Math.sin(t * 6) * 0.8; if (routine <= 0) { armL.rotation.z = 0; armR.rotation.z = 0; } }
      if (stageDone.has('awake') && up >= 1) { head.rotation.y = Math.sin(t * 0.8) * 0.35; armL.rotation.x = Math.sin(t * 1.6) * 0.15; }
    },
  };
  return { object: root, dyn };
};
void STAGE_ORDER;

export const roboticsBuilders: Record<string, Builder> = { console: consoleB, conveyor, arm, door, hologram, dummy, workbench, toolrack, gantry, screen, bolt, statusScreen, scanner, pod, archway, board };
void labelTexture; void (null as unknown as BuildCtx);
