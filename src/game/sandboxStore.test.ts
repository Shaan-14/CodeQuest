import { describe, expect, it } from 'vitest';
import { SAVE_KEY } from '../core/save';
import { loadSandboxState, saveSandboxState, SANDBOX_KEY } from './sandboxStore';

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
};

describe('SQL sandbox storage', () => {
  it('round-trips per-database state under its own key, never the game save key', () => {
    const s = memory();
    saveSandboxState({ market: 'AAAA' }, s);
    expect(loadSandboxState(s)).toEqual({ market: 'AAAA' });
    expect(s.m.has(SANDBOX_KEY)).toBe(true);
    expect(s.m.has(SAVE_KEY)).toBe(false);
  });
  it('survives corrupt or wrongly shaped data by starting fresh', () => {
    const s = memory();
    s.setItem(SANDBOX_KEY, '{nope');
    expect(loadSandboxState(s)).toEqual({});
    s.setItem(SANDBOX_KEY, '[1,2]');
    expect(loadSandboxState(s)).toEqual({});
  });
  it('does not throw when storage refuses writes', () => {
    expect(() => saveSandboxState({ a: 'b' }, { setItem: () => { throw new Error('full'); } })).not.toThrow();
  });
});
