import type { Challenge } from '../schema';

/**
 * Builder for Boss challenges. A boss problem is independent-style: no hints, no concept tags, no starter code, every
 * check hidden, and (for the major bosses) a context the player has not met in a lesson. Each boss has several
 * VERSIONS with different problems and data: a retry after a failure is always a new version, never the same problem.
 */
export type BossDef = Omit<Challenge, 'mode' | 'hints' | 'concepts' | 'xpReward' | 'coinReward' | 'boss' | 'daily' | 'starterCode'> & {
  starterCode?: string;
  boss: { bossId: string; version: string };
};

export const bossChallenge = (d: BossDef): Challenge => ({
  ...d,
  mode: 'independent',
  concepts: [],
  hints: [],
  starterCode: d.starterCode ?? '',
  xpReward: 0,
  coinReward: 0,
  transfer: true,
});
