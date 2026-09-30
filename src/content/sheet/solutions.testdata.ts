/**
 * TEST-ONLY DATA (never imported by the app): reference workbook edits and plausible wrong attempts for the spreadsheet challenges.
 * No imports: the e2e runner loads this file under plain Node. `cells` edit the active sheet (use `Sheet!A1` for another sheet);
 * `pivot` and `chart` set the pivot-table and chart builders.
 */
export interface SheetSolution {
  cells?: Record<string, string | number | boolean>;
  pivot?: { source: string; rows: string[]; values: { field: string; agg: 'sum' | 'count' | 'average' | 'min' | 'max' }[]; filters?: { field: string; equals: string | number | boolean }[] };
  chart?: { type: 'column' | 'bar' | 'line' | 'pie' | 'scatter'; categories: string; series: string[] };
}
/** One formula per row, so the reference solutions stay short. */
function rows(col: string, from: number, to: number, f: (row: number) => string): Record<string, string> {
  const out: Record<string, string> = {};
  for (let r = from; r <= to; r++) out[col + r] = f(r);
  return out;
}
export const sheetSolutions: Record<string, { valid: SheetSolution[]; wrong: SheetSolution[] }> = {
  'xl-01-line-total': {
    valid: [{ cells: { D2: '=B2*C2', D3: '=B3*C3', D4: '=B4*C4' } }, { cells: { D2: '=C2*B2', D3: '=PRODUCT(B3,C3)', D4: '=C4*B4' } }].slice(0, 1).concat([{ cells: { D2: '=C2*B2', D3: '=C3*B3', D4: '=C4*B4' } }]),
    wrong: [{ cells: { D2: '=B2+C2', D3: '=B3+C3', D4: '=B4+C4' } }, { cells: { D2: 10, D3: 4, D4: 24 } }, { cells: { D2: '=4*2.5', D3: '=10*0.4', D4: '=2*12' } }, { cells: { D2: '=B2*C2' } }],
  },
  'xl-01-sales-tax': {
    valid: [{ cells: { C2: '=B2*(1+$F$1)', C3: '=B3*(1+$F$1)', C4: '=B4*(1+$F$1)' } }, { cells: { C2: '=B2+B2*$F$1', C3: '=B3+B3*$F$1', C4: '=B4+B4*$F$1' } }],
    wrong: [{ cells: { C2: '=B2*1.2', C3: '=B3*1.2', C4: '=B4*1.2' } }, { cells: { C2: '=B2*(1+F1)', C3: '=B3*(1+F2)', C4: '=B4*(1+F3)' } }, { cells: { C2: '=B2*$F$1', C3: '=B3*$F$1', C4: '=B4*$F$1' } }, { cells: { C2: 14.4, C3: 3.6, C4: 48 } }],
  },
  'xl-01-sales-tax-b': {
    valid: [{ cells: { C2: '=B2*(1+$E$1)', C3: '=B3*(1+$E$1)', C4: '=B4*(1+$E$1)' } }, { cells: { C2: '=B2+B2*$E$1', C3: '=B3+B3*$E$1', C4: '=B4+B4*$E$1' } }],
    wrong: [{ cells: { C2: '=B2*1.15', C3: '=B3*1.15', C4: '=B4*1.15' } }, { cells: { C2: '=B2*(1+E1)', C3: '=B3*(1+E2)', C4: '=B4*(1+E3)' } }, { cells: { C2: '=B2*$E$1', C3: '=B3*$E$1', C4: '=B4*$E$1' } }],
  },
  'xl-01-budget': {
    valid: [{ cells: { B6: '=SUM(B3:B5)', B7: '=B1-B6', B8: '=B7/B1' } }, { cells: { B6: '=B3+B4+B5', B7: '=B1-B3-B4-B5', B8: '=(B1-B6)/B1' } }],
    wrong: [{ cells: { B6: '=SUM(B3:B5)', B7: '=B1-B6', B8: '=B1/B7' } }, { cells: { B6: 2050, B7: 1150, B8: 0.359375 } }, { cells: { B6: '=SUM(B3:B5)', B7: '=B6-B1', B8: '=B7/B1' } }, { cells: { B6: '=SUM(B3:B4)', B7: '=B1-B6', B8: '=B7/B1' } }],
  },
  'xl-02-stats-block': {
    valid: [{ cells: { E1: '=SUM(A2:A7)', E2: '=AVERAGE(A2:A7)', E3: '=MAX(A2:A7)', E4: '=MIN(A2:A7)', E5: '=COUNT(A2:A7)' } }, { cells: { E1: '=SUM(A2:A7)', E2: '=E1/E5', E3: '=LARGE(A2:A7,1)', E4: '=SMALL(A2:A7,1)', E5: '=COUNT(A2:A7)' } }],
    wrong: [{ cells: { E1: '=SUM(A2:A7)', E2: '=AVERAGE(A2:A7)', E3: '=MAX(A2:A7)', E4: '=MIN(A2:A7)', E5: 6 } }, { cells: { E1: 478, E2: 79.67, E3: 92, E4: 65, E5: 6 } }, { cells: { E1: '=SUM(A2:A6)', E2: '=AVERAGE(A2:A7)', E3: '=MAX(A2:A7)', E4: '=MIN(A2:A7)', E5: '=COUNT(A2:A7)' } }, { cells: { E1: '=SUM(A2:A7)', E2: '=AVERAGE(A2:A7)', E3: '=MIN(A2:A7)', E4: '=MAX(A2:A7)', E5: '=COUNT(A2:A7)' } }],
  },
  'xl-02-weekly-report': {
    valid: [{ cells: { E2: '=SUM(B2:B6)', E3: '=ROUND(AVERAGE(B2:B6),1)', E4: '=MAX(B2:B6)', E5: '=COUNT(B2:B6)' } }, { cells: { E2: '=SUM(B2:B6)', E3: '=ROUND(E2/E5,1)', E4: '=LARGE(B2:B6,1)', E5: '=COUNT(B2:B6)' } }],
    wrong: [{ cells: { E2: '=SUM(B2:B6)', E3: '=ROUND(E2/5,1)', E4: '=MAX(B2:B6)', E5: '=COUNT(B2:B6)' } }, { cells: { E2: '=SUM(B2:B6)', E3: '=AVERAGE(B2:B6)', E4: '=MAX(B2:B6)', E5: '=COUNT(B2:B6)' } }, { cells: { E2: '=SUM(B2:B6)', E3: '=ROUND(AVERAGE(B2:B6),1)', E4: '=MAX(B2:B6)', E5: 5 } }, { cells: { E2: 525, E3: 131.3, E4: 142, E5: 4 } }],
  },
  'xl-02-weekly-report-b': {
    valid: [{ cells: { E2: '=SUM(B2:B5)', E3: '=ROUND(AVERAGE(B2:B5),1)', E4: '=MAX(B2:B5)', E5: '=COUNT(B2:B5)' } }],
    wrong: [{ cells: { E2: '=SUM(B2:B5)', E3: '=ROUND(E2/4,1)', E4: '=MAX(B2:B5)', E5: '=COUNT(B2:B5)' } }, { cells: { E2: '=SUM(B2:B5)', E3: '=AVERAGE(B2:B5)', E4: '=MAX(B2:B5)', E5: '=COUNT(B2:B5)' } }, { cells: { E2: 695.75, E3: 231.9, E4: 305.25, E5: 3 } }],
  },
  'xl-02-badge': {
    valid: [{ cells: { D2: '=UPPER(LEFT(A2,1))&". "&UPPER(B2)&"-"&C2', D3: '=UPPER(LEFT(A3,1))&". "&UPPER(B3)&"-"&C3', D4: '=UPPER(LEFT(A4,1))&". "&UPPER(B4)&"-"&C4' } }, { cells: { D2: '=UPPER(LEFT(A2,1)&". "&B2)&"-"&C2', D3: '=UPPER(LEFT(A3,1)&". "&B3)&"-"&C3', D4: '=UPPER(LEFT(A4,1)&". "&B4)&"-"&C4' } }],
    wrong: [{ cells: { D2: '=LEFT(A2,1)&". "&B2&"-"&C2', D3: '=LEFT(A3,1)&". "&B3&"-"&C3', D4: '=LEFT(A4,1)&". "&B4&"-"&C4' } }, { cells: { D2: 'J. SMITH-ENG', D3: 'O. KHAN-OPS', D4: 'L. WEI-HR' } }, { cells: { D2: '=A2&" "&UPPER(B2)&"-"&C2', D3: '=A3&" "&UPPER(B3)&"-"&C3', D4: '=A4&" "&UPPER(B4)&"-"&C4' } }, { cells: { D2: '=LEFT(A2,1)&". "&UPPER(B2)&"-"&C2', D3: '=LEFT(A3,1)&". "&UPPER(B3)&"-"&C3', D4: '=LEFT(A4,1)&". "&UPPER(B4)&"-"&C4' } }],
  },
  'xl-02-badge-b': {
    valid: [{ cells: { C2: '=UPPER(A2)&"-"&TEXT(B2,"000")', C3: '=UPPER(A3)&"-"&TEXT(B3,"000")', C4: '=UPPER(A4)&"-"&TEXT(B4,"000")' } }],
    wrong: [{ cells: { C2: '=UPPER(A2)&"-"&B2', C3: '=UPPER(A3)&"-"&B3', C4: '=UPPER(A4)&"-"&B4' } }, { cells: { C2: '=A2&"-"&TEXT(B2,"000")', C3: '=A3&"-"&TEXT(B3,"000")', C4: '=A4&"-"&TEXT(B4,"000")' } }, { cells: { C2: 'TOOL-007', C3: 'PAINT-112', C4: 'GARDEN-045' } }],
  },

  'xl-03-pass-fail': {
    valid: [{ cells: rows('B', 2, 5, (r) => `=IF(A${r}>=60,"Pass","Fail")`) }, { cells: rows('B', 2, 5, (r) => `=IF(A${r}<60,"Fail","Pass")`) }],
    wrong: [{ cells: rows('B', 2, 5, (r) => `=IF(A${r}>60,"Pass","Fail")`) }, { cells: { B2: 'Pass', B3: 'Fail', B4: 'Pass', B5: 'Fail' } }, { cells: rows('B', 2, 5, (r) => `=IF(A${r}>=50,"Pass","Fail")`) }],
  },
  'xl-03-shipping': {
    valid: [{ cells: rows('C', 2, 5, (r) => `=IF(B${r}<=1,5,IF(B${r}<=5,9,15))`) }, { cells: rows('C', 2, 5, (r) => `=IF(B${r}>5,15,IF(B${r}>1,9,5))`) }],
    wrong: [{ cells: rows('C', 2, 5, (r) => `=IF(B${r}<1,5,IF(B${r}<5,9,15))`) }, { cells: { C2: 5, C3: 9, C4: 9, C5: 15 } }, { cells: rows('C', 2, 5, (r) => `=IF(B${r}<=1,5,9)`) }, { cells: rows('C', 2, 5, (r) => `=IF(B${r}>1,9,IF(B${r}>5,15,5))`) }],
  },
  'xl-03-shipping-b': {
    valid: [{ cells: rows('C', 2, 5, (r) => `=IF(B${r}>=500,0.1,IF(B${r}>=100,0.05,0))`) }, { cells: rows('C', 2, 5, (r) => `=IF(B${r}<100,0,IF(B${r}<500,0.05,0.1))`) }],
    wrong: [{ cells: rows('C', 2, 5, (r) => `=IF(B${r}>500,0.1,IF(B${r}>100,0.05,0))`) }, { cells: { C2: 0, C3: 0.05, C4: 0.05, C5: 0.1 } }, { cells: rows('C', 2, 5, (r) => `=IF(B${r}>=100,0.05,IF(B${r}>=500,0.1,0))`) }],
  },
  'xl-03-eligible': {
    valid: [{ cells: rows('E', 2, 5, (r) => `=IF(AND(B${r}>=18,OR(C${r}="yes",D${r}="yes")),"Yes","No")`) }, { cells: rows('E', 2, 5, (r) => `=IF(B${r}<18,"No",IF(OR(C${r}="yes",D${r}="yes"),"Yes","No"))`) }],
    wrong: [{ cells: rows('E', 2, 5, (r) => `=IF(OR(B${r}>=18,C${r}="yes",D${r}="yes"),"Yes","No")`) }, { cells: rows('E', 2, 5, (r) => `=IF(AND(B${r}>=18,C${r}="yes",D${r}="yes"),"Yes","No")`) }, { cells: rows('E', 2, 5, (r) => `=IF(AND(B${r}>18,OR(C${r}="yes",D${r}="yes")),"Yes","No")`) }, { cells: { E2: 'Yes', E3: 'No', E4: 'Yes', E5: 'No' } }],
  },
  'xl-03-rate': {
    valid: [{ cells: rows('D', 2, 5, (r) => `=IFERROR(C${r}/B${r},"n/a")`) }, { cells: rows('D', 2, 5, (r) => `=IF(B${r}=0,"n/a",C${r}/B${r})`) }],
    wrong: [{ cells: rows('D', 2, 5, (r) => `=C${r}/B${r}`) }, { cells: rows('D', 2, 5, (r) => `=IFERROR(B${r}/C${r},"n/a")`) }, { cells: rows('D', 2, 5, (r) => `=IFERROR(C${r}/B${r},0)`) }, { cells: { D2: 0.05, D3: 'n/a', D4: 0.1, D5: 'n/a' } }],
  },
  'xl-03-rate-b': {
    valid: [{ cells: rows('D', 2, 5, (r) => `=IFERROR(C${r}/B${r},"no output")`) }, { cells: rows('D', 2, 5, (r) => `=IF(B${r}=0,"no output",C${r}/B${r})`) }],
    wrong: [{ cells: rows('D', 2, 5, (r) => `=C${r}/B${r}`) }, { cells: rows('D', 2, 5, (r) => `=IFERROR(C${r}/B${r},"n/a")`) }, { cells: rows('D', 2, 5, (r) => `=IFERROR(B${r}/C${r},"no output")`) }, { cells: { D2: 0.02, D3: 'no output', D4: 0.02, D5: 'no output' } }],
  },
  'xl-04-price-list': {
    valid: [{ cells: rows('Sheet1!B', 2, 4, (r) => `=IFERROR(VLOOKUP(A${r},Catalog!$A$2:$C$6,3,FALSE),"unknown")`) }, { cells: rows('Sheet1!B', 2, 4, (r) => `=IFERROR(INDEX(Catalog!$C$2:$C$6,MATCH(A${r},Catalog!$A$2:$A$6,0)),"unknown")`) }],
    wrong: [{ cells: rows('Sheet1!B', 2, 4, (r) => `=VLOOKUP(A${r},Catalog!$A$2:$C$6,3,FALSE)`) }, { cells: rows('Sheet1!B', 2, 4, (r) => `=IFERROR(VLOOKUP(A${r},Catalog!$A$2:$C$6,2,FALSE),"unknown")`) }, { cells: { 'Sheet1!B2': 12, 'Sheet1!B3': 2.5, 'Sheet1!B4': 'unknown' } }, { cells: rows('Sheet1!B', 2, 4, (r) => `=IFERROR(VLOOKUP(A${r},Catalog!$A$2:$C$6,3,TRUE),"unknown")`) }],
  },
  'xl-04-tax-band': {
    valid: [{ cells: rows('C', 2, 5, (r) => `=VLOOKUP(B${r},$F$2:$G$5,2,TRUE)`) }, { cells: rows('C', 2, 5, (r) => `=INDEX($G$2:$G$5,MATCH(B${r},$F$2:$F$5,1))`) }],
    wrong: [{ cells: rows('C', 2, 5, (r) => `=VLOOKUP(B${r},$F$2:$G$5,2,FALSE)`) }, { cells: { C2: 0.1, C3: 0.2, C4: 0.3, C5: 0.4 } }, { cells: rows('C', 2, 5, (r) => `=IF(B${r}>=80000,0.4,IF(B${r}>=30000,0.3,IF(B${r}>=12000,0.2,0.1)))`) }],
  },
  'xl-04-tax-band-b': {
    valid: [{ cells: rows('C', 2, 5, (r) => `=VLOOKUP(B${r},$E$2:$F$5,2,TRUE)`) }, { cells: rows('C', 2, 5, (r) => `=INDEX($F$2:$F$5,MATCH(B${r},$E$2:$E$5,1))`) }],
    wrong: [{ cells: rows('C', 2, 5, (r) => `=VLOOKUP(B${r},$E$2:$F$5,2,FALSE)`) }, { cells: { C2: 4, C3: 7, C4: 15, C5: 30 } }, { cells: rows('C', 2, 5, (r) => `=VLOOKUP(B${r},$E$2:$F$5,1,TRUE)`) }],
  },
  'xl-04-reverse': {
    valid: [{ cells: rows('F', 2, 4, (r) => `=IFERROR(INDEX($A$2:$A$6,MATCH(E${r},$B$2:$B$6,0)),"not found")`) }, { cells: rows('F', 2, 4, (r) => `=IFERROR(XLOOKUP(E${r},$B$2:$B$6,$A$2:$A$6),"not found")`) }],
    wrong: [{ cells: rows('F', 2, 4, (r) => `=INDEX($A$2:$A$6,MATCH(E${r},$B$2:$B$6,0))`) }, { cells: rows('F', 2, 4, (r) => `=IFERROR(INDEX($C$2:$C$6,MATCH(E${r},$B$2:$B$6,0)),"not found")`) }, { cells: { F2: 103, F3: 105, F4: 'not found' } }, { cells: rows('F', 2, 4, (r) => `=IFERROR(MATCH(E${r},$B$2:$B$6,0),"not found")`) }],
  },
  'xl-04-reverse-b': {
    valid: [{ cells: rows('F', 2, 4, (r) => `=IFERROR(INDEX($A$2:$A$6,MATCH(E${r},$B$2:$B$6,0)),"not found")`) }],
    wrong: [{ cells: rows('F', 2, 4, (r) => `=INDEX($A$2:$A$6,MATCH(E${r},$B$2:$B$6,0))`) }, { cells: rows('F', 2, 4, (r) => `=IFERROR(INDEX($C$2:$C$6,MATCH(E${r},$B$2:$B$6,0)),"not found")`) }, { cells: { F2: 'T-04', F3: 'T-01', F4: 'not found' } }],
  },
};
