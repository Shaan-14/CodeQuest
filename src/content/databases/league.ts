import { day, insert, int, names, pick, rng } from './generate';

/** "Bytehaven League": teams, players, seasons, games and per-season statistics (a sports-analytics flavour). */
export const LEAGUE_SCHEMA = `
CREATE TABLE teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);
CREATE TABLE players (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  position TEXT NOT NULL,
  birth_year INTEGER NOT NULL
);
CREATE TABLE seasons (
  id INTEGER PRIMARY KEY,
  year INTEGER NOT NULL
);
CREATE TABLE games (
  id INTEGER PRIMARY KEY,
  season_id INTEGER NOT NULL REFERENCES seasons(id),
  home_team_id INTEGER NOT NULL REFERENCES teams(id),
  away_team_id INTEGER NOT NULL REFERENCES teams(id),
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  played_on TEXT NOT NULL
);
CREATE TABLE player_stats (
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  season_id INTEGER NOT NULL REFERENCES seasons(id),
  games_played INTEGER NOT NULL,
  at_bats INTEGER NOT NULL,
  hits INTEGER NOT NULL,
  home_runs INTEGER NOT NULL
);
`;

const TEAMS: [string, string][] = [['Owls', 'Leeds'], ['Foxes', 'York'], ['Herons', 'Bath'], ['Wolves', 'Hull'], ['Otters', 'Ely'], ['Stags', 'Derby']];
const POSITIONS = ['Pitcher', 'Catcher', 'Infield', 'Outfield'];

export function leagueSql(seed: number): string {
  const r = rng(seed);
  let sql = LEAGUE_SCHEMA;
  sql += insert('teams', ['id', 'name', 'city'], TEAMS.map(([n, c], i) => [i + 1, n, c]));
  const who = names(r, 36);
  sql += insert('players', ['id', 'name', 'team_id', 'position', 'birth_year'], who.map((n, i) => [i + 1, n, (i % 6) + 1, pick(r, POSITIONS), int(r, 1988, 2003)]));
  sql += insert('seasons', ['id', 'year'], [[1, 2022], [2, 2023]]);
  const games: (string | number)[][] = [];
  for (let i = 0; i < 60; i++) {
    const home = int(r, 1, 6);
    let away = int(r, 1, 6);
    while (away === home) away = int(r, 1, 6);
    games.push([i + 1, i < 30 ? 1 : 2, home, away, int(r, 0, 12), int(r, 0, 12), day(int(r, 0, 700))]);
  }
  sql += insert('games', ['id', 'season_id', 'home_team_id', 'away_team_id', 'home_score', 'away_score', 'played_on'], games);
  const stats: (string | number)[][] = [];
  let id = 1;
  for (let p = 1; p <= 36; p++) for (const s of [1, 2]) {
    const ab = int(r, 60, 520);
    const hits = Math.min(ab, Math.round(ab * (0.18 + r() * 0.15)));
    stats.push([id++, p, s, int(r, 20, 150), ab, hits, int(r, 0, 38)]);
  }
  sql += insert('player_stats', ['id', 'player_id', 'season_id', 'games_played', 'at_bats', 'hits', 'home_runs'], stats);
  return sql;
}
