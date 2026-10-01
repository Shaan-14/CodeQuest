import { describe, expect, it } from 'vitest';
import { collidersOf, newBody, PLAYER_RADIUS, poseOf, RUN_SPEED, stepBody, WALK_SPEED } from './movement';
import type { Collider, SceneDef } from './sceneTypes';

const B = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
const run = (b: ReturnType<typeof newBody>, input: Partial<{ dx: number; dz: number; run: boolean; jump: boolean }>, cols: Collider[], seconds: number, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) stepBody(b, { dx: 0, dz: 0, run: false, jump: false, ...input }, cols, B, dt);
  return b;
};

describe('movement has weight (acceleration, stopping, turning, walls, kerbs)', () => {
  it('speeds up over a fraction of a second instead of starting at full speed', () => {
    const b = run(newBody(0, 0), { dz: -1, run: true }, [], 0.08);
    expect(Math.hypot(b.vx, b.vz)).toBeLessThan(RUN_SPEED * 0.6);
    const c = run(newBody(0, 0), { dz: -1, run: true }, [], 0.7);
    expect(Math.hypot(c.vx, c.vz)).toBeGreaterThan(RUN_SPEED * 0.97);
  });
  it('does not stop dead when the keys are released: a short, believable run-out', () => {
    const b = run(newBody(0, 10), { dz: -1, run: true }, [], 1.5); const z = b.z;
    run(b, {}, [], 0.05);
    expect(Math.hypot(b.vx, b.vz)).toBeGreaterThan(0.5); // still moving a few frames later
    run(b, {}, [], 0.6);
    expect(Math.hypot(b.vx, b.vz)).toBe(0);
    const slid = z - b.z; expect(slid).toBeGreaterThan(0.25); expect(slid).toBeLessThan(1.1);
  });
  it('turning back on yourself bleeds speed and swings round, never an instant flip', () => {
    const b = run(newBody(0, 0), { dz: -1, run: true }, [], 1);
    let slowest = Infinity;
    for (let t = 0; t < 0.6; t += 1 / 60) { stepBody(b, { dx: 0, dz: 1, run: true, jump: false }, [], B, 1 / 60); slowest = Math.min(slowest, Math.hypot(b.vx, b.vz)); }
    expect(slowest).toBeLessThan(RUN_SPEED * 0.35);
    expect(b.vz).toBeGreaterThan(0); // and then it is going the new way
  });
  it('pushing into a wall comes to rest: the body does not keep "running" or jitter against it', () => {
    const wall: Collider = { kind: 'box', x: 0, z: -5, w: 10, d: 1 };
    const b = run(newBody(0, 0), { dz: -1, run: true }, [wall], 3);
    const z = b.z, speeds: number[] = [], zs: number[] = [];
    for (let t = 0; t < 1; t += 1 / 60) { stepBody(b, { dx: 0, dz: -1, run: true, jump: false }, [wall], B, 1 / 60); speeds.push(Math.hypot(b.vx, b.vz)); zs.push(b.z); }
    expect(Math.max(...speeds)).toBeLessThan(0.15);
    expect(Math.max(...zs) - Math.min(...zs)).toBeLessThan(0.02);
    expect(Math.abs(b.z - z)).toBeLessThan(0.02);
  });
  it('sliding along a wall keeps the along-wall speed', () => {
    const wall: Collider = { kind: 'box', x: 0, z: -5, w: 30, d: 1 };
    const b = run(newBody(-6, 0), { dx: 1, dz: -1, run: true }, [wall], 2);
    expect(Math.abs(b.vx)).toBeGreaterThan(RUN_SPEED * 0.5);
    expect(Math.abs(b.vz)).toBeLessThan(0.3);
  });
  it('a kerb is stepped onto and off again smoothly; a wall of the same footprint still blocks', () => {
    const kerb: Collider = { kind: 'box', x: 0, z: -3, w: 6, d: 1, h: 0.2 };
    const b = newBody(0, 0); let maxY = 0, popped = false, lastY = 0;
    for (let t = 0; t < 2.5; t += 1 / 60) { stepBody(b, { dx: 0, dz: -1, run: false, jump: false }, [kerb], B, 1 / 60); maxY = Math.max(maxY, b.y); if (Math.abs(b.y - lastY) > 0.08) popped = true; lastY = b.y; }
    expect(b.z).toBeLessThan(-4); expect(maxY).toBeGreaterThan(0.15); expect(maxY).toBeLessThanOrEqual(0.2 + 1e-6); expect(popped).toBe(false); expect(b.y).toBeLessThan(0.01);
  });
  it('momentum carries through a jump (limited air control)', () => {
    const b = run(newBody(0, 0), { dz: -1, run: true }, [], 1); b.vy = 0;
    stepBody(b, { dx: 0, dz: -1, run: true, jump: true }, [], B, 1 / 60);
    const v0 = b.vz;
    for (let i = 0; i < 6; i++) stepBody(b, { dx: 0, dz: 1, run: true, jump: false }, [], B, 1 / 60);
    expect(b.vz).toBeLessThan(0); // still travelling the old way mid-air
    expect(b.vz).toBeGreaterThan(v0 + 1.2 * 0 - 6); // and not reversed in a frame
    expect(Math.abs(b.vz)).toBeGreaterThan(RUN_SPEED * 0.55);
  });
});

describe('player movement', () => {
  it('walks at walking speed and runs faster', () => {
    const walk = run(newBody(0, 10), { dz: -1 }, [], 1.5), sprint = run(newBody(0, 10), { dz: -1, run: true }, [], 1.5);
    expect(10 - walk.z).toBeGreaterThan(WALK_SPEED * 1.1);
    expect(10 - walk.z).toBeLessThan(WALK_SPEED * 1.6);
    expect(10 - sprint.z).toBeGreaterThan((10 - walk.z) * 1.4);
    expect(RUN_SPEED).toBeGreaterThan(WALK_SPEED);
  });
  it('diagonal movement is not faster than straight movement', () => {
    const d = run(newBody(0, 0), { dx: 1, dz: -1 }, [], 1), s = run(newBody(0, 0), { dz: -1 }, [], 1);
    expect(Math.hypot(d.x, d.z)).toBeLessThanOrEqual(Math.hypot(s.x, s.z) * 1.02);
  });
  it('stops at a solid box and slides along it instead of sticking', () => {
    const wall: Collider = { kind: 'box', x: 0, z: -5, w: 10, d: 1 };
    const b = run(newBody(-2, 0), { dx: 0.5, dz: -1 }, [wall], 3);
    expect(b.z).toBeGreaterThan(-5 + 0.5 + PLAYER_RADIUS - 0.05); // never inside the wall
    expect(b.x).toBeGreaterThan(-2); // slid sideways along it
  });
  it('cannot tunnel through a thin wall at running speed with a long frame', () => {
    const wall: Collider = { kind: 'box', x: 0, z: -5, w: 10, d: 0.2 };
    const b = run(newBody(0, 0), { dz: -1, run: true }, [wall], 3, 0.1);
    expect(b.z).toBeGreaterThan(-5);
  });
  it('is pushed out of circles, and stays inside the scene bounds', () => {
    const post: Collider = { kind: 'circle', x: 0, z: -3, r: 0.5 };
    const b = run(newBody(0, 0), { dz: -1 }, [post], 3);
    expect(Math.hypot(b.x - 0, b.z + 3)).toBeGreaterThanOrEqual(0.5 + PLAYER_RADIUS - 0.05);
    const far = run(newBody(0, 0), { dx: 1 }, [], 20);
    expect(far.x).toBeLessThanOrEqual(B.maxX - PLAYER_RADIUS + 1e-6);
  });
  it('a jump clears a low obstacle but not a tall one', () => {
    const low: Collider = { kind: 'box', x: 0, z: -3, w: 4, d: 1, h: 0.3 }, tall: Collider = { kind: 'box', x: 0, z: -3, w: 4, d: 1, h: 3 };
    const over = newBody(0, 0); let crossed = false;
    for (let t = 0; t < 2; t += 1 / 60) { stepBody(over, { dx: 0, dz: -1, run: false, jump: t < 1.2 }, [low], B, 1 / 60); if (over.z < -3.6) crossed = true; }
    expect(crossed).toBe(true);
    const blocked = run(newBody(0, 0), { dz: -1, jump: true }, [tall], 2);
    expect(blocked.z).toBeGreaterThan(-3);
  });
  it('gravity brings a jump back to the ground; poses follow what the body is doing', () => {
    const b = newBody(0, 0);
    stepBody(b, { dx: 0, dz: 0, run: false, jump: true }, [], B, 1 / 60);
    expect(b.onGround).toBe(false);
    expect(poseOf(b, false)).toBe('jump');
    run(b, {}, [], 2);
    expect(b.onGround).toBe(true);
    expect(poseOf(b, false)).toBe('idle');
    const w = run(newBody(0, 0), { dz: -1 }, [], 1), r = run(newBody(0, 0), { dz: -1, run: true }, [], 1);
    expect(poseOf(w, false)).toBe('walk');
    expect(poseOf(r, true)).toBe('run');
  });
  it('turns to face the direction of travel', () => {
    const b = run(newBody(0, 0, 0), { dx: 1 }, [], 1); // east
    expect(Math.abs(b.ry - -Math.PI / 2)).toBeLessThan(0.2);
  });
  it('a scene’s solid props become colliders (a quarter turn swaps the footprint)', () => {
    const scene = { walls: [], props: [{ kind: 'box', x: 0, z: 0, ry: Math.PI / 2, p: { w: 4, d: 1 }, solid: true }, { kind: 'floor', x: 0, z: 0 }] } as unknown as SceneDef;
    const c = collidersOf(scene);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ kind: 'box', w: 1, d: 4 });
  });
});
