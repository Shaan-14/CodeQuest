import { outs, sqlRes } from '../helpers';
import { refCalls } from '../daily/helpers';
import type { Challenge, Check } from '../schema';

/**
 * Problems authored ONLY for training (never part of a lesson, daily or boss). A training plan uses one `practice`
 * problem (hints allowed) per practice step and ONE `proof` problem (independent: no hints, no starter) at the very
 * end. Each problem is set in a different context from the lessons that teach its skill, so training never replays the
 * problem that just went wrong. `requires` lists lessons that must be complete so nothing untaught is asked.
 *
 * Keys are skill ids (or a combination such as py.loops+py.dicts). Every problem has reference solutions and wrong
 * attempts in solutions.testdata.ts, validated in real Python/SQLite by training.test.ts.
 */
interface Def {
  id: string;
  role: 'practice' | 'proof';
  skills: string[];
  requires: string[];
  title: string;
  context: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  language?: 'python' | 'sql';
  db?: string;
  prompt: string;
  checks: Check[];
  hints?: string[];
}

const T = (d: Def): Challenge => ({
  id: d.id, title: d.title, mode: d.role === 'proof' ? 'independent' : 'challenge', language: d.language ?? 'python', skillIds: d.skills,
  concepts: d.role === 'proof' ? [] : ['training'], difficulty: d.difficulty, prompt: d.prompt, starterCode: d.language === 'sql' && d.role === 'practice' ? '-- Write your query below\n' : '',
  hints: d.role === 'proof' ? [] : d.hints ?? [], checks: d.checks, xpReward: 0, coinReward: 0, context: d.context, db: d.db,
  training: { skills: d.skills, role: d.role, requires: d.requires },
  ...(d.role === 'proof' ? { transfer: true } : {}),
});

const INPUT = ['py-06-input-conversion'];
const STRINGS = ['py-03-variables']; // the lesson BEFORE the one that teaches the skill: a failure happens while that lesson is still open
const NUMBERS = ['py-04-strings'];
/** Early lessons come before `input()` is taught, so these problems carry a one-line tip: training must not fall back on the lesson that just went wrong. */
const READ_TIP = ' (Tip: `input()` reads one typed line as text.)';
const COND = ['py-09-elif'];
const LOOPS = ['py-11-for-range'];
const FUNCS = ['py-12-functions'];
const LISTS = ['py-15-lists'];
const DICTS = ['py-16-dicts'];
const RECORDS = ['py-17-records'];

export const trainingProblems: Challenge[] = [
  // ------------------------------------------------------------------ strings
  T({
    id: 'tr-str-sample', role: 'practice', skills: ['py.strings'], requires: STRINGS, title: 'Label the Sample', context: 'laboratory', difficulty: 2,
    prompt: 'A lab writes sample codes like `bio-7-x`. Read one code and print it in capital letters with every dash replaced by a space (`BIO 7 X`).' + READ_TIP,
    hints: ['Two text operations, one after the other: which methods change case and replace pieces?', 'Strings are never changed in place: each method gives back a new string.', 'Chain the two methods, then print the result.'],
    checks: outs([[['bio-7-x'], 'BIO 7 X'], [['q'], 'Q'], [['a-b'], 'A B'], [['lab-01-cool-room'], 'LAB 01 COOL ROOM']], 2),
  }),
  T({
    id: 'tr-str-initials', role: 'proof', skills: ['py.strings'], requires: STRINGS, title: 'Signing Off', context: 'publishing', difficulty: 3,
    prompt: 'An editor needs each author’s initials for a byline. Read a full name (one or more words, possibly with extra spaces around and between them) and print the initials in capitals, each followed by a dot, with nothing between: `ada lovelace byron` gives `A.L.B.`.' + READ_TIP,
    checks: outs([[['ada lovelace byron'], 'A.L.B.'], [['grace hopper'], 'G.H.'], [['plato'], 'P.'], [['  mary   ann lee '], 'M.A.L.']], 0),
  }),
  // ------------------------------------------------------------------ numbers
  T({
    id: 'tr-num-cartons', role: 'practice', skills: ['py.numbers'], requires: NUMBERS, title: 'Egg Cartons', context: 'agriculture', difficulty: 2,
    prompt: 'A farm packs eggs into cartons of 12. Read the number of eggs collected and print two lines: `Cartons: N` (full cartons) and `Loose: M` (eggs left over).' + READ_TIP + ' Typed numbers arrive as text: `int()` turns text into a whole number.',
    hints: ['Two questions about one division: how many whole times, and what is left?', 'Whole-number division and the remainder have their own operators.', '`//` gives the whole part and `%` the remainder.'],
    checks: outs([[['53'], 'Cartons: 4\nLoose: 5'], [['12'], 'Cartons: 1\nLoose: 0'], [['0'], 'Cartons: 0\nLoose: 0'], [['11'], 'Cartons: 0\nLoose: 11'], [['100'], 'Cartons: 8\nLoose: 4']], 2),
  }),
  T({
    id: 'tr-num-cents', role: 'proof', skills: ['py.numbers'], requires: NUMBERS, title: 'Cash Register', context: 'retail', difficulty: 3,
    prompt: 'A till stores prices in whole cents. Read an amount in cents and print it as dollars and cents, like `$12.34`. The cents part always has two digits (`1205` gives `$12.05`, `5` gives `$0.05`).' + READ_TIP + ' `int()` turns text into a whole number.',
    checks: outs([[['1234'], '$12.34'], [['1205'], '$12.05'], [['5'], '$0.05'], [['100000'], '$1000.00'], [['0'], '$0.00']], 0),
  }),
  // ------------------------------------------------------------------ input
  T({
    id: 'tr-in-invoice', role: 'practice', skills: ['py.input', 'py.numbers'], requires: INPUT, title: 'Parts Invoice', context: 'manufacturing', difficulty: 2,
    prompt: 'Read a unit price (may have decimals) on the first line and a quantity (whole number) on the second. Print `Total: X` where X is price times quantity with exactly two decimals.',
    hints: ['Everything typed in arrives as text. What must happen before you can multiply?', 'The price and the quantity need different conversions.', 'A format specifier such as `:.2f` inside an f-string fixes the decimals.'],
    checks: outs([[['2.5', '3'], 'Total: 7.50'], [['10', '1'], 'Total: 10.00'], [['0.99', '10'], 'Total: 9.90'], [['4', '0'], 'Total: 0.00']], 2),
  }),
  T({
    id: 'tr-in-birthday', role: 'proof', skills: ['py.input', 'py.numbers'], requires: INPUT, title: 'Membership Card', context: 'community', difficulty: 3,
    prompt: 'A club prints cards. Read a member’s name on one line and age on the next. Print `NAME is AGE; next year AGE+1` (for `Ada` and `36`: `Ada is 36; next year 37`).',
    checks: outs([[['Ada', '36'], 'Ada is 36; next year 37'], [['Bo', '0'], 'Bo is 0; next year 1'], [['X Y', '99'], 'X Y is 99; next year 100']], 0),
  }),
  // ------------------------------------------------------------------ logic
  T({
    id: 'tr-log-alert', role: 'practice', skills: ['py.logic', 'py.conditionals'], requires: [...INPUT, 'py-08-if-else'], title: 'Greenhouse Alarm', context: 'agriculture', difficulty: 2,
    prompt: 'A greenhouse alarm sounds only when it is **hotter than 30** and **more humid than 60** at the same time. Read the temperature and the humidity (whole numbers, one per line) and print `ALERT` or `OK`.',
    hints: ['Two facts must both be true. Which word joins conditions?', 'Each comparison is strict: exactly 30 is not "hotter than 30".', 'Combine two comparisons with `and` inside one `if`.'],
    checks: outs([[['31', '61'], 'ALERT'], [['30', '61'], 'OK'], [['31', '60'], 'OK'], [['40', '90'], 'ALERT'], [['10', '10'], 'OK']], 2),
  }),
  T({
    id: 'tr-log-entry', role: 'proof', skills: ['py.logic', 'py.conditionals'], requires: [...INPUT, 'py-08-if-else'], title: 'Museum Door', context: 'tourism', difficulty: 3,
    prompt: 'A museum admits anyone aged 18 or over. Someone aged 12 to 17 may enter only with an adult (the second input line is `yes` or `no`). Younger visitors may not enter. Read the age, then `yes` or `no`, and print `Enter` or `Wait`.',
    checks: outs([[['18', 'no'], 'Enter'], [['17', 'no'], 'Wait'], [['12', 'yes'], 'Enter'], [['11', 'yes'], 'Wait'], [['12', 'no'], 'Wait'], [['30', 'yes'], 'Enter']], 0),
  }),
  // ------------------------------------------------------------------ conditionals
  T({
    id: 'tr-cond-ph', role: 'practice', skills: ['py.conditionals'], requires: [...INPUT, 'py-09-elif'], title: 'Pool Test Strip', context: 'water quality', difficulty: 2,
    prompt: 'A pool test strip reports pH. Read a pH value (may have decimals) and print `acidic` when it is below 6.5, `alkaline` when it is above 7.5 and `neutral` otherwise (6.5 and 7.5 themselves are neutral).',
    hints: ['Three outcomes need more than one `if`/`else`.', 'The boundary values themselves belong to the middle case.', 'Test the two extremes first with `if` and `elif`, and let `else` be the middle.'],
    checks: outs([[['7.0'], 'neutral'], [['6.5'], 'neutral'], [['7.5'], 'neutral'], [['6.4'], 'acidic'], [['7.6'], 'alkaline'], [['3'], 'acidic']], 2),
  }),
  T({
    id: 'tr-cond-shipping', role: 'proof', skills: ['py.conditionals'], requires: [...INPUT, 'py-09-elif'], title: 'Parcel Rates', context: 'logistics', difficulty: 3,
    prompt: 'A courier prices parcels by weight in kg (decimals allowed): up to and including 1 kg costs 5.00; over 1 up to and including 5 costs 9.50; over 5 up to and including 20 costs 20.00; anything heavier is sent as freight. Read the weight and print `Cost: 9.50` style, or `Freight`.',
    checks: outs([[['1'], 'Cost: 5.00'], [['1.1'], 'Cost: 9.50'], [['5'], 'Cost: 9.50'], [['5.5'], 'Cost: 20.00'], [['20'], 'Cost: 20.00'], [['20.1'], 'Freight'], [['0.2'], 'Cost: 5.00']], 0),
  }),
  // ------------------------------------------------------------------ loops
  T({
    id: 'tr-loop-countdown', role: 'practice', skills: ['py.loops'], requires: [...INPUT, ...LOOPS], title: 'Launch Sequence', context: 'aerospace', difficulty: 2,
    prompt: 'Read a whole number N. Print the numbers from N down to 1, one per line, then `Liftoff!`. For N = 0 print only `Liftoff!`.',
    hints: ['You need to repeat something a number of times that is only known while the program runs.', 'Counting downwards can be done with a range that steps by -1, or with a loop that changes its own counter.', '`range(n, 0, -1)` visits n, n-1, ... 1.'],
    checks: outs([[['3'], '3\n2\n1\nLiftoff!'], [['0'], 'Liftoff!'], [['1'], '1\nLiftoff!'], [['5'], '5\n4\n3\n2\n1\nLiftoff!']], 2),
  }),
  T({
    id: 'tr-loop-largest', role: 'proof', skills: ['py.loops'], requires: [...INPUT, 'py-10-while'], title: 'Peak Reading', context: 'geology', difficulty: 3,
    prompt: 'A seismometer operator types readings (whole numbers, possibly negative), one per line, and ends with `0`, which is not a reading. Print the largest reading typed, or `none` if `0` was typed straight away.',
    checks: outs([[['3', '9', '2', '0'], '9'], [['0'], 'none'], [['-5', '-2', '-9', '0'], '-2'], [['7', '0', '100'], '7']], 0),
  }),
  // ------------------------------------------------------------------ functions
  T({
    id: 'tr-fn-bmi', role: 'practice', skills: ['py.functions', 'py.conditionals'], requires: FUNCS, title: 'Body Mass Band', context: 'healthcare', difficulty: 3,
    prompt: 'Write `bmi_category(weight_kg, height_m)`. The index is weight divided by height squared. Return `"under"` below 18.5, `"normal"` from 18.5 up to but not including 25, `"over"` from 25 up to but not including 30, and `"obese"` from 30 upwards.',
    hints: ['Work out the index first, then decide the band.', 'The bands touch: which side does each boundary value belong to?', 'A chain of `if`/`elif` from the lowest band upward, each testing "below the next boundary".'],
    checks: refCalls('bmi_category', 'def _ref(w, h):\n    b = w / (h * h)\n    if b < 18.5:\n        return "under"\n    if b < 25:\n        return "normal"\n    if b < 30:\n        return "over"\n    return "obese"', ['50, 1.8', '60, 1.7', '85, 1.7', '100, 1.7', '100, 2', '74, 2', '120, 2', '73.9, 2', '0.5, 1']),
  }),
  T({
    id: 'tr-fn-price', role: 'proof', skills: ['py.functions', 'py.conditionals'], requires: FUNCS, title: 'Checkout Discount', context: 'e-commerce', difficulty: 3,
    prompt: 'Write `final_price(price, member, coupon)`. Members get 10% off. After that, the coupon `"SAVE5"` takes a further 5 off (any other coupon, including an empty one, does nothing). The price never goes below 0. Return the result rounded to 2 decimal places.',
    checks: refCalls('final_price', 'def _ref(p, m, c):\n    if m:\n        p = p * 0.9\n    if c == "SAVE5":\n        p = p - 5\n    return round(max(p, 0), 2)', ['100, True, "SAVE5"', '100, False, "SAVE5"', '100, True, ""', '4, False, "SAVE5"', '5, False, "SAVE5"', '50, True, "save5"', '19.99, True, "HALF"', '0, True, "SAVE5"']),
  }),
  // ------------------------------------------------------------------ lists
  T({
    id: 'tr-list-second', role: 'practice', skills: ['py.lists', 'py.functions'], requires: [...FUNCS, ...LISTS], title: 'Runner-Up', context: 'athletics', difficulty: 3,
    prompt: 'Write `second_largest(values)` returning the second largest **different** value in a list of numbers. Repeats of the largest do not count as the second, so `[9, 9, 5]` gives `5`. If there are fewer than two different values, return `None`.',
    hints: ['Think about what "different" does to a list with repeats.', 'Sorting makes "second largest" a matter of position, once repeats are dealt with.', 'A set removes repeats; `sorted` puts them in order.'],
    checks: refCalls('second_largest', 'def _ref(v):\n    s = sorted(set(v))\n    return s[-2] if len(s) >= 2 else None', ['[9, 9, 5]', '[]', '[4]', '[4, 4]', '[1, 2, 3]', '[3, 1, 2, 3]', '[-5, -1, -1]', '[2.5, 1.5]']),
  }),
  T({
    id: 'tr-list-outliers', role: 'proof', skills: ['py.lists', 'py.functions'], requires: [...FUNCS, ...LISTS], title: 'Clean the Signal', context: 'signal processing', difficulty: 3,
    prompt: 'A sensor log sometimes spikes. Write `drop_spikes(values, limit)` returning a **new** list without any value whose size (ignoring sign) is greater than `limit`, keeping the order of the rest. A value exactly equal to the limit stays. The original list must not change.',
    checks: [...refCalls('drop_spikes', 'def _ref(v, limit):\n    return [x for x in v if abs(x) <= limit]', ['[1, -9, 3, 50], 10', '[-50, 3], 10', '[], 5', '[5, -5, 6], 5', '[100], 1', '[0, 0.5, -0.5], 0.5']), { kind: 'script', name: 'The input is unchanged', visible: false, code: 'data = [1, 99, -99, 2]\ndrop_spikes(data, 10)\nassert data == [1, 99, -99, 2], "Do not change the input list."' }],
  }),
  // ------------------------------------------------------------------ dicts
  T({
    id: 'tr-dict-lengths', role: 'practice', skills: ['py.dicts', 'py.functions'], requires: [...FUNCS, ...DICTS], title: 'Word Sizes', context: 'linguistics', difficulty: 3,
    prompt: 'Write `word_lengths(words)` returning a dictionary that maps each word in the list to its length. If a word appears more than once it appears once in the dictionary. An empty list gives `{}`.',
    hints: ['A dictionary needs a key and a value for every entry: which is which here?', 'Repeats simply overwrite the same key with the same value.', 'Loop over the words and assign `result[word] = len(word)`.'],
    checks: refCalls('word_lengths', 'def _ref(w):\n    return {x: len(x) for x in w}', ['[]', '["bolt", "nut", "bolt"]', '["a"]', '["", "xy"]', '["Aa", "aa"]']),
  }),
  T({
    id: 'tr-dict-invert', role: 'proof', skills: ['py.dicts', 'py.functions'], requires: [...FUNCS, ...DICTS], title: 'Reverse Directory', context: 'facilities', difficulty: 3,
    prompt: 'A building directory maps each person to a room. Write `people_by_room(directory)` that returns the reverse: a dictionary mapping each room to the **alphabetically sorted list** of people in it. An empty directory gives `{}`.',
    checks: refCalls('people_by_room', 'def _ref(d):\n    out = {}\n    for name, room in d.items():\n        out.setdefault(room, []).append(name)\n    return {r: sorted(n) for r, n in out.items()}', ['{}', '{"Ann": "A1", "Bo": "A1", "Cy": "B2"}', '{"Zed": "R", "Amy": "R", "Kim": "R"}', '{"x": 1}', '{"a": 1, "b": 2, "c": 1}']),
  }),
  // ------------------------------------------------------------------ records
  T({
    id: 'tr-rec-cheapest', role: 'practice', skills: ['py.records', 'py.dicts'], requires: [...FUNCS, ...RECORDS], title: 'Cheapest in Each Aisle', context: 'grocery', difficulty: 3,
    prompt: 'Products are dictionaries like `{"name": "oats", "category": "cereal", "price": 2.5}`. Write `cheapest_by_category(items)` returning a dictionary that maps each category to the **name** of its cheapest product (if two products tie, the one that appears first in the list wins). An empty list gives `{}`.',
    hints: ['Records grouped by a key: what do you keep for each key as you scan?', 'You only need the best-so-far for each category, not all of them.', 'Compare with the stored entry for the category; replace it only when the new price is strictly lower.'],
    checks: refCalls('cheapest_by_category', 'def _ref(items):\n    best = {}\n    for it in items:\n        c = it["category"]\n        if c not in best or it["price"] < best[c]["price"]:\n            best[c] = it\n    return {c: v["name"] for c, v in best.items()}', ['[]', '[{"name": "a", "category": "x", "price": 3}, {"name": "b", "category": "x", "price": 2}, {"name": "c", "category": "y", "price": 9}]', '[{"name": "a", "category": "x", "price": 2}, {"name": "b", "category": "x", "price": 2}]', '[{"name": "z", "category": "q", "price": 0.5}]']),
  }),
  T({
    id: 'tr-rec-monthly', role: 'proof', skills: ['py.records', 'py.dicts'], requires: [...FUNCS, ...RECORDS], title: 'Monthly Takings', context: 'hospitality', difficulty: 3,
    prompt: 'A cafe logs sales as dictionaries like `{"date": "2024-03-15", "amount": 4.5}`. Write `takings_by_month(sales)` returning a dictionary that maps each month (`"2024-03"`) to the total of its amounts, rounded to 2 decimal places. An empty list gives `{}`.',
    checks: refCalls('takings_by_month', 'def _ref(s):\n    out = {}\n    for x in s:\n        m = x["date"][:7]\n        out[m] = out.get(m, 0) + x["amount"]\n    return {m: round(v, 2) for m, v in out.items()}', ['[]', '[{"date": "2024-03-15", "amount": 4.5}, {"date": "2024-03-01", "amount": 2.25}, {"date": "2024-04-02", "amount": 1}]', '[{"date": "2023-12-31", "amount": 0.1}, {"date": "2023-12-30", "amount": 0.2}]', '[{"date": "2024-01-05", "amount": 10}, {"date": "2023-01-05", "amount": 5}]']),
  }),
  // ------------------------------------------------------------------ combinations
  T({
    id: 'tr-lists-running', role: 'practice', skills: ['py.loops', 'py.lists'], requires: [...FUNCS, ...LISTS], title: 'Record Highs So Far', context: 'climate', difficulty: 3,
    prompt: 'Write `record_highs(temps)` returning a list of the same length where each entry is the highest temperature seen **up to and including** that day. `[3, 1, 4, 2]` gives `[3, 3, 4, 4]`. An empty list gives `[]`.',
    hints: ['Each answer depends on all the days before it: what must the loop remember?', 'You can keep one number that is updated as you go.', 'Track the best so far; append it after considering each new value.'],
    checks: refCalls('record_highs', 'def _ref(t):\n    out, best = [], None\n    for x in t:\n        best = x if best is None or x > best else best\n        out.append(best)\n    return out', ['[]', '[3, 1, 4, 2]', '[5]', '[-3, -5, -1]', '[1, 1, 1]', '[9, 8, 7]']),
  }),
  T({
    id: 'tr-lists-pairs', role: 'proof', skills: ['py.loops', 'py.lists'], requires: [...FUNCS, ...LISTS], title: 'Matching Loads', context: 'freight', difficulty: 4,
    prompt: 'Two containers can share a truck if their weights add up to exactly the truck limit. Write `matching_pairs(weights, limit)` returning a list of index pairs `(i, j)` with `i < j` such that `weights[i] + weights[j] == limit`, ordered by `i` and then `j`. No pairs gives `[]`.',
    checks: refCalls('matching_pairs', 'def _ref(w, t):\n    return [(i, j) for i in range(len(w)) for j in range(i + 1, len(w)) if w[i] + w[j] == t]', ['[1, 2, 3, 4], 5', '[], 5', '[5], 5', '[2, 2, 2], 4', '[10, 0, 10], 10', '[1, 2], 9', '[3, 3], 6']),
  }),
  T({
    id: 'tr-dictloop-lengths', role: 'practice', skills: ['py.loops', 'py.dicts'], requires: [...FUNCS, ...DICTS], title: 'How Long Are the Words', context: 'linguistics', difficulty: 3,
    prompt: 'Write `length_counts(words)` returning a dictionary that maps a word length to how many words in the list have that length: `["to", "be", "or", "not"]` gives `{2: 3, 3: 1}`. An empty list gives `{}`.',
    hints: ['You are counting how often each length occurs, not the words themselves.', 'A count per key: what happens the first time you meet a length?', 'Use `counts[n] = counts.get(n, 0) + 1` for each word.'],
    checks: refCalls('length_counts', 'def _ref(w):\n    out = {}\n    for x in w:\n        out[len(x)] = out.get(len(x), 0) + 1\n    return out', ['[]', '["to", "be", "or", "not"]', '["a"]', '["", ""]', '["abc", "de", "f", "gh"]']),
  }),
  T({
    id: 'tr-dictloop-frequent', role: 'proof', skills: ['py.loops', 'py.dicts'], requires: [...FUNCS, ...DICTS], title: 'Most Requested Song', context: 'entertainment', difficulty: 3,
    prompt: 'A radio station logs requested song titles. Write `top_request(titles)` returning the title requested most often. If several titles tie, return the one that was **requested first** among them. An empty list gives `None`.',
    checks: refCalls('top_request', 'def _ref(t):\n    counts = {}\n    for x in t:\n        counts[x] = counts.get(x, 0) + 1\n    best = None\n    for x in t:\n        if best is None or counts[x] > counts[best]:\n            best = x\n    return best', ['[]', '["a"]', '["a", "b", "b", "a"]', '["b", "a", "a", "b"]', '["x", "y", "z", "z"]', '["q", "q", "r", "r", "s"]']),
  }),
  T({
    id: 'tr-condloop-bands', role: 'practice', skills: ['py.conditionals', 'py.loops'], requires: [...FUNCS, ...LISTS, ...COND], title: 'Exam Bands', context: 'education', difficulty: 3,
    prompt: 'Write `band_counts(scores)` returning a tuple `(low, middle, high)`: how many scores are below 50, how many are from 50 up to but not including 75, and how many are 75 or more. An empty list gives `(0, 0, 0)`.',
    hints: ['Every score falls in exactly one band. What structure decides which?', 'You need three counters that a loop updates.', 'For each score an `if`/`elif`/`else` chooses which counter to add to.'],
    checks: refCalls('band_counts', 'def _ref(s):\n    a = b = c = 0\n    for x in s:\n        if x < 50:\n            a += 1\n        elif x < 75:\n            b += 1\n        else:\n            c += 1\n    return (a, b, c)', ['[]', '[49, 50, 74, 75]', '[0, 100]', '[60, 60, 60]', '[49.9, 74.9]']),
  }),
  T({
    id: 'tr-condloop-streak', role: 'proof', skills: ['py.conditionals', 'py.loops'], requires: [...FUNCS, ...LISTS, ...COND], title: 'Uptime Streak', context: 'operations', difficulty: 4,
    prompt: 'A server is checked every minute: `True` means it was up. Write `longest_up_streak(checks)` returning the length of the longest run of consecutive `True` values. An empty list, or one with no `True`, gives `0`.',
    checks: refCalls('longest_up_streak', 'def _ref(c):\n    best = cur = 0\n    for x in c:\n        cur = cur + 1 if x else 0\n        best = max(best, cur)\n    return best', ['[]', '[False]', '[True]', '[True, True, False, True]', '[False, True, True, True]', '[True, False, True, False, True]', '[True, True, True]']),
  }),
  // ------------------------------------------------------------------ SQL
  T({
    id: 'tr-sql-technicians', role: 'practice', language: 'sql', db: 'works', skills: ['sql.select'], requires: ['sql-02-sort-limit'], title: 'Well-Paid Technicians', context: 'human resources', difficulty: 2,
    prompt: 'List the `name` of every employee whose `role` is `technician` **and** whose `hourly_rate` is 30 or more. Alphabetical order.',
    hints: ['Two conditions must both hold: which keyword joins them?', 'Text values are written in single quotes; numbers are not.', '`WHERE role = ... AND hourly_rate >= ...`, then `ORDER BY name`.'],
    checks: sqlRes("SELECT name FROM employees WHERE role = 'technician' AND hourly_rate >= 30 ORDER BY name", 'works', ['works-b'], { ordered: true }),
  }),
  T({
    id: 'tr-sql-young', role: 'proof', language: 'sql', db: 'league', skills: ['sql.select'], requires: ['sql-02-sort-limit'], title: 'Rising Talent', context: 'talent scouting', difficulty: 3,
    prompt: 'A scout wants the five youngest players born after 1990. Show `name` and `birth_year` of players with a `birth_year` above 1990, the most recently born first (equal years in name order), and only the first five rows.',
    checks: sqlRes('SELECT name, birth_year FROM players WHERE birth_year > 1990 ORDER BY birth_year DESC, name LIMIT 5', 'league', ['league-b'], { ordered: true, visible: false }),
  }),
  T({
    id: 'tr-sql-categories', role: 'practice', language: 'sql', db: 'market', skills: ['sql.aggregate'], requires: ['sql-05-group'], title: 'Aisle Summary', context: 'grocery', difficulty: 3,
    prompt: 'For every product `category` show how many products it has (`products`) and their average price rounded to 2 decimals (`avg_price`). Alphabetical by category.',
    hints: ['Several rows collapse into one per category: which clause does that?', 'Two summaries are needed in the same row.', '`GROUP BY category` with `COUNT(*)` and `ROUND(AVG(price), 2)`.'],
    checks: sqlRes('SELECT category, COUNT(*) AS products, ROUND(AVG(price), 2) AS avg_price FROM products GROUP BY category ORDER BY category', 'market', ['market-b'], { ordered: true, columns: 'names' }),
  }),
  T({
    id: 'tr-sql-busy', role: 'proof', language: 'sql', db: 'works', skills: ['sql.aggregate'], requires: ['sql-05-group'], title: 'Busiest Machines', context: 'production planning', difficulty: 3,
    prompt: 'Planning wants machines that have made more than 6000 units in total. Show each such machine’s `machine_id` and its total units as `total`, biggest total first.',
    checks: sqlRes('SELECT machine_id, SUM(units_made) AS total FROM production_runs GROUP BY machine_id HAVING SUM(units_made) > 6000 ORDER BY total DESC', 'works', ['works-b'], { ordered: true, columns: 'names', visible: false }),
  }),
  T({
    id: 'tr-sql-returned', role: 'practice', language: 'sql', db: 'market', skills: ['sql.joins'], requires: ['sql-06-joins'], title: 'Customers Who Sent Things Back', context: 'customer care', difficulty: 3,
    prompt: 'List the `name` of every customer who has at least one order with status `returned`. Each customer appears once. Alphabetical order.',
    hints: ['The status lives on one table and the name on another.', 'A customer with several returned orders must still appear once.', 'Join the two tables, filter the status, and remove repeats.'],
    checks: sqlRes("SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'returned' ORDER BY c.name", 'market', ['market-b'], { ordered: true }),
  }),
  T({
    id: 'tr-sql-departments', role: 'proof', language: 'sql', db: 'works', skills: ['sql.joins'], requires: ['sql-07-left-join'], title: 'Machines per Department', context: 'facilities', difficulty: 3,
    prompt: 'Show every department’s `name` and how many machines it has as `machines`, including departments that have none (they show 0). Alphabetical order.',
    checks: sqlRes('SELECT d.name, COUNT(m.id) AS machines FROM departments d LEFT JOIN machines m ON m.department_id = d.id GROUP BY d.id ORDER BY d.name', 'works', ['works-b', 'works-boss'], { ordered: true, columns: 'names', visible: false }),
  }),
];
