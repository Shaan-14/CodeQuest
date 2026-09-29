import { text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const out = (name: string, expect: string, files?: Record<string, string>, visible = true): Check => ({ kind: 'output', name, expect, files, visible });
const file = (name: string, path: string, expect: string, opts: { json?: boolean; files?: Record<string, string>; visible?: boolean } = {}): Check => ({ kind: 'file', name, path, expect, ...opts });

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-25-projects', title: 'Projects: Putting It Together', language: 'python', skillId: 'ps.decomposition',
    blurb: 'Larger problems that combine files, data structures, functions and classes. Less hand-holding.', prerequisites: ['py-24-oop'], xpReward: 60,
    reference: {
      title: 'Approaching a project',
      body: text(
        'Big problems are solved by **decomposition**: (1) restate the requirements in your own words and find the ambiguous parts, (2) work out what data comes in and what must come out, using the examples, (3) split the work into stages or functions (read, clean, calculate, format, write), (4) build and test ONE stage at a time on a tiny example, (5) then join them, (6) check the edge cases: empty input, ties, missing values, exact boundaries.',
        'When a requirement is unclear, pick a sensible interpretation, state it in a comment, and check it against the examples given.',
      ),
    },
    steps: [
      {
        kind: 'teach', title: 'Now it is a project',
        body: text(
          'The tasks so far had one idea each. Real work rarely does. The next three problems each combine several skills: reading files, cleaning values, grouping and summarising, formatting output, designing a small algorithm. They are described the way a colleague would describe them, with less guidance and more to work out yourself.',
          'There is no step-by-step recipe. Use the method: understand, break down, build one stage at a time, test on a small example, then check the edges. Your Field Manual and your earlier notes are available.',
        ),
      },
      { kind: 'challenge', challengeId: 'py-25-line-report' },
      { kind: 'challenge', challengeId: 'py-25-transaction-summary' },
      { kind: 'challenge', challengeId: 'py-25-fixtures' },
    ],
  },
  challenges: [
    {
      id: 'py-25-line-report', title: 'Production Line Report', mode: 'challenge', language: 'python', skillIds: ['ps.decomposition', 'de.files', 'py.records', 'py.dicts', 'de.cleaning'], concepts: ['csv', 'grouping', 'sorting', 'formatting', 'edge cases'], difficulty: 4, context: 'manufacturing', project: true,
      prompt: text(
        '`runs.csv` (header `machine,units,defects,hours`) lists production runs; a machine appears in many rows. Produce a report on the screen:',
        'One line per machine: `<machine>: <units> units, <defects> defects (<rate>%)`, where `units` and `defects` are **totals over all of that machine’s rows** and `rate` is `defects ÷ units × 100` to **one decimal** (a machine with 0 units has rate 0.0). Order the lines by rate, **highest first**; machines with the same rate go in name order, A to Z.',
        'A row with an **empty** `defects` value counts as 0 defects. After the machine lines, print a final line `Overall: <rate>%` for all machines combined, to one decimal (`0.0` if there is no data).',
      ),
      expectedBehavior: 'For the example file: M3 (10.0%), M2 (3.3%), M1 (1.0%), then Overall: 4.9%.',
      fixtures: { files: { 'runs.csv': 'machine,units,defects,hours\nM2,200,10,4\nM1,300,3,5\nM2,100,,2\nM3,400,40,8\nM1,100,1,3\n' } },
      starterCode: '',
      hints: ['Split it into stages: read the file, total per machine, calculate rates, sort, print.', 'A dictionary of per-machine totals is the heart of it. Remember the empty-defects rule when you read a row.', 'Sorting on two things at once: use a key that returns a tuple, such as `(-rate, name)`. Guard the division by zero.'],
      checks: [
        out('The example file', 'M3: 400 units, 40 defects (10.0%)\nM2: 300 units, 10 defects (3.3%)\nM1: 400 units, 4 defects (1.0%)\nOverall: 4.9%'),
        out('Quoted names, ties, and zero units', 'Drill: 100 units, 5 defects (5.0%)\nSaw, twin: 100 units, 5 defects (5.0%)\nLathe: 0 units, 0 defects (0.0%)\nOverall: 5.0%', { 'runs.csv': 'machine,units,defects,hours\n"Saw, twin",100,5,2\nDrill,100,5,3\nLathe,0,0,1\n' }, false),
        out('No data at all', 'Overall: 0.0%', { 'runs.csv': 'machine,units,defects,hours\n' }, false),
        out('One machine, missing defects', 'A: 50 units, 0 defects (0.0%)\nOverall: 0.0%', { 'runs.csv': 'machine,units,defects,hours\nA,20,,1\nA,30,,2\n' }, false),
      ],
      xpReward: 130, coinReward: 20,
    },
    {
      id: 'py-25-transaction-summary', title: 'Transaction Summary', mode: 'challenge', language: 'python', skillIds: ['ps.decomposition', 'de.files', 'py.records', 'py.dicts'], concepts: ['json', 'grouping', 'aggregation', 'edge cases'], difficulty: 4, context: 'finance', project: true,
      prompt: text(
        '`transactions.json` is a list of transactions like `{"id": "t1", "category": "food", "amount": 12.5}`. Write `summary.json`: a JSON **object** with these keys:',
        '`"count"`: the number of transactions.\n`"total"`: the sum of all amounts, rounded to 2 decimals.\n`"by_category"`: an object mapping each category to its total (rounded to 2 decimals).\n`"largest"`: the `id` of the transaction with the largest amount (the first one if tied), or `null` if there are no transactions.\n`"flagged"`: a **sorted** list of the ids of transactions with an amount **greater than 1000**.',
      ),
      expectedBehavior: 'summary.json for the example gives count 4, total 2720.25, per-category totals, largest "t4", flagged ["t2", "t4"].',
      fixtures: { files: { 'transactions.json': '[{"id": "t1", "category": "food", "amount": 12.5}, {"id": "t2", "category": "rent", "amount": 1200}, {"id": "t3", "category": "food", "amount": 7.25}, {"id": "t4", "category": "tech", "amount": 1500.5}]' } },
      starterCode: '',
      hints: ['One pass over the data can build every answer at once, but it helps to think about each key separately first.', 'Decide how each key is computed, and what it should be for an empty list.', 'Use `round(x, 2)` on the totals. For `largest`, `max` with a key returns the first of equal items. Write the result with `json.dump`.'],
      checks: [
        file('summary.json for the example', 'summary.json', '{"count": 4, "total": 2720.25, "by_category": {"food": 19.75, "rent": 1200, "tech": 1500.5}, "largest": "t4", "flagged": ["t2", "t4"]}', { json: true }),
        file('No transactions', 'summary.json', '{"count": 0, "total": 0, "by_category": {}, "largest": null, "flagged": []}', { json: true, files: { 'transactions.json': '[]' }, visible: false }),
        file('Ties for the largest, and per-category totals', 'summary.json', '{"count": 3, "total": 2501, "by_category": {"a": 2001, "b": 500}, "largest": "x", "flagged": ["x", "y"]}', { json: true, files: { 'transactions.json': '[{"id": "x", "category": "a", "amount": 1000.5}, {"id": "y", "category": "a", "amount": 1000.5}, {"id": "z", "category": "b", "amount": 500}]' }, visible: false }),
        file('Flagged ids come out sorted, not in file order', 'summary.json', '{"count": 2, "total": 3500, "by_category": {"a": 3500}, "largest": "m2", "flagged": ["c1", "m2"]}', { json: true, files: { 'transactions.json': '[{"id": "m2", "category": "a", "amount": 2000}, {"id": "c1", "category": "a", "amount": 1500}]' }, visible: false }),
        file('Exactly 1000 is not flagged', 'summary.json', '{"count": 2, "total": 2000, "by_category": {"a": 2000}, "largest": "p", "flagged": []}', { json: true, files: { 'transactions.json': '[{"id": "p", "category": "a", "amount": 1000}, {"id": "q", "category": "a", "amount": 1000}]' }, visible: false }),
      ],
      xpReward: 130, coinReward: 20,
    },
    {
      id: 'py-25-fixtures', title: 'The Season Schedule', mode: 'challenge', language: 'python', skillIds: ['ps.decomposition', 'py.lists', 'py.functions'], concepts: ['algorithm design', 'nested loops', 'tuples', 'edge cases'], difficulty: 4, context: 'scheduling', project: true,
      prompt: text(
        'A league needs a schedule. Write `round_robin(teams)`, which takes a list of team names and returns a **list of games**, each game a tuple `(home, away)`, such that:',
        '1. **Every pair of different teams meets exactly once** (in either order).\n2. No team plays itself.\n3. It is **fair about home games**: no team hosts more than one more game than any other team.',
        'With fewer than two teams there are no games. The order of the games in your list does not matter.',
      ),
      expectedBehavior: 'With 4 teams there are 6 games; every pair meets once; home-game counts differ by at most 1.',
      starterCode: '',
      hints: ['Start by listing which PAIRS of teams need to meet. How many pairs are there for n teams?', 'Two loops can visit every pair once. The tricky part is deciding, for each pair, who is at home so that it comes out fair.', 'Use the positions `i < j` of the two teams. Alternating who is home based on whether `i + j` is odd or even spreads the home games evenly.'],
      checks: [
        { kind: 'script', name: 'Four teams: every pair meets once', code: 'teams = ["A", "B", "C", "D"]\ng = round_robin(teams)\nassert len(g) == 6, "With 4 teams there should be 6 games."\nassert len({frozenset(x) for x in g}) == 6, "Every pair of teams should meet exactly once."\nassert all(len(x) == 2 and x[0] != x[1] for x in g), "A game is (home, away) between two different teams."' },
        { kind: 'script', name: 'No games for fewer than two teams', code: 'assert list(round_robin([])) == [], "No teams means no games."\nassert list(round_robin(["Solo"])) == [], "One team plays no one."' },
        { kind: 'script', name: 'Home games are shared fairly', visible: false, code: 'for n in (2, 3, 4, 5, 6, 8, 9):\n    teams = [f"T{i}" for i in range(n)]\n    g = round_robin(teams)\n    assert len(g) == n * (n - 1) // 2, f"With {n} teams there should be {n * (n - 1) // 2} games."\n    assert len({frozenset(x) for x in g}) == len(g), f"With {n} teams some pair meets more than once."\n    home = {t: 0 for t in teams}\n    for h, a in g:\n        assert h in home and a in home, "Games must use the team names given."\n        home[h] += 1\n    assert max(home.values()) - min(home.values()) <= 1, f"With {n} teams the home games are not shared fairly: {home}"' },
        { kind: 'script', name: 'It works with real names and does not change the input', visible: false, code: 'teams = ["Owls", "Foxes", "Herons", "Wolves", "Otters"]\ncopy = list(teams)\ng = round_robin(teams)\nassert teams == copy, "Do not change the list you were given."\nassert len(g) == 10 and all(h in teams and a in teams for h, a in g), "Use the team names given."' },
      ],
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the function with def.' }],
      xpReward: 130, coinReward: 20,
    },
  ],
};
