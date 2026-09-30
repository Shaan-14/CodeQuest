/**
 * Validates the curriculum as data AND as executable behaviour, using real Python (Pyodide in Node).
 * For every challenge: the starter must not already pass, every reference solution must pass,
 * every known-wrong attempt must fail, and no hint may contain a complete solution.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import { bundles, challenges, getChallenge, getLesson, lessons, objectives, skills, variantsOf } from './index';
import { databasesUsedBy, objectiveOf } from './helpers';
import { getDatabase, sourcesFor } from './databases';
import { areas, items, quests, achievementDefs } from './world';
import { solutions as solutionsPhase1 } from './python/solutions.testdata';
import { solutionsPhase2Python } from './python/solutions.phase2.testdata';
import { solutionsSql } from './sql/solutions.testdata';
import { solutionsPhase3Python } from './python/solutions.phase3.testdata';
import { solutionsPhase3Sql } from './sql/solutions.phase3.testdata';
import { solutionsPhase4Python } from './python/solutions.phase4.testdata';

const solutions: Record<string, { valid: string[]; wrong: string[] }> = { ...solutionsPhase1, ...solutionsPhase2Python, ...solutionsSql, ...solutionsPhase3Python, ...solutionsPhase3Sql, ...solutionsPhase4Python };
import { createPythonEngine, type PythonEngine } from '../learning/python/pythonEngine';

let engine: PythonEngine;
beforeAll(async () => {
  engine = createPythonEngine((await loadPyodide()) as never);
}, 60_000);

const grade = (code: string, id: string) => {
  const c = getChallenge(id)!;
  return engine.grade({
    language: c.language, code, checks: c.checks, constraints: c.constraints, fixtures: c.fixtures,
    sources: sourcesFor(databasesUsedBy(c)), db: c.db,
  });
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
      const stepObjectives = new Set(b.lesson.steps.flatMap((s) => (s.kind === 'challenge' ? [objectiveOf(b.challenges.find((c) => c.id === s.challengeId)!)] : [])));
      // Every challenge is either in a lesson step, or a VARIANT of an objective that is.
      for (const c of b.challenges) expect(stepObjectives.has(objectiveOf(c)), `${c.id} is neither a step nor a variant of one`).toBe(true);
    }
  });
  it('variants of an objective test the same thing in different settings', () => {
    let withVariants = 0;
    for (const o of objectives) {
      const vs = variantsOf(o.id);
      expect(vs.length, o.id).toBeGreaterThan(0);
      expect(o.title.length, o.id).toBeGreaterThan(3);
      if (vs.length < 2) continue;
      withVariants++;
      const first = vs[0]!;
      for (const v of vs) {
        expect(v.mode, `${v.id} mode`).toBe(first.mode);
        expect(v.difficulty, `${v.id} difficulty`).toBe(first.difficulty);
        expect(v.language, `${v.id} language`).toBe(first.language);
        expect([...v.skillIds].sort(), `${v.id} skills`).toEqual([...first.skillIds].sort());
        expect([...v.concepts].sort(), `${v.id} concepts`).toEqual([...first.concepts].sort());
      }
      expect(new Set(vs.map((v) => v.context)).size, `${o.id}: variants must differ in real-world context`).toBe(vs.length);
      expect(new Set(vs.map((v) => v.prompt)).size, `${o.id}: distinct prompts`).toBe(vs.length);
      expect(new Set(vs.map((v) => JSON.stringify(v.checks))).size, `${o.id}: distinct tests`).toBe(vs.length);
      // Each variant needs its own hidden checks where the primary has them.
      const hidden = (c: typeof first) => c.checks.some((k) => 'visible' in k && k.visible === false);
      if (hidden(first)) for (const v of vs) expect(hidden(v), `${v.id} needs hidden cases`).toBe(true);
    }
    expect(withVariants).toBeGreaterThanOrEqual(10);
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
    for (const sk of skills) {
      const capable = challenges.filter((c) => c.mode !== 'learning' && c.skillIds.includes(sk.id));
      const r = sk.masteryRequirements;
      expect(new Set(capable.map((c) => c.id)).size, `${sk.id}: distinct challenges`).toBeGreaterThanOrEqual(Math.max(r.distinctChallenges, r.independentPasses));
      expect(new Set(capable.map((c) => objectiveOf(c))).size, `${sk.id}: distinct objectives`).toBeGreaterThanOrEqual(r.distinctObjectives ?? 1);
      expect(new Set(capable.map((c) => c.context)).size, `${sk.id}: distinct contexts`).toBeGreaterThanOrEqual(r.distinctContexts ?? 1);
      expect(capable.some((c) => c.difficulty >= r.minDifficulty), `${sk.id}: difficulty`).toBe(true);
    }
  });
  it('every skill is exercised by at least one challenge, and every challenge skill exists', () => {
    const used = new Set(challenges.flatMap((c) => c.skillIds));
    for (const sk of skills) expect(used.has(sk.id), `${sk.id} has no challenges`).toBe(true);
  });
  it('databases referenced by challenges and demos exist', () => {
    for (const c of challenges) for (const id of databasesUsedBy(c)) expect(getDatabase(id), `${c.id} -> ${id}`).toBeDefined();
    for (const l of lessons) for (const st of l.steps) if (st.kind === 'demo') {
      if (st.db) expect(getDatabase(st.db), `${l.id} demo db`).toBeDefined();
      for (const d of st.fixtures?.databases ?? []) expect(getDatabase(d.split(':')[0]!), `${l.id} demo fixture ${d}`).toBeDefined();
    }
  });
  it('uses a variety of real-world contexts, not only baseball', () => {
    const contexts = new Set(challenges.map((c) => c.context));
    for (const k of ['engineering', 'business', 'finance', 'science', 'manufacturing', 'automation', 'games', 'data analysis']) expect(contexts.has(k), k).toBe(true);
    // Baseball is occasional flavour, never the curriculum.
    expect(challenges.filter((c) => c.context === 'baseball').length / challenges.length).toBeLessThan(0.05);
  });
});

describe('SQL challenges are well formed', () => {
  const sqlChallenges = challenges.filter((c) => c.language === 'sql');
  it('every reference query returns rows (a check can never pass vacuously) on visible and hidden data', () => {
    for (const c of sqlChallenges) {
      for (const k of c.checks) {
        if (k.kind !== 'sqlResult') continue;
        const db = k.db ?? c.db!;
        const r = engine.run({ language: 'sql', code: k.expectQuery, db, sources: sourcesFor([db]) });
        expect(r.error, `${c.id}/${k.name}: ${r.error}`).toBe('');
        expect(r.sql!.at(-1)!.rows!.length, `${c.id}/${k.name} expects at least one row on ${db}`).toBeGreaterThan(0);
      }
    }
  });
  it('every SQL challenge names a database and every hidden twin has the same schema', () => {
    for (const c of sqlChallenges) {
      expect(c.db, c.id).toBeTruthy();
      for (const k of c.checks) if ('db' in k && k.db && k.db !== c.db) expect(getDatabase(k.db)!.tables, `${c.id}: ${k.db}`).toEqual(getDatabase(c.db!)!.tables);
    }
  });
  it('result checks include a hidden twin (to defeat hard-coded answers)', () => {
    for (const c of sqlChallenges) {
      const results = c.checks.filter((k) => k.kind === 'sqlResult');
      if (results.length) expect(results.some((k) => 'visible' in k && k.visible === false), `${c.id} needs a hidden-data check`).toBe(true);
    }
  });
});

describe('challenges behave correctly in real Python', () => {
  it('has reference solutions for every challenge', () => {
    for (const c of challenges.filter((x) => x.language !== 'web')) expect(solutions[c.id], c.id).toBeDefined();
    for (const id of Object.keys(solutions)) expect(getChallenge(id), id).toBeDefined();
  });
  // Web challenges (language 'web') run in a real browser: see content/web/web.test.ts.
  for (const c of challenges.filter((x) => x.language !== 'web')) {
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
        if (s.kind !== 'demo' || s.language === 'web') continue;
        const lang = s.language ?? l.language;
        const r = engine.run({ language: lang, code: s.code, stdin: s.stdin, fixtures: s.fixtures, db: s.db, sources: sourcesFor([...(s.fixtures?.databases ?? []).map((d) => d.split(':')[0]!), ...(s.db ? [s.db] : [])]) });
        expect(r.ok, `${l.id}: ${s.title}: ${r.error}`).toBe(!s.expectsError);
      }
    }
  });
});
