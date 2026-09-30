import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { book, cells, grid, isFormula } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'xl-06-cleaning', title: 'Cleaning Messy Data', language: 'sheet', skillId: 'xl.cleaning',
    blurb: 'TRIM, PROPER, SUBSTITUTE, FIND, MID, VALUE and DATE: turn real-world text into data you can use.', prerequisites: ['xl-02-functions'], xpReward: 60,
    reference: {
      title: 'Cleaning text and dates',
      body: text('`TRIM` removes extra spaces, `PROPER` capitalises Each Word, `SUBSTITUTE(text, old, new)` replaces pieces. `FIND(small, big)` gives the position of `small` inside `big`; `MID(text, start, length)` takes a slice.', '`VALUE("42")` turns text that looks like a number into a number. `DATE(year, month, day)` builds a real date; `MONTH`, `YEAR`, `DAY` and `WEEKDAY(date, 2)` (Monday = 1) read one back.'),
      example: '=PROPER(TRIM(A2))\n=VALUE(MID(A2,FIND("-",A2)+1,4))\n=DATE(2024,3,9)\n=WEEKDAY(DATE(2024,3,9),2)',
    },
    steps: [
      { kind: 'teach', title: 'Data arrives dirty', body: text('Exports from other systems have stray spaces, inconsistent capitals and numbers stored as text. A total that silently skips “42” because it is text is a classic spreadsheet bug. Cleaning is the first step of any analysis: look at the raw values, decide what they should be, then transform them with formulas so the cleaning is repeatable.', 'Never overwrite the raw column. Put the clean version beside it so you can always check your work.') },
      { kind: 'teach', title: 'Taking text apart', body: text('Codes like `NYC-2024-0042` hold several facts. `FIND("-", A2)` tells you where the first dash is, so `MID` can cut relative to it. Use `FIND` rather than counting characters: codes of different lengths then still work. Wrap a slice in `VALUE(...)` when you need a number.', 'Dates are numbers underneath. Build them with `DATE(y, m, d)` from separate parts rather than joining text, then ask questions with `MONTH`, `WEEKDAY` and friends.') },
      {
        kind: 'demo', title: 'Raw beside clean', language: 'sheet', body: text('Two rows with the same problem. See how the clean column stays correct for codes of different lengths. Press Calculate.'),
        sheet: { sheets: { Sheet1: grid('A1', [['Raw code', 'Year', 'Number'], ['NYC-2024-0042', '=VALUE(MID(A2,FIND("-",A2)+1,4))', '=VALUE(MID(A2,FIND("-",A2,FIND("-",A2)+1)+1,10))'], ['LA-2023-7', '=VALUE(MID(A3,FIND("-",A3)+1,4))', '=VALUE(MID(A3,FIND("-",A3,FIND("-",A3)+1)+1,10))']]) } },
        code: '', notice: 'The prefix has two or three letters, yet the year is found both times because the slice starts after the first dash.',
      },
      { kind: 'challenge', challengeId: 'xl-06-names' },
      { kind: 'challenge', challengeId: 'xl-06-ids' },
      { kind: 'challenge', challengeId: 'xl-06-dates' },
    ],
  },
  challenges: [
    {
      id: 'xl-06-names', title: 'Tidy the Names', mode: 'learning', language: 'sheet', skillIds: ['xl.cleaning'], concepts: ['TRIM', 'PROPER'], difficulty: 2, context: 'business',
      prompt: text('Column A holds customer names typed by hand, with stray spaces and odd capitals. In column B show each name cleaned: no extra spaces anywhere (single spaces between words) and Each Word Capitalised.'),
      expectedBehavior: 'B2:B4 show the names trimmed and capitalised.',
      guidedSteps: ['Try `=TRIM(A2)` first and see what changes.', 'Wrap that in `PROPER(...)`.'],
      starterCode: '',
      sheet: { start: book(grid('A1', [['Raw', 'Clean'], ['  aNa   lOPEZ ', null], ['BEN  o\'neil', null], ['caz   de la  cruz', null]])), editable: ['B2:B4'] },
      hints: ['Two problems: spacing and capitals.', 'One function fixes spacing between words as well as the ends.', 'Another fixes the capitals; use both together.'],
      checks: [
        cells('Clean names', { B2: 'Ana Lopez', B3: "Ben O'Neil", B4: 'Caz De La Cruz' }),
        cells('Other names', { B2: 'Li Wei', B3: 'Sam Reed', B4: 'Zoe' }, { with: { A2: '  li    WEI', A3: 'sAM reed ', A4: ' ZOE ' }, visible: false }),
        isFormula('B2 is a formula', 'B2', 'TRIM'),
      ],
      xpReward: 35, coinReward: 6,
    },
    {
      id: 'xl-06-ids', objectiveId: 'xl-obj-split-text', title: 'Split the Part Code', mode: 'challenge', language: 'sheet', skillIds: ['xl.cleaning'], concepts: ['FIND', 'MID', 'VALUE'], difficulty: 3, context: 'manufacturing',
      prompt: text('Part codes in column A look like `NYC-2024-0042`: a site prefix (2 or 3 letters), a year, and a serial number. In B show the year as a **number** and in C the serial as a **number** (no leading zeros). Codes have different prefix lengths.'),
      expectedBehavior: 'B holds the year and C the serial of each code, both numbers.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Code', 'Year', 'Serial'], ['NYC-2024-0042'], ['LA-2023-7'], ['BOS-2019-0310'], ['SF-2025-15']])), editable: ['B2:C5'] },
      hints: ['The dashes are reliable; the lengths are not.', 'Find a dash, then cut relative to it. Finding the SECOND dash needs a start position.', 'The slices are text; make them numbers.'],
      checks: [
        cells('Years and serials', { B2: 2024, C2: 42, B3: 2023, C3: 7, B4: 2019, C4: 310, B5: 2025, C5: 15 }),
        cells('Other codes', { B2: 2001, C2: 9, B3: 2030, C3: 1200, B4: 1999, C4: 1, B5: 2010, C5: 88 }, { with: { A2: 'SEA-2001-0009', A3: 'DC-2030-1200', A4: 'PDX-1999-1', A5: 'NY-2010-088' }, visible: false }),
        isFormula('B2 is a formula', 'B2', 'MID|LEFT|RIGHT'),
      ],
      xpReward: 75, coinReward: 12,
    },
    {
      id: 'xl-06-ids-b', objectiveId: 'xl-obj-split-text', title: 'Split the Sensor Tag', mode: 'challenge', language: 'sheet', skillIds: ['xl.cleaning'], concepts: ['FIND', 'MID', 'VALUE'], difficulty: 3, context: 'engineering',
      prompt: text('Sensor tags in column A look like `DET:L3:5521`: a plant code of any length, a line written `L` plus its number, and a serial. In B show the **line number** as a number and in C the **serial** as a number.'),
      expectedBehavior: 'B holds the line number and C the serial of each tag, both numbers.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Tag', 'Line', 'Serial'], ['DET:L3:5521'], ['AUS:L12:40'], ['NY:L1:9'], ['CHI:L7:1001']])), editable: ['B2:C5'] },
      hints: ['Separators are colons this time.', 'The line number sits between the first and second separator, after a letter.', 'The pieces are text until you say otherwise.'],
      checks: [
        cells('Lines and serials', { B2: 3, C2: 5521, B3: 12, C3: 40, B4: 1, C4: 9, B5: 7, C5: 1001 }),
        cells('Other tags', { B2: 20, C2: 3, B3: 4, C3: 77, B4: 11, C4: 8000, B5: 2, C5: 5 }, { with: { A2: 'PHX:L20:3', A3: 'LA:L4:77', A4: 'BOSTON:L11:8000', A5: 'X:L2:5' }, visible: false }),
        isFormula('B2 is a formula', 'B2', 'MID|LEFT|RIGHT|SUBSTITUTE'),
      ],
      xpReward: 75, coinReward: 12,
    },
    {
      id: 'xl-06-dates', objectiveId: 'xl-obj-date-parts', title: 'Quarter and Weekend', mode: 'challenge', language: 'sheet', skillIds: ['xl.cleaning'], concepts: ['DATE', 'MONTH', 'WEEKDAY'], difficulty: 3, context: 'business',
      prompt: text('Each order date is stored as text like `2024-03-09` in column A. In B show the **quarter number** (1 to 4) of the date, and in C show the text “Weekend” for a Saturday or Sunday and “Weekday” otherwise.'),
      expectedBehavior: 'B holds the quarter (1-4) and C Weekend or Weekday for each date.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Date text', 'Quarter', 'Kind'], ['2024-03-09'], ['2024-04-01'], ['2024-12-31'], ['2025-08-17']])), editable: ['B2:C5'] },
      hints: ['Text is not a date yet. Build a real one from its parts.', 'The quarter follows from the month by arithmetic.', 'One function numbers the days of the week; pick the numbering where Monday is 1.'],
      checks: [
        cells('Quarter and kind', { B2: 1, C2: 'Weekend', B3: 2, C3: 'Weekday', B4: 4, C4: 'Weekday', B5: 3, C5: 'Weekend' }),
        cells('Other dates', { B2: 3, C2: 'Weekday', B3: 1, C3: 'Weekend', B4: 2, C4: 'Weekend', B5: 4, C5: 'Weekday' }, { with: { A2: '2024-09-30', A3: '2024-01-07', A4: '2024-06-30', A5: '2024-10-01' }, visible: false }),
        isFormula('B2 is a formula', 'B2', 'MONTH|MID|DATE'),
      ],
      xpReward: 75, coinReward: 12,
    },
    {
      id: 'xl-06-dates-b', objectiveId: 'xl-obj-date-parts', title: 'Due Dates From Parts', mode: 'challenge', language: 'sheet', skillIds: ['xl.cleaning'], concepts: ['DATE', 'MONTH', 'WEEKDAY'], difficulty: 3, context: 'operations',
      prompt: text('Invoices list the year (A), month (B) and day (C) in separate columns. In D show the **quarter number** (1 to 4), and in E show “Weekend” for a Saturday or Sunday and “Weekday” otherwise.'),
      expectedBehavior: 'D holds the quarter and E Weekend or Weekday for each invoice date.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Year', 'Month', 'Day', 'Quarter', 'Kind'], [2024, 2, 29], [2024, 7, 13], [2025, 12, 1], [2025, 3, 31]])), editable: ['D2:E5'] },
      hints: ['You have the parts; make a date from them.', 'Quarter comes from the month.', 'Monday-first numbering makes the weekend the last two numbers.'],
      checks: [
        cells('Quarter and kind', { D2: 1, E2: 'Weekday', D3: 3, E3: 'Weekend', D4: 4, E4: 'Weekday', D5: 1, E5: 'Weekday' }),
        cells('Other dates', { D2: 2, E2: 'Weekend', D3: 4, E3: 'Weekend', D4: 3, E4: 'Weekday', D5: 1, E5: 'Weekday' }, { with: { A2: 2024, B2: 6, C2: 30, A3: 2024, B3: 10, C3: 5, A4: 2024, B4: 9, C4: 2, A5: 2024, B5: 3, C5: 29 }, visible: false }),
        isFormula('D2 is a formula', 'D2', 'MONTH|ROUNDUP|INT|CEILING|CHOOSE|IF'),
      ],
      xpReward: 75, coinReward: 12,
    },
  ],
  objectives: [
    { id: 'xl-obj-split-text', title: 'Splitting coded text', summary: 'Cut facts out of structured codes that vary in length.' },
    { id: 'xl-obj-date-parts', title: 'Working with dates', summary: 'Build dates from parts and ask calendar questions of them.' },
  ],
};
