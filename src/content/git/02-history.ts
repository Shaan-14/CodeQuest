import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { gitCheck } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'git-02-history', title: 'Reading and Undoing History', language: 'git', skillId: 'git.history',
    blurb: 'Diff, log, show, restore and revert: see what changed and undo it safely.', prerequisites: ['git-01-repositories'], xpReward: 55,
    reference: {
      title: 'Seeing and undoing changes',
      body: text('`git diff` shows unstaged changes (`--staged` shows what is about to be committed). `git log --oneline` and `git show <id>` read history.', '`git restore <file>` throws away uncommitted edits. `git restore --staged <file>` unstages. `git revert <id>` adds a NEW commit that undoes an old one, which is safe for shared history. `git reset` moves history backwards and is for work that is still only yours.'),
      example: 'git diff\ngit restore notes.txt\ngit revert HEAD --no-edit',
    },
    steps: [
      {
        kind: 'teach', title: 'Reading what changed',
        body: text(
          '`git status` tells you *which* files changed. `git diff` tells you *what* changed inside them: lines starting with `-` were removed and lines with `+` were added. `git diff --staged` shows the same for what is on the shelf, which is exactly what your next commit will contain, so it is the last thing to read before committing.',
          'History is readable too. `git log --oneline` lists commits; `git show <id>` shows one commit with its changes. When something breaks, reading history answers “what changed, and when?”',
        ),
      },
      {
        kind: 'teach', title: 'Three ways to undo, and when each is safe',
        body: text(
          '**Undo uncommitted work:** `git restore <file>` puts a file back the way the last commit had it (your edits are gone for good). `git restore --staged <file>` only takes it off the shelf.',
          '**Undo a commit that others may have:** `git revert <id>` creates a new commit that applies the opposite change. History stays complete and honest, so it is safe on shared branches. **Rewrite your own unshared history:** `git reset --soft HEAD~1` moves the branch back one commit and keeps the changes staged; `--hard` throws the changes away. Never reset work other people already have.',
        ),
      },
      {
        kind: 'demo', title: 'Change, inspect, undo', language: 'git',
        body: text('A small repository with one commit. The script edits a file, reads the change, discards it, then reverts a commit. Predict what `git diff` prints before you run it.'),
        git: { commits: [{ message: 'Add greeting', files: { 'hello.txt': 'hello\n' } }, { message: 'Shout the greeting', edit: { 'hello.txt': 'HELLO\n' } }] },
        code: 'echo "bye" >> hello.txt\ngit diff\ngit restore hello.txt\ncat hello.txt\ngit revert HEAD --no-edit\ncat hello.txt\ngit log --oneline',
        notice: '`git diff` showed a `+bye` line; `git restore` made it vanish. `git revert` did not delete the “Shout” commit: it added a third commit that undoes it, and the log shows all three.',
      },
      { kind: 'challenge', challengeId: 'git-02-undo-edit' },
      { kind: 'challenge', challengeId: 'git-02-revert-bad' },
      { kind: 'challenge', challengeId: 'git-02-unstage' },
    ],
  },
  challenges: [
    {
      id: 'git-02-undo-edit', title: 'Throw Away a Bad Edit', mode: 'learning', language: 'git', skillIds: ['git.history'], concepts: ['restore', 'diff'], difficulty: 1, context: 'engineering',
      prompt: text('You changed `settings.cfg` while experimenting and everything stopped working. You have not committed the change.', 'Look at what changed, then put `settings.cfg` back exactly as the last commit had it.'),
      expectedBehavior: '`settings.cfg` matches the committed version again and the working tree is clean.',
      guidedSteps: ['Read the change with `git diff`.', 'Discard it with `git restore settings.cfg`.', 'Confirm with `git status`.'],
      starterCode: '', git: { start: { commits: [{ message: 'Add settings', files: { 'settings.cfg': 'speed = 10\nmode = safe\n' } }], files: { 'settings.cfg': 'speed = 999\nmode = unsafe\n' } } },
      hints: ['Git can show you the exact lines that differ.', 'There is a command that resets a file to its committed state.', '`git restore` followed by the file name.'],
      checks: [gitCheck('settings.cfg is back to the committed version', { working: { 'settings.cfg': 'speed = 10\nmode = safe' }, clean: true, commitCount: 1 })],
      xpReward: 35, coinReward: 5,
    },
    {
      id: 'git-02-revert-bad', objectiveId: 'git-obj-revert', title: 'Undo a Commit Safely', mode: 'challenge', language: 'git', skillIds: ['git.history'], concepts: ['revert', 'log'], difficulty: 3, context: 'operations',
      prompt: text('The most recent commit on `main` changed `deploy.cfg` to a wrong server address. The commit has already been shared with the team, so history must not be rewritten.', 'Undo that commit so `deploy.cfg` is correct again, while keeping the full history (nothing deleted).'),
      expectedBehavior: 'deploy.cfg has the original server, all earlier commits are still there, and an extra commit records the undo.',
      starterCode: '',
      git: { start: { commits: [{ message: 'Add deploy config', files: { 'deploy.cfg': 'server = prod-1\nretries = 3\n' } }, { message: 'Raise retries to 5', edit: { 'deploy.cfg': 'server = prod-1\nretries = 5\n' } }, { message: 'Point deploy at the test server', edit: { 'deploy.cfg': 'server = test-9\nretries = 5\n' } }] } },
      hints: ['First find the commit that did the damage.', 'Shared history is never rewritten; you add a commit that cancels the bad one.', 'One Git command creates a commit that is the opposite of an existing one.'],
      checks: [
        gitCheck('The bad change is gone but the good one stays', { files: { 'deploy.cfg': { includes: ['server = prod-1', 'retries = 5'], excludes: ['test-9'] } }, clean: true }),
        gitCheck('History is kept and extended', { commitCount: 4, notUsed: ['reset --hard', 'reset --soft', '--force'] }),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'git-02-revert-bad-b', objectiveId: 'git-obj-revert', title: 'Undo the Wrong Formula', mode: 'challenge', language: 'git', skillIds: ['git.history'], concepts: ['revert', 'log'], difficulty: 3, context: 'finance',
      prompt: text('The latest shared commit on `main` replaced the tax rate in `rates.txt` with a typo. Other analysts have already pulled it.', 'Undo that commit without rewriting or deleting any history, so the tax rate is right again and the earlier discount change is kept.'),
      expectedBehavior: 'rates.txt has the right tax rate and the discount change, no history is lost, and an extra commit records the undo.',
      starterCode: '',
      git: { start: { commits: [{ message: 'Add rates', files: { 'rates.txt': 'tax = 0.20\ndiscount = 0.05\n' } }, { message: 'Raise the discount to 10%', edit: { 'rates.txt': 'tax = 0.20\ndiscount = 0.10\n' } }, { message: 'Update the tax rate', edit: { 'rates.txt': 'tax = 2.0\ndiscount = 0.10\n' } }] } },
      hints: ['Read the log to see which commit introduced the typo.', 'A commit that others already have must be cancelled, not erased.', 'There is a command that makes the exact opposite change as a new commit.'],
      checks: [
        gitCheck('The typo is gone but the discount change stays', { files: { 'rates.txt': { includes: ['tax = 0.20', 'discount = 0.10'] } }, clean: true }),
        gitCheck('History is kept and extended', { commitCount: 4, notUsed: ['reset --hard', 'reset --soft', '--force'] }),
      ],
      xpReward: 70, coinReward: 12,
    },
    {
      id: 'git-02-unstage', title: 'Take a File Off the Shelf', mode: 'challenge', language: 'git', skillIds: ['git.history'], concepts: ['restore --staged', 'diff --staged'], difficulty: 2, context: 'software',
      prompt: text('You staged both `app.py` (finished) and `debug.log` (a log file that should never be saved in the project) by accident. Nothing is committed yet.', 'Commit only `app.py` with a clear message and keep `debug.log` out of the commit (it may stay in your folder).'),
      expectedBehavior: 'The new commit contains app.py and not debug.log.',
      starterCode: '',
      git: { start: { commits: [{ message: 'Start the app', files: { 'app.py': 'print("v1")\n' } }], files: { 'app.py': 'print("v2")\n', 'debug.log': 'error at 10:01\n' }, staged: ['app.py', 'debug.log'] } },
      hints: ['`git status` shows what is staged and what is not.', 'A staged file can be taken off the shelf without losing your edits.', 'Use `git restore --staged` on the file you do not want.'],
      checks: [
        gitCheck('app.py is committed, debug.log is not', { files: { 'app.py': { includes: ['v2'] }, 'debug.log': null }, commitCount: 2 }),
        gitCheck('The message explains the commit', { meaningfulMessages: 'required' }, { visible: false }),
      ],
      xpReward: 50, coinReward: 8,
    },
  ],
  objectives: [
    { id: 'git-obj-revert', title: 'Undoing a shared commit', summary: 'Create a commit that cancels an earlier one, keeping history intact.' },
  ],
};
