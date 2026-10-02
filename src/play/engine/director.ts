/**
 * THE DIRECTOR: plays cue sheets (logic/cinematic.ts) on the stage: camera moves, prop animations, particles, NPC reactions, subtitles and
 * banners, with the player's controls locked while it runs. Cinematics queue (a code success then its quest completion play one after another).
 * Skipping, or reduced motion, fast-forwards: every state-changing cue still happens, instantly, so the world always ends up correct.
 */
import { cuesBetween, lengthOf, sortedCues, type Cinematic, type Cue, type Target } from '../logic/cinematic';
import type { Stage } from './stage';

export interface CineBanner { title: string; sub?: string; kind: 'quest' | 'level' | 'unlock' | 'info' }
export interface CineState { active: boolean; canSkip: boolean; subtitle: { who?: string; text: string } | null; banner: CineBanner | null }
export const IDLE_CINE: CineState = { active: false, canSkip: false, subtitle: null, banner: null };

interface Running { c: Cinematic; cues: Cue[]; t: number; len: number; skipped: boolean; /** The cue sheet's clock is held until this prop has finished what it was asked to do. */ wait?: { id: string; left: number } }
interface Shot { x: number; y: number; z: number; yaw: number; pitch: number; dist: number; spin: number; follow?: Target; safe?: boolean; fov?: number }
/** A camera move: from where the camera is to where the shot wants it, over a set time with the ease of a real camera operator (slow out, slow in). */
interface Move { from: Shot; to: Shot; t: number; dur: number; toPlayer: boolean }
const smooth = (k: number): number => k * k * k * (k * (k * 6 - 15) + 10); // smootherstep: no jerk at either end
const wrap = (a: number): number => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

const LAP = '*lap';

export class Director {
  private queue: Cinematic[] = [];
  private cur: Running | null = null;
  private shot: Shot | null = null;
  private move: Move | null = null;
  /** While a sequence is playing the last shot stays where it is between its sheets (the next sheet moves from it) and the controls stay locked. */
  private holding = false;
  private subLeft = 0; private bannerUntil = 0; private gap = 0;
  private state: CineState = IDLE_CINE;

  constructor(private s: Stage, private onState: (st: CineState) => void) {}

  get active(): boolean { return this.cur !== null || this.queue.length > 0; }
  private idleWaiters: (() => void)[] = [];
  /** Resolves when nothing is playing or waiting (at once if already idle). */
  whenIdle(): Promise<void> { return this.active ? new Promise((res) => this.idleWaiters.push(res)) : Promise.resolve(); }
  private flushIdle(): void { const w = this.idleWaiters; this.idleWaiters = []; for (const f of w) f(); }
  get running(): boolean { return this.cur !== null; }
  /** Seconds left of the sheet that is playing (a large number while it waits on a machine, so a fade never starts early). */
  remaining(): number { const r = this.cur; return r ? (r.wait ? 99 : Math.max(0, r.len - r.t)) : 0; }
  /** Add a cinematic to play after any already waiting. */
  enqueue(c: Cinematic): void { this.queue.push(c); if (!this.cur) this.next(); }
  /** A sequence of sheets begins (true) or ends (false): see `holding`. Ending it hands the camera and the controls back. */
  hold(on: boolean): void {
    this.holding = on;
    if (!on && !this.cur && !this.queue.length) { if (!this.move) { this.shot = null; this.s.setCinema(null); } this.s.setControlLocked(false); this.s.camRate = 9; this.publish({ active: false, canSkip: false }); this.flushIdle(); }
  }
  /** Show or hide the cinematic furniture (letterbox, subtitle) for a sequence that is not a cue sheet (a replayed lap). */
  show(patch: Partial<CineState>): void { this.publish(patch); }
  private publish(patch: Partial<CineState>): void { this.state = { ...this.state, ...patch }; this.onState(this.state); }

  private next(): void {
    const c = this.queue.shift();
    if (!c) { this.finishAll(); return; }
    this.cur = { c, cues: sortedCues(c), t: -1e-6, len: lengthOf(c), skipped: false }; // a hair before zero, so a cue written at t: 0 fires on the first frame (cues fire for times after `from`)
    this.publish({ active: true, canSkip: true });
    this.s.setControlLocked(true);
    if (this.s.reduced) this.skip(); // reduced motion: no camera work, same end state
  }

  /** Fast-forward the running cinematic: the world ends in the same state, without the motion. */
  skip(): void {
    const r = this.cur; if (!r) return;
    r.skipped = true; this.s.stopLap();
    for (const q of cuesBetween(r.cues, r.t - 1e-9, Infinity)) this.fire(q, true);
    this.s.tweens.clear();
    r.t = r.len;
    this.end();
  }

  update(dt: number): void {
    const r = this.cur;
    if (!r) { if (this.move) this.tick(dt); if (this.queue.length && (this.gap -= dt) <= 0) this.next(); return; }
    if (this.state.subtitle && (this.subLeft -= dt) <= 0) this.publish({ subtitle: null }); // lines time out on their own clock, so a long wait on a machine never leaves one hanging
    if (r.wait) { // the sheet's clock waits for a machine to finish (an arm mid-move), however long it takes within its limit
      r.wait.left -= dt;
      const busy = r.wait.id === LAP ? this.s.lapBusy : this.s.dyn(r.wait.id)?.busy?.();
      if (busy && r.wait.left > 0) { if (r.wait.id !== LAP) this.tick(dt); return; }
      r.wait = undefined;
    }
    const from = r.t; r.t += dt;
    for (const q of cuesBetween(r.cues, from, r.t)) this.fire(q, false);
    this.tick(dt);
    if (this.state.banner && r.t > this.bannerUntil) this.publish({ banner: null });
    if (r.t >= r.len) this.end();
  }

  /** Per-frame camera work: the timed move toward the wanted shot, a slow orbit, and following a moving target (a ball in flight). */
  private tick(dt: number): void {
    const mv = this.move;
    if (mv) {
      mv.t += dt;
      const k = smooth(Math.min(1, mv.t / mv.dur));
      let to = mv.toPlayer ? this.s.playerView() : mv.to;
      if (!mv.toPlayer && mv.to.follow) { const p = this.at(mv.to.follow); to = { ...to, x: p.x, z: p.z, y: Math.max(0.9, p.y) }; }
      const f = mv.from;
      this.spinAcc += (mv.toPlayer ? 0 : to.spin ?? 0) * dt; // an orbit goes on turning while the camera travels
      const sh: Shot = { x: f.x + (to.x - f.x) * k, y: f.y + (to.y - f.y) * k, z: f.z + (to.z - f.z) * k, yaw: f.yaw + wrap(to.yaw - f.yaw) * k + this.spinAcc, pitch: f.pitch + (to.pitch - f.pitch) * k, dist: f.dist + (to.dist - f.dist) * k, spin: mv.toPlayer ? 0 : to.spin, follow: mv.to.follow, safe: mv.toPlayer || mv.to.safe, fov: (f.fov ?? 48) + ((to.fov ?? 48) - (f.fov ?? 48)) * k };
      this.shot = sh; this.s.setCinema(sh);
      if (mv.t >= mv.dur) { this.move = null; if (mv.toPlayer) { this.shot = null; this.s.setCinema(null); this.s.camRate = 9; } else { this.shot = { ...sh }; this.spinAcc = 0; } }
      return;
    }
    const sh = this.shot; if (!sh) return;
    if (!sh.spin && !sh.follow) return;
    if (sh.spin) sh.yaw += sh.spin * dt;
    if (sh.follow) { const p = this.at(sh.follow); sh.x = p.x; sh.z = p.z; sh.y = Math.max(0.9, p.y); }
    this.s.setCinema(sh);
  }
  private spinAcc = 0;

  private end(): void {
    const r = this.cur; if (!r) return;
    this.cur = null;
    if (!this.holding && !this.move) { this.shot = null; this.s.setCinema(null); this.s.camRate = 5; } // a sequence keeps its last shot for the next sheet; a move in progress finishes
    this.s.releaseNpcs();
    this.publish({ subtitle: null, ...(r.skipped ? {} : { banner: null }) });
    if (this.queue.length) { this.gap = 0.25; return; }
    this.s.syncPower(false); // once everything queued has played: the glow settles on what the player has restored
    if (!this.holding) { this.s.setControlLocked(false); if (!this.move) this.s.camRate = 9; }
    this.publish({ active: this.holding, canSkip: false });
    this.flushIdle();
  }

  /** The scene is being replaced: drop everything (nothing may fire into a world that no longer exists). */
  reset(): void { this.queue = []; this.cur = null; this.shot = null; this.move = null; this.spinAcc = 0; this.holding = false; this.state = IDLE_CINE; this.onState(IDLE_CINE); this.flushIdle(); }

  private finishAll(): void { this.s.setControlLocked(false); this.publish({ active: false, canSkip: false, subtitle: null, banner: null }); this.flushIdle(); }

  private at(t: Target): { x: number; y: number; z: number } { return this.s.targetPos(t) ?? { x: this.s.body.x, y: 1, z: this.s.body.z }; }

  private startMove(from: Shot, to: Shot, dur: number, toPlayer: boolean): void {
    this.spinAcc = 0;
    this.move = { from: { ...from, spin: 0 }, to, t: 0, dur: Math.max(0.2, dur), toPlayer };
    this.shot = { ...from }; this.s.camRate = 60; // the move drives the camera; the stage's own easing must not add a second lag on top
  }

  private fire(q: Cue, instant: boolean): void {
    const s = this.s, r = this.cur!;
    switch (q.do) {
      case 'cam': {
        if (instant) return;
        const dur = q.blend ?? 1.2;
        const from = this.shot ? { ...this.shot } : this.s.viewNow();
        if (q.at === 'player') { this.startMove(from, this.s.playerView(), dur, true); return; }
        const p = this.at(q.at);
        const to: Shot = { x: p.x, y: q.height ?? Math.max(0.9, p.y), z: p.z, yaw: q.yaw ?? from.yaw, pitch: q.pitch ?? from.pitch, dist: q.dist ?? from.dist, spin: q.spin ?? 0, follow: q.follow ? q.at : undefined, safe: q.safe, fov: q.fov };
        if (dur <= 0.06) { this.move = null; this.shot = to; this.spinAcc = 0; s.camRate = 40; s.setCinema(to); s.snapCamera(); return; } // a CUT, not a move: the shot is there at once
        this.startMove(from, to, dur, false);
        return;
      }
      case 'say': if (instant) { s.env_caption?.(q.who ? `${q.who}: ${q.text}` : q.text); return; } this.subLeft = q.for ?? 3; this.publish({ subtitle: { who: q.who, text: q.text } }); return;
      case 'prop': { const d = s.dyn(q.id); if (!d) return; if (q.state) d.setState(q.state, instant); if (q.play && !instant) d.play?.(q.play); return; }
      case 'fx': if (instant) return; { const p = this.at(q.at); s.fx.burst(q.kind, p.x, q.y ?? p.y, p.z, q.n ?? 20, q.scale ?? 1); } return;
      case 'flash': if (instant) return; { const p = this.at(q.at); s.fx.flash(p.x, q.y ?? p.y, p.z, q.color ?? 0xffd166, q.power ?? 12, q.dur ?? 0.4); } return;
      case 'await': if (!instant) r.wait = { id: q.id, left: q.max ?? 10 }; return;
      case 'sfx': if (!instant) s.audio.sfx(q.name); return;
      case 'music': s.audio.music(q.name, q.fade ?? 1.5); return;
      case 'npc': {
        const n = s.npcRuntime(q.id); if (!n) return;
        if (q.walk) { if (instant) s.placeNpc(q.id, q.walk[0], q.walk[1]); else n.goal = { x: q.walk[0], z: q.walk[1] }; }
        if (instant) return;
        if (q.face) { const p = this.at(q.face); n.faceTarget = { x: p.x, z: p.z }; }
        if (q.look !== undefined) { if (q.look) { const p = this.at(q.look); n.rig.lookAt(p.x, p.z); } else n.rig.lookAt(null); }
        if (q.mood) n.rig.mood(q.mood);
        if (q.talk !== undefined) n.rig.talk(q.talk);
        if (q.point) { const p = this.at(q.point); n.rig.pointAt(p.x, p.z); n.rig.hold('point'); }
        if (q.hold) n.rig.hold(q.hold);
        if (q.release) n.rig.release();
        if (q.anim) n.rig.play(q.anim);
        return;
      }
      case 'player': {
        if (instant) { if (q.show !== undefined) s.setPlayerVisible(q.show); return; }
        const rig = s.playerRigRef;
        if (q.walk) s.playerGoal = { x: q.walk[0], z: q.walk[1] };
        if (q.face) { const p = this.at(q.face); s.playerFace = { x: p.x, z: p.z }; }
        if (q.look !== undefined) { if (q.look) { const p = this.at(q.look); rig.lookAt(p.x, p.z); } else rig.lookAt(null); }
        if (q.mood) rig.mood(q.mood);
        if (q.anim) rig.play(q.anim);
        if (q.show !== undefined) s.setPlayerVisible(q.show);
        return;
      }
      case 'lap': {
        if (instant) return;
        const board = q.board;
        s.runLap(q.from, q.to, (ms) => {
          if (ms === null) return;
          const sec = (ms / 1000).toFixed(2);
          if (board) s.dyn(board.id)?.play?.(`text:${board.text.replace('{t}', sec)}`);
          s.env_caption?.(`Section time: ${sec} s`);
        });
        r.wait = { id: LAP, left: 60 }; return;
      }
      case 'shake': if (!instant && !s.reduced) s.shakeCamera(q.amount); return;
      case 'mood': s.setMood(q.k); return;
      case 'power': s.setPowerOverride(q.k === 'save' ? null : q.k, instant ? 0 : q.over ?? 1.2, q.motion, q.world); return;
      case 'banner': this.bannerUntil = r.t + 3.4; this.publish({ banner: { title: q.title, sub: q.sub, kind: q.kind ?? 'quest' } }); if (instant) this.bannerUntil = Math.max(this.bannerUntil, r.t + 3.4); return;
    }
  }
}
