import { text } from '../helpers';
import type { LessonBundle, WebCheck } from '../schema';
import { files, jsCalls, wc, web } from './helpers';

/**
 * INDEPENDENT MODE (JavaScript, web apps). Each brief describes what the finished page or function must do, and
 * nothing about how: no language constructs, functions or steps are named. The page skeleton (ids the checks use)
 * is provided; hidden checks probe boundaries, hostile data, timing and a hidden API data set.
 */
export const HTML = {
  convert: '<label>Value <input id="value"></label>\n<label>From\n  <select id="from"><option value="C">Celsius</option><option value="F">Fahrenheit</option><option value="K">Kelvin</option></select>\n</label>\n<label>To\n  <select id="to"><option value="C">Celsius</option><option value="F" selected>Fahrenheit</option><option value="K">Kelvin</option></select>\n</label>\n<p id="result"></p>\n',
  weather: '<h1>Weather summary</h1>\n<p id="state"></p>\n<ul id="cities"></ul>\n',
  enrol: '<form id="enrol">\n  <label>Student <input id="student"></label>\n  <label>Course <select id="course"></select></label>\n  <button type="submit">Enrol</button>\n</form>\n<p id="state"></p>\n',
  cities: '<label>Filter <input id="q"></label>\n<p id="count"></p>\n<ul id="cities">\n  <li>Bath</li>\n  <li>Leeds</li>\n  <li>Lewes</li>\n  <li>York</li>\n  <li>Derby</li>\n  <li>Ely</li>\n  <li>Hull</li>\n  <li>Truro</li>\n</ul>\n',
};

const convCheck = (name: string, cases: [string, string, string, number | string][], opts: Partial<Omit<WebCheck, 'kind' | 'name' | 'script'>> = {}) =>
  web(name, `const toC = (v, u) => u === 'C' ? v : u === 'F' ? (v - 32) * 5 / 9 : v - 273.15; const fromC = (c, u) => u === 'C' ? c : u === 'F' ? c * 9 / 5 + 32 : c + 273.15; const sym = { C: '°C', F: '°F', K: 'K' };
for (const [v, from, to, want] of ${JSON.stringify(cases)}) { h.type('#value', v); h.select('#from', from); h.select('#to', to); const t = h.text('#result'); const label = '"' + v + '" ' + from + ' to ' + to;
  if (typeof want === 'string') { h.eq(t, want, 'For ' + label); continue; }
  const m = /^(-?\\d+\\.\\d) (°C|°F|K)$/.exec(t); h.assert(m, 'For ' + label + ' the result must look like 12.3 °F (one decimal, then the unit); got "' + t + '"'); h.assert(Math.abs(Number(m[1]) - want) <= 0.06, 'For ' + label + ' expected about ' + want.toFixed(2) + ', got ' + m[1]); h.eq(m[2], sym[to], 'The unit for ' + label); h.assert(!/^-0\\.0$/.test(m[1]), 'Never show negative zero'); }`, { visible: false, ...opts });

const HOT = "const w = h.api.get('/api/weather'); const by = {}; for (const r of w) { (by[r.city] ||= { t: 0, n: 0, rain: 0 }); by[r.city].t += r.temp_c; by[r.city].n++; by[r.city].rain += r.rain_mm; } const want = Object.entries(by).map(([city, o]) => ({ city, avg: o.t / o.n, rain: o.rain })).sort((a, b) => b.avg - a.avg);";
const WEATHER_CHECK = `${HOT} h.eq(h.text('#state'), 'Loading weather...'); await h.settle(); h.eq(h.text('#state'), '');
const lis = h.$$('#cities li').map((l) => h.norm(l.textContent)); h.eq(lis.length, want.length, 'One line per city');
lis.forEach((t, i) => { const m = /^(.+): (-?\\d+\\.\\d) °C, (\\d+\\.\\d) mm rain$/.exec(t); h.assert(m, 'Line ' + (i + 1) + ' should look like "Bath: 17.3 °C, 12.4 mm rain" (got "' + t + '")'); h.eq(m[1], want[i].city, 'City order: warmest average first (line ' + (i + 1) + ')'); h.assert(Math.abs(Number(m[2]) - want[i].avg) <= 0.06, 'Average for ' + m[1] + ' should be about ' + want[i].avg.toFixed(2)); h.assert(Math.abs(Number(m[3]) - want[i].rain) <= 0.06, 'Total rain for ' + m[1] + ' should be about ' + want[i].rain.toFixed(2)); });`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-26-independent-js', title: 'Trial: The Web Workshop', language: 'web', skillId: 'js.dom',
    blurb: 'Five briefs, no hints, no starter code, hidden checks in a real browser. Use your notes and the Field Manual.', prerequisites: ['web-25-web-projects'], xpReward: 0,
    reference: { title: 'Independent trials', body: 'An independent trial gives you a brief and nothing else. The page skeleton is provided; the behaviour is yours. Hidden checks look at what the page does: edge cases, bad input, timing and data you have not seen. The Field Manual documents the tools; how to combine them is the task.' },
    steps: [
      { kind: 'challenge', challengeId: 'web-26-unit-converter' },
      { kind: 'challenge', challengeId: 'web-26-weather-board' },
      { kind: 'challenge', challengeId: 'web-26-course-enrol' },
      { kind: 'challenge', challengeId: 'web-26-city-filter' },
      { kind: 'challenge', challengeId: 'web-26-sales-summary' },
    ],
  },
  objectives: [],
  challenges: [
    wc({
      id: 'web-26-unit-converter', title: 'The Lab Temperature Converter', mode: 'independent', skillIds: ['js.dom', 'js.forms'], concepts: [], difficulty: 4, transfer: true, context: 'science',
      prompt: text(
        'A lab page converts temperatures. The person types a number into `#value` and picks the unit it is in (`#from`: C, F or K) and the unit they want (`#to`). `#result` always shows the answer, updating as they type or change either unit, with no button, as **one decimal and the unit symbol**: `°C`, `°F` or `K` (for example `212.0 °F`, `373.1 K`).',
        'If `#value` is empty or is not a number, `#result` says `Enter a number`. Anything colder than absolute zero (-273.15 °C) is impossible: `#result` says `Below absolute zero`. A result that rounds to zero is written `0.0` and never `-0.0`. Spaces around the number are ignored. The page must show a sensible answer the moment it loads.',
      ),
      starterFiles: files(HTML.convert, '', ''), tabs: ['js'], hints: [],
      checks: [
        convCheck('Typical conversions', [['100', 'C', 'F', 212], ['32', 'F', 'C', 0], ['0', 'C', 'K', 273.15], ['300', 'K', 'C', 26.85], ['98.6', 'F', 'C', 37], ['-40', 'C', 'F', -40]]),
        convCheck('The same unit and signs', [['21.5', 'C', 'C', 21.5], ['-5', 'K', 'K', 'Below absolute zero'], ['-12.34', 'F', 'F', -12.34], ['0', 'K', 'C', -273.15]]),
        convCheck('Empty, text and spaces', [['', 'C', 'F', 'Enter a number'], ['abc', 'C', 'F', 'Enter a number'], ['12abc', 'C', 'F', 'Enter a number'], ['  20  ', 'C', 'F', 68], ['-', 'C', 'F', 'Enter a number'], ['   ', 'C', 'F', 'Enter a number']]),
        convCheck('Absolute zero', [['-273.15', 'C', 'C', -273.15], ['-273.16', 'C', 'C', 'Below absolute zero'], ['-300', 'C', 'K', 'Below absolute zero'], ['-500', 'F', 'K', 'Below absolute zero'], ['0', 'K', 'K', 0]]),
        convCheck('No negative zero', [['-0.04', 'C', 'C', 0], ['-0.01', 'F', 'F', 0]]),
        web('Shows something at load, and after changing only a unit', "h.assert(h.text('#result').length > 0, 'The result must not be blank at load.'); h.eq(h.text('#result'), 'Enter a number'); h.type('#value', '10'); h.select('#to', 'K'); h.assert(/K$/.test(h.text('#result')), 'Changing a unit updates the result'); h.select('#from', 'K'); h.assert(/^10\\.0 K$/.test(h.text('#result')), 'Changing the other unit updates it too (got ' + h.text('#result') + ')');", { visible: false }),
      ],
      xpReward: 200, coinReward: 30,
    }),
    wc({
      id: 'web-26-weather-board', title: 'The Weather Board', mode: 'independent', skillIds: ['web.http', 'js.data'], concepts: [], difficulty: 4, transfer: true, context: 'science', api: true,
      prompt: text(
        'The game’s weather service publishes one reading per row (city, date, temperature, rainfall). Build a page that summarises it: one line per city that appears in the data, **warmest average temperature first**, in `#cities`, written like `Bath: 17.3 °C, 12.4 mm rain`: the average temperature and the **total** rainfall, each with one decimal.',
        '`#state` says `Loading weather...` until the data arrives and is empty afterwards. If the service is unavailable, `#state` says `Weather unavailable` and no city lines are shown. The Field Manual describes the service.',
      ),
      starterFiles: files(HTML.weather, '', ''), tabs: ['js'], hints: [],
      checks: [
        web('The summary', WEATHER_CHECK, { visible: false }),
        web('The hidden data set', WEATHER_CHECK, { api: 'b', visible: false }),
        web('When the service fails', "h.api.failNext(1, 503); await h.settle(); h.eq(h.text('#state'), 'Weather unavailable'); h.eq(h.$$('#cities li').length, 0);", { visible: false }),
        web('Another failure code', "h.api.failNext(1, 500); await h.settle(); h.eq(h.text('#state'), 'Weather unavailable'); h.eq(h.$$('#cities li').length, 0);", { visible: false }),
      ],
      xpReward: 200, coinReward: 30,
    }),
    wc({
      id: 'web-26-course-enrol', title: 'The Course Enrolment Desk', mode: 'independent', skillIds: ['web.http', 'js.forms'], concepts: [], difficulty: 4, transfer: true, context: 'education', api: true,
      prompt: text(
        'An enrolment desk works with the game’s course service. `#course` lists only the courses that still have seats, in the service’s order, each option showing `<title> (<seats> seats)` and carrying the course id as its value (`1 seat` reads `(1 seat)`).',
        'Submitting the form enrols the student: it reduces that course’s remaining seats by one **on the server**. The student name (spaces around it ignored) must be at least 2 characters, otherwise `#state` says `Enter the student name` and nothing is sent. After a successful enrolment `#state` says `Enrolled <student> in <title>` and `#course` shows the up-to-date seats, dropping a course that has just filled. If the service refuses, `#state` says `Could not enrol (status <code>)` and nothing changes on screen. The browser must never send the form itself.',
      ),
      starterFiles: files(HTML.enrol, '', ''), tabs: ['js'], hints: [],
      checks: [
        web('The course list', "const all = h.api.get('/api/courses').filter((c) => c.seats > 0); await h.settle(); h.eq(h.$$('#course option').map((o) => [o.value, h.norm(o.textContent)]), all.map((c) => [String(c.id), c.title + ' (' + c.seats + (c.seats === 1 ? ' seat)' : ' seats)')]));", { visible: false }),
        web('Enrolling', "let prevented = null; document.addEventListener('submit', (e) => { prevented = e.defaultPrevented; }); await h.settle(); const before = h.api.get('/api/courses'); const first = before.find((c) => c.seats > 1); h.select('#course', String(first.id)); h.type('#student', '  Mo  '); h.click('#enrol button[type=submit]'); h.assert(prevented === true, 'Stop the browser sending the form.'); await h.settle(); h.eq(h.text('#state'), 'Enrolled Mo in ' + first.title); h.eq(h.api.get('/api/courses/' + first.id).seats, first.seats - 1, 'The server has one seat fewer'); const opt = h.$$('#course option').find((o) => o.value === String(first.id)); h.eq(h.norm(opt.textContent), first.title + ' (' + (first.seats - 1) + (first.seats - 1 === 1 ? ' seat)' : ' seats)'));", { visible: false }),
        web('Only one seat is taken per enrolment', "await h.settle(); const first = h.api.get('/api/courses').find((c) => c.seats > 2); h.select('#course', String(first.id)); h.type('#student', 'Al'); h.click('#enrol button[type=submit]'); await h.settle(); h.type('#student', 'Bo'); h.click('#enrol button[type=submit]'); await h.settle(); h.eq(h.api.get('/api/courses/' + first.id).seats, first.seats - 2, 'Two enrolments, two seats'); h.eq(h.text('#state'), 'Enrolled Bo in ' + first.title);", { visible: false }),
        web('The last seat', "await h.settle(); const last = h.api.get('/api/courses').find((c) => c.seats === 1); h.assert(last, 'internal: the data must contain a course with one seat'); h.select('#course', String(last.id)); h.type('#student', 'Di'); h.click('#enrol button[type=submit]'); await h.settle(); h.eq(h.api.get('/api/courses/' + last.id).seats, 0); h.assert(!h.$$('#course option').some((o) => o.value === String(last.id)), 'A full course disappears from the list'); h.eq(h.text('#state'), 'Enrolled Di in ' + last.title);", { visible: false }),
        web('A short name sends nothing', "await h.settle(); h.type('#student', ' A '); h.click('#enrol button[type=submit]'); await h.settle(); h.eq(h.text('#state'), 'Enter the student name'); h.eq(h.api.calls.filter((c) => c.method !== 'GET').length, 0, 'No change may be sent');", { visible: false }),
        web('The service refuses', "await h.settle(); const before = h.$$('#course option').map((o) => h.norm(o.textContent)); h.type('#student', 'Ed'); h.api.failNext(1, 500); h.click('#enrol button[type=submit]'); await h.settle(); h.eq(h.text('#state'), 'Could not enrol (status 500)'); h.eq(h.$$('#course option').map((o) => h.norm(o.textContent)), before, 'The list is unchanged');", { visible: false }),
        web('The hidden data set', "const all = h.api.get('/api/courses').filter((c) => c.seats > 0); await h.settle(); h.eq(h.$$('#course option').map((o) => o.value), all.map((c) => String(c.id))); const c = all[0]; h.select('#course', String(c.id)); h.type('#student', 'Fay'); h.click('#enrol button[type=submit]'); await h.settle(); h.eq(h.api.get('/api/courses/' + c.id).seats, c.seats - 1);", { api: 'b', visible: false }),
      ],
      xpReward: 210, coinReward: 32,
    }),
    wc({
      id: 'web-26-city-filter', title: 'The Delayed City Filter', mode: 'independent', skillIds: ['js.async', 'js.dom'], concepts: [], difficulty: 4, transfer: true, context: 'software',
      prompt: text(
        'The list of cities must narrow down as the person types into `#q`, showing only cities whose name contains the text (capitals ignored, spaces around the text ignored) and hiding the others with the `hidden` attribute. `#count` says `<n> of 8 shown` and must be correct as soon as the page loads.',
        'Filtering a long list on every keystroke is wasteful, so the list and the count change **only after the person has paused typing for 300 milliseconds**. A burst of keystrokes with shorter gaps causes a single update, 300 ms after the last one.',
      ),
      starterFiles: files(HTML.cities, '', ''), tabs: ['js'], hints: [],
      checks: [
        web('The start', "h.eq(h.text('#count'), '8 of 8 shown'); h.eq(h.$$('#cities li:not([hidden])').length, 8);", { visible: false }),
        web('One pause, one update', "h.type('#q', 'le'); await h.tick(299); h.eq(h.text('#count'), '8 of 8 shown', 'Nothing changes before 300 ms have passed'); await h.tick(1); h.eq(h.text('#count'), '2 of 8 shown'); h.eq(h.$$('#cities li:not([hidden])').map((l) => l.textContent.trim()), ['Leeds', 'Lewes']);", { visible: false }),
        web('A burst of typing', "h.type('#q', 'l'); await h.tick(100); h.type('#q', 'le'); await h.tick(100); h.type('#q', 'lee'); await h.tick(299); h.eq(h.text('#count'), '8 of 8 shown', 'The clock restarts with every keystroke'); await h.tick(1); h.eq(h.text('#count'), '1 of 8 shown'); h.eq(h.$$('#cities li:not([hidden])').map((l) => l.textContent.trim()), ['Leeds']);", { visible: false }),
        web('Capitals and spaces', "h.type('#q', '  HU '); await h.tick(300); h.eq(h.$$('#cities li:not([hidden])').map((l) => l.textContent.trim()), ['Hull']); h.eq(h.text('#count'), '1 of 8 shown');", { visible: false }),
        web('Clearing the text and no matches', "h.type('#q', 'zzz'); await h.tick(300); h.eq(h.text('#count'), '0 of 8 shown'); h.eq(h.$$('#cities li:not([hidden])').length, 0); h.type('#q', ''); await h.tick(300); h.eq(h.text('#count'), '8 of 8 shown'); h.eq(h.$$('#cities li:not([hidden])').length, 8);", { visible: false }),
        web('Typing after a pause', "h.type('#q', 'y'); await h.tick(300); h.eq(h.text('#count'), '3 of 8 shown'); h.type('#q', 'yo'); await h.tick(200); h.eq(h.text('#count'), '3 of 8 shown', 'Still the old result'); await h.tick(100); h.eq(h.text('#count'), '1 of 8 shown');", { visible: false }),
      ],
      xpReward: 200, coinReward: 30,
    }),
    wc({
      id: 'web-26-sales-summary', title: 'The Customer Sales Summary', mode: 'independent', skillIds: ['js.data', 'js.basics'], concepts: [], difficulty: 4, transfer: true, context: 'finance',
      prompt: text(
        'Write a function `summarize(orders)`. Each order looks like `{ customer: "Ada", status: "paid", lines: [{ price: 2.5, qty: 4 }, ...] }`. Orders whose status is exactly `"cancelled"` do not count.',
        'Return one object per customer that has at least one counting order: `{ customer, orders, total }`, where `orders` is how many counting orders they have and `total` is the sum of `price × qty` over all their counting orders, **rounded to 2 decimal places** (money must not show floating-point noise). Sort the result by `total`, largest first; customers with the same total go in A–Z order. An order with no lines still counts as an order (worth 0). The input must not be changed.',
      ),
      starterFiles: files('', '', ''), tabs: ['js'], hints: [],
      checks: jsCalls('summarize', '(orders) => { const by = new Map(); for (const o of orders) { if (o.status === "cancelled") continue; const e = by.get(o.customer) || { customer: o.customer, orders: 0, sum: 0 }; e.orders++; for (const l of o.lines) e.sum += l.price * l.qty; by.set(o.customer, e); } return [...by.values()].map((e) => ({ customer: e.customer, orders: e.orders, total: Math.round(e.sum * 100) / 100 })).sort((a, b) => b.total - a.total || (a.customer < b.customer ? -1 : a.customer > b.customer ? 1 : 0)); }', [
        '[{ customer: "Ada", status: "paid", lines: [{ price: 2.5, qty: 4 }] }, { customer: "Bo", status: "paid", lines: [{ price: 30, qty: 1 }] }]',
        '[]',
        '[{ customer: "Ada", status: "cancelled", lines: [{ price: 100, qty: 1 }] }]',
        '[{ customer: "Cy", status: "paid", lines: [{ price: 0.1, qty: 3 }] }, { customer: "Cy", status: "shipped", lines: [{ price: 0.2, qty: 1 }] }]',
        '[{ customer: "Bea", status: "paid", lines: [{ price: 5, qty: 2 }] }, { customer: "Al", status: "paid", lines: [{ price: 10, qty: 1 }] }, { customer: "Cid", status: "paid", lines: [{ price: 1, qty: 10 }] }]',
        '[{ customer: "Di", status: "paid", lines: [] }, { customer: "Ed", status: "paid", lines: [{ price: 1, qty: 1 }] }]',
        '[{ customer: "Fay", status: "Cancelled", lines: [{ price: 7, qty: 1 }] }, { customer: "Fay", status: "cancelled", lines: [{ price: 9, qty: 1 }] }]',
        '[{ customer: "Gus", status: "paid", lines: [{ price: 19.99, qty: 3 }, { price: 0.01, qty: 7 }] }, { customer: "gus", status: "paid", lines: [{ price: 60, qty: 1 }] }]',
        '[{ customer: "Hal", status: "paid", lines: [{ price: 1.005, qty: 100 }] }]',
        '[{ customer: "Ivy", status: "paid", lines: [{ price: 4, qty: 0 }] }, { customer: "Ivy", status: "cancelled", lines: [] }]',
      ], { pure: true }),
      xpReward: 190, coinReward: 28,
    }),
  ],
};
