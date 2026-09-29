import { sqlRes, text } from '../helpers';
import type { Constraint, LessonBundle } from '../schema';

const START = '-- Write your query below\n';
const OVER: Constraint = { type: 'requires', node: 'sql:\\bover\\s*\\(', message: 'Use a window function (something OVER (...)).' };

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-11-window', title: 'Windows: Looking Across Rows', language: 'sql', skillId: 'sql.advanced',
    blurb: 'Window functions: rank within a group, running totals, and the top row per group.', prerequisites: ['sql-10-subqueries'], xpReward: 60,
    reference: {
      title: 'Window functions',
      body: text(
        'A **window function** calculates across a set of related rows **without collapsing them**. `fn(...) OVER (PARTITION BY g ORDER BY x)`: `PARTITION BY` splits rows into groups (optional), `ORDER BY` orders within each.',
        '`ROW_NUMBER()` numbers rows 1, 2, 3...; `RANK()` gives ties the same rank. `SUM(x) OVER (ORDER BY d)` is a **running total**. `LAG(x)` reads the previous row. You cannot filter on a window result in the same `WHERE`; wrap it in a subquery or CTE and filter outside: `SELECT * FROM (SELECT ..., ROW_NUMBER() OVER (...) AS rn FROM t) WHERE rn = 1`.',
      ),
      example: 'SELECT name, category, price,\n       RANK() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank\nFROM products;',
    },
    steps: [
      {
        kind: 'teach', title: 'GROUP BY loses the rows. Windows keep them.',
        body: text(
          '`GROUP BY` answers “per category” by collapsing each category into one row. But sometimes you want to keep every row **and** add a calculation that looks at the others: each product’s **rank within its category**, each event’s **running total** of downtime, each order’s position in time. That is what **window functions** do.',
          'They look intimidating (`OVER (PARTITION BY ... ORDER BY ...)`), but the idea is small: “for each row, look at this **window** of related rows, and calculate.”',
        ),
      },
      {
        kind: 'demo', title: 'Rank within each category', language: 'sql', db: 'market',
        body: text('Every product stays in the result. Each one is ranked against the others in its own category.'),
        code: 'SELECT category, name, price,\n       RANK() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank\nFROM products\nORDER BY category, price_rank;',
        notice: '`PARTITION BY category` restarted the ranking for each category, and `ORDER BY price DESC` said the most expensive is rank 1. No rows were lost, which is the difference from `GROUP BY`.',
      },
      {
        kind: 'demo', title: 'A running total', language: 'sql', db: 'works',
        body: text('Adding up as you go: each row shows the total so far for its machine.'),
        code: 'SELECT machine_id, event_date, downtime_hours,\n       ROUND(SUM(downtime_hours) OVER (\n         PARTITION BY machine_id ORDER BY event_date, id), 1) AS running_total\nFROM maintenance_events\nWHERE machine_id IN (5, 9)\nORDER BY machine_id, event_date, id\nLIMIT 10;',
        notice: 'Each row’s `running_total` includes every earlier event of the same machine, in date order. Two machines’ totals climb separately because of `PARTITION BY machine_id`.',
      },
      {
        kind: 'demo', title: 'The top row per group', language: 'sql', db: 'market',
        body: text('You cannot write `WHERE rn = 1` in the same query as the window function. Put it in a subquery.'),
        code: 'SELECT category, name, price\nFROM (\n  SELECT category, name, price,\n         ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn\n  FROM products\n)\nWHERE rn = 1;',
        notice: 'The inner query numbered products within each category; the outer query kept only number 1. “Top row per group” is one of the most common real uses of window functions.',
      },
      { kind: 'challenge', challengeId: 'sql-11-rank-prices' },
      { kind: 'challenge', challengeId: 'sql-11-top-per-category' },
      { kind: 'challenge', challengeId: 'sql-11-running-downtime' },
    ],
  },
  objectives: [
    { id: 'sql-obj-top-per-group', title: 'The top row in each group', summary: 'Number rows within groups with a window function, then keep only the first.' },
    { id: 'sql-obj-running-total', title: 'A running total or running count', summary: 'Accumulate a value in order with SUM (or COUNT) OVER.' },
  ],
  challenges: [
    {
      id: 'sql-11-rank-prices', title: 'Rank Within Category', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.advanced'], concepts: ['window function', 'RANK', 'PARTITION BY'], difficulty: 4, context: 'retail',
      prompt: text('Show each product’s **name, category, price** and a column `price_rank`: its rank **within its own category** by price, with the **most expensive ranked 1**.'),
      expectedBehavior: 'Every product, with price_rank restarting at 1 in each category.',
      guidedSteps: ['Use `RANK() OVER (...)`.', 'Restart the ranking for each category with `PARTITION BY category`.', 'Rank the most expensive first with `ORDER BY price DESC`.'],
      starterCode: START,
      hints: ['You want to keep every product AND add a rank.', 'The ranking should restart in each category, and the biggest price should get 1.', '`RANK() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank`'],
      checks: sqlRes('SELECT name, category, price, RANK() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank FROM products', 'market', ['market-b'], { columns: 'names' }),
      constraints: [OVER],
      xpReward: 80, coinReward: 10,
    },
    {
      id: 'sql-11-top-per-category', objectiveId: 'sql-obj-top-per-group', title: 'The Priciest in Each Category', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.advanced'], concepts: ['window function', 'ROW_NUMBER', 'subquery'], difficulty: 4, context: 'retail',
      prompt: text('Show the **most expensive product in each category**: its `category`, `name` and `price`. Exactly one row per category.'),
      expectedBehavior: 'One row per category: the product with the highest price there.',
      starterCode: '',
      hints: ['Number the products inside each category, most expensive first.', 'You cannot filter on that number in the same query. Wrap the numbering in a subquery.', 'Inner: `ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn`. Outer: keep rows where `rn = 1`.'],
      checks: sqlRes('SELECT category, name, price FROM (SELECT category, name, price, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn FROM products) WHERE rn = 1', 'market', ['market-b']),
      constraints: [OVER],
      xpReward: 95, coinReward: 14,
    },
    {
      id: 'sql-11-top-machine-per-dept', objectiveId: 'sql-obj-top-per-group', title: 'The Costliest Machine in Each Department', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.advanced'], concepts: ['window function', 'ROW_NUMBER', 'subquery'], difficulty: 4, context: 'manufacturing',
      prompt: text('Show the **most expensive machine in each department**: its `department_id`, `name` and `purchase_cost`. Exactly one row per department.'),
      expectedBehavior: 'One row per department: the machine with the highest purchase cost.',
      starterCode: '',
      hints: ['It is the same shape of problem as “the top item in each group”.', 'Number the machines within each department, then keep only the first.', 'A window function numbering by department and cost (highest first), wrapped in a subquery that keeps number 1.'],
      checks: sqlRes('SELECT department_id, name, purchase_cost FROM (SELECT department_id, name, purchase_cost, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY purchase_cost DESC) AS rn FROM machines) WHERE rn = 1', 'works', ['works-b']),
      constraints: [OVER],
      xpReward: 95, coinReward: 14,
    },
    {
      id: 'sql-11-running-downtime', objectiveId: 'sql-obj-running-total', title: 'Running Downtime', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.advanced'], concepts: ['window function', 'running total', 'SUM OVER'], difficulty: 4, context: 'maintenance',
      prompt: text('For every maintenance event, show `machine_id`, `id`, `event_date` and `running_total`: the **total downtime hours of that machine up to and including this event**, counting events in date order (ties by `id`). Sort the output by machine, then date, then id.'),
      expectedBehavior: 'Every event, with a per-machine running total of downtime_hours.',
      starterCode: '',
      hints: ['The total must restart for each machine and grow as time passes.', 'A `SUM` can be turned into a running sum with an `OVER` clause that partitions and orders.', '`SUM(downtime_hours) OVER (PARTITION BY machine_id ORDER BY event_date, id)`'],
      checks: sqlRes('SELECT machine_id, id, event_date, SUM(downtime_hours) OVER (PARTITION BY machine_id ORDER BY event_date, id) AS running_total FROM maintenance_events ORDER BY machine_id, event_date, id', 'works', ['works-b'], { ordered: true, columns: 'names', approx: 1e-6 }),
      constraints: [OVER],
      xpReward: 95, coinReward: 14,
    },
    {
      id: 'sql-11-orders-so-far', objectiveId: 'sql-obj-running-total', title: 'Orders So Far', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.advanced'], concepts: ['window function', 'running total', 'SUM OVER'], difficulty: 4, context: 'sales analytics',
      prompt: text('For every order show its `id`, its `ordered_on` date and `orders_so_far`: how many orders have been placed **up to and including this one**, counting in date order (ties by `id`). Sort the output by date, then id.'),
      expectedBehavior: 'Every order with a cumulative count that goes 1, 2, 3, ...',
      starterCode: '',
      hints: ['You are counting as you go, in date order.', 'A running count is a running sum of 1s, or a window `COUNT`.', '`COUNT(*) OVER (ORDER BY ordered_on, id)`'],
      checks: sqlRes('SELECT id, ordered_on, COUNT(*) OVER (ORDER BY ordered_on, id) AS orders_so_far FROM orders ORDER BY ordered_on, id', 'market', ['market-b'], { ordered: true, columns: 'names' }),
      constraints: [OVER],
      xpReward: 95, coinReward: 14,
    },
  ],
};
