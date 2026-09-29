import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-08-if-else', title: 'Choices', language: 'python', skillId: 'py.conditionals',
    blurb: 'Making a program do different things with if and else.', prerequisites: ['py-07-logic'], xpReward: 25,
    reference: {
      title: 'if / else',
      body: text(
        '`if condition:` runs the **indented** lines under it only when the condition is True. `else:` runs when it was not.',
        'The colon `:` and the 4-space indentation are required. All lines with the same indentation belong to the same block.',
      ),
      example: 'if score >= 50:\n    print("Pass")\nelse:\n    print("Try again")',
    },
    steps: [
      {
        kind: 'teach', title: 'A fork in the road',
        body: text(
          'Programs become powerful when they can **decide**. An `if` statement runs some lines only when a condition is `True`. An `else` says what to do otherwise.',
          'Two rules to remember: the line ends with a **colon** `:`, and the lines that belong inside are **indented** (moved right by 4 spaces). Remember the `IndentationError`? Now the indentation is doing real work: it shows which lines belong to the decision.',
        ),
      },
      {
        kind: 'demo', title: 'Decide',
        body: text('The Program input box holds `15`. Run it, then change the input to `80` and run again.'),
        code: 'battery = int(input("Battery %: "))\nif battery < 20:\n    print("Low battery!")\nelse:\n    print("Battery fine")\nprint("Check complete")',
        stdin: ['15'],
        notice: 'Only one of the two blocks ran, depending on the input. The last `print` is NOT indented, so it runs every time.',
      },
      { kind: 'challenge', challengeId: 'py-08-battery-check' },
      { kind: 'challenge', challengeId: 'py-08-free-shipping' },
    ],
  },
  challenges: [
    {
      id: 'py-08-battery-check', title: 'Battery Check', mode: 'learning', language: 'python', skillIds: ['py.conditionals', 'py.input'], concepts: ['if', 'else', 'indentation'], difficulty: 1, context: 'engineering',
      prompt: text('Read Bolt’s battery percentage (a whole number). If it is below `20`, print `Low battery`. Otherwise print `Battery OK`.'),
      expectedBehavior: '15 -> Low battery; 20 -> Battery OK; 80 -> Battery OK',
      guidedSteps: ['Read and convert the input.', 'Write `if battery < 20:` and indent the next line.', 'Add `else:` at the same level as `if`, and indent its line.'],
      sampleInput: ['15'],
      starterCode: 'battery = int(input())\n# Your decision goes here\n',
      hints: ['The condition asks: is the battery *below* 20?', 'After `if ...:` and after `else:` the lines that belong to them are indented by 4 spaces.', 'Exactly 20 is not below 20, so it should go to the else branch.'],
      checks: [
        { kind: 'output', name: 'Battery 15', stdin: ['15'], expect: 'Low battery' },
        { kind: 'output', name: 'Battery 80', stdin: ['80'], expect: 'Battery OK' },
        { kind: 'output', name: 'Boundary: exactly 20', stdin: ['20'], expect: 'Battery OK', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'If', message: 'Use an if statement to make the decision.' }],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'py-08-free-shipping', objectiveId: 'py-obj-threshold', title: 'Free Shipping', mode: 'challenge', language: 'python', skillIds: ['py.conditionals', 'py.input', 'py.numbers'], concepts: ['if', 'else', 'boundary values'], difficulty: 2, context: 'business',
      prompt: text('An online store gives free shipping on orders of `50` or more. Read the order total (may have decimals). If it qualifies, print `Free shipping`. Otherwise print `Shipping: 5` (the shipping cost).'),
      expectedBehavior: '80 -> Free shipping; 49.99 -> Shipping: 5; exactly 50 -> Free shipping.',
      sampleInput: ['80'],
      starterCode: '',
      hints: ['Convert the input to a number that can hold decimals.', 'Decide which comparison operator matches “50 or more”.', 'Check the boundary: does exactly 50 qualify? Your operator choice decides.'],
      checks: [
        { kind: 'output', name: 'Order 80', stdin: ['80'], expect: 'Free shipping' },
        { kind: 'output', name: 'Order 49.99', stdin: ['49.99'], expect: 'Shipping: 5' },
        { kind: 'output', name: 'Order 50', stdin: ['50'], expect: 'Free shipping', visible: false, feedback: 'What should happen at exactly 50?' },
        { kind: 'output', name: 'Order 0', stdin: ['0'], expect: 'Shipping: 5', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'If', message: 'Use an if statement to make the decision.' }],
      xpReward: 45, coinReward: 8,
    },
    {
      id: 'py-08-overtime', objectiveId: 'py-obj-threshold', title: 'Overtime Rule', mode: 'challenge', language: 'python', skillIds: ['py.conditionals', 'py.input', 'py.numbers'], concepts: ['if', 'else', 'boundary values'], difficulty: 2, context: 'payroll',
      prompt: text('A company pays overtime only for weeks of MORE than `40` hours. Read the hours worked (may have decimals). If it qualifies, print `Overtime`. Otherwise print `Regular`.'),
      expectedBehavior: '45 -> Overtime; 38.5 -> Regular; exactly 40 -> Regular.',
      sampleInput: ['45'],
      starterCode: '',
      hints: ['Convert the input to a number that can hold decimals.', 'Decide which comparison operator matches “more than 40”.', 'Check the boundary: does exactly 40 qualify? Your operator choice decides.'],
      checks: [
        { kind: 'output', name: '45 hours', stdin: ['45'], expect: 'Overtime' },
        { kind: 'output', name: '38.5 hours', stdin: ['38.5'], expect: 'Regular' },
        { kind: 'output', name: 'Exactly 40', stdin: ['40'], expect: 'Regular', visible: false, feedback: 'What should happen at exactly 40?' },
        { kind: 'output', name: '40.5 hours', stdin: ['40.5'], expect: 'Overtime', visible: false },
      ],
      constraints: [{ type: 'requires', node: 'If', message: 'Use an if statement to make the decision.' }],
      xpReward: 45, coinReward: 8,
    },
  ],
  objectives: [
    { id: 'py-obj-threshold', title: 'Decide with a threshold', summary: 'Use if/else to choose an outcome from a numeric threshold; get the boundary right.' },
  ],
};
