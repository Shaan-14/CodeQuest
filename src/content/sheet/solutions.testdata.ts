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
};
