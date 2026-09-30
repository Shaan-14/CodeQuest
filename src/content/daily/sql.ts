import type { Challenge, Check, SchemaRule } from '../schema';
import { sqlRes, sqlState } from '../helpers';
import { daily } from './helpers';

const okScript = (name: string, script: string): Check => ({ kind: 'sqlScript', name, script, expectError: false, db: 'blank', visible: false });
const badScript = (name: string, script: string): Check => ({ kind: 'sqlScript', name, script, expectError: true, db: 'blank', visible: false });
const schema = (rules: SchemaRule[]): Check => ({ kind: 'sqlSchema', name: 'The design', rules, db: 'blank', visible: false });

/** SQL / database Daily Challenges: results are graded on visible AND hidden data (the `-b` twin). */
export const sqlDailies: Challenge[] = [
  daily({
    id: 'daily-sql-affordable', title: 'What Can We Sell Under 60?', language: 'sql', db: 'market', skillIds: ['sql.select'], difficulty: 2, context: 'retail',
    prompt: 'List the `name` and `price` of every product that is in stock (at least 1) and costs less than 60. Show the cheapest first; equal prices in name order.',
    checks: sqlRes('SELECT name, price FROM products WHERE stock >= 1 AND price < 60 ORDER BY price, name', 'market', ['market-b'], { ordered: true }),
    daily: { focus: 'either', requires: ['sql-02-sort-limit'] },
  }),
  daily({
    id: 'daily-sql-status-summary', title: 'Order Status Summary', language: 'sql', db: 'market', skillIds: ['sql.aggregate', 'sql.joins'], difficulty: 3, context: 'customer service',
    prompt: 'For every order `status`, show the number of orders (`orders`) and the total number of items sold on them (`items`, the sum of the line quantities). Most items first; ties by status.',
    checks: sqlRes('SELECT o.status, COUNT(DISTINCT o.id) AS orders, SUM(i.quantity) AS items FROM orders o JOIN order_items i ON i.order_id = o.id GROUP BY o.status ORDER BY items DESC, o.status', 'market', ['market-b'], { ordered: true, columns: 'names' }),
    daily: { focus: 'either', requires: ['sql-06-joins'] },
  }),
  daily({
    id: 'daily-sql-quiet-customers', title: 'The Customers Who Never Ordered', language: 'sql', db: 'market', skillIds: ['sql.joins'], difficulty: 3, context: 'customer analytics',
    prompt: 'Marketing wants to reach customers who have **never placed an order**. List their `name`s alphabetically.',
    checks: sqlRes('SELECT c.name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id) ORDER BY c.name', 'market', ['market-b'], { ordered: true }),
    daily: { focus: 'review', requires: ['sql-07-left-join'] },
  }),
  daily({
    id: 'daily-sql-top-revenue', title: 'Best Sellers by Revenue', language: 'sql', db: 'market', skillIds: ['sql.joins', 'sql.aggregate'], difficulty: 4, context: 'retail',
    prompt: 'Revenue of a line is `quantity * unit_price`. Ignoring returned orders, list the three products with the highest total revenue: show the product `name`, its `category` and `revenue`. Highest first; ties by name.',
    checks: sqlRes("SELECT p.name, p.category, SUM(i.quantity * i.unit_price) AS revenue FROM products p JOIN order_items i ON i.product_id = p.id JOIN orders o ON o.id = i.order_id WHERE o.status <> 'returned' GROUP BY p.id ORDER BY revenue DESC, p.name LIMIT 3", 'market', ['market-b'], { ordered: true, columns: 'names', approx: 1e-6 }),
    daily: { focus: 'review', requires: ['sql-07-left-join'] },
  }),
  daily({
    id: 'daily-sql-pay-ranks', title: 'Top Two Earners per Department', language: 'sql', db: 'works', skillIds: ['sql.advanced', 'sql.joins'], difficulty: 4, context: 'human resources',
    prompt: 'For every department show the two best-paid employees: department `name` as `department`, employee `name` as `employee` and `hourly_rate`. Order by department name, then by pay (highest first), then by employee name. A department with fewer than two people shows all of them.',
    checks: sqlRes('SELECT d.name AS department, e.name AS employee, e.hourly_rate FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY hourly_rate DESC, name) AS rn FROM employees) e JOIN departments d ON d.id = e.department_id WHERE e.rn <= 2 ORDER BY d.name, e.hourly_rate DESC, e.name', 'works', ['works-b'], { ordered: true, columns: 'names' }),
    daily: { focus: 'review', requires: ['sql-11-window'] },
  }),
  daily({
    id: 'daily-sql-fasteners-raise', title: 'Selective Price Rise', language: 'sql', db: 'market', skillIds: ['sql.modify', 'sql.advanced'], difficulty: 3, context: 'retail',
    prompt: 'Raise the price of every product by 10%, rounded to 2 decimal places, but **only in categories whose average price is below 60**, judged on the prices as they are before any change. All other products stay as they are.',
    checks: sqlState('UPDATE products SET price = ROUND(price * 1.1, 2) WHERE category IN (SELECT category FROM products GROUP BY category HAVING AVG(price) < 60)', 'SELECT id, price FROM products ORDER BY id', 'market', ['market-b'], { ordered: true }),
    daily: { focus: 'either', requires: ['sql-10-subqueries'] },
  }),
  daily({
    id: 'daily-sql-gym-design', title: 'Design the Gym Database', language: 'sql', db: 'blank', skillIds: ['db.design', 'db.integrity'], difficulty: 3, context: 'fitness',
    prompt: 'A gym needs a database for its **members**, its **classes** (yoga, spin...) and the **bookings** that say which member is booked into which class session on which date. Create the tables. Choose your own names. Every fact should live in one place, the tables must be linked, and the database itself should refuse an obviously invalid booking (one for a member or class that does not exist).',
    checks: [schema([
      { rule: 'minTables', n: 3, message: 'three tables' },
      { rule: 'hasPrimaryKeys', message: 'keys' },
      { rule: 'tableLike', pattern: 'member', message: 'members' },
      { rule: 'tableLike', pattern: 'class|session|course', message: 'classes' },
      { rule: 'tableLike', pattern: 'booking|reservation|enrol', message: 'bookings' },
      { rule: 'foreignKey', from: 'booking|reservation|enrol', to: 'member', message: 'bookings to members' },
      { rule: 'foreignKey', from: 'booking|reservation|enrol', to: 'class|session|course', message: 'bookings to classes' },
      { rule: 'noColumnLike', pattern: '(member|class)_?name', message: 'no copied names' },
    ])],
    daily: { focus: 'review', requires: ['sql-12-design'] },
  }),
  daily({
    id: 'daily-sql-tickets-table', title: 'A Support Ticket Table', language: 'sql', db: 'blank', skillIds: ['db.integrity', 'db.design'], difficulty: 3, context: 'software',
    prompt: 'Create a table `tickets` with `id` (primary key), `title`, `priority` and `points`. The database must refuse a ticket without a title, refuse two tickets with the same title, refuse a priority that is not `low`, `medium` or `high`, and refuse `points` below 1 or above 100 (points may be left empty).',
    checks: [
      { kind: 'sqlSchema', name: 'A tickets table', db: 'blank', visible: false, rules: [{ rule: 'tableLike', pattern: '^tickets$', message: 'tickets' }, { rule: 'hasPrimaryKeys', message: 'pk' }] },
      okScript('A valid ticket', "INSERT INTO tickets (title, priority, points) VALUES ('Fix login', 'high', 8)"),
      okScript('Points may be empty', "INSERT INTO tickets (title, priority) VALUES ('Docs', 'low')"),
      badScript('No title', "INSERT INTO tickets (priority, points) VALUES ('low', 3)"),
      badScript('Duplicate title', "INSERT INTO tickets (title, priority) VALUES ('A', 'low'); INSERT INTO tickets (title, priority) VALUES ('A', 'high')"),
      badScript('Unknown priority', "INSERT INTO tickets (title, priority) VALUES ('B', 'urgent')"),
      badScript('Points too low', "INSERT INTO tickets (title, priority, points) VALUES ('C', 'low', 0)"),
      badScript('Points too high', "INSERT INTO tickets (title, priority, points) VALUES ('D', 'low', 101)"),
      okScript('Boundary points are allowed', "INSERT INTO tickets (title, priority, points) VALUES ('E', 'medium', 1); INSERT INTO tickets (title, priority, points) VALUES ('F', 'medium', 100)"),
    ],
    daily: { focus: 'review', requires: ['sql-12-design'] },
  }),
  daily({
    id: 'daily-sql-index-runs', title: 'Speed Up the Production Query', language: 'sql', db: 'works', skillIds: ['db.performance'], difficulty: 3, context: 'manufacturing',
    prompt: 'The scheduling screen constantly runs `SELECT * FROM production_runs WHERE operator_id = 12 AND run_date >= \'2024-03-01\'` and it is slow. Make the database **search** instead of scanning the whole table for it.',
    checks: [{ kind: 'sqlPlan', name: 'Uses an index', db: 'works', query: "SELECT * FROM production_runs WHERE operator_id = 12 AND run_date >= '2024-03-01'", mustMatch: 'SEARCH .*USING (COVERING )?INDEX', mustNotMatch: 'SCAN', visible: false }],
    daily: { focus: 'review', requires: ['sql-13-integrity-performance'] },
  }),
];
