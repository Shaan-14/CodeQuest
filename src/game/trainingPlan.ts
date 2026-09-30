/**
 * TRAINING PLAN BUILDER. Picks FRESH problems for a weakness and arranges them by how serious it is.
 * Deterministic (no randomness). Training never uses the challenge that exposed the weakness, prefers a different
 * context each time, and only draws on content the player has already been taught.
 *
 *   refresher : review -> proof
 *   targeted  : review -> example -> practice -> proof
 *   extended  : review -> example -> predict -> practice x2 -> proof
 *   deep      : prerequisite reviews -> review -> example -> predict -> practice x4 -> proof
 * The proof is ONE fresh problem, last. Practice problems come from authored training content (content/training/) or
 * from lessons OTHER than the one the player is stuck on, in different contexts.
 */
import { challenges, getAnyChallenge, getSkill, dailyChallenges, lessonOfChallenge } from '../content';
import { objectiveOf } from '../content/helpers';
import { diagnosticsOf } from '../content/diagnostics';
import { getComposite } from '../content/composites';
import type { Challenge } from '../content/schema';
import type { PlanLevel, SaveData, TrainingStep, TrainingStepKind, Weakness } from '../core/save';
import { availableObjectives } from './selection';
import { moduleFor } from '../content/training/modules';
import { trainingProblems } from '../content/training/problems';

export interface PoolQuery {
  skillIds: string[];
  /** Require the challenge to exercise ALL of these skills (combined problems). */
  allOf?: boolean;
  excludeIds: Set<string>;
  /** Objectives already used (by the plan or the exposing problem): other variants are allowed but ranked last. */
  excludeObjectives: Set<string>;
  exposedObjective?: string;
  avoidContexts: Set<string>;
  modes: ('learning' | 'challenge' | 'independent')[];
  targetDifficulty: number;
}

/** Content the player has been taught: lesson challenges of reached objectives, plus dailies whose lessons are done. */
export function taughtPool(save: SaveData): Challenge[] {
  const avail = new Set(availableObjectives(save));
  const lessonPool = challenges.filter((c) => avail.has(objectiveOf(c)));
  const dailyPool = dailyChallenges.filter((c) => (c.daily?.requires ?? []).every((l) => save.learning.lessons[l]?.completed));
  return [...lessonPool, ...dailyPool];
}

/** Best fresh challenge for a query, or undefined. Ranking is explicit and stable. */
export function pickFresh(save: SaveData, q: PoolQuery): Challenge | undefined {
  const pool = taughtPool(save).filter((c) => {
    if (q.excludeIds.has(c.id)) return false;
    if (!q.modes.includes(c.mode)) return false;
    const has = q.allOf ? q.skillIds.every((k) => c.skillIds.includes(k)) : q.skillIds.some((k) => c.skillIds.includes(k));
    return has;
  });
  const rank = (c: Challenge) => {
    const obj = objectiveOf(c) === q.exposedObjective ? 2 : q.excludeObjectives.has(objectiveOf(c)) ? 1 : 0;
    const passed = save.learning.challenges[c.id]?.passed ? 1 : 0;
    const attempted = (save.learning.challenges[c.id]?.attempts ?? 0) > 0 ? 1 : 0;
    const ctx = q.avoidContexts.has(c.context ?? '') ? 1 : 0;
    const daily = c.daily ? 1 : 0; // dailies are a last resort: keep them fresh for the Daily Challenge
    const dist = Math.abs(c.difficulty - q.targetDifficulty);
    const focus = q.allOf ? 0 : -c.skillIds.filter((k) => q.skillIds.includes(k)).length; // more of the weak skills = better
    const extra = q.allOf ? 0 : c.skillIds.filter((k) => !q.skillIds.includes(k)).length; // fewer unrelated skills = smaller target
    return [obj, ctx, passed, daily, dist, focus, extra, attempted];
  };
  return [...pool].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i]! - rb[i]!;
    return a.id.localeCompare(b.id);
  })[0];
}

const uid = (s: SaveData) => `t${s.training.nextId++}`;

/** Prerequisite skills (one level up) that the player has NOT shown independently: candidates for a deep plan's foundation. */
export function shakyPrerequisites(save: SaveData, skillIds: string[]): string[] {
  const out = new Set<string>();
  for (const id of skillIds) for (const p of getSkill(id)?.prerequisites ?? []) {
    const independent = save.evidence.some((r) => r.passed && (r.support === 'independent' || r.support === 'transfer') && r.skillIds.includes(p));
    const any = save.evidence.some((r) => r.skillIds.includes(p));
    if (!independent && any) out.add(p);
  }
  return [...out].slice(0, 2);
}

export interface BuildContext {
  used: Set<string>;
  usedObjectives: Set<string>;
  contexts: Set<string>;
}

function freshContext(save: SaveData, w: Weakness): BuildContext {
  const exposed = getAnyChallenge(w.exposedBy.challengeId);
  const used = new Set<string>([w.exposedBy.challengeId]);
  const usedObjectives = new Set<string>([w.exposedBy.objectiveId]);
  // Avoid problems already used by earlier plans for this weakness, so escalation is always fresh.
  for (const p of save.training.plans.filter((x) => x.weaknessId === w.id)) for (const st of p.steps) if (st.challengeId) used.add(st.challengeId);
  return { used, usedObjectives, contexts: new Set([w.exposedBy.context, ...(exposed?.context ? [exposed.context] : [])].filter(Boolean)) };
}

/**
 * Step kinds for each level. There is exactly ONE `independent` step and it is always LAST: the single fresh problem that
 * proves the training worked. Everything before it teaches from a different angle (reframe, a different example, a
 * prediction, practice with help).
 */
export function shapeFor(level: PlanLevel): (TrainingStepKind | 'prereq')[] {
  switch (level) {
    case 'refresher': return ['review', 'independent'];
    case 'targeted': return ['review', 'example', 'practice', 'independent'];
    case 'extended': return ['review', 'example', 'predict', 'practice', 'practice', 'independent'];
    case 'deep': return ['prereq', 'review', 'example', 'predict', 'practice', 'practice', 'practice', 'practice', 'independent'];
  }
}

/** Authored training problem for a role, best coverage of the weakness first; never one already used or from the exposing problem. */
function pickAuthored(save: SaveData, w: Weakness, role: 'practice' | 'proof', ctx: BuildContext, target: number): Challenge | undefined {
  const done = (id: string) => !!save.learning.lessons[id]?.completed;
  const pool = trainingProblems.filter((c) => c.training!.role === role && !ctx.used.has(c.id) && c.training!.requires.every(done) && c.skillIds.some((k) => w.skillIds.includes(k)));
  const rank = (c: Challenge) => {
    const covers = c.training!.skills.filter((k) => w.skillIds.includes(k)).length;
    const full = c.training!.skills.every((k) => w.skillIds.includes(k)) ? 0 : 1;
    return [-covers, full, ctx.contexts.has(c.context ?? '') ? 1 : 0, Math.abs(c.difficulty - target), c.training!.skills.length];
  };
  return [...pool].sort((a, b) => { const ra = rank(a); const rb = rank(b); for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i]! - rb[i]!; return a.id.localeCompare(b.id); })[0];
}

export function buildSteps(save: SaveData, w: Weakness, level: PlanLevel, ctx: BuildContext = freshContext(save, w), kinds: (TrainingStepKind | 'prereq')[] = shapeFor(level)): TrainingStep[] {
  const exposed = getAnyChallenge(w.exposedBy.challengeId);
  const base = exposed?.difficulty ?? 3;
  const exposingLesson = w.exposedBy.lessonId;
  const mod = moduleFor(w.skillIds);
  const prereq = shakyPrerequisites(save, w.skillIds);
  const steps: TrainingStep[] = [];
  const mk = (kind: TrainingStepKind, skillId: string, challenge?: Challenge): TrainingStep => ({ id: uid(save), kind, skillId, challengeId: challenge?.id, done: false, attempts: 0 });
  const take = (c: Challenge | undefined) => {
    if (c) { ctx.used.add(c.id); ctx.usedObjectives.add(objectiveOf(c)); if (c.context) ctx.contexts.add(c.context); }
    return c;
  };
  const query = (modes: PoolQuery['modes'], target: number, allOf: boolean, notLesson: boolean): PoolQuery => ({ skillIds: w.skillIds, allOf, excludeIds: notLesson ? new Set([...ctx.used, ...challenges.filter((c) => exposingLesson && lessonOfChallenge(c.id)?.id === exposingLesson).map((c) => c.id)]) : ctx.used, excludeObjectives: ctx.usedObjectives, exposedObjective: w.exposedBy.objectiveId, avoidContexts: ctx.contexts, modes, targetDifficulty: target });
  /** Authored training problem first, then a problem from a DIFFERENT lesson, then (only if nothing else exists) any fresh problem. */
  const problem = (role: 'practice' | 'proof', target: number): Challenge | undefined => {
    const modes: PoolQuery['modes'] = role === 'proof' ? ['independent', 'challenge'] : ['challenge', 'learning'];
    let c = pickAuthored(save, w, role, ctx, target);
    if (!c && w.skillIds.length > 1) c = pickFresh(save, query(modes, target, true, true));
    if (!c) c = pickFresh(save, query(modes, target, false, true));
    if (!c) c = pickFresh(save, query(['learning', 'challenge', 'independent'], target, false, false));
    // The weakness names a skill the player may not have been taught yet (a boss can test something new): train with the
    // other skills the failed problem used, which they HAVE been taught, so a plan always has real practice and a proof.
    if (!c && exposed) for (const notLesson of [true, false]) c ??= pickFresh(save, { ...query(modes, target, false, notLesson), skillIds: exposed.skillIds });
    return take(c);
  };
  for (const kind of kinds) {
    if (kind === 'prereq') { for (const p of prereq) steps.push(mk('review', p)); continue; }
    if (kind === 'review') { steps.push(mk('review', w.skillIds[0]!)); continue; }
    if (kind === 'example') { if (mod?.example) steps.push(mk('example', w.skillIds[0]!)); continue; }
    if (kind === 'predict') { if (mod?.predict) steps.push(mk('predict', w.skillIds[0]!)); continue; }
    const c = problem(kind === 'independent' ? 'proof' : 'practice', kind === 'independent' ? base : Math.max(1, base - 1));
    // A thin pool must not strand the player: the proof may fall back to a problem used earlier in training (never the exposing one while any other exists).
    let chosen = c;
    if (!chosen && kind === 'independent') chosen = pickFresh(save, { ...query(['learning', 'challenge', 'independent'], base, false, false), excludeIds: new Set([w.exposedBy.challengeId]) }) ?? pickFresh(save, { ...query(['learning', 'challenge', 'independent'], base, false, false), excludeIds: new Set() });
    if (chosen) steps.push(mk(kind, w.skillIds[0]!, chosen));
  }
  return steps;
}

export function compositeTitle(w: Weakness): string | undefined { return w.compositeId ? getComposite(w.compositeId)?.title : undefined; }
export { diagnosticsOf, lessonOfChallenge };
