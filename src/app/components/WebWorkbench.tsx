import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { WebFiles } from '../../content/schema';
import { mountSandbox, type SandboxHandle } from '../../learning/web/WebRunner';
import { CodeEditor } from './CodeEditor';

type Tab = 'html' | 'css' | 'js';
const LABEL: Record<Tab, string> = { html: 'HTML', css: 'CSS', js: 'JavaScript' };

export interface RequestLine {
  method: string;
  path: string;
  status: number;
}

export interface LogLine {
  level: string;
  text: string;
}

interface Props {
  files: WebFiles;
  onFiles: (f: WebFiles) => void;
  /** Tabs the player can edit; the others are shown read-only so the whole page is always visible. */
  tabs: Tab[];
  /** Serve the in-game API (`fetch('/api/...')`) to the page. */
  api?: boolean;
  readOnly?: boolean;
  onRun?: () => void;
  onReset: () => void;
  children?: ComponentChildren;
  /** Bumped by the parent to trigger a run (e.g. Ctrl+Enter is handled inside; demos auto-run). */
  busy?: boolean;
}

/**
 * The web workbench: HTML/CSS/JS tabs, a live preview in the SANDBOXED iframe (see learning/web/WebRunner.ts),
 * and a console for the page's console output and uncaught errors. Player code only ever runs in that iframe.
 */
export function WebWorkbench({ files, onFiles, tabs, api = false, readOnly = false, onRun, onReset, children, busy = false }: Props) {
  const [tab, setTab] = useState<Tab>(tabs[0] ?? 'html');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [requests, setRequests] = useState<RequestLine[]>([]);
  const [ran, setRan] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const handle = useRef<SandboxHandle | null>(null);
  const latest = useRef(files);
  latest.current = files;

  useEffect(() => () => handle.current?.destroy(), []);

  const run = () => {
    handle.current?.destroy();
    setLogs([]);
    setRequests([]);
    setRan(true);
    if (!holder.current) return;
    handle.current = mountSandbox(holder.current, latest.current, {
      api: api ? 'a' : null,
      onConsole: (level, text) => setLogs((l) => (l.length < 200 ? [...l, { level, text }] : l)),
      onRequest: (method, path, status) => setRequests((r) => (r.length < 100 ? [...r, { method, path, status }] : r)),
      onError: (text) => setLogs((l) => (l.length < 200 ? [...l, { level: 'error', text: `Uncaught ${text}` }] : l)),
      onStartFailure: () => setLogs([{ level: 'error', text: 'The page sandbox could not start. Try reloading.' }]),
    });
    onRun?.();
  };

  const editable = tabs.includes(tab) && !readOnly;
  return (
    <div class="workbench web-workbench" data-testid="web-workbench">
      <div class="web-tabs" role="tablist" aria-label="Project files">
        {(['html', 'css', 'js'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} class={tab === t ? 'active' : ''} onClick={() => setTab(t)} data-testid={`web-tab-${t}`}>
            {LABEL[t]}{!tabs.includes(t) ? ' 🔒' : ''}
          </button>
        ))}
      </div>
      <CodeEditor key={tab} value={files[tab]} onChange={(v) => onFiles({ ...latest.current, [tab]: v })} onRun={run} readOnly={!editable} language={tab} minLines={10} />
      <div class="toolbar">
        <button class="btn primary" onClick={run} disabled={busy} data-testid="run">▶ Run</button>
        <button class="btn" onClick={onReset} disabled={busy} data-testid="reset-code">↺ Reset</button>
        {children}
        <span class="muted small kbd">Ctrl+Enter to run</span>
      </div>
      <div class="web-preview panel" data-testid="web-preview">
        <div class="console-title"><span>Your page</span><span class="muted small">runs in a sandbox: it cannot touch the game</span></div>
        {!ran && <p class="muted small preview-hint">Press Run to see your page here.</p>}
        <div class="preview-frame" ref={holder} />
      </div>
      {api && (
        <div class="console request-log" data-testid="request-log">
          <div class="console-title"><span>Network: requests to the in-game API</span></div>
          <pre class="console-body">
            {requests.length === 0 && <span class="muted">{ran ? '(no requests yet)' : 'Requests your page makes appear here with their status codes.'}</span>}
            {requests.map((r, i) => <div key={i} class={r.status >= 400 ? 'console-error' : ''} data-testid="request-line">{r.method} {r.path} → {r.status}</div>)}
          </pre>
        </div>
      )}
      <div class="console" data-testid="console">
        <div class="console-title"><span>Console</span></div>
        <pre class="console-body">
          {logs.length === 0 && <span class="muted">{ran ? '(nothing logged)' : 'console.log output and errors appear here.'}</span>}
          {logs.map((l, i) => <div key={i} class={l.level === 'error' ? 'console-error' : l.level === 'warn' ? 'console-warn' : ''} data-testid={l.level === 'error' ? 'stderr' : 'stdout'}>{l.text}</div>)}
        </pre>
      </div>
    </div>
  );
}
