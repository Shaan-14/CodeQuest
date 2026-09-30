import { calls, text } from '../helpers';
import { refCalls } from '../daily/helpers';
import type { LessonBundle } from '../schema';

const WAREHOUSE_REF = "def _ref(w):\n    total = 0\n    for aisle in w.get('aisles', []):\n        for b in aisle.get('bins', []):\n            total += b.get('qty', 0)\n    return total";
const ORDERS_REF = "import json\ndef _ref(t):\n    try:\n        data = json.loads(t)\n    except ValueError:\n        return []\n    if not isinstance(data, list):\n        return []\n    out = []\n    for o in data:\n        for line in o.get('lines', []):\n            out.append((o.get('id'), line.get('sku'), line.get('qty')))\n    return out";
const ROSTER_REF = "import json\ndef _ref(t):\n    try:\n        data = json.loads(t)\n    except ValueError:\n        return []\n    if not isinstance(data, list):\n        return []\n    out = []\n    for c in data:\n        for s in c.get('students', []):\n            out.append((c.get('class'), s.get('name'), s.get('score')))\n    return out";

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-30-nested-data', title: 'Data Inside Data', language: 'python', skillId: 'py.nested',
    blurb: 'Real data is nested: lists of dictionaries of lists. Walk it, tolerate what is missing, and flatten it into rows.', prerequisites: ['py-17-records'], xpReward: 60,
    reference: {
      title: 'Nested data',
      body: text(
        'JSON and API responses are **nested**: a dict whose values are lists of dicts whose values are lists… Walk it with **nested loops**, one per level: `for aisle in w["aisles"]: for b in aisle["bins"]:`.',
        'Missing pieces are normal. `d.get("key", [])` gives an empty list to loop over when the key is absent, so the inner loop simply does nothing. Chain `.get` carefully: `d.get("a", {}).get("b", 0)`. Use `isinstance(x, list)` when the shape itself might be wrong.',
        '**Flattening** turns nested data into a flat list of rows (tuples): append one tuple per innermost item, carrying along the values from the levels above. `json.loads(text)` turns JSON text into Python data and raises `ValueError` (`json.JSONDecodeError`) when the text is not valid JSON.',
      ),
      example: 'rows = []\nfor order in orders:\n    for line in order.get("lines", []):\n        rows.append((order["id"], line["sku"], line["qty"]))',
    },
    steps: [
      { kind: 'teach', title: 'Boxes inside boxes', body: text('A warehouse has aisles, aisles have bins, bins hold items. Data about it looks the same: a dictionary containing a list of dictionaries, each containing a list of dictionaries. You reach the innermost items with **one loop per level**.', 'Real feeds are also **incomplete**: an aisle with no bins, a bin with no quantity. A robust program treats "missing" as "nothing here" instead of crashing.') },
      {
        kind: 'demo', title: 'One loop per level', language: 'python',
        body: text('Add up every quantity in a nested structure, tolerating an aisle that has no `bins` key.'),
        code: "warehouse = {'aisles': [\n    {'name': 'A', 'bins': [{'sku': 'x', 'qty': 4}, {'sku': 'y', 'qty': 6}]},\n    {'name': 'B'},\n    {'name': 'C', 'bins': [{'sku': 'z'}]},\n]}\ntotal = 0\nfor aisle in warehouse['aisles']:\n    for b in aisle.get('bins', []):\n        total += b.get('qty', 0)\nprint(total)",
        notice: 'Aisle B has no `bins`, and the bin in aisle C has no `qty`. `.get(..., [])` and `.get(..., 0)` turned both into "nothing" instead of a `KeyError`.',
      },
      { kind: 'challenge', challengeId: 'py-30-total-stock' },
      { kind: 'challenge', challengeId: 'py-30-order-lines' },
    ],
  },
  objectives: [
    { id: 'py-obj-flatten-json', title: 'Flatten nested JSON into rows', summary: 'Parse JSON text safely and turn a nested structure into a flat list of tuples, tolerating missing parts.' },
  ],
  challenges: [
    {
      id: 'py-30-total-stock', title: 'Total Stock in a Warehouse', mode: 'learning', language: 'python', skillIds: ['py.nested', 'py.dicts'], concepts: ['nested-loops', 'dict.get', 'defaults'], difficulty: 2, context: 'logistics',
      prompt: text('A warehouse is a dictionary like `{"name": "North", "aisles": [{"name": "A", "bins": [{"sku": "x1", "qty": 4}]}]}`. Write `total_stock(warehouse)` returning the sum of every bin\'s `qty`. An aisle with no `bins`, a warehouse with no `aisles` or a bin with no `qty` simply counts as nothing.'),
      expectedBehavior: 'The sum of all quantities; missing parts count as zero.',
      guidedSteps: ['Loop over `warehouse.get("aisles", [])`.', 'Inside, loop over `aisle.get("bins", [])`.', 'Add `bin.get("qty", 0)` to a running total.'],
      starterCode: 'def total_stock(warehouse):\n    pass\n',
      hints: ['How many levels deep are the numbers, and what does that say about your loops?', 'What should a loop do when the list it loops over is missing?', '`dict.get(key, default)` lets you supply "nothing" as the default.'],
      checks: [
        ...calls('total_stock', [[[{ name: 'N', aisles: [{ name: 'A', bins: [{ sku: 'x', qty: 4 }, { sku: 'y', qty: 6 }] }, { name: 'B', bins: [{ sku: 'z', qty: 1 }] }] }], 11], [[{ name: 'E' }], 0]], 2),
        ...refCalls('total_stock', WAREHOUSE_REF, ["{'aisles': []}", "{'aisles': [{'name': 'A'}]}", "{'aisles': [{'bins': [{'qty': 3}, {}, {'qty': 5}]}]}", "{'aisles': [{'bins': [{'qty': 2}]}, {'bins': []}, {'bins': [{'qty': 5}, {'qty': 7}]}]}", "{}"]),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'py-30-order-lines', objectiveId: 'py-obj-flatten-json', title: 'Flatten Order Lines', mode: 'challenge', language: 'python', skillIds: ['py.nested', 'py.dicts'], concepts: ['json', 'nested-loops', 'flatten'], difficulty: 3, context: 'retail',
      prompt: text('A shop exports its orders as JSON **text**: a list of objects like `{"id": 7, "customer": "Ada", "lines": [{"sku": "A1", "qty": 2}]}`. Write `order_lines(text)` returning a list of `(order_id, sku, qty)` tuples: one for every line of every order, in the order they appear. An order with no `lines` contributes nothing. If the text is not valid JSON, or is not a list, return an empty list.'),
      expectedBehavior: 'A flat list of (order_id, sku, qty) tuples, empty for bad input.',
      starterCode: '',
      hints: ['What happens if the text is not valid JSON, and where should you guard against it?', 'One loop per level of nesting; what do you carry from the outer level?', 'A missing key should mean "nothing here", not a crash.'],
      checks: refCalls('order_lines', ORDERS_REF, ['\'[{"id": 7, "customer": "Ada", "lines": [{"sku": "A1", "qty": 2}, {"sku": "B2", "qty": 1}]}, {"id": 8, "lines": [{"sku": "C3", "qty": 5}]}]\'', '"[]"', '"not json"', '\'{"id": 1}\'', '\'[{"id": 1}, {"id": 2, "lines": []}]\'', '\'[{"id": 3, "lines": [{"sku": "Z"}]}]\'', '""', '\'[{"id": 9, "lines": [{"sku": "Q", "qty": 0}]}]\'']),
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'py-30-roster-scores', objectiveId: 'py-obj-flatten-json', title: 'Flatten Class Rosters', mode: 'challenge', language: 'python', skillIds: ['py.nested', 'py.dicts'], concepts: ['json', 'nested-loops', 'flatten'], difficulty: 3, context: 'education',
      prompt: text('A school exports classes as JSON **text**: a list of objects like `{"class": "5A", "students": [{"name": "Bo", "score": 71}]}`. Write `roster_scores(text)` returning a list of `(class, name, score)` tuples: one for every student of every class, in the order they appear. A class with no `students` contributes nothing. If the text is not valid JSON, or is not a list, return an empty list.'),
      expectedBehavior: 'A flat list of (class, name, score) tuples, empty for bad input.',
      starterCode: '',
      hints: ['Two things can be wrong before you even loop: what are they?', 'Which value from the outer level must travel with each student?', 'Missing keys should mean "nothing here".'],
      checks: refCalls('roster_scores', ROSTER_REF, ['\'[{"class": "5A", "students": [{"name": "Bo", "score": 71}, {"name": "Cy", "score": 88}]}, {"class": "5B", "students": [{"name": "Di", "score": 64}]}]\'', '"[]"', '"{oops"', '\'{"class": "5A"}\'', '\'[{"class": "5A"}, {"class": "5B", "students": []}]\'', '\'[{"class": "5C", "students": [{"name": "Ed"}]}]\'', '""', '\'[{"class": "6A", "students": [{"name": "Fay", "score": 0}]}]\'']),
      xpReward: 100, coinReward: 15,
    },
  ],
};
