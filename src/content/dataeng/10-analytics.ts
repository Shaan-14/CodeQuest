import { text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const WORKS = { databases: ['works'] };
const WORKS_B = { databases: ['works-b:works'] };
const MARKET = { databases: ['market'] };
const MARKET_B = { databases: ['market-b:market'] };
type Fx = { databases: string[] };
const script = (name: string, code: string, fixtures: Fx, visible = true): Check => ({ kind: 'script', name, code, ...fixtures, visible });

/** Reference helpers shipped in every check. Namespaced so they can never collide with the player's own names. */
const REF = `import sqlite3, statistics, math
def _rf_med(x):
    n = len(x)
    return x[n // 2] if n % 2 else (x[n // 2 - 1] + x[n // 2]) / 2
def _rf_outliers(pairs):
    vals = sorted(v for _, v in pairs)
    if len(vals) < 4:
        return []
    n = len(vals)
    q1 = _rf_med(vals[: n // 2])
    q3 = _rf_med(vals[n // 2 + n % 2 :])
    iqr = q3 - q1
    lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return sorted(name for name, v in pairs if v < lo or v > hi)
def _rf_r(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return None if sx == 0 or sy == 0 else round(sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy), 3)
`;
const both = (name: string, body: string, db: string, a: Fx, b: Fx): Check[] => [script(name, `${REF}${body.replaceAll('DB', `'${db}.db'`)}`, a), script(`${name} (different data)`, `${REF}${body.replaceAll('DB', `'${db}.db'`)}`, b, false)];


/** Crafted databases built INSIDE a check: boundary totals, ties between methods and idle groups that the shipped data never contains. */
const MK_MACHINES = `def _rf_machines(totals, idle=0, names=None):
    import sqlite3, os
    if os.path.exists('fence.db'):
        os.remove('fence.db')
    c = sqlite3.connect('fence.db')
    c.executescript("CREATE TABLE machines (id INTEGER PRIMARY KEY, name TEXT NOT NULL, machine_type TEXT, department_id INTEGER, purchase_cost REAL, installed_on TEXT); CREATE TABLE maintenance_events (id INTEGER PRIMARY KEY, machine_id INTEGER NOT NULL, technician_id INTEGER, event_date TEXT, kind TEXT, downtime_hours REAL NOT NULL, cost REAL);")
    names = names or ['M%02d' % i for i in range(len(totals) + idle)]
    for i, t in enumerate(totals):
        c.execute("INSERT INTO machines (id, name) VALUES (?, ?)", (i + 1, names[i]))
        c.execute("INSERT INTO maintenance_events (machine_id, kind, downtime_hours) VALUES (?, 'repair', ?)", (i + 1, t - 1))
        c.execute("INSERT INTO maintenance_events (machine_id, kind, downtime_hours) VALUES (?, 'routine', ?)", (i + 1, 1))
    for j in range(idle):
        c.execute("INSERT INTO machines (id, name) VALUES (?, ?)", (len(totals) + j + 1, names[len(totals) + j]))
    c.commit()
    c.close()
    return 'fence.db'
`;
const MK_CUSTOMERS = `def _rf_customers(totals, names=None, cancelled_on_first=0):
    import sqlite3, os
    if os.path.exists('fence.db'):
        os.remove('fence.db')
    c = sqlite3.connect('fence.db')
    c.executescript("CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT, joined_on TEXT); CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, ordered_on TEXT, status TEXT NOT NULL); CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL, product_id INTEGER, quantity INTEGER NOT NULL, unit_price REAL NOT NULL);")
    names = names or ['C%02d' % i for i in range(len(totals))]
    n = 0
    for i, t in enumerate(totals):
        c.execute("INSERT INTO customers (id, name) VALUES (?, ?)", (i + 1, names[i]))
        n += 1
        c.execute("INSERT INTO orders (id, customer_id, status) VALUES (?, ?, 'paid')", (n, i + 1))
        c.execute("INSERT INTO order_items (order_id, quantity, unit_price) VALUES (?, 1, ?)", (n, t))
    if cancelled_on_first:
        n += 1
        c.execute("INSERT INTO orders (id, customer_id, status) VALUES (?, 1, 'cancelled')", (n,))
        c.execute("INSERT INTO order_items (order_id, quantity, unit_price) VALUES (?, 1, ?)", (n, cancelled_on_first))
    c.commit()
    c.close()
    return 'fence.db'
`;
const MK_RUNS = `def _rf_runs(pairs, idle=0):
    import sqlite3, os
    if os.path.exists('fence.db'):
        os.remove('fence.db')
    c = sqlite3.connect('fence.db')
    c.executescript("CREATE TABLE machines (id INTEGER PRIMARY KEY, name TEXT NOT NULL, machine_type TEXT, department_id INTEGER, purchase_cost REAL, installed_on TEXT); CREATE TABLE production_runs (id INTEGER PRIMARY KEY, machine_id INTEGER NOT NULL, operator_id INTEGER, product_id INTEGER, run_date TEXT, units_made INTEGER NOT NULL, units_defective INTEGER, hours REAL NOT NULL);")
    for i, (u, h) in enumerate(pairs):
        c.execute("INSERT INTO machines (id, name) VALUES (?, ?)", (i + 1, 'M%d' % i))
        c.execute("INSERT INTO production_runs (machine_id, units_made, hours) VALUES (?, ?, ?)", (i + 1, u - 1, h / 2))
        c.execute("INSERT INTO production_runs (machine_id, units_made, hours) VALUES (?, ?, ?)", (i + 1, 1, h / 2))
    for j in range(idle):
        c.execute("INSERT INTO machines (id, name) VALUES (?, ?)", (len(pairs) + j + 1, 'Idle%d' % j))
    c.commit()
    c.close()
    return 'fence.db'
`;
const MK_PRODUCTS = `def _rf_products(pairs, unsold=0):
    import sqlite3, os
    if os.path.exists('fence.db'):
        os.remove('fence.db')
    c = sqlite3.connect('fence.db')
    c.executescript("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT, price REAL NOT NULL, stock INTEGER); CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, ordered_on TEXT, status TEXT); CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER NOT NULL, unit_price REAL NOT NULL);")
    c.execute("INSERT INTO orders (id, status) VALUES (1, 'paid')")
    for i, (price, qty) in enumerate(pairs):
        c.execute("INSERT INTO products (id, name, price) VALUES (?, ?, ?)", (i + 1, 'P%d' % i, price))
        c.execute("INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, ?, ?, ?)", (i + 1, qty - 1, price))
        c.execute("INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, ?, 1, ?)", (i + 1, price))
    for j in range(unsold):
        c.execute("INSERT INTO products (id, name, price) VALUES (?, ?, ?)", (len(pairs) + j + 1, 'Unsold%d' % j, 99))
    c.commit()
    c.close()
    return 'fence.db'
`;
const crafted = (name: string, code: string): Check => ({ kind: 'script', name, code: `${REF}${code}`, visible: false });

const MACHINE_ROWS = "sqlite3.connect(DB).execute('SELECT m.name, SUM(e.downtime_hours) FROM machines m JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id').fetchall()";
const CUSTOMER_ROWS = "sqlite3.connect(DB).execute(\"SELECT c.name, SUM(i.quantity * i.unit_price) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid' GROUP BY c.id\").fetchall()";
const MACHINE_XY = "sqlite3.connect(DB).execute('SELECT SUM(units_made), SUM(hours) FROM production_runs GROUP BY machine_id').fetchall()";
const PRODUCT_XY = "sqlite3.connect(DB).execute('SELECT p.price, SUM(i.quantity) FROM products p JOIN order_items i ON i.product_id = p.id GROUP BY p.id').fetchall()";

export const bundle: LessonBundle = {
  lesson: {
    id: 'de-10-analytics', title: 'From Database to Decision', language: 'python', skillId: 'de.analytics',
    blurb: 'Fetch per-group numbers with SQL and judge them with statistics in Python: outliers, relationships, and summaries you can defend.', prerequisites: ['de-02-python-sql'],
    requires: [{ skill: 'sql.aggregate' }, { skill: 'stat.descriptive' }, { skill: 'stat.spread' }],
    xpReward: 100,
    reference: {
      title: 'SQL for the numbers, Python for the judgement',
      body: text(
        'Let the database do what it is good at: **filter, join and aggregate close to the data** (`SUM ... GROUP BY`). Bring the small result into Python to do what SQL is awkward at: quartiles and outlier rules, correlations, simulations.',
        'Be explicit about the **unit of analysis**: one row per machine? per customer? per order? A statistic over the wrong unit is a confident wrong answer. Decide it first, write the SQL that produces exactly one row per unit, then compute.',
      ),
      example: 'import sqlite3, statistics\nrows = sqlite3.connect("works.db").execute("SELECT machine_id, SUM(downtime_hours) FROM maintenance_events GROUP BY machine_id").fetchall()\ntotals = [t for _, t in rows]\nprint(round(statistics.median(totals), 2), round(statistics.pstdev(totals), 2))',
    },
    steps: [
      { kind: 'teach', title: 'Two tools, one answer', body: text('You now know enough SQL to get one number per group and enough statistics to ask whether those numbers are unusual or related. The skill in this lesson is joining the two without losing track of what each row means.', 'Watch for traps: a machine with no maintenance events has no row in an inner join, which changes every summary; a total that includes cancelled orders answers a different question. State your choices in a comment.') },
      {
        kind: 'demo', title: 'One row per machine, then a judgement', language: 'python', fixtures: WORKS,
        body: text('Total downtime per machine, then the median and how far the largest total sits from it.'),
        code: 'import sqlite3, statistics\ndb = sqlite3.connect("works.db")\nrows = db.execute("SELECT m.name, SUM(e.downtime_hours) FROM machines m JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id").fetchall()\ntotals = sorted(t for _, t in rows)\nprint(len(rows), "machines with events")\nprint("median", round(statistics.median(totals), 1), "max", round(totals[-1], 1))',
        notice: 'SQL produced one row per machine; Python judged the numbers. A total far above the median is a candidate for investigation, not yet a conclusion.',
      },
      { kind: 'challenge', challengeId: 'de-10-spend-summary' },
      { kind: 'challenge', challengeId: 'de-10-unusual-machines' },
      { kind: 'challenge', challengeId: 'de-10-speed-relationship' },
    ],
  },
  objectives: [
    { id: 'de-obj-unusual-groups', title: 'Find the unusual groups in a database', summary: 'Aggregate per group in SQL, then flag the groups outside the outlier fences.' },
    { id: 'de-obj-db-correlation', title: 'Measure a relationship between two per-group numbers', summary: 'Aggregate two measures per group in SQL and report their correlation.' },
  ],
  challenges: [
    {
      id: 'de-10-spend-summary', title: 'The Spending Summary', mode: 'learning', language: 'python', skillIds: ['de.analytics', 'sql.aggregate', 'stat.descriptive'], concepts: ['group by', 'median', 'sqlite3'], difficulty: 3, context: 'retail', fixtures: MARKET,
      prompt: text('The `market.db` database records orders. Write `spend_summary(db_path)` returning a dict with `"customers"` (how many customers have at least one **paid** order), `"mean"` and `"median"` of **total paid spend per customer** (sum of `quantity * unit_price` over their paid orders), both **rounded to 2 decimals**. With no paid orders return `{}`.'),
      expectedBehavior: 'A dict with customers, mean and median of per-customer paid spend; {} if there is none.',
      guidedSteps: ['One SQL query gives one row per customer: join customers → orders → order_items, filter `status = \'paid\'`, `GROUP BY` the customer.', 'Fetch the totals into a list.', 'Use the `statistics` module for the mean and median, and `round(x, 2)`.'],
      starterCode: 'import sqlite3\nimport statistics\n\ndef spend_summary(db_path):\n    pass\n',
      hints: ['What is the unit of analysis?', 'SQL for one total per customer, Python for the summary.', 'No paid orders means no rows.'],
      checks: [
        script('The example database', `${REF}rows = ${CUSTOMER_ROWS.replace('DB', "'market.db'")}\nv = [t for _, t in rows]\nexp = {"customers": len(v), "mean": round(sum(v) / len(v), 2), "median": round(statistics.median(v), 2)}\ngot = spend_summary('market.db')\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`, MARKET),
        script('Different data', `${REF}rows = ${CUSTOMER_ROWS.replace('DB', "'market.db'")}\nv = [t for _, t in rows]\nexp = {"customers": len(v), "mean": round(sum(v) / len(v), 2), "median": round(statistics.median(v), 2)}\ngot = spend_summary('market.db')\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`, MARKET_B, false),
        script('No paid orders', "import sqlite3, shutil\nc = sqlite3.connect('market.db')\nc.execute(\"UPDATE orders SET status = 'cancelled'\")\nc.commit()\nc.close()\nassert spend_summary('market.db') == {}, 'With no paid orders the summary is empty.'", MARKET, false),
      ],
      xpReward: 60, coinReward: 9,
    },
    {
      id: 'de-10-unusual-machines', objectiveId: 'de-obj-unusual-groups', title: 'Which Machines Are Off the Charts?', mode: 'challenge', language: 'python', skillIds: ['de.analytics', 'sql.aggregate', 'stat.spread'], concepts: ['group by', 'outliers', 'IQR'], difficulty: 3, context: 'maintenance', fixtures: WORKS,
      prompt: text(
        'Maintenance wants to know which machines lose unusual amounts of time. Write `unusual_machines(db_path)` for `works.db`: add up each machine’s `downtime_hours` over its maintenance events (machines with **no events are left out**), then return a **sorted list of the machine names** whose total is **outside the IQR fences** (below `Q1 − 1.5 × IQR` or above `Q3 + 1.5 × IQR`).',
        'Quartiles: sort the totals; `Q1` is the median of the lower half and `Q3` the median of the upper half (with an odd count the middle total belongs to neither half). With fewer than 4 machines return `[]`.',
      ),
      expectedBehavior: 'Sorted names of machines whose total downtime is outside the fences.',
      starterCode: 'import sqlite3\n\ndef unusual_machines(db_path):\n    pass\n',
      hints: ['One row per machine comes from SQL; the fences are a Python calculation.', 'Decide how machines without events are treated before you aggregate.', 'A total exactly on a fence is not unusual.'],
      checks: [...both('Machines outside the fences', `rows = ${MACHINE_ROWS}\nexp = _rf_outliers([(n, t) for n, t in rows])\ngot = unusual_machines(DB)\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`, 'works', WORKS, WORKS_B),
        crafted('Totals sitting on the fences', `${MK_MACHINES}db = _rf_machines([7, 10, 10, 11, 12, 12, 15])\nassert unusual_machines(db) == [], 'A total exactly on a fence is not unusual.'`),
        crafted('Two unusual machines, names in order', `${MK_MACHINES}names = ['T%d' % i for i in range(8)] + ['Zulu', 'Alpha']\ndb = _rf_machines([100] * 8 + [1, 300], names=names)\nassert unusual_machines(db) == ['Alpha', 'Zulu'], 'Expected [Alpha, Zulu] but got %r.' % (unusual_machines(db),)`),
        crafted('Machines with no events are left out', `${MK_MACHINES}db = _rf_machines([13, 10, 8, 24, 9, 5], idle=2, names=['a', 'b', 'c', 'Big', 'e', 'f', 'g', 'h'])\nassert unusual_machines(db) == ['Big'], 'Expected [Big] but got %r.' % (unusual_machines(db),)`),
        crafted('Too few machines', `${MK_MACHINES}assert unusual_machines(_rf_machines([5])) == [], 'One machine has nothing to compare with.'\nassert unusual_machines(_rf_machines([])) == [], 'No machines gives an empty list.'`),
      ],
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'de-10-unusual-customers', objectiveId: 'de-obj-unusual-groups', title: 'Which Customers Stand Out?', mode: 'challenge', language: 'python', skillIds: ['de.analytics', 'sql.aggregate', 'stat.spread'], concepts: ['group by', 'outliers', 'IQR'], difficulty: 3, context: 'retail', fixtures: MARKET,
      prompt: text(
        'The shop wants to spot unusual customers. Write `unusual_customers(db_path)` for `market.db`: a customer’s total is the sum of `quantity * unit_price` over their **paid** orders (customers with no paid orders are left out). Return a **sorted list of customer names** whose total is **outside the IQR fences** (below `Q1 − 1.5 × IQR` or above `Q3 + 1.5 × IQR`).',
        'Quartiles: sort the totals; `Q1` is the median of the lower half and `Q3` the median of the upper half (with an odd count the middle total belongs to neither half). With fewer than 4 customers return `[]`.',
      ),
      expectedBehavior: 'Sorted names of customers whose total paid spend is outside the fences.',
      starterCode: 'import sqlite3\n\ndef unusual_customers(db_path):\n    pass\n',
      hints: ['Status matters: only some orders count.', 'One total per customer from SQL, then the fences in Python.', 'Sort the names you return.'],
      checks: [...both('Customers outside the fences', `rows = ${CUSTOMER_ROWS}\nexp = _rf_outliers([(n, t) for n, t in rows])\ngot = unusual_customers(DB)\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`, 'market', MARKET, MARKET_B),
        crafted('Totals sitting on the fences', `${MK_CUSTOMERS}db = _rf_customers([7, 10, 10, 11, 12, 12, 15])\nassert unusual_customers(db) == [], 'A total exactly on a fence is not unusual.'`),
        crafted('Two unusual customers, names in order', `${MK_CUSTOMERS}names = ['t%d' % i for i in range(8)] + ['Zed', 'Abe']\ndb = _rf_customers([100] * 8 + [1, 300], names=names)\nassert unusual_customers(db) == ['Abe', 'Zed'], 'Expected [Abe, Zed] but got %r.' % (unusual_customers(db),)`),
        crafted('Only paid orders count', `${MK_CUSTOMERS}db = _rf_customers([13, 10, 8, 24, 9, 5], names=['First', 'b', 'c', 'Big', 'e', 'f'], cancelled_on_first=1000)\nassert unusual_customers(db) == ['Big'], 'Expected [Big] but got %r.' % (unusual_customers(db),)`),
        crafted('Too few customers', `${MK_CUSTOMERS}assert unusual_customers(_rf_customers([5])) == [], 'One customer has nothing to compare with.'\nassert unusual_customers(_rf_customers([])) == [], 'No customers gives an empty list.'`),
      ],
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'de-10-speed-relationship', objectiveId: 'de-obj-db-correlation', title: 'Do Busy Machines Run Longer?', mode: 'challenge', language: 'python', skillIds: ['de.analytics', 'sql.aggregate', 'stat.correlation'], concepts: ['group by', 'correlation'], difficulty: 3, context: 'manufacturing', fixtures: WORKS,
      prompt: text('In `works.db`, each machine’s production runs have `units_made` and `hours`. Write `output_vs_hours(db_path)` returning **Pearson’s r**, rounded to **3 decimals**, between each machine’s **total units made** and its **total hours**, using **one data point per machine** (machines with no runs are left out). If r is undefined (fewer than 2 machines, or no variation in either total) return `None`.'),
      expectedBehavior: 'Pearson r of per-machine totals of units and hours, 3 decimals; None when undefined.',
      starterCode: 'import sqlite3\n\ndef output_vs_hours(db_path):\n    pass\n',
      hints: ['What is one data point here?', 'Two totals per machine come from one grouped query.', 'Check the undefined cases before dividing.'],
      checks: [...both('Correlation of per-machine totals', `rows = ${MACHINE_XY}\nxs = [a for a, _ in rows]\nys = [b for _, b in rows]\nexp = _rf_r(xs, ys) if len(rows) >= 2 else None\ngot = output_vs_hours(DB)\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`, 'works', WORKS, WORKS_B),
        crafted('A negative relationship keeps its sign', `${MK_RUNS}db = _rf_runs([(10, 5), (20, 4), (30, 3)], idle=1)\nassert output_vs_hours(db) == -1.0, 'Expected -1.0 but got %r.' % (output_vs_hours(db),)`),
        crafted('No variation, or too few machines', `${MK_RUNS}assert output_vs_hours(_rf_runs([(10, 5), (20, 5), (30, 5)])) is None, 'No variation in hours means r is undefined.'\nassert output_vs_hours(_rf_runs([(10, 5)], idle=3)) is None, 'One machine is not enough.'`),
      ],
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'de-10-price-relationship', objectiveId: 'de-obj-db-correlation', title: 'Do Cheaper Products Sell More?', mode: 'challenge', language: 'python', skillIds: ['de.analytics', 'sql.aggregate', 'stat.correlation'], concepts: ['group by', 'correlation'], difficulty: 3, context: 'retail', fixtures: MARKET,
      prompt: text('In `market.db`, every product has a `price`, and `order_items` record the `quantity` sold. Write `price_vs_quantity(db_path)` returning **Pearson’s r**, rounded to **3 decimals**, between a product’s `price` and the **total quantity sold** of it, using **one data point per product that has been sold at least once**. If r is undefined (fewer than 2 products, or no variation in either list) return `None`.'),
      expectedBehavior: 'Pearson r between price and total quantity sold per product, 3 decimals; None when undefined.',
      starterCode: 'import sqlite3\n\ndef price_vs_quantity(db_path):\n    pass\n',
      hints: ['Products that never sold have no sales to correlate.', 'One total per product from SQL.', 'Undefined cases return None, not an error.'],
      checks: [...both('Correlation of price and quantity', `rows = ${PRODUCT_XY}\nxs = [a for a, _ in rows]\nys = [b for _, b in rows]\nexp = _rf_r(xs, ys) if len(rows) >= 2 else None\ngot = price_vs_quantity(DB)\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`, 'market', MARKET, MARKET_B),
        crafted('A negative relationship keeps its sign', `${MK_PRODUCTS}db = _rf_products([(10, 50), (20, 30), (30, 10)], unsold=2)\nassert price_vs_quantity(db) == -1.0, 'Expected -1.0 but got %r.' % (price_vs_quantity(db),)`),
        crafted('No variation, or too few products', `${MK_PRODUCTS}assert price_vs_quantity(_rf_products([(10, 5), (10, 9), (10, 2)])) is None, 'No variation in price means r is undefined.'\nassert price_vs_quantity(_rf_products([(10, 5)], unsold=3)) is None, 'One sold product is not enough.'`),
      ],
      xpReward: 100, coinReward: 15,
    },
  ],
};
