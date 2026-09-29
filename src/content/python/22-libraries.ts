import { calls, text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-22-libraries', title: 'Standing on Others’ Shoulders', language: 'python', skillId: 'py.modules',
    blurb: 'Modules, the standard library, and how to find out what you do not yet know.', prerequisites: ['py-21-cleaning'], xpReward: 55,
    reference: {
      title: 'Modules and finding tools',
      body: text(
        '`import statistics` loads a module; then `statistics.median(xs)`. `from collections import Counter` imports one name. Python’s **standard library** ships hundreds of modules: `math`, `statistics`, `collections`, `datetime`, `csv`, `json`, `sqlite3`, `logging`, `random`, `re`...',
        '**When you do not know how**: (1) say the problem in your own words, (2) split it into pieces, (3) list what you know and what you do not, (4) SEARCH the documentation for the part you do not know, (5) read the signature, the description and the example, (6) guess how it works, (7) test the guess on a tiny input, (8) read the result or error, (9) adjust, (10) verify on the edge cases. Your Field Manual (Library) is the documentation.',
      ),
      example: 'from collections import Counter\nprint(Counter(["a", "b", "a"]).most_common(1))',
    },
    steps: [
      {
        kind: 'teach', title: 'Nobody memorises everything',
        body: text(
          'A surprising truth about professional programming: **most of the time, the tool you need already exists.** You will not write your own median function, date arithmetic, or CSV parser. You will find the standard tool and use it correctly. The skill is not remembering every function; it is knowing how to **find** one, **read** how it works, and **test** that it does what you think.',
          'This lesson gives you tasks that need tools you have not been taught. That is on purpose. Open your **Field Manual** (in the Library, and from the 📚 button on challenges), search for the idea in your own words, and read the entry. You can look things up as often as you like. It is not cheating: it is the job.',
        ),
      },
      {
        kind: 'teach', title: 'A method for the unknown',
        body: text(
          '1. **Understand** the problem: what goes in, what must come out?\n2. **Break it down** into smaller pieces.\n3. **What do I know?** What do I NOT know?\n4. **Search** the documentation for the part you do not know.\n5. **Read** the signature, the description, and the example.\n6. **Guess**: how would this apply to my problem?\n7. **Test** the guess on a tiny input you can check by hand.\n8. **Read** the result or the error carefully.\n9. **Revise** and repeat.\n10. **Verify** on edge cases (empty, one item, ties).',
          'Notice that “ask someone for the answer” is not on the list. Asking for help is fine when you are truly stuck, but the method above is what makes you independent.',
        ),
      },
      {
        kind: 'demo', title: 'Imports and the standard library',
        body: text('Three different modules, three different jobs. Run it, then open the Field Manual and find each function.'),
        code: 'import math\nimport statistics\nfrom datetime import date\n\nprint(math.sqrt(144))\nprint(statistics.mean([2, 4, 9]))\nprint(date(2024, 3, 1).isoformat())',
        notice: 'Each `import` makes a module’s tools available under its name. Everything here is included with Python. No installation, no internet.',
      },
      { kind: 'challenge', challengeId: 'py-22-typical-value' },
      { kind: 'challenge', challengeId: 'py-22-most-common-defect' },
      { kind: 'challenge', challengeId: 'py-22-days-between' },
    ],
  },
  objectives: [
    { id: 'py-obj-count-common', title: 'Find the most frequent item', summary: 'Use the standard library (or your own counting) to find the item that occurs most often, handling ties and empty input.' },
    { id: 'py-obj-dates', title: 'Work with dates using the standard library', summary: 'Read documentation to calculate with calendar dates given as text.' },
  ],
  challenges: [
    {
      id: 'py-22-typical-value', title: 'A Typical Value', mode: 'learning', language: 'python', skillIds: ['py.modules', 'ps.research', 'py.functions'], concepts: ['import', 'statistics', 'reading documentation'], difficulty: 2, context: 'data analysis',
      prompt: text('A few very large values can distort an average. A **median** is more robust: the middle value when the numbers are put in order (with an even count, the mean of the two middle values).', 'Write `typical(values)` that returns the median of a list of numbers. You do not need to work it out yourself: the standard library has a tool for it.'),
      expectedBehavior: 'typical([9, 1, 5]) returns 5. typical([1, 2, 3, 10]) returns 2.5.',
      guidedSteps: ['Open the Field Manual (Library or the 📚 button) and search for `median`.', 'Read which module it lives in, and how to call it.', '`import` the module and return the result.'],
      starterCode: '',
      hints: ['The standard library includes a module for statistics.', 'Look for `median` in the Field Manual. Note the module name in the signature.', '`import statistics`, then `return statistics.median(values)`.'],
      checks: calls('typical', [[[[9, 1, 5]], 5], [[[1, 2, 3, 10]], 2.5], [[[7]], 7], [[[4, 4, 100, 5, 6]], 5], [[[-3, -1]], -2]], 2, { approx: 1e-9 }),
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the function with def.' }],
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'py-22-most-common-defect', objectiveId: 'py-obj-count-common', title: 'Most Common Defect', mode: 'challenge', language: 'python', skillIds: ['py.modules', 'ps.research', 'py.dicts', 'py.functions'], concepts: ['collections', 'counting', 'ties', 'edge cases'], difficulty: 3, context: 'manufacturing',
      prompt: text('A quality team wants to know which defect type turns up most often. Write `most_common_defect(defects)`, which returns the defect that appears **most often** in the list. If two are tied, return the one that appeared **first**. For an empty list, return `None`.', 'There is a standard-library tool that makes counting very short. If you do not know it, search the Field Manual for the idea (for example, “most common”).'),
      expectedBehavior: 'most_common_defect(["dent", "crack", "dent"]) returns "dent". most_common_defect([]) returns None. Ties go to the earliest.',
      starterCode: '',
      hints: ['Counting how often things occur is such a common job that Python includes a helper for it.', 'Search the Field Manual for `most common`. Read what `most_common` returns and what happens with ties.', '`from collections import Counter`, then `Counter(defects).most_common(1)` gives `[(item, count)]`. Handle the empty list first.'],
      checks: calls('most_common_defect', [[[['dent', 'crack', 'dent']], 'dent'], [[[]], null], [[['a', 'b']], 'a'], [[['x', 'y', 'y', 'x']], 'x'], [[['solo']], 'solo'], [[['b', 'a', 'a', 'b', 'c']], 'b']], 2),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'py-22-top-word', objectiveId: 'py-obj-count-common', title: 'Top Word', mode: 'challenge', language: 'python', skillIds: ['py.modules', 'ps.research', 'py.dicts', 'py.functions'], concepts: ['collections', 'counting', 'ties', 'edge cases'], difficulty: 3, context: 'software',
      prompt: text('A support team wants to know the most frequent word in a customer message. Write `top_word(message)`: split the message into words, ignoring case (treat `"Help"` and `"help"` as the same word), and return the most frequent word in **lower case**. A tie goes to the word that appears first. An empty message returns `None`.'),
      expectedBehavior: 'top_word("Help me help") returns "help". top_word("") returns None.',
      starterCode: '',
      hints: ['There are two jobs here: preparing the words, and finding the most frequent.', 'Preparing: make everything lower case, then split into words. Finding: search the Field Manual for a counting tool.', '`words = message.lower().split()`; if there are none return `None`; otherwise `Counter(words).most_common(1)[0][0]`.'],
      checks: calls('top_word', [[['Help me help'], 'help'], [[''], null], [['a b'], 'a'], [['Red red RED blue blue'], 'red'], [['one two two one three'], 'one'], [['   '], null], [['zed apple apple zed'], 'zed']], 2),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'py-22-days-between', objectiveId: 'py-obj-dates', title: 'Days Until Delivery', mode: 'challenge', language: 'python', skillIds: ['py.modules', 'ps.research', 'py.functions'], concepts: ['datetime', 'date arithmetic', 'reading documentation'], difficulty: 3, context: 'scheduling',
      prompt: text('A scheduling tool stores dates as text like `"2024-03-01"`. Write `days_between(start, end)` that returns the whole number of days from `start` to `end`. If `end` is earlier than `start`, the answer is negative.', 'Do not try to do calendar arithmetic yourself. Months have different lengths and leap years exist. Find the standard tool.'),
      expectedBehavior: 'days_between("2024-03-01", "2024-03-15") returns 14. days_between("2024-03-15", "2024-03-01") returns -14. Leap years are handled.',
      starterCode: '',
      hints: ['Calendar rules are complicated, so a module already handles them.', 'Search the Field Manual for `days between`. Read how a text date becomes a date object, and what subtracting two of them gives.', '`from datetime import date`; `date.fromisoformat(text)` builds a date; `(d2 - d1).days` is the difference.'],
      checks: calls('days_between', [[['2024-03-01', '2024-03-15'], 14], [['2024-03-15', '2024-03-01'], -14], [['2024-02-28', '2024-03-01'], 2], [['2023-02-28', '2023-03-01'], 1], [['2023-12-31', '2024-01-01'], 1], [['2024-05-05', '2024-05-05'], 0], [['2000-01-01', '2024-01-01'], 8766]], 3),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'py-22-weekday-name', objectiveId: 'py-obj-dates', title: 'What Day Is It?', mode: 'challenge', language: 'python', skillIds: ['py.modules', 'ps.research', 'py.functions'], concepts: ['datetime', 'date arithmetic', 'reading documentation'], difficulty: 3, context: 'calendar',
      prompt: text('A rota system needs the name of the weekday for dates stored as text like `"2024-03-01"`. Write `weekday_name(date_text)` that returns the full English weekday name, such as `"Friday"`.', 'Do not work out weekdays by hand. Search the Field Manual for the idea (for example, `weekday`).'),
      expectedBehavior: 'weekday_name("2024-03-01") returns "Friday". weekday_name("2024-03-03") returns "Sunday".',
      starterCode: '',
      hints: ['Dates are objects with useful methods, once you convert the text.', 'Search the Field Manual for `weekday` and read about how to turn a date into text using format codes.', '`date.fromisoformat(date_text).strftime("%A")` gives the full weekday name.'],
      checks: calls('weekday_name', [[['2024-03-01'], 'Friday'], [['2024-03-03'], 'Sunday'], [['2000-01-01'], 'Saturday'], [['2024-02-29'], 'Thursday'], [['2023-12-25'], 'Monday']], 2),
      xpReward: 70, coinReward: 10,
    },
  ],
};
