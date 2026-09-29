import { calls, text } from '../helpers';
import type { LessonBundle } from '../schema';

/** Records which functions were called, to prove a design is really decomposed (not one big function). */
const usesHelpers = (setup: string, helpers: string[], entry: string, message: string) => ({
  kind: 'script' as const, name: 'The top-level function is built from the smaller ones', visible: false,
  code: `_seen = []\n${helpers.map((h) => `_orig_${h} = ${h}\ndef ${h}(*a, **k):\n    _seen.append("${h}")\n    return _orig_${h}(*a, **k)`).join('\n')}\n${setup}\n${entry}\nassert set(_seen) == set(${JSON.stringify(helpers)}), ${JSON.stringify(message)}`,
});

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-18-function-design', title: 'Designing Good Functions', language: 'python', skillId: 'sd.functions',
    blurb: 'Default arguments, scope, returning several values, and breaking a problem into small functions.', prerequisites: ['py-17-records'], xpReward: 45,
    reference: {
      title: 'Designing functions',
      body: text(
        '**Default arguments**: `def add_tax(price, rate=0.2)` lets callers omit `rate`. **Multiple returns**: `return low, high` sends back a tuple; callers unpack it: `lo, hi = f(x)`.',
        '**Scope**: names created inside a function are local; they vanish when it returns, and the caller cannot see them. A function should get what it needs through parameters and give results back with `return`, not by secretly reading or changing global variables.',
        '**Decomposition**: split a big job into small functions that each do ONE thing and have a clear name. Small functions are easier to test, reuse and debug. Keep calculating (return values) separate from showing (print) and reading (input).',
      ),
      example: 'def gross(hours, rate):\n    return hours * rate\n\ndef net(hours, rate):\n    return gross(hours, rate) * 0.8',
    },
    steps: [
      {
        kind: 'teach', title: 'From “it works” to “it is well made”',
        body: text(
          'You can already write functions. Now the goal changes: write functions other people (and future you) can **trust and reuse**. Three ideas matter most: functions should be **small** and do one thing, they should communicate through **parameters and return values** rather than hidden shared state, and they should make **common cases easy** with sensible defaults.',
        ),
      },
      {
        kind: 'demo', title: 'Defaults and keyword arguments',
        body: text('Run it and notice how each call supplies (or skips) the optional part.'),
        code: 'def shipping(weight, express=False, rate=2.0):\n    cost = weight * rate\n    if express:\n        cost = cost * 1.5\n    return cost\n\nprint(shipping(10))\nprint(shipping(10, True))\nprint(shipping(10, rate=3.0))\nprint(shipping(10, express=True, rate=3.0))',
        notice: 'Arguments you leave out take their default. You can also name them (`rate=3.0`), which makes calls readable and lets you skip the ones in between.',
      },
      {
        kind: 'demo', title: 'A name that is not yours', expectsError: true,
        body: text('The function below tries to update a variable defined outside it. Predict what Python will do.'),
        code: 'total = 0\n\ndef add(x):\n    total = total + x\n    return total\n\nprint(add(5))',
        notice: 'An `UnboundLocalError`. Because the function assigns to `total`, Python treats it as a LOCAL name, and the local one has no value yet. The fix is not a global variable: pass values in and return results out.',
      },
      {
        kind: 'teach', title: 'Small functions that fit together',
        body: text(
          'Suppose you must compute a wage: pay for hours, then tax, then what is left. That is three ideas. Writing each as its own function means you can check each one on its own, and the final function just combines them. When something is wrong, you know exactly which small part to look at.',
        ),
      },
      { kind: 'challenge', challengeId: 'py-18-add-tax' },
      { kind: 'challenge', challengeId: 'py-18-price-stats' },
      { kind: 'challenge', challengeId: 'py-18-pay-slip' },
    ],
  },
  objectives: [
    { id: 'py-obj-multi-return', title: 'Return several values from a function', summary: 'Compute more than one result and return them together as a tuple, handling empty input.' },
    { id: 'py-obj-decompose', title: 'Break a problem into small functions', summary: 'Write helper functions that each do one job, then a main function built from them.' },
  ],
  challenges: [
    {
      id: 'py-18-add-tax', title: 'Add Sales Tax', mode: 'learning', language: 'python', skillIds: ['sd.functions', 'py.functions'], concepts: ['default argument', 'function'], difficulty: 2, context: 'finance',
      prompt: text('Write `add_tax(price, rate=0.2)` that returns the price with tax added: `price * (1 + rate)`. When the caller does not give a rate, use `0.2` (20%).'),
      expectedBehavior: 'add_tax(100) returns 120.0. add_tax(100, 0.1) returns 110.0.',
      guidedSteps: ['Give the `rate` parameter a default value in the `def` line.', 'Return `price * (1 + rate)`.'],
      starterCode: 'def add_tax(price, rate=0.2):\n    pass\n',
      hints: ['The default is written in the parameter list, like `rate=0.2`.', 'The formula multiplies the price by one plus the rate.', '`return price * (1 + rate)`'],
      checks: calls('add_tax', [[[100], 120], [[100, 0.1], 110], [[50, 0], 50], [[0], 0]], 2, { approx: 1e-9 }),
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the function with def.' }],
      xpReward: 45, coinReward: 6,
    },
    {
      id: 'py-18-price-stats', objectiveId: 'py-obj-multi-return', title: 'Price Statistics', mode: 'challenge', language: 'python', skillIds: ['sd.functions', 'py.functions', 'py.lists'], concepts: ['tuple', 'multiple return values', 'min', 'max', 'average'], difficulty: 3, context: 'retail',
      prompt: text('Write `price_stats(prices)` that returns **three values together**: the cheapest price, the priciest price, and the average price, as `(cheapest, priciest, average)`.', 'For an empty list return `(None, None, None)`.'),
      expectedBehavior: 'price_stats([4.0, 10.0, 7.0]) returns (4.0, 10.0, 7.0). price_stats([]) returns (None, None, None).',
      starterCode: '',
      hints: ['A function can return more than one value by separating them with commas.', 'Think about the empty list first: which of `min`, `max` and division would fail?', 'Handle `if not prices:` first, then `return min(prices), max(prices), sum(prices) / len(prices)`.'],
      checks: calls('price_stats', [[[[4.0, 10.0, 7.0]], [4.0, 10.0, 7.0]], [[[]], [null, null, null]], [[[5]], [5, 5, 5]], [[[1, 2, 3, 4]], [1, 4, 2.5]], [[[9.5, 0.5]], [0.5, 9.5, 5.0]]], 2, { approx: 1e-9 }),
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-18-run-stats', objectiveId: 'py-obj-multi-return', title: 'Run Time Statistics', mode: 'challenge', language: 'python', skillIds: ['sd.functions', 'py.functions', 'py.lists'], concepts: ['tuple', 'multiple return values', 'min', 'max', 'average'], difficulty: 3, context: 'manufacturing',
      prompt: text('Write `run_stats(times)` for a list of machine run times in minutes. Return `(fastest, slowest, total)`: the smallest time, the largest time, and the sum of all times.', 'For an empty list return `(None, None, 0)`.'),
      expectedBehavior: 'run_stats([30, 45, 40]) returns (30, 45, 115). run_stats([]) returns (None, None, 0).',
      starterCode: '',
      hints: ['You need three results from one call.', 'Which of the three still makes sense for an empty list, and which do not?', 'Return early for the empty case; otherwise `return min(times), max(times), sum(times)`.'],
      checks: calls('run_stats', [[[[30, 45, 40]], [30, 45, 115]], [[[]], [null, null, 0]], [[[12]], [12, 12, 12]], [[[5.5, 2.5]], [2.5, 5.5, 8.0]], [[[7, 7, 7]], [7, 7, 21]]], 2, { approx: 1e-9 }),
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-18-pay-slip', objectiveId: 'py-obj-decompose', title: 'Pay Slip', mode: 'challenge', language: 'python', skillIds: ['sd.functions', 'ps.decomposition', 'py.functions', 'py.conditionals'], concepts: ['decomposition', 'helper functions', 'return', 'if'], difficulty: 3, context: 'payroll',
      prompt: text(
        'A payroll system must work out take-home pay. Build it from **three small functions**:',
        '`gross_pay(hours, rate)`: pay before tax. The first 40 hours are paid at `rate`; hours beyond 40 are paid at 1.5 times `rate`.\n`tax(gross)`: 10% of the first 1000, plus 20% of any amount above 1000.\n`net_pay(hours, rate)`: gross pay minus tax. It must be built by **calling the other two functions**.',
      ),
      expectedBehavior: 'gross_pay(45, 10) is 475.0. tax(1200) is 140.0. net_pay(45, 10) is 427.5.',
      starterCode: '',
      hints: ['Each function has one job. Start with the one that needs no other.', 'For `gross_pay`, split the hours: how many are regular, and how many are overtime?', '`tax` has two bands. `net_pay` should be one line that calls `gross_pay` and `tax`.'],
      checks: [
        ...calls('gross_pay', [[[45, 10], 475], [[30, 12], 360], [[40, 10], 400], [[50, 20], 1100]], 2, { approx: 1e-9 }),
        ...calls('tax', [[[1200], 140], [[500], 50], [[1000], 100], [[0], 0], [[2000], 300]], 2, { approx: 1e-9 }),
        ...calls('net_pay', [[[45, 10], 427.5], [[40, 25], 900], [[50, 30], 1420]], 1, { approx: 1e-9 }),
        usesHelpers('', ['gross_pay', 'tax'], 'net_pay(45, 10)', 'net_pay should be built by calling gross_pay and tax rather than repeating their logic.'),
      ],
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the functions with def.' }],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'py-18-shipping-quote', objectiveId: 'py-obj-decompose', title: 'Delivery Quote', mode: 'challenge', language: 'python', skillIds: ['sd.functions', 'ps.decomposition', 'py.functions', 'py.conditionals'], concepts: ['decomposition', 'helper functions', 'return', 'if'], difficulty: 3, context: 'logistics',
      prompt: text(
        'A courier quotes delivery prices from **three small functions**:',
        '`base_cost(weight)`: `4` for parcels up to 5 kg, otherwise `4` plus `1.2` for every kg above 5.\n`distance_surcharge(km)`: `0` up to 50 km, then `0.1` per km beyond 50.\n`quote(weight, km)`: the sum of the other two. It must be built by **calling them**.',
      ),
      expectedBehavior: 'base_cost(10) is 10.0. distance_surcharge(80) is 3.0. quote(10, 80) is 13.0.',
      starterCode: '',
      hints: ['Write and think about each small function alone first.', 'Both have a threshold and a rate applied only to the part ABOVE the threshold.', '`quote` should be a single line that adds the results of the other two functions.'],
      checks: [
        ...calls('base_cost', [[[10], 10], [[3], 4], [[5], 4], [[6], 5.2]], 2, { approx: 1e-9 }),
        ...calls('distance_surcharge', [[[80], 3], [[20], 0], [[50], 0], [[51], 0.1]], 2, { approx: 1e-9 }),
        ...calls('quote', [[[10, 80], 13], [[3, 20], 4], [[6, 100], 10.2]], 1, { approx: 1e-9 }),
        usesHelpers('', ['base_cost', 'distance_surcharge'], 'quote(10, 80)', 'quote should be built by calling base_cost and distance_surcharge.'),
      ],
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the functions with def.' }],
      xpReward: 80, coinReward: 12,
    },
  ],
};
