import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-03-variables', title: 'Robot Memory', language: 'python', skillId: 'py.variables',
    blurb: 'Variables: giving names to values so a program can remember.', prerequisites: ['py-02-fixing-errors'], xpReward: 25,
    reference: {
      title: 'Variables',
      body: text(
        'A variable is a name attached to a value: `battery = 80`. The `=` means **store**, not “equals”: the value on the right is stored under the name on the left.',
        'Use a variable’s name without quotes to use its value: `print(battery)`. Assigning again replaces the old value. `print("Battery:", battery)` prints several things separated by spaces.',
      ),
      example: 'battery = 80\nprint("Battery:", battery)\nbattery = 65\nprint("Battery:", battery)',
    },
    steps: [
      {
        kind: 'teach', title: 'Memory',
        body: text(
          'So far every value was typed straight into `print`. Real programs need to **remember** things: a battery level, a score, a customer’s name. That is what a **variable** is: a name attached to a value.',
          'Writing `battery = 80` stores the value 80 under the name `battery`. The `=` here does **not** mean “equals” like in maths. It means “store this”.',
        ),
      },
      {
        kind: 'demo', title: 'Store, use, replace',
        body: text('Notice `battery` has **no quotes** when we print it. With quotes it would be the *text* “battery”. Without, Python looks up the value.', 'Also notice `print` can take several things separated by commas.'),
        code: 'battery = 80\nprint(battery)\nprint("Battery:", battery)\nbattery = 65\nprint("Battery:", battery)',
        notice: 'The second assignment replaced the 80. A variable holds one value at a time, and the program reads top to bottom, so the latest assignment wins.',
      },
      { kind: 'challenge', challengeId: 'py-03-charge-level' },
      { kind: 'challenge', challengeId: 'py-03-overheating' },
    ],
  },
  challenges: [
    {
      id: 'py-03-charge-level', title: 'Charge Level', mode: 'learning', language: 'python', skillIds: ['py.variables'], concepts: ['variable', 'assignment'], difficulty: 1, context: 'engineering',
      prompt: text('Bolt needs to remember his battery level. Create a variable named `battery` that stores the number `80`, then print it.'),
      expectedBehavior: 'The variable `battery` holds 80, and the console shows 80.',
      guidedSteps: ['Write `battery = 80` to create the variable.', 'Print the variable with `print(battery)` (no quotes!).', 'Run it.'],
      starterCode: '# Create the variable, then print it\n',
      hints: ['A variable is created by writing its name, `=`, then the value.', 'To show a variable’s value, put its name inside `print()` without quotation marks.', 'Two lines: one that stores 80 under the name `battery`, one that prints `battery`.'],
      checks: [
        { kind: 'variable', name: 'Variable battery holds 80', variable: 'battery', expect: 80, feedback: 'Is your variable named exactly `battery`, and does it hold the number 80?' },
        { kind: 'output', name: 'The value is printed', expect: '80', feedback: 'Print the variable’s value. Without quotes, `battery` means the stored value.' },
      ],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'py-03-overheating', title: 'Overheating', mode: 'challenge', language: 'python', skillIds: ['py.variables', 'py.output'], concepts: ['variable', 'reassignment', 'print with commas'], difficulty: 2, context: 'engineering',
      prompt: text(
        'Bolt’s temperature sensor reads `20` when he starts. After a hard workout it reads `95`.',
        'Write a program that stores 20 in a variable called `temperature`, prints `Temperature: 20`, then updates the variable to 95 and prints `Temperature: 95`.',
      ),
      expectedBehavior: 'Two lines: `Temperature: 20` then `Temperature: 95`. At the end, `temperature` holds 95.',
      starterCode: '',
      hints: ['You can print text and a variable together by separating them with a comma.', 'Assigning to an existing variable replaces its value.', 'Create it, print with a comma, assign again, print again.'],
      checks: [
        { kind: 'output', name: 'Both readings are printed', expect: 'Temperature: 20\nTemperature: 95' },
        { kind: 'variable', name: 'Variable holds the final value', variable: 'temperature', expect: 95, feedback: 'After your program finishes, `temperature` should hold the newer value.' },
      ],
      xpReward: 45, coinReward: 8,
    },
  ],
};
