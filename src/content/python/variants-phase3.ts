import { text } from '../helpers';
import type { Challenge, Check } from '../schema';

/**
 * Phase 3 variants: extra authored problems for objectives that had only one, so a retry is a genuinely different
 * problem (new context, data, framing, boundaries) and not the same one again. They live in the same lesson bundle
 * as the objective they vary (index.ts appends them), keep the objective's mode, difficulty, skills and concepts, and
 * have their own hidden checks. Reference solutions and wrong attempts are in solutions.phase3.testdata.ts.
 */
const out = (name: string, expect: string, stdin?: string[], files?: Record<string, string>, visible = true): Check => ({ kind: 'output', name, expect, stdin, files, visible });
const file = (name: string, path: string, expect: string, opts: { files?: Record<string, string>; visible?: boolean } = {}): Check => ({ kind: 'file', name, path, expect, json: true, files: opts.files, visible: opts.visible ?? true });

export const phase3Variants: Record<string, Challenge[]> = {
  'py-01-first-program': [
    {
      id: 'py-01-shipping-label', objectiveId: 'py-01-three-lines', title: 'The Shipping Label', mode: 'challenge', language: 'python', skillIds: ['py.output'], concepts: ['print', 'order of execution'], difficulty: 1, context: 'logistics',
      prompt: text('Bytehaven Works is shipping a crate. Its label printer takes a program that prints three lines, in this order:', '`FROM: Bytehaven Works`\n`TO: Northwind Depot`\n`FRAGILE`'),
      expectedBehavior: 'Three lines of output, in the order given.', starterCode: '',
      hints: ['Every line of the label needs its own instruction.', 'Lines appear in the order the instructions are written.', 'Three `print("...")` instructions, one per line, matching the text exactly.'],
      checks: [{ kind: 'output', name: 'Three lines in order', expect: 'FROM: Bytehaven Works\nTO: Northwind Depot\nFRAGILE', feedback: 'Compare each line with the label, character by character, including the capitals and the colons.' }],
      xpReward: 40, coinReward: 6,
    },
  ],
  'py-05-numbers': [
    {
      id: 'py-05-machine-value', objectiveId: 'py-05-savings', title: 'Four Years of Wear', mode: 'challenge', language: 'python', skillIds: ['py.numbers', 'py.variables'], concepts: ['exponent', 'order of operations', 'float'], difficulty: 3, context: 'engineering',
      prompt: text('A machine is worth `12000` coins when new and loses 10% of its current value every year (each year’s loss is taken from what it is worth at that point).', 'Calculate its value after 4 years and store it in `remaining`. Then print it.'),
      expectedBehavior: '`remaining` is about 7873.2 and is printed.', starterCode: 'start = 12000\nrate = 0.10\nyears = 4\n',
      hints: ['Each year the value is multiplied by the same factor.', 'Losing 10% means keeping 90%: the factor is 1 minus the rate. Four years means applying it four times.', 'Repeated multiplication by one number is what the power operator does.'],
      checks: [{ kind: 'variable', name: 'remaining is about right', variable: 'remaining', expect: 7873.2, approx: 0.01, feedback: 'A yearly loss shrinks the value by the same fraction every year.' }],
      xpReward: 60, coinReward: 10,
    },
    {
      id: 'py-05-culture-growth', objectiveId: 'py-05-savings', title: 'Six Months of Growth', mode: 'challenge', language: 'python', skillIds: ['py.numbers', 'py.variables'], concepts: ['exponent', 'order of operations', 'float'], difficulty: 3, context: 'science',
      prompt: text('A bacteria culture starts at `500` cells and grows by 12% every month, on top of the cells already there.', 'Calculate the number of cells after 6 months and store it in `cells`. Then print it.'),
      expectedBehavior: '`cells` is about 986.91 and is printed.', starterCode: 'start = 500\nrate = 0.12\nmonths = 6\n',
      hints: ['The population is multiplied by the same factor each month.', 'Growing by 12% means multiplying by 1 plus the rate. Six months means six times.', 'A repeated multiplication is exactly what the power operator does.'],
      checks: [{ kind: 'variable', name: 'cells is about right', variable: 'cells', expect: 986.91, approx: 0.01, feedback: 'Growth compounds: the factor is applied once for every month.' }],
      xpReward: 60, coinReward: 10,
    },
  ],
  'py-07-logic': [
    {
      id: 'py-07-forklift', objectiveId: 'py-07-pitcher', title: 'Can She Drive the Forklift?', mode: 'challenge', language: 'python', skillIds: ['py.logic', 'py.input'], concepts: ['and', 'or', 'comparison', 'string comparison'], difficulty: 3, context: 'manufacturing',
      prompt: text('The warehouse rule: an operator may drive the forklift if she had fewer than `3` safety incidents last year AND holds certification level at least `2`, OR the supervisor says `approve`.', 'Read three lines: incidents (a whole number), certification level (a whole number), and the supervisor’s word (any text; `approve` means yes). Print `True` if she may drive, else `False`.'),
      expectedBehavior: 'Reads three lines and prints True or False following the rule.', sampleInput: ['1', '2', 'no'], starterCode: '',
      hints: ['Three pieces of information arrive in order. Read them into three variables and convert the numbers.', 'The rule has two parts joined by OR; the first part is itself two conditions joined by AND.', 'Parentheses group the AND part. Text is compared with `==`.'],
      checks: [
        out('Safe and certified', 'True', ['1', '2', 'no']),
        out('Too many incidents', 'False', ['5', '3', 'no'], undefined, false),
        out('Not certified enough', 'False', ['0', '1', 'no'], undefined, false),
        out('Supervisor approval', 'True', ['9', '0', 'approve'], undefined, false),
        out('Boundary: 3 incidents', 'False', ['3', '2', 'no'], undefined, false),
        out('Boundary: level 2', 'True', ['2', '2', 'no'], undefined, false),
        out('Approval is case-sensitive', 'False', ['9', '0', 'Approve'], undefined, false),
      ],
      xpReward: 60, coinReward: 10,
    },
    {
      id: 'py-07-loan-check', objectiveId: 'py-07-pitcher', title: 'Should the Loan Be Approved?', mode: 'challenge', language: 'python', skillIds: ['py.logic', 'py.input'], concepts: ['and', 'or', 'comparison', 'string comparison'], difficulty: 3, context: 'finance',
      prompt: text('A small bank approves a loan when the applicant’s credit score is at least `650` AND their yearly income is above `30000`, OR a guarantor is named on the form (the guarantor line says `yes`).', 'Read three lines: credit score (a whole number), yearly income (a whole number), and the guarantor answer (any text; `yes` means a guarantor is named). Print `True` if the loan is approved, else `False`.'),
      expectedBehavior: 'Reads three lines and prints True or False following the rule.', sampleInput: ['700', '45000', 'no'], starterCode: '',
      hints: ['Read the three lines in order and convert the numbers.', 'The score and income conditions go together; the guarantor is an alternative to both of them.', 'Group the two number tests with parentheses, then use `or` for the guarantor. Watch `at least` versus `above`.'],
      checks: [
        out('Good score and income', 'True', ['700', '45000', 'no']),
        out('Low score', 'False', ['600', '80000', 'no'], undefined, false),
        out('Low income', 'False', ['720', '20000', 'no'], undefined, false),
        out('Guarantor named', 'True', ['400', '0', 'yes'], undefined, false),
        out('Boundary: score 650', 'True', ['650', '30001', 'no'], undefined, false),
        out('Boundary: income 30000', 'False', ['800', '30000', 'no'], undefined, false),
      ],
      xpReward: 60, coinReward: 10,
    },
  ],
  'py-10-while': [
    {
      id: 'py-10-pin-lock', objectiveId: 'py-10-password', title: 'The Keypad Lock', mode: 'challenge', language: 'python', skillIds: ['py.loops', 'py.input', 'py.conditionals'], concepts: ['while', 'input', 'counter', 'string comparison'], difficulty: 3, context: 'security',
      prompt: text('A keypad lock accepts the code `4821`. It keeps reading entries until one equals the code. Then print `Unlocked after N tries`, where N counts every entry read, including the correct one.', 'Example: entries `1111`, `4821` -> `Unlocked after 2 tries`.'),
      expectedBehavior: 'Reads entries until `4821`, then prints how many it took.', sampleInput: ['1111', '4821'], starterCode: '',
      hints: ['You do not know how many entries there will be, which suits a `while` loop.', 'Read an entry, count it, and compare. The loop’s condition should ask: is it still wrong?', 'Read one entry before the loop, then read the next at the end of each pass, counting as you go.'],
      checks: [
        out('Second try', 'Unlocked after 2 tries', ['1111', '4821']),
        out('First try', 'Unlocked after 1 tries', ['4821'], undefined, false),
        out('Six tries', 'Unlocked after 6 tries', ['0', '1', '2', '3', '4', '4821'], undefined, false),
        out('Near misses do not count', 'Unlocked after 3 tries', ['4812', '48211', '4821'], undefined, false),
      ],
      constraints: [{ type: 'requires', node: 'While', message: 'Use a while loop.' }],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-10-handshake', objectiveId: 'py-10-password', title: 'The Machine Handshake', mode: 'challenge', language: 'python', skillIds: ['py.loops', 'py.input', 'py.conditionals'], concepts: ['while', 'input', 'counter', 'string comparison'], difficulty: 3, context: 'engineering',
      prompt: text('A machine controller listens to messages from a sensor, one per line, until it receives the message `READY`. Then it prints `Handshake after N messages`, where N counts every message read, including `READY`.', 'Example: messages `noise`, `READY` -> `Handshake after 2 messages`.'),
      expectedBehavior: 'Reads messages until `READY`, then prints how many arrived.', sampleInput: ['noise', 'READY'], starterCode: '',
      hints: ['The number of messages is not known in advance, which suits a `while` loop.', 'Read a message, count it, and compare it with the signal word.', 'Read one message before the loop, then read the next at the end of each pass.'],
      checks: [
        out('Second message', 'Handshake after 2 messages', ['noise', 'READY']),
        out('Immediate', 'Handshake after 1 messages', ['READY'], undefined, false),
        out('Capitals matter', 'Handshake after 3 messages', ['ready', 'Ready', 'READY'], undefined, false),
        out('Long wait', 'Handshake after 7 messages', ['a', 'b', 'c', 'd', 'e', 'f', 'READY'], undefined, false),
      ],
      constraints: [{ type: 'requires', node: 'While', message: 'Use a while loop.' }],
      xpReward: 65, coinReward: 10,
    },
  ],
  'py-13-wake-robot': [
    {
      id: 'py-13-traffic-zones', objectiveId: 'py-13-control-program', title: 'The Speed Zone Monitor', mode: 'challenge', language: 'python', skillIds: ['py.functions', 'py.conditionals', 'py.loops', 'py.input'], concepts: ['def', 'return', 'if/elif/else', 'for', 'input', 'decomposition'], difficulty: 4, context: 'transport',
      prompt: text(
        'A depot’s vehicle monitor must classify speeds.',
        '**Part 1.** Write a function `zone(speed)` that returns the text `STOP` if the speed is below 5, `SLOW` if it is below 30, and `GO` otherwise.',
        '**Part 2.** Read **three** speeds (one whole number per line) and print each speed’s zone on its own line, using your function.',
        'Example: speeds `3`, `12`, `60` print `STOP`, `SLOW`, `GO`.',
      ),
      expectedBehavior: 'zone(4) -> STOP, zone(5) -> SLOW, zone(30) -> GO. The program prints three lines for three speeds.', sampleInput: ['3', '12', '60'], starterCode: '',
      hints: [
        'Get `zone` right on its own first: call it with a few values and print the results.',
        'Inside `zone`, test the lowest band first, then the next, then everything else.',
        'For the second part, a loop that runs three times can read a line, convert it, call `zone`, and print the result.',
      ],
      checks: [
        { kind: 'call', name: 'zone(4)', fn: 'zone', args: [4], stdin: ['50', '50', '50'], expect: 'STOP' },
        { kind: 'call', name: 'zone(5)', fn: 'zone', args: [5], stdin: ['50', '50', '50'], expect: 'SLOW', visible: false, feedback: 'Is 5 below 5?' },
        { kind: 'call', name: 'zone(29)', fn: 'zone', args: [29], stdin: ['50', '50', '50'], expect: 'SLOW', visible: false },
        { kind: 'call', name: 'zone(30)', fn: 'zone', args: [30], stdin: ['50', '50', '50'], expect: 'GO', visible: false, feedback: 'Is 30 below 30?' },
        { kind: 'call', name: 'zone(0)', fn: 'zone', args: [0], stdin: ['50', '50', '50'], expect: 'STOP', visible: false },
        { kind: 'output', name: 'Three speeds', stdin: ['3', '12', '60'], expect: 'STOP\nSLOW\nGO' },
        { kind: 'output', name: 'Another set', stdin: ['30', '5', '4'], expect: 'GO\nSLOW\nSTOP', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define zone as a function with def.' }],
      xpReward: 100, coinReward: 20,
    },
  ],
  'py-25-projects': [
    {
      id: 'py-25-agent-report', objectiveId: 'py-25-line-report', title: 'Support Agent Report', mode: 'challenge', language: 'python', skillIds: ['ps.decomposition', 'de.files', 'py.records', 'py.dicts', 'de.cleaning'], concepts: ['csv', 'grouping', 'sorting', 'formatting', 'edge cases'], difficulty: 4, context: 'customer support', project: true,
      prompt: text(
        '`tickets.csv` (header `agent,handled,escalated,shift`) lists shift summaries; an agent appears in many rows. Produce a report on the screen:',
        'One line per agent: `<agent>: <handled> handled, <escalated> escalated (<rate>%)`, where `handled` and `escalated` are **totals over all of that agent’s rows** and `rate` is `escalated ÷ handled × 100` to **one decimal** (an agent with 0 handled has rate 0.0). Order the lines by rate, **lowest first**; agents with the same rate go in name order, A to Z.',
        'A row with an **empty** `escalated` value counts as 0. After the agent lines, print a final line `Team: <rate>%` for all agents combined, to one decimal (`0.0` if there is no data).',
      ),
      expectedBehavior: 'For the example file: Ana (0.0%), Cy (5.0%), Bo (10.0%), then Team: 6.0%.',
      fixtures: { files: { 'tickets.csv': 'agent,handled,escalated,shift\nBo,50,5,1\nAna,40,,1\nCy,20,1,2\nBo,30,3,2\nAna,10,0,2\n' } }, starterCode: '',
      hints: ['Split it into stages: read the file, total per agent, calculate rates, sort, print.', 'A dictionary of per-agent totals is the heart of it. Remember the empty-value rule when you read a row.', 'Sorting on two things at once: a key that returns a tuple, such as `(rate, name)`. Guard the division by zero.'],
      checks: [
        out('The example file', 'Ana: 50 handled, 0 escalated (0.0%)\nCy: 20 handled, 1 escalated (5.0%)\nBo: 80 handled, 8 escalated (10.0%)\nTeam: 6.0%'),
        out('Quoted names, ties, and zero handled', 'Kim, Jo: 0 handled, 0 escalated (0.0%)\nAl: 10 handled, 1 escalated (10.0%)\nMo: 10 handled, 1 escalated (10.0%)\nTeam: 10.0%', undefined, { 'tickets.csv': 'agent,handled,escalated,shift\nMo,10,1,1\n"Kim, Jo",0,0,1\nAl,10,1,2\n' }, false),
        out('No data at all', 'Team: 0.0%', undefined, { 'tickets.csv': 'agent,handled,escalated,shift\n' }, false),
        out('One agent, missing values', 'Zed: 30 handled, 0 escalated (0.0%)\nTeam: 0.0%', undefined, { 'tickets.csv': 'agent,handled,escalated,shift\nZed,10,,1\nZed,20,,2\n' }, false),
      ],
      xpReward: 130, coinReward: 20,
    },
    {
      id: 'py-25-sensor-summary', objectiveId: 'py-25-transaction-summary', title: 'Sensor Log Summary', mode: 'challenge', language: 'python', skillIds: ['ps.decomposition', 'de.files', 'py.records', 'py.dicts'], concepts: ['json', 'grouping', 'aggregation', 'edge cases'], difficulty: 4, context: 'science', project: true,
      prompt: text(
        '`readings.json` is a list of readings like `{"id": "r1", "sensor": "S1", "value": 21.5}`. Write `report.json`: a JSON **object** with these keys:',
        '`"count"`: the number of readings.\n`"total"`: the sum of all values, rounded to 2 decimals.\n`"by_sensor"`: an object mapping each sensor to its total (rounded to 2 decimals).\n`"largest"`: the `id` of the reading with the largest value (the first one if tied), or `null` if there are no readings.\n`"frozen"`: a **sorted** list of the ids of readings with a value **below 0**.',
      ),
      expectedBehavior: 'report.json for the example gives count 4, total 23.75, per-sensor totals, largest "r3", frozen ["r2", "r4"].',
      fixtures: { files: { 'readings.json': '[{"id": "r1", "sensor": "S1", "value": 21.5}, {"id": "r2", "sensor": "S2", "value": -4.25}, {"id": "r3", "sensor": "S1", "value": 30}, {"id": "r4", "sensor": "S2", "value": -23.5}]' } }, starterCode: '',
      hints: ['One pass can build every answer, but think about each key separately first.', 'Decide how each key is computed, and what it should be for an empty list.', 'Use `round(x, 2)` on the totals. For `largest`, `max` with a key returns the first of equal items. Write the result with `json.dump`.'],
      checks: [
        file('report.json for the example', 'report.json', '{"count": 4, "total": 23.75, "by_sensor": {"S1": 51.5, "S2": -27.75}, "largest": "r3", "frozen": ["r2", "r4"]}'),
        file('No readings', 'report.json', '{"count": 0, "total": 0, "by_sensor": {}, "largest": null, "frozen": []}', { files: { 'readings.json': '[]' }, visible: false }),
        file('Ties for the largest', 'report.json', '{"count": 3, "total": 25, "by_sensor": {"a": 20, "b": 5}, "largest": "x", "frozen": []}', { files: { 'readings.json': '[{"id": "x", "sensor": "a", "value": 10}, {"id": "y", "sensor": "a", "value": 10}, {"id": "z", "sensor": "b", "value": 5}]' }, visible: false }),
        file('Frozen ids come out sorted', 'report.json', '{"count": 2, "total": -3, "by_sensor": {"a": -3}, "largest": "m", "frozen": ["c", "m"]}', { files: { 'readings.json': '[{"id": "m", "sensor": "a", "value": -1}, {"id": "c", "sensor": "a", "value": -2}]' }, visible: false }),
        file('Exactly 0 is not frozen', 'report.json', '{"count": 2, "total": 0, "by_sensor": {"a": 0}, "largest": "p", "frozen": []}', { files: { 'readings.json': '[{"id": "p", "sensor": "a", "value": 0}, {"id": "q", "sensor": "a", "value": 0}]' }, visible: false }),
      ],
      xpReward: 130, coinReward: 20,
    },
    {
      id: 'py-25-pair-programming', objectiveId: 'py-25-fixtures', title: 'Pair-Programming Rota', mode: 'challenge', language: 'python', skillIds: ['ps.decomposition', 'py.lists', 'py.functions'], concepts: ['algorithm design', 'nested loops', 'tuples', 'edge cases'], difficulty: 4, context: 'software', project: true,
      prompt: text(
        'A team wants everyone to pair up with everyone else exactly once. Write `all_pairs(names)`, which takes a list of names and returns a **list of pairs**, each pair a tuple `(first, second)`, such that:',
        '1. **Every two different people appear together exactly once.**\n2. In each pair, the names are in **alphabetical order** (`first` comes before `second`).\n3. The list of pairs is in **alphabetical order too** (compare the tuples the way Python does).',
        'Names are all different. With fewer than two names there are no pairs. The list you are given must not be changed.',
      ),
      expectedBehavior: 'For ["Cy", "Ann", "Bo"] the result is [("Ann", "Bo"), ("Ann", "Cy"), ("Bo", "Cy")].', starterCode: '',
      hints: ['How many pairs are there for n names? List them for three names by hand first.', 'Two nested loops can visit every pair once, if the second one starts after the first.', 'Sort the names first (on a copy); then pairs come out already in order.'],
      checks: [
        { kind: 'script', name: 'Three names', code: 'assert all_pairs(["Cy", "Ann", "Bo"]) == [("Ann", "Bo"), ("Ann", "Cy"), ("Bo", "Cy")], "Every pair once, each pair and the whole list in alphabetical order."' },
        { kind: 'script', name: 'Fewer than two names', code: 'assert list(all_pairs([])) == [], "No names means no pairs."\nassert list(all_pairs(["Solo"])) == [], "One person pairs with no one."' },
        { kind: 'script', name: 'Bigger groups', visible: false, code: 'import itertools\nfor names in (["b", "a"], ["d", "c", "b", "a"], ["Zoe", "Yan", "Xi", "Wu", "Vi", "Uma"], [f"n{i:02d}" for i in range(9, -1, -1)]):\n    got = all_pairs(names)\n    want = list(itertools.combinations(sorted(names), 2))\n    assert got == want, f"Wrong pairs for {len(names)} names."' },
        { kind: 'script', name: 'The input is not changed and results are tuples', visible: false, code: 'names = ["Owls", "Foxes", "Herons"]\ncopy = list(names)\ng = all_pairs(names)\nassert names == copy, "Do not change the list you were given."\nassert all(isinstance(p, tuple) and len(p) == 2 for p in g), "Each pair is a tuple of two names."\nassert len(g) == 3' },
        { kind: 'script', name: 'Capital letters sort before lower case', visible: false, code: 'assert all_pairs(["a", "B"]) == [("B", "a")], "Alphabetical order is the order Python sorts strings."' },
      ],
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the function with def.' }],
      xpReward: 130, coinReward: 20,
    },
  ],
};
