import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { statCalls } from './helpers';

const SE = 'import math\ndef _ref(values):\n    n = len(values)\n    if n < 2:\n        return None\n    m = sum(values) / n\n    sd = math.sqrt(sum((v - m) ** 2 for v in values) / (n - 1))\n    return round(sd / math.sqrt(n), 4)';
const CI = 'import math\ndef _rf_ci(values):\n    n = len(values)\n    m = sum(values) / n\n    sd = math.sqrt(sum((v - m) ** 2 for v in values) / (n - 1))\n    half = 1.96 * sd / math.sqrt(n)\n    return m - half, m + half\ndef _ref(values):\n    if len(values) < 2:\n        return None\n    lo, hi = _rf_ci(values)\n    return (round(lo, 2), round(hi, 2))';
const DIFF = 'import math\ndef _rf_ci(values):\n    n = len(values)\n    m = sum(values) / n\n    sd = math.sqrt(sum((v - m) ** 2 for v in values) / (n - 1))\n    half = 1.96 * sd / math.sqrt(n)\n    return m - half, m + half\ndef _ref(a, b):\n    if len(a) < 2 or len(b) < 2:\n        return False\n    alo, ahi = _rf_ci(a)\n    blo, bhi = _rf_ci(b)\n    return ahi < blo or bhi < alo';
const IMPROVE = 'import math\ndef _rf_ci(values):\n    n = len(values)\n    m = sum(values) / n\n    sd = math.sqrt(sum((v - m) ** 2 for v in values) / (n - 1))\n    half = 1.96 * sd / math.sqrt(n)\n    return m - half, m + half\ndef _ref(before, after):\n    if len(before) < 2 or len(after) < 2:\n        return False\n    blo, bhi = _rf_ci(before)\n    alo, ahi = _rf_ci(after)\n    return alo > bhi';

export const bundle: LessonBundle = {
  lesson: {
    id: 'st-08-inference', title: 'Comparing Groups and Reading Results Honestly', language: 'python', skillId: 'stat.inference',
    blurb: 'Standard error, confidence intervals and the question every A/B test asks: is this difference real, or noise?', prerequisites: ['st-06-sampling', 'st-07-probability'], xpReward: 75,
    reference: {
      title: 'Inference',
      body: text(
        'The **standard error** of a mean is `s / √n` (s is the sample standard deviation with n − 1). It says how much a sample mean would wobble if you repeated the sampling. A **95% confidence interval** is `mean ± 1.96 × SE`: a range of plausible values for the true mean.',
        'To compare two groups, compute an interval for each. **If the intervals do not overlap, the difference is clear.** If they overlap, you cannot tell signal from noise with this much data, and the honest answer is “no clear difference”, not “they are the same”. A small sample can miss a real effect; a huge sample can make a trivial difference look significant, so always ask whether the difference **matters**.',
      ),
      example: 'import math\nvalues = [12, 15, 11, 14, 13, 16]\nn = len(values); m = sum(values) / n\ns = math.sqrt(sum((v - m) ** 2 for v in values) / (n - 1))\nse = s / math.sqrt(n)\nprint(round(m - 1.96 * se, 2), round(m + 1.96 * se, 2))',
    },
    steps: [
      { kind: 'teach', title: 'Signal or noise?', body: text('Version B of a page loads 40 ms faster in your test of 8 visits. Is B better? With so few visits the average jumps around; another 8 visits might favour A. Inference is about quantifying that wobble so you do not announce a winner that is just luck.', 'We estimate the wobble of the mean with the **standard error**, turn it into a range with a **confidence interval**, and compare ranges. No method can prove a difference: it can only say whether the data is enough to rule out chance.') },
      {
        kind: 'demo', title: 'Overlapping or not', language: 'python',
        body: text('Two small groups and two larger ones with the same averages.'),
        code: 'import math\ndef interval(v):\n    n = len(v); m = sum(v) / n\n    s = math.sqrt(sum((x - m) ** 2 for x in v) / (n - 1))\n    h = 1.96 * s / math.sqrt(n)\n    return round(m - h, 1), round(m + h, 1)\na = [10, 14, 9, 15, 12, 13]\nb = [13, 17, 12, 18, 15, 16]\nprint(interval(a), interval(b))\nprint(interval(a * 8), interval(b * 8))',
        notice: 'With 6 values each the intervals overlap: no clear difference. The same values repeated 8 times (a pretend bigger study) separate cleanly. More data narrows the intervals.',
      },
      { kind: 'challenge', challengeId: 'st-08-se' },
      { kind: 'challenge', challengeId: 'st-08-interval' },
      { kind: 'challenge', challengeId: 'st-08-interval-b' },
      { kind: 'challenge', challengeId: 'st-08-compare' },
      { kind: 'challenge', challengeId: 'st-08-compare-b' },
    ],
  },
  objectives: [
    { id: 'st-obj-interval', title: 'Confidence intervals for a mean', summary: 'Turn a sample into a range of plausible values for the true mean.' },
    { id: 'st-obj-compare', title: 'Is the difference clear?', summary: 'Compare two groups by whether their intervals overlap.' },
  ],
  challenges: [
    {
      id: 'st-08-se', title: 'How Wobbly Is the Average?', mode: 'learning', language: 'python', skillIds: ['stat.inference', 'stat.spread'], concepts: ['standard error'], difficulty: 3, context: 'science',
      prompt: text('Write `standard_error(values)` returning the **standard error of the mean**: the sample standard deviation (divide by **n − 1**) divided by √n, **rounded to 4 decimal places**. With fewer than 2 values return `None`.'),
      expectedBehavior: 's/√n with s the sample standard deviation; None for fewer than two values.',
      guidedSteps: ['Compute the mean.', 'Sum squared distances from the mean and divide by n − 1; take the square root (that is s).', 'Divide s by the square root of n and round.'],
      starterCode: 'def standard_error(values):\n    pass\n',
      hints: ['You computed a sample standard deviation earlier.', 'A sample of one has no spread to estimate.', 'Round only at the end.'],
      checks: statCalls('standard_error', SE, ['[12, 15, 11, 14, 13, 16]', '[5, 5, 5, 5]', '[1, 3]', '[7]', '[]', '[10, 20, 30, 40, 50, 60, 70, 80]', '[0.5, 0.7, 0.4, 0.9]'], 3),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'st-08-interval', objectiveId: 'st-obj-interval', title: 'Crop Yield Range', mode: 'challenge', language: 'python', skillIds: ['stat.inference', 'stat.spread'], concepts: ['confidence interval'], difficulty: 3, context: 'agriculture',
      prompt: text('A farm measured the yield of a few test plots. Write `yield_interval(yields)` returning a tuple `(low, high)`: the **95% confidence interval for the mean yield**, `mean ± 1.96 × standard error`, with each end **rounded to 2 decimal places**. The standard error uses the sample standard deviation (n − 1). With fewer than 2 plots return `None`.'),
      expectedBehavior: '(mean − 1.96·SE, mean + 1.96·SE) rounded to 2 places; None for fewer than 2 values.',
      starterCode: 'def yield_interval(yields):\n    pass\n',
      hints: ['It builds on the standard error.', 'The interval is centred on the mean.', 'Return a tuple of two numbers.'],
      checks: statCalls('yield_interval', CI, ['[4.1, 3.8, 4.4, 4.0, 4.3]', '[10, 10, 10]', '[5, 7]', '[3]', '[]', '[100, 120, 90, 110, 130, 95, 105, 115]', '[-2, 0, 2, 4]'], 2),
      xpReward: 80, coinReward: 11,
    },
    {
      id: 'st-08-interval-b', objectiveId: 'st-obj-interval', title: 'Page Load Range', mode: 'challenge', language: 'python', skillIds: ['stat.inference', 'stat.spread'], concepts: ['confidence interval'], difficulty: 3, context: 'software',
      prompt: text('A performance team timed a few page loads (milliseconds). Write `load_interval(times)` returning `(low, high)`, the **95% confidence interval for the mean load time**: `mean ± 1.96 × standard error`, each end **rounded to 2 decimal places**. Use the sample standard deviation (n − 1). With fewer than 2 timings return `None`.'),
      expectedBehavior: '(mean − 1.96·SE, mean + 1.96·SE) rounded to 2 places; None for fewer than 2 values.',
      starterCode: 'def load_interval(times):\n    pass\n',
      hints: ['Mean first, then how uncertain that mean is.', 'One timing cannot show variation.', 'Both ends are rounded, not the width.'],
      checks: statCalls('load_interval', CI, ['[210, 190, 250, 230, 205, 240]', '[100, 100]', '[80, 120, 100]', '[300]', '[]', '[50, 55, 52, 48, 51, 49, 53, 50, 54, 47]', '[1000, 2000, 1500, 1700]'], 2),
      xpReward: 80, coinReward: 11,
    },
    {
      id: 'st-08-compare', objectiveId: 'st-obj-compare', title: 'Did the New Method Change Output?', mode: 'challenge', language: 'python', skillIds: ['stat.inference', 'stat.spread'], concepts: ['confidence interval', 'comparison'], difficulty: 4, context: 'manufacturing',
      prompt: text('Two production methods were each tried on several shifts. Write `clearly_different(a, b)` returning `True` when the **95% confidence intervals for the two means do not overlap** (`mean ± 1.96 × standard error`, sample standard deviation with n − 1; intervals that just touch count as overlapping), otherwise `False`. If either group has fewer than 2 values return `False` (there is not enough data to say).'),
      expectedBehavior: 'True only when the two 95% intervals are completely separate.',
      starterCode: 'def clearly_different(a, b):\n    pass\n',
      hints: ['Build an interval for each group first.', 'Two ranges are separate when one ends before the other begins, in either order.', 'Not enough data means you cannot claim a difference.'],
      checks: statCalls('clearly_different', DIFF, ['[10, 14, 9, 15, 12, 13], [13, 17, 12, 18, 15, 16]', '[10, 14, 9, 15, 12, 13] * 8, [13, 17, 12, 18, 15, 16] * 8', '[5, 5, 5], [9, 9, 9]', '[5, 5, 5], [5, 5, 5]', '[1], [100, 200]', '[], []', '[20, 21, 22, 20, 21], [10, 11, 10, 12, 11]', '[10, 11, 10, 12, 11], [20, 21, 22, 20, 21]', '[4, 5, 6], [6, 7, 8]', '[17, 15, 18, 15], [26, 21, 15, 23, 25]', '[13, 16, 14, 10], [20, 16, 16, 18, 15]'], 2),
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'st-08-compare-b', objectiveId: 'st-obj-compare', title: 'Is the Redesign Faster?', mode: 'challenge', language: 'python', skillIds: ['stat.inference', 'stat.spread'], concepts: ['confidence interval', 'comparison'], difficulty: 4, context: 'software',
      prompt: text('A redesign is only a clear **improvement** if users complete the task **with a higher score** and the evidence is strong. Write `clear_improvement(before, after)` returning `True` only when the **95% confidence interval of the "after" mean lies entirely above the interval of the "before" mean** (`mean ± 1.96 × standard error`, sample standard deviation, n − 1; touching counts as overlap). If either group has fewer than 2 values return `False`.'),
      expectedBehavior: 'True only when the after-interval is completely above the before-interval.',
      starterCode: 'def clear_improvement(before, after):\n    pass\n',
      hints: ['Direction matters here, unlike a plain difference.', 'Compare the lower end of the later interval with the upper end of the earlier one.', 'A big drop is not an improvement.'],
      checks: statCalls('clear_improvement', IMPROVE, ['[60, 62, 58, 61, 59], [70, 72, 69, 71, 73]', '[70, 72, 69, 71, 73], [60, 62, 58, 61, 59]', '[60, 70, 50, 65], [62, 72, 52, 68]', '[5], [50, 60]', '[], [1, 2]', '[10, 10, 10], [11, 11, 11]', '[10, 10, 10], [10, 10, 10]', '[1, 2, 3, 4, 5], [4, 5, 6, 7, 8]', '[17, 15, 18, 15], [26, 21, 15, 23, 25]', '[13, 16, 14, 10], [20, 16, 16, 18, 15]'], 2),
      xpReward: 100, coinReward: 15,
    },
  ],
};
