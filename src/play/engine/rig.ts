/**
 * CHARACTERS: one rig for people and robots (built from rig.parts.ts). The pose is a pure function of a few smoothed weights, so there is no
 * snapping: idle ⇄ walk ⇄ run ⇄ air crossfade, the stride follows the distance actually travelled (no foot sliding), the character turns
 * smoothly toward where it goes, blinks, breathes, glances around and gestures while talking. One-shot and held gestures (wave, cheer, point,
 * work...) are blended over whatever the body is doing. NPCs and the player share all of it.
 */
import { CircleGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import type { NpcLook } from '../logic/dialogue';
import type { Pose } from '../logic/movement';
import { buildPerson, buildRobot, toon, type Skeleton } from './rig.parts';

export type OneShot = 'interact' | 'damage' | 'success' | 'wave' | 'cast' | 'think' | 'cheer' | 'nod' | 'shrug' | 'point' | 'work' | 'bow' | 'type' | 'ready' | 'swing' | 'pitch' | 'catch' | 'stretch' | 'lift' | 'throw' | 'salute';
export type Mood = 'neutral' | 'happy' | 'worried' | 'focused';

const LEN: Record<OneShot, number> = { interact: 0.75, damage: 0.75, success: 1.5, wave: 1.6, cast: 1.0, think: 2.0, cheer: 1.6, nod: 0.9, shrug: 1.5, point: 1.8, work: 2, bow: 1.2, type: 2, ready: 2, swing: 1.0, pitch: 1.3, catch: 0.7, stretch: 2.4, lift: 2.4, throw: 0.8, salute: 1.1 };
const blobGeo = new CircleGeometry(0.42, 16); blobGeo.userData.shared = true;
const blobMat = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }); blobMat.userData.shared = true;

export interface Rig {
  group: Group;
  /** The joints, for props that are characters too (a robot that lies on a table, loses an arm, stands up). */
  skeleton: Skeleton;
  height: number;
  /** Advance the animation. `speed` is the horizontal speed in m/s (the stride follows it). */
  update(dt: number, pose: Pose, speed: number): void;
  /** Turn smoothly toward a heading (radians, 0 = north). `snap` jumps there (placing a character). */
  setFacing(yaw: number, snap?: boolean): void;
  facing(): number;
  play(anim: OneShot): void;
  /** Hold a gesture until `release()` (pointing, working at a machine). */
  hold(anim: OneShot): void;
  release(): void;
  /** Gesturing and mouth movement while speaking. */
  talk(on: boolean): void;
  mood(m: Mood): void;
  flash(on: boolean): void;
  /** Turn the head toward a point in the world; `null` lets it wander naturally again. */
  lookAt(x: number | null, z?: number): void;
  /** Aim a pointing arm at a point (use with `hold('point')`). */
  pointAt(x: number, z: number): void;
  /** Light the robot's indicator lights (a colour pulse); no effect on people. */
  glow(color: number, k: number): void;
}

const damp = (cur: number, target: number, rate: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const wrap = (a: number) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Build a person or robot. About 1.74 m tall at scale 1. */
export function createRig(look: NpcLook, o: { shadow?: boolean; /** The character has parts that come off or move on their own (Bolt's arm): merge per joint instead of skinning one mesh. */ detachable?: boolean } = {}): Rig {
  const robot = look.shape === 'robot';
  const mode = o.detachable ? 'bake' : 'skin';
  const sk: Skeleton = robot ? buildRobot(look, mode) : buildPerson(look, mode);
  const scale = look.scale ?? 1;
  const root = new Group();
  const model = sk.root; root.add(model); model.scale.setScalar(scale);
  if (o.shadow !== false) { const b = new Mesh(blobGeo, blobMat); b.rotation.x = -Math.PI / 2; b.position.y = 0.02; b.scale.setScalar(scale * 1.15); root.add(b); }
  const meshes: Mesh[] = [];
  model.traverse((c) => { const m = c as Mesh; if (m.isMesh && !m.userData.outline) meshes.push(m); });

  const HIPS_Y = sk.hips.position.y;
  let t = Math.random() * 10, phase = Math.random() * 6, w = 0, r = 0, air = 0, landT = 0, wasAir = false;
  let facingTarget = 0, yaw = 0, headYaw = 0, headPitch = 0, talkW = 0, talking = false, flashing = false;
  let lookX: number | null = null, lookZ = 0, pointYaw: number | null = null, pointW = 0;
  let one: OneShot | null = null, oneT = 0, held = false, ow = 0;
  let blink = 2 + Math.random() * 3, blinkT = 0, fidget = 3 + Math.random() * 4, fidgetYaw = 0, fidgetPitch = 0;
  let browMood = 0, mouthMood = 0, moodTarget: Mood = 'neutral', moodBrow = 0, moodMouth = 0;
  let glowK = 0, glowColor = look.accent;
  let handT = 4 + Math.random() * 5, handSide = 0, handK = 0;
  let prevSpeed = 0, accel = 0, takeoff = 0, shuffle = 0, turnLean = 0;

  const apply = (dt: number, pose: Pose, speed: number) => {
    t += dt;
    // --- smoothed weights
    const moving = pose === 'walk' || pose === 'run';
    w = damp(w, moving ? 1 : 0, moving ? 7 : 6, dt);              // starting and stopping take a few frames: no snap between idle and walk
    r = damp(r, pose === 'run' ? 1 : 0, 5, dt);
    const inAir = pose === 'jump';
    air = damp(air, inAir ? 1 : 0, 16, dt);
    if (wasAir && !inAir) landT = 0.26; if (!wasAir && inAir) takeoff = 0.16; wasAir = inAir;
    if (landT > 0) landT = Math.max(0, landT - dt);
    if (takeoff > 0) takeoff = Math.max(0, takeoff - dt);
    // how the speed is changing: leaning into a start, rocking back on a stop
    accel = damp(accel, dt > 0 ? (speed - prevSpeed) / dt : 0, 8, dt); prevSpeed = speed;
    // turning: the body lags the heading, so the difference is the turn; the torso leans into it and the feet shuffle when standing
    const yawErr = wrap(facingTarget - yaw);
    turnLean = damp(turnLean, clamp(yawErr * 0.5, -0.5, 0.5), 8, dt);
    shuffle = damp(shuffle, Math.min(1, Math.abs(yawErr) * 1.6) * (1 - w) * (one ? 0 : 1), 9, dt);
    // the stride follows the ground covered, so the feet do not slide; it keeps going while the body slows to a stop
    const stride = lerp(2.1, 3.4, r);
    phase += (Math.max(speed, moving ? 1.2 : 0) / stride) * Math.PI * 2 * dt * (0.25 + 0.75 * w) + Math.abs(yawErr) * 5 * dt * shuffle;
    const s = Math.sin(phase), c = Math.cos(phase);
    const lw = Math.max(w, shuffle * 0.6); // how much the legs are stepping

    // --- locomotion targets: arms swing against the legs with the elbow folding as the hand comes forward, the shoulders counter-rotate the hips
    // ARMS hang from the shoulder and swing against the same-side leg. The upper arm swings a modest amount (more in a run), a little further forward than
    // back; the elbow is a hinge that only ever FLEXES (more in a run, and a touch more as the hand comes forward), and the arm is held slightly out so the
    // forearm passes beside the torso rather than through it. Nothing here moves the hands above chest height.
    const A = lerp(0.52, 0.95, r), K = lerp(0.62, 1.45, r);
    const AA = lerp(0.36, 0.7, r), E0 = lerp(0.22, 0.95, r), carry = lerp(0.02, 0.1, r);
    const swingOf = (x: number) => (x > 0 ? x : 0.75 * x);
    let thL = A * s, thR = -A * s;
    let shL = -K * Math.max(0, c) - 0.04, shR = -K * Math.max(0, -c) - 0.04;
    let uL = -AA * swingOf(s) - carry, uR = -AA * swingOf(-s) - carry;
    const flex = (u: number) => -Math.min(1.35, E0 + lerp(0.08, 0.3, r) * clamp(-(u + carry) / AA, 0, 1));
    let fL = flex(uL), fR = flex(uR);
    // (upperL hangs at -x: a NEGATIVE z rotation swings it away from the body, positive tucks it in)
    let uLz = -lerp(0.1, 0.2, r), uRz = -uLz;
    // idle: weight shift, breathing, arms hang relaxed with a soft bend and sway
    const breath = Math.sin(t * 1.9), shift = Math.sin(t * 0.55);
    const iL = 0.045 * shift, iR = -0.045 * shift;
    thL = lerp(iL, thL, lw); thR = lerp(iR, thR, lw);
    shL = lerp(-0.04 + 0.04 * shift, shL, lw); shR = lerp(-0.04 - 0.04 * shift, shR, lw);
    uL = lerp(0.05 + 0.03 * Math.sin(t * 1.1), uL, w); uR = lerp(0.05 + 0.03 * Math.sin(t * 1.1 + 1.3), uR, w);
    fL = lerp(-0.28 - 0.04 * breath, fL, w); fR = lerp(-0.28 - 0.04 * breath, fR, w);
    uLz = lerp(-0.08 - 0.012 * breath, uLz, w); uRz = -uLz;
    // arms keep a little of their swing as the body slows (momentum), they do not drop to the sides at once
    // airborne: the legs tuck a little and the arms come up and OUT to the sides to balance, elbows soft (they never raise into the face)
    thL = lerp(thL, 0.5, air); thR = lerp(thR, -0.25, air); shL = lerp(shL, -0.95, air); shR = lerp(shR, -0.5, air);
    uL = lerp(uL, -0.55, air); uR = lerp(uR, -0.7, air); fL = lerp(fL, -0.3, air); fR = lerp(fR, -0.3, air); uLz = lerp(uLz, -0.5, air); uRz = -uLz;
    // the push off: the arms swing up and forward as the legs drive, then settle into the airborne pose
    const push = Math.sin((takeoff / 0.16) * Math.PI) * (takeoff > 0 ? 1 : 0);
    uL -= 0.45 * push; uR -= 0.45 * push; thL -= 0.2 * push; thR -= 0.2 * push;

    const landK = Math.sin((landT / 0.26) * Math.PI);
    const lean = clamp(accel * 0.012, -0.22, 0.28); // forward on a start, back on a stop
    let hipsY = HIPS_Y - (0.016 + 0.03 * r) * w * Math.cos(2 * phase) - 0.004 * breath * (1 - w) - 0.12 * landK + 0.03 * push;
    let hipsX = 0.022 * s * w * (1 - 0.4 * r) + 0.01 * shift * (1 - w); // the weight moves from foot to foot
    let hipsRz = 0.04 * s * w * (1 - 0.5 * r) + 0.006 * shift * (1 - w) - turnLean * 0.1;
    let hipsRy = -0.16 * s * w - turnLean * 0.2;
    let torsoRy = 0.26 * s * w + turnLean * 0.35;
    let torsoRx = -(0.03 + 0.24 * r) * w - 0.08 * air + 0.012 * breath * (1 - w) + 0.06 * landK - lean * w * 0.9 - lean * 0.5 * (1 - w);
    let torsoRz = -0.025 * s * w - turnLean * 0.22 * (0.4 + 0.6 * w);
    let hy = headYaw, hp = headPitch, hrz = 0;
    // landing: the arms drop and spread a little to take the weight
    uL += 0.25 * landK; uR += 0.25 * landK; uLz -= 0.18 * landK; uRz += 0.18 * landK; fL -= 0.25 * landK; fR -= 0.25 * landK;
    // idle life: now and then a hand adjusts (a small lift and elbow bend on one arm), never while moving or gesturing
    handT -= dt; if (handT <= 0) { handT = 7 + Math.random() * 9; handSide = Math.random() < 0.5 ? 0 : 1; handK = 1e-3; }
    if (handK > 0) { handK += dt; if (handK > 1.6) handK = 0; }
    const hand = handK > 0 ? Math.sin((handK / 1.6) * Math.PI) * (1 - w) * (one ? 0 : 1) * (1 - air) : 0;
    if (hand > 0) { if (handSide === 0) { uL -= 0.32 * hand; fL -= 0.55 * hand; } else { uR -= 0.32 * hand; fR -= 0.55 * hand; } }
    let upRx = [uL, uR], upRz = [uLz, uRz], fo = [fL, fR], foRz = [0, 0];

    // --- talking: small gestures with the hands and a nodding head, a moving mouth
    talkW = damp(talkW, talking ? 1 : 0, 6, dt);
    if (talkW > 0.01) {
      const g = talkW * (1 - w);
      upRx[1] = lerp(upRx[1]!, -0.5 + 0.35 * Math.sin(t * 2.3) * Math.max(0, Math.sin(t * 0.9)), g * 0.8);
      fo[1] = lerp(fo[1]!, -0.9 + 0.35 * Math.sin(t * 3.1), g * 0.8);
      upRx[0] = lerp(upRx[0]!, -0.3 + 0.25 * Math.sin(t * 1.7 + 2) * Math.max(0, Math.sin(t * 0.7 + 1)), g * 0.5);
      fo[0] = lerp(fo[0]!, -0.7 + 0.3 * Math.sin(t * 2.7 + 1), g * 0.5);
      hp += 0.06 * Math.sin(t * 3.3) * talkW; hrz += 0.05 * Math.sin(t * 1.4) * talkW;
    }

    // --- gestures (one-shot or held) blended over the body
    ow = damp(ow, one ? (held ? 1 : (oneT < LEN[one] - 0.3 ? 1 : 0)) : 0, 14, dt);
    if (one) {
      oneT += dt;
      if (!held && oneT >= LEN[one] && ow < 0.02) one = null;
      const m = ow, k = Math.min(1, oneT / 0.6);
      const mix = (a: number, b: number) => lerp(a, b, m);
      switch (one) {
        case 'wave': upRx[1] = mix(upRx[1]!, -2.7); upRz[1] = mix(upRz[1]!, -0.3); fo[1] = mix(fo[1]!, -0.6); foRz[1] = mix(foRz[1]!, Math.sin(oneT * 9) * 0.55); hrz += 0.1 * m; break;
        case 'interact': upRx[1] = mix(upRx[1]!, -1.15 * Math.sin(Math.min(1, oneT / 0.35) * Math.PI * 0.5)); fo[1] = mix(fo[1]!, -0.35); torsoRx = mix(torsoRx, -0.12); break;
        case 'cheer': case 'success': upRx[0] = mix(upRx[0]!, -2.5); upRx[1] = mix(upRx[1]!, -2.5); upRz[0] = mix(upRz[0]!, 0.75); upRz[1] = mix(upRz[1]!, -0.75); fo[0] = mix(fo[0]!, -0.25); fo[1] = mix(fo[1]!, -0.25); hipsY += m * Math.abs(Math.sin(oneT * 6)) * 0.14; torsoRx = mix(torsoRx, 0.14); hp = mix(hp, -0.2); break;
        case 'cast': upRx[0] = mix(upRx[0]!, -1.5); upRx[1] = mix(upRx[1]!, -1.5); fo[0] = mix(fo[0]!, -0.2); fo[1] = mix(fo[1]!, -0.2); torsoRx = mix(torsoRx, -0.18 * Math.sin(k * Math.PI)); break;
        case 'think': upRx[1] = mix(upRx[1]!, -1.15); upRz[1] = mix(upRz[1]!, 0.25); fo[1] = mix(fo[1]!, -2.0); hrz += 0.14 * m; hp = mix(hp, 0.12); break;
        case 'damage': torsoRx = mix(torsoRx, 0.42); hp = mix(hp, 0.35); upRz[0] = mix(upRz[0]!, 0.9); upRz[1] = mix(upRz[1]!, -0.9); hipsRz += Math.sin(oneT * 45) * 0.05 * (1 - k) * m; break;
        case 'nod': hp = mix(hp, 0.28 * Math.sin(oneT * 9)); break;
        case 'shrug': upRz[0] = mix(upRz[0]!, 0.35); upRz[1] = mix(upRz[1]!, -0.35); fo[0] = mix(fo[0]!, -1.2); fo[1] = mix(fo[1]!, -1.2); foRz[0] = mix(foRz[0]!, -0.5); foRz[1] = mix(foRz[1]!, 0.5); hrz += 0.12 * m; break;
        case 'point': upRx[1] = mix(upRx[1]!, -1.5); upRz[1] = mix(upRz[1]!, -0.12); fo[1] = mix(fo[1]!, -0.1); torsoRx = mix(torsoRx, -0.05); break;
        case 'work': upRx[0] = mix(upRx[0]!, -0.95); upRx[1] = mix(upRx[1]!, -0.95); fo[0] = mix(fo[0]!, -1.0 + 0.3 * Math.sin(t * 8)); fo[1] = mix(fo[1]!, -1.0 + 0.3 * Math.sin(t * 8 + 2.4)); torsoRx = mix(torsoRx, -0.15); hp = mix(hp, 0.22); break;
        case 'bow': torsoRx = mix(torsoRx, -0.7 * Math.sin(Math.min(1, oneT / LEN.bow) * Math.PI)); break;
        case 'type': { const f = Math.sin(t * 17), g = Math.sin(t * 13 + 1.7); upRx[0] = mix(upRx[0]!, -0.85); upRx[1] = mix(upRx[1]!, -0.85); fo[0] = mix(fo[0]!, -1.35 + 0.1 * f); fo[1] = mix(fo[1]!, -1.35 + 0.1 * g); upRz[0] = mix(upRz[0]!, 0.18); upRz[1] = mix(upRz[1]!, -0.18); torsoRx = mix(torsoRx, -0.14); hp = mix(hp, 0.2 + 0.03 * g); break; }
        case 'ready': { hipsY = lerp(hipsY, HIPS_Y - 0.16, m); thL = mix(thL, 0.62); thR = mix(thR, 0.62); shL = mix(shL, -1.05); shR = mix(shR, -1.05); torsoRx = mix(torsoRx, -0.5); upRx[0] = mix(upRx[0]!, -0.7); upRx[1] = mix(upRx[1]!, -0.7); fo[0] = mix(fo[0]!, -0.75); fo[1] = mix(fo[1]!, -0.75); upRz[0] = mix(upRz[0]!, 0.3); upRz[1] = mix(upRz[1]!, -0.3); hp = mix(hp, 0.35 + 0.04 * Math.sin(t * 1.3)); break; }
        case 'swing': { const k2 = clamp(oneT / 0.9, 0, 1), wind = k2 < 0.38 ? k2 / 0.38 : 1, hit = k2 < 0.38 ? 0 : Math.min(1, (k2 - 0.38) / 0.22), fin = k2 < 0.6 ? 0 : (k2 - 0.6) / 0.4; const turn = -1.0 * wind * (1 - hit) + 1.35 * hit - 0.3 * fin; upRx[0] = mix(upRx[0]!, -1.25); upRx[1] = mix(upRx[1]!, -1.25); fo[0] = mix(fo[0]!, -0.55); fo[1] = mix(fo[1]!, -0.55); upRz[0] = mix(upRz[0]!, 0.15); upRz[1] = mix(upRz[1]!, -0.15); torsoRy += turn * m; hipsRy += turn * 0.6 * m; torsoRx = mix(torsoRx, -0.12); hipsY = lerp(hipsY, HIPS_Y - 0.08, m); thL = mix(thL, 0.3); thR = mix(thR, 0.3); shL = mix(shL, -0.55); shR = mix(shR, -0.55); break; }
        case 'pitch': { const k2 = clamp(oneT / 1.3, 0, 1), up = k2 < 0.45 ? Math.sin((k2 / 0.45) * Math.PI * 0.5) : 1 - Math.min(1, (k2 - 0.45) / 0.1), fwd = k2 < 0.45 ? 0 : Math.min(1, (k2 - 0.45) / 0.18); upRx[0] = mix(upRx[0]!, -2.4 * up - 0.6 * (1 - up)); upRx[1] = mix(upRx[1]!, lerp(-2.6 * up, 0.9, fwd)); fo[0] = mix(fo[0]!, -0.5); fo[1] = mix(fo[1]!, lerp(-0.4, -0.2, fwd)); thL = mix(thL, lerp(-1.25 * up, 0.5, fwd)); shL = mix(shL, lerp(-1.3 * up, -0.2, fwd)); torsoRx = mix(torsoRx, 0.2 * up * -1 + 0.55 * fwd); torsoRy += 0.5 * (fwd - 0.3 * up) * m; break; }
        case 'throw': { const k2 = clamp(oneT / 0.8, 0, 1), back = k2 < 0.4 ? k2 / 0.4 : 1, fwd = k2 < 0.4 ? 0 : Math.min(1, (k2 - 0.4) / 0.2); upRx[1] = mix(upRx[1]!, lerp(-2.3 * back, 0.8, fwd)); upRx[0] = mix(upRx[0]!, -1.0); fo[1] = mix(fo[1]!, -0.5); torsoRy += (-0.7 * back + 1.3 * fwd) * m * 0.7; torsoRx = mix(torsoRx, 0.1 * back + 0.35 * fwd); break; }
        case 'catch': upRx[0] = mix(upRx[0]!, -1.4); upRx[1] = mix(upRx[1]!, -1.4); fo[0] = mix(fo[0]!, -0.55); fo[1] = mix(fo[1]!, -0.55); upRz[0] = mix(upRz[0]!, 0.1); upRz[1] = mix(upRz[1]!, -0.1); torsoRx = mix(torsoRx, -0.2); break;
        case 'stretch': { const side = Math.sin(t * 1.4); upRx[0] = mix(upRx[0]!, -3.0); upRx[1] = mix(upRx[1]!, -3.0); upRz[0] = mix(upRz[0]!, 0.25 + 0.2 * side); upRz[1] = mix(upRz[1]!, -0.25 + 0.2 * side); fo[0] = mix(fo[0]!, -0.1); fo[1] = mix(fo[1]!, -0.1); torsoRz = mix(torsoRz, 0.32 * side); break; }
        case 'lift': { const q2 = 0.5 + 0.5 * Math.sin(t * 3.2); upRx[0] = mix(upRx[0]!, -0.25); upRx[1] = mix(upRx[1]!, -0.25); fo[0] = mix(fo[0]!, -0.3 - 1.9 * q2); fo[1] = mix(fo[1]!, -0.3 - 1.9 * (1 - q2)); hipsY = lerp(hipsY, HIPS_Y - 0.1 * q2, m); thL = mix(thL, 0.4 * q2); thR = mix(thR, 0.4 * q2); shL = mix(shL, -0.8 * q2); shR = mix(shR, -0.8 * q2); torsoRx = mix(torsoRx, -0.1 * q2); break; }
        case 'salute': upRx[1] = mix(upRx[1]!, -1.9); fo[1] = mix(fo[1]!, -2.3); upRz[1] = mix(upRz[1]!, -0.5); hp = mix(hp, -0.08); torsoRx = mix(torsoRx, -0.04); break;
      }
    }
    // pointing toward something (held or one-shot) turns the torso and head to it
    pointW = damp(pointW, one === 'point' && pointYaw !== null ? 1 : 0, 8, dt);
    if (pointYaw !== null && pointW > 0.02) { const rel = clamp(wrap(pointYaw - yaw), -1.3, 1.3); torsoRy += rel * 0.5 * pointW; hy += (rel * 0.5) * pointW; }

    // --- head: look at something, else wander a little (gaze stays forward while the torso twists)
    let wantYaw = 0, wantPitch = 0;
    if (lookX !== null) { const dx = lookX - root.position.x, dz = lookZ - root.position.z; wantYaw = clamp(wrap(Math.atan2(-dx, -dz) - yaw), -1.1, 1.1); wantPitch = -0.05; }
    else { fidget -= dt; if (fidget <= 0) { fidget = 2 + Math.random() * 5; fidgetYaw = (Math.random() - 0.5) * 0.9; fidgetPitch = (Math.random() - 0.5) * 0.25; } wantYaw = fidgetYaw * (1 - w); wantPitch = fidgetPitch * (1 - w); }
    headYaw = damp(headYaw, wantYaw, 5, dt); headPitch = damp(headPitch, wantPitch, 5, dt);
    hy = headYaw + (hy - headYaw) - torsoRy * 0.7 - hipsRy * 0.3 + 0;
    hp = headPitch + (hp - headPitch) + 0.03 * Math.sin(2 * phase) * w - torsoRx * 0.5;

    // --- write the pose
    sk.hips.position.y = hipsY; sk.hips.position.x = hipsX; sk.hips.rotation.set(0, hipsRy, hipsRz);
    sk.torso.rotation.set(torsoRx, torsoRy, torsoRz);
    sk.head.rotation.set(hp, hy, hrz);
    sk.thighL.rotation.x = thL; sk.thighR.rotation.x = thR; sk.shinL.rotation.x = shL; sk.shinR.rotation.x = shR;
    sk.upperL.rotation.set(upRx[0]!, 0, upRz[0]!); sk.upperR.rotation.set(upRx[1]!, 0, upRz[1]!);
    sk.foreL.rotation.set(fo[0]!, 0, foRz[0]!); sk.foreR.rotation.set(fo[1]!, 0, foRz[1]!);
    if (sk.skirt) { sk.skirt.rotation.x = 0.03 * s * w; sk.skirt.scale.set(1 + 0.05 * Math.abs(s) * w, 1, 1 + 0.1 * Math.abs(s) * w); }
    if (sk.cape) sk.cape.rotation.x = 0.08 + 0.55 * clamp(speed / 5.6, 0, 1) * w + 0.04 * Math.sin(t * 5 + phase) * w + 0.015 * Math.sin(t * 1.3);

    // --- face: blinking, mood, speech
    blink -= dt; if (blink <= 0) { blinkT = 0.13; blink = 2.2 + Math.random() * 3.6; }
    if (blinkT > 0) blinkT -= dt;
    const lid = blinkT > 0 ? 0.12 : 1;
    for (const e of sk.eyes) e.scale.y = (e.userData.sy ??= e.scale.y) * lid;
    moodBrow = damp(moodBrow, moodTarget === 'worried' ? 1 : moodTarget === 'happy' ? -0.6 : moodTarget === 'focused' ? -1 : 0, 8, dt);
    moodMouth = damp(moodMouth, moodTarget === 'happy' ? 1 : moodTarget === 'worried' ? -1 : 0, 8, dt);
    browMood = moodBrow; mouthMood = moodMouth;
    sk.brows.forEach((b, i) => { b.rotation.z = (i === 0 ? 1 : -1) * browMood * 0.28; b.position.y = (b.userData.y ??= b.position.y) + (browMood < 0 ? 0 : 0.006) * (browMood > 0 ? 1 : 0); });
    const open = talkW > 0.05 ? (0.4 + 0.6 * Math.abs(Math.sin(t * 13) * Math.sin(t * 5.3 + 1))) * talkW : 0;
    sk.mouth.scale.y = (sk.mouth.userData.sy ??= sk.mouth.scale.y) * (1 + open * 3.5 + Math.max(0, mouthMood) * 0.3);
    sk.mouth.scale.x = (sk.mouth.userData.sx ??= sk.mouth.scale.x) * (1 + mouthMood * 0.35 - open * 0.25);
    sk.mouth.rotation.z = mouthMood * -0.05 * 0;
    // robot lights
    if (glowK > 0 || robot) { const pulse = robot ? 0.5 + 0.5 * Math.sin(t * 2.2) : 0; for (const l of sk.lights) { const m = l.material as MeshBasicMaterial & { emissiveIntensity?: number }; if (m && 'emissiveIntensity' in m) { /* shared material: pulse via scale instead */ } l.scale.setScalar((l.userData.sc ??= l.scale.x) * (1 + 0.08 * pulse + glowK * 0.2)); } }
    // smooth facing
    yaw = damp(yaw, yaw + wrap(facingTarget - yaw), 12, dt); root.rotation.y = yaw;
  };

  return {
    group: root,
    skeleton: sk,
    height: sk.height * scale,
    update: apply,
    setFacing(y, snap = false) { facingTarget = y; if (snap) { yaw = y; root.rotation.y = y; } },
    facing: () => yaw,
    play(a) { one = a; oneT = 0; held = false; },
    hold(a) { one = a; oneT = 0; held = true; },
    release() { held = false; if (one) oneT = Math.max(oneT, LEN[one] - 0.3); },
    talk(on) { talking = on; },
    mood(m) { moodTarget = m; },
    flash(on) {
      if (on === flashing) return; flashing = on;
      for (const m of meshes) { if (on) { m.userData.orig ??= m.material; m.material = toon(0xff4d4d, 0.9); } else if (m.userData.orig) m.material = m.userData.orig; }
    },
    lookAt(x, z = 0) { lookX = x; lookZ = z; },
    pointAt(x, z) { pointYaw = Math.atan2(-(x - root.position.x), -(z - root.position.z)); },
    glow(color, k) { glowK = k; glowColor = color; void glowColor; },
  };
}
