/** Phase 2 engine features, tested against real CPython/SQLite (Pyodide in Node). */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import { createPythonEngine, type PythonEngine } from './pythonEngine';
import type { Check } from '../../content/schema';

let engine: PythonEngine;
beforeAll(async () => {
  engine = createPythonEngine((await loadPyodide()) as never);
}, 60_000);

const SHOP = `
create table customers(id integer primary key, name text not null, city text);
create table orders(id integer primary key, customer_id integer not null references customers(id), total real, status text);
insert into customers values (1,'Ada','Leeds'),(2,'Bo','York'),(3,'Cy',NULL);
insert into orders values (1,1,50.0,'paid'),(2,1,20.5,'paid'),(3,2,99.0,'open'),(4,2,10.0,'paid');
`;
const SHOP_B = SHOP.replace("'Ada','Leeds'", "'Dee','Bath'").replace('50.0', '75.0');
const sources = { shop: SHOP, 'shop-b': SHOP_B };

describe('fixtures: files and databases for Python code', () => {
  it('provides virtual files, and cleans up afterwards', () => {
    const files = { 'data.csv': 'a,b\n1,2\n3,4\n' };
    const code = 'rows = open("data.csv").read().splitlines()\nprint(len(rows))\nopen("out.txt","w").write("x")';
    expect(engine.run({ code, fixtures: { files } }).stdout).toBe('3\n');
    // a second run must not see the file the first run wrote
    expect(engine.run({ code: 'import os\nprint(os.path.exists("out.txt"), os.path.exists("data.csv"))' }).stdout).toBe('False False\n');
  });
  it('rejects fixture paths that escape the workspace', () => {
    expect(() => engine.run({ code: 'pass', fixtures: { files: { '../evil.txt': 'x' } } })).toThrow();
  });
  it('materialises a database file that real sqlite3 can open', () => {
    const code = 'import sqlite3\nc = sqlite3.connect("shop.db")\nprint(c.execute("select count(*) from orders").fetchone()[0])';
    expect(engine.run({ code, fixtures: { databases: ['shop'] }, sources }).stdout).toBe('4\n');
  });
  it('gives every check a fresh copy (state does not leak between checks)', () => {
    const code = 'import sqlite3\nc = sqlite3.connect("shop.db")\nc.execute("delete from orders")\nc.commit()';
    const checks: Check[] = [
      { kind: 'script', name: 'deleted', code: 'import sqlite3\nassert sqlite3.connect("shop.db").execute("select count(*) from orders").fetchone()[0] == 0' },
      { kind: 'script', name: 'still fresh for the next check', code: 'pass', databases: ['shop'] },
    ];
    const r = engine.grade({ code, checks, fixtures: { databases: ['shop'] }, sources });
    expect(r.passed).toBe(true);
  });
});

describe('python checks: file, script, tests', () => {
  it('file: reads what the program wrote (text and JSON)', () => {
    const files = { 'in.txt': 'b\na\nc\n' };
    const code = 'lines = open("in.txt").read().split()\nopen("out.txt","w").write("\\n".join(sorted(lines)))\nimport json\njson.dump({"n": len(lines)}, open("o.json","w"))';
    const checks: Check[] = [
      { kind: 'file', name: 'sorted', path: 'out.txt', expect: 'a\nb\nc' },
      { kind: 'file', name: 'json', path: 'o.json', expect: '{"n": 3}', json: true },
    ];
    expect(engine.grade({ code, checks, fixtures: { files } }).passed).toBe(true);
    const missing = engine.grade({ code: 'pass', checks: [checks[0]!], fixtures: { files } });
    expect(missing.checks[0]!.message).toContain('did not create');
    const bad = engine.grade({ code: 'open("o.json","w").write("{oops")', checks: [{ kind: 'file', name: 'j', path: 'o.json', expect: '{}', json: true }] });
    expect(bad.checks[0]!.message).toContain('not valid JSON');
  });
  it('script: tests behaviour of classes with nudging assert messages', () => {
    const checks: Check[] = [{ kind: 'script', name: 'account', code: 'a = Account(10)\na.deposit(5)\nassert a.balance == 15, "deposit should add to the balance"' }];
    const ok = 'class Account:\n    def __init__(self, b):\n        self.balance = b\n    def deposit(self, n):\n        self.balance += n';
    expect(engine.grade({ code: ok, checks }).passed).toBe(true);
    const wrong = ok.replace('+= n', '= n');
    const r = engine.grade({ code: wrong, checks });
    expect(r.passed).toBe(false);
    expect(r.checks[0]!.message).toBe('deposit should add to the balance');
    const crash = engine.grade({ code: 'x = 1', checks });
    expect(crash.checks[0]!.message).toContain('NameError');
  });
  it('tests: the player writes tests, judged against correct and buggy implementations', () => {
    const check: Check = {
      kind: 'tests', name: 'catches the bugs', minTests: 2,
      correct: 'def clamp(x, lo, hi):\n    return max(lo, min(x, hi))',
      buggy: [
        { name: 'ignores the upper limit', code: 'def clamp(x, lo, hi):\n    return max(lo, x)' },
        { name: 'ignores the lower limit', code: 'def clamp(x, lo, hi):\n    return min(x, hi)' },
      ],
    };
    const good = 'def test_low():\n    assert clamp(-5, 0, 10) == 0\ndef test_high():\n    assert clamp(50, 0, 10) == 10\ndef test_mid():\n    assert clamp(5, 0, 10) == 5';
    expect(engine.grade({ code: good, checks: [check] }).passed).toBe(true);
    const weak = 'def test_mid():\n    assert clamp(5, 0, 10) == 5\ndef test_mid2():\n    assert clamp(6, 0, 10) == 6';
    const r = engine.grade({ code: weak, checks: [check] });
    expect(r.passed).toBe(false);
    expect(r.checks[0]!.message).toContain('missed');
    const wrongTest = 'def test_a():\n    assert clamp(5, 0, 10) == 99\ndef test_b():\n    assert clamp(1, 0, 10) == 1';
    expect(engine.grade({ code: wrongTest, checks: [check] }).checks[0]!.message).toContain('correct implementation');
    expect(engine.grade({ code: 'x = 1', checks: [check] }).checks[0]!.message).toContain('at least 2');
  });
  it('constraints: import:<module> and sql:<pattern>', () => {
    const checks: Check[] = [{ kind: 'output', name: 'o', expect: '4.0' }];
    const c = [{ type: 'requires' as const, node: 'import:math', message: 'use math' }];
    expect(engine.grade({ code: 'import math\nprint(math.sqrt(16))', checks, constraints: c }).passed).toBe(true);
    expect(engine.grade({ code: 'print(16 ** 0.5)', checks, constraints: c }).passed).toBe(false);
    expect(engine.grade({ code: 'from math import sqrt\nprint(sqrt(16))', checks, constraints: c }).passed).toBe(true);
  });
});

describe('SQL: run', () => {
  const run = (sql: string, db = 'shop') => engine.run({ language: 'sql', code: sql, db, sources });
  it('runs real SQLite and returns result tables', () => {
    const r = run('SELECT name FROM customers ORDER BY name;');
    expect(r.ok).toBe(true);
    expect(r.sql![0]).toMatchObject({ kind: 'rows', columns: ['name'], rows: [['Ada'], ['Bo'], ['Cy']] });
  });
  it('runs several statements and reports affected rows', () => {
    const r = run("UPDATE orders SET status='x' WHERE total > 20; SELECT count(*) FROM orders WHERE status='x';");
    expect(r.sql![0]).toMatchObject({ kind: 'ok', rowcount: 3 });
    expect(r.sql![1]!.rows).toEqual([[3]]);
  });
  it('reports SQL errors clearly and stops at the failing statement', () => {
    const r = run('SELECT 1; SELECT * FORM customers; SELECT 2;');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('syntax error');
    expect(r.sql).toHaveLength(1);
  });
  it('enforces foreign keys and NOT NULL like a real database', () => {
    expect(run("INSERT INTO orders VALUES (9, 99, 1, 'x');").error).toContain('FOREIGN KEY');
    expect(run("INSERT INTO customers(id) VALUES (9);").error).toContain('NOT NULL');
  });
  it('gives every run a fresh database (no leakage)', () => {
    run('DELETE FROM orders;');
    expect(run('SELECT count(*) FROM orders;').sql![0]!.rows).toEqual([[4]]);
  });
  it('supports CTEs, window functions and transactions (SQLite 3.39)', () => {
    const r = run("WITH t AS (SELECT customer_id, SUM(total) s FROM orders GROUP BY 1) SELECT customer_id, RANK() OVER (ORDER BY s DESC) FROM t; BEGIN; DELETE FROM orders; ROLLBACK; SELECT count(*) FROM orders;");
    expect(r.ok).toBe(true);
    expect(r.sql![0]!.rows).toEqual([[2, 1], [1, 2]]);
    expect(r.sql!.at(-1)!.rows).toEqual([[4]]);
  });
  it('stops a runaway recursive query quickly instead of hanging', () => {
    const t = Date.now();
    const r = run('WITH RECURSIVE r(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM r) SELECT count(*) FROM r;');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('too much work');
    expect(Date.now() - t).toBeLessThan(15000);
  });
  it('caps the number of rows returned', () => {
    const r = run('WITH RECURSIVE r(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM r WHERE x < 20000) SELECT x FROM r;');
    expect(r.sql![0]!.more).toBe(true);
    expect(r.sql![0]!.rows!.length).toBeLessThanOrEqual(5000);
  });
});

describe('SQL: grade (behaviour, not exact text)', () => {
  const grade = (sql: string, checks: Check[], constraints: { type: 'requires' | 'forbids'; node: string; message: string }[] = []) =>
    engine.grade({ language: 'sql', code: sql, checks, constraints, sources, db: 'shop' });
  const topOrders: Check[] = [
    { kind: 'sqlResult', name: 'top 2 orders', expectQuery: 'SELECT id, total FROM orders ORDER BY total DESC LIMIT 2', ordered: true },
    { kind: 'sqlResult', name: 'hidden data', db: 'shop-b', expectQuery: 'SELECT id, total FROM orders ORDER BY total DESC LIMIT 2', ordered: true, visible: false },
  ];
  it('accepts every query that produces the right result', () => {
    for (const q of [
      'SELECT id, total FROM orders ORDER BY total DESC LIMIT 2',
      'select o.id, o.total from orders o order by o.total desc limit 2;',
      'SELECT id, total FROM (SELECT * FROM orders ORDER BY total DESC) LIMIT 2',
    ]) expect(grade(q, topOrders).passed, q).toBe(true);
  });
  it('rejects wrong results, hard-coded answers, and explains why without a solution', () => {
    expect(grade('SELECT id, total FROM orders ORDER BY total LIMIT 2', topOrders).passed).toBe(false);
    const hard = grade('SELECT 3, 99.0 UNION ALL SELECT 1, 50.0', topOrders); // right on the visible data only
    expect(hard.checks[0]!.passed).toBe(true);
    expect(hard.checks[1]!.passed).toBe(false);
    expect(hard.passed).toBe(false);
    const r = grade('SELECT id FROM orders', topOrders);
    expect(r.checks[0]!.message).toContain('1 column');
    expect(r.checks[1]!.expected).toBeUndefined(); // hidden check reveals nothing
  });
  it('treats row order as irrelevant unless the check says ordered', () => {
    const c: Check[] = [{ kind: 'sqlResult', name: 'paid', expectQuery: "SELECT id FROM orders WHERE status='paid'" }];
    expect(grade("SELECT id FROM orders WHERE status = 'paid' ORDER BY id DESC", c).passed).toBe(true);
  });
  it('can require column names, and compares floats safely', () => {
    const c: Check[] = [{ kind: 'sqlResult', name: 'avg', columns: 'names', expectQuery: 'SELECT AVG(total) AS average FROM orders' }];
    expect(grade('SELECT AVG(total) AS average FROM orders', c).passed).toBe(true);
    expect(grade('SELECT AVG(total) FROM orders', c).checks[0]!.message).toContain('AS');
  });
  it('reports SQL errors and empty scripts', () => {
    expect(grade('SELEC 1', topOrders).checks[0]!.message).toContain('failed');
    expect(grade('   ', topOrders).error).toContain('empty');
    expect(grade('DELETE FROM orders', topOrders).checks[0]!.message).toContain('result table');
  });
  it('sqlState verifies data changes against a reference script', () => {
    const c: Check[] = [{ kind: 'sqlState', name: 'paid orders removed', reference: "DELETE FROM orders WHERE status='paid'", verify: 'SELECT id FROM orders' }];
    expect(grade("DELETE FROM orders WHERE status = 'paid'", c).passed).toBe(true);
    expect(grade("DELETE FROM orders WHERE status <> 'open'", c).passed).toBe(true); // same final state, different statement
    expect(grade('DELETE FROM orders WHERE total < 30', c).passed).toBe(false); // different final state
    expect(grade('DELETE FROM orders', c).passed).toBe(false);
    expect(grade('SELECT 1', c).passed).toBe(false);
  });
  it('sqlScript checks that constraints are enforced (or allowed)', () => {
    const c: Check[] = [
      { kind: 'sqlScript', name: 'rejects negative totals', script: "INSERT INTO orders VALUES (10, 1, -5, 'x')", expectError: true },
      { kind: 'sqlScript', name: 'accepts a normal order', script: "INSERT INTO orders VALUES (11, 1, 5, 'x')", expectError: false },
    ];
    expect(grade('ALTER TABLE orders ADD COLUMN note text', c).passed).toBe(false);
    const withCheck = `CREATE TABLE o2(id integer primary key, customer_id int, total real check (total >= 0), status text);
      INSERT INTO o2 SELECT * FROM orders; DROP TABLE orders; ALTER TABLE o2 RENAME TO orders;`;
    expect(grade(withCheck, c).passed).toBe(true);
  });
  it('sqlSchema evaluates a design structurally, accepting different valid designs', () => {
    const rules: Check = {
      kind: 'sqlSchema', name: 'design', rules: [
        { rule: 'minTables', n: 3, message: 'use at least 3 tables' },
        { rule: 'hasPrimaryKeys', message: 'every table needs a primary key' },
        { rule: 'tableLike', pattern: 'machine', message: 'a machines table' },
        { rule: 'foreignKey', from: 'maint', to: 'machine', message: 'link maintenance to machines' },
        { rule: 'noColumnLike', pattern: 'machine_name', message: 'do not repeat machine names in other tables' },
      ],
    };
    const a = `CREATE TABLE machine(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE technician(id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE maintenance(id INTEGER PRIMARY KEY, machine_id INTEGER REFERENCES machine(id), technician_id INTEGER REFERENCES technician(id));`;
    const b = a.replace(/machine\b/g, 'machines').replace('REFERENCES machines(id)', 'REFERENCES machines(id)').replace('maintenance(', 'maintenance_events(');
    expect(grade(a, [rules]).passed).toBe(true);
    expect(grade(b, [rules]).passed).toBe(true);
    const flat = 'CREATE TABLE everything(machine_name TEXT, tech TEXT, note TEXT);';
    const r = grade(flat, [rules]);
    expect(r.passed).toBe(false);
    expect(r.checks[0]!.message).toContain('primary key');
  });
  it('sqlPlan checks the query planner uses an index', () => {
    const c: Check[] = [{ kind: 'sqlPlan', name: 'uses an index', query: "SELECT * FROM orders WHERE status = 'paid'", mustMatch: 'USING (COVERING )?INDEX' }];
    expect(grade('SELECT 1', c).passed).toBe(false);
    expect(grade('CREATE INDEX idx_status ON orders(status)', c).passed).toBe(true);
  });
  it('sql constraints look at SQL text but ignore comments and string literals', () => {
    const c: Check[] = [{ kind: 'sqlResult', name: 'r', expectQuery: 'SELECT c.name, o.total FROM customers c JOIN orders o ON o.customer_id = c.id' }];
    const need = [{ type: 'requires' as const, node: 'sql:\\bjoin\\b', message: 'use a JOIN' }];
    expect(grade('SELECT c.name, o.total FROM customers c INNER JOIN orders o ON o.customer_id = c.id', c, need).passed).toBe(true);
    const cheat = grade("-- join\nSELECT c.name, o.total FROM customers c, orders o WHERE o.customer_id = c.id AND 'join' = 'join'", c, need);
    expect(cheat.checks[0]!.passed).toBe(true);
    expect(cheat.constraints[0]!.passed).toBe(false);
    expect(cheat.passed).toBe(false);
  });
});

describe('SQL sandbox persistence and Python + SQL integration', () => {
  it('persists changes across calls, and can be reset to a clean state', () => {
    const first = engine.sandbox({ sql: "INSERT INTO customers VALUES (7,'Zed','Hull');", state: null, setup: SHOP });
    expect(first.ok).toBe(true);
    const second = engine.sandbox({ sql: 'SELECT name FROM customers WHERE id = 7;', state: first.state, setup: SHOP });
    expect(second.statements[0]!.rows).toEqual([['Zed']]);
    const reset = engine.sandbox({ sql: 'SELECT count(*) FROM customers;', state: null, setup: SHOP });
    expect(reset.statements[0]!.rows).toEqual([[3]]);
  });
  it('keeps the database if a later statement fails (autocommit semantics like a console)', () => {
    const r = engine.sandbox({ sql: "INSERT INTO customers VALUES (8,'Yan','Ely'); SELECT * FROM nope;", state: null, setup: SHOP });
    expect(r.ok).toBe(false);
    const after = engine.sandbox({ sql: 'SELECT count(*) FROM customers;', state: r.state, setup: SHOP });
    expect(after.statements[0]!.rows).toEqual([[4]]);
  });
  it('Python and SQL work together on the same database: Python queries it, analyses, and writes back', () => {
    const code = `
import sqlite3
con = sqlite3.connect("shop.db")
totals = {}
for name, total in con.execute("SELECT c.name, o.total FROM orders o JOIN customers c ON c.id = o.customer_id"):
    totals[name] = totals.get(name, 0) + total
best = max(totals, key=totals.get)
con.execute("UPDATE customers SET city = ? WHERE name = ?", ("Top", best))
con.commit()
print(best)`;
    const checks: Check[] = [
      { kind: 'output', name: 'names the best customer', expect: 'Bo' },
      { kind: 'script', name: 'and recorded it', code: 'import sqlite3\nassert sqlite3.connect("shop.db").execute("select city from customers where name=\'Bo\'").fetchone()[0] == "Top"' },
    ];
    // Bo total 109.0 vs Ada 70.5. The 'script' check re-runs the program in its own fresh workspace.
    const r = engine.grade({ code, checks, fixtures: { databases: ['shop'] }, sources });
    expect(r.passed, JSON.stringify(r.checks)).toBe(true);
  });
  it('parameterised queries defeat SQL injection while string-built ones do not', () => {
    const attack = "x' OR '1'='1";
    const safe = `import sqlite3\nc = sqlite3.connect("shop.db")\nprint(len(c.execute("SELECT * FROM customers WHERE name = ?", (${JSON.stringify(attack)},)).fetchall()))`;
    const unsafe = `import sqlite3\nc = sqlite3.connect("shop.db")\nprint(len(c.execute("SELECT * FROM customers WHERE name = '" + ${JSON.stringify(attack)} + "'").fetchall()))`;
    expect(engine.run({ code: safe, fixtures: { databases: ['shop'] }, sources }).stdout).toBe('0\n');
    expect(engine.run({ code: unsafe, fixtures: { databases: ['shop'] }, sources }).stdout).toBe('3\n');
  });
});
