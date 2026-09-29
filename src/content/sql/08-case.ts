import { sqlRes, text } from '../helpers';
import type { Constraint, LessonBundle } from '../schema';

const START = '-- Write your query below\n';
const CASE: Constraint = { type: 'requires', node: 'sql:\\bcase\\b', message: 'Use a CASE expression.' };

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-08-case', title: 'Decisions Inside a Query', language: 'sql', skillId: 'sql.advanced',
    blurb: 'CASE: labelling rows into bands, and counting conditionally.', prerequisites: ['sql-07-left-join'], xpReward: 50,
    reference: {
      title: 'CASE',
      body: text(
        '`CASE WHEN condition THEN result WHEN condition THEN result ELSE fallback END` is SQL’s if / elif / else, used **inside** a query. Conditions are tested top to bottom and the first true one wins, so order them from most specific.',
        '**Bucketing**: `CASE WHEN price < 10 THEN \'cheap\' ... END AS band`. **Conditional aggregation**: put a CASE inside an aggregate to count or sum only some rows per group: `SUM(CASE WHEN status = \'paid\' THEN 1 ELSE 0 END)`.',
      ),
      example: "SELECT name,\n       CASE WHEN price < 10 THEN 'cheap'\n            WHEN price < 50 THEN 'standard'\n            ELSE 'premium' END AS band\nFROM products;",
    },
    steps: [
      {
        kind: 'teach', title: 'if / elif / else, in SQL',
        body: text(
          'You already know decisions from Python: `if`, `elif`, `else`. SQL has the same idea for use inside queries, called `CASE`. It lets you **label** rows (“cheap”, “standard”, “premium”) and, combined with aggregates, **count several things in one pass** (paid orders and returned orders side by side).',
        ),
      },
      {
        kind: 'demo', title: 'Labelling rows', language: 'sql', db: 'market',
        body: text('Each product gets a band. Notice how the conditions are ordered.'),
        code: "SELECT name, price,\n       CASE WHEN price < 30 THEN 'cheap'\n            WHEN price < 90 THEN 'standard'\n            ELSE 'premium' END AS band\nFROM products\nORDER BY price\nLIMIT 8;",
        notice: 'The first matching `WHEN` wins, so the second condition does not need to say “and at least 30”: rows under 30 never reach it. Swap the order of the first two `WHEN`s and everything under 90 becomes “standard”.',
      },
      {
        kind: 'demo', title: 'Counting in categories with SUM(CASE ...)', language: 'sql', db: 'market',
        body: text('One pass over the orders produces several counts side by side.'),
        code: "SELECT customer_id,\n       COUNT(*) AS orders,\n       SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid,\n       SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returned\nFROM orders\nGROUP BY customer_id\nORDER BY orders DESC\nLIMIT 5;",
        notice: 'The `CASE` produced 1 or 0 for each row and `SUM` added them up per customer. This “conditional aggregation” pattern is used constantly in reporting.',
      },
      { kind: 'challenge', challengeId: 'sql-08-price-band' },
      { kind: 'challenge', challengeId: 'sql-08-downtime-class' },
      { kind: 'challenge', challengeId: 'sql-08-paid-vs-returned' },
    ],
  },
  objectives: [
    { id: 'sql-obj-case-bucket', title: 'Bucket values into labelled bands', summary: 'Use CASE to turn a number into a category label.' },
    { id: 'sql-obj-cond-agg', title: 'Count and sum conditionally', summary: 'Put CASE inside SUM/COUNT to compute several conditional totals per group.' },
  ],
  challenges: [
    {
      id: 'sql-08-price-band', title: 'Price Bands', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.advanced'], concepts: ['CASE', 'WHEN'], difficulty: 3, context: 'retail',
      prompt: text('Show each product’s **name** and a column `band`: `cheap` if the price is **under 10**, `standard` if it is **under 50**, and `premium` otherwise.'),
      expectedBehavior: 'name and band for every product.',
      guidedSteps: ['Open a `CASE` expression after the name.', 'First `WHEN price < 10 THEN \'cheap\'`.', 'Second `WHEN price < 50 THEN \'standard\'`.', '`ELSE \'premium\' END AS band`.'],
      starterCode: START,
      hints: ['You need a value that depends on which range the price falls in.', 'Conditions are checked in order; the first true one wins.', 'Two `WHEN` branches plus an `ELSE`, closed with `END AS band`.'],
      checks: sqlRes("SELECT name, CASE WHEN price < 10 THEN 'cheap' WHEN price < 50 THEN 'standard' ELSE 'premium' END AS band FROM products", 'market', ['market-b'], { columns: 'names' }),
      constraints: [CASE],
      xpReward: 65, coinReward: 8,
    },
    {
      id: 'sql-08-downtime-class', objectiveId: 'sql-obj-case-bucket', title: 'How Bad Was the Stoppage?', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.advanced'], concepts: ['CASE', 'bucketing'], difficulty: 3, context: 'manufacturing',
      prompt: text('For every maintenance event, show its **id** and an `impact` label: `minor` if the downtime was **under 2 hours**, `moderate` if **under 8 hours**, otherwise `major`.'),
      expectedBehavior: 'id and impact for every event.',
      starterCode: '',
      hints: ['Turn a number into one of three labels.', 'Order the tests from the smallest range upward.', '`CASE WHEN downtime_hours < 2 THEN ... WHEN downtime_hours < 8 THEN ... ELSE ... END AS impact`'],
      checks: sqlRes("SELECT id, CASE WHEN downtime_hours < 2 THEN 'minor' WHEN downtime_hours < 8 THEN 'moderate' ELSE 'major' END AS impact FROM maintenance_events", 'works', ['works-b'], { columns: 'names' }),
      constraints: [CASE],
      xpReward: 75, coinReward: 10,
    },
    {
      id: 'sql-08-order-size', objectiveId: 'sql-obj-case-bucket', title: 'Order Line Sizes', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.advanced'], concepts: ['CASE', 'bucketing'], difficulty: 3, context: 'logistics',
      prompt: text('Warehouse staff pack order lines differently by size. For every order line, show its **id** and a `size` label: `bulk` if the quantity is **6 or more**, `regular` if it is **3 or more**, otherwise `single`.'),
      expectedBehavior: 'id and size for every order line.',
      starterCode: '',
      hints: ['Three labels depend on how large a number is.', 'Test the biggest range first, since the first true condition wins.', '`CASE WHEN quantity >= 6 THEN ... WHEN quantity >= 3 THEN ... ELSE ... END AS size`'],
      checks: sqlRes("SELECT id, CASE WHEN quantity >= 6 THEN 'bulk' WHEN quantity >= 3 THEN 'regular' ELSE 'single' END AS size FROM order_items", 'market', ['market-b'], { columns: 'names' }),
      constraints: [CASE],
      xpReward: 75, coinReward: 10,
    },
    {
      id: 'sql-08-paid-vs-returned', objectiveId: 'sql-obj-cond-agg', title: 'Paid Versus Returned', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.advanced', 'sql.aggregate'], concepts: ['CASE', 'SUM', 'conditional aggregation'], difficulty: 3, context: 'retail',
      prompt: text('For each customer (`customer_id`), show how many of their orders are `paid` (column `paid`) and how many are `returned` (column `returned`). Include only customers who have at least one order.'),
      expectedBehavior: 'customer_id, paid, returned; one row per customer with orders.',
      starterCode: '',
      hints: ['Two different counts for the same customer, from the same rows.', 'Each count adds 1 for the rows of one status and 0 for the others.', '`SUM(CASE WHEN status = ... THEN 1 ELSE 0 END)` once per status; group by customer.'],
      checks: sqlRes("SELECT customer_id, SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid, SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returned FROM orders GROUP BY customer_id", 'market', ['market-b'], { columns: 'names' }),
      constraints: [CASE],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'sql-08-repairs-vs-other', objectiveId: 'sql-obj-cond-agg', title: 'Repairs Versus Routine Work', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.advanced', 'sql.aggregate'], concepts: ['CASE', 'SUM', 'conditional aggregation'], difficulty: 3, context: 'maintenance',
      prompt: text('For each machine (`machine_id`), show how many of its events are `repair` events (column `repairs`) and how many are **anything else** (column `other`).'),
      expectedBehavior: 'machine_id, repairs, other; one row per machine with events.',
      starterCode: '',
      hints: ['Two counts, split by whether an event is a repair.', 'A conditional 1-or-0 inside a `SUM` does the counting.', '`SUM(CASE WHEN kind = \'repair\' THEN 1 ELSE 0 END)` and the opposite condition for `other`.'],
      checks: sqlRes("SELECT machine_id, SUM(CASE WHEN kind = 'repair' THEN 1 ELSE 0 END) AS repairs, SUM(CASE WHEN kind <> 'repair' THEN 1 ELSE 0 END) AS other FROM maintenance_events GROUP BY machine_id", 'works', ['works-b'], { columns: 'names' }),
      constraints: [CASE],
      xpReward: 80, coinReward: 12,
    },
  ],
};
