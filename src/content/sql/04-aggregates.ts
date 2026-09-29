import { sqlRes, text } from '../helpers';
import type { LessonBundle } from '../schema';

const START = '-- Write your query below\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-04-aggregates', title: 'Summarising Many Rows', language: 'sql', skillId: 'sql.aggregate',
    blurb: 'COUNT, SUM, AVG, MIN and MAX; COUNT(*) versus COUNT(column).', prerequisites: ['sql-03-null'], xpReward: 45,
    reference: {
      title: 'Aggregate functions',
      body: text(
        '`COUNT(*)` counts rows. `SUM(x)`, `AVG(x)`, `MIN(x)`, `MAX(x)` summarise a column. Several rows collapse into one. Combine with `WHERE` to summarise only some rows. `ROUND(x, 2)` rounds.',
        '**Aggregates ignore NULLs**, except `COUNT(*)`. `COUNT(col)` counts rows where col is not NULL, so `COUNT(*) - COUNT(col)` counts the missing ones. `COUNT(DISTINCT col)` counts different values.',
      ),
      example: 'SELECT COUNT(*), SUM(stock), ROUND(AVG(price), 2)\nFROM products WHERE category = \'Tools\';',
    },
    steps: [
      {
        kind: 'teach', title: 'From rows to answers',
        body: text(
          'So far each result row was one thing in the table. **Aggregate functions** collapse many rows into a single answer: how many orders, what total, what average. They are the heart of reporting: revenue this month, average downtime, highest reading.',
          'One detail to remember all lesson: most aggregates **skip NULL values**. That is usually what you want, but you must know it is happening.',
        ),
      },
      {
        kind: 'demo', title: 'Five summaries at once', language: 'sql', db: 'market',
        body: text('Run it and read each column against its function.'),
        code: 'SELECT COUNT(*) AS products,\n       SUM(stock) AS units_in_stock,\n       ROUND(AVG(price), 2) AS avg_price,\n       MIN(price) AS cheapest,\n       MAX(price) AS priciest\nFROM products;',
        notice: 'One row came back, however many products there are. Every column is a different summary of the same rows. `ROUND` tidied the average.',
      },
      {
        kind: 'demo', title: 'COUNT(*) versus COUNT(column)', language: 'sql', db: 'market',
        body: text('Some customers have no city. Predict how the two counts differ.'),
        code: 'SELECT COUNT(*) AS customers,\n       COUNT(city) AS with_a_city,\n       COUNT(DISTINCT city) AS different_cities\nFROM customers;',
        notice: '`COUNT(*)` counted every row; `COUNT(city)` skipped the NULLs; `COUNT(DISTINCT city)` counted each city once. Choosing the wrong one is a very common source of wrong totals.',
      },
      { kind: 'challenge', challengeId: 'sql-04-paid-orders' },
      { kind: 'challenge', challengeId: 'sql-04-machine-three' },
      { kind: 'challenge', challengeId: 'sql-04-recorded-defects' },
    ],
  },
  objectives: [
    { id: 'sql-obj-single-summary', title: 'Summarise a filtered set of rows', summary: 'Use aggregate functions together with WHERE to produce one summary row.' },
    { id: 'sql-obj-count-null', title: 'COUNT(*) versus COUNT(column)', summary: 'Count rows and count recorded values, knowing that aggregates skip NULLs.' },
  ],
  challenges: [
    {
      id: 'sql-04-paid-orders', title: 'How Many Paid?', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.aggregate'], concepts: ['COUNT', 'WHERE'], difficulty: 1, context: 'retail',
      prompt: text('How many orders have the status `paid`? Return a single number.'),
      expectedBehavior: 'One row, one column: the number of paid orders.',
      guidedSteps: ['`COUNT(*)` counts rows.', 'Add a `WHERE` so only paid orders are counted.'],
      starterCode: START,
      hints: ['You want one number, not a list.', 'A function counts rows; a condition chooses which rows.', "Use `COUNT(*)`, and add a `WHERE` on the `status` column."],
      checks: sqlRes("SELECT COUNT(*) FROM orders WHERE status = 'paid'", 'market', ['market-b']),
      xpReward: 40, coinReward: 6,
    },
    {
      id: 'sql-04-machine-three', objectiveId: 'sql-obj-single-summary', title: 'Machine 3 at a Glance', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.aggregate'], concepts: ['aggregate functions', 'WHERE'], difficulty: 2, context: 'manufacturing',
      prompt: text('For the production runs of **machine 3** only, return **two columns in one row**: the **total units made** and the **average hours per run**.'),
      expectedBehavior: 'One row, two columns: total units_made and average hours for machine 3.',
      starterCode: '',
      hints: ['You want two summaries of the same set of rows.', 'Filter to the machine first, then summarise.', '`SUM(units_made), AVG(hours)` with `WHERE machine_id = 3`.'],
      checks: sqlRes('SELECT SUM(units_made), AVG(hours) FROM production_runs WHERE machine_id = 3', 'works', ['works-b'], { approx: 1e-6 }),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-04-electrical-prices', objectiveId: 'sql-obj-single-summary', title: 'Electrical Price Range', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.aggregate'], concepts: ['aggregate functions', 'WHERE'], difficulty: 2, context: 'retail',
      prompt: text('For products in the **Electrical** category, return three columns in one row: the **cheapest price**, the **highest price** and the **average price**.'),
      expectedBehavior: 'One row: minimum, maximum and average price of Electrical products.',
      starterCode: '',
      hints: ['Three different summaries of the same filtered rows.', 'Choose the category with a condition, then use one function per column.', "Use `MIN(price)`, `MAX(price)` and `AVG(price)`, with a `WHERE` on the category column."],
      checks: sqlRes("SELECT MIN(price), MAX(price), AVG(price) FROM products WHERE category = 'Electrical'", 'market', ['market-b'], { approx: 1e-6 }),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-04-recorded-defects', objectiveId: 'sql-obj-count-null', title: 'Counted and Uncounted', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.aggregate'], concepts: ['COUNT', 'NULL'], difficulty: 3, context: 'quality control',
      prompt: text('Quality control wants to know how complete the defect data is. In one row, return **how many production runs have a recorded defect count** (call it `recorded`) and **how many do not** (call it `missing`).'),
      expectedBehavior: 'One row: recorded and missing.',
      starterCode: '',
      hints: ['There are two different counts hiding in one column.', 'One kind of count skips NULLs and one kind counts every row.', '`COUNT(units_defective)` counts recorded values; `COUNT(*) - COUNT(units_defective)` counts the missing ones.'],
      checks: sqlRes('SELECT COUNT(units_defective) AS recorded, COUNT(*) - COUNT(units_defective) AS missing FROM production_runs', 'works', ['works-b'], { columns: 'names' }),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'sql-04-known-cities', objectiveId: 'sql-obj-count-null', title: 'Where Are Our Customers?', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.aggregate'], concepts: ['COUNT', 'NULL'], difficulty: 3, context: 'marketing',
      prompt: text('Marketing wants to know how well the city field is filled in. In one row, return **how many customers have a known city** (`known`) and **how many different cities** they live in (`cities`).'),
      expectedBehavior: 'One row: known and cities.',
      starterCode: '',
      hints: ['Some customers have no city. Which count ignores them?', 'One column counts recorded values; the other counts the different values.', '`COUNT(city)` and `COUNT(DISTINCT city)`.'],
      checks: sqlRes('SELECT COUNT(city) AS known, COUNT(DISTINCT city) AS cities FROM customers', 'market', ['market-b'], { columns: 'names' }),
      xpReward: 70, coinReward: 10,
    },
  ],
};
