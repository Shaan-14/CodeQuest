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
import { reviewsDue } from './retention';
import { lessonAccess } from './graph';

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

/**
 * The lesson that owns an objective (the first, in teaching order, with a challenge step on it). Content is static, so the map is built once:
 * scanning every lesson and step per call made entering a world with a late-game save block the main thread for ~500 ms.
 */
let lessonByObjective: Map<string, Lesson> | null = null;
function ownerOfObjective(objectiveId: string): Lesson | undefined {
  if (!lessonByObjective) {
    const byChallenge = new Map(challenges.map((c) => [c.id, c]));
    lessonByObjective = new Map();
    for (const l of lessons) for (const st of l.steps) if (st.kind === 'challenge') {
      const c = byChallenge.get(st.challengeId);
      if (c && !lessonByObjective.has(objectiveOf(c))) lessonByObjective.set(objectiveOf(c), l);
    }
  }
  return lessonByObjective.get(objectiveId);
}

/** Objectives whose lesson the player has reached (so practice never spoils or skips ahead). One answer per save object (saves are immutable once applied). */
const availableCache = new WeakMap<SaveData, string[]>();
export function availableObjectives(save: SaveData): string[] {
  const hit = availableCache.get(save);
  if (hit) return hit;
  const out = computeAvailableObjectives(save);
  availableCache.set(save, out);
  return out;
}
function computeAvailableObjectives(save: SaveData): string[] {
  return objectives
    .filter((o) => {
      const vs = variantsOf(o.id);
      const lesson = ownerOfObjective(o.id);
      if (!lesson) return false;
      const done = save.learning.lessons[lesson.id]?.completed;
      const started = (save.learning.lessons[lesson.id]?.stepIndex ?? 0) > 0 || vs.some((c) => (save.learning.challenges[c.id]?.attempts ?? 0) > 0);
      const unlocked = lessonAccess(save, lesson).open; // prerequisite lessons AND any cross-world skill requirements
      return done || (unlocked && started);
    })
    .map((o) => o.id);
}

export type RecommendationKind = 'retry' | 'less-support' | 'review' | 'revisit' | 'new-context' | 'harder' | 'next-lesson';

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
 * The best problem to review a skill with: not yet passed first; at least as hard as before for a skill the player
 * has shown independently (`strong`), otherwise gentler first; and in a different setting from the last thing done
 * when there is a choice. Deterministic: ties fall back to the challenge id.
 */
function reviewChallenge(save: SaveData, skillId: string, strong: boolean, avail: Set<string>): Challenge | undefined {
  const lastContext = [...save.evidence].reverse().find((r) => r.skillIds.includes(skillId))?.context;
  const pool = challenges.filter((c) => c.skillIds.includes(skillId) && c.mode !== 'learning' && avail.has(objectiveOf(c)));
  const maxIndependent = save.evidence.filter((r) => r.passed && r.skillIds.includes(skillId) && (r.support === 'independent' || r.support === 'transfer')).reduce((m, r) => Math.max(m, r.difficulty), 0);
  return [...pool].sort((a, b) => {
    const passedA = save.learning.challenges[a.id]?.passed ? 1 : 0;
    const passedB = save.learning.challenges[b.id]?.passed ? 1 : 0;
    if (passedA !== passedB) return passedA - passedB;
    const freshA = a.context !== lastContext ? 0 : 1;
    const freshB = b.context !== lastContext ? 0 : 1;
    if (freshA !== freshB) return freshA - freshB;
    if (strong) {
      const okA = a.difficulty >= maxIndependent ? 0 : 1;
      const okB = b.difficulty >= maxIndependent ? 0 : 1;
      if (okA !== okB) return okA - okB;
      if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
    } else if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
    return a.id.localeCompare(b.id);
  })[0];
}

/**
 * Up to `max` explainable suggestions, in priority order:
 *  1. unresolved failure    -> a DIFFERENT problem, same objective and difficulty
 *  2. guided/hinted success -> the same idea with less support
 *  3. gone quiet for a week -> a review problem (harder if the skill was shown independently): forgetting is real
 *  4. an old, shaky concept -> back again in a new context
 *  5. solved in one setting -> the same skill in an unfamiliar setting (transfer)
 *  6. easy wins             -> a harder objective in the same skill
 *  7. otherwise             -> the next lesson
 * `nowMs` is a parameter so the result is a pure function of (save, time).
 */
export function recommendPractice(save: SaveData, max = 3, nowMs: number = Date.now()): Recommendation[] {
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

  // 3. Skills that have gone quiet for a week or more (time-based forgetting)
  for (const due of reviewsDue(save, nowMs, (id) => challenges.find((c) => c.id === id)?.skillIds)) {
    const cand = reviewChallenge(save, due.skill.id, due.status === 'demonstrated', avail);
    if (cand) add({ kind: 'review', objectiveId: objectiveOf(cand), challengeId: cand.id, title: `Review ${due.skill.title}`, reason: due.reason });
  }

  // 4. Shaky, cold skills come back in a new context
  for (const skill of skills) {
    const sum = summarizeSkill(save.evidence, skill);
    if ((sum.status === 'guided' || sum.status === 'developing') && recordsSince(save, skill.id) >= 8) {
      const cand = challenges.find((c) => c.skillIds.includes(skill.id) && c.mode !== 'learning' && avail.has(objectiveOf(c)) && !save.learning.challenges[c.id]?.passed);
      if (cand) add({ kind: 'revisit', objectiveId: objectiveOf(cand), challengeId: cand.id, title: `Revisit ${skill.title}`, reason: `You have not practised ${skill.title} for a while and your evidence is still ${sum.status === 'guided' ? 'guided-only' : 'developing'}. A problem in a new context (${cand.context ?? 'a new setting'}) will show whether it has stuck.` });
    }
  }

  // 5. Independent success in only one setting -> the same skill somewhere unfamiliar
  for (const skill of skills) {
    const sum = summarizeSkill(save.evidence, skill);
    if (sum.status === 'demonstrated' || sum.independentPasses < 1 || sum.distinctIndependentContexts !== 1) continue;
    const seen = save.evidence.find((r) => r.passed && r.skillIds.includes(skill.id) && (r.support === 'independent' || r.support === 'transfer'))?.context;
    const cand = challenges.find((c) => c.skillIds.includes(skill.id) && c.mode !== 'learning' && c.context !== seen && avail.has(objectiveOf(c)) && !save.learning.challenges[c.id]?.passed);
    if (cand) add({ kind: 'new-context', objectiveId: objectiveOf(cand), challengeId: cand.id, title: `New setting: ${skill.title}`, reason: `Every ${skill.title} problem you solved on your own was in the same setting (${seen ?? 'one context'}). Solving one in an unfamiliar setting is what shows the skill transfers.` });
  }

  // 6. Solving everything easily -> harder work in the same skill
  for (const skill of skills) {
    if (!detectPatterns(save.evidence, skill.id).some((p) => p.kind === 'solving-easily')) continue;
    const sum = summarizeSkill(save.evidence, skill);
    const cand = challenges.find((c) => c.skillIds.includes(skill.id) && c.difficulty > sum.maxIndependentDifficulty && avail.has(objectiveOf(c)) && !save.learning.challenges[c.id]?.passed);
    if (cand) add({ kind: 'harder', objectiveId: objectiveOf(cand), challengeId: cand.id, title: `A harder one: ${getObjective(objectiveOf(cand))?.title ?? cand.title}`, reason: `You have been solving ${skill.title} problems on the first try with no hints. This one is difficulty ${cand.difficulty}: a step up from the ${sum.maxIndependentDifficulty} you have handled independently.` });
  }

  // 7. Next lesson
  const next = nextLesson(save);
  if (next) add({ kind: 'next-lesson', lessonId: next.id, title: `Continue: ${next.title}`, reason: 'The next lesson in your quest.' });
  return recs;
}

/** The lesson that teaches an objective (the one whose step uses one of its variants). */
export function lessonOfObjective(objectiveId: string): Lesson | undefined {
  return ownerOfObjective(objectiveId);
}

export const skillTitle = (id: string): string => getSkill(id)?.title ?? id;
