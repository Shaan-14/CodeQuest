import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { gitCheck } from './helpers';

const URL = 'https://example.com/team/project.git';
export const bundle: LessonBundle = {
  lesson: {
    id: 'git-05-collaboration', title: 'Working With Other People', language: 'git', skillId: 'git.collaboration',
    blurb: 'Remotes, push, fetch, pull, rejected pushes and pull requests with review.', prerequisites: ['git-04-merging'], xpReward: 70,
    reference: {
      title: 'Remotes and pull requests',
      body: text('A **remote** (`origin`) is a shared copy of the repository on a server. `git push -u origin <branch>` uploads a branch; `git fetch` downloads what others pushed; `git pull` is fetch followed by merge.', 'A **pull request** asks the team to review a branch before it is merged: `gh pr create --base main --title "..."`, a reviewer approves, `gh pr merge <number>`, then `git pull` brings the result home.'),
      example: 'git push -u origin feature\ngh pr create --base main --title "Add tests"\ngh pr merge 1\ngit switch main\ngit pull',
    },
    steps: [
      {
        kind: 'teach', title: 'A shared home for the project',
        body: text(
          'So far the repository lived only on your computer. Teams keep a shared copy on a server (GitHub, GitLab, or an internal server). Git calls it a **remote**, and the default one is named `origin`.',
          '`git push origin main` uploads your commits. `git fetch` downloads other people’s commits without touching your files, and `git pull` = fetch + merge. If a colleague pushed first, Git **rejects** your push: your copy is behind. The fix is always the same: pull (merge their work in), then push again.',
        ),
      },
      {
        kind: 'teach', title: 'Pull requests: review before merging',
        body: text(
          'On most teams nobody pushes straight to `main`. You push a **branch** and open a **pull request** (PR): a proposal to merge it, with a title, a discussion and a review. A teammate reads the change, comments or approves, and only then is it merged. Reviewing catches mistakes and spreads knowledge.',
          'In this game the `gh` command simulates GitHub: `gh pr create`, `gh pr list`, `gh pr review`, `gh pr merge`. After the PR is merged on the server, your own `main` is out of date until you `git pull`.',
        ),
      },
      {
        kind: 'demo', title: 'Push a branch and open a pull request', language: 'git',
        body: text('Run the script and watch the order of events. Predict what `git log --oneline` on `main` will show before and after the final pull.'),
        git: { remote: URL, commits: [{ message: 'Start project', files: { 'README.md': 'Project\n' } }], branches: { main: 0 }, origin: { main: 0 } },
        code: 'git switch -c add-license\necho "MIT" > LICENSE\ngit add LICENSE\ngit commit -m "Add the MIT license"\ngit push -u origin add-license\ngh pr create --base main --title "Add a license"\ngh pr merge 1\ngit switch main\ngit log --oneline\ngit pull\ngit log --oneline',
        notice: 'Merging the PR happened on the **server**: your local `main` only got the new commit when you ran `git pull`. A branch, a pull request and a merge is the standard route from an idea to `main`.',
      },
      { kind: 'challenge', challengeId: 'git-05-first-push' },
      { kind: 'challenge', challengeId: 'git-05-pull-before-push' },
      { kind: 'challenge', challengeId: 'git-05-pull-request' },
    ],
  },
  challenges: [
    {
      id: 'git-05-first-push', title: 'Share Your Work', mode: 'learning', language: 'git', skillIds: ['git.collaboration'], concepts: ['push', 'remote'], difficulty: 2, context: 'software',
      prompt: text('Your repository already knows its remote, `origin`, but you have never pushed. You added a new file `notes.md` and committed it locally.', 'Upload `main` to `origin` so your team can see your commit.'),
      expectedBehavior: 'origin has your main branch, identical to your local main.',
      guidedSteps: ['Check the remote with `git remote -v`.', 'Push with `git push -u origin main`.', 'Run `git status` to confirm you are up to date.'],
      starterCode: '',
      git: { start: { remote: URL, commits: [{ message: 'Start project', files: { 'README.md': 'Project\n' } }, { message: 'Add meeting notes', files: { 'README.md': 'Project\n', 'notes.md': 'Kickoff\n' } }], branches: { main: 1 } } },
      hints: ['The remote already exists: the work is to send your commits to it.', 'Push needs the remote name and the branch.', '`-u` remembers the pairing for later.'],
      checks: [gitCheck('origin has your main branch', { remote: { main: 'synced' }, files: { 'notes.md': { includes: ['Kickoff'] } } })],
      xpReward: 45, coinReward: 7,
    },
    {
      id: 'git-05-pull-before-push', objectiveId: 'git-obj-diverged', title: 'Your Push Was Rejected', mode: 'challenge', language: 'git', skillIds: ['git.collaboration'], concepts: ['pull', 'rejected push'], difficulty: 3, context: 'software',
      prompt: text('You committed `local.md` and want to push `main`. A colleague already pushed `remote.md` to `origin/main` first, so Git will reject a plain push.', 'Get both people’s work onto `origin/main`: your `local.md` and their `remote.md` must both be there, and your local `main` must match `origin`.'),
      expectedBehavior: 'origin/main and local main are identical and contain both local.md and remote.md.',
      starterCode: '',
      git: { start: { remote: URL, commits: [{ id: 'aaa0001', message: 'Start project', files: { 'README.md': 'Project\n' } }, { id: 'bbb0002', branch: 'main', message: 'Add local notes', files: { 'README.md': 'Project\n', 'local.md': 'mine\n' } }, { id: 'ccc0003', branch: 'colleague', parent: 0, message: 'Add remote notes', files: { 'README.md': 'Project\n', 'remote.md': 'theirs\n' } }], branches: { main: 1 }, origin: { main: 2 } } },
      hints: ['Try the push and read what Git says: it explains the rejection.', 'Your copy is behind: integrate their commits first.', 'Pulling merges the remote work into yours; then the push is a simple fast-forward.'],
      checks: [
        gitCheck('Both files are on origin and local main matches it', { remote: { main: 'synced' }, files: { 'local.md': { includes: ['mine'] }, 'remote.md': { includes: ['theirs'] } }, clean: true }),
        gitCheck('No forced push', { notUsed: ['--force', ' -f'] }, { visible: false }),
      ],
      xpReward: 75, coinReward: 12,
    },
    {
      id: 'git-05-pull-before-push-b', objectiveId: 'git-obj-diverged', title: 'The Server Is Ahead of You', mode: 'challenge', language: 'git', skillIds: ['git.collaboration'], concepts: ['pull', 'rejected push'], difficulty: 3, context: 'research',
      prompt: text('You added `sample-7.csv` and committed it. A labmate pushed `calibration.txt` to `origin/main` a minute earlier, so your push will be refused.', 'Finish with both files on `origin/main` and your local `main` identical to it.'),
      expectedBehavior: 'origin/main and local main are identical and contain both sample-7.csv and calibration.txt.',
      starterCode: '',
      git: { start: { remote: URL, commits: [{ id: 'ddd0001', message: 'Start lab repo', files: { 'README.md': 'Lab data\n' } }, { id: 'eee0002', branch: 'main', message: 'Add sample 7 measurements', files: { 'README.md': 'Lab data\n', 'sample-7.csv': 'id,value\n7,3.1\n' } }, { id: 'fff0003', branch: 'labmate', parent: 0, message: 'Add calibration record', files: { 'README.md': 'Lab data\n', 'calibration.txt': 'calibrated 09:00\n' } }], branches: { main: 1 }, origin: { main: 2 } } },
      hints: ['A rejected push means the remote has commits you lack.', 'Bring their commits in before you try again.', 'Fetch plus merge is what a pull does.'],
      checks: [
        gitCheck('Both files are on origin and local main matches it', { remote: { main: 'synced' }, files: { 'sample-7.csv': { includes: ['7,3.1'] }, 'calibration.txt': { includes: ['calibrated'] } }, clean: true }),
        gitCheck('No forced push', { notUsed: ['--force', ' -f'] }, { visible: false }),
      ],
      xpReward: 75, coinReward: 12,
    },
    {
      id: 'git-05-pull-request', title: 'Propose a Change for Review', mode: 'challenge', language: 'git', skillIds: ['git.collaboration'], concepts: ['pull request', 'review'], difficulty: 3, context: 'software',
      prompt: text('Add a file `CONTRIBUTING.md` (any sensible content) to the project **without committing on `main` directly**. The team rule: changes arrive through a reviewed pull request.', 'Open a pull request titled to describe the change, have it reviewed and merged, and finish with your local `main` showing the new file.'),
      expectedBehavior: 'A merged pull request exists (reviewed), origin/main has CONTRIBUTING.md, and local main is up to date.',
      starterCode: '',
      git: { start: { remote: URL, commits: [{ message: 'Start project', files: { 'README.md': 'Project\n' } }], branches: { main: 0 }, origin: { main: 0 } } },
      hints: ['Work on a branch that is pushed to the remote.', 'A pull request is opened from that branch towards main; a teammate reviews before it is merged.', 'After the merge happens on the server, update your own main.'],
      checks: [
        gitCheck('A reviewed pull request was merged', { prs: { count: 1, any: [{ state: 'merged', base: 'main', reviewed: true }] } }),
        gitCheck('main has the file and matches origin, without a direct commit on main', { noDirectCommitsOn: 'main', branch: 'main', files: { 'CONTRIBUTING.md': { includes: [''] } }, remote: { main: 'synced' }, clean: true }),
      ],
      xpReward: 80, coinReward: 12,
    },
  ],
  objectives: [
    { id: 'git-obj-diverged', title: 'Integrate a colleague’s commits before pushing', summary: 'Resolve a rejected push by pulling, then push a history that contains both people’s work.' },
  ],
};
