import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-09-elif', title: 'Many Paths', language: 'python', skillId: 'py.conditionals',
    blurb: 'Chaining decisions with elif; why order matters.', prerequisites: ['py-08-if-else'], xpReward: 25,
    reference: {
      title: 'elif chains',
      body: text(
        'Use `elif` (“else if”) for more than two outcomes. Python tests the conditions **top to bottom** and runs only the **first** one that is True; the rest are skipped.',
        'That makes order important: put the most specific condition first.',
      ),
      example: 'if n >= 90:\n    print("A")\nelif n >= 80:\n    print("B")\nelse:\n    print("C or below")',
    },
    steps: [
      {
        kind: 'teach', title: 'More than two outcomes',
        body: text(
          'Sometimes two branches are not enough. `elif` lets you add as many extra conditions as you like between `if` and `else`.',
          'Python checks them from the top and stops at the **first** one that is true. That means **order matters**: a condition that is too broad, placed first, will grab cases that should have gone to a later, more specific branch.',
        ),
      },
      {
        kind: 'demo', title: 'A chain',
        body: text('Input is `100`. Run it, then try `0` and `50`. Which branch runs for each?'),
        code: 'temp = int(input("Temperature C: "))\nif temp <= 0:\n    print("Ice")\nelif temp < 100:\n    print("Liquid water")\nelse:\n    print("Steam")',
        stdin: ['100'],
        notice: 'Only one branch runs each time. At exactly 100 the second condition (`temp < 100`) is False, so it falls through to `else`.',
      },
      { kind: 'challenge', challengeId: 'py-09-speed-zone' },
      { kind: 'challenge', challengeId: 'py-09-fizzbuzz' },
    ],
  },
  challenges: [
    {
      id: 'py-09-speed-zone', title: 'Bolt’s Speed Zones', mode: 'learning', language: 'python', skillIds: ['py.conditionals', 'py.input'], concepts: ['elif', 'ranges'], difficulty: 2, context: 'engineering',
      prompt: text('Bolt has three speed modes. Read his speed (a whole number) and print:', '`Stopped` if the speed is 0\n`Walking` if it is 1 to 5\n`Running` if it is above 5'),
      expectedBehavior: '0 -> Stopped; 3 -> Walking; 5 -> Walking; 6 -> Running',
      guidedSteps: ['Start with the `if` for speed 0.', 'Add `elif` for speeds up to 5.', 'Finish with `else` for everything faster.'],
      sampleInput: ['3'],
      starterCode: 'speed = int(input())\n# Your decisions go here\n',
      hints: ['Three outcomes means one `if`, one `elif`, and one `else`.', 'Because branches are tested top to bottom, the `elif` only sees values that were not 0.', 'Think about where 5 belongs and use `<=` or `<` accordingly.'],
      checks: [
        { kind: 'output', name: 'Speed 0', stdin: ['0'], expect: 'Stopped' },
        { kind: 'output', name: 'Speed 3', stdin: ['3'], expect: 'Walking' },
        { kind: 'output', name: 'Speed 5', stdin: ['5'], expect: 'Walking', visible: false },
        { kind: 'output', name: 'Speed 6', stdin: ['6'], expect: 'Running', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'If', message: 'Use if/elif/else to decide.' }],
      xpReward: 40, coinReward: 6,
    },
    {
      id: 'py-09-fizzbuzz', title: 'Fizz, Buzz, or Neither', mode: 'challenge', language: 'python', skillIds: ['py.conditionals', 'py.numbers', 'py.input'], concepts: ['elif', 'modulo', 'order of conditions'], difficulty: 3, context: 'games',
      prompt: text('A classic programming interview puzzle, dressed as a party game. Read a whole number. Then print:', '`FizzBuzz` if it is divisible by both 3 and 5\n`Fizz` if divisible by 3 only\n`Buzz` if divisible by 5 only\notherwise print the number itself.', '(15 -> FizzBuzz, 9 -> Fizz, 10 -> Buzz, 7 -> 7)'),
      expectedBehavior: 'One line of output following the rules for any whole number.',
      sampleInput: ['15'],
      starterCode: '',
      hints: ['“Divisible by” is a job for the remainder operator.', 'A number can satisfy several rules at once; which check should come first so it is not swallowed by a broader one?', 'Check the most specific case (both) before the single cases.'],
      checks: [
        { kind: 'output', name: '15', stdin: ['15'], expect: 'FizzBuzz' },
        { kind: 'output', name: '9', stdin: ['9'], expect: 'Fizz' },
        { kind: 'output', name: '10', stdin: ['10'], expect: 'Buzz' },
        { kind: 'output', name: '7', stdin: ['7'], expect: '7' },
        { kind: 'output', name: '30', stdin: ['30'], expect: 'FizzBuzz', visible: false, feedback: 'A number can match more than one rule. Which rule should win?' },
        { kind: 'output', name: '1', stdin: ['1'], expect: '1', visible: false },
      ],
      xpReward: 60, coinReward: 10,
    },
  ],
};
