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
    expect(r.save.stats).toEqual({ xp: 500, coins: 40, focus: 100 }); // v6 -> v7: old saves start at full Focus
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
    data.inventory['lucky-cap'] = 1;
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
  it('migrates a v7 (Focus gate) save to v8 without touching progress, and adds the explore block', () => {
    const v7 = structuredClone(newSave()) as unknown as Record<string, unknown>;
    delete v7.explore;
    v7.version = 7;
    (v7.stats as Record<string, number>).xp = 640;
    (v7.learning as { lessons: Record<string, unknown> }).lessons['py-01-first-program'] = { stepIndex: 9, completed: true, completedAt: '2026-01-01T00:00:00.000Z' };
    (v7.evidence as unknown[]).push({ at: '2026-01-01T00:00:00.000Z', challengeId: 'py-01-hello', objectiveId: 'py-01-hello', context: 'games', skillIds: ['py.output'], concepts: [], mode: 'learning', difficulty: 1, passed: true, support: 'guided', hintsUsed: 0, lookups: 0, attemptNumber: 1, priorFailures: 0, project: false, timeMs: 1, executed: true });
    const m = migrate(v7)!;
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.explore).toEqual({ visited: [], last: null });
    expect(m.stats.xp).toBe(640);
    expect(m.learning.lessons['py-01-first-program']!.completed).toBe(true);
    expect(m.evidence).toHaveLength(1);
    expect(migrate({ ...v7, daily: { current: { challengeId: 'x', focus: 'mixed', skillId: 'a', category: 'c', difficulty: 3, issuedAt: '2026-01-01T00:00:00Z', expiresAt: '2026-01-01T12:00:00Z', status: 'open', attempts: 0, reason: 'r', reward: { coins: 1, xp: 1, focus: 0 } }, history: [], lastSeenAt: null } })!.daily.current?.focus).toBe('mixed');
  });
  it('repairs a hand-edited explore block instead of failing the save', () => {
    const d = structuredClone(newSave()) as unknown as Record<string, unknown>;
    d.explore = { visited: ['sql', 7, 'sql', null], last: 12 };
    expect(migrate(d)!.explore).toEqual({ visited: ['sql'], last: null });
    d.explore = 'nonsense';
    expect(migrate(d)!.explore).toEqual({ visited: [], last: null });
  });

  it('migrates a v8 (Phase 5) save to v9: an empty play block, progress and quests untouched', () => {
    const v8 = structuredClone(newSave()) as unknown as Record<string, unknown>;
    delete v8.play;
    v8.version = 8;
    (v8.quests as Record<string, unknown>)['wake-the-robot'] = { status: 'active', acceptedAt: '2026-01-01T00:00:00.000Z' };
    (v8.stats as Record<string, number>).xp = 910;
    const m = migrate(v8)!;
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.play).toEqual({ scene: null, pos: null, talked: {}, seen: { opening: 'existing-save' }, settings: { muted: false, reducedMotion: null, quality: 'medium' }, gear: { head: null, back: null } });
    expect(m.quests['wake-the-robot']!.status).toBe('active');
    expect(m.stats.xp).toBe(910);
  });
  it('repairs a corrupt play block instead of crashing or trusting it', () => {
    const s = structuredClone(newSave()) as unknown as Record<string, unknown>;
    s.play = { scene: 42, pos: { x: 'a', z: 1, ry: 0 }, talked: { a: -3, b: 2, c: 'x' }, seen: { k: 5, j: 'iso' }, settings: { muted: 'yes', quality: 'ultra' } };
    const m = migrate(s)!;
    expect(m.play.scene).toBeNull();
    expect(m.play.pos).toBeNull();
    expect(m.play.talked).toEqual({ b: 2 });
    expect(m.play.seen).toEqual({ j: 'iso' });
    expect(m.play.settings).toEqual({ muted: false, reducedMotion: null, quality: 'medium' });
  });
});
