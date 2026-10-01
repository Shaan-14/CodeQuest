import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Regression for "Cannot access 'col' before initialization" in the real (dev-server) browser. A circular import between builders.ts and its
 * builder tables only fails when modules load in the unbundled order the dev server uses; the production bundle orders them differently, so the
 * built-app e2e did not notice (e2e/dev3d.mjs now also starts the world on the dev server). This test forbids runtime import cycles in src/play.
 * `import type` is erased by TypeScript and is allowed.
 */
const root = new URL('..', import.meta.url).pathname;
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? files(join(dir, d.name)) : /\.tsx?$/.test(d.name) && !/\.test\./.test(d.name) ? [join(dir, d.name)] : []);
const resolve = (from: string, spec: string): string | null => {
  if (!spec.startsWith('.')) return null;
  const base = join(from, '..', spec);
  for (const c of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) { try { readFileSync(c); return c; } catch { /* next */ } }
  return null;
};
const graph = new Map<string, string[]>();
for (const f of files(root)) {
  const src = readFileSync(f, 'utf8');
  const deps: string[] = [];
  for (const m of src.matchAll(/^(?:import|export)\s+(?!type\b)([^;]*?)\s+from\s+'([^']+)'/gm)) {
    if (/^\{[^}]*\}$/.test(m[1]!.trim()) && m[1]!.replace(/[{}]/g, '').split(',').every((n) => /^\s*type\s/.test(n) || !n.trim())) continue; // only type specifiers: erased
    const r = resolve(f, m[2]!); if (r) deps.push(r);
  }
  graph.set(f, deps);
}

describe('src/play has no runtime import cycles', () => {
  it('finds none', () => {
    const state = new Map<string, 1 | 2>(); const cycles: string[] = [];
    const visit = (f: string, path: string[]) => {
      if (state.get(f) === 2) return;
      if (state.get(f) === 1) { cycles.push([...path.slice(path.indexOf(f)), f].map((p) => p.replace(root, '')).join(' -> ')); return; }
      state.set(f, 1);
      for (const d of graph.get(f) ?? []) if (graph.has(d)) visit(d, [...path, f]);
      state.set(f, 2);
    };
    for (const f of graph.keys()) visit(f, []);
    expect(cycles).toEqual([]);
  });
});
