/**
 * TEST-ONLY DATA (never imported by the app): reference solutions and plausible wrong attempts for the Phase 4 SQL
 * lessons. Each wrong attempt is a real misconception; if one passes, the check (or the data) is too weak.
 */
const years = (col: string) => `CAST(strftime('%Y', '2025-03-15') AS INTEGER) - CAST(strftime('%Y', ${col}) AS INTEGER) - (strftime('%m-%d', '2025-03-15') < strftime('%m-%d', ${col}))`;

export const solutionsPhase4Sql: Record<string, { valid: string[]; wrong: string[] }> = {
  'sql-16-orders-per-month': {
    valid: [
      "SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month ORDER BY month;",
      "SELECT SUBSTR(ordered_on, 1, 7) AS month, COUNT(*) AS orders FROM orders GROUP BY SUBSTR(ordered_on, 1, 7) ORDER BY 1;",
    ],
    wrong: [
      "SELECT strftime('%Y', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month ORDER BY month;",
      "SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month ORDER BY orders DESC;",
      "SELECT strftime('%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month ORDER BY month;",
      "SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(DISTINCT customer_id) AS orders FROM orders GROUP BY month ORDER BY month;",
    ],
  },
  'sql-16-employee-tenure': {
    valid: [
      `SELECT name, ${years('hired_on')} AS full_years FROM employees ORDER BY name;`,
      "SELECT name, CASE WHEN strftime('%m-%d', '2025-03-15') >= strftime('%m-%d', hired_on) THEN 2025 - CAST(strftime('%Y', hired_on) AS INTEGER) ELSE 2024 - CAST(strftime('%Y', hired_on) AS INTEGER) END AS full_years FROM employees ORDER BY name;",
    ],
    wrong: [
      // the naive year difference
      "SELECT name, 2025 - CAST(strftime('%Y', hired_on) AS INTEGER) AS full_years FROM employees ORDER BY name;",
      // the anniversary test is reversed
      `SELECT name, CAST(strftime('%Y', '2025-03-15') AS INTEGER) - CAST(strftime('%Y', hired_on) AS INTEGER) - (strftime('%m-%d', '2025-03-15') > strftime('%m-%d', hired_on)) AS full_years FROM employees ORDER BY name;`,
      // dividing days by 365 drifts with leap years
      "SELECT name, CAST((julianday('2025-03-15') - julianday(hired_on)) / 365 AS INTEGER) AS full_years FROM employees ORDER BY name;",
      // anniversaries on the same day are not yet complete (<= instead of <)
      `SELECT name, CAST(strftime('%Y', '2025-03-15') AS INTEGER) - CAST(strftime('%Y', hired_on) AS INTEGER) - (strftime('%m-%d', '2025-03-15') <= strftime('%m-%d', hired_on)) AS full_years FROM employees ORDER BY name;`,
      // rounds instead of truncating
      "SELECT name, CAST(ROUND((julianday('2025-03-15') - julianday(hired_on)) / 365.25) AS INTEGER) AS full_years FROM employees ORDER BY name;",
    ],
  },
  'sql-16-customer-tenure': {
    valid: [
      `SELECT name, ${years('joined_on')} AS full_years FROM customers ORDER BY name;`,
    ],
    wrong: [
      "SELECT name, 2025 - CAST(strftime('%Y', joined_on) AS INTEGER) AS full_years FROM customers ORDER BY name;",
      "SELECT name, CAST((julianday('2025-03-15') - julianday(joined_on)) / 365 AS INTEGER) AS full_years FROM customers ORDER BY name;",
      `SELECT name, CAST(strftime('%Y', '2025-03-15') AS INTEGER) - CAST(strftime('%Y', joined_on) AS INTEGER) - (strftime('%m-%d', '2025-03-15') <= strftime('%m-%d', joined_on)) AS full_years FROM customers ORDER BY name;`,
      "SELECT name, CAST((julianday('2025-03-15') - julianday(joined_on)) / 365.25 AS INTEGER) AS full_years FROM customers ORDER BY name;",
    ],
  },
  'sql-16-city-codes': {
    valid: [
      "SELECT name, COALESCE(UPPER(SUBSTR(city, 1, 3)), 'UNK') AS code FROM customers ORDER BY name;",
      "SELECT name, CASE WHEN city IS NULL THEN 'UNK' ELSE UPPER(SUBSTR(city, 1, 3)) END AS code FROM customers ORDER BY name;",
    ],
    wrong: [
      "SELECT name, UPPER(SUBSTR(city, 1, 3)) AS code FROM customers ORDER BY name;",
      "SELECT name, COALESCE(SUBSTR(city, 1, 3), 'UNK') AS code FROM customers ORDER BY name;",
      "SELECT name, COALESCE(UPPER(SUBSTR(city, 0, 3)), 'UNK') AS code FROM customers ORDER BY name;",
      "SELECT name, COALESCE(UPPER(SUBSTR(city, 1, 4)), 'UNK') AS code FROM customers ORDER BY name;",
      "SELECT name, COALESCE(UPPER(SUBSTR(city, 1, 3)), 'unk') AS code FROM customers ORDER BY name;",
    ],
  },
  'sql-16-badges': {
    valid: [
      "SELECT name, UPPER(SUBSTR(role, 1, 3)) || '-' || printf('%03d', id) AS code FROM employees ORDER BY name;",
      "SELECT name, UPPER(SUBSTR(role, 1, 3)) || '-' || SUBSTR('000' || id, -3) AS code FROM employees ORDER BY name;",
    ],
    wrong: [
      "SELECT name, UPPER(SUBSTR(role, 1, 3)) || '-' || id AS code FROM employees ORDER BY name;",
      "SELECT name, UPPER(SUBSTR(role, 1, 3)) || '-' || printf('%02d', id) AS code FROM employees ORDER BY name;",
      "SELECT name, SUBSTR(role, 1, 3) || '-' || printf('%03d', id) AS code FROM employees ORDER BY name;",
      "SELECT name, UPPER(SUBSTR(role, 1, 3)) || printf('%03d', id) AS code FROM employees ORDER BY name;",
      "SELECT name, UPPER(SUBSTR(role, 1, 4)) || '-' || printf('%03d', id) AS code FROM employees ORDER BY name;",
    ],
  },
  'sql-17-employee-managers': {
    valid: [
      'SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON m.id = e.manager_id ORDER BY e.name;',
      'SELECT e.name AS employee, (SELECT m.name FROM employees m WHERE m.id = e.manager_id) AS manager FROM employees e ORDER BY e.name;',
    ],
    wrong: [
      'SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON m.id = e.manager_id ORDER BY e.name;',
      'SELECT m.name AS employee, e.name AS manager FROM employees e LEFT JOIN employees m ON m.id = e.manager_id ORDER BY e.name;',
      'SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON m.id = e.id ORDER BY e.name;',
    ],
  },
  'sql-17-role-pairs': {
    valid: [
      'SELECT a.name AS first, b.name AS second FROM employees a JOIN employees b ON a.department_id = b.department_id AND a.role = b.role AND a.id < b.id ORDER BY a.name, b.name;',
      'SELECT a.name AS first, b.name AS second FROM employees a, employees b WHERE a.department_id = b.department_id AND a.role = b.role AND a.id < b.id ORDER BY first, second;',
    ],
    wrong: [
      // every pair twice
      'SELECT a.name AS first, b.name AS second FROM employees a JOIN employees b ON a.department_id = b.department_id AND a.role = b.role AND a.id <> b.id ORDER BY a.name, b.name;',
      // pairs employees with themselves
      'SELECT a.name AS first, b.name AS second FROM employees a JOIN employees b ON a.department_id = b.department_id AND a.role = b.role AND a.id <= b.id ORDER BY a.name, b.name;',
      // role ignored
      'SELECT a.name AS first, b.name AS second FROM employees a JOIN employees b ON a.department_id = b.department_id AND a.id < b.id ORDER BY a.name, b.name;',
      // department ignored
      'SELECT a.name AS first, b.name AS second FROM employees a JOIN employees b ON a.role = b.role AND a.id < b.id ORDER BY a.name, b.name;',
    ],
  },
  'sql-17-city-pairs': {
    valid: [
      'SELECT a.name AS first, b.name AS second FROM customers a JOIN customers b ON a.city = b.city AND a.id < b.id ORDER BY a.name, b.name;',
    ],
    wrong: [
      'SELECT a.name AS first, b.name AS second FROM customers a JOIN customers b ON a.city = b.city AND a.id <> b.id ORDER BY a.name, b.name;',
      // unknown cities are treated as one shared city
      'SELECT a.name AS first, b.name AS second FROM customers a JOIN customers b ON a.city IS b.city AND a.id < b.id ORDER BY a.name, b.name;',
      'SELECT a.name AS first, b.name AS second FROM customers a JOIN customers b ON a.city = b.city AND a.id <= b.id ORDER BY a.name, b.name;',
      // higher id first
      'SELECT b.name AS first, a.name AS second FROM customers a JOIN customers b ON a.city = b.city AND a.id < b.id ORDER BY b.name, a.name;',
    ],
  },
  'sql-17-paid-and-returned': {
    valid: [
      "SELECT c.name FROM customers c WHERE c.id IN (SELECT customer_id FROM orders WHERE status = 'paid') AND c.id IN (SELECT customer_id FROM orders WHERE status = 'returned') ORDER BY c.name;",
      "SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'paid' INTERSECT SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'returned' ORDER BY 1;",
    ],
    wrong: [
      // either, not both
      "SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status IN ('paid', 'returned') ORDER BY c.name;",
      // only one of the two statuses
      "SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'returned' ORDER BY c.name;",
      // a single order cannot be two statuses at once
      "SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'paid' AND o.status = 'returned' ORDER BY c.name;",
      // duplicates
      "SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status IN ('paid', 'returned') GROUP BY c.id ORDER BY c.name;",
    ],
  },
  'sql-17-inspected-never-repaired': {
    valid: [
      "SELECT m.name FROM machines m WHERE m.id IN (SELECT machine_id FROM maintenance_events WHERE kind = 'inspection') AND m.id NOT IN (SELECT machine_id FROM maintenance_events WHERE kind = 'repair') ORDER BY m.name;",
      "SELECT m.name FROM machines m JOIN maintenance_events e ON e.machine_id = m.id WHERE e.kind = 'inspection' EXCEPT SELECT m.name FROM machines m JOIN maintenance_events e ON e.machine_id = m.id WHERE e.kind = 'repair' ORDER BY 1;",
    ],
    wrong: [
      // any event that is not a repair, even for machines that were repaired elsewhere in the log
      "SELECT DISTINCT m.name FROM machines m JOIN maintenance_events e ON e.machine_id = m.id WHERE e.kind = 'inspection' AND e.kind <> 'repair' ORDER BY m.name;",
      "SELECT DISTINCT m.name FROM machines m JOIN maintenance_events e ON e.machine_id = m.id WHERE e.kind <> 'repair' ORDER BY m.name;",
      // inspected only
      "SELECT DISTINCT m.name FROM machines m JOIN maintenance_events e ON e.machine_id = m.id WHERE e.kind = 'inspection' ORDER BY m.name;",
      // machines never repaired, whether or not they were inspected
      "SELECT m.name FROM machines m WHERE m.id NOT IN (SELECT machine_id FROM maintenance_events WHERE kind = 'repair') ORDER BY m.name;",
    ],
  },
  'sql-18-orders-per-customer': {
    valid: [
      "SELECT c.name, COUNT(o.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.name;",
      "SELECT c.name, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS orders FROM customers c ORDER BY c.name;",
    ],
    wrong: [
      "SELECT c.name, COUNT(o.id) AS orders FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.name;",
      "SELECT c.name, COUNT(*) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NOT NULL GROUP BY c.id ORDER BY c.name;",
      "SELECT c.name, COUNT(DISTINCT c.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.name;",
      "SELECT c.name, COUNT(*) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.name;",
    ],
  },
  'sql-18-events-per-machine': {
    valid: [
      "SELECT m.name, COUNT(e.id) AS events FROM machines m LEFT JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY m.name;",
      "SELECT m.name, (SELECT COUNT(*) FROM maintenance_events e WHERE e.machine_id = m.id) AS events FROM machines m ORDER BY m.name;",
    ],
    wrong: [
      "SELECT m.name, COUNT(e.id) AS events FROM machines m JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY m.name;",
      "SELECT m.name, COUNT(*) AS events FROM machines m LEFT JOIN maintenance_events e ON e.machine_id = m.id WHERE e.id IS NOT NULL GROUP BY m.id ORDER BY m.name;",
      "SELECT m.name, COUNT(DISTINCT m.id) AS events FROM machines m LEFT JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY m.name;",
      "SELECT m.name, COUNT(*) AS events FROM machines m LEFT JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY m.name;",
    ],
  },
  'sql-18-runs-per-machine': {
    valid: [
      "SELECT m.name, COUNT(r.id) AS runs FROM machines m LEFT JOIN production_runs r ON r.machine_id = m.id GROUP BY m.id ORDER BY m.name;",
      "SELECT m.name, (SELECT COUNT(*) FROM production_runs r WHERE r.machine_id = m.id) AS runs FROM machines m ORDER BY m.name;",
    ],
    wrong: [
      "SELECT m.name, COUNT(r.id) AS runs FROM machines m JOIN production_runs r ON r.machine_id = m.id GROUP BY m.id ORDER BY m.name;",
      "SELECT m.name, COUNT(*) AS runs FROM machines m LEFT JOIN production_runs r ON r.machine_id = m.id WHERE r.id IS NOT NULL GROUP BY m.id ORDER BY m.name;",
      "SELECT m.name, COUNT(*) AS runs FROM machines m LEFT JOIN production_runs r ON r.machine_id = m.id GROUP BY m.id ORDER BY m.name;",
    ],
  },
  'sql-18-machine-totals': {
    valid: [
      "SELECT m.name, COALESCE((SELECT SUM(r.units_made) FROM production_runs r WHERE r.machine_id = m.id), 0) AS units, COALESCE((SELECT SUM(e.downtime_hours) FROM maintenance_events e WHERE e.machine_id = m.id), 0) AS downtime FROM machines m ORDER BY m.name;",
      "WITH u AS (SELECT machine_id, SUM(units_made) AS units FROM production_runs GROUP BY machine_id), d AS (SELECT machine_id, SUM(downtime_hours) AS downtime FROM maintenance_events GROUP BY machine_id) SELECT m.name, COALESCE(u.units, 0) AS units, COALESCE(d.downtime, 0) AS downtime FROM machines m LEFT JOIN u ON u.machine_id = m.id LEFT JOIN d ON d.machine_id = m.id ORDER BY m.name;",
    ],
    wrong: [
      "SELECT m.name, SUM(r.units_made) AS units, SUM(e.downtime_hours) AS downtime FROM machines m JOIN production_runs r ON r.machine_id = m.id JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY m.name;",
      "SELECT m.name, SUM(DISTINCT r.units_made) AS units, SUM(DISTINCT e.downtime_hours) AS downtime FROM machines m LEFT JOIN production_runs r ON r.machine_id = m.id LEFT JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY m.name;",
      "SELECT m.name, COALESCE(SUM(r.units_made), 0) AS units, COALESCE(SUM(e.downtime_hours), 0) AS downtime FROM machines m LEFT JOIN production_runs r ON r.machine_id = m.id LEFT JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY m.name;",
      "WITH u AS (SELECT machine_id, SUM(units_made) AS units FROM production_runs GROUP BY machine_id), d AS (SELECT machine_id, SUM(downtime_hours) AS downtime FROM maintenance_events GROUP BY machine_id) SELECT m.name, u.units AS units, d.downtime AS downtime FROM machines m JOIN u ON u.machine_id = m.id JOIN d ON d.machine_id = m.id ORDER BY m.name;",
      "SELECT m.name, (SELECT SUM(r.units_made) FROM production_runs r WHERE r.machine_id = m.id) AS units, (SELECT SUM(e.downtime_hours) FROM maintenance_events e WHERE e.machine_id = m.id) AS downtime FROM machines m ORDER BY m.name;",
    ],
  },
  'sql-18-team-summary': {
    valid: [
      "SELECT t.name, COALESCE((SELECT SUM(s.home_runs) FROM player_stats s JOIN players p ON p.id = s.player_id WHERE p.team_id = t.id), 0) AS home_runs, COALESCE((SELECT COUNT(*) FROM games g WHERE g.home_team_id = t.id), 0) AS home_games FROM teams t ORDER BY t.name;",
      "WITH hr AS (SELECT p.team_id, SUM(s.home_runs) AS home_runs FROM player_stats s JOIN players p ON p.id = s.player_id GROUP BY p.team_id), hg AS (SELECT home_team_id AS team_id, COUNT(*) AS home_games FROM games GROUP BY home_team_id) SELECT t.name, COALESCE(hr.home_runs, 0) AS home_runs, COALESCE(hg.home_games, 0) AS home_games FROM teams t LEFT JOIN hr ON hr.team_id = t.id LEFT JOIN hg ON hg.team_id = t.id ORDER BY t.name;",
    ],
    wrong: [
      "SELECT t.name, SUM(s.home_runs) AS home_runs, COUNT(g.id) AS home_games FROM teams t JOIN players p ON p.team_id = t.id JOIN player_stats s ON s.player_id = p.id JOIN games g ON g.home_team_id = t.id GROUP BY t.id ORDER BY t.name;",
      "SELECT t.name, SUM(s.home_runs) AS home_runs, COUNT(DISTINCT g.id) AS home_games FROM teams t JOIN players p ON p.team_id = t.id JOIN player_stats s ON s.player_id = p.id JOIN games g ON g.home_team_id = t.id GROUP BY t.id ORDER BY t.name;",
      "SELECT t.name, SUM(DISTINCT s.home_runs) AS home_runs, COUNT(DISTINCT g.id) AS home_games FROM teams t JOIN players p ON p.team_id = t.id JOIN player_stats s ON s.player_id = p.id JOIN games g ON g.home_team_id = t.id GROUP BY t.id ORDER BY t.name;",
      "SELECT t.name, COALESCE((SELECT SUM(s.home_runs) FROM player_stats s JOIN players p ON p.id = s.player_id WHERE p.team_id = t.id), 0) AS home_runs, 0 AS home_games FROM teams t ORDER BY t.name;",
      "SELECT t.name, COALESCE((SELECT SUM(s.home_runs) FROM player_stats s JOIN players p ON p.id = s.player_id WHERE p.team_id = t.id), 0) AS home_runs, (SELECT COUNT(*) FROM games g WHERE g.home_team_id = t.id OR g.away_team_id = t.id) AS home_games FROM teams t ORDER BY t.name;",
    ],
  },
  'sql-19-status-share': {
    valid: [
      "SELECT status, COUNT(*) AS orders, ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM orders), 1) AS share_pct FROM orders GROUP BY status ORDER BY orders DESC, status;",
      "SELECT status, COUNT(*) AS orders, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS share_pct FROM orders GROUP BY status ORDER BY orders DESC, status;",
    ],
    wrong: [
      "SELECT status, COUNT(*) AS orders, ROUND(100 * COUNT(*) / (SELECT COUNT(*) FROM orders), 1) AS share_pct FROM orders GROUP BY status ORDER BY orders DESC, status;",
      "SELECT status, COUNT(*) AS orders, ROUND(1.0 * COUNT(*) / (SELECT COUNT(*) FROM orders), 3) AS share_pct FROM orders GROUP BY status ORDER BY orders DESC, status;",
      "SELECT status, COUNT(*) AS orders, ROUND(100.0 * COUNT(*) / (SELECT MAX(c) FROM (SELECT COUNT(*) AS c FROM orders GROUP BY status)), 1) AS share_pct FROM orders GROUP BY status ORDER BY orders DESC, status;",
      "SELECT status, COUNT(*) AS orders, ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM orders), 1) AS share_pct FROM orders GROUP BY status ORDER BY orders DESC, status DESC;",
    ],
  },
  'sql-19-return-rate': {
    valid: [
      "SELECT p.category, COUNT(*) AS lines, ROUND(100.0 * SUM(CASE WHEN o.status = 'returned' THEN 1 ELSE 0 END) / COUNT(*), 1) AS return_pct FROM order_items i JOIN orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id GROUP BY p.category ORDER BY return_pct DESC, p.category;",
      "SELECT p.category, COUNT(*) AS lines, ROUND(100.0 * AVG(o.status = 'returned'), 1) AS return_pct FROM order_items i JOIN orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id GROUP BY p.category ORDER BY return_pct DESC, p.category;",
    ],
    wrong: [
      "SELECT p.category, COUNT(*) AS lines, ROUND(100 * SUM(CASE WHEN o.status = 'returned' THEN 1 ELSE 0 END) / COUNT(*), 1) AS return_pct FROM order_items i JOIN orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id GROUP BY p.category ORDER BY return_pct DESC, p.category;",
      "SELECT p.category, COUNT(DISTINCT o.id) AS lines, ROUND(100.0 * COUNT(DISTINCT CASE WHEN o.status = 'returned' THEN o.id END) / COUNT(DISTINCT o.id), 1) AS return_pct FROM order_items i JOIN orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id GROUP BY p.category ORDER BY return_pct DESC, p.category;",
      "SELECT p.category, COUNT(*) AS lines, ROUND(100.0 * SUM(CASE WHEN o.status = 'returned' THEN 1 ELSE 0 END) / SUM(CASE WHEN o.status = 'returned' THEN 1 ELSE 0 END), 1) AS return_pct FROM order_items i JOIN orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id GROUP BY p.category ORDER BY return_pct DESC, p.category;",
      "SELECT p.category, COUNT(*) AS lines, ROUND(100.0 * SUM(CASE WHEN o.status = 'returned' THEN 1 ELSE 0 END) / COUNT(*), 1) AS return_pct FROM order_items i JOIN orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id GROUP BY p.category ORDER BY return_pct, p.category;",
      "SELECT p.category, COUNT(*) AS lines, 100.0 AS return_pct FROM order_items i JOIN orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id WHERE o.status = 'returned' GROUP BY p.category ORDER BY return_pct DESC, p.category;",
    ],
  },
  'sql-19-home-win-rate': {
    valid: [
      "SELECT t.name, COUNT(*) AS home_games, ROUND(100.0 * SUM(CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END) / COUNT(*), 1) AS win_pct FROM games g JOIN teams t ON t.id = g.home_team_id GROUP BY t.id ORDER BY win_pct DESC, t.name;",
      "SELECT t.name, COUNT(*) AS home_games, ROUND(100.0 * AVG(g.home_score > g.away_score), 1) AS win_pct FROM teams t JOIN games g ON g.home_team_id = t.id GROUP BY t.id ORDER BY win_pct DESC, t.name;",
    ],
    wrong: [
      "SELECT t.name, COUNT(*) AS home_games, ROUND(100.0 * SUM(CASE WHEN g.home_score >= g.away_score THEN 1 ELSE 0 END) / COUNT(*), 1) AS win_pct FROM games g JOIN teams t ON t.id = g.home_team_id GROUP BY t.id ORDER BY win_pct DESC, t.name;",
      "SELECT t.name, COUNT(*) AS home_games, ROUND(100 * SUM(CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END) / COUNT(*), 1) AS win_pct FROM games g JOIN teams t ON t.id = g.home_team_id GROUP BY t.id ORDER BY win_pct DESC, t.name;",
      "SELECT t.name, COUNT(*) AS home_games, ROUND(100.0 * SUM(CASE WHEN g.away_score > g.home_score THEN 1 ELSE 0 END) / COUNT(*), 1) AS win_pct FROM games g JOIN teams t ON t.id = g.away_team_id GROUP BY t.id ORDER BY win_pct DESC, t.name;",
      "SELECT t.name, COUNT(*) AS home_games, ROUND(100.0 * SUM(CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END) / SUM(CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END), 1) AS win_pct FROM games g JOIN teams t ON t.id = g.home_team_id GROUP BY t.id ORDER BY win_pct DESC, t.name;",
    ],
  },
  'sql-19-monthly-orders': {
    valid: [
      "WITH monthly AS (SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month) SELECT month, orders, LAG(orders) OVER (ORDER BY month) AS previous, orders - LAG(orders) OVER (ORDER BY month) AS change FROM monthly ORDER BY month;",
      "WITH monthly AS (SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month), p AS (SELECT month, orders, LAG(orders) OVER (ORDER BY month) AS previous FROM monthly) SELECT month, orders, previous, orders - previous AS change FROM p ORDER BY month;",
    ],
    wrong: [
      "WITH monthly AS (SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month) SELECT month, orders, LAG(orders) OVER (ORDER BY month) AS previous, LAG(orders) OVER (ORDER BY month) - orders AS change FROM monthly ORDER BY month;",
      "WITH monthly AS (SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month) SELECT month, orders, LEAD(orders) OVER (ORDER BY month) AS previous, orders - LEAD(orders) OVER (ORDER BY month) AS change FROM monthly ORDER BY month;",
      "WITH monthly AS (SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month) SELECT month, orders, LAG(orders) OVER (ORDER BY month) AS previous, orders - COALESCE(LAG(orders) OVER (ORDER BY month), orders) AS change FROM monthly ORDER BY month;",
      "WITH monthly AS (SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month) SELECT month, orders, LAG(orders) OVER (ORDER BY month) AS previous, orders - LAG(orders) OVER (ORDER BY month) AS change FROM monthly ORDER BY orders DESC;",
      "WITH monthly AS (SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month) SELECT month, orders, LAG(orders) OVER (ORDER BY orders) AS previous, orders - LAG(orders) OVER (ORDER BY month) AS change FROM monthly ORDER BY month;",
    ],
  },
  'sql-19-monthly-downtime': {
    valid: [
      "WITH m AS (SELECT strftime('%Y-%m', event_date) AS month, ROUND(SUM(downtime_hours), 1) AS hours FROM maintenance_events GROUP BY month) SELECT month, hours, LAG(hours) OVER (ORDER BY month) AS previous, ROUND(hours - LAG(hours) OVER (ORDER BY month), 1) AS change FROM m ORDER BY month;",
      "WITH m AS (SELECT strftime('%Y-%m', event_date) AS month, SUM(downtime_hours) AS h FROM maintenance_events GROUP BY month), p AS (SELECT month, h, LAG(h) OVER (ORDER BY month) AS ph FROM m) SELECT month, ROUND(h, 1) AS hours, ROUND(ph, 1) AS previous, ROUND(h - ph, 1) AS change FROM p ORDER BY month;",
    ],
    wrong: [
      "WITH m AS (SELECT strftime('%Y-%m', event_date) AS month, ROUND(SUM(downtime_hours), 1) AS hours FROM maintenance_events GROUP BY month) SELECT month, hours, LAG(hours) OVER (ORDER BY month) AS previous, ROUND(LAG(hours) OVER (ORDER BY month) - hours, 1) AS change FROM m ORDER BY month;",
      "WITH m AS (SELECT strftime('%Y-%m', event_date) AS month, ROUND(SUM(downtime_hours), 1) AS hours FROM maintenance_events GROUP BY month) SELECT month, hours, LEAD(hours) OVER (ORDER BY month) AS previous, ROUND(hours - LEAD(hours) OVER (ORDER BY month), 1) AS change FROM m ORDER BY month;",
      "WITH m AS (SELECT strftime('%Y', event_date) AS month, ROUND(SUM(downtime_hours), 1) AS hours FROM maintenance_events GROUP BY month) SELECT month, hours, LAG(hours) OVER (ORDER BY month) AS previous, ROUND(hours - LAG(hours) OVER (ORDER BY month), 1) AS change FROM m ORDER BY month;",
      "WITH m AS (SELECT strftime('%Y-%m', event_date) AS month, ROUND(COUNT(*), 1) AS hours FROM maintenance_events GROUP BY month) SELECT month, hours, LAG(hours) OVER (ORDER BY month) AS previous, ROUND(hours - LAG(hours) OVER (ORDER BY month), 1) AS change FROM m ORDER BY month;",
      "WITH m AS (SELECT strftime('%Y-%m', event_date) AS month, ROUND(SUM(downtime_hours), 1) AS hours FROM maintenance_events GROUP BY month) SELECT month, hours, LAG(hours) OVER (ORDER BY month) AS previous, ROUND(hours - LAG(hours) OVER (ORDER BY month), 1) AS change FROM m ORDER BY hours DESC;",
    ],
  },
  'sql-20-customer-tier': {
    valid: [
      "ALTER TABLE customers ADD COLUMN tier TEXT NOT NULL DEFAULT 'standard'; UPDATE customers SET tier = 'vip' WHERE id IN (SELECT customer_id FROM orders WHERE status <> 'returned' GROUP BY customer_id HAVING COUNT(*) >= 3);",
      "ALTER TABLE customers ADD COLUMN tier text NOT NULL DEFAULT \"standard\"; UPDATE customers SET tier = 'vip' WHERE (SELECT COUNT(*) FROM orders o WHERE o.customer_id = customers.id AND o.status != 'returned') >= 3;",
    ],
    wrong: [
      "ALTER TABLE customers ADD COLUMN tier TEXT NOT NULL DEFAULT 'standard'; UPDATE customers SET tier = 'vip' WHERE id IN (SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) >= 3);",
      "ALTER TABLE customers ADD COLUMN tier TEXT NOT NULL DEFAULT 'standard'; UPDATE customers SET tier = 'vip' WHERE id IN (SELECT customer_id FROM orders WHERE status <> 'returned' GROUP BY customer_id HAVING COUNT(*) > 3);",
      "ALTER TABLE customers ADD COLUMN tier TEXT DEFAULT 'standard'; UPDATE customers SET tier = 'vip' WHERE id IN (SELECT customer_id FROM orders WHERE status <> 'returned' GROUP BY customer_id HAVING COUNT(*) >= 3);",
      "ALTER TABLE customers ADD COLUMN tier TEXT; UPDATE customers SET tier = 'vip' WHERE id IN (SELECT customer_id FROM orders WHERE status <> 'returned' GROUP BY customer_id HAVING COUNT(*) >= 3);",
      "ALTER TABLE customers ADD COLUMN tier TEXT NOT NULL DEFAULT 'standard';",
      "ALTER TABLE customers ADD COLUMN tier TEXT NOT NULL DEFAULT 'standard'; UPDATE customers SET tier = 'vip';",
    ],
  },
  'sql-20-machine-priority': {
    valid: [
      "ALTER TABLE machines ADD COLUMN priority INTEGER NOT NULL DEFAULT 0; UPDATE machines SET priority = 1 WHERE id IN (SELECT machine_id FROM maintenance_events GROUP BY machine_id HAVING SUM(downtime_hours) > 20);",
      "ALTER TABLE machines ADD COLUMN priority INT NOT NULL DEFAULT 0; UPDATE machines SET priority = 1 WHERE (SELECT SUM(downtime_hours) FROM maintenance_events e WHERE e.machine_id = machines.id) > 20;",
    ],
    wrong: [
      "ALTER TABLE machines ADD COLUMN priority INTEGER NOT NULL DEFAULT 0; UPDATE machines SET priority = 1 WHERE id IN (SELECT machine_id FROM maintenance_events GROUP BY machine_id HAVING SUM(downtime_hours) >= 20);",
      "ALTER TABLE machines ADD COLUMN priority INTEGER NOT NULL DEFAULT 0; UPDATE machines SET priority = 1 WHERE id IN (SELECT machine_id FROM maintenance_events WHERE downtime_hours > 20);",
      "ALTER TABLE machines ADD COLUMN priority INTEGER NOT NULL DEFAULT 0; UPDATE machines SET priority = 1 WHERE id IN (SELECT machine_id FROM maintenance_events GROUP BY machine_id HAVING AVG(downtime_hours) > 20);",
      "ALTER TABLE machines ADD COLUMN priority INTEGER NOT NULL DEFAULT 1; UPDATE machines SET priority = 0 WHERE id NOT IN (SELECT machine_id FROM maintenance_events GROUP BY machine_id HAVING SUM(downtime_hours) > 20);",
      "ALTER TABLE machines ADD COLUMN priority INTEGER DEFAULT 0; UPDATE machines SET priority = 1 WHERE id IN (SELECT machine_id FROM maintenance_events GROUP BY machine_id HAVING SUM(downtime_hours) > 20);",
    ],
  },
  'sql-20-player-veteran': {
    valid: [
      "ALTER TABLE players ADD COLUMN veteran INTEGER NOT NULL DEFAULT 0; UPDATE players SET veteran = 1 WHERE birth_year < 1995;",
      "ALTER TABLE players ADD COLUMN veteran INTEGER NOT NULL DEFAULT 0; UPDATE players SET veteran = CASE WHEN birth_year < 1995 THEN 1 ELSE 0 END;",
    ],
    wrong: [
      "ALTER TABLE players ADD COLUMN veteran INTEGER NOT NULL DEFAULT 0; UPDATE players SET veteran = 1 WHERE birth_year <= 1995;",
      "ALTER TABLE players ADD COLUMN veteran INTEGER NOT NULL DEFAULT 0; UPDATE players SET veteran = 1 WHERE birth_year > 1995;",
      "ALTER TABLE players ADD COLUMN veteran INTEGER NOT NULL DEFAULT 1; UPDATE players SET veteran = 0 WHERE birth_year >= 1995;",
      "ALTER TABLE players ADD COLUMN veteran INTEGER DEFAULT 0; UPDATE players SET veteran = 1 WHERE birth_year < 1995;",
      "ALTER TABLE players ADD COLUMN veteran TEXT NOT NULL DEFAULT '0'; UPDATE players SET veteran = '1' WHERE birth_year < 1995;",
    ],
  },
};
