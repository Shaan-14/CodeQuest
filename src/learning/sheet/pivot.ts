import { Workbook, isErr, display } from './engine';
import type { PivotSpec, Value } from './types';

export interface PivotResult {
  header: string[];
  rows: (string | number)[][];
  /** One grand-total value per value column. */
  totals: number[];
}

/**
 * Runs a pivot table over a workbook range. Groups by `rows` (outermost first, sorted), aggregates each value field,
 * keeps only rows matching `filters`. Text is grouped case-insensitively like a spreadsheet does.
 */
export function runPivot(wb: Workbook, spec: PivotSpec): PivotResult | string {
  const m = wb.rangeValues(spec.source);
  if (isErr(m)) return `The pivot source ${spec.source} is not a valid range.`;
  const head = (m[0] ?? []).map((v) => display(v));
  const idx = (f: string) => head.findIndex((h) => h.toLowerCase() === f.toLowerCase());
  for (const f of [...spec.rows, ...spec.values.map((v) => v.field), ...(spec.filters ?? []).map((x) => x.field)]) if (idx(f) < 0) return `The field “${f}” is not a column of the source.`;
  const body = m.slice(1).filter((r) => r.some((v) => v !== null && v !== ''));
  const kept = body.filter((r) => (spec.filters ?? []).every((f) => { const v = r[idx(f.field)] ?? null; return typeof f.equals === 'string' ? display(v).toLowerCase() === f.equals.toLowerCase() : v === f.equals; }));
  const groups = new Map<string, { key: Value[]; rows: Value[][] }>();
  for (const r of kept) {
    const key = spec.rows.map((f) => r[idx(f)] ?? null);
    const id = key.map((k) => display(k).toLowerCase()).join('\u0001');
    if (!groups.has(id)) groups.set(id, { key, rows: [] });
    groups.get(id)!.rows.push(r);
  }
  const agg = (rows: Value[][], v: PivotSpec['values'][number]): number => {
    const col = rows.map((r) => r[idx(v.field)] ?? null);
    const nums = col.filter((x): x is number => typeof x === 'number');
    switch (v.agg) {
      case 'sum': return nums.reduce((a, b) => a + b, 0);
      case 'count': return col.filter((x) => x !== null && x !== '').length;
      case 'average': return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      case 'min': return nums.length ? Math.min(...nums) : 0;
      case 'max': return nums.length ? Math.max(...nums) : 0;
    }
  };
  const sorted = [...groups.values()].sort((a, b) => { for (let i = 0; i < a.key.length; i++) { const x = a.key[i]!; const y = b.key[i]!; const c = typeof x === 'number' && typeof y === 'number' ? x - y : display(x).localeCompare(display(y), undefined, { sensitivity: 'base' }); if (c) return c; } return 0; });
  return {
    header: [...spec.rows, ...spec.values.map((v) => `${v.agg} of ${v.field}`)],
    rows: sorted.map((g) => [...g.key.map((k) => (typeof k === 'number' ? k : display(k))), ...spec.values.map((v) => agg(g.rows, v))]),
    totals: spec.values.map((v) => agg(kept, v)),
  };
}
