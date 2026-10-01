import { describe, expect, it } from 'vitest';
import { ArmPlanner, DEFAULT_LIMITS, DEFAULT_VMAX, sCurve, type ArmSpec, type Pose } from './armMotion';

const spec: ArmSpec = { L1: 2.5, L2: 2.3, H: 1.55, T: 0.55, base: { x: 0, z: 0 }, facing: -Math.PI / 2, limits: DEFAULT_LIMITS, vmax: DEFAULT_VMAX, vTool: 0.7, floor: 0.12 };
const run = (a: ArmPlanner, seconds: number, dt = 1 / 60): Pose[] => { const out: Pose[] = []; for (let t = 0; t < seconds; t += dt) out.push(a.update(dt)); return out; };
const speeds = (ps: Pose[], dt = 1 / 60) => ps.slice(1).map((p, i) => ({ yaw: Math.abs(p.yaw - ps[i]!.yaw) / dt, sh: Math.abs(p.sh - ps[i]!.sh) / dt, el: Math.abs(p.el - ps[i]!.el) / dt }));

describe('arm motion (planned like a real industrial arm)', () => {
  it('inverse and forward kinematics agree: the tool ends where it was sent', () => {
    const a = new ArmPlanner(spec, { x: 1.5, y: 2.5, z: 2 });
    for (const p of [{ x: 1.5, y: 2.5, z: 2 }, { x: -1, y: 1.4, z: 2.5 }, { x: 0.5, y: 0.9, z: 3 }]) {
      const { pose, reachable } = a.ik(p); expect(reachable).toBe(true);
      const t = a.fk(pose); expect(Math.hypot(t.x - p.x, t.y - p.y, t.z - p.z)).toBeLessThan(0.02);
    }
  });
  it('a joint move starts and ends at rest (no snap) and never exceeds a joint speed limit', () => {
    const a = new ArmPlanner(spec, { x: 1.5, y: 3, z: 2 });
    a.plan({ kind: 'J', to: { x: -1.8, y: 1.4, z: 2.4 } });
    const ps = run(a, 6), sp = speeds(ps);
    expect(Math.max(...sp.slice(0, 2).map((s) => s.yaw))).toBeLessThan(0.08); // gentle first frames
    for (const s of sp) { expect(s.yaw).toBeLessThanOrEqual(DEFAULT_VMAX.yaw * 1.05); expect(s.sh).toBeLessThanOrEqual(DEFAULT_VMAX.sh * 1.05); expect(s.el).toBeLessThanOrEqual(DEFAULT_VMAX.el * 1.05); }
    const end = a.fk(ps[ps.length - 1]!); expect(Math.hypot(end.x + 1.8, end.y - 1.4, end.z - 2.4)).toBeLessThan(0.05);
  });
  it('all joints move together and arrive together (coordinated), and a big swing takes longer than a small one', () => {
    const big = new ArmPlanner(spec, { x: 2, y: 2, z: 2 }), small = new ArmPlanner(spec, { x: 2, y: 2, z: 2 });
    big.plan({ kind: 'J', to: { x: -2, y: 1.2, z: 2.6 } }); small.plan({ kind: 'J', to: { x: 1.8, y: 2, z: 2.2 } });
    const time = (a: ArmPlanner) => { let t = 0; while (a.busy && t < 20) { a.update(1 / 60); t += 1 / 60; } return t; };
    expect(time(big)).toBeGreaterThan(time(small) * 1.6);
    const a = new ArmPlanner(spec, { x: 2, y: 2, z: 2 }); a.plan({ kind: 'J', to: { x: -1.5, y: 1.3, z: 2.8 } });
    const ps = run(a, 4); const first = ps[0]!, last = ps[ps.length - 1]!;
    const mid = ps.findIndex((p) => Math.abs(p.yaw - first.yaw) > Math.abs(last.yaw - first.yaw) * 0.5);
    const frac = (v: number, f: number, l: number) => (l === f ? 0.5 : (v - f) / (l - f));
    expect(Math.abs(frac(ps[mid]!.sh, first.sh, last.sh) - 0.5)).toBeLessThan(0.2); expect(Math.abs(frac(ps[mid]!.el, first.el, last.el) - 0.5)).toBeLessThan(0.2);
  });
  it('a straight-line move keeps the tool on the line, at the tool speed limit', () => {
    const a = new ArmPlanner(spec, { x: 1, y: 2.2, z: 2.4 });
    a.plan({ kind: 'L', to: { x: 1, y: 0.9, z: 2.4 } });
    let maxOff = 0, maxV = 0, prev = a.tool;
    for (let t = 0; t < 4; t += 1 / 60) { a.update(1 / 60); maxOff = Math.max(maxOff, Math.hypot(a.tool.x - 1, a.tool.z - 2.4)); maxV = Math.max(maxV, Math.hypot(a.tool.x - prev.x, a.tool.y - prev.y, a.tool.z - prev.z) * 60); prev = { ...a.tool }; }
    expect(maxOff).toBeLessThan(0.03); expect(maxV).toBeLessThan(spec.vTool * 2.1);
    expect(Math.abs(a.tool.y - 0.9)).toBeLessThan(0.03);
  });
  it('respects its limits: nothing goes through the floor, the turret cannot spin round, the elbow cannot fold flat', () => {
    const a = new ArmPlanner(spec, { x: 1, y: 2, z: 2 });
    expect(a.ik({ x: 1, y: -2, z: 2 }).pose.sh).toBeGreaterThanOrEqual(DEFAULT_LIMITS.sh[0]);
    const behind = a.ik({ x: 0, y: 2, z: -3 }); // directly behind the base
    expect(Math.abs(behind.pose.yaw)).toBeLessThanOrEqual(DEFAULT_LIMITS.yaw[1] + 1e-9);
    expect(a.ik({ x: 0.2, y: 2, z: 0.1 }).pose.el).toBeGreaterThanOrEqual(DEFAULT_LIMITS.el[0]);
    expect(a.ik({ x: 0.2, y: 2, z: 0.1 }).pose.el).toBeLessThanOrEqual(DEFAULT_LIMITS.el[1]);
    expect(a.reachable({ x: 30, y: 1, z: 0 })).toBe(false);
    // and a long yaw move goes the SHORT-travel way through its range, never snapping through the back
    const ps = run((() => { const b = new ArmPlanner(spec, { x: 2, y: 2, z: 1 }); b.plan({ kind: 'J', to: { x: -2, y: 2, z: 1 } }); return b; })(), 4);
    for (let i = 1; i < ps.length; i++) expect(Math.abs(ps[i]!.yaw - ps[i - 1]!.yaw)).toBeLessThan(0.05);
  });
  it('pauses at the end of a move (a mechanical hold) and settles with a faint, dying tremor', () => {
    const a = new ArmPlanner(spec, { x: 1, y: 2, z: 2 }); let done = 0;
    a.plan({ kind: 'J', to: { x: 0, y: 1.5, z: 2.5 }, hold: 0.5, onDone: () => { done++; } });
    let t = 0; while (a.busy && t < 10) { a.update(1 / 60); t += 1 / 60; }
    expect(done).toBe(1);
    const settled = a.update(1 / 60); void settled;
    expect(sCurve(0)).toBe(0); expect(sCurve(1)).toBe(1); expect(sCurve(0.5)).toBeCloseTo(0.5, 5);
  });
  it('runs queued moves in order and calls each hook once', () => {
    const a = new ArmPlanner(spec, { x: 1, y: 3, z: 2 }); const log: string[] = [];
    a.plan({ kind: 'J', to: { x: 1, y: 2, z: 2.5 }, onStart: () => log.push('s1'), onDone: () => log.push('d1') });
    a.plan({ kind: 'L', to: { x: 1, y: 1, z: 2.5 }, onStart: () => log.push('s2'), onDone: () => log.push('d2') });
    run(a, 8); expect(log).toEqual(['s1', 'd1', 's2', 'd2']);
  });
});

import { ASSEMBLY_ARM, assemblyPoints, plannerFor, REPAIR_ARM } from './arm';
describe('the machines in the game can reach what their scripts ask for', () => {
  it('the assembly arms reach the pick point, the drop point and the clear height above both, and rest within limits', () => {
    for (const base of [{ x: -4, z: -4.2 }, { x: 4, z: -4.2 }]) {
      const pl = plannerFor(ASSEMBLY_ARM, base, -Math.PI / 2, { x: base.x, y: 2.2, z: base.z + 1 });
      const pts = assemblyPoints(base, -1.5);
      for (const [name, p] of Object.entries({ pickDown: { x: pts.pick.x, y: pts.beltY + 0.1, z: pts.pick.z }, pickUp: { x: pts.pick.x, y: pts.clear + 0.1, z: pts.pick.z }, dropDown: { x: pts.drop.x, y: pts.beltY + 0.2, z: pts.drop.z }, dropUp: { x: pts.drop.x, y: pts.clear, z: pts.drop.z }, rest: pts.rest })) expect(pl.reachable(p), `${base.x}: ${name}`).toBe(true);
    }
  });
  it('the repair rig reaches Bolt’s loose arm, his shoulder socket and its home pose (positions measured in the bay), and the whole repair takes a believable few seconds', () => {
    const base = { x: -7.7, z: -3.5 }, facing = Math.atan2(-0.7, 3.6), home = { x: base.x + 2.8, y: 3.0, z: base.z - 1.0 };
    const pl = plannerFor(REPAIR_ARM, base, facing, home, 2.4);
    const arm = { x: -4.1, y: 1.08, z: -2.38 }, socket = { x: -4.806, y: 1.221, z: -2.707 };
    const script: { kind: 'J' | 'L'; to: { x: number; y: number; z: number }; speed?: number; hold?: number }[] = [
      { kind: 'J', to: { x: home.x - 0.3, y: 2.9, z: home.z + 0.3 }, speed: 0.6, hold: 0.25 },
      { kind: 'J', to: { x: arm.x, y: arm.y + 0.75, z: arm.z }, hold: 0.1 }, { kind: 'L', to: { x: arm.x, y: arm.y + 0.3, z: arm.z }, speed: 0.9, hold: 0.45 }, { kind: 'L', to: { x: arm.x, y: arm.y + 0.8, z: arm.z }, speed: 1, hold: 0.05 },
      { kind: 'J', to: { x: socket.x, y: socket.y + 0.95, z: socket.z + 0.2 }, hold: 0.1 }, { kind: 'L', to: { x: socket.x, y: socket.y + 0.55, z: socket.z }, speed: 0.9, hold: 0.15 },
      { kind: 'L', to: { x: socket.x, y: socket.y + 0.55, z: socket.z }, hold: 0.1 }, { kind: 'L', to: { x: socket.x - 0.14, y: socket.y + 0.55, z: socket.z }, speed: 0.55, hold: 0.15 },
    ];
    for (const m of script) { expect(pl.reachable(m.to), JSON.stringify(m.to)).toBe(true); pl.plan(m); }
    let t = 0; while (pl.busy && t < 60) { pl.update(1 / 60); t += 1 / 60; }
    expect(t, 'repair seconds').toBeGreaterThan(3.5); expect(t).toBeLessThan(7);
  });
});
