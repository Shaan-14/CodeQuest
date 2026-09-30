import { describe, expect, it } from 'vitest';
import * as A from './actions';
import { GameStore } from './store';
import { newSave, loadSave, writeSave, type SaveData } from '../core/save';
import { quests } from '../content/world';
import { getQuest, nextObjective, objectiveDone, questProgress, questStatus, unavailableReason } from './quests';

const fresh = (): SaveData => A.createPlayer(newSave(), 'Ada', 'spellwright').save;
const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };

describe('quest states (unavailable, available, accepted, in-progress, completed)', () => {
  it('a quest that follows another is UNAVAILABLE, says which one first, and cannot be accepted', () => {
    const s = fresh();
    const q = getQuest('ledger-vault')!;
    expect(questStatus(s, q)).toBe('unavailable');
    expect(unavailableReason(s, q)).toContain(getQuest('wake-the-robot')!.title);
    const r = A.acceptQuest(s, q.id);
    expect(r.save.quests[q.id]).toBeUndefined();
    expect(r.events).toHaveLength(0);
  });
  it('an open quest is AVAILABLE, then ACCEPTED (nothing done), IN-PROGRESS (one step), COMPLETED (all steps, reward once)', () => {
    let s = fresh();
    const q = getQuest('wake-the-robot')!;
    expect(questStatus(s, q)).toBe('available');
    s = A.acceptQuest(s, q.id).save;
    expect(questStatus(s, q)).toBe('accepted');
    s = A.completeLesson(s, q.objectives[0]!.lessonId!).save;
    expect(questStatus(s, q)).toBe('in-progress');
    expect(questProgress(s, q).done).toBe(1);
    expect(nextObjective(s, q)!.id).toBe(q.objectives[1]!.id);
    for (const o of q.objectives.slice(1)) s = A.completeLesson(s, o.lessonId!).save;
    expect(questStatus(s, q)).toBe('completed');
    const xp = s.stats.xp;
    expect(A.acceptQuest(s, q.id).save.stats.xp).toBe(xp); // accepting again changes nothing
    expect(s.inventory['robot-bolt']).toBe(1);
  });
  it('finishing the prerequisite quest makes the next one available', () => {
    let s = A.acceptQuest(fresh(), 'wake-the-robot').save;
    for (const o of getQuest('wake-the-robot')!.objectives) s = A.completeLesson(s, o.lessonId!).save;
    expect(questStatus(s, getQuest('ledger-vault')!)).toBe('available');
  });
  it('every quest starts in a legal state and only accepted quests live in the save', () => {
    const s = fresh();
    for (const q of quests) { expect(['available', 'unavailable']).toContain(questStatus(s, q)); expect(s.quests[q.id]).toBeUndefined(); }
  });
});

describe('quest objectives that happen in the world', () => {
  const play = (): SaveData => A.acceptQuest(fresh(), 'wake-the-robot').save;
  it('talk and inspect objectives read the play facts; challenge objectives read evidence; effects read the derived world', () => {
    const s = play();
    const talk = { id: 't', text: 'Talk', kind: 'talk' as const, ref: 'npc-x' };
    const look = { id: 'i', text: 'Look', kind: 'inspect' as const, ref: 'obj-y' };
    expect(objectiveDone(s, talk)).toBe(false);
    expect(objectiveDone({ ...s, play: { ...s.play, talked: { 'npc-x': 1 } } }, talk)).toBe(true);
    expect(objectiveDone(s, look)).toBe(false);
    expect(objectiveDone({ ...s, play: { ...s.play, seen: { 'obj-y': 'now' } } }, look)).toBe(true);
    expect(objectiveDone(s, { id: 'c', text: 'C', kind: 'challenge', ref: 'nope' })).toBe(false);
    expect(objectiveDone(s, { id: 'e', text: 'E', kind: 'effect', ref: 'academy.robot:wake' })).toBe(false);
  });
});

describe('the store cannot lose `this` (the reason every Accept button did nothing)', () => {
  it('a destructured apply() still updates and persists the save, and event listeners hear it', () => {
    const storage = memory();
    const store = new GameStore(storage);
    const { apply, save: _unused, onEvent } = store;
    void _unused;
    const heard: string[] = [];
    onEvent((e) => heard.push(e.type));
    apply(A.createPlayer(store.save, 'Ada', 'spellwright'));
    apply(A.acceptQuest(store.save, 'wake-the-robot'));
    expect(store.save.quests['wake-the-robot']?.status).toBe('active');
    expect(heard).toContain('questAccepted');
    expect(loadSave(storage).save.quests['wake-the-robot']?.status).toBe('active'); // persisted
    writeSave(storage, store.save);
  });
  it('quest state survives a reload', () => {
    const storage = memory();
    const a = new GameStore(storage);
    a.apply(A.createPlayer(a.save, 'Ada', 'spellwright'));
    a.apply(A.acceptQuest(a.save, 'wake-the-robot'));
    a.apply(A.completeLesson(a.save, 'py-01-first-program'));
    const b = new GameStore(storage);
    expect(questStatus(b.save, getQuest('wake-the-robot')!)).toBe('in-progress');
  });
});
