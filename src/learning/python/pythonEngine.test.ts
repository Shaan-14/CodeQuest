import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import { createPythonEngine, type PythonEngine } from './pythonEngine';

let engine: PythonEngine;
beforeAll(async () => {
  engine = createPythonEngine((await loadPyodide()) as never);
}, 60_000);

describe('run', () => {
  it('captures real output', () => {
    const r = engine.run({ code: 'print("hi")\nprint(2 + 3)' });
    expect(r.ok).toBe(true);
    expect(r.stdout).toBe('hi\n5\n');
  });
  it('reports a NameError trimmed to the player code with a line number', () => {
    const r = engine.run({ code: 'x = 1\nprint(y)' });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('NameError');
    expect(r.error).toContain('<your code>');
    expect(r.error).not.toContain('harness');
    expect(r.errorLine).toBe(2);
  });
  it('reports a SyntaxError', () => {
    const r = engine.run({ code: 'print("hello' });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('SyntaxError');
    expect(r.errorLine).toBe(1);
  });
  it('feeds input()', () => {
    const r = engine.run({ code: 'n = input("Name? ")\nprint("Hi " + n)', stdin: ['Sam'] });
    expect(r.stdout).toBe('Name? Sam\nHi Sam\n');
  });
  it('explains missing input', () => {
    const r = engine.run({ code: 'input()' });
    expect(r.error).toContain('Program input');
  });
  it('stops runaway output', () => {
    const r = engine.run({ code: 'while True:\n    print("x")' });
    expect(r.truncated).toBe(true);
    expect(r.error).toContain('too much output');
  });
  it('does not leak state between runs', () => {
    engine.run({ code: 'secret = 1' });
    expect(engine.run({ code: 'print(secret)' }).ok).toBe(false);
  });
});

describe('grade', () => {
  const doubleChecks = [
    { kind: 'call' as const, name: 'a', fn: 'double', args: [4], expect: 8 },
    { kind: 'call' as const, name: 'b', fn: 'double', args: [-3], expect: -6, visible: false },
  ];
  it('accepts different valid implementations', () => {
    for (const code of [
      'def double(x):\n    return x * 2',
      'def double(x):\n    return x + x',
      'def double(n):\n    result = n\n    result = result + n\n    return result',
    ]) {
      expect(engine.grade({ code, checks: doubleChecks }).passed).toBe(true);
    }
  });
  it('fails a wrong implementation and hides hidden expectations', () => {
    const r = engine.grade({ code: 'def double(x):\n    return x * 3', checks: doubleChecks });
    expect(r.passed).toBe(false);
    expect(r.checks[0]!.expected).toBeDefined();
    expect(r.checks[1]!.expected).toBeUndefined();
  });
  it('explains print-instead-of-return', () => {
    const r = engine.grade({ code: 'def double(x):\n    print(x * 2)', checks: doubleChecks });
    expect(r.checks[0]!.message).toContain('return');
  });
  it('checks output with stdin and ignores prompts', () => {
    const checks = [{ kind: 'output' as const, name: 'greet', stdin: ['Ada'], expect: 'Hello, Ada!' }];
    expect(engine.grade({ code: 'n = input("Who? ")\nprint("Hello, " + n + "!")', checks }).passed).toBe(true);
    expect(engine.grade({ code: 'print("Hello, Ada!")', checks }).passed).toBe(true);
    expect(engine.grade({ code: 'print("Hello")', checks }).passed).toBe(false);
  });
  it('checks variables with tolerance', () => {
    const checks = [{ kind: 'variable' as const, name: 'v', variable: 'x', expect: 0.3, approx: 1e-9 }];
    expect(engine.grade({ code: 'x = 0.1 + 0.2', checks }).passed).toBe(true);
    expect(engine.grade({ code: 'y = 1', checks }).checks[0]!.message).toContain('never created');
  });
  it('does not confuse True with 1', () => {
    const checks = [{ kind: 'variable' as const, name: 'v', variable: 'x', expect: true }];
    expect(engine.grade({ code: 'x = 1', checks }).passed).toBe(false);
    expect(engine.grade({ code: 'x = 5 > 3', checks }).passed).toBe(true);
  });
  it('enforces structural constraints', () => {
    const checks = [{ kind: 'output' as const, name: 'o', expect: '1\n2' }];
    const constraints = [{ type: 'requires' as const, node: 'For', message: 'use a loop' }];
    expect(engine.grade({ code: 'print(1)\nprint(2)', checks, constraints }).passed).toBe(false);
    expect(engine.grade({ code: 'for i in range(1, 3):\n    print(i)', checks, constraints }).passed).toBe(true);
    const c2 = [{ type: 'requires' as const, node: 'call:range', message: 'use range' }];
    expect(engine.grade({ code: 'for i in [1, 2]:\n    print(i)', checks, constraints: c2 }).passed).toBe(false);
  });
  it('reports syntax errors without running checks', () => {
    const r = engine.grade({ code: 'def (', checks: doubleChecks });
    expect(r.passed).toBe(false);
    expect(r.error).toContain('SyntaxError');
    expect(r.checks).toEqual([]);
  });
  it('reports a crash inside a check', () => {
    const r = engine.grade({ code: 'def double(x):\n    return x * y', checks: doubleChecks });
    expect(r.checks[0]!.message).toContain('crashed');
  });
});
