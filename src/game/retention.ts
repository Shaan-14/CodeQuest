/**
 * Retention memory: what the player has learned, how recently they practised it, and how their reviews went.
 * Derived on demand from the evidence log, completed lessons and the daily history: nothing is stored twice and
 * there is no hidden score. Every number here is a plain count or a date, and dailySelect.ts turns them into
 * documented rules ("Daily Challenge selection" in ARCHITECTURE.md).
 */
import { lessons, skills } from '../content';
import type { Lesson, Skill } from '../content/schema';
import type { SaveData } from '../core/save';
import { summarizeSkill, type SkillStatus } from '../learning/mastery';
import { lessonStatus } from './lessons';

export const DAY_MS = 24 * 3600 * 1000;

export interface SkillReview {
  skill: Skill;
  status: SkillStatus;
  /** Taught: a completed lesson covers it, or a challenge on it has been passed. */
  learned: boolean;
  /** Being learned right now (an open lesson covers it) or learned in one of the last two lessons. */
  current: boolean;
  /** Time of the latest executed evidence for this skill (lesson work or daily), or null. */
  lastPracticedAt: number | null;
  /** Whole days since lastPracticedAt (0 if never practised). */
  daysSince: number;
  independentPasses: number;
  /** Highest difficulty at which the player has passed anything on this skill (any support level), 0 if none. */
  maxPassedDifficulty: number;
  /** Highest difficulty passed independently (no hints), 0 if none. */
  maxIndependentDifficulty: number;
  dailySuccesses: number;
  dailyFailures: number;
  lastDailyDifficulty: number | null;
}

/** A lesson's headline skill. */
export const lessonSkills = (lesson: Lesson): string[] => [lesson.skillId];

/** Skills covered by a lesson including its challenges' skills (needs the challenge registry). */
export function lessonAllSkills(lesson: Lesson, challengeSkills: (challengeId: string) => string[] | undefined): string[] {
  const ids = new Set(lessonSkills(lesson));
  for (const step of lesson.steps) if (step.kind === 'challenge') for (const s of challengeSkills(step.challengeId) ?? []) ids.add(s);
  return [...ids];
}

export function skillReviews(save: SaveData, nowMs: number, challengeSkills: (id: string) => string[] | undefined): SkillReview[] {
  const completed = lessons.filter((l) => save.learning.lessons[l.id]?.completed);
  const learnedFromLessons = new Set(completed.flatMap((l) => lessonAllSkills(l, challengeSkills)));

  // "Current": lessons the player can work on or has started, plus the two most recently completed lessons.
  const openLessons = lessons.filter((l) => {
    const st = lessonStatus(save, l);
    return st === 'available' || st === 'in-progress';
  });
  const recentDone = [...completed]
    .sort((a, b) => Date.parse(save.learning.lessons[b.id]?.completedAt ?? '') - Date.parse(save.learning.lessons[a.id]?.completedAt ?? ''))
    .slice(0, 2);
  const currentSkills = new Set([...openLessons.slice(0, 2), ...recentDone].flatMap((l) => lessonAllSkills(l, challengeSkills)));

  return skills.map((skill) => {
    const mine = save.evidence.filter((r) => r.executed && r.skillIds.includes(skill.id));
    const passed = mine.filter((r) => r.passed);
    const independent = passed.filter((r) => r.support === 'independent' || r.support === 'transfer');
    const last = mine.reduce((m, r) => Math.max(m, Date.parse(r.at) || 0), 0);
    const daily = save.daily.history.filter((h) => h.skillIds.includes(skill.id) && h.outcome !== 'missed');
    const lastDaily = daily.at(-1);
    return {
      skill,
      status: summarizeSkill(save.evidence, skill).status,
      learned: learnedFromLessons.has(skill.id) || passed.length > 0,
      current: currentSkills.has(skill.id),
      lastPracticedAt: last || null,
      daysSince: last ? Math.max(0, Math.floor((nowMs - last) / DAY_MS)) : 0,
      independentPasses: independent.length,
      maxPassedDifficulty: passed.reduce((m, r) => Math.max(m, r.difficulty), 0),
      maxIndependentDifficulty: independent.reduce((m, r) => Math.max(m, r.difficulty), 0),
      dailySuccesses: daily.filter((h) => h.outcome === 'passed').length,
      dailyFailures: daily.filter((h) => h.outcome === 'failed').length,
      lastDailyDifficulty: lastDaily ? lastDaily.difficulty : null,
    };
  });
}

/** After this many quiet days a learned skill is "due for review": the reminder is about time, not about a score. */
export const REVIEW_AFTER_DAYS = 7;

export interface ReviewDue {
  skill: Skill;
  daysSince: number;
  status: SkillStatus;
  /** Plain-language reason, built only from the player's own record. */
  reason: string;
}

/**
 * Learned skills that have gone quiet for a week or more, longest-quiet first. Only skills the player has actually
 * worked on qualify (evidence exists); a skill never touched is a lesson to take, not a review to do.
 */
export function reviewsDue(save: SaveData, nowMs: number, challengeSkills: (id: string) => string[] | undefined): ReviewDue[] {
  return skillReviews(save, nowMs, challengeSkills)
    .filter((r) => r.learned && r.lastPracticedAt !== null && r.daysSince >= REVIEW_AFTER_DAYS && r.status !== 'none')
    .map((r): ReviewDue => ({
      skill: r.skill,
      daysSince: r.daysSince,
      status: r.status,
      reason: r.status === 'demonstrated'
        ? `You showed ${r.skill.title} independently, but not for ${r.daysSince} days. A problem at least as hard as before shows whether it has held.`
        : `You last practised ${r.skill.title} ${r.daysSince} days ago and it is still ${r.status === 'guided' ? 'guided-only' : r.status === 'developing' ? 'developing' : 'attempted'}. Skills fade without use: a short problem now is cheaper than relearning later.`,
    }))
    .sort((a, b) => b.daysSince - a.daysSince || a.skill.id.localeCompare(b.skill.id));
}
