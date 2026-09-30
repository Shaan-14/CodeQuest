import { text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const script = (name: string, code: string, fixtures?: { databases: string[] }, visible = true): Check => ({ kind: 'script', name, code, ...fixtures, visible });

/**
 * INDEPENDENT MODE (data engineering). Problems only: no hints, no starter, no named tools. Combines
 * cleaning, validation, loading, repeatability and Python + SQL analysis.
 */
export const bundle: LessonBundle = {
  lesson: {
    id: 'de-03-independent', title: 'Trial: The Overnight Feed', language: 'python', skillId: 'de.pipelines',
    blurb: 'Two open problems that combine cleaning, databases and analysis. No hints.', prerequisites: ['de-02-python-sql'], xpReward: 0,
    reference: { title: 'Independent trials', body: 'An independent trial gives you a problem and nothing else. Use your notes and the Field Manual, and test with Run as often as you like. Hidden checks use different data from the examples.' },
    steps: [
      { kind: 'challenge', challengeId: 'de-03-nightly-downtime' },
      { kind: 'challenge', challengeId: 'de-03-abnormal-downtime' },
    ],
  },
  challenges: [
    {
      id: 'de-03-nightly-downtime', title: 'The Nightly Downtime Feed', mode: 'independent', language: 'python', skillIds: ['de.pipelines', 'de.cleaning', 'db.integrity'], concepts: [], difficulty: 4, transfer: true, context: 'operations', project: true,
      prompt: text(
        'Each night the plant sends `feed.csv` with the header `id,machine,downtime`. Write `nightly(csv_path, db_path)` that stores the good rows in a database table called `downtime` (columns `id`, `machine`, `downtime`).',
        'A row is bad if its id is not a whole number, its machine name is blank, or its downtime is not a number of at least zero. Bad rows must never be stored and must never stop the run. Return how many rows were rejected.',
        'The job runs every night, on the same and on updated files. Running it again must never leave duplicates, and newer values must win.',
      ),
      starterCode: '', hints: [],
      checks: [
        script('Loads the good rows and counts the rejects', "import sqlite3\nopen('f.csv','w').write('id,machine,downtime\\n1,Press,2.5\\n2,,1\\nx,Lathe,3\\n4,Saw,-1\\n5,Saw,n/a\\n6,Weld,0\\n')\nr = nightly('f.csv','t.db')\nassert r == 4, 'Expected 4 rejected rows, got %r.' % (r,)\nrows = sqlite3.connect('t.db').execute('select id, machine, downtime from downtime order by id').fetchall()\nassert rows == [(1,'Press',2.5),(6,'Weld',0.0)], 'Wrong rows stored: %r' % (rows,)"),
        script('Running again and with updates keeps one row per id', "import sqlite3\nopen('f.csv','w').write('id,machine,downtime\\n1,Press,2.5\\n2,Saw,1\\n')\nnightly('f.csv','t.db'); nightly('f.csv','t.db')\nopen('g.csv','w').write('id,machine,downtime\\n2,Saw,7.5\\n3,Weld,4\\n')\nnightly('g.csv','t.db')\nrows = sqlite3.connect('t.db').execute('select id, downtime from downtime order by id').fetchall()\nassert rows == [(1,2.5),(2,7.5),(3,4.0)], 'Got %r.' % (rows,)", undefined, false),
        script('Surrounding spaces and a header-only file', "import sqlite3\nopen('f.csv','w').write('id,machine,downtime\\n 7 , Press ,1.5\\n')\nr = nightly('f.csv','t.db')\nrows = sqlite3.connect('t.db').execute('select id, machine, downtime from downtime').fetchall()\nassert r == 0 and rows == [(7,'Press',1.5)], 'Spaces around fields should be ignored. Got %r and %r.' % (r, rows)\nopen('e.csv','w').write('id,machine,downtime\\n')\nassert nightly('e.csv','t2.db') == 0\nassert sqlite3.connect('t2.db').execute('select count(*) from downtime').fetchone()[0] == 0", undefined, false),
        script('Special number values are not valid downtimes', "import sqlite3\nopen('f.csv','w').write('id,machine,downtime\\n1,A,nan\\n2,B,inf\\n3,C,2\\n')\nr = nightly('f.csv','t.db')\nrows = sqlite3.connect('t.db').execute('select id from downtime').fetchall()\nassert r == 2 and rows == [(3,)], 'nan and inf are not sensible downtimes. Got %r and %r.' % (r, rows)", undefined, false),
      ],
      xpReward: 170, coinReward: 26,
    },
    {
      id: 'de-03-abnormal-downtime', title: 'Which Machines Are Abnormal?', mode: 'independent', language: 'python', skillIds: ['de.integration', 'de.pipelines', 'sql.advanced'], concepts: [], difficulty: 5, transfer: true, context: 'maintenance', project: true,
      fixtures: { databases: ['works'] },
      prompt: text(
        'The factory database is `works.db` (see the schema panel). Management suspects some machines lose far more time to maintenance than the rest.',
        'Write `abnormal_machines(db_path)` that returns a list of the **names** of machines whose **total downtime is more than 1.5 times the average total downtime of the machines that have any events**, sorted from most downtime to least (ties by name, A to Z). Machines with no events are not counted in the average, and are not abnormal.',
      ),
      starterCode: '', hints: [],
      checks: [
        script('Finds the abnormal machines', "import sqlite3\ncon = sqlite3.connect('works.db')\nt = con.execute('select m.name, sum(e.downtime_hours) s from machines m join maintenance_events e on e.machine_id = m.id group by m.id').fetchall()\navg = sum(s for _, s in t) / len(t)\nexp = [n for n, s in sorted(t, key=lambda r: (-r[1], r[0])) if s > 1.5 * avg]\ngot = abnormal_machines('works.db')\nassert got == exp, 'Expected %r, got %r.' % (exp, got)\nassert len(exp) > 0", { databases: ['works'] }),
        script('Works on different data', "import sqlite3\ncon = sqlite3.connect('works.db')\nt = con.execute('select m.name, sum(e.downtime_hours) s from machines m join maintenance_events e on e.machine_id = m.id group by m.id').fetchall()\navg = sum(s for _, s in t) / len(t)\nexp = [n for n, s in sorted(t, key=lambda r: (-r[1], r[0])) if s > 1.5 * avg]\ngot = abnormal_machines('works.db')\nassert got == exp, 'Expected %r, got %r.' % (exp, got)", { databases: ['works-b:works'] }, false),
        script('Only clearly abnormal machines count, ties by name', "import sqlite3\ncon = sqlite3.connect('works.db')\ncon.execute('delete from maintenance_events')\nms = [r for r in con.execute('select id, name from machines order by id limit 7')]\nparts = [[24], [1] * 24, [4], [4], [4], [4], [4]]\nfor (mid, _), ps in zip(ms, parts):\n    for part in ps:\n        con.execute(\"insert into maintenance_events (machine_id, technician_id, event_date, kind, downtime_hours, cost) values (?, 1, '2024-01-01', 'repair', ?, null)\", (mid, part))\ncon.commit(); con.close()\nexp = sorted([ms[0][1], ms[1][1]])\ngot = abnormal_machines('works.db')\nassert got == exp, 'Expected %r (tied machines by name), got %r.' % (exp, got)\ncon = sqlite3.connect('works.db')\ncon.execute('delete from maintenance_events')\nfor (mid, _), t in zip(ms, [10, 10, 10, 14, 10, 10, 10]):\n    con.execute(\"insert into maintenance_events (machine_id, technician_id, event_date, kind, downtime_hours, cost) values (?, 1, '2024-01-01', 'repair', ?, null)\", (mid, t))\ncon.commit(); con.close()\nassert abnormal_machines('works.db') == [], 'A machine only a little above average is not abnormal.'", { databases: ['works'] }, false),
      script('A database with no events gives an empty list', "import sqlite3\ncon = sqlite3.connect('works.db')\ncon.execute('delete from maintenance_events'); con.commit(); con.close()\nassert abnormal_machines('works.db') == [], 'With no events nothing can be abnormal.'", { databases: ['works'] }, false),
      ],
      xpReward: 180, coinReward: 28,
    },
  ],
};
