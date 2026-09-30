/**
 * TEST-ONLY DATA (never imported by the app): reference solutions and plausible wrong attempts for the training problems.
 * No imports: the e2e runner loads this file under plain Node.
 */
export const trainingSolutions: Record<string, { valid: string[]; wrong: string[] }> = {
  'tr-str-sample': {
    valid: ['print(input().upper().replace("-", " "))', 'code = input()\nprint(code.replace("-", " ").upper())'],
    wrong: ['print(input().replace("-", " "))', 'print(input().upper().replace("-", " ", 1))', 'print(input().upper())'],
  },
  'tr-str-initials': {
    valid: ['print("".join(w[0].upper() + "." for w in input().split()))', 'out = ""\nfor w in input().split():\n    out += w[0].upper() + "."\nprint(out)'],
    wrong: ['print("".join(w[0] + "." for w in input().split()))', 'print("".join(w[0].upper() + "." for w in input().split(" ")))', 'print("".join(w[0].upper() for w in input().split()))'],
  },
  'tr-num-cartons': {
    valid: ['n = int(input())\nprint("Cartons:", n // 12)\nprint("Loose:", n % 12)', 'n = int(input())\nprint(f"Cartons: {n // 12}\\nLoose: {n % 12}")'],
    wrong: ['n = int(input())\nprint("Cartons:", n / 12)\nprint("Loose:", n % 12)', 'n = int(input())\nprint("Cartons:", n // 12)\nprint("Loose:", n // 12)', 'n = int(input())\nprint("Cartons:", n % 12)\nprint("Loose:", n // 12)'],
  },
  'tr-num-cents': {
    valid: ['c = int(input())\nprint(f"${c // 100}.{c % 100:02d}")', 'c = int(input())\nprint("$" + str(c // 100) + "." + str(c % 100).zfill(2))'],
    wrong: ['c = int(input())\nprint(f"${c // 100}.{c % 100}")', 'c = int(input())\nprint(f"${c / 100}")', 'c = int(input())\nprint(f"${c / 100:.1f}")'],
  },
  'tr-in-invoice': {
    valid: ['p = float(input())\nq = int(input())\nprint(f"Total: {p * q:.2f}")', 'p = float(input())\nq = float(input())\nprint("Total: %.2f" % (p * q))'],
    wrong: ['p = int(input())\nq = int(input())\nprint(f"Total: {p * q:.2f}")', 'p = float(input())\nq = int(input())\nprint("Total:", p * q)', 'p = input()\nq = input()\nprint("Total:", p * int(q))'],
  },
  'tr-in-birthday': {
    valid: ['name = input()\nage = int(input())\nprint(f"{name} is {age}; next year {age + 1}")', 'n = input()\na = int(input())\nprint(n, "is", a, end="; ")\nprint("next year", a + 1)'],
    wrong: ['name = input()\nage = input()\nprint(f"{name} is {age}; next year {age + 1}")', 'name = input()\nage = int(input())\nprint(f"{name} is {age}; next year {age}")', 'name = input()\nage = int(input())\nprint(f"{name} is {age}, next year {age + 1}")'],
  },
  'tr-log-alert': {
    valid: ['t = int(input())\nh = int(input())\nprint("ALERT" if t > 30 and h > 60 else "OK")', 't = int(input())\nh = int(input())\nif t > 30:\n    if h > 60:\n        print("ALERT")\n    else:\n        print("OK")\nelse:\n    print("OK")'],
    wrong: ['t = int(input())\nh = int(input())\nprint("ALERT" if t > 30 or h > 60 else "OK")', 't = int(input())\nh = int(input())\nprint("ALERT" if t >= 30 and h >= 60 else "OK")', 't = int(input())\nh = int(input())\nprint("ALERT" if t > 30 and h > 60 else "ok")'],
  },
  'tr-log-entry': {
    valid: ['age = int(input())\nescort = input()\nprint("Enter" if age >= 18 or (age >= 12 and escort == "yes") else "Wait")', 'age = int(input())\nescort = input()\nif age >= 18:\n    print("Enter")\nelif age >= 12 and escort == "yes":\n    print("Enter")\nelse:\n    print("Wait")'],
    wrong: ['age = int(input())\nescort = input()\nprint("Enter" if age >= 18 or escort == "yes" else "Wait")', 'age = int(input())\nescort = input()\nprint("Enter" if age > 18 or (age >= 12 and escort == "yes") else "Wait")', 'age = int(input())\nescort = input()\nprint("Enter" if age >= 18 and escort == "yes" else "Wait")'],
  },
  'tr-cond-ph': {
    valid: ['p = float(input())\nif p < 6.5:\n    print("acidic")\nelif p > 7.5:\n    print("alkaline")\nelse:\n    print("neutral")', 'p = float(input())\nprint("acidic" if p < 6.5 else "alkaline" if p > 7.5 else "neutral")'],
    wrong: ['p = float(input())\nif p <= 6.5:\n    print("acidic")\nelif p >= 7.5:\n    print("alkaline")\nelse:\n    print("neutral")', 'p = float(input())\nif p < 6.5:\n    print("acidic")\nelif p > 7.5:\n    print("alkaline")\nelse:\n    print("acidic")', 'p = int(input())\nif p < 6.5:\n    print("acidic")\nelif p > 7.5:\n    print("alkaline")\nelse:\n    print("neutral")'],
  },
  'tr-cond-shipping': {
    valid: ['w = float(input())\nif w <= 1:\n    print("Cost: 5.00")\nelif w <= 5:\n    print("Cost: 9.50")\nelif w <= 20:\n    print("Cost: 20.00")\nelse:\n    print("Freight")', 'w = float(input())\nprint("Cost: 5.00" if w <= 1 else "Cost: 9.50" if w <= 5 else "Cost: 20.00" if w <= 20 else "Freight")'],
    wrong: ['w = float(input())\nif w < 1:\n    print("Cost: 5.00")\nelif w < 5:\n    print("Cost: 9.50")\nelif w < 20:\n    print("Cost: 20.00")\nelse:\n    print("Freight")', 'w = float(input())\nif w <= 20:\n    print("Cost: 20.00")\nelif w <= 5:\n    print("Cost: 9.50")\nelif w <= 1:\n    print("Cost: 5.00")\nelse:\n    print("Freight")', 'w = int(input())\nif w <= 1:\n    print("Cost: 5.00")\nelif w <= 5:\n    print("Cost: 9.50")\nelif w <= 20:\n    print("Cost: 20.00")\nelse:\n    print("Freight")'],
  },
  'tr-loop-countdown': {
    valid: ['n = int(input())\nfor i in range(n, 0, -1):\n    print(i)\nprint("Liftoff!")', 'n = int(input())\nwhile n > 0:\n    print(n)\n    n -= 1\nprint("Liftoff!")'],
    wrong: ['n = int(input())\nfor i in range(n):\n    print(i)\nprint("Liftoff!")', 'n = int(input())\nfor i in range(n, 0, -1):\n    print(i)', 'n = int(input())\nfor i in range(n, -1, -1):\n    print(i)\nprint("Liftoff!")'],
  },
  'tr-loop-largest': {
    valid: ['best = None\nwhile True:\n    x = int(input())\n    if x == 0:\n        break\n    if best is None or x > best:\n        best = x\nprint("none" if best is None else best)', 'best = None\nx = int(input())\nwhile x != 0:\n    if best is None or x > best:\n        best = x\n    x = int(input())\nprint(best if best is not None else "none")'],
    wrong: ['best = 0\nwhile True:\n    x = int(input())\n    if x == 0:\n        break\n    if x > best:\n        best = x\nprint(best)', 'best = None\nwhile True:\n    x = int(input())\n    if best is None or x > best:\n        best = x\n    if x == 0:\n        break\nprint("none" if best is None else best)', 'last = None\nwhile True:\n    x = int(input())\n    if x == 0:\n        break\n    last = x\nprint("none" if last is None else last)'],
  },
  'tr-fn-bmi': {
    valid: ['def bmi_category(weight_kg, height_m):\n    b = weight_kg / (height_m ** 2)\n    if b < 18.5:\n        return "under"\n    if b < 25:\n        return "normal"\n    if b < 30:\n        return "over"\n    return "obese"'],
    wrong: ['def bmi_category(weight_kg, height_m):\n    b = weight_kg / height_m\n    if b < 18.5:\n        return "under"\n    if b < 25:\n        return "normal"\n    if b < 30:\n        return "over"\n    return "obese"', 'def bmi_category(weight_kg, height_m):\n    b = weight_kg / (height_m ** 2)\n    if b <= 18.5:\n        return "under"\n    if b <= 25:\n        return "normal"\n    if b <= 30:\n        return "over"\n    return "obese"', 'def bmi_category(weight_kg, height_m):\n    b = weight_kg / (height_m ** 2)\n    if b < 18.5:\n        print("under")\n    elif b < 25:\n        print("normal")\n    elif b < 30:\n        print("over")\n    else:\n        print("obese")'],
  },
  'tr-fn-price': {
    valid: ['def final_price(price, member, coupon):\n    if member:\n        price = price * 0.9\n    if coupon == "SAVE5":\n        price = price - 5\n    return round(max(price, 0), 2)'],
    wrong: ['def final_price(price, member, coupon):\n    if coupon == "SAVE5":\n        price = price - 5\n    if member:\n        price = price * 0.9\n    return round(max(price, 0), 2)', 'def final_price(price, member, coupon):\n    if member:\n        price = price * 0.9\n    if coupon == "SAVE5":\n        price = price - 5\n    return round(price, 2)', 'def final_price(price, member, coupon):\n    if member:\n        price = price * 0.9\n    if coupon.upper() == "SAVE5":\n        price = price - 5\n    return round(max(price, 0), 2)'],
  },
  'tr-list-second': {
    valid: ['def second_largest(values):\n    s = sorted(set(values))\n    return s[-2] if len(s) >= 2 else None', 'def second_largest(values):\n    top = None\n    second = None\n    for v in values:\n        if top is None or v > top:\n            second = top\n            top = v\n        elif v != top and (second is None or v > second):\n            second = v\n    return second'],
    wrong: ['def second_largest(values):\n    s = sorted(values)\n    return s[-2] if len(s) >= 2 else None', 'def second_largest(values):\n    s = sorted(set(values))\n    return s[-2]', 'def second_largest(values):\n    s = sorted(set(values))\n    return s[1] if len(s) >= 2 else None'],
  },
  'tr-list-outliers': {
    valid: ['def drop_spikes(values, limit):\n    return [v for v in values if abs(v) <= limit]', 'def drop_spikes(values, limit):\n    out = []\n    for v in values:\n        if -limit <= v <= limit:\n            out.append(v)\n    return out'],
    wrong: ['def drop_spikes(values, limit):\n    return [v for v in values if v <= limit]', 'def drop_spikes(values, limit):\n    return [v for v in values if abs(v) < limit]', 'def drop_spikes(values, limit):\n    for v in values[:]:\n        if abs(v) > limit:\n            values.remove(v)\n    return values'],
  },
  'tr-dict-lengths': {
    valid: ['def word_lengths(words):\n    return {w: len(w) for w in words}', 'def word_lengths(words):\n    out = {}\n    for w in words:\n        out[w] = len(w)\n    return out'],
    wrong: ['def word_lengths(words):\n    return {len(w): w for w in words}', 'def word_lengths(words):\n    return [len(w) for w in words]', 'def word_lengths(words):\n    out = {}\n    for w in words:\n        out[w] = out.get(w, 0) + len(w)\n    return out'],
  },
  'tr-dict-invert': {
    valid: ['def people_by_room(directory):\n    out = {}\n    for name, room in directory.items():\n        out.setdefault(room, []).append(name)\n    return {r: sorted(n) for r, n in out.items()}', 'def people_by_room(directory):\n    out = {}\n    for name in sorted(directory):\n        room = directory[name]\n        if room not in out:\n            out[room] = []\n        out[room].append(name)\n    return out'],
    wrong: ['def people_by_room(directory):\n    return {room: name for name, room in directory.items()}', 'def people_by_room(directory):\n    out = {}\n    for name, room in directory.items():\n        out.setdefault(room, []).append(name)\n    return out', 'def people_by_room(directory):\n    out = {}\n    for name, room in directory.items():\n        out[room] = [name]\n    return out'],
  },
  'tr-rec-cheapest': {
    valid: ['def cheapest_by_category(items):\n    best = {}\n    for it in items:\n        c = it["category"]\n        if c not in best or it["price"] < best[c]["price"]:\n            best[c] = it\n    return {c: v["name"] for c, v in best.items()}'],
    wrong: ['def cheapest_by_category(items):\n    best = {}\n    for it in items:\n        c = it["category"]\n        if c not in best or it["price"] <= best[c]["price"]:\n            best[c] = it\n    return {c: v["name"] for c, v in best.items()}', 'def cheapest_by_category(items):\n    best = {}\n    for it in items:\n        c = it["category"]\n        if c not in best or it["price"] > best[c]["price"]:\n            best[c] = it\n    return {c: v["name"] for c, v in best.items()}', 'def cheapest_by_category(items):\n    return {it["category"]: it["name"] for it in items}'],
  },
  'tr-rec-monthly': {
    valid: ['def takings_by_month(sales):\n    out = {}\n    for s in sales:\n        m = s["date"][:7]\n        out[m] = out.get(m, 0) + s["amount"]\n    return {m: round(v, 2) for m, v in out.items()}'],
    wrong: ['def takings_by_month(sales):\n    out = {}\n    for s in sales:\n        m = s["date"][:7]\n        out[m] = out.get(m, 0) + s["amount"]\n    return out', 'def takings_by_month(sales):\n    out = {}\n    for s in sales:\n        m = s["date"][5:7]\n        out[m] = out.get(m, 0) + s["amount"]\n    return {m: round(v, 2) for m, v in out.items()}', 'def takings_by_month(sales):\n    out = {}\n    for s in sales:\n        m = s["date"][:7]\n        out[m] = s["amount"]\n    return {m: round(v, 2) for m, v in out.items()}'],
  },
  'tr-lists-running': {
    valid: ['def record_highs(temps):\n    out = []\n    best = None\n    for t in temps:\n        if best is None or t > best:\n            best = t\n        out.append(best)\n    return out'],
    wrong: ['def record_highs(temps):\n    return [max(temps)] * len(temps)', 'def record_highs(temps):\n    out = []\n    best = 0\n    for t in temps:\n        if t > best:\n            best = t\n        out.append(best)\n    return out', 'def record_highs(temps):\n    out = []\n    for i in range(1, len(temps)):\n        out.append(max(temps[:i]))\n    return out'],
  },
  'tr-lists-pairs': {
    valid: ['def matching_pairs(weights, limit):\n    out = []\n    for i in range(len(weights)):\n        for j in range(i + 1, len(weights)):\n            if weights[i] + weights[j] == limit:\n                out.append((i, j))\n    return out'],
    wrong: ['def matching_pairs(weights, limit):\n    out = []\n    for i in range(len(weights)):\n        for j in range(len(weights)):\n            if weights[i] + weights[j] == limit:\n                out.append((i, j))\n    return out', 'def matching_pairs(weights, limit):\n    out = []\n    for i in range(len(weights)):\n        for j in range(i + 1, len(weights)):\n            if weights[i] + weights[j] == limit:\n                out.append((weights[i], weights[j]))\n    return out', 'def matching_pairs(weights, limit):\n    out = []\n    for i in range(len(weights)):\n        for j in range(i + 1, len(weights)):\n            if weights[i] + weights[j] <= limit:\n                out.append((i, j))\n    return out'],
  },
  'tr-dictloop-lengths': {
    valid: ['def length_counts(words):\n    out = {}\n    for w in words:\n        out[len(w)] = out.get(len(w), 0) + 1\n    return out'],
    wrong: ['def length_counts(words):\n    out = {}\n    for w in words:\n        out[len(w)] = 1\n    return out', 'def length_counts(words):\n    out = {}\n    for w in words:\n        out[w] = out.get(w, 0) + 1\n    return out', 'def length_counts(words):\n    out = {}\n    for w in words:\n        out[len(w)] = out.get(len(w), 0) + len(w)\n    return out'],
  },
  'tr-dictloop-frequent': {
    valid: ['def top_request(titles):\n    counts = {}\n    for t in titles:\n        counts[t] = counts.get(t, 0) + 1\n    best = None\n    for t in titles:\n        if best is None or counts[t] > counts[best]:\n            best = t\n    return best'],
    wrong: ['def top_request(titles):\n    counts = {}\n    for t in titles:\n        counts[t] = counts.get(t, 0) + 1\n    best = None\n    for t in titles:\n        if best is None or counts[t] >= counts[best]:\n            best = t\n    return best', 'def top_request(titles):\n    return sorted(titles)[0] if titles else None'],
  },
  'tr-condloop-bands': {
    valid: ['def band_counts(scores):\n    low = mid = high = 0\n    for s in scores:\n        if s < 50:\n            low += 1\n        elif s < 75:\n            mid += 1\n        else:\n            high += 1\n    return (low, mid, high)'],
    wrong: ['def band_counts(scores):\n    low = mid = high = 0\n    for s in scores:\n        if s <= 50:\n            low += 1\n        elif s <= 75:\n            mid += 1\n        else:\n            high += 1\n    return (low, mid, high)', 'def band_counts(scores):\n    low = mid = high = 0\n    for s in scores:\n        if s < 50:\n            low += 1\n        if s < 75:\n            mid += 1\n        else:\n            high += 1\n    return (low, mid, high)', 'def band_counts(scores):\n    low = mid = high = 0\n    for s in scores:\n        if s < 50:\n            low += 1\n        elif s < 75:\n            mid += 1\n        else:\n            high += 1\n    return [low, mid, high]'],
  },
  'tr-condloop-streak': {
    valid: ['def longest_up_streak(checks):\n    best = cur = 0\n    for c in checks:\n        if c:\n            cur += 1\n            best = max(best, cur)\n        else:\n            cur = 0\n    return best'],
    wrong: ['def longest_up_streak(checks):\n    return sum(1 for c in checks if c)', 'def longest_up_streak(checks):\n    best = cur = 0\n    for c in checks:\n        if c:\n            cur += 1\n        else:\n            best = max(best, cur)\n            cur = 0\n    return best', 'def longest_up_streak(checks):\n    best = cur = 0\n    for c in checks:\n        if c:\n            cur += 1\n            best = max(best, cur)\n    return best'],
  },
  'tr-sql-technicians': {
    valid: ["SELECT name FROM employees WHERE role = 'technician' AND hourly_rate >= 30 ORDER BY name;", "SELECT name FROM employees WHERE hourly_rate >= 30 AND role = 'technician' ORDER BY name ASC;"],
    wrong: ["SELECT name FROM employees WHERE role = 'technician' OR hourly_rate >= 30 ORDER BY name;", "SELECT name FROM employees WHERE role = 'operator' AND hourly_rate >= 30 ORDER BY name;", "SELECT name FROM employees WHERE role = 'technician' AND hourly_rate >= 30;"],
  },
  'tr-sql-young': {
    valid: ['SELECT name, birth_year FROM players WHERE birth_year > 1990 ORDER BY birth_year DESC, name LIMIT 5;'],
    wrong: ['SELECT name, birth_year FROM players WHERE birth_year > 1990 ORDER BY birth_year, name LIMIT 5;', 'SELECT name, birth_year FROM players WHERE birth_year > 1990 ORDER BY birth_year DESC, name;', 'SELECT name, birth_year FROM players WHERE birth_year < 1990 ORDER BY birth_year DESC, name LIMIT 5;'],
  },
  'tr-sql-categories': {
    valid: ['SELECT category, COUNT(*) AS products, ROUND(AVG(price), 2) AS avg_price FROM products GROUP BY category ORDER BY category;'],
    wrong: ['SELECT category, COUNT(*) AS products, AVG(price) AS avg_price FROM products GROUP BY category ORDER BY category;', 'SELECT category, COUNT(*) AS products, ROUND(SUM(price), 2) AS avg_price FROM products GROUP BY category ORDER BY category;', 'SELECT category, COUNT(*) AS products, ROUND(AVG(price), 2) AS avg_price FROM products ORDER BY category;'],
  },
  'tr-sql-busy': {
    valid: ['SELECT machine_id, SUM(units_made) AS total FROM production_runs GROUP BY machine_id HAVING SUM(units_made) > 6000 ORDER BY total DESC;'],
    wrong: ['SELECT machine_id, SUM(units_made) AS total FROM production_runs WHERE units_made > 6000 GROUP BY machine_id ORDER BY total DESC;', 'SELECT machine_id, SUM(units_made) AS total FROM production_runs GROUP BY machine_id HAVING SUM(units_made) > 6000 ORDER BY total;', 'SELECT machine_id, COUNT(*) AS total FROM production_runs GROUP BY machine_id HAVING COUNT(*) > 6000 ORDER BY total DESC;'],
  },
  'tr-sql-returned': {
    valid: ["SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'returned' ORDER BY c.name;", "SELECT c.name FROM customers c WHERE c.id IN (SELECT customer_id FROM orders WHERE status = 'returned') ORDER BY c.name;"],
    wrong: ["SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'returned' ORDER BY c.name;", "SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'paid' ORDER BY c.name;", "SELECT DISTINCT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id ORDER BY c.name;"],
  },
  'tr-sql-departments': {
    valid: ['SELECT d.name, COUNT(m.id) AS machines FROM departments d LEFT JOIN machines m ON m.department_id = d.id GROUP BY d.id ORDER BY d.name;', 'SELECT d.name, (SELECT COUNT(*) FROM machines m WHERE m.department_id = d.id) AS machines FROM departments d ORDER BY d.name;'],
    wrong: ['SELECT d.name, COUNT(m.id) AS machines FROM departments d JOIN machines m ON m.department_id = d.id GROUP BY d.id ORDER BY d.name;', 'SELECT d.name, COUNT(*) AS machines FROM departments d LEFT JOIN machines m ON m.department_id = d.id GROUP BY d.id ORDER BY d.name;', 'SELECT d.name, COUNT(m.id) AS machines FROM departments d LEFT JOIN machines m ON m.department_id = d.id GROUP BY d.id;'],
  },
};
