/**
 * Content registry. The single place the rest of the app looks up curriculum data.
 * To add a lesson: create a file in content/<area>/, and add it to `bundles` below in teaching order.
 */
import type { Challenge, Lesson, LessonBundle, Objective, Skill } from './schema';
import { objectiveOf } from './helpers';
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
import { bundle as l15 } from './python/15-lists';
import { bundle as l16 } from './python/16-dicts';
import { bundle as l17 } from './python/17-records';
import { bundle as l18 } from './python/18-function-design';
import { bundle as l19 } from './python/19-debugging';
import { bundle as l20 } from './python/20-files';
import { bundle as l21 } from './python/21-cleaning';
import { bundle as l22 } from './python/22-libraries';
import { bundle as l23 } from './python/23-testing';
import { bundle as l24 } from './python/24-oop';
import { bundle as l25 } from './python/25-projects';
import { bundle as l26 } from './python/26-independent-python';
import { bundle as s01 } from './sql/01-select';
import { bundle as s02 } from './sql/02-sort-limit';
import { bundle as s03 } from './sql/03-null';
import { bundle as s04 } from './sql/04-aggregates';
import { bundle as s05 } from './sql/05-group';
import { bundle as s06 } from './sql/06-joins';
import { bundle as s07 } from './sql/07-left-join';
import { bundle as s08 } from './sql/08-case';
import { bundle as s09 } from './sql/09-modify';
import { bundle as s10 } from './sql/10-subqueries';
import { bundle as s11 } from './sql/11-window';
import { bundle as s12 } from './sql/12-design';
import { bundle as s13 } from './sql/13-integrity-performance';
import { bundle as s14 } from './sql/14-independent-sql';
import { bundle as d01 } from './dataeng/01-pipelines';
import { bundle as d02 } from './dataeng/02-python-sql';
import { bundle as d03 } from './dataeng/03-independent-de';
import { bundle as w01 } from './web/01-html-basics';
import { bundle as w02 } from './web/02-links-lists';
import { bundle as w03 } from './web/03-tables';
import { bundle as w04 } from './web/04-semantics';
import { bundle as w05 } from './web/05-forms';
import { bundle as w06 } from './web/06-html-debugging';
import { bundle as w07 } from './web/07-html-trial';
import { bundle as w08 } from './web/08-css-selectors';
import { bundle as w09 } from './web/09-box-model';
import { bundle as w10 } from './web/10-flexbox';
import { bundle as w11 } from './web/11-grid';
import { bundle as w12 } from './web/12-responsive';
import { bundle as w13 } from './web/13-css-projects';
import { bundle as w14 } from './web/14-css-trial';
import { bundle as w15 } from './web/15-js-basics';
import { bundle as w16 } from './web/16-js-data';
import { bundle as w17 } from './web/17-js-errors';
import { bundle as w18 } from './web/18-dom';
import { bundle as w19 } from './web/19-events';
import { bundle as w20 } from './web/20-forms-js';
import { bundle as w21 } from './web/21-storage-json';
import { bundle as w22 } from './web/22-async';
import { bundle as w23 } from './web/23-fetch';

export const bundles: LessonBundle[] = [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10, l11, l12, l13, l14, l15, l16, l17, l18, l19, l20, l21, l22, l23, l24, l25, l26, s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, d01, d02, d03, w01, w02, w03, w04, w05, w06, w07, w08, w09, w10, w11, w12, w13, w14, w15, w16, w17, w18, w19, w20, w21, w22, w23];

import { dailyChallenges } from './daily';
export { dailyChallenges };

export const lessons: Lesson[] = bundles.map((b) => b.lesson);
export const challenges: Challenge[] = bundles.flatMap((b) => b.challenges);
export { skills };

/** Objectives: those declared by bundles, plus one auto-titled objective per undeclared challenge. */
export const objectives: Objective[] = (() => {
  const declared = new Map(bundles.flatMap((b) => b.objectives ?? []).map((o) => [o.id, o]));
  const out = new Map<string, Objective>();
  for (const c of challenges) {
    const id = objectiveOf(c);
    out.set(id, declared.get(id) ?? out.get(id) ?? { id, title: c.title, summary: c.expectedBehavior ?? c.title });
  }
  return [...out.values()];
})();
const objectiveById = new Map(objectives.map((o) => [o.id, o]));
export const getObjective = (id: string): Objective | undefined => objectiveById.get(id);

/** All authored variants of an objective, in authoring order. */
export const variantsOf = (objectiveId: string): Challenge[] => challenges.filter((c) => objectiveOf(c) === objectiveId);

const lessonById = new Map(lessons.map((l) => [l.id, l]));
const challengeById = new Map(challenges.map((c) => [c.id, c]));
const skillById = new Map(skills.map((s) => [s.id, s]));

export const getLesson = (id: string): Lesson | undefined => lessonById.get(id);
export const getChallenge = (id: string): Challenge | undefined => challengeById.get(id);
const dailyById = new Map(dailyChallenges.map((c) => [c.id, c]));
/** A lesson/practice challenge OR a Daily Challenge (evidence and the daily screen need both). */
export const getAnyChallenge = (id: string): Challenge | undefined => challengeById.get(id) ?? dailyById.get(id);
export const getSkill = (id: string): Skill | undefined => skillById.get(id);
