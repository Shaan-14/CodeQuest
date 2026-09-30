/**
 * CodeQuest web sandbox RUNTIME. Classic script, inlined into web-sandbox.html (see sandboxPage.ts) together with
 * apiServer.js. It runs inside a sandboxed, opaque-origin iframe (sandbox="allow-scripts") and is the ONLY
 * code with a line back to the game: a small postMessage protocol.
 *
 * Flow: page loads -> posts {type:'hello', nonce} -> host answers {cq:'run', files, config} -> the runtime builds a
 * complete document from the player's HTML/CSS/JS and document.write()s it. Before any player code runs, the
 * document's prelude (a) applies a strict Content-Security-Policy (no network, no external anything), (b) calls
 * __CQ_boot() to install: console capture, error capture, a private in-memory localStorage/sessionStorage, the
 * in-game API as `fetch`, dialog shims, and (in grade mode) a virtual clock. Then, in grade mode, an authored check
 * script runs against the finished page and posts {type:'result'}.
 *
 * Security (see ARCHITECTURE.md, "Web sandbox"): the iframe has NO allow-same-origin, so player code cannot reach
 * the parent DOM, the game's localStorage/IndexedDB/cookies or the save; CSP blocks all network; every message
 * from the iframe is treated by the host as untrusted data. Player code shares this window with the runtime, so a
 * determined player could forge a result: like the Python side, cheating only cheats the player.
 */
(function () {
  'use strict';
  var nativePost = window.parent.postMessage.bind(window.parent);
  var nativeSetTimeout = window.setTimeout.bind(window);
  var nativeClearTimeout = window.clearTimeout.bind(window);
  var nativeJsonStringify = JSON.stringify.bind(JSON);
  var nativeRandomValues = window.crypto.getRandomValues.bind(window.crypto);
  var nonceBytes = new Uint32Array(4);
  nativeRandomValues(nonceBytes);
  var nonce = Array.prototype.join.call(nonceBytes, '-');

  var CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; media-src data:; connect-src 'none'; frame-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'";
  var MAX_LOGS = 200;
  var MAX_TEXT = 2000;

  var cfg = null;
  var state = { logs: [], errors: [], dialogs: [], pending: 0, server: null, ticks: 0 };

  function send(msg) {
    msg.cq = true;
    msg.nonce = nonce;
    try { nativePost(msg, '*'); } catch (e) { /* the host went away */ }
  }
  function clip(s) {
    s = String(s);
    return s.length > MAX_TEXT ? s.slice(0, MAX_TEXT) + '…' : s;
  }
  function show(v) {
    if (typeof v === 'string') return v;
    if (v instanceof Error) return v.name + ': ' + v.message;
    try { var j = nativeJsonStringify(v); return j === undefined ? String(v) : j; } catch (e) { return String(v); }
  }

  /* ---------------------------------------------------------------- virtual clock (grade mode only) */
  var clock = { now: 0, timers: [], nextId: 1 };
  function vSet(fn, ms, repeat, args) {
    var id = clock.nextId++;
    clock.timers.push({ id: id, at: clock.now + Math.max(0, Number(ms) || 0), every: repeat ? Math.max(1, Number(ms) || 0) : 0, fn: fn, args: args || [] });
    return id;
  }
  function vClear(id) { clock.timers = clock.timers.filter(function (t) { return t.id !== id; }); }
  /** Advance virtual time by ms, running due timers in order (microtasks flushed between them). */
  async function tick(ms) {
    var target = clock.now + Math.max(0, ms || 0);
    await flushMicrotasks();
    for (var guard = 0; guard < 5000; guard++) {
      var due = clock.timers.filter(function (t) { return t.at <= target; }).sort(function (a, b) { return a.at - b.at || a.id - b.id; })[0];
      if (!due) break;
      clock.now = due.at;
      if (due.every) due.at += due.every; else clock.timers = clock.timers.filter(function (t) { return t !== due; });
      try { if (typeof due.fn === 'function') due.fn.apply(window, due.args); } catch (e) { recordError(e, 'timer'); }
      await flushMicrotasks();
    }
    clock.now = target;
  }
  async function flushMicrotasks() { for (var i = 0; i < 10; i++) await Promise.resolve(); }
  function later(fn, ms) {
    if (cfg && cfg.mode === 'grade') return vSet(fn, ms, false);
    return nativeSetTimeout(fn, ms);
  }
  function realSleep(ms) { return new Promise(function (resolve) { nativeSetTimeout(resolve, ms); }); }
  /**
   * Let queued work finish: microtasks, zero-delay timers, every in-flight API request, and the short real-time
   * gap browsers need to read a response body (`response.json()` is not a microtask). Virtual time advances only
   * while requests are pending, so a 5-second timeout in the player's code is NOT fired by settle().
   */
  async function settle() {
    var quiet = 0;
    for (var i = 0; i < 600 && quiet < 3; i++) {
      await tick(0);
      // Advance in 1 ms steps and stop the moment the last request completes, so timers the page sets in response to
      // a reply (e.g. "wait 1 s, then retry") are exactly that far in the future, not a few ms less.
      if (state.pending > 0) { for (var k = 0; k < 40 && state.pending > 0; k++) await tick(1); quiet = 0; } else quiet++;
      await realSleep(3);
    }
  }

  /* ---------------------------------------------------------------- private storage */
  function makeStorage() {
    var data = Object.create(null);
    var api = {
      getItem: function (k) { k = String(k); return k in data ? data[k] : null; },
      setItem: function (k, v) { data[String(k)] = String(v); },
      removeItem: function (k) { delete data[String(k)]; },
      clear: function () { data = Object.create(null); },
      key: function (i) { var ks = Object.keys(data); return i >= 0 && i < ks.length ? ks[i] : null; },
    };
    return new Proxy(api, {
      get: function (t, p) { if (p === 'length') return Object.keys(data).length; if (p in t) return t[p]; return typeof p === 'string' && p in data ? data[p] : undefined; },
      set: function (t, p, v) { data[String(p)] = String(v); return true; },
      deleteProperty: function (t, p) { delete data[String(p)]; return true; },
      has: function (t, p) { return p in t || (typeof p === 'string' && p in data); },
      ownKeys: function () { return Object.keys(data); },
      getOwnPropertyDescriptor: function (t, p) { return typeof p === 'string' && p in data ? { value: data[p], writable: true, enumerable: true, configurable: true } : undefined; },
    });
  }

  /* ---------------------------------------------------------------- fetch -> in-game API */
  function normHeaders(h) {
    var out = {};
    if (!h) return out;
    if (typeof h.forEach === 'function' && !Array.isArray(h)) { h.forEach(function (v, k) { out[k] = v; }); return out; }
    if (Array.isArray(h)) { h.forEach(function (p) { out[p[0]] = p[1]; }); return out; }
    for (var k in h) out[k] = h[k];
    return out;
  }
  function fakeFetch(input, init) {
    init = init || {};
    var url = typeof input === 'string' ? input : input && input.url ? input.url : String(input);
    var method = init.method || (input && input.method) || 'GET';
    var headers = normHeaders(init.headers || (input && input.headers));
    var body = init.body === undefined ? null : init.body;
    if (body !== null && typeof body !== 'string') {
      if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) { body = body.toString(); headers['content-type'] = headers['content-type'] || 'application/x-www-form-urlencoded'; }
      else body = String(body);
    }
    if (!/^(\/api(\/|\?|$)|https:\/\/api\.codequest\.test\/api(\/|\?|$))/.test(url)) {
      return Promise.reject(new TypeError('Failed to fetch (only the CodeQuest API at /api/... is reachable here)'));
    }
    var signal = init.signal;
    if (signal && signal.aborted) return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
    state.pending++;
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = later(function () {
        if (done) return;
        done = true;
        state.pending--;
        var res;
        var override = state.failNext && state.failNext.count > 0 ? (state.failNext.count--, state.failNext.status) : 0;
        if (override) state.server.record(method, url, { headers: headers, body: body });
        if (override) res = { status: override, headers: { 'Content-Type': 'application/json' }, body: nativeJsonStringify({ error: 'Simulated server error' }) };
        else res = state.server.handle(method, url, { headers: headers, body: body });
        var bodyOut = res.status === 204 || res.status === 205 || res.status === 304 ? null : res.body;
        resolve(new Response(bodyOut, { status: res.status, statusText: '', headers: res.headers }));
      }, state.server.latencyFor(url));
      if (signal && typeof signal.addEventListener === 'function') {
        signal.addEventListener('abort', function () {
          if (done) return;
          done = true;
          state.pending--;
          if (cfg && cfg.mode === 'grade') vClear(timer); else nativeClearTimeout(timer);
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      }
    });
  }

  /* ---------------------------------------------------------------- errors, console */
  function recordError(e, where) {
    var text = clip((e && e.name ? e.name + ': ' : '') + (e && e.message ? e.message : show(e)));
    if (state.errors.length < MAX_LOGS) state.errors.push(text);
    send({ type: 'error', text: text, where: where || 'script' });
  }
  function patchConsole() {
    ['log', 'info', 'warn', 'error', 'debug'].forEach(function (level) {
      var native = console[level] ? console[level].bind(console) : function () {};
      console[level] = function () {
        var text = clip(Array.prototype.map.call(arguments, show).join(' '));
        if (state.logs.length < MAX_LOGS) {
          state.logs.push({ level: level, text: text });
          send({ type: 'console', level: level, text: text });
        }
        native.apply(null, arguments);
      };
    });
  }

  /** Global lockdown that must exist once per window (it survives document.open). */
  function lockdown() {
    var deny = function (what, hint) { return function () { throw new Error(what + ' is not available in the CodeQuest sandbox.' + (hint ? ' ' + hint : '')); }; };
    var setters = {
      localStorage: makeStorage(),
      sessionStorage: makeStorage(),
    };
    Object.keys(setters).forEach(function (k) { try { Object.defineProperty(window, k, { value: setters[k], configurable: true, writable: true }); } catch (e) { /* keep native */ } });
    window.fetch = fakeFetch;
    window.XMLHttpRequest = deny('XMLHttpRequest', 'Use fetch() with the CodeQuest API (/api/...).');
    window.WebSocket = deny('WebSocket');
    window.EventSource = deny('EventSource');
    try { navigator.sendBeacon = deny('sendBeacon'); } catch (e) { /* read-only in some engines */ }
    window.open = function () { state.dialogs.push({ kind: 'open' }); return null; };
    window.alert = function (m) { state.dialogs.push({ kind: 'alert', text: clip(m) }); };
    window.confirm = function (m) { state.dialogs.push({ kind: 'confirm', text: clip(m) }); return !(cfg && cfg.confirm === false); };
    window.prompt = function (m) { state.dialogs.push({ kind: 'prompt', text: clip(m) }); return cfg && cfg.promptValue !== undefined ? String(cfg.promptValue) : null; };
    window.__CQ_boot = boot;
  }

  /** Called by the prelude of every player document, before any player script runs. */
  function boot() {
    window.addEventListener('error', function (e) { recordError(e.error || e.message, 'script'); });
    window.addEventListener('unhandledrejection', function (e) { recordError(e.reason, 'promise'); });
    if (cfg && cfg.mode === 'grade') {
      clock.now = 0;
      clock.timers = [];
      window.setTimeout = function (fn, ms) { return vSet(fn, ms, false, Array.prototype.slice.call(arguments, 2)); };
      window.setInterval = function (fn, ms) { return vSet(fn, ms, true, Array.prototype.slice.call(arguments, 2)); };
      window.clearTimeout = vClear;
      window.clearInterval = vClear;
      Date.now = function () { return 1700000000000 + clock.now; };
    }
    window.addEventListener('load', function () { nativeSetTimeout(afterLoad, 0); });
  }

  /* ---------------------------------------------------------------- building the player's document */
  function buildDocument(files) {
    var html = String(files.html || '').replace(/^\s*<!doctype[^>]*>/i, '');
    var css = String(files.css || '').replace(/<\/style/gi, '<\\/style');
    var js = String(files.js || '').replace(/<\/script/gi, '<\\/script');
    var cssUsed = false;
    var jsUsed = false;
    html = html.replace(/<link\b[^>]*>/gi, function (tag) {
      if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
      var m = /href\s*=\s*["']?([^"'\s>]+)/i.exec(tag);
      if (m && /(^|\/)(style|styles|main|app|index)\.css$/i.test(m[1])) { cssUsed = true; return '<style>' + css + '</style>'; }
      return tag;
    });
    html = html.replace(/<script\b([^>]*)>\s*<\/script>/gi, function (tag, attrs) {
      var m = /\bsrc\s*=\s*["']?([^"'\s>]+)/i.exec(attrs);
      if (m && /(^|\/)(script|main|app|index)\.js$/i.test(m[1])) { jsUsed = true; return '<script>' + js + '<\/script>'; }
      return tag;
    });
    if (!cssUsed && css.trim()) {
      var styleTag = '<style>' + css + '</style>';
      html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, function () { return styleTag + '</head>'; }) : styleTag + html;
    }
    if (!jsUsed && js.trim()) {
      var scriptTag = '<script>' + js + '<\/script>';
      html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, function () { return scriptTag + '</body>'; }) : html + scriptTag;
    }
    var prelude = '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="' + CSP + '"><meta name="viewport" content="width=device-width, initial-scale=1"><script>window.__CQ_boot()<\/script>';
    return prelude + html;
  }

  /* ---------------------------------------------------------------- check helpers */
  function el(sel) { return typeof sel === 'string' ? document.querySelector(sel) : sel; }
  function needEl(sel) {
    var e = el(sel);
    if (!e) throw new Error('Could not find an element matching ' + (typeof sel === 'string' ? sel : 'the requested element') + '.');
    return e;
  }
  function norm(s) { return String(s === null || s === undefined ? '' : s).replace(/\s+/g, ' ').trim(); }
  function fire(target, type, init) {
    var e = new Event(type, Object.assign({ bubbles: true, cancelable: true }, init || {}));
    return target.dispatchEvent(e);
  }
  function nativeSet(target, prop, value) {
    var proto = Object.getPrototypeOf(target);
    var desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc && desc.set) desc.set.call(target, value); else target[prop] = value;
  }

  /** Stable JSON (object keys sorted) so h.eq ignores key order. */
  function canon(v) {
    if (v === undefined) return 'undefined';
    if (typeof v === 'number' && !isFinite(v)) return String(v); // NaN and Infinity are not null
    if (v === null || typeof v !== 'object') return nativeJsonStringify(v);
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    return '{' + Object.keys(v).sort().map(function (k) { return nativeJsonStringify(k) + ':' + canon(v[k]); }).join(',') + '}';
  }

  function makeHelpers() {
    var h = {
      files: cfg.files,
      $: function (s) { return document.querySelector(s); },
      $$: function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); },
      exists: function (s) { return !!document.querySelector(s); },
      text: function (s) { return norm(needEl(s).textContent); },
      attr: function (s, name) { return needEl(s).getAttribute(name); },
      value: function (s) { return needEl(s).value; },
      /** Computed style of an element (or of a pseudo-element, e.g. '::before'). Colours come back as rgb(...). */
      style: function (s, prop, pseudo) { return getComputedStyle(needEl(s), pseudo || null).getPropertyValue(prop); },
      /** Bounding box of an element's TEXT (not its box): where the words actually are. */
      textRect: function (s) { var e = needEl(s); var r = document.createRange(); r.selectNodeContents(e); var b = r.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, top: b.top, left: b.left, right: b.right, bottom: b.bottom }; },
      rect: function (s) { var r = needEl(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, width: r.width, height: r.height, top: r.top, left: r.left, right: r.right, bottom: r.bottom }; },
      norm: norm,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      click: function (s) { var e = needEl(s); e.click(); return e; },
      /**
       * Type like a user: focus, select the old text, and insert the new text through the editing pipeline. That
       * makes the value "user-edited", so length limits (maxlength/minlength) apply exactly as they do for people.
       */
      type: function (s, value) {
        var e = needEl(s);
        e.focus();
        if (e.select) e.select();
        var ok = false;
        try { ok = value === '' ? document.execCommand('delete') : document.execCommand('insertText', false, String(value)); } catch (err) { ok = false; }
        if (!ok && e.value !== String(value)) { nativeSet(e, 'value', String(value)); fire(e, 'input'); }
        fire(e, 'change');
        return e;
      },
      select: function (s, value) { var e = needEl(s); nativeSet(e, 'value', value); fire(e, 'input'); fire(e, 'change'); return e; },
      check: function (s, on) { var e = needEl(s); if (e.checked !== !!on) e.click(); return e; },
      press: function (s, key) {
        var e = needEl(s);
        e.focus();
        var init = { bubbles: true, cancelable: true, key: key, code: key };
        e.dispatchEvent(new KeyboardEvent('keydown', init));
        e.dispatchEvent(new KeyboardEvent('keyup', init));
        return e;
      },
      /** Submit through the browser's own validation. Returns { fired, valid }. */
      submit: function (s) {
        var f = needEl(s);
        var fired = false;
        var listener = function () { fired = true; };
        f.addEventListener('submit', listener, true);
        var valid = f.checkValidity();
        try { f.requestSubmit(); } catch (e) { /* not a form */ }
        f.removeEventListener('submit', listener, true);
        return { fired: fired, valid: valid };
      },
      labelText: function (s) {
        var e = needEl(s);
        var parts = [];
        if (e.id) Array.prototype.forEach.call(document.querySelectorAll('label[for="' + e.id + '"]'), function (l) { parts.push(norm(l.textContent)); });
        var wrap = e.closest('label');
        if (wrap) parts.push(norm(wrap.textContent));
        if (e.getAttribute('aria-label')) parts.push(norm(e.getAttribute('aria-label')));
        var by = e.getAttribute('aria-labelledby');
        if (by) by.split(/\s+/).forEach(function (id) { var t = document.getElementById(id); if (t) parts.push(norm(t.textContent)); });
        return parts.filter(Boolean).join(' ');
      },
      tick: tick,
      wait: tick,
      settle: settle,
      until: async function (fn, ms) {
        var limit = ms || 2000;
        for (var t = 0; t <= limit; t += 10) { if (fn()) return true; await tick(10); }
        return !!fn();
      },
      fail: function (msg) { throw new Error(msg); },
      assert: function (cond, msg) { if (!cond) throw new Error(msg || 'A check did not hold.'); },
      eq: function (a, b, msg) { if (canon(a) !== canon(b)) throw new Error((msg || 'Unexpected value') + ' (got ' + clip(show(a)) + ').'); },
      logs: state.logs,
      errors: state.errors,
      dialogs: state.dialogs,
      storage: window.localStorage,
      session: window.sessionStorage,
      api: {
        calls: state.server ? state.server.log : [],
        /** Read the CURRENT server data directly (parsed JSON) without going through fetch or leaving a log entry: for check expectations. */
        get: function (url) { var r = state.server.handle('GET', url, {}); state.server.log.pop(); return r.body ? JSON.parse(r.body) : null; },
        failNext: function (n, status) { state.failNext = { count: n === undefined ? 1 : n, status: status || 500 }; },
      },
    };
    return h;
  }

  /* ---------------------------------------------------------------- after the page has loaded */
  async function afterLoad() {
    send({ type: 'ready' });
    if (!cfg || !cfg.check) return;
    var result;
    var watchdog = nativeSetTimeout(function () { finish({ passed: false, message: 'The check took too long. Does your code wait for something that never happens, or loop forever?' }); }, cfg.check.timeoutMs || 5000);
    var finished = false;
    function finish(r) {
      if (finished) return;
      finished = true;
      nativeClearTimeout(watchdog);
      send({ type: 'result', passed: !!r.passed, message: clip(r.message || '') });
    }
    try {
      if (!cfg.check.errorsOk && state.errors.length) {
        finish({ passed: false, message: 'Your JavaScript threw an error: ' + state.errors[0] });
        return;
      }
      await realSleep(20); // let unhandled-rejection reports and other late page work arrive
      await tick(0);
      var h = makeHelpers();
      var s = document.createElement('script');
      s.textContent = 'window.__CQ_check = async function (h) {\n' + cfg.check.script + '\n};';
      document.documentElement.appendChild(s);
      var fn = window.__CQ_check;
      result = await fn(h);
      if (!cfg.check.errorsOk && state.errors.length) { finish({ passed: false, message: 'Your JavaScript threw an error: ' + state.errors[0] }); return; }
      finish({ passed: true, message: typeof result === 'string' ? result : '' });
    } catch (e) {
      finish({ passed: false, message: e && e.message ? e.message : String(e) });
    }
  }

  /* ---------------------------------------------------------------- entry point */
  window.addEventListener('message', function onMessage(e) {
    if (e.source !== window.parent || !e.data || e.data.cq !== 'run') return;
    window.removeEventListener('message', onMessage);
    cfg = e.data.config || {};
    cfg.files = e.data.files || { html: '', css: '', js: '' };
    cfg.mode = cfg.mode === 'grade' ? 'grade' : 'run';
    state.server = createApiServer(cfg.api || { collections: {}, latency: 20 });
    Object.keys(cfg.storage || {}).forEach(function (k) { window.localStorage.setItem(k, String(cfg.storage[k])); });
    var doc = buildDocument(cfg.files);
    document.open();
    document.write(doc);
    document.close();
  });
  lockdown();
  patchConsole();
  send({ type: 'hello' });
})();
