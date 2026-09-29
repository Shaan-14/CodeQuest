import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-11-for-range', title: 'Counting Loops', language: 'python', skillId: 'py.loops',
    blurb: 'for loops and range(): repeating a known number of times.', prerequisites: ['py-10-while'], xpReward: 30,
    reference: {
      title: 'for and range()',
      body: text(
        '`for i in range(5):` runs the block 5 times with `i` = 0, 1, 2, 3, 4. `range(a, b)` counts from `a` up to but **not including** `b`. `range(a, b, step)` counts in steps.',
        'Use `for` when you know how many times (or over which values) to repeat; use `while` when you repeat until something happens.',
      ),
      example: 'for i in range(1, 4):\n    print(i)   # 1 2 3',
    },
    steps: [
      {
        kind: 'teach', title: 'A loop that counts for you',
        body: text(
          'A `while` loop needs you to manage the counter yourself. When you know how many times to repeat, a **`for` loop** does the counting for you. `range(n)` produces the numbers 0 up to (but **not including**) n.',
          '`range(1, 6)` gives 1, 2, 3, 4, 5: it starts at 1 and stops *before* 6. Getting the end wrong by one is one of the most common bugs in all of programming, so look carefully at your output.',
        ),
      },
      {
        kind: 'demo', title: 'Three ranges',
        body: text('Run it, then edit the numbers and predict the results before running again.'),
        code: 'for i in range(3):\n    print("range(3):", i)\nfor i in range(1, 4):\n    print("range(1, 4):", i)\nfor i in range(0, 10, 5):\n    print("range(0, 10, 5):", i)',
        notice: '`range(3)` started at 0 and stopped before 3. `range(1, 4)` started at 1 and stopped before 4. The third counted in steps of 5.',
      },
      { kind: 'challenge', challengeId: 'py-11-sensor-sweep' },
      { kind: 'challenge', challengeId: 'py-11-average' },
    ],
  },
  challenges: [
    {
      id: 'py-11-sensor-sweep', title: 'Sensor Sweep', mode: 'learning', language: 'python', skillIds: ['py.loops'], concepts: ['for', 'range', 'loop variable'], difficulty: 1, context: 'engineering',
      prompt: text('Bolt has five sensors, numbered 1 to 5. Use a `for` loop with `range` to print:', '`Sensor 1 OK`\n`Sensor 2 OK`\n...\n`Sensor 5 OK`'),
      expectedBehavior: 'Five lines, Sensor 1 OK through Sensor 5 OK.',
      guidedSteps: ['Loop with `for n in range(...)`.', 'Choose the start and end so the numbers are 1 to 5.', 'Print using the loop variable `n`.'],
      starterCode: '# One for loop, please\n',
      hints: ['The loop variable takes each value in the range; use it inside the print.', 'range stops *before* its end number. To include 5, what should the end be?', 'Start at 1 and end at 6: `range(1, 6)`. Then use an f-string or commas to add the number.'],
      checks: [{ kind: 'output', name: 'Five sensor lines', expect: 'Sensor 1 OK\nSensor 2 OK\nSensor 3 OK\nSensor 4 OK\nSensor 5 OK' }],
      constraints: [
        { type: 'requires', node: 'For', message: 'Use a for loop.' },
        { type: 'requires', node: 'call:range', message: 'Use range() to make the numbers.' },
      ],
      xpReward: 35, coinReward: 5,
    },
    {
      id: 'py-11-average', objectiveId: 'py-obj-for-average', title: 'Average Reading', mode: 'challenge', language: 'python', skillIds: ['py.loops', 'py.input', 'py.numbers'], concepts: ['for', 'accumulator', 'average', 'float'], difficulty: 3, context: 'data analysis',
      prompt: text('A sensor sends five readings, one per line. Read all five and print their average like this:', '`Average: 30.0`', '(for readings 10, 20, 30, 40, 50). Readings are whole numbers.'),
      expectedBehavior: 'Reads exactly five numbers and prints their average.',
      sampleInput: ['10', '20', '30', '40', '50'],
      starterCode: '',
      hints: ['An average is the total divided by the count. What do you need to keep track of while reading?', 'Keep a running total that starts at zero and grows by each reading.', 'Loop 5 times, reading one number each time and adding it to the total. Divide once after the loop.'],
      checks: [
        { kind: 'output', name: '10..50', stdin: ['10', '20', '30', '40', '50'], expect: 'Average: 30.0' },
        { kind: 'output', name: '2,4,6,8,10', stdin: ['2', '4', '6', '8', '10'], expect: 'Average: 6.0', visible: false },
        { kind: 'output', name: 'Uneven', stdin: ['1', '2', '3', '4', '6'], expect: 'Average: 3.2', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'For', message: 'Use a for loop, since you know there are five readings.' }],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-11-daily-output', objectiveId: 'py-obj-for-average', title: 'Average Daily Output', mode: 'challenge', language: 'python', skillIds: ['py.loops', 'py.input', 'py.numbers'], concepts: ['for', 'accumulator', 'average', 'float'], difficulty: 3, context: 'manufacturing',
      prompt: text('A line supervisor enters the number of units built on each of the last `4` days, one per line. Read all four and print the average like this:', '`Average: 12.5`', '(for 10, 12, 13, 15). Counts are whole numbers.'),
      expectedBehavior: 'Reads exactly four numbers and prints their average.',
      sampleInput: ['10', '12', '13', '15'],
      starterCode: '',
      hints: ['An average is the total divided by the count. What do you need to keep track of while reading?', 'Keep a running total that starts at zero and grows by each value.', 'Loop 4 times, reading one number each time and adding it to the total. Divide once after the loop.'],
      checks: [
        { kind: 'output', name: '10,12,13,15', stdin: ['10', '12', '13', '15'], expect: 'Average: 12.5' },
        { kind: 'output', name: '4,4,4,4', stdin: ['4', '4', '4', '4'], expect: 'Average: 4.0', visible: false },
        { kind: 'output', name: '0,0,0,1', stdin: ['0', '0', '0', '1'], expect: 'Average: 0.25', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'For', message: 'Use a for loop, since you know there are four values.' }],
      xpReward: 65, coinReward: 10,
    },
  ],
  objectives: [
    { id: 'py-obj-for-average', title: 'Read several values and average them', summary: 'Use a for loop to read a known number of values, accumulate them, and divide.' },
  ],
};
