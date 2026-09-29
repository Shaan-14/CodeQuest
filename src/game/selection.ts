/**
 * Variant selection and practice recommendations. PURE and DETERMINISTIC (no randomness) so
 * behaviour is testable and explainable: every recommendation carries a plain-language reason
 * derived from the player's own evidence.
 *
 * Principles (see CLAUDE.md): a retry gives a DIFFERENT problem on the SAME objective (same difficulty
 * and concepts); difficulty rises only when evidence shows the player is ready; nothing is hidden.
 */
import { challenges, getObjective, getSkill, lessons, objectives, skills, variantsOf } from '../content';
import { objectiveOf } from '../content/helpers';
import type { Challenge, Lesson } from '../content/schema';
import type { SaveData } from '../core/save';
import { detectPatterns, summarizeSkill } from '../learning/mastery';
import { nextLesson } from './lessons';

export interface ObjectiveStatus {
  objectiveId: string;
  variants: number;
  /** Variants the player has graded at least once. */
  tried: number;
  passedVariants: number;
  /** Any variant passed. */
  passed: boolean;
  /** Passed with no hints in challenge/independent mode. */
  independentPasses: number;
  failedAttempts: number;
  /** Index (in evidence) of the most recent record for this objective, or -1. */
  lastIndex: number;
}

export function objectiveStatus(save: SaveData, objectiveId: string): ObjectiveStatus {
  const vs = variantsOf(objectiveId);
  const recs = save.evidence.filter((r) => r.objectiveId === objectiveId && r.executed);
  const triedIds = new Set(recs.map((r) => r.challengeId));
  const passedIds = new Set(recs.filter((r) => r.passed).map((r) => r.challengeId));
  return {
    objectiveId,
    variants: vs.length,
    tried: triedIds.size,
    passedVariants: passedIds.size,
    passed: passedIds.size > 0,
    independentPasses: recs.filter((r) => r.passed && (r.support === 'independent' || r.support === 'transfer')).length,
    failedAttempts: recs.filter((r) => !r.passed).length,
    lastIndex: save.evidence.reduce((idx, r, i) => (r.objectiveId === objectiveId ? i : idx), -1),
  };
}

const lastAttemptIndex = (save: SaveData, challengeId: string) =>
  save.evidence.reduce((idx, r, i) => (r.challengeId === challengeId ? i : idx), -1);

/**
 * Choose which variant of an objective to present next.
 * Preference: never-passed before passed; then fewest attempts; then least recently attempted; then authoring order.
 * The `current` variant is avoided whenever another exists, so a retry is always a different problem.
 */
export function pickVariant(save: SaveData, objectiveId: string, current?: string): Challenge | undefined {
  const vs = variantsOf(objectiveId);
  if (vs.length === 0) return undefined;
  const pool = vs.filter((c) => c.id !== current);
  const candidates = pool.length ? pool : vs;
  const key = (c: Challenge, i: number) => {
    const p = save.learning.challenges[c.id];
    return [p?.passed ? 1 : 0, p?.attempts ?? 0, lastAttemptIndex(save, c.id), i] as const;
  };
  return [...candidates].sort((a, b) => {
    const ka = key(a, vs.indexOf(a));
    const kb = key(b, vs.indexOf(b));
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i]! - kb[i]!;
    return 0;
  })[0];
}

/** True if a different problem on the same objective exists (so "try a different problem" is offered). */
export const hasAlternate = (objectiveId: string, currentId: string): boolean => variantsOf(objectiveId).some((c) => c.id !== currentId);

/** Has the player unlocked (completed the prerequisites of) the lesson that owns this challenge? */
function lessonOf(challengeId: string): Lesson | undefined {
  return lessons.find((l) => l.steps.some((s) => s.kind === 'challenge' && objectiveOf(challengeOf(s.challengeId)!) === objectiveOf(challengeOf(challengeId)!)));
}
const challengeOf = (id: string) => challenges.find((c) => c.id === id);

/** Objectives whose lesson the player has reached (so practice never spoils or skips ahead). */
export function availableObjectives(save: SaveData): string[] {
  return objectives
    .filter((o) => {
      const vs = variantsOf(o.id);
      const lesson = vs.map((c) => lessonOf(c.id)).find(Boolean);
      if (!lesson) return false;
      const done = save.learning.lessons[lesson.id]?.completed;
      const started = (save.learning.lessons[lesson.id]?.stepIndex ?? 0) > 0 || vs.some((c) => (save.learning.challenges[c.id]?.attempts ?? 0) > 0);
      const unlocked = lesson.prerequisites.every((p) => save.learning.lessons[p]?.completed);
      return done || (unlocked && started);
    })
    .map((o) => o.id);
}

export type RecommendationKind = 'retry' | 'less-support' | 'revisit' | 'harder' | 'next-lesson';

export interface Recommendation {
  kind: RecommendationKind;
  title: string;
  /** Why the game suggests this, in terms of the player's own evidence. */
  reason: string;
  objectiveId?: string;
  challengeId?: string;
  lessonId?: string;
}

/** Records since the player last touched a skill (how "cold" it has become). */
const recordsSince = (save: SaveData, skillId: string) => {
  const last = save.evidence.reduce((idx, r, i) => (r.skillIds.includes(skillId) ? i : idx), -1);
  return last < 0 ? 0 : save.evidence.length - 1 - last;
};

/**
 * Up to `max` explainable suggestions, in priority order:
 *  1. unresolved failure   -> a DIFFERENT problem, same objective and difficulty
 *  2. guided/hinted success -> the same idea with less support
 *  3. an old, shaky concept -> back again in a new context
 *  4. easy wins            -> a harder objective in the same skill
 *  5. otherwise            -> the next lesson
 */
export function recommendPractice(save: SaveData, max = 3): Recommendation[] {
  const recs: Recommendation[] = [];
  const seen = new Set<string>();
  const add = (r: Recommendation) => {
    const key = `${r.kind}:${r.objectiveId ?? r.lessonId}`;
    if (!seen.has(key) && recs.length < max) {
      seen.add(key);
      recs.push(r);
    }
  };
  const avail = new Set(availableObjectives(save));

  // 1. Unresolved failure
  for (const o of objectives) {
    if (!avail.has(o.id)) continue;
    const st = objectiveStatus(save, o.id);
    if (st.failedAttempts > 0 && !st.passed) {
      const lastFailed = [...save.evidence].reverse().find((r) => r.objectiveId === o.id)?.challengeId;
      const next = pickVariant(save, o.id, lastFailed);
      if (next) {
        add({
          kind: 'retry', objectiveId: o.id, challengeId: next.id, title: `Try a fresh problem: ${o.title}`,
          reason: next.id !== lastFailed
            ? `You have not passed “${o.title}” yet (${st.failedAttempts} failed attempt${st.failedAttempts > 1 ? 's' : ''}). A different problem on the same idea, at the same difficulty, is the best way to find out what is missing.`
            : `You have not passed “${o.title}” yet. Review the lesson notes, then try again.`,
        });
      }
    }
  }

  // 2. Passed only with guidance or hints -> same idea with less support
  for (const o of objectives) {
    if (!avail.has(o.id)) continue;
    const st = objectiveStatus(save, o.id);
    const vs = variantsOf(o.id);
    if (st.passed && st.independentPasses === 0 && vs.some((c) => c.mode !== 'learning')) {
      const next = pickVariant(save, o.id);
      if (next) add({ kind: 'less-support', objectiveId: o.id, challengeId: next.id, title: `Again, without hints: ${o.title}`, reason: `You solved “${o.title}” with hints. Only hint-free solves count as independent evidence, so try a different problem on it without opening any hints.` });
    }
  }

  // 3. Shaky, cold skills come back in a new context
  for (const skill of skills) {
    const sum = summarizeSkill(save.evidence, skill);
    if ((sum.status === 'guided' || sum.status === 'developing') && recordsSince(save, skill.id) >= 8) {
      const cand = challenges.find((c) => c.skillIds.includes(skill.id) && c.mode !== 'learning' && avail.has(objectiveOf(c)) && !save.learning.challenges[c.id]?.passed);
      if (cand) add({ kind: 'revisit', objectiveId: objectiveOf(cand), challengeId: cand.id, title: `Revisit ${skill.title}`, reason: `You have not practised ${skill.title} for a while and your evidence is still ${sum.status === 'guided' ? 'guided-only' : 'developing'}. A problem in a new context (${cand.context ?? 'a new setting'}) will show whether it has stuck.` });
    }
  }

  // 4. Solving everything easily -> harder work in the same skill
  for (const skill of skills) {
    if (!detectPatterns(save.evidence, skill.id).some((p) => p.kind === 'solving-easily')) continue;
    const sum = summarizeSkill(save.evidence, skill);
    const cand = challenges.find((c) => c.skillIds.includes(skill.id) && c.difficulty > sum.maxIndependentDifficulty && avail.has(objectiveOf(c)) && !save.learning.challenges[c.id]?.passed);
    if (cand) add({ kind: 'harder', objectiveId: objectiveOf(cand), challengeId: cand.id, title: `A harder one: ${getObjective(objectiveOf(cand))?.title ?? cand.title}`, reason: `You have been solving ${skill.title} problems on the first try with no hints. This one is difficulty ${cand.difficulty}: a step up from the ${sum.maxIndependentDifficulty} you have handled independently.` });
  }

  // 5. Next lesson
  const next = nextLesson(save);
  if (next) add({ kind: 'next-lesson', lessonId: next.id, title: `Continue: ${next.title}`, reason: 'The next lesson in your quest.' });
  return recs;
}

/** The lesson that teaches an objective (the one whose step uses one of its variants). */
export function lessonOfObjective(objectiveId: string): Lesson | undefined {
  return variantsOf(objectiveId).map((c) => lessonOf(c.id)).find(Boolean);
}

export const skillTitle = (id: string): string => getSkill(id)?.title ?? id;
