import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import { reference, searchReference } from './reference';
import { getDatabase, sourcesFor } from './databases';
import { createPythonEngine, type PythonEngine } from '../learning/python/pythonEngine';

let engine: PythonEngine;
beforeAll(async () => {
  engine = createPythonEngine((await loadPyodide()) as never);
}, 60_000);

describe('Field Manual', () => {
  it('has unique ids and complete entries', () => {
    expect(new Set(reference.map((e) => e.id)).size).toBe(reference.length);
    for (const e of reference) for (const f of [e.title, e.signature, e.summary, e.details, e.example]) expect(f.length, e.id).toBeGreaterThanOrEqual(3);
  });
  it('every Python example runs in real Python without error', () => {
    for (const e of reference.filter((x) => x.language === 'python')) {
      const r = engine.run({ code: e.example });
      expect(r.error, `${e.id}: ${r.error}`).toBe('');
    }
  });
  it('every SQL example runs on its database in real SQLite', () => {
    for (const e of reference.filter((x) => x.language === 'sql')) {
      expect(getDatabase(e.db!), e.id).toBeDefined();
      const r = engine.run({ language: 'sql', code: e.example, db: e.db, sources: sourcesFor([e.db!]) });
      expect(r.error, `${e.id}: ${r.error}`).toBe('');
    }
  });
  it('is searchable by what a learner would type, not just the official name', () => {
    expect(searchReference('median').map((e) => e.id)).toContain('py-statistics-median');
    expect(searchReference('most common').map((e) => e.id)).toContain('py-collections-counter');
    expect(searchReference('days between').map((e) => e.id)).toContain('py-datetime-date');
    expect(searchReference('weekday').map((e) => e.id)).toContain('py-datetime-strftime');
    expect(searchReference('running total', 'sql').map((e) => e.id)).toEqual(['sql-window']);
    expect(searchReference('zzzz-nothing')).toEqual([]);
  });
  it('filters by language', () => {
    expect(searchReference('', 'sql').every((e) => e.language === 'sql')).toBe(true);
  });
});
