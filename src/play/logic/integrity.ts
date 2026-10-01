/**
 * WORLD INTEGRITY (pure): finds the mistakes that make a place feel unfinished before a player does. It looks only at scene DATA (what is
 * placed where, which footprints block): somebody standing inside a crate, two solid props sharing the same floor, a gap that looks wide enough
 * for a person and is not, a room a player can see but cannot reach. The same rules run in Node as a test; the browser-side check
 * (engine/integrity.ts) compares these footprints with the real meshes.
 */
import { buildGrid, findPath } from './path';
import { PLAYER_RADIUS, pushOut } from './movement';
import type { Collider, Prop, SceneDef } from './sceneTypes';

export interface Issue { scene: string; kind: string; what: string }

/** A solid prop's footprint, remembering which prop it belongs to. */
export function footprints(scene: SceneDef): { prop: Prop; c: Collider }[] {
  const out: { prop: Prop; c: Collider }[] = [];
  for (const p of scene.props) {
    if (!p.solid) continue;
    const s = typeof p.solid === 'object' ? p.solid : { w: Number(p.p?.w ?? 1), d: Number(p.p?.d ?? 1), h: p.p?.h === undefined ? undefined : Number(p.p.h) };
    const rot = Math.abs(Math.sin(p.ry ?? 0)) > 0.7;
    out.push({ prop: p, c: { kind: 'box', x: p.x, z: p.z, w: rot ? s.d : s.w, d: rot ? s.w : s.d, h: s.h } });
  }
  return out;
}

const inside = (c: Collider, x: number, z: number, margin: number): boolean => (c.kind === 'circle' ? Math.hypot(x - c.x, z - c.z) < c.r + margin : Math.abs(x - c.x) < c.w / 2 + margin && Math.abs(z - c.z) < c.d / 2 + margin);

/** Distance between two box footprints (0 when they touch or overlap), and the overlapped area. */
function boxGap(a: Extract<Collider, { kind: 'box' }>, b: Extract<Collider, { kind: 'box' }>): { gap: number; area: number } {
  const dx = Math.abs(a.x - b.x) - (a.w + b.w) / 2, dz = Math.abs(a.z - b.z) - (a.d + b.d) / 2;
  if (dx < 0 && dz < 0) return { gap: 0, area: -dx * -dz };
  return { gap: Math.hypot(Math.max(dx, 0), Math.max(dz, 0)), area: 0 };
}

const label = (p: Prop) => `${p.kind}${p.id ? `#${p.id}` : ''}@(${p.x},${p.z})`;

export function sceneIssues(scene: SceneDef): Issue[] {
  const out: Issue[] = [];
  const add = (kind: string, what: string) => out.push({ scene: scene.id, kind, what });
  const fps = footprints(scene);
  const solids = [...fps.map((f) => f.c), ...(scene.walls ?? [])];

  // 1. nobody is placed inside something solid (a spawn would trap the player; an NPC would stand in a crate)
  for (const [name, sp] of Object.entries(scene.spawns)) for (const f of fps) if (f.prop.kind !== 'door' && inside(f.c, sp.x, sp.z, PLAYER_RADIUS * 0.9)) add('spawn-in-solid', `spawn ${name} is inside ${label(f.prop)}`);
  for (const n of scene.npcs) for (const pt of [{ x: n.x, z: n.z }, ...(n.patrol ?? [])]) for (const f of fps) if (inside(f.c, pt.x, pt.z, 0.35)) add('npc-in-solid', `${n.npc} stands inside ${label(f.prop)}`);
  for (const [name, sp] of Object.entries(scene.spawns)) if (sp.x < scene.bounds.minX || sp.x > scene.bounds.maxX || sp.z < scene.bounds.minZ || sp.z > scene.bounds.maxZ) add('spawn-out-of-bounds', `spawn ${name}`);

  // 2. solid props do not overlap each other (two things cannot be in the same place), and no gap between them is a trap
  for (let i = 0; i < fps.length; i++) for (let j = i + 1; j < fps.length; j++) {
    const a = fps[i]!, b = fps[j]!;
    if (a.c.kind !== 'box' || b.c.kind !== 'box') continue;
    if (a.prop.kind === 'wall' || b.prop.kind === 'wall' || a.prop.kind === 'door' || b.prop.kind === 'door') continue; // walls meet doors and each other by design
    const { gap, area } = boxGap(a.c, b.c);
    const small = Math.min(a.c.w * a.c.d, b.c.w * b.c.d);
    if (area > 0.25 * small && area > 0.3) add('solid-overlap', `${label(a.prop)} and ${label(b.prop)} overlap (${area.toFixed(2)} m²)`);
    else if (gap > 0.02 && gap < PLAYER_RADIUS * 2 + 0.05) add('tight-gap', `${label(a.prop)} and ${label(b.prop)} leave a ${gap.toFixed(2)} m gap: looks passable, is not`);
  }

  // 3. every place a player is meant to go can be reached from every spawn, and no walkable pocket is cut off
  const grid = buildGrid(scene.bounds, [...solids], PLAYER_RADIUS + 0.07);
  const targets = [...scene.exits.map((e) => ({ x: e.x, z: e.z, n: `exit ${e.id}` })), ...scene.interactables.map((i) => ({ x: i.x, z: i.z, n: `interactable ${i.id}` })), ...scene.npcs.map((n) => ({ x: n.x, z: n.z, n: `npc ${n.npc}` }))];
  const start = Object.values(scene.spawns)[0];
  if (start) for (const t of targets) if (!findPath(grid, start, t)) add('unreachable', `${t.n} cannot be reached on foot from the first spawn`);
  return out;
}

/** Push a point out of every collider the way the player would be (used to prove a spawn is walkable). */
export function settles(scene: SceneDef, x: number, z: number): [number, number] {
  let p: [number, number] = [x, z];
  for (const f of footprints(scene)) p = pushOut(p[0], p[1], PLAYER_RADIUS, f.c);
  return p;
}
