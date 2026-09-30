import type { Challenge, Check, DailyMeta } from '../schema';

/**
 * Builders for Daily Challenges. A daily is independent-style: no hints, no concept tags, hidden checks.
 * Checks compare the player's function with a REFERENCE implementation embedded in the check, over many
 * inputs, so expected values are never hand-typed (and nothing reveals the answer to a failed attempt).
 */
export type DailyDef = Omit<Challenge, 'mode' | 'hints' | 'concepts' | 'xpReward' | 'coinReward' | 'daily' | 'starterCode'> & {
  starterCode?: string;
  daily: DailyMeta;
};

export const daily = (d: DailyDef): Challenge => ({
  ...d,
  mode: 'independent',
  concepts: [],
  hints: [],
  starterCode: d.starterCode ?? '',
  xpReward: 0,
  coinReward: 0,
});

/**
 * Function checks against a reference. `cases` are Python argument lists as source text, e.g. `'[1, 2, 3], 2'`.
 * Each case is its own hidden check, so the result list only says which kind of situation failed.
 */
export function refCalls(fn: string, reference: string, cases: string[], note = 'Your function gave a different result from the specification for one of the inputs.'): Check[] {
  return cases.map((args, i) => ({
    kind: 'script',
    name: `Case ${i + 1}`,
    visible: false,
    code: `${reference}\n_expected = _ref(${args})\n_got = ${fn}(${args})\nassert _got == _expected, ${JSON.stringify(note)}`,
  }));
}

/** Script checks for programs that read files: run the program (fixtures are in the workspace) then assert on the outcome. */
export const script = (name: string, code: string): Check => ({ kind: 'script', name, code, visible: false });
