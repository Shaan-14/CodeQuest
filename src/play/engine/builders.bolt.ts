/**
 * BOLT-7 and his REPAIR RIG. Bolt is a character (the robotics rig) that lies dead on a table, gets repaired a module at a time as the player's
 * code works, and finally stands up. The repair rig is a two-link industrial arm with a gripper and a welding torch: for the right-arm repair it
 * fetches the loose arm, carries it to the shoulder and welds it on, so the player SEES the machine do what their program told it to.
 */
import { Group, Vector3, type Object3D } from 'three';
import { buildArm, plannerFor, REPAIR_ARM, type PartMaker } from './arm';
import type { Move, V3 } from './armMotion';
import { createRig } from './rig';
import { boxG, capsuleG, cylG, part, sphereG, toon } from './rig.parts';
import { ease } from './tween';
import { num, str } from './props';
import type { Builder, Dyn } from './builders';

const OFF = 0x2a3350;
export const BOLT_STAGES = ['eyes', 'arm', 'power', 'voice', 'servo', 'ears', 'decide', 'senses', 'cycle', 'loop', 'routine', 'awake'] as const;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const bolt: Builder = (p, ctx) => {
  const scale = num(p, 'scale', 1.25), tableTop = num(p, 'table', 0.95), outZ = num(p, 'outZ', 2.2);
  const rig = createRig({ shape: 'robot', body: 0x8ea2c6, head: 0xa9bad8, accent: 0x4fd1ff, scale }, { shadow: false, detachable: true });
  const sk = rig.skeleton;
  const root = new Group(), wrapper = new Group(), lay = new Group();
  root.add(wrapper); wrapper.add(lay); lay.add(rig.group);
  const eyes = sk.eyes, chest = sk.lights[0]!, bulb = sk.lights[sk.lights.length - 1]!;
  const light = (which: 'eyes' | 'chest' | 'bulb' | 'mouth', color: number, k = 1.3) => {
    const m = toon(color, k);
    if (which === 'eyes') for (const e of eyes) e.material = m; else if (which === 'chest') chest.material = m; else if (which === 'bulb') bulb.material = m; else sk.mouth.material = m;
  };
  light('eyes', OFF, 0); light('chest', OFF, 0); light('bulb', OFF, 0); light('mouth', OFF, 0);

  // the right arm is off: it lies on the table beside him until the repair
  const armRoot = sk.upperR;
  const armHome = { x: armRoot.position.x, y: armRoot.position.y, z: armRoot.position.z };
  const socket = new Group(); socket.position.set(0.225, 0.5, 0); sk.torso.add(socket);
  const holder = new Group(); root.add(holder);
  let attached = false;
  const layArm = () => { holder.add(armRoot); armRoot.position.set(0, 0, 0); armRoot.rotation.set(0, 0, Math.PI / 2); holder.position.set(-0.1, tableTop + 0.08, 0.62); };
  layArm();
  const seat = (instant: boolean) => {
    root.updateWorldMatrix(true, true);
    sk.torso.attach(armRoot); attached = true;
    const done = () => { armRoot.position.set(armHome.x, armHome.y, armHome.z); armRoot.rotation.set(0, 0, 0); };
    if (instant || ctx.reduced) { done(); return; }
    const from = { x: armRoot.position.x, y: armRoot.position.y, z: armRoot.position.z, rx: armRoot.rotation.x, ry: armRoot.rotation.y, rz: armRoot.rotation.z };
    ctx.tweens.add(0.35, (k) => { armRoot.position.set(lerp(from.x, armHome.x, k), lerp(from.y, armHome.y, k), lerp(from.z, armHome.z, k)); armRoot.rotation.set(lerp(from.rx, 0, k), lerp(from.ry, 0, k), lerp(from.rz, 0, k)); }, { ease: ease.out, done });
  };

  let up = 0, t = 0, malf = 0, sweep = 0, tilt = 0, awake = false, wave = 6;
  const lie = (k: number) => {
    up = k;
    lay.rotation.x = (Math.PI / 2) * (1 - k); lay.position.set(0, 0.17 * scale * (1 - k), -0.85 * scale * (1 - k));
    wrapper.rotation.y = lerp(-Math.PI / 2, 0, k); rig.setFacing(Math.PI * k, true); // standing, he faces south (toward the room)
    wrapper.position.set(0, lerp(tableTop, 0, k), lerp(0, outZ, k));
  };
  lie(0);
  const at = () => ({ x: p.x, y: tableTop + 0.7 + up * 0.9, z: p.z + outZ * up });
  const stood = new Set<string>();
  const apply = (s: string, instant: boolean) => {
    const quick = instant || ctx.reduced, a = at();
    switch (s) {
      case 'eyes': light('eyes', 0x4fd1ff); light('chest', 0x4fd1ff, 0.9); if (!quick) { ctx.audio.sfx('power'); ctx.fx.burst('magic', a.x, a.y + 0.2, a.z, 14, 0.6); } break;
      case 'arm': if (!attached) seat(quick); if (!quick) { ctx.audio.sfx('spark'); ctx.fx.burst('sparks', a.x, a.y, a.z + 0.4, 28); ctx.fx.flash(a.x, a.y + 0.2, a.z + 0.4, 0xffd166, 12, 0.5); } break;
      case 'power': light('chest', 0x7dffb3, 1.3); if (!quick) { ctx.audio.sfx('success'); ctx.fx.burst('heal', a.x, a.y, a.z, 18); } break;
      case 'voice': light('mouth', 0xffd166, 1); if (!quick) { ctx.audio.sfx('interact'); rig.talk(true); ctx.tweens.after(1.6, () => rig.talk(false)); ctx.say('Bolt-7: “B-b-bzzt… hello?”'); } break;
      case 'servo': if (!quick) { ctx.audio.sfx('servo'); sweep = 0; tilt = 0; rig.play('nod'); } break;
      case 'decide': light('chest', 0xffd166, 1.3); if (!quick) { ctx.audio.sfx('interact'); ctx.say('Bolt-7’s chest lights blink yes… no… yes.'); } break;
      case 'cycle': if (!quick) rig.play('nod'); break;
      case 'ears': light('bulb', 0xffd166, 1.4); tilt = quick ? 0 : 2; if (!quick) { ctx.audio.sfx('interact'); ctx.fx.burst('magic', a.x, a.y + 0.9, a.z, 10, 0.5); } break;
      case 'senses': light('eyes', 0xffd166); sweep = quick ? 0 : 2.5; break;
      case 'loop': if (!quick) rig.play('nod'); break;
      case 'routine': if (!quick) rig.play('cheer'); break;
      case 'awake':
        light('eyes', 0x7dffb3, 1.4); light('bulb', 0x7dffb3, 1.4); light('chest', 0x7dffb3, 1.3); awake = true;
        if (quick) lie(1); else { ctx.audio.sfx('success'); ctx.fx.burst('confetti', p.x, 2.2, p.z + outZ, 40); ctx.say('Bolt-7 sits up, plants his feet on the floor, and stands.'); ctx.tweens.add(2.4, lie, { ease: ease.back, done: () => rig.play('wave') }); }
        break;
    }
    stood.add(s);
  };

  const dyn: Dyn = {
    id: p.id ?? 'bolt', object: root, at, states: () => [...stood],
    where(name) {
      root.updateWorldMatrix(true, true);
      const o: Object3D | null = name === 'socket' ? socket : name === 'looseArm' ? (attached ? null : holder) : name === 'head' ? sk.head : null;
      if (!o) return null;
      const w = o.getWorldPosition(new Vector3());
      return { x: w.x, y: w.y, z: w.z };
    },
    setState(s, instant) { if ((BOLT_STAGES as readonly string[]).includes(s) && !stood.has(s)) apply(s, instant); },
    play(name) {
      if (name === 'malfunction') {
        malf = 1.6; const a = at();
        ctx.audio.sfx('fail'); ctx.audio.sfx('spark');
        ctx.fx.burst('sparks', a.x, a.y, a.z, 34); ctx.fx.burst('smoke', a.x, a.y + 0.3, a.z, 12); ctx.fx.flash(a.x, a.y, a.z, 0xff4d4d, 14, 0.7);
      }
      if (name === 'flex') { rig.play('cheer'); ctx.audio.sfx('servo'); }
      if (name === 'wave') rig.play('wave');
      if (name === 'nod') rig.play('nod');
      if (name === 'talk') { rig.talk(true); ctx.tweens.after(2.2, () => rig.talk(false)); }
      if (name === 'shutter') { light('eyes', 0x4fd1ff, 1.6); }
    },
    async run(name, arg) { if (name === 'seatArm') seat(false); if (name === 'releaseArm' && arg) (arg as Object3D).attach(armRoot); },
    update(dt) {
      t += dt;
      const lying = up < 0.5;
      if (malf > 0) { malf -= dt; wrapper.position.x = Math.sin(t * 60) * 0.03 * Math.min(1, malf); light('eyes', 0xff4d4d, 1 + Math.sin(t * 30) * 0.5); if (malf <= 0) { wrapper.position.x = 0; light('eyes', awake ? 0x7dffb3 : stood.has('senses') ? 0xffd166 : stood.has('eyes') ? 0x4fd1ff : OFF, stood.has('eyes') ? 1.3 : 0); } return; }
      if (stood.has('eyes') || awake) {
        if (lying) { sk.head.rotation.y = sweep > 0 ? Math.sin(t * 4) * 0.6 : tilt > 0 ? Math.sin(t * 5) * 0.25 : 0; sk.head.rotation.x = 0; if (sweep > 0) sweep -= dt; if (tilt > 0) tilt -= dt; }
        else { const pl = ctx.player(); const lx = pl.x - p.x, lz = pl.z - (p.z + outZ); rig.lookAt(Math.hypot(lx, lz) < 7 ? lx : null, lz); rig.update(dt, 'idle', 0); wave -= dt; if (awake && wave <= 0) { wave = 9 + Math.random() * 6; rig.play(Math.random() < 0.5 ? 'wave' : 'nod'); } }
      }
    },
  };
  void sphereG; void capsuleG;
  return { object: root, dyn };
};

/** Centred toon parts for the arm kit (the bay's look: outlined, hand-drawn). */
const toonMaker: PartMaker = {
  box: (w, h, d, c, o = {}) => part(boxG(w, h, d, Math.min(0.1, Math.min(w, h, d) * 0.25)), c, { ...o, outline: true }),
  cyl: (rt, rb, h, c, o = {}) => part(cylG(rt, rb, h), c, { ...o, outline: true }),
  sph: (r, c, o = {}) => part(sphereG(r), c, { ...o, outline: true }),
};

/**
 * The repair rig: a heavy two-link arm that fetches Bolt's loose arm, carries it to his shoulder and welds it on. It moves like a real machine
 * (armMotion.ts): joint moves on S-curves for the big swings, straight-line moves for lowering onto a part, a pause for the grip to close, a weld
 * that takes its time, joint limits and a faint servo settle after each stop. Each action is a short plan; `busy` tells a cinematic when the machine
 * has finished, so the camera waits for the arm instead of guessing how long it takes.
 */
const repairrig: Builder = (p, ctx) => {
  const OPT = REPAIR_ARM;
  const target = str(p, 'target', 'bolt');
  const facing = Math.atan2(-(num(p, 'faceZ', p.z + 0.7) - p.z), num(p, 'faceX', p.x + 3.6) - p.x); // toward the repair table
  const home = { x: p.x + 2.8, y: 3.0, z: p.z - 1.0 };
  const rig = buildArm(toonMaker, OPT, facing);
  const g = rig.group;
  const lamp = part(sphereG(0.07), 0x2a3350, { y: 0.6 }); rig.turret.add(lamp);
  const planner = plannerFor(OPT, { x: p.x, z: p.z }, facing, home, 2.4);
  let on = false, t = 0, weld = 0, welding: { x: number; y: number; z: number } | null = null, sparkClock = 0, grip = 1, gripTo = 1;
  const J = (to: V3, o: Partial<Move> = {}) => planner.plan({ kind: 'J', to, ...o });
  const L = (to: V3, o: Partial<Move> = {}) => planner.plan({ kind: 'L', to, speed: 1.1, ...o });
  const servo = () => ctx.audio.sfx('servo');
  const targetWhere = (name: string) => ctx.dyn(target)?.where?.(name) ?? null;
  const dyn: Dyn = {
    id: p.id ?? 'repairrig', object: g, at: () => ({ x: p.x, y: 2.4, z: p.z }), states: () => (on ? ['on'] : []),
    setState(s) { if (s === 'on') on = true; },
    busy: () => planner.busy || weld > 0,
    play(name) {
      if (name === 'wake') { on = true; ctx.audio.sfx('power'); lamp.material = toon(0x7dffb3, 1.2); J({ x: home.x - 0.3, y: 2.9, z: home.z + 0.3 }, { speed: 0.6, hold: 0.25 }); }
      else if (name === 'fetch') {
        const a = targetWhere('looseArm'); if (!a) return;
        J({ x: a.x, y: a.y + 0.75, z: a.z }, { onStart: servo, hold: 0.1 });
        L({ x: a.x, y: a.y + 0.3, z: a.z }, { speed: 0.9, hold: 0.35, onDone: () => { gripTo = 0; ctx.audio.sfx('click'); ctx.dyn(target)?.run?.('releaseArm', rig.tool as never); } });
        L({ x: a.x, y: a.y + 0.8, z: a.z }, { speed: 1, hold: 0.05 });
      } else if (name === 'carry') {
        const s = targetWhere('socket'); if (!s) return;
        J({ x: s.x, y: s.y + 0.95, z: s.z + 0.2 }, { onStart: servo, hold: 0.1 });
        L({ x: s.x, y: s.y + 0.55, z: s.z }, { speed: 0.9, hold: 0.15 });
      } else if (name === 'weld') {
        const s = targetWhere('socket'); if (!s) return;
        L({ x: s.x, y: s.y + 0.55, z: s.z }, { speed: 1, hold: 0.1, onStart: () => { ctx.dyn(target)?.run?.('seatArm'); weld = 1.7; welding = { x: s.x, y: s.y + 0.3, z: s.z }; ctx.audio.sfx('weld'); } });
        L({ x: s.x - 0.14, y: s.y + 0.55, z: s.z }, { speed: 0.55, hold: 0.15 });
      } else if (name === 'retract') { gripTo = 1; L({ x: planner.tool.x, y: planner.tool.y + 0.7, z: planner.tool.z }, { speed: 1.1 }); J({ x: home.x, y: home.y, z: home.z }, { onStart: servo, hold: 0.1, onDone: () => { lamp.material = toon(0x2a3350, 0); } }); }
      else if (name === 'malfunction') { ctx.fx.burst('sparks', p.x, 2.6, p.z, 20); ctx.audio.sfx('fail'); }
    },
    update(dt) {
      t += dt;
      rig.apply(planner.update(dt));
      grip += (gripTo - grip) * (1 - Math.exp(-dt * 9)); rig.setGrip(grip);
      if (weld > 0) {
        weld -= dt; sparkClock -= dt;
        const flick = Math.random() > 0.35;
        if (rig.torch) rig.torch.material = toon(0x9fe8ff, flick ? 2.2 : 0.4);
        if (sparkClock <= 0 && welding) { sparkClock = 0.1; ctx.fx.burst('sparks', welding.x, welding.y, welding.z, 6, 0.6); if (flick) ctx.fx.flash(welding.x, welding.y + 0.1, welding.z, 0x9fe8ff, 9, 0.12); }
        if (weld <= 0) { if (rig.torch) rig.torch.material = toon(0x8be9fd, 0); welding = null; }
      }
    },
  };
  rig.apply(planner.q);
  void ctx.reduced;
  return { object: g, dyn };
};

export const boltBuilders: Record<string, Builder> = { bolt, repairrig };
