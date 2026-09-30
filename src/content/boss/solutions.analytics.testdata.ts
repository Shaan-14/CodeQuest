/**
 * TEST-ONLY DATA (never imported by the app): reference solutions and wrong attempts for the Phase 5 boss problems that run in
 * Python/SQLite (the analytics mastery boss and its Summit route). No imports; Python in String.raw.
 */
const r = String.raw;
const CITY = (sql: string, tail = '') => r`import sqlite3, statistics
def city_report(db_path):
    rows = sqlite3.connect(db_path).execute("${sql}").fetchall()
    by = {}
    for city, t in rows:
        by.setdefault(city, []).append(t)
    out = {}
    for city, v in by.items():
        out[city] = {'customers': len(v), 'mean': round(sum(v) / len(v), 2), 'spread': ${tail || 'round(statistics.stdev(v), 2) if len(v) > 1 else None'}}
    return out`;
const CITY_SQL = "SELECT COALESCE(c.city, 'unknown'), SUM(i.quantity * i.unit_price) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid' GROUP BY c.id";
const TYPE = (sql: string, rate = 'round(bad / made, 4) if made else 0.0', worst = 'rates[0][1]') => r`import sqlite3
def type_report(db_path):
    rows = sqlite3.connect(db_path).execute("${sql}").fetchall()
    by = {}
    for kind, name, made, bad in rows:
        by.setdefault(kind, []).append((name, made, bad))
    out = {}
    for kind, ms in by.items():
        made = sum(m for _, m, _ in ms)
        bad = sum(b for _, _, b in ms)
        rates = sorted((-(b / m if m else 0.0), n) for n, m, b in ms)
        out[kind] = {'machines': len(ms), 'defect_rate': ${rate}, 'worst': ${worst}}
    return out`;
const TYPE_SQL = "SELECT m.machine_type, m.name, SUM(r.units_made), SUM(r.units_defective) FROM machines m JOIN production_runs r ON r.machine_id = m.id WHERE r.units_defective IS NOT NULL GROUP BY m.id";


const BOARD_SQL = "SELECT c.name, COALESCE(c.city, 'unknown'), COUNT(DISTINCT o.id), SUM(i.quantity * i.unit_price) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid' GROUP BY c.id";
const BOARD = (o: { top?: string; sql?: string; out?: string; corr?: string } = {}) => r`import sqlite3, statistics, math
def _med(x):
    n = len(x)
    return x[n // 2] if n % 2 else (x[n // 2 - 1] + x[n // 2]) / 2
def board_report(db_path):
    rows = sqlite3.connect(db_path).execute("${o.sql ?? BOARD_SQL}").fetchall()
    by = {}
    for _, city, _, t in rows:
        by.setdefault(city, []).append(t)
    ${o.top ?? 'cities = sorted((-statistics.median(v), city) for city, v in by.items() if len(v) >= 2)\n    top = cities[0][1] if cities else None'}
    pairs = [(n, t) for n, _, _, t in rows]
    unusual = []
    if len(pairs) >= 4:
        v = sorted(t for _, t in pairs)
        n = len(v)
        q1, q3 = _med(v[: n // 2]), _med(v[n // 2 + n % 2 :])
        ${o.out ?? 'lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)\n        unusual = sorted(nm for nm, t in pairs if t < lo or t > hi)'}
    xs = [k for _, _, k, _ in rows]
    ys = [t for _, _, _, t in rows]
    r = None
    if len(rows) >= 2:
        mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
        sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
        sy = math.sqrt(sum((y - my) ** 2 for y in ys))
        ${o.corr ?? 'r = None if sx == 0 or sy == 0 else round(sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy), 3)'}
    return {'paying_customers': len(rows), 'top_city': top, 'unusual': unusual, 'orders_vs_spend': r}`;
const OUTAGE = (o: { costed?: string; grouped?: boolean; kind?: string; out?: string; corr?: string; kindsort?: string; ties?: string; rowsql?: string } = {}) => r`import sqlite3, math
def _med(x):
    n = len(x)
    return x[n // 2] if n % 2 else (x[n // 2 - 1] + x[n // 2]) / 2
def outage_board(db_path):
    c = sqlite3.connect(db_path)
    rows = c.execute("${o.rowsql ?? 'SELECT m.name, SUM(e.downtime_hours) FROM machines m JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id'}").fetchall()
    kinds = c.execute("${o.kind ?? 'SELECT kind, SUM(downtime_hours) FROM maintenance_events GROUP BY kind'}").fetchall()
    ranked = ${o.ties ?? o.kindsort ?? 'sorted((-t, k) for k, t in kinds)'}
    worst = ranked[0][1] if ranked else None
    unusual = []
    if len(rows) >= 4:
        v = sorted(t for _, t in rows)
        n = len(v)
        q1, q3 = _med(v[: n // 2]), _med(v[n // 2 + n % 2 :])
        ${o.out ?? 'lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)\n        unusual = sorted(nm for nm, t in rows if t < lo or t > hi)'}
    costed = c.execute("${o.costed ?? 'SELECT SUM(downtime_hours), SUM(cost) FROM maintenance_events WHERE cost IS NOT NULL GROUP BY machine_id'}").fetchall()
    xs = [a for a, _ in costed]
    ys = [b for _, b in costed]
    r = None
    if len(xs) >= 2:
        mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
        sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
        sy = math.sqrt(sum((y - my) ** 2 for y in ys))
        ${o.corr ?? 'r = None if sx == 0 or sy == 0 else round(sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy), 3)'}
    return {'machines_with_events': len(rows), 'worst_kind': worst, 'unusual': unusual, 'downtime_vs_cost': r}`;

export const bossAnalyticsSolutions: Record<string, { valid: string[]; wrong: string[] }> = {
  'boss-an-mastery-a': {
    valid: [CITY(CITY_SQL), r`import sqlite3, statistics
def city_report(db_path):
    db = sqlite3.connect(db_path)
    totals = {}
    for cid, city, amount in db.execute("SELECT c.id, c.city, i.quantity * i.unit_price FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid'"):
        key = city if city is not None else 'unknown'
        totals.setdefault(key, {}).setdefault(cid, 0)
        totals[key][cid] += amount
    out = {}
    for city, per in totals.items():
        v = list(per.values())
        out[city] = {'customers': len(v), 'mean': round(statistics.mean(v), 2), 'spread': round(statistics.stdev(v), 2) if len(v) >= 2 else None}
    return out`],
    wrong: [
      CITY(CITY_SQL.replace("WHERE o.status = 'paid'", '')),
      CITY(CITY_SQL, 'round(statistics.pstdev(v), 2) if len(v) > 1 else None'),
      CITY(CITY_SQL.replace("COALESCE(c.city, 'unknown')", 'c.city').replace("WHERE o.status = 'paid'", "WHERE o.status = 'paid' AND c.city IS NOT NULL")),
      CITY(CITY_SQL, 'round(statistics.stdev(v), 2) if len(v) > 1 else 0.0'),
      CITY(CITY_SQL.replace('GROUP BY c.id', 'GROUP BY o.id')),
      CITY(CITY_SQL, 'round(statistics.stdev(v), 2) if len(v) > 2 else None'),
      r`import sqlite3, statistics
def city_report(db_path):
    rows = sqlite3.connect(db_path).execute("${CITY_SQL}").fetchall()
    by = {}
    for city, t in rows:
        by.setdefault(city, []).append(t)
    return {city: {'customers': len(v), 'mean': sum(v) / len(v), 'spread': statistics.stdev(v) if len(v) > 1 else None} for city, v in by.items()}`,
    ],
  },
  'boss-an-mastery-b': {
    valid: [TYPE(TYPE_SQL)],
    wrong: [
      TYPE(TYPE_SQL.replace('WHERE r.units_defective IS NOT NULL', '').replace('SUM(r.units_defective)', 'SUM(COALESCE(r.units_defective, 0))')),
      TYPE(TYPE_SQL, 'round(bad / made, 4) if made else 0.0', 'sorted((n for n, _, _ in ms))[-1]'),
      TYPE(TYPE_SQL, 'round(sum(b / m for _, m, b in ms) / len(ms), 4)'),
      TYPE(TYPE_SQL, 'round(bad / made, 2) if made else 0.0'),
      TYPE(TYPE_SQL, 'round(bad / made, 4) if made else 0.0', 'max(ms, key=lambda x: x[2])[0]'),
      TYPE(TYPE_SQL, 'round(bad / made, 4) if made else 0.0', 'max(ms, key=lambda x: x[2] / x[1])[0]'),
      TYPE(TYPE_SQL.replace('JOIN production_runs', 'LEFT JOIN production_runs').replace('WHERE r.units_defective IS NOT NULL', '')),
    ],
  },

  'boss-an-summit-a': {
    valid: [BOARD(), BOARD({ top: 'cities = sorted((-statistics.median(v), city) for city, v in by.items() if len(v) >= 2)\n    top = cities[0][1] if cities else None' })],
    wrong: [
      BOARD({ top: 'cities = sorted((-statistics.mean(v), city) for city, v in by.items() if len(v) >= 2)\n    top = cities[0][1] if cities else None' }),
      BOARD({ sql: BOARD_SQL.replace("WHERE o.status = 'paid'", '') }),
      BOARD({ out: 'lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)\n    unusual = sorted(n for n, t in pairs if t <= lo or t >= hi)' }),
      BOARD({ sql: BOARD_SQL.replace('COUNT(DISTINCT o.id)', 'COUNT(*)') }),
      BOARD({ top: 'cities = sorted((-statistics.median(v), city) for city, v in by.items())\n    top = cities[0][1] if cities else None' }),
      BOARD({ top: 'cities = sorted((-statistics.median(v), -ord(city[0])) for city, v in by.items() if len(v) >= 2)\n    top = None if not cities else [c for c in by if -ord(c[0]) == cities[0][1]][0]' }),
      BOARD({ corr: 'return None if sx == 0 or sy == 0 else sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy)' }),
      BOARD({ out: 'lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)\n    unusual = [n for n, t in pairs if t < lo or t > hi]' }),
    ],
  },
  'boss-an-summit-b': {
    valid: [OUTAGE()],
    wrong: [
      OUTAGE({ costed: 'SELECT SUM(downtime_hours), SUM(COALESCE(cost, 0)) FROM maintenance_events GROUP BY machine_id' }),
      OUTAGE({ kind: "SELECT kind, COUNT(*) FROM maintenance_events GROUP BY kind" }),
      OUTAGE({ out: 'lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)\n    unusual = sorted(n for n, t in rows if t <= lo or t >= hi)' }),
      OUTAGE({ corr: 'return None if sx == 0 or sy == 0 else sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy)' }),
      OUTAGE({ kindsort: 'sorted((-t, k) for k, t in kinds)', ties: 'sorted(((-t, k) for k, t in kinds), reverse=True)' }),
      OUTAGE({ rowsql: 'SELECT m.name, SUM(e.downtime_hours) FROM machines m LEFT JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id' }),
    ],
  },
};
