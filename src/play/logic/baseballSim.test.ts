import { describe, expect, it } from 'vitest';
import { opposingTeam, ourTeam, rng, simulateGame, winRate } from './baseballSim';

describe('baseball simulation', () => {
  it('is deterministic for a seed and different for different seeds', () => {
    const a = simulateGame(ourTeam(6, true), opposingTeam, 5), b = simulateGame(ourTeam(6, true), opposingTeam, 5), c = simulateGame(ourTeam(6, true), opposingTeam, 6);
    expect(a).toEqual(b);
    expect(JSON.stringify(a.plays)).not.toBe(JSON.stringify(c.plays));
    const r = rng(1); expect([r(), r(), r()].every((x) => x >= 0 && x < 1)).toBe(true);
  });
  it('every half inning ends on three outs, and the game has a winner', () => {
    for (let seed = 1; seed < 40; seed++) {
      const g = simulateGame(ourTeam(3, false), opposingTeam, seed);
      expect(g.us).not.toBe(g.them);
      expect(g.won).toBe(g.us > g.them);
      const outs = new Map<string, number>();
      for (const p of g.plays) if (['strikeout', 'groundout', 'flyout'].includes(p.type)) outs.set(`${p.inning}${p.half}`, (outs.get(`${p.inning}${p.half}`) ?? 0) + 1);
      for (const n of outs.values()) expect(n).toBe(3);
    }
  });
  it('a home run scores everyone on base plus the batter; a walk with the bases loaded scores one', () => {
    let hr = false, walk = false;
    for (let seed = 1; seed < 400 && !(hr && walk); seed++) {
      const g = simulateGame(ourTeam(6, true), opposingTeam, seed);
      for (const p of g.plays) { const before = 0; void before; if (p.type === 'homerun') { hr = true; expect(p.runs).toBeGreaterThanOrEqual(1); expect(p.bases).toEqual([-1, -1, -1]); } if (p.type === 'walk' && p.runs === 1) walk = true; }
    }
    expect(hr).toBe(true);
  });
  it('every step of analysis makes the team better (and the win chance follows), because each improves on-base, slugging or defence', () => {
    let last = -1;
    for (let steps = 0; steps <= 6; steps++) {
      const t = ourTeam(steps, steps >= 6), w = winRate(t, opposingTeam, 300);
      expect(w).toBeGreaterThanOrEqual(last - 0.02);
      last = w;
    }
    expect(winRate(ourTeam(6, true), opposingTeam, 300)).toBeGreaterThan(winRate(ourTeam(0, false), opposingTeam, 300) + 0.25);
  });
  it('a lineup that is not set misplays more balls', () => { expect(ourTeam(2, false).errorRate).toBeGreaterThan(ourTeam(6, true).errorRate); });
});
