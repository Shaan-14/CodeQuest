import { useState } from 'preact/hooks';
import { searchReference, type ReferenceEntry } from '../../content/reference';

/** The 10-step method professionals use when they do not know the answer. It is guidance, not a hint. */
export const METHOD_STEPS = [
  'Understand the problem: say it in your own words.',
  'Break it into smaller pieces.',
  'Identify what you already know.',
  'Identify what you do not know.',
  'Search the documentation or reference.',
  'Form a hypothesis about what will work.',
  'Test it with a small experiment.',
  'Read the error or the result carefully.',
  'Revise your approach.',
  'Verify the whole solution, including edge cases.',
];

export function MethodCard() {
  return (
    <section class="method panel" data-testid="method">
      <h3>The method for when you do not know</h3>
      <ol>{METHOD_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
    </section>
  );
}

/** Searchable in-game documentation. `onLookup` fires when an entry is opened (recorded as research evidence). */
export function FieldManual({ language, onLookup }: { language?: 'python' | 'sql' | 'web'; onLookup?: (entry: ReferenceEntry) => void }) {
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const results = searchReference(q, language).slice(0, 40);
  return (
    <div class="manual" data-testid="manual">
      <input type="search" class="manual-search" placeholder="Search the manual, e.g. “median” or “left join”" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} data-testid="manual-search" aria-label="Search the Field Manual" />
      {results.length === 0 && <p class="muted">Nothing matches. Try a simpler word, or a different name for the idea.</p>}
      <ul class="manual-list">
        {results.map((e) => (
          <li key={e.id}>
            <button class="manual-item" aria-expanded={openId === e.id} onClick={() => { setOpenId(openId === e.id ? null : e.id); if (openId !== e.id) onLookup?.(e); }} data-testid={`manual-${e.id}`}>
              <strong>{e.title}</strong> <span class="muted small">{e.language} · {e.group}</span>
              <code class="manual-sig">{e.signature}</code>
            </button>
            {openId === e.id && (
              <div class="manual-entry">
                <p>{e.summary}</p>
                <p class="muted">{e.details}</p>
                <pre class="code-sample">{e.example}</pre>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
