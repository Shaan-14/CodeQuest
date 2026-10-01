/**
 * PLAYER MOVEMENT (pure): walking, running, jumping and sliding along walls. No three.js and no DOM, so the feel of the game is unit-tested.
 * Collision is circle-vs-(box|circle) in the ground plane; a collider's optional height lets a jump clear low things.
 */
import type { Collider, SceneDef } from './sceneTypes';

export const PLAYER_RADIUS = 0.38;
export const WALK_SPEED = 3.2;
export const RUN_SPEED = 5.6;
export const JUMP_SPEED = 5.2;
export const GRAVITY = 14;
/** Acceleration limits (m/s²). Speeding up is brisk, stopping is a touch quicker, and turning back on yourself is quickest of all, so the body has weight without ever feeling slidy. */
const ACCEL = 20, DECEL = 28, TURN_ACCEL = 34;
/** Air control: momentum carries through a jump, steering only nudges it. */
const AIR_CONTROL = 0.4;
/** A collider this low is a kerb or a step, not a wall: the body walks up onto it. */
export const STEP_HEIGHT = 0.32;

export interface Body {
  x: number; z: number; y: number;
  /** Horizontal velocity. */
  vx: number; vz: number; vy: number;
  /** Facing (radians, 0 = north/-Z). */
  ry: number;
  onGround: boolean;
}

export interface MoveInput {
  /** Desired direction in WORLD space, length 0..1 (the camera turns key presses into this). */
  dx: number; dz: number;
  run: boolean;
  jump: boolean;
}

export const newBody = (x: number, z: number, ry = 0): Body => ({ x, z, y: 0, vx: 0, vz: 0, vy: 0, ry, onGround: true });

/** Push a circle out of one collider; returns the corrected position. */
export function pushOut(px: number, pz: number, r: number, c: Collider): [number, number] {
  if (c.kind === 'circle') {
    const dx = px - c.x, dz = pz - c.z, min = r + c.r, d2 = dx * dx + dz * dz;
    if (d2 >= min * min) return [px, pz];
    const d = Math.sqrt(d2) || 1e-6;
    return [c.x + (dx / d) * min, c.z + (dz / d) * min];
  }
  const hx = c.w / 2, hz = c.d / 2;
  const nx = Math.max(c.x - hx, Math.min(px, c.x + hx)), nz = Math.max(c.z - hz, Math.min(pz, c.z + hz));
  const dx = px - nx, dz = pz - nz, d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return [px, pz];
  if (d2 > 1e-10) { const d = Math.sqrt(d2); return [nx + (dx / d) * r, nz + (dz / d) * r]; }
  // The centre is inside the box: leave by the nearest face.
  const left = px - (c.x - hx), right = c.x + hx - px, up = pz - (c.z - hz), down = c.z + hz - pz;
  const m = Math.min(left, right, up, down);
  if (m === left) return [c.x - hx - r, pz];
  if (m === right) return [c.x + hx + r, pz];
  if (m === up) return [px, c.z - hz - r];
  return [px, c.z + hz + r];
}

/** Does a collider stop a body at this height? (A jump clears anything lower than the body's feet; a kerb is stepped onto, never a wall.) */
const blocks = (c: Collider, y: number) => c.h === undefined || (c.h > STEP_HEIGHT && y < c.h - 0.05);

/** The height of the ground under a body: the top of the highest kerb or step it stands on, else the floor. */
export function groundAt(x: number, z: number, colliders: readonly Collider[]): number {
  let g = 0;
  for (const c of colliders) {
    if (c.h === undefined || c.h > STEP_HEIGHT) continue;
    const on = c.kind === 'circle' ? Math.hypot(x - c.x, z - c.z) < c.r + PLAYER_RADIUS * 0.3 : Math.abs(x - c.x) < c.w / 2 + PLAYER_RADIUS * 0.3 && Math.abs(z - c.z) < c.d / 2 + PLAYER_RADIUS * 0.3;
    if (on && c.h > g) g = c.h;
  }
  return g;
}
/** The colliders of a scene: every solid prop, plus its walls. Computed once per scene. */
export function collidersOf(scene: SceneDef): Collider[] {
  const out: Collider[] = [...(scene.walls ?? [])];
  for (const p of scene.props) {
    if (!p.solid) continue;
    const s = typeof p.solid === 'object' ? p.solid : { w: Number(p.p?.w ?? 1), d: Number(p.p?.d ?? 1), h: p.p?.h === undefined ? undefined : Number(p.p.h) };
    const rot = Math.abs(Math.sin(p.ry ?? 0)) > 0.7; // a quarter turn swaps the footprint
    out.push({ kind: 'box', x: p.x, z: p.z, w: rot ? s.d : s.w, d: rot ? s.w : s.d, h: s.h });
  }
  return out;
}

/** Advance the body by `dt` seconds. Mutates and returns it (hot path: no allocation). */
export function stepBody(b: Body, input: MoveInput, colliders: Collider[], bounds: SceneDef['bounds'], dt: number): Body {
  const len = Math.hypot(input.dx, input.dz);
  const speed = input.run ? RUN_SPEED : WALK_SPEED;
  const wx = len > 1e-6 ? (input.dx / Math.max(1, len)) * speed : 0;
  const wz = len > 1e-6 ? (input.dz / Math.max(1, len)) * speed : 0;
  // velocity follows the wish with a LIMITED acceleration (a vector, so a change of direction is a real turn that bleeds speed, not a snap)
  let dvx = wx - b.vx, dvz = wz - b.vz;
  const dv = Math.hypot(dvx, dvz);
  if (dv > 1e-6) {
    const speeding = len > 1e-6 && wx * b.vx + wz * b.vz >= 0 && Math.hypot(wx, wz) >= Math.hypot(b.vx, b.vz) - 0.01;
    const reversing = len > 1e-6 && wx * b.vx + wz * b.vz < -0.2;
    let a = (reversing ? TURN_ACCEL : speeding ? ACCEL : DECEL) * dt;
    if (!b.onGround) a *= AIR_CONTROL;
    const k = Math.min(1, a / dv);
    dvx *= k; dvz *= k;
    b.vx += dvx; b.vz += dvz;
  }
  if (len < 1e-6 && Math.hypot(b.vx, b.vz) < 0.05) { b.vx = 0; b.vz = 0; }

  const ground = groundAt(b.x, b.z, colliders);
  if (input.jump && b.onGround) { b.vy = JUMP_SPEED; b.onGround = false; }
  b.vy -= GRAVITY * dt;
  b.y += b.vy * dt;
  if (b.onGround && b.vy <= 0) { b.y += (ground - b.y) * Math.min(1, 22 * dt); b.vy = 0; } // stepping up onto a kerb and back down is smooth, never a pop
  else if (b.y <= ground) { b.y = ground; b.vy = 0; b.onGround = true; }

  // Move in small steps so a fast body cannot tunnel through a thin wall.
  const x0 = b.x, z0 = b.z;
  const dist = Math.hypot(b.vx, b.vz) * dt;
  const steps = Math.max(1, Math.ceil(dist / (PLAYER_RADIUS * 0.5)));
  const sx = (b.vx * dt) / steps, sz = (b.vz * dt) / steps;
  for (let i = 0; i < steps; i++) {
    let nx = b.x + sx, nz = b.z + sz;
    for (const c of colliders) if (blocks(c, b.y)) [nx, nz] = pushOut(nx, nz, PLAYER_RADIUS, c);
    b.x = Math.max(bounds.minX + PLAYER_RADIUS, Math.min(bounds.maxX - PLAYER_RADIUS, nx));
    b.z = Math.max(bounds.minZ + PLAYER_RADIUS, Math.min(bounds.maxZ - PLAYER_RADIUS, nz));
  }
  // what the body ACTUALLY did is its velocity: pushing into a wall slows it to the slide along it (or to a stop), so the legs and the
  // camera never run on the spot against a wall and nothing jitters
  if (dt > 0) {
    const ax = (b.x - x0) / dt, az = (b.z - z0) / dt, aSpeed = Math.hypot(ax, az), vSpeed = Math.hypot(b.vx, b.vz);
    if (aSpeed < vSpeed - 1e-4) { b.vx = ax; b.vz = az; }
  }
  // Face where we are going (smoothly), never snapping while standing; against a wall, face where the player is pushing.
  const moving = Math.hypot(b.vx, b.vz) > 0.5;
  if (moving || len > 1e-6) {
    const target = moving ? Math.atan2(-b.vx, -b.vz) : Math.atan2(-wx, -wz);
    let d = target - b.ry;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    b.ry += d * (1 - Math.exp(-dt * (moving ? 13 : 9)));
  }
  return b;
}

/** What the character is doing, for the animation rig. */
export type Pose = 'idle' | 'walk' | 'run' | 'jump';
export const poseOf = (b: Body, running: boolean): Pose => (!b.onGround ? 'jump' : Math.hypot(b.vx, b.vz) < 0.4 ? 'idle' : running ? 'run' : 'walk');
