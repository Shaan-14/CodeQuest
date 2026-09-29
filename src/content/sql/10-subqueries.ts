import { sqlRes, text } from '../helpers';
import type { Constraint, LessonBundle } from '../schema';

const START = '-- Write your query below\n';
const SUBQ: Constraint = { type: 'requires', node: 'sql:\\(\\s*select\\b', message: 'Use a subquery (a SELECT inside parentheses).' };
const CTE: Constraint = { type: 'requires', node: 'sql:\\bwith\\b', message: 'Use a common table expression (WITH ...).' };

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-10-subqueries', title: 'Queries Inside Queries', language: 'sql', skillId: 'sql.advanced',
    blurb: 'Subqueries and common table expressions: breaking a hard question into steps.', prerequisites: ['sql-09-modify'], xpReward: 55,
    reference: {
      title: 'Subqueries and CTEs',
      body: text(
        'A **subquery** is a `SELECT` inside another query, in parentheses. A **scalar** subquery gives one value: `WHERE price > (SELECT AVG(price) FROM products)`. An **IN** subquery gives a list: `WHERE id IN (SELECT customer_id FROM orders WHERE status = \'returned\')`. A subquery in `FROM` acts like a temporary table.',
        'A **CTE** names a step first, so the query reads top to bottom: `WITH per_customer AS (SELECT customer_id, COUNT(*) AS n FROM orders GROUP BY customer_id) SELECT AVG(n) FROM per_customer;`. Use one when you need to aggregate an aggregate, or when a subquery gets hard to read.',
      ),
      example: 'WITH t AS (\n  SELECT machine_id, SUM(downtime_hours) AS hours\n  FROM maintenance_events GROUP BY machine_id\n)\nSELECT AVG(hours) FROM t;',
    },
    steps: [
      {
        kind: 'teach', title: 'When one query is not enough',
        body: text(
          'Some questions need an answer to an earlier question. “Which products cost more than the **average** product?” first requires the average, then a comparison. “What is the **average** of each customer’s **order count**?” first requires the count per customer, then an average over those.',
          'SQL lets you build such answers from **steps**. A **subquery** tucks one step inside another. A **CTE** (common table expression, written `WITH`) gives a step a name and lets you list steps in reading order. Professionals use CTEs constantly because they make long queries understandable.',
        ),
      },
      {
        kind: 'demo', title: 'A subquery that produces a single value', language: 'sql', db: 'market',
        body: text('First run the inner query alone (the second statement), then the whole thing.'),
        code: 'SELECT name, price\nFROM products\nWHERE price > (SELECT AVG(price) FROM products)\nORDER BY price;\n\nSELECT AVG(price) AS the_average FROM products;',
        notice: 'The inner `SELECT AVG(price)` ran first and produced one number, which the outer `WHERE` then used. If the average changes, the query still works: nothing is hard-coded.',
      },
      {
        kind: 'demo', title: 'A CTE: aggregate an aggregate', language: 'sql', db: 'market',
        body: text('“The average number of orders per customer” cannot be written as one `AVG(COUNT(...))`. Steps solve it.'),
        code: 'WITH per_customer AS (\n  SELECT customer_id, COUNT(*) AS n\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT ROUND(AVG(n), 2) AS avg_orders,\n       MAX(n) AS most_orders\nFROM per_customer;',
        notice: 'The `WITH` block computed one row per customer and named it `per_customer`. The final `SELECT` then treated it like an ordinary table. Read it top to bottom: it says what each step is.',
      },
      { kind: 'challenge', challengeId: 'sql-10-above-average' },
      { kind: 'challenge', challengeId: 'sql-10-costly-machines' },
      { kind: 'challenge', challengeId: 'sql-10-avg-orders-per-customer' },
    ],
  },
  objectives: [
    { id: 'sql-obj-subquery-compare', title: 'Use a subquery to filter', summary: 'Compare against a computed value, or match against a list produced by another query.' },
    { id: 'sql-obj-cte', title: 'Break a question into steps with a CTE', summary: 'Compute an intermediate result with WITH, then summarise it.' },
  ],
  challenges: [
    {
      id: 'sql-10-above-average', title: 'Above the Average Price', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.advanced'], concepts: ['subquery', 'AVG', 'WHERE'], difficulty: 3, context: 'retail',
      prompt: text('Show the **name and price** of every product priced **above the average price** of all products.'),
      expectedBehavior: 'name and price of the products whose price exceeds the overall average.',
      guidedSteps: ['Work out the average with `SELECT AVG(price) FROM products`.', 'Put that query in parentheses inside a `WHERE price > (...)`.'],
      starterCode: START,
      hints: ['You need the average before you can compare with it.', 'A query in parentheses can stand in for a single number.', 'Compare `price` with `(SELECT AVG(price) FROM products)` in a `WHERE`.'],
      checks: sqlRes('SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products)', 'market', ['market-b']),
      constraints: [SUBQ],
      xpReward: 65, coinReward: 8,
    },
    {
      id: 'sql-10-costly-machines', objectiveId: 'sql-obj-subquery-compare', title: 'Machines Above the Average Cost', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.advanced'], concepts: ['subquery', 'compare to computed value'], difficulty: 3, context: 'manufacturing',
      prompt: text('List the **names** of machines whose purchase cost is **above the average purchase cost** of all machines.'),
      expectedBehavior: 'One column of machine names.',
      starterCode: '',
      hints: ['You have to compare each machine with a value that is calculated from all machines.', 'Calculate that value in a query of its own and use it inside the condition.', '`WHERE purchase_cost > (` a query for the average `)`'],
      checks: sqlRes('SELECT name FROM machines WHERE purchase_cost > (SELECT AVG(purchase_cost) FROM machines)', 'works', ['works-b']),
      constraints: [SUBQ],
      xpReward: 75, coinReward: 10,
    },
    {
      id: 'sql-10-returning-customers', objectiveId: 'sql-obj-subquery-compare', title: 'Customers Who Returned Something', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.advanced'], concepts: ['subquery', 'compare to computed value'], difficulty: 3, context: 'customer service',
      prompt: text('Customer service wants to call everyone who has had **at least one order returned**. List those customers’ **names**, each name once.'),
      expectedBehavior: 'One column of customer names, no repeats.',
      starterCode: '',
      hints: ['First find which customers had a returned order, then look them up.', 'The first step gives you a list of customer ids that the second step can test against.', '`WHERE id IN (` the customer ids of returned orders `)`'],
      checks: sqlRes("SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders WHERE status = 'returned')", 'market', ['market-b']),
      constraints: [SUBQ],
      xpReward: 75, coinReward: 10,
    },
    {
      id: 'sql-10-avg-orders-per-customer', objectiveId: 'sql-obj-cte', title: 'Orders per Customer, on Average', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.advanced', 'sql.aggregate'], concepts: ['CTE', 'WITH', 'aggregate of aggregate'], difficulty: 3, context: 'retail',
      prompt: text('Among customers who have placed orders, what is the **average number of orders per customer**? Return one number, named `avg_orders`.', 'Build it in steps with a `WITH` clause.'),
      expectedBehavior: 'One row, one column: avg_orders.',
      starterCode: '',
      hints: ['There are two calculations, and the second uses the results of the first.', 'Step one: one row per customer with their order count. Step two: average those counts.', '`WITH per_customer AS (` count orders per customer `) SELECT AVG(n) AS avg_orders FROM per_customer`'],
      checks: sqlRes('WITH per AS (SELECT customer_id, COUNT(*) AS n FROM orders GROUP BY customer_id) SELECT AVG(n) AS avg_orders FROM per', 'market', ['market-b'], { columns: 'names', approx: 1e-6 }),
      constraints: [CTE],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'sql-10-avg-machine-downtime', objectiveId: 'sql-obj-cte', title: 'Typical Downtime per Machine', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.advanced', 'sql.aggregate'], concepts: ['CTE', 'WITH', 'aggregate of aggregate'], difficulty: 3, context: 'maintenance',
      prompt: text('For every machine, add up its total downtime. Then, across **machines that have any events**, what is the **average of those totals**? Return one number, named `avg_total_downtime`.', 'Build it in steps with a `WITH` clause.'),
      expectedBehavior: 'One row, one column: avg_total_downtime.',
      starterCode: '',
      hints: ['Total per machine first; then an average of those totals.', 'The first step is a `GROUP BY`; the second step summarises its result.', '`WITH per_machine AS (` total downtime per machine `) SELECT AVG(...) AS avg_total_downtime FROM per_machine`'],
      checks: sqlRes('WITH per AS (SELECT machine_id, SUM(downtime_hours) AS t FROM maintenance_events GROUP BY machine_id) SELECT AVG(t) AS avg_total_downtime FROM per', 'works', ['works-b'], { columns: 'names', approx: 1e-6 }),
      constraints: [CTE],
      xpReward: 80, coinReward: 12,
    },
  ],
};
