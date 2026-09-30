import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { statCalls } from './helpers';

const RANGE = 'def _ref(values):\n    return max(values) - min(values) if values else None';
const POP = 'import math\ndef _ref(values):\n    n = len(values)\n    if n == 0:\n        return None\n    m = sum(values) / n\n    return round(math.sqrt(sum((v - m) ** 2 for v in values) / n), 3)';
const SAMPLE = 'import math\ndef _ref(values):\n    n = len(values)\n    if n < 2:\n        return None\n    m = sum(values) / n\n    return round(math.sqrt(sum((v - m) ** 2 for v in values) / (n - 1)), 3)';
const QUARTILES = 'def _med(s):\n    n = len(s)\n    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2\ndef _fences(values):\n    s = sorted(values)\n    n = len(s)\n    q1 = _med(s[: n // 2])\n    q3 = _med(s[n // 2 + n % 2 :])\n    iqr = q3 - q1\n    return q1 - 1.5 * iqr, q3 + 1.5 * iqr\n';
const OUT = `${QUARTILES}def _ref(values):\n    if len(values) < 4:\n        return []\n    lo, hi = _fences(values)\n    return sorted(v for v in values if v < lo or v > hi)`;
const POS = `${QUARTILES}def _ref(readings):\n    if len(readings) < 4:\n        return []\n    lo, hi = _fences(readings)\n    return [i for i, v in enumerate(readings) if v < lo or v > hi]`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'st-02-spread', title: 'Spread: How Much Do Values Vary?', language: 'python', skillId: 'stat.spread',
    blurb: 'Range, standard deviation and outlier fences: two datasets with the same average can behave completely differently.', prerequisites: ['st-01-describing'], xpReward: 65,
    reference: {
      title: 'Measures of spread',
      body: text(
        'The **range** is max − min: simple, but one extreme value controls it. The **variance** is the average squared distance from the mean; the **standard deviation** is its square root, in the same units as the data. Use **n** in the denominator when you have the whole population and **n − 1** when the data is a sample of a bigger group.',
        '**Quartiles** split sorted data in four: Q1 (25%) and Q3 (75%). The **IQR** is Q3 − Q1. A common rule flags a value as an **outlier** when it lies more than 1.5 × IQR below Q1 or above Q3. Outliers are questions, not errors: check whether they are mistakes or real.',
      ),
      example: 'import math\nvalues = [4, 8, 6, 5, 3]\nmean = sum(values) / len(values)\nvariance = sum((v - mean) ** 2 for v in values) / len(values)\nprint(math.sqrt(variance))',
    },
    steps: [
      { kind: 'teach', title: 'The same average, different worlds', body: text('Two machines fill bottles with an average of 500 ml. Machine A is always between 499 and 501. Machine B ranges from 450 to 550. The mean hides the difference that matters to a customer: **spread**.', 'The standard deviation measures typical distance from the mean. About 95% of bell-shaped data lies within two standard deviations of the mean, which makes it a useful yardstick.') },
      {
        kind: 'demo', title: 'Two machines, one mean', language: 'python',
        body: text('Run it and compare the two lines.'),
        code: 'import math\na = [499, 500, 500, 501, 500]\nb = [450, 550, 480, 520, 500]\ndef std(v):\n    m = sum(v) / len(v)\n    return math.sqrt(sum((x - m) ** 2 for x in v) / len(v))\nfor name, data in (("A", a), ("B", b)):\n    print(name, "mean", sum(data) / len(data), "std", round(std(data), 2), "range", max(data) - min(data))',
        notice: 'Both means are exactly 500, but machine B’s standard deviation is about 35 times larger. The average alone would never show that.',
      },
      { kind: 'challenge', challengeId: 'st-02-range' },
      { kind: 'challenge', challengeId: 'st-02-std' },
      { kind: 'challenge', challengeId: 'st-02-std-b' },
      { kind: 'challenge', challengeId: 'st-02-outliers' },
      { kind: 'challenge', challengeId: 'st-02-outliers-b' },
    ],
  },
  objectives: [
    { id: 'st-obj-std', title: 'Standard deviation, population vs sample', summary: 'Compute the standard deviation with the right denominator for the situation.' },
    { id: 'st-obj-outliers', title: 'Outliers by the IQR rule', summary: 'Compute quartiles and flag values outside the 1.5 × IQR fences.' },
  ],
  challenges: [
    {
      id: 'st-02-range', title: 'Temperature Swing', mode: 'learning', language: 'python', skillIds: ['stat.spread', 'py.lists'], concepts: ['range', 'max', 'min'], difficulty: 1, context: 'science',
      prompt: text('Write `swing(temperatures)` returning the **range** (largest minus smallest) of a list of temperatures. Return `None` for an empty list.'),
      expectedBehavior: 'max minus min; None for an empty list.',
      guidedSteps: ['Use `max(temperatures)` and `min(temperatures)`.', 'Subtract.', 'Guard the empty list first.'],
      starterCode: 'def swing(temperatures):\n    pass\n',
      hints: ['Two built-in functions do the heavy lifting.', 'max() of an empty list is an error.', 'A single value has a range of 0.'],
      checks: statCalls('swing', RANGE.replace('_ref(values)', '_ref(temperatures)').replace(/values/g, 'temperatures'), ['[12, 18, 9, 21]', '[5]', '[]', '[-3, -8, 2]', '[0.5, 0.25]'], 3),
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'st-02-std', objectiveId: 'st-obj-std', title: 'Bottle Fill Consistency', mode: 'challenge', language: 'python', skillIds: ['stat.spread', 'py.functions'], concepts: ['standard deviation', 'population'], difficulty: 3, context: 'manufacturing',
      prompt: text('A plant measures **every** bottle in a batch. Write `fill_std(volumes)` returning the **population standard deviation** of the volumes (the square root of the average squared distance from the mean, dividing by **n**), **rounded to 3 decimal places**. Return `None` for an empty list.'),
      expectedBehavior: 'The population standard deviation rounded to 3 places; None for an empty list.',
      starterCode: 'def fill_std(volumes):\n    pass\n',
      hints: ['You need the mean before you can measure distance from it.', 'Squaring makes every distance positive and punishes big ones.', 'After averaging the squares, undo the squaring.'],
      checks: [...statCalls('fill_std', POP, ['[499, 500, 500, 501, 500]', '[450, 550, 480, 520, 500]', '[]', '[7]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]', '[-2, 2]', '[10.5, 10.5, 10.5]']), { kind: 'script', name: 'Rounded to 3 places', visible: false, code: 'assert fill_std([1, 2, 4]) == 1.247, "Round the answer to exactly 3 decimal places."' }],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'st-02-std-b', objectiveId: 'st-obj-std', title: 'Monthly Return Volatility', mode: 'challenge', language: 'python', skillIds: ['stat.spread', 'py.functions'], concepts: ['standard deviation', 'sample'], difficulty: 3, context: 'finance',
      prompt: text('An analyst has a few monthly returns, which are only a **sample** of how the fund behaves. Write `volatility(returns)` returning the **sample standard deviation** (divide the summed squared distances by **n − 1**), **rounded to 3 decimal places**. With fewer than 2 returns there is no spread to estimate, so return `None`.'),
      expectedBehavior: 'The sample standard deviation (n − 1) rounded to 3 places; None with fewer than 2 values.',
      starterCode: 'def volatility(returns):\n    pass\n',
      hints: ['Same steps as for a whole population, with one change.', 'A sample tends to underestimate spread, so the divisor is smaller.', 'One value gives nothing to divide by.'],
      checks: [...statCalls('volatility', SAMPLE, ['[2.0, 4.0, 6.0]', '[1.5, -0.5, 2.5, 0.0]', '[3]', '[]', '[5, 5, 5]', '[10, 12, 23, 23, 16, 23, 21, 16]', '[-1, 1]']), { kind: 'script', name: 'Rounded to 3 places', visible: false, code: 'assert volatility([1, 2, 4]) == 1.528, "Round the answer to exactly 3 decimal places."' }],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'st-02-outliers', objectiveId: 'st-obj-outliers', title: 'Suspicious Invoices', mode: 'challenge', language: 'python', skillIds: ['stat.spread', 'py.lists'], concepts: ['quartiles', 'IQR', 'outliers'], difficulty: 3, context: 'finance',
      prompt: text(
        'An auditor flags unusual invoice amounts. Write `unusual(amounts)` returning a **sorted list** of the amounts that lie **outside the IQR fences**: below `Q1 − 1.5 × IQR` or above `Q3 + 1.5 × IQR`.',
        'Find the quartiles this way: sort the data; Q1 is the **median of the lower half** and Q3 the **median of the upper half**; with an odd count the middle value belongs to neither half. With fewer than 4 amounts return `[]`.',
      ),
      expectedBehavior: 'Sorted amounts strictly outside the fences; [] for fewer than 4 values.',
      starterCode: 'def unusual(amounts):\n    pass\n',
      hints: ['A helper that finds the median of any list will be used three times.', 'Splitting the data in halves depends on whether the count is odd.', 'A value exactly on a fence is not an outlier.'],
      checks: statCalls('unusual', OUT, ['[10, 12, 12, 13, 12, 11, 95]', '[1, 2, 3, 4, 5, 6, 7, 8]', '[5, 5, 5]', '[1, 50, 2, 3, 2, 3, -40, 2]', '[100, 1, 2, 3, 4, 5, 6, 7, 8, 9]', '[2, 4, 4, 4, 5, 5, 7, 9]', '[0, 0, 0, 0, 1]', '[20, 21, 22, 23, 24, 25, 26, 27, 70, 71]'], 2),
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'st-02-outliers-b', objectiveId: 'st-obj-outliers', title: 'Which Sensor Reading Is Off?', mode: 'challenge', language: 'python', skillIds: ['stat.spread', 'py.lists'], concepts: ['quartiles', 'IQR', 'outliers', 'index'], difficulty: 3, context: 'engineering',
      prompt: text(
        'A monitoring script must report **where** the odd readings are. Write `odd_positions(readings)` returning the **indexes** (ascending) of readings outside the IQR fences: below `Q1 − 1.5 × IQR` or above `Q3 + 1.5 × IQR`.',
        'Quartiles: sort a copy; Q1 is the median of the lower half, Q3 the median of the upper half; with an odd count the middle value belongs to neither half. With fewer than 4 readings return `[]`. Do not reorder the original list.',
      ),
      expectedBehavior: 'Ascending indexes of readings strictly outside the fences.',
      starterCode: 'def odd_positions(readings):\n    pass\n',
      hints: ['You need to sort for the quartiles but keep positions for the answer.', 'enumerate() gives positions as you loop.', 'Compare against the fences with strict inequalities.'],
      checks: statCalls('odd_positions', POS, ['[10, 12, 12, 13, 12, 11, 95]', '[90, 1, 2, 3, 2, 3, 2, -80]', '[5, 5, 5]', '[1, 2, 3, 4, 5, 6, 7, 8]', '[1, 1, 1, 1, 1, 50]', '[3, 99, 4, 5, 4, 3, 5, 4, 3]', '[0, 0, 0, 0, 1]'], 2),
      xpReward: 80, coinReward: 12,
    },
  ],
};
