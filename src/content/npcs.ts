/**
 * Characters who teach and give the Phase 2 story a purpose. Dialogue is data: `lines` are shown in order of
 * relevance (the first whose `after` lesson is complete and whose `until` lesson is not), so advice follows
 * the player's actual progress. NPCs never hand out answers.
 */
export interface NpcLine {
  /** Show only once this lesson is complete. */
  after?: string;
  /** Stop showing once this lesson is complete. */
  until?: string;
  text: string;
}

export interface Npc {
  id: string;
  name: string;
  role: string;
  icon: string;
  areaId: string;
  lines: NpcLine[];
}

export const npcs: Npc[] = [
  {
    id: 'vex', name: 'Architect Vex', role: 'Database architect', icon: '📐', areaId: 'data-center',
    lines: [
      { until: 'sql-06-joins', text: 'A database is not one big table. It is many small tables that point at each other. Ask it a question with SELECT, and describe only the rows you want. You do not tell it HOW to find them.' },
      { after: 'sql-06-joins', until: 'sql-12-design', text: 'Joins are why the tables are separate: each fact lives in one place. Before you write a query, say out loud which tables hold the pieces, and how they connect.' },
      { after: 'sql-12-design', until: 'sql-18-debugging-queries', text: 'Design is where you decide what the database will REFUSE. Keys, constraints and clean tables are cheaper than any clever query later.' },
      { after: 'sql-18-debugging-queries', text: 'The dangerous query is the one that runs and lies. Shrink the problem to one customer, look at the joined rows before you add them up, and never trust a number you have not checked by hand.' },
    ],
  },
  {
    id: 'ori', name: 'Engineer Ori', role: 'Data engineer', icon: '🛠️', areaId: 'pipeline-works',
    lines: [
      { until: 'de-01-pipelines', text: 'Data never arrives clean, and it arrives again tomorrow. A pipeline is judged on its worst night: bad rows, repeated files, half-finished runs.' },
      { after: 'de-01-pipelines', until: 'de-02-python-sql', text: 'Good. Now the trick is dividing the work: let SQL fetch and aggregate close to the data; let Python do what SQL is awkward at.' },
      { after: 'de-02-python-sql', until: 'de-06-logging', text: 'Trust nothing that arrives from outside. Check every field, report every problem at once, and measure how dirty a file is before you decide what to do about it.' },
      { after: 'de-06-logging', until: 'de-09-reporting', text: 'A job nobody can see into cannot be trusted. Log the decisions, set aside the bad rows instead of losing them, remember how far you got, and only load what is new.' },
      { after: 'de-09-reporting', text: 'The trial gives you no scaffolding, like a real ticket. Read the requirement twice, list the ways the input can be wrong, and test those cases yourself first. When you are ready for the Foreman, the Summit is waiting.' },
    ],
  },
  {
    id: 'sana', name: 'Analyst Sana', role: 'Systems analyst', icon: '🔎', areaId: 'pipeline-works',
    lines: [
      { text: 'Stuck on something new? Do not guess and do not wait to be told. Say what the problem is, break it up, list what you know and do not know, look it up in the Field Manual, try a small experiment, read the result, revise, and finally verify. That is the whole method.' },
    ],
  },
  {
    id: 'nia', name: 'Builder Nia', role: 'Front-end builder', icon: '🧱', areaId: 'web-district',
    lines: [
      { until: 'web-05-forms', text: 'HTML is about meaning, not looks. A heading is a heading because it heads something, not because it is big. Get the meaning right and the page works for everyone: screen readers, search engines, phones.' },
      { after: 'web-05-forms', until: 'web-11-grid', text: 'When a style does not apply, do not add more styles. Open the inspector, find the rule that won, and ask why. Specificity and source order settle every argument.' },
      { after: 'web-11-grid', text: 'Test your layout at a narrow width and a wide one before you call it finished. If the page scrolls sideways on a phone, it is not finished.' },
    ],
  },
  {
    id: 'kiran', name: 'Coder Kiran', role: 'JavaScript developer', icon: '⚡', areaId: 'web-district',
    lines: [
      { until: 'web-18-dom', text: 'JavaScript runs top to bottom, one thing at a time, until you hand it something to do later. Read the console: the error message names the line.' },
      { after: 'web-18-dom', until: 'web-22-async', text: 'Keep the truth in a variable and draw the page from it. If you catch yourself reading data back out of the page, stop and rethink.' },
      { after: 'web-22-async', text: 'Anything that finishes later can also fail. Say, out loud, what the page shows while waiting, when it works, and when it does not.' },
    ],
  },
  {
    id: 'marlo', name: 'Gatekeeper Marlo', role: 'API gatekeeper', icon: '🚪', areaId: 'web-district',
    lines: [
      { until: 'web-23-fetch', text: 'The gate speaks HTTP: a method, an address, sometimes a body; and it answers with a status you must read. A 404 is not an exception. It is an answer.' },
      { after: 'web-23-fetch', until: 'web-25-web-projects', text: 'Never trust the client and never trust the server. Check the status, check the shape, and decide what the page does when the answer is not the one you hoped for.' },
      { after: 'web-25-web-projects', text: 'The trial gives you a brief and a Field Manual, like a real ticket. Read the manual for the parts you have not used. Then test the ugly cases first.' },
    ],
  },
  {
    id: 'mira', name: 'Archivist Mira', role: 'Keeper of the Version Vault', icon: '🗝️', areaId: 'version-vault',
    lines: [
      { until: 'git-02-history', text: 'A commit is a promise you can keep: a snapshot with a message, so future you can ask what changed and why. Commit small, and say what you did.' },
      { after: 'git-02-history', until: 'git-04-merging', text: 'Branches are cheap. Try an idea on one and throw it away if it fails; main stays safe. Always ask where HEAD is before you change anything.' },
      { after: 'git-04-merging', until: 'git-06-workflow', text: 'A conflict is not an accident, it is two people disagreeing in writing. Read both sides, decide what the file should say, and remove every marker.' },
      { after: 'git-06-workflow', text: 'Professional Git is boring on purpose: small branches, clear messages, review before merge, and never rewriting what others have seen.' },
    ],
  },
  {
    id: 'brass', name: 'Keeper Brass', role: 'Master of the Spreadsheet Guild', icon: '📊', areaId: 'spreadsheet-guild',
    lines: [
      { until: 'xl-03-logic', text: 'A spreadsheet is a program in disguise. Every formula is a function, every cell reference an argument. Put inputs in labelled cells and never type a number into a formula if it could change.' },
      { after: 'xl-03-logic', until: 'xl-07-pivots', text: 'Look things up instead of copying them. Count and add by condition instead of filtering by hand. Clean the data before you trust a total.' },
      { after: 'xl-07-pivots', text: 'A model is judged by what happens when you change an input. Change it on purpose: zero, huge, negative. If something breaks, a number was typed where a reference belonged.' },
    ],
  },
  {
    id: 'quill', name: 'Professor Quill', role: 'R laboratory lead', icon: '🔬', areaId: 'r-lab',
    lines: [
      { until: 'r-03-functions', text: 'In R almost everything is a vector, and operations apply to all of it at once. If you are writing a loop to add one to every element, there is a shorter way.' },
      { after: 'r-03-functions', until: 'r-05-manipulation', text: 'Data frames are tables whose columns are vectors. Filter rows with a condition, and remember the comma: rows first, then columns.' },
      { after: 'r-05-manipulation', text: 'Analysis is split, apply, combine. Then report what you found and how sure you are. Print the numbers the way the reader needs them.' },
    ],
  },
  {
    id: 'nightingale', name: 'Professor Nightingale', role: 'Statistician', icon: '🔭', areaId: 'observatory',
    lines: [
      { until: 'st-03-distributions', text: 'A single number hides the shape of the data. Before you summarise, ask how the values are spread, and whether one extreme value is pulling the average.' },
      { after: 'st-03-distributions', until: 'st-06-sampling', text: 'A chart is a claim. Start the bars at zero, label the units, and never let the design say more than the data does.' },
      { after: 'st-06-sampling', until: 'st-08-inference', text: 'You almost never see the whole population. How you chose the sample matters more than how big it is, and every sample result has an error bar.' },
      { after: 'st-08-inference', text: 'No clear difference is a finding, not a failure. Report the uncertainty with the result, and ask whether a difference that is real is also big enough to matter.' },
    ],
  },
  {
    id: 'pell', name: 'Dr. Pell', role: 'Debugging specialist', icon: '🩺', areaId: 'training-grounds',
    lines: [
      { after: 'py-18-function-design', until: 'py-19-debugging', text: 'Bugs are not personal. Reproduce it, shrink it, form ONE hypothesis, test it. Change one thing at a time.' },
      { after: 'py-19-debugging', text: 'When a program fails, read the last line of the traceback first, then the line it points to. Then question your assumptions about the data, not just the code.' },
    ],
  },
];

export const npcsIn = (areaId: string): Npc[] => npcs.filter((n) => n.areaId === areaId);

export function npcLine(npc: Npc, completed: (lessonId: string) => boolean): string {
  const line = npc.lines.find((l) => (!l.after || completed(l.after)) && (!l.until || !completed(l.until)));
  return (line ?? npc.lines[npc.lines.length - 1]!).text;
}
