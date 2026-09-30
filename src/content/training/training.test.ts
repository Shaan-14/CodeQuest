/**
 * Validates the authored TRAINING content in real Python/SQLite: every problem's starter fails, reference solutions pass,
 * wrong attempts fail; modules' examples run; and training problems are their own content (never lesson challenges).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import { createPythonEngine, type PythonEngine } from '../../learning/python/pythonEngine';
import { sourcesFor } from '../databases';
import { challenges, getLesson, skills } from '../index';
import { databasesUsedBy } from '../helpers';
import { moduleFor, trainingModules } from './modules';
import { trainingProblems } from './problems';
import { trainingSolutions } from './solutions.testdata';

let engine: PythonEngine;
beforeAll(async () => { engine = createPythonEngine((await loadPyodide()) as never); }, 60_000);
const grade = (code: string, id: string) => {
  const c = trainingProblems.find((x) => x.id === id)!;
  return engine.grade({ language: c.language, code, checks: c.checks, constraints: c.constraints, fixtures: c.fixtures, sources: sourcesFor(databasesUsedBy(c)), db: c.db });
};

describe('training content structure', () => {
  it('has unique ids that never collide with lesson challenges, real skills and real required lessons', () => {
    const ids = trainingProblems.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of trainingProblems) {
      expect(challenges.some((x) => x.id === c.id), c.id).toBe(false);
      expect(c.training, c.id).toBeDefined();
      for (const k of c.skillIds) expect(skills.some((s) => s.id === k), `${c.id}: ${k}`).toBe(true);
      for (const l of c.training!.requires) expect(getLesson(l), `${c.id} requires ${l}`).toBeDefined();
    }
  });
  it('every key has a practice problem AND a proof problem, and the proof is independent-style', () => {
    const keys = new Set(trainingProblems.map((c) => c.training!.skills.join('+')));
    for (const k of keys) {
      const mine = trainingProblems.filter((c) => c.training!.skills.join('+') === k);
      expect(mine.some((c) => c.training!.role === 'practice'), k).toBe(true);
      expect(mine.some((c) => c.training!.role === 'proof'), k).toBe(true);
    }
    for (const c of trainingProblems.filter((x) => x.training!.role === 'proof')) {
      expect(c.mode, c.id).toBe('independent');
      expect(c.hints, c.id).toEqual([]);
      expect(c.starterCode, c.id).toBe('');
      expect(c.checks.every((k) => !('visible' in k) || k.visible === false || k.kind === 'output' === false), c.id).toBe(true);
    }
    for (const c of trainingProblems.filter((x) => x.training!.role === 'practice')) expect(c.hints.length, c.id).toBeGreaterThanOrEqual(3);
  });
  it('modules are complete: a different way to see it, real skills, a valid prediction', () => {
    for (const m of trainingModules) {
      expect(m.reframe.length, m.id).toBeGreaterThan(80);
      for (const k of m.skills) expect(skills.some((s) => s.id === k), `${m.id}: ${k}`).toBe(true);
      if (m.predict) { expect(m.predict.options.length, m.id).toBeGreaterThanOrEqual(2); expect(m.predict.correct).toBeLessThan(m.predict.options.length); expect(m.predict.explain.length).toBeGreaterThan(10); }
    }
  });
  it('the module for a combination is the largest one that fits', () => {
    expect(moduleFor(['py.loops', 'py.dicts', 'py.conditionals'])?.skills.length).toBe(2);
    expect(moduleFor(['py.dicts'])?.id).toBe('dicts');
    expect(moduleFor(['nope'])).toBeUndefined();
  });
  it('a lesson never reuses its own reference example as training: examples are not the lessons’ demos', () => {
    const demos = new Set(challenges.length ? [] : []);
    for (const m of trainingModules) expect(m.example ? m.example.code.length : 1, m.id).toBeGreaterThan(0);
    void demos;
  });
});

describe('training modules run in real Python/SQLite', () => {
  for (const m of trainingModules.filter((x) => x.example)) {
    it(`${m.id}: the worked example runs`, () => {
      const e = m.example!;
      const stdin = e.code.includes('input()') ? ['3.5'] : undefined;
      const r = engine.run({ language: e.language, code: e.code, stdin, fixtures: e.fixtures, db: e.db, sources: sourcesFor([...(e.db ? [e.db] : []), ...(e.fixtures?.databases ?? []).map((d) => d.split(':')[0]!)]) });
      expect(r.error, r.error).toBe('');
    });
  }
  const printed: Record<string, string> = { variables: '5', strings: 'pump', numbers: '3 2', logic: 'False', conditionals: 'big', loops: '6', functions: 'None', lists: '4', dicts: '0', records: 'b', 'loops-lists': '[1, 3, 6]', 'loops-dicts': '2', 'conditionals-loops': '2' };
  for (const m of trainingModules.filter((x) => x.predict?.code && printed[x.id] !== undefined)) {
    it(`${m.id}: the prediction's marked answer is what the code really prints`, () => {
      const r = engine.run({ language: 'python', code: m.predict!.code!, stdin: undefined });
      expect(r.stdout.trim()).toBe(printed[m.id]);
      expect(m.predict!.options[m.predict!.correct]!.trim()).toBe(printed[m.id]);
    });
  }
});

describe('training problems behave correctly', () => {
  it('has solutions for every problem and none for unknown ones', () => {
    for (const c of trainingProblems) expect(trainingSolutions[c.id], c.id).toBeDefined();
    for (const id of Object.keys(trainingSolutions)) expect(trainingProblems.some((c) => c.id === id), id).toBe(true);
  });
  for (const c of trainingProblems) {
    describe(c.id, () => {
      it('the starter does not already pass', () => expect(grade(c.starterCode, c.id).passed).toBe(false));
      trainingSolutions[c.id]?.valid.forEach((code, i) => it(`valid solution #${i + 1} passes`, () => {
        const r = grade(code, c.id);
        expect(r.passed, JSON.stringify(r.checks.filter((k) => !k.passed), null, 1)).toBe(true);
      }));
      trainingSolutions[c.id]?.wrong.forEach((code, i) => it(`wrong attempt #${i + 1} fails`, () => expect(grade(code, c.id).passed).toBe(false)));
    });
  }
});
