/**
 * STATIONS: a console/terminal in the world is a door to lessons. A station names the lessons it offers (in teaching order) and the world it
 * belongs to. The lesson, its challenges, grading, hints, Focus and training are all the normal ones; the station only decides WHERE in the
 * world they are used and what the world does about them (see effects.ts and the scene's reactions).
 */
export interface Station {
  id: string;
  title: string;
  /** Short line under the title in the terminal. */
  blurb: string;
  /** Lessons in teaching order; the terminal opens the first unfinished one. */
  lessons: string[];
  /** Scene to return to (and where) when a failed attempt owes training. */
  scene: string;
}

export const stations: Station[] = [
  {
    id: 'bolt-console', scene: 'maintenance-bay', title: 'Bolt-7 Repair Console',
    blurb: 'Bolt-7’s control program, written one module at a time. Each module you finish changes something on the repair table.',
    lessons: ['py-01-first-program', 'py-02-fixing-errors', 'py-03-variables', 'py-04-strings', 'py-05-numbers', 'py-06-input-conversion', 'py-07-logic', 'py-08-if-else', 'py-09-elif', 'py-10-while', 'py-11-for-range', 'py-12-functions', 'py-13-wake-robot'],
  },
  {
    id: 'line-console', scene: 'manufacturing-floor', title: 'Assembly Line Controller',
    blurb: 'The line’s control programs: sort parts, keep records, reuse routines, find faults and read the machine logs.',
    lessons: ['py-14-independent-trial', 'py-15-lists', 'py-16-dicts', 'py-17-records', 'py-18-function-design', 'py-19-debugging', 'py-20-files', 'py-21-cleaning'],
  },
];
export const getStation = (id: string): Station | undefined => stations.find((s) => s.id === id);
export const stationOfLesson = (lessonId: string): Station | undefined => stations.find((s) => s.lessons.includes(lessonId));

import { getAnyChallenge } from '../index';
import type { QuestObjective } from '../schema';
import { lessonOfChallenge } from '../index';
import { PLAY_EFFECTS } from './effects';

/** The station a challenge is worked at (through the lesson it belongs to). */
export function stationOfChallenge(challengeId: string): string | undefined {
  const l = lessonOfChallenge(challengeId);
  return l ? stationOfLesson(l.id)?.id : undefined;
}

/** Is this quest step worked at this station? (A lesson step, a challenge of one of its lessons, or an effect its lessons cause.) */
export function stationServes(stationId: string, o: QuestObjective): boolean {
  const st = getStation(stationId);
  if (!st) return false;
  switch (o.kind ?? 'lesson') {
    case 'lesson': return st.lessons.includes((o as { lessonId: string }).lessonId);
    case 'challenge': { const c = getAnyChallenge((o as { ref: string }).ref); const l = c ? lessonOfChallenge(c.id) : undefined; return !!l && st.lessons.includes(l.id); }
    case 'effect': return st.lessons.some((l) => PLAY_EFFECTS[l]?.some((e) => `${e.target}:${e.action}` === (o as { ref: string }).ref));
    default: return false;
  }
}
