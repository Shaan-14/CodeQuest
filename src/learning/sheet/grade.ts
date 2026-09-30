/**
 * Grades a spreadsheet by BEHAVIOUR: computes the player's workbook and compares cells, ranges, pivots and charts with what
 * the task asks for, including on hidden data (`with` replaces input cells, so a formula that only works for the visible
 * numbers fails). Formulas that merely TYPE the answer are caught by `formula` checks.
 */
import type { SheetCheck, SheetSpec, Constraint } from '../../content/schema';
import type { CheckOutcome, GradeResult } from '../runner';
import { Workbook, display, expandRange, formulasOf, isErr } from './engine';
import { runPivot } from './pivot';
import type { Cells, CellValue, Value, WorkbookData } from './types';

export function parseWorkbook(code: string): WorkbookData | null {
  try {
    const d = JSON.parse(code) as WorkbookData;
    return d && typeof d === 'object' && d.sheets && typeof d.sheets === 'object' ? d : null;
  } catch { return null; }
}

const sameValue = (actual: Value, expect: CellValue | null, approx?: number): boolean => {
  if (isErr(actual)) return false;
  if (expect === null) return actual === null || actual === '';
  if (typeof expect === 'number') return typeof actual === 'number' && Math.abs(actual - expect) <= (approx ?? 1e-9);
  if (typeof expect === 'string') return typeof actual === 'string' && actual.trim() === expect.trim(); // labels and codes are graded exactly, capitals included
  return actual === expect;
};

/** The player's workbook with hidden-data overrides applied on top. */
function withOverrides(data: WorkbookData, over?: Record<string, CellValue>, sheetDefault?: string): WorkbookData {
  if (!over) return data;
  const sheets: Record<string, Cells> = {};
  for (const [k, v] of Object.entries(data.sheets)) sheets[k] = { ...v };
  for (const [ref, val] of Object.entries(over)) {
    const [sheet, cell] = ref.includes('!') ? ref.split('!') as [string, string] : [sheetDefault ?? data.active ?? Object.keys(data.sheets)[0]!, ref];
    (sheets[sheet] ??= {})[cell.toUpperCase()] = val;
  }
  return { ...data, sheets };
}

/** Locked cells (everything outside `editable`) must still hold what the task gave the player: the data is not theirs to change. */
function lockedCellChanged(data: WorkbookData, spec: SheetSpec): string | null {
  if (!spec.editable) return null;
  const free = new Set(spec.editable.flatMap((r) => { const [sh, ref] = r.includes('!') ? r.split('!') as [string, string] : [Object.keys(spec.start.sheets)[0]!, r]; return (expandRange(ref) ?? []).flat().map((a) => `${sh}!${a}`); }));
  for (const [sheet, cells] of Object.entries(spec.start.sheets)) for (const [addr, v] of Object.entries(cells)) if (!free.has(`${sheet}!${addr}`) && data.sheets[sheet]?.[addr] !== v) return `${addr} is part of the data and cannot be changed.`;
  return null;
}

export function gradeSheet(code: string, checks: SheetCheck[], constraints: Constraint[] = [], spec?: SheetSpec): GradeResult {
  const data = parseWorkbook(code);
  if (!data) return { passed: false, error: 'The workbook could not be read.', timedOut: false, checks: [], constraints: [] };
  const tamper = spec ? lockedCellChanged(data, spec) : null;
  if (tamper) return { passed: false, error: '', timedOut: false, checks: [{ name: 'The data is untouched', visible: true, passed: false, message: tamper }], constraints: [] };
  const outcomes: CheckOutcome[] = [];
  const formulaText = formulasOf(data).map((f) => f.text).join('\n');
  for (const c of checks) {
    const base = { name: c.name, visible: c.visible !== false };
    const fail = (message: string, expected?: string, actual?: string): CheckOutcome => ({ ...base, passed: false, message: c.feedback ?? message, expected, actual });
    const ok = (): CheckOutcome => ({ ...base, passed: true, message: '' });
    try {
      const wbData = withOverrides(data, 'with' in c ? c.with : undefined);
      const wb = new Workbook(wbData);
      const sheet = ('sheet' in c && c.sheet) || wb.activeSheet;
      switch (c.kind) {
        case 'cell': {
          const v = wb.value(sheet, c.cell);
          outcomes.push(sameValue(v, c.expect, c.approx) ? ok() : fail(isErr(v) ? `${c.cell} shows ${v.code}.` : `${c.cell} does not hold the expected result.`, String(c.expect), display(v)));
          break;
        }
        case 'cells': {
          const bad = Object.entries(c.expect).filter(([cell, e]) => !sameValue(wb.value(sheet, cell), e, c.approx));
          outcomes.push(bad.length === 0 ? ok() : fail(`${bad.length} of ${Object.keys(c.expect).length} cells are not right, for example ${bad[0]![0]}.`, String(bad[0]![1]), display(wb.value(sheet, bad[0]![0]))));
          break;
        }
        case 'formula': {
          const raw = wbData.sheets[sheet]?.[c.cell.toUpperCase()];
          const isF = typeof raw === 'string' && raw.startsWith('=');
          if (!isF) { outcomes.push(fail(`${c.cell} should be a formula that computes the answer, not a typed number.`)); break; }
          if (c.matches && !new RegExp(c.matches, 'i').test(raw as string)) { outcomes.push(fail(c.hint ?? `${c.cell} should use ${c.matches.replace(/\|/g, ' or ')}.`)); break; }
          outcomes.push(ok());
          break;
        }
        case 'noErrors': {
          const snap = wb.snapshot();
          const bad = Object.entries(snap[sheet] ?? {}).filter(([, v]) => isErr(v));
          outcomes.push(bad.length === 0 ? ok() : fail(`${bad[0]![0]} shows ${(bad[0]![1] as { code: string }).code}.`));
          break;
        }
        case 'pivot': {
          const spec = wbData.pivots?.[c.index ?? 0];
          if (!spec) { outcomes.push(fail('There is no pivot table yet.')); break; }
          const res = runPivot(wb, spec);
          if (typeof res === 'string') { outcomes.push(fail(res)); break; }
          const same = res.rows.length === c.expect.length && res.rows.every((r, i) => r.length === c.expect[i]!.length && r.every((v, j) => (typeof v === 'number' && typeof c.expect[i]![j] === 'number' ? Math.abs(v - (c.expect[i]![j] as number)) < 1e-6 : String(v).toLowerCase() === String(c.expect[i]![j]).toLowerCase())));
          outcomes.push(same ? ok() : fail('The pivot table does not summarise the data the way the task asks.', JSON.stringify(c.expect), JSON.stringify(res.rows)));
          break;
        }
        case 'chart': {
          const ch = wbData.charts?.[c.index ?? 0];
          if (!ch) { outcomes.push(fail('There is no chart yet.')); break; }
          const norm = (r: string) => r.replace(/\$/g, '').replace(/^'?([^'!]+)'?!/, '$1!').toUpperCase();
          const inSheet = (r: string) => norm(r.includes('!') ? r : `${sheet}!${r}`);
          const types = c.types ?? (c.type ? [c.type] : undefined);
          if (types && !types.includes(ch.type)) { outcomes.push(fail(c.hint ?? `A ${ch.type} chart is not the right kind of chart for this question.`)); break; }
          if (c.categories && inSheet(ch.categories) !== inSheet(c.categories)) { outcomes.push(fail('The chart labels come from the wrong range.')); break; }
          if (c.series && (ch.series.length !== c.series.length || !c.series.every((s, i) => inSheet(ch.series[i]!) === inSheet(s)))) { outcomes.push(fail('The chart plots the wrong data range.')); break; }
          outcomes.push(ok());
          break;
        }
      }
    } catch (e) {
      outcomes.push({ ...base, passed: false, message: `This check could not run: ${String(e)}` });
    }
  }
  const cons = constraints.map((k) => {
    const m = /^sheet:(.*)$/.exec(k.node);
    const has = m ? new RegExp(m[1]!, 'i').test(formulaText) : true;
    return { message: k.message, passed: k.type === 'requires' ? has : !has };
  });
  return { passed: outcomes.every((o) => o.passed) && cons.every((k) => k.passed), error: '', timedOut: false, checks: outcomes, constraints: cons };
}
