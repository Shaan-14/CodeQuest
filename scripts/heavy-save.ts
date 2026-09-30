/**
 * Writes a late-game save (every lesson done, a pass recorded for every lesson challenge) to /tmp/cq-heavy-save.json.
 * Used by scripts/perf-probe.mjs to measure the game the way a student who has played for weeks experiences it.
 */
import { writeFileSync } from 'node:fs';
import * as A from '../src/game/actions';
import { lessons, challenges } from '../src/content';
import { newSave } from '../src/core/save';

let s = A.acceptQuest(A.createPlayer(newSave(), 'Perf', 'spellwright').save, 'wake-the-robot').save;
for (const l of lessons) {
  for (const st of l.steps) if (st.kind === 'challenge') { const c = challenges.find((x) => x.id === st.challengeId); if (c) s = A.submitChallenge(s, c.id, true, 4000, 'pass').save; }
  s = A.completeLesson(s, l.id).save;
}
s = A.setFlag(s, 'mentor-intro').save;
writeFileSync('/tmp/cq-heavy-save.json', JSON.stringify(s));
console.log(JSON.stringify({ evidence: s.evidence.length, lessons: Object.values(s.learning.lessons).filter((x) => x.completed).length, bytes: JSON.stringify(s).length }));
