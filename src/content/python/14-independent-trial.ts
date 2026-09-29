import { text } from '../helpers';
import type { LessonBundle } from '../schema';

/**
 * INDEPENDENT MODE (first example): a problem statement only. No concept names, no starter code,
 * no hints, no guided steps, and no mention of which constructs to use. The player must decide
 * how to solve it, using the Library if they need to look something up.
 */
export const bundle: LessonBundle = {
  lesson: {
    id: 'py-14-independent-trial', title: 'Trial of the Blank Page', language: 'python', skillId: 'py.loops',
    blurb: 'An open problem with no hints. Solve it your own way.', prerequisites: ['py-13-wake-robot'], xpReward: 0,
    reference: { title: 'Independent trials', body: 'Independent trials give you a problem and nothing else. Look things up in the Library, experiment with Run, and test your own edge cases. Nothing here tells you how to solve it.' },
    steps: [{ kind: 'challenge', challengeId: 'py-14-warehouse-audit' }],
  },
  challenges: [
    {
      id: 'py-14-warehouse-audit', title: 'The Warehouse Audit', mode: 'independent', language: 'python', skillIds: ['py.loops', 'py.conditionals', 'py.input', 'py.variables', 'py.numbers'], concepts: [], difficulty: 3, transfer: true, context: 'logistics',
      prompt: text(
        'A warehouse manager gives you the number of items shipped on each day this week, one number per line. The list ends with a line that says `DONE`. There is no fixed number of days.',
        'Print the total items shipped and the largest single day, exactly like this:',
        '`Total: 60`\n`Busiest: 30`',
        'That is the output when the lines are `12`, `30`, `18`, `DONE`. Every day’s count is a whole number of at least 0.',
        'Nothing tells you how to do it. Work it out, test it with your own inputs, and make sure it is right for every case you can think of.',
      ),
      sampleInput: ['12', '30', '18', 'DONE'],
      starterCode: '',
      hints: [],
      checks: [
        { kind: 'output', name: 'Example week', stdin: ['12', '30', '18', 'DONE'], expect: 'Total: 60\nBusiest: 30' },
        { kind: 'output', name: 'Single day', stdin: ['7', 'DONE'], expect: 'Total: 7\nBusiest: 7', visible: false },
        { kind: 'output', name: 'Busiest first', stdin: ['50', '1', '2', 'DONE'], expect: 'Total: 53\nBusiest: 50', visible: false },
        { kind: 'output', name: 'Busiest last', stdin: ['5', '5', '99', 'DONE'], expect: 'Total: 109\nBusiest: 99', visible: false },
        { kind: 'output', name: 'All zero days', stdin: ['0', '0', 'DONE'], expect: 'Total: 0\nBusiest: 0', visible: false },
        { kind: 'output', name: 'Many days', stdin: ['1', '2', '3', '4', '5', '6', '7', '8', 'DONE'], expect: 'Total: 36\nBusiest: 8', visible: false },
      ],
      xpReward: 120, coinReward: 25,
    },
  ],
};
