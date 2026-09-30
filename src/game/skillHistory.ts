/**
 * SKILL HISTORY: the nuanced picture. Mastery is never a checkbox that a later mistake can flip: this view keeps
 * BOTH facts, "previous independent performance" and "recent application trouble", side by side, plus training.
 * Everything is derived from the append-only evidence log and the training state.
 */
import { composites, type Composite } from '../content/composites';
import { getSkill } from '../content';
import type { Skill } from '../content/schema';
import type { SaveData, TrainingPlan, Weakness } from '../core/save';
import { summarizeSkill, type EvidenceRecord, type SkillEvidenceSummary } from '../learning/mastery';
import { isIndependentPass } from './evidence';

export type Previous = 'strong' | 'some' | 'none';

export interface SkillHistory {
  skill: Skill;
  summary: SkillEvidenceSummary;
  /** Independent performance EVER (never eroded by later failures). */
  previous: Previous;
  earlierIndependentPasses: number;
  contextsDemonstrated: string[];
  contextsStruggled: string[];
  /** The last few attempts touching the skill, newest last. */
  recent: { challengeId: string; passed: boolean; support: string; context: string; at: string }[];
  recentFailures: number;
  weaknesses: Weakness[];
  openWeaknesses: Weakness[];
  plans: TrainingPlan[];
  /** Independent passes recorded AFTER the most recent finished training on this skill. */
  independentSinceTraining: number;
  note: string;
}

export function skillHistory(save: SaveData, skillId: string): SkillHistory | undefined {
  const skill = getSkill(skillId);
  if (!skill) return undefined;
  const mine = save.evidence.filter((r) => r.executed && r.skillIds.includes(skillId));
  const independent = mine.filter(isIndependentPass);
  const summary = summarizeSkill(save.evidence, skill);
  const previous: Previous = summary.status === 'demonstrated' || independent.length >= 4 ? 'strong' : independent.length >= 1 ? 'some' : 'none';
  const weaknesses = save.training.weaknesses.filter((w) => w.skillIds.includes(skillId));
  const plans = save.training.plans.filter((p) => weaknesses.some((w) => w.id === p.weaknessId));
  const lastDone = plans.filter((p) => p.status === 'complete' && p.completedAt).map((p) => Date.parse(p.completedAt!)).sort((a, b) => b - a)[0];
  const recent = mine.slice(-5).map((r) => ({ challengeId: r.challengeId, passed: r.passed, support: r.support, context: r.context, at: r.at }));
  const open = weaknesses.filter((w) => w.status !== 'resolved');
  const struggled = [...new Set(weaknesses.flatMap((w) => w.struggledIn))];
  const demonstrated = [...new Set(independent.map((r) => r.context).filter(Boolean))];
  const sinceTraining = lastDone === undefined ? 0 : independent.filter((r) => Date.parse(r.at) > lastDone).length;
  const recentFailures = recent.filter((r) => !r.passed).length;
  const parts: string[] = [];
  if (previous === 'strong') parts.push(`Previous independent performance: strong (${independent.length} solves).`);
  else if (previous === 'some') parts.push(`Previous independent performance: some (${independent.length} solve${independent.length === 1 ? '' : 's'}).`);
  if (open.length) parts.push(`Recent application: ${open.map((w) => (w.kind === 'combination' ? `weak when combined (${w.skillIds.filter((k) => k !== skillId).map((k) => getSkill(k)?.title ?? k).join(', ')})` : w.kind === 'hint-reliance' ? 'needed hints' : w.kind === 'rust' ? 'has gone quiet' : 'trouble in a recent problem')).join('; ')}.`);
  else if (weaknesses.length) parts.push('Earlier application trouble has been addressed by training; your previous performance stands.');
  return { skill, summary, previous, earlierIndependentPasses: independent.length, contextsDemonstrated: demonstrated, contextsStruggled: struggled, recent, recentFailures, weaknesses, openWeaknesses: open, plans, independentSinceTraining: sinceTraining, note: parts.join(' ') };
}

/** Composite competency status, derived from evidence on challenges that exercised ALL of its skills. */
export interface CompositeSummary {
  composite: Composite;
  attempts: number;
  passes: number;
  independentPasses: number;
  contexts: number;
  status: 'none' | 'attempted' | 'guided' | 'developing' | 'demonstrated';
}

export function summarizeComposite(records: EvidenceRecord[], c: Composite): CompositeSummary {
  const mine = records.filter((r) => r.executed && c.skillIds.every((k) => r.skillIds.includes(k)));
  const passes = mine.filter((r) => r.passed);
  const indep = mine.filter(isIndependentPass);
  const contexts = new Set(indep.map((r) => r.context).filter(Boolean)).size;
  const status = mine.length === 0 ? 'none' : passes.length === 0 ? 'attempted' : indep.length === 0 ? 'guided' : indep.length >= 2 && contexts >= 2 ? 'demonstrated' : 'developing';
  return { composite: c, attempts: mine.length, passes: passes.length, independentPasses: indep.length, contexts, status };
}

export const allComposites = (save: SaveData): CompositeSummary[] => composites.map((c) => summarizeComposite(save.evidence, c)).filter((x) => x.attempts > 0);
