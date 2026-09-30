import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

const T = (name: string, script: string, visible = false) => web(name, script, { visible });

/** Helpers injected into check scripts: read the rendered list back as plain text. */
const READ = "const rows = (sel) => h.$$(sel).map((li) => { const c = li.cloneNode(true); c.querySelectorAll('button').forEach((b) => b.remove()); return c.textContent.replace(/\\s+/g, ' ').trim(); });";

const TODO_HTML = '<h1>Shift tasks</h1>\n<form id="add-form">\n  <label>Task <input id="new"></label>\n  <button type="submit">Add</button>\n</form>\n<p id="count"></p>\n<ul id="list"></ul>\n';
const CART_HTML = '<h1>Parts order</h1>\n<form id="cart-form">\n  <label>Item <input id="item"></label>\n  <label>Price <input id="price"></label>\n  <button type="submit">Add</button>\n</form>\n<ul id="cart"></ul>\n<p id="total"></p>\n';
const GUEST_HTML = '<h1>Open day</h1>\n<form id="guest-form">\n  <label>Guest <input id="guest"></label>\n  <button type="submit">Add</button>\n</form>\n<p id="count"></p>\n<p id="msg" role="status"></p>\n<ul id="guests"></ul>\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-30-render-from-state', title: 'The Page Is a Picture of the Data', language: 'web', skillId: 'js.state',
    blurb: 'Keep the truth in one array, draw the page from it every time, and let one listener handle every button.', prerequisites: ['web-19-events'], xpReward: 80,
    reference: {
      title: 'Rendering from state',
      body: text(
        '**State** is the data the page is about (an array of tasks). The DOM is just a **picture** of it. The reliable pattern: change the state (`tasks.push(...)`, `tasks = tasks.filter(...)`), then call one `render()` that rebuilds the list and every number that depends on it from scratch. Because `render()` always redraws *everything* from the state, the page can never drift out of sync.',
        '**Event delegation:** items are created and removed all the time, so do not attach a listener to each button. Attach **one** listener to the list (`list.addEventListener("click", (e) => { const b = e.target.closest("button"); ... })`), and identify the item from `data-id` on its element. It also works for items that do not exist yet.',
        'Safety and detail: build text with `textContent` (never `innerHTML` with user text: `<b>` typed by a user must stay literal). Give each item an **id** so removing "the second Same" does not remove the first. Trim input, ignore blanks, put focus back in the field, and give icon-only buttons an `aria-label`.',
      ),
      example: 'let items = [];\nfunction render() {\n  list.textContent = "";\n  for (const item of items) {\n    const li = document.createElement("li");\n    li.dataset.id = item.id;\n    li.textContent = item.text;\n    list.append(li);\n  }\n  count.textContent = items.length + " items";\n}\nlist.addEventListener("click", (e) => { /* find the id, filter it out, render() */ });',
    },
    steps: [
      { kind: 'teach', title: 'Do not edit the page; edit the data', body: text('A beginner adds an item by creating an element, and removes one by deleting an element, and soon the count is wrong, the total is stale and a deleted item lingers. The professional habit is the opposite: **change the data, redraw the page**.', 'It is simple: one array is the truth; `render()` clears the list and rebuilds it and the summary from that array; every click just updates the array and calls `render()`.') },
      webDemo({
        title: 'State, render, one listener',
        body: text('Add a few items, then remove one from the middle. Read the code: nothing ever removes a `<li>` directly.'),
        files: files('<form id="f"><input id="t" aria-label="Item"><button>Add</button></form>\n<p id="n"></p>\n<ul id="l"></ul>\n', '', 'let items = [];\nlet nextId = 1;\nconst list = document.querySelector("#l");\nfunction render() {\n  list.textContent = "";\n  for (const it of items) {\n    const li = document.createElement("li");\n    li.dataset.id = it.id;\n    li.textContent = it.text + " ";\n    const b = document.createElement("button");\n    b.textContent = "x";\n    li.append(b);\n    list.append(li);\n  }\n  document.querySelector("#n").textContent = items.length + " items";\n}\ndocument.querySelector("#f").addEventListener("submit", (e) => {\n  e.preventDefault();\n  const box = document.querySelector("#t");\n  if (box.value.trim()) items.push({ id: nextId++, text: box.value.trim() });\n  box.value = "";\n  render();\n});\nlist.addEventListener("click", (e) => {\n  const li = e.target.closest("li");\n  if (!li || !e.target.closest("button")) return;\n  items = items.filter((it) => String(it.id) !== li.dataset.id);\n  render();\n});\nrender();\n'),
        notice: 'Removing an item is `items.filter(...)` followed by `render()`. The single click listener on the list also works for items added after the page loaded, which is the point of delegation.',
      }),
      { kind: 'challenge', challengeId: 'web-30-task-list' },
      { kind: 'challenge', challengeId: 'web-30-cart' },
    ],
  },
  objectives: [
    { id: 'js-obj-render-state', title: 'Keep a list on the page in sync with an array', summary: 'Add and remove items by changing state and re-rendering, with delegation, input handling and correct summaries.' },
  ],
  challenges: [
    wc({
      id: 'web-30-task-list', title: 'A Task List That Stays Correct', mode: 'learning', skillIds: ['js.state', 'js.dom'], concepts: ['state', 'render', 'event-delegation', 'textContent'], difficulty: 3, context: 'productivity',
      prompt: text('The page has a form (`#add-form` with the box `#new`), a summary `#count` and an empty list `#list`. Make it work:', '- Submitting the form adds the box’s text (spaces trimmed) as a new `<li>` at the **end** of `#list`. **Blank text is ignored.** Afterwards the box is empty.', '- Each `<li>` shows the task text and contains a `<button class="remove">` with `aria-label` **`Remove `** followed by the task text (for example `Remove Oil the press`). Clicking it removes **that** task only, even when two tasks have the same text.', '- `#count` always says how many tasks there are: `0 tasks`, `1 task`, `2 tasks`, …', '- Text typed by a person is shown as plain text, never as HTML.'),
      expectedBehavior: 'Tasks can be added and removed one by one; the count is always right.',
      guidedSteps: ['Keep an array of tasks, each with a unique `id` and `text`.', 'Write `render()` that clears the list, rebuilds every `<li>` with `textContent`, and sets `#count`.', 'On submit: prevent the default, trim, ignore blanks, push, clear the box, `render()`.', 'One click listener on `#list`: find the button, find its item, filter it out of the array, `render()`.'],
      starterFiles: files(TODO_HTML, '', ''), tabs: ['js'],
      hints: ['Where should the truth about the tasks live: in the page, or in your program?', 'What must every action end with, so that the page and the summary cannot disagree?', 'If two tasks read "Same", how does a click know which one was meant?'],
      checks: [
        web('Adding tasks', `${READ} h.type('#new', 'Oil the press'); h.submit('#add-form'); h.eq(rows('#list li'), ['Oil the press']); h.eq(h.text('#count'), '1 task'); h.eq(h.value('#new'), '', 'The box should be cleared'); h.type('#new', '  Check guards '); h.submit('#add-form'); h.eq(rows('#list li'), ['Oil the press', 'Check guards'], 'Tasks are added at the end, with spaces trimmed'); h.eq(h.text('#count'), '2 tasks');`, { visible: true }),
        T('The count when empty, and blanks are ignored', `${READ} h.eq(h.text('#count'), '0 tasks', 'The count is right from the start'); h.type('#new', '   '); h.submit('#add-form'); h.eq(h.$$('#list li').length, 0, 'Blank text must be ignored'); h.eq(h.text('#count'), '0 tasks');`),
        T('Removing one task', `${READ} for (const t of ['A', 'B', 'C']) { h.type('#new', t); h.submit('#add-form'); } h.click('#list li:nth-child(2) button.remove'); h.eq(rows('#list li'), ['A', 'C']); h.eq(h.text('#count'), '2 tasks'); h.type('#new', 'D'); h.submit('#add-form'); h.eq(rows('#list li'), ['A', 'C', 'D'], 'Adding after a removal'); h.click('#list li:nth-child(1) button.remove'); h.click('#list li:nth-child(1) button.remove'); h.click('#list li:nth-child(1) button.remove'); h.eq(h.$$('#list li').length, 0); h.eq(h.text('#count'), '0 tasks');`),
        T('Two tasks with the same text', `${READ} for (const t of ['Same', 'Other', ' Same ']) { h.type('#new', t); h.submit('#add-form'); } h.eq(rows('#list li'), ['Same', 'Other', 'Same']); h.click('#list li:nth-child(3) button.remove'); h.eq(rows('#list li'), ['Same', 'Other'], 'Only the clicked task is removed'); h.click('#list li:nth-child(1) button.remove'); h.eq(rows('#list li'), ['Other']);`),
        T('Buttons are labelled', `h.type('#new', 'Grease bearings'); h.submit('#add-form'); h.eq(h.attr('#list li button.remove', 'aria-label'), 'Remove Grease bearings', 'The remove button needs an accessible name');`),
        T('Text is not treated as HTML', `h.type('#new', '<b>bold</b>'); h.submit('#add-form'); h.assert(!document.querySelector('#list b'), 'Text typed by a person must not become HTML.'); h.assert(h.$$('#list li')[0].textContent.includes('<b>bold</b>'), 'The angle brackets should be shown as typed.');`),
      ],
      xpReward: 90, coinReward: 13,
    }),
    wc({
      id: 'web-30-cart', objectiveId: 'js-obj-render-state', title: 'A Parts Order With a Running Total', mode: 'challenge', skillIds: ['js.state', 'js.dom'], concepts: ['state', 'render', 'event-delegation', 'textContent'], difficulty: 3, context: 'retail',
      prompt: text('A parts order page has a form (`#cart-form` with boxes `#item` and `#price`), a list `#cart` and a total `#total`. Make it work:', '- Submitting adds a line to the **end** of `#cart` **only if** the item name (spaces trimmed) is not blank **and** the price is a number that is zero or more. Otherwise nothing is added. After a successful add both boxes are cleared.', '- A line shows the name, then the price with two decimals inside a `<span class="price">` such as `£4.50`, and a `<button class="remove">` with `aria-label` `Remove ` plus the name. Clicking it removes **that** line only, even if another line has the same name.', '- `#total` always reads `Total: £` followed by the sum of all prices with two decimals (`Total: £0.00` when empty).', '- Names typed by a person are shown as plain text.'),
      expectedBehavior: 'Valid lines are added and removed one by one; the total is always the sum.',
      starterFiles: files(CART_HTML, '', ''), tabs: ['js'],
      hints: ['Where should the truth about the order live?', 'What should every action end with so the lines and the total cannot disagree?', 'Money with cents needs care: how do you show exactly two decimals?'],
      checks: [
        web('Adding lines and the total', `${READ} const add = (n, p) => { h.type('#item', n); h.type('#price', p); h.submit('#cart-form'); }; add('Bolts', '4.5'); add('Gears', '12'); h.eq(h.$$('#cart li .price').map((x) => x.textContent), ['£4.50', '£12.00']); h.eq(rows('#cart li').map((t) => t.startsWith('Bolts')), [true, false]); h.eq(h.text('#total'), 'Total: £16.50'); h.eq([h.value('#item'), h.value('#price')], ['', ''], 'Both boxes are cleared');`, { visible: true }),
        T('The empty order', `h.eq(h.text('#total'), 'Total: £0.00', 'The total is right from the start');`),
        T('Invalid input is ignored', `const add = (n, p) => { h.type('#item', n); h.type('#price', p); h.submit('#cart-form'); }; add('', '5'); add('   ', '5'); add('Nuts', ''); add('Nuts', 'abc'); add('Nuts', '-1'); h.eq(h.$$('#cart li').length, 0, 'None of these are valid lines'); add('Free sample', '0'); h.eq(h.$$('#cart li').length, 1, 'A price of zero is allowed'); h.eq(h.text('#total'), 'Total: £0.00');`),
        T('Removing lines updates the total', `const add = (n, p) => { h.type('#item', n); h.type('#price', p); h.submit('#cart-form'); }; add('A', '1.10'); add('B', '2.20'); add('C', '3.30'); h.click('#cart li:nth-child(2) button.remove'); h.eq(h.$$('#cart li').length, 2); h.eq(h.text('#total'), 'Total: £4.40'); add('D', '0.60'); h.eq(h.text('#total'), 'Total: £5.00'); h.click('#cart li:nth-child(1) button.remove'); h.click('#cart li:nth-child(1) button.remove'); h.click('#cart li:nth-child(1) button.remove'); h.eq(h.text('#total'), 'Total: £0.00');`),
        T('Two lines with the same name', `const add = (n, p) => { h.type('#item', n); h.type('#price', p); h.submit('#cart-form'); }; add('Washer', '0.10'); add('Washer', '0.30'); h.click('#cart li:nth-child(2) button.remove'); h.eq(h.$$('#cart li .price').map((x) => x.textContent), ['£0.10'], 'Only the clicked line is removed'); h.eq(h.text('#total'), 'Total: £0.10');`),
        T('Buttons are labelled, text is plain', `const add = (n, p) => { h.type('#item', n); h.type('#price', p); h.submit('#cart-form'); }; add(' <i>Gasket</i> ', '2'); h.assert(!document.querySelector('#cart i'), 'Text typed by a person must not become HTML.'); h.eq(h.attr('#cart li button.remove', 'aria-label'), 'Remove <i>Gasket</i>', 'The remove button is named after the (trimmed) item');`),
      ],
      xpReward: 120, coinReward: 18,
    }),
    wc({
      id: 'web-30-guest-list', objectiveId: 'js-obj-render-state', title: 'A Guest List With a Limit', mode: 'challenge', skillIds: ['js.state', 'js.dom'], concepts: ['state', 'render', 'event-delegation', 'textContent'], difficulty: 3, context: 'events',
      prompt: text('An open day has room for **5 guests**. The page has a form (`#guest-form` with the box `#guest`), a summary `#count`, a status line `#msg` and a list `#guests`. Make it work:', '- Submitting adds the name (spaces trimmed) to the **end** of `#guests` unless it is blank. The box is cleared afterwards.', '- Each line shows the name and has a `<button class="remove">` with `aria-label` `Remove ` plus the name. Clicking it removes **that** guest only, even if another guest has the same name.', '- `#count` always reads `N of 5 guests` (for example `0 of 5 guests`, `1 of 5 guests`).', '- When the list is **full**, a further name is **not added** and `#msg` says `The list is full`. Removing a guest clears `#msg`.', '- Names typed by a person are shown as plain text.'),
      expectedBehavior: 'Guests can be added up to the limit and removed one by one; the summary and message are always right.',
      starterFiles: files(GUEST_HTML, '', ''), tabs: ['js'],
      hints: ['Where should the truth about the guests live?', 'What must every action end with so the page cannot disagree with the data?', 'The message is also part of the picture: when should it be blank, and when should it say the list is full?'],
      checks: [
        web('Adding guests', `${READ} h.type('#guest', 'Ana'); h.submit('#guest-form'); h.type('#guest', ' Bo '); h.submit('#guest-form'); h.eq(rows('#guests li'), ['Ana', 'Bo']); h.eq(h.text('#count'), '2 of 5 guests'); h.eq(h.value('#guest'), '', 'The box is cleared');`, { visible: true }),
        T('The start and blanks', `h.eq(h.text('#count'), '0 of 5 guests'); h.type('#guest', '  '); h.submit('#guest-form'); h.eq(h.$$('#guests li').length, 0); h.eq(h.text('#count'), '0 of 5 guests'); h.eq(h.text('#msg'), '', 'No message for a blank name');`),
        T('The limit', `${READ} for (const n of ['A', 'B', 'C', 'D', 'E']) { h.type('#guest', n); h.submit('#guest-form'); } h.eq(h.text('#count'), '5 of 5 guests'); h.eq(h.text('#msg'), '', 'No message until someone is refused'); h.type('#guest', 'F'); h.submit('#guest-form'); h.eq(rows('#guests li'), ['A', 'B', 'C', 'D', 'E'], 'A sixth guest is not added'); h.eq(h.text('#msg'), 'The list is full'); h.eq(h.text('#count'), '5 of 5 guests');`),
        T('Removing frees a place and clears the message', `${READ} for (const n of ['A', 'B', 'C', 'D', 'E', 'F']) { h.type('#guest', n); h.submit('#guest-form'); } h.click('#guests li:nth-child(2) button.remove'); h.eq(rows('#guests li'), ['A', 'C', 'D', 'E']); h.eq(h.text('#count'), '4 of 5 guests'); h.eq(h.text('#msg'), '', 'The message is cleared by a removal'); h.type('#guest', 'G'); h.submit('#guest-form'); h.eq(rows('#guests li'), ['A', 'C', 'D', 'E', 'G']); h.eq(h.text('#count'), '5 of 5 guests');`),
        T('Two guests with the same name', `${READ} for (const n of ['Sam', 'Kim', 'Sam']) { h.type('#guest', n); h.submit('#guest-form'); } h.click('#guests li:nth-child(3) button.remove'); h.eq(rows('#guests li'), ['Sam', 'Kim'], 'Only the clicked guest is removed');`),
        T('Buttons are labelled, text is plain', `h.type('#guest', '<u>Zed</u>'); h.submit('#guest-form'); h.assert(!document.querySelector('#guests u'), 'Text typed by a person must not become HTML.'); h.eq(h.attr('#guests li button.remove', 'aria-label'), 'Remove <u>Zed</u>');`),
      ],
      xpReward: 120, coinReward: 18,
    }),
  ],
};
