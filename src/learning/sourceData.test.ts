import { describe, expect, it } from 'vitest';
import { databases, getDatabase } from '../content/databases';
import { apiViews, isHiddenDatabase, parseCsv, relations, sampleScript, viewFile, visibleDatabases } from './sourceData';

describe('source data', () => {
  it('never offers a hidden twin', () => {
    for (const d of databases) expect(isHiddenDatabase(d.id), d.id).toBe(/-(b|boss|edge)$/.test(d.id));
    expect(visibleDatabases({ databases: ['works', 'works-b:works', 'market-edge'] }, 'works-boss')).toEqual(['works']);
    expect(visibleDatabases(undefined, 'blank')).toEqual([]);
  });
  it('reads relationships from the column notes of the real schema', () => {
    const r = relations(getDatabase('works')!);
    expect(r).toContainEqual({ from: 'employees', column: 'department_id', to: 'departments' });
    expect(r).toContainEqual({ from: 'employees', column: 'manager_id', to: 'employees' });
    expect(r).toContainEqual({ from: 'production_runs', column: 'machine_id', to: 'machines' });
    for (const d of databases) for (const x of relations(d)) expect(d.tables.some((t) => t.name === x.to), `${d.id}: ${x.from}.${x.column}`).toBe(true);
  });
  it('asks for rows and a count of every table', () => {
    const s = sampleScript(getDatabase('league')!.tables, 3);
    expect((s.match(/SELECT \* FROM/g) ?? []).length).toBe(getDatabase('league')!.tables.length);
    expect(s).toContain('SELECT COUNT(*) FROM "teams"');
  });
  it('parses CSV with quotes and shows files by kind', () => {
    expect(parseCsv('a,b\n1,"x, y"\n2,"say ""hi"""\n')).toEqual({ header: ['a', 'b'], rows: [['1', 'x, y'], ['2', 'say "hi"']] });
    const v = viewFile('readings.csv', 'id,v\n1,2\n2,3\n3,4\n', 2); expect(v.kind === 'csv' && v.total).toBe(3); expect(v.kind === 'csv' && v.table.rows.length).toBe(2);
    expect(viewFile('c.json', '{"a":[1,2]}').kind).toBe('json');
    expect(viewFile('bad.json', '{oops').kind).toBe('text');
    expect(viewFile('log.txt', Array.from({ length: 40 }, (_, i) => `line ${i}`).join('\n'))).toMatchObject({ kind: 'text', truncated: true });
  });
  it('the API view is the visible data set', () => {
    const v = apiViews(); expect(v.map((x) => x.name)).toContain('machines');
    expect(v.find((x) => x.name === 'machines')!.table.rows.length).toBe(5);
  });
});
