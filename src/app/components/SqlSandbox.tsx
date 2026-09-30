import { useState } from 'preact/hooks';
import { databases, getDatabase } from '../../content/databases';
import { getRunner } from '../../learning/python/runner';
import type { SqlStatementResult } from '../../learning/runner';
import { CodeEditor } from './CodeEditor';
import { SchemaBrowser } from './SchemaBrowser';
import { SqlResults } from './SqlResults';
import { useRunnerStatus } from './useRunner';
import { loadSandboxState, saveSandboxState } from '../../game/sandboxStore';

/** Free-play databases only (not the hidden twins). */
const PLAY = databases.filter((d) => !d.id.endsWith('-b'));
/** A persistent practice database: changes survive reloads until you reset it. */
export function SqlSandbox() {
  const [dbId, setDbId] = useState('market');
  const [sql, setSql] = useState('SELECT * FROM customers LIMIT 5;');
  const [results, setResults] = useState<SqlStatementResult[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(() => loadSandboxState());
  const status = useRunnerStatus();
  const db = getDatabase(dbId)!;

  const run = async () => {
    setBusy(true);
    const r = await getRunner().sandbox(sql, saved[dbId] ?? null, db.setup);
    setBusy(false);
    if (!r) { setError('That took too long and was stopped. The database was left unchanged.'); setResults([]); return; }
    setResults(r.statements);
    setError(r.error);
    const next = { ...saved, [dbId]: r.state };
    setSaved(next);
    saveSandboxState(next);
  };
  const reset = () => {
    const next = { ...saved };
    delete next[dbId];
    setSaved(next);
    saveSandboxState(next);
    setResults([]);
    setError('');
  };

  return (
    <section class="panel sandbox" data-testid="sandbox">
      <h2>🧪 SQL Sandbox</h2>
      <p class="muted">A free-play copy of each database. Your changes are kept between visits (in this browser only) until you reset it. It never affects your quests or evidence.</p>
      <label class="row">Database{' '}
        <select value={dbId} onChange={(e) => { setDbId((e.target as HTMLSelectElement).value); setResults([]); setError(''); }} data-testid="sandbox-db">
          {PLAY.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
        <span class="chip" data-testid="sandbox-state">{saved[dbId] ? 'has your changes' : 'fresh'}</span>
      </label>
      <SchemaBrowser dbId={dbId} />
      <CodeEditor value={sql} onChange={setSql} onRun={run} language="sql" minLines={5} />
      <div class="toolbar">
        <button class="btn primary" onClick={run} disabled={busy || status === 'loading'} data-testid="sandbox-run">▶ Run</button>
        <button class="btn" onClick={reset} disabled={busy} data-testid="sandbox-reset">↺ Reset this database</button>
      </div>
      {error && <pre class="console-error" data-testid="sandbox-error">{error}</pre>}
      <SqlResults statements={results} />
    </section>
  );
}
