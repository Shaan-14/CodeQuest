import { describe, expect, it } from 'vitest';
import { buildGrid, findPath, pathLength, sampleAlong } from './path';
import type { Collider } from './sceneTypes';

const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };

describe('pathfinding for the objective trail', () => {
  it('goes straight across an empty room', () => {
    const g = buildGrid(bounds, []); const p = findPath(g, { x: -8, z: 0 }, { x: 8, z: 0 })!;
    expect(p.length).toBe(2); expect(pathLength(p)).toBeCloseTo(16, 0);
  });
  it('goes around a wall and through its gap, never through the wall', () => {
    const wall: Collider[] = [{ kind: 'box', x: 0, z: -4, w: 0.4, d: 12 }]; // x=0, from z=-10 to 2: the gap is z>2
    const g = buildGrid(bounds, wall); const p = findPath(g, { x: -6, z: -6 }, { x: 6, z: -6 })!;
    expect(p).not.toBeNull(); expect(pathLength(p)).toBeGreaterThan(Math.hypot(12, 0) + 4);
    for (let i = 1; i < p.length; i++) for (let k = 0; k <= 20; k++) { const x = p[i - 1]!.x + ((p[i]!.x - p[i - 1]!.x) * k) / 20, z = p[i - 1]!.z + ((p[i]!.z - p[i - 1]!.z) * k) / 20; expect(Math.abs(x) < 0.2 && z < 2).toBe(false); }
  });
  it('reaches a goal that is itself inside a solid (a console) by stopping next to it', () => {
    const g = buildGrid(bounds, [{ kind: 'box', x: 5, z: 5, w: 2, d: 1 }]); const p = findPath(g, { x: 0, z: 0 }, { x: 5, z: 5 })!;
    expect(p).not.toBeNull(); const end = p[p.length - 1]!; expect(Math.hypot(end.x - 5, end.z - 5)).toBeLessThan(3);
  });
  it('returns null when the goal is sealed off', () => {
    const ring: Collider[] = [{ kind: 'box', x: 5, z: 0, w: 6, d: 0.4 }, { kind: 'box', x: 5, z: 6, w: 6, d: 0.4 }, { kind: 'box', x: 2, z: 3, w: 0.4, d: 6.4 }, { kind: 'box', x: 8, z: 3, w: 0.4, d: 6.4 }];
    const g = buildGrid(bounds, ring); expect(findPath(g, { x: -8, z: -8 }, { x: 5, z: 3 })).toBeNull();
  });
  it('samples evenly spaced trail points with a heading', () => {
    const pts = sampleAlong([{ x: 0, z: 0 }, { x: 0, z: -10 }], 1, 2, 5);
    expect(pts.length).toBe(6); expect(pts[0]!.z).toBeCloseTo(-2, 5); expect(pts[0]!.dir).toBeCloseTo(0, 5); // heading north = 0
  });
});
