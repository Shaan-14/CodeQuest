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
