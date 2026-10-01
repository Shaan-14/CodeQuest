/**
 * THE GUIDE: the objective made visible without a giant arrow on the screen. A trail of soft chevrons runs along the ground toward where the
 * story goes next (around walls, through the right doorway), a slim column of light and a ring mark the place itself, and both fade out as
 * the player arrives. It never says HOW to do anything; it only answers "where?".
 */
import { AdditiveBlending, CylinderGeometry, DoubleSide, Group, InstancedMesh, Mesh, MeshBasicMaterial, Object3D, RingGeometry, Shape, ShapeGeometry, type Scene } from 'three';
import { sampleAlong, type P2 } from '../logic/path';

const COUNT = 40;
const chevron = (() => { const s = new Shape(); s.moveTo(0, 0.34); s.lineTo(0.3, -0.18); s.lineTo(0, -0.04); s.lineTo(-0.3, -0.18); s.closePath(); const g = new ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.userData.shared = true; return g; })();
const GOLD = 0xffd166, CYAN = 0x6ee7ff;

export class Guide {
  private trail: InstancedMesh;
  private beam = new Group();
  private pillar: Mesh; private ring: Mesh;
  private trailMat = new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.95, depthWrite: false, side: DoubleSide });
  private pillarMat = new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.22, depthWrite: false, blending: AdditiveBlending, side: DoubleSide });
  private ringMat = new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.7, depthWrite: false, blending: AdditiveBlending, side: DoubleSide });
  private dummy = new Object3D();
  private path: P2[] | null = null;
  private target: { x: number; z: number; via: boolean } | null = null;
  /** Where along the path the trail starts, so it flows ahead of the player. */
  private flow = 0;
  enabled = true;

  constructor(private scene: Scene) {
    this.trail = new InstancedMesh(chevron, this.trailMat, COUNT);
    this.trail.frustumCulled = false; this.trail.count = 0; this.trail.renderOrder = 2;
    const ringGeo = new RingGeometry(0.9, 1.15, 40); ringGeo.rotateX(-Math.PI / 2);
    const pillarGeo = new CylinderGeometry(0.16, 0.5, 15, 14, 1, true); pillarGeo.translate(0, 7.5, 0);
    this.ring = new Mesh(ringGeo, this.ringMat); this.ring.position.y = 0.06;
    this.pillar = new Mesh(pillarGeo, this.pillarMat);
    this.beam.add(this.ring, this.pillar); this.beam.visible = false;
    scene.add(this.trail, this.beam);
  }

  setTarget(t: { x: number; z: number; via: boolean } | null): void {
    this.target = t;
    const c = t?.via ? CYAN : GOLD;
    this.trailMat.color.setHex(c); this.pillarMat.color.setHex(c); this.ringMat.color.setHex(c);
    if (t) this.beam.position.set(t.x, 0, t.z); else { this.beam.visible = false; this.trail.count = 0; }
  }
  setPath(p: P2[] | null): void { this.path = p; }

  update(dt: number, t: number, px: number, pz: number, reduced: boolean): void {
    const tg = this.target;
    if (!tg || !this.enabled) { this.beam.visible = false; this.trail.count = 0; return; }
    const dist = Math.hypot(tg.x - px, tg.z - pz);
    const fade = Math.max(0, Math.min(1, (dist - 3) / 3)); // gone when the player has arrived
    this.beam.visible = fade > 0.01;
    this.pillarMat.opacity = 0.22 * fade * (reduced ? 1 : 0.8 + 0.2 * Math.sin(t * 2.4));
    this.ringMat.opacity = 0.7 * fade;
    const rs = reduced ? 1 : 1 + 0.12 * Math.sin(t * 3); this.ring.scale.set(rs, 1, rs);
    this.flow = reduced ? 0 : (this.flow + dt * 1.6) % 1.4;
    const pts = this.path ? sampleAlong(this.path, 1.4, 1.1 + this.flow, 24) : [];
    let n = 0;
    for (let i = 0; i < pts.length && n < COUNT; i++) {
      const p = pts[i]!, k = 1 - i / Math.max(1, pts.length);       // nearer dots are bigger and brighter
      const pulse = reduced ? 1 : 0.8 + 0.2 * Math.sin(t * 5 - i * 0.7);
      const s = (0.55 + 0.6 * k) * pulse * Math.min(1, fade * 2 + 0.2);
      this.dummy.position.set(p.x, 0.07, p.z); this.dummy.rotation.set(0, p.dir, 0); this.dummy.scale.set(s, 1, s); this.dummy.updateMatrix();
      this.trail.setMatrixAt(n++, this.dummy.matrix);
    }
    this.trail.count = n; this.trail.instanceMatrix.needsUpdate = true;
    this.trailMat.opacity = fade > 0.01 ? 0.9 : 0;
  }

  dispose(): void {
    this.scene.remove(this.trail, this.beam);
    this.trail.dispose(); this.ring.geometry.dispose(); this.pillar.geometry.dispose();
    this.trailMat.dispose(); this.pillarMat.dispose(); this.ringMat.dispose();
  }
}
