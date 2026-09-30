/**
 * TEST-ONLY DATA (never imported by the app): reference solutions and plausible wrong attempts for Daily Challenges.
 */
export const dailySolutions: Record<string, { valid: string[]; wrong: string[] }> = {
 "daily-py-shipping-label": {
  "valid": [
   "print(\"TO: Bytehaven Works\")\nprint(\"WEIGHT: 12 kg\")\nprint(\"HANDLE WITH CARE\")",
   "print(\"TO: Bytehaven Works\\nWEIGHT: 12 kg\\nHANDLE WITH CARE\")"
  ],
  "wrong": [
   "print(\"TO: Bytehaven Works\")\nprint(\"WEIGHT: 12 kg\")",
   "print(\"to: bytehaven works\")\nprint(\"WEIGHT: 12 kg\")\nprint(\"HANDLE WITH CARE\")"
  ]
 },
 "daily-py-rectangle": {
  "valid": [
   "w = int(input())\nl = int(input())\nprint(\"Fence:\", 2 * (w + l))\nprint(\"Paint:\", w * l)",
   "w = int(input())\nl = int(input())\nprint(f\"Fence: {w + w + l + l}\")\nprint(f\"Paint: {l * w}\")"
  ],
  "wrong": [
   "w = int(input())\nl = int(input())\nprint(\"Fence:\", w + l)\nprint(\"Paint:\", w * l)",
   "w = int(input())\nl = int(input())\nprint(\"Fence:\", 2 * (w + l))\nprint(\"Paint:\", 2 * w * l)"
  ]
 },
 "daily-py-initials": {
  "valid": [
   "def initials(name):\n    return \"\".join(w[0].upper() + \".\" for w in name.split())",
   "def initials(name):\n    out = \"\"\n    for word in name.split(\" \"):\n        if word:\n            out += word[0].upper() + \".\"\n    return out"
  ],
  "wrong": [
   "def initials(name):\n    return \"\".join(w[0].upper() for w in name.split())",
   "def initials(name):\n    return \"\".join(w[0] + \".\" for w in name.split())",
   "def initials(name):\n    return \"\".join(w[0].upper() + \".\" for w in name.split(\" \"))"
  ]
 },
 "daily-py-split-bill": {
  "valid": [
   "def split_bill(total, people, tip_percent):\n    return round(total * (1 + tip_percent / 100) / people, 2)",
   "def split_bill(total, people, tip_percent):\n    tip = total * tip_percent / 100\n    return round((total + tip) / people, 2)"
  ],
  "wrong": [
   "def split_bill(total, people, tip_percent):\n    return round(total / people * tip_percent, 2)",
   "def split_bill(total, people, tip_percent):\n    return round(total / people + tip_percent, 2)",
   "def split_bill(total, people, tip_percent):\n    return total * (1 + tip_percent / 100) / people"
  ]
 },
 "daily-py-shipping-class": {
  "valid": [
   "def parcel_class(weight_kg, fragile):\n    if weight_kg <= 0:\n        return \"invalid\"\n    if weight_kg >= 30:\n        return \"freight\"\n    if fragile:\n        return \"careful\"\n    if weight_kg >= 5:\n        return \"standard\"\n    return \"letter\""
  ],
  "wrong": [
   "def parcel_class(weight_kg, fragile):\n    if fragile:\n        return \"careful\"\n    if weight_kg >= 30:\n        return \"freight\"\n    if weight_kg >= 5:\n        return \"standard\"\n    return \"letter\"",
   "def parcel_class(weight_kg, fragile):\n    if weight_kg > 30:\n        return \"freight\"\n    if fragile:\n        return \"careful\"\n    if weight_kg > 5:\n        return \"standard\"\n    return \"letter\"",
   "def parcel_class(weight_kg, fragile):\n    if weight_kg >= 30:\n        return \"freight\"\n    if fragile:\n        return \"careful\"\n    if weight_kg >= 5:\n        return \"standard\"\n    return \"letter\""
  ]
 },
 "daily-py-longest-rise": {
  "valid": [
   "def longest_rise(readings):\n    best = 0\n    run = 0\n    prev = None\n    for x in readings:\n        run = run + 1 if prev is not None and x > prev else 1\n        best = max(best, run)\n        prev = x\n    return best"
  ],
  "wrong": [
   "def longest_rise(readings):\n    best = 0\n    run = 0\n    prev = None\n    for x in readings:\n        run = run + 1 if prev is not None and x >= prev else 1\n        best = max(best, run)\n        prev = x\n    return best",
   "def longest_rise(readings):\n    return sum(1 for i in range(1, len(readings)) if readings[i] > readings[i - 1])",
   "def longest_rise(readings):\n    best = 0\n    run = 1\n    for i in range(1, len(readings)):\n        run = run + 1 if readings[i] > readings[i - 1] else 1\n        best = max(best, run)\n    return best"
  ]
 },
 "daily-py-normalise": {
  "valid": [
   "def scale(values):\n    if not values:\n        return []\n    lo, hi = min(values), max(values)\n    if hi == lo:\n        return [0.0 for _ in values]\n    return [round((v - lo) / (hi - lo), 3) for v in values]"
  ],
  "wrong": [
   "def scale(values):\n    lo, hi = min(values), max(values)\n    return [round((v - lo) / (hi - lo), 3) for v in values]",
   "def scale(values):\n    if not values:\n        return []\n    values.sort()\n    lo, hi = values[0], values[-1]\n    return [0.0 if hi == lo else round((v - lo) / (hi - lo), 3) for v in values]",
   "def scale(values):\n    if not values:\n        return []\n    hi = max(values)\n    return [round(v / hi, 3) for v in values]"
  ]
 },
 "daily-py-rotate": {
  "valid": [
   "def rotate(items, k):\n    if not items:\n        return []\n    k %= len(items)\n    return items[len(items) - k:] + items[:len(items) - k]",
   "def rotate(items, k):\n    out = list(items)\n    for _ in range(k % len(out) if out else 0):\n        out.insert(0, out.pop())\n    return out"
  ],
  "wrong": [
   "def rotate(items, k):\n    if not items:\n        return []\n    k %= len(items)\n    return items[k:] + items[:k]",
   "def rotate(items, k):\n    return items[-k:] + items[:-k]",
   "def rotate(items, k):\n    if not items:\n        return []\n    k %= len(items)\n    items[:] = items[-k:] + items[:-k]\n    return items"
  ]
 },
 "daily-py-merge": {
  "valid": [
   "def merge(a, b):\n    out = []\n    i = j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            out.append(a[i])\n            i += 1\n        else:\n            out.append(b[j])\n            j += 1\n    return out + a[i:] + b[j:]",
   "def merge(a, b):\n    return sorted(a + b)"
  ],
  "wrong": [
   "def merge(a, b):\n    return a + b",
   "def merge(a, b):\n    return sorted(set(a + b))",
   "def merge(a, b):\n    out = []\n    i = j = 0\n    while i < len(a) and j < len(b):\n        if a[i] < b[j]:\n            out.append(a[i])\n            i += 1\n        else:\n            out.append(b[j])\n            j += 1\n    return out"
  ]
 },
 "daily-py-top-words": {
  "valid": [
   "def top_words(text, n):\n    counts = {}\n    for w in text.split():\n        w = w.strip(\".,!?\").lower()\n        if w:\n            counts[w] = counts.get(w, 0) + 1\n    return sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:n]"
  ],
  "wrong": [
   "def top_words(text, n):\n    counts = {}\n    for w in text.split():\n        w = w.strip(\".,!?\").lower()\n        if w:\n            counts[w] = counts.get(w, 0) + 1\n    return sorted(counts.items(), key=lambda kv: -kv[1])[:n]",
   "def top_words(text, n):\n    counts = {}\n    for w in text.split():\n        w = w.lower()\n        counts[w] = counts.get(w, 0) + 1\n    return sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:n]",
   "def top_words(text, n):\n    counts = {}\n    for w in text.split():\n        w = w.strip(\".,!?\").lower()\n        if w:\n            counts[w] = counts.get(w, 0) + 1\n    return sorted(counts.items(), key=lambda kv: (kv[1], kv[0]))[:n]"
  ]
 },
 "daily-py-anagrams": {
  "valid": [
   "def group_anagrams(words):\n    groups = {}\n    for w in words:\n        w = w.lower()\n        groups.setdefault(\"\".join(sorted(w)), []).append(w)\n    return sorted((sorted(g) for g in groups.values()), key=lambda g: g[0])"
  ],
  "wrong": [
   "def group_anagrams(words):\n    groups = {}\n    for w in words:\n        groups.setdefault(\"\".join(sorted(w)), []).append(w)\n    return sorted((sorted(g) for g in groups.values()), key=lambda g: g[0])",
   "def group_anagrams(words):\n    groups = {}\n    for w in words:\n        w = w.lower()\n        groups.setdefault(\"\".join(sorted(w)), []).append(w)\n    return list(groups.values())",
   "def group_anagrams(words):\n    groups = {}\n    for w in words:\n        w = w.lower()\n        groups.setdefault(\"\".join(sorted(w)), set()).add(w)\n    return sorted((sorted(g) for g in groups.values()), key=lambda g: g[0])"
  ]
 },
 "daily-py-standings": {
  "valid": [
   "def standings(games):\n    pts = {}\n    for g in games:\n        h, a = g[\"home\"], g[\"away\"]\n        pts.setdefault(h, 0)\n        pts.setdefault(a, 0)\n        if g[\"home_score\"] > g[\"away_score\"]:\n            pts[h] += 3\n        elif g[\"home_score\"] < g[\"away_score\"]:\n            pts[a] += 3\n        else:\n            pts[h] += 1\n            pts[a] += 1\n    return sorted(pts.items(), key=lambda kv: (-kv[1], kv[0]))"
  ],
  "wrong": [
   "def standings(games):\n    pts = {}\n    for g in games:\n        h, a = g[\"home\"], g[\"away\"]\n        pts.setdefault(h, 0)\n        pts.setdefault(a, 0)\n        if g[\"home_score\"] > g[\"away_score\"]:\n            pts[h] += 3\n        elif g[\"home_score\"] < g[\"away_score\"]:\n            pts[a] += 3\n        else:\n            pts[h] += 1\n    return sorted(pts.items(), key=lambda kv: (-kv[1], kv[0]))",
   "def standings(games):\n    pts = {}\n    for g in games:\n        h, a = g[\"home\"], g[\"away\"]\n        pts.setdefault(h, 0)\n        pts.setdefault(a, 0)\n        if g[\"home_score\"] > g[\"away_score\"]:\n            pts[h] += 3\n        elif g[\"home_score\"] < g[\"away_score\"]:\n            pts[a] += 3\n        else:\n            pts[h] += 1\n            pts[a] += 1\n    return sorted(pts.items(), key=lambda kv: (-kv[1],))",
   "def standings(games):\n    pts = {}\n    for g in games:\n        h, a = g[\"home\"], g[\"away\"]\n        if g[\"home_score\"] > g[\"away_score\"]:\n            pts[h] = pts.get(h, 0) + 3\n        elif g[\"home_score\"] < g[\"away_score\"]:\n            pts[a] = pts.get(a, 0) + 3\n        else:\n            pts[h] = pts.get(h, 0) + 1\n            pts[a] = pts.get(a, 0) + 1\n    return sorted(pts.items(), key=lambda kv: (-kv[1], kv[0]))"
  ]
 },
 "daily-py-monthly-totals": {
  "valid": [
   "def monthly_totals(transactions):\n    out = {}\n    for t in transactions:\n        key = t[\"date\"][:7]\n        out[key] = out.get(key, 0) + t[\"amount\"]\n    return {k: round(v, 2) for k, v in out.items()}",
   "from collections import defaultdict\n\ndef monthly_totals(transactions):\n    tot = defaultdict(float)\n    for t in transactions:\n        tot[t[\"date\"][0:7]] += t[\"amount\"]\n    return {k: round(v, 2) for k, v in tot.items()}"
  ],
  "wrong": [
   "def monthly_totals(transactions):\n    out = {}\n    for t in transactions:\n        key = t[\"date\"][:10]\n        out[key] = out.get(key, 0) + t[\"amount\"]\n    return {k: round(v, 2) for k, v in out.items()}",
   "def monthly_totals(transactions):\n    out = {}\n    for t in transactions:\n        key = t[\"date\"][:7]\n        out[key] = out.get(key, 0) + t[\"amount\"]\n    return {k: v for k, v in out.items()}",
   "def monthly_totals(transactions):\n    out = {}\n    for t in transactions:\n        key = t[\"date\"][:7]\n        out[key] = out.get(key, 0) + abs(t[\"amount\"])\n    return {k: round(v, 2) for k, v in out.items()}"
  ]
 },
 "daily-py-conflicts": {
  "valid": [
   "def find_clashes(bookings):\n    out = set()\n    for i in range(len(bookings)):\n        for j in range(i + 1, len(bookings)):\n            a, b = bookings[i], bookings[j]\n            if a[1] < b[2] and b[1] < a[2]:\n                out.add(tuple(sorted((a[0], b[0]))))\n    return sorted(out)"
  ],
  "wrong": [
   "def find_clashes(bookings):\n    out = set()\n    for i in range(len(bookings)):\n        for j in range(i + 1, len(bookings)):\n            a, b = bookings[i], bookings[j]\n            if a[1] <= b[2] and b[1] <= a[2]:\n                out.add(tuple(sorted((a[0], b[0]))))\n    return sorted(out)",
   "def find_clashes(bookings):\n    out = set()\n    for i in range(len(bookings)):\n        for j in range(i + 1, len(bookings)):\n            a, b = bookings[i], bookings[j]\n            if a[1] < b[2] and b[1] < a[2]:\n                out.add((a[0], b[0]))\n    return sorted(out)",
   "def find_clashes(bookings):\n    out = set()\n    for i in range(len(bookings)):\n        for j in range(i + 1, len(bookings)):\n            a, b = bookings[i], bookings[j]\n            if b[1] < a[2]:\n                out.add(tuple(sorted((a[0], b[0]))))\n    return list(out)"
  ]
 },
 "daily-py-fix-median": {
  "valid": [
   "def median(values):\n    s = sorted(values)\n    mid = len(s) // 2\n    if len(s) % 2:\n        return s[mid]\n    return (s[mid - 1] + s[mid]) / 2"
  ],
  "wrong": [
   "def median(values):\n    s = sorted(values)\n    return s[len(s) // 2]",
   "def median(values):\n    values.sort()\n    mid = len(values) // 2\n    if len(values) % 2:\n        return values[mid]\n    return (values[mid - 1] + values[mid]) / 2",
   "def median(values):\n    return sum(values) / len(values)"
  ]
 },
 "daily-py-safe-mean": {
  "valid": [
   "import math\n\ndef safe_mean(values):\n    good = []\n    for v in values:\n        if isinstance(v, bool):\n            continue\n        try:\n            x = float(v)\n        except (TypeError, ValueError):\n            continue\n        if math.isfinite(x):\n            good.append(x)\n    if not good:\n        return None\n    return round(sum(good) / len(good), 2)"
  ],
  "wrong": [
   "import math\n\ndef safe_mean(values):\n    good = []\n    for v in values:\n        try:\n            x = float(v)\n        except (TypeError, ValueError):\n            continue\n        if math.isfinite(x):\n            good.append(x)\n    if not good:\n        return None\n    return round(sum(good) / len(good), 2)",
   "import math\n\ndef safe_mean(values):\n    good = []\n    for v in values:\n        if isinstance(v, bool):\n            continue\n        try:\n            x = float(v)\n        except (TypeError, ValueError):\n            continue\n        if True:\n            good.append(x)\n    if not good:\n        return None\n    return round(sum(good) / len(good), 2)",
   "import math\n\ndef safe_mean(values):\n    good = []\n    for v in values:\n        if isinstance(v, bool):\n            continue\n        try:\n            x = float(v)\n        except (TypeError, ValueError):\n            continue\n        if math.isfinite(x):\n            good.append(x)\n    return round(sum(good) / max(1, len(good)), 2)",
   "import math\n\ndef safe_mean(values):\n    good = []\n    for v in values:\n        if isinstance(v, bool):\n            continue\n        try:\n            x = float(v)\n        except ValueError:\n            continue\n        if math.isfinite(x):\n            good.append(x)\n    if not good:\n        return None\n    return round(sum(good) / len(good), 2)"
  ]
 },
 "daily-py-regional-sales": {
  "valid": [
   "import csv\n\ntotals = {}\nwith open(\"sales.csv\", newline=\"\") as f:\n    for row in csv.DictReader(f):\n        totals[row[\"region\"]] = totals.get(row[\"region\"], 0) + float(row[\"amount\"])\nfor region, total in sorted(totals.items(), key=lambda kv: (-kv[1], kv[0])):\n    print(f\"{region}: {total:.2f}\")"
  ],
  "wrong": [
   "import csv\n\ntotals = {}\nwith open(\"sales.csv\", newline=\"\") as f:\n    for row in csv.DictReader(f):\n        totals[row[\"region\"]] = totals.get(row[\"region\"], 0) + float(row[\"amount\"])\nfor region, total in sorted(totals.items()):\n    print(f\"{region}: {total:.2f}\")",
   "import csv\n\ntotals = {}\nwith open(\"sales.csv\", newline=\"\") as f:\n    for row in csv.DictReader(f):\n        totals[row[\"region\"]] = totals.get(row[\"region\"], 0) + float(row[\"amount\"])\nfor region, total in sorted(totals.items(), key=lambda kv: -kv[1]):\n    print(f\"{region}: {total:.2f}\")",
   "import csv\n\ntotals = {}\nwith open(\"sales.csv\", newline=\"\") as f:\n    for row in csv.DictReader(f):\n        totals[row[\"region\"]] = totals.get(row[\"region\"], 0) + float(row[\"amount\"])\nfor region, total in sorted(totals.items(), key=lambda kv: (-kv[1], kv[0])):\n    print(f\"{region}: {total}\")"
  ]
 },
 "daily-py-phones": {
  "valid": [
   "import csv, re\n\nseen = set()\nrows = []\nwith open(\"contacts.csv\", newline=\"\") as f:\n    for r in csv.DictReader(f):\n        name = r[\"name\"].strip()\n        digits = re.sub(r\"\\D\", \"\", r[\"phone\"])\n        if len(digits) == 11 and digits[0] == \"1\":\n            digits = digits[1:]\n        if not name or len(digits) != 10:\n            continue\n        phone = f\"{digits[:3]}-{digits[3:6]}-{digits[6:]}\"\n        if (name, phone) in seen:\n            continue\n        seen.add((name, phone))\n        rows.append((name, phone))\nwith open(\"phones.csv\", \"w\", newline=\"\") as f:\n    w = csv.writer(f, lineterminator=\"\\n\")\n    w.writerow([\"name\", \"phone\"])\n    w.writerows(rows)\nprint(f\"Kept: {len(rows)}\")"
  ],
  "wrong": [
   "import csv, re\n\nseen = set()\nrows = []\nwith open(\"contacts.csv\", newline=\"\") as f:\n    for r in csv.DictReader(f):\n        name = r[\"name\"].strip()\n        digits = re.sub(r\"\\D\", \"\", r[\"phone\"])\n        if not name or len(digits) != 10:\n            continue\n        phone = f\"{digits[:3]}-{digits[3:6]}-{digits[6:]}\"\n        if (name, phone) in seen:\n            continue\n        seen.add((name, phone))\n        rows.append((name, phone))\nwith open(\"phones.csv\", \"w\", newline=\"\") as f:\n    w = csv.writer(f, lineterminator=\"\\n\")\n    w.writerow([\"name\", \"phone\"])\n    w.writerows(rows)\nprint(f\"Kept: {len(rows)}\")",
   "import csv, re\n\nseen = set()\nrows = []\nwith open(\"contacts.csv\", newline=\"\") as f:\n    for r in csv.DictReader(f):\n        name = r[\"name\"].strip()\n        digits = re.sub(r\"\\D\", \"\", r[\"phone\"])\n        if len(digits) == 11 and digits[0] == \"1\":\n            digits = digits[1:]\n        if not name or len(digits) != 10:\n            continue\n        phone = f\"{digits[:3]}-{digits[3:6]}-{digits[6:]}\"\n        seen.add((name, phone))\n        rows.append((name, phone))\nwith open(\"phones.csv\", \"w\", newline=\"\") as f:\n    w = csv.writer(f, lineterminator=\"\\n\")\n    w.writerow([\"name\", \"phone\"])\n    w.writerows(rows)\nprint(f\"Kept: {len(rows)}\")",
   "import csv, re\n\nseen = set()\nrows = []\nwith open(\"contacts.csv\", newline=\"\") as f:\n    for r in csv.DictReader(f):\n        name = r[\"name\"].strip()\n        digits = re.sub(r\"\\D\", \"\", r[\"phone\"])\n        if len(digits) == 11 and digits[0] == \"1\":\n            digits = digits[1:]\n        if len(digits) != 10:\n            continue\n        phone = f\"{digits[:3]}-{digits[3:6]}-{digits[6:]}\"\n        if (name, phone) in seen:\n            continue\n        seen.add((name, phone))\n        rows.append((name, phone))\nwith open(\"phones.csv\", \"w\", newline=\"\") as f:\n    w = csv.writer(f, lineterminator=\"\\n\")\n    w.writerow([\"name\", \"phone\"])\n    w.writerows(rows)\nprint(f\"Kept: {len(rows)}\")",
   "import csv, re\n\nseen = set()\nrows = []\nwith open(\"contacts.csv\", newline=\"\") as f:\n    for r in csv.DictReader(f):\n        name = r[\"name\"].strip()\n        digits = re.sub(r\"\\D\", \"\", r[\"phone\"])\n        if len(digits) == 11 and digits[0] == \"1\":\n            digits = digits[1:]\n        if not name or len(digits) != 10:\n            continue\n        phone = f\"{digits[:3]}-{digits[3:6]}-{digits[6:]}\"\n        if phone in seen:\n            continue\n        seen.add(phone)\n        rows.append((name, phone))\nwith open(\"phones.csv\", \"w\", newline=\"\") as f:\n    w = csv.writer(f, lineterminator=\"\\n\")\n    w.writerow([\"name\", \"phone\"])\n    w.writerows(rows)\nprint(f\"Kept: {len(rows)}\")"
  ]
 },
 "daily-py-stack-tests": {
  "valid": [
   "def test_below_100():\n    assert discount(99) == 0\n    assert discount(0) == 0\n\ndef test_at_100():\n    assert discount(100) == 5\n    assert discount(249) == 5\n\ndef test_at_250():\n    assert discount(250) == 10\n    assert discount(499) == 10\n\ndef test_at_500():\n    assert discount(500) == 15\n    assert discount(1000) == 15"
  ],
  "wrong": [
   "def test_one():\n    assert discount(300) == 10",
   "def test_two():\n    assert discount(50) == 0\n    assert discount(600) == 15"
  ]
 },
 "daily-py-inventory-class": {
  "valid": [
   "class StockRoom:\n    def __init__(self):\n        self._stock = {}\n\n    def add(self, item, qty):\n        if qty < 1:\n            raise ValueError(\"quantity must be at least 1\")\n        self._stock[item] = self._stock.get(item, 0) + qty\n\n    def remove(self, item, qty):\n        if qty < 1 or qty > self._stock.get(item, 0):\n            raise ValueError(\"not enough stock\")\n        self._stock[item] -= qty\n\n    def count(self, item):\n        return self._stock.get(item, 0)\n\n    def low(self, limit):\n        return sorted(k for k, v in self._stock.items() if v < limit)"
  ],
  "wrong": [
   "class StockRoom:\n    _shared = {}\n\n    def __init__(self):\n        self._stock = StockRoom._shared\n\n    def add(self, item, qty):\n        if qty < 1:\n            raise ValueError(\"quantity must be at least 1\")\n        self._stock[item] = self._stock.get(item, 0) + qty\n\n    def remove(self, item, qty):\n        if qty < 1 or qty > self._stock.get(item, 0):\n            raise ValueError(\"not enough stock\")\n        self._stock[item] -= qty\n\n    def count(self, item):\n        return self._stock.get(item, 0)\n\n    def low(self, limit):\n        return sorted(k for k, v in self._stock.items() if v < limit)",
   "class StockRoom:\n    def __init__(self):\n        self._stock = {}\n\n    def add(self, item, qty):\n        if qty < 1:\n            raise ValueError(\"quantity must be at least 1\")\n        self._stock[item] = self._stock.get(item, 0) + qty\n\n    def remove(self, item, qty):\n        if qty < 1:\n            raise ValueError(\"bad\")\n        self._stock[item] -= qty\n\n    def count(self, item):\n        return self._stock.get(item, 0)\n\n    def low(self, limit):\n        return sorted(k for k, v in self._stock.items() if v < limit)",
   "class StockRoom:\n    def __init__(self):\n        self._stock = {}\n\n    def add(self, item, qty):\n        if qty < 1:\n            raise ValueError(\"quantity must be at least 1\")\n        self._stock[item] = self._stock.get(item, 0) + qty\n\n    def remove(self, item, qty):\n        if qty < 1 or qty > self._stock.get(item, 0):\n            raise ValueError(\"not enough stock\")\n        self._stock[item] -= qty\n\n    def count(self, item):\n        return self._stock.get(item, 0)\n\n    def low(self, limit):\n        return [k for k, v in self._stock.items() if v <= limit]",
   "class StockRoom:\n    def __init__(self):\n        self._stock = {}\n\n    def add(self, item, qty):\n        self._stock[item] = self._stock.get(item, 0) + qty\n\n    def remove(self, item, qty):\n        if qty < 1 or qty > self._stock.get(item, 0):\n            raise ValueError(\"not enough stock\")\n        self._stock[item] -= qty\n\n    def count(self, item):\n        return self._stock.get(item, 0)\n\n    def low(self, limit):\n        return sorted(k for k, v in self._stock.items() if v < limit)"
  ]
 },
 "daily-py-machine-report": {
  "valid": [
   "import csv\n\ntotals = {}\ncounts = {}\nwith open(\"events.csv\", newline=\"\") as f:\n    for r in csv.DictReader(f):\n        m = r[\"machine\"].strip()\n        try:\n            h = float(r[\"hours\"])\n        except ValueError:\n            continue\n        if not m or h < 0:\n            continue\n        totals[m] = totals.get(m, 0) + h\n        counts[m] = counts.get(m, 0) + 1\nrows = sorted(totals.items(), key=lambda kv: (-kv[1], kv[0]))\nfor m, h in rows:\n    n = counts[m]\n    print(f\"{m}: {h:.1f} h ({n} event{'' if n == 1 else 's'})\")\nprint(\"Worst:\", rows[0][0] if rows else \"none\")"
  ],
  "wrong": [
   "import csv\n\ntotals = {}\ncounts = {}\nwith open(\"events.csv\", newline=\"\") as f:\n    for r in csv.DictReader(f):\n        m = r[\"machine\"].strip()\n        try:\n            h = float(r[\"hours\"])\n        except ValueError:\n            continue\n        if not m:\n            continue\n        totals[m] = totals.get(m, 0) + h\n        counts[m] = counts.get(m, 0) + 1\nrows = sorted(totals.items(), key=lambda kv: (-kv[1], kv[0]))\nfor m, h in rows:\n    n = counts[m]\n    print(f\"{m}: {h:.1f} h ({n} event{'' if n == 1 else 's'})\")\nprint(\"Worst:\", rows[0][0] if rows else \"none\")",
   "import csv\n\ntotals = {}\ncounts = {}\nwith open(\"events.csv\", newline=\"\") as f:\n    for r in csv.DictReader(f):\n        m = r[\"machine\"].strip()\n        try:\n            h = float(r[\"hours\"])\n        except ValueError:\n            continue\n        if not m or h < 0:\n            continue\n        totals[m] = totals.get(m, 0) + h\n        counts[m] = counts.get(m, 0) + 1\nrows = sorted(totals.items(), key=lambda kv: (-kv[1], kv[0]))\nfor m, h in rows:\n    n = counts[m]\n    print(f\"{m}: {h:.1f} h ({n} events)\")\nprint(\"Worst:\", rows[0][0] if rows else \"none\")",
   "import csv\n\ntotals = {}\ncounts = {}\nwith open(\"events.csv\", newline=\"\") as f:\n    for r in csv.DictReader(f):\n        m = r[\"machine\"].strip()\n        try:\n            h = float(r[\"hours\"])\n        except ValueError:\n            continue\n        if not m or h < 0:\n            continue\n        totals[m] = totals.get(m, 0) + h\n        counts[m] = counts.get(m, 0) + 1\nrows = sorted(totals.items(), key=lambda kv: -kv[1])\nfor m, h in rows:\n    n = counts[m]\n    print(f\"{m}: {h:.1f} h ({n} event{'' if n == 1 else 's'})\")\nprint(\"Worst:\", rows[0][0] if rows else \"none\")",
   "import csv\n\ntotals = {}\ncounts = {}\nwith open(\"events.csv\", newline=\"\") as f:\n    for r in csv.DictReader(f):\n        m = r[\"machine\"].strip()\n        try:\n            h = float(r[\"hours\"])\n        except ValueError:\n            continue\n        if not m or h < 0:\n            continue\n        totals[m] = totals.get(m, 0) + h\n        counts[m] = counts.get(m, 0) + 1\nrows = sorted(totals.items(), key=lambda kv: (-kv[1], kv[0]))\nfor m, h in rows:\n    n = counts[m]\n    print(f\"{m}: {h:.1f} h ({n} event{'' if n == 1 else 's'})\")\nprint(\"Worst:\", rows[0][0])"
  ]
 },
 "daily-sql-affordable": {
  "valid": [
   "SELECT name, price FROM products WHERE stock > 0 AND price < 60 ORDER BY price ASC, name ASC;"
  ],
  "wrong": [
   "SELECT name, price FROM products WHERE price < 60 ORDER BY price, name;",
   "SELECT name, price FROM products WHERE stock >= 1 AND price < 60 ORDER BY name;"
  ]
 },
 "daily-sql-status-summary": {
  "valid": [
   "SELECT o.status, COUNT(DISTINCT o.id) AS orders, SUM(i.quantity) AS items FROM orders o INNER JOIN order_items i ON i.order_id = o.id GROUP BY o.status ORDER BY items DESC, o.status;"
  ],
  "wrong": [
   "SELECT o.status, COUNT(*) AS orders, SUM(i.quantity) AS items FROM orders o JOIN order_items i ON i.order_id = o.id GROUP BY o.status ORDER BY items DESC, o.status;",
   "SELECT o.status, COUNT(DISTINCT o.id) AS orders, COUNT(i.id) AS items FROM orders o JOIN order_items i ON i.order_id = o.id GROUP BY o.status ORDER BY items DESC, o.status;"
  ]
 },
 "daily-sql-quiet-customers": {
  "valid": [
   "SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders) ORDER BY name;",
   "SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL ORDER BY c.name;"
  ],
  "wrong": [
   "SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id ORDER BY c.name;",
   "SELECT name FROM customers ORDER BY name;",
   "SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id ORDER BY c.name;"
  ]
 },
 "daily-sql-top-revenue": {
  "valid": [
   "WITH rev AS (SELECT i.product_id, SUM(i.quantity * i.unit_price) AS revenue FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.status != 'returned' GROUP BY i.product_id) SELECT p.name, p.category, rev.revenue FROM rev JOIN products p ON p.id = rev.product_id ORDER BY rev.revenue DESC, p.name LIMIT 3;"
  ],
  "wrong": [
   "SELECT p.name, p.category, SUM(i.quantity * i.unit_price) AS revenue FROM products p JOIN order_items i ON i.product_id = p.id GROUP BY p.id ORDER BY revenue DESC, p.name LIMIT 3;",
   "SELECT p.name, p.category, SUM(i.quantity) AS revenue FROM products p JOIN order_items i ON i.product_id = p.id JOIN orders o ON o.id = i.order_id WHERE o.status <> 'returned' GROUP BY p.id ORDER BY revenue DESC, p.name LIMIT 3;"
  ]
 },
 "daily-sql-pay-ranks": {
  "valid": [
   "SELECT department, employee, hourly_rate FROM (SELECT d.name AS department, e.name AS employee, e.hourly_rate, ROW_NUMBER() OVER (PARTITION BY e.department_id ORDER BY e.hourly_rate DESC, e.name) AS rk FROM employees e JOIN departments d ON d.id = e.department_id) WHERE rk <= 2 ORDER BY department, hourly_rate DESC, employee;"
  ],
  "wrong": [
   "SELECT d.name AS department, e.name AS employee, e.hourly_rate FROM employees e JOIN departments d ON d.id = e.department_id ORDER BY d.name, e.hourly_rate DESC, e.name LIMIT 2;",
   "SELECT department, employee, hourly_rate FROM (SELECT d.name AS department, e.name AS employee, e.hourly_rate, ROW_NUMBER() OVER (ORDER BY e.hourly_rate DESC, e.name) AS rk FROM employees e JOIN departments d ON d.id = e.department_id) WHERE rk <= 2 ORDER BY department, hourly_rate DESC, employee;"
  ]
 },
 "daily-sql-fasteners-raise": {
  "valid": [
   "UPDATE products SET price = ROUND(price * 1.1, 2) WHERE category IN (SELECT category FROM products GROUP BY category HAVING AVG(price) < 60);"
  ],
  "wrong": [
   "UPDATE products SET price = ROUND(price * 1.1, 2);",
   "UPDATE products SET price = ROUND(price * 1.1, 2) WHERE price < 60;",
   "UPDATE products SET price = price * 1.1 WHERE category IN (SELECT category FROM products GROUP BY category HAVING AVG(price) < 60);",
   "UPDATE products SET price = ROUND(price * 1.10, 2) WHERE (SELECT AVG(p2.price) FROM products p2 WHERE p2.category = products.category) < 60;"
  ]
 },
 "daily-sql-gym-design": {
  "valid": [
   "CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL, joined_on TEXT); CREATE TABLE classes (id INTEGER PRIMARY KEY, title TEXT NOT NULL, weekday TEXT); CREATE TABLE bookings (id INTEGER PRIMARY KEY, member_id INTEGER NOT NULL REFERENCES members(id), class_id INTEGER NOT NULL REFERENCES classes(id), booked_for TEXT NOT NULL);"
  ],
  "wrong": [
   "CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE classes (id INTEGER PRIMARY KEY, title TEXT); CREATE TABLE bookings (id INTEGER PRIMARY KEY, member_id INTEGER, class_id INTEGER, booked_for TEXT);",
   "CREATE TABLE bookings (id INTEGER PRIMARY KEY, member_name TEXT, class_name TEXT, booked_for TEXT);",
   "CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE bookings (id INTEGER PRIMARY KEY, member_id INTEGER REFERENCES members(id), class_title TEXT);"
  ]
 },
 "daily-sql-tickets-table": {
  "valid": [
   "CREATE TABLE tickets (id INTEGER PRIMARY KEY, title TEXT NOT NULL UNIQUE, priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')), points INTEGER CHECK (points BETWEEN 1 AND 100));",
   "CREATE TABLE tickets (id INTEGER PRIMARY KEY, title TEXT NOT NULL, priority TEXT, points INTEGER, UNIQUE (title), CHECK (priority IN ('low','medium','high')), CHECK (points IS NULL OR (points >= 1 AND points <= 100)));"
  ],
  "wrong": [
   "CREATE TABLE tickets (id INTEGER PRIMARY KEY, title TEXT NOT NULL, priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')), points INTEGER CHECK (points BETWEEN 1 AND 100));",
   "CREATE TABLE tickets (id INTEGER PRIMARY KEY, title TEXT NOT NULL UNIQUE, priority TEXT NOT NULL, points INTEGER CHECK (points BETWEEN 1 AND 100));",
   "CREATE TABLE tickets (id INTEGER PRIMARY KEY, title TEXT NOT NULL UNIQUE, priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')), points INTEGER CHECK (points > 1 AND points < 100));",
   "CREATE TABLE tickets (id INTEGER PRIMARY KEY, title TEXT UNIQUE, priority TEXT CHECK (priority IN ('low', 'medium', 'high')), points INTEGER CHECK (points BETWEEN 1 AND 100));"
  ]
 },
 "daily-sql-index-runs": {
  "valid": [
   "CREATE INDEX idx_runs_op_date ON production_runs(operator_id, run_date);",
   "CREATE INDEX idx_runs_op ON production_runs(operator_id);",
   "CREATE INDEX idx_runs_date_op ON production_runs(run_date, operator_id);"
  ],
  "wrong": [
   "CREATE INDEX idx_runs_units ON production_runs(units_made);",
   "CREATE INDEX idx_runs_machine ON production_runs(machine_id);"
  ]
 },
 "daily-de-repeat-safe": {
  "valid": [
   "import csv, sqlite3\n\ndef load(csv_path, db_path):\n    con = sqlite3.connect(db_path)\n    con.execute(\"CREATE TABLE IF NOT EXISTS deliveries (id INTEGER PRIMARY KEY, driver TEXT, minutes REAL)\")\n    skipped = 0\n    with open(csv_path, newline=\"\") as f:\n        for r in csv.DictReader(f):\n            try:\n                i = int(r[\"id\"].strip())\n                d = r[\"driver\"].strip()\n                m = float(r[\"minutes\"])\n                if not d or m < 0:\n                    raise ValueError\n            except ValueError:\n                skipped += 1\n                continue\n            con.execute(\"INSERT OR REPLACE INTO deliveries VALUES (?, ?, ?)\", (i, d, m))\n    con.commit()\n    con.close()\n    return skipped"
  ],
  "wrong": [
   "import csv, sqlite3\n\ndef load(csv_path, db_path):\n    con = sqlite3.connect(db_path)\n    con.execute(\"CREATE TABLE IF NOT EXISTS deliveries (id INTEGER PRIMARY KEY, driver TEXT, minutes REAL)\")\n    skipped = 0\n    with open(csv_path, newline=\"\") as f:\n        for r in csv.DictReader(f):\n            try:\n                i = int(r[\"id\"].strip())\n                d = r[\"driver\"].strip()\n                m = float(r[\"minutes\"])\n                if not d or m < 0:\n                    raise ValueError\n            except ValueError:\n                skipped += 1\n                continue\n            con.execute(\"INSERT OR IGNORE INTO deliveries VALUES (?, ?, ?)\", (i, d, m))\n    con.commit()\n    con.close()\n    return skipped",
   "import csv, sqlite3\n\ndef load(csv_path, db_path):\n    con = sqlite3.connect(db_path)\n    con.execute(\"CREATE TABLE IF NOT EXISTS deliveries (id INTEGER PRIMARY KEY, driver TEXT, minutes REAL)\")\n    skipped = 0\n    with open(csv_path, newline=\"\") as f:\n        for r in csv.DictReader(f):\n            try:\n                i = int(r[\"id\"].strip())\n                d = r[\"driver\"].strip()\n                m = float(r[\"minutes\"])\n                if not d or m < 0:\n                    raise ValueError\n            except ValueError:\n                skipped += 1\n                continue\n            con.execute(\"INSERT OR REPLACE INTO deliveries VALUES (?, ?, ?)\", (i, d, m))\n    con.commit()\n    con.close()\n    return 0",
   "import csv, sqlite3\n\ndef load(csv_path, db_path):\n    con = sqlite3.connect(db_path)\n    con.execute(\"CREATE TABLE IF NOT EXISTS deliveries (id INTEGER PRIMARY KEY, driver TEXT, minutes REAL)\")\n    skipped = 0\n    with open(csv_path, newline=\"\") as f:\n        for r in csv.DictReader(f):\n            try:\n                i = int(r[\"id\"].strip())\n                d = r[\"driver\"].strip()\n                m = float(r[\"minutes\"])\n                if not d:\n                    raise ValueError\n            except ValueError:\n                skipped += 1\n                continue\n            con.execute(\"INSERT OR REPLACE INTO deliveries VALUES (?, ?, ?)\", (i, d, m))\n    con.commit()\n    con.close()\n    return skipped",
   "import csv, sqlite3\n\ndef load(csv_path, db_path):\n    con = sqlite3.connect(db_path)\n    con.execute(\"CREATE TABLE IF NOT EXISTS deliveries (id INTEGER, driver TEXT, minutes REAL)\")\n    skipped = 0\n    with open(csv_path, newline=\"\") as f:\n        for r in csv.DictReader(f):\n            try:\n                i = int(r[\"id\"].strip())\n                d = r[\"driver\"].strip()\n                m = float(r[\"minutes\"])\n                if not d or m < 0:\n                    raise ValueError\n            except ValueError:\n                skipped += 1\n                continue\n            con.execute(\"INSERT OR REPLACE INTO deliveries VALUES (?, ?, ?)\", (i, d, m))\n    con.commit()\n    con.close()\n    return skipped"
  ]
 },
 "daily-de-top-operator": {
  "valid": [
   "import sqlite3\n\ndef top_operator(db_path, product_name):\n    con = sqlite3.connect(db_path)\n    row = con.execute(\"SELECT e.name FROM production_runs r JOIN employees e ON e.id = r.operator_id JOIN products p ON p.id = r.product_id WHERE p.name = ? GROUP BY e.id ORDER BY SUM(r.units_made) DESC, e.name LIMIT 1\", (product_name,)).fetchone()\n    return row[0] if row else None"
  ],
  "wrong": [
   "import sqlite3\n\ndef top_operator(db_path, product_name):\n    con = sqlite3.connect(db_path)\n    row = con.execute(\"SELECT e.name FROM production_runs r JOIN employees e ON e.id = r.operator_id JOIN products p ON p.id = r.product_id WHERE p.name = '\" + product_name + \"' GROUP BY e.id ORDER BY SUM(r.units_made) DESC, e.name LIMIT 1\").fetchone()\n    return row[0] if row else None",
   "import sqlite3\n\ndef top_operator(db_path, product_name):\n    con = sqlite3.connect(db_path)\n    row = con.execute(\"SELECT e.name FROM production_runs r JOIN employees e ON e.id = r.operator_id JOIN products p ON p.id = r.product_id WHERE p.name = ? GROUP BY e.id ORDER BY e.name LIMIT 1\", (product_name,)).fetchone()\n    return row[0] if row else None",
   "import sqlite3\n\ndef top_operator(db_path, product_name):\n    con = sqlite3.connect(db_path)\n    row = con.execute(\"SELECT e.name FROM production_runs r JOIN employees e ON e.id = r.operator_id JOIN products p ON p.id = r.product_id WHERE p.name = ? GROUP BY e.id ORDER BY COUNT(*) DESC, e.name LIMIT 1\", (product_name,)).fetchone()\n    return row[0] if row else None",
   "import sqlite3\n\ndef top_operator(db_path, product_name):\n    con = sqlite3.connect(db_path)\n    row = con.execute(\"SELECT e.name FROM production_runs r JOIN employees e ON e.id = r.operator_id JOIN products p ON p.id = r.product_id WHERE p.name = ? GROUP BY e.id ORDER BY SUM(r.units_made) DESC, e.name LIMIT 1\", (product_name,)).fetchone()\n    return row[0]"
  ]
 }
};
