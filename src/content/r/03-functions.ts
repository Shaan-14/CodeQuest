import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { rCalls } from './helpers';

const LETTER = '.cq_ref <- function(score) if (score >= 90) "A" else if (score >= 80) "B" else if (score >= 70) "C" else "F"';
const RISK = '.cq_ref <- function(score) ifelse(score >= 70, "high", ifelse(score >= 40, "medium", "low"))';
const STOCK = '.cq_ref <- function(units) ifelse(units >= 10, "ok", ifelse(units >= 1, "low", "out"))';
const STREAK = '.cq_ref <- function(x) if (length(x) == 0) 0 else max(rle(x)$lengths)';
const DRY = '.cq_ref <- function(rain) { best <- 0; run <- 0; for (r in rain) { if (r == 0) { run <- run + 1; if (run > best) best <- run } else run <- 0 }; best }';

export const bundle: LessonBundle = {
  lesson: {
    id: 'r-03-functions', title: 'R: Functions and Control Flow', language: 'r', skillId: 'r.functions',
    blurb: 'Write your own functions, make decisions with if/else and ifelse, loop when you must, and see why vectors need vectorised decisions.', prerequisites: ['r-02-vectors'], xpReward: 70,
    reference: {
      title: 'Functions and control flow',
      body: text(
        'A function: `f <- function(x, y = 2) { x + y }`; the last value is returned (or use `return(value)`). Decide with `if (cond) a else b`, which needs a **single** TRUE/FALSE. For a whole vector use **`ifelse(cond, yes, no)`**, which decides element by element; nest it for more than two outcomes.',
        'Loops: `for (v in x) { ... }`, `while (cond) { ... }`. `rle(x)` (run-length encoding) gives the lengths of runs of equal values. Test your functions with both a single value and a vector, and with the boundaries.',
      ),
      example: 'band <- function(score) ifelse(score >= 50, "pass", "fail")\nprint(band(c(35, 50, 80)))\nmax_run <- function(x) max(rle(x)$lengths)\nprint(max_run(c(1, 1, 2, 2, 2, 1)))',
    },
    steps: [
      { kind: 'teach', title: 'Your own functions', body: text('A function packages a calculation under a name so you can reuse it on any input. Arguments go in the parentheses; the value of the last expression is the result. Keep functions small and test them with values you can check by hand, including the edges.') },
      { kind: 'teach', title: 'if versus ifelse', body: text('`if (score >= 90) "A" else "B"` works on **one** score. Give it a vector and R stops with an error (a condition of length greater than one). When your function may receive a whole column, use `ifelse`, which returns a vector of the same length. This is the most common R surprise for programmers coming from other languages.') },
      {
        kind: 'demo', title: 'One value versus many', language: 'r',
        body: text('Run the program and read the error message carefully, then use the vector version.'),
        code: 'one <- function(s) if (s >= 50) "pass" else "fail"\nmany <- function(s) ifelse(s >= 50, "pass", "fail")\nprint(one(70))\nprint(many(c(30, 50, 80)))\nres <- tryCatch(one(c(30, 80)), error = function(e) conditionMessage(e))\nprint(res)',
        notice: '`one` refuses a vector: its condition must be a single TRUE or FALSE. `many` answers each element. The error is a useful clue, not a failure of yours.',
      },
      { kind: 'challenge', challengeId: 'r-03-letter' },
      { kind: 'challenge', challengeId: 'r-03-risk-class' },
      { kind: 'challenge', challengeId: 'r-03-longest-run' },
    ],
  },
  objectives: [
    { id: 'r-obj-vectorised-decision', title: 'A decision that works on a whole vector', summary: 'Write a function that classifies every element of a vector, with correct boundaries.' },
    { id: 'r-obj-run-length', title: 'Loops over sequences', summary: 'Find the longest run in a sequence using a loop or run-length encoding.' },
  ],
  challenges: [
    {
      id: 'r-03-letter', title: 'Letter Grades', mode: 'learning', language: 'r', skillIds: ['r.functions'], concepts: ['function', 'if/else'], difficulty: 2, context: 'education',
      prompt: text('Write a function `letter_grade(score)` for **one** score: `"A"` for 90 or more, `"B"` for 80 or more, `"C"` for 70 or more, otherwise `"F"`.'),
      expectedBehavior: 'Returns A, B, C or F for a single score, with the boundaries included in the higher grade.',
      guidedSteps: ['`letter_grade <- function(score) { ... }`', 'Check the highest grade first: `if (score >= 90) "A" else if ...`', 'The last `else` catches everything below 70.'],
      starterCode: 'letter_grade <- function(score) {\n  \n}\n',
      hints: ['Order the tests from the highest threshold down.', '“90 or more” includes 90.', 'The last branch needs no test.'],
      checks: rCalls('letter_grade', LETTER, ['95', '90', '89.9', '80', '79', '70', '69.99', '0', '100', '-5'], 3),
      xpReward: 40, coinReward: 6,
    },
    {
      id: 'r-03-risk-class', objectiveId: 'r-obj-vectorised-decision', title: 'Risk Bands', mode: 'challenge', language: 'r', skillIds: ['r.functions', 'r.vectors'], concepts: ['ifelse', 'vectorised'], difficulty: 3, context: 'healthcare',
      prompt: text('A clinic scores patients from 0 to 100. Write `risk_class(score)` that accepts a **single score or a whole vector of scores** and returns a character vector of the same length: `"high"` for **70 or more**, `"medium"` for **40 or more** (but under 70) and `"low"` otherwise.'),
      expectedBehavior: 'One of low/medium/high for every score, for a single value or a vector.',
      starterCode: 'risk_class <- function(score) {\n  \n}\n',
      hints: ['Test it with a vector before you trust it.', 'A plain if/else only looks at one value.', 'Nest the vector-friendly decision, highest band first.'],
      checks: rCalls('risk_class', RISK, ['c(10, 40, 69, 70, 100)', '55', 'c(0, 39.9)', 'c(99, 1)', 'c(70, 70)', 'c(95, 5, 45)', '40', 'c(69.99, 70.01)'], 2),
      xpReward: 75, coinReward: 11,
    },
    {
      id: 'r-03-stock-status', objectiveId: 'r-obj-vectorised-decision', title: 'Stock Levels', mode: 'challenge', language: 'r', skillIds: ['r.functions', 'r.vectors'], concepts: ['ifelse', 'vectorised'], difficulty: 3, context: 'retail',
      prompt: text('A shop tracks units in stock. Write `stock_status(units)` that accepts a **single number or a whole vector** and returns a character vector of the same length: `"ok"` for **10 or more** units, `"low"` for **1 to 9** units and `"out"` for **0**.'),
      expectedBehavior: 'One of ok/low/out for every stock figure, for a single value or a vector.',
      starterCode: 'stock_status <- function(units) {\n  \n}\n',
      hints: ['It must work on a whole column at once.', 'Which band has the highest threshold? Start there.', 'Exactly 10 and exactly 1 belong to the higher band.'],
      checks: rCalls('stock_status', STOCK, ['c(0, 1, 9, 10, 250)', '3', 'c(10, 10)', 'c(5, 50, 0)', '0', 'c(9, 10, 11)', 'c(1, 0)', '1'], 2),
      xpReward: 75, coinReward: 11,
    },
    {
      id: 'r-03-longest-run', objectiveId: 'r-obj-run-length', title: 'Longest Streak', mode: 'challenge', language: 'r', skillIds: ['r.functions'], concepts: ['loop', 'sequences'], difficulty: 3, context: 'games',
      prompt: text('A game stores results as a vector such as `c("W", "W", "L", "W", "W", "W")`. Write `longest_streak(results)` returning the **length of the longest run of identical consecutive values** (any values, not just W and L). An empty vector gives `0`.'),
      expectedBehavior: 'The length of the longest run of equal consecutive elements; 0 for empty input.',
      starterCode: 'longest_streak <- function(results) {\n  \n}\n',
      hints: ['You are looking for the longest stretch where nothing changes.', 'You can keep a running count and a best-so-far, or use a function that already summarises runs.', 'An empty vector needs a special answer.'],
      checks: rCalls('longest_streak', STREAK, ['c("W", "W", "L", "W", "W", "W")', 'c(1, 2, 3)', 'character(0)', 'c("x")', 'c(5, 5, 5, 5)', 'c("a", "b", "b", "a", "a", "a", "b")', 'c(TRUE, TRUE, FALSE, FALSE, FALSE)'], 2),
      xpReward: 75, coinReward: 11,
    },
    {
      id: 'r-03-dry-spell', objectiveId: 'r-obj-run-length', title: 'The Dry Spell', mode: 'challenge', language: 'r', skillIds: ['r.functions'], concepts: ['loop', 'sequences'], difficulty: 3, context: 'agriculture',
      prompt: text('A farm records daily rainfall in millimetres. Write `longest_dry_spell(rain)` returning the **largest number of consecutive days with exactly 0 mm** of rain. No dry days (or no data) gives `0`.'),
      expectedBehavior: 'The longest stretch of consecutive zero values.',
      starterCode: 'longest_dry_spell <- function(rain) {\n  \n}\n',
      hints: ['A running count that resets when something else happens.', 'Keep the best count so far separately.', 'Days with rain end a spell but do not count as one.'],
      checks: rCalls('longest_dry_spell', DRY, ['c(0, 0, 3, 0, 0, 0, 1)', 'c(2, 5)', 'numeric(0)', 'c(0)', 'c(0, 0, 0)', 'c(1, 0, 0, 2, 0)', 'c(0.5, 0, 0, 0, 0.2, 0, 0)'], 2),
      xpReward: 75, coinReward: 11,
    },
  ],
};
