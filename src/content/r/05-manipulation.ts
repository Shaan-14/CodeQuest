import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { rCalls } from './helpers';

const EMP = 'data.frame(name = c("Ana", "Ben", "Caz", "Dev", "Eli", "Fay"), dept = c("Ops", "Ops", "Eng", "Eng", "Ops", "HR"), salary = c(48000, 55000, 72000, 51000, 50000, 45000), stringsAsFactors = FALSE)';
const DEPT_MEANS = '.cq_ref <- function(df) { a <- aggregate(salary ~ dept, data = df, FUN = mean); names(a) <- c("dept", "mean_salary"); a[order(a$dept), ] }';
const REGION_TOTALS = '.cq_ref <- function(sales) { a <- aggregate(amount ~ region, data = sales, FUN = sum); names(a) <- c("region", "total"); a[order(-a$total, a$region), ] }';
const DEFECT_RATE = '.cq_ref <- function(runs) { u <- aggregate(units ~ line, data = runs, FUN = sum); d <- aggregate(defects ~ line, data = runs, FUN = sum); m <- merge(u, d, by = "line"); out <- data.frame(line = m$line, rate = round(m$defects / m$units, 3), stringsAsFactors = FALSE); out[order(-out$rate, out$line), ] }';
const WITH_MANAGER = '.cq_ref <- function(emp, depts) { m <- merge(emp, depts, by = "dept", all.x = TRUE); out <- data.frame(name = m$name, dept_name = m$dept_name, manager = m$manager, stringsAsFactors = FALSE); out[order(out$name), ] }';
const WITH_PRICE = '.cq_ref <- function(orders, prices) { m <- merge(orders, prices, by = "item", all.x = TRUE); m$total <- m$qty * m$price; out <- data.frame(order_id = m$order_id, item = m$item, total = m$total, stringsAsFactors = FALSE); out[order(out$order_id), ] }';

export const bundle: LessonBundle = {
  lesson: {
    id: 'r-05-manipulation', title: 'R: Summarising, Sorting and Joining Data', language: 'r', skillId: 'r.manipulation',
    blurb: 'Group and summarise with aggregate, order rows, add columns and join two tables with merge.', prerequisites: ['r-03-functions', 'r-04-dataframes'], xpReward: 75,
    reference: {
      title: 'Transforming data frames',
      body: text(
        '`aggregate(salary ~ dept, data = d, FUN = mean)` summarises `salary` per `dept`. `order(x)` gives the row order that sorts `x` (`order(-x, y)` sorts `x` descending then `y`): `d[order(d$dept), ]`. Add a column by assigning: `d$total <- d$qty * d$price`.',
        '`merge(a, b, by = "key")` joins two tables on a shared column; `all.x = TRUE` keeps every row of `a` even without a match (the missing values become `NA`). Returned tables keep their columns in the order you build them: `data.frame(name = m$name, total = m$total)` picks and orders columns explicitly. Functions that return a data frame should return **exactly the columns and row order the task describes**.',
      ),
      example: 'emp <- data.frame(name = c("A", "B"), dept = c("x", "y"), salary = c(10, 30))\nmeans <- aggregate(salary ~ dept, data = emp, FUN = mean)\nprint(means[order(-means$salary), ])',
    },
    steps: [
      { kind: 'teach', title: 'Split, apply, combine', body: text('Most analysis questions are “per group” questions: revenue per region, defect rate per line, mean salary per department. The pattern is always the same: **split** the rows by a key, **apply** a summary to each group, **combine** the results into a new table. `aggregate` does all three.', 'Joining is the other everyday move: one table holds orders, another holds prices, and `merge` brings them together on the shared key. Always ask what should happen to rows with no match.') },
      {
        kind: 'demo', title: 'Summarise, order, join', language: 'r',
        body: text('Two small tables. Run it and follow each step.'),
        code: 'emp <- data.frame(name = c("Ana", "Ben", "Caz"), dept = c("Ops", "Ops", "Eng"), salary = c(48000, 55000, 72000))\nmeans <- aggregate(salary ~ dept, data = emp, FUN = mean)\nprint(means)\ndepts <- data.frame(dept = c("Ops", "Eng"), boss = c("Kim", "Lee"))\nprint(merge(emp, depts, by = "dept"))',
        notice: '`aggregate` produced one row per department. `merge` attached the boss to each employee using the shared `dept` column.',
      },
      { kind: 'challenge', challengeId: 'r-05-dept-means' },
      { kind: 'challenge', challengeId: 'r-05-region-totals' },
      { kind: 'challenge', challengeId: 'r-05-with-manager' },
    ],
  },
  objectives: [
    { id: 'r-obj-group-summary', title: 'Summarise a table per group', summary: 'Group rows by a key, summarise each group and sort the result.' },
    { id: 'r-obj-join', title: 'Join two tables and compute a column', summary: 'Merge tables on a key, keep unmatched rows and return the requested columns in order.' },
  ],
  challenges: [
    {
      id: 'r-05-dept-means', title: 'Mean Salary by Department', mode: 'learning', language: 'r', skillIds: ['r.manipulation'], concepts: ['aggregate', 'order'], difficulty: 2, context: 'business',
      prompt: text('Write `dept_means(df)`: `df` has the columns `name`, `dept` and `salary`. Return a data frame with two columns, `dept` and `mean_salary` (the mean salary of that department), **one row per department, sorted by `dept` A to Z**.'),
      expectedBehavior: 'A data frame dept, mean_salary sorted by dept.',
      guidedSteps: ['`aggregate(salary ~ dept, data = df, FUN = mean)` gives a table per department.', 'Rename the columns with `names(result) <- c("dept", "mean_salary")`.', 'Sort rows with `result[order(result$dept), ]`.'],
      starterCode: 'dept_means <- function(df) {\n  \n}\n',
      hints: ['You are summarising per group.', 'Name the columns exactly as asked.', 'Sort at the end.'],
      checks: rCalls('dept_means', DEPT_MEANS, ['emp', 'emp[emp$dept != "HR", ]', 'data.frame(name = "Z", dept = "q", salary = 5)', 'data.frame(name = c("a", "b", "c"), dept = c("z", "y", "z"), salary = c(1.5, 2, 3.5))'], 1, `emp <- ${EMP}`),
      xpReward: 45, coinReward: 7,
    },
    {
      id: 'r-05-region-totals', objectiveId: 'r-obj-group-summary', title: 'Revenue by Region', mode: 'challenge', language: 'r', skillIds: ['r.manipulation'], concepts: ['aggregate', 'order'], difficulty: 3, context: 'retail',
      prompt: text('Write `region_totals(sales)`: `sales` has the columns `order_id`, `region` and `amount`. Return a data frame with the columns `region` and `total` (the sum of `amount`), **one row per region, biggest total first**; regions with equal totals are in A to Z order.'),
      expectedBehavior: 'A data frame region, total sorted by total descending then region.',
      starterCode: 'region_totals <- function(sales) {\n  \n}\n',
      hints: ['Group, summarise, then order.', 'Ordering by a number descending can be done by negating it.', 'Ties need a second sort key.'],
      checks: rCalls('region_totals', REGION_TOTALS, ['s', 's[s$region != "North", ]', 'data.frame(order_id = 1:3, region = c("b", "a", "b"), amount = c(5, 10, 5))', 'data.frame(order_id = 1, region = "x", amount = 2.5)', 'data.frame(order_id = 1:4, region = c("m", "n", "m", "n"), amount = c(1, 1, 1, 1))'], 1, 's <- data.frame(order_id = 1:6, region = c("North", "South", "North", "East", "South", "North"), amount = c(100, 50, 25, 75, 50, 10), stringsAsFactors = FALSE)'),
      xpReward: 75, coinReward: 11,
    },
    {
      id: 'r-05-defect-rate', objectiveId: 'r-obj-group-summary', title: 'Defect Rate by Line', mode: 'challenge', language: 'r', skillIds: ['r.manipulation'], concepts: ['aggregate', 'order'], difficulty: 3, context: 'manufacturing',
      prompt: text('Write `line_defect_rates(runs)`: `runs` has the columns `line`, `units` and `defects`, one row per production run. Return a data frame with the columns `line` and `rate`: for each line the **total defects divided by the total units, rounded to 3 decimals**; **highest rate first**, equal rates in A to Z order of `line`.'),
      expectedBehavior: 'A data frame line, rate sorted by rate descending then line.',
      starterCode: 'line_defect_rates <- function(runs) {\n  \n}\n',
      hints: ['A rate per line is a ratio of two per-line totals, not an average of run rates.', 'Total both columns per line first.', 'Round at the end; sort after rounding.'],
      checks: rCalls('line_defect_rates', DEFECT_RATE, ['r', 'r[r$line != "L1", ]', 'data.frame(line = c("a", "b"), units = c(100, 100), defects = c(5, 5))', 'data.frame(line = "x", units = 300, defects = 1)', 'data.frame(line = c("p", "p", "q"), units = c(10, 990, 500), defects = c(9, 1, 6))'], 1, 'r <- data.frame(line = c("L1", "L2", "L1", "L3", "L2"), units = c(200, 400, 300, 100, 100), defects = c(10, 8, 5, 4, 2), stringsAsFactors = FALSE)'),
      xpReward: 75, coinReward: 11,
    },
    {
      id: 'r-05-with-manager', objectiveId: 'r-obj-join', title: 'Who Manages Whom?', mode: 'challenge', language: 'r', skillIds: ['r.manipulation', 'r.dataframes'], concepts: ['merge', 'left join'], difficulty: 3, context: 'business',
      prompt: text('Write `with_manager(emp, depts)`: `emp` has the columns `name` and `dept` (a department code) and `depts` has `dept`, `dept_name` and `manager`. Return a data frame with the columns `name`, `dept_name` and `manager`, **one row per employee (employees whose department code is not in `depts` stay, with `NA` for the missing columns)**, sorted by `name` A to Z.'),
      expectedBehavior: 'One row per employee with department name and manager (NA when unknown), sorted by name.',
      starterCode: 'with_manager <- function(emp, depts) {\n  \n}\n',
      hints: ['You need to attach columns from the second table using the shared key.', 'Decide what happens to employees without a match, and make sure they are kept.', 'Return exactly the three columns, in order.'],
      checks: rCalls('with_manager', WITH_MANAGER, ['e, d', 'e[1:2, ], d', 'e, d[d$dept != "ENG", ]', 'data.frame(name = "Solo", dept = "X9", stringsAsFactors = FALSE), d', 'e[order(e$name, decreasing = TRUE), ], d'], 1, 'e <- data.frame(name = c("Dev", "Ana", "Caz", "Ben"), dept = c("ENG", "OPS", "ENG", "ZZZ"), stringsAsFactors = FALSE)\nd <- data.frame(dept = c("OPS", "ENG"), dept_name = c("Operations", "Engineering"), manager = c("Kim", "Lee"), stringsAsFactors = FALSE)'),
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'r-05-with-price', objectiveId: 'r-obj-join', title: 'Price the Orders', mode: 'challenge', language: 'r', skillIds: ['r.manipulation', 'r.dataframes'], concepts: ['merge', 'left join'], difficulty: 3, context: 'retail',
      prompt: text('Write `priced_orders(orders, prices)`: `orders` has the columns `order_id`, `item` and `qty`; `prices` has `item` and `price`. Return a data frame with the columns `order_id`, `item` and `total` (quantity times price), **one row per order (an order for an item with no price stays, with `NA` as its total)**, sorted by `order_id`.'),
      expectedBehavior: 'One row per order with its total (NA when there is no price), sorted by order_id.',
      starterCode: 'priced_orders <- function(orders, prices) {\n  \n}\n',
      hints: ['Bring the price onto every order.', 'Orders without a price must not disappear.', 'Compute the new column after joining; return the three columns in order.'],
      checks: rCalls('priced_orders', WITH_PRICE, ['o, p', 'o[1:3, ], p', 'o, p[p$item != "nut", ]', 'data.frame(order_id = 9, item = "ghost", qty = 2, stringsAsFactors = FALSE), p', 'o[order(o$order_id, decreasing = TRUE), ], p'], 1, 'o <- data.frame(order_id = c(3, 1, 2, 4), item = c("bolt", "nut", "bolt", "cog"), qty = c(10, 4, 1, 7), stringsAsFactors = FALSE)\np <- data.frame(item = c("bolt", "nut"), price = c(2.5, 0.4), stringsAsFactors = FALSE)'),
      xpReward: 80, coinReward: 12,
    },
  ],
};
