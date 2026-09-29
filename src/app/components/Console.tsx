import type { RunnerStatus } from '../../learning/python/PythonRunner';

export interface ConsoleState {
  stdout: string;
  error: string;
  ran: boolean;
  note?: string;
}

export const emptyConsole: ConsoleState = { stdout: '', error: '', ran: false };

export function Console({ state, status }: { state: ConsoleState; status: RunnerStatus }) {
  const loading = status === 'loading' || status === 'restarting';
  return (
    <div class="console" data-testid="console" aria-live="polite">
      <div class="console-title">
        <span>Console</span>
        <span class={`runner-status ${status}`}>
          {status === 'loading' && 'Starting Python…'}
          {status === 'restarting' && 'Restarting Python…'}
          {status === 'running' && 'Running…'}
          {(status === 'ready' || status === 'idle') && 'Python ready'}
        </span>
      </div>
      <pre class="console-body">
        {!state.ran && !loading && <span class="muted">Press Run to see what your program does.</span>}
        {!state.ran && loading && <span class="muted">Python is loading in your browser (first time takes a few seconds)…</span>}
        {state.stdout && <span data-testid="stdout">{state.stdout}</span>}
        {state.ran && !state.stdout && !state.error && <span class="muted">(The program finished without printing anything.)</span>}
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
