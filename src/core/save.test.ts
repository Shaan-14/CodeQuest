import { describe, expect, it } from 'vitest';
import { loadSave, writeSave, newSave, SAVE_KEY, type KeyValueStore } from './save';

function memoryStore(): KeyValueStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
}

describe('save', () => {
  it('returns a fresh save when nothing is stored', () => {
    expect(loadSave(memoryStore())).toEqual(newSave());
  });
  it('round-trips data', () => {
    const s = memoryStore();
    writeSave(s, { ...newSave(), launches: 3 });
    expect(loadSave(s).launches).toBe(3);
  });
  it('falls back on corrupt data', () => {
    const s = memoryStore();
    s.setItem(SAVE_KEY, '{not json');
    expect(loadSave(s)).toEqual(newSave());
  });
});
