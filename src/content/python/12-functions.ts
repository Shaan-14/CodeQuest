import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-12-functions', title: 'Reusable Spells', language: 'python', skillId: 'py.functions',
    blurb: 'Functions: naming a routine so it can be reused.', prerequisites: ['py-11-for-range'], xpReward: 35,
    reference: {
      title: 'Functions',
      body: text(
        '`def name(parameter):` defines a function. The indented block is its body. `return value` sends a result back to whoever called it. Calling `name(5)` runs the body with `parameter = 5`.',
        '`print` **shows** a value; `return` **hands it back** so other code can use it. A function without `return` gives back `None`.',
      ),
      example: 'def double(x):\n    return x * 2\n\nprint(double(4))  # 8',
    },
    steps: [
      {
        kind: 'teach', title: 'Named, reusable routines',
        body: text(
          'You have already used functions: `print`, `input`, `int`, `range`. A **function** is a named block of code you can run whenever you want. You can write your own with `def`.',
          'Functions take **parameters** (inputs) in the parentheses and can `return` a result. Writing `def` only *defines* the function. Nothing happens until you **call** it by name with parentheses.',
          'Be careful with the difference between `print` and `return`. `print` shows something on screen. `return` gives the value back to the code that called the function, so it can be stored or used in more calculations.',
        ),
      },
      {
        kind: 'demo', title: 'Define, then call',
        body: text('Run it. Then add another call such as `print(double(21))` and run again.'),
        code: 'def double(x):\n    return x * 2\n\nprint(double(4))\nresult = double(10) + 1\nprint(result)',
        notice: 'The function was written once and used twice. Because it *returned* a value, `double(10) + 1` worked: the returned 20 was used in a further calculation.',
      },
      { kind: 'challenge', challengeId: 'py-12-double' },
      { kind: 'challenge', challengeId: 'py-12-announce' },
      { kind: 'challenge', challengeId: 'py-12-discount' },
    ],
  },
  challenges: [
    {
      id: 'py-12-double', title: 'Double It', mode: 'learning', language: 'python', skillIds: ['py.functions'], concepts: ['def', 'parameter', 'return'], difficulty: 1, context: 'general',
      prompt: text('Bolt’s power cell doubles any charge you feed it. Write a function called `double` that takes a number and **returns** twice that number.'),
      expectedBehavior: 'double(4) returns 8; double(-3) returns -6; double(0) returns 0.',
      guidedSteps: ['Start with `def double(x):`.', 'Indent the next line and `return` twice `x`.'],
      starterCode: '# Define the function\n',
      hints: ['`def` starts a function; the name you choose must be exactly `double`.', 'Inside the function, `return` sends a value back to the caller.', 'The function takes one parameter and returns that parameter multiplied by 2.'],
      checks: [
        { kind: 'call', name: 'double(4)', fn: 'double', args: [4], expect: 8 },
        { kind: 'call', name: 'double(-3)', fn: 'double', args: [-3], expect: -6, visible: false },
        { kind: 'call', name: 'double(0)', fn: 'double', args: [0], expect: 0, visible: false },
        { kind: 'call', name: 'double(2.5)', fn: 'double', args: [2.5], expect: 5, visible: false },
      ],
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the function with def.' }],
      xpReward: 35, coinReward: 5,
    },
    {
      id: 'py-12-announce', title: 'Roll Call', mode: 'challenge', language: 'python', skillIds: ['py.functions', 'py.strings'], concepts: ['def', 'print vs return', 'f-string'], difficulty: 2, context: 'general',
      prompt: text('Write a function `announce(name)` that **prints** (does not return) the line `Unit <name> reporting`, for example `Unit BOLT-7 reporting`.'),
      expectedBehavior: 'announce("BOLT-7") prints: Unit BOLT-7 reporting',
      starterCode: '',
      hints: ['This function’s job is to show something, not to hand something back.', 'Put a `print` inside the function body.', 'Build the text from the parameter, with `+` or an f-string.'],
      checks: [
        { kind: 'call', name: 'announce("BOLT-7")', fn: 'announce', args: ['BOLT-7'], expectStdout: 'Unit BOLT-7 reporting' },
        { kind: 'call', name: 'another name', fn: 'announce', args: ['Ada'], expectStdout: 'Unit Ada reporting', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the function with def.' }],
      xpReward: 45, coinReward: 8,
    },
    {
      id: 'py-12-discount', title: 'Bulk Discount', mode: 'challenge', language: 'python', skillIds: ['py.functions', 'py.conditionals', 'py.numbers'], concepts: ['def', 'return', 'if', 'parameters'], difficulty: 3, context: 'business',
      prompt: text('Write a function `total_price(unit_price, quantity)` that returns the total cost. Orders of `10` or more items get `10%` off the whole total. Smaller orders pay full price.', 'It must *return* the total (a number), so other code can use it.'),
      expectedBehavior: 'total_price(5, 4) -> 20; total_price(5, 10) -> 45.0; total_price(2.5, 20) -> 45.0',
      starterCode: '',
      hints: ['Two inputs, one result. Decide first what the full price is.', 'The discount only applies under a condition on `quantity`.', 'Compute the full price, then either return it or return 90% of it, depending on the quantity.'],
      checks: [
        { kind: 'call', name: 'total_price(5, 4)', fn: 'total_price', args: [5, 4], expect: 20, approx: 1e-9 },
        { kind: 'call', name: 'total_price(5, 10)', fn: 'total_price', args: [5, 10], expect: 45, approx: 1e-9 },
        { kind: 'call', name: 'just below threshold', fn: 'total_price', args: [3, 9], expect: 27, approx: 1e-9, visible: false, feedback: 'Does 9 items qualify?' },
        { kind: 'call', name: 'decimal price', fn: 'total_price', args: [2.5, 20], expect: 45, approx: 1e-9, visible: false },
      ],
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define the function with def.' }],
      xpReward: 60, coinReward: 10,
    },
  ],
};
