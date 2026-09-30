import type { Check } from '../schema';

/** Small builders shared by the data-engineering lessons. Every check here is a Python `script` check. */
export const script = (name: string, code: string, visible = true, fixtures?: { databases?: string[] }): Check => ({ kind: 'script', name, code, visible, ...fixtures });

export const common = { language: 'python' as const, project: true };
export const WORKS = { databases: ['works'] };
export const WORKS_B = { databases: ['works-b:works'] };
export const MARKET = { databases: ['market'] };
export const MARKET_B = { databases: ['market-b:market'] };

/**
 * Compare a function that reads a CSV file with a REFERENCE implementation embedded in the check, over several
 * feeds written to `f.csv`. `reference` defines `_ref(path)`. The message never shows the expected value for hidden feeds.
 */
export function csvRefs(fn: string, reference: string, feeds: { name: string; csv: string; visible?: boolean }[], note = 'The report does not match what the feed contains.'): Check[] {
  return feeds.map((f) => script(f.name, `${reference}\nopen('f.csv','w').write(${JSON.stringify(f.csv)})\n_exp = _ref('f.csv')\n_got = ${fn}('f.csv')\nassert _got == _exp, ${JSON.stringify(note)} + (" Expected %r but got %r." % (_exp, _got) if ${f.visible !== false ? 'True' : 'False'} else "")`, f.visible !== false));
}

/** Each run starts with fresh logging state (the harness resets it); only the log file needs clearing between checks. */
export const LOG_RESET = "import os\nif os.path.exists('job.log'):\n    os.remove('job.log')\n";

/** One logging check: run `fn(items, 'job.log')` (optionally twice) and compare the log lines and the return value. */
export function logCheck(name: string, fn: string, items: string, lines: string[], ret: string, o: { twice?: boolean; visible?: boolean } = {}): Check {
  const times = o.twice ? 2 : 1;
  const show = o.visible !== false;
  return script(name, `${LOG_RESET}_items = ${items}\n_r = ${fn}(_items, 'job.log')\n${o.twice ? `_r2 = ${fn}(_items, 'job.log')\nassert tuple(_r2) == ${ret}, 'The return value must be the same on every run.'\n` : ''}_lines = open('job.log').read().splitlines()\n_exp = ${JSON.stringify(lines)} * ${times}\nassert _lines == _exp, ${JSON.stringify(o.twice ? 'The log after running twice should hold both runs exactly once each (no repeated lines).' : 'The log lines do not match what the run should record.')}${show ? " + ' Expected %r but the file holds %r.' % (_exp, _lines)" : ''}\nassert tuple(_r) == ${ret}, 'Return the counts as a pair.'`, show);
}
