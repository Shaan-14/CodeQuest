import type { ComponentChildren } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import type { SheetSpec } from '../../content/schema';
import { Workbook, colToNum, display, expandRange, numToCol, parseAddr, isErr } from '../../learning/sheet/engine';
import { parseWorkbook } from '../../learning/sheet/grade';
import { runPivot } from '../../learning/sheet/pivot';
import type { ChartSpec, PivotSpec, WorkbookData } from '../../learning/sheet/types';

interface Props {
  spec: SheetSpec;
  code: string;
  onCode: (c: string) => void;
  onReset: () => void;
  children?: ComponentChildren;
}

const AGGS = ['sum', 'count', 'average', 'min', 'max'] as const;
const CHARTS: ChartSpec['type'][] = ['column', 'bar', 'line', 'pie', 'scatter'];

/** A small grid editor: type values or formulas (=SUM(A1:A3)), see the computed results, and build a pivot table or chart when the task asks for one. */
export function SheetWorkbench({ spec, code, onCode, onReset, children }: Props) {
  const data = useMemo(() => parseWorkbook(code) ?? spec.start, [code, spec]);
  const wb = useMemo(() => new Workbook(data), [data]);
  const [sheet, setSheet] = useState(() => data.active ?? Object.keys(data.sheets)[0]!);
  const [sel, setSel] = useState('A1');
  const [editing, setEditing] = useState<string | null>(null);
  const cells = data.sheets[sheet] ?? {};
  const addrs = Object.keys(cells).map(parseAddr).filter(Boolean) as { col: number; row: number }[];
  const cols = Math.max(6, ...addrs.map((a) => a.col + 1));
  const rows = Math.max(10, ...addrs.map((a) => a.row + 2));
  const editable = useMemo(() => (spec.editable ? new Set(spec.editable.flatMap((r) => { const ref = r.includes('!') ? r.split('!') : [sheet, r]; return ref[0] === sheet ? (expandRange(ref[1]!)?.flat() ?? []) : []; })) : null), [spec.editable, sheet]);
  const canEdit = (a: string) => !editable || editable.has(a);
  const save = (next: WorkbookData) => onCode(JSON.stringify(next));
  const set = (a: string, raw: string) => {
    const v: string | number | boolean = raw.startsWith('=') ? raw : raw.trim() !== '' && !isNaN(Number(raw)) ? Number(raw) : raw === 'TRUE' ? true : raw === 'FALSE' ? false : raw;
    const next: WorkbookData = { ...data, sheets: { ...data.sheets, [sheet]: { ...cells } } };
    if (raw === '') delete next.sheets[sheet]![a]; else next.sheets[sheet]![a] = v;
    save(next);
  };
  const raw = cells[sel];
  const pivot: PivotSpec = data.pivots?.[0] ?? { source: '', rows: [], values: [{ field: '', agg: 'sum' }] };
  const header = (() => { if (!pivot.source) return [] as string[]; const m = wb.rangeValues(pivot.source); return isErr(m) || !m[0] ? [] : m[0].map((v) => display(v)); })();
  const pr = pivot.source && pivot.rows.length ? runPivot(wb, pivot) : null;
  const setPivot = (p: Partial<PivotSpec>) => save({ ...data, pivots: [{ ...pivot, ...p }] });
  const chart: ChartSpec = data.charts?.[0] ?? { type: 'column', categories: '', series: [''] };
  const setChart = (c: Partial<ChartSpec>) => save({ ...data, charts: [{ ...chart, ...c }] });

  return (
    <div class="workbench sheet" data-testid="sheet">
      <div class="sheet-tabs" role="tablist">
        {Object.keys(data.sheets).map((n) => <button key={n} role="tab" aria-selected={n === sheet} class={n === sheet ? 'active' : ''} onClick={() => setSheet(n)}>{n}</button>)}
      </div>
      <div class="formula-bar"><span class="cell-name" data-testid="sheet-selected">{sel}</span><input value={String(raw ?? '')} readOnly={!canEdit(sel)} data-testid="formula-bar" onInput={(e) => canEdit(sel) && set(sel, (e.target as HTMLInputElement).value)} placeholder="Type a value or a formula such as =SUM(A2:A5)" /></div>
      <div class="grid-wrap">
        <table class="grid">
          <thead><tr><th />{Array.from({ length: cols }, (_, c) => <th key={c}>{numToCol(c + 1)}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                <th>{r + 1}</th>
                {Array.from({ length: cols }, (_, c) => {
                  const a = `${numToCol(c + 1)}${r + 1}`;
                  const v = wb.value(sheet, a);
                  const isF = typeof cells[a] === 'string' && (cells[a] as string).startsWith('=');
                  return (
                    <td key={a} class={`${a === sel ? 'sel' : ''} ${canEdit(a) ? 'editable' : 'locked'} ${isErr(v) ? 'err' : ''} ${typeof v === 'number' ? 'num' : ''}`} onClick={() => setSel(a)} onDblClick={() => canEdit(a) && setEditing(a)} data-cell={a}>
                      {editing === a ? (
                        <input autoFocus defaultValue={String(cells[a] ?? '')} data-testid={`cell-input-${a}`} onBlur={(e) => { set(a, (e.target as HTMLInputElement).value); setEditing(null); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
                      ) : (
                        <span title={isF ? String(cells[a]) : undefined}>{display(v)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="muted small">Click a cell and type in the formula bar (or double-click a cell). Grey cells are the data and cannot be changed. {spec.editable ? 'You can edit: ' + spec.editable.join(', ') + '.' : ''}</p>
      {spec.pivot && (
        <section class="pivot-builder panel" data-testid="pivot-builder">
          <strong>Pivot table</strong>
          <label>Source range (with the header row) <input value={pivot.source} placeholder="Sales!A1:D20" onInput={(e) => setPivot({ source: (e.target as HTMLInputElement).value })} data-testid="pivot-source" /></label>
          <label>Rows <select value={pivot.rows[0] ?? ''} onChange={(e) => setPivot({ rows: (e.target as HTMLSelectElement).value ? [(e.target as HTMLSelectElement).value] : [] })} data-testid="pivot-rows"><option value="">(choose a field)</option>{header.map((h) => <option key={h}>{h}</option>)}</select></label>
          <label>Values <select value={pivot.values[0]?.field ?? ''} onChange={(e) => setPivot({ values: [{ field: (e.target as HTMLSelectElement).value, agg: pivot.values[0]?.agg ?? 'sum' }] })} data-testid="pivot-values"><option value="">(choose a field)</option>{header.map((h) => <option key={h}>{h}</option>)}</select></label>
          <label>Summarise by <select value={pivot.values[0]?.agg ?? 'sum'} onChange={(e) => setPivot({ values: [{ field: pivot.values[0]?.field ?? '', agg: (e.target as HTMLSelectElement).value as PivotSpec['values'][number]['agg'] }] })} data-testid="pivot-agg">{AGGS.map((a) => <option key={a}>{a}</option>)}</select></label>
          {pr && (typeof pr === 'string' ? <p class="callout small">{pr}</p> : <table class="grid result" data-testid="pivot-result"><thead><tr>{pr.header.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{pr.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{typeof v === 'number' ? Math.round(v * 100) / 100 : v}</td>)}</tr>)}<tr class="total"><td>Grand total</td>{pr.totals.map((t, i) => <td key={i}>{Math.round(t * 100) / 100}</td>)}</tr></tbody></table>)}
        </section>
      )}
      {spec.chart && (
        <section class="chart-builder panel" data-testid="chart-builder">
          <strong>Chart</strong>
          <label>Type <select value={chart.type} onChange={(e) => setChart({ type: (e.target as HTMLSelectElement).value as ChartSpec['type'] })} data-testid="chart-type">{CHARTS.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label>Labels range <input value={chart.categories} placeholder="Sheet1!A2:A7" onInput={(e) => setChart({ categories: (e.target as HTMLInputElement).value })} data-testid="chart-categories" /></label>
          <label>Data range <input value={chart.series[0] ?? ''} placeholder="Sheet1!B2:B7" onInput={(e) => setChart({ series: [(e.target as HTMLInputElement).value] })} data-testid="chart-series" /></label>
          <ChartPreview wb={wb} chart={chart} />
        </section>
      )}
      <div class="toolbar">
        <button class="btn" onClick={onReset} data-testid="reset-code">↺ Reset workbook</button>
        {children}
      </div>
    </div>
  );
}

/** A tiny bar preview so the player sees what the chart would show (colour is never the only channel: values are labelled). */
function ChartPreview({ wb, chart }: { wb: Workbook; chart: ChartSpec }) {
  const labels = chart.categories ? wb.rangeValues(chart.categories) : null;
  const vals = chart.series[0] ? wb.rangeValues(chart.series[0]) : null;
  if (!labels || !vals || isErr(labels) || isErr(vals)) return <p class="muted small">Choose the label range and the data range to see the chart.</p>;
  const L = labels.flat(); const V = vals.flat().map((v) => (typeof v === 'number' ? v : 0));
  const max = Math.max(1, ...V);
  return (
    <div class="chart-preview" data-testid="chart-preview" aria-label={`${chart.type} chart`}>
      {L.map((l, i) => <div class="bar-row" key={i}><span>{display(l)}</span><div class="bar"><div class="bar-fill" style={{ width: `${(V[i]! / max) * 100}%` }} /></div><span>{V[i]}</span></div>)}
    </div>
  );
}
void colToNum;
