/**
 * TRAINING PLAN BUILDER. Picks FRESH problems for a weakness and arranges them by how serious it is.
 * Deterministic (no randomness). Training never uses the challenge that exposed the weakness, prefers a different
 * context each time, and only draws on content the player has already been taught.
 *
 *   refresher : review -> independent                      (a small slip: one fresh problem)
 *   targeted  : review -> practice -> independent          (a hint was needed: short review, fresh problem, do it alone)
 *   extended  : review -> example -> guided -> practice -> [combined] -> independent
 *   deep      : prerequisites' reviews -> review -> example -> guided x2 -> practice x2 -> [combined] -> independent x2
 */
import { challenges, getAnyChallenge, getSkill, dailyChallenges, lessonOfChallenge } from '../content';
import { objectiveOf } from '../content/helpers';
import { diagnosticsOf } from '../content/diagnostics';
import { getComposite } from '../content/composites';
import type { Challenge } from '../content/schema';
import type { PlanLevel, SaveData, TrainingStep, TrainingStepKind, Weakness } from '../core/save';
import { availableObjectives } from './selection';

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

/** Steps for each level. `kinds` are turned into concrete fresh problems where possible. */
export function shapeFor(level: PlanLevel, combined: boolean): { kind: TrainingStepKind; skill: 'weak' | 'prereq' }[] {
  switch (level) {
    case 'refresher': return [{ kind: 'review', skill: 'weak' }, { kind: 'independent', skill: 'weak' }];
    case 'targeted': return [{ kind: 'review', skill: 'weak' }, { kind: 'practice', skill: 'weak' }, { kind: 'independent', skill: 'weak' }];
    case 'extended': return [{ kind: 'review', skill: 'weak' }, { kind: 'example', skill: 'weak' }, { kind: 'guided', skill: 'weak' }, { kind: 'practice', skill: 'weak' }, ...(combined ? [{ kind: 'combined' as const, skill: 'weak' as const }] : []), { kind: 'independent', skill: 'weak' }];
    case 'deep': return [{ kind: 'review', skill: 'prereq' }, { kind: 'review', skill: 'weak' }, { kind: 'example', skill: 'weak' }, { kind: 'guided', skill: 'weak' }, { kind: 'guided', skill: 'weak' }, { kind: 'practice', skill: 'weak' }, { kind: 'practice', skill: 'weak' }, ...(combined ? [{ kind: 'combined' as const, skill: 'weak' as const }] : []), { kind: 'independent', skill: 'weak' }, { kind: 'independent', skill: 'weak' }];
  }
}

export function buildSteps(save: SaveData, w: Weakness, level: PlanLevel, ctx: BuildContext = freshContext(save, w)): TrainingStep[] {
  const exposed = getAnyChallenge(w.exposedBy.challengeId);
  const base = exposed?.difficulty ?? 3;
  const combined = w.kind === 'combination' || (w.skillIds.length > 1 && !!w.compositeId);
  const prereq = shakyPrerequisites(save, w.skillIds);
  const steps: TrainingStep[] = [];
  const mk = (kind: TrainingStepKind, skillId: string, challenge?: Challenge): TrainingStep => ({ id: uid(save), kind, skillId, challengeId: challenge?.id, done: false, attempts: 0 });
  const take = (c: Challenge | undefined) => {
    if (c) { ctx.used.add(c.id); ctx.usedObjectives.add(objectiveOf(c)); if (c.context) ctx.contexts.add(c.context); }
    return c;
  };
  const query = (skills: string[], modes: PoolQuery['modes'], target: number, allOf = false): PoolQuery => ({ skillIds: skills, allOf, excludeIds: ctx.used, excludeObjectives: ctx.usedObjectives, exposedObjective: w.exposedBy.objectiveId, avoidContexts: ctx.contexts, modes, targetDifficulty: target });
  const primary = w.skillIds[0]!;
  let independentSeen = 0;
  for (const shape of shapeFor(level, combined)) {
    if (shape.kind === 'review') {
      if (shape.skill === 'prereq') { for (const p of prereq) steps.push(mk('review', p)); }
      else for (const id of w.skillIds.slice(0, 2)) steps.push(mk('review', id));
      continue;
    }
    if (shape.kind === 'example') { steps.push(mk('example', primary)); continue; }
    if (shape.kind === 'combined') {
      const c = take(pickFresh(save, query(w.skillIds, ['challenge', 'independent'], base, true)));
      if (c) steps.push(mk('combined', primary, c));
      continue;
    }
    const modes: PoolQuery['modes'] = shape.kind === 'guided' ? ['learning', 'challenge'] : shape.kind === 'practice' ? ['challenge', 'learning'] : ['independent', 'challenge'];
    const target = shape.kind === 'guided' ? Math.max(1, base - 1) : shape.kind === 'independent' ? base + (independentSeen++ > 0 ? 0 : 0) : base;
    let c = take(pickFresh(save, query(w.skillIds, modes, target, false)));
    if (!c) c = take(pickFresh(save, query(w.skillIds, ['learning', 'challenge', 'independent'], target)));
    // A thin pool (early lessons) must not strand the player: an independent demonstration may fall back to a problem used
    // earlier in training (never the exposing one while any other exists), because the plan has to be able to finish.
    if (!c && shape.kind === 'independent') {
      c = pickFresh(save, { ...query(w.skillIds, ['learning', 'challenge', 'independent'], target), excludeIds: new Set([w.exposedBy.challengeId]) });
      if (!c) c = pickFresh(save, { ...query(w.skillIds, ['learning', 'challenge', 'independent'], target), excludeIds: new Set() });
    }
    if (c) steps.push(mk(shape.kind, primary, c));
  }
  // A plan must end with an independent demonstration; if the pool was too thin, borrow the last practice as it.
  if (!steps.some((x) => x.kind === 'independent' && x.challengeId)) {
    const last = [...steps].reverse().find((x) => x.challengeId && x.kind !== 'review');
    if (last) last.kind = 'independent';
  }
  return steps;
}

export function compositeTitle(w: Weakness): string | undefined { return w.compositeId ? getComposite(w.compositeId)?.title : undefined; }
export { diagnosticsOf, lessonOfChallenge };
