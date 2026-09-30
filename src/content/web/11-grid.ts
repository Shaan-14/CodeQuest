import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

const near = (a: string, b: string, why: string) => `h.assert(Math.abs((${a}) - (${b})) <= 1.5, ${JSON.stringify(why)} + ' (got ' + Math.round((${a}) * 10) / 10 + ')');`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-11-grid', title: 'CSS Grid: Two-Dimensional Layout', language: 'web', skillId: 'web.layout',
    blurb: 'Rows and columns together: tracks, fr units, gap, areas, spanning and auto-fill.', prerequisites: ['web-10-flexbox'], xpReward: 55,
    reference: {
      title: 'CSS Grid',
      body: text(
        '`display: grid` makes a **grid container**. Define columns with `grid-template-columns` (`repeat(3, 1fr)`, `200px 1fr`, `repeat(auto-fill, minmax(140px, 1fr))`) and optionally rows with `grid-template-rows`. `fr` shares the free space in proportion; `gap` sets row and column spacing.',
        'Place items automatically (they fill cells in order) or explicitly: `grid-column: 1 / -1` spans all columns, `grid-column: span 2`; or name regions: `grid-template-areas: "header header" "side main"` with `grid-area: header` on items. Use **flexbox for one dimension** (a row of buttons), **grid for two** (a page or dashboard).',
      ),
      example: '.dash { display: grid; grid-template-columns: 200px 1fr; gap: 12px; }\n.dash header { grid-column: 1 / -1; }',
    },
    steps: [
      { kind: 'teach', title: 'Flex for lines, grid for layouts', body: text('Flexbox lays items out along **one** line. A dashboard or a page needs rows **and** columns lined up together: a header across the top, a narrow sidebar, a wide main area. That is **grid**.', 'With grid you describe the *tracks* (columns and rows) once, and place items into them. Widths written as `fr` (fraction of the free space) make layouts that adapt to any screen without arithmetic.') },
      webDemo({
        title: 'A three-column grid',
        body: text('Run it. Change `repeat(3, 1fr)` to `1fr 2fr 1fr`, then make the first box span two columns with `grid-column: span 2`.'),
        files: files('<div class="grid"><div>1</div><div>2</div><div>3</div><div>4</div><div>5</div></div>\n', '.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }\n.grid div { background: #9bd; padding: 12px; text-align: center; }\n'),
        notice: 'Items fill the cells in order and start a new row automatically. `1fr` means “one share of the free space”, so the columns stay equal whatever the width.',
      }),
      { kind: 'challenge', challengeId: 'web-11-stat-grid' },
      { kind: 'challenge', challengeId: 'web-11-dashboard-layout' },
    ],
  },
  objectives: [{ id: 'web-obj-grid', title: 'Lay out a page or dashboard with CSS Grid', summary: 'Tracks, fr, gap, spanning and template areas, verified by measuring cell positions.' }],
  challenges: [
    wc({
      id: 'web-11-stat-grid', title: 'The Statistics Grid', mode: 'learning', skillIds: ['web.layout'], concepts: ['grid', 'fr units', 'gap', 'spanning'], difficulty: 2, context: 'data analysis',
      prompt: text('Lay out the six statistic boxes in `.stats` as a grid of **3 equal columns** with 12px between all cells (rows and columns). The box with the class `wide` must span **two** columns.'),
      expectedBehavior: 'Three equal columns, 12px gaps, and the wide box across two columns.',
      guidedSteps: ['`display: grid;` on `.stats`.', '`grid-template-columns: repeat(3, 1fr);`', '`gap: 12px;`', '`grid-column: span 2;` on `.wide`.'],
      starterFiles: files('<div class="stats">\n  <div class="box">Output</div>\n  <div class="box wide">Quality</div>\n  <div class="box">Defects</div>\n  <div class="box">Uptime</div>\n  <div class="box">Energy</div>\n  <div class="box">Scrap</div>\n</div>\n', '.stats { width: 600px; }\n.box { background: #dde; padding: 8px; }\n'), tabs: ['css'],
      hints: ['Which element becomes the grid container?', 'The columns are defined on the container; spanning is defined on the item.', '`repeat(3, 1fr)` for equal columns; `span 2` for the wide box.'],
      checks: [
        web('A grid of three equal columns', `const c = h.rect('.stats'); const b = h.$$('.box').map((x) => x.getBoundingClientRect()); const w = (600 - 2 * 12) / 3; ${near('b[0].width', 'w', 'Each column is a third of the space left after the gaps')}; ${near('b[2].width', 'w', 'Each column is a third of the space left after the gaps')}; h.eq(h.style('.stats', 'display'), 'grid');`),
        web('Gaps', `const b = h.$$('.box').map((x) => x.getBoundingClientRect()); ${near('b[1].left - b[0].right', '12', 'The column gap is 12px')}; ${near('b[3].top - b[0].bottom', '12', 'The row gap is 12px')};`),
        web('The wide box', `const b = h.$$('.box').map((x) => x.getBoundingClientRect()); ${near('b[1].width', '(600 - 2 * 12) / 3 * 2 + 12', 'The wide box spans two columns and the gap between them')};`, { visible: false }),
      ],
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-11-dashboard-layout', objectiveId: 'web-obj-grid', title: 'Control Room Layout', mode: 'challenge', skillIds: ['web.layout'], concepts: ['grid', 'fr units', 'gap', 'spanning'], difficulty: 3, context: 'engineering',
      prompt: text('Lay out the control-room page (`.page`, 800px wide) as a grid: the `header` spans the full width on top; below it a `nav` sidebar exactly 200px wide and the `main` area taking all the remaining width; the `footer` spans the full width at the bottom. There is 10px of space between all cells. Every region keeps its natural height.'),
      expectedBehavior: 'Header on top, a 200px sidebar beside the main area, and a footer across the bottom, with 10px gaps.',
      starterFiles: files('<div class="page">\n  <header>Header</header>\n  <nav>Menu</nav>\n  <main>Main content</main>\n  <footer>Footer</footer>\n</div>\n', '.page { width: 800px; }\nheader, nav, main, footer { background: #dde; padding: 8px; }\n'), tabs: ['css'],
      hints: ['Two columns, and some regions cross both.', 'One column has a fixed width; the other takes what is left. Items can span.', '`grid-template-columns: 200px 1fr`, `gap`, and `grid-column: 1 / -1` on header and footer (or named areas).'],
      checks: [
        web('Header and footer span the width', "const p = h.rect('.page'); const hd = h.rect('header'); const ft = h.rect('footer'); h.assert(Math.abs(hd.w - p.w) <= 1.5, 'The header spans the whole width.'); h.assert(Math.abs(ft.w - p.w) <= 1.5, 'The footer spans the whole width.'); h.assert(hd.bottom <= h.rect('nav').top, 'The header is above the sidebar.'); h.assert(ft.top >= h.rect('main').bottom, 'The footer is below the main area.');"),
        web('Sidebar and main', `const n = h.rect('nav'); const m = h.rect('main'); const p = h.rect('.page'); ${near('n.w', '200', 'The sidebar is 200px wide')}; ${near('m.w', '800 - 200 - 10', 'The main area takes the rest, minus the 10px gap')}; ${near('m.left - n.right', '10', 'The gap between sidebar and main is 10px')}; ${near('n.top', 'm.top', 'Sidebar and main start on the same row')};`),
        web('Row gaps', `${near('h.rect("nav").top - h.rect("header").bottom', '10', 'The row gap is 10px')}; ${near('h.rect("footer").top - Math.max(h.rect("nav").bottom, h.rect("main").bottom)', '10', 'The gap above the footer is 10px')};`, { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-11-inventory-tiles', objectiveId: 'web-obj-grid', title: 'Inventory Tiles', mode: 'challenge', skillIds: ['web.layout'], concepts: ['grid', 'fr units', 'gap', 'spanning'], difficulty: 3, context: 'retail',
      prompt: text('An inventory page shows tiles in `.tiles`. Make the tiles fill each row: as many columns as fit when each column is **at least 140px** wide, the columns sharing the row equally, with 10px between cells. In a 620px-wide container that gives 4 columns; in 300px, 2 columns.'),
      expectedBehavior: 'Columns adapt to the width: as many 140px-minimum columns as fit, stretching to fill.',
      starterFiles: files('<div class="tiles">\n  <div class="tile">Bolts</div><div class="tile">Nuts</div><div class="tile">Gears</div><div class="tile">Belts</div>\n  <div class="tile">Hoses</div><div class="tile">Valves</div><div class="tile">Gauges</div><div class="tile">Filters</div>\n</div>\n', '.tiles { max-width: 620px; }\n.tile { background: #dde; padding: 12px; }\n'), tabs: ['css'],
      hints: ['The number of columns should not be written down: the browser should work it out.', 'A repeating column definition with a minimum size and a flexible maximum.', '`repeat(auto-fill, minmax(140px, 1fr))`.'],
      checks: [
        web('Four columns in a wide container', `const t = h.$$('.tile').map((x) => x.getBoundingClientRect()); const cols = new Set(t.map((r) => Math.round(r.left))).size; h.eq(cols, 4, 'Number of columns at this width'); t.forEach((r) => h.assert(r.width >= 140 - 1, 'Each column is at least 140px'));`, { viewport: { width: 700 } }),
        web('Two columns in a narrow container', `const t = h.$$('.tile').map((x) => x.getBoundingClientRect()); h.eq(new Set(t.map((r) => Math.round(r.left))).size, 2, 'Number of columns at this width');`, { viewport: { width: 316 } }),
        web('Gaps and full rows', `const t = h.$$('.tile').map((x) => x.getBoundingClientRect()); ${near('t[1].left - t[0].right', '10', 'The gap is 10px')}; ${near('t[4].top - t[0].bottom', '10', 'The row gap is 10px')}; const c = h.rect('.tiles'); ${near('t[3].right', 'c.right', 'The tiles fill the row')};`, { viewport: { width: 700 }, visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-11-game-hud', objectiveId: 'web-obj-grid', title: 'The Game HUD', mode: 'challenge', skillIds: ['web.layout'], concepts: ['grid', 'fr units', 'gap', 'spanning'], difficulty: 3, context: 'games',
      prompt: text('Lay out a game heads-up display (`.hud`, 600px wide) as a grid with two equal columns and 8px between cells: the `.score` panel spans the whole top row; the `.health` and `.ammo` panels sit side by side on the second row; the `.map` panel spans the whole bottom row and is exactly 120px tall.'),
      expectedBehavior: 'Score across the top, health and ammo side by side, and a 120px map across the bottom.',
      starterFiles: files('<div class="hud">\n  <div class="score">Score 1200</div>\n  <div class="health">Health 80</div>\n  <div class="ammo">Ammo 24</div>\n  <div class="map">Map</div>\n</div>\n', '.hud { width: 600px; }\n.hud div { background: #223; color: #fff; padding: 8px; }\n'), tabs: ['css'],
      hints: ['Two columns; two of the panels cross both.', 'Spanning is a property of the item; heights of rows can be set on the container or item.', '`repeat(2, 1fr)`, `grid-column: 1 / -1` on score and map, and `height` on the map.'],
      checks: [
        web('Score spans the top', `const p = h.rect('.hud'); const s = h.rect('.score'); ${near('s.w', 'p.w', 'The score spans both columns')}; h.assert(s.bottom <= h.rect('.health').top, 'Score is above health.');`),
        web('Health and ammo', `const a = h.rect('.health'); const b = h.rect('.ammo'); ${near('a.w', '(600 - 8) / 2', 'Two equal columns with an 8px gap')}; ${near('b.w', '(600 - 8) / 2', 'Two equal columns with an 8px gap')}; ${near('b.left - a.right', '8', 'The gap is 8px')}; ${near('a.top', 'b.top', 'Same row')};`),
        web('The map', `const m = h.rect('.map'); ${near('m.w', '600', 'The map spans both columns')}; ${near('m.h', '120', 'The map is 120px tall')}; ${near('m.top - Math.max(h.rect(".health").bottom, h.rect(".ammo").bottom)', '8', 'The row gap is 8px')};`, { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
  ],
};
