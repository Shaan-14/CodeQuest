import { describe, expect, it } from 'vitest';
import { cast } from '../../content/play/cast';
import { HINTS } from '../../content/play/hints';
import { skills } from '../../content';
import { newSave } from '../../core/save';
import type { EvidenceRecord } from '../../learning/mastery';
import { trackOfSkillId } from '../../content/worlds';
import * as A from '../../game/actions';
import { getLesson } from '../../content';
import { remarkFor, standings } from './hints';

describe('progress-aware remarks', () => {
  it('only name people who exist, and say nothing that solves anything', () => {
    for (const h of HINTS) { for (const n of h.npcs) expect(cast.some((c) => c.id === n), `${h.id}: ${n}`).toBe(true); expect(h.line.length, h.id).toBeLessThan(300); }
    expect(new Set(HINTS.map((h) => h.id)).size).toBe(HINTS.length);
  });
  it('a fresh player hears nothing (nothing to remark on)', () => {
    const s = newSave();
    for (const n of cast) expect(remarkFor(s, n.id), n.id).toBeUndefined();
    expect(Object.values(standings(s)).every((x) => !x.strong && !x.begun && !x.trouble)).toBe(true);
  });
  it('strong in Python and untouched in SQL points at the Data Center, once', () => {
    const s = newSave();
    // a stand-in for real evidence: standings() is what decides, so test the rule through the hints table with a stub of it
    const stub = [{ ...HINTS.find((h) => h.id === 'py-to-sql')!, when: { untouched: ['sql' as const] } }];
    const r = remarkFor(s, 'juno', stub)!; expect(r.text).toContain('Data Center');
    s.play.seen['hint:py-to-sql'] = 'x'; expect(remarkFor(s, 'juno', stub)).toBeUndefined();
    expect(remarkFor(newSave(), 'dara', stub)).toBeUndefined(); // dara is not one of the people who say it
  });
});

describe('remarks read the real record', () => {
  const ev = (skillId: string, i: number): EvidenceRecord => ({ at: new Date(Date.now() - 86400000).toISOString(), challengeId: `x-${skillId}-${i}`, objectiveId: `x-${skillId}-${i}`, context: ['finance', 'science', 'retail', 'games'][i % 4]!, skillIds: [skillId], concepts: [], mode: 'challenge', difficulty: 3, passed: true, support: 'independent', hintsUsed: 0, lookups: 0, attemptNumber: 1, priorFailures: 0, project: false, timeMs: 1, executed: true } as EvidenceRecord);
  it('strong in Python and untouched in SQL: the Data Center is pointed out to the people who work with robots, and not to others', () => {
    let s = A.createPlayer(newSave(), 'Ada', 'wizard').save;
    const py = skills.filter((k) => trackOfSkillId(k.id) === 'python').slice(0, 3);
    s = { ...s, evidence: py.flatMap((k) => [0, 1, 2].map((i) => ev(k.id, i))) };
    expect(standings(s).python.strong).toBe(true);
    expect(standings(s).sql.begun).toBe(false);
    expect(remarkFor(s, 'juno')!.text).toContain('Data Center');
    expect(remarkFor(s, 'marisol')!.text).toContain('spreadsheet');
    // once SQL is begun the remark goes away
    const begun = A.completeLesson(s, 'sql-01-select').save;
    expect(getLesson('sql-01-select')).toBeDefined();
    expect(remarkFor(begun, 'juno')?.id).not.toBe('py-to-sql');
  });
});
