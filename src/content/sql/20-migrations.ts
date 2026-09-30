import { sqlState, text } from '../helpers';

/** The column definition, normalised so INT/INTEGER, letter case and quote style do not matter. */
const defOf = (table: string, column: string) => `SELECT name, CASE WHEN UPPER(type) IN ('INT', 'INTEGER') THEN 'INTEGER' ELSE UPPER(type) END, "notnull", REPLACE(REPLACE(dflt_value, char(39), ''), '"', '') FROM pragma_table_info('${table}') WHERE name = '${column}'`;
import type { LessonBundle } from '../schema';

const START = '-- Write your statements below\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-20-migrations', title: 'Changing a Design Without Breaking It', language: 'sql', skillId: 'db.design',
    blurb: 'Real databases are never finished. Add a column safely, backfill it from existing data, and make the change all-or-nothing.', prerequisites: ['sql-13-integrity-performance'], xpReward: 80,
    reference: {
      title: 'Migrations',
      body: text(
        'A **migration** changes a live database’s structure without losing its data. `ALTER TABLE t ADD COLUMN c TYPE [NOT NULL] [DEFAULT x]` adds a column; existing rows get the default (or `NULL` if none). SQLite requires a **default** when you add a `NOT NULL` column, because the existing rows need a value.',
        'Adding the column is only step one. **Backfill** it from data you already have with `UPDATE ... SET c = ... WHERE ...` (a `WHERE` that uses a subquery or `IN (SELECT ...)` decides which rows change). Do it **in order**: structure first, then data, then any index or constraint that depends on it. Rerunning a migration that has already run must not corrupt anything, so real tools record which migrations ran.',
        'Wrap related steps in a **transaction** (`BEGIN; ... COMMIT;`) so a failure halfway leaves the old design intact. Check the result with `pragma_table_info(\'t\')` (column names, types, `notnull`, default) and by comparing counts before and after: no rows lost, the new column filled as intended.',
      ),
      example: "ALTER TABLE customers ADD COLUMN tier TEXT NOT NULL DEFAULT 'standard';\nUPDATE customers SET tier = 'vip'\nWHERE id IN (SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) >= 5);",
    },
    steps: [
      { kind: 'teach', title: 'The design you started with is never the design you end with', body: text('New requirements arrive after the data exists: "we need to flag VIP customers", "track which machines are high priority". You cannot drop the table and start again; there are real rows in it. A **migration** evolves the structure *and* fills the new column from existing data, carefully and in the right order.') },
      {
        kind: 'demo', title: 'Add a column, backfill it, check the structure', language: 'sql', db: 'market',
        body: text('Add a column with a default, fill it for some rows, then inspect both the data and the column’s definition.'),
        code: "ALTER TABLE customers ADD COLUMN region TEXT NOT NULL DEFAULT 'unknown';\nUPDATE customers SET region = 'north' WHERE city IN ('Leeds', 'York', 'Hull');\nSELECT region, COUNT(*) FROM customers GROUP BY region;\nSELECT name, type, \"notnull\", dflt_value FROM pragma_table_info('customers') WHERE name = 'region';",
        notice: 'Rows not matched by the `UPDATE` kept the default `unknown`, and `notnull = 1` shows the database will now refuse a missing region. The demo runs on a scratch copy: your game data is never changed.',
      },
      { kind: 'challenge', challengeId: 'sql-20-customer-tier' },
      { kind: 'challenge', challengeId: 'sql-20-machine-priority' },
    ],
  },
  objectives: [
    { id: 'sql-obj-migrate-backfill', title: 'Add a column and backfill it from existing data', summary: 'Add a NOT NULL column with a default, then update only the rows that qualify, using data already in the database.' },
  ],
  challenges: [
    {
      id: 'sql-20-customer-tier', title: 'Add a Customer Tier', mode: 'learning', language: 'sql', db: 'market', skillIds: ['db.design', 'sql.modify'], concepts: ['ALTER TABLE', 'DEFAULT', 'backfill'], difficulty: 3, context: 'retail',
      prompt: text('Marketing wants to flag loyal customers. Add a column `tier` to `customers`: text, **cannot be empty**, and **defaults to `standard`**. Then set `tier` to `vip` for every customer who has **at least 3 orders that are not `returned`**. Everyone else stays `standard`.'),
      expectedBehavior: 'customers has a NOT NULL tier column defaulting to standard; qualifying customers are vip.',
      guidedSteps: ['`ALTER TABLE customers ADD COLUMN tier TEXT NOT NULL DEFAULT \'standard\';`', 'Find the qualifying customers: group their non-returned orders and keep those with a count of 3 or more.', '`UPDATE customers SET tier = \'vip\' WHERE id IN (...)`.'],
      starterCode: START,
      hints: ['Structure first, then data: what must exist before you can update it?', 'A column that cannot be empty needs a default when it is added to a table with rows.', 'Which customers qualify is a query on `orders`; the update can use it in an `IN (SELECT ...)`.'],
      checks: sqlState("ALTER TABLE customers ADD COLUMN tier TEXT NOT NULL DEFAULT 'standard'; UPDATE customers SET tier = 'vip' WHERE id IN (SELECT customer_id FROM orders WHERE status <> 'returned' GROUP BY customer_id HAVING COUNT(*) >= 3);", ['SELECT id, tier FROM customers ORDER BY id', defOf('customers', 'tier')], 'market', ['market-b']),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'sql-20-machine-priority', objectiveId: 'sql-obj-migrate-backfill', title: 'Flag High-Priority Machines', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['db.design', 'sql.modify'], concepts: ['ALTER TABLE', 'DEFAULT', 'backfill'], difficulty: 3, context: 'manufacturing',
      prompt: text('Maintenance wants to flag machines that need attention. Add a column `priority` to `machines`: a whole number that **cannot be empty** and **defaults to 0**. Then set `priority` to `1` for every machine whose **total downtime across all its maintenance events is more than 20 hours**. All others stay `0`.'),
      expectedBehavior: 'machines has a NOT NULL integer priority defaulting to 0; machines with more than 20 downtime hours have 1.',
      starterCode: START,
      hints: ['What has to exist before you can fill a column?', 'A column that cannot be empty needs a default when added to a table that already has rows.', 'Which machines qualify is a grouped query on the events; the update can use it.'],
      checks: sqlState('ALTER TABLE machines ADD COLUMN priority INTEGER NOT NULL DEFAULT 0; UPDATE machines SET priority = 1 WHERE id IN (SELECT machine_id FROM maintenance_events GROUP BY machine_id HAVING SUM(downtime_hours) > 20);', ['SELECT id, priority FROM machines ORDER BY id', defOf('machines', 'priority')], 'works', ['works-b', 'works-boss', 'works-edge']),
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'sql-20-player-veteran', objectiveId: 'sql-obj-migrate-backfill', title: 'Mark Veteran Players', mode: 'challenge', language: 'sql', db: 'league', skillIds: ['db.design', 'sql.modify'], concepts: ['ALTER TABLE', 'DEFAULT', 'backfill'], difficulty: 3, context: 'sports analytics',
      prompt: text('The league wants to recognise veterans. Add a column `veteran` to `players`: a whole number that **cannot be empty** and **defaults to 0**. Then set `veteran` to `1` for every player **born before 1995** (`birth_year` under 1995). All others stay `0`.'),
      expectedBehavior: 'players has a NOT NULL integer veteran column defaulting to 0; players born before 1995 have 1.',
      starterCode: START,
      hints: ['Structure first, then data.', 'A column that cannot be empty needs a default when added to a table that already has rows.', 'Which rows change is decided by a simple condition on an existing column.'],
      checks: sqlState('ALTER TABLE players ADD COLUMN veteran INTEGER NOT NULL DEFAULT 0; UPDATE players SET veteran = 1 WHERE birth_year < 1995;', ['SELECT id, veteran FROM players ORDER BY id', defOf('players', 'veteran')], 'league', ['league-b']),
      xpReward: 100, coinReward: 15,
    },
  ],
};
