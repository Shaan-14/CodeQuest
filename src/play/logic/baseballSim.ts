/**
 * BASEBALL SIMULATION (pure, seeded): a short game whose strength comes from the lineup the player's ANALYSIS produced. The model is small and
 * honest: on-base and slugging rates decide what happens at the plate, positioning decides how many balls in play are misplayed, and every
 * step of analysis (see content/play/scenes/analytics-office.ts) improves one of them. Nothing here is random in a way the player cannot
 * explain: a better lineup wins more often, and the game says why.
 */
export interface TeamModel {
  /** Chance a batter reaches base (0..1). */
  obp: number;
  /** Of balls put in play, how strong: drives extra-base hits and home runs. */
  slg: number;
  /** Chance a ball in play is misplayed (defensive errors). */
  errorRate: number;
  name: string;
}

export type PlayType = 'strikeout' | 'groundout' | 'flyout' | 'walk' | 'single' | 'double' | 'homerun' | 'error';
export interface Play {
  half: 'us' | 'them';
  inning: number;
  outsBefore: number;
  type: PlayType;
  batter: number;
  /** Runs scored on this play. */
  runs: number;
  /** Bases after the play (first, second, third occupied by batter index, or -1). */
  bases: [number, number, number];
  text: string;
}
export interface GameResult { plays: Play[]; us: number; them: number; innings: number; won: boolean }

/** A tiny deterministic generator (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const FIELD = ['left field', 'center field', 'right field', 'shortstop', 'third base', 'second base', 'first base'];

/** What happens in one plate appearance. */
function plateAppearance(m: TeamModel, rand: () => number): PlayType {
  if (rand() < m.obp) {
    // reached base: how?
    const r = rand();
    if (r < 0.16) return 'walk';
    const power = m.slg;
    const h = rand();
    if (h < 0.06 + (power - 0.3) * 0.22) return 'homerun';
    if (h < 0.26 + (power - 0.3) * 0.3) return 'double';
    return 'single';
  }
  const r = rand();
  if (r < 0.3) return 'strikeout';
  return r < 0.65 ? 'groundout' : 'flyout';
}

/** Advance runners for a hit/walk/out. Returns runs scored. */
function advance(bases: [number, number, number], type: PlayType, batter: number): number {
  let runs = 0;
  const [b1, b2, b3] = bases;
  switch (type) {
    case 'homerun': runs = 1 + bases.filter((b) => b >= 0).length; bases[0] = bases[1] = bases[2] = -1; break;
    case 'double': runs = (b3 >= 0 ? 1 : 0) + (b2 >= 0 ? 1 : 0); bases[2] = b1; bases[1] = batter; bases[0] = -1; break;
    case 'single': case 'error': runs = b3 >= 0 ? 1 : 0; bases[2] = b2; bases[1] = b1; bases[0] = batter; break;
    case 'walk': if (b1 >= 0 && b2 >= 0 && b3 >= 0) runs = 1; if (b1 >= 0) { if (b2 >= 0) bases[2] = b2; bases[1] = b1; } bases[0] = batter; break;
    case 'flyout': break;
    case 'groundout': break;
    case 'strikeout': break;
  }
  return runs;
}

/** Play a game of `innings` innings. `us` bats in the bottom half (home team). */
export function simulateGame(us: TeamModel, them: TeamModel, seed: number, innings = 3): GameResult {
  const rand = rng(seed);
  const plays: Play[] = [];
  let ourRuns = 0, theirRuns = 0, ourBatter = 0, theirBatter = 0;
  // extra innings decide a tie (at most two), so every game has a winner
  for (let inning = 1; inning <= innings + 2; inning++) {
    if (inning > innings && ourRuns !== theirRuns) break;
    for (const half of ['them', 'us'] as const) {
      const m = half === 'us' ? us : them;
      const defence = half === 'us' ? them : us;
      const bases: [number, number, number] = [-1, -1, -1];
      let outs = 0;
      while (outs < 3) {
        const batter = half === 'us' ? ourBatter++ % 9 : theirBatter++ % 9;
        let type = plateAppearance(m, rand);
        // a ball put in play can be misplayed by a defence that is out of position
        if ((type === 'groundout' || type === 'flyout') && rand() < defence.errorRate) type = 'error';
        const before = outs;
        const runs = advance(bases, type, batter);
        if (type === 'strikeout' || type === 'groundout' || type === 'flyout') outs++;
        if (half === 'us') ourRuns += runs; else theirRuns += runs;
        const where = FIELD[Math.floor(rand() * FIELD.length)]!;
        const text = {
          strikeout: 'Strikeout, swinging.', groundout: `Ground ball to ${where}. Out.`, flyout: `Fly ball to ${where}. Caught.`, walk: 'Ball four. Walk.',
          single: `Single to ${where}.`, double: `Double to ${where}!`, homerun: 'HOME RUN!', error: `Misplayed at ${where}: safe at first.`,
        }[type];
        plays.push({ half, inning, outsBefore: before, type, batter, runs, bases: [...bases], text: runs ? `${text} ${runs} run${runs > 1 ? 's' : ''} score.` : text });
      }
    }
  }
  return { plays, us: ourRuns, them: theirRuns, innings: plays.length ? plays[plays.length - 1]!.inning : innings, won: ourRuns > theirRuns };
}

/**
 * The player's team as shaped by their analysis. `steps` is how many of the six analysis steps are done (roster loaded, ranked, cleaned,
 * summarised, grouped by position, lineup set). The default lineup (nothing analysed) is a batting order by jersey number.
 */
export function ourTeam(steps: number, lineupSet: boolean): TeamModel {
  const s = Math.max(0, Math.min(6, steps));
  return { name: 'Harborview Herons', obp: 0.26 + 0.024 * s, slg: 0.32 + 0.03 * s, errorRate: lineupSet ? 0.03 : 0.2 - s * 0.022 };
}
export const opposingTeam: TeamModel = { name: 'Dockside Gulls', obp: 0.3, slg: 0.37, errorRate: 0.06 };

/** The chance our side wins, by playing many seeded games (used to show the player WHY their analysis mattered). */
export function winRate(us: TeamModel, them: TeamModel, games = 400, innings = 3): number {
  let w = 0;
  for (let i = 0; i < games; i++) if (simulateGame(us, them, 9000 + i, innings).won) w++;
  return w / games;
}
