/** TEST-ONLY DATA: reference solutions and plausible wrong attempts for the Phase 4 web lessons (run in real Chromium by web.test.ts). */
import type { WebFiles } from '../schema';
import type { Sol } from './solutions.testdata';

const J = (js: string, html = '', css = ''): WebFiles => ({ html, css, js });
const F = (html: string, css: string, js = ''): WebFiles => ({ html, css, js });
const rep = (src: string, from: string, to: string): string => {
  if (!src.includes(from)) throw new Error('solutions.phase4: replacement did nothing: ' + from);
  return src.replace(from, to);
};

/* ---------------------------------------------------------------- 27 closures */
const counter = 'function makeCounter(step = 1) {\n  let n = 0;\n  return function () {\n    n += step;\n    return n;\n  };\n}\n';
const limiter = 'function makeLimiter(max) {\n  let used = 0;\n  return function () {\n    if (used < max) {\n      used++;\n      return true;\n    }\n    return false;\n  };\n}\n';
const dispenser = 'function makeDispenser(prefix) {\n  let n = 0;\n  return () => {\n    n++;\n    return prefix + "-" + String(n).padStart(3, "0");\n  };\n}\n';

/* ---------------------------------------------------------------- 28 tests */
const assertEqual = 'function assertEqual(actual, expected, label) {\n  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(label + ": expected " + JSON.stringify(expected) + " but got " + JSON.stringify(actual));\n}\n';
const testClamp = assertEqual + 'function testClamp(clamp) {\n  assertEqual(clamp(5, 0, 10), 5, "inside");\n  assertEqual(clamp(-3, 0, 10), 0, "below");\n  assertEqual(clamp(15, 0, 10), 10, "above");\n  assertEqual(clamp(0, 0, 10), 0, "on the lower limit");\n  assertEqual(clamp(10, 0, 10), 10, "on the upper limit");\n  assertEqual(clamp(-5, -10, -1), -5, "negative range");\n  assertEqual(clamp(-20, -10, -1), -10, "below a negative range");\n}\n';
const testMedian = assertEqual + 'function testMedian(median) {\n  assertEqual(median([]), null, "empty");\n  assertEqual(median([7]), 7, "one item");\n  assertEqual(median([3, 1, 2]), 2, "unsorted odd");\n  assertEqual(median([1, 2, 3, 4]), 2.5, "even");\n  assertEqual(median([10, 9, 8]), 9, "numbers, not text");\n  assertEqual(median([5, 3]), 4, "two items");\n  assertEqual(median([1, 2, 9]), 2, "a skewed list: the median is not the mean");\n  const input = [3, 1, 2];\n  median(input);\n  assertEqual(input, [3, 1, 2], "the input must not change");\n}\n';
const testSlugify = assertEqual + 'function testSlugify(slugify) {\n  assertEqual(slugify("Hello, World!"), "hello-world", "basic");\n  assertEqual(slugify("  Many   spaces  "), "many-spaces", "runs and ends");\n  assertEqual(slugify("---x---"), "x", "dashes at the ends");\n  assertEqual(slugify("Version 2.0"), "version-2-0", "digits stay");\n  assertEqual(slugify("Crème brûlée"), "cr-me-br-l-e", "accents are separators");\n  assertEqual(slugify("A&B"), "a-b", "symbols");\n  assertEqual(slugify(""), "", "empty");\n}\n';

/* ---------------------------------------------------------------- 29 positioning */
const cardCss = '.card { position: relative; width: 240px; margin: 40px auto; padding: 16px; background: #eef; box-sizing: border-box; }\n.badge { position: absolute; top: 8px; right: 8px; background: #c00; color: #fff; padding: 2px 8px; font-size: 12px; }\n';
const cardHtml = '<div class="card"><span class="badge">NEW</span><h3>Bolt kit</h3><p>Forty pieces, zinc plated.</p></div>\n';
const dotHtml = '<p>Ana is online</p>\n<div class="avatar"><span class="dot"></span></div>\n<p>Last seen just now</p>\n';
const dotBase = 'body { margin: 0; }\n.avatar { width: 64px; height: 64px; margin: 24px 40px; background: #99c; box-sizing: border-box; border-radius: 8px; }\n.dot { display: block; width: 14px; height: 14px; border-radius: 50%; background: #2a2; }\n';
const dotCss = dotBase.replace('.avatar {', '.avatar { position: relative;') + '.dot { position: absolute; right: -7px; bottom: -7px; }\n';
const ribbonHtml = '<div class="tile"><div class="photo"></div><span class="ribbon">SALE</span></div>\n';
const ribbonBase = 'body { margin: 0; }\n.tile { width: 200px; height: 150px; margin: 30px; }\n.photo { position: relative; z-index: 2; width: 100%; height: 100%; background: #ccd; }\n.ribbon { background: #c00; color: #fff; padding: 4px 12px; font-weight: bold; }\n';
const ribbonCss = ribbonBase.replace('.tile {', '.tile { position: relative;') + '.ribbon { position: absolute; top: 0; left: 0; z-index: 3; }\n';
const FILLER = Array.from({ length: 90 }, (_, i) => `<p>Paragraph ${i + 1}. This is filler text so that the page is tall enough to scroll, which is how sticky elements can be seen doing their job.</p>`).join('\n');
const headerHtml = `<header>Plant manual</header>\n<main>\n<h1>Safety</h1>\n${FILLER}\n</main>\n`;
const headerBase = 'body { margin: 0; font-family: sans-serif; }\nheader { background: #123; color: #fff; padding: 14px 20px; }\nmain { position: relative; padding: 20px; }\n';
const tocHtml = `<div class="layout">\n<nav class="toc"><a href="#a">Intro</a><br><a href="#b">Practice</a><br><a href="#c">Review</a></nav>\n<main>\n<h1>Lesson</h1>\n${FILLER}\n</main>\n</div>\n`;
const tocBase = 'body { margin: 0; font-family: sans-serif; }\n.layout { display: flex; gap: 24px; padding: 16px; }\n.toc { width: 160px; flex: none; box-sizing: border-box; background: #efe; padding: 12px; }\nmain { flex: 1; }\n';

/* ---------------------------------------------------------------- 30 render from state */
const todoHtml = '<h1>Shift tasks</h1>\n<form id="add-form">\n  <label>Task <input id="new"></label>\n  <button type="submit">Add</button>\n</form>\n<p id="count"></p>\n<ul id="list"></ul>\n';
const cartHtml = '<h1>Parts order</h1>\n<form id="cart-form">\n  <label>Item <input id="item"></label>\n  <label>Price <input id="price"></label>\n  <button type="submit">Add</button>\n</form>\n<ul id="cart"></ul>\n<p id="total"></p>\n';
const guestHtml = '<h1>Open day</h1>\n<form id="guest-form">\n  <label>Guest <input id="guest"></label>\n  <button type="submit">Add</button>\n</form>\n<p id="count"></p>\n<p id="msg" role="status"></p>\n<ul id="guests"></ul>\n';

const todoJs = 'let tasks = [];\nlet nextId = 1;\nconst form = document.querySelector("#add-form");\nconst box = document.querySelector("#new");\nconst list = document.querySelector("#list");\nconst count = document.querySelector("#count");\n\nfunction render() {\n  list.textContent = "";\n  for (const t of tasks) {\n    const li = document.createElement("li");\n    li.dataset.id = t.id;\n    li.append(t.text + " ");\n    const b = document.createElement("button");\n    b.className = "remove";\n    b.type = "button";\n    b.textContent = "×";\n    b.setAttribute("aria-label", "Remove " + t.text);\n    li.append(b);\n    list.append(li);\n  }\n  count.textContent = tasks.length + (tasks.length === 1 ? " task" : " tasks");\n}\n\nform.addEventListener("submit", (e) => {\n  e.preventDefault();\n  const text = box.value.trim();\n  if (text) tasks.push({ id: nextId++, text });\n  box.value = "";\n  render();\n});\n\nlist.addEventListener("click", (e) => {\n  const button = e.target.closest("button.remove");\n  if (!button) return;\n  const id = Number(button.closest("li").dataset.id);\n  tasks = tasks.filter((t) => t.id !== id);\n  render();\n});\n\nrender();\n';

const cartJs = 'let lines = [];\nlet nextId = 1;\nconst form = document.querySelector("#cart-form");\nconst cart = document.querySelector("#cart");\nconst total = document.querySelector("#total");\n\nfunction render() {\n  cart.textContent = "";\n  let sum = 0;\n  for (const l of lines) {\n    sum += l.price;\n    const li = document.createElement("li");\n    li.dataset.id = l.id;\n    li.append(l.name + " ");\n    const price = document.createElement("span");\n    price.className = "price";\n    price.textContent = "£" + l.price.toFixed(2);\n    li.append(price, " ");\n    const b = document.createElement("button");\n    b.className = "remove";\n    b.type = "button";\n    b.textContent = "×";\n    b.setAttribute("aria-label", "Remove " + l.name);\n    li.append(b);\n    cart.append(li);\n  }\n  total.textContent = "Total: £" + sum.toFixed(2);\n}\n\nform.addEventListener("submit", (e) => {\n  e.preventDefault();\n  const name = document.querySelector("#item").value.trim();\n  const raw = document.querySelector("#price").value.trim();\n  const price = raw === "" ? NaN : Number(raw);\n  if (name && Number.isFinite(price) && price >= 0) {\n    lines.push({ id: nextId++, name, price });\n    document.querySelector("#item").value = "";\n    document.querySelector("#price").value = "";\n  }\n  render();\n});\n\ncart.addEventListener("click", (e) => {\n  const button = e.target.closest("button.remove");\n  if (!button) return;\n  const id = Number(button.closest("li").dataset.id);\n  lines = lines.filter((l) => l.id !== id);\n  render();\n});\n\nrender();\n';

const guestJs = 'const LIMIT = 5;\nlet guests = [];\nlet nextId = 1;\nconst form = document.querySelector("#guest-form");\nconst box = document.querySelector("#guest");\nconst list = document.querySelector("#guests");\nconst count = document.querySelector("#count");\nconst msg = document.querySelector("#msg");\n\nfunction render() {\n  list.textContent = "";\n  for (const g of guests) {\n    const li = document.createElement("li");\n    li.dataset.id = g.id;\n    li.append(g.name + " ");\n    const b = document.createElement("button");\n    b.className = "remove";\n    b.type = "button";\n    b.textContent = "×";\n    b.setAttribute("aria-label", "Remove " + g.name);\n    li.append(b);\n    list.append(li);\n  }\n  count.textContent = guests.length + " of " + LIMIT + " guests";\n}\n\nform.addEventListener("submit", (e) => {\n  e.preventDefault();\n  const name = box.value.trim();\n  if (name) {\n    if (guests.length >= LIMIT) {\n      msg.textContent = "The list is full";\n    } else {\n      guests.push({ id: nextId++, name });\n      msg.textContent = "";\n    }\n  }\n  box.value = "";\n  render();\n});\n\nlist.addEventListener("click", (e) => {\n  const button = e.target.closest("button.remove");\n  if (!button) return;\n  const id = Number(button.closest("li").dataset.id);\n  guests = guests.filter((g) => g.id !== id);\n  msg.textContent = "";\n  render();\n});\n\nrender();\n';

/* ---------------------------------------------------------------- 31 addresses */
const parseQuery = 'function parseQuery(search) {\n  const out = {};\n  for (const [key, value] of new URLSearchParams(search)) out[key] = value;\n  return out;\n}\n';
const buildQuery = 'function buildQuery(params) {\n  return Object.keys(params)\n    .filter((k) => params[k] !== null && params[k] !== undefined)\n    .sort()\n    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(String(params[k])))\n    .join("&");\n}\n';
const sameSite = 'function sameSite(a, b) {\n  try {\n    const x = new URL(a);\n    const y = new URL(b);\n    return (x.protocol === "http:" || x.protocol === "https:") && x.protocol === y.protocol && x.origin === y.origin;\n  } catch (e) {\n    return false;\n  }\n}\n';

export const phase4WebSolutions: Record<string, Sol> = {
  'web-27-make-counter': {
    valid: [J(counter), J('const makeCounter = (step = 1) => { let total = 0; return () => (total += step); };\n')],
    wrong: [
      // one shared counter for everybody
      J('let n = 0;\nfunction makeCounter(step = 1) {\n  return function () {\n    n += step;\n    return n;\n  };\n}\n'),
      // starts again on every call
      J('function makeCounter(step = 1) {\n  return function () {\n    let n = 0;\n    n += step;\n    return n;\n  };\n}\n'),
      // no default step
      J(rep(counter, 'step = 1', 'step')),
      // leaks a global
      J(rep(counter, '  let n = 0;\n', '  n = 0;\n')),
      // returns the value before adding
      J(rep(counter, '    n += step;\n    return n;', '    const old = n;\n    n += step;\n    return old;')),
    ],
  },
  'web-27-make-limiter': {
    valid: [J(limiter), J('function makeLimiter(max) {\n  let left = max;\n  return () => left-- > 0;\n}\n')],
    wrong: [
      J('let used = 0;\nfunction makeLimiter(max) {\n  return function () {\n    if (used < max) { used++; return true; }\n    return false;\n  };\n}\n'),
      J(rep(limiter, 'used < max', 'used <= max')),
      // counts refused calls too, and never refuses the first
      J('function makeLimiter(max) {\n  let used = 0;\n  return function () {\n    used++;\n    return used < max;\n  };\n}\n'),
      // a negative max still allows something
      J('function makeLimiter(max) {\n  let used = 0;\n  return function () {\n    used++;\n    return used <= Math.abs(max);\n  };\n}\n'),
      J(rep(limiter, '  let used = 0;\n', '  used = 0;\n')),
    ],
  },
  'web-27-ticket-dispenser': {
    valid: [J(dispenser), J('function makeDispenser(prefix) {\n  let n = 0;\n  return () => `${prefix}-${String(++n).padStart(3, "0")}`;\n}\n')],
    wrong: [
      J('let n = 0;\nfunction makeDispenser(prefix) {\n  return () => prefix + "-" + String(++n).padStart(3, "0");\n}\n'),
      J(rep(dispenser, '.padStart(3, "0")', '')),
      J(rep(dispenser, 'padStart(3, "0")', 'padStart(2, "0")')),
      J(rep(dispenser, '"-" + ', '"_" + ')),
      J(rep(dispenser, '  let n = 0;\n', '  n = 0;\n')),
      // pads to exactly three characters, cutting the number
      J('function makeDispenser(prefix) {\n  let n = 0;\n  return () => prefix + "-" + ("000" + ++n).slice(-3);\n}\n'),
    ],
  },
  'web-28-test-clamp': {
    valid: [J(testClamp)],
    wrong: [
      // only a typical case
      J(assertEqual + 'function testClamp(clamp) {\n  assertEqual(clamp(5, 0, 10), 5, "inside");\n  assertEqual(clamp(3, 0, 10), 3, "inside again");\n  assertEqual(clamp(7, 0, 10), 7, "inside again");\n}\n'),
      // nothing checked
      J('function testClamp(clamp) {\n  clamp(1, 0, 2);\n  clamp(5, 0, 2);\n  clamp(-5, 0, 2);\n}\n'),
      // wrong expectation: fails on a correct implementation
      J(assertEqual + 'function testClamp(clamp) {\n  assertEqual(clamp(15, 0, 10), 15, "above");\n  assertEqual(clamp(5, 0, 10), 5, "inside");\n  assertEqual(clamp(-3, 0, 10), 0, "below");\n}\n'),
      // never below the range and never on the edges
      J(assertEqual + 'function testClamp(clamp) {\n  assertEqual(clamp(5, 0, 10), 5, "inside");\n  assertEqual(clamp(15, 0, 10), 10, "above");\n  assertEqual(clamp(50, 0, 10), 10, "far above");\n}\n'),
      // doesn't call the implementation enough times
      J(assertEqual + 'function testClamp(clamp) {\n  assertEqual(clamp(15, 0, 10), 10, "above");\n}\n'),
    ],
  },
  'web-28-test-median': {
    valid: [J(testMedian)],
    wrong: [
      J(assertEqual + 'function testMedian(median) {\n  assertEqual(median([1, 2, 3]), 2, "odd");\n  assertEqual(median([2, 2, 2]), 2, "same");\n  assertEqual(median([5]), 5, "one");\n}\n'),
      // never checks the input is unchanged
      J(testMedian.replace(/  const input[\s\S]*?"the input must not change"\);\n/, '')),
      // never checks an unsorted list
      J(testMedian.replace('  assertEqual(median([3, 1, 2]), 2, "unsorted odd");\n', '').replace('  assertEqual(median([10, 9, 8]), 9, "numbers, not text");\n', '')),
      // expects the wrong thing for an even count: fails on a correct implementation
      J(testMedian.replace('assertEqual(median([1, 2, 3, 4]), 2.5, "even");', 'assertEqual(median([1, 2, 3, 4]), 3, "even");')),
      // no empty list
      J(testMedian.replace('  assertEqual(median([]), null, "empty");\n', '')),
    ],
  },
  'web-28-test-slugify': {
    valid: [J(testSlugify)],
    wrong: [
      J(assertEqual + 'function testSlugify(slugify) {\n  assertEqual(slugify("hello world"), "hello-world", "basic");\n  assertEqual(slugify("a b"), "a-b", "basic");\n  assertEqual(slugify("x"), "x", "basic");\n}\n'),
      J(testSlugify.replace('  assertEqual(slugify("Hello, World!"), "hello-world", "basic");\n', '').replace('  assertEqual(slugify("A&B"), "a-b", "symbols");\n', '').replace('  assertEqual(slugify("  Many   spaces  "), "many-spaces", "runs and ends");\n', '').replace('  assertEqual(slugify("---x---"), "x", "dashes at the ends");\n', '')),
      J(testSlugify.replace('"hello-world", "basic"', '"Hello-World", "basic"')),
      J(testSlugify.replace('  assertEqual(slugify("Version 2.0"), "version-2-0", "digits stay");\n', '')),
      J(testSlugify.replace('  assertEqual(slugify("Crème brûlée"), "cr-me-br-l-e", "accents are separators");\n', '')),
    ],
  },
  'web-29-card-badge': {
    valid: [F(cardHtml, cardCss)],
    wrong: [
      // no anchor: measured from the page
      F(cardHtml, cardCss.replace('position: relative; ', '')),
      F(cardHtml, cardCss.replace('top: 8px;', 'top: 0;')),
      F(cardHtml, cardCss.replace('right: 8px;', 'right: 0;')),
      // relative offsets move it, but it stays in the flow
      F(cardHtml, cardCss.replace('.badge { position: absolute;', '.badge { position: relative;')),
      // floated instead of positioned
      F(cardHtml, cardCss.replace('.badge { position: absolute; top: 8px; right: 8px;', '.badge { float: right; margin: 8px;')),
      // measured from the wrong side
      F(cardHtml, cardCss.replace('right: 8px;', 'left: 8px;')),
    ],
  },
  'web-29-status-dot': {
    valid: [F(dotHtml, dotCss)],
    wrong: [
      F(dotHtml, dotCss.replace('.avatar { position: relative;', '.avatar {')),
      // inside the corner
      F(dotHtml, dotCss.replace('right: -7px; bottom: -7px;', 'right: 0; bottom: 0;')),
      // completely outside
      F(dotHtml, dotCss.replace('right: -7px; bottom: -7px;', 'right: -14px; bottom: -14px;')),
      // a margin trick that moves the following text
      F(dotHtml, dotBase + '.dot { margin: 50px 0 0 57px; }\n'),
      // top-right instead of bottom-right
      F(dotHtml, dotCss.replace('bottom: -7px;', 'top: -7px;')),
    ],
  },
  'web-29-sale-ribbon': {
    valid: [F(ribbonHtml, ribbonCss)],
    wrong: [
      // hidden behind the photo
      F(ribbonHtml, ribbonCss.replace(' z-index: 3;', '')),
      // not anchored to the tile
      F(ribbonHtml, ribbonCss.replace('.tile { position: relative;', '.tile {')),
      // wrong corner
      F(ribbonHtml, ribbonCss.replace('top: 0; left: 0;', 'top: 0; right: 0;')),
      // moves the photo
      F(ribbonHtml, ribbonCss + '.photo { margin-left: 10px; }\n'),
    ],
  },
  'web-29-sticky-header': {
    valid: [F(headerHtml, headerBase + 'header { position: sticky; top: 0; z-index: 10; }\n'), F(headerHtml, headerBase.replace('main {', 'main { margin-top: 60px;') + 'header { position: fixed; top: 0; left: 0; right: 0; z-index: 10; }\n')],
    wrong: [
      // sticks, but underneath the text
      F(headerHtml, headerBase + 'header { position: sticky; top: 0; }\n'),
      // sticks 10px below the top
      F(headerHtml, headerBase + 'header { position: sticky; top: 10px; z-index: 10; }\n'),
      // fixed but the article starts underneath it
      F(headerHtml, headerBase + 'header { position: fixed; top: 0; left: 0; right: 0; z-index: 10; }\n'),
      // never leaves the page
      F(headerHtml, headerBase + 'header { position: relative; top: 0; z-index: 10; }\n'),
      // sticky with no offset
      F(headerHtml, headerBase + 'header { position: sticky; z-index: 10; }\n'),
    ],
  },
  'web-29-sticky-contents': {
    valid: [F(tocHtml, tocBase + '.toc { position: sticky; top: 16px; align-self: flex-start; }\n')],
    wrong: [
      // sticky, but stretched: nowhere to move
      F(tocHtml, tocBase + '.toc { position: sticky; top: 16px; }\n'),
      // fixed: leaves the flow and the columns collapse
      F(tocHtml, tocBase + '.toc { position: fixed; top: 16px; align-self: flex-start; }\n'),
      // sticks at the wrong distance
      F(tocHtml, tocBase + '.toc { position: sticky; top: 0; align-self: flex-start; }\n'),
      // no sticky at all
      F(tocHtml, tocBase + '.toc { align-self: flex-start; }\n'),
      // the layout is turned into blocks
      F(tocHtml, tocBase.replace('display: flex;', 'display: block;') + '.toc { position: sticky; top: 16px; }\n'),
    ],
  },
  'web-30-task-list': {
    valid: [J(todoJs, todoHtml)],
    wrong: [
      // removal by text: two identical tasks both go
      J(rep(todoJs, 'tasks = tasks.filter((t) => t.id !== id);', 'const text = tasks.find((t) => t.id === id).text;\n  tasks = tasks.filter((t) => t.text !== text);'), todoHtml),
      // blank tasks are accepted
      J(rep(todoJs, 'if (text) tasks.push', 'tasks.push'), todoHtml),
      // the count never says "task" for one
      J(rep(todoJs, '(tasks.length === 1 ? " task" : " tasks")', '" tasks"'), todoHtml),
      // innerHTML: typed markup becomes real elements
      J(rep(todoJs, '    li.append(t.text + " ");\n', '    li.innerHTML = t.text + " ";\n'), todoHtml),
      // no aria-label
      J(rep(todoJs, '    b.setAttribute("aria-label", "Remove " + t.text);\n', ''), todoHtml),
      // the box is not cleared or trimmed
      J(rep(rep(todoJs, 'const text = box.value.trim();', 'const text = box.value;'), '  box.value = "";\n  render();', '  render();'), todoHtml),
      // the summary is only updated when adding, not when removing
      J(rep(todoJs, '  tasks = tasks.filter((t) => t.id !== id);\n  render();', '  tasks = tasks.filter((t) => t.id !== id);\n  button.closest("li").remove();'), todoHtml),
    ],
  },
  'web-30-cart': {
    valid: [J(cartJs, cartHtml)],
    wrong: [
      // negative and non-numeric prices accepted
      J(rep(cartJs, 'Number.isFinite(price) && price >= 0', 'true'), cartHtml),
      // zero not allowed
      J(rep(cartJs, 'price >= 0', 'price > 0'), cartHtml),
      // no decimals
      J(rep(cartJs, '"Total: £" + sum.toFixed(2)', '"Total: £" + sum'), cartHtml),
      // the total is computed once and not updated when removing
      J(rep(cartJs, '  lines = lines.filter((l) => l.id !== id);\n  render();', '  lines = lines.filter((l) => l.id !== id);\n  button.closest("li").remove();'), cartHtml),
      // removal by name
      J(rep(cartJs, 'lines = lines.filter((l) => l.id !== id);', 'const name = lines.find((l) => l.id === id).name;\n  lines = lines.filter((l) => l.name !== name);'), cartHtml),
      // innerHTML
      J(rep(cartJs, '    li.append(l.name + " ");\n', '    li.innerHTML = l.name + " ";\n'), cartHtml),
      // boxes are not cleared
      J(rep(rep(cartJs, '    document.querySelector("#item").value = "";\n', ''), '    document.querySelector("#price").value = "";\n', ''), cartHtml),
      // an empty price counts as zero
      J(rep(cartJs, 'raw === "" ? NaN : Number(raw)', 'Number(raw)'), cartHtml),
    ],
  },
  'web-30-guest-list': {
    valid: [J(guestJs, guestHtml)],
    wrong: [
      // the limit is not enforced
      J(rep(guestJs, 'guests.length >= LIMIT', 'false'), guestHtml),
      // one too few allowed
      J(rep(guestJs, 'guests.length >= LIMIT', 'guests.length >= LIMIT - 1'), guestHtml),
      // the message stays after a removal
      J(rep(guestJs, '  guests = guests.filter((g) => g.id !== id);\n  msg.textContent = "";', '  guests = guests.filter((g) => g.id !== id);'), guestHtml),
      // removal by name
      J(rep(guestJs, 'guests = guests.filter((g) => g.id !== id);', 'const name = guests.find((g) => g.id === id).name;\n  guests = guests.filter((g) => g.name !== name);'), guestHtml),
      // blank names accepted
      J(rep(guestJs, '  if (name) {', '  if (true) {'), guestHtml),
      // innerHTML
      J(rep(guestJs, '    li.append(g.name + " ");\n', '    li.innerHTML = g.name + " ";\n'), guestHtml),
      // a different message
      J(rep(guestJs, '"The list is full"', '"Full"'), guestHtml),
    ],
  },
  'web-31-parse-query': {
    valid: [J(parseQuery), J('function parseQuery(search) {\n  return Object.fromEntries(new URLSearchParams(search));\n}\n')],
    wrong: [
      // hand-made splitting: no decoding
      J('function parseQuery(search) {\n  const out = {};\n  for (const part of search.replace(/^\\?/, "").split("&")) {\n    if (!part) continue;\n    const [k, v = ""] = part.split("=");\n    out[k] = v;\n  }\n  return out;\n}\n'),
      // first value wins
      J('function parseQuery(search) {\n  const out = {};\n  for (const [k, v] of new URLSearchParams(search)) if (!(k in out)) out[k] = v;\n  return out;\n}\n'),
      // keeps repeated keys as arrays
      J('function parseQuery(search) {\n  const p = new URLSearchParams(search);\n  const out = {};\n  for (const k of p.keys()) out[k] = p.getAll(k).length > 1 ? p.getAll(k) : p.get(k);\n  return out;\n}\n'),
      // decodes with decodeURIComponent only (a plus stays a plus, and values with = break)
      J('function parseQuery(search) {\n  const out = {};\n  for (const part of search.replace(/^\\?/, "").split("&")) {\n    if (!part) continue;\n    const [k, v = ""] = part.split("=");\n    out[decodeURIComponent(k)] = decodeURIComponent(v);\n  }\n  return out;\n}\n'),
    ],
  },
  'web-31-build-query': {
    valid: [J(buildQuery)],
    wrong: [
      // URLSearchParams writes spaces as +
      J('function buildQuery(params) {\n  const p = new URLSearchParams();\n  for (const k of Object.keys(params).sort()) if (params[k] != null) p.append(k, String(params[k]));\n  return p.toString();\n}\n'),
      // no encoding
      J('function buildQuery(params) {\n  return Object.keys(params).filter((k) => params[k] != null).sort().map((k) => k + "=" + params[k]).join("&");\n}\n'),
      // null values written as text
      J(rep(buildQuery, '    .filter((k) => params[k] !== null && params[k] !== undefined)\n', '')),
      // not sorted
      J(rep(buildQuery, '    .sort()\n', '')),
      // only the values are encoded
      J(rep(buildQuery, 'encodeURIComponent(k) + "="', 'k + "="')),
      // falsy values dropped
      J(rep(buildQuery, 'params[k] !== null && params[k] !== undefined', 'params[k]')),
    ],
  },
  'web-31-same-origin': {
    valid: [J(sameSite), J('function sameSite(a, b) {\n  let x, y;\n  try { x = new URL(a); y = new URL(b); } catch (e) { return false; }\n  if (x.protocol !== "http:" && x.protocol !== "https:") return false;\n  return x.protocol === y.protocol && x.hostname === y.hostname && x.port === y.port;\n}\n')],
    wrong: [
      // compares the text before the first slash
      J('function sameSite(a, b) {\n  const head = (u) => u.split("/").slice(0, 3).join("/").toLowerCase();\n  return head(a) === head(b);\n}\n'),
      // ignores the protocol
      J(rep(sameSite, 'x.protocol === y.protocol && x.origin === y.origin', 'x.hostname === y.hostname')),
      // ignores the port
      J(rep(sameSite, 'x.protocol === y.protocol && x.origin === y.origin', 'x.protocol === y.protocol && x.hostname === y.hostname')),
      // crashes on invalid input
      J(rep(sameSite, '  } catch (e) {\n    return false;\n  }', '  } finally {\n  }')),
      // other protocols count
      J(rep(sameSite, '(x.protocol === "http:" || x.protocol === "https:") && ', '')),
      // prefix comparison: a.com.evil.com matches a.com
      J('function sameSite(a, b) {\n  try {\n    const x = new URL(a);\n    const y = new URL(b);\n    return (x.protocol === "http:" || x.protocol === "https:") && x.protocol === y.protocol && (x.host.startsWith(y.host) || y.host.startsWith(x.host));\n  } catch (e) {\n    return false;\n  }\n}\n'),
    ],
  },
};
