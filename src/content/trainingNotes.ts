import { lessons, getSkill } from './index';

/**
 * The short "refresher card" shown in a training plan's review step. Authored notes (below) win; otherwise the
 * reference card of the lesson that teaches the skill is used, so every skill always has something to review.
 * A note explains the idea and the common trap; it never contains the solution to any challenge.
 */
export interface TrainingNote {
  skillId: string;
  title: string;
  body: string;
  example?: string;
  /** Common traps, each one line. */
  pitfalls: string[];
}

export const authoredNotes: TrainingNote[] = [];

export function noteFor(skillId: string): TrainingNote {
  const a = authoredNotes.find((n) => n.skillId === skillId);
  if (a) return a;
  const lesson = lessons.find((l) => l.skillId === skillId && l.reference);
  const skill = getSkill(skillId);
  if (lesson) return { skillId, title: lesson.reference.title, body: lesson.reference.body, example: lesson.reference.example, pitfalls: [] };
  return { skillId, title: skill?.title ?? skillId, body: `Review the idea behind ${skill?.title ?? skillId}: what problem it solves, then how you wrote it the last time it worked for you.`, pitfalls: [] };
}
