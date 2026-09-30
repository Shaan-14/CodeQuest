import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { statCalls } from './helpers';

const FORECAST = 'def _ref(values):\n    n = len(values)\n    if n < 2:\n        return None\n    xs = list(range(n))\n    mx, my = sum(xs) / n, sum(values) / n\n    slope = sum((x - mx) * (y - my) for x, y in zip(xs, values)) / sum((x - mx) ** 2 for x in xs)\n    return round(my + slope * (n - mx), 2)';
const PREDICT = 'def _ref(xs, ys, x_new):\n    n = len(xs)\n    if n < 2 or n != len(ys):\n        return None\n    mx, my = sum(xs) / n, sum(ys) / n\n    sxx = sum((x - mx) ** 2 for x in xs)\n    if sxx == 0:\n        return None\n    slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx\n    return round(my + slope * (x_new - mx), 2)';
const ROLL = 'def _ref(values, window):\n    if window <= 0 or window > len(values):\n        return []\n    return [round(sum(values[i:i + window]) / window, 2) for i in range(len(values) - window + 1)]';
const TOTALS = 'def _ref(values, window):\n    if window <= 0 or window > len(values):\n        return []\n    return [sum(values[i:i + window]) for i in range(len(values) - window + 1)]';

export const bundle: LessonBundle = {
  lesson: {
    id: 'st-10-research', title: 'Unfamiliar Tools: Forecasts and Rolling Windows', language: 'python', skillId: 'stat.correlation',
    blurb: 'Two problems that need tools you have not been taught. Find them in the Field Manual (or derive them), test them on small cases you can check by hand, and verify the edges.', prerequisites: ['st-05-correlation'], xpReward: 90,
    reference: {
      title: 'Working it out when nobody told you how',
      body: text(
        'A straight line fitted to points by **least squares** has slope `Σ(x − x̄)(y − ȳ) / Σ(x − x̄)²` and passes through `(x̄, ȳ)`; the prediction at `x` is `ȳ + slope × (x − x̄)`. The standard library can do it (look in the Field Manual), and so can you, with the formulas above.',
        'A **rolling window** slides over a sequence: for window `k`, the first result uses items `0..k−1`, the next `1..k`, and so on, giving `len − k + 1` results.',
      ),
      example: 'import statistics\nslope, intercept = statistics.linear_regression([0, 1, 2, 3], [2, 4, 6, 8])\nprint(slope, intercept, slope * 4 + intercept)\nvalues = [1, 2, 3, 4, 5]\nprint([sum(values[i:i + 3]) / 3 for i in range(len(values) - 2)])',
    },
    steps: [
      { kind: 'teach', title: 'The method, in practice', body: text('Nobody remembers every function. The professional skill is: say what you need in plain words, search the documentation for it, read the signature and the **edge-case notes**, test on a tiny example whose answer you know, then test the edges (too little data, no variation, empty input).', 'Open the Field Manual while you work on these problems. Looking things up is part of the job, and it never lowers your reward.') },
      { kind: 'challenge', challengeId: 'st-10-forecast' },
      { kind: 'challenge', challengeId: 'st-10-rolling' },
    ],
  },
  objectives: [
    { id: 'st-obj-forecast', title: 'Predict from a fitted line', summary: 'Fit a least-squares line to data and use it to predict a new value, handling degenerate inputs.' },
    { id: 'st-obj-rolling', title: 'Rolling windows over a sequence', summary: 'Compute a value for every consecutive window of a sequence, handling windows that do not fit.' },
  ],
  challenges: [
    {
      id: 'st-10-forecast', objectiveId: 'st-obj-forecast', title: 'Next Month’s Sales', mode: 'challenge', language: 'python', skillIds: ['stat.correlation', 'ps.research'], concepts: ['linear regression', 'prediction'], difficulty: 3, context: 'business',
      prompt: text('Monthly sales figures arrive as a list, month 0 first. Write `forecast_next(values)` that fits a **straight line (least squares)** through the points (month number, sales) and returns the line’s prediction for the **next** month, **rounded to 2 decimals**. With fewer than 2 months return `None`.'),
      expectedBehavior: 'The least-squares line’s prediction at month n, rounded to 2 places; None for fewer than 2 months.',
      starterCode: 'def forecast_next(values):\n    pass\n',
      hints: ['You may have to look this up. What is the thing you want called in statistics?', 'The month number is the x value; the sales figure is y.', 'Test with points that lie exactly on a line: the prediction must continue it.'],
      checks: statCalls('forecast_next', FORECAST, ['[2, 4, 6, 8]', '[10, 10, 10]', '[5]', '[]', '[100, 90, 95, 80, 85, 70]', '[1, 3, 2, 5, 4, 7]', '[0.5, 1.5]'], 2),
      xpReward: 90, coinReward: 13,
    },
    {
      id: 'st-10-predict', objectiveId: 'st-obj-forecast', title: 'Energy From Temperature', mode: 'challenge', language: 'python', skillIds: ['stat.correlation', 'ps.research'], concepts: ['linear regression', 'prediction'], difficulty: 3, context: 'energy',
      prompt: text('Write `predict_at(xs, ys, x_new)`: fit a **straight line (least squares)** to the paired measurements `xs` (for example temperatures) and `ys` (for example energy use) and return the line’s prediction for `x_new`, **rounded to 2 decimals**. Return `None` when there are fewer than 2 points, the lists have different lengths, or every `x` is the same (no line can be fitted).'),
      expectedBehavior: 'The least-squares prediction at x_new rounded to 2 places; None when no line can be fitted.',
      starterCode: 'def predict_at(xs, ys, x_new):\n    pass\n',
      hints: ['Which list is the input and which is the output of the line?', 'When all x are equal the slope is undefined.', 'Check the mismatched-length case as well.'],
      checks: statCalls('predict_at', PREDICT, ['[1, 2, 3], [2, 4, 6], 4', '[0, 10, 20], [50, 40, 30], 15', '[5, 5, 5], [1, 2, 3], 7', '[1], [1], 2', '[1, 2], [1, 2, 3], 4', '[1, 2, 3, 4], [1, 3, 2, 5], 10', '[-5, 0, 5], [10, 12, 9], 0'], 2),
      xpReward: 90, coinReward: 13,
    },
    {
      id: 'st-10-rolling', objectiveId: 'st-obj-rolling', title: 'Smooth the Readings', mode: 'challenge', language: 'python', skillIds: ['stat.descriptive', 'ps.research'], concepts: ['rolling window', 'slicing'], difficulty: 3, context: 'engineering',
      prompt: text('Sensor readings are noisy. Write `rolling_mean(values, window)` returning a list with the **mean of every run of `window` consecutive readings**, in order, each **rounded to 2 decimals**. A list of `n` readings gives `n − window + 1` results. If `window` is zero or negative, or longer than the list, return `[]`.'),
      expectedBehavior: 'The mean of each window of consecutive readings; [] when the window does not fit.',
      starterCode: 'def rolling_mean(values, window):\n    pass\n',
      hints: ['Write out the first two windows by hand for [1, 2, 3, 4, 5] and window 3.', 'Slices can cut out exactly one window.', 'Decide what the loop should range over so the last window is complete.'],
      checks: statCalls('rolling_mean', ROLL, ['[1, 2, 3, 4, 5], 3', '[10, 20, 30], 1', '[1, 2], 5', '[], 2', '[4, 8, 6], 3', '[1.5, 2.5, 4.25, 9], 2', '[1, 2, 3], 0', '[1, 2, 3], -1'], 2),
      xpReward: 90, coinReward: 13,
    },
    {
      id: 'st-10-moving-total', objectiveId: 'st-obj-rolling', title: 'The Seven-Day Total', mode: 'challenge', language: 'python', skillIds: ['stat.descriptive', 'ps.research'], concepts: ['rolling window', 'slicing'], difficulty: 3, context: 'retail',
      prompt: text('Daily sales arrive as a list. Write `moving_total(sales, days)` returning a list with the **total of every run of `days` consecutive days**, in order. A list of `n` days gives `n − days + 1` totals. If `days` is zero or negative, or longer than the list, return `[]`.'),
      expectedBehavior: 'The sum of each window of consecutive days; [] when the window does not fit.',
      starterCode: 'def moving_total(sales, days):\n    pass\n',
      hints: ['Same shape as any rolling calculation.', 'How many windows fit?', 'Test a window of exactly the whole list.'],
      checks: statCalls('moving_total', TOTALS, ['[5, 1, 4, 2, 6], 3', '[10, 20], 2', '[1, 2], 3', '[], 1', '[3], 1', '[1, 2, 3, 4], 0', '[2.5, 1.5, 4], 2'], 2),
      xpReward: 90, coinReward: 13,
    },
  ],
};
