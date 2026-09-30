/** Executes every Phase 5 Field Manual example: R in webR, formulas in the spreadsheet engine, Git in the simulator. Python examples run in reference.test.ts. */
import { afterAll, describe, expect, it } from 'vitest';
import { reference } from './reference';
import { MANUAL_REPO, MANUAL_WORKBOOK } from './reference.pro';
import { RRunner } from '../learning/r/RRunner';
import { Workbook, isErr } from '../learning/sheet/engine';
import { replay } from '../learning/git/replay';
import { fromSnapshot } from '../learning/git/repo';

const r = new RRunner();
afterAll(async () => { await (r as unknown as { webR?: { close(): void } }).webR?.close(); });

describe('Field Manual: R, spreadsheets, Git', () => {
  it('every R example runs in real R without error', async () => {
    for (const e of reference.filter((x) => x.language === 'r')) {
      const res = await r.run({ language: 'r', code: e.example, timeoutMs: 120000 });
      expect(res.error, `${e.id}: ${res.error}`).toBe('');
      expect(res.ok, e.id).toBe(true);
    }
  }, 600000);
  it('every spreadsheet example formula evaluates without an error value', () => {
    for (const e of reference.filter((x) => x.language === 'sheet')) {
      const lines = e.example.split('\n').filter((l) => l.startsWith('='));
      expect(lines.length, e.id).toBeGreaterThan(0);
      lines.forEach((f, i) => {
        const data = JSON.parse(JSON.stringify(MANUAL_WORKBOOK)) as { sheets: { Sheet1: Record<string, string | number> } };
        data.sheets.Sheet1[`Z${i + 1}`] = f;
        const v = new Workbook(data as never).value('Sheet1', `Z${i + 1}`);
        expect(isErr(v), `${e.id}: ${f} -> ${String(v)}`).toBe(false);
      });
    }
  });
  it('every Git example runs in the simulator without a failed command', () => {
    for (const e of reference.filter((x) => x.language === 'git')) {
      const { steps } = replay(fromSnapshot(MANUAL_REPO as never), e.example);
      for (const s of steps) expect(s.ok, `${e.id}: ${s.line} -> ${s.err}`).toBe(true);
    }
  });
  it('the new worlds are searchable in the manual', () => {
    const ids = (q: string, lang: string) => reference.filter((e) => e.language === lang && `${e.title} ${e.keywords.join(' ')} ${e.summary}`.toLowerCase().includes(q)).map((e) => e.id);
    expect(ids('left join', 'r')).toContain('r-merge');
    expect(ids('quarter', 'sheet')).toContain('xl-dates');
    expect(ids('conflict', 'git')).toContain('git-merge');
    expect(ids('seed', 'python')).toContain('py-random-rng');
  });
});
