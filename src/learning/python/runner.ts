import { PythonRunner } from './PythonRunner';

let runner: PythonRunner | null = null;

/** The one shared Python runner (one worker for the whole app). */
export function getRunner(): PythonRunner {
  return (runner ??= new PythonRunner());
}
