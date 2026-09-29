/**
 * The game's databases. Each id maps to setup SQL (schema + deterministic data). A "-b" twin has the same
 * schema but different rows and is used by graders as HIDDEN data, so hard-coded answers fail.
 * `tables` documents each table for the in-game schema browser; a test verifies it matches real SQLite.
 */
import { flatSql } from './flat';
import { leagueSql } from './league';
import { marketSql } from './market';
import { worksSql } from './works';

export interface TableDoc {
  name: string;
  about: string;
  columns: { name: string; note?: string }[];
}

export interface DatabaseDef {
  id: string;
  title: string;
  about: string;
  setup: string;
  tables: TableDoc[];
}

const t = (name: string, about: string, columns: string[]): TableDoc => ({
  name,
  about,
  columns: columns.map((c) => {
    const [n, ...note] = c.split(' - ');
    return { name: n!, note: note.join(' - ') || undefined };
  }),
});

const WORKS_TABLES = [
  t('departments', 'Departments of the factory.', ['id', 'name']),
  t('employees', 'Everyone who works here.', ['id', 'name', 'department_id - links to departments', 'role - operator, technician or supervisor', 'hourly_rate', 'hired_on - date, YYYY-MM-DD', 'manager_id - links to another employee; NULL for department heads']),
  t('machines', 'Machines on the factory floor.', ['id', 'name', 'machine_type', 'department_id - links to departments', 'purchase_cost', 'installed_on - date']),
  t('products', 'Things the factory makes.', ['id', 'name', 'unit_cost']),
  t('production_runs', 'One row per production run of a machine.', ['id', 'machine_id - links to machines', 'operator_id - links to employees', 'product_id - links to products', 'run_date', 'units_made', 'units_defective - NULL when not recorded', 'hours']),
  t('maintenance_events', 'Inspections, routine servicing and repairs.', ['id', 'machine_id - links to machines', 'technician_id - links to employees', 'event_date', 'kind - routine, inspection or repair', 'downtime_hours - time the machine was stopped', 'cost - NULL when unknown']),
];
const MARKET_TABLES = [
  t('customers', 'People who buy from the market.', ['id', 'name', 'city - NULL when unknown', 'joined_on - date']),
  t('products', 'What the market sells.', ['id', 'name', 'category', 'price', 'stock']),
  t('orders', 'One row per order.', ['id', 'customer_id - links to customers', 'ordered_on - date', 'status - paid, shipped, returned or pending']),
  t('order_items', 'The lines of each order.', ['id', 'order_id - links to orders', 'product_id - links to products', 'quantity', 'unit_price - the price actually charged']),
];
const LEAGUE_TABLES = [
  t('teams', 'Teams in the league.', ['id', 'name', 'city']),
  t('players', 'Players, one team each.', ['id', 'name', 'team_id - links to teams', 'position', 'birth_year']),
  t('seasons', 'Seasons played.', ['id', 'year']),
  t('games', 'One row per game.', ['id', 'season_id - links to seasons', 'home_team_id - links to teams', 'away_team_id - links to teams', 'home_score', 'away_score', 'played_on - date']),
  t('player_stats', 'A player’s numbers for one season.', ['id', 'player_id - links to players', 'season_id - links to seasons', 'games_played', 'at_bats', 'hits', 'home_runs']),
];

const FLAT_TABLES = [t('sales_flat', 'Every sale, with the customer’s details repeated on each row.', ['id', 'customer_name', 'customer_city', 'product', 'qty', 'price'])];

const defs: DatabaseDef[] = [
  { id: 'works', title: 'Bytehaven Works', about: 'A factory: employees, machines, production runs and maintenance.', setup: worksSql(101), tables: WORKS_TABLES },
  { id: 'works-b', title: 'Bytehaven Works (hidden data)', about: 'Same schema, different data.', setup: worksSql(202), tables: WORKS_TABLES },
  { id: 'market', title: 'Bytehaven Market', about: 'A market: customers, products, orders and order lines.', setup: marketSql(303), tables: MARKET_TABLES },
  { id: 'market-b', title: 'Bytehaven Market (hidden data)', about: 'Same schema, different data.', setup: marketSql(404), tables: MARKET_TABLES },
  { id: 'league', title: 'Bytehaven League', about: 'A sports league: teams, players, games and season statistics.', setup: leagueSql(505), tables: LEAGUE_TABLES },
  { id: 'league-b', title: 'Bytehaven League (hidden data)', about: 'Same schema, different data.', setup: leagueSql(606), tables: LEAGUE_TABLES },
  { id: 'flat', title: 'Flat sales table', about: 'One wide table with repeated customer details. Time to normalise it.', setup: flatSql(707), tables: FLAT_TABLES },
  { id: 'flat-b', title: 'Flat sales table (hidden data)', about: 'Same schema, different data.', setup: flatSql(808), tables: FLAT_TABLES },
  // Empty database for schema-design and CREATE TABLE practice.
  { id: 'blank', title: 'A blank database', about: 'Nothing in it yet. Build your own tables.', setup: '', tables: [] },
];

export const databases = defs;
const byId = new Map(defs.map((d) => [d.id, d]));
export const getDatabase = (id: string): DatabaseDef | undefined => byId.get(id);

/** Setup SQL for each requested database id, ready to send to a runner as `sources`. */
export function sourcesFor(ids: Iterable<string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of ids) {
    const d = byId.get(id);
    if (d) out[id] = d.setup;
  }
  return out;
}
