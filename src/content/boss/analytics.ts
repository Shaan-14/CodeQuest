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
];
