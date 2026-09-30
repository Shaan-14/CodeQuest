import { calls, text } from '../helpers';
import { refCalls, script } from '../daily/helpers';
import type { LessonBundle } from '../schema';

/** A list that counts how much of it a program reads, so "fast" is measured, not claimed. */
const COUNTED = "class Counted(list):\n    def __init__(self, *a):\n        super().__init__(*a)\n        self.reads = 0\n    def __getitem__(self, i):\n        r = list.__getitem__(self, i)\n        self.reads += len(r) if isinstance(i, slice) else 1\n        return r\n    def __iter__(self):\n        for x in list.__iter__(self):\n            self.reads += 1\n            yield x\n    def __contains__(self, x):\n        self.reads += len(self)\n        return list.__contains__(self, x)\n    def index(self, *a):\n        self.reads += len(self)\n        return list.index(self, *a)\n    def count(self, x):\n        self.reads += len(self)\n        return list.count(self, x)\n";

const TOP_REF = "def _ref(scores, n):\n    return sorted(scores, key=lambda p: (-p[1], p[0]))[:max(n, 0)]";
const FIRST_REF = "from bisect import bisect_left\ndef _ref(a, t):\n    i = bisect_left(a, t)\n    return i if i < len(a) else -1";
const BEFORE_REF = "from bisect import bisect_left\ndef _ref(a, t):\n    return bisect_left(a, t)";

const fast = (fn: string, ref: string, big: string, target: string) => [
  script('It is quick on a long list', `${COUNTED}${ref}\n_data = Counted(${big})\n_t = ${target}\n_got = ${fn}(_data, _t)\n_reads = _data.reads\nassert _got == _ref(list(_data), _t), 'Wrong answer on the long list.'\nassert _reads <= 40, 'Your function read %d items of a sorted list of 10000. A sorted list lets you rule out half of what is left with each look.' % _reads`, false),
  script('It is quick when many values repeat', `${COUNTED}${ref}\n_data = Counted([1] * 5000 + [2] * 5000)\nfor _t in (2, 1, 3, 0):\n    _data.reads = 0\n    _got = ${fn}(_data, _t)\n    _reads = _data.reads\n    assert _got == _ref(list(_data), _t), 'Wrong answer for target %r on a list with many repeats.' % (_t,)\n    assert _reads <= 40, 'Too many reads (%d) for target %r: do not scan through equal values.' % (_reads, _t)`, false),
];

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-31-searching-sorting', title: 'Finding Things Fast', language: 'python', skillId: 'py.algorithms',
    blurb: 'Sort by any rule, then search a sorted list by halving it. Learn to measure how much work a solution does.', prerequisites: ['py-17-records'], xpReward: 70,
    reference: {
      title: 'Sorting and searching',
      body: text(
        '`sorted(items, key=f, reverse=True)` returns a new sorted list; `list.sort()` sorts in place. **`key`** picks what to compare by: `key=lambda p: p[1]`. For **several criteria** return a tuple: `key=lambda p: (-p[1], p[0])` means "score high to low, then name A to Z". Python’s sort is **stable**: equal items keep their original order.',
        '**Linear search** checks items one by one: about *n* steps. **Binary search** works on a **sorted** list: look at the middle, discard the half that cannot contain the answer, repeat: about log₂(*n*) steps (10 000 items need about 14 looks, not 10 000). The pattern: keep `lo` and `hi` bounds and move one of them past the middle each time. Off-by-one errors live here, so test the ends, empty lists and repeated values.',
        'The standard library already has it: `bisect.bisect_left(a, x)` gives the leftmost position where `x` could be inserted to keep `a` sorted (so all items before it are `< x`). Knowing what exists is part of the skill; so is knowing how to measure whether your version really is fast.',
      ),
      example: 'lo, hi = 0, len(a)\nwhile lo < hi:\n    mid = (lo + hi) // 2\n    if a[mid] < target:\n        lo = mid + 1\n    else:\n        hi = mid\n# lo is now the first position whose value is >= target',
    },
    steps: [
      { kind: 'teach', title: 'Order first, then search', body: text('Two ideas carry most everyday data work. **Sorting** puts data in an order that suits the question (highest score first, earliest date first). **Searching** finds an item; on **sorted** data you can find it in a tiny fraction of the steps by repeatedly discarding half.', 'You will not just be told your search is fast: the checks **count how many items your function looks at**.') },
      {
        kind: 'demo', title: 'Sort by several criteria, then halve', language: 'python',
        body: text('First a multi-key sort. Then a binary search that counts its looks.'),
        code: "scores = [('Bo', 70), ('Ada', 90), ('Cy', 70), ('Di', 90)]\nprint(sorted(scores, key=lambda p: (-p[1], p[0])))\n\nvalues = list(range(0, 1000, 5))\nlo, hi, looks = 0, len(values), 0\nwhile lo < hi:\n    mid = (lo + hi) // 2\n    looks += 1\n    if values[mid] < 420:\n        lo = mid + 1\n    else:\n        hi = mid\nprint('first value >= 420 is at index', lo, 'after', looks, 'looks')",
        notice: 'Bo and Cy tied on 70 and kept name order thanks to the tuple key. The search needed about 8 looks for 200 values: the list was halved each time.',
      },
      { kind: 'challenge', challengeId: 'py-31-top-n' },
      { kind: 'challenge', challengeId: 'py-31-first-at-least' },
    ],
  },
  objectives: [
    { id: 'py-obj-binary-search', title: 'Binary search on a sorted list', summary: 'Find a position in a sorted list by halving the range, correctly (repeats, ends) and quickly (measured).' },
  ],
  challenges: [
    {
      id: 'py-31-top-n', title: 'The Leaderboard', mode: 'learning', language: 'python', skillIds: ['py.algorithms', 'py.records'], concepts: ['sorted', 'key', 'tuple-key'], difficulty: 2, context: 'games',
      prompt: text('A game keeps players as `(name, score)` tuples. Write `top_n(scores, n)` returning a **new list** with the `n` best players: highest score first, and players with equal scores in name order (A to Z). If `n` is zero or negative return an empty list; if `n` is larger than the number of players return them all. Do not change the input list.'),
      expectedBehavior: 'The first n tuples of the list sorted by (score descending, name ascending).',
      guidedSteps: ['Use `sorted` with a `key` function.', 'To sort scores high-to-low but names A-to-Z, make the key `(-score, name)`.', 'Slice the first `n` (guard against negative `n`).'],
      starterCode: 'def top_n(scores, n):\n    pass\n',
      hints: ['You need two sort criteria with different directions. How can one key express both?', 'Negating a number reverses its order without needing `reverse=True`.', 'A negative slice bound counts from the end, which is not what "n of zero or less" means.'],
      checks: [
        ...calls('top_n', [[[[['Bo', 70], ['Ada', 90], ['Cy', 70], ['Di', 90]], 3], [['Ada', 90], ['Di', 90], ['Bo', 70]]], [[[['Bo', 70]], 0], []]], 2),
        ...refCalls('top_n', TOP_REF, ["[('Bo', 70), ('Ada', 90), ('Cy', 70), ('Di', 90)], 3", "[('Bo', 70)], 5", "[], 3", "[('a', 1), ('b', 1), ('c', 1)], 2", "[('a', 1), ('b', 2)], -1", "[('z', 5), ('y', 5), ('x', 5)], 3", "[('a', -3), ('b', -1)], 1"]),
        script('The input list is left unchanged', "s = [('b', 1), ('a', 2)]\ntop_n(s, 2)\nassert s == [('b', 1), ('a', 2)], 'Do not change the input list.'", false),
      ],
      xpReward: 60, coinReward: 9,
    },
    {
      id: 'py-31-first-at-least', objectiveId: 'py-obj-binary-search', title: 'First Reading At Least', mode: 'challenge', language: 'python', skillIds: ['py.algorithms', 'py.lists'], concepts: ['binary-search', 'sorted', 'efficiency'], difficulty: 3, context: 'analytics',
      prompt: text('A dashboard stores millions of sorted sensor readings (smallest first; equal values may repeat). Write `first_at_least(values, target)` returning the **index of the first value that is greater than or equal to `target`**, or `-1` if every value is smaller. It must stay fast on very long lists: the checks count how many items your function looks at.'),
      expectedBehavior: 'The leftmost index whose value is at least the target, found by halving the search range; -1 when there is none.',
      starterCode: '',
      hints: ['What does a sorted list let you conclude from looking at just one item in the middle?', 'Keep two bounds; after each look, one of them moves past the middle. What should the loop stop on?', 'With repeated values you want the FIRST match: do not stop as soon as you see an equal item.'],
      checks: [
        ...refCalls('first_at_least', FIRST_REF, ['[], 5', '[1, 3, 3, 5], 3', '[1, 3, 3, 5], 4', '[1, 3, 3, 5], 6', '[1, 3, 3, 5], 0', '[7], 7', '[7], 8', '[2, 2, 2, 2], 2', '[1, 2, 4, 8, 16], 16', '[0.5, 1.5, 2.5], 1.5']),
        ...fast('first_at_least', FIRST_REF, 'range(0, 20000, 2)', '4999'),
      ],
      xpReward: 110, coinReward: 16,
    },
    {
      id: 'py-31-count-before', objectiveId: 'py-obj-binary-search', title: 'Meetings Before a Time', mode: 'challenge', language: 'python', skillIds: ['py.algorithms', 'py.lists'], concepts: ['binary-search', 'sorted', 'efficiency'], difficulty: 3, context: 'scheduling',
      prompt: text('A calendar service keeps meeting start times as numbers in a list sorted from earliest to latest (times may repeat). Write `count_before(times, t)` returning **how many meetings start strictly before `t`**. It must stay fast on very long calendars: the checks count how many items your function looks at.'),
      expectedBehavior: 'The number of items smaller than t in a sorted list, found by halving the search range.',
      starterCode: '',
      hints: ['If the list is sorted, "how many are smaller" is the same as "where would t go"?', 'Each look at the middle lets you discard half; which bound moves when the middle is too small?', 'Equal values must NOT be counted, so decide carefully which side of the comparison they fall on.'],
      checks: [
        ...refCalls('count_before', BEFORE_REF, ['[], 5', '[1, 3, 3, 5], 3', '[1, 3, 3, 5], 4', '[1, 3, 3, 5], 6', '[1, 3, 3, 5], 0', '[7], 7', '[7], 8', '[2, 2, 2, 2], 2', '[2, 2, 2, 2], 3', '[9.5, 10.5, 12.0], 10.5']),
        ...fast('count_before', BEFORE_REF, 'range(0, 20000, 2)', '4999'),
      ],
      xpReward: 110, coinReward: 16,
    },
  ],
};
