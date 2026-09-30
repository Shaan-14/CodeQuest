import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

const T = (name: string, script: string, o: { visible?: boolean; viewport?: { width: number; height?: number } } = {}) => web(name, script, { visible: false, ...o });
const near = (a: string, b: string, why: string, tol = 1.5) => `h.assert(Math.abs((${a}) - (${b})) <= ${tol}, ${JSON.stringify(why)} + ' (got ' + Math.round((${a}) * 10) / 10 + ')');`;
const FILLER = Array.from({ length: 90 }, (_, i) => `<p>Paragraph ${i + 1}. This is filler text so that the page is tall enough to scroll, which is how sticky elements can be seen doing their job.</p>`).join('\n');

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-29-positioning', title: 'Placing Things Exactly', language: 'web', skillId: 'web.position',
    blurb: 'Badges on corners, ribbons above images, headers that stay put: relative, absolute and sticky positioning, and the layers between them.', prerequisites: ['web-09-box-model'], xpReward: 70,
    reference: {
      title: 'CSS positioning',
      body: text(
        '`position: relative` keeps an element where it is in the flow but makes it the **anchor** for its absolutely positioned children. `position: absolute` **removes** an element from the flow and places it with `top`/`right`/`bottom`/`left` **relative to its nearest positioned ancestor** (an ancestor whose `position` is not `static`). If there is none, it is placed relative to the page: the classic "why is my badge in the corner of the screen?" bug.',
        '`position: sticky; top: 0` keeps an element in the flow, then makes it **stick** to the top of the scrolling area once it would scroll past. It only sticks **inside its parent**, and inside a flex container a stretched item has no room to move: give it `align-self: flex-start`. `position: fixed` pins to the viewport and removes the element from the flow (content slides under it unless you add space).',
        '**Layers:** positioned elements are painted above non-positioned ones, and among them a larger `z-index` wins. `z-index` only applies to positioned elements (and flex/grid items). A child can never escape its parent’s **stacking context**, so a low `z-index` on a parent can trap a high one on a child. Negative offsets (`right: -7px`) place an element partly outside its anchor.',
      ),
      example: '.card { position: relative; }\n.badge { position: absolute; top: 8px; right: 8px; }\nheader { position: sticky; top: 0; z-index: 10; }',
    },
    steps: [
      { kind: 'teach', title: 'Normal flow, and leaving it', body: text('Most of CSS is about **normal flow**: blocks stack, inline things sit in lines. Positioning is how you *leave* the flow on purpose: to pin a badge to a corner, float a ribbon over a photo, or keep a header on screen while the page scrolls.', 'Each of these depends on one question: **relative to what?** An absolutely positioned element measures from its nearest positioned ancestor; a sticky one from the scrolling area. Most positioning bugs are answers to that question you did not choose.') },
      webDemo({
        title: 'Anchor the badge',
        body: text('The badge is absolutely positioned. Try removing `position: relative` from `.card`, and see where the badge goes.'),
        files: files('<div class="card"><span class="badge">NEW</span><h3>Bolt kit</h3><p>Forty pieces.</p></div>\n', '.card { position: relative; width: 220px; margin: 40px auto; padding: 16px; background: #eef; }\n.badge { position: absolute; top: 8px; right: 8px; background: #c00; color: #fff; padding: 2px 8px; }\n', ''),
        notice: 'With the anchor, the badge sits in the card’s top-right corner. Without `position: relative` on the card, the browser measures from the page instead and the badge jumps to the corner of the window.',
      }),
      { kind: 'challenge', challengeId: 'web-29-card-badge' },
      { kind: 'challenge', challengeId: 'web-29-status-dot' },
      { kind: 'challenge', challengeId: 'web-29-sticky-header' },
    ],
  },
  objectives: [
    { id: 'web-obj-overlay-position', title: 'Place an element relative to its container', summary: 'Anchor an absolutely positioned child to a container and place it exactly, including partly outside and above other layers.' },
    { id: 'web-obj-sticky', title: 'Keep an element visible while scrolling', summary: 'Make an element stick to the top of the screen, taking care of the flow, the parent and the layout it lives in.' },
  ],
  challenges: [
    wc({
      id: 'web-29-card-badge', title: 'A Badge on the Corner of a Card', mode: 'learning', skillIds: ['web.position', 'web.css'], concepts: ['position:relative', 'position:absolute', 'offsets'], difficulty: 3, context: 'retail',
      prompt: text('The product card shows a **NEW** badge in the normal flow, above the heading. Change the CSS so the badge sits in the **top-right corner of the card**, **8px from the top and 8px from the right edge**, and no longer takes up room above the heading. The card is centred on the page and its position must not change.'),
      expectedBehavior: 'The .badge is 8px from the top and right edges of the .card.',
      guidedSteps: ['Give the card `position: relative` so it becomes the anchor.', 'Give the badge `position: absolute`.', 'Set `top: 8px` and `right: 8px` on the badge.'],
      starterFiles: files('<div class="card"><span class="badge">NEW</span><h3>Bolt kit</h3><p>Forty pieces, zinc plated.</p></div>\n', '.card { width: 240px; margin: 40px auto; padding: 16px; background: #eef; box-sizing: border-box; }\n.badge { background: #c00; color: #fff; padding: 2px 8px; font-size: 12px; }\n', ''), tabs: ['css'],
      hints: ['Which element must the badge be measured from, and what does it need to become?', 'Leaving the normal flow and choosing an anchor are two different declarations, on two different elements.', 'The badge needs `position: absolute` with two offsets; its container needs a position that is not `static`.'],
      checks: [
        web('The badge sits in the corner', `const c = h.rect('.card'); const b = h.rect('.badge'); ${near('c.right - b.right', '8', 'The badge should be 8px from the right edge of the card')} ${near('b.top - c.top', '8', 'The badge should be 8px from the top of the card')}`, { visible: true }),
        T('It is anchored to the card, not the page', `h.assert(h.style('.card', 'position') !== 'static', 'The card must be the anchor for the badge.'); h.assert(h.style('.badge', 'position') === 'absolute', 'The badge should be absolutely positioned.');`),
        T('Still right on a narrower screen', `const c = h.rect('.card'); const b = h.rect('.badge'); ${near('c.right - b.right', '8', 'On a narrow screen the badge should still be 8px from the card edge')} ${near('b.top - c.top', '8', 'and 8px from the top')}`, { viewport: { width: 400 } }),
        T('The card content is not disturbed', `const c = h.rect('.card'); const t = h.rect('h3'); h.assert(t.top - c.top < 40, 'The heading should move up: the badge no longer takes space in the flow (heading is ' + Math.round(t.top - c.top) + 'px from the top of the card).'); h.assert(c.width === 240, 'The card should stay 240px wide.');`),
      ],
      xpReward: 70, coinReward: 10,
    }),
    wc({
      id: 'web-29-status-dot', objectiveId: 'web-obj-overlay-position', title: 'An Online Dot on an Avatar', mode: 'challenge', skillIds: ['web.position', 'web.css'], concepts: ['position:relative', 'position:absolute', 'offsets'], difficulty: 3, context: 'social',
      prompt: text('The chat app shows each person as a 64px square avatar. Add a small green **status dot** (`.dot`, 14px by 14px, already styled) so that its **centre sits exactly on the avatar’s bottom-right corner**. The avatar’s size and place must not change, and the dot must not push anything around.'),
      expectedBehavior: 'The dot’s centre is on the bottom-right corner of the avatar.',
      starterFiles: files('<p>Ana is online</p>\n<div class="avatar"><span class="dot"></span></div>\n<p>Last seen just now</p>\n', 'body { margin: 0; }\n.avatar { width: 64px; height: 64px; margin: 24px 40px; background: #99c; box-sizing: border-box; border-radius: 8px; }\n.dot { display: block; width: 14px; height: 14px; border-radius: 50%; background: #2a2; }\n', ''), tabs: ['css'],
      hints: ['The dot should be measured from the avatar. What has to be true of the avatar for that to work?', 'The dot leaves the normal flow; where will the paragraphs go?', 'Half of the dot’s own size hangs outside each edge; offsets can be negative.'],
      checks: [
        web('The dot is on the corner', `const a = h.rect('.avatar'); const d = h.rect('.dot'); ${near('d.x + d.w / 2', 'a.right', 'The centre of the dot should be on the right edge of the avatar')} ${near('d.y + d.h / 2', 'a.bottom', 'The centre of the dot should be on the bottom edge of the avatar')}`, { visible: true }),
        T('The avatar is not moved or resized', `const a = h.rect('.avatar'); h.eq([Math.round(a.w), Math.round(a.h)], [64, 64]); ${near('a.x', '40', 'The avatar keeps its 40px left margin')}`),
        T('The dot does not affect the layout', `const a = h.rect('.avatar'); const p = h.$$('p'); const after = p[1].getBoundingClientRect(); ${near('after.top - a.bottom', '24', 'The text below the avatar stays 24px below it (the dot must not push things around)', 2)}`),
        T('The dot is drawn above the avatar', `const d = h.rect('.dot'); const el = document.elementFromPoint(d.x + d.w / 2, d.y + d.h / 2); h.assert(el === document.querySelector('.dot'), 'The dot should be visible on top of the avatar.');`),
      ],
      xpReward: 100, coinReward: 15,
    }),
    wc({
      id: 'web-29-sale-ribbon', objectiveId: 'web-obj-overlay-position', title: 'A Sale Ribbon Above a Photo', mode: 'challenge', skillIds: ['web.position', 'web.css'], concepts: ['position:relative', 'position:absolute', 'offsets'], difficulty: 3, context: 'e-commerce',
      prompt: text('A product tile (200px by 150px) holds a photo that fills it. The shop’s stylesheet already lifts the photo above its neighbours. Place the **SALE** ribbon (`.ribbon`, a sibling of the photo) in the **top-left corner of the tile, flush with both edges**, **visible on top of the photo**. Do not change the tile’s or the photo’s size or position.'),
      expectedBehavior: 'The ribbon touches the top-left corner of the tile and is drawn on top of the photo.',
      starterFiles: files('<div class="tile"><div class="photo"></div><span class="ribbon">SALE</span></div>\n', 'body { margin: 0; }\n.tile { width: 200px; height: 150px; margin: 30px; }\n.photo { position: relative; z-index: 2; width: 100%; height: 100%; background: #ccd; }\n.ribbon { background: #c00; color: #fff; padding: 4px 12px; font-weight: bold; }\n', ''), tabs: ['css'],
      hints: ['The ribbon must leave the normal flow and be measured from the tile. What must the tile become?', 'Two offsets of zero put it in a corner.', 'Something else on the page is already stacked at a level: what must the ribbon’s level be to appear above it?'],
      checks: [
        web('The ribbon is in the corner', `const p = h.rect('.photo'); const r = h.rect('.ribbon'); ${near('r.x', 'p.x', 'The ribbon should touch the left edge of the tile')} ${near('r.y', 'p.y', 'The ribbon should touch the top edge of the tile')}`, { visible: true }),
        T('The ribbon is visible on top', `const r = h.rect('.ribbon'); const el = document.elementFromPoint(r.x + r.w / 2, r.y + r.h / 2); h.assert(el === document.querySelector('.ribbon'), 'The ribbon is hidden behind the photo. Which of them is painted last?');`),
        T('The photo is unchanged', `const p = h.rect('.photo'); h.eq([Math.round(p.w), Math.round(p.h)], [200, 150]); ${near('p.x', '30', 'The photo keeps its position')} ${near('p.y', '30', 'The photo keeps its position')}`),
        T('Anchored to the tile, not the page', `const p = h.rect('.photo'); const r = h.rect('.ribbon'); h.assert(r.x >= p.x - 1 && r.y >= p.y - 1 && r.right <= p.right + 1, 'The ribbon should stay inside the tile.'); h.assert(h.style('.ribbon', 'position') === 'absolute', 'The ribbon should be absolutely positioned.');`),
      ],
      xpReward: 100, coinReward: 15,
    }),
    wc({
      id: 'web-29-sticky-header', objectiveId: 'web-obj-sticky', title: 'A Header That Stays Put', mode: 'challenge', skillIds: ['web.position', 'web.css'], concepts: ['position:sticky', 'z-index', 'scrolling'], difficulty: 3, context: 'documentation',
      prompt: text('The documentation page has a long article under a header. Make the `header` **stay at the very top of the screen while the article scrolls beneath it**, always visible on top of the text. When the page is at the top, the article must still start **below** the header (not underneath it).'),
      expectedBehavior: 'The header stays at the top of the viewport while scrolling, above the content, and the article begins under it.',
      starterFiles: files(`<header>Plant manual</header>\n<main>\n<h1>Safety</h1>\n${FILLER}\n</main>\n`, 'body { margin: 0; font-family: sans-serif; }\nheader { background: #123; color: #fff; padding: 14px 20px; }\nmain { position: relative; padding: 20px; }\n', ''), tabs: ['css'],
      hints: ['One value of `position` keeps an element in the flow and pins it once it would scroll away.', 'What offset says where it should stick?', 'Content that scrolls underneath needs a layer order: which one should be on top?'],
      checks: [
        web('The header is at the top after scrolling', `window.scrollTo(0, 600); await h.settle(); h.assert(window.scrollY > 300, 'The page did not scroll: is there enough content?'); ${near('h.rect("header").y', '0', 'After scrolling the header should still be at the top of the screen')}`, { visible: true }),
        T('The article starts below the header', `window.scrollTo(0, 0); await h.settle(); const hd = h.rect('header'); const t = h.rect('main h1'); h.assert(t.y >= hd.bottom - 1, 'At the top of the page the article must start below the header (heading at ' + Math.round(t.y) + ', header ends at ' + Math.round(hd.bottom) + ').');`),
        T('The header is on top of the text', `window.scrollTo(0, 900); await h.settle(); const hd = h.rect('header'); const el = document.elementFromPoint(hd.x + 20, hd.y + hd.h / 2); h.assert(el && (el === document.querySelector('header') || document.querySelector('header').contains(el)), 'While scrolling, the text is drawn on top of the header. Which layer should win?');`),
        T('Still stuck a long way down', `window.scrollTo(0, 1500); await h.settle(); ${near('h.rect("header").y', '0', 'Far down the page the header should still be at the top')} h.assert(h.rect('header').w >= h.viewport.w - 1, 'The header should still span the full width.');`),
      ],
      xpReward: 100, coinReward: 15,
    }),
    wc({
      id: 'web-29-sticky-contents', objectiveId: 'web-obj-sticky', title: 'A Contents List That Follows You', mode: 'challenge', skillIds: ['web.position', 'web.css'], concepts: ['position:sticky', 'z-index', 'scrolling'], difficulty: 3, context: 'education',
      prompt: text('A course page has a contents list (`nav.toc`) in a left column and a long lesson (`main`) on the right, laid out side by side. Make the contents list **follow the reader**: while scrolling it stays **16px from the top of the screen**. The two columns must stay where they are horizontally.'),
      expectedBehavior: 'The contents list stays 16px from the top while scrolling, in its own left column.',
      starterFiles: files(`<div class="layout">\n<nav class="toc"><a href="#a">Intro</a><br><a href="#b">Practice</a><br><a href="#c">Review</a></nav>\n<main>\n<h1>Lesson</h1>\n${FILLER}\n</main>\n</div>\n`, 'body { margin: 0; font-family: sans-serif; }\n.layout { display: flex; gap: 24px; padding: 16px; }\n.toc { width: 160px; flex: none; box-sizing: border-box; background: #efe; padding: 12px; }\nmain { flex: 1; }\n', ''), tabs: ['css'],
      hints: ['Which kind of positioning keeps an element in place until it would scroll away?', 'It needs to know how far from the top to stop.', 'A sticky element can only move inside its parent. What does a flex container do to its children’s height by default?'],
      checks: [
        web('The contents list follows the reader', `window.scrollTo(0, 700); await h.settle(); h.assert(window.scrollY > 300, 'The page did not scroll.'); ${near('h.rect(".toc").y', '16', 'While scrolling, the list should stay 16px from the top of the screen')}`, { visible: true }),
        T('The columns did not move', `window.scrollTo(0, 0); await h.settle(); const t = h.rect('.toc'); const m = h.rect('main'); ${near('t.x', '16', 'The contents list keeps its left column')} h.assert(m.x > t.right, 'The lesson stays to the right of the contents list.'); ${near('t.w', '160', 'The list stays 160px wide (padding included)')}`),
        T('Still following far down', `window.scrollTo(0, 1200); await h.settle(); ${near('h.rect(".toc").y', '16', 'Far down the page the list should still be 16px from the top')} const t = h.rect('.toc'); const m = h.rect('main'); h.assert(m.x > t.right, 'The lesson stays to the right of the list.');`),
        T('At the top it is where it started', `window.scrollTo(0, 0); await h.settle(); ${near('h.rect(".toc").y', '16', 'At the top of the page the list is at its normal place')}`),
      ],
      xpReward: 100, coinReward: 15,
    }),
  ],
};
