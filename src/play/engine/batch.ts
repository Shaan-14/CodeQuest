/**
 * STATIC BATCHING: a prop built from forty small boxes (a shelf, a machine) costs forty draw calls. When nothing about it ever moves, its pieces
 * are merged per material into a handful of meshes at load time, which cuts the draw calls of a busy room roughly in half without changing
 * how it looks. Props that animate (they have a controller or a tick) are never batched.
 */
import { Matrix4, Mesh, type BufferGeometry, type Material, type Object3D } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** A private copy without an index: merged pieces must all be indexed or none (the primitives differ). */
export const flat = (g: BufferGeometry): BufferGeometry => (g.index ? g.toNonIndexed() : g.clone());

export function batchStatic(root: Object3D): void {
  root.updateWorldMatrix(true, true);
  const inv = new Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map<Material, BufferGeometry[]>();
  const meshes: Mesh[] = [];
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh || (m as unknown as { isInstancedMesh?: boolean }).isInstancedMesh || Array.isArray(m.material) || !m.visible) return;
    const g = flat(m.geometry); g.applyMatrix4(new Matrix4().multiplyMatrices(inv, m.matrixWorld));
    const list = groups.get(m.material); if (list) list.push(g); else groups.set(m.material, [g]);
    meshes.push(m);
  });
  if (meshes.length < 3) return; // nothing to gain
  for (const m of meshes) m.parent?.remove(m);
  for (const [material, list] of groups) {
    const merged = list.length === 1 ? list[0]! : mergeGeometries(list, false);
    if (!merged) continue;
    const mesh = new Mesh(merged, material); mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh);
    if (list.length > 1) for (const g of list) g.dispose(); // the per-piece clones are no longer needed
  }
}
