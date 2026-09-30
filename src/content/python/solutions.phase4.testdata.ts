/**
 * TEST-ONLY DATA (never imported by the app): reference solutions and plausible wrong attempts for the Phase 4 Python
 * and data-engineering lessons. Python source is written with String.raw so backslashes stay as written.
 */
const py = String.raw;

const validate = (name: string, fields: string, extra = '') => py`import math

def bad_fields(${name}):
    if not isinstance(${name}, dict):
        return ['record']
    bad = []
${fields}
    return sorted(bad)
${extra}`;

const num = (key: string, lo: number, hi: number, i = 'v') => py`    ${i} = r.get('${key}')
    if isinstance(${i}, bool) or not isinstance(${i}, (int, float)) or not math.isfinite(${i}) or not ${lo} <= ${i} <= ${hi}:
        bad.append('${key}')`;


/** Builds a logging solution; `tweak` lets each wrong attempt break exactly one thing. */
type LogSpec = { fn: string; arg: string; key: string; field: string; good: string; okLevel: string; badLevel: string; okMsg: string; badMsg: string; sumMsg: string };
const logSolution = (sp: LogSpec, tweak: { level?: boolean; leak?: boolean; format?: boolean; boolOk?: boolean; useBadIfMissing?: boolean; noSummaryWhenEmpty?: boolean; printInstead?: boolean } = {}) => py`import logging

def ${sp.fn}(${sp.arg}, log_path):
    log = logging.getLogger('job-${sp.fn}')
${tweak.level ? '' : '    log.setLevel(logging.INFO)\n'}    log.propagate = False
    handler = logging.FileHandler(log_path)
${tweak.format ? '' : "    handler.setFormatter(logging.Formatter('%(levelname)s %(message)s'))\n"}    log.addHandler(handler)
    good = bad = 0
    try:
        for r in ${sp.arg}:
            v = r.get('${sp.field}')
            if isinstance(v, (int, float)) and ${tweak.boolOk ? 'True' : 'not isinstance(v, bool)'} and ${sp.good}:
                log.${sp.okLevel}('${sp.okMsg}', r.get('${sp.key}'))
                good += 1
            else:
                log.${sp.badLevel}('${sp.badMsg}', r.get('${sp.key}'))
                bad += 1
        ${tweak.noSummaryWhenEmpty ? 'if good + bad:\n            ' : ''}log.info('${sp.sumMsg}', good, bad)
    finally:
        ${tweak.leak ? 'pass' : 'log.removeHandler(handler)\n        handler.close()'}
    return good, bad
`;

const READ: LogSpec = { fn: 'process', arg: 'readings', key: 'id', field: 'value', good: 'v >= 0', okLevel: 'info', badLevel: 'warning', okMsg: 'ok id=%s', badMsg: 'rejected id=%s', sumMsg: 'done ok=%d rejected=%d' };
const SHIP: LogSpec = { fn: 'ship_batch', arg: 'parcels', key: 'id', field: 'weight', good: 'v > 0', okLevel: 'info', badLevel: 'error', okMsg: 'shipped id=%s', badMsg: 'bad-weight id=%s', sumMsg: 'finished shipped=%d failed=%d' };
const GRADE: LogSpec = { fn: 'import_grades', arg: 'rows', key: 'student', field: 'score', good: '0 <= v <= 100', okLevel: 'info', badLevel: 'error', okMsg: 'saved student=%s', badMsg: 'invalid student=%s', sumMsg: 'complete saved=%d invalid=%d' };
const logSet = (sp: LogSpec) => ({
  valid: [logSolution(sp)],
  wrong: [
    logSolution(sp, { level: true }), // INFO lines are dropped: the default level is WARNING
    logSolution(sp, { leak: true }), // the handler is never removed, so the next run repeats every line
    logSolution(sp, { format: true }), // the default format has the logger name in it
    logSolution(sp, { boolOk: true }), // True counts as a number
    logSolution(sp, { noSummaryWhenEmpty: true }), // no summary for an empty batch
  ],
});

/** Builds a load-with-quarantine solution. `tweak` breaks exactly one behaviour for the wrong attempts. */
type LoadSpec = { fn: string; table: string; textCol: string; numCol: string; badText: string; badNum: string };
type LoadTweak = { appendRejects?: boolean; plainInsert?: boolean; noHeader?: boolean; countHeader?: boolean; acceptNan?: boolean; skipCleanFile?: boolean; reasonOrder?: boolean; noStrip?: boolean; dropSilently?: boolean };
const loadSolution = (sp: LoadSpec, t: LoadTweak = {}) => {
  const numBlock = (indent: string) => [`if reason is None:`, `    try:`, `        v = float(get('${sp.numCol}'))`, `        if ${t.acceptNan ? 'v <= 0' : 'not math.isfinite(v) or v <= 0'}:`, `            reason = '${sp.badNum}'`, `    except ValueError:`, `        reason = '${sp.badNum}'`].map((l) => indent + l).join('\n');
  const textBlock = (indent: string) => [`if reason is None and not get('${sp.textCol}'):`, `    reason = '${sp.badText}'`].map((l) => indent + l).join('\n');
  const I = '            ';
  const textFirst = (textBlock(I) + '\n' + numBlock(I)).trimStart();
  const numFirst = (numBlock(I) + '\n' + textBlock(I)).trimStart();
  return py`import csv, math, sqlite3

def ${sp.fn}(csv_path, db_path, reject_path):
    con = sqlite3.connect(db_path)
    con.execute('CREATE TABLE IF NOT EXISTS ${sp.table} (id INTEGER PRIMARY KEY, ${sp.textCol} TEXT, ${sp.numCol} REAL)')
    rejects = []
    loaded = 0
    with open(csv_path, newline='') as f:
        for n, row in enumerate(csv.DictReader(f), start=${t.countHeader ? 2 : 1}):
            get = lambda k: ${t.noStrip ? "(row.get(k) or '')" : "(row.get(k) or '').strip()"}
            reason = None
            try:
                rid = int(get('id'))
                if rid <= 0:
                    reason = 'bad-id'
            except ValueError:
                reason = 'bad-id'
            ${t.reasonOrder ? numFirst : textFirst}
            if reason:
                ${t.dropSilently ? 'pass' : 'rejects.append((n, reason))'}
                continue
            con.execute('${t.plainInsert ? 'INSERT' : 'INSERT OR REPLACE'} INTO ${sp.table} VALUES (?, ?, ?)', (rid, get('${sp.textCol}'), v))
            loaded += 1
    con.commit()
    con.close()
    ${t.skipCleanFile ? 'if rejects:\n        ' : ''}with open(reject_path, '${t.appendRejects ? 'a' : 'w'}', newline='') as out:
        w = csv.writer(out)
        ${t.noHeader ? 'pass' : "w.writerow(['line', 'reason'])"}
        w.writerows(rejects)
    return loaded
`;
};
const PAY: LoadSpec = { fn: 'load_payments', table: 'payments', textCol: 'payer', numCol: 'amount', badText: 'blank-payer', badNum: 'bad-amount' };
const SHIP2: LoadSpec = { fn: 'load_shipments', table: 'shipments', textCol: 'dest', numCol: 'kg', badText: 'blank-dest', badNum: 'bad-kg' };
const loadSet = (sp: LoadSpec) => ({
  valid: [loadSolution(sp)],
  wrong: [
    loadSolution(sp, { appendRejects: true }), // the reject file grows on every run
    loadSolution(sp, { plainInsert: true }), // a second run crashes on the primary key
    loadSolution(sp, { noHeader: true }),
    loadSolution(sp, { countHeader: true }), // line numbers start at 2
    loadSolution(sp, { acceptNan: true }),
    loadSolution(sp, { skipCleanFile: true }),
    loadSolution(sp, { reasonOrder: true }), // tests the amount before the text
    loadSolution(sp, { noStrip: true }),
    loadSolution(sp, { dropSilently: true }), // bad rows vanish without a record
  ],
});

type SyncSpec = { fn: string; table: string; valCol: string };
type SyncTweak = { noState?: boolean; gte?: boolean; markBeforeStore?: boolean; countAll?: boolean; badAdvances?: boolean; resetOnEmpty?: boolean; overwriteStale?: boolean; crashOnBad?: boolean };
const syncSolution = (sp: SyncSpec, t: SyncTweak = {}) => {
  const I = '            ';
  const parseCrash = [`rid = int(r['id'])`, `val = float(r['${sp.valCol}'])`].join('\n' + I);
  const parseSafe = [`try:`, `    rid = int(r['id'])`, `    val = float(r['${sp.valCol}'])`, `except (ValueError, TypeError):`, ...(t.badAdvances ? [`    newest = max(newest, (r.get('updated') or '').strip())`] : []), `    continue`].join('\n' + I);
  return py`import csv, sqlite3

def ${sp.fn}(csv_path, db_path):
    con = sqlite3.connect(db_path)
    con.execute('CREATE TABLE IF NOT EXISTS ${sp.table} (id INTEGER PRIMARY KEY, updated TEXT, ${sp.valCol} REAL)')
    con.execute('CREATE TABLE IF NOT EXISTS sync_state (name TEXT PRIMARY KEY, watermark TEXT)')
    row = ${t.noState ? 'None' : `con.execute("SELECT watermark FROM sync_state WHERE name = '${sp.table}'").fetchone()`}
    mark = row[0] if row else ''
    fresh = []
    newest = mark
    with open(csv_path, newline='') as f:
        for r in csv.DictReader(f):
            ${t.crashOnBad ? parseCrash : parseSafe}
            upd = (r.get('updated') or '').strip()
            if not upd or upd ${t.gte ? '<' : '<='} mark:
                continue
            fresh.append((rid, upd, val))
    ${t.markBeforeStore ? "" : ''}for rid, upd, val in fresh:
        con.execute('${t.overwriteStale ? 'INSERT OR REPLACE' : 'INSERT OR REPLACE'} INTO ${sp.table} VALUES (?, ?, ?)', (rid, upd, val))
    ${t.resetOnEmpty ? "newest = max([u for _, u, _ in fresh], default='')" : "newest = max([newest] + [u for _, u, _ in fresh])"}
    ${t.noState ? '' : `con.execute("INSERT OR REPLACE INTO sync_state VALUES ('${sp.table}', ?)", (newest,))`}
    con.commit()
    con.close()
    return ${t.countAll ? 'len(list(csv.DictReader(open(csv_path, newline=""))))' : 'len(fresh)'}
`;
};
const EV: SyncSpec = { fn: 'sync_events', table: 'events', valCol: 'value' };
const OR: SyncSpec = { fn: 'sync_orders', table: 'orders', valCol: 'total' };
const syncSet = (sp: SyncSpec) => ({
  valid: [syncSolution(sp)],
  wrong: [
    syncSolution(sp, { noState: true }), // forgets how far it got: every rerun reprocesses everything
    syncSolution(sp, { gte: true }), // a row at the marker time is applied again
    syncSolution(sp, { countAll: true }), // reports rows read, not rows applied
    syncSolution(sp, { badAdvances: true }), // skipped rows move the marker
    syncSolution(sp, { resetOnEmpty: true }), // an empty file forgets the marker
    syncSolution(sp, { crashOnBad: true }), // one bad row stops the run
  ],
});

export const solutionsPhase4Python: Record<string, { valid: string[]; wrong: string[] }> = {
  'de-04-validate-reading': {
    valid: [
      validate('r', py`    i = r.get('id')
    if not isinstance(i, int) or isinstance(i, bool) or i <= 0:
        bad.append('id')
    s = r.get('sensor')
    if not isinstance(s, str) or not s.strip():
        bad.append('sensor')
${num('value', -50, 150)}
    if r.get('unit') not in ('C', 'F'):
        bad.append('unit')`),
    ],
    wrong: [
      // bool passes as an id
      validate('r', py`    i = r.get('id')
    if not isinstance(i, int) or i <= 0:
        bad.append('id')
    s = r.get('sensor')
    if not isinstance(s, str) or not s.strip():
        bad.append('sensor')
${num('value', -50, 150)}
    if r.get('unit') not in ('C', 'F'):
        bad.append('unit')`),
      // exclusive upper bound
      validate('r', py`    i = r.get('id')
    if not isinstance(i, int) or isinstance(i, bool) or i <= 0:
        bad.append('id')
    s = r.get('sensor')
    if not isinstance(s, str) or not s.strip():
        bad.append('sensor')
    v = r.get('value')
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or not -50 <= v < 150:
        bad.append('value')
    if r.get('unit') not in ('C', 'F'):
        bad.append('unit')`),
      // crashes on a missing key
      py`import math

def bad_fields(r):
    if not isinstance(r, dict):
        return ['record']
    bad = []
    if not isinstance(r['id'], int) or r['id'] <= 0:
        bad.append('id')
    if not r['sensor'].strip():
        bad.append('sensor')
    if not -50 <= r['value'] <= 150:
        bad.append('value')
    if r['unit'] not in ('C', 'F'):
        bad.append('unit')
    return sorted(bad)
`,
      // nan and inf pass (no isfinite)
      py`def bad_fields(r):
    if not isinstance(r, dict):
        return ['record']
    bad = []
    i = r.get('id')
    if not isinstance(i, int) or isinstance(i, bool) or i <= 0:
        bad.append('id')
    s = r.get('sensor')
    if not isinstance(s, str) or not s.strip():
        bad.append('sensor')
    v = r.get('value')
    if isinstance(v, bool) or not isinstance(v, (int, float)) or v < -50 or v > 150 and False:
        bad.append('value')
    if r.get('unit') not in ('C', 'F'):
        bad.append('unit')
    return sorted(bad)
`,
      // stops at the first problem
      py`import math

def bad_fields(r):
    if not isinstance(r, dict):
        return ['record']
    i = r.get('id')
    if not isinstance(i, int) or isinstance(i, bool) or i <= 0:
        return ['id']
    s = r.get('sensor')
    if not isinstance(s, str) or not s.strip():
        return ['sensor']
    v = r.get('value')
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or not -50 <= v <= 150:
        return ['value']
    if r.get('unit') not in ('C', 'F'):
        return ['unit']
    return []
`,
    ],
  },
  'de-04-validate-order': {
    valid: [
      py`def bad_fields(o):
    if not isinstance(o, dict):
        return ['record']
    bad = []
    i = o.get('id')
    if not isinstance(i, int) or isinstance(i, bool) or i <= 0:
        bad.append('id')
    c = o.get('customer')
    if not isinstance(c, str) or not c.strip():
        bad.append('customer')
    q = o.get('qty')
    if not isinstance(q, int) or isinstance(q, bool) or not 1 <= q <= 100:
        bad.append('qty')
    if o.get('status') not in ('new', 'paid', 'shipped'):
        bad.append('status')
    return sorted(bad)
`,
    ],
    wrong: [
      py`def bad_fields(o):
    if not isinstance(o, dict):
        return ['record']
    bad = []
    i = o.get('id')
    if not isinstance(i, int) or isinstance(i, bool) or i <= 0:
        bad.append('id')
    c = o.get('customer')
    if not isinstance(c, str) or not c.strip():
        bad.append('customer')
    q = o.get('qty')
    if not isinstance(q, int) or not 1 <= q <= 100:
        bad.append('qty')
    if o.get('status') not in ('new', 'paid', 'shipped'):
        bad.append('status')
    return sorted(bad)
`,
      py`def bad_fields(o):
    if not isinstance(o, dict):
        return ['record']
    bad = []
    i = o.get('id')
    if not isinstance(i, int) or isinstance(i, bool) or i <= 0:
        bad.append('id')
    c = o.get('customer')
    if not isinstance(c, str) or c == '':
        bad.append('customer')
    q = o.get('qty')
    if not isinstance(q, int) or isinstance(q, bool) or not 1 <= q < 100:
        bad.append('qty')
    if o.get('status') not in ('new', 'paid', 'shipped'):
        bad.append('status')
    return sorted(bad)
`,
      py`def bad_fields(o):
    bad = []
    if o.get('id', 0) <= 0:
        bad.append('id')
    if not o.get('customer', '').strip():
        bad.append('customer')
    if not 1 <= o.get('qty', 0) <= 100:
        bad.append('qty')
    if o.get('status') not in ('new', 'paid', 'shipped'):
        bad.append('status')
    return sorted(bad)
`,
      py`def bad_fields(o):
    if not isinstance(o, dict):
        return ['record']
    bad = []
    i = o.get('id')
    if not isinstance(i, int) or isinstance(i, bool) or i <= 0:
        bad.append('id')
    c = o.get('customer')
    if not isinstance(c, str) or not c.strip():
        bad.append('customer')
    q = o.get('qty')
    if not isinstance(q, int) or isinstance(q, bool) or not 1 <= q <= 100:
        bad.append('qty')
    if str(o.get('status')).lower() not in ('new', 'paid', 'shipped'):
        bad.append('status')
    return sorted(bad)
`,
    ],
  },
  'de-04-validate-patient': {
    valid: [
      py`import math

def bad_fields(r):
    if not isinstance(r, dict):
        return ['record']
    bad = []
    m = r.get('mrn')
    if not isinstance(m, str) or len(m) != 6 or not all(ch in '0123456789' for ch in m):
        bad.append('mrn')
    a = r.get('age')
    if not isinstance(a, int) or isinstance(a, bool) or not 0 <= a <= 120:
        bad.append('age')
    if r.get('ward') not in ('A', 'B', 'C'):
        bad.append('ward')
${num('temp_c', 30, 45, 't')}
    return sorted(bad)
`,
    ],
    wrong: [
      // isdigit accepts non-ASCII digits and is fine, but this one forgets the length
      py`import math

def bad_fields(r):
    if not isinstance(r, dict):
        return ['record']
    bad = []
    m = r.get('mrn')
    if not isinstance(m, str) or not m.isdigit():
        bad.append('mrn')
    a = r.get('age')
    if not isinstance(a, int) or isinstance(a, bool) or not 0 <= a <= 120:
        bad.append('age')
    if r.get('ward') not in ('A', 'B', 'C'):
        bad.append('ward')
    t = r.get('temp_c')
    if isinstance(t, bool) or not isinstance(t, (int, float)) or not math.isfinite(t) or not 30 <= t <= 45:
        bad.append('temp_c')
    return sorted(bad)
`,
      // a float age is accepted
      py`import math

def bad_fields(r):
    if not isinstance(r, dict):
        return ['record']
    bad = []
    m = r.get('mrn')
    if not isinstance(m, str) or len(m) != 6 or not m.isdigit():
        bad.append('mrn')
    a = r.get('age')
    if isinstance(a, bool) or not isinstance(a, (int, float)) or not 0 <= a <= 120:
        bad.append('age')
    if r.get('ward') not in ('A', 'B', 'C'):
        bad.append('ward')
    t = r.get('temp_c')
    if isinstance(t, bool) or not isinstance(t, (int, float)) or not math.isfinite(t) or not 30 <= t <= 45:
        bad.append('temp_c')
    return sorted(bad)
`,
      // exclusive temperature bounds
      py`import math

def bad_fields(r):
    if not isinstance(r, dict):
        return ['record']
    bad = []
    m = r.get('mrn')
    if not isinstance(m, str) or len(m) != 6 or not m.isdigit():
        bad.append('mrn')
    a = r.get('age')
    if not isinstance(a, int) or isinstance(a, bool) or not 0 <= a <= 120:
        bad.append('age')
    if r.get('ward') not in ('A', 'B', 'C'):
        bad.append('ward')
    t = r.get('temp_c')
    if isinstance(t, bool) or not isinstance(t, (int, float)) or not math.isfinite(t) or not 30 < t < 45:
        bad.append('temp_c')
    return sorted(bad)
`,
      // nan passes the temperature
      py`def bad_fields(r):
    if not isinstance(r, dict):
        return ['record']
    bad = []
    m = r.get('mrn')
    if not isinstance(m, str) or len(m) != 6 or not m.isdigit():
        bad.append('mrn')
    a = r.get('age')
    if not isinstance(a, int) or isinstance(a, bool) or not 0 <= a <= 120:
        bad.append('age')
    if r.get('ward') not in ('A', 'B', 'C'):
        bad.append('ward')
    t = r.get('temp_c')
    if isinstance(t, bool) or not isinstance(t, (int, float)) or t < 30 or t > 45 and t == t:
        bad.append('temp_c')
    return sorted(bad)
`,
    ],
  },
  'de-05-profile-feed': {
    valid: [
      py`import csv

def profile(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        for row in reader:
            rows += 1
            for c in cols:
                v = row.get(c)
                if v is None or not v.strip():
                    missing[c] += 1
    return {'rows': rows, 'missing': missing}
`,
      py`import csv

def profile(path):
    with open(path, newline='') as f:
        lines = list(csv.reader(f))
    cols = lines[0]
    data = lines[1:]
    missing = {}
    for i, c in enumerate(cols):
        missing[c] = sum(1 for r in data if i >= len(r) or not r[i].strip())
    return {'rows': len(data), 'missing': missing}
`,
    ],
    wrong: [
      // whitespace is not blank
      py`import csv

def profile(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames
        missing = {c: 0 for c in cols}
        rows = 0
        for row in reader:
            rows += 1
            for c in cols:
                if not row.get(c):
                    missing[c] += 1
    return {'rows': rows, 'missing': missing}
`,
      // counts the header as a row
      py`import csv

def profile(path):
    with open(path, newline='') as f:
        lines = list(csv.reader(f))
    cols = lines[0]
    missing = {c: 0 for c in cols}
    for r in lines[1:]:
        for i, c in enumerate(cols):
            if i >= len(r) or not r[i].strip():
                missing[c] += 1
    return {'rows': len(lines), 'missing': missing}
`,
      // columns with no blanks are left out
      py`import csv

def profile(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        missing = {}
        rows = 0
        for row in reader:
            rows += 1
            for c, v in row.items():
                if v is None or not v.strip():
                    missing[c] = missing.get(c, 0) + 1
    return {'rows': rows, 'missing': missing}
`,
      // crashes on a short row
      py`import csv

def profile(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames
        missing = {c: 0 for c in cols}
        rows = 0
        for row in reader:
            rows += 1
            for c in cols:
                if row[c].strip() == '':
                    missing[c] += 1
    return {'rows': rows, 'missing': missing}
`,
    ],
  },
  'de-05-audit-inventory': {
    valid: [
      py`import csv

def audit_inventory(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        seen = {}
        flagged = 0
        for row in reader:
            rows += 1
            for c in cols:
                v = row.get(c)
                if v is None or not v.strip():
                    missing[c] += 1
            key = (row.get('sku') or '').strip()
            if key:
                seen[key] = seen.get(key, 0) + 1
            try:
                if float(row.get('qty') or '') < 0:
                    flagged += 1
            except ValueError:
                pass
    return {'rows': rows, 'missing': missing, 'duplicate_keys': sorted(k for k, n in seen.items() if n > 1), 'flagged': flagged}
`,
    ],
    wrong: [
      // keys are not trimmed
      py`import csv

def audit_inventory(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        seen = {}
        flagged = 0
        for row in reader:
            rows += 1
            for c in cols:
                v = row.get(c)
                if v is None or not v.strip():
                    missing[c] += 1
            key = row.get('sku') or ''
            if key.strip():
                seen[key] = seen.get(key, 0) + 1
            try:
                if float(row.get('qty') or '') < 0:
                    flagged += 1
            except ValueError:
                pass
    return {'rows': rows, 'missing': missing, 'duplicate_keys': sorted(k for k, n in seen.items() if n > 1), 'flagged': flagged}
`,
      // blank keys count as duplicates
      py`import csv

def audit_inventory(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        seen = {}
        flagged = 0
        for row in reader:
            rows += 1
            for c in cols:
                v = row.get(c)
                if v is None or not v.strip():
                    missing[c] += 1
            key = (row.get('sku') or '').strip()
            seen[key] = seen.get(key, 0) + 1
            try:
                if float(row.get('qty') or '') < 0:
                    flagged += 1
            except ValueError:
                pass
    return {'rows': rows, 'missing': missing, 'duplicate_keys': sorted(k for k, n in seen.items() if n > 1), 'flagged': flagged}
`,
      // zero is flagged (<= 0)
      py`import csv

def audit_inventory(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        seen = {}
        flagged = 0
        for row in reader:
            rows += 1
            for c in cols:
                v = row.get(c)
                if v is None or not v.strip():
                    missing[c] += 1
            key = (row.get('sku') or '').strip()
            if key:
                seen[key] = seen.get(key, 0) + 1
            try:
                if float(row.get('qty') or '') <= 0:
                    flagged += 1
            except ValueError:
                pass
    return {'rows': rows, 'missing': missing, 'duplicate_keys': sorted(k for k, n in seen.items() if n > 1), 'flagged': flagged}
`,
      // crashes on a non-numeric qty
      py`import csv

def audit_inventory(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        seen = {}
        flagged = 0
        for row in reader:
            rows += 1
            for c in cols:
                v = row.get(c)
                if v is None or not v.strip():
                    missing[c] += 1
            key = (row.get('sku') or '').strip()
            if key:
                seen[key] = seen.get(key, 0) + 1
            if row.get('qty') and float(row['qty']) < 0:
                flagged += 1
    return {'rows': rows, 'missing': missing, 'duplicate_keys': sorted(k for k, n in seen.items() if n > 1), 'flagged': flagged}
`,
      // returns the repeated keys once per extra row, unsorted
      py`import csv

def audit_inventory(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        seen = set()
        dups = []
        flagged = 0
        for row in reader:
            rows += 1
            for c in cols:
                v = row.get(c)
                if v is None or not v.strip():
                    missing[c] += 1
            key = (row.get('sku') or '').strip()
            if key:
                if key in seen:
                    dups.append(key)
                seen.add(key)
            try:
                if float(row.get('qty') or '') < 0:
                    flagged += 1
            except ValueError:
                pass
    return {'rows': rows, 'missing': missing, 'duplicate_keys': dups, 'flagged': flagged}
`,
    ],
  },
  'de-05-audit-visits': {
    valid: [
      py`import csv

def audit_visits(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        seen = {}
        flagged = 0
        for row in reader:
            rows += 1
            for c in cols:
                v = row.get(c)
                if v is None or not v.strip():
                    missing[c] += 1
            key = (row.get('visit_id') or '').strip()
            if key:
                seen[key] = seen.get(key, 0) + 1
            try:
                if float(row.get('minutes') or '') > 240:
                    flagged += 1
            except ValueError:
                pass
    return {'rows': rows, 'missing': missing, 'duplicate_keys': sorted(k for k, n in seen.items() if n > 1), 'flagged': flagged}
`,
    ],
    wrong: [
      // >= 240
      py`import csv

def audit_visits(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        seen = {}
        flagged = 0
        for row in reader:
            rows += 1
            for c in cols:
                v = row.get(c)
                if v is None or not v.strip():
                    missing[c] += 1
            key = (row.get('visit_id') or '').strip()
            if key:
                seen[key] = seen.get(key, 0) + 1
            try:
                if float(row.get('minutes') or '') >= 240:
                    flagged += 1
            except ValueError:
                pass
    return {'rows': rows, 'missing': missing, 'duplicate_keys': sorted(k for k, n in seen.items() if n > 1), 'flagged': flagged}
`,
      // spaces do not count as missing
      py`import csv

def audit_visits(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        seen = {}
        flagged = 0
        for row in reader:
            rows += 1
            for c in cols:
                if not row.get(c):
                    missing[c] += 1
            key = (row.get('visit_id') or '').strip()
            if key:
                seen[key] = seen.get(key, 0) + 1
            try:
                if float(row.get('minutes') or '') > 240:
                    flagged += 1
            except ValueError:
                pass
    return {'rows': rows, 'missing': missing, 'duplicate_keys': sorted(k for k, n in seen.items() if n > 1), 'flagged': flagged}
`,
      // duplicates counted among blank ids too
      py`import csv

def audit_visits(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        seen = {}
        flagged = 0
        for row in reader:
            rows += 1
            for c in cols:
                v = row.get(c)
                if v is None or not v.strip():
                    missing[c] += 1
            key = (row.get('visit_id') or '').strip()
            seen[key] = seen.get(key, 0) + 1
            try:
                if float(row.get('minutes') or '') > 240:
                    flagged += 1
            except ValueError:
                pass
    return {'rows': rows, 'missing': missing, 'duplicate_keys': sorted(k for k, n in seen.items() if n > 1), 'flagged': flagged}
`,
      // text minutes crash
      py`import csv

def audit_visits(path):
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        missing = {c: 0 for c in cols}
        rows = 0
        seen = {}
        flagged = 0
        for row in reader:
            rows += 1
            for c in cols:
                v = row.get(c)
                if v is None or not v.strip():
                    missing[c] += 1
            key = (row.get('visit_id') or '').strip()
            if key:
                seen[key] = seen.get(key, 0) + 1
            if (row.get('minutes') or '').strip() and float(row['minutes']) > 240:
                flagged += 1
    return {'rows': rows, 'missing': missing, 'duplicate_keys': sorted(k for k, n in seen.items() if n > 1), 'flagged': flagged}
`,
    ],
  },
  'de-06-process-readings': logSet(READ),
  'de-06-ship-batch': logSet(SHIP),
  'de-06-import-grades': logSet(GRADE),
  'de-07-retry': {
    valid: [
      py`def call_with_retry(fn, attempts):
    last = None
    for _ in range(attempts):
        try:
            return fn()
        except (ConnectionError, TimeoutError) as e:
            last = e
    raise last
`,
      py`def call_with_retry(fn, attempts):
    n = 0
    while True:
        n += 1
        try:
            return fn()
        except (ConnectionError, TimeoutError):
            if n >= attempts:
                raise
`,
    ],
    wrong: [
      // retries every exception
      py`def call_with_retry(fn, attempts):
    last = None
    for _ in range(attempts):
        try:
            return fn()
        except Exception as e:
            last = e
    raise last
`,
      // returns None after giving up
      py`def call_with_retry(fn, attempts):
    for _ in range(attempts):
        try:
            return fn()
        except (ConnectionError, TimeoutError):
            pass
    return None
`,
      // one attempt too many
      py`def call_with_retry(fn, attempts):
    last = None
    for _ in range(attempts + 1):
        try:
            return fn()
        except (ConnectionError, TimeoutError) as e:
            last = e
    raise last
`,
      // one attempt too few
      py`def call_with_retry(fn, attempts):
    last = None
    for _ in range(attempts - 1):
        try:
            return fn()
        except (ConnectionError, TimeoutError) as e:
            last = e
    raise last
`,
      // raises the first error instead of the last
      py`def call_with_retry(fn, attempts):
    first = None
    for _ in range(attempts):
        try:
            return fn()
        except (ConnectionError, TimeoutError) as e:
            if first is None:
                first = e
    raise first
`,
      // never retries
      py`def call_with_retry(fn, attempts):
    return fn()
`,
    ],
  },
  'de-07-load-payments': loadSet(PAY),
  'de-07-load-shipments': loadSet(SHIP2),
  'de-08-new-rows': {
    valid: [
      py`def new_rows(rows, watermark):
    mark = watermark if watermark is not None else ''
    fresh = [r for r in rows if r['updated'] > mark]
    if fresh:
        return fresh, max(r['updated'] for r in fresh)
    return [], watermark
`,
      py`def new_rows(rows, watermark):
    fresh = []
    newest = watermark
    for r in rows:
        if watermark is None or r['updated'] > watermark:
            fresh.append(r)
            if newest is None or r['updated'] > newest:
                newest = r['updated']
    return fresh, newest
`,
    ],
    wrong: [
      // >= includes the row at the watermark
      py`def new_rows(rows, watermark):
    mark = watermark if watermark is not None else ''
    fresh = [r for r in rows if r['updated'] >= mark]
    if fresh:
        return fresh, max(r['updated'] for r in fresh)
    return [], watermark
`,
      // the marker is the last row, not the newest
      py`def new_rows(rows, watermark):
    mark = watermark if watermark is not None else ''
    fresh = [r for r in rows if r['updated'] > mark]
    if fresh:
        return fresh, fresh[-1]['updated']
    return [], watermark
`,
      // None marker crashes
      py`def new_rows(rows, watermark):
    fresh = [r for r in rows if r['updated'] > watermark]
    if fresh:
        return fresh, max(r['updated'] for r in fresh)
    return [], watermark
`,
      // sorts, so the original order is lost, and mutates the input
      py`def new_rows(rows, watermark):
    mark = watermark if watermark is not None else ''
    rows.sort(key=lambda r: r['updated'])
    fresh = [r for r in rows if r['updated'] > mark]
    if fresh:
        return fresh, fresh[-1]['updated']
    return [], watermark
`,
      // forgets the marker when nothing is new
      py`def new_rows(rows, watermark):
    mark = watermark if watermark is not None else ''
    fresh = [r for r in rows if r['updated'] > mark]
    return fresh, max([r['updated'] for r in fresh], default=None)
`,
    ],
  },
  'de-08-sync-events': syncSet(EV),
  'de-08-sync-orders': syncSet(OR),
  'de-09-summary-file': {
    valid: [
      py`import csv, json, math

def write_summary(csv_path, out_path):
    rows = []
    with open(csv_path, newline='') as f:
        for r in csv.DictReader(f):
            try:
                v = float(r['amount'])
            except (ValueError, TypeError, KeyError):
                continue
            if math.isfinite(v):
                rows.append((r['label'], v))
    total = sum(v for _, v in rows)
    report = {'count': len(rows), 'total': round(total, 2), 'average': round(total / len(rows), 2) if rows else None, 'largest': max(rows, key=lambda p: p[1])[0] if rows else None}
    with open(out_path, 'w') as f:
        json.dump(report, f)
`,
    ],
    wrong: [
      // no isfinite: nan/inf slip in
      py`import csv, json

def write_summary(csv_path, out_path):
    rows = []
    with open(csv_path, newline='') as f:
        for r in csv.DictReader(f):
            try:
                rows.append((r['label'], float(r['amount'])))
            except ValueError:
                continue
    total = sum(v for _, v in rows)
    report = {'count': len(rows), 'total': round(total, 2), 'average': round(total / len(rows), 2) if rows else None, 'largest': max(rows, key=lambda p: p[1])[0] if rows else None}
    with open(out_path, 'w') as f:
        json.dump(report, f)
`,
      // divides by zero on an empty file
      py`import csv, json, math

def write_summary(csv_path, out_path):
    rows = []
    with open(csv_path, newline='') as f:
        for r in csv.DictReader(f):
            try:
                v = float(r['amount'])
            except ValueError:
                continue
            if math.isfinite(v):
                rows.append((r['label'], v))
    total = sum(v for _, v in rows)
    report = {'count': len(rows), 'total': round(total, 2), 'average': round(total / len(rows), 2), 'largest': max(rows, key=lambda p: p[1])[0]}
    with open(out_path, 'w') as f:
        json.dump(report, f)
`,
      // the last of equal amounts wins
      py`import csv, json, math

def write_summary(csv_path, out_path):
    rows = []
    with open(csv_path, newline='') as f:
        for r in csv.DictReader(f):
            try:
                v = float(r['amount'])
            except ValueError:
                continue
            if math.isfinite(v):
                rows.append((r['label'], v))
    total = sum(v for _, v in rows)
    best = None
    for label, v in rows:
        if best is None or v >= best[1]:
            best = (label, v)
    report = {'count': len(rows), 'total': round(total, 2), 'average': round(total / len(rows), 2) if rows else None, 'largest': best[0] if best else None}
    with open(out_path, 'w') as f:
        json.dump(report, f)
`,
      // negative amounts are dropped
      py`import csv, json, math

def write_summary(csv_path, out_path):
    rows = []
    with open(csv_path, newline='') as f:
        for r in csv.DictReader(f):
            try:
                v = float(r['amount'])
            except ValueError:
                continue
            if math.isfinite(v) and v >= 0:
                rows.append((r['label'], v))
    total = sum(v for _, v in rows)
    report = {'count': len(rows), 'total': round(total, 2), 'average': round(total / len(rows), 2) if rows else None, 'largest': max(rows, key=lambda p: p[1])[0] if rows else None}
    with open(out_path, 'w') as f:
        json.dump(report, f)
`,
      // appends instead of replacing, and does not round the total
      py`import csv, json, math

def write_summary(csv_path, out_path):
    rows = []
    with open(csv_path, newline='') as f:
        for r in csv.DictReader(f):
            try:
                v = float(r['amount'])
            except ValueError:
                continue
            if math.isfinite(v):
                rows.append((r['label'], v))
    total = sum(v for _, v in rows)
    report = {'count': len(rows), 'total': total, 'average': round(total / len(rows), 2) if rows else None, 'largest': max(rows, key=lambda p: p[1])[0] if rows else None}
    with open(out_path, 'w') as f:
        json.dump(report, f)
`,
    ],
  },
  'de-09-market-report': {
    valid: [
      py`import json, sqlite3

def market_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    by_status = dict(con.execute('SELECT status, COUNT(*) FROM orders GROUP BY status'))
    revenue = con.execute("SELECT COALESCE(SUM(i.quantity * i.unit_price), 0) FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.status <> 'returned'").fetchone()[0]
    top = [r[0] for r in con.execute("SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status <> 'returned' GROUP BY c.id ORDER BY SUM(i.quantity * i.unit_price) DESC, c.name LIMIT 3")]
    with open(out_path, 'w') as f:
        json.dump({'orders_by_status': by_status, 'revenue': round(revenue, 2), 'top_customers': top}, f, sort_keys=True, indent=2)
`,
    ],
    wrong: [
      // includes returned orders in revenue
      py`import json, sqlite3

def market_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    by_status = dict(con.execute('SELECT status, COUNT(*) FROM orders GROUP BY status'))
    revenue = con.execute("SELECT COALESCE(SUM(i.quantity * i.unit_price), 0) FROM order_items i").fetchone()[0]
    top = [r[0] for r in con.execute("SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status <> 'returned' GROUP BY c.id ORDER BY SUM(i.quantity * i.unit_price) DESC, c.name LIMIT 3")]
    with open(out_path, 'w') as f:
        json.dump({'orders_by_status': by_status, 'revenue': round(revenue, 2), 'top_customers': top}, f)
`,
      // revenue is None for an empty database
      py`import json, sqlite3

def market_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    by_status = dict(con.execute('SELECT status, COUNT(*) FROM orders GROUP BY status'))
    revenue = con.execute("SELECT SUM(i.quantity * i.unit_price) FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.status <> 'returned'").fetchone()[0]
    top = [r[0] for r in con.execute("SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status <> 'returned' GROUP BY c.id ORDER BY SUM(i.quantity * i.unit_price) DESC, c.name LIMIT 3")]
    with open(out_path, 'w') as f:
        json.dump({'orders_by_status': by_status, 'revenue': round(revenue, 2) if revenue is not None else None, 'top_customers': top}, f)
`,
      // counts order lines per status instead of orders
      py`import json, sqlite3

def market_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    by_status = dict(con.execute('SELECT o.status, COUNT(*) FROM orders o JOIN order_items i ON i.order_id = o.id GROUP BY o.status'))
    revenue = con.execute("SELECT COALESCE(SUM(i.quantity * i.unit_price), 0) FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.status <> 'returned'").fetchone()[0]
    top = [r[0] for r in con.execute("SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status <> 'returned' GROUP BY c.id ORDER BY SUM(i.quantity * i.unit_price) DESC, c.name LIMIT 3")]
    with open(out_path, 'w') as f:
        json.dump({'orders_by_status': by_status, 'revenue': round(revenue, 2), 'top_customers': top}, f)
`,
      // hard-coded top list (from the data the player saw)
      py`import json, sqlite3

def market_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    by_status = dict(con.execute('SELECT status, COUNT(*) FROM orders GROUP BY status'))
    revenue = con.execute("SELECT COALESCE(SUM(i.quantity * i.unit_price), 0) FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.status <> 'returned'").fetchone()[0]
    with open(out_path, 'w') as f:
        json.dump({'orders_by_status': by_status, 'revenue': round(revenue, 2), 'top_customers': ['Jon Khan', 'Grace Hughes', 'Ada Reid']}, f)
`,
      // tie-break by name descending
      py`import json, sqlite3

def market_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    by_status = dict(con.execute('SELECT status, COUNT(*) FROM orders GROUP BY status'))
    revenue = con.execute("SELECT COALESCE(SUM(i.quantity * i.unit_price), 0) FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.status <> 'returned'").fetchone()[0]
    top = [r[0] for r in con.execute("SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items i ON i.order_id = o.id WHERE o.status <> 'returned' GROUP BY c.id ORDER BY SUM(i.quantity * i.unit_price), c.name LIMIT 3")]
    with open(out_path, 'w') as f:
        json.dump({'orders_by_status': by_status, 'revenue': round(revenue, 2), 'top_customers': top}, f)
`,
    ],
  },
  'de-09-works-report': {
    valid: [
      py`import json, sqlite3

def works_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    dept = {name: 0.0 for (name,) in con.execute('SELECT name FROM departments')}
    for name, hours in con.execute('SELECT d.name, SUM(e.downtime_hours) FROM maintenance_events e JOIN machines m ON m.id = e.machine_id JOIN departments d ON d.id = m.department_id GROUP BY d.id'):
        dept[name] = round(hours, 2)
    worst = con.execute('SELECT m.name FROM maintenance_events e JOIN machines m ON m.id = e.machine_id GROUP BY m.id ORDER BY SUM(e.downtime_hours) DESC, m.name LIMIT 1').fetchone()
    events = con.execute('SELECT COUNT(*) FROM maintenance_events').fetchone()[0]
    with open(out_path, 'w') as f:
        json.dump({'downtime_by_department': dept, 'worst_machine': worst[0] if worst else None, 'events': events}, f, sort_keys=True, indent=2)
`,
    ],
    wrong: [
      // departments without events are missing
      py`import json, sqlite3

def works_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    dept = {}
    for name, hours in con.execute('SELECT d.name, SUM(e.downtime_hours) FROM maintenance_events e JOIN machines m ON m.id = e.machine_id JOIN departments d ON d.id = m.department_id GROUP BY d.id'):
        dept[name] = round(hours, 2)
    worst = con.execute('SELECT m.name FROM maintenance_events e JOIN machines m ON m.id = e.machine_id GROUP BY m.id ORDER BY SUM(e.downtime_hours) DESC, m.name LIMIT 1').fetchone()
    events = con.execute('SELECT COUNT(*) FROM maintenance_events').fetchone()[0]
    with open(out_path, 'w') as f:
        json.dump({'downtime_by_department': dept, 'worst_machine': worst[0] if worst else None, 'events': events}, f)
`,
      // crashes on an empty database
      py`import json, sqlite3

def works_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    dept = {name: 0.0 for (name,) in con.execute('SELECT name FROM departments')}
    for name, hours in con.execute('SELECT d.name, SUM(e.downtime_hours) FROM maintenance_events e JOIN machines m ON m.id = e.machine_id JOIN departments d ON d.id = m.department_id GROUP BY d.id'):
        dept[name] = round(hours, 2)
    worst = con.execute('SELECT m.name FROM maintenance_events e JOIN machines m ON m.id = e.machine_id GROUP BY m.id ORDER BY SUM(e.downtime_hours) DESC, m.name LIMIT 1').fetchone()[0]
    events = con.execute('SELECT COUNT(*) FROM maintenance_events').fetchone()[0]
    with open(out_path, 'w') as f:
        json.dump({'downtime_by_department': dept, 'worst_machine': worst, 'events': events}, f)
`,
      // worst machine by number of events, not downtime
      py`import json, sqlite3

def works_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    dept = {name: 0.0 for (name,) in con.execute('SELECT name FROM departments')}
    for name, hours in con.execute('SELECT d.name, SUM(e.downtime_hours) FROM maintenance_events e JOIN machines m ON m.id = e.machine_id JOIN departments d ON d.id = m.department_id GROUP BY d.id'):
        dept[name] = round(hours, 2)
    worst = con.execute('SELECT m.name FROM maintenance_events e JOIN machines m ON m.id = e.machine_id GROUP BY m.id ORDER BY COUNT(*) DESC, m.name LIMIT 1').fetchone()
    events = con.execute('SELECT COUNT(*) FROM maintenance_events').fetchone()[0]
    with open(out_path, 'w') as f:
        json.dump({'downtime_by_department': dept, 'worst_machine': worst[0] if worst else None, 'events': events}, f)
`,
      // appends a second JSON document on rerun
      py`import json, sqlite3

def works_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    dept = {name: 0.0 for (name,) in con.execute('SELECT name FROM departments')}
    for name, hours in con.execute('SELECT d.name, SUM(e.downtime_hours) FROM maintenance_events e JOIN machines m ON m.id = e.machine_id JOIN departments d ON d.id = m.department_id GROUP BY d.id'):
        dept[name] = round(hours, 2)
    worst = con.execute('SELECT m.name FROM maintenance_events e JOIN machines m ON m.id = e.machine_id GROUP BY m.id ORDER BY SUM(e.downtime_hours) DESC, m.name LIMIT 1').fetchone()
    events = con.execute('SELECT COUNT(*) FROM maintenance_events').fetchone()[0]
    with open(out_path, 'a') as f:
        json.dump({'downtime_by_department': dept, 'worst_machine': worst[0] if worst else None, 'events': events}, f)
`,
      // machines with tied downtime pick by id
      py`import json, sqlite3

def works_report(db_path, out_path):
    con = sqlite3.connect(db_path)
    dept = {name: 0.0 for (name,) in con.execute('SELECT name FROM departments')}
    for name, hours in con.execute('SELECT d.name, SUM(e.downtime_hours) FROM maintenance_events e JOIN machines m ON m.id = e.machine_id JOIN departments d ON d.id = m.department_id GROUP BY d.id'):
        dept[name] = round(hours, 2)
    worst = con.execute('SELECT m.name FROM maintenance_events e JOIN machines m ON m.id = e.machine_id GROUP BY m.id ORDER BY SUM(e.downtime_hours) DESC LIMIT 1').fetchone()
    events = con.execute('SELECT COUNT(*) FROM maintenance_events').fetchone()[0]
    with open(out_path, 'w') as f:
        json.dump({'downtime_by_department': dept, 'worst_machine': worst[0] if worst else None, 'events': events}, f)
`,
    ],
  },
};
