import { describe, expect, it } from 'vitest';
import { challenges } from '../content';
import { newSave, type SaveData } from '../core/save';
import type { EvidenceRecord } from '../learning/mastery';
import * as A from './actions';
import { DAY_MS, reviewSchedule, reviewsDue, STREAK_INTERVAL_DAYS } from './retention';
import { visitArea, unvisitedFoundations } from './explore';

const T0 = Date.parse('2026-03-01T09:00:00Z');
const skillsOf = (id: string) => challenges.find((c) => c.id === id)?.skillIds;
const ch = challenges.find((c) => c.id === 'py-16-stock-lookup')!;
const SKILL = ch.skillIds[0]!;

const base = (): SaveData => A.createPlayer(newSave(), 'Ada', 'wizard').save;
const ev = (daysAgo: number, over: Partial<EvidenceRecord> = {}): EvidenceRecord => ({
  at: new Date(T0 - daysAgo * DAY_MS).toISOString(), challengeId: ch.id, objectiveId: ch.objectiveId ?? ch.id, context: ch.context ?? '', skillIds: ch.skillIds, concepts: ch.concepts,
  mode: 'challenge', difficulty: 3, passed: true, support: 'independent', hintsUsed: 0, lookups: 0, attemptNumber: 1, priorFailures: 0, project: false, timeMs: 1000, executed: true, ...over,
});
const withEvidence = (...records: EvidenceRecord[]): SaveData => { const s = base(); s.evidence.push(...records); return s; };
const stateOf = (s: SaveData) => reviewSchedule(s, T0, skillsOf).find((r) => r.skill.id === SKILL)!;

describe('spaced review: the schedule is computed from the evidence and always explains itself', () => {
  it('the interval grows with consecutive independent, hint-free passes', () => {
    const intervals = [1, 2, 3, 4, 5].map((n) => stateOf(withEvidence(...Array.from({ length: n }, (_, i) => ev(10 - i)))).intervalDays);
    expect(intervals).toEqual([STREAK_INTERVAL_DAYS[1], STREAK_INTERVAL_DAYS[2], STREAK_INTERVAL_DAYS[3], STREAK_INTERVAL_DAYS[4], STREAK_INTERVAL_DAYS[4]]);
  });
  it('a failure after a success brings the review forward to the next day, whatever the earlier streak was', () => {
    const s = withEvidence(ev(30), ev(25), ev(20), ev(3, { passed: false, support: 'independent' }));
    const r = stateOf(s);
    expect(r.intervalDays).toBe(1);
    expect(r.reasons.join(' ')).toMatch(/did not pass/);
    expect(r.streak).toBe(0);
  });
  it('a pass that used a hint does not extend the interval and says so', () => {
    const s = withEvidence(ev(20), ev(18), ev(2, { hintsUsed: 1, support: 'guided' }));
    const r = stateOf(s);
    expect(r.streak).toBe(0);
    expect(r.intervalDays).toBeLessThanOrEqual(3);
  });
  it('work only ever done at an easy level is reviewed sooner than the same streak at a higher difficulty', () => {
    const easy = stateOf(withEvidence(ev(10, { difficulty: 2 }), ev(9, { difficulty: 2 }))).intervalDays;
    const hard = stateOf(withEvidence(ev(10, { difficulty: 4 }), ev(9, { difficulty: 4 }))).intervalDays;
    expect(easy).toBeLessThan(hard);
  });
  it('practising the skill anywhere restarts its clock (a daily, a practice problem or a lesson all count)', () => {
    const quiet = withEvidence(ev(40), ev(39));
    const refreshed = withEvidence(ev(40), ev(39), ev(1, { support: 'independent' }));
    expect(reviewsDue(quiet, T0, skillsOf).some((d) => d.skill.id === SKILL)).toBe(true);
    expect(reviewsDue(refreshed, T0, skillsOf).some((d) => d.skill.id === SKILL)).toBe(false);
  });
  it('a long streak stays quiet for weeks, then comes due, with the reason naming the record', () => {
    const s = withEvidence(ev(80), ev(79), ev(78), ev(77), ev(76));
    expect(stateOf(s).intervalDays).toBe(60);
    const due = reviewsDue(s, T0, skillsOf).find((d) => d.skill.id === SKILL)!;
    expect(due).toBeDefined();
    expect(due.reason).toMatch(/time to check|days have passed/);
    expect(due.reasons.join(' ')).toMatch(/independently/);
    const soon = withEvidence(ev(30), ev(29), ev(28), ev(27), ev(26));
    expect(reviewsDue(soon, T0, skillsOf).some((d) => d.skill.id === SKILL)).toBe(false);
  });
  it('a skill never practised is a lesson to take, not a review', () => {
    expect(reviewSchedule(base(), T0, skillsOf)).toEqual([]);
  });
  it('being due never lowers a skill status: the schedule only reads evidence', () => {
    const s = withEvidence(ev(80), ev(79), ev(78), ev(77), ev(76));
    const before = JSON.stringify(s.evidence);
    reviewsDue(s, T0, skillsOf);
    expect(JSON.stringify(s.evidence)).toBe(before);
  });
});

describe('exploration is navigation, not progress', () => {
  it('entering a world records it and where the player was last; non-world areas change nothing', () => {
    let s = base();
    expect(s.explore).toEqual({ visited: [], last: null });
    s = visitArea(s, 'data-center').save;
    s = visitArea(s, 'r-lab').save;
    s = visitArea(s, 'data-center').save;
    expect(s.explore).toEqual({ visited: ['sql', 'r'], last: 'sql' });
    expect(visitArea(s, 'academy').save.explore).toEqual(s.explore);
  });
  it('suggests the foundation worlds not visited yet', () => {
    let s = base();
    expect(unvisitedFoundations(s).map((w) => w.track)).toEqual(expect.arrayContaining(['python', 'sql', 'web', 'git', 'sheets', 'r']));
    s = visitArea(s, 'spreadsheet-guild').save;
    expect(unvisitedFoundations(s).map((w) => w.track)).not.toContain('sheets');
  });
});
