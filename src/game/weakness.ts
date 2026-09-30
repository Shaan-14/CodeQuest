/**
 * Weakness bookkeeping on a draft save: create / merge / resolve. Weaknesses are HISTORY: resolving one never
 * deletes it and never touches mastery evidence. Depends on nothing but the save, so actions.ts can call it.
 */
import { getAnyChallenge, lessonOfChallenge } from '../content';
import type { Challenge } from '../content/schema';
import type { SaveData, Weakness, WeaknessKind, WeaknessSource } from '../core/save';
import type { EvidenceRecord } from '../learning/mastery';
import type { GameEvent } from './events';
import { diagnose, diagnoseBossFailure, maxSeverity, LEVEL_OF, type Diagnosis } from './diagnosis';

export const nextTrainingId = (s: SaveData, prefix: string): string => `${prefix}${s.training.nextId++}`;

/** Weakness currently being tracked (open or in training) for a merge key. */
export const openWeaknessFor = (s: SaveData, key: string): Weakness | undefined => s.training.weaknesses.find((w) => w.key === key && w.status !== 'resolved');

function sourceOf(rec: EvidenceRecord): WeaknessSource {
  return rec.source === 'daily' ? 'daily' : rec.source === 'boss' ? 'boss' : rec.source === 'practice' ? 'practice' : rec.source === 'training' ? 'training' : 'lesson';
}

/** Create or merge the weakness a diagnosis describes. Returns it (also when merged), or null. */
export function upsertWeakness(s: SaveData, events: GameEvent[], d: Diagnosis, rec: EvidenceRecord, at: string): Weakness {
  const existing = openWeaknessFor(s, d.key);
  const lessonId = lessonOfChallenge(rec.challengeId)?.id;
  if (existing) {
    const before = existing.severity;
    existing.severity = maxSeverity(existing.severity, d.severity);
    existing.failures = Math.max(existing.failures, d.failures);
    existing.hintsUsed = Math.max(existing.hintsUsed, d.hintsUsed);
    for (const m of d.mistakes) if (!existing.mistakes.includes(m)) existing.mistakes.push(m);
    for (const r of d.reasons) if (!existing.reasons.includes(r)) existing.reasons.push(r);
    if (rec.context && !existing.struggledIn.includes(rec.context)) existing.struggledIn.push(rec.context);
    if (d.kind === 'combination') existing.kind = 'combination';
    if (existing.severity !== before) events.push({ type: 'weaknessDeepened', id: existing.id });
    return existing;
  }
  const w: Weakness = {
    id: nextTrainingId(s, 'w'), key: d.key, skillIds: d.skillIds, compositeId: d.compositeId, kind: d.kind, severity: d.severity, status: 'open',
    source: sourceOf(rec), exposedBy: { challengeId: rec.challengeId, objectiveId: rec.objectiveId, context: rec.context, lessonId, at },
    detectedAt: at, failures: d.failures, hintsUsed: d.hintsUsed, hintLevels: rec.hintLevels ?? [], mistakes: [...d.mistakes], reasons: [...d.reasons],
    previousIndependent: d.previousIndependent, struggledIn: rec.context ? [rec.context] : [], planIds: [],
  };
  s.training.weaknesses.push(w);
  events.push({ type: 'weaknessFound', id: w.id });
  return w;
}

/** Called by every submission path right after the evidence record is appended. */
export function applyDiagnosis(s: SaveData, events: GameEvent[], challenge: Challenge, rec: EvidenceRecord, force = false): Weakness | null {
  // A training step already lives inside a plan: it escalates that plan (training.ts), it does not spawn new weaknesses.
  if (rec.source === 'training') return null;
  // `force`: a setback that costs Focus must always leave a plan behind, even when the evidence alone would shrug at a first slip.
  const d = diagnose(s, challenge) ?? (force ? diagnoseBossFailure(s, challenge) : null);
  if (!d) return null;
  const w = upsertWeakness(s, events, d, rec, rec.at);
  // A meaningful failure in the CURRICULUM (a lesson or a boss) must be trained before the player goes on. Guided
  // (learning-mode) exercises never block: a typo in lesson 1 must not send a beginner away. Optional sources (practice, dailies) never block.
  const src = sourceOf(rec);
  if ((src === 'lesson' || src === 'boss') && challenge.mode !== 'learning') w.required = true;
  return w;
}

/**
 * An independent pass elsewhere supersedes an older weakness: if the player solves, hint-free, a DIFFERENT problem on
 * the weakness's skills (a different challenge and either objective or context), the weakness is resolved. Guided or
 * hinted passes never do. Mastery evidence is untouched either way.
 */
export function resolveOnPass(s: SaveData, events: GameEvent[], rec: EvidenceRecord): void {
  if (!rec.passed || (rec.support !== 'independent' && rec.support !== 'transfer') || rec.source === 'training') return;
  for (const w of s.training.weaknesses) {
    if (w.status !== 'open' || w.required || w.severity === 'major' || w.severity === 'serious') continue; // required and bigger weaknesses need their plan (no bypass through other problems)
    if (w.kind === 'hint-reliance' || w.kind === 'prerequisite' || w.kind === 'boss-prep' || w.kind === 'rust' || w.kind === 'review' || w.kind === 'concept' || w.kind === 'application' || w.kind === 'combination') {
      if (!w.skillIds.every((k) => rec.skillIds.includes(k))) continue;
      if (rec.challengeId === w.exposedBy.challengeId) continue;
      if (rec.objectiveId === w.exposedBy.objectiveId && rec.context === w.exposedBy.context) continue;
      if (Date.parse(rec.at) < Date.parse(w.detectedAt)) continue;
      w.status = 'resolved';
      w.resolvedAt = rec.at;
      w.resolvedBy = rec.challengeId;
      events.push({ type: 'weaknessResolved', id: w.id });
    }
  }
}

export { LEVEL_OF };
export type { WeaknessKind };
void getAnyChallenge;
