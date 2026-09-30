import { describe, expect, it } from 'vitest';
import { BACKUP_KEY, SAVE_KEY, SAVE_VERSION, exportSave, importSave, loadSave, migrate, newSave, writeSave, type KeyValueStore } from './save';

function memoryStore(): KeyValueStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
}

describe('save v2 -> v3 migration (Phase 2)', () => {
  const v2 = () => {
    const d: Record<string, unknown> = { ...newSave(), version: 2 };
    d.player = { name: 'Old', avatar: 'ranger', createdAt: 't' };
    d.stats = { xp: 500, coins: 40, focus: 60 };
    d.evidence = [
      { at: 'a', challengeId: 'py-05-crates', skillIds: ['py.numbers'], concepts: [], mode: 'challenge', difficulty: 2, passed: false, support: 'independent', hintsUsed: 0, attemptNumber: 1, timeMs: 1, executed: true },
      { at: 'b', challengeId: 'py-05-crates', skillIds: ['py.numbers'], concepts: [], mode: 'challenge', difficulty: 2, passed: true, support: 'independent', hintsUsed: 0, attemptNumber: 2, timeMs: 1, executed: true },
    ];
    return d;
  };
  it('upgrades a v2 save without losing anything', () => {
    const s = memoryStore();
    s.setItem(SAVE_KEY, JSON.stringify(v2()));
    const r = loadSave(s);
    expect(r.status).toBe('loaded');
    expect(r.save.version).toBe(SAVE_VERSION);
    expect(r.save.player?.name).toBe('Old');
    expect(r.save.stats).toEqual({ xp: 500, coins: 40, focus: 60 });
    expect(r.save.evidence).toHaveLength(2);
  });
  it('adds the new evidence fields, computing priorFailures from history', () => {
    const r = migrate(v2())!;
    expect(r.evidence[0]).toMatchObject({ objectiveId: 'py-05-crates', priorFailures: 0, lookups: 0, project: false });
    expect(r.evidence[1]).toMatchObject({ objectiveId: 'py-05-crates', priorFailures: 1 });
  });
  it('persists as the current version after the next write', () => {
    const s = memoryStore();
    s.setItem(SAVE_KEY, JSON.stringify(v2()));
    writeSave(s, loadSave(s).save);
    expect(JSON.parse(s.map.get(SAVE_KEY)!).version).toBe(SAVE_VERSION);
  });
  it('still migrates a Phase 0 (v1) save through both steps', () => {
    expect(migrate({ version: 1, launches: 2 })!.version).toBe(SAVE_VERSION);
  });
});

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
