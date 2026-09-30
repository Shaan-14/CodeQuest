import type { Challenge } from '../schema';
import { refCalls, script } from '../daily/helpers';
import { bossChallenge } from './helpers';

/** Python boss versions. Reference solutions and wrong attempts live in solutions.testdata.ts (tests only). */
export const pythonBossChallenges: Challenge[] = [
  // ---- mini-boss: The Gate Warden (a function over a list; two versions)
  bossChallenge({
    id: 'boss-py-gate-a', title: 'The Gate Warden: Repeat Visitors', language: 'python', skillIds: ['py.lists', 'py.functions', 'py.loops'], difficulty: 3, context: 'security',
    boss: { bossId: 'mini-python-functions', version: 'a' },
    prompt: 'The gate log records the badge number of everyone who walks in. Write `first_repeat(badges)` returning the first badge number that is seen for the **second** time while reading the log from the start (so `[4, 7, 4, 7]` gives `4`, and `[4, 7, 7, 4]` gives `7`). If nobody repeats, return `None`. Do not change the list.',
    checks: [...refCalls('first_repeat', 'def _ref(b):\n    seen = set()\n    for x in b:\n        if x in seen:\n            return x\n        seen.add(x)\n    return None', ['[]', '[5]', '[4, 7, 4, 7]', '[4, 7, 7, 4]', '[1, 2, 3]', '[9, 9, 9]', '[3, 1, 2, 1, 3]', '["a", "b", "a"]']), script('The log is left unchanged', 'log = [1, 2, 1]\nfirst_repeat(log)\nassert log == [1, 2, 1], "Do not change the input."')],
  }),
  bossChallenge({
    id: 'boss-py-gate-b', title: 'The Gate Warden: The Missing Slot', language: 'python', skillIds: ['py.lists', 'py.functions', 'py.loops'], difficulty: 3, context: 'operations',
    boss: { bossId: 'mini-python-functions', version: 'b' },
    prompt: 'A parking garage numbers its slots 1, 2, 3, … Some slots are taken. Write `first_free(taken)` returning the lowest slot number (at least 1) that is **not** in the list `taken`. The list may be unsorted, may contain repeats and may contain zero or negative junk values that are not real slots.',
    checks: refCalls('first_free', 'def _ref(t):\n    s = set(t)\n    n = 1\n    while n in s:\n        n += 1\n    return n', ['[]', '[1, 2, 3]', '[2, 3]', '[3, 1, 2, 2]', '[0, -1, 2]', '[5, 4, 3, 2, 1]', '[1, 3, 4]', '[100]', '[-3, -2]']),
  }),
  // ---- mastery boss: The Architect of Scripts (a file, messy data, decisions, a report; two versions)
  bossChallenge({
    id: 'boss-py-mastery-a', title: 'Mastery Trial: The Service Log', language: 'python', skillIds: ['de.files', 'py.dicts', 'py.functions', 'de.cleaning'], difficulty: 4, context: 'operations', project: true,
    boss: { bossId: 'mastery-python', version: 'a' },
    prompt: 'An operations team keeps a text log with one event per line, in the form `LEVEL|service|milliseconds`, for example `WARN|billing|240`. LEVEL is `INFO`, `WARN` or `ERROR`. Lines that are blank or do not follow this form (wrong number of fields, unknown level, milliseconds that are not a whole number, blank service) must be ignored, not crash the program. Spaces around the fields do not matter.\n\nWrite `analyse(path)` returning a dictionary with three entries:\n- `"counts"`: how many valid lines there were of each level that appears (levels with no lines are left out);\n- `"slowest"`: the service with the highest **average** milliseconds, ties broken by name A to Z, or `None` when there are no valid lines;\n- `"errors"`: an alphabetically sorted list of the distinct services that logged at least one `ERROR`.',
    checks: [
      script('A typical log', "open('a.log','w').write('INFO|api|100\\nWARN|billing|240\\nERROR|billing|900\\nINFO|api|300\\nERROR|search|50\\n')\nr = analyse('a.log')\nassert r == {'counts': {'INFO': 2, 'WARN': 1, 'ERROR': 2}, 'slowest': 'billing', 'errors': ['billing', 'search']}, 'Got %r.' % (r,)"),
      script('Damaged lines are ignored', "open('b.log','w').write('\\nINFO|api|100\\nFATAL|api|5\\nINFO|api\\nINFO|api|x\\nINFO||7\\nWARN|api|3.5\\nINFO|api|200|extra\\n  \\nWARN|db|60\\n')\nr = analyse('b.log')\nassert r == {'counts': {'INFO': 1, 'WARN': 1}, 'slowest': 'api', 'errors': []}, 'Got %r.' % (r,)"),
      script('Ties, and the average not the total', "open('c.log','w').write('INFO|b|10\\nINFO|a|10\\nINFO|c|4\\nINFO|c|4\\nINFO|c|4\\nINFO|c|4\\n')\nr = analyse('c.log')\nassert r['slowest'] == 'a', 'Equal averages go to the name that comes first, and a busy service is not automatically slow. Got %r.' % (r['slowest'],)"),
      script('An empty or fully damaged log', "open('d.log','w').write('')\nassert analyse('d.log') == {'counts': {}, 'slowest': None, 'errors': []}, 'An empty log should give empty results.'\nopen('e.log','w').write('junk\\n???\\n')\nassert analyse('e.log') == {'counts': {}, 'slowest': None, 'errors': []}"),
      script('Spaces around fields are fine', "open('f.log','w').write(' ERROR | web | 20 \\nERROR|web|40\\n')\nr = analyse('f.log')\nassert r == {'counts': {'ERROR': 2}, 'slowest': 'web', 'errors': ['web']}, 'Got %r.' % (r,)"),
    ],
  }),
  bossChallenge({
    id: 'boss-py-mastery-b', title: 'Mastery Trial: The Gradebook', language: 'python', skillIds: ['de.files', 'py.dicts', 'py.functions', 'de.cleaning'], difficulty: 4, context: 'education', project: true,
    boss: { bossId: 'mastery-python', version: 'b' },
    prompt: 'A teacher keeps scores in a CSV file with the header `student,assignment,score`. Some rows are unusable: a blank student, or a score that is not a number between 0 and 100 inclusive. Skip those rows without stopping.\n\nWrite `final_grades(path)` returning a dictionary that maps each student (who has at least one usable row) to their final grade. A student with **three or more** usable scores has their single lowest score dropped first; then the grade is the average of the scores that remain, rounded to 1 decimal place. Student names may have stray spaces around them and should be matched without them.',
    checks: [
      script('A typical file', "open('g.csv','w').write('student,assignment,score\\nAda,1,90\\nAda,2,70\\nAda,3,80\\nBo,1,60\\nBo,2,100\\nCy,1,55.5\\n')\nr = final_grades('g.csv')\nassert r == {'Ada': 85.0, 'Bo': 80.0, 'Cy': 55.5}, 'Got %r.' % (r,)"),
      script('Unusable rows are skipped, boundaries are fine', "open('h.csv','w').write('student,assignment,score\\nAda,1,100\\nAda,2,0\\n,1,50\\nBo,1,abc\\nBo,2,101\\nBo,3,-1\\nBo,4,\\nDee,1,0\\n')\nr = final_grades('h.csv')\nassert r == {'Ada': 50.0, 'Dee': 0.0}, 'Got %r.' % (r,)"),
      script('Drop only with three or more scores, and only one', "open('i.csv','w').write('student,assignment,score\\nAda,1,50\\nAda,2,50\\nAda,3,50\\nAda,4,80\\nBo,1,40\\nBo,2,90\\n')\nr = final_grades('i.csv')\nassert r == {'Ada': 60.0, 'Bo': 65.0}, 'Got %r.' % (r,)"),
      script('Names with stray spaces, and rounding', "open('j.csv','w').write('student,assignment,score\\n Ada ,1,71\\nAda,2,72\\nAda ,3,74\\n')\nr = final_grades('j.csv')\nassert r == {'Ada': 73.0}, 'Got %r.' % (r,)\nopen('k.csv','w').write('student,assignment,score\\nX,1,10\\nX,2,11\\nX,3,11\\nX,4,12\\n')\nassert final_grades('k.csv') == {'X': 11.3}, 'Drop the lowest, average the rest, round to one decimal.'"),
      script('Only a header', "open('l.csv','w').write('student,assignment,score\\n')\nassert final_grades('l.csv') == {}"),
    ],
  }),
];
