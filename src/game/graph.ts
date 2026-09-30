/**
 * THE SKILL GRAPH: the one place that answers "can this player do this yet, and if not, what exactly is missing?".
 * Pure functions over the save. Content declares the edges (Skill.prerequisites, Lesson.prerequisites / requires,
 * Challenge.requires, Area locks); nothing here knows a particular lesson or technology.
 *
 *   competency     what the player has SHOWN on a skill (evidence, never XP): none < introduced < developing < demonstrated
 *   gap            one missing requirement, with where to learn it
 *   access         lessonAccess / areaGaps / challengeEligible: the answers the UI and the Daily Challenge use
 *
 * A completed lesson only ever makes a skill `introduced`; `developing` and `demonstrated` need independent evidence.
 */
import { getAnyChallenge, getLesson, getSkill, lessons } from '../content';
import { getComposite } from '../content/composites';
import type { Area, Challenge, Competency, Lesson, SkillReq } from '../content/schema';
import { trackOfLessonId, trackOfSkillId, worldOfTrack, type Track } from '../content/worlds';
import type { SaveData } from '../core/save';
import { skills as allSkills } from '../content/skills';
import { summarizeSkill } from '../learning/mastery';
import { summarizeComposite } from './skillHistory';

const RANK: Record<Competency, number> = { none: 0, introduced: 1, developing: 2, demonstrated: 3 };
export const meets = (have: Competency, need: Competency): boolean => RANK[have] >= RANK[need];
export const LEVEL_WORDS: Record<Competency, string> = { none: 'not started', introduced: 'introduced', developing: 'developing', demonstrated: 'demonstrated' };

/** A skill that a completed lesson touches: the lesson's own skill plus the skills its challenges exercise. */
function skillsOfLesson(l: Lesson): string[] {
  const ids = new Set([l.skillId]);
  for (const s of l.steps) if (s.kind === 'challenge') for (const k of getAnyChallenge(s.challengeId)?.skillIds ?? []) ids.add(k);
  return [...ids];
}

// One snapshot per save object (saves are immutable once applied), so a daily that checks hundreds of challenges stays cheap.
const cache = new WeakMap<SaveData, Map<string, Competency>>();

function snapshot(save: SaveData): Map<string, Competency> {
  const hit = cache.get(save);
  if (hit) return hit;
  const taught = new Set<string>();
  for (const l of lessons) if (save.learning.lessons[l.id]?.completed) for (const k of skillsOfLesson(l)) taught.add(k);
  const out = new Map<string, Competency>();
  for (const skill of allSkills) {
    const sum = summarizeSkill(save.evidence, skill);
    out.set(skill.id, sum.status === 'demonstrated' ? 'demonstrated' : sum.independentPasses > 0 ? 'developing' : sum.passes > 0 || taught.has(skill.id) ? 'introduced' : 'none');
  }
  cache.set(save, out);
  return out;
}

/** What the player has shown on one skill. */
export const competencyOf = (save: SaveData, skillId: string): Competency => snapshot(save).get(skillId) ?? 'none';

/** What the player has shown on a COMBINATION of skills (content/composites.ts). */
export function compositeCompetency(save: SaveData, compositeId: string): Competency {
  const c = getComposite(compositeId);
  if (!c) return 'none';
  const st = summarizeComposite(save.evidence, c).status;
  return st === 'demonstrated' ? 'demonstrated' : st === 'developing' ? 'developing' : st === 'guided' ? 'introduced' : 'none';
}

export interface Teach { areaId: string; lessonId: string; lessonTitle: string }

export interface Gap {
  kind: 'skill' | 'composite' | 'objective' | 'lesson';
  id: string;
  title: string;
  have: Competency;
  need: Competency;
  track: Track;
  /** Where to go to close this gap: the lesson to open NOW (the first one on the path that is actually available). */
  teach?: Teach;
}

/** The lesson that teaches a skill (the first, in teaching order, whose own skill it is). */
export function lessonTeaching(skillId: string): Lesson | undefined {
  return lessons.find((l) => l.skillId === skillId) ?? lessons.find((l) => skillsOfLesson(l).includes(skillId));
}

const teachFor = (l: Lesson): Teach => ({ areaId: worldOfTrack(trackOfLessonId(l.id)).areaId, lessonId: l.id, lessonTitle: l.title });

/**
 * The lesson to open to make progress towards a lesson that is not available yet: itself if open, otherwise the first
 * missing prerequisite on its path (so "go and learn loops" never points at a lesson that is itself out of reach).
 */
export function nextOpenLesson(save: SaveData, l: Lesson, depth = 0): Lesson {
  if (depth > 12) return l;
  const gaps = lessonGaps(save, l);
  if (!gaps.length) return l;
  const step = gaps.find((g) => g.teach && g.teach.lessonId !== l.id);
  const next = step?.teach ? getLesson(step.teach.lessonId) : undefined;
  return next ? nextOpenLesson(save, next, depth + 1) : l;
}

function gapOfReq(save: SaveData, req: SkillReq): Gap | null {
  if ('skill' in req) {
    const need = req.level ?? 'introduced';
    const have = competencyOf(save, req.skill);
    if (meets(have, need)) return null;
    const teacher = lessonTeaching(req.skill);
    const open = teacher ? nextOpenLesson(save, teacher) : undefined;
    return { kind: 'skill', id: req.skill, title: getSkill(req.skill)?.title ?? req.skill, have, need, track: trackOfSkillId(req.skill), teach: open ? teachFor(open) : undefined };
  }
  if ('composite' in req) {
    const need = req.level ?? 'developing';
    const have = compositeCompetency(save, req.composite);
    if (meets(have, need)) return null;
    const c = getComposite(req.composite);
    const weakest = c?.skillIds.find((k) => !meets(competencyOf(save, k), 'introduced')) ?? c?.skillIds[0];
    const teacher = weakest ? lessonTeaching(weakest) : undefined;
    const open = teacher ? nextOpenLesson(save, teacher) : undefined;
    return { kind: 'composite', id: req.composite, title: c?.title ?? req.composite, have, need, track: trackOfSkillId(c?.skillIds[0] ?? ''), teach: open ? teachFor(open) : undefined };
  }
  const passed = save.evidence.some((r) => r.passed && (r.objectiveId === req.objective || r.challengeId === req.objective));
  if (passed) return null;
  const c = getAnyChallenge(req.objective);
  return { kind: 'objective', id: req.objective, title: c?.title ?? req.objective, have: 'none', need: 'introduced', track: 'python' };
}

/** Everything in `reqs` the player has not shown yet. Empty = satisfied. */
export const gapsFor = (save: SaveData, reqs: SkillReq[] | undefined): Gap[] => (reqs ?? []).map((r) => gapOfReq(save, r)).filter((g): g is Gap => !!g);

function lessonGapOf(save: SaveData, id: string): Gap | undefined {
  if (save.learning.lessons[id]?.completed) return undefined;
  const pre = getLesson(id);
  return pre ? { kind: 'lesson', id, title: pre.title, have: 'none', need: 'introduced', track: trackOfLessonId(id), teach: teachFor(nextOpenLesson(save, pre)) } : undefined;
}

/** Gaps that keep a lesson from being opened: unfinished lessons of its own world, then cross-world competencies. */
export function lessonGaps(save: SaveData, lesson: Lesson): Gap[] {
  const out: Gap[] = [];
  for (const id of lesson.prerequisites) {
    const g = lessonGapOf(save, id);
    if (g) out.push(g);
  }
  return [...out, ...gapsFor(save, lesson.requires)];
}

export interface Access { open: boolean; gaps: Gap[] }
export function lessonAccess(save: SaveData, lesson: Lesson): Access {
  const gaps = lessonGaps(save, lesson);
  return { open: gaps.length === 0, gaps };
}

/** Skills a player must still show before an area opens (areas with `lock.type === 'skills'`). */
export const areaGaps = (save: SaveData, area: Area): Gap[] => (area.lock.type === 'skills' ? gapsFor(save, area.lock.requires) : []);

/**
 * Whether a challenge may be attempted OUTSIDE its lesson (Practice, Daily, Training): every skill it exercises (or its
 * explicit `requires`) must be at least introduced. Never surprises the player with something they have not met.
 */
export function challengeGaps(save: SaveData, c: Challenge): Gap[] {
  const reqs: SkillReq[] = c.requires ?? c.skillIds.map((skill) => ({ skill }));
  return gapsFor(save, reqs);
}
export const challengeEligible = (save: SaveData, c: Challenge): boolean => challengeGaps(save, c).length === 0;

/** Short plain-language line for one gap: what is missing and where to go. */
export function describeGap(g: Gap): string {
  const what = g.kind === 'lesson' ? `Finish “${g.title}”` : g.kind === 'composite' ? `${g.title}: use these skills together` : g.kind === 'objective' ? `Solve “${g.title}”` : `${g.title}${g.need === 'introduced' ? '' : ` (${LEVEL_WORDS[g.need]})`}`;
  const where = g.teach ? ` → ${worldOfTrack(g.track).name.split(':')[0]}: ${g.teach.lessonTitle}` : '';
  return what + where;
}

export interface Unlock { kind: 'lesson' | 'area'; id: string; title: string }

/** What showing a competency helps open (lessons whose requirements mention it, or lessons that list its lesson as a prerequisite). */
export function unlocksOf(skillId: string): Unlock[] {
  const out: Unlock[] = [];
  for (const l of lessons) {
    const mentions = (l.requires ?? []).some((r) => 'skill' in r && r.skill === skillId);
    const teachers = lessonTeaching(skillId);
    if (mentions || (teachers && l.prerequisites.includes(teachers.id))) out.push({ kind: 'lesson', id: l.id, title: l.title });
  }
  return out;
}

/** Every lesson of a world, annotated with access: the player's map of that world. */
export function worldLessons(save: SaveData, track: Track): { lesson: Lesson; access: Access }[] {
  return lessons.filter((l) => trackOfLessonId(l.id) === track).map((lesson) => ({ lesson, access: lessonAccess(save, lesson) }));
}

export interface ReqStatus { title: string; track: Track; need: Competency; have: Competency; ok: boolean; gap?: Gap }

/** Every requirement of a lesson or area, met or not: the gate panel shows what the player HAS shown as well as what is missing. */
export function reportFor(save: SaveData, reqs: SkillReq[] | undefined, prerequisiteLessons: string[] = []): ReqStatus[] {
  const out: ReqStatus[] = [];
  for (const id of prerequisiteLessons) {
    const l = getLesson(id);
    if (!l) continue;
    const done = !!save.learning.lessons[id]?.completed;
    out.push({ title: `Lesson: ${l.title}`, track: trackOfLessonId(id), need: 'introduced', have: done ? 'introduced' : 'none', ok: done, gap: lessonGapOf(save, id) });
  }
  for (const r of reqs ?? []) {
    const gap = gapOfReq(save, r) ?? undefined;
    if ('skill' in r) out.push({ title: getSkill(r.skill)?.title ?? r.skill, track: trackOfSkillId(r.skill), need: r.level ?? 'introduced', have: competencyOf(save, r.skill), ok: !gap, gap });
    else if ('composite' in r) out.push({ title: getComposite(r.composite)?.title ?? r.composite, track: gap?.track ?? 'python', need: r.level ?? 'developing', have: compositeCompetency(save, r.composite), ok: !gap, gap });
    else out.push({ title: getAnyChallenge(r.objective)?.title ?? r.objective, track: 'python', need: 'introduced', have: gap ? 'none' : 'introduced', ok: !gap, gap });
  }
  return out;
}
