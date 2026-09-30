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
  'py-29-clean-name': {
    valid: [
      py`def clean_name(raw):
    return ' '.join('-'.join(p.capitalize() for p in w.split('-')) for w in raw.split())
`,
      py`def clean_name(raw):
    words = raw.strip().lower().split()
    out = []
    for w in words:
        parts = w.split('-')
        out.append('-'.join(p[:1].upper() + p[1:] for p in parts))
    return ' '.join(out)
`,
    ],
    wrong: [
      // title() capitalises after apostrophes
      py`def clean_name(raw):
    return ' '.join(raw.split()).title()
`,
      // hyphenated parts are not capitalised separately
      py`def clean_name(raw):
    return ' '.join(w.capitalize() for w in raw.split())
`,
      // only the first letter of the whole text
      py`def clean_name(raw):
    return raw.strip().capitalize()
`,
      // inner runs of spaces are kept
      py`def clean_name(raw):
    return ' '.join('-'.join(p.capitalize() for p in w.split('-')) for w in raw.strip().split(' '))
`,
      // the rest of each word is not lower-cased
      py`def clean_name(raw):
    return ' '.join('-'.join(p[:1].upper() + p[1:] for p in w.split('-')) for w in raw.split())
`,
    ],
  },
  'py-29-slugify': {
    valid: [
      py`def slugify(title):
    out, chunk = [], ''
    for ch in title.lower():
        if ch in 'abcdefghijklmnopqrstuvwxyz0123456789':
            chunk += ch
        elif chunk:
            out.append(chunk)
            chunk = ''
    if chunk:
        out.append(chunk)
    return '-'.join(out)
`,
      py`import re

def slugify(title):
    return re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
`,
    ],
    wrong: [
      // accented letters count as letters
      py`def slugify(title):
    out, chunk = [], ''
    for ch in title.lower():
        if ch.isalnum():
            chunk += ch
        elif chunk:
            out.append(chunk)
            chunk = ''
    if chunk:
        out.append(chunk)
    return '-'.join(out)
`,
      // dashes at the ends
      py`import re

def slugify(title):
    return re.sub(r'[^a-z0-9]+', '-', title.lower())
`,
      // each separator character becomes its own dash
      py`def slugify(title):
    return ''.join(ch if ch in 'abcdefghijklmnopqrstuvwxyz0123456789' else '-' for ch in title.lower()).strip('-')
`,
      // no lower-casing
      py`import re

def slugify(title):
    return re.sub(r'[^A-Za-z0-9]+', '-', title).strip('-')
`,
      // spaces only
      py`def slugify(title):
    return '-'.join(title.lower().split())
`,
    ],
  },
  'py-29-tidy-code': {
    valid: [
      py`def tidy_code(text):
    out, chunk = [], ''
    for ch in text.upper():
        if ch in ' -/_':
            if chunk:
                out.append(chunk)
                chunk = ''
        elif ch.isascii() and ch.isalnum():
            chunk += ch
    if chunk:
        out.append(chunk)
    return '-'.join(out)
`,
      py`import re

def tidy_code(text):
    parts = re.split(r'[ \-/_]+', text.upper())
    parts = [re.sub(r'[^A-Z0-9]', '', p) for p in parts]
    return '-'.join(p for p in parts if p)
`,
    ],
    wrong: [
      // other punctuation separates
      py`import re

def tidy_code(text):
    return re.sub(r'[^A-Z0-9]+', '-', text.upper()).strip('-')
`,
      // accents accepted
      py`def tidy_code(text):
    out, chunk = [], ''
    for ch in text.upper():
        if ch in ' -/_':
            if chunk:
                out.append(chunk)
                chunk = ''
        elif ch.isalnum():
            chunk += ch
    if chunk:
        out.append(chunk)
    return '-'.join(out)
`,
      // not upper-cased
      py`def tidy_code(text):
    out, chunk = [], ''
    for ch in text:
        if ch in ' -/_':
            if chunk:
                out.append(chunk)
                chunk = ''
        elif ch.isascii() and ch.isalnum():
            chunk += ch
    if chunk:
        out.append(chunk)
    return '-'.join(out)
`,
      // empty chunks produce doubled dashes
      py`def tidy_code(text):
    parts = []
    chunk = ''
    for ch in text.upper():
        if ch in ' -/_':
            parts.append(chunk)
            chunk = ''
        elif ch.isascii() and ch.isalnum():
            chunk += ch
    parts.append(chunk)
    return '-'.join(parts)
`,
      // slash is not a separator
      py`def tidy_code(text):
    out, chunk = [], ''
    for ch in text.upper():
        if ch in ' -_':
            if chunk:
                out.append(chunk)
                chunk = ''
        elif ch.isascii() and ch.isalnum():
            chunk += ch
    if chunk:
        out.append(chunk)
    return '-'.join(out)
`,
    ],
  },
  'py-30-total-stock': {
    valid: [
      py`def total_stock(warehouse):
    total = 0
    for aisle in warehouse.get('aisles', []):
        for b in aisle.get('bins', []):
            total += b.get('qty', 0)
    return total
`,
      py`def total_stock(warehouse):
    return sum(b.get('qty', 0) for a in warehouse.get('aisles', []) for b in a.get('bins', []))
`,
    ],
    wrong: [
      // crashes when a key is missing
      py`def total_stock(warehouse):
    total = 0
    for aisle in warehouse['aisles']:
        for b in aisle['bins']:
            total += b['qty']
    return total
`,
      // only the first aisle
      py`def total_stock(warehouse):
    total = 0
    for b in warehouse.get('aisles', [{}])[0].get('bins', []):
        total += b.get('qty', 0)
    return total
`,
      // only counts bins, not quantities
      py`def total_stock(warehouse):
    return sum(1 for a in warehouse.get('aisles', []) for b in a.get('bins', []))
`,
      // stops at a bin without qty
      py`def total_stock(warehouse):
    total = 0
    for aisle in warehouse.get('aisles', []):
        for b in aisle.get('bins', []):
            if 'qty' not in b:
                return total
            total += b['qty']
    return total
`,
    ],
  },
  'py-30-order-lines': {
    valid: [
      py`import json

def order_lines(text):
    try:
        data = json.loads(text)
    except ValueError:
        return []
    if not isinstance(data, list):
        return []
    out = []
    for o in data:
        for line in o.get('lines', []):
            out.append((o.get('id'), line.get('sku'), line.get('qty')))
    return out
`,
    ],
    wrong: [
      // no guard for invalid JSON
      py`import json

def order_lines(text):
    out = []
    for o in json.loads(text):
        for line in o.get('lines', []):
            out.append((o.get('id'), line.get('sku'), line.get('qty')))
    return out
`,
      // crashes on an order without lines
      py`import json

def order_lines(text):
    try:
        data = json.loads(text)
    except ValueError:
        return []
    if not isinstance(data, list):
        return []
    return [(o['id'], l['sku'], l['qty']) for o in data for l in o['lines']]
`,
      // lists instead of tuples
      py`import json

def order_lines(text):
    try:
        data = json.loads(text)
    except ValueError:
        return []
    if not isinstance(data, list):
        return []
    return [[o.get('id'), l.get('sku'), l.get('qty')] for o in data for l in o.get('lines', [])]
`,
      // a dict is iterated as if it were a list
      py`import json

def order_lines(text):
    try:
        data = json.loads(text)
    except ValueError:
        return []
    out = []
    for o in data:
        for line in o.get('lines', []):
            out.append((o.get('id'), line.get('sku'), line.get('qty')))
    return out
`,
      // drops lines without a qty
      py`import json

def order_lines(text):
    try:
        data = json.loads(text)
    except ValueError:
        return []
    if not isinstance(data, list):
        return []
    return [(o.get('id'), l.get('sku'), l['qty']) for o in data for l in o.get('lines', []) if 'qty' in l]
`,
    ],
  },
  'py-30-roster-scores': {
    valid: [
      py`import json

def roster_scores(text):
    try:
        data = json.loads(text)
    except ValueError:
        return []
    if not isinstance(data, list):
        return []
    out = []
    for c in data:
        for s in c.get('students', []):
            out.append((c.get('class'), s.get('name'), s.get('score')))
    return out
`,
    ],
    wrong: [
      py`import json

def roster_scores(text):
    out = []
    for c in json.loads(text):
        for s in c.get('students', []):
            out.append((c.get('class'), s.get('name'), s.get('score')))
    return out
`,
      py`import json

def roster_scores(text):
    try:
        data = json.loads(text)
    except ValueError:
        return []
    if not isinstance(data, list):
        return []
    return [(c['class'], s['name'], s['score']) for c in data for s in c['students']]
`,
      py`import json

def roster_scores(text):
    try:
        data = json.loads(text)
    except ValueError:
        return []
    if not isinstance(data, list):
        return []
    return [(s.get('name'), s.get('score')) for c in data for s in c.get('students', [])]
`,
      py`import json

def roster_scores(text):
    try:
        data = json.loads(text)
    except ValueError:
        return []
    if not isinstance(data, list):
        return []
    return [(c.get('class'), s.get('name'), s.get('score')) for c in data for s in c.get('students', [])][:1]
`,
    ],
  },
  'py-31-top-n': {
    valid: [
      py`def top_n(scores, n):
    return sorted(scores, key=lambda p: (-p[1], p[0]))[:max(n, 0)]
`,
      py`def top_n(scores, n):
    if n <= 0:
        return []
    ordered = sorted(scores, key=lambda p: p[0])
    ordered.sort(key=lambda p: p[1], reverse=True)
    return ordered[:n]
`,
    ],
    wrong: [
      // ties are not in name order
      py`def top_n(scores, n):
    return sorted(scores, key=lambda p: p[1], reverse=True)[:max(n, 0)]
`,
      // ascending scores
      py`def top_n(scores, n):
    return sorted(scores, key=lambda p: (p[1], p[0]))[:max(n, 0)]
`,
      // negative n slices from the end
      py`def top_n(scores, n):
    return sorted(scores, key=lambda p: (-p[1], p[0]))[:n]
`,
      // sorts the caller's list
      py`def top_n(scores, n):
    scores.sort(key=lambda p: (-p[1], p[0]))
    return scores[:max(n, 0)]
`,
      // names A-Z first, then scores (wrong priority)
      py`def top_n(scores, n):
    return sorted(scores, key=lambda p: (p[0], -p[1]))[:max(n, 0)]
`,
    ],
  },
  'py-31-first-at-least': {
    valid: [
      py`def first_at_least(values, target):
    lo, hi = 0, len(values)
    while lo < hi:
        mid = (lo + hi) // 2
        if values[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo if lo < len(values) else -1
`,
      py`from bisect import bisect_left

def first_at_least(values, target):
    i = bisect_left(values, target)
    return i if i < len(values) else -1
`,
    ],
    wrong: [
      // correct but linear
      py`def first_at_least(values, target):
    for i, v in enumerate(values):
        if v >= target:
            return i
    return -1
`,
      // stops at any equal value, not the first
      py`def first_at_least(values, target):
    lo, hi = 0, len(values) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if values[mid] == target:
            return mid
        if values[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return lo if lo < len(values) else -1
`,
      // returns len instead of -1
      py`from bisect import bisect_left

def first_at_least(values, target):
    return bisect_left(values, target)
`,
      // bisect_right: skips values equal to the target
      py`from bisect import bisect_right

def first_at_least(values, target):
    i = bisect_right(values, target)
    return i if i < len(values) else -1
`,
      // slicing copies the list on every step
      py`def first_at_least(values, target):
    offset = 0
    while values:
        mid = len(values) // 2
        if values[mid] < target:
            offset += mid + 1
            values = values[mid + 1:]
        elif mid == 0 or values[mid - 1] < target:
            return offset + mid
        else:
            values = values[:mid]
    return -1
`,
    ],
  },
  'py-31-count-before': {
    valid: [
      py`from bisect import bisect_left

def count_before(times, t):
    return bisect_left(times, t)
`,
      py`def count_before(times, t):
    lo, hi = 0, len(times)
    while lo < hi:
        mid = (lo + hi) // 2
        if times[mid] < t:
            lo = mid + 1
        else:
            hi = mid
    return lo
`,
    ],
    wrong: [
      py`def count_before(times, t):
    return sum(1 for x in times if x < t)
`,
      // counts equal times too
      py`from bisect import bisect_right

def count_before(times, t):
    return bisect_right(times, t)
`,
      // off by one at the end
      py`def count_before(times, t):
    lo, hi = 0, len(times) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if times[mid] < t:
            lo = mid + 1
        else:
            hi = mid
    return lo
`,
      // len(list slice) is linear
      py`def count_before(times, t):
    return len([x for x in times if x < t])
`,
    ],
  },
  'py-32-parse-port': {
    valid: [
      py`def parse_port(text):
    t = text.strip()
    if not t or any(c not in '0123456789' for c in t):
        raise ValueError('invalid port')
    n = int(t)
    if not 1 <= n <= 65535:
        raise ValueError('invalid port')
    return n
`,
      py`def parse_port(text):
    t = text.strip()
    if not (t.isascii() and t.isdigit()):
        raise ValueError('invalid port')
    n = int(t)
    if n < 1 or n > 65535:
        raise ValueError('invalid port')
    return n
`,
    ],
    wrong: [
      // int() alone accepts "+80" and "8_0"
      py`def parse_port(text):
    try:
        n = int(text)
    except ValueError:
        raise ValueError('invalid port')
    if not 1 <= n <= 65535:
        raise ValueError('invalid port')
    return n
`,
      // range off by one
      py`def parse_port(text):
    t = text.strip()
    if not t or any(c not in '0123456789' for c in t):
        raise ValueError('invalid port')
    n = int(t)
    if not 1 <= n < 65535:
        raise ValueError('invalid port')
    return n
`,
      // a different message
      py`def parse_port(text):
    t = text.strip()
    if not t or any(c not in '0123456789' for c in t):
        raise ValueError('not a port')
    n = int(t)
    if not 1 <= n <= 65535:
        raise ValueError('not a port')
    return n
`,
      // returns None instead of raising
      py`def parse_port(text):
    t = text.strip()
    if not t or any(c not in '0123456789' for c in t):
        return None
    n = int(t)
    return n if 1 <= n <= 65535 else None
`,
      // port 0 allowed
      py`def parse_port(text):
    t = text.strip()
    if not t or any(c not in '0123456789' for c in t):
        raise ValueError('invalid port')
    n = int(t)
    if not 0 <= n <= 65535:
        raise ValueError('invalid port')
    return n
`,
      // does not strip spaces
      py`def parse_port(text):
    if not text or any(c not in '0123456789' for c in text):
        raise ValueError('invalid port')
    n = int(text)
    if not 1 <= n <= 65535:
        raise ValueError('invalid port')
    return n
`,
    ],
  },
  'py-32-withdraw': {
    valid: [
      py`class InsufficientFunds(Exception):
    def __init__(self, shortfall):
        super().__init__('short by %s' % shortfall)
        self.shortfall = shortfall


def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError('amount must be positive')
    if amount > balance:
        raise InsufficientFunds(amount - balance)
    return balance - amount
`,
    ],
    wrong: [
      py`class InsufficientFunds(ValueError):
    def __init__(self, shortfall):
        super().__init__('short by %s' % shortfall)
        self.shortfall = shortfall


def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError('amount must be positive')
    if amount > balance:
        raise InsufficientFunds(amount - balance)
    return balance - amount
`,
      py`class InsufficientFunds(Exception):
    def __init__(self, shortfall):
        super().__init__('short by %s' % shortfall)
        self.shortfall = shortfall


def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError('amount must be positive')
    if amount >= balance:
        raise InsufficientFunds(amount - balance)
    return balance - amount
`,
      py`class InsufficientFunds(Exception):
    def __init__(self, shortfall):
        super().__init__('short by %s' % shortfall)
        self.shortfall = shortfall


def withdraw(balance, amount):
    if amount <= 0 or amount > balance:
        raise InsufficientFunds(amount - balance)
    return balance - amount
`,
      py`class InsufficientFunds(Exception):
    def __init__(self, shortfall):
        super().__init__('short by %s' % shortfall)
        self.shortfall = shortfall


def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError('amount must be positive')
    if amount > balance:
        raise InsufficientFunds(balance - amount)
    return balance - amount
`,
      py`class InsufficientFunds(Exception):
    def __init__(self, shortfall):
        super().__init__('short by %s' % shortfall)
        self.shortfall = shortfall


def withdraw(balance, amount):
    if amount < 0:
        raise ValueError('amount must be positive')
    if amount > balance:
        raise InsufficientFunds(amount - balance)
    return balance - amount
`,
      py`class InsufficientFunds(Exception):
    pass


def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError('amount must be positive')
    if amount > balance:
        return 'error'
    return balance - amount
`,
    ],
  },
  'py-32-reserve': {
    valid: [
      py`class OutOfStock(Exception):
    def __init__(self, missing):
        super().__init__('short by %s' % missing)
        self.missing = missing


def reserve(stock, qty):
    if qty <= 0:
        raise ValueError('amount must be positive')
    if qty > stock:
        raise OutOfStock(qty - stock)
    return stock - qty
`,
    ],
    wrong: [
      py`class OutOfStock(ValueError):
    def __init__(self, missing):
        super().__init__('short by %s' % missing)
        self.missing = missing


def reserve(stock, qty):
    if qty <= 0:
        raise ValueError('amount must be positive')
    if qty > stock:
        raise OutOfStock(qty - stock)
    return stock - qty
`,
      py`class OutOfStock(Exception):
    def __init__(self, missing):
        super().__init__('short by %s' % missing)
        self.missing = missing


def reserve(stock, qty):
    if qty <= 0:
        raise ValueError('amount must be positive')
    if qty >= stock:
        raise OutOfStock(qty - stock)
    return stock - qty
`,
      py`class OutOfStock(Exception):
    def __init__(self, missing):
        super().__init__('short by %s' % missing)
        self.missing = missing


def reserve(stock, qty):
    if qty <= 0 or qty > stock:
        raise OutOfStock(qty - stock)
    return stock - qty
`,
      py`class OutOfStock(Exception):
    def __init__(self, missing):
        super().__init__('short by %s' % missing)
        self.missing = missing


def reserve(stock, qty):
    if qty <= 0:
        raise ValueError('amount must be positive')
    if qty > stock:
        raise OutOfStock(stock - qty)
    return stock - qty
`,
      py`class OutOfStock(Exception):
    def __init__(self, missing):
        super().__init__('short by %s' % missing)
        self.missing = missing


def reserve(stock, qty):
    if qty < 0:
        raise ValueError('amount must be positive')
    if qty > stock:
        raise OutOfStock(qty - stock)
    return stock - qty
`,
      py`class OutOfStock(Exception):
    pass


def reserve(stock, qty):
    if qty <= 0:
        raise ValueError('amount must be positive')
    if qty > stock:
        return 'error'
    return stock - qty
`,
    ],
  },
  'py-33-parse-kv': {
    valid: [
      py`def parse_settings(line):
    out = {}
    for part in line.split(';'):
        if '=' not in part:
            continue
        k, v = part.split('=', 1)
        k, v = k.strip(), v.strip()
        if k:
            out[k] = v
    return out
`,
      py`def parse_settings(line):
    out = {}
    for part in line.split(';'):
        k, sep, v = part.partition('=')
        if sep and k.strip():
            out[k.strip()] = v.strip()
    return out
`,
    ],
    wrong: [
      py`def parse_settings(line):
    out = {}
    for part in line.split(';'):
        bits = part.split('=')
        if len(bits) == 2 and bits[0].strip():
            out[bits[0].strip()] = bits[1].strip()
    return out
`,
      py`def parse_settings(line):
    out = {}
    for part in line.split(';'):
        if '=' in part:
            k, v = part.split('=', 1)
            if k:
                out[k] = v
    return out
`,
      py`def parse_settings(line):
    out = {}
    for part in line.split(';'):
        if '=' in part:
            k, v = part.split('=', 1)
            out[k.strip()] = v.strip()
    return out
`,
      py`def parse_settings(line):
    out = {}
    for part in line.split(';'):
        if '=' in part:
            k, v = part.split('=', 1)
            if k.strip():
                out.setdefault(k.strip(), v.strip())
    return out
`,
      py`def parse_settings(line):
    out = {}
    for part in line.split(';'):
        k, v = part.split('=', 1)
        if k.strip():
            out[k.strip()] = v.strip()
    return out
`,
    ],
  },
  'py-33-parse-log': {
    valid: [
      py`import re
from datetime import datetime

_PAT = re.compile(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(DEBUG|INFO|WARN|ERROR)\] ([A-Za-z0-9_-]+): (.+?)(?: \(code=(\d+)\))?$')

def parse_log_line(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
    except ValueError:
        return None
    message = m.group(4).strip()
    if not message:
        return None
    return {'time': m.group(1), 'level': m.group(2), 'source': m.group(3), 'message': message, 'code': int(m.group(5)) if m.group(5) else None}
`,
      py`from datetime import datetime

def parse_log_line(line):
    line = line.strip()
    if len(line) < 25 or line[19] != ' ' or line[20] != '[':
        return None
    stamp = line[:19]
    try:
        datetime.strptime(stamp, '%Y-%m-%d %H:%M:%S')
    except ValueError:
        return None
    close = line.find(']', 20)
    level = line[21:close]
    if level not in ('DEBUG', 'INFO', 'WARN', 'ERROR') or line[close + 1:close + 2] != ' ':
        return None
    rest = line[close + 2:]
    source, sep, message = rest.partition(': ')
    if not sep or not source or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-' for c in source):
        return None
    code = None
    if message.endswith(')') and ' (code=' in message:
        head, _, tail = message.rpartition(' (code=')
        digits = tail[:-1]
        if digits.isascii() and digits.isdigit():
            code = int(digits)
            message = head
    message = message.strip()
    if not message:
        return None
    return {'time': stamp, 'level': level, 'source': source, 'message': message, 'code': code}
`,
    ],
    wrong: [
      py`import re
from datetime import datetime

_PAT = re.compile(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(DEBUG|INFO|WARN|ERROR)\] ([A-Za-z0-9_-]+): (.+?)(?: \(code=(\d+)\))?$')

def parse_log_line(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    message = m.group(4).strip()
    if not message:
        return None
    return {'time': m.group(1), 'level': m.group(2), 'source': m.group(3), 'message': message, 'code': int(m.group(5)) if m.group(5) else None}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[([A-Z]+)\] ([A-Za-z0-9_-]+): (.+?)(?: \(code=(\d+)\))?$')

def parse_log_line(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
    except ValueError:
        return None
    message = m.group(4).strip()
    if not message:
        return None
    return {'time': m.group(1), 'level': m.group(2), 'source': m.group(3), 'message': message, 'code': int(m.group(5)) if m.group(5) else None}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(DEBUG|INFO|WARN|ERROR)\] ([A-Za-z0-9_-]+): (.+?)()$')

def parse_log_line(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
    except ValueError:
        return None
    message = m.group(4).strip()
    if not message:
        return None
    return {'time': m.group(1), 'level': m.group(2), 'source': m.group(3), 'message': message, 'code': None}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(DEBUG|INFO|WARN|ERROR)\] ([A-Za-z0-9_-]+): (.+?)(?: \(code=(\d+)\))?$')

def parse_log_line(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
    except ValueError:
        return None
    message = m.group(4).strip()
    if not message:
        return None
    return {'time': m.group(1), 'level': m.group(2), 'source': m.group(3), 'message': message, 'code': m.group(5)}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(DEBUG|INFO|WARN|ERROR)\] ([A-Za-z0-9_-]+): (.+?)(?: \(code=(\d+)\))?$')

def parse_log_line(line):
    m = _PAT.match(line)
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
    except ValueError:
        return None
    message = m.group(4).strip()
    if not message:
        return None
    return {'time': m.group(1), 'level': m.group(2), 'source': m.group(3), 'message': message, 'code': int(m.group(5)) if m.group(5) else None}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(DEBUG|INFO|WARN|ERROR)\] (.+?): (.+?)(?: \(code=(\d+)\))?$')

def parse_log_line(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
    except ValueError:
        return None
    message = m.group(4).strip()
    if not message:
        return None
    return {'time': m.group(1), 'level': m.group(2), 'source': m.group(3), 'message': message, 'code': int(m.group(5)) if m.group(5) else None}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(DEBUG|INFO|WARN|ERROR)\] ([A-Za-z0-9_-]+): (.+?)(?: \(code=(\d+)\))?$')

def parse_log_line(line):
    m = _PAT.match(line.strip())
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
    except ValueError:
        return None
    message = m.group(4).strip()
    if not message:
        return None
    return {'time': m.group(1), 'level': m.group(2), 'source': m.group(3), 'message': message, 'code': int(m.group(5)) if m.group(5) else None}
`,
    ],
  },
  'py-33-parse-txn': {
    valid: [
      py`import re
from datetime import datetime

_PAT = re.compile(r'^TXN (\d{4}-\d{2}-\d{2}) \| (.+?) \| ([+-]?\d+(?:\.\d+)?) ([A-Z]{3})$')

def parse_transaction(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d')
    except ValueError:
        return None
    payee = m.group(2).strip()
    if not payee:
        return None
    return {'date': m.group(1), 'payee': payee, 'amount': float(m.group(3)), 'currency': m.group(4)}
`,
      py`from datetime import datetime

def parse_transaction(line):
    parts = line.strip().split(' | ')
    if len(parts) != 3:
        return None
    head, payee, tail = parts
    if not head.startswith('TXN ') or len(head) != 14:
        return None
    date = head[4:]
    try:
        datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        return None
    payee = payee.strip()
    if not payee:
        return None
    amount_text, sep, currency = tail.partition(' ')
    if not sep or len(currency) != 3 or not (currency.isascii() and currency.isupper() and currency.isalpha()):
        return None
    body = amount_text[1:] if amount_text[:1] in ('+', '-') else amount_text
    whole, dot, frac = body.partition('.')
    if not (whole.isascii() and whole.isdigit()) or (dot and not (frac.isascii() and frac.isdigit())):
        return None
    return {'date': date, 'payee': payee, 'amount': float(amount_text), 'currency': currency}
`,
    ],
    wrong: [
      py`import re
from datetime import datetime

_PAT = re.compile(r'^TXN (\d{4}-\d{2}-\d{2}) \| (.+?) \| ([+-]?\d+(?:\.\d+)?) ([A-Z]{3})$')

def parse_transaction(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    payee = m.group(2).strip()
    if not payee:
        return None
    return {'date': m.group(1), 'payee': payee, 'amount': float(m.group(3)), 'currency': m.group(4)}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^TXN (\d{4}-\d{2}-\d{2}) \| (.+?) \| ([+-]?\d+(?:\.\d+)?) ([A-Z]{3})$')

def parse_transaction(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d')
    except ValueError:
        return None
    payee = m.group(2)
    return {'date': m.group(1), 'payee': payee, 'amount': float(m.group(3)), 'currency': m.group(4)}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^TXN (\d{4}-\d{2}-\d{2}) \| (.+?) \| ([+-]?\d+(?:\.\d+)?) ([A-Za-z]{3})$')

def parse_transaction(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d')
    except ValueError:
        return None
    payee = m.group(2).strip()
    if not payee:
        return None
    return {'date': m.group(1), 'payee': payee, 'amount': float(m.group(3)), 'currency': m.group(4)}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^TXN (\d{4}-\d{2}-\d{2}) \| (.+?) \| ([+-]?\d+(?:\.\d+)?) ([A-Z]{3})$')

def parse_transaction(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d')
    except ValueError:
        return None
    payee = m.group(2).strip()
    if not payee:
        return None
    return {'date': m.group(1), 'payee': payee, 'amount': m.group(3), 'currency': m.group(4)}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^TXN (\d{4}-\d{2}-\d{2}) \| (.+?) \| (-?\d+(?:\.\d+)?) ([A-Z]{3})$')

def parse_transaction(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d')
    except ValueError:
        return None
    payee = m.group(2).strip()
    if not payee:
        return None
    return {'date': m.group(1), 'payee': payee, 'amount': float(m.group(3)), 'currency': m.group(4)}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^TXN (\d{4}-\d{2}-\d{2}) \| (.+?) \| ([+-]?\d+\.\d+) ([A-Z]{3})$')

def parse_transaction(line):
    m = _PAT.match(line.strip())
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d')
    except ValueError:
        return None
    payee = m.group(2).strip()
    if not payee:
        return None
    return {'date': m.group(1), 'payee': payee, 'amount': float(m.group(3)), 'currency': m.group(4)}
`,
      py`import re
from datetime import datetime

_PAT = re.compile(r'^TXN (\d{4}-\d{2}-\d{2}) \| (.+?) \| ([+-]?\d+(?:\.\d+)?) ([A-Z]{3})$')

def parse_transaction(line):
    m = _PAT.match(line)
    if not m:
        return None
    try:
        datetime.strptime(m.group(1), '%Y-%m-%d')
    except ValueError:
        return None
    payee = m.group(2).strip()
    if not payee:
        return None
    return {'date': m.group(1), 'payee': payee, 'amount': float(m.group(3)), 'currency': m.group(4)}
`,
    ],
  },
  'py-34-top-words': {
    valid: [
      py`import re
from collections import Counter

def top_words(text, n):
    words = re.findall(r'[a-z]+', text.lower())
    return sorted(Counter(words).items(), key=lambda p: (-p[1], p[0]))[:max(n, 0)]
`,
      py`def top_words(text, n):
    words = []
    cur = ''
    for ch in text.lower():
        if ch in 'abcdefghijklmnopqrstuvwxyz':
            cur += ch
        elif cur:
            words.append(cur)
            cur = ''
    if cur:
        words.append(cur)
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    pairs = sorted(counts.items(), key=lambda p: (-p[1], p[0]))
    return pairs[:n] if n > 0 else []
`,
    ],
    wrong: [
      py`import re
from collections import Counter

def top_words(text, n):
    words = re.findall(r'[a-z]+', text.lower())
    return Counter(words).most_common(max(n, 0))
`,
      py`import re
from collections import Counter

def top_words(text, n):
    words = re.findall(r"[a-z0-9']+", text.lower())
    return sorted(Counter(words).items(), key=lambda p: (-p[1], p[0]))[:max(n, 0)]
`,
      py`import re
from collections import Counter

def top_words(text, n):
    words = re.findall(r'[a-z]+', text)
    return sorted(Counter(words).items(), key=lambda p: (-p[1], p[0]))[:max(n, 0)]
`,
      py`import re
from collections import Counter

def top_words(text, n):
    words = re.findall(r'[a-z]+', text.lower())
    return sorted(Counter(words).items(), key=lambda p: (-p[1], p[0]))[:n]
`,
      py`import re
from collections import Counter

def top_words(text, n):
    words = text.lower().split()
    return sorted(Counter(words).items(), key=lambda p: (-p[1], p[0]))[:max(n, 0)]
`,
      py`import re
from collections import Counter

def top_words(text, n):
    words = re.findall(r'[a-z]+', text.lower())
    return sorted(Counter(words).items(), key=lambda p: p[1], reverse=True)[:max(n, 0)]
`,
    ],
  },
  'py-34-run-lengths': {
    valid: [
      py`from itertools import groupby

def run_lengths(values):
    return [(k, len(list(g))) for k, g in groupby(values)]
`,
      py`def run_lengths(values):
    out = []
    for x in values:
        if out and out[-1][0] == x:
            out[-1] = (x, out[-1][1] + 1)
        else:
            out.append((x, 1))
    return out
`,
    ],
    wrong: [
      py`def run_lengths(values):
    counts = {}
    for x in values:
        counts[x] = counts.get(x, 0) + 1
    return list(counts.items())
`,
      py`from itertools import groupby

def run_lengths(values):
    return [(k, len(list(g))) for k, g in groupby(sorted(values, key=str))]
`,
      py`def run_lengths(values):
    out = []
    if not values:
        return out
    cur, n = values[0], 0
    for x in values:
        if x == cur:
            n += 1
        else:
            out.append((cur, n))
            cur, n = x, 1
    return out
`,
      py`from itertools import groupby

def run_lengths(values):
    return [[k, len(list(g))] for k, g in groupby(values)]
`,
      py`def run_lengths(values):
    out = []
    cur, n = values[0], 0
    for x in values:
        if x == cur:
            n += 1
        else:
            out.append((cur, n))
            cur, n = x, 1
    out.append((cur, n))
    return out
`,
    ],
  },
  'py-34-compress-log': {
    valid: [
      py`from itertools import groupby

def compress_log(lines):
    out = []
    for line, g in groupby(lines):
        n = len(list(g))
        out.append(line if n == 1 else '%s (x%d)' % (line, n))
    return out
`,
      py`def compress_log(lines):
    out = []
    i = 0
    while i < len(lines):
        j = i
        while j < len(lines) and lines[j] == lines[i]:
            j += 1
        out.append(lines[i] if j - i == 1 else lines[i] + ' (x' + str(j - i) + ')')
        i = j
    return out
`,
    ],
    wrong: [
      py`from itertools import groupby

def compress_log(lines):
    out = []
    for line, g in groupby(lines):
        n = len(list(g))
        out.append('%s (x%d)' % (line, n))
    return out
`,
      py`def compress_log(lines):
    counts = {}
    for l in lines:
        counts[l] = counts.get(l, 0) + 1
    return [l if n == 1 else '%s (x%d)' % (l, n) for l, n in counts.items()]
`,
      py`from itertools import groupby

def compress_log(lines):
    out = []
    for line, g in groupby(lines):
        n = len(list(g))
        out.append(line if n == 1 else '%s x%d' % (line, n))
    return out
`,
      py`def compress_log(lines):
    out = []
    prev, n = None, 0
    for line in lines:
        if line == prev:
            n += 1
        else:
            if prev is not None:
                out.append(prev if n == 1 else '%s (x%d)' % (prev, n))
            prev, n = line, 1
    return out
`,
      py`def compress_log(lines):
    out = []
    prev, n = None, 0
    for line in lines + [None]:
        if line == prev:
            n += 1
        else:
            if prev:
                out.append(prev if n == 1 else '%s (x%d)' % (prev, n))
            prev, n = line, 1
    return out
`,
    ],
  },
};
