import { useEffect, useState } from 'preact/hooks';
import { getRunner } from '../../learning/python/runner';
import type { RunnerStatus } from '../../learning/python/PythonRunner';
import type { Fixtures } from '../../content/schema';
import { replay } from '../../learning/git/replay';
import type { RepoSnapshot } from '../../learning/git/types';
import { getRRunner } from '../../learning/r/runner';
import type { Language, RunResult } from '../../learning/runner';
import type { ConsoleState } from './Console';

export const RUN_TIMEOUT_MS = 8000;
export const GRADE_TIMEOUT_MS = 10000;

/** Live status of the shared Python runner; also starts loading Python (unless `enabled` is false). */
export function useRunnerStatus(enabled = true): RunnerStatus {
  const runner = getRunner();
  const [status, setStatus] = useState<RunnerStatus>(runner.status);
  useEffect(() => {
    const off = runner.onStatus(setStatus);
    // Web challenges never need Python: do not download the 13MB runtime for them.
    if (enabled) runner.warmUp().catch(() => undefined);
    return off;
  }, [runner, enabled]);
  return status;
}

/** Text typed in the Program input box -> lines for input(). */
export function parseStdin(text: string): string[] {
  if (!text) return [];
  const lines = text.split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

export async function runPython(code: string, stdinText: string): Promise<{ state: ConsoleState; result: RunResult | null }> {
  try {
    const result = await getRunner().run({ language: 'python', code, stdin: parseStdin(stdinText), timeoutMs: RUN_TIMEOUT_MS });
    return { state: { stdout: result.stdout, error: result.error, ran: true }, result };
  } catch (e) {
    return { state: { stdout: '', error: `CodeQuest could not run Python: ${String(e)}\nTry reloading the page.`, ran: true }, result: null };
  }
}

/** Run code in any supported language. SQL runs return result tables; Python runs may use fixture files/databases. */
export async function runCode(
  language: Language,
  code: string,
  opts: { stdin?: string; fixtures?: Fixtures; sources?: Record<string, string>; db?: string; git?: RepoSnapshot } = {},
): Promise<{ state: ConsoleState; result: RunResult | null }> {
  if (language === 'git') {
    // The Git simulator is instant and pure: replay the commands and show what a terminal would show.
    const { steps } = replay(opts.git ?? {}, code);
    const stdout = steps.map((s) => `$ ${s.line}${s.out ? '\n' + s.out : ''}${s.err ? '\n' + s.err : ''}`).join('\n');
    return { state: { stdout, error: '', ran: true }, result: null };
  }
  if (language === 'r') {
    try {
      const result = await getRRunner().run({ language, code, fixtures: opts.fixtures, timeoutMs: 20000 });
      return { state: { stdout: result.stdout, error: result.error, ran: true }, result };
    } catch (e) {
      return { state: { stdout: '', error: `CodeQuest could not start R: ${String(e)}\nTry reloading the page.`, ran: true }, result: null };
    }
  }
  try {
    const result = await getRunner().run({ language, code, stdin: parseStdin(opts.stdin ?? ''), fixtures: opts.fixtures, sources: opts.sources, db: opts.db, timeoutMs: RUN_TIMEOUT_MS });
    return { state: { stdout: result.stdout, error: result.error, ran: true, sql: result.sql }, result };
  } catch (e) {
    return { state: { stdout: '', error: `CodeQuest could not run your code: ${String(e)}\nTry reloading the page.`, ran: true }, result: null };
  }
}
