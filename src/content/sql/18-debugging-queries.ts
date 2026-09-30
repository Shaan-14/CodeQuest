import { sqlRes, text } from '../helpers';
import type { LessonBundle } from '../schema';

const COUNT_STARTER = (from: string, alias: string, label: string) => `-- This query runs, but its numbers are wrong. Find out why and fix it.\nSELECT ${alias}.name, COUNT(*) AS ${label}\n${from}\nGROUP BY ${alias}.id\nORDER BY ${alias}.name;\n`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-18-debugging-queries', title: 'When the Query Runs but the Answer Is Wrong', language: 'sql', skillId: 'sql.debug',
    blurb: 'The worst bugs do not raise errors. Learn the classic ways a query lies to you, and how to catch them before anyone trusts the numbers.', prerequisites: ['sql-10-subqueries'], xpReward: 80,
    reference: {
      title: 'Debugging queries',
      body: text(
        'A query that returns rows is not a query that returns the **right** rows. Check results against something you can verify by hand: a total you can add up, a row you know must (or must not) appear, and the **number of rows** you expected.',
        '**Classic traps.** (1) `LEFT JOIN` + `COUNT(*)`: the unmatched row still counts as 1; count a column from the right table (`COUNT(o.id)`) instead. (2) **Fan-out**: joining a table to *two* one-to-many tables multiplies rows, so every `SUM` and `COUNT` is inflated; aggregate each side separately (subquery or CTE) and join the results. (3) `NOT IN (subquery)` returns nothing when the subquery holds a `NULL`. (4) `WHERE` filters rows *before* grouping and `HAVING` filters groups *after*; `WHERE col = NULL` never matches (use `IS NULL`). (5) Integer division: `100 * a / b` truncates; write `100.0 * a / b`.',
        'The method: **shrink** the problem to one customer or one machine, **inspect** the joined rows before aggregating (`SELECT *` with a `WHERE`), **compare** the pieces with the totals, and change one thing at a time.',
      ),
      example: '-- how many rows does the join produce for ONE machine?\nSELECT COUNT(*) FROM machines m\nJOIN production_runs r ON r.machine_id = m.id\nJOIN maintenance_events e ON e.machine_id = m.id\nWHERE m.id = 5;',
    },
    steps: [
      { kind: 'teach', title: 'Wrong numbers do not announce themselves', body: text('A syntax error is a gift: it stops you. A **logic** error just hands you a confident-looking table that is wrong. Most of them come from a few patterns, and each leaves a clue: a count of 1 where you expect 0, totals that are exactly a multiple of what they should be, a row count that is too big or too small.', 'In this lesson every problem starts with a query that **runs but is wrong**. Your job is to find out why, then fix it.') },
      {
        kind: 'demo', title: 'A count that cannot be zero', language: 'sql', db: 'market',
        body: text('Customers with **no orders** should show `0`. Compare `COUNT(*)` and `COUNT(o.id)`.'),
        code: "SELECT c.name,\n       COUNT(*) AS wrong,\n       COUNT(o.id) AS right\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id\nORDER BY right, c.name\nLIMIT 5;",
        notice: 'For a customer with no orders the `LEFT JOIN` still produces one row (all NULLs on the right). `COUNT(*)` counts that row: 1. `COUNT(o.id)` counts only real order ids: 0.',
      },
      {
        kind: 'demo', title: 'Inflated totals from a double join', language: 'sql', db: 'works',
        body: text('One machine, joined to both its production runs and its maintenance events. How many rows does that produce?'),
        code: "SELECT m.name,\n       COUNT(DISTINCT r.id) AS runs,\n       COUNT(DISTINCT e.id) AS events,\n       COUNT(*) AS joined_rows\nFROM machines m\nJOIN production_runs r ON r.machine_id = m.id\nJOIN maintenance_events e ON e.machine_id = m.id\nGROUP BY m.id\nORDER BY joined_rows DESC\nLIMIT 4;",
        notice: '`joined_rows` is `runs × events`: every run is paired with every event. A `SUM(r.units_made)` over these rows would count each run once per event. The fix is to add up each table separately, then combine.',
      },
      { kind: 'challenge', challengeId: 'sql-18-orders-per-customer' },
      { kind: 'challenge', challengeId: 'sql-18-events-per-machine' },
      { kind: 'challenge', challengeId: 'sql-18-machine-totals' },
    ],
  },
  objectives: [
    { id: 'sql-obj-fix-count', title: 'Repair a count that includes unmatched rows', summary: 'Spot that COUNT(*) after a LEFT JOIN counts the empty match, and count a column of the joined table instead.' },
    { id: 'sql-obj-fix-fanout', title: 'Repair totals inflated by joining two one-to-many tables', summary: 'Recognise a join fan-out and aggregate each table separately before combining.' },
  ],
  challenges: [
    {
      id: 'sql-18-orders-per-customer', title: 'Orders Per Customer, Fixed', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.debug', 'sql.joins'], concepts: ['LEFT JOIN', 'COUNT', 'debugging'], difficulty: 3, context: 'retail',
      prompt: text('Customer service wants every customer’s `name` and their number of orders as `orders`, **including customers with no orders, who should show 0**. The query below runs, but customers who have never ordered show **1**. Fix it. Keep the columns and the order (by name).'),
      expectedBehavior: 'Every customer with the correct order count, 0 for those with none.',
      guidedSteps: ['Run the query and find a customer whose count is wrong.', 'Ask: for a customer with no orders, what does the `LEFT JOIN` produce?', 'Count something that is empty when there is no match, such as `o.id`.'],
      starterCode: COUNT_STARTER('FROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id', 'c', 'orders'),
      hints: ['Look at a customer who has no orders. How many rows does the join give them?', '`COUNT(*)` counts rows; `COUNT(column)` counts non-empty values of that column.', 'Which column of the orders table is empty when there is no match?'],
      checks: sqlRes('SELECT c.name, COUNT(o.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.name', 'market', ['market-b'], { ordered: true, columns: 'names' }),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'sql-18-events-per-machine', objectiveId: 'sql-obj-fix-count', title: 'Maintenance Events Per Machine, Fixed', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.debug', 'sql.joins'], concepts: ['LEFT JOIN', 'COUNT', 'debugging'], difficulty: 3, context: 'maintenance',
      prompt: text('The maintenance report should list every machine’s `name` and its number of maintenance events as `events`, **with 0 for machines that have never had one**. The query below runs, but one machine shows the wrong number. Fix it, keeping the columns and the order (by name).'),
      expectedBehavior: 'Every machine with its true number of events, 0 when none.',
      starterCode: COUNT_STARTER('FROM machines m\nLEFT JOIN maintenance_events e ON e.machine_id = m.id', 'm', 'events'),
      hints: ['Find the machine whose number looks wrong. What does the join give a machine with no events?', 'Which kind of count ignores empty values?', 'Count a column of the events table that would be empty without a match.'],
      checks: sqlRes('SELECT m.name, COUNT(e.id) AS events FROM machines m LEFT JOIN maintenance_events e ON e.machine_id = m.id GROUP BY m.id ORDER BY m.name', 'works', ['works-b', 'works-boss'], { ordered: true, columns: 'names' }),
      xpReward: 90, coinReward: 13,
    },
    {
      id: 'sql-18-runs-per-machine', objectiveId: 'sql-obj-fix-count', title: 'Production Runs Per Machine, Fixed', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.debug', 'sql.joins'], concepts: ['LEFT JOIN', 'COUNT', 'debugging'], difficulty: 3, context: 'manufacturing',
      prompt: text('The production report should list every machine’s `name` and its number of production runs as `runs`, **with 0 for machines that have never run**. The query below runs, but idle machines show the wrong number. Fix it, keeping the columns and the order (by name).'),
      expectedBehavior: 'Every machine with its true number of runs, 0 when none.',
      starterCode: COUNT_STARTER('FROM machines m\nLEFT JOIN production_runs r ON r.machine_id = m.id', 'm', 'runs'),
      hints: ['Compare the numbers for a busy machine and an idle one. What differs about how the join treats them?', 'One kind of count ignores empty values.', 'Count a column of the runs table that is empty when nothing matched.'],
      checks: sqlRes('SELECT m.name, COUNT(r.id) AS runs FROM machines m LEFT JOIN production_runs r ON r.machine_id = m.id GROUP BY m.id ORDER BY m.name', 'works', ['works-b', 'works-boss'], { ordered: true, columns: 'names' }),
      xpReward: 90, coinReward: 13,
    },
    {
      id: 'sql-18-machine-totals', objectiveId: 'sql-obj-fix-fanout', title: 'Machine Totals, Fixed', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.debug', 'sql.aggregate', 'sql.joins'], concepts: ['fan-out', 'subquery', 'debugging'], difficulty: 4, context: 'manufacturing',
      prompt: text('The plant manager wants, for **every machine**, its `name`, the total units it has made (`units`) and its total downtime hours (`downtime`); machines with no runs or no events show 0 for that figure. The query below runs, but the numbers are far too big and some machines are missing. Fix it, keeping the columns and the order (by name).'),
      expectedBehavior: 'Every machine with its true total units and total downtime (0 when it has none).',
      starterCode: '-- This query runs, but its numbers are wrong. Find out why and fix it.\nSELECT m.name, SUM(r.units_made) AS units, SUM(e.downtime_hours) AS downtime\nFROM machines m\nJOIN production_runs r ON r.machine_id = m.id\nJOIN maintenance_events e ON e.machine_id = m.id\nGROUP BY m.id\nORDER BY m.name;\n',
      hints: ['For one machine, count how many rows the two joins produce. How does that compare with its runs and its events?', 'Two independent one-to-many relationships multiply each other when joined together.', 'Add each table up on its own (a subquery per figure, or two aggregated CTEs), then attach the results to the machine.'],
      checks: sqlRes('SELECT m.name, COALESCE((SELECT SUM(r.units_made) FROM production_runs r WHERE r.machine_id = m.id), 0) AS units, COALESCE((SELECT SUM(e.downtime_hours) FROM maintenance_events e WHERE e.machine_id = m.id), 0) AS downtime FROM machines m ORDER BY m.name', 'works', ['works-b', 'works-boss'], { ordered: true, columns: 'names', approx: 0.001 }),
      xpReward: 120, coinReward: 18,
    },
    {
      id: 'sql-18-team-summary', objectiveId: 'sql-obj-fix-fanout', title: 'Team Summary, Fixed', mode: 'challenge', language: 'sql', db: 'league', skillIds: ['sql.debug', 'sql.aggregate', 'sql.joins'], concepts: ['fan-out', 'subquery', 'debugging'], difficulty: 4, context: 'sports analytics',
      prompt: text('A league analyst wants, for **every team**, its `name`, the total home runs hit by its players over all seasons (`home_runs`) and the number of games it has played at home (`home_games`); a team with none of either shows 0. The query below runs, but both figures are far too big. Fix it, keeping the columns and the order (by name).'),
      expectedBehavior: 'Every team with its true home-run total and home-game count.',
      starterCode: '-- This query runs, but its numbers are wrong. Find out why and fix it.\nSELECT t.name, SUM(s.home_runs) AS home_runs, COUNT(g.id) AS home_games\nFROM teams t\nJOIN players p ON p.team_id = t.id\nJOIN player_stats s ON s.player_id = p.id\nJOIN games g ON g.home_team_id = t.id\nGROUP BY t.id\nORDER BY t.name;\n',
      hints: ['Follow one team: how many rows does the chain of joins produce for it?', 'The players’ statistics and the home games have nothing to do with each other, yet the join pairs them up.', 'Compute each figure separately for the team (subquery or CTE), then combine.'],
      checks: sqlRes('SELECT t.name, COALESCE((SELECT SUM(s.home_runs) FROM player_stats s JOIN players p ON p.id = s.player_id WHERE p.team_id = t.id), 0) AS home_runs, COALESCE((SELECT COUNT(*) FROM games g WHERE g.home_team_id = t.id), 0) AS home_games FROM teams t ORDER BY t.name', 'league', ['league-b'], { ordered: true, columns: 'names' }),
      xpReward: 120, coinReward: 18,
    },
  ],
};
