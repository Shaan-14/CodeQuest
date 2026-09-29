import { sqlRes, text } from '../helpers';
import type { LessonBundle } from '../schema';

const START = '-- Write your query below\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-02-sort-limit', title: 'Ranking and Listing', language: 'sql', skillId: 'sql.select',
    blurb: 'ORDER BY, LIMIT and DISTINCT: top-N questions and unique values.', prerequisites: ['sql-01-select'], xpReward: 40,
    reference: {
      title: 'ORDER BY, LIMIT, DISTINCT',
      body: text(
        'Rows have **no guaranteed order** unless you ask: `ORDER BY price DESC` (largest first; `ASC`, the default, is smallest first). Sort by several columns with commas: `ORDER BY category, price DESC`.',
        '`LIMIT 3` keeps the first three rows **after** sorting, so “the three most expensive” is `ORDER BY price DESC LIMIT 3`. `SELECT DISTINCT category FROM products` returns each different value once.',
      ),
      example: 'SELECT name, price FROM products\nORDER BY price DESC\nLIMIT 3;',
    },
    steps: [
      {
        kind: 'teach', title: 'Order matters',
        body: text(
          'A database table is a **set** of rows: it has no natural order. If you want the results in a particular order (or want “the top three”), you must say so with `ORDER BY`. Combined with `LIMIT`, it answers the most common question in analytics: *what are the biggest, smallest, newest, or best?*',
          '`DISTINCT` answers a different common question: *what different values exist?* For example, which categories do we sell in?',
        ),
      },
      {
        kind: 'demo', title: 'Sort and cut', language: 'sql', db: 'market',
        body: text('Run it, then change `DESC` to `ASC` and predict what changes.'),
        code: 'SELECT name, category, price\nFROM products\nORDER BY price DESC\nLIMIT 4;',
        notice: 'Sorting happened BEFORE the limit: we got the four most expensive products, not four random ones. Without `ORDER BY`, `LIMIT 4` would just give “some four rows”.',
      },
      {
        kind: 'demo', title: 'Different values only', language: 'sql', db: 'market',
        body: text('Compare the two queries: how many rows does each return?'),
        code: 'SELECT category FROM products;\nSELECT DISTINCT category FROM products ORDER BY category;',
        notice: 'The first query repeats each category once per product. `DISTINCT` collapsed the repeats. When two statements are run together you see the result of each.',
      },
      { kind: 'challenge', challengeId: 'sql-02-priciest' },
      { kind: 'challenge', challengeId: 'sql-02-costly-machines' },
      { kind: 'challenge', challengeId: 'sql-02-categories' },
    ],
  },
  objectives: [
    { id: 'sql-obj-top-n', title: 'Top N by a measure', summary: 'Sort by a column and keep only the first few rows.' },
    { id: 'sql-obj-distinct', title: 'List the different values', summary: 'Use DISTINCT (with ORDER BY) to list each value that occurs once.' },
  ],
  challenges: [
    {
      id: 'sql-02-priciest', title: 'The Top Three', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.select'], concepts: ['ORDER BY', 'DESC', 'LIMIT'], difficulty: 2, context: 'retail',
      prompt: text('Show the **name** and **price** of the **three most expensive** products, most expensive first.'),
      expectedBehavior: 'Three rows, name and price, in descending price order.',
      guidedSteps: ['Choose the two columns from `products`.', 'Sort with `ORDER BY price DESC`.', 'Keep three rows with `LIMIT 3`.'],
      starterCode: START,
      hints: ['Two ideas: sorting, and keeping only a few.', 'The sort comes first; `LIMIT` cuts after it.', 'After `FROM products`, sort with `ORDER BY price DESC`, then keep three rows with `LIMIT`.'],
      checks: sqlRes('SELECT name, price FROM products ORDER BY price DESC LIMIT 3', 'market', ['market-b'], { ordered: true }),
      xpReward: 45, coinReward: 6,
    },
    {
      id: 'sql-02-costly-machines', objectiveId: 'sql-obj-top-n', title: 'The Big Spenders', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.select'], concepts: ['ORDER BY', 'DESC', 'LIMIT'], difficulty: 2, context: 'manufacturing',
      prompt: text('Finance wants the **three machines that cost the most** to buy. Show each machine’s **name** and **purchase cost**, most expensive first.'),
      expectedBehavior: 'Three rows: name and purchase_cost, highest cost first.',
      starterCode: '',
      hints: ['You want the biggest values of one column.', 'Sort so the biggest come first, then keep only the first few.', '`ORDER BY purchase_cost DESC LIMIT 3`'],
      checks: sqlRes('SELECT name, purchase_cost FROM machines ORDER BY purchase_cost DESC LIMIT 3', 'works', ['works-b'], { ordered: true }),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-02-best-paid', objectiveId: 'sql-obj-top-n', title: 'The Best Paid', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.select'], concepts: ['ORDER BY', 'DESC', 'LIMIT'], difficulty: 2, context: 'human resources',
      prompt: text('HR is reviewing pay. Show the **name** and **hourly rate** of the **five best-paid employees**, highest rate first.'),
      expectedBehavior: 'Five rows: name and hourly_rate, highest first.',
      starterCode: '',
      hints: ['It is the same shape of question as before, on a different table.', 'Sort by the rate, biggest first, and keep the first few.', '`ORDER BY hourly_rate DESC LIMIT 5`'],
      checks: sqlRes('SELECT name, hourly_rate FROM employees ORDER BY hourly_rate DESC LIMIT 5', 'works', ['works-b'], { ordered: true }),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-02-categories', objectiveId: 'sql-obj-distinct', title: 'What Do We Sell?', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.select'], concepts: ['DISTINCT', 'ORDER BY'], difficulty: 2, context: 'retail',
      prompt: text('List every product **category** that exists, **each one once**, in alphabetical order.'),
      expectedBehavior: 'One column of category names, no repeats, A to Z.',
      starterCode: '',
      hints: ['The products table repeats a category once per product.', 'There is a keyword that removes repeated rows from the result.', 'Put `DISTINCT` right after `SELECT`, and sort with `ORDER BY category`.'],
      checks: sqlRes('SELECT DISTINCT category FROM products ORDER BY category', 'market', ['market-b'], { ordered: true }),
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'sql-02-machine-types', objectiveId: 'sql-obj-distinct', title: 'Kinds of Machine', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.select'], concepts: ['DISTINCT', 'ORDER BY'], difficulty: 2, context: 'manufacturing',
      prompt: text('The plant manager wants to know **what types of machine** the factory has. List each `machine_type` **once**, in alphabetical order.'),
      expectedBehavior: 'One column of machine types, no repeats, A to Z.',
      starterCode: '',
      hints: ['Several machines share a type.', 'You want each type to appear only once.', 'Put `DISTINCT` right after `SELECT`, and sort the result by the same column.'],
      checks: sqlRes('SELECT DISTINCT machine_type FROM machines ORDER BY machine_type', 'works', ['works-b'], { ordered: true }),
      xpReward: 50, coinReward: 8,
    },
  ],
};
