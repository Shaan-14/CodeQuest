import { sqlState, text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const plan = (name: string, db: string, query: string, visible = true): Check => ({ kind: 'sqlPlan', name, db, query, mustMatch: 'SEARCH .*USING (COVERING )?INDEX', mustNotMatch: 'SCAN', visible, feedback: 'The database still reads the whole table for this query. Which column is it filtering on?' });

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-13-integrity-performance', title: 'Safe and Fast', language: 'sql', skillId: 'db.performance',
    blurb: 'Transactions (undoing mistakes), indexes, and reading how the database will run a query.', prerequisites: ['sql-12-design'], xpReward: 60,
    reference: {
      title: 'Transactions and indexes',
      body: text(
        '**Transactions**: `BEGIN;` starts a group of changes; `COMMIT;` makes them permanent; `ROLLBACK;` undoes everything since `BEGIN`. Use one whenever several changes must succeed together (moving stock, transferring money) or when you want a chance to check before making changes permanent.',
        '**Indexes**: `CREATE INDEX idx_name ON table(column);` lets the database jump straight to matching rows instead of reading the whole table. `EXPLAIN QUERY PLAN SELECT ...` shows what it will do: **SCAN** means reading every row (slow on big tables); **SEARCH ... USING INDEX** means direct lookup (fast). Indexes cost space and make INSERT/UPDATE slower, so index the columns you filter or join on often.',
      ),
      example: "CREATE INDEX idx_events_machine ON maintenance_events(machine_id);\nEXPLAIN QUERY PLAN\nSELECT * FROM maintenance_events WHERE machine_id = 4;",
    },
    steps: [
      {
        kind: 'teach', title: 'Two ways databases protect and serve you',
        body: text(
          'Real databases must be **safe** (mistakes can be undone, changes are all-or-nothing) and **fast** (a query on ten million rows must not read ten million rows). **Transactions** provide the first, **indexes** the second, and both are things every data professional is expected to understand.',
        ),
      },
      {
        kind: 'demo', title: 'A transaction and a rollback', language: 'sql', db: 'market',
        body: text('We start a transaction, make a terrible change, look at it, then undo it. Compare the count before, during and after.'),
        code: 'SELECT COUNT(*) AS items FROM order_items;\nBEGIN;\nDELETE FROM order_items;\nSELECT COUNT(*) AS during FROM order_items;\nROLLBACK;\nSELECT COUNT(*) AS after_rollback FROM order_items;',
        notice: 'Inside the transaction the table looked empty, but `ROLLBACK` put everything back. If we had written `COMMIT` instead, the deletion would have been permanent. Transactions give you a moment to check before you commit.',
      },
      {
        kind: 'demo', title: 'What a slow query looks like', language: 'sql', db: 'market',
        body: text('`EXPLAIN QUERY PLAN` does not run the query. It shows how the database WOULD run it. Compare the plan before and after adding an index.'),
        code: 'EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 7;\n\nCREATE INDEX idx_orders_customer ON orders(customer_id);\n\nEXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 7;',
        notice: 'Before: `SCAN orders`, a look at every row. After: `SEARCH orders USING INDEX idx_orders_customer`, a direct lookup. On 70 rows nobody would notice; on 70 million rows this is the difference between milliseconds and minutes.',
      },
      {
        kind: 'teach', title: 'Indexes are a trade-off',
        body: text(
          'An index is like the index of a book: a separate structure that must be kept up to date whenever data changes. So indexes **speed up reading** but **slow down writing** and use space. The skill is choosing well: index the columns you often **filter** (`WHERE`) or **join** (`ON`) on, not everything.',
        ),
      },
      { kind: 'challenge', challengeId: 'sql-13-add-index' },
      { kind: 'challenge', challengeId: 'sql-13-index-events' },
      { kind: 'challenge', challengeId: 'sql-13-two-queries' },
      { kind: 'challenge', challengeId: 'sql-13-undo-mistake' },
    ],
  },
  objectives: [
    { id: 'sql-obj-index-query', title: 'Make a specific query use an index', summary: 'Create an index on the columns a slow query filters on, and confirm with EXPLAIN QUERY PLAN.' },
    { id: 'sql-obj-index-several', title: 'Choose indexes for several queries', summary: 'Read more than one query and index each column that needs it.' },
    { id: 'sql-obj-transaction', title: 'Use a transaction to undo a mistake', summary: 'Recognise an open transaction with a wrong change, roll it back, and apply the right change.' },
  ],
  challenges: [
    {
      id: 'sql-13-add-index', title: 'Speed Up Order Lookups', mode: 'learning', language: 'sql', db: 'market', skillIds: ['db.performance'], concepts: ['index', 'EXPLAIN QUERY PLAN', 'SCAN vs SEARCH'], difficulty: 2, context: 'retail',
      prompt: text('Customer service constantly runs `SELECT * FROM orders WHERE customer_id = 7`, and the plan shows a full table scan. **Create an index** so the database can search instead.'),
      expectedBehavior: 'EXPLAIN QUERY PLAN for that query shows SEARCH ... USING INDEX.',
      guidedSteps: ['Which column does the query filter on?', '`CREATE INDEX some_name ON orders(that_column);`', 'Check with `EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 7;`.'],
      starterCode: 'EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 7;\n',
      hints: ['Indexes are created on the column that the WHERE clause tests.', 'Give the index any name you like, then the table and column in parentheses.', '`CREATE INDEX` a name `ON orders(` the column in the `WHERE` `)`'],
      checks: [plan('The query now uses an index', 'market', 'SELECT * FROM orders WHERE customer_id = 7')],
      constraints: [{ type: 'requires', node: 'sql:\\bcreate\\s+index\\b', message: 'Create an index with CREATE INDEX.' }],
      xpReward: 60, coinReward: 8,
    },
    {
      id: 'sql-13-index-events', objectiveId: 'sql-obj-index-query', title: 'Slow Maintenance Reports', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['db.performance'], concepts: ['index', 'EXPLAIN QUERY PLAN', 'SCAN vs SEARCH'], difficulty: 3, context: 'maintenance',
      prompt: text('The maintenance dashboard is slow. It runs this query thousands of times a day:', '`SELECT * FROM maintenance_events WHERE machine_id = 4 AND kind = \'repair\'`', 'Create an index (or indexes) so the database **searches** instead of scanning the whole table.'),
      expectedBehavior: 'The query plan shows SEARCH ... USING INDEX and no SCAN.',
      starterCode: '',
      hints: ['Look at which columns the WHERE clause uses.', 'Use `EXPLAIN QUERY PLAN` on the query to see what it does now.', 'An index on the column(s) the query filters by. One column is enough; using both is even better.'],
      checks: [plan('The query now uses an index', 'works', "SELECT * FROM maintenance_events WHERE machine_id = 4 AND kind = 'repair'")],
      constraints: [{ type: 'requires', node: 'sql:\\bcreate\\s+index\\b', message: 'Create an index with CREATE INDEX.' }],
      xpReward: 75, coinReward: 10,
    },
    {
      id: 'sql-13-index-orders', objectiveId: 'sql-obj-index-query', title: 'Slow Order History', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['db.performance'], concepts: ['index', 'EXPLAIN QUERY PLAN', 'SCAN vs SEARCH'], difficulty: 3, context: 'customer service',
      prompt: text('An account page runs this query for every page view:', '`SELECT * FROM orders WHERE customer_id = 3 AND status = \'paid\'`', 'Create an index (or indexes) so the database **searches** instead of scanning the whole table.'),
      expectedBehavior: 'The query plan shows SEARCH ... USING INDEX and no SCAN.',
      starterCode: '',
      hints: ['Which columns does the filter use?', 'Check the current plan with `EXPLAIN QUERY PLAN`.', 'Index the column(s) that the WHERE clause compares.'],
      checks: [plan('The query now uses an index', 'market', "SELECT * FROM orders WHERE customer_id = 3 AND status = 'paid'")],
      constraints: [{ type: 'requires', node: 'sql:\\bcreate\\s+index\\b', message: 'Create an index with CREATE INDEX.' }],
      xpReward: 75, coinReward: 10,
    },
    {
      id: 'sql-13-two-queries', objectiveId: 'sql-obj-index-several', title: 'Two Slow Queries', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['db.performance'], concepts: ['index', 'choosing columns', 'EXPLAIN QUERY PLAN'], difficulty: 3, context: 'manufacturing',
      prompt: text('Two different queries on `production_runs` are slow:', '`SELECT * FROM production_runs WHERE machine_id = 3`\n`SELECT * FROM production_runs WHERE run_date = \'2024-06-05\'`', 'Create the indexes so **both** queries search instead of scanning. One index will not be enough.'),
      expectedBehavior: 'Both queries show SEARCH ... USING INDEX.',
      starterCode: '',
      hints: ['Each query filters on a different column.', 'An index helps queries that filter on its column.', 'Create one index per filtered column.'],
      checks: [plan('The machine query uses an index', 'works', 'SELECT * FROM production_runs WHERE machine_id = 3'), plan('The date query uses an index', 'works', "SELECT * FROM production_runs WHERE run_date = '2024-06-05'")],
      constraints: [{ type: 'requires', node: 'sql:\\bcreate\\s+index\\b', message: 'Create indexes with CREATE INDEX.' }],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'sql-13-two-queries-market', objectiveId: 'sql-obj-index-several', title: 'Two Slow Lookups', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['db.performance'], concepts: ['index', 'choosing columns', 'EXPLAIN QUERY PLAN'], difficulty: 3, context: 'retail',
      prompt: text('Two different queries in the shop’s website are slow:', '`SELECT * FROM products WHERE category = \'Tools\'`\n`SELECT * FROM customers WHERE city = \'Bath\'`', 'Create the indexes so **both** queries search instead of scanning. One index will not be enough.'),
      expectedBehavior: 'Both queries show SEARCH ... USING INDEX.',
      starterCode: '',
      hints: ['The two queries are on different tables.', 'An index belongs to one table and one (or more) of its columns.', 'Create one index on `products` for its filtered column and one on `customers` for its filtered column.'],
      checks: [plan('The products query uses an index', 'market', "SELECT * FROM products WHERE category = 'Tools'"), plan('The customers query uses an index', 'market', "SELECT * FROM customers WHERE city = 'Bath'")],
      constraints: [{ type: 'requires', node: 'sql:\\bcreate\\s+index\\b', message: 'Create indexes with CREATE INDEX.' }],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'sql-13-undo-mistake', objectiveId: 'sql-obj-transaction', title: 'Oops: Undo It', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['db.integrity'], concepts: ['transaction', 'ROLLBACK', 'UPDATE'], difficulty: 3, context: 'retail',
      prompt: text('You started a transaction to zero the stock of the **Fasteners** category, but the `UPDATE` you wrote has no `WHERE`, so it changed every product. The transaction is still open.', '**Undo the mistake**, then apply the change you actually meant: set `stock` to `0` only for products in the `Fasteners` category.'),
      expectedBehavior: 'Only Fasteners products end up with stock 0. Every other product keeps its original stock.',
      starterCode: 'BEGIN;\nUPDATE products SET stock = 0;\n-- Oops! That was supposed to be only the Fasteners category.\n',
      hints: ['A transaction lets you throw away everything since `BEGIN`.', 'First undo the wrong change, then write the correct one.', '`ROLLBACK;` then a new `UPDATE` with the right `WHERE`.'],
      checks: sqlState("UPDATE products SET stock = 0 WHERE category = 'Fasteners'", 'SELECT id, stock FROM products ORDER BY id', 'market', ['market-b'], { ordered: true }),
      constraints: [{ type: 'requires', node: 'sql:\\brollback\\b', message: 'Undo the mistaken change with ROLLBACK.' }],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'sql-13-undo-delete', objectiveId: 'sql-obj-transaction', title: 'Oops: Undo the Delete', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['db.integrity'], concepts: ['transaction', 'ROLLBACK', 'UPDATE'], difficulty: 3, context: 'maintenance',
      prompt: text('You began a transaction to clear out old **inspection** events, but the `DELETE` you wrote has no `WHERE`: it removed every maintenance event. The transaction is still open.', '**Undo the mistake**, then delete only the events whose `kind` is `inspection`.'),
      expectedBehavior: 'Only inspection events are gone. All repair and routine events remain.',
      starterCode: 'BEGIN;\nDELETE FROM maintenance_events;\n-- Oops! That deleted everything.\n',
      hints: ['Everything since `BEGIN` can be thrown away.', 'Undo first, then write the correct deletion.', '`ROLLBACK;` then `DELETE FROM maintenance_events` with a condition on the kind.'],
      checks: sqlState("DELETE FROM maintenance_events WHERE kind = 'inspection'", 'SELECT id, kind FROM maintenance_events ORDER BY id', 'works', ['works-b'], { ordered: true }),
      constraints: [{ type: 'requires', node: 'sql:\\brollback\\b', message: 'Undo the mistaken change with ROLLBACK.' }],
      xpReward: 80, coinReward: 12,
    },
  ],
};
