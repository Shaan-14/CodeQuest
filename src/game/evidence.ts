/**
 * Building evidence records (shared by lessons, practice, dailies, training and bosses) and reading history.
 * Evidence is APPEND-ONLY: nothing here ever deletes or edits an earlier record, which is what lets later
 * struggles coexist with earlier mastery.
 */
import type { Challenge } from '../content/schema';
import { objectiveOf } from '../content/helpers';
import type { SaveData } from '../core/save';
import { supportFor, type EvidenceRecord, type EvidenceSource, type FailureDetail } from '../learning/mastery';

/** Failed submissions on an objective (any variant) since its most recent pass. Retries never erase history. */
export function failuresSinceLastPass(s: SaveData, objectiveId: string): number {
  let n = 0;
  for (let i = s.evidence.length - 1; i >= 0; i--) {
    const r = s.evidence[i]!;
    if (r.objectiveId !== objectiveId) continue;
    if (r.passed) break;
    n++;
  }
  return n;
}

export interface EvidenceContext {
  passed: boolean;
  at: string;
  timeMs: number;
  hintsUsed: number;
  lookups: number;
  attemptNumber: number;
  source?: EvidenceSource;
  detail?: FailureDetail;
  training?: EvidenceRecord['training'];
  boss?: EvidenceRecord['boss'];
  /** Daily and boss attempts are always graded as independent work. */
  forceIndependent?: boolean;
}

export const hintLevelsOf = (hintsUsed: number): number[] => Array.from({ length: Math.max(0, hintsUsed) }, (_, i) => i);
/** Hints go conceptual -> specific -> strong. */
export const hintCategory = (index: number): 'conceptual' | 'specific' | 'strong' => (index <= 0 ? 'conceptual' : index === 1 ? 'specific' : 'strong');

export function buildEvidence(s: SaveData, c: Challenge, x: EvidenceContext): EvidenceRecord {
  const objectiveId = objectiveOf(c);
  const rec: EvidenceRecord = {
    at: x.at,
    challengeId: c.id,
    objectiveId,
    context: c.context ?? '',
    lookups: x.lookups,
    priorFailures: failuresSinceLastPass(s, objectiveId),
    project: !!c.project,
    skillIds: c.skillIds,
    concepts: c.concepts,
    mode: x.forceIndependent ? 'independent' : c.mode,
    difficulty: c.difficulty,
    passed: x.passed,
    support: supportFor(x.forceIndependent ? 'independent' : c.mode, x.hintsUsed, c.transfer),
    hintsUsed: x.hintsUsed,
    attemptNumber: x.attemptNumber,
    timeMs: x.timeMs,
    executed: true,
    source: x.source ?? 'lesson',
  };
  if (!x.passed && x.detail) rec.failure = x.detail;
  if (x.hintsUsed > 0) rec.hintLevels = hintLevelsOf(x.hintsUsed);
  if (x.training) rec.training = x.training;
  if (x.boss) rec.boss = x.boss;
  return rec;
}

const isIndependentPass = (r: EvidenceRecord) => r.passed && r.executed && (r.support === 'independent' || r.support === 'transfer');

/** Independent passes on ALL of the given skills' challenges (any one of them), counting only records before `before` (exclusive index). */
export function independentPassesOn(records: EvidenceRecord[], skillIds: string[], before = records.length): number {
  return records.slice(0, before).filter((r) => isIndependentPass(r) && skillIds.some((k) => r.skillIds.includes(k))).length;
}
export { isIndependentPass };
