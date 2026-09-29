import { getChallenge } from '../content';
import { objectiveOf } from '../content/helpers';
import type { SaveData } from '../core/save';

/**
 * Older saves' evidence lacks fields that depend on content (real-world context, objective).
 * Idempotent: fills only what is missing, using the CURRENT content, and never removes records.
 * Called by the store after load/import (save.ts migrations stay content-free).
 */
export function backfillEvidence(save: SaveData): SaveData {
  let changed = false;
  const evidence = save.evidence.map((r) => {
    const c = getChallenge(r.challengeId);
    if (!c) return r;
    const objectiveId = r.objectiveId && r.objectiveId !== r.challengeId ? r.objectiveId : objectiveOf(c);
    const context = r.context || c.context || '';
    const project = r.project || !!c.project;
    if (objectiveId === r.objectiveId && context === r.context && project === r.project) return r;
    changed = true;
    return { ...r, objectiveId, context, project };
  });
  return changed ? { ...save, evidence } : save;
}
