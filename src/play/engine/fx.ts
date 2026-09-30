/**
 * EFFECTS: one pooled particle system (sparks, smoke, magic, confetti, dust) and one pooled flash light, shared by every world. An effect is a
 * NAME plus a place; worlds never write their own particle code. The pool has a hard cap so a burst can never cost frames.
 */
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, PointsMaterial, PointLight, type Scene } from 'three';

export type FxKind = 'sparks' | 'smoke' | 'magic' | 'confetti' | 'dust' | 'steam' | 'heal' | 'ember' | 'shield';
interface Def { color: number[]; speed: number; up: number; gravity: number; life: [number, number]; size: number; spread: number }
const DEFS: Record<FxKind, Def> = {
  sparks: { color: [0xffd166, 0xff9f1c, 0xfff1a8], speed: 4.2, up: 2.5, gravity: 9, life: [0.35, 0.9], size: 0.14, spread: 1 },
  smoke: { color: [0x6b7280, 0x4b5563, 0x9ca3af], speed: 0.6, up: 1.2, gravity: -0.3, life: [0.9, 1.8], size: 0.42, spread: 0.6 },
  magic: { color: [0x8be9fd, 0xbd93f9, 0xff79c6, 0xf1fa8c], speed: 1.6, up: 2.2, gravity: -1.2, life: [0.7, 1.4], size: 0.17, spread: 1 },
  confetti: { color: [0xff5d73, 0xffd166, 0x06d6a0, 0x118ab2, 0xef476f], speed: 4.6, up: 5.5, gravity: 6, life: [1, 2], size: 0.17, spread: 1 },
  dust: { color: [0xb8a78c, 0xd9cbb0], speed: 1.4, up: 0.4, gravity: 0.5, life: [0.5, 1], size: 0.3, spread: 1 },
  steam: { color: [0xe5e7eb, 0xf3f4f6], speed: 0.4, up: 2, gravity: -0.6, life: [0.8, 1.5], size: 0.3, spread: 0.3 },
  heal: { color: [0x7dffb3, 0xb8ffd9], speed: 0.8, up: 2, gravity: -1, life: [0.8, 1.4], size: 0.16, spread: 0.6 },
  ember: { color: [0xff7b00, 0xff4500, 0xffb000], speed: 1.2, up: 2.2, gravity: -0.4, life: [0.8, 1.6], size: 0.12, spread: 0.6 },
  shield: { color: [0x4fd1ff, 0x9fe8ff], speed: 2.4, up: 0.6, gravity: 0, life: [0.4, 0.8], size: 0.18, spread: 1 },
};

const MAX = 480;

export class Fx {
  private pos = new Float32Array(MAX * 3);
  private col = new Float32Array(MAX * 3);
  private vel = new Float32Array(MAX * 3);
  private life = new Float32Array(MAX);
  private maxLife = new Float32Array(MAX);
  private grav = new Float32Array(MAX);
  private head = 0;
  private points: Points;
  private flashLight: PointLight;
  private flashT = 0;
  private flashDur = 0.3;
  private flashPeak = 0;
  /** Reduced motion and low quality scale bursts down instead of removing them. */
  density = 1;

  constructor(private scene: Scene) {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(this.pos, 3));
    g.setAttribute('color', new BufferAttribute(this.col, 3));
    for (let i = 0; i < MAX; i++) this.pos[i * 3 + 1] = -999; // parked far below the world
    const m = new PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true });
    this.points = new Points(g, m);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.flashLight = new PointLight(0xffffff, 0, 9, 2);
    scene.add(this.flashLight);
  }

  burst(kind: FxKind, x: number, y: number, z: number, count = 24, scale = 1): void {
    const d = DEFS[kind];
    const n = Math.max(1, Math.round(count * this.density));
    const c = new Color();
    for (let k = 0; k < n; k++) {
      const i = this.head; this.head = (this.head + 1) % MAX;
      const a = Math.random() * Math.PI * 2, r = Math.random() * d.spread * 0.35 * scale;
      this.pos[i * 3] = x + Math.cos(a) * r; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z + Math.sin(a) * r;
      const sp = d.speed * (0.4 + Math.random() * 0.8) * scale;
      this.vel[i * 3] = Math.cos(a) * sp * d.spread; this.vel[i * 3 + 1] = d.up * (0.5 + Math.random()) * Math.min(1.4, scale); this.vel[i * 3 + 2] = Math.sin(a) * sp * d.spread;
      const life = d.life[0] + Math.random() * (d.life[1] - d.life[0]);
      this.life[i] = life; this.maxLife[i] = life; this.grav[i] = d.gravity;
      c.setHex(d.color[Math.floor(Math.random() * d.color.length)]!);
      this.col[i * 3] = c.r; this.col[i * 3 + 1] = c.g; this.col[i * 3 + 2] = c.b;
    }
  }

  /** A quick coloured light pulse at a place (a spark, a spell). */
  flash(x: number, y: number, z: number, color = 0xffd166, intensity = 14, dur = 0.35): void {
    this.flashLight.position.set(x, y, z);
    this.flashLight.color.setHex(color);
    this.flashPeak = intensity; this.flashDur = dur; this.flashT = dur;
  }

  update(dt: number): void {
    let alive = false;
    for (let i = 0; i < MAX; i++) {
      if (this.life[i]! <= 0) continue;
      alive = true;
      this.life[i]! -= dt;
      const k = Math.max(0, this.life[i]! / this.maxLife[i]!);
      this.vel[i * 3 + 1]! -= this.grav[i]! * dt;
      this.pos[i * 3]! += this.vel[i * 3]! * dt; this.pos[i * 3 + 1]! += this.vel[i * 3 + 1]! * dt; this.pos[i * 3 + 2]! += this.vel[i * 3 + 2]! * dt;
      // fade by darkening (additive blending: black adds nothing)
      const f = Math.min(1, k * 1.6);
      this.col[i * 3]! *= 1 - (1 - f) * 0.15; this.col[i * 3 + 1]! *= 1 - (1 - f) * 0.15; this.col[i * 3 + 2]! *= 1 - (1 - f) * 0.15;
      if (this.life[i]! <= 0) this.pos[i * 3 + 1] = -999;
    }
    if (alive) {
      (this.points.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
      (this.points.geometry.getAttribute('color') as BufferAttribute).needsUpdate = true;
    }
    if (this.flashT > 0) { this.flashT -= dt; this.flashLight.intensity = Math.max(0, this.flashT / this.flashDur) * this.flashPeak; } else this.flashLight.intensity = 0;
  }

  dispose(): void {
    this.scene.remove(this.points, this.flashLight);
    this.points.geometry.dispose();
    (this.points.material as PointsMaterial).dispose();
  }
}
