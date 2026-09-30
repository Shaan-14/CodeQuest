import { afterAll, describe, expect, it } from 'vitest';
import { RRunner } from './RRunner';

const r = new RRunner();
afterAll(async () => { await (r as unknown as { webR?: { close(): void } }).webR?.close(); });
const grade = (code: string, checks: object[], constraints: object[] = []) => r.grade({ language: 'r', code, checks: checks as never, constraints: constraints as never, timeoutMs: 60000 });

describe('real R through webR', () => {
  it('runs code, prints, and reports errors in plain language', async () => {
    const ok = await r.run({ language: 'r', code: 'x <- c(2, 4, 6)\nprint(mean(x))', timeoutMs: 60000 });
    expect(ok.ok).toBe(true);
    expect(ok.stdout).toBe('[1] 4');
    const bad = await r.run({ language: 'r', code: 'print(nope)', timeoutMs: 60000 });
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/nope/);
  }, 120000);
  it('every run starts fresh: nothing leaks from one run to the next', async () => {
    await r.run({ language: 'r', code: 'leaky <- 1', timeoutMs: 60000 });
    const res = await r.run({ language: 'r', code: 'print(exists("leaky"))', timeoutMs: 60000 });
    expect(res.stdout).toBe('[1] FALSE');
  }, 120000);
  it('grades output, variables and R assertions on hidden inputs; any valid implementation passes', async () => {
    const checks = [
      { kind: 'output', name: 'prints', expect: '[1] 6' },
      { kind: 'variable', name: 'total', variable: 'total', expect: 6 },
      { kind: 'script', name: 'function on hidden data', visible: false, code: 'stopifnot(total_of(c(10, 20)) == 30, total_of(numeric(0)) == 0)' },
    ];
    expect((await grade('total_of <- function(v) sum(v)\ntotal <- total_of(c(1,2,3))\nprint(total)', checks)).passed).toBe(true);
    expect((await grade('total_of <- function(v) { s <- 0; for (x in v) s <- s + x; s }\ntotal <- total_of(1:3)\nprint(total)', checks)).passed).toBe(true);
    const hardcoded = await grade('total_of <- function(v) 6\ntotal <- 6\nprint(total)', checks);
    expect(hardcoded.passed).toBe(false);
    expect(hardcoded.checks.find((c) => c.name === 'function on hidden data')!.passed).toBe(false);
  }, 120000);
  it('supports fixture files, constraints, and stops runaway code', async () => {
    const res = await r.grade({ language: 'r', code: 'd <- read.csv("t.csv")\nprint(sum(d$a))', checks: [{ kind: 'output', name: 'sum', expect: '[1] 7' }] as never, fixtures: { files: { 't.csv': 'a,b\n3,x\n4,y\n' } }, constraints: [{ type: 'requires', node: 'r:read\\.csv', message: 'Read the file.' }], timeoutMs: 60000 });
    expect(res.passed).toBe(true);
    const loop = await r.run({ language: 'r', code: 'while (TRUE) {}', timeoutMs: 3000 });
    expect(loop.timedOut).toBe(true);
    const after = await r.run({ language: 'r', code: 'print(1 + 1)', timeoutMs: 60000 });
    expect(after.stdout).toBe('[1] 2');
  }, 180000);
});
