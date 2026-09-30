import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

export const HTML = {
  machines: '<h2>Machines</h2>\n<ul id="machines"></ul>\n',
  board: '<h2>Machines that are down</h2>\n<p id="state"></p>\n<p id="total"></p>\n<ul id="board"></ul>\n',
  standings: '<p id="state"></p>\n<table>\n  <thead><tr><th>#</th><th>Team</th><th>Record</th></tr></thead>\n  <tbody id="table"></tbody>\n</table>\n',
  search: '<input id="q" placeholder="Search products">\n<button id="go">Search</button>\n<p id="state"></p>\n<div id="results"></div>\n',
  detail: '<button class="show" data-id="1">Machine 1</button>\n<button class="show" data-id="2">Machine 2</button>\n<button class="show" data-id="3">Machine 3</button>\n<button class="show" data-id="999">Machine 999</button>\n<p id="state"></p>\n<div id="detail"></div>\n',
  player: '<label>Player number <input id="num"></label>\n<button id="find">Find</button>\n<p id="state"></p>\n<div id="card"></div>\n',
};

/** Expected board for a dataset, computed from the API itself so it is right for the visible and the hidden data. */
const boardScript = `const all = h.api.get('/api/machines'); const down = all.filter((m) => m.status === 'down').sort((a, b) => b.downtime_hours - a.downtime_hours);
h.assert(down.length > 0, 'internal: the data must contain a machine that is down');
h.eq(h.text('#state'), 'Loading...', 'Show a loading message while the request is in flight');
await h.settle();
h.eq(h.text('#state'), '', 'The loading message goes away when the data arrives');
h.eq(h.$$('#board li').map((l) => h.norm(l.textContent)), down.map((m) => m.name + ': ' + m.downtime_hours + ' h'), 'The machines that are down, longest downtime first');
h.eq(h.text('#total'), down.length + ' down');`;

const standingsScript = `const all = h.api.get('/api/teams').sort((a, b) => b.wins - a.wins || a.losses - b.losses || (a.name < b.name ? -1 : 1));
h.eq(h.text('#state'), 'Loading standings...', 'Show a loading message while the request is in flight');
await h.settle();
h.eq(h.text('#state'), '');
h.eq(h.$$('#table tr').map((r) => [...r.children].map((c) => h.norm(c.textContent))), all.map((t, i) => [String(i + 1), t.name, t.wins + '-' + t.losses]), 'The standings: most wins first, then fewest losses, then name');`;

const searchScript = (q: string) => `const q = ${JSON.stringify(q)}; const term = q.trim();
const want = h.api.get('/api/products?q=' + encodeURIComponent(term) + '&limit=5'); const total = h.api.get('/api/products?q=' + encodeURIComponent(term)).length;
h.type('#q', q); h.click('#go');
h.eq(h.text('#state'), 'Searching...');
await h.settle();
h.eq(h.api.calls.length, 1, 'One request per search');
h.eq(h.api.calls[0].query.q, term, 'The search text reaches the server exactly (encode it in the URL)');
h.eq(h.text('#state'), total === 0 ? 'No products match "' + term + '"' : 'Showing ' + want.length + ' of ' + total + ' matches');
h.eq(h.$$('#results .card h3').map((n) => h.norm(n.textContent)), want.map((p) => p.name));
h.eq(h.$$('#results .card .price').map((n) => h.norm(n.textContent)), want.map((p) => '£' + p.price.toFixed(2)));`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-23-fetch', title: 'Talking to Servers: fetch and JSON', language: 'web', skillId: 'web.http',
    blurb: 'Request data from an API, show it, and handle waiting and failure honestly.', prerequisites: ['web-22-async'], xpReward: 80,
    reference: {
      title: 'HTTP, fetch and JSON',
      body: text(
        'HTTP is a request/response conversation. A request has a **method** (`GET` reads, `POST` creates, `PUT`/`PATCH` change, `DELETE` removes), a **URL** (with an optional query string like `?status=down&limit=5`), and sometimes headers and a body. A response has a **status code** (`200` OK, `201` created, `204` no content, `400` bad request, `401` not signed in, `404` not found, `429` slow down, `500`/`503` server trouble), headers, and usually a JSON body.',
        '`const response = await fetch(url)` gives a response; `response.ok` is true for 200–299; `await response.json()` reads the body; `response.status` is the code; `response.headers.get("X-Total-Count")` reads a header. **`fetch` only rejects when the network fails: a 404 or 500 is still a resolved response**, so always check `response.ok`. Build query strings with `encodeURIComponent(value)` so special characters survive. In this game the only server is the in-game API at `/api/...` (see the Field Manual).',
      ),
      example: 'async function loadMachines() {\n  const response = await fetch("/api/machines?status=down&limit=3");\n  if (!response.ok) throw new Error("HTTP " + response.status);\n  const machines = await response.json();\n  console.log(machines.length, response.headers.get("X-Total-Count"));\n}',
    },
    steps: [
      { kind: 'teach', title: 'Servers hold the data', body: text('Until now your data lived in the page. Most real apps ask a **server** for it, over HTTP, and get JSON back. Your page sends a request, waits, and then shows what came back: or shows that nothing did.', 'Every request has three outcomes you must design for: **waiting** (show that something is happening), **success** (show the data), and **failure** (say what went wrong, in words, and leave the page usable).') },
      webDemo({
        title: 'Your first request',
        body: text('Run it, then open the request log under the preview to see exactly what your page sent and what came back. Change the URL to `/api/machines/3` and to `/api/machines/999`.'),
        files: files(HTML.machines, '', 'async function load() {\n  const response = await fetch("/api/machines?limit=5");\n  const machines = await response.json();\n  for (const m of machines) {\n    const li = document.createElement("li");\n    li.textContent = m.name + ": " + m.status;\n    document.querySelector("#machines").append(li);\n  }\n}\nload();\n'),
        api: true,
        notice: 'The API is simulated inside the game: deterministic, private, no real network. `/api/machines/999` returns 404 with a JSON error body, but `fetch` still resolves; only `response.ok` tells you.',
      }),
      { kind: 'challenge', challengeId: 'web-23-load-machines' },
      { kind: 'challenge', challengeId: 'web-23-machine-board' },
      { kind: 'challenge', challengeId: 'web-23-machine-detail' },
    ],
  },
  objectives: [
    { id: 'web-obj-fetch-list', title: 'Load a list from an API and show it', summary: 'GET a collection (filters, sorting, limits, headers), render it, and show loading, empty and error states.' },
    { id: 'web-obj-fetch-one', title: 'Load one record and handle missing ones', summary: 'GET one item by id, validate what the user typed first, and treat 404 and other failures as normal outcomes.' },
  ],
  challenges: [
    wc({
      id: 'web-23-load-machines', title: 'The Machine List', mode: 'learning', skillIds: ['web.http'], concepts: ['fetch', 'async/await', 'json'], difficulty: 2, context: 'manufacturing', api: true,
      prompt: text('When the page loads, request `/api/machines` and add one `li` to `#machines` per machine, with the text `<name>: <status>` (for example `Press A1: running`).'),
      expectedBehavior: 'One list item per machine returned by the API.',
      guidedSteps: ['Write an `async` function and call it.', '`await fetch("/api/machines")`, then `await response.json()`.', 'Loop over the machines, creating an `li` with `textContent` for each.'],
      starterFiles: files(HTML.machines, '', ''), tabs: ['js'],
      hints: ['`fetch` returns a promise; so does `response.json()`.', 'The JSON is an array of objects with `name` and `status`.', '`for (const m of machines)` with `document.createElement("li")`.'],
      checks: [
        web('The list', "const all = h.api.get('/api/machines'); await h.settle(); h.eq(h.$$('#machines li').map((l) => h.norm(l.textContent)), all.map((m) => m.name + ': ' + m.status));"),
        web('Different data', "const all = h.api.get('/api/machines'); await h.settle(); h.eq(h.$$('#machines li').map((l) => h.norm(l.textContent)), all.map((m) => m.name + ': ' + m.status), 'Your page must show whatever the API returns');", { api: 'b', visible: false }),
      ],
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-23-machine-board', objectiveId: 'web-obj-fetch-list', title: 'The Downtime Board', mode: 'challenge', skillIds: ['web.http'], concepts: ['fetch', 'async/await', 'response.ok', 'json', 'loading states'], difficulty: 3, context: 'manufacturing', api: true,
      prompt: text(
        'When the page loads, show the machines that are **down** (their `status` is `down`), longest `downtime_hours` first, as `li` elements in `#board` with the text `<name>: <downtime_hours> h` (for example `Press A1: 36.3 h`). `#total` says `<n> down`.',
        'While waiting for the server `#state` says `Loading...`; when the data has arrived `#state` is empty. If the server answers with an error status, `#state` says `Could not load machines (status <code>)`, and the board and `#total` stay empty.',
      ),
      starterFiles: files(HTML.board, '', ''), tabs: ['js'],
      hints: ['Three states to show: waiting, loaded, failed. Set `#state` in each.', 'A response with an error status still arrives; what tells you it is an error?', 'The API can filter and sort for you (see the Field Manual), or you can do it in JavaScript.'],
      checks: [
        web('The board', boardScript),
        web('The hidden data set', boardScript, { api: 'b', visible: false }),
        web('When the server fails', "h.api.failNext(1, 503); await h.settle(); h.eq(h.text('#state'), 'Could not load machines (status 503)'); h.eq(h.$$('#board li').length, 0, 'No stale rows'); h.eq(h.text('#total'), '', 'No count when nothing loaded');", { visible: false }),
        web('Another error code', "h.api.failNext(1, 500); await h.settle(); h.eq(h.text('#state'), 'Could not load machines (status 500)');", { visible: false }),
      ],
      xpReward: 100, coinReward: 16,
    }),
    wc({
      id: 'web-23-team-standings', objectiveId: 'web-obj-fetch-list', title: 'The League Table', mode: 'challenge', skillIds: ['web.http'], concepts: ['fetch', 'async/await', 'response.ok', 'json', 'loading states'], difficulty: 3, context: 'sports', api: true,
      prompt: text(
        'When the page loads, fill `#table` (a `tbody`) with one row per team from `/api/teams`, best first: **most wins**, then **fewest losses**, then name A–Z. Each row has three cells: the rank (1, 2, 3, …), the team name, and the record as `<wins>-<losses>` (for example `15-16`).',
        '`#state` says `Loading standings...` while waiting and is empty afterwards. If the server answers with an error status, `#state` says `Standings unavailable (HTTP <code>)` and the table stays empty.',
      ),
      starterFiles: files(HTML.standings, '', ''), tabs: ['js'],
      hints: ['Decide the order with one comparison function that looks at wins, then losses, then name.', 'Ranks come from the position after sorting.', '`array.sort((a, b) => ...)`; each row is a `tr` with three `td` cells.'],
      checks: [
        web('The table', standingsScript),
        web('The hidden data set', standingsScript, { api: 'b', visible: false }),
        web('When the server fails', "h.api.failNext(1, 503); await h.settle(); h.eq(h.text('#state'), 'Standings unavailable (HTTP 503)'); h.eq(h.$$('#table tr').length, 0);", { visible: false }),
      ],
      xpReward: 100, coinReward: 16,
    }),
    wc({
      id: 'web-23-product-search', objectiveId: 'web-obj-fetch-list', title: 'The Parts Search', mode: 'challenge', skillIds: ['web.http'], concepts: ['fetch', 'async/await', 'response.ok', 'json', 'loading states'], difficulty: 3, context: 'retail', api: true,
      prompt: text(
        'Clicking `#go` searches the products API. The search text is `#q` trimmed; if it is empty, do not send anything: `#state` says `Type something to search` and the results are cleared. Otherwise send **one** request for at most **5** products matching the text (the API supports `q` and `limit`; special characters in the text must reach the server intact).',
        'While waiting `#state` says `Searching...`. Then show one `.card` per product in `#results`, each with an `h3` holding the name and a `p` with the class `price` holding the price as `£` plus two decimals (like `£12.50`). `#state` says `Showing <shown> of <total> matches` where `<total>` is the number of matches on the server (the API reports it in a response header). If nothing matches, `#state` says `No products match "<text>"`. If the server answers with an error status, `#state` says `Search failed (status <code>)`.',
      ),
      starterFiles: files(HTML.search, '', ''), tabs: ['js'],
      hints: ['Read the header that tells you how many matches exist in total.', 'The text can contain characters that have a meaning in URLs.', '`encodeURIComponent(text)`, `response.headers.get("X-Total-Count")`, `price.toFixed(2)`.'],
      checks: [
        web('A search with many matches', searchScript('1')),
        web('No matches', searchScript('zzz'), { visible: false }),
        web('Spaces around the text are ignored', searchScript('  10  '), { visible: false }),
        web('Special characters are encoded', searchScript('100&limit=1'), { visible: false }),
        web('Prices with a trailing zero', searchScript('Gauge'), { visible: false }),
        web('The hidden data set', searchScript('1'), { api: 'b', visible: false }),
        web('An empty search sends nothing', "h.type('#q', '   '); h.click('#go'); await h.settle(); h.eq(h.api.calls.length, 0, 'No request for an empty search'); h.eq(h.text('#state'), 'Type something to search'); h.eq(h.$$('#results .card').length, 0);", { visible: false }),
        web('Old results are replaced', "h.type('#q', '1'); h.click('#go'); await h.settle(); const first = h.$$('#results .card').length; h.assert(first > 0); h.type('#q', 'zzz'); h.click('#go'); await h.settle(); h.eq(h.$$('#results .card').length, 0, 'A new search clears the old cards'); h.type('#q', '1'); h.click('#go'); await h.settle(); h.eq(h.$$('#results .card').length, first, 'Results are replaced, not appended');", { visible: false }),
        web('When the server fails', "h.type('#q', '1'); h.click('#go'); h.api.failNext(1, 503); await h.settle(); h.eq(h.text('#state'), 'Search failed (status 503)'); h.eq(h.$$('#results .card').length, 0);", { visible: false }),
      ],
      xpReward: 105, coinReward: 16,
    }),
    wc({
      id: 'web-23-machine-detail', objectiveId: 'web-obj-fetch-one', title: 'The Machine Details Panel', mode: 'challenge', skillIds: ['web.http'], concepts: ['fetch', 'async/await', 'response.ok', 'json', '404'], difficulty: 3, context: 'manufacturing', api: true,
      prompt: text(
        'Each `.show` button has a `data-id`. Clicking one loads that machine from `/api/machines/<id>` and shows it in `#detail`: an `h3` with the name, a `p.status` saying `Status: <status>` and a `p.downtime` saying `Downtime: <downtime_hours> h`. Loading a machine **replaces** whatever was shown before.',
        '`#state` says `Loading...` while waiting and is empty after a success. If the machine does not exist (404), `#state` says `Machine not found` and `#detail` is emptied. For any other error status it says `Could not load machine (status <code>)` and `#detail` is emptied.',
      ),
      starterFiles: files(HTML.detail, '', ''), tabs: ['js'],
      hints: ['The id lives in a data attribute on the button.', 'A missing record is not an exception: what does the response say?', '`button.dataset.id`, `response.status === 404`, `replaceChildren()`.'],
      checks: [
        web('Showing a machine', "const m = h.api.get('/api/machines/2'); h.click('.show[data-id=\"2\"]'); h.eq(h.text('#state'), 'Loading...'); await h.settle(); h.eq(h.text('#state'), ''); h.eq(h.text('#detail h3'), m.name); h.eq(h.text('#detail p.status'), 'Status: ' + m.status); h.eq(h.text('#detail p.downtime'), 'Downtime: ' + m.downtime_hours + ' h');"),
        web('Replacing what was shown', "const a = h.api.get('/api/machines/1'); const b = h.api.get('/api/machines/3'); h.click('.show[data-id=\"1\"]'); await h.settle(); h.click('.show[data-id=\"3\"]'); await h.settle(); h.eq(h.$$('#detail h3').length, 1, 'One machine at a time'); h.eq(h.text('#detail h3'), b.name); h.assert(!h.$('#detail').textContent.includes(a.name), 'The old machine is gone');", { visible: false }),
        web('A machine that does not exist', "h.click('.show[data-id=\"1\"]'); await h.settle(); h.click('.show[data-id=\"999\"]'); h.eq(h.text('#state'), 'Loading...'); await h.settle(); h.eq(h.text('#state'), 'Machine not found'); h.eq(h.$('#detail').children.length, 0, 'The previous machine is removed'); h.click('.show[data-id=\"2\"]'); await h.settle(); h.eq(h.text('#state'), '', 'A later success clears the message');", { visible: false }),
        web('Other errors', "h.click('.show[data-id=\"2\"]'); h.api.failNext(1, 500); await h.settle(); h.eq(h.text('#state'), 'Could not load machine (status 500)'); h.eq(h.$('#detail').children.length, 0);", { visible: false }),
        web('The hidden data set', "const m = h.api.get('/api/machines/3'); h.click('.show[data-id=\"3\"]'); await h.settle(); h.eq(h.text('#detail h3'), m.name); h.eq(h.text('#detail p.downtime'), 'Downtime: ' + m.downtime_hours + ' h');", { api: 'b', visible: false }),
      ],
      xpReward: 100, coinReward: 16,
    }),
    wc({
      id: 'web-23-player-card', objectiveId: 'web-obj-fetch-one', title: 'The Player Lookup', mode: 'challenge', skillIds: ['web.http'], concepts: ['fetch', 'async/await', 'response.ok', 'json', '404'], difficulty: 3, context: 'sports', api: true,
      prompt: text(
        'The person types a player number in `#num` and clicks `#find`. The number (spaces around it ignored) must be a whole number of 1 or more; otherwise `#state` says `Enter a player number` and **no request is sent**. A valid number loads `/api/players/<number>` and shows in `#card`: an `h3` with the name, a `p.team` with the team name, and a `p.avg` saying `Batting: <average>` where the average is written with three decimals and no leading zero (`0.279` shows as `.279`).',
        '`#state` says `Loading...` while waiting and is empty after a success. A player that does not exist (404) gives `No player with that number`; any other error status gives `Lookup failed (status <code>)`. In both cases `#card` is emptied.',
      ),
      starterFiles: files(HTML.player, '', ''), tabs: ['js'],
      hints: ['Check the input first; only valid numbers deserve a request.', 'What kinds of text look like numbers but are not whole numbers of 1 or more?', '`Number.isInteger`, `toFixed(3)`, and a string method to drop a leading zero.'],
      checks: [
        web('Looking up a player', "const p = h.api.get('/api/players/4'); h.type('#num', ' 4 '); h.click('#find'); h.eq(h.text('#state'), 'Loading...'); await h.settle(); h.eq(h.text('#state'), ''); h.eq(h.text('#card h3'), p.name); h.eq(h.text('#card p.team'), p.team); h.eq(h.text('#card p.avg'), 'Batting: ' + p.batting_avg.toFixed(3).replace(/^0/, ''));"),
        web('Bad numbers send nothing', "for (const bad of ['', '0', '-3', '2.5', 'abc', '1e2x']) { h.type('#num', bad); h.click('#find'); await h.settle(); h.eq(h.text('#state'), 'Enter a player number', 'For \"' + bad + '\"'); } h.eq(h.api.calls.length, 0, 'No request may be sent for an invalid number');", { visible: false }),
        web('A player that does not exist', "h.type('#num', '2'); h.click('#find'); await h.settle(); h.type('#num', '999'); h.click('#find'); await h.settle(); h.eq(h.text('#state'), 'No player with that number'); h.eq(h.$('#card').children.length, 0);", { visible: false }),
        web('Other errors', "h.type('#num', '2'); h.click('#find'); h.api.failNext(1, 503); await h.settle(); h.eq(h.text('#state'), 'Lookup failed (status 503)'); h.eq(h.$('#card').children.length, 0);", { visible: false }),
        web('The hidden data set', "const p = h.api.get('/api/players/7'); h.type('#num', '7'); h.click('#find'); await h.settle(); h.eq(h.text('#card h3'), p.name); h.eq(h.text('#card p.avg'), 'Batting: ' + p.batting_avg.toFixed(3).replace(/^0/, ''));", { api: 'b', visible: false }),
        web('A second lookup replaces the first', "h.type('#num', '1'); h.click('#find'); await h.settle(); h.type('#num', '2'); h.click('#find'); await h.settle(); h.eq(h.$$('#card h3').length, 1);", { visible: false }),
      ],
      xpReward: 100, coinReward: 16,
    }),
  ],
};
