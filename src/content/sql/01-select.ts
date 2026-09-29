import { sqlRes, text } from '../helpers';
import type { LessonBundle } from '../schema';

const START = '-- Write your query below\n';

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-01-select', title: 'Asking the Database', language: 'sql', skillId: 'sql.select',
    blurb: 'Tables, rows and columns; SELECT, FROM, WHERE with AND, OR, NOT and IN.', prerequisites: ['py-21-cleaning'], xpReward: 45,
    reference: {
      title: 'SELECT and WHERE',
      body: text(
        'A **relational database** stores data in **tables**: each **row** is one thing (a product, an order), each **column** is one fact about it (name, price). `SELECT columns FROM table WHERE condition;` asks a question. `*` means “all columns”.',
        'Conditions compare with `=`, `<>` (not equal), `<`, `>`, `<=`, `>=`, and combine with `AND`, `OR`, `NOT`. `IN (a, b)` tests membership; `BETWEEN a AND b` a range; `LIKE \'Bo%\'` text patterns. You can compute columns (`price * stock AS stock_value`) and name them with `AS`. Text is written in single quotes.',
      ),
      example: "SELECT name, price FROM products\nWHERE category IN ('Tools', 'Safety') AND price < 50;",
    },
    steps: [
      {
        kind: 'teach', title: 'Databases and the language for asking them',
        body: text(
          'Most of the world’s business data lives in **relational databases**: collections of **tables** that are linked to each other. The language for asking questions of them is **SQL** (say “sequel” or “S-Q-L”). It has been around since the 1970s, and it is used in almost every technical job that touches data: engineering, finance, healthcare, science, software.',
          'SQL is **declarative**: you describe *what* you want, not *how* to loop through rows. `SELECT name FROM products WHERE price < 20` says “give me the names of products under 20”, and the database works out the rest.',
        ),
      },
      {
        kind: 'demo', title: 'Your first query', language: 'sql', db: 'market',
        body: text('You are looking at the **Bytehaven Market** database. Use the schema panel next to the editor to see its tables. Run this query, then try changing `5` to another number.'),
        code: 'SELECT * FROM products LIMIT 5;',
        notice: 'A result is itself a table: columns across the top, one row per product. `LIMIT 5` stopped after five rows so we did not print the whole table.',
      },
      {
        kind: 'demo', title: 'Choosing rows with WHERE', language: 'sql', db: 'market',
        body: text('Only some columns, only some rows. Predict how many rows come back, then run it.'),
        code: "SELECT name, category, price\nFROM products\nWHERE category = 'Tools' AND price < 100;",
        notice: '`WHERE` filtered the ROWS; the list after `SELECT` chose the COLUMNS. `AND` requires both conditions. Text values are in single quotes and are case sensitive here.',
      },
      {
        kind: 'demo', title: 'What an error looks like', language: 'sql', db: 'market', expectsError: true,
        body: text('SQL errors are just as readable as Python’s. This query has a typo in a column name.'),
        code: 'SELECT nme, price FROM products;',
        notice: '“no such column: nme” names the exact problem. Whenever you get one, check the spelling of every table and column against the schema panel.',
      },
      { kind: 'challenge', challengeId: 'sql-01-cheap-products' },
      { kind: 'challenge', challengeId: 'sql-01-safety-or-tools' },
      { kind: 'challenge', challengeId: 'sql-01-stock-value' },
    ],
  },
  objectives: [
    { id: 'sql-obj-filter-combined', title: 'Filter rows with combined conditions', summary: 'Combine comparisons with AND, OR and IN to choose exactly the rows described.' },
    { id: 'sql-obj-expressions', title: 'Compute new columns', summary: 'Calculate a value per row in the SELECT list and name it with AS.' },
  ],
  challenges: [
    {
      id: 'sql-01-cheap-products', title: 'Bargains', mode: 'learning', language: 'sql', db: 'market', skillIds: ['sql.select'], concepts: ['SELECT', 'FROM', 'WHERE', 'comparison'], difficulty: 1, context: 'retail',
      prompt: text('The market wants a list of bargains. Write a query that shows the **name** and **price** of every product whose price is **under 30**.'),
      expectedBehavior: 'Two columns (name, price) and one row per product cheaper than 30.',
      guidedSteps: ['Start with `SELECT name, price`.', 'Say which table: `FROM products`.', 'Add the condition: `WHERE price < 30`.', 'End with a semicolon and press Run to see the result.'],
      starterCode: START,
      hints: ['You need two columns and one table.', 'A `WHERE` clause chooses which rows are kept.', 'After the table name, add a `WHERE` clause with the comparison `price < 30`.'],
      checks: sqlRes('SELECT name, price FROM products WHERE price < 30', 'market', ['market-b']),
      xpReward: 40, coinReward: 6,
    },
    {
      id: 'sql-01-safety-or-tools', objectiveId: 'sql-obj-filter-combined', title: 'Affordable Tools and Safety Gear', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.select'], concepts: ['WHERE', 'AND', 'OR', 'IN'], difficulty: 2, context: 'retail',
      prompt: text('A buyer wants to see the **name, category and price** of products that are in the **Tools** or **Safety** category **and** cost **less than 80**.'),
      expectedBehavior: 'Columns name, category, price; only Tools/Safety products under 80.',
      starterCode: '',
      hints: ['Two ideas are combined: which category, and how much it costs.', 'One condition allows several values; the other is a comparison. Both must be true.', "`category IN ('Tools', 'Safety') AND price < 80`. With `OR`, remember parentheses so `AND` applies to both categories."],
      checks: sqlRes("SELECT name, category, price FROM products WHERE category IN ('Tools', 'Safety') AND price < 80", 'market', ['market-b']),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-01-senior-technicians', objectiveId: 'sql-obj-filter-combined', title: 'Well-Paid Skilled Staff', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.select'], concepts: ['WHERE', 'AND', 'OR', 'IN'], difficulty: 2, context: 'human resources',
      prompt: text('HR wants the **name and hourly rate** of employees who are **technicians or supervisors** and earn **more than 30** an hour.'),
      expectedBehavior: 'Columns name, hourly_rate; only technicians/supervisors paid above 30.',
      starterCode: '',
      hints: ['You are filtering on two different columns.', 'One column allows two values; the other is a comparison. Both must hold.', "`role IN ('technician', 'supervisor') AND hourly_rate > 30`"],
      checks: sqlRes("SELECT name, hourly_rate FROM employees WHERE role IN ('technician', 'supervisor') AND hourly_rate > 30", 'works', ['works-b']),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-01-stock-value', objectiveId: 'sql-obj-expressions', title: 'What Is on the Shelf Worth?', mode: 'challenge', language: 'sql', db: 'market', skillIds: ['sql.select'], concepts: ['expression', 'AS', 'WHERE'], difficulty: 2, context: 'retail',
      prompt: text('For every product that has **some stock** (more than zero), show its **name** and the total value of its stock, which is price × stock. Call that second column `stock_value`.'),
      expectedBehavior: 'Two columns: name and stock_value; products with zero stock are left out.',
      starterCode: '',
      hints: ['A column in the SELECT list can be a calculation on other columns.', 'Give the calculated column a name with `AS`. Then leave out products with no stock.', '`price * stock AS stock_value`, and `WHERE stock > 0`.'],
      checks: sqlRes('SELECT name, price * stock AS stock_value FROM products WHERE stock > 0', 'market', ['market-b'], { columns: 'names', approx: 1e-6 }),
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-01-weekly-pay', objectiveId: 'sql-obj-expressions', title: 'Weekly Pay', mode: 'challenge', language: 'sql', db: 'works', skillIds: ['sql.select'], concepts: ['expression', 'AS', 'WHERE'], difficulty: 2, context: 'payroll',
      prompt: text('For every employee in **department 2**, show their **name** and their weekly pay assuming a 40-hour week, in a column called `weekly_pay`.'),
      expectedBehavior: 'Two columns: name and weekly_pay (hourly rate × 40), only for department 2.',
      starterCode: '',
      hints: ['You need one calculated column and a filter on the department.', 'The department is stored as a number in a column of the employees table (see the schema panel).', '`hourly_rate * 40 AS weekly_pay` and `WHERE department_id = 2`.'],
      checks: sqlRes('SELECT name, hourly_rate * 40 AS weekly_pay FROM employees WHERE department_id = 2', 'works', ['works-b'], { columns: 'names', approx: 1e-6 }),
      xpReward: 55, coinReward: 8,
    },
  ],
};
