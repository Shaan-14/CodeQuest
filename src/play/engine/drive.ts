/**
 * DRIVING: puts the player in the car. The physics and the track are pure logic (logic/vehicle.ts, logic/track.ts); this file only connects them
 * to the stage: input, the car's mesh, the chase camera, sounds, tyre smoke, collisions with barriers and the lap timer.
 */
import type { Group } from 'three';
import { pushOut } from '../logic/movement';
import { centreLine, checkpoints, locate, REDLINE, startGrid } from '../logic/track';
import { newCar, speedOf, stepCar, type Car, type Setup } from '../logic/vehicle';
import { builders } from './builders';
import type { Input } from './input';
import type { Stage } from './stage';

export interface DriveHud { kmh: number; lap: number; lapTime: number; best: number | null; checkpoint: number; checkpoints: number; surface: 'asphalt' | 'kerb' | 'grass'; sliding: boolean; setup: Setup }
export interface DriveHooks { onHud(h: DriveHud): void; onLap(ms: number, lap: number): void; onExit(): void; states: string[] }

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
  let hint = locate(cl, car.x, car.z).i, next = 1, started = false, lapStart = 0, clock = 0, best: number | null = null, lap = 0, hudClock = 0, smoke = 0;
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
    const throttle = input.isDown('w', 'ArrowUp') ? 1 : 0, brake = input.isDown('s', 'ArrowDown') ? 1 : 0;
    const steer = (input.isDown('d', 'ArrowRight') ? 1 : 0) - (input.isDown('a', 'ArrowLeft') ? 1 : 0);
    // fixed small steps: stable at any frame rate (a slow machine slows the picture, never the physics)
    const sub = Math.max(1, Math.ceil(dt / (1 / 60)));
    for (let k = 0; k < sub; k++) stepCar(car, { throttle, brake, steer }, setup, cl, dt / sub, hint);
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
    if (bd) { car.x = Math.max(bd.minX + 2, Math.min(bd.maxX - 2, car.x)); car.z = Math.max(bd.minZ + 2, Math.min(bd.maxZ - 2, car.z)); }
    const here = locate(cl, car.x, car.z, hint); hint = here.i;
    // checkpoints and laps
    const n = cl.pts.length;
    const near = (idx: number) => { const d = Math.abs(((here.i - idx + n * 1.5) % n) - n / 2); return d > n / 2 - 4; };
    if (!started && near(0) && speedOf(car) > 1) { started = true; lapStart = clock; next = 1; }
    else if (started && next < gate.length && near(gate[next]!) && here.off < cl.width) next++;
    else if (started && next >= gate.length && near(0)) {
      const ms = Math.round((clock - lapStart) * 1000); lap++; lapStart = clock; next = 1;
      if (best === null || ms < best) best = ms;
      stage.audio.sfx('success'); hooks.onLap(ms, lap);
    }
    // look of the car
    obj.position.set(car.x, 0, car.z); obj.rotation.y = car.heading;
    obj.rotation.z = -car.steer * Math.min(0.06, speedOf(car) * 0.002);
    // the player's body follows the car so the camera, prompts and the saved position are right
    stage.body.x = car.x; stage.body.z = car.z; stage.body.ry = car.heading;
    stage.setChase(car.heading);
    if (car.sliding && speedOf(car) > 8) { smoke += dt; if (smoke > 0.05) { smoke = 0; stage.fx.burst('smoke', car.x - Math.sin(car.heading) * -1.4, 0.3, car.z - Math.cos(car.heading) * -1.4, 2, 0.4); } }
    stage.audio.engine(Math.min(1, speedOf(car) / 62));
    hudClock += dt;
    if (hudClock > 0.1) { hudClock = 0; hooks.onHud({ kmh: Math.round(speedOf(car) * 3.6), lap, lapTime: started ? clock - lapStart : 0, best, checkpoint: Math.min(next, gate.length), checkpoints: gate.length, surface: here.surface, sliding: car.sliding, setup }); }
    if (input.wasPressed('e', 'f') && speedOf(car) < 4) { parked.set(stage, obj); stop(); }
  };
  return () => { parked.set(stage, obj); stop(); };
}
