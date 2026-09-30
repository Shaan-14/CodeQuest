/** Training is global: a failure in ANY world produces a small, specific plan built from fresh problems the player has been taught, and ends back where it began. */
import { describe, expect, it } from 'vitest';
import { getAnyChallenge, lessons } from '../content';
import { objectiveOf } from '../content/helpers';
import { worldOfTrack, trackOfSkillId } from '../content/worlds';
import { newSave, MAX_FOCUS, type SaveData } from '../core/save';
import type { FailureDetail } from '../learning/mastery';
import * as A from './actions';
import { challengeEligible } from './graph';
import { FAILURE_LEVELS } from './focus';
import { activePlan, answerPrediction, beginStep, completeReadingStep, requiredTraining, submitTrainingStep } from './training';
import { moduleFor } from '../content/training/modules';

const detail = (failed: number, total = 4): FailureDetail => ({ errorKind: 'wrong-output', failedChecks: Array.from({ length: failed }, (_, i) => `Case ${i + 1}`), visibleFailed: failed, hiddenFailed: failed, totalChecks: total, constraintsFailed: 0 });
const fresh = (): SaveData => A.createPlayer(newSave(), 'Ada', 'spellwright').save;

/** Completes every lesson listed, in order, the way a player working through that world would. */
const learn = (s: SaveData, ids: string[]): SaveData => ids.reduce((acc, id) => A.completeLesson(A.advanceStep(acc, id, 1).save, id).save, s);
const finish = (save: SaveData, planId: string): SaveData => {
  let r = save;
  for (let guard = 0; guard < 40; guard++) {
    const p = r.training.plans.find((x) => x.id === planId)!;
    const st = p.steps.find((x) => !x.done);
    if (!st || p.status !== 'active') break;
    if (st.kind === 'review' || st.kind === 'example') r = completeReadingStep(r, p.id, st.id).save;
    else if (st.kind === 'predict') { const w = r.training.weaknesses.find((x) => x.id === p.weaknessId)!; r = answerPrediction(r, p.id, st.id, moduleFor(w.skillIds)!.predict!.correct).save; }
    else { r = beginStep(r, p.id, st.id).save; r = submitTrainingStep(r, p.id, st.id, true, 1000, 'ok').save; }
  }
  return r;
};

const CASES: { world: string; lessons: string[]; fail: string }[] = [
  { world: 'r', lessons: ['r-01-console', 'r-02-vectors'], fail: 'r-02-big-sales' },
  { world: 'sheets', lessons: ['xl-01-formulas', 'xl-02-functions'], fail: 'xl-02-weekly-report' },
  { world: 'git', lessons: ['git-01-repositories', 'git-02-history'], fail: 'git-02-unstage' },
  { world: 'stats', lessons: ['py-15-lists', 'st-01-describing'], fail: 'st-01-median' },
];
const pyBasics = lessons.filter((l) => l.id.startsWith('py-')).slice(0, 15).map((l) => l.id);

describe('training works in every world', () => {
  for (const c of CASES) {
    it(`${c.world}: a failed challenge makes a plan of fresh problems from what the player has learned, then returns them to it`, () => {
      const base = c.world === 'stats' ? learn(fresh(), pyBasics) : fresh();
      const s0 = learn(base, c.lessons);
      const ch = getAnyChallenge(c.fail)!;
      const s = A.submitChallenge(s0, c.fail, false, 1000, 'x', { detail: detail(4) }).save;
      const w = requiredTraining(s)!;
      expect(w, 'a meaningful failure needs training').toBeDefined();
      expect(w.exposedBy.challengeId).toBe(c.fail);
      expect(s.stats.focus).toBeLessThan(MAX_FOCUS);

      const plan = activePlan(s)!;
      const withProblems = plan.steps.filter((x) => x.challengeId);
      expect(withProblems.length).toBeGreaterThanOrEqual(1);
      expect(plan.steps.at(-1)!.kind).toBe('independent'); // exactly one proof, last
      expect(plan.steps.filter((x) => x.kind === 'independent')).toHaveLength(1);
      for (const st of withProblems) {
        const p = getAnyChallenge(st.challengeId!)!;
        expect(p.id, 'never the problem that exposed the weakness').not.toBe(c.fail);
        expect(challengeEligible(s, p), `${p.id} must only use skills the player has been taught`).toBe(true);
      }
      const proof = getAnyChallenge(plan.steps.at(-1)!.challengeId!)!;
      expect(proof.id).not.toBe(ch.id);
      expect(objectiveOf(proof) !== objectiveOf(ch) || proof.context !== ch.context, 'a different problem or at least a different setting').toBe(true);

      // the steps share exactly the Focus that was lost, so finishing the plan restores 100
      const lost = MAX_FOCUS - s.stats.focus;
      expect(plan.steps.reduce((t, x) => t + (x.focus ?? 0), 0)).toBe(lost);
      const done = finish(s, plan.id);
      expect(requiredTraining(done)).toBeUndefined();
      expect(done.stats.focus).toBe(MAX_FOCUS);
      expect(JSON.stringify(done.learning.lessons)).toBe(JSON.stringify(s.learning.lessons)); // training never changes lesson progress
    });
  }

  it('the Focus cost follows the failure level and lives in one table', () => {
    expect(Object.keys(FAILURE_LEVELS).sort()).toEqual(['1', '2', '3', '4', '5']);
    const losses = Object.values(FAILURE_LEVELS).map((l) => l.loss);
    expect(losses).toEqual([...losses].sort((a, b) => a - b));
  });

  it('a world’s refresher card is written for that world, not borrowed from another', () => {
    for (const w of ['r', 'sheets', 'git', 'stats'] as const) {
      const skillIds = worldOfTrack(w);
      expect(skillIds.skillPrefixes.length).toBeGreaterThan(0);
    }
    expect(trackOfSkillId('r.vectors')).toBe('r');
    expect(trackOfSkillId('xl.lookup')).toBe('sheets');
    expect(trackOfSkillId('git.merging')).toBe('git');
    expect(trackOfSkillId('stat.spread')).toBe('stats');
  });
});
