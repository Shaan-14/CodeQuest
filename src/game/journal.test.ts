import { describe, expect, it } from 'vitest';
import { lessons } from '../content';
import { quests } from '../content/world';
import { worlds } from '../content/worlds';
import { newSave } from '../core/save';
import { journalFor, trackOfQuest } from './journal';

describe('quest journal', () => {
  const j = journalFor(newSave());
  it('has a section for every world', () => expect(j.map((w) => w.track)).toEqual(worlds.map((w) => w.track)));
  it('every story quest belongs to exactly one world and appears once', () => {
    const seen = j.flatMap((w) => [...w.available, ...w.completed, ...w.locked].concat(w.current && !w.available.includes(w.current) ? [w.current] : []));
    for (const q of quests) expect(seen.filter((m) => m.quest.id === q.id).length, q.id).toBeGreaterThanOrEqual(1);
    for (const q of quests) expect(worlds.map((w) => w.track)).toContain(trackOfQuest(q));
  });
  it('a fresh save points at a real first lesson in each world that has lessons', () => {
    for (const w of j) {
      if (!w.lessons.total) continue;
      expect(['lesson', 'locked'], w.track).toContain(w.next.kind);
      if (w.next.lessonId) expect(lessons.some((l) => l.id === w.next.lessonId)).toBe(true);
    }
  });
  it('locked missions say why', () => { for (const w of j) for (const m of w.locked) expect(m.reason.length, m.quest.id).toBeGreaterThan(0); });
  it('completing a lesson advances the next step and the count', () => {
    const first = j.find((w) => w.next.kind === 'lesson')!;
    const s = newSave();
    s.learning.lessons[first.next.lessonId!] = { ...(s.learning.lessons[first.next.lessonId!] ?? {}), completed: true } as never;
    const after = journalFor(s).find((w) => w.track === first.track)!;
    expect(after.lessons.done).toBe(1);
    expect(after.next.lessonId).not.toBe(first.next.lessonId);
  });
});
