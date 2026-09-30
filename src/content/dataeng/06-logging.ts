import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { common, logCheck } from './kit';

export const bundle: LessonBundle = {
  lesson: {
    id: 'de-06-logging', title: 'Leave a Trail: Logging & Monitoring', language: 'python', skillId: 'de.observability',
    blurb: 'A job nobody can see into cannot be trusted. Log what happened at the right level, and turn counts into signals.', prerequisites: ['de-05-quality'], xpReward: 80,
    reference: {
      title: 'Logging',
      body: text(
        'Use the `logging` module, not `print`, for a trail you can filter and keep. **Levels** rank importance: `DEBUG < INFO < WARNING < ERROR < CRITICAL`. A logger only emits messages at or above its level: the default is **WARNING**, so `log.info(...)` is silently dropped until you call `log.setLevel(logging.INFO)`.',
        'A **handler** decides where lines go (`logging.FileHandler(path)`) and a **formatter** how they look (`logging.Formatter("%(levelname)s %(message)s")`). Adding a handler on *every call* makes every line appear again and again: add it once, or remove and close it when the run ends (`log.removeHandler(h); h.close()`). Pass values as arguments (`log.info("ok id=%s", i)`) instead of gluing strings.',
        'Log **decisions and outcomes**, not noise: what was rejected and why, and a final summary line with counts. The summary is what monitoring reads: a sudden jump in rejects is a signal even when nothing crashed.',
      ),
      example: 'log = logging.getLogger("job")\nlog.setLevel(logging.INFO)\nh = logging.FileHandler(path)\nh.setFormatter(logging.Formatter("%(levelname)s %(message)s"))\nlog.addHandler(h)\nlog.info("started")',
    },
    steps: [
      { kind: 'teach', title: 'Why nobody trusts a silent job', body: text('A nightly job that "worked" but rejected half its input is worse than one that crashed: nobody noticed. **Logging** is how a program explains itself afterwards: what it did, what it skipped, and how much. Good logs let someone else answer "what happened last night?" without reading your code.') },
      {
        kind: 'demo', title: 'Levels, a handler and a format', language: 'python',
        body: text('This logger writes to a file. Notice what appears and what does not, and read the file back.'),
        code: "import logging\n\nlog = logging.getLogger('demo')\nlog.setLevel(logging.INFO)\nhandler = logging.FileHandler('demo.log')\nhandler.setFormatter(logging.Formatter('%(levelname)s %(message)s'))\nlog.addHandler(handler)\n\nlog.debug('too detailed: dropped')\nlog.info('started')\nlog.warning('row %s skipped', 7)\nhandler.close()\n\nprint(open('demo.log').read())",
        notice: 'The DEBUG line is missing because the level is INFO. The `7` was passed as an argument and formatted for us. Remove `log.setLevel(logging.INFO)` and even `started` disappears: the default level is WARNING.',
      },
      { kind: 'challenge', challengeId: 'de-06-process-readings' },
      { kind: 'challenge', challengeId: 'de-06-ship-batch' },
    ],
  },
  objectives: [
    { id: 'de-obj-log-run', title: 'Log a batch run with levels and a summary', summary: 'Record each decision at the right level, end with a summary line, return the counts, and never repeat lines when the job runs again.' },
  ],
  challenges: [
    {
      id: 'de-06-process-readings', title: 'Log a Sensor Batch', mode: 'learning', language: 'python', skillIds: ['de.observability', 'de.cleaning'], concepts: ['logging', 'levels', 'handlers'], difficulty: 3, context: 'manufacturing', project: true,
      prompt: text('Write `process(readings, log_path)` for a plant monitor. `readings` is a list of dictionaries with an `id` and a `value`. A reading is **good** when `value` is a number (not a bool) that is zero or more; otherwise it is **rejected**.', 'Write a log file at `log_path` in the format `LEVEL message` (for example `INFO ok id=3`): for each good reading an `INFO` line `ok id=<id>`; for each rejected one a `WARNING` line `rejected id=<id>`; and at the end an `INFO` line `done ok=<good> rejected=<rejected>`. Return the pair `(good, rejected)`.', 'The job may run many times against the same log path: each run **appends** exactly its own lines, never repeating earlier ones.'),
      expectedBehavior: 'The log holds one line per reading plus a summary, at the right levels, and running twice appends two complete runs.',
      guidedSteps: ['Get a logger, set its level to `logging.INFO`, and attach a `FileHandler` with a `%(levelname)s %(message)s` formatter.', 'Loop over the readings, calling `log.info` or `log.warning`, and count each kind.', 'Log the summary line, then remove and close the handler so the next run does not double up.', 'Return `(good, rejected)`.'],
      starterCode: 'import logging\n\ndef process(readings, log_path):\n    pass\n',
      hints: ['If some of your lines never appear in the file, think about the logger’s level.', 'The format is not the default one: look at what a `Formatter` accepts.', 'Every call adds a handler. What happens to the lines if you add three?'],
      checks: [
        logCheck('A mixed batch', 'process', "[{'id': 1, 'value': 4.5}, {'id': 2, 'value': -1}, {'id': 3, 'value': 0}, {'id': 4, 'value': 'n/a'}]", ['INFO ok id=1', 'WARNING rejected id=2', 'INFO ok id=3', 'WARNING rejected id=4', 'INFO done ok=2 rejected=2'], '(2, 2)'),
        logCheck('Running twice appends without repeating', 'process', "[{'id': 7, 'value': 1}, {'id': 8, 'value': -2}]", ['INFO ok id=7', 'WARNING rejected id=8', 'INFO done ok=1 rejected=1'], '(1, 1)', { twice: true, visible: false }),
        logCheck('An empty batch still writes its summary', 'process', '[]', ['INFO done ok=0 rejected=0'], '(0, 0)', { visible: false }),
        logCheck('Missing values, flags and text are rejected', 'process', "[{'id': 1}, {'id': 2, 'value': True}, {'id': 3, 'value': '5'}, {'id': 4, 'value': None}, {'id': 5, 'value': 10}]", ['WARNING rejected id=1', 'WARNING rejected id=2', 'WARNING rejected id=3', 'WARNING rejected id=4', 'INFO ok id=5', 'INFO done ok=1 rejected=4'], '(1, 4)', { visible: false }),
      ],
      xpReward: 80, coinReward: 12,
    },
    {
      id: 'de-06-ship-batch', objectiveId: 'de-obj-log-run', title: 'Log a Shipping Batch', mode: 'challenge', skillIds: ['de.observability', 'de.cleaning'], concepts: ['logging', 'levels', 'handlers'], difficulty: 3, context: 'logistics', ...common,
      prompt: text('Write `ship_batch(parcels, log_path)`. `parcels` is a list of dictionaries with an `id` and a `weight`. A parcel is **shippable** when `weight` is a number (not a bool) **above zero**; otherwise it **fails**.', 'Write a log file at `log_path`, one line per event in the format `LEVEL message`: an `INFO` line `shipped id=<id>` for each shippable parcel, an `ERROR` line `bad-weight id=<id>` for each failure, and finally an `INFO` line `finished shipped=<n> failed=<m>`. Return `(n, m)`.', 'The function is called on every run against the same log: each call must **append** exactly its own lines, once.'),
      expectedBehavior: 'One line per parcel plus a summary, at the right levels; repeated runs append cleanly.',
      starterCode: '',
      hints: ['Which levels does your logger let through by default, and which do you need?', 'The line format is fixed by the task: decide where that belongs (logger, handler or formatter).', 'Think about what happens to the handlers each time the function is called.'],
      checks: [
        logCheck('A mixed batch', 'ship_batch', "[{'id': 'a1', 'weight': 2.5}, {'id': 'a2', 'weight': 0}, {'id': 'a3', 'weight': -4}, {'id': 'a4', 'weight': 10}]", ['INFO shipped id=a1', 'ERROR bad-weight id=a2', 'ERROR bad-weight id=a3', 'INFO shipped id=a4', 'INFO finished shipped=2 failed=2'], '(2, 2)'),
        logCheck('Running twice appends without repeating', 'ship_batch', "[{'id': 'x', 'weight': 1}, {'id': 'y', 'weight': 'heavy'}]", ['INFO shipped id=x', 'ERROR bad-weight id=y', 'INFO finished shipped=1 failed=1'], '(1, 1)', { twice: true, visible: false }),
        logCheck('An empty batch still writes its summary', 'ship_batch', '[]', ['INFO finished shipped=0 failed=0'], '(0, 0)', { visible: false }),
        logCheck('Missing, boolean and text weights fail', 'ship_batch', "[{'id': 1}, {'id': 2, 'weight': True}, {'id': 3, 'weight': '2'}, {'id': 4, 'weight': 0.001}]", ['ERROR bad-weight id=1', 'ERROR bad-weight id=2', 'ERROR bad-weight id=3', 'INFO shipped id=4', 'INFO finished shipped=1 failed=3'], '(1, 3)', { visible: false }),
      ],
      xpReward: 110, coinReward: 16,
    },
    {
      id: 'de-06-import-grades', objectiveId: 'de-obj-log-run', title: 'Log a Grade Import', mode: 'challenge', skillIds: ['de.observability', 'de.cleaning'], concepts: ['logging', 'levels', 'handlers'], difficulty: 3, context: 'education', ...common,
      prompt: text('Write `import_grades(rows, log_path)`. `rows` is a list of dictionaries with a `student` and a `score`. A row is **valid** when `score` is a number (not a bool) from 0 to 100 inclusive; otherwise it is **invalid**.', 'Write a log file at `log_path`, one line per event in the format `LEVEL message`: an `INFO` line `saved student=<student>` for each valid row, an `ERROR` line `invalid student=<student>` for each invalid one, and finally an `INFO` line `complete saved=<n> invalid=<m>`. Return `(n, m)`.', 'The import runs repeatedly against the same log file: each call appends exactly its own lines, once.'),
      expectedBehavior: 'One line per row plus a summary, at the right levels; repeated runs append cleanly.',
      starterCode: '',
      hints: ['Some lines may be missing from your file even though your code ran: what decides which levels get through?', 'The line format is fixed by the task; a formatter owns that.', 'Each call to your function must leave the logging system as it found it.'],
      checks: [
        logCheck('A mixed import', 'import_grades', "[{'student': 'Ada', 'score': 91}, {'student': 'Bo', 'score': 101}, {'student': 'Cy', 'score': 0}, {'student': 'Di', 'score': -5}, {'student': 'Ed', 'score': 100}]", ['INFO saved student=Ada', 'ERROR invalid student=Bo', 'INFO saved student=Cy', 'ERROR invalid student=Di', 'INFO saved student=Ed', 'INFO complete saved=3 invalid=2'], '(3, 2)'),
        logCheck('Running twice appends without repeating', 'import_grades', "[{'student': 'Fay', 'score': 50}, {'student': 'Gus', 'score': 'A'}]", ['INFO saved student=Fay', 'ERROR invalid student=Gus', 'INFO complete saved=1 invalid=1'], '(1, 1)', { twice: true, visible: false }),
        logCheck('An empty import still writes its summary', 'import_grades', '[]', ['INFO complete saved=0 invalid=0'], '(0, 0)', { visible: false }),
        logCheck('Missing, boolean and text scores are invalid', 'import_grades', "[{'student': 'A'}, {'student': 'B', 'score': True}, {'student': 'C', 'score': '80'}, {'student': 'D', 'score': 99.5}]", ['ERROR invalid student=A', 'ERROR invalid student=B', 'ERROR invalid student=C', 'INFO saved student=D', 'INFO complete saved=1 invalid=3'], '(1, 3)', { visible: false }),
      ],
      xpReward: 110, coinReward: 16,
    },
  ],
};
