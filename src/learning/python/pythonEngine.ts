/**
 * Runs Python and grades it, given an already-loaded Pyodide instance.
 * Shared by the browser Web Worker (pythonWorker.ts) and by Node tests (real CPython either way).
 * Timeouts are NOT handled here: a synchronous infinite loop cannot be interrupted from inside,
 * so the main-thread PythonRunner kills the worker instead.
 */
import harnessSource from './harness.py?raw';
import type { GradeRequest, GradeResult, RunRequest, RunResult } from '../runner';

/** The small part of the Pyodide API we use. */
export interface PyodideLike {
  runPython(code: string): unknown;
  globals: { get(name: string): (...args: string[]) => string };
}

export interface PythonEngine {
  run(request: Pick<RunRequest, 'code' | 'stdin'>): RunResult;
  grade(request: Pick<GradeRequest, 'code' | 'checks' | 'constraints'>): GradeResult;
}

export function createPythonEngine(pyodide: PyodideLike): PythonEngine {
  pyodide.runPython(harnessSource);
  const cqRun = pyodide.globals.get('cq_run');
  const cqGrade = pyodide.globals.get('cq_grade');

  return {
    run({ code, stdin }) {
      const raw = JSON.parse(cqRun(code, JSON.stringify(stdin ?? [])));
      return {
        ok: raw.ok,
        stdout: raw.stdout,
        error: raw.error,
        errorLine: raw.errorLine ?? undefined,
        timedOut: false,
        truncated: raw.truncated,
      };
    },
    grade({ code, checks, constraints }) {
      const raw = JSON.parse(cqGrade(code, JSON.stringify({ checks, constraints: constraints ?? [] })));
      return {
        passed: raw.passed,
        error: raw.error,
        errorLine: raw.errorLine ?? undefined,
        timedOut: false,
        checks: raw.checks,
        constraints: raw.constraints,
      };
    },
  };
}
