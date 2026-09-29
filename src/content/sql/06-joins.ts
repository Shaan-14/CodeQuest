import { sqlRes, text } from '../helpers';
import type { Constraint, LessonBundle } from '../schema';

const START = '-- Write your query below\n';
const JOIN: Constraint = { type: 'requires', node: 'sql:\\bjoin\\b', message: 'This task needs data from more than one table: use a JOIN.' };

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-06-joins', title: 'Relationships: Joining Tables', language: 'sql', skillId: 'sql.joins',
    blurb: 'Primary keys, foreign keys, and INNER JOIN across two and three tables.', prerequisites: ['sql-05-group'], xpReward: 55,
    reference: {
      title: 'Keys and JOIN',
      body: text(
        'Data is split across tables to avoid repeating it. A **primary key** uniquely identifies a row (`customers.id`). A **foreign key** is a column holding another table’s key (`orders.customer_id` refers to `customers.id`). Together they express a **relationship**: one customer has many orders.',
        '`FROM orders o JOIN customers c ON c.id = o.customer_id` pairs each order with its customer. **Always write the `ON` condition**: without it every row pairs with every row. Use short **aliases** (`o`, `c`) and prefix columns (`o.id`, `c.name`) because both tables have an `id`. Join a third table by adding another `JOIN ... ON ...`.',
        'Plain `JOIN` (an INNER JOIN) keeps only rows that have a match on both sides.',
      ),
      example: 'SELECT c.name, o.id\nFROM orders o\nJOIN customers c ON c.id = o.customer_id;',
    },
    steps: [
      {
        kind: 'teach', title: 'Why data is split into tables',
        body: text(
          'Imagine storing each order as one row containing the customer’s name and city. Every order by the same customer would repeat that information, and correcting a typo would mean editing hundreds of rows. So relational databases keep **one row per customer** in one table and **one row per order** in another, and link them with a **key**.',
          'The price of this design is that a question like “the customer names on each order” needs the two tables put back together at query time. That is exactly what `JOIN` does. It is the single most important idea in relational databases.',
        ),
      },
      {
        kind: 'demo', title: 'Two tables, one answer', language: 'sql', db: 'market',
        body: text('Look at the schema panel: `orders.customer_id` points to `customers.id`. Run the query and read the join line.'),
        code: 'SELECT o.id AS order_id, c.name AS customer, o.status\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nORDER BY o.id\nLIMIT 6;',
        notice: 'Each order row was matched with the customer whose `id` equals its `customer_id`. The alias prefixes (`o.`, `c.`) say which table each column comes from. Customer names now sit beside order data that never stored them.',
      },
      {
        kind: 'demo', title: 'Forgetting the ON condition', language: 'sql', db: 'market',
        body: text('This is a very common mistake. Guess how many rows come back, then run it and read the count.'),
        code: 'SELECT COUNT(*) AS pairs\nFROM orders o\nJOIN customers c;',
        notice: 'Every order paired with every customer: (number of orders) × (number of customers) rows of nonsense. A join without a condition is a Cartesian product. If a result suddenly has a huge number of rows, check your `ON`.',
      },
      {
        kind: 'demo', title: 'Chaining three tables', language: 'sql', db: 'market',
        body: text('To find what each customer bought, follow the relationships: customer → orders → order lines. Each link is one `JOIN ... ON`.'),
        code: 'SELECT c.name, o.id AS order_id, i.quantity, i.unit_price\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nJOIN order_items i ON i.order_id = o.id\nORDER BY c.name, o.id\nLIMIT 6;',
        notice: 'Three tables, two joins, each with its own `ON`. You can build any path through a database this way, as long as you follow the keys.',
      },
      { kind: 'challenge', challengeId: 'sql-06-order-customers' },
      { kind: 'challenge', challengeId: 'sql-06-repairs-with-names' },
      { kind: 'challenge', challengeId: 'sql-06-spend-per-customer' },
    ],
  },
  objectives: [
    { id: 'sql-obj-join-two', title: 'Join two related tables', summary: 'Use a foreign key to bring information from a second table into the result.' },
    { id: 'sql-obj-join-three', title: 'Follow a chain of relationships', summary: 'Join three tables and aggregate across them.' },
  ],
  challenges: [
    {
      id: 'sql-06-order-customers', title: 'Who Placed the Order?', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.joins'], concepts: ['JOIN', 'foreign key', 'alias'], difficulty: 2, context: 'retail',
      prompt: text('Show each order’s **id** together with the **name of the customer** who placed it.'),
      expectedBehavior: 'Two columns: order id and customer name; one row per order.',
      guidedSteps: ['Start from `orders` and give it the alias `o`.', 'Join `customers c` on `c.id = o.customer_id`.', 'Select `o.id` and `c.name`.'],
      starterCode: START,
      hints: ['The customer’s name is not in the orders table, so you need a second table.', 'Look in the schema panel for the column in `orders` that refers to a customer.', 'Join `customers` where its `id` equals the order’s `customer_id`.'],
      checks: sqlRes('SELECT o.id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id', 'market', ['market-b']),
      constraints: [JOIN],
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-06-repairs-with-names', objectiveId: 'sql-obj-join-two', title: 'Which Machine Was Repaired?', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.joins'], concepts: ['JOIN', 'foreign key', 'alias'], difficulty: 2, context: 'manufacturing',
      prompt: text('List every **repair** event with its **id**, its **event_date** and the **name of the machine** it was performed on.'),
      expectedBehavior: 'Three columns: event id, event_date, machine name, for repair events only.',
      starterCode: '',
      hints: ['The machine’s name lives in a different table from the events.', 'Find the column that links an event to its machine, then join on it. Filter the kind of event as well.', 'Join `machines` on its `id` equal to the event’s `machine_id`, and add `WHERE kind = ...`.'],
      checks: sqlRes("SELECT e.id, e.event_date, m.name FROM maintenance_events e JOIN machines m ON m.id = e.machine_id WHERE e.kind = 'repair'", 'works', ['works-b']),
      constraints: [JOIN],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'sql-06-players-teams', objectiveId: 'sql-obj-join-two', title: 'Players and Their Teams', mode: 'challenge', language: 'sql', db: 'league', skillIds: ['sql.joins'], concepts: ['JOIN', 'foreign key', 'alias'], difficulty: 2, context: 'sports analytics',
      prompt: text('List every player’s **name** (as `player`) together with the **name of their team** (as `team`).'),
      expectedBehavior: 'Two columns named player and team, one row per player.',
      starterCode: '',
      hints: ['Both tables have a column called `name`, so you will need to say which is which.', 'The players table refers to a team by its id.', 'Join `teams` where its `id` equals `players.team_id`, and rename the two name columns with `AS`.'],
      checks: sqlRes('SELECT p.name AS player, t.name AS team FROM players p JOIN teams t ON t.id = p.team_id', 'league', ['league-b'], { columns: 'names' }),
      constraints: [JOIN],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'sql-06-spend-per-customer', objectiveId: 'sql-obj-join-three', title: 'Who Spends the Most?', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.joins', 'sql.aggregate'], concepts: ['JOIN', 'three tables', 'GROUP BY', 'SUM'], difficulty: 3, context: 'retail',
      prompt: text('For each customer who has placed orders, show their **name** and the **total they have spent** (quantity × unit price over all their order lines), named `total_spent`. The biggest spender comes first.'),
      expectedBehavior: 'One row per customer with orders: name and total_spent, largest first.',
      starterCode: '',
      hints: ['The amounts live on the order lines; the names live on customers. What connects them?', 'Follow the chain: customers → orders → order lines, then group by customer.', 'Two joins, `SUM(i.quantity * i.unit_price)`, `GROUP BY` the customer, sorted descending.'],
      checks: sqlRes('SELECT c.name, SUM(i.quantity * i.unit_price) AS total_spent FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id GROUP BY c.id ORDER BY total_spent DESC', 'market', ['market-b'], { ordered: true, columns: 'names', approx: 1e-6 }),
      constraints: [JOIN],
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'sql-06-downtime-by-department', objectiveId: 'sql-obj-join-three', title: 'Which Department Loses the Most Time?', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.joins', 'sql.aggregate'], concepts: ['JOIN', 'three tables', 'GROUP BY', 'SUM'], difficulty: 3, context: 'operations',
      prompt: text('For **repair** events only, show each **department’s name** and the **total downtime hours** of repairs on machines belonging to it, as `total_downtime`. The department losing the most time comes first. Departments with no repairs are left out.'),
      expectedBehavior: 'department name and total_downtime, largest first.',
      starterCode: '',
      hints: ['An event knows its machine; a machine knows its department; a department knows its name.', 'Follow both links with two joins, filter the kind, then group by department.', '`maintenance_events` → `machines` → `departments`, `GROUP BY` the department, `SUM(downtime_hours)`, sort descending.'],
      checks: sqlRes("SELECT d.name, SUM(e.downtime_hours) AS total_downtime FROM maintenance_events e JOIN machines m ON m.id = e.machine_id JOIN departments d ON d.id = m.department_id WHERE e.kind = 'repair' GROUP BY d.id ORDER BY total_downtime DESC", 'works', ['works-b'], { ordered: true, columns: 'names', approx: 1e-6 }),
      constraints: [JOIN],
      xpReward: 85, coinReward: 12,
    },
  ],
};
