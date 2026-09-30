import type { Check } from '../schema';

/** Python helper shipped with every statistics check: numbers compare with a tolerance, containers compare element by element. */
const SAME = `def _same(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        return a is b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return abs(a - b) <= 1e-6 * max(1.0, abs(b))
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(_same(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return set(a) == set(b) and all(_same(a[k], b[k]) for k in a)
    return a == b
`;

/**
 * Function checks against an embedded reference (so expected values are computed, never typed).
 * The first `visible` cases are shown with expected and actual values; the rest are hidden and only say a hidden case failed.
 * `args` are Python argument lists as source text. The reference must not modify its arguments; the function under test gets its own copy
 * through `copy.deepcopy` so a player who mutates the input still gets the right answer for the reference.
 */
export function statCalls(fn: string, reference: string, cases: string[], visible = 2, note = 'Your function gave a different result from the specification for one of the hidden inputs.'): Check[] {
  return cases.map((args, i) => {
    const show = i < visible;
    const shown = args.length > 60 ? `${args.slice(0, 57)}...` : args;
    return {
      kind: 'script' as const,
      name: show ? `${fn}(${shown})` : `Hidden case ${i + 1}`,
      visible: show,
      code: `${SAME}${reference}\nimport copy\n_expected = _ref(*copy.deepcopy((${args},)))\n_got = ${fn}(*copy.deepcopy((${args},)))\nassert _same(_got, _expected), ${show ? `'Expected %r but got %r.' % (_expected, _got)` : JSON.stringify(note)}`,
    };
  });
}
