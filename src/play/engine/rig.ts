/**
 * CHARACTERS: one procedural rig for people and robots (no downloaded models: small, fast and original). A rig is a few primitives on pivots;
 * poses (idle, walk, run, jump) and one-shot animations (interact, damage, success, wave, cast, think) are functions of time, so every NPC,
 * the player and a robot share the same animation code.
 */
import { Group, Mesh, MeshBasicMaterial, CircleGeometry } from 'three';
import type { NpcLook } from '../logic/dialogue';
import type { Pose } from '../logic/movement';
import { mat, shape } from './kit';

export type OneShot = 'interact' | 'damage' | 'success' | 'wave' | 'cast' | 'think' | 'cheer';

const ONE_SHOT_LEN: Record<OneShot, number> = { interact: 0.6, damage: 0.7, success: 1.4, wave: 1.2, cast: 0.9, think: 1.6, cheer: 1.4 };
const blobGeo = new CircleGeometry(0.45, 14);
const blobMat = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });

export interface Rig {
  group: Group;
  /** Call every frame. `speed` is horizontal speed (m/s) so the legs match the ground. */
  update(dt: number, pose: Pose, speed: number): void;
  play(anim: OneShot): void;
  /** Tint the whole character (damage flash). */
  flash(on: boolean): void;
  /** Turn the head toward a point in world space (NPCs watch the player). */
  lookAt(x: number, z: number): void;
  height: number;
}

const HAT: Record<string, (c: number) => Group> = {
  hardhat: (c) => { const g = new Group(); g.add(shape('sphere', 0.44, 0.26, 0.44, c, { y: 0 }), shape('box', 0.5, 0.04, 0.5, c, { y: -0.02 })); return g; },
  cap: (c) => { const g = new Group(); g.add(shape('sphere', 0.42, 0.22, 0.42, c, { y: 0 }), shape('box', 0.3, 0.03, 0.22, c, { y: 0, z: 0.24 })); return g; },
  wizard: (c) => { const g = new Group(); g.add(shape('cone', 0.5, 0.75, 0.5, c, { y: 0.02 }), shape('cyl', 0.72, 0.04, 0.72, c, { y: 0 })); return g; },
  hood: (c) => { const g = new Group(); g.add(shape('sphere', 0.5, 0.5, 0.52, c, { y: -0.12 })); return g; },
  visor: (c) => { const g = new Group(); g.add(shape('box', 0.42, 0.1, 0.06, c, { y: 0.08, z: 0.19, glow: 0.9 })); return g; },
  helmet: (c) => { const g = new Group(); g.add(shape('sphere', 0.46, 0.4, 0.46, c, { y: -0.05 })); return g; },
  headband: (c) => { const g = new Group(); g.add(shape('cyl', 0.42, 0.06, 0.42, c, { y: 0.06 })); return g; },
};

/** Build a person or robot. Units: about 1.7 m tall at scale 1. */
export function createRig(look: NpcLook, o: { shadow?: boolean } = {}): Rig {
  const robot = look.shape === 'robot';
  const s = look.scale ?? 1;
  const root = new Group();
  const body = new Group();
  root.add(body);
  if (o.shadow !== false) { const b = new Mesh(blobGeo, blobMat); b.rotation.x = -Math.PI / 2; b.position.y = 0.02; b.scale.setScalar(s); root.add(b); }

  const legL = new Group(), legR = new Group(), armL = new Group(), armR = new Group(), headG = new Group();
  const skin = look.head, cloth = look.body, trim = look.accent;
  // torso and head
  const torso = robot ? shape('box', 0.6, 0.62, 0.42, cloth, { y: 0.78 }) : shape('box', 0.52, 0.62, 0.3, cloth, { y: 0.78 });
  body.add(torso);
  if (!robot) body.add(shape('box', 0.54, 0.08, 0.32, trim, { y: 0.78 })); // belt / trim
  else body.add(shape('box', 0.3, 0.2, 0.05, trim, { y: 0.98, z: 0.22, glow: 0.8 })); // chest light
  headG.position.set(0, 1.42, 0);
  if (robot) {
    headG.add(shape('box', 0.44, 0.36, 0.4, skin, { y: -0.18 }), shape('box', 0.34, 0.1, 0.05, trim, { y: -0.06, z: 0.21, glow: 1.1 }), shape('cyl', 0.03, 0.22, 0.03, skin, { y: 0.16 }), shape('sphere', 0.08, 0.08, 0.08, trim, { y: 0.36, glow: 1 }));
  } else {
    headG.add(shape('sphere', 0.34, 0.36, 0.34, skin, { y: -0.18 }), shape('sphere', 0.05, 0.05, 0.05, 0x1b1b2f, { x: -0.08, y: -0.06, z: 0.15, cast: false }), shape('sphere', 0.05, 0.05, 0.05, 0x1b1b2f, { x: 0.08, y: -0.06, z: 0.15, cast: false }));
    if (look.hair !== undefined) headG.add(shape('sphere', 0.37, 0.25, 0.37, look.hair, { y: -0.02, z: -0.03 }), shape('box', 0.3, 0.12, 0.06, look.hair, { y: -0.2, z: -0.17 }));
    if (look.hat && look.hat !== 'none') { const hat = HAT[look.hat]!(trim); hat.position.set(0, 0.06, 0); headG.add(hat); }
  }
  body.add(headG);
  // limbs on pivots (shoulder/hip), hanging down
  const limb = (g: Group, x: number, y: number, w: number, h: number, c: number, hand?: number) => {
    g.position.set(x, y, 0);
    g.add(shape('box', w, h, w, c, { y: -h }));
    if (hand !== undefined) g.add(shape('sphere', w * 1.1, w * 1.1, w * 1.1, hand, { y: -h - w * 0.5 }));
    body.add(g);
  };
  limb(armL, -0.36, 1.36, 0.14, 0.58, cloth, robot ? trim : skin);
  limb(armR, 0.36, 1.36, 0.14, 0.58, cloth, robot ? trim : skin);
  limb(legL, -0.14, 0.78, 0.17, 0.78, robot ? trim : 0x2a2f45);
  limb(legR, 0.14, 0.78, 0.17, 0.78, robot ? trim : 0x2a2f45);
  root.scale.setScalar(s);

  let t = 0, oneShot: OneShot | null = null, oneT = 0, flashing = false;
  const body0 = body.position.y;

  return {
    group: root,
    height: 1.7 * s,
    play(a) { oneShot = a; oneT = 0; },
    flash(on) {
      if (on === flashing) return;
      flashing = on;
      root.traverse((c) => {
        const m = c as Mesh;
        if (!m.isMesh || m.material === blobMat) return;
        if (on) { m.userData.orig ??= m.material; m.material = mat(0xff4d4d, 0.9); } else if (m.userData.orig) m.material = m.userData.orig;
      });
    },
    lookAt(x, z) {
      const dx = x - root.position.x, dz = z - root.position.z;
      const target = Math.atan2(dx, dz) - root.rotation.y; // head yaw relative to body
      let d = target;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      headG.rotation.y += (Math.max(-0.9, Math.min(0.9, d)) - headG.rotation.y) * 0.15;
    },
    update(dt, pose, speed) {
      t += dt;
      let swing = 0, bob = 0, lean = 0, armUp = 0, squash = 0;
      if (pose === 'walk' || pose === 'run') {
        const f = pose === 'run' ? 11 : 7.5;
        swing = Math.sin(t * f * (0.6 + speed * 0.08)) * (pose === 'run' ? 0.95 : 0.6);
        bob = Math.abs(Math.sin(t * f * 0.5 * (0.6 + speed * 0.08))) * (pose === 'run' ? 0.07 : 0.04);
        lean = pose === 'run' ? 0.22 : 0.05;
      } else if (pose === 'jump') { swing = 0.7; armUp = 1.4; squash = 0; }
      else { bob = Math.sin(t * 2) * 0.012; }
      legL.rotation.x = swing; legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.9 - armUp; armR.rotation.x = swing * 0.9 - armUp;
      body.position.y = body0 + bob + squash;
      body.rotation.x = lean;
      let headBob = 0;
      if (oneShot) {
        oneT += dt;
        const len = ONE_SHOT_LEN[oneShot];
        const k = Math.min(1, oneT / len);
        const pulse = Math.sin(k * Math.PI);
        switch (oneShot) {
          case 'interact': armR.rotation.x = -1.3 * pulse; break;
          case 'damage': body.rotation.x = -0.5 * pulse; body.position.x = Math.sin(oneT * 50) * 0.04 * (1 - k); armL.rotation.z = 0.8 * pulse; armR.rotation.z = -0.8 * pulse; break;
          case 'success': case 'cheer': armL.rotation.x = -2.6 * pulse; armR.rotation.x = -2.6 * pulse; body.position.y = body0 + Math.abs(Math.sin(k * Math.PI * 2)) * 0.22; break;
          case 'wave': armR.rotation.x = -2.5; armR.rotation.z = Math.sin(oneT * 10) * 0.45 * pulse; break;
          case 'cast': armR.rotation.x = -1.6 * pulse; armL.rotation.x = -1.6 * pulse; body.rotation.x = -0.15 * pulse; break;
          case 'think': armR.rotation.x = -1.9 * pulse; headBob = Math.sin(oneT * 3) * 0.08; break;
        }
        if (k >= 1) { oneShot = null; armL.rotation.z = 0; armR.rotation.z = 0; body.position.x = 0; }
      }
      headG.rotation.x = headBob;
    },
  };
}
