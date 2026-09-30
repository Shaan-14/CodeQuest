import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { book, cells, grid, isFormula } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'xl-03-logic', title: 'Making the Sheet Decide', language: 'sheet', skillId: 'xl.logic',
    blurb: 'IF, nested IF, AND, OR and IFERROR: formulas that choose.', prerequisites: ['xl-02-functions'], xpReward: 55,
    reference: {
      title: 'Decisions in formulas',
      body: text('`=IF(test, value_if_true, value_if_false)` chooses. Tests use `=`, `<>`, `<`, `>`, `<=`, `>=`. Combine tests with `AND(...)` (all true) and `OR(...)` (any true). Nest IFs to have more than two outcomes.', '`=IFERROR(formula, fallback)` replaces an error (such as `#DIV/0!`) with a friendly value.'),
      example: '=IF(A2>=60,"Pass","Fail")\n=IF(B2<=1,5,IF(B2<=5,9,15))\n=IF(AND(A2>=18,OR(B2="member",C2="pass")),"Yes","No")\n=IFERROR(B2/C2,"n/a")',
    },
    steps: [
      {
        kind: 'teach', title: 'IF: a formula that chooses',
        body: text(
          '`=IF(A2>=60,"Pass","Fail")` asks a question about A2. If the answer is yes it shows the second value, otherwise the third. The test can compare numbers or text, and the results can be numbers, text or even other formulas.',
          'For more than two outcomes, put another IF in the “otherwise” slot: check the smallest case first, then the next, then everything else. **Boundaries matter**: “60 or more” is `>=60`, not `>60`. Whenever you write a rule, test the exact boundary values.',
        ),
      },
      {
        kind: 'teach', title: 'AND, OR and errors',
        body: text(
          '`AND(test1, test2)` is true only when all tests are. `OR(test1, test2)` is true when any is. They are used inside IF: `=IF(AND(B2>=18,C2="yes"),"Eligible","No")`.',
          'Some formulas fail for data reasons: dividing by an empty cell gives `#DIV/0!`. `=IFERROR(B2/C2,"n/a")` catches any error and shows the fallback instead. Use it on purpose for expected gaps in data; do not use it to hide real mistakes, because it will hide those too.',
        ),
      },
      {
        kind: 'demo', title: 'One rule, several answers', language: 'sheet',
        body: text('The shipping cost depends on the weight. Change a weight to exactly 1 and exactly 5 and watch which band it lands in. Press Calculate when you have looked.'),
        sheet: { sheets: { Sheet1: grid('A1', [['Parcel', 'Weight kg', 'Cost'], ['A', 0.5, '=IF(B2<=1,5,IF(B2<=5,9,15))'], ['B', 1, '=IF(B3<=1,5,IF(B3<=5,9,15))'], ['C', 5, '=IF(B4<=1,5,IF(B4<=5,9,15))'], ['D', 7, '=IF(B5<=1,5,IF(B5<=5,9,15))']]) } },
        code: '',
        notice: 'A parcel weighing exactly 1 kg pays 5, because the rule says “1 or less”. Order matters: the first test that is true wins.',
      },
      { kind: 'challenge', challengeId: 'xl-03-pass-fail' },
      { kind: 'challenge', challengeId: 'xl-03-shipping' },
      { kind: 'challenge', challengeId: 'xl-03-eligible' },
      { kind: 'challenge', challengeId: 'xl-03-rate' },
    ],
  },
  challenges: [
    {
      id: 'xl-03-pass-fail', title: 'Pass or Fail', mode: 'learning', language: 'sheet', skillIds: ['xl.logic'], concepts: ['IF'], difficulty: 1, context: 'education',
      prompt: text('Column A holds exam marks. In column B show “Pass” when the mark is 60 or more and “Fail” otherwise.'),
      expectedBehavior: 'B2:B5 show Pass for marks of 60 or more and Fail for the rest.',
      guidedSteps: ['In B2 type `=IF(A2>=60,"Pass","Fail")`.', 'Repeat for B3:B5 with the matching row.', 'Try a mark of exactly 60.'],
      starterCode: '',
      sheet: { start: book(grid('A1', [['Mark', 'Result'], [72], [59], [60], [35]])), editable: ['B2:B5'] },
      hints: ['The test asks whether the mark reaches a threshold.', '“60 or more” includes 60 itself.', 'Text results go in quotes.'],
      checks: [
        cells('Results', { B2: 'Pass', B3: 'Fail', B4: 'Pass', B5: 'Fail' }),
        cells('Boundaries and other marks', { B2: 'Pass', B3: 'Pass', B4: 'Fail', B5: 'Fail' }, { with: { A2: 60, A3: 61, A4: 59, A5: 0 }, visible: false }),
        isFormula('B2 is a formula', 'B2', 'IF'),
      ],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'xl-03-shipping', objectiveId: 'xl-obj-if-tiers', title: 'Shipping by Weight', mode: 'challenge', language: 'sheet', skillIds: ['xl.logic'], concepts: ['nested IF', 'boundaries'], difficulty: 2, context: 'logistics',
      prompt: text('A courier charges by parcel weight (column B, in kg): **5** for up to and including 1 kg, **9** for up to and including 5 kg, and **15** for anything heavier. Fill the cost in C2:C5.'),
      expectedBehavior: 'C2:C5 hold 5, 9 or 15 following the weight bands.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Parcel', 'Weight', 'Cost'], ['P1', 0.4], ['P2', 3.2], ['P3', 5], ['P4', 12]])), editable: ['C2:C5'] },
      hints: ['There are three outcomes, so one IF is not enough.', 'Test the smallest band first; each later test only runs if the earlier ones failed.', 'Exactly 1 and exactly 5 belong to the cheaper band.'],
      checks: [
        cells('Costs', { C2: 5, C3: 9, C4: 9, C5: 15 }),
        cells('Band boundaries', { C2: 5, C3: 9, C4: 15, C5: 9 }, { with: { B2: 1, B3: 1.01, B4: 5.01, B5: 5 }, visible: false }),
        isFormula('C2 is a formula', 'C2', 'IF'),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'xl-03-shipping-b', objectiveId: 'xl-obj-if-tiers', title: 'Volume Discount', mode: 'challenge', language: 'sheet', skillIds: ['xl.logic'], concepts: ['nested IF', 'boundaries'], difficulty: 2, context: 'retail',
      prompt: text('A shop gives a discount rate by order total (column B): **0** for totals under 100, **0.05** for 100 up to (but not including) 500, and **0.1** for 500 or more. Fill the discount rate in C2:C5.'),
      expectedBehavior: 'C2:C5 hold 0, 0.05 or 0.1 following the order-total bands.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Order', 'Total', 'Discount'], ['O1', 40], ['O2', 100], ['O3', 499.99], ['O4', 800]])), editable: ['C2:C5'] },
      hints: ['Three outcomes need a nested decision.', 'Start from the top band or the bottom band, but keep the order consistent.', 'Exactly 100 gets the discount; exactly 500 gets the larger one.'],
      checks: [
        cells('Discounts', { C2: 0, C3: 0.05, C4: 0.05, C5: 0.1 }, { approx: 1e-9 }),
        cells('Band boundaries', { C2: 0.05, C3: 0.1, C4: 0, C5: 0.1 }, { with: { B2: 100, B3: 500, B4: 99.99, B5: 1000 }, approx: 1e-9, visible: false }),
        isFormula('C2 is a formula', 'C2', 'IF'),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'xl-03-eligible', objectiveId: 'xl-obj-and-or', title: 'Who Can Borrow?', mode: 'challenge', language: 'sheet', skillIds: ['xl.logic'], concepts: ['AND', 'OR'], difficulty: 3, context: 'education',
      prompt: text('A library lets someone borrow when they are **18 or older** and they either have a membership (column C says “yes”) or a day pass (column D says “yes”). Show “Yes” or “No” for each person in E2:E5.'),
      expectedBehavior: 'E2:E5 show Yes only for adults with a membership or a day pass.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Name', 'Age', 'Member', 'Day pass', 'Can borrow'], ['Ana', 25, 'yes', 'no'], ['Ben', 17, 'yes', 'no'], ['Caz', 40, 'no', 'yes'], ['Dev', 30, 'no', 'no']])), editable: ['E2:E5'] },
      hints: ['Two conditions must both hold; one of them is itself an “either/or”.', 'There is a function for “all true” and one for “any true”.', 'Place them inside the decision.'],
      checks: [
        cells('Results', { E2: 'Yes', E3: 'No', E4: 'Yes', E5: 'No' }),
        cells('Edge cases', { E2: 'Yes', E3: 'No', E4: 'No', E5: 'Yes' }, { with: { B2: 18, C2: 'no', D2: 'yes', B3: 18, C3: 'no', D3: 'no', B4: 17, C4: 'yes', D4: 'yes', B5: 90, C5: 'yes', D5: 'yes' }, visible: false }),
        isFormula('E2 is a formula', 'E2', 'IF'),
      ],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'xl-03-rate', objectiveId: 'xl-obj-safe-ratio', title: 'Conversion Rate Without Errors', mode: 'challenge', language: 'sheet', skillIds: ['xl.logic'], concepts: ['IFERROR', 'division'], difficulty: 3, context: 'business',
      prompt: text('Each row lists website visits (B) and signups (C). Show the signup rate (signups divided by visits) in D2:D5. Some days had no visits, so those rows must show the text “n/a” instead of an error.'),
      expectedBehavior: 'D2:D5 show signups ÷ visits, or n/a where there were no visits.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Day', 'Visits', 'Signups', 'Rate'], ['Mon', 200, 10], ['Tue', 0, 0], ['Wed', 50, 5], ['Thu', 0, 3]])), editable: ['D2:D5'] },
      hints: ['Dividing by an empty or zero cell gives an error.', 'There is a function that shows a fallback when a formula errors.', 'Put the division inside it.'],
      checks: [
        cells('Rates', { D2: 0.05, D3: 'n/a', D4: 0.1, D5: 'n/a' }, { approx: 1e-9 }),
        cells('Other numbers', { D2: 'n/a', D3: 0.5, D4: 1, D5: 0 }, { with: { B2: 0, C2: 4, B3: 8, C3: 4, B4: 2, C4: 2, B5: 9, C5: 0 }, approx: 1e-9, visible: false }),
        isFormula('D2 is a formula', 'D2', 'IFERROR|IF'),
      ],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'xl-03-rate-b', objectiveId: 'xl-obj-safe-ratio', title: 'Defect Rate Without Errors', mode: 'challenge', language: 'sheet', skillIds: ['xl.logic'], concepts: ['IFERROR', 'division'], difficulty: 3, context: 'manufacturing',
      prompt: text('Each row lists units made (B) and units rejected (C). Show the reject rate (rejected divided by made) in D2:D5. Shifts that made nothing must show the text “no output” instead of an error.'),
      expectedBehavior: 'D2:D5 show rejected ÷ made, or no output where nothing was made.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Shift', 'Made', 'Rejected', 'Reject rate'], ['Early', 400, 8], ['Late', 0, 0], ['Night', 250, 5], ['Extra', 0, 2]])), editable: ['D2:D5'] },
      hints: ['When nothing was made the division fails.', 'One function swaps any error for a value you choose.', 'Wrap the division, and give the fallback text in quotes.'],
      checks: [
        cells('Reject rates', { D2: 0.02, D3: 'no output', D4: 0.02, D5: 'no output' }, { approx: 1e-9 }),
        cells('Other numbers', { D2: 'no output', D3: 0.25, D4: 1, D5: 0 }, { with: { B2: 0, C2: 4, B3: 8, C3: 2, B4: 2, C4: 2, B5: 9, C5: 0 }, approx: 1e-9, visible: false }),
        isFormula('D2 is a formula', 'D2', 'IFERROR|IF'),
      ],
      xpReward: 65, coinReward: 10,
    },
  ],
  objectives: [
    { id: 'xl-obj-if-tiers', title: 'Tiered rules with nested IF', summary: 'Choose between several outcomes, with the right boundaries.' },
    { id: 'xl-obj-safe-ratio', title: 'Ratios that survive empty data', summary: 'Divide safely and show a meaningful fallback where the data is missing.' },
  ],
};
