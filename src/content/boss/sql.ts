import type { Challenge } from '../schema';
import { sqlRes } from '../helpers';
import { bossChallenge } from './helpers';

const hidden = { visible: false } as const;

/** SQL boss versions. Results are graded on the visible database and on a hidden twin. */
export const sqlBossChallenges: Challenge[] = [
  // ---- mini-boss: The Ledger Keeper (joins + aggregates; two versions)
  bossChallenge({
    id: 'boss-sql-ledger-a', title: 'The Ledger Keeper: Best Cities', language: 'sql', db: 'market', skillIds: ['sql.joins', 'sql.aggregate'], difficulty: 3, context: 'retail',
    boss: { bossId: 'mini-sql-joins', version: 'a' },
    prompt: 'For each customer `city`, show the number of orders placed by customers who live there (`orders`) and the number of different customers who placed at least one (`buyers`). Cities where nobody has ordered are left out, and customers with no city are ignored. Most orders first; ties by city. Return the columns `city`, `orders`, `buyers`.',
    checks: sqlRes('SELECT c.city AS city, COUNT(o.id) AS orders, COUNT(DISTINCT c.id) AS buyers FROM customers c JOIN orders o ON o.customer_id = c.id WHERE c.city IS NOT NULL GROUP BY c.city ORDER BY orders DESC, c.city', 'market', ['market-b'], { ordered: true, columns: 'names', ...hidden }),
  }),
  bossChallenge({
    id: 'boss-sql-ledger-b', title: 'The Ledger Keeper: Last Seen', language: 'sql', db: 'market', skillIds: ['sql.joins', 'sql.aggregate'], difficulty: 3, context: 'customer service',
    boss: { bossId: 'mini-sql-joins', version: 'b' },
    prompt: 'Show every customer, including those who have never ordered: their `name` and the date of their most recent order (`last_order`, empty when they have none). Customers who ordered most recently come first; customers with no orders come last; ties by name.',
    checks: sqlRes('SELECT c.name AS name, MAX(o.ordered_on) AS last_order FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY last_order IS NULL, last_order DESC, c.name', 'market', ['market-b'], { ordered: true, columns: 'names', ...hidden }),
  }),
  // ---- mastery boss: The Warden of Archives (unfamiliar schema, several tables, subtle requirements)
  bossChallenge({
    id: 'boss-sql-mastery-a', title: 'Mastery Trial: Above Their Department', language: 'sql', db: 'works', skillIds: ['sql.joins', 'sql.aggregate', 'sql.advanced'], difficulty: 5, context: 'manufacturing',
    boss: { bossId: 'mastery-sql', version: 'a' },
    prompt: 'HR wants to know, for each department, who is paid the most and how many people are paid above the department average.\n\nReturn one row per department with the columns `department`, `top_earner` (the name of the employee with the highest `hourly_rate` in it; equal rates go to the name that comes first A to Z), and `above_average` (how many of its employees earn strictly more than the average `hourly_rate` of that same department). Departments with no employees are still listed, with empty `top_earner` and `above_average` 0. Order by `department`.',
    checks: sqlRes('SELECT d.name AS department, (SELECT e.name FROM employees e WHERE e.department_id = d.id ORDER BY e.hourly_rate DESC, e.name LIMIT 1) AS top_earner, (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.hourly_rate > (SELECT AVG(x.hourly_rate) FROM employees x WHERE x.department_id = d.id)) AS above_average FROM departments d ORDER BY d.name', 'works', ['works-b', 'works-boss'], { ordered: true, columns: 'names', ...hidden }),
  }),
  bossChallenge({
    id: 'boss-sql-mastery-b', title: 'Mastery Trial: The Quality Watch', language: 'sql', db: 'works', skillIds: ['sql.joins', 'sql.aggregate', 'sql.advanced'], difficulty: 5, context: 'manufacturing',
    boss: { bossId: 'mastery-sql', version: 'b' },
    prompt: 'Quality control wants a defect report by machine. A run whose `units_defective` is unknown (empty) must not be counted at all, neither as defects nor as units made.\n\nReturn one row for every machine that has made **at least 100 units in total** across the runs that do count, with the columns `machine`, `made` (total units of the counted runs), and `defect_pct` (defective units as a percentage of `made`, rounded to 1 decimal place). Highest `defect_pct` first; ties by machine name.',
    checks: sqlRes('SELECT m.name AS machine, SUM(r.units_made) AS made, ROUND(100.0 * SUM(r.units_defective) / SUM(r.units_made), 1) AS defect_pct FROM machines m JOIN production_runs r ON r.machine_id = m.id WHERE r.units_defective IS NOT NULL GROUP BY m.id HAVING SUM(r.units_made) >= 100 ORDER BY defect_pct DESC, m.name', 'works', ['works-b', 'works-boss'], { ordered: true, columns: 'names', ...hidden }),
  }),
];
