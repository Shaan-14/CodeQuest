import type { Challenge } from '../schema';
import { outs } from '../helpers';
import { daily, refCalls, script } from './helpers';

/** Python Daily Challenges. Each `requires` lists lessons that must be complete: never a concept not yet taught. */
export const pythonDailies: Challenge[] = [
  // ------------------------------------------------------------------ foundations (current-learning friendly)
  daily({
    id: 'daily-py-shipping-label', title: 'The Shipping Label', language: 'python', skillIds: ['py.output', 'py.strings'], difficulty: 1, context: 'logistics',
    prompt: 'A warehouse printer needs a program that prints a shipping label, exactly like this (three lines):\n\nTO: Bytehaven Works\nWEIGHT: 12 kg\nHANDLE WITH CARE',
    checks: outs([[[], 'TO: Bytehaven Works\nWEIGHT: 12 kg\nHANDLE WITH CARE']], 0),
    daily: { focus: 'either', requires: ['py-01-first-program'] },
  }),
  daily({
    id: 'daily-py-rectangle', title: 'Fence and Paint', language: 'python', skillIds: ['py.variables', 'py.numbers', 'py.input'], difficulty: 2, context: 'construction',
    prompt: 'A builder types the width and the length of a rectangular yard (whole numbers, one per line). Print the fence length needed (the perimeter) on the first line as `Fence: N` and the paint area on the second line as `Paint: N`.',
    checks: outs([[['4', '7'], 'Fence: 22\nPaint: 28'], [['10', '10'], 'Fence: 40\nPaint: 100'], [['1', '9'], 'Fence: 20\nPaint: 9'], [['25', '3'], 'Fence: 56\nPaint: 75']], 0),
    daily: { focus: 'current', requires: ['py-06-input-conversion'] },
  }),
  daily({
    id: 'daily-py-initials', title: 'Name Badges', language: 'python', skillIds: ['py.strings', 'py.functions'], difficulty: 2, context: 'events',
    prompt: 'Write `initials(name)` for name badges. It returns the capital initials of every word in a name, each followed by a dot, with no spaces: `"ada lovelace"` becomes `"A.L."`. Extra spaces around and between the words must not matter, and an empty name gives an empty string.',
    checks: refCalls('initials', 'def _ref(name):\n    return "".join(w[0].upper() + "." for w in name.split())', ['"ada lovelace"', '"  grace   brewster hopper "', '"Plato"', '""', '"   "', '"mary jane watson parker"']),
    daily: { focus: 'either', requires: ['py-04-strings', 'py-12-functions'] },
  }),
  daily({
    id: 'daily-py-split-bill', title: 'Splitting the Bill', language: 'python', skillIds: ['py.numbers', 'py.functions'], difficulty: 2, context: 'finance',
    prompt: 'Write `split_bill(total, people, tip_percent)`. The tip is a percentage of the total and is added on top. The whole amount is shared equally. Return what each person pays, rounded to 2 decimal places.',
    checks: refCalls('split_bill', 'def _ref(total, people, tip_percent):\n    return round(total * (1 + tip_percent / 100) / people, 2)', ['100, 4, 10', '80.5, 3, 0', '19.99, 2, 15', '1000, 7, 12.5', '0, 5, 20']),
    daily: { focus: 'either', requires: ['py-05-numbers', 'py-12-functions'] },
  }),
  daily({
    id: 'daily-py-shipping-class', title: 'Which Parcel Class?', language: 'python', skillIds: ['py.conditionals', 'py.functions'], difficulty: 2, context: 'logistics',
    prompt: 'Write `parcel_class(weight_kg, fragile)`. A parcel of 30 kg or more is `"freight"`, whatever else is true. Otherwise a fragile parcel is `"careful"`; a non-fragile parcel of 5 kg or more is `"standard"`; a lighter one is `"letter"`. Negative or zero weights are invalid and return `"invalid"`.',
    checks: refCalls('parcel_class', 'def _ref(w, f):\n    if w <= 0:\n        return "invalid"\n    if w >= 30:\n        return "freight"\n    if f:\n        return "careful"\n    return "standard" if w >= 5 else "letter"', ['30, False', '29.9, True', '5, False', '4.99, False', '0, True', '-3, False', '2, True', '100, True']),
    daily: { focus: 'either', requires: ['py-09-elif', 'py-12-functions'] },
  }),
  daily({
    id: 'daily-py-longest-rise', title: 'The Longest Rise', language: 'python', skillIds: ['py.loops', 'py.lists'], difficulty: 3, context: 'science',
    prompt: 'A sensor logs one temperature per hour. Write `longest_rise(readings)` returning the length of the longest run of readings that each strictly increase from the one before (a single reading is a run of length 1, an empty list gives 0).',
    checks: refCalls('longest_rise', 'def _ref(r):\n    best = cur = 0\n    for i, x in enumerate(r):\n        cur = cur + 1 if i and x > r[i - 1] else 1\n        best = max(best, cur)\n    return best', ['[]', '[5]', '[1, 2, 3, 2, 3, 4, 5, 1]', '[3, 3, 3]', '[9, 8, 7]', '[1, 2, 2, 3, 4]', '[1.5, 2.5, 2.5, 3.5]']),
    daily: { focus: 'either', requires: ['py-15-lists'] },
  }),
  daily({
    id: 'daily-py-normalise', title: 'Scale the Signal', language: 'python', skillIds: ['sd.functions', 'py.lists'], difficulty: 3, context: 'engineering',
    prompt: 'Write `scale(values)` that rescales a list of numbers to the range 0 to 1: the smallest becomes 0.0, the largest 1.0 and the rest in proportion. Return a NEW list of floats rounded to 3 places; do not change the input. If every value is the same, return a list of 0.0 for each; an empty list gives an empty list.',
    checks: [
      ...refCalls('scale', 'def _ref(v):\n    if not v:\n        return []\n    lo, hi = min(v), max(v)\n    return [0.0 if hi == lo else round((x - lo) / (hi - lo), 3) for x in v]', ['[2, 4, 6]', '[10, 0, 5]', '[7, 7, 7]', '[]', '[-5, 0, 5, 10]', '[1.5, 2.25, 9]']),
      script('The input list is left unchanged', 'data = [3, 9, 6]\nscale(data)\nassert data == [3, 9, 6], "The original list must not be modified."'),
    ],
    daily: { focus: 'either', requires: ['py-18-function-design'] },
  }),
  // ------------------------------------------------------------------ data structures
  daily({
    id: 'daily-py-rotate', title: 'Rotate the Shift Roster', language: 'python', skillIds: ['py.lists', 'py.functions'], difficulty: 3, context: 'scheduling',
    prompt: 'Write `rotate(items, k)` that returns a new list where every item has moved `k` places to the right, wrapping around the end (`rotate([1, 2, 3, 4], 1)` is `[4, 1, 2, 3]`). `k` may be negative (move left), zero, or larger than the list. An empty list stays empty. Do not change the original.',
    checks: [...refCalls('rotate', 'def _ref(items, k):\n    if not items:\n        return []\n    k %= len(items)\n    return items[-k:] + items[:-k] if k else list(items)', ['[1, 2, 3, 4], 1', '[1, 2, 3, 4], -1', '[1, 2, 3], 7', '[], 3', '["a", "b"], 0', '[5], 100', '[1, 2, 3, 4, 5], -8']), script('The original list is untouched', 'x = [1, 2, 3]\nrotate(x, 1)\nassert x == [1, 2, 3], "Do not change the input list."')],
    daily: { focus: 'either', requires: ['py-15-lists'] },
  }),
  daily({
    id: 'daily-py-merge', title: 'Merge Two Sorted Logs', language: 'python', skillIds: ['py.lists', 'py.loops'], difficulty: 4, context: 'software',
    prompt: 'Two servers each produce a log of event times, already sorted from earliest to latest. Write `merge(a, b)` returning one sorted list containing every time from both (duplicates are kept).',
    checks: refCalls('merge', 'def _ref(a, b):\n    return sorted(a + b)', ['[1, 4, 9], [2, 3, 10]', '[], [1, 2]', '[1, 2], []', '[], []', '[1, 1, 2], [1, 3]', '[5], [1, 2, 3, 4]', '[1, 2, 3], [4, 5, 6]']),
    daily: { focus: 'review', requires: ['py-15-lists'] },
  }),
  daily({
    id: 'daily-py-top-words', title: 'The Words That Matter', language: 'python', skillIds: ['py.dicts', 'py.strings'], difficulty: 3, context: 'data analysis',
    prompt: 'Write `top_words(text, n)` for a survey tool. Words are separated by spaces; ignore upper/lower case and strip `.,!?` from the ends of words. Return a list of `(word, count)` tuples for the `n` most frequent words, most frequent first; words with equal counts are ordered alphabetically. If there are fewer than `n` different words, return them all.',
    checks: refCalls('top_words', 'def _ref(text, n):\n    from collections import Counter\n    words = [w.strip(".,!?").lower() for w in text.split()]\n    c = Counter(w for w in words if w)\n    return sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))[:n]', ['"the cat and the hat. The end!", 2', '"b a b a c", 3', '"Hello, hello... HELLO?", 5', '"", 3', '"one two three", 2', '"x y y z z z", 1']),
    daily: { focus: 'either', requires: ['py-16-dicts'] },
  }),
  daily({
    id: 'daily-py-anagrams', title: 'Group the Anagrams', language: 'python', skillIds: ['py.dicts', 'py.lists'], difficulty: 4, context: 'games',
    prompt: 'A word game needs `group_anagrams(words)`. Words that use exactly the same letters (ignoring case) belong to one group. Return a list of groups, each group sorted alphabetically (as given, lower-cased), and the groups ordered by their first word. Words with no anagram partner form a group of one.',
    checks: refCalls('group_anagrams', 'def _ref(words):\n    g = {}\n    for w in words:\n        w = w.lower()\n        g.setdefault("".join(sorted(w)), []).append(w)\n    return sorted((sorted(v) for v in g.values()), key=lambda x: x[0])', ['["listen", "silent", "enlist", "google", "gogole"]', '["a", "b", "A"]', '[]', '["Tea", "Eat", "ate", "tan", "Nat", "bat"]', '["abc", "abc"]']),
    daily: { focus: 'review', requires: ['py-16-dicts'] },
  }),
  daily({
    id: 'daily-py-standings', title: 'League Standings', language: 'python', skillIds: ['py.records', 'py.dicts'], difficulty: 4, context: 'sports',
    prompt: 'Write `standings(games)`. Each game is a dict like `{"home": "Owls", "away": "Bears", "home_score": 3, "away_score": 1}`. A win is worth 3 points, a draw 1, a loss 0. Return a list of `(team, points)` tuples for every team that appears, best first; equal points are ordered by team name.',
    checks: refCalls('standings', 'def _ref(games):\n    pts = {}\n    for g in games:\n        h, a, hs, as_ = g["home"], g["away"], g["home_score"], g["away_score"]\n        pts.setdefault(h, 0)\n        pts.setdefault(a, 0)\n        if hs > as_:\n            pts[h] += 3\n        elif hs < as_:\n            pts[a] += 3\n        else:\n            pts[h] += 1\n            pts[a] += 1\n    return sorted(pts.items(), key=lambda kv: (-kv[1], kv[0]))', ['[{"home": "Owls", "away": "Bears", "home_score": 3, "away_score": 1}, {"home": "Bears", "away": "Cats", "home_score": 2, "away_score": 2}, {"home": "Cats", "away": "Owls", "home_score": 0, "away_score": 4}]', '[]', '[{"home": "A", "away": "B", "home_score": 0, "away_score": 0}]', '[{"home": "Z", "away": "Y", "home_score": 1, "away_score": 0}, {"home": "X", "away": "Y", "home_score": 1, "away_score": 0}]']),
    daily: { focus: 'review', requires: ['py-17-records'] },
  }),
  daily({
    id: 'daily-py-monthly-totals', title: 'Month-End Totals', language: 'python', skillIds: ['py.records', 'py.dicts'], difficulty: 4, context: 'finance',
    prompt: 'Write `monthly_totals(transactions)`. Each transaction is a dict with a `"date"` like `"2024-03-15"` and an `"amount"` (negative amounts are refunds). Return a dict mapping `"YYYY-MM"` to the total amount for that month, rounded to 2 places, containing only months that have at least one transaction.',
    checks: refCalls('monthly_totals', 'def _ref(t):\n    out = {}\n    for x in t:\n        k = x["date"][:7]\n        out[k] = out.get(k, 0) + x["amount"]\n    return {k: round(v, 2) for k, v in out.items()}', ['[{"date": "2024-03-15", "amount": 10.5}, {"date": "2024-03-20", "amount": -2.25}, {"date": "2024-04-01", "amount": 7}]', '[]', '[{"date": "2023-12-31", "amount": 0.1}, {"date": "2023-12-01", "amount": 0.2}]', '[{"date": "2024-01-05", "amount": -5}]']),
    daily: { focus: 'either', requires: ['py-17-records'] },
  }),
  daily({
    id: 'daily-py-conflicts', title: 'Room Booking Clashes', language: 'python', skillIds: ['py.records', 'ps.decomposition'], difficulty: 5, context: 'scheduling',
    prompt: 'A meeting-room system stores bookings as `(name, start, end)` with start and end in minutes after midnight (the room is free again AT the end minute, so a booking that ends at 60 does not clash with one that starts at 60). Write `find_clashes(bookings)` that returns a sorted list of `(name1, name2)` pairs of bookings that overlap, each pair with the names in alphabetical order and each pair listed once. Names are unique.',
    checks: refCalls('find_clashes', 'def _ref(b):\n    out = set()\n    for i in range(len(b)):\n        for j in range(i + 1, len(b)):\n            if b[i][1] < b[j][2] and b[j][1] < b[i][2]:\n                out.add(tuple(sorted((b[i][0], b[j][0]))))\n    return sorted(out)', ['[("A", 0, 60), ("B", 60, 90), ("C", 30, 70)]', '[]', '[("X", 10, 20)]', '[("Z", 0, 100), ("Y", 10, 20), ("W", 15, 30), ("V", 100, 120)]', '[("a", 5, 10), ("b", 5, 10)]']),
    daily: { focus: 'review', requires: ['py-17-records', 'py-18-function-design'] },
  }),
  // ------------------------------------------------------------------ debugging and defensive code
  daily({
    id: 'daily-py-fix-median', title: 'The Median That Lies', language: 'python', skillIds: ['py.debugging', 'py.lists'], difficulty: 3, context: 'science',
    prompt: 'This function should return the median of a non-empty list of numbers, but it is wrong for some inputs. Fix it (rewrite it however you like). It must not change the list it is given.',
    starterCode: 'def median(values):\n    values.sort()\n    mid = len(values) // 2\n    return values[mid]\n',
    checks: [
      ...refCalls('median', 'def _ref(v):\n    s = sorted(v)\n    m = len(s) // 2\n    return s[m] if len(s) % 2 else (s[m - 1] + s[m]) / 2', ['[3, 1, 2]', '[4, 1, 3, 2]', '[5]', '[2, 2]', '[10, 1]', '[7.5, 1.5, 4.5, 3.5]']),
      script('The input list keeps its order', 'v = [3, 1, 2]\nmedian(v)\nassert v == [3, 1, 2], "The list should not be sorted in place."'),
    ],
    daily: { focus: 'either', requires: ['py-19-debugging'] },
  }),
  daily({
    id: 'daily-py-safe-mean', title: 'A Mean That Survives Bad Data', language: 'python', skillIds: ['py.defensive', 'de.cleaning'], difficulty: 3, context: 'engineering',
    prompt: 'Sensor exports mix numbers, numeric text (like `"4.5"`), blanks, `None` and junk (`"n/a"`). Write `safe_mean(values)` returning the mean of everything that is (or can be read as) a finite number, rounded to 2 places. If nothing usable remains, return `None`. `nan` and `inf` are not usable, and neither are booleans.',
    checks: refCalls('safe_mean', 'def _ref(v):\n    import math\n    ok = []\n    for x in v:\n        if isinstance(x, bool):\n            continue\n        try:\n            f = float(x)\n        except (TypeError, ValueError):\n            continue\n        if math.isfinite(f):\n            ok.append(f)\n    return round(sum(ok) / len(ok), 2) if ok else None', ['[1, 2, "3", None, "n/a"]', '[]', '["x", None, ""]', '["1e2", 50]', '[True, 2, 4]', '["nan", "inf", 6]', '[" 7 ", "8.5"]']),
    daily: { focus: 'either', requires: ['py-21-cleaning'] },
  }),
  // ------------------------------------------------------------------ files and data
  daily({
    id: 'daily-py-regional-sales', title: 'Sales by Region', language: 'python', skillIds: ['de.files', 'py.dicts'], difficulty: 3, context: 'business',
    fixtures: { files: { 'sales.csv': 'region,rep,amount\nNorth,Ann,120.50\nSouth,Bo,80\nNorth,Cy,99.5\nEast,Di,300\nSouth,Ed,20.25\n' } },
    prompt: '`sales.csv` (header `region,rep,amount`) lists every sale. Print one line per region, `REGION: TOTAL` with the total to 2 decimal places, ordered by total from largest to smallest (ties alphabetically by region).',
    checks: [
      { kind: 'output', name: 'This file', expect: 'East: 300.00\nNorth: 220.00\nSouth: 100.25', visible: false },
      { kind: 'output', name: 'Another file, with ties', expect: 'C: 5.50\nA: 5.00\nB: 5.00', files: { 'sales.csv': 'region,rep,amount\nB,x,5\nA,y,5\nC,z,1\nC,q,4.5\n' }, visible: false },
      { kind: 'output', name: 'Only a header', expect: '', files: { 'sales.csv': 'region,rep,amount\n' }, visible: false },
    ],
    daily: { focus: 'either', requires: ['py-20-files'] },
  }),
  daily({
    id: 'daily-py-phones', title: 'Clean the Phone Book', language: 'python', skillIds: ['de.cleaning', 'de.files'], difficulty: 4, context: 'business',
    fixtures: { files: { 'contacts.csv': 'name,phone\nAnn,(555) 123-4567\nBo,555.987.6543\nCy,12345\nDi,+1 555 222 3333\nAnn,555-123-4567\n,555-000-1111\n' } },
    prompt: '`contacts.csv` (header `name,phone`) came from several systems. Write `phones.csv` (same header) with only valid rows: the name must not be blank and the phone number, once every non-digit is removed and a leading country code `1` dropped when the result has 11 digits, must be exactly 10 digits. Write the number as `NNN-NNN-NNNN`. A contact repeating the same name and number as an earlier accepted row is dropped. Keep the original order. Finally print `Kept: N`.',
    checks: [
      { kind: 'file', name: 'phones.csv for this file', path: 'phones.csv', expect: 'name,phone\nAnn,555-123-4567\nBo,555-987-6543\nDi,555-222-3333', visible: false },
      { kind: 'output', name: 'Kept count', expect: 'Kept: 3', visible: false },
      { kind: 'file', name: 'A different file', path: 'phones.csv', expect: 'name,phone\nZed,800-555-0199\nYan,800-555-0199\nXi,012-345-6789', files: { 'contacts.csv': 'name,phone\nZed,1-800-555-0199\nYan,800 555 0199\n Xi , 0123456789 \nWu,+44 20 7946 0958\n' }, visible: false },
      { kind: 'output', name: 'Kept count for it', expect: 'Kept: 3', files: { 'contacts.csv': 'name,phone\nZed,1-800-555-0199\nYan,800 555 0199\n Xi , 0123456789 \nWu,+44 20 7946 0958\n' }, visible: false },
    ],
    daily: { focus: 'review', requires: ['py-21-cleaning'] },
  }),
  daily({
    id: 'daily-py-stack-tests', title: 'Test the Discount Rule', language: 'python', skillIds: ['test.writing', 'test.assertions'], difficulty: 3, context: 'retail',
    prompt: 'A shop gives a discount by order total: 5% off at 100 or more, 10% off at 250 or more, 15% off at 500 or more, and nothing below 100. The function `discount(total)` returns the percentage. You do not have the function: write `test_` functions (using `assert`) that would catch mistakes in a wrong version but pass on a correct one.',
    checks: [{
      kind: 'tests', name: 'Your tests catch the bugs', minTests: 3, visible: false,
      correct: 'def discount(total):\n    if total >= 500:\n        return 15\n    if total >= 250:\n        return 10\n    if total >= 100:\n        return 5\n    return 0',
      buggy: [
        { name: 'boundary at 100', code: 'def discount(total):\n    if total >= 500:\n        return 15\n    if total >= 250:\n        return 10\n    if total > 100:\n        return 5\n    return 0' },
        { name: 'boundary at 250', code: 'def discount(total):\n    if total >= 500:\n        return 15\n    if total > 250:\n        return 10\n    if total >= 100:\n        return 5\n    return 0' },
        { name: 'boundary at 500', code: 'def discount(total):\n    if total > 500:\n        return 15\n    if total >= 250:\n        return 10\n    if total >= 100:\n        return 5\n    return 0' },
        { name: 'wrong top rate', code: 'def discount(total):\n    if total >= 500:\n        return 12\n    if total >= 250:\n        return 10\n    if total >= 100:\n        return 5\n    return 0' },
        { name: 'small orders get a discount', code: 'def discount(total):\n    if total >= 500:\n        return 15\n    if total >= 250:\n        return 10\n    return 5' },
      ],
    }],
    daily: { focus: 'review', requires: ['py-23-testing'] },
  }),
  daily({
    id: 'daily-py-inventory-class', title: 'The Stock Room Object', language: 'python', skillIds: ['sd.oop', 'py.defensive'], difficulty: 4, context: 'inventory',
    prompt: 'Write a class `StockRoom`. `add(item, qty)` adds stock (a quantity below 1 raises `ValueError`). `remove(item, qty)` takes stock away, raising `ValueError` if the quantity is below 1 or more than is on hand (and changing nothing). `count(item)` returns how many are on hand (0 for an unknown item). `low(limit)` returns a sorted list of item names whose count is below `limit`. Two separate StockRoom objects must not share stock.',
    checks: [
      script('Adding and counting', 'r = StockRoom()\nr.add("bolt", 5)\nr.add("bolt", 3)\nassert r.count("bolt") == 8 and r.count("nut") == 0'),
      script('Removing', 'r = StockRoom()\nr.add("bolt", 5)\nr.remove("bolt", 2)\nassert r.count("bolt") == 3'),
      script('Bad quantities are refused and change nothing', 'r = StockRoom()\nr.add("bolt", 5)\nfor call in (lambda: r.remove("bolt", 6), lambda: r.remove("bolt", 0), lambda: r.remove("nut", 1), lambda: r.add("bolt", 0), lambda: r.add("bolt", -2)):\n    try:\n        call()\n    except ValueError:\n        pass\n    else:\n        raise AssertionError("A bad quantity should raise ValueError")\nassert r.count("bolt") == 5'),
      script('Low stock list is sorted', 'r = StockRoom()\nr.add("zip", 1)\nr.add("bolt", 2)\nr.add("cog", 50)\nassert r.low(3) == ["bolt", "zip"] and r.low(1) == [] and r.low(100) == ["bolt", "cog", "zip"]'),
      script('Objects do not share stock', 'a = StockRoom()\nb = StockRoom()\na.add("bolt", 4)\nassert b.count("bolt") == 0'),
    ],
    daily: { focus: 'review', requires: ['py-24-oop'] },
  }),
  daily({
    id: 'daily-py-machine-report', title: 'The Downtime Report', language: 'python', skillIds: ['ps.decomposition', 'de.files', 'py.records'], difficulty: 5, context: 'manufacturing', project: true,
    fixtures: { files: { 'events.csv': 'machine,kind,hours\nPress,repair,4.5\nLathe,inspection,1\nPress,repair,2\nWelder,repair,x\nLathe,repair,3.5\nPress,inspection,0.5\nSaw,repair,-1\nWelder,routine,2\n,repair,3\n' } },
    prompt: '`events.csv` (header `machine,kind,hours`) records maintenance events; some rows are broken (blank machine, hours that are not a number or are negative). Ignoring broken rows, print for each machine its total downtime and event count as `MACHINE: HOURS h (N events)` with hours to 1 decimal (use `1 event` for exactly one), ordered by hours from most to least (ties by machine name). Then print a last line `Worst: MACHINE` naming the machine with the most downtime, or `Worst: none` if there are no valid rows.',
    checks: [
      { kind: 'output', name: 'This file', expect: 'Press: 7.0 h (3 events)\nLathe: 4.5 h (2 events)\nWelder: 2.0 h (1 event)\nWorst: Press', visible: false },
      { kind: 'output', name: 'A different file', expect: 'A: 3.0 h (2 events)\nB: 3.0 h (1 event)\nWorst: A', files: { 'events.csv': 'machine,kind,hours\nB,repair,3\nB,repair,abc\nA,repair,1.5\nA,repair,1.5\n' }, visible: false },
      { kind: 'output', name: 'Nothing valid', expect: 'Worst: none', files: { 'events.csv': 'machine,kind,hours\n,repair,1\nM,repair,-2\n' }, visible: false },
    ],
    daily: { focus: 'review', requires: ['py-25-projects'] },
  }),
];
