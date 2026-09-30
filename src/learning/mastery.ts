/**
 * Mastery = demonstrated, independent, executed performance ACROSS VARIED PROBLEMS.
 * Nothing here reads XP or level.
 *
 * There is deliberately NO numeric "mastery score". `summarizeSkill` returns raw counts plus a
 * categorical status that follows explicit, documented requirements (Skill.masteryRequirements).
 * `detectPatterns` surfaces signals (repeated failure, hint reliance, ...) that the recommendation
 * engine (game/selection.ts) uses to suggest practice; the player sees the reasons.
 *
 * Phase 2 strengthened the model: independent passes only count towards "demonstrated" if they span
 * different challenges, different learning objectives (not just variants of one problem) and different
 * real-world contexts. Retries are preserved: every failed attempt stays in the log, and evidence
 * records how many failures preceded a success.
 */
import type { LearningMode, Skill } from '../content/schema';

/** How much help the player had. Higher independence = stronger evidence. */
export type SupportLevel =
  | 'guided' // learning mode: scaffolding, steps, expected behaviour shown
  | 'hinted' // challenge/independent mode but hints were revealed
  | 'independent' // challenge/independent mode, no hints
  | 'transfer'; // independent, in an unfamiliar context

/** One graded submission (pass or fail) of real, executed code. */
export interface EvidenceRecord {
  /** ISO timestamp. */
  at: string;
  challengeId: string;
  /** The learning objective (variants share it). Older saves: the challenge id. */
  objectiveId: string;
  /** Real-world context of the problem (e.g. 'finance'). Backfilled from content for older saves. */
  context: string;
  skillIds: string[];
  concepts: string[];
  mode: LearningMode;
  difficulty: number;
  passed: boolean;
  support: SupportLevel;
  hintsUsed: number;
  /** Reference-manual entries opened while working on this challenge (research behaviour). */
  lookups: number;
  /** 1 = first graded submission of this challenge. */
  attemptNumber: number;
  /** Failed submissions on this OBJECTIVE (any variant) before this one. >0 on a pass = recovered after failing. */
  priorFailures: number;
  /** True for multi-concept projects. */
  project: boolean;
  /** Active time spent on this challenge before this submission (ms). */
  timeMs: number;
  /** True if the result came from actually executing the player's code against checks. */
  executed: boolean;
  /** Phase 4: what went wrong on a failed submission (which checks, what kind of error). Absent on passes and old saves. */
  failure?: FailureDetail;
  /** Phase 4: indexes of the hints revealed (0 = conceptual, 1 = specific, 2 = strong), so the hint's KIND is on record. */
  hintLevels?: number[];
  /** Phase 4: where the attempt happened. Absent on old saves (= 'lesson'). */
  source?: EvidenceSource;
  /** Phase 4: set when the attempt was a step of a training plan. */
  training?: { planId: string; stepId: string; kind: string };
  /** Phase 4: set for boss attempts. */
  boss?: { bossId: string; version: string };
}

export type EvidenceSource = 'lesson' | 'practice' | 'daily' | 'training' | 'boss';

/** Why a submission failed, in categories the diagnosis engine can reason about. Never contains code or answers. */
export interface FailureDetail {
  errorKind: 'none' | 'syntax' | 'runtime' | 'timeout' | 'wrong-output' | 'constraint' | 'cannot-run';
  /** Names of failed checks (hidden checks are named generically by the grader UI, but the name is kept here for diagnosis only). */
  failedChecks: string[];
  visibleFailed: number;
  hiddenFailed: number;
  totalChecks: number;
  constraintsFailed: number;
}

export function supportFor(mode: LearningMode, hintsUsed: number, transfer = false): SupportLevel {
  if (mode === 'learning') return 'guided';
  if (hintsUsed > 0) return 'hinted';
  return transfer ? 'transfer' : 'independent';
}

export type SkillStatus =
  | 'none' // no evidence yet
  | 'attempted' // tried, nothing passed yet
  | 'guided' // has passes, but only with guidance/hints
  | 'developing' // some independent passes, requirements not yet met
  | 'demonstrated'; // requirements met by independent, executed passes

export interface SkillEvidenceSummary {
  skillId: string;
  attempts: number;
  passes: number;
  failures: number;
  hintsUsed: number;
  guidedPasses: number;
  independentPasses: number;
  distinctIndependentChallenges: number;
  distinctIndependentObjectives: number;
  distinctIndependentContexts: number;
  maxIndependentDifficulty: number;
  transferPasses: number;
  projectPasses: number;
  /** Independent passes that came after at least one failed attempt on the same objective (resilience). */
  recoveredPasses: number;
  status: SkillStatus;
}

const isIndependent = (r: EvidenceRecord) => r.passed && r.executed && (r.support === 'independent' || r.support === 'transfer');

export function summarizeSkill(records: EvidenceRecord[], skill: Skill): SkillEvidenceSummary {
  const mine = records.filter((r) => r.executed && r.skillIds.includes(skill.id));
  const passes = mine.filter((r) => r.passed);
  const indep = mine.filter(isIndependent);
  const req = skill.masteryRequirements;
  const distinct = new Set(indep.map((r) => r.challengeId));
  const objectives = new Set(indep.map((r) => r.objectiveId ?? r.challengeId));
  const contexts = new Set(indep.map((r) => r.context).filter(Boolean));
  const maxDiff = indep.reduce((m, r) => Math.max(m, r.difficulty), 0);

  let status: SkillStatus;
  if (mine.length === 0) status = 'none';
  else if (passes.length === 0) status = 'attempted';
  else if (indep.length === 0) status = 'guided';
  else if (
    indep.length >= req.independentPasses &&
    distinct.size >= req.distinctChallenges &&
    objectives.size >= (req.distinctObjectives ?? 1) &&
    contexts.size >= (req.distinctContexts ?? 1) &&
    maxDiff >= req.minDifficulty
  ) {
    status = 'demonstrated';
  } else status = 'developing';

  return {
    skillId: skill.id,
    attempts: mine.length,
    passes: passes.length,
    failures: mine.length - passes.length,
    hintsUsed: mine.reduce((n, r) => n + r.hintsUsed, 0),
    guidedPasses: passes.filter((r) => r.support === 'guided' || r.support === 'hinted').length,
    independentPasses: indep.length,
    distinctIndependentChallenges: distinct.size,
    distinctIndependentObjectives: objectives.size,
    distinctIndependentContexts: contexts.size,
    maxIndependentDifficulty: maxDiff,
    transferPasses: mine.filter((r) => r.passed && r.support === 'transfer').length,
    projectPasses: passes.filter((r) => r.project).length,
    recoveredPasses: indep.filter((r) => (r.priorFailures ?? 0) > 0).length,
    status,
  };
}

/** Which requirement is still unmet? Used to tell the player exactly what "demonstrated" is missing. */
export function unmetRequirements(sum: SkillEvidenceSummary, skill: Skill): string[] {
  const r = skill.masteryRequirements;
  const out: string[] = [];
  if (sum.independentPasses < r.independentPasses) out.push(`${r.independentPasses - sum.independentPasses} more independent solve(s)`);
  if (sum.distinctIndependentChallenges < r.distinctChallenges) out.push(`solves on ${r.distinctChallenges} different challenges`);
  if (sum.distinctIndependentObjectives < (r.distinctObjectives ?? 1)) out.push(`solves across ${r.distinctObjectives} different concepts`);
  if (sum.distinctIndependentContexts < (r.distinctContexts ?? 1)) out.push(`solves in ${r.distinctContexts} different real-world contexts`);
  if (sum.maxIndependentDifficulty < r.minDifficulty) out.push(`one independent solve at difficulty ${r.minDifficulty}+`);
  return out;
}

export type PatternKind = 'repeated-failure' | 'hint-reliant' | 'guided-only' | 'solving-easily' | 'independent-success';

export interface Pattern {
  kind: PatternKind;
  skillId: string;
  /** Plain-language explanation for the player. */
  detail: string;
}

/** Thresholds are intentionally simple and visible; they are signals, not verdicts. */
export function detectPatterns(records: EvidenceRecord[], skillId: string): Pattern[] {
  const mine = records.filter((r) => r.executed && r.skillIds.includes(skillId));
  const patterns: Pattern[] = [];
  if (mine.length === 0) return patterns;
  const passes = mine.filter((r) => r.passed);

  const recent = mine.slice(-5);
  const recentFails = recent.filter((r) => !r.passed).length;
  if (recent.length >= 4 && recentFails >= 4) {
    patterns.push({ kind: 'repeated-failure', skillId, detail: 'Most of your recent attempts here did not pass. Revisit the lesson in the Library, then try a fresh problem on the same idea.' });
  }
  if (passes.length >= 3 && passes.filter((r) => r.hintsUsed > 0).length / passes.length >= 0.6) {
    patterns.push({ kind: 'hint-reliant', skillId, detail: 'Most of your solves used hints. Try attempting one more time before opening a hint.' });
  }
  if (passes.length >= 3 && !passes.some(isIndependent)) {
    patterns.push({ kind: 'guided-only', skillId, detail: 'You have only succeeded with guidance so far. An independent solve is what counts as evidence.' });
  }
  const lastFour = passes.slice(-4);
  if (lastFour.length === 4 && lastFour.every((r) => r.attemptNumber === 1 && r.hintsUsed === 0 && (r.priorFailures ?? 0) === 0)) {
    patterns.push({ kind: 'solving-easily', skillId, detail: 'You are passing on the first try without hints. Harder challenges suit you.' });
  }
  if (passes.filter(isIndependent).length >= 2) {
    patterns.push({ kind: 'independent-success', skillId, detail: 'You have solved problems here without any help.' });
  }
  return patterns;
}
