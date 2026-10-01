import { describe, expect, it } from 'vitest';
import { centreLine, checkpoints, locate, REDLINE, startGrid } from './track';
import { aiLap, BASELINE, newCar, setupFrom, speedOf, stepCar, TUNED } from './vehicle';

const cl = centreLine(REDLINE);

describe('the circuit', () => {
  it('is a closed loop of a sensible length with the start line first', () => {
    expect(cl.length).toBeGreaterThan(600); expect(cl.length).toBeLessThan(1600);
    const a = cl.pts[0]!, z = cl.pts[cl.pts.length - 1]!;
    expect(Math.hypot(a.x - z.x, a.z - z.z)).toBeLessThan(6);
  });
  it('knows where asphalt, kerb and grass are', () => {
    const p = cl.pts[40]!;
    expect(locate(cl, p.x, p.z).surface).toBe('asphalt');
    const nx = Math.cos(p.heading), nz = -Math.sin(p.heading);
    expect(locate(cl, p.x + nx * (cl.width / 2 + 0.8), p.z + nz * (cl.width / 2 + 0.8)).surface).toBe('kerb');
    expect(locate(cl, p.x + nx * 40, p.z + nz * 40).surface).toBe('grass');
  });
  it('has six checkpoints starting at the line, and a grid behind the line facing along it', () => {
    const c = checkpoints(cl, 6); expect(c).toHaveLength(6); expect(c[0]).toBe(0);
    const g = startGrid(cl, 14); expect(Math.hypot(g.x - cl.pts[0]!.x, g.z - cl.pts[0]!.z)).toBeGreaterThan(8);
  });
});

describe('the car feels like its setup', () => {
  const drive = (setup = BASELINE, seconds = 4, d = { throttle: 1, brake: 0, steer: 0 }) => { const c = newCar(cl.pts[0]!.x, cl.pts[0]!.z, cl.pts[0]!.heading); for (let t = 0; t < seconds; t += 1 / 60) stepCar(c, d, setup, cl, 1 / 60, 0); return c; };
  it('accelerates, and a tuned car is quicker than the baseline', () => { expect(speedOf(drive())).toBeGreaterThan(20); expect(speedOf(drive(TUNED))).toBeGreaterThan(speedOf(drive(BASELINE))); });
  it('never exceeds its top speed', () => { expect(speedOf(drive(TUNED, 30))).toBeLessThan(62 * TUNED.top + 1); });
  it('weak brakes take longer to stop than tuned ones (and lock under hard braking)', () => {
    const stop = (setup: typeof BASELINE) => { const c = drive(setup, 6); const x0 = c.x, z0 = c.z; let t = 0; let slid = false; while (speedOf(c) > 1 && t < 15) { stepCar(c, { throttle: 0, brake: 1, steer: 0 }, setup, cl, 1 / 60, 0); slid ||= c.sliding; t += 1 / 60; } return { d: Math.hypot(c.x - x0, c.z - z0), slid }; };
    const weak = stop(setupFrom({ tyres: true, brakes: false, fuel: true, aero: false })), good = stop(TUNED);
    expect(weak.d).toBeGreaterThan(good.d);
    expect(weak.slid).toBe(true);
    expect(good.slid).toBe(false);
  });
  it('low grip slides: after a steering input the sideways speed dies away more slowly', () => {
    const lateral = (setup: typeof BASELINE) => { const c = drive(setup, 3); for (let t = 0; t < 0.8; t += 1 / 60) stepCar(c, { throttle: 0.5, brake: 0, steer: 1 }, setup, cl, 1 / 60, 0); const rx = Math.cos(c.heading), rz = -Math.sin(c.heading); return Math.abs(c.vx * rx + c.vz * rz); };
    expect(lateral(BASELINE)).toBeGreaterThan(lateral(TUNED));
  });
  it('the grass slows the car', () => {
    const c = drive(TUNED, 2); c.x += 300; // far off the track
    const before = speedOf(c); for (let t = 0; t < 2; t += 1 / 60) stepCar(c, { throttle: 1, brake: 0, steer: 0 }, TUNED, cl, 1 / 60, 0);
    expect(speedOf(c)).toBeLessThan(before);
  });
  it('the setup comes from what the player’s analysis did, one system at a time', () => {
    const none = setupFrom({ tyres: false, brakes: false, fuel: false, aero: false }), all = setupFrom({ tyres: true, brakes: true, fuel: true, aero: true });
    expect(none).toEqual(BASELINE); expect(all).toEqual(TUNED);
    expect(setupFrom({ tyres: true, brakes: false, fuel: false, aero: false }).grip).toBeGreaterThan(BASELINE.grip);
  });
  it('each step of analysis lowers the lap time, and the tuned car lap is at least 10% quicker (so the telemetry work is worth it)', () => {
    const t0 = aiLap(BASELINE, cl).time;
    const t1 = aiLap(setupFrom({ tyres: true, brakes: false, fuel: false, aero: false }), cl).time;
    const t2 = aiLap(setupFrom({ tyres: true, brakes: true, fuel: false, aero: false }), cl).time;
    const t3 = aiLap(TUNED, cl).time;
    expect(t1).toBeLessThan(t0); expect(t2).toBeLessThan(t1); expect(t3).toBeLessThanOrEqual(t2);
    expect(t3).toBeLessThan(t0 * 0.9);
    expect(aiLap(TUNED, cl).ok).toBe(true);
  });
});
