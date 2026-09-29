import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-02-fixing-errors', title: 'Reading the Robot’s Complaints', language: 'python', skillId: 'py.debugging',
    blurb: 'Errors are messages, not failures. Learn to read them.', prerequisites: ['py-01-first-program'], xpReward: 25,
    reference: {
      title: 'Reading an error',
      body: text(
        'Read an error from the bottom up: the last line names the **kind** of error and what went wrong. The line above it shows **where** (the line number).',
        '`SyntaxError`: Python could not understand the code’s shape (a missing quote or bracket). Nothing runs at all. `NameError`: a name Python does not know (often a typo). `IndentationError`: spaces at the start of a line that should not be there.',
        'Fix ONE error, run again, read the next one.',
      ),
    },
    steps: [
      {
        kind: 'teach', title: 'Programs break. That is normal.',
        body: text(
          'Everyone who writes code gets errors, every day, including people who have done it for decades. An error is not a failure; it is Python telling you exactly what it could not understand.',
          'The skill is **reading** the message. You are about to see one on purpose.',
        ),
      },
      {
        kind: 'demo', title: 'Make Python complain', expectsError: true,
        body: text('Run this program. Line 2 uses a name that Python has never heard of.'),
        code: 'print("Starting diagnostics")\nprint(battery_level)',
        notice: 'Read the LAST line first: `NameError` means Python does not know that name. The line number above tells you where. The first print still ran, because programs run top to bottom until they crash.',
      },
      {
        kind: 'demo', title: 'A different kind of error', expectsError: true,
        body: text('This one has a mistake in the *shape* of the code: the quotation mark is never closed.'),
        code: 'print("Starting diagnostics")\nprint("Motor check)',
        notice: 'A `SyntaxError` is found before anything runs, so even the first print did not show. Python checks the whole program’s shape first.',
      },
      {
        kind: 'teach', title: 'Spaces matter',
        body: text(
          'In Python, spaces at the **start** of a line mean something. For now, every line should start at the very left edge. Adding random spaces gives an `IndentationError`. (Later, indentation will become a tool you use on purpose.)',
        ),
      },
      { kind: 'challenge', challengeId: 'py-02-broken-boot' },
      { kind: 'challenge', challengeId: 'py-02-stray-spaces' },
    ],
  },
  challenges: [
    {
      id: 'py-02-broken-boot', title: 'Broken Boot Script', mode: 'learning', language: 'python', skillIds: ['py.debugging', 'py.output'], concepts: ['SyntaxError', 'NameError', 'reading tracebacks'], difficulty: 1, context: 'general',
      prompt: text(
        'Bolt’s boot script was written in a hurry and it will not run. It should print:',
        '`Motor: OK`\n`Sensor: OK`\n`Battery: OK`',
        'Run it, read the error, and fix the script. There is more than one mistake, and Python reports them one at a time.',
      ),
      expectedBehavior: 'Three lines: Motor: OK, Sensor: OK, Battery: OK.',
      guidedSteps: ['Press Run and read the last line of the error.', 'Find the line number it mentions.', 'Fix that one mistake and Run again.', 'Repeat until the script prints all three lines.'],
      starterCode: 'prnt("Motor: OK")\nprint("Sensor: OK)\nprint("Battery: OK")\n',
      hints: [
        'Run it first. Which line does the error point to, and what kind of error is it?',
        'Python checks the shape of the whole program before running any of it, so a shape problem is reported first.',
        'One mistake is a quotation mark that is never closed. After you fix it, the next error will be a misspelled instruction.',
      ],
      checks: [{ kind: 'output', name: 'All three lines print', expect: 'Motor: OK\nSensor: OK\nBattery: OK', feedback: 'Run your program and compare the output line by line with the goal.' }],
      xpReward: 35, coinReward: 6,
    },
    {
      id: 'py-02-stray-spaces', title: 'The Arm Test', mode: 'challenge', language: 'python', skillIds: ['py.debugging'], concepts: ['IndentationError', 'reading tracebacks'], difficulty: 2, context: 'general',
      prompt: text('Bolt’s arm test script crashes as soon as it starts. Find out why and fix it so it prints these four lines:', '`Checking left arm`\n`Left arm OK`\n`Checking right arm`\n`Right arm OK`', 'Do not rewrite it from scratch; work out what is wrong.'),
      expectedBehavior: 'Four lines, as listed.',
      starterCode: 'print("Checking left arm")\n    print("Left arm OK")\nprint("Checking right arm")\n    print("Right arm OK")\n',
      hints: [
        'Run it and read the error type. It names the problem directly.',
        'Look at the start of each line. Should any of them begin with spaces?',
        'Two lines have spaces at the beginning that Python did not expect.',
      ],
      checks: [{ kind: 'output', name: 'Four lines print', expect: 'Checking left arm\nLeft arm OK\nChecking right arm\nRight arm OK' }],
      xpReward: 45, coinReward: 8,
    },
  ],
};
