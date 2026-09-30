/**
 * THE CIRCUIT (pure): a closed loop described by control points, turned into a dense centre-line. Everything about the track (where the
 * asphalt is, how far along the lap a car is, the checkpoints) comes from this one description, so the mesh, the physics and the lap timer
 * cannot disagree.
 */
export interface TrackDef { points: [number, number][]; width: number }

/** Redline Raceway: a front straight heading east, a fast sweeper, a hairpin, a chicane and a long back straight. */
export const REDLINE: TrackDef = {
  width: 15,
  points: ([[-30, 40], [20, 40], [62, 38], [90, 22], [92, -6], [70, -30], [34, -40], [6, -30], [-8, -10], [-30, -2], [-56, -14], [-74, 4], [-70, 28], [-52, 38]] as [number, number][]).map(([x, z]) => [Math.round(x * 2.1), Math.round(z * 2.1)] as [number, number]),
};

export interface CentreLine { pts: { x: number; z: number; s: number; heading: number }[]; length: number; width: number }

/** Closed Catmull-Rom spline sampled every ~`step` metres. */
export function centreLine(def: TrackDef, step = 3): CentreLine {
  const P = def.points, n = P.length;
  const at = (i: number) => P[((i % n) + n) % n]!;
  const raw: { x: number; z: number }[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const m = Math.max(4, Math.ceil(seg / step));
    for (let k = 0; k < m; k++) {
      const t = k / m, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      raw.push({ x: f(p0[0], p1[0], p2[0], p3[0]), z: f(p0[1], p1[1], p2[1], p3[1]) });
    }
  }
  const pts: CentreLine['pts'] = [];
  let s = 0;
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i]!, b = raw[(i + 1) % raw.length]!;
    pts.push({ x: a.x, z: a.z, s, heading: Math.atan2(-(b.x - a.x), -(b.z - a.z)) });
    s += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return { pts, length: s, width: def.width };
}

export interface TrackPos {
  /** Index of the nearest centre-line point. */
  i: number;
  /** Distance from the centre-line (m). */
  off: number;
  /** Distance along the lap (m). */
  s: number;
  surface: 'asphalt' | 'kerb' | 'grass';
}

/** Where a point is relative to the track. `hint` (a previous index) makes the search local and fast. */
export function locate(cl: CentreLine, x: number, z: number, hint?: number): TrackPos {
  const n = cl.pts.length;
  let best = 0, bd = Infinity;
  const scan = (i: number) => { const p = cl.pts[((i % n) + n) % n]!; const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = ((i % n) + n) % n; } };
  if (hint === undefined) for (let i = 0; i < n; i++) scan(i); else for (let k = -14; k <= 14; k++) scan(hint + k);
  const off = Math.sqrt(bd), half = cl.width / 2;
  return { i: best, off, s: cl.pts[best]!.s, surface: off <= half ? 'asphalt' : off <= half + 1.6 ? 'kerb' : 'grass' };
}

/** Evenly spaced checkpoints (indices into the centre-line). The first is the start line. */
export const checkpoints = (cl: CentreLine, count = 6): number[] => Array.from({ length: count }, (_, k) => Math.floor((k * cl.pts.length) / count));

/** The start grid: a place on the start straight just behind the line, facing along the track. */
export function startGrid(cl: CentreLine, back = 10): { x: number; z: number; heading: number } {
  const n = cl.pts.length, i0 = 0, back_i = Math.round(back / (cl.length / n));
  const p = cl.pts[((i0 - back_i) % n + n) % n]!;
  return { x: p.x, z: p.z, heading: p.heading };
}
