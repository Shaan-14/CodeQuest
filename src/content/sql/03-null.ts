import { sqlRes, text } from '../helpers';
import type { LessonBundle } from '../schema';

const START = '-- Write your query below\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-03-null', title: 'NULL: The Missing Value', language: 'sql', skillId: 'sql.select',
    blurb: 'What NULL means, why = NULL never works, and the traps it sets.', prerequisites: ['sql-02-sort-limit'], xpReward: 45,
    reference: {
      title: 'NULL',
      body: text(
        '`NULL` means **unknown or missing**. It is not 0, not an empty string, not “nothing”. Any comparison with NULL gives “unknown”, and `WHERE` keeps only rows where the condition is *true*. So `city = NULL` matches **nothing**, and `city <> \'Leeds\'` **drops rows where city is NULL**.',
        'Test with `IS NULL` / `IS NOT NULL`. To keep unknowns in a negative filter, say so: `city <> \'Leeds\' OR city IS NULL`. `COALESCE(city, \'unknown\')` swaps a NULL for a default.',
      ),
      example: "SELECT name FROM customers\nWHERE city <> 'Leeds' OR city IS NULL;",
    },
    steps: [
      {
        kind: 'teach', title: 'Not zero. Not blank. Unknown.',
        body: text(
          'Real data is full of gaps: a customer who did not give a city, a repair whose cost was never recorded, a sensor that failed to report. A database records such gaps as **NULL**. It looks harmless, but NULL behaves differently from every other value, and it causes more wrong answers in real reports than almost anything else.',
          'The key idea: NULL means *unknown*. Is an unknown city equal to Leeds? Unknown. Is it different from Leeds? Also unknown. And `WHERE` only keeps rows that are definitely true.',
        ),
      },
      {
        kind: 'demo', title: 'The wrong way and the right way', language: 'sql', db: 'market',
        body: text('Two queries that look like they ask the same thing. Compare their results.'),
        code: 'SELECT name FROM customers WHERE city = NULL;\nSELECT name FROM customers WHERE city IS NULL;',
        notice: 'The first found nobody, even though some customers have no city, because nothing is ever `= NULL`. `IS NULL` is the correct test.',
      },
      {
        kind: 'demo', title: 'A trap in a negative filter', language: 'sql', db: 'market',
        body: text('Count all customers, then count those whose city is not Leeds, then those who ARE in Leeds. Do they add up to the total?'),
        code: "SELECT COUNT(*) AS everyone FROM customers;\nSELECT COUNT(*) AS not_leeds FROM customers WHERE city <> 'Leeds';\nSELECT COUNT(*) AS leeds FROM customers WHERE city = 'Leeds';",
        notice: 'not_leeds + leeds is LESS than everyone. The customers with an unknown city are in neither group: they are quietly missing from both. This silent loss is the classic NULL trap.',
      },
      { kind: 'challenge', challengeId: 'sql-03-unknown-city' },
      { kind: 'challenge', challengeId: 'sql-03-unrecorded-cost' },
      { kind: 'challenge', challengeId: 'sql-03-not-leeds' },
    ],
  },
  objectives: [
    { id: 'sql-obj-null-filter', title: 'Find rows with missing values', summary: 'Use IS NULL to find records where something was never recorded.' },
    { id: 'sql-obj-null-trap', title: 'Keep the unknowns in a negative filter', summary: 'Write a “not equal” or “not above” condition that still includes NULL rows when asked.' },
  ],
  challenges: [
    {
      id: 'sql-03-unknown-city', title: 'Who Left the City Blank?', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.select'], concepts: ['NULL', 'IS NULL'], difficulty: 2, context: 'retail',
      prompt: text('List the **names** of the customers whose **city is not recorded**.'),
      expectedBehavior: 'One column of names: only customers with no city.',
      guidedSteps: ['Remember: `= NULL` never matches.', 'The right test is `IS NULL`.'],
      starterCode: START,
      hints: ['A missing value is `NULL`.', 'You cannot use `=` with NULL. There is a special test.', 'The condition you need is `city IS NULL`.'],
      checks: sqlRes('SELECT name FROM customers WHERE city IS NULL', 'market', ['market-b']),
      xpReward: 45, coinReward: 6,
    },
    {
      id: 'sql-03-unrecorded-cost', objectiveId: 'sql-obj-null-filter', title: 'Missing Repair Costs', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.select'], concepts: ['NULL', 'IS NULL'], difficulty: 2, context: 'manufacturing',
      prompt: text('Accounts needs to chase missing paperwork. List the **id, machine_id and event_date** of every maintenance event whose **cost was never recorded**.'),
      expectedBehavior: 'Three columns, only events with no cost.',
      starterCode: '',
      hints: ['Some events have a cost that is unknown.', 'Missing values are NULL, and NULL needs a special test.', '`WHERE cost IS NULL`'],
      checks: sqlRes('SELECT id, machine_id, event_date FROM maintenance_events WHERE cost IS NULL', 'works', ['works-b']),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-03-unrecorded-defects', objectiveId: 'sql-obj-null-filter', title: 'Uncounted Defects', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.select'], concepts: ['NULL', 'IS NULL'], difficulty: 2, context: 'quality control',
      prompt: text('Quality control noticed that some production runs have no defect count. List the **id and machine_id** of every run where the number of defective units was **not recorded**.'),
      expectedBehavior: 'Two columns, only runs whose defect count is unknown.',
      starterCode: '',
      hints: ['A run with no recorded count has an unknown value in that column.', 'Unknown means NULL.', '`WHERE units_defective IS NULL`'],
      checks: sqlRes('SELECT id, machine_id FROM production_runs WHERE units_defective IS NULL', 'works', ['works-b']),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-03-not-leeds', objectiveId: 'sql-obj-null-trap', title: 'Everyone Outside Leeds', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.select'], concepts: ['NULL', 'OR', 'negative filter'], difficulty: 3, context: 'retail',
      prompt: text('Marketing wants to reach customers **outside Leeds**. List the **names** of every customer who does **not** live in Leeds. Customers **whose city is unknown must be included** too.'),
      expectedBehavior: 'All customers except those in Leeds, including those with no city.',
      starterCode: '',
      hints: ['Test your query: do the Leeds customers and your result together cover everyone?', 'A plain “not equal” condition silently drops unknown cities.', "Combine the negative test with a NULL test: `city <> 'Leeds' OR city IS NULL`."],
      checks: sqlRes("SELECT name FROM customers WHERE city <> 'Leeds' OR city IS NULL", 'market', ['market-b']),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'sql-03-cheap-or-unknown', objectiveId: 'sql-obj-null-trap', title: 'Not Expensive, Or Unknown', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.select'], concepts: ['NULL', 'OR', 'negative filter'], difficulty: 3, context: 'manufacturing',
      prompt: text('The finance team’s budget check needs every maintenance event whose cost was **not above 1000**. Events whose **cost is unknown must be included**, because nobody can say they were expensive. Show the event **id**.'),
      expectedBehavior: 'Events costing 1000 or less, plus events with no recorded cost.',
      starterCode: '',
      hints: ['“Not above 1000” means 1000 or less.', 'A NULL cost is neither above nor below anything, so a plain comparison leaves it out.', '`cost <= 1000 OR cost IS NULL`'],
      checks: sqlRes('SELECT id FROM maintenance_events WHERE cost <= 1000 OR cost IS NULL', 'works', ['works-b']),
      xpReward: 70, coinReward: 10,
    },
  ],
};
