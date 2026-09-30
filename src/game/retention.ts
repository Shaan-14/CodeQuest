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

/**
 * SPACED REVIEW. A learned skill comes due again after an interval that grows with how well it has held and shrinks when it has not.
 * Nothing is scored or hidden: the schedule is computed from the evidence log on demand, and every due review carries the plain-language
 * reasons that put it there. Inputs, in order of weight:
 *   - the latest evidence on the skill: a FAILURE after the last independent pass (or hint use on the last pass) brings the review forward to
 *     the next day: recent application trouble matters more than an old success;
 *   - how many independent, hint-free passes have happened in a row (the streak): interval = 2, 7, 14, 30, 60 days for a streak of 0, 1, 2, 3, 4+;
 *     a guided-only skill is reviewed every 3 days, one only ever failed every 2;
 *   - difficulty: if the player has never solved anything on it above difficulty 2, intervals are cut to 60%;
 *   - time: the interval runs from the latest executed evidence of ANY kind (daily, practice, lesson, training), so practising a skill
 *     anywhere restarts its clock.
 * Combinations and weaknesses are handled by the training system (training needs); fresh problems in fresh contexts by selection.ts.
 */
export const STREAK_INTERVAL_DAYS = [2, 7, 14, 30, 60] as const;
export const GUIDED_INTERVAL_DAYS = 3;
export const FAILED_INTERVAL_DAYS = 2;
/** After trouble the skill is revisited this many days later. */
export const TROUBLE_INTERVAL_DAYS = 1;

export interface ReviewState {
  skill: Skill;
  status: SkillStatus;
  /** Latest executed evidence of any kind. */
  lastPracticedAt: number;
  /** Latest hint-free independent pass, or null. */
  lastDemonstratedAt: number | null;
  /** Independent hint-free passes in a row, counted back from the latest evidence. */
  streak: number;
  intervalDays: number;
  dueAt: number;
  /** Whole days past due (negative: not due yet). */
  overdueDays: number;
  /** Why the schedule looks like this, in the player's own terms. */
  reasons: string[];
}

const dayWord = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

export function reviewSchedule(save: SaveData, nowMs: number, challengeSkills: (id: string) => string[] | undefined): ReviewState[] {
  const out: ReviewState[] = [];
  for (const r of skillReviews(save, nowMs, challengeSkills)) {
    if (!r.learned || r.lastPracticedAt === null || r.status === 'none') continue;
    const mine = save.evidence.filter((e) => e.executed && e.skillIds.includes(r.skill.id)).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    if (!mine.length) continue;
    const isIndependent = (e: (typeof mine)[number]) => e.passed && (e.support === 'independent' || e.support === 'transfer') && e.hintsUsed === 0;
    const latest = mine[mine.length - 1]!;
    const lastDemo = [...mine].reverse().find(isIndependent);
    let streak = 0;
    for (let k = mine.length - 1; k >= 0; k--) { if (isIndependent(mine[k]!)) streak++; else break; }
    const reasons: string[] = [];
    let interval: number;
    const trouble = !latest.passed || (latest.passed && latest.hintsUsed > 0 && r.status !== 'guided');
    if (trouble) {
      interval = TROUBLE_INTERVAL_DAYS;
      reasons.push(!latest.passed ? 'Your latest attempt on it did not pass, so it is worth another look soon.' : 'Your latest pass used a hint, so the review comes sooner than if it had been solo.');
    } else if (streak === 0) {
      interval = r.status === 'guided' ? GUIDED_INTERVAL_DAYS : r.status === 'attempted' ? FAILED_INTERVAL_DAYS : STREAK_INTERVAL_DAYS[0];
      reasons.push(r.status === 'guided' ? 'So far you have only solved it with guidance.' : r.status === 'attempted' ? 'You have tried it but not yet passed it.' : 'It has not yet been shown on its own twice in a row.');
    } else {
      interval = STREAK_INTERVAL_DAYS[Math.min(streak, STREAK_INTERVAL_DAYS.length - 1)]!;
      reasons.push(`You have solved it independently ${streak === 1 ? 'once' : `${streak} times in a row`}, so the next check is ${dayWord(interval)} after the last one.`);
    }
    if (r.maxIndependentDifficulty < 3 && interval > 2) {
      interval = Math.max(2, Math.round(interval * 0.6));
      reasons.push('Everything you solved on it was at an easier level, so the check comes a little sooner.');
    }
    if (lastDemo) reasons.push(`Last shown independently ${dayWord(Math.max(0, Math.floor((nowMs - Date.parse(lastDemo.at)) / DAY_MS)))} ago at difficulty ${lastDemo.difficulty}.`);
    const dueAt = r.lastPracticedAt + interval * DAY_MS;
    out.push({ skill: r.skill, status: r.status, lastPracticedAt: r.lastPracticedAt, lastDemonstratedAt: lastDemo ? Date.parse(lastDemo.at) : null, streak, intervalDays: interval, dueAt, overdueDays: Math.floor((nowMs - dueAt) / DAY_MS), reasons });
  }
  return out;
}

export interface ReviewDue {
  skill: Skill;
  daysSince: number;
  status: SkillStatus;
  intervalDays: number;
  /** Plain-language reason, built only from the player's own record. */
  reason: string;
  reasons: string[];
}

/** Learned skills whose scheduled review has arrived, the most overdue first. Mastery is never lowered by being due. */
export function reviewsDue(save: SaveData, nowMs: number, challengeSkills: (id: string) => string[] | undefined): ReviewDue[] {
  return reviewSchedule(save, nowMs, challengeSkills)
    .filter((r) => nowMs >= r.dueAt)
    .map((r): ReviewDue => {
      const daysSince = Math.max(0, Math.floor((nowMs - r.lastPracticedAt) / DAY_MS));
      const head = r.status === 'demonstrated'
        ? `You showed ${r.skill.title} independently, and it is time to check that it has held (${dayWord(daysSince)} since you last used it).`
        : `${r.skill.title} is ${r.status === 'guided' ? 'guided-only' : r.status === 'developing' ? 'still developing' : 'not yet passed'} and ${dayWord(daysSince)} have passed since you last used it.`;
      return { skill: r.skill, daysSince, status: r.status, intervalDays: r.intervalDays, reason: `${head} ${r.reasons[0] ?? ''}`.trim(), reasons: r.reasons };
    })
    .sort((a, b) => b.daysSince - a.daysSince || a.skill.id.localeCompare(b.skill.id));
}
