/**
 * COLLISION FROM THE REAL SHAPE: what blocks the player is derived from the meshes a prop is built from, not from a size somebody typed next to
 * it. The parts a person would bump into (anything that occupies the height of a walking body: the trunk, not the crown; the two legs of an
 * archway, not the opening) become small footprints, merged where they touch. A scene may still say `solid: false` to opt out, and a few
 * kinds are solid without being asked (a tree, a lamp post, a gateway). Round things get a circle so a corner never snags.
 */
import { Box3, type Object3D, type Mesh } from 'three';
import type { Collider, Prop } from '../logic/sceneTypes';

/** Kinds that always block, even when a scene forgot to say so. */
export const AUTO_SOLID = new Set(['tree', 'glowtree', 'lamppost', 'crystal', 'archway', 'gateway', 'dock', 'castleWall', 'hound', 'stands', 'lightTower', 'startGantry', 'fountain', 'statue', 'well', 'tower', 'pitbuilding', 'timingtower', 'tyreStack', 'pitwall', 'liftStand', 'tyreRack', 'dugout', 'backstop', 'tunnel', 'bench', 'kiosk']);
/** Never fitted: thin walls and doors are exact already, and the rest are not objects a person bumps into. */
const NOT_FITTED = new Set(['wall', 'door', 'floor', 'floorMetal', 'floorEmblem', 'ground', 'glowstrip', 'hazardstrip', 'pond', 'void', 'sign', 'screen', 'statusScreen', 'banner', 'hologram', 'cable', 'pipe', 'warnlight', 'monitorwall', 'drone', 'circuit']);
/** Footprints that are round in the world: they get a circle. */
const ROUND = new Set(['tree', 'glowtree', 'lamppost', 'crystal', 'barrel', 'pillar', 'fountain', 'statue', 'well', 'lightTower', 'tyreStack']);

/** The band of heights a walking body meets: below knee height is stepped over, above the head is walked under. */
const LO = 0.3, HI = 0.85;
const box = new Box3();

interface Rect { x0: number; x1: number; z0: number; z1: number; top: number }

const near = (a: Rect, b: Rect, g: number): boolean => a.x0 - g <= b.x1 && b.x0 - g <= a.x1 && a.z0 - g <= b.z1 && b.z0 - g <= a.z1;
const join = (a: Rect, b: Rect): Rect => ({ x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), z0: Math.min(a.z0, b.z0), z1: Math.max(a.z1, b.z1), top: Math.max(a.top, b.top) });

/** The colliders of one built prop (empty when nothing of it reaches walking height). */
export function fitColliders(obj: Object3D, p: Prop): Collider[] {
  if (p.solid === false || NOT_FITTED.has(p.kind) || (!p.solid && !AUTO_SOLID.has(p.kind))) return [];
  const rects: Rect[] = [];
  obj.updateWorldMatrix(true, true);
  obj.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh || !m.visible) return;
    box.setFromObject(m);
    if (box.isEmpty() || !Number.isFinite(box.min.x + box.max.x + box.min.z + box.max.z)) return;
    if (box.min.y > HI || box.max.y < LO) return;
    if (box.max.x - box.min.x < 0.08 && box.max.z - box.min.z < 0.08) return; // a wire or a rod is not a wall
    rects.push({ x0: box.min.x, x1: box.max.x, z0: box.min.z, z1: box.max.z, top: box.max.y });
  });
  if (!rects.length) return [];
  // merge parts that touch (legs under a tabletop become the tabletop's footprint; the two sides of an archway stay apart)
  let merged = rects;
  for (let again = true; again;) {
    again = false; const out: Rect[] = [];
    for (const r of merged) { const hit = out.findIndex((q) => near(q, r, 0.05)); if (hit >= 0) { out[hit] = join(out[hit]!, r); again = true; } else out.push(r); }
    merged = out;
  }
  if (merged.length > 6) merged = [merged.reduce(join)];
  const round = ROUND.has(p.kind);
  return merged.map((r): Collider => {
    const w = r.x1 - r.x0, d = r.z1 - r.z0, x = (r.x0 + r.x1) / 2, z = (r.z0 + r.z1) / 2;
    const h = r.top > 1.7 ? undefined : r.top; // anything a jump could clear keeps its height
    if (round && merged.length === 1) return { kind: 'circle', x, z, r: Math.max(0.12, Math.max(w, d) / 2) };
    return { kind: 'box', x, z, w, d, h };
  });
}
