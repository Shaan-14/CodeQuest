import { chance, day, insert, int, money, names, pick, rng } from './generate';

/**
 * "Bytehaven Works": a small factory. Departments, employees (with a manager hierarchy), machines,
 * production runs and maintenance events. Contains realistic mess: NULL costs, NULL defect counts,
 * employees with no manager, and a few machines with abnormal downtime (different machines per seed).
 */
export const WORKS_SCHEMA = `
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  role TEXT NOT NULL,
  hourly_rate REAL NOT NULL,
  hired_on TEXT NOT NULL,
  manager_id INTEGER REFERENCES employees(id)
);
CREATE TABLE machines (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  purchase_cost REAL NOT NULL,
  installed_on TEXT NOT NULL
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  unit_cost REAL NOT NULL
);
CREATE TABLE production_runs (
  id INTEGER PRIMARY KEY,
  machine_id INTEGER NOT NULL REFERENCES machines(id),
  operator_id INTEGER NOT NULL REFERENCES employees(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  run_date TEXT NOT NULL,
  units_made INTEGER NOT NULL,
  units_defective INTEGER,
  hours REAL NOT NULL
);
CREATE TABLE maintenance_events (
  id INTEGER PRIMARY KEY,
  machine_id INTEGER NOT NULL REFERENCES machines(id),
  technician_id INTEGER NOT NULL REFERENCES employees(id),
  event_date TEXT NOT NULL,
  kind TEXT NOT NULL,
  downtime_hours REAL NOT NULL,
  cost REAL
);
`;

const DEPARTMENTS = ['Assembly', 'Machining', 'Packaging', 'Quality'];
const MACHINE_TYPES = ['CNC mill', 'Lathe', 'Press', 'Welder', 'Packer', 'Sorter'];
const PRODUCTS = ['Gear', 'Bracket', 'Valve', 'Housing', 'Shaft', 'Flange', 'Bearing', 'Coupling'];

export function worksSql(seed: number): string {
  const r = rng(seed);
  let sql = WORKS_SCHEMA;

  sql += insert('departments', ['id', 'name'], DEPARTMENTS.map((n, i) => [i + 1, n]));

  // 4 heads (no manager), 4 supervisors reporting to heads, then technicians and operators.
  const people = names(r, 24);
  const emp: (string | number | null)[][] = [];
  for (let i = 0; i < 24; i++) {
    const id = i + 1;
    const dept = (i % 4) + 1;
    const role = i < 4 ? 'supervisor' : i < 8 ? 'supervisor' : i < 14 ? 'technician' : 'operator';
    const manager = i < 4 ? null : i < 8 ? dept : 4 + dept;
    emp.push([id, people[i]!, dept, role, money(r, role === 'technician' ? 24 : role === 'operator' ? 16 : 32, role === 'technician' ? 38 : role === 'operator' ? 26 : 48), day(int(r, 0, 600)), manager]);
  }
  sql += insert('employees', ['id', 'name', 'department_id', 'role', 'hourly_rate', 'hired_on', 'manager_id'], emp);
  const operators = emp.filter((e) => e[3] === 'operator').map((e) => e[0] as number);
  const technicians = emp.filter((e) => e[3] === 'technician').map((e) => e[0] as number);

  const machines: (string | number)[][] = [];
  for (let i = 0; i < 10; i++) {
    const type = MACHINE_TYPES[i % MACHINE_TYPES.length]!;
    machines.push([i + 1, `${type} ${String.fromCharCode(65 + (i % 3))}${i + 1}`, type, (i % 4) + 1, money(r, 12000, 95000), day(int(r, 0, 300))]);
  }
  sql += insert('machines', ['id', 'name', 'machine_type', 'department_id', 'purchase_cost', 'installed_on'], machines);

  sql += insert('products', ['id', 'name', 'unit_cost'], PRODUCTS.map((n, i) => [i + 1, n, money(r, 2, 40)]));

  const runs: (string | number | null)[][] = [];
  for (let i = 0; i < 120; i++) {
    const made = int(r, 80, 600);
    runs.push([i + 1, int(r, 1, 10), pick(r, operators), int(r, 1, PRODUCTS.length), day(int(r, 400, 700)), made, chance(r, 0.08) ? null : int(r, 0, Math.floor(made * 0.08)), money(r, 2, 9)]);
  }
  sql += insert('production_runs', ['id', 'machine_id', 'operator_id', 'product_id', 'run_date', 'units_made', 'units_defective', 'hours'], runs);

  // Two "problem machines" get repeated, long repairs. Which ones depends on the seed.
  const problem = [int(r, 1, 10), int(r, 1, 10)];
  const events: (string | number | null)[][] = [];
  for (let i = 0; i < 50; i++) {
    const machine = i < 12 ? problem[i % 2]! : int(r, 1, 10);
    const bad = problem.includes(machine);
    const kind = bad && chance(r, 0.7) ? 'repair' : pick(r, ['routine', 'routine', 'inspection', 'repair']);
    const downtime = kind === 'repair' ? (bad ? money(r, 14, 40) : money(r, 1, 6)) : money(r, 0.5, 3);
    events.push([i + 1, machine, pick(r, technicians), day(int(r, 400, 700)), kind, downtime, chance(r, 0.15) ? null : money(r, 80, kind === 'repair' ? 2600 : 400)]);
  }
  sql += insert('maintenance_events', ['id', 'machine_id', 'technician_id', 'event_date', 'kind', 'downtime_hours', 'cost'], events);
  return sql;
}
