import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

const T = (name: string, script: string, visible = false) => web(name, script, { visible });

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-27-closures', title: 'Functions That Remember', language: 'web', skillId: 'js.closures',
    blurb: 'A function can carry private state with it. Build counters, limiters and generators with no global variables.', prerequisites: ['web-17-js-errors'], xpReward: 70,
    reference: {
      title: 'Scope and closures',
      body: text(
        '**Scope** decides where a name can be seen. Variables declared with `let`/`const` inside a function exist only there. A **closure** is a function that keeps access to the variables of the place where it was **created**, even after that place has finished: `function makeCounter() { let n = 0; return () => ++n; }` returns a function that owns its own `n`.',
        'Each call to the outer function makes a **new, separate** set of variables, so `const a = makeCounter(); const b = makeCounter();` give two independent counters. Because `n` is not global, no other code can change it by accident: that is *private state*. A global variable, by contrast, is shared by everyone and is the usual cause of "it works alone but breaks when I use it twice".',
        'Use closures to build **factories** (functions that make configured functions), counters, limiters, caches and event handlers that remember something. Watch for the classic loop bug: `var` in a loop shares one variable, `let` gives each iteration its own.',
      ),
      example: 'function makeCounter(step) {\n  let n = 0;\n  return function () {\n    n += step;\n    return n;\n  };\n}\nconst a = makeCounter(2);\na(); a();   // 2, then 4',
    },
    steps: [
      { kind: 'teach', title: 'Where does a variable live?', body: text('Every function call creates a fresh room for its variables, and normally the room is demolished when the call ends. But if the function **returns another function** that uses those variables, the room stays open for as long as that inner function exists. That surviving room is a **closure**.', 'Once you see it, a whole family of problems becomes easy: anything that must *remember something between calls* without using a global.') },
      webDemo({
        title: 'Two counters, two rooms',
        body: text('Run it and read the console. Then change the second counter’s step and predict the output again.'),
        files: files('', '', 'function makeCounter(step) {\n  let n = 0;\n  return function () {\n    n += step;\n    return n;\n  };\n}\n\nconst a = makeCounter(1);\nconst b = makeCounter(10);\nconsole.log(a(), a(), b(), a(), b());'),
        notice: '`a` and `b` each have their own `n`: `a` counts 1, 2, 3 while `b` counts 10, 20. Nothing outside can reach `n`, yet every call remembers it.',
      }),
      { kind: 'challenge', challengeId: 'web-27-make-counter' },
      { kind: 'challenge', challengeId: 'web-27-make-limiter' },
    ],
  },
  objectives: [
    { id: 'js-obj-closure-state', title: 'Keep private state in a returned function', summary: 'Write a factory whose returned function remembers state between calls, independently for each instance and without globals.' },
  ],
  challenges: [
    wc({
      id: 'web-27-make-counter', title: 'A Counter With a Step', mode: 'learning', skillIds: ['js.closures', 'js.basics'], concepts: ['closure', 'factory', 'private-state'], difficulty: 3, context: 'software',
      prompt: text('Write `makeCounter(step)` that returns a function. Each call of the returned function adds `step` to a running total and returns it, starting from 0, so `makeCounter(5)` gives 5, then 10, then 15. If `step` is left out it counts by 1. Every counter must be **independent**: making a second counter never affects the first.'),
      expectedBehavior: 'The returned function counts by its own step; separate counters do not interfere.',
      guidedSteps: ['Declare the running total *inside* `makeCounter`, before the `return`.', 'Return a function that adds `step` to the total and returns it.', 'Give `step` a default of 1 in the parameter list.'],
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Where should the running total live so that it is remembered between calls but not shared between counters?', 'Which function should create the variable, and which should change it?', 'A default parameter value: `function makeCounter(step = 1)`.'],
      checks: [
        T('Counting', "const c = makeCounter(5); h.eq([c(), c(), c()], [5, 10, 15], 'A counter with step 5');", true),
        T('Independent counters', "const a = makeCounter(1); const b = makeCounter(10); h.eq([a(), b(), a(), b(), a()], [1, 10, 2, 20, 3], 'Two counters must not share their totals');"),
        T('The default step and other steps', "const d = makeCounter(); h.eq([d(), d()], [1, 2], 'No step means 1'); const n = makeCounter(-2); h.eq([n(), n()], [-2, -4]); const z = makeCounter(0); h.eq([z(), z()], [0, 0]); const f = makeCounter(0.5); h.eq([f(), f(), f()], [0.5, 1, 1.5]);"),
        T('No global leaks', "const before = Object.keys(window).length; const c = makeCounter(3); c(); c(); h.eq(Object.keys(window).length, before, 'The counter must not create global variables'); const other = makeCounter(3); h.eq(other(), 3, 'A new counter starts from zero');"),
      ],
      xpReward: 70, coinReward: 10,
    }),
    wc({
      id: 'web-27-make-limiter', objectiveId: 'js-obj-closure-state', title: 'A Login Attempt Limiter', mode: 'challenge', skillIds: ['js.closures', 'js.basics'], concepts: ['closure', 'factory', 'private-state'], difficulty: 3, context: 'security',
      prompt: text('A login page allows only a few attempts. Write `makeLimiter(max)` that returns a function. The first `max` calls of the returned function return `true` (attempt allowed); every call after that returns `false`. A limiter with `max` of 0 (or less) never allows anything. Each limiter counts on its own.'),
      expectedBehavior: 'The first max calls give true, later calls give false; limiters are independent.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['What has to be remembered between calls, and who should own it?', 'Two limiters must not count each other’s attempts.', 'Decide the comparison carefully: with max 2, the third call is the first refusal.'],
      checks: [
        T('The first calls are allowed', "const l = makeLimiter(3); h.eq([l(), l(), l(), l(), l()], [true, true, true, false, false], 'max is 3', );", true),
        T('Independent limiters', "const a = makeLimiter(1); const b = makeLimiter(2); h.eq([a(), b(), a(), b(), b(), a()], [true, true, false, true, false, false]);"),
        T('Zero and negative limits', "const z = makeLimiter(0); h.eq([z(), z()], [false, false]); const n = makeLimiter(-3); h.eq(n(), false); const o = makeLimiter(1); h.eq([o(), o(), o()], [true, false, false]);"),
        T('No global leaks', "const before = Object.keys(window).length; const l = makeLimiter(2); l(); l(); l(); h.eq(Object.keys(window).length, before, 'Do not use global variables');"),
      ],
      xpReward: 100, coinReward: 15,
    }),
    wc({
      id: 'web-27-ticket-dispenser', objectiveId: 'js-obj-closure-state', title: 'A Ticket Number Dispenser', mode: 'challenge', skillIds: ['js.closures', 'js.basics'], concepts: ['closure', 'factory', 'private-state'], difficulty: 3, context: 'events',
      prompt: text('Each box office numbers its tickets. Write `makeDispenser(prefix)` that returns a function; each call returns the next ticket number as text: the prefix, a dash, then the count starting at 1 **padded to at least three digits**. So `makeDispenser("VIP")` gives `"VIP-001"`, `"VIP-002"`, … and after `"VIP-999"` comes `"VIP-1000"`. Each dispenser counts on its own.'),
      expectedBehavior: 'Numbered ticket text; dispensers are independent.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['What has to be remembered between calls, and who should own it?', 'Two dispensers must not share their count.', 'Look for a string method that pads a number with zeros on the left.'],
      checks: [
        T('Numbering', "const d = makeDispenser('VIP'); h.eq([d(), d(), d()], ['VIP-001', 'VIP-002', 'VIP-003'], 'Tickets from one dispenser', );", true),
        T('Independent dispensers', "const a = makeDispenser('A'); const b = makeDispenser('B'); h.eq([a(), b(), a(), b(), a()], ['A-001', 'B-001', 'A-002', 'B-002', 'A-003']);"),
        T('Padding and growth', "const d = makeDispenser('X'); let last; for (let i = 0; i < 999; i++) last = d(); h.eq(last, 'X-999'); h.eq(d(), 'X-1000'); h.eq(d(), 'X-1001');"),
        T('An empty prefix and no globals', "const before = Object.keys(window).length; const d = makeDispenser(''); h.eq(d(), '-001'); h.eq(Object.keys(window).length, before, 'Do not use global variables');"),
      ],
      xpReward: 100, coinReward: 15,
    }),
  ],
};
