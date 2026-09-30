import { lessons } from '../content';
import type { Lesson } from '../content/schema';
import type { SaveData } from '../core/save';

export type LessonStatus = 'locked' | 'available' | 'in-progress' | 'complete';

export function lessonStatus(save: SaveData, lesson: Lesson): LessonStatus {
  const p = save.learning.lessons[lesson.id];
  if (p?.completed) return 'complete';
  if (!lesson.prerequisites.every((id) => save.learning.lessons[id]?.completed)) return 'locked';
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

/** The first lesson the player can do and has not finished. */
export function nextLesson(save: SaveData): Lesson | undefined {
  return lessons.find((l) => {
    const s = lessonStatus(save, l);
    return s === 'available' || s === 'in-progress';
  });
}

/** Which part of the world a lesson belongs to. Derived from the id prefix so content needs no extra field. */
export type Track = 'python' | 'sql' | 'data-eng' | 'web';

export function trackOf(lesson: Pick<Lesson, 'id'>): Track {
  if (lesson.id.startsWith('sql-')) return 'sql';
  if (lesson.id.startsWith('de-')) return 'data-eng';
  if (lesson.id.startsWith('web-')) return 'web';
  return 'python';
}

export const isTrial = (lesson: Pick<Lesson, 'id'>): boolean => lesson.id.includes('independent');
