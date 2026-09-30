/** Validates the spreadsheet boss problems with the spreadsheet engine: starter fails, reference workbooks pass, wrong attempts fail. */
import { describe, expect, it } from 'vitest';
import { sheetBossChallenges } from './sheets';
import { gradeSheet } from '../../learning/sheet/grade';
import type { WorkbookData } from '../../learning/sheet/types';
import { bossSheetSolutions } from './solutions.sheet.testdata';

const apply = (start: WorkbookData, cells: Record<string, string | number>): WorkbookData => {
  const active = start.active ?? Object.keys(start.sheets)[0]!;
  const sheets = Object.fromEntries(Object.entries(start.sheets).map(([k, v]) => [k, { ...v }]));
  for (const [ref, v] of Object.entries(cells)) { const [sh, a] = ref.includes('!') ? ref.split('!') as [string, string] : [active, ref]; (sheets[sh] ??= {})[a] = typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v; }
  return { ...start, sheets };
};
const grade = (id: string, cells: Record<string, string | number> | null) => {
  const c = sheetBossChallenges.find((x) => x.id === id)!;
  return gradeSheet(JSON.stringify(cells ? apply(c.sheet!.start, cells) : c.sheet!.start), c.checks as never, c.constraints, c.sheet);
};

describe('spreadsheet boss problems', () => {
  it('follow the boss rules and have solutions', () => {
    for (const c of sheetBossChallenges) {
      expect(c.mode, c.id).toBe('independent');
      expect(c.hints, c.id).toEqual([]);
      expect(c.starterCode, c.id).toBe('');
      expect(c.checks.every((k) => k.visible === false), `${c.id}: every check hidden`).toBe(true);
      expect(bossSheetSolutions[c.id], c.id).toBeDefined();
      expect(c.prompt, `${c.id} names no spreadsheet functions`).not.toMatch(/\b(VLOOKUP|SUMIFS|COUNTIFS?|XLOOKUP|IFERROR|ROUNDUP|SUMPRODUCT)\b/i);
    }
    for (const id of Object.keys(bossSheetSolutions)) expect(sheetBossChallenges.some((c) => c.id === id), id).toBe(true);
  });
  for (const c of sheetBossChallenges) {
    describe(c.id, () => {
      it('the starting workbook does not already pass', () => expect(grade(c.id, null).passed).toBe(false));
      bossSheetSolutions[c.id]?.valid.forEach((s, i) => it(`valid solution #${i + 1} passes`, () => { const r = grade(c.id, s.cells); expect(r.passed, JSON.stringify([...r.checks, ...r.constraints].filter((k) => !k.passed))).toBe(true); }));
      bossSheetSolutions[c.id]?.wrong.forEach((s, i) => it(`wrong attempt #${i + 1} fails`, () => expect(grade(c.id, s.cells).passed).toBe(false)));
    });
  }
});
