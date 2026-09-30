import { sqlRes, text } from '../helpers';
import type { LessonBundle } from '../schema';

const START = '-- Write your query below\n';

/** Whole calendar years between a date column and 2025-03-15: the year difference, minus one if the anniversary has not happened yet. */
const years = (col: string) => `CAST(strftime('%Y', '2025-03-15') AS INTEGER) - CAST(strftime('%Y', ${col}) AS INTEGER) - (strftime('%m-%d', '2025-03-15') < strftime('%m-%d', ${col}))`;

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-16-text-dates', title: 'Dates and Text in SQL', language: 'sql', skillId: 'sql.text',
    blurb: 'Dates are text with rules, and text has pieces. Slice them, format them, and get "how many whole years" right.', prerequisites: ['sql-08-case'], xpReward: 60,
    reference: {
      title: 'Dates and text functions',
      body: text(
        'SQLite stores dates as text in **ISO form** (`2024-03-05`), which sorts correctly. `strftime(format, date)` extracts or formats: `%Y` year, `%m` month, `%d` day, `%w` weekday (0 = Sunday), so `strftime(\'%Y-%m\', ordered_on)` is a month you can `GROUP BY`. `date(x, \'+7 days\')` shifts a date; `julianday(a) - julianday(b)` is the number of days between two dates.',
        'Text: `UPPER`, `LOWER`, `LENGTH`, `SUBSTR(text, start, count)` (positions start at **1**), `TRIM`, `REPLACE(text, from, to)`, `||` joins text, `printf(\'%03d\', n)` pads numbers with zeros. `NULL` in any of these gives `NULL`: wrap with `COALESCE(x, \'fallback\')`.',
        '**Whole years between two dates is a classic trap.** `year(b) - year(a)` is wrong until the anniversary has passed. The reliable recipe: year difference, **minus one if the month-day of `b` is earlier than the month-day of `a`** (compare `strftime(\'%m-%d\', ...)` text). Dividing days by 365 drifts, because of leap years.',
      ),
      example: "SELECT name,\n       strftime('%Y', hired_on) AS year,\n       UPPER(SUBSTR(name, 1, 3)) AS code\nFROM employees LIMIT 3;",
    },
    steps: [
      { kind: 'teach', title: 'Dates are text with rules', body: text('A date column is really text like `2024-03-05`. Because the year comes first, plain sorting is chronological, and functions can cut it apart. The trouble starts when you calculate with dates: "how old is this?" hides leap years and anniversaries.', 'Text functions are similar: everything counts from position 1, and one `NULL` anywhere in an expression makes the whole result `NULL` unless you handle it.') },
      {
        kind: 'demo', title: 'Cut dates and text apart', language: 'sql', db: 'market',
        body: text('Months come from `strftime`; codes come from `SUBSTR` and `UPPER`; `COALESCE` supplies a fallback for a missing city.'),
        code: "SELECT name,\n       strftime('%Y-%m', joined_on) AS joined_month,\n       COALESCE(UPPER(SUBSTR(city, 1, 3)), '???') AS city_code\nFROM customers\nORDER BY joined_on\nLIMIT 8;",
        notice: 'Customers with no city show `???`, because `SUBSTR(NULL, ...)` is `NULL` and `COALESCE` replaced it. Remove the `COALESCE` and those rows go empty.',
      },
      {
        kind: 'demo', title: 'A birthday that has not happened yet', language: 'sql', db: 'market',
        body: text('Whole years since a date, as of `2025-03-15`. Compare the naive answer with the careful one.'),
        code: "SELECT name, joined_on,\n       2025 - CAST(strftime('%Y', joined_on) AS INTEGER) AS naive,\n       2025 - CAST(strftime('%Y', joined_on) AS INTEGER) - (strftime('%m-%d', '2025-03-15') < strftime('%m-%d', joined_on)) AS whole_years\nFROM customers\nORDER BY joined_on\nLIMIT 10;",
        notice: 'For anyone who joined after mid-March the two columns differ by one: their anniversary this year has not come yet. `(a < b)` is `1` when true, so it can be subtracted directly.',
      },
      { kind: 'challenge', challengeId: 'sql-16-orders-per-month' },
      { kind: 'challenge', challengeId: 'sql-16-employee-tenure' },
      { kind: 'challenge', challengeId: 'sql-16-city-codes' },
    ],
  },
  objectives: [
    { id: 'sql-obj-full-years', title: 'Whole years between two dates', summary: 'Compute completed years with a year difference corrected by the anniversary, rather than a naive subtraction or a division by 365.' },
    { id: 'sql-obj-text-functions', title: 'Build labels from text pieces', summary: 'Slice, upper-case, pad and join text, supplying a fallback for missing values.' },
  ],
  challenges: [
    {
      id: 'sql-16-orders-per-month', title: 'Orders Per Month', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.text', 'sql.aggregate'], concepts: ['strftime', 'GROUP BY'], difficulty: 2, context: 'retail',
      prompt: text('Show how many orders were placed in each calendar month: a `month` column like `2024-05` and an `orders` column with the count. Earliest month first.'),
      expectedBehavior: 'One row per month with its order count, in date order.',
      guidedSteps: ['Turn `ordered_on` into a month with `strftime(\'%Y-%m\', ordered_on)` and name it `month`.', '`GROUP BY` that month and `COUNT(*)`.', '`ORDER BY month`.'],
      starterCode: START,
      hints: ['Which function cuts a date into year and month?', 'Group by the expression you produced, then count.', 'Because the format is year first, ordering the text also orders the months.'],
      checks: sqlRes("SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month ORDER BY month", 'market', ['market-b'], { ordered: true, columns: 'names' }),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-16-employee-tenure', objectiveId: 'sql-obj-full-years', title: 'Years of Service', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.text', 'sql.select'], concepts: ['strftime', 'whole-years', 'date-arithmetic'], difficulty: 4, context: 'manufacturing',
      prompt: text('HR is preparing service awards. As of **2025-03-15**, show every employee’s `name` and `full_years`: the number of **completed years** since `hired_on`. Someone hired on 2023-03-15 has 2 completed years on that day; someone hired on 2023-03-16 has 1. Order by name.'),
      expectedBehavior: 'name and completed years for every employee, by name.',
      starterCode: START,
      hints: ['Subtracting years is not enough: when is a "year of service" actually complete?', 'Compare the month-and-day of the two dates to decide whether to take one off.', 'A comparison in SQLite gives 1 or 0, so it can be subtracted from a number.'],
      checks: sqlRes(`SELECT name, ${years('hired_on')} AS full_years FROM employees ORDER BY name`, 'works', ['works-b', 'works-edge'], { ordered: true, columns: 'names' }),
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'sql-16-customer-tenure', objectiveId: 'sql-obj-full-years', title: 'Customer Anniversaries', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.text', 'sql.select'], concepts: ['strftime', 'whole-years', 'date-arithmetic'], difficulty: 4, context: 'retail',
      prompt: text('Marketing sends a loyalty card to customers on their membership anniversaries. As of **2025-03-15**, show every customer’s `name` and `full_years`: the number of **completed years** since `joined_on`. Someone who joined on 2024-03-15 has 1 completed year on that day; someone who joined on 2024-03-16 has 0. Order by name.'),
      expectedBehavior: 'name and completed years for every customer, by name.',
      starterCode: START,
      hints: ['A membership year is complete only on its anniversary. What does that say about a plain year subtraction?', 'Compare the month-and-day parts of the two dates.', 'A comparison gives 1 or 0 in SQLite, so it can be subtracted.'],
      checks: sqlRes(`SELECT name, ${years('joined_on')} AS full_years FROM customers ORDER BY name`, 'market', ['market-b', 'market-edge'], { ordered: true, columns: 'names' }),
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'sql-16-city-codes', objectiveId: 'sql-obj-text-functions', title: 'City Codes for Labels', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.text', 'sql.select'], concepts: ['SUBSTR', 'UPPER', 'text-functions'], difficulty: 3, context: 'logistics',
      prompt: text('A courier needs a short code for each customer’s city. Show each customer’s `name` and a `code`: the **first three letters of the city in capitals** (`Leeds` becomes `LEE`), or `UNK` when the city is not known. Order by name.'),
      expectedBehavior: 'name and a three-letter city code (UNK when the city is unknown), by name.',
      starterCode: START,
      hints: ['Which functions cut the first few characters and change the case?', 'What does a text function return when its input is missing?', '`COALESCE(value, fallback)` supplies a substitute for NULL.'],
      checks: sqlRes("SELECT name, COALESCE(UPPER(SUBSTR(city, 1, 3)), 'UNK') AS code FROM customers ORDER BY name", 'market', ['market-b'], { ordered: true, columns: 'names' }),
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'sql-16-badges', objectiveId: 'sql-obj-text-functions', title: 'Employee Badges', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.text', 'sql.select'], concepts: ['SUBSTR', 'UPPER', 'text-functions'], difficulty: 3, context: 'manufacturing',
      prompt: text('Security prints a badge code for each employee. Show each employee’s `name` and a `code`: the **first three letters of the role in capitals**, a dash, then the employee `id` written with **at least three digits** (padded with zeros), for example `TEC-007`. Order by name.'),
      expectedBehavior: 'name and a code like TEC-007, by name.',
      starterCode: START,
      hints: ['Two pieces of text and a number have to be joined into one label.', 'Numbers need padding with zeros: look for a formatting function.', '`||` joins text, and `printf(\'%03d\', n)` pads a number to three digits.'],
      checks: sqlRes("SELECT name, UPPER(SUBSTR(role, 1, 3)) || '-' || printf('%03d', id) AS code FROM employees ORDER BY name", 'works', ['works-b'], { ordered: true, columns: 'names' }),
      xpReward: 85, coinReward: 12,
    },
  ],
};
