import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { statCalls } from './helpers';

const SAMPLE = 'import random\ndef _ref(population, k, seed):\n    p = list(population)\n    if k >= len(p):\n        return p\n    return random.Random(seed).sample(p, max(k, 0))';
const MARGIN = 'import math\ndef _ref(p, n):\n    if n <= 0:\n        return None\n    return round(1.96 * math.sqrt(p * (1 - p) / n), 4)';
/** Stratified sampling is graded by properties, not by one exact sample: any fair random pick per group is acceptable. */
const strat = (fn: string, keyName: string): string => `
recs = [{'id': i, '${keyName}': ['north', 'south', 'east'][i % 3] if i < 40 else 'west'} for i in range(43)]
import copy
snapshot = copy.deepcopy(recs)
got = ${fn}(recs, '${keyName}', 4, 11)
assert recs == snapshot, 'Do not change the list you were given.'
assert isinstance(got, list), 'Return a list of records.'
ids = [r['id'] for r in got]
assert len(ids) == len(set(ids)), 'A record was picked twice.'
assert all(r in snapshot for r in got), 'Only records from the input may be returned.'
groups = {}
for r in snapshot:
    groups.setdefault(r['${keyName}'], []).append(r['id'])
for g, members in groups.items():
    picked = [r['id'] for r in got if r['${keyName}'] == g]
    assert len(picked) == min(4, len(members)), 'Group %r should contribute min(4, its size) records, got %d.' % (g, len(picked))
`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'st-06-sampling', title: 'Sampling and Margin of Error', language: 'python', skillId: 'stat.sampling',
    blurb: 'You rarely see the whole population. Draw fair samples, keep small groups represented, and say how far a sample result can be off.', prerequisites: ['st-02-spread'], xpReward: 60,
    reference: {
      title: 'Samples and their error',
      body: text(
        'A **sample** is a subset used to learn about a **population**. A **random** sample gives every member the same chance and avoids the biases of convenience picks (asking only the friendly customers). `random.Random(seed).sample(items, k)` picks `k` distinct items reproducibly: the same seed gives the same sample, which makes results checkable.',
        '**Stratified sampling** picks from each group separately so small groups are not lost. A sample result is never exact: for a proportion `p` from `n` answers the approximate 95% **margin of error** is `1.96 × √(p(1 − p) / n)`. Quadruple the sample and the margin halves.',
      ),
      example: 'import random\nrng = random.Random(42)\nprint(rng.sample(range(100), 5))   # the same five every run\nimport math\np, n = 0.4, 600\nprint(round(1.96 * math.sqrt(p * (1 - p) / n), 4))',
    },
    steps: [
      { kind: 'teach', title: 'Seeing part of the whole', body: text('A poll cannot call every voter. A factory cannot test every bulb to destruction. We take a sample and **infer**. Two things decide whether that works: how the sample was chosen (bias) and how big it is (sampling error).', 'Bias is not fixed by a bigger sample: asking 10 000 people outside a gym about exercise still only describes gym-goers. Sampling error shrinks as the sample grows, but slowly: halving it needs four times the data.') },
      {
        kind: 'demo', title: 'Same seed, same sample', language: 'python',
        body: text('Run it twice. Then change the seed.'),
        code: 'import random\npopulation = list(range(1, 101))\nfor seed in (7, 7, 8):\n    print(seed, random.Random(seed).sample(population, 5))',
        notice: 'Seeds 7 and 7 match exactly; seed 8 differs. Reproducibility makes a random sample auditable.',
      },
      { kind: 'challenge', challengeId: 'st-06-sample' },
      { kind: 'challenge', challengeId: 'st-06-stratified' },
      { kind: 'challenge', challengeId: 'st-06-stratified-b' },
      { kind: 'challenge', challengeId: 'st-06-margin' },
      { kind: 'challenge', challengeId: 'st-06-margin-b' },
    ],
  },
  objectives: [
    { id: 'st-obj-stratified', title: 'Stratified random samples', summary: 'Sample within each group so small groups stay represented.' },
    { id: 'st-obj-margin', title: 'Margin of error for a proportion', summary: 'Quantify how far a sample proportion may be from the truth.' },
  ],
  challenges: [
    {
      id: 'st-06-sample', title: 'Audit Sample', mode: 'learning', language: 'python', skillIds: ['stat.sampling', 'py.modules'], concepts: ['random sample', 'seed'], difficulty: 2, context: 'finance',
      prompt: text('Write `audit_sample(invoices, k, seed)` returning a **list** of `k` invoices drawn at random **without repeats** using `random.Random(seed)`, so the same seed always gives the same answer. If `k` is at least the number of invoices, return all of them in their original order. Do not change the list you are given.'),
      expectedBehavior: 'random.Random(seed).sample(invoices, k), or the whole list when k is large enough.',
      guidedSteps: ['`import random`.', 'Make a generator with `random.Random(seed)`.', 'Its `.sample(items, k)` returns k distinct items; guard `k` larger than the list.'],
      starterCode: 'def audit_sample(invoices, k, seed):\n    pass\n',
      hints: ['Which module does randomness, and how do you make it repeatable?', 'sample() raises an error when k is too large.', 'Copy the list if you might alter it.'],
      checks: statCalls('audit_sample', SAMPLE.replace('_ref(population, k, seed)', '_ref(invoices, k, seed)').replace('list(population)', 'list(invoices)'), ['list(range(20)), 5, 42', 'list(range(10)), 3, 7', '[1, 2, 3], 3, 1', '[1, 2, 3], 10, 1', '[], 2, 5', 'list(range(100)), 1, 123', 'list(range(50)), 0, 9'], 3),
      xpReward: 45, coinReward: 7,
    },
    {
      id: 'st-06-stratified', objectiveId: 'st-obj-stratified', title: 'Survey Every Region', mode: 'challenge', language: 'python', skillIds: ['stat.sampling', 'py.dicts'], concepts: ['stratified sample'], difficulty: 3, context: 'research',
      prompt: text('A survey has records like `{"id": 7, "region": "north"}`. Write `region_sample(records, field, per_group, seed)` returning a list of records in which **every group (value of `field`) contributes `per_group` records picked at random**, or **all of its records if it has fewer**. Use the `seed` so the result is reproducible. Never return a record twice, never return something that was not in the input, and do not change the input list.'),
      expectedBehavior: 'For each group: min(per_group, group size) random records; reproducible with the seed.',
      starterCode: 'def region_sample(records, field, per_group, seed):\n    pass\n',
      hints: ['Separate the records by group first.', 'Decide whether one random generator or one per group makes the result reproducible.', 'A small group should lose nothing.'],
      checks: [
        { kind: 'script', name: 'Each group is represented', visible: true, code: strat('region_sample', 'region') },
        { kind: 'script', name: 'Reproducible with the same seed', visible: false, code: "recs = [{'id': i, 'region': 'a' if i % 2 else 'b'} for i in range(30)]\nassert region_sample(recs, 'region', 3, 5) == region_sample(recs, 'region', 3, 5), 'The same seed must give the same sample.'" },
        { kind: 'script', name: 'It is random, not just the first records', visible: false, code: "recs = [{'id': i, 'region': 'a'} for i in range(60)]\nfirst = recs[:5]\nresults = [region_sample(recs, 'region', 5, s) for s in range(1, 6)]\nassert any(r != first for r in results), 'Taking the first records of each group is not a random sample.'\nassert any(results[i] != results[0] for i in range(1, 5)), 'Different seeds should give different samples.'" },
        { kind: 'script', name: 'Works with other field names and sizes', visible: false, code: "recs = [{'id': i, 'shift': 'n' if i < 3 else 'd'} for i in range(10)]\ngot = region_sample(recs, 'shift', 5, 2)\nassert sorted(r['id'] for r in got if r['shift'] == 'n') == [0, 1, 2], 'A group with fewer records than requested must give all of them.'\nassert len([r for r in got if r['shift'] == 'd']) == 5, 'A large group gives exactly per_group records.'\nassert region_sample([], 'shift', 2, 1) == [], 'No records gives an empty list.'" },
      ],
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'st-06-stratified-b', objectiveId: 'st-obj-stratified', title: 'Test Every Line', mode: 'challenge', language: 'python', skillIds: ['stat.sampling', 'py.dicts'], concepts: ['stratified sample'], difficulty: 3, context: 'manufacturing',
      prompt: text('Inspectors test units from every production line. Units are records like `{"id": 7, "line": "L2"}`. Write `inspect_units(units, field, per_group, seed)` returning a list in which **each value of `field` contributes `per_group` units chosen at random**, or all of its units if it has fewer. The same `seed` must give the same result; no unit may appear twice; the input list must not change.'),
      expectedBehavior: 'For each line: min(per_group, size) random units; reproducible with the seed.',
      starterCode: 'def inspect_units(units, field, per_group, seed):\n    pass\n',
      hints: ['Group, then sample inside each group.', 'Small groups are taken whole.', 'Randomness must be repeatable for an audit.'],
      checks: [
        { kind: 'script', name: 'Each line is represented', visible: true, code: strat('inspect_units', 'line') },
        { kind: 'script', name: 'Reproducible with the same seed', visible: false, code: "recs = [{'id': i, 'line': 'a' if i % 2 else 'b'} for i in range(30)]\nassert inspect_units(recs, 'line', 3, 5) == inspect_units(recs, 'line', 3, 5), 'The same seed must give the same sample.'" },
        { kind: 'script', name: 'It is random, not just the first units', visible: false, code: "recs = [{'id': i, 'line': 'a'} for i in range(60)]\nfirst = recs[:5]\nresults = [inspect_units(recs, 'line', 5, s) for s in range(1, 6)]\nassert any(r != first for r in results), 'Taking the first units of each line is not a random sample.'\nassert any(results[i] != results[0] for i in range(1, 5)), 'Different seeds should give different samples.'" },
        { kind: 'script', name: 'Small groups and empty input', visible: false, code: "recs = [{'id': i, 'cell': 'x' if i < 2 else 'y'} for i in range(9)]\ngot = inspect_units(recs, 'cell', 4, 3)\nassert sorted(r['id'] for r in got if r['cell'] == 'x') == [0, 1], 'A group with fewer units than requested must give all of them.'\nassert len([r for r in got if r['cell'] == 'y']) == 4, 'A large group gives exactly per_group units.'\nassert inspect_units([], 'cell', 2, 1) == [], 'No units gives an empty list.'" },
      ],
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'st-06-margin', objectiveId: 'st-obj-margin', title: 'Poll Margin of Error', mode: 'challenge', language: 'python', skillIds: ['stat.sampling', 'stat.spread'], concepts: ['margin of error', 'proportion'], difficulty: 3, context: 'polling',
      prompt: text('A poll finds that a fraction `p` of `n` respondents support a proposal. Write `poll_margin(p, n)` returning the approximate **95% margin of error** `1.96 × √(p × (1 − p) / n)`, **rounded to 4 decimal places**. If `n` is zero or negative return `None`.'),
      expectedBehavior: '1.96·√(p(1−p)/n) rounded to 4 places; None when n ≤ 0.',
      starterCode: 'def poll_margin(p, n):\n    pass\n',
      hints: ['It is a formula with a square root.', 'Where is the margin largest: p near 0.5 or near 0 or 1?', 'Guard n before dividing.'],
      checks: [...statCalls('poll_margin', MARGIN.replace('_ref(p, n)', '_ref(p, n)'), ['0.5, 1000', '0.4, 600', '0.9, 50', '0, 100', '1, 100', '0.5, 0', '0.5, -10', '0.25, 10000', '0.3, 1']), { kind: 'script', name: 'Rounded to 4 places', visible: false, code: 'assert poll_margin(0.5, 300) == 0.0566, "Round the answer to exactly 4 decimal places."' }],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'st-06-margin-b', objectiveId: 'st-obj-margin', title: 'Defect Rate Margin', mode: 'challenge', language: 'python', skillIds: ['stat.sampling', 'stat.spread'], concepts: ['margin of error', 'proportion'], difficulty: 3, context: 'manufacturing',
      prompt: text('A quality team tested `n` units and found a defect rate of `rate` (a fraction between 0 and 1). Write `defect_margin(rate, n)` returning the approximate **95% margin of error** of that rate, `1.96 × √(rate × (1 − rate) / n)`, **rounded to 4 decimal places**. With no units tested (`n` zero or negative) return `None`.'),
      expectedBehavior: '1.96·√(rate(1−rate)/n) rounded to 4 places; None when n ≤ 0.',
      starterCode: 'def defect_margin(rate, n):\n    pass\n',
      hints: ['The same idea as any proportion from a sample.', 'Bigger samples give smaller margins.', 'What if nothing was tested?'],
      checks: [...statCalls('defect_margin', MARGIN.replace('_ref(p, n)', '_ref(rate, n)').replace(/\bp\b/g, 'rate'), ['0.05, 400', '0.02, 1000', '0.5, 25', '0, 10', '0.1, 0', '0.1, -4', '0.12, 3000', '0.3, 2']), { kind: 'script', name: 'Rounded to 4 places', visible: false, code: 'assert defect_margin(0.1, 250) == 0.0372, "Round the answer to exactly 4 decimal places."' }],
      xpReward: 70, coinReward: 10,
    },
  ],
};
