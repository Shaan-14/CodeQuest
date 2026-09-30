import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

const near = (a: string, b: string, why: string) => `h.assert(Math.abs((${a}) - (${b})) <= 1.5, ${JSON.stringify(why)} + ' (got ' + Math.round((${a}) * 10) / 10 + ')');`;
/** No horizontal overflow: the page must not be wider than the viewport. */
const FITS = "h.assert(document.documentElement.scrollWidth <= h.viewport.w + 1, 'The page is wider than the screen: something overflows sideways (' + document.documentElement.scrollWidth + 'px on a ' + h.viewport.w + 'px screen).');";

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-12-responsive', title: 'Responsive Design and Pseudo-classes', language: 'web', skillId: 'web.layout',
    blurb: 'Pages that fit any screen: fluid widths, media queries, and states and generated content with pseudo-classes and pseudo-elements.', prerequisites: ['web-11-grid'], xpReward: 60,
    reference: {
      title: 'Responsive design, pseudo-classes and pseudo-elements',
      body: text(
        '**Responsive** pages adapt to the screen. Tools: fluid sizes (`%`, `fr`, `max-width`, `min()`), `img { max-width: 100%; height: auto; }`, wrapping layouts (`flex-wrap`, `auto-fill` grids), and **media queries**: `@media (max-width: 600px) { ... }` applies rules only when the viewport is at most 600px wide (**mobile-first**: write the small-screen layout first, then `@media (min-width: 700px)` for wider ones). Always include `<meta name="viewport" content="width=device-width, initial-scale=1">` on real pages.',
        '**Pseudo-classes** select an element in a state or position: `:hover`, `:focus`, `:checked`, `:disabled`, `:first-child`, `:nth-child(2n)`, `:not(.x)`. **Pseudo-elements** create or target parts of an element: `::before`/`::after` (with `content: "..."`), `::first-line`, `::placeholder`, `::marker`.',
      ),
      example: '.cards { display: grid; gap: 12px; }\n@media (min-width: 700px) {\n  .cards { grid-template-columns: repeat(3, 1fr); }\n}\n.warning::before { content: "⚠ "; }',
    },
    steps: [
      { kind: 'teach', title: 'One page, many screens', body: text('People will open your page on a phone, a laptop and a huge monitor. Rather than building three pages, you write **one** whose layout responds to the space it has. The main tools are layouts that flex (grid `fr`, `auto-fill`, `flex-wrap`) and **media queries** that change rules at chosen widths.', 'Test at several widths, not just yours. A layout that is fine at 1200px and unusable at 380px is a bug, and horizontal scrolling on a phone is the most common one.') },
      webDemo({
        title: 'A layout that changes at 600px',
        body: text('Run it and note that the cards form a row. In a real browser you would narrow the window: below 600px they stack. (The preview here is a fixed width, so change `max-width: 600px` to `max-width: 2000px` to see the narrow layout.)'),
        files: files('<div class="cards"><div>One</div><div>Two</div><div>Three</div></div>\n', '.cards { display: flex; gap: 8px; }\n.cards div { flex: 1; background: #9bd; padding: 16px; }\n@media (max-width: 600px) {\n  .cards { flex-direction: column; }\n}\n'),
        notice: 'A media query does not create a new page: it switches a group of rules on when its condition is true. Everything outside it is the base layout.',
      }),
      { kind: 'challenge', challengeId: 'web-12-responsive-cards' },
      { kind: 'challenge', challengeId: 'web-12-mobile-inventory' },
      { kind: 'challenge', challengeId: 'web-12-pseudo-warnings' },
    ],
  },
  objectives: [
    { id: 'web-obj-responsive', title: 'Make a layout respond to screen width', summary: 'Fluid widths and media queries, checked at wide and narrow viewports with no sideways overflow.' },
    { id: 'web-obj-pseudo', title: 'Use pseudo-classes and pseudo-elements', summary: 'Style states and positions, and add generated content with ::before/::after.' },
  ],
  challenges: [
    wc({
      id: 'web-12-responsive-cards', title: 'Cards that Stack', mode: 'learning', skillIds: ['web.layout'], concepts: ['media queries', 'responsive', 'grid', 'fluid layout'], difficulty: 2, context: 'business',
      prompt: text('The `.cards` container must show its three cards **side by side in three equal columns with 12px gaps on screens 700px wide or more**, and **stacked in one column on narrower screens**. The page must never scroll sideways.'),
      expectedBehavior: 'Three columns on wide screens, one column on narrow ones, no horizontal scroll.',
      guidedSteps: ['Write the narrow layout first: a grid with one column and a 12px gap.', 'Add `@media (min-width: 700px) { ... }` that changes the columns to three equal ones.'],
      starterFiles: files('<div class="cards">\n  <div class="card">Machines</div>\n  <div class="card">Alerts</div>\n  <div class="card">Reports</div>\n</div>\n', '.card { background: #dde; padding: 16px; }\n'), tabs: ['css'],
      hints: ['Which layout is the default, and which one needs a condition?', 'A media query wraps rules that apply only above or below a width.', '`display: grid; gap: 12px;` for all; `@media (min-width: 700px) { .cards { grid-template-columns: repeat(3, 1fr); } }`.'],
      checks: [
        web('Three columns on a wide screen', `const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.assert(c.every((r) => Math.abs(r.top - c[0].top) < 2), 'On a wide screen the cards sit in one row.'); ${near('c[1].left - c[0].right', '12', 'The gap is 12px')}; ${near('c[0].width', 'c[1].width', 'Equal columns')}; ${FITS}`, { viewport: { width: 900 } }),
        web('One column on a narrow screen', `const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.assert(c[1].top > c[0].bottom - 1 && c[2].top > c[1].bottom - 1, 'On a narrow screen the cards stack.'); ${near('c[1].top - c[0].bottom', '12', 'The gap is 12px')}; ${near('c[0].width', 'c[2].width', 'Same width')}; ${FITS}`, { viewport: { width: 400 } }),
        web('The breakpoint is 700px', `const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.assert(c.every((r) => Math.abs(r.top - c[0].top) < 2), 'At exactly 700px the cards are in a row.');`, { viewport: { width: 700 }, visible: false }),
        web('Just below the breakpoint', "const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.assert(c[1].top > c[0].bottom - 1, 'At 699px the cards stack.');", { viewport: { width: 699 }, visible: false }),
      ],
      xpReward: 60, coinReward: 9,
    }),
    wc({
      id: 'web-12-mobile-inventory', objectiveId: 'web-obj-responsive', title: 'Mobile Inventory List', mode: 'challenge', skillIds: ['web.layout'], concepts: ['media queries', 'responsive', 'fluid layout', 'layout'], difficulty: 3, context: 'retail',
      prompt: text('An inventory item (`.item`) shows a picture box (`.pic`, 80x80) beside its text (`.info`). On screens **at least 600px wide** the picture sits on the left with 16px between it and the text, which takes the remaining width. On **narrower** screens the picture sits **above** the text (stacked, with the text using the full width). The picture box must never shrink, and the page must not scroll sideways.'),
      expectedBehavior: 'Side by side when wide, stacked when narrow; the picture stays 80x80.',
      starterFiles: files('<div class="item">\n  <div class="pic">img</div>\n  <div class="info"><h3>Safety gloves</h3><p>Stock: 120 pairs, aisle 4, shelf C. Reorder when below 40.</p></div>\n</div>\n', '.item { border: 1px solid #ccc; padding: 8px; }\n.pic { width: 80px; height: 80px; background: #99a; }\n'), tabs: ['css'],
      hints: ['One layout is the default, the other appears above a width.', 'A picture that should not shrink needs a flex setting; direction is what changes.', '`display: flex; gap: 16px; flex-direction: column` by default, `row` inside a `min-width: 600px` query; `flex: none` on the picture.'],
      checks: [
        web('Wide: picture left of the text', `const p = h.rect('.pic'); const i = h.rect('.info'); h.assert(i.left >= p.right - 1, 'The text is beside the picture.'); ${near('i.left - p.right', '16', 'The gap is 16px')}; ${near('p.w', '80', 'The picture stays 80 wide')}; ${near('p.h', '80', 'The picture stays 80 tall')}; ${FITS}`, { viewport: { width: 800 } }),
        web('Narrow: picture above the text', `const p = h.rect('.pic'); const i = h.rect('.info'); h.assert(i.top >= p.bottom - 1, 'The text is below the picture.'); ${near('p.w', '80', 'The picture stays 80 wide')}; const it = h.rect('.item'); h.assert(i.w >= it.w - 24, 'The text uses the full width.'); ${FITS}`, { viewport: { width: 400 } }),
        web('Breakpoint at 600px', "const p = h.rect('.pic'); const i = h.rect('.info'); h.assert(i.left >= p.right - 1, 'At exactly 600px the layout is side by side.');", { viewport: { width: 600 }, visible: false }),
        web('Below the breakpoint', "const p = h.rect('.pic'); const i = h.rect('.info'); h.assert(i.top >= p.bottom - 1, 'At 599px the layout is stacked.');", { viewport: { width: 599 }, visible: false }),
      ],
      xpReward: 85, coinReward: 13,
    }),
    wc({
      id: 'web-12-portfolio-header', objectiveId: 'web-obj-responsive', title: 'Responsive Portfolio Header', mode: 'challenge', skillIds: ['web.layout'], concepts: ['media queries', 'responsive', 'fluid layout', 'layout'], difficulty: 3, context: 'personal',
      prompt: text('A portfolio page header (`.top`) has a `.brand` and a menu (`.menu`, a list of links). On screens **at least 640px wide** the brand is at the left and the menu at the far right, on one line, vertically centred. On **narrower** screens they stack with the brand first, both left-aligned, and the menu links each fill their own line. The hero image (`.hero`, 1200px wide in the file) must **never be wider than the screen**.'),
      expectedBehavior: 'Brand left, menu right when wide; stacked with full-width links when narrow; the hero image shrinks to fit.',
      starterFiles: files('<header class="top">\n  <div class="brand">Ada Reyes</div>\n  <ul class="menu">\n    <li><a href="#work">Work</a></li>\n    <li><a href="#about">About</a></li>\n    <li><a href="#contact">Contact</a></li>\n  </ul>\n</header>\n<div class="hero">hero image</div>\n', '.menu { list-style: none; margin: 0; padding: 0; }\n.brand { font-weight: 700; }\n.hero { width: 1200px; height: 200px; background: #cde; }\n'), tabs: ['css'],
      hints: ['The header is a flex container whose direction depends on the width.', 'A fixed pixel width does not adapt; how could the hero be capped by its container?', '`max-width: 100%` on the hero; a media query at 640px that turns the header into a row with `justify-content: space-between`.'],
      checks: [
        web('Wide layout', `const b = h.rect('.brand'); const m = h.rect('.menu'); const t = h.rect('.top'); h.assert(m.left > b.right, 'The menu is to the right of the brand.'); ${near('m.right', 't.right', 'The menu reaches the right edge')}; ${near('b.top + b.h / 2', 'm.top + m.h / 2', 'Brand and menu are vertically centred on each other')}; ${FITS}`, { viewport: { width: 900 } }),
        web('Narrow layout', `const b = h.rect('.brand'); const m = h.rect('.menu'); h.assert(m.top >= b.bottom - 1, 'The menu is below the brand.'); ${near('b.left', 'm.left', 'Both are left-aligned')}; const l = h.$$('.menu li').map((x) => x.getBoundingClientRect()); h.assert(l[1].top > l[0].top && l[2].top > l[1].top, 'Each menu link is on its own line.'); ${FITS}`, { viewport: { width: 400 } }),
        web('The hero shrinks', `${FITS} h.assert(h.rect('.hero').w <= h.viewport.w + 1, 'The hero must fit the screen.');`, { viewport: { width: 500 }, visible: false }),
        web('Breakpoint at 640px', "const b = h.rect('.brand'); const m = h.rect('.menu'); h.assert(m.left > b.right, 'At exactly 640px the layout is side by side.');", { viewport: { width: 640 }, visible: false }),
      ],
      xpReward: 85, coinReward: 13,
    }),
    wc({
      id: 'web-12-scoreboard-mobile', objectiveId: 'web-obj-responsive', title: 'The Mobile Scoreboard', mode: 'challenge', skillIds: ['web.layout'], concepts: ['media queries', 'responsive', 'fluid layout', 'layout'], difficulty: 3, context: 'sports',
      prompt: text('A scoreboard shows four team panels in `.board`. On screens **at least 800px wide** they are in **four equal columns**; on screens **from 500px to 799px** in **two columns**; and on screens **narrower than 500px** in **one column**. All layouts have 10px gaps and the page never scrolls sideways.'),
      expectedBehavior: 'Four, two, or one columns depending on width; 10px gaps; no sideways scroll.',
      starterFiles: files('<div class="board">\n  <div class="team">Owls 5</div>\n  <div class="team">Bears 3</div>\n  <div class="team">Cats 2</div>\n  <div class="team">Wolves 1</div>\n</div>\n', '.team { background: #223; color: #fff; padding: 12px; }\n'), tabs: ['css'],
      hints: ['Three layouts means a default and two queries.', 'Mobile first: start with the narrowest and add columns as the screen grows.', 'One column by default; `@media (min-width: 500px)` two columns; `@media (min-width: 800px)` four.'],
      checks: [
        web('Four columns when wide', `const t = h.$$('.team').map((x) => x.getBoundingClientRect()); h.eq(new Set(t.map((r) => Math.round(r.left))).size, 4, 'Columns'); ${near('t[1].left - t[0].right', '10', 'Gap is 10px')}; ${FITS}`, { viewport: { width: 900 } }),
        web('Two columns in the middle', `const t = h.$$('.team').map((x) => x.getBoundingClientRect()); h.eq(new Set(t.map((r) => Math.round(r.left))).size, 2, 'Columns'); ${near('t[2].top - t[0].bottom', '10', 'Row gap is 10px')}; ${FITS}`, { viewport: { width: 600 } }),
        web('One column when narrow', `const t = h.$$('.team').map((x) => x.getBoundingClientRect()); h.eq(new Set(t.map((r) => Math.round(r.left))).size, 1, 'Columns'); ${near('t[1].top - t[0].bottom', '10', 'Gap is 10px')}; ${FITS}`, { viewport: { width: 400 } }),
        web('Breakpoints are exact', "const cols = () => new Set(h.$$('.team').map((x) => Math.round(x.getBoundingClientRect().left))).size; h.eq(cols(), 4, 'At exactly 800px there are four columns');", { viewport: { width: 800 }, visible: false }),
        web('Just below 800', "const cols = new Set(h.$$('.team').map((x) => Math.round(x.getBoundingClientRect().left))).size; h.eq(cols, 2, 'At 799px there are two columns');", { viewport: { width: 799 }, visible: false }),
        web('Middle range', `const cols = new Set(h.$$('.team').map((x) => Math.round(x.getBoundingClientRect().left))).size; h.eq(cols, 2, 'At 550px there are two columns');`, { viewport: { width: 550 }, visible: false }),
        web('Just below 500', "const cols = new Set(h.$$('.team').map((x) => Math.round(x.getBoundingClientRect().left))).size; h.eq(cols, 1, 'At 499px there is one column');", { viewport: { width: 499 }, visible: false }),
      ],
      xpReward: 85, coinReward: 13,
    }),
    wc({
      id: 'web-12-pseudo-warnings', objectiveId: 'web-obj-pseudo', title: 'Warning Labels', mode: 'challenge', skillIds: ['web.css'], concepts: ['pseudo-elements', 'pseudo-classes', 'content'], difficulty: 3, context: 'engineering',
      prompt: text('Style the safety notes with CSS only (no HTML changes). Every paragraph with the class `warning` starts with the generated text `WARNING: ` (with the trailing space) in bold `#b00020`. Items in the list `.checks` that are **not** the last one end with a generated `;` and the last one ends with a generated `.`. Disabled buttons have grey `#999999` text.'),
      expectedBehavior: 'Warnings get a generated prefix, list items get generated punctuation, disabled buttons look grey.',
      starterFiles: files('<p class="warning">Isolate the power supply first.</p>\n<p>Normal note.</p>\n<ul class="checks">\n  <li>Check the guard</li>\n  <li>Check the oil</li>\n  <li>Clamp the workpiece</li>\n</ul>\n<button disabled>Start</button> <button>Stop</button>\n', ''), tabs: ['css'],
      hints: ['Some of this text does not exist in the HTML at all.', 'Generated content is added with a pseudo-element and the `content` property; positions and states have their own pseudo-classes.', '`.warning::before { content: "WARNING: "; }`, `li:not(:last-child)::after`, `li:last-child::after`, `button:disabled`.'],
      checks: [
        web('The warning prefix', "h.eq(h.style('.warning', 'content', '::before'), '\"WARNING: \"'); h.eq(h.style('.warning', 'color', '::before'), 'rgb(176, 0, 32)'); h.assert(parseInt(h.style('.warning', 'font-weight', '::before'), 10) >= 700, 'The prefix is bold.'); h.eq(h.style('p:not(.warning)', 'content', '::before'), 'none', 'Only warnings get a prefix');"),
        web('List punctuation', "const li = h.$$('.checks li'); h.eq(h.style(li[0], 'content', '::after'), '\";\"'); h.eq(h.style(li[1], 'content', '::after'), '\";\"'); h.eq(h.style(li[2], 'content', '::after'), '\".\"');"),
        web('Disabled buttons', "h.eq(h.style('button:disabled', 'color'), 'rgb(153, 153, 153)'); h.assert(h.style('button:not(:disabled)', 'color') !== 'rgb(153, 153, 153)', 'Only disabled buttons are grey.');", { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-12-pseudo-schedule', objectiveId: 'web-obj-pseudo', title: 'Race Schedule Marks', mode: 'challenge', skillIds: ['web.css'], concepts: ['pseudo-elements', 'pseudo-classes', 'content'], difficulty: 3, context: 'motorsport',
      prompt: text('Style the schedule with CSS only (no HTML changes). Each `.session` entry starts with the generated text `⏱ ` (a stopwatch and a space). Every **odd** entry has a `#f5f5f5` background and every even one none. A checked checkbox’s label (`.done`) is not something you can select by its checkbox alone here, so instead: the entry with the class `live` also ends with a generated ` LIVE` in bold `#c0392b`.'),
      expectedBehavior: 'Stopwatch prefixes, striped odd entries, and a LIVE suffix on the live entry.',
      starterFiles: files('<ol class="schedule">\n  <li class="session">Practice 1</li>\n  <li class="session">Practice 2</li>\n  <li class="session live">Qualifying</li>\n  <li class="session">Race</li>\n</ol>\n', ''), tabs: ['css'],
      hints: ['Two generated pieces of text, and one striping rule.', 'Position-based selectors count from one.', '`.session::before { content: "⏱ "; }`, `.session:nth-child(odd)`, `.live::after`.'],
      checks: [
        web('The prefix', "h.$$('.session').forEach((s) => h.eq(h.style(s, 'content', '::before'), '\"⏱ \"'));"),
        web('Striping', "const s = h.$$('.session'); h.eq(h.style(s[0], 'background-color'), 'rgb(245, 245, 245)'); h.eq(h.style(s[1], 'background-color'), 'rgba(0, 0, 0, 0)'); h.eq(h.style(s[2], 'background-color'), 'rgb(245, 245, 245)'); h.eq(h.style(s[3], 'background-color'), 'rgba(0, 0, 0, 0)');"),
        web('The LIVE suffix', "h.eq(h.style('.live', 'content', '::after'), '\" LIVE\"'); h.eq(h.style('.live', 'color', '::after'), 'rgb(192, 57, 43)'); h.assert(parseInt(h.style('.live', 'font-weight', '::after'), 10) >= 700); h.eq(h.style('.session:not(.live)', 'content', '::after'), 'none');", { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
  ],
};
