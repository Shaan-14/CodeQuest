import { useEffect, useState } from 'preact/hooks';
import { getDatabase } from '../../content/databases';
import type { Fixtures } from '../../content/schema';
import { getRunner } from '../../learning/python/runner';
import { apiViews, relations, sampleScript, viewFile, visibleDatabases, type Table } from '../../learning/sourceData';
import { useRunnerStatus } from './useRunner';

/**
 * THE SOURCE-DATA VIEWER: what a lesson's code will run on, shown beside the brief: the tables, columns and links of the lesson's own database
 * with a few real rows, CSV files as tables, JSON formatted, the practice API's collections. It reads the SAME definitions the runner uses
 * (content/databases, the lesson's fixtures, the API data set the page is served) so nothing is typed twice, and the choice of what may be shown
 * lives in learning/sourceData.ts: hidden grading twins and internal files are never offered.
 */
const samples = new Map<string, Promise<Samples | null>>();
type Samples = Record<string, { table: Table; total: number }>;

function loadSamples(id: string): Promise<Samples | null> {
  const def = getDatabase(id);
  if (!def || !def.tables.length) return Promise.resolve(null);
  let p = samples.get(id);
  if (!p) {
    p = getRunner().sandbox(sampleScript(def.tables), null, def.setup).then((r) => {
      if (!r || r.error) return null;
      const out: Samples = {};
      def.tables.forEach((t, i) => {
        const rows = r.statements[i * 2], count = r.statements[i * 2 + 1];
        if (rows?.kind !== 'rows') return;
        out[t.name] = { table: { header: rows.columns ?? [], rows: (rows.rows ?? []).map((row) => row.map((v) => (v === null ? 'NULL' : String(v)))) }, total: Number(count?.rows?.[0]?.[0] ?? rows.rows?.length ?? 0) };
      });
      return out;
    }).catch(() => null);
    samples.set(id, p);
  }
  return p;
}

function Grid({ table, nulls }: { table: Table; nulls?: boolean }) {
  return (
    <div class="dv-scroll"><table class="dv-table">
      <thead><tr>{table.header.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} class={nulls && c === 'NULL' ? 'dv-null' : ''}>{c}</td>)}</tr>)}</tbody>
    </table></div>
  );
}

function DbSource({ id }: { id: string }) {
  const def = getDatabase(id)!;
  const status = useRunnerStatus();
  const [data, setData] = useState<Samples | null | undefined>(undefined);
  useEffect(() => { if (status === 'ready' && data === undefined) { let live = true; void loadSamples(id).then((s) => { if (live) setData(s); }); return () => { live = false; }; } }, [status, id, data]);
  const links = relations(def);
  return (
    <div class="dv-source" data-testid={`dv-db-${id}`}>
      <strong>🗂️ {def.title}</strong> <span class="muted small">{def.about}</span>
      {def.tables.length === 0 && <p class="muted small">No tables yet. You will create them.</p>}
      {def.tables.map((t) => {
        const mine = links.filter((l) => l.from === t.name), s = data?.[t.name];
        return (
          <div key={t.name} class="schema-table" data-testid={`dv-table-${t.name}`}>
            <strong>{t.name}</strong> <span class="muted small">{t.about}{s ? ` · ${s.total} rows` : ''}</span>
            <ul>{t.columns.map((c) => <li key={c.name}><code>{c.name}</code>{c.note && <span class="muted small"> {c.note}</span>}</li>)}</ul>
            {mine.length > 0 && <p class="small dv-links">{mine.map((l) => <span key={l.column}><code>{l.column}</code> → <code>{l.to}</code></span>)}</p>}
            {s ? <Grid table={s.table} nulls /> : def.tables.length > 0 && <p class="muted small">{status === 'ready' ? 'Loading sample rows…' : 'Sample rows appear when the runtime is ready.'}</p>}
          </div>
        );
      })}
    </div>
  );
}

function FileSource({ path, text }: { path: string; text: string }) {
  const v = viewFile(path, text);
  return (
    <div class="dv-source" data-testid={`dv-file-${path}`}>
      <strong>📄 <code>{path}</code></strong> <span class="muted small">{v.kind === 'csv' ? `${v.table.header.length} columns · ${v.total} rows` : v.kind === 'json' ? 'JSON, formatted' : 'text'}</span>
      {v.kind === 'csv' ? <>
        <Grid table={v.table} />{v.total > v.table.rows.length && <p class="muted small">…and {v.total - v.table.rows.length} more rows</p>}
      </> : <pre class="dv-pre">{v.text}{v.truncated ? '\n…' : ''}</pre>}
    </div>
  );
}

/** Whatever source data this lesson step has: `db`/fixtures for SQL and Python, files, and the practice API for web pages. Renders nothing when there is none. */
export function DataViewer({ db, fixtures, api }: { db?: string; fixtures?: Fixtures; api?: boolean }) {
  const dbs = visibleDatabases(fixtures, db).filter((id) => getDatabase(id));
  const files = Object.entries(fixtures?.files ?? {});
  const views = api ? apiViews() : [];
  if (!dbs.length && !files.length && !views.length) return null;
  return (
    <details class="schema dataview" open data-testid="data-viewer">
      <summary>🔎 Source data <span class="muted small">(what your code works with)</span></summary>
      {dbs.map((id) => <DbSource key={id} id={id} />)}
      {files.map(([path, text]) => <FileSource key={path} path={path} text={text} />)}
      {views.length > 0 && (
        <div class="dv-source" data-testid="dv-api">
          <strong>🌐 The practice API</strong> <span class="muted small">Each collection is served at <code>/api/&lt;name&gt;</code> as JSON.</span>
          {views.map((v) => (
            <div key={v.name} class="schema-table">
              <strong>/api/{v.name}</strong> <span class="muted small">{v.total} records</span>
              <Grid table={v.table} />
            </div>
          ))}
        </div>
      )}
    </details>
  );
}
