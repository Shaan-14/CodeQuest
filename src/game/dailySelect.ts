/**
 * DAILY CHALLENGE SELECTION. Deterministic and transparent: the same save and time always give the same
 * pick, and every pick carries a plain-language reason. There is no randomness and no learned model.
 *
 * Rules (documented in ARCHITECTURE.md, "Daily Challenge selection"):
 *  1. Nothing is offered until something has been learned (a completed lesson or a passed challenge).
 *  2. KIND rotates with the number of dailies issued so far: even -> reinforce CURRENT learning,
 *     odd -> REVIEW an older skill. If the preferred kind has nothing eligible, the other kind is used.
 *  3. SKILL weights (higher wins, ties by skill id):
 *       current: 10 + weakness(status) - 4 per use in the last 4 dailies
 *       review : min(10, days since practised / 3) + need(status) + 2 if review failures exceed successes
 *                - 4 per use in the last 4 dailies
 *     weakness/need: guided or attempted 3, developing 2, demonstrated 1 (review) or 0 (current).
 *     So a long-neglected skill becomes steadily more likely, and a demonstrated skill is still eligible.
 *  4. CHALLENGE pool for that skill: authored Daily challenges whose required lessons are complete, plus
 *     challenge/independent-mode lesson challenges from COMPLETED lessons. The player is never asked for a
 *     concept they have not been taught.
 *  5. TARGET DIFFICULTY: current learning -> 2 (guided/attempted), 3 (developing), 4 (demonstrated), never more
 *     than one above the best difficulty already passed; review -> the top of demonstrated ability
 *     (max passed difficulty, +1 if demonstrated, at least 3 for demonstrated skills, at most 5).
 *  6. Among the pool: not used in the last 12 dailies (a skill with only recent challenges is skipped unless
 *     nothing else is eligible), then closest to the target (authored gets a 0.5 bonus),
 *     then never used before, then id order.
 */
import { challenges, dailyChallenges, getChallenge, lessons } from '../content';
import type { Challenge } from '../content/schema';
import type { DailyReward, SaveData } from '../core/save';
import { skillReviews, type SkillReview } from './retention';

export const RECENT_SKILL_WINDOW = 4;
export const RECENT_CHALLENGE_WINDOW = 12;

export interface DailyPick {
  challenge: Challenge;
  focus: 'current' | 'review';
  skill: SkillReview;
  target: number;
  reason: string;
  reward: DailyReward;
}

const DIFFICULTY_NAME = ['', 'Starter', 'Easy', 'Standard', 'Hard', 'Expert'] as const;
export const difficultyName = (d: number): string => DIFFICULTY_NAME[Math.min(5, Math.max(1, Math.round(d)))]!;

/** Rewards scale with difficulty; review dailies pay 25% more. Coins/XP/Focus only: never hints, never mastery. */
export function dailyReward(difficulty: number, focus: 'current' | 'review'): DailyReward {
  const d = Math.min(5, Math.max(1, Math.round(difficulty)));
  const coins = [25, 40, 60, 90, 130][d - 1]!;
  const xp = [30, 50, 80, 120, 170][d - 1]!;
  const bonus = focus === 'review' ? 1.25 : 1;
  return { coins: Math.round(coins * bonus), xp: Math.round(xp * bonus), focus: 15 };
}

let ownerCache: Map<string, string> | null = null;
/** challenge id -> id of the lesson that contains it. */
function owningLesson(id: string): string | undefined {
  if (!ownerCache) {
    ownerCache = new Map();
    for (const l of lessons) for (const s of l.steps) if (s.kind === 'challenge') ownerCache.set(s.challengeId, l.id);
  }
  return ownerCache.get(id);
}

interface Candidate {
  c: Challenge;
  authored: boolean;
}

function candidatePool(save: SaveData): Candidate[] {
  const done = (id: string) => !!save.learning.lessons[id]?.completed;
  const authored = dailyChallenges.filter((c) => c.daily!.requires.every(done)).map((c) => ({ c, authored: true }));
  const fromLessons = challenges
    .filter((c) => c.mode !== 'learning')
    .filter((c) => {
      const owner = owningLesson(c.id);
      return owner !== undefined && done(owner);
    })
    .map((c) => ({ c, authored: false }));
  return [...authored, ...fromLessons];
}

const need = (r: SkillReview, review: boolean): number => {
  switch (r.status) {
    case 'none':
    case 'attempted':
    case 'guided': return 3;
    case 'developing': return 2;
    case 'demonstrated': return review ? 1 : 0;
  }
};

export function targetDifficulty(r: SkillReview, focus: 'current' | 'review'): number {
  if (focus === 'current') {
    const base = r.status === 'demonstrated' ? 4 : r.status === 'developing' ? 3 : 2;
    return Math.min(base, Math.max(r.maxPassedDifficulty, 2) + 1);
  }
  const top = Math.max(r.maxPassedDifficulty, 2) + (r.status === 'demonstrated' ? 1 : 0);
  return Math.min(5, r.status === 'demonstrated' ? Math.max(3, top) : top);
}

const usable = (c: Candidate, focus: 'current' | 'review'): boolean => !c.c.daily || c.c.daily.focus === 'either' || c.c.daily.focus === focus;

/** The best challenge for a skill, or null. `recent` = ids to avoid; `everUsed` = tie-break towards unseen. */
function bestChallenge(pool: Candidate[], r: SkillReview, focus: 'current' | 'review', recent: Set<string>, everUsed: Set<string>, allowRecent: boolean): { c: Challenge; target: number } | null {
  const mine = pool.filter((p) => p.c.skillIds.includes(r.skill.id) && usable(p, focus) && (allowRecent || !recent.has(p.c.id)));
  if (!mine.length) return null;
  const target = targetDifficulty(r, focus);
  const cap = focus === 'review' && r.status === 'demonstrated' ? 5 : Math.max(r.maxPassedDifficulty, 2) + 1;
  const capped = mine.filter((p) => p.c.difficulty <= cap);
  const base = capped.length ? capped : mine;
  const key = (p: Candidate) => [recent.has(p.c.id) ? 1 : 0, Math.abs(p.c.difficulty - target) - (p.authored ? 0.5 : 0), everUsed.has(p.c.id) ? 1 : 0] as const;
  const best = [...base].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i]! - kb[i]!;
    return a.c.id < b.c.id ? -1 : 1;
  })[0]!;
  return { c: best.c, target };
}

function reasonFor(r: SkillReview, focus: 'current' | 'review', c: Challenge): string {
  const title = r.skill.title;
  if (focus === 'current') return `You are working on “${title}” right now, so today’s challenge reinforces it at difficulty ${c.difficulty}.`;
  const ago = r.daysSince >= 1 ? `You have not practised “${title}” for ${r.daysSince} day${r.daysSince === 1 ? '' : 's'}.` : `“${title}” is worth keeping sharp.`;
  const level = r.status === 'demonstrated' ? 'near the top of what you have shown' : 'at the level you have reached';
  return `${ago} This one sits ${level} (difficulty ${c.difficulty}). Can you still do it without being taught again?`;
}

export function pickDaily(save: SaveData, nowMs: number): DailyPick | null {
  const reviews = skillReviews(save, nowMs, (id) => getChallenge(id)?.skillIds).filter((r) => r.learned);
  if (!reviews.length) return null;
  const pool = candidatePool(save);
  const history = save.daily.history;
  const recentSkills = history.slice(-RECENT_SKILL_WINDOW);
  const recent = new Set(history.slice(-RECENT_CHALLENGE_WINDOW).map((h) => h.challengeId));
  const everUsed = new Set(history.map((h) => h.challengeId));
  const uses = (id: string) => recentSkills.filter((h) => h.skillIds.includes(id)).length;

  const weight = (r: SkillReview, focus: 'current' | 'review'): number =>
    focus === 'current'
      ? 10 + need(r, false) - 4 * uses(r.skill.id)
      : Math.min(10, r.daysSince / 3) + need(r, true) + (r.dailyFailures > r.dailySuccesses ? 2 : 0) - 4 * uses(r.skill.id);

  const attempt = (focus: 'current' | 'review'): DailyPick | null => {
    let pool2 = reviews.filter((r) => (focus === 'current' ? r.current : !r.current));
    if (!pool2.length && focus === 'review') pool2 = reviews; // nothing old yet: any learned skill may be reviewed
    const ranked = [...pool2].sort((a, b) => weight(b, focus) - weight(a, focus) || (a.skill.id < b.skill.id ? -1 : 1));
    // First choice: a skill with a challenge not used in the recent window; only if none exists may a recent one repeat.
    for (const allowRecent of [false, true]) {
      for (const r of ranked) {
        const found = bestChallenge(pool, r, focus, recent, everUsed, allowRecent);
        if (found) return { challenge: found.c, focus, skill: r, target: found.target, reason: reasonFor(r, focus, found.c), reward: dailyReward(found.c.difficulty, focus) };
      }
    }
    return null;
  };

  const preferred: 'current' | 'review' = history.length % 2 === 0 ? 'current' : 'review';
  return attempt(preferred) ?? attempt(preferred === 'current' ? 'review' : 'current');
}
