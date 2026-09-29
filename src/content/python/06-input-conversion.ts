import { text } from '../helpers';
import type { LessonBundle } from '../schema';

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-06-input-conversion', title: 'Talking to Bolt', language: 'python', skillId: 'py.input',
    blurb: 'Reading input and converting between text and numbers.', prerequisites: ['py-05-numbers'], xpReward: 30,
    reference: {
      title: 'input() and conversion',
      body: text(
        '`input("prompt")` waits for the user to type a line and returns it as a **string**, always, even if they typed digits.',
        'Convert with `int(x)`, `float(x)`, `str(x)`. `int("12") + 1` is 13, but `"12" + "1"` is `"121"`. Mixing text and numbers in `+` is a `TypeError`.',
      ),
      example: 'age = int(input("Age? "))\nprint("Next year:", age + 1)',
    },
    steps: [
      {
        kind: 'teach', title: 'Programs that listen',
        body: text(
          'Until now, all values were typed into the program itself. `input()` lets a program ask the user for something. In CodeQuest, type the answers into the **Program input** box below the editor, one line for each `input()` call.',
          'There is one big trap: **`input()` always gives you text**, even if the user typed a number. Text and numbers are different **types**, and Python will not silently mix them.',
        ),
      },
      {
        kind: 'demo', title: 'A conversation',
        body: text('The Program input box already contains `Ada`. Run the program.'),
        code: 'name = input("What is your name? ")\nprint("Hello, " + name + "!")',
        stdin: ['Ada'],
        notice: 'The value returned by `input()` was stored in `name`. Change the text in the input box and run it again.',
      },
      {
        kind: 'demo', title: 'The classic trap', expectsError: true,
        body: text('The Program input box contains `12`. The program tries to add 1 to it. Predict what happens, then run it.'),
        code: 'age = input("How old are you? ")\nprint(age + 1)',
        stdin: ['12'],
        notice: 'A real `TypeError`: `age` is the text "12", not the number 12, and Python will not add a number to text. The fix is conversion: `int(age)`. Try it.',
      },
      { kind: 'challenge', challengeId: 'py-06-terminal-greeting' },
      { kind: 'challenge', challengeId: 'py-06-ticket-total' },
      { kind: 'challenge', challengeId: 'py-06-temperature' },
    ],
  },
  challenges: [
    {
      id: 'py-06-terminal-greeting', title: 'Greeting Terminal', mode: 'learning', language: 'python', skillIds: ['py.input', 'py.strings'], concepts: ['input', 'string'], difficulty: 1, context: 'general',
      prompt: text('The Academy terminal should greet whoever walks up. Read a name with `input()`, then print `Welcome, ` followed by the name and an exclamation mark.', 'For example, if the visitor types `Sam`, print `Welcome, Sam!`'),
      expectedBehavior: 'For input Sam: `Welcome, Sam!`. It must work for any name.',
      guidedSteps: ['Read the name: `name = input()`.', 'Print the greeting using the variable.'],
      sampleInput: ['Sam'],
      starterCode: '# Read a name and greet it\n',
      hints: ['`input()` returns what the user typed. Store it in a variable.', 'Join the pieces with `+` or use an f-string.', 'Test with different names in the input box; your program must not hard-code one name.'],
      checks: [
        { kind: 'output', name: 'Greets Sam', stdin: ['Sam'], expect: 'Welcome, Sam!' },
        { kind: 'output', name: 'Greets a different name', stdin: ['Priya'], expect: 'Welcome, Priya!', visible: false, feedback: 'Your program must work for any name, not only one.' },
      ],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'py-06-ticket-total', objectiveId: 'py-obj-int-input', title: 'Ticket Total', mode: 'challenge', language: 'python', skillIds: ['py.input', 'py.numbers'], concepts: ['int conversion', 'input'], difficulty: 2, context: 'business',
      prompt: text('The Academy fair sells tickets at `12` coins each. The cashier types the number of tickets. Print the total cost like this:', '`Total: 36`', '(that is the output when 3 tickets are bought).'),
      expectedBehavior: 'Reads one whole number; prints `Total: ` followed by the number times 12.',
      sampleInput: ['3'],
      starterCode: '',
      hints: ['What type does `input()` give back?', 'You can only multiply a number by 12, not a piece of text. Convert it first.', 'Wrap the input in `int(...)`, multiply, and print with `Total: ` in front.'],
      checks: [
        { kind: 'output', name: '3 tickets', stdin: ['3'], expect: 'Total: 36' },
        { kind: 'output', name: '10 tickets', stdin: ['10'], expect: 'Total: 120', visible: false },
        { kind: 'output', name: '0 tickets', stdin: ['0'], expect: 'Total: 0', visible: false },
      ],
      xpReward: 45, coinReward: 8,
    },
    {
      id: 'py-06-temperature', objectiveId: 'py-obj-float-formula', title: 'Lab Thermometer', mode: 'challenge', language: 'python', skillIds: ['py.input', 'py.numbers'], concepts: ['float conversion', 'formula'], difficulty: 3, context: 'science',
      prompt: text('A lab thermometer reports Celsius, but the equipment manual needs Fahrenheit. Read a temperature in Celsius and print the Fahrenheit value.', 'Fahrenheit = Celsius × 9 ÷ 5 + 32', 'Print just the number, as Python shows it (for 100 Celsius that is `212.0`).'),
      expectedBehavior: 'For 100 prints 212.0, for 0 prints 32.0, for -40 prints -40.0.',
      sampleInput: ['100'],
      starterCode: '',
      hints: ['Convert the input to a number first. The reading might have a decimal point.', 'Follow the formula in the same order Python would: multiply, divide, then add.', '`float(input())` reads a decimal number; `/` in Python always gives a float.'],
      checks: [
        { kind: 'output', name: '100 Celsius', stdin: ['100'], expect: '212.0' },
        { kind: 'output', name: '0 Celsius', stdin: ['0'], expect: '32.0', visible: false },
        { kind: 'output', name: '1 Celsius', stdin: ['1'], expect: '33.8', visible: false, feedback: 'Watch out for divisions that throw away the decimal part.' },
        { kind: 'output', name: '-40 Celsius', stdin: ['-40'], expect: '-40.0', visible: false, feedback: 'Negative numbers should work too.' },
      ],
      xpReward: 60, coinReward: 10,
    },
    {
      id: 'py-06-fuel-cost', objectiveId: 'py-obj-int-input', title: 'Fuel Cost', mode: 'challenge', language: 'python', skillIds: ['py.input', 'py.numbers'], concepts: ['int conversion', 'input'], difficulty: 2, context: 'engineering',
      prompt: text('A generator burns fuel that costs `3` coins per litre. An operator types how many litres were used. Print the cost like this:', '`Cost: 21`', '(that is the output when 7 litres are used).'),
      expectedBehavior: 'Reads one whole number; prints `Cost: ` followed by the number times 3.',
      sampleInput: ['7'],
      starterCode: '',
      hints: ['What type does `input()` give back?', 'You can only multiply a number by 3 in the way you want after converting the text.', 'Wrap the input in `int(...)`, multiply, and print with `Cost: ` in front.'],
      checks: [
        { kind: 'output', name: '7 litres', stdin: ['7'], expect: 'Cost: 21' },
        { kind: 'output', name: '12 litres', stdin: ['12'], expect: 'Cost: 36', visible: false },
        { kind: 'output', name: '0 litres', stdin: ['0'], expect: 'Cost: 0', visible: false },
      ],
      xpReward: 45, coinReward: 8,
    },
    {
      id: 'py-06-inches', objectiveId: 'py-obj-float-formula', title: 'Metric Ruler', mode: 'challenge', language: 'python', skillIds: ['py.input', 'py.numbers'], concepts: ['float conversion', 'formula'], difficulty: 3, context: 'engineering',
      prompt: text('A workshop drawing is in inches, but the machine needs centimetres. Read a length in inches (it may have a decimal point) and print it in centimetres.', 'Centimetres = inches × 2.54', 'Print just the number, as Python shows it (for 100 inches that is `254.0`).'),
      expectedBehavior: 'For 100 prints 254.0, for 10 prints 25.4, for 0 prints 0.0.',
      sampleInput: ['100'],
      starterCode: '',
      hints: ['Convert the input to a number first. The measurement might have a decimal point.', 'Multiply by the conversion factor.', '`float(input())` reads a decimal number.'],
      checks: [
        { kind: 'output', name: '100 inches', stdin: ['100'], expect: '254.0' },
        { kind: 'output', name: '10 inches', stdin: ['10'], expect: '25.4', visible: false },
        { kind: 'output', name: '0 inches', stdin: ['0'], expect: '0.0', visible: false },
        { kind: 'output', name: 'Decimal input', stdin: ['2.5'], expect: '6.35', visible: false, feedback: 'Measurements can have decimals. Which conversion function keeps them?' },
      ],
      xpReward: 60, coinReward: 10,
    },
  ],
  objectives: [
    { id: 'py-obj-int-input', title: 'Read a number and calculate with it', summary: 'input() returns text; convert it before doing arithmetic.' },
    { id: 'py-obj-float-formula', title: 'Apply a formula to a decimal input', summary: 'Read a decimal number and apply a formula to it.' },
  ],
};
