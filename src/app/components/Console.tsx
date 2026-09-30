import type { RunnerStatus } from '../../learning/python/PythonRunner';
import type { SqlStatementResult } from '../../learning/runner';
import { SqlResults } from './SqlResults';

export interface ConsoleState {
  stdout: string;
  error: string;
  ran: boolean;
  note?: string;
  /** SQL runs: one entry per statement (result tables). */
  sql?: SqlStatementResult[];
}

export const emptyConsole: ConsoleState = { stdout: '', error: '', ran: false };

export function Console({ state, status, language = 'python' }: { state: ConsoleState; status: RunnerStatus; language?: 'python' | 'sql' }) {
  const name = language === 'sql' ? 'SQL' : 'Python';
  const loading = status === 'loading' || status === 'restarting';
  return (
    <div class="console" data-testid="console" aria-live="polite">
      <div class="console-title">
        <span>Console</span>
        <span class={`runner-status ${status}`}>
          {status === 'loading' && `Starting ${name}…`}
          {status === 'restarting' && `Restarting ${name}…`}
          {status === 'running' && 'Running…'}
          {(status === 'ready' || status === 'idle') && `${name} ready`}
        </span>
      </div>
      <pre class="console-body">
        {!state.ran && !loading && <span class="muted">Press Run to see what your program does.</span>}
        {!state.ran && loading && <span class="muted">{name} is loading in your browser (first time takes a few seconds)…</span>}
        {state.stdout && <span data-testid="stdout">{state.stdout}</span>}
        {state.sql && state.sql.length > 0 && <SqlResults statements={state.sql} />}
        {state.ran && !state.stdout && !state.error && !(state.sql && state.sql.length) && <span class="muted">(The program finished without printing anything.)</span>}
        {state.error && (
          <span class="console-error" data-testid="stderr">
            {state.stdout && !state.stdout.endsWith('\n') ? '\n' : ''}
            {state.error}
          </span>
        )}
      </pre>
      {state.note && <div class="console-note">{state.note}</div>}
    </div>
  );
}
