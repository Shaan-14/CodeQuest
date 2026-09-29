/**
 * PLAYER PROGRESSION (XP, levels, coins). This is engagement/pacing only.
 * It is intentionally independent of learning/mastery.ts: nothing here reads evidence, and
 * mastery never reads XP or level. A level-10 player can have weak evidence in a skill.
 */
import type { Challenge } from '../content/schema';

/** Total XP needed to reach `level` (level 1 = 0). 100, 300, 600, 1000, 1500, ... */
export function xpToReach(level: number): number {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpToReach(level + 1)) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  /** XP earned inside the current level. */
  into: number;
  /** XP the current level spans. */
  span: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const start = xpToReach(level);
  return { level, into: xp - start, span: xpToReach(level + 1) - start };
}

export interface Reward {
  xp: number;
  coins: number;
  /** Human-readable explanation for the UI. */
  note: string;
}

/**
 * Independence pays more than assistance:
 *  - learning mode: x1.0, minus 10% per hint (floor x0.6)
 *  - challenge mode: no hints x1.25 ("independence bonus"); with hints x(1 - 0.2 per hint), floor x0.5
 *  - independent mode: x1.5 (hints do not exist)
 */
export function rewardFor(challenge: Pick<Challenge, 'mode' | 'xpReward' | 'coinReward'>, hintsUsed: number): Reward {
  let mult: number;
  let note: string;
  if (challenge.mode === 'learning') {
    mult = Math.max(0.6, 1 - 0.1 * hintsUsed);
    note = hintsUsed ? 'Guided practice (hints reduce the reward)' : 'Guided practice';
  } else if (challenge.mode === 'challenge') {
    if (hintsUsed === 0) {
      mult = 1.25;
      note = 'Independence bonus: solved with no hints';
    } else {
      mult = Math.max(0.5, 1 - 0.2 * hintsUsed);
      note = 'Solved with hints (reduced reward)';
    }
  } else {
    mult = 1.5;
    note = 'Independent trial';
  }
  return { xp: Math.round(challenge.xpReward * mult), coins: Math.round(challenge.coinReward * mult), note };
}
