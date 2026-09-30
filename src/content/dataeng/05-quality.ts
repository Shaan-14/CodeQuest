import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { common, csvRefs } from './kit';

const PROFILE_REF = "import csv\ndef _ref(path):\n    with open(path, newline='') as f:\n        r = csv.DictReader(f)\n        cols = r.fieldnames or []\n        missing = {c: 0 for c in cols}\n        n = 0\n        for row in r:\n            n += 1\n            for c in cols:\n                v = row.get(c)\n                if v is None or not v.strip():\n                    missing[c] += 1\n    return {'rows': n, 'missing': missing}\n";

const INV_REF = "import csv\ndef _ref(path):\n    with open(path, newline='') as f:\n        r = csv.DictReader(f)\n        cols = r.fieldnames or []\n        missing = {c: 0 for c in cols}\n        n = 0\n        seen = {}\n        flagged = 0\n        for row in r:\n            n += 1\n            for c in cols:\n                v = row.get(c)\n                if v is None or not v.strip():\n                    missing[c] += 1\n            k = (row.get('sku') or '').strip()\n            if k:\n                seen[k] = seen.get(k, 0) + 1\n            try:\n                if float(row.get('qty') or '') < 0:\n                    flagged += 1\n            except ValueError:\n                pass\n    return {'rows': n, 'missing': missing, 'duplicate_keys': sorted(k for k, c in seen.items() if c > 1), 'flagged': flagged}\n";

const VISIT_REF = "import csv\ndef _ref(path):\n    with open(path, newline='') as f:\n        r = csv.DictReader(f)\n        cols = r.fieldnames or []\n        missing = {c: 0 for c in cols}\n        n = 0\n        seen = {}\n        flagged = 0\n        for row in r:\n            n += 1\n            for c in cols:\n                v = row.get(c)\n                if v is None or not v.strip():\n                    missing[c] += 1\n            k = (row.get('visit_id') or '').strip()\n            if k:\n                seen[k] = seen.get(k, 0) + 1\n            try:\n                if float(row.get('minutes') or '') > 240:\n                    flagged += 1\n            except ValueError:\n                pass\n    return {'rows': n, 'missing': missing, 'duplicate_keys': sorted(k for k, c in seen.items() if c > 1), 'flagged': flagged}\n";

export const bundle: LessonBundle = {
  lesson: {
    id: 'de-05-quality', title: 'How Good Is This Data?', language: 'python', skillId: 'de.quality',
    blurb: 'Measure a file before trusting it: missing values, duplicate keys and suspicious numbers, in a report a person can act on.', prerequisites: ['de-04-validation'], xpReward: 80,
    reference: {
      title: 'Data quality reports',
      body: text(
        'A **quality report** answers "can I use this?" with numbers: how many rows, how many **missing** values per column, which **keys are duplicated**, and how many rows break a **business rule** (a negative quantity, an impossible duration). Measure first; decide (clean, reject or escalate) afterwards.',
        'Building blocks: `csv.DictReader` (`.fieldnames` gives the header), a dict of counters (`{c: 0 for c in cols}`), a second dict to count key occurrences (`d[k] = d.get(k, 0) + 1`), `str.strip()` so whitespace-only cells count as blank.',
        'Be defensive about *shape*: a short row gives `None` for its missing cells with `DictReader`; a number column may hold text, so wrap conversions in `try/except ValueError` and decide explicitly what unreadable values mean for each measure.',
      ),
      example: 'counts = {}\nfor row in rows:\n    k = row["id"].strip()\n    counts[k] = counts.get(k, 0) + 1\nduplicates = sorted(k for k, n in counts.items() if n > 1)',
    },
    steps: [
      { kind: 'teach', title: 'Measure before you clean', body: text('Cleaning without measuring is guessing. A quality report tells you *what kind* of dirt there is and how much, so you can decide whether to fix, reject or go back to the source. The same few measures apply to almost every dataset: **completeness** (missing values), **uniqueness** (duplicate keys) and **validity** (values that break a rule).') },
      {
        kind: 'demo', title: 'Count blanks and repeats', language: 'python', fixtures: { files: { 'crew.csv': 'id,name,shift\n1,Ana,day\n2,,night\n2,Bo,\n3,  ,day\n' } },
        body: text('Profile a small file: how many rows, how many blanks per column, which ids repeat.'),
        code: "import csv\n\nwith open('crew.csv', newline='') as f:\n    reader = csv.DictReader(f)\n    cols = reader.fieldnames\n    blanks = {c: 0 for c in cols}\n    ids = {}\n    rows = 0\n    for row in reader:\n        rows += 1\n        for c in cols:\n            if not row[c].strip():\n                blanks[c] += 1\n        ids[row['id']] = ids.get(row['id'], 0) + 1\nprint(rows, blanks)\nprint(sorted(k for k, n in ids.items() if n > 1))",
        notice: 'The name `"  "` (only spaces) counted as blank because of `.strip()`. Without it, the report would say the data is more complete than it really is.',
      },
      { kind: 'challenge', challengeId: 'de-05-profile-feed' },
      { kind: 'challenge', challengeId: 'de-05-audit-inventory' },
    ],
  },
  objectives: [
    { id: 'de-obj-quality-report', title: 'Write a data quality report', summary: 'Count rows, missing values per column and duplicate keys, and flag rows that break a business rule.' },
  ],
  challenges: [
    {
      id: 'de-05-profile-feed', title: 'Profile a Delivery Feed', mode: 'learning', language: 'python', skillIds: ['de.quality', 'de.files'], concepts: ['csv', 'data-profiling', 'DictReader'], difficulty: 2, context: 'logistics',
      prompt: text('A courier company sends CSV feeds with a header row. Write `profile(path)` returning a dictionary with two entries: `"rows"`, the number of data rows, and `"missing"`, a dictionary mapping **every column name in the header** to the number of rows where that cell is blank (empty, only spaces, or absent because the row is short).'),
      expectedBehavior: 'profile("f.csv") gives {"rows": n, "missing": {column: count, ...}} with a zero for columns that are always filled.',
      guidedSteps: ['Open the file with `newline=""` and read it with `csv.DictReader`.', 'Start a counter for every name in `reader.fieldnames`.', 'For each row, use `.get(column)`: `None` (short row) or `.strip() == ""` both count as blank.', 'Return the two entries.'],
      starterCode: 'import csv\n\ndef profile(path):\n    pass\n',
      hints: ['You need one counter per column, created before you read any rows.', 'A cell can be blank in three ways: empty, only spaces, or not there at all.', '`row.get(col)` returns `None` for a short row; guard for that before calling `.strip()`.'],
      checks: csvRefs('profile', PROFILE_REF, [
        { name: 'A small feed', csv: 'id,driver,minutes\n1,Ann,12\n2,,30\n3,Cy,\n' },
        { name: 'Spaces count as blank', csv: 'id,driver,minutes\n1,  ,12\n2,Bo,   \n' },
        { name: 'A feed with no missing values', csv: 'a,b\n1,2\n3,4\n', visible: false },
        { name: 'Only a header', csv: 'a,b,c\n', visible: false },
        { name: 'Short rows', csv: 'a,b,c\n1,2\n3\n4,5,6\n', visible: false },
        { name: 'Every cell blank', csv: 'x,y\n,\n , \n', visible: false },
      ], 'Check the counts against the file.'),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'de-05-audit-inventory', objectiveId: 'de-obj-quality-report', title: 'Audit a Stock File', mode: 'challenge', skillIds: ['de.quality', 'de.files'], concepts: ['csv', 'data-profiling', 'duplicates'], difficulty: 3, context: 'retail', ...common,
      prompt: text('A warehouse exports `sku,qty,price` rows. Write `audit_inventory(path)` returning a dictionary with four entries:', '`"rows"`: the number of data rows.', '`"missing"`: every header column mapped to how many rows have a blank cell there (empty, only spaces, or absent from a short row).', '`"duplicate_keys"`: an alphabetically sorted list of the `sku` values (spaces trimmed) that appear on more than one row; blank skus are not keys.', '`"flagged"`: how many rows have a `qty` that is a number below zero. A `qty` that is blank or not a number is not flagged.'),
      expectedBehavior: 'A dictionary with rows, missing, duplicate_keys and flagged, computed from the file.',
      starterCode: '',
      hints: ['Four separate measurements over one pass through the rows.', 'Count key occurrences in a dictionary, then keep those seen more than once, sorted.', 'Converting `qty` can fail: decide what an unreadable value should mean for this measure.'],
      checks: csvRefs('audit_inventory', INV_REF, [
        { name: 'A typical file', csv: 'sku,qty,price\nA1,5,2.5\nB2,-3,1\nA1,2,2.5\nC3,,9\n' },
        { name: 'Spaces, blanks and text quantities', csv: 'sku,qty,price\nB2,1,1\n A1 ,x,3\nA1,-1,\n  ,-2,4\n,5,4\nB2, ,1\nB2,7,1\n', visible: false },
        { name: 'No problems at all', csv: 'sku,qty,price\nA,1,1\nB,0,2\nC,4,3\n', visible: false },
        { name: 'Only a header', csv: 'sku,qty,price\n', visible: false },
        { name: 'Short rows and zero', csv: 'sku,qty,price\nA,0\nA\nB,-0.5,1\n', visible: false },
      ], 'Check each of the four measures against the file.'),
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'de-05-audit-visits', objectiveId: 'de-obj-quality-report', title: 'Audit a Clinic Visit Log', mode: 'challenge', skillIds: ['de.quality', 'de.files'], concepts: ['csv', 'data-profiling', 'duplicates'], difficulty: 3, context: 'healthcare', ...common,
      prompt: text('A clinic logs `visit_id,patient,minutes` rows. Write `audit_visits(path)` returning a dictionary with four entries:', '`"rows"`: the number of data rows.', '`"missing"`: every header column mapped to how many rows have a blank cell there (empty, only spaces, or absent from a short row).', '`"duplicate_keys"`: an alphabetically sorted list of the `visit_id` values (spaces trimmed) that appear on more than one row; blank ids are not keys.', '`"flagged"`: how many rows have `minutes` that is a number **above 240**. A blank or non-numeric value is not flagged.'),
      expectedBehavior: 'A dictionary with rows, missing, duplicate_keys and flagged, computed from the file.',
      starterCode: '',
      hints: ['Four separate measurements over one pass through the rows.', 'Count key occurrences in a dictionary, then keep those seen more than once, sorted.', 'A number column can hold text: decide what an unreadable value means for this measure.'],
      checks: csvRefs('audit_visits', VISIT_REF, [
        { name: 'A typical log', csv: 'visit_id,patient,minutes\nV1,Ann,30\nV2,Bo,300\nV1,Cy,45\nV3,,\n' },
        { name: 'Spaces, blanks and text', csv: 'visit_id,patient,minutes\nV2,Zed,5\n V1 ,Ann,abc\nV1,,241\n  ,Bo,999\n,Cy,3\nV2, ,   \nV2,Di,240\n', visible: false },
        { name: 'No problems at all', csv: 'visit_id,patient,minutes\nA,x,1\nB,y,2\nC,z,240\n', visible: false },
        { name: 'Only a header', csv: 'visit_id,patient,minutes\n', visible: false },
        { name: 'Short rows and the boundary', csv: 'visit_id,patient,minutes\nA,x\nA\nB,y,240.5\nC,z,240\n', visible: false },
      ], 'Check each of the four measures against the file.'),
      xpReward: 100, coinReward: 15,
    },
  ],
};
