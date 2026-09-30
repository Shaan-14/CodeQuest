import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, jsCalls, wc, web, webDemo } from './helpers';

/** A check that calls a function and demands it throw an error of a given class (and message pattern). */
const throws = (call: string, cls: string, pattern: string, label: string) => `{ let threw = null; try { ${call}; } catch (e) { threw = e; } h.assert(threw, ${JSON.stringify(label + ' should throw an error')}); h.assert(threw instanceof ${cls}, ${JSON.stringify(label + ' should throw a ' + cls)} + ' (got ' + (threw && threw.constructor && threw.constructor.name) + ')'); h.assert(/${pattern}/i.test(threw.message), ${JSON.stringify(label + ': the error message should mention "' + pattern + '"')} + ' (got "' + threw.message + '")'); }`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-17-js-errors', title: 'Errors, Exceptions and Debugging JavaScript', language: 'web', skillId: 'web.debugging',
    blurb: 'Reading errors, try/catch, throwing your own, and a systematic approach to fixing broken code.', prerequisites: ['web-16-js-data'], xpReward: 60,
    reference: {
      title: 'Errors and debugging in JavaScript',
      body: text(
        'An **uncaught error** stops the script at that line and appears in the console with its type and message: `ReferenceError: x is not defined` (a name that does not exist), `TypeError: cannot read properties of undefined` (using `.` on nothing), `SyntaxError` (the code cannot be parsed), `RangeError`. Read the **first** line of the error and the line number it points to.',
        '`try { risky() } catch (e) { handle(e) }` catches errors; `throw new RangeError("out of range")` raises one (throw `Error` objects, not strings). `JSON.parse` throws on bad input. **Debug systematically**: reproduce, shrink the input, form ONE hypothesis, add `console.log` (or use the debugger and breakpoints in developer tools), change one thing, re-run. Common causes: `==` vs `===`, off-by-one loop bounds, mutating an input, forgetting `return`, and `undefined` from a missing key.',
      ),
      example: 'function safeParse(text, fallback) {\n  try {\n    return JSON.parse(text);\n  } catch (e) {\n    return fallback;\n  }\n}',
    },
    steps: [
      { kind: 'teach', title: 'When code fails', body: text('JavaScript is *forgiving* in some places (it converts types and returns `undefined` for missing things) and *strict* in others (it throws when you use `undefined` like an object). Both cause bugs: the forgiving kind is silent, the strict kind is loud.', 'Two skills carry you a long way: reading the error message properly, and **shrinking** the problem until the bug has nowhere to hide. `console.log` in the right place beats guessing every time.') },
      webDemo({
        title: 'Read the error',
        body: text('Run it. The script fails: read the error in the console, find the line, and fix it. Then predict what `safeParse("{oops", [])` returns before running it.'),
        files: files('<p id="out"></p>\n', '', 'const readings = [4, 8, 15];\nlet total = 0;\nfor (let i = 0; i <= readings.length; i++) {\n  total += readings[i].value;\n}\nconsole.log(total);\n'),
        notice: 'The loop runs one time too many (`<=` instead of `<`), so `readings[3]` is `undefined` and `.value` on it throws a TypeError. The message points at the *symptom*; you still have to find the *cause*.',
      }),
      { kind: 'challenge', challengeId: 'web-17-safe-parse' },
      { kind: 'challenge', challengeId: 'web-17-validate-reading' },
      { kind: 'challenge', challengeId: 'web-17-fix-average' },
    ],
  },
  objectives: [
    { id: 'js-obj-error-handling', title: 'Handle and raise errors deliberately', summary: 'try/catch, and throwing the right kind of error with a helpful message.' },
    { id: 'js-obj-fix-bug', title: 'Find and fix a bug in JavaScript', summary: 'Locate off-by-one, mutation, comparison and return bugs with a systematic approach.' },
  ],
  challenges: [
    wc({
      id: 'web-17-safe-parse', title: 'Parse Without Crashing', mode: 'learning', skillIds: ['web.debugging', 'js.basics'], concepts: ['try/catch', 'JSON.parse', 'fallback'], difficulty: 2, context: 'software',
      prompt: text('Write `parseJson(text, fallback)`. It returns the value that `JSON.parse` produces for `text`, but if `text` is not valid JSON it returns `fallback` instead of crashing.'),
      expectedBehavior: 'parseJson("{\\"a\\":1}", null) returns { a: 1 }; parseJson("{oops", []) returns [].',
      guidedSteps: ['`JSON.parse` throws on bad input.', 'Put it in a `try` block and return its result.', 'In `catch`, return `fallback`.'],
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Some inputs make JSON.parse throw.', 'A try/catch turns an error into a normal value.', '`try { return JSON.parse(text); } catch (e) { return fallback; }`'],
      checks: jsCalls('parseJson', '(t, f) => { try { return JSON.parse(t); } catch (e) { return f; } }', ['\'{"a":1}\', null', '"{oops", []', '"", "empty"', '"[1,2,3]", 0', '"null", "x"', '"undefined", "bad"', '"42", 0'], { visibleFirst: true }),
      xpReward: 50, coinReward: 7,
    }),
    wc({
      id: 'web-17-validate-reading', objectiveId: 'js-obj-error-handling', title: 'Validate a Sensor Reading', mode: 'challenge', skillIds: ['web.debugging', 'js.basics'], concepts: ['throw', 'error types', 'validation'], difficulty: 3, context: 'engineering',
      prompt: text('Write `validateReading(x)` for a temperature sensor. If `x` is not a number (or is `NaN`) it must **throw a `TypeError`** whose message contains the word `number`. If it is a number below -50 or above 150 it must **throw a `RangeError`** whose message contains `range`. Otherwise it **returns** the reading rounded to 1 decimal place.'),
      expectedBehavior: 'validateReading(21.456) returns 21.5; validateReading("hot") throws a TypeError.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Two different problems deserve two different kinds of error.', 'Decide the order of the checks: type before range.', '`throw new TypeError("Reading must be a number")`, `throw new RangeError("Reading out of range")`.'],
      checks: [
        web('Valid readings are returned rounded', "h.eq(validateReading(21.456), 21.5); h.eq(validateReading(-50), -50); h.eq(validateReading(150), 150); h.eq(validateReading(0), 0); h.eq(validateReading(-3.04), -3);"),
        web('Wrong types', [throws("validateReading('hot')", 'TypeError', 'number', 'A string'), throws('validateReading(NaN)', 'TypeError', 'number', 'NaN'), throws('validateReading(null)', 'TypeError', 'number', 'null'), throws('validateReading(undefined)', 'TypeError', 'number', 'undefined')].join('\n'), { visible: false }),
        web('Out of range', [throws('validateReading(150.1)', 'RangeError', 'range', 'A reading above 150'), throws('validateReading(-50.5)', 'RangeError', 'range', 'A reading below -50'), throws('validateReading(1000)', 'RangeError', 'range', '1000')].join('\n'), { visible: false }),
      ],
      xpReward: 75, coinReward: 11,
    }),
    wc({
      id: 'web-17-parse-entry', objectiveId: 'js-obj-error-handling', title: 'Parse a Lap Entry', mode: 'challenge', skillIds: ['web.debugging', 'js.basics'], concepts: ['throw', 'error types', 'validation'], difficulty: 3, context: 'motorsport',
      prompt: text('Write `parseLap(text)` for lap times typed as `m:ss.mmm` (for example `1:23.456`). It returns the time in **seconds** as a number (`83.456`). If the text does not have that exact shape it must **throw a `SyntaxError`** whose message contains `format`. If the seconds part is 60 or more it must **throw a `RangeError`** whose message contains `seconds`.'),
      expectedBehavior: 'parseLap("1:23.456") returns 83.456; parseLap("abc") throws a SyntaxError.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Check the shape before doing any arithmetic.', 'A regular expression can describe the shape and capture the parts.', '`/^(\\d+):(\\d{2})\\.(\\d{3})$/` and `match`.'],
      checks: [
        web('Valid laps', "h.eq(parseLap('1:23.456'), 83.456); h.eq(parseLap('0:59.999'), 59.999); h.eq(parseLap('12:00.000'), 720); h.eq(parseLap('2:05.500'), 125.5);"),
        web('Wrong shape', ['abc', '1:2.3', '1:23', '1:23.45', '-1:23.456', '', ' 1:23.456', '1:23.456 ', '1:234.456'].map((v) => throws(`parseLap(${JSON.stringify(v)})`, 'SyntaxError', 'format', JSON.stringify(v))).join('\n'), { visible: false }),
        web('Seconds out of range', [throws("parseLap('1:60.000')", 'RangeError', 'seconds', '1:60.000'), throws("parseLap('0:75.000')", 'RangeError', 'seconds', '0:75.000')].join('\n'), { visible: false }),
      ],
      xpReward: 75, coinReward: 11,
    }),
    wc({
      id: 'web-17-safe-share', objectiveId: 'js-obj-error-handling', title: 'Split the Budget', mode: 'challenge', skillIds: ['web.debugging', 'js.basics'], concepts: ['throw', 'error types', 'validation'], difficulty: 3, context: 'finance',
      prompt: text('Write `perPerson(total, people)`. It returns `total / people` rounded to 2 decimal places. If `people` is not a whole number of at least 1 it must **throw a `RangeError`** whose message contains `people`. If `total` is negative or not a number it must **throw a `TypeError`** whose message contains `total`.'),
      expectedBehavior: 'perPerson(100, 3) returns 33.33; perPerson(100, 0) throws a RangeError.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Two inputs, two kinds of bad value.', 'A whole number check has a built-in helper.', '`Number.isInteger(people)`, `typeof total !== "number"`.'],
      checks: [
        web('Valid', "h.eq(perPerson(100, 3), 33.33); h.eq(perPerson(0, 4), 0); h.eq(perPerson(10, 1), 10); h.eq(perPerson(99.99, 2), 50);"),
        web('Bad people', ['0', '-2', '1.5', "'3'", 'NaN', 'null'].map((v) => throws(`perPerson(100, ${v})`, 'RangeError', 'people', `people = ${v}`)).join('\n'), { visible: false }),
        web('Bad total', ["-5", "'100'", 'NaN', 'undefined'].map((v) => throws(`perPerson(${v}, 2)`, 'TypeError', 'total', `total = ${v}`)).join('\n'), { visible: false }),
      ],
      xpReward: 75, coinReward: 11,
    }),
    wc({
      id: 'web-17-fix-average', objectiveId: 'js-obj-fix-bug', title: 'Fix the Average', mode: 'challenge', skillIds: ['web.debugging', 'js.basics'], concepts: ['off-by-one', 'debugging', 'edge cases'], difficulty: 3, context: 'science',
      prompt: text('`average(values)` should return the mean of a list of numbers, or `0` for an empty list. It has bugs: it gives wrong answers and crashes on some inputs. Fix it (rewrite it if you prefer). It must not change the list.'),
      expectedBehavior: 'average([2, 4, 9]) returns 5; average([]) returns 0.',
      starterFiles: files('', '', 'function average(values) {\n  let total = 0;\n  for (let i = 0; i <= values.length; i++) {\n    total += values[i];\n  }\n  return total / values.length - 1;\n}\n'), tabs: ['js'],
      hints: ['Run it with a tiny list and compare with the answer you expect.', 'Two separate mistakes: one in the loop, one in the result.', 'The loop goes one step too far; the return has an extra subtraction; and the empty list divides by zero.'],
      checks: jsCalls('average', '(v) => v.length === 0 ? 0 : v.reduce((a, b) => a + b, 0) / v.length', ['[2, 4, 9]', '[]', '[5]', '[1, 2, 3, 4]', '[-2, 2]', '[0.5, 0.25]'], { pure: true, visibleFirst: true }),
      xpReward: 70, coinReward: 10,
    }),
    wc({
      id: 'web-17-fix-dedupe', objectiveId: 'js-obj-fix-bug', title: 'Fix the Duplicate Remover', mode: 'challenge', skillIds: ['web.debugging', 'js.basics'], concepts: ['off-by-one', 'debugging', 'edge cases'], difficulty: 3, context: 'retail',
      prompt: text('`uniqueSkus(list)` should return the list of SKU codes with duplicates removed, keeping the **first** occurrence of each and the original order. It has bugs: it sometimes changes the list it was given and sometimes drops or keeps the wrong items. Fix it (rewrite it if you prefer). It must not change the list.'),
      expectedBehavior: 'uniqueSkus(["b","a","b","c","a"]) returns ["b","a","c"].',
      starterFiles: files('', '', 'function uniqueSkus(list) {\n  list.sort();\n  const out = [];\n  for (let i = 1; i < list.length; i++) {\n    if (list[i] != list[i - 1]) out.push(list[i]);\n  }\n  return out;\n}\n'), tabs: ['js'],
      hints: ['Try it on a small list and look at what comes back and what happens to the input.', 'Sorting changes the order and the input; think about another way to know what has been seen.', 'Keep a record of the values already seen (an array or a Set) and skip repeats.'],
      checks: jsCalls('uniqueSkus', '(l) => { const seen = new Set(); const out = []; for (const x of l) { if (!seen.has(x)) { seen.add(x); out.push(x); } } return out; }', ['["b", "a", "b", "c", "a"]', '[]', '["x"]', '["a", "a", "a"]', '["3", 3, "3"]', '["z", "y", "x"]'], { pure: true, visibleFirst: true }),
      xpReward: 70, coinReward: 10,
    }),
    wc({
      id: 'web-17-fix-clamp', objectiveId: 'js-obj-fix-bug', title: 'Fix the Throttle Clamp', mode: 'challenge', skillIds: ['web.debugging', 'js.basics'], concepts: ['off-by-one', 'debugging', 'edge cases'], difficulty: 3, context: 'motorsport',
      prompt: text('`clampThrottle(value)` should return the throttle position limited to the range 0 to 100 (values below 0 become 0, above 100 become 100), rounded to the nearest whole number; anything that is not a number becomes 0. It has bugs. Fix it (rewrite it if you prefer).'),
      expectedBehavior: 'clampThrottle(120) returns 100; clampThrottle(-4) returns 0; clampThrottle(49.6) returns 50.',
      starterFiles: files('', '', 'function clampThrottle(value) {\n  if (value = 100) return 100;\n  if (value < 0) return 0;\n  if (value == "abc") return 0;\n  Math.round(value);\n}\n'), tabs: ['js'],
      hints: ['Run it with 120, -4, 49.6 and "abc" and see which cases go wrong.', 'One condition assigns instead of compares; one branch never returns.', '`=` versus `===`, a missing `return`, and a check for numbers that cannot work.'],
      checks: jsCalls('clampThrottle', '(v) => typeof v !== "number" || Number.isNaN(v) ? 0 : Math.round(Math.min(100, Math.max(0, v)))', ['120', '-4', '49.6', '"abc"', '100', '0', '50', 'NaN', '100.4', '0.4', 'undefined', '"50"'], { visibleFirst: true }),
      xpReward: 70, coinReward: 10,
    }),
  ],
};
