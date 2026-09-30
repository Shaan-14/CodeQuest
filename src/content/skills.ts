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
  S('py.text', 'Text processing & parsing', 'Python', ['py.strings', 'py.lists'], req(2, 2, 3, 2, 2)),
  // ---- Programming (concepts that transfer to every language)
  S('py.logic', 'Booleans & comparisons', 'Programming', ['py.numbers'], req(2, 2, 2, 2, 2)),
  S('py.conditionals', 'Decisions (if / elif / else)', 'Programming', ['py.logic', 'py.input'], req(3, 3, 2, 3, 2)),
  S('py.loops', 'Loops (while / for / range)', 'Programming', ['py.conditionals'], req(3, 3, 2, 3, 2)),
  S('py.functions', 'Functions', 'Programming', ['py.conditionals'], req(3, 3, 3, 3, 3)),
  // ---- Data structures
  S('py.lists', 'Lists', 'Data Structures', ['py.loops'], req(3, 3, 2, 3, 3)),
  S('py.dicts', 'Dictionaries, tuples & sets', 'Data Structures', ['py.lists'], req(3, 3, 3, 3, 3)),
  S('py.records', 'Records: filter, sort, summarise', 'Data Structures', ['py.dicts'], req(3, 3, 3, 3, 3)),
  S('py.nested', 'Nested data & JSON structures', 'Data Structures', ['py.records'], req(2, 2, 3, 1, 2)),
  S('py.algorithms', 'Searching, sorting & efficiency', 'Data Structures', ['py.records'], req(2, 2, 3, 1, 2)),
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
  S('de.analytics', 'Analysing data that lives in a database', 'Data Engineering', ['de.integration', 'stat.descriptive', 'stat.spread'], req(2, 2, 3, 2, 2)),
  S('de.quality', 'Validating data & measuring quality', 'Data Engineering', ['de.cleaning'], req(2, 2, 3, 2, 2)),
  S('de.observability', 'Logging, monitoring & failing safely', 'Data Engineering', ['de.pipelines'], req(2, 2, 3, 2, 2)),
  S('de.incremental', 'Incremental processing & reporting', 'Data Engineering', ['de.pipelines', 'de.integration'], req(2, 2, 3, 2, 2)),
  // ---- SQL
  S('sql.select', 'Selecting, filtering & sorting', 'SQL', [], req(3, 3, 2, 3, 3)),
  S('sql.aggregate', 'Aggregation & grouping', 'SQL', ['sql.select'], req(3, 3, 3, 3, 3)),
  S('sql.joins', 'Joining tables', 'SQL', ['sql.aggregate'], req(3, 3, 3, 3, 3)),
  S('sql.advanced', 'CASE, subqueries, CTEs & windows', 'SQL', ['sql.joins'], req(3, 3, 3, 3, 3)),
  S('sql.text', 'Dates & text functions', 'SQL', ['sql.select'], req(2, 2, 3, 1, 2)),
  S('sql.debug', 'Debugging queries', 'SQL', ['sql.joins'], req(2, 2, 3, 2, 2)),
  S('sql.analysis', 'Rates, shares & change over time', 'SQL', ['sql.advanced'], req(2, 2, 3, 2, 2)),
  S('sql.sets', 'Self-joins & set operations', 'SQL', ['sql.joins'], req(2, 2, 3, 2, 2)),
  S('sql.modify', 'Changing data safely', 'SQL', ['sql.select'], req(2, 2, 2, 2, 2)),
  // ---- Databases
  S('db.design', 'Designing schemas', 'Databases', ['sql.joins'], req(2, 2, 3, 2, 2)),
  S('db.integrity', 'Constraints, integrity & transactions', 'Databases', ['db.design'], req(2, 2, 3, 2, 2)),
  S('db.performance', 'Indexes & query performance', 'Databases', ['db.design'], req(2, 2, 3, 2, 2)),
  // ---- Web (Phase 3)
  S('web.html', 'HTML structure & elements', 'HTML', [], req(3, 3, 2, 3, 3)),
  S('web.semantics', 'Semantic HTML & accessibility', 'HTML', ['web.html'], req(3, 3, 3, 3, 3)),
  S('web.forms', 'Forms & validation attributes', 'HTML', ['web.html'], req(3, 3, 3, 3, 3)),
  S('web.css', 'CSS: selectors, cascade & styling', 'CSS', ['web.html'], req(3, 3, 3, 3, 3)),
  S('web.position', 'CSS positioning & stacking', 'CSS', ['web.css'], req(2, 2, 3, 2, 2)),
  S('web.layout', 'CSS layout: box model, flexbox, grid, responsive', 'CSS', ['web.css'], req(3, 3, 3, 3, 3)),
  S('js.basics', 'JavaScript fundamentals', 'JavaScript', [], req(3, 3, 2, 3, 3)),
  S('js.data', 'Arrays, objects & higher-order functions', 'JavaScript', ['js.basics'], req(3, 3, 3, 3, 3)),
  S('js.closures', 'Scope & closures', 'JavaScript', ['js.basics'], req(2, 2, 3, 1, 2)),
  S('js.testing', 'Testing JavaScript', 'JavaScript', ['js.basics'], req(2, 2, 3, 1, 2)),
  S('js.dom', 'The DOM & events', 'JavaScript', ['js.basics', 'web.html'], req(3, 3, 3, 3, 3)),
  S('js.state', 'Rendering from state', 'JavaScript', ['js.dom'], req(2, 2, 3, 1, 2)),
  S('js.forms', 'Forms, validation & browser state', 'JavaScript', ['js.dom', 'web.forms'], req(3, 3, 3, 3, 3)),
  S('js.async', 'Async JavaScript: timers, promises & async/await', 'JavaScript', ['js.dom'], req(3, 3, 3, 3, 3)),
  S('web.http', 'HTTP, JSON & APIs (fetch)', 'Web & APIs', ['js.async'], req(3, 3, 3, 3, 3)),
  S('web.apps', 'Building complete web applications', 'Web & APIs', ['js.forms', 'web.http', 'web.layout'], req(2, 2, 4, 2, 2)),
  S('web.debugging', 'Debugging in the browser', 'Web & APIs', ['js.basics'], req(2, 2, 3, 2, 2)),
  // ---- Git & professional workflow (Phase 5)
  S('git.basics', 'Repositories, commits & status', 'Git', [], req(2, 2, 1, 2, 2)),
  S('git.history', 'Reading and undoing history', 'Git', ['git.basics'], req(2, 2, 2, 2, 2)),
  S('git.branches', 'Branches', 'Git', ['git.basics'], req(2, 2, 2, 2, 2)),
  S('git.merging', 'Merging & resolving conflicts', 'Git', ['git.branches'], req(2, 2, 3, 2, 2)),
  S('git.collaboration', 'Remotes, pull requests & review', 'Git', ['git.merging'], req(2, 2, 3, 2, 2)),
  S('git.workflow', 'A professional Git workflow', 'Git', ['git.collaboration', 'git.history'], req(2, 2, 3, 2, 2)),
  // ---- Spreadsheets (Phase 5)
  S('xl.formulas', 'Formulas & cell references', 'Spreadsheets', [], req(3, 3, 2, 3, 3)),
  S('xl.functions', 'Functions for numbers and text', 'Spreadsheets', ['xl.formulas'], req(3, 3, 2, 3, 3)),
  S('xl.logic', 'Decisions with IF, AND, OR', 'Spreadsheets', ['xl.functions'], req(2, 2, 3, 2, 2)),
  S('xl.lookup', 'Lookups: VLOOKUP, INDEX/MATCH, XLOOKUP', 'Spreadsheets', ['xl.logic'], req(2, 2, 3, 2, 2)),
  S('xl.conditional', 'Conditional sums, counts and averages', 'Spreadsheets', ['xl.logic'], req(2, 2, 3, 2, 2)),
  S('xl.cleaning', 'Cleaning text, dates and messy data', 'Spreadsheets', ['xl.functions'], req(2, 2, 3, 2, 2)),
  S('xl.pivot', 'Pivot tables and charts', 'Spreadsheets', ['xl.conditional'], req(2, 2, 3, 2, 2)),
  S('xl.modeling', 'Spreadsheet models and what-if analysis', 'Spreadsheets', ['xl.lookup', 'xl.conditional'], req(2, 2, 3, 2, 2)),
  // ---- Statistics (Phase 5): taught with Python, used everywhere
  S('stat.descriptive', 'Describing data: mean, median, mode', 'Statistics', ['py.lists'], req(3, 3, 2, 3, 3)),
  S('stat.spread', 'Spread: range, variance, standard deviation, quartiles', 'Statistics', ['stat.descriptive'], req(2, 2, 3, 2, 2)),
  S('stat.distributions', 'Distributions: frequencies, bins and shape', 'Statistics', ['stat.descriptive'], req(2, 2, 3, 2, 2)),
  S('stat.visualization', 'Choosing and building honest charts', 'Statistics', ['stat.distributions'], req(2, 2, 3, 2, 2)),
  S('stat.correlation', 'Correlation and relationships', 'Statistics', ['stat.spread'], req(2, 2, 3, 2, 2)),
  S('stat.sampling', 'Sampling, bias and sampling error', 'Statistics', ['stat.spread'], req(2, 2, 3, 2, 2)),
  S('stat.probability', 'Probability and expected value', 'Statistics', ['stat.descriptive'], req(2, 2, 3, 2, 2)),
  S('stat.inference', 'Comparing groups and reading results honestly', 'Statistics', ['stat.sampling', 'stat.probability'], req(2, 2, 3, 2, 2)),
  S('stat.analysis', 'Analysing a real dataset end to end', 'Statistics', ['stat.inference', 'stat.correlation', 'stat.visualization'], req(2, 2, 4, 2, 2)),
  // ---- R (Phase 5)
  S('r.basics', 'R: the console, values and printing', 'R', [], req(2, 2, 1, 2, 2)),
  S('r.vectors', 'R: vectors and vectorised thinking', 'R', ['r.basics'], req(3, 3, 2, 3, 3)),
  S('r.functions', 'R: functions and control flow', 'R', ['r.vectors'], req(3, 3, 3, 3, 3)),
  S('r.dataframes', 'R: data frames', 'R', ['r.vectors'], req(3, 3, 3, 3, 3)),
  S('r.manipulation', 'R: filtering, sorting and transforming data', 'R', ['r.dataframes', 'r.functions'], req(3, 3, 3, 3, 3)),
  S('r.analysis', 'R: summarising and analysing datasets', 'R', ['r.manipulation'], req(2, 2, 4, 2, 2)),
];
