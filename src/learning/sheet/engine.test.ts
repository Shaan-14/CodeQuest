import { describe, expect, it } from 'vitest';
import { Workbook, parseAddr, expandRange, SUPPORTED_FUNCTIONS } from './engine';
import { runPivot } from './pivot';
import { gradeSheet } from './grade';
import type { Cells, WorkbookData } from './types';

const wb = (cells: Cells, extra: Record<string, Cells> = {}) => new Workbook({ sheets: { Sheet1: cells, ...extra } });
const v = (cells: Cells, cell: string, extra?: Record<string, Cells>) => wb(cells, extra).value('Sheet1', cell);
const s = (x: unknown) => (x && typeof x === 'object' && 'code' in x ? (x as { code: string }).code : x);

describe('addresses', () => {
  it('parses and expands', () => {
    expect(parseAddr('$B$12')).toEqual({ col: 2, row: 12 });
    expect(parseAddr('AA3')).toEqual({ col: 27, row: 3 });
    expect(expandRange('A1:B2')).toEqual([['A1', 'B1'], ['A2', 'B2']]);
    expect(expandRange('B2:A1')).toEqual([['A1', 'B1'], ['A2', 'B2']]);
  });
});

describe('arithmetic and references', () => {
  it('follows Excel precedence and coercions', () => {
    expect(v({ A1: '=2+3*4' }, 'A1')).toBe(14);
    expect(v({ A1: '=-2^2' }, 'A1')).toBe(4); // unary minus binds tighter than ^, like Excel
    expect(v({ A1: '=(2+3)*4' }, 'A1')).toBe(20);
    expect(v({ A1: '=10/4' }, 'A1')).toBe(2.5);
    expect(v({ A1: '=50%' }, 'A1')).toBe(0.5);
    expect(v({ A1: '=1/0' }, 'A1')).toMatchObject({ code: '#DIV/0!' });
    expect(v({ A1: '="a"&"b"&1' }, 'A1')).toBe('ab1');
    expect(v({ A1: '="3"+4' }, 'A1')).toBe(7);
    expect(s(v({ A1: '="x"+4' }, 'A1'))).toBe('#VALUE!');
    expect(v({ A1: '=2=2' }, 'A1')).toBe(true);
    expect(v({ A1: '="a"<"B"' }, 'A1')).toBe(true);
  });
  it('resolves references, relative chains, other sheets and detects cycles', () => {
    expect(v({ A1: 2, B1: '=A1*3', C1: '=B1+A1' }, 'C1')).toBe(8);
    expect(v({ A1: '=Data!B2*2' }, 'A1', { Data: { B2: 21 } })).toBe(42);
    expect(v({ A1: "='My Data'!B2" }, 'A1', { 'My Data': { B2: 5 } })).toBe(5);
    expect(s(v({ A1: '=B1', B1: '=A1' }, 'A1'))).toBe('#CIRCULAR!');
    expect(s(v({ A1: '=Nope!A1' }, 'A1'))).toBe('#REF!');
    expect(s(v({ A1: '=FOO(1)' }, 'A1'))).toBe('#NAME?');
  });
});

describe('aggregate and maths functions', () => {
  const data: Cells = { A1: 4, A2: 8, A3: 15, A4: 16, A5: 23, A6: 42, B1: 'x', B2: true };
  it('SUM AVERAGE MIN MAX COUNT COUNTA MEDIAN MODE', () => {
    expect(v(data, 'C1')).toBeNull();
    expect(v({ ...data, C1: '=SUM(A1:A6)' }, 'C1')).toBe(108);
    expect(v({ ...data, C1: '=AVERAGE(A1:A6)' }, 'C1')).toBe(18);
    expect(v({ ...data, C1: '=MIN(A1:A6)' }, 'C1')).toBe(4);
    expect(v({ ...data, C1: '=MAX(A1:A6)' }, 'C1')).toBe(42);
    expect(v({ ...data, C1: '=COUNT(A1:B2)' }, 'C1')).toBe(2); // text and booleans in ranges are ignored
    expect(v({ ...data, C1: '=COUNTA(A1:B2)' }, 'C1')).toBe(4);
    expect(v({ ...data, C1: '=MEDIAN(A1:A6)' }, 'C1')).toBe(15.5);
    expect(v({ A1: 1, A2: 2, A3: 2, A4: 3, C1: '=MODE(A1:A4)' }, 'C1')).toBe(2);
    expect(v({ C1: '=SUM(1,2,"3")' }, 'C1')).toBe(6);
  });
  it('STDEV and VAR use sample and population formulas', () => {
    const d: Cells = { A1: 2, A2: 4, A3: 4, A4: 4, A5: 5, A6: 5, A7: 7, A8: 9 };
    expect(v({ ...d, C1: '=STDEV.P(A1:A8)' }, 'C1')).toBeCloseTo(2, 9);
    expect(v({ ...d, C1: '=STDEV(A1:A8)' }, 'C1')).toBeCloseTo(2.13809, 4);
    expect(v({ ...d, C1: '=VAR.P(A1:A8)' }, 'C1')).toBeCloseTo(4, 9);
    expect(v({ ...d, C1: '=VAR(A1:A8)' }, 'C1')).toBeCloseTo(4.571428, 5);
  });
  it('ROUND family, INT, MOD, LARGE, SMALL, RANK, CORREL, SUMPRODUCT', () => {
    expect(v({ A1: '=ROUND(2.5,0)' }, 'A1')).toBe(3);
    expect(v({ A1: '=ROUND(-2.5,0)' }, 'A1')).toBe(-3);
    expect(v({ A1: '=ROUND(1.2345,2)' }, 'A1')).toBe(1.23);
    expect(v({ A1: '=ROUNDUP(1.21,1)' }, 'A1')).toBe(1.3);
    expect(v({ A1: '=ROUNDDOWN(1.29,1)' }, 'A1')).toBe(1.2);
    expect(v({ A1: '=INT(-1.5)' }, 'A1')).toBe(-2);
    expect(v({ A1: '=MOD(-7,3)' }, 'A1')).toBe(2);
    const d: Cells = { A1: 5, A2: 9, A3: 1, A4: 7 };
    expect(v({ ...d, C1: '=LARGE(A1:A4,2)' }, 'C1')).toBe(7);
    expect(v({ ...d, C1: '=SMALL(A1:A4,2)' }, 'C1')).toBe(5);
    expect(v({ ...d, C1: '=RANK(5,A1:A4)' }, 'C1')).toBe(3);
    expect(v({ A1: 1, A2: 2, A3: 3, B1: 2, B2: 4, B3: 6, C1: '=CORREL(A1:A3,B1:B3)' }, 'C1')).toBeCloseTo(1, 9);
    expect(v({ A1: 1, A2: 2, B1: 3, B2: 4, C1: '=SUMPRODUCT(A1:A2,B1:B2)' }, 'C1')).toBe(11);
  });
});

describe('logic and text', () => {
  it('IF, nested IF, AND/OR, IFERROR', () => {
    expect(v({ A1: 75, B1: '=IF(A1>=60,"pass","fail")' }, 'B1')).toBe('pass');
    expect(v({ A1: 55, B1: '=IF(A1>=90,"A",IF(A1>=60,"B","C"))' }, 'B1')).toBe('C');
    expect(v({ A1: 5, B1: '=AND(A1>1,A1<10)', C1: '=OR(A1<1,A1>10)' }, 'B1')).toBe(true);
    expect(v({ A1: 5, B1: '=AND(A1>1,A1<10)', C1: '=OR(A1<1,A1>10)' }, 'C1')).toBe(false);
    expect(v({ A1: '=IFERROR(1/0,"none")' }, 'A1')).toBe('none');
    expect(v({ A1: '=IFS(5>10,"a",5>1,"b")' }, 'A1')).toBe('b');
  });
  it('text functions', () => {
    const c: Cells = { A1: '  Hello   World  ' };
    expect(v({ ...c, B1: '=TRIM(A1)' }, 'B1')).toBe('Hello World');
    expect(v({ ...c, B1: '=LEN(TRIM(A1))' }, 'B1')).toBe(11);
    expect(v({ A1: 'abcdef', B1: '=LEFT(A1,2)&RIGHT(A1,2)&MID(A1,3,2)' }, 'B1')).toBe('abefcd');
    expect(v({ A1: 'ada lovelace', B1: '=PROPER(A1)' }, 'B1')).toBe('Ada Lovelace');
    expect(v({ A1: 'a-b-c', B1: '=SUBSTITUTE(A1,"-","/")' }, 'B1')).toBe('a/b/c');
    expect(v({ A1: 'a.b@x.com', B1: '=FIND("@",A1)' }, 'B1')).toBe(4);
    expect(v({ A1: 'x', B1: 'y', C1: '=TEXTJOIN(", ",TRUE,A1:B1)' }, 'C1')).toBe('x, y');
    expect(v({ A1: 0.256, B1: '=TEXT(A1,"0.0%")' }, 'B1')).toBe('25.6%');
    expect(v({ A1: 1234.5, B1: '=TEXT(A1,"#,##0.00")' }, 'B1')).toBe('1,234.50');
    expect(v({ A1: '=TEXT(DATE(2024,3,9),"yyyy-mm-dd")' }, 'A1')).toBe('2024-03-09');
    expect(v({ A1: '=YEAR(DATE(2023,12,31))+MONTH(DATE(2023,12,31))+DAY(DATE(2023,12,31))' }, 'A1')).toBe(2023 + 12 + 31);
  });
});

describe('lookups and conditional aggregates', () => {
  const table: Cells = { A1: 'id', B1: 'name', C1: 'price', A2: 101, B2: 'Bolt', C2: 2.5, A3: 102, B3: 'Nut', C3: 0.5, A4: 103, B4: 'Gear', C4: 12 };
  it('VLOOKUP exact and approximate, INDEX/MATCH, XLOOKUP, HLOOKUP', () => {
    expect(v({ ...table, E1: '=VLOOKUP(102,A2:C4,2,FALSE)' }, 'E1')).toBe('Nut');
    expect(s(v({ ...table, E1: '=VLOOKUP(999,A2:C4,2,FALSE)' }, 'E1'))).toBe('#N/A');
    expect(v({ ...table, E1: '=IFERROR(VLOOKUP(999,A2:C4,2,FALSE),"?")' }, 'E1')).toBe('?');
    expect(v({ A1: 0, B1: 'F', A2: 60, B2: 'D', A3: 70, B3: 'C', A4: 90, B4: 'A', D1: '=VLOOKUP(85,A1:B4,2,TRUE)' }, 'D1')).toBe('C');
    expect(v({ ...table, E1: '=INDEX(C2:C4,MATCH("Gear",B2:B4,0))' }, 'E1')).toBe(12);
    expect(v({ ...table, E1: '=XLOOKUP(101,A2:A4,B2:B4,"none")' }, 'E1')).toBe('Bolt');
    expect(v({ ...table, E1: '=XLOOKUP(5,A2:A4,B2:B4,"none")' }, 'E1')).toBe('none');
    expect(v({ A1: 'a', B1: 'b', C1: 'c', A2: 1, B2: 2, C2: 3, E1: '=HLOOKUP("b",A1:C2,2,FALSE)' }, 'E1')).toBe(2);
    expect(v({ ...table, E1: '=INDEX(A2:C4,2,3)' }, 'E1')).toBe(0.5);
  });
  it('SUMIF(S), COUNTIF(S), AVERAGEIF with operators and wildcards', () => {
    const d: Cells = { A1: 'east', B1: 10, C1: 'x', A2: 'west', B2: 20, C2: 'y', A3: 'East', B3: 30, C3: 'y', A4: 'north', B4: 5, C4: 'x' };
    expect(v({ ...d, E1: '=SUMIF(A1:A4,"east",B1:B4)' }, 'E1')).toBe(40); // case-insensitive
    expect(v({ ...d, E1: '=SUMIF(B1:B4,">=10")' }, 'E1')).toBe(60);
    expect(v({ ...d, E1: '=COUNTIF(A1:A4,"<>east")' }, 'E1')).toBe(2);
    expect(v({ ...d, E1: '=COUNTIF(A1:A4,"*st")' }, 'E1')).toBe(3);
    expect(v({ ...d, E1: '=SUMIFS(B1:B4,A1:A4,"east",C1:C4,"y")' }, 'E1')).toBe(30);
    expect(v({ ...d, E1: '=COUNTIFS(C1:C4,"y",B1:B4,">20")' }, 'E1')).toBe(1);
    expect(v({ ...d, E1: '=AVERAGEIF(C1:C4,"y",B1:B4)' }, 'E1')).toBe(25);
    expect(v({ ...d, E1: '=MAXIFS(B1:B4,C1:C4,"x")' }, 'E1')).toBe(10);
  });
  it('knows its function list', () => {
    for (const f of ['SUM', 'VLOOKUP', 'XLOOKUP', 'SUMIFS', 'IFERROR', 'TEXT', 'STDEV.S']) expect(SUPPORTED_FUNCTIONS).toContain(f);
  });
});

describe('pivot tables', () => {
  const data: WorkbookData = { sheets: { Sales: { A1: 'Region', B1: 'Rep', C1: 'Amount', A2: 'East', B2: 'Ann', C2: 100, A3: 'West', B3: 'Bo', C3: 50, A4: 'east', B4: 'Ann', C4: 25, A5: 'West', B5: 'Cy', C5: 75 } } };
  it('groups case-insensitively, sorts, aggregates and totals', () => {
    const r = runPivot(new Workbook(data), { source: 'Sales!A1:C5', rows: ['Region'], values: [{ field: 'Amount', agg: 'sum' }, { field: 'Amount', agg: 'count' }] });
    expect(typeof r).toBe('object');
    if (typeof r === 'string') return;
    expect(r.rows).toEqual([['East', 125, 2], ['West', 125, 2]]);
    expect(r.totals).toEqual([250, 4]);
  });
  it('supports filters and two row fields, and explains a bad field', () => {
    const w = new Workbook(data);
    const r = runPivot(w, { source: 'Sales!A1:C5', rows: ['Region', 'Rep'], values: [{ field: 'Amount', agg: 'average' }], filters: [{ field: 'Region', equals: 'West' }] });
    if (typeof r === 'string') throw new Error(r);
    expect(r.rows).toEqual([['West', 'Bo', 50], ['West', 'Cy', 75]]);
    expect(runPivot(w, { source: 'Sales!A1:C5', rows: ['Nope'], values: [] })).toMatch(/not a column/);
  });
});

describe('grading', () => {
  const start: WorkbookData = { sheets: { Sheet1: { A1: 'Price', A2: 10, A3: 20, A4: 30 } } };
  const total = (formula: string) => JSON.stringify({ sheets: { Sheet1: { ...start.sheets.Sheet1, B1: formula } } });
  const checks = [
    { kind: 'cell', name: 'visible total', cell: 'B1', expect: 60 },
    { kind: 'cell', name: 'hidden total', cell: 'B1', expect: 6, with: { A2: 1, A3: 2, A4: 3 }, visible: false },
    { kind: 'formula', name: 'uses a formula', cell: 'B1' },
  ] as const;
  it('accepts a real formula, rejects a typed answer and a hard-coded-to-the-visible-data formula', () => {
    expect(gradeSheet(total('=SUM(A2:A4)'), [...checks]).passed).toBe(true);
    expect(gradeSheet(total('=A2+A3+A4'), [...checks]).passed).toBe(true); // any valid approach
    const typed = gradeSheet(total('60') /* a constant */, [...checks]);
    expect(typed.passed).toBe(false);
    expect(typed.checks.find((c) => c.name === 'uses a formula')!.passed).toBe(false);
    expect(gradeSheet(total('=10+20+30'), [...checks]).passed).toBe(false); // hidden data exposes it
  });
  it('checks structure with constraints and reports bad input', () => {
    const cons = [{ type: 'requires' as const, node: 'sheet:SUMIF', message: 'Use SUMIF.' }];
    expect(gradeSheet(total('=SUM(A2:A4)'), [...checks], cons).passed).toBe(false);
    expect(gradeSheet('not json', [...checks]).error).toMatch(/could not be read/);
  });
});
