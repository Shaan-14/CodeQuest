import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-07-logic', title: 'Yes or No', language: 'python', skillId: 'py.logic',
    blurb: 'Booleans, comparisons, and combining conditions.', prerequisites: ['py-06-input-conversion'], xpReward: 25,
    reference: {
      title: 'Booleans and comparisons',
      body: text(
        'A **boolean** is `True` or `False`. Comparisons produce booleans: `==` equal, `!=` not equal, `<` `>` `<=` `>=`.',
        'Combine with `and`, `or`, `not`. Careful: `=` stores a value; `==` asks a question.',
      ),
      example: 'x = 40\nprint(x > 20 and x < 60)  # True\nprint(x == 41)            # False',
    },
    steps: [
      {
        kind: 'teach', title: 'Questions with two answers',
        body: text(
          'A **boolean** has only two possible values: `True` and `False`. You get them by asking a question with a **comparison**: is this greater than that? Are these equal?',
          'The operators are `>`, `<`, `>=`, `<=`, `==` (equal) and `!=` (not equal). Notice `==` has **two** equals signs, because a single `=` already means “store this value”.',
          'You can combine questions: `and` (both must be true), `or` (at least one), `not` (flip it).',
        ),
      },
      {
        kind: 'demo', title: 'Ask Python questions',
        body: text('Predict each line’s answer before you run it.'),
        code: 'battery = 40\nprint(battery > 50)\nprint(battery == 40)\nprint(battery > 20 and battery < 60)\nprint(not battery > 20)',
        notice: 'Every line printed `True` or `False`. Comparisons are questions; the booleans are the answers. In the next lessons, programs will make decisions based on them.',
      },
      { kind: 'challenge', challengeId: 'py-07-ready' },
      { kind: 'challenge', challengeId: 'py-07-safe-range' },
      { kind: 'challenge', challengeId: 'py-07-pitcher' },
    ],
  },
  challenges: [
    {
      id: 'py-07-ready', title: 'Ready to Move?', mode: 'learning', language: 'python', skillIds: ['py.logic', 'py.variables'], concepts: ['boolean', 'comparison'], difficulty: 1, context: 'engineering',
      prompt: text('Bolt can only move when his battery is above `50`. His battery is currently `75`.', 'Store `75` in `battery`. Then create a variable `can_move` that holds the *answer* to “is the battery above 50?” and print it.'),
      expectedBehavior: 'The console shows `True` and `can_move` holds True.',
      guidedSteps: ['`battery = 75`', '`can_move = battery > 50` stores the answer to the question.', 'Print `can_move`.'],
      starterCode: '# battery, can_move\n',
      hints: ['A comparison produces a value, and a value can be stored in a variable.', 'You do not need any words like “True” typed by hand; let the comparison produce it.', 'The right side of the assignment is the question: `battery > 50`.'],
      checks: [
        { kind: 'variable', name: 'can_move is True', variable: 'can_move', expect: true, feedback: '`can_move` must be a real boolean produced by a comparison.' },
        { kind: 'output', name: 'True is printed', expect: 'True' },
      ],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'py-07-safe-range', title: 'Safe Pressure', mode: 'challenge', language: 'python', skillIds: ['py.logic', 'py.input'], concepts: ['and', 'range check', 'float'], difficulty: 2, context: 'engineering',
      prompt: text('A boiler is safe when its pressure is between `60` and `100` (both ends included). Read a pressure reading and print `True` if it is safe, otherwise `False`.', 'Readings may include decimals like `59.5`.'),
      expectedBehavior: 'Prints True or False for any reading. Boundaries 60 and 100 count as safe.',
      sampleInput: ['85'],
      starterCode: '',
      hints: ['Convert the reading to a number that can have a decimal part.', 'Two conditions must both hold: not too low and not too high.', 'Join two comparisons with `and`. Think about whether the limits themselves should pass (`>=` versus `>`).'],
      checks: [
        { kind: 'output', name: 'Reading 85', stdin: ['85'], expect: 'True' },
        { kind: 'output', name: 'Lower boundary', stdin: ['60'], expect: 'True', visible: false, feedback: 'What should happen exactly at the lower limit?' },
        { kind: 'output', name: 'Upper boundary', stdin: ['100'], expect: 'True', visible: false, feedback: 'What should happen exactly at the upper limit?' },
        { kind: 'output', name: 'Just above range', stdin: ['100.5'], expect: 'False', visible: false },
        { kind: 'output', name: 'Just below range', stdin: ['59.5'], expect: 'False', visible: false },
      ],
      xpReward: 45, coinReward: 8,
    },
    {
      id: 'py-07-pitcher', title: 'Can He Pitch Today?', mode: 'challenge', language: 'python', skillIds: ['py.logic', 'py.input'], concepts: ['and', 'or', 'comparison', 'string comparison'], difficulty: 3, context: 'baseball',
      prompt: text('The Bytehaven Owls’ coach uses a rule: a pitcher may start today if he threw fewer than `80` pitches in his last game AND has had at least `4` days of rest, OR the coach says `override`.', 'Read three lines: pitches thrown (a whole number), days of rest (a whole number), and the coach’s word (any text; `override` means yes). Print `True` if he may pitch, else `False`.'),
      expectedBehavior: 'Reads three lines and prints True or False following the rule.',
      sampleInput: ['75', '5', 'no'],
      starterCode: '',
      hints: ['Three pieces of information come in, in order. Read them into three variables and convert the numbers.', 'The rule has two parts joined by OR; the first part is itself two conditions joined by AND.', 'Use parentheses to group: (this and that) or the third condition. Text is compared with `==`.'],
      checks: [
        { kind: 'output', name: 'Fresh and rested', stdin: ['75', '5', 'no'], expect: 'True' },
        { kind: 'output', name: 'Threw too many', stdin: ['95', '5', 'no'], expect: 'False', visible: false },
        { kind: 'output', name: 'Not enough rest', stdin: ['60', '3', 'no'], expect: 'False', visible: false },
        { kind: 'output', name: 'Coach override', stdin: ['120', '0', 'override'], expect: 'True', visible: false, feedback: 'What does the coach’s word change?' },
        { kind: 'output', name: 'Boundary: 80 pitches', stdin: ['80', '4', 'no'], expect: 'False', visible: false },
        { kind: 'output', name: 'Boundary: 4 days rest', stdin: ['79', '4', 'no'], expect: 'True', visible: false },
      ],
      xpReward: 60, coinReward: 10,
    },
  ],
};
