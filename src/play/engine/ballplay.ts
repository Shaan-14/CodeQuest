/**
 * THE BALLPLAY ENGINE: one plate appearance, played out beat by beat with the park's real players. Batter ready, the pitcher's windup, the pitch,
 * the swing, contact, the ball's flight, the fielders reacting and the throw, the runner, the crowd. It is driven by a PLAY TYPE (the same types
 * the simulated game produces: logic/baseballSim.ts), so the simulated game, the lineup reveal and the short sequences a passed lesson earns all
 * use these same beats and none of them is a canned animation of a result that did not happen.
 *
 * Coordinates are local to home plate (north is -z); the team prop sits at home. The engine owns nothing visual except the ball and its shadow:
 * the players are rigs the team builder made.
 */
import { Mesh, MeshBasicMaterial, CircleGeometry, SphereGeometry, type Group } from 'three';
import type { PlayType } from '../logic/baseballSim';
import { FOUL_ANGLE, fenceRadius } from '../logic/ballparkGeom';
import type { Rig } from './rig';
import { ease } from './tween';
import type { BuildCtx } from './builders';

export type Kind = PlayType | 'steal' | 'predict';

export interface Field { P: [number, number]; base: Record<'home' | 'first' | 'second' | 'third', readonly [number, number]>; pos: Record<string, [number, number]> }

export interface Ballplay {
  /** Play one plate appearance of this type. `variant` picks the direction and which fielder (so no two look alike). Resolves when it is over. */
  plate(kind: Kind, variant?: number): Promise<void>;
  /** Move a rig along points at a running or jogging speed; resolves on arrival. */
  move(rig: Rig, pts: [number, number][], speed: number, face?: number): Promise<void>;
  update(dt: number): boolean;
  /** Is a plate appearance in progress? */
  busy(): boolean;
  /** Where the ball is (local), or null when it is out of play. */
  ball(): { x: number; y: number; z: number } | null;
  /** Stop everything and put the players back (a skipped cinematic, a new scene). */
  reset(): void;
  readonly ballMesh: Mesh;
  readonly shadow: Mesh;
}

interface Mover { rig: Rig; pts: [number, number][]; speed: number; done: () => void; face?: number }

const ballGeo = new SphereGeometry(0.16, 10, 8); ballGeo.userData.shared = true;
const ballMat = new MeshBasicMaterial({ color: 0xffffff }); ballMat.userData.shared = true;
const shadowGeo = new CircleGeometry(0.2, 12); shadowGeo.rotateX(-Math.PI / 2); shadowGeo.userData.shared = true;
const shadowMat = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }); shadowMat.userData.shared = true;

/** The direction a character must face to look from (ax, az) toward (bx, bz): yaw 0 = north. */
const heading = (ax: number, az: number, bx: number, bz: number) => Math.atan2(-(bx - ax), -(bz - az));

export function createBallplay(o: {
  group: Group; ctx: BuildCtx; field: Field; rigs: Map<string, Rig>; batter: Rig; runner: Rig; marks: Mesh[]; home: { x: number; z: number };
}): Ballplay {
  const { ctx, field, rigs, batter, runner, marks, group, home } = o;
  const ball = new Mesh(ballGeo, ballMat); ball.visible = false; group.add(ball);
  const shadow = new Mesh(shadowGeo, shadowMat); shadow.visible = false; shadow.position.y = 0.03; group.add(shadow);
  const BOX: [number, number] = [-1.3, 0.3];
  const movers: Mover[] = [];
  let live = 0, token = 0, inPlay = false;

  const wait = (s: number) => new Promise<void>((res) => ctx.tweens.after(Math.max(0.0001, s), res));
  const tw = (dur: number, fn: (k: number) => void, e = ease.linear) => new Promise<void>((res) => ctx.tweens.add(dur, fn, { ease: e, done: res }));
  const at = (name: string) => rigs.get(name)!;
  const put = (m: Mesh, x: number, y: number, z: number) => { m.position.set(x, y, z); if (m === ball) { shadow.visible = ball.visible; shadow.position.set(x, 0.03, z); const s = Math.max(0.5, 1.2 - y * 0.08); shadow.scale.setScalar(s); } };
  const showBall = (on: boolean) => { ball.visible = on; shadow.visible = on; };

  function move(rig: Rig, pts: [number, number][], speed: number, face?: number): Promise<void> {
    for (let i = movers.length - 1; i >= 0; i--) if (movers[i]!.rig === rig) { movers[i]!.done(); movers.splice(i, 1); }
    if (ctx.reduced || !pts.length) { const l = pts[pts.length - 1]; if (l) rig.group.position.set(l[0], 0, l[1]); if (face !== undefined) rig.setFacing(face, true); return Promise.resolve(); }
    return new Promise<void>((done) => movers.push({ rig, pts: pts.slice(), speed, done, face }));
  }

  function update(dt: number): boolean {
    const moving = new Set<Rig>();
    for (let i = movers.length - 1; i >= 0; i--) {
      const m = movers[i]!, p = m.rig.group.position, g = m.pts[0]!;
      const dx = g[0] - p.x, dz = g[1] - p.z, d = Math.hypot(dx, dz), step = m.speed * dt;
      if (d <= step + 0.02) {
        p.x = g[0]; p.z = g[1]; m.pts.shift();
        if (!m.pts.length) { movers.splice(i, 1); if (m.face !== undefined) m.rig.setFacing(m.face); m.rig.update(dt, 'idle', 0); m.done(); continue; }
      } else { p.x += (dx / d) * step; p.z += (dz / d) * step; m.rig.setFacing(Math.atan2(-dx, -dz)); }
      m.rig.update(dt, m.speed > 4 ? 'run' : 'walk', m.speed); moving.add(m.rig);
    }
    for (const r of [batter, runner, ...rigs.values()]) if (!moving.has(r)) r.update(dt, 'idle', 0);
    return movers.length > 0;
  }

  /** The landing spot of a ball put in play, local to home. `v` varies direction (-1 left .. 1 right). */
  function landing(kind: PlayType, v: number): { x: number; z: number; arc: number; dur: number; y1: number } {
    const th = v * (FOUL_ANGLE * 0.8), r = (d: number) => ({ x: Math.sin(th) * d, z: -Math.cos(th) * d });
    switch (kind) {
      case 'homerun': { const d = fenceRadius(th) + 5; return { ...r(d), arc: 17, dur: 2.5, y1: 5 }; }
      case 'double': { const d = fenceRadius(th) - 6; return { ...r(d), arc: 8, dur: 1.7, y1: 0 }; }
      case 'flyout': return { ...r(30), arc: 13, dur: 2.1, y1: 0 };
      case 'single': case 'error': return { ...r(21), arc: 2.2, dur: 1.2, y1: 0 };
      default: return { ...r(11), arc: 0.6, dur: 0.95, y1: 0 }; // a ground ball
    }
  }

  const nearest = (x: number, z: number, from: string[]): string => from.reduce((best, n) => { const p = at(n).group.position, q = at(best).group.position; return Math.hypot(p.x - x, p.z - z) < Math.hypot(q.x - x, q.z - z) ? n : best; });

  /** Everybody back where they stand at the start of a plate appearance. */
  function setup(): void {
    for (const [n, rig] of rigs) { const p = field.pos[n]!; rig.release(); rig.group.position.set(p[0], 0, p[1]); rig.setFacing(n === 'C' ? 0 : Math.PI, true); rig.hold('ready'); }
    batter.group.visible = true; batter.release(); batter.group.position.set(BOX[0], 0, BOX[1]); batter.setFacing(-Math.PI / 2, true); batter.hold('ready');
    runner.group.visible = false; runner.release();
    showBall(false); marks.forEach((m) => (m.visible = false));
    at('P').release(); at('C').hold('ready');
  }

  async function pitchTo(kind: Kind, my: number, v: number): Promise<void> {
    const P = field.pos.P!, outside = kind === 'walk';
    at('P').play('pitch'); // the windup: leg up, arm back
    await wait(0.62);
    if (my !== token) return;
    showBall(true); ctx.audio.sfx('whoosh');
    const zoneX = outside ? 0.95 : 0, zoneY = outside ? 1.5 : 0.95;
    await tw(0.42, (k) => put(ball, zoneX * k, 1.55 + (zoneY - 1.55) * k - 0.12 * Math.sin(k * Math.PI), P[1] + (0.25 - P[1]) * k));
    void v;
  }

  async function fielding(kind: PlayType, my: number, v: number): Promise<void> {
    const L = landing(kind, v);
    const infield = ['1B', '2B', 'SS', '3B'], outfield = ['LF', 'CF', 'RF'];
    const who = nearest(L.x, L.z, kind === 'groundout' ? infield : kind === 'flyout' || kind === 'homerun' ? outfield : [...infield, ...outfield]);
    const f = at(who), fp = f.group.position;
    // every fielder reacts: the others turn to follow the ball, the chaser breaks toward the landing spot
    for (const [n, r] of rigs) if (n !== who && n !== 'P' && n !== 'C') r.setFacing(heading(r.group.position.x, r.group.position.z, L.x, L.z));
    at('C').release(); at('P').release();
    const sx = 0.1, sz = 0.2;
    // flight
    const run = move(f, [[kind === 'homerun' ? Math.max(-30, Math.min(30, L.x)) * 0.9 : L.x, kind === 'homerun' ? L.z * 0.9 : L.z + (L.z < -15 ? 0.6 : 0.2)]], Math.min(8, 3 + Math.hypot(L.x - fp.x, L.z - fp.z) / L.dur), heading(L.x, L.z, 0, 0));
    const ground = kind === 'groundout' || kind === 'single' || kind === 'error';
    await tw(L.dur, (k) => put(ball, sx + (L.x - sx) * k, ground ? 0.16 + Math.abs(Math.sin(k * Math.PI * 3.5)) * 0.55 * (1 - k) : 0.9 + Math.sin(k * Math.PI) * L.arc + L.y1 * k, sz + (L.z - sz) * k), ease.linear);
    if (my !== token) return;
    if (kind === 'homerun') { await wait(0.1); showBall(false); return; }
    await run; if (my !== token) return;
    f.play('catch'); await wait(0.25);
    if (kind === 'flyout') { showBall(false); await wait(0.7); return; }
    // the throw: to first for a ground ball, back in to the cut-off for a hit
    const target = kind === 'groundout' ? '1B' : '2B', tp = at(target).group.position;
    f.play('throw'); await wait(0.38);
    await tw(0.45 + Math.hypot(tp.x - fp.x, tp.z - fp.z) * 0.012, (k) => put(ball, L.x + (tp.x - L.x) * k, 1.3 + Math.sin(k * Math.PI) * 1.2, L.z + (tp.z - L.z) * k));
    at(target).play('catch'); ctx.audio.sfx('click'); showBall(false);
  }

  async function plate(kind: Kind, variant = 0): Promise<void> {
    const my = ++token; inPlay = true; live++;
    try { await run(kind, variant, my); } finally { if (my === token) inPlay = false; live--; }
  }

  async function run(kind: Kind, variant: number, my: number): Promise<void> {
    const v = ((variant * 0.37 + 0.13) % 2) - 1; // -1 .. 1: which way the ball goes
    {
      setup();
      if (kind === 'steal') return await steal(my);
      if (kind === 'predict') return await predict(my, v);
      const swings = kind !== 'walk' && !(kind === 'strikeout' && variant % 2 === 1); // a called third strike keeps the bat on the shoulder
      // the pitch, and the swing timed to meet it
      const pitch = pitchTo(kind, my, v);
      if (swings) { await wait(0.62 + 0.42 - 0.45); batter.play('swing'); }
      await pitch; if (my !== token) return;
      const hit = kind !== 'strikeout' && kind !== 'walk';
      if (!hit) { // the catcher takes it
        const c = field.pos.C!;
        await tw(0.12, (k) => put(ball, ball.position.x, ball.position.y - 0.2 * k, ball.position.z + (c[1] - ball.position.z) * k));
        at('C').play('catch'); ctx.audio.sfx('click'); await wait(0.35); showBall(false);
        if (kind === 'walk') { batter.release(); await move(batter, [field.base.first as unknown as [number, number]], 3.2, -Math.PI / 2); marks[0]!.visible = true; }
        else { batter.play('shrug'); await wait(0.9); }
        return;
      }
      // contact
      ctx.audio.sfx('crack'); ctx.fx.burst('dust', home.x, 1, home.z, 8, 0.5); ctx.fx.flash(home.x, 1.1, home.z, 0xfff3c0, 5, 0.18);
      if (kind === 'homerun') ctx.audio.sfx('cheer');
      batter.release();
      const fieldingP = fielding(kind, my, v);
      // the batter becomes a runner
      const b = field.base, F = b.first as unknown as [number, number], S = b.second as unknown as [number, number], T = b.third as unknown as [number, number], H = b.home as unknown as [number, number];
      const path: [number, number][] = kind === 'homerun' ? [F, S, T, H] : kind === 'double' ? [F, S] : kind === 'flyout' ? [[BOX[0] + 1.6, -1.4]] : [F];
      const running = move(batter, path, kind === 'homerun' ? 5.2 : kind === 'flyout' ? 2.4 : 7, kind === 'homerun' ? Math.PI : -Math.PI / 2);
      if (kind === 'homerun') { await wait(0.9); ctx.fx.burst('confetti', home.x, 8, home.z - 30, 40); }
      await fieldingP; if (my !== token) return;
      await running;
      if (kind === 'single' || kind === 'error' || kind === 'double' || kind === 'homerun') ctx.audio.sfx('cheer');
      marks.forEach((m, i) => (m.visible = kind === 'double' ? i === 1 : kind === 'single' || kind === 'error' ? i === 0 : false));
      if (kind === 'homerun') { batter.play('cheer'); await wait(1.2); }
      else if (kind === 'flyout' || kind === 'groundout') { batter.play('shrug'); await wait(0.7); }
      else await wait(0.5);
    }
  }

  /** A stolen base: the runner on first breaks as the pitcher starts, the catcher's throw is a heartbeat late. */
  async function steal(my: number): Promise<void> {
    const F = field.base.first as unknown as [number, number], S = field.base.second as unknown as [number, number];
    runner.group.visible = true; runner.group.position.set(F[0] + 0.5, 0, F[1] + 0.3); runner.setFacing(heading(F[0], F[1], S[0], S[1]), true); runner.hold('ready');
    marks[0]!.visible = true;
    const pitch = pitchTo('strikeout', my, 0);
    await wait(0.62); runner.release(); const go = move(runner, [[S[0] + 0.3, S[1] + 0.6]], 7.2, heading(F[0], F[1], S[0], S[1]));
    await pitch; if (my !== token) return;
    batter.play('swing'); // the batter lets it go by (a swing and miss that covers the steal)
    const c = field.pos.C!, ss = at('SS').group.position;
    await tw(0.1, (k) => put(ball, 0, 0.95, 0.25 + (c[1] - 0.25) * k));
    at('C').play('throw'); await wait(0.36);
    await tw(0.55, (k) => put(ball, 0 + (ss.x - 0) * k, 1.4 + Math.sin(k * Math.PI) * 0.8, c[1] + (ss.z - c[1]) * k));
    at('SS').play('catch'); showBall(false);
    await go; marks[0]!.visible = false; marks[1]!.visible = true; runner.play('cheer'); ctx.audio.sfx('cheer'); await wait(1);
  }

  /** The analytics call: the hit the model forecast, so its arc is drawn on the grass before the pitch and the ball then lands on it. */
  async function predict(my: number, v: number): Promise<void> {
    const L = landing('double', v);
    const ghost: Mesh[] = [];
    for (let i = 1; i <= 8; i++) { const k = i / 9, m = new Mesh(ballGeo, new MeshBasicMaterial({ color: 0x7dffb3, transparent: true, opacity: 0.8 })); m.scale.setScalar(0.55); m.position.set(L.x * k, 0.9 + Math.sin(k * Math.PI) * L.arc, L.z * k + 0.2); group.add(m); ghost.push(m); }
    ctx.audio.sfx('chime'); await wait(1.1); if (my !== token) { ghost.forEach((m) => group.remove(m)); return; }
    await run('double', Math.round((v + 1) * 5), my); // it lands where the model said
    for (const m of ghost) { group.remove(m); (m.material as MeshBasicMaterial).dispose(); }
  }

  function reset(): void { token++; inPlay = false; live = 0; movers.length = 0; setup(); }

  return { plate, move, update, busy: () => inPlay || movers.length > 0 || live > 0, ball: () => (ball.visible ? { x: ball.position.x, y: ball.position.y, z: ball.position.z } : null), reset, ballMesh: ball, shadow };
}
