import { text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const out = (name: string, expect: string, files?: Record<string, string>, visible = true): Check => ({ kind: 'output', name, expect, files, visible });
const file = (name: string, path: string, expect: string, opts: { json?: boolean; files?: Record<string, string>; visible?: boolean } = {}): Check => ({ kind: 'file', name, path, expect, ...opts });

export const bundle: LessonBundle = {
  lesson: {
    id: 'py-20-files', title: 'Files, CSV and JSON', language: 'python', skillId: 'de.files',
    blurb: 'Reading and writing text files, CSV tables, and JSON documents.', prerequisites: ['py-19-debugging'], xpReward: 50,
    reference: {
      title: 'Files, csv and json',
      body: text(
        '`with open("data.txt") as f:` opens a file and closes it for you. `f.read()` gives the whole text, `f.read().splitlines()` a list of lines, and `for line in f:` visits lines (each ends with `"\\n"`: use `.strip()`). `open("out.txt", "w")` writes (replacing the file); `"a"` appends; `out.write("text\\n")`.',
        '**CSV**: `import csv`; `csv.DictReader(f)` yields one dict per row using the header names; `csv.writer(f).writerow([...])` writes a row. Open CSV files with `newline=""`. The module handles quotes and commas inside values, so never `split(",")` a CSV yourself.',
        '**JSON**: `import json`; `json.load(f)` reads a file into Python lists/dicts; `json.dump(data, f)` writes one; `json.loads(text)` / `json.dumps(data)` work on strings. Everything you read from a file is TEXT until you convert it (`float(row["amount"])`).',
      ),
      example: 'import csv\nwith open("orders.csv", newline="") as f:\n    rows = list(csv.DictReader(f))\ntotal = sum(float(r["amount"]) for r in rows)',
    },
    steps: [
      {
        kind: 'teach', title: 'Data lives in files',
        body: text(
          'Until now every value came from the program itself or from `input()`. Real programs mostly work on **files**: a spreadsheet exported as CSV, a settings file, a JSON download from a service. Reading and writing files is how data gets in and out of your programs.',
          'In CodeQuest each challenge runs in its own little workspace. The files it mentions are there when your program starts, and whatever you write is checked afterwards, then cleaned up. Everything behaves exactly like files on a real computer.',
        ),
      },
      {
        kind: 'demo', title: 'Reading and writing text',
        body: text('The workspace contains `notes.txt`. Run the program, then look at how the pieces fit.'),
        fixtures: { files: { 'notes.txt': 'first line\nsecond line\nthird line\n' } },
        code: 'with open("notes.txt") as f:\n    text = f.read()\nprint(repr(text))\nlines = text.splitlines()\nprint(lines)\nwith open("copy.txt", "w") as out:\n    for line in lines:\n        out.write(line.upper() + "\\n")\nprint(open("copy.txt").read())',
        notice: '`repr` shows the hidden `\\n` characters that end each line. `splitlines()` removed them. Writing with `"w"` created `copy.txt`, which the next `open` could read back.',
      },
      {
        kind: 'demo', title: 'CSV: rows of named fields',
        body: text('`sensors.csv` has a header row and two data rows. Notice that everything read from a CSV is text.'),
        fixtures: { files: { 'sensors.csv': 'machine,reading\nM1,5.5\n"Press, large",7.25\n' } },
        code: 'import csv\nwith open("sensors.csv", newline="") as f:\n    rows = list(csv.DictReader(f))\nprint(rows[1])\nprint(type(rows[0]["reading"]))\ntotal = sum(float(r["reading"]) for r in rows)\nprint(total)',
        notice: 'Each row became a dictionary keyed by the header. The comma inside `"Press, large"` did not split the name, because the csv module understands quotes. The reading was a `str` until we converted it with `float`.',
      },
      {
        kind: 'demo', title: 'JSON: nested data',
        body: text('JSON is the everyday format for data exchanged between programs and web services. It maps directly onto lists, dictionaries, numbers, strings, `True`/`False` and `None`.'),
        fixtures: { files: { 'plant.json': '{"name": "Bytehaven Works", "machines": [{"id": "M1", "hours": 12.5}, {"id": "M2", "hours": 8}]}' } },
        code: 'import json\nwith open("plant.json") as f:\n    plant = json.load(f)\nprint(plant["name"])\nprint(sum(m["hours"] for m in plant["machines"]))\nplant["machines"].append({"id": "M3", "hours": 0})\nprint(json.dumps(plant["machines"][-1]))',
        notice: 'After `json.load` the document is ordinary Python: dictionaries and lists you already know how to use. `json.dumps` turned a dictionary back into text.',
      },
      { kind: 'challenge', challengeId: 'py-20-sum-file' },
      { kind: 'challenge', challengeId: 'py-20-orders-csv' },
      { kind: 'challenge', challengeId: 'py-20-low-stock' },
      { kind: 'challenge', challengeId: 'py-20-cost-report' },
    ],
  },
  objectives: [
    { id: 'py-obj-csv-read', title: 'Read a CSV file and summarise it', summary: 'Parse a CSV with the csv module, convert text fields to numbers, and report totals.' },
    { id: 'py-obj-json-read-write', title: 'Read JSON, filter it, write JSON', summary: 'Load a JSON document, select items, and write the result as JSON.' },
    { id: 'py-obj-csv-write', title: 'Build a CSV report', summary: 'Read one CSV and write another with a new column or grouping, in a required order.' },
  ],
  challenges: [
    {
      id: 'py-20-sum-file', title: 'Total from a File', mode: 'learning', language: 'python', skillIds: ['de.files', 'py.loops', 'py.numbers'], concepts: ['open', 'read lines', 'float', 'blank lines'], difficulty: 2, context: 'science',
      prompt: text('The file `readings.txt` holds one number per line (some may have decimals). Read the file, add the numbers up, and print `Total: ` followed by the total.', 'A stray blank line should not crash your program.'),
      expectedBehavior: 'For the lines 10, 20.5 and 5 the program prints `Total: 35.5`.',
      guidedSteps: ['Open the file with `with open("readings.txt") as f:`.', 'Loop over the lines; `.strip()` each one.', 'Skip lines that are empty, then add `float(line)` to a running total.', 'Print the total.'],
      fixtures: { files: { 'readings.txt': '10\n20.5\n5\n' } },
      starterCode: '# Read readings.txt and print the total\n',
      hints: ['Files can be looped over line by line.', 'Each line still ends with a newline character, and a blank line converts to nothing.', '`line = line.strip()`, then `if line:` before `total += float(line)`.'],
      checks: [out('The example file', 'Total: 35.5'), out('Short decimals', 'Total: 0.75', { 'readings.txt': '0.5\n0.25\n' }, false), out('Blank lines in the file', 'Total: 6.5', { 'readings.txt': '4.5\n\n2\n\n' }, false)],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'py-20-orders-csv', objectiveId: 'py-obj-csv-read', title: 'Order Totals', mode: 'challenge', language: 'python', skillIds: ['de.files', 'py.dicts', 'py.numbers'], concepts: ['csv', 'DictReader', 'float', 'header row'], difficulty: 2, context: 'business',
      prompt: text('`orders.csv` has the header `id,customer,amount`. Print how many orders it contains and their total, exactly like this:', '`Rows: 3`\n`Total: 49.75`', 'The total is shown with two decimals. Customer names can contain commas (in quotes).'),
      expectedBehavior: 'One line with the number of data rows, one with the total amount to two decimals.',
      fixtures: { files: { 'orders.csv': 'id,customer,amount\n1,Ada,12.50\n2,Bo,7.25\n3,"Smith, Jo",30.00\n' } },
      starterCode: '',
      hints: ['A CSV needs a real CSV reader, not `split`, because values can contain commas.', 'Converting every row to a dictionary lets you refer to fields by name; the header row is used up automatically.', '`csv.DictReader(f)`, then `float(row["amount"])`, and format the total with `f"{total:.2f}"`.'],
      checks: [
        out('The example file', 'Rows: 3\nTotal: 49.75'),
        out('Quoted names with commas', 'Rows: 2\nTotal: 15.00', { 'orders.csv': 'id,customer,amount\n1,"Lee, Amy",5.5\n2,"Cho, Ben, Jr.",9.5\n' }, false),
        out('Only a header', 'Rows: 0\nTotal: 0.00', { 'orders.csv': 'id,customer,amount\n' }, false),
      ],
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'py-20-machine-hours', objectiveId: 'py-obj-csv-read', title: 'Running Machines', mode: 'challenge', language: 'python', skillIds: ['de.files', 'py.dicts', 'py.numbers'], concepts: ['csv', 'DictReader', 'float', 'header row'], difficulty: 2, context: 'manufacturing',
      prompt: text('`machines.csv` has the header `machine,hours,status`. Count the machines whose status is `running` and add up THEIR hours. Print:', '`Running: 2`\n`Hours: 32.5`', 'Show the hours with one decimal place. Machine names may contain commas (in quotes). Only rows with the status `running` count.'),
      expectedBehavior: 'The count of running machines and the sum of their hours.',
      fixtures: { files: { 'machines.csv': 'machine,hours,status\nPress 1,12.5,running\n"Lathe, big",8,stopped\nWelder,20,running\n' } },
      starterCode: '',
      hints: ['Read the file with the csv module so quoted commas are safe.', 'Only some rows should be counted. Decide with an `if` on the status field.', 'Keep a count and a running total of `float(row["hours"])`, both updated only when `row["status"] == "running"`.'],
      checks: [
        out('The example file', 'Running: 2\nHours: 32.5'),
        out('A different file', 'Running: 1\nHours: 3.0', { 'machines.csv': 'machine,hours,status\n"Saw, twin",3,running\nDrill,9.5,stopped\nMill,1,stopped\n' }, false),
        out('Nothing running', 'Running: 0\nHours: 0.0', { 'machines.csv': 'machine,hours,status\nA,5,stopped\n' }, false),
      ],
      xpReward: 55, coinReward: 8,
    },
    {
      id: 'py-20-low-stock', objectiveId: 'py-obj-json-read-write', title: 'Low Stock Report', mode: 'challenge', language: 'python', skillIds: ['de.files', 'py.records', 'py.lists'], concepts: ['json', 'load', 'dump', 'filter'], difficulty: 3, context: 'logistics',
      prompt: text('`inventory.json` holds a list of items like `{"item": "gear", "qty": 3, "price": 12.0}`. Write a new file `low_stock.json` containing a JSON **list of the item names** whose `qty` is **below 5**, in their original order. Then print how many there were:', '`Low: 2`'),
      expectedBehavior: 'low_stock.json holds e.g. ["gear", "nut"] and the program prints Low: 2.',
      fixtures: { files: { 'inventory.json': '[{"item": "bolt", "qty": 40, "price": 0.5}, {"item": "gear", "qty": 3, "price": 12.0}, {"item": "nut", "qty": 4, "price": 0.1}, {"item": "cog", "qty": 5, "price": 2.0}]' } },
      starterCode: '',
      hints: ['You need to read JSON, choose some items, and write JSON.', '`json.load` gives you a list of dictionaries you already know how to filter.', '`json.dump(names, f)` writes the list. Do not forget to open the output file with `"w"`.'],
      checks: [
        file('low_stock.json for the example', 'low_stock.json', '["gear", "nut"]', { json: true }),
        out('The count is printed', 'Low: 2'),
        file('Nothing is low', 'low_stock.json', '[]', { json: true, files: { 'inventory.json': '[{"item": "a", "qty": 9, "price": 1}]' }, visible: false }),
        file('Everything is low', 'low_stock.json', '["x", "y"]', { json: true, files: { 'inventory.json': '[{"item": "x", "qty": 0, "price": 1}, {"item": "y", "qty": 4, "price": 2}]' }, visible: false }),
      ],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-20-senior-staff', objectiveId: 'py-obj-json-read-write', title: 'Senior Staff', mode: 'challenge', language: 'python', skillIds: ['de.files', 'py.records', 'py.lists'], concepts: ['json', 'load', 'dump', 'filter'], difficulty: 3, context: 'human resources',
      prompt: text('`staff.json` is a JSON **object** with a `"company"` name and a list `"employees"` of items like `{"name": "Ada", "years": 5}`. Write `senior.json` containing a JSON list of the names of employees with **5 or more years**, sorted alphabetically. Then print how many there were:', '`Senior: 2`'),
      expectedBehavior: 'senior.json holds e.g. ["Ada", "Zed"] and the program prints Senior: 2.',
      fixtures: { files: { 'staff.json': '{"company": "Bytehaven", "employees": [{"name": "Zed", "years": 7}, {"name": "Ada", "years": 5}, {"name": "Bo", "years": 2}]}' } },
      starterCode: '',
      hints: ['The list you need is inside the object: read it by its key.', 'Filter first, then put the names in order.', '`sorted([e["name"] for e in data["employees"] if e["years"] >= 5])`, then `json.dump`.'],
      checks: [
        file('senior.json for the example', 'senior.json', '["Ada", "Zed"]', { json: true }),
        out('The count is printed', 'Senior: 2'),
        file('A different company', 'senior.json', '["Cy", "Mo"]', { json: true, files: { 'staff.json': '{"company": "X", "employees": [{"name": "Mo", "years": 10}, {"name": "Cy", "years": 5}, {"name": "Di", "years": 4.9}]}' }, visible: false }),
        file('No senior staff', 'senior.json', '[]', { json: true, files: { 'staff.json': '{"company": "Y", "employees": []}' }, visible: false }),
      ],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-20-cost-report', objectiveId: 'py-obj-csv-write', title: 'Cost Report', mode: 'challenge', language: 'python', skillIds: ['de.files', 'py.records', 'py.dicts'], concepts: ['csv', 'writer', 'sorting', 'formatting'], difficulty: 3, context: 'finance',
      prompt: text('`items.csv` has the header `name,qty,unit_price`. Write `report.csv` with the header `name,total`, one row per item, where `total` is `qty * unit_price` shown with **two decimals**. Order the rows by total, **largest first** (rows with equal totals keep their original order).'),
      expectedBehavior: 'report.csv starts with name,total then the rows from the biggest total to the smallest.',
      fixtures: { files: { 'items.csv': 'name,qty,unit_price\nbolt,100,0.25\ngear,3,12.5\nnut,50,0.1\n' } },
      starterCode: '',
      hints: ['Break it into stages: read, calculate, order, write.', 'Compute each total first and keep the rows in a list so they can be sorted.', '`sorted(rows, key=..., reverse=True)` is stable, so ties keep their order. Write with `csv.writer`.'],
      checks: [
        file('report.csv for the example', 'report.csv', 'name,total\ngear,37.50\nbolt,25.00\nnut,5.00'),
        file('Ties keep their order', 'report.csv', 'name,total\nb,10.00\na,10.00\nc,1.00', { files: { 'items.csv': 'name,qty,unit_price\nc,1,1\nb,2,5\na,10,1\n' }, visible: false }),
        file('Only a header', 'report.csv', 'name,total', { files: { 'items.csv': 'name,qty,unit_price\n' }, visible: false }),
      ],
      xpReward: 65, coinReward: 10,
    },
    {
      id: 'py-20-hours-report', objectiveId: 'py-obj-csv-write', title: 'Hours per Worker', mode: 'challenge', language: 'python', skillIds: ['de.files', 'py.records', 'py.dicts'], concepts: ['csv', 'writer', 'sorting', 'formatting'], difficulty: 3, context: 'manufacturing',
      prompt: text('`shifts.csv` has the header `worker,day,hours`, one row per shift. Write `totals.csv` with the header `worker,hours` and **one row per worker** giving that worker’s total hours with **two decimals**. Sort the rows by worker name, A to Z.'),
      expectedBehavior: 'totals.csv holds one row per worker, alphabetically, with their total hours.',
      fixtures: { files: { 'shifts.csv': 'worker,day,hours\nBo,Mon,6.5\nAda,Mon,8\nAda,Tue,7.5\n' } },
      starterCode: '',
      hints: ['Several rows belong to the same worker, so you need to combine them.', 'A dictionary of running totals is the natural tool; sort by its keys at the end.', 'Total with `.get(name, 0) + float(hours)`, then `for name in sorted(totals):` write each row.'],
      checks: [
        file('totals.csv for the example', 'totals.csv', 'worker,hours\nAda,15.50\nBo,6.50'),
        file('A different file', 'totals.csv', 'worker,hours\nCy,4.00\nMo,3.25\nZed,0.50', { files: { 'shifts.csv': 'worker,day,hours\nZed,Mon,0.5\nMo,Tue,3.25\nCy,Wed,1\nCy,Thu,3\n' }, visible: false }),
        file('Only a header', 'totals.csv', 'worker,hours', { files: { 'shifts.csv': 'worker,day,hours\n' }, visible: false }),
      ],
      xpReward: 65, coinReward: 10,
    },
  ],
};
