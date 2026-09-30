import type { ComponentChildren } from 'preact';
import type { RunnerStatus } from '../../learning/python/PythonRunner';
import { CodeEditor } from './CodeEditor';
import { Console, type ConsoleState } from './Console';

interface Props {
  code: string;
  onCode: (c: string) => void;
  stdin: string;
  onStdin: (s: string) => void;
  showInput: boolean;
  console: ConsoleState;
  status: RunnerStatus;
  busy: boolean;
  onRun: () => void;
  onReset: () => void;
  /** Extra toolbar buttons (Submit, Hint). */
  children?: ComponentChildren;
  readOnly?: boolean;
  language?: 'python' | 'sql' | 'r' | 'shell';
}

/** Editor + toolbar + program input + console. Used by lesson demos and challenges. */
export function Workbench(p: Props) {
  return (
    <div class="workbench">
      <CodeEditor value={p.code} onChange={p.onCode} onRun={p.onRun} readOnly={p.readOnly} language={p.language} />
      <div class="toolbar">
        <button class="btn primary" onClick={p.onRun} disabled={p.busy} data-testid="run">▶ Run</button>
        <button class="btn" onClick={p.onReset} disabled={p.busy} data-testid="reset-code">↺ Reset</button>
        {p.children}
        <span class="muted small kbd">Ctrl+Enter to run</span>
      </div>
      {p.showInput && (
        <label class="stdin">
          <span>Program input <span class="muted small">(one line for each input() call; Python only)</span></span>
          <textarea rows={3} value={p.stdin} onInput={(e) => p.onStdin((e.target as HTMLTextAreaElement).value)} spellcheck={false} data-testid="stdin" />
        </label>
      )}
      <Console state={p.console} status={p.status} language={p.language} />
    </div>
  );
}
