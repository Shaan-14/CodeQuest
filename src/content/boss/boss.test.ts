/**
 * Validates every Boss challenge that runs in Python/SQLite: metadata rules, starter fails, reference solutions
 * pass, plausible wrong attempts fail. Web bosses are run in real Chromium by content/web/web.test.ts.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import { createPythonEngine, type PythonEngine } from '../../learning/python/pythonEngine';
import { sourcesFor } from '../databases';
import { bosses, bossChallengeFor } from '../bosses';
import { challenges, getLesson, skills } from '../index';
import { databasesUsedBy } from '../helpers';
import { bossChallenges as all } from './index';
import { bossSolutions } from './solutions.testdata';

const bossChallenges = all.filter((c) => c.language === 'python' || c.language === 'sql');
let engine: PythonEngine;
beforeAll(async () => {
  engine = createPythonEngine((await loadPyodide()) as never);
}, 60_000);

const grade = (code: string, id: string) => {
  const c = bossChallenges.find((x) => x.id === id)!;
  return engine.grade({ language: c.language, code, checks: c.checks, constraints: c.constraints, fixtures: c.fixtures, sources: sourcesFor(databasesUsedBy(c)), db: c.db });
};

describe('boss definitions', () => {
  it('every boss has its versions, at least two, each an independent-style problem with a different id', () => {
    for (const b of bosses) {
      expect(b.versions.length, b.id).toBeGreaterThanOrEqual(2);
      const ids = b.versions.map((v) => bossChallengeFor(b.id, v)?.id);
      expect(ids.every(Boolean), `${b.id} versions exist`).toBe(true);
      expect(new Set(ids).size, `${b.id} versions differ`).toBe(ids.length);
    }
  });
  it('required lessons and bosses exist, and the campaign ends at the summit', () => {
    for (const b of bosses) {
      for (const l of b.requiresLessons) expect(getLesson(l), `${b.id} requires ${l}`).toBeDefined();
      for (const r of b.requiresBosses) expect(bosses.some((x) => x.id === r), `${b.id} requires boss ${r}`).toBe(true);
    }
    expect(bosses.filter((b) => b.kind === 'summit')).toHaveLength(1);
    expect(bosses.filter((b) => b.kind === 'mastery').map((b) => b.track).sort()).toEqual(['data-eng', 'python', 'sql', 'web']);
    expect(bosses.find((b) => b.kind === 'summit')!.requiresBosses.length).toBe(4);
  });
  it('boss problems are never lesson content and follow the independent rules', () => {
    for (const c of all) {
      expect(challenges.some((x) => x.id === c.id), `${c.id} is not a lesson challenge`).toBe(false);
      expect(c.mode, c.id).toBe('independent');
      expect(c.hints, c.id).toEqual([]);
      expect(c.concepts, c.id).toEqual([]);
      expect(c.starterCode, c.id).toBe('');
      expect(c.boss, c.id).toBeDefined();
      expect(c.checks.length, c.id).toBeGreaterThan(0);
      expect(c.checks.every((k) => !('visible' in k) || k.visible === false), `${c.id}: every check hidden`).toBe(true);
      for (const s of c.skillIds) expect(skills.some((k) => k.id === s), `${c.id} skill ${s}`).toBe(true);
    }
  });
  it('versions of one boss share skills and use different contexts or data', () => {
    for (const b of bosses) {
      const cs = b.versions.map((v) => bossChallengeFor(b.id, v)!);
      const shared = cs[0]!.skillIds.filter((k) => cs.every((c) => c.skillIds.includes(k)));
      expect(shared.length, `${b.id} versions test overlapping skills`).toBeGreaterThan(0);
      expect(new Set(cs.map((c) => c.prompt)).size).toBe(cs.length);
    }
  });
});

describe('boss challenges behave correctly in real Python/SQLite', () => {
  it('has solutions for every non-web boss problem and none for unknown ones', () => {
    for (const c of bossChallenges) expect(bossSolutions[c.id], c.id).toBeDefined();
    for (const id of Object.keys(bossSolutions)) expect(bossChallenges.some((c) => c.id === id), id).toBe(true);
  });
  for (const c of bossChallenges) {
    describe(c.id, () => {
      it('starter code does not already pass', () => expect(grade(c.starterCode, c.id).passed).toBe(false));
      bossSolutions[c.id]?.valid.forEach((code, i) => it(`valid solution #${i + 1} passes`, () => {
        const r = grade(code, c.id);
        expect(r.passed, JSON.stringify(r, null, 1)).toBe(true);
      }));
      bossSolutions[c.id]?.wrong.forEach((code, i) => it(`wrong attempt #${i + 1} fails`, () => expect(grade(code, c.id).passed).toBe(false)));
    });
  }
});
