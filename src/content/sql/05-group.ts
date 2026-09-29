import { sqlRes, text } from '../helpers';
import type { LessonBundle } from '../schema';

const START = '-- Write your query below\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-05-group', title: 'Grouping: One Answer per Category', language: 'sql', skillId: 'sql.aggregate',
    blurb: 'GROUP BY, HAVING, and the difference between filtering rows and filtering groups.', prerequisites: ['sql-04-aggregates'], xpReward: 50,
    reference: {
      title: 'GROUP BY and HAVING',
      body: text(
        '`GROUP BY col` splits the rows into groups that share a value of `col`, and an aggregate gives **one answer per group**: `SELECT status, COUNT(*) FROM orders GROUP BY status`. Every selected column must be either in `GROUP BY` or inside an aggregate.',
        '`WHERE` filters **rows before** grouping; `HAVING` filters **groups after** aggregating (it can use `COUNT(*)`, `SUM(...)`). `ORDER BY` runs last, so it may sort by an aggregate, or by its alias (`ORDER BY total DESC`).',
      ),
      example: 'SELECT machine_id, COUNT(*) AS repairs\nFROM maintenance_events\nWHERE kind = \'repair\'\nGROUP BY machine_id\nHAVING COUNT(*) > 3;',
    },
    steps: [
      {
        kind: 'teach', title: 'Per customer, per machine, per month',
        body: text(
          'Last lesson each query gave **one** answer for the whole table. Real questions are almost always **per something**: sales per product, downtime per machine, orders per customer. `GROUP BY` is how SQL answers them: it sorts the rows into piles by a column and summarises each pile.',
          'Then comes a subtle question: what if you only want piles that are big enough? You cannot use `WHERE` for that, because a group does not exist yet when `WHERE` runs. That is what `HAVING` is for.',
        ),
      },
      {
        kind: 'demo', title: 'One row per group', language: 'sql', db: 'market',
        body: text('Run it. Each order status became one row.'),
        code: 'SELECT status, COUNT(*) AS orders\nFROM orders\nGROUP BY status\nORDER BY orders DESC;',
        notice: 'Without `GROUP BY`, `COUNT(*)` would collapse the whole table into one number. With it, we get one count per status. `ORDER BY orders DESC` sorted the summary rows by the alias we named.',
      },
      {
        kind: 'demo', title: 'WHERE versus HAVING', language: 'sql', db: 'works',
        body: text('Both filters are in the query below. Which one removes individual rows, and which removes whole groups?'),
        code: "SELECT machine_id, COUNT(*) AS repairs, ROUND(SUM(downtime_hours), 1) AS hours\nFROM maintenance_events\nWHERE kind = 'repair'\nGROUP BY machine_id\nHAVING COUNT(*) > 3\nORDER BY hours DESC;",
        notice: '`WHERE kind = \'repair\'` threw away non-repair rows BEFORE grouping. `HAVING COUNT(*) > 3` then threw away machines whose repair count was too small AFTER grouping. Notice that a couple of machines account for nearly all the downtime.',
      },
      { kind: 'challenge', challengeId: 'sql-05-orders-per-status' },
      { kind: 'challenge', challengeId: 'sql-05-downtime-per-machine' },
      { kind: 'challenge', challengeId: 'sql-05-frequent-customers' },
    ],
  },
  objectives: [
    { id: 'sql-obj-group-agg', title: 'One summary per group', summary: 'Group rows by a column and calculate an aggregate for each group, in a required order.' },
    { id: 'sql-obj-having', title: 'Keep only the groups that qualify', summary: 'Use HAVING to filter groups by an aggregate such as a count.' },
  ],
  challenges: [
    {
      id: 'sql-05-orders-per-status', title: 'Orders per Status', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.aggregate'], concepts: ['GROUP BY', 'COUNT'], difficulty: 2, context: 'retail',
      prompt: text('For each order **status**, show the status and **how many orders** have it.'),
      expectedBehavior: 'One row per status with its count.',
      guidedSteps: ['Select `status` and `COUNT(*)`.', 'Group the rows with `GROUP BY status`.'],
      starterCode: START,
      hints: ['You want one row per status, not one row per order.', 'The column that defines the groups goes in a `GROUP BY` clause.', 'Select the status and `COUNT(*)`, and group by the status column.'],
      checks: sqlRes('SELECT status, COUNT(*) FROM orders GROUP BY status', 'market', ['market-b']),
      constraints: [{ type: 'requires', node: 'sql:\\bgroup\\s+by\\b', message: 'Use GROUP BY.' }],
      xpReward: 50, coinReward: 6,
    },
    {
      id: 'sql-05-downtime-per-machine', objectiveId: 'sql-obj-group-agg', title: 'Downtime per Machine', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.aggregate'], concepts: ['GROUP BY', 'SUM', 'ORDER BY'], difficulty: 3, context: 'manufacturing',
      prompt: text('For each machine, show its `machine_id` and the **total downtime hours** across all its maintenance events, named `total_downtime`. Put the machine with the **most** downtime first.'),
      expectedBehavior: 'One row per machine: machine_id and total_downtime, largest total first.',
      starterCode: '',
      hints: ['One row per machine means grouping by the machine column.', 'The summary of each group is a total. You can sort by the name you give it.', '`SUM(downtime_hours) AS total_downtime`, `GROUP BY machine_id`, then order by the alias, descending.'],
      checks: sqlRes('SELECT machine_id, SUM(downtime_hours) AS total_downtime FROM maintenance_events GROUP BY machine_id ORDER BY total_downtime DESC', 'works', ['works-b'], { ordered: true, columns: 'names', approx: 1e-6 }),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'sql-05-stock-per-category', objectiveId: 'sql-obj-group-agg', title: 'Stock per Category', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.aggregate'], concepts: ['GROUP BY', 'SUM', 'ORDER BY'], difficulty: 3, context: 'retail',
      prompt: text('For each product **category**, show the category, the **number of products** (`products`) and the **total stock** (`total_stock`). Put the category with the **most stock** first; if two categories tie, order them by category name A to Z.'),
      expectedBehavior: 'One row per category: category, products, total_stock. Most stock first, ties by name.',
      starterCode: '',
      hints: ['Two summaries per group, plus a two-level sort.', 'Group by the category. You can sort by several things separated by commas.', '`COUNT(*) AS products`, `SUM(stock) AS total_stock`; `ORDER BY total_stock DESC, category`.'],
      checks: sqlRes('SELECT category, COUNT(*) AS products, SUM(stock) AS total_stock FROM products GROUP BY category ORDER BY total_stock DESC, category', 'market', ['market-b'], { ordered: true, columns: 'names' }),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'sql-05-frequent-customers', objectiveId: 'sql-obj-having', title: 'Regular Customers', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.aggregate'], concepts: ['GROUP BY', 'HAVING', 'COUNT'], difficulty: 3, context: 'retail',
      prompt: text('Marketing wants to thank the **regular customers**: those with **at least 4 orders**. Show each such `customer_id` and their number of orders.'),
      expectedBehavior: 'customer_id and order count, only for customers with 4 or more orders.',
      starterCode: '',
      hints: ['You are filtering on a count, which only exists after grouping.', '`WHERE` cannot see a count. There is a different clause for conditions on groups.', 'Group by the customer, then `HAVING` with `COUNT(*)` and the threshold.'],
      checks: sqlRes('SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id HAVING COUNT(*) >= 4', 'market', ['market-b']),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'sql-05-repair-heavy', objectiveId: 'sql-obj-having', title: 'Repeat Offenders', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.aggregate'], concepts: ['GROUP BY', 'HAVING', 'COUNT'], difficulty: 3, context: 'maintenance',
      prompt: text('The maintenance manager is worried about machines that keep breaking. Show the `machine_id` and the number of **repairs** for machines with **more than 3 repair events** (only events of kind `repair` count).'),
      expectedBehavior: 'machine_id and repair count, only machines with more than 3 repairs.',
      starterCode: '',
      hints: ['Two filters: one on individual rows (which kind of event), one on the groups (how many).', 'The kind of event is decided before grouping; the count is decided after.', '`WHERE` for the kind, `GROUP BY machine_id`, `HAVING COUNT(*) > 3`.'],
      checks: sqlRes("SELECT machine_id, COUNT(*) FROM maintenance_events WHERE kind = 'repair' GROUP BY machine_id HAVING COUNT(*) > 3", 'works', ['works-b']),
      xpReward: 70, coinReward: 10,
    },
  ],
};
