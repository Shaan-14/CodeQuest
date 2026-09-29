/**
 * Mastery = demonstrated, independent, executed performance. Nothing here reads XP or level.
 *
 * There is deliberately NO numeric "mastery score". `summarizeSkill` returns raw counts plus a
 * categorical status that follows explicit, documented requirements (Skill.masteryRequirements).
 * `detectPatterns` surfaces signals (repeated failure, hint reliance, ...) that a future adaptive
 * system can act on; in Phase 1 they are only shown to the player as "mentor's notes".
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
  skillIds: string[];
  concepts: string[];
  mode: LearningMode;
  difficulty: number;
  passed: boolean;
  support: SupportLevel;
  hintsUsed: number;
  /** 1 = first graded submission of this challenge. */
  attemptNumber: number;
  /** Active time spent on this challenge before this submission (ms). */
  timeMs: number;
  /** True if the result came from actually executing the player's code against checks. */
  executed: boolean;
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
  maxIndependentDifficulty: number;
  transferPasses: number;
  status: SkillStatus;
}

const isIndependent = (r: EvidenceRecord) => r.passed && r.executed && (r.support === 'independent' || r.support === 'transfer');

export function summarizeSkill(records: EvidenceRecord[], skill: Skill): SkillEvidenceSummary {
  const mine = records.filter((r) => r.executed && r.skillIds.includes(skill.id));
  const passes = mine.filter((r) => r.passed);
  const indep = mine.filter(isIndependent);
  const req = skill.masteryRequirements;
  const distinct = new Set(indep.map((r) => r.challengeId));
  const maxDiff = indep.reduce((m, r) => Math.max(m, r.difficulty), 0);

  let status: SkillStatus;
  if (mine.length === 0) status = 'none';
  else if (passes.length === 0) status = 'attempted';
  else if (indep.length === 0) status = 'guided';
  else if (indep.length >= req.independentPasses && distinct.size >= req.distinctChallenges && maxDiff >= req.minDifficulty) {
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
    maxIndependentDifficulty: maxDiff,
    transferPasses: mine.filter((r) => r.passed && r.support === 'transfer').length,
    status,
  };
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
    patterns.push({ kind: 'repeated-failure', skillId, detail: 'Most of your recent attempts here did not pass. Revisit the lesson in the Library, then try again.' });
  }
  if (passes.length >= 3 && passes.filter((r) => r.hintsUsed > 0).length / passes.length >= 0.6) {
    patterns.push({ kind: 'hint-reliant', skillId, detail: 'Most of your solves used hints. Try attempting one more time before opening a hint.' });
  }
  if (passes.length >= 3 && !passes.some(isIndependent)) {
    patterns.push({ kind: 'guided-only', skillId, detail: 'You have only succeeded with guidance so far. An independent solve is what counts as evidence.' });
  }
  const lastFour = passes.slice(-4);
  if (lastFour.length === 4 && lastFour.every((r) => r.attemptNumber === 1 && r.hintsUsed === 0)) {
    patterns.push({ kind: 'solving-easily', skillId, detail: 'You are passing on the first try without hints. Harder challenges suit you.' });
  }
  if (passes.filter(isIndependent).length >= 2) {
    patterns.push({ kind: 'independent-success', skillId, detail: 'You have solved problems here without any help.' });
  }
  return patterns;
}
