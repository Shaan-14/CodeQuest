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
      { after: 'sql-12-design', text: 'Design is where you decide what the database will REFUSE. Keys, constraints and clean tables are cheaper than any clever query later.' },
    ],
  },
  {
    id: 'ori', name: 'Engineer Ori', role: 'Data engineer', icon: '🛠️', areaId: 'pipeline-works',
    lines: [
      { until: 'de-01-pipelines', text: 'Data never arrives clean, and it arrives again tomorrow. A pipeline is judged on its worst night: bad rows, repeated files, half-finished runs.' },
      { after: 'de-01-pipelines', until: 'de-02-python-sql', text: 'Good. Now the trick is dividing the work: let SQL fetch and aggregate close to the data; let Python do what SQL is awkward at.' },
      { after: 'de-02-python-sql', text: 'The trial gives you no scaffolding, like a real ticket. Read the requirement twice, list the ways the input can be wrong, and test those cases yourself first.' },
    ],
  },
  {
    id: 'sana', name: 'Analyst Sana', role: 'Systems analyst', icon: '🔎', areaId: 'pipeline-works',
    lines: [
      { text: 'Stuck on something new? Do not guess and do not wait to be told. Say what the problem is, break it up, list what you know and do not know, look it up in the Field Manual, try a small experiment, read the result, revise, and finally verify. That is the whole method.' },
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
