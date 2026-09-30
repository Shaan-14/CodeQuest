import { describe, expect, it } from 'vitest';
import { lessons } from '../content';
import { newSave, type SaveData, type Weakness } from '../core/save';
import * as A from './actions';
import { pickDaily } from './dailySelect';

const at = (throughLesson: string): SaveData => {
  let s = A.acceptQuest(A.createPlayer(newSave(), 'Ada', 'spellwright').save, 'wake-the-robot').save;
  for (const l of lessons) {
    s = A.completeLesson(s, l.id).save;
    if (l.id === throughLesson) break;
  }
  return s;
};

const comboWeakness = (skillIds: string[]): Weakness => ({
  id: 'w1', key: skillIds.slice().sort().join('+'), skillIds, kind: 'combination', severity: 'moderate', status: 'open', source: 'lesson',
  exposedBy: { challengeId: 'x', objectiveId: 'x', context: 'x', at: new Date().toISOString() }, detectedAt: new Date().toISOString(), failures: 2, hintsUsed: 0, hintLevels: [],
  mistakes: [], reasons: [], previousIndependent: 2, struggledIn: [], planIds: [],
});

describe('daily challenges and weak combinations', () => {
  it('prefers a challenge that combines the skills of an open weak combination, and says so', () => {
    const s = at('py-15-lists');
    s.training.weaknesses.push(comboWeakness(['py.loops', 'py.lists']));
    const pick = pickDaily(s, Date.now())!;
    expect(pick).not.toBeNull();
    expect(pick.challenge.skillIds).toEqual(expect.arrayContaining(['py.loops', 'py.lists']));
    expect(pick.reason).toMatch(/together/);
  });
  it('without a weakness the pick is unchanged (deterministic, explainable)', () => {
    const s = at('py-15-lists');
    const a = pickDaily(s, 1_700_000_000_000)!;
    const b = pickDaily(structuredClone(s), 1_700_000_000_000)!;
    expect(a.challenge.id).toBe(b.challenge.id);
    expect(a.reason.length).toBeGreaterThan(10);
  });
});
