import { getDatabase } from '../../content/databases';

/** The tables and columns of a database, from the same definitions the test-suite checks against real SQLite. */
export function SchemaBrowser({ dbId }: { dbId: string }) {
  const db = getDatabase(dbId);
  if (!db) return null;
  return (
    <details class="schema" open data-testid="schema">
      <summary>🗂️ Database: {db.title}</summary>
      <p class="muted small">{db.about}</p>
      {db.tables.length === 0 ? <p class="muted small">No tables yet. You will create them.</p> : db.tables.map((t) => (
        <div key={t.name} class="schema-table">
          <strong>{t.name}</strong> <span class="muted small">{t.about}</span>
          <ul>{t.columns.map((c) => <li key={c.name}><code>{c.name}</code>{c.note && <span class="muted small"> {c.note}</span>}</li>)}</ul>
        </div>
      ))}
    </details>
  );
}
