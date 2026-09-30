import type { Skill } from './schema';

const req = (independentPasses: number, distinctChallenges: number, minDifficulty: number, distinctObjectives = 1, distinctContexts = 1) => ({
  independentPasses,
  distinctChallenges,
  minDifficulty,
  distinctObjectives,
  distinctContexts,
});

const S = (id: string, title: string, category: string, prerequisites: string[], masteryRequirements: ReturnType<typeof req>): Skill => ({
  id, title, area: id.split('.')[0]!, category, prerequisites, masteryRequirements,
});

/**
 * Skills the evidence system tracks. `masteryRequirements` says what independent performance counts as
 * "demonstrated" (see learning/mastery.ts): hint-free passes across enough different challenges, learning
 * objectives and real-world contexts. Requirements must be satisfiable by the shipped challenges;
 * content.test.ts checks this. Categories group the Skills screen.
 */
export const skills: Skill[] = [
  // ---- Python (language basics)
  S('py.output', 'Output & first programs', 'Python', [], req(1, 1, 1)),
  S('py.variables', 'Variables & values', 'Python', ['py.output'], req(2, 2, 2, 2, 2)),
  S('py.strings', 'Strings & text', 'Python', ['py.variables'], req(2, 2, 2, 2, 2)),
  S('py.numbers', 'Numbers & arithmetic', 'Python', ['py.variables'], req(3, 3, 2, 3, 2)),
  S('py.input', 'Input & type conversion', 'Python', ['py.numbers', 'py.strings'], req(3, 3, 2, 2, 2)),
  S('py.modules', 'Modules & the standard library', 'Python', ['py.functions'], req(2, 2, 3, 2, 2)),
  // ---- Programming (concepts that transfer to every language)
  S('py.logic', 'Booleans & comparisons', 'Programming', ['py.numbers'], req(2, 2, 2, 2, 2)),
  S('py.conditionals', 'Decisions (if / elif / else)', 'Programming', ['py.logic', 'py.input'], req(3, 3, 2, 3, 2)),
  S('py.loops', 'Loops (while / for / range)', 'Programming', ['py.conditionals'], req(3, 3, 2, 3, 2)),
  S('py.functions', 'Functions', 'Programming', ['py.conditionals'], req(3, 3, 3, 3, 3)),
  // ---- Data structures
  S('py.lists', 'Lists', 'Data Structures', ['py.loops'], req(3, 3, 2, 3, 3)),
  S('py.dicts', 'Dictionaries, tuples & sets', 'Data Structures', ['py.lists'], req(3, 3, 3, 3, 3)),
  S('py.records', 'Records: filter, sort, summarise', 'Data Structures', ['py.dicts'], req(3, 3, 3, 3, 3)),
  // ---- Debugging
  S('py.debugging', 'Reading errors & debugging', 'Debugging', ['py.output'], req(2, 2, 2, 2, 2)),
  S('py.defensive', 'Defensive code: exceptions & edge cases', 'Debugging', ['py.functions'], req(2, 2, 3, 2, 2)),
  // ---- Problem solving
  S('ps.decomposition', 'Breaking problems into parts', 'Problem Solving', ['py.functions'], req(2, 2, 3, 2, 2)),
  S('ps.research', 'Finding tools in documentation', 'Problem Solving', ['py.modules'], req(2, 2, 3, 2, 2)),
  // ---- Testing
  S('test.assertions', 'Assertions & test cases', 'Testing', ['py.functions'], req(1, 1, 2)),
  S('test.writing', 'Writing tests that catch bugs', 'Testing', ['test.assertions'], req(2, 2, 3, 1, 2)),
  // ---- Software design
  S('sd.functions', 'Designing functions', 'Software Design', ['py.functions'], req(3, 3, 3, 3, 3)),
  S('sd.oop', 'Classes & objects', 'Software Design', ['sd.functions'], req(3, 3, 3, 3, 3)),
  // ---- Data engineering
  S('de.files', 'Files, CSV & JSON', 'Data Engineering', ['py.dicts'], req(3, 3, 2, 3, 3)),
  S('de.cleaning', 'Cleaning & validating data', 'Data Engineering', ['de.files', 'py.defensive'], req(2, 2, 3, 2, 2)),
  S('de.pipelines', 'Pipelines: ETL, ELT & reliability', 'Data Engineering', ['de.cleaning', 'db.design'], req(2, 2, 3, 2, 2)),
  S('de.integration', 'Python + SQL together', 'Data Engineering', ['sql.aggregate', 'de.files'], req(2, 2, 3, 2, 2)),
  // ---- SQL
  S('sql.select', 'Selecting, filtering & sorting', 'SQL', [], req(3, 3, 2, 3, 3)),
  S('sql.aggregate', 'Aggregation & grouping', 'SQL', ['sql.select'], req(3, 3, 3, 3, 3)),
  S('sql.joins', 'Joining tables', 'SQL', ['sql.aggregate'], req(3, 3, 3, 3, 3)),
  S('sql.advanced', 'CASE, subqueries, CTEs & windows', 'SQL', ['sql.joins'], req(3, 3, 3, 3, 3)),
  S('sql.modify', 'Changing data safely', 'SQL', ['sql.select'], req(2, 2, 2, 2, 2)),
  // ---- Databases
  S('db.design', 'Designing schemas', 'Databases', ['sql.joins'], req(2, 2, 3, 2, 2)),
  S('db.integrity', 'Constraints, integrity & transactions', 'Databases', ['db.design'], req(2, 2, 3, 2, 2)),
  S('db.performance', 'Indexes & query performance', 'Databases', ['db.design'], req(2, 2, 3, 2, 2)),
  // ---- Web (Phase 3)
  S('web.html', 'HTML structure & elements', 'HTML', ['py.output'], req(3, 3, 2, 3, 3)),
  S('web.semantics', 'Semantic HTML & accessibility', 'HTML', ['web.html'], req(3, 3, 3, 3, 3)),
  S('web.forms', 'Forms & validation attributes', 'HTML', ['web.html'], req(3, 3, 3, 3, 3)),
  S('web.css', 'CSS: selectors, cascade & styling', 'CSS', ['web.html'], req(3, 3, 3, 3, 3)),
  S('web.layout', 'CSS layout: box model, flexbox, grid, responsive', 'CSS', ['web.css'], req(3, 3, 3, 3, 3)),
  S('js.basics', 'JavaScript fundamentals', 'JavaScript', ['py.functions'], req(3, 3, 2, 3, 3)),
  S('js.data', 'Arrays, objects & higher-order functions', 'JavaScript', ['js.basics'], req(3, 3, 3, 3, 3)),
  S('js.dom', 'The DOM & events', 'JavaScript', ['js.basics', 'web.html'], req(3, 3, 3, 3, 3)),
  S('js.forms', 'Forms, validation & browser state', 'JavaScript', ['js.dom', 'web.forms'], req(3, 3, 3, 3, 3)),
  S('js.async', 'Async JavaScript: timers, promises & async/await', 'JavaScript', ['js.dom'], req(3, 3, 3, 3, 3)),
  S('web.http', 'HTTP, JSON & APIs (fetch)', 'Web & APIs', ['js.async'], req(3, 3, 3, 3, 3)),
  S('web.apps', 'Building complete web applications', 'Web & APIs', ['js.forms', 'web.http', 'web.layout'], req(2, 2, 4, 2, 2)),
  S('web.debugging', 'Debugging in the browser', 'Web & APIs', ['js.basics'], req(2, 2, 3, 2, 2)),
];
