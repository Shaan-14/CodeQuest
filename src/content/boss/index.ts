import type { Challenge } from '../schema';
import { analyticsBossChallenges } from './analytics';
import { sheetBossChallenges } from './sheets';
import { rBossChallenges } from './r';
import { dataEngBossChallenges } from './dataeng';
import { pythonBossChallenges } from './python';
import { sqlBossChallenges } from './sql';
import { webBossChallenges } from './web';

/** Every boss problem. Bosses are NOT lesson content: they are only reachable through the boss gate (game/boss.ts). */
export const bossChallenges: Challenge[] = [...pythonBossChallenges, ...sqlBossChallenges, ...dataEngBossChallenges, ...webBossChallenges, ...analyticsBossChallenges, ...sheetBossChallenges, ...rBossChallenges];
