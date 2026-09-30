/** Validates every spreadsheet challenge with the spreadsheet engine: starter fails, reference edits pass, wrong attempts fail, locked data cannot be changed. */
import { describe, expect, it } from 'vitest';
import { challenges, lessons } from '../index';
import { gradeSheet } from '../../learning/sheet/grade';
import { Workbook } from '../../learning/sheet/engine';
import type { WorkbookData } from '../../learning/sheet/types';
import { sheetSolutions, type SheetSolution } from './solutions.testdata';

const sheetChallenges = challenges.filter((c) => c.language === 'sheet');
const apply = (start: WorkbookData, sol: SheetSolution): WorkbookData => {
  const active = start.active ?? Object.keys(start.sheets)[0]!;
  const sheets = Object.fromEntries(Object.entries(start.sheets).map(([k, v]) => [k, { ...v }]));
  for (const [ref, v] of Object.entries(sol.cells ?? {})) { const [sh, a] = ref.includes('!') ? ref.split('!') as [string, string] : [active, ref]; (sheets[sh] ??= {})[a] = v; }
  return { ...start, sheets, pivots: sol.pivot ? [sol.pivot] : start.pivots, charts: sol.chart ? [sol.chart] : start.charts };
};
const grade = (id: string, sol: SheetSolution | null) => {
  const c = sheetChallenges.find((x) => x.id === id)!;
  const data = sol ? apply(c.sheet!.start, sol) : c.sheet!.start;
  return gradeSheet(JSON.stringify(data), c.checks as never, c.constraints, c.sheet);
};

describe('Spreadsheet curriculum', () => {
  it('has a solution entry for every spreadsheet challenge and no orphans', () => {
    for (const c of sheetChallenges) { expect(sheetSolutions[c.id], c.id).toBeDefined(); expect(c.sheet, c.id).toBeDefined(); expect(c.starterCode, c.id).toBe(''); }
    for (const id of Object.keys(sheetSolutions)) expect(sheetChallenges.some((c) => c.id === id), id).toBe(true);
  });
  for (const c of sheetChallenges) {
    describe(c.id, () => {
      it('the starting workbook does not already pass', () => { expect(grade(c.id, null).passed).toBe(false); });
      it('starting data evaluates without errors (a check can never pass on a broken sheet)', () => {
        const wb = new Workbook(c.sheet!.start);
        for (const [sheet, snap] of Object.entries(wb.snapshot())) for (const [a, v] of Object.entries(snap)) expect(typeof v === 'object' && v !== null ? (v as { code: string }).code : '', `${sheet}!${a}`).toBe('');
      });
      sheetSolutions[c.id]?.valid.forEach((sol, i) => it(`valid solution #${i + 1} passes`, () => { const r = grade(c.id, sol); expect(r.passed, JSON.stringify([...r.checks, ...r.constraints].filter((k) => !k.passed))).toBe(true); }));
      sheetSolutions[c.id]?.wrong.forEach((sol, i) => it(`wrong attempt #${i + 1} fails`, () => { expect(grade(c.id, sol).passed).toBe(false); }));
      if (c.sheet?.editable) it('changing locked data is refused', () => {
        const first = Object.entries(c.sheet!.start.sheets[Object.keys(c.sheet!.start.sheets)[0]!]!).find(([a]) => !(c.sheet!.editable ?? []).some((r) => r.includes(a)));
        if (first) expect(grade(c.id, { cells: { [first[0]]: 999999 } }).passed).toBe(false);
      });
    });
  }
  it('every spreadsheet demo calculates without errors', () => {
    for (const l of lessons) for (const s of l.steps) if (s.kind === 'demo' && s.language === 'sheet') {
      const snap = new Workbook(s.sheet!).snapshot();
      for (const [sheet, cells] of Object.entries(snap)) for (const [a, v] of Object.entries(cells)) expect(typeof v === 'object' && v !== null ? 'error' : '', `${l.id} ${sheet}!${a}`).toBe('');
    }
  });
});
