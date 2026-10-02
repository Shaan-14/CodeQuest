/**
 * THE LAP TIMER (pure): a lap starts when the car actually CROSSES the start/finish line going the right way, and is recorded when it crosses
 * again after passing every checkpoint in order. The line is the track's own geometry (the first centre-line point and its heading, as wide as
 * the asphalt), not a distance or a clock. Sitting on the line, rolling back over it, or crossing it the wrong way never counts.
 */
import type { CentreLine } from './track';

export interface LapTimer {
  /** `waiting` until the line is crossed; then `running`. */
  phase: 'waiting' | 'running';
  /** The next checkpoint (1..gates-1) the car must pass before the line completes the lap. */
  next: number;
  lap: number;
  /** Clock time the current lap started. */
  startedAt: number;
  best: number | null;
}
export type LapEvent = { type: 'start' } | { type: 'gate'; n: number } | { type: 'lap'; ms: number; lap: number };

export const newLapTimer = (): LapTimer => ({ phase: 'waiting', next: 1, lap: 0, startedAt: 0, best: null });

export interface Line { x: number; z: number; fx: number; fz: number; rx: number; rz: number; half: number }
/** The start/finish line: through the first centre-line point, square to the track, as wide as the asphalt plus its kerbs. */
export function startLine(cl: CentreLine): Line {
  const p = cl.pts[0]!, fx = -Math.sin(p.heading), fz = -Math.cos(p.heading);
  return { x: p.x, z: p.z, fx, fz, rx: Math.cos(p.heading), rz: -Math.sin(p.heading), half: cl.width / 2 + 1.6 };
}

/** Did the step a→b cross the line? `forward` goes the way the track runs, `backward` against it; sliding along it or sitting on it is neither. */
export function crossing(line: Line, a: { x: number; z: number }, b: { x: number; z: number }): 'forward' | 'backward' | null {
  const d0 = (a.x - line.x) * line.fx + (a.z - line.z) * line.fz, d1 = (b.x - line.x) * line.fx + (b.z - line.z) * line.fz;
  const fwd = d0 < 0 && d1 >= 0, back = d0 >= 0 && d1 < 0;
  if (!fwd && !back) return null;
  const k = d0 / (d0 - d1), cx = a.x + (b.x - a.x) * k, cz = a.z + (b.z - a.z) * k;
  if (Math.abs((cx - line.x) * line.rx + (cz - line.z) * line.rz) > line.half) return null; // the line only exists across the track
  return fwd ? 'forward' : 'backward';
}

/** Is centre-line index `i` within a few points of checkpoint `idx` (circular)? */
export const nearIndex = (i: number, idx: number, n: number, within = 4): boolean => { const d = Math.abs(i - idx); return Math.min(d, n - d) <= within; };

/**
 * Advance the timer by one physics step. `gates` are centre-line indices (gate 0 is the start line, which is handled by the crossing instead);
 * `here` is the car's nearest centre-line index and its distance off it; `clock` is seconds since driving began. Mutates the timer.
 */
export function stepLapTimer(t: LapTimer, o: { line: Line; gates: readonly number[]; n: number; prev: { x: number; z: number }; cur: { x: number; z: number }; here: { i: number; off: number }; width: number; clock: number }): LapEvent[] {
  const ev: LapEvent[] = [];
  const cross = crossing(o.line, o.prev, o.cur);
  if (t.phase === 'waiting') {
    if (cross === 'forward') { t.phase = 'running'; t.startedAt = o.clock; t.next = 1; ev.push({ type: 'start' }); }
    return ev;
  }
  if (t.next < o.gates.length && nearIndex(o.here.i, o.gates[t.next]!, o.n) && o.here.off < o.width) { ev.push({ type: 'gate', n: t.next }); t.next++; }
  if (cross === 'forward' && t.next >= o.gates.length) {
    const ms = Math.round((o.clock - t.startedAt) * 1000); t.lap++; t.startedAt = o.clock; t.next = 1;
    if (t.best === null || ms < t.best) t.best = ms;
    ev.push({ type: 'lap', ms, lap: t.lap });
  }
  return ev;
}
