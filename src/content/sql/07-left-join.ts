import { sqlRes, text } from '../helpers';
import type { Constraint, LessonBundle } from '../schema';

const START = '-- Write your query below\n';
const LEFT: Constraint = { type: 'requires', node: 'sql:\\bleft\\s+(outer\\s+)?join\\b', message: 'This task needs rows that may have no match: use a LEFT JOIN.' };

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-07-left-join', title: 'The Ones That Do Not Match', language: 'sql', skillId: 'sql.joins',
    blurb: 'LEFT JOIN: keeping unmatched rows, finding what is missing, and counting zeros.', prerequisites: ['sql-06-joins'], xpReward: 55,
    reference: {
      title: 'LEFT JOIN',
      body: text(
        '`a LEFT JOIN b ON ...` keeps **every row of a**, even when nothing in b matches. For unmatched rows, b’s columns are NULL. A plain `JOIN` silently **drops** them.',
        '**Finding what is missing** (an “anti-join”): `WHERE b.id IS NULL` after a LEFT JOIN keeps only the a-rows with no match. **Counting including zero**: `COUNT(b.id)` counts only real matches (NULLs are skipped), so unmatched a-rows show 0; `COUNT(*)` would wrongly show 1.',
      ),
      example: 'SELECT c.name, COUNT(o.id) AS orders\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id;',
    },
    steps: [
      {
        kind: 'teach', title: 'What an inner join throws away',
        body: text(
          'Last lesson’s `JOIN` only returned rows that matched on both sides. That is often exactly right, but sometimes the interesting rows are the ones **without** a match: customers who never ordered, products that never sold, machines with no maintenance. An inner join makes those rows vanish, and a report built on it can be completely wrong without any error.',
          '`LEFT JOIN` keeps every row from the left table. Where there is no match, the right table’s columns come back as NULL, and you already know how to work with NULL.',
        ),
      },
      {
        kind: 'demo', title: 'Inner join versus left join', language: 'sql', db: 'market',
        body: text('Two queries counting customers. Predict which is smaller, and by how many.'),
        code: 'SELECT COUNT(DISTINCT c.id) AS with_orders\nFROM customers c JOIN orders o ON o.customer_id = c.id;\n\nSELECT COUNT(*) AS all_customers\nFROM customers c LEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;',
        notice: 'The inner join saw only customers who ordered. The second query used `LEFT JOIN ... WHERE o.id IS NULL` to count the customers with NO order: they are invisible to an inner join.',
      },
      {
        kind: 'demo', title: 'Counting zeros correctly', language: 'sql', db: 'market',
        body: text('Compare the two counts for customers who never ordered.'),
        code: 'SELECT c.name,\n       COUNT(*)    AS wrong_count,\n       COUNT(o.id) AS right_count\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id\nORDER BY right_count, c.name\nLIMIT 5;',
        notice: 'A customer with no orders still produces ONE joined row (with NULLs), so `COUNT(*)` says 1. `COUNT(o.id)` skips the NULL and says 0. When counting matches after a LEFT JOIN, count a column of the right-hand table.',
      },
      { kind: 'challenge', challengeId: 'sql-07-orders-per-customer' },
      { kind: 'challenge', challengeId: 'sql-07-never-ordered' },
      { kind: 'challenge', challengeId: 'sql-07-product-sales' },
    ],
  },
  objectives: [
    { id: 'sql-obj-anti-join', title: 'Find the rows that have no match', summary: 'Locate rows in one table with no related row in another (never ordered, never used).' },
    { id: 'sql-obj-left-count', title: 'Count matches, including zero', summary: 'Use LEFT JOIN with COUNT on the right-hand column so unmatched rows show 0.' },
  ],
  challenges: [
    {
      id: 'sql-07-orders-per-customer', title: 'Order Counts for Everyone', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.joins'], concepts: ['LEFT JOIN', 'COUNT', 'GROUP BY'], difficulty: 3, context: 'retail',
      prompt: text('Show **every** customer’s name and the **number of orders** they have placed (`orders`), **including customers with 0 orders**. Sort by name, A to Z.'),
      expectedBehavior: 'One row for every customer, with zero shown for those who never ordered.',
      guidedSteps: ['Start from `customers c` and `LEFT JOIN orders o` on the customer link.', 'Group by the customer.', 'Count a column from the orders side (`COUNT(o.id)`), not `COUNT(*)`.'],
      starterCode: START,
      hints: ['An inner join would leave out the customers with no orders.', 'Keep all customers, then count how many order rows matched each.', '`LEFT JOIN orders`, `COUNT(o.id)`, `GROUP BY c.id`, `ORDER BY c.name`.'],
      checks: sqlRes('SELECT c.name, COUNT(o.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.name', 'market', ['market-b'], { ordered: true, columns: 'names' }),
      constraints: [LEFT],
      xpReward: 65, coinReward: 8,
    },
    {
      id: 'sql-07-never-ordered', objectiveId: 'sql-obj-anti-join', title: 'The Silent Customers', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.joins'], concepts: ['LEFT JOIN', 'IS NULL', 'anti-join'], difficulty: 3, context: 'marketing',
      prompt: text('Marketing wants to email customers who have **never placed an order**. List their **names**.'),
      expectedBehavior: 'One column of names: only customers with no orders.',
      starterCode: '',
      hints: ['You are looking for customers with NO matching order.', 'Keep all customers, attach their orders, and look for the ones where the order side is empty.', '`LEFT JOIN orders`, then `WHERE o.id IS NULL` (or another approach that finds “no match”).'],
      checks: sqlRes('SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL', 'market', ['market-b']),
      xpReward: 75, coinReward: 10,
    },
    {
      id: 'sql-07-idle-operators', objectiveId: 'sql-obj-anti-join', title: 'The Idle Operators', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.joins'], concepts: ['LEFT JOIN', 'IS NULL', 'anti-join'], difficulty: 3, context: 'operations',
      prompt: text('The plant manager suspects some machine operators are never being scheduled. List the **names** of employees whose role is `operator` and who have **never operated a production run**.'),
      expectedBehavior: 'One column of names: operators with no production runs.',
      starterCode: '',
      hints: ['Same shape of problem: rows in one table with no related row in another.', 'Restrict to operators, then look for the ones with no runs.', 'Employees `LEFT JOIN production_runs` on the operator link; keep rows where the run side is NULL.'],
      checks: sqlRes("SELECT e.name FROM employees e LEFT JOIN production_runs r ON r.operator_id = e.id WHERE e.role = 'operator' AND r.id IS NULL", 'works', ['works-b']),
      xpReward: 75, coinReward: 10,
    },
    {
      id: 'sql-07-product-sales', objectiveId: 'sql-obj-left-count', title: 'Best and Worst Sellers', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.joins', 'sql.aggregate'], concepts: ['LEFT JOIN', 'COUNT', 'GROUP BY'], difficulty: 3, context: 'retail',
      prompt: text('For **every product** (including ones that never sold) show its **name** and the **number of order lines** it appears in (`lines`). List the products that sell least first; break ties by product name A to Z.'),
      expectedBehavior: 'One row per product with lines (0 for unsold), fewest first, ties by name.',
      starterCode: '',
      hints: ['Products that never sold must still appear, with a count of 0.', 'Keep all products, attach any order lines, and count only real matches.', '`products p LEFT JOIN order_items i`, `COUNT(i.id)`, `GROUP BY p.id`, `ORDER BY lines, p.name`.'],
      checks: sqlRes('SELECT p.name, COUNT(i.id) AS lines FROM products p LEFT JOIN order_items i ON i.product_id = p.id GROUP BY p.id ORDER BY lines, p.name', 'market', ['market-b'], { ordered: true, columns: 'names' }),
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'sql-07-machine-run-counts', objectiveId: 'sql-obj-left-count', title: 'Machine Utilisation', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.joins', 'sql.aggregate'], concepts: ['LEFT JOIN', 'COUNT', 'GROUP BY'], difficulty: 3, context: 'manufacturing',
      prompt: text('For **every machine** (including any that were never used) show its **name** and the **number of production runs** it has done (`runs`). The most-used machines come first; break ties by machine name A to Z.'),
      expectedBehavior: 'One row per machine with runs (0 for unused), most first, ties by name.',
      starterCode: '',
      hints: ['Unused machines must appear with 0.', 'Keep every machine, attach its runs, count only real matches.', '`machines m LEFT JOIN production_runs r`, `COUNT(r.id)`, `GROUP BY m.id`, `ORDER BY runs DESC, m.name`.'],
      checks: sqlRes('SELECT m.name, COUNT(r.id) AS runs FROM machines m LEFT JOIN production_runs r ON r.machine_id = m.id GROUP BY m.id ORDER BY runs DESC, m.name', 'works', ['works-b'], { ordered: true, columns: 'names' }),
      xpReward: 80, coinReward: 12,
    },
  ],
};
