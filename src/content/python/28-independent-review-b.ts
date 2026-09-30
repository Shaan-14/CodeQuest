import { text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const out = (name: string, expect: string, files?: Record<string, string>, visible = false): Check => ({ kind: 'output', name, expect, files, visible });
const call = (name: string, fn: string, args: unknown[], expect: unknown): Check => ({ kind: 'call', name, fn, args: args as never, expect: expect as never, visible: false });
const script = (name: string, code: string): Check => ({ kind: 'script', name, code, visible: false });

/**
 * INDEPENDENT MODE (Python review trial B). Objects, tests, dates, and messy text files, in fresh contexts.
 * Problem statements only: no hints, no starter, no named functions, classes or modules.
 */
export const bundle: LessonBundle = {
  lesson: {
    id: 'py-28-independent-review-b', title: 'Trial: Building It Properly', language: 'python', skillId: 'sd.oop',
    blurb: 'Four open problems: a class, a test suite, a date helper and a log report. No hints, hidden checks.', prerequisites: ['py-24-oop'], xpReward: 0,
    reference: { title: 'Independent trials', body: 'Independent trials give you a problem and nothing else. Use the Field Manual, run small experiments, and list the awkward inputs before you code. The hidden checks use inputs you have not seen.' },
    steps: [
      { kind: 'challenge', challengeId: 'py-28-stock-ledger' },
      { kind: 'challenge', challengeId: 'py-28-tests-discount' },
      { kind: 'challenge', challengeId: 'py-28-deadline-text' },
      { kind: 'challenge', challengeId: 'py-28-log-summary' },
    ],
  },
  objectives: [],
  challenges: [
    {
      id: 'py-28-stock-ledger', title: 'The Stock Ledger', mode: 'independent', language: 'python', skillIds: ['sd.oop', 'sd.functions', 'py.records'], concepts: [], difficulty: 4, transfer: true, context: 'warehouse operations',
      prompt: text(
        'A warehouse needs a small stock ledger. Write a class `Ledger` that starts empty and lets you: **add** a quantity of an item (`add(sku, qty)`), **remove** a quantity (`remove(sku, qty)`), ask how many of an item there are (`quantity(sku)`, which is `0` for an item never seen), and list the items that are running low (`low(threshold)`: the SKUs whose quantity is **below** the threshold, in alphabetical order, including items whose stock has fallen to 0 but not items never seen).',
        'A quantity must be a whole number of at least 1, otherwise `add` and `remove` raise `ValueError`. Removing more than is in stock, or removing an item never seen, also raises `ValueError`, and when any error is raised the ledger is left exactly as it was.',
      ),
      starterCode: '', hints: [],
      checks: [
        script('Adding and removing', "l = Ledger()\nl.add('A', 5)\nl.add('B', 2)\nl.add('A', 3)\nl.remove('B', 1)\nassert l.quantity('A') == 8 and l.quantity('B') == 1 and l.quantity('Z') == 0, 'Quantities do not add up.'"),
        script('Low stock', "l = Ledger()\nl.add('C', 10)\nl.add('B', 3)\nl.add('A', 3)\nl.remove('B', 3)\nassert l.low(5) == ['A', 'B'], 'Which items are low?'\nassert l.low(3) == ['B'], 'Below means strictly below.'\nassert l.low(0) == [], 'Nothing is below zero.'\nassert Ledger().low(100) == [], 'A new ledger has nothing.'"),
        script('Bad quantities', "l = Ledger()\nl.add('A', 5)\nfor bad in (0, -1, 2.5, '3', None):\n    for method in (l.add, l.remove):\n        try:\n            method('A', bad)\n        except ValueError:\n            pass\n        else:\n            raise AssertionError('A quantity of %r must raise ValueError.' % (bad,))\nassert l.quantity('A') == 5, 'A rejected call must not change the ledger.'"),
        script('Removing too much or the unknown', "l = Ledger()\nl.add('A', 5)\nfor sku, q in (('A', 6), ('Q', 1)):\n    try:\n        l.remove(sku, q)\n    except ValueError:\n        pass\n    else:\n        raise AssertionError('Removing %r x %r must raise ValueError.' % (sku, q))\nassert l.quantity('A') == 5 and l.quantity('Q') == 0, 'The ledger must be unchanged after an error.'\nl.remove('A', 5)\nassert l.quantity('A') == 0"),
        script('Ledgers are independent', "a = Ledger()\nb = Ledger()\na.add('X', 1)\nassert b.quantity('X') == 0, 'Two ledgers must not share their stock.'\nassert a.low(2) == ['X'] and b.low(2) == []"),
      ],
      xpReward: 160, coinReward: 25,
    },
    {
      id: 'py-28-tests-discount', title: 'Test the Discount Rules', mode: 'independent', language: 'python', skillIds: ['test.writing', 'test.assertions'], concepts: [], difficulty: 4, transfer: true, context: 'retail',
      prompt: text(
        'A shop’s function `price_after_discount(price, percent)` is already written (you cannot see it). It should return the price after taking off that percentage, **rounded to 2 decimal places**. `percent` must be from 0 to 100 inclusive, and `price` must not be negative: otherwise it raises `ValueError`.',
        'Write a test suite: functions whose names start with `test_`. Your tests must pass on the correct function and must catch every one of several different faulty versions of it.',
      ),
      starterCode: '', hints: [],
      checks: [{
        kind: 'tests', name: 'Your tests pass on correct code and catch the faults', minTests: 4, visible: false,
        correct: 'def price_after_discount(price, percent):\n    if price < 0 or percent < 0 or percent > 100:\n        raise ValueError("bad input")\n    return round(price * (1 - percent / 100), 2)',
        buggy: [
          { name: 'it forgets to round', code: 'def price_after_discount(price, percent):\n    if price < 0 or percent < 0 or percent > 100:\n        raise ValueError("bad input")\n    return price * (1 - percent / 100)' },
          { name: 'it allows discounts above 100%', code: 'def price_after_discount(price, percent):\n    if price < 0 or percent < 0:\n        raise ValueError("bad input")\n    return round(price * (1 - percent / 100), 2)' },
          { name: 'it rejects a 100% discount', code: 'def price_after_discount(price, percent):\n    if price < 0 or percent < 0 or percent >= 100:\n        raise ValueError("bad input")\n    return round(price * (1 - percent / 100), 2)' },
          { name: 'it accepts negative prices', code: 'def price_after_discount(price, percent):\n    if percent < 0 or percent > 100:\n        raise ValueError("bad input")\n    return round(price * (1 - percent / 100), 2)' },
          { name: 'it accepts negative discounts', code: 'def price_after_discount(price, percent):\n    if price < 0 or percent > 100:\n        raise ValueError("bad input")\n    return round(price * (1 - percent / 100), 2)' },
          { name: 'it rejects a free price of zero', code: 'def price_after_discount(price, percent):\n    if price <= 0 or percent < 0 or percent > 100:\n        raise ValueError("bad input")\n    return round(price * (1 - percent / 100), 2)' },
          { name: 'it takes off the percentage twice as fast', code: 'def price_after_discount(price, percent):\n    if price < 0 or percent < 0 or percent > 100:\n        raise ValueError("bad input")\n    return round(price * (1 - percent / 50), 2)' },
          { name: 'it rounds down instead of to the nearest', code: 'import math\ndef price_after_discount(price, percent):\n    if price < 0 or percent < 0 or percent > 100:\n        raise ValueError("bad input")\n    return math.floor(price * (1 - percent / 100) * 100) / 100' },
        ],
      }],
      xpReward: 170, coinReward: 26,
    },
    {
      id: 'py-28-deadline-text', title: 'The Deadline Wording', mode: 'independent', language: 'python', skillIds: ['py.modules', 'py.functions', 'py.strings'], concepts: [], difficulty: 3, transfer: true, context: 'project management',
      prompt: text(
        'A project tracker shows how close a deadline is. Write `deadline_text(due, today)`, where both dates are text in the form `YYYY-MM-DD`. It returns: `Due today` on the day itself; `Due tomorrow` the day before; `<n> days left (<Weekday>)` when it is `n` days away (two or more), with the full English weekday name of the due date (for example `5 days left (Friday)`); `Overdue by 1 day` when it was due yesterday; and `Overdue by <n> days` when it was due `n` days ago (two or more).',
      ),
      starterCode: '', hints: [],
      checks: [
        call('Five days away', 'deadline_text', ['2024-05-10', '2024-05-05'], '5 days left (Friday)'),
        call('The same day', 'deadline_text', ['2024-05-05', '2024-05-05'], 'Due today'),
        call('Tomorrow', 'deadline_text', ['2024-05-06', '2024-05-05'], 'Due tomorrow'),
        call('Two days', 'deadline_text', ['2024-05-07', '2024-05-05'], '2 days left (Tuesday)'),
        call('Yesterday', 'deadline_text', ['2024-05-04', '2024-05-05'], 'Overdue by 1 day'),
        call('Long overdue', 'deadline_text', ['2024-04-05', '2024-05-05'], 'Overdue by 30 days'),
        call('Across a year end', 'deadline_text', ['2025-01-02', '2024-12-30'], '3 days left (Thursday)'),
        call('A leap day', 'deadline_text', ['2024-03-01', '2024-02-27'], '3 days left (Friday)'),
        call('Across a year end, overdue', 'deadline_text', ['2023-12-31', '2024-01-02'], 'Overdue by 2 days'),
      ],
      xpReward: 130, coinReward: 20,
    },
    {
      id: 'py-28-log-summary', title: 'The Server Log Report', mode: 'independent', language: 'python', skillIds: ['py.strings', 'py.dicts', 'de.files', 'de.cleaning'], concepts: [], difficulty: 4, transfer: true, context: 'operations',
      prompt: text(
        '`server.log` has one event per line, like `2024-05-01 12:00:03 ERROR disk: no space left`: a date, a time, a level (`ERROR`, `WARN` or `INFO`), then a message. Some lines are damaged (blank, too short, or with any other level) and must be skipped.',
        'Print: one line per level in the order ERROR, WARN, INFO as `LEVEL: count`; then `Busiest hour: HH`, the two-digit hour of day (from the time) with the most valid events (if two hours tie, the earlier one); then `Skipped: N`, the number of damaged non-blank lines. Blank lines are ignored and not counted as skipped. If there are no valid events, print `Busiest hour: none` on that line.',
      ),
      fixtures: { files: { 'server.log': '2024-05-01 12:00:03 ERROR disk: no space left\n2024-05-01 12:15:00 INFO backup started\n\n2024-05-01 13:01:10 WARN cpu: high load\n2024-05-01 13:05:00 ERROR net: timeout\n2024-05-01 13:59:59 INFO backup finished\nnot a log line\n2024-05-01 14:00:00 DEBUG noisy\n' } },
      starterCode: '', hints: [],
      checks: [
        out('The example log', 'ERROR: 2\nWARN: 1\nINFO: 2\nBusiest hour: 13\nSkipped: 2', undefined, true),
        out('Ties go to the earlier hour', 'ERROR: 0\nWARN: 1\nINFO: 1\nBusiest hour: 09\nSkipped: 0', { 'server.log': '2024-06-01 10:00:00 INFO a\n2024-06-01 09:30:00 WARN b\n' }),
        out('No valid events', 'ERROR: 0\nWARN: 0\nINFO: 0\nBusiest hour: none\nSkipped: 2', { 'server.log': 'garbage\n2024-06-01 10:00:00 DEBUG x\n\n' }),
        out('An empty file', 'ERROR: 0\nWARN: 0\nINFO: 0\nBusiest hour: none\nSkipped: 0', { 'server.log': '' }),
        out('Messages may contain level words and colons', 'ERROR: 1\nWARN: 0\nINFO: 1\nBusiest hour: 23\nSkipped: 1', { 'server.log': '2024-07-01 23:59:59 INFO ERROR: this is only text\n2024-07-01 23:00:01 ERROR db: WARN me\n2024-07-01 23:00:02\n' }),
        out('Levels are exact', 'ERROR: 0\nWARN: 0\nINFO: 1\nBusiest hour: 00\nSkipped: 2', { 'server.log': '2024-07-01 00:10:00 error lower case\n2024-07-01 00:10:00 ERRORS extra\n2024-07-01 00:10:00 INFO fine\n' }),
      ],
      xpReward: 160, coinReward: 25,
    },
  ],
};
