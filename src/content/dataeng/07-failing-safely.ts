import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { common, script } from './kit';

const FLAKY = "class Flaky:\n    def __init__(self, fails, exc=ConnectionError):\n        self.n = 0\n        self.fails = fails\n        self.exc = exc\n    def __call__(self):\n        self.n += 1\n        if self.n <= self.fails:\n            raise self.exc('fail %d' % self.n)\n        return 'ok'\n";

/** Reference of a load-with-quarantine check: same steps, different table and reasons per variant. */
const loadChecks = (fn: string, table: string, cols: string, header: string, feed: string, rows: string, rejects: string, clean: string, cleanRows: string, extra: string, extraRows: string, extraRejects: string): ReturnType<typeof script>[] => [
  script('Good rows are loaded, bad rows are quarantined with a reason', `import csv, sqlite3\nopen('f.csv','w').write(${JSON.stringify(feed)})\nn = ${fn}('f.csv', 't.db', 'rej.csv')\ngot = sqlite3.connect('t.db').execute('select ${cols} from ${table} order by id').fetchall()\nassert got == ${rows}, 'Wrong rows stored: %r' % (got,)\nassert n == len(got), 'Return how many rows were loaded.'\nrej = list(csv.reader(open('rej.csv', newline='')))\nassert rej == ${rejects}, 'The reject file should hold the header line,reason then one row per rejected data row. Got %r.' % (rej,)`),
  script('Running the same file again changes nothing', `import csv, sqlite3\nopen('f.csv','w').write(${JSON.stringify(feed)})\n${fn}('f.csv', 't.db', 'rej.csv'); ${fn}('f.csv', 't.db', 'rej.csv')\ngot = sqlite3.connect('t.db').execute('select ${cols} from ${table} order by id').fetchall()\nassert got == ${rows}, 'A second run must leave the same rows, not duplicates or a crash.'\nrej = list(csv.reader(open('rej.csv', newline='')))\nassert rej == ${rejects}, 'The reject file describes THIS run: it must not grow when the same file is loaded again.'`, false),
  script('A clean feed still leaves a reject file with just its header', `import csv, sqlite3\nopen('c.csv','w').write(${JSON.stringify(clean)})\nn = ${fn}('c.csv', 't2.db', 'rej2.csv')\nassert sqlite3.connect('t2.db').execute('select ${cols} from ${table} order by id').fetchall() == ${cleanRows}\nassert list(csv.reader(open('rej2.csv', newline=''))) == [['line', 'reason']], 'Even with nothing rejected the reject file should exist with its header.'`, false),
  script('A later file updates known rows and a new feed is judged on its own', `import csv, sqlite3\nopen('f.csv','w').write(${JSON.stringify(feed)})\nopen('g.csv','w').write(${JSON.stringify(extra)})\n${fn}('f.csv', 't.db', 'rej.csv'); ${fn}('g.csv', 't.db', 'rej.csv')\ngot = sqlite3.connect('t.db').execute('select ${cols} from ${table} order by id').fetchall()\nassert got == ${extraRows}, 'The newer file should update rows with the same id and add new ones. Got %r.' % (got,)\nassert list(csv.reader(open('rej.csv', newline=''))) == ${extraRejects}, 'The reject file now describes the second file.'`, false),
  script('Only a header', `import csv, sqlite3\nopen('e.csv','w').write(${JSON.stringify(header + '\n')})\nassert ${fn}('e.csv', 't3.db', 'rej3.csv') == 0\nassert sqlite3.connect('t3.db').execute('select count(*) from ${table}').fetchone()[0] == 0\nassert list(csv.reader(open('rej3.csv', newline=''))) == [['line', 'reason']]`, false),
];

export const bundle: LessonBundle = {
  lesson: {
    id: 'de-07-failing-safely', title: 'Failing Safely: Retries & Quarantine', language: 'python', skillId: 'de.observability',
    blurb: 'Some failures are worth retrying; some rows are worth setting aside. Tell them apart, and never lose data silently.', prerequisites: ['de-06-logging'], xpReward: 90,
    reference: {
      title: 'Failing safely',
      body: text(
        '**Transient** failures (a dropped connection, a timeout) often succeed if you try again: **retry a limited number of times**, then raise the *last* error so the caller knows. **Permanent** failures (a `ValueError` from bad data, a bug) will never succeed: retrying only hides them and wastes time, so catch **only the exceptions you expect** (`except (ConnectionError, TimeoutError)`), never a bare `except:`.',
        'For **bad rows**, do not drop them silently and do not let one crash the whole run: **quarantine** them, i.e. write each to a *reject file* with its position and the reason, keep loading the rest, and report the counts. Whoever owns the source can then fix and resend.',
        'Make runs **repeatable**: load with a primary key and `INSERT OR REPLACE`, and rewrite the reject file for each run so it describes *this* run. Group related writes in one transaction (`with con:` commits on success and rolls back on an exception) so a failure cannot leave half a batch behind.',
      ),
      example: 'for attempt in range(attempts):\n    try:\n        return fn()\n    except (ConnectionError, TimeoutError) as e:\n        last = e\nraise last',
    },
    steps: [
      { kind: 'teach', title: 'Not every failure is the same', body: text('When something goes wrong in a pipeline there are three honest responses: **try again** (it was probably temporary), **set it aside** (this one row is bad, the rest are fine), or **stop and shout** (something is wrong with the whole job). The skill is choosing correctly, and never a fourth response: pretending nothing happened.') },
      {
        kind: 'demo', title: 'A transaction that protects a batch', language: 'python',
        body: text('`with con:` commits when the block ends normally and **rolls back** if it raises. Watch what is left after the failure.'),
        code: "import sqlite3\n\ncon = sqlite3.connect(':memory:')\ncon.execute('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT NOT NULL)')\ntry:\n    with con:\n        con.execute(\"INSERT INTO t VALUES (1, 'a')\")\n        con.execute('INSERT INTO t VALUES (2, NULL)')  # violates NOT NULL\nexcept sqlite3.IntegrityError as e:\n    print('failed:', e)\nprint(con.execute('SELECT COUNT(*) FROM t').fetchone()[0], 'rows stored')",
        notice: 'Row 1 was fine, yet nothing was stored: the whole block rolled back. That is what "all or nothing" buys you.',
      },
      { kind: 'challenge', challengeId: 'de-07-retry' },
      { kind: 'challenge', challengeId: 'de-07-load-payments' },
    ],
  },
  objectives: [
    { id: 'de-obj-safe-load', title: 'Load with quarantine and repeatability', summary: 'Load valid rows, write every rejected row to a reject file with its position and reason, and stay safe to run again.' },
  ],
  challenges: [
    {
      id: 'de-07-retry', title: 'Retry a Flaky Call', mode: 'learning', language: 'python', skillIds: ['de.observability', 'py.defensive'], concepts: ['retry', 'exceptions', 'transient-failure'], difficulty: 3, context: 'operations', project: true,
      prompt: text('A job calls an unreliable service. Write `call_with_retry(fn, attempts)` that calls `fn()` (no arguments) and returns its result. If the call raises `ConnectionError` or `TimeoutError` it is **retried**, up to `attempts` calls in total. If every attempt fails, **raise the last exception**.', 'Any other kind of exception (a bug, bad data) is **not** a transient failure: let it propagate immediately, without retrying. `attempts` is at least 1.'),
      expectedBehavior: 'Returns the first successful result; retries only ConnectionError/TimeoutError, at most `attempts` calls; re-raises the final failure.',
      guidedSteps: ['Loop `attempts` times; inside, `try` to `return fn()`.', 'Catch only `(ConnectionError, TimeoutError)` and remember the exception.', 'After the loop, `raise` the remembered exception.'],
      starterCode: 'def call_with_retry(fn, attempts):\n    pass\n',
      hints: ['How many calls are allowed in total, and what should the loop do after a failure?', 'Which exceptions deserve another go? Naming them is safer than catching everything.', 'When all attempts fail, the caller needs the real error, not `None`.'],
      checks: [
        script('Succeeds on the first call', `${FLAKY}f = Flaky(0)\nassert call_with_retry(f, 3) == 'ok' and f.n == 1, 'A first-try success should call fn once.'`),
        script('Retries after transient failures', `${FLAKY}f = Flaky(2)\nassert call_with_retry(f, 3) == 'ok', 'Two failures then success fits within three attempts.'\nassert f.n == 3\ng = Flaky(1, TimeoutError)\nassert call_with_retry(g, 2) == 'ok' and g.n == 2`, false),
        script('Gives up after exactly `attempts` calls and raises the last error', `${FLAKY}f = Flaky(9)\ntry:\n    call_with_retry(f, 3)\n    raise SystemExit('should have raised')\nexcept ConnectionError as e:\n    assert str(e) == 'fail 3', 'Raise the LAST exception, got %r.' % (str(e),)\nassert f.n == 3, 'Exactly 3 calls expected, got %d.' % f.n\ng = Flaky(9, TimeoutError)\ntry:\n    call_with_retry(g, 1)\n    raise SystemExit('should have raised')\nexcept TimeoutError:\n    pass\nassert g.n == 1`, false),
        script('Other exceptions are not retried', `${FLAKY}f = Flaky(5, ValueError)\ntry:\n    call_with_retry(f, 4)\n    raise SystemExit('should have raised')\nexcept ValueError:\n    pass\nassert f.n == 1, 'A ValueError is not transient: it must not be retried (fn was called %d times).' % f.n`, false),
      ],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'de-07-load-payments', objectiveId: 'de-obj-safe-load', title: 'Quarantine Bad Payments', mode: 'challenge', skillIds: ['de.observability', 'de.pipelines', 'db.integrity'], concepts: ['quarantine', 'idempotent', 'csv', 'reject-file'], difficulty: 4, context: 'finance', ...common,
      prompt: text('A payments feed `id,payer,amount` arrives nightly. Write `load_payments(csv_path, db_path, reject_path)` that stores good rows in a table `payments` (`id` INTEGER primary key, `payer` TEXT, `amount` REAL) and returns how many rows were loaded.', 'A row is **rejected** when its `id` is not a whole number above zero (`bad-id`), its `payer` is blank (`blank-payer`) or its `amount` is not a finite number above zero (`bad-amount`). If several things are wrong, report the **first** in that order. Spaces around fields do not matter.', 'Write every rejected row to `reject_path` as a CSV with the header `line,reason`, where `line` is the row number among the data rows, counting from 1. The reject file describes **this run only** (it is rewritten each time), and it exists even when nothing was rejected.', 'Running the same file again must not duplicate anything or crash, and a newer file updates rows that share an `id`.'),
      expectedBehavior: 'Good rows in the table, one reject row per bad row, repeat-safe.',
      starterCode: '',
      hints: ['Three separate outcomes for each row: loaded, rejected, and never lost. Where does each one go?', 'What has to be true of the table for a second run to be harmless? And of the reject file?', 'Decide the order of the rejection tests first; the reason you record depends on it.'],
      checks: loadChecks('load_payments', 'payments', 'id, payer, amount', 'id,payer,amount', 'id,payer,amount\n1,Ann,10.5\nx,Bo,5\n3,,7\n4,Cy,-2\n5,Di,abc\n6, Ed ,3\n0,Flo,1\n7,Gus,nan\n8,,abc\n', "[(1, 'Ann', 10.5), (6, 'Ed', 3.0)]", "[['line', 'reason'], ['2', 'bad-id'], ['3', 'blank-payer'], ['4', 'bad-amount'], ['5', 'bad-amount'], ['7', 'bad-id'], ['8', 'bad-amount'], ['9', 'blank-payer']]", 'id,payer,amount\n1,Ann,1\n2,Bo,2\n', "[(1, 'Ann', 1.0), (2, 'Bo', 2.0)]", 'id,payer,amount\n1,Ann,99\n9,Zed,4\n2.5,Yan,1\n', "[(1, 'Ann', 99.0), (6, 'Ed', 3.0), (9, 'Zed', 4.0)]", "[['line', 'reason'], ['3', 'bad-id']]"),
      xpReward: 120, coinReward: 18,
    },
    {
      id: 'de-07-load-shipments', objectiveId: 'de-obj-safe-load', title: 'Quarantine Bad Shipments', mode: 'challenge', skillIds: ['de.observability', 'de.pipelines', 'db.integrity'], concepts: ['quarantine', 'idempotent', 'csv', 'reject-file'], difficulty: 4, context: 'logistics', ...common,
      prompt: text('A depot receives `id,dest,kg` rows every night. Write `load_shipments(csv_path, db_path, reject_path)` that stores good rows in a table `shipments` (`id` INTEGER primary key, `dest` TEXT, `kg` REAL) and returns how many rows were loaded.', 'A row is **rejected** when its `id` is not a whole number above zero (`bad-id`), its `dest` is blank (`blank-dest`) or its `kg` is not a finite number above zero (`bad-kg`). If several things are wrong, report the **first** in that order. Spaces around fields do not matter.', 'Write every rejected row to `reject_path` as a CSV with the header `line,reason`, where `line` is the row number among the data rows, counting from 1. The reject file describes **this run only** (it is rewritten each time) and exists even when nothing was rejected.', 'Running the same file again must not duplicate anything or crash, and a newer file updates rows that share an `id`.'),
      expectedBehavior: 'Good rows in the table, one reject row per bad row, repeat-safe.',
      starterCode: '',
      hints: ['Every row ends up in exactly one of two places. Which, and how is each recorded?', 'Think about what a second run does to the table and to the reject file.', 'The reason recorded depends on the order in which you test the rules.'],
      checks: loadChecks('load_shipments', 'shipments', 'id, dest, kg', 'id,dest,kg', 'id,dest,kg\n1,Leeds,12.5\n2,,4\nz,York,3\n4,Bath,0\n5, Hull ,7\n6,Ely,inf\n-3,Ely,1\n8,,-5\n', "[(1, 'Leeds', 12.5), (5, 'Hull', 7.0)]", "[['line', 'reason'], ['2', 'blank-dest'], ['3', 'bad-id'], ['4', 'bad-kg'], ['6', 'bad-kg'], ['7', 'bad-id'], ['8', 'blank-dest']]", 'id,dest,kg\n1,Leeds,1\n2,York,2\n', "[(1, 'Leeds', 1.0), (2, 'York', 2.0)]", 'id,dest,kg\n1,Leeds,80\n9,Derby,4\n8,,4\n', "[(1, 'Leeds', 80.0), (5, 'Hull', 7.0), (9, 'Derby', 4.0)]", "[['line', 'reason'], ['3', 'blank-dest']]"),
      xpReward: 120, coinReward: 18,
    },
  ],
};
