/**
 * Main-thread controller for the Python worker. Implements CodeRunner.
 *
 * Timeouts: Python cannot be interrupted from inside a synchronous infinite loop (`while True: pass`)
 * without SharedArrayBuffer/COOP+COEP headers. Instead we terminate the worker after `timeoutMs`
 * and start a fresh one. The cost is a few seconds of re-initialisation (the WASM is cached by the
 * browser), which we accept for a simple, robust design that needs no special server headers.
 */
import type { CodeRunner, GradeRequest, GradeResult, Language, RunRequest, RunResult } from '../runner';
import type { SandboxResult } from './pythonEngine';

export type RunnerStatus = 'idle' | 'loading' | 'ready' | 'running' | 'restarting';

type Pending = { resolve: (value: unknown) => void; reject: (reason: Error) => void };

export class PythonRunner implements CodeRunner {
  /** One worker runs both Python and SQL (SQLite is CPython's own sqlite3 module). */
  supports(language: Language): boolean {
    return language === 'python' || language === 'sql';
  }
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private pending = new Map<number, Pending>();
  private nextId = 1;
  private listeners = new Set<(s: RunnerStatus) => void>();
  private _status: RunnerStatus = 'idle';

  get status(): RunnerStatus {
    return this._status;
  }

  onStatus(listener: (s: RunnerStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(s: RunnerStatus) {
    this._status = s;
    this.listeners.forEach((l) => l(s));
  }

  /** Start loading Python in the background (call when the player enters a coding screen). */
  warmUp(): Promise<void> {
    if (this.ready) return this.ready;
    this.setStatus(this._status === 'restarting' ? 'restarting' : 'loading');
    const worker = new Worker(new URL('./pythonWorker.ts', import.meta.url), { type: 'module' });
    this.worker = worker;
    this.ready = new Promise<void>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (msg.type === 'ready') {
          this.setStatus('ready');
          resolve();
        } else if (msg.id !== undefined) {
          const p = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.type === 'error') p?.reject(new Error(msg.message));
          else p?.resolve(msg.result);
        } else if (msg.type === 'error') {
          reject(new Error(msg.message));
        }
      };
      worker.onerror = (e) => reject(new Error(e.message || 'The Python worker failed to start.'));
      const indexURL = new URL(import.meta.env.BASE_URL + 'pyodide/', document.baseURI).href;
      worker.postMessage({ type: 'init', indexURL });
    });
    this.ready.catch(() => {
      this.ready = null;
      this.setStatus('idle');
    });
    return this.ready;
  }

  private async call<T>(type: 'run' | 'grade' | 'sandbox', payload: unknown, timeoutMs: number, onTimeout: () => T): Promise<T> {
    await this.warmUp();
    const worker = this.worker!;
    const id = this.nextId++;
    this.setStatus('running');
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        worker.terminate();
        this.worker = null;
        this.ready = null;
        this.setStatus('restarting');
        this.warmUp().catch(() => undefined); // fresh worker ready for the next attempt
        resolve(onTimeout());
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          this.setStatus('ready');
          resolve(value as T);
        },
        reject: (err) => {
          clearTimeout(timer);
          this.setStatus('ready');
          reject(err);
        },
      });
      worker.postMessage({ id, type, payload });
    });
  }

  run(request: RunRequest): Promise<RunResult> {
    const { language, code, stdin, fixtures, sources, db } = request;
    return this.call<RunResult>('run', { language, code, stdin, fixtures, sources, db }, request.timeoutMs, () => ({
      ok: false,
      stdout: '',
      error: timeoutText(request.timeoutMs),
      timedOut: true,
      truncated: false,
    }));
  }

  /** Returns null if the query timed out (the database state is then left unchanged by the caller). */
  sandbox(sql: string, state: string | null, setup: string, timeoutMs = 8000): Promise<SandboxResult | null> {
    return this.call<SandboxResult | null>('sandbox', { sql, state, setup }, timeoutMs, () => null);
  }

  grade(request: GradeRequest): Promise<GradeResult> {
    const { language, code, checks, constraints, fixtures, sources, db } = request;
    const payload = { language, code, checks, constraints, fixtures, sources, db };
    return this.call<GradeResult>('grade', payload, request.timeoutMs, () => ({
      passed: false,
      error: timeoutText(request.timeoutMs),
      timedOut: true,
      checks: [],
      constraints: [],
    }));
  }
}

/** Free-play database: run SQL against the persisted state and return the new state (see SqlSandbox). */
export interface SandboxRunner {
  sandbox(sql: string, state: string | null, setup: string, timeoutMs: number): Promise<SandboxResult | null>;
}

function timeoutText(ms: number): string {
  return (
    `Your program ran for more than ${Math.round(ms / 1000)} seconds and was stopped.\n` +
    'This usually means a loop that never ends. Check that the loop condition can eventually become False.'
  );
}
