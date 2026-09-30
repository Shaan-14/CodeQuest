import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

const near = (a: string, b: string, why: string) => `h.assert(Math.abs((${a}) - (${b})) <= 1, ${JSON.stringify(why)} + ' (got ' + ${a} + ')');`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-09-box-model', title: 'The Box Model', language: 'web', skillId: 'web.layout',
    blurb: 'Every element is a box: content, padding, border, margin, and how box-sizing changes the sums.', prerequisites: ['web-08-css-selectors'], xpReward: 55,
    reference: {
      title: 'The CSS box model and display',
      body: text(
        'Every element is a rectangular **box** made of four layers, from inside out: **content** (`width`/`height`), **padding** (space inside the border), **border**, and **margin** (space outside). By default (`box-sizing: content-box`) `width` sets only the content, so padding and border are ADDED. With `box-sizing: border-box`, `width` includes padding and border: much easier to reason about.',
        '`display` decides how a box behaves: `block` (full-width, stacks), `inline` (flows in text; ignores width/height), `inline-block` (flows but respects size), `none` (removed). Vertical margins of adjacent blocks **collapse** (the larger one wins). `margin: 0 auto` centres a block with a set width.',
      ),
      example: '* { box-sizing: border-box; }\n.card { width: 300px; padding: 16px; border: 2px solid #333; margin: 20px auto; }',
    },
    steps: [
      { kind: 'teach', title: 'Everything is a box', body: text('Whatever a page looks like, the browser sees a pile of rectangles. To place things where you want them you must know how big each rectangle really is and how far it sits from the next. That is the **box model**, the most useful thing to understand in CSS.', 'A famous surprise: you give a box `width: 300px`, add `padding: 16px` and a `2px` border, and it is suddenly **336px** wide. `box-sizing: border-box` fixes that by making the width include them.') },
      webDemo({
        title: 'Measuring a box',
        body: text('Run it and look at the two boxes: both say `width: 200px`. Change the second rule to `box-sizing: border-box` and run again.'),
        files: files('<div class="a">content-box</div>\n<div class="b">border-box?</div>\n', '.a, .b { width: 200px; padding: 20px; border: 5px solid #444; background: #dde; margin-bottom: 10px; }\n.b { box-sizing: content-box; }\n'),
        notice: 'Both boxes look different in size because the padding and border are added to the content width by default. With `border-box` both become exactly 200px wide, including padding and border.',
      }),
      { kind: 'challenge', challengeId: 'web-09-card-box' },
      { kind: 'challenge', challengeId: 'web-09-alert-banner' },
    ],
  },
  objectives: [{ id: 'web-obj-box-model', title: 'Size and space boxes precisely', summary: 'Padding, border, margin, box-sizing and display, verified by measuring the result.' }],
  challenges: [
    wc({
      id: 'web-09-card-box', title: 'A Card of Exact Size', mode: 'learning', skillIds: ['web.layout', 'web.css'], concepts: ['box model', 'padding', 'border', 'margin', 'box-sizing'], difficulty: 2, context: 'business',
      prompt: text('Style `.card` as a box that is **exactly 300px wide in total** (including its padding and border), has 16px of padding, a 2px solid `#333333` border, a white background, 20px of space above and below, and is centred horizontally in the page.'),
      expectedBehavior: 'A centred 300px-wide card with padding and a border.',
      guidedSteps: ['Set `width: 300px;`.', 'Make the width include padding and border with `box-sizing`.', 'Add `padding`, `border`, `background`.', 'Centre a block with automatic side margins: `margin: 20px auto;`.'],
      starterFiles: files('<div class="card">Bytehaven Works: welcome</div>\n', ''), tabs: ['css'],
      hints: ['Two things decide the total width: the width and how it is counted.', 'Padding and border are added to `width` unless you say otherwise.', 'Centring a block uses equal automatic left and right margins.'],
      checks: [
        web('Total size', `const r = h.rect('.card'); ${near('r.w', '300', 'The card must be exactly 300px wide in total')}`),
        web('Padding and border', "h.eq(h.style('.card', 'padding-left'), '16px'); h.eq(h.style('.card', 'padding-top'), '16px'); h.eq(h.style('.card', 'border-left-width'), '2px'); h.eq(h.style('.card', 'border-left-style'), 'solid'); h.eq(h.style('.card', 'border-left-color'), 'rgb(51, 51, 51)'); h.eq(h.style('.card', 'background-color'), 'rgb(255, 255, 255)');"),
        web('Space and centring', `h.eq(h.style('.card', 'margin-top'), '20px'); h.eq(h.style('.card', 'margin-bottom'), '20px'); const r = h.rect('.card'); ${near('r.left + r.w / 2', 'h.viewport.w / 2', 'The card should be centred')}`, { visible: false }),
      ],
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-09-alert-banner', objectiveId: 'web-obj-box-model', title: 'Alert Banners', mode: 'challenge', skillIds: ['web.layout', 'web.css'], concepts: ['box model', 'padding', 'border', 'margin', 'box-sizing'], difficulty: 3, context: 'engineering',
      prompt: text('The control room shows alert banners inside a fixed-width column (`.wrap`, 600px). Style `.banner`: each banner must fill the column **exactly** (600px in total) even though it has 12px of padding above and below, 20px left and right, and a 6px solid `#c0392b` border on its LEFT side only. There must be exactly 16px of space between one banner and the next, and the paragraph inside a banner has no margins of its own.'),
      expectedBehavior: 'Banners exactly as wide as the column, with a red left edge and 16px between them.',
      starterFiles: files('<div class="wrap">\n  <div class="banner"><p>Coolant low</p></div>\n  <div class="banner"><p>Door open</p></div>\n</div>\n', '.wrap { width: 600px; }\n.banner { background: #fdecea; width: 100%; }\n'), tabs: ['css'],
      hints: ['Measure the banner in your head: content, padding, border.', 'How can width be told to include the padding and border?', 'Space between siblings comes from margin; the paragraph has default margins of its own.'],
      checks: [
        web('Filling the column', `const r = h.rect('.banner'); ${near('r.w', '600', 'Each banner is exactly 600px wide')}`),
        web('Padding and border', "h.eq(h.style('.banner', 'padding-top'), '12px'); h.eq(h.style('.banner', 'padding-bottom'), '12px'); h.eq(h.style('.banner', 'padding-left'), '20px'); h.eq(h.style('.banner', 'padding-right'), '20px'); h.eq(h.style('.banner', 'border-left-width'), '6px'); h.eq(h.style('.banner', 'border-left-color'), 'rgb(192, 57, 43)'); h.eq(h.style('.banner', 'border-top-width'), '0px'); h.eq(h.style('.banner', 'border-right-width'), '0px');"),
        web('Spacing', `const a = h.$$('.banner'); const gap = a[1].getBoundingClientRect().top - a[0].getBoundingClientRect().bottom; ${near('gap', '16', 'The space between banners must be 16px')}; h.eq(h.style('.banner p', 'margin-top'), '0px'); h.eq(h.style('.banner p', 'margin-bottom'), '0px');`, { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-09-stat-tiles', objectiveId: 'web-obj-box-model', title: 'Statistic Tiles', mode: 'challenge', skillIds: ['web.layout', 'web.css'], concepts: ['box model', 'padding', 'border', 'margin', 'box-sizing'], difficulty: 3, context: 'data analysis',
      prompt: text('A dashboard shows statistic tiles. Style `.tile` so each is **200px wide and 120px tall in total** (padding and border included), has 12px of padding and a 1px solid `#999999` border, sits side by side with the others on one line (they are inline elements that must respect a width), and has 8px of margin on every side.'),
      expectedBehavior: 'Three 200x120 tiles in a row with equal spacing.',
      starterFiles: files('<div class="tile">Output<br>1,240</div>\n<div class="tile">Defects<br>12</div>\n<div class="tile">Uptime<br>97%</div>\n', 'body { margin: 0; }\n'), tabs: ['css'],
      hints: ['You need boxes that sit in a line but still accept a width and a height.', 'Decide how the size is counted, then the space around.', 'A display value that is a mix of `inline` and `block`, and `box-sizing`.'],
      checks: [
        web('Size', `const t = h.$$('.tile'); t.forEach((x) => { const r = x.getBoundingClientRect(); ${near('r.width', '200', 'Tiles are 200px wide in total')}; ${near('r.height', '120', 'Tiles are 120px tall in total')}; });`),
        web('Side by side', "const t = h.$$('.tile').map((x) => x.getBoundingClientRect()); h.assert(t.every((r) => Math.abs(r.top - t[0].top) <= 1), 'The tiles should sit on one line.'); h.assert(t[1].left > t[0].right && t[2].left > t[1].right, 'They should not overlap.');"),
        web('Padding, border, margin', "h.$$('.tile').forEach((x) => { h.eq(h.style(x, 'padding-left'), '12px'); h.eq(h.style(x, 'padding-bottom'), '12px'); h.eq(h.style(x, 'border-top-width'), '1px'); h.eq(h.style(x, 'border-top-color'), 'rgb(153, 153, 153)'); ['top', 'right', 'bottom', 'left'].forEach((s) => h.eq(h.style(x, 'margin-' + s), '8px', 'margin ' + s)); });", { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
    wc({
      id: 'web-09-pit-board', objectiveId: 'web-obj-box-model', title: 'The Pit Board', mode: 'challenge', skillIds: ['web.layout', 'web.css'], concepts: ['box model', 'padding', 'border', 'margin', 'box-sizing'], difficulty: 3, context: 'motorsport',
      prompt: text('The pit crew’s board must have a **content area** exactly 400px wide, with 20px of padding and a 5px solid `#111111` border, so that in total it is 450px wide. It is centred in the page and has 30px of space above it. (Here you want the default way of counting width, not the border-box way.)'),
      expectedBehavior: 'A board whose content is 400px wide and whose total width is 450px, centred.',
      starterFiles: files('<div class="board">LAP 42 &middot; P2 &middot; +1.4s</div>\n', '.board { background: #ffd54f; }\n'), tabs: ['css'],
      hints: ['Work out the total width from the content width.', 'Decide whether the width should include the padding and border.', 'Padding + border + content, on both sides. Centre with automatic side margins.'],
      checks: [
        web('Content and total width', `h.eq(h.style('.board', 'width'), '400px', 'The content area'); const r = h.rect('.board'); ${near('r.w', '450', 'The total width should be 450px')}`),
        web('Padding and border', "h.eq(h.style('.board', 'padding-left'), '20px'); h.eq(h.style('.board', 'padding-top'), '20px'); h.eq(h.style('.board', 'border-left-width'), '5px'); h.eq(h.style('.board', 'border-left-color'), 'rgb(17, 17, 17)');"),
        web('Position', `h.eq(h.style('.board', 'margin-top'), '30px'); const r = h.rect('.board'); ${near('r.left + r.w / 2', 'h.viewport.w / 2', 'Centre the board')}`, { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    }),
  ],
};
