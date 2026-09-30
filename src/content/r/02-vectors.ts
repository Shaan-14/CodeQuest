import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { rOut } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'r-02-vectors', title: 'R: Vectors and Vectorised Thinking', language: 'r', skillId: 'r.vectors',
    blurb: 'Work on a whole column of numbers at once: arithmetic, comparisons, filtering, sorting and summaries.', prerequisites: ['r-01-console'], xpReward: 60,
    reference: {
      title: 'Vectors',
      body: text(
        'A **vector** is an ordered list of values of one type: `x <- c(4, 8, 6)`. Operations apply to every element at once: `x * 2`, `x > 5` (a logical vector). Select with `x[2]`, `x[2:3]`, or a logical filter: `x[x > 5]`. Useful: `length`, `sum`, `mean`, `max`, `min`, `sort(x, decreasing = TRUE)`, `head(x, 3)`, `which(x > 5)`.',
        'A logical vector counts as numbers: `sum(x > 5)` is how many elements exceed 5. **Never write a loop for what a vector operation can do** in one line.',
      ),
      example: 'x <- c(4, 8, 6, 5, 3, 50)\nprint(x[x > mean(x)])\nprint(sum(x > 5))\nprint(head(sort(x, decreasing = TRUE), 2))',
    },
    steps: [
      { kind: 'teach', title: 'Everything is a vector', body: text('R has no separate “single number” type: `5` is a vector of length one. That is why operations work on many values at once, and why you rarely need loops. `c(1, 2, 3) + 10` is `11 12 13`; `c(1, 2, 3) * c(2, 2, 2)` multiplies element by element.', 'Comparisons produce logical vectors, and a logical vector can be used as an index to keep only the `TRUE` positions. That single idea (**filter by a condition**) is the heart of data work in R.') },
      {
        kind: 'demo', title: 'Filter by a condition', language: 'r',
        body: text('Run it, then change the threshold.'),
        code: 'x <- c(4, 8, 6, 5, 3, 50)\nbig <- x > 5\nprint(big)\nprint(x[big])\nprint(sum(big))\nprint(mean(x))\nprint(median(x))',
        notice: '`big` is `FALSE TRUE TRUE FALSE FALSE TRUE`. Used inside `x[...]` it keeps only the TRUE positions, and `sum(big)` counts them.',
      },
      { kind: 'challenge', challengeId: 'r-02-above-mean' },
      { kind: 'challenge', challengeId: 'r-02-big-sales' },
      { kind: 'challenge', challengeId: 'r-02-best-below-limit' },
    ],
  },
  objectives: [
    { id: 'r-obj-filter-vec', title: 'Filter a vector by a condition', summary: 'Read a column of numbers, keep the values that meet a condition and summarise them.' },
  ],
  challenges: [
    {
      id: 'r-02-above-mean', title: 'Above the Average', mode: 'learning', language: 'r', skillIds: ['r.vectors'], concepts: ['comparison', 'sum of logicals', 'mean'], difficulty: 2, context: 'science',
      prompt: text('`readings.txt` holds one measurement per line. Print **how many readings are above the mean** of all readings, using `print()`.'),
      expectedBehavior: 'Prints a count, like `[1] 2`.',
      guidedSteps: ['Read with `as.numeric(readLines(...))`.', '`x > mean(x)` marks the readings above the mean.', '`sum()` of a logical vector counts the TRUEs.'],
      fixtures: { files: { 'readings.txt': '10\n20\n30\n40\n50\n' } },
      starterCode: '# Count the readings above the mean\n',
      hints: ['First work out the mean.', 'A comparison gives TRUE/FALSE for every element.', 'TRUE counts as 1 when you add.'],
      checks: [rOut('The example file', '[1] 2'), rOut('All equal', '[1] 0', { 'readings.txt': '5\n5\n5\n' }, false), rOut('One big value', '[1] 1', { 'readings.txt': '1\n2\n3\n4\n100\n' }, false), rOut('Negative values', '[1] 1', { 'readings.txt': '-3\n-1\n-2\n' }, false)],
      xpReward: 40, coinReward: 6,
    },
    {
      id: 'r-02-big-sales', objectiveId: 'r-obj-filter-vec', title: 'Big Sales Total', mode: 'challenge', language: 'r', skillIds: ['r.vectors'], concepts: ['logical index', 'summary'], difficulty: 2, context: 'retail',
      prompt: text('`sales.txt` holds one sale amount per line. Print the **total of the sales that are 100 or more**, using `print()`. If no sale qualifies the total is 0.'),
      expectedBehavior: 'Prints the sum of amounts that are at least 100.',
      fixtures: { files: { 'sales.txt': '50\n100\n150\n30\n' } },
      starterCode: '# Total of sales of 100 or more\n',
      hints: ['Select the elements that meet the condition, then add them.', 'The boundary belongs in the group.', 'sum() of an empty selection is 0.'],
      checks: [rOut('The example file', '[1] 250'), rOut('Nothing qualifies', '[1] 0', { 'sales.txt': '99.99\n5\n' }, false), rOut('Everything qualifies', '[1] 420', { 'sales.txt': '100\n120\n200\n' }, false), rOut('Decimals', '[1] 100', { 'sales.txt': '99.99\n100\n' }, false)],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'r-02-best-below-limit', objectiveId: 'r-obj-filter-vec', title: 'Closest to the Limit', mode: 'challenge', language: 'r', skillIds: ['r.vectors'], concepts: ['logical index', 'summary'], difficulty: 2, context: 'engineering',
      prompt: text('`loads.txt` holds one load measurement per line. The safe limit is **100** (a load of exactly 100 is over the limit). Print the **largest load that is still below the limit**, using `print()`. Every test file has at least one such load.'),
      expectedBehavior: 'Prints the largest value below 100.',
      fixtures: { files: { 'loads.txt': '45\n99\n100\n130\n60\n' } },
      starterCode: '# Largest load below 100\n',
      hints: ['Keep only what is under the limit, then find the biggest of those.', 'Exactly 100 is not under 100.', 'max() of the filtered values.'],
      checks: [rOut('The example file', '[1] 99'), rOut('Only one is safe', '[1] 7', { 'loads.txt': '250\n7\n100\n' }, false), rOut('Decimals', '[1] 99.9', { 'loads.txt': '99.9\n100.5\n12\n' }, false), rOut('Negative values', '[1] -2', { 'loads.txt': '-5\n-2\n300\n' }, false)],
      xpReward: 50, coinReward: 8,
    },
  ],
};
