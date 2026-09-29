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

  // ------------------------------------------------------------- 09 modify
  'sql-09-new-customer': {
    valid: ["INSERT INTO customers (name, city, joined_on) VALUES ('Priya Nair', 'Bath', '2024-02-01');", "INSERT INTO customers VALUES (NULL, 'Priya Nair', 'Bath', '2024-02-01');", "INSERT INTO customers (id, name, city, joined_on) VALUES ((SELECT MAX(id) + 1 FROM customers), 'Priya Nair', 'Bath', '2024-02-01');"],
    wrong: ["INSERT INTO customers (name, city, joined_on) VALUES ('Priya Nair', 'York', '2024-02-01');", "INSERT INTO customers (name, city, joined_on) VALUES ('Priya Nair', 'Bath', '2024-02-01'); INSERT INTO customers (name, city, joined_on) VALUES ('Priya Nair', 'Bath', '2024-02-01');", "UPDATE customers SET city = 'Bath' WHERE id = 1;"]
  },
  'sql-09-tool-price-rise': {
    valid: ["UPDATE products SET price = price * 1.1 WHERE category = 'Tools';", "UPDATE products SET price = price + price * 0.1 WHERE category = 'Tools'"],
    wrong: ['UPDATE products SET price = price * 1.1;', "UPDATE products SET price = price * 1.01 WHERE category = 'Tools';", "UPDATE products SET price = price * 1.1 WHERE category = 'Safety';"]
  },
  'sql-09-fill-costs': {
    valid: ['UPDATE maintenance_events SET cost = 0 WHERE cost IS NULL;', 'UPDATE maintenance_events SET cost = COALESCE(cost, 0);'],
    wrong: ['UPDATE maintenance_events SET cost = 0 WHERE cost = NULL;', 'UPDATE maintenance_events SET cost = 0;', 'UPDATE maintenance_events SET cost = 0 WHERE cost IS NOT NULL;']
  },
  'sql-09-remove-pending': {
    valid: ["DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE status = 'pending'); DELETE FROM orders WHERE status = 'pending';", "DELETE FROM order_items WHERE EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.status = 'pending'); DELETE FROM orders WHERE status = 'pending';"],
    wrong: ["DELETE FROM orders WHERE status = 'pending';", "DELETE FROM order_items; DELETE FROM orders WHERE status = 'pending';", "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE status = 'pending');"]
  },
  'sql-09-retire-machine': {
    valid: ['DELETE FROM maintenance_events WHERE machine_id = 9; DELETE FROM machines WHERE id = 9;'],
    wrong: ['DELETE FROM machines WHERE id = 9;', 'DELETE FROM maintenance_events; DELETE FROM machines WHERE id = 9;', 'DELETE FROM maintenance_events WHERE machine_id = 9;']
  },
  // ------------------------------------------------------------- 10 subqueries
  'sql-10-above-average': {
    valid: ['SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products);', 'SELECT name, price FROM products, (SELECT AVG(price) AS a FROM products) WHERE price > a'],
    wrong: ['SELECT name, price FROM products WHERE price > 50;', 'SELECT name, price FROM products WHERE price < (SELECT AVG(price) FROM products);', 'SELECT name, price FROM products WHERE price > (SELECT MAX(price) FROM products);']
  },
  'sql-10-costly-machines': {
    valid: ['SELECT name FROM machines WHERE purchase_cost > (SELECT AVG(purchase_cost) FROM machines);', 'SELECT name FROM machines m WHERE m.purchase_cost > (SELECT SUM(purchase_cost) * 1.0 / COUNT(*) FROM machines)'],
    wrong: ['SELECT name FROM machines WHERE purchase_cost > 50000;', 'SELECT name FROM machines WHERE purchase_cost < (SELECT AVG(purchase_cost) FROM machines);', 'SELECT name FROM machines WHERE purchase_cost > (SELECT MIN(purchase_cost) FROM machines);']
  },
  'sql-10-returning-customers': {
    valid: ["SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders WHERE status = 'returned');", "SELECT name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'returned')"],
    wrong: ['SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders);', "SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders WHERE status = 'paid');", "SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'returned';"]
  },
  'sql-10-avg-orders-per-customer': {
    valid: ['WITH per_customer AS (SELECT customer_id, COUNT(*) AS n FROM orders GROUP BY customer_id) SELECT AVG(n) AS avg_orders FROM per_customer;', 'WITH n AS (SELECT COUNT(*) AS c FROM orders GROUP BY customer_id) SELECT AVG(c) AS avg_orders FROM n'],
    wrong: ['WITH per AS (SELECT c.id, COUNT(o.id) AS n FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id) SELECT AVG(n) AS avg_orders FROM per;', 'SELECT COUNT(*) * 1.0 / COUNT(DISTINCT customer_id) AS avg_orders FROM orders;', 'WITH per AS (SELECT customer_id, COUNT(*) AS n FROM orders GROUP BY customer_id) SELECT MAX(n) AS avg_orders FROM per;']
  },
  'sql-10-avg-machine-downtime': {
    valid: ['WITH per_machine AS (SELECT machine_id, SUM(downtime_hours) AS t FROM maintenance_events GROUP BY machine_id) SELECT AVG(t) AS avg_total_downtime FROM per_machine;'],
    wrong: ['WITH per AS (SELECT machine_id, AVG(downtime_hours) AS t FROM maintenance_events GROUP BY machine_id) SELECT AVG(t) AS avg_total_downtime FROM per;', 'WITH per AS (SELECT machine_id, SUM(downtime_hours) AS t FROM maintenance_events GROUP BY machine_id) SELECT SUM(t) AS avg_total_downtime FROM per;']
  },
  // ------------------------------------------------------------- 11 window
  'sql-11-rank-prices': {
    valid: ['SELECT name, category, price, RANK() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank FROM products;', 'SELECT name, category, price, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank FROM products'],
    wrong: ['SELECT name, category, price, RANK() OVER (ORDER BY price DESC) AS price_rank FROM products;', 'SELECT name, category, price, RANK() OVER (PARTITION BY category ORDER BY price) AS price_rank FROM products;', 'SELECT name, category, price, RANK() OVER (PARTITION BY category ORDER BY price DESC) FROM products;']
  },
  'sql-11-top-per-category': {
    valid: ['SELECT category, name, price FROM (SELECT category, name, price, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn FROM products) WHERE rn = 1;', 'WITH r AS (SELECT category, name, price, RANK() OVER (PARTITION BY category ORDER BY price DESC) AS rk FROM products) SELECT category, name, price FROM r WHERE rk = 1'],
    wrong: ['SELECT category, name, price FROM (SELECT category, name, price, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn FROM products) WHERE rn = 2;', 'SELECT category, name, price FROM (SELECT category, name, price, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price) AS rn FROM products) WHERE rn = 1;', 'SELECT category, name, MAX(price) FROM products GROUP BY category;']
  },
  'sql-11-top-machine-per-dept': {
    valid: ['SELECT department_id, name, purchase_cost FROM (SELECT department_id, name, purchase_cost, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY purchase_cost DESC) AS rn FROM machines) WHERE rn = 1;', 'WITH r AS (SELECT department_id, name, purchase_cost, RANK() OVER (PARTITION BY department_id ORDER BY purchase_cost DESC) AS rk FROM machines) SELECT department_id, name, purchase_cost FROM r WHERE rk = 1'],
    wrong: ['SELECT department_id, name, purchase_cost FROM (SELECT department_id, name, purchase_cost, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY purchase_cost) AS rn FROM machines) WHERE rn = 1;', 'SELECT department_id, name, purchase_cost FROM (SELECT department_id, name, purchase_cost, ROW_NUMBER() OVER (ORDER BY purchase_cost DESC) AS rn FROM machines) WHERE rn = 1;']
  },
  'sql-11-running-downtime': {
    valid: ['SELECT machine_id, id, event_date, SUM(downtime_hours) OVER (PARTITION BY machine_id ORDER BY event_date, id) AS running_total FROM maintenance_events ORDER BY machine_id, event_date, id;', 'SELECT machine_id, id, event_date, SUM(downtime_hours) OVER (PARTITION BY machine_id ORDER BY event_date, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total FROM maintenance_events ORDER BY 1, 3, 2'],
    wrong: ['SELECT machine_id, id, event_date, SUM(downtime_hours) OVER (ORDER BY event_date, id) AS running_total FROM maintenance_events ORDER BY machine_id, event_date, id;', 'SELECT machine_id, id, event_date, SUM(downtime_hours) OVER (PARTITION BY machine_id) AS running_total FROM maintenance_events ORDER BY machine_id, event_date, id;', 'SELECT machine_id, id, event_date, downtime_hours AS running_total FROM maintenance_events ORDER BY machine_id, event_date, id;']
  },
  'sql-11-orders-so-far': {
    valid: ['SELECT id, ordered_on, COUNT(*) OVER (ORDER BY ordered_on, id) AS orders_so_far FROM orders ORDER BY ordered_on, id;', 'SELECT id, ordered_on, ROW_NUMBER() OVER (ORDER BY ordered_on, id) AS orders_so_far FROM orders ORDER BY ordered_on, id'],
    wrong: ['SELECT id, ordered_on, COUNT(*) OVER () AS orders_so_far FROM orders ORDER BY ordered_on, id;', 'SELECT id, ordered_on, COUNT(*) OVER (ORDER BY ordered_on) AS orders_so_far FROM orders ORDER BY ordered_on, id;', 'SELECT id, ordered_on, ROW_NUMBER() OVER (ORDER BY id) AS orders_so_far FROM orders ORDER BY ordered_on, id;']
  },
  // ------------------------------------------------------------- 12 design
  'sql-12-first-table': {
    valid: ['CREATE TABLE parts (id INTEGER PRIMARY KEY, name TEXT NOT NULL, unit_cost REAL);', 'create table parts (\n  id integer primary key autoincrement,\n  name text not null,\n  unit_cost numeric\n)'],
    wrong: ['CREATE TABLE parts (id INTEGER PRIMARY KEY, name TEXT, unit_cost REAL);', 'CREATE TABLE parts (id INTEGER, name TEXT NOT NULL, unit_cost REAL);', 'CREATE TABLE part (id INTEGER PRIMARY KEY, name TEXT NOT NULL, unit_cost REAL);']
  },
  'sql-12-staff-table': {
    valid: ['CREATE TABLE staff (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, salary REAL CHECK (salary >= 0));', 'CREATE TABLE staff (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, salary INTEGER, UNIQUE (email), CHECK (salary IS NULL OR salary >= 0));'],
    wrong: ['CREATE TABLE staff (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, salary REAL CHECK (salary >= 0));', 'CREATE TABLE staff (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, salary REAL);', 'CREATE TABLE staff (id INTEGER PRIMARY KEY, name TEXT, email TEXT NOT NULL UNIQUE, salary REAL CHECK (salary >= 0));', 'CREATE TABLE staff (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE, salary REAL CHECK (salary >= 0));', 'CREATE TABLE staff (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, salary REAL NOT NULL CHECK (salary >= 0));']
  },
  'sql-12-shipments-table': {
    valid: ['CREATE TABLE shipments (id INTEGER PRIMARY KEY, tracking_code TEXT NOT NULL UNIQUE, weight_kg REAL NOT NULL CHECK (weight_kg > 0), status TEXT NOT NULL);', 'CREATE TABLE shipments (id INTEGER PRIMARY KEY, tracking_code TEXT NOT NULL, weight_kg REAL NOT NULL, status TEXT NOT NULL, UNIQUE (tracking_code), CHECK (weight_kg > 0));'],
    wrong: ['CREATE TABLE shipments (id INTEGER PRIMARY KEY, tracking_code TEXT NOT NULL UNIQUE, weight_kg REAL NOT NULL CHECK (weight_kg >= 0), status TEXT NOT NULL);', 'CREATE TABLE shipments (id INTEGER PRIMARY KEY, tracking_code TEXT NOT NULL, weight_kg REAL NOT NULL CHECK (weight_kg > 0), status TEXT NOT NULL);', 'CREATE TABLE shipments (id INTEGER PRIMARY KEY, tracking_code TEXT NOT NULL UNIQUE, weight_kg REAL CHECK (weight_kg > 0), status TEXT NOT NULL);', 'CREATE TABLE shipments (id INTEGER PRIMARY KEY, tracking_code TEXT UNIQUE, weight_kg REAL NOT NULL CHECK (weight_kg > 0), status TEXT NOT NULL);']
  },
  'sql-12-library': {
    valid: ['CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL); CREATE TABLE loans (id INTEGER PRIMARY KEY, member_id INTEGER NOT NULL REFERENCES members(id), book_id INTEGER NOT NULL REFERENCES books(id), borrowed_on TEXT);', 'CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT); CREATE TABLE loans (id INTEGER PRIMARY KEY, member_id INTEGER, book_id INTEGER, borrowed_on TEXT, FOREIGN KEY (member_id) REFERENCES members(id), FOREIGN KEY (book_id) REFERENCES books(id));'],
    wrong: ['CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT); CREATE TABLE loans (id INTEGER PRIMARY KEY, member_id INTEGER, book_id INTEGER, borrowed_on TEXT);', 'CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT); CREATE TABLE loans (id INTEGER PRIMARY KEY, member_id INTEGER REFERENCES members(id), book_id INTEGER, borrowed_on TEXT);', 'CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE loans (id INTEGER PRIMARY KEY, member_id INTEGER REFERENCES members(id), book_title TEXT, borrowed_on TEXT);']
  },
  'sql-12-enrolments': {
    valid: ['CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT NOT NULL); CREATE TABLE enrolments (id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES students(id), course_id INTEGER NOT NULL REFERENCES courses(id), enrolled_on TEXT);', 'CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT); CREATE TABLE enrolments (id INTEGER PRIMARY KEY, student_id INTEGER, course_id INTEGER, enrolled_on TEXT, FOREIGN KEY (student_id) REFERENCES students(id), FOREIGN KEY (course_id) REFERENCES courses(id));'],
    wrong: ['CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT); CREATE TABLE enrolments (id INTEGER PRIMARY KEY, student_id INTEGER, course_id INTEGER, enrolled_on TEXT);', 'CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT); CREATE TABLE enrolments (id INTEGER PRIMARY KEY, student_id INTEGER REFERENCES students(id), course_id INTEGER, enrolled_on TEXT);', 'CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, course TEXT);']
  },
  'sql-12-normalize-sales': {
    valid: ['CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT); CREATE TABLE sales (id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), product TEXT, qty INTEGER, price REAL); INSERT INTO customers (name, city) SELECT DISTINCT customer_name, customer_city FROM sales_flat; INSERT INTO sales SELECT f.id, c.id, f.product, f.qty, f.price FROM sales_flat f JOIN customers c ON c.name = f.customer_name AND c.city = f.customer_city;'],
    wrong: ['CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT); CREATE TABLE sales (id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), product TEXT, qty INTEGER, price REAL); INSERT INTO customers (name, city) SELECT customer_name, customer_city FROM sales_flat; INSERT INTO sales SELECT f.id, c.id, f.product, f.qty, f.price FROM sales_flat f JOIN customers c ON c.name = f.customer_name;', 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT); CREATE TABLE sales (id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), product TEXT, qty INTEGER, price REAL); INSERT INTO customers (name, city) SELECT DISTINCT customer_name, customer_city FROM sales_flat;', 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT); CREATE TABLE sales (id INTEGER PRIMARY KEY, customer_id INTEGER, product TEXT, qty INTEGER, price REAL); INSERT INTO customers (name, city) SELECT DISTINCT customer_name, customer_city FROM sales_flat; INSERT INTO sales SELECT f.id, c.id, f.product, f.qty, f.price FROM sales_flat f JOIN customers c ON c.name = f.customer_name;']
  },
  'sql-12-factory-design': {
    valid: ['CREATE TABLE machines (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE technicians (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE maintenance_events (id INTEGER PRIMARY KEY, machine_id INTEGER NOT NULL REFERENCES machines(id), technician_id INTEGER NOT NULL REFERENCES technicians(id), event_date TEXT, downtime_hours REAL); CREATE TABLE production_runs (id INTEGER PRIMARY KEY, machine_id INTEGER NOT NULL REFERENCES machines(id), run_date TEXT, units INTEGER);'],
    wrong: ['CREATE TABLE machines (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE technicians (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE maintenance_events (id INTEGER PRIMARY KEY, machine_id INTEGER REFERENCES machines(id), technician_id INTEGER REFERENCES technicians(id)); CREATE TABLE production_runs (id INTEGER PRIMARY KEY, machine_id INTEGER, units INTEGER);', 'CREATE TABLE maintenance_events (id INTEGER PRIMARY KEY, machine_name TEXT, technician_name TEXT, event_date TEXT, downtime_hours REAL); CREATE TABLE production_runs (id INTEGER PRIMARY KEY, machine_name TEXT, units INTEGER); CREATE TABLE machines (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE technicians (id INTEGER PRIMARY KEY, name TEXT);', 'CREATE TABLE machines (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE maintenance_events (id INTEGER PRIMARY KEY, machine_id INTEGER REFERENCES machines(id), technician TEXT); CREATE TABLE production_runs (id INTEGER PRIMARY KEY, machine_id INTEGER REFERENCES machines(id), units INTEGER);']
  },
  'sql-12-clinic-design': {
    valid: ['CREATE TABLE patients (id INTEGER PRIMARY KEY, name TEXT NOT NULL, born TEXT); CREATE TABLE doctors (id INTEGER PRIMARY KEY, name TEXT NOT NULL, speciality TEXT); CREATE TABLE appointments (id INTEGER PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(id), doctor_id INTEGER NOT NULL REFERENCES doctors(id), starts_at TEXT NOT NULL);'],
    wrong: ['CREATE TABLE patients (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE doctors (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE appointments (id INTEGER PRIMARY KEY, patient_id INTEGER, doctor_id INTEGER, starts_at TEXT);', 'CREATE TABLE patients (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE appointments (id INTEGER PRIMARY KEY, patient_id INTEGER REFERENCES patients(id), doctor_name TEXT, starts_at TEXT);', 'CREATE TABLE appointments (patient_name TEXT, doctor_name TEXT, starts_at TEXT);']
  },
  // ------------------------------------------------------------- 13 indexes / transactions
  'sql-13-add-index': {
    valid: ['CREATE INDEX idx_orders_customer ON orders(customer_id);', 'CREATE INDEX i ON orders (customer_id, status);'],
    wrong: ['CREATE INDEX idx_orders_status ON orders(status);', 'CREATE INDEX idx_orders_date ON orders(ordered_on);', 'CREATE INDEX idx_orders_status_customer ON orders(status, customer_id);']
  },
  'sql-13-index-events': {
    valid: ['CREATE INDEX idx_me_machine ON maintenance_events(machine_id);', 'CREATE INDEX idx_me_both ON maintenance_events(machine_id, kind);', 'CREATE INDEX idx_me_kind_machine ON maintenance_events(kind, machine_id);'],
    wrong: ['CREATE INDEX idx_me_date ON maintenance_events(event_date);', 'CREATE INDEX idx_me_downtime ON maintenance_events(downtime_hours);']
  },
  'sql-13-index-orders': {
    valid: ['CREATE INDEX idx_o_customer ON orders(customer_id);', 'CREATE INDEX idx_o_cs ON orders(customer_id, status);', 'CREATE INDEX idx_o_sc ON orders(status, customer_id);'],
    wrong: ['CREATE INDEX idx_o_date ON orders(ordered_on);', 'CREATE INDEX idx_o_id ON orders(id, ordered_on);']
  },
  'sql-13-two-queries': {
    valid: ['CREATE INDEX i1 ON production_runs(machine_id); CREATE INDEX i2 ON production_runs(run_date);', 'CREATE INDEX i1 ON production_runs(machine_id, run_date); CREATE INDEX i2 ON production_runs(run_date);'],
    wrong: ['CREATE INDEX i1 ON production_runs(machine_id);', 'CREATE INDEX i2 ON production_runs(run_date);', 'CREATE INDEX i3 ON production_runs(units);']
  },
  'sql-13-two-queries-market': {
    valid: ['CREATE INDEX i1 ON products(category); CREATE INDEX i2 ON customers(city);'],
    wrong: ['CREATE INDEX i1 ON products(category);', 'CREATE INDEX i2 ON customers(city);', 'CREATE INDEX i3 ON products(price); CREATE INDEX i4 ON customers(name);']
  },
  'sql-13-undo-mistake': {
    valid: ["BEGIN;\nUPDATE products SET stock = 0;\nROLLBACK;\nBEGIN;\nUPDATE products SET stock = 0 WHERE category = 'Fasteners';\nCOMMIT;", "BEGIN;\nUPDATE products SET stock = 0;\nROLLBACK;\nUPDATE products SET stock = 0 WHERE category = 'Fasteners';"],
    wrong: ['BEGIN;\nUPDATE products SET stock = 0;\nCOMMIT;', 'BEGIN;\nUPDATE products SET stock = 0;\nROLLBACK;', "BEGIN;\nUPDATE products SET stock = 0;\nUPDATE products SET stock = 0 WHERE category = 'Fasteners';\nROLLBACK;\nCOMMIT;", "BEGIN;\nUPDATE products SET stock = 0;\nROLLBACK;\nUPDATE products SET stock = 0 WHERE category <> 'Fasteners';"]
  },
  'sql-13-undo-delete': {
    valid: ["BEGIN;\nDELETE FROM maintenance_events;\nROLLBACK;\nDELETE FROM maintenance_events WHERE kind = 'inspection';", "BEGIN;\nDELETE FROM maintenance_events;\nROLLBACK;\nBEGIN;\nDELETE FROM maintenance_events WHERE kind = 'inspection';\nCOMMIT;"],
    wrong: ['BEGIN;\nDELETE FROM maintenance_events;\nCOMMIT;', 'BEGIN;\nDELETE FROM maintenance_events;\nROLLBACK;', "BEGIN;\nDELETE FROM maintenance_events;\nROLLBACK;\nDELETE FROM maintenance_events WHERE kind <> 'inspection';"]
  },
  // ------------------------------------------------------------- 14 independent
  'sql-14-loyal-customers': {
    valid: ["SELECT c.name, COUNT(*) AS orders FROM orders o JOIN customers c ON c.id = o.customer_id GROUP BY c.id HAVING COUNT(DISTINCT substr(o.ordered_on, 1, 7)) >= 3 AND SUM(o.status = 'returned') = 0 ORDER BY orders DESC, c.name;"],
    wrong: ["SELECT c.name, COUNT(*) AS orders FROM orders o JOIN customers c ON c.id = o.customer_id GROUP BY c.id HAVING COUNT(DISTINCT substr(o.ordered_on, 1, 7)) >= 3 ORDER BY orders DESC, c.name;", "SELECT c.name, COUNT(*) AS orders FROM orders o JOIN customers c ON c.id = o.customer_id GROUP BY c.id HAVING COUNT(DISTINCT substr(o.ordered_on, 1, 7)) >= 3 AND SUM(o.status = 'returned') = 0 ORDER BY c.name;", "SELECT c.name, COUNT(*) AS orders FROM orders o JOIN customers c ON c.id = o.customer_id GROUP BY c.id HAVING COUNT(*) >= 3 AND SUM(o.status = 'returned') = 0 ORDER BY orders DESC, c.name;", "SELECT c.name, COUNT(*) AS orders FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.status <> 'returned' GROUP BY c.id HAVING COUNT(DISTINCT substr(o.ordered_on, 1, 7)) >= 3 ORDER BY orders DESC, c.name;"]
  },
  'sql-14-costly-departments': {
    valid: ['SELECT d.name, COUNT(*) AS machines, AVG(m.purchase_cost) AS avg_cost FROM machines m JOIN departments d ON d.id = m.department_id GROUP BY d.id HAVING avg_cost > (SELECT AVG(purchase_cost) FROM machines) ORDER BY avg_cost DESC;'],
    wrong: ['SELECT d.name, COUNT(*) AS machines, AVG(m.purchase_cost) AS avg_cost FROM machines m JOIN departments d ON d.id = m.department_id GROUP BY d.id ORDER BY avg_cost DESC;', 'SELECT d.name, COUNT(*) AS machines, AVG(m.purchase_cost) AS avg_cost FROM machines m JOIN departments d ON d.id = m.department_id GROUP BY d.id HAVING avg_cost > (SELECT MAX(purchase_cost) / 2 FROM machines) ORDER BY avg_cost DESC;', 'SELECT d.name, COUNT(*) AS machines, AVG(m.purchase_cost) AS avg_cost FROM machines m JOIN departments d ON d.id = m.department_id GROUP BY d.id HAVING avg_cost > (SELECT AVG(purchase_cost) FROM machines) ORDER BY avg_cost;', 'SELECT d.name, COUNT(*) AS machines, SUM(m.purchase_cost) AS avg_cost FROM machines m JOIN departments d ON d.id = m.department_id GROUP BY d.id HAVING avg_cost > (SELECT AVG(purchase_cost) FROM machines) ORDER BY avg_cost DESC;']
  },
  'sql-14-design-bikeshare': {
    valid: ['CREATE TABLE bikes (id INTEGER PRIMARY KEY, serial TEXT NOT NULL UNIQUE); CREATE TABLE stations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, capacity INTEGER CHECK (capacity > 0)); CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE); CREATE TABLE trips (id INTEGER PRIMARY KEY, bike_id INTEGER NOT NULL REFERENCES bikes(id), member_id INTEGER NOT NULL REFERENCES members(id), start_station_id INTEGER NOT NULL REFERENCES stations(id), end_station_id INTEGER REFERENCES stations(id), started_at TEXT NOT NULL, ended_at TEXT);'],
    wrong: ['CREATE TABLE bikes (id INTEGER PRIMARY KEY, serial TEXT); CREATE TABLE stations (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE trips (id INTEGER PRIMARY KEY, bike_id INTEGER, member_id INTEGER, start_station_id INTEGER, started_at TEXT);', 'CREATE TABLE trips (id INTEGER PRIMARY KEY, member_name TEXT NOT NULL, bike_serial TEXT, station_name TEXT, started_at TEXT);', 'CREATE TABLE bikes (id INTEGER PRIMARY KEY); CREATE TABLE stations (id INTEGER PRIMARY KEY); CREATE TABLE members (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE); CREATE TABLE trips (id INTEGER PRIMARY KEY, bike_id INTEGER REFERENCES bikes(id), member_id INTEGER REFERENCES members(id));']
  },
};
