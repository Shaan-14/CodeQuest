import { calls, text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const file = (name: string, expect: string, files?: Record<string, string>, visible = true, path = 'clean.csv'): Check => ({ kind: 'file', name, path, expect, files, visible });
const out = (name: string, expect: string, files?: Record<string, string>, visible = true): Check => ({ kind: 'output', name, expect, files, visible });

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-21-cleaning', title: 'Messy Data', language: 'python', skillId: 'de.cleaning',
    blurb: 'Cleaning and validating real-world data: missing values, bad formats, duplicates and rejects.', prerequisites: ['py-20-files'], xpReward: 55,
    reference: {
      title: 'Cleaning and validating data',
      body: text(
        'Real data is messy: stray spaces, inconsistent capitals, `$` and thousands commas in numbers, blanks, `"n/a"`, out-of-range values, wrong numbers of columns, duplicate rows. Write down the **rules** first (what counts as valid?), then apply them one row at a time.',
        'Typical steps for each row: **parse** (`csv`), **normalise** (`.strip()`, `.upper()`, `.replace("$", "")`), **validate** (numeric? in range? required fields present? correct field count?), then either **accept** or **reject**. Keep a count of rejects, and do not crash on bad rows: `try/except ValueError` around conversions.',
        'Remember `float("nan")` and `float("inf")` parse successfully. Comparisons like `0 <= v <= 500` are False for NaN, which makes a range check a good guard.',
      ),
      example: 'try:\n    v = float(text.strip().replace(",", "").lstrip("$"))\nexcept ValueError:\n    v = None',
    },
    steps: [
      {
        kind: 'teach', title: 'Data arrives broken',
        body: text(
          'Nobody hands you clean data. It is typed by people, exported by old software, merged from three systems. A large fraction of real data work is **cleaning**: turning what arrived into what you can trust. That means deciding, explicitly, what “valid” means, and being able to say how many rows you had to throw away and why.',
          'A cleaning program should never silently drop data or crash on the first surprise. It should **accept** good rows, **reject** bad ones, and **report** what it did.',
        ),
      },
      {
        kind: 'demo', title: 'Normalise, validate, report',
        body: text('Follow one pass over some raw values. Which ones survive?'),
        code: 'raw = ["  Press 1 ", "PRESS 1", "lathe", "", "n/a", "12.5"]\nclean, rejected = [], 0\nseen = set()\nfor item in raw:\n    name = item.strip().upper()\n    if not name or name == "N/A" or name in seen:\n        rejected += 1\n        continue\n    seen.add(name)\n    clean.append(name)\nprint(clean)\nprint("rejected:", rejected)',
        notice: 'Normalising first (`strip`, `upper`) is what made "  Press 1 " and "PRESS 1" recognisable as the same thing. Blanks, "n/a" and repeats were rejected and counted, so nothing vanished silently.',
      },
      { kind: 'challenge', challengeId: 'py-21-clean-prices' },
      { kind: 'challenge', challengeId: 'py-21-clean-measurements' },
      { kind: 'challenge', challengeId: 'py-21-quality-report' },
    ],
  },
  objectives: [
    { id: 'py-obj-clean-csv', title: 'Clean a messy CSV file', summary: 'Apply written validation rules to a CSV, write the accepted rows, and report how many were rejected.' },
    { id: 'py-obj-quality-report', title: 'Report on data quality', summary: 'Count missing values, duplicates and out-of-range values without changing the data.' },
  ],
  challenges: [
    {
      id: 'py-21-clean-prices', title: 'Clean the Prices', mode: 'learning', language: 'python', skillIds: ['de.cleaning', 'py.defensive', 'py.strings'], concepts: ['strip', 'replace', 'try', 'float', 'skip bad values'], difficulty: 2, context: 'retail',
      prompt: text('A price list arrived as text: `"$12.50"`, `" 8 "`, `"n/a"`, `"3,200.00"`, `""`. Write `clean_prices(raw)` that returns a list of the values it can turn into numbers (as floats), in order. Values that cannot be converted are **skipped**.'),
      expectedBehavior: 'clean_prices(["$12.50", " 8 ", "n/a", "3,200.00"]) returns [12.5, 8.0, 3200.0].',
      guidedSteps: ['Loop over the raw values.', 'Clean each one: `.strip()`, remove `$` and `,`.', 'Try `float(...)`; on `ValueError` skip it.', 'Append the good ones and return the list.'],
      starterCode: 'def clean_prices(raw):\n    pass\n',
      hints: ['Each value needs cleaning BEFORE you try to convert it.', 'Some values will never convert, and the program must carry on: think `try` / `except`.', '`text.strip().replace("$", "").replace(",", "")`, then `float(...)` inside a `try`.'],
      checks: calls('clean_prices', [[[['$12.50', ' 8 ', 'n/a', '3,200.00']], [12.5, 8.0, 3200.0]], [[[]], []], [[['abc', '', '$']], []], [[['-4']], [-4.0]], [[['1,000,000.5', ' $ ']], [1000000.5]], [[['  ', '9']], [9.0]]], 2),
      constraints: [{ type: 'requires', node: 'Try', message: 'Use try/except so bad values do not crash your function.' }],
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'py-21-clean-measurements', objectiveId: 'py-obj-clean-csv', title: 'Clean the Measurements', mode: 'challenge', language: 'python', skillIds: ['de.cleaning', 'de.files', 'py.defensive', 'ps.decomposition'], concepts: ['csv', 'validation', 'duplicates', 'rejects', 'normalise'], difficulty: 3, context: 'engineering', project: true,
      prompt: text(
        '`raw.csv` (header `machine,reading`) contains machine readings typed by hand, so it is messy. Write `clean.csv` (same header) containing only the **valid** rows, and print how many rows were rejected: `Rejected: N`.',
        'The rules:\n1. Each row must have exactly 2 fields.\n2. The machine name is trimmed and made UPPER CASE; it must not be empty.\n3. The reading is trimmed and must be a number from 0 to 500 inclusive.\n4. A row is a duplicate (rejected) if an earlier accepted row has the same cleaned machine and the same reading.\n5. Write accepted rows in their original order, with the reading shown to **one decimal** (`12.5`, `77.0`).',
      ),
      expectedBehavior: 'clean.csv has the header and the accepted rows; the program prints how many data rows it rejected.',
      fixtures: { files: { 'raw.csv': 'machine,reading\nm1, 12.5\nM2,77\nm1,12.5\nM3,\nM4,abc\nM5,900\n,5\nM6,10,extra\nM7,0\n' } },
      starterCode: '',
      hints: ['Write the rules as small checks in the order given, and stop at the first one that fails.', 'Work row by row. Normalise first, then validate; keep a set of what you have accepted, and a rejected counter.', 'Wrap the `float(...)` in `try/except ValueError`, check `0 <= v <= 500`, and use the pair `(machine, v)` in a set to detect duplicates.'],
      checks: [
        file('clean.csv for the example', 'machine,reading\nM1,12.5\nM2,77.0\nM7,0.0'),
        out('Rejected count', 'Rejected: 6'),
        file('A different messy file', 'machine,reading\nPRESS 2,250.5\nLATHE,0.0\nLATHE,500.0\nSORTER,100.0', { 'raw.csv': 'machine,reading\n Press 2 ,250.5\nPRESS 2,  250.5\nlathe,-0.5\nlathe,0\nlathe,500\nwelder,500.1\nsorter,1e2\n,\npacker,12,3\n' }, false),
        out('Rejected count for that file', 'Rejected: 5', { 'raw.csv': 'machine,reading\n Press 2 ,250.5\nPRESS 2,  250.5\nlathe,-0.5\nlathe,0\nlathe,500\nwelder,500.1\nsorter,1e2\n,\npacker,12,3\n' }, false),
        file('Special values are not numbers in range', 'machine,reading\nA,1.0', { 'raw.csv': 'machine,reading\nA,1\nB,nan\nC,inf\nD,-inf\n' }, false),
        file('Only a header', 'machine,reading', { 'raw.csv': 'machine,reading\n' }, false),
      ],
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'py-21-clean-transactions', objectiveId: 'py-obj-clean-csv', title: 'Clean the Transactions', mode: 'challenge', language: 'python', skillIds: ['de.cleaning', 'de.files', 'py.defensive', 'ps.decomposition'], concepts: ['csv', 'validation', 'duplicates', 'rejects', 'normalise'], difficulty: 3, context: 'finance', project: true,
      prompt: text(
        '`raw.csv` (header `id,amount,currency`) is an export from a payment system. Write `clean.csv` (same header) with the **valid** rows, and print `Rejected: N`.',
        'The rules:\n1. Each row must have exactly 3 fields.\n2. `id` is trimmed and must be made only of digits.\n3. `amount` is trimmed; a leading `$` and any thousands commas are removed; it must then be a number **greater than 0**.\n4. `currency` is trimmed and made upper case; it must be `GBP`, `USD` or `EUR`.\n5. A row is a duplicate (rejected) if an earlier accepted row has the same `id`.\n6. Write accepted rows in their original order, with the amount to **two decimals**.',
      ),
      expectedBehavior: 'clean.csv has the header and the accepted rows; the program prints how many data rows it rejected.',
      fixtures: { files: { 'raw.csv': 'id,amount,currency\n101,"1,200.50",gbp\n102,$45,USD\n101,10,GBP\n103,-5,EUR\n104,abc,EUR\n105,20,JPY\n,20,USD\n106,0,USD\n107,7.5, eur\n' } },
      starterCode: '',
      hints: ['Turn each numbered rule into one small check, and apply them in order.', 'Clean the amount text BEFORE converting it. Keep a set of ids you have accepted.', '`float(s.replace("$", "").replace(",", ""))` inside `try/except ValueError`; `id.isdigit()` tests digits; membership in `{"GBP", "USD", "EUR"}` tests the currency.'],
      checks: [
        file('clean.csv for the example', 'id,amount,currency\n101,1200.50,GBP\n102,45.00,USD\n107,7.50,EUR'),
        out('Rejected count', 'Rejected: 6'),
        file('A different file', 'id,amount,currency\n1,100.00,USD\n2,100.00,EUR\n3,0.00,GBP\n5,7.00,USD', { 'raw.csv': 'id,amount,currency\n1,100,USD\n2,99.999,eur\n3,0.004,GBP\n1,5,USD\nx9,5,USD\n4,$1,000.5,USD\n5,7,USD\n' }, false),
        out('Rejected count for that file', 'Rejected: 3', { 'raw.csv': 'id,amount,currency\n1,100,USD\n2,99.999,eur\n3,0.004,GBP\n1,5,USD\nx9,5,USD\n4,$1,000.5,USD\n5,7,USD\n' }, false),
        file('Only a header', 'id,amount,currency', { 'raw.csv': 'id,amount,currency\n' }, false),
      ],
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'py-21-quality-report', objectiveId: 'py-obj-quality-report', title: 'Data Quality Report', mode: 'challenge', language: 'python', skillIds: ['de.cleaning', 'py.records', 'py.defensive'], concepts: ['data quality', 'missing values', 'duplicates', 'range check'], difficulty: 3, context: 'data analysis',
      prompt: text(
        'Before cleaning data you should measure how dirty it is. Write `quality_report(rows, low, high)`. Each row is a dictionary like `{"id": "a1", "value": 5.5}`. Return a dictionary with four counts:',
        '`"total"`: the number of rows.\n`"missing"`: rows whose `value` is `None` or an empty string.\n`"duplicates"`: rows that repeat an EARLIER row exactly (same `id` and same `value`).\n`"out_of_range"`: rows whose `value` is a number (int or float) below `low` or above `high`. Missing values and other non-numbers are not out of range.',
        'Each count is worked out over all rows independently.',
      ),
      expectedBehavior: 'quality_report([{"id": "a", "value": 5}, {"id": "a", "value": 5}, {"id": "b", "value": None}, {"id": "c", "value": 99}], 0, 10) returns {"total": 4, "missing": 1, "duplicates": 1, "out_of_range": 1}.',
      starterCode: '',
      hints: ['Four separate counters, all updated in one loop.', 'To spot duplicates you need to remember what you have already seen. A set of `(id, value)` pairs works.', 'Test for missing first; only test the range when the value is a number (`isinstance(v, (int, float))`).'],
      checks: calls('quality_report', [
        [[[{ id: 'a', value: 5 }, { id: 'a', value: 5 }, { id: 'b', value: null }, { id: 'c', value: 99 }], 0, 10], { total: 4, missing: 1, duplicates: 1, out_of_range: 1 }],
        [[[], 0, 10], { total: 0, missing: 0, duplicates: 0, out_of_range: 0 }],
        [[[{ id: 'x', value: '' }, { id: 'x', value: '' }], 0, 1], { total: 2, missing: 2, duplicates: 1, out_of_range: 0 }],
        [[[{ id: 'p', value: 0 }, { id: 'q', value: 10 }, { id: 'r', value: -0.1 }, { id: 's', value: 10.1 }], 0, 10], { total: 4, missing: 0, duplicates: 0, out_of_range: 2 }],
        [[[{ id: 'a', value: 1 }, { id: 'a', value: 2 }, { id: 'a', value: 1 }, { id: 'a', value: 1 }], 0, 5], { total: 4, missing: 0, duplicates: 2, out_of_range: 0 }],
        [[[{ id: 'z', value: 'n/a' }, { id: 'y', value: 50 }], 0, 10], { total: 2, missing: 0, duplicates: 0, out_of_range: 1 }],
      ], 2),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'py-21-stock-audit', objectiveId: 'py-obj-quality-report', title: 'Stock Audit', mode: 'challenge', language: 'python', skillIds: ['de.cleaning', 'py.records', 'py.defensive'], concepts: ['data quality', 'missing values', 'duplicates', 'range check'], difficulty: 3, context: 'logistics',
      prompt: text(
        'A warehouse system exports records like `{"sku": "A-1", "stock": 12}`. Write `audit(records)` that returns a dictionary with four counts:',
        '`"total"`: the number of records.\n`"missing_sku"`: records whose `sku` is `None` or an empty string.\n`"negative_stock"`: records whose `stock` is below 0.\n`"duplicate_sku"`: records whose `sku` already appeared in an EARLIER record. Records with a missing sku are never counted as duplicates.',
      ),
      expectedBehavior: 'audit([{"sku": "A", "stock": 1}, {"sku": "A", "stock": -2}, {"sku": None, "stock": 5}]) returns {"total": 3, "missing_sku": 1, "negative_stock": 1, "duplicate_sku": 1}.',
      starterCode: '',
      hints: ['Four counters again, updated in a single pass.', 'For duplicates, remember which skus you have seen, and skip records with no sku.', 'Check `sku` for missing first; only add real skus to the `seen` set.'],
      checks: calls('audit', [
        [[[{ sku: 'A', stock: 1 }, { sku: 'A', stock: -2 }, { sku: null, stock: 5 }]], { total: 3, missing_sku: 1, negative_stock: 1, duplicate_sku: 1 }],
        [[[]], { total: 0, missing_sku: 0, negative_stock: 0, duplicate_sku: 0 }],
        [[[{ sku: '', stock: 0 }, { sku: '', stock: -1 }, { sku: null, stock: 3 }]], { total: 3, missing_sku: 3, negative_stock: 1, duplicate_sku: 0 }],
        [[[{ sku: 'X', stock: 0 }, { sku: 'Y', stock: 0 }, { sku: 'X', stock: 0 }, { sku: 'X', stock: 0 }]], { total: 4, missing_sku: 0, negative_stock: 0, duplicate_sku: 2 }],
      ], 2),
      xpReward: 70, coinReward: 10,
    },
  ],
};
