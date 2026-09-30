import type { Challenge, ChallengeDiagnostics } from './schema';
import { composites, type Composite } from './composites';

/**
 * What a challenge exercises, made explicit for the diagnosis engine. Defaults are derived from `skillIds`
 * (first = primary, the rest = supporting) so old content works unchanged; authored `diagnostics` refine them.
 */
export interface ResolvedDiagnostics {
  primary: string[];
  supporting: string[];
  prerequisites: string[];
  composites: Composite[];
  checkSkills: Record<string, string[]>;
  mistakes: NonNullable<ChallengeDiagnostics['mistakes']>;
}

export function diagnosticsOf(c: Pick<Challenge, 'skillIds' | 'diagnostics'>): ResolvedDiagnostics {
  const d = c.diagnostics ?? {};
  const primary = d.primary ?? c.skillIds.slice(0, 1);
  const supporting = d.supporting ?? c.skillIds.filter((s) => !primary.includes(s));
  const all = new Set([...primary, ...supporting]);
  const implied = composites.filter((k) => k.skillIds.every((s) => all.has(s)));
  const explicit = (d.composites ?? []).map((id) => composites.find((k) => k.id === id)).filter((k): k is Composite => !!k);
  const merged = [...new Map([...implied, ...explicit].map((k) => [k.id, k])).values()];
  return { primary, supporting, prerequisites: d.prerequisites ?? [], composites: merged, checkSkills: d.checkSkills ?? {}, mistakes: d.mistakes ?? [] };
}

/** Skills a set of failed check names points at (authored map first; otherwise the primary skills). */
export function skillsForFailures(c: Pick<Challenge, 'skillIds' | 'diagnostics'>, failedNames: string[], constraintFailed = false): string[] {
  const d = diagnosticsOf(c);
  const hit = new Set<string>();
  const names = failedNames.map((n) => n.toLowerCase());
  for (const [needle, ids] of Object.entries(d.checkSkills)) {
    const n = needle.toLowerCase();
    if ((n === 'constraint' && constraintFailed) || names.some((x) => x.includes(n))) ids.forEach((id) => hit.add(id));
  }
  return hit.size ? [...hit] : [...d.primary];
}

/** Human labels of authored mistakes that match the failed checks. */
export function mistakesFor(c: Pick<Challenge, 'skillIds' | 'diagnostics'>, failedNames: string[]): string[] {
  const names = failedNames.map((n) => n.toLowerCase());
  return diagnosticsOf(c).mistakes.filter((m) => names.some((x) => x.includes(m.when.toLowerCase()))).map((m) => m.id);
}
