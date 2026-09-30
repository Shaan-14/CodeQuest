import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, wc, web, webDemo } from './helpers';

export const HTML = {
  add: '<form id="add-form">\n  <label>Name <input id="name"></label>\n  <label>Type\n    <select id="type">\n      <option>press</option>\n      <option>cutter</option>\n      <option>welder</option>\n      <option>packer</option>\n    </select>\n  </label>\n  <button type="submit" id="add">Add machine</button>\n</form>\n<p id="msg"></p>\n<ul id="list"></ul>\n',
  restock: '<table>\n  <thead><tr><th>Product</th><th>In stock</th><th></th></tr></thead>\n  <tbody id="rows"></tbody>\n</table>\n<p id="msg"></p>\n',
  teams: '<h2>Teams</h2>\n<ul id="teams"></ul>\n<p id="msg"></p>\n',
  payroll: '<label>API key <input id="key"></label>\n<button id="load">Load payroll</button>\n<p id="state"></p>\n<table>\n  <tbody id="rows"></tbody>\n</table>\n<p id="total"></p>\n',
  flaky: '<button id="fetch">Fetch nightly report</button>\n<p id="state"></p>\n<pre id="out"></pre>\n',
  rate: '<button id="run">Send 5 requests</button>\n<p id="state"></p>\n<ol id="log"></ol>\n',
};

const CT = "(c) => (c.headers['content-type'] || '').includes('application/json')";

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-24-fetch-write', title: 'Changing Data and Surviving Failure', language: 'web', skillId: 'web.http',
    blurb: 'POST, PATCH and DELETE; API keys; retrying flaky servers; rate limits.', prerequisites: ['web-23-fetch'], xpReward: 85,
    reference: {
      title: 'Writing to an API and handling failure',
      body: text(
        'To send data, give `fetch` an options object: `fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })`. `POST` creates (answer `201` with the new record), `PATCH` changes some fields, `PUT` replaces, `DELETE` removes (answer `204` with **no body**, so never call `response.json()` on it). Send only what the endpoint needs. If the `Content-Type` header is missing the server answers `415`.',
        'Headers carry credentials: `headers: { Authorization: "Bearer <key>" }`. `401` means "who are you?", `403` "not allowed", `404` "no such thing", `429` "too many requests" (the `Retry-After` header says how many seconds to wait), `5xx` "the server has a problem". **Retry only what can succeed later** (5xx, network failures), with a delay and a limit; never retry a `4xx`. Disable a button while its request is in flight so a double click cannot send twice.',
      ),
      example: 'const response = await fetch("/api/machines", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ name: "Saw 9", type: "cutter" }),\n});\nconst data = await response.json();\nif (response.status === 201) console.log("created", data.id);\nelse console.log("rejected:", data.error);',
    },
    steps: [
      { kind: 'teach', title: 'Reading is easy; writing has consequences', body: text('A `GET` changes nothing, so trying it twice is harmless. A `POST` creates something each time, so a double click can create two. Writing code that changes data means thinking about **what if it fails**, **what if it is sent twice**, and **what the user sees in between**.', 'The server is the source of truth: after a write, show what the **server** answered (its id, its stored values), not what you hoped it would store.') },
      webDemo({
        title: 'Sending data',
        body: text('Run it and press the button. Open the network log under the preview: look at the method, the address and the status that came back. Change the type to something else.'),
        files: files('<button id="send">Add a machine</button>\n<p id="result"></p>\n', '', 'document.querySelector("#send").addEventListener("click", async () => {\n  const response = await fetch("/api/machines", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({ name: "Saw 9", type: "cutter" }),\n  });\n  const data = await response.json();\n  document.querySelector("#result").textContent = response.status + " " + JSON.stringify(data);\n});\n'),
        api: true,
        notice: 'Status 201 means created, and the body is the stored record with its new `id`. Remove the Content-Type header and run it again to see a 415.',
      }),
      { kind: 'challenge', challengeId: 'web-24-add-machine' },
      { kind: 'teach', title: 'When the server says no (or nothing)', body: text('Real services ask for keys, fail temporarily and limit how fast you may call them. A good page treats each of those as a normal outcome with its own message and its own behaviour.') },
      { kind: 'challenge', challengeId: 'web-24-payroll-report' },
    ],
  },
  objectives: [
    { id: 'web-obj-fetch-write', title: 'Create, update and delete records through an API', summary: 'Send JSON with the right method and headers, use the server’s answer, and handle rejection.' },
    { id: 'web-obj-http-resilience', title: 'Handle keys, transient failures and rate limits', summary: 'Send credentials, retry only what can succeed later (with a limit and a delay), and read Retry-After.' },
  ],
  challenges: [
    wc({
      id: 'web-24-add-machine', objectiveId: 'web-obj-fetch-write', title: 'The Add-a-Machine Form', mode: 'challenge', skillIds: ['web.http'], concepts: ['fetch', 'async/await', 'http methods', 'status codes'], difficulty: 3, context: 'manufacturing', api: true,
      prompt: text(
        'When the page loads, list the first **3** machines of `/api/machines` as `li` elements in `#list` with the text `<name> (<type>)`.',
        'Submitting `#add-form` sends the trimmed name and the chosen type to the server as a **new machine** (JSON body with just `name` and `type`). Let the **server** decide what is valid. While the request is in flight the button `#add` is disabled. If the server creates it, `#msg` says `Added <name> (id <id>)` (using what the server returned), a new `li` is added to the list, and the name box is cleared. Otherwise `#msg` says `Could not add: <the error text the server sent>` and nothing else changes. The button is enabled again in every case.',
      ),
      starterFiles: files(HTML.add, '', ''), tabs: ['js'],
      hints: ['Stop the browser from sending the form itself; then send your own request.', 'Creating uses a different method and needs a header that says the body is JSON.', '`method: "POST"`, `headers: { "Content-Type": "application/json" }`, `body: JSON.stringify(...)`, and check `response.status`.'],
      checks: [
        web('The starting list', "const first = h.api.get('/api/machines?limit=3'); await h.settle(); h.eq(h.$$('#list li').map((l) => h.norm(l.textContent)), first.map((m) => m.name + ' (' + m.type + ')'));"),
        web('Adding a machine', `let prevented = null; document.addEventListener('submit', (e) => { prevented = e.defaultPrevented; }); const all = h.api.get('/api/machines'); const id = Math.max(...all.map((m) => m.id)) + 1; await h.settle(); h.type('#name', '  Drill X '); h.select('#type', 'welder'); h.click('#add'); h.assert(prevented === true, 'Stop the browser from sending the form itself.'); h.assert(h.$('#add').disabled, 'The button is disabled while the request is in flight.'); await h.settle(); h.eq(h.text('#msg'), 'Added Drill X (id ' + id + ')'); h.eq(h.$$('#list li').map((l) => h.norm(l.textContent)).pop(), 'Drill X (welder)'); h.eq(h.value('#name'), '', 'The name box is cleared'); h.assert(!h.$('#add').disabled, 'The button is enabled again.'); const posts = h.api.calls.filter((c) => c.method === 'POST'); h.eq(posts.length, 1, 'One POST'); h.assert((${CT})(posts[0]), 'Send the header Content-Type: application/json'); h.eq(JSON.parse(posts[0].body), { name: 'Drill X', type: 'welder' }, 'The body has only the name and the type');`),
        web('The server says no', "await h.settle(); const before = h.$$('#list li').length; h.type('#name', ''); h.click('#add'); await h.settle(); h.eq(h.text('#msg'), 'Could not add: Missing required fields'); h.eq(h.$$('#list li').length, before, 'Nothing is added'); h.assert(!h.$('#add').disabled, 'The button is enabled again after an error.');", { visible: false }),
        web('Another failure', "await h.settle(); const before = h.$$('#list li').length; h.type('#name', 'Saw 3'); h.api.failNext(1, 500); h.click('#add'); await h.settle(); h.eq(h.text('#msg'), 'Could not add: Simulated server error'); h.eq(h.$$('#list li').length, before); h.eq(h.value('#name'), 'Saw 3', 'The typed name is kept so the user can retry'); h.assert(!h.$('#add').disabled);", { visible: false }),
        web('A double click sends once', "await h.settle(); h.type('#name', 'Saw 4'); h.click('#add'); h.click('#add'); await h.settle(); h.eq(h.api.calls.filter((c) => c.method === 'POST').length, 1, 'A second click while waiting must not send a second request');", { visible: false }),
      ],
      xpReward: 105, coinReward: 16,
    }),
    wc({
      id: 'web-24-restock-products', objectiveId: 'web-obj-fetch-write', title: 'The Restock Buttons', mode: 'challenge', skillIds: ['web.http'], concepts: ['fetch', 'async/await', 'http methods', 'status codes'], difficulty: 3, context: 'retail', api: true,
      prompt: text(
        'When the page loads, show the first **4** products of `/api/products` as rows of `#rows`. Each `tr` has the attribute `data-id` (the product id), a `td.name`, a `td.stock` with the stock number, and a button with the class `restock` labelled `+10`.',
        'Clicking `+10` asks the server to change that product’s stock to **10 more than the number shown**, sending **only the stock field** (JSON body). The button is disabled while waiting. When the server accepts, the `td.stock` shows the stock **the server returned** and `#msg` is emptied. If it does not, `td.stock` is unchanged and `#msg` says `Update failed (status <code>)`. The button is enabled again in every case.',
      ),
      starterFiles: files(HTML.restock, '', ''), tabs: ['js'],
      hints: ['Changing part of a record has its own method; it is not the one that creates.', 'Where should the new number on screen come from after success?', '`method: "PATCH"`, `JSON.stringify({ stock: ... })`, and `await response.json()` for the updated record.'],
      checks: [
        web('The rows', "const first = h.api.get('/api/products?limit=4'); await h.settle(); h.eq(h.$$('#rows tr').map((r) => [r.dataset.id, h.norm(r.querySelector('td.name').textContent), h.norm(r.querySelector('td.stock').textContent)]), first.map((p) => [String(p.id), p.name, String(p.stock)]));"),
        web('Restocking', "await h.settle(); const row = () => h.$$('#rows tr')[1]; const before = h.api.get('/api/products/' + row().dataset.id).stock; h.click('#rows tr:nth-child(2) .restock'); h.assert(row().querySelector('.restock').disabled, 'Disabled while waiting.'); await h.settle(); h.eq(h.norm(row().querySelector('td.stock').textContent), String(before + 10)); h.eq(h.api.get('/api/products/' + row().dataset.id).stock, before + 10, 'The server has the new stock'); h.click('#rows tr:nth-child(2) .restock'); await h.settle(); h.eq(h.norm(row().querySelector('td.stock').textContent), String(before + 20)); const patches = h.api.calls.filter((c) => c.method === 'PATCH'); h.eq(patches.length, 2); h.assert((" + CT + ")(patches[0]), 'Send Content-Type: application/json'); h.eq(JSON.parse(patches[0].body), { stock: before + 10 }, 'Send only the changed field'); h.assert(!row().querySelector('.restock').disabled);"),
        web('A failed update', "await h.settle(); const cell = () => h.$$('#rows tr')[0].querySelector('td.stock'); const before = h.norm(cell().textContent); h.api.failNext(1, 500); h.click('#rows tr:nth-child(1) .restock'); await h.settle(); h.eq(h.norm(cell().textContent), before, 'The number on screen must not change when the server refused'); h.eq(h.text('#msg'), 'Update failed (status 500)'); h.assert(!h.$('#rows tr:nth-child(1) .restock').disabled); h.click('#rows tr:nth-child(1) .restock'); await h.settle(); h.eq(h.text('#msg'), '', 'A success clears the message'); h.eq(h.norm(cell().textContent), String(Number(before) + 10));", { visible: false }),
        web('Not found', "await h.settle(); h.api.failNext(1, 404); h.click('#rows tr:nth-child(3) .restock'); await h.settle(); h.eq(h.text('#msg'), 'Update failed (status 404)');", { visible: false }),
        web('The hidden data set', "const first = h.api.get('/api/products?limit=4'); await h.settle(); h.click('#rows tr:nth-child(4) .restock'); await h.settle(); h.eq(h.norm(h.$$('#rows tr')[3].querySelector('td.stock').textContent), String(first[3].stock + 10));", { api: 'b', visible: false }),
      ],
      xpReward: 105, coinReward: 16,
    }),
    wc({
      id: 'web-24-remove-teams', objectiveId: 'web-obj-fetch-write', title: 'The Roster Cleaner', mode: 'challenge', skillIds: ['web.http'], concepts: ['fetch', 'async/await', 'http methods', 'status codes'], difficulty: 3, context: 'sports', api: true,
      prompt: text(
        'When the page loads, list every team of `/api/teams` as an `li` in `#teams` with the attribute `data-id`, a `span.name` with the team name and a button with the class `delete` labelled `Remove`.',
        'Clicking `Remove` deletes that team **on the server**. If the server confirms (it answers with no content), the `li` disappears and `#msg` says `Removed <name>`. If the server says the team no longer exists (404), the `li` disappears too and `#msg` says `<name> was already gone`. For any other error status the `li` stays and `#msg` says `Could not remove <name> (status <code>)`.',
      ),
      starterFiles: files(HTML.teams, '', ''), tabs: ['js'],
      hints: ['Removing has its own method, and the id goes in the address.', 'A successful removal has an empty body. What happens if you ask for JSON from nothing?', '`method: "DELETE"`, compare `response.status`, and `li.remove()`.'],
      checks: [
        web('The list', "const all = h.api.get('/api/teams'); await h.settle(); h.eq(h.$$('#teams li').map((l) => [l.dataset.id, h.norm(l.querySelector('.name').textContent)]), all.map((t) => [String(t.id), t.name]));"),
        web('Removing a team', "await h.settle(); const li = h.$$('#teams li')[1]; const id = li.dataset.id; const name = h.norm(li.querySelector('.name').textContent); const n = h.$$('#teams li').length; li.querySelector('.delete').click(); await h.settle(); h.eq(h.$$('#teams li').length, n - 1); h.eq(h.text('#msg'), 'Removed ' + name); h.assert(!h.$$('#teams li').some((x) => x.dataset.id === id), 'The right team is removed'); const d = h.api.calls.filter((c) => c.method === 'DELETE'); h.eq(d.length, 1); h.eq(d[0].path, '/api/teams/' + id); h.eq(h.api.get('/api/teams').length, n - 1, 'The server no longer has it');"),
        web('The server refuses', "await h.settle(); const n = h.$$('#teams li').length; const name = h.norm(h.$$('#teams li')[0].querySelector('.name').textContent); h.api.failNext(1, 500); h.$$('#teams li')[0].querySelector('.delete').click(); await h.settle(); h.eq(h.$$('#teams li').length, n, 'The team stays when the server failed'); h.eq(h.text('#msg'), 'Could not remove ' + name + ' (status 500)');", { visible: false }),
        web('Already gone', "await h.settle(); const n = h.$$('#teams li').length; const name = h.norm(h.$$('#teams li')[2].querySelector('.name').textContent); h.api.failNext(1, 404); h.$$('#teams li')[2].querySelector('.delete').click(); await h.settle(); h.eq(h.$$('#teams li').length, n - 1); h.eq(h.text('#msg'), name + ' was already gone');", { visible: false }),
        web('Removing several', "await h.settle(); const n = h.$$('#teams li').length; h.$$('#teams li')[0].querySelector('.delete').click(); await h.settle(); h.$$('#teams li')[0].querySelector('.delete').click(); await h.settle(); h.eq(h.$$('#teams li').length, n - 2); h.eq(h.api.get('/api/teams').length, n - 2);", { visible: false }),
      ],
      xpReward: 105, coinReward: 16,
    }),
    wc({
      id: 'web-24-payroll-report', objectiveId: 'web-obj-http-resilience', title: 'The Payroll Report', mode: 'challenge', skillIds: ['web.http'], concepts: ['fetch', 'headers', 'status codes', 'error handling'], difficulty: 3, context: 'business', api: true,
      prompt: text(
        'The payroll data is private: `GET /api/private/employees` only answers when the request carries an `Authorization` header of the form `Bearer <key>`. Clicking `#load` uses the text in `#key` (spaces around it ignored) as the key. If the box is empty, send nothing and set `#state` to `Enter your API key`.',
        'While waiting `#state` says `Loading...`. On success `#state` is empty, `#rows` gets one `tr` per employee with three cells (name, role, and the rate written as `£<rate to 2 decimals>/h`), and `#total` says `Average rate: £<mean rate, 2 decimals>`. If the server answers 401, `#state` says `Access denied: check your API key`. For any other error status it says `Could not load payroll (status <code>)`. Before each load the old rows and total are cleared, whatever the outcome.',
      ),
      starterFiles: files(HTML.payroll, '', ''), tabs: ['js'],
      hints: ['Credentials travel in a request header, not in the URL.', 'Clear the old results first so a failed load never leaves stale rows.', '`fetch(url, { headers: { Authorization: "Bearer " + key } })`; `toFixed(2)`.'],
      checks: [
        web('A valid key', "const emp = h.api.get('/api/employees'); h.type('#key', '  codequest-key '); h.click('#load'); h.eq(h.text('#state'), 'Loading...'); await h.settle(); h.eq(h.text('#state'), ''); h.eq(h.$$('#rows tr').map((r) => [...r.children].map((c) => h.norm(c.textContent))), emp.map((e) => [e.name, e.role, '£' + e.rate.toFixed(2) + '/h'])); h.eq(h.text('#total'), 'Average rate: £' + (emp.reduce((s, e) => s + e.rate, 0) / emp.length).toFixed(2)); h.eq(h.api.calls[0].headers.authorization, 'Bearer codequest-key', 'The header carries the trimmed key');"),
        web('A wrong key', "h.type('#key', 'letmein'); h.click('#load'); await h.settle(); h.eq(h.text('#state'), 'Access denied: check your API key'); h.eq(h.$$('#rows tr').length, 0); h.eq(h.text('#total'), '');", { visible: false }),
        web('An empty key sends nothing', "h.type('#key', '   '); h.click('#load'); await h.settle(); h.eq(h.api.calls.length, 0, 'No request without a key'); h.eq(h.text('#state'), 'Enter your API key');", { visible: false }),
        web('Stale rows are cleared', "h.type('#key', 'codequest-key'); h.click('#load'); await h.settle(); h.assert(h.$$('#rows tr').length > 0); h.type('#key', 'bad'); h.click('#load'); await h.settle(); h.eq(h.$$('#rows tr').length, 0, 'Rows from the earlier load are gone'); h.eq(h.text('#total'), ''); h.type('#key', 'codequest-key'); h.click('#load'); h.api.failNext(1, 503); await h.settle(); h.eq(h.text('#state'), 'Could not load payroll (status 503)'); h.eq(h.$$('#rows tr').length, 0);", { visible: false }),
        web('The hidden data set', "const emp = h.api.get('/api/employees'); h.type('#key', 'codequest-key'); h.click('#load'); await h.settle(); h.eq(h.text('#total'), 'Average rate: £' + (emp.reduce((s, e) => s + e.rate, 0) / emp.length).toFixed(2)); h.eq(h.$$('#rows tr').length, emp.length);", { api: 'b', visible: false }),
      ],
      xpReward: 105, coinReward: 16,
    }),
    wc({
      id: 'web-24-flaky-retry', objectiveId: 'web-obj-http-resilience', title: 'The Nightly Report Fetcher', mode: 'challenge', skillIds: ['web.http'], concepts: ['fetch', 'headers', 'status codes', 'error handling'], difficulty: 3, context: 'automation', api: true,
      prompt: text(
        'The report service `/api/flaky` is unreliable. Clicking `#fetch` disables the button and tries up to **3** times. Before each try `#state` says `Attempt <n> of 3...`. If a try succeeds, `#out` shows the response body as JSON text (as `JSON.stringify` writes it), `#state` says `Loaded after <n> attempt(s)` (`attempt` for 1, `attempts` otherwise) and the button is enabled.',
        'If a try fails with a **server** error (status 500 or above), `#state` says `Attempt <n> failed, retrying...` and the next try starts **1 second** later. After the 3rd failure `#state` says `Gave up after 3 attempts`. A failure that is the request’s own fault (status below 500) is never retried: `#state` says `Request rejected (status <code>)` at once. The button is enabled again in every ending, and `#out` is cleared at the start of each click.',
      ),
      starterFiles: files(HTML.flaky, '', ''), tabs: ['js'],
      hints: ['A loop that counts attempts, with a decision after each response.', 'Waiting between tries needs a promise around a timer.', '`await new Promise((r) => setTimeout(r, 1000))`; check `response.ok` and `response.status`.'],
      checks: [
        web('Two failures then success', "h.click('#fetch'); h.assert(h.$('#fetch').disabled, 'Disabled while trying.'); h.eq(h.text('#state'), 'Attempt 1 of 3...'); await h.settle(); h.eq(h.text('#state'), 'Attempt 1 failed, retrying...'); await h.tick(999); h.eq(h.text('#state'), 'Attempt 1 failed, retrying...', 'Wait a full second before retrying'); await h.tick(1); h.eq(h.text('#state'), 'Attempt 2 of 3...'); await h.settle(); h.eq(h.text('#state'), 'Attempt 2 failed, retrying...'); await h.tick(1000); h.eq(h.text('#state'), 'Attempt 3 of 3...'); await h.settle(); h.eq(h.text('#state'), 'Loaded after 3 attempts'); h.assert(h.text('#out').includes('\"attempts\":3'), 'The body is shown as JSON text'); h.assert(!h.$('#fetch').disabled);"),
        web('Success on the first try', "h.click('#fetch'); await h.settle(); await h.tick(1000); await h.settle(); await h.tick(1000); await h.settle(); h.eq(h.text('#state'), 'Loaded after 3 attempts'); h.click('#fetch'); await h.settle(); h.eq(h.text('#state'), 'Loaded after 1 attempt', 'Singular for one attempt'); h.assert(h.text('#out').includes('ok'));", { visible: false }),
        web('Giving up', "h.api.failNext(3, 503); h.click('#fetch'); await h.settle(); await h.tick(1000); await h.settle(); await h.tick(1000); await h.settle(); h.eq(h.text('#state'), 'Gave up after 3 attempts'); h.eq(h.api.calls.length, 3, 'Exactly three tries'); h.assert(!h.$('#fetch').disabled); h.eq(h.text('#out'), '');", { visible: false }),
        web('Each click starts clean', "h.click('#fetch'); await h.settle(); await h.tick(1000); await h.settle(); await h.tick(1000); await h.settle(); h.assert(h.text('#out').length > 0); h.api.failNext(1, 500); h.click('#fetch'); h.eq(h.text('#out'), '', 'The old report is cleared as soon as a new attempt starts'); await h.settle();", { visible: false }),
        web('A request error is not retried', "h.api.failNext(1, 404); h.click('#fetch'); await h.settle(); await h.tick(5000); await h.settle(); h.eq(h.text('#state'), 'Request rejected (status 404)'); h.eq(h.api.calls.length, 1, 'A 4xx must not be retried'); h.assert(!h.$('#fetch').disabled);", { visible: false }),
      ],
      xpReward: 105, coinReward: 16,
    }),
    wc({
      id: 'web-24-rate-limit', objectiveId: 'web-obj-http-resilience', title: 'The Polite Client', mode: 'challenge', skillIds: ['web.http'], concepts: ['fetch', 'headers', 'status codes', 'error handling'], difficulty: 3, context: 'software', api: true,
      prompt: text(
        'The service `/api/rate-limited` only allows a few calls. Clicking `#run` clears `#log`, then sends up to **5** requests to it, one after the other. Each successful request adds an `li` to `#log` saying `Request <n>: ok`.',
        'If the server answers **429** (too many requests) the client stops sending: it adds `Request <n>: rate limited` and `#state` says `Rate limited. Try again in <s> seconds`, where `<s>` is the number of seconds the server asks for in its `Retry-After` header. If any other error status arrives it adds `Request <n>: failed (status <code>)`, stops, and `#state` says `Stopped after an error`. If all 5 succeed `#state` says `All done`.',
      ),
      starterFiles: files(HTML.rate, '', ''), tabs: ['js'],
      hints: ['One request at a time: each needs the previous answer.', 'The wait time is in a response header, not in the body.', '`response.headers.get("Retry-After")`; a loop with `await` inside it.'],
      checks: [
        web('Hitting the limit', "h.click('#run'); await h.settle(); h.eq(h.$$('#log li').map((l) => h.norm(l.textContent)), ['Request 1: ok', 'Request 2: ok', 'Request 3: ok', 'Request 4: rate limited']); h.eq(h.text('#state'), 'Rate limited. Try again in 2 seconds'); h.eq(h.api.calls.length, 4, 'Stop sending after the 429');"),
        web('The hidden data set (another wait time)', "h.click('#run'); await h.settle(); h.eq(h.text('#state'), 'Rate limited. Try again in 7 seconds', 'Use the number the server sent');", { api: 'b', visible: false }),
        web('Running again', "h.click('#run'); await h.settle(); h.click('#run'); await h.settle(); h.eq(h.$$('#log li').map((l) => h.norm(l.textContent)), ['Request 1: rate limited'], 'The log is cleared at the start of each run');", { visible: false }),
        web('Another error', "h.api.failNext(1, 500); h.click('#run'); await h.settle(); h.eq(h.$$('#log li').map((l) => h.norm(l.textContent)), ['Request 1: failed (status 500)']); h.eq(h.text('#state'), 'Stopped after an error'); h.eq(h.api.calls.length, 1);", { visible: false }),
      ],
      xpReward: 105, coinReward: 16,
    }),
  ],
};
