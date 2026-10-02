/**
 * DRIVING: puts the player in the car. The physics and the track are pure logic (logic/vehicle.ts, logic/track.ts); this file only connects them
 * to the stage: input, the car's mesh, the chase camera, sounds, tyre smoke, collisions with barriers and the lap timer.
 */
import type { Group } from 'three';
import { pushOut } from '../logic/movement';
import { newLapTimer, startLine, stepLapTimer } from '../logic/lapTimer';
import { centreLine, checkpoints, locate, REDLINE, startGrid } from '../logic/track';
import { newCar, speedOf, stepCar, type Car, type Setup } from '../logic/vehicle';
import { builders } from './builders';
import type { Input } from './input';
import type { Stage } from './stage';

export interface DriveHud { kmh: number; /** True while the car is going backwards. */ reversing: boolean; /** `waiting`: the timer has not started, it starts when the start/finish line is crossed. */ phase: 'waiting' | 'running'; lap: number; lapTime: number; best: number | null; checkpoint: number; checkpoints: number; surface: 'asphalt' | 'kerb' | 'grass'; sliding: boolean; setup: Setup }
export interface DriveHooks { onHud(h: DriveHud): void; onStart?(): void; onLap(ms: number, lap: number): void; onExit(): void; states: string[] }

const CAR_RADIUS = 1.5;
/** The car left standing where the player got out (one per stage; a new drive replaces it). */
const parked = new WeakMap<Stage, Group>();

/** Start driving at the grid (or where the car is parked). Returns a function that stops driving and puts the player on foot beside the car. */
export function startDrive(stage: Stage, setup: Setup, hooks: DriveHooks, at?: { x: number; z: number; heading: number }): () => void {
  const cl = centreLine(REDLINE);
  const gate = checkpoints(cl, 6);
  const grid = at ?? startGrid(cl, 14);
  parked.get(stage)?.removeFromParent(); parked.delete(stage);
  const make = builders.car!;
  const built = make({ kind: 'car', x: grid.x, z: grid.z, p: { number: '7' } }, stage.buildCtx);
  const obj = built.object as Group;
  stage.worldGroup.add(obj);
  for (const s of hooks.states) built.dyn?.setState(s, true);
  stage.setPlayerVisible(false);
  const car: Car = newCar(grid.x, grid.z, grid.heading);
  const timer = newLapTimer(), line = startLine(cl);
  let hint = locate(cl, car.x, car.z).i, clock = 0, hudClock = 0, smoke = 0, backK = 0;
  const stop = () => {
    stage.audio.engine(null);
    stage.driver = null; stage.setChase(null); stage.setPlayerVisible(true);
    // the player gets out on the car's right side
    const rx = Math.cos(car.heading), rz = -Math.sin(car.heading);
    stage.placePlayer(car.x + rx * 2.6, car.z + rz * 2.6, car.heading);
    hooks.onExit();
  };

  stage.driver = (dt: number, input: Input) => {
    clock += dt;
    const throttle = input.isDown('w', 'ArrowUp') ? 1 : 0, brake = input.isDown('s', 'ArrowDown') ? 1 : 0, reverse = brake; // S brakes a moving car and, once it has nearly stopped, reverses it
    const prev = { x: car.x, z: car.z };
    const steer = (input.isDown('d', 'ArrowRight') ? 1 : 0) - (input.isDown('a', 'ArrowLeft') ? 1 : 0);
    // fixed small steps: stable at any frame rate (a slow machine slows the picture, never the physics)
    const sub = Math.max(1, Math.ceil(dt / (1 / 60)));
    for (let k = 0; k < sub; k++) stepCar(car, { throttle, brake, steer, reverse }, setup, cl, dt / sub, hint);
    // barriers and walls: bounce, lose speed, sparks
    const bd = stage.sceneBounds;
    for (const c of stage.colliderList) {
      const [nx, nz] = pushOut(car.x, car.z, CAR_RADIUS, c);
      if (nx !== car.x || nz !== car.z) {
        const hit = speedOf(car);
        const dx = nx - car.x, dz = nz - car.z, len = Math.hypot(dx, dz) || 1;
        const dot = car.vx * (dx / len) + car.vz * (dz / len);
        if (dot < 0) { car.vx -= 1.4 * dot * (dx / len); car.vz -= 1.4 * dot * (dz / len); car.vx *= 0.7; car.vz *= 0.7; }
        car.x = nx; car.z = nz;
        if (hit > 8) { stage.audio.sfx('hit'); stage.fx.burst('sparks', car.x, 0.6, car.z, 12); }
      }
    }
    if (bd) { // the edge of the world is a wall: the car stops against it instead of sliding along it at speed
      const cx = Math.max(bd.minX + 2, Math.min(bd.maxX - 2, car.x)), cz = Math.max(bd.minZ + 2, Math.min(bd.maxZ - 2, car.z));
      if (cx !== car.x) { car.vx = 0; car.x = cx; } if (cz !== car.z) { car.vz = 0; car.z = cz; }
    }
    const here = locate(cl, car.x, car.z, hint); hint = here.i;
    // the lap timer: it waits until the car CROSSES the start/finish line, then runs until it crosses it again after every checkpoint
    for (const e of stepLapTimer(timer, { line, gates: gate, n: cl.pts.length, prev, cur: { x: car.x, z: car.z }, here, width: cl.width, clock })) {
      if (e.type === 'start') { stage.audio.sfx('chime'); hooks.onStart?.(); }
      else if (e.type === 'lap') { stage.audio.sfx('success'); hooks.onLap(e.ms, e.lap); }
    }
    // look of the car
    obj.position.set(car.x, 0, car.z); obj.rotation.y = car.heading; obj.userData.spin = speedOf(car) / 0.46; built.tick?.(dt, clock);
    obj.rotation.z = -car.steer * Math.min(0.06, speedOf(car) * 0.002);
    // the player's body follows the car so the camera, prompts and the saved position are right
    stage.body.x = car.x; stage.body.z = car.z; stage.body.ry = car.heading;
    const along = car.vx * -Math.sin(car.heading) + car.vz * -Math.cos(car.heading), backing = along < -1.5;
    backK += ((backing ? 1 : 0) - backK) * Math.min(1, dt * 3);
    stage.setChase(car.heading, backK);
    if (car.sliding && speedOf(car) > 8) { smoke += dt; if (smoke > 0.05) { smoke = 0; stage.fx.burst('smoke', car.x - Math.sin(car.heading) * -1.4, 0.3, car.z - Math.cos(car.heading) * -1.4, 2, 0.4); } }
    stage.audio.engine(Math.min(1, speedOf(car) / 62));
    hudClock += dt;
    if (hudClock > 0.1) { hudClock = 0; hooks.onHud({ kmh: Math.round(speedOf(car) * 3.6), reversing: backing, phase: timer.phase, lap: timer.lap, lapTime: timer.phase === 'running' ? clock - timer.startedAt : 0, best: timer.best, checkpoint: Math.min(timer.next, gate.length), checkpoints: gate.length, surface: here.surface, sliding: car.sliding, setup }); }
    if (input.wasPressed('e', 'f') && speedOf(car) < 4) { parked.set(stage, obj); stop(); }
  };
  return () => { parked.set(stage, obj); stop(); };
}
