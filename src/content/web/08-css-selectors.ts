import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

/** rgb() of a #rrggbb colour, as browsers report computed colours. */
const rgb = (hex: string) => `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;
/** One computed-style expectation as script text. */
const is = (sel: string, prop: string, value: string, what = `${sel} ${prop}`) => `h.eq(h.style(${JSON.stringify(sel)}, ${JSON.stringify(prop)}), ${JSON.stringify(value)}, ${JSON.stringify(what)});`;
const color = (sel: string, hex: string) => is(sel, 'color', rgb(hex));
const bg = (sel: string, hex: string) => is(sel, 'background-color', rgb(hex));

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-08-css-selectors', title: 'Styling: Selectors and the Cascade', language: 'web', skillId: 'web.css',
    blurb: 'CSS rules, selectors, specificity, inheritance, colour and typography.', prerequisites: ['web-01-html-basics'], xpReward: 55,
    reference: {
      title: 'CSS selectors, cascade and typography',
      body: text(
        'A CSS **rule** is `selector { property: value; }`. Selectors: element (`p`), class (`.warning`), id (`#title`), descendant (`nav a`), child (`ul > li`), grouping (`h1, h2`), attribute (`a[href^="https"]`), and pseudo-classes (`li:first-child`, `tr:nth-child(even)`, `a:not(.button)`).',
        'When rules conflict, the **cascade** decides: (1) importance (`!important`, avoid it), (2) **specificity** (id beats class beats element; count them), (3) **source order** (later wins a tie). Some properties **inherit** from the parent (`color`, `font-*`, `line-height`); others (`border`, `margin`, `padding`) do not. Typography: `font-family`, `font-size` (`rem` scales with the root size), `font-weight`, `line-height` (unitless multiplier), `text-align`. Colours: names, `#rrggbb`, `rgb()`, `hsl()`.',
      ),
      example: 'h1 { color: #1a3a6b; font-size: 2rem; }\n.warning { color: #b00020; font-weight: 700; }\nnav a:hover { text-decoration: underline; }',
    },
    steps: [
      { kind: 'teach', title: 'Separating meaning from looks', body: text('HTML says what things **are**; CSS says how they **look**. Keeping them apart means you can restyle a whole site without touching its content, and one stylesheet can serve hundreds of pages.', 'A CSS rule has a **selector** (which elements?) and **declarations** (what to change). The interesting part is what happens when several rules disagree, which they always do on real pages. That is the **cascade**, and understanding it is the difference between fighting CSS and using it.') },
      webDemo({
        title: 'Two rules, one heading',
        body: text('Run it: the heading is blue. Now swap the order of the two rules and run again. Then change `h1` to `#title` and see which one wins.'),
        files: files('<h1 id="title" class="big">Cascade demo</h1>\n', 'h1 { color: red; }\n.big { color: blue; }\n'),
        notice: 'A class beats an element regardless of order (higher **specificity**). Order only breaks ties between equally specific selectors. `!important` overrides all of it, which is why it makes stylesheets hard to reason about.',
      }),
      { kind: 'challenge', challengeId: 'web-08-style-report' },
      { kind: 'challenge', challengeId: 'web-08-machine-status' },
      { kind: 'challenge', challengeId: 'web-08-specificity-alert' },
    ],
  },
  objectives: [
    { id: 'web-obj-selectors', title: 'Target elements precisely with selectors', summary: 'Class, id, descendant, child and pseudo-class selectors with the right properties.' },
    { id: 'web-obj-cascade', title: 'Resolve conflicting rules with specificity', summary: 'Fix a stylesheet so the intended rule wins without !important.' },
  ],
  challenges: [
    wc({
      id: 'web-08-style-report', title: 'Style the Report', mode: 'learning', skillIds: ['web.css'], concepts: ['selectors', 'color', 'typography', 'classes'], difficulty: 2, context: 'engineering',
      prompt: text('Style the report with CSS only. Headings `h1`: colour `#1a3a6b`, size `2rem`. Paragraphs `p`: colour `#333333` and a line height of 1.6 times the font size. Paragraphs with the class `warning`: colour `#b00020` and bold text.'),
      expectedBehavior: 'A dark-blue title, comfortable body text, and red bold warnings.',
      guidedSteps: ['`h1 { color: ...; font-size: 2rem; }`', '`p { color: ...; line-height: 1.6; }`', '`.warning { color: ...; font-weight: bold; }` (a class selector starts with a dot).'],
      starterFiles: files('<h1>Pump Station Report</h1>\n<p>All pumps were inspected on Monday.</p>\n<p class="warning">Pump 3 is leaking.</p>\n<p>Next inspection is due in June.</p>\n', ''), tabs: ['css'],
      hints: ['A rule is a selector followed by declarations in braces.', 'Classes are selected with a dot; the more specific rule wins where two apply.', '`.warning` also matches `p`, so it must set its own colour.'],
      checks: [
        web('The heading', `${color('h1', '#1a3a6b')}\n${is('h1', 'font-size', '32px')}`),
        web('Paragraphs', `${color('p:not(.warning)', '#333333')}\nconst p = h.$('p'); h.assert(Math.abs(parseFloat(h.style(p, 'line-height')) / parseFloat(h.style(p, 'font-size')) - 1.6) < 0.01, 'Line height should be 1.6 times the font size.');`),
        web('Warnings', `${color('.warning', '#b00020')}\nh.assert(parseInt(h.style('.warning', 'font-weight'), 10) >= 700, 'Warnings are bold.'); h.assert(parseInt(h.style('p:not(.warning)', 'font-weight'), 10) < 600, 'Only warnings are bold.');`),
      ],
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-08-machine-status', objectiveId: 'web-obj-selectors', title: 'Machine Status Colours', mode: 'challenge', skillIds: ['web.css'], concepts: ['selectors', 'descendant/child', 'pseudo-classes', 'color'], difficulty: 3, context: 'manufacturing',
      prompt: text('The machine list needs styling (CSS only, do not change the HTML). Machines that are `running` are green `#1b7f3b`; `down` are red `#c0392b` and bold; `idle` are grey `#7f8c8d` and italic. Every machine in the list `#machines` has 8px of padding all round, and only the FIRST machine has a 1px solid `#cccccc` line above it. Links inside the list (and only there) have no underline and are inherited-coloured (`#0645ad` is wrong: keep the machine’s own colour).'),
      expectedBehavior: 'Colour-coded machines, padded items, a line above the first, and unobtrusive links inside the list only.',
      starterFiles: files('<ul id="machines">\n  <li class="machine running"><a href="press.html">Press 1</a></li>\n  <li class="machine down"><a href="lathe.html">Lathe</a></li>\n  <li class="machine idle"><a href="welder.html">Welder</a></li>\n</ul>\n<p><a href="help.html">Help</a></p>\n', ''), tabs: ['css'],
      hints: ['Each status is a class on the list item.', 'Link colour normally comes from the browser; how could a link take its parent’s colour?', '`inherit`, a `:first-child` pseudo-class, and a descendant selector like `#machines a`.'],
      checks: [
        web('Status colours', `${color('.running', '#1b7f3b')}\n${color('.down', '#c0392b')}\n${color('.idle', '#7f8c8d')}`),
        web('Weight and style', "h.assert(parseInt(h.style('.down', 'font-weight'), 10) >= 700, 'Down machines are bold.'); h.assert(parseInt(h.style('.running', 'font-weight'), 10) < 600); h.eq(h.style('.idle', 'font-style'), 'italic'); h.eq(h.style('.running', 'font-style'), 'normal');"),
        web('Padding and the first-item line', "h.$$('#machines li').forEach((li) => ['top', 'right', 'bottom', 'left'].forEach((s) => h.eq(h.style(li, 'padding-' + s), '8px', 'padding ' + s))); const lis = h.$$('#machines li'); h.eq(h.style(lis[0], 'border-top-width'), '1px'); h.eq(h.style(lis[0], 'border-top-style'), 'solid'); h.eq(h.style(lis[0], 'border-top-color'), 'rgb(204, 204, 204)'); h.eq(h.style(lis[1], 'border-top-width'), '0px', 'Only the first item has the line'); h.eq(h.style(lis[2], 'border-top-width'), '0px');", { visible: false }),
        web('Links in the list', "const a = h.$$('#machines a'); a.forEach((x) => { h.assert(h.style(x, 'text-decoration-line') === 'none', 'No underline on links in the list.'); }); h.eq(h.style(a[0], 'color'), h.style(a[0].parentElement, 'color'), 'Links keep the machine colour'); h.eq(h.style(a[1], 'color'), h.style(a[1].parentElement, 'color')); h.eq(h.style('p a', 'text-decoration-line'), 'underline', 'Links outside the list are untouched');", { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-08-score-table', objectiveId: 'web-obj-selectors', title: 'Scoreboard Table', mode: 'challenge', skillIds: ['web.css'], concepts: ['selectors', 'descendant/child', 'pseudo-classes', 'color'], difficulty: 3, context: 'sports',
      prompt: text('Style the scoreboard table with CSS only. Header cells in the `thead` are white text on a `#222222` background. Every EVEN body row has a `#f2f2f2` background (the others stay transparent). The last cell of every row is right-aligned. A row with the class `champion` is bold. Body cells have 6px of vertical padding.'),
      expectedBehavior: 'A dark header, striped rows, right-aligned totals and a bold champion row.',
      starterFiles: files('<table>\n  <thead><tr><th>Team</th><th>Points</th></tr></thead>\n  <tbody>\n    <tr class="champion"><td>Owls</td><td>24</td></tr>\n    <tr><td>Bears</td><td>18</td></tr>\n    <tr><td>Cats</td><td>9</td></tr>\n    <tr><td>Wolves</td><td>7</td></tr>\n  </tbody>\n</table>\n', ''), tabs: ['css'],
      hints: ['Some of these depend on position rather than class.', 'There are pseudo-classes for "even" and "last".', '`tbody tr:nth-child(even)`, `td:last-child, th:last-child`, and a class selector.'],
      checks: [
        web('Header', `${color('thead th', '#ffffff')}\n${bg('thead th', '#222222')}`),
        web('Stripes', "const r = h.$$('tbody tr'); h.eq(h.style(r[0], 'background-color'), 'rgba(0, 0, 0, 0)', 'Odd rows stay transparent'); h.eq(h.style(r[1], 'background-color'), 'rgb(242, 242, 242)'); h.eq(h.style(r[2], 'background-color'), 'rgba(0, 0, 0, 0)'); h.eq(h.style(r[3], 'background-color'), 'rgb(242, 242, 242)');"),
        web('Alignment and weight', "h.$$('tr').forEach((r) => h.eq(h.style(r.lastElementChild, 'text-align'), 'right', 'The last cell is right-aligned')); h.assert(h.style('tbody tr:first-child td:first-child', 'text-align') !== 'right', 'Only the last cell is right-aligned'); h.assert(parseInt(h.style('.champion td', 'font-weight'), 10) >= 700, 'The champion row is bold'); h.assert(parseInt(h.style('tbody tr:nth-child(2) td', 'font-weight'), 10) < 600);", { visible: false }),
        web('Padding', "h.$$('tbody td').forEach((c) => { h.eq(h.style(c, 'padding-top'), '6px'); h.eq(h.style(c, 'padding-bottom'), '6px'); });", { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-08-product-cards', objectiveId: 'web-obj-selectors', title: 'Product Cards', mode: 'challenge', skillIds: ['web.css'], concepts: ['selectors', 'descendant/child', 'pseudo-classes', 'color'], difficulty: 3, context: 'retail',
      prompt: text('Style the product cards with CSS only. Every card price is `#b12704` and 1.25rem. Prices on cards that also have the class `sale` are `#cc0c39` and bold. The `badge` is shown only on `sale` cards (hidden with `display: none` elsewhere). Card titles (`h3`) have no top margin and 8px bottom margin.'),
      expectedBehavior: 'Coloured prices, sale prices standing out, and the badge only on sale cards.',
      starterFiles: files('<div class="card">\n  <h3>Gloves</h3>\n  <span class="badge">SALE</span>\n  <p class="price">£4.50</p>\n</div>\n<div class="card sale">\n  <h3>Helmet</h3>\n  <span class="badge">SALE</span>\n  <p class="price">£19.99</p>\n</div>\n', ''), tabs: ['css'],
      hints: ['One rule sets the general price; another refines it for one kind of card.', 'A rule with two classes on the same element is more specific than one with one.', '`.card.sale .price` (no space between `.card` and `.sale`), and `.card:not(.sale) .badge`.'],
      checks: [
        web('Prices', `${color('.card:not(.sale) .price', '#b12704')}\n${color('.sale .price', '#cc0c39')}\n${is('.price', 'font-size', '20px')}\nh.assert(parseInt(h.style('.sale .price', 'font-weight'), 10) >= 700); h.assert(parseInt(h.style('.card:not(.sale) .price', 'font-weight'), 10) < 600, 'Only sale prices are bold.');`),
        web('Badges', "h.eq(h.style('.card:not(.sale) .badge', 'display'), 'none'); h.assert(h.style('.sale .badge', 'display') !== 'none', 'Sale cards keep their badge.');"),
        web('Titles', "h.$$('h3').forEach((t) => { h.eq(h.style(t, 'margin-top'), '0px'); h.eq(h.style(t, 'margin-bottom'), '8px'); });", { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-08-specificity-alert', objectiveId: 'web-obj-cascade', title: 'Why Is It Blue?', mode: 'challenge', skillIds: ['web.css', 'web.debugging'], concepts: ['specificity', 'cascade', 'source order'], difficulty: 3, context: 'engineering',
      prompt: text('The alert message is meant to be red (`#c0392b`) and every other note in the panel green (`#1b7f3b`), but the stylesheet has conflicting rules and the alert shows the wrong colour. Fix the CSS (you cannot change the HTML) so the alert is red and the other notes are green. **Do not use `!important`**, and keep the existing rules unless you must change them.'),
      expectedBehavior: 'The alert is red; the other notes are green; no !important in the stylesheet.',
      starterFiles: files('<div class="panel">\n  <p class="note">Pressure normal.</p>\n  <p id="msg" class="note alert">Leak detected!</p>\n  <p class="note">Valve closed.</p>\n</div>\n', '.panel p { color: #1b7f3b; }\n#msg { color: #2255cc; }\np.note { color: purple; }\n'), tabs: ['css'],
      hints: ['Work out which selector wins for each paragraph.', 'Count ids, classes and elements in each selector. Do not fight it with force.', 'Change or remove the rule that gives the alert the wrong colour, or add a more specific rule for it.'],
      checks: [
        web('The alert is red', color('#msg', '#c0392b'), { feedback: 'Which rule wins for the alert, and why?' }),
        web('The other notes are green', "h.$$('.note:not(.alert)').forEach((p) => h.eq(h.style(p, 'color'), 'rgb(27, 127, 59)', 'note colour'));"),
        web('No !important', "h.assert(!/!\\s*important/i.test(h.files.css), 'Solve it with selectors, not with !important.');", { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-08-specificity-pit', objectiveId: 'web-obj-cascade', title: 'The Pit Board Clash', mode: 'challenge', skillIds: ['web.css', 'web.debugging'], concepts: ['specificity', 'cascade', 'source order'], difficulty: 3, context: 'motorsport',
      prompt: text('A race pit board should show the leader’s lap in purple (`#7b2fbf`) and every other lap in white text on dark, but conflicting rules give the leader the wrong colour. Fix the CSS (you cannot change the HTML) so the leader row is purple and the other rows are white (`#ffffff`). **Do not use `!important`**.'),
      expectedBehavior: 'The leader row is purple; the other rows are white; no !important.',
      starterFiles: files('<ol class="board">\n  <li class="lap">Lap 41: 1:22.4</li>\n  <li class="lap leader" id="p1">Lap 42: 1:21.9</li>\n  <li class="lap">Lap 43: 1:22.7</li>\n</ol>\n', '.board li { color: #ffffff; }\n#p1 { color: #f39c12; }\nli.lap { color: #cccccc; }\n'), tabs: ['css'],
      hints: ['Find out which rule is winning for the leader, and why.', 'Specificity counts ids first, then classes, then elements.', 'The rule that gives the leader the wrong colour has to change, or be beaten by a more specific one.'],
      checks: [
        web('The leader is purple', color('.leader', '#7b2fbf'), { feedback: 'Which rule wins for the leader row, and why?' }),
        web('The other laps are white', "h.$$('.lap:not(.leader)').forEach((p) => h.eq(h.style(p, 'color'), 'rgb(255, 255, 255)', 'lap colour'));"),
        web('No !important', "h.assert(!/!\\s*important/i.test(h.files.css), 'Solve it with selectors, not with !important.');", { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
  ],
};
