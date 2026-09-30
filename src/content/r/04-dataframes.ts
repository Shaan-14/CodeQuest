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
    ],
  },
  objectives: [
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
  ],
};
