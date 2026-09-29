/**
 * Validates the curriculum as data AND as executable behaviour, using real Python (Pyodide in Node).
 * For every challenge: the starter must not already pass, every reference solution must pass,
 * every known-wrong attempt must fail, and no hint may contain a complete solution.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import { bundles, challenges, getChallenge, getLesson, lessons, skills } from './index';
import { areas, items, quests, achievementDefs } from './world';
import { solutions } from './python/solutions.testdata';
import { createPythonEngine, type PythonEngine } from '../learning/python/pythonEngine';

let engine: PythonEngine;
beforeAll(async () => {
  engine = createPythonEngine((await loadPyodide()) as never);
}, 60_000);

const grade = (code: string, id: string) => {
  const c = getChallenge(id)!;
  return engine.grade({ code, checks: c.checks, constraints: c.constraints });
};

describe('content structure', () => {
  it('has unique ids', () => {
    for (const list of [lessons.map((l) => l.id), challenges.map((c) => c.id), skills.map((s) => s.id), areas.map((a) => a.id), items.map((i) => i.id)]) {
      expect(new Set(list).size).toBe(list.length);
    }
  });
  it('lesson steps reference existing challenges of the same lesson bundle', () => {
    for (const b of bundles) {
      const own = new Set(b.challenges.map((c) => c.id));
      for (const step of b.lesson.steps) if (step.kind === 'challenge') expect(own.has(step.challengeId), `${b.lesson.id} -> ${step.challengeId}`).toBe(true);
      for (const c of b.challenges) expect(b.lesson.steps.some((s) => s.kind === 'challenge' && s.challengeId === c.id), `${c.id} unused`).toBe(true);
    }
  });
  it('prerequisites exist and come earlier', () => {
    lessons.forEach((l, i) => {
      for (const p of l.prerequisites) expect(lessons.findIndex((x) => x.id === p), `${l.id} prereq ${p}`).toBeLessThan(i);
    });
  });
  it('references valid skills, quests, areas and items', () => {
    const skillIds = new Set(skills.map((s) => s.id));
    for (const l of lessons) expect(skillIds.has(l.skillId)).toBe(true);
    for (const c of challenges) for (const s of c.skillIds) expect(skillIds.has(s), `${c.id}:${s}`).toBe(true);
    for (const q of quests) {
      for (const o of q.objectives) expect(getLesson(o.lessonId)).toBeDefined();
      for (const i of q.reward.items ?? []) expect(items.some((x) => x.id === i)).toBe(true);
    }
    for (const a of areas) {
      if (a.lock.type === 'lesson') expect(getLesson(a.lock.lessonId)).toBeDefined();
      if (a.lock.type === 'questAccepted' || a.lock.type === 'questComplete') expect(quests.some((q) => q.id === (a.lock as { questId: string }).questId)).toBe(true);
    }
    expect(achievementDefs.length).toBeGreaterThan(0);
  });
  it('mode rules: guidance shrinks, independent gives nothing away', () => {
    for (const c of challenges) {
      expect([1, 2, 3, 4, 5]).toContain(c.difficulty);
      expect(c.checks.length).toBeGreaterThan(0);
      if (c.mode === 'learning') {
        expect(c.guidedSteps?.length, c.id).toBeGreaterThan(0);
        expect(c.expectedBehavior, c.id).toBeTruthy();
      }
      if (c.mode === 'challenge') expect(c.hints.length, c.id).toBeGreaterThanOrEqual(3);
      if (c.mode === 'independent') {
        expect(c.hints, c.id).toEqual([]);
        expect(c.starterCode, c.id).toBe('');
        expect(c.guidedSteps, c.id).toBeUndefined();
        expect(c.expectedBehavior, c.id).toBeUndefined();
        expect(c.constraints, c.id).toBeUndefined();
        expect(c.concepts, c.id).toEqual([]);
      }
    }
  });
  it('mastery requirements are achievable by the shipped independent-capable challenges', () => {
    for (const s of skills) {
      const capable = challenges.filter((c) => c.mode !== 'learning' && c.skillIds.includes(s.id));
      const r = s.masteryRequirements;
      expect(capable.length, `${s.id} distinct`).toBeGreaterThanOrEqual(r.distinctChallenges);
      expect(capable.some((c) => c.difficulty >= r.minDifficulty), `${s.id} difficulty`).toBe(true);
    }
  });
  it('uses a variety of real-world contexts, not only baseball', () => {
    const contexts = new Set(challenges.map((c) => c.context));
    for (const k of ['engineering', 'business', 'finance', 'science', 'manufacturing', 'automation', 'games', 'data analysis']) expect(contexts.has(k), k).toBe(true);
    expect(challenges.filter((c) => c.context === 'baseball').length).toBeLessThanOrEqual(2);
  });
});

describe('challenges behave correctly in real Python', () => {
  it('has reference solutions for every challenge', () => {
    for (const c of challenges) expect(solutions[c.id], c.id).toBeDefined();
    for (const id of Object.keys(solutions)) expect(getChallenge(id), id).toBeDefined();
  });
  for (const c of challenges) {
    describe(c.id, () => {
      it('starter code does not already pass', () => {
        expect(grade(c.starterCode, c.id).passed).toBe(false);
      });
      solutions[c.id]?.valid.forEach((code, i) => {
        it(`valid solution #${i + 1} passes`, () => {
          const r = grade(code, c.id);
          expect(r.passed, JSON.stringify(r, null, 1)).toBe(true);
        });
      });
      solutions[c.id]?.wrong.forEach((code, i) => {
        it(`wrong attempt #${i + 1} fails`, () => {
          expect(grade(code, c.id).passed).toBe(false);
        });
      });
      it('hints never contain a complete solution', () => {
        for (const h of c.hints) for (const code of solutions[c.id]?.valid ?? []) expect(h.includes(code.trim())).toBe(false);
      });
    });
  }
  it('demo programs run', () => {
    for (const l of lessons) {
      for (const s of l.steps) {
        if (s.kind !== 'demo') continue;
        const r = engine.run({ code: s.code, stdin: s.stdin });
        expect(r.ok, `${l.id}: ${s.title}`).toBe(!s.expectsError);
      }
    }
  });
});
