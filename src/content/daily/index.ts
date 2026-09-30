import type { Challenge } from '../schema';
import { dataEngDailies } from './dataeng';
import { pythonDailies } from './python';
import { sqlDailies } from './sql';
import { webDailies } from './web';

/**
 * Challenges authored specifically for the Daily Challenge: independent-style (no hints, no concept tags, hidden
 * checks), each with `daily` metadata (focus + required lessons). They are NOT part of lessons, objectives or the
 * Practice Yard; the Daily Challenge system (game/dailySelect.ts) is their only consumer.
 */
export const dailyChallenges: Challenge[] = [...pythonDailies, ...sqlDailies, ...dataEngDailies, ...webDailies];
