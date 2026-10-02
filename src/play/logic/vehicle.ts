/**
 * THE CAR (pure): a small arcade model with the properties a driver can FEEL: grip (how much it slides), braking, acceleration, top speed and
 * aero (extra grip at speed). The setup comes from what the player's code did to the car (see `setupFrom`): a poor setup really does slide,
 * lock its wheels and lose time, and a good one really is easier and faster. No number here is decoration.
 */
import { locate, type CentreLine } from './track';

export interface Setup { grip: number; brake: number; accel: number; top: number; aero: number }

/** The setup a car has before any analysis: tyres too hard, brakes that lock, a heavy fuel load. Each analysed system improves one part. */
export const BASELINE: Setup = { grip: 0.62, brake: 0.55, accel: 0.82, top: 0.88, aero: 0 };
export const TUNED: Setup = { grip: 1.0, brake: 1.0, accel: 1.06, top: 1.06, aero: 1.0 };

/** The setup that results from the effects the player's code has caused. */
export function setupFrom(done: { tyres: boolean; brakes: boolean; fuel: boolean; aero: boolean }): Setup {
  return {
    grip: done.tyres ? TUNED.grip : BASELINE.grip,
    brake: done.brakes ? TUNED.brake : BASELINE.brake,
    accel: done.fuel ? TUNED.accel : BASELINE.accel,
    top: done.fuel ? TUNED.top : BASELINE.top,
    aero: done.aero ? TUNED.aero : BASELINE.aero,
  };
}

export interface Car {
  x: number; z: number;
  /** Heading in radians (0 = north, -z). */
  heading: number;
  /** Velocity in the world. */
  vx: number; vz: number;
  /** Steering angle actually applied (smoothed), -1..1. */
  steer: number;
  /** True while the wheels are locked or sliding hard (for tyre smoke and sound). */
  sliding: boolean;
}
/** `reverse` is the driver asking to go backwards (the S key): it brakes while the car is still rolling forward, and only once nearly stopped does it drive the car backwards. */
export interface Driving { throttle: number; brake: number; steer: number; reverse?: number }

const MAX_SPEED = 62; // m/s at top = 1
const ACC = 15, BRAKE = 34, DRAG = 0.05, YAW = 1.9;
/** Reverse is a slow, heavy gear: it takes a moment to get going and tops out well below a walking-pace corner. */
const REV_ACC = 7.5, REV_TOP = 13, ROLL = 1.2;

export const newCar = (x: number, z: number, heading: number): Car => ({ x, z, heading, vx: 0, vz: 0, steer: 0, sliding: false });
export const speedOf = (c: Car): number => Math.hypot(c.vx, c.vz);

/** One physics step. Mutates and returns the car. */
export function stepCar(c: Car, d: Driving, setup: Setup, cl: CentreLine, dt: number, hint?: number): Car {
  const fx = -Math.sin(c.heading), fz = -Math.cos(c.heading);
  const rx = Math.cos(c.heading), rz = -Math.sin(c.heading);
  let vf = c.vx * fx + c.vz * fz, vl = c.vx * rx + c.vz * rz;
  const pos = locate(cl, c.x, c.z, hint);
  const grass = pos.surface === 'grass';
  const top = MAX_SPEED * setup.top * (grass ? 0.55 : 1);
  // engine and brakes
  if (d.throttle > 0) {
    // rolling backwards: the engine brakes the car to a stop first, it does not snap into drive
    if (vf < -ROLL) vf = Math.min(0, vf + BRAKE * (0.45 + 0.55 * setup.brake) * d.throttle * dt);
    else vf += ACC * setup.accel * d.throttle * Math.max(0, 1 - vf / top) * dt * 2.2;
  }
  let gripK = (4 + 9 * setup.grip) * (1 + setup.aero * Math.min(1, Math.abs(vf) / 40) * 0.6) * (grass ? 0.45 : 1);
  c.sliding = false;
  if (d.brake > 0) {
    const f = BRAKE * (0.45 + 0.55 * setup.brake) * d.brake;
    // weak brakes LOCK under hard braking: the wheels stop gripping sideways and the stopping distance grows
    if (d.brake > 0.75 && setup.brake < 0.8 && Math.abs(vf) > 12) { gripK *= 0.35; c.sliding = true; }
    if (vf > 0) vf -= Math.min(vf, f * dt); else if (!(d.reverse && d.throttle === 0)) vf += Math.min(-vf, f * dt);
  }
  // reverse gear: only from (nearly) a standstill, with the existing acceleration feel, a low top speed, slower still on grass
  if (d.reverse && d.reverse > 0 && d.throttle === 0 && vf <= ROLL) vf -= REV_ACC * Math.min(1, setup.accel) * d.reverse * Math.max(0, 1 - -vf / (REV_TOP * (grass ? 0.6 : 1))) * dt;
  vf -= vf * DRAG * dt * (grass ? 4 : 1) + (d.throttle === 0 && d.brake === 0 ? Math.sign(vf) * Math.min(Math.abs(vf), 2.5 * dt) : 0);
  // the engine and brakes act along the OLD heading; the world velocity is rebuilt from them
  c.vx = fx * vf + rx * vl; c.vz = fz * vf + rz * vl;
  // steering turns the car (authority grows with speed, then fades so a fast car cannot turn on the spot)
  const target = d.steer;
  c.steer += (target - c.steer) * Math.min(1, 9 * dt);
  const authority = Math.min(1, Math.abs(vf) / 7) * (1 / (1 + (Math.abs(vf) / top) * 0.9));
  c.heading -= c.steer * YAW * authority * Math.sign(vf || 1) * dt * (0.55 + 0.45 * Math.min(1, setup.grip + setup.aero * 0.3));
  // the car now points somewhere new but is still MOVING the old way: the difference is sideways slip, and grip is what removes it.
  const nfx = -Math.sin(c.heading), nfz = -Math.cos(c.heading), nrx = Math.cos(c.heading), nrz = -Math.sin(c.heading);
  let vf2 = c.vx * nfx + c.vz * nfz, vl2 = c.vx * nrx + c.vz * nrz;
  if (Math.abs(vl2) > 7 && !grass) c.sliding = true;
  vl2 -= vl2 * Math.min(1, gripK * dt);
  c.vx = nfx * vf2 + nrx * vl2; c.vz = nfz * vf2 + nrz * vl2;
  c.x += c.vx * dt; c.z += c.vz * dt;
  return c;
}

/** What a simple driver does this instant: follow the centre-line, slow for corners (setup grip and brakes decide how fast a corner can be taken). */
export function aiDrive(car: Car, cl: CentreLine, setup: Setup, hint: number): { throttle: number; brake: number; steer: number; here: ReturnType<typeof locate> } {
  const N = cl.pts.length, step = cl.length / N;
  const here = locate(cl, car.x, car.z, hint);
  const speed = speedOf(car);
  const ahead = cl.pts[(here.i + Math.max(3, Math.round((speed * 0.4) / step))) % N]!;
  const want = Math.atan2(-(ahead.x - car.x), -(ahead.z - car.z));
  let err = want - car.heading; while (err > Math.PI) err -= 2 * Math.PI; while (err < -Math.PI) err += 2 * Math.PI;
  const steer = Math.max(-1, Math.min(1, -err * 1.7));
  const far = cl.pts[(here.i + Math.round((14 + speed * 1.5) / step)) % N]!;
  let bend = far.heading - cl.pts[here.i]!.heading; while (bend > Math.PI) bend -= 2 * Math.PI; while (bend < -Math.PI) bend += 2 * Math.PI;
  const cornerSpeed = Math.max(13, 50 * (1 - Math.min(0.78, Math.abs(bend) * 0.95)) * (0.45 + 0.55 * setup.grip) * (0.8 + 0.2 * setup.brake));
  return { throttle: speed < cornerSpeed ? 1 : 0, brake: speed > cornerSpeed + 3 ? Math.min(1, (speed - cornerSpeed) / 14) : 0, steer, here };
}

/** A standing-start lap by the driver AI: the par time, tests, and the lap shown in the replay. */
export function aiLap(setup: Setup, cl: CentreLine, maxSeconds = 240): { time: number; ok: boolean } {
  const N = cl.pts.length;
  const p0 = cl.pts[0]!;
  const car = newCar(p0.x, p0.z, p0.heading);
  let hint = 0, t = 0, late = false, worst = 0;
  const dt = 1 / 60;
  while (t < maxSeconds) {
    const d = aiDrive(car, cl, setup, hint); hint = d.here.i;
    worst = Math.max(worst, d.here.off);
    stepCar(car, { throttle: d.throttle, brake: d.brake, steer: d.steer }, setup, cl, dt, hint);
    t += dt;
    if (d.here.i > N * 0.8) late = true;
    if (late && d.here.i < N * 0.1) return { time: t, ok: worst < cl.width };
  }
  return { time: maxSeconds, ok: false };
}
