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
import { phase3Variants } from './python/variants-phase3';
import { bundle as p27 } from './python/27-independent-review-a';
import { bundle as p28 } from './python/28-independent-review-b';
import { bundle as s15 } from './sql/15-independent-review';
import { bundle as w01 } from './web/01-html-basics';
import { bundle as w02 } from './web/02-links-lists';
import { bundle as w03 } from './web/03-tables';
import { bundle as w04 } from './web/04-semantics';
import { bundle as w05 } from './web/05-forms';
import { bundle as p29 } from './python/29-text-processing';
import { bundle as p30 } from './python/30-nested-data';
import { bundle as p31 } from './python/31-searching-sorting';
import { bundle as p32 } from './python/32-exceptions';
import { bundle as p33 } from './python/33-parsing';
import { bundle as p34 } from './python/34-read-the-docs';
import { bundle as s16 } from './sql/16-text-dates';
import { bundle as s17 } from './sql/17-sets-self-joins';
import { bundle as s18 } from './sql/18-debugging-queries';
import { bundle as s19 } from './sql/19-investigations';
import { bundle as s20 } from './sql/20-migrations';
import { bundle as w27 } from './web/27-closures';
import { bundle as w28 } from './web/28-testing-js';
import { bundle as w29 } from './web/29-positioning';
import { bundle as w30 } from './web/30-render-from-state';
import { bundle as w31 } from './web/31-web-addresses';
import { bundle as d04 } from './dataeng/04-validation';
import { bundle as d05 } from './dataeng/05-quality';
import { bundle as d06 } from './dataeng/06-logging';
import { bundle as d07 } from './dataeng/07-failing-safely';
import { bundle as d08 } from './dataeng/08-incremental';
import { bundle as d09 } from './dataeng/09-reporting';
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
import { bundle as w24 } from './web/24-fetch-write';
import { bundle as w25 } from './web/25-web-projects';
import { bundle as w26 } from './web/26-web-trial';

import { bundle as g01 } from './git/01-repositories';
import { bundle as g02 } from './git/02-history';
import { bundle as g03 } from './git/03-branches';
import { bundle as g04 } from './git/04-merging';
import { bundle as g05 } from './git/05-collaboration';
import { bundle as g06 } from './git/06-workflow';
import { bundle as x01 } from './sheet/01-formulas';
import { bundle as x02 } from './sheet/02-functions';
import { bundle as x03 } from './sheet/03-logic';
import { bundle as x04 } from './sheet/04-lookups';
import { bundle as x05 } from './sheet/05-conditional';
import { bundle as x06 } from './sheet/06-cleaning';
import { bundle as x07 } from './sheet/07-pivots';
import { bundle as x08 } from './sheet/08-modelling';
import { bundle as x09 } from './sheet/09-research';
import { bundle as t01 } from './stats/01-describing';
import { bundle as t02 } from './stats/02-spread';
import { bundle as t03 } from './stats/03-distributions';
import { bundle as t04 } from './stats/04-charts';
import { bundle as t05 } from './stats/05-correlation';
import { bundle as t06 } from './stats/06-sampling';
import { bundle as t07 } from './stats/07-probability';
import { bundle as t08 } from './stats/08-inference';
import { bundle as t09 } from './stats/09-analysis';
import { bundle as t10 } from './stats/10-research';
import { bundle as d10 } from './dataeng/10-analytics';
import { bundle as r01 } from './r/01-console';
import { bundle as r02 } from './r/02-vectors';
import { bundle as r03 } from './r/03-functions';
import { bundle as r04 } from './r/04-dataframes';
import { bundle as r05 } from './r/05-manipulation';
import { bundle as r06 } from './r/06-analysis';

const base: LessonBundle[] = [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10, l11, l12, l13, l14, l15, l16, p29, l17, p30, p31, l18, l19, p32, l20, l21, p33, l22, p34, l23, l24, l25, l26, p27, p28, s01, s02, s03, s04, s05, s06, s07, s08, s16, s09, s10, s17, s18, s11, s19, s12, s13, s20, s14, s15, d01, d02, d04, d05, d06, d07, d08, d09, d03, w01, w02, w03, w04, w05, w06, w07, w08, w09, w10, w11, w29, w12, w13, w14, w15, w16, w17, w27, w28, w18, w19, w30, w20, w21, w22, w31, w23, w24, w25, w26, g01, g02, g03, g04, g05, g06, x01, x02, x03, x04, x05, x06, x07, x08, x09, t01, t02, t03, t04, t05, t06, t07, t08, t09, r01, r02, r03, r04, r05, r06, t10, d10];

/** Phase 3 variants are authored separately (data) and attached to the lesson that teaches their objective. */
export const bundles: LessonBundle[] = base.map((b) => (phase3Variants[b.lesson.id] ? { ...b, challenges: [...b.challenges, ...phase3Variants[b.lesson.id]!] } : b));

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
let variantIndex: Map<string, Challenge[]> | null = null;
/** Every variant of an objective, in authoring order (indexed once: content is static and this is called in loops over hundreds of objectives). */
export const variantsOf = (objectiveId: string): Challenge[] => {
  if (!variantIndex) {
    variantIndex = new Map();
    for (const c of challenges) { const k = objectiveOf(c); const list = variantIndex.get(k); if (list) list.push(c); else variantIndex.set(k, [c]); }
  }
  return variantIndex.get(objectiveId) ?? [];
};

const lessonById = new Map(lessons.map((l) => [l.id, l]));
const challengeById = new Map(challenges.map((c) => [c.id, c]));
const skillById = new Map(skills.map((s) => [s.id, s]));

export const getLesson = (id: string): Lesson | undefined => lessonById.get(id);
export const getChallenge = (id: string): Challenge | undefined => challengeById.get(id);
import { bossChallenges } from './boss';
import { trainingProblems } from './training/problems';
import { attachWorldEffects } from './worldEffects';
attachWorldEffects(lessons, challenges, bossChallenges);
const dailyById = new Map([...dailyChallenges, ...bossChallenges, ...trainingProblems].map((c) => [c.id, c]));
/** A lesson/practice challenge OR a Daily Challenge (evidence and the daily screen need both). */
export const getAnyChallenge = (id: string): Challenge | undefined => challengeById.get(id) ?? dailyById.get(id);
export const getSkill = (id: string): Skill | undefined => skillById.get(id);

/** The lesson whose steps use this challenge OR another variant of its objective (undefined for dailies/bosses). */
const ownerCache = new Map<string, Lesson | undefined>();
export function lessonOfChallenge(challengeId: string): Lesson | undefined {
  if (ownerCache.has(challengeId)) return ownerCache.get(challengeId);
  const c = challenges.find((x) => x.id === challengeId);
  let found: Lesson | undefined;
  if (c) {
    const o = objectiveOf(c);
    found = lessons.find((l) => l.steps.some((st) => st.kind === 'challenge' && (() => { const sc = challenges.find((x) => x.id === st.challengeId); return !!sc && objectiveOf(sc) === o; })()));
  }
  ownerCache.set(challengeId, found);
  return found;
}
