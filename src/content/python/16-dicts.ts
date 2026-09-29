import { calls, text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-16-dicts', title: 'Lookups, Tallies and Sets', language: 'python', skillId: 'py.dicts',
    blurb: 'Dictionaries, tuples and sets: labelled data, counting, and unique values.', prerequisites: ['py-15-lists'], xpReward: 45,
    reference: {
      title: 'Dictionaries, tuples, sets',
      body: text(
        'A **dict** maps keys to values: `stock = {"bolt": 40}`. `stock["bolt"]` reads (KeyError if missing); `stock.get("nut", 0)` reads with a default; `stock["nut"] = 12` adds or replaces; `"bolt" in stock` tests a key; `for k, v in stock.items():` visits pairs.',
        'A **tuple** is a fixed group: `point = (3, 4)`; unpack with `x, y = point`. A **set** keeps unique values: `set([1, 1, 2])` is `{1, 2}`; `a & b` (both), `a | b` (either), `a - b` (in a but not b). Sets have no order; use `sorted(...)` to list them.',
        'Tally pattern: `counts[x] = counts.get(x, 0) + 1`. Grouping pattern: `groups.setdefault(key, []).append(value)`.',
      ),
      example: 'counts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1',
    },
    steps: [
      {
        kind: 'teach', title: 'Looking things up by name',
        body: text(
          'A list finds things by **position**. But you often want to find things by **name**: the stock of “bolt”, the score of player “Ada”. A **dictionary** stores pairs: a **key** you look up, and the **value** you get back. It is one of the most useful tools in all of programming, and databases, JSON files and APIs are built on the same idea.',
          'Reading a missing key raises `KeyError`. `.get(key, default)` is the safe way when a key might be absent.',
        ),
      },
      {
        kind: 'demo', title: 'Build, read, update',
        body: text('Run it, then change the data and predict what happens.'),
        code: 'stock = {"bolt": 40, "nut": 12}\nprint(stock["bolt"])\nprint(stock.get("washer", 0))\nstock["nut"] = stock["nut"] + 8\nstock["washer"] = 100\nprint(stock)\nfor item, qty in stock.items():\n    print(item, "->", qty)\nprint("gear" in stock)',
        notice: '`.get("washer", 0)` gave 0 instead of crashing. Assigning to a new key created it; assigning to an existing key replaced its value. `in` tests the KEYS.',
      },
      {
        kind: 'demo', title: 'A missing key', expectsError: true,
        body: text('What happens when the key does not exist?'),
        code: 'stock = {"bolt": 40}\nprint(stock["nut"])',
        notice: 'A `KeyError`, and the message shows the missing key in quotes. Whenever data might be incomplete, use `.get` or test with `in` first.',
      },
      {
        kind: 'teach', title: 'Tuples and sets',
        body: text(
          'A **tuple** is a small fixed group of values, like `("M-4", 92.5)`, often used to return several values from a function or to hold a pair. A **set** stores each value only once and answers “is this in here?” very quickly. Sets also do the maths of “in both”, “in either”, “in this but not that”.',
        ),
      },
      {
        kind: 'demo', title: 'Sets remove duplicates',
        body: text('Two lists of machine names. Which machines are on both?'),
        code: 'failed = ["press", "lathe", "press", "welder"]\nservice = ["lathe", "welder", "sorter"]\nprint(set(failed))\nprint(sorted(set(failed) & set(service)))\nprint(sorted(set(service) - set(failed)))',
        notice: 'The duplicate "press" vanished when converted to a set. `&` kept items in both. `-` kept items only in the first. `sorted` turned each set into an ordered list.',
      },
      { kind: 'challenge', challengeId: 'py-16-stock-lookup' },
      { kind: 'challenge', challengeId: 'py-16-defect-tally' },
      { kind: 'challenge', challengeId: 'py-16-both-lists' },
      { kind: 'challenge', challengeId: 'py-16-group-readings' },
    ],
  },
  objectives: [
    { id: 'py-obj-tally', title: 'Tally: count how often each value occurs', summary: 'Build a dictionary of counts from a list.' },
    { id: 'py-obj-sets', title: 'Combine collections with sets', summary: 'Use sets to find what two collections share, or what one is missing.' },
    { id: 'py-obj-group', title: 'Group values under a key', summary: 'Build a dictionary whose values are lists, grouping records by a key.' },
  ],
  challenges: [
    {
      id: 'py-16-stock-lookup', title: 'Stock Lookup', mode: 'learning', language: 'python', skillIds: ['py.dicts', 'py.functions'], concepts: ['dict', 'get', 'default value'], difficulty: 2, context: 'business',
      prompt: text('A stockroom keeps its counts in a dictionary such as `{"bolt": 40, "nut": 12}`. Write `stock_of(inventory, item)` that returns how many of `item` are in stock, or `0` if the item is not in the dictionary at all.'),
      expectedBehavior: 'stock_of({"bolt": 40}, "bolt") returns 40. stock_of({"bolt": 40}, "nut") returns 0.',
      guidedSteps: ['Look at how `.get(key, default)` behaves in the demo.', 'Use the item as the key and 0 as the default.', 'Return the result.'],
      starterCode: 'def stock_of(inventory, item):\n    pass\n',
      hints: ['What does the dictionary do if you ask for a key it does not have?', 'One dictionary method lets you supply the answer to use when the key is missing.', '`return inventory.get(item, 0)`'],
      checks: calls('stock_of', [[[{ bolt: 40, nut: 12 }, 'bolt'], 40], [[{ bolt: 40 }, 'nut'], 0], [[{}, 'x'], 0], [[{ a: 0 }, 'a'], 0], [[{ Bolt: 5 }, 'Bolt'], 5], [[{ Bolt: 5 }, 'bolt'], 0]], 2),
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the function with def.' }],
      xpReward: 45, coinReward: 6,
    },
    {
      id: 'py-16-defect-tally', objectiveId: 'py-obj-tally', title: 'Defect Tally', mode: 'challenge', language: 'python', skillIds: ['py.dicts', 'py.loops', 'py.functions'], concepts: ['dict', 'counting', 'loop'], difficulty: 2, context: 'manufacturing',
      prompt: text('Inspectors record each defect found as a word such as `"crack"` or `"dent"`. Write `tally(defects)` that returns a dictionary mapping each distinct defect to how many times it appears.'),
      expectedBehavior: 'tally(["crack", "dent", "crack"]) returns {"crack": 2, "dent": 1}. tally([]) returns {}.',
      starterCode: '',
      hints: ['You need a dictionary that grows as you meet new defect types.', 'For each defect: if you have seen it, add one to its count; if not, it starts at one. `.get(key, 0)` handles both.', '`counts[d] = counts.get(d, 0) + 1` inside a loop, then return `counts`.'],
      checks: calls('tally', [[[['crack', 'dent', 'crack']], { crack: 2, dent: 1 }], [[[]], {}], [[['a', 'a', 'a']], { a: 3 }], [[['x', 'y', 'z', 'x', 'y', 'x']], { x: 3, y: 2, z: 1 }], [[['Crack', 'crack']], { Crack: 1, crack: 1 }]], 2),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'py-16-event-log', objectiveId: 'py-obj-tally', title: 'Event Log', mode: 'challenge', language: 'python', skillIds: ['py.dicts', 'py.loops', 'py.functions'], concepts: ['dict', 'counting', 'loop'], difficulty: 2, context: 'games',
      prompt: text('A game logs events such as `"Jump"`, `"jump"` and `"Attack"`. Write `count_events(events)` that returns a dictionary of counts. Event names are **not case sensitive**: `"Jump"` and `"jump"` count together, and the keys in your result are lower case.'),
      expectedBehavior: 'count_events(["Jump", "jump", "Attack"]) returns {"jump": 2, "attack": 1}.',
      starterCode: '',
      hints: ['First decide what the KEY should be for each event, so that “Jump” and “jump” end up the same.', 'Convert each event name before using it as a key.', 'Use `.lower()` on the event, then the usual counting pattern with `.get(key, 0) + 1`.'],
      checks: calls('count_events', [[[['Jump', 'jump', 'Attack']], { jump: 2, attack: 1 }], [[[]], {}], [[['A', 'a', 'A', 'b']], { a: 3, b: 1 }], [[['Run']], { run: 1 }], [[['JUMP', 'Jump', 'jump', 'JuMp']], { jump: 4 }]], 2),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'py-16-both-lists', objectiveId: 'py-obj-sets', title: 'On Both Lists', mode: 'challenge', language: 'python', skillIds: ['py.dicts', 'py.functions'], concepts: ['set', 'intersection', 'sorted'], difficulty: 3, context: 'manufacturing',
      prompt: text('One list holds machines that failed inspection this month; another holds machines due for service. Either list may repeat a machine. Write `on_both_lists(failed, due)` that returns a **sorted list** of the machine names that appear on BOTH lists, each name once.'),
      expectedBehavior: 'on_both_lists(["press", "lathe", "press"], ["lathe", "sorter", "press"]) returns ["lathe", "press"].',
      starterCode: '',
      hints: ['Duplicates and “in both” are exactly what a set is good at.', 'Convert each list to a set, then combine the sets so that only shared items remain.', '`sorted(set(failed) & set(due))`. The `&` operator keeps items found in both sets.'],
      checks: calls('on_both_lists', [[[['press', 'lathe', 'press'], ['lathe', 'sorter', 'press']], ['lathe', 'press']], [[['a'], ['b']], []], [[[], ['x']], []], [[['z', 'y', 'x'], ['x', 'y', 'z', 'z']], ['x', 'y', 'z']], [[['M1', 'M1'], ['M1']], ['M1']]], 2),
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-16-missing-parts', objectiveId: 'py-obj-sets', title: 'Missing Parts', mode: 'challenge', language: 'python', skillIds: ['py.dicts', 'py.functions'], concepts: ['set', 'intersection', 'sorted'], difficulty: 3, context: 'logistics',
      prompt: text('A repair kit needs certain parts. Write `missing_parts(required, in_stock)` that returns a **sorted list** of the required parts that are NOT in stock, each once. Both lists may contain repeats.'),
      expectedBehavior: 'missing_parts(["bolt", "gear", "bolt"], ["bolt"]) returns ["gear"].',
      starterCode: '',
      hints: ['You want what is in the first collection but not the second.', 'Sets have an operation for “in this one but not that one”.', '`sorted(set(required) - set(in_stock))`'],
      checks: calls('missing_parts', [[[['bolt', 'gear', 'bolt'], ['bolt']], ['gear']], [[['a', 'b'], ['a', 'b', 'c']], []], [[['x'], []], ['x']], [[[], ['x']], []], [[['c', 'a', 'b', 'a'], ['b']], ['a', 'c']]], 2),
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-16-group-readings', objectiveId: 'py-obj-group', title: 'Group the Readings', mode: 'challenge', language: 'python', skillIds: ['py.dicts', 'py.lists', 'py.functions'], concepts: ['dict', 'grouping', 'tuple', 'nested data'], difficulty: 3, context: 'engineering',
      prompt: text('A monitoring system produces readings as `(machine, value)` tuples, all mixed together, such as `[("M1", 5.0), ("M2", 7.5), ("M1", 6.0)]`. Write `group_by_machine(readings)` that returns a dictionary mapping each machine to the **list of its values**, in the order they appeared.'),
      expectedBehavior: 'group_by_machine([("M1", 5.0), ("M2", 7.5), ("M1", 6.0)]) returns {"M1": [5.0, 6.0], "M2": [7.5]}.',
      starterCode: '',
      hints: ['Each machine needs its own list, created the first time you see the machine.', 'A tuple can be unpacked in the for line: `for machine, value in readings:`.', 'If the machine is not in the dictionary yet, start it with `[]`, then append. (`setdefault` does that in one step.)'],
      checks: calls('group_by_machine', [[[[['M1', 5.0], ['M2', 7.5], ['M1', 6.0]]], { M1: [5.0, 6.0], M2: [7.5] }], [[[]], {}], [[[['A', 1]]], { A: [1] }], [[[['B', 2], ['A', 1], ['B', 3], ['B', 4]]], { B: [2, 3, 4], A: [1] }]], 2),
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-16-group-orders', objectiveId: 'py-obj-group', title: 'Orders by Customer', mode: 'challenge', language: 'python', skillIds: ['py.dicts', 'py.lists', 'py.functions'], concepts: ['dict', 'grouping', 'tuple', 'nested data'], difficulty: 3, context: 'business',
      prompt: text('A shop exports orders as dictionaries: `{"customer": "Ada", "amount": 12.5}`. Write `orders_by_customer(orders)` that returns a dictionary mapping each customer’s name to the **list of their order amounts**, in the order they appear.'),
      expectedBehavior: 'orders_by_customer([{"customer": "Ada", "amount": 12.5}, {"customer": "Bo", "amount": 3}, {"customer": "Ada", "amount": 7}]) returns {"Ada": [12.5, 7], "Bo": [3]}.',
      starterCode: '',
      hints: ['Each customer needs a list of their own amounts.', 'Each order is a dictionary; read its two fields by key.', 'Create the customer’s list the first time, then append the amount.'],
      checks: calls('orders_by_customer', [[[[{ customer: 'Ada', amount: 12.5 }, { customer: 'Bo', amount: 3 }, { customer: 'Ada', amount: 7 }]], { Ada: [12.5, 7], Bo: [3] }], [[[]], {}], [[[{ customer: 'Cy', amount: 1 }]], { Cy: [1] }], [[[{ customer: 'Z', amount: 1 }, { customer: 'Z', amount: 2 }, { customer: 'Y', amount: 3 }]], { Z: [1, 2], Y: [3] }]], 2),
      xpReward: 65, coinReward: 10,
    },
  ],
};
