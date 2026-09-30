import { sqlRes, text } from '../helpers';
import type { LessonBundle } from '../schema';

const START = '-- Write your query below\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-17-sets-self-joins', title: 'Tables Talking to Themselves', language: 'sql', skillId: 'sql.sets',
    blurb: 'A table can be joined to itself, and query results can be combined like sets: both, either, one but not the other.', prerequisites: ['sql-10-subqueries'], xpReward: 70,
    reference: {
      title: 'Self-joins and set operations',
      body: text(
        'A **self-join** joins a table to *itself* under two different **aliases**: `FROM employees e JOIN employees m ON m.id = e.manager_id` reads "each employee, and the row of their manager". Use a `LEFT JOIN` when some rows have no partner (a boss has no manager). To pair rows without repeats, add `a.id < b.id`: each unordered pair appears once and nobody is paired with themselves.',
        '**Set operations** combine two queries with the same number of columns: `UNION` (rows in either, duplicates removed; `UNION ALL` keeps them), `INTERSECT` (rows in both), `EXCEPT` (rows in the first but not the second). They put the "and", "or" and "but not" in the *result*, so each side can stay simple. The same questions can be asked with `IN` / `NOT IN` / `EXISTS`; use whichever reads more clearly.',
        '**NULL caution:** `x NOT IN (subquery)` returns *nothing* if the subquery contains a `NULL`. Filter it out (`WHERE col IS NOT NULL`) or use `NOT EXISTS`, which does not have this trap.',
      ),
      example: 'SELECT e.name, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON m.id = e.manager_id;',
    },
    steps: [
      { kind: 'teach', title: 'One table, two roles', body: text('Some relationships live inside a single table: an employee has a manager who is also an employee; two customers live in the same city. To ask about them you use the table **twice**, under different aliases, as if it were two tables playing different roles.', 'Other questions are about **groups of rows** rather than columns: "people who did A *and* B", "things that have X *but not* Y". Those are set operations on results.') },
      {
        kind: 'demo', title: 'Employees and their managers', language: 'sql', db: 'works',
        body: text('The same table appears as `e` (the employee) and `m` (the manager). The `LEFT JOIN` keeps people without a manager.'),
        code: "SELECT e.name AS employee, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON m.id = e.manager_id\nORDER BY e.name\nLIMIT 8;",
        notice: 'Supervisors at the top have no manager, so their `manager` is empty. With a plain `JOIN` they would vanish from the result entirely.',
      },
      {
        kind: 'demo', title: 'Pairs, and "in one but not the other"', language: 'sql', db: 'market',
        body: text('Customers in the same city, each pair once; then cities with customers in one list but not the other.'),
        code: "SELECT a.name, b.name, a.city\nFROM customers a\nJOIN customers b ON a.city = b.city AND a.id < b.id\nORDER BY a.city, a.name\nLIMIT 6;\n\nSELECT DISTINCT city FROM customers WHERE city IS NOT NULL\nEXCEPT\nSELECT DISTINCT c.city FROM customers c JOIN orders o ON o.customer_id = c.id WHERE c.city IS NOT NULL;",
        notice: 'Without `a.id < b.id` every pair would appear twice (A–B and B–A) and every customer would be paired with themselves. The second query lists cities where nobody has ordered (there may be none).',
      },
      { kind: 'challenge', challengeId: 'sql-17-employee-managers' },
      { kind: 'challenge', challengeId: 'sql-17-role-pairs' },
      { kind: 'challenge', challengeId: 'sql-17-paid-and-returned' },
    ],
  },
  objectives: [
    { id: 'sql-obj-self-join', title: 'Pair rows of a table with each other', summary: 'Join a table to itself under two aliases and list each pair once.' },
    { id: 'sql-obj-set-ops', title: 'Combine groups: both, either, but not', summary: 'Answer "has A and B" and "has A but not B" with set operations or their equivalents, avoiding the NULL trap.' },
  ],
  challenges: [
    {
      id: 'sql-17-employee-managers', title: 'Who Reports to Whom', mode: 'learning', language: 'sql', db: 'works', skillIds: ['sql.sets', 'sql.joins'], concepts: ['self-join', 'alias', 'LEFT JOIN'], difficulty: 3, context: 'manufacturing',
      prompt: text('Show every employee’s `employee` name and the name of their manager as `manager`. People without a manager must still appear, with an empty `manager`. Order by employee name.'),
      expectedBehavior: 'One row per employee with their manager’s name (empty for people without one).',
      guidedSteps: ['Use `employees` twice with aliases (`e` for the employee, `m` for the manager).', 'Join on `m.id = e.manager_id`.', 'Use a `LEFT JOIN` so employees without a manager are kept.', 'Select `e.name AS employee, m.name AS manager` and order by `e.name`.'],
      starterCode: START,
      hints: ['One table plays two roles here. How do you make SQL treat it as two?', 'Which column of the employee points at the manager’s row?', 'What would an inner join do to people who have no manager?'],
      checks: sqlRes('SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON m.id = e.manager_id ORDER BY e.name', 'works', ['works-b'], { ordered: true, columns: 'names' }),
      xpReward: 65, coinReward: 9,
    },
    {
      id: 'sql-17-role-pairs', objectiveId: 'sql-obj-self-join', title: 'Colleagues With the Same Role', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.sets', 'sql.joins'], concepts: ['self-join', 'alias', 'pairs'], difficulty: 3, context: 'manufacturing',
      prompt: text('The shift planner wants to pair up colleagues who could cover for each other: employees in the **same department** with the **same role**. List every such pair **once** as `first` and `second` (their names), with the employee who has the lower `id` as `first`. Order by `first`, then `second`.'),
      expectedBehavior: 'Each qualifying pair exactly once, lower id first.',
      starterCode: '',
      hints: ['Two copies of the same table are needed. What must match between them?', 'A pair A–B should not also appear as B–A, and nobody is their own colleague. One comparison fixes both.', 'Compare the ids of the two rows with `<`.'],
      checks: sqlRes('SELECT a.name AS first, b.name AS second FROM employees a JOIN employees b ON a.department_id = b.department_id AND a.role = b.role AND a.id < b.id ORDER BY a.name, b.name', 'works', ['works-b'], { ordered: true, columns: 'names' }),
      xpReward: 90, coinReward: 13,
    },
    {
      id: 'sql-17-city-pairs', objectiveId: 'sql-obj-self-join', title: 'Neighbours in the Same City', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.sets', 'sql.joins'], concepts: ['self-join', 'alias', 'pairs'], difficulty: 3, context: 'retail',
      prompt: text('The market wants to introduce customers who live in the **same city** so they can share deliveries. List every such pair **once** as `first` and `second` (their names), with the customer who has the lower `id` as `first`. Customers with no city are never paired. Order by `first`, then `second`.'),
      expectedBehavior: 'Each pair of customers in the same known city exactly once, lower id first.',
      starterCode: '',
      hints: ['The same table is needed twice, under two names.', 'Two customers match when they share a city. What happens when a city is unknown (NULL)?', 'Use a comparison of the ids so that each pair appears in only one order.'],
      checks: sqlRes('SELECT a.name AS first, b.name AS second FROM customers a JOIN customers b ON a.city = b.city AND a.id < b.id ORDER BY a.name, b.name', 'market', ['market-b'], { ordered: true, columns: 'names' }),
      xpReward: 90, coinReward: 13,
    },
    {
      id: 'sql-17-paid-and-returned', objectiveId: 'sql-obj-set-ops', title: 'Paid and Returned', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.sets', 'sql.advanced'], concepts: ['set-operations', 'IN', 'membership'], difficulty: 3, context: 'retail',
      prompt: text('Customer service wants to talk to customers who have **both** a `paid` order **and** a `returned` order. List their `name` values, A to Z.'),
      expectedBehavior: 'Names of customers who have at least one paid order and at least one returned order, alphabetically.',
      starterCode: '',
      hints: ['Two separate facts about each customer must both be true.', 'Each fact is a small query on its own; how can you require both?', 'A set operation, or two membership tests, can combine them.'],
      checks: sqlRes("SELECT c.name FROM customers c WHERE c.id IN (SELECT customer_id FROM orders WHERE status = 'paid') AND c.id IN (SELECT customer_id FROM orders WHERE status = 'returned') ORDER BY c.name", 'market', ['market-b'], { ordered: true }),
      xpReward: 90, coinReward: 13,
    },
    {
      id: 'sql-17-inspected-never-repaired', objectiveId: 'sql-obj-set-ops', title: 'Inspected but Never Repaired', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.sets', 'sql.advanced'], concepts: ['set-operations', 'IN', 'membership'], difficulty: 3, context: 'manufacturing',
      prompt: text('Maintenance wants a list of machines that have been **inspected at least once** but have **never needed a repair**. List their `name` values, A to Z. (An event’s `kind` is `routine`, `inspection` or `repair`.)'),
      expectedBehavior: 'Names of machines with an inspection event and no repair event, alphabetically.',
      starterCode: '',
      hints: ['One fact must be true and another must be false for each machine.', 'Each fact is a small query on its own; how do you say "in the first list but not in the second"?', 'A set operation or a membership test with `NOT` can express it; beware of NULLs inside `NOT IN`.'],
      checks: sqlRes("SELECT m.name FROM machines m WHERE m.id IN (SELECT machine_id FROM maintenance_events WHERE kind = 'inspection') AND m.id NOT IN (SELECT machine_id FROM maintenance_events WHERE kind = 'repair') ORDER BY m.name", 'works', ['works-b'], { ordered: true }),
      xpReward: 90, coinReward: 13,
    },
  ],
};
