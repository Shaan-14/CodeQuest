import { sqlState, text } from '../helpers';
import type { LessonBundle } from '../schema';

const START = '-- Write your statement(s) below\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-09-modify', title: 'Changing Data Safely', language: 'sql', skillId: 'sql.modify',
    blurb: 'INSERT, UPDATE and DELETE, and the habits that stop you destroying data.', prerequisites: ['sql-08-case'], xpReward: 55,
    reference: {
      title: 'INSERT, UPDATE, DELETE',
      body: text(
        '`INSERT INTO t (col1, col2) VALUES (a, b);` adds a row (leave out an `INTEGER PRIMARY KEY` column and the database numbers it). `UPDATE t SET col = value WHERE ...;` changes rows. `DELETE FROM t WHERE ...;` removes rows.',
        '**Habits that protect data**: (1) write the `WHERE` FIRST, (2) run it as a `SELECT` to see exactly which rows it touches, (3) only then change `SELECT ... FROM` into `UPDATE`/`DELETE`. An `UPDATE` or `DELETE` **without a WHERE hits every row**. (4) Delete in the right order: **foreign keys stop you deleting a row that others still refer to**, so remove the dependent rows (order lines) before their parent (the order).',
      ),
      example: "UPDATE products SET price = price * 1.1\nWHERE category = 'Tools';",
    },
    steps: [
      {
        kind: 'teach', title: 'Reading is safe. Writing is not.',
        body: text(
          'Everything so far only **read** data. `INSERT`, `UPDATE` and `DELETE` **change** it, and in a real database a mistake can be permanent: a missing `WHERE` has erased customer tables in real companies. Professionals use a routine to stay safe, and you will practise it here. (In CodeQuest every run starts from a fresh copy of the database, so you can experiment freely.)',
          'These challenges are checked by looking at the **data afterwards**: your statements can be written any way you like, as long as the database ends up in the right state.',
        ),
      },
      {
        kind: 'demo', title: 'Insert a row and look at it', language: 'sql', db: 'market',
        body: text('Add a customer, then read the table back. We leave out `id` so the database picks the next number.'),
        code: "INSERT INTO customers (name, city, joined_on)\nVALUES ('Test Person', 'Ely', '2024-01-15');\n\nSELECT id, name, city FROM customers ORDER BY id DESC LIMIT 2;",
        notice: 'The new row got the next `id` automatically. After any change, run a `SELECT` to confirm what really happened. Never assume.',
      },
      {
        kind: 'demo', title: 'The danger of a missing WHERE', language: 'sql', db: 'market',
        body: text('We meant to change one category. Predict what this does to the whole table, then run it.'),
        code: "UPDATE products SET price = 0;\n\nSELECT COUNT(*) AS free_products FROM products WHERE price = 0;",
        notice: 'Every product is now free. Without `WHERE`, `UPDATE` applies to every row. The safe routine is to write the `WHERE` first and test it as a `SELECT`.',
      },
      {
        kind: 'demo', title: 'A relationship that protects you', language: 'sql', db: 'market', expectsError: true,
        body: text('Customer 1 has orders. What does the database say when we try to delete them?'),
        code: 'DELETE FROM customers WHERE id = 1;',
        notice: 'A “FOREIGN KEY constraint failed” error: orders still point at this customer, so deleting the customer would leave orders pointing at nobody. The database refused. To remove a customer you must first deal with everything that refers to them.',
      },
      { kind: 'challenge', challengeId: 'sql-09-new-customer' },
      { kind: 'challenge', challengeId: 'sql-09-tool-price-rise' },
      { kind: 'challenge', challengeId: 'sql-09-remove-pending' },
    ],
  },
  objectives: [
    { id: 'sql-obj-update-where', title: 'Update exactly the right rows', summary: 'Use UPDATE with a precise WHERE so only the intended rows change.' },
    { id: 'sql-obj-delete-safe', title: 'Delete safely, in the right order', summary: 'Delete rows and their dependants without breaking foreign keys.' },
  ],
  challenges: [
    {
      id: 'sql-09-new-customer', title: 'Welcome, New Customer', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.modify'], concepts: ['INSERT', 'VALUES'], difficulty: 2, context: 'retail',
      prompt: text('Add a new customer named `Priya Nair` who lives in `Bath` and joined on `2024-02-01`. Do not choose an `id`: let the database number the new row.'),
      expectedBehavior: 'The customers table has one new row with those values.',
      guidedSteps: ['`INSERT INTO customers (name, city, joined_on)`', '`VALUES (\'Priya Nair\', \'Bath\', \'2024-02-01\');`', 'Run it, then check with a `SELECT`.'],
      starterCode: START,
      hints: ['Name the columns you are filling in, then give the values in the same order.', 'Text and dates go in single quotes; the `id` column is left out.', '`INSERT INTO customers (...) VALUES (...)` with three columns and three values.'],
      checks: sqlState("INSERT INTO customers (name, city, joined_on) VALUES ('Priya Nair', 'Bath', '2024-02-01')", ['SELECT name, city, joined_on FROM customers ORDER BY id DESC LIMIT 1', 'SELECT COUNT(*) FROM customers'], 'market', ['market-b']),
      xpReward: 50, coinReward: 6,
    },
    {
      id: 'sql-09-tool-price-rise', objectiveId: 'sql-obj-update-where', title: 'A Price Rise for Tools', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.modify'], concepts: ['UPDATE', 'WHERE'], difficulty: 2, context: 'retail',
      prompt: text('Supplier costs went up. **Raise the price of every product in the `Tools` category by 10%.** All other products must stay exactly as they are.'),
      expectedBehavior: 'Only Tools prices change (×1.1). Everything else is unchanged.',
      starterCode: '',
      hints: ['One statement changes existing rows.', 'Without a condition it changes every row. Decide which rows should change.', '`UPDATE products SET price = price * ...` with a `WHERE` on the category.'],
      checks: sqlState("UPDATE products SET price = price * 1.1 WHERE category = 'Tools'", 'SELECT id, ROUND(price, 2) FROM products ORDER BY id', 'market', ['market-b'], { ordered: true }),
      xpReward: 65, coinReward: 8,
    },
    {
      id: 'sql-09-fill-costs', objectiveId: 'sql-obj-update-where', title: 'Fill the Missing Costs', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.modify'], concepts: ['UPDATE', 'WHERE'], difficulty: 2, context: 'accounting',
      prompt: text('Accounting has decided that maintenance events with **no recorded cost** should be treated as costing **0** for the year-end report. **Set `cost` to `0` for those events only.** Events that already have a cost must not change.'),
      expectedBehavior: 'Events whose cost was NULL now have 0. All others are unchanged.',
      starterCode: '',
      hints: ['You need to change only rows where a value is missing.', 'Remember the special test for missing values.', '`UPDATE maintenance_events SET cost = 0 WHERE` the cost `IS NULL`.'],
      checks: sqlState('UPDATE maintenance_events SET cost = 0 WHERE cost IS NULL', 'SELECT id, cost FROM maintenance_events ORDER BY id', 'works', ['works-b'], { ordered: true }),
      xpReward: 65, coinReward: 8,
    },
    {
      id: 'sql-09-remove-pending', objectiveId: 'sql-obj-delete-safe', title: 'Clear the Pending Orders', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.modify', 'db.integrity'], concepts: ['DELETE', 'foreign key', 'order of operations'], difficulty: 3, context: 'retail',
      prompt: text('The shop is abandoning **`pending` orders**. **Delete every pending order together with its order lines.** Other orders and their lines must be untouched, and no order line may be left pointing at a missing order.'),
      expectedBehavior: 'No pending orders remain, none of their lines remain, and everything else is intact.',
      starterCode: '',
      hints: ['If you delete an order first, its lines still point at it. What does the database do?', 'Delete the dependent rows before the parent rows.', 'First `DELETE FROM order_items WHERE order_id IN (` the pending orders `)`, then delete the pending orders themselves.'],
      checks: sqlState("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE status = 'pending'); DELETE FROM orders WHERE status = 'pending'", ['SELECT (SELECT COUNT(*) FROM orders), (SELECT COUNT(*) FROM order_items)', 'SELECT COUNT(*) FROM order_items WHERE order_id NOT IN (SELECT id FROM orders)'], 'market', ['market-b']),
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'sql-09-retire-machine', objectiveId: 'sql-obj-delete-safe', title: 'Retire a Machine', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.modify', 'db.integrity'], concepts: ['DELETE', 'foreign key', 'order of operations'], difficulty: 3, context: 'manufacturing',
      prompt: text('**Machine 9 has been decommissioned.** Remove it from the `machines` table **and** delete all of its maintenance events. Nothing else may change.'),
      expectedBehavior: 'Machine 9 and its events are gone. All other machines and events remain.',
      starterCode: '',
      hints: ['Events point at their machine.', 'The database will not let you delete a machine that other rows still refer to.', 'Delete the machine’s events first (`WHERE machine_id = 9`), then the machine itself.'],
      checks: sqlState('DELETE FROM maintenance_events WHERE machine_id = 9; DELETE FROM machines WHERE id = 9', ['SELECT (SELECT COUNT(*) FROM machines), (SELECT COUNT(*) FROM maintenance_events)', 'SELECT COUNT(*) FROM maintenance_events WHERE machine_id NOT IN (SELECT id FROM machines)'], 'works', ['works-b']),
      xpReward: 80, coinReward: 12,
    },
  ],
};
