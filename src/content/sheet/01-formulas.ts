import { text } from '../helpers';
import type { Constraint, LessonBundle } from '../schema';
import { book, cells, grid, isFormula } from './helpers';

const anchor: Constraint = { type: 'requires', node: 'sheet:\\$[A-Z]+\\$\\d+', message: 'Anchor the rate cell with dollar signs (like $F$1) so the formula still works when it is copied down.' };

export const bundle: LessonBundle = {
  lesson: {
    id: 'xl-01-formulas', title: 'Cells That Calculate', language: 'sheet', skillId: 'xl.formulas',
    blurb: 'Formulas, cell references, order of operations and why $ matters.', prerequisites: [], xpReward: 45,
    reference: {
      title: 'Formulas and references',
      body: text('A formula starts with `=`. It can use numbers, operators (`+ - * / ^`), and **cell references** such as `B2`. When a referenced cell changes, the formula recalculates on its own.', '`$` freezes part of a reference: `$F$1` always means cell F1, even if the formula is copied to another cell. Use it for constants such as a tax rate. Multiplication and division happen before addition and subtraction; brackets change the order.'),
      example: '=B2*C2\n=B2*(1+$F$1)\n=(A1+A2)/2',
    },
    steps: [
      {
        kind: 'teach', title: 'A cell can hold a formula, not just a number',
        body: text(
          'A spreadsheet is a grid of cells. Type `12` into a cell and it holds the number 12. Type `=3*4` and it holds a **formula**: the cell shows the result, 12, but remembers the calculation. The real power is **references**: `=B2*C2` does not mean “12”; it means “whatever is in B2 times whatever is in C2”. Change B2 and the answer updates.',
          'That is why spreadsheets are used to build models: you write the rule once, then change the inputs and watch everything recalculate. A formula that contains a typed-in copy of a number (`=10*2.5` instead of `=B2*C2`) works today and breaks silently tomorrow.',
        ),
      },
      {
        kind: 'teach', title: 'Order of operations and fixed references',
        body: text(
          'Formulas follow the usual order: `^` first, then `*` and `/`, then `+` and `-`. Use brackets to be explicit: `=B2*(1+C1)` adds tax *before* multiplying. A percentage such as `20%` is the number 0.2.',
          'When you copy a formula down a column, references shift with it: `=B2*C1` copied one row down becomes `=B3*C2`. That is usually what you want. For a value that must stay put (a tax rate in one cell) write `$C$1`: the dollar signs freeze the column and the row.',
        ),
      },
      {
        kind: 'demo', title: 'Change an input, watch the result move', language: 'sheet',
        body: text('The workbook prices three items with a tax rate in F1. Click the tax rate, change it (for example to 0.1), and watch every total change. Press Calculate when you have looked.'),
        sheet: { sheets: { Sheet1: grid('A1', [['Item', 'Price', 'With tax', null, null, 0.2], ['Bolt', 2.5, '=B2*(1+$F$1)'], ['Nut', 0.4, '=B3*(1+$F$1)'], ['Gear', 12, '=B4*(1+$F$1)']]) } },
        code: '',
        notice: 'Every total uses `$F$1`, the one place the tax rate lives. Changing F1 changed all three results: that is what a model is.',
      },
      { kind: 'challenge', challengeId: 'xl-01-line-total' },
      { kind: 'challenge', challengeId: 'xl-01-sales-tax' },
      { kind: 'challenge', challengeId: 'xl-01-budget' },
      { kind: 'challenge', challengeId: 'xl-01-margin' },
    ],
  },
  challenges: [
    {
      id: 'xl-01-line-total', title: 'Line Totals', mode: 'learning', language: 'sheet', skillIds: ['xl.formulas'], concepts: ['formula', 'reference'], difficulty: 1, context: 'retail',
      prompt: text('A parts order lists a quantity (column B) and a unit price (column C) for each item. Fill column D with the total cost of each line: quantity times price.'),
      expectedBehavior: 'D2, D3 and D4 each show quantity × price, calculated by a formula.',
      guidedSteps: ['Click D2 and type `=B2*C2`, then press Enter.', 'Do the same for D3 (`=B3*C3`) and D4.', 'Change a quantity and watch the total change.'],
      starterCode: '',
      sheet: { start: book(grid('A1', [['Item', 'Qty', 'Price', 'Total'], ['Bolt', 4, 2.5], ['Nut', 10, 0.4], ['Gear', 2, 12]])), editable: ['D2:D4'] },
      hints: ['A formula starts with an equals sign.', 'Reference the cells rather than typing the numbers.', 'Row 2 multiplies B2 by C2.'],
      checks: [
        cells('Line totals are right', { D2: 10, D3: 4, D4: 24 }),
        cells('Still right with different numbers', { D2: 3, D3: 10, D4: 3 }, { with: { B2: 1, C2: 3, B3: 5, C3: 2, B4: 3, C4: 1 }, visible: false }),
        isFormula('D2 is a formula, not a typed number', 'D2'),
      ],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'xl-01-sales-tax', objectiveId: 'xl-obj-rate-cell', title: 'Prices With Tax', mode: 'challenge', language: 'sheet', skillIds: ['xl.formulas'], concepts: ['absolute reference', 'percentage'], difficulty: 2, context: 'retail',
      prompt: text('Column B lists shop prices. The tax rate is stored once, in cell F1. Fill column C with each price including tax.', 'The tax rate may change next year, so the formulas must read it from F1 (not contain 0.2) and must still work when copied down.'),
      expectedBehavior: 'C2:C4 show price × (1 + rate), using the rate in F1.',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['Item', 'Price', 'With tax']]), ...grid('A2', [['Notebook', 12], ['Pen', 3], ['Bag', 40]]), E1: 'Tax rate', F1: 0.2 }), editable: ['C2:C4'] },
      hints: ['Adding 20% to a price means multiplying it by a factor slightly bigger than one.', 'The rate lives in one cell: refer to that cell.', 'A value that must not move when copied needs dollar signs.'],
      constraints: [anchor],
      checks: [
        cells('Prices with 20% tax', { C2: 14.4, C3: 3.6, C4: 48 }, { approx: 1e-9 }),
        cells('Changing the rate changes the prices', { C2: 13.2, C3: 3.3, C4: 44 }, { with: { F1: 0.1 }, approx: 1e-9, visible: false }),
        isFormula('The prices are calculated, not typed', 'C2', 'F\\$?1'),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'xl-01-sales-tax-b', objectiveId: 'xl-obj-rate-cell', title: 'Fuel Surcharge', mode: 'challenge', language: 'sheet', skillIds: ['xl.formulas'], concepts: ['absolute reference', 'percentage'], difficulty: 2, context: 'logistics',
      prompt: text('A courier lists delivery costs in column B. The fuel surcharge percentage is stored once, in cell E1. Fill column C with each cost including the surcharge.', 'The surcharge changes monthly, so the formulas must read it from E1 and still work when copied down.'),
      expectedBehavior: 'C2:C4 show cost × (1 + surcharge), using the rate in E1.',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['Route', 'Cost', 'With surcharge']]), ...grid('A2', [['North', 50], ['Coast', 80], ['City', 20]]), D1: 'Surcharge', E1: 0.15 }), editable: ['C2:C4'] },
      hints: ['The surcharge percentage is a factor added to one.', 'Do not type 0.15 into the formula: where is it stored?', 'Dollar signs keep a reference fixed when a formula is copied.'],
      constraints: [anchor],
      checks: [
        cells('Costs with a 15% surcharge', { C2: 57.5, C3: 92, C4: 23 }, { approx: 1e-9 }),
        cells('Changing the rate changes the costs', { C2: 55, C3: 88, C4: 22 }, { with: { E1: 0.1 }, approx: 1e-9, visible: false }),
        isFormula('The costs are calculated, not typed', 'C2', 'E\\$?1'),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'xl-01-budget', title: 'A Budget That Adds Itself Up', mode: 'challenge', language: 'sheet', skillIds: ['xl.formulas'], concepts: ['formula', 'order of operations'], difficulty: 3, context: 'finance',
      prompt: text('A household budget lists monthly income in B1 and three costs in B3:B5. Complete the rest of the sheet with formulas:', '- B6: total costs\n- B7: money left over (income minus total costs)\n- B8: the share of income that is left over, as a fraction (for example 0.25)', 'Every answer must update when an input changes.'),
      expectedBehavior: 'B6, B7 and B8 are formulas that follow the inputs.',
      starterCode: '',
      sheet: { start: book({ A1: 'Income', B1: 3200, A2: 'Costs', ...grid('A3', [['Rent', 1200], ['Food', 600], ['Transport', 250], ['Total costs'], ['Left over'], ['Share left']]) }), editable: ['B6:B8'] },
      hints: ['Start with the total of the three costs.', 'Left over depends on two cells you already have.', 'A share is one amount divided by another; mind the order of operations.'],
      checks: [
        cells('Totals for this month', { B6: 2050, B7: 1150, B8: 0.359375 }, { approx: 1e-9 }),
        cells('Still right for different numbers', { B6: 1100, B7: 900, B8: 0.45 }, { with: { B1: 2000, B3: 500, B4: 400, B5: 200 }, approx: 1e-9, visible: false }),
        isFormula('B8 is a formula', 'B8'),
      ],
      xpReward: 60, coinReward: 10,
    },
    {
      id: 'xl-01-margin', title: 'Profit and Margin', mode: 'challenge', language: 'sheet', skillIds: ['xl.formulas'], concepts: ['formula', 'ratio'], difficulty: 3, context: 'manufacturing',
      prompt: text('Each row lists what a part costs to make (column B) and what it sells for (column C). In column D show the **profit** per part and in column E the **margin**: the profit as a fraction of the **selling price**.'),
      expectedBehavior: 'D2:D4 hold price minus cost; E2:E4 hold profit divided by price.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Part', 'Cost', 'Price', 'Profit', 'Margin'], ['Widget', 6, 10], ['Gadget', 15, 20], ['Gizmo', 8, 8]])), editable: ['D2:E4'] },
      hints: ['Profit is one subtraction; the order matters.', 'A margin divides by something specific: read the prompt for what.', 'Margin can use the profit cell you just built.'],
      checks: [
        cells('Profit and margin', { D2: 4, E2: 0.4, D3: 5, E3: 0.25, D4: 0, E4: 0 }, { approx: 1e-9 }),
        cells('Losses and other prices', { D2: 3, E2: 0.25, D3: -10, E3: -0.25, D4: 3, E4: 0.75 }, { with: { B2: 9, C2: 12, B3: 50, C3: 40, B4: 1, C4: 4 }, approx: 1e-9, visible: false }),
        isFormula('E2 is a formula', 'E2'),
      ],
      xpReward: 60, coinReward: 10,
    },
  ],
  objectives: [
    { id: 'xl-obj-rate-cell', title: 'Use a rate stored in one cell', summary: 'Build formulas that read a shared rate from a fixed cell, so one change updates everything.' },
  ],
};
