import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { book, cells, grid, isFormula } from './helpers';

const sales = (rows: (string | number)[][]) => grid('A1', [['Region', 'Rep', 'Product', 'Amount'], ...rows]);

export const bundle: LessonBundle = {
  lesson: {
    id: 'xl-05-conditional', title: 'Totals With Conditions', language: 'sheet', skillId: 'xl.conditional',
    blurb: 'SUMIF, SUMIFS, COUNTIF(S) and AVERAGEIF: answer “how much of this kind?” without filtering by hand.', prerequisites: ['xl-03-logic'], xpReward: 60,
    reference: {
      title: 'Conditional summaries',
      body: text('`=SUMIF(range, test, sum_range)` adds the cells of `sum_range` on rows where `range` meets the test. `COUNTIF(range, test)` counts those rows and `AVERAGEIF` averages them.', '`SUMIFS(sum_range, range1, test1, range2, test2)` needs ALL tests to hold (note: the sum range comes FIRST). Tests are text like `"East"`, `">100"` or `"<>North"`.'),
      example: '=SUMIF(A2:A9,"East",D2:D9)\n=SUMIFS(D2:D9,A2:A9,"East",C2:C9,"Tools")\n=COUNTIF(D2:D9,">=100")\n=AVERAGEIF(A2:A9,"West",D2:D9)',
    },
    steps: [
      { kind: 'teach', title: 'Summing only what matches', body: text('A sales list mixes regions and products. To answer “how much did the East region sell?” you could filter and read the total, but that answer goes stale when the data changes. `SUMIF` keeps the answer alive: it looks down one column for a match and adds the amounts beside the matches.', 'The test is text. `"East"` matches East (case does not matter). `">100"` matches numbers above 100. `"<>East"` matches everything except East. A test that names no operator means “equals”.') },
      { kind: 'teach', title: 'Two conditions, counts and averages', body: text('`SUMIFS` takes the **sum range first**, then pairs of (range, test); a row counts only if every pair holds. `COUNTIF(S)` counts matching rows and `AVERAGEIF(S)` averages the amounts on them.', 'A common error is to average the whole column, or to divide a total by a count of something else. Decide which rows are in the group first, then pick the function.') },
      {
        kind: 'demo', title: 'Summaries that follow the data', language: 'sheet', body: text('Change an amount or a region in the table and watch the summaries move. Press Calculate after you try it.'),
        sheet: { sheets: { Sheet1: { ...sales([['East', 'Ana', 'Tools', 120], ['West', 'Ben', 'Paint', 80], ['East', 'Caz', 'Paint', 60], ['West', 'Dev', 'Tools', 200]]), ...grid('F1', [['East total', '=SUMIF(A2:A5,"East",D2:D5)'], ['East tools', '=SUMIFS(D2:D5,A2:A5,"East",C2:C5,"Tools")'], ['Big sales', '=COUNTIF(D2:D5,">=100")'], ['West average', '=AVERAGEIF(A2:A5,"West",D2:D5)']]) } } },
        code: '', notice: 'Each summary counts only the rows that match. Edit a region to see a total jump.',
      },
      { kind: 'challenge', challengeId: 'xl-05-region-total' },
      { kind: 'challenge', challengeId: 'xl-05-rep-quarter' },
      { kind: 'challenge', challengeId: 'xl-05-shift-summary' },
    ],
  },
  challenges: [
    {
      id: 'xl-05-region-total', title: 'Region Total', mode: 'learning', language: 'sheet', skillIds: ['xl.conditional'], concepts: ['SUMIF'], difficulty: 2, context: 'business',
      prompt: text('The table lists sales by region. In G1 show the total Amount sold in the **East** region, using a formula that keeps working when amounts change.'),
      expectedBehavior: 'G1 holds the sum of Amount on the East rows.',
      guidedSteps: ['In G1 type `=SUMIF(A2:A7,"East",D2:D7)`.', 'Change a region in the table and see the total move.'],
      starterCode: '',
      sheet: { start: book(sales([['East', 'Ana', 'Tools', 120], ['West', 'Ben', 'Paint', 80], ['East', 'Caz', 'Paint', 60], ['North', 'Dev', 'Tools', 200], ['east', 'Eli', 'Tools', 15], ['West', 'Fay', 'Paint', 40]])), editable: ['G1'] },
      hints: ['Only some rows count.', 'One function adds one column based on a test in another.', 'The test is text in quotes.'],
      checks: [
        cell1('East total', 195),
        { kind: 'cell', name: 'Other data', cell: 'G1', expect: 70, with: { A2: 'West', A3: 'East', A4: 'West', A5: 'East', A6: 'West', A7: 'West', D3: 60, D5: 10 }, visible: false },
        isFormula('G1 is a formula', 'G1', 'SUMIF'),
      ],
      xpReward: 35, coinReward: 6,
    },
    {
      id: 'xl-05-rep-quarter', objectiveId: 'xl-obj-sumifs', title: 'East Tools Sales', mode: 'challenge', language: 'sheet', skillIds: ['xl.conditional'], concepts: ['SUMIFS'], difficulty: 3, context: 'retail',
      prompt: text('Show in G1 the total Amount for sales in the **East** region of the **Tools** product, and in G2 how many sales were in the East region with an Amount of **100 or more**.'),
      expectedBehavior: 'G1 is the East Tools total; G2 counts East sales of 100 or more.',
      starterCode: '',
      sheet: { start: book({ ...sales([['East', 'Ana', 'Tools', 120], ['West', 'Ben', 'Tools', 80], ['East', 'Caz', 'Paint', 100], ['East', 'Dev', 'Tools', 90], ['West', 'Eli', 'Paint', 300], ['East', 'Fay', 'Tools', 100]]) }), editable: ['G1:G2'] },
      hints: ['Both questions need two conditions at once.', 'The summing function with an S at the end takes the range to add FIRST.', 'Numeric tests are text too, such as “>=50”.'],
      checks: [
        cells('Answers', { G1: 310, G2: 3 }),
        cells('Other data', { G1: 139, G2: 1 }, { with: { A2: 'West', A3: 'East', D3: 99, A4: 'East', D5: 40, A6: 'West', A7: 'West' }, visible: false }),
        isFormula('G1 is a formula', 'G1', 'SUMIFS'),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-05-rep-quarter-b', objectiveId: 'xl-obj-sumifs', title: 'Night-Shift Scrap', mode: 'challenge', language: 'sheet', skillIds: ['xl.conditional'], concepts: ['SUMIFS'], difficulty: 3, context: 'manufacturing',
      prompt: text('Each row is a production run: shift (A), line (B), part (C) and units scrapped (D). In G1 show the units scrapped on the **Night** shift for **Line 2**, and in G2 the number of runs with **5 or more** scrapped units on the Night shift.'),
      expectedBehavior: 'G1 is Night / Line 2 scrap; G2 counts Night runs with 5 or more scrapped.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Shift', 'Line', 'Part', 'Scrap'], ['Night', 'Line 2', 'Gear', 4], ['Day', 'Line 2', 'Gear', 9], ['Night', 'Line 1', 'Cam', 7], ['Night', 'Line 2', 'Cam', 5], ['Day', 'Line 1', 'Gear', 2], ['Night', 'Line 2', 'Gear', 6]])), editable: ['G1:G2'] },
      hints: ['Two conditions for the total, two for the count.', 'Sum range first, then pairs of range and test.', 'A count with two conditions has its own function.'],
      checks: [
        cells('Answers', { G1: 15, G2: 3 }),
        cells('Other data', { G1: 9, G2: 1 }, { with: { A2: 'Day', A3: 'Night', A4: 'Day', A5: 'Day', A7: 'Night', B7: 'Line 1', D7: 0 }, visible: false }),
        isFormula('G1 is a formula', 'G1', 'SUMIFS'),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-05-shift-summary', objectiveId: 'xl-obj-group-stats', title: 'Clinic Wait Summary', mode: 'challenge', language: 'sheet', skillIds: ['xl.conditional'], concepts: ['COUNTIF', 'AVERAGEIF', 'SUMIF'], difficulty: 3, context: 'healthcare',
      prompt: text('Each row is a clinic visit: the clinic (A), the patient (B) and minutes waited (D). Fill a summary for **North** in G1:G3: how many visits, the **average** wait, and the share of the North total wait that came from waits over **30** minutes (a fraction between 0 and 1).'),
      expectedBehavior: 'G1 visit count, G2 average wait, G3 fraction of total wait from waits over 30 minutes, all for North.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Clinic', 'Patient', 'Type', 'Wait'], ['North', 'P1', 'walk-in', 20], ['South', 'P2', 'booked', 50], ['North', 'P3', 'walk-in', 40], ['North', 'P4', 'booked', 10], ['South', 'P5', 'walk-in', 35], ['North', 'P6', 'booked', 50]])), editable: ['G1:G3'] },
      hints: ['Three separate answers, all restricted to one clinic.', 'The share is one conditional total divided by another.', 'Over 30 and North are both conditions for the top part.'],
      checks: [
        cells('Summary', { G1: 4, G2: 30, G3: 0.75 }, { approx: 1e-9 }),
        cells('Other data', { G1: 2, G2: 15, G3: 0 }, { with: { A2: 'South', A4: 'South', A5: 'North', D5: 20, A6: 'South', D7: 10 }, approx: 1e-9, visible: false }),
        isFormula('G2 is a formula', 'G2', 'AVERAGEIF|SUMIF|AVERAGE'),
      ],
      xpReward: 75, coinReward: 12,
    },
  ],
  objectives: [
    { id: 'xl-obj-sumifs', title: 'Totals and counts with two conditions', summary: 'Combine conditions so the summary follows the data.' },
    { id: 'xl-obj-group-stats', title: 'Group statistics', summary: 'Counts, averages and shares for one group.' },
  ],
};

function cell1(name: string, expect: number) {
  return { kind: 'cell' as const, name, cell: 'G1', expect };
}
