/**
 * Code execution contract (interface only; implementations come in later phases).
 *
 * Planned runners, each isolated in a Web Worker or sandboxed iframe:
 *  - JavaScript: sandboxed iframe / worker
 *  - Python: Pyodide (WebAssembly)
 *  - SQL: SQLite compiled to WebAssembly (e.g. sql.js)
 *  - R: webR (WebAssembly), if practical
 * HTML/CSS challenges are checked against a sandboxed iframe DOM.
 */
export type Language = 'javascript' | 'python' | 'sql' | 'r' | 'html-css';

export interface RunRequest {
  language: Language;
  code: string;
  /** Optional setup, e.g. SQL schema/data or files the code may read. */
  fixtures?: Record<string, string>;
  timeoutMs: number;
}

export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  /** Structured return value for test harnesses, if any. */
  value?: unknown;
  timedOut: boolean;
}

export interface CodeRunner {
  readonly language: Language;
  run(request: RunRequest): Promise<RunResult>;
}
