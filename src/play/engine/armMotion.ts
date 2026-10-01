/**
 * INDUSTRIAL ARM MOTION (pure maths, no three.js): how a real six-axis-style arm moves, reduced to the three axes you can see (turret yaw,
 * shoulder, elbow) with the wrist held square so the tool points down.
 *
 *   - Moves are planned in JOINT space ("MoveJ"): every joint starts and stops together on a jerk-limited S-curve, and the move takes as long
 *     as the SLOWEST joint needs at its own speed limit. Big swings are slow and heavy, small ones quick; the tool path is a natural arc.
 *   - Careful approaches use a straight line in space ("MoveL") at a gentle tool speed: lowering onto a part, welding a seam.
 *   - Every joint has a travel limit. The turret cannot spin a full turn, the elbow cannot fold flat and the tool cannot go through the floor:
 *     a target outside what the arm can reach is clamped to the nearest pose it can, and `reachable` says so (content is tested for it).
 *   - Stops are not perfectly dead: a faint, quickly dying servo settle follows each move, and moves can `hold` (a mechanical pause: grasp
 *     closing, a weld taking, the controller waiting for a sensor).
 * The builder (arm.ts) only turns the angles this produces into rotations, so the motion is unit-tested without a renderer.
 */
export interface V3 { x: number; y: number; z: number }
export interface Pose { yaw: number; sh: number; el: number }

export interface ArmSpec {
  /** Link lengths (m), height of the shoulder axis above the base and length of the wrist-to-tool drop. */
  L1: number; L2: number; H: number; T: number;
  /** World position of the base axis. */
  base: { x: number; z: number };
  /** The direction the arm faces at rest (world yaw as atan2(-dz, dx)); yaw limits are measured from it. */
  facing: number;
  /** Travel limits in radians: yaw relative to `facing`, shoulder (up from horizontal), elbow (negative = folded). */
  limits: { yaw: [number, number]; sh: [number, number]; el: [number, number] };
  /** Joint speed limits (rad/s). */
  vmax: { yaw: number; sh: number; el: number };
  /** Tool speed for straight-line moves (m/s) and the lowest the tool may go (m). */
  vTool: number; floor: number;
}

export interface Move {
  kind: 'J' | 'L';
  to: V3;
  /** 1 = normal; below 1 is slower and gentler. */
  speed?: number;
  /** Seconds the arm waits (not moving) after arriving. */
  hold?: number;
  /** Called the moment the move starts / when it has finished and its hold has elapsed. */
  onStart?: () => void;
  onDone?: () => void;
}

export const DEFAULT_LIMITS: ArmSpec['limits'] = { yaw: [-2.6, 2.6], sh: [-0.45, 1.75], el: [-2.75, -0.12] };
export const DEFAULT_VMAX: ArmSpec['vmax'] = { yaw: 1.5, sh: 0.95, el: 1.2 };

/** Jerk-limited S-curve: zero speed and zero acceleration at both ends (a quintic smoothstep). */
export const sCurve = (k: number): number => { const t = Math.max(0, Math.min(1, k)); return t * t * t * (t * (t * 6 - 15) + 10); };
/** Peak speed of that curve relative to its average: used to turn "slowest joint at its speed limit" into a duration. */
const PEAK = 1.875;

const wrap = (a: number): number => { let r = a; while (r > Math.PI) r -= 2 * Math.PI; while (r < -Math.PI) r += 2 * Math.PI; return r; };
const clamp = (v: number, [lo, hi]: [number, number]): number => Math.max(lo, Math.min(hi, v));

export class ArmPlanner {
  q: Pose;
  /** Is the arm moving (or holding)? */
  get busy(): boolean { return this.cur !== null || this.queue.length > 0; }
  /** What is being asked and what the joints could actually do about it, for tests and content checks. */
  lastReachable = true;
  private queue: Move[] = [];
  private cur: { m: Move; from: Pose; to: Pose; fromP: V3; dur: number; t: number; holdLeft: number; started: boolean } | null = null;
  private settle = 0;
  /** Where the tool is now. */
  tool: V3;

  constructor(readonly spec: ArmSpec, home: V3) {
    this.q = this.ik(home).pose;
    this.tool = this.fk(this.q);
  }

  /** Joint angles that put the tool at `p` (clamped to what the arm can do). */
  ik(p: V3): { pose: Pose; reachable: boolean } {
    const s = this.spec;
    const dx = p.x - s.base.x, dz = p.z - s.base.z;
    const d0 = Math.hypot(dx, dz), d = Math.max(0.55, d0);
    const y = Math.max(s.floor, p.y);
    const h = y + s.T - s.H;
    const Dwant = Math.hypot(d, h), Dmax = s.L1 + s.L2 - 0.04, Dmin = Math.abs(s.L1 - s.L2) + 0.25;
    const D = Math.max(Dmin, Math.min(Dmax, Dwant));
    const cosG = (s.L1 * s.L1 + s.L2 * s.L2 - D * D) / (2 * s.L1 * s.L2), gam = Math.acos(Math.max(-1, Math.min(1, cosG)));
    const cosA = (s.L1 * s.L1 + D * D - s.L2 * s.L2) / (2 * s.L1 * D), alpha = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const yawWorld = d0 < 0.05 ? s.facing : Math.atan2(-dz, dx);
    const raw: Pose = { yaw: wrap(yawWorld - s.facing), sh: Math.atan2(h, d) + alpha, el: -(Math.PI - gam) };
    const pose: Pose = { yaw: clamp(raw.yaw, s.limits.yaw), sh: clamp(raw.sh, s.limits.sh), el: clamp(raw.el, s.limits.el) };
    const reachable = Math.abs(D - Dwant) < 0.02 && Math.abs(p.y - y) < 1e-6 && Math.abs(pose.yaw - raw.yaw) < 1e-6 && Math.abs(pose.sh - raw.sh) < 1e-6 && Math.abs(pose.el - raw.el) < 1e-6;
    return { pose, reachable };
  }

  /** Where the tool is for given joint angles. */
  fk(q: Pose): V3 {
    const s = this.spec, a = q.yaw + s.facing;
    const d = s.L1 * Math.cos(q.sh) + s.L2 * Math.cos(q.sh + q.el), h = s.L1 * Math.sin(q.sh) + s.L2 * Math.sin(q.sh + q.el);
    return { x: s.base.x + d * Math.cos(a), y: s.H + h - s.T, z: s.base.z - d * Math.sin(a) };
  }

  /** Is this target inside the arm's working envelope? */
  reachable(p: V3): boolean { return this.ik(p).reachable; }

  plan(m: Move): void { this.queue.push(m); }
  clear(): void { this.queue = []; this.cur = null; }

  /** Advance by dt seconds; returns the joint angles (including the faint settle after a stop). */
  update(dt: number): Pose {
    if (!this.cur && this.queue.length) {
      const m = this.queue.shift()!, sp = m.speed ?? 1;
      const { pose, reachable } = this.ik(m.to); this.lastReachable = reachable;
      let dur: number;
      if (m.kind === 'J') {
        const dy = Math.abs(pose.yaw - this.q.yaw) / this.spec.vmax.yaw, ds = Math.abs(pose.sh - this.q.sh) / this.spec.vmax.sh, de = Math.abs(pose.el - this.q.el) / this.spec.vmax.el;
        dur = Math.max(0.45, Math.max(dy, ds, de) * PEAK) / sp;
      } else {
        const dist = Math.hypot(m.to.x - this.tool.x, m.to.y - this.tool.y, m.to.z - this.tool.z);
        dur = Math.max(0.4, (dist / this.spec.vTool) * PEAK) / sp;
      }
      this.cur = { m, from: { ...this.q }, to: pose, fromP: { ...this.tool }, dur, t: 0, holdLeft: m.hold ?? 0, started: false };
    }
    const c = this.cur;
    if (c) {
      if (!c.started) { c.started = true; c.m.onStart?.(); }
      if (c.t < c.dur) {
        c.t = Math.min(c.dur, c.t + dt);
        const e = sCurve(c.t / c.dur);
        if (c.m.kind === 'J') this.q = { yaw: c.from.yaw + (c.to.yaw - c.from.yaw) * e, sh: c.from.sh + (c.to.sh - c.from.sh) * e, el: c.from.el + (c.to.el - c.from.el) * e };
        else this.q = this.ik({ x: c.fromP.x + (c.m.to.x - c.fromP.x) * e, y: c.fromP.y + (c.m.to.y - c.fromP.y) * e, z: c.fromP.z + (c.m.to.z - c.fromP.z) * e }).pose;
        this.tool = this.fk(this.q);
        if (c.t >= c.dur) this.settle = 0.0001;
      } else {
        c.holdLeft -= dt;
        if (c.holdLeft <= 0) { const done = c.m.onDone; this.cur = null; done?.(); }
      }
    }
    if (this.settle > 0) this.settle += dt;
    const w = this.settle > 0 ? 0.012 * Math.exp(-this.settle * 11) * Math.sin(this.settle * 34) : 0;
    if (this.settle > 0.7) this.settle = 0;
    return { yaw: this.q.yaw + w * 0.6, sh: this.q.sh + w, el: this.q.el - w * 0.8 };
  }
}
