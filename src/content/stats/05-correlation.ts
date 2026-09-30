import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { statCalls } from './helpers';

const PEARSON = 'import math\ndef _ref(xs, ys):\n    n = len(xs)\n    if n < 2 or n != len(ys):\n        return None\n    mx, my = sum(xs) / n, sum(ys) / n\n    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))\n    sy = math.sqrt(sum((y - my) ** 2 for y in ys))\n    if sx == 0 or sy == 0:\n        return None\n    return round(sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy), 3)';
const STRONG = `${PEARSON.replace('_ref(xs, ys)', '_r(xs, ys)')}\nimport itertools\ndef _ref(table):\n    best = None\n    for a, b in itertools.combinations(sorted(table), 2):\n        r = _r(table[a], table[b])\n        if r is None:\n            continue\n        if best is None or abs(r) > best[0] + 1e-12:\n            best = (abs(r), (a, b))\n    return best[1] if best else None`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'st-05-correlation', title: 'Correlation: Do Two Things Move Together?', language: 'python', skillId: 'stat.correlation',
    blurb: 'Compute Pearson’s r, compare many relationships at once, and stay honest about what correlation does and does not show.', prerequisites: ['st-02-spread'], xpReward: 65,
    reference: {
      title: 'Correlation',
      body: text(
        '**Pearson’s r** measures how closely two measurements follow a straight-line relationship, from −1 (perfectly opposite) through 0 (none) to +1 (perfectly together). Compute it as `Σ(x − x̄)(y − ȳ) / (√Σ(x − x̄)² · √Σ(y − ȳ)²)`. If either list has no variation, r is undefined.',
        '**Correlation is not causation.** Ice-cream sales and sunburn correlate because both follow the sun. A strong r on few points can be luck; an outlier can create or hide a correlation; a curved relationship can have r near 0. Always look at the scatter plot as well as the number.',
      ),
      example: 'import math\nxs, ys = [1, 2, 3, 4], [2, 4, 5, 9]\nmx, my = sum(xs) / 4, sum(ys) / 4\nnum = sum((x - mx) * (y - my) for x, y in zip(xs, ys))\nden = math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys))\nprint(round(num / den, 3))',
    },
    steps: [
      { kind: 'teach', title: 'Moving together', body: text('Do taller players hit more home runs? Do hotter days sell more ice cream? Correlation puts a number on “tend to rise together”. Points lying along an upward line give r near +1; along a downward line, near −1; in a shapeless cloud, near 0.', 'r says nothing about **why**. Two measurements may share a hidden cause, or the match may be coincidence. A responsible analyst reports r together with the number of points and a chart.') },
      {
        kind: 'demo', title: 'One outlier changes the story', language: 'python',
        body: text('The same relationship with and without a single odd point.'),
        code: 'import math\ndef r(xs, ys):\n    n = len(xs); mx = sum(xs) / n; my = sum(ys) / n\n    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))\n    den = math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys))\n    return round(num / den, 3)\nxs = [1, 2, 3, 4, 5, 6]\nys = [2, 4, 6, 8, 10, 12]\nprint("clean:", r(xs, ys))\nprint("one bad reading:", r(xs, ys[:-1] + [-20]))',
        notice: 'A perfectly straight relationship (r = 1) collapses to a negative value because of one faulty reading. Always look at the data behind a correlation.',
      },
      { kind: 'challenge', challengeId: 'st-05-pearson' },
      { kind: 'challenge', challengeId: 'st-05-strongest' },
      { kind: 'challenge', challengeId: 'st-05-strongest-b' },
    ],
  },
  objectives: [
    { id: 'st-obj-strongest', title: 'Finding the strongest relationship', summary: 'Compare correlations across many measurements and report the strongest pair.' },
  ],
  challenges: [
    {
      id: 'st-05-pearson', title: 'Study Hours and Marks', mode: 'learning', language: 'python', skillIds: ['stat.correlation', 'stat.spread', 'py.functions'], concepts: ['Pearson r'], difficulty: 3, context: 'education',
      prompt: text('Write `correlation(xs, ys)` returning **Pearson’s r**, **rounded to 3 decimal places**. Return `None` when r is undefined: fewer than 2 points, lists of different lengths, or no variation in `xs` or in `ys`.'),
      expectedBehavior: 'Pearson’s r rounded to 3 places; None when undefined.',
      guidedSteps: ['Compute both means.', 'Sum the products of the paired distances from the means.', 'Divide by the square roots of the two sums of squared distances.', 'Check the undefined cases first.'],
      starterCode: 'def correlation(xs, ys):\n    pass\n',
      hints: ['Start with the two means.', 'If either side has zero spread, the denominator is zero.', 'Rounding happens once, at the end.'],
      checks: statCalls('correlation', PEARSON, ['[1, 2, 3, 4], [2, 4, 5, 9]', '[1, 2, 3], [3, 2, 1]', '[1, 2, 3], [5, 5, 5]', '[1], [2]', '[1, 2], [1, 2, 3]', '[10, 20, 30, 40, 50], [12, 25, 31, 48, 49]', '[1, 2, 3, 4, 5], [2, 1, 4, 3, 5]', '[-2, -1, 0, 1, 2], [4, 1, 0, 1, 4]'], 3),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'st-05-strongest', objectiveId: 'st-obj-strongest', title: 'Which Factors Go Together?', mode: 'challenge', language: 'python', skillIds: ['stat.correlation', 'py.dicts'], concepts: ['Pearson r', 'comparing pairs'], difficulty: 3, context: 'retail',
      prompt: text('A shop records daily figures as a dictionary mapping a name (`"temp"`, `"sales"`, `"rain"`, …) to a list of numbers, all the same length. Write `strongest_pair(table)` returning a **tuple of two names in alphabetical order** whose correlation is the **strongest in absolute value** (−0.9 is stronger than 0.5). Pairs whose correlation is undefined are skipped. If two pairs tie, choose the pair that comes first when pairs are listed alphabetically. If no pair has a defined correlation return `None`.'),
      expectedBehavior: 'The alphabetical name pair with the largest |r|; None when no pair qualifies.',
      starterCode: 'def strongest_pair(table):\n    pass\n',
      hints: ['You will want the Pearson function you wrote, or a copy of it.', 'The sign of r does not matter for “strongest”.', 'itertools.combinations on sorted names lists each pair once, alphabetically.'],
      checks: statCalls('strongest_pair', STRONG, [
        "{'temp': [20, 25, 30, 35], 'sales': [100, 140, 180, 230], 'rain': [5, 3, 4, 2]}", "{'a': [1, 2, 3], 'b': [3, 2, 1], 'c': [1, 3, 2]}", "{'a': [1, 2, 3]}", "{'x': [1, 1, 1], 'y': [2, 3, 4]}", "{'b': [1, 2, 3, 4], 'a': [4, 3, 2, 1], 'c': [1, 2, 3, 4]}",
        "{'p': [1, 2, 3, 4, 5], 'q': [2, 1, 4, 3, 5], 'r': [5, 3, 4, 1, 2]}", "{}",
      ], 2),
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'st-05-strongest-b', objectiveId: 'st-obj-strongest', title: 'Which Sensor Tracks Output?', mode: 'challenge', language: 'python', skillIds: ['stat.correlation', 'py.dicts'], concepts: ['Pearson r', 'comparing pairs'], difficulty: 3, context: 'manufacturing',
      prompt: text('A plant logs several measurements per shift, each a list of numbers of the same length, in a dictionary keyed by sensor name. Write `best_related(table)` returning the **tuple of two sensor names in alphabetical order** with the **strongest relationship by absolute correlation**. Ties go to the pair that is first when pairs are listed alphabetically; pairs with undefined correlation are skipped; if there is no usable pair return `None`.'),
      expectedBehavior: 'The alphabetical name pair with the largest |r|; None when no pair qualifies.',
      starterCode: 'def best_related(table):\n    pass\n',
      hints: ['Compare absolute values, not signs.', 'Decide how to treat a constant sensor before comparing.', 'Only pairs with a defined r compete.'],
      checks: statCalls('best_related', STRONG.replace('def _ref(table)', 'def _ref(table)'), [
        "{'temp': [60, 62, 65, 70], 'vibration': [1, 1.2, 1.1, 2.9], 'output': [100, 98, 90, 80]}", "{'s1': [5, 5, 5], 's2': [1, 2, 3]}", "{'m': [2, 4, 6], 'n': [1, 2, 3], 'o': [9, 7, 5]}", "{'z': [1, 2, 3, 4], 'y': [2, 4, 5, 4], 'x': [5, 3, 2, 1]}",
        "{'only': [1, 2]}", "{'a': [1, 2, 3, 4, 5, 6], 'b': [2, 1, 2, 1, 2, 1], 'c': [6, 5, 4, 3, 2, 1.5]}",
      ], 2),
      xpReward: 85, coinReward: 12,
    },
  ],
};
