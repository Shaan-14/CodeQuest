import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-01-first-program', title: 'Your First Spell', language: 'python', skillId: 'py.output',
    blurb: 'What a program is, and how to make one speak.', prerequisites: [], xpReward: 20,
    reference: {
      title: 'print()',
      body: text(
        'A program is a list of instructions the computer follows one at a time, from the top down, exactly as written.',
        '`print(...)` displays whatever is inside the parentheses. Text must be wrapped in quotation marks.',
      ),
      example: 'print("Hello")\nprint("Line two")',
    },
    steps: [
      {
        kind: 'teach', title: 'What is programming?',
        body: text(
          'A **program** is a list of instructions for a computer. Computers are extremely fast and extremely literal: they do exactly what you write, in the order you write it, and nothing else.',
          'Programs run **from top to bottom**. The computer reads line 1, does it, then line 2, then line 3. If you write the steps in the wrong order, it will happily do them in the wrong order.',
          'You write programs in a **programming language**. Ours is **Python**. Real engineers, scientists, analysts and game developers use it every day.',
        ),
      },
      {
        kind: 'demo', title: 'Watch a program run',
        body: text('This program has three lines. Press **Run** and watch the console below the editor.', '`print()` is an instruction that displays text. The text goes inside quotation marks.'),
        code: 'print("Hello, adventurer!")\nprint("This is real Python.")\nprint("It runs top to bottom.")',
        notice: 'Three instructions, three lines of output, in the same order. This is a real Python program that really ran.',
      },
      { kind: 'challenge', challengeId: 'py-01-boot-message' },
      { kind: 'challenge', challengeId: 'py-01-three-lines' },
    ],
  },
  challenges: [
    {
      id: 'py-01-boot-message', title: 'Boot Message', mode: 'learning', language: 'python', skillIds: ['py.output'], concepts: ['print', 'string literal'], difficulty: 1, context: 'general',
      prompt: text(
        'Bolt-7, the Academy’s training robot, lies motionless on the field. His screen is blank. Mentor Juno says: “Every machine needs to announce itself. Make his screen say something.”',
        'Write a program that prints exactly: `BOLT-7 ONLINE`',
      ),
      expectedBehavior: 'The console shows one line: BOLT-7 ONLINE',
      guidedSteps: ['Type `print(` to start the instruction.', 'Type the message inside quotation marks.', 'Close the parenthesis with `)`.', 'Press Run and compare the output to the goal.'],
      starterCode: '# Write your program below this line\n',
      hints: [
        '`print()` displays something on the screen. What should go between its parentheses?',
        'Text has to be wrapped in quotation marks so Python knows it is text and not an instruction.',
        'The shape is `print("...")`. Put the exact message between the quotes, matching capitals and the hyphen.',
      ],
      checks: [{ kind: 'output', name: 'Screen shows the message', expect: 'BOLT-7 ONLINE', feedback: 'Compare your output to the goal character by character: capitals, the hyphen, and spelling all matter to a computer.' }],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'py-01-three-lines', title: 'Startup Sequence', mode: 'challenge', language: 'python', skillIds: ['py.output'], concepts: ['print', 'order of execution'], difficulty: 1, context: 'general',
      prompt: text(
        'Bolt’s screen works! Now Juno wants a proper startup sequence. It should show three lines, in this order:',
        '`Booting...`\n`Checking sensors...`\n`Ready.`',
      ),
      expectedBehavior: 'Three lines of output, in the order given.',
      starterCode: '',
      hints: [
        'Each line of output needs its own instruction.',
        'Programs run top to bottom, so the order you write the lines is the order they appear.',
        'Use one `print("...")` per line, three in total.',
      ],
      checks: [{ kind: 'output', name: 'Three lines in order', expect: 'Booting...\nChecking sensors...\nReady.', feedback: 'Check the order of your lines and that each one matches the goal exactly, including the dots.' }],
      xpReward: 40, coinReward: 6,
    },
  ],
};
