/**
 * TEST-ONLY DATA: reference solutions and plausible wrong attempts for the Phase 3 Python review trials.
 */
export const solutionsPhase3Python: Record<string, { valid: string[]; wrong: string[] }> = {
  'py-27-till-receipt': {
    valid: [
      'total = 0\nwhile True:\n    line = input()\n    if line.strip() == "END":\n        break\n    name, qty, price = [part.strip() for part in line.split(",")]\n    qty = int(qty)\n    amount = qty * float(price)\n    total += amount\n    print(f"{name[:12]:<12} {qty:>3} {amount:>8.2f}")\nprint("=" * 25)\nprint(f"{\'TOTAL\':<12} {\'\':>3} {total:>8.2f}")',
      'rows = []\nline = input().strip()\nwhile line != "END":\n    n, q, p = map(str.strip, line.split(","))\n    rows.append((n[:12], int(q), int(q) * float(p)))\n    line = input().strip()\nfor n, q, a in rows:\n    print("%-12s %3d %8.2f" % (n, q, a))\nprint("=" * 25)\nprint("%-12s %3s %8.2f" % ("TOTAL", "", sum(r[2] for r in rows)))',
    ],
    wrong: [
      'total = 0\nwhile True:\n    line = input()\n    if line.strip() == "END":\n        break\n    name, qty, price = [part.strip() for part in line.split(",")]\n    qty = int(qty)\n    amount = qty * float(price)\n    total += amount\n    print(f"{name:<12} {qty:>3} {amount:>8.2f}")\nprint("=" * 25)\nprint(f"{\'TOTAL\':<12} {\'\':>3} {total:>8.2f}")',
      'total = 0\nwhile True:\n    line = input()\n    if line.strip() == "END":\n        break\n    name, qty, price = line.split(",")\n    qty = int(qty)\n    amount = qty * float(price)\n    total += amount\n    print(f"{name[:12]:<12} {qty:>3} {amount:>8.2f}")\nprint("=" * 25)\nprint(f"{\'TOTAL\':<12} {\'\':>3} {total:>8.2f}")',
      'total = 0\nwhile True:\n    line = input()\n    if line.strip() == "END":\n        break\n    name, qty, price = [part.strip() for part in line.split(",")]\n    qty = int(qty)\n    amount = qty * float(price)\n    total += amount\n    print(f"{name[:12]:<12} {qty:>3} {amount:>8.1f}")\nprint("=" * 25)\nprint(f"{\'TOTAL\':<12} {\'\':>3} {total:>8.1f}")',
      'total = 0\nwhile True:\n    line = input()\n    if line.strip() == "END":\n        break\n    name, qty, price = [part.strip() for part in line.split(",")]\n    qty = int(qty)\n    amount = qty * float(price)\n    total += float(price)\n    print(f"{name[:12]:<12} {qty:>3} {amount:>8.2f}")\nprint("=" * 25)\nprint(f"{\'TOTAL\':<12} {\'\':>3} {total:>8.2f}")',
      'total = 0\nwhile True:\n    line = input()\n    if line.strip() == "END":\n        break\n    name, qty, price = [part.strip() for part in line.split(",")]\n    qty = int(qty)\n    amount = qty * float(price)\n    total += amount\n    print(f"{name[:12]:>12} {qty:>3} {amount:>8.2f}")\nprint("=" * 25)\nprint(f"{\'TOTAL\':<12} {\'\':>3} {total:>8.2f}")',
      'total = 0\nwhile True:\n    line = input()\n    if line.strip() == "END":\n        break\n    name, qty, price = [part.strip() for part in line.split(",")]\n    qty = int(qty)\n    amount = qty * float(price)\n    total += amount\n    print(f"{name[:12]:<12} {qty:>3} {amount:>8.2f}")\nprint("=" * 24)\nprint(f"{\'TOTAL\':<12} {\'\':>3} {total:>8.2f}")',
      'print("=" * 25)\nprint("TOTAL")',
    ],
  },
  'py-27-plate-check': {
    valid: [
      'while True:\n    plate = input()\n    if plate == "":\n        break\n    ok = (\n        len(plate) == 8\n        and plate[0:2].isalpha() and plate[0:2].isupper() and plate[0:2].isascii()\n        and plate[2:4].isdigit() and plate[2:4].isascii()\n        and plate[4] == " "\n        and plate[5:8].isalpha() and plate[5:8].isupper() and plate[5:8].isascii()\n        and not any(c in "IQZ" for c in plate[5:8])\n    )\n    print(plate + ": " + ("valid" if ok else "invalid"))',
      'import re\nwhile (plate := input()) != "":\n    good = re.fullmatch(r"[A-Z]{2}[0-9]{2} [A-HJKLMNOPRSTUVWXY]{3}", plate) is not None\n    print(f"{plate}: {\'valid\' if good else \'invalid\'}")',
    ],
    wrong: [
      'while True:\n    plate = input()\n    if plate == "":\n        break\n    ok = len(plate) == 8 and plate[0:2].isalpha() and plate[2:4].isdigit() and plate[4] == " " and plate[5:8].isalpha() and not any(c in "IQZ" for c in plate[5:8])\n    print(plate + ": " + ("valid" if ok else "invalid"))',
      'while True:\n    plate = input()\n    if plate == "":\n        break\n    ok = len(plate) == 8 and plate[0:2].isupper() and plate[2:4].isdigit() and plate[4] == " " and plate[5:8].isupper()\n    print(plate + ": " + ("valid" if ok else "invalid"))',
      'while True:\n    plate = input().strip()\n    if plate == "":\n        break\n    ok = len(plate) == 8 and plate[0:2].isalpha() and plate[0:2].isupper() and plate[2:4].isdigit() and plate[4] == " " and plate[5:8].isalpha() and plate[5:8].isupper() and not any(c in "IQZ" for c in plate[5:8])\n    print(plate + ": " + ("valid" if ok else "invalid"))',
      'while True:\n    plate = input()\n    if plate == "":\n        break\n    ok = len(plate) >= 8 and plate[0:2].isalpha() and plate[0:2].isupper() and plate[2:4].isdigit() and plate[4] == " " and plate[5:8].isalpha() and plate[5:8].isupper() and not any(c in "IQZ" for c in plate[5:8])\n    print(plate + ": " + ("valid" if ok else "invalid"))',
      'while True:\n    plate = input()\n    if plate == "":\n        break\n    ok = len(plate) == 8 and plate[0:2].isalpha() and plate[0:2].isupper() and plate[2:4].isdigit() and plate[4] == " " and plate[5:8].isalpha() and plate[5:8].isupper() and "I" not in plate[5:8] and "Q" not in plate[5:8]\n    print(plate + ": " + ("valid" if ok else "invalid"))',
      'while True:\n    plate = input()\n    if plate == "":\n        break\n    ok = len(plate) == 8 and plate[0:2].isalpha() and plate[0:2].isupper() and plate[2:4].isdigit() and plate[4] == " " and plate[5:8].isalpha() and plate[5:8].isupper() and not any(c in "IQZ" for c in plate)\n    print(plate + ": " + ("valid" if ok else "invalid"))',
    ],
  },
  'py-27-word-frequency': {
    valid: [
      'import re\nfrom collections import Counter\nwords = re.findall(r"[a-z\']+", open("speech.txt").read().lower())\ncounts = Counter(words)\nfor word, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:3]:\n    print(f"{word}: {n}")',
      'text = open("speech.txt").read().lower()\nwords = []\ncurrent = ""\nfor ch in text:\n    if ch.isalpha() and ch.isascii() or ch == "\'":\n        current += ch\n    else:\n        if current:\n            words.append(current)\n        current = ""\nif current:\n    words.append(current)\ncounts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1\nfor w in sorted(counts, key=lambda k: (-counts[k], k))[:3]:\n    print(w + ": " + str(counts[w]))',
    ],
    wrong: [
      'import re\nfrom collections import Counter\nwords = re.findall(r"[a-zA-Z\']+", open("speech.txt").read())\ncounts = Counter(words)\nfor word, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:3]:\n    print(f"{word}: {n}")',
      'from collections import Counter\nwords = open("speech.txt").read().lower().split()\ncounts = Counter(words)\nfor word, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:3]:\n    print(f"{word}: {n}")',
      'import re\nfrom collections import Counter\nwords = re.findall(r"[a-z\']+", open("speech.txt").read().lower())\nfor word, n in Counter(words).most_common(3):\n    print(f"{word}: {n}")',
      'import re\nfrom collections import Counter\nwords = re.findall(r"[a-z]+", open("speech.txt").read().lower())\ncounts = Counter(words)\nfor word, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:3]:\n    print(f"{word}: {n}")',
      'import re\nfrom collections import Counter\nwords = re.findall(r"[a-z\']+", open("speech.txt").read().lower())\ncounts = Counter(words)\nfor word, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:3]:\n    print(f"{word} {n}")',
      'import re\nfrom collections import Counter\nwords = re.findall(r"[a-z0-9\']+", open("speech.txt").read().lower())\ncounts = Counter(words)\nfor word, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:3]:\n    print(f"{word}: {n}")',
      'print("shall: 4")\nprint("the: 4")\nprint("we: 4")',
    ],
  },
  'py-27-balanced': {
    valid: [
      'def balanced(text):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in text:\n        if ch in "([{":\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return not stack',
      'def balanced(text):\n    s = "".join(c for c in text if c in "()[]{}")\n    while True:\n        t = s.replace("()", "").replace("[]", "").replace("{}", "")\n        if t == s:\n            return s == ""\n        s = t',
    ],
    wrong: [
      'def balanced(text):\n    return text.count("(") == text.count(")") and text.count("[") == text.count("]") and text.count("{") == text.count("}")',
      'def balanced(text):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in text:\n        if ch in "([{":\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return True',
      'def balanced(text):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in text:\n        if ch in "([{":\n            stack.append(ch)\n        elif ch in pairs:\n            if stack.pop() != pairs[ch]:\n                return False\n    return not stack',
      'def balanced(text):\n    depth = 0\n    for ch in text:\n        if ch in "([{":\n            depth += 1\n        elif ch in ")]}":\n            depth -= 1\n            if depth < 0:\n                return False\n    return depth == 0',
      'def balanced(text):\n    return len(text) > 0 and text.count("(") == text.count(")")',
      'def balanced(text):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in text:\n        if ch in "([{":\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack:\n                return False\n            stack.pop()\n    return not stack',
    ],
  },
  'py-27-average-rating': {
    valid: [
      'def average_rating(values):\n    usable = []\n    for v in values:\n        if isinstance(v, bool) or v is None:\n            continue\n        try:\n            n = float(v)\n        except (TypeError, ValueError):\n            continue\n        if 1 <= n <= 5:\n            usable.append(n)\n    if not usable:\n        return None\n    return round(sum(usable) / len(usable), 1)',
    ],
    wrong: [
      'def average_rating(values):\n    usable = [float(v) for v in values if isinstance(v, (int, float)) and 1 <= v <= 5]\n    return round(sum(usable) / len(usable), 1) if usable else None',
      'def average_rating(values):\n    usable = []\n    for v in values:\n        try:\n            n = float(v)\n        except (TypeError, ValueError):\n            continue\n        if 1 <= n <= 5:\n            usable.append(n)\n    return round(sum(usable) / len(usable), 1) if usable else None',
      'def average_rating(values):\n    usable = []\n    for v in values:\n        if isinstance(v, bool) or v is None:\n            continue\n        try:\n            n = float(v)\n        except (TypeError, ValueError):\n            continue\n        usable.append(n)\n    return round(sum(usable) / len(usable), 1) if usable else None',
      'def average_rating(values):\n    usable = []\n    for v in values:\n        if isinstance(v, bool) or v is None:\n            continue\n        try:\n            n = float(v)\n        except (TypeError, ValueError):\n            continue\n        if 1 < n < 5:\n            usable.append(n)\n    return round(sum(usable) / len(usable), 1) if usable else None',
      'def average_rating(values):\n    usable = []\n    for v in values:\n        if isinstance(v, bool) or v is None:\n            continue\n        try:\n            n = float(v)\n        except (TypeError, ValueError):\n            continue\n        if 1 <= n <= 5:\n            usable.append(n)\n    return round(sum(usable) / len(usable), 1)',
      'def average_rating(values):\n    usable = []\n    for v in values:\n        if isinstance(v, bool) or v is None:\n            continue\n        try:\n            n = float(v)\n        except (TypeError, ValueError):\n            continue\n        if 1 <= n <= 5:\n            usable.append(n)\n    return sum(usable) / len(usable) if usable else None',
      'def average_rating(values):\n    values.sort(key=str)\n    usable = [float(v) for v in values if str(v).replace(".", "").isdigit() and 1 <= float(v) <= 5]\n    return round(sum(usable) / len(usable), 1) if usable else None',
    ],
  },
};

Object.assign(solutionsPhase3Python, {
  'py-28-stock-ledger': {
    valid: [
      'class Ledger:\n    def __init__(self):\n        self._stock = {}\n\n    @staticmethod\n    def _check(qty):\n        if type(qty) is not int or qty < 1:\n            raise ValueError("quantity must be a whole number of at least 1")\n\n    def add(self, sku, qty):\n        self._check(qty)\n        self._stock[sku] = self._stock.get(sku, 0) + qty\n\n    def remove(self, sku, qty):\n        self._check(qty)\n        if self._stock.get(sku, 0) < qty:\n            raise ValueError("not enough stock")\n        self._stock[sku] -= qty\n\n    def quantity(self, sku):\n        return self._stock.get(sku, 0)\n\n    def low(self, threshold):\n        return sorted(sku for sku, q in self._stock.items() if q < threshold)',
    ],
    wrong: [
      'class Ledger:\n    stock = {}\n    def add(self, sku, qty):\n        if type(qty) is not int or qty < 1:\n            raise ValueError\n        self.stock[sku] = self.stock.get(sku, 0) + qty\n    def remove(self, sku, qty):\n        if type(qty) is not int or qty < 1 or self.stock.get(sku, 0) < qty:\n            raise ValueError\n        self.stock[sku] -= qty\n    def quantity(self, sku):\n        return self.stock.get(sku, 0)\n    def low(self, threshold):\n        return sorted(s for s, q in self.stock.items() if q < threshold)',
      'class Ledger:\n    def __init__(self):\n        self.s = {}\n    def add(self, sku, qty):\n        if type(qty) is not int or qty < 1:\n            raise ValueError\n        self.s[sku] = self.s.get(sku, 0) + qty\n    def remove(self, sku, qty):\n        if type(qty) is not int or qty < 1:\n            raise ValueError\n        self.s[sku] = self.s.get(sku, 0) - qty\n    def quantity(self, sku):\n        return self.s.get(sku, 0)\n    def low(self, threshold):\n        return sorted(k for k, q in self.s.items() if q < threshold)',
      'class Ledger:\n    def __init__(self):\n        self.s = {}\n    def add(self, sku, qty):\n        if qty < 1:\n            raise ValueError\n        self.s[sku] = self.s.get(sku, 0) + qty\n    def remove(self, sku, qty):\n        if qty < 1 or self.s.get(sku, 0) < qty:\n            raise ValueError\n        self.s[sku] -= qty\n    def quantity(self, sku):\n        return self.s.get(sku, 0)\n    def low(self, threshold):\n        return sorted(k for k, q in self.s.items() if q < threshold)',
      'class Ledger:\n    def __init__(self):\n        self.s = {}\n    def add(self, sku, qty):\n        if type(qty) is not int or qty < 1:\n            raise ValueError\n        self.s[sku] = self.s.get(sku, 0) + qty\n    def remove(self, sku, qty):\n        if type(qty) is not int or qty < 1 or self.s.get(sku, 0) < qty:\n            raise ValueError\n        self.s[sku] -= qty\n        if self.s[sku] == 0:\n            del self.s[sku]\n    def quantity(self, sku):\n        return self.s.get(sku, 0)\n    def low(self, threshold):\n        return sorted(k for k, q in self.s.items() if q < threshold)',
      'class Ledger:\n    def __init__(self):\n        self.s = {}\n    def add(self, sku, qty):\n        if type(qty) is not int or qty < 1:\n            raise ValueError\n        self.s[sku] = self.s.get(sku, 0) + qty\n    def remove(self, sku, qty):\n        if type(qty) is not int or qty < 1 or self.s.get(sku, 0) < qty:\n            raise ValueError\n        self.s[sku] -= qty\n    def quantity(self, sku):\n        return self.s.get(sku, 0)\n    def low(self, threshold):\n        return sorted(k for k, q in self.s.items() if q <= threshold)',
      'class Ledger:\n    def __init__(self):\n        self.s = {}\n    def add(self, sku, qty):\n        if type(qty) is not int or qty < 1:\n            raise ValueError\n        self.s[sku] = self.s.get(sku, 0) + qty\n    def remove(self, sku, qty):\n        if type(qty) is not int or qty < 1 or self.s.get(sku, 0) < qty:\n            raise ValueError\n        self.s[sku] -= qty\n    def quantity(self, sku):\n        return self.s.get(sku, 0)\n    def low(self, threshold):\n        return [k for k, q in self.s.items() if q < threshold]',
    ],
  },
  'py-28-tests-discount': {
    valid: [
      'def test_typical():\n    assert price_after_discount(100, 25) == 75.0\n\ndef test_rounds_to_pennies():\n    assert price_after_discount(9.99, 15) == 8.49\n    assert price_after_discount(10, 33) == 6.7\n\ndef test_no_discount_and_full_discount():\n    assert price_after_discount(50, 0) == 50\n    assert price_after_discount(50, 100) == 0\n\ndef test_zero_price():\n    assert price_after_discount(0, 10) == 0\n\ndef test_bad_percent():\n    for p in (101, -1):\n        try:\n            price_after_discount(10, p)\n        except ValueError:\n            pass\n        else:\n            assert False, "percent %r should raise" % p\n\ndef test_negative_price():\n    try:\n        price_after_discount(-1, 10)\n    except ValueError:\n        return\n    assert False, "negative price should raise"\n\ndef test_rounding_direction():\n    assert price_after_discount(19.99, 1) == 19.79',
    ],
    wrong: [
      'def test_typical():\n    assert price_after_discount(100, 25) == 75.0\n\ndef test_zero():\n    assert price_after_discount(50, 0) == 50\n\ndef test_full():\n    assert price_after_discount(50, 100) == 0\n\ndef test_extra():\n    assert price_after_discount(10, 50) == 5',
      'def test_a():\n    assert price_after_discount(100, 10) == 90\n\ndef test_b():\n    assert price_after_discount(100, 50) == 50\n\ndef test_c():\n    assert price_after_discount(9.99, 15) == 8.49\n\ndef test_d():\n    assert price_after_discount(10, 0) == 10',
      'def test_a():\n    assert price_after_discount(100, 10) == 90\n\ndef test_b():\n    assert price_after_discount(100, 0) == 100\n\ndef test_c():\n    try:\n        price_after_discount(10, 101)\n    except ValueError:\n        pass\n    else:\n        assert False\n\ndef test_d():\n    try:\n        price_after_discount(-5, 10)\n    except ValueError:\n        pass\n    else:\n        assert False\n\ndef test_e():\n    try:\n        price_after_discount(5, -10)\n    except ValueError:\n        pass\n    else:\n        assert False',
      'def test_a():\n    assert price_after_discount(100, 10) == 90',
    ],
  },
  'py-28-deadline-text': {
    valid: [
      'from datetime import date\n\ndef deadline_text(due, today):\n    d = date.fromisoformat(due)\n    t = date.fromisoformat(today)\n    n = (d - t).days\n    if n == 0:\n        return "Due today"\n    if n == 1:\n        return "Due tomorrow"\n    if n > 1:\n        return f"{n} days left ({d.strftime(\'%A\')})"\n    if n == -1:\n        return "Overdue by 1 day"\n    return f"Overdue by {-n} days"',
    ],
    wrong: [
      'from datetime import date\n\ndef deadline_text(due, today):\n    d = date.fromisoformat(due)\n    n = (d - date.fromisoformat(today)).days\n    if n == 0:\n        return "Due today"\n    if n == 1:\n        return "Due tomorrow"\n    if n > 1:\n        return f"{n} days left ({d.strftime(\'%a\')})"\n    if n == -1:\n        return "Overdue by 1 day"\n    return f"Overdue by {-n} days"',
      'from datetime import date\n\ndef deadline_text(due, today):\n    d = date.fromisoformat(due)\n    n = (d - date.fromisoformat(today)).days\n    if n == 0:\n        return "Due today"\n    if n == 1:\n        return "Due tomorrow"\n    if n > 1:\n        return f"{n} days left ({d.strftime(\'%A\')})"\n    return f"Overdue by {-n} days"',
      'from datetime import date\n\ndef deadline_text(due, today):\n    d = date.fromisoformat(due)\n    n = (d - date.fromisoformat(today)).days\n    if n == 0:\n        return "Due today"\n    if n > 0:\n        return f"{n} days left ({d.strftime(\'%A\')})"\n    if n == -1:\n        return "Overdue by 1 day"\n    return f"Overdue by {-n} days"',
      'def deadline_text(due, today):\n    dy, dm, dd = map(int, due.split("-"))\n    ty, tm, td = map(int, today.split("-"))\n    n = (dy - ty) * 365 + (dm - tm) * 30 + (dd - td)\n    return f"{n} days left (Monday)"',
      'from datetime import date\n\ndef deadline_text(due, today):\n    d = date.fromisoformat(due)\n    n = (d - date.fromisoformat(today)).days\n    if n == 0:\n        return "Due today"\n    if n == 1:\n        return "Due tomorrow"\n    if n > 1:\n        return f"{n} days left ({d.strftime(\'%A\')})"\n    if n == -1:\n        return "Overdue by 1 day"\n    return f"Overdue by {n} days"',
      'from datetime import date\n\ndef deadline_text(due, today):\n    d = date.fromisoformat(due)\n    t = date.fromisoformat(today)\n    n = (d - t).days\n    if n == 0:\n        return "Due today"\n    if n == 1:\n        return "Due tomorrow"\n    if n > 1:\n        return f"{n} days left ({t.strftime(\'%A\')})"\n    if n == -1:\n        return "Overdue by 1 day"\n    return f"Overdue by {-n} days"',
    ],
  },
  'py-28-log-summary': {
    valid: [
      'from collections import Counter\nlevels = Counter()\nhours = Counter()\nskipped = 0\nfor raw in open("server.log"):\n    line = raw.strip()\n    if not line:\n        continue\n    parts = line.split(None, 3)\n    if len(parts) < 3 or parts[2] not in ("ERROR", "WARN", "INFO"):\n        skipped += 1\n        continue\n    levels[parts[2]] += 1\n    hours[parts[1][:2]] += 1\nfor lv in ("ERROR", "WARN", "INFO"):\n    print(f"{lv}: {levels[lv]}")\nif hours:\n    best = max(hours.values())\n    print("Busiest hour:", min(h for h, n in hours.items() if n == best))\nelse:\n    print("Busiest hour: none")\nprint("Skipped:", skipped)',
    ],
    wrong: [
      'from collections import Counter\nlevels = Counter()\nhours = Counter()\nskipped = 0\nfor raw in open("server.log"):\n    line = raw.strip()\n    if not line:\n        continue\n    parts = line.split(None, 3)\n    if len(parts) < 3 or parts[2] not in ("ERROR", "WARN", "INFO"):\n        skipped += 1\n        continue\n    levels[parts[2]] += 1\n    hours[parts[1][:2]] += 1\nfor lv in ("ERROR", "WARN", "INFO"):\n    print(f"{lv}: {levels[lv]}")\nprint("Busiest hour:", hours.most_common(1)[0][0] if hours else "none")\nprint("Skipped:", skipped)',
      'from collections import Counter\nlevels = Counter()\nhours = Counter()\nskipped = 0\nfor raw in open("server.log"):\n    line = raw.strip()\n    parts = line.split(None, 3)\n    if len(parts) < 3 or parts[2] not in ("ERROR", "WARN", "INFO"):\n        skipped += 1\n        continue\n    levels[parts[2]] += 1\n    hours[parts[1][:2]] += 1\nfor lv in ("ERROR", "WARN", "INFO"):\n    print(f"{lv}: {levels[lv]}")\nif hours:\n    best = max(hours.values())\n    print("Busiest hour:", min(h for h, n in hours.items() if n == best))\nelse:\n    print("Busiest hour: none")\nprint("Skipped:", skipped)',
      'from collections import Counter\nlevels = Counter()\nhours = Counter()\nskipped = 0\nfor raw in open("server.log"):\n    line = raw.strip()\n    if not line:\n        continue\n    parts = line.split(None, 3)\n    if len(parts) < 3 or parts[2].upper() not in ("ERROR", "WARN", "INFO"):\n        skipped += 1\n        continue\n    levels[parts[2].upper()] += 1\n    hours[parts[1][:2]] += 1\nfor lv in ("ERROR", "WARN", "INFO"):\n    print(f"{lv}: {levels[lv]}")\nif hours:\n    best = max(hours.values())\n    print("Busiest hour:", min(h for h, n in hours.items() if n == best))\nelse:\n    print("Busiest hour: none")\nprint("Skipped:", skipped)',
      'text = open("server.log").read()\nfor lv in ("ERROR", "WARN", "INFO"):\n    print(f"{lv}: {text.count(lv)}")\nprint("Busiest hour: 13")\nprint("Skipped: 2")',
      'from collections import Counter\nlevels = Counter()\nhours = Counter()\nskipped = 0\nfor raw in open("server.log"):\n    line = raw.strip()\n    if not line:\n        continue\n    parts = line.split(None, 3)\n    if len(parts) < 3 or parts[2] not in ("ERROR", "WARN", "INFO"):\n        skipped += 1\n        continue\n    levels[parts[2]] += 1\n    hours[int(parts[1][:2])] += 1\nfor lv in ("ERROR", "WARN", "INFO"):\n    print(f"{lv}: {levels[lv]}")\nif hours:\n    best = max(hours.values())\n    print("Busiest hour:", min(h for h, n in hours.items() if n == best))\nelse:\n    print("Busiest hour: none")\nprint("Skipped:", skipped)',
    ],
  },
});
