import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { book, cells, grid, isFormula } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'xl-04-lookups', title: 'Finding Things in Tables', language: 'sheet', skillId: 'xl.lookup',
    blurb: 'VLOOKUP exact and approximate, INDEX/MATCH and XLOOKUP.', prerequisites: ['xl-03-logic'], xpReward: 65,
    reference: {
      title: 'Lookup functions',
      body: text('`=VLOOKUP(key, table, column, FALSE)` finds `key` in the **first column** of `table` and returns the value from the given column; `FALSE` means an exact match. With `TRUE` (or omitted) it finds the closest value **not above** the key in a sorted first column: for bands and brackets.', '`=INDEX(range, MATCH(key, lookup_range, 0))` works in any direction. `=XLOOKUP(key, lookup_range, return_range, "not found")` is the modern version.'),
      example: '=VLOOKUP(A2,Catalog!A2:C6,3,FALSE)\n=VLOOKUP(B2,F2:G6,2,TRUE)\n=INDEX(A2:A6,MATCH("Ann",B2:B6,0))\n=XLOOKUP(A2,Catalog!A2:A6,Catalog!C2:C6,"none")',
    },
    steps: [
      {
        kind: 'teach', title: 'Looking a value up in a table',
        body: text(
          'Real data lives in tables: products with prices, employees with departments, tax bands. A **lookup** takes a key (a product code), finds it in a table and returns another value from the same row. `=VLOOKUP(A2, Catalog!A2:C6, 3, FALSE)` means: find A2 in the first column of the table, then give me column 3. The last argument `FALSE` demands an exact match.',
          'If the key is missing you get `#N/A`, which is the spreadsheet saying “not found”. Wrap it: `=IFERROR(VLOOKUP(...),"unknown")`.',
        ),
      },
      {
        kind: 'teach', title: 'Approximate matches, and lookups in any direction',
        body: text(
          'With `TRUE` a lookup finds the last row whose first-column value is **less than or equal** to the key. This is how brackets work: a tax table with thresholds 0, 10000 and 40000 returns the band that applies to an income of 25000. The first column **must be sorted ascending** for this to work.',
          '`VLOOKUP` can only return columns to the **right** of the key. `INDEX` and `MATCH` remove that limit: `MATCH` finds the row number of the key, `INDEX` returns the value at that row from any column. `XLOOKUP` does the same in one function with an optional “not found” value.',
        ),
      },
      {
        kind: 'demo', title: 'Exact and approximate lookups', language: 'sheet',
        body: text('Try changing the product code in A2 to a code that is not in the catalog, and the income in F2 to exactly 10000 and to 9999. Press Calculate after you have tried.'),
        sheet: { sheets: { Sheet1: { ...grid('A1', [['Code', 'Price'], ['B-2', '=IFERROR(VLOOKUP(A2,Catalog!A2:C4,3,FALSE),"unknown")']]), ...grid('E1', [['Income', 'Rate'], [25000, '=VLOOKUP(E2,H2:I4,2,TRUE)']]), ...grid('H1', [['From', 'Rate'], [0, 0.1], [10000, 0.2], [40000, 0.3]]) }, Catalog: grid('A1', [['Code', 'Name', 'Price'], ['A-1', 'Bolt', 2.5], ['B-2', 'Nut', 0.4], ['C-3', 'Gear', 12]]) } },
        code: '',
        notice: 'The exact lookup returned the price for B-2, and a missing code would give “unknown”. The approximate lookup put 25000 in the 10000 band (20%): it found the last threshold that is not above the income.',
      },
      { kind: 'challenge', challengeId: 'xl-04-price-list' },
      { kind: 'challenge', challengeId: 'xl-04-tax-band' },
      { kind: 'challenge', challengeId: 'xl-04-reverse' },
    ],
  },
  challenges: [
    {
      id: 'xl-04-price-list', title: 'Look Up the Price', mode: 'learning', language: 'sheet', skillIds: ['xl.lookup'], concepts: ['VLOOKUP', 'exact match'], difficulty: 2, context: 'retail',
      prompt: text('Sheet1 lists items bought (column A holds the product code). The Catalog sheet holds every code with its name (column B) and price (column C). Fill B2:B4 with each item’s price; if a code is not in the catalog, show “unknown”.'),
      expectedBehavior: 'B2:B4 show the catalog price for each code, or unknown for a code that is not listed.',
      guidedSteps: ['Use `=VLOOKUP(A2, Catalog!A2:C6, 3, FALSE)`.', 'Wrap it so a missing code shows “unknown”: `=IFERROR(..., "unknown")`.', 'Fill B3 and B4 the same way.'],
      starterCode: '',
      sheet: { start: { active: 'Sheet1', sheets: { Sheet1: grid('A1', [['Code', 'Price'], ['C-3'], ['A-1'], ['Z-9']]), Catalog: grid('A1', [['Code', 'Name', 'Price'], ['A-1', 'Bolt', 2.5], ['B-2', 'Nut', 0.4], ['C-3', 'Gear', 12], ['D-4', 'Cog', 7], ['E-5', 'Axle', 30]]) } }, editable: ['Sheet1!B2:B4'] },
      hints: ['You need the row of the catalog that has the same code.', 'The price is the third column of the catalog table.', 'Exact match means the last argument is FALSE.'],
      checks: [
        cells('Prices', { B2: 12, B3: 2.5, B4: 'unknown' }),
        cells('Other codes', { B2: 30, B3: 'unknown', B4: 0.4 }, { with: { A2: 'E-5', A3: 'Q-0', A4: 'B-2' }, visible: false }),
        isFormula('B2 is a formula', 'B2', 'LOOKUP|INDEX'),
      ],
      xpReward: 35, coinReward: 5,
    },
    {
      id: 'xl-04-tax-band', objectiveId: 'xl-obj-approx-lookup', title: 'Income Tax Bands', mode: 'challenge', language: 'sheet', skillIds: ['xl.lookup'], concepts: ['VLOOKUP', 'approximate match'], difficulty: 3, context: 'finance',
      prompt: text('The band table in F2:G5 gives a tax rate that starts at each income threshold (0, 12000, 30000, 80000). For each income in B2:B5, show the rate of the band it falls in in C2:C5. An income exactly equal to a threshold belongs to that band.'),
      expectedBehavior: 'C2:C5 hold the rate of the band each income falls in.',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['Person', 'Income', 'Rate'], ['Ana', 9000], ['Bo', 12000], ['Cy', 45000], ['Di', 120000]]), ...grid('F1', [['From', 'Rate'], [0, 0.1], [12000, 0.2], [30000, 0.3], [80000, 0.4]]) }), editable: ['C2:C5'] },
      hints: ['Each income falls between two thresholds.', 'One lookup mode finds the closest value that is not above the key.', 'That mode requires the thresholds to be sorted; they are.'],
      checks: [
        cells('Rates', { C2: 0.1, C3: 0.2, C4: 0.3, C5: 0.4 }, { approx: 1e-9 }),
        cells('Boundaries', { C2: 0.1, C3: 0.3, C4: 0.3, C5: 0.4 }, { with: { B2: 11999, B3: 30000, B4: 79999.99, B5: 80000 }, approx: 1e-9, visible: false }),
        cells('Table changed', { C2: 0.1, C3: 0.25, C4: 0.25, C5: 0.4 }, { with: { F3: 20000, G3: 0.25, B2: 19999, B3: 20000, B4: 29999, B5: 85000 }, approx: 1e-9, visible: false }),
        isFormula('C2 is a formula', 'C2', 'LOOKUP|INDEX|MATCH|IF'),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-04-tax-band-b', objectiveId: 'xl-obj-approx-lookup', title: 'Shipping Brackets', mode: 'challenge', language: 'sheet', skillIds: ['xl.lookup'], concepts: ['VLOOKUP', 'approximate match'], difficulty: 3, context: 'logistics',
      prompt: text('The bracket table in E2:F5 gives a shipping fee that starts at each weight (0, 2, 10, 25 kg). For each parcel weight in B2:B5, show the fee of its bracket in C2:C5. A weight exactly equal to a bracket start belongs to that bracket.'),
      expectedBehavior: 'C2:C5 hold the fee of the bracket each weight falls in.',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['Parcel', 'Weight', 'Fee'], ['P1', 1.5], ['P2', 2], ['P3', 18], ['P4', 40]]), ...grid('E1', [['From kg', 'Fee'], [0, 4], [2, 7], [10, 15], [25, 30]]) }), editable: ['C2:C5'] },
      hints: ['Each weight falls between two bracket starts.', 'A lookup can find the closest start that is not above the weight.', 'The bracket starts are sorted ascending.'],
      checks: [
        cells('Fees', { C2: 4, C3: 7, C4: 15, C5: 30 }),
        cells('Boundaries', { C2: 4, C3: 15, C4: 15, C5: 30 }, { with: { B2: 1.99, B3: 10, B4: 24.9, B5: 25 }, visible: false }),
        isFormula('C2 is a formula', 'C2', 'LOOKUP|INDEX|MATCH|IF'),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'xl-04-reverse', objectiveId: 'xl-obj-lookup-left', title: 'Find the ID From the Name', mode: 'challenge', language: 'sheet', skillIds: ['xl.lookup'], concepts: ['INDEX', 'MATCH', 'XLOOKUP'], difficulty: 3, context: 'business',
      prompt: text('The staff table in A2:C6 lists an ID (A), a name (B) and a department (C). The names to look up are in column E. For each name, show the matching **ID** in F2:F4 (the ID sits to the **left** of the name, so the classic VLOOKUP cannot reach it).', 'A name that is not in the table must show “not found”.'),
      expectedBehavior: 'F2:F4 show the ID of each name, or not found.',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['ID', 'Name', 'Dept'], [101, 'Ana', 'ENG'], [102, 'Ben', 'OPS'], [103, 'Caz', 'HR'], [104, 'Dev', 'ENG'], [105, 'Eli', 'OPS']]), ...grid('E1', [['Name', null, 'ID'], ['Caz'], ['Eli'], ['Zoe']]) }), editable: ['F2:F4'] },
      hints: ['The key is in a column to the right of the value you need.', 'One approach finds the row number first, then reads another column at that row.', 'Another single function can search one range and return from another.'],
      checks: [
        cells('IDs', { F2: 103, F3: 105, F4: 'not found' }),
        cells('Other names', { F2: 101, F3: 'not found', F4: 104 }, { with: { E2: 'Ana', E3: 'Nobody', E4: 'Dev' }, visible: false }),
        isFormula('F2 is a formula', 'F2', 'INDEX|XLOOKUP|LOOKUP'),
      ],
      xpReward: 75, coinReward: 12,
    },
    {
      id: 'xl-04-reverse-b', objectiveId: 'xl-obj-lookup-left', title: 'Find the Item From the Name', mode: 'challenge', language: 'sheet', skillIds: ['xl.lookup'], concepts: ['INDEX', 'MATCH', 'XLOOKUP'], difficulty: 3, context: 'operations',
      prompt: text('The equipment register in A2:C6 lists an asset tag (A), an item name (B) and a location (C). The item names to look up are in column E. For each name, show the matching **asset tag** in F2:F4 (the tag is to the **left** of the name).', 'An item that is not registered must show “not found”.'),
      expectedBehavior: 'F2:F4 show the asset tag of each item, or not found.',
      starterCode: '',
      sheet: { start: book({ ...grid('A1', [['Tag', 'Item', 'Location'], ['T-01', 'Drill', 'Shed'], ['T-02', 'Saw', 'Shed'], ['T-03', 'Ladder', 'Yard'], ['T-04', 'Pump', 'Yard'], ['T-05', 'Lamp', 'Office']]), ...grid('E1', [['Item', null, 'Tag'], ['Pump'], ['Drill'], ['Kettle']]) }), editable: ['F2:F4'] },
      hints: ['You are looking for something that sits left of the key column.', 'Find the position of the name first, then pick the tag at that position.', 'A single function can search one range and return from another.'],
      checks: [
        cells('Tags', { F2: 'T-04', F3: 'T-01', F4: 'not found' }),
        cells('Other items', { F2: 'T-05', F3: 'not found', F4: 'T-02' }, { with: { E2: 'Lamp', E3: 'Hammer', E4: 'Saw' }, visible: false }),
        isFormula('F2 is a formula', 'F2', 'INDEX|XLOOKUP|LOOKUP'),
      ],
      xpReward: 75, coinReward: 12,
    },
  ],
  objectives: [
    { id: 'xl-obj-approx-lookup', title: 'Bands and brackets with approximate lookup', summary: 'Find the band an amount falls into using a sorted threshold table.' },
    { id: 'xl-obj-lookup-left', title: 'Look up a value to the left of the key', summary: 'Use INDEX/MATCH or XLOOKUP when the answer is left of the key column, with a not-found value.' },
  ],
};
