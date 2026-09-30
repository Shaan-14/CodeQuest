import { getLesson } from '../../content';
import { getBoss } from '../../content/bosses';
import type { ReturnPoint } from '../../core/save';

/** Where a finished training plan sends the player, in words. Its own module so screens that only NEED the words do not load the training player (and the code editor with it). */
export function describeReturn(r: ReturnPoint): string {
  if (r.kind === 'lesson' && r.lessonId) return `Back to “${getLesson(r.lessonId)?.title ?? r.lessonId}”, exactly where you left off`;
  if (r.kind === 'boss') return r.bossId && getBoss(r.bossId) ? `Back to ${getBoss(r.bossId)!.title} in the Boss Hall` : 'Back to the boss gate';
  if (r.kind === 'daily') return 'Back to the Daily Challenge';
  return 'Back to the map';
}
