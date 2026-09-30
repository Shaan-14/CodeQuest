import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';

describe('the balance table is coherent (change a number, and this says if it stopped making sense)', () => {
  it('Focus losses never shrink as the stakes grow, never exceed the maximum, and a hinted pass costs less than any failure', () => {
    const losses = [1, 2, 3, 4, 5].map((l) => BALANCE.focus.failureLevels[l as 1 | 2 | 3 | 4 | 5].loss);
    expect(losses).toEqual([...losses].sort((a, b) => a - b));
    for (const l of losses) { expect(l).toBeGreaterThan(0); expect(l).toBeLessThanOrEqual(BALANCE.focus.max); }
    expect(BALANCE.focus.hintedPassLoss).toBeLessThan(losses[0]!);
  });
  it('plans get longer with depth, and every plan ends with exactly one fresh proof', () => {
    const lengths = BALANCE.training.planOrder.map((l) => BALANCE.training.shapes[l].length);
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
    for (const l of BALANCE.training.planOrder) { const s = BALANCE.training.shapes[l]; expect(s.at(-1)).toBe('independent'); expect(s.filter((k) => k === 'independent')).toHaveLength(1); }
  });
  it('review intervals only grow with each consecutive success, and a recent failure is revisited soonest', () => {
    const d = BALANCE.review.streakDays;
    expect([...d]).toEqual([...d].sort((a, b) => a - b));
    expect(BALANCE.review.troubleDays).toBeLessThanOrEqual(Math.min(...d, BALANCE.review.guidedDays, BALANCE.review.failedDays));
  });
  it('dailies never pay Focus, pay more for harder work, and mixed or review ones pay a little more than current ones', () => {
    for (const k of ['current', 'review', 'mixed'] as const) {
      expect(BALANCE.daily.reward(3, k).focus).toBe(0);
      expect(BALANCE.daily.reward(5, k).coins).toBeGreaterThan(BALANCE.daily.reward(1, k).coins);
    }
    expect(BALANCE.daily.reward(3, 'mixed').coins).toBeGreaterThan(BALANCE.daily.reward(3, 'current').coins);
    expect(BALANCE.daily.reward(3, 'review').coins).toBeGreaterThan(BALANCE.daily.reward(3, 'current').coins);
    expect(BALANCE.daily.periodMs).toBe(12 * 3600 * 1000);
  });
});
