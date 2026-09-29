import { calls, text } from '../helpers';
import type { LessonBundle } from '../schema';

const raisesFor = (call: string, why: string) => `try:\n    ${call}\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError(${JSON.stringify(why)})`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-19-debugging', title: 'Debugging Like a Detective', language: 'python', skillId: 'py.debugging',
    blurb: 'A systematic method for finding bugs, then defensive code: exceptions and edge cases.', prerequisites: ['py-18-function-design'], xpReward: 50,
    reference: {
      title: 'Debugging and defensive code',
      body: text(
        '**Method**: reproduce the problem → read the error (last line first, then the line number) → form a guess about the cause → test the guess (print a value, run a smaller case) → fix ONE thing → run again → check nearby cases.',
        'Common errors: `IndexError` (index past the end), `KeyError` (missing dict key), `TypeError` (wrong kind of value), `ValueError` (right kind, unacceptable value: `int("abc")`), `ZeroDivisionError`, `NameError`, `UnboundLocalError`. **Logic errors** raise nothing: the program runs and gives wrong answers, often at the edges (empty input, first/last item, exactly equal to a limit).',
        '**Handle expected failures**: `try:` / `except ValueError:` runs a fallback instead of crashing. **Refuse bad input**: `raise ValueError("reading must be 0-1000")`. Catch the specific error you expect, not everything.',
      ),
      example: 'def safe_int(text, default=0):\n    try:\n        return int(text)\n    except ValueError:\n        return default',
    },
    steps: [
      {
        kind: 'teach', title: 'Bugs are puzzles, not verdicts',
        body: text(
          'Professional programmers spend a large share of their time debugging. The people who are good at it are not the ones who never make mistakes; they are the ones with a **method**. They do not change code at random and hope. They ask: what did I expect, what happened instead, and where do those two first differ?',
          'Bugs come in two families. **Crashes** print an error that tells you a lot. **Logic errors** are quieter: the program finishes and prints something plausible but wrong. For those you need to test your **assumptions**, especially at the edges: empty lists, zero, the first and last item, values exactly equal to a limit.',
        ),
      },
      {
        kind: 'demo', title: 'Testing an assumption with print', expectsError: true,
        body: text('This function is supposed to average a list, and it crashes on some inputs. Run it and read the error, then think about WHICH input triggers it.'),
        code: 'def average(values):\n    return sum(values) / len(values)\n\nprint(average([4, 6, 8]))\nprint(average([]))',
        notice: 'The first call worked, which tells you the function is not simply broken. The `ZeroDivisionError` on line 5 means the failing case is the empty list, because `len([])` is 0. Reproducing the failure with a SMALL input is usually the fastest path to the cause.',
      },
      {
        kind: 'teach', title: 'Defensive programming',
        body: text(
          'Real data is messy, so good code decides ahead of time what should happen in unusual situations. There are two tools. `try/except` lets a program **recover** from an error you expected (a bad number in a file). `raise` lets your own function **refuse** bad input clearly, instead of quietly producing nonsense.',
        ),
      },
      {
        kind: 'demo', title: 'Recovering with try / except',
        body: text('Watch the program keep going where it would otherwise stop.'),
        code: 'raw = ["12", "7", "n/a", "30"]\ntotal = 0\nfor item in raw:\n    try:\n        total += int(item)\n    except ValueError:\n        print("skipping", item)\nprint("total:", total)',
        notice: 'Without the `try`, `int("n/a")` would end the whole program. With it, the bad item is skipped and the rest are counted. Catching `ValueError` specifically means genuine surprises (like a typo in your own code) still show up.',
      },
      { kind: 'challenge', challengeId: 'py-19-fix-average' },
      { kind: 'challenge', challengeId: 'py-19-count-over' },
      { kind: 'challenge', challengeId: 'py-19-safe-int' },
      { kind: 'challenge', challengeId: 'py-19-validate-reading' },
    ],
  },
  objectives: [
    { id: 'py-obj-debug-logic', title: 'Find and fix logic bugs', summary: 'Given code that runs but gives wrong answers, find the cause and fix it, checking the edge cases.' },
    { id: 'py-obj-safe-convert', title: 'Recover from bad input with try/except', summary: 'Wrap a risky operation so an expected error produces a fallback instead of a crash.' },
    { id: 'py-obj-raise', title: 'Refuse bad input with a clear error', summary: 'Validate arguments and raise ValueError when they are unacceptable.' },
  ],
  challenges: [
    {
      id: 'py-19-fix-average', title: 'Fix the Average', mode: 'learning', language: 'python', skillIds: ['py.debugging', 'py.defensive', 'py.functions'], concepts: ['debugging', 'off-by-one', 'ZeroDivisionError', 'edge cases'], difficulty: 2, context: 'data analysis',
      prompt: text('This function is meant to return the average of a list of numbers, and to return `0` for an empty list. It gives wrong answers. Find the bug(s) and fix them.'),
      expectedBehavior: 'average([10, 20, 30]) returns 20. average([5]) returns 5. average([]) returns 0.',
      guidedSteps: ['Run `print(average([10, 20, 30]))` yourself. What do you get, and what should you get?', 'Look at the divisor. How many values are there, and what does the code divide by?', 'Then think about the empty list.'],
      starterCode: 'def average(values):\n    total = 0\n    for v in values:\n        total += v\n    return total / (len(values) - 1)\n',
      hints: ['Test with a list where you can work out the answer by hand, and compare.', 'The number you divide by is not the number of values.', 'Fix the divisor to `len(values)`. Then add an `if` at the top so an empty list returns 0 before any division happens.'],
      checks: calls('average', [[[[10, 20, 30]], 20], [[[5]], 5], [[[]], 0], [[[1, 2]], 1.5], [[[-4, 4]], 0]], 3, { approx: 1e-9 }),
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Keep the function defined with def.' }],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'py-19-count-over', objectiveId: 'py-obj-debug-logic', title: 'Count the Overs', mode: 'challenge', language: 'python', skillIds: ['py.debugging', 'py.functions', 'py.lists'], concepts: ['debugging', 'off-by-one', 'boundary', 'edge cases'], difficulty: 3, context: 'quality control',
      prompt: text('A quality report is meant to count how many measurements are **strictly greater than** a limit. Its numbers look slightly off. Find the bug(s) and fix them without rewriting it from scratch.'),
      expectedBehavior: 'count_over([5, 9, 12, 3], 8) returns 2. Values equal to the limit are not counted.',
      starterCode: 'def count_over(values, limit):\n    count = 0\n    for i in range(1, len(values)):\n        if values[i] >= limit:\n            count += 1\n    return count\n',
      hints: ['Make up a small list where you know the answer, and try it. Then try a list where the biggest value is FIRST.', 'Two separate things are wrong: one involves WHICH items are looked at, the other involves the comparison.', 'A `range` starting at 1 skips the first item. And the requirement is “strictly greater than”, which is not the same as `>=`.'],
      checks: calls('count_over', [[[[5, 9, 12, 3], 8], 2], [[[10, 1, 1], 5], 1], [[[8, 8, 8], 8], 0], [[[], 3], 0], [[[9], 8], 1], [[[1, 2, 3], 3], 0]], 2),
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Keep the function defined with def.' }],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-19-last-n', objectiveId: 'py-obj-debug-logic', title: 'The Last Few', mode: 'challenge', language: 'python', skillIds: ['py.debugging', 'py.functions', 'py.lists'], concepts: ['debugging', 'off-by-one', 'boundary', 'edge cases'], difficulty: 3, context: 'analytics',
      prompt: text('A dashboard shows the most recent readings. `last_n(items, n)` should return the last `n` items in their original order. If there are fewer than `n` items, it should return all of them, and `n = 0` should give an empty list. It does not always. Find the bug(s) and fix them.'),
      expectedBehavior: 'last_n([1, 2, 3, 4, 5], 2) returns [4, 5]. last_n([1, 2], 5) returns [1, 2]. last_n([1, 2], 0) returns [].',
      starterCode: 'def last_n(items, n):\n    result = []\n    for i in range(len(items) - n, len(items) - 1):\n        result.append(items[i])\n    return result\n',
      hints: ['Try it on `[1, 2, 3, 4, 5]` with `n = 2`. What is missing?', 'The loop stops one position too early. And a negative starting position behaves strangely: think about what happens when `n` is larger than the list.', 'The end of a `range` is exclusive, so it should be `len(items)`. Clamp the start so it is never below 0 (`max(0, ...)`).'],
      checks: calls('last_n', [[[[1, 2, 3, 4, 5], 2], [4, 5]], [[[1, 2], 5], [1, 2]], [[[1, 2], 0], []], [[[], 3], []], [[['a', 'b', 'c'], 3], ['a', 'b', 'c']], [[[9, 8, 7, 6], 1], [6]]], 2),
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Keep the function defined with def.' }],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-19-safe-int', objectiveId: 'py-obj-safe-convert', title: 'Safe Integer', mode: 'challenge', language: 'python', skillIds: ['py.defensive', 'py.functions', 'py.debugging'], concepts: ['try', 'except', 'ValueError', 'default value'], difficulty: 3, context: 'data entry',
      prompt: text('Forms often contain bad input. Write `safe_int(text, default=0)` that converts `text` to a whole number and returns it. If it cannot be converted (letters, a decimal like `"3.5"`, or `None`), return `default` instead of crashing.'),
      expectedBehavior: 'safe_int("42") returns 42. safe_int("abc") returns 0. safe_int("abc", -1) returns -1. safe_int(" 7 ") returns 7.',
      starterCode: '',
      hints: ['You want to TRY the conversion and only fall back if it fails.', 'A `try` block holds the risky line, and `except` names the error to catch. Think about which errors `int(...)` can raise for text and for `None`.', '`try: return int(text)` and `except (ValueError, TypeError): return default`.'],
      checks: calls('safe_int', [[['42'], 42], [['abc'], 0], [['abc', -1], -1], [[' 7 '], 7], [['3.5'], 0], [[null], 0], [['-12'], -12], [[''], 0]], 3),
      constraints: [{ type: 'requires', node: 'Try', message: 'Use try/except to handle the failure.' }],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-19-safe-ratio', objectiveId: 'py-obj-safe-convert', title: 'Safe Ratio', mode: 'challenge', language: 'python', skillIds: ['py.defensive', 'py.functions', 'py.debugging'], concepts: ['try', 'except', 'ValueError', 'default value'], difficulty: 3, context: 'engineering',
      prompt: text('A monitoring tool computes ratios such as defects per unit. Write `safe_ratio(a, b)` that returns `a / b`. If the division cannot be done (`b` is zero, or either value is missing, `None`), return `None` instead of crashing.'),
      expectedBehavior: 'safe_ratio(10, 4) returns 2.5. safe_ratio(1, 0) returns None. safe_ratio(None, 3) returns None.',
      starterCode: '',
      hints: ['Divide inside a `try`, and give a fallback when it fails.', 'Which two different errors can a division raise here? One is about zero, one is about wrong kinds of values.', '`except (ZeroDivisionError, TypeError): return None`'],
      checks: calls('safe_ratio', [[[10, 4], 2.5], [[1, 0], null], [[null, 3], null], [[0, 5], 0], [[7, null], null], [[-9, 3], -3]], 3, { approx: 1e-9 }),
      constraints: [{ type: 'requires', node: 'Try', message: 'Use try/except to handle the failure.' }],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-19-validate-reading', objectiveId: 'py-obj-raise', title: 'Validate a Reading', mode: 'challenge', language: 'python', skillIds: ['py.defensive', 'py.functions'], concepts: ['raise', 'ValueError', 'validation'], difficulty: 3, context: 'engineering',
      prompt: text('A sensor gateway must reject impossible readings. Write `validate_reading(value)` that returns `value` unchanged when it is between `0` and `1000` inclusive, and otherwise **raises a `ValueError`** with a helpful message.'),
      expectedBehavior: 'validate_reading(250) returns 250. validate_reading(-1) and validate_reading(1001) raise ValueError.',
      starterCode: '',
      hints: ['Decide which values are acceptable first, then what to do with the rest.', 'You do not `return` an error. You `raise` it, which stops the function immediately.', '`if value < 0 or value > 1000: raise ValueError("...")`, otherwise `return value`.'],
      checks: [
        { kind: 'script', name: 'Accepts a good reading', code: 'assert validate_reading(250) == 250, "A valid reading should be returned unchanged."\nassert validate_reading(0) == 0, "0 is a valid reading."\nassert validate_reading(1000) == 1000, "1000 is a valid reading."' },
        { kind: 'script', name: 'Rejects a negative reading', code: raisesFor('validate_reading(-1)', 'A negative reading should raise ValueError.') },
        { kind: 'script', name: 'Rejects a reading that is too high', visible: false, code: raisesFor('validate_reading(1001)', 'A reading above the maximum should raise ValueError.') },
        { kind: 'script', name: 'The error carries a message', visible: false, code: 'try:\n    validate_reading(-5)\nexcept ValueError as e:\n    assert len(str(e)) >= 5, "Give the error a helpful message, e.g. what range is allowed."\nelse:\n    raise AssertionError("A negative reading should raise ValueError.")' },
      ],
      constraints: [{ type: 'requires', node: 'Raise', message: 'Use raise to refuse bad input.' }],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-19-validate-quantity', objectiveId: 'py-obj-raise', title: 'Validate a Quantity', mode: 'challenge', language: 'python', skillIds: ['py.defensive', 'py.functions'], concepts: ['raise', 'ValueError', 'validation'], difficulty: 3, context: 'business',
      prompt: text('An order form must only accept sensible quantities. Write `validate_quantity(q)` that returns `q` when it is a **whole number (int) of at least 1**, and otherwise **raises a `ValueError`** with a helpful message. Decimals, zero, negatives and text are all invalid.'),
      expectedBehavior: 'validate_quantity(3) returns 3. validate_quantity(0), validate_quantity(2.5) and validate_quantity("3") raise ValueError.',
      starterCode: '',
      hints: ['There are two separate rules: what KIND of value it is, and how big it is.', 'Check the type before comparing sizes. `isinstance(q, int)` tests for whole numbers.', '`if not isinstance(q, int) or q < 1: raise ValueError("...")`, otherwise `return q`.'],
      checks: [
        { kind: 'script', name: 'Accepts good quantities', code: 'assert validate_quantity(3) == 3, "A whole number of 1 or more should be returned unchanged."\nassert validate_quantity(1) == 1, "1 is valid."' },
        { kind: 'script', name: 'Rejects zero', code: raisesFor('validate_quantity(0)', 'Zero should raise ValueError.') },
        { kind: 'script', name: 'Rejects a decimal', visible: false, code: raisesFor('validate_quantity(2.5)', 'A decimal quantity should raise ValueError.') },
        { kind: 'script', name: 'Rejects text', visible: false, code: raisesFor('validate_quantity("3")', 'Text should raise ValueError, even if it looks like a number.') },
        { kind: 'script', name: 'Rejects a negative', visible: false, code: raisesFor('validate_quantity(-4)', 'A negative quantity should raise ValueError.') },
      ],
      constraints: [{ type: 'requires', node: 'Raise', message: 'Use raise to refuse bad input.' }],
      xpReward: 65, coinReward: 10,
    },
  ],
};
