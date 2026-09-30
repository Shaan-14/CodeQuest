import { sqlRes, sqlState, text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const plan = (name: string, db: string, query: string): Check => ({ kind: 'sqlPlan', name, db, query, mustMatch: 'SEARCH .*USING (COVERING )?INDEX', mustNotMatch: 'SCAN', visible: false, feedback: 'The database still reads a whole table for one of the lookups. Which columns are the lookups filtering on?' });

/**
 * INDEPENDENT MODE (SQL review trial). Older skills (selecting, modifying, performance) on fresh questions.
 * Problem statements only: no hints, no starter, no named clauses/functions, no concept tags.
 */
export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-15-independent-review', title: 'Trial: Old Skills, New Questions', language: 'sql', skillId: 'sql.select',
    blurb: 'Five open problems: two questions, two changes and a slow lookup. No hints; hidden data.', prerequisites: ['sql-13-integrity-performance'], xpReward: 0,
    reference: { title: 'Independent trials', body: 'An independent trial gives you a problem and nothing else. Use the schema panel, the Field Manual, and experiments with Run. The hidden checks use different data from the example.' },
    steps: [
      { kind: 'challenge', challengeId: 'sql-15-cheap-stock' },
      { kind: 'challenge', challengeId: 'sql-15-unmanaged-veterans' },
      { kind: 'challenge', challengeId: 'sql-15-price-rise' },
      { kind: 'challenge', challengeId: 'sql-15-archive-old-orders' },
      { kind: 'challenge', challengeId: 'sql-15-slow-lookups' },
    ],
  },
  objectives: [],
  challenges: [
    {
      id: 'sql-15-cheap-stock', title: 'The Cheapest Safe Buys', mode: 'independent', language: 'sql', db: 'market', skillIds: ['sql.select'], concepts: [], difficulty: 3, transfer: true, context: 'retail',
      prompt: text('A buyer wants the **five cheapest products that are actually in stock** (at least one in stock) **in the categories Tools or Safety**. List each product’s **name** and **price**, cheapest first; products with the same price are listed by name, A to Z.'),
      starterCode: '', hints: [],
      checks: sqlRes("SELECT name, price FROM products WHERE stock >= 1 AND category IN ('Tools', 'Safety') ORDER BY price, name LIMIT 5", 'market', ['market-b'], { ordered: true, columns: 'names' }),
      xpReward: 110, coinReward: 18,
    },
    {
      id: 'sql-15-unmanaged-veterans', title: 'The Long-Serving Independents', mode: 'independent', language: 'sql', db: 'works', skillIds: ['sql.select'], concepts: [], difficulty: 3, transfer: true, context: 'human resources',
      prompt: text('HR wants to recognise long-serving staff who report to nobody. List the **name**, **role** and **hired_on** date of every employee who has **no manager** and was hired **before 2024**, oldest hire first; people hired on the same day are listed by name, A to Z.'),
      starterCode: '', hints: [],
      checks: sqlRes("SELECT name, role, hired_on FROM employees WHERE manager_id IS NULL AND hired_on < '2024-01-01' ORDER BY hired_on, name", 'works', ['works-b'], { ordered: true, columns: 'names' }),
      xpReward: 110, coinReward: 18,
    },
    {
      id: 'sql-15-price-rise', title: 'The Capped Price Rise', mode: 'independent', language: 'sql', db: 'market', skillIds: ['sql.modify'], concepts: [], difficulty: 3, transfer: true, context: 'finance',
      prompt: text('Prices go up **8%** for every product with **fewer than 20 in stock**, rounded to 2 decimal places, but no price may ever go above **100.00** (a product that would exceed it is set to exactly 100.00; a product already above 100.00 that qualifies is also set to 100.00). Products with 20 or more in stock are left alone. Apply this change to the database.'),
      starterCode: '', hints: [],
      checks: sqlState("UPDATE products SET price = MIN(ROUND(price * 1.08, 2), 100.0) WHERE stock < 20", 'SELECT id, price FROM products ORDER BY id', 'market', ['market-b'], { ordered: true }),
      xpReward: 120, coinReward: 20,
    },
    {
      id: 'sql-15-archive-old-orders', title: 'The Order Archive', mode: 'independent', language: 'sql', db: 'market', skillIds: ['sql.modify', 'db.integrity'], concepts: [], difficulty: 4, transfer: true, context: 'operations',
      prompt: text(
        'The orders table has grown too big. Move every order placed **before 1 August 2024** into a new table called `order_archive`, which has the same columns as `orders`, and remove those orders from `orders`. Their order lines must not be left behind: the database must not end up with lines that belong to no order, and the archived orders’ lines are simply deleted from `order_items`.',
      ),
      starterCode: '', hints: [],
      checks: sqlState(
        "CREATE TABLE order_archive AS SELECT * FROM orders WHERE ordered_on < '2024-08-01'; DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE ordered_on < '2024-08-01'); DELETE FROM orders WHERE ordered_on < '2024-08-01'",
        ['SELECT id, customer_id, ordered_on, status FROM order_archive ORDER BY id', 'SELECT id FROM orders ORDER BY id', 'SELECT COUNT(*) FROM order_items', 'SELECT COUNT(*) FROM order_items WHERE order_id NOT IN (SELECT id FROM orders)'],
        'market', ['market-b'], { ordered: true },
      ),
      xpReward: 150, coinReward: 24,
    },
    {
      id: 'sql-15-slow-lookups', title: 'The Slow Lookups', mode: 'independent', language: 'sql', db: 'market', skillIds: ['db.performance'], concepts: [], difficulty: 4, transfer: true, context: 'software',
      prompt: text('Two lookups are far too slow now that the market has millions of rows: fetching **all the orders of one customer**, and fetching **all the lines of one order**. Change the database so that both lookups can find their rows without reading whole tables. Do not change or remove any data.'),
      starterCode: '', hints: [],
      checks: [
        plan('Orders of one customer', 'market', 'SELECT * FROM orders WHERE customer_id = 5'),
        plan('Lines of one order', 'market', 'SELECT * FROM order_items WHERE order_id = 7'),
        plan('Still fast on other data', 'market-b', 'SELECT * FROM orders WHERE customer_id = 3'),
        ...sqlState('CREATE INDEX ref_a ON orders(customer_id); CREATE INDEX ref_b ON order_items(order_id)', 'SELECT (SELECT COUNT(*) FROM orders), (SELECT COUNT(*) FROM order_items), (SELECT COUNT(*) FROM customers), (SELECT COUNT(*) FROM products)', 'market', ['market-b']).map((c) => ({ ...c, name: 'No data was harmed', visible: false })),
      ],
      xpReward: 130, coinReward: 20,
    },
  ],
};
