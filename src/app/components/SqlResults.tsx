import type { SqlStatementResult } from '../../learning/runner';

const show = (v: unknown): string => (v === null ? 'NULL' : typeof v === 'object' ? JSON.stringify(v) : String(v));

/** Result tables of a SQL run. Cells are rendered as text (never as HTML). */
export function SqlResults({ statements }: { statements: SqlStatementResult[] }) {
  return (
    <div class="sql-results" data-testid="sql-results">
      {statements.map((st, i) => (
        <div key={i} class="sql-stmt">
          <div class="sql-echo"><code>{st.sql.length > 90 ? `${st.sql.slice(0, 90)}…` : st.sql}</code></div>
          {st.kind === 'rows' ? (
            <div class="sql-scroll">
              <table class="sql-table">
                <thead><tr>{(st.columns ?? []).map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
                <tbody>
                  {(st.rows ?? []).map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} class={c === null ? 'null' : typeof c === 'number' ? 'num' : ''}>{show(c)}</td>)}</tr>)}
                </tbody>
              </table>
              <div class="muted small">{st.total ?? st.rows?.length ?? 0} row{(st.total ?? st.rows?.length) === 1 ? '' : 's'}{st.more ? ' (showing the first rows only)' : ''}</div>
            </div>
          ) : (
            <div class="muted small">OK{typeof st.rowcount === 'number' && st.rowcount >= 0 ? ` · ${st.rowcount} row${st.rowcount === 1 ? '' : 's'} affected` : ''}</div>
          )}
        </div>
      ))}
    </div>
  );
}
