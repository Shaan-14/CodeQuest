import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

const near = (a: string, b: string, why: string) => `h.assert(Math.abs((${a}) - (${b})) <= 1.5, ${JSON.stringify(why)} + ' (got ' + Math.round((${a}) * 10) / 10 + ')');`;
const FITS = "h.assert(document.documentElement.scrollWidth <= h.viewport.w + 1, 'The page scrolls sideways on a ' + h.viewport.w + 'px screen.');";
const is = (sel: string, prop: string, value: string) => `h.eq(h.style(${JSON.stringify(sel)}, ${JSON.stringify(prop)}), ${JSON.stringify(value)}, ${JSON.stringify(`${sel} ${prop}`)});`;

/** The checks shared by the three "fix the broken stylesheet" variants. */
const fixChecks = (rules: { sel: string; prop: string; value: string }[], why: string) => [
  web('The stylesheet works', rules.map((r) => is(r.sel, r.prop, r.value)).join('\n'), { feedback: why }),
  web('No rule is silently ignored', "const s = h.files.css; const opens = (s.match(/\\{/g) || []).length; const closes = (s.match(/\\}/g) || []).length; h.eq(opens, closes, 'Braces must balance'); s.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '').split(/[{}]/).filter((_, i) => i % 2 === 1).forEach((body) => body.split(';').map((d) => d.trim()).filter(Boolean).forEach((d) => h.assert(/^[a-z-]+\\s*:\\s*[^:]+$/i.test(d), 'This declaration is malformed: \"' + d + '\"')));", { visible: false }),
];

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-13-css-projects', title: 'Debugging Styles and Building Layouts', language: 'web', skillId: 'web.layout',
    blurb: 'Why did my rule not apply? Then combine box model, flexbox, grid and media queries into real layouts.', prerequisites: ['web-12-responsive'], xpReward: 65,
    reference: {
      title: 'Debugging CSS and organising it',
      body: text(
        'CSS fails **silently**: a mistyped property, a missing `;` or `:`, or a selector that matches nothing is simply ignored. To debug: open the developer tools **Elements → Styles** panel; crossed-out declarations were overridden (a more specific rule won) and declarations with a warning were invalid. Ask three questions: (1) does the selector match the element? (2) is the declaration valid? (3) does another rule beat it?',
        'Organise stylesheets so they stay readable: base styles first (`* { box-sizing: border-box }`, typography), then layout, then components, then media queries; name classes for **what things are** (`.alert`) not how they look (`.red`); keep selectors short (avoid deep nesting and ids for styling); and reuse with classes instead of repeating declarations.',
      ),
      example: '/* invalid: missing colon and semicolon are silently ignored */\n.card { padding 16px; color: red }',
    },
    steps: [
      { kind: 'teach', title: 'When CSS just does nothing', body: text('Python tells you when you mistype. CSS does not: the browser throws away any declaration it does not understand and carries on. So a style that “does nothing” usually has a typo, a selector that matches nothing, or a stronger rule elsewhere.', 'The developer tools show exactly what the browser decided for every element and why. Learning to read them is the single biggest time-saver in CSS.') },
      webDemo({
        title: 'Spot the ignored declaration',
        body: text('Run it. Two things are supposed to be styled and neither is. Find out why for each, then fix them.'),
        files: files('<h2 class="title">Pump 3</h2>\n<p class="value">4.5 bar</p>\n', '.titel { color: navy; }\n.value { font-size 2rem; font-weight: bold; }\n'),
        notice: 'The first rule’s selector does not match (`titel` is not `title`). In the second, `font-size 2rem` has no colon so that declaration is dropped, while `font-weight: bold` still works: partial success is what makes these bugs hard to see.',
      }),
      { kind: 'challenge', challengeId: 'web-13-fix-panel-styles' },
      { kind: 'challenge', challengeId: 'web-13-monitor-layout' },
    ],
  },
  objectives: [
    { id: 'web-obj-fix-css', title: 'Find and fix a broken stylesheet', summary: 'Typos, missing punctuation, selectors that match nothing, and rules that lose the cascade.' },
    { id: 'web-obj-layout-project', title: 'Build a responsive layout from a brief', summary: 'Combine box model, flexbox, grid and media queries into a real interface.' },
  ],
  challenges: [
    wc({
      id: 'web-13-fix-panel-styles', objectiveId: 'web-obj-fix-css', title: 'Fix the Pump Panel Styles', mode: 'challenge', skillIds: ['web.css', 'web.debugging'], concepts: ['css syntax', 'selector typos', 'debugging'], difficulty: 3, context: 'engineering',
      prompt: text('The pump panel stylesheet has several mistakes, so parts of it do nothing. The panel should have 16px of padding; its `h2` should be `#1a3a6b`; the `.value` should be `2rem` and bold; and paragraphs inside the panel should have no margin. Fix the CSS without changing the HTML (and without deleting the rules).'),
      expectedBehavior: 'Every intended style applies.',
      starterFiles: files('<div class="panel">\n  <h2>Pump 3</h2>\n  <p class="value">4.5 bar</p>\n  <p>Nominal</p>\n</div>\n', '.panel { background: #f5f5f5; padding 16px; border: 1px solid #cccccc }\n.panel h2 { colour: #1a3a6b; }\n.panel .value { font-size: 2rem font-weight: bold; }\n.panl p { margin: 0; }\n'), tabs: ['css'],
      hints: ['CSS ignores what it does not understand: which lines are being ignored?', 'Look at punctuation, property spelling, and selector spelling one rule at a time.', 'One declaration lacks a colon, one property is misspelt, one lacks a semicolon between two declarations, and one selector has a typo.'],
      checks: fixChecks([{ sel: '.panel', prop: 'padding-left', value: '16px' }, { sel: '.panel h2', prop: 'color', value: 'rgb(26, 58, 107)' }, { sel: '.value', prop: 'font-size', value: '32px' }, { sel: '.value', prop: 'font-weight', value: '700' }, { sel: '.panel p', prop: 'margin-top', value: '0px' }], 'Which of the four rules are being ignored, and why?'),
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-13-fix-card-styles', objectiveId: 'web-obj-fix-css', title: 'Fix the Product Card Styles', mode: 'challenge', skillIds: ['web.css', 'web.debugging'], concepts: ['css syntax', 'selector typos', 'debugging'], difficulty: 3, context: 'retail',
      prompt: text('The product card stylesheet has several mistakes, so parts of it do nothing. The card should have 20px of padding; its `h3` should be `#7b2fbf`; the `.price` should be `1.5rem` and bold; and the `.desc` paragraph should have no margin. Fix the CSS without changing the HTML (and without deleting the rules).'),
      expectedBehavior: 'Every intended style applies.',
      starterFiles: files('<div class="card">\n  <h3>Helmet</h3>\n  <p class="price">£19.99</p>\n  <p class="desc">Lightweight.</p>\n</div>\n', '.card { background: #ffffff; padding: 20px border: 1px solid #dddddd; }\n.card h3 { color: #7b2fbf }\n.card .price { font-size: 1.5rem; font-wieght: bold; }\n.cardd .desc { margin: 0; }\n'), tabs: ['css'],
      hints: ['Some rules are ignored: find them.', 'Punctuation, property spelling, selector spelling.', 'A missing semicolon between two declarations, a misspelt property, and a selector typo.'],
      checks: fixChecks([{ sel: '.card', prop: 'padding-left', value: '20px' }, { sel: '.card h3', prop: 'color', value: 'rgb(123, 47, 191)' }, { sel: '.price', prop: 'font-size', value: '24px' }, { sel: '.price', prop: 'font-weight', value: '700' }, { sel: '.desc', prop: 'margin-top', value: '0px' }], 'Which rules are being ignored, and why?'),
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-13-fix-score-styles', objectiveId: 'web-obj-fix-css', title: 'Fix the Scoreboard Styles', mode: 'challenge', skillIds: ['web.css', 'web.debugging'], concepts: ['css syntax', 'selector typos', 'debugging'], difficulty: 3, context: 'sports',
      prompt: text('The scoreboard stylesheet has several mistakes, so parts of it do nothing. The board should have 12px of padding; its `h2` should be `#c0392b`; the `.total` should be `2rem` and bold; and paragraphs in the board should have no margin. Fix the CSS without changing the HTML (and without deleting the rules).'),
      expectedBehavior: 'Every intended style applies.',
      starterFiles: files('<div class="board">\n  <h2>Owls v Bears</h2>\n  <p class="total">5 - 3</p>\n  <p>Full time</p>\n</div>\n', '.board { background: #223; color: #fff; padding: 12px; border: 0 }\n.board h2 { color #c0392b; }\n.board .total { font-size: 2rem; font-weight: bold }\n.borad p { margin: 0 }\n'), tabs: ['css'],
      hints: ['Look for the rules that do nothing.', 'One-rule-at-a-time: valid declaration? matching selector?', 'One colon is missing, one selector is misspelt, and check the semicolons.'],
      checks: fixChecks([{ sel: '.board', prop: 'padding-left', value: '12px' }, { sel: '.board h2', prop: 'color', value: 'rgb(192, 57, 43)' }, { sel: '.total', prop: 'font-size', value: '32px' }, { sel: '.total', prop: 'font-weight', value: '700' }, { sel: '.board p', prop: 'margin-top', value: '0px' }], 'Which rules are being ignored, and why?'),
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-13-monitor-layout', objectiveId: 'web-obj-layout-project', title: 'The Factory Monitor Layout', mode: 'challenge', skillIds: ['web.layout', 'web.css'], concepts: ['grid', 'flexbox', 'media queries', 'responsive'], difficulty: 4, context: 'manufacturing', project: true,
      prompt: text(
        'Style the factory monitor page (do not change the HTML). Include `* { box-sizing: border-box }` behaviour so sizes include padding.',
        '**Wide screens (at least 900px):** the header spans the top; below it the `nav` sidebar is exactly 220px wide beside the `main` area, with 16px between them. Inside `main` the `.card`s fill each row using columns of at least 200px that share the row equally (16px gaps). The footer spans the bottom.',
        '**Narrower screens:** everything stacks in one column in source order (header, nav, main, footer) with 16px between them and the cards in one column. Status badges: `.ok` is `#1b7f3b`, `.down` is `#c0392b` and bold. The page must never scroll sideways.',
      ),
      expectedBehavior: 'A sidebar layout with a fluid card grid on wide screens; a single stacked column on narrow ones.',
      starterFiles: files('<div class="page">\n  <header>Factory Monitor</header>\n  <nav>Menu</nav>\n  <main>\n    <div class="card">Press <span class="ok">OK</span></div>\n    <div class="card">Lathe <span class="down">DOWN</span></div>\n    <div class="card">Welder <span class="ok">OK</span></div>\n    <div class="card">Saw <span class="ok">OK</span></div>\n    <div class="card">Drill <span class="ok">OK</span></div>\n  </main>\n  <footer>Updated 08:00</footer>\n</div>\n', 'body { margin: 0; }\nheader, nav, main, footer, .card { background: #eef; padding: 12px; }\n'), tabs: ['css'],
      hints: ['Decide the narrow layout first, then what changes above 900px.', 'The page is a grid; the cards inside main are another grid.', 'A one-column grid by default; a `min-width: 900px` query adds `220px 1fr` columns and makes header/footer span; the cards use `repeat(auto-fill, minmax(200px, 1fr))`.'],
      checks: [
        web('Wide: header, sidebar and main', `const hd = h.rect('header'); const n = h.rect('nav'); const m = h.rect('main'); const p = h.rect('.page'); ${near('hd.w', 'p.w', 'The header spans the page')}; ${near('n.w', '220', 'The sidebar is 220px wide')}; ${near('m.left - n.right', '16', 'The gap is 16px')}; ${near('n.top', 'm.top', 'The sidebar and main start together')}; ${near('n.top - hd.bottom', '16', 'The row gap is 16px')}; ${near('h.rect("footer").w', 'p.w', 'The footer spans the page')}; ${FITS}`, { viewport: { width: 1100 } }),
        web('Wide: the card grid', `const c = h.$$('.card').map((x) => x.getBoundingClientRect()); const cols = new Set(c.map((r) => Math.round(r.left))).size; h.assert(cols >= 3, 'At this width there should be at least 3 card columns (got ' + cols + ').'); c.forEach((r) => h.assert(r.width >= 199, 'Cards are at least 200px wide.')); ${near('c[1].left - c[0].right', '16', 'The card gap is 16px')}; const m = h.rect('main'); ${near('c[cols - 1].right', 'm.right - 12', 'The cards fill the row (main has 12px of padding)')};`, { viewport: { width: 1100 } }),
        web('Narrow: everything stacked', `const hd = h.rect('header'); const n = h.rect('nav'); const m = h.rect('main'); const f = h.rect('footer'); h.assert(n.top >= hd.bottom - 1 && m.top >= n.bottom - 1 && f.top >= m.bottom - 1, 'Header, nav, main and footer stack in order.'); ${near('n.top - hd.bottom', '16', 'The gap is 16px')}; ${near('m.top - n.bottom', '16', 'The gap is 16px')}; const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.eq(new Set(c.map((r) => Math.round(r.left))).size, 1, 'One card column'); ${FITS}`, { viewport: { width: 500 } }),
        web('Badges', "h.eq(h.style('.ok', 'color'), 'rgb(27, 127, 59)'); h.eq(h.style('.down', 'color'), 'rgb(192, 57, 43)'); h.assert(parseInt(h.style('.down', 'font-weight'), 10) >= 700); h.assert(parseInt(h.style('.ok', 'font-weight'), 10) < 600);", { visible: false }),
        web('The breakpoint is 900px', `const n = h.rect('nav'); const m = h.rect('main'); h.assert(m.left > n.right - 1, 'At exactly 900px the sidebar is beside main.');`, { viewport: { width: 900 }, visible: false }),
        web('Just below the breakpoint', `const n = h.rect('nav'); const m = h.rect('main'); h.assert(m.top >= n.bottom - 1, 'At 899px main is below the nav.');`, { viewport: { width: 899 }, visible: false }),
      ],
      xpReward: 130, coinReward: 20,
    }),
    wc({
      id: 'web-13-game-interface', objectiveId: 'web-obj-layout-project', title: 'The Game Screen Layout', mode: 'challenge', skillIds: ['web.layout', 'web.css'], concepts: ['grid', 'flexbox', 'media queries', 'responsive'], difficulty: 4, context: 'games', project: true,
      prompt: text(
        'Style the game screen (do not change the HTML). Include `box-sizing: border-box` behaviour.',
        '**Top bar (`.hud`)**: the `.score` sits at the far left and the `.timer` at the far right on one line, vertically centred. **Playfield (`.field`)**: a square that is 400px wide and 400px tall, but never wider than the screen (it shrinks and stays square), centred horizontally. **Controls (`.controls`)**: three buttons in one row that share the width equally with 8px between them; on screens **narrower than 480px** the buttons stack one per line instead. Space between `.hud`, `.field` and `.controls` is 16px. The page never scrolls sideways.',
      ),
      expectedBehavior: 'A top bar with score and timer at the ends, a centred square playfield, and three equal controls that stack on small screens.',
      starterFiles: files('<div class="game">\n  <div class="hud"><span class="score">Score 1200</span><span class="timer">0:42</span></div>\n  <div class="field">play area</div>\n  <div class="controls">\n    <button>Left</button><button>Jump</button><button>Right</button>\n  </div>\n</div>\n', 'body { margin: 0; }\n.hud, .field, .controls { background: #223; color: #fff; }\n.controls button { height: 44px; }\n'), tabs: ['css'],
      hints: ['Each area is a different tool: the hud is one line, the field is a sized box, the controls change with the width.', 'The game is a vertical stack with equal spacing; a fixed size that may shrink needs a maximum.', 'Flex on `.hud` with `space-between`; `width: 400px; max-width: 100%; aspect-ratio: 1; margin: auto`; a flex row for controls that becomes a column in a `max-width: 479px` query.'],
      checks: [
        web('The top bar', `const b = h.rect('.hud'); const s = h.rect('.score'); const t = h.rect('.timer'); ${near('s.left', 'b.left', 'The score is at the far left')}; ${near('t.right', 'b.right', 'The timer is at the far right')}; ${near('s.top + s.h / 2', 't.top + t.h / 2', 'Score and timer are on one line')}; ${FITS}`, { viewport: { width: 700 } }),
        web('The playfield on a wide screen', `const f = h.rect('.field'); ${near('f.w', '400', 'The field is 400px wide')}; ${near('f.h', '400', 'The field is 400px tall')}; ${near('f.left + f.w / 2', 'h.viewport.w / 2', 'The field is centred')};`, { viewport: { width: 700 } }),
        web('The playfield stays square on a small screen', `const f = h.rect('.field'); h.assert(f.w <= h.viewport.w + 1, 'The field must fit the screen.'); ${near('f.w', 'f.h', 'The field stays square')}; ${FITS}`, { viewport: { width: 320 } }),
        web('Controls on a wide screen', `const b = h.$$('.controls button').map((x) => x.getBoundingClientRect()); h.assert(b.every((r) => Math.abs(r.top - b[0].top) < 2), 'One row.'); ${near('b[1].left - b[0].right', '8', 'The gap is 8px')}; ${near('b[0].width', 'b[2].width', 'Equal widths')}; ${near('b[2].right', 'h.rect(".controls").right', 'The buttons fill the width')};`, { viewport: { width: 700 } }),
        web('Controls stack on a small screen', `const b = h.$$('.controls button').map((x) => x.getBoundingClientRect()); h.assert(b[1].top >= b[0].bottom - 1 && b[2].top >= b[1].bottom - 1, 'The buttons stack.'); ${near('b[1].top - b[0].bottom', '8', 'The gap is 8px')}; ${FITS}`, { viewport: { width: 400 } }),
        web('Spacing between the areas', `const a = h.rect('.hud'); const f = h.rect('.field'); const c = h.rect('.controls'); ${near('f.top - a.bottom', '16', 'The gap is 16px')}; ${near('c.top - f.bottom', '16', 'The gap is 16px')};`, { viewport: { width: 700 }, visible: false }),
        web('The breakpoint is 480px', "const b = h.$$('.controls button').map((x) => x.getBoundingClientRect()); h.assert(b.every((r) => Math.abs(r.top - b[0].top) < 2), 'At exactly 480px the buttons are in one row.');", { viewport: { width: 480 }, visible: false }),
      ],
      xpReward: 130, coinReward: 20,
    }),
  ],
};
