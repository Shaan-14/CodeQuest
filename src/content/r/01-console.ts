import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { rOut } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'r-01-console', title: 'R: The Console, Values and Printing', language: 'r', skillId: 'r.basics',
    blurb: 'Meet R: store values with <-, calculate, print, and read a number from a file.', prerequisites: [], xpReward: 50,
    reference: {
      title: 'R basics',
      body: text(
        'Assign with `<-`: `speed <- 60`. R is built for calculation: `+ - * / ^`, and functions such as `round(x, 1)`, `sqrt(x)`, `sum(x)`. `print(x)` shows a value with its index: `[1] 60`. `cat("Total:", x, "\\n")` prints plain text and values without the `[1]`.',
        'Real inputs come from files. `readLines("file.txt")` reads a text file into a **character vector**, one element per line; convert with `as.numeric(...)`. Text goes in quotes; `#` starts a comment.',
      ),
      example: 'temp <- as.numeric(readLines("temp.txt"))\nprint(temp * 9 / 5 + 32)\ncat("Done\\n")',
    },
    steps: [
      { kind: 'teach', title: 'R is a calculator that remembers', body: text('R was made by statisticians to explore data. You type an expression and R evaluates it. Give a result a name with `<-` and you can use it later. Names are case-sensitive and cannot contain spaces.', '`print(x)` shows the value **with an index**: R thinks in vectors, so even a single number is shown as element `[1]`. That is normal, not an error.') },
      {
        kind: 'demo', title: 'Calculating and reading a file', language: 'r',
        body: text('`trip.txt` holds one number per line. Run the program, then change the speed calculation.'),
        fixtures: { files: { 'trip.txt': '120\n2\n' } },
        code: 'values <- as.numeric(readLines("trip.txt"))\ndistance <- values[1]\nhours <- values[2]\nprint(distance / hours)\nprint(class(values))\nprint(values)',
        notice: '`readLines` gave text (`"120"`, `"2"`), `as.numeric` turned it into numbers, and `values[1]` picked the first element. Indexing in R starts at 1.',
      },
      { kind: 'challenge', challengeId: 'r-01-speed' },
      { kind: 'challenge', challengeId: 'r-01-fahrenheit' },
      { kind: 'challenge', challengeId: 'r-01-pounds' },
    ],
  },
  objectives: [
    { id: 'r-obj-convert', title: 'Read a value and convert units', summary: 'Read one number from a file, convert it with a formula and print it rounded.' },
  ],
  challenges: [
    {
      id: 'r-01-speed', title: 'Average Speed', mode: 'learning', language: 'r', skillIds: ['r.basics'], concepts: ['assignment', 'readLines', 'print'], difficulty: 1, context: 'logistics',
      prompt: text('`trip.txt` has two lines: the distance travelled in km, then the time in hours. Read them, work out the average speed (km per hour) and show it with `print()`.'),
      expectedBehavior: 'Prints the distance divided by the time, like `[1] 60`.',
      guidedSteps: ['`values <- as.numeric(readLines("trip.txt"))`', 'The first value is the distance, the second the hours.', '`print(distance / hours)`'],
      fixtures: { files: { 'trip.txt': '150\n2.5\n' } },
      starterCode: '# Read trip.txt and print the average speed\n',
      hints: ['Two numbers are in the file; read them both.', 'Text from a file must be converted before you can divide.', 'Speed is distance divided by time.'],
      checks: [rOut('The example trip', '[1] 60'), rOut('A slower trip', '[1] 12.5', { 'trip.txt': '100\n8\n' }, false), rOut('A standing start', '[1] 0', { 'trip.txt': '0\n5\n' }, false), rOut('Another trip', '[1] 70', { 'trip.txt': '210\n3\n' }, false)],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'r-01-fahrenheit', objectiveId: 'r-obj-convert', title: 'Celsius to Fahrenheit', mode: 'challenge', language: 'r', skillIds: ['r.basics'], concepts: ['arithmetic', 'round'], difficulty: 2, context: 'science',
      prompt: text('`temp.txt` holds one temperature in degrees Celsius. Print it in **degrees Fahrenheit** (multiply by 9/5 and add 32), **rounded to 1 decimal place**, using `print()`.'),
      expectedBehavior: 'Prints the Fahrenheit value rounded to 1 decimal, like `[1] 98.6`.',
      fixtures: { files: { 'temp.txt': '37\n' } },
      starterCode: '# Read temp.txt and print it in Fahrenheit\n',
      hints: ['Convert the text to a number before calculating.', 'Fahrenheit = Celsius × 9/5 + 32.', 'round(x, 1) keeps one decimal.'],
      checks: [rOut('Body temperature', '[1] 98.6'), rOut('Where the scales meet', '[1] -40', { 'temp.txt': '-40\n' }, false), rOut('Boiling', '[1] 212', { 'temp.txt': '100\n' }, false), rOut('A decimal input', '[1] 70.7', { 'temp.txt': '21.5\n' }, false), rOut('Freezing', '[1] 32', { 'temp.txt': '0\n' }, false)],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'r-01-pounds', objectiveId: 'r-obj-convert', title: 'Kilograms to Pounds', mode: 'challenge', language: 'r', skillIds: ['r.basics'], concepts: ['arithmetic', 'round'], difficulty: 2, context: 'logistics',
      prompt: text('`weight.txt` holds one parcel weight in **kilograms**. Print it in **pounds** (1 kg = 2.20462 lb), **rounded to 1 decimal place**, using `print()`.'),
      expectedBehavior: 'Prints the weight in pounds rounded to 1 decimal, like `[1] 154.3`.',
      fixtures: { files: { 'weight.txt': '70\n' } },
      starterCode: '# Read weight.txt and print the weight in pounds\n',
      hints: ['One number in the file; the conversion factor is in the task.', 'Convert the text first.', 'Round at the end, not before.'],
      checks: [rOut('A heavy parcel', '[1] 154.3'), rOut('A light parcel', '[1] 1.1', { 'weight.txt': '0.5\n' }, false), rOut('A very heavy one', '[1] 220.5', { 'weight.txt': '100\n' }, false), rOut('A decimal weight', '[1] 27.1', { 'weight.txt': '12.3\n' }, false)],
      xpReward: 50, coinReward: 8,
    },
  ],
};
