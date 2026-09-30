import type { Challenge } from './schema';
import { bossChallenges } from './boss';

/**
 * Boss definitions (data). The problems live in content/boss/. A boss has several VERSIONS (different problems and
 * data); after a failed attempt the boss is sealed until the remediation training is done, then a NEW version is
 * given. There is no hint, no starter and no reveal for any boss, and every version is one attempt.
 *
 * kind: 'mini'    a gate guardian between lessons (fast, focused);
 *       'mastery' one per major track: unfamiliar context, more requirements, no scaffolding;
 *       'summit'  the final capstone that ends the campaign.
 */
export type BossKind = 'mini' | 'mastery' | 'summit';

/**
 * A way to face a boss with a particular technology (Phase 5). The Summit is open-ended: the same finale is offered in every technology the player has
 * mastered, and passing it by ANY route ends the campaign. Versions are listed per route, so a retry is always a new problem in the route chosen.
 */
export interface BossRoute {
  id: string;
  title: string;
  blurb: string;
  /** Version keys of this route, in the order they are offered. */
  versions: string[];
  /** Mastery bosses that must be defeated for this route to be open (the technology must have been mastered). */
  needs: string[];
}

export interface BossDef {
  id: string;
  kind: BossKind;
  title: string;
  icon: string;
  track: 'python' | 'sql' | 'data-eng' | 'web' | 'analytics' | 'sheets' | 'r' | 'summit';
  /** Lessons that must be completed before this boss can be faced. */
  requiresLessons: string[];
  /** Bosses that must already be defeated. */
  requiresBosses: string[];
  /** Bosses of which at least `count` must be defeated (breadth without a fixed path). */
  requiresAnyOf?: { count: number; bosses: string[] };
  /** Different technologies in which this boss can be faced; absent = one route. */
  routes?: BossRoute[];
  /** Story text: before the fight, after a win, after a loss (never blames the player; always names the way forward). */
  intro: string;
  victory: string;
  defeat: string;
  /** Version keys in the order they are offered. */
  versions: string[];
  reward: { xp: number; coins: number; item?: string };
}

export const bosses: BossDef[] = [
  {
    id: 'mini-python-functions', kind: 'mini', title: 'The Gate Warden', icon: '🛡️', track: 'python',
    requiresLessons: ['py-14-independent-trial'], requiresBosses: [],
    intro: 'The Warden guards the old gate into Bytehaven’s data halls. “Write me a small function, from a blank file, and I’ll let you through.”',
    victory: 'The Warden steps aside. “You wrote that from nothing. Go on.”',
    defeat: 'The Warden isn’t angry. “Something in that didn’t hold. Let’s find what, train it, and I’ll ask a different question.”',
    versions: ['a', 'b'], reward: { xp: 150, coins: 40 },
  },
  {
    id: 'mini-sql-joins', kind: 'mini', title: 'The Ledger Keeper', icon: '📒', track: 'sql',
    requiresLessons: ['sql-08-case'], requiresBosses: [],
    intro: 'The Ledger Keeper has counted every order in the market for years. “Answer my question with one query, and the vault is yours.”',
    victory: 'The Keeper closes the ledger with a nod. “Correct on every book I own.”',
    defeat: 'The Keeper slides the ledger back. “Right idea, wrong books. Train the part that slipped and I’ll open different ones.”',
    versions: ['a', 'b'], reward: { xp: 150, coins: 40 },
  },
  {
    id: 'mini-web-scripts', kind: 'mini', title: 'The Script Sentinel', icon: '🗝️', track: 'web',
    requiresLessons: ['web-17-js-errors'], requiresBosses: [],
    intro: 'A sentinel stands at the workshop door, holding a blank script. “Show me you can write JavaScript that survives bad input.”',
    victory: 'The sentinel bows. “Careful and correct.”',
    defeat: 'The sentinel hands your code back. “It runs, but not against everything. Train it, and I’ll test you again with something new.”',
    versions: ['a', 'b'], reward: { xp: 150, coins: 40 },
  },
  {
    id: 'mastery-python', kind: 'mastery', title: 'The Architect of Scripts', icon: '🐍', track: 'python',
    requiresLessons: ['py-28-independent-review-b'], requiresBosses: ['mini-python-functions'],
    intro: 'In the Programming Hall a single sealed door remains. Behind it, the Architect: “Here is a messy real-world file and a brief. No hints, no starter. Show me you can do this yourself.”',
    victory: 'The door opens. Python is no longer something you follow: it is something you use.',
    defeat: 'The door stays shut, but the Architect leaves you a note: what the attempt showed, and a training path to get through it.',
    versions: ['a', 'b'], reward: { xp: 400, coins: 100 },
  },
  {
    id: 'mastery-sql', kind: 'mastery', title: 'The Warden of Archives', icon: '🗄️', track: 'sql',
    requiresLessons: ['sql-15-independent-review'], requiresBosses: ['mini-sql-joins'],
    intro: 'The deepest archive of the Database District holds a schema you have never seen. The Warden: “Ask it the question exactly as I put it. The data will tell me if you are right.”',
    victory: 'The archive doors swing open. You can question a database you have never met.',
    defeat: 'The Warden marks where your query parted from the question. Train it, and a different archive awaits.',
    versions: ['a', 'b'], reward: { xp: 400, coins: 100 },
  },
  {
    id: 'mastery-data-eng', kind: 'mastery', title: 'The Foreman of the Works', icon: '🏭', track: 'data-eng',
    requiresLessons: ['de-03-independent'], requiresBosses: [],
    intro: 'The Foreman drops a raw feed on the conveyor. “It will be dirty, it will arrive twice, and it must not break anything. Build the pipeline.”',
    victory: 'The belts run clean. The Foreman stamps your card: the Works can rely on you.',
    defeat: 'The belts jam. The Foreman does not blame you: “That is what testing is for. Train it, and we run another feed.”',
    versions: ['a', 'b'], reward: { xp: 400, coins: 100 },
  },
  {
    id: 'mastery-web', kind: 'mastery', title: 'The Master Builder', icon: '🌐', track: 'web',
    requiresLessons: ['web-26-independent-js'], requiresBosses: ['mini-web-scripts'],
    intro: 'The Master Builder gives you a bare page and a spec. “Make it behave. I’ll poke it with a real browser, at every edge.”',
    victory: 'The Master Builder tests every corner and finds none. The Web District is yours.',
    defeat: 'The Master Builder shows the one case the page missed. Train it, and a new spec will be waiting.',
    versions: ['a', 'b'], reward: { xp: 400, coins: 100 },
  },
  {
    id: 'mastery-analytics', kind: 'mastery', title: 'The Oracle of the Observatory', icon: '🔭', track: 'analytics',
    requiresLessons: ['de-10-analytics'], requiresBosses: [],
    intro: 'The Oracle holds a database you have not seen and a question that needs both halves of your training. “Ask the data in SQL, judge it with statistics, and tell me only what it supports.”',
    victory: 'The Oracle nods slowly. “You counted the right things, and you did not claim more than they showed.”',
    defeat: 'The Oracle lowers the chart. “A number was right for the wrong group. Find which, train it, and I will bring you a different dataset.”',
    versions: ['a', 'b'], reward: { xp: 450, coins: 120 },
  },
  {
    id: 'mastery-sheets', kind: 'mastery', title: 'The Guildmaster', icon: '📊', track: 'sheets',
    requiresLessons: ['xl-08-modelling'], requiresBosses: [],
    intro: 'The Guildmaster slides a workbook across the table: a ledger with dates as text, rates in another sheet, and a summary to fill. “No formulas are filled in. Next week the figures change and so must your answers.”',
    victory: 'The Guildmaster changes every figure in the ledger and every answer follows. “That is a model,” they say.',
    defeat: 'The Guildmaster points at the cell that stayed wrong when the data moved. “Train it, and I’ll bring you a different ledger.”',
    versions: ['a', 'b'], reward: { xp: 450, coins: 120 },
  },
  {
    id: 'mastery-r', kind: 'mastery', title: 'The Laboratory Director', icon: '🔬', track: 'r',
    requiresLessons: ['r-06-analysis'], requiresBosses: [],
    intro: 'The Director hands you a raw data file and a brief, and says nothing else. “Print exactly this. My file will not be the one you practised on.”',
    victory: 'The Director runs your program on a file you have never seen. The output matches to the last decimal.',
    defeat: 'The Director circles the line that differed. “Train what slipped, and I’ll run you on another dataset.”',
    versions: ['a', 'b'], reward: { xp: 450, coins: 120 },
  },
  {
    id: 'summit', kind: 'summit', title: 'The Summit Trial', icon: '🏔️', track: 'summit',
    requiresLessons: [], requiresBosses: [],
    // Open-ended and multi-technology: any three mastery guardians, and a route (a technology the player has mastered) to take the finale in.
    requiresAnyOf: { count: 3, bosses: ['mastery-python', 'mastery-sql', 'mastery-data-eng', 'mastery-web', 'mastery-analytics', 'mastery-sheets', 'mastery-r'] },
    routes: [
      { id: 'data', title: 'Data route (Python and SQL)', blurb: 'Write the report in Python against the plant’s database.', versions: ['a', 'b'], needs: ['mastery-python', 'mastery-sql'] },
      { id: 'analytics', title: 'Analytics route (SQL, Python and statistics)', blurb: 'Decide what the data supports: medians, outliers and relationships, straight from the database.', versions: ['analytics-a', 'analytics-b'], needs: ['mastery-analytics'] },
      { id: 'sheets', title: 'Spreadsheet route', blurb: 'Build the outage ledger as a workbook that survives new data.', versions: ['sheets-a', 'sheets-b'], needs: ['mastery-sheets'] },
      { id: 'r', title: 'R route', blurb: 'Analyse the outage logs in R and report the verdict.', versions: ['r-a', 'r-b'], needs: ['mastery-r'] },
    ],
    intro: 'At the top, the Great Outage is waiting: the whole plant’s data is failing and no one has written the report that would show where. There is no structure, no starter, and no hint. There is only a brief, the data, and everything you have learned. Choose the tools you trust.',
    victory: 'The report runs, the numbers hold, and the lights of Bytehaven come back on one district at a time. You climbed the whole mountain, by your own path.',
    defeat: 'The summit wind is cold, but you are not sent down. Diagnose, train, and come back to a new brief: in the same technology, or another you have mastered.',
    versions: ['a', 'b', 'analytics-a', 'analytics-b', 'sheets-a', 'sheets-b', 'r-a', 'r-b'], reward: { xp: 1000, coins: 300, item: 'summit-flag' },
  },
];

const byId = new Map(bosses.map((b) => [b.id, b]));
export const getBoss = (id: string): BossDef | undefined => byId.get(id);

const bossChallengeByKey = new Map(bossChallenges.map((c) => [`${c.boss!.bossId}:${c.boss!.version}`, c]));
export const bossChallengeFor = (bossId: string, version: string): Challenge | undefined => bossChallengeByKey.get(`${bossId}:${version}`);
export const allBossChallenges = bossChallenges;
export const isBossChallenge = (challengeId: string): boolean => bossChallenges.some((c) => c.id === challengeId);
