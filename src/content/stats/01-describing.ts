import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { statCalls } from './helpers';

const MEAN = 'def _ref(values):\n    return round(sum(values) / len(values), 2) if values else None';
const MEDIAN = 'def _ref(values):\n    s = sorted(values)\n    n = len(s)\n    if n == 0:\n        return None\n    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2';
const MEDIAN_SKIP = 'def _ref(values):\n    s = sorted(v for v in values if v is not None)\n    n = len(s)\n    if n == 0:\n        return None\n    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2';
const MODES = 'def _ref(values):\n    counts = {}\n    for v in values:\n        counts[v] = counts.get(v, 0) + 1\n    if not counts:\n        return []\n    top = max(counts.values())\n    return sorted(v for v, c in counts.items() if c == top)';
const HOURS = 'def _ref(times):\n    counts = {}\n    for t in times:\n        h = t.split(":")[0]\n        counts[h] = counts.get(h, 0) + 1\n    if not counts:\n        return []\n    top = max(counts.values())\n    return sorted(h for h, c in counts.items() if c == top)';
const DESCRIBE = 'def _ref(values):\n    if not values:\n        return {}\n    s = sorted(values)\n    n = len(s)\n    med = s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2\n    counts = {}\n    for v in values:\n        counts[v] = counts.get(v, 0) + 1\n    top = max(counts.values())\n    return {"count": n, "mean": round(sum(values) / n, 2), "median": med, "modes": sorted(v for v, c in counts.items() if c == top)}';
export const bundle: LessonBundle = {
  lesson: {
    id: 'st-01-describing', title: 'Describing Data: Mean, Median, Mode', language: 'python', skillId: 'stat.descriptive',
    blurb: 'Summarise a list of measurements with one honest number, and know when each summary misleads.', prerequisites: ['py-15-lists'], xpReward: 60,
    reference: {
      title: 'Measures of the centre',
      body: text(
        'The **mean** is the sum divided by the count: it uses every value, so one extreme value drags it. The **median** is the middle value of the sorted data (for an even count, the average of the two middle ones): it ignores how extreme the extremes are. The **mode** is the most frequent value; there can be several (a tie) or, for measurements, none worth reporting.',
        'Choosing a summary is a decision: incomes, house prices and waiting times are skewed, so a median describes a typical case better; a score average across equal exams suits a mean. Always say which one you used.',
      ),
      example: 'values = [4, 8, 6, 5, 3, 50]\nprint(sum(values) / len(values))   # 12.67: dragged up by 50\nprint(sorted(values)[2:4])         # the two middle values\nfrom collections import Counter\nprint(Counter([1, 2, 2, 3, 3]).most_common())',
    },
    steps: [
      { kind: 'teach', title: 'One number for many', body: text('A list of 10 000 delivery times is impossible to read, so we summarise it. The summary must answer a question: what is **typical**? Three answers are common, and they can disagree sharply.', 'The **mean** treats every value equally. The **median** splits the sorted data in half. The **mode** names the most common value. When a dataset has a few extreme values (an outlier), the mean follows them and the median does not. Which is “right” depends on the question.') },
      {
        kind: 'demo', title: 'One outlier, three answers', language: 'python',
        body: text('Five normal delivery times and one disaster. Run it, then change `50` to `7` and run it again.'),
        code: 'times = [4, 8, 6, 5, 3, 50]\nmean = sum(times) / len(times)\nordered = sorted(times)\nmiddle = len(ordered) // 2\nmedian = (ordered[middle - 1] + ordered[middle]) / 2\nprint("mean  ", round(mean, 2))\nprint("median", median)\n',
        notice: 'With the 50 the mean is 12.67 but no delivery actually took about 13 minutes; the median (5.5) describes the typical delivery. With a 7 instead, both agree again.',
      },
      { kind: 'challenge', challengeId: 'st-01-mean' },
      { kind: 'challenge', challengeId: 'st-01-median' },
      { kind: 'challenge', challengeId: 'st-01-median-b' },
      { kind: 'challenge', challengeId: 'st-01-modes' },
      { kind: 'challenge', challengeId: 'st-01-modes-b' },
      { kind: 'challenge', challengeId: 'st-01-describe' },
    ],
  },
  objectives: [
    { id: 'st-obj-describe', title: 'A complete data summary', summary: 'Combine centre measures into one honest summary of a dataset.' },
    { id: 'st-obj-median', title: 'Median of messy data', summary: 'Compute the middle value correctly for even/odd counts, unsorted input and missing values.' },
    { id: 'st-obj-modes', title: 'Most frequent values', summary: 'Find every value tied for most frequent.' },
  ],
  challenges: [
    {
      id: 'st-01-mean', title: 'The Average Score', mode: 'learning', language: 'python', skillIds: ['stat.descriptive', 'py.lists'], concepts: ['mean', 'sum', 'len'], difficulty: 1, context: 'education',
      prompt: text('Write `mean(values)` returning the **mean** of a list of numbers **rounded to 2 decimal places**. For an empty list return `None` (there is nothing to average).'),
      expectedBehavior: 'sum divided by count, rounded to 2 places; None for an empty list.',
      guidedSteps: ['Add the values with `sum(values)`.', 'Divide by `len(values)`; guard the empty list first.', 'Wrap the result in `round(x, 2)`.'],
      starterCode: 'def mean(values):\n    pass\n',
      hints: ['What two numbers do you need?', 'Dividing by zero is an error: what should an empty list do?', 'Round only the final answer.'],
      checks: [
        ...statCalls('mean', MEAN, ['[2, 4, 9]', '[10]', '[]', '[1, 2, 2, 3, 3, 10]', '[-3, 3]', '[0.1, 0.2, 0.3]', '[7, 8]'], 3),
        { kind: 'script', name: 'Rounded to 2 decimal places', visible: true, code: 'assert mean([1, 2, 2]) == 1.67, "Round the answer to exactly 2 decimal places (1, 2, 2 should give 1.67)."' },
      ],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'st-01-median', objectiveId: 'st-obj-median', title: 'Typical Delivery Time', mode: 'challenge', language: 'python', skillIds: ['stat.descriptive', 'py.lists'], concepts: ['median', 'sorted'], difficulty: 2, context: 'logistics',
      prompt: text('A courier wants the **typical** delivery time, and a few disastrous deliveries skew the average. Write `typical_time(minutes)` returning the **median** of a list of delivery times: the middle value once sorted, or the average of the two middle values when the count is even. Return `None` for an empty list. The list you are given must not be reordered.'),
      expectedBehavior: 'The median of the list; the input list is unchanged; None for an empty list.',
      starterCode: 'def typical_time(minutes):\n    pass\n',
      hints: ['Does the order the data arrives in matter to the middle?', 'Even and odd counts need different handling.', 'A sort that changes the original list breaks the “must not be reordered” rule.'],
      checks: [
        ...statCalls('typical_time', MEDIAN, ['[4, 8, 6, 5, 3, 50]', '[9, 1, 5]', '[]', '[7]', '[2, 2, 2, 100]', '[-5, 5, 0, 10]', '[3, 1, 2, 10, 20, 15, 11]', '[0.5, 1.5]']),
        { kind: 'script', name: 'The input list is left alone', visible: false, code: 'd = [3, 1, 2]\ntypical_time(d)\nassert d == [3, 1, 2], "Do not reorder the list you were given."' },
      ],
      xpReward: 60, coinReward: 9,
    },
    {
      id: 'st-01-median-b', objectiveId: 'st-obj-median', title: 'Typical Asking Price', mode: 'challenge', language: 'python', skillIds: ['stat.descriptive', 'py.lists'], concepts: ['median', 'missing values'], difficulty: 2, context: 'property',
      prompt: text('A property site lists asking prices, but some listings have no price yet and show `None`. Write `typical_price(prices)` returning the **median of the prices that exist**, ignoring the `None` entries. If no price exists return `None`.'),
      expectedBehavior: 'The median of the non-None values; None when there are none.',
      starterCode: 'def typical_price(prices):\n    pass\n',
      hints: ['First decide which entries belong in the calculation.', 'Missing values are not zeros: counting them as zero would drag the answer down.', 'After filtering, the middle of an even number of prices is the average of the two middle ones.'],
      checks: statCalls('typical_price', MEDIAN_SKIP, ['[250000, None, 310000, 180000]', '[None, None]', '[100, 200]', '[None, 5, None]', '[]', '[5, 1, 9, None, 3, 7]', '[1e6, 2e5, None, 3e5]'], 2),
      xpReward: 60, coinReward: 9,
    },
    {
      id: 'st-01-modes', objectiveId: 'st-obj-modes', title: 'Most Common Defect', mode: 'challenge', language: 'python', skillIds: ['stat.descriptive', 'py.dicts'], concepts: ['mode', 'frequency'], difficulty: 2, context: 'manufacturing',
      prompt: text('An inspection log lists defect codes. Write `most_common(codes)` returning a **sorted list of every code that appears the most times** (more than one when there is a tie). An empty log gives `[]`.'),
      expectedBehavior: 'A sorted list of all values tied for the highest count; [] for empty input.',
      starterCode: 'def most_common(codes):\n    pass\n',
      hints: ['You need a count per code before you can compare.', 'Find the highest count first, then collect every code with that count.', 'The answer is a list even when there is a single winner.'],
      checks: statCalls('most_common', MODES, ["['scratch', 'dent', 'scratch']", "['a', 'b', 'a', 'b', 'c']", '[]', '[3, 3, 3]', "['x']", '[1, 2, 3]', "['Z', 'z', 'Z']", '[5, 5, 4, 4, 4, 5, 9]'], 2),
      xpReward: 60, coinReward: 9,
    },
    {
      id: 'st-01-modes-b', objectiveId: 'st-obj-modes', title: 'Busiest Hours', mode: 'challenge', language: 'python', skillIds: ['stat.descriptive', 'py.dicts'], concepts: ['mode', 'frequency', 'strings'], difficulty: 2, context: 'operations',
      prompt: text('A help desk logs each call as a time like `"09:41"`. Write `busiest_hours(times)` returning a **sorted list of the hours** (the part before the colon, as text such as `"09"`) that received the **most calls**. Ties return every tied hour; an empty log gives `[]`.'),
      expectedBehavior: 'A sorted list of the hours with the highest call count.',
      starterCode: 'def busiest_hours(times):\n    pass\n',
      hints: ['Turn each time into the thing you are counting first.', 'Count, then find the top count, then collect every hour with it.', 'Keep the hours as text so "09" stays "09".'],
      checks: statCalls('busiest_hours', HOURS, ["['09:41', '09:05', '10:15']", "['08:00', '09:10']", '[]', "['23:59']", "['13:01', '13:59', '14:02', '14:30', '15:00']", "['00:10', '00:20', '01:00', '01:30', '02:00']"], 2),
      xpReward: 60, coinReward: 9,
    },
    {
      id: 'st-01-describe', objectiveId: 'st-obj-describe', title: 'The Data Sheet', mode: 'challenge', language: 'python', skillIds: ['stat.descriptive', 'py.dicts'], concepts: ['mean', 'median', 'mode', 'summary'], difficulty: 3, context: 'research',
      prompt: text('A lab wants a one-glance summary of a list of measurements. Write `describe(values)` returning a dictionary with the keys `"count"` (how many), `"mean"` (**rounded to 2 decimals**), `"median"` and `"modes"` (a **sorted list** of every most-frequent value). For an empty list return `{}`. Do not change the list you are given.'),
      expectedBehavior: 'A dict with count, mean (2 dp), median and modes; {} for an empty list.',
      starterCode: 'def describe(values):\n    pass\n',
      hints: ['Three of these you have built before; combine them.', 'Keep the input in its original order when you sort.', 'A list with no values has nothing to describe.'],
      checks: [
        ...statCalls('describe', DESCRIBE, ['[4, 8, 6, 5, 3, 50]', '[2, 2, 3, 3]', '[]', '[7]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]', '[0.5, 0.5, 1.5]', '[5, 1, 5, 2, 2]'], 2),
        { kind: 'script', name: 'The input list is left alone', visible: false, code: 'd = [3, 1, 2, 2]\ndescribe(d)\nassert d == [3, 1, 2, 2], "Do not reorder the list you were given."' },
      ],
      xpReward: 80, coinReward: 12,
    },
  ],
};
