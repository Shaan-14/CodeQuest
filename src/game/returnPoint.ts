import type { ReturnPoint, SaveData } from '../core/save';
import { nextLesson } from './lessons';

/** The curriculum position training should hand the player back to: the lesson they would continue with next. */
export function returnPointFor(save: SaveData): ReturnPoint {
  const next = nextLesson(save);
  return next ? { kind: 'lesson', lessonId: next.id, stepIndex: save.learning.lessons[next.id]?.stepIndex ?? 0 } : { kind: 'area', areaId: 'training-grounds' };
}
