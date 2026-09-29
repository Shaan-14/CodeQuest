/**
 * Content registry. The single place the rest of the app looks up curriculum data.
 * To add a lesson: create a file in content/<area>/, and add it to `bundles` below in teaching order.
 */
import type { Challenge, Lesson, LessonBundle, Skill } from './schema';
import { skills } from './skills';
import { bundle as l01 } from './python/01-first-program';
import { bundle as l02 } from './python/02-fixing-errors';
import { bundle as l03 } from './python/03-variables';
import { bundle as l04 } from './python/04-strings';
import { bundle as l05 } from './python/05-numbers';
import { bundle as l06 } from './python/06-input-conversion';
import { bundle as l07 } from './python/07-logic';
import { bundle as l08 } from './python/08-if-else';
import { bundle as l09 } from './python/09-elif';
import { bundle as l10 } from './python/10-while';
import { bundle as l11 } from './python/11-for-range';
import { bundle as l12 } from './python/12-functions';
import { bundle as l13 } from './python/13-wake-robot';
import { bundle as l14 } from './python/14-independent-trial';

export const bundles: LessonBundle[] = [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10, l11, l12, l13, l14];

export const lessons: Lesson[] = bundles.map((b) => b.lesson);
export const challenges: Challenge[] = bundles.flatMap((b) => b.challenges);
export { skills };

const lessonById = new Map(lessons.map((l) => [l.id, l]));
const challengeById = new Map(challenges.map((c) => [c.id, c]));
const skillById = new Map(skills.map((s) => [s.id, s]));

export const getLesson = (id: string): Lesson | undefined => lessonById.get(id);
export const getChallenge = (id: string): Challenge | undefined => challengeById.get(id);
export const getSkill = (id: string): Skill | undefined => skillById.get(id);
