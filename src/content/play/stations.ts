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
  {
    id: 'rune-lectern', scene: 'spell-classroom', title: 'The Rune Lectern',
    blurb: 'Runes give things their meaning: a heading, a list, a form, a door. Each rune you write changes the Runecraft Hall.',
    lessons: ['web-01-html-basics', 'web-02-links-lists', 'web-03-tables', 'web-04-semantics', 'web-05-forms', 'web-06-html-debugging', 'web-07-independent-html'],
  },
  {
    id: 'ward-lectern', scene: 'spell-classroom', title: 'The Ward Lectern',
    blurb: 'Wards decide how things look and where they stand. Change a ward and the whole hall changes with it.',
    lessons: ['web-08-css-selectors', 'web-09-box-model', 'web-10-flexbox', 'web-11-grid', 'web-12-responsive', 'web-13-css-projects', 'web-14-independent-css'],
  },
  {
    id: 'spell-lectern', scene: 'arena', title: 'The Incantation Lectern',
    blurb: 'Incantations make things happen: click, wait, ask, answer. The Gloomhound answers only to spells that really work.',
    lessons: ['web-15-js-basics', 'web-16-js-data', 'web-17-js-errors', 'web-18-dom', 'web-19-events', 'web-20-forms-js', 'web-21-storage-json', 'web-22-async', 'web-23-fetch', 'web-24-fetch-write', 'web-25-web-projects', 'web-26-independent-js'],
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
