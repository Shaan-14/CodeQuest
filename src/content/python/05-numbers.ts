import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-05-numbers', title: 'The Robot’s Calculator', language: 'python', skillId: 'py.numbers',
    blurb: 'Integers, floats, and arithmetic operators.', prerequisites: ['py-04-strings'], xpReward: 25,
    reference: {
      title: 'Numbers and operators',
      body: text(
        '`int` is a whole number (`7`); `float` has a decimal point (`7.0`). `type(x)` tells you which.',
        '`+ - *` work as expected. `/` always gives a float. `//` divides and drops the remainder. `%` gives the remainder. `**` is a power. Python follows normal order of operations; use parentheses to be clear.',
      ),
      example: 'print(7 / 2)   # 3.5\nprint(7 // 2)  # 3\nprint(7 % 2)   # 1\nprint(2 ** 3)  # 8',
    },
    steps: [
      {
        kind: 'teach', title: 'Two kinds of numbers',
        body: text(
          'Python has two main kinds of numbers. An **integer** (`int`) is a whole number like `7`. A **float** is a number with a decimal point like `7.5`. They behave a little differently, so it helps to notice which one you have.',
          'Python’s **operators** do the arithmetic: `+` add, `-` subtract, `*` multiply, `/` divide. There are also three extra ones that engineers and programmers use constantly: `//` (whole-number division), `%` (the remainder) and `**` (power).',
        ),
      },
      {
        kind: 'demo', title: 'Try every operator',
        body: text('Before you run it, guess what `7 // 2` and `7 % 2` will print. Then run it and check your guess.'),
        code: 'print(7 + 3)\nprint(7 / 2)\nprint(7 // 2)\nprint(7 % 2)\nprint(2 ** 3)\nprint(type(7), type(7.0))',
        notice: '`7 / 2` gave 3.5 (a float) but `7 // 2` gave 3: division that keeps only the whole part. `7 % 2` is the leftover 1. Together, `//` and `%` answer “how many full groups, and what is left over?”.',
      },
      { kind: 'challenge', challengeId: 'py-05-power-draw' },
      { kind: 'challenge', challengeId: 'py-05-crates' },
      { kind: 'challenge', challengeId: 'py-05-savings' },
    ],
  },
  challenges: [
    {
      id: 'py-05-power-draw', title: 'Power Draw', mode: 'learning', language: 'python', skillIds: ['py.numbers', 'py.variables'], concepts: ['multiplication', 'float'], difficulty: 1, context: 'engineering',
      prompt: text('Electrical power is voltage multiplied by current. Bolt runs on `12` volts and draws `2.5` amps.', 'Store those in variables `voltage` and `current`, calculate `power`, and print it.'),
      expectedBehavior: 'The console shows `30.0`, and `power` holds 30.0.',
      guidedSteps: ['Create `voltage = 12` and `current = 2.5`.', 'Create `power` by multiplying them with `*`.', 'Print `power`.'],
      starterCode: '# voltage, current, power\n',
      hints: ['`*` multiplies two values, including variables.', 'You can write `power = voltage * current` once both variables exist.', 'Order matters: create voltage and current on earlier lines than the line that uses them.'],
      checks: [
        { kind: 'variable', name: 'power is calculated', variable: 'power', expect: 30, approx: 1e-9 },
        { kind: 'output', name: 'power is printed', expect: '30.0' },
      ],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'py-05-crates', objectiveId: 'py-obj-divmod', title: 'Packing Crates', mode: 'challenge', language: 'python', skillIds: ['py.numbers', 'py.strings'], concepts: ['floor division', 'modulo'], difficulty: 2, context: 'manufacturing',
      prompt: text('A factory produces `47` bolts. Each shipping crate holds `12`. Print how many crates are completely full and how many bolts are left over, in exactly this format:', '`Full crates: 3`\n`Leftover bolts: 11`', 'Work the numbers out with Python, not in your head.'),
      expectedBehavior: 'Two lines in the format shown, for 47 bolts and crates of 12.',
      starterCode: 'bolts = 47\ncrate_size = 12\n',
      hints: ['Two questions: “how many whole groups?” and “what is left?”. Python has one operator for each.', 'The whole-number division operator drops the remainder; another operator returns only the remainder.', 'One uses `//` and the other `%`. Use them with the variables, and build each output line with a comma or f-string.'],
      checks: [{ kind: 'output', name: 'Correct crate counts', expect: 'Full crates: 3\nLeftover bolts: 11' }],
      xpReward: 45, coinReward: 8,
    },
    {
      id: 'py-05-savings', title: 'Three Years of Interest', mode: 'challenge', language: 'python', skillIds: ['py.numbers', 'py.variables'], concepts: ['exponent', 'order of operations', 'float'], difficulty: 3, context: 'finance',
      prompt: text('A savings account starts with `2000` coins and grows by 5% a year, compounding (each year’s interest is added before the next year is calculated).', 'Calculate the balance after 3 years and store it in `total`. Then print it.'),
      expectedBehavior: '`total` is about 2315.25 and is printed.',
      starterCode: 'start = 2000\nrate = 0.05\nyears = 3\n',
      hints: ['Each year multiplies the balance by the same growth factor.', 'The growth factor for 5% is 1 plus the rate. Three years means multiplying by it three times.', 'A repeated multiplication is exactly what the power operator does.'],
      checks: [
        { kind: 'variable', name: 'total is about right', variable: 'total', expect: 2315.25, approx: 0.01, feedback: 'Compounding means the factor is applied once for every year.' },
      ],
      xpReward: 60, coinReward: 10,
    },
    {
      id: 'py-05-pallets', objectiveId: 'py-obj-divmod', title: 'Loading Pallets', mode: 'challenge', language: 'python', skillIds: ['py.numbers', 'py.strings'], concepts: ['floor division', 'modulo'], difficulty: 2, context: 'logistics',
      prompt: text('A warehouse has `130` cartons to ship. One pallet holds `24` cartons. Print how many pallets are completely full and how many loose cartons remain, in exactly this format:', '`Full pallets: 5`\n`Loose cartons: 10`', 'Let Python do the arithmetic.'),
      expectedBehavior: 'Two lines in the format shown, for 130 cartons and pallets of 24.',
      starterCode: 'cartons = 130\npallet_size = 24\n',
      hints: ['Two questions: “how many whole groups?” and “what is left over?”. Python has an operator for each.', 'One operator divides and drops the remainder; another returns only the remainder.', 'Use `//` and `%` with the variables, then print each result with its label.'],
      checks: [{ kind: 'output', name: 'Correct pallet counts', expect: 'Full pallets: 5\nLoose cartons: 10' }],
      xpReward: 45, coinReward: 8,
    },
  ],
  objectives: [
    { id: 'py-obj-divmod', title: 'Whole groups and leftovers', summary: 'Use floor division and remainder to split a quantity into full groups and what is left.' },
  ],
};
