import { chance, day, insert, int, money, names, pick, rng } from './generate';

/**
 * "Bytehaven Market": customers, products, orders and order lines. Some customers have never ordered and
 * some products have never sold (so LEFT JOINs matter); some cities are NULL; order statuses vary.
 */
export const MARKET_SCHEMA = `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  joined_on TEXT NOT NULL
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  ordered_on TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL
);
`;

const CITIES = ['Leeds', 'York', 'Bath', 'Hull', 'Ely', 'Derby'];
const CATEGORIES: Record<string, string[]> = {
  Tools: ['Wrench', 'Hammer', 'Drill', 'Clamp'],
  Safety: ['Helmet', 'Gloves', 'Goggles', 'Vest'],
  Electrical: ['Cable', 'Fuse', 'Switch', 'Sensor'],
  Fasteners: ['Bolt Pack', 'Nut Pack', 'Screw Pack', 'Washer Pack'],
};

export function marketSql(seed: number): string {
  const r = rng(seed);
  let sql = MARKET_SCHEMA;
  const who = names(r, 22);
  sql += insert('customers', ['id', 'name', 'city', 'joined_on'], who.map((n, i) => [i + 1, n, chance(r, 0.15) ? null : pick(r, CITIES), day(int(r, 0, 500))]));

  const products: (string | number)[][] = [];
  let pid = 1;
  for (const [cat, list] of Object.entries(CATEGORIES)) for (const n of list) products.push([pid++, n, cat, money(r, 3, 120), int(r, 0, 80)]);
  sql += insert('products', ['id', 'name', 'category', 'price', 'stock'], products);

  // Customers 19-22 never order; products 15-16 never sell.
  const orders: (string | number)[][] = [];
  const items: (string | number)[][] = [];
  let itemId = 1;
  for (let i = 0; i < 70; i++) {
    const id = i + 1;
    orders.push([id, int(r, 1, 18), day(int(r, 500, 720)), pick(r, ['paid', 'paid', 'paid', 'shipped', 'shipped', 'returned', 'pending'])]);
    const lines = int(r, 1, 4);
    const used = new Set<number>();
    for (let l = 0; l < lines; l++) {
      let p = int(r, 1, 14);
      while (used.has(p)) p = int(r, 1, 14);
      used.add(p);
      const base = products[p - 1]![4 - 1] as number;
      items.push([itemId++, id, p, int(r, 1, 8), Math.round(base * (0.9 + r() * 0.2) * 100) / 100]);
    }
  }
  sql += insert('orders', ['id', 'customer_id', 'ordered_on', 'status'], orders);
  sql += insert('order_items', ['id', 'order_id', 'product_id', 'quantity', 'unit_price'], items);
  return sql;
}
