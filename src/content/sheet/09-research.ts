import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { book, cell, cells, grid, isFormula } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'xl-09-research', title: 'Functions Nobody Taught You', language: 'sheet', skillId: 'xl.functions',
    blurb: 'Rank, weighted averages and joining text need functions you have not met. Find them in the Field Manual, test them on a tiny case, then trust them on the real one.', prerequisites: ['xl-05-conditional'], xpReward: 75,
    reference: {
      title: 'Finding the function you need',
      body: text('Nobody knows every function. Describe what you need in plain words (“position of a value in a list”, “multiply pairs and add them up”, “glue the non-empty cells together”), search the Field Manual for those words, read the signature and the note about ties, blanks and order, and try it on three cells whose answer you know.', 'Then test the awkward cases before you rely on it: ties, empty cells, a list that is not sorted, weights that do not add up to 100.'),
      example: '=RANK(B2,$B$2:$B$7,0)\n=SUMPRODUCT(B2:B5,C2:C5)/SUM(C2:C5)\n=TEXTJOIN(", ",TRUE,A2:A8)',
    },
    steps: [
      { kind: 'teach', title: 'Search, read, test', body: text('The skill here is not memorising `RANK` or `TEXTJOIN`. It is turning a need into a search, reading an entry fast, and checking the result on a case you can do by hand. Open the Field Manual (spreadsheet entries) whenever you like: looking things up is part of the job and never lowers your reward.') },
      { kind: 'challenge', challengeId: 'xl-09-rank-board' },
      { kind: 'challenge', challengeId: 'xl-09-weighted' },
      { kind: 'challenge', challengeId: 'xl-09-joined' },
    ],
  },
  objectives: [
    { id: 'xl-obj-rank', title: 'Rank values, ties included', summary: 'Give each item its position in a list, with tied items sharing a position.' },
    { id: 'xl-obj-weighted', title: 'Weighted averages', summary: 'Average values by importance, whatever the weights add up to.' },
    { id: 'xl-obj-join', title: 'Join text from many cells', summary: 'Combine the non-empty cells of a list into one piece of text.' },
  ],
  challenges: [
    {
      id: 'xl-09-rank-board', objectiveId: 'xl-obj-rank', title: 'The Leaderboard', mode: 'challenge', language: 'sheet', skillIds: ['xl.functions', 'ps.research'], concepts: ['rank', 'ties'], difficulty: 3, context: 'sports',
      prompt: text('Column B holds the scores of six athletes. In C2:C7 show each athlete’s **position**: 1 for the highest score, 2 for the next and so on. Athletes with the **same score share the same position** (and the next position is skipped, as in a real league table). Look in the Field Manual if you do not know how.'),
      expectedBehavior: 'C2:C7 show 1 for the highest score; equal scores share a position.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Athlete', 'Score', 'Position'], ['Ana', 72], ['Ben', 88], ['Caz', 65], ['Dev', 88], ['Eli', 91], ['Fay', 54]])), editable: ['C2:C7'] },
      hints: ['Describe what you need in words and search the manual for it.', 'The function needs the value, the whole list and a choice of direction.', 'Lock the list so it does not slide down the rows.'],
      checks: [
        cells('Positions', { C2: 4, C3: 2, C4: 5, C5: 2, C6: 1, C7: 6 }),
        cells('Ties everywhere', { C2: 3, C3: 3, C4: 3, C5: 6, C6: 1, C7: 1 }, { with: { B2: 10, B3: 10, B4: 10, B5: 5, B6: 20, B7: 20 }, visible: false }),
        isFormula('C2 is a formula', 'C2', 'RANK|COUNTIF'),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-09-rank-lap', objectiveId: 'xl-obj-rank', title: 'Fastest Laps', mode: 'challenge', language: 'sheet', skillIds: ['xl.functions', 'ps.research'], concepts: ['rank', 'ties'], difficulty: 3, context: 'racing',
      prompt: text('Column B holds lap times in seconds, where **lower is better**. In C2:C7 show each lap’s position: 1 for the fastest lap. Equal times share a position and the next position is skipped. Look in the Field Manual if you do not know how.'),
      expectedBehavior: 'C2:C7 show 1 for the lowest time; equal times share a position.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Lap', 'Seconds', 'Position'], ['L1', 61.2], ['L2', 59.8], ['L3', 60.5], ['L4', 59.8], ['L5', 62], ['L6', 61.2]])), editable: ['C2:C7'] },
      hints: ['Direction matters: which way is “best” here?', 'The function has a setting for ascending or descending order.', 'Equal values are a tie.'],
      checks: [
        cells('Positions', { C2: 4, C3: 1, C4: 3, C5: 1, C6: 6, C7: 4 }),
        cells('Other laps', { C2: 3, C3: 4, C4: 4, C5: 6, C6: 1, C7: 1 }, { with: { B2: 5, B3: 7, B4: 7, B5: 9, B6: 1, B7: 1 }, visible: false }),
        isFormula('C2 is a formula', 'C2', 'RANK|COUNTIF'),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-09-weighted', objectiveId: 'xl-obj-weighted', title: 'The Course Mark', mode: 'challenge', language: 'sheet', skillIds: ['xl.functions', 'ps.research'], concepts: ['weighted average'], difficulty: 3, context: 'education',
      prompt: text('A course has four assessments. Column B holds the marks and column C how much each one counts (the weights; they may not add up to 100). Show the **weighted average mark** in E1: each mark counted in proportion to its weight. Look in the Field Manual for a way to multiply pairs and add them up.'),
      expectedBehavior: 'E1 is the sum of mark × weight divided by the sum of the weights.',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['Assessment', 'Mark', 'Weight'], ['Essay', 80, 20], ['Test', 70, 30], ['Project', 90, 25], ['Exam', 60, 25]]), D1: 'Weighted mark' }), editable: ['E1'] },
      hints: ['A plain average treats every mark the same. What should change?', 'One function multiplies matching cells and adds the products.', 'Divide by the total weight, not by 100.'],
      checks: [
        cell('Weighted mark', 'E1', 74.5, { approx: 1e-9 }),
        cell('Other marks and weights', 'E1', 56.25, { with: { B2: 50, B3: 100, B4: 0, B5: 75, C2: 1, C3: 1, C4: 2, C5: 4 }, approx: 1e-9, visible: false }),
        isFormula('E1 is a formula', 'E1', 'SUMPRODUCT|SUM|\\*'),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-09-supplier', objectiveId: 'xl-obj-weighted', title: 'Choosing a Supplier', mode: 'challenge', language: 'sheet', skillIds: ['xl.functions', 'ps.research'], concepts: ['weighted average'], difficulty: 3, context: 'procurement',
      prompt: text('A supplier is rated on four criteria. Column B holds the scores (1 to 5) and column C the importance of each criterion (any positive numbers). Show the **overall rating**, each score counted in proportion to its importance, in E1.'),
      expectedBehavior: 'E1 is the sum of score × importance divided by the sum of the importance values.',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['Criterion', 'Score', 'Importance'], ['Price', 4.5, 3], ['Quality', 3.5, 2], ['Delivery', 5, 1], ['Support', 2, 4]]), D1: 'Overall rating' }), editable: ['E1'] },
      hints: ['Important criteria should pull the result harder.', 'Multiply each score by its importance first.', 'Divide by the total importance.'],
      checks: [
        cell('Overall rating', 'E1', 3.35, { approx: 1e-9 }),
        cell('Other scores and importance', 'E1', 20, { with: { B2: 10, B3: 20, B4: 30, B5: 40, C2: 40, C3: 30, C4: 20, C5: 10 }, approx: 1e-9, visible: false }),
        isFormula('E1 is a formula', 'E1', 'SUMPRODUCT|SUM|\\*'),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-09-joined', objectiveId: 'xl-obj-join', title: 'The Invitation List', mode: 'challenge', language: 'sheet', skillIds: ['xl.functions', 'ps.research'], concepts: ['join text', 'blanks'], difficulty: 3, context: 'events',
      prompt: text('Column A lists guests, with some cells left empty. In C1 show all the guests in **one line of text**, in list order, separated by a comma and a space, **skipping the empty cells** (for example `Ana, Ben, Caz`). When guests are added or removed the line must follow.'),
      expectedBehavior: 'C1 shows the non-empty names joined with ", ".',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['Guest'], ['Ana'], [null], ['Ben'], ['Caz'], [null], ['Dev'], ['Eli']]), B1: 'Invitation line' }), editable: ['C1'] },
      hints: ['Joining with & would need every cell by hand.', 'There is a function that joins a whole range with a separator.', 'One of its settings controls what happens to empty cells.'],
      checks: [
        cell('The invitation line', 'C1', 'Ana, Ben, Caz, Dev, Eli'),
        cell('Other guests', 'C1', 'Zoe, Yan', { with: { A2: 'Zoe', A3: 'Yan', A4: '', A5: '', A6: '', A7: '', A8: '' }, visible: false }),
        isFormula('C1 is a formula', 'C1', 'TEXTJOIN|&'),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-09-joined-b', objectiveId: 'xl-obj-join', title: 'Ticket Tags', mode: 'challenge', language: 'sheet', skillIds: ['xl.functions', 'ps.research'], concepts: ['join text', 'blanks'], difficulty: 3, context: 'software',
      prompt: text('Column A lists the tags of a support ticket, with some cells empty. In C1 show all the tags in **one line of text**, in list order, separated by a space, a vertical bar and a space (` | `), **skipping empty cells** (for example `login | urgent`).'),
      expectedBehavior: 'C1 shows the non-empty tags joined with " | ".',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['Tag'], [null], ['login'], ['urgent'], [null], ['mobile'], [null], [null]]), B1: 'Tag line' }), editable: ['C1'] },
      hints: ['One function joins a range with a separator.', 'The separator is text, so it goes in quotes.', 'Decide what should happen to empty cells.'],
      checks: [
        cell('The tag line', 'C1', 'login | urgent | mobile'),
        cell('Other tags', 'C1', 'billing', { with: { A2: 'billing', A3: '', A4: '', A5: '', A6: '', A7: '', A8: '' }, visible: false }),
        cell('A new tag at the end', 'C1', 'login | urgent | mobile | vip', { with: { A8: 'vip' }, visible: false }),
        isFormula('C1 is a formula', 'C1', 'TEXTJOIN|&'),
      ],
      xpReward: 70, coinReward: 12,
    },
  ],
};
