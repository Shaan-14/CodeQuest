import { text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const out = (name: string, expect: string, stdin?: string[], files?: Record<string, string>, visible = false): Check => ({ kind: 'output', name, expect, stdin, files, visible });
const call = (name: string, fn: string, args: unknown[], expect: unknown): Check => ({ kind: 'call', name, fn, args: args as never, expect: expect as never, visible: false });

/**
 * INDEPENDENT MODE (Python review trial A). Older skills (strings, output formatting, logic, dictionaries, defensive
 * code) in fresh contexts. Problem statements only: no hints, no starter, no named functions or constructs.
 */
export const bundle: LessonBundle = {
  lesson: {
    id: 'py-27-independent-review-a', title: 'Trial: Old Skills, New Problems', language: 'python', skillId: 'py.functions',
    blurb: 'Five open problems on skills you learned earlier. No hints, no scaffolding, hidden checks.', prerequisites: ['py-19-debugging'], xpReward: 0,
    reference: { title: 'Independent trials', body: 'Independent trials give you a problem and nothing else. Use the Field Manual, run small experiments, and write down the ways the input could be awkward before you code. The hidden checks use inputs you have not seen.' },
    steps: [
      { kind: 'challenge', challengeId: 'py-27-till-receipt' },
      { kind: 'challenge', challengeId: 'py-27-plate-check' },
      { kind: 'challenge', challengeId: 'py-27-word-frequency' },
      { kind: 'challenge', challengeId: 'py-27-balanced' },
      { kind: 'challenge', challengeId: 'py-27-average-rating' },
    ],
  },
  objectives: [],
  challenges: [
    {
      id: 'py-27-till-receipt', title: 'The Till Receipt', mode: 'independent', language: 'python', skillIds: ['py.strings', 'py.output', 'py.numbers', 'py.loops'], concepts: [], difficulty: 3, transfer: true, context: 'retail',
      prompt: text(
        'A till program reads purchases from the keyboard, one per line, written `name,quantity,unit price` (for example `Bolt,12,0.35`), until a line that says `END`. Spaces around any of the three parts must be ignored.',
        'For every purchase print one line: the name **left-aligned in 12 characters** (a longer name is cut off after 12), a space, the quantity **right-aligned in 3**, a space, and the line total (quantity × unit price) **right-aligned in 8 characters with two decimals**. After the last purchase print a line of 25 equals signs (`=`) and then a line with the word `TOTAL` in the name field, nothing (spaces) in the quantity field, and the grand total in the amount field, laid out exactly like the purchase lines.',
      ),
      starterCode: '', hints: [],
      checks: [
        out('An example basket', 'Bolt          12     4.20\nSteel washer   5     1.75\n=========================\nTOTAL                5.95', ['Bolt,12,0.35', 'Steel washer,5,0.35', 'END'], undefined, true),
        out('Spaces and long names', 'Adjustable s   1    12.50\nNut            3     0.30\n=========================\nTOTAL               12.80', [' Adjustable spanner , 1 , 12.50', 'Nut , 3,0.10', 'END']),
        out('An empty basket', '=========================\nTOTAL                0.00', ['END']),
        out('Big numbers use the full width', 'Crate        100  1234.50\n=========================\nTOTAL             1234.50', ['Crate,100,12.345', 'END']),
      ],
      xpReward: 130, coinReward: 20,
    },
    {
      id: 'py-27-plate-check', title: 'The Plate Checker', mode: 'independent', language: 'python', skillIds: ['py.logic', 'py.conditionals', 'py.strings', 'py.loops'], concepts: [], difficulty: 3, transfer: true, context: 'transport',
      prompt: text(
        'A parking system reads number plates from the keyboard, one per line, until an empty line. A valid plate is exactly: **two capital letters, two digits, one space, then three capital letters** (like `AB12 CDE`), and the three final letters may not include `I`, `Q` or `Z`.',
        'For each plate print the plate exactly as typed, a colon, a space, and `valid` or `invalid` (for example `AB12 CDE: valid`).',
      ),
      starterCode: '', hints: [],
      checks: [
        out('A few plates', 'AB12 CDE: valid\nab12 cde: invalid\nAB1 CDE: invalid\nAB12CDE: invalid', ['AB12 CDE', 'ab12 cde', 'AB1 CDE', 'AB12CDE', ''], undefined, true),
        out('The banned letters', 'XY99 ABC: valid\nXY99 AIC: invalid\nXY99 QBC: invalid\nXY99 ABZ: invalid\nIQ99 ABC: valid', ['XY99 ABC', 'XY99 AIC', 'XY99 QBC', 'XY99 ABZ', 'IQ99 ABC', '']),
        out('Wrong lengths and spacing', 'AB12  CDE: invalid\n AB12 CDE: invalid\nAB12 CDEF: invalid\nAB12 CD: invalid\nA112 CDE: invalid\nAB1A CDE: invalid', ['AB12  CDE', ' AB12 CDE', 'AB12 CDEF', 'AB12 CD', 'A112 CDE', 'AB1A CDE', '']),
        out('No plates at all', '', ['']),
        out('Digits and letters in the wrong places', 'AB12 C1E: invalid\n1B12 CDE: invalid\nZZ00 XYW: valid', ['AB12 C1E', '1B12 CDE', 'ZZ00 XYW', '']),
      ],
      xpReward: 130, coinReward: 20,
    },
    {
      id: 'py-27-word-frequency', title: 'The Speech Analyser', mode: 'independent', language: 'python', skillIds: ['py.dicts', 'py.lists', 'py.strings', 'de.files'], concepts: [], difficulty: 3, transfer: true, context: 'education',
      prompt: text(
        '`speech.txt` holds the text of a speech. Print its **three most common words**, most common first, one per line as `word: count`. Words are made of letters and apostrophes; everything else (spaces, punctuation, digits, line breaks) separates words. Capital letters do not matter (print the words in lower case). Words with the same count are ordered alphabetically. If the speech has fewer than three different words, print as many as there are.',
      ),
      fixtures: { files: { 'speech.txt': 'We shall fight on the beaches. We shall fight on the landing grounds,\nwe shall fight in the fields and in the streets; we shall never surrender!' } },
      starterCode: '', hints: [],
      checks: [
        out('The example speech', 'shall: 4\nthe: 4\nwe: 4', undefined, undefined, true),
        out('Capitals, apostrophes and ties', "fine: 2\nit's: 2\nthe: 2", undefined, { 'speech.txt': "The cat. THE dog and it's fine; IT'S fine\n" }),
        out('Fewer than three words', 'hello: 3', undefined, { 'speech.txt': 'Hello, hello... HELLO!\n' }),
        out('Alphabetical ties', 'apple: 1\nbanana: 1\ncherry: 1', undefined, { 'speech.txt': 'cherry banana apple date\n' }),
        out('An empty file', '', undefined, { 'speech.txt': '' }),
        out('Digits and dashes separate words', 'a: 2\nb: 2\nc: 1', undefined, { 'speech.txt': 'a1b-a2b c\n' }),
      ],
      xpReward: 140, coinReward: 22,
    },
    {
      id: 'py-27-balanced', title: 'The Bracket Checker', mode: 'independent', language: 'python', skillIds: ['py.functions', 'py.logic', 'py.lists'], concepts: [], difficulty: 4, transfer: true, context: 'software',
      prompt: text(
        'A code editor needs to know whether the brackets in a piece of text are properly matched. Write a function `balanced(text)` that returns `True` or `False`. The bracket kinds are `()`, `[]` and `{}`. Every opening bracket must be closed by the same kind, in the right order (so `([)]` is not balanced), and nothing may be left open or closed too early. Other characters are ignored. Text with no brackets is balanced.',
      ),
      starterCode: '', hints: [],
      checks: [
        call('Simple cases', 'balanced', ['()'], true), call('A mismatch', 'balanced', ['(]'], false),
        call('Nesting', 'balanced', ['{[()()]}'], true), call('Crossed pairs', 'balanced', ['([)]'], false),
        call('Closed too early', 'balanced', [')('], false), call('Left open', 'balanced', ['((()'], false),
        call('An extra closer', 'balanced', ['())'], false), call('Other characters', 'balanced', ['print(a[1], {"k": (2)})'], true),
        call('No brackets', 'balanced', ['hello'], true), call('Empty text', 'balanced', [''], true),
        call('Only a closer', 'balanced', ['}'], false), call('Only an opener', 'balanced', ['['], false),
        call('Quotes are just characters', 'balanced', ['("]")'], false),
      ],
      xpReward: 150, coinReward: 24,
    },
    {
      id: 'py-27-average-rating', title: 'The Careful Average', mode: 'independent', language: 'python', skillIds: ['py.defensive', 'py.functions', 'py.numbers'], concepts: [], difficulty: 3, transfer: true, context: 'customer analytics',
      prompt: text(
        'Survey ratings arrive from several systems, so a list can contain numbers, numbers written as text (like `"4"` or `" 3.5 "`), empty values (`None`), and junk (like `"n/a"` or `""`). Write a function `average_rating(values)` that returns the **average of the usable ratings** rounded to **one decimal place**. A rating is usable when it is a number (or text that is a number) from **1 to 5 inclusive**; everything else is ignored. `True` and `False` are not ratings. If nothing is usable, return `None`. The list you are given must not be changed.',
      ),
      starterCode: '', hints: [],
      checks: [
        call('Plain numbers', 'average_rating', [[5, 4, 3]], 4.0), call('Numbers as text', 'average_rating', [['4', ' 3.5 ', 5]], 4.2),
        call('Junk is ignored', 'average_rating', [[null, 'n/a', '', 4, 5]], 4.5), call('Out of range is ignored', 'average_rating', [[0, 6, 1, 5, -3, '7']], 3.0),
        call('Nothing usable', 'average_rating', [[null, 'x', 9]], null), call('Empty list', 'average_rating', [[]], null),
        call('Booleans are not ratings', 'average_rating', [[true, false, 2]], 2.0), call('The boundaries', 'average_rating', [[1, 5, '1', '5.0']], 3.0),
        call('Rounding to one decimal', 'average_rating', [[1, 1, 2]], 1.3),
      ],
      xpReward: 130, coinReward: 20,
    },
  ],
};
