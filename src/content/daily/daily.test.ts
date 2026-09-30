/**
 * Validates every authored Daily Challenge in real Python/SQLite: metadata rules (independent-style, no hints,
 * required lessons exist), the starter fails, reference solutions pass, plausible wrong attempts fail.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import { createPythonEngine, type PythonEngine } from '../../learning/python/pythonEngine';
import { sourcesFor } from '../databases';
import { challenges, getLesson, skills } from '../index';
import { databasesUsedBy } from '../helpers';
import { dailyChallenges as allDailies } from './index';
import { dailySolutions } from './solutions.testdata';

/** Web dailies run in real Chromium: see content/web/web.test.ts. */
const dailyChallenges = allDailies.filter((c) => c.language === 'python' || c.language === 'sql');
let engine: PythonEngine;
beforeAll(async () => {
  engine = createPythonEngine((await loadPyodide()) as never);
}, 60_000);

const grade = (code: string, id: string) => {
  const c = dailyChallenges.find((x) => x.id === id)!;
  return engine.grade({ language: c.language, code, checks: c.checks, constraints: c.constraints, fixtures: c.fixtures, sources: sourcesFor(databasesUsedBy(c)), db: c.db });
};

describe('daily challenge metadata', () => {
  it('has unique ids that do not collide with lesson challenges', () => {
    const ids = dailyChallenges.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(challenges.some((c) => c.id === id)).toBe(false);
  });
  it('are independent-style: no hints, hidden checks, real skills and lessons, no answers in the prompt', () => {
    for (const c of dailyChallenges) {
      expect(c.mode, c.id).toBe('independent');
      expect(c.hints, c.id).toEqual([]);
      expect(c.concepts, c.id).toEqual([]);
      expect(c.checks.length, c.id).toBeGreaterThan(0);
      expect(c.checks.every((k) => !('visible' in k) || k.visible === false), `${c.id}: daily checks are all hidden (no expected output is ever shown)`).toBe(true);
      expect(c.daily, c.id).toBeDefined();
      for (const l of c.daily!.requires) expect(getLesson(l), `${c.id} requires ${l}`).toBeDefined();
      for (const s of c.skillIds) expect(skills.some((k) => k.id === s), `${c.id} skill ${s}`).toBe(true);
      expect(c.context, c.id).toBeTruthy();
      expect(c.guidedSteps, c.id).toBeUndefined();
    }
  });
  it('web dailies are independent-style too', () => {
    const webOnes = allDailies.filter((c) => c.language === 'web');
    expect(webOnes.length).toBeGreaterThanOrEqual(20);
    for (const c of webOnes) {
      expect(c.mode, c.id).toBe('independent');
      expect(c.hints, c.id).toEqual([]);
      expect(c.concepts, c.id).toEqual([]);
      expect(c.checks.every((k) => 'visible' in k && k.visible === false), `${c.id}: all checks hidden`).toBe(true);
      for (const l of c.daily!.requires) expect(getLesson(l), `${c.id} requires ${l}`).toBeDefined();
      for (const s of c.skillIds) expect(skills.some((k) => k.id === s), `${c.id} skill ${s}`).toBe(true);
    }
    const skillsCovered = new Set(webOnes.flatMap((c) => c.skillIds));
    for (const s of ['web.html', 'web.forms', 'web.css', 'web.layout', 'js.basics', 'js.data', 'js.dom', 'js.forms', 'js.async', 'web.http']) expect(skillsCovered.has(s), s).toBe(true);
  });
  it('cover the skills of every phase, with several difficulty levels and varied contexts', () => {
    const covered = new Set(dailyChallenges.flatMap((c) => c.skillIds));
    for (const s of ['py.strings', 'py.lists', 'py.dicts', 'py.records', 'py.debugging', 'de.files', 'de.cleaning', 'sd.oop', 'test.writing', 'sql.select', 'sql.joins', 'sql.advanced', 'sql.modify', 'db.design', 'db.integrity', 'db.performance', 'de.pipelines', 'de.integration']) expect(covered.has(s), s).toBe(true);
    expect(new Set(dailyChallenges.map((c) => c.difficulty)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(dailyChallenges.map((c) => c.context)).size).toBeGreaterThanOrEqual(10);
    expect(dailyChallenges.some((c) => c.daily!.focus === 'review')).toBe(true);
    expect(dailyChallenges.some((c) => c.daily!.focus !== 'review')).toBe(true);
  });
});

describe('daily challenges behave correctly in real Python/SQLite', () => {
  it('has solutions for every daily', () => {
    for (const c of dailyChallenges) expect(dailySolutions[c.id], c.id).toBeDefined();
    for (const id of Object.keys(dailySolutions)) expect(dailyChallenges.some((c) => c.id === id), id).toBe(true);
  });
  for (const c of dailyChallenges) {
    describe(c.id, () => {
      it('starter code does not already pass', () => expect(grade(c.starterCode, c.id).passed).toBe(false));
      dailySolutions[c.id]?.valid.forEach((code, i) => it(`valid solution #${i + 1} passes`, () => {
        const r = grade(code, c.id);
        expect(r.passed, JSON.stringify(r, null, 1)).toBe(true);
      }));
      dailySolutions[c.id]?.wrong.forEach((code, i) => it(`wrong attempt #${i + 1} fails`, () => expect(grade(code, c.id).passed).toBe(false)));
    });
  }
});
