import { sqlRes, text } from '../helpers';
import type { LessonBundle } from '../schema';

/**
 * INDEPENDENT MODE (SQL). Problem statements only: no hints, no starter, no named clauses/functions, no
 * concept tags. Hidden data checks defeat hard-coded answers; the design task is judged structurally.
 */
export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-14-independent', title: 'Trial: The Records Hall', language: 'sql', skillId: 'sql.joins',
    blurb: 'Three open problems: two questions and a design. No hints.', prerequisites: ['sql-13-integrity-performance'], xpReward: 0,
    reference: { title: 'Independent trials', body: 'An independent trial gives you a problem and nothing else. Use the schema panel, the Field Manual, and experiments with Run. The hidden checks use different data from the example.' },
    steps: [
      { kind: 'challenge', challengeId: 'sql-14-loyal-customers' },
      { kind: 'challenge', challengeId: 'sql-14-costly-departments' },
      { kind: 'challenge', challengeId: 'sql-14-design-bikeshare' },
    ],
  },
  challenges: [
    {
      id: 'sql-14-loyal-customers', title: 'The Loyal Customers', mode: 'independent', language: 'sql', db: 'market', skillIds: ['sql.joins', 'sql.aggregate', 'sql.advanced'], concepts: [], difficulty: 4, transfer: true, context: 'customer analytics', project: true,
      prompt: text(
        'The market wants to reward its most loyal customers. A loyal customer has placed orders in **at least 3 different calendar months** and has **never had an order returned**.',
        'List each loyal customer’s **name** and their **number of orders** (call it `orders`). The customer with the most orders comes first; customers with equally many orders are listed by name, A to Z.',
      ),
      starterCode: '',
      hints: [],
      checks: sqlRes("SELECT c.name, COUNT(*) AS orders FROM customers c JOIN orders o ON o.customer_id = c.id WHERE c.id NOT IN (SELECT customer_id FROM orders WHERE status = 'returned') GROUP BY c.id HAVING COUNT(DISTINCT strftime('%Y-%m', o.ordered_on)) >= 3 ORDER BY orders DESC, c.name", 'market', ['market-b'], { ordered: true, columns: 'names' }),
      xpReward: 160, coinReward: 25,
    },
    {
      id: 'sql-14-costly-departments', title: 'The Expensive Departments', mode: 'independent', language: 'sql', db: 'works', skillIds: ['sql.joins', 'sql.aggregate', 'sql.advanced'], concepts: [], difficulty: 4, transfer: true, context: 'operations', project: true,
      prompt: text(
        'The finance director wants to know which departments run the most expensive equipment. List each department’s **name**, the **number of machines** it owns (`machines`) and the **average purchase cost** of those machines (`avg_cost`), but only for departments whose average machine cost is **higher than the average machine cost across the whole factory**.',
        'Show the department with the highest average first.',
      ),
      starterCode: '',
      hints: [],
      checks: sqlRes('SELECT d.name, COUNT(*) AS machines, AVG(m.purchase_cost) AS avg_cost FROM departments d JOIN machines m ON m.department_id = d.id GROUP BY d.id HAVING AVG(m.purchase_cost) > (SELECT AVG(purchase_cost) FROM machines) ORDER BY avg_cost DESC', 'works', ['works-b'], { ordered: true, columns: 'names', approx: 1e-6 }),
      xpReward: 160, coinReward: 25,
    },
    {
      id: 'sql-14-design-bikeshare', title: 'The Bike-Share Scheme', mode: 'independent', language: 'sql', db: 'blank', skillIds: ['db.design', 'db.integrity', 'ps.decomposition'], concepts: [], difficulty: 4, transfer: true, context: 'transport', project: true,
      prompt: text(
        'A city runs a community bike-share scheme and needs a database. It must record its **bikes**, its **docking stations**, its **members**, and every **trip** a member takes: which bike, where it started and where it ended, and when.',
        'Design the tables and create them in this database. Choose your own names. Think about what should be stored once, how the tables relate, and what the database itself should refuse.',
      ),
      starterCode: '',
      hints: [],
      checks: [{
        kind: 'sqlSchema', name: 'The design meets the requirements', db: 'blank', rules: [
          { rule: 'minTables', n: 4, message: 'separate tables for the different kinds of thing.' },
          { rule: 'hasPrimaryKeys', message: 'a primary key on every table.' },
          { rule: 'tableLike', pattern: 'bike|cycle', message: 'a table for bikes.' },
          { rule: 'tableLike', pattern: 'station|dock', message: 'a table for docking stations.' },
          { rule: 'tableLike', pattern: 'member|user|rider|customer', message: 'a table for members.' },
          { rule: 'tableLike', pattern: 'trip|ride|journey|rental', message: 'a table for trips.' },
          { rule: 'foreignKey', from: 'trip|ride|journey|rental', to: 'bike|cycle', message: 'trips linked to bikes.' },
          { rule: 'foreignKey', from: 'trip|ride|journey|rental', to: 'member|user|rider|customer', message: 'trips linked to members.' },
          { rule: 'foreignKey', from: 'trip|ride|journey|rental', to: 'station|dock', message: 'trips linked to stations.' },
          { rule: 'noColumnLike', pattern: '(member|user|rider|bike|station)_?name', message: 'no copies of names outside the tables they belong to.' },
          { rule: 'hasConstraint', table: 'member|user|rider|customer', message: 'at least one constraint on the members table (such as required or unique fields).' },
        ],
      }],
      xpReward: 160, coinReward: 25,
    },
  ],
};
