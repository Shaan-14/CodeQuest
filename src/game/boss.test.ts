import { describe, expect, it } from 'vitest';
import { lessons } from '../content';
import { bosses, getBoss } from '../content/bosses';
import { loadSave, migrate, newSave, sanitizeBosses, SAVE_VERSION, writeSave, type SaveData } from '../core/save';
import { summarizeSkill } from '../learning/mastery';
import { getSkill } from '../content';
import * as A from './actions';
import { bossLockReason, bossStatus, campaignProgress, currentBossChallenge, defaultRoute, nextVersion, openRoutes, sealingWeakness, submitBoss } from './boss';
import { moduleFor } from '../content/training/modules';
import { FAILURE_LEVELS } from './focus';
import { activePlan, answerPrediction, beginStep, completeReadingStep, submitTrainingStep, weaknessOf } from './training';

const started = () => A.acceptQuest(A.createPlayer(newSave(), 'Ada', 'spellwright').save, 'wake-the-robot').save;
const completeThrough = (s: SaveData, lessonId: string): SaveData => {
  let out = s;
  for (const l of lessons) {
    out = A.completeLesson(out, l.id).save;
    if (l.id === lessonId) break;
  }
  return out;
};
const fail = (s: SaveData, id: string) => submitBoss(s, id, false, 5000, { errorKind: 'wrong-output', failedChecks: ['Case 2', 'Case 3'], visibleFailed: 0, hiddenFailed: 2, totalChecks: 5, constraintsFailed: 0 });
const mini = () => getBoss('mini-python-functions')!;
const atGate = () => completeThrough(started(), 'py-14-independent-trial');

/** Finishes the active training plan by passing every step (the way a player who learned it would). */
function finishPlan(save: SaveData): SaveData {
  let s = save;
  for (let guard = 0; guard < 40; guard++) {
    const p = activePlan(s);
    if (!p) break;
    const st = p.steps.find((x) => !x.done);
    if (!st) break;
    if (st.kind === 'review' || st.kind === 'example') s = completeReadingStep(s, p.id, st.id).save;
    else if (st.kind === 'predict') s = answerPrediction(s, p.id, st.id, moduleFor(weaknessOf(s, p.weaknessId)!.skillIds)!.predict!.correct).save;
    else { s = beginStep(s, p.id, st.id).save; s = submitTrainingStep(s, p.id, st.id, true, 1000, 'x').save; }
  }
  return s;
}

describe('boss gates', () => {
  it('a boss is locked until its lessons are done, then ready', () => {
    expect(bossStatus(started(), mini())).toBe('locked');
    expect(bossStatus(atGate(), mini())).toBe('ready');
  });
  it('mastery bosses also need their mini-boss, and the summit needs any three mastery guardians and an open route', () => {
    const s = completeThrough(started(), 'py-28-independent-review-b');
    expect(bossStatus(s, getBoss('mastery-python')!)).toBe('locked');
    expect(getBoss('summit')!.requiresBosses).toEqual([]);
    expect(getBoss('summit')!.requiresAnyOf!.count).toBe(3);
    expect(bossStatus(s, getBoss('summit')!)).toBe('locked');
  });
});

describe('the Summit is open-ended: any three guardians, then a route in a technology the player has mastered', () => {
  const summit = () => getBoss('summit')!;
  const beaten = (s: SaveData, ...ids: string[]): SaveData => { const out = structuredClone(s); for (const id of ids) out.bosses[id] = { attempts: [], passedAt: '2026-01-01T00:00:00.000Z' }; return out; };
  it('three guardians are not enough without a route; the lock reason names what is missing', () => {
    const s = beaten(started(), 'mastery-web', 'mastery-analytics', 'mastery-python'); // analytics gives a route
    expect(bossStatus(s, summit())).toBe('ready');
    const noRoute = beaten(started(), 'mastery-web', 'mastery-python', 'mastery-data-eng'); // python without sql opens no route
    expect(openRoutes(noRoute, summit())).toEqual([]);
    expect(bossStatus(noRoute, summit())).toBe('locked');
    expect(bossLockReason(noRoute, summit())).toMatch(/route/i);
    expect(bossLockReason(beaten(started(), 'mastery-web'), summit())).toMatch(/any 3 .*1 so far/);
  });
  it('a player who never touched Python can reach the Summit through spreadsheets, R and analytics', () => {
    const s = beaten(started(), 'mastery-sheets', 'mastery-r', 'mastery-analytics');
    expect(bossStatus(s, summit())).toBe('ready');
    expect(openRoutes(s, summit()).map((r) => r.id).sort()).toEqual(['analytics', 'r', 'sheets']);
  });
  it('the route chosen decides the problem, a retry stays in the route with a NEW version, and the campaign ends on any route', () => {
    const s = beaten(started(), 'mastery-sheets', 'mastery-r', 'mastery-analytics');
    expect(currentBossChallenge(s, summit(), 'r')!.id).toBe('boss-r-summit-a');
    expect(currentBossChallenge(s, summit(), 'sheets')!.language).toBe('sheet');
    const failed = submitBoss(s, 'summit', false, 1000, { errorKind: 'wrong-output', failedChecks: ['Case 1'], visibleFailed: 0, hiddenFailed: 1, totalChecks: 4, constraintsFailed: 0 }, 'r').save;
    expect(failed.bosses.summit!.attempts.at(-1)!.version).toBe('r-a');
    expect(failed.stats.focus).toBeLessThan(100);
    const back = finishPlan(failed);
    expect(defaultRoute(back, summit())!.id).toBe('r'); // the route last attempted is offered again
    expect(nextVersion(back, summit(), 'r')).toBe('r-b'); // never the same problem
    expect(nextVersion(back, summit(), 'sheets')).toBe('sheets-a'); // another route is still fresh
    const won = submitBoss(back, 'summit', true, 1000, undefined, 'sheets').save;
    expect(won.campaign.completedAt).toBeDefined();
    expect(won.bosses.summit!.attempts.at(-1)!.version).toBe('sheets-a');
  });
  it('a route the player has not earned cannot be chosen', () => {
    const s = beaten(started(), 'mastery-sheets', 'mastery-web', 'mastery-python');
    expect(currentBossChallenge(s, summit(), 'r')!.language).toBe('sheet'); // falls back to an open route
    expect(nextVersion(s, summit(), 'data')).toBe('sheets-a');
  });
});

describe('boss remediation', () => {
  it('a failed boss is diagnosed, sealed, and starts training that returns to the boss gate', () => {
    const s = fail(atGate(), mini().id).save;
    expect(bossStatus(s, mini())).toBe('sealed');
    const st = s.bosses[mini().id]!;
    expect(st.attempts).toHaveLength(1);
    expect(st.attempts[0]!.passed).toBe(false);
    expect(st.attempts[0]!.weaknessIds).toHaveLength(1);
    const plan = activePlan(s)!;
    expect(plan.returnTo).toEqual({ kind: 'boss', bossId: mini().id });
    const last = s.evidence[s.evidence.length - 1]!;
    expect(last.source).toBe('boss');
    expect(last.support === 'independent' || last.support === 'transfer').toBe(true);
    expect(last.boss).toEqual({ bossId: mini().id, version: 'a' });
  });
  it('a sealed boss cannot be attempted again: a failure costs Focus and the boss needs 100', () => {
    const before = atGate();
    const failed = fail(before, mini().id).save;
    expect(failed.stats.focus).toBe(before.stats.focus - FAILURE_LEVELS[4].loss);
    const again = fail(failed, mini().id).save;
    expect(again.bosses[mini().id]!.attempts).toHaveLength(1);
    expect(submitBoss(failed, mini().id, true, 1, undefined).save.bosses[mini().id]!.passedAt).toBeUndefined();
  });
  it('after the training the boss offers a NEW version, never the same problem', () => {
    const failed = fail(atGate(), mini().id).save;
    const first = currentBossChallenge(atGate(), mini())!.id;
    const trained = finishPlan(failed);
    expect(sealingWeakness(trained, mini())).toBeUndefined();
    expect(bossStatus(trained, mini())).toBe('ready');
    expect(nextVersion(trained, mini())).toBe('b');
    expect(currentBossChallenge(trained, mini())!.id).not.toBe(first);
  });
  it('winning records rewards and independent evidence, never a mastery mark', () => {
    let s = atGate();
    const xp = s.stats.xp;
    s = submitBoss(s, mini().id, true, 3000).save;
    expect(bossStatus(s, mini())).toBe('passed');
    expect(s.stats.xp).toBe(xp + mini().reward.xp);
    expect(s.evidence[s.evidence.length - 1]!.source).toBe('boss');
    // One boss pass is one piece of evidence: mastery of a skill still needs variety over time.
    expect(summarizeSkill(s.evidence, getSkill('py.lists')!).status).not.toBe('mastered');
  });
  it('repeated failure escalates the same weakness rather than starting over, and there is no lockout', () => {
    let s = fail(atGate(), mini().id).save;
    const firstId = s.bosses[mini().id]!.remediationWeaknessId!;
    s = finishPlan(s);
    s = fail(s, mini().id).save;
    expect(s.bosses[mini().id]!.attempts.map((a) => a.version)).toEqual(['a', 'b']);
    // The first weakness was resolved by its training (history is kept); the new failure is a NEW, better-informed one.
    expect(s.training.weaknesses.find((x) => x.id === firstId)!.status).toBe('resolved');
    const second = s.training.weaknesses.find((x) => x.id === s.bosses[mini().id]!.remediationWeaknessId)!;
    expect(second.id).not.toBe(firstId);
    expect(second.failures).toBeGreaterThanOrEqual(2);
    expect(bossStatus(s, mini())).toBe('sealed');
    // All versions used: training again offers the oldest attempt again (documented limitation) rather than a dead end.
    s = finishPlan(s);
    expect(bossStatus(s, mini())).toBe('ready');
  });
  it('training a boss failure never moves lesson progress backward', () => {
    const s0 = atGate();
    const snap = JSON.stringify(s0.learning.lessons);
    const s = fail(s0, mini().id).save;
    expect(JSON.stringify(s.learning.lessons)).toBe(snap);
  });
});

describe('the campaign ending', () => {
  it('passing the summit boss completes the campaign exactly once', () => {
    let s = atGate();
    for (const b of bosses) s.bosses[b.id] = { attempts: [], passedAt: new Date().toISOString() };
    delete s.bosses['summit'];
    expect(campaignProgress(s).done).toBe(false);
    const r = submitBoss(s, 'summit', true, 1000);
    expect(r.events.some((e) => e.type === 'campaignComplete')).toBe(true);
    expect(r.save.campaign.completedAt).toBeDefined();
    const stamp = r.save.campaign.completedAt;
    expect(submitBoss(r.save, 'summit', true, 1000).save.campaign.completedAt).toBe(stamp);
    expect(campaignProgress(r.save).done).toBe(true);
  });
});

describe('boss save and load', () => {
  it('survives a save/load round trip, including the sealed state', () => {
    const s = fail(atGate(), mini().id).save;
    const mem = new Map<string, string>();
    const st = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    writeSave(st, s);
    const back = loadSave(st).save;
    expect(back.bosses[mini().id]).toEqual(s.bosses[mini().id]);
    expect(bossStatus(back, mini())).toBe('sealed');
  });
  it('a v4 save gains empty boss and campaign blocks and keeps its evidence', () => {
    const v4 = { ...structuredClone(atGate()), version: 4 } as Record<string, unknown>;
    delete v4.bosses; delete v4.campaign; delete v4.training;
    const m = migrate(v4)!;
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.bosses).toEqual({});
    expect(m.campaign).toEqual({});
  });
  it('repairs corrupt boss blocks', () => {
    expect(sanitizeBosses(null)).toEqual({});
    expect(sanitizeBosses({ x: { attempts: 'no' }, y: { attempts: [{ version: 'a', challengeId: 'c', at: 't', passed: false }], remediationWeaknessId: 7 } })).toEqual({ y: { attempts: [{ version: 'a', challengeId: 'c', at: 't', passed: false, weaknessIds: [] }], passedAt: undefined, remediationPlanId: undefined, remediationWeaknessId: undefined } });
  });
});
