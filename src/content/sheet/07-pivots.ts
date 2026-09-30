import { text } from '../helpers';
import type { Check, LessonBundle, SheetCheck } from '../schema';
import { book, grid } from './helpers';

const sales = grid('A1', [
  ['Region', 'Product', 'Units', 'Revenue'],
  ['East', 'Tools', 10, 100], ['West', 'Tools', 5, 50], ['East', 'Paint', 8, 40], ['North', 'Paint', 4, 20], ['West', 'Paint', 6, 30], ['East', 'Tools', 12, 120],
  ['North', 'Tools', 3, 30], ['West', 'Tools', 7, 70], ['East', 'Paint', 2, 10], ['North', 'Paint', 9, 45], ['West', 'Paint', 1, 5], ['North', 'Tools', 6, 60],
]);
const scrap = grid('A1', [
  ['Plant', 'Machine', 'Hours', 'Scrap'],
  ['Lyon', 'Press', 8, 12], ['Turin', 'Press', 6, 7], ['Lyon', 'Lathe', 8, 3], ['Lyon', 'Press', 7, 9], ['Turin', 'Lathe', 8, 4], ['Lyon', 'Lathe', 6, 2],
  ['Turin', 'Press', 8, 10], ['Lyon', 'Mill', 8, 5], ['Turin', 'Mill', 5, 1], ['Lyon', 'Mill', 4, 6],
]);
const pivot = (name: string, expect: (string | number)[][], opts: Partial<Extract<SheetCheck, { kind: 'pivot' }>> = {}): SheetCheck => ({ kind: 'pivot', name, expect, ...opts });

export const bundle: LessonBundle = {
  lesson: {
    id: 'xl-07-pivots', title: 'Pivot Tables and Charts', language: 'sheet', skillId: 'xl.pivot',
    blurb: 'Summarise thousands of rows by group with a pivot table, then choose a chart that answers the question.', prerequisites: ['xl-05-conditional'], xpReward: 65,
    reference: {
      title: 'Pivot tables and charts',
      body: text('A **pivot table** groups the rows of a table by one or more fields and aggregates another (sum, count, average, min, max). In the builder choose the **source range including the header row**, the field(s) to group by, the field to aggregate and how, and optional filters.', 'Pick a chart by the question: a **line** for change over time, a **column/bar** to compare categories, a **pie** only for the share of a whole with a few parts. Chart the summary, not the raw rows.'),
      example: 'Source: Sheet1!A1:D13\nRows: Region\nValues: sum of Revenue\nFilter: Product = Tools',
    },
    steps: [
      { kind: 'teach', title: 'Summaries without formulas', body: text('`SUMIF` answers one question per formula. A pivot table answers a whole family: “revenue by region”, “units by product for the East”, “count of orders per month”. You choose the grouping field, the value field and the aggregate; the table redraws whenever you change the choices.', 'The most common mistakes: a source range that stops short of the last row, aggregating the wrong field, or summing a field when the question wanted a count or an average.') },
      { kind: 'teach', title: 'Charts are answers', body: text('A chart is a claim about the data. Ask what the reader should see: a trend (line), a comparison (column or bar), a share of the whole (pie). Then chart the **summary range** with its labels, not a whole raw column.') },
      {
        kind: 'demo', title: 'Build a pivot', language: 'sheet', body: text('Use the pivot builder below: source `Sheet1!A1:D13`, rows `Region`, values `sum of Revenue`. Then add a filter on Product. Press Calculate when you have tried it.'),
        sheet: { sheets: { Sheet1: sales }, pivots: [{ source: 'Sheet1!A1:D13', rows: ['Region'], values: [{ field: 'Revenue', agg: 'sum' }] }] },
        code: '', notice: 'Each region appears once. Add the Product filter and the totals shrink: the pivot always reads the current data.',
      },
      { kind: 'challenge', challengeId: 'xl-07-pivot-region' },
      { kind: 'challenge', challengeId: 'xl-07-pivot-filter' },
      { kind: 'challenge', challengeId: 'xl-07-chart-trend' },
    ],
  },
  challenges: [
    {
      id: 'xl-07-pivot-region', title: 'Revenue by Region', mode: 'learning', language: 'sheet', skillIds: ['xl.pivot'], concepts: ['pivot table', 'sum'], difficulty: 2, context: 'business',
      prompt: text('Build a pivot table that shows the **total Revenue for each Region**.'),
      expectedBehavior: 'A pivot with one row per region and the sum of Revenue.',
      guidedSteps: ['Source range: `Sheet1!A1:D13` (include the header row).', 'Group by Region.', 'Aggregate Revenue as a sum.'],
      starterCode: '',
      sheet: { start: book(sales), editable: [], pivot: true },
      hints: ['You are grouping rows, then adding one column.', 'The source range includes the header row and every data row.', 'The aggregate is a sum, not a count.'],
      checks: [
        pivot('Totals by region', [['East', 270], ['North', 155], ['West', 155]]),
        pivot('Other numbers', [['East', 1170], ['North', 155], ['West', 155]], { with: { D2: 1000 }, visible: false }),
      ] as Check[],
      xpReward: 35, coinReward: 6,
    },
    {
      id: 'xl-07-pivot-filter', objectiveId: 'xl-obj-pivot-filter', title: 'East Units by Product', mode: 'challenge', language: 'sheet', skillIds: ['xl.pivot'], concepts: ['pivot table', 'filter'], difficulty: 3, context: 'retail',
      prompt: text('Show the **units sold for each Product**, counting only the **East** region.'),
      expectedBehavior: 'A pivot with one row per product, summing Units, filtered to the East region.',
      starterCode: '',
      sheet: { start: book(sales), editable: [], pivot: true },
      hints: ['One grouping field, one value field, and a condition on another field.', 'Restrict which rows are summarised before grouping.', 'Units, not revenue.'],
      checks: [
        pivot('Units by product', [['Paint', 10], ['Tools', 22]]),
        pivot('Other numbers', [['Paint', 10], ['Tools', 40]], { with: { C2: 28 }, visible: false }),
        pivot('Other region data', [['Paint', 2], ['Tools', 27]], { with: { A3: 'East', A4: 'West' }, visible: false }),
      ] as Check[],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-07-pivot-filter-b', objectiveId: 'xl-obj-pivot-filter', title: 'Lyon Scrap by Machine', mode: 'challenge', language: 'sheet', skillIds: ['xl.pivot'], concepts: ['pivot table', 'filter'], difficulty: 3, context: 'manufacturing',
      prompt: text('Show the **total scrap for each Machine**, counting only runs at the **Lyon** plant.'),
      expectedBehavior: 'A pivot with one row per machine, summing Scrap, filtered to Lyon.',
      starterCode: '',
      sheet: { start: book(scrap), editable: [], pivot: true },
      hints: ['Group by one field and add another.', 'Only some rows belong in the answer; say which.', 'Scrap, not hours.'],
      checks: [
        pivot('Scrap by machine', [['Lathe', 5], ['Mill', 11], ['Press', 21]]),
        pivot('Other numbers', [['Lathe', 5], ['Mill', 11], ['Press', 30]], { with: { D2: 21 }, visible: false }),
        pivot('Other plant data', [['Lathe', 4], ['Mill', 1], ['Press', 17]], { with: { A2: 'Turin', A3: 'Lyon', A4: 'Turin', A5: 'Turin', A6: 'Lyon', A7: 'Turin', A8: 'Lyon', A9: 'Turin', A10: 'Lyon', A11: 'Turin', D3: 7, D6: 4, D8: 10, D10: 1 }, visible: false }),
      ] as Check[],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-07-chart-trend', objectiveId: 'xl-obj-chart-trend', title: 'Chart the Monthly Trend', mode: 'challenge', language: 'sheet', skillIds: ['xl.pivot'], concepts: ['chart choice'], difficulty: 2, context: 'finance',
      prompt: text('Monthly revenue is in A1:B7. Make a chart that lets a manager see **how revenue changed over the months**, using the month labels and the revenue figures.'),
      expectedBehavior: 'A line chart with months as labels and revenue as the series.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Month', 'Revenue'], ['Jan', 120], ['Feb', 135], ['Mar', 128], ['Apr', 160], ['May', 172], ['Jun', 190]])), editable: [], chart: true },
      hints: ['The question is about change over time.', 'Labels are the months, data is the revenue column without its header.', 'One chart type is designed for trends.'],
      checks: [{ kind: 'chart', name: 'A trend chart', types: ['line', 'column'], categories: 'A2:A7', series: ['B2:B7'], hint: 'Choose a chart type that shows change over time.' }, { kind: 'chart', name: 'Line for time', types: ['line'], categories: 'A2:A7', series: ['B2:B7'], visible: false, hint: 'Across ordered time periods a line shows the direction best.' }] as Check[],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'xl-07-chart-trend-b', objectiveId: 'xl-obj-chart-trend', title: 'Chart Defects Over the Week', mode: 'challenge', language: 'sheet', skillIds: ['xl.pivot'], concepts: ['chart choice'], difficulty: 2, context: 'manufacturing',
      prompt: text('Daily defect counts are in A1:B6. Make a chart that shows **whether defects are rising or falling through the week**.'),
      expectedBehavior: 'A line chart with days as labels and defect counts as the series.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Day', 'Defects'], ['Mon', 14], ['Tue', 11], ['Wed', 12], ['Thu', 8], ['Fri', 5]])), editable: [], chart: true },
      hints: ['Think about what the reader must notice.', 'Days are ordered; defects are the measured values.', 'Use the labels as categories and the counts as the series.'],
      checks: [{ kind: 'chart', name: 'A trend chart', types: ['line', 'column'], categories: 'A2:A6', series: ['B2:B6'], hint: 'Choose a chart type that shows change over time.' }, { kind: 'chart', name: 'Line for time', types: ['line'], categories: 'A2:A6', series: ['B2:B6'], visible: false, hint: 'A trend through ordered days is clearest as a line.' }] as Check[],
      xpReward: 50, coinReward: 8,
    },
  ],
  objectives: [
    { id: 'xl-obj-pivot-filter', title: 'Filtered pivot summaries', summary: 'Group, aggregate and restrict rows to answer a specific question.' },
    { id: 'xl-obj-chart-trend', title: 'Choosing a chart for the question', summary: 'Pick a chart type and the right ranges for a trend.' },
  ],
};
