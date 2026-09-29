import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import { databases, getDatabase, sourcesFor } from './index';
import { createPythonEngine, type PythonEngine } from '../../learning/python/pythonEngine';

let engine: PythonEngine;
beforeAll(async () => {
  engine = createPythonEngine((await loadPyodide()) as never);
}, 60_000);

const q = (db: string, sql: string) => {
  const r = engine.run({ language: 'sql', code: sql, db, sources: sourcesFor([db]) });
  expect(r.error, sql).toBe('');
  return r.sql!.at(-1)!.rows!;
};
const rows = (db: string, sql: string) => q(db, sql) as (string | number | null)[][];

describe('game databases', () => {
  it('every database builds in real SQLite with no foreign-key violations', () => {
    for (const d of databases.filter((x) => x.setup)) {
      expect(rows(d.id, 'PRAGMA foreign_key_check;'), d.id).toEqual([]);
      expect(rows(d.id, "SELECT count(*) FROM sqlite_master WHERE type='table'")[0]![0], d.id).toBe(d.tables.length);
    }
  });
  it('the schema browser documentation matches the real schema exactly', () => {
    for (const d of databases.filter((x) => x.setup)) {
      for (const table of d.tables) {
        const real = rows(d.id, `SELECT name FROM pragma_table_info('${table.name}')`).map((r) => r[0]);
        expect(real, `${d.id}.${table.name}`).toEqual(table.columns.map((c) => c.name));
      }
    }
  });
  it('each hidden twin has the same schema but different data', () => {
    for (const id of ['works', 'market', 'league']) {
      const a = getDatabase(id)!;
      const b = getDatabase(id + '-b')!;
      expect(a.tables).toEqual(b.tables);
      expect(a.setup).not.toBe(b.setup);
    }
  });
  it('data generation is deterministic', async () => {
    const { worksSql } = await import('./works');
    expect(worksSql(101)).toBe(worksSql(101));
    expect(worksSql(101)).not.toBe(worksSql(102));
  });
  it('is deliberately messy in realistic ways (NULLs, orphans, problem machines)', () => {
    for (const w of ['works', 'works-b']) {
      expect(rows(w, 'SELECT count(*) FROM maintenance_events WHERE cost IS NULL')[0]![0], w).toBeGreaterThan(0);
      expect(rows(w, 'SELECT count(*) FROM production_runs WHERE units_defective IS NULL')[0]![0], w).toBeGreaterThan(0);
      expect(rows(w, 'SELECT count(*) FROM employees WHERE manager_id IS NULL')[0]![0], w).toBe(4);
      // The "problem machines" stand out: some machine's average repair downtime is far above the median machine's.
      const avg = rows(w, "SELECT AVG(downtime_hours) FROM maintenance_events WHERE kind='repair' GROUP BY machine_id ORDER BY 1 DESC").map((r) => r[0] as number);
      expect(avg[0]!, w).toBeGreaterThan(avg[Math.floor(avg.length / 2)]! * 2);
    }
    for (const m of ['market', 'market-b']) {
      expect(rows(m, 'SELECT count(*) FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL')[0]![0], m).toBeGreaterThan(0);
      expect(rows(m, 'SELECT count(*) FROM products p LEFT JOIN order_items i ON i.product_id = p.id WHERE i.id IS NULL')[0]![0], m).toBeGreaterThan(0);
      expect(rows(m, 'SELECT count(*) FROM customers WHERE city IS NULL')[0]![0], m).toBeGreaterThan(0);
    }
  });
  it('has tie-free ordering columns where challenges rely on ORDER BY ... LIMIT', () => {
    const unique = (db: string, table: string, col: string) => {
      const [total, distinct] = rows(db, `SELECT COUNT(${col}), COUNT(DISTINCT ${col}) FROM ${table}`)[0]!;
      expect(distinct, `${db}.${table}.${col} must have no ties`).toBe(total);
    };
    for (const w of ['works', 'works-b']) { unique(w, 'machines', 'purchase_cost'); unique(w, 'employees', 'hourly_rate'); }
    for (const m of ['market', 'market-b']) unique(m, 'products', 'price');
  });
  it('leaves some rows unmatched so LEFT JOIN practice is meaningful', () => {
    for (const w of ['works', 'works-b']) {
      expect(rows(w, 'SELECT COUNT(*) FROM machines m LEFT JOIN production_runs r ON r.machine_id = m.id WHERE r.id IS NULL')[0]![0], w).toBeGreaterThan(0);
      expect(rows(w, "SELECT COUNT(*) FROM employees e LEFT JOIN production_runs r ON r.operator_id = e.id WHERE e.role = 'operator' AND r.id IS NULL")[0]![0], w).toBeGreaterThan(0);
    }
  });
  it('has out-of-stock products', () => {
    for (const m of ['market', 'market-b']) expect(rows(m, 'SELECT COUNT(*) FROM products WHERE stock = 0')[0]![0], m).toBeGreaterThan(0);
  });
  it('the flat table repeats customer details, so it is worth normalising', () => {
    for (const f of ['flat', 'flat-b']) {
      const [rowsN, customers] = rows(f, 'SELECT COUNT(*), COUNT(DISTINCT customer_name) FROM sales_flat')[0]!;
      expect(rowsN, f).toBeGreaterThan((customers as number) * 2);
    }
  });
  it('are a sensible size for a browser (small setup SQL)', () => {
    for (const d of databases) expect(d.setup.length, d.id).toBeLessThan(60_000);
  });
});
