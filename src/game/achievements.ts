/** Achievement conditions. Achievements are milestones for the player's enjoyment, NOT proof of skill. */
import type { SaveData } from '../core/save';
import { levelFromXp } from './progression';

const passedDailies = (s: SaveData) => s.daily.history.filter((h) => h.outcome === 'passed');
const dailyMilestone = (n: number) => (s: SaveData) => passedDailies(s).length >= n;

/** Seven solved dailies inside any seven-day window. Missing days never hurts: no consecutive-day rule. */
function perfectWeek(s: SaveData): boolean {
  const times = passedDailies(s).map((h) => Date.parse(h.resolvedAt ?? h.issuedAt)).sort((a, b) => a - b);
  const WEEK = 7 * 24 * 3600 * 1000;
  for (let i = 0; i + 6 < times.length; i++) if (times[i + 6]! - times[i]! <= WEEK) return true;
  return false;
}

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
  'first-page': (s) => s.evidence.some((r) => r.passed && r.challengeId.startsWith('web-')),
  'first-request': (s) => s.evidence.some((r) => r.passed && r.skillIds.includes('web.http')),
  'app-builder': (s) => s.evidence.some((r) => r.passed && r.challengeId.startsWith('web-25-')),
  'web-district-cleared': (s) => s.quests['web-workshop']?.status === 'complete',
  'pipeline-running': (s) => s.quests['pipeline-works']?.status === 'complete',
  'first-daily': dailyMilestone(1),
  'daily-5': dailyMilestone(5),
  'daily-10': dailyMilestone(10),
  'daily-25': dailyMilestone(25),
  'daily-50': dailyMilestone(50),
  'daily-100': dailyMilestone(100),
  'perfect-week': perfectWeek,
  'cross-skill': (s) => new Set(passedDailies(s).map((h) => h.category)).size >= 4,
  'old-skills-sharp': (s) => passedDailies(s).filter((h) => h.focus === 'review' && h.difficulty >= 4).length >= 5,
  'first-boss': (s) => Object.values(s.bosses).some((b) => !!b.passedAt),
  'back-stronger': (s) => Object.values(s.bosses).some((b) => !!b.passedAt && b.attempts.some((a) => !a.passed)),
  'mastery-trial': (s) => ['mastery-python', 'mastery-sql', 'mastery-data-eng', 'mastery-web'].some((id) => !!s.bosses[id]?.passedAt),
  'summit-reached': (s) => !!s.campaign.completedAt,
  'blank-page': (s) => !!s.learning.challenges['py-14-warehouse-audit']?.passed,
};

/** Achievement ids whose condition is now true but which are not yet recorded. */
export function newlyEarned(save: SaveData): string[] {
  return Object.keys(conditions).filter((id) => !save.achievements[id] && conditions[id]!(save));
}
