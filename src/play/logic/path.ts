/**
 * PATHFINDING (pure): a grid A* over a scene's colliders so the objective trail can lead the player AROUND walls and furniture and through
 * the right doorway, instead of a straight line through a wall. Grid cells are 0.5 m; obstacles are inflated by the player's radius.
 */
import type { Collider, SceneDef } from './sceneTypes';

export interface PathGrid { cell: number; minX: number; minZ: number; w: number; h: number; blocked: Uint8Array }
export type P2 = { x: number; z: number };

export function buildGrid(bounds: SceneDef['bounds'], colliders: readonly Collider[], radius = 0.45, cell = 0.5): PathGrid {
  const w = Math.ceil((bounds.maxX - bounds.minX) / cell), h = Math.ceil((bounds.maxZ - bounds.minZ) / cell);
  const blocked = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = bounds.minX + (i + 0.5) * cell, z = bounds.minZ + (j + 0.5) * cell;
    let b = x < bounds.minX + radius || x > bounds.maxX - radius || z < bounds.minZ + radius || z > bounds.maxZ - radius;
    for (let k = 0; !b && k < colliders.length; k++) {
      const c = colliders[k]!;
      b = c.kind === 'circle' ? Math.hypot(x - c.x, z - c.z) <= c.r + radius : Math.abs(x - c.x) <= c.w / 2 + radius && Math.abs(z - c.z) <= c.d / 2 + radius;
    }
    blocked[j * w + i] = b ? 1 : 0;
  }
  return { cell, minX: bounds.minX, minZ: bounds.minZ, w, h, blocked };
}

const cellOf = (g: PathGrid, p: P2): [number, number] => [Math.max(0, Math.min(g.w - 1, Math.floor((p.x - g.minX) / g.cell))), Math.max(0, Math.min(g.h - 1, Math.floor((p.z - g.minZ) / g.cell)))];
const centre = (g: PathGrid, i: number, j: number): P2 => ({ x: g.minX + (i + 0.5) * g.cell, z: g.minZ + (j + 0.5) * g.cell });
const free = (g: PathGrid, i: number, j: number) => i >= 0 && j >= 0 && i < g.w && j < g.h && !g.blocked[j * g.w + i];

/** The nearest walkable cell to a point (the goal is often a console, which is itself solid). */
function nearestFree(g: PathGrid, p: P2): [number, number] | null {
  const [ci, cj] = cellOf(g, p);
  if (free(g, ci, cj)) return [ci, cj];
  for (let r = 1; r < 14; r++) {
    let best: [number, number] | null = null, bd = Infinity;
    for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
      if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r || !free(g, i, j)) continue;
      const c = centre(g, i, j), d = Math.hypot(c.x - p.x, c.z - p.z);
      if (d < bd) { bd = d; best = [i, j]; }
    }
    if (best) return best;
  }
  return null;
}

class Heap { private a: [number, number][] = [];
  push(k: number, v: number) { const a = this.a; a.push([k, v]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p]![0] <= a[i]![0]) break; [a[p], a[i]] = [a[i]!, a[p]!]; i = p; } }
  pop(): number | undefined { const a = this.a; if (!a.length) return undefined; const top = a[0]!; const last = a.pop()!; if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l]![0] < a[m]![0]) m = l; if (r < a.length && a[r]![0] < a[m]![0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i]!, a[m]!]; i = m; } } return top[1]; }
  get size() { return this.a.length; } }

const lineClear = (g: PathGrid, a: P2, b: P2): boolean => {
  const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(d / (g.cell * 0.5)));
  for (let k = 0; k <= n; k++) { const [i, j] = cellOf(g, { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n }); if (!free(g, i, j)) return false; }
  return true;
};

/** A walkable polyline from `from` to `to` (smoothed), or null when the goal cannot be reached. */
export function findPath(g: PathGrid, from: P2, to: P2): P2[] | null {
  const s = nearestFree(g, from), t = nearestFree(g, to); if (!s || !t) return null;
  const W = g.w, start = s[1] * W + s[0], goal = t[1] * W + t[0];
  const gs = new Float32Array(g.w * g.h).fill(Infinity), prev = new Int32Array(g.w * g.h).fill(-1), closed = new Uint8Array(g.w * g.h);
  const heap = new Heap(); gs[start] = 0; heap.push(0, start);
  const hfn = (i: number) => { const x = i % W, y = (i / W) | 0; return Math.hypot(x - t[0], y - t[1]); };
  while (heap.size) {
    const cur = heap.pop()!; if (closed[cur]) continue; closed[cur] = 1;
    if (cur === goal) break;
    const cx = cur % W, cy = (cur / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy; if (!free(g, nx, ny)) continue;
      if (dx && dy && (!free(g, cx + dx, cy) || !free(g, cx, cy + dy))) continue; // no squeezing diagonally between two obstacles
      const ni = ny * W + nx, ng = gs[cur]! + (dx && dy ? 1.4142 : 1);
      if (ng < gs[ni]!) { gs[ni] = ng; prev[ni] = cur; heap.push(ng + hfn(ni), ni); }
    }
  }
  if (!closed[goal]) return null;
  const cells: P2[] = [];
  for (let c = goal; c !== -1; c = prev[c]!) cells.push(centre(g, c % W, (c / W) | 0));
  cells.reverse();
  const raw: P2[] = [from, ...cells.slice(1, -1), to];
  // string pulling: keep only the corners that are needed
  const out: P2[] = [raw[0]!]; let i = 0;
  while (i < raw.length - 1) { let j = raw.length - 1; while (j > i + 1 && !lineClear(g, raw[i]!, raw[j]!)) j--; out.push(raw[j]!); i = j; }
  return out;
}

export const pathLength = (pts: readonly P2[]): number => { let d = 0; for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.z - pts[i - 1]!.z); return d; };

/** Points every `step` metres along a polyline starting at `fromDist`, up to `maxDist` of it (the trail's dots). */
export function sampleAlong(pts: readonly P2[], step: number, fromDist: number, maxDist: number): { x: number; z: number; dir: number }[] {
  const out: { x: number; z: number; dir: number }[] = []; let acc = 0, next = fromDist;
  for (let i = 1; i < pts.length && next <= fromDist + maxDist; i++) {
    const a = pts[i - 1]!, b = pts[i]!, d = Math.hypot(b.x - a.x, b.z - a.z); if (d < 1e-6) continue;
    while (next <= acc + d && next <= fromDist + maxDist) { const k = (next - acc) / d; out.push({ x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, dir: Math.atan2(-(b.x - a.x), -(b.z - a.z)) }); next += step; }
    acc += d;
  }
  return out;
}
