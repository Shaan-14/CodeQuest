/**
 * COMPOSITE COMPETENCIES: skills that only exist in combination. A player can be solid on `py.loops` and on
 * `py.dicts` and still stumble on "loop over a dictionary". Composite evidence is derived, never stored: any
 * evidence record whose challenge exercised ALL of a composite's skills counts towards it (see
 * game/composites.ts). Add a composite here when a combination deserves its own training; the diagnosis engine
 * also invents an ad-hoc key (`a+b`) for combinations that have no entry.
 */
export interface Composite {
  id: string;
  title: string;
  /** Skills that must all be exercised by a challenge for it to count. Order is irrelevant. */
  skillIds: string[];
  /** One line for the player: what applying the combination means. */
  blurb: string;
}

const C = (id: string, title: string, skillIds: string[], blurb: string): Composite => ({ id, title, skillIds, blurb });

export const composites: Composite[] = [
  C('loops+lists', 'Loops over lists', ['py.loops', 'py.lists'], 'Visiting, filtering and building lists with loops.'),
  C('loops+dicts', 'Loops over dictionaries', ['py.loops', 'py.dicts'], 'Iterating keys, values and items; counting and grouping with a dictionary.'),
  C('loops+conditionals', 'Loops with decisions', ['py.loops', 'py.conditionals'], 'Deciding inside a loop: filters, counters, early exits.'),
  C('functions+dicts', 'Functions that use dictionaries', ['py.functions', 'py.dicts'], 'Passing dictionaries in and out of functions; lookups and defaults.'),
  C('functions+lists', 'Functions that use lists', ['py.functions', 'py.lists'], 'Functions that take, transform and return lists without surprises.'),
  C('files+dicts', 'Files into dictionaries', ['de.files', 'py.dicts'], 'Reading a file and organising it into a lookup structure.'),
  C('csv+loops+filtering', 'CSV, loops and filtering', ['de.files', 'py.loops', 'py.records'], 'Reading rows, filtering them and summarising the result.'),
  C('records+cleaning', 'Records that need cleaning', ['py.records', 'de.cleaning'], 'Summarising data that is not clean yet.'),
  C('defensive+files', 'Defensive file handling', ['py.defensive', 'de.files'], 'Missing files, malformed rows and empty input.'),
  C('strings+loops', 'Text and loops', ['py.strings', 'py.loops'], 'Walking through text and building strings.'),
  C('sql+python', 'SQL with Python', ['de.integration', 'sql.select'], 'Running queries from Python and using the results.'),
  C('sql+aggregate+windows', 'Aggregation with windows', ['sql.aggregate', 'sql.advanced'], 'Groups, ranks and running totals in one query.'),
  C('sql+joins+aggregate', 'Joins with aggregation', ['sql.joins', 'sql.aggregate'], 'Summarising across related tables.'),
  C('html+css+responsive', 'HTML, CSS and responsive design', ['web.html', 'web.css', 'web.layout'], 'Pages whose structure, style and layout adapt to the screen.'),
  C('js+dom', 'JavaScript and the DOM', ['js.basics', 'js.dom'], 'Reading and changing the page from code.'),
  C('dom+forms', 'Forms with JavaScript', ['js.dom', 'js.forms'], 'Validating input and showing the result on the page.'),
  C('async+apis', 'Async JavaScript with APIs', ['js.async', 'web.http'], 'Waiting for servers without freezing the page.'),
  C('api+json+errors', 'APIs, JSON and error handling', ['web.http', 'js.data', 'js.basics'], 'Requests, parsing, and failure paths.'),
  C('web+storage+state', 'State that survives a reload', ['js.forms', 'js.dom'], 'Keeping page state in storage and restoring it defensively.'),
  C('tests+functions', 'Testing your functions', ['test.writing', 'sd.functions'], 'Writing tests that pin down a function’s behaviour.'),
];

export const getComposite = (id: string): Composite | undefined => composites.find((c) => c.id === id);
