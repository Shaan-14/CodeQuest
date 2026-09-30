import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-19-events', title: 'Events and State', language: 'web', skillId: 'js.dom',
    blurb: 'Respond to clicks and typing, keep state in variables, and re-render.', prerequisites: ['web-18-dom'], xpReward: 65,
    reference: {
      title: 'Events and state',
      body: text(
        '`el.addEventListener("click", (event) => { ... })` runs code when something happens. Common events: `click`, `input` (every keystroke), `change`, `submit`, `keydown`. The `event` object has `event.target` (what was clicked) and `event.preventDefault()`. **Event delegation**: put one listener on a parent (`list.addEventListener("click", e => { const li = e.target.closest("li"); ... })`) so it also works for items added later.',
        '**State** is the data your page is currently showing (a count, a list of tasks). Keep it in a variable (`let count = 0;`, `const tasks = [];`), change it inside event handlers, then **render**: one function that makes the DOM match the state. Never read state back out of the DOM.',
      ),
      example: 'let count = 0;\nconst out = document.querySelector("#count");\ndocument.querySelector("#inc").addEventListener("click", () => {\n  count++;\n  out.textContent = count;\n});',
    },
    steps: [
      { kind: 'teach', title: 'Pages that respond', body: text('A page that only shows things is a document. A page that **reacts** is an application. The bridge is the **event**: the browser tells your code that the user clicked, typed, submitted or pressed a key, and your handler decides what to do.', 'The recipe for almost every interface: (1) hold the truth in a variable, (2) update that variable in a handler, (3) call `render()`. If you follow it, bugs where the screen and the data disagree mostly disappear.') },
      webDemo({
        title: 'A counter',
        body: text('Run it and click the button in the page preview. Then add a second button that resets the count to 0.'),
        files: files('<button id="inc">Add one</button>\n<p>Count: <span id="count">0</span></p>\n', '', 'let count = 0;\nconst out = document.querySelector("#count");\ndocument.querySelector("#inc").addEventListener("click", () => {\n  count++;\n  out.textContent = count;\n});\n'),
        notice: 'The number lives in `count`; the page is only a picture of it. The handler changes the variable and then updates the picture, in that order.',
      }),
      { kind: 'challenge', challengeId: 'web-19-click-counter' },
      { kind: 'challenge', challengeId: 'web-19-stock-counter' },
    ],
  },
  objectives: [{ id: 'js-obj-events-state', title: 'Build interaction from events and state', summary: 'Handlers that update state variables and re-render, with limits, delegation and disabled controls.' }],
  challenges: [
    wc({
      id: 'web-19-click-counter', title: 'The Visitor Counter', mode: 'learning', skillIds: ['js.dom'], concepts: ['addEventListener', 'click', 'state', 'textContent'], difficulty: 2, context: 'business',
      prompt: text('The page has a button `#visit` and a number `#total` showing `0`. Every click on the button adds 1 to the number. A second button `#reset` sets it back to 0.'),
      expectedBehavior: 'Clicks increase the shown number; reset returns it to 0.',
      guidedSteps: ['Keep the count in a `let` variable.', 'Add a click listener to each button.', 'After changing the variable, update `#total`.'],
      starterFiles: files('<button id="visit">Visit</button>\n<button id="reset">Reset</button>\n<p>Total: <span id="total">0</span></p>\n', '', ''), tabs: ['js'],
      hints: ['Two buttons need two listeners.', 'The number shown must always match the variable.', '`addEventListener("click", ...)`, `count++`, `textContent = count`.'],
      checks: [
        web('Clicking adds one', "h.click('#visit'); h.click('#visit'); h.click('#visit'); h.eq(h.text('#total'), '3');"),
        web('Reset', "h.click('#visit'); h.click('#visit'); h.click('#reset'); h.eq(h.text('#total'), '0'); h.click('#visit'); h.eq(h.text('#total'), '1', 'Counting works again after a reset');"),
      ],
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-19-stock-counter', objectiveId: 'js-obj-events-state', title: 'The Stock Counter', mode: 'challenge', skillIds: ['js.dom'], concepts: ['addEventListener', 'state', 'event delegation', 'rendering'], difficulty: 3, context: 'inventory',
      prompt: text('A stock counter shows a quantity `#qty` (starting at 5) with buttons `#minus` and `#plus`. Each click changes it by 1, but it can never go below **0** or above **20**. When the quantity is 0 the minus button must be **disabled**; at 20 the plus button must be disabled; otherwise both are enabled. The paragraph `#msg` says `Minimum reached` at 0, `Maximum reached` at 20, and is empty otherwise. The screen must always match the state, including at the start.'),
      expectedBehavior: 'A quantity that changes by one, stays between 0 and 20, and disables the matching button with a message.',
      starterFiles: files('<button id="minus">-</button>\n<span id="qty">?</span>\n<button id="plus">+</button>\n<p id="msg"></p>\n', '', ''), tabs: ['js'],
      hints: ['One variable holds the truth; one function makes the page match it.', 'Call that function once at the start too.', '`render()` sets the text, the two `disabled` properties and the message from the state.'],
      checks: [
        web('Counting up and down', "h.eq(h.text('#qty'), '5'); h.click('#plus'); h.click('#plus'); h.eq(h.text('#qty'), '7'); h.click('#minus'); h.eq(h.text('#qty'), '6');"),
        web('The lower limit', "for (let i = 0; i < 9; i++) h.click('#minus'); h.eq(h.text('#qty'), '0'); h.assert(h.$('#minus').disabled, 'The minus button is disabled at 0.'); h.assert(!h.$('#plus').disabled); h.eq(h.text('#msg'), 'Minimum reached'); h.$('#minus').click(); h.eq(h.text('#qty'), '0', 'It never goes below 0'); h.click('#plus'); h.eq(h.text('#qty'), '1'); h.assert(!h.$('#minus').disabled, 'Minus is enabled again above 0.'); h.eq(h.text('#msg'), '');"),
        web('The upper limit', "for (let i = 0; i < 25; i++) h.click('#plus'); h.eq(h.text('#qty'), '20'); h.assert(h.$('#plus').disabled, 'The plus button is disabled at 20.'); h.eq(h.text('#msg'), 'Maximum reached'); h.$('#plus').click(); h.eq(h.text('#qty'), '20'); h.click('#minus'); h.assert(!h.$('#plus').disabled); h.eq(h.text('#msg'), '');", { visible: false }),
        web('The screen matches at the start', "h.assert(!h.$('#minus').disabled && !h.$('#plus').disabled, 'Both buttons start enabled.'); h.eq(h.text('#msg'), '');", { visible: false }),
      ],
      xpReward: 85, coinReward: 13,
    }),
    wc({
      id: 'web-19-todo-list', objectiveId: 'js-obj-events-state', title: 'The Shift Task List', mode: 'challenge', skillIds: ['js.dom'], concepts: ['addEventListener', 'state', 'event delegation', 'rendering'], difficulty: 3, context: 'scheduling',
      prompt: text('Make the task list work. Typing a task in `#new` and clicking `#add` adds it as an `li` in `#tasks` (leading and trailing spaces removed; an empty or spaces-only task is ignored) and clears the input. Clicking a task’s text toggles the class `done` on it. Each task has a button with the class `remove` that deletes it. `#remaining` always shows how many tasks are **not** done, as `N remaining`. It must keep working for tasks added later.'),
      expectedBehavior: 'Add, toggle and remove tasks with a live remaining count.',
      starterFiles: files('<input id="new" placeholder="New task">\n<button id="add">Add</button>\n<ul id="tasks"></ul>\n<p id="remaining">0 remaining</p>\n', '.done { text-decoration: line-through; }\n', ''), tabs: ['js'],
      hints: ['Keep the tasks in an array of objects and render the list from it.', 'A click on an item that did not exist when the page loaded needs a listener on its parent.', 'Delegation: one click listener on `#tasks`, using `event.target.closest(...)` to see what was clicked.'],
      checks: [
        web('Adding tasks', "const add = (t) => { h.type('#new', t); h.click('#add'); }; add('  Clean press  '); add('Oil lathe'); h.eq(h.$$('#tasks > li').map((l) => h.norm(l.firstElementChild ? l.querySelector('.text, span') ? l.querySelector('.text, span').textContent : l.textContent : l.textContent).replace(/\\s*(Remove|x|✕)\\s*$/i, '')).length, 2); h.assert(h.$$('#tasks > li')[0].textContent.includes('Clean press'), 'The task text is trimmed.'); h.eq(h.value('#new'), '', 'The input is cleared'); h.eq(h.text('#remaining'), '2 remaining');"),
        web('Empty tasks are ignored', "h.type('#new', '   '); h.click('#add'); h.eq(h.$$('#tasks > li').length, 0); h.type('#new', ''); h.click('#add'); h.eq(h.$$('#tasks > li').length, 0); h.eq(h.text('#remaining'), '0 remaining');", { visible: false }),
        web('Toggling done', "const add = (t) => { h.type('#new', t); h.click('#add'); }; add('One'); add('Two'); add('Three'); const row = (n) => h.$$('#tasks > li')[n]; const target = (n) => row(n).querySelector('.text') || row(n).querySelector('span') || row(n); target(1).click(); h.assert(row(1).classList.contains('done'), 'Clicking a task marks it done.'); h.eq(h.text('#remaining'), '2 remaining'); target(1).click(); h.assert(!row(1).classList.contains('done'), 'Clicking again undoes it.'); h.eq(h.text('#remaining'), '3 remaining');", { visible: false }),
        web('Removing tasks', "const add = (t) => { h.type('#new', t); h.click('#add'); }; add('One'); add('Two'); add('Three'); h.$$('#tasks > li')[0].querySelector('.remove').click(); h.eq(h.$$('#tasks > li').length, 2); h.assert(h.$('#tasks').textContent.includes('Two') && !h.$('#tasks').textContent.includes('One'), 'The right task is removed.'); h.eq(h.text('#remaining'), '2 remaining'); const first = h.$$('#tasks > li')[0]; (first.querySelector('.text') || first.querySelector('span') || first).click(); h.eq(h.text('#remaining'), '1 remaining'); h.$$('#tasks > li')[0].querySelector('.remove').click(); h.eq(h.text('#remaining'), '1 remaining', 'Removing a done task does not change the remaining count');", { visible: false }),
      ],
      xpReward: 90, coinReward: 14,
    }),
    wc({
      id: 'web-19-team-filter', objectiveId: 'js-obj-events-state', title: 'The Team Filter', mode: 'challenge', skillIds: ['js.dom'], concepts: ['addEventListener', 'state', 'event delegation', 'rendering'], difficulty: 3, context: 'sports',
      prompt: text('The results table has rows with a `data-team` attribute and filter buttons (class `filter`) whose `data-team` is a team name or `all`. Clicking a button shows only the rows of that team (`all` shows every row); the other rows are **hidden** (using the `hidden` attribute). The clicked button gets the class `active` and no other button has it. `#count` shows how many rows are visible as `N shown`. At the start, `all` is active and every row is shown.'),
      expectedBehavior: 'Filter buttons show only one team’s rows, mark the active button and show a count.',
      starterFiles: files('<div id="filters">\n  <button class="filter" data-team="all">All</button>\n  <button class="filter" data-team="Owls">Owls</button>\n  <button class="filter" data-team="Cats">Cats</button>\n</div>\n<table>\n  <tbody>\n    <tr data-team="Owls"><td>Owls 5</td></tr>\n    <tr data-team="Cats"><td>Cats 2</td></tr>\n    <tr data-team="Owls"><td>Owls 3</td></tr>\n    <tr data-team="Cats"><td>Cats 4</td></tr>\n    <tr data-team="Cats"><td>Cats 1</td></tr>\n  </tbody>\n</table>\n<p id="count"></p>\n', '.active { font-weight: bold; }\n', ''), tabs: ['js'],
      hints: ['The current filter is the state; the rows and the buttons are its picture.', 'Write one function that applies the current filter to everything.', 'Loop over the rows setting `hidden`, toggle `active` on the buttons, and update the count.'],
      checks: [
        web('The start', "h.eq(h.$$('tbody tr:not([hidden])').length, 5); h.eq(h.text('#count'), '5 shown'); h.assert(h.$('.filter[data-team=all]').classList.contains('active'), 'All starts active.');"),
        web('Filtering', "h.click('.filter[data-team=Owls]'); h.eq(h.$$('tbody tr:not([hidden])').map((r) => r.dataset.team), ['Owls', 'Owls']); h.eq(h.text('#count'), '2 shown'); h.eq(h.$$('.filter.active').length, 1); h.assert(h.$('.filter[data-team=Owls]').classList.contains('active')); h.click('.filter[data-team=Cats]'); h.eq(h.$$('tbody tr:not([hidden])').length, 3); h.eq(h.text('#count'), '3 shown'); h.eq(h.$$('.filter.active').length, 1);"),
        web('Back to all', "h.click('.filter[data-team=Cats]'); h.click('.filter[data-team=all]'); h.eq(h.$$('tbody tr:not([hidden])').length, 5); h.eq(h.text('#count'), '5 shown'); h.assert(h.$('.filter[data-team=all]').classList.contains('active') && !h.$('.filter[data-team=Cats]').classList.contains('active'));", { visible: false }),
        web('Rows are hidden, not deleted', "h.click('.filter[data-team=Owls]'); h.eq(h.$$('tbody tr').length, 5, 'The rows stay in the page; they are only hidden');", { visible: false }),
      ],
      xpReward: 85, coinReward: 13,
    }),
  ],
};
