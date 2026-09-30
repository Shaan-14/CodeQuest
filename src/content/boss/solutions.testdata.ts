/**
 * TEST-ONLY DATA (never imported by the app): reference solutions and plausible wrong attempts for Boss challenges
 * that run in Python/SQLite. Web bosses are in solutions.web.testdata.ts.
 */
export const bossSolutions: Record<string, { valid: string[]; wrong: string[] }> = {
  'boss-py-gate-a': {
    valid: [
      'def first_repeat(badges):\n    seen = set()\n    for b in badges:\n        if b in seen:\n            return b\n        seen.add(b)\n    return None\n',
      'def first_repeat(badges):\n    for i, b in enumerate(badges):\n        if b in badges[:i]:\n            return b\n    return None\n',
    ],
    wrong: [
      // the first item that has any duplicate anywhere (not the first to be repeated)
      'def first_repeat(badges):\n    for b in badges:\n        if badges.count(b) > 1:\n            return b\n    return None\n',
      // sorts the caller\'s list
      'def first_repeat(badges):\n    badges.sort()\n    for i in range(1, len(badges)):\n        if badges[i] == badges[i - 1]:\n            return badges[i]\n    return None\n',
      // returns False instead of None
      'def first_repeat(badges):\n    seen = set()\n    for b in badges:\n        if b in seen:\n            return b\n        seen.add(b)\n    return False\n',
    ],
  },
  'boss-py-gate-b': {
    valid: [
      'def first_free(taken):\n    s = set(taken)\n    n = 1\n    while n in s:\n        n += 1\n    return n\n',
      'def first_free(taken):\n    n = 1\n    for t in sorted(set(taken)):\n        if t == n:\n            n += 1\n    return n\n',
    ],
    wrong: [
      // assumes the list is already sorted
      'def first_free(taken):\n    n = 1\n    for t in taken:\n        if t == n:\n            n += 1\n    return n\n',
      // len + 1 fails with gaps
      'def first_free(taken):\n    return len(taken) + 1\n',
      // starts at 0
      'def first_free(taken):\n    n = 0\n    while n in taken:\n        n += 1\n    return n\n',
    ],
  },
  'boss-py-mastery-a': {
    valid: [
      'def analyse(path):\n    counts = {}\n    times = {}\n    errors = set()\n    with open(path) as f:\n        for line in f:\n            parts = [p.strip() for p in line.strip().split("|")]\n            if len(parts) != 3:\n                continue\n            level, service, ms = parts\n            if level not in ("INFO", "WARN", "ERROR") or not service or not ms.isdigit():\n                continue\n            counts[level] = counts.get(level, 0) + 1\n            times.setdefault(service, []).append(int(ms))\n            if level == "ERROR":\n                errors.add(service)\n    slowest = None\n    if times:\n        slowest = sorted(times, key=lambda s: (-sum(times[s]) / len(times[s]), s))[0]\n    return {"counts": counts, "slowest": slowest, "errors": sorted(errors)}\n',
    ],
    wrong: [
      // total instead of average
      'def analyse(path):\n    counts = {}\n    times = {}\n    errors = set()\n    with open(path) as f:\n        for line in f:\n            parts = [p.strip() for p in line.strip().split("|")]\n            if len(parts) != 3:\n                continue\n            level, service, ms = parts\n            if level not in ("INFO", "WARN", "ERROR") or not service or not ms.isdigit():\n                continue\n            counts[level] = counts.get(level, 0) + 1\n            times[service] = times.get(service, 0) + int(ms)\n            if level == "ERROR":\n                errors.add(service)\n    slowest = max(times, key=lambda s: (times[s], s)) if times else None\n    return {"counts": counts, "slowest": slowest, "errors": sorted(errors)}\n',
      // crashes on damaged lines
      'def analyse(path):\n    counts = {}\n    times = {}\n    errors = set()\n    for line in open(path):\n        if not line.strip():\n            continue\n        level, service, ms = line.strip().split("|")\n        counts[level] = counts.get(level, 0) + 1\n        times.setdefault(service, []).append(int(ms))\n        if level == "ERROR":\n            errors.add(service)\n    slowest = max(times, key=lambda s: sum(times[s]) / len(times[s])) if times else None\n    return {"counts": counts, "slowest": slowest, "errors": sorted(errors)}\n',
      // ties broken the wrong way (last name wins)
      'def analyse(path):\n    counts = {}\n    times = {}\n    errors = set()\n    with open(path) as f:\n        for line in f:\n            parts = [p.strip() for p in line.strip().split("|")]\n            if len(parts) != 3:\n                continue\n            level, service, ms = parts\n            if level not in ("INFO", "WARN", "ERROR") or not service or not ms.isdigit():\n                continue\n            counts[level] = counts.get(level, 0) + 1\n            times.setdefault(service, []).append(int(ms))\n            if level == "ERROR":\n                errors.add(service)\n    slowest = None\n    if times:\n        slowest = sorted(times, key=lambda s: (-sum(times[s]) / len(times[s]), s), reverse=True)[0] if False else sorted(times, key=lambda s: (sum(times[s]) / len(times[s]), s))[-1]\n    return {"counts": counts, "slowest": slowest, "errors": sorted(errors)}\n',
      // does not strip spaces
      'def analyse(path):\n    counts = {}\n    times = {}\n    errors = set()\n    with open(path) as f:\n        for line in f:\n            parts = line.strip().split("|")\n            if len(parts) != 3:\n                continue\n            level, service, ms = parts\n            if level not in ("INFO", "WARN", "ERROR") or not service or not ms.isdigit():\n                continue\n            counts[level] = counts.get(level, 0) + 1\n            times.setdefault(service, []).append(int(ms))\n            if level == "ERROR":\n                errors.add(service)\n    slowest = None\n    if times:\n        slowest = sorted(times, key=lambda s: (-sum(times[s]) / len(times[s]), s))[0]\n    return {"counts": counts, "slowest": slowest, "errors": sorted(errors)}\n',
      // accepts unknown levels
      'def analyse(path):\n    counts = {}\n    times = {}\n    errors = set()\n    with open(path) as f:\n        for line in f:\n            parts = [p.strip() for p in line.strip().split("|")]\n            if len(parts) != 3:\n                continue\n            level, service, ms = parts\n            if not service or not ms.isdigit():\n                continue\n            counts[level] = counts.get(level, 0) + 1\n            times.setdefault(service, []).append(int(ms))\n            if level == "ERROR":\n                errors.add(service)\n    slowest = None\n    if times:\n        slowest = sorted(times, key=lambda s: (-sum(times[s]) / len(times[s]), s))[0]\n    return {"counts": counts, "slowest": slowest, "errors": sorted(errors)}\n',
    ],
  },
  'boss-py-mastery-b': {
    valid: [
      'import csv\n\ndef final_grades(path):\n    scores = {}\n    with open(path, newline="") as f:\n        for row in csv.DictReader(f):\n            name = (row.get("student") or "").strip()\n            try:\n                score = float(row.get("score") or "")\n            except ValueError:\n                continue\n            if not name or not (0 <= score <= 100):\n                continue\n            scores.setdefault(name, []).append(score)\n    out = {}\n    for name, xs in scores.items():\n        if len(xs) >= 3:\n            xs = sorted(xs)[1:]\n        out[name] = round(sum(xs) / len(xs), 1)\n    return out\n',
    ],
    wrong: [
      // drops the lowest even with two scores
      'import csv\n\ndef final_grades(path):\n    scores = {}\n    with open(path, newline="") as f:\n        for row in csv.DictReader(f):\n            name = (row.get("student") or "").strip()\n            try:\n                score = float(row.get("score") or "")\n            except ValueError:\n                continue\n            if not name or not (0 <= score <= 100):\n                continue\n            scores.setdefault(name, []).append(score)\n    out = {}\n    for name, xs in scores.items():\n        if len(xs) >= 2:\n            xs = sorted(xs)[1:]\n        out[name] = round(sum(xs) / len(xs), 1)\n    return out\n',
      // treats 100 and 0 as invalid (off by one on the range)
      'import csv\n\ndef final_grades(path):\n    scores = {}\n    with open(path, newline="") as f:\n        for row in csv.DictReader(f):\n            name = (row.get("student") or "").strip()\n            try:\n                score = float(row.get("score") or "")\n            except ValueError:\n                continue\n            if not name or not (0 < score < 100):\n                continue\n            scores.setdefault(name, []).append(score)\n    out = {}\n    for name, xs in scores.items():\n        if len(xs) >= 3:\n            xs = sorted(xs)[1:]\n        out[name] = round(sum(xs) / len(xs), 1)\n    return out\n',
      // never drops anyone
      'import csv\n\ndef final_grades(path):\n    scores = {}\n    with open(path, newline="") as f:\n        for row in csv.DictReader(f):\n            name = (row.get("student") or "").strip()\n            try:\n                score = float(row.get("score") or "")\n            except ValueError:\n                continue\n            if not name or not (0 <= score <= 100):\n                continue\n            scores.setdefault(name, []).append(score)\n    return {n: round(sum(x) / len(x), 1) for n, x in scores.items()}\n',
      // does not strip names
      'import csv\n\ndef final_grades(path):\n    scores = {}\n    with open(path, newline="") as f:\n        for row in csv.DictReader(f):\n            name = row.get("student") or ""\n            try:\n                score = float(row.get("score") or "")\n            except ValueError:\n                continue\n            if not name.strip() or not (0 <= score <= 100):\n                continue\n            scores.setdefault(name, []).append(score)\n    out = {}\n    for name, xs in scores.items():\n        if len(xs) >= 3:\n            xs = sorted(xs)[1:]\n        out[name] = round(sum(xs) / len(xs), 1)\n    return out\n',
    ],
  },
  'boss-sql-ledger-a': {
    valid: ['SELECT c.city, COUNT(o.id) AS orders, COUNT(DISTINCT c.id) AS buyers FROM customers c JOIN orders o ON o.customer_id = c.id WHERE c.city IS NOT NULL GROUP BY c.city ORDER BY orders DESC, c.city;'],
    wrong: [
      'SELECT c.city, COUNT(*) AS orders, COUNT(*) AS buyers FROM customers c JOIN orders o ON o.customer_id = c.id WHERE c.city IS NOT NULL GROUP BY c.city ORDER BY orders DESC, c.city;',
      'SELECT c.city, COUNT(o.id) AS orders, COUNT(DISTINCT c.id) AS buyers FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE c.city IS NOT NULL GROUP BY c.city ORDER BY orders DESC, c.city;',
      'SELECT c.city, COUNT(o.id) AS orders, COUNT(DISTINCT c.id) AS buyers FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.city ORDER BY orders DESC, c.city;',
    ],
  },
  'boss-sql-ledger-b': {
    valid: ['SELECT c.name, MAX(o.ordered_on) AS last_order FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY last_order IS NULL, last_order DESC, c.name;'],
    wrong: [
      'SELECT c.name, MAX(o.ordered_on) AS last_order FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY last_order DESC, c.name;',
      'SELECT c.name, MIN(o.ordered_on) AS last_order FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY last_order IS NULL, last_order DESC, c.name;',
    ],
  },
  'boss-sql-mastery-a': {
    valid: [
      'SELECT d.name AS department, (SELECT e.name FROM employees e WHERE e.department_id = d.id ORDER BY e.hourly_rate DESC, e.name LIMIT 1) AS top_earner, (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.hourly_rate > (SELECT AVG(x.hourly_rate) FROM employees x WHERE x.department_id = d.id)) AS above_average FROM departments d ORDER BY d.name;',
      'WITH avg_rate AS (SELECT department_id, AVG(hourly_rate) AS a FROM employees GROUP BY department_id), ranked AS (SELECT name, department_id, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY hourly_rate DESC, name) AS rn FROM employees) SELECT d.name AS department, (SELECT r.name FROM ranked r WHERE r.department_id = d.id AND r.rn = 1) AS top_earner, (SELECT COUNT(*) FROM employees e JOIN avg_rate g ON g.department_id = e.department_id WHERE e.department_id = d.id AND e.hourly_rate > g.a) AS above_average FROM departments d ORDER BY d.name;',
    ],
    wrong: [
      // inner join drops empty departments
      'SELECT d.name AS department, e.name AS top_earner, 0 AS above_average FROM departments d JOIN employees e ON e.department_id = d.id WHERE e.hourly_rate = (SELECT MAX(hourly_rate) FROM employees x WHERE x.department_id = d.id) ORDER BY d.name;',
      // compares with the company-wide average
      'SELECT d.name AS department, (SELECT e.name FROM employees e WHERE e.department_id = d.id ORDER BY e.hourly_rate DESC, e.name LIMIT 1) AS top_earner, (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.hourly_rate > (SELECT AVG(hourly_rate) FROM employees)) AS above_average FROM departments d ORDER BY d.name;',
      // >= average
      'SELECT d.name AS department, (SELECT e.name FROM employees e WHERE e.department_id = d.id ORDER BY e.hourly_rate DESC, e.name LIMIT 1) AS top_earner, (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.hourly_rate >= (SELECT AVG(x.hourly_rate) FROM employees x WHERE x.department_id = d.id)) AS above_average FROM departments d ORDER BY d.name;',
      // ties broken by the last name
      'SELECT d.name AS department, (SELECT e.name FROM employees e WHERE e.department_id = d.id ORDER BY e.hourly_rate DESC, e.name DESC LIMIT 1) AS top_earner, (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.hourly_rate > (SELECT AVG(x.hourly_rate) FROM employees x WHERE x.department_id = d.id)) AS above_average FROM departments d ORDER BY d.name;',
    ],
  },
  'boss-sql-mastery-b': {
    valid: [
      'SELECT m.name AS machine, SUM(r.units_made) AS made, ROUND(100.0 * SUM(r.units_defective) / SUM(r.units_made), 1) AS defect_pct FROM machines m JOIN production_runs r ON r.machine_id = m.id WHERE r.units_defective IS NOT NULL GROUP BY m.id HAVING SUM(r.units_made) >= 100 ORDER BY defect_pct DESC, m.name;',
    ],
    wrong: [
      // counts units of the unknown runs in the denominator
      'SELECT m.name AS machine, SUM(r.units_made) AS made, ROUND(100.0 * SUM(COALESCE(r.units_defective, 0)) / SUM(r.units_made), 1) AS defect_pct FROM machines m JOIN production_runs r ON r.machine_id = m.id GROUP BY m.id HAVING SUM(r.units_made) >= 100 ORDER BY defect_pct DESC, m.name;',
      // averages the per-run percentages
      'SELECT m.name AS machine, SUM(r.units_made) AS made, ROUND(AVG(100.0 * r.units_defective / r.units_made), 1) AS defect_pct FROM machines m JOIN production_runs r ON r.machine_id = m.id WHERE r.units_defective IS NOT NULL GROUP BY m.id HAVING SUM(r.units_made) >= 100 ORDER BY defect_pct DESC, m.name;',
      // integer division
      'SELECT m.name AS machine, SUM(r.units_made) AS made, ROUND(SUM(r.units_defective) * 100 / SUM(r.units_made), 1) AS defect_pct FROM machines m JOIN production_runs r ON r.machine_id = m.id WHERE r.units_defective IS NOT NULL GROUP BY m.id HAVING SUM(r.units_made) >= 100 ORDER BY defect_pct DESC, m.name;',
      // > 100
      'SELECT m.name AS machine, SUM(r.units_made) AS made, ROUND(100.0 * SUM(r.units_defective) / SUM(r.units_made), 1) AS defect_pct FROM machines m JOIN production_runs r ON r.machine_id = m.id WHERE r.units_defective IS NOT NULL GROUP BY m.id HAVING SUM(r.units_made) > 100 ORDER BY defect_pct DESC, m.name;',
    ],
  },
  'boss-de-mastery-a': {
    valid: [
      'import csv, math, sqlite3\nfrom datetime import datetime\n\ndef ingest(csv_path, db_path):\n    con = sqlite3.connect(db_path)\n    con.execute("CREATE TABLE IF NOT EXISTS readings (sensor TEXT, time TEXT, value REAL, PRIMARY KEY (sensor, time))")\n    accepted = rejected = 0\n    with open(csv_path, newline="") as f:\n        for row in csv.DictReader(f):\n            sensor = (row.get("sensor") or "").strip()\n            t = (row.get("time") or "").strip()\n            try:\n                datetime.strptime(t, "%Y-%m-%d %H:%M")\n                if len(t) != 16:\n                    raise ValueError\n                v = float(row.get("value") or "")\n                if not math.isfinite(v) or not sensor:\n                    raise ValueError\n            except ValueError:\n                rejected += 1\n                continue\n            con.execute("INSERT OR REPLACE INTO readings VALUES (?, ?, ?)", (sensor, t, v))\n            accepted += 1\n    con.commit()\n    con.close()\n    return {"accepted": accepted, "rejected": rejected}\n',
    ],
    wrong: [
      // does not validate the date
      'import csv, math, sqlite3\n\ndef ingest(csv_path, db_path):\n    con = sqlite3.connect(db_path)\n    con.execute("CREATE TABLE IF NOT EXISTS readings (sensor TEXT, time TEXT, value REAL, PRIMARY KEY (sensor, time))")\n    accepted = rejected = 0\n    with open(csv_path, newline="") as f:\n        for row in csv.DictReader(f):\n            sensor = (row.get("sensor") or "").strip()\n            try:\n                v = float(row.get("value") or "")\n                if not math.isfinite(v) or not sensor:\n                    raise ValueError\n            except ValueError:\n                rejected += 1\n                continue\n            con.execute("INSERT OR REPLACE INTO readings VALUES (?, ?, ?)", (sensor, row["time"], v))\n            accepted += 1\n    con.commit()\n    return {"accepted": accepted, "rejected": rejected}\n',
      // first value wins (INSERT OR IGNORE)
      'import csv, math, sqlite3\nfrom datetime import datetime\n\ndef ingest(csv_path, db_path):\n    con = sqlite3.connect(db_path)\n    con.execute("CREATE TABLE IF NOT EXISTS readings (sensor TEXT, time TEXT, value REAL, PRIMARY KEY (sensor, time))")\n    accepted = rejected = 0\n    with open(csv_path, newline="") as f:\n        for row in csv.DictReader(f):\n            sensor = (row.get("sensor") or "").strip()\n            t = (row.get("time") or "").strip()\n            try:\n                datetime.strptime(t, "%Y-%m-%d %H:%M")\n                if len(t) != 16:\n                    raise ValueError\n                v = float(row.get("value") or "")\n                if not math.isfinite(v) or not sensor:\n                    raise ValueError\n            except ValueError:\n                rejected += 1\n                continue\n            con.execute("INSERT OR IGNORE INTO readings VALUES (?, ?, ?)", (sensor, t, v))\n            accepted += 1\n    con.commit()\n    return {"accepted": accepted, "rejected": rejected}\n',
      // lets nan and inf through
      'import csv, sqlite3\nfrom datetime import datetime\n\ndef ingest(csv_path, db_path):\n    con = sqlite3.connect(db_path)\n    con.execute("CREATE TABLE IF NOT EXISTS readings (sensor TEXT, time TEXT, value REAL, PRIMARY KEY (sensor, time))")\n    accepted = rejected = 0\n    with open(csv_path, newline="") as f:\n        for row in csv.DictReader(f):\n            sensor = (row.get("sensor") or "").strip()\n            t = (row.get("time") or "").strip()\n            try:\n                datetime.strptime(t, "%Y-%m-%d %H:%M")\n                if len(t) != 16:\n                    raise ValueError\n                v = float(row.get("value") or "")\n                if not sensor:\n                    raise ValueError\n            except ValueError:\n                rejected += 1\n                continue\n            con.execute("INSERT OR REPLACE INTO readings VALUES (?, ?, ?)", (sensor, t, v))\n            accepted += 1\n    con.commit()\n    return {"accepted": accepted, "rejected": rejected}\n',
      // plain INSERT: crashes on a repeat
      'import csv, math, sqlite3\nfrom datetime import datetime\n\ndef ingest(csv_path, db_path):\n    con = sqlite3.connect(db_path)\n    con.execute("CREATE TABLE IF NOT EXISTS readings (sensor TEXT, time TEXT, value REAL, PRIMARY KEY (sensor, time))")\n    accepted = rejected = 0\n    with open(csv_path, newline="") as f:\n        for row in csv.DictReader(f):\n            sensor = (row.get("sensor") or "").strip()\n            t = (row.get("time") or "").strip()\n            try:\n                datetime.strptime(t, "%Y-%m-%d %H:%M")\n                v = float(row.get("value") or "")\n                if not math.isfinite(v) or not sensor:\n                    raise ValueError\n            except ValueError:\n                rejected += 1\n                continue\n            con.execute("INSERT INTO readings VALUES (?, ?, ?)", (sensor, t, v))\n            accepted += 1\n    con.commit()\n    return {"accepted": accepted, "rejected": rejected}\n',
    ],
  },
  'boss-de-mastery-b': {
    valid: [
      'import json, sqlite3\n\ndef _ok_line(l):\n    if not isinstance(l, dict):\n        return False\n    sku, qty, price = l.get("sku"), l.get("qty"), l.get("price")\n    return isinstance(sku, str) and sku.strip() != "" and isinstance(qty, int) and not isinstance(qty, bool) and qty > 0 and isinstance(price, (int, float)) and not isinstance(price, bool) and price >= 0\n\ndef _ok(o):\n    if not isinstance(o, dict):\n        return False\n    oid, cust, lines = o.get("id"), o.get("customer"), o.get("lines")\n    if not isinstance(oid, int) or isinstance(oid, bool) or not isinstance(cust, str) or not cust.strip():\n        return False\n    return isinstance(lines, list) and len(lines) > 0 and all(_ok_line(l) for l in lines)\n\ndef load_orders(json_path, db_path):\n    with open(json_path) as f:\n        data = json.load(f)\n    con = sqlite3.connect(db_path)\n    con.execute("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, customer TEXT NOT NULL)")\n    con.execute("CREATE TABLE IF NOT EXISTS order_lines (order_id INTEGER NOT NULL REFERENCES orders(id), sku TEXT NOT NULL, qty INTEGER NOT NULL, price REAL NOT NULL)")\n    for o in data:\n        if not _ok(o):\n            continue\n        con.execute("DELETE FROM order_lines WHERE order_id = ?", (o["id"],))\n        con.execute("INSERT OR REPLACE INTO orders VALUES (?, ?)", (o["id"], o["customer"].strip()))\n        for l in o["lines"]:\n            con.execute("INSERT INTO order_lines VALUES (?, ?, ?, ?)", (o["id"], l["sku"], l["qty"], l["price"]))\n    con.commit()\n    rows = con.execute("SELECT o.customer, ROUND(SUM(l.qty * l.price), 2) AS total FROM orders o JOIN order_lines l ON l.order_id = o.id GROUP BY o.customer ORDER BY total DESC, o.customer LIMIT 3").fetchall()\n    con.close()\n    return [(c, float(t)) for c, t in rows]\n',
    ],
    wrong: [
      // stores the valid lines of a partly-invalid order
      'import json, sqlite3\n\ndef load_orders(json_path, db_path):\n    data = json.load(open(json_path))\n    con = sqlite3.connect(db_path)\n    con.execute("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, customer TEXT NOT NULL)")\n    con.execute("CREATE TABLE IF NOT EXISTS order_lines (order_id INTEGER, sku TEXT, qty INTEGER, price REAL)")\n    for o in data:\n        if not isinstance(o.get("id"), int) or not str(o.get("customer", "")).strip() or not o.get("lines"):\n            continue\n        con.execute("DELETE FROM order_lines WHERE order_id = ?", (o["id"],))\n        con.execute("INSERT OR REPLACE INTO orders VALUES (?, ?)", (o["id"], o["customer"]))\n        for l in o["lines"]:\n            if l.get("sku") and l.get("qty", 0) > 0 and l.get("price", -1) >= 0:\n                con.execute("INSERT INTO order_lines VALUES (?, ?, ?, ?)", (o["id"], l["sku"], l["qty"], l["price"]))\n    con.commit()\n    rows = con.execute("SELECT o.customer, ROUND(SUM(l.qty * l.price), 2) AS total FROM orders o JOIN order_lines l ON l.order_id = o.id GROUP BY o.customer ORDER BY total DESC, o.customer LIMIT 3").fetchall()\n    return [(c, float(t)) for c, t in rows]\n',
      // reload appends duplicate lines
      'import json, sqlite3\n\ndef load_orders(json_path, db_path):\n    data = json.load(open(json_path))\n    con = sqlite3.connect(db_path)\n    con.execute("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, customer TEXT NOT NULL)")\n    con.execute("CREATE TABLE IF NOT EXISTS order_lines (order_id INTEGER, sku TEXT, qty INTEGER, price REAL)")\n    for o in data:\n        if not isinstance(o.get("id"), int) or not str(o.get("customer", "")).strip() or not o.get("lines"):\n            continue\n        if not all(l.get("sku") and isinstance(l.get("qty"), int) and l["qty"] > 0 and l.get("price", -1) >= 0 for l in o["lines"]):\n            continue\n        con.execute("INSERT OR REPLACE INTO orders VALUES (?, ?)", (o["id"], o["customer"]))\n        for l in o["lines"]:\n            con.execute("INSERT INTO order_lines VALUES (?, ?, ?, ?)", (o["id"], l["sku"], l["qty"], l["price"]))\n    con.commit()\n    rows = con.execute("SELECT o.customer, ROUND(SUM(l.qty * l.price), 2) AS total FROM orders o JOIN order_lines l ON l.order_id = o.id GROUP BY o.customer ORDER BY total DESC, o.customer LIMIT 3").fetchall()\n    return [(c, float(t)) for c, t in rows]\n',
      // ties by total only (no name order) and no rounding
      'import json, sqlite3\n\ndef load_orders(json_path, db_path):\n    data = json.load(open(json_path))\n    con = sqlite3.connect(db_path)\n    con.execute("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, customer TEXT NOT NULL)")\n    con.execute("CREATE TABLE IF NOT EXISTS order_lines (order_id INTEGER, sku TEXT, qty INTEGER, price REAL)")\n    for o in data:\n        if not isinstance(o.get("id"), int) or not str(o.get("customer", "")).strip() or not o.get("lines"):\n            continue\n        if not all(l.get("sku") and isinstance(l.get("qty"), int) and l["qty"] > 0 and l.get("price", -1) >= 0 for l in o["lines"]):\n            continue\n        con.execute("DELETE FROM order_lines WHERE order_id = ?", (o["id"],))\n        con.execute("INSERT OR REPLACE INTO orders VALUES (?, ?)", (o["id"], o["customer"]))\n        for l in o["lines"]:\n            con.execute("INSERT INTO order_lines VALUES (?, ?, ?, ?)", (o["id"], l["sku"], l["qty"], l["price"]))\n    con.commit()\n    rows = con.execute("SELECT o.customer, SUM(l.qty * l.price) AS total FROM orders o JOIN order_lines l ON l.order_id = o.id GROUP BY o.customer ORDER BY total DESC LIMIT 3").fetchall()\n    return [(c, t) for c, t in rows]\n',
    ],
  },
  'boss-summit-a': {
    valid: [
      'import sqlite3\n\ndef worst_machines(db_path, n):\n    if n <= 0:\n        return []\n    con = sqlite3.connect(db_path)\n    rows = con.execute("SELECT m.name, SUM(e.downtime_hours), SUM(COALESCE(e.cost, 0)) FROM machines m JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY SUM(e.downtime_hours) DESC, m.name LIMIT ?", (n,)).fetchall()\n    con.close()\n    return rows\n',
    ],
    wrong: [
      // negative n reaches SQLite as LIMIT -2 (no limit)
      'import sqlite3\n\ndef worst_machines(db_path, n):\n    con = sqlite3.connect(db_path)\n    return con.execute("SELECT m.name, SUM(e.downtime_hours), SUM(COALESCE(e.cost, 0)) FROM machines m JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY SUM(e.downtime_hours) DESC, m.name LIMIT ?", (n,)).fetchall()\n',
      // NULL cost makes the total None
      'import sqlite3\n\ndef worst_machines(db_path, n):\n    if n <= 0:\n        return []\n    con = sqlite3.connect(db_path)\n    return con.execute("SELECT m.name, SUM(e.downtime_hours), SUM(e.cost) FROM machines m JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY SUM(e.downtime_hours) DESC, m.name LIMIT ?", (n,)).fetchall()\n',
      // ties not ordered by name
      'import sqlite3\n\ndef worst_machines(db_path, n):\n    if n <= 0:\n        return []\n    con = sqlite3.connect(db_path)\n    return con.execute("SELECT m.name, SUM(e.downtime_hours), SUM(COALESCE(e.cost, 0)) FROM machines m JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY SUM(e.downtime_hours) DESC, m.id DESC LIMIT ?", (n,)).fetchall()\n',
    ],
  },
  'boss-summit-b': {
    valid: [
      'import sqlite3\n\ndef technician_load(db_path):\n    con = sqlite3.connect(db_path)\n    rows = con.execute("SELECT e.name, COUNT(*), COUNT(DISTINCT m.machine_id), SUM(m.downtime_hours) FROM maintenance_events m JOIN employees e ON e.id = m.technician_id GROUP BY e.id HAVING COUNT(*) >= 3 ORDER BY COUNT(*) DESC, SUM(m.downtime_hours) DESC, e.name").fetchall()\n    con.close()\n    return rows\n',
    ],
    wrong: [
      // more than three
      'import sqlite3\n\ndef technician_load(db_path):\n    con = sqlite3.connect(db_path)\n    return con.execute("SELECT e.name, COUNT(*), COUNT(DISTINCT m.machine_id), SUM(m.downtime_hours) FROM maintenance_events m JOIN employees e ON e.id = m.technician_id GROUP BY e.id HAVING COUNT(*) > 3 ORDER BY COUNT(*) DESC, SUM(m.downtime_hours) DESC, e.name").fetchall()\n',
      // counts events not distinct machines
      'import sqlite3\n\ndef technician_load(db_path):\n    con = sqlite3.connect(db_path)\n    return con.execute("SELECT e.name, COUNT(*), COUNT(m.machine_id), SUM(m.downtime_hours) FROM maintenance_events m JOIN employees e ON e.id = m.technician_id GROUP BY e.id HAVING COUNT(*) >= 3 ORDER BY COUNT(*) DESC, SUM(m.downtime_hours) DESC, e.name").fetchall()\n',
      // hours ascending
      'import sqlite3\n\ndef technician_load(db_path):\n    con = sqlite3.connect(db_path)\n    return con.execute("SELECT e.name, COUNT(*), COUNT(DISTINCT m.machine_id), SUM(m.downtime_hours) FROM maintenance_events m JOIN employees e ON e.id = m.technician_id GROUP BY e.id HAVING COUNT(*) >= 3 ORDER BY COUNT(*) DESC, SUM(m.downtime_hours), e.name").fetchall()\n',
    ],
  },
};
