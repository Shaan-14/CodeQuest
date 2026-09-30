/** TEST-ONLY DATA: solutions and wrong attempts for the Phase 3 SQL review trial. */
export const solutionsPhase3Sql: Record<string, { valid: string[]; wrong: string[] }> = {
  'sql-15-cheap-stock': {
    valid: [
      "SELECT name, price FROM products WHERE stock >= 1 AND category IN ('Tools', 'Safety') ORDER BY price, name LIMIT 5;",
      "SELECT name, price FROM products WHERE stock > 0 AND (category = 'Tools' OR category = 'Safety') ORDER BY price ASC, name ASC LIMIT 5;",
    ],
    wrong: [
      "SELECT name, price FROM products WHERE category IN ('Tools', 'Safety') ORDER BY price, name LIMIT 5;",
      "SELECT name, price FROM products WHERE stock >= 1 AND category IN ('Tools', 'Safety') ORDER BY price DESC, name LIMIT 5;",
      "SELECT name, price FROM products WHERE stock >= 1 AND category IN ('Tools', 'Safety') ORDER BY price, name LIMIT 4;",
      "SELECT name, price FROM products WHERE stock >= 1 AND category = 'Tools' ORDER BY price, name LIMIT 5;",
      "SELECT name, price FROM products WHERE stock >= 1 OR category IN ('Tools', 'Safety') ORDER BY price, name LIMIT 5;",
    ],
  },
  'sql-15-unmanaged-veterans': {
    valid: [
      "SELECT name, role, hired_on FROM employees WHERE manager_id IS NULL AND hired_on < '2024-01-01' ORDER BY hired_on, name;",
      "SELECT name, role, hired_on FROM employees WHERE manager_id IS NULL AND hired_on < '2024' ORDER BY hired_on ASC, name ASC;",
    ],
    wrong: [
      "SELECT name, role, hired_on FROM employees WHERE manager_id = NULL AND hired_on < '2024-01-01' ORDER BY hired_on, name;",
      "SELECT name, role, hired_on FROM employees WHERE manager_id IS NULL AND hired_on < '2024-06-01' ORDER BY hired_on, name;",
      "SELECT name, role, hired_on FROM employees WHERE manager_id IS NULL AND hired_on < '2023-10-01' ORDER BY hired_on, name;",
      "SELECT name, role, hired_on FROM employees WHERE manager_id IS NULL AND hired_on < '2024-01-01' ORDER BY hired_on DESC, name;",
      "SELECT name, role, hired_on FROM employees WHERE manager_id IS NOT NULL AND hired_on < '2024-01-01' ORDER BY hired_on, name;",
      "SELECT name, role, hired_on FROM employees WHERE manager_id IS NULL OR hired_on < '2024-01-01' ORDER BY hired_on, name;",
      "SELECT name, role FROM employees WHERE manager_id IS NULL AND hired_on < '2024-01-01' ORDER BY hired_on, name;",
      "SELECT name, role, hired_on FROM employees WHERE manager_id IS NULL AND hired_on < '2024-01-01' ORDER BY name;",
    ],
  },
  'sql-15-price-rise': {
    valid: [
      'UPDATE products SET price = MIN(ROUND(price * 1.08, 2), 100.0) WHERE stock < 20;',
      'UPDATE products SET price = CASE WHEN ROUND(price * 1.08, 2) > 100 THEN 100 ELSE ROUND(price * 1.08, 2) END WHERE stock < 20;',
    ],
    wrong: [
      'UPDATE products SET price = ROUND(price * 1.08, 2) WHERE stock < 20;',
      'UPDATE products SET price = MIN(ROUND(price * 1.08, 2), 100.0);',
      'UPDATE products SET price = MIN(price * 1.08, 100.0) WHERE stock < 20;',
      'UPDATE products SET price = MIN(ROUND(price * 1.8, 2), 100.0) WHERE stock < 20;',
      'UPDATE products SET price = ROUND(price * 1.08, 2) WHERE stock < 20 AND price * 1.08 <= 100;',
      'UPDATE products SET price = MIN(ROUND(price * 1.08, 2), 99.99) WHERE stock < 20;',
    ],
  },
  'sql-15-archive-old-orders': {
    valid: [
      "CREATE TABLE order_archive AS SELECT * FROM orders WHERE ordered_on < '2024-08-01'; DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE ordered_on < '2024-08-01'); DELETE FROM orders WHERE ordered_on < '2024-08-01';",
      "BEGIN; CREATE TABLE order_archive (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, ordered_on TEXT NOT NULL, status TEXT NOT NULL); INSERT INTO order_archive SELECT id, customer_id, ordered_on, status FROM orders WHERE ordered_on < '2024-08-01'; DELETE FROM order_items WHERE order_id IN (SELECT id FROM order_archive); DELETE FROM orders WHERE id IN (SELECT id FROM order_archive); COMMIT;",
    ],
    wrong: [
      "CREATE TABLE order_archive AS SELECT * FROM orders WHERE ordered_on < '2024-08-01'; DELETE FROM orders WHERE ordered_on < '2024-08-01';",
      "CREATE TABLE order_archive AS SELECT * FROM orders WHERE ordered_on < '2024-08-01'; DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE ordered_on < '2024-08-01');",
      "CREATE TABLE order_archive AS SELECT * FROM orders WHERE ordered_on < '2024-09-01'; DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE ordered_on < '2024-09-01'); DELETE FROM orders WHERE ordered_on < '2024-09-01';",
      "CREATE TABLE order_archive AS SELECT * FROM orders WHERE ordered_on < '2024-08-01'; DELETE FROM orders WHERE ordered_on < '2024-08-01'; DELETE FROM order_items WHERE order_id NOT IN (SELECT id FROM orders);",
      "CREATE TABLE order_archive AS SELECT * FROM orders; DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE ordered_on < '2024-08-01'); DELETE FROM orders WHERE ordered_on < '2024-08-01';",
      "CREATE TABLE order_archive AS SELECT * FROM orders WHERE ordered_on < '2024-08-01'; DELETE FROM order_items; DELETE FROM orders WHERE ordered_on < '2024-08-01';",
    ],
  },
  'sql-15-slow-lookups': {
    valid: [
      'CREATE INDEX idx_orders_customer ON orders(customer_id); CREATE INDEX idx_items_order ON order_items(order_id);',
      'CREATE INDEX a ON orders (customer_id, ordered_on); CREATE INDEX b ON order_items (order_id, product_id);',
    ],
    wrong: [
      'CREATE INDEX idx_orders_customer ON orders(customer_id);',
      'CREATE INDEX idx_items_order ON order_items(order_id);',
      'CREATE INDEX a ON orders(status); CREATE INDEX b ON order_items(product_id);',
      'CREATE INDEX a ON orders(ordered_on, customer_id); CREATE INDEX b ON order_items(order_id);',
      'CREATE INDEX a ON orders(customer_id); CREATE INDEX b ON order_items(quantity);',
      'CREATE INDEX a ON orders(customer_id); DELETE FROM order_items WHERE id > 5; CREATE INDEX b ON order_items(order_id);',
    ],
  },
};
