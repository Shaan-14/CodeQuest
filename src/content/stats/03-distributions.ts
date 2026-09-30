import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { statCalls } from './helpers';

const FREQ = 'def _ref(values):\n    out = {}\n    for v in values:\n        out[v] = out.get(v, 0) + 1\n    return out';
const BINS = 'def _ref(values, width):\n    if not values:\n        return []\n    counts = [0] * (int(max(values) // width) + 1)\n    for v in values:\n        counts[int(v // width)] += 1\n    return counts';
const PCT = 'import math\ndef _ref(values, p):\n    if not values:\n        return None\n    s = sorted(values)\n    rank = max(1, math.ceil(p / 100 * len(s)))\n    return s[rank - 1]';

export const bundle: LessonBundle = {
  lesson: {
    id: 'st-03-distributions', title: 'Distributions: Shape, Bins and Percentiles', language: 'python', skillId: 'stat.distributions',
    blurb: 'See how values are spread out: frequency tables, histogram bins and percentiles.', prerequisites: ['st-01-describing'], xpReward: 65,
    reference: {
      title: 'Describing a distribution',
      body: text(
        'A **frequency table** counts how often each value occurs. For continuous values, group them into **bins** of equal width (`0–9`, `10–19`, …) and count per bin: that is a histogram. The bin width changes the picture, so choose it deliberately.',
        'A **percentile** answers “what value is at least p% of the data at or below?”. The **nearest-rank** method: sort, compute `rank = ceil(p/100 × n)` (at least 1) and take the value at that rank. The 50th percentile is (almost) the median; the 95th is often used for response-time limits.',
      ),
      example: 'import math\nvalues = sorted([12, 7, 30, 15, 9, 22])\nrank = math.ceil(0.9 * len(values))\nprint(values[rank - 1])\nprint(int(17 // 10))   # which bin of width 10 holds 17?',
    },
    steps: [
      { kind: 'teach', title: 'From a list to a picture', body: text('Looking at 500 numbers is hopeless; looking at how many fall in each range is easy. Counting per value gives a **frequency table**. Counting per range gives a **histogram**.', 'Binning uses integer division: with a width of 10, `v // 10` is the bin number. Bin 0 holds 0–9, bin 1 holds 10–19 and so on. The bin count must reach the largest value, and bins that nobody falls into still exist (count 0): dropping them hides gaps.') },
      {
        kind: 'demo', title: 'Counting into bins', language: 'python',
        body: text('Scores out of 100 counted into bins of width 10. Notice the empty bin.'),
        code: 'scores = [45, 52, 58, 61, 67, 69, 88, 91, 95]\nwidth = 10\ncounts = [0] * (max(scores) // width + 1)\nfor s in scores:\n    counts[s // width] += 1\nfor i, c in enumerate(counts):\n    print(f"{i * width:>3}-{i * width + width - 1:<3} {\'#\' * c}")',
        notice: 'The 70s row is empty, and that gap is itself information: nobody scored 70 to 79.',
      },
      { kind: 'challenge', challengeId: 'st-03-frequency' },
      { kind: 'challenge', challengeId: 'st-03-bins' },
      { kind: 'challenge', challengeId: 'st-03-bins-b' },
      { kind: 'challenge', challengeId: 'st-03-percentile' },
      { kind: 'challenge', challengeId: 'st-03-percentile-b' },
    ],
  },
  objectives: [
    { id: 'st-obj-bins', title: 'Binning values into a histogram', summary: 'Count values into equal-width bins, keeping empty bins.' },
    { id: 'st-obj-percentile', title: 'Nearest-rank percentiles', summary: 'Find the value at a given percentile of sorted data.' },
  ],
  challenges: [
    {
      id: 'st-03-frequency', title: 'Shift Tally', mode: 'learning', language: 'python', skillIds: ['stat.distributions', 'py.dicts'], concepts: ['frequency table'], difficulty: 1, context: 'operations',
      prompt: text('Write `frequencies(values)` returning a dictionary that maps each distinct value to **how many times it occurs**. An empty list gives `{}`.'),
      expectedBehavior: 'A dict of value → count.',
      guidedSteps: ['Start with an empty dictionary.', 'For each value add one to its count; `counts.get(v, 0)` supplies the start.', 'Return the dictionary.'],
      starterCode: 'def frequencies(values):\n    pass\n',
      hints: ['A dictionary remembers a number per key.', 'The first time you see a value its count does not exist yet.', 'counts[v] = counts.get(v, 0) + 1'],
      checks: statCalls('frequencies', FREQ, ["[3, 1, 3, 3, 2]", "['a', 'b', 'a']", '[]', '[7]', '[1.5, 1.5, 2.5]'], 3),
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'st-03-bins', objectiveId: 'st-obj-bins', title: 'Exam Score Histogram', mode: 'challenge', language: 'python', skillIds: ['stat.distributions', 'py.lists'], concepts: ['bins', 'histogram'], difficulty: 3, context: 'education',
      prompt: text('Write `score_histogram(scores, width)` returning a **list of counts**, one per bin of the given `width`, starting at 0. Bin 0 holds `0` to `width − 1`, bin 1 holds `width` to `2·width − 1`, and so on, up to and including the bin that holds the **largest** score. **Empty bins in between must appear as 0.** An empty list gives `[]`. Scores are never negative.'),
      expectedBehavior: 'A list of per-bin counts from bin 0 to the bin of the maximum, zeros included.',
      starterCode: 'def score_histogram(scores, width):\n    pass\n',
      hints: ['Which bin does a score belong to? One arithmetic operation tells you.', 'How many bins do you need? Ask the largest value.', 'Start with all zeros, then add.'],
      checks: statCalls('score_histogram', BINS.replace('_ref(values, width)', '_ref(scores, width)').replace(/values/g, 'scores'), ['[45, 52, 58, 61, 67, 69, 88, 91, 95], 10', '[0, 5, 10, 15], 5', '[], 10', '[9, 10], 10', '[100], 25', '[3, 3, 3], 1', '[99, 0, 50], 20', '[12.5, 7.5, 19.9], 10'], 2),
      xpReward: 75, coinReward: 11,
    },
    {
      id: 'st-03-bins-b', objectiveId: 'st-obj-bins', title: 'Response Time Buckets', mode: 'challenge', language: 'python', skillIds: ['stat.distributions', 'py.lists'], concepts: ['bins', 'histogram'], difficulty: 3, context: 'software',
      prompt: text('A web service logs response times in milliseconds. Write `latency_buckets(times, size)` returning a **list of counts**, one per bucket of `size` milliseconds, from bucket 0 (`0` up to `size − 1`) through the bucket that holds the **slowest** request. **Buckets in between that nobody landed in count 0.** No requests gives `[]`.'),
      expectedBehavior: 'A list of per-bucket counts from bucket 0 to the bucket of the largest time, zeros included.',
      starterCode: 'def latency_buckets(times, size):\n    pass\n',
      hints: ['Turn each time into a bucket number.', 'Create every bucket you need up front so gaps exist.', 'Mind the boundary: a time of exactly `size` belongs in the next bucket.'],
      checks: statCalls('latency_buckets', BINS.replace('_ref(values, width)', '_ref(times, width)').replace(/values/g, 'times'), ['[12, 48, 55, 210, 230, 15], 50', '[0, 99, 100], 100', '[], 50', '[499], 100', '[250, 250], 250', '[1, 2, 3, 4, 5, 6], 2', '[1999, 2000], 1000'], 2),
      xpReward: 75, coinReward: 11,
    },
    {
      id: 'st-03-percentile', objectiveId: 'st-obj-percentile', title: 'The Scholarship Cut-Off', mode: 'challenge', language: 'python', skillIds: ['stat.distributions', 'py.lists'], concepts: ['percentile', 'nearest rank'], difficulty: 3, context: 'education',
      prompt: text('A scholarship goes to students at or above a chosen percentile. Write `cutoff(scores, p)` returning the **nearest-rank percentile**: sort the scores, compute `rank = ceil(p / 100 × n)` (never less than 1) and return the score at that rank (rank 1 is the smallest). No scores gives `None`. Do not change the list you are given.'),
      expectedBehavior: 'The nearest-rank p-th percentile; None for empty input.',
      starterCode: 'def cutoff(scores, p):\n    pass\n',
      hints: ['Order the data first.', 'The rank is counted from 1, but lists count from 0.', 'p = 0 would give rank 0, which does not exist.'],
      checks: [...statCalls('cutoff', PCT.replace('_ref(values, p)', '_ref(scores, p)').replace(/values/g, 'scores'), ['[15, 20, 35, 40, 50], 40', '[15, 20, 35, 40, 50], 100', '[], 90', '[7], 50', '[3, 1, 2, 9, 8, 7], 50', '[1, 2, 3, 4], 25', '[1, 2, 3, 4], 0', '[10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 95'], 2),
        { kind: 'script', name: 'The input list is left alone', visible: false, code: 'd = [3, 1, 2]\ncutoff(d, 50)\nassert d == [3, 1, 2], "Do not reorder the list you were given."' },
      ],
      xpReward: 75, coinReward: 11,
    },
    {
      id: 'st-03-percentile-b', objectiveId: 'st-obj-percentile', title: 'The Latency Promise', mode: 'challenge', language: 'python', skillIds: ['stat.distributions', 'py.lists'], concepts: ['percentile', 'nearest rank'], difficulty: 3, context: 'software',
      prompt: text('A service promises that most requests finish within a time limit. Write `latency_at(times, p)` returning the **nearest-rank percentile** of the response times: sort a copy, compute `rank = ceil(p / 100 × n)` (at least 1) and return the time at that rank (rank 1 is the fastest). No requests gives `None`.'),
      expectedBehavior: 'The nearest-rank p-th percentile of the times; None for none.',
      starterCode: 'def latency_at(times, p):\n    pass\n',
      hints: ['What must be true of the data before you can pick by position?', 'The rank is a count, so it starts at 1.', 'Round the rank up, never down.'],
      checks: statCalls('latency_at', PCT.replace('_ref(values, p)', '_ref(times, p)').replace(/values/g, 'times'), ['[120, 80, 95, 300, 110], 95', '[120, 80, 95, 300, 110], 50', '[], 99', '[42], 99', '[5, 1, 4, 2, 3], 80', '[5, 1, 4, 2, 3], 81', '[10, 20], 1', '[5, 1, 4], 0'], 2),
      xpReward: 75, coinReward: 11,
    },
  ],
};
