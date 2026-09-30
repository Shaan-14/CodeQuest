import type { Fixtures } from '../schema';

/**
 * Authored TRAINING content: a different way to see an idea, a different worked example (in a different setting from the
 * lesson that taught it) and a prediction question. Training never replays the lesson: these are written for the
 * moment a learner is stuck, from another angle. Keys are skill ids; a module for several skills serves combinations
 * (a weakness on loops + dicts + conditions uses the largest module whose skills are all part of it).
 */
export interface TrainingModule {
  id: string;
  skills: string[];
  title: string;
  /** "See it differently": short, concrete, an analogy or a reframing. Plain text, blank lines separate paragraphs. */
  reframe: string;
  pitfalls: string[];
  example?: { title: string; body: string; code: string; language: 'python' | 'sql'; db?: string; fixtures?: Fixtures; notice: string };
  predict?: { question: string; code?: string; options: string[]; correct: number; explain: string };
}

const M = (m: TrainingModule): TrainingModule => m;

export const trainingModules: TrainingModule[] = [
  M({
    id: 'variables', skills: ['py.variables'], title: 'A variable is a label, not a box of the value',
    reframe: 'Think of a variable as a **sticky label** you attach to a value. `b = a` sticks a second label on the *same* value; it does not link the two labels together. If you later move label `a` to a new value, `b` stays where it was.\n\nWhen you read a program, follow the labels one line at a time and ask "which value does this label point at right now?"',
    pitfalls: ['`=` means "attach this label", not "is equal to" (that is `==`).', 'A label you have not attached yet does not exist: using it is a NameError.'],
    example: { title: 'Labels on a sensor reading', language: 'python', body: 'Follow which value each label points at after every line.', code: 'reading = 21\nbackup = reading\nreading = 30\nprint(reading, backup)\nlimit = reading + 5\nprint(limit)', notice: '`backup` kept 21 even after `reading` moved to 30: assignment copies the *pointing*, not a live link.' },
    predict: { question: 'What does this print?', code: 'a = 5\nb = a\na = 9\nprint(b)', options: ['9', '5', '14'], correct: 1, explain: '`b` was attached to the value 5 before `a` was moved, so it still points at 5.' },
  }),
  M({
    id: 'strings', skills: ['py.strings'], title: 'Text is a row you can take apart',
    reframe: 'A string is a **row of characters** numbered from 0. Methods such as `upper()` or `replace()` never change the row you hold: they hand you a *new* row. So the useful question is always "what do I do with the answer?": print it, or attach a label to it.\n\nTo transform text, decide the steps on paper first (split it, fix each piece, join it), then write one method call per step.',
    pitfalls: ['Forgetting that methods return a new string: `s.upper()` on its own line does nothing useful.', 'Off-by-one when slicing: `s[0:3]` has 3 characters, positions 0, 1, 2.'],
    example: { title: 'Cleaning a part label', language: 'python', body: 'One transformation per line, so each step can be checked on its own.', code: 'label = "  rotor-b7  "\ntrimmed = label.strip()\nspaced = trimmed.replace("-", " ")\nprint(spaced.upper())\nprint(label)', notice: 'The original `label` is untouched at the end. Each method produced a new string that the next line used.' },
    predict: { question: 'What does this print?', code: 's = "pump"\ns.upper()\nprint(s)', options: ['PUMP', 'pump', 'Nothing (an error)'], correct: 1, explain: '`s.upper()` returns a new string that was thrown away. `s` still holds "pump".' },
  }),
  M({
    id: 'numbers', skills: ['py.numbers'], title: 'Whole numbers, remainders and division',
    reframe: 'Division answers two different questions. **How many whole times does it fit?** (`//`) and **what is left over?** (`%`). Sharing 17 sweets among 5 children: 3 each (`17 // 5`), 2 left (`17 % 5`). Ordinary `/` answers a third question: the exact share as a decimal, which is often not what a "how many" problem wants.\n\nBefore choosing an operator, say the question out loud: whole times, leftover, or exact?',
    pitfalls: ['`/` always gives a decimal, even for `10 / 5` (which is `2.0`).', 'Floats are approximate: never expect `0.1 + 0.2 == 0.3`.'],
    example: { title: 'Packing bolts', language: 'python', body: 'A crate holds 24 bolts. Two questions about 100 bolts, two operators.', code: 'bolts = 100\ncrate = 24\nprint(bolts // crate)\nprint(bolts % crate)\nprint(bolts / crate)', notice: '4 full crates and 4 bolts left over: `//` and `%`. The `/` line answers a different question (4.1666…).' },
    predict: { question: 'What does this print?', code: 'print(17 // 5, 17 % 5)', options: ['3.4 2', '3 2', '3 3'], correct: 1, explain: '`17 // 5` is 3 whole times, and `17 % 5` is the remainder 2.' },
  }),
  M({
    id: 'input', skills: ['py.input'], title: 'Everything typed arrives as text',
    reframe: '`input()` is a **postal delivery**: whatever the person typed arrives in an envelope marked *text*, even if it looks like a number. To calculate with it you must open the envelope: `int(...)` for whole numbers, `float(...)` for decimals.\n\nPick the conversion by asking what the person could legitimately type: a price can have decimals (`float`), a count cannot (`int`).',
    pitfalls: ['`"4" + "4"` is `"44"`: text joins, it does not add.', '`int("3.5")` fails: convert decimals with `float`.'],
    example: { title: 'Reading a measurement', language: 'python', body: 'Type a number when it asks (the box below the code holds the input).', code: 'text = input()\nprint(type(text).__name__)\nvalue = float(text)\nprint(value * 2)', notice: 'The first print shows `str`: the number arrived as text until `float` converted it.' },
    predict: { question: 'A person types 4. What does this print?', code: 'x = input()\nprint(x + x)', options: ['8', '44', 'An error'], correct: 1, explain: '`x` is the text "4". Adding text joins it: "44".' },
  }),
  M({
    id: 'logic', skills: ['py.logic'], title: 'Conditions are questions with a yes/no answer',
    reframe: 'Every comparison is a question that gets exactly one answer: `True` or `False`. `and` means **both** answers must be yes; `or` means **at least one** yes; `not` flips it. Boundaries are where mistakes hide, so decide for each limit whether "exactly on the limit" counts.\n\nWrite the rule as a sentence first ("hotter than 30 **and** more humid than 60"), then translate the words one for one.',
    pitfalls: ['`>` is strict; `>=` includes the boundary.', '`age > 12 and < 18` is not valid: each side of `and` needs a full comparison.'],
    example: { title: 'A safety interlock', language: 'python', body: 'Two sensors, one rule: the press may run only when both are safe.', code: 'guard_closed = True\npressure = 8\nprint(guard_closed and pressure < 10)\nprint(guard_closed and pressure < 8)\nprint(not guard_closed or pressure < 8)', notice: 'The middle line is False because 8 is not *less than* 8: the boundary decides the answer.' },
    predict: { question: 'What does this print?', code: 'print(5 > 3 and 2 > 4)', options: ['True', 'False', '5'], correct: 1, explain: '`5 > 3` is True but `2 > 4` is False, and `and` needs both.' },
  }),
  M({
    id: 'conditionals', skills: ['py.conditionals'], title: 'Decisions as a ladder',
    reframe: 'An `if / elif / else` chain is a **ladder of questions asked from the top**: the first question answered "yes" wins, and everything below it is skipped. That is why the *order* matters, and why each rung can assume the rungs above it said "no".\n\nWhen bands touch, decide which band owns each boundary value, then order the rungs from the lowest (or the highest) limit and test only one limit per rung.',
    pitfalls: ['Two separate `if`s can both run; an `if/elif` chain runs at most one branch.', 'Testing the wide band first hides the narrow ones.'],
    example: { title: 'Sorting parcels by weight', language: 'python', body: 'Try weights 1, 4 and 30 by editing `w`.', code: 'w = 4\nif w <= 2:\n    band = "small"\nelif w <= 10:\n    band = "medium"\nelse:\n    band = "large"\nprint(band)', notice: 'For 4 the first rung says no, the second says yes, and the `else` is never reached. The second rung did not need to say "greater than 2": the rung above already ruled that out.' },
    predict: { question: 'What does this print?', code: 'x = 15\nif x > 10:\n    print("big")\nelif x > 5:\n    print("medium")\nelse:\n    print("small")', options: ['big', 'medium', 'big and medium'], correct: 0, explain: 'The first true rung wins and the chain stops: 15 > 10, so only "big" prints.' },
  }),
  M({
    id: 'loops', skills: ['py.loops'], title: 'A loop is a recipe you repeat',
    reframe: 'Write the body of a loop as **one step of a recipe**, then let Python repeat it. Ask three things: what does the loop *start with*, what changes *each time round*, and *when does it stop*? A counting loop changes a number by itself; a `for` loop takes the next item from a collection; a `while` loop repeats until its condition turns false.\n\nTrace a loop by hand with a two-column table: the value of each variable before and after every round.',
    pitfalls: ['A `while` whose condition never changes runs forever.', '`range(n)` counts 0 to n-1: the last number is left out.'],
    example: { title: 'Charging a battery bank', language: 'python', body: 'Trace it: what is `level` after each round?', code: 'level = 10\nrounds = 0\nwhile level < 50:\n    level += 15\n    rounds += 1\nprint(level, rounds)', notice: 'Three rounds (25, 40, 55): the loop stopped only when the condition was false, so `level` overshoots 50.' },
    predict: { question: 'What does this print?', code: 'total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)', options: ['6', '10', '3'], correct: 0, explain: '`range(1, 4)` gives 1, 2, 3, and 1 + 2 + 3 = 6.' },
  }),
  M({
    id: 'functions', skills: ['py.functions'], title: 'A function is a machine with an input slot and an output tray',
    reframe: 'A function takes values in (**parameters**) and hands one result back (**`return`**). `print` shows something to a person; `return` gives something to the *program*. If a function has no `return`, the caller receives `None`.\n\nDesign a function by its contract first: "given these inputs, it returns that". Then test the contract with a few calls before using it anywhere.',
    pitfalls: ['Printing instead of returning: the caller gets `None`.', 'Changing a parameter does not change the caller’s variable.'],
    example: { title: 'A conversion machine', language: 'python', body: 'Compare what the caller receives in each case.', code: 'def to_fahrenheit(c):\n    return c * 9 / 5 + 32\n\ndef show_fahrenheit(c):\n    print(c * 9 / 5 + 32)\n\na = to_fahrenheit(100)\nb = show_fahrenheit(100)\nprint(a, b)', notice: '`a` holds 212.0 but `b` holds `None`: the second function printed its answer but never handed it back.' },
    predict: { question: 'What does this print?', code: 'def f(x):\n    x * 2\n\nprint(f(3))', options: ['6', 'None', 'An error'], correct: 1, explain: 'There is no `return`, so the call gives `None` (the multiplication result is thrown away).' },
  }),
  M({
    id: 'lists', skills: ['py.lists'], title: 'A list is a numbered shelf',
    reframe: 'Picture a shelf with numbered slots starting at 0. `items[2]` is the third slot; `items[-1]` is the last. A list is **one shelf with several names pointing at it**: `b = a` does not copy the shelf, it gives it a second name. To get a separate shelf, copy it (`a[:]` or `list(a)`).\n\nMost list problems are "walk along the shelf and keep something": a total, the best so far, or a new shelf of results.',
    pitfalls: ['`b = a` shares one list; changing one changes both.', 'Removing items while looping over the same list skips items.'],
    example: { title: 'Two names, one shelf', language: 'python', body: 'Predict, then run: does `copy` change when `stock` changes?', code: 'stock = [4, 8, 15]\nalias = stock\ncopy = list(stock)\nstock.append(16)\nprint(len(alias), len(copy))', notice: '`alias` is the same shelf (4 items); `copy` is a separate shelf (still 3).' },
    predict: { question: 'What does this print?', code: 'a = [1, 2, 3]\nb = a\nb.append(4)\nprint(len(a))', options: ['3', '4', '7'], correct: 1, explain: '`b` and `a` are two names for the same list, so appending through `b` changes `a` too.' },
  }),
  M({
    id: 'dicts', skills: ['py.dicts'], title: 'A dictionary is a phone book',
    reframe: 'A dictionary looks things up by **name** instead of by position: key in, value out. Asking for a key that is not there is an error, unless you use `get` with a default. To *count* things, use the key as the thing being counted and the value as the tally: "if I have seen it before, add 1, otherwise start at 1".\n\nBefore writing, decide: what is the key, and what is the value?',
    pitfalls: ['`d[key]` on a missing key raises KeyError; `d.get(key, 0)` does not.', 'Keys are unique: assigning an existing key replaces its value.'],
    example: { title: 'Tallying defect codes', language: 'python', body: 'The key is the code, the value is how often it has been seen.', code: 'codes = ["B2", "A1", "B2", "B2"]\ntally = {}\nfor c in codes:\n    tally[c] = tally.get(c, 0) + 1\nprint(tally)\nprint(tally.get("Z", 0))', notice: '`get(c, 0)` supplies 0 the first time a code appears. Asking for the unseen "Z" with a default gave 0 instead of an error.' },
    predict: { question: 'What does this print?', code: 'd = {"a": 1}\nprint(d.get("z", 0))', options: ['0', 'None', 'An error'], correct: 0, explain: '`get` returns the default (0) when the key is missing.' },
  }),
  M({
    id: 'records', skills: ['py.records'], title: 'A table is a list of dictionaries',
    reframe: 'Rows of a table are dictionaries, and the table is a list of them. Most record problems are one of three moves: **filter** (keep rows that match), **sort** (order rows by a field) or **summarise** (group rows by a field and combine another). For grouping, think "one dictionary entry per group, updated as I walk the rows".\n\nSay which field is the *group key* and which is the *value being combined* before you write any code.',
    pitfalls: ['Sorting with `key=` needs a function (`lambda r: r["price"]`), not the value.', 'Compare with `<` (strict) when the first of equal rows should win.'],
    example: { title: 'Fastest lap per driver', language: 'python', body: 'Group key: driver. Value being combined: lap time (keep the smallest).', code: 'laps = [{"d": "Ann", "t": 91.2}, {"d": "Bo", "t": 90.7}, {"d": "Ann", "t": 89.9}]\nbest = {}\nfor lap in laps:\n    if lap["d"] not in best or lap["t"] < best[lap["d"]]:\n        best[lap["d"]] = lap["t"]\nprint(best)', notice: 'One entry per driver, replaced only when a strictly faster lap appears.' },
    predict: { question: 'What does this print?', code: 'rows = [{"n": "b", "v": 2}, {"n": "a", "v": 3}]\nprint(sorted(rows, key=lambda r: r["v"])[0]["n"])', options: ['a', 'b', '2'], correct: 1, explain: 'Sorted by `v` ascending, the smallest (2) comes first, and its name is "b".' },
  }),
  M({
    id: 'loops-lists', skills: ['py.loops', 'py.lists'], title: 'Walking along a shelf while remembering something',
    reframe: 'Loops and lists work together in one pattern: **walk the list, keep a running value, and build a new list as you go**. Decide three things before you write: what you remember between steps (the "so far" variable), how it changes for each item, and what you put on the result shelf each round.\n\nA nested loop (a loop inside a loop) is for questions about **pairs**: for each item, look at every item after it.',
    pitfalls: ['Start the "so far" variable with a value that cannot beat real data (or with `None`).', 'For pairs, start the inner loop after the outer index so pairs are not repeated.'],
    example: { title: 'Cumulative rainfall', language: 'python', body: 'The loop remembers `running` and appends it to a new list every round.', code: 'rain = [3, 0, 5, 2]\nrunning = 0\ntotals = []\nfor mm in rain:\n    running += mm\n    totals.append(running)\nprint(totals)', notice: 'The "so far" value survives between rounds because it lives outside the loop.' },
    predict: { question: 'What does this print?', code: 'out = []\ns = 0\nfor x in [1, 2, 3]:\n    s += x\n    out.append(s)\nprint(out)', options: ['[1, 2, 3]', '[1, 3, 6]', '[6]'], correct: 1, explain: 'Each round adds to `s` and appends the new `s`: 1, then 3, then 6.' },
  }),
  M({
    id: 'loops-dicts', skills: ['py.loops', 'py.dicts'], title: 'Tallying: a loop feeding a dictionary',
    reframe: 'The loop provides the **things**; the dictionary keeps the **score for each thing**. Each round asks: "have I seen this thing before?" If yes, add to its score; if no, start its score. `get(key, 0) + 1` says both in one line.\n\nWhen the answer must be "the first one that reached the best score", you need a *second* pass, or you must track order while you count.',
    pitfalls: ['Using the value as the key (or the reverse): decide which one you are counting.', '`max` over a dictionary returns the largest KEY unless you say what to compare.'],
    example: { title: 'Counting alarm sources', language: 'python', body: 'The key is what is being counted; the value is its tally.', code: 'alarms = ["door", "smoke", "door", "door", "smoke"]\ncount = {}\nfor a in alarms:\n    count[a] = count.get(a, 0) + 1\nworst = None\nfor a in alarms:\n    if worst is None or count[a] > count[worst]:\n        worst = a\nprint(count, worst)', notice: 'The second loop walks the alarms *in order*, so on a tie the one that appeared first stays the winner.' },
    predict: { question: 'What does this print?', code: 'c = {}\nfor w in "abca":\n    c[w] = c.get(w, 0) + 1\nprint(c["a"])', options: ['1', '2', '3'], correct: 1, explain: '"a" appears twice in "abca", so its tally reaches 2.' },
  }),
  M({
    id: 'conditionals-loops', skills: ['py.conditionals', 'py.loops'], title: 'A loop that decides each round',
    reframe: 'Put the decision **inside** the loop body: the loop supplies each item, the `if` decides what to do with it. Streaks and counts need a variable that the decision either **grows** or **resets**: "if this item continues the run, add one; otherwise start again from zero".\n\nRemember to save the best value at the moment it can improve, not only when a run ends.',
    pitfalls: ['Forgetting to reset the running value in the `else` branch.', 'Only checking the best when a run ends, and missing a run that finishes at the end of the list.'],
    example: { title: 'Longest run of good readings', language: 'python', body: 'The `if` grows the current run; the `else` resets it. `best` is updated as the run grows.', code: 'ok = [True, True, False, True, True, True]\ncur = best = 0\nfor r in ok:\n    if r:\n        cur += 1\n        best = max(best, cur)\n    else:\n        cur = 0\nprint(best)', notice: 'The final run has no `False` after it, yet it is still counted, because `best` was updated while the run grew.' },
    predict: { question: 'What does this print?', code: 'n = 0\nfor x in [1, 2, 3, 4]:\n    if x % 2 == 0:\n        n += 1\nprint(n)', options: ['2', '4', '10'], correct: 0, explain: 'Only 2 and 4 are even, so `n` is increased twice.' },
  }),
  M({
    id: 'sql-select', skills: ['sql.select'], title: 'Describe the rows you want',
    reframe: 'In SQL you do not tell the database *how* to search; you **describe the rows you want**, like filling in a form: which columns, from which table, matching which conditions, in which order. `WHERE` decides which rows are in; `ORDER BY` decides their order; `LIMIT` keeps only the first few.\n\nWrite the description in words first ("employees who are technicians and earn 30 or more, alphabetical"), then translate each phrase into a clause.',
    pitfalls: ['`AND` needs both conditions; `OR` needs one. Mixing them without brackets surprises people.', 'Without `ORDER BY` the order of rows is not guaranteed.'],
    example: { title: 'Picking rows', language: 'sql', db: 'market', body: 'One condition per phrase of the description.', code: "SELECT name, price FROM products\nWHERE category = 'Tools' AND price < 60\nORDER BY price DESC\nLIMIT 3;", notice: 'Read it as a sentence: tools cheaper than 60, dearest first, first three only.' },
    predict: { question: 'A table has prices 10, 20, 30, 40. Which prices does `WHERE price > 20 AND price < 40` return?', options: ['30', '30 and 40', '20, 30 and 40'], correct: 0, explain: 'Both conditions must hold: only 30 is above 20 and below 40.' },
  }),
  M({
    id: 'sql-aggregate', skills: ['sql.aggregate'], title: 'Collapsing many rows into one line',
    reframe: 'An aggregate (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) squeezes many rows into **one number**. `GROUP BY` does the squeeze **once per group** instead of once for the whole table. `WHERE` filters the rows *before* they are squeezed; `HAVING` filters the groups *after*.\n\nAsk: what is one line of my answer? (one per category? one per machine?) That is your `GROUP BY`.',
    pitfalls: ['`WHERE SUM(x) > 5` is not allowed: use `HAVING`.', '`COUNT(*)` counts rows; `COUNT(col)` skips NULLs.'],
    example: { title: 'One line per category', language: 'sql', db: 'market', body: 'Each output row summarises a whole group of products.', code: 'SELECT category, COUNT(*) AS items, MAX(price) AS dearest\nFROM products\nGROUP BY category\nHAVING COUNT(*) >= 2\nORDER BY category;', notice: '`HAVING` removed whole groups after counting them, something `WHERE` could not do.' },
    predict: { question: 'A column `qty` holds 2, 3 and NULL. What does `SUM(qty)` give?', options: ['5', 'NULL', '2'], correct: 0, explain: 'Aggregates ignore NULLs, so the sum is 2 + 3 = 5.' },
  }),
  M({
    id: 'sql-joins', skills: ['sql.joins'], title: 'Joins follow the pointers',
    reframe: 'A row in one table often **points at** a row in another (`orders.customer_id` points at a customer). A join follows the pointers and lines the rows up side by side. An ordinary `JOIN` keeps only rows that have a partner; a `LEFT JOIN` keeps every row of the left table and fills the gaps with NULL.\n\nDraw the two tables, draw the arrow between them, and say which side you must never lose.',
    pitfalls: ['A customer with three orders appears three times after the join: use `DISTINCT` or group when you want one line each.', '`COUNT(*)` after a `LEFT JOIN` counts the empty match as 1.'],
    example: { title: 'Following the arrow', language: 'sql', db: 'market', body: 'Customers with the number of orders, keeping those with none.', code: 'SELECT c.name, COUNT(o.id) AS orders\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id\nORDER BY orders, c.name\nLIMIT 5;', notice: 'Customers with no orders are still listed, with 0, because of the `LEFT JOIN` and because we counted `o.id`, not `*`.' },
    predict: { question: '3 customers; two have 2 orders each and one has none. How many rows does `customers LEFT JOIN orders` return?', options: ['4', '5', '6'], correct: 1, explain: '2 + 2 rows for the customers with orders, plus 1 row (with NULLs) for the customer with none = 5.' },
  }),
  M({
    id: 'js-basics', skills: ['js.basics'], title: 'Types decide what an operator does',
    reframe: 'JavaScript decides what `+` means from the **types** on each side: two numbers add, but a string on either side makes it join text. Convert on purpose (`Number(x)`), and compare with `===` (which also checks the type) so surprises cannot slip in.\n\nWhen a result looks strange, print `typeof` for each value.',
    pitfalls: ['`"5" + 1` is `"51"`, but `"5" - 1` is `4`.', '`==` converts types first; `===` does not.'],
    predict: { question: 'What does `console.log("5" + 1)` print?', options: ['6', '51', 'An error'], correct: 1, explain: 'One side is text, so `+` joins: "5" and "1" make "51".' },
  }),
  M({
    id: 'js-dom', skills: ['js.dom'], title: 'The page is a tree you can edit',
    reframe: 'The browser turns your HTML into a **tree of objects**. JavaScript finds a node (`querySelector`), then reads or changes its properties (`textContent`, `classList`, `hidden`). Nothing on screen changes until you change the tree. Keep the truth in your data and let one function redraw the tree from it.\n\nWhen something on the page is wrong, ask: which node holds it, and which line changes that node?',
    pitfalls: ['`querySelector` returns `null` if nothing matches; using it then throws.', 'Using `innerHTML` with text you did not write allows injected markup.'],
    predict: { question: 'You change an array of tasks in JavaScript but never touch the list on the page. What does the reader see?', options: ['The list updates by itself', 'The old list, unchanged', 'An error'], correct: 1, explain: 'The page is a separate tree. Data changes do nothing on screen until code updates the nodes.' },
  }),
];

/** The module that best serves these skills: the largest module whose skills are all part of the weakness (then the first). */
export function moduleFor(skillIds: string[]): TrainingModule | undefined {
  const fits = trainingModules.filter((m) => m.skills.every((k) => skillIds.includes(k)));
  return [...fits].sort((a, b) => b.skills.length - a.skills.length)[0];
}
