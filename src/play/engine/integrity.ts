/**
 * BROWSER-SIDE WORLD INTEGRITY: compares what a scene LOOKS like (the real meshes) with what blocks the player (the colliders), because the
 * two drift apart as scenes are dressed. Loaded only by the test hook (`window.__cq3d.integrity`), never at startup. The pure, data-only
 * half lives in logic/integrity.ts.
 */
import { Box3, type Object3D } from 'three';
import type { Stage } from './stage';
import type { Collider } from '../logic/sceneTypes';
import { PLAYER_RADIUS } from '../logic/movement';

export interface MeshIssue { scene: string; kind: string; what: string }

/** Flat things (floors, glow strips, decals) and things that are not objects in the room. */
const FLAT = new Set(['floor', 'floorMetal', 'floorEmblem', 'ground', 'glowstrip', 'hazardstrip', 'void', 'pond', 'circuit', 'peak', 'mountain', 'dome', 'team']);
/** Things hung from a ceiling or fixed to a wall: not expected to touch the ground. */
const HUNG = new Set(['toolrack', 'bolt', 'car', 'runes', 'lamparm', 'monitorwall', 'warnlight', 'pipe', 'cable', 'sign', 'screen', 'statusScreen', 'banner', 'drone', 'hologram', 'beacon', 'flags', 'bunting', 'chandelier', 'lantern']);
/** Things a player is meant to walk through or over. */
const PASSABLE = new Set(['wall', 'door', 'gateway', 'doorway', 'arch', 'rug', 'path', 'bridge', 'gate', 'stairs', 'ramp', 'tent', 'hazardstrip', 'cones', 'bush', 'planter', 'grass', 'flowers', 'pennant']);

const coveredBy = (c: Collider, x: number, z: number, m: number): boolean => (c.kind === 'circle' ? Math.hypot(x - c.x, z - c.z) < c.r + m : Math.abs(x - c.x) < c.w / 2 + m && Math.abs(z - c.z) < c.d / 2 + m);

export function meshIssues(stage: Stage): MeshIssue[] {
  const def = stage.def; if (!def) return [];
  const out: MeshIssue[] = [];
  const add = (kind: string, what: string) => out.push({ scene: def.id, kind, what });
  const colliders = stage.solidColliders;
  const boxes: { id: string; box: Box3; tall: boolean }[] = [];
  const floaters: { box: Box3; text: string }[] = [];
  const tmp = new Box3();
  const label = (k: string, id: string | undefined, x: number, z: number) => `${k}${id ? `#${id}` : ''}@(${x},${z})`;
  for (const { p, obj } of stage.built) {
    if (FLAT.has(p.kind)) continue;
    tmp.setFromObject(obj as Object3D);
    if (tmp.isEmpty()) continue;
    const box = tmp.clone();
    const dx = box.max.x - box.min.x, dy = box.max.y - box.min.y, dz = box.max.z - box.min.z;
    if (!Number.isFinite(dx + dy + dz)) { add('bad-bounds', label(p.kind, p.id, p.x, p.z)); continue; }
    const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
    const tall = dy > 1.0 && Math.min(dx, dz) > 0.35;
    boxes.push({ id: label(p.kind, p.id, p.x, p.z), box, tall });
    const name = label(p.kind, p.id, p.x, p.z);
    // floating / sunken
    if (!HUNG.has(p.kind) && p.kind !== 'tree' && box.min.y > 0.45 && dy < 6) floaters.push({ box, text: `${name} hangs ${box.min.y.toFixed(2)} m above the ground (height ${dy.toFixed(2)})` });
    if (box.min.y < -0.7 && box.max.y < 1.5) add('sunken', `${name} sinks to ${box.min.y.toFixed(2)} m`);
    // outside the place
    const b = def.bounds;
    if (cx < b.minX - 6 || cx > b.maxX + 6 || cz < b.minZ - 6 || cz > b.maxZ + 6) add('far-outside', `${name} stands well outside the walkable area`);
    if (!tall || PASSABLE.has(p.kind) || HUNG.has(p.kind)) continue;
    // a tall thing a player can walk straight through
    const solidHere = colliders.some((c) => coveredBy(c, cx, cz, Math.max(dx, dz) * 0.5 + 0.2));
    if (!solidHere) add('walk-through', `${name} looks solid (${dx.toFixed(1)}×${dz.toFixed(1)}×${dy.toFixed(1)} m) but nothing blocks it`);
  }
  // nobody is placed inside something that blocks
  for (const [name, sp] of Object.entries(def.spawns)) for (const c of colliders) if (coveredBy(c, sp.x, sp.z, PLAYER_RADIUS * 0.8)) add('spawn-in-solid', `spawn ${name} is inside a collider at (${(c as { x: number }).x.toFixed(1)}, ${(c as { z: number }).z.toFixed(1)})`);
  for (const n of stage.npcSpots) for (const c of colliders) if (coveredBy(c, n.x, n.z, 0.3)) add('npc-in-solid', `${n.id} stands inside a collider at (${(c as { x: number }).x.toFixed(1)}, ${(c as { z: number }).z.toFixed(1)})`);
  // people stand on open ground, not inside a thing
  for (const n of stage.npcSpots) for (const t of boxes) {
    if (!t.tall) continue;
    if (n.x > t.box.min.x + 0.15 && n.x < t.box.max.x - 0.15 && n.z > t.box.min.z + 0.15 && n.z < t.box.max.z - 0.15) add('npc-in-mesh', `${n.id} stands inside ${t.id}`);
  }
  // the player's own spawn
  for (const [name, sp] of Object.entries(def.spawns)) for (const t of boxes) if (t.tall && sp.x > t.box.min.x - PLAYER_RADIUS * 0.5 && sp.x < t.box.max.x + PLAYER_RADIUS * 0.5 && sp.z > t.box.min.z - PLAYER_RADIUS * 0.5 && sp.z < t.box.max.z + PLAYER_RADIUS * 0.5) add('spawn-in-mesh', `spawn ${name} is inside ${t.id}`);
  // a roof slab or a lintel sits ON something: floating means nothing is under it
  for (const f of floaters) if (!boxes.some((o) => o.box !== f.box && Math.abs(o.box.max.y - f.box.min.y) < 0.12 && f.box.min.x < o.box.max.x && f.box.max.x > o.box.min.x && f.box.min.z < o.box.max.z && f.box.max.z > o.box.min.z)) add('floating', f.text);
  return out;
}

/** Draws every blocking footprint as a translucent red volume (test hook): the quickest way to SEE what blocks and what does not. */
export async function showColliders(stage: Stage, on = true): Promise<number> {
  const { Mesh, BoxGeometry, CylinderGeometry, MeshBasicMaterial, Group } = await import('three');
  const old = stage.scene.getObjectByName('collider-debug'); if (old) stage.scene.remove(old);
  if (!on) return 0;
  const g = new Group(); g.name = 'collider-debug';
  const m = new MeshBasicMaterial({ color: 0xff2040, transparent: true, opacity: 0.35, depthWrite: false });
  let n = 0;
  for (const c of stage.solidColliders) {
    const h = c.h ?? 1.8;
    const mesh = c.kind === 'circle' ? new Mesh(new CylinderGeometry(c.r, c.r, h, 16), m) : new Mesh(new BoxGeometry(c.w, h, c.d), m);
    mesh.position.set(c.x, h / 2, c.z); g.add(mesh); n++;
  }
  stage.scene.add(g);
  return n;
}

/** What is hidden or culled right now: props whose `visible` flag is off, and meshes whose bounding sphere is wrong or that the frustum rejects although their box is in view. */
export async function visibilityNow(stage: Stage): Promise<{ hidden: string[]; badBounds: string[]; culled: string[] }> {
  const { Frustum, Matrix4, Sphere, Mesh } = await import('three');
  const cam = (stage as unknown as { camera: import('three').PerspectiveCamera }).camera;
  cam.updateMatrixWorld(true);
  const fr = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  const hidden: string[] = [], badBounds: string[] = [], culled: string[] = [];
  for (const { p, obj } of stage.built) {
    const name = `${p.kind}${p.id ? `#${p.id}` : ''}@(${p.x},${p.z})`;
    if (!obj.visible) hidden.push(name);
    obj.traverse((o) => {
      const m = o as import('three').Mesh;
      if (!(m instanceof Mesh) || !m.geometry) return;
      
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      const gs = m.geometry.boundingSphere!;
      // the sphere must contain the box corners (a stale sphere makes a big mesh vanish when the camera is close)
      // the sphere must contain EVERY vertex (a stale or tight-but-wrong sphere makes a mesh vanish at the screen edge or when the camera is close)
      const pos = m.geometry.getAttribute('position'); let far = 0;
      for (let i = 0; i < pos.count; i++) far = Math.max(far, Math.hypot(pos.getX(i) - gs.center.x, pos.getY(i) - gs.center.y, pos.getZ(i) - gs.center.z));
      if (far > gs.radius * 1.001 + 0.01) badBounds.push(`${name}: sphere r=${gs.radius.toFixed(2)} but a vertex is ${far.toFixed(2)} from its centre`);
      m.updateWorldMatrix(true, false);
      // culled by the frustum although a vertex of it is in view: the real symptom (not a box corner poking into the view)
      if (m.frustumCulled && o.visible && obj.visible) {
        const sp = new Sphere().copy(gs).applyMatrix4(m.matrixWorld);
        if (!fr.intersectsSphere(sp)) { const v = new (gs.center.constructor as new () => import('three').Vector3)(); const step = Math.max(1, Math.floor(pos.count / 300)); for (let i = 0; i < pos.count; i += step) { v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld); if (fr.containsPoint(v)) { culled.push(`${name}: culled but its geometry is in view`); break; } } }
      }
    });
  }
  return { hidden, badBounds: [...new Set(badBounds)], culled: [...new Set(culled)] };
}
