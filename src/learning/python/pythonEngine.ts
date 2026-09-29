/**
 * Runs Python and SQL and grades them, given an already-loaded Pyodide instance.
 * Shared by the browser Web Worker (pythonWorker.ts) and by Node tests (real CPython either way).
 * Timeouts are NOT handled here: a synchronous infinite loop cannot be interrupted from inside,
 * so the main-thread PythonRunner kills the worker instead.
 */
import harnessSource from './harness.py?raw';
import type { GradeRequest, GradeResult, Language, RunRequest, RunResult, SqlStatementResult } from '../runner';

/** `language` defaults to 'python'. */
type WithOptionalLanguage<T extends { language: Language }> = Omit<T, 'language'> & { language?: Language };

/** The small part of the Pyodide API we use. */
export interface PyodideLike {
  runPython(code: string): unknown;
  globals: { get(name: string): (...args: string[]) => string };
}

export interface SandboxResult {
  ok: boolean;
  error: string;
  statements: SqlStatementResult[];
  /** The whole database, base64-encoded, to persist and pass back next time. */
  state: string;
}

export interface PythonEngine {
  run(request: WithOptionalLanguage<Pick<RunRequest, 'language' | 'code' | 'stdin' | 'fixtures' | 'sources' | 'db'>>): RunResult;
  grade(request: WithOptionalLanguage<Pick<GradeRequest, 'language' | 'code' | 'checks' | 'constraints' | 'fixtures' | 'sources' | 'db'>>): GradeResult;
  /** Free-play persistent database (SQL sandbox). */
  sandbox(request: { sql: string; state: string | null; setup: string }): SandboxResult;
}

export function createPythonEngine(pyodide: PyodideLike): PythonEngine {
  pyodide.runPython(harnessSource);
  const g = (name: string) => pyodide.globals.get(name);
  const cqRun = g('cq_run');
  const cqGrade = g('cq_grade');
  const cqSqlRun = g('cq_sql_run');
  const cqSqlGrade = g('cq_sql_grade');
  const cqSandbox = g('cq_sandbox_run');

  const fixturesWithSources = (fixtures: RunRequest['fixtures'], sources: RunRequest['sources']) => ({
    files: fixtures?.files ?? {},
    databases: fixtures?.databases ?? [],
    sources: sources ?? {},
  });

  return {
    run({ language, code, stdin, fixtures, sources, db }) {
      if (language === 'sql') {
        const raw = JSON.parse(cqSqlRun(code, (db && sources?.[db]) || ''));
        return { ok: raw.ok, stdout: '', error: raw.error, timedOut: false, truncated: false, sql: raw.statements };
      }
      const raw = JSON.parse(cqRun(code, JSON.stringify(stdin ?? []), JSON.stringify(fixturesWithSources(fixtures, sources))));
      return {
        ok: raw.ok,
        stdout: raw.stdout,
        error: raw.error,
        errorLine: raw.errorLine ?? undefined,
        timedOut: false,
        truncated: raw.truncated,
      };
    },
    grade({ language, code, checks, constraints, fixtures, sources, db }) {
      const raw =
        language === 'sql'
          ? JSON.parse(cqSqlGrade(code, JSON.stringify({ checks, constraints: constraints ?? [], sources: sources ?? {}, db })))
          : JSON.parse(cqGrade(code, JSON.stringify({ checks, constraints: constraints ?? [], fixtures: fixturesWithSources(fixtures, sources) })));
      return {
        passed: raw.passed,
        error: raw.error,
        errorLine: raw.errorLine ?? undefined,
        timedOut: false,
        checks: raw.checks,
        constraints: raw.constraints,
      };
    },
    sandbox({ sql, state, setup }) {
      return JSON.parse(cqSandbox(sql, state ?? '', setup));
    },
  };
}
