import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-10-while', title: 'Repeat Until Done', language: 'python', skillId: 'py.loops',
    blurb: 'while loops: repeating work until a condition changes.', prerequisites: ['py-09-elif'], xpReward: 30,
    reference: {
      title: 'while loops',
      body: text(
        '`while condition:` repeats its indented block as long as the condition is True. Something inside the loop must eventually make the condition False, otherwise it runs forever.',
        'The usual pattern: set up a variable before the loop, test it in the condition, change it inside the loop.',
      ),
      example: 'count = 3\nwhile count > 0:\n    print(count)\n    count = count - 1',
    },
    steps: [
      {
        kind: 'teach', title: 'Doing something again',
        body: text(
          'Computers are great at repetition. A `while` loop keeps running its indented block **as long as** its condition is `True`. Every time the block finishes, Python checks the condition again.',
          'Danger: if nothing inside the loop ever makes the condition `False`, the loop never ends. Programmers call it an **infinite loop**. CodeQuest will stop your program after a few seconds if that happens; a real computer would not.',
        ),
      },
      {
        kind: 'demo', title: 'A countdown',
        body: text('Follow the variable `count` as the loop runs. It is set up before the loop, tested by the loop, and changed inside it. All three parts are needed.'),
        code: 'count = 3\nwhile count > 0:\n    print(count)\n    count = count - 1\nprint("Done!")',
        notice: 'Each pass through the loop printed the current value, then lowered it by one. When `count` reached 0, the condition became False and the loop stopped. Delete the line `count = count - 1` and run it to see what happens.',
      },
      { kind: 'challenge', challengeId: 'py-10-countdown' },
      { kind: 'challenge', challengeId: 'py-10-savings-goal' },
      { kind: 'challenge', challengeId: 'py-10-password' },
    ],
  },
  challenges: [
    {
      id: 'py-10-countdown', title: 'Launch Countdown', mode: 'learning', language: 'python', skillIds: ['py.loops', 'py.numbers'], concepts: ['while', 'counter'], difficulty: 1, context: 'general',
      prompt: text('Bolt’s rocket boots need a countdown. Print `5`, `4`, `3`, `2`, `1` (each on its own line), then `Liftoff!`.', 'Use a `while` loop for the counting.'),
      expectedBehavior: 'Lines 5 4 3 2 1 then Liftoff!',
      guidedSteps: ['Create a variable that starts at 5.', 'Loop while it is greater than 0.', 'Inside: print it, then lower it by 1.', 'After the loop (not indented): print Liftoff!'],
      starterCode: '# Set up, loop, then print Liftoff!\n',
      hints: ['You need a variable that changes each time around.', 'The loop should continue while the counter is still above zero.', 'Both the print and the subtraction go inside the loop (indented). `Liftoff!` goes after it, not indented.'],
      checks: [{ kind: 'output', name: 'Countdown and Liftoff', expect: '5\n4\n3\n2\n1\nLiftoff!' }],
      constraints: [{ type: 'requires', node: 'While', message: 'Use a while loop.' }],
      xpReward: 35, coinReward: 5,
    },
    {
      id: 'py-10-savings-goal', objectiveId: 'py-obj-while-accumulate', title: 'Savings Goal', mode: 'challenge', language: 'python', skillIds: ['py.loops', 'py.numbers', 'py.variables'], concepts: ['while', 'accumulator'], difficulty: 2, context: 'finance',
      prompt: text('You have `100` coins and deposit `30` more each month. How many months until you have at least `500`? Use a loop to simulate it and print:', '`Months: N`', 'where N is the number of months you calculated (not typed in by hand).'),
      expectedBehavior: 'Prints Months: followed by the correct number.',
      starterCode: 'balance = 100\ngoal = 500\n',
      hints: ['You need to count months while adding deposits.', 'Keep depositing while the balance is still below the goal, and count each deposit.', 'Two variables change inside the loop: the balance and a month counter. Print the counter after the loop.'],
      checks: [{ kind: 'output', name: 'Months needed', expect: 'Months: 14', feedback: 'Simulate month by month. Does your count include the month when you reach the goal?' }],
      constraints: [{ type: 'requires', node: 'While', message: 'Use a while loop to simulate the months.' }],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'py-10-password', title: 'Retry Until Correct', mode: 'challenge', language: 'python', skillIds: ['py.loops', 'py.input', 'py.conditionals'], concepts: ['while', 'input', 'counter', 'string comparison'], difficulty: 3, context: 'automation',
      prompt: text('The Academy door asks for a password until it gets the right one. The password is `open sesame`.', 'Keep reading lines of input until one equals the password. Then print `Access granted after N tries`, where N counts every line read, including the correct one.', 'Example: inputs `hello`, `abc`, `open sesame` -> `Access granted after 3 tries`.'),
      expectedBehavior: 'Reads lines until `open sesame`, then prints how many tries it took.',
      sampleInput: ['hello', 'abc', 'open sesame'],
      starterCode: '',
      hints: ['You do not know in advance how many lines there will be, which suits a `while` loop.', 'Read a line, count it, and compare. The loop’s condition should ask: is it still wrong?', 'Read one line before the loop, then read the next line at the end of each pass, counting as you go.'],
      checks: [
        { kind: 'output', name: 'Third try', stdin: ['hello', 'abc', 'open sesame'], expect: 'Access granted after 3 tries' },
        { kind: 'output', name: 'First try', stdin: ['open sesame'], expect: 'Access granted after 1 tries', visible: false },
        { kind: 'output', name: 'Five tries', stdin: ['a', 'b', 'c', 'd', 'open sesame'], expect: 'Access granted after 5 tries', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'While', message: 'Use a while loop.' }],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-10-tank-fill', objectiveId: 'py-obj-while-accumulate', title: 'Filling the Tank', mode: 'challenge', language: 'python', skillIds: ['py.loops', 'py.numbers', 'py.variables'], concepts: ['while', 'accumulator'], difficulty: 2, context: 'engineering',
      prompt: text('A tank holds `20` litres. A pump adds `15` litres every minute. How many minutes until the tank contains at least `200` litres? Use a loop to simulate it and print:', '`Minutes: N`', 'where N is the number you calculated (not typed in by hand).'),
      expectedBehavior: 'Prints Minutes: followed by the correct number.',
      starterCode: 'level = 20\ntarget = 200\n',
      hints: ['You need to count minutes while adding litres.', 'Keep pumping while the level is still below the target, and count each minute.', 'Two variables change inside the loop: the level and a minute counter. Print the counter after the loop.'],
      checks: [{ kind: 'output', name: 'Minutes needed', expect: 'Minutes: 12', feedback: 'Simulate minute by minute. Does your count include the minute when the tank reaches the target?' }],
      constraints: [{ type: 'requires', node: 'While', message: 'Use a while loop to simulate the minutes.' }],
      xpReward: 50, coinReward: 8,
    },
  ],
  objectives: [
    { id: 'py-obj-while-accumulate', title: 'Loop until a goal is reached', summary: 'Use a while loop with a running total and a counter to simulate progress towards a goal.' },
  ],
};
