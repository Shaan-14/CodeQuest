import { describe, expect, it } from 'vitest';
import { levelFromXp, levelProgress, rewardFor, xpToReach } from './progression';

describe('levels', () => {
  it('follows the XP curve', () => {
    expect([1, 2, 3, 4, 5].map(xpToReach)).toEqual([0, 100, 300, 600, 1000]);
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(1000)).toBe(5);
  });
  it('reports progress inside a level', () => {
    expect(levelProgress(150)).toEqual({ level: 2, into: 50, span: 200 });
  });
});

describe('rewards favour independence', () => {
  const base = { xpReward: 100, coinReward: 10 };
  it('pays more for a hint-free challenge than a hinted one', () => {
    const clean = rewardFor({ ...base, mode: 'challenge' }, 0);
    const hinted = rewardFor({ ...base, mode: 'challenge' }, 2);
    expect(clean.xp).toBe(125);
    expect(hinted.xp).toBe(60);
    expect(clean.xp).toBeGreaterThan(hinted.xp);
  });
  it('floors the hint penalty', () => {
    expect(rewardFor({ ...base, mode: 'challenge' }, 9).xp).toBe(50);
    expect(rewardFor({ ...base, mode: 'learning' }, 9).xp).toBe(60);
  });
  it('pays most for independent mode', () => {
    expect(rewardFor({ ...base, mode: 'independent' }, 0).xp).toBe(150);
  });
});
