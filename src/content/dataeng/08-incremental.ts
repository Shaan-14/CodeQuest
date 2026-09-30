import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { common, script } from './kit';

/** A sync check series shared by both variants: run 1, an identical rerun, stale + new + updated rows, bad rows, an empty file. */
const syncChecks = (fn: string, table: string, cols: string, head: string, v: [string, string, string, string, string], ex: 'a' | 'b'): ReturnType<typeof script>[] => {
  const csv = (rows: string[]) => JSON.stringify(head + '\n' + rows.join('\n') + (rows.length ? '\n' : ''));
  const q = `select ${cols} from ${table} order by id`;
  const valCol = cols.split(', ')[2]!;
  const [a, b, c, d, e] = v;
  void ex;
  return [
    script('First run loads everything', `import sqlite3\nopen('d1.csv','w').write(${csv([`1,2024-03-01 09:00,${a}`, `2,2024-03-01 10:00,${b}`, `3,2024-03-01 11:00,${c}`])})\nn = ${fn}('d1.csv', 't.db')\nassert n == 3, 'The first run should process all 3 rows, got %r.' % (n,)\nrows = sqlite3.connect('t.db').execute('${q}').fetchall()\nassert rows == [(1, '2024-03-01 09:00', ${a}), (2, '2024-03-01 10:00', ${b}), (3, '2024-03-01 11:00', ${c})], 'Got %r.' % (rows,)`),
    script('Running the same file again processes nothing', `import sqlite3\nopen('d1.csv','w').write(${csv([`1,2024-03-01 09:00,${a}`, `2,2024-03-01 10:00,${b}`, `3,2024-03-01 11:00,${c}`])})\n${fn}('d1.csv', 't.db')\nn = ${fn}('d1.csv', 't.db')\nassert n == 0, 'Nothing in the file is newer than what was already processed, but the run reported %r.' % (n,)\nassert sqlite3.connect('t.db').execute('select count(*) from ${table}').fetchone()[0] == 3`, false),
    script('Only newer rows are applied: stale copies are ignored', `import sqlite3\nopen('d1.csv','w').write(${csv([`1,2024-03-01 09:00,${a}`, `2,2024-03-01 10:00,${b}`, `3,2024-03-01 11:00,${c}`])})\nopen('d2.csv','w').write(${csv([`2,2024-03-01 08:30,${d}`, `3,2024-03-02 07:00,${d}`, `4,2024-03-02 08:00,${e}`])})\n${fn}('d1.csv', 't.db')\nn = ${fn}('d2.csv', 't.db')\nassert n == 2, 'Only rows newer than the last run count: expected 2, got %r.' % (n,)\nrows = sqlite3.connect('t.db').execute('${q}').fetchall()\nassert rows == [(1, '2024-03-01 09:00', ${a}), (2, '2024-03-01 10:00', ${b}), (3, '2024-03-02 07:00', ${d}), (4, '2024-03-02 08:00', ${e})], 'A stale copy of row 2 must not overwrite it, and row 3 must be updated. Got %r.' % (rows,)`, false),
    script('A row exactly at the last time is not processed again', `import sqlite3\nopen('d1.csv','w').write(${csv([`1,2024-03-01 09:00,${a}`, `2,2024-03-01 10:00,${b}`])})\nopen('d2.csv','w').write(${csv([`2,2024-03-01 10:00,${d}`])})\n${fn}('d1.csv', 't.db')\nassert ${fn}('d2.csv', 't.db') == 0, 'A row that is not newer than the last processed time is skipped.'\nassert sqlite3.connect('t.db').execute('select ${valCol} from ${table} where id = 2').fetchone()[0] == ${b}`, false),
    script('Bad rows are skipped and do not move the marker', `import sqlite3\nopen('d1.csv','w').write(${csv([`1,2024-03-01 09:00,${a}`])})\nopen('d2.csv','w').write(${csv([`x,2024-05-01 09:00,${b}`, `2,,${b}`, `3,2024-05-01 10:00,abc`, `4,2024-03-01 12:00,${c}`])})\nopen('d3.csv','w').write(${csv([`5,2024-04-01 00:00,${e}`])})\n${fn}('d1.csv', 't.db')\nn = ${fn}('d2.csv', 't.db')\nassert n == 1, 'Only the valid row 4 counts, got %r.' % (n,)\nassert ${fn}('d3.csv', 't.db') == 1, 'Skipped rows must not have advanced the marker: an April row is newer than everything loaded.'\nids = [r[0] for r in sqlite3.connect('t.db').execute('select id from ${table} order by id')]\nassert ids == [1, 4, 5], 'Got %r.' % (ids,)`, false),
    script('An empty file changes nothing, and does not forget the marker', `import sqlite3\nopen('d1.csv','w').write(${csv([`1,2024-03-01 09:00,${a}`])})\nopen('e.csv','w').write(${JSON.stringify(head + '\n')})\nopen('d1b.csv','w').write(${csv([`1,2024-03-01 09:00,${d}`])})\n${fn}('d1.csv', 't.db')\nassert ${fn}('e.csv', 't.db') == 0\nassert ${fn}('d1b.csv', 't.db') == 0, 'An empty file must not reset the marker.'\nassert sqlite3.connect('t.db').execute('select ${valCol} from ${table} where id = 1').fetchone()[0] == ${a}`, false),
  ];
};

export const bundle: LessonBundle = {
  lesson: {
    id: 'de-08-incremental', title: 'Only What Changed: Incremental Loads', language: 'python', skillId: 'de.incremental',
    blurb: 'Reprocessing everything every night does not scale. Remember how far you got, and load only what is new.', prerequisites: ['de-07-failing-safely'], xpReward: 90,
    reference: {
      title: 'Incremental processing',
      body: text(
        'A **full reload** reads everything every time: simple, but slow and wasteful as data grows. An **incremental load** processes only what is new since last time. The pipeline remembers a **watermark** (a high-water mark): the newest `updated` timestamp it has fully processed, stored somewhere durable (a small `sync_state` table in the same database is ideal).',
        'The rules: read the watermark (none yet = process everything); keep only rows **strictly newer**; apply them with an upsert; advance the watermark to the newest timestamp you actually applied, **after** the data is stored, so a crash cannot skip rows. Rows that are invalid are skipped and must not move the watermark. An empty run leaves it where it was.',
        'ISO timestamps (`2024-03-01 09:00`) sort correctly as **text**, so `updated > watermark` works with plain string comparison. Late or stale copies of a row (older than the watermark) are ignored by design: decide deliberately what that means for your source.',
      ),
      example: 'row = con.execute("SELECT watermark FROM sync_state WHERE name = ?", (name,)).fetchone()\nmark = row[0] if row else ""\nfresh = [r for r in rows if r["updated"] > mark]',
    },
    steps: [
      { kind: 'teach', title: 'The nightly job that got slower every night', body: text('A pipeline that rereads a million rows to find the three that changed will one day miss its deadline. The fix is to give the job a **memory**: the position it reached last time. That small piece of state is where most incremental bugs live, so it deserves care: where is it stored, when does it advance, and what if the run fails halfway?') },
      {
        kind: 'demo', title: 'A watermark in the database', language: 'python',
        body: text('State lives next to the data. Run it, then imagine the next night: only rows after `2024-03-01 10:00` would be read.'),
        code: "import sqlite3\n\ncon = sqlite3.connect(':memory:')\ncon.execute('CREATE TABLE sync_state (name TEXT PRIMARY KEY, watermark TEXT)')\nrows = [('a', '2024-03-01 09:00'), ('b', '2024-03-01 10:00')]\nmark = max(u for _, u in rows)\ncon.execute('INSERT OR REPLACE INTO sync_state VALUES (?, ?)', ('feed', mark))\ncon.commit()\nprint(con.execute('SELECT * FROM sync_state').fetchall())\nlater = [('b', '2024-03-01 10:00'), ('c', '2024-03-02 08:00')]\nprint([r for r in later if r[1] > mark])",
        notice: 'Row `b` reappeared but is not newer than the watermark, so it is skipped: that is what makes a rerun safe. Only `c` is new.',
      },
      { kind: 'challenge', challengeId: 'de-08-new-rows' },
      { kind: 'challenge', challengeId: 'de-08-sync-events' },
    ],
  },
  objectives: [
    { id: 'de-obj-incremental-sync', title: 'Load only new rows, remembering the watermark', summary: 'Persist a watermark, apply only strictly newer valid rows, and leave state untouched by bad rows and empty runs.' },
  ],
  challenges: [
    {
      id: 'de-08-new-rows', title: 'Which Rows Are New?', mode: 'learning', language: 'python', skillIds: ['de.incremental', 'py.lists'], concepts: ['watermark', 'incremental', 'iso-timestamps'], difficulty: 3, context: 'internet of things',
      prompt: text('A gateway forwards sensor rows as dictionaries like `{"id": 4, "updated": "2024-03-01 09:30"}`. Write `new_rows(rows, watermark)` returning a pair `(fresh, new_mark)`.', '`fresh` is the list of rows whose `updated` is **strictly later** than `watermark`, in their original order. `new_mark` is the latest `updated` among the fresh rows, or `watermark` unchanged when there are none. A watermark of `None` means nothing has been processed yet, so every row is fresh. `updated` values are text in `YYYY-MM-DD HH:MM` form, which sorts correctly as text. Do not change the input.'),
      expectedBehavior: 'Only strictly newer rows come back, in order, with the marker moved to the newest of them.',
      guidedSteps: ['Treat `None` as "before everything" (for instance, an empty string).', 'Keep the rows with `row["updated"] > mark`.', 'If any were kept, the new marker is the maximum of their `updated` values.', 'Return the tuple.'],
      starterCode: 'def new_rows(rows, watermark):\n    pass\n',
      hints: ['What should the very first run do when there is no watermark yet?', 'Decide whether a row exactly at the watermark counts as new, then write the comparison.', '`max` with a generator over the kept rows gives the newest; guard the empty case.'],
      checks: [
        script('Some rows are new', "rows = [{'id': 1, 'updated': '2024-03-01 09:00'}, {'id': 2, 'updated': '2024-03-01 10:00'}, {'id': 3, 'updated': '2024-03-02 07:15'}]\nfresh, mark = new_rows(rows, '2024-03-01 09:00')\nassert [r['id'] for r in fresh] == [2, 3], 'Rows at or before the watermark are not fresh. Got %r.' % ([r['id'] for r in fresh],)\nassert mark == '2024-03-02 07:15', 'The marker should move to the newest fresh row, got %r.' % (mark,)"),
        script('No watermark means everything is new', "rows = [{'id': 5, 'updated': '2024-01-01 00:00'}, {'id': 6, 'updated': '2023-12-31 23:59'}]\nfresh, mark = new_rows(rows, None)\nassert [r['id'] for r in fresh] == [5, 6], 'Keep the original order.'\nassert mark == '2024-01-01 00:00'", false),
        script('Nothing new leaves the marker alone', "rows = [{'id': 1, 'updated': '2024-03-01 09:00'}]\nfresh, mark = new_rows(rows, '2024-03-01 09:00')\nassert fresh == [] and mark == '2024-03-01 09:00', 'Got %r and %r.' % (fresh, mark)\nfresh, mark = new_rows([], '2024-03-01 09:00')\nassert fresh == [] and mark == '2024-03-01 09:00'\nfresh, mark = new_rows([], None)\nassert fresh == [] and mark is None, 'With no rows and no marker the marker stays None.'", false),
        script('Out-of-order input, and the input is left unchanged', "rows = [{'id': 1, 'updated': '2024-03-05 12:00'}, {'id': 2, 'updated': '2024-03-03 12:00'}, {'id': 3, 'updated': '2024-03-04 12:00'}]\nbefore = [dict(r) for r in rows]\nfresh, mark = new_rows(rows, '2024-03-03 12:00')\nassert [r['id'] for r in fresh] == [1, 3], 'Original order is kept.'\nassert mark == '2024-03-05 12:00', 'The marker is the NEWEST, not the last row.'\nassert rows == before, 'Do not change the input rows.'", false),
      ],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'de-08-sync-events', objectiveId: 'de-obj-incremental-sync', title: 'Sync Sensor Events', mode: 'challenge', skillIds: ['de.incremental', 'de.pipelines', 'db.integrity'], concepts: ['watermark', 'incremental', 'idempotent', 'state'], difficulty: 4, context: 'environmental monitoring', ...common,
      prompt: text('A monitoring system exports `id,updated,value` rows (`updated` like `2024-03-01 09:00`). Write `sync_events(csv_path, db_path)` that keeps a table `events` (`id` INTEGER primary key, `updated` TEXT, `value` REAL) up to date **incrementally**, and returns how many rows it applied on this call.', 'It is called many times against the same database with different files. Only rows **strictly newer** than everything processed by earlier calls are applied (a newer row with a known `id` replaces the old one; older or equal rows are ignored, even if their value differs). A row with a non-integer `id`, a blank `updated` or a non-numeric `value` is skipped and must not count or influence what "newer" means. A header-only file does nothing.', 'The database itself must remember how far you have got between calls.'),
      expectedBehavior: 'Only new valid rows are applied and counted; reruns and stale rows change nothing.',
      starterCode: '',
      hints: ['Where can the program keep something between two separate runs?', 'What must be true about the order of "store the rows" and "remember how far I got"?', 'Skipped rows should leave no trace on the state, and neither should an empty file.'],
      checks: syncChecks('sync_events', 'events', 'id, updated, value', 'id,updated,value', ['1.5', '2.5', '3.5', '9.9', '7.5'], 'a'),
      xpReward: 130, coinReward: 20,
    },
    {
      id: 'de-08-sync-orders', objectiveId: 'de-obj-incremental-sync', title: 'Sync Shop Orders', mode: 'challenge', skillIds: ['de.incremental', 'de.pipelines', 'db.integrity'], concepts: ['watermark', 'incremental', 'idempotent', 'state'], difficulty: 4, context: 'e-commerce', ...common,
      prompt: text('A shop exports `id,updated,total` rows (`updated` like `2024-03-01 09:00`). Write `sync_orders(csv_path, db_path)` that keeps a table `orders` (`id` INTEGER primary key, `updated` TEXT, `total` REAL) up to date **incrementally**, and returns how many rows it applied on this call.', 'It is called nightly against the same database with different files. Only rows **strictly newer** than everything processed by earlier calls are applied (a newer row with a known `id` replaces the old one; older or equal rows are ignored, even if their total differs). A row with a non-integer `id`, a blank `updated` or a non-numeric `total` is skipped and must not count or affect what "newer" means. A header-only file does nothing.', 'The database must remember how far you have got between calls.'),
      expectedBehavior: 'Only new valid rows are applied and counted; reruns and stale rows change nothing.',
      starterCode: '',
      hints: ['What has to survive from one call to the next, and where could it live?', 'Think about when the "how far I got" note should be written relative to the data.', 'Rows you skip, and files with no rows, must leave that note exactly as it was.'],
      checks: syncChecks('sync_orders', 'orders', 'id, updated, total', 'id,updated,total', ['19.99', '5', '120.5', '60', '8.25'], 'b'),
      xpReward: 130, coinReward: 20,
    },
  ],
};
