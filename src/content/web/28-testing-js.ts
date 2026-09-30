import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

/**
 * "Write the tests" checks. The player writes `testX(impl)`: a function that must return normally for the CORRECT
 * implementation and throw for every BUGGY one. All implementations live in the check, so the player's tests are
 * judged by what they catch, exactly like the Python testing lesson.
 */
const mutation = (fn: string, correct: string, bugs: [string, string][]) => [
  web('Passes a correct implementation', `const impl = ${correct}; let error = null; try { ${fn}(impl); } catch (e) { error = e; } h.assert(!error, 'Your tests failed on a CORRECT implementation, so they demand something the task does not ask for: ' + (error && error.message));`, { visible: true }),
  ...bugs.map(([name, impl]) => web(`Catches: ${name}`, `const impl = ${impl}; let caught = false; try { ${fn}(impl); } catch (e) { caught = true; } h.assert(caught, 'Your tests did not notice this bug: ${name}. Which input would behave differently from a correct version?');`, { visible: false })),
  web('The tests really run the implementation', `let calls = 0; const spy = (...args) => { calls++; return (${correct})(...args); }; ${fn}(spy); h.assert(calls >= 3, 'Your tests should call the implementation with several different inputs (it was called ' + calls + ' time(s)).');`, { visible: false }),
];

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-28-testing-js', title: 'Tests That Catch Bugs', language: 'web', skillId: 'js.testing',
    blurb: 'Anyone can write a test that passes. A good test fails when the code is wrong. Write tests that catch the bugs people actually make.', prerequisites: ['web-27-closures'], xpReward: 80,
    reference: {
      title: 'Testing JavaScript functions',
      body: text(
        'A **test** calls your code with chosen inputs and checks the result, raising an error when it is wrong: `if (clamp(15, 0, 10) !== 10) throw new Error("clamp(15, 0, 10) should be 10")`. A tiny helper keeps tests readable: `function assertEqual(actual, expected, label) { if (actual !== expected) throw new Error(label + ": expected " + expected + " but got " + actual); }`.',
        '**Which inputs?** The ones where bugs live: the **boundaries** (exactly on the limit, one either side), the **empty** case, **one** item, **duplicates**, **negative** numbers, input that must **not be changed**. A test that only checks the "typical" case passes for most wrong implementations.',
        'Good tests are judged by two questions: does it **pass** on a correct implementation (it must not demand extra), and does it **fail** on each plausible wrong one? Read the requirement, imagine three different wrong versions, then write the input that would separate each from the right one.',
      ),
      example: 'function assertEqual(actual, expected, label) {\n  if (JSON.stringify(actual) !== JSON.stringify(expected)) {\n    throw new Error(label + ": expected " + JSON.stringify(expected) + " but got " + JSON.stringify(actual));\n  }\n}\nassertEqual(Math.max(1, 2), 2, "max of 1 and 2");',
    },
    steps: [
      { kind: 'teach', title: 'A test is a claim that can be wrong', body: text('The point of a test is to **fail when the code is broken**. It is easy to write tests that always pass; the skill is choosing inputs that only a *correct* function survives. Think like a person hunting for mistakes: where would someone writing this function go wrong?') },
      webDemo({
        title: 'One test, one hidden bug',
        body: text('`isAdult` should accept 18. Run it: both tests pass. Then add a test for the exact boundary and watch which implementation it catches.'),
        files: files('', '', 'const good = (age) => age >= 18;\nconst buggy = (age) => age > 18;\n\nfunction check(isAdult, label) {\n  const cases = [[30, true], [5, false]];\n  for (const [age, want] of cases) {\n    if (isAdult(age) !== want) { console.log(label, "FAILS for", age); return; }\n  }\n  console.log(label, "passes");\n}\ncheck(good, "good");\ncheck(buggy, "buggy");'),
        notice: 'Both pass! Neither test looks at exactly 18, which is where the two versions differ. Add `[18, true]` to `cases` and `buggy` is caught. Boundaries are where the bugs are.',
      }),
      { kind: 'challenge', challengeId: 'web-28-test-clamp' },
      { kind: 'challenge', challengeId: 'web-28-test-median' },
    ],
  },
  objectives: [
    { id: 'js-obj-write-tests', title: 'Write tests that catch plausible bugs', summary: 'Write a test function that accepts a correct implementation and rejects each of several realistic wrong ones.' },
  ],
  challenges: [
    wc({
      id: 'web-28-test-clamp', title: 'Test a Clamp Function', mode: 'learning', skillIds: ['js.testing', 'js.basics'], concepts: ['testing', 'boundaries', 'assertions'], difficulty: 3, context: 'software',
      prompt: text('`clamp(x, lo, hi)` returns `x` limited to the range from `lo` to `hi` inclusive: values below `lo` become `lo`, values above `hi` become `hi`, anything between is returned unchanged.', 'You do not write `clamp`. Write `testClamp(clamp)`: a function that receives an implementation and **throws an `Error` if it is wrong** (and returns normally if it is right). Your tests will be run against a correct version and against several buggy ones; every buggy version must be caught.'),
      expectedBehavior: 'testClamp returns normally for a correct clamp and throws for each buggy one.',
      guidedSteps: ['Write a small helper that throws when `actual !== expected`.', 'Test a value below the range, above the range and inside it.', 'Test the values exactly on `lo` and `hi`.', 'Try a negative range too.'],
      starterFiles: files('', '', 'function testClamp(clamp) {\n  // throw an Error when clamp behaves wrongly\n}\n'), tabs: ['js'],
      hints: ['What are the three different situations `clamp` must handle?', 'A wrong version will usually get one of the three situations wrong. Test each one.', 'The exact edges (`x` equal to `lo` or `hi`) are where off-by-one versions differ.'],
      checks: mutation('testClamp', '(x, lo, hi) => Math.min(Math.max(x, lo), hi)', [
        ['ignores the lower limit', '(x, lo, hi) => Math.min(x, hi)'],
        ['ignores the upper limit', '(x, lo, hi) => Math.max(x, lo)'],
        ['returns the wrong limit for large values', '(x, lo, hi) => (x < lo ? lo : x > hi ? lo : x)'],
        ['makes the upper limit exclusive', '(x, lo, hi) => (x >= hi ? hi - 1 : x < lo ? lo : x)'],
        ['moves a value that is exactly on the lower limit', '(x, lo, hi) => (x <= lo ? lo + 1 : x > hi ? hi : x)'],
      ]),
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-28-test-median', objectiveId: 'js-obj-write-tests', title: 'Test a Median Function', mode: 'challenge', skillIds: ['js.testing', 'js.data'], concepts: ['testing', 'boundaries', 'assertions'], difficulty: 4, context: 'analytics',
      prompt: text('`median(numbers)` returns the middle value of a list of numbers: for an odd count the middle one after sorting, for an even count the average of the two middle ones, and `null` for an empty list. It must **not change** the list it is given.', 'Write `testMedian(median)`: it receives an implementation and **throws an `Error` if it is wrong** (returning normally if it is right). It will be run against a correct version and several buggy ones; every buggy one must be caught.'),
      expectedBehavior: 'testMedian returns normally for a correct median and throws for each buggy one.',
      starterFiles: files('', '', 'function testMedian(median) {\n}\n'), tabs: ['js'],
      hints: ['List the different situations: odd count, even count, empty, one item, unsorted input.', 'Which realistic mistakes could each of those expose? Sorting, the middle position, changing the input.', 'A test can also check that the input list looks the same afterwards.'],
      checks: mutation('testMedian', '(a) => { if (a.length === 0) return null; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }', [
        ['sorts as text (10 before 9)', '(a) => { if (a.length === 0) return null; const s = [...a].sort(); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }'],
        ['takes the upper middle for an even count', '(a) => { if (a.length === 0) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }'],
        ['changes the list it is given', '(a) => { if (a.length === 0) return null; a.sort((x, y) => x - y); const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }'],
        ['returns the mean instead', '(a) => (a.length === 0 ? null : a.reduce((p, c) => p + c, 0) / a.length)'],
        ['does not sort at all', '(a) => { if (a.length === 0) return null; const s = [...a]; const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }'],
        ['returns 0 for an empty list', '(a) => { if (a.length === 0) return 0; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }'],
      ]),
      xpReward: 120, coinReward: 18,
    }),
    wc({
      id: 'web-28-test-slugify', objectiveId: 'js-obj-write-tests', title: 'Test a Slug Function', mode: 'challenge', skillIds: ['js.testing', 'js.data'], concepts: ['testing', 'boundaries', 'assertions'], difficulty: 4, context: 'marketing',
      prompt: text('`slugify(title)` turns a title into a web address part: lower case, every run of characters that are not `a`–`z` or `0`–`9` becomes a single `-`, and there is no `-` at the start or the end. `"Hello, World!"` gives `"hello-world"`.', 'Write `testSlugify(slugify)`: it receives an implementation and **throws an `Error` if it is wrong** (returning normally if it is right). It will be run against a correct version and several buggy ones; every buggy one must be caught.'),
      expectedBehavior: 'testSlugify returns normally for a correct slugify and throws for each buggy one.',
      starterFiles: files('', '', 'function testSlugify(slugify) {\n}\n'), tabs: ['js'],
      hints: ['Write down every rule in the description as a separate behaviour.', 'A wrong version usually breaks exactly one rule. Which input isolates each rule?', 'Think about what happens at the very start and the very end, and between words.'],
      checks: mutation('testSlugify', '(t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")', [
        ['forgets to lower-case', '(t) => t.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "")'],
        ['leaves dashes at the ends', '(t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-")'],
        ['turns every separator into its own dash', '(t) => t.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/^-+|-+$/g, "")'],
        ['keeps punctuation', '(t) => t.toLowerCase().trim().replace(/\\s+/g, "-")'],
        ['drops digits', '(t) => t.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-+|-+$/g, "")'],
        ['treats accented letters as letters', '(t) => t.toLowerCase().replace(/[^\\p{L}0-9]+/gu, "-").replace(/^-+|-+$/g, "")'],
      ]),
      xpReward: 120, coinReward: 18,
    }),
  ],
};
