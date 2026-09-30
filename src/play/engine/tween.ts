/** A tiny tween runner: no dependencies, no allocation per frame beyond the active list. Everything animated in the world goes through it, so pausing or reducing motion is one switch. */
export type Ease = (t: number) => number;
export const ease = {
  linear: (t: number) => t,
  out: (t: number) => 1 - (1 - t) * (1 - t),
  inOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  back: (t: number) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  bounce: (t: number) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
};

interface Job { t: number; dur: number; delay: number; fn: (k: number) => void; ease: Ease; done?: () => void }

export class Tweens {
  private jobs: Job[] = [];
  /** When true, animations jump straight to their end (reduced motion): the state still changes, it just does not move. */
  instant = false;
  add(dur: number, fn: (k: number) => void, o: { delay?: number; ease?: Ease; done?: () => void } = {}): void {
    if (this.instant) { fn(1); o.done?.(); return; }
    this.jobs.push({ t: 0, dur: Math.max(0.0001, dur), delay: o.delay ?? 0, fn, ease: o.ease ?? ease.inOut, done: o.done });
  }
  /** Run `fn` after `seconds`. */
  after(seconds: number, fn: () => void): void { if (this.instant) fn(); else this.jobs.push({ t: 0, dur: 0.0001, delay: seconds, fn: () => undefined, ease: ease.linear, done: fn }); }
  update(dt: number): void {
    for (let i = this.jobs.length - 1; i >= 0; i--) {
      const j = this.jobs[i]!;
      if (j.delay > 0) { j.delay -= dt; continue; }
      j.t += dt;
      const k = Math.min(1, j.t / j.dur);
      j.fn(j.ease(k));
      if (k >= 1) { this.jobs.splice(i, 1); j.done?.(); }
    }
  }
  get busy(): boolean { return this.jobs.length > 0; }
  clear(): void { this.jobs.length = 0; }
}
