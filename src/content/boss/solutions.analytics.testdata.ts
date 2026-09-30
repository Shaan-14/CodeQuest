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
};
