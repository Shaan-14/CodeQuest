import { insert, int, money, names, pick, rng } from './generate';

/**
 * A deliberately DENORMALISED table for the normalisation lesson: customer details are repeated on every row.
 * The player restructures it into `customers` and `sales`.
 */
export const FLAT_SCHEMA = `
CREATE TABLE sales_flat (
  id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  product TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price REAL NOT NULL
);
`;

const PRODUCTS = ['Bolt Pack', 'Gear', 'Sensor', 'Helmet', 'Cable', 'Clamp', 'Fuse'];
const CITIES = ['Leeds', 'York', 'Bath', 'Hull', 'Ely'];

export function flatSql(seed: number): string {
  const r = rng(seed);
  const who = names(r, 9).map((n) => [n, pick(r, CITIES)] as const);
  const rows: (string | number)[][] = [];
  for (let i = 0; i < 36; i++) {
    const [name, city] = pick(r, who);
    rows.push([i + 1, name, city, pick(r, PRODUCTS), int(r, 1, 9), money(r, 2, 90)]);
  }
  return FLAT_SCHEMA + insert('sales_flat', ['id', 'customer_name', 'customer_city', 'product', 'qty', 'price'], rows);
}
