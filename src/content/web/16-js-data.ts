import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { files, jsCalls, wc, webDemo } from './helpers';

const MACHINES = '[{ id: 1, name: "Press", status: "running", hours: 4.5 }, { id: 2, name: "Lathe", status: "down", hours: 12 }, { id: 3, name: "Welder", status: "down", hours: 0 }, { id: 4, name: "Saw", status: "idle", hours: 2 }]';

export const bundle: LessonBundle = {
  lesson: {
    id: 'web-16-js-data', title: 'Arrays, Objects and Higher-Order Functions', language: 'web', skillId: 'js.data',
    blurb: 'Lists of records, object literals, destructuring, and map/filter/reduce/sort.', prerequisites: ['web-15-js-basics'], xpReward: 65,
    reference: {
      title: 'Arrays, objects and array methods',
      body: text(
        'Arrays: `[1, 2, 3]`, `arr.length`, `arr[0]`, `arr.push(x)`. **Objects**: `{ name: "Press", status: "down" }`, read `obj.name` / `obj["name"]`, write `obj.status = "idle"`. **Destructuring**: `const { name, status } = machine;` `const [first, ...rest] = list;`. Spread copies: `{ ...obj, status: "idle" }`, `[...list, x]` (**do not mutate** data you were given).',
        'Higher-order array methods take a function: `arr.filter(x => x > 1)` (keep some), `arr.map(x => x.name)` (transform each), `arr.reduce((sum, x) => sum + x, 0)` (fold to one value), `arr.find(...)`, `arr.some/every(...)`, and `arr.sort((a, b) => a - b)` (**sorts in place**: copy first with `[...arr].sort(...)`; the default sort is alphabetical, even for numbers!). `Object.keys/values/entries(obj)` turn objects into arrays.',
      ),
      example: 'const down = machines.filter((m) => m.status === "down").map((m) => m.name);\nconst total = machines.reduce((sum, m) => sum + m.hours, 0);\nconst byId = Object.fromEntries(machines.map((m) => [m.id, m]));',
    },
    steps: [
      { kind: 'teach', title: 'Data comes as lists of records', body: text('Almost every web page is built from a **list of records**: machines, players, orders. In JavaScript that is an array of objects, often received as JSON from an API. Getting fluent with `filter`, `map`, `reduce` and `sort` means you can answer questions about that data in one readable line each.', 'Two habits matter more than syntax: **do not change the data you were given** (copy, then transform) and **decide the empty case** (what should the answer be when the list is empty?).') },
      webDemo({
        title: 'Questions about a list',
        body: text('Run it, then write your own line: the names of machines that ran less than 3 hours, sorted A to Z.'),
        files: files('', '', `const machines = ${MACHINES};\nconst down = machines.filter((m) => m.status === "down").map((m) => m.name);\nconst total = machines.reduce((sum, m) => sum + m.hours, 0);\nconst byStatus = machines.reduce((acc, m) => { acc[m.status] = (acc[m.status] || 0) + 1; return acc; }, {});\nconsole.log(down, total, byStatus);\n`),
        notice: '`filter` keeps rows, `map` reshapes them, and `reduce` folds a list into one value (here a number, then an object). None of them changed `machines`; `sort` would have.',
      }),
      { kind: 'challenge', challengeId: 'web-16-down-machines' },
      { kind: 'challenge', challengeId: 'web-16-total-revenue' },
      { kind: 'challenge', challengeId: 'web-16-count-by' },
    ],
  },
  objectives: [
    { id: 'js-obj-array-methods', title: 'Answer questions about a list with array methods', summary: 'filter/map/reduce/sort on arrays of records without changing the input.' },
    { id: 'js-obj-object-building', title: 'Build and reshape objects', summary: 'Group, count and index records into objects, with destructuring and spread.' },
  ],
  challenges: [
    wc({
      id: 'web-16-down-machines', title: 'Which Machines Are Down?', mode: 'learning', skillIds: ['js.data'], concepts: ['filter', 'map', 'sort', 'objects'], difficulty: 2, context: 'manufacturing',
      prompt: text('Write `downMachines(machines)`. Each machine is an object like `{ id: 2, name: "Lathe", status: "down", hours: 12 }`. Return an array of the **names** of the machines whose status is `"down"`, sorted A to Z. The list you were given must not be changed.'),
      expectedBehavior: 'downMachines(list) returns ["Lathe", "Welder"] for the example list.',
      guidedSteps: ['`filter` the machines whose status is "down".', '`map` each to its name.', '`sort` the names (on the new array, not the original).'],
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Two questions: which machines, and what to report about them.', 'Chain the methods; each returns a new array.', '`machines.filter(...).map(...).sort()`'],
      checks: jsCalls('downMachines', '(m) => m.filter((x) => x.status === "down").map((x) => x.name).sort()', [`${MACHINES}`, '[]', '[{ name: "Zed", status: "down" }, { name: "Abe", status: "down" }, { name: "Mid", status: "up" }]', '[{ name: "B", status: "idle" }]', '[{ name: "b", status: "down" }, { name: "A", status: "down" }]'], { pure: true, visibleFirst: true }),
      xpReward: 55, coinReward: 8,
    }),
    wc({
      id: 'web-16-total-revenue', objectiveId: 'js-obj-array-methods', title: 'Total Revenue', mode: 'challenge', skillIds: ['js.data'], concepts: ['reduce', 'filter', 'arrays of objects', 'rounding'], difficulty: 3, context: 'retail',
      prompt: text('Write `totalRevenue(orders)`. Each order is `{ id, qty, price, status }`. Return the total of `qty * price` over all orders **except** those with status `"returned"`, rounded to 2 decimal places. An empty list gives 0. Do not change the list.'),
      expectedBehavior: 'totalRevenue([{ qty: 2, price: 3.5, status: "paid" }, { qty: 1, price: 9, status: "returned" }]) returns 7.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['One value comes from many records: a fold.', 'Ignore some records, then add up a calculated value.', '`filter` then `reduce`, and round at the end, not on every step.'],
      checks: jsCalls('totalRevenue', '(o) => Math.round(o.filter((x) => x.status !== "returned").reduce((s, x) => s + x.qty * x.price, 0) * 100) / 100', ['[{ id: 1, qty: 2, price: 3.5, status: "paid" }, { id: 2, qty: 1, price: 9, status: "returned" }]', '[]', '[{ qty: 3, price: 0.1, status: "paid" }]', '[{ qty: 1, price: 19.99, status: "paid" }, { qty: 2, price: 5.25, status: "shipped" }, { qty: 4, price: 2.5, status: "returned" }]', '[{ qty: 1, price: 5, status: "returned" }]', '[{ qty: 7, price: 1.15, status: "paid" }]', '[{ qty: 1, price: 0.1, status: "paid" }, { qty: 1, price: 0.2, status: "paid" }]'], { pure: true, visibleFirst: true }),
      xpReward: 70, coinReward: 10,
    }),
    wc({
      id: 'web-16-top-scorers', objectiveId: 'js-obj-array-methods', title: 'Top Scorers', mode: 'challenge', skillIds: ['js.data'], concepts: ['reduce', 'filter', 'arrays of objects', 'rounding'], difficulty: 3, context: 'sports',
      prompt: text('Write `topScorers(players, n)`. Each player is `{ name, points }`. Return the **names** of the `n` players with the most points, highest first; players with equal points are ordered by name A to Z. If there are fewer than `n` players, return them all. The list you were given must not be changed.'),
      expectedBehavior: 'topScorers([{name:"Ada",points:10},{name:"Bo",points:12}], 1) returns ["Bo"].',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['Sorting changes the array it is called on.', 'Sort a copy, in a way that handles ties, then keep the first few.', '`[...players].sort(...)`, a comparison function returning a number, and `slice(0, n)`.'],
      checks: jsCalls('topScorers', '(p, n) => [...p].sort((a, b) => b.points - a.points || (a.name < b.name ? -1 : 1)).slice(0, n).map((x) => x.name)', ['[{ name: "Ada", points: 10 }, { name: "Bo", points: 12 }, { name: "Cy", points: 7 }], 2', '[], 3', '[{ name: "Zed", points: 5 }, { name: "Amy", points: 5 }, { name: "Bob", points: 5 }], 2', '[{ name: "Solo", points: 1 }], 5', '[{ name: "A", points: 100 }, { name: "B", points: 9 }], 1', '[{ name: "B", points: 9 }, { name: "A", points: 100 }, { name: "C", points: 50 }], 3'], { pure: true, visibleFirst: true }),
      xpReward: 70, coinReward: 10,
    }),
    wc({
      id: 'web-16-avg-by-dept', objectiveId: 'js-obj-array-methods', title: 'Average Pay by Department', mode: 'challenge', skillIds: ['js.data'], concepts: ['reduce', 'filter', 'arrays of objects', 'rounding'], difficulty: 3, context: 'business',
      prompt: text('Write `averageByDepartment(employees)`. Each employee is `{ name, department, rate }`. Return an **object** whose keys are the departments that have at least one employee and whose values are the average `rate` of that department, rounded to 2 decimal places. An empty list gives `{}`. Do not change the list.'),
      expectedBehavior: 'averageByDepartment([{department:"A",rate:10},{department:"A",rate:20}]) returns { A: 15 }.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['You are grouping: collect what belongs to each department.', 'An object can accumulate a total and a count for each key.', 'Build the groups with `reduce` into an object, then convert totals to averages.'],
      checks: jsCalls('averageByDepartment', '(e) => { const g = {}; for (const x of e) { (g[x.department] ||= []).push(x.rate); } const out = {}; for (const k of Object.keys(g)) out[k] = Math.round(g[k].reduce((a, b) => a + b, 0) / g[k].length * 100) / 100; return out; }', ['[{ name: "a", department: "Assembly", rate: 20 }, { name: "b", department: "Assembly", rate: 25 }, { name: "c", department: "Packing", rate: 18.5 }]', '[]', '[{ name: "a", department: "X", rate: 10 }, { name: "b", department: "X", rate: 10.01 }, { name: "c", department: "X", rate: 10.02 }]', '[{ name: "solo", department: "Solo", rate: 33.333 }]', '[{ name: "a", department: "B", rate: 1 }, { name: "b", department: "A", rate: 3 }, { name: "c", department: "B", rate: 2 }]', '[{ name: "a", department: "Assembly", rate: 0.1 }, { name: "b", department: "Assembly", rate: 0.2 }]'], { pure: true, visibleFirst: true }),
      xpReward: 70, coinReward: 10,
    }),
    wc({
      id: 'web-16-count-by', objectiveId: 'js-obj-object-building', title: 'Count By Property', mode: 'challenge', skillIds: ['js.data'], concepts: ['objects', 'reduce', 'dynamic keys', 'destructuring'], difficulty: 3, context: 'data analysis',
      prompt: text('Write `countBy(items, key)`. Return an object counting how many items have each value of the property named `key`, for example `countBy([{s:"a"},{s:"b"},{s:"a"}], "s")` is `{ a: 2, b: 1 }`. An item missing that property is counted under the key `"unknown"`. An empty list gives `{}`.'),
      expectedBehavior: 'countBy([{status:"down"},{status:"idle"},{status:"down"}], "status") returns { down: 2, idle: 1 }.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['One tally per distinct value.', 'The property to read is given by name, so square brackets are needed.', '`item[key]`, and `counts[value] = (counts[value] || 0) + 1`.'],
      checks: jsCalls('countBy', '(items, key) => { const out = {}; for (const it of items) { const v = it[key] === undefined ? "unknown" : it[key]; out[v] = (out[v] || 0) + 1; } return out; }', ['[{ s: "a" }, { s: "b" }, { s: "a" }], "s"', '[], "x"', '[{ s: "a" }, { t: 1 }, { s: "a" }, {}], "s"', '[{ team: "Owls" }, { team: "Owls" }, { team: "Cats" }], "team"', '[{ n: 1 }, { n: 2 }, { n: 1 }, { n: 1 }], "n"'], { pure: true, visibleFirst: true }),
      xpReward: 70, coinReward: 10,
    }),
    wc({
      id: 'web-16-index-by', objectiveId: 'js-obj-object-building', title: 'Index By Id', mode: 'challenge', skillIds: ['js.data'], concepts: ['objects', 'reduce', 'dynamic keys', 'destructuring'], difficulty: 3, context: 'retail',
      prompt: text('Write `indexBy(products, key)`. Return an object mapping each product’s value of the property named `key` to a **copy** of the product with an added property `indexed: true`. If two products share a key value, the **later one wins**. Do not change the products you were given.'),
      expectedBehavior: 'indexBy([{id:1,name:"Bolt"}], "id") returns { 1: { id: 1, name: "Bolt", indexed: true } }.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['You are turning a list into a lookup table.', 'Copy each record instead of editing it.', 'Object spread `{ ...product, indexed: true }`, assigned under `product[key]`.'],
      checks: jsCalls('indexBy', '(p, key) => { const out = {}; for (const x of p) out[x[key]] = { ...x, indexed: true }; return out; }', ['[{ id: 1, name: "Bolt" }, { id: 2, name: "Nut" }], "id"', '[], "id"', '[{ sku: "a", n: 1 }, { sku: "a", n: 2 }], "sku"', '[{ id: 3, name: "Gear", price: 4.5 }], "name"', '[{ id: 1 }, { id: 2 }, { id: 3 }], "id"', '[{ code: "x", v: [1, 2] }, { code: "y", v: [] }], "code"', '[{ id: 10, name: "A" }, { id: 2, name: "B" }], "id"'], { pure: true, visibleFirst: true }),
      xpReward: 70, coinReward: 10,
    }),
    wc({
      id: 'web-16-summarise-laps', objectiveId: 'js-obj-object-building', title: 'Summarise the Laps', mode: 'challenge', skillIds: ['js.data'], concepts: ['objects', 'reduce', 'dynamic keys', 'destructuring'], difficulty: 3, context: 'motorsport',
      prompt: text('Write `summarise(entry)`. An entry is `{ driver, laps }` where `laps` is an array of lap times in seconds. Return an object `{ driver, best, average, count }`: the fastest lap, the average rounded to 2 decimal places, and the number of laps. If there are no laps, `best` and `average` are `null` and `count` is 0. Do not change the entry.'),
      expectedBehavior: 'summarise({driver:"Ada",laps:[80,82]}) returns { driver:"Ada", best:80, average:81, count:2 }.',
      starterFiles: files('', '', ''), tabs: ['js'],
      hints: ['You need a few facts about one list.', 'Take the entry apart into its two parts first.', '`const { driver, laps } = entry;`, `Math.min(...laps)`, and handle the empty list.'],
      checks: jsCalls('summarise', '({ driver, laps }) => laps.length === 0 ? { driver, best: null, average: null, count: 0 } : { driver, best: Math.min(...laps), average: Math.round(laps.reduce((a, b) => a + b, 0) / laps.length * 100) / 100, count: laps.length }', ['{ driver: "Ada", laps: [80, 82] }', '{ driver: "Bo", laps: [] }', '{ driver: "Cy", laps: [90.5] }', '{ driver: "Di", laps: [81.234, 80.111, 85] }', '{ driver: "Ed", laps: [100, 99, 101, 98.5] }'], { pure: true, visibleFirst: true }),
      xpReward: 70, coinReward: 10,
    }),
  ],
};
