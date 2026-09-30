/**
 * A small spreadsheet engine: Excel-style formulas over a JSON workbook. It exists so spreadsheet lessons can be graded by
 * BEHAVIOUR (what the formulas compute, including on hidden data) exactly like Python and SQL. It implements the functions
 * the curriculum teaches, with Excel's semantics for them; anything else evaluates to #NAME?.
 */
import { SheetError, type CellValue, type Matrix, type Value, type WorkbookData } from './types';

/* ------------------------------------------------------------------ addresses */

export function colToNum(col: string): number { let n = 0; for (const ch of col.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64); return n; }
export function numToCol(n: number): string { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
export interface Addr { col: number; row: number }
export function parseAddr(a: string): Addr | null {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d{1,6})$/.exec(a.trim());
  return m ? { col: colToNum(m[1]!), row: Number(m[2]) } : null;
}
export const addrOf = (col: number, row: number): string => `${numToCol(col)}${row}`;

/** Expands `A1:B3` into the addresses it covers, row by row. */
export function expandRange(ref: string): string[][] | null {
  const [a, b] = ref.replace(/\$/g, '').split(':');
  const p = parseAddr(a ?? '');
  const q = parseAddr(b ?? a ?? '');
  if (!p || !q) return null;
  const rows: string[][] = [];
  for (let r = Math.min(p.row, q.row); r <= Math.max(p.row, q.row); r++) {
    const row: string[] = [];
    for (let c = Math.min(p.col, q.col); c <= Math.max(p.col, q.col); c++) row.push(addrOf(c, r));
    rows.push(row);
  }
  return rows;
}

/* ------------------------------------------------------------------ parsing */

type Node =
  | { t: 'num'; v: number } | { t: 'str'; v: string } | { t: 'bool'; v: boolean }
  | { t: 'ref'; sheet?: string; addr: string }
  | { t: 'range'; sheet?: string; a: string; b: string }
  | { t: 'un'; op: '-' | '+'; x: Node } | { t: 'pct'; x: Node }
  | { t: 'bin'; op: string; l: Node; r: Node }
  | { t: 'call'; name: string; args: Node[] }
  | { t: 'err'; e: SheetError };

interface Tok { k: 'num' | 'str' | 'id' | 'op' | 'end'; v: string }

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '"') {
      let s = ''; i++;
      while (i < src.length) { if (src[i] === '"') { if (src[i + 1] === '"') { s += '"'; i += 2; continue; } break; } s += src[i++]; }
      if (src[i] !== '"') throw new Error('unterminated string');
      i++; out.push({ k: 'str', v: s }); continue;
    }
    if (ch === "'") { // quoted sheet name
      let s = ''; i++;
      while (i < src.length && src[i] !== "'") s += src[i++];
      i++; out.push({ k: 'id', v: s }); continue;
    }
    const num = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
    if (num && !/[A-Za-z_]/.test(src[i + num[0].length] ?? '')) { out.push({ k: 'num', v: num[0] }); i += num[0].length; continue; }
    const id = /^[$A-Za-z_#][$A-Za-z0-9_.#/!?]*/.exec(src.slice(i));
    if (id) { out.push({ k: 'id', v: id[0] }); i += id[0].length; continue; }
    const two = src.slice(i, i + 2);
    if (['<>', '<=', '>='].includes(two)) { out.push({ k: 'op', v: two }); i += 2; continue; }
    if ('+-*/^&=<>(),:%!;'.includes(ch)) { out.push({ k: 'op', v: ch }); i++; continue; }
    throw new Error(`unexpected "${ch}"`);
  }
  out.push({ k: 'end', v: '' });
  return out;
}

class Parser {
  private p = 0;
  constructor(private toks: Tok[]) {}
  private peek() { return this.toks[this.p]!; }
  private next() { return this.toks[this.p++]!; }
  private isOp(v: string) { const t = this.peek(); return t.k === 'op' && t.v === v; }
  parse(): Node { const n = this.compare(); if (this.peek().k !== 'end') throw new Error('unexpected token'); return n; }
  private compare(): Node {
    let l = this.concat();
    while (['=', '<>', '<', '>', '<=', '>='].some((o) => this.isOp(o))) { const op = this.next().v; l = { t: 'bin', op, l, r: this.concat() }; }
    return l;
  }
  private concat(): Node { let l = this.add(); while (this.isOp('&')) { this.next(); l = { t: 'bin', op: '&', l, r: this.add() }; } return l; }
  private add(): Node { let l = this.mul(); while (this.isOp('+') || this.isOp('-')) { const op = this.next().v; l = { t: 'bin', op, l, r: this.mul() }; } return l; }
  private mul(): Node { let l = this.pow(); while (this.isOp('*') || this.isOp('/')) { const op = this.next().v; l = { t: 'bin', op, l, r: this.pow() }; } return l; }
  private pow(): Node { let l = this.unary(); while (this.isOp('^')) { this.next(); l = { t: 'bin', op: '^', l, r: this.unary() }; } return l; }
  private unary(): Node {
    if (this.isOp('-') || this.isOp('+')) { const op = this.next().v as '-' | '+'; return { t: 'un', op, x: this.unary() }; }
    return this.postfix();
  }
  private postfix(): Node { let x = this.primary(); while (this.isOp('%')) { this.next(); x = { t: 'pct', x }; } return x; }
  private primary(): Node {
    const t = this.next();
    if (t.k === 'num') return { t: 'num', v: Number(t.v) };
    if (t.k === 'str') return { t: 'str', v: t.v };
    if (t.k === 'op' && t.v === '(') { const n = this.compare(); if (!this.isOp(')')) throw new Error('missing )'); this.next(); return n; }
    if (t.k === 'id') {
      const up = t.v.toUpperCase();
      if (up === 'TRUE') return { t: 'bool', v: true };
      if (up === 'FALSE') return { t: 'bool', v: false };
      if (up.startsWith('#')) return { t: 'err', e: new SheetError(up as SheetError['code']) };
      if (this.isOp('(')) { // function call
        this.next();
        const args: Node[] = [];
        if (!this.isOp(')')) { for (;;) { args.push(this.isOp(',') || this.isOp(')') ? { t: 'str', v: '' } : this.compare()); if (this.isOp(',') || this.isOp(';')) { this.next(); continue; } break; } }
        if (!this.isOp(')')) throw new Error('missing )');
        this.next();
        return { t: 'call', name: up, args };
      }
      let sheet: string | undefined;
      let ref = t.v;
      if (this.isOp('!')) { this.next(); sheet = ref; const r = this.next(); if (r.k !== 'id') throw new Error('bad reference'); ref = r.v; }
      else if (ref.includes('!')) { const [sh, rest] = ref.split('!'); sheet = sh; ref = rest!; }
      if (!parseAddr(ref)) { return { t: 'err', e: new SheetError('#NAME?') }; }
      if (this.isOp(':')) { this.next(); const b = this.next(); if (b.k !== 'id' || !parseAddr(b.v)) throw new Error('bad range'); return { t: 'range', sheet, a: ref, b: b.v }; }
      return { t: 'ref', sheet, addr: ref };
    }
    throw new Error('unexpected token');
  }
}

export function parseFormula(text: string): Node {
  return new Parser(tokenize(text.startsWith('=') ? text.slice(1) : text)).parse();
}

/* ------------------------------------------------------------------ values and coercion */

export const isErr = (v: unknown): v is SheetError => v instanceof SheetError;
const ERR = {
  div0: () => new SheetError('#DIV/0!'), na: () => new SheetError('#N/A'), value: () => new SheetError('#VALUE!'),
  ref: () => new SheetError('#REF!'), name: () => new SheetError('#NAME?'), num: () => new SheetError('#NUM!'),
};

function toNum(v: Value): number | SheetError {
  if (isErr(v)) return v;
  if (v === null || v === '') return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const s = v.trim();
  if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?%?$/.test(s)) return s.endsWith('%') ? Number(s.slice(0, -1)) / 100 : Number(s);
  return ERR.value();
}
function toStr(v: Value): string {
  if (isErr(v)) return v.code;
  if (v === null) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return fmtNum(v);
  return v;
}
function fmtNum(n: number): string { return Number.isInteger(n) ? String(n) : String(Number(n.toPrecision(15))); }
function toBool(v: Value): boolean | SheetError {
  if (isErr(v)) return v;
  if (typeof v === 'boolean') return v;
  if (v === null) return false;
  if (typeof v === 'number') return v !== 0;
  const u = v.toUpperCase();
  if (u === 'TRUE') return true;
  if (u === 'FALSE') return false;
  return ERR.value();
}
const rank = (v: Value): number => (typeof v === 'number' || v === null ? 0 : typeof v === 'string' ? 1 : 2);

/** Excel's ordering: numbers < text < booleans, text compared case-insensitively. */
function compareValues(a: Value, b: Value): number {
  if (a === null) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0;
  if (b === null) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0;
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  if (typeof a === 'string') { const x = a.toLowerCase(); const y = (b as string).toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; }
  const x = Number(a); const y = Number(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

/* ------------------------------------------------------------------ dates */

const EPOCH = Date.UTC(1899, 11, 30);
export const dateToSerial = (y: number, m: number, d: number): number => Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86400000);
export const serialToDate = (n: number): Date => new Date(EPOCH + Math.floor(n) * 86400000);

function formatText(v: Value, fmt: string): string {
  const n = toNum(v);
  const f = fmt;
  if (/[ymd]/i.test(f) && !isErr(n)) {
    const d = serialToDate(n);
    const pad = (x: number, w = 2) => String(x).padStart(w, '0');
    return f.replace(/yyyy|yy|mmmm|mmm|mm|m|dd|d/gi, (t) => {
      switch (t.toLowerCase()) {
        case 'yyyy': return String(d.getUTCFullYear());
        case 'yy': return pad(d.getUTCFullYear() % 100);
        case 'mmmm': return d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
        case 'mmm': return d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
        case 'mm': return pad(d.getUTCMonth() + 1);
        case 'm': return String(d.getUTCMonth() + 1);
        case 'dd': return pad(d.getUTCDate());
        default: return String(d.getUTCDate());
      }
    });
  }
  if (isErr(n)) return toStr(v);
  const pct = f.endsWith('%');
  const body = pct ? f.slice(0, -1) : f;
  const decimals = (body.split('.')[1] ?? '').replace(/[^0#]/g, '').length;
  const comma = body.includes(',');
  const x = pct ? n * 100 : n;
  let s = Math.abs(x).toFixed(decimals);
  if (comma) { const [i, d] = s.split('.'); s = i!.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : ''); }
  const lead = /^0+/.exec(body.replace(/[#,]/g, ''));
  if (lead && !comma) { const [i, d] = s.split('.'); s = i!.padStart(lead[0].length, '0') + (d ? '.' + d : ''); }
  return (x < 0 && Number(s.replace(/,/g, '')) !== 0 ? '-' : '') + s + (pct ? '%' : '');
}

/* ------------------------------------------------------------------ the workbook */

type Fn = (args: Matrix[] | Value[], ctx: EvalCtx, nodes: Node[]) => Value | Matrix;

interface EvalCtx { wb: Workbook; sheet: string }

export class Workbook {
  private memo = new Map<string, Value>();
  private visiting = new Set<string>();
  private parsed = new Map<string, Node | SheetError>();
  readonly sheetNames: string[];
  constructor(public data: WorkbookData) { this.sheetNames = Object.keys(data.sheets); }

  get activeSheet(): string { return this.data.active ?? this.sheetNames[0] ?? 'Sheet1'; }
  raw(sheet: string, addr: string): CellValue | undefined { return this.data.sheets[sheet]?.[addr.replace(/\$/g, '').toUpperCase()]; }
  hasSheet(name: string): boolean { return this.sheetNames.some((n) => n.toLowerCase() === name.toLowerCase()); }
  private resolveSheet(name: string | undefined, fallback: string): string | SheetError {
    if (!name) return fallback;
    const found = this.sheetNames.find((n) => n.toLowerCase() === name.toLowerCase());
    return found ?? ERR.ref();
  }

  /** The computed value of one cell. */
  value(sheet: string, addr: string): Value {
    const key = `${sheet}!${addr.replace(/\$/g, '').toUpperCase()}`;
    if (this.memo.has(key)) return this.memo.get(key)!;
    if (this.visiting.has(key)) return new SheetError('#CIRCULAR!');
    const raw = this.raw(sheet, addr);
    let out: Value;
    if (raw === undefined) out = null;
    else if (typeof raw === 'string' && raw.startsWith('=')) {
      this.visiting.add(key);
      try {
        let node = this.parsed.get(key);
        if (!node) { try { node = parseFormula(raw); } catch { node = ERR.name(); } this.parsed.set(key, node); }
        if (isErr(node)) out = node;
        else { const r = this.evalNode(node, { wb: this, sheet }); out = Array.isArray(r) ? (r[0]?.[0] ?? null) : r; }
      } finally { this.visiting.delete(key); }
    } else out = raw;
    this.memo.set(key, out);
    return out;
  }

  /** Every cell's computed value, for display. */
  snapshot(): Record<string, Record<string, Value>> {
    const out: Record<string, Record<string, Value>> = {};
    for (const s of this.sheetNames) { out[s] = {}; for (const a of Object.keys(this.data.sheets[s]!)) out[s]![a] = this.value(s, a); }
    return out;
  }

  /** The values of a range like `Sheet1!A1:B3` (or a single cell). */
  rangeValues(ref: string, defaultSheet = this.activeSheet): Matrix | SheetError {
    let sheet = defaultSheet; let r = ref;
    if (ref.includes('!')) { const i = ref.lastIndexOf('!'); const sh = this.resolveSheet(ref.slice(0, i).replace(/^'|'$/g, ''), defaultSheet); if (isErr(sh)) return sh; sheet = sh; r = ref.slice(i + 1); }
    const cells = expandRange(r);
    if (!cells) return ERR.ref();
    return cells.map((row) => row.map((a) => this.value(sheet, a)));
  }

  /* ---- evaluation */
  private evalNode(n: Node, ctx: EvalCtx): Value | Matrix {
    switch (n.t) {
      case 'num': return n.v;
      case 'str': return n.v;
      case 'bool': return n.v;
      case 'err': return n.e;
      case 'ref': { const sh = this.resolveSheet(n.sheet, ctx.sheet); return isErr(sh) ? sh : this.value(sh, n.addr); }
      case 'range': {
        const sh = this.resolveSheet(n.sheet, ctx.sheet); if (isErr(sh)) return sh;
        const cells = expandRange(`${n.a}:${n.b}`)!;
        return cells.map((row) => row.map((a) => this.value(sh, a)));
      }
      case 'un': { const v = this.scalar(this.evalNode(n.x, ctx)); const x = toNum(v); return isErr(x) ? x : n.op === '-' ? -x : x; }
      case 'pct': { const x = toNum(this.scalar(this.evalNode(n.x, ctx))); return isErr(x) ? x : x / 100; }
      case 'bin': return this.binary(n.op, this.scalar(this.evalNode(n.l, ctx)), this.scalar(this.evalNode(n.r, ctx)));
      case 'call': {
        const fn = FUNCTIONS[n.name];
        if (!fn) return ERR.name();
        const args = n.args.map((a) => this.evalNode(a, ctx));
        return fn(args as Value[], ctx, n.args);
      }
    }
  }

  scalar(v: Value | Matrix): Value { return Array.isArray(v) ? (v[0]?.[0] ?? null) : v; }

  private binary(op: string, l: Value, r: Value): Value {
    if (isErr(l)) return l;
    if (isErr(r)) return r;
    if (op === '&') return toStr(l) + toStr(r);
    if (['=', '<>', '<', '>', '<=', '>='].includes(op)) {
      const c = compareValues(l, r);
      return op === '=' ? c === 0 : op === '<>' ? c !== 0 : op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0;
    }
    const a = toNum(l); const b = toNum(r);
    if (isErr(a)) return a;
    if (isErr(b)) return b;
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? ERR.div0() : a / b;
      case '^': { const p = Math.pow(a, b); return Number.isFinite(p) ? p : ERR.num(); }
    }
    return ERR.value();
  }
}

/* ------------------------------------------------------------------ function library */

const flat = (args: (Value | Matrix)[]): Value[] => args.flatMap((a) => (Array.isArray(a) ? a.flat() : [a]));
/** Numbers for aggregate functions: in ranges, text/blank/boolean are ignored; a direct argument must coerce. */
function numbers(args: (Value | Matrix)[]): number[] | SheetError {
  const out: number[] = [];
  for (const a of args) {
    if (Array.isArray(a)) { for (const v of a.flat()) { if (isErr(v)) return v; if (typeof v === 'number') out.push(v); } }
    else { if (isErr(a)) return a; if (a === null) continue; const n = toNum(a); if (isErr(n)) return n; out.push(n); }
  }
  return out;
}
const num = (v: Value | Matrix): number | SheetError => toNum(Array.isArray(v) ? (v[0]?.[0] ?? null) : v);

/** Excel criteria: a number/text for equality, or an operator prefix (">5", "<>x", "a*"). */
function criterion(c: Value): (v: Value) => boolean {
  if (typeof c === 'number') return (v) => typeof v === 'number' && v === c;
  if (typeof c === 'boolean') return (v) => v === c;
  if (c === null) return (v) => v === null || v === '';
  if (isErr(c)) return () => false;
  const m = /^(<=|>=|<>|=|<|>)?(.*)$/s.exec(c)!;
  const op = m[1] ?? '='; const rest = m[2]!;
  const asNum = rest.trim() !== '' && !isNaN(Number(rest)) ? Number(rest) : null;
  if (asNum !== null) return (v) => {
    const x = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)) ? Number(v) : null;
    if (x === null) return op === '<>';
    return op === '=' ? x === asNum : op === '<>' ? x !== asNum : op === '<' ? x < asNum : op === '>' ? x > asNum : op === '<=' ? x <= asNum : x >= asNum;
  };
  const wild = new RegExp('^' + rest.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
  return (v) => { const s = v === null ? '' : toStr(v); const hit = wild.test(s); return op === '<>' ? !hit : op === '=' ? hit : (op === '<' ? s.toLowerCase() < rest.toLowerCase() : op === '>' ? s.toLowerCase() > rest.toLowerCase() : op === '<=' ? s.toLowerCase() <= rest.toLowerCase() : s.toLowerCase() >= rest.toLowerCase()); };
}

/** Rows where every (range, criterion) pair matches. */
function matchingIndexes(pairs: [Matrix, Value][]): number[] | SheetError {
  if (!pairs.length) return ERR.value();
  const first = pairs[0]![0].flat();
  const out: number[] = [];
  const preds = pairs.map(([r, c]) => ({ cells: r.flat(), test: criterion(c) }));
  if (preds.some((p) => p.cells.length !== first.length)) return ERR.value();
  for (let i = 0; i < first.length; i++) if (preds.every((p) => p.test(p.cells[i]!))) out.push(i);
  return out;
}
const asMatrix = (v: Value | Matrix): Matrix => (Array.isArray(v) ? v : [[v]]);

function roundTo(x: number, d: number, mode: 'half' | 'up' | 'down'): number {
  const f = Math.pow(10, d);
  const y = x * f;
  const eps = 1e-9;
  const r = mode === 'half' ? Math.sign(y) * Math.floor(Math.abs(y) + 0.5 + eps) : mode === 'up' ? Math.sign(y) * Math.ceil(Math.abs(y) - eps) : Math.sign(y) * Math.floor(Math.abs(y) + eps);
  return r / f;
}

const FUNCTIONS: Record<string, Fn> = {
  SUM: (a) => { const n = numbers(a); return isErr(n) ? n : n.reduce((x, y) => x + y, 0); },
  AVERAGE: (a) => { const n = numbers(a); return isErr(n) ? n : n.length ? n.reduce((x, y) => x + y, 0) / n.length : ERR.div0(); },
  MIN: (a) => { const n = numbers(a); return isErr(n) ? n : n.length ? Math.min(...n) : 0; },
  MAX: (a) => { const n = numbers(a); return isErr(n) ? n : n.length ? Math.max(...n) : 0; },
  COUNT: (a) => { let c = 0; for (const v of flat(a)) if (typeof v === 'number') c++; return c; },
  COUNTA: (a) => flat(a).filter((v) => v !== null && v !== '').length,
  COUNTBLANK: (a) => flat(a).filter((v) => v === null || v === '').length,
  MEDIAN: (a) => { const n = numbers(a); if (isErr(n)) return n; if (!n.length) return ERR.num(); const s = [...n].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; },
  MODE: (a) => { const n = numbers(a); if (isErr(n)) return n; const c = new Map<number, number>(); for (const x of n) c.set(x, (c.get(x) ?? 0) + 1); let best: number | null = null; let bc = 1; for (const x of n) if ((c.get(x) ?? 0) > bc) { best = x; bc = c.get(x)!; } return best ?? ERR.na(); },
  'STDEV': (a) => { const n = numbers(a); if (isErr(n)) return n; if (n.length < 2) return ERR.div0(); const m = n.reduce((x, y) => x + y, 0) / n.length; return Math.sqrt(n.reduce((s, x) => s + (x - m) ** 2, 0) / (n.length - 1)); },
  'STDEV.S': (a, c, nd) => FUNCTIONS.STDEV!(a, c, nd),
  'STDEV.P': (a) => { const n = numbers(a); if (isErr(n)) return n; if (!n.length) return ERR.div0(); const m = n.reduce((x, y) => x + y, 0) / n.length; return Math.sqrt(n.reduce((s, x) => s + (x - m) ** 2, 0) / n.length); },
  VAR: (a) => { const n = numbers(a); if (isErr(n)) return n; if (n.length < 2) return ERR.div0(); const m = n.reduce((x, y) => x + y, 0) / n.length; return n.reduce((s, x) => s + (x - m) ** 2, 0) / (n.length - 1); },
  'VAR.S': (a, c, nd) => FUNCTIONS.VAR!(a, c, nd),
  'VAR.P': (a) => { const n = numbers(a); if (isErr(n)) return n; if (!n.length) return ERR.div0(); const m = n.reduce((x, y) => x + y, 0) / n.length; return n.reduce((s, x) => s + (x - m) ** 2, 0) / n.length; },
  LARGE: (a) => { const n = numbers([a[0]!]); const k = num(a[1]!); if (isErr(n)) return n; if (isErr(k)) return k; const s = [...n].sort((x, y) => y - x); return k >= 1 && k <= s.length ? s[k - 1]! : ERR.num(); },
  SMALL: (a) => { const n = numbers([a[0]!]); const k = num(a[1]!); if (isErr(n)) return n; if (isErr(k)) return k; const s = [...n].sort((x, y) => x - y); return k >= 1 && k <= s.length ? s[k - 1]! : ERR.num(); },
  RANK: (a) => { const x = num(a[0]!); const n = numbers([a[1]!]); if (isErr(x)) return x; if (isErr(n)) return n; const asc = a[2] !== undefined && num(a[2]) !== 0; if (!n.includes(x)) return ERR.na(); return 1 + n.filter((y) => (asc ? y < x : y > x)).length; },
  CORREL: (a) => {
    const x = asMatrix(a[0]!).flat(); const y = asMatrix(a[1]!).flat();
    if (x.length !== y.length) return ERR.na();
    const pairs = x.map((v, i) => [v, y[i]!] as const).filter(([p, q]) => typeof p === 'number' && typeof q === 'number') as [number, number][];
    if (pairs.length < 2) return ERR.div0();
    const mx = pairs.reduce((s, [p]) => s + p, 0) / pairs.length; const my = pairs.reduce((s, [, q]) => s + q, 0) / pairs.length;
    const sxy = pairs.reduce((s, [p, q]) => s + (p - mx) * (q - my), 0); const sxx = pairs.reduce((s, [p]) => s + (p - mx) ** 2, 0); const syy = pairs.reduce((s, [, q]) => s + (q - my) ** 2, 0);
    return sxx === 0 || syy === 0 ? ERR.div0() : sxy / Math.sqrt(sxx * syy);
  },
  SUMPRODUCT: (a) => { const ms = a.map((m) => asMatrix(m).flat()); if (ms.some((m) => m.length !== ms[0]!.length)) return ERR.value(); let s = 0; for (let i = 0; i < ms[0]!.length; i++) { let p = 1; for (const m of ms) { const v = m[i]!; if (isErr(v)) return v; p *= typeof v === 'number' ? v : 0; } s += p; } return s; },
  ROUND: (a) => { const x = num(a[0]!); const d = a[1] === undefined ? 0 : num(a[1]); return isErr(x) ? x : isErr(d) ? d : roundTo(x, d, 'half'); },
  ROUNDUP: (a) => { const x = num(a[0]!); const d = a[1] === undefined ? 0 : num(a[1]); return isErr(x) ? x : isErr(d) ? d : roundTo(x, d, 'up'); },
  ROUNDDOWN: (a) => { const x = num(a[0]!); const d = a[1] === undefined ? 0 : num(a[1]); return isErr(x) ? x : isErr(d) ? d : roundTo(x, d, 'down'); },
  INT: (a) => { const x = num(a[0]!); return isErr(x) ? x : Math.floor(x); },
  ABS: (a) => { const x = num(a[0]!); return isErr(x) ? x : Math.abs(x); },
  MOD: (a) => { const x = num(a[0]!); const y = num(a[1]!); if (isErr(x)) return x; if (isErr(y)) return y; return y === 0 ? ERR.div0() : x - y * Math.floor(x / y); },
  POWER: (a) => { const x = num(a[0]!); const y = num(a[1]!); if (isErr(x)) return x; if (isErr(y)) return y; const p = Math.pow(x, y); return Number.isFinite(p) ? p : ERR.num(); },
  SQRT: (a) => { const x = num(a[0]!); return isErr(x) ? x : x < 0 ? ERR.num() : Math.sqrt(x); },
  IF: (a) => { const c = toBool(Array.isArray(a[0]) ? (a[0][0]?.[0] ?? null) : (a[0] as Value)); if (isErr(c)) return c; const pick = c ? a[1] : a[2]; return pick === undefined ? (c ? true : false) : (pick as Value); },
  IFS: (a) => { for (let i = 0; i + 1 < a.length; i += 2) { const c = toBool(a[i] as Value); if (isErr(c)) return c; if (c) return a[i + 1] as Value; } return ERR.na(); },
  AND: (a) => { for (const v of flat(a)) { if (v === null || v === '') continue; const b = toBool(v); if (isErr(b)) return b; if (!b) return false; } return true; },
  OR: (a) => { let any = false; for (const v of flat(a)) { if (v === null || v === '') continue; const b = toBool(v); if (isErr(b)) return b; if (b) any = true; } return any; },
  NOT: (a) => { const b = toBool(a[0] as Value); return isErr(b) ? b : !b; },
  IFERROR: (a) => (isErr(a[0] as Value) ? (a[1] as Value) : (a[0] as Value)),
  IFNA: (a) => (isErr(a[0] as Value) && (a[0] as SheetError).code === '#N/A' ? (a[1] as Value) : (a[0] as Value)),
  ISBLANK: (a) => (a[0] as Value) === null,
  ISNUMBER: (a) => typeof a[0] === 'number',
  ISTEXT: (a) => typeof a[0] === 'string',
  ISERROR: (a) => isErr(a[0] as Value),
  CHOOSE: (a) => { const i = num(a[0]!); if (isErr(i)) return i; const pick = a[Math.floor(i)]; return Math.floor(i) >= 1 && pick !== undefined ? (pick as Value) : ERR.value(); },
  CONCAT: (a) => flat(a).map(toStr).join(''),
  CONCATENATE: (a) => flat(a).map(toStr).join(''),
  TEXTJOIN: (a) => { const d = toStr(a[0] as Value); const skip = toBool(a[1] as Value) === true; const parts = flat(a.slice(2)).filter((v) => !skip || (v !== null && v !== '')); return parts.map(toStr).join(d); },
  LEFT: (a) => { const s = toStr(a[0] as Value); const n = a[1] === undefined ? 1 : num(a[1]); return isErr(n) ? n : s.slice(0, Math.max(0, n)); },
  RIGHT: (a) => { const s = toStr(a[0] as Value); const n = a[1] === undefined ? 1 : num(a[1]); return isErr(n) ? n : n <= 0 ? '' : s.slice(-n); },
  MID: (a) => { const s = toStr(a[0] as Value); const st = num(a[1]!); const n = num(a[2]!); if (isErr(st)) return st; if (isErr(n)) return n; return st < 1 ? ERR.value() : s.slice(st - 1, st - 1 + n); },
  LEN: (a) => toStr(a[0] as Value).length,
  UPPER: (a) => toStr(a[0] as Value).toUpperCase(),
  LOWER: (a) => toStr(a[0] as Value).toLowerCase(),
  PROPER: (a) => toStr(a[0] as Value).toLowerCase().replace(/(^|[^a-z])([a-z])/g, (_, p, c) => p + c.toUpperCase()),
  TRIM: (a) => toStr(a[0] as Value).trim().replace(/\s+/g, ' '),
  SUBSTITUTE: (a) => { const s = toStr(a[0] as Value); const from = toStr(a[1] as Value); const to = toStr(a[2] as Value); if (!from) return s; if (a[3] !== undefined) { const k = num(a[3]); if (isErr(k)) return k; let idx = -1; for (let i = 0; i < k; i++) { idx = s.indexOf(from, idx + 1); if (idx < 0) return s; } return s.slice(0, idx) + to + s.slice(idx + from.length); } return s.split(from).join(to); },
  FIND: (a) => { const i = toStr(a[1] as Value).indexOf(toStr(a[0] as Value), a[2] === undefined ? 0 : Number(num(a[2])) - 1); return i < 0 ? ERR.value() : i + 1; },
  SEARCH: (a) => { const i = toStr(a[1] as Value).toLowerCase().indexOf(toStr(a[0] as Value).toLowerCase(), a[2] === undefined ? 0 : Number(num(a[2])) - 1); return i < 0 ? ERR.value() : i + 1; },
  VALUE: (a) => toNum(a[0] as Value),
  TEXT: (a) => formatText(a[0] as Value, toStr(a[1] as Value)),
  DATE: (a) => { const y = num(a[0]!); const m = num(a[1]!); const d = num(a[2]!); if (isErr(y)) return y; if (isErr(m)) return m; if (isErr(d)) return d; return dateToSerial(y, m, d); },
  YEAR: (a) => { const n = num(a[0]!); return isErr(n) ? n : serialToDate(n).getUTCFullYear(); },
  MONTH: (a) => { const n = num(a[0]!); return isErr(n) ? n : serialToDate(n).getUTCMonth() + 1; },
  DAY: (a) => { const n = num(a[0]!); return isErr(n) ? n : serialToDate(n).getUTCDate(); },
  WEEKDAY: (a) => { const n = num(a[0]!); return isErr(n) ? n : serialToDate(n).getUTCDay() + 1; },
  /* ---- lookups */
  VLOOKUP: (a) => {
    const key = a[0] as Value; const table = asMatrix(a[1]!); const col = num(a[2]!); const approx = a[3] === undefined ? true : toBool(a[3] as Value);
    if (isErr(key)) return key; if (isErr(col)) return col; if (isErr(approx)) return approx;
    if (col < 1 || col > (table[0]?.length ?? 0)) return ERR.ref();
    if (!approx) { const row = table.find((r) => compareValues(r[0] ?? null, key) === 0 && rank(r[0] ?? null) === rank(key)); return row ? (row[col - 1] ?? null) : ERR.na(); }
    let hit: Value[] | undefined;
    for (const r of table) { if (compareValues(r[0] ?? null, key) <= 0 && rank(r[0] ?? null) === rank(key)) hit = r; else if (compareValues(r[0] ?? null, key) > 0) break; }
    return hit ? (hit[col - 1] ?? null) : ERR.na();
  },
  HLOOKUP: (a) => {
    const key = a[0] as Value; const table = asMatrix(a[1]!); const row = num(a[2]!); const approx = a[3] === undefined ? true : toBool(a[3] as Value);
    if (isErr(key)) return key; if (isErr(row)) return row; if (isErr(approx)) return approx;
    if (row < 1 || row > table.length) return ERR.ref();
    const head = table[0] ?? [];
    let idx = -1;
    if (!approx) idx = head.findIndex((v) => compareValues(v, key) === 0 && rank(v) === rank(key));
    else for (let i = 0; i < head.length; i++) { if (compareValues(head[i]!, key) <= 0) idx = i; else break; }
    return idx < 0 ? ERR.na() : (table[row - 1]![idx] ?? null);
  },
  MATCH: (a) => {
    const key = a[0] as Value; const arr = asMatrix(a[1]!).flat(); const t = a[2] === undefined ? 1 : num(a[2]);
    if (isErr(key)) return key; if (isErr(t)) return t;
    if (t === 0) { const i = arr.findIndex((v) => compareValues(v, key) === 0 && rank(v) === rank(key)); return i < 0 ? ERR.na() : i + 1; }
    if (t > 0) { let idx = -1; for (let i = 0; i < arr.length; i++) { if (rank(arr[i]!) === rank(key) && compareValues(arr[i]!, key) <= 0) idx = i; else if (compareValues(arr[i]!, key) > 0) break; } return idx < 0 ? ERR.na() : idx + 1; }
    let idx = -1; for (let i = 0; i < arr.length; i++) { if (rank(arr[i]!) === rank(key) && compareValues(arr[i]!, key) >= 0) idx = i; else break; }
    return idx < 0 ? ERR.na() : idx + 1;
  },
  INDEX: (a) => {
    const m = asMatrix(a[0]!); const r = a[1] === undefined ? 0 : num(a[1]); const c = a[2] === undefined ? 0 : num(a[2]);
    if (isErr(r)) return r; if (isErr(c)) return c;
    let rr = r; let cc = c;
    if (a[2] === undefined) { if (m.length === 1) { rr = 1; cc = r; } else if ((m[0]?.length ?? 0) === 1) { rr = r; cc = 1; } }
    if (rr < 0 || cc < 0 || rr > m.length || cc > (m[0]?.length ?? 0)) return ERR.ref();
    if (rr === 0 || cc === 0) return ERR.value();
    return m[rr - 1]![cc - 1] ?? null;
  },
  XLOOKUP: (a) => {
    const key = a[0] as Value; const look = asMatrix(a[1]!).flat(); const ret = asMatrix(a[2]!).flat();
    if (isErr(key)) return key;
    const i = look.findIndex((v) => compareValues(v, key) === 0 && rank(v) === rank(key));
    if (i < 0) return a[3] !== undefined ? (a[3] as Value) : ERR.na();
    return ret[i] ?? null;
  },
  /* ---- conditional aggregates */
  COUNTIF: (a) => { const idx = matchingIndexes([[asMatrix(a[0]!), a[1] as Value]]); return isErr(idx) ? idx : idx.length; },
  COUNTIFS: (a) => { const pairs: [Matrix, Value][] = []; for (let i = 0; i + 1 < a.length; i += 2) pairs.push([asMatrix(a[i]!), a[i + 1] as Value]); const idx = matchingIndexes(pairs); return isErr(idx) ? idx : idx.length; },
  SUMIF: (a) => { const rng = asMatrix(a[0]!); const sumRange = a[2] === undefined ? rng : asMatrix(a[2]); const idx = matchingIndexes([[rng, a[1] as Value]]); if (isErr(idx)) return idx; const s = sumRange.flat(); return idx.reduce((t, i) => t + (typeof s[i] === 'number' ? (s[i] as number) : 0), 0); },
  SUMIFS: (a) => { const s = asMatrix(a[0]!).flat(); const pairs: [Matrix, Value][] = []; for (let i = 1; i + 1 < a.length; i += 2) pairs.push([asMatrix(a[i]!), a[i + 1] as Value]); const idx = matchingIndexes(pairs); if (isErr(idx)) return idx; return idx.reduce((t, i) => t + (typeof s[i] === 'number' ? (s[i] as number) : 0), 0); },
  AVERAGEIF: (a) => { const rng = asMatrix(a[0]!); const avgRange = a[2] === undefined ? rng : asMatrix(a[2]); const idx = matchingIndexes([[rng, a[1] as Value]]); if (isErr(idx)) return idx; const s = avgRange.flat(); const vals = idx.map((i) => s[i]).filter((v): v is number => typeof v === 'number'); return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : ERR.div0(); },
  AVERAGEIFS: (a) => { const s = asMatrix(a[0]!).flat(); const pairs: [Matrix, Value][] = []; for (let i = 1; i + 1 < a.length; i += 2) pairs.push([asMatrix(a[i]!), a[i + 1] as Value]); const idx = matchingIndexes(pairs); if (isErr(idx)) return idx; const vals = idx.map((i) => s[i]).filter((v): v is number => typeof v === 'number'); return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : ERR.div0(); },
  MAXIFS: (a) => { const s = asMatrix(a[0]!).flat(); const pairs: [Matrix, Value][] = []; for (let i = 1; i + 1 < a.length; i += 2) pairs.push([asMatrix(a[i]!), a[i + 1] as Value]); const idx = matchingIndexes(pairs); if (isErr(idx)) return idx; const vals = idx.map((i) => s[i]).filter((v): v is number => typeof v === 'number'); return vals.length ? Math.max(...vals) : 0; },
  MINIFS: (a) => { const s = asMatrix(a[0]!).flat(); const pairs: [Matrix, Value][] = []; for (let i = 1; i + 1 < a.length; i += 2) pairs.push([asMatrix(a[i]!), a[i + 1] as Value]); const idx = matchingIndexes(pairs); if (isErr(idx)) return idx; const vals = idx.map((i) => s[i]).filter((v): v is number => typeof v === 'number'); return vals.length ? Math.min(...vals) : 0; },
};

/** Functions the engine knows (for the Field Manual and for error messages). */
export const SUPPORTED_FUNCTIONS = Object.keys(FUNCTIONS).sort();

/** Formulas typed in a workbook, with their cell, for structural checks. */
export function formulasOf(data: WorkbookData): { sheet: string; cell: string; text: string }[] {
  const out: { sheet: string; cell: string; text: string }[] = [];
  for (const [sheet, cells] of Object.entries(data.sheets)) for (const [cell, v] of Object.entries(cells)) if (typeof v === 'string' && v.startsWith('=')) out.push({ sheet, cell, text: v });
  return out;
}

/** Shows a computed value the way a spreadsheet would. */
export function display(v: Value): string { return toStr(v); }
