import { sqlRes, text } from '../helpers';
import type { LessonBundle } from '../schema';

const START = '-- Write your query below\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-19-investigations', title: 'Answering a Real Question', language: 'sql', skillId: 'sql.analysis',
    blurb: 'Analysts are asked "how did it change?" and "what share is it?". Build rates, shares and period-over-period comparisons, step by step.', prerequisites: ['sql-11-window'], xpReward: 90,
    reference: {
      title: 'Rates, shares and change over time',
      body: text(
        'A **share** is a part divided by a whole: `100.0 * COUNT(*) / (SELECT COUNT(*) FROM orders)`. A **rate by group** is the same idea inside each group: `100.0 * SUM(CASE WHEN status = \'returned\' THEN 1 ELSE 0 END) / COUNT(*)`. Write **`100.0`** (a decimal), not `100`: dividing two integers truncates. `ROUND(x, 1)` tidies the result. Decide what counts as *success* precisely (is a draw a win?) and what the *denominator* is (all rows? only some?).',
        '**Change over time** compares each period with the one before. First produce one row per period (a CTE that `GROUP BY`s a month or season), then use `LAG(value) OVER (ORDER BY period)` to read the previous row and subtract. The first period has no previous one, so its change is `NULL`.',
        'Break a big question into named steps with **CTEs** (`WITH step AS (SELECT ...)`), check each step on its own, then combine. If a number looks odd, ask which rows are in the denominator.',
      ),
      example: "WITH monthly AS (\n  SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month\n)\nSELECT month, orders, orders - LAG(orders) OVER (ORDER BY month) AS change\nFROM monthly ORDER BY month;",
    },
    steps: [
      { kind: 'teach', title: 'From "give me the rows" to "what is going on?"', body: text('A manager rarely asks for a list; they ask "which category has the worst return rate?" or "did downtime get better or worse this month?". Those are **rates**, **shares** and **changes**, and each has a well-known shape.', 'The care goes into the definitions: what exactly counts, what the whole is, and what happens at the very first period.') },
      {
        kind: 'demo', title: 'A share and a rate', language: 'sql', db: 'market',
        body: text('First each order status’s share of all orders; then the return rate per product category.'),
        code: "SELECT status, COUNT(*) AS orders,\n       ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM orders), 1) AS share_pct\nFROM orders GROUP BY status ORDER BY orders DESC;\n\nSELECT p.category,\n       ROUND(100.0 * SUM(CASE WHEN o.status = 'returned' THEN 1 ELSE 0 END) / COUNT(*), 1) AS return_pct\nFROM order_items i\nJOIN orders o ON o.id = i.order_id\nJOIN products p ON p.id = i.product_id\nGROUP BY p.category ORDER BY return_pct DESC;",
        notice: 'Try changing `100.0` to `100`: the percentages become whole numbers (or 0), because integer division truncates. The denominator of the second query is every order line in the category, not just the returned ones.',
      },
      { kind: 'challenge', challengeId: 'sql-19-status-share' },
      { kind: 'challenge', challengeId: 'sql-19-return-rate' },
      { kind: 'challenge', challengeId: 'sql-19-monthly-orders' },
    ],
  },
  objectives: [
    { id: 'sql-obj-rate-by-group', title: 'Compute a rate for each group', summary: 'Divide a conditional count by the group size, with decimals, and order by the rate.' },
    { id: 'sql-obj-period-change', title: 'Compare each period with the previous one', summary: 'Summarise by period in a CTE and use LAG to show the previous value and the change.' },
  ],
  challenges: [
    {
      id: 'sql-19-status-share', title: 'Share of Orders by Status', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.analysis', 'sql.aggregate'], concepts: ['share', 'subquery', 'ROUND'], difficulty: 3, context: 'retail',
      prompt: text('For each order `status` show the number of orders (`orders`) and the percentage of **all** orders it represents (`share_pct`, rounded to 1 decimal place). Most common status first; ties by status.'),
      expectedBehavior: 'status, orders and share_pct for every status.',
      guidedSteps: ['`GROUP BY status` and `COUNT(*)` for `orders`.', 'The whole is `(SELECT COUNT(*) FROM orders)`.', '`ROUND(100.0 * COUNT(*) / whole, 1)`.', 'Order by `orders` descending, then status.'],
      starterCode: START,
      hints: ['A share needs a part and a whole; which query gives the whole?', 'Multiply by a decimal so the division does not truncate.', '`ROUND(value, 1)` keeps one decimal place.'],
      checks: sqlRes('SELECT status, COUNT(*) AS orders, ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM orders), 1) AS share_pct FROM orders GROUP BY status ORDER BY orders DESC, status', 'market', ['market-b'], { ordered: true, columns: 'names', approx: 0.001 }),
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'sql-19-return-rate', objectiveId: 'sql-obj-rate-by-group', title: 'Return Rate by Category', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.analysis', 'sql.aggregate', 'sql.joins'], concepts: ['rate', 'conditional-aggregation', 'decimal-division'], difficulty: 4, context: 'retail',
      prompt: text('The buyers want to know which product categories come back most. For each product `category`, show the number of order **lines** sold (`lines`) and the percentage of those lines that belong to a `returned` order (`return_pct`, rounded to 1 decimal place). Highest return rate first; ties by category.'),
      expectedBehavior: 'category, lines and return_pct for every category, worst first.',
      starterCode: START,
      hints: ['What is being counted, and which of those count as "returned"?', 'A conditional count divided by the group’s total count, as a decimal.', 'The status lives on the order, the category on the product; the order lines connect them.'],
      checks: sqlRes("SELECT p.category, COUNT(*) AS lines, ROUND(100.0 * SUM(CASE WHEN o.status = 'returned' THEN 1 ELSE 0 END) / COUNT(*), 1) AS return_pct FROM order_items i JOIN orders o ON o.id = i.order_id JOIN products p ON p.id = i.product_id GROUP BY p.category ORDER BY return_pct DESC, p.category", 'market', ['market-b'], { ordered: true, columns: 'names', approx: 0.001 }),
      xpReward: 120, coinReward: 18,
    },
    {
      id: 'sql-19-home-win-rate', objectiveId: 'sql-obj-rate-by-group', title: 'Home Win Rate by Team', mode: 'challenge', language: 'sql', db: 'league', skillIds: ['sql.analysis', 'sql.aggregate', 'sql.joins'], concepts: ['rate', 'conditional-aggregation', 'decimal-division'], difficulty: 4, context: 'sports analytics',
      prompt: text('The league office is comparing home advantage. For each team show the number of games it played **at home** (`home_games`) and the percentage of those it **won** (`win_pct`, rounded to 1 decimal place; a draw is not a win). Highest percentage first; ties by team name. Use the team’s `name`.'),
      expectedBehavior: 'team name, home_games and win_pct for every team with home games, best first.',
      starterCode: START,
      hints: ['What is the group here, and what is the "whole" inside each group?', 'Decide precisely what counts as a win and what does not.', 'A conditional count divided by the group’s total count, as a decimal.'],
      checks: sqlRes('SELECT t.name, COUNT(*) AS home_games, ROUND(100.0 * SUM(CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END) / COUNT(*), 1) AS win_pct FROM games g JOIN teams t ON t.id = g.home_team_id GROUP BY t.id ORDER BY win_pct DESC, t.name', 'league', ['league-b'], { ordered: true, columns: 'count', approx: 0.001 }),
      xpReward: 120, coinReward: 18,
    },
    {
      id: 'sql-19-monthly-orders', objectiveId: 'sql-obj-period-change', title: 'Orders Month over Month', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.analysis', 'sql.advanced'], concepts: ['CTE', 'LAG', 'period-change'], difficulty: 4, context: 'retail',
      prompt: text('For each calendar month (like `2024-05`) show `orders` (how many orders were placed), `previous` (the previous month’s count, empty for the first month) and `change` (this month minus the previous month, empty for the first month). Earliest month first.'),
      expectedBehavior: 'month, orders, previous and change for every month, in date order.',
      starterCode: START,
      hints: ['First get one row per month; a named step keeps that simple.', 'A window function can read the previous row of a result.', 'Which value does the first month get, and why?'],
      checks: sqlRes("WITH monthly AS (SELECT strftime('%Y-%m', ordered_on) AS month, COUNT(*) AS orders FROM orders GROUP BY month) SELECT month, orders, LAG(orders) OVER (ORDER BY month) AS previous, orders - LAG(orders) OVER (ORDER BY month) AS change FROM monthly ORDER BY month", 'market', ['market-b'], { ordered: true, columns: 'names' }),
      xpReward: 120, coinReward: 18,
    },
    {
      id: 'sql-19-monthly-downtime', objectiveId: 'sql-obj-period-change', title: 'Downtime Month over Month', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.analysis', 'sql.advanced'], concepts: ['CTE', 'LAG', 'period-change'], difficulty: 4, context: 'manufacturing',
      prompt: text('Is maintenance getting better or worse? For each calendar month (like `2024-05`) of `event_date`, show `hours` (total downtime hours, rounded to 1 decimal place), `previous` (the previous month’s hours, empty for the first month) and `change` (this month minus the previous month, rounded to 1 decimal place, empty for the first month). Earliest month first.'),
      expectedBehavior: 'month, hours, previous and change for every month, in date order.',
      starterCode: START,
      hints: ['First get one row per month; a named step keeps that simple.', 'A window function can read the previous row of a result.', 'Rounding belongs where the numbers are produced, so the change is computed from rounded or exact hours consistently.'],
      checks: sqlRes("WITH m AS (SELECT strftime('%Y-%m', event_date) AS month, ROUND(SUM(downtime_hours), 1) AS hours FROM maintenance_events GROUP BY month) SELECT month, hours, LAG(hours) OVER (ORDER BY month) AS previous, ROUND(hours - LAG(hours) OVER (ORDER BY month), 1) AS change FROM m ORDER BY month", 'works', ['works-b'], { ordered: true, columns: 'names', approx: 0.11 }),
      xpReward: 120, coinReward: 18,
    },
  ],
};
