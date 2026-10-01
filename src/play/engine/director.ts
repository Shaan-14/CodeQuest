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

interface Running { c: Cinematic; cues: Cue[]; t: number; len: number; skipped: boolean }
interface Shot { x: number; y: number; z: number; yaw: number; pitch: number; dist: number; spin: number }

export class Director {
  private queue: Cinematic[] = [];
  private cur: Running | null = null;
  private shot: Shot | null = null;
  private subUntil = 0; private bannerUntil = 0; private gap = 0;
  private state: CineState = IDLE_CINE;

  constructor(private s: Stage, private onState: (st: CineState) => void) {}

  get active(): boolean { return this.cur !== null || this.queue.length > 0; }
  get running(): boolean { return this.cur !== null; }
  /** Add a cinematic to play after any already waiting. */
  enqueue(c: Cinematic): void { this.queue.push(c); if (!this.cur) this.next(); }
  /** Show or hide the cinematic furniture (letterbox, subtitle) for a sequence that is not a cue sheet (a replayed lap). */
  show(patch: Partial<CineState>): void { this.publish(patch); }
  private publish(patch: Partial<CineState>): void { this.state = { ...this.state, ...patch }; this.onState(this.state); }

  private next(): void {
    const c = this.queue.shift();
    if (!c) { this.finishAll(); return; }
    this.cur = { c, cues: sortedCues(c), t: 0, len: lengthOf(c), skipped: false };
    this.publish({ active: true, canSkip: true });
    this.s.setControlLocked(true);
    if (this.s.reduced) this.skip(); // reduced motion: no camera work, same end state
  }

  /** Fast-forward the running cinematic: the world ends in the same state, without the motion. */
  skip(): void {
    const r = this.cur; if (!r) return;
    r.skipped = true;
    for (const q of cuesBetween(r.cues, r.t - 1e-9, Infinity)) this.fire(q, true);
    this.s.tweens.clear();
    r.t = r.len;
    this.end();
  }

  update(dt: number): void {
    const r = this.cur;
    if (!r) { if (this.queue.length && (this.gap -= dt) <= 0) this.next(); return; }
    const from = r.t; r.t += dt;
    for (const q of cuesBetween(r.cues, from, r.t)) this.fire(q, false);
    if (this.shot && this.shot.spin) { this.shot.yaw += this.shot.spin * dt; this.s.setCinema(this.shot); }
    if (this.state.subtitle && r.t > this.subUntil) this.publish({ subtitle: null });
    if (this.state.banner && r.t > this.bannerUntil) this.publish({ banner: null });
    if (r.t >= r.len) this.end();
  }

  private end(): void {
    const r = this.cur; if (!r) return;
    this.cur = null; this.shot = null;
    this.s.setCinema(null); this.s.camRate = 5;
    this.s.releaseNpcs();
    this.publish({ subtitle: null, ...(r.skipped ? {} : { banner: null }) });
    if (this.queue.length) { this.gap = 0.25; return; }
    this.s.setControlLocked(false);
    this.s.camRate = 9;
    this.publish({ active: false, canSkip: false });
  }

  /** The scene is being replaced: drop everything (nothing may fire into a world that no longer exists). */
  reset(): void { this.queue = []; this.cur = null; this.shot = null; this.state = IDLE_CINE; this.onState(IDLE_CINE); }

  private finishAll(): void { this.s.setControlLocked(false); this.publish({ active: false, canSkip: false, subtitle: null, banner: null }); }

  private at(t: Target): { x: number; y: number; z: number } { return this.s.targetPos(t) ?? { x: this.s.body.x, y: 1, z: this.s.body.z }; }

  private fire(q: Cue, instant: boolean): void {
    const s = this.s, r = this.cur!;
    switch (q.do) {
      case 'cam': {
        if (instant) return;
        if (q.at === 'player') { this.shot = null; s.setCinema(null); s.camRate = 3 / (q.blend ?? 1.2); return; }
        const p = this.at(q.at);
        this.shot = { x: p.x, y: q.height ?? Math.max(0.9, p.y), z: p.z, yaw: q.yaw ?? this.shot?.yaw ?? s.cameraYaw, pitch: q.pitch ?? this.shot?.pitch ?? 0.3, dist: q.dist ?? this.shot?.dist ?? 6, spin: q.spin ?? 0 };
        s.camRate = 3 / Math.max(0.2, q.blend ?? 1.2);
        s.setCinema(this.shot);
        return;
      }
      case 'say': if (instant) { s.env_caption?.(q.who ? `${q.who}: ${q.text}` : q.text); return; } this.subUntil = r.t + (q.for ?? 3); this.publish({ subtitle: { who: q.who, text: q.text } }); return;
      case 'prop': { const d = s.dyn(q.id); if (!d) return; if (q.state) d.setState(q.state, instant); if (q.play && !instant) d.play?.(q.play); return; }
      case 'fx': if (instant) return; { const p = this.at(q.at); s.fx.burst(q.kind, p.x, q.y ?? p.y, p.z, q.n ?? 20, q.scale ?? 1); } return;
      case 'flash': if (instant) return; { const p = this.at(q.at); s.fx.flash(p.x, q.y ?? p.y, p.z, q.color ?? 0xffd166, q.power ?? 12, q.dur ?? 0.4); } return;
      case 'sfx': if (!instant) s.audio.sfx(q.name); return;
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
        if (instant) return;
        const rig = s.playerRigRef;
        if (q.walk) s.playerGoal = { x: q.walk[0], z: q.walk[1] };
        if (q.face) { const p = this.at(q.face); s.playerFace = { x: p.x, z: p.z }; }
        if (q.look !== undefined) { if (q.look) { const p = this.at(q.look); rig.lookAt(p.x, p.z); } else rig.lookAt(null); }
        if (q.mood) rig.mood(q.mood);
        if (q.anim) rig.play(q.anim);
        return;
      }
      case 'shake': if (!instant && !s.reduced) s.shakeCamera(q.amount); return;
      case 'mood': s.setMood(q.k); return;
      case 'banner': this.bannerUntil = r.t + 3.4; this.publish({ banner: { title: q.title, sub: q.sub, kind: q.kind ?? 'quest' } }); if (instant) this.bannerUntil = Math.max(this.bannerUntil, r.t + 3.4); return;
    }
  }
}
