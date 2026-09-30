/**
 * TEST-ONLY DATA (never imported by the app): reference solutions and wrong attempts for the cross-world analytics lesson
 * (SQL + Python + statistics). No imports; Python written with String.raw.
 */
const r = String.raw;
const MED = r`def _med(x):
    n = len(x)
    return x[n // 2] if n % 2 else (x[n // 2 - 1] + x[n // 2]) / 2
def _fence(vals, strict=True):
    vals = sorted(vals)
    n = len(vals)
    q1 = _med(vals[: n // 2])
    q3 = _med(vals[n // 2 + n % 2 :])
    iqr = q3 - q1
    return q1 - 1.5 * iqr, q3 + 1.5 * iqr
`;
const machines = (body: string) => r`import sqlite3
${MED}
def unusual_machines(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT m.name, SUM(e.downtime_hours) FROM machines m JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id").fetchall()
${body}
`;
const customers = (body: string) => r`import sqlite3
${MED}
def unusual_customers(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT c.name, SUM(i.quantity * i.unit_price) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid' GROUP BY c.id").fetchall()
${body}
`;
const OK = r`    if len(rows) < 4:
        return []
    lo, hi = _fence([t for _, t in rows])
    return sorted(n for n, t in rows if t < lo or t > hi)`;
export const solutionsAnalytics: Record<string, { valid: string[]; wrong: string[] }> = {
  'de-10-spend-summary': {
    valid: [r`import sqlite3
import statistics
def spend_summary(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT SUM(i.quantity * i.unit_price) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid' GROUP BY c.id").fetchall()
    v = [x[0] for x in rows]
    if not v:
        return {}
    return {"customers": len(v), "mean": round(statistics.mean(v), 2), "median": round(statistics.median(v), 2)}`],
    wrong: [r`import sqlite3
import statistics
def spend_summary(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT SUM(i.quantity * i.unit_price) FROM orders o JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid' GROUP BY o.id").fetchall()
    v = [x[0] for x in rows]
    if not v:
        return {}
    return {"customers": len(v), "mean": round(statistics.mean(v), 2), "median": round(statistics.median(v), 2)}`, r`import sqlite3
import statistics
def spend_summary(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT SUM(i.quantity * i.unit_price) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id GROUP BY c.id").fetchall()
    v = [x[0] for x in rows]
    if not v:
        return {}
    return {"customers": len(v), "mean": round(statistics.mean(v), 2), "median": round(statistics.median(v), 2)}`, r`import sqlite3
import statistics
def spend_summary(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT SUM(i.quantity * i.unit_price) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid' GROUP BY c.id").fetchall()
    v = [x[0] for x in rows]
    if not v:
        return {}
    return {"customers": len(v), "mean": statistics.mean(v), "median": statistics.median(v)}`, r`import sqlite3
import statistics
def spend_summary(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT SUM(i.quantity * i.unit_price) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status = 'paid' GROUP BY c.id").fetchall()
    v = [x[0] for x in rows]
    return {"customers": len(v), "mean": round(statistics.mean(v), 2), "median": round(statistics.median(v), 2)}`],
  },
  'de-10-unusual-machines': {
    valid: [machines(OK)],
    wrong: [machines(r`    if len(rows) < 4:
        return []
    lo, hi = _fence([t for _, t in rows])
    return sorted(n for n, t in rows if t <= lo or t >= hi)`), machines(r`    m = sum(t for _, t in rows) / len(rows)
    sd = (sum((t - m) ** 2 for _, t in rows) / len(rows)) ** 0.5
    return sorted(n for n, t in rows if abs(t - m) > 2 * sd)`), machines(r`    if len(rows) < 4:
        return []
    lo, hi = _fence([t for _, t in rows])
    return [n for n, t in rows if t < lo or t > hi]`), machines(r`    lo, hi = _fence([t for _, t in rows])
    return sorted(n for n, t in rows if t < lo or t > hi)`), r`import sqlite3
${'' /* all machines, zero for no events */}
def unusual_machines(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT m.name, COALESCE(SUM(e.downtime_hours), 0) FROM machines m LEFT JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id").fetchall()
    def med(x):
        n = len(x)
        return x[n // 2] if n % 2 else (x[n // 2 - 1] + x[n // 2]) / 2
    s = sorted(t for _, t in rows)
    n = len(s)
    if n < 4:
        return []
    q1 = med(s[: n // 2])
    q3 = med(s[n // 2 + n % 2 :])
    lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
    return sorted(nm for nm, t in rows if t < lo or t > hi)`],
  },
  'de-10-unusual-customers': {
    valid: [customers(OK)],
    wrong: [customers(r`    if len(rows) < 4:
        return []
    lo, hi = _fence([t for _, t in rows])
    return sorted(n for n, t in rows if t <= lo or t >= hi)`), customers(r`    if len(rows) < 4:
        return []
    lo, hi = _fence([t for _, t in rows])
    return sorted(n for n, t in rows if t > hi)`), customers(r`    if len(rows) < 4:
        return []
    lo, hi = _fence([t for _, t in rows])
    return [n for n, t in rows if t < lo or t > hi]`), r`import sqlite3
def unusual_customers(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT c.name, SUM(i.quantity * i.unit_price) FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id GROUP BY c.id").fetchall()
    def med(x):
        n = len(x)
        return x[n // 2] if n % 2 else (x[n // 2 - 1] + x[n // 2]) / 2
    s = sorted(t for _, t in rows)
    n = len(s)
    if n < 4:
        return []
    q1 = med(s[: n // 2])
    q3 = med(s[n // 2 + n % 2 :])
    lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
    return sorted(nm for nm, t in rows if t < lo or t > hi)`],
  },
  'de-10-speed-relationship': {
    valid: [r`import sqlite3, math
def output_vs_hours(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT SUM(units_made), SUM(hours) FROM production_runs GROUP BY machine_id").fetchall()
    n = len(rows)
    if n < 2:
        return None
    xs = [a for a, _ in rows]
    ys = [b for _, b in rows]
    mx, my = sum(xs) / n, sum(ys) / n
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if sx == 0 or sy == 0:
        return None
    return round(sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy), 3)`, r`import sqlite3, statistics
def output_vs_hours(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT SUM(units_made), SUM(hours) FROM production_runs GROUP BY machine_id").fetchall()
    if len(rows) < 2:
        return None
    try:
        return round(statistics.correlation([a for a, _ in rows], [b for _, b in rows]), 3)
    except statistics.StatisticsError:
        return None`],
    wrong: [r`import sqlite3, statistics
def output_vs_hours(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT units_made, hours FROM production_runs").fetchall()
    return round(statistics.correlation([a for a, _ in rows], [b for _, b in rows]), 3)`, r`import sqlite3, statistics
def output_vs_hours(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT AVG(units_made), AVG(hours) FROM production_runs GROUP BY machine_id").fetchall()
    if len(rows) < 2:
        return None
    return round(statistics.correlation([a for a, _ in rows], [b for _, b in rows]), 3)`, r`import sqlite3, statistics
def output_vs_hours(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT SUM(units_made), SUM(hours) FROM production_runs GROUP BY machine_id").fetchall()
    if len(rows) < 2:
        return None
    return statistics.correlation([a for a, _ in rows], [b for _, b in rows])`, r`import sqlite3, statistics
def output_vs_hours(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT SUM(units_made), SUM(hours) FROM production_runs GROUP BY machine_id").fetchall()
    return round(abs(statistics.correlation([a for a, _ in rows], [b for _, b in rows])), 3)`],
  },
  'de-10-price-relationship': {
    valid: [r`import sqlite3, math
def price_vs_quantity(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT p.price, SUM(i.quantity) FROM products p JOIN order_items i ON i.product_id = p.id GROUP BY p.id").fetchall()
    n = len(rows)
    if n < 2:
        return None
    xs = [a for a, _ in rows]
    ys = [b for _, b in rows]
    mx, my = sum(xs) / n, sum(ys) / n
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if sx == 0 or sy == 0:
        return None
    return round(sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy), 3)`],
    wrong: [r`import sqlite3, statistics
def price_vs_quantity(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT p.price, COALESCE(SUM(i.quantity), 0) FROM products p LEFT JOIN order_items i ON i.product_id = p.id GROUP BY p.id").fetchall()
    return round(statistics.correlation([a for a, _ in rows], [b for _, b in rows]), 3)`, r`import sqlite3, statistics
def price_vs_quantity(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT i.unit_price, i.quantity FROM order_items i").fetchall()
    return round(statistics.correlation([a for a, _ in rows], [b for _, b in rows]), 3)`, r`import sqlite3, statistics
def price_vs_quantity(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT p.price, SUM(i.quantity) FROM products p JOIN order_items i ON i.product_id = p.id GROUP BY p.id").fetchall()
    return statistics.correlation([a for a, _ in rows], [b for _, b in rows])`, r`import sqlite3, statistics
def price_vs_quantity(db_path):
    rows = sqlite3.connect(db_path).execute("SELECT p.price, COUNT(*) FROM products p JOIN order_items i ON i.product_id = p.id GROUP BY p.id").fetchall()
    return round(statistics.correlation([a for a, _ in rows], [b for _, b in rows]), 3)`],
  },
};
