/**
 * Code execution contract. See ARCHITECTURE.md ("Code execution").
 *
 * Implemented: Python AND SQL, both by the same Pyodide worker (src/learning/python/): SQL runs on real
 * SQLite through CPython's `sqlite3` module, so Python + SQL integration uses the genuine library.
 * Planned, each behind this same interface and isolated in a Worker/sandboxed iframe:
 *  - JavaScript, R (webR), HTML/CSS (sandboxed iframe DOM checks).
 * New languages add a runner + new `Check` kinds in content/schema.ts; the UI and mastery
 * system do not change.
 */
import type { Check, Constraint, Fixtures, Json } from '../content/schema';

export type Language = 'javascript' | 'python' | 'sql' | 'r' | 'html-css';

export interface RunRequest {
  language: Language;
  code: string;
  /** Lines returned by successive input() calls (Python). */
  stdin?: string[];
  /** Files/databases available to the program (Python). */
  fixtures?: Fixtures;
  /** Database ids -> setup SQL, for every database the request refers to (fixtures.databases or `db`). */
  sources?: Record<string, string>;
  /** Database to run against (SQL). */
  db?: string;
  timeoutMs: number;
}

/** One executed SQL statement: a result table, or an OK with an affected-row count. */
export interface SqlStatementResult {
  sql: string;
  kind: 'rows' | 'ok';
  columns?: string[];
  rows?: Json[][];
  /** Rows fetched (capped) / more rows existed than were fetched. */
  total?: number;
  more?: boolean;
  rowcount?: number;
}

export interface RunResult {
  ok: boolean;
  stdout: string;
  /** Learner-friendly error text (traceback trimmed to the player's own code), or ''. */
  error: string;
  errorLine?: number;
  timedOut: boolean;
  /** Output was cut off because the program printed too much. */
  truncated: boolean;
  /** SQL runs: one entry per statement executed. */
  sql?: SqlStatementResult[];
}

export interface GradeRequest {
  language: Language;
  code: string;
  checks: Check[];
  constraints?: Constraint[];
  fixtures?: Fixtures;
  sources?: Record<string, string>;
  /** Default database id for SQL checks. */
  db?: string;
  timeoutMs: number;
}

export interface CheckOutcome {
  name: string;
  passed: boolean;
  visible: boolean;
  /** Explanation for the player. Shown on failure. */
  message: string;
  expected?: string;
  actual?: string;
}

export interface GradeResult {
  /** True only if every check and constraint passed. */
  passed: boolean;
  /** Set if the code could not even be run (syntax error, timeout...). */
  error: string;
  errorLine?: number;
  timedOut: boolean;
  checks: CheckOutcome[];
  constraints: { message: string; passed: boolean }[];
}

export interface CodeRunner {
  /** Languages this runner can execute. */
  supports(language: Language): boolean;
  /** Execute the code and return its output/errors (the Run button). */
  run(request: RunRequest): Promise<RunResult>;
  /** Evaluate the code against behavioural checks (the Submit button). */
  grade(request: GradeRequest): Promise<GradeResult>;
}
