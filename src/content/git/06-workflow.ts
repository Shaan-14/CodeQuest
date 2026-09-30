import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { gitCheck } from './helpers';

const URL = 'https://example.com/team/project.git';

export const bundle: LessonBundle = {
  lesson: {
    id: 'git-06-workflow', title: 'The Professional Workflow', language: 'git', skillId: 'git.workflow',
    blurb: 'Put it all together: investigate history, ship a change through review, and mark a release.', prerequisites: ['git-05-collaboration', 'git-02-history'], xpReward: 75,
    reference: {
      title: 'The everyday team workflow',
      body: text('Update `main` (`git pull`), make a branch, commit small and well-described changes, push the branch, open a pull request, get it reviewed, merge it, update `main`, delete the branch. Mark a release with `git tag v1.1`.', 'To investigate a bug: `git log --oneline`, `git show <id>`, `git diff <a> <b>`, then `git revert` the commit that caused it.'),
      example: 'git pull\ngit switch -c fix-bug\ngit commit -am "Fix the rounding bug"\ngit push -u origin fix-bug\ngh pr create --base main --title "Fix rounding"',
    },
    steps: [
      {
        kind: 'teach', title: 'The loop professionals follow',
        body: text(
          'Everything in this world combines into one routine. **Start fresh:** pull the latest `main`. **Isolate:** make a branch for the task. **Work in small steps:** each commit does one thing and its message says what. **Share:** push the branch. **Review:** open a pull request and let a teammate read it. **Land it:** merge, pull `main`, delete the branch. **Mark it:** tag a release so everyone can refer to an exact version.',
          'When something goes wrong, history is your detective: `git log --oneline` for the timeline, `git show` for one commit, `git diff` between two points. Find the commit that introduced a problem, then `git revert` it, leaving a clear record.',
        ),
      },
      {
        kind: 'demo', title: 'Tag a release and read the history', language: 'git',
        body: text('A small project with a few commits. The script tags the current state as a release and then uses `show` and `diff` between two commits: read the output like a detective.'),
        git: { commits: [{ message: 'Add the parser', files: { 'parser.py': 'def parse(x): return x\n' } }, { message: 'Handle empty input', edit: { 'parser.py': 'def parse(x): return x or ""\n' } }, { message: 'Add usage notes', edit: { 'NOTES.md': 'Use parse(text)\n' } }] },
        code: 'git tag v1.0\ngit log --oneline\ngit show HEAD~1\ngit diff HEAD~2 HEAD\ngit tag',
        notice: 'A **tag** gives an exact commit a permanent name. `git show` displayed one commit with its diff, and `git diff HEAD~2 HEAD` compared two points in time: together they answer “what changed, and when?”.',
      },
      { kind: 'challenge', challengeId: 'git-06-detective' },
      { kind: 'challenge', challengeId: 'git-06-release' },
    ],
  },
  challenges: [
    {
      id: 'git-06-detective', objectiveId: 'git-obj-detective', title: 'Find the Commit That Broke It', mode: 'challenge', language: 'git', skillIds: ['git.workflow', 'git.history'], concepts: ['log', 'show', 'revert'], difficulty: 3, context: 'operations',
      prompt: text('Since yesterday the service logs far too much. Somewhere in the last few commits someone switched `settings.cfg` to `debug = true`. Other changes in those commits are fine and must stay.', 'Find the commit that turned debug on and undo **only that commit**, keeping the history intact.'),
      expectedBehavior: 'settings.cfg has debug = false but keeps the later valid changes; history is kept and extended.',
      starterCode: '',
      git: { start: { commits: [{ message: 'Add settings', files: { 'settings.cfg': 'name = api\ndebug = false\npool = 4\n' } }, { message: 'Raise the pool size', edit: { 'settings.cfg': 'name = api\ndebug = false\npool = 8\n' } }, { message: 'Investigate slow requests', edit: { 'settings.cfg': 'name = api\ndebug = true\npool = 8\n' } }, { message: 'Add a timeout setting', edit: { 'settings.cfg': 'name = api\ndebug = true\npool = 8\ntimeout = 30\n' } }] } },
      hints: ['The log lists the commits; one message hints at the culprit.', 'Reading a single commit shows exactly what it changed.', 'Cancel that one commit by adding its opposite; later commits may overlap, so read the result.'],
      checks: [
        gitCheck('Debug is off and the valid changes stay', { files: { 'settings.cfg': { includes: ['debug = false', 'pool = 8', 'timeout = 30'], excludes: ['debug = true'] } }, clean: true }),
        gitCheck('History kept and extended (no rewriting)', { notUsed: ['reset --hard', 'reset --soft', '--force'] }, { visible: false }),
      ],
      xpReward: 75, coinReward: 12,
    },
    {
      id: 'git-06-detective-b', objectiveId: 'git-obj-detective', title: 'Find the Commit That Changed the Rate', mode: 'challenge', language: 'git', skillIds: ['git.workflow', 'git.history'], concepts: ['log', 'show', 'revert'], difficulty: 3, context: 'finance',
      prompt: text('Reports show wrong totals since last week. One commit replaced the rounding mode in `report.cfg` with `rounding = down`. Other commits since then are fine and must stay.', 'Find the commit that changed the rounding and undo only that commit, keeping the history intact.'),
      expectedBehavior: 'report.cfg has rounding = half-up again but keeps the later valid changes; history is kept and extended.',
      starterCode: '',
      git: { start: { commits: [{ message: 'Add report config', files: { 'report.cfg': 'currency = EUR\nrounding = half-up\nlocale = en\n' } }, { message: 'Switch the rounding mode to down', edit: { 'report.cfg': 'currency = EUR\nrounding = down\nlocale = en\n' } }, { message: 'Add decimals setting', edit: { 'report.cfg': 'currency = EUR\nrounding = down\nlocale = en\ndecimals = 2\n' } }, { message: 'Add a title', edit: { 'report.cfg': 'currency = EUR\nrounding = down\nlocale = en\ndecimals = 2\ntitle = Weekly\n' } }] } },
      hints: ['The commit messages are the first clue.', 'Show one commit to see its exact change.', 'Cancel only that change by adding its opposite, then read the result.'],
      checks: [
        gitCheck('Rounding is restored and the valid changes stay', { files: { 'report.cfg': { includes: ['rounding = half-up', 'decimals = 2', 'title = Weekly'], excludes: ['rounding = down'] } }, clean: true }),
        gitCheck('History kept and extended (no rewriting)', { notUsed: ['reset --hard', 'reset --soft', '--force'] }, { visible: false }),
      ],
      xpReward: 75, coinReward: 12,
    },
    {
      id: 'git-06-release', objectiveId: 'git-obj-ship', title: 'Ship the Release Notes', mode: 'independent', language: 'git', skillIds: ['git.workflow', 'git.collaboration', 'git.branches'], concepts: [], difficulty: 4, context: 'software',
      prompt: text('The team lead wants a file called `RELEASE_NOTES.md` added to the project, listing the two changes since version 1.0: “faster start-up” and “new export button”.', 'Company rules: nobody adds work straight to the main line of the project, every change is read by a teammate before it lands, and once it has landed the current state must be labelled `v1.1` so the release can be found later. Your own copy of the project must end up current.'),
      starterCode: '',
      git: { start: { remote: URL, commits: [{ message: 'Release 1.0', files: { 'app.txt': 'app v1\n' } }], branches: { main: 0 }, origin: { main: 0 }, prs: [] } },
      hints: [],
      checks: [
        gitCheck('The notes file landed on main through a reviewed, merged proposal', { files: { 'RELEASE_NOTES.md': { includes: ['faster start-up', 'export button'] } }, prs: { count: 1, any: [{ state: 'merged', base: 'main', reviewed: true }] } }),
        gitCheck('The release is labelled and your copy is current', { tagAtHead: ['v1.1'], remote: { main: 'synced' }, clean: true, branch: 'main' }),
        gitCheck('No direct commit was made on main', { noDirectCommitsOn: 'main', notUsed: ['--force'] }, { visible: false }),
      ],
      xpReward: 100, coinReward: 20, transfer: true,
    },
    {
      id: 'git-06-release-b', objectiveId: 'git-obj-ship', title: 'Publish the Protocol Update', mode: 'independent', language: 'git', skillIds: ['git.workflow', 'git.collaboration', 'git.branches'], concepts: [], difficulty: 4, context: 'research',
      prompt: text('A lab wants a file `CHANGES.md` added to its protocol repository, saying: “sterilise tools before each run” and “record room temperature”.', 'House rules: nothing is added straight to the main line, a colleague must review every change before it is accepted, and after it is accepted the state must be labelled `v2.3`. Your own copy must end up current.'),
      starterCode: '',
      git: { start: { remote: URL, commits: [{ message: 'Protocol 2.2', files: { 'protocol.md': 'steps v2.2\n' } }], branches: { main: 0 }, origin: { main: 0 }, prs: [] } },
      hints: [],
      checks: [
        gitCheck('The changes file landed on main through a reviewed, merged proposal', { files: { 'CHANGES.md': { includes: ['sterilise tools', 'room temperature'] } }, prs: { count: 1, any: [{ state: 'merged', base: 'main', reviewed: true }] } }),
        gitCheck('The release is labelled and your copy is current', { tagAtHead: ['v2.3'], remote: { main: 'synced' }, clean: true, branch: 'main' }),
        gitCheck('No direct commit was made on main', { noDirectCommitsOn: 'main', notUsed: ['--force'] }, { visible: false }),
      ],
      xpReward: 100, coinReward: 20, transfer: true,
    },
  ],
  objectives: [
    { id: 'git-obj-detective', title: 'Find and undo the change that caused a problem', summary: 'Read history to locate a faulty commit and revert only that commit.' },
    { id: 'git-obj-ship', title: 'Ship a reviewed change and mark a release', summary: 'Take an approved change from an idea to a labelled release through the team workflow.' },
  ],
};
