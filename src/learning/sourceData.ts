/**
 * SOURCE DATA (pure): what the player is allowed to LOOK AT while working a lesson, derived from the lesson's own fixtures so the viewer shows the
 * exact data the code will run on (one source, no copy). Hidden twins (`works-b`, `*-edge`, `*-boss`) are what checks run against, so they are never
 * offered; neither are internal files. Everything here is plain data in, plain data out.
 */
import type { DatabaseDef, TableDoc } from '../content/databases';
import type { Fixtures } from '../content/schema';
import { apiCollections } from './web/apiData';

/** A database that exists to grade with, not to read. */
export const isHiddenDatabase = (id: string): boolean => /-(b|boss|edge)$/.test(id);

/** The databases a lesson may show: its `db` plus the ones in its fixtures (an `id:alias` fixture stands under its alias), never a hidden twin. */
export function visibleDatabases(fixtures?: Fixtures, db?: string): string[] {
  const ids = [db, ...(fixtures?.databases ?? []).map((d) => d.split(':')[0])];
  const seen = new Set<string>();
  for (const id of ids) if (id && !isHiddenDatabase(id) && id !== 'blank') seen.add(id);
  return [...seen];
}

export interface Relation { from: string; column: string; to: string }

/** Foreign keys, read from the column notes ("links to departments") that the schema browser has always shown, so they are never typed twice. */
export function relations(def: DatabaseDef): Relation[] {
  const out: Relation[] = [];
  const names = def.tables.map((t) => t.name);
  const target = (word: string): string | undefined => names.find((n) => n === word) ?? names.find((n) => n.startsWith(word));
  for (const t of def.tables) for (const c of t.columns) {
    const m = /links to (?:another )?(\w+)/.exec(c.note ?? '');
    const to = m && target(m[1]!);
    if (to) out.push({ from: t.name, column: c.name, to });
  }
  return out;
}

/** The SQL that fetches a few rows and the row count of every table, as one multi-statement script (results come back in the same order). */
export function sampleScript(tables: readonly TableDoc[], n = 5): string {
  return tables.map((t) => `SELECT * FROM "${t.name}" LIMIT ${n}; SELECT COUNT(*) FROM "${t.name}";`).join('\n');
}

export interface Table { header: string[]; rows: string[][] }

/** A small CSV reader (quotes, doubled quotes, commas and newlines inside quotes). */
export function parseCsv(text: string): Table {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  const t = text.replace(/\r\n?/g, '\n');
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!;
    if (quoted) { if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else quoted = false; } else cell += ch; }
    else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const [header = [], ...body] = rows.filter((r) => r.some((c) => c !== ''));
  return { header, rows: body };
}

export type FileView = { kind: 'csv'; table: Table; total: number } | { kind: 'json'; text: string; truncated: boolean } | { kind: 'text'; text: string; truncated: boolean };

const MAX_LINES = 24;
const clip = (s: string): { text: string; truncated: boolean } => { const lines = s.split('\n'); return lines.length > MAX_LINES ? { text: lines.slice(0, MAX_LINES).join('\n'), truncated: true } : { text: s, truncated: false }; };

/** How to show a fixture file: a CSV as a table (first rows), JSON pretty-printed, anything else as plain text. */
export function viewFile(path: string, text: string, rows = 8): FileView {
  if (/\.csv$/i.test(path)) { const t = parseCsv(text); return { kind: 'csv', table: { header: t.header, rows: t.rows.slice(0, rows) }, total: t.rows.length }; }
  if (/\.json$/i.test(path)) { try { return { kind: 'json', ...clip(JSON.stringify(JSON.parse(text), null, 2)) }; } catch { /* not valid JSON: show it as it is */ } }
  return { kind: 'text', ...clip(text) };
}

export interface ApiView { name: string; table: Table; total: number }

/** The in-game API's collections as the player's page will receive them (the visible data set only, never the hidden one). */
export function apiViews(rows = 5): ApiView[] {
  return Object.entries(apiCollections('a')).map(([name, list]) => {
    const header = Object.keys(list[0] ?? {});
    return { name, total: list.length, table: { header, rows: list.slice(0, rows).map((r) => header.map((h) => String(r[h] ?? ''))) } };
  });
}
