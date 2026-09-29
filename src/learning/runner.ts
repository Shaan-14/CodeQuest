/**
 * Code execution contract. See ARCHITECTURE.md ("Code execution").
 *
 * Implemented: Python via Pyodide in a Web Worker (src/learning/python/).
 * Planned, each behind this same interface and isolated in a Worker/sandboxed iframe:
 *  - JavaScript, SQL (SQLite-WASM), R (webR), HTML/CSS (sandboxed iframe DOM checks).
 * New languages add a runner + new `Check` kinds in content/schema.ts; the UI and mastery
 * system do not change.
 */
import type { Check, Constraint } from '../content/schema';

export type Language = 'javascript' | 'python' | 'sql' | 'r' | 'html-css';

export interface RunRequest {
  language: Language;
  code: string;
  /** Lines returned by successive input() calls. */
  stdin?: string[];
  timeoutMs: number;
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
}

export interface GradeRequest {
  language: Language;
  code: string;
  checks: Check[];
  constraints?: Constraint[];
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
  readonly language: Language;
  /** Execute the code and return its output/errors (the Run button). */
  run(request: RunRequest): Promise<RunResult>;
  /** Evaluate the code against behavioural checks (the Submit button). */
  grade(request: GradeRequest): Promise<GradeResult>;
}
