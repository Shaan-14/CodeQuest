import type { SceneDef } from '../../../play/logic/sceneTypes';
import { room } from './kit';

/** ANALYTICS OFFICE: the console asks the league database; every wall board fills in as the player's queries work. */
export const analyticsOffice: SceneDef = {
  id: 'analytics-office', world: 'ballpark', title: 'Analytics Office', blurb: 'Six boards on the wall, empty. Each question the console answers fills one.',
  bounds: { minX: -11, maxX: 11, minZ: -8, maxZ: 8 },
  spawns: { default: { x: 0, z: 6, ry: 0 }, door: { x: 0, z: 6, ry: 0 } },
  look: { sky: 0x182238, fog: 0x182238, fogNear: 24, fogFar: 54, ground: 0x2a3552, ambient: 0.6, sun: 0.9 },
  ambience: 'workshop',
  props: [
    { kind: 'floor', x: 0, z: 0, p: { w: 22, d: 16, color: 0x4a5a78, color2: 0x546486, tile: 2 } },
    ...room(-11, 11, -8, 8, { h: 4.4, color: 0x5f6d92, trim: 0x7dffb3, gaps: { south: [0, 3.2] } }),
    { kind: 'archway', x: 0, z: 7.6, ry: Math.PI, p: { w: 3.2, h: 3.2, text: 'BALLPARK', color: 0x7dffb3, portal: false } },
    { kind: 'statusScreen', x: -8, z: -7.6, id: 'roster-board', p: { w: 3.6, h: 2.2, y: 1.7, off: 'ROSTER|— empty —', on: 'ROSTER|38 PLAYERS|6 TEAMS' } },
    { kind: 'statusScreen', x: -4, z: -7.6, id: 'ranking-board', p: { w: 3.6, h: 2.2, y: 1.7, off: 'RANKING|— empty —', on: 'TOP 9 BY OPS|1. Ibarra  .912|2. Okafor  .887|3. Lindqvist .861' } },
    { kind: 'statusScreen', x: 0, z: -7.6, id: 'clean-board', p: { w: 3.6, h: 2.2, y: 1.7, off: 'DATA QUALITY|— unchecked —', on: 'DATA QUALITY|3 PLAYERS WITH|MISSING STATS|FLAGGED, NOT ZEROED' } },
    { kind: 'statusScreen', x: 4, z: -7.6, id: 'stats-board', p: { w: 3.6, h: 2.2, y: 1.7, off: 'SEASON|— empty —', on: 'SEASON TOTALS|HR 184  AVG .271|RUNS 1,402' } },
    { kind: 'statusScreen', x: 8, z: -7.6, id: 'positions-board', p: { w: 3.6, h: 2.2, y: 1.7, off: 'POSITIONS|— empty —', on: 'BY POSITION|OF  .284|IF  .262|C   .244' } },
    { kind: 'statusScreen', x: 0, z: 7.7, ry: Math.PI, id: 'lineup-board', p: { w: 5, h: 2.4, y: 1.5, off: 'LINEUP|NOT SET|(jersey order)', on: 'LINEUP SET|9 NAMES, 9 POSITIONS|SENT TO COACH', fg: '#ffd166', bg: '#20140a' } },
    { kind: 'console', x: 0, z: -3, ry: 0, id: 'analytics-console', p: { text: 'LEAGUE DB|> SELECT_', color: 0x7dffb3 }, solid: { w: 1.7, d: 0.9 } },
    { kind: 'desk', x: -7, z: 2, solid: { w: 1.6, d: 0.8 } }, { kind: 'desk', x: 7, z: 2, solid: { w: 1.6, d: 0.8 } },
    { kind: 'bookshelf', x: -10.4, z: 3, ry: Math.PI / 2, p: { w: 4 }, solid: { w: 0.5, d: 4 } },
    { kind: 'hologram', x: 8, z: 5, p: { color: 0x7dffb3 }, solid: { w: 1.4, d: 1.4 } },
  ],
  npcs: [{ npc: 'dara', x: -3.2, z: -1.6, ry: 0.6 }],
  interactables: [
    { id: 'talk-dara', verb: 'Talk', label: 'Analyst Dara', x: -3.2, z: -1.6, action: { type: 'talk', npc: 'dara' } },
    { id: 'analytics-console', verb: 'Use', label: 'the Analytics Console', x: 0, z: -1.8, range: 2.2, action: { type: 'terminal', station: 'analytics-console' } },
    { id: 'note', verb: 'Read', label: 'the sticky note', x: 7, z: 0.6, range: 2.2, action: { type: 'inspect', id: 'dara-note', text: 'A yellow sticky note on a monitor, in Dara’s handwriting: “What would change my mind?”' } },
  ],
  exits: [{ id: 'to-ballpark', label: 'the ballpark', x: 0, z: 7, to: 'ballpark', spawn: 'from-office' }],
  reactions: [
    { prop: 'roster-board', effect: 'office.roster:load', state: 'on', say: 'The roster board fills in: 38 players, 6 teams.', cinematic: 'office-roster', then: 'park-roster' },
    { prop: 'ranking-board', effect: 'office.ranking:sort', state: 'on', say: 'The ranking board lists the league’s best hitters, in order.', cinematic: 'office-ranking', then: 'park-ranking' },
    { prop: 'clean-board', effect: 'office.roster:clean', state: 'on', say: 'The data-quality board flags the players with missing stats instead of treating them as zero.', cinematic: 'office-clean', then: 'park-clean' },
    { prop: 'stats-board', effect: 'office.stats:summarise', state: 'on', say: 'The season board fills in: totals and averages.', cinematic: 'office-stats', then: 'park-stats' },
    { prop: 'positions-board', effect: 'office.positions:group', state: 'on', say: 'The position board shows how each group performs.', cinematic: 'office-positions', then: 'park-positions' },
    { prop: 'lineup-board', effect: 'field.lineup:set', state: 'on', say: 'LINEUP SET. The card goes to Coach Reyes.', cinematic: 'office-lineup', then: 'park-lineup' },
  ],
};
