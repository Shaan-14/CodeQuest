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
const ACCEL = 28; // how quickly velocity follows the wish (feels smooth, never slidy)

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

/** Does a collider stop a body at this height? (A jump clears anything lower than the body's feet.) */
const blocks = (c: Collider, y: number) => c.h === undefined || y < c.h - 0.05;

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
  const k = Math.min(1, ACCEL * dt / speed);
  b.vx += (wx - b.vx) * k;
  b.vz += (wz - b.vz) * k;
  if (len < 1e-6 && Math.hypot(b.vx, b.vz) < 0.05) { b.vx = 0; b.vz = 0; }

  if (input.jump && b.onGround) { b.vy = JUMP_SPEED; b.onGround = false; }
  b.vy -= GRAVITY * dt;
  b.y += b.vy * dt;
  if (b.y <= 0) { b.y = 0; b.vy = 0; b.onGround = true; }

  // Move in small steps so a fast body cannot tunnel through a thin wall.
  const dist = Math.hypot(b.vx, b.vz) * dt;
  const steps = Math.max(1, Math.ceil(dist / (PLAYER_RADIUS * 0.5)));
  const sx = (b.vx * dt) / steps, sz = (b.vz * dt) / steps;
  for (let i = 0; i < steps; i++) {
    let nx = b.x + sx, nz = b.z + sz;
    for (const c of colliders) if (blocks(c, b.y)) [nx, nz] = pushOut(nx, nz, PLAYER_RADIUS, c);
    b.x = Math.max(bounds.minX + PLAYER_RADIUS, Math.min(bounds.maxX - PLAYER_RADIUS, nx));
    b.z = Math.max(bounds.minZ + PLAYER_RADIUS, Math.min(bounds.maxZ - PLAYER_RADIUS, nz));
  }
  // Face where we are going (smoothly), never snapping while standing.
  if (len > 1e-6) {
    const target = Math.atan2(-wx, -wz);
    let d = target - b.ry;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    b.ry += d * Math.min(1, 14 * dt);
  }
  return b;
}

/** What the character is doing, for the animation rig. */
export type Pose = 'idle' | 'walk' | 'run' | 'jump';
export const poseOf = (b: Body, running: boolean): Pose => (!b.onGround ? 'jump' : Math.hypot(b.vx, b.vz) < 0.4 ? 'idle' : running ? 'run' : 'walk');
