import type { CellValue, WorkbookData } from '../../learning/sheet/types';
import type { SheetCheck } from '../schema';
import { numToCol } from '../../learning/sheet/engine';

/** Lays a 2-D table of values onto cells starting at `origin` (e.g. `A1`). Strings starting with "=" are formulas; `null` leaves a cell empty. */
export function grid(origin: string, rows: (CellValue | null)[][]): Record<string, CellValue> {
  const m = /^([A-Z]+)(\d+)$/.exec(origin)!;
  const col0 = [...m[1]!].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
  const row0 = Number(m[2]);
  const out: Record<string, CellValue> = {};
  rows.forEach((r, i) => r.forEach((v, j) => { if (v !== null) out[`${numToCol(col0 + j)}${row0 + i}`] = v; }));
  return out;
}

export const book = (cells: Record<string, CellValue>, extraSheets: Record<string, Record<string, CellValue>> = {}): WorkbookData => ({ sheets: { Sheet1: cells, ...extraSheets } });

/** A cell must compute `expect`; `with` replaces input cells (hidden data). */
export const cell = (name: string, at: string, expect: CellValue | null, opts: Partial<Extract<SheetCheck, { kind: 'cell' }>> = {}): SheetCheck => ({ kind: 'cell', name, cell: at, expect, ...opts });
export const cells = (name: string, expect: Record<string, CellValue | null>, opts: Partial<Extract<SheetCheck, { kind: 'cells' }>> = {}): SheetCheck => ({ kind: 'cells', name, expect, ...opts });
export const isFormula = (name: string, at: string, matches?: string, opts: Partial<Extract<SheetCheck, { kind: 'formula' }>> = {}): SheetCheck => ({ kind: 'formula', name, cell: at, matches, ...opts });
