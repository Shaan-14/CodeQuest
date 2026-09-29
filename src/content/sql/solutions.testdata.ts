/**
 * TEST-ONLY DATA (never imported by the app). Alternative valid queries and plausible wrong ones for SQL
 * challenges. Validity is decided by real SQLite against the challenge's checks (reference query on visible
 * AND hidden data), so `valid` entries are queries that are written differently but mean the same thing.
 */
export const solutionsSql: Record<string, { valid: string[]; wrong: string[] }> = {
  // ------------------------------------------------------------- 01 select
  'sql-01-cheap-products': {
    valid: ['SELECT name, price FROM products WHERE price < 30;', 'select name, price\nfrom products\nwhere not price >= 30'],
    wrong: ['SELECT name, price FROM products WHERE price > 30;', 'SELECT * FROM products WHERE price < 30;', 'SELECT name FROM products WHERE price < 30;']
  },
  'sql-01-safety-or-tools': {
    valid: ["SELECT name, category, price FROM products WHERE category IN ('Tools', 'Safety') AND price < 80;", "SELECT name, category, price FROM products WHERE (category = 'Tools' OR category = 'Safety') AND price < 80;"],
    wrong: ["SELECT name, category, price FROM products WHERE category = 'Tools' OR category = 'Safety' AND price < 80;", "SELECT name, category, price FROM products WHERE category = 'Tools' AND category = 'Safety' AND price < 80;", "SELECT name, category, price FROM products WHERE category IN ('Tools', 'Safety');"]
  },
  'sql-01-senior-technicians': {
    valid: ["SELECT name, hourly_rate FROM employees WHERE role IN ('technician', 'supervisor') AND hourly_rate > 30;", "SELECT name, hourly_rate FROM employees WHERE (role = 'technician' OR role = 'supervisor') AND hourly_rate > 30;"],
    wrong: ["SELECT name, hourly_rate FROM employees WHERE role = 'technician' OR role = 'supervisor' AND hourly_rate > 30;", "SELECT name, hourly_rate FROM employees WHERE role = 'technician' AND hourly_rate > 30;", "SELECT name, hourly_rate FROM employees WHERE role IN ('technician', 'supervisor');"]
  },
  'sql-01-stock-value': {
    valid: ['SELECT name, price * stock AS stock_value FROM products WHERE stock > 0;', 'SELECT name, stock * price AS stock_value FROM products WHERE stock <> 0'],
    wrong: ['SELECT name, price * stock FROM products WHERE stock > 0;', 'SELECT name, price + stock AS stock_value FROM products WHERE stock > 0;', 'SELECT name, price * stock AS stock_value FROM products;']
  },
  'sql-01-weekly-pay': {
    valid: ['SELECT name, hourly_rate * 40 AS weekly_pay FROM employees WHERE department_id = 2;', 'SELECT name, 40 * hourly_rate AS weekly_pay FROM employees WHERE department_id IN (2)'],
    wrong: ['SELECT name, hourly_rate * 40 FROM employees WHERE department_id = 2;', 'SELECT name, hourly_rate * 40 AS weekly_pay FROM employees;', 'SELECT name, hourly_rate * 4 AS weekly_pay FROM employees WHERE department_id = 2;']
  },
  // ------------------------------------------------------------- 02 sort/limit
  'sql-02-priciest': {
    valid: ['SELECT name, price FROM products ORDER BY price DESC LIMIT 3;', 'SELECT name, price FROM products ORDER BY 2 DESC LIMIT 3'],
    wrong: ['SELECT name, price FROM products ORDER BY price LIMIT 3;', 'SELECT name, price FROM products LIMIT 3;', 'SELECT name, price FROM products ORDER BY price DESC LIMIT 4;']
  },
  'sql-02-costly-machines': {
    valid: ['SELECT name, purchase_cost FROM machines ORDER BY purchase_cost DESC LIMIT 3;'],
    wrong: ['SELECT name, purchase_cost FROM machines ORDER BY purchase_cost LIMIT 3;', 'SELECT name, purchase_cost FROM machines ORDER BY name DESC LIMIT 3;', 'SELECT name, purchase_cost FROM machines ORDER BY purchase_cost DESC;']
  },
  'sql-02-best-paid': {
    valid: ['SELECT name, hourly_rate FROM employees ORDER BY hourly_rate DESC LIMIT 5;'],
    wrong: ['SELECT name, hourly_rate FROM employees ORDER BY hourly_rate ASC LIMIT 5;', 'SELECT name, hourly_rate FROM employees ORDER BY hourly_rate DESC LIMIT 3;']
  },
  'sql-02-categories': {
    valid: ['SELECT DISTINCT category FROM products ORDER BY category;', 'SELECT category FROM products GROUP BY category ORDER BY category ASC'],
    wrong: ['SELECT category FROM products ORDER BY category;', 'SELECT DISTINCT category FROM products;', 'SELECT DISTINCT category FROM products ORDER BY category DESC;']
  },
  'sql-02-machine-types': {
    valid: ['SELECT DISTINCT machine_type FROM machines ORDER BY machine_type;', 'SELECT machine_type FROM machines GROUP BY machine_type ORDER BY machine_type'],
    wrong: ['SELECT machine_type FROM machines ORDER BY machine_type;', 'SELECT DISTINCT name FROM machines ORDER BY name;']
  },
  // ------------------------------------------------------------- 03 null
  'sql-03-unknown-city': {
    valid: ['SELECT name FROM customers WHERE city IS NULL;', 'SELECT name FROM customers WHERE NOT city IS NOT NULL ORDER BY name DESC'],
    wrong: ['SELECT name FROM customers WHERE city = NULL;', "SELECT name FROM customers WHERE city = '';", 'SELECT name FROM customers WHERE city IS NOT NULL;']
  },
  'sql-03-unrecorded-cost': {
    valid: ['SELECT id, machine_id, event_date FROM maintenance_events WHERE cost IS NULL;'],
    wrong: ['SELECT id, machine_id, event_date FROM maintenance_events WHERE cost = NULL;', 'SELECT id, machine_id, event_date FROM maintenance_events WHERE cost = 0;', 'SELECT id, machine_id, event_date FROM maintenance_events WHERE cost IS NOT NULL;']
  },
  'sql-03-unrecorded-defects': {
    valid: ['SELECT id, machine_id FROM production_runs WHERE units_defective IS NULL;'],
    wrong: ['SELECT id, machine_id FROM production_runs WHERE units_defective = 0;', 'SELECT id, machine_id FROM production_runs WHERE units_defective = NULL;']
  },
  'sql-03-not-leeds': {
    valid: ["SELECT name FROM customers WHERE city <> 'Leeds' OR city IS NULL;", "SELECT name FROM customers WHERE COALESCE(city, '') <> 'Leeds';", "SELECT name FROM customers WHERE name NOT IN (SELECT name FROM customers WHERE city = 'Leeds')"],
    wrong: ["SELECT name FROM customers WHERE city <> 'Leeds';", "SELECT name FROM customers WHERE city <> 'Leeds' AND city IS NULL;", "SELECT name FROM customers WHERE city != 'Leeds' AND city IS NOT NULL;"]
  },
  'sql-03-cheap-or-unknown': {
    valid: ['SELECT id FROM maintenance_events WHERE cost <= 1000 OR cost IS NULL;', 'SELECT id FROM maintenance_events WHERE COALESCE(cost, 0) <= 1000'],
    wrong: ['SELECT id FROM maintenance_events WHERE cost <= 1000;', 'SELECT id FROM maintenance_events WHERE NOT cost > 1000;', 'SELECT id FROM maintenance_events WHERE cost IS NULL;']
  },
  // ------------------------------------------------------------- 04 aggregates
  'sql-04-paid-orders': {
    valid: ["SELECT COUNT(*) FROM orders WHERE status = 'paid';", "SELECT COUNT(id) AS n FROM orders WHERE status = 'paid'"],
    wrong: ['SELECT COUNT(*) FROM orders;', "SELECT COUNT(*) FROM orders WHERE status = 'Paid';", "SELECT status FROM orders WHERE status = 'paid';"]
  },
  'sql-04-machine-three': {
    valid: ['SELECT SUM(units_made), AVG(hours) FROM production_runs WHERE machine_id = 3;', 'SELECT SUM(units_made) AS total, AVG(hours) AS avg_hours FROM production_runs WHERE machine_id = 3'],
    wrong: ['SELECT SUM(units_made), AVG(hours) FROM production_runs;', 'SELECT AVG(units_made), SUM(hours) FROM production_runs WHERE machine_id = 3;', 'SELECT SUM(units_made) FROM production_runs WHERE machine_id = 3;']
  },
  'sql-04-electrical-prices': {
    valid: ["SELECT MIN(price), MAX(price), AVG(price) FROM products WHERE category = 'Electrical';"],
    wrong: ["SELECT MIN(price), MAX(price), AVG(price) FROM products WHERE category = 'Tools';", 'SELECT MIN(price), MAX(price), AVG(price) FROM products;', "SELECT MAX(price), MIN(price), AVG(price) FROM products WHERE category = 'Electrical';"]
  },
  'sql-04-recorded-defects': {
    valid: ['SELECT COUNT(units_defective) AS recorded, COUNT(*) - COUNT(units_defective) AS missing FROM production_runs;', 'SELECT SUM(units_defective IS NOT NULL) AS recorded, SUM(units_defective IS NULL) AS missing FROM production_runs'],
    wrong: ['SELECT COUNT(*) AS recorded, COUNT(*) AS missing FROM production_runs;', 'SELECT COUNT(units_defective) AS recorded, COUNT(*) AS missing FROM production_runs;', 'SELECT COUNT(units_defective), COUNT(*) - COUNT(units_defective) FROM production_runs;']
  },
  'sql-04-known-cities': {
    valid: ['SELECT COUNT(city) AS known, COUNT(DISTINCT city) AS cities FROM customers;', 'SELECT COUNT(*) - SUM(city IS NULL) AS known, COUNT(DISTINCT city) AS cities FROM customers'],
    wrong: ['SELECT COUNT(*) AS known, COUNT(DISTINCT city) AS cities FROM customers;', 'SELECT COUNT(city) AS known, COUNT(city) AS cities FROM customers;']
  },

  // ------------------------------------------------------------- 05 group
  'sql-05-orders-per-status': {
    valid: ['SELECT status, COUNT(*) FROM orders GROUP BY status;', 'SELECT status, COUNT(id) AS n FROM orders GROUP BY status ORDER BY status'],
    wrong: ['SELECT status, COUNT(*) FROM orders;', 'SELECT status FROM orders GROUP BY status;', 'SELECT COUNT(*) FROM orders;']
  },
  'sql-05-downtime-per-machine': {
    valid: ['SELECT machine_id, SUM(downtime_hours) AS total_downtime FROM maintenance_events GROUP BY machine_id ORDER BY total_downtime DESC;', 'SELECT machine_id, SUM(downtime_hours) AS total_downtime FROM maintenance_events GROUP BY 1 ORDER BY 2 DESC'],
    wrong: ['SELECT machine_id, SUM(downtime_hours) AS total_downtime FROM maintenance_events GROUP BY machine_id ORDER BY total_downtime;', 'SELECT machine_id, AVG(downtime_hours) AS total_downtime FROM maintenance_events GROUP BY machine_id ORDER BY total_downtime DESC;', 'SELECT machine_id, SUM(downtime_hours) FROM maintenance_events GROUP BY machine_id ORDER BY 2 DESC;']
  },
  'sql-05-stock-per-category': {
    valid: ['SELECT category, COUNT(*) AS products, SUM(stock) AS total_stock FROM products GROUP BY category ORDER BY total_stock DESC, category;', 'SELECT category, COUNT(id) AS products, SUM(stock) AS total_stock FROM products GROUP BY category ORDER BY SUM(stock) DESC, category ASC'],
    wrong: ['SELECT category, COUNT(*) AS products, SUM(stock) AS total_stock FROM products GROUP BY category ORDER BY total_stock, category;', 'SELECT category, COUNT(*) AS products FROM products GROUP BY category;', 'SELECT category, SUM(stock) AS products, COUNT(*) AS total_stock FROM products GROUP BY category ORDER BY total_stock DESC, category;']
  },
  'sql-05-frequent-customers': {
    valid: ['SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id HAVING COUNT(*) >= 4;', 'SELECT customer_id, n FROM (SELECT customer_id, COUNT(*) AS n FROM orders GROUP BY customer_id) WHERE n >= 4'],
    wrong: ['SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id HAVING COUNT(*) > 4;', 'SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id HAVING COUNT(*) >= 3;', 'SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id;']
  },
  'sql-05-repair-heavy': {
    valid: ["SELECT machine_id, COUNT(*) FROM maintenance_events WHERE kind = 'repair' GROUP BY machine_id HAVING COUNT(*) > 3;", "SELECT machine_id, n FROM (SELECT machine_id, COUNT(*) AS n FROM maintenance_events WHERE kind = 'repair' GROUP BY machine_id) WHERE n > 3"],
    wrong: ['SELECT machine_id, COUNT(*) FROM maintenance_events GROUP BY machine_id HAVING COUNT(*) > 3;', "SELECT machine_id, COUNT(*) FROM maintenance_events WHERE kind = 'repair' GROUP BY machine_id HAVING COUNT(*) >= 3;", "SELECT machine_id, COUNT(*) FROM maintenance_events WHERE kind = 'repair' GROUP BY machine_id;"]
  },
  // ------------------------------------------------------------- 06 joins
  'sql-06-order-customers': {
    valid: ['SELECT o.id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id;', 'SELECT o.id, c.name FROM customers c INNER JOIN orders o ON o.customer_id = c.id ORDER BY o.id'],
    wrong: ['SELECT o.id, c.name FROM orders o JOIN customers c;', 'SELECT o.id, c.id FROM orders o JOIN customers c ON c.id = o.customer_id;', 'SELECT o.id, o.customer_id FROM orders o;']
  },
  'sql-06-repairs-with-names': {
    valid: ["SELECT e.id, e.event_date, m.name FROM maintenance_events e JOIN machines m ON m.id = e.machine_id WHERE e.kind = 'repair';", "SELECT ev.id, ev.event_date, mc.name FROM machines mc INNER JOIN maintenance_events ev ON ev.machine_id = mc.id WHERE ev.kind = 'repair' ORDER BY ev.id"],
    wrong: ['SELECT e.id, e.event_date, m.name FROM maintenance_events e JOIN machines m ON m.id = e.machine_id;', "SELECT e.id, e.event_date, m.name FROM maintenance_events e JOIN machines m ON m.id = e.technician_id WHERE e.kind = 'repair';", "SELECT e.id, e.event_date, e.kind FROM maintenance_events e JOIN machines m ON m.id = e.machine_id WHERE e.kind = 'repair';"]
  },
  'sql-06-players-teams': {
    valid: ['SELECT p.name AS player, t.name AS team FROM players p JOIN teams t ON t.id = p.team_id;', 'SELECT players.name AS player, teams.name AS team FROM teams JOIN players ON players.team_id = teams.id'],
    wrong: ['SELECT p.name, t.name FROM players p JOIN teams t ON t.id = p.team_id;', 'SELECT p.name AS player, t.city AS team FROM players p JOIN teams t ON t.id = p.team_id;', 'SELECT p.name AS player, t.name AS team FROM players p JOIN teams t ON t.id = p.id;']
  },
  'sql-06-spend-per-customer': {
    valid: ['SELECT c.name, SUM(i.quantity * i.unit_price) AS total_spent FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id GROUP BY c.id ORDER BY total_spent DESC;', 'SELECT c.name, SUM(i.unit_price * i.quantity) AS total_spent FROM order_items i JOIN orders o ON o.id = i.order_id JOIN customers c ON c.id = o.customer_id GROUP BY c.name ORDER BY 2 DESC'],
    wrong: ['SELECT c.name, SUM(i.unit_price) AS total_spent FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id GROUP BY c.id ORDER BY total_spent DESC;', 'SELECT c.name, SUM(i.quantity * i.unit_price) AS total_spent FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id GROUP BY c.id ORDER BY total_spent;', 'SELECT c.name, SUM(i.quantity * i.unit_price) AS total_spent FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id GROUP BY o.id ORDER BY total_spent DESC;']
  },
  'sql-06-downtime-by-department': {
    valid: ["SELECT d.name, SUM(e.downtime_hours) AS total_downtime FROM maintenance_events e JOIN machines m ON m.id = e.machine_id JOIN departments d ON d.id = m.department_id WHERE e.kind = 'repair' GROUP BY d.id ORDER BY total_downtime DESC;", "SELECT d.name, SUM(e.downtime_hours) AS total_downtime FROM departments d JOIN machines m ON m.department_id = d.id JOIN maintenance_events e ON e.machine_id = m.id WHERE e.kind = 'repair' GROUP BY d.name ORDER BY 2 DESC"],
    wrong: ['SELECT d.name, SUM(e.downtime_hours) AS total_downtime FROM maintenance_events e JOIN machines m ON m.id = e.machine_id JOIN departments d ON d.id = m.department_id GROUP BY d.id ORDER BY total_downtime DESC;', "SELECT d.name, SUM(e.downtime_hours) AS total_downtime FROM maintenance_events e JOIN machines m ON m.id = e.machine_id JOIN departments d ON d.id = m.department_id WHERE e.kind = 'repair' GROUP BY d.id ORDER BY total_downtime;", "SELECT d.name, COUNT(*) AS total_downtime FROM maintenance_events e JOIN machines m ON m.id = e.machine_id JOIN departments d ON d.id = m.department_id WHERE e.kind = 'repair' GROUP BY d.id ORDER BY total_downtime DESC;"]
  },
  // ------------------------------------------------------------- 07 left join
  'sql-07-orders-per-customer': {
    valid: ['SELECT c.name, COUNT(o.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.name;', 'SELECT c.name, COUNT(o.id) AS orders FROM customers c LEFT OUTER JOIN orders o ON c.id = o.customer_id GROUP BY c.name ORDER BY c.name'],
    wrong: ['SELECT c.name, COUNT(o.id) AS orders FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.name;', 'SELECT c.name, COUNT(*) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.name;', 'SELECT c.name, COUNT(o.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY orders, c.name;']
  },
  'sql-07-never-ordered': {
    valid: ['SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL;', 'SELECT name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)', 'SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)'],
    wrong: ['SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL;', 'SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NOT NULL;', 'SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id;']
  },
  'sql-07-idle-operators': {
    valid: ["SELECT e.name FROM employees e LEFT JOIN production_runs r ON r.operator_id = e.id WHERE e.role = 'operator' AND r.id IS NULL;", "SELECT name FROM employees e WHERE role = 'operator' AND NOT EXISTS (SELECT 1 FROM production_runs r WHERE r.operator_id = e.id)"],
    wrong: ['SELECT e.name FROM employees e LEFT JOIN production_runs r ON r.operator_id = e.id WHERE r.id IS NULL;', "SELECT e.name FROM employees e LEFT JOIN production_runs r ON r.operator_id = e.id WHERE e.role = 'operator' AND r.id IS NOT NULL;", "SELECT e.name FROM employees e JOIN production_runs r ON r.operator_id = e.id WHERE e.role = 'operator';"]
  },
  'sql-07-product-sales': {
    valid: ['SELECT p.name, COUNT(i.id) AS lines FROM products p LEFT JOIN order_items i ON i.product_id = p.id GROUP BY p.id ORDER BY lines, p.name;', 'SELECT p.name, COUNT(i.order_id) AS lines FROM products p LEFT JOIN order_items i ON p.id = i.product_id GROUP BY p.name ORDER BY 2 ASC, 1 ASC'],
    wrong: ['SELECT p.name, COUNT(i.id) AS lines FROM products p JOIN order_items i ON i.product_id = p.id GROUP BY p.id ORDER BY lines, p.name;', 'SELECT p.name, COUNT(*) AS lines FROM products p LEFT JOIN order_items i ON i.product_id = p.id GROUP BY p.id ORDER BY lines, p.name;', 'SELECT p.name, COUNT(i.id) AS lines FROM products p LEFT JOIN order_items i ON i.product_id = p.id GROUP BY p.id ORDER BY lines DESC, p.name;']
  },
  'sql-07-machine-run-counts': {
    valid: ['SELECT m.name, COUNT(r.id) AS runs FROM machines m LEFT JOIN production_runs r ON r.machine_id = m.id GROUP BY m.id ORDER BY runs DESC, m.name;'],
    wrong: ['SELECT m.name, COUNT(r.id) AS runs FROM machines m JOIN production_runs r ON r.machine_id = m.id GROUP BY m.id ORDER BY runs DESC, m.name;', 'SELECT m.name, COUNT(*) AS runs FROM machines m LEFT JOIN production_runs r ON r.machine_id = m.id GROUP BY m.id ORDER BY runs DESC, m.name;', 'SELECT m.name, COUNT(r.id) AS runs FROM machines m LEFT JOIN production_runs r ON r.machine_id = m.id GROUP BY m.id ORDER BY runs, m.name;']
  },
  // ------------------------------------------------------------- 08 case
  'sql-08-price-band': {
    valid: ["SELECT name, CASE WHEN price < 10 THEN 'cheap' WHEN price < 50 THEN 'standard' ELSE 'premium' END AS band FROM products;", "SELECT name, CASE WHEN price < 10 THEN 'cheap' WHEN price >= 10 AND price < 50 THEN 'standard' ELSE 'premium' END AS band FROM products"],
    wrong: ["SELECT name, CASE WHEN price < 20 THEN 'cheap' WHEN price < 50 THEN 'standard' ELSE 'premium' END AS band FROM products;", "SELECT name, CASE WHEN price < 10 THEN 'cheap' WHEN price < 50 THEN 'standard' ELSE 'premium' END FROM products;", "SELECT name, CASE WHEN price < 10 THEN 'cheap' WHEN price < 50 THEN 'standard' END AS band FROM products;"]
  },
  'sql-08-downtime-class': {
    valid: ["SELECT id, CASE WHEN downtime_hours < 2 THEN 'minor' WHEN downtime_hours < 8 THEN 'moderate' ELSE 'major' END AS impact FROM maintenance_events;", "SELECT id, CASE WHEN downtime_hours >= 8 THEN 'major' WHEN downtime_hours >= 2 THEN 'moderate' ELSE 'minor' END AS impact FROM maintenance_events"],
    wrong: ["SELECT id, CASE WHEN downtime_hours < 2 THEN 'minor' WHEN downtime_hours < 8 THEN 'major' ELSE 'moderate' END AS impact FROM maintenance_events;", "SELECT id, CASE WHEN downtime_hours < 3 THEN 'minor' WHEN downtime_hours < 8 THEN 'moderate' ELSE 'major' END AS impact FROM maintenance_events;", "SELECT id, CASE WHEN downtime_hours < 2 THEN 'minor' WHEN downtime_hours < 8 THEN 'moderate' END AS impact FROM maintenance_events;"]
  },
  'sql-08-order-size': {
    valid: ["SELECT id, CASE WHEN quantity >= 6 THEN 'bulk' WHEN quantity >= 3 THEN 'regular' ELSE 'single' END AS size FROM order_items;", "SELECT id, CASE WHEN quantity < 3 THEN 'single' WHEN quantity < 6 THEN 'regular' ELSE 'bulk' END AS size FROM order_items"],
    wrong: ["SELECT id, CASE WHEN quantity >= 5 THEN 'bulk' WHEN quantity >= 3 THEN 'regular' ELSE 'single' END AS size FROM order_items;", "SELECT id, CASE WHEN quantity > 6 THEN 'bulk' WHEN quantity >= 3 THEN 'regular' ELSE 'single' END AS size FROM order_items;", "SELECT id, CASE WHEN quantity >= 3 THEN 'regular' WHEN quantity >= 6 THEN 'bulk' ELSE 'single' END AS size FROM order_items;"]
  },
  'sql-08-paid-vs-returned': {
    valid: ["SELECT customer_id, SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid, SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returned FROM orders GROUP BY customer_id;", "SELECT customer_id, COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid, COUNT(CASE WHEN status = 'returned' THEN 1 END) AS returned FROM orders GROUP BY customer_id"],
    wrong: ["SELECT customer_id, SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid, SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS returned FROM orders GROUP BY customer_id;", "SELECT customer_id, SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid, SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returned FROM orders;", "SELECT customer_id, COUNT(*) AS paid, COUNT(*) AS returned FROM orders GROUP BY customer_id;"]
  },
  'sql-08-repairs-vs-other': {
    valid: ["SELECT machine_id, SUM(CASE WHEN kind = 'repair' THEN 1 ELSE 0 END) AS repairs, SUM(CASE WHEN kind <> 'repair' THEN 1 ELSE 0 END) AS other FROM maintenance_events GROUP BY machine_id;", "SELECT machine_id, COUNT(CASE WHEN kind = 'repair' THEN 1 END) AS repairs, COUNT(*) - COUNT(CASE WHEN kind = 'repair' THEN 1 END) AS other FROM maintenance_events GROUP BY machine_id"],
    wrong: ["SELECT machine_id, SUM(CASE WHEN kind = 'repair' THEN 1 ELSE 0 END) AS repairs, COUNT(*) AS other FROM maintenance_events GROUP BY machine_id;", "SELECT machine_id, SUM(CASE WHEN kind = 'repair' THEN 1 ELSE 0 END) AS repairs, SUM(CASE WHEN kind = 'routine' THEN 1 ELSE 0 END) AS other FROM maintenance_events GROUP BY machine_id;", "SELECT machine_id, SUM(CASE WHEN kind = 'repair' THEN 1 ELSE 0 END) AS other, SUM(CASE WHEN kind <> 'repair' THEN 1 ELSE 0 END) AS repairs FROM maintenance_events GROUP BY machine_id;"]
  },
};
