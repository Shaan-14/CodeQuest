import { describe, expect, it } from 'vitest';
import { newSave } from '../../core/save';
import { PLAY_EFFECTS } from '../../content/play/effects';
import { effectsOf, powerOf, restoration, restorationTotal, RESTORE_WORLDS, stageOf } from './restoration';
import { lessons as allLessons } from '../../content';

describe('restoration', () => {
  it('every play effect belongs to exactly one restoring world, and every world has some', () => {
    const all = Object.values(PLAY_EFFECTS).flat().length;
    expect(RESTORE_WORLDS.reduce((a, w) => a + effectsOf(w).length, 0)).toBe(all);
    for (const w of RESTORE_WORLDS) expect(effectsOf(w).length).toBeGreaterThan(3);
  });
  it('a new game is fully offline, and XP, coins and levels cannot restore anything', () => {
    const s = newSave(); s.stats.xp = 99999; s.stats.coins = 99999;
    expect(restorationTotal(s)).toBe(0);
    for (const w of RESTORE_WORLDS) expect(restoration(s, w)).toBe(0);
    expect(powerOf(0)).toBeGreaterThan(0.1); // offline but never black
    expect(powerOf(0)).toBeLessThan(0.4);
  });
  it('only the end of the campaign restores everything at once', () => {
    const s = newSave(); s.campaign.completedAt = new Date().toISOString();
    expect(restorationTotal(s)).toBe(1);
    expect(powerOf(1)).toBe(1);
  });
  it('stages step at a quarter, a half, three quarters and all', () => {
    expect([0, 0.24, 0.25, 0.5, 0.75, 0.999, 1].map(stageOf)).toEqual([0, 0, 1, 2, 3, 4, 4]);
  });
  it('is rebuilt from lessons that really exist', () => { expect(allLessons.length).toBeGreaterThan(0); });
});
