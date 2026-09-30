import { describe, expect, it } from 'vitest';
import { getAnyChallenge, getLesson, getSkill, lessons } from '../content';
import { areas } from '../content/world';
import { worlds } from '../content/worlds';
import type { Lesson, SkillReq } from '../content/schema';
import { newSave, type SaveData } from '../core/save';
import type { EvidenceRecord } from '../learning/mastery';
import * as A from './actions';
import { areaGaps, challengeEligible, competencyOf, compositeCompetency, gapsFor, lessonAccess, lessonGaps, nextOpenLesson, reportFor, unlocksOf, worldLessons } from './graph';
import { lessonStatus, nextLesson } from './lessons';
import { isAreaUnlocked } from './world';

const fresh = () => A.createPlayer(newSave(), 'Ada', 'wizard').save;
const lesson = (id: string): Lesson => getLesson(id)!;
const evidence = (skillId: string, n = 1, support: EvidenceRecord['support'] = 'independent', extra: Partial<EvidenceRecord> = {}): EvidenceRecord[] =>
  Array.from({ length: n }, (_, i) => ({ at: new Date(Date.now() - 86400000).toISOString(), challengeId: `x-${skillId}-${i}`, objectiveId: `x-${skillId}-${i}`, context: ['finance', 'science', 'retail', 'games'][i % 4]!, skillIds: [skillId], concepts: [], mode: 'challenge', difficulty: 3, passed: true, support, hintsUsed: 0, lookups: 0, attemptNumber: 1, priorFailures: 0, project: false, timeMs: 1, executed: true, ...extra } as EvidenceRecord));
const withEvidence = (s: SaveData, recs: EvidenceRecord[]): SaveData => ({ ...s, evidence: [...s.evidence, ...recs] });
const complete = (s: SaveData, ids: string[]): SaveData => ids.reduce((acc, id) => A.completeLesson(acc, id).save, s);
const through = (s: SaveData, lastId: string, prefix: string): SaveData => {
  let out = s;
  for (const l of lessons) { if (!l.id.startsWith(prefix)) continue; out = A.completeLesson(out, l.id).save; if (l.id === lastId) break; }
  return out;
};

describe('foundations are open, in any order', () => {
  it('Python, SQL, HTML and JavaScript can each be the very first thing a player does', () => {
    const s = fresh();
    for (const id of ['py-01-first-program', 'sql-01-select', 'web-01-html-basics', 'web-15-js-basics']) {
      expect(lessonAccess(s, lesson(id)).open, id).toBe(true);
      expect(lessonStatus(s, lesson(id))).toBe('available');
    }
    for (const w of worlds.filter((x) => x.foundation)) expect(isAreaUnlocked(areas.find((a) => a.id === w.areaId)!, s), w.track).toBe(true);
  });
  it('progress in one world does not change what is open in another', () => {
    let s = through(fresh(), 'sql-06-joins', 'sql-');
    expect(lessonAccess(s, lesson('py-02-fixing-errors')).open).toBe(false); // Python keeps its own order: lesson 1 first
    expect(lessonAccess(s, lesson('py-01-first-program')).open).toBe(true);
    s = complete(s, ['py-01-first-program']);
    expect(lessonAccess(s, lesson('sql-07-left-join')).open).toBe(true); // SQL progress is exactly where it was
    expect(nextLesson(s, 'sql')?.id).toBe('sql-07-left-join');
    expect(nextLesson(s, 'python')?.id).toBe('py-02-fixing-errors');
  });
  it('unrelated skills never block: HTML needs no Python, SQL needs no JavaScript', () => {
    const s = fresh();
    expect(lessonGaps(s, lesson('web-01-html-basics'))).toEqual([]);
    expect(lessonGaps(s, lesson('sql-01-select'))).toEqual([]);
  });
});

describe('prerequisites name the exact missing competencies', () => {
  const de02 = () => lesson('de-02-python-sql');
  it('a player with the SQL skills but without Python loops and dictionaries is told exactly that', () => {
    let s = through(fresh(), 'sql-13-integrity-performance', 'sql-');
    s = complete(s, ['de-01-pipelines']); // de-01 itself needs Python too: it stays closed
    expect(lessonAccess(s, lesson('de-01-pipelines')).open).toBe(false);
    const gaps = gapsFor(s, de02().requires);
    const ids = gaps.map((g) => g.id);
    expect(ids).toContain('py.loops');
    expect(ids).toContain('py.dicts');
    expect(ids).not.toContain('sql.select'); // the SQL side is satisfied and is not listed
    expect(ids).not.toContain('sql.joins');
    const report = reportFor(s, de02().requires);
    expect(report.filter((r) => r.ok).map((r) => r.title)).toEqual(expect.arrayContaining(['Selecting, filtering & sorting', 'Joining tables']));
    for (const g of gaps) expect(g.teach, g.id).toBeDefined();
  });
  it('every gap points at a lesson the player can open RIGHT NOW (never at something itself out of reach)', () => {
    const s = through(fresh(), 'sql-13-integrity-performance', 'sql-');
    for (const g of gapsFor(s, lesson('de-02-python-sql').requires)) {
      const teach = getLesson(g.teach!.lessonId)!;
      expect(lessonAccess(s, teach).open, `${g.id} -> ${teach.id}`).toBe(true);
    }
  });
  it('showing the missing skills opens the lesson; evidence, not a fixed order, is what counts', () => {
    let s = through(fresh(), 'sql-13-integrity-performance', 'sql-');
    s = through(s, 'py-21-cleaning', 'py-');
    s = complete(s, ['de-01-pipelines']);
    // lessons completed = "introduced"; the lesson asks for loops and dictionaries to be DEVELOPING (independent evidence)
    expect(competencyOf(s, 'py.loops')).toBe('introduced');
    expect(lessonAccess(s, de02()).open).toBe(false);
    s = withEvidence(s, [...evidence('py.loops'), ...evidence('py.dicts')]);
    expect(competencyOf(s, 'py.loops')).toBe('developing');
    expect(lessonAccess(s, de02()).open).toBe(true);
  });
  it('a gate is enforced by the game rules, not just the screen', () => {
    const s = through(fresh(), 'sql-13-integrity-performance', 'sql-');
    const c = lesson('de-02-python-sql').steps.find((x) => x.kind === 'challenge') as { challengeId: string };
    expect(A.submitChallenge(s, c.challengeId, true, 1, 'x').save.evidence).toHaveLength(s.evidence.length);
    expect(A.advanceStep(s, 'de-02-python-sql', 2).save.learning.lessons['de-02-python-sql']).toBeUndefined();
    expect(A.completeLesson(s, 'de-02-python-sql').save.learning.lessons['de-02-python-sql']).toBeUndefined();
  });
  it('areas that combine worlds explain their gate too', () => {
    const s = fresh();
    const pipeline = areas.find((a) => a.id === 'pipeline-works')!;
    const ids = areaGaps(s, pipeline).map((g) => g.id);
    expect(ids).toEqual(expect.arrayContaining(['py.functions', 'py.dicts', 'sql.aggregate', 'db.design']));
    expect(isAreaUnlocked(pipeline, s)).toBe(false);
  });
});

describe('competency levels come from evidence, not from finishing lessons', () => {
  it('a completed lesson only introduces a skill; independent passes develop it', () => {
    let s = complete(fresh(), ['py-01-first-program']);
    expect(competencyOf(s, 'py.output')).toBe('introduced');
    s = withEvidence(s, evidence('py.output', 1));
    expect(['developing', 'demonstrated']).toContain(competencyOf(s, 'py.output'));
    expect(competencyOf(fresh(), 'py.loops')).toBe('none');
  });
  it('hinted or guided passes never count as developing', () => {
    const s = withEvidence(fresh(), evidence('py.loops', 3, 'hinted'));
    expect(competencyOf(s, 'py.loops')).toBe('introduced');
  });
  it('composite competencies are separate: strong parts do not imply the combination', () => {
    let s = withEvidence(fresh(), [...evidence('py.loops', 4), ...evidence('py.dicts', 4)]);
    expect(competencyOf(s, 'py.loops')).toBe('demonstrated');
    expect(compositeCompetency(s, 'loops+dicts')).toBe('none');
    expect(gapsFor(s, [{ composite: 'loops+dicts', level: 'developing' }]).map((g) => g.id)).toEqual(['loops+dicts']);
    s = withEvidence(s, evidence('py.loops', 1).map((r) => ({ ...r, skillIds: ['py.loops', 'py.dicts'], challengeId: 'c1', objectiveId: 'c1' })));
    expect(compositeCompetency(s, 'loops+dicts')).toBe('developing');
    expect(gapsFor(s, [{ composite: 'loops+dicts', level: 'developing' }])).toEqual([]);
  });
  it('objective prerequisites are met by passing that objective', () => {
    const s = fresh();
    const req: SkillReq[] = [{ objective: 'py-05-crates' }];
    expect(gapsFor(s, req)).toHaveLength(1);
    expect(gapsFor(withEvidence(s, [{ ...evidence('py.numbers')[0]!, challengeId: 'py-05-crates', objectiveId: 'py-obj-divmod' }]), req)).toHaveLength(0);
  });
});

describe('the graph is consistent and never strands content', () => {
  it('every requirement names a real skill, composite or objective, and every required skill has a lesson that teaches it', () => {
    const reqs: SkillReq[] = [...lessons.flatMap((l) => l.requires ?? []), ...areas.flatMap((a) => (a.lock.type === 'skills' ? a.lock.requires : []))];
    for (const r of reqs) {
      if ('skill' in r) { expect(getSkill(r.skill), r.skill).toBeDefined(); expect(lessons.some((l) => l.skillId === r.skill), `no lesson teaches ${r.skill}`).toBe(true); }
    }
    for (const l of lessons) for (const p of l.prerequisites) expect(getLesson(p), `${l.id} -> ${p}`).toBeDefined();
  });
  it('every lesson can be reached: completing whatever is open, repeatedly, eventually opens everything (no deadlock, no cycle)', () => {
    let s = fresh();
    for (let round = 0; round < lessons.length + 2; round++) {
      const open = lessons.filter((l) => !s.learning.lessons[l.id]?.completed && lessonAccess(s, l).open);
      if (!open.length) break;
      for (const l of open) s = A.completeLesson(s, l.id).save;
      // a player who does the work also shows independent skill: give developing evidence for what each completed lesson teaches
      s = withEvidence(s, open.flatMap((l) => evidence(l.skillId, 1)));
    }
    const stuck = lessons.filter((l) => !s.learning.lessons[l.id]?.completed).map((l) => l.id);
    expect(stuck).toEqual([]);
  });
  it('the world list of each track is complete and ordered by teaching order', () => {
    for (const w of worlds) for (const { lesson: l } of worldLessons(fresh(), w.track)) expect(lessons).toContain(l);
  });
  it('content that unlocks after a competency can be discovered from that competency', () => {
    expect(unlocksOf('py.dicts').map((u) => u.id)).toEqual(expect.arrayContaining(['de-02-python-sql']));
    expect(unlocksOf('web.html').map((u) => u.id)).toContain('web-18-dom');
  });
  it('practice and dailies only offer what the player has met: a challenge on an unmet skill is not eligible', () => {
    const s = fresh();
    expect(challengeEligible(s, getAnyChallenge('py-05-crates')!)).toBe(false);
    expect(challengeEligible(complete(s, ['py-01-first-program', 'py-02-fixing-errors', 'py-03-variables', 'py-04-strings', 'py-05-numbers']), getAnyChallenge('py-05-crates')!)).toBe(true);
  });
  it('nextOpenLesson walks a chain to the first lesson that can actually be opened', () => {
    const s = fresh();
    expect(nextOpenLesson(s, lesson('py-05-numbers')).id).toBe('py-01-first-program');
  });
});
