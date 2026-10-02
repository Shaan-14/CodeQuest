/**
 * THE REPLAY LAP: a cutscene in which the car drives a whole lap by itself, with the SETUP the player's analysis produced, under a director's
 * camera (chase, trackside, helicopter, nose) and the crew chief's commentary. It is the real vehicle simulation with the driver AI at the wheel,
 * so the lap time is the one that setup earns: the player watches their spreadsheet go round a circuit.
 */
import type { Group } from 'three';
import { centreLine, locate, REDLINE, startGrid } from '../logic/track';
import { aiDrive, newCar, speedOf, stepCar, type Setup } from '../logic/vehicle';
import { builders } from './builders';
import type { Stage } from './stage';

export interface DemoResult { ms: number | null; cancelled: boolean }
export interface DemoHooks {
  /** Car states earned by the player's code (tyres, brakes, fuel, aero): the car looks and sounds the part, and the commentary mentions them. */
  states: string[];
  onEnd(r: DemoResult): void;
}

const SHOTS = ['chase', 'side', 'front', 'heli', 'trackside'] as const;

/** `from`/`to` (fractions of the lap) run just a SECTION, the car already up to speed at `from` (the same physics and driver, run ahead out of sight). `embedded`: a cinematic owns the controls, the player and the letterbox. */
export interface DemoSection { from?: number; to?: number; embedded?: boolean }

export function startDemoLap(stage: Stage, setup: Setup, hooks: DemoHooks, section: DemoSection = {}): () => void {
  const cl = centreLine(REDLINE), N = cl.pts.length;
  const grid = startGrid(cl, 14);
  const built = builders.car!({ kind: 'car', x: grid.x, z: grid.z, p: { number: '7' } }, stage.buildCtx);
  const obj = built.object as Group; stage.worldGroup.add(obj);
  for (const s of hooks.states) built.dyn?.setState(s, true);
  obj.position.set(grid.x, 0, grid.z); obj.rotation.y = grid.heading;
  const embedded = !!section.embedded;
  if (!embedded) { stage.setPlayerVisible(false); stage.setControlLocked(true); }
  const car = newCar(grid.x, grid.z, grid.heading);
  if (!embedded) stage.director.show({ active: true, canSkip: true, subtitle: null, banner: null });
  stage.camRate = 5;

  let hint = locate(cl, car.x, car.z).i, t = 0, lapT = 0, going = false, late = false, shot = 0, shotT = 0, ended = false, worst = 0;
  let fixed: { x: number; z: number } | null = null; let said = 0, smoke = 0;
  // a section that starts mid-lap: drive the lap out of sight until the car gets there, so it arrives at speed with the same setup
  let secStart = 0, crossed = false;
  /** Progress round the lap as a fraction, negative on the grid (just behind the line) until the car crosses it. */
  const prog = (i: number): number => { const f = i / N; if (!crossed && f > 0.9) return f - 1; crossed = true; return f; };
  if (section.from) {
    for (let n = 0; n < 9000 && prog(hint) < section.from; n++) { const d0 = aiDrive(car, cl, setup, hint); hint = d0.here.i; stepCar(car, { throttle: d0.throttle, brake: d0.brake, steer: d0.steer }, setup, cl, 1 / 60, hint); lapT += 1 / 60; }
    going = true; t = 3.1; secStart = lapT; said = 4;
  }
  const say = (text: string, ms = 3.4) => { if (embedded) return; stage.director.show({ subtitle: { who: 'Crew Chief Marisol', text } }); window.setTimeout(() => stage.director.show({ subtitle: null }), ms * 1000); };
  const has = (k: string) => hooks.states.includes(k);
  // commentary: what the lap is showing, by how far round the car is (never an answer; only what the setup visibly does)
  const lines: { at: number; text: string }[] = [
    { at: 0.04, text: has('tyres') ? 'Fresh rubber at the pressures your data found. Watch how it bites.' : 'Stock tyres. Let us see how far they get us.' },
    { at: 0.24, text: has('aero') ? 'The big wing is working: look how flat it stays through the sweeper.' : 'Standard wings. It will be a handful in the fast bend.' },
    { at: 0.45, text: has('brakes') ? 'Late on the brakes into the hairpin, and it stays straight. Balanced discs.' : 'Braking early here: the stock brakes will not forgive anything later.' },
    { at: 0.68, text: has('fuel') ? 'Just enough fuel and not a gram more: that is where the tenths come from.' : 'Full tank, extra weight: you can feel it in the corners.' },
    { at: 0.9, text: 'Last corner, then the line. This is your setup, on a real circuit.' },
  ];

  const frame = (dt: number) => {
    if (ended) return;
    if (stage.input.wasPressed(' ', 'e', 'f', 'Escape')) { finish(null, true); return; }
    t += dt;
    if (!going) {
      // lights: three red, then green and go
      const k = Math.floor(t / 0.9);
      if (k !== said && k <= 3) { said = k; if (k < 3) stage.audio.sfx('click'); else { stage.audio.sfx('whoosh'); say('Lights out!', 1.6); } }
      if (t >= 3.0) { going = true; lapT = 0; }
    }
    // the car: the driver AI at the wheel, the real physics under it
    let d = { throttle: 0, brake: going ? 0 : 1, steer: 0, here: locate(cl, car.x, car.z, hint) };
    if (going) d = aiDrive(car, cl, setup, hint);
    hint = d.here.i; worst = Math.max(worst, d.here.off);
    const sub = Math.max(1, Math.ceil(dt / (1 / 60)));
    for (let i = 0; i < sub; i++) stepCar(car, { throttle: d.throttle, brake: d.brake, steer: d.steer }, setup, cl, dt / sub, hint);
    obj.position.set(car.x, 0, car.z); obj.rotation.y = car.heading; obj.rotation.z = -car.steer * Math.min(0.06, speedOf(car) * 0.002);
    obj.userData.spin = speedOf(car) / 0.46; built.tick?.(dt, t);
    stage.body.x = car.x; stage.body.z = car.z; stage.body.ry = car.heading;
    stage.audio.engine(Math.min(1, speedOf(car) / 62));
    if (car.sliding && speedOf(car) > 8) { smoke += dt; if (smoke > 0.05) { smoke = 0; stage.fx.burst('smoke', car.x + Math.sin(car.heading) * 1.4, 0.3, car.z + Math.cos(car.heading) * 1.4, 2, 0.4); } }
    if (going) {
      lapT += dt;
      const frac = d.here.i / N;
      while (lines.length && frac >= lines[0]!.at && !(frac > 0.95 && lines[0]!.at < 0.5)) { say(lines.shift()!.text); }
      if (section.to !== undefined && prog(d.here.i) >= section.to) { finish(Math.round((lapT - secStart) * 1000), false); return; }
      if (frac > 0.8) late = true;
      if (late && frac < 0.1) { finish(Math.round(lapT * 1000), false); return; }
      if (lapT > 120) { finish(null, true); return; }
    }
    // the director's cuts
    shotT += dt;
    if (shotT > (shot === 0 ? 5 : 4.5)) { shotT = 0; shot = (shot + 1) % SHOTS.length; fixed = null; }
    const kind = going ? SHOTS[shot]! : 'front', h = car.heading, fx = -Math.sin(h), fz = -Math.cos(h), spd = speedOf(car);
    if (kind === 'trackside' && !fixed) fixed = { x: car.x + fx * 38 + Math.cos(h) * (cl.width / 2 + 10), z: car.z + fz * 38 - Math.sin(h) * (cl.width / 2 + 10) };
    let cam: { x: number; y: number; z: number; yaw: number; pitch: number; dist: number };
    if (kind === 'chase') cam = { x: car.x + fx * 4, y: 1.2, z: car.z + fz * 4, yaw: h, pitch: 0.2, dist: 9 + Math.min(4, spd * 0.08) };
    else if (kind === 'side') cam = { x: car.x, y: 0.9, z: car.z, yaw: h + Math.PI / 2, pitch: 0.12, dist: 8 };
    else if (kind === 'front') cam = { x: car.x, y: 0.9, z: car.z, yaw: h + Math.PI + 0.3, pitch: 0.1, dist: 8 };
    else if (kind === 'heli') cam = { x: car.x + fx * 6, y: 1, z: car.z + fz * 6, yaw: h + 0.7, pitch: 0.95, dist: 24 };
    else { const dx = fixed!.x - car.x, dz = fixed!.z - car.z, flat = Math.hypot(dx, dz) || 1; cam = { x: car.x, y: 1.0, z: car.z, yaw: Math.atan2(dx, dz), pitch: Math.atan2(2.2, flat), dist: Math.hypot(flat, 2.2) }; }
    stage.setCinema(cam);
  };
  stage.hooks.push(frame);

  function finish(ms: number | null, cancelled: boolean): void {
    if (ended) return; ended = true;
    stage.hooks = stage.hooks.filter((x) => x !== frame);
    stage.audio.engine(null); obj.removeFromParent();
    stage.setCinema(null); stage.camRate = 9;
    if (!embedded) { stage.setControlLocked(false); stage.setPlayerVisible(true); stage.director.show({ active: false, canSkip: false, subtitle: null }); }
    hooks.onEnd({ ms: cancelled ? null : ms, cancelled });
    void worst;
  }
  return () => finish(null, true);
}
