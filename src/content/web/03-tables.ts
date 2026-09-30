import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

/**
 * Checks for an accessible data table: caption, column headers (th scope=col) in thead, row headers (th scope=row)
 * for the first cell of each body row, the exact values, and an optional footer row.
 */
const tableChecks = (caption: string, cols: string[], rows: string[][], foot?: string[], rowHeaders = true) => [
  web('A table with a caption', `h.eq(h.$$('table').length, 1, 'One table'); const c = h.$('table > caption'); h.assert(c, 'A caption tells everyone what the table is.'); h.eq(h.norm(c.textContent), ${JSON.stringify(caption)}, 'The caption');`),
  web('Column headers are real headers', `const ths = h.$$('table > thead > tr > th'); h.eq(ths.map((t) => h.norm(t.textContent)), ${JSON.stringify(cols)}, 'Column headings'); ths.forEach((t) => h.eq(t.getAttribute('scope'), 'col', 'Column headers need scope="col"'));`, { feedback: 'Header cells go in the thead row and say which direction they head.' }),
  web('The rows and cells', `const rows = h.$$('table > tbody > tr'); h.eq(rows.length, ${rows.length}, 'Body rows'); const want = ${JSON.stringify(rows)}; rows.forEach((r, i) => { h.eq(Array.from(r.children).map((c) => h.norm(c.textContent)), want[i], 'Row ' + (i + 1)); });`),
  web('Row headers', rowHeaders ? `h.$$('table > tbody > tr').forEach((r, i) => { const first = r.children[0]; h.eq(first.tagName, 'TH', 'The first cell of row ' + (i + 1) + ' identifies the row: make it a th'); h.eq(first.getAttribute('scope'), 'row', 'Row headers need scope="row"'); Array.from(r.children).slice(1).forEach((c) => h.eq(c.tagName, 'TD', 'Data cells are td')); });` : `h.$$('table > tbody > tr').forEach((r) => Array.from(r.children).forEach((c) => h.eq(c.tagName, 'TD', 'Data cells are td')));`, { visible: false }),
  ...(foot ? [web('The totals row is a footer', `const f = h.$('table > tfoot > tr'); h.assert(f, 'Put the totals row in a tfoot.'); h.eq(Array.from(f.children).map((c) => h.norm(c.textContent)), ${JSON.stringify(foot)}, 'The footer row');`, { visible: false })] : []),
];

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-03-tables', title: 'Tables for Real Data', language: 'web', skillId: 'web.html',
    blurb: 'Data tables: caption, header cells, scope, and why layout tables are a mistake.', prerequisites: ['web-02-links-lists'], xpReward: 45,
    reference: {
      title: 'HTML tables',
      body: text(
        'Use a **table** for data that has rows AND columns (not for laying out a page). Structure: `<table>` → `<caption>` (what it shows) → `<thead>` (a `<tr>` of `<th scope="col">` column headers) → `<tbody>` (rows of `<tr>`, each cell a `<td>`; the first cell may be `<th scope="row">`) → optional `<tfoot>` (totals).',
        '`scope` tells assistive technology which cells a header describes, so a screen reader can say “Owls, Won: 8” instead of just “8”.',
      ),
      example: '<table>\n  <caption>Downtime this week</caption>\n  <thead><tr><th scope="col">Machine</th><th scope="col">Hours</th></tr></thead>\n  <tbody><tr><th scope="row">Press 1</th><td>4.5</td></tr></tbody>\n</table>',
    },
    steps: [
      { kind: 'teach', title: 'When to use a table', body: text('A table is for **tabular data**: a value that only makes sense when you know its row *and* its column. A machine’s downtime, a team’s wins, a month’s budget. It is **not** for arranging a page (CSS does that).', 'A good table has four things: a **caption** saying what it is, **header cells** (`th`) for columns and rows, **data cells** (`td`), and a sensible grouping into head, body and (when needed) foot.') },
      webDemo({
        title: 'A small data table',
        body: text('Run it. Then add a fourth machine as a new row. Try changing a `th` to a `td` and think about what a screen-reader user would lose.'),
        files: files('<table border="1">\n  <caption>Downtime this week</caption>\n  <thead>\n    <tr><th scope="col">Machine</th><th scope="col">Hours</th></tr>\n  </thead>\n  <tbody>\n    <tr><th scope="row">Press 1</th><td>4.5</td></tr>\n    <tr><th scope="row">Lathe</th><td>12</td></tr>\n  </tbody>\n</table>\n'),
        notice: 'The `border="1"` is only so you can see the cells here; styling belongs in CSS. What matters is the structure: caption, header cells with `scope`, and data cells.',
      }),
      { kind: 'challenge', challengeId: 'web-03-downtime-table' },
      { kind: 'challenge', challengeId: 'web-03-standings-table' },
    ],
  },
  objectives: [{ id: 'web-obj-data-table', title: 'Mark up data as an accessible table', summary: 'Caption, thead/tbody(/tfoot), th with scope, and td for data.' }],
  challenges: [
    wc({
      id: 'web-03-downtime-table', title: 'The Downtime Table', mode: 'learning', skillIds: ['web.html', 'web.semantics'], concepts: ['table', 'caption', 'th scope', 'thead/tbody'], difficulty: 2, context: 'manufacturing',
      prompt: text('Show this week’s machine downtime as a table with the caption `Downtime this week`. Columns: `Machine`, `Hours`, `Status`. Rows: `Press 1`, 4.5, running · `Lathe`, 12, down · `Welder`, 0, idle. The machine name identifies each row.'),
      expectedBehavior: 'A captioned table with a header row, three body rows, and header cells with scope.',
      guidedSteps: ['`<table>` with a `<caption>`.', 'A `<thead>` holding one row of `<th scope="col">`.', 'A `<tbody>` with three `<tr>` rows: `<th scope="row">` then two `<td>`.'],
      starterFiles: files(''), tabs: ['html'],
      hints: ['Header cells and data cells are different elements.', 'Both column headers and row headers need to say which direction they head.', '`th scope="col"` in the head row; `th scope="row"` then `td` cells in each body row.'],
      checks: tableChecks('Downtime this week', ['Machine', 'Hours', 'Status'], [['Press 1', '4.5', 'running'], ['Lathe', '12', 'down'], ['Welder', '0', 'idle']]),
      xpReward: 50, coinReward: 7,
    }),
    wc({
      id: 'web-03-standings-table', objectiveId: 'web-obj-data-table', title: 'League Standings', mode: 'challenge', skillIds: ['web.html', 'web.semantics'], concepts: ['table', 'caption', 'th scope', 'thead/tbody'], difficulty: 3, context: 'sports',
      prompt: text('Publish the league standings as a table with the caption `League standings`. Columns: `Team`, `Played`, `Won`, `Points`. Rows: Owls 10, 8, 24 · Bears 10, 6, 18 · Cats 10, 3, 9. The team identifies each row.'),
      expectedBehavior: 'A captioned, accessible table with three team rows.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['What makes a table accessible is not how it looks but how it is marked up.', 'Think about which cells are headings and which direction each heads.', 'Column headers live in a head row; the team name in each row is also a header.'],
      checks: tableChecks('League standings', ['Team', 'Played', 'Won', 'Points'], [['Owls', '10', '8', '24'], ['Bears', '10', '6', '18'], ['Cats', '10', '3', '9']]),
      xpReward: 75, coinReward: 10,
    }),
    wc({
      id: 'web-03-budget-table', objectiveId: 'web-obj-data-table', title: 'Quarterly Budget', mode: 'challenge', skillIds: ['web.html', 'web.semantics'], concepts: ['table', 'caption', 'th scope', 'thead/tbody'], difficulty: 3, context: 'finance',
      prompt: text('Show the Q1 budget as a table with the caption `Q1 budget`. Columns: `Item`, `Planned`, `Actual`. Rows: Salaries 5000, 5200 · Equipment 1200, 900 · Travel 800, 950. After the rows add a totals row (`Total`, 7000, 7050) that is marked as the foot of the table. The item identifies each row.'),
      expectedBehavior: 'A captioned table with three item rows and a separate totals row.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['A table has more than a head and a body.', 'Totals belong to a different group than ordinary rows.', 'Use a `tfoot` after the `tbody`; its label cell can be a `th`.'],
      checks: tableChecks('Q1 budget', ['Item', 'Planned', 'Actual'], [['Salaries', '5000', '5200'], ['Equipment', '1200', '900'], ['Travel', '800', '950']], ['Total', '7000', '7050']),
      xpReward: 75, coinReward: 10,
    }),
    wc({
      id: 'web-03-readings-table', objectiveId: 'web-obj-data-table', title: 'Sensor Readings', mode: 'challenge', skillIds: ['web.html', 'web.semantics'], concepts: ['table', 'caption', 'th scope', 'thead/tbody'], difficulty: 3, context: 'science',
      prompt: text('A lab publishes its readings as a table with the caption `Sensor readings`. Columns: `Sensor`, `Unit`, `Value`, `Taken`. Rows: S1, °C, 21.5, 08:00 · S2, °C, 19.0, 08:05 · S3, kPa, 101.3, 08:10 · S4, kPa, 99.8, 08:15. The sensor name identifies each row.'),
      expectedBehavior: 'A captioned, accessible table with four sensor rows.',
      starterFiles: files(''), tabs: ['html'],
      hints: ['Start from the structure, then fill in the values.', 'Header cells need a direction; data cells are plain.', 'A caption, a head row of column headers, and body rows that begin with a row header.'],
      checks: tableChecks('Sensor readings', ['Sensor', 'Unit', 'Value', 'Taken'], [['S1', '°C', '21.5', '08:00'], ['S2', '°C', '19.0', '08:05'], ['S3', 'kPa', '101.3', '08:10'], ['S4', 'kPa', '99.8', '08:15']]),
      xpReward: 75, coinReward: 10,
    }),
  ],
};
