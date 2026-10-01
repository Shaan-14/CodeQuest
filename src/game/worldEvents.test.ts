import { describe, expect, it } from 'vitest';
import { challenges, getAnyChallenge, lessons } from '../content';
import { BOSS_EFFECTS, LESSON_EFFECTS } from '../content/worldEffects';
import { PLAY_EFFECTS } from '../content/play/effects';
import { bosses } from '../content/bosses';
import { newSave, type SaveData } from '../core/save';
import * as A from './actions';
import { deriveWorldState } from './worldEvents';

const player = (): SaveData => A.createPlayer(newSave(), 'Ada', 'spellwright').save;
const finalChallengeOf = (lessonId: string) => { const l = lessons.find((x) => x.id === lessonId)!; const last = [...l.steps].reverse().find((s) => s.kind === 'challenge')!; return last.kind === 'challenge' ? getAnyChallenge(last.challengeId)! : undefined!; };
/** A player who has completed everything that comes before `lessonId` in its own world (so its challenges are open to them). */
const readyFor = (lessonId: string): SaveData => {
  const prefix = lessonId.split('-')[0]!;
  let s = player();
  for (const l of lessons) { if (l.id === lessonId) break; if (l.id.startsWith(`${prefix}-`)) s = A.completeLesson(A.advanceStep(s, l.id, 1).save, l.id).save; }
  return s;
};
const effects = (r: { events: { type: string }[] }) => r.events.filter((e) => e.type === 'worldEffect') as { type: 'worldEffect'; target: string; action: string; challengeId: string }[];

describe('world effects: the boundary to any future visual world', () => {
  it('passing the final challenge of a lesson emits its effect once, and only on the first pass', () => {
    const c = finalChallengeOf('git-06-workflow');
    const s0 = readyFor('git-06-workflow');
    const fail = A.submitChallenge(s0, c.id, false, 1000, 'x');
    expect(effects(fail)).toEqual([]); // a failure changes nothing in the world
    const pass = A.submitChallenge(s0, c.id, true, 1000, 'x');
    expect(effects(pass)).toEqual([{ type: 'worldEffect', target: 'vault.door', action: 'open', detail: undefined, challengeId: c.id }]);
    expect(effects(A.submitChallenge(pass.save, c.id, true, 1000, 'x'))).toEqual([]); // passing again is not a second door
  });
  it('the world state is rebuilt from the evidence alone and is identical after a reload', () => {
    const c = finalChallengeOf('xl-08-modelling');
    let s = readyFor('xl-08-modelling');
    expect(deriveWorldState(s)).toEqual({});
    s = A.submitChallenge(s, c.id, true, 1000, 'x').save;
    const state = deriveWorldState(s);
    expect(state['guild.ledger']).toMatchObject({ actions: ['balance'], last: 'balance' });
    expect(deriveWorldState(JSON.parse(JSON.stringify(s)))).toEqual(state);
  });
  it('XP, coins, level and items never appear in the world: only demonstrated work does', () => {
    const s = player();
    s.stats.xp = 99999; s.stats.coins = 99999;
    s.inventory['pixel-pin'] = 1;
    expect(deriveWorldState(s)).toEqual({});
  });
  it('every declared effect is attached to a real challenge, in the area.object / verb naming form', () => {
    const named = /^[a-z]+\.[a-z-]+$/;
    for (const [lessonId, list] of Object.entries(LESSON_EFFECTS)) {
      expect(lessons.some((l) => l.id === lessonId), lessonId).toBe(true);
      expect(finalChallengeOf(lessonId).worldEffects, lessonId).toEqual([...list, ...(PLAY_EFFECTS[lessonId] ?? [])]); // Phase 6 scenes add their own effects to the same lessons
      for (const e of list) { expect(e.target).toMatch(named); expect(e.action).toMatch(/^[a-z-]+$/); }
    }
    for (const [bossId, list] of Object.entries(BOSS_EFFECTS)) {
      expect(bosses.some((b) => b.id === bossId), bossId).toBe(true);
      for (const e of list) expect(e.target).toMatch(named);
    }
    expect(challenges.filter((c) => c.worldEffects).length).toBeGreaterThanOrEqual(Object.keys(LESSON_EFFECTS).length);
  });
  it('a Summit won on any route lights the same beacon', () => {
    for (const v of ['a', 'analytics-a', 'sheets-a', 'r-a']) {
      const id = bosses.find((b) => b.id === 'summit')!.versions.includes(v) ? v : '';
      expect(id).not.toBe('');
    }
    expect(BOSS_EFFECTS.summit).toEqual([{ target: 'summit.beacon', action: 'ignite' }]);
  });
});
