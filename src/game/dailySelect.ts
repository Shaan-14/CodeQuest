/**
 * DAILY CHALLENGE SELECTION. Deterministic and transparent: the same save and time always give the same
 * pick, and every pick carries a plain-language reason. There is no randomness and no learned model.
 *
 * Rules (documented in ARCHITECTURE.md, "Daily Challenge selection"):
 *  1. Nothing is offered until something has been learned (a completed lesson or a passed challenge).
 *  2. KIND rotates with the number of dailies issued so far: current -> review -> mixed. CURRENT reinforces what is being
 *     learned, REVIEW revisits an older skill, MIXED (Phase 5) draws a cross-world combination or a transfer problem. If the
 *     preferred kind has nothing eligible, the next kind is used.
 *  3. SKILL weights (higher wins, ties by skill id):
 *       current: 10 + weakness(status) - 4 per use in the last 4 dailies
 *       review : min(10, days since practised / 3) + need(status) + 2 if review failures exceed successes
 *                - 4 per use in the last 4 dailies
 *     weakness/need: guided or attempted 3, developing 2, demonstrated 1 (review) or 0 (current).
 *     So a long-neglected skill becomes steadily more likely, and a demonstrated skill is still eligible.
 *  4. CHALLENGE pool for that skill (Phase 5): authored Daily challenges plus challenge/independent-mode challenges from ANY world
 *     whose skills have all been taught (graph.challengeEligible), not only from completed lessons. The player is never asked
 *     for a concept they have not been taught, and never restricted to one world.
 *  5. TARGET DIFFICULTY: current learning -> 2 (guided/attempted), 3 (developing), 4 (demonstrated), never more
 *     than one above the best difficulty already passed; review -> the top of demonstrated ability
 *     (max passed difficulty, +1 if demonstrated, at least 3 for demonstrated skills, at most 5).
 *  6. Among the pool: not used in the last 12 dailies (a skill with only recent challenges is skipped unless
 *     nothing else is eligible), then closest to the target (authored gets a 0.5 bonus),
 *     then never used before, then id order.
 *  7. (Phase 4) COMBINATIONS: a skill that is part of an open weakness gets +3. Among a skill's challenges, one that
 *     also needs a skill of the OTHER kind (an older skill together with what is being learned now) gets a 0.75
 *     bonus on the difficulty distance, and one that exercises a weak COMBINATION (a composite the player has
 *     struggled with) gets 1.25. The reason says so. Nothing here ever changes mastery: a daily is evidence.
 */
import { challenges, dailyChallenges, getChallenge, getSkill } from '../content';
import type { Challenge } from '../content/schema';
import { trackOfSkillId, worldOfTrack } from '../content/worlds';
import type { DailyFocus, DailyReward, SaveData } from '../core/save';
import { challengeEligible } from './graph';
import { skillReviews, type SkillReview } from './retention';

export const RECENT_SKILL_WINDOW = 4;
export const RECENT_CHALLENGE_WINDOW = 12;

export interface DailyPick {
  challenge: Challenge;
  focus: DailyFocus;
  skill: SkillReview;
  target: number;
  reason: string;
  reward: DailyReward;
}

const DIFFICULTY_NAME = ['', 'Starter', 'Easy', 'Standard', 'Hard', 'Expert'] as const;
export const difficultyName = (d: number): string => DIFFICULTY_NAME[Math.min(5, Math.max(1, Math.round(d)))]!;

/** Rewards scale with difficulty; review dailies pay 25% more. Coins/XP/Focus only: never hints, never mastery. */
export function dailyReward(difficulty: number, focus: DailyFocus): DailyReward {
  const d = Math.min(5, Math.max(1, Math.round(difficulty)));
  const coins = [25, 40, 60, 90, 130][d - 1]!;
  const xp = [30, 50, 80, 120, 170][d - 1]!;
  const bonus = focus === 'review' ? 1.25 : focus === 'mixed' ? 1.4 : 1;
  return { coins: Math.round(coins * bonus), xp: Math.round(xp * bonus), focus: 0 }; // Focus is never a daily reward: a daily needs 100 Focus to attempt, and Focus is earned only by training
}

interface Candidate {
  c: Challenge;
  authored: boolean;
}

/** The worlds (tracks) a challenge touches, through its skills. */
export const tracksOf = (c: Challenge): Set<string> => new Set(c.skillIds.map((k) => trackOfSkillId(k)));

/**
 * Every challenge the player may meet today: authored dailies whose lessons are done, and ALL challenge/independent-mode
 * problems from ANY world whose skills the player has been taught (game/graph.ts `challengeEligible`). So a daily can come from a
 * recent lesson, an old one, a skill already shown, a review that is due, or a cross-world combination: but never a concept the
 * player has not met. Boss versions and training problems live elsewhere and never appear here.
 */
function candidatePool(save: SaveData): Candidate[] {
  const done = (id: string) => !!save.learning.lessons[id]?.completed;
  const authored = dailyChallenges.filter((c) => c.daily!.requires.every(done) && challengeEligible(save, c)).map((c) => ({ c, authored: true }));
  const fromLessons = challenges.filter((c) => c.mode !== 'learning' && challengeEligible(save, c)).map((c) => ({ c, authored: false }));
  return [...authored, ...fromLessons];
}

/** A "mixed" challenge combines skills from more than one world, or asks the player to transfer a skill to an unfamiliar setting. */
export const isMixed = (c: Challenge): boolean => tracksOf(c).size > 1 || !!c.transfer;

const need = (r: SkillReview, review: boolean): number => {
  switch (r.status) {
    case 'none':
    case 'attempted':
    case 'guided': return 3;
    case 'developing': return 2;
    case 'demonstrated': return review ? 1 : 0;
  }
};

export function targetDifficulty(r: SkillReview, focus: DailyFocus): number {
  if (focus === 'current') {
    const base = r.status === 'demonstrated' ? 4 : r.status === 'developing' ? 3 : 2;
    return Math.min(base, Math.max(r.maxPassedDifficulty, 2) + 1);
  }
  const top = Math.max(r.maxPassedDifficulty, 2) + (r.status === 'demonstrated' ? 1 : 0);
  return Math.min(5, r.status === 'demonstrated' ? Math.max(3, top) : top);
}

const usable = (c: Candidate, focus: DailyFocus): boolean => !c.c.daily || c.c.daily.focus === 'either' || focus === 'mixed' || c.c.daily.focus === focus;

/** What the player has learned and where it is weak: used to prefer challenges that combine old and new skills. */
interface Mix {
  currentIds: Set<string>;
  learnedIds: Set<string>;
  /** Skill sets of open weaknesses that are combinations. */
  weakCombos: string[][];
  weakSkills: Set<string>;
}

/** How a candidate combines skills relative to `r`: 'weak' (a weak composite), 'mix' (old + new), or none. */
function comboOf(c: Challenge, r: SkillReview, mix: Mix): 'weak' | 'mix' | null {
  if (!c.skillIds.includes(r.skill.id)) return null;
  if (mix.weakCombos.some((combo) => combo.length > 1 && combo.every((k) => c.skillIds.includes(k)))) return 'weak';
  const others = c.skillIds.filter((k) => k !== r.skill.id && mix.learnedIds.has(k));
  const rIsCurrent = mix.currentIds.has(r.skill.id);
  return others.some((k) => mix.currentIds.has(k) !== rIsCurrent) ? 'mix' : null;
}

/** The best challenge for a skill, or null. `recent` = ids to avoid; `everUsed` = tie-break towards unseen. */
function bestChallenge(pool: Candidate[], r: SkillReview, focus: DailyFocus, recent: Set<string>, everUsed: Set<string>, allowRecent: boolean, mix: Mix): { c: Challenge; target: number; combo: 'weak' | 'mix' | null } | null {
  const mine = pool.filter((p) => p.c.skillIds.includes(r.skill.id) && usable(p, focus) && (allowRecent || !recent.has(p.c.id)));
  if (!mine.length) return null;
  const target = targetDifficulty(r, focus);
  const cap = focus !== 'current' && r.status === 'demonstrated' ? 5 : Math.max(r.maxPassedDifficulty, 2) + 1;
  const capped = mine.filter((p) => p.c.difficulty <= cap);
  const base = capped.length ? capped : mine;
  const bonus = (p: Candidate) => { const k = comboOf(p.c, r, mix); return k === 'weak' ? 1.25 : k === 'mix' ? 0.75 : 0; };
  const key = (p: Candidate) => [recent.has(p.c.id) ? 1 : 0, Math.abs(p.c.difficulty - target) - (p.authored ? 0.5 : 0) - bonus(p), everUsed.has(p.c.id) ? 1 : 0] as const;
  const best = [...base].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i]! - kb[i]!;
    return a.c.id < b.c.id ? -1 : 1;
  })[0]!;
  return { c: best.c, target, combo: comboOf(best.c, r, mix) };
}

function reasonFor(r: SkillReview, focus: DailyFocus, c: Challenge, combo: 'weak' | 'mix' | null): string {
  const title = r.skill.title;
  const together = combo ? ` It brings ${c.skillIds.map((k) => getSkill(k)?.title ?? k).join(' and ')} together${combo === 'weak' ? ', a combination you have been finding tricky' : ', so old and new skills work as one'}.` : '';
  if (focus === 'mixed') {
    const worlds = [...tracksOf(c)].map((t) => worldOfTrack(t as never).name.split(':')[0]);
    const span = worlds.length > 1 ? `It brings ${worlds.join(' and ')} together, the way a real task does.` : 'It puts a skill you have shown into a setting you have not seen before.';
    return `${span} It needs “${title}”, among other things, at difficulty ${c.difficulty}. Nothing in it was taught in exactly this form.${together}`;
  }
  if (focus === 'current') return `You are working on “${title}” right now, so today’s challenge reinforces it at difficulty ${c.difficulty}.${together}`;
  const ago = r.daysSince >= 1 ? `You have not practised “${title}” for ${r.daysSince} day${r.daysSince === 1 ? '' : 's'}.` : `“${title}” is worth keeping sharp.`;
  const level = r.status === 'demonstrated' ? 'near the top of what you have shown' : 'at the level you have reached';
  return `${ago} This one sits ${level} (difficulty ${c.difficulty}). Can you still do it without being taught again?${together}`;
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

  const openWeaknesses = save.training.weaknesses.filter((w) => w.status !== 'resolved');
  const mix: Mix = {
    currentIds: new Set(reviews.filter((r) => r.current).map((r) => r.skill.id)),
    learnedIds: new Set(reviews.map((r) => r.skill.id)),
    weakCombos: openWeaknesses.filter((w) => w.kind === 'combination').map((w) => w.skillIds),
    weakSkills: new Set(openWeaknesses.flatMap((w) => w.skillIds)),
  };

  const weight = (r: SkillReview, focus: DailyFocus): number =>
    (mix.weakSkills.has(r.skill.id) ? 3 : 0) +
    (focus === 'current'
      ? 10 + need(r, false) - 4 * uses(r.skill.id)
      : Math.min(10, r.daysSince / 3) + need(r, true) + (r.dailyFailures > r.dailySuccesses ? 2 : 0) - 4 * uses(r.skill.id));

  const mixedPool = pool.filter((p) => isMixed(p.c));
  const attempt = (focus: DailyFocus): DailyPick | null => {
    const source = focus === 'mixed' ? mixedPool : pool;
    let pool2 = focus === 'mixed' ? reviews : reviews.filter((r) => (focus === 'current' ? r.current : !r.current));
    if (!pool2.length && focus === 'review') pool2 = reviews; // nothing old yet: any learned skill may be reviewed
    const ranked = [...pool2].sort((a, b) => weight(b, focus === 'mixed' ? 'review' : focus) - weight(a, focus === 'mixed' ? 'review' : focus) || (a.skill.id < b.skill.id ? -1 : 1));
    // First choice: a skill with a challenge not used in the recent window; only if none exists may a recent one repeat.
    for (const allowRecent of [false, true]) {
      for (const r of ranked) {
        const found = bestChallenge(source, r, focus, recent, everUsed, allowRecent, mix);
        if (found) return { challenge: found.c, focus, skill: r, target: found.target, reason: reasonFor(r, focus, found.c, found.combo), reward: dailyReward(found.c.difficulty, focus) };
      }
    }
    return null;
  };

  // The kind rotates current -> review -> mixed, so over time a player meets new work, old work and cross-world work. A kind with
  // nothing eligible hands over to the next one (a player with one world and no transfer problems simply never gets 'mixed').
  const ORDER: DailyFocus[] = ['current', 'review', 'mixed'];
  const start = history.length % ORDER.length;
  for (let k = 0; k < ORDER.length; k++) {
    const found = attempt(ORDER[(start + k) % ORDER.length]!);
    if (found) return found;
  }
  return null;
}
