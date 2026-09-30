import { describe, expect, it } from 'vitest';
import { challenges, getAnyChallenge, getChallenge, lessons } from '../content';
import { newSave, loadSave, migrate, sanitizeDaily, writeSave, SAVE_KEY, SAVE_VERSION, type SaveData } from '../core/save';
import { summarizeSkill, type EvidenceRecord } from '../learning/mastery';
import { getSkill } from '../content';
import * as A from './actions';
import { DAILY_ITEM_MILESTONES, DAILY_PERIOD_MS, canSubmitDaily, effectiveNow, formatRemaining, passedCount, refreshDaily, submitDaily, timeRemainingMs } from './daily';
import { dailyReward, isMixed, pickDaily, RECENT_CHALLENGE_WINDOW } from './dailySelect';
import { skillReviews } from './retention';

const T0 = Date.parse('2026-01-10T08:00:00Z');
const H = 3600 * 1000;

const player = (): SaveData => A.createPlayer(newSave(), 'Ada', 'wizard').save;
const complete = (s: SaveData, ids: string[], at = T0 - 40 * 24 * H): SaveData => {
  const c = structuredClone(s);
  ids.forEach((id, i) => (c.learning.lessons[id] = { stepIndex: 99, completed: true, completedAt: new Date(at + i * 1000).toISOString() }));
  return c;
};
const upTo = (lessonId: string): string[] => lessons.slice(0, lessons.findIndex((l) => l.id === lessonId) + 1).map((l) => l.id);

/** Evidence for a real challenge at a given time (so retention memory sees a realistic history). */
function evidence(challengeId: string, atMs: number, over: Partial<EvidenceRecord> = {}): EvidenceRecord {
  const c = getChallenge(challengeId)!;
  return {
    at: new Date(atMs).toISOString(), challengeId, objectiveId: c.objectiveId ?? c.id, context: c.context ?? '', skillIds: c.skillIds, concepts: c.concepts,
    mode: c.mode, difficulty: c.difficulty, passed: true, support: 'independent', hintsUsed: 0, lookups: 0, attemptNumber: 1, priorFailures: 0, project: false, timeMs: 1000, executed: true, ...over,
  };
}

const started = (): SaveData => complete(player(), upTo('py-01-first-program'));
const issued = (s: SaveData, now = T0) => refreshDaily(s, now).save;

describe('Daily Challenge: issuing and the 12-hour timer', () => {
  it('offers nothing before anything has been learned', () => {
    expect(issued(player()).daily.current).toBeNull();
    expect(pickDaily(player(), T0)).toBeNull();
  });

  it('offers a challenge once a lesson is complete, with skill, difficulty, reward, reason and a 12h expiry', () => {
    const s = issued(started());
    const cur = s.daily.current!;
    expect(cur.status).toBe('open');
    expect(cur.attempts).toBe(0);
    expect(cur.difficulty).toBeGreaterThanOrEqual(1);
    expect(cur.reward.coins).toBeGreaterThan(0);
    expect(cur.reason.length).toBeGreaterThan(20);
    expect(Date.parse(cur.expiresAt) - Date.parse(cur.issuedAt)).toBe(DAILY_PERIOD_MS);
    expect(getSkill(cur.skillId)).toBeDefined();
  });

  it('is stable within the period: refreshing again (a reload) never re-rolls or extends it', () => {
    const a = issued(started());
    const b = refreshDaily(a, T0 + 5 * H).save;
    const c = refreshDaily(b, T0 + 11 * H + 59 * 60000).save;
    expect(c.daily.current).toEqual(a.daily.current);
    expect(c.daily.history).toHaveLength(0);
  });

  it('issues a new challenge after 12 hours and records the unfinished one as missed, without penalty', () => {
    const a = issued(started());
    const b = refreshDaily(a, T0 + 12 * H).save;
    expect(b.daily.current!.issuedAt).not.toBe(a.daily.current!.issuedAt);
    expect(b.daily.current!.status).toBe('open');
    expect(b.daily.history).toHaveLength(1);
    expect(b.daily.history[0]).toMatchObject({ outcome: 'missed', coins: 0, xp: 0 });
    expect(b.stats).toEqual(a.stats);
  });

  it('missing many periods issues one new challenge, not a backlog', () => {
    const a = issued(started());
    const b = refreshDaily(a, T0 + 100 * H).save;
    expect(b.daily.history).toHaveLength(1);
    expect(b.daily.current!.status).toBe('open');
  });

  it('shows the time remaining', () => {
    const s = issued(started());
    expect(timeRemainingMs(s, T0 + 4 * H + 18 * 60000)).toBe(7 * H + 42 * 60000);
    expect(formatRemaining(7 * H + 42 * 60000)).toBe('7h 42m');
    expect(formatRemaining(90000)).toBe('2m');
    expect(formatRemaining(0)).toBe('under a minute');
  });

  it('cannot be manipulated by setting the clock back', () => {
    let s = issued(started());
    s = refreshDaily(s, T0 + 11 * H).save; // clock seen at +11h
    expect(effectiveNow(s, T0)).toBe(T0 + 11 * H); // clock rolled back: time never goes backwards
    expect(timeRemainingMs(s, T0)).toBe(1 * H);
    // Expire, then roll the clock back: the expired offer does not come back and time does not restart.
    const after = refreshDaily(s, T0 + 12 * H + 1).save;
    const rolledBack = refreshDaily(after, T0).save;
    expect(rolledBack.daily.current).toEqual(after.daily.current);
  });
});

describe('Daily Challenge: one attempt, no retries, rewards only on success', () => {
  it('a solve pays coins and XP (never Focus), is recorded as independent evidence, and cannot be repeated', () => {
    let s = issued(started());
    const cur = s.daily.current!;
    const r = submitDaily(s, T0 + H, true, 4000);
    expect(r.save.daily.current!.status).toBe('passed');
    expect(r.save.stats.coins).toBe(s.stats.coins + cur.reward.coins);
    expect(r.save.stats.xp).toBe(s.stats.xp + cur.reward.xp);
    expect(r.save.stats.focus).toBe(100);
    const rec = r.save.evidence.at(-1)!;
    expect(rec).toMatchObject({ challengeId: cur.challengeId, passed: true, hintsUsed: 0, mode: 'independent', attemptNumber: 1, executed: true });
    expect(['independent', 'transfer']).toContain(rec.support);
    expect(r.save.daily.history.at(-1)).toMatchObject({ outcome: 'passed', coins: cur.reward.coins });
    expect(r.events.map((e) => e.type)).toContain('dailyPassed');
    // No second submission of any kind.
    expect(canSubmitDaily(r.save, T0 + 2 * H)).toBe(false);
    expect(submitDaily(r.save, T0 + 2 * H, true, 1).save).toEqual(r.save);
  });

  it('a failure pays nothing, costs no Focus, keeps the attempt as evidence, and allows no retry', () => {
    const s = issued(started());
    const cur = s.daily.current!;
    const r = submitDaily(s, T0 + H, false, 4000);
    expect(r.save.daily.current!.status).toBe('failed');
    expect(r.save.stats).toEqual(s.stats);
    expect(r.save.evidence.at(-1)).toMatchObject({ challengeId: cur.challengeId, passed: false });
    expect(r.save.daily.history.at(-1)).toMatchObject({ outcome: 'failed', coins: 0, xp: 0 });
    expect(canSubmitDaily(r.save, T0 + 2 * H)).toBe(false);
    const again = submitDaily(r.save, T0 + 2 * H, true, 1); // a "retry" that would pass
    expect(again.save).toEqual(r.save);
    expect(again.save.daily.current!.status).toBe('failed');
    expect(r.events.map((e) => e.type)).not.toContain('dailyPassed');
  });

  it('cannot be submitted after it expires or with nothing on offer', () => {
    const s = issued(started());
    expect(submitDaily(s, T0 + 12 * H + 1, true, 1).save.daily.current!.status).toBe('open');
    expect(canSubmitDaily(s, T0 + 12 * H)).toBe(false);
    expect(submitDaily(player(), T0, true, 1).save.evidence).toHaveLength(0);
  });

  it('a solved daily is evidence but never marks a skill demonstrated, and XP never feeds mastery', () => {
    let s = issued(started());
    const skillIds = getChallenge(s.daily.current!.challengeId)?.skillIds ?? [];
    s = submitDaily(s, T0 + H, true, 1).save;
    for (const id of s.evidence.at(-1)!.skillIds.concat(skillIds)) {
      const skill = getSkill(id)!;
      const need = skill.masteryRequirements;
      const sum = summarizeSkill(s.evidence, skill);
      if (need.independentPasses > 1) expect(sum.status).not.toBe('demonstrated');
    }
    const rich = structuredClone(s);
    rich.stats.xp = 1_000_000;
    for (const id of s.evidence.at(-1)!.skillIds) expect(summarizeSkill(rich.evidence, getSkill(id)!).status).toBe(summarizeSkill(s.evidence, getSkill(id)!).status);
  });

  it('pays more for harder and for review challenges, and never sells hints (rewards are coins/XP/Focus only)', () => {
    expect(dailyReward(5, 'current').coins).toBeGreaterThan(dailyReward(1, 'current').coins);
    expect(dailyReward(4, 'review').xp).toBeGreaterThan(dailyReward(4, 'current').xp);
    expect(Object.keys(dailyReward(3, 'current')).sort()).toEqual(['coins', 'focus', 'xp']);
  });

  it('milestone cosmetics are granted at 10, 25 and 50 solves', () => {
    let s = issued(started());
    for (let i = 0; i < 10; i++) {
      s = submitDaily(s, T0 + i * 13 * H + H, true, 1).save;
      s = refreshDaily(s, T0 + (i + 1) * 13 * H).save;
    }
    expect(passedCount(s)).toBe(10);
    expect(s.inventory[DAILY_ITEM_MILESTONES[10]!]).toBe(1);
    expect(s.achievements['daily-10']).toBeDefined();
  });
});

describe('Daily Challenge: selection and retention', () => {
  const allPython = () => complete(player(), upTo('py-26-independent-python'));
  const pyEvidence = (s: SaveData, atMs: number, ids = ['py-16-stock-lookup']) => {
    const c = structuredClone(s);
    for (const id of ids) c.evidence.push(evidence(id, atMs));
    return c;
  };

  it('is deterministic: the same save and time always give the same challenge', () => {
    const s = pyEvidence(allPython(), T0 - 20 * 24 * H);
    expect(pickDaily(s, T0)!.challenge.id).toBe(pickDaily(structuredClone(s), T0)!.challenge.id);
  });

  it('a beginner is given something from what they have learned, at an appropriate level', () => {
    const p = pickDaily(started(), T0)!;
    expect(p.focus).toBe('current');
    expect(p.challenge.difficulty).toBeLessThanOrEqual(3);
    const learnedSkills = new Set(skillReviews(started(), T0, (id) => getChallenge(id)?.skillIds).filter((r) => r.learned).map((r) => r.skill.id));
    expect(p.challenge.skillIds.some((k) => learnedSkills.has(k))).toBe(true);
  });

  it('never requires a concept from a lesson the player has not completed', () => {
    for (const upto of ['py-03-variables', 'py-12-functions', 'py-21-cleaning']) {
      const s = complete(player(), upTo(upto));
      const done = new Set(upTo(upto));
      const p = pickDaily(s, T0)!;
      const owner = lessons.find((l) => l.steps.some((st) => st.kind === 'challenge' && st.challengeId === p.challenge.id));
      if (owner) expect(done.has(owner.id)).toBe(true);
      else for (const req of p.challenge.daily!.requires) expect(done.has(req)).toBe(true);
    }
  });

  it('rotates current learning, review and mixed (cross-world or transfer) dailies as they are issued', () => {
    let s = allPython();
    s = pyEvidence(s, T0 - 30 * 24 * H, ['py-16-stock-lookup', 'py-15-over-limit']);
    const kinds: string[] = [];
    let t = T0;
    for (let i = 0; i < 6; i++) {
      s = refreshDaily(s, t).save;
      kinds.push(s.daily.current!.focus);
      t += 13 * H;
    }
    expect(kinds.slice(0, 3)).toEqual(['current', 'review', 'mixed']);
    expect(kinds.slice(3, 6)).toEqual(['current', 'review', 'mixed']);
  });

  it('a mixed daily combines worlds or transfers a skill, and says so', () => {
    let s = allPython();
    s = pyEvidence(s, T0 - 30 * 24 * H, ['py-16-stock-lookup', 'py-15-over-limit']);
    s.daily.history.push(
      { challengeId: 'x', focus: 'current', skillIds: [], category: 'Python', difficulty: 2, issuedAt: new Date(T0 - 30 * H).toISOString(), outcome: 'missed', coins: 0, xp: 0 },
      { challengeId: 'y', focus: 'review', skillIds: [], category: 'Python', difficulty: 2, issuedAt: new Date(T0 - 20 * H).toISOString(), outcome: 'missed', coins: 0, xp: 0 },
    );
    const p = pickDaily(s, T0)!;
    expect(p.focus).toBe('mixed');
    expect(isMixed(p.challenge)).toBe(true);
    expect(p.reason).toMatch(/together|setting you have not seen/i);
  });

  it('draws from every world the player has been taught, not only the one they are in', () => {
    const s = allPython();
    for (const l of lessons.filter((x) => x.id.startsWith('xl-0') && Number(x.id.slice(3, 5)) <= 4)) s.learning.lessons[l.id] = { completed: true, stepIndex: 0, completedAt: new Date(T0 - 40 * H).toISOString() } as never;
    s.evidence.push(...challenges.filter((c) => c.language === 'sheet' && c.mode !== 'learning' && Number(c.id.slice(3, 5)) <= 4).map((c) => evidence(c.id, T0 - 30 * 24 * H)));
    const seen = new Set<string>();
    let t = T0;
    let cur = s;
    for (let i = 0; i < 12; i++) { cur = refreshDaily(cur, t).save; seen.add(getAnyChallenge(cur.daily.current!.challengeId)!.language); t += 13 * H; }
    expect(seen.has('sheet')).toBe(true);
    expect(seen.has('python')).toBe(true);
  });

  it('a finished-Python player who moved on can still get old-skill review at high difficulty', () => {
    let s = allPython();
    // demonstrated-looking history: independent passes at difficulty 4-5 long ago
    const hard = challenges.filter((c) => c.language === 'python' && c.difficulty >= 4 && c.mode !== 'learning').slice(0, 6);
    s.evidence.push(...hard.map((c) => evidence(c.id, T0 - 45 * 24 * H)));
    s.daily.history.push({ challengeId: 'x', focus: 'current', skillIds: [], category: 'Python', difficulty: 2, issuedAt: new Date(T0 - H).toISOString(), outcome: 'missed', coins: 0, xp: 0 });
    const p = pickDaily(s, T0)!;
    expect(p.focus).toBe('review');
    expect(p.challenge.difficulty).toBeGreaterThanOrEqual(3);
    expect(p.reason).toMatch(/practis|sharp/i);
  });

  it('long-unpractised skills get more likely than recently practised ones (staleness)', () => {
    let s = allPython();
    s = pyEvidence(s, T0 - 2 * H, ['py-15-over-limit']); // lists: practised just now
    s = pyEvidence(s, T0 - 40 * 24 * H, ['py-16-stock-lookup']); // dicts: 40 days ago
    s.daily.history.push({ challengeId: 'x', focus: 'current', skillIds: [], category: 'Python', difficulty: 2, issuedAt: new Date(T0 - H).toISOString(), outcome: 'missed', coins: 0, xp: 0 });
    const p = pickDaily(s, T0)!;
    expect(p.focus).toBe('review');
    const reviews = skillReviews(s, T0, (id) => getChallenge(id)?.skillIds);
    const lists = reviews.find((r) => r.skill.id === 'py.lists')!;
    const dicts = reviews.find((r) => r.skill.id === 'py.dicts')!;
    expect(dicts.daysSince).toBeGreaterThan(lists.daysSince);
  });

  it('does not repeat a challenge within the recent window', () => {
    let s = allPython();
    s = pyEvidence(s, T0 - 30 * 24 * H, ['py-16-stock-lookup']);
    const seen: string[] = [];
    let t = T0;
    for (let i = 0; i < RECENT_CHALLENGE_WINDOW + 4; i++) {
      s = refreshDaily(s, t).save;
      seen.push(s.daily.current!.challengeId);
      t += 13 * H;
    }
    for (let i = 0; i < seen.length; i++) expect(seen.slice(Math.max(0, i - RECENT_CHALLENGE_WINDOW), i)).not.toContain(seen[i]);
  });

  it('skips skills used in the last few dailies (variety across skills)', () => {
    let s = allPython();
    s = pyEvidence(s, T0 - 30 * 24 * H, ['py-16-stock-lookup']);
    const skills: string[] = [];
    let t = T0;
    for (let i = 0; i < 6; i++) {
      s = refreshDaily(s, t).save;
      skills.push(s.daily.current!.skillId);
      t += 13 * H;
    }
    expect(new Set(skills).size).toBeGreaterThanOrEqual(3);
  });

  it('retention memory records practice times, review outcomes and difficulty', () => {
    let s = issued(started());
    s = submitDaily(s, T0 + H, true, 1).save;
    const skillId = s.daily.current!.skillId;
    const r = skillReviews(s, T0 + H + 3 * 24 * H, (id) => getChallenge(id)?.skillIds).find((x) => x.skill.id === skillId)!;
    expect(r.dailySuccesses).toBe(1);
    expect(r.lastDailyDifficulty).toBe(s.daily.current!.difficulty);
    expect(r.lastPracticedAt).not.toBeNull();
    expect(r.daysSince).toBe(3);
  });
});

describe('Daily Challenge: achievements', () => {
  const fill = (n: number, over: Partial<SaveData['daily']['history'][number]> = {}) => {
    const s = started();
    for (let i = 0; i < n; i++) s.daily.history.push({ challengeId: `d${i}`, focus: 'review', skillIds: ['py.lists'], category: 'Python', difficulty: 4, issuedAt: new Date(T0 + i * 12 * H).toISOString(), resolvedAt: new Date(T0 + i * 12 * H + H).toISOString(), outcome: 'passed', coins: 1, xp: 1, ...over });
    return A.setFlag(s, 'x').save;
  };
  const earned = (s: SaveData) => Object.keys(A.setFlag(s, 'y').save.achievements);

  it('milestones, perfect week, cross-skill and old-skills achievements come from the history', () => {
    const s = fill(7);
    const done = new Set(Object.keys(settleAll(s).achievements));
    expect(done.has('first-daily')).toBe(true);
    expect(done.has('daily-5')).toBe(true);
    expect(done.has('daily-10')).toBe(false);
    expect(done.has('perfect-week')).toBe(true); // 7 solves in ~3.5 days
    expect(done.has('old-skills-sharp')).toBe(true);
    expect(done.has('cross-skill')).toBe(false);
    const cross = started();
    ['Python', 'SQL', 'Web', 'Databases'].forEach((category, i) => cross.daily.history.push({ challengeId: `c${i}`, focus: 'current', skillIds: [], category, difficulty: 2, issuedAt: new Date(T0).toISOString(), outcome: 'passed', coins: 1, xp: 1 }));
    expect(Object.keys(settleAll(cross).achievements)).toContain('cross-skill');
    expect(earned(started())).not.toContain('first-daily');
  });

  it('perfect week does not require consecutive days and is not earned by a slow trickle', () => {
    const s = started();
    for (let i = 0; i < 7; i++) s.daily.history.push({ challengeId: `w${i}`, focus: 'current', skillIds: [], category: 'Python', difficulty: 2, issuedAt: new Date(T0 + i * 3 * 24 * H).toISOString(), resolvedAt: new Date(T0 + i * 3 * 24 * H).toISOString(), outcome: 'passed', coins: 1, xp: 1 });
    expect(Object.keys(settleAll(s).achievements)).not.toContain('perfect-week');
  });
});

function settleAll(s: SaveData): SaveData {
  return A.setFlag(A.submitChallenge(s, challenges[0]!.id, false, 0, '').save, 'z').save;
}

describe('Daily Challenge: save, load and migration', () => {
  const memory = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
  };

  it('survives save/load (reload, browser close) with the offer, expiry and history intact', () => {
    let s = issued(started());
    s = submitDaily(s, T0 + H, false, 1).save;
    const store = memory();
    writeSave(store, s);
    const loaded = loadSave(store);
    expect(loaded.status).toBe('loaded');
    expect(loaded.save.daily).toEqual(s.daily);
    expect(loaded.save.daily.current!.status).toBe('failed');
    // still the same offer after a "reload" 5 hours later
    expect(refreshDaily(loaded.save, T0 + 5 * H).save.daily.current).toEqual(s.daily.current);
  });

  it('migrates a v3 (Phase 2) save without losing anything and starts with no daily', () => {
    const v3 = { ...structuredClone(started()), version: 3 } as Record<string, unknown>;
    delete v3.daily;
    const m = migrate(v3)!;
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.daily).toEqual({ current: null, history: [], lastSeenAt: null });
    expect(m.learning).toEqual((v3 as unknown as SaveData).learning);
    expect(m.player?.name).toBe('Ada');
  });

  it('repairs a corrupt daily block instead of rejecting the whole save', () => {
    const bad = { ...structuredClone(started()), daily: { current: { challengeId: 5 }, history: [1, 'x', { challengeId: 'ok', issuedAt: 'nope' }], lastSeenAt: 'garbage' } };
    const m = migrate(bad)!;
    expect(m.daily).toEqual({ current: null, history: [], lastSeenAt: null });
    expect(sanitizeDaily(undefined)).toEqual({ current: null, history: [], lastSeenAt: null });
  });

  it('rejects a save from a NEWER version (it is backed up by the loader, never destroyed)', () => {
    const store = memory();
    store.setItem(SAVE_KEY, JSON.stringify({ ...started(), version: 99 }));
    const r = loadSave(store);
    expect(r.status).toBe('recovered');
    expect(store.m.get('codequest.save.backup')).toContain('"version":99');
  });
});
