import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

/** Renders twice with different data (state must be replaced, not appended) and with hostile text (must be text, not HTML). */
const NASTY = '<b>bold</b><img src=x onerror=alert(1)>';

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-18-dom', title: 'The DOM: Changing the Page with JavaScript', language: 'web', skillId: 'js.dom',
    blurb: 'Select elements, change text, attributes and classes, and build lists from data (safely).', prerequisites: ['web-17-js-errors'], requires: [{ skill: 'web.html' }, { skill: 'web.css' }], xpReward: 65,
    reference: {
      title: 'The DOM',
      body: text(
        'The browser turns your HTML into a tree of objects, the **DOM**. Select: `document.querySelector("#id")`, `querySelectorAll(".x")` (a list; use `for...of` or `Array.from`). Change: `el.textContent = "..."` (safe text), `el.classList.add/remove/toggle("cls")`, `el.setAttribute("href", url)`, `el.dataset.id = 3` (`data-id`), `el.style.color`, `el.hidden = true`.',
        'Build: `const li = document.createElement("li"); li.textContent = name; list.append(li);`. Clear: `list.replaceChildren()`. **Never put untrusted text into `innerHTML`**: `<b>` or `<img onerror=...>` in a name would become real markup (an **XSS** vulnerability). `textContent` treats everything as plain text.',
      ),
      example: 'const list = document.querySelector("#machines");\nlist.replaceChildren();\nfor (const m of machines) {\n  const li = document.createElement("li");\n  li.textContent = `${m.name}: ${m.status}`;\n  li.classList.add(m.status);\n  list.append(li);\n}',
    },
    steps: [
      { kind: 'teach', title: 'The page is a tree you can edit', body: text('So far JavaScript only printed to the console. The real power is changing the **page**: your script can find any element, change its text, add and remove elements, or change how it looks by switching classes. Every interactive site is built on this.', 'A common pattern: keep the data in an array, and write a function that **renders** it into the page from scratch each time (clear, then rebuild). It is simple, it cannot get out of sync, and it is how many frameworks work.') },
      webDemo({
        title: 'Render a list from data',
        body: text('Run it. Then change the data (add a machine with the status `"down"`) and run again. Try putting `<b>Bold</b>` in a name and see that it stays text.'),
        files: files('<h1>Machines</h1>\n<ul id="machines"></ul>\n', '.down { color: #c0392b; font-weight: bold; }\n', 'const machines = [\n  { name: "Press", status: "running" },\n  { name: "Lathe", status: "down" },\n];\nconst list = document.querySelector("#machines");\nlist.replaceChildren();\nfor (const m of machines) {\n  const li = document.createElement("li");\n  li.textContent = `${m.name}: ${m.status}`;\n  li.classList.add(m.status);\n  list.append(li);\n}\n'),
        notice: 'The script finds the list, empties it, and adds one `li` per record. Using `textContent` means a machine called `<b>x</b>` shows those characters instead of becoming bold: that safety is not optional.',
      }),
      { kind: 'challenge', challengeId: 'web-18-update-status' },
      { kind: 'challenge', challengeId: 'web-18-render-machines' },
    ],
  },
  objectives: [{ id: 'js-obj-render-list', title: 'Render data into the page safely', summary: 'Build elements from an array with textContent, classes and data attributes; replace old content; handle empty data.' }],
  challenges: [
    wc({
      id: 'web-18-update-status', title: 'Update the Status Panel', mode: 'learning', skillIds: ['js.dom'], concepts: ['querySelector', 'textContent', 'classList', 'setAttribute'], difficulty: 2, context: 'engineering',
      prompt: text('The page has a heading `#title`, a status paragraph `#status` and an empty list `#alerts`. With JavaScript: set the heading text to `Machine M-7`; set the status text to `running` and give it the class `ok`; add two list items to `#alerts` with the texts `Oil low` and `Door open`; and set the `data-machine` attribute of `#title` to `M-7`.'),
      expectedBehavior: 'The page shows Machine M-7, a green-classed status, two alerts, and a data attribute on the heading.',
      guidedSteps: ['`document.querySelector("#title").textContent = ...`', '`el.classList.add("ok")`', 'Create each `li` with `createElement`, set `textContent`, and `append` it.', '`el.setAttribute("data-machine", "M-7")`.'],
      starterFiles: files('<h1 id="title">Loading...</h1>\n<p id="status">unknown</p>\n<ul id="alerts"></ul>\n', '.ok { color: #1b7f3b; }\n', ''), tabs: ['js'],
      hints: ['Every change starts by finding the element.', 'Text, classes and attributes each have their own property or method.', 'Build a new `li` for each alert; do not overwrite the whole list with one string.'],
      checks: [
        web('The heading', "h.eq(h.text('#title'), 'Machine M-7'); h.eq(h.attr('#title', 'data-machine'), 'M-7');"),
        web('The status', "h.eq(h.text('#status'), 'running'); h.assert(h.$('#status').classList.contains('ok'), 'Give the status the class ok.');"),
        web('The alerts', "h.eq(h.$$('#alerts > li').map((l) => h.norm(l.textContent)), ['Oil low', 'Door open']);"),
      ],
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-18-render-machines', objectiveId: 'js-obj-render-list', title: 'Render the Machine List', mode: 'challenge', skillIds: ['js.dom'], concepts: ['createElement', 'textContent', 'classList', 'dataset', 'rendering'], difficulty: 3, context: 'manufacturing',
      prompt: text('Write `renderMachines(machines)`. Each machine is `{ id, name, status }`. It must fill the list `#machines` with one `li` per machine showing `name: status` (for example `Press: running`), with the machine’s status as a class and its id in a `data-id` attribute. Calling it again **replaces** what was shown before. For an empty array, show a single `li` with the class `empty` and the text `No machines`. Names come from users, so they must never be interpreted as HTML.'),
      expectedBehavior: 'A list of machines rendered from data, replaced on each call, safe for any name.',
      starterFiles: files('<h1>Machines</h1>\n<ul id="machines"></ul>\n', 'li.down { color: #c0392b; }\n', ''), tabs: ['js'],
      hints: ['Every call starts from an empty list.', 'Each record becomes an element built from parts.', 'Clear with `replaceChildren()`, build with `createElement`, and set text with `textContent`.'],
      checks: [
        web('One item per machine', "renderMachines([{ id: 1, name: 'Press', status: 'running' }, { id: 2, name: 'Lathe', status: 'down' }]); const li = h.$$('#machines > li'); h.eq(li.map((l) => h.norm(l.textContent)), ['Press: running', 'Lathe: down']); h.assert(li[1].classList.contains('down') && li[0].classList.contains('running'), 'The status is a class.'); h.eq(li[0].dataset.id, '1'); h.eq(li[1].dataset.id, '2');"),
        web('A second call replaces the first', "renderMachines([{ id: 1, name: 'Press', status: 'running' }, { id: 2, name: 'Lathe', status: 'down' }]); renderMachines([{ id: 9, name: 'Saw', status: 'idle' }]); h.eq(h.$$('#machines > li').map((l) => h.norm(l.textContent)), ['Saw: idle']);", { visible: false }),
        web('The empty case', "renderMachines([{ id: 1, name: 'x', status: 'up' }]); renderMachines([]); const li = h.$$('#machines > li'); h.eq(li.length, 1); h.assert(li[0].classList.contains('empty'), 'The empty item has the class empty.'); h.eq(h.norm(li[0].textContent), 'No machines');", { visible: false }),
        web('Names are text, never HTML', `renderMachines([{ id: 1, name: ${JSON.stringify(NASTY)}, status: 'down' }]); h.eq(h.$$('#machines b, #machines img').length, 0, 'A name must not create elements'); h.eq(h.text('#machines li'), ${JSON.stringify(NASTY)} + ': down'); h.eq(h.dialogs.length, 0);`, { visible: false }),
        web('Nothing else changes', "renderMachines([{ id: 1, name: 'A', status: 'up' }]); h.eq(h.text('h1'), 'Machines');", { visible: false }),
      ],
      xpReward: 85, coinReward: 13,
    }),
    wc({
      id: 'web-18-render-leaderboard', objectiveId: 'js-obj-render-list', title: 'Render the Leaderboard', mode: 'challenge', skillIds: ['js.dom'], concepts: ['createElement', 'textContent', 'classList', 'dataset', 'rendering'], difficulty: 3, context: 'games',
      prompt: text('Write `renderLeaderboard(rows)`. Each row is `{ name, score }`. It fills the table body `#board` with one `tr` per player sorted by score (highest first, ties by name A to Z), each with three cells: the **rank** (1, 2, 3...), the name and the score. The first row has the class `top`. Calling it again **replaces** the rows; an empty array shows one row with a single cell spanning the table with the text `No scores yet`. Names come from players: never interpret them as HTML. The array you were given must not be reordered.'),
      expectedBehavior: 'A ranked leaderboard rendered from data, replaced on each call, safe for any name.',
      starterFiles: files('<table>\n  <thead><tr><th>#</th><th>Player</th><th>Score</th></tr></thead>\n  <tbody id="board"></tbody>\n</table>\n', '.top { font-weight: bold; }\n', ''), tabs: ['js'],
      hints: ['Sort a copy first; then build a row per player.', 'The rank comes from the position after sorting.', '`[...rows].sort(...)`, `forEach((r, i) => ...)`, and a cell with `colSpan = 3` for the empty case.'],
      checks: [
        web('Ranked rows', "const data = [{ name: 'Cy', score: 70 }, { name: 'Ada', score: 90 }, { name: 'Bo', score: 70 }]; renderLeaderboard(data); const rows = h.$$('#board > tr'); h.eq(rows.map((r) => Array.from(r.children).map((c) => h.norm(c.textContent))), [['1', 'Ada', '90'], ['2', 'Bo', '70'], ['3', 'Cy', '70']]); h.assert(rows[0].classList.contains('top') && !rows[1].classList.contains('top'), 'Only the first row has the class top.'); h.eq(data.map((d) => d.name), ['Cy', 'Ada', 'Bo'], 'The given array must not be reordered');"),
        web('A second call replaces the first', "renderLeaderboard([{ name: 'A', score: 1 }, { name: 'B', score: 2 }]); renderLeaderboard([{ name: 'Z', score: 5 }]); h.eq(h.$$('#board > tr').length, 1); h.eq(h.text('#board tr'), '1Z5');", { visible: false }),
        web('The empty case', "renderLeaderboard([{ name: 'A', score: 1 }]); renderLeaderboard([]); const rows = h.$$('#board > tr'); h.eq(rows.length, 1); h.eq(rows[0].children.length, 1); h.eq(rows[0].children[0].colSpan, 3); h.eq(h.norm(rows[0].textContent), 'No scores yet');", { visible: false }),
        web('Names are text', `renderLeaderboard([{ name: ${JSON.stringify(NASTY)}, score: 3 }]); h.eq(h.$$('#board b, #board img').length, 0, 'A name must not create elements'); h.eq(h.$$('#board td')[1].textContent, ${JSON.stringify(NASTY)});`, { visible: false }),
      ],
      xpReward: 85, coinReward: 13,
    }),
    wc({
      id: 'web-18-render-cards', objectiveId: 'js-obj-render-list', title: 'Render the Product Cards', mode: 'challenge', skillIds: ['js.dom'], concepts: ['createElement', 'textContent', 'classList', 'dataset', 'rendering'], difficulty: 3, context: 'retail',
      prompt: text('Write `renderCards(products)`. Each product is `{ sku, name, price, stock }`. It fills `#cards` with one `article` with the class `card` per product, with the sku in a `data-sku` attribute, containing an `h3` with the name and a `p` with the class `price` showing the price as `£` and two decimals (`£4.50`). Products with a stock of 0 also get the class `sold-out` and contain a `span` with the class `badge` and the text `Sold out`. Calling it again replaces the cards; for an empty array show a single `p` with the class `empty` and the text `Nothing to show`. Names come from suppliers: never interpret them as HTML.'),
      expectedBehavior: 'A grid of product cards rendered from data, replaced on each call, safe for any name.',
      starterFiles: files('<div id="cards"></div>\n', '.sold-out { opacity: .5; }\n', ''), tabs: ['js'],
      hints: ['A card is a small tree: article, heading, price, maybe a badge.', 'Format the price with `toFixed(2)`.', 'Build every element with `createElement`, set text with `textContent`, and `append` children.'],
      checks: [
        web('Cards from data', "renderCards([{ sku: 'B1', name: 'Bolt', price: 4.5, stock: 10 }, { sku: 'G2', name: 'Gear', price: 12, stock: 0 }]); const c = h.$$('#cards > article.card'); h.eq(c.length, 2); h.eq(c[0].dataset.sku, 'B1'); h.eq(h.norm(c[0].querySelector('h3').textContent), 'Bolt'); h.eq(h.norm(c[0].querySelector('p.price').textContent), '£4.50'); h.eq(h.norm(c[1].querySelector('p.price').textContent), '£12.00');"),
        web('Sold out', "renderCards([{ sku: 'B1', name: 'Bolt', price: 4.5, stock: 10 }, { sku: 'G2', name: 'Gear', price: 12, stock: 0 }, { sku: 'H3', name: 'Hose', price: 3, stock: 3 }]); const c = h.$$('#cards > article'); h.assert(!c[0].classList.contains('sold-out') && !c[0].querySelector('.badge'), 'In-stock items have no badge.'); h.assert(!c[2].classList.contains('sold-out') && !c[2].querySelector('.badge'), 'Only zero stock is sold out.'); h.assert(c[1].classList.contains('sold-out'), 'Zero stock gets the class sold-out.'); h.eq(h.norm(c[1].querySelector('span.badge').textContent), 'Sold out');", { visible: false }),
        web('A second call replaces the first; the empty case', "renderCards([{ sku: 'A', name: 'A', price: 1, stock: 1 }, { sku: 'B', name: 'B', price: 1, stock: 1 }]); renderCards([{ sku: 'C', name: 'C', price: 2, stock: 3 }]); h.eq(h.$$('#cards > article').length, 1); renderCards([]); h.eq(h.$$('#cards > article').length, 0); h.eq(h.norm(h.$('#cards > p.empty').textContent), 'Nothing to show'); h.eq(h.$$('#cards > *').length, 1);", { visible: false }),
        web('Names are text', `renderCards([{ sku: 'X', name: ${JSON.stringify(NASTY)}, price: 1, stock: 1 }]); h.eq(h.$$('#cards b, #cards img').length, 0, 'A name must not create elements'); h.eq(h.$('#cards h3').textContent, ${JSON.stringify(NASTY)});`, { visible: false }),
      ],
      xpReward: 85, coinReward: 13,
    }),
  ],
};
