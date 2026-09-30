import { calls, text } from '../helpers';
import type { LessonBundle } from '../schema';
import { common, script } from './kit';

/** Every value below is a plain JSON-able record, so cases can be written as data. */
export const bundle: LessonBundle = {
  lesson: {
    id: 'de-04-validation', title: 'Trust, but Validate', language: 'python', skillId: 'de.quality',
    blurb: 'Records from outside your program can be missing, mistyped or nonsense. Check them field by field and report every problem.', prerequisites: ['de-02-python-sql'], xpReward: 80,
    reference: {
      title: 'Validating records',
      body: text(
        'Data from files, forms and APIs is **untrusted**. A validator answers one question per field: *is this value acceptable?* Return **every** problem at once (a list of field names or messages) instead of stopping at the first; that is what makes a reject report useful.',
        'Python traps: `True` is an `int` (`isinstance(True, int)` is `True`), so exclude `bool` when you mean a number. `float("nan")` compares false with everything, so check `math.isfinite`. A missing key raises `KeyError` with `r["k"]`; `r.get("k")` gives `None`. Whitespace-only text is blank: `s.strip() == ""`.',
        'Validate **type**, then **range or set**, in that order (a range check on a string crashes). Never change the record while validating it.',
      ),
      example: 'import math\nv = rec.get("value")\nok = isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) and 0 <= v <= 100',
    },
    steps: [
      { kind: 'teach', title: 'What "valid" really means', body: text('A record can be wrong in many independent ways: a field can be **missing**, have the **wrong type**, be **out of range**, or not one of the **allowed values**. A useful validator reports all of them, because the person fixing the source wants the whole list, not one problem per run.', 'The plan: write one small check per field, collect the names of the fields that fail, and return them sorted so the answer is predictable.') },
      {
        kind: 'demo', title: 'A validator that reports every problem', language: 'python',
        body: text('Two fields, two kinds of rule. Notice `.get()` (no crash on a missing key) and that the checks are independent, so both problems are reported.'),
        code: "def problems(rec):\n    out = []\n    name = rec.get('name')\n    if not isinstance(name, str) or not name.strip():\n        out.append('name')\n    age = rec.get('age')\n    if not isinstance(age, int) or isinstance(age, bool) or not 0 <= age <= 120:\n        out.append('age')\n    return out\n\nprint(problems({'name': 'Ada', 'age': 36}))\nprint(problems({'name': '  ', 'age': True}))\nprint(problems({}))",
        notice: 'The second record has TWO problems and the third has both fields missing. `True` was rejected as an age because `bool` is a subclass of `int`: a classic trap.',
      },
      { kind: 'challenge', challengeId: 'de-04-validate-reading' },
      { kind: 'challenge', challengeId: 'de-04-validate-order' },
    ],
  },
  objectives: [
    { id: 'de-obj-validate-record', title: 'Validate a record field by field', summary: 'Check type, range and allowed values for every field, reporting all problems, and never crash on odd input.' },
  ],
  challenges: [
    {
      id: 'de-04-validate-reading', title: 'Is This Sensor Reading Acceptable?', mode: 'learning', language: 'python', skillIds: ['de.quality', 'de.cleaning'], concepts: ['validation', 'isinstance', 'bool-is-int', 'isfinite'], difficulty: 2, context: 'environmental monitoring',
      prompt: text('A weather-station network sends readings as dictionaries like `{"id": 7, "sensor": "roof-2", "value": 21.5, "unit": "C"}`. Write `bad_fields(reading)` that returns a **sorted list of the names of the invalid fields**.', 'The rules: `id` is a whole number above zero; `sensor` is text that is not blank; `value` is a real number from -50 to 150 inclusive (not a bool, not `nan` or `inf`); `unit` is `"C"` or `"F"`. A missing field is invalid. If `reading` is not a dictionary at all, return `["record"]`.'),
      expectedBehavior: 'A good reading gives []. Each broken field name appears once, sorted; a non-dict gives ["record"].',
      guidedSteps: ['Return `["record"]` straight away if the input is not a dict (`isinstance`).', 'Collect names in a list, one `if` per field, using `.get()` so a missing key does not crash.', 'For numbers, exclude `bool` and check `math.isfinite` before the range.', 'Return `sorted(...)` of the list.'],
      starterCode: 'import math\n\ndef bad_fields(reading):\n    pass\n',
      hints: ['What are the different ways one field can be wrong? Handle each one separately.', 'Check the type first, then the range, and use `.get` so absent keys give `None`.', '`isinstance(True, int)` is `True`, and `nan` compares false with everything: both need a guard of their own.'],
      checks: [
        ...calls('bad_fields', [[[{ id: 7, sensor: 'roof-2', value: 21.5, unit: 'C' }], []], [[{ id: 0, sensor: 'x', value: 1, unit: 'C' }], ['id']], [[{ id: 3, sensor: '  ', value: 200, unit: 'K' }], ['sensor', 'unit', 'value']]], 3),
        script('Boundaries of the value range', "assert bad_fields({'id': 1, 'sensor': 's', 'value': 150, 'unit': 'F'}) == [], '150 is allowed.'\nassert bad_fields({'id': 1, 'sensor': 's', 'value': -50, 'unit': 'C'}) == [], '-50 is allowed.'\nassert bad_fields({'id': 1, 'sensor': 's', 'value': 150.01, 'unit': 'C'}) == ['value']\nassert bad_fields({'id': 1, 'sensor': 's', 'value': -50.5, 'unit': 'C'}) == ['value']", false),
        script('Types are checked before ranges', "assert bad_fields({'id': True, 'sensor': 's', 'value': 1, 'unit': 'C'}) == ['id'], 'True is not a valid id.'\nassert bad_fields({'id': 2.0, 'sensor': 's', 'value': 1, 'unit': 'C'}) == ['id'], 'An id must be a whole number type.'\nassert bad_fields({'id': '7', 'sensor': 's', 'value': 1, 'unit': 'C'}) == ['id']\nassert bad_fields({'id': 1, 'sensor': 5, 'value': 1, 'unit': 'C'}) == ['sensor']\nassert bad_fields({'id': 1, 'sensor': 's', 'value': False, 'unit': 'C'}) == ['value'], 'A bool is not a reading.'\nassert bad_fields({'id': 1, 'sensor': 's', 'value': '20', 'unit': 'C'}) == ['value']", false),
        script('Missing fields and odd input never crash', "assert bad_fields({}) == ['id', 'sensor', 'unit', 'value']\nassert bad_fields({'id': 4}) == ['sensor', 'unit', 'value']\nassert bad_fields(None) == ['record']\nassert bad_fields([1, 2]) == ['record']\nassert bad_fields('text') == ['record']", false),
        script('Special float values are not real readings', "nan = float('nan'); inf = float('inf')\nassert bad_fields({'id': 1, 'sensor': 's', 'value': nan, 'unit': 'C'}) == ['value']\nassert bad_fields({'id': 1, 'sensor': 's', 'value': inf, 'unit': 'C'}) == ['value']\nassert bad_fields({'id': 1, 'sensor': 's', 'value': -inf, 'unit': 'C'}) == ['value']", false),
        script('The record is left unchanged', "r = {'id': 1, 'sensor': ' s ', 'value': 3, 'unit': 'C'}\nbefore = dict(r)\nbad_fields(r)\nassert r == before, 'Validation must not change the record.'", false),
      ],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'de-04-validate-order', objectiveId: 'de-obj-validate-record', title: 'Is This Order Acceptable?', mode: 'challenge', skillIds: ['de.quality', 'de.cleaning'], concepts: ['validation', 'isinstance', 'bool-is-int'], difficulty: 3, context: 'e-commerce', ...common,
      prompt: text('A shop receives orders as dictionaries such as `{"id": 12, "customer": "Ada", "qty": 3, "status": "paid"}`. Write `bad_fields(order)` returning a **sorted list of the invalid field names** (empty for a good order).', 'Rules: `id` is a positive whole number; `customer` is non-blank text; `qty` is a whole number from 1 to 100 inclusive; `status` is one of `"new"`, `"paid"`, `"shipped"`. A missing field is invalid. Anything that is not a dictionary is `["record"]`. Never change the order.'),
      expectedBehavior: 'Every invalid field is named once, sorted; a valid order gives [].',
      starterCode: '',
      hints: ['List the ways a single field can be wrong, and give each field its own independent check.', 'Type first, then range or allowed set; `.get` avoids crashes on missing keys.', 'Numbers exclude `bool`; blank text includes text that is only spaces.'],
      checks: [
        script('A good order and a plainly bad one', "assert bad_fields({'id': 12, 'customer': 'Ada', 'qty': 3, 'status': 'paid'}) == []\nassert bad_fields({'id': -1, 'customer': 'Ada', 'qty': 3, 'status': 'paid'}) == ['id']\nassert bad_fields({'id': 5, 'customer': '', 'qty': 0, 'status': 'lost'}) == ['customer', 'qty', 'status']"),
        script('Boundaries of qty', "ok = lambda q: bad_fields({'id': 1, 'customer': 'c', 'qty': q, 'status': 'new'})\nassert ok(1) == [] and ok(100) == [], 'Both ends are allowed.'\nassert ok(0) == ['qty'] and ok(101) == ['qty']\nassert ok(2.5) == ['qty'] and ok('3') == ['qty'] and ok(True) == ['qty']", false),
        script('Missing fields, blanks and wrong shapes', "assert bad_fields({}) == ['customer', 'id', 'qty', 'status']\nassert bad_fields({'id': 1, 'customer': '   ', 'qty': 1, 'status': 'new'}) == ['customer']\nassert bad_fields({'id': True, 'customer': 'c', 'qty': 1, 'status': 'new'}) == ['id']\nassert bad_fields({'id': 1, 'customer': 'c', 'qty': 1, 'status': 'NEW'}) == ['status']\nassert bad_fields(None) == ['record'] and bad_fields(7) == ['record'] and bad_fields([]) == ['record']", false),
        script('The order is left unchanged', "o = {'id': 1, 'customer': ' x ', 'qty': 2, 'status': 'new'}\nb = dict(o)\nbad_fields(o)\nassert o == b", false),
      ],
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'de-04-validate-patient', objectiveId: 'de-obj-validate-record', title: 'Is This Patient Record Acceptable?', mode: 'challenge', skillIds: ['de.quality', 'de.cleaning'], concepts: ['validation', 'isinstance', 'bool-is-int'], difficulty: 3, context: 'healthcare', ...common,
      prompt: text('A clinic exports check-in records as dictionaries such as `{"mrn": "004512", "age": 47, "ward": "B", "temp_c": 36.8}`. Write `bad_fields(rec)` returning a **sorted list of the names of the invalid fields** (empty when everything is fine).', 'Rules: `mrn` is text of exactly six digits; `age` is a whole number from 0 to 120 inclusive; `ward` is `"A"`, `"B"` or `"C"`; `temp_c` is a real number from 30 to 45 inclusive (no bool, `nan` or `inf`). A missing field is invalid. A value that is not a dictionary gives `["record"]`. Do not change the record.'),
      expectedBehavior: 'Every invalid field is named once, sorted; a valid record gives [].',
      starterCode: '',
      hints: ['One independent check per field; collect names, do not stop at the first.', 'Text of "six digits" is both a type and a shape question. Which comes first?', 'Numbers exclude `bool`, and `nan` needs its own guard.'],
      checks: [
        script('A good record and a plainly bad one', "assert bad_fields({'mrn': '004512', 'age': 47, 'ward': 'B', 'temp_c': 36.8}) == []\nassert bad_fields({'mrn': '12345', 'age': 47, 'ward': 'B', 'temp_c': 36.8}) == ['mrn']\nassert bad_fields({'mrn': 'abcdef', 'age': 130, 'ward': 'Z', 'temp_c': 20}) == ['age', 'mrn', 'temp_c', 'ward']"),
        script('Boundaries and exact shapes', "f = lambda **k: bad_fields({'mrn': '000001', 'age': 30, 'ward': 'A', 'temp_c': 37, **k})\nassert f(age=0) == [] and f(age=120) == [] and f(age=121) == ['age'] and f(age=-1) == ['age']\nassert f(temp_c=30) == [] and f(temp_c=45) == [] and f(temp_c=45.1) == ['temp_c'] and f(temp_c=29.9) == ['temp_c']\nassert f(mrn='1234567') == ['mrn'] and f(mrn='12 456') == ['mrn'] and f(mrn=123456) == ['mrn']", false),
        script('Types, missing fields and odd input', "f = lambda **k: bad_fields({'mrn': '000001', 'age': 30, 'ward': 'A', 'temp_c': 37, **k})\nassert f(age=True) == ['age'] and f(age=30.0) == ['age'] and f(age='30') == ['age']\nassert f(temp_c=True) == ['temp_c'] and f(temp_c='37') == ['temp_c']\nassert f(temp_c=float('nan')) == ['temp_c'] and f(temp_c=float('inf')) == ['temp_c']\nassert bad_fields({}) == ['age', 'mrn', 'temp_c', 'ward']\nassert bad_fields(None) == ['record'] and bad_fields('x') == ['record']", false),
        script('The record is left unchanged', "r = {'mrn': ' 1 ', 'age': 3, 'ward': 'A', 'temp_c': 37}\nb = dict(r)\nbad_fields(r)\nassert r == b", false),
      ],
      xpReward: 100, coinReward: 15,
    },
  ],
};
