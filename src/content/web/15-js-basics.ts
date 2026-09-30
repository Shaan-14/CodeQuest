import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, jsCalls, logs, wc, web, webDemo } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-15-js-basics', title: 'JavaScript Basics in the Browser', language: 'web', skillId: 'js.basics',
    blurb: 'Values, variables, conditions, loops and functions: the JavaScript you already know from Python, in the browser.', prerequisites: ['web-14-independent-css'], xpReward: 60,
    reference: {
      title: 'JavaScript fundamentals',
      body: text(
        'JavaScript runs in the page. `console.log(...)` prints to the console. Declare variables with `const` (cannot be reassigned; prefer it) or `let`; template strings use backticks: `` `Hello ${name}` ``. Types: `number`, `string`, `boolean`, `null`, `undefined`, arrays, objects. **Always compare with `===` / `!==`** (`==` converts types in surprising ways). Falsy values: `false`, `0`, `""`, `null`, `undefined`, `NaN`.',
        'Control flow: `if / else if / else`, `for (let i = 0; i < n; i++)`, `for (const x of list)`, `while`. Functions: `function add(a, b) { return a + b; }` or arrow functions `const add = (a, b) => a + b;`. Semicolons and braces matter; a missing `return` gives `undefined`. Numbers are floating point: `0.1 + 0.2 !== 0.3`; round with `Math.round(x * 100) / 100`.',
      ),
      example: 'function parcelClass(weight) {\n  if (weight >= 30) return "freight";\n  return weight >= 5 ? "standard" : "letter";\n}\nconsole.log(parcelClass(12));',
    },
    steps: [
      { kind: 'teach', title: 'You already know this (mostly)', body: text('If you have written Python, you already understand variables, conditions, loops and functions. JavaScript has the same ideas with different punctuation: braces instead of indentation, `===` instead of `==`, `const`/`let` instead of bare names, and `console.log` instead of `print`. The new part is *where it runs*: inside a web page, next to the HTML and CSS you have written.', 'In this lesson the “page” is just a place to run code and see `console.log` output in the console. From the next lessons it will change the page itself.') },
      webDemo({
        title: 'Your first script',
        body: text('Run it and read the console. Then change the `weight`, run again, and predict the output before you run.'),
        files: files('<p>Open the console below.</p>\n', '', 'const weight = 12;\nlet label;\nif (weight >= 30) {\n  label = "freight";\n} else if (weight >= 5) {\n  label = "standard";\n} else {\n  label = "letter";\n}\nconsole.log(`A ${weight} kg parcel is ${label}`);\nconsole.log(0.1 + 0.2 === 0.3, "5" == 5, "5" === 5);\n'),
        notice: 'The last line prints `false true false`: floating-point sums are not exact, `==` quietly converts the string to a number, and `===` does not. Use `===` and round money and measurements deliberately.',
      }),
      { kind: 'challenge', challengeId: 'web-15-console-hello' },
      { kind: 'challenge', challengeId: 'web-15-parcel-class' },
      { kind: 'challenge', challengeId: 'web-15-count-above' },
    ],
  },
  objectives: [
    { id: 'js-obj-functions-conditionals', title: 'Write a function that decides with conditions', summary: 'if/else chains, comparison with ===, boundaries and invalid input.' },
    { id: 'js-obj-loops-accumulate', title: 'Loop over values and accumulate a result', summary: 'for/for-of loops with counters, sums and streaks, including empty input.' },
  ],
  challenges: [
    wc({
      id: 'web-15-console-hello', title: 'The Console Report', mode: 'learning', skillIds: ['js.basics'], concepts: ['console.log', 'const', 'template strings'], difficulty: 1, context: 'engineering',
      prompt: text('Write a script with a `const` for the machine name (`M-7`), one for its status (`running`) and one for its temperature (`72.5`). Print these three lines to the console, in this order, using the variables: `Machine: M-7`, `Status: running`, `Temperature: 72.5 C`.'),
      expectedBehavior: 'Three console lines built from variables.',
      guidedSteps: ['`const machine = "M-7";` and the other two.', '`console.log(`Machine: ${machine}`);` (template string with backticks).'],
      starterFiles: files('', '', '// Write your script here\n'), tabs: ['js'],
      hints: ['Store each fact in a variable first.', 'A template string lets you put a variable inside text.', 'Backticks and `${name}`.'],
      checks: [logs('The console output', ['Machine: M-7', 'Status: running', 'Temperature: 72.5 C']), web('Variables are used', "h.assert(/const\\s+\\w+\\s*=\\s*[\"'`]?M-7/.test(h.files.js), 'Keep the machine name in a const variable.'); h.assert(/\\$\\{/.test(h.files.js) || /\\+/.test(h.files.js), 'Build the lines from the variables.');", { visible: false })],
      xpReward: 45, coinReward: 6,
    }),
    wc({
      id: 'web-15-parcel-class', objectiveId: 'js-obj-functions-conditionals', title: 'Which Parcel Class?', mode: 'challenge', skillIds: ['js.basics'], concepts: ['function', 'if/else', 'comparison', 'return'], difficulty: 2, context: 'logistics',
      prompt: text('Write a function `parcelClass(weightKg, fragile)`. A parcel of 30 kg or more is `"freight"`, whatever else is true. Otherwise a fragile parcel is `"careful"`; a non-fragile parcel of 5 kg or more is `"standard"`; a lighter one is `"letter"`. A weight of zero or less is `"invalid"`.'),
      expectedBehavior: 'parcelClass(12, false) returns "standard"; parcelClass(30, true) returns "freight".',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Some rules beat others: decide the order to check them in.', 'Invalid input should be handled first.', 'A chain of `if` statements, each `return`ing.'],
      checks: jsCalls('parcelClass', '(w, f) => { if (w <= 0) return "invalid"; if (w >= 30) return "freight"; if (f) return "careful"; return w >= 5 ? "standard" : "letter"; }', ['12, false', '30, true', '29.9, true', '5, false', '4.99, false', '0, true', '-3, false', '2, true', '100, false', '5, true'], { visibleFirst: true }),
      xpReward: 60, coinReward: 9,
    }),
    wc({
      id: 'web-15-letter-grade', objectiveId: 'js-obj-functions-conditionals', title: 'The Letter Grade', mode: 'challenge', skillIds: ['js.basics'], concepts: ['function', 'if/else', 'comparison', 'return'], difficulty: 2, context: 'education',
      prompt: text('Write a function `letterGrade(score)`. A score of 90 or more is `"A"`, 80 or more `"B"`, 70 or more `"C"`, 60 or more `"D"`, anything lower `"F"`. A score below 0, above 100, or that is not a number returns `"invalid"`.'),
      expectedBehavior: 'letterGrade(85) returns "B"; letterGrade(101) returns "invalid".',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Rule out the invalid values first.', 'Once the value is valid, check from the highest grade down.', 'Use `typeof score !== "number"` and `Number.isNaN`.'],
      checks: jsCalls('letterGrade', '(s) => { if (typeof s !== "number" || Number.isNaN(s) || s < 0 || s > 100) return "invalid"; if (s >= 90) return "A"; if (s >= 80) return "B"; if (s >= 70) return "C"; if (s >= 60) return "D"; return "F"; }', ['95', '90', '89.9', '80', '79', '70', '69', '60', '59.5', '0', '100', '101', '-1', '"90"', 'NaN', 'null'], { visibleFirst: true }),
      xpReward: 60, coinReward: 9,
    }),
    wc({
      id: 'web-15-race-flag', objectiveId: 'js-obj-functions-conditionals', title: 'Which Flag?', mode: 'challenge', skillIds: ['js.basics'], concepts: ['function', 'if/else', 'comparison', 'return'], difficulty: 2, context: 'motorsport',
      prompt: text('Write a function `flagFor(speedKmh, limitKmh, raining)` for a pit-lane marshal. A speed of zero or less is `"stopped"`. Above 120% of the limit is `"red"`; above the limit (but not above 120%) `"yellow"`; if it is raining and the speed is above 80% of the limit (but not above the limit) `"blue"`; otherwise `"green"`.'),
      expectedBehavior: 'flagFor(100, 80, false) returns "red" (above 120% of the limit).',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Percentages of a limit are multiplications.', 'Order the checks from the most serious to the least.', 'Check stopped first, then red, yellow, blue, and let green be the default.'],
      checks: jsCalls('flagFor', '(s, l, r) => { if (s <= 0) return "stopped"; if (s > l * 1.2) return "red"; if (s > l) return "yellow"; if (r && s > l * 0.8) return "blue"; return "green"; }', ['100, 80, false', '96, 80, false', '96.5, 80, false', '81, 80, false', '80, 80, false', '70, 80, true', '64, 80, true', '64.5, 80, true', '70, 80, false', '0, 80, true', '-5, 80, false', '30, 60, true'], { visibleFirst: true }),
      xpReward: 60, coinReward: 9,
    }),
    wc({
      id: 'web-15-count-above', objectiveId: 'js-obj-loops-accumulate', title: 'Readings Over the Limit', mode: 'challenge', skillIds: ['js.basics'], concepts: ['for loop', 'array', 'counter', 'return'], difficulty: 2, context: 'engineering',
      prompt: text('A sensor logs one temperature per hour. Write a function `countAbove(readings, limit)` that returns how many readings are **strictly above** the limit. An empty list gives 0.'),
      expectedBehavior: 'countAbove([70, 82, 91, 80], 80) returns 2.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['You need a number that grows as you find matches.', 'Look at each reading once.', 'A `for...of` loop, an `if`, and a counter starting at 0.'],
      checks: jsCalls('countAbove', '(r, l) => r.filter((x) => x > l).length', ['[70, 82, 91, 80], 80', '[], 10', '[80, 80, 80], 80', '[81], 80', '[1, 2, 3], 0', '[-5, -1], -3', '[5.5, 5.4, 5.6], 5.5'], { pure: true, visibleFirst: true }),
      xpReward: 60, coinReward: 9,
    }),
    wc({
      id: 'web-15-average-lap', objectiveId: 'js-obj-loops-accumulate', title: 'Average Lap Time', mode: 'challenge', skillIds: ['js.basics'], concepts: ['for loop', 'array', 'counter', 'return'], difficulty: 2, context: 'motorsport',
      prompt: text('Write a function `averageLap(laps)` returning the average of a list of lap times in seconds, **rounded to 3 decimal places**. If the list is empty, return `null`.'),
      expectedBehavior: 'averageLap([80, 82, 81]) returns 81.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['An average needs a total and a count.', 'What should happen when there is nothing to average?', 'Round with `Math.round(x * 1000) / 1000`.'],
      checks: jsCalls('averageLap', '(l) => l.length === 0 ? null : Math.round(l.reduce((a, b) => a + b, 0) / l.length * 1000) / 1000', ['[80, 82, 81]', '[]', '[81.234]', '[80.1, 80.2, 80.4]', '[90, 91, 92, 93.5]', '[1, 2]'], { pure: true, visibleFirst: true }),
      xpReward: 60, coinReward: 9,
    }),
    wc({
      id: 'web-15-win-streak', objectiveId: 'js-obj-loops-accumulate', title: 'The Longest Win Streak', mode: 'challenge', skillIds: ['js.basics'], concepts: ['for loop', 'array', 'counter', 'return'], difficulty: 2, context: 'sports',
      prompt: text('A team’s results are a list of `"W"`, `"L"` and `"D"`. Write a function `longestStreak(results)` returning the length of the longest run of consecutive `"W"`. An empty list gives 0.'),
      expectedBehavior: 'longestStreak(["W","W","L","W","W","W","D"]) returns 3.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Two counters: the current run and the best so far.', 'What happens to the current run when the result is not a win?', 'Reset the current run to 0 on anything else; keep the maximum.'],
      checks: jsCalls('longestStreak', '(r) => { let best = 0, cur = 0; for (const x of r) { cur = x === "W" ? cur + 1 : 0; if (cur > best) best = cur; } return best; }', ['["W","W","L","W","W","W","D"]', '[]', '["L","L"]', '["W"]', '["W","W","W"]', '["W","D","W","W"]', '["L","W","W","L","W"]'], { pure: true, visibleFirst: true }),
      xpReward: 60, coinReward: 9,
    }),
  ],
};
