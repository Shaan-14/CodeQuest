import { text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const WORKS = { databases: ['works'] };
const WORKS_B = { databases: ['works-b:works'] };
const MARKET = { databases: ['market'] };
const MARKET_B = { databases: ['market-b:market'] };

const script = (name: string, code: string, fixtures: { databases: string[] }, visible = true): Check => ({ kind: 'script', name, code, ...fixtures, visible });

/** Compare a player's function to a reference computed by SQL inside the check, on the visible and the hidden database. */
const vs = (fn: string, args: string, ref: string, view: string, hidden: string, fixtures: [typeof WORKS, typeof WORKS], note: string, injection?: string): Check[] => {
  const body = (arg: string) => `import sqlite3\nexp = ${ref.replace('ARG', arg)}\ngot = ${fn}('${view}.db', ${arg})\nassert got == exp, "${note} Expected %r but got %r." % (exp, got)`;
  const checks: Check[] = [
    script('Answer for the example', body(args), fixtures[0]),
    script('Answer on different data', body(args), fixtures[1], false),
  ];
  if (injection) checks.push(script('Odd input is handled safely', `${'import sqlite3'}\ngot = ${fn}('${view}.db', ${injection})\nassert got in ([], 0, 0.0, None), "A value like ${injection.replace(/"/g, '\\"')} should simply match nothing. Never paste text into SQL: use placeholders. Got %r." % (got,)`, fixtures[0], false));
  void hidden;
  return checks;
};

const common = { language: 'python' as const, difficulty: 3 as const, project: true };

export const bundle: LessonBundle = {
  lesson: {
    id: 'de-02-python-sql', title: 'Python Meets the Database', language: 'python', skillId: 'de.integration',
    blurb: 'Query a real database from Python safely, then finish the analysis where SQL stops.', prerequisites: ['de-01-pipelines'], requires: [{ skill: 'py.loops', level: 'developing' }, { skill: 'py.dicts', level: 'developing' }, { skill: 'sql.select' }, { skill: 'sql.joins' }, { skill: 'sql.aggregate' }], xpReward: 70,
    reference: {
      title: 'Python + SQLite',
      body: text(
        '`import sqlite3`; `con = sqlite3.connect("works.db")`; `cur = con.execute("SELECT ... WHERE name = ?", (value,))`; `cur.fetchall()` gives a list of tuples, `fetchone()` one tuple (or `None`).',
        '**Always pass values with `?` placeholders**, never by joining strings: text glued into SQL can rewrite the query (**SQL injection**), and breaks on names like `O\'Brien`.',
        'Use SQL to **filter and aggregate close to the data**; use Python for what SQL is awkward at (medians, custom rules, reports, files). A good split: let the database return only the rows you need, then analyse them in Python (`statistics` module).',
      ),
      example: 'con = sqlite3.connect("works.db")\nrows = con.execute("SELECT name FROM machines WHERE machine_type = ?", ("lathe",)).fetchall()\nnames = [r[0] for r in rows]',
    },
    steps: [
      { kind: 'teach', title: 'Two tools, one job', body: text('SQL is excellent at asking a database questions; Python is excellent at everything around it: files, rules, statistics, reports. Most real data work uses **both**: a query pulls the relevant rows, Python does the rest. The bridge is the `sqlite3` module.') },
      {
        kind: 'demo', title: 'Ask the database from Python', language: 'python', fixtures: WORKS,
        body: text('The factory database is available as `works.db`. Note the `?` placeholder.'),
        code: "import sqlite3\n\ncon = sqlite3.connect('works.db')\nrows = con.execute('SELECT name, purchase_cost FROM machines WHERE department_id = ? ORDER BY purchase_cost DESC', (1,)).fetchall()\nfor name, cost in rows:\n    print(name, cost)",
        notice: 'Each row comes back as a tuple, which you can unpack in the `for`. The `1` travelled separately from the SQL text, so it can never be mistaken for SQL.',
      },
      { kind: 'challenge', challengeId: 'de-02-department-machines' },
      { kind: 'challenge', challengeId: 'de-02-machine-output' },
      { kind: 'challenge', challengeId: 'de-02-median-downtime' },
    ],
  },
  objectives: [
    { id: 'de-obj-parameterised', title: 'Query safely from Python', summary: 'Run a parameterised query from Python and return the result in a useful shape.' },
    { id: 'de-obj-sql-then-python', title: 'SQL for the rows, Python for the analysis', summary: 'Fetch the relevant rows with SQL, then compute something SQL cannot easily do.' },
  ],
  challenges: [
    {
      id: 'de-02-department-machines', title: 'Machines by Department', mode: 'learning', language: 'python', skillIds: ['de.integration', 'sql.select'], concepts: ['sqlite3', 'placeholders', 'fetchall'], difficulty: 2, context: 'manufacturing',
      fixtures: WORKS,
      prompt: text('The factory database is `works.db`. Write `machines_in(db_path, department)` that returns a **list of machine names** (sorted A to Z) for the department whose `name` is `department`. If no department matches, return an empty list.'),
      expectedBehavior: 'machines_in("works.db", "Assembly") returns that department’s machine names, sorted.',
      guidedSteps: ['Connect with `sqlite3.connect(db_path)`.', 'Join `machines` to `departments`, filtering with a `?` placeholder.', '`ORDER BY` the machine name.', 'Turn the rows into a list of names.'],
      starterCode: 'import sqlite3\n\ndef machines_in(db_path, department):\n    pass\n',
      hints: ['The department is known by name, but machines store its id. Which SQL feature connects them?', 'Pass the department name as a parameter, never inside the SQL text.', 'A join on `department_id`, `WHERE d.name = ?`, then `[row[0] for row in rows]`.'],
      checks: [
        ...vs('machines_in', '"Assembly"', "[r[0] for r in sqlite3.connect('works.db').execute('SELECT m.name FROM machines m JOIN departments d ON d.id = m.department_id WHERE d.name = ? ORDER BY m.name', (ARG,))]", 'works', 'works', [WORKS, WORKS_B], 'The machine names for that department, sorted.', '"x\' OR \'1\'=\'1"'),
        script('An unknown department gives an empty list', "assert machines_in('works.db', 'No Such Place') == [], 'No matching department should give an empty list.'", WORKS, false),
      ],
      xpReward: 60, coinReward: 8,
    },
    {
      id: 'de-02-machine-output', objectiveId: 'de-obj-parameterised', title: 'Units Made by a Machine', mode: 'challenge', skillIds: ['de.integration', 'sql.aggregate', 'sql.joins'], concepts: ['sqlite3', 'placeholders', 'aggregate'], context: 'manufacturing', fixtures: WORKS, ...common,
      prompt: text('Write `units_made(db_path, machine_name)` that returns the **total number of units** produced by the machine with that name across all its production runs, as an integer. A machine with no runs, or a name that does not exist, gives `0`.', 'The name comes from user input, so treat it as untrusted.'),
      expectedBehavior: 'Totals match the database; unknown machines give 0.',
      starterCode: '',
      hints: ['Which tables do you need to connect a name to units made?', 'An aggregate over a filtered join; think about what an aggregate returns when nothing matches.', 'Placeholders for the name, and `COALESCE` (or Python `or 0`) for the empty case.'],
      checks: [
        ...vs('units_made', '"Press 1"', "sqlite3.connect('works.db').execute('SELECT COALESCE(SUM(r.units_made), 0) FROM production_runs r JOIN machines m ON m.id = r.machine_id WHERE m.name = ?', (ARG,)).fetchone()[0]", 'works', 'works', [WORKS, WORKS_B], 'The total units for that machine.', '"x\' OR \'1\'=\'1"'),
        script('An unknown machine gives 0', "assert units_made('works.db', 'Nonexistent') == 0", WORKS, false),
      ],
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'de-02-customer-spend', objectiveId: 'de-obj-parameterised', title: 'What a Customer Has Spent', mode: 'challenge', skillIds: ['de.integration', 'sql.aggregate', 'sql.joins'], concepts: ['sqlite3', 'placeholders', 'aggregate'], context: 'retail', fixtures: MARKET, ...common,
      prompt: text('Write `total_spent(db_path, customer_name)` that returns the total money a customer has spent: the sum of `quantity * unit_price` over the lines of their orders that are **not** `returned`. A customer with no such orders, or an unknown name, gives `0`.', 'The name is untrusted input.'),
      expectedBehavior: 'Totals match the database; unknown customers give 0.',
      starterCode: '',
      hints: ['Follow the relationships: customer → orders → order lines.', 'Filter out one status, then add up a calculated value.', 'Placeholders for the name; a missing total should become 0.'],
      checks: [
        ...vs('total_spent', '"Jon Khan"', "sqlite3.connect('market.db').execute(\"SELECT COALESCE(SUM(i.quantity * i.unit_price), 0) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE c.name = ? AND o.status <> 'returned'\", (ARG,)).fetchone()[0]", 'market', 'market', [MARKET, MARKET_B], 'The spend for that customer.', '"x\' OR \'1\'=\'1"'),
        script('Another customer, different data', "import sqlite3\ncon = sqlite3.connect('market.db')\nexp = con.execute(\"SELECT COALESCE(SUM(i.quantity * i.unit_price), 0) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE c.name = 'Grace Hughes' AND o.status <> 'returned'\").fetchone()[0]\ngot = total_spent('market.db', 'Grace Hughes')\nassert got == exp and exp > 0, 'Expected %r, got %r.' % (exp, got)", MARKET_B, false),
        script('An unknown customer gives 0', "assert total_spent('market.db', 'Nobody Here') == 0", MARKET, false),
      ],
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'de-02-median-downtime', objectiveId: 'de-obj-sql-then-python', title: 'The Typical Repair', mode: 'challenge', skillIds: ['de.integration', 'py.modules'], concepts: ['sqlite3', 'statistics', 'median'], context: 'maintenance', fixtures: WORKS, ...common,
      prompt: text('Managers say averages are distorted by a few huge breakdowns. Write `median_downtime(db_path, kind)` that returns the **median** `downtime_hours` of the maintenance events of that `kind` (`repair`, `routine` or `inspection`). If there are none, return `None`.', 'SQLite has no built-in median. Use each tool for what it is good at.'),
      expectedBehavior: 'The median of the matching events, or None.',
      starterCode: '',
      hints: ['Which part is a filter over rows, and which part is a calculation?', 'Fetch just the numbers you need, then compute in Python.', 'The standard library has a `statistics` module; look up what it offers and what it does on an empty list.'],
      checks: [
        script('Median for repairs', "import sqlite3, statistics\nv = [r[0] for r in sqlite3.connect('works.db').execute(\"SELECT downtime_hours FROM maintenance_events WHERE kind = 'repair'\")]\nexp = statistics.median(v)\ngot = median_downtime('works.db', 'repair')\nassert abs(got - exp) < 1e-9, 'Expected %r, got %r.' % (exp, got)", WORKS),
        script('Median on different data and kind', "import sqlite3, statistics\nv = [r[0] for r in sqlite3.connect('works.db').execute(\"SELECT downtime_hours FROM maintenance_events WHERE kind = 'routine'\")]\nexp = statistics.median(v)\ngot = median_downtime('works.db', 'routine')\nassert abs(got - exp) < 1e-9, 'Expected %r, got %r.' % (exp, got)", WORKS_B, false),
        script('No matching events gives None', "assert median_downtime('works.db', 'explosion') is None, 'No events should give None.'", WORKS, false),
      ],
      xpReward: 110, coinReward: 16,
    },
    {
      id: 'de-02-median-order', objectiveId: 'de-obj-sql-then-python', title: 'The Typical Order', mode: 'challenge', skillIds: ['de.integration', 'py.modules'], concepts: ['sqlite3', 'statistics', 'median'], context: 'retail', fixtures: MARKET, ...common,
      prompt: text('Write `median_order_value(db_path, status)` that returns the **median order total** among orders with that `status`, where an order’s total is the sum of `quantity * unit_price` over its lines. If there are no such orders, return `None`.', 'SQLite has no built-in median. Use each tool for what it is good at.'),
      expectedBehavior: 'The median of the matching order totals, or None.',
      starterCode: '',
      hints: ['One calculation per order, then one number from all of them.', 'SQL can produce one total per order; something else finishes the job.', 'Group the lines by order in SQL, then use the `statistics` module on the result.'],
      checks: [
        script('Median for paid orders', "import sqlite3, statistics\nv = [r[0] for r in sqlite3.connect('market.db').execute(\"SELECT SUM(i.quantity * i.unit_price) FROM orders o JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid' GROUP BY o.id\")]\nexp = statistics.median(v)\ngot = median_order_value('market.db', 'paid')\nassert abs(got - exp) < 1e-6, 'Expected %r, got %r.' % (exp, got)", MARKET),
        script('Median on different data and status', "import sqlite3, statistics\nv = [r[0] for r in sqlite3.connect('market.db').execute(\"SELECT SUM(i.quantity * i.unit_price) FROM orders o JOIN order_items i ON i.order_id = o.id WHERE o.status = 'shipped' GROUP BY o.id\")]\nexp = statistics.median(v)\ngot = median_order_value('market.db', 'shipped')\nassert abs(got - exp) < 1e-6, 'Expected %r, got %r.' % (exp, got)", MARKET_B, false),
        script('No matching orders gives None', "assert median_order_value('market.db', 'lost') is None", MARKET, false),
      ],
      xpReward: 110, coinReward: 16,
    },
  ],
};
