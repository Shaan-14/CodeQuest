/** Join paragraphs with blank lines (the format Lesson/Challenge text uses). */
export const text = (...paragraphs: string[]): string => paragraphs.join('\n\n');

/** The learning objective a challenge tests (variants share one). Defaults to the challenge's own id. */
export const objectiveOf = (c: { id: string; objectiveId?: string }): string => c.objectiveId ?? c.id;

import type { CallCheck, Challenge, Json, OutputCheck, SqlResultCheck, SqlStateCheck } from './schema';

/** Every database id a challenge touches (fixtures, default db, and per-check overrides). */
export function databasesUsedBy(c: Pick<Challenge, 'db' | 'fixtures' | 'checks'>): string[] {
  const ids = new Set<string>();
  if (c.db) ids.add(c.db);
  const addFix = (list?: string[]) => list?.forEach((d) => ids.add(d.split(':')[0]!));
  addFix(c.fixtures?.databases);
  for (const k of c.checks) {
    if ('db' in k && k.db) ids.add(k.db);
    if ('databases' in k) addFix(k.databases);
  }
  return [...ids];
}

/* ---- tiny builders so content stays readable. The first `visible` cases are shown to the player; the rest are hidden. ---- */

/** Function-call checks: [args, expected] pairs. */
export function calls(fn: string, cases: [Json[], Json][], visible = 2, extra: Partial<CallCheck> = {}): CallCheck[] {
  return cases.map(([args, expect], i) => ({
    kind: 'call', name: `${fn}(${args.map((a) => JSON.stringify(a)).join(', ')})`, fn, args, expect, visible: i < visible, ...extra,
  }));
}

/** Program-output checks: [stdin lines, expected output] pairs. */
export function outs(cases: [string[], string][], visible = 2, extra: Partial<OutputCheck> = {}): OutputCheck[] {
  return cases.map(([stdin, expect], i) => ({ kind: 'output', name: stdin.length ? `Input: ${stdin.join(', ')}` : `Case ${i + 1}`, stdin, expect, visible: i < visible, ...extra }));
}

/** SQL result checks: the same reference query run on the visible database and on each hidden twin. */
export function sqlRes(expectQuery: string, db: string, hiddenTwins: string[] = [], opts: Partial<SqlResultCheck> = {}): SqlResultCheck[] {
  return [
    { kind: 'sqlResult', name: 'Your query on this database', db, expectQuery, ...opts },
    ...hiddenTwins.map((twin, i): SqlResultCheck => ({ kind: 'sqlResult', name: `Hidden data ${i + 1}`, db: twin, expectQuery, visible: false, feedback: 'Your query gave the right answer here but not on different data. Does it depend on something that is not in the question?', ...opts })),
  ];
}

/** SQL state checks: after the player's script, `verify` must give the same rows as after the reference script, on visible and hidden data. */
export function sqlState(reference: string, verify: string | string[], db: string, hiddenTwins: string[] = [], opts: Partial<SqlStateCheck> = {}): SqlStateCheck[] {
  const verifies = Array.isArray(verify) ? verify : [verify];
  const out: SqlStateCheck[] = [];
  verifies.forEach((v, i) => {
    out.push({ kind: 'sqlState', name: verifies.length > 1 ? `The data afterwards (part ${i + 1})` : 'The data afterwards', db, reference, verify: v, ...opts });
    hiddenTwins.forEach((twin, j) => out.push({ kind: 'sqlState', name: `Hidden data ${j + 1}`, db: twin, reference, verify: v, visible: false, feedback: 'Your statements gave the right result here but not on different data. Do they depend on something that is not in the task?', ...opts }));
  });
  return out;
}
