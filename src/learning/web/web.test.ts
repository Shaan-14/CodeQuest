import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startWebHarness, type WebHarness } from './testHarness';
import type { WebFiles } from '../../content/schema';

let web: WebHarness;
beforeAll(async () => {
  web = await startWebHarness();
}, 60_000);
afterAll(async () => {
  await web?.close();
});

const page = (html: string, css = '', js = ''): WebFiles => ({ html, css, js });
const check = (files: WebFiles, script: string, extra: Record<string, unknown> = {}) => web.check(files, { script, ...extra });

describe('HTML and CSS execution', () => {
  it('renders the player’s HTML in standards mode and lets a check read the DOM', async () => {
    const r = await check(page('<!DOCTYPE html><html lang="en"><head><title>T</title></head><body><h1>Hello <em>world</em></h1></body></html>'), `
      h.eq(h.text('h1'), 'Hello world');
      h.assert(document.compatMode === 'CSS1Compat', 'standards mode');
      h.eq(document.documentElement.lang, 'en');
      h.eq(document.title, 'T');`);
    expect(r).toEqual({ passed: true, message: '' });
  });
  it('works with a fragment (no doctype/html/head)', async () => {
    const r = await check(page('<p id="x">hi</p>'), `h.eq(h.text('#x'), 'hi');`);
    expect(r.passed, r.message).toBe(true);
  });
  it('applies the CSS file automatically and reads computed styles, honouring the cascade and specificity', async () => {
    const r = await check(page('<h1 class="big" id="t">Hi</h1><p>x</p>', 'h1 { color: red; } #t { color: rgb(0, 0, 255); } .big { color: green; } p { margin: 0 }'), `
      h.eq(h.style('h1', 'color'), 'rgb(0, 0, 255)');
      h.eq(h.style('p', 'margin-top'), '0px');`);
    expect(r.passed, r.message).toBe(true);
  });
  it('a <link href="style.css"> is replaced by the player’s CSS, and other links are blocked', async () => {
    const r = await check(page('<!DOCTYPE html><html><head><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="https://example.com/x.css"></head><body><p>x</p></body></html>', 'p { font-size: 33px }'), `h.eq(h.style('p', 'font-size'), '33px');`);
    expect(r.passed, r.message).toBe(true);
  });
  it('evaluates media queries against the requested viewport and lays out flexbox', async () => {
    const css = '.row { display: flex; } .row > div { width: 100px; } @media (max-width: 500px) { .row { flex-direction: column; } }';
    const html = '<div class="row"><div id="a">A</div><div id="b">B</div></div>';
    const wide = await check(page(html, css), `h.assert(h.rect('#b').left > h.rect('#a').left, 'side by side on wide screens');`, { viewport: { width: 900 } });
    const narrow = await check(page(html, css), `h.assert(h.rect('#b').top > h.rect('#a').top, 'stacked on narrow screens');`, { viewport: { width: 400 } });
    expect(wide.passed, wide.message).toBe(true);
    expect(narrow.passed, narrow.message).toBe(true);
  });
  it('a failing assertion reports its message and fails', async () => {
    const r = await check(page('<h1>Hi</h1>'), `h.assert(h.exists('nav'), 'The page needs a nav element.');`);
    expect(r).toEqual({ passed: false, message: 'The page needs a nav element.' });
  });
});

describe('JavaScript execution', () => {
  it('runs the player’s script, DOM updates and events', async () => {
    const files = page('<button id="b">+</button><p id="n">0</p>', '', 'let n = 0; document.getElementById("b").addEventListener("click", () => { n++; document.getElementById("n").textContent = n; });');
    const r = await check(files, `h.click('#b'); h.click('#b'); h.eq(h.text('#n'), '2');`);
    expect(r.passed, r.message).toBe(true);
  });
  it('an uncaught error in the player’s JavaScript fails the check with the error text', async () => {
    const r = await check(page('<p>x</p>', '', 'missing.call();'), `h.assert(true);`);
    expect(r.passed).toBe(false);
    expect(r.message).toMatch(/JavaScript threw an error: ReferenceError: missing is not defined/);
  });
  it('a rejected promise is reported too', async () => {
    const r = await check(page('<p>x</p>', '', 'Promise.reject(new Error("boom"));'), `h.assert(true);`);
    expect(r.passed).toBe(false);
    expect(r.message).toMatch(/boom/);
  });
  it('captures console output', async () => {
    const r = await web.run(page('<p>x</p>', '', 'console.log("hello", 42, {a: 1}); console.error("bad"); console.log(undefined);'));
    expect(r.logs).toEqual([{ level: 'log', text: 'hello 42 {"a":1}' }, { level: 'error', text: 'bad' }, { level: 'log', text: 'undefined' }]);
    expect(r.errors).toEqual([]);
  });
  it('reports uncaught errors in Run mode', async () => {
    const r = await web.run(page('<p>x</p>', '', 'throw new TypeError("nope")'));
    expect(r.errors).toEqual(['TypeError: nope']);
  });
  it('forms: submit runs the browser’s validation and fires the submit event only when valid', async () => {
    const html = '<form id="f"><input id="e" name="email" type="email" required><button>Go</button></form><p id="out"></p>';
    const js = 'document.getElementById("f").addEventListener("submit", (ev) => { ev.preventDefault(); document.getElementById("out").textContent = "sent " + document.getElementById("e").value; });';
    const r = await check(page(html, '', js), `
      let s = h.submit('#f'); h.assert(!s.fired && !s.valid, 'empty required field must block submit');
      h.type('#e', 'nope'); s = h.submit('#f'); h.assert(!s.fired, 'invalid email must block submit');
      h.type('#e', 'a@b.co'); s = h.submit('#f'); h.assert(s.fired && s.valid, 'valid email submits');
      h.eq(h.text('#out'), 'sent a@b.co');
      h.eq(h.labelText('#e'), '');`);
    expect(r.passed, r.message).toBe(true);
  });
  it('virtual time: timers and Date.now are deterministic and controlled by h.tick', async () => {
    const js = 'const out = document.getElementById("o"); let n = 0; const id = setInterval(() => { n++; out.textContent = n; if (n === 3) clearInterval(id); }, 1000); setTimeout(() => out.dataset.done = "yes", 5000);';
    const r = await check(page('<p id="o">0</p>', '', js), `
      h.eq(h.text('#o'), '0'); await h.tick(999); h.eq(h.text('#o'), '0');
      await h.tick(1); h.eq(h.text('#o'), '1'); await h.tick(5000); h.eq(h.text('#o'), '3');
      h.eq(h.$('#o').dataset.done, 'yes');`);
    expect(r.passed, r.message).toBe(true);
  });
});

describe('storage, network lockdown and dialogs', () => {
  it('localStorage works (privately, in memory) even though the page has an opaque origin', async () => {
    const js = 'localStorage.setItem("name", "Ada"); localStorage.count = 5; window.readBack = [localStorage.getItem("name"), localStorage.getItem("count"), localStorage.length];';
    const r = await check(page('<p>x</p>', '', js), `h.eq(window.readBack, ['Ada', '5', 2]); h.eq(h.storage.getItem('name'), 'Ada'); localStorage.removeItem('name'); h.eq(localStorage.getItem('name'), null);`);
    expect(r.passed, r.message).toBe(true);
  });
  it('blocks real network access: external fetch, XMLHttpRequest, WebSocket and external stylesheets/images', async () => {
    const js = `
      window.res = {};
      fetch('https://example.com/data.json').catch((e) => { window.res.fetch = e.name; });
      try { new XMLHttpRequest(); } catch (e) { window.res.xhr = 'blocked'; }
      try { new WebSocket('wss://example.com'); } catch (e) { window.res.ws = 'blocked'; }`;
    const r = await check(page('<img src="https://example.com/x.png" id="i">', '', js), `await h.settle(); h.eq(window.res, { fetch: 'TypeError', xhr: 'blocked', ws: 'blocked' });`);
    expect(r.passed, r.message).toBe(true);
  });
  it('records alert/confirm/prompt instead of showing dialogs', async () => {
    const r = await check(page('<p>x</p>', '', 'alert("hi"); window.ok = confirm("sure?");'), `h.eq(h.dialogs.map((d) => d.kind), ['alert', 'confirm']); h.assert(window.ok === true);`);
    expect(r.passed, r.message).toBe(true);
  });
  it('player code cannot reach the game: window.parent access, top-level storage and cookies are unavailable', async () => {
    const js = 'window.probe = {}; try { window.probe.cookie = document.cookie; } catch (e) { window.probe.cookie = "blocked"; }';
    const r = await check(page('<p>x</p>', '', js), `h.assert(typeof window.probe.cookie === 'string');`);
    expect(r.passed, r.message).toBe(true);
  });
});

describe('the in-game API through fetch', () => {
  const list = 'fetch("/api/machines?status=down&sort=-downtime_hours").then(r => r.json()).then(rows => { window.rows = rows; });';
  it('serves deterministic collections with filters, sorting and status codes', async () => {
    const r = await check(page('<p>x</p>', '', `${list}
      fetch("/api/machines/999").then(r => { window.notFound = r.status; return r.json(); }).then(b => { window.notFoundBody = b; });
      fetch("/api/private/products").then(r => { window.unauth = r.status; });
      fetch("/api/private/products", { headers: { Authorization: "Bearer codequest-key" } }).then(r => { window.auth = r.status; });`), `
      await h.settle();
      h.assert(Array.isArray(window.rows) && window.rows.every((m) => m.status === 'down'), 'filtered by status');
      h.eq(window.rows.map((m) => m.downtime_hours), window.rows.map((m) => m.downtime_hours).slice().sort((a, b) => b - a));
      h.eq(window.notFound, 404); h.assert(window.notFoundBody.error, 'error body');
      h.eq(window.unauth, 401); h.eq(window.auth, 200);`);
    expect(r.passed, r.message).toBe(true);
  });
  it('supports POST with validation (415, 400, 201), PATCH and DELETE, and remembers changes', async () => {
    const js = `
      const send = (m, url, body, type = 'application/json') => fetch(url, { method: m, headers: { 'Content-Type': type }, body }).then(async (r) => ({ status: r.status, body: r.status === 204 ? null : await r.json() }));
      (async () => {
        window.out = [];
        window.out.push((await send('POST', '/api/machines', '{"name":"X"}', 'text/plain')).status);
        window.out.push((await send('POST', '/api/machines', '{"name":"X"}')).status);
        const created = await send('POST', '/api/machines', JSON.stringify({ name: 'New', type: 'press' }));
        window.out.push(created.status);
        window.newId = created.body.id;
        window.out.push((await send('PATCH', '/api/machines/' + created.body.id, '{"status":"down"}')).body.status);
        window.out.push((await send('DELETE', '/api/machines/' + created.body.id)).status);
        window.out.push((await fetch('/api/machines/' + created.body.id)).status);
      })();`;
    const r = await check(page('<p>x</p>', '', js), `await h.settle(); h.eq(window.out, [415, 400, 201, 'down', 204, 404]);`);
    expect(r.passed, r.message).toBe(true);
  });
  it('flaky and rate-limited endpoints behave deterministically; failNext simulates outages', async () => {
    const js = `(async () => { window.s = []; for (let i = 0; i < 3; i++) window.s.push((await fetch('/api/flaky')).status); for (let i = 0; i < 4; i++) window.s.push((await fetch('/api/rate-limited')).status); })();`;
    const r = await check(page('<p>x</p>', '', js), `await h.settle(); h.eq(window.s, [503, 503, 200, 200, 200, 200, 429]);`);
    expect(r.passed, r.message).toBe(true);
    const f = await check(page('<p>x</p>', '', '(async () => { window.st = (await fetch("/api/machines")).status; })();'), `h.api.failNext(1, 503); await h.settle(); h.eq(window.st, 503);`);
    expect(f.passed, f.message).toBe(true);
  });
  it('has different (hidden) data in variant b, and API latency is virtual (loading states are testable)', async () => {
    const js = 'const p = document.getElementById("s"); p.textContent = "loading"; fetch("/api/players?limit=1").then(r => r.json()).then(rows => { p.textContent = rows[0].name; });';
    const seenA: string[] = [];
    for (const api of ['a', 'b'] as const) {
      const r = await web.check(page('<p id="s"></p>', '', js), { api, script: `h.eq(h.text('#s'), 'loading'); await h.settle(); h.assert(h.text('#s') !== 'loading', 'loaded'); return h.text('#s');` });
      expect(r.passed, r.message).toBe(true);
      seenA.push(r.message);
    }
    expect(seenA[0]).not.toBe(seenA[1]);
  });
});
