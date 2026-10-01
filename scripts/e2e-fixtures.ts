/**
 * Writes e2e/.fixtures.json: the FIRST reference solution for every web challenge and every Daily Challenge, taken from
 * the test-only solution files. The end-to-end runner is plain Node and cannot import the (extensionless) TypeScript
 * content graph, so this runs under vite-node first. The file is generated, gitignored, and never shipped.
 */
import { writeFileSync } from 'node:fs';
import { dailySolutions } from '../src/content/daily/solutions.testdata';
import { webDailySolutions } from '../src/content/daily/solutions.web.testdata';
import { webSolutions } from '../src/content/web/solutions.testdata';
import { webBossSolutions } from '../src/content/boss/solutions.web.testdata';

const first = <T>(rec: Record<string, { valid: T[] }>) => Object.fromEntries(Object.entries(rec).map(([id, s]) => [id, s.valid[0]]));
writeFileSync(new URL('../e2e/.fixtures.json', import.meta.url), JSON.stringify({ web: first(webSolutions), dailies: { ...first(dailySolutions), ...first(webDailySolutions) }, bosses: first(webBossSolutions) }));
console.log('wrote e2e/.fixtures.json');


/**
 * Saves prepared with the REAL game actions (every challenge of a lesson passed, the lesson completed), so the 3D world's e2e tests can start
 * from "the analysis is done" without replaying forty minutes of lessons. The world they show is derived from that evidence, exactly as in play.
 */
import * as A from '../src/game/actions';
import { lessons, challenges } from '../src/content';
import { newSave } from '../src/core/save';

function saveAfter(lessonIds: string[], extra?: (s: ReturnType<typeof newSave>) => void) {
  let s = A.setFlag(A.createPlayer(newSave(), 'Ada', 'spellwright').save, 'mentor-intro').save;
  for (const id of lessonIds) {
    const l = lessons.find((x) => x.id === id)!;
    for (const st of l.steps) if (st.kind === 'challenge' && challenges.some((c) => c.id === st.challengeId)) s = A.submitChallenge(s, st.challengeId, true, 4000, 'pass').save;
    s = A.completeLesson(s, id).save;
  }
  extra?.(s);
  return s;
}
const py = (n: number) => lessons.filter((l) => l.id.startsWith('py-')).slice(0, n).map((l) => l.id);
const sql6 = ['sql-01-select', 'sql-02-sort-limit', 'sql-03-null', 'sql-04-aggregates', 'sql-05-group', 'sql-06-joins'];
const xl4 = ['xl-01-formulas', 'xl-02-functions', 'xl-03-logic', 'xl-04-lookups'];
const web14 = lessons.filter((l) => l.id.startsWith('web-')).slice(0, 14).map((l) => l.id);
const sm = saveAfter([...py(21), ...sql6]);
const now = new Date().toISOString();
for (const id of ['mastery-python', 'mastery-sql', 'mastery-data-eng']) sm.bosses[id] = { attempts: [], passedAt: now };
writeFileSync(new URL('../e2e/.saves.json', import.meta.url), JSON.stringify({
  baseball: saveAfter(sql6), racing: saveAfter(xl4), academy: saveAfter(web14), robotics: saveAfter(py(4)),
  campaign: sm,
}));
console.log('wrote e2e/.saves.json');
