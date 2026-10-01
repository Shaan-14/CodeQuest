/**
 * THE SHAPE OF THE BALLPARK (pure): one place that says where the fence runs, so the drawn wall, the painted warning track, the invisible
 * colliders and the simulated ball's flight all agree. Real parks are not circles: the foul lines are short and straightaway centre is
 * deep. Distances are in metres at the game's scale (a base path is 14 m; a real one is 27.4 m, so everything is about half life size and in
 * the same proportion: the mound is 0.67 of a base path from home, the infield dirt is a circle round the mound).
 */
export const HOME = { x: 0, z: 6 };
export const BASE_PATH = 14;
export const FOUL_ANGLE = Math.PI / 4;
/** Distance from home plate to the outfield wall at angle `theta` (0 = straightaway centre, ± FOUL_ANGLE = the foul poles). */
export const fenceRadius = (theta: number): number => 44 + 8 * Math.cos(2 * theta);
/** Points of the wall from the left pole to the right pole, relative to home plate, about `step` metres apart. */
export function fencePoints(step = 2, inset = 0): { x: number; z: number; theta: number }[] {
  const out: { x: number; z: number; theta: number }[] = [];
  let theta = -FOUL_ANGLE;
  while (theta < FOUL_ANGLE + 1e-6) {
    const r = fenceRadius(theta) - inset;
    out.push({ x: Math.sin(theta) * r, z: -Math.cos(theta) * r, theta });
    theta += step / fenceRadius(theta);
  }
  return out;
}
/** Evenly spaced points on a segment (for chains of round colliders). */
export function chain(x1: number, z1: number, x2: number, z2: number, step = 1.5): { x: number; z: number }[] {
  const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, z2 - z1) / step));
  return Array.from({ length: n + 1 }, (_, i) => ({ x: x1 + ((x2 - x1) * i) / n, z: z1 + ((z2 - z1) * i) / n }));
}
