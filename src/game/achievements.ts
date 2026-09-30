/** Achievement conditions. Achievements are milestones for the player's enjoyment, NOT proof of skill. */
import type { SaveData } from '../core/save';
import { levelFromXp } from './progression';

const conditions: Record<string, (s: SaveData) => boolean> = {
  'first-run': (s) => !!s.flags['ran-code'],
  'first-pass': (s) => s.evidence.some((r) => r.passed),
  'bug-squasher': (s) => s.evidence.some((r) => r.passed && r.skillIds.includes('py.debugging')),
  persistent: (s) => Object.values(s.learning.challenges).some((c) => c.passed && c.attempts >= 5),
  'own-two-feet': (s) => s.evidence.some((r) => r.passed && (r.support === 'independent' || r.support === 'transfer')),
  'hat-trick': (s) => {
    const last = s.evidence.slice(-3);
    return last.length === 3 && last.every((r) => r.passed && r.hintsUsed === 0);
  },
  'level-5': (s) => levelFromXp(s.stats.xp) >= 5,
  shopper: (s) => !!s.flags['bought-item'],
  'robot-awake': (s) => s.quests['wake-the-robot']?.status === 'complete',
  'first-query': (s) => s.evidence.some((r) => r.passed && r.challengeId.startsWith('sql-')),
  'retry-wisdom': (s) => {
    const failedObjectives = new Set(s.evidence.filter((r) => !r.passed).map((r) => r.objectiveId));
    return s.evidence.some((r) => r.passed && failedObjectives.has(r.objectiveId) && s.evidence.some((f) => !f.passed && f.objectiveId === r.objectiveId && f.challengeId !== r.challengeId));
  },
  researcher: (s) => s.evidence.some((r) => (r.lookups ?? 0) > 0) || Object.values(s.learning.challenges).some((c) => (c.lookups ?? 0) > 0),
  'vault-open': (s) => s.quests['ledger-vault']?.status === 'complete',
  'district-cleared': (s) => s.quests['database-district']?.status === 'complete',
  'pipeline-running': (s) => s.quests['pipeline-works']?.status === 'complete',
  'blank-page': (s) => !!s.learning.challenges['py-14-warehouse-audit']?.passed,
};

/** Achievement ids whose condition is now true but which are not yet recorded. */
export function newlyEarned(save: SaveData): string[] {
  return Object.keys(conditions).filter((id) => !save.achievements[id] && conditions[id]!(save));
}
