import { text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const script = (name: string, code: string, visible = true): Check => ({ kind: 'script', name, code, visible });

/** Idempotency check shared by the two load variants: same file twice = same rows; changed rows are updated. */
const idem = (fn: string, table: string, key: string, a: string, b: string, exp: string): Check[] => [
  script('Loading the same file twice gives no duplicates', `import sqlite3\nopen('a.csv','w').write(${JSON.stringify(a)})\n${fn}('a.csv','t.db'); ${fn}('a.csv','t.db')\ncon = sqlite3.connect('t.db')\nn = con.execute('select count(*) from ${table}').fetchone()[0]\nassert n == 2, "After loading the same file twice there should still be 2 rows, not %d." % n`),
  script('A later file updates known rows and adds new ones', `import sqlite3\nopen('a.csv','w').write(${JSON.stringify(a)})\nopen('b.csv','w').write(${JSON.stringify(b)})\n${fn}('a.csv','t.db'); ${fn}('b.csv','t.db')\ncon = sqlite3.connect('t.db')\nrows = con.execute('select ${key}, ${exp.split('|')[0]} from ${table} order by ${key}').fetchall()\nassert rows == ${exp.split('|')[1]}, "A row that appears again should take its NEW value, and new rows should be added. Got %r." % (rows,)`, false),
  script('An empty file loads nothing and does not crash', `open('e.csv','w').write(${JSON.stringify(a.split('\n')[0] + '\n')})\n${fn}('e.csv','t.db')\nimport sqlite3\nassert sqlite3.connect('t.db').execute('select count(*) from ${table}').fetchone()[0] == 0, "An empty feed should leave the table empty (but existing)."`, false),
];

/** Resilience check: bad rows are rejected with a record, good rows are still loaded, nothing crashes. */
const resilient = (fn: string, table: string, feed: string, loaded: string, rejectedLines: string, expectResult: string, clean: string): Check[] => [
  script('Good rows load, bad rows are counted', `open('f.csv','w').write(${JSON.stringify(feed)})\nr = ${fn}('f.csv','t.db')\nassert tuple(r) == ${expectResult}, "The function should return (loaded, rejected). Got %r." % (r,)`),
  script('The good rows are in the table', `import sqlite3\nopen('f.csv','w').write(${JSON.stringify(feed)})\n${fn}('f.csv','t.db')\nids = [r[0] for r in sqlite3.connect('t.db').execute('select id from ${table} order by id')]\nassert ids == ${loaded}, "Only valid rows belong in ${table}. Got ids %r." % (ids,)`),
  script('Each rejected row is recorded with its position', `import sqlite3\nopen('f.csv','w').write(${JSON.stringify(feed)})\n${fn}('f.csv','t.db')\nrows = sqlite3.connect('t.db').execute('select line_no, reason from rejects order by line_no').fetchall()\nassert [r[0] for r in rows] == ${rejectedLines}, "The rejects table should hold one row per rejected data row (line_no counts data rows from 1). Got %r." % (rows,)\nassert all(r[1] for r in rows), "Every reject needs a reason."`, false),
  script('A clean file still creates an empty rejects table', `import sqlite3\nopen('g.csv','w').write(${JSON.stringify(clean)})\nr = ${fn}('g.csv','t2.db')\nassert r[1] == 0\nassert sqlite3.connect('t2.db').execute('select count(*) from rejects').fetchone()[0] == 0, "rejects must exist even when nothing was rejected."`, false),
];

const stage = (fn: string, staging: string, clean: string, feed: string, cleanIds: string, cleanVals: string, extraFeed: string, extraIds: string): Check[] => [
  script('Staging holds every row exactly as received', `import sqlite3\nopen('f.csv','w').write(${JSON.stringify(feed)})\n${fn}('f.csv','t.db')\ncon = sqlite3.connect('t.db')\nn = con.execute('select count(*) from ${staging}').fetchone()[0]\nassert n == ${feed.trim().split('\n').length - 1}, "The staging table should keep ALL rows, good and bad (found %d)." % n`),
  script('The clean table holds only valid rows, typed properly', `import sqlite3\nopen('f.csv','w').write(${JSON.stringify(feed)})\n${fn}('f.csv','t.db')\ncon = sqlite3.connect('t.db')\nrows = con.execute('select id, val from ${clean} order by id').fetchall()\nassert [r[0] for r in rows] == ${cleanIds}, "Wrong rows in ${clean}: %r" % (rows,)\nassert [r[1] for r in rows] == ${cleanVals}, "Values should be numbers, e.g. 7.0, not text: %r" % (rows,)\nassert all(isinstance(r[1], float) for r in rows), "The value column should hold real numbers."`),
  script('A second feed works the same way', `import sqlite3\nopen('h.csv','w').write(${JSON.stringify(extraFeed)})\n${fn}('h.csv','t3.db')\nrows = sqlite3.connect('t3.db').execute('select id from ${clean} order by id').fetchall()\nassert [r[0] for r in rows] == ${extraIds}, "Got %r." % (rows,)`, false),
];

const SENSOR_FEED = 'id,sensor,value\n1,S1,1.5\nx,S2,2\n3,,4\n4,S4,abc\n5,S5,5.5\n';
const SENSOR_CLEAN = 'id,sensor,value\n1,S1,1.5\n2,S2,2\n';
const PAY_FEED = 'id,payer,amount\n1,Ann,10\n2,Bob,-5\n3,,7\n4,Cy,x\nq,Di,3\n6,Ed,4.5\n';
const PAY_CLEAN = 'id,payer,amount\n1,Ann,10\n2,Bob,5\n';

const common = { language: 'python' as const, difficulty: 3 as const, project: true };

export const bundle: LessonBundle = {
  lesson: {
    id: 'de-01-pipelines', title: 'Pipelines That Do Not Break', language: 'python', skillId: 'de.pipelines',
    blurb: 'Ingest, validate, clean, load: how data moves reliably from a raw file into a database.', prerequisites: [], requires: [{ skill: 'py.functions' }, { skill: 'py.dicts' }, { skill: 'de.files' }, { skill: 'de.cleaning' }, { skill: 'sql.aggregate' }, { skill: 'db.design' }], xpReward: 70,
    reference: {
      title: 'Data pipelines',
      body: text(
        'A **pipeline** moves data from where it is produced to where it is used: **ingest** (read the raw source) → **validate** (does each record obey the rules?) → **clean** (fix what can be fixed) → **transform** (reshape) → **store** (load into a database) → **query/report**. Each stage exists because a different thing can go wrong.',
        '**ETL** transforms *before* loading; **ELT** loads the raw data first (a *staging* table) and transforms with SQL afterwards. ELT keeps the original so you can re-run a fixed transformation without asking the source again.',
        'Reliable pipelines are **idempotent** (running twice leaves the same result: use a key and `INSERT OR REPLACE` / upsert), **isolate failures** (one bad row is recorded in a `rejects` table and the run continues), and **leave a trail** (counts and logs of what happened).',
      ),
      example: 'con = sqlite3.connect(db_path)\ncon.execute("CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v REAL)")\ncon.execute("INSERT OR REPLACE INTO t VALUES (?, ?)", (1, 2.5))\ncon.commit()',
    },
    steps: [
      { kind: 'teach', title: 'Data does not arrive clean', body: text('Every night a factory sensor system drops a CSV file. Some rows are broken; the file arrives again tomorrow with updates; and the database must stay correct through all of it. A **pipeline** is the small, dependable program that handles this. What matters is not that it works once, but that it keeps working on bad days.') },
      {
        kind: 'demo', title: 'Load a file into a database', language: 'python', fixtures: { files: { 'feed.csv': 'id,sensor,value\n1,S1,1.5\n2,S2,2.5\n' } },
        body: text('Read the CSV, create a table, insert rows with `?` placeholders (never build SQL by gluing strings), then commit.'),
        code: "import csv, sqlite3\n\ncon = sqlite3.connect('plant.db')\ncon.execute('CREATE TABLE IF NOT EXISTS readings (id INTEGER PRIMARY KEY, sensor TEXT, value REAL)')\nwith open('feed.csv', newline='') as f:\n    for row in csv.DictReader(f):\n        con.execute('INSERT INTO readings VALUES (?, ?, ?)', (int(row['id']), row['sensor'], float(row['value'])))\ncon.commit()\nprint(con.execute('SELECT COUNT(*) FROM readings').fetchone()[0], 'rows loaded')",
        notice: 'It works once. Run it a second time and it would crash: the primary key `1` already exists. A pipeline that only works the first time is a bug waiting for tomorrow night.',
      },
      { kind: 'challenge', challengeId: 'de-01-load-readings' },
      { kind: 'challenge', challengeId: 'de-01-idempotent-readings' },
      { kind: 'challenge', challengeId: 'de-01-resilient-readings' },
      { kind: 'challenge', challengeId: 'de-01-elt-readings' },
    ],
  },
  objectives: [
    { id: 'de-obj-idempotent', title: 'Make a load safe to repeat', summary: 'Design a load so running it again (with the same or updated data) leaves a correct table.' },
    { id: 'de-obj-resilient', title: 'Isolate bad rows and keep going', summary: 'Validate each row, record rejects with reasons, and never let one bad row stop the run.' },
    { id: 'de-obj-elt', title: 'Stage raw data, then transform with SQL', summary: 'Keep an untouched staging copy of a feed and derive a typed, clean table from it.' },
  ],
  challenges: [
    {
      id: 'de-01-load-readings', title: 'Nightly Sensor Load', mode: 'learning', language: 'python', skillIds: ['de.pipelines', 'de.files', 'de.integration'], concepts: ['csv', 'sqlite3', 'placeholders', 'commit'], difficulty: 2, context: 'manufacturing',
      prompt: text('Write `load_readings(csv_path, db_path)`. It reads a CSV with header `id,sensor,value` and stores every row in a table `readings` (columns `id` INTEGER PRIMARY KEY, `sensor` TEXT, `value` REAL) inside the SQLite file at `db_path`. Create the table if it is not there yet.'),
      expectedBehavior: 'After the call, the readings table contains one row per CSV row, with numeric ids and values.',
      guidedSteps: ['Connect with `sqlite3.connect(db_path)`.', '`CREATE TABLE IF NOT EXISTS readings (...)`.', 'Loop over `csv.DictReader`, converting `id` to int and `value` to float.', 'Insert with `?` placeholders, then `commit()`.'],
      starterCode: 'import csv, sqlite3\n\ndef load_readings(csv_path, db_path):\n    pass\n',
      hints: ['Three jobs: open the database, make sure the table exists, copy the rows in.', 'Numbers arrive from CSV as text, so convert them before storing.', 'Remember `commit()`: without it nothing is saved.'],
      checks: [
        script('Every row is stored, typed correctly', "import sqlite3\nopen('a.csv','w').write('id,sensor,value\\n1,S1,1.5\\n2,S2,2.5\\n')\nload_readings('a.csv','t.db')\nrows = sqlite3.connect('t.db').execute('select id, sensor, value from readings order by id').fetchall()\nassert rows == [(1,'S1',1.5),(2,'S2',2.5)], 'The table should hold both rows with numeric id and value, got %r.' % (rows,)"),
        script('Works on a different file', "import sqlite3\nopen('b.csv','w').write('id,sensor,value\\n7,Zed,0\\n')\nload_readings('b.csv','t.db')\nrows = sqlite3.connect('t.db').execute('select id, value from readings').fetchall()\nassert rows == [(7, 0.0)], 'Got %r.' % (rows,)", false),
      ],
      xpReward: 60, coinReward: 8,
    },
    {
      id: 'de-01-idempotent-readings', objectiveId: 'de-obj-idempotent', title: 'Run It Again Tomorrow', mode: 'challenge', skillIds: ['de.pipelines', 'db.integrity'], concepts: ['idempotent', 'primary key', 'upsert', 'sqlite3'], context: 'manufacturing', ...common,
      prompt: text('The sensor feed is re-sent every night, and it sometimes contains corrected values for readings you already have. Write `load_readings(csv_path, db_path)` for a CSV with header `id,sensor,value` that stores rows in a table `readings` (`id` INTEGER PRIMARY KEY, `sensor`, `value` REAL).', 'It must be **safe to run again**: loading the same file twice must not create duplicates, and a reading that appears in a later file must take its newest value.'),
      expectedBehavior: 'Repeated loads leave one row per id, holding the latest values.',
      starterCode: '',
      hints: ['What identifies a reading? What should happen when a row with that identity already exists?', 'The database can enforce uniqueness for you; then decide what an already-known row should do.', 'A statement that inserts OR replaces on a key conflict is the tool to look up.'],
      checks: idem('load_readings', 'readings', 'id', 'id,sensor,value\n1,S1,1.5\n2,S2,2.5\n', 'id,sensor,value\n2,S2,9.5\n3,S3,3.5\n', 'value|[(1, 1.5), (2, 9.5), (3, 3.5)]'),
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'de-01-idempotent-orders', objectiveId: 'de-obj-idempotent', title: 'Re-sent Order Export', mode: 'challenge', skillIds: ['de.pipelines', 'db.integrity'], concepts: ['idempotent', 'primary key', 'upsert', 'sqlite3'], context: 'retail', ...common,
      prompt: text('A shop’s web system exports its orders every night, including orders already sent before (some with changed totals after refunds). Write `load_orders(csv_path, db_path)` for a CSV with header `order_id,customer,total` that stores rows in a table `orders` (`order_id` INTEGER PRIMARY KEY, `customer`, `total` REAL).', 'Running it repeatedly must never create duplicate orders, and an order that appears again must show its newest total.'),
      expectedBehavior: 'Repeated loads leave one row per order_id, holding the latest totals.',
      starterCode: '',
      hints: ['Think about what a second night’s file will contain that the first did not.', 'A key plus a rule for “already exists” makes a load repeatable.', 'Look up how SQLite replaces a row when the key already exists.'],
      checks: idem('load_orders', 'orders', 'order_id', 'order_id,customer,total\n10,Ann,20.5\n11,Bo,8\n', 'order_id,customer,total\n11,Bo,6.5\n12,Cy,30\n', 'total|[(10, 20.5), (11, 6.5), (12, 30.0)]'),
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'de-01-resilient-readings', objectiveId: 'de-obj-resilient', title: 'The Feed With Bad Rows', mode: 'challenge', skillIds: ['de.pipelines', 'de.cleaning'], concepts: ['validation', 'rejects', 'failure isolation', 'sqlite3'], context: 'manufacturing', ...common,
      prompt: text('Write `load_readings(csv_path, db_path)` for a CSV with header `id,sensor,value`. A row is **valid** if `id` is only digits, `sensor` is not blank, and `value` is a number. Store valid rows in `readings` (`id` INTEGER PRIMARY KEY, `sensor`, `value` REAL).', 'Invalid rows must not stop the run. Record each one in a table `rejects` with columns `line_no` (its position among the data rows, starting at 1) and `reason` (any text). Return `(loaded, rejected)`. The `rejects` table must exist even if nothing was rejected.'),
      expectedBehavior: 'Valid rows are stored, every invalid row is recorded with a reason, and the function returns the two counts.',
      starterCode: '',
      hints: ['Handle each row on its own so a failure only affects that row.', 'Decide the checks in order; the first failing one gives the reason.', 'A `try/except ValueError` around the conversions is a natural way to detect non-numbers.'],
      checks: resilient('load_readings', 'readings', SENSOR_FEED, '[1, 5]', '[2, 3, 4]', '(2, 3)', SENSOR_CLEAN),
      xpReward: 110, coinReward: 16,
    },
    {
      id: 'de-01-resilient-payments', objectiveId: 'de-obj-resilient', title: 'The Payment Export', mode: 'challenge', skillIds: ['de.pipelines', 'de.cleaning'], concepts: ['validation', 'rejects', 'failure isolation', 'sqlite3'], context: 'finance', ...common,
      prompt: text('Write `load_payments(csv_path, db_path)` for a CSV with header `id,payer,amount`. A row is **valid** if `id` is only digits, `payer` is not blank, and `amount` is a number **greater than zero**. Store valid rows in `payments` (`id` INTEGER PRIMARY KEY, `payer`, `amount` REAL).', 'Invalid rows must not stop the run. Record each in a table `rejects` with `line_no` (position among the data rows, from 1) and `reason`. Return `(loaded, rejected)`. `rejects` must exist even if empty.'),
      expectedBehavior: 'Valid rows are stored, every invalid row is recorded with a reason, and the function returns the two counts.',
      starterCode: '',
      hints: ['One bad row should never cost you the good ones.', 'Check each rule in turn and keep the first reason that fails.', 'Remember the amount must be positive, not just numeric.'],
      checks: [...resilient('load_payments', 'payments', PAY_FEED, '[1, 6]', '[2, 3, 4, 5]', '(2, 4)', PAY_CLEAN), script('A payment of exactly zero is rejected', "open('z.csv','w').write('id,payer,amount\\n1,Ann,0\\n2,Bob,0.5\\n')\nr = load_payments('z.csv','t.db')\nassert tuple(r) == (1, 1), 'Zero is not greater than zero. Got %r.' % (r,)", false)],
      xpReward: 110, coinReward: 16,
    },
    {
      id: 'de-01-elt-readings', objectiveId: 'de-obj-elt', title: 'Stage First, Clean With SQL', mode: 'challenge', skillIds: ['de.pipelines', 'sql.modify'], concepts: ['ELT', 'staging table', 'INSERT SELECT', 'CAST'], context: 'manufacturing', ...common,
      prompt: text('Write `run_elt(csv_path, db_path)` for a CSV with header `id,sensor,val`.', 'First keep an **untouched copy of the feed**: a table `staging` with three TEXT columns `id`, `sensor`, `val` holding every row exactly as received. Then, **using SQL**, build a table `clean` (`id` INTEGER, `sensor` TEXT, `val` REAL) holding only rows where the sensor is not blank and `val` is a non-negative decimal number such as `7` or `1.5`.'),
      expectedBehavior: 'staging keeps every row as text; clean holds only the valid rows with real-number values.',
      starterCode: '',
      hints: ['Two tables: one is a faithful copy, the other is the result of rules.', 'Load the raw rows first without judging them; do the filtering in a second step.', 'A statement that inserts the result of a query, with `CAST(... AS REAL)`, does the second step.'],
      checks: stage('run_elt', 'staging', 'clean', 'id,sensor,val\n1,S1,1.5\n2,S2,abc\n3,,4\n4,S4,7\n', '[1, 4]', '[1.5, 7.0]', 'id,sensor,val\n9,A,0\n8,B,\n', '[9]'),
      xpReward: 120, coinReward: 18,
    },
    {
      id: 'de-01-elt-stock', objectiveId: 'de-obj-elt', title: 'Warehouse Stock Feed', mode: 'challenge', skillIds: ['de.pipelines', 'sql.modify'], concepts: ['ELT', 'staging table', 'INSERT SELECT', 'CAST'], context: 'logistics', ...common,
      prompt: text('Write `run_elt(csv_path, db_path)` for a CSV with header `id,item,val` (`val` is a stock quantity).', 'Keep an **untouched copy of the feed** in a table `staging` (TEXT columns `id`, `item`, `val`, every row exactly as received). Then, **using SQL**, build `clean` (`id` INTEGER, `item` TEXT, `val` REAL) holding only rows where the item is not blank and `val` is a non-negative decimal number.'),
      expectedBehavior: 'staging keeps every row as text; clean holds only the valid rows with real-number values.',
      starterCode: '',
      hints: ['Keep the raw copy and the cleaned copy as separate steps.', 'Do not filter while loading; filter with a query afterwards.', 'Check numbers with a pattern or a cast, and insert the query’s result into the clean table.'],
      checks: stage('run_elt', 'staging', 'clean', 'id,item,val\n1,bolt,40\n2,nut,-3\n3,,5\n4,gear,2.5\n5,cog,n/a\n', '[1, 4]', '[40.0, 2.5]', 'id,item,val\n7,pin,3\n8,pin,3kg\n', '[7]'),
      xpReward: 120, coinReward: 18,
    },
  ],
};
