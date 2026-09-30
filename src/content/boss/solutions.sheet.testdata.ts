/**
 * TEST-ONLY DATA (never imported by the app): reference workbook edits and wrong attempts for the spreadsheet boss problems.
 * No imports (the e2e runner loads it under plain Node). `cells` edit the active sheet; `Sheet!A1` edits another.
 */
type Cells = Record<string, string | number>;
interface Sol { cells: Cells }
const rows = (col: string, from: number, to: number, f: (r: number) => string, sheet = ''): Cells => {
  const out: Cells = {};
  for (let r = from; r <= to; r++) out[`${sheet}${col}${r}`] = f(r);
  return out;
};
const DATE = (c: string, r: number) => `DATE(VALUE(LEFT(${c}${r},4)),VALUE(MID(${c}${r},6,2)),VALUE(RIGHT(${c}${r},2)))`;

/* ------------------------------------------------------------ The Guild Ledger */
const ledger = (over: Partial<Record<'quarter' | 'rate' | 'net' | 'm' | 'k1' | 'k2' | 'k3', string | ((r: number) => string)>> = {}): Sol => {
  const fn = (k: keyof typeof over, dflt: (r: number) => string) => { const v = over[k]; return typeof v === 'function' ? v : typeof v === 'string' ? () => v : dflt; };
  const q = fn('quarter', (r) => `=ROUNDUP(VALUE(MID(C${r},6,2))/3,0)`);
  const rate = fn('rate', (r) => `=VLOOKUP(D${r},Tiers!$A$2:$B$4,2,TRUE)`);
  const net = fn('net', (r) => `=D${r}*(1-G${r})`);
  const m = fn('m', (r) => `=SUMIFS($H$2:$H$9,$F$2:$F$9,${r},$E$2:$E$9,"paid")`);
  return { cells: { ...rows('F', 2, 9, q), ...rows('G', 2, 9, rate), ...rows('H', 2, 9, net), ...rows('M', 1, 4, m), K1: (typeof over.k1 === 'string' ? over.k1 : '=SUMIFS(H2:H9,E2:E9,"paid")'), K2: (typeof over.k2 === 'string' ? over.k2 : '=COUNTIF(E2:E9,"open")'), K3: (typeof over.k3 === 'string' ? over.k3 : '=MATCH(MAX(M1:M4),M1:M4,0)') } };
};
/* ------------------------------------------------------------ Timesheet / outage / faults share one shape */
const summaryBlock = (sheet: string, from: number, to: number, list: string, totalCol: string, label: string): Sol['cells'] => ({
  ...rows('B', from, to, (r) => `=SUMIFS(Sheet1!$${totalCol}$2:$${totalCol}$9,Sheet1!$B$2:$B$9,A${r})`, `${sheet}!`),
  K3: `=INDEX(${sheet}!A${from}:A${to},MATCH(MAX(${sheet}!B${from}:B${to}),${sheet}!B${from}:B${to},0))`,
  ...(label ? {} : {}),
  ...(list ? {} : {}),
});
const timesheet = (over: { weekend?: string; pay?: (r: number) => string; k1?: string; k2?: string; k3?: string } = {}): Sol => {
  const rate = (r: number) => `VLOOKUP(C${r},Rates!$A$2:$B$4,2,FALSE)`;
  return { cells: {
    ...rows('F', 2, 9, (r) => `=IF(WEEKDAY(${DATE('D', r)},${over.weekend ?? '2'})>5,"Weekend","Weekday")`),
    ...rows('G', 2, 9, over.pay ?? ((r) => `=IF(F${r}="Weekend",2*E${r}*${rate(r)},MIN(E${r},8)*${rate(r)}+MAX(E${r}-8,0)*1.5*${rate(r)})`)),
    ...summaryBlock('People', 2, 5, '', 'G', ''),
    K1: over.k1 ?? '=SUM(G2:G9)', K2: over.k2 ?? '=SUMIFS(G2:G9,F2:F9,"Weekend")', ...(over.k3 ? { K3: over.k3 } : {}),
  } };
};
const outage = (over: { night?: (r: number) => string; cost?: (r: number) => string; k2?: string; k3?: string } = {}): Sol => ({ cells: {
  ...rows('E', 2, 9, (r) => `=VALUE(MID(C${r},12,2))`),
  ...rows('F', 2, 9, (r) => `=IF(${over.night ? over.night(r) : `OR(E${r}>=22,E${r}<6)`},"Night","Day")`),
  ...rows('G', 2, 9, over.cost ?? ((r) => `=D${r}*IFERROR(VLOOKUP(B${r},Costs!$A$2:$B$4,2,FALSE),0)`)),
  ...summaryBlock('Plants', 2, 4, '', 'G', ''),
  K1: '=SUM(G2:G9)', K2: over.k2 ?? '=SUMIFS(D2:D9,F2:F9,"Night")/SUM(D2:D9)', ...(over.k3 ? { K3: over.k3 } : {}),
} });
const faults = (over: { peak?: (r: number) => string; lost?: (r: number) => string; k2?: string } = {}): Sol => ({ cells: {
  ...rows('E', 2, 9, (r) => `=VALUE(MID(C${r},12,2))`),
  ...rows('F', 2, 9, (r) => `=IF(${over.peak ? over.peak(r) : `AND(E${r}>=9,E${r}<18)`},"Peak","Off-peak")`),
  ...rows('G', 2, 9, over.lost ?? ((r) => `=D${r}*IFERROR(VLOOKUP(B${r},Rates!$A$2:$B$4,2,FALSE),0)`)),
  ...summaryBlock('Sites', 2, 4, '', 'G', ''),
  K1: '=SUM(G2:G9)', K2: over.k2 ?? '=SUMIFS(D2:D9,F2:F9,"Peak")/SUM(D2:D9)',
} });

export const bossSheetSolutions: Record<string, { valid: Sol[]; wrong: Sol[] }> = {
  'boss-xl-mastery-a': {
    valid: [ledger(), ledger({ quarter: (r) => `=INT((VALUE(MID(C${r},6,2))+2)/3)`, rate: (r) => `=INDEX(Tiers!$B$2:$B$4,MATCH(D${r},Tiers!$A$2:$A$4,1))`, k3: '=IFERROR(MATCH(MAX(M1:M4),M1:M4,0),0)' })],
    wrong: [
      ledger({ rate: (r) => `=IFERROR(VLOOKUP(D${r},Tiers!$A$2:$B$4,2,FALSE),0)` }),
      ledger({ k1: '=SUM(H2:H9)' }),
      ledger({ k2: '=COUNTIF(E2:E9,"<>paid")' }),
      ledger({ k3: '=MAX(M1:M4)' }),
      ledger({ quarter: (r) => `=ROUNDUP(VALUE(MID(C${r},6,2))/4,0)` }),
      ledger({ m: (r) => `=SUMIFS($H$2:$H$9,$F$2:$F$9,${r})` }),
      ledger({ net: (r) => `=D${r}*0.95` }),
      ledger({ rate: (r) => `=VLOOKUP(D${r},Tiers!$A$2:$B$4,2,TRUE)+0.01` }),
      { cells: { ...rows('F', 2, 9, () => '1'), ...rows('G', 2, 9, () => '0'), ...rows('H', 2, 9, () => '100'), ...rows('M', 1, 4, () => '100'), K1: '14524.99', K2: '2', K3: '2' } },
    ],
  },
  'boss-xl-mastery-b': {
    valid: [timesheet(), timesheet({ weekend: '2', pay: (r) => `=VLOOKUP(C${r},Rates!$A$2:$B$4,2,FALSE)*IF(F${r}="Weekend",2*E${r},MIN(E${r},8)+1.5*MAX(E${r}-8,0))`, k3: '=INDEX(People!A2:A5,MATCH(MAX(People!B2:B5),People!B2:B5,0))' })].map((s) => ({ cells: { ...s.cells, K3: s.cells.K3 ?? '=INDEX(People!A2:A5,MATCH(MAX(People!B2:B5),People!B2:B5,0))' } })),
    wrong: [
      timesheet({ weekend: '1' }),
      timesheet({ pay: (r) => `=IF(F${r}="Weekend",1.5*E${r}*VLOOKUP(C${r},Rates!$A$2:$B$4,2,FALSE),MIN(E${r},8)*VLOOKUP(C${r},Rates!$A$2:$B$4,2,FALSE)+MAX(E${r}-8,0)*1.5*VLOOKUP(C${r},Rates!$A$2:$B$4,2,FALSE))` }),
      timesheet({ pay: (r) => `=E${r}*VLOOKUP(C${r},Rates!$A$2:$B$4,2,FALSE)*IF(F${r}="Weekend",2,1)` }),
      timesheet({ k2: '=SUMIFS(G2:G9,F2:F9,"Weekday")' }),
      timesheet({ k3: '=MAX(People!B2:B5)' }),
      timesheet({ pay: (r) => `=IF(F${r}="Weekend",2*E${r}*VLOOKUP(C${r},Rates!$A$2:$B$4,2,TRUE),MIN(E${r},8)*VLOOKUP(C${r},Rates!$A$2:$B$4,2,TRUE)+MAX(E${r}-8,0)*1.5*VLOOKUP(C${r},Rates!$A$2:$B$4,2,TRUE))` }),
      timesheet({ pay: (r) => `=IF(F${r}="Weekend",2*E${r}*20,MIN(E${r},8)*20+MAX(E${r}-8,0)*30)` }),
    ].map((s) => ({ cells: { ...s.cells, K3: s.cells.K3 ?? '=INDEX(People!A2:A5,MATCH(MAX(People!B2:B5),People!B2:B5,0))' } })),
  },
  'boss-xl-summit-sheets-a': {
    valid: [outage({ k3: '=INDEX(Plants!A2:A4,MATCH(MAX(Plants!B2:B4),Plants!B2:B4,0))' }), outage({ night: (r) => `NOT(AND(E${r}>=6,E${r}<22))`, k3: '=INDEX(Plants!A2:A4,MATCH(MAX(Plants!B2:B4),Plants!B2:B4,0))' })],
    wrong: [
      outage({ cost: (r) => `=D${r}*VLOOKUP(B${r},Costs!$A$2:$B$4,2,FALSE)` }),
      outage({ k2: '=COUNTIF(F2:F9,"Night")/COUNTA(F2:F9)' }),
      outage({ night: (r) => `OR(E${r}>22,E${r}<6)` }),
      outage({ night: (r) => `OR(E${r}>=22,E${r}<=6)` }),
      outage({ k2: '=SUMIFS(D2:D9,F2:F9,"Day")/SUM(D2:D9)' }),
      outage({ k3: '=MAX(Plants!B2:B4)' }),
      outage({ cost: (r) => `=D${r}*IFERROR(VLOOKUP(B${r},Costs!$A$2:$B$4,2,TRUE),0)` }),
    ].map((s) => ({ cells: { ...s.cells, K3: s.cells.K3 ?? '=INDEX(Plants!A2:A4,MATCH(MAX(Plants!B2:B4),Plants!B2:B4,0))' } })),
  },
  'boss-xl-summit-sheets-b': {
    valid: [faults()].map((s) => ({ cells: { ...s.cells, K3: '=INDEX(Sites!A2:A4,MATCH(MAX(Sites!B2:B4),Sites!B2:B4,0))' } })),
    wrong: [
      faults({ peak: (r) => `AND(E${r}>=9,E${r}<=18)` }),
      faults({ peak: (r) => `AND(E${r}>9,E${r}<18)` }),
      faults({ lost: (r) => `=D${r}*VLOOKUP(B${r},Rates!$A$2:$B$4,2,FALSE)` }),
      faults({ k2: '=COUNTIF(F2:F9,"Peak")/COUNTA(F2:F9)' }),
      faults({ k2: '=SUMIFS(G2:G9,F2:F9,"Peak")/SUM(G2:G9)' }),
    ].map((s) => ({ cells: { ...s.cells, K3: '=INDEX(Sites!A2:A4,MATCH(MAX(Sites!B2:B4),Sites!B2:B4,0))' } })),
  },
};
