import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-04-strings', title: 'Words and Names', language: 'python', skillId: 'py.strings',
    blurb: 'Text values: joining, measuring, and f-strings.', prerequisites: ['py-03-variables'], xpReward: 25,
    reference: {
      title: 'Strings',
      body: text(
        'A **string** is text in quotes: `"Bolt"` or `\'Bolt\'`. Join strings with `+`. `len(s)` gives the length. `s.upper()` and `s.lower()` change case.',
        'An **f-string** puts values inside text: `f"Hello {name}"`. Anything inside `{}` is evaluated.',
      ),
      example: 'name = "Bolt"\nprint("Hello, " + name)\nprint(f"{name} has {len(name)} letters")',
    },
    steps: [
      {
        kind: 'teach', title: 'Strings',
        body: text(
          'Text in quotation marks is called a **string**. Each string is a sequence of characters, and Python has tools for working with them: joining with `+`, measuring with `len()`, and changing case with `.upper()`.',
          'An **f-string** is a string with an `f` before the opening quote. Put a variable inside `{ }` and Python swaps in its value. Very handy for building messages.',
        ),
      },
      {
        kind: 'demo', title: 'Three ways to build a message',
        body: text('Run it and compare the three lines to the code that produced them.'),
        code: 'name = "Bolt"\nprint("Hello, " + name)\nprint(f"{name} has {len(name)} letters")\nprint(name.upper())',
        notice: 'The `+` glued two strings together. The f-string filled in both `name` and the result of `len(name)`. `.upper()` returned a new, capitalised string.',
      },
      { kind: 'challenge', challengeId: 'py-04-name-tag' },
      { kind: 'challenge', challengeId: 'py-04-receipt' },
    ],
  },
  challenges: [
    {
      id: 'py-04-name-tag', title: 'Name Tag', mode: 'learning', language: 'python', skillIds: ['py.strings', 'py.variables'], concepts: ['string', 'concatenation'], difficulty: 1, context: 'general',
      prompt: text('Every robot in the Academy wears a name tag. Store the text `BOLT-7` in a variable called `robot_name`, then print `Unit: BOLT-7` by joining the words `Unit: ` and the variable together.'),
      expectedBehavior: 'The console shows `Unit: BOLT-7`, and `robot_name` holds "BOLT-7".',
      guidedSteps: ['Create `robot_name` and store the text (with quotes!).', 'Print `"Unit: " + robot_name`.'],
      starterCode: '# Store the name, then print the label\n',
      hints: ['Text values need quotation marks, even when stored in a variable.', 'The `+` operator joins two strings together.', 'Note the space after the colon in `"Unit: "`. It is part of the string.'],
      checks: [
        { kind: 'variable', name: 'robot_name is set', variable: 'robot_name', expect: 'BOLT-7' },
        { kind: 'output', name: 'Label is printed', expect: 'Unit: BOLT-7', feedback: 'Watch the space after the colon.' },
      ],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'py-04-receipt', objectiveId: 'py-obj-fstring', title: 'Order Receipt', mode: 'challenge', language: 'python', skillIds: ['py.strings', 'py.variables'], concepts: ['f-string', 'len'], difficulty: 2, context: 'business',
      prompt: text(
        'The Academy shop prints receipts. Given these variables:',
        '`customer = "Dana Ortiz"`\n`items = 3`',
        'print `Order for Dana Ortiz: 3 items` using an f-string.',
      ),
      expectedBehavior: 'One line: Order for Dana Ortiz: 3 items',
      starterCode: 'customer = "Dana Ortiz"\nitems = 3\n',
      hints: ['An f-string starts with the letter `f` right before the opening quote.', 'Inside an f-string, `{customer}` is replaced by the variable’s value.', 'Use both `{customer}` and `{items}` inside a single f-string, with the fixed words around them.'],
      checks: [{ kind: 'output', name: 'Receipt line', expect: 'Order for Dana Ortiz: 3 items' }],
      constraints: [{ type: 'requires', node: 'JoinedStr', message: 'Use an f-string (a string starting with f) to build the line.' }],
      xpReward: 45, coinReward: 8,
    },
    {
      id: 'py-04-label-printer', objectiveId: 'py-obj-fstring', title: 'Part Labels', mode: 'challenge', language: 'python', skillIds: ['py.strings', 'py.variables'], concepts: ['f-string', 'len'], difficulty: 2, context: 'manufacturing',
      prompt: text('A factory label printer needs one line per crate. Given these variables:', '`part = "Gear"`\n`count = 12`', 'print `Part Gear x 12` using an f-string.'),
      expectedBehavior: 'One line: Part Gear x 12',
      starterCode: 'part = "Gear"\ncount = 12\n',
      hints: ['An f-string starts with the letter `f` right before the opening quote.', 'Inside an f-string, `{part}` is replaced by the variable’s value.', 'Use both `{part}` and `{count}` inside a single f-string, with the fixed words around them.'],
      checks: [{ kind: 'output', name: 'Label line', expect: 'Part Gear x 12' }],
      constraints: [{ type: 'requires', node: 'JoinedStr', message: 'Use an f-string (a string starting with f) to build the line.' }],
      xpReward: 45, coinReward: 8,
    },
  ],
  objectives: [
    { id: 'py-obj-fstring', title: 'Build a message with an f-string', summary: 'Combine text and variables into one line.' },
  ],
};
