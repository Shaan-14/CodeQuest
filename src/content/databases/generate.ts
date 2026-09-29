/**
 * Deterministic data generation for the game's databases. Same seed -> same SQL, always, so
 * reference-query checks and tests are reproducible. A second seed produces a HIDDEN TWIN of each
 * database (same schema, different rows) that graders use to defeat hard-coded answers.
 */
export type Sql = string | number | null;

/** mulberry32: tiny, fast, deterministic PRNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rand = ReturnType<typeof rng>;
export const int = (r: Rand, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
export const pick = <T,>(r: Rand, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
export const money = (r: Rand, lo: number, hi: number) => Math.round((lo + r() * (hi - lo)) * 100) / 100;
export const chance = (r: Rand, p: number) => r() < p;

/** ISO date `offset` days after 2023-01-01. */
export function day(offset: number): string {
  const d = new Date(Date.UTC(2023, 0, 1 + offset));
  return d.toISOString().slice(0, 10);
}

const lit = (v: Sql): string => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`);

/** One multi-row INSERT statement. */
export function insert(table: string, columns: string[], rows: Sql[][]): string {
  if (!rows.length) return '';
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${rows.map((r) => '  (' + r.map(lit).join(', ') + ')').join(',\n')};\n`;
}

export const FIRST = ['Ada', 'Ben', 'Chloe', 'Dev', 'Elena', 'Farid', 'Grace', 'Hiro', 'Ines', 'Jon', 'Kira', 'Leo', 'Mara', 'Nico', 'Omar', 'Priya', 'Quinn', 'Rosa', 'Sam', 'Tara', 'Uma', 'Vik', 'Wren', 'Xavi', 'Yara', 'Zed'] as const;
export const LAST = ['Adler', 'Brooks', 'Chen', 'Diaz', 'Evans', 'Fox', 'Garcia', 'Hughes', 'Ito', 'Jones', 'Khan', 'Lopez', 'Moreau', 'Novak', 'Okafor', 'Patel', 'Quist', 'Reyes', 'Singh', 'Tan'] as const;

/** `count` distinct full names. */
export function names(r: Rand, count: number): string[] {
  const out = new Set<string>();
  while (out.size < count) out.add(`${pick(r, FIRST)} ${pick(r, LAST)}`);
  return [...out];
}
