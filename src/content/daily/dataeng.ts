import type { Challenge } from '../schema';
import { daily, script } from './helpers';

const TOP_CHECK = `import sqlite3\ncon = sqlite3.connect('works.db')\nnames = [r[0] for r in con.execute('SELECT name FROM products')] + ['No Such Product']\nfor nm in names:\n    row = con.execute('SELECT e.name FROM production_runs r JOIN employees e ON e.id = r.operator_id JOIN products p ON p.id = r.product_id WHERE p.name = ? GROUP BY e.id ORDER BY SUM(r.units_made) DESC, e.name LIMIT 1', (nm,)).fetchone()\n    exp = row[0] if row else None\n    got = top_operator('works.db', nm)\n    assert got == exp, 'Wrong operator for a product.'`;

/** Data-engineering Daily Challenges (Python + SQLite together). */
export const dataEngDailies: Challenge[] = [
  daily({
    id: 'daily-de-repeat-safe', title: 'A Load You Can Run Twice', language: 'python', skillIds: ['de.pipelines', 'db.integrity'], difficulty: 4, context: 'logistics', project: true,
    prompt: 'A courier company re-sends its delivery export every night (`id,driver,minutes`, `minutes` a non-negative number), including deliveries already sent, sometimes with a corrected time. Write `load(csv_path, db_path)` that stores deliveries in a table `deliveries` (`id` primary key, `driver`, `minutes` REAL) in the SQLite file. Rows with a blank driver, a non-integer id or a bad time are skipped and counted: return the number skipped. Running it again, with the same or an updated file, must never duplicate a delivery, and the newest time wins.',
    checks: [
      script('Good rows and skipped count', "import sqlite3\nopen('a.csv','w').write('id,driver,minutes\\n1,Ann,12.5\\n2,,3\\nx,Bo,4\\n4,Cy,-1\\n5,Di,7\\n')\nn = load('a.csv','t.db')\nassert n == 3, 'Expected 3 skipped rows, got %r.' % (n,)\nrows = sqlite3.connect('t.db').execute('select id, driver, minutes from deliveries order by id').fetchall()\nassert rows == [(1,'Ann',12.5),(5,'Di',7.0)], 'Wrong rows: %r' % (rows,)"),
      script('Repeat and update', "import sqlite3\nopen('a.csv','w').write('id,driver,minutes\\n1,Ann,12.5\\n2,Bo,9\\n')\nopen('b.csv','w').write('id,driver,minutes\\n2,Bo,4\\n3,Cy,6\\n')\nload('a.csv','t.db'); load('a.csv','t.db'); load('b.csv','t.db')\nrows = sqlite3.connect('t.db').execute('select id, minutes from deliveries order by id').fetchall()\nassert rows == [(1,12.5),(2,4.0),(3,6.0)], 'Got %r.' % (rows,)"),
      script('Header only', "import sqlite3\nopen('e.csv','w').write('id,driver,minutes\\n')\nassert load('e.csv','t.db') == 0\nassert sqlite3.connect('t.db').execute('select count(*) from deliveries').fetchone()[0] == 0"),
    ],
    daily: { focus: 'review', requires: ['de-01-pipelines'] },
  }),
  daily({
    id: 'daily-de-top-operator', title: 'Who Runs This Product Best?', language: 'python', db: 'works', fixtures: { databases: ['works'] }, skillIds: ['de.integration', 'sql.aggregate'], difficulty: 4, context: 'manufacturing',
    prompt: 'The factory database is `works.db`. Write `top_operator(db_path, product_name)` returning the **name of the operator who made the most units in total** of the product with that name (over all their production runs of it). Equal totals go to the operator whose name comes first alphabetically. If there is no such product, or it was never produced, return `None`. The product name is typed by users: treat it as untrusted.',
    checks: [
      script('Every product, and an unknown one', TOP_CHECK),
      { kind: 'script', name: 'Different data', visible: false, databases: ['works-b:works'], code: TOP_CHECK },
      script('A hostile product name matches nothing', "assert top_operator('works.db', \"x' OR '1'='1\") is None, 'A product name must never be able to change the query.'"),
    ],
    daily: { focus: 'review', requires: ['de-02-python-sql'] },
  }),
];
