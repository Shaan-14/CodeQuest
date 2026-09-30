import { lessonOfChallenge, lessons } from '../content';
import type { Lesson } from '../content/schema';
import type { SaveData } from '../core/save';
import { trackOfLessonId, type Track } from '../content/worlds';
import { lessonAccess } from './graph';

/** 'locked' means "missing prerequisites" (lessonGaps says exactly which): the UI never presents it as a dead end. */
export type LessonStatus = 'locked' | 'available' | 'in-progress' | 'complete';

export function lessonStatus(save: SaveData, lesson: Lesson): LessonStatus {
  const p = save.learning.lessons[lesson.id];
  if (p?.completed) return 'complete';
  if (!lessonAccess(save, lesson).open) return 'locked';
  const started = (p && p.stepIndex > 0) || lesson.steps.some((s) => s.kind === 'challenge' && (save.learning.challenges[s.challengeId]?.attempts ?? 0) > 0);
  return started ? 'in-progress' : 'available';
}

/** How much of a lesson's challenges the player has passed, and whether any pass was fully independent. */
export function lessonEvidence(save: SaveData, lesson: Lesson) {
  const ids = lesson.steps.flatMap((s) => (s.kind === 'challenge' ? [s.challengeId] : []));
  const passed = ids.filter((id) => save.learning.challenges[id]?.passed).length;
  const independent = save.evidence.filter((r) => ids.includes(r.challengeId) && r.passed && (r.support === 'independent' || r.support === 'transfer')).length;
  return { total: ids.length, passed, independent };
}

/** The learning world the player touched most recently (their latest evidence or completed lesson); python when they have not started. */
export function activeTrack(save: SaveData): Track {
  const lastEv = save.evidence.filter((r) => r.source !== 'daily' && r.source !== 'boss' && r.source !== 'training').at(-1);
  const lastDone = Object.entries(save.learning.lessons).filter(([, p]) => p.completed).sort((a, b) => Date.parse(b[1].completedAt ?? '') - Date.parse(a[1].completedAt ?? ''))[0];
  const id = lastEv?.challengeId ? lessonOfChallenge(lastEv.challengeId)?.id : lastDone?.[0];
  return id ? trackOfLessonId(id) : 'python';
}

/** The next lesson the player can do in a world (default: the world they are currently in). Worlds are independent: this never crosses into another one unless that one has nothing left. */
export function nextLesson(save: SaveData, track: Track = activeTrack(save)): Lesson | undefined {
  const open = (l: Lesson) => { const s = lessonStatus(save, l); return s === 'available' || s === 'in-progress'; };
  return lessons.find((l) => trackOfLessonId(l.id) === track && open(l)) ?? lessons.find(open);
}

/** Which learning world a lesson belongs to: derived from the id prefix (content/worlds.ts). */
export type { Track } from '../content/worlds';

export const trackOf = (lesson: Pick<Lesson, 'id'>): Track => trackOfLessonId(lesson.id);

export const isTrial = (lesson: Pick<Lesson, 'id'>): boolean => lesson.id.includes('independent');
