/**
 * THE JOURNAL (pure): one view of the player's whole path, read from the same places the rest of the game reads: the worlds (content/worlds.ts),
 * the story quests and how far each is, the lesson list and what the player has completed, the skills and the evidence behind them, and the
 * lesson ordering (`nextLesson`). Nothing here is a second progression system: it only groups what already exists by world, so the Quest
 * Journal answers "what am I doing, what have I done, what next, which skills am I building" for EVERY world, wherever the player stands.
 * Progress shown here is a milestone view; the mastery counts come from evidence only (learning/mastery.ts), never from XP or completion.
 */
import { lessons, lessonOfChallenge, skills } from '../content';
import type { Lesson, Quest } from '../content/schema';
import { quests } from '../content/world';
import { LESSON_EFFECTS } from '../content/worldEffects';
import { PLAY_EFFECTS } from '../content/play/effects';
import { trackOfLessonId, trackOfSkillId, worlds, type Track, type World } from '../content/worlds';
import type { SaveData } from '../core/save';
import { summarizeSkill, type SkillStatus } from '../learning/mastery';
import { lessonGaps } from './graph';
import { lessonStatus, nextLesson } from './lessons';
import { nextObjective, objectiveDone, questProgress, questStatus, unavailableReason, type QuestStatus } from './quests';
import { requiredTraining } from './training';

export interface JournalMission {
  quest: Quest;
  status: QuestStatus;
  done: number; total: number;
  /** The next unfinished step, in the quest's own words. */
  next?: string;
  /** Why it is not available yet (prerequisite quest, in words). */
  reason: string;
}

export interface JournalNext {
  kind: 'training' | 'lesson' | 'locked' | 'done';
  text: string;
  lessonId?: string;
  /** Skills still missing, for a locked lesson. */
  missing?: string[];
}

export interface JournalWorld {
  track: Track;
  world: World;
  lessons: { total: number; done: number; started: number };
  skills: { total: number; counts: Record<SkillStatus, number> };
  current?: JournalMission;
  available: JournalMission[];
  completed: JournalMission[];
  locked: JournalMission[];
  next: JournalNext;
  /** Has the player begun here? */
  begun: boolean;
}

/** Which lesson causes a world effect (so a story quest made of effects belongs to the world that teaches them). */
const effectLesson = (() => {
  const m = new Map<string, string>();
  for (const table of [LESSON_EFFECTS, PLAY_EFFECTS]) for (const [lessonId, effs] of Object.entries(table)) for (const e of effs) m.set(`${e.target}:${e.action}`, lessonId);
  return m;
})();

/** The world a story quest belongs to: where the lessons behind its steps are taught (the commonest), else where its giver works. */
export function trackOfQuest(q: Quest): Track {
  const votes = new Map<Track, number>();
  const vote = (id: string | undefined) => { if (id) { const t = trackOfLessonId(id); votes.set(t, (votes.get(t) ?? 0) + 1); } };
  for (const o of q.objectives) {
    const kind = o.kind ?? 'lesson';
    if (kind === 'lesson') vote((o as { lessonId: string }).lessonId);
    else if (kind === 'challenge') vote(lessonOfChallenge((o as { ref: string }).ref)?.id);
    else if (kind === 'effect') vote(effectLesson.get((o as { ref: string }).ref));
  }
  const best = [...votes].sort((a, b) => b[1] - a[1])[0];
  if (best) return best[0];
  return worlds.find((w) => w.givers.includes(q.giver))?.track ?? 'python';
}

function mission(save: SaveData, q: Quest): JournalMission {
  const status = questStatus(save, q);
  const { done, total } = questProgress(save, q);
  const next = nextObjective(save, q);
  return { quest: q, status, done, total, next: next?.text, reason: status === 'unavailable' ? unavailableReason(save, q) : '' };
}

const lessonsOf = (track: Track): Lesson[] => lessons.filter((l) => trackOfLessonId(l.id) === track);

export function journalFor(save: SaveData): JournalWorld[] {
  const owed = requiredTraining(save);
  return worlds.map((world): JournalWorld => {
    const track = world.track;
    const own = lessonsOf(track);
    const done = own.filter((l) => save.learning.lessons[l.id]?.completed).length;
    const started = own.filter((l) => lessonStatus(save, l) === 'in-progress').length;
    const counts: Record<SkillStatus, number> = { none: 0, attempted: 0, guided: 0, developing: 0, demonstrated: 0 };
    const mine = skills.filter((s) => trackOfSkillId(s.id) === track);
    for (const s of mine) counts[summarizeSkill(save.evidence, s).status]++;
    const ms = quests.filter((q) => trackOfQuest(q) === track).map((q) => mission(save, q));
    const active = ms.filter((m) => m.status === 'accepted' || m.status === 'in-progress');
    const available = ms.filter((m) => m.status === 'available');
    const completed = ms.filter((m) => m.status === 'completed');
    const locked = ms.filter((m) => m.status === 'unavailable');
    // what to do next, from the learning record: required training first, then the next open lesson of the world, else what a locked one needs
    let next: JournalNext;
    const nl = nextLesson(save, track);
    if (owed) next = { kind: 'training', text: 'You are not ready to try again: train first. Training never costs progress and returns you to the exact place you left.' };
    else if (nl && trackOfLessonId(nl.id) === track) next = { kind: 'lesson', lessonId: nl.id, text: `${lessonStatus(save, nl) === 'in-progress' ? 'Pick up where you left off' : 'Next up'}: ${nl.title}.` };
    else {
      const blocked = own.find((l) => !save.learning.lessons[l.id]?.completed);
      if (blocked) { const gaps = lessonGaps(save, blocked); next = { kind: 'locked', lessonId: blocked.id, text: `${blocked.title} is waiting on skills from elsewhere.`, missing: gaps.map((g) => g.title) }; }
      else next = { kind: 'done', text: 'You have finished every lesson here. Practice and reviews keep it sharp.' };
    }
    return {
      track, world, lessons: { total: own.length, done, started }, skills: { total: mine.length, counts },
      current: active[0] ?? available[0], available, completed, locked, next,
      begun: done > 0 || started > 0 || ms.some((m) => m.status !== 'available' && m.status !== 'unavailable'),
    };
  });
}

/** For tests and the UI: how many steps of a mission are done, by id (a thin alias so callers need not import quests.ts). */
export const stepsDone = (save: SaveData, q: Quest): number => q.objectives.filter((o) => objectiveDone(save, o)).length;
