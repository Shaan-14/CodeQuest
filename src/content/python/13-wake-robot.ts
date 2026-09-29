import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-13-wake-robot', title: 'Wake the Training Robot', language: 'python', skillId: 'py.functions',
    blurb: 'Combine everything into Bolt’s complete control program.', prerequisites: ['py-12-functions'], xpReward: 40,
    reference: {
      title: 'Putting it together',
      body: text(
        'Real programs combine ideas: **input** feeds **variables**, **functions** hold reusable logic, **conditions** decide, **loops** repeat.',
        'When a task is big, split it: write the function that makes one decision, test it alone, then write the loop that uses it.',
      ),
    },
    steps: [
      {
        kind: 'teach', title: 'The final program',
        body: text(
          'Bolt lies on the field, his chest panel open. Mentor Juno hands you a datapad: “Everything you have learned goes into his control program. It is one job, but it has parts.”',
          'Big tasks are easier when you split them. Here: one part **decides** what a battery level means, another part **repeats** that decision for several readings. Build and test the first, then the second.',
        ),
      },
      { kind: 'challenge', challengeId: 'py-13-control-program' },
    ],
  },
  challenges: [
    {
      id: 'py-13-control-program', title: 'Bolt’s Control Program', mode: 'challenge', language: 'python', skillIds: ['py.functions', 'py.conditionals', 'py.loops', 'py.input'], concepts: ['def', 'return', 'if/elif/else', 'for', 'input', 'decomposition'], difficulty: 4, context: 'automation',
      prompt: text(
        'Bolt’s power monitor must classify battery readings.',
        '**Part 1.** Write a function `status(battery)` that returns the text `CRITICAL` if the battery is below 10, `LOW` if it is below 40, and `OK` otherwise.',
        '**Part 2.** Read **three** battery readings (one whole number per line) and print each reading’s status on its own line, using your function.',
        'Example: readings `5`, `25`, `90` print `CRITICAL`, `LOW`, `OK`.',
      ),
      expectedBehavior: 'status(9) -> CRITICAL, status(10) -> LOW, status(40) -> OK. The program prints three lines for three readings.',
      sampleInput: ['5', '25', '90'],
      starterCode: '',
      hints: [
        'Split the work: get `status` right on its own first. Test it with a few values by calling it and printing the result.',
        'Inside `status`, test the most severe condition first, then the next, then everything else.',
        'For the second part, a loop that runs three times can read one line per pass, convert it, call `status`, and print the result.',
      ],
      checks: [
        { kind: 'call', name: 'status(9)', fn: 'status', args: [9], stdin: ['50', '50', '50'], expect: 'CRITICAL' },
        { kind: 'call', name: 'status(10)', fn: 'status', args: [10], stdin: ['50', '50', '50'], expect: 'LOW', visible: false, feedback: 'Is 10 below 10?' },
        { kind: 'call', name: 'status(39)', fn: 'status', args: [39], stdin: ['50', '50', '50'], expect: 'LOW', visible: false },
        { kind: 'call', name: 'status(40)', fn: 'status', args: [40], stdin: ['50', '50', '50'], expect: 'OK', visible: false, feedback: 'Is 40 below 40?' },
        { kind: 'output', name: 'Three readings', stdin: ['5', '25', '90'], expect: 'CRITICAL\nLOW\nOK' },
        { kind: 'output', name: 'Another set', stdin: ['40', '10', '9'], expect: 'OK\nLOW\nCRITICAL', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'FunctionDef', message: 'Define status as a function with def.' }],
      xpReward: 100, coinReward: 20,
    },
  ],
};
