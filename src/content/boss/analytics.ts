import type { Challenge, Check } from '../schema';
import { bossChallenge } from './helpers';

const MARKET = { databases: ['market'] };
const MARKET_B = { databases: ['market-b:market'] };
const WORKS = { databases: ['works'] };
const WORKS_B = { databases: ['works-b:works'] };
type Fx = { databases: string[] };
const hidden = (name: string, code: string, fx?: Fx): Check => ({ kind: 'script', name, code, visible: false, ...(fx ?? {}) });

/** Shared by every check. Names are namespaced so they can never collide with the player's own helpers. */
const CMP = `def _rf_same(a, b):
    if isinstance(a, float) or isinstance(b, float):
        return a is not None and b is not None and abs(a - b) < 1e-9
    if isinstance(a, dict) and isinstance(b, dict):
        return set(a) == set(b) and all(_rf_same(a[k], b[k]) for k in a)
    return a == b
def _rf_check(got, exp, places):
    assert _rf_same(got, exp), 'Expected %r but got %r.' % (exp, got)
    def walk(x):
        if isinstance(x, float):
            assert x == round(x, places), 'Round to %d decimals as the brief says: %r.' % (places, x)
        elif isinstance(x, dict):
            for v in x.values():
                walk(v)
    walk(got)
`;
const MARKET_BUILD = `import sqlite3, os
def _rf_market(spec):
    if os.path.exists('m.db'):
        os.remove('m.db')
    c = sqlite3.connect('m.db')
    c.executescript("CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT, joined_on TEXT); CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, ordered_on TEXT, status TEXT NOT NULL); CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL, product_id INTEGER, quantity INTEGER NOT NULL, unit_price REAL NOT NULL);")
    oid = 0
    for i, (name, city, orders) in enumerate(spec):
        c.execute("INSERT INTO customers (id, name, city) VALUES (?, ?, ?)", (i + 1, name, city))
        for status, amount in orders:
            oid += 1
            c.execute("INSERT INTO orders (id, customer_id, status) VALUES (?, ?, ?)", (oid, i + 1, status))
            c.execute("INSERT INTO order_items (order_id, quantity, unit_price) VALUES (?, 1, ?)", (oid, amount))
    c.commit()
    c.close()
    return 'm.db'
`;
const WORKS_BUILD = `import sqlite3, os
def _rf_works(spec):
    if os.path.exists('w.db'):
        os.remove('w.db')
    c = sqlite3.connect('w.db')
    c.executescript("CREATE TABLE machines (id INTEGER PRIMARY KEY, name TEXT NOT NULL, machine_type TEXT NOT NULL, department_id INTEGER, purchase_cost REAL, installed_on TEXT); CREATE TABLE production_runs (id INTEGER PRIMARY KEY, machine_id INTEGER NOT NULL, operator_id INTEGER, product_id INTEGER, run_date TEXT, units_made INTEGER NOT NULL, units_defective INTEGER, hours REAL NOT NULL DEFAULT 1);")
    for i, (name, kind, runs) in enumerate(spec):
        c.execute("INSERT INTO machines (id, name, machine_type) VALUES (?, ?, ?)", (i + 1, name, kind))
        for made, bad in runs:
            c.execute("INSERT INTO production_runs (machine_id, units_made, units_defective) VALUES (?, ?, ?)", (i + 1, made, bad))
    c.commit()
    c.close()
    return 'w.db'
`;
const CITY_REF = `import statistics
def _rf_city(db):
    rows = sqlite3.connect(db).execute("SELECT COALESCE(c.city, 'unknown'), SUM(i.quantity * i.unit_price) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid' GROUP BY c.id").fetchall()
    by = {}
    for city, t in rows:
        by.setdefault(city, []).append(t)
    return {city: {'customers': len(v), 'mean': round(sum(v) / len(v), 2), 'spread': round(statistics.stdev(v), 2) if len(v) > 1 else None} for city, v in by.items()}
`;
const TYPE_REF = `def _rf_type(db):
    rows = sqlite3.connect(db).execute("SELECT m.machine_type, m.name, SUM(r.units_made), SUM(r.units_defective) FROM machines m JOIN production_runs r ON r.machine_id = m.id WHERE r.units_defective IS NOT NULL GROUP BY m.id").fetchall()
    by = {}
    for kind, name, made, bad in rows:
        by.setdefault(kind, []).append((name, made, bad))
    out = {}
    for kind, ms in by.items():
        made = sum(m for _, m, _ in ms)
        bad = sum(b for _, _, b in ms)
        rates = sorted((-(b / m if m else 0.0), n) for n, m, b in ms)
        out[kind] = {'machines': len(ms), 'defect_rate': round(bad / made, 4) if made else 0.0, 'worst': rates[0][1]}
    return out
`;


const BOARD_REF = `import statistics, math
def _rf_med(x):
    n = len(x)
    return x[n // 2] if n % 2 else (x[n // 2 - 1] + x[n // 2]) / 2
def _rf_out(pairs):
    v = sorted(t for _, t in pairs)
    if len(v) < 4:
        return []
    n = len(v)
    q1, q3 = _rf_med(v[: n // 2]), _rf_med(v[n // 2 + n % 2 :])
    lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
    return sorted(nm for nm, t in pairs if t < lo or t > hi)
def _rf_r(xs, ys):
    n = len(xs)
    if n < 2:
        return None
    mx, my = sum(xs) / n, sum(ys) / n
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return None if sx == 0 or sy == 0 else round(sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy), 3)
def _rf_board(db):
    c = sqlite3.connect(db)
    rows = c.execute("SELECT c.id, c.name, COALESCE(c.city, 'unknown'), COUNT(DISTINCT o.id), SUM(i.quantity * i.unit_price) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid' GROUP BY c.id").fetchall()
    by = {}
    for _, _, city, _, t in rows:
        by.setdefault(city, []).append(t)
    cities = sorted((-statistics.median(v), city) for city, v in by.items() if len(v) >= 2)
    return {'paying_customers': len(rows), 'top_city': cities[0][1] if cities else None, 'unusual': _rf_out([(n, t) for _, n, _, _, t in rows]), 'orders_vs_spend': _rf_r([k for _, _, _, k, _ in rows], [t for _, _, _, _, t in rows])}
`;
const OUTAGE_REF = `import statistics, math
def _rf_med(x):
    n = len(x)
    return x[n // 2] if n % 2 else (x[n // 2 - 1] + x[n // 2]) / 2
def _rf_out(pairs):
    v = sorted(t for _, t in pairs)
    if len(v) < 4:
        return []
    n = len(v)
    q1, q3 = _rf_med(v[: n // 2]), _rf_med(v[n // 2 + n % 2 :])
    lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
    return sorted(nm for nm, t in pairs if t < lo or t > hi)
def _rf_r(xs, ys):
    n = len(xs)
    if n < 2:
        return None
    mx, my = sum(xs) / n, sum(ys) / n
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return None if sx == 0 or sy == 0 else round(sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy), 3)
def _rf_outage(db):
    c = sqlite3.connect(db)
    rows = c.execute("SELECT m.name, SUM(e.downtime_hours) FROM machines m JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id").fetchall()
    kinds = sorted((-t, k) for k, t in c.execute("SELECT kind, SUM(downtime_hours) FROM maintenance_events GROUP BY kind").fetchall())
    costed = c.execute("SELECT SUM(downtime_hours), SUM(cost) FROM maintenance_events WHERE cost IS NOT NULL GROUP BY machine_id").fetchall()
    return {'machines_with_events': len(rows), 'worst_kind': kinds[0][1] if kinds else None, 'unusual': _rf_out(rows), 'downtime_vs_cost': _rf_r([a for a, _ in costed], [b for _, b in costed])}
`;
const WORKS_EVENTS_BUILD = `import sqlite3, os
def _rf_events(spec):
    if os.path.exists('e.db'):
        os.remove('e.db')
    c = sqlite3.connect('e.db')
    c.executescript("CREATE TABLE machines (id INTEGER PRIMARY KEY, name TEXT NOT NULL, machine_type TEXT, department_id INTEGER, purchase_cost REAL, installed_on TEXT); CREATE TABLE maintenance_events (id INTEGER PRIMARY KEY, machine_id INTEGER NOT NULL, technician_id INTEGER, event_date TEXT, kind TEXT NOT NULL, downtime_hours REAL NOT NULL, cost REAL);")
    for i, (name, events) in enumerate(spec):
        c.execute("INSERT INTO machines (id, name) VALUES (?, ?)", (i + 1, name))
        for kind, hours, cost in events:
            c.execute("INSERT INTO maintenance_events (machine_id, kind, downtime_hours, cost) VALUES (?, ?, ?, ?)", (i + 1, kind, hours, cost))
    c.commit()
    c.close()
    return 'e.db'
`;
const BOARD_CHECK = (fn: string, ref: string) => `got = ${fn}(DB)\nexp = ${ref}(DB)\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`;

export const analyticsBossChallenges: Challenge[] = [
  bossChallenge({
    id: 'boss-an-mastery-a', title: 'Mastery Trial: The Regional Desk', language: 'python', skillIds: ['de.analytics', 'sql.aggregate', 'stat.spread', 'stat.descriptive'], difficulty: 4, context: 'retail analytics', project: true,
    fixtures: MARKET,
    boss: { bossId: 'mastery-analytics', version: 'a' },
    prompt: 'The market’s regional manager wants to compare cities. Write `city_report(db_path)` for `market.db`. A customer’s **spend** is the sum of `quantity * unit_price` over their **paid** orders only; customers with no paid order are ignored. Customers whose city is unknown (`NULL`) belong to the city `"unknown"`.\n\nReturn a dictionary with one entry per city that has at least one such customer: the key is the city and the value is a dictionary with `"customers"` (how many customers), `"mean"` (their mean spend) and `"spread"` (their **sample** standard deviation, n − 1; `None` when the city has only one customer). Round `mean` and `spread` to **2 decimals**. An empty database gives `{}`.',
    checks: [
      hidden('The market, city by city', `import sqlite3\n${CMP}${CITY_REF}_rf_check(city_report('market.db'), _rf_city('market.db'), 2)`, MARKET),
      hidden('Different data', `import sqlite3\n${CMP}${CITY_REF}_rf_check(city_report('market.db'), _rf_city('market.db'), 2)`, MARKET_B),
      hidden('Unknown cities, single customers and unpaid orders', `${MARKET_BUILD}${CMP}${CITY_REF}db = _rf_market([('Ann', None, [('paid', 10), ('paid', 30)]), ('Bo', None, [('paid', 20)]), ('Cy', 'Ely', [('paid', 50), ('cancelled', 999)]), ('Di', 'Ely', [('paid', 70)]), ('Ed', 'Hull', [('shipped', 40)]), ('Flo', 'Hull', []), ('Gus', 'York', [('paid', 5)])])
got = city_report(db)\nexp = _rf_city(db)\nassert exp['unknown'] == {'customers': 2, 'mean': 30.0, 'spread': 14.14} and exp['York']['spread'] is None and 'Hull' not in exp\n_rf_check(got, exp, 2)`),
      hidden('An empty database', `${MARKET_BUILD}assert city_report(_rf_market([])) == {}, 'No customers gives {}.'`),
    ],
  }),
  bossChallenge({
    id: 'boss-an-mastery-b', title: 'Mastery Trial: The Quality Board', language: 'python', skillIds: ['de.analytics', 'sql.aggregate', 'stat.spread', 'stat.descriptive'], difficulty: 4, context: 'quality engineering', project: true,
    fixtures: WORKS,
    boss: { bossId: 'mastery-analytics', version: 'b' },
    prompt: 'The quality board compares kinds of machine. Write `type_report(db_path)` for `works.db`. Only production runs whose `units_defective` is **known (not NULL)** count. A machine’s defect rate is its total defective units divided by its total units made over those runs.\n\nReturn a dictionary with one entry per `machine_type` that has at least one machine with such runs: the value is a dictionary with `"machines"` (how many machines of that type have such runs), `"defect_rate"` (the type’s total defective divided by its total made, rounded to **4 decimals**) and `"worst"` (the **name** of the machine with the highest defect rate; ties go to the name that comes first alphabetically). An empty database gives `{}`.',
    checks: [
      hidden('The works, type by type', `import sqlite3\n${CMP}${TYPE_REF}_rf_check(type_report('works.db'), _rf_type('works.db'), 4)`, WORKS),
      hidden('Different data', `import sqlite3\n${CMP}${TYPE_REF}_rf_check(type_report('works.db'), _rf_type('works.db'), 4)`, WORKS_B),
      hidden('Unknown defect counts, ties and idle machines', `${WORKS_BUILD}${CMP}${TYPE_REF}db = _rf_works([('Zed', 'Press', [(100, 5), (100, None)]), ('Amy', 'Press', [(50, 2), (50, 3)]), ('Bob', 'Lathe', [(10, None)]), ('Dan', 'Mill', [(200, 0)]), ('Cat', 'Mill', [(200, 0)]), ('Eve', 'Weld', [])])
got = type_report(db)\nexp = _rf_type(db)\nassert 'Lathe' not in exp and 'Weld' not in exp and exp['Mill']['worst'] == 'Cat'\n_rf_check(got, exp, 4)`),
      hidden('An empty database', `${WORKS_BUILD}assert type_report(_rf_works([])) == {}, 'No machines gives {}.'`),
    ],
  }),
  bossChallenge({
    id: 'boss-an-summit-a', title: 'The Summit Trial: The Market Board', language: 'python', skillIds: ['de.analytics', 'sql.aggregate', 'stat.spread', 'stat.correlation'], difficulty: 5, context: 'retail operations', project: true,
    fixtures: MARKET,
    boss: { bossId: 'summit', version: 'analytics-a' },
    prompt: 'After the Great Outage the market’s board wants one report. Write `board_report(db_path)` for `market.db`. A customer **spends** the sum of `quantity * unit_price` over their **paid** orders; customers with no paid order are ignored everywhere below. A customer with no known city belongs to the city `"unknown"`.\n\nReturn a dictionary with exactly these keys:\n\n`"paying_customers"`: how many customers spent anything.\n`"top_city"`: the city with the highest **median** customer spend among cities that have at least 2 paying customers (alphabetically first on a tie), or `None` if no city has 2.\n`"unusual"`: a sorted list of the names of customers whose spend lies **outside the IQR fences** (below `Q1 − 1.5 × IQR` or above `Q3 + 1.5 × IQR`; quartiles are the medians of the lower and upper halves of the sorted spends, the middle value of an odd count belonging to neither half), or `[]` with fewer than 4 paying customers.\n`"orders_vs_spend"`: Pearson’s correlation, rounded to **3 decimals**, between each paying customer’s **number of paid orders** and their spend, or `None` when it is undefined (fewer than 2 customers, or no variation in either).',
    checks: [
      hidden('The market board', `import sqlite3\n${BOARD_REF}${BOARD_CHECK('board_report', '_rf_board').replaceAll('DB', "'market.db'")}`, MARKET),
      hidden('Different data', `import sqlite3\n${BOARD_REF}${BOARD_CHECK('board_report', '_rf_board').replaceAll('DB', "'market.db'")}`, MARKET_B),
      hidden('Medians, ties, outliers and order counts', `${MARKET_BUILD}${BOARD_REF}db = _rf_market([('Ann', 'Ely', [('paid', 10), ('paid', 10)]), ('Bo', 'Ely', [('paid', 50)]), ('Cy', 'Hull', [('paid', 40)]), ('Di', 'Hull', [('paid', 40)]), ('Ed', None, [('paid', 1000), ('cancelled', 5)]), ('Flo', 'York', [('paid', 15), ('paid', 15), ('paid', 15)]), ('Gus', 'York', [('paid', 25)]), ('Hal', 'Bath', [('shipped', 70)])])\nexp = _rf_board(db)\nassert exp['top_city'] == 'Hull' and exp['unusual'] == ['Ed'] and exp['paying_customers'] == 7\ngot = board_report(db)\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`),
      hidden('A tie between cities goes to the first name', `${MARKET_BUILD}${BOARD_REF}db = _rf_market([('A1', 'York', [('paid', 45)]), ('A2', 'York', [('paid', 25)]), ('B1', 'Ely', [('paid', 20)]), ('B2', 'Ely', [('paid', 50)]), ('C1', 'Hull', [('paid', 10)]), ('C2', 'Hull', [('paid', 10)])])\nexp = _rf_board(db)\nassert exp['top_city'] == 'Ely'\ngot = board_report(db)\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`),
      hidden('The median, not the mean, ranks the cities', `${MARKET_BUILD}${BOARD_REF}db = _rf_market([('P1', 'Skewed', [('paid', 10)]), ('P2', 'Skewed', [('paid', 10)]), ('P3', 'Skewed', [('paid', 100)]), ('Q1', 'Steady', [('paid', 30)]), ('Q2', 'Steady', [('paid', 30)]), ('Q3', 'Steady', [('paid', 30)])])\nexp = _rf_board(db)\nassert exp['top_city'] == 'Steady'\ngot = board_report(db)\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`),
      hidden('Nothing to report', `${MARKET_BUILD}${BOARD_REF}db = _rf_market([('Solo', 'Ely', [('open', 10)])])\nassert board_report(db) == {'paying_customers': 0, 'top_city': None, 'unusual': [], 'orders_vs_spend': None}, 'Got %r.' % (board_report(db),)\ndb2 = _rf_market([('A', 'X', [('paid', 5)]), ('B', 'Y', [('paid', 5)])])\nassert board_report(db2) == {'paying_customers': 2, 'top_city': None, 'unusual': [], 'orders_vs_spend': None}, 'Got %r.' % (board_report(db2),)`),
    ],
  }),
  bossChallenge({
    id: 'boss-an-summit-b', title: 'The Summit Trial: The Works Board', language: 'python', skillIds: ['de.analytics', 'sql.aggregate', 'stat.spread', 'stat.correlation'], difficulty: 5, context: 'industrial operations', project: true,
    fixtures: WORKS,
    boss: { bossId: 'summit', version: 'analytics-b' },
    prompt: 'The Works must explain the Great Outage. Write `outage_board(db_path)` for `works.db`. Use the maintenance events only.\n\nReturn a dictionary with exactly these keys:\n\n`"machines_with_events"`: how many machines have at least one maintenance event.\n`"worst_kind"`: the event `kind` with the largest **total downtime hours** over all events (alphabetically first on a tie), or `None` if there are no events.\n`"unusual"`: a sorted list of the names of machines whose **total downtime hours** lie **outside the IQR fences** (below `Q1 − 1.5 × IQR` or above `Q3 + 1.5 × IQR`; quartiles are the medians of the lower and upper halves of the sorted totals, the middle total of an odd count belonging to neither half), or `[]` with fewer than 4 machines.\n`"downtime_vs_cost"`: Pearson’s correlation, rounded to **3 decimals**, between each machine’s total downtime hours and its total cost, counting **only events whose cost is known** (machines with no costed event are left out), or `None` when it is undefined (fewer than 2 machines, or no variation in either).',
    checks: [
      hidden('The works board', `import sqlite3\n${OUTAGE_REF}${BOARD_CHECK('outage_board', '_rf_outage').replaceAll('DB', "'works.db'")}`, WORKS),
      hidden('Different data', `import sqlite3\n${OUTAGE_REF}${BOARD_CHECK('outage_board', '_rf_outage').replaceAll('DB', "'works.db'")}`, WORKS_B),
      hidden('Ties, unknown costs and an extreme machine', `${WORKS_EVENTS_BUILD}${OUTAGE_REF}db = _rf_events([('M1', [('repair', 10, 100.0), ('routine', 2, None)]), ('M2', [('routine', 12, 120.0)]), ('M3', [('inspection', 11, 110.0), ('routine', 1, 10.0)]), ('M4', [('repair', 12, 130.0)]), ('M5', [('repair', 6, 60.0), ('repair', 6, 60.0)]), ('M6', [('inspection', 12, 120.0)]), ('M7', [('repair', 500, 900.0)]), ('M8', [])])\nexp = _rf_outage(db)\nassert exp['unusual'] == ['M7'] and exp['machines_with_events'] == 7 and exp['worst_kind'] == 'repair'\ngot = outage_board(db)\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`),
      hidden('Kinds that tie go to the first name', `${WORKS_EVENTS_BUILD}${OUTAGE_REF}db = _rf_events([('A', [('y', 5, 1.0), ('x', 5, 2.0)]), ('B', [('y', 1, 3.0)])])\nexp = _rf_outage(db)\nassert exp['worst_kind'] == 'y'\ngot = outage_board(db)\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`),
      hidden('Downtime hours, not the number of events, rank the kinds', `${WORKS_EVENTS_BUILD}${OUTAGE_REF}db = _rf_events([('A', [('big', 100, 10.0), ('small', 1, 1.0), ('small', 1, 1.0)]), ('B', [('small', 1, 1.0)])])\nexp = _rf_outage(db)\nassert exp['worst_kind'] == 'big'\ngot = outage_board(db)\nassert got == exp, 'Expected %r but got %r.' % (exp, got)`),
      hidden('Nothing to report', `${WORKS_EVENTS_BUILD}${OUTAGE_REF}assert outage_board(_rf_events([('M1', [])])) == {'machines_with_events': 0, 'worst_kind': None, 'unusual': [], 'downtime_vs_cost': None}, 'Got %r.' % (outage_board('e.db'),)\nd = _rf_events([('A', [('repair', 3, 10.0)]), ('B', [('repair', 4, 10.0)])])\nassert outage_board(d)['downtime_vs_cost'] is None, 'No variation in cost means r is undefined.'`),
    ],
  }),
];
