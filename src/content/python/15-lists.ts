import { calls } from '../helpers';
import { text } from '../helpers';
import type { LessonBundle } from '../schema';

const noMutation = (call: string, data: string, expectAfter: string) => ({
  kind: 'script' as const, name: 'The original list is left unchanged', visible: false,
  code: `data = ${data}\n${call}\nassert data == ${expectAfter}, "Your function changed the list that was passed in. Build a NEW list instead."`,
});

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-15-lists', title: 'Many Values, One Name', language: 'python', skillId: 'py.lists',
    blurb: 'Lists: storing, reaching, filtering, sorting and searching collections of values.', prerequisites: ['py-13-wake-robot'], xpReward: 40,
    reference: {
      title: 'Lists',
      body: text(
        'A list holds many values in order: `readings = [12, 15, 11]`. Positions start at **0**: `readings[0]` is the first, `readings[-1]` the last. `len(readings)` counts them; `readings.append(x)` adds one.',
        'Slices take a piece: `readings[1:3]` (items 1 and 2), `readings[:2]` (first two). `for x in readings:` visits each item. `x in readings` tests membership. `sorted(readings)` returns a NEW sorted list (`reverse=True` for descending); `readings.sort()` sorts in place.',
        'Filtering pattern: start with an empty list, loop, and `append` the items you want.',
      ),
      example: 'big = []\nfor r in readings:\n    if r > 12:\n        big.append(r)',
    },
    steps: [
      {
        kind: 'teach', title: 'One name, many values',
        body: text(
          'So far each variable held one value. Real problems involve **collections**: a day of sensor readings, every order in a shop, all the players on a team. Python’s basic collection is the **list**: an ordered sequence written in square brackets.',
          'Items are numbered from **0**. That surprises everyone at first, and it is the source of countless off-by-one bugs, so watch the numbers carefully. Negative numbers count from the end: `-1` is the last item.',
        ),
      },
      {
        kind: 'demo', title: 'Reaching into a list',
        body: text('Predict each line’s output before you run it. Pay attention to which values `[1:3]` returns.'),
        code: 'readings = [12, 15, 11, 18, 14]\nprint(readings[0])\nprint(readings[-1])\nprint(readings[1:3])\nprint(len(readings))\nreadings.append(20)\nprint(readings)\nprint(15 in readings)\nprint(sorted(readings, reverse=True))\nprint(readings)',
        notice: 'A slice `[1:3]` stops BEFORE index 3, just like `range`. `sorted(...)` gave back a new list and left `readings` alone, so the last line still shows the original order plus the appended 20.',
      },
      {
        kind: 'demo', title: 'Going past the end', expectsError: true,
        body: text('A list of 3 items has indexes 0, 1 and 2. What happens if we ask for index 3?'),
        code: 'temps = [21.5, 22.0, 19.8]\nprint(temps[2])\nprint(temps[3])',
        notice: 'A real `IndexError`: “list index out of range”. The traceback points to line 3. The most common cause is thinking a list of 3 has an item number 3. It ends at 2.',
      },
      {
        kind: 'teach', title: 'Filtering, searching, sorting',
        body: text(
          'Three patterns cover a huge share of everyday programming. **Filtering**: build a new list of only the items that pass a test (start with `[]`, loop, `append`). **Searching**: find where something is, or whether it exists. **Sorting**: put items in order, then take a slice such as the top three.',
          'A good habit: functions should usually **return a new list** rather than changing the one they were given. Someone else may still need the original.',
        ),
      },
      { kind: 'challenge', challengeId: 'py-15-reading-summary' },
      { kind: 'challenge', challengeId: 'py-15-over-limit' },
      { kind: 'challenge', challengeId: 'py-15-top-three' },
      { kind: 'challenge', challengeId: 'py-15-first-defect' },
    ],
  },
  objectives: [
    { id: 'py-obj-list-filter', title: 'Filter a list into a new list', summary: 'Loop over a list and collect the items that pass a test, without changing the original.' },
    { id: 'py-obj-sort-slice', title: 'Sort and take the top few', summary: 'Order a list, then use a slice to keep the first few items.' },
    { id: 'py-obj-list-search', title: 'Search a list for the first match', summary: 'Find the position of the first item meeting a condition, or report that none does.' },
  ],
  challenges: [
    {
      id: 'py-15-reading-summary', title: 'Reading Summary', mode: 'learning', language: 'python', skillIds: ['py.lists', 'py.functions'], concepts: ['list', 'indexing', 'len'], difficulty: 1, context: 'engineering',
      prompt: text('A sensor logs its readings in a list. Write a function `summary(readings)` that returns a text like `First: 12, Last: 18, Count: 4` for the list `[12, 15, 11, 18]`.', 'The list can be any length of at least one item.'),
      expectedBehavior: 'summary([12, 15, 11, 18]) returns "First: 12, Last: 18, Count: 4".',
      guidedSteps: ['The first item is at index `0`.', 'The last item is at index `-1`.', 'The number of items is `len(readings)`.', 'Build the text with an f-string and `return` it.'],
      starterCode: 'def summary(readings):\n    pass\n',
      hints: ['Which index holds the first item? Which holds the last?', 'Negative indexes count from the end, so one of them reaches the last item without any arithmetic.', 'An f-string can include `{readings[0]}`, `{readings[-1]}` and `{len(readings)}` directly.'],
      checks: calls('summary', [[[[12, 15, 11, 18]], 'First: 12, Last: 18, Count: 4'], [[[7]], 'First: 7, Last: 7, Count: 1'], [[[3, 9, 4, 4, 1]], 'First: 3, Last: 1, Count: 5'], [[['a', 'b']], 'First: a, Last: b, Count: 2']], 2),
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the function with def.' }],
      xpReward: 40, coinReward: 6,
    },
    {
      id: 'py-15-over-limit', objectiveId: 'py-obj-list-filter', title: 'Over the Limit', mode: 'challenge', language: 'python', skillIds: ['py.lists', 'py.loops', 'py.functions'], concepts: ['list', 'loop', 'append', 'filter'], difficulty: 2, context: 'manufacturing',
      prompt: text('A quality inspector measures shaft diameters. Write `over_limit(measurements, limit)` that returns a **new list** of the measurements strictly greater than `limit`, in their original order.', 'The list that was passed in must not be changed.'),
      expectedBehavior: 'over_limit([4.1, 5.2, 6.0, 3.9], 5.0) returns [5.2, 6.0]. If nothing is over the limit, it returns an empty list.',
      starterCode: '',
      hints: ['You need somewhere to collect the matching values. What should it start as?', 'Loop through the measurements, test each one against the limit, and add the ones that pass.', 'Start with `[]`, use `for m in measurements:` and `if m > limit:` then `append`. Return the new list after the loop.'],
      checks: [
        ...calls('over_limit', [[[[4.1, 5.2, 6.0, 3.9], 5.0], [5.2, 6.0]], [[[1, 2, 3], 10], []], [[[7, 7, 8], 7], [8]], [[[], 3], []], [[[-2, -1, 0], -1], [0]]], 2),
        noMutation('over_limit(data, 2)', '[1, 5, 3]', '[1, 5, 3]'),
      ],
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'py-15-large-payments', objectiveId: 'py-obj-list-filter', title: 'Large Payments', mode: 'challenge', language: 'python', skillIds: ['py.lists', 'py.loops', 'py.functions'], concepts: ['list', 'loop', 'append', 'filter'], difficulty: 2, context: 'finance',
      prompt: text('A bank flags payments for review. Write `large_payments(amounts, threshold)` that returns a **new list** of the amounts that are `threshold` or more (so a payment exactly at the threshold IS flagged), in their original order.', 'Do not change the list you are given.'),
      expectedBehavior: 'large_payments([120, 40, 500, 500, 9], 500) returns [500, 500].',
      starterCode: '',
      hints: ['You need a new list to collect the flagged amounts.', 'Loop through the amounts and test each one against the threshold. Read the boundary rule carefully.', '“Or more” means the comparison includes equality.'],
      checks: [
        ...calls('large_payments', [[[[120, 40, 500, 500, 9], 500], [500, 500]], [[[10, 20], 100], []], [[[100, 99.99, 100.01], 100], [100, 100.01]], [[[], 1], []], [[[5], 5], [5]]], 2),
        noMutation('large_payments(data, 4)', '[3, 4, 5]', '[3, 4, 5]'),
      ],
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'py-15-top-three', objectiveId: 'py-obj-sort-slice', title: 'Top Three Days', mode: 'challenge', language: 'python', skillIds: ['py.lists', 'py.functions'], concepts: ['sorted', 'slice', 'list'], difficulty: 3, context: 'business',
      prompt: text('A shop tracks daily sales. Write `top_three(sales)` that returns the three largest values, **largest first**. If there are fewer than three values, return all of them, still largest first.', 'Do not change the list you are given.'),
      expectedBehavior: 'top_three([5, 1, 9, 3, 7]) returns [9, 7, 5]. top_three([4, 8]) returns [8, 4]. top_three([]) returns [].',
      starterCode: '',
      hints: ['Ordering the values first makes “the biggest three” easy to find.', 'One built-in returns a sorted COPY and can go biggest-first. Then you only need the first three items.', '`sorted(sales, reverse=True)[:3]`. A slice that asks for more items than exist just returns what is there.'],
      checks: [
        ...calls('top_three', [[[[5, 1, 9, 3, 7]], [9, 7, 5]], [[[4, 8]], [8, 4]], [[[]], []], [[[2, 2, 2, 2]], [2, 2, 2]], [[[10, -5, 3, 10]], [10, 10, 3]]], 2),
        noMutation('top_three(data)', '[3, 1, 2, 9]', '[3, 1, 2, 9]'),
      ],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-15-fastest-laps', objectiveId: 'py-obj-sort-slice', title: 'Fastest Laps', mode: 'challenge', language: 'python', skillIds: ['py.lists', 'py.functions'], concepts: ['sorted', 'slice', 'list'], difficulty: 3, context: 'games',
      prompt: text('A racing game records lap times in seconds. Write `fastest_laps(times)` that returns the three **smallest** times, smallest first. With fewer than three laps, return them all in order.', 'The list that was passed in must not change.'),
      expectedBehavior: 'fastest_laps([61.2, 58.9, 60.1, 59.5]) returns [58.9, 59.5, 60.1].',
      starterCode: '',
      hints: ['In a race, smaller is better. Think about which way to sort.', 'Sort a copy, then keep only the first three.', '`sorted(times)[:3]`; the default order is smallest first.'],
      checks: [
        ...calls('fastest_laps', [[[[61.2, 58.9, 60.1, 59.5]], [58.9, 59.5, 60.1]], [[[70.0]], [70.0]], [[[]], []], [[[60, 60, 59, 61, 60]], [59, 60, 60]], [[[3, 2, 1]], [1, 2, 3]]], 2),
        noMutation('fastest_laps(data)', '[9, 8, 7, 6]', '[9, 8, 7, 6]'),
      ],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-15-first-defect', objectiveId: 'py-obj-list-search', title: 'First Defect', mode: 'challenge', language: 'python', skillIds: ['py.lists', 'py.loops', 'py.functions'], concepts: ['list', 'index', 'search', 'for'], difficulty: 3, context: 'manufacturing',
      prompt: text('A conveyor scanner reports one code per part: `"OK"` or `"DEFECT"`. Write `first_defect(codes)` that returns the **index** of the first `"DEFECT"`, or `-1` if there is none.', 'Practise the search yourself: do not use the `.index()` method.'),
      expectedBehavior: 'first_defect(["OK", "OK", "DEFECT", "DEFECT"]) returns 2. first_defect(["OK"]) returns -1.',
      starterCode: '',
      hints: ['You need to look at the items one by one, and remember WHERE each one is.', 'A loop over the positions `range(len(codes))` gives you both the position and, via indexing, the value.', 'Return the position as soon as you find a match. Only after the loop ends do you return -1.'],
      checks: calls('first_defect', [[[['OK', 'OK', 'DEFECT', 'DEFECT']], 2], [[['OK']], -1], [[['DEFECT']], 0], [[[]], -1], [[['OK', 'DEFECT', 'OK', 'DEFECT']], 1], [[['ok', 'defect']], -1]], 2),
      constraints: [{ type: 'forbids', node: 'call:index', message: 'Do not use the .index() method. Write the search with a loop.' }],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-15-first-overheat', objectiveId: 'py-obj-list-search', title: 'First Overheat', mode: 'challenge', language: 'python', skillIds: ['py.lists', 'py.loops', 'py.functions'], concepts: ['list', 'index', 'search', 'for'], difficulty: 3, context: 'science',
      prompt: text('A lab logs a temperature every minute. Write `first_over(temps, limit)` that returns the **index** (the minute number, counting from 0) of the first reading strictly above `limit`, or `-1` if none is.'),
      expectedBehavior: 'first_over([20.5, 21.0, 25.3, 30.1], 25) returns 2. first_over([1, 2, 3], 5) returns -1.',
      starterCode: '',
      hints: ['You need the position of a matching reading, not the reading itself.', 'Loop over the positions, and compare each reading to the limit.', 'Return the position immediately when a reading exceeds the limit; return -1 only after the loop.'],
      checks: calls('first_over', [[[[20.5, 21.0, 25.3, 30.1], 25], 2], [[[1, 2, 3], 5], -1], [[[5, 5, 5], 5], -1], [[[9], 5], 0], [[[], 0], -1], [[[1, 9, 2, 9], 5], 1]], 2),
      xpReward: 65, coinReward: 10,
    },
  ],
};
