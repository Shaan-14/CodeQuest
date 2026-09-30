import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { common, MARKET, MARKET_B, script, WORKS, WORKS_B } from './kit';

const CLOSE = "def _close(a, b):\n    if isinstance(a, dict) and isinstance(b, dict):\n        return a.keys() == b.keys() and all(_close(a[k], b[k]) for k in a)\n    if isinstance(a, list) and isinstance(b, list):\n        return len(a) == len(b) and all(_close(x, y) for x, y in zip(a, b))\n    if isinstance(a, float) or isinstance(b, float):\n        return a is not None and b is not None and abs(a - b) < 0.006\n    return a == b\n";

/** Checks for a report written from a database: compared with a reference computed in the check, on visible and hidden data, plus an emptied database. */
const reportChecks = (fn: string, db: string, ref: string, wipe: string, fixtures: [typeof MARKET, typeof MARKET]): ReturnType<typeof script>[] => [
  script('The report matches the database', `import json\n${CLOSE}${ref}\n${fn}('${db}.db', 'out.json')\ngot = json.load(open('out.json'))\nexp = _ref('${db}.db')\nassert _close(got, exp), 'The report does not match the data. Expected %r but got %r.' % (exp, got)`, true, fixtures[0]),
  script('The same report on different data', `import json\n${CLOSE}${ref}\n${fn}('${db}.db', 'out.json')\ngot = json.load(open('out.json'))\nexp = _ref('${db}.db')\nassert _close(got, exp), 'The report should be computed from the database, not written from what you saw.'`, false, fixtures[1]),
  script('An emptied database gives an empty but valid report', `import json, sqlite3\n${CLOSE}${ref}\ncon = sqlite3.connect('${db}.db')\n${wipe}\ncon.commit(); con.close()\n${fn}('${db}.db', 'out.json')\ngot = json.load(open('out.json'))\nexp = _ref('${db}.db')\nassert _close(got, exp), 'With no rows the report should still be complete: %r.' % (exp,)`, false, fixtures[0]),
  script('Writing the report twice gives the same file', `import json\n${fn}('${db}.db', 'out.json'); a = open('out.json').read()\n${fn}('${db}.db', 'out.json'); b = open('out.json').read()\nassert a == b, 'Running the report again should rewrite the same content.'\njson.loads(a)`, false, fixtures[0]),
];

const MARKET_REF = "import sqlite3\ndef _ref(db):\n    con = sqlite3.connect(db)\n    by = {s: n for s, n in con.execute('select status, count(*) from orders group by status')}\n    rev = con.execute(\"select coalesce(sum(i.quantity * i.unit_price), 0) from order_items i join orders o on o.id = i.order_id where o.status <> 'returned'\").fetchone()[0]\n    top = [r[0] for r in con.execute(\"select c.name from customers c join orders o on o.customer_id = c.id join order_items i on i.order_id = o.id where o.status <> 'returned' group by c.id order by sum(i.quantity * i.unit_price) desc, c.name limit 3\")]\n    return {'orders_by_status': by, 'revenue': round(rev, 2), 'top_customers': top}\n";
const WORKS_REF = "import sqlite3\ndef _ref(db):\n    con = sqlite3.connect(db)\n    dept = {n: 0.0 for (n,) in con.execute('select name from departments')}\n    for n, h in con.execute('select d.name, sum(e.downtime_hours) from maintenance_events e join machines m on m.id = e.machine_id join departments d on d.id = m.department_id group by d.id'):\n        dept[n] = round(h, 2)\n    w = con.execute('select m.name from maintenance_events e join machines m on m.id = e.machine_id group by m.id order by sum(e.downtime_hours) desc, m.name limit 1').fetchone()\n    return {'downtime_by_department': dept, 'worst_machine': w[0] if w else None, 'events': con.execute('select count(*) from maintenance_events').fetchone()[0]}\n";

export const bundle: LessonBundle = {
  lesson: {
    id: 'de-09-reporting', title: 'The Last Mile: Reports People Can Use', language: 'python', skillId: 'de.incremental',
    blurb: 'A pipeline exists to answer questions. Turn database rows into a small, exact, repeatable report file.', prerequisites: ['de-08-incremental'], xpReward: 90,
    reference: {
      title: 'Writing reports',
      body: text(
        'A report is a **contract**: fixed keys, fixed meanings, computed from the data every time. Let SQL do the heavy lifting (`GROUP BY`, `SUM`, `ORDER BY ... LIMIT`) and let Python assemble the result into a dictionary and write it with `json.dump`. Write to the file with `open(path, "w")` so a rerun **replaces** the old report instead of appending to it.',
        'Decide the awkward cases *in advance* and write them down: what does an empty database produce? A department with no events (0, not missing)? Money rounded to 2 places (`round(x, 2)`); ties broken by name so the same data always gives the same report. `json.dump(obj, f, sort_keys=True, indent=2)` makes files stable and diff-friendly.',
        'Never write the numbers in by hand: a report that was right on the day you wrote it and wrong after tomorrow’s load is worse than none.',
      ),
      example: 'report = {"events": con.execute("SELECT COUNT(*) FROM t").fetchone()[0]}\nwith open(out_path, "w") as f:\n    json.dump(report, f, sort_keys=True, indent=2)',
    },
    steps: [
      { kind: 'teach', title: 'Somebody has to read it', body: text('The pipeline is only useful if someone can act on what comes out. A good report is **small** (only what the reader needs), **exact** (same data, same file, every time) and **complete** (no missing keys when the data is thin). The engineering is in the edge cases, not the arithmetic.') },
      {
        kind: 'demo', title: 'From rows to a JSON file', language: 'python', fixtures: MARKET,
        body: text('SQL computes the numbers; Python shapes them into a dictionary and writes JSON. Run it and read the file back.'),
        code: "import json, sqlite3\n\ncon = sqlite3.connect('market.db')\nby_status = dict(con.execute('SELECT status, COUNT(*) FROM orders GROUP BY status'))\nreport = {'orders_by_status': by_status}\nwith open('report.json', 'w') as f:\n    json.dump(report, f, sort_keys=True, indent=2)\nprint(open('report.json').read())",
        notice: '`dict(...)` turned the (status, count) rows straight into a dictionary. With `sort_keys=True` the file is the same every run, so it can be compared or version-controlled.',
      },
      { kind: 'challenge', challengeId: 'de-09-summary-file' },
      { kind: 'challenge', challengeId: 'de-09-market-report' },
    ],
  },
  objectives: [
    { id: 'de-obj-report-file', title: 'Write a database report to a file', summary: 'Compute figures with SQL, assemble a fixed-shape report, write it as JSON, and handle empty data.' },
  ],
  challenges: [
    {
      id: 'de-09-summary-file', title: 'Summarise Expenses to a File', mode: 'learning', language: 'python', skillIds: ['de.incremental', 'de.files'], concepts: ['json', 'report', 'rounding'], difficulty: 3, context: 'finance', project: true,
      prompt: text('A finance team keeps `label,amount` rows in a CSV. Write `write_summary(csv_path, out_path)` that writes a JSON file with exactly four keys: `"count"` (how many rows have a valid amount), `"total"` (their sum, rounded to 2 places), `"average"` (total divided by count, rounded to 2 places, or `null` when there are none), and `"largest"` (the `label` of the row with the biggest amount; the first one in the file if several tie; `null` when there are none).', 'A row is **valid** when `amount` is a finite number; blank, text, `nan` and `inf` amounts are skipped. Negative amounts are valid.'),
      expectedBehavior: 'A JSON file with count, total, average and largest, and null values when there are no valid rows.',
      guidedSteps: ['Read the rows with `csv.DictReader` and keep `(label, float(amount))` pairs for valid amounts (`math.isfinite`).', 'Compute the count and total; compute the average only when the count is above zero.', 'Find the largest with `max`, or track it as you go, keeping the first on a tie.', 'Write the dictionary with `json.dump` to `out_path` opened for writing.'],
      starterCode: 'import csv, json, math\n\ndef write_summary(csv_path, out_path):\n    pass\n',
      hints: ['Separate reading and validating the rows from computing the four figures.', 'What should `average` and `largest` be when no row was valid, and how does JSON write "nothing"?', '`max` returns the first of equal items; make sure your tie-breaking does the same.'],
      checks: [
        script('A typical file', "import json\nopen('f.csv','w').write('label,amount\\nrent,1200.50\\nfood,310.25\\nfuel,89.1\\n')\nwrite_summary('f.csv', 'o.json')\ngot = json.load(open('o.json'))\nassert got == {'count': 3, 'total': 1599.85, 'average': 533.28, 'largest': 'rent'}, 'Got %r.' % (got,)"),
        script('Invalid rows are skipped, ties keep the first', "import json\nopen('f.csv','w').write('label,amount\\na,10\\nb,abc\\nc,10\\nd,\\ne,nan\\nf,inf\\ng,-4\\n')\nwrite_summary('f.csv', 'o.json')\ngot = json.load(open('o.json'))\nassert got == {'count': 3, 'total': 16.0, 'average': 5.33, 'largest': 'a'}, 'Got %r.' % (got,)", false),
        script('No valid rows gives nulls', "import json\nopen('f.csv','w').write('label,amount\\nx,none\\ny,\\n')\nwrite_summary('f.csv', 'o.json')\ngot = json.load(open('o.json'))\nassert got == {'count': 0, 'total': 0, 'average': None, 'largest': None}, 'Got %r.' % (got,)\nopen('e.csv','w').write('label,amount\\n')\nwrite_summary('e.csv', 'o2.json')\nassert json.load(open('o2.json'))['count'] == 0", false),
        script('Rounding is applied to the totals', "import json\nopen('f.csv','w').write('label,amount\\na,0.1\\nb,0.2\\nc,0.7\\n')\nwrite_summary('f.csv', 'o.json')\ngot = json.load(open('o.json'))\nassert got['total'] == 1.0, 'Round the total to 2 places (floats add up with tiny errors). Got %r.' % (got['total'],)\nopen('g.csv','w').write('label,amount\\na,0.1\\nb,0.2\\n')\nwrite_summary('g.csv', 'o.json')\nassert json.load(open('o.json'))['total'] == 0.3 and json.load(open('o.json'))['average'] == 0.15", false),
        script('All negative amounts and rounding', "import json\nopen('f.csv','w').write('label,amount\\nr,-5.005\\ns,-2\\n')\nwrite_summary('f.csv', 'o.json')\ngot = json.load(open('o.json'))\nassert got['largest'] == 's' and got['count'] == 2\nassert abs(got['total'] - (-7.0)) < 0.011 and abs(got['average'] - (-3.5)) < 0.011, 'Got %r.' % (got,)", false),
      ],
      xpReward: 90, coinReward: 14,
    },
    {
      id: 'de-09-market-report', objectiveId: 'de-obj-report-file', title: 'A Weekly Sales Report', mode: 'challenge', skillIds: ['de.incremental', 'de.integration', 'sql.aggregate'], concepts: ['json', 'report', 'sql-aggregation'], difficulty: 4, context: 'retail', fixtures: MARKET, ...common,
      prompt: text('The market database is `market.db`. Write `market_report(db_path, out_path)` that writes a JSON file with exactly three keys:', '`"orders_by_status"`: an object mapping each order `status` that occurs to how many orders have it.', '`"revenue"`: the total of `quantity * unit_price` over the lines of orders whose status is **not** `returned`, rounded to 2 places (0 when there are none).', '`"top_customers"`: a list of the **names** of the three customers who spent most on orders that are not `returned` (highest first; ties by name A to Z; fewer than three if fewer customers spent anything).', 'The file is rewritten each run.'),
      expectedBehavior: 'A JSON report computed from the database with the three keys.',
      starterCode: '',
      hints: ['Three questions, each with its own query. Which parts belong in SQL?', 'What should each figure be when the tables are empty?', 'Opening the file for writing replaces what was there; think about which mode does that.'],
      checks: reportChecks('market_report', 'market', MARKET_REF, "con.execute('delete from order_items'); con.execute('delete from orders')", [MARKET, MARKET_B]),
      xpReward: 130, coinReward: 20,
    },
    {
      id: 'de-09-works-report', objectiveId: 'de-obj-report-file', title: 'A Maintenance Report', mode: 'challenge', skillIds: ['de.incremental', 'de.integration', 'sql.aggregate'], concepts: ['json', 'report', 'sql-aggregation'], difficulty: 4, context: 'manufacturing', fixtures: WORKS, ...common,
      prompt: text('The factory database is `works.db`. Write `works_report(db_path, out_path)` that writes a JSON file with exactly three keys:', '`"downtime_by_department"`: an object with **every** department name mapped to the total `downtime_hours` of the maintenance events of its machines, rounded to 2 places (0 for a department with no events).', '`"worst_machine"`: the name of the machine with the most total downtime (ties by name A to Z), or `null` when there are no events.', '`"events"`: the total number of maintenance events.', 'The file is rewritten each run.'),
      expectedBehavior: 'A JSON report computed from the database with the three keys.',
      starterCode: '',
      hints: ['Which departments must appear even when nothing happened in them?', 'What should the "worst machine" be when there are no events, and how does JSON say "nothing"?', 'Decide the tie-break before you write the query, so the same data always gives the same report.'],
      checks: [
        ...reportChecks('works_report', 'works', WORKS_REF, "con.execute('delete from maintenance_events')", [WORKS, WORKS_B]),
        script('The worst machine is decided by downtime, then by name', "import json, sqlite3\nfor first, second in (('Zeta', 'Alpha'), ('Alpha', 'Zeta')):\n    con = sqlite3.connect('works.db')\n    con.execute('delete from maintenance_events')\n    con.execute('update machines set name = ? where id = 1', (first,))\n    con.execute('update machines set name = ? where id = 2', (second,))\n    con.execute(\"update machines set name = 'Mid' where id = 3\")\n    for m, h in [(1, 5), (2, 5), (3, 1), (3, 1), (3, 1)]:\n        con.execute(\"insert into maintenance_events (machine_id, technician_id, event_date, kind, downtime_hours, cost) values (?, 1, '2024-01-01', 'repair', ?, null)\", (m, h))\n    con.commit(); con.close()\n    works_report('works.db', 'out.json')\n    got = json.load(open('out.json'))\n    assert got['worst_machine'] == 'Alpha', 'Most downtime wins (not most events); equal downtime goes to the name that comes first. Got %r.' % (got['worst_machine'],)\n    assert got['events'] == 5", false, WORKS),
      ],
      xpReward: 130, coinReward: 20,
    },
  ],
};
