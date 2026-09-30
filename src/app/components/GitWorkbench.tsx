import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { GitSpec } from '../../content/schema';
import { replay } from '../../learning/git/replay';
import { currentBranch, headCommitId } from '../../learning/git/repo';

interface Props {
  spec: GitSpec;
  /** The transcript of commands the player has typed (one per line). */
  code: string;
  onCode: (c: string) => void;
  onReset: () => void;
  children?: ComponentChildren;
  busy?: boolean;
}

/** A terminal on a simulated repository: each line you type is replayed from the start, so the state always matches what you typed. */
export function GitWorkbench({ spec, code, onCode, onReset, children }: Props) {
  const { repo, steps } = useMemo(() => replay(spec.start, code), [spec, code]);
  const [line, setLine] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight }); }, [steps.length]);
  const run = () => { if (!line.trim()) return; onCode(code ? `${code}\n${line}` : line); setLine(''); };
  const head = headCommitId(repo);
  const branch = currentBranch(repo);
  const files = Object.keys(repo.files).sort();
  const conflicts = repo.merging?.conflicts ?? [];
  return (
    <div class="workbench gitbench" data-testid="git">
      <div class="git-top">
        <div class="git-state" data-testid="git-state">
          <span>{repo.initialized ? (branch ? `on ${branch}` : 'detached HEAD') : 'not a repository yet'}</span>
          {head && <span class="muted small"> · {head.slice(0, 7)}</span>}
          {repo.merging && <span class="chip none" data-testid="git-merging">merge in progress</span>}
        </div>
        <ul class="git-branches small">{Object.keys(repo.branches).sort().map((b) => <li key={b} class={b === branch ? 'cur' : ''}>{b === branch ? '● ' : '○ '}{b} <span class="muted">{repo.branches[b]!.slice(0, 7)}</span></li>)}</ul>
      </div>
      <div class="git-files" data-testid="git-files">
        <strong class="small">Files</strong>
        {files.length === 0 && <span class="muted small"> (none)</span>}
        {files.map((f) => <button key={f} class={`btn small ${conflicts.includes(f) ? 'gold' : ''}`} onClick={() => { setOpen(f); setDraft(repo.files[f]!); }} data-testid={`file-${f}`}>{f}{conflicts.includes(f) ? ' ⚠' : ''}</button>)}
      </div>
      {open && (
        <div class="git-editor panel" data-testid="git-editor">
          <strong class="small">{open}</strong>
          <textarea rows={8} value={draft} onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)} spellcheck={false} data-testid="git-edit-area" />
          <div class="toolbar">
            <button class="btn small primary" onClick={() => { onCode(`${code ? code + '\n' : ''}@write ${open} ${JSON.stringify(draft.endsWith('\n') || draft === '' ? draft : draft + '\n')}`); setOpen(null); }} data-testid="git-save-file">Save file</button>
            <button class="btn small" onClick={() => setOpen(null)}>Close</button>
          </div>
        </div>
      )}
      <div class="terminal" ref={scroll} data-testid="terminal" aria-live="polite">
        {steps.length === 0 && <div class="muted small">Type a command below. Try <code>git status</code>. <code>help</code> lists what works here.</div>}
        {steps.map((s, i) => (
          <div key={i} class="term-step">
            <div class="term-cmd">$ {s.line.startsWith('@write ') ? `(edited ${s.line.split(' ')[1]} in the editor)` : s.line}</div>
            {s.out && <pre class="term-out">{s.out}</pre>}
            {s.err && <pre class="term-err">{s.err}</pre>}
          </div>
        ))}
      </div>
      <div class="term-input">
        <span>$</span>
        <input value={line} onInput={(e) => setLine((e.target as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } }} placeholder='git status' spellcheck={false} autocomplete="off" data-testid="git-input" />
        <button class="btn small primary" onClick={run} data-testid="git-run">Run</button>
      </div>
      <div class="toolbar">
        <button class="btn" onClick={onReset} data-testid="reset-code">↺ Start over</button>
        {children}
      </div>
    </div>
  );
}
