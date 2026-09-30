import type { Challenge, WebCheck } from '../schema';
import { S, files, jsCalls, wc, web } from '../web/helpers';
import type { DailyMeta } from '../schema';

/**
 * Web Daily Challenges: independent-style (no hints, no concept tags, every check hidden). Briefs describe the
 * finished behaviour only. The grader is real Chromium (see content/web), the same as for web lessons.
 */
type WebDailyDef = { id: string; title: string; skillIds: string[]; difficulty: 1 | 2 | 3 | 4 | 5; context: string; prompt: string; starter?: ReturnType<typeof files>; tabs: ('html' | 'css' | 'js')[]; checks: WebCheck[]; api?: boolean; daily: DailyMeta; transfer?: boolean };

const wd = (d: WebDailyDef): Challenge => ({
  ...wc({ id: d.id, title: d.title, mode: 'independent', skillIds: d.skillIds, concepts: [], difficulty: d.difficulty, context: d.context, prompt: d.prompt, hints: [], starterFiles: d.starter ?? files('', '', ''), tabs: d.tabs, checks: d.checks.map((c) => ({ ...c, visible: false })), api: d.api, xpReward: 0, coinReward: 0, transfer: d.transfer }),
  daily: d.daily,
});

const T = (name: string, script: string, o: Partial<Omit<WebCheck, 'kind' | 'name' | 'script'>> = {}) => web(name, script, { visible: false, ...o });
const NOSCROLL = "h.assert(document.documentElement.scrollWidth <= h.viewport.w + 1, 'The page scrolls sideways on a ' + h.viewport.w + 'px screen.');";
const near = (a: string, b: string, why: string) => `h.assert(Math.abs((${a}) - (${b})) <= 1.5, ${JSON.stringify(why)} + ' (got ' + Math.round((${a}) * 10) / 10 + ')');`;

export const HTMLS = {
  badges: '<div class="badges">\n  <span class="badge">Running</span>\n  <span class="badge">Idle</span>\n  <span class="badge">Down</span>\n</div>\n',
  twoCol: '<div class="layout">\n  <nav class="side">Menu</nav>\n  <main class="content">Content</main>\n</div>\n',
  cards: '<div class="cards">\n  <div class="card">1</div>\n  <div class="card">2</div>\n  <div class="card">3</div>\n  <div class="card">4</div>\n  <div class="card">5</div>\n  <div class="card">6</div>\n</div>\n',
  tabs: '<div class="tabs">\n  <button role="tab" data-panel="p1" aria-selected="true">Status</button>\n  <button role="tab" data-panel="p2" aria-selected="false">Alerts</button>\n  <button role="tab" data-panel="p3" aria-selected="false">Log</button>\n</div>\n<section id="p1" role="tabpanel">All clear.</section>\n<section id="p2" role="tabpanel" hidden>Two alerts.</section>\n<section id="p3" role="tabpanel" hidden>Nothing logged.</section>\n',
  accordion: '<div class="acc">\n  <div class="item"><button aria-expanded="false">Safety</button><div class="panel" hidden>Wear goggles.</div></div>\n  <div class="item"><button aria-expanded="false">Tools</button><div class="panel" hidden>Return them.</div></div>\n  <div class="item"><button aria-expanded="false">Waste</button><div class="panel" hidden>Sort it.</div></div>\n</div>\n',
  order: '<table>\n  <tbody>\n    <tr data-price="4.5"><td>Bolts</td><td><input class="qty" value="0" aria-label="Bolts quantity"></td></tr>\n    <tr data-price="12"><td>Gears</td><td><input class="qty" value="0" aria-label="Gears quantity"></td></tr>\n    <tr data-price="0.75"><td>Washers</td><td><input class="qty" value="0" aria-label="Washers quantity"></td></tr>\n  </tbody>\n</table>\n<p id="subtotal"></p>\n<p id="discount"></p>\n<p id="total"></p>\n',
  theme: '<button id="theme">Dark mode</button>\n<p>Hello</p>\n',
  top: '<h2>Top home-run hitters</h2>\n<p id="state"></p>\n<ol id="top"></ol>\n',
  stock: '<p id="state"></p>\n<p id="low-count"></p>\n<ul id="stock"></ul>\n',
  online: '<button id="check">Check service</button>\n<p id="status"></p>\n',
  join: '<form id="join">\n  <label>Team name <input id="name"></label>\n  <label>City <input id="city"></label>\n  <button type="submit">Join</button>\n</form>\n<p id="msg"></p>\n<ul id="teams"></ul>\n',
};

const noSpaces = (...ids: string[]) => ids.join(',');
void noSpaces;

const MEDIAN_REF = '(a) => { if (a.length === 0) return null; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }';
const SUMBY_REF = '(items, key, valueKey) => { const out = {}; for (const it of items) { const v = it[valueKey]; if (typeof v !== "number" || !Number.isFinite(v)) continue; out[it[key]] = (out[it[key]] || 0) + Math.round(v * 100); } for (const k of Object.keys(out)) out[k] = out[k] / 100; return out; }';
const SLUG_REF = '(t) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")';
const DUR_REF = '(text) => { const m = /^(?:(\\d+)h)?\\s*(?:(\\d+)m)?$/.exec(text.trim()); if (!m || (!m[1] && !m[2])) return null; return Number(m[1] || 0) * 60 + Number(m[2] || 0); }';
const LATEST_REF = '(rows) => { const by = new Map(); for (const r of rows) { const cur = by.get(r.id); if (!cur || r.updated >= cur.updated) by.set(r.id, r); } return [...by.values()].sort((a, b) => a.id - b.id); }';
const q = (s: string) => JSON.stringify(s);

export const webDailies: Challenge[] = [
  wd({
    id: 'daily-web-status-page', title: 'The Line 3 Status Page', skillIds: ['web.html', 'web.semantics'], difficulty: 3, context: 'manufacturing', tabs: ['html'], daily: { focus: 'review', requires: ['web-04-semantics'] },
    prompt: 'Write a complete page for the status of Line 3. It has a title and a stated language, exactly one main heading `Line 3 Status`, one introductory paragraph, and below it a table of the day’s machines with a caption, the column headings Machine, State and Output, and three rows: Press, running, 340; Lathe, idle, 0; Welder, running, 128. It must make sense to a screen reader: headings and the table’s structure must say what they are, not just look right.',
    checks: [
      T('The document', `${S.doctype} ${S.lang} ${S.title}`),
      T('Headings and text', "h.eq(h.$$('h1').length, 1, 'Exactly one h1'); h.eq(h.text('h1'), 'Line 3 Status'); h.assert(h.$$('p').some((p) => h.norm(p.textContent).length > 10), 'An introductory paragraph.');"),
      T('The table', "const t = h.$('table'); h.assert(t.querySelector('caption') && h.norm(t.querySelector('caption').textContent).length > 0, 'A caption.'); const th = [...t.querySelectorAll('th')]; h.eq(th.filter((c) => c.getAttribute('scope') === 'col').map((c) => h.norm(c.textContent)), ['Machine', 'State', 'Output'], 'Column headings tied to their columns'); h.eq([...t.querySelectorAll('tbody tr')].map((r) => [...r.children].map((c) => h.norm(c.textContent)).join('|')), ['Press|running|340', 'Lathe|idle|0', 'Welder|running|128']); h.assert(t.querySelector('thead th'), 'Put the headings in a thead.');"),
    ],
  }),
  wd({
    id: 'daily-web-signup-rules', title: 'The Registration Form', skillIds: ['web.forms', 'web.html'], difficulty: 3, context: 'education', tabs: ['html'], daily: { focus: 'either', requires: ['web-05-forms'] },
    prompt: 'Write a registration form that works without any scripting: the browser itself must refuse bad input and the form has a button that sends it. Fields: an email address (required, and it must look like an email); an age (required, a whole number from 18 to 65 inclusive); a username (required, 3 to 12 characters, letters and digits only); and a checkbox accepting the terms (required). Every field has a visible label connected to it.',
    checks: [
      T('The controls and labels', "h.assert(h.$('form'), 'A form.'); for (const s of ['input[type=email]', 'input[type=number]', 'input[type=checkbox]']) { h.assert(document.querySelector(s), 'A ' + s + ' control.'); h.assert(h.labelText(s).length > 0, 'The control ' + s + ' needs a connected label.'); } const user = document.querySelector('input[type=text], input:not([type])'); h.assert(user, 'A username box.'); h.assert(h.labelText('input[type=text], input:not([type])').length > 0, 'The username needs a label.'); h.assert(h.$('form button[type=submit], form input[type=submit], form button:not([type])'), 'A submit button.');"),
      T('A valid registration', "const f = h.$('form'); h.type('input[type=email]', 'ada@example.com'); h.type('input[type=number]', '30'); h.type('input[type=text], input:not([type])', 'ada99'); h.check('input[type=checkbox]', true); h.assert(f.checkValidity(), 'Valid input must be accepted: ' + [...f.elements].filter((e) => e.validationMessage).map((e) => e.name + ': ' + e.validationMessage).join('; '));"),
      T('Each rule is enforced', "const f = h.$('form'); const ok = () => { h.type('input[type=email]', 'ada@example.com'); h.type('input[type=number]', '30'); h.type('input[type=text], input:not([type])', 'ada99'); h.check('input[type=checkbox]', true); }; const bad = (why, fn) => { ok(); fn(); h.assert(!f.checkValidity(), why); }; bad('An email is required.', () => h.type('input[type=email]', '')); bad('An invalid email is refused.', () => h.type('input[type=email]', 'nope')); bad('Age 17 is too young.', () => h.type('input[type=number]', '17')); bad('Age 66 is too old.', () => h.type('input[type=number]', '66')); bad('Age must be a whole number.', () => h.type('input[type=number]', '30.5')); bad('An age is required.', () => h.type('input[type=number]', '')); bad('A username is required.', () => h.type('input[type=text], input:not([type])', '')); bad('Two characters is too short.', () => h.type('input[type=text], input:not([type])', 'ab')); bad('Punctuation is not allowed.', () => h.type('input[type=text], input:not([type])', 'a-b_c')); bad('The terms must be accepted.', () => h.check('input[type=checkbox]', false)); ok(); h.type('input[type=text], input:not([type])', 'x'.repeat(13)); const u = h.$('input[type=text], input:not([type])'); h.assert(u.value.length <= 12 || !f.checkValidity(), 'A 13-character username must be refused (or not typeable).');"),
      T('The boundaries', "const f = h.$('form'); const set = (age, user) => { h.type('input[type=email]', 'ada@example.com'); h.type('input[type=number]', age); h.type('input[type=text], input:not([type])', user); h.check('input[type=checkbox]', true); }; set('18', 'abc'); h.assert(f.checkValidity(), 'Age 18 and a 3-character name are allowed.'); set('65', 'a'.repeat(12)); h.assert(f.checkValidity(), 'Age 65 and a 12-character name are allowed.'); set('18', 'Ab1'); h.assert(f.checkValidity(), 'Capitals and digits are allowed.');"),
    ],
  }),
  wd({
    id: 'daily-web-badge-row', title: 'The Status Badges', skillIds: ['web.css', 'web.layout'], difficulty: 3, context: 'software', tabs: ['css'], starter: files(HTMLS.badges, '', ''), daily: { focus: 'review', requires: ['web-10-flexbox'] },
    prompt: 'Style the three status badges. They sit on one line, left to right, with **8px** between neighbours. Each badge is a pill: **6px** of space above and below its text and **14px** on each side, corners rounded fully (a radius of at least half its height), text in white, bold, **14px**. The first is green (`#1b7f3b`), the second amber (`#b57600`), the third red (`#b00020`). The badges must stay on one line and the page must not scroll sideways on a 320px-wide screen.',
    checks: [
      T('The row', "const b = h.$$('.badge').map((x) => x.getBoundingClientRect()); h.assert(b.every((r) => Math.abs(r.top - b[0].top) < 2), 'One line.'); " + near('b[1].left - b[0].right', '8', 'The gap between badges is 8px') + near('b[2].left - b[1].right', '8', 'The gap between badges is 8px') + " h.assert(b[0].left < b[1].left && b[1].left < b[2].left, 'Left to right.');"),
      T('The pills', "for (const el of h.$$('.badge')) { const c = getComputedStyle(el); h.eq(c.paddingTop, '6px'); h.eq(c.paddingBottom, '6px'); h.eq(c.paddingLeft, '14px'); h.eq(c.paddingRight, '14px'); h.eq(c.color, 'rgb(255, 255, 255)'); h.eq(c.fontWeight, '700'); h.eq(c.fontSize, '14px'); const r = el.getBoundingClientRect(); h.assert(parseFloat(c.borderTopLeftRadius) >= r.height / 2 - 0.5, 'Fully rounded corners.'); }"),
      T('The colours', "const want = ['rgb(27, 127, 59)', 'rgb(181, 118, 0)', 'rgb(176, 0, 32)']; h.eq(h.$$('.badge').map((e) => getComputedStyle(e).backgroundColor), want);"),
      T('A small screen', "const b = h.$$('.badge').map((x) => x.getBoundingClientRect()); h.assert(b.every((r) => Math.abs(r.top - b[0].top) < 2), 'Still one line at 320px.'); " + NOSCROLL, { viewport: { width: 320 } }),
    ],
  }),
  wd({
    id: 'daily-web-two-column', title: 'The Two-Column Page', skillIds: ['web.layout', 'web.css'], difficulty: 4, context: 'business', tabs: ['css'], starter: files(HTMLS.twoCol, '', ''), daily: { focus: 'review', requires: ['web-12-responsive'] },
    prompt: 'Lay out the page. On screens **700px wide or more**, the menu is a column exactly **240px** wide on the left and the content fills all the remaining width to its right; both are the height of the taller one, and there is **20px** between them and **16px** of space around the whole layout. On narrower screens the content sits **below** the menu, both the full width of the layout. Menu background `#1a3a6b` with white text, content background `#f2f5fa`; both have **12px** padding that is included in their sizes. The page never scrolls sideways.',
    checks: [
      T('Wide screens', "const s = h.rect('.side'); const c = h.rect('.content'); const l = h.rect('.layout'); " + near('s.w', '240', 'The menu is 240px wide') + near('c.left - s.right', '20', 'There are 20px between the columns') + near('c.right', 'h.viewport.w - 16', 'The content reaches the right-hand margin') + near('s.left', '16', '16px of margin on the left') + " h.assert(Math.abs(s.top - c.top) < 1.5, 'The columns start together.'); " + near('s.h', 'c.h', 'Columns are equally tall') + NOSCROLL, { viewport: { width: 1000 } }),
      T('Exactly at the breakpoint', "const s = h.rect('.side'); const c = h.rect('.content'); h.assert(c.left > s.right, 'At exactly 700px the columns are side by side.'); " + near('s.w', '240', 'The menu is 240px wide'), { viewport: { width: 700 } }),
      T('Narrow screens', "const s = h.rect('.side'); const c = h.rect('.content'); h.assert(c.top >= s.bottom - 1, 'The content is below the menu.'); " + near('s.w', 'h.viewport.w - 32', 'The menu is the full width') + near('c.w', 'h.viewport.w - 32', 'The content is the full width') + NOSCROLL, { viewport: { width: 500 } }),
      T('Just under the breakpoint', "const s = h.rect('.side'); const c = h.rect('.content'); h.assert(c.top >= s.bottom - 1, 'At 699px the columns stack.');", { viewport: { width: 699 } }),
      T('Colours and padding', "const s = getComputedStyle(h.$('.side')); const c = getComputedStyle(h.$('.content')); h.eq(s.backgroundColor, 'rgb(26, 58, 107)'); h.eq(s.color, 'rgb(255, 255, 255)'); h.eq(c.backgroundColor, 'rgb(242, 245, 250)'); h.eq(s.paddingLeft, '12px'); h.eq(c.paddingTop, '12px');", { viewport: { width: 1000 } }),
    ],
  }),
  wd({
    id: 'daily-web-card-columns', title: 'The Adaptive Card Grid', skillIds: ['web.layout'], difficulty: 3, context: 'retail', tabs: ['css'], starter: files(HTMLS.cards, '', ''), daily: { focus: 'either', requires: ['web-11-grid'] },
    prompt: 'Style the six cards as a grid with **16px** between cards in both directions. On a screen **900px or wider** there are three columns; from **600px up to 899px** two columns; under **600px** one. The columns are always equal widths that fill the space, and the layout has **16px** of space on each side. Cards are at least **80px** tall. The page never scrolls sideways.',
    checks: [
      T('Wide', "const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.eq(new Set(c.map((r) => Math.round(r.left))).size, 3, 'Three columns'); " + near('c[1].left - c[0].right', '16', 'Column gap 16px') + near('c[3].top - c[0].bottom', '16', 'Row gap 16px') + near('c[0].left', '16', '16px on the left') + near('c[2].right', 'h.viewport.w - 16', '16px on the right') + " h.assert(c.every((r) => r.height >= 79.5), 'At least 80px tall.'); " + near('c[0].width', 'c[1].width', 'Equal columns') + NOSCROLL, { viewport: { width: 1000 } }),
      T('Medium', "const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.eq(new Set(c.map((r) => Math.round(r.left))).size, 2, 'Two columns at 700px'); " + near('c[1].left - c[0].right', '16', 'Column gap 16px') + NOSCROLL, { viewport: { width: 700 } }),
      T('The upper breakpoint', "const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.eq(new Set(c.map((r) => Math.round(r.left))).size, 3, 'Three columns at exactly 900px');", { viewport: { width: 900 } }),
      T('Just below', "const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.eq(new Set(c.map((r) => Math.round(r.left))).size, 2, 'Two columns at 899px'); const d = h.$$('.card').map((x) => x.getBoundingClientRect()); h.assert(d[0].width > 0);", { viewport: { width: 899 } }),
      T('Narrow', "const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.eq(new Set(c.map((r) => Math.round(r.left))).size, 1, 'One column at 400px'); " + near('c[1].top - c[0].bottom', '16', 'Row gap 16px') + near('c[0].width', 'h.viewport.w - 32', 'The card fills the width') + NOSCROLL, { viewport: { width: 400 } }),
      T('Lower breakpoint', "const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.eq(new Set(c.map((r) => Math.round(r.left))).size, 2, 'Two columns at exactly 600px'); const e = 0;", { viewport: { width: 600 } }),
      T('Just below 600', "const c = h.$$('.card').map((x) => x.getBoundingClientRect()); h.eq(new Set(c.map((r) => Math.round(r.left))).size, 1, 'One column at 599px');", { viewport: { width: 599 } }),
    ],
  }),
  wd({
    id: 'daily-js-median', title: 'The Median Reading', skillIds: ['js.data', 'js.basics'], difficulty: 3, context: 'science', tabs: ['js'], daily: { focus: 'review', requires: ['web-16-js-data'] },
    prompt: 'Write `median(numbers)`: the middle value of a list of numbers once they are in order; for an even count, the mean of the two middle values. An empty list gives `null`. The list you are given must not be changed.',
    checks: jsCalls('median', MEDIAN_REF, ['[3, 1, 2]', '[4, 1, 3, 2]', '[]', '[7]', '[10, 2, 33, 4]', '[-5, -1, -3]', '[1.5, 2.5]', '[2, 2, 2, 9]', '[100, 20, 3]'], { pure: true }),
  }),
  wd({
    id: 'daily-js-sum-by', title: 'Totals Per Category', skillIds: ['js.data'], difficulty: 3, context: 'finance', tabs: ['js'], daily: { focus: 'review', requires: ['web-16-js-data'] },
    prompt: 'Write `sumBy(items, key, valueKey)`. It returns an object with one entry per distinct value of `item[key]`, holding the total of `item[valueKey]` for those items, rounded to 2 decimal places. An item whose value is not a finite number is ignored (it does not count as zero, and a category made only of such items does not appear). The input must not be changed.',
    checks: jsCalls('sumBy', SUMBY_REF, ['[{ dept: "A", cost: 1.1 }, { dept: "B", cost: 2 }, { dept: "A", cost: 2.2 }], "dept", "cost"', '[], "dept", "cost"', '[{ k: "x", v: 0.1 }, { k: "x", v: 0.2 }], "k", "v"', '[{ k: "x", v: "5" }, { k: "y", v: null }, { k: "x", v: 3 }], "k", "v"', '[{ k: "a", v: NaN }, { k: "a", v: Infinity }], "k", "v"', '[{ id: 1, n: 19.99 }, { id: 1, n: 0.01 }, { id: 2, n: -4.5 }], "id", "n"'], { pure: true }),
  }),
  wd({
    id: 'daily-js-slugify', title: 'The URL Slug', skillIds: ['js.basics'], difficulty: 3, context: 'marketing', tabs: ['js'], daily: { focus: 'review', requires: ['web-15-js-basics'] },
    prompt: 'Write `slugify(title)` that turns a title into a URL-friendly slug: lower case; every run of characters that are not a–z or 0–9 becomes a single dash; no dash at the start or end. (`"Hello, World!"` gives `hello-world`.)',
    checks: jsCalls('slugify', SLUG_REF, ['"Hello, World!"', '"  Many   spaces  "', '"---"', '""', '"Already-a-slug"', '"Version 2.0 (final)"', '"Crème brûlée"', '"A&B"', '"x"', '"snake_case_name"', '"_lead_"'], {}),
  }),
  wd({
    id: 'daily-js-parse-duration', title: 'The Duration Reader', skillIds: ['js.basics', 'js.forms'], difficulty: 4, context: 'scheduling', tabs: ['js'], daily: { focus: 'either', requires: ['web-17-js-errors'] },
    prompt: 'Write `parseDuration(text)` that reads a length of time like `1h 30m`, `45m` or `2h` and returns the total number of **minutes** as a number. Hours (`<digits>h`) come first and minutes (`<digits>m`) second; either may be missing but not both; whitespace between them is optional; spaces around the whole text are ignored. Anything else (empty text, other units, decimals, minutes before hours, extra text) gives `null`. Minutes above 59 are fine (`1h 75m` is 135).',
    checks: jsCalls('parseDuration', DUR_REF, ['"1h 30m"', '"45m"', '"2h"', '""', '"h"', '"1h30m"', '"30m 1h"', '"1.5h"', '"  1h  "', '"1h 75m"', '"90"', '"0m"', '"10 m"', '"1h 30m 5s"', '"12h 0m"', '"100m"', '"1h 120m"', '"007m"'], { group: 5 }),
  }),
  wd({
    id: 'daily-js-latest-per-id', title: 'The Latest Version of Each Record', skillIds: ['js.data'], difficulty: 4, context: 'data entry', tabs: ['js'], daily: { focus: 'review', requires: ['web-16-js-data'] },
    prompt: 'A sync sends records `{ id, updated, value }` where `updated` is a date text like `"2024-05-03"` (dates in this format compare correctly as text). Write `latestPerId(records)` returning one record per id: the one with the latest `updated`; if two have the same date, the one that appears later in the list wins. The result is ordered by `id`, smallest first (ids are numbers). The input must not be changed.',
    checks: jsCalls('latestPerId', LATEST_REF, ['[{ id: 2, updated: "2024-01-05", value: "a" }, { id: 1, updated: "2024-01-01", value: "b" }, { id: 2, updated: "2024-02-01", value: "c" }]', '[]', '[{ id: 1, updated: "2024-01-01", value: "old" }, { id: 1, updated: "2024-01-01", value: "new" }]', '[{ id: 10, updated: "2024-03-01", value: 1 }, { id: 9, updated: "2024-03-01", value: 2 }, { id: 10, updated: "2023-12-31", value: 3 }]', '[{ id: 5, updated: "2024-06-01", value: "x" }]'], { pure: true }),
  }),
  wd({
    id: 'daily-js-first-success', title: 'The Fastest Mirror', skillIds: ['js.async'], difficulty: 4, context: 'engineering', tabs: ['js'], daily: { focus: 'either', requires: ['web-22-async'] },
    prompt: 'Write `firstSuccess(tasks)`. `tasks` is a list of functions, each returning a promise. Start them all at once. The result is a promise that succeeds with the value of whichever task **succeeds first**. Tasks that fail are ignored unless every task fails (or there are none), in which case the result fails with an `Error` whose message is `all failed`.',
    checks: [
      T('The fastest success', "const at = (ms, v) => () => new Promise((r) => setTimeout(() => r(v), ms)); let out; firstSuccess([at(300, 'A'), at(100, 'B'), at(200, 'C')]).then((v) => { out = v; }); await h.tick(99); h.eq(out, undefined, 'Nothing yet'); await h.tick(2); h.eq(out, 'B');"),
      T('Failures are ignored', "const fail = (ms) => () => new Promise((_, rej) => setTimeout(() => rej(new Error('x')), ms)); const at = (ms, v) => () => new Promise((r) => setTimeout(() => r(v), ms)); let out; firstSuccess([fail(50), at(200, 'ok'), fail(100)]).then((v) => { out = v; }, (e) => { out = 'err:' + e.message; }); await h.tick(150); h.eq(out, undefined, 'A failure is not a result'); await h.tick(60); h.eq(out, 'ok');"),
      T('Everything fails', "const fail = (ms) => () => new Promise((_, rej) => setTimeout(() => rej(new Error('x' + ms)), ms)); let out; firstSuccess([fail(10), fail(30), fail(20)]).then((v) => { out = 'ok:' + v; }, (e) => { out = 'err:' + e.message; }); await h.tick(25); h.eq(out, undefined, 'Wait for all of them'); await h.tick(10); h.eq(out, 'err:all failed');"),
      T('Nothing to try, and immediate answers', "let a; firstSuccess([]).catch((e) => { a = e.message; }); await h.tick(0); h.eq(a, 'all failed'); let b; firstSuccess([() => Promise.resolve(1), () => Promise.resolve(2)]).then((v) => { b = v; }); await h.tick(0); h.eq(b, 1, 'The first to succeed, in start order when they tie'); let c; firstSuccess([() => { throw new Error('sync'); }, () => Promise.resolve('fine')]).then((v) => { c = v; }, (e) => { c = 'err:' + e.message; }); await h.tick(0); h.eq(c, 'fine', 'A task that throws straight away is a failure');"),
    ],
  }),
  wd({
    id: 'daily-js-debounce', title: 'The Quiet-Period Wrapper', skillIds: ['js.async', 'js.basics'], difficulty: 4, context: 'software', tabs: ['js'], daily: { focus: 'review', requires: ['web-22-async'] },
    prompt: 'Write `debounce(fn, ms)` returning a new function. Calling the new function does not call `fn` at once: `fn` is called **once**, `ms` milliseconds after the **last** call, with the arguments of that last call. Each new call restarts the wait. Separate debounced functions do not affect one another.',
    checks: [
      T('One call after a pause', "const seen = []; const d = debounce((x) => seen.push(x), 100); d('a'); await h.tick(99); h.eq(seen, [], 'Not before the delay'); await h.tick(1); h.eq(seen, ['a']); await h.tick(500); h.eq(seen, ['a'], 'Only once');"),
      T('A burst is one call', "const seen = []; const d = debounce((...a) => seen.push(a.join('+')), 100); d(1); await h.tick(50); d(2, 3); await h.tick(50); d(4, 5); await h.tick(99); h.eq(seen, [], 'The wait restarts with every call'); await h.tick(1); h.eq(seen, ['4+5'], 'The last arguments only');"),
      T('Independent wrappers and later bursts', "const a = []; const b = []; const da = debounce(() => a.push(1), 100); const db = debounce(() => b.push(1), 50); da(); db(); await h.tick(60); h.eq([a.length, b.length], [0, 1]); await h.tick(40); h.eq([a.length, b.length], [1, 1]); da(); await h.tick(100); h.eq(a.length, 2, 'It works again after a pause');"),
    ],
  }),
  wd({
    id: 'daily-web-tabs', title: 'The Tab Panel', skillIds: ['js.dom', 'web.semantics'], difficulty: 3, context: 'software', tabs: ['js'], starter: files(HTMLS.tabs, '', ''), daily: { focus: 'current', requires: ['web-19-events'] },
    prompt: 'Make the tabs work. Choosing a tab shows its panel (the one its `data-panel` names) and hides the others, marks that tab as the selected one (and only that one) for assistive technology, and nothing else changes. With a tab focused, the Right arrow key selects the next tab and the Left arrow key the previous one, wrapping around at the ends.',
    checks: [
      T('The start', "h.eq(h.$$('[role=tab]').map((t) => t.getAttribute('aria-selected')), ['true', 'false', 'false']); h.eq(h.$$('[role=tabpanel]').map((p) => p.hidden), [false, true, true]);"),
      T('Choosing tabs', "const sel = () => h.$$('[role=tab]').map((t) => t.getAttribute('aria-selected')).join(); const shown = () => h.$$('[role=tabpanel]').map((p) => p.hidden ? 0 : 1).join(); h.click('[data-panel=p3]'); h.eq(sel(), 'false,false,true'); h.eq(shown(), '0,0,1'); h.click('[data-panel=p2]'); h.eq(sel(), 'false,true,false'); h.eq(shown(), '0,1,0'); h.click('[data-panel=p2]'); h.eq(shown(), '0,1,0', 'Choosing the same tab again keeps it open'); h.click('[data-panel=p1]'); h.eq(shown(), '1,0,0');"),
      T('Arrow keys', "const sel = () => h.$$('[role=tab]').map((t) => t.getAttribute('aria-selected')).join(); h.press('[data-panel=p1]', 'ArrowRight'); h.eq(sel(), 'false,true,false', 'Right arrow: next'); h.press('[data-panel=p2]', 'ArrowRight'); h.eq(sel(), 'false,false,true'); h.press('[data-panel=p3]', 'ArrowRight'); h.eq(sel(), 'true,false,false', 'Right arrow wraps to the first'); h.press('[data-panel=p1]', 'ArrowLeft'); h.eq(sel(), 'false,false,true', 'Left arrow wraps to the last'); h.press('[data-panel=p3]', 'ArrowLeft'); h.eq(sel(), 'false,true,false'); h.eq(h.$$('[role=tabpanel]').map((p) => p.hidden ? 0 : 1).join(), '0,1,0', 'The panel follows the arrow keys');"),
      T('Other keys do nothing', "const sel = () => h.$$('[role=tab]').map((t) => t.getAttribute('aria-selected')).join(); h.press('[data-panel=p1]', 'ArrowDown'); h.press('[data-panel=p1]', 'a'); h.eq(sel(), 'true,false,false');"),
    ],
  }),
  wd({
    id: 'daily-web-accordion', title: 'The FAQ Accordion', skillIds: ['js.dom', 'web.semantics'], difficulty: 3, context: 'customer service', tabs: ['js'], starter: files(HTMLS.accordion, '', ''), daily: { focus: 'current', requires: ['web-19-events'] },
    prompt: 'Make the accordion work. Choosing a heading button opens its panel (and says so for assistive technology); choosing an open one closes it; **at most one panel is open at a time**, so opening one closes any other. Keyboard use must work as it does for any button.',
    checks: [
      T('Start closed', "h.eq(h.$$('.item button').map((b) => b.getAttribute('aria-expanded')), ['false', 'false', 'false']); h.eq(h.$$('.panel').map((p) => p.hidden), [true, true, true]);"),
      T('Open and close', "const open = () => h.$$('.panel').map((p) => p.hidden ? 0 : 1).join(); const exp = () => h.$$('.item button').map((b) => b.getAttribute('aria-expanded')).join(); h.click('.item:nth-child(2) button'); h.eq(open(), '0,1,0'); h.eq(exp(), 'false,true,false'); h.click('.item:nth-child(2) button'); h.eq(open(), '0,0,0', 'Choosing an open one closes it'); h.eq(exp(), 'false,false,false');"),
      T('Only one at a time', "const open = () => h.$$('.panel').map((p) => p.hidden ? 0 : 1).join(); const exp = () => h.$$('.item button').map((b) => b.getAttribute('aria-expanded')).join(); h.click('.item:nth-child(1) button'); h.click('.item:nth-child(3) button'); h.eq(open(), '0,0,1'); h.eq(exp(), 'false,false,true'); h.click('.item:nth-child(1) button'); h.eq(open(), '1,0,0');"),
      T('Real buttons', "h.assert(h.$$('.item button').every((b) => b.tagName === 'BUTTON'), 'Keep the headings as buttons so the keyboard works.');"),
    ],
  }),
  wd({
    id: 'daily-web-live-total', title: 'The Live Order Total', skillIds: ['js.forms', 'js.dom'], difficulty: 3, context: 'retail', tabs: ['js'], starter: files(HTMLS.order, '', ''), daily: { focus: 'either', requires: ['web-20-forms-js'] },
    prompt: 'The order table has a quantity box per row and each row’s `data-price` is its unit price. As the person types, keep three lines up to date, each written like `£12.50`: `#subtotal` (the sum of quantity × price), `#discount` (10% of the subtotal, but only when the subtotal is **£100 or more**, otherwise `£0.00`) and `#total` (subtotal minus discount). A quantity that is empty, negative, not a whole number or not a number counts as 0. Show correct values as soon as the page opens.',
    checks: [
      T('The start', "h.eq([h.text('#subtotal'), h.text('#discount'), h.text('#total')], ['£0.00', '£0.00', '£0.00']);"),
      T('Totals', "const set = (a, b, c) => { h.type('.qty:nth-of-type(1)', a); }; const rows = () => h.$$('.qty'); const fill = (a, b, c) => { [a, b, c].forEach((v, i) => h.type('tr:nth-child(' + (i + 1) + ') .qty', v)); }; fill('2', '1', '4'); h.eq([h.text('#subtotal'), h.text('#discount'), h.text('#total')], ['£24.00', '£0.00', '£24.00']); fill('10', '5', '0'); h.eq([h.text('#subtotal'), h.text('#discount'), h.text('#total')], ['£105.00', '£10.50', '£94.50']);"),
      T('The discount boundary', "const fill = (a, b, c) => { [a, b, c].forEach((v, i) => h.type('tr:nth-child(' + (i + 1) + ') .qty', v)); }; fill('0', '0', '400'); h.eq(h.text('#subtotal'), '£300.00'); fill('0', '0', '133'); h.eq([h.text('#subtotal'), h.text('#discount')], ['£99.75', '£0.00']); fill('0', '0', '134'); h.eq([h.text('#subtotal'), h.text('#discount'), h.text('#total')], ['£100.50', '£10.05', '£90.45']); fill('0', '25', '0'); h.eq([h.text('#subtotal'), h.text('#discount'), h.text('#total')], ['£300.00', '£30.00', '£270.00']); fill('0', '0', '0'); h.eq([h.text('#subtotal'), h.text('#discount')], ['£0.00', '£0.00']);"),
      T('Bad quantities count as zero', "const fill = (a, b, c) => { [a, b, c].forEach((v, i) => h.type('tr:nth-child(' + (i + 1) + ') .qty', v)); }; fill('', '-3', 'abc'); h.eq(h.text('#total'), '£0.00'); fill('1.5', '2', '  '); h.eq(h.text('#subtotal'), '£24.00', 'A fractional quantity counts as 0'); fill('2', 'x', '-1'); h.eq(h.text('#subtotal'), '£9.00');"),
    ],
  }),
  wd({
    id: 'daily-web-theme-memory', title: 'The Theme Switch That Remembers', skillIds: ['js.forms', 'js.dom'], difficulty: 3, context: 'software', tabs: ['js'], starter: files(HTMLS.theme, '.dark { background: #111; color: #eee; }\n', ''), daily: { focus: 'either', requires: ['web-21-storage-json'] },
    prompt: 'The button switches the page between light and dark: in dark mode the `<body>` has the class `dark`, and the button says `Light mode` (in light mode it says `Dark mode`). The choice is remembered for the next visit: when the page opens it applies whatever was last chosen. The choice is stored under the key `theme` as the text `dark` or `light`. Nothing stored, or anything unusable, means light.',
    checks: [
      T('Toggling', "h.eq(h.text('#theme'), 'Dark mode'); h.assert(!document.body.classList.contains('dark')); h.click('#theme'); h.assert(document.body.classList.contains('dark')); h.eq(h.text('#theme'), 'Light mode'); h.click('#theme'); h.assert(!document.body.classList.contains('dark')); h.eq(h.text('#theme'), 'Dark mode');"),
      T('Something is saved', "h.click('#theme'); h.assert(h.storage.length > 0, 'The choice must be stored.'); const dark = JSON.stringify(Object.fromEntries(Object.entries(h.storage))); h.click('#theme'); const light = JSON.stringify(Object.fromEntries(Object.entries(h.storage))); h.assert(dark !== light, 'Dark and light must be stored differently.');"),
      T('Restoring dark', "h.assert(document.body.classList.contains('dark'), 'The saved dark choice is applied at load.'); h.eq(h.text('#theme'), 'Light mode');", { storage: { theme: 'dark' } }),
      T('Restoring light', "h.assert(!document.body.classList.contains('dark')); h.eq(h.text('#theme'), 'Dark mode'); h.click('#theme'); h.eq(h.storage.getItem('theme'), 'dark');", { storage: { theme: 'light' } }),
      T('Unusable storage', "h.assert(!document.body.classList.contains('dark'), 'Anything unrecognised means light.'); h.eq(h.text('#theme'), 'Dark mode');", { storage: { theme: 'purple' } }),
      T('The stored words', "h.click('#theme'); h.eq(h.storage.getItem('theme'), 'dark'); h.click('#theme'); h.eq(h.storage.getItem('theme'), 'light');"),
    ],
  }),
  wd({
    id: 'daily-web-top-hitters', title: 'The Home-Run Leaders', skillIds: ['web.http', 'js.data'], difficulty: 3, context: 'sports analytics', tabs: ['js'], api: true, starter: files(HTMLS.top, '', ''), daily: { focus: 'either', requires: ['web-23-fetch'] },
    prompt: 'Show the **three** players with the most home runs, most first, as `li` elements of `#top`, each written `<name> (<team>): <home runs>`. `#state` says `Loading...` while waiting and is empty afterwards; if the service fails it says `Leaders unavailable` and the list is empty. The players come from the game’s players service.',
    checks: [
      T('The leaders', "const p = h.api.get('/api/players').sort((a, b) => b.home_runs - a.home_runs).slice(0, 3); h.eq(h.text('#state'), 'Loading...'); await h.settle(); h.eq(h.text('#state'), ''); h.eq(h.$$('#top li').map((l) => h.norm(l.textContent)), p.map((x) => x.name + ' (' + x.team + '): ' + x.home_runs));"),
      T('The hidden data set', "const p = h.api.get('/api/players').sort((a, b) => b.home_runs - a.home_runs).slice(0, 3); await h.settle(); h.eq(h.$$('#top li').map((l) => h.norm(l.textContent)), p.map((x) => x.name + ' (' + x.team + '): ' + x.home_runs));", { api: 'b' }),
      T('A failure', "h.api.failNext(1, 500); await h.settle(); h.eq(h.text('#state'), 'Leaders unavailable'); h.eq(h.$$('#top li').length, 0);"),
    ],
  }),
  wd({
    id: 'daily-web-low-stock', title: 'The Low-Stock Flags', skillIds: ['web.http', 'js.dom'], difficulty: 3, context: 'inventory', tabs: ['js', 'css'], api: true, starter: files(HTMLS.stock, '', ''), daily: { focus: 'either', requires: ['web-23-fetch'] },
    prompt: 'List every product from the products service in `#stock`, one `li` each, written `<name>: <stock>`. Products with **fewer than 10** in stock also get the class `low` on their `li`, and the page paints their text `#b00020`. `#low-count` says `<n> low` for how many there are. `#state` says `Loading...` while waiting and is empty afterwards; if the service fails it says `Stock unavailable`, and nothing is listed.',
    checks: [
      T('The list', "const all = h.api.get('/api/products'); await h.settle(); h.eq(h.$$('#stock li').map((l) => h.norm(l.textContent)), all.map((p) => p.name + ': ' + p.stock)); h.eq(h.$$('#stock li').map((l) => l.classList.contains('low')), all.map((p) => p.stock < 10)); h.eq(h.text('#low-count'), all.filter((p) => p.stock < 10).length + ' low');"),
      T('The hidden data set', "const all = h.api.get('/api/products'); await h.settle(); h.eq(h.$$('#stock li').map((l) => l.classList.contains('low')), all.map((p) => p.stock < 10)); h.eq(h.text('#low-count'), all.filter((p) => p.stock < 10).length + ' low');", { api: 'b' }),
      T('The colour', "await h.settle(); const low = h.$('#stock li.low'); if (low) h.eq(getComputedStyle(low).color, 'rgb(176, 0, 32)'); const ok = h.$$('#stock li:not(.low)')[0]; if (ok) h.assert(getComputedStyle(ok).color !== 'rgb(176, 0, 32)', 'Only low items are red.');"),
      T('A failure', "h.api.failNext(1, 503); await h.settle(); h.eq(h.text('#state'), 'Stock unavailable'); h.eq(h.$$('#stock li').length, 0); h.eq(h.text('#low-count'), '');"),
    ],
  }),
  wd({
    id: 'daily-web-service-check', title: 'The Service Check', skillIds: ['web.http', 'js.async'], difficulty: 4, context: 'operations', tabs: ['js'], api: true, starter: files(HTMLS.online, '', ''), daily: { focus: 'review', requires: ['web-24-fetch-write'] },
    prompt: 'Clicking `#check` asks the game’s unreliable `/api/flaky` service whether it is up. The service sometimes fails; so ask **up to three times in a row** (straight away, no waiting): the moment one answer is a success, `#status` says `Online` and no more requests are sent. If all three fail, `#status` says `Offline`. While checking, `#status` says `Checking...`. Every check starts with fresh attempts.',
    checks: [
      T('Retries until it works', "h.click('#check'); h.eq(h.text('#status'), 'Checking...'); await h.settle(); h.eq(h.text('#status'), 'Online'); h.eq(h.api.calls.length, 3, 'The first two answers fail, the third succeeds');"),
      T('Stops at the first success', "h.click('#check'); await h.settle(); h.click('#check'); await h.settle(); h.eq(h.text('#status'), 'Online'); h.eq(h.api.calls.length, 4, 'The second check needs only one request');"),
      T('All three fail', "h.api.failNext(3, 503); h.click('#check'); await h.settle(); h.eq(h.text('#status'), 'Offline'); h.eq(h.api.calls.length, 3, 'Exactly three tries');"),
      T('Fresh attempts each time', "h.api.failNext(3, 500); h.click('#check'); await h.settle(); h.eq(h.text('#status'), 'Offline'); h.click('#check'); await h.settle(); h.eq(h.text('#status'), 'Online'); h.eq(h.api.calls.length, 6, 'Three failed tries, then a fresh check that needs the service to succeed on its own');"),
    ],
  }),
  wd({
    id: 'daily-web-join-team', title: 'The Join-a-Team Form', skillIds: ['web.http', 'js.forms'], difficulty: 4, context: 'sports', tabs: ['js'], api: true, starter: files(HTMLS.join, '', ''), daily: { focus: 'review', requires: ['web-24-fetch-write'] },
    prompt: 'The form registers a new team with the teams service. The team needs a name and a city (both trimmed). If either is empty after trimming, `#msg` says `Name and city are required` and **nothing is sent**. Otherwise create the team on the server; when the server accepts it, `#msg` says `Joined <name> (team <id>)` using the answer the server gave, the new team is added to the list `#teams` as an `li` reading `<name>, <city>`, and both boxes are cleared. If the server refuses, `#msg` says `The server refused: <the error text it sent>` and nothing else changes. The page must never let the browser send the form itself.',
    checks: [
      T('Joining', "let prevented = null; document.addEventListener('submit', (e) => { prevented = e.defaultPrevented; }); const next = Math.max(...h.api.get('/api/teams').map((t) => t.id)) + 1; h.type('#name', '  Kestrels '); h.type('#city', ' Ely '); h.click('#join button[type=submit]'); h.assert(prevented === true, 'Stop the browser sending the form.'); await h.settle(); h.eq(h.text('#msg'), 'Joined Kestrels (team ' + next + ')'); h.eq(h.$$('#teams li').map((l) => h.norm(l.textContent)), ['Kestrels, Ely']); h.eq([h.value('#name'), h.value('#city')], ['', '']); const post = h.api.calls.find((c) => c.method === 'POST'); const body = JSON.parse(post.body); h.eq([body.name, body.city], ['Kestrels', 'Ely']); h.assert((post.headers['content-type'] || '').includes('application/json'), 'Send JSON.');"),
      T('Missing fields send nothing', "h.type('#name', '   '); h.type('#city', 'Ely'); h.click('#join button[type=submit]'); await h.settle(); h.eq(h.text('#msg'), 'Name and city are required'); h.type('#name', 'A'); h.type('#city', ''); h.click('#join button[type=submit]'); await h.settle(); h.eq(h.text('#msg'), 'Name and city are required'); h.eq(h.api.calls.length, 0, 'No request for an incomplete form'); h.eq(h.$$('#teams li').length, 0);"),
      T('The server refuses', "h.type('#name', 'Kestrels'); h.type('#city', 'Ely'); h.api.failNext(1, 500); h.click('#join button[type=submit]'); await h.settle(); h.eq(h.text('#msg'), 'The server refused: Simulated server error'); h.eq(h.$$('#teams li').length, 0); h.eq(h.value('#name'), 'Kestrels', 'Typed text is kept');"),
      T('Two teams', "h.type('#name', 'A'); h.type('#city', 'X'); h.click('#join button[type=submit]'); await h.settle(); h.type('#name', 'B'); h.type('#city', 'Y'); h.click('#join button[type=submit]'); await h.settle(); h.eq(h.$$('#teams li').map((l) => h.norm(l.textContent)), ['A, X', 'B, Y']);"),
    ],
  }),
];
void q;
