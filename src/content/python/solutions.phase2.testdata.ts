/**
 * TEST-ONLY DATA (never imported by the app). Reference solutions and plausible wrong attempts for
 * Phase 2 Python lessons. Same rules as solutions.testdata.ts: every `valid` must pass, every `wrong` must fail.
 */
export const solutionsPhase2Python: Record<string, { valid: string[]; wrong: string[] }> = {
  // ------------------------------------------------------------- 15 lists
  'py-15-reading-summary': {
    valid: ['def summary(readings):\n    return f"First: {readings[0]}, Last: {readings[-1]}, Count: {len(readings)}"',
      'def summary(readings):\n    first = readings[0]\n    last = readings[len(readings) - 1]\n    return "First: " + str(first) + ", Last: " + str(last) + ", Count: " + str(len(readings))'],
    wrong: ['def summary(readings):\n    return f"First: {readings[1]}, Last: {readings[-1]}, Count: {len(readings)}"', 'def summary(readings):\n    return f"First: {readings[0]}, Last: {readings[-1]}, Count: {len(readings) - 1}"', 'def summary(readings):\n    print(f"First: {readings[0]}, Last: {readings[-1]}, Count: {len(readings)}")']
  },
  'py-15-over-limit': {
    valid: ['def over_limit(measurements, limit):\n    result = []\n    for m in measurements:\n        if m > limit:\n            result.append(m)\n    return result', 'def over_limit(measurements, limit):\n    return [m for m in measurements if m > limit]'],
    wrong: ['def over_limit(measurements, limit):\n    result = []\n    for m in measurements:\n        if m >= limit:\n            result.append(m)\n    return result', 'def over_limit(measurements, limit):\n    for m in measurements:\n        if m <= limit:\n            measurements.remove(m)\n    return measurements', 'def over_limit(measurements, limit):\n    measurements.sort()\n    return [m for m in measurements if m > limit]']
  },
  'py-15-large-payments': {
    valid: ['def large_payments(amounts, threshold):\n    flagged = []\n    for a in amounts:\n        if a >= threshold:\n            flagged.append(a)\n    return flagged', 'def large_payments(amounts, threshold):\n    return [a for a in amounts if a >= threshold]'],
    wrong: ['def large_payments(amounts, threshold):\n    return [a for a in amounts if a > threshold]', 'def large_payments(amounts, threshold):\n    amounts[:] = [a for a in amounts if a >= threshold]\n    return amounts']
  },
  'py-15-top-three': {
    valid: ['def top_three(sales):\n    return sorted(sales, reverse=True)[:3]', 'def top_three(sales):\n    ordered = sorted(sales)\n    ordered.reverse()\n    return ordered[:3]'],
    wrong: ['def top_three(sales):\n    return sorted(sales)[:3]', 'def top_three(sales):\n    sales.sort(reverse=True)\n    return sales[:3]', 'def top_three(sales):\n    return sorted(sales, reverse=True)[:2]', 'def top_three(sales):\n    return sorted(set(sales), reverse=True)[:3]']
  },
  'py-15-fastest-laps': {
    valid: ['def fastest_laps(times):\n    return sorted(times)[:3]', 'def fastest_laps(times):\n    copy = list(times)\n    copy.sort()\n    return copy[:3]'],
    wrong: ['def fastest_laps(times):\n    return sorted(times, reverse=True)[:3]', 'def fastest_laps(times):\n    times.sort()\n    return times[:3]', 'def fastest_laps(times):\n    return times[:3]']
  },
  'py-15-first-defect': {
    valid: ['def first_defect(codes):\n    for i in range(len(codes)):\n        if codes[i] == "DEFECT":\n            return i\n    return -1', 'def first_defect(codes):\n    for i, c in enumerate(codes):\n        if c == "DEFECT":\n            return i\n    return -1'],
    wrong: ['def first_defect(codes):\n    if "DEFECT" in codes:\n        return codes.index("DEFECT")\n    return -1', 'def first_defect(codes):\n    for i in range(len(codes)):\n        if codes[i] == "DEFECT":\n            return i', 'def first_defect(codes):\n    result = -1\n    for i in range(len(codes)):\n        if codes[i] == "DEFECT":\n            result = i\n    return result']
  },
  'py-15-first-overheat': {
    valid: ['def first_over(temps, limit):\n    for i in range(len(temps)):\n        if temps[i] > limit:\n            return i\n    return -1', 'def first_over(temps, limit):\n    for i, t in enumerate(temps):\n        if t > limit:\n            return i\n    return -1'],
    wrong: ['def first_over(temps, limit):\n    for i in range(len(temps)):\n        if temps[i] >= limit:\n            return i\n    return -1', 'def first_over(temps, limit):\n    for t in temps:\n        if t > limit:\n            return t\n    return -1', 'def first_over(temps, limit):\n    last = -1\n    for i, t in enumerate(temps):\n        if t > limit:\n            last = i\n    return last']
  },
  // ------------------------------------------------------------- 16 dicts
  'py-16-stock-lookup': {
    valid: ['def stock_of(inventory, item):\n    return inventory.get(item, 0)', 'def stock_of(inventory, item):\n    if item in inventory:\n        return inventory[item]\n    return 0'],
    wrong: ['def stock_of(inventory, item):\n    return inventory[item]', 'def stock_of(inventory, item):\n    return inventory.get(item)', 'def stock_of(inventory, item):\n    return inventory.get(item.lower(), 0)']
  },
  'py-16-defect-tally': {
    valid: ['def tally(defects):\n    counts = {}\n    for d in defects:\n        counts[d] = counts.get(d, 0) + 1\n    return counts', 'def tally(defects):\n    counts = {}\n    for d in defects:\n        if d in counts:\n            counts[d] += 1\n        else:\n            counts[d] = 1\n    return counts'],
    wrong: ['def tally(defects):\n    counts = {}\n    for d in defects:\n        counts[d] = 1\n    return counts', 'def tally(defects):\n    return set(defects)', 'def tally(defects):\n    counts = {}\n    for d in defects:\n        counts[d.lower()] = counts.get(d.lower(), 0) + 1\n    return counts']
  },
  'py-16-event-log': {
    valid: ['def count_events(events):\n    counts = {}\n    for e in events:\n        key = e.lower()\n        counts[key] = counts.get(key, 0) + 1\n    return counts'],
    wrong: ['def count_events(events):\n    counts = {}\n    for e in events:\n        counts[e] = counts.get(e, 0) + 1\n    return counts', 'def count_events(events):\n    counts = {}\n    for e in events:\n        counts[e.upper()] = counts.get(e.upper(), 0) + 1\n    return counts']
  },
  'py-16-both-lists': {
    valid: ['def on_both_lists(failed, due):\n    return sorted(set(failed) & set(due))', 'def on_both_lists(failed, due):\n    result = []\n    for m in sorted(set(failed)):\n        if m in due:\n            result.append(m)\n    return result'],
    wrong: ['def on_both_lists(failed, due):\n    return sorted(set(failed) | set(due))', 'def on_both_lists(failed, due):\n    return [m for m in failed if m in due]', 'def on_both_lists(failed, due):\n    return set(failed) & set(due)']
  },
  'py-16-missing-parts': {
    valid: ['def missing_parts(required, in_stock):\n    return sorted(set(required) - set(in_stock))', 'def missing_parts(required, in_stock):\n    out = []\n    for p in sorted(set(required)):\n        if p not in in_stock:\n            out.append(p)\n    return out'],
    wrong: ['def missing_parts(required, in_stock):\n    return sorted(set(in_stock) - set(required))', 'def missing_parts(required, in_stock):\n    return [p for p in required if p not in in_stock]', 'def missing_parts(required, in_stock):\n    return sorted(set(required) ^ set(in_stock))']
  },
  'py-16-group-readings': {
    valid: ['def group_by_machine(readings):\n    groups = {}\n    for machine, value in readings:\n        groups.setdefault(machine, []).append(value)\n    return groups', 'def group_by_machine(readings):\n    groups = {}\n    for machine, value in readings:\n        if machine not in groups:\n            groups[machine] = []\n        groups[machine].append(value)\n    return groups'],
    wrong: ['def group_by_machine(readings):\n    groups = {}\n    for machine, value in readings:\n        groups[machine] = [value]\n    return groups', 'def group_by_machine(readings):\n    groups = {}\n    for machine, value in readings:\n        groups.setdefault(machine, []).append(value)\n    return sorted(groups.items())']
  },
  'py-16-group-orders': {
    valid: ['def orders_by_customer(orders):\n    result = {}\n    for o in orders:\n        result.setdefault(o["customer"], []).append(o["amount"])\n    return result', 'def orders_by_customer(orders):\n    result = {}\n    for o in orders:\n        name = o["customer"]\n        if name not in result:\n            result[name] = []\n        result[name].append(o["amount"])\n    return result'],
    wrong: ['def orders_by_customer(orders):\n    result = {}\n    for o in orders:\n        result[o["customer"]] = o["amount"]\n    return result', 'def orders_by_customer(orders):\n    result = {}\n    for o in orders:\n        result.setdefault(o["customer"], []).append(o)\n    return result']
  },
  // ------------------------------------------------------------- 17 records
  'py-17-revenue': {
    valid: ['def total_revenue(orders):\n    total = 0\n    for o in orders:\n        total += o["qty"] * o["price"]\n    return total', 'def total_revenue(orders):\n    return sum(o["qty"] * o["price"] for o in orders)'],
    wrong: ['def total_revenue(orders):\n    total = 0\n    for o in orders:\n        total += o["price"]\n    return total', 'def total_revenue(orders):\n    total = 0\n    for o in orders:\n        total = o["qty"] * o["price"]\n    return total']
  },
  'py-17-top-seller': {
    valid: ['def top_seller(products):\n    if not products:\n        return None\n    return max(products, key=lambda p: p["units"])["name"]', 'def top_seller(products):\n    best = None\n    for p in products:\n        if best is None or p["units"] > best["units"]:\n            best = p\n    return best["name"] if best else None'],
    wrong: ['def top_seller(products):\n    return max(products, key=lambda p: p["units"])["name"]', 'def top_seller(products):\n    best = None\n    for p in products:\n        if best is None or p["units"] >= best["units"]:\n            best = p\n    return best["name"] if best else None', 'def top_seller(products):\n    if not products:\n        return None\n    return max(products, key=lambda p: p["name"])["name"]']
  },
  'py-17-fastest-machine': {
    valid: ['def fastest_machine(machines):\n    if not machines:\n        return None\n    return max(machines, key=lambda m: m["units"] / m["hours"])["name"]', 'def fastest_machine(machines):\n    best, best_rate = None, -1\n    for m in machines:\n        rate = m["units"] / m["hours"]\n        if rate > best_rate:\n            best, best_rate = m["name"], rate\n    return best'],
    wrong: ['def fastest_machine(machines):\n    if not machines:\n        return None\n    return max(machines, key=lambda m: m["units"])["name"]', 'def fastest_machine(machines):\n    return max(machines, key=lambda m: m["units"] / m["hours"])["name"]', 'def fastest_machine(machines):\n    if not machines:\n        return None\n    return min(machines, key=lambda m: m["units"] / m["hours"])["name"]']
  },
  'py-17-spend-per-customer': {
    valid: ['def spend_per_customer(transactions):\n    totals = {}\n    for t in transactions:\n        totals[t["customer"]] = totals.get(t["customer"], 0) + t["amount"]\n    return totals'],
    wrong: ['def spend_per_customer(transactions):\n    totals = {}\n    for t in transactions:\n        totals[t["customer"]] = t["amount"]\n    return totals', 'def spend_per_customer(transactions):\n    total = 0\n    for t in transactions:\n        total += t["amount"]\n    return total']
  },
  'py-17-downtime-per-machine': {
    valid: ['def downtime_per_machine(events):\n    totals = {}\n    for e in events:\n        totals[e["machine"]] = totals.get(e["machine"], 0)\n        if e["hours"] is not None:\n            totals[e["machine"]] += e["hours"]\n    return totals'],
    wrong: ['def downtime_per_machine(events):\n    totals = {}\n    for e in events:\n        if e["hours"] is not None:\n            totals[e["machine"]] = totals.get(e["machine"], 0) + e["hours"]\n    return totals', 'def downtime_per_machine(events):\n    totals = {}\n    for e in events:\n        totals[e["machine"]] = totals.get(e["machine"], 0) + e["hours"]\n    return totals']
  },
  'py-17-active-names': {
    valid: ['def active_names(users):\n    return [u["name"].upper() for u in users if u["active"]]'],
    wrong: ['def active_names(users):\n    names = []\n    for u in users:\n        if u["active"]:\n            names.append(u["name"].upper())\n    return names', 'def active_names(users):\n    return [u["name"] for u in users if u["active"]]', 'def active_names(users):\n    return [u["name"].upper() for u in users]']
  },
  'py-17-passing-scores': {
    valid: ['def curve(scores):\n    return [min(100, s + 5) for s in scores if s >= 40]'],
    wrong: ['def curve(scores):\n    return [s + 5 for s in scores if s >= 40]', 'def curve(scores):\n    return [min(100, s + 5) for s in scores if s > 40]', 'def curve(scores):\n    return [min(100, s + 5) for s in scores]']
  },

  // ------------------------------------------------------------- 18 function design
  'py-18-add-tax': {
    valid: ['def add_tax(price, rate=0.2):\n    return price * (1 + rate)', 'def add_tax(price, rate=0.2):\n    return price + price * rate'],
    wrong: ['def add_tax(price, rate):\n    return price * (1 + rate)', 'def add_tax(price, rate=0.2):\n    return price * rate', 'def add_tax(price, rate=0.2):\n    print(price * (1 + rate))']
  },
  'py-18-price-stats': {
    valid: ['def price_stats(prices):\n    if not prices:\n        return None, None, None\n    return min(prices), max(prices), sum(prices) / len(prices)', 'def price_stats(prices):\n    if len(prices) == 0:\n        return (None, None, None)\n    total = 0\n    for p in prices:\n        total += p\n    return (min(prices), max(prices), total / len(prices))'],
    wrong: ['def price_stats(prices):\n    return min(prices), max(prices), sum(prices) / len(prices)', 'def price_stats(prices):\n    if not prices:\n        return None, None, None\n    return max(prices), min(prices), sum(prices) / len(prices)', 'def price_stats(prices):\n    if not prices:\n        return None\n    return min(prices), max(prices), sum(prices) / len(prices)']
  },
  'py-18-run-stats': {
    valid: ['def run_stats(times):\n    if not times:\n        return None, None, 0\n    return min(times), max(times), sum(times)', 'def run_stats(times):\n    if len(times) == 0:\n        return (None, None, 0)\n    return (min(times), max(times), sum(times))'],
    wrong: ['def run_stats(times):\n    return min(times), max(times), sum(times)', 'def run_stats(times):\n    if not times:\n        return None, None, None\n    return min(times), max(times), sum(times)', 'def run_stats(times):\n    if not times:\n        return None, None, 0\n    return min(times), max(times), sum(times) / len(times)']
  },
  'py-18-pay-slip': {
    valid: ['def gross_pay(hours, rate):\n    if hours <= 40:\n        return hours * rate\n    return 40 * rate + (hours - 40) * rate * 1.5\n\ndef tax(gross):\n    if gross <= 1000:\n        return gross * 0.1\n    return 100 + (gross - 1000) * 0.2\n\ndef net_pay(hours, rate):\n    g = gross_pay(hours, rate)\n    return g - tax(g)',
      'def gross_pay(hours, rate):\n    regular = min(hours, 40)\n    overtime = max(hours - 40, 0)\n    return regular * rate + overtime * rate * 1.5\n\ndef tax(gross):\n    low = min(gross, 1000)\n    high = max(gross - 1000, 0)\n    return low * 0.10 + high * 0.20\n\ndef net_pay(hours, rate):\n    return gross_pay(hours, rate) - tax(gross_pay(hours, rate))'],
    wrong: ['def gross_pay(hours, rate):\n    return hours * rate\n\ndef tax(gross):\n    if gross <= 1000:\n        return gross * 0.1\n    return 100 + (gross - 1000) * 0.2\n\ndef net_pay(hours, rate):\n    g = gross_pay(hours, rate)\n    return g - tax(g)',
      'def gross_pay(hours, rate):\n    if hours <= 40:\n        return hours * rate\n    return 40 * rate + (hours - 40) * rate * 1.5\n\ndef tax(gross):\n    return gross * 0.2\n\ndef net_pay(hours, rate):\n    g = gross_pay(hours, rate)\n    return g - tax(g)',
      'def gross_pay(hours, rate):\n    if hours <= 40:\n        return hours * rate\n    return 40 * rate + (hours - 40) * rate * 1.5\n\ndef tax(gross):\n    if gross <= 1000:\n        return gross * 0.1\n    return 100 + (gross - 1000) * 0.2\n\ndef net_pay(hours, rate):\n    if hours <= 40:\n        g = hours * rate\n    else:\n        g = 40 * rate + (hours - 40) * rate * 1.5\n    t = g * 0.1 if g <= 1000 else 100 + (g - 1000) * 0.2\n    return g - t']
  },
  'py-18-shipping-quote': {
    valid: ['def base_cost(weight):\n    if weight <= 5:\n        return 4\n    return 4 + (weight - 5) * 1.2\n\ndef distance_surcharge(km):\n    if km <= 50:\n        return 0\n    return (km - 50) * 0.1\n\ndef quote(weight, km):\n    return base_cost(weight) + distance_surcharge(km)'],
    wrong: ['def base_cost(weight):\n    if weight <= 5:\n        return 4\n    return 4 + weight * 1.2\n\ndef distance_surcharge(km):\n    if km <= 50:\n        return 0\n    return (km - 50) * 0.1\n\ndef quote(weight, km):\n    return base_cost(weight) + distance_surcharge(km)', 'def base_cost(weight):\n    if weight <= 5:\n        return 4\n    return 4 + (weight - 5) * 1.2\n\ndef distance_surcharge(km):\n    if km <= 50:\n        return 0\n    return (km - 50) * 0.1\n\ndef quote(weight, km):\n    b = 4 if weight <= 5 else 4 + (weight - 5) * 1.2\n    d = 0 if km <= 50 else (km - 50) * 0.1\n    return b + d']
  },
  // ------------------------------------------------------------- 19 debugging
  'py-19-fix-average': {
    valid: ['def average(values):\n    if not values:\n        return 0\n    total = 0\n    for v in values:\n        total += v\n    return total / len(values)', 'def average(values):\n    if len(values) == 0:\n        return 0\n    return sum(values) / len(values)'],
    wrong: ['def average(values):\n    total = 0\n    for v in values:\n        total += v\n    return total / len(values)', 'def average(values):\n    if not values:\n        return 0\n    total = 0\n    for v in values:\n        total += v\n    return total / (len(values) - 1)', 'def average(values):\n    if not values:\n        return 0\n    return sum(values) // len(values)']
  },
  'py-19-count-over': {
    valid: ['def count_over(values, limit):\n    count = 0\n    for v in values:\n        if v > limit:\n            count += 1\n    return count', 'def count_over(values, limit):\n    count = 0\n    for i in range(0, len(values)):\n        if values[i] > limit:\n            count += 1\n    return count'],
    wrong: ['def count_over(values, limit):\n    count = 0\n    for i in range(1, len(values)):\n        if values[i] > limit:\n            count += 1\n    return count', 'def count_over(values, limit):\n    count = 0\n    for i in range(len(values)):\n        if values[i] >= limit:\n            count += 1\n    return count']
  },
  'py-19-last-n': {
    valid: ['def last_n(items, n):\n    result = []\n    for i in range(max(0, len(items) - n), len(items)):\n        result.append(items[i])\n    return result', 'def last_n(items, n):\n    if n <= 0:\n        return []\n    return items[-n:]'],
    wrong: ['def last_n(items, n):\n    result = []\n    for i in range(len(items) - n, len(items)):\n        result.append(items[i])\n    return result', 'def last_n(items, n):\n    return items[-n:]', 'def last_n(items, n):\n    result = []\n    for i in range(max(0, len(items) - n), len(items) - 1):\n        result.append(items[i])\n    return result']
  },
  'py-19-safe-int': {
    valid: ['def safe_int(text, default=0):\n    try:\n        return int(text)\n    except (ValueError, TypeError):\n        return default', 'def safe_int(text, default=0):\n    try:\n        return int(text)\n    except Exception:\n        return default'],
    wrong: ['def safe_int(text, default=0):\n    try:\n        return int(text)\n    except ValueError:\n        return default', 'def safe_int(text, default=0):\n    return int(text)', 'def safe_int(text, default=0):\n    try:\n        return int(float(text))\n    except (ValueError, TypeError):\n        return default']
  },
  'py-19-safe-ratio': {
    valid: ['def safe_ratio(a, b):\n    try:\n        return a / b\n    except (ZeroDivisionError, TypeError):\n        return None', 'def safe_ratio(a, b):\n    try:\n        return a / b\n    except Exception:\n        return None'],
    wrong: ['def safe_ratio(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return None', 'def safe_ratio(a, b):\n    return a / b', 'def safe_ratio(a, b):\n    try:\n        return a / b\n    except (ZeroDivisionError, TypeError):\n        return 0']
  },
  'py-19-validate-reading': {
    valid: ['def validate_reading(value):\n    if value < 0 or value > 1000:\n        raise ValueError("reading must be between 0 and 1000")\n    return value', 'def validate_reading(value):\n    if not 0 <= value <= 1000:\n        raise ValueError(f"invalid reading {value}: expected 0-1000")\n    return value'],
    wrong: ['def validate_reading(value):\n    if value < 0 or value > 1000:\n        return None\n    return value', 'def validate_reading(value):\n    if value <= 0 or value >= 1000:\n        raise ValueError("bad reading value")\n    return value', 'def validate_reading(value):\n    if value < 0 or value > 1000:\n        raise ValueError("")\n    return value', 'def validate_reading(value):\n    if value < 0:\n        raise ValueError("negative reading not allowed")\n    return value']
  },
  'py-19-validate-quantity': {
    valid: ['def validate_quantity(q):\n    if not isinstance(q, int) or q < 1:\n        raise ValueError("quantity must be a whole number of at least 1")\n    return q', 'def validate_quantity(q):\n    if type(q) is not int:\n        raise ValueError("quantity must be a whole number")\n    if q < 1:\n        raise ValueError("quantity must be at least 1")\n    return q'],
    wrong: ['def validate_quantity(q):\n    if q < 1:\n        raise ValueError("quantity must be at least 1")\n    return q', 'def validate_quantity(q):\n    if not isinstance(q, int):\n        raise ValueError("quantity must be a whole number")\n    return q', 'def validate_quantity(q):\n    if not isinstance(q, int) or q <= 1:\n        raise ValueError("quantity must be a whole number above 1")\n    return q']
  },

  // ------------------------------------------------------------- 20 files
  'py-20-sum-file': {
    valid: ['total = 0\nfor line in open("readings.txt"):\n    line = line.strip()\n    if line:\n        total += float(line)\nprint("Total:", total)',
      'with open("readings.txt") as f:\n    nums = [float(x) for x in f.read().split()]\nprint(f"Total: {sum(nums)}")'],
    wrong: ['total = 0\nfor line in open("readings.txt"):\n    total += float(line)\nprint("Total:", total)', 'total = 0\nfor line in open("readings.txt"):\n    line = line.strip()\n    if line:\n        total += int(line)\nprint("Total:", total)', 'print("Total: 35.5")']
  },
  'py-20-orders-csv': {
    valid: ['import csv\nwith open("orders.csv", newline="") as f:\n    rows = list(csv.DictReader(f))\ntotal = sum(float(r["amount"]) for r in rows)\nprint(f"Rows: {len(rows)}")\nprint(f"Total: {total:.2f}")',
      'import csv\ncount = 0\ntotal = 0.0\nwith open("orders.csv", newline="") as f:\n    reader = csv.reader(f)\n    next(reader)\n    for row in reader:\n        count += 1\n        total += float(row[2])\nprint("Rows:", count)\nprint("Total: %.2f" % total)'],
    wrong: ['rows = [l.split(",") for l in open("orders.csv").read().splitlines()[1:]]\ntotal = sum(float(r[2]) for r in rows)\nprint(f"Rows: {len(rows)}")\nprint(f"Total: {total:.2f}")', 'import csv\nwith open("orders.csv", newline="") as f:\n    rows = list(csv.reader(f))\ntotal = sum(float(r[2]) for r in rows[1:])\nprint(f"Rows: {len(rows)}")\nprint(f"Total: {total:.2f}")', 'import csv\nwith open("orders.csv", newline="") as f:\n    rows = list(csv.DictReader(f))\ntotal = sum(float(r["amount"]) for r in rows)\nprint(f"Rows: {len(rows)}")\nprint(f"Total: {total}")']
  },
  'py-20-machine-hours': {
    valid: ['import csv\ncount = 0\nhours = 0.0\nwith open("machines.csv", newline="") as f:\n    for row in csv.DictReader(f):\n        if row["status"] == "running":\n            count += 1\n            hours += float(row["hours"])\nprint("Running:", count)\nprint("Hours:", hours)',
      'import csv\nwith open("machines.csv", newline="") as f:\n    running = [r for r in csv.DictReader(f) if r["status"] == "running"]\nprint(f"Running: {len(running)}")\nprint(f"Hours: {sum(float(r[\'hours\']) for r in running):.1f}")'],
    wrong: ['import csv\nwith open("machines.csv", newline="") as f:\n    rows = list(csv.DictReader(f))\nprint("Running:", len(rows))\nprint("Hours:", sum(float(r["hours"]) for r in rows))', 'import csv\ncount = 0\nhours = 0.0\nwith open("machines.csv", newline="") as f:\n    for row in csv.DictReader(f):\n        if row["status"] == "running":\n            count += 1\n        hours += float(row["hours"])\nprint("Running:", count)\nprint("Hours:", hours)', 'count = 0\nhours = 0.0\nfor line in open("machines.csv").read().splitlines()[1:]:\n    parts = line.split(",")\n    if parts[-1] == "running":\n        count += 1\n        hours += float(parts[1])\nprint("Running:", count)\nprint("Hours:", hours)']
  },
  'py-20-low-stock': {
    valid: ['import json\nwith open("inventory.json") as f:\n    items = json.load(f)\nlow = [i["item"] for i in items if i["qty"] < 5]\nwith open("low_stock.json", "w") as f:\n    json.dump(low, f)\nprint("Low:", len(low))',
      'import json\nlow = []\nfor i in json.load(open("inventory.json")):\n    if i["qty"] < 5:\n        low.append(i["item"])\njson.dump(low, open("low_stock.json", "w"))\nprint(f"Low: {len(low)}")'],
    wrong: ['import json\nitems = json.load(open("inventory.json"))\nlow = [i["item"] for i in items if i["qty"] <= 5]\njson.dump(low, open("low_stock.json", "w"))\nprint("Low:", len(low))', 'import json\nitems = json.load(open("inventory.json"))\nlow = [i for i in items if i["qty"] < 5]\njson.dump(low, open("low_stock.json", "w"))\nprint("Low:", len(low))', 'import json\nitems = json.load(open("inventory.json"))\nlow = [i["item"] for i in items if i["qty"] < 5]\nopen("low_stock.json", "w").write(str(low))\nprint("Low:", len(low))']
  },
  'py-20-senior-staff': {
    valid: ['import json\nwith open("staff.json") as f:\n    data = json.load(f)\nnames = sorted(e["name"] for e in data["employees"] if e["years"] >= 5)\nwith open("senior.json", "w") as f:\n    json.dump(names, f)\nprint("Senior:", len(names))'],
    wrong: ['import json\ndata = json.load(open("staff.json"))\nnames = sorted(e["name"] for e in data["employees"] if e["years"] > 5)\njson.dump(names, open("senior.json", "w"))\nprint("Senior:", len(names))', 'import json\ndata = json.load(open("staff.json"))\nnames = [e["name"] for e in data["employees"] if e["years"] >= 5]\njson.dump(names, open("senior.json", "w"))\nprint("Senior:", len(names))', 'import json\ndata = json.load(open("staff.json"))\nnames = sorted(e["name"] for e in data if e["years"] >= 5)\njson.dump(names, open("senior.json", "w"))\nprint("Senior:", len(names))']
  },
  'py-20-cost-report': {
    valid: ['import csv\nwith open("items.csv", newline="") as f:\n    rows = [(r["name"], int(r["qty"]) * float(r["unit_price"])) for r in csv.DictReader(f)]\nrows.sort(key=lambda r: r[1], reverse=True)\nwith open("report.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["name", "total"])\n    for name, total in rows:\n        w.writerow([name, f"{total:.2f}"])',
      'import csv\nrows = []\nfor r in csv.DictReader(open("items.csv", newline="")):\n    rows.append((r["name"], float(r["qty"]) * float(r["unit_price"])))\nrows = sorted(rows, key=lambda r: -r[1])\nout = open("report.csv", "w")\nout.write("name,total\\n")\nfor name, total in rows:\n    out.write("%s,%.2f\\n" % (name, total))\nout.close()'],
    wrong: ['import csv\nwith open("items.csv", newline="") as f:\n    rows = [(r["name"], int(r["qty"]) * float(r["unit_price"])) for r in csv.DictReader(f)]\nwith open("report.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["name", "total"])\n    for name, total in rows:\n        w.writerow([name, f"{total:.2f}"])', 'import csv\nwith open("items.csv", newline="") as f:\n    rows = [(r["name"], int(r["qty"]) * float(r["unit_price"])) for r in csv.DictReader(f)]\nrows.sort(key=lambda r: r[1], reverse=True)\nwith open("report.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["name", "total"])\n    for name, total in rows:\n        w.writerow([name, total])', 'import csv\nwith open("items.csv", newline="") as f:\n    rows = [(r["name"], int(r["qty"]) * float(r["unit_price"])) for r in csv.DictReader(f)]\nrows.sort(key=lambda r: r[1])\nwith open("report.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["name", "total"])\n    for name, total in rows:\n        w.writerow([name, f"{total:.2f}"])']
  },
  'py-20-hours-report': {
    valid: ['import csv\ntotals = {}\nwith open("shifts.csv", newline="") as f:\n    for r in csv.DictReader(f):\n        totals[r["worker"]] = totals.get(r["worker"], 0) + float(r["hours"])\nwith open("totals.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["worker", "hours"])\n    for name in sorted(totals):\n        w.writerow([name, f"{totals[name]:.2f}"])'],
    wrong: ['import csv\ntotals = {}\nwith open("shifts.csv", newline="") as f:\n    for r in csv.DictReader(f):\n        totals[r["worker"]] = totals.get(r["worker"], 0) + float(r["hours"])\nwith open("totals.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["worker", "hours"])\n    for name in totals:\n        w.writerow([name, f"{totals[name]:.2f}"])', 'import csv\nwith open("shifts.csv", newline="") as f:\n    rows = list(csv.DictReader(f))\nwith open("totals.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["worker", "hours"])\n    for r in sorted(rows, key=lambda r: r["worker"]):\n        w.writerow([r["worker"], f"{float(r[\'hours\']):.2f}"])']
  },
  // ------------------------------------------------------------- 21 cleaning
  'py-21-clean-prices': {
    valid: ['def clean_prices(raw):\n    result = []\n    for r in raw:\n        s = r.strip().replace("$", "").replace(",", "").strip()\n        try:\n            result.append(float(s))\n        except ValueError:\n            pass\n    return result', 'def clean_prices(raw):\n    out = []\n    for text in raw:\n        try:\n            out.append(float(text.replace("$", "").replace(",", "")))\n        except ValueError:\n            continue\n    return out'],
    wrong: ['def clean_prices(raw):\n    return [float(r) for r in raw]', 'def clean_prices(raw):\n    result = []\n    for r in raw:\n        try:\n            result.append(float(r.strip()))\n        except ValueError:\n            pass\n    return result', 'def clean_prices(raw):\n    result = []\n    for r in raw:\n        s = r.strip().replace("$", "").replace(",", "")\n        try:\n            result.append(float(s))\n        except ValueError:\n            result.append(0.0)\n    return result']
  },
  'py-21-clean-measurements': {
    valid: ['import csv\naccepted, seen, rejected = [], set(), 0\nwith open("raw.csv", newline="") as f:\n    reader = csv.reader(f)\n    next(reader)\n    for row in reader:\n        if len(row) != 2:\n            rejected += 1\n            continue\n        machine = row[0].strip().upper()\n        try:\n            v = float(row[1].strip())\n        except ValueError:\n            rejected += 1\n            continue\n        if not machine or not (0 <= v <= 500) or (machine, v) in seen:\n            rejected += 1\n            continue\n        seen.add((machine, v))\n        accepted.append((machine, v))\nwith open("clean.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["machine", "reading"])\n    for m, v in accepted:\n        w.writerow([m, f"{v:.1f}"])\nprint("Rejected:", rejected)'],
    wrong: ['import csv\naccepted, rejected = [], 0\nwith open("raw.csv", newline="") as f:\n    reader = csv.reader(f)\n    next(reader)\n    for row in reader:\n        if len(row) != 2:\n            rejected += 1\n            continue\n        machine = row[0].strip().upper()\n        try:\n            v = float(row[1].strip())\n        except ValueError:\n            rejected += 1\n            continue\n        if not machine or not (0 <= v <= 500):\n            rejected += 1\n            continue\n        accepted.append((machine, v))\nwith open("clean.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["machine", "reading"])\n    for m, v in accepted:\n        w.writerow([m, f"{v:.1f}"])\nprint("Rejected:", rejected)',
      'import csv\naccepted, seen, rejected = [], set(), 0\nwith open("raw.csv", newline="") as f:\n    reader = csv.reader(f)\n    next(reader)\n    for row in reader:\n        if len(row) != 2:\n            rejected += 1\n            continue\n        machine = row[0].strip()\n        try:\n            v = float(row[1].strip())\n        except ValueError:\n            rejected += 1\n            continue\n        if not machine or not (0 <= v <= 500) or (machine, v) in seen:\n            rejected += 1\n            continue\n        seen.add((machine, v))\n        accepted.append((machine, v))\nwith open("clean.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["machine", "reading"])\n    for m, v in accepted:\n        w.writerow([m, f"{v:.1f}"])\nprint("Rejected:", rejected)',
      'import csv\naccepted, seen, rejected = [], set(), 0\nwith open("raw.csv", newline="") as f:\n    reader = csv.reader(f)\n    next(reader)\n    for row in reader:\n        if len(row) != 2:\n            rejected += 1\n            continue\n        machine = row[0].strip().upper()\n        try:\n            v = float(row[1].strip())\n        except ValueError:\n            rejected += 1\n            continue\n        if not machine or not (0 < v < 500) or (machine, v) in seen:\n            rejected += 1\n            continue\n        seen.add((machine, v))\n        accepted.append((machine, v))\nwith open("clean.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["machine", "reading"])\n    for m, v in accepted:\n        w.writerow([m, f"{v:.1f}"])\nprint("Rejected:", rejected)',
      'import csv\naccepted, seen, rejected = [], set(), 0\nwith open("raw.csv", newline="") as f:\n    reader = csv.reader(f)\n    next(reader)\n    for row in reader:\n        machine = row[0].strip().upper()\n        try:\n            v = float(row[1].strip())\n        except ValueError:\n            rejected += 1\n            continue\n        if not machine or v < 0 or v > 500 or (machine, v) in seen:\n            rejected += 1\n            continue\n        seen.add((machine, v))\n        accepted.append((machine, v))\nwith open("clean.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["machine", "reading"])\n    for m, v in accepted:\n        w.writerow([m, f"{v:.1f}"])\nprint("Rejected:", rejected)']
  },
  'py-21-clean-transactions': {
    valid: ['import csv\naccepted, seen, rejected = [], set(), 0\nwith open("raw.csv", newline="") as f:\n    reader = csv.reader(f)\n    next(reader)\n    for row in reader:\n        if len(row) != 3:\n            rejected += 1\n            continue\n        id_ = row[0].strip()\n        cur = row[2].strip().upper()\n        try:\n            amount = float(row[1].strip().lstrip("$").replace(",", ""))\n        except ValueError:\n            rejected += 1\n            continue\n        if not id_.isdigit() or amount <= 0 or cur not in ("GBP", "USD", "EUR") or id_ in seen:\n            rejected += 1\n            continue\n        seen.add(id_)\n        accepted.append((id_, amount, cur))\nwith open("clean.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["id", "amount", "currency"])\n    for id_, amount, cur in accepted:\n        w.writerow([id_, f"{amount:.2f}", cur])\nprint("Rejected:", rejected)'],
    wrong: ['import csv\naccepted, seen, rejected = [], set(), 0\nwith open("raw.csv", newline="") as f:\n    reader = csv.reader(f)\n    next(reader)\n    for row in reader:\n        if len(row) != 3:\n            rejected += 1\n            continue\n        id_ = row[0].strip()\n        cur = row[2].strip().upper()\n        try:\n            amount = float(row[1].strip().lstrip("$").replace(",", ""))\n        except ValueError:\n            rejected += 1\n            continue\n        if not id_.isdigit() or amount < 0 or cur not in ("GBP", "USD", "EUR") or id_ in seen:\n            rejected += 1\n            continue\n        seen.add(id_)\n        accepted.append((id_, amount, cur))\nwith open("clean.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["id", "amount", "currency"])\n    for id_, amount, cur in accepted:\n        w.writerow([id_, f"{amount:.2f}", cur])\nprint("Rejected:", rejected)',
      'import csv\naccepted, rejected = [], 0\nwith open("raw.csv", newline="") as f:\n    reader = csv.reader(f)\n    next(reader)\n    for row in reader:\n        if len(row) != 3:\n            rejected += 1\n            continue\n        id_ = row[0].strip()\n        cur = row[2].strip().upper()\n        try:\n            amount = float(row[1].strip().lstrip("$").replace(",", ""))\n        except ValueError:\n            rejected += 1\n            continue\n        if not id_.isdigit() or amount <= 0 or cur not in ("GBP", "USD", "EUR"):\n            rejected += 1\n            continue\n        accepted.append((id_, amount, cur))\nwith open("clean.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["id", "amount", "currency"])\n    for id_, amount, cur in accepted:\n        w.writerow([id_, f"{amount:.2f}", cur])\nprint("Rejected:", rejected)',
      'import csv\naccepted, seen, rejected = [], set(), 0\nwith open("raw.csv", newline="") as f:\n    reader = csv.reader(f)\n    next(reader)\n    for row in reader:\n        if len(row) != 3:\n            rejected += 1\n            continue\n        id_ = row[0].strip()\n        cur = row[2].strip()\n        try:\n            amount = float(row[1].strip().lstrip("$").replace(",", ""))\n        except ValueError:\n            rejected += 1\n            continue\n        if not id_.isdigit() or amount <= 0 or cur not in ("GBP", "USD", "EUR") or id_ in seen:\n            rejected += 1\n            continue\n        seen.add(id_)\n        accepted.append((id_, amount, cur))\nwith open("clean.csv", "w", newline="") as f:\n    w = csv.writer(f)\n    w.writerow(["id", "amount", "currency"])\n    for id_, amount, cur in accepted:\n        w.writerow([id_, f"{amount:.2f}", cur])\nprint("Rejected:", rejected)']
  },
  'py-21-quality-report': {
    valid: ['def quality_report(rows, low, high):\n    missing = dups = out = 0\n    seen = set()\n    for r in rows:\n        v = r["value"]\n        if v is None or v == "":\n            missing += 1\n        elif isinstance(v, (int, float)) and (v < low or v > high):\n            out += 1\n        key = (r["id"], v)\n        if key in seen:\n            dups += 1\n        else:\n            seen.add(key)\n    return {"total": len(rows), "missing": missing, "duplicates": dups, "out_of_range": out}'],
    wrong: ['def quality_report(rows, low, high):\n    missing = dups = out = 0\n    seen = set()\n    for r in rows:\n        v = r["value"]\n        if v is None or v == "":\n            missing += 1\n        elif isinstance(v, (int, float)) and (v <= low or v >= high):\n            out += 1\n        key = (r["id"], v)\n        if key in seen:\n            dups += 1\n        else:\n            seen.add(key)\n    return {"total": len(rows), "missing": missing, "duplicates": dups, "out_of_range": out}',
      'def quality_report(rows, low, high):\n    missing = dups = out = 0\n    seen = set()\n    for r in rows:\n        v = r["value"]\n        if v is None or v == "":\n            missing += 1\n        elif isinstance(v, (int, float)) and (v < low or v > high):\n            out += 1\n        if r["id"] in seen:\n            dups += 1\n        seen.add(r["id"])\n    return {"total": len(rows), "missing": missing, "duplicates": dups, "out_of_range": out}',
      'def quality_report(rows, low, high):\n    missing = dups = out = 0\n    seen = set()\n    for r in rows:\n        v = r["value"]\n        if v is None or v == "":\n            missing += 1\n        elif v < low or v > high:\n            out += 1\n        key = (r["id"], v)\n        if key in seen:\n            dups += 1\n        else:\n            seen.add(key)\n    return {"total": len(rows), "missing": missing, "duplicates": dups, "out_of_range": out}']
  },
  'py-21-stock-audit': {
    valid: ['def audit(records):\n    missing = neg = dups = 0\n    seen = set()\n    for r in records:\n        sku = r["sku"]\n        if sku is None or sku == "":\n            missing += 1\n        elif sku in seen:\n            dups += 1\n        else:\n            seen.add(sku)\n        if r["stock"] < 0:\n            neg += 1\n    return {"total": len(records), "missing_sku": missing, "negative_stock": neg, "duplicate_sku": dups}'],
    wrong: ['def audit(records):\n    missing = neg = dups = 0\n    seen = set()\n    for r in records:\n        sku = r["sku"]\n        if sku is None or sku == "":\n            missing += 1\n        if sku in seen:\n            dups += 1\n        seen.add(sku)\n        if r["stock"] < 0:\n            neg += 1\n    return {"total": len(records), "missing_sku": missing, "negative_stock": neg, "duplicate_sku": dups}',
      'def audit(records):\n    missing = neg = dups = 0\n    seen = set()\n    for r in records:\n        sku = r["sku"]\n        if sku is None or sku == "":\n            missing += 1\n        elif sku in seen:\n            dups += 1\n        else:\n            seen.add(sku)\n        if r["stock"] <= 0:\n            neg += 1\n    return {"total": len(records), "missing_sku": missing, "negative_stock": neg, "duplicate_sku": dups}']
  },
};
