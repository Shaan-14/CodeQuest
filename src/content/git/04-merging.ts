import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { gitCheck } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'git-04-merging', title: 'When Two People Edit the Same Line', language: 'git', skillId: 'git.merging',
    blurb: 'Merge commits, conflicts, conflict markers and how to resolve them calmly.', prerequisites: ['git-03-branches'], xpReward: 65,
    reference: {
      title: 'Merging and conflicts',
      body: text('When both branches have new commits, `git merge` makes a **merge commit** with two parents. If both changed the same lines, Git stops with a **conflict** and writes markers into the file: `<<<<<<<` (your side), `=======`, `>>>>>>>` (their side).', 'To resolve: edit the file into the final content (delete the markers), `git add` it, then `git commit`. To give up: `git merge --abort`.'),
      example: 'git merge editor\n# edit the file, remove the markers\ngit add title.txt\ngit commit -m "Resolve the title conflict"',
    },
    steps: [
      {
        kind: 'teach', title: 'Merging when both sides moved',
        body: text(
          'A fast-forward is the easy case: only one branch has new work. Often both have. Suppose you edited `report.txt` on `main` while a colleague edited `summary.txt` on their branch. `git merge` combines both into a new **merge commit**, which has two parents, and nobody has to do anything by hand.',
          'Git merges by comparing *lines*. If two branches changed different lines (even in the same file), both changes are kept.',
        ),
      },
      {
        kind: 'teach', title: 'Conflicts are not failures',
        body: text(
          'If both branches changed the **same** lines differently, Git cannot know which is right. It stops, marks the file, and waits for a human. A conflicted file looks like this:',
          '`<<<<<<< HEAD` / your version / `=======` / their version / `>>>>>>> branch`.',
          'Resolving means deciding what the final text should be: keep yours, keep theirs, or combine them. Edit the file so the markers are gone and the content is right, stage it with `git add`, and finish with `git commit`. `git status` always tells you which files still need attention. If you start a merge by mistake, `git merge --abort` returns everything to the way it was.',
        ),
      },
      {
        kind: 'demo', title: 'Create a conflict and read it', language: 'git',
        body: text('Two branches rename the title differently. Run the script to see the conflict Git reports and the markers it writes, then think about what the final title should be.'),
        git: { commits: [{ message: 'Add title', files: { 'title.txt': 'Draft\n' } }, { branch: 'main', message: 'Call it the annual report', edit: { 'title.txt': 'Annual Report\n' } }, { branch: 'editor', parent: 0, message: 'Call it the final report', edit: { 'title.txt': 'Final Report\n' } }], branches: { main: 1, editor: 2 } },
        code: 'git merge editor\ngit status\ncat title.txt',
        notice: 'Git reported `CONFLICT (content)` and `git status` lists `title.txt` under **unmerged paths**. The file now holds both versions between markers. Nothing is lost: it is your job to decide the final text.',
      },
      { kind: 'challenge', challengeId: 'git-04-resolve-title' },
      { kind: 'challenge', challengeId: 'git-04-resolve-config' },
      { kind: 'challenge', challengeId: 'git-04-abort' },
    ],
  },
  challenges: [
    {
      id: 'git-04-resolve-title', title: 'Resolve the Title Conflict', mode: 'learning', language: 'git', skillIds: ['git.merging'], concepts: ['merge', 'conflict', 'resolve'], difficulty: 2, context: 'publishing',
      prompt: text('Two people renamed the report title: `main` says “Annual Report” and the `editor` branch says “Final Report”. The team agreed the title should be **“Annual Final Report”**.', 'Merge `editor` into `main`, resolve the conflict so `title.txt` contains exactly that title and no conflict markers, and finish the merge.'),
      expectedBehavior: 'The merge is complete (a merge commit on main), title.txt says Annual Final Report, and no markers remain.',
      guidedSteps: ['Run `git merge editor` and read what Git says.', 'Click the `title.txt` file in the Files list and replace its contents with the agreed title (no marker lines).', 'Stage the resolved file with `git add title.txt`.', 'Finish with `git commit -m "your message"`.'],
      starterCode: '',
      git: { start: { commits: [{ message: 'Add title', files: { 'title.txt': 'Draft\n' } }, { branch: 'main', message: 'Call it the annual report', edit: { 'title.txt': 'Annual Report\n' } }, { branch: 'editor', parent: 0, message: 'Call it the final report', edit: { 'title.txt': 'Final Report\n' } }], branches: { main: 1, editor: 2 } } },
      hints: ['Start the merge and read the message: Git names the conflicted file.', 'Open the file in the editor, write the final title and remove every marker line.', 'After editing, the file must be staged, and then the merge committed.'],
      checks: [
        gitCheck('The merge finished with the agreed title', { branch: 'main', files: { 'title.txt': 'Annual Final Report' }, mergeCommitOn: 'main', merged: [{ branch: 'editor', into: 'main' }], noMergeInProgress: true, clean: true }),
        gitCheck('No conflict markers were committed', { noConflictMarkers: true }, { visible: false }),
      ],
      xpReward: 45, coinReward: 6,
    },
    {
      id: 'git-04-resolve-config', objectiveId: 'git-obj-resolve', title: 'Reconcile Two Settings', mode: 'challenge', language: 'git', skillIds: ['git.merging'], concepts: ['merge', 'conflict', 'resolve'], difficulty: 3, context: 'operations',
      prompt: text('On `main` a teammate set `timeout` to 30. On the `retry-fix` branch you set it to 45 and added a new line `retries = 5`. Merge `retry-fix` into `main`.', 'The final file must keep the **higher** timeout (45) and your new `retries` line, contain no conflict markers, and the merge must be completed.'),
      expectedBehavior: 'A merge commit on main; service.cfg has timeout = 45 and retries = 5; no conflict markers.',
      starterCode: '',
      git: { start: { commits: [{ message: 'Add service config', files: { 'service.cfg': 'name = api\ntimeout = 10\n' } }, { branch: 'main', message: 'Raise timeout to 30', edit: { 'service.cfg': 'name = api\ntimeout = 30\n' } }, { branch: 'retry-fix', parent: 0, message: 'Raise timeout and add retries', edit: { 'service.cfg': 'name = api\ntimeout = 45\nretries = 5\n' } }], branches: { main: 1, 'retry-fix': 2 } } },
      hints: ['Merging will stop on the line both sides changed.', 'Decide the final text of the conflicted region, combining both intentions.', 'After fixing the file: stage it, then commit to finish the merge.'],
      checks: [
        gitCheck('The merged file has both intentions', { files: { 'service.cfg': { includes: ['timeout = 45', 'retries = 5'], excludes: ['timeout = 30'] } }, mergeCommitOn: 'main', merged: [{ branch: 'retry-fix', into: 'main' }], noMergeInProgress: true }),
        gitCheck('No conflict markers anywhere', { noConflictMarkers: true, clean: true }, { visible: false }),
      ],
      xpReward: 75, coinReward: 12,
    },
    {
      id: 'git-04-resolve-config-b', objectiveId: 'git-obj-resolve', title: 'Reconcile Two Prices', mode: 'challenge', language: 'git', skillIds: ['git.merging'], concepts: ['merge', 'conflict', 'resolve'], difficulty: 3, context: 'retail',
      prompt: text('On `main` a colleague set the widget price to 12. On the `promo` branch you set it to 9 and added a line `sale = true`. Merge `promo` into `main`.', 'The final `prices.txt` must use the **lower** price (9) and keep `sale = true`, contain no conflict markers, and the merge must be completed.'),
      expectedBehavior: 'A merge commit on main; prices.txt has widget = 9 and sale = true; no markers.',
      starterCode: '',
      git: { start: { commits: [{ message: 'Add prices', files: { 'prices.txt': 'widget = 10\n' } }, { branch: 'main', message: 'Raise widget price to 12', edit: { 'prices.txt': 'widget = 12\n' } }, { branch: 'promo', parent: 0, message: 'Promotional widget price', edit: { 'prices.txt': 'widget = 9\nsale = true\n' } }], branches: { main: 1, promo: 2 } } },
      hints: ['Start the merge and see which file Git is unhappy with.', 'Write the final content yourself: which price should win, and what must be kept?', 'Resolving means editing, staging and committing.'],
      checks: [
        gitCheck('The merged file has both intentions', { files: { 'prices.txt': { includes: ['widget = 9', 'sale = true'], excludes: ['widget = 12'] } }, mergeCommitOn: 'main', merged: [{ branch: 'promo', into: 'main' }], noMergeInProgress: true }),
        gitCheck('No conflict markers anywhere', { noConflictMarkers: true, clean: true }, { visible: false }),
      ],
      xpReward: 75, coinReward: 12,
    },
    {
      id: 'git-04-abort', title: 'Back Out of a Merge', mode: 'challenge', language: 'git', skillIds: ['git.merging'], concepts: ['merge --abort', 'status'], difficulty: 3, context: 'software',
      prompt: text('Merge `risky` into `main` to see how bad the conflicts are. Git reports a conflict, and then your lead tells you the `risky` work is not approved and must **not** be merged today.', 'Put the repository back to the state it was in before you started the merge (on `main`, nothing half-finished, `risky` untouched), without resolving anything.'),
      expectedBehavior: 'No merge in progress, main is clean and unchanged, and risky is not merged.',
      starterCode: '',
      git: { start: { commits: [{ message: 'Add app', files: { 'app.py': 'mode = "safe"\n' } }, { branch: 'main', message: 'Switch to fast mode', edit: { 'app.py': 'mode = "fast"\n' } }, { branch: 'risky', parent: 0, message: 'Switch to turbo mode', edit: { 'app.py': 'mode = "turbo"\n' } }], branches: { main: 1, risky: 2 } }},
      hints: ['First run the merge to see the state you are in; `git status` names the situation.', 'Git has a dedicated way out of a merge you do not want to finish.', 'Look for the `--abort` option.'],
      checks: [gitCheck('The merge is abandoned and main is untouched', { branch: 'main', clean: true, noMergeInProgress: true, working: { 'app.py': { includes: ['fast'], excludes: ['turbo', '<<<<<<<'] } }, notMerged: [{ branch: 'risky', into: 'main' }], used: ['merge\\s+risky', 'merge\\s+--abort'] })],
      xpReward: 65, coinReward: 10,
    },
  ],
  objectives: [
    { id: 'git-obj-resolve', title: 'Resolve a merge conflict', summary: 'Combine two conflicting edits into the right final content and finish the merge.' },
  ],
};
