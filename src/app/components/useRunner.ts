import { useEffect, useState } from 'preact/hooks';
import { getRunner } from '../../learning/python/runner';
import type { RunnerStatus } from '../../learning/python/PythonRunner';
import type { RunResult } from '../../learning/runner';
import type { ConsoleState } from './Console';

export const RUN_TIMEOUT_MS = 8000;
export const GRADE_TIMEOUT_MS = 10000;

/** Live status of the shared Python runner; also starts loading Python. */
export function useRunnerStatus(): RunnerStatus {
  const runner = getRunner();
  const [status, setStatus] = useState<RunnerStatus>(runner.status);
  useEffect(() => {
    const off = runner.onStatus(setStatus);
    runner.warmUp().catch(() => undefined);
    return off;
  }, [runner]);
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
