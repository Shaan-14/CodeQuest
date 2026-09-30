/**
 * CodeQuest's IN-GAME HTTP API: a deterministic, in-memory simulation of a REST/JSON service. It is a classic
 * script (no imports/exports) so the same text runs inside the web sandbox page (where it backs `fetch`) and
 * under Node in unit tests (evaluated with `new Function`). It never touches the real network.
 *
 * Endpoints (all under /api):
 *   GET    /api/<collection>            list; ?field=value filters, ?q=text search, ?sort=field or -field,
 *                                       ?limit=N&offset=N. Header X-Total-Count = matches before limit/offset.
 *   GET    /api/<collection>/<id>       one item, or 404
 *   POST   /api/<collection>            create (JSON body, Content-Type: application/json) -> 201 or 400/415
 *   PUT    /api/<collection>/<id>       replace -> 200 (404 if missing, 400 if invalid)
 *   PATCH  /api/<collection>/<id>       partial update
 *   DELETE /api/<collection>/<id>       -> 204
 *   GET    /api/private/<collection>    same as GET but needs `Authorization: Bearer codequest-key`, else 401
 *   GET    /api/flaky                   503 twice, then 200 (per server instance): for retry/error handling
 *   GET    /api/rate-limited            200 three times, then 429 with Retry-After
 *   GET    /api/slow                    like a normal 200 but with 400 ms latency
 * Anything else: 404 (unknown path) or 405 (method not allowed).
 */
function createApiServer(config) {
  var collections = {};
  var names = Object.keys(config.collections || {});
  for (var i = 0; i < names.length; i++) collections[names[i]] = JSON.parse(JSON.stringify(config.collections[names[i]]));
  var required = config.required || {};
  var nextId = {};
  Object.keys(collections).forEach(function (n) {
    nextId[n] = collections[n].reduce(function (m, r) { return Math.max(m, Number(r.id) || 0); }, 0) + 1;
  });
  var API_KEY = 'codequest-key';
  var counters = { flaky: 0, limited: 0 };
  var log = [];

  function json(status, body, extra) {
    var headers = { 'Content-Type': 'application/json' };
    for (var k in extra || {}) headers[k] = extra[k];
    return { status: status, headers: headers, body: body === undefined ? '' : JSON.stringify(body) };
  }
  function empty(status, extra) {
    var headers = {};
    for (var k in extra || {}) headers[k] = extra[k];
    return { status: status, headers: headers, body: '' };
  }
  function lower(headers) {
    var out = {};
    for (var k in headers || {}) out[String(k).toLowerCase()] = String(headers[k]);
    return out;
  }
  function parse(url) {
    var u = String(url).replace(/^https?:\/\/api\.codequest\.test/, '');
    var q = u.indexOf('?');
    var path = q === -1 ? u : u.slice(0, q);
    var query = {};
    if (q !== -1) {
      u.slice(q + 1).split('&').forEach(function (pair) {
        if (!pair) return;
        var eq = pair.indexOf('=');
        var key = decodeURIComponent((eq === -1 ? pair : pair.slice(0, eq)).replace(/\+/g, ' '));
        var val = eq === -1 ? '' : decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
        query[key] = val;
      });
    }
    return { path: path.replace(/\/+$/, ''), query: query };
  }
  function validate(coll, item) {
    var need = required[coll] || [];
    var missing = need.filter(function (f) { return item[f] === undefined || item[f] === null || item[f] === ''; });
    return missing;
  }
  function list(coll, query) {
    var rows = collections[coll].slice();
    Object.keys(query).forEach(function (k) {
      if (k === 'q' || k === 'sort' || k === 'limit' || k === 'offset') return;
      rows = rows.filter(function (r) { return String(r[k]) === query[k]; });
    });
    if (query.q) {
      var needle = query.q.toLowerCase();
      rows = rows.filter(function (r) { return String(r.name || r.title || '').toLowerCase().indexOf(needle) !== -1; });
    }
    var total = rows.length;
    if (query.sort) {
      var desc = query.sort.charAt(0) === '-';
      var field = desc ? query.sort.slice(1) : query.sort;
      rows.sort(function (a, b) {
        var x = a[field], y = b[field];
        var c = x < y ? -1 : x > y ? 1 : 0;
        if (c === 0) c = a.id < b.id ? -1 : 1;
        return desc ? -c : c;
      });
    }
    var off = Math.max(0, parseInt(query.offset || '0', 10) || 0);
    var lim = query.limit === undefined ? rows.length : Math.max(0, parseInt(query.limit, 10) || 0);
    return { rows: rows.slice(off, off + lim), total: total };
  }

  /** Handle one request synchronously. Returns { status, headers, body } (body is a JSON string). */
  function handle(method, url, options) {
    options = options || {};
    method = String(method || 'GET').toUpperCase();
    var headers = lower(options.headers);
    var p = parse(url);
    log.push({ method: method, path: p.path, query: p.query, headers: headers, body: options.body === undefined ? null : options.body });
    var parts = p.path.split('/').filter(Boolean);
    if (parts[0] !== 'api') return json(404, { error: 'Not found', path: p.path });
    var rest = parts.slice(1);

    if (rest[0] === 'flaky' && rest.length === 1) {
      if (method !== 'GET') return json(405, { error: 'Method not allowed' }, { Allow: 'GET' });
      counters.flaky++;
      return counters.flaky <= 2 ? json(503, { error: 'Service temporarily unavailable' }) : json(200, { ok: true, attempts: counters.flaky });
    }
    if (rest[0] === 'rate-limited' && rest.length === 1) {
      counters.limited++;
      return counters.limited <= 3 ? json(200, { ok: true, call: counters.limited }) : json(429, { error: 'Too many requests' }, { 'Retry-After': '2' });
    }
    if (rest[0] === 'slow' && rest.length === 1) return json(200, { ok: true });

    var isPrivate = rest[0] === 'private';
    if (isPrivate) {
      rest = rest.slice(1);
      if (headers.authorization !== 'Bearer ' + API_KEY) return json(401, { error: 'Missing or invalid API key' }, { 'WWW-Authenticate': 'Bearer' });
    }
    var coll = rest[0];
    if (!coll || !Object.prototype.hasOwnProperty.call(collections, coll)) return json(404, { error: 'Not found', path: p.path });
    var id = rest[1];
    if (rest.length > 2) return json(404, { error: 'Not found', path: p.path });

    if (id === undefined) {
      if (method === 'GET') {
        var r = list(coll, p.query);
        return json(200, r.rows, { 'X-Total-Count': String(r.total) });
      }
      if (method === 'POST') {
        if (isPrivate) return json(405, { error: 'Method not allowed' }, { Allow: 'GET' });
        if ((headers['content-type'] || '').indexOf('application/json') === -1) return json(415, { error: 'Send JSON with Content-Type: application/json' });
        var item;
        try { item = JSON.parse(options.body || ''); } catch (e) { return json(400, { error: 'Body is not valid JSON' }); }
        if (!item || typeof item !== 'object' || Array.isArray(item)) return json(400, { error: 'Body must be a JSON object' });
        var missing = validate(coll, item);
        if (missing.length) return json(400, { error: 'Missing required fields', fields: missing });
        item.id = nextId[coll]++;
        collections[coll].push(item);
        return json(201, item, { Location: '/api/' + coll + '/' + item.id });
      }
      return json(405, { error: 'Method not allowed' }, { Allow: isPrivate ? 'GET' : 'GET, POST' });
    }

    var idx = -1;
    for (var i2 = 0; i2 < collections[coll].length; i2++) if (String(collections[coll][i2].id) === String(id)) idx = i2;
    if (method === 'GET') return idx === -1 ? json(404, { error: coll + ' ' + id + ' not found' }) : json(200, collections[coll][idx]);
    if (isPrivate) return json(405, { error: 'Method not allowed' }, { Allow: 'GET' });
    if (method === 'DELETE') {
      if (idx === -1) return json(404, { error: coll + ' ' + id + ' not found' });
      collections[coll].splice(idx, 1);
      return empty(204);
    }
    if (method === 'PUT' || method === 'PATCH') {
      if (idx === -1) return json(404, { error: coll + ' ' + id + ' not found' });
      if ((headers['content-type'] || '').indexOf('application/json') === -1) return json(415, { error: 'Send JSON with Content-Type: application/json' });
      var patch;
      try { patch = JSON.parse(options.body || ''); } catch (e2) { return json(400, { error: 'Body is not valid JSON' }); }
      var merged = method === 'PATCH' ? Object.assign({}, collections[coll][idx], patch) : Object.assign({}, patch);
      merged.id = collections[coll][idx].id;
      var miss = validate(coll, merged);
      if (miss.length) return json(400, { error: 'Missing required fields', fields: miss });
      collections[coll][idx] = merged;
      return json(200, merged);
    }
    return json(405, { error: 'Method not allowed' }, { Allow: 'GET, PUT, PATCH, DELETE' });
  }

  return { handle: handle, log: log, collections: collections, latencyFor: function (url) { return /\/api\/slow/.test(String(url)) ? 400 : (config.latency === undefined ? 20 : config.latency); } };
}
