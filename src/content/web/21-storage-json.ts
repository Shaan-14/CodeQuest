import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, jsCalls, wc, web, webDemo } from './helpers';

export const HTML = {
  name: '<label>Your name <input id="name"></label>\n<button id="save">Save</button>\n<p id="greeting">Hello, stranger</p>\n',
  settings: '<label><input type="checkbox" id="dark"> Dark mode</label>\n<label>Text size\n  <select id="size">\n    <option value="small">Small</option>\n    <option value="medium" selected>Medium</option>\n    <option value="large">Large</option>\n  </select>\n</label>\n',
  cart: '<button class="add" data-sku="A1">Add bolts</button>\n<button class="add" data-sku="B2">Add gears</button>\n<button class="add" data-sku="C3">Add belts</button>\n<button id="clear">Clear cart</button>\n<p>Items in cart: <span id="count">0</span></p>\n',
  recent: '<input id="q" placeholder="Search parts">\n<button id="go">Search</button>\n<button id="wipe">Clear history</button>\n<ul id="recent"></ul>\n',
};
const cartOf = "const cart = () => JSON.parse(h.storage.getItem('cart') || '[]').map((i) => i.sku + ':' + i.qty).join(',');";

const cases = (...t: string[]) => t.map((x) => JSON.stringify(x));
const CONFIG_REF = '(text) => { const d = { retries: 3, timeout: 30, name: "job" }; let o; try { o = JSON.parse(text); } catch { return d; } if (o === null || typeof o !== "object" || Array.isArray(o)) return d; return { retries: Number.isInteger(o.retries) && o.retries >= 0 && o.retries <= 10 ? o.retries : 3, timeout: typeof o.timeout === "number" && o.timeout > 0 ? o.timeout : 30, name: typeof o.name === "string" && o.name.trim() !== "" ? o.name.trim() : "job" }; }';
const ROSTER_REF = '(text) => { let a; try { a = JSON.parse(text); } catch { return []; } if (!Array.isArray(a)) return []; return a.filter((p) => p && typeof p.name === "string" && p.name.trim() !== "" && Number.isInteger(p.age) && p.age >= 0 && p.age <= 120).map((p) => ({ name: p.name.trim(), age: p.age })); }';

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-21-storage-json', title: 'Remembering: localStorage and JSON', language: 'web', skillId: 'js.forms',
    blurb: 'Save state in the browser, read it back safely, and treat stored text as untrusted.', prerequisites: ['web-20-forms-js'], xpReward: 70,
    reference: {
      title: 'localStorage and JSON',
      body: text(
        '`localStorage.setItem(key, text)` and `localStorage.getItem(key)` keep **strings** in the browser between visits (`getItem` gives `null` when nothing is stored). To store an array or object, convert it: `JSON.stringify(value)` to save and `JSON.parse(text)` to load.',
        '**Stored text is untrusted input.** It can be missing, edited by hand, left by an older version of your app, or cut off. `JSON.parse` throws on bad text, and even valid JSON may have the wrong shape (an object where you expected an array). Wrap the parse in `try/catch`, then **check the shape** and fall back to a default.',
      ),
      example: 'function load() {\n  try {\n    const data = JSON.parse(localStorage.getItem("cart"));\n    return Array.isArray(data) ? data : [];\n  } catch {\n    return [];\n  }\n}\nlocalStorage.setItem("cart", JSON.stringify([{ sku: "A1", qty: 2 }]));',
    },
    steps: [
      { kind: 'teach', title: 'A page with a memory', body: text('Reloading a page normally wipes everything held in variables. `localStorage` is a small key-value shelf that survives reloads and closing the tab. It only holds text, so structured data goes through JSON.', 'Two habits keep it safe: **write** to storage whenever the state changes, and **read** from it once, defensively, when the page starts.') },
      webDemo({
        title: 'Remember a name',
        body: text('Run it, save a name, then use Run again: the page still knows it. Then make it remember a second value, the time of the last save.'),
        files: files('<input id="who" placeholder="Name">\n<button id="keep">Remember</button>\n<p id="hello"></p>\n', '', 'const who = document.querySelector("#who");\nconst hello = document.querySelector("#hello");\nhello.textContent = "Hello, " + (localStorage.getItem("who") || "stranger");\ndocument.querySelector("#keep").addEventListener("click", () => {\n  localStorage.setItem("who", who.value.trim());\n  hello.textContent = "Hello, " + who.value.trim();\n});\n'),
        notice: 'The page reads storage once at start and writes on every change. The game gives each exercise its own private storage, so nothing here touches anything real.',
      }),
      { kind: 'challenge', challengeId: 'web-21-saved-name' },
      { kind: 'challenge', challengeId: 'web-21-settings-panel' },
      { kind: 'challenge', challengeId: 'web-21-parse-config' },
    ],
  },
  objectives: [
    { id: 'js-obj-persistence', title: 'Persist and restore page state', summary: 'Save state as JSON whenever it changes; restore it defensively at load (missing, corrupt or wrong-shaped data).' },
    { id: 'js-obj-json-handling', title: 'Turn untrusted JSON text into trustworthy data', summary: 'Parse safely, check the shape, and fill in defaults, in a pure function.' },
  ],
  challenges: [
    wc({
      id: 'web-21-saved-name', title: 'The Remembered Name', mode: 'learning', skillIds: ['js.forms'], concepts: ['localStorage', 'getItem', 'setItem'], difficulty: 2, context: 'customer support',
      prompt: text('The page has `#name`, a button `#save` and a greeting `#greeting`. Clicking Save stores the trimmed name under the key `name` in localStorage and shows `Hello, <name>`. When the page loads, if a name was stored, the greeting already says `Hello, <name>`; if not, it says `Hello, stranger`.'),
      expectedBehavior: 'The greeting uses the saved name, including after the page reloads.',
      guidedSteps: ['On load, read `localStorage.getItem("name")` (it is `null` when nothing is stored).', 'Set the greeting from that value or from the default.', 'On click, save the trimmed value with `setItem` and update the greeting.'],
      starterFiles: files(HTML.name, '', ''), tabs: ['js'],
      hints: ['Two moments matter: when the page starts and when Save is clicked.', '`getItem` returns `null` if the key does not exist; `||` gives a default.', '`localStorage.setItem("name", value)`.'],
      checks: [
        web('Saving', "h.type('#name', '  Ada  '); h.click('#save'); h.eq(h.text('#greeting'), 'Hello, Ada'); h.eq(h.storage.getItem('name'), 'Ada', 'The trimmed name is stored under the key name');"),
        web('Restoring', "h.eq(h.text('#greeting'), 'Hello, Grace');", { storage: { name: 'Grace' } }),
        web('Nothing stored', "h.eq(h.text('#greeting'), 'Hello, stranger');", { visible: false }),
      ],
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-21-settings-panel', objectiveId: 'js-obj-persistence', title: 'The Display Settings', mode: 'challenge', skillIds: ['js.forms'], concepts: ['localStorage', 'JSON', 'try/catch', 'state'], difficulty: 3, context: 'software',
      prompt: text(
        'The page has a checkbox `#dark` and a select `#size`. Make them control the page and remember their values:',
        '- When `#dark` is checked the `<body>` has the class `dark`; otherwise not.\n- The `<body>` always has a `data-size` attribute equal to the selected size (`small`, `medium` or `large`; the page starts on `medium`).\n- Every change is saved to localStorage under the key `settings` as JSON text: an object with `dark` (true/false) and `size`.\n- When the page loads it restores the saved settings into the checkbox, the select **and** the body. Stored text that is not valid JSON, or values that are not allowed (`dark` must be exactly `true`; `size` must be one of the three), must not break the page: use the defaults (light, medium) for whatever is unusable.',
      ),
      starterFiles: files(HTML.settings, '.dark { background: #222; color: #eee; }\n', ''), tabs: ['js'],
      hints: ['Write one `apply(settings)` and one `save()`, and one defensive `load()`.', 'Reading storage can throw or return something of the wrong shape: what should each case fall back to?', 'JSON.parse inside try/catch; then check each value before trusting it.'],
      checks: [
        web('Defaults', "h.assert(!document.body.classList.contains('dark')); h.eq(document.body.dataset.size, 'medium', 'The body starts with data-size medium');"),
        web('Changes apply and are saved', "h.click('#dark'); h.assert(document.body.classList.contains('dark'), 'Dark mode turns on.'); h.eq(JSON.parse(h.storage.getItem('settings')).dark, true, 'dark is saved'); h.select('#size', 'large'); h.eq(document.body.dataset.size, 'large'); const s = JSON.parse(h.storage.getItem('settings')); h.eq(s.size, 'large', 'size is saved'); h.eq(s.dark, true, 'dark is still saved after changing the size'); h.click('#dark'); h.assert(!document.body.classList.contains('dark')); h.eq(JSON.parse(h.storage.getItem('settings')).dark, false);"),
        web('Restoring saved settings', "h.assert(document.body.classList.contains('dark'), 'Dark mode is restored.'); h.assert(h.$('#dark').checked, 'The checkbox shows the restored value.'); h.eq(h.$('#size').value, 'large', 'The select shows the restored value.'); h.eq(document.body.dataset.size, 'large');", { storage: { settings: '{\"dark\":true,\"size\":\"large\"}' }, visible: false }),
        web('Corrupt storage', "h.assert(!document.body.classList.contains('dark')); h.eq(document.body.dataset.size, 'medium'); h.click('#dark'); h.eq(JSON.parse(h.storage.getItem('settings')).dark, true, 'The next save replaces the broken text with valid JSON');", { storage: { settings: '{oops' }, visible: false }),
        web('Values that are not allowed', "h.assert(!document.body.classList.contains('dark'), 'Only the value true means dark.'); h.eq(document.body.dataset.size, 'medium', 'An unknown size falls back to medium'); h.eq(h.$('#size').value, 'medium');", { storage: { settings: '{\"dark\":\"yes\",\"size\":\"huge\"}' }, visible: false }),
        web('Partly usable storage', "h.assert(document.body.classList.contains('dark'), 'The good part is kept.'); h.eq(document.body.dataset.size, 'medium');", { storage: { settings: '{\"dark\":true}' }, visible: false }),
        web('Not an object at all', "h.assert(!document.body.classList.contains('dark')); h.eq(document.body.dataset.size, 'medium');", { storage: { settings: 'null' }, visible: false }),
      ],
      xpReward: 95, coinReward: 15,
    }),
    wc({
      id: 'web-21-cart-storage', objectiveId: 'js-obj-persistence', title: 'The Parts Cart', mode: 'challenge', skillIds: ['js.forms'], concepts: ['localStorage', 'JSON', 'try/catch', 'state'], difficulty: 3, context: 'retail',
      prompt: text(
        'Each `.add` button (its `data-sku` says which part) adds one of that part to the cart. `#count` shows the total number of items. The cart is saved to localStorage under the key `cart` as a JSON **array** of `{ "sku": ..., "qty": ... }`, one entry per part in the order first added (adding the same part again raises its `qty`). `#clear` empties the cart (saved as `[]`).',
        'On load, restore the cart and the count. Ignore broken storage: text that is not JSON or not an array means an empty cart, and entries that are not a non-empty text `sku` with a whole-number `qty` of at least 1 are dropped while the good ones are kept.',
      ),
      starterFiles: files(HTML.cart, '', ''), tabs: ['js'],
      hints: ['State is the array; the count and the storage are both derived from it.', 'One function that saves and re-renders after every change keeps them in step.', 'Loading: parse in try/catch, check `Array.isArray`, then `filter` the entries you trust.'],
      checks: [
        web('Adding parts', `${cartOf} h.click('.add[data-sku=A1]'); h.click('.add[data-sku=B2]'); h.click('.add[data-sku=A1]'); h.eq(h.text('#count'), '3'); h.eq(cart(), 'A1:2,B2:1', 'The saved cart');`),
        web('Clearing', `${cartOf} h.click('.add[data-sku=C3]'); h.click('#clear'); h.eq(h.text('#count'), '0'); h.eq(h.storage.getItem('cart'), '[]', 'An empty cart is saved as []'); h.click('.add[data-sku=C3]'); h.eq(cart(), 'C3:1'); h.eq(h.text('#count'), '1');`, { visible: false }),
        web('Restoring', `${cartOf} h.eq(h.text('#count'), '5'); h.click('.add[data-sku=B2]'); h.eq(h.text('#count'), '6'); h.eq(cart(), 'A1:2,B2:4', 'The restored cart keeps going');`, { storage: { cart: '[{\"sku\":\"A1\",\"qty\":2},{\"sku\":\"B2\",\"qty\":3}]' }, visible: false }),
        web('Corrupt storage', `${cartOf} h.eq(h.text('#count'), '0'); h.click('.add[data-sku=A1]'); h.eq(cart(), 'A1:1');`, { storage: { cart: '[{"sku":' }, visible: false }),
        web('Wrong shape', `${cartOf} h.eq(h.text('#count'), '0'); h.click('.add[data-sku=A1]'); h.eq(cart(), 'A1:1');`, { storage: { cart: '{\"sku\":\"A1\",\"qty\":9}' }, visible: false }),
        web('Bad entries are dropped', `${cartOf} h.eq(h.text('#count'), '4', 'Only the two good entries count'); h.click('.add[data-sku=B2]'); h.eq(cart(), 'A1:3,B2:2');`, { storage: { cart: '[{\"sku\":\"A1\",\"qty\":3},{\"sku\":\"\",\"qty\":2},{\"sku\":\"X\",\"qty\":0},{\"sku\":\"Y\",\"qty\":1.5},null,{\"sku\":\"B2\",\"qty\":1}]' }, visible: false }),
      ],
      xpReward: 95, coinReward: 15,
    }),
    wc({
      id: 'web-21-recent-searches', objectiveId: 'js-obj-persistence', title: 'The Recent Searches List', mode: 'challenge', skillIds: ['js.forms'], concepts: ['localStorage', 'JSON', 'try/catch', 'state'], difficulty: 3, context: 'data analysis',
      prompt: text(
        'Clicking `#go` records the trimmed text of `#q` as a search (an empty or spaces-only search is ignored) and clears the box. The page shows the **five most recent distinct searches**, newest first, as `li` elements in `#recent`. Searching for something already in the list (ignoring capital letters) moves it to the top, using the newly typed spelling, instead of adding a duplicate. `#wipe` empties the list.',
        'The list is saved to localStorage under the key `recent` as a JSON array of strings, and restored when the page loads. Text that is not JSON or not an array means an empty list, and entries that are not non-empty strings are dropped.',
      ),
      starterFiles: files(HTML.recent, '', ''), tabs: ['js'],
      hints: ['State is an array of strings, newest first.', 'To move a duplicate to the top: remove any equal entry (compare lower-cased), then put the new one in front and cut the list to five.', 'Render the list and save it from one function after each change.'],
      checks: [
        web('Adding searches', "const s = (t) => { h.type('#q', t); h.click('#go'); }; const list = () => h.$$('#recent li').map((l) => h.norm(l.textContent)); s('bolt'); s('  gear '); s('valve'); h.eq(list(), ['valve', 'gear', 'bolt']); h.eq(h.value('#q'), '', 'The box is cleared'); h.eq(JSON.parse(h.storage.getItem('recent')), ['valve', 'gear', 'bolt'], 'The saved list');"),
        web('Duplicates and blanks', "const s = (t) => { h.type('#q', t); h.click('#go'); }; const list = () => h.$$('#recent li').map((l) => h.norm(l.textContent)); s('bolt'); s('gear'); s('BOLT'); h.eq(list(), ['BOLT', 'gear'], 'A repeat moves to the top with the new spelling'); s('   '); s(''); h.eq(list(), ['BOLT', 'gear'], 'Blank searches are ignored'); h.eq(JSON.parse(h.storage.getItem('recent')), ['BOLT', 'gear']);", { visible: false }),
        web('Only five', "const s = (t) => { h.type('#q', t); h.click('#go'); }; const list = () => h.$$('#recent li').map((l) => h.norm(l.textContent)); ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(s); h.eq(list(), ['g', 'f', 'e', 'd', 'c']); h.eq(JSON.parse(h.storage.getItem('recent')).length, 5, 'Only five are saved'); s('d'); h.eq(list(), ['d', 'g', 'f', 'e', 'c']);", { visible: false }),
        web('Clearing history', "const s = (t) => { h.type('#q', t); h.click('#go'); }; s('a'); s('b'); h.click('#wipe'); h.eq(h.$$('#recent li').length, 0); h.eq(h.storage.getItem('recent'), '[]'); s('c'); h.eq(h.$$('#recent li').length, 1);", { visible: false }),
        web('Restoring', "const list = () => h.$$('#recent li').map((l) => h.norm(l.textContent)); h.eq(list(), ['x', 'y']); h.type('#q', 'z'); h.click('#go'); h.eq(list(), ['z', 'x', 'y']);", { storage: { recent: '[\"x\",\"y\"]' }, visible: false }),
        web('Broken storage', "const list = () => h.$$('#recent li').map((l) => h.norm(l.textContent)); h.eq(list(), []); h.type('#q', 'z'); h.click('#go'); h.eq(list(), ['z']);", { storage: { recent: '[\"x\"' }, visible: false }),
        web('Bad entries are dropped', "const list = () => h.$$('#recent li').map((l) => h.norm(l.textContent)); h.eq(list(), ['x', 'y']);", { storage: { recent: '[\"x\",7,null,\"\",\"y\",{\"a\":1}]' }, visible: false }),
        web('Wrong shape', "const list = () => h.$$('#recent li').map((l) => h.norm(l.textContent)); h.eq(list(), []);", { storage: { recent: '\"just text\"' }, visible: false }),
      ],
      xpReward: 95, coinReward: 15,
    }),
    wc({
      id: 'web-21-parse-config', objectiveId: 'js-obj-json-handling', title: 'The Job Config Reader', mode: 'challenge', skillIds: ['js.forms', 'js.data'], concepts: ['JSON.parse', 'try/catch', 'defaults', 'validation'], difficulty: 3, context: 'automation',
      prompt: text(
        'Write a function `readConfig(text)` that turns JSON text describing a job into a trustworthy object `{ retries, timeout, name }`.',
        '`retries` must be a whole number from 0 to 10 (default **3**); `timeout` must be a number greater than 0 (default **30**); `name` must be a non-empty text after trimming, and is returned trimmed (default `"job"`). Each field falls back to its default on its own when it is missing or unusable. If the text is not valid JSON, or is valid JSON that is not a plain object (for example a list, a number or `null`), return all defaults.',
      ),
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Two layers: is it JSON at all, and is the JSON the shape you expected?', 'Decide each field independently; a helper for the checks keeps it short.', '`try { JSON.parse(text) } catch { ... }` and `Array.isArray`, `typeof`, `Number.isInteger`.'],
      checks: jsCalls('readConfig', CONFIG_REF, cases('{"retries":5,"timeout":12.5,"name":"nightly"}', '{}', 'not json', '', '[1,2,3]', 'null', '{"retries":11}', '{"retries":-1,"timeout":0}', '{"retries":2.5,"timeout":"5","name":"  x  "}', '{"retries":0,"timeout":0.1,"name":"   "}', '{"retries":10}', '42', '{"name":7}'), { visibleFirst: true }),
      xpReward: 90, coinReward: 14,
    }),
    wc({
      id: 'web-21-parse-roster', objectiveId: 'js-obj-json-handling', title: 'The Patient Roster Reader', mode: 'challenge', skillIds: ['js.forms', 'js.data'], concepts: ['JSON.parse', 'try/catch', 'defaults', 'validation'], difficulty: 3, context: 'healthcare',
      prompt: text(
        'A clinic system exports a roster as JSON text. Write `readRoster(text)` that returns an array of `{ name, age }` for the entries you can trust, in their original order.',
        'An entry is trusted when it is an object with a `name` that is non-empty after trimming (returned trimmed) and an `age` that is a whole number from 0 to 120. Untrusted entries are skipped, never fixed. If the text is not valid JSON, or the JSON is not a list, return an empty list.',
      ),
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Two layers: is it JSON at all, and is it a list?', 'Filter the entries you trust, then reshape them.', '`try/catch` around `JSON.parse`; `Array.isArray`; `Number.isInteger`.'],
      checks: jsCalls('readRoster', ROSTER_REF, cases('[{"name":"Ana","age":34},{"name":" Bo ","age":0}]', '[]', 'oops', '', '{"name":"Ana","age":3}', 'null', '[{"name":"Ana","age":121},{"name":"Cy","age":120}]', '[{"name":"","age":5},{"name":"Di","age":"5"},{"age":5},null,7,{"name":"Ed","age":4.5}]', '[{"name":"Fay","age":-1},{"name":"Gus","age":30,"extra":true}]', '"text"'), { visibleFirst: true }),
      xpReward: 90, coinReward: 14,
    }),
  ],
};
