import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { book, cells, grid, isFormula } from './helpers';

const prices = grid('A1', [['Item', 'Price'], ['Bolt', 2.5], ['Nut', 0.4], ['Gear', 12], ['Cog', 7]]);
const fleetRates = grid('A1', [['Class', 'Day rate'], ['van', 55], ['truck', 120], ['crane', 400], ['trailer', 30]]);

export const bundle: LessonBundle = {
  lesson: {
    id: 'xl-08-modelling', title: 'Spreadsheet Models and What-If', language: 'sheet', skillId: 'xl.modeling',
    blurb: 'Assumption cells, projections over time and combining lookups, conditions and logic across sheets.', prerequisites: ['xl-04-lookups', 'xl-05-conditional'], xpReward: 70,
    reference: {
      title: 'Building a model',
      body: text('A **model** keeps its inputs (assumptions) in labelled cells and computes everything else from them, so changing one input updates the answer: a what-if. Never type an assumption inside a formula: `=B6*1.05` hides the 5%; `=B6*(1+$B$2)` exposes it.', 'For a projection, each row is computed from the row above. Use `$` to lock the assumption cells (`$B$2`) so the formula can be copied down. Use `MAX(0, …)` or `MIN` to keep quantities realistic (stock cannot go below zero).'),
      example: '=ROUNDUP($B$3/($B$1-$B$2),0)\n=B6*(1+$B$2)+$B$3\n=MAX(0,B6-$B$2+$B$3)',
    },
    steps: [
      { kind: 'teach', title: 'Inputs, calculations, outputs', body: text('Good models separate three zones: **inputs** you may change, **calculations** that follow from them, and **outputs** someone reads. If you can change any input and every output updates correctly, the model works. If changing an input breaks something, a number was typed where a reference belonged.', 'Test a model the way you test code: try extreme inputs (zero, very large, negative) and check the answer makes sense.') },
      { kind: 'teach', title: 'Combining what you know', body: text('Real questions mix skills: look a price up by name, apply a discount rule only above a quantity, total the result and count the rows that qualified. Read the brief, split it into small steps, and decide which skill each step needs before writing the first formula. Check each step on its own before combining them.') },
      { kind: 'demo', title: 'A projection', language: 'sheet', body: text('Change the rate in B2 or the yearly deposit in B3 and watch the balance column follow. Press Calculate after trying it.'), sheet: { sheets: { Sheet1: grid('A1', [['Start', 10000], ['Rate', 0.05], ['Yearly deposit', 1200], [null], ['Year', 'Balance'], [1, '=B1*(1+$B$2)+$B$3'], [2, '=B6*(1+$B$2)+$B$3'], [3, '=B7*(1+$B$2)+$B$3']]) } }, code: '', notice: 'Every balance uses the same two locked assumption cells. One change there moves the whole column.' },
      { kind: 'challenge', challengeId: 'xl-08-break-even' },
      { kind: 'challenge', challengeId: 'xl-08-projection' },
      { kind: 'challenge', challengeId: 'xl-08-order-book' },
    ],
  },
  challenges: [
    {
      id: 'xl-08-break-even', title: 'Break-Even Point', mode: 'learning', language: 'sheet', skillIds: ['xl.modeling'], concepts: ['assumption cells', 'ROUNDUP'], difficulty: 2, context: 'business',
      prompt: text('A small business sells one product. Cells B1:B4 hold the price, the cost to make one unit, the fixed monthly cost and the planned units. In B6 show the **fewest whole units** that must be sold to cover the fixed cost, and in B7 the **profit at the planned units**. Both must update when an input changes.'),
      expectedBehavior: 'B6 is the fewest whole units to cover fixed cost; B7 is planned profit.',
      guidedSteps: ['Each unit earns price minus unit cost.', 'Break-even units = fixed cost ÷ that, rounded UP to a whole unit.', 'Profit = planned units × unit margin − fixed cost.'],
      starterCode: '',
      sheet: { start: book(grid('A1', [['Price', 12], ['Unit cost', 7], ['Fixed cost', 4000], ['Planned units', 1000], [null], ['Break-even units'], ['Profit at plan']])), editable: ['B6:B7'] },
      hints: ['Start from what one unit contributes.', 'Half a unit cannot be sold, so round in the safe direction.', 'Refer to cells; never type an input into a formula.'],
      checks: [
        cells('Model outputs', { B6: 800, B7: 1000 }),
        cells('Other inputs', { B6: 169, B7: -410 }, { with: { B1: 10, B2: 4, B3: 1010, B4: 100 }, visible: false }),
        isFormula('B6 is a formula', 'B6', 'B'),
      ],
      xpReward: 40, coinReward: 6,
    },
    {
      id: 'xl-08-projection', objectiveId: 'xl-obj-projection', title: 'Savings Projection', mode: 'challenge', language: 'sheet', skillIds: ['xl.modeling'], concepts: ['projection', 'absolute references'], difficulty: 3, context: 'finance',
      prompt: text('B1 holds a starting balance, B2 a yearly interest rate and B3 a deposit added at the **end** of each year (after interest). Fill B6:B10 with the balance at the end of years 1 to 5. The model must still work if any input changes.'),
      expectedBehavior: 'B6:B10 hold the year-end balances for years 1 to 5.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Start', 10000], ['Rate', 0.05], ['Deposit', 1200], [null], ['Year', 'Balance'], [1], [2], [3], [4], [5]])), editable: ['B6:B10'] },
      hints: ['Each year builds on the last.', 'The first year builds on the starting balance.', 'The rate and deposit must be locked so the formula can be copied down.'],
      checks: [
        cells('Balances', { B6: 11700, B7: 13485, B8: 15359.25, B9: 17327.2125, B10: 19393.573125 }, { approx: 1e-6 }),
        cells('Other inputs', { B6: 5500, B7: 6050, B8: 6655, B9: 7320.5, B10: 8052.55 }, { with: { B1: 5000, B2: 0.1, B3: 0 }, approx: 1e-6, visible: false }),
        isFormula('B7 is a formula', 'B7', 'B6'),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-08-projection-b', objectiveId: 'xl-obj-projection', title: 'Stock Over Five Weeks', mode: 'challenge', language: 'sheet', skillIds: ['xl.modeling'], concepts: ['projection', 'MAX'], difficulty: 3, context: 'logistics',
      prompt: text('B1 is the stock at the start, B2 the units sold each week and B3 the units delivered each week. Each week the closing stock is the previous stock minus sales plus the delivery, but **stock can never be negative**. Fill B6:B10 with the closing stock of weeks 1 to 5, for any inputs.'),
      expectedBehavior: 'B6:B10 hold the closing stock for weeks 1 to 5, never below 0.',
      starterCode: '',
      sheet: { start: book(grid('A1', [['Start stock', 60], ['Weekly sales', 25], ['Weekly delivery', 10], [null], ['Week', 'Closing stock'], [1], [2], [3], [4], [5]])), editable: ['B6:B10'] },
      hints: ['Each week builds on the previous closing stock.', 'A rule about a limit belongs around the whole calculation.', 'Test with sales much larger than stock.'],
      checks: [
        cells('Closing stock', { B6: 45, B7: 30, B8: 15, B9: 0, B10: 0 }),
        cells('Plenty of stock', { B6: 90, B7: 80, B8: 70, B9: 60, B10: 50 }, { with: { B1: 100, B2: 30, B3: 20 }, visible: false }),
        cells('Stock runs out', { B6: 25, B7: 0, B8: 0, B9: 0, B10: 0 }, { with: { B1: 50, B2: 40, B3: 15 }, visible: false }),
        isFormula('B7 is a formula', 'B7', 'B6'),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-08-order-book', objectiveId: 'xl-obj-order-model', title: 'The Order Book', mode: 'independent', language: 'sheet', skillIds: ['xl.modeling', 'xl.lookup', 'xl.logic', 'xl.conditional'], concepts: [], difficulty: 4, transfer: true, context: 'retail', project: true,
      prompt: text(
        'A shop records each order on Sheet1 (item and quantity). Its price list is on the sheet called **Prices**. Orders of at least the quantity in **G4** get the discount rate in **G5** off the whole line. An item that is not on the price list cannot be priced, so its line is worth 0.',
        'In **D2:D6** show the revenue of each order. In **G1** show the total revenue and in **G2** how many orders received the discount. The shop changes its prices, discount rules and orders every week, so nothing may be typed in that could change.',
      ),
      starterCode: '',
      sheet: { start: { active: 'Sheet1', sheets: { Sheet1: { ...grid('A1', [['Order', 'Item', 'Qty', 'Revenue'], ['O1', 'Bolt', 4], ['O2', 'Nut', 10], ['O3', 'Gear', 12], ['O4', 'Cog', 3], ['O5', 'Widget', 5]]), ...grid('F1', [['Total revenue', null], ['Discounted orders', null], [null], ['Discount from qty', 10], ['Discount rate', 0.1]]) }, Prices: prices } }, editable: ['Sheet1!D2:D6', 'Sheet1!G1:G2'] },
      hints: [],
      checks: [
        cells('Order revenue', { D2: 10, D3: 3.6, D4: 129.6, D5: 21, D6: 0 }, { approx: 1e-9 }),
        cells('Totals', { G1: 164.2, G2: 2 }, { approx: 1e-9 }),
        cells('Other rules and prices', { D2: 10, D3: 0.8, D4: 115.2, D5: 30, D6: 0, G1: 156, G2: 2 }, { with: { G4: 5, G5: 0.2, C2: 5, C3: 2, C6: 4, 'Prices!B5': 10 }, approx: 1e-9, visible: false }),
        cells('A discount at exactly the limit', { D3: 4, G2: 1 }, { with: { G4: 10, G5: 0.5, C3: 10, C2: 1, C4: 1, C5: 1, 'Prices!B3': 0.8 }, approx: 1e-9, visible: false }),
      ],
      xpReward: 160, coinReward: 25,
    },
    {
      id: 'xl-08-fleet', objectiveId: 'xl-obj-order-model', title: 'The Hire Desk', mode: 'independent', language: 'sheet', skillIds: ['xl.modeling', 'xl.lookup', 'xl.logic', 'xl.conditional'], concepts: [], difficulty: 4, transfer: true, context: 'equipment hire', project: true,
      prompt: text(
        'An equipment hire desk lists each booking on Sheet1 (vehicle class and number of days). The daily rate for each class is on the sheet called **Rates**. Bookings of **G4 days or more** get the long-hire discount rate in **G5** off the whole booking. A class that is not on the rate sheet has no price, so that booking is worth 0.',
        'In **D2:D6** show the price of each booking. In **G1** show the total takings and in **G2** how many bookings got the long-hire discount. Rates, limits and bookings change, so nothing may be typed in that could change.',
      ),
      starterCode: '',
      sheet: { start: { active: 'Sheet1', sheets: { Sheet1: { ...grid('A1', [['Booking', 'Class', 'Days', 'Price'], ['B1', 'van', 3], ['B2', 'crane', 7], ['B3', 'truck', 2], ['B4', 'van', 14], ['B5', 'boat', 4]]), ...grid('F1', [['Total takings', null], ['Long hires', null], [null], ['Long hire from days', 7], ['Long hire discount', 0.15]]) }, Rates: fleetRates } }, editable: ['Sheet1!D2:D6', 'Sheet1!G1:G2'] },
      hints: [],
      checks: [
        cells('Booking prices', { D2: 165, D3: 2380, D4: 240, D5: 654.5, D6: 0 }, { approx: 1e-9 }),
        cells('Totals', { G1: 3439.5, G2: 2 }, { approx: 1e-9 }),
        cells('Other rules and rates', { D2: 150, D3: 500, D4: 240, D5: 210, D6: 0, G1: 1100, G2: 3 }, { with: { G4: 10, G5: 0.5, C2: 10, 'Rates!B2': 30, C3: 10, 'Rates!B4': 100 }, approx: 1e-9, visible: false }),
      ],
      xpReward: 160, coinReward: 25,
    },
  ],
  objectives: [
    { id: 'xl-obj-projection', title: 'Projections from assumption cells', summary: 'Build a year-by-year or week-by-week model that follows its inputs.' },
    { id: 'xl-obj-order-model', title: 'A multi-sheet pricing model', summary: 'Combine lookup, conditions and totals without typing in anything that could change.' },
  ],
};
