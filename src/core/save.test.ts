import { describe, expect, it } from 'vitest';
import { BACKUP_KEY, SAVE_KEY, SAVE_VERSION, exportSave, importSave, loadSave, migrate, newSave, writeSave, type KeyValueStore } from './save';

function memoryStore(): KeyValueStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
}

describe('save', () => {
  it('returns a fresh save when nothing is stored', () => {
    const r = loadSave(memoryStore());
    expect(r.status).toBe('new');
    expect(r.save).toEqual(newSave());
  });
  it('round-trips data', () => {
    const s = memoryStore();
    const data = newSave();
    data.player = { name: 'Ada', avatar: 'a', createdAt: 'x' };
    data.stats.xp = 250;
    data.inventory['focus-tea'] = 2;
    writeSave(s, data);
    const r = loadSave(s);
    expect(r.status).toBe('loaded');
    expect(r.save).toEqual(data);
  });
  it('backs up and recovers from corrupt data instead of destroying it', () => {
    const s = memoryStore();
    s.setItem(SAVE_KEY, '{not json');
    const r = loadSave(s);
    expect(r.status).toBe('recovered');
    expect(r.save).toEqual(newSave());
    expect(s.map.get(BACKUP_KEY)).toBe('{not json');
  });
  it('migrates a Phase 0 (v1) save forward', () => {
    const s = memoryStore();
    s.setItem(SAVE_KEY, JSON.stringify({ version: 1, launches: 4 }));
    const r = loadSave(s);
    expect(r.status).toBe('loaded');
    expect(r.save.version).toBe(SAVE_VERSION);
    expect(r.save.player).toBeNull();
  });
  it('does not overwrite a save from a newer version', () => {
    const s = memoryStore();
    const future = JSON.stringify({ version: SAVE_VERSION + 1, other: true });
    s.setItem(SAVE_KEY, future);
    expect(loadSave(s).status).toBe('recovered');
    expect(s.map.get(BACKUP_KEY)).toBe(future);
  });
  it('rejects structurally invalid saves', () => {
    expect(migrate({ version: SAVE_VERSION })).toBeNull();
    expect(migrate(null)).toBeNull();
    expect(migrate('x')).toBeNull();
  });
  it('exports and imports', () => {
    const data = newSave();
    data.stats.coins = 42;
    expect(importSave(exportSave(data))?.stats.coins).toBe(42);
    expect(importSave('garbage')).toBeNull();
  });
});
