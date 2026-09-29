import { sqlState, text } from '../helpers';
import type { Check, LessonBundle, SchemaRule } from '../schema';

const START = '-- Write your CREATE TABLE statement(s) below\n';
const okScript = (name: string, script: string, visible = true): Check => ({ kind: 'sqlScript', name, script, expectError: false, db: 'blank', visible });
const badScript = (name: string, script: string, feedback: string, visible = true): Check => ({ kind: 'sqlScript', name, script, expectError: true, db: 'blank', visible, feedback });
const schema = (name: string, rules: SchemaRule[], visible = true): Check => ({ kind: 'sqlSchema', name, rules, db: 'blank', visible });

export const bundle: LessonBundle = {
  lesson: {
    id: 'sql-12-design', title: 'Designing Tables', language: 'sql', skillId: 'db.design',
    blurb: 'Entities, keys, one-to-many relationships, constraints and normalisation.', prerequisites: ['sql-11-window'], xpReward: 65,
    reference: {
      title: 'Designing a schema',
      body: text(
        '**Design from the nouns**: each kind of thing (member, book, loan) becomes a **table**; each fact about it a **column**; each row a single thing. Give every table a **primary key**. If one thing has many of another (a member has many loans), the “many” side gets a **foreign key** column pointing at the “one” side: a **one-to-many** relationship. A many-to-many (students ↔ courses) needs a **link table** with two foreign keys.',
        '**Normalisation** (introductory): store each fact **once**. Warning signs: the same customer’s name/city repeated on many rows; columns like `phone1, phone2, phone3`; a column holding a comma-separated list. Fix them by splitting into tables and linking by key.',
        '**Constraints** make the database refuse bad data: `NOT NULL`, `UNIQUE`, `CHECK (weight > 0)`, `REFERENCES other(id)` (foreign key). They are the last line of defence when code has bugs.',
      ),
      example: 'CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL);\nCREATE TABLE loans (\n  id INTEGER PRIMARY KEY,\n  member_id INTEGER NOT NULL REFERENCES members(id),\n  borrowed_on TEXT NOT NULL\n);',
    },
    steps: [
      {
        kind: 'teach', title: 'You have been using other people’s designs',
        body: text(
          'Every table you have queried was designed by someone. Their choices decided whether your queries were easy or painful. Good design is about **deciding what the things in the problem are**, what facts each one has, and how they relate, and then letting the database **enforce** it.',
          'Start with a paragraph of requirements and underline the nouns. “A library lends books to members” gives you *library*, *books*, *members*, and an event, a *loan*, that connects a member with a book on a date. That is already a design.',
        ),
      },
      {
        kind: 'demo', title: 'Two tables and a relationship', language: 'sql', db: 'blank',
        body: text('You start with a blank database. Create the tables, add rows, then join them.'),
        code: "CREATE TABLE members (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);\nCREATE TABLE loans (\n  id INTEGER PRIMARY KEY,\n  member_id INTEGER NOT NULL REFERENCES members(id),\n  borrowed_on TEXT NOT NULL\n);\nINSERT INTO members (name) VALUES ('Ada'), ('Bo');\nINSERT INTO loans (member_id, borrowed_on) VALUES (1, '2024-03-01'), (1, '2024-03-08');\n\nSELECT m.name, COUNT(l.id) AS loans\nFROM members m LEFT JOIN loans l ON l.member_id = m.id\nGROUP BY m.id;",
        notice: 'One member, many loans: `loans.member_id` is the foreign key. The member’s name is stored once and every loan refers to it by id. Ada has 2 loans and Bo has 0.',
      },
      {
        kind: 'demo', title: 'The database defends itself', language: 'sql', db: 'blank', expectsError: true,
        body: text('The foreign key promises every loan belongs to a real member. What happens if we break the promise?'),
        code: "CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL);\nCREATE TABLE loans (id INTEGER PRIMARY KEY, member_id INTEGER NOT NULL REFERENCES members(id));\nINSERT INTO loans (member_id) VALUES (42);",
        notice: 'There is no member 42, so the database refused the loan with a “FOREIGN KEY constraint failed”. A design with constraints catches bad data at the door, whichever program tries to insert it.',
      },
      {
        kind: 'teach', title: 'Splitting a wide table (normalisation)',
        body: text(
          'A table where a customer’s name and city are copied onto every sale is **denormalised**. Changing a city means editing many rows, and inconsistent copies are inevitable. To **normalise**: make a `customers` table with one row per customer, and make each sale refer to its customer by id. You will do this on a real table shortly.',
          'Normalisation is not a rule to apply blindly (reporting systems sometimes copy data on purpose), but you should always know **which** facts you are duplicating and why.',
        ),
      },
      { kind: 'challenge', challengeId: 'sql-12-first-table' },
      { kind: 'challenge', challengeId: 'sql-12-staff-table' },
      { kind: 'challenge', challengeId: 'sql-12-library' },
      { kind: 'challenge', challengeId: 'sql-12-normalize-sales' },
      { kind: 'challenge', challengeId: 'sql-12-factory-design' },
    ],
  },
  objectives: [
    { id: 'sql-obj-create-constrained', title: 'Create a table that refuses bad data', summary: 'Write CREATE TABLE with primary key, NOT NULL, UNIQUE and CHECK constraints.' },
    { id: 'sql-obj-relate-tables', title: 'Link tables with foreign keys', summary: 'Create a one-to-many (or link-table) structure whose foreign keys are enforced.' },
    { id: 'sql-obj-normalize', title: 'Normalise a repeated-data table', summary: 'Split a wide table into related tables and migrate the data without duplication.' },
    { id: 'sql-obj-design-requirements', title: 'Design a schema from requirements', summary: 'Choose entities, keys and relationships for a described organisation.' },
  ],
  challenges: [
    {
      id: 'sql-12-first-table', title: 'Your First Table', mode: 'learning', language: 'sql', db: 'blank', skillIds: ['db.design'], concepts: ['CREATE TABLE', 'primary key', 'NOT NULL'], difficulty: 2, context: 'manufacturing',
      prompt: text('Create a table called `parts` with three columns: `id` (a whole number, the **primary key**), `name` (text that **must be given**) and `unit_cost` (a number).'),
      expectedBehavior: 'A parts table exists; inserting a part without a name is refused.',
      guidedSteps: ['`CREATE TABLE parts (`', '`id INTEGER PRIMARY KEY,`', '`name TEXT NOT NULL,`', '`unit_cost REAL`', '`);`'],
      starterCode: START,
      hints: ['Each column needs a name and a type. Some columns can have extra rules after the type.', 'One column identifies each row, and one may never be empty.', 'Look at the example in the reference card: primary key on the id, and `NOT NULL` on the name.'],
      checks: [
        schema('The table has the right shape', [
          { rule: 'tableLike', pattern: '^parts$', message: 'a table called parts.' },
          { rule: 'columnLike', table: '^parts$', pattern: '^name$', message: 'a name column.' },
          { rule: 'columnLike', table: '^parts$', pattern: '^unit_cost$', message: 'a unit_cost column.' },
          { rule: 'hasPrimaryKeys', message: 'a primary key on id.' },
        ]),
        okScript('A valid part can be added', "INSERT INTO parts (name, unit_cost) VALUES ('Bolt', 0.25)"),
        badScript('A part without a name is refused', 'INSERT INTO parts (unit_cost) VALUES (1.5)', 'The name column must be required (NOT NULL).'),
      ],
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'sql-12-staff-table', objectiveId: 'sql-obj-create-constrained', title: 'A Table That Protects Itself', mode: 'challenge', language: 'sql', db: 'blank', skillIds: ['db.design', 'db.integrity'], concepts: ['CREATE TABLE', 'constraints', 'UNIQUE', 'CHECK'], difficulty: 3, context: 'human resources',
      prompt: text('Create a table `staff` with columns `id` (primary key), `name`, `email` and `salary`. The database itself must refuse bad data:', '`name` must be given.\n`email` must be given and **no two staff may share one**.\n`salary` **must not be negative** (it may be left empty).'),
      expectedBehavior: 'Valid staff are accepted; missing name/email, duplicate email, or negative salary are refused.',
      starterCode: '',
      hints: ['Each rule maps to a kind of constraint.', 'Required means `NOT NULL`; no two the same means `UNIQUE`; a condition on a value is a `CHECK (...)`.', 'On `email`: `NOT NULL UNIQUE`. On `salary`: a `CHECK` comparing it with 0.'],
      checks: [
        schema('The table has the right columns', [
          { rule: 'tableLike', pattern: '^staff$', message: 'a table called staff.' },
          { rule: 'hasPrimaryKeys', message: 'a primary key.' },
          { rule: 'hasConstraint', table: '^staff$', message: 'constraints on the staff table.' },
        ]),
        okScript('A valid person can be added', "INSERT INTO staff (name, email, salary) VALUES ('Ada', 'ada@example.com', 30000)"),
        badScript('A missing name is refused', "INSERT INTO staff (email, salary) VALUES ('x@example.com', 100)", 'name must be required.'),
        badScript('A missing email is refused', "INSERT INTO staff (name, salary) VALUES ('Bo', 100)", 'email must be required.', false),
        badScript('Two people with the same email are refused', "INSERT INTO staff (name, email, salary) VALUES ('Ada', 'same@example.com', 1); INSERT INTO staff (name, email, salary) VALUES ('Bo', 'same@example.com', 2)", 'email must be unique.', false),
        badScript('A negative salary is refused', "INSERT INTO staff (name, email, salary) VALUES ('Cy', 'cy@example.com', -5)", 'salary must not be negative.', false),
        okScript('An empty salary is allowed', "INSERT INTO staff (name, email) VALUES ('Di', 'di@example.com')", false),
      ],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'sql-12-shipments-table', objectiveId: 'sql-obj-create-constrained', title: 'Parcel Tracking', mode: 'challenge', language: 'sql', db: 'blank', skillIds: ['db.design', 'db.integrity'], concepts: ['CREATE TABLE', 'constraints', 'UNIQUE', 'CHECK'], difficulty: 3, context: 'logistics',
      prompt: text('Create a table `shipments` with columns `id` (primary key), `tracking_code`, `weight_kg` and `status`. The database must refuse bad data:', '`tracking_code` must be given and **unique**.\n`weight_kg` must be given and **greater than zero**.\n`status` must be given.'),
      expectedBehavior: 'Valid shipments are accepted; missing values, a repeated tracking code, or a weight of 0 or less are refused.',
      starterCode: '',
      hints: ['Three columns each have rules.', 'Required, no duplicates, and a numeric condition: three different kinds of constraint.', '`tracking_code TEXT NOT NULL UNIQUE`; `weight_kg REAL NOT NULL CHECK (...)`.'],
      checks: [
        schema('The table has the right columns', [
          { rule: 'tableLike', pattern: '^shipments$', message: 'a table called shipments.' },
          { rule: 'hasPrimaryKeys', message: 'a primary key.' },
          { rule: 'hasConstraint', table: '^shipments$', message: 'constraints on the shipments table.' },
        ]),
        okScript('A valid shipment can be added', "INSERT INTO shipments (tracking_code, weight_kg, status) VALUES ('TRK-1', 2.5, 'created')"),
        badScript('A missing status is refused', "INSERT INTO shipments (tracking_code, weight_kg) VALUES ('TRK-2', 1)", 'status must be required.'),
        badScript('A repeated tracking code is refused', "INSERT INTO shipments (tracking_code, weight_kg, status) VALUES ('T', 1, 'a'); INSERT INTO shipments (tracking_code, weight_kg, status) VALUES ('T', 2, 'b')", 'tracking_code must be unique.', false),
        badScript('A weight of zero is refused', "INSERT INTO shipments (tracking_code, weight_kg, status) VALUES ('Z', 0, 'a')", 'weight_kg must be greater than zero.', false),
        badScript('A missing weight is refused', "INSERT INTO shipments (tracking_code, status) VALUES ('W', 'a')", 'weight_kg must be required.', false),
        badScript('A missing tracking code is refused', "INSERT INTO shipments (weight_kg, status) VALUES (1, 'a')", 'tracking_code must be required.', false),
      ],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'sql-12-library', objectiveId: 'sql-obj-relate-tables', title: 'The Lending Library', mode: 'challenge', language: 'sql', db: 'blank', skillIds: ['db.design', 'db.integrity'], concepts: ['foreign key', 'one-to-many', 'REFERENCES'], difficulty: 3, context: 'education',
      prompt: text('A library lends books to members. Create three tables:', '`members` with `id` (primary key) and `name`.\n`books` with `id` (primary key) and `title`.\n`loans` with `id` (primary key), `member_id`, `book_id` and `borrowed_on`, where `member_id` and `book_id` are **foreign keys** to the other tables.', 'The database must refuse a loan for a member or a book that does not exist.'),
      expectedBehavior: 'Loans can only refer to real members and real books.',
      starterCode: '',
      hints: ['Two things (members, books) are linked by a third table that records each event.', 'The loans table holds two columns that point at the other tables’ keys.', '`member_id INTEGER NOT NULL REFERENCES members(id)`, and the same idea for books.'],
      checks: [
        schema('The tables and links exist', [
          { rule: 'tableLike', pattern: '^members$', message: 'a members table.' },
          { rule: 'tableLike', pattern: '^books$', message: 'a books table.' },
          { rule: 'tableLike', pattern: '^loans$', message: 'a loans table.' },
          { rule: 'hasPrimaryKeys', message: 'a primary key on every table.' },
          { rule: 'foreignKey', from: '^loans$', to: '^members$', message: 'loans linked to members by a foreign key.' },
          { rule: 'foreignKey', from: '^loans$', to: '^books$', message: 'loans linked to books by a foreign key.' },
        ]),
        okScript('A real loan is accepted', "INSERT INTO members (name) VALUES ('Ada'); INSERT INTO books (title) VALUES ('SQL Basics'); INSERT INTO loans (member_id, book_id, borrowed_on) VALUES (1, 1, '2024-03-01')"),
        badScript('A loan for a missing member is refused', "INSERT INTO books (title) VALUES ('X'); INSERT INTO loans (member_id, book_id, borrowed_on) VALUES (99, 1, '2024-03-01')", 'loans.member_id must be a foreign key to members.'),
        badScript('A loan for a missing book is refused', "INSERT INTO members (name) VALUES ('X'); INSERT INTO loans (member_id, book_id, borrowed_on) VALUES (1, 99, '2024-03-01')", 'loans.book_id must be a foreign key to books.', false),
      ],
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'sql-12-enrolments', objectiveId: 'sql-obj-relate-tables', title: 'Students and Courses', mode: 'challenge', language: 'sql', db: 'blank', skillIds: ['db.design', 'db.integrity'], concepts: ['foreign key', 'one-to-many', 'REFERENCES'], difficulty: 3, context: 'university',
      prompt: text('A college enrols students in courses. Create three tables:', '`students` with `id` (primary key) and `name`.\n`courses` with `id` (primary key) and `title`.\n`enrolments` with `id` (primary key), `student_id`, `course_id` and `enrolled_on`, where `student_id` and `course_id` are **foreign keys**.', 'A student can take many courses and a course can have many students. The database must refuse enrolments for students or courses that do not exist.'),
      expectedBehavior: 'Enrolments can only refer to real students and real courses.',
      starterCode: '',
      hints: ['A many-to-many relationship needs a table in the middle.', 'The middle table has two foreign keys, one to each side.', '`student_id INTEGER NOT NULL REFERENCES students(id)` and the same idea for courses.'],
      checks: [
        schema('The tables and links exist', [
          { rule: 'tableLike', pattern: '^students$', message: 'a students table.' },
          { rule: 'tableLike', pattern: '^courses$', message: 'a courses table.' },
          { rule: 'tableLike', pattern: '^enrolments$', message: 'an enrolments table.' },
          { rule: 'hasPrimaryKeys', message: 'a primary key on every table.' },
          { rule: 'foreignKey', from: '^enrolments$', to: '^students$', message: 'enrolments linked to students by a foreign key.' },
          { rule: 'foreignKey', from: '^enrolments$', to: '^courses$', message: 'enrolments linked to courses by a foreign key.' },
        ]),
        okScript('A real enrolment is accepted', "INSERT INTO students (name) VALUES ('Ada'); INSERT INTO courses (title) VALUES ('Databases'); INSERT INTO enrolments (student_id, course_id, enrolled_on) VALUES (1, 1, '2024-09-01')"),
        badScript('An enrolment for a missing student is refused', "INSERT INTO courses (title) VALUES ('X'); INSERT INTO enrolments (student_id, course_id, enrolled_on) VALUES (99, 1, '2024-09-01')", 'enrolments.student_id must be a foreign key to students.'),
        badScript('An enrolment for a missing course is refused', "INSERT INTO students (name) VALUES ('X'); INSERT INTO enrolments (student_id, course_id, enrolled_on) VALUES (1, 99, '2024-09-01')", 'enrolments.course_id must be a foreign key to courses.', false),
      ],
      xpReward: 85, coinReward: 12,
    },
    {
      id: 'sql-12-normalize-sales', objectiveId: 'sql-obj-normalize', title: 'Untangle the Sales Table', mode: 'challenge', language: 'sql', db: 'flat', skillIds: ['db.design', 'sql.modify'], concepts: ['normalisation', 'INSERT SELECT', 'foreign key', 'DISTINCT'], difficulty: 4, context: 'retail', project: true,
      prompt: text(
        '`sales_flat` repeats each customer’s name and city on every sale. Fix the design **without losing any data**:',
        'Create `customers` with `id` (primary key), `name` and `city`: **one row per customer**.\nCreate `sales` with `id` (primary key), `customer_id` (a foreign key to `customers`), `product`, `qty` and `price`.\nFill both tables from `sales_flat`. Every sale keeps its own `id`, and each customer appears once.',
      ),
      expectedBehavior: 'customers has one row per distinct customer; sales has every original sale, linked to its customer by id.',
      starterCode: '',
      hints: ['Two new tables, then two `INSERT ... SELECT` statements to fill them.', 'Fill `customers` first with each different customer once. Then fill `sales`, looking up each sale’s customer id.', '`SELECT DISTINCT customer_name, customer_city FROM sales_flat` fills customers; joining `sales_flat` to `customers` on the name gives the ids for sales.'],
      checks: [
        { kind: 'sqlSchema', name: 'The new tables are linked', db: 'flat', rules: [
          { rule: 'tableLike', pattern: '^customers$', message: 'a customers table.' },
          { rule: 'tableLike', pattern: '^sales$', message: 'a sales table.' },
          { rule: 'hasPrimaryKeys', message: 'a primary key on every table.' },
          { rule: 'foreignKey', from: '^sales$', to: '^customers$', message: 'sales linked to customers by a foreign key.' },
        ] },
        ...sqlState(
          'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL); CREATE TABLE sales (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), product TEXT NOT NULL, qty INTEGER NOT NULL, price REAL NOT NULL); INSERT INTO customers (name, city) SELECT DISTINCT customer_name, customer_city FROM sales_flat; INSERT INTO sales (id, customer_id, product, qty, price) SELECT f.id, c.id, f.product, f.qty, f.price FROM sales_flat f JOIN customers c ON c.name = f.customer_name',
          ['SELECT COUNT(*) FROM customers', 'SELECT COUNT(*) FROM sales', 'SELECT c.name, c.city, s.product, s.qty, s.price FROM sales s JOIN customers c ON c.id = s.customer_id ORDER BY c.name, s.product, s.qty, s.price'],
          'flat', ['flat-b'], { ordered: true },
        ),
      ],
      xpReward: 130, coinReward: 20,
    },
    {
      id: 'sql-12-factory-design', objectiveId: 'sql-obj-design-requirements', title: 'Design the Factory Database', mode: 'challenge', language: 'sql', db: 'blank', skillIds: ['db.design', 'ps.decomposition'], concepts: ['schema design', 'entities', 'foreign key', 'one-to-many'], difficulty: 3, context: 'manufacturing', project: true,
      prompt: text(
        'A manufacturing company wants to record its **machines**, the **technicians** who work on them, every **maintenance event** (which machine, which technician, when, how long it was down), and every **production run** (which machine, when, how many units).',
        'Design the tables and create them. **Choose your own table and column names.** Every table needs a primary key, related tables must be linked by foreign keys, and you should not repeat facts (for example, do not copy a machine’s name into every event row).',
      ),
      expectedBehavior: 'Tables for machines, technicians, maintenance events and production runs, linked sensibly by foreign keys.',
      starterCode: '',
      hints: ['Underline the nouns in the requirements: they are your tables.', 'An event refers to one machine and one technician; a run refers to one machine. Where do the foreign keys go?', 'Four tables, and each “refers to” becomes a foreign key column on the table that does the referring.'],
      checks: [{
        kind: 'sqlSchema', name: 'The design meets the requirements', db: 'blank', rules: [
          { rule: 'minTables', n: 4, message: 'at least four tables.' },
          { rule: 'hasPrimaryKeys', message: 'a primary key on every table.' },
          { rule: 'tableLike', pattern: 'machine', message: 'a table for machines.' },
          { rule: 'tableLike', pattern: 'technician|engineer|mechanic', message: 'a table for technicians.' },
          { rule: 'tableLike', pattern: 'maint|event|repair|service', message: 'a table for maintenance events.' },
          { rule: 'tableLike', pattern: 'run|production', message: 'a table for production runs.' },
          { rule: 'foreignKey', from: 'maint|event|repair|service', to: 'machine', message: 'maintenance events linked to machines.' },
          { rule: 'foreignKey', from: 'maint|event|repair|service', to: 'technician|engineer|mechanic', message: 'maintenance events linked to technicians.' },
          { rule: 'foreignKey', from: 'run|production', to: 'machine', message: 'production runs linked to machines.' },
          { rule: 'noColumnLike', pattern: '(machine|technician)_?name', message: 'no copies of a machine’s or technician’s name outside their own tables.' },
        ],
      }],
      xpReward: 100, coinReward: 15,
    },
    {
      id: 'sql-12-clinic-design', objectiveId: 'sql-obj-design-requirements', title: 'Design the Clinic Database', mode: 'challenge', language: 'sql', db: 'blank', skillIds: ['db.design', 'ps.decomposition'], concepts: ['schema design', 'entities', 'foreign key', 'one-to-many'], difficulty: 3, context: 'healthcare', project: true,
      prompt: text(
        'A medical clinic needs to record its **patients**, its **doctors**, and every **appointment** (which patient sees which doctor, and when).',
        'Design the tables and create them. **Choose your own table and column names.** Every table needs a primary key, related tables must be linked by foreign keys, and no fact should be repeated (do not copy a patient’s name into every appointment row).',
      ),
      expectedBehavior: 'Tables for patients, doctors and appointments, linked by foreign keys.',
      starterCode: '',
      hints: ['The nouns in the requirements are patients, doctors and appointments.', 'An appointment involves one patient and one doctor.', 'The appointments table holds two foreign key columns, one for each of the other tables.'],
      checks: [{
        kind: 'sqlSchema', name: 'The design meets the requirements', db: 'blank', rules: [
          { rule: 'minTables', n: 3, message: 'at least three tables.' },
          { rule: 'hasPrimaryKeys', message: 'a primary key on every table.' },
          { rule: 'tableLike', pattern: 'patient', message: 'a table for patients.' },
          { rule: 'tableLike', pattern: 'doctor|physician|clinician', message: 'a table for doctors.' },
          { rule: 'tableLike', pattern: 'appointment|visit|consult', message: 'a table for appointments.' },
          { rule: 'foreignKey', from: 'appointment|visit|consult', to: 'patient', message: 'appointments linked to patients.' },
          { rule: 'foreignKey', from: 'appointment|visit|consult', to: 'doctor|physician|clinician', message: 'appointments linked to doctors.' },
          { rule: 'noColumnLike', pattern: '(patient|doctor)_?name', message: 'no copies of a patient’s or doctor’s name outside their own tables.' },
        ],
      }],
      xpReward: 100, coinReward: 15,
    },
  ],
};
