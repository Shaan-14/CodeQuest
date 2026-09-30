import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { book, cells, grid, isFormula } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'xl-02-functions', title: 'Functions: Let the Sheet Do the Work', language: 'sheet', skillId: 'xl.functions',
    blurb: 'SUM, AVERAGE, MIN, MAX, COUNT, ROUND, and text functions to build labels.', prerequisites: ['xl-01-formulas'], xpReward: 50,
    reference: {
      title: 'Everyday functions',
      body: text('A **function** is a named calculation: `=SUM(B2:B6)` adds a **range** (B2 to B6). Common ones: `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT` (counts numbers), `ROUND(x, digits)`.', 'Text functions: `LEFT`, `RIGHT`, `MID`, `LEN`, `UPPER`, `LOWER`, `TRIM`; join text with `&`; `TEXT(7,"000")` formats a number as `007`.'),
      example: '=SUM(B2:B6)\n=ROUND(AVERAGE(B2:B6),1)\n=LEFT(A2,1)&". "&UPPER(B2)\n=TEXT(B2,"000")',
    },
    steps: [
      {
        kind: 'teach', title: 'Ranges and functions',
        body: text(
          'Adding twenty cells with `+` is slow and fragile. A **range** names a block of cells (`B2:B21`) and a **function** does something with it: `=SUM(B2:B21)`, `=AVERAGE(B2:B21)`, `=MAX(B2:B21)`. They ignore empty cells and text in the range, which is usually what you want. `COUNT` counts how many cells hold numbers, so blanks are not counted.',
          '`ROUND(x, 2)` rounds to two decimals. Functions nest: `=ROUND(AVERAGE(B2:B6),1)` averages first, then rounds. Functions are the main way a spreadsheet stays correct as data grows: if a new row is added inside the range, the result includes it.',
        ),
      },
      {
        kind: 'teach', title: 'Text is data too',
        body: text(
          'Labels, codes and names are text. `&` joins text (`=A2&" "&B2`); `LEFT(A2,1)` takes the first character, `UPPER` makes capitals, `LEN` counts characters. `TEXT(7,"000")` turns the number 7 into `007`, handy for codes that must have a fixed width.',
          'Numbers and text behave differently: `"10"+5` works in a spreadsheet, but a name times 5 gives `#VALUE!`. Errors start with `#` and each has a meaning: `#DIV/0!` divides by zero, `#N/A` means “not found”, `#NAME?` means the function name is not recognised.',
        ),
      },
      {
        kind: 'demo', title: 'Summaries and labels', language: 'sheet',
        body: text('Look at the formulas in column D and in the label column. Change a score and watch the summary change, then press Calculate.'),
        sheet: { sheets: { Sheet1: grid('A1', [['Name', 'Score', null, 'Summary'], ['ada', 82, null, '=SUM(B2:B5)'], ['grace', 95, null, '=AVERAGE(B2:B5)'], ['linus', 70, null, '=MAX(B2:B5)'], ['sana', null, null, '=COUNT(B2:B5)'], [null, null, null, '=UPPER(LEFT(A2,1))&MID(A2,2,10)']]) } },
        code: '',
        notice: 'The blank score was not counted, and `COUNT` gave 3. The last formula shows a text function building a label from pieces.',
      },
      { kind: 'challenge', challengeId: 'xl-02-stats-block' },
      { kind: 'challenge', challengeId: 'xl-02-weekly-report' },
      { kind: 'challenge', challengeId: 'xl-02-badge' },
    ],
  },
  challenges: [
    {
      id: 'xl-02-stats-block', title: 'Quick Statistics', mode: 'learning', language: 'sheet', skillIds: ['xl.functions'], concepts: ['SUM', 'AVERAGE', 'MAX', 'MIN', 'COUNT'], difficulty: 1, context: 'education',
      prompt: text('A teacher keeps six test scores in A2:A7. Fill the five summary cells in E1:E5 (labels are in column D): the total, the average, the highest score, the lowest score and how many scores were entered.'),
      expectedBehavior: 'E1:E5 hold total, average, highest, lowest and count of the scores.',
      guidedSteps: ['E1: `=SUM(A2:A7)`.', 'E2: `=AVERAGE(A2:A7)`.', 'E3 and E4 use `MAX` and `MIN`; E5 uses `COUNT`.'],
      starterCode: '',
      sheet: { start: book({ A1: 'Score', ...grid('A2', [[78], [92], [65], [88], [71], [84]]), ...grid('D1', [['Total'], ['Average'], ['Highest'], ['Lowest'], ['Count']]) }), editable: ['E1:E5'] },
      hints: ['Each summary has its own function.', 'They all take the same range of scores.', 'COUNT counts numbers in the range.'],
      checks: [
        cells('The five summaries', { E1: 478, E2: 79.66666666666667, E3: 92, E4: 65, E5: 6 }, { approx: 1e-6 }),
        cells('Still right for other scores', { E1: 100, E2: 25, E3: 40, E4: 10, E5: 4 }, { with: { A2: 10, A3: 40, A4: 20, A5: 30, A6: '', A7: '' }, approx: 1e-6, visible: false }),
        isFormula('E1 is a formula', 'E1', 'SUM'),
      ],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'xl-02-weekly-report', objectiveId: 'xl-obj-summary', title: 'Weekly Production Report', mode: 'challenge', language: 'sheet', skillIds: ['xl.functions'], concepts: ['SUM', 'AVERAGE', 'ROUND', 'COUNT'], difficulty: 2, context: 'manufacturing',
      prompt: text('A plant logs units produced Monday to Friday in B2:B6 (a day with no entry means the line was stopped). Complete the report:', '- E2: total units for the week\n- E3: the average per **recorded** day, rounded to 1 decimal\n- E4: the best day’s output\n- E5: how many days were recorded', 'The report must still work when the numbers change.'),
      expectedBehavior: 'E2:E5 hold total, rounded average of recorded days, best day and recorded-day count.',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['Day', 'Units'], ['Mon', 120], ['Tue', 135], ['Wed', null], ['Thu', 128], ['Fri', 142]]), ...grid('D1', [['Weekly report'], ['Total'], ['Average (recorded days)'], ['Best day'], ['Days recorded']]) }), editable: ['E2:E5'] },
      hints: ['One function per figure.', 'AVERAGE already skips blank cells; rounding is a separate function wrapped around it.', 'Counting numbers is different from counting rows.'],
      checks: [
        cells('The report', { E2: 525, E3: 131.3, E4: 142, E5: 4 }, { approx: 1e-9 }),
        cells('Still right with other numbers', { E2: 130, E3: 43.3, E4: 60, E5: 3 }, { with: { B2: 10, B3: 60, B4: 60, B5: '', B6: '' }, approx: 1e-9, visible: false }),
        isFormula('E3 is a formula', 'E3', 'ROUND'),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'xl-02-weekly-report-b', objectiveId: 'xl-obj-summary', title: 'Monthly Spending Summary', mode: 'challenge', language: 'sheet', skillIds: ['xl.functions'], concepts: ['SUM', 'AVERAGE', 'ROUND', 'COUNT'], difficulty: 2, context: 'finance',
      prompt: text('A household lists the spending of each week in B2:B5 (a week with no entry means nothing was recorded). Complete the summary:', '- E2: total spent\n- E3: average spent per **recorded** week, rounded to 1 decimal\n- E4: the most expensive week\n- E5: how many weeks were recorded', 'It must keep working when the amounts change.'),
      expectedBehavior: 'E2:E5 hold total, rounded average of recorded weeks, largest week and recorded-week count.',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['Week', 'Spent'], ['W1', 210.5], ['W2', 180], ['W3', null], ['W4', 305.25]]), ...grid('D1', [['Summary'], ['Total'], ['Average (recorded weeks)'], ['Highest week'], ['Weeks recorded']]) }), editable: ['E2:E5'] },
      hints: ['There is a function for each figure.', 'A blank week must not count as zero spending in the average.', 'Rounding is one more function around the average.'],
      checks: [
        cells('The summary', { E2: 695.75, E3: 231.9, E4: 305.25, E5: 3 }, { approx: 1e-9 }),
        cells('Still right with other numbers', { E2: 90, E3: 45, E4: 50, E5: 2 }, { with: { B2: 50, B3: 40, B4: '', B5: '' }, approx: 1e-9, visible: false }),
        isFormula('E3 is a formula', 'E3', 'ROUND'),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'xl-02-badge', objectiveId: 'xl-obj-text', title: 'Name Badges', mode: 'challenge', language: 'sheet', skillIds: ['xl.functions'], concepts: ['LEFT', 'UPPER', 'text join'], difficulty: 3, context: 'business',
      prompt: text('Staff are listed with first name (A), last name (B) and department code (C). Build each badge label in column D in this exact style: the first initial with a dot, a space, the last name in capitals, a dash and the department:', '`J. SMITH-ENG`', 'Fill D2:D4.'),
      expectedBehavior: 'D2:D4 show labels like J. SMITH-ENG built from the three columns.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['First', 'Last', 'Dept', 'Badge'], ['jane', 'Smith', 'ENG'], ['Omar', 'khan', 'OPS'], ['li', 'Wei', 'HR']])), editable: ['D2:D4'] },
      hints: ['Three pieces of text are joined with one operator.', 'One function takes the first character; another changes case.', 'Literal text goes in quotes inside the formula.'],
      checks: [
        cells('Badges', { D2: 'J. SMITH-ENG', D3: 'O. KHAN-OPS', D4: 'L. WEI-HR' }),
        cells('Different people', { D2: 'A. LOVELACE-RND' }, { with: { A2: 'ada', B2: 'Lovelace', C2: 'RND' }, visible: false }),
        isFormula('D2 is a formula', 'D2', '&'),
      ],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'xl-02-badge-b', objectiveId: 'xl-obj-text', title: 'Product Codes', mode: 'challenge', language: 'sheet', skillIds: ['xl.functions'], concepts: ['TEXT', 'UPPER', 'text join'], difficulty: 3, context: 'retail',
      prompt: text('Stock items have a category (A, in any letter case) and a running number (B). Build each product code in column C: the category in capitals, a dash and the number padded to three digits:', '`TOOL-007`', 'Fill C2:C4.'),
      expectedBehavior: 'C2:C4 show codes like TOOL-007.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Category', 'Number', 'Code'], ['tool', 7], ['Paint', 112], ['GARDEN', 45]])), editable: ['C2:C4'] },
      hints: ['Join the pieces with the text operator.', 'Capitals need one function, padded numbers another.', 'The format `"000"` pads with zeros.'],
      checks: [
        cells('Codes', { C2: 'TOOL-007', C3: 'PAINT-112', C4: 'GARDEN-045' }),
        cells('Other items', { C2: 'LAMP-001' }, { with: { A2: 'lamp', B2: 1 }, visible: false }),
        isFormula('C2 is a formula', 'C2', 'TEXT|REPT|RIGHT'),
      ],
      xpReward: 65, coinReward: 10,
    },
  ],
  objectives: [
    { id: 'xl-obj-summary', title: 'Summarise a range with functions', summary: 'Total, average, extremes and counts of a range, including blanks and rounding.' },
    { id: 'xl-obj-text', title: 'Build text from pieces', summary: 'Combine text functions and joins to make consistent labels and codes.' },
  ],
};
