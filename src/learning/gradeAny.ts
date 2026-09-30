/**
 * One entry point for grading any challenge, whatever its language. The UI and the tests call this; each language keeps its own
 * engine (Python/SQL worker, web sandbox, R via webR, the spreadsheet engine, the Git simulator). Adding a language = one branch.
 */
import type { Challenge, GitCheck, SheetCheck } from '../content/schema';
import { databasesUsedBy } from '../content/helpers';
import { sourcesFor } from '../content/databases';
import { gradeGit } from './git/grade';
import { getRRunner } from './r/runner';
import type { GradeResult } from './runner';
import { gradeSheet } from './sheet/grade';
import { getRunner } from './python/runner';
import { gradeWeb, parseWebFiles } from './web/WebRunner';

export const GRADE_TIMEOUT = 10000;
const failure = (error: string): GradeResult => ({ passed: false, error, timedOut: false, checks: [], constraints: [] });

export async function gradeChallenge(c: Challenge, code: string, timeoutMs = GRADE_TIMEOUT): Promise<GradeResult> {
  try {
    switch (c.language) {
      case 'web': return await gradeWeb(parseWebFiles(code), c.checks);
      case 'sheet': return gradeSheet(code, c.checks as SheetCheck[], c.constraints, c.sheet);
      case 'git': return gradeGit(code, c.git?.start ?? {}, c.checks as GitCheck[], c.constraints);
      case 'r': return await getRRunner().grade({ language: 'r', code, checks: c.checks, constraints: c.constraints, fixtures: c.fixtures, timeoutMs: Math.max(timeoutMs, 20000) });
      default: return await getRunner().grade({ language: c.language, code, checks: c.checks, constraints: c.constraints, fixtures: c.fixtures, sources: sourcesFor(databasesUsedBy(c)), db: c.db, timeoutMs });
    }
  } catch (e) {
    return failure(`CodeQuest could not grade your code: ${String(e)}`);
  }
}
