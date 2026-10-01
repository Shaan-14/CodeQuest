import { describe, expect, it } from 'vitest';
import { collidersOf, newBody, PLAYER_RADIUS, poseOf, RUN_SPEED, stepBody, WALK_SPEED } from './movement';
import type { Collider, SceneDef } from './sceneTypes';

const B = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
const run = (b: ReturnType<typeof newBody>, input: Partial<{ dx: number; dz: number; run: boolean; jump: boolean }>, cols: Collider[], seconds: number, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) stepBody(b, { dx: 0, dz: 0, run: false, jump: false, ...input }, cols, B, dt);
  return b;
};

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
