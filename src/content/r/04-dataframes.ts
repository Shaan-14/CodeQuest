import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { rOut } from './helpers';

const STAFF = 'name,dept,salary\nAna Lopez,Ops,48000\nBen Reed,Ops,55000\nCaz Dunn,Eng,72000\nDev Shah,Eng,51000\nEli Park,Ops,50000\nFay Wu,HR,45000\n';
const PRODUCTS = 'item,stock,reorder_level\nBolt,120,100\nNut,35,50\nGear,8,10\nCog,60,60\nAxle,0,5\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'r-04-dataframes', title: 'R: Data Frames', language: 'r', skillId: 'r.dataframes',
    blurb: 'Load a CSV into a data frame, look at it, pick columns and rows, and filter by conditions.', prerequisites: ['r-02-vectors'], xpReward: 65,
    reference: {
      title: 'Data frames',
      body: text(
        'A **data frame** is a table: each column is a vector of one type. Load one with `d <- read.csv("file.csv")`. Inspect with `nrow(d)`, `ncol(d)`, `names(d)`, `head(d)`, `str(d)`, `summary(d)`. Take a column with `d$salary` (a vector, so `mean(d$salary)` works).',
        'Pick rows with a logical condition: `d[d$dept == "Ops" & d$salary > 50000, ]` (rows before the comma, columns after; empty after the comma means all columns). Combine conditions with `&` (and) and `|` (or). `cat(x, sep = "\\n")` prints each element on its own line.',
      ),
      example: 'd <- read.csv("staff.csv")\nprint(nrow(d))\nops <- d[d$dept == "Ops", ]\ncat(ops$name, sep = "\\n")\ncat("Mean:", round(mean(d$salary), 2), "\\n")',
    },
    steps: [
      { kind: 'teach', title: 'Tables in R', body: text('Nearly all real data is tabular: rows are things (employees, orders, patients), columns are facts about them. R’s data frame is the tool built for it, and `read.csv` gets a file into one in a single line. Always **look** first: how many rows? what are the columns called? what type is each?') },
      {
        kind: 'demo', title: 'Look, then filter', language: 'r',
        body: text('`staff.csv` has a header row. Run it, then change the department or the salary.'),
        fixtures: { files: { 'staff.csv': STAFF } },
        code: 'd <- read.csv("staff.csv")\nprint(nrow(d))\nprint(names(d))\nprint(head(d, 3))\nrich <- d[d$salary > 50000, ]\nprint(rich$name)',
        notice: '`d[condition, ]` keeps whole rows where the condition is TRUE. `rich$name` then takes just the name column of those rows.',
      },
      { kind: 'challenge', challengeId: 'r-04-first-look' },
      { kind: 'challenge', challengeId: 'r-04-ops-well-paid' },
      { kind: 'challenge', challengeId: 'r-04-reorder' },
      { kind: 'challenge', challengeId: 'r-04-top-earner' },
      { kind: 'challenge', challengeId: 'r-04-payroll' },
    ],
  },
  objectives: [
    { id: 'r-obj-df-derived', title: 'Compute per row, then total', summary: 'Derive a value for every row with a rule and add the results up.' },
    { id: 'r-obj-df-extreme', title: 'The row with the largest value', summary: 'Find the row holding the maximum of a column and report fields of that row.' },
    { id: 'r-obj-df-filter', title: 'Filter rows of a data frame', summary: 'Keep the rows of a table that meet two conditions and print one column of them.' },
  ],
  challenges: [
    {
      id: 'r-04-first-look', title: 'First Look at the Staff File', mode: 'learning', language: 'r', skillIds: ['r.dataframes'], concepts: ['read.csv', 'nrow', 'mean'], difficulty: 2, context: 'business',
      prompt: text('`staff.csv` has the columns `name,dept,salary`. Print two lines exactly like this: `Rows: 6` (how many employees) and `Mean salary: 53500` (the mean salary **rounded to 2 decimals**, written by `cat` so a whole number has no trailing zeros).'),
      expectedBehavior: 'Two lines: the row count and the rounded mean salary.',
      guidedSteps: ['`d <- read.csv("staff.csv")`', '`cat("Rows:", nrow(d), "\\n")`', 'The mean of a column: `mean(d$salary)`; wrap in `round(..., 2)`.'],
      fixtures: { files: { 'staff.csv': STAFF } },
      starterCode: '# Summarise staff.csv\n',
      hints: ['Load the file into a data frame first.', 'One function counts rows; one averages a column.', 'cat() prints values separated by a space.'],
      checks: [rOut('The example file', 'Rows: 6\nMean salary: 53500'), rOut('Decimals in the result', 'Rows: 3\nMean salary: 40000.33', { 'staff.csv': 'name,dept,salary\nA,X,40000\nB,X,40000\nC,Y,40001\n' }, false), rOut('One employee', 'Rows: 1\nMean salary: 61000', { 'staff.csv': 'name,dept,salary\nA,X,61000\n' }, false)],
      xpReward: 40, coinReward: 6,
    },
    {
      id: 'r-04-ops-well-paid', objectiveId: 'r-obj-df-filter', title: 'Well-Paid Operators', mode: 'challenge', language: 'r', skillIds: ['r.dataframes', 'r.vectors'], concepts: ['filter rows', 'and'], difficulty: 3, context: 'business',
      prompt: text('From `staff.csv` (columns `name,dept,salary`) print the **names of the employees in the `Ops` department who earn more than 50000** (strictly more), **one name per line, in file order**. If nobody qualifies print nothing.'),
      expectedBehavior: 'The names of Ops employees earning more than 50000, one per line.',
      fixtures: { files: { 'staff.csv': STAFF } },
      starterCode: '# Ops employees earning more than 50000\n',
      hints: ['Two conditions must both hold.', 'Keep whole rows first, then take one column.', 'Exactly 50000 does not qualify.'],
      checks: [
        rOut('The example file', 'Ben Reed'),
        rOut('Several matches and quoted names', 'Ana, Jr\nZed', { 'staff.csv': 'name,dept,salary\n"Ana, Jr",Ops,50000.5\nBo,Eng,90000\nZed,Ops,70000\nMax,ops,80000\n' }, false),
        rOut('Nobody qualifies', '', { 'staff.csv': 'name,dept,salary\nA,Ops,50000\nB,HR,99999\n' }, false),
        rOut('Everybody in Ops qualifies', 'P\nQ\nR', { 'staff.csv': 'name,dept,salary\nP,Ops,51000\nQ,Ops,60000\nR,Ops,70000\n' }, false),
      ],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'r-04-reorder', objectiveId: 'r-obj-df-filter', title: 'What Needs Reordering?', mode: 'challenge', language: 'r', skillIds: ['r.dataframes', 'r.vectors'], concepts: ['filter rows', 'and'], difficulty: 3, context: 'retail',
      prompt: text('`products.csv` has the columns `item,stock,reorder_level`. Print the **items whose stock is below their own reorder level and that are not completely out of stock (stock above 0)**, **one per line, in file order**. If there are none print nothing.'),
      expectedBehavior: 'Items with 0 < stock < reorder_level, one per line.',
      fixtures: { files: { 'products.csv': PRODUCTS } },
      starterCode: '# Items to reorder\n',
      hints: ['Compare two columns of the same row.', 'Two conditions must hold at once.', 'Stock equal to the level is not below it.'],
      checks: [
        rOut('The example file', 'Nut\nGear'),
        rOut('Nothing to reorder', '', { 'products.csv': 'item,stock,reorder_level\nA,10,10\nB,0,5\nC,99,20\n' }, false),
        rOut('Names with spaces', 'Red pen\nBlue pen', { 'products.csv': 'item,stock,reorder_level\nRed pen,4,5\nStapler,40,10\nBlue pen,1,2\n' }, false),
        rOut('Just below', 'Z', { 'products.csv': 'item,stock,reorder_level\nZ,9,10\nY,10,10\n' }, false),
      ],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'r-04-top-earner', objectiveId: 'r-obj-df-extreme', title: 'The Top Earner', mode: 'challenge', language: 'r', skillIds: ['r.dataframes'], concepts: ['which.max', 'row lookup'], difficulty: 2, context: 'business',
      prompt: text('`staff.csv` has the columns `name,dept,salary`. Print one line like `Top: Caz Dunn (72000)`: the name of the **highest-paid employee** and their salary in brackets, using `cat()`. If two employees tie, use the one that comes **first in the file**.'),
      expectedBehavior: 'One line: Top: <name> (<salary>) for the highest salary, first in file order on ties.',
      fixtures: { files: { 'staff.csv': STAFF } },
      starterCode: '# Find the top earner\n',
      hints: ['You need the position of the largest value.', 'That position picks a whole row.', 'Build the line from two columns of that row.'],
      checks: [rOut('The example file', 'Top: Caz Dunn (72000)'), rOut('A tie', 'Top: First (90000)', { 'staff.csv': 'name,dept,salary\nFirst,A,90000\nSecond,B,90000\nThird,A,10\n' }, false), rOut('One employee', 'Top: Solo (1234.5)', { 'staff.csv': 'name,dept,salary\nSolo,A,1234.5\n' }, false)],
      xpReward: 60, coinReward: 9,
    },
    {
      id: 'r-04-longest-trip', objectiveId: 'r-obj-df-extreme', title: 'The Longest Trip', mode: 'challenge', language: 'r', skillIds: ['r.dataframes'], concepts: ['which.max', 'row lookup'], difficulty: 2, context: 'logistics',
      prompt: text('`trips.csv` has the columns `driver,route,km`. Print one line like `Longest: Dana (412 km)`: the driver of the **longest trip** and its distance, using `cat()`. On a tie use the trip that comes **first in the file**.'),
      expectedBehavior: 'One line: Longest: <driver> (<km> km) for the largest distance, first in file order on ties.',
      fixtures: { files: { 'trips.csv': 'driver,route,km\nAmir,North,120\nBo,East,88\nDana,West,412\nEve,North,95\n' } },
      starterCode: '# Find the longest trip\n',
      hints: ['Find where the largest distance is.', 'Use that position to read the driver.', 'Two columns of one row go into the line.'],
      checks: [rOut('The example file', 'Longest: Dana (412 km)'), rOut('A tie', 'Longest: Ann (50 km)', { 'trips.csv': 'driver,route,km\nAnn,R1,50\nBen,R2,50\nCy,R3,10\n' }, false), rOut('A decimal distance', 'Longest: Li (7.5 km)', { 'trips.csv': 'driver,route,km\nLi,R1,7.5\nMo,R2,7\n' }, false)],
      xpReward: 60, coinReward: 9,
    },
    {
      id: 'r-04-payroll', objectiveId: 'r-obj-df-derived', title: 'The Weekly Payroll', mode: 'challenge', language: 'r', skillIds: ['r.dataframes', 'r.vectors'], concepts: ['derived column', 'ifelse'], difficulty: 3, context: 'finance',
      prompt: text('`timesheet.csv` has the columns `name,hours,rate`. Hours up to 40 are paid at `rate`; **hours above 40 are paid at 1.5 times the rate**. Print one line like `Total payroll: 4520.5`: the total pay of **all** employees, rounded to 2 decimals, using `cat()` (a whole number prints without decimals).'),
      expectedBehavior: 'One line with the total pay including overtime at 1.5x.',
      fixtures: { files: { 'timesheet.csv': "name,hours,rate\nAna,38,20\nBen,45,18.5\nCaz,40,22\nDev,50,15\n" } },
      starterCode: '# Total payroll with overtime\n',
      hints: ['Work out each person’s pay first; the total is a sum of those.', 'Two rules apply to different hours: split them.', 'A vector decision (not a single if) handles every row at once.'],
      checks: [rOut("The example file", "Total payroll: 3343.75", { 'timesheet.csv': "name,hours,rate\nAna,38,20\nBen,45,18.5\nCaz,40,22\nDev,50,15\n" }, true), rOut("One worker", "Total payroll: 125", { "timesheet.csv": "name,hours,rate\nSolo,10,12.5\n" }, false), rOut("Boundary at 40 hours", "Total payroll: 3810", { "timesheet.csv": "name,hours,rate\nA,41,10\nB,39.5,10\nC,80,30\n" }, false), rOut("No hours and part hours", "Total payroll: 652", { "timesheet.csv": "name,hours,rate\nX,0,50\nY,40.5,16\n" }, false)],
      xpReward: 70, coinReward: 10,
    },
    {
      id: 'r-04-fuel-cost', objectiveId: 'r-obj-df-derived', title: 'The Fuel Bill', mode: 'challenge', language: 'r', skillIds: ['r.dataframes', 'r.vectors'], concepts: ['derived column', 'ifelse'], difficulty: 3, context: 'logistics',
      prompt: text('`deliveries.csv` has the columns `id,km,litres`. Fuel costs **1.8 per litre**, and every delivery **longer than 100 km** adds a **flat fee of 20**. Print one line like `Total fuel cost: 411.4`: the total cost of **all** deliveries, rounded to 2 decimals, using `cat()` (a whole number prints without decimals).'),
      expectedBehavior: 'One line with the total cost including the long-delivery fee.',
      fixtures: { files: { 'deliveries.csv': "id,km,litres\nd1,80,9\nd2,150,14\nd3,100,8\nd4,101,8\n" } },
      starterCode: '# Total fuel cost with long-delivery fees\n',
      hints: ['Cost per delivery first, then the total.', 'The fee only applies when a condition holds: one more term per row.', '“Longer than 100” excludes exactly 100.'],
      checks: [rOut("The example file", "Total fuel cost: 110.2", { "deliveries.csv": "id,km,litres\nd1,80,9\nd2,150,14\nd3,100,8\nd4,101,8\n" }, true), rOut("One long delivery", "Total fuel cost: 92", { "deliveries.csv": "id,km,litres\nx,300,40\n" }, false), rOut("Free fuel and a short one", "Total fuel cost: 29.9", { "deliveries.csv": "id,km,litres\np,50,0\nq,120,5.5\n" }, false), rOut("Just over 100 km", "Total fuel cost: 93.8", { "deliveries.csv": "id,km,litres\nm,100.5,20\nn,99.9,20\no,10,1\n" }, false)],
      xpReward: 70, coinReward: 10,
    },
  ],
};
