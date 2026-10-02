import { describe, expect, it } from 'vitest';
import { crossing, newLapTimer, startLine, stepLapTimer, type LapEvent } from './lapTimer';
import { centreLine, checkpoints, locate, REDLINE } from './track';

const cl = centreLine(REDLINE), n = cl.pts.length, gates = checkpoints(cl, 6), line = startLine(cl);
const at = (i: number, off = 0) => { const p = cl.pts[((i % n) + n) % n]!; return { x: p.x + Math.cos(p.heading) * off, z: p.z - Math.sin(p.heading) * off }; };

/** Drive a list of centre-line indices through the timer, one step per point (3 m apart); returns every event. */
function run(path: number[], off = 0): { events: LapEvent[]; t: ReturnType<typeof newLapTimer> } {
  const t = newLapTimer(), events: LapEvent[] = [];
  let prev = at(path[0]!, off);
  path.forEach((i, k) => { const cur = at(i, off), here = locate(cl, cur.x, cur.z, ((i % n) + n) % n); events.push(...stepLapTimer(t, { line, gates, n, prev, cur, here, width: cl.width, clock: k * 0.1 })); prev = cur; });
  return { events, t };
}
const seq = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, k) => a + k);

describe('the start/finish line', () => {
  it('is square to the track at its first point and only exists across the asphalt', () => {
    expect(crossing(line, at(-1), at(1))).toBe('forward');
    expect(crossing(line, at(1), at(-1))).toBe('backward');
    expect(crossing(line, at(-1, 40), at(1, 40))).toBeNull(); // beside the track
  });
  it('sitting on the line, or moving along it, is not a crossing', () => {
    expect(crossing(line, at(0), at(0))).toBeNull();
    expect(crossing(line, at(2), at(4))).toBeNull();
  });
});

describe('the lap timer', () => {
  it('waits at 0 until the line is crossed, however long the car drives before it', () => {
    const { events, t } = run(seq(n - 40, n - 2));
    expect(events).toEqual([]); expect(t.phase).toBe('waiting');
  });
  it('starts the moment the line is crossed forwards, once', () => {
    const { events, t } = run(seq(n - 5, n + 5)); // through the line
    expect(events.filter((e) => e.type === 'start').length).toBe(1); expect(t.phase).toBe('running');
  });
  it('a full lap records a time when the line is crossed again, after every checkpoint', () => {
    const { events } = run(seq(n - 5, n + n + 3));
    expect(events.filter((e) => e.type === 'gate').length).toBe(5);
    const laps = events.filter((e) => e.type === 'lap'); expect(laps.length).toBe(1);
    expect((laps[0] as { ms: number }).ms).toBeGreaterThan(0);
  });
  it('rolling back over the line does not start or finish anything, and driving forwards again completes nothing early', () => {
    const { events } = run([n - 4, n - 1, 2, 4, 2, n - 1, n - 3, n - 1, 2, 5]); // over, back over, over again
    expect(events.filter((e) => e.type === 'start').length).toBe(1);
    expect(events.filter((e) => e.type === 'lap').length).toBe(0);
  });
  it('a reverse run over the line before starting does not start the timer', () => {
    const { events, t } = run([5, 3, 1, n - 1, n - 3]);
    expect(events).toEqual([]); expect(t.phase).toBe('waiting');
  });
  it('crossing the line without passing the checkpoints does not count as a lap (no shortcuts)', () => {
    const { events } = run([...seq(n - 4, n + 4), ...seq(5, 20), ...seq(n - 6, n + 3)]);
    expect(events.filter((e) => e.type === 'lap').length).toBe(0);
  });
  it('the next lap starts at once and the best time is kept', () => {
    const { events, t } = run(seq(n - 5, n + n + n + 3));
    expect(events.filter((e) => e.type === 'lap').length).toBe(2); expect(t.lap).toBe(2); expect(t.best).not.toBeNull();
  });
});
