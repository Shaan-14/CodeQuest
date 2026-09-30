/**
 * DIAGNOSIS. Turns one graded submission plus the player's history into "what should be trained, and how much".
 * Pure and deterministic; every conclusion carries plain-language reasons, and no number is ever shown as a score.
 *
 * The rules (documented in ARCHITECTURE.md, "Adaptive training"):
 *  - A failure is NOT "the concept is forgotten". We look at how much passed, which checks failed (mapped to skills
 *    through the challenge's diagnostics), how many times the objective has failed, hints used, and what the player
 *    has already demonstrated independently on those skills.
 *  - We record the SMALLEST meaningful weakness: the skill (or combination) the failed checks point at.
 *  - Severity scales with evidence, never with a fixed "3 strikes" rule, and there is no failure limit.
 */
import { skillsForFailures, mistakesFor, diagnosticsOf } from '../content/diagnostics';
import { getComposite } from '../content/composites';
import { getSkill } from '../content';
import type { Challenge } from '../content/schema';
import type { PlanLevel, SaveData, Severity, WeaknessKind } from '../core/save';
import { summarizeSkill, type EvidenceRecord } from '../learning/mastery';
import { failuresSinceLastPass, independentPassesOn, isIndependentPass, hintCategory } from './evidence';

export type Strength = 'strong' | 'some' | 'none';

export interface Diagnosis {
  trigger: 'failure' | 'hinted-pass';
  severity: Severity;
  level: PlanLevel;
  kind: WeaknessKind;
  skillIds: string[];
  compositeId?: string;
  /** Merge key: a skill id, or the composite / sorted `a+b` key. */
  key: string;
  reasons: string[];
  mistakes: string[];
  /** Strong history and a single small slip: a nudge, not a detour. */
  oneOff: boolean;
  strength: Strength;
  previousIndependent: number;
  failures: number;
  hintsUsed: number;
  /** Kind, player-facing summary (never "you forgot"). */
  summary: string;
}

export const LEVEL_OF: Record<Severity, PlanLevel> = { minor: 'refresher', moderate: 'targeted', serious: 'extended', major: 'deep' };
export const SEVERITY_ORDER: Severity[] = ['minor', 'moderate', 'serious', 'major'];
export const maxSeverity = (a: Severity, b: Severity): Severity => (SEVERITY_ORDER.indexOf(a) >= SEVERITY_ORDER.indexOf(b) ? a : b);

/** How much of the skills' history is independent success, from records BEFORE the latest one. */
export function strengthOn(records: EvidenceRecord[], skillIds: string[], beforeIndex: number): { strength: Strength; count: number; contexts: string[] } {
  const prior = records.slice(0, beforeIndex);
  const independent = prior.filter((r) => isIndependentPass(r) && skillIds.some((k) => r.skillIds.includes(k)));
  const contexts = [...new Set(independent.map((r) => r.context).filter(Boolean))];
  let demonstrated = false;
  for (const id of skillIds) {
    const sk = getSkill(id);
    if (sk && summarizeSkill(prior, sk).status === 'demonstrated') demonstrated = true;
  }
  const strength: Strength = demonstrated || independent.length >= 4 ? 'strong' : independent.length >= 1 ? 'some' : 'none';
  return { strength, count: independent.length, contexts };
}

/** Distinct objectives failing recently on any of these skills (breadth: is it one problem or a pattern?). */
function recentFailedObjectives(records: EvidenceRecord[], skillIds: string[], window = 12): number {
  const recent = records.slice(-window);
  const failed = new Set<string>();
  for (const r of recent) if (!r.passed && skillIds.some((k) => r.skillIds.includes(k))) failed.add(r.objectiveId);
  return failed.size;
}

const skillTitle = (id: string) => getSkill(id)?.title ?? id;
const list = (ids: string[]) => ids.map(skillTitle).join(' and ');

export function severityFor(x: { failures: number; hints: number; ratio: number; hiddenOnly: boolean; errorKind: string; strength: Strength; breadth: number; passed: boolean }): Severity {
  const { failures, hints, ratio, errorKind, strength, breadth, passed } = x;
  if (passed) return hints >= 3 ? 'serious' : hints === 2 ? 'moderate' : 'minor';
  if (failures >= 5 || (failures >= 3 && ratio === 0 && strength === 'none') || breadth >= 4) return 'major';
  if (failures >= 3 || hints >= 2 || (failures >= 2 && ratio < 0.5) || (errorKind === 'timeout' && failures >= 2) || breadth >= 3) return 'serious';
  if (failures === 2 || hints >= 1 || (ratio < 0.5 && !(strength === 'strong' && failures === 1 && ratio > 0))) return 'moderate';
  return 'minor';
}

/**
 * Diagnose the LATEST evidence record (it must already be appended to `save.evidence`). Returns null when the
 * attempt is not worth a detour (a clean pass, or a first ordinary slip while still learning something new).
 */
export function diagnose(save: SaveData, challenge: Challenge): Diagnosis | null {
  const idx = save.evidence.length - 1;
  const rec = save.evidence[idx];
  if (!rec || rec.challengeId !== challenge.id || !rec.executed) return null;
  const passed = rec.passed;
  const hints = rec.hintsUsed;
  if (passed && hints === 0) return null;

  const detail = rec.failure;
  const total = Math.max(1, detail?.totalChecks ?? 1);
  const failedCount = (detail?.visibleFailed ?? 0) + (detail?.hiddenFailed ?? 0);
  const ratio = detail && detail.totalChecks > 0 ? (total - failedCount) / total : 0;
  const hiddenOnly = !!detail && failedCount > 0 && detail.visibleFailed === 0;
  const errorKind = detail?.errorKind ?? 'wrong-output';
  const failures = passed ? 0 : failuresSinceLastPass(save, rec.objectiveId);

  // Which skills? The failed checks point at them; a pass with hints points at the challenge's primary skills.
  const failedNames = detail?.failedChecks ?? [];
  const attributed = passed ? diagnosticsOf(challenge).primary : skillsForFailures(challenge, failedNames, (detail?.constraintsFailed ?? 0) > 0);
  const d = diagnosticsOf(challenge);
  const allSkills = [...new Set([...d.primary, ...d.supporting])];
  const { strength, count: previousIndependent, contexts: knownContexts } = strengthOn(save.evidence, attributed, idx);
  const breadth = recentFailedObjectives(save.evidence.slice(0, idx + 1), attributed);

  // A failure while first learning something (no history, first slip, most checks pass or partial) is ordinary practice.
  const worth = passed || failures >= 2 || hints >= 1 || strength !== 'none' || ratio < 0.34 || challenge.mode === 'independent';
  if (!worth) return null;

  let severity = severityFor({ failures, hints, ratio, hiddenOnly, errorKind, strength, breadth, passed });
  const oneOff = !passed && failures === 1 && hints === 0 && ratio >= 0.5 && strength === 'strong';

  // Combination: several skills involved, each already shown on its own, and the failure is not pinned on one of them.
  let kind: WeaknessKind;
  let skillIds = [...attributed];
  let compositeId: string | undefined;
  const known = allSkills.filter((k) => independentPassesOn(save.evidence.slice(0, idx), [k]) > 0 && soloEvidence(save.evidence.slice(0, idx), k, allSkills));
  const combo = !passed && known.length >= 2 && allSkills.length >= 2 && !(attributed.length === 1 && d.checkSkills && Object.keys(d.checkSkills).length > 0);
  if (passed) kind = 'hint-reliance';
  else if (combo) {
    kind = 'combination';
    skillIds = known;
    compositeId = d.composites.find((k) => k.skillIds.every((s) => known.includes(s)))?.id;
  } else if (strength !== 'none' && rec.context && !knownContexts.includes(rec.context)) kind = 'application';
  else kind = 'concept';
  // Knowing the parts but not the whole is a real gap: never smaller than a targeted plan.
  if (kind === 'combination') severity = maxSeverity(severity, 'moderate');
  if (kind === 'combination' && !compositeId && d.composites[0]) compositeId = d.composites[0].id;
  const key = compositeId ? getComposite(compositeId)!.skillIds.slice().sort().join('+') : skillIds.slice().sort().join('+');
  if (compositeId) skillIds = getComposite(compositeId)!.skillIds;

  const mistakes = [...new Set([...mistakesFor(challenge, failedNames), ...(detail && errorKind !== 'wrong-output' && errorKind !== 'none' ? [errorKind] : [])])];

  const reasons: string[] = [];
  if (!passed) {
    if (failures > 1) reasons.push(`${failures} failed attempts on this idea so far`);
    if (detail && detail.totalChecks > 0) {
      if (ratio >= 0.5 && ratio < 1) reasons.push(`${total - failedCount} of ${total} checks passed: the core works, part of it does not`);
      else if (ratio < 0.5) reasons.push(`${total - failedCount} of ${total} checks passed: the approach needs another look`);
      if (hiddenOnly) reasons.push('only hidden cases failed: edge cases the example does not show');
    }
    if (errorKind === 'syntax') reasons.push('the code did not run because of a syntax slip');
    if (errorKind === 'timeout') reasons.push('the program never finished (a loop that does not end)');
    if (errorKind === 'runtime') reasons.push('the program crashed while running');
  }
  if (hints > 0) reasons.push(`you used ${hints} hint${hints > 1 ? 's' : ''} (${rec.hintLevels?.map(hintCategory).join(', ') ?? ''})`.replace(' ()', ''));
  if (strength === 'strong' || strength === 'some') reasons.push(`you have solved ${previousIndependent} earlier problem${previousIndependent === 1 ? '' : 's'} on ${list(attributed)} on your own: that stays on your record`);
  if (breadth >= 3) reasons.push('several different problems on these skills have gone wrong recently');

  const summary = passed
    ? `You solved it with help. A short fresh problem will show you can do ${list(attributed)} on your own.`
    : kind === 'combination'
      ? `You know ${list(allSkills)} separately; putting them together is what to work on.`
      : kind === 'application'
        ? `You have done ${list(attributed)} before. Applying it in this new setting is what to practise.`
        : oneOff
          ? `Almost there. A small refresher on ${list(attributed)} should settle it.`
          : `You found something to work on: ${list(attributed)}.`;

  // A pass that needed hints is a gentle, targeted reinforcement (short review, fresh problem, independent attempt).
  const level: PlanLevel = passed ? (severity === 'minor' || severity === 'moderate' ? 'targeted' : 'extended') : LEVEL_OF[severity];
  return {
    trigger: passed ? 'hinted-pass' : 'failure', severity, level, kind, skillIds, compositeId, key, reasons, mistakes, oneOff, strength,
    previousIndependent, failures, hintsUsed: hints, summary,
  };
}

/** Has the player solved a problem involving `skill` that did NOT need the other skills? (i.e. know it on its own). */
function soloEvidence(records: EvidenceRecord[], skill: string, all: string[]): boolean {
  const others = all.filter((k) => k !== skill);
  return records.some((r) => isIndependentPass(r) && r.skillIds.includes(skill) && !others.every((o) => r.skillIds.includes(o)));
}

/** Fallback for a failed boss attempt that produced no ordinary diagnosis (e.g. nothing ran): still worth a look, never a big one. */
export function diagnoseBossFailure(save: SaveData, challenge: Challenge): Diagnosis {
  const skillIds = diagnosticsOf(challenge).primary;
  const idx = save.evidence.length - 1;
  const { strength, count } = strengthOn(save.evidence, skillIds, idx);
  return {
    trigger: 'failure', severity: 'moderate', level: LEVEL_OF.moderate, kind: 'concept', skillIds, key: skillIds.slice().sort().join('+'),
    reasons: ['the boss attempt did not pass, so the skills it tests need another look'], mistakes: [], oneOff: false, strength,
    previousIndependent: count, failures: 1, hintsUsed: 0, summary: `The boss showed something to work on: ${list(skillIds)}.`,
  };
}
