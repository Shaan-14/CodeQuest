import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { gitCheck } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'git-03-branches', title: 'Parallel Universes', language: 'git', skillId: 'git.branches',
    blurb: 'Branches let you try things in isolation, then bring the good ones back.', prerequisites: ['git-01-repositories'], xpReward: 55,
    reference: {
      title: 'Branches',
      body: text('A **branch** is a movable label on a commit. `git switch -c name` creates a branch and moves to it; `git switch main` goes back. `git merge name` brings a branch’s commits into the one you are on. `git branch -d name` deletes a branch that is fully merged.'),
      example: 'git switch -c add-greeting\ngit commit -am "Add a greeting"\ngit switch main\ngit merge add-greeting\ngit branch -d add-greeting',
    },
    steps: [
      {
        kind: 'teach', title: 'Why branches exist',
        body: text(
          'Suppose `main` holds the version everyone relies on, and you want to try a risky change. If you edit `main` directly and it goes wrong, everyone is affected. A **branch** is a separate line of commits that starts from where you are now. You can commit freely on it; `main` does not move.',
          'When the work is good, you **merge** the branch into `main`. When it is not, you delete the branch and nothing is lost. Professional teams make a branch for every feature or fix. It is cheap: a branch is only a label pointing at a commit.',
        ),
      },
      {
        kind: 'teach', title: 'Moving between branches and merging back',
        body: text(
          '`git switch -c fix-typo` creates `fix-typo` and puts you on it. Commits you make now belong to that branch. `git switch main` returns to `main`, and your files change to match: the typo fix disappears from the folder because it is not on `main` yet.',
          'To bring it in, switch to the branch that should *receive* the work (`main`) and run `git merge fix-typo`. If `main` has not moved since you branched, Git just slides `main` forward: a **fast-forward**. Afterwards the branch has done its job and `git branch -d fix-typo` tidies it up.',
        ),
      },
      {
        kind: 'demo', title: 'Branch, commit, merge', language: 'git',
        body: text('Watch the files change as you move between branches. Predict what `cat hello.txt` shows on `main` before the merge.'),
        git: { commits: [{ message: 'Add greeting', files: { 'hello.txt': 'hello\n' } }] },
        code: 'git switch -c shout\necho "HELLO!" > hello.txt\ngit commit -am "Shout the greeting"\ngit switch main\ncat hello.txt\ngit merge shout\ncat hello.txt\ngit branch -d shout\ngit log --oneline',
        notice: 'On `main` the file still said “hello” until the merge, because the change lived on `shout`. The merge was a fast-forward: `main` simply moved to the new commit, and then the branch could be deleted.',
      },
      { kind: 'challenge', challengeId: 'git-03-feature-branch' },
      { kind: 'challenge', challengeId: 'git-03-fix-branch' },
      { kind: 'challenge', challengeId: 'git-03-isolated' },
    ],
  },
  challenges: [
    {
      id: 'git-03-feature-branch', title: 'Your First Feature Branch', mode: 'learning', language: 'git', skillIds: ['git.branches'], concepts: ['switch -c', 'merge', 'branch -d'], difficulty: 1, context: 'software',
      prompt: text('A project has `app.txt` on `main`. You want to add a line “feature: dark mode” to it, but on a branch called `dark-mode` so `main` stays safe until the work is ready.', 'Do the work on the branch, merge it into `main`, then delete the branch.'),
      expectedBehavior: '`main` contains the new line, the work was merged, and the `dark-mode` branch no longer exists.',
      guidedSteps: ['Create and switch to the branch: `git switch -c dark-mode`.', 'Add the line and commit it.', 'Switch back with `git switch main` and run `git merge dark-mode`.', 'Delete the finished branch with `git branch -d dark-mode`.'],
      starterCode: '', git: { start: { commits: [{ message: 'Add app description', files: { 'app.txt': 'Notes app\n' } }] } },
      hints: ['A new branch starts from where you are right now.', 'Commit on the branch, then switch to the branch that should receive the work.', 'A merged branch can be deleted with the safe delete option.'],
      checks: [
        gitCheck('main has the feature and the branch is gone', { used: ['(switch\\s+-c|checkout\\s+-b|git\\s+branch\\s+[a-z])'], noDirectCommitsOn: 'main', branch: 'main', files: { 'app.txt': { includes: ['dark mode'] } }, noBranches: ['dark-mode'], clean: true }),
        gitCheck('The commit message says what changed', { meaningfulMessages: 'required' }, { visible: false }),
      ],
      xpReward: 35, coinReward: 5,
    },
    {
      id: 'git-03-fix-branch', objectiveId: 'git-obj-branch-merge', title: 'Fix It on a Branch', mode: 'challenge', language: 'git', skillIds: ['git.branches'], concepts: ['branch', 'merge'], difficulty: 2, context: 'documentation',
      prompt: text('`guide.md` says “recieve” instead of “receive”. Correct the spelling on a new branch called `fix-typo`, merge it into `main`, and clean up the branch afterwards.'),
      expectedBehavior: 'main has the corrected word, the fix was merged, and fix-typo no longer exists.',
      starterCode: '', git: { start: { commits: [{ message: 'Add guide', files: { 'guide.md': 'Devices recieve updates overnight.\n' } }] } },
      hints: ['Keep main untouched while you work: where should the edit happen?', 'Edit, commit on the branch, then return to main and bring the work in.', 'Once merged, the branch has no more use and Git can delete it safely.'],
      checks: [
        gitCheck('main has the corrected spelling', { branch: 'main', files: { 'guide.md': { includes: ['receive'], excludes: ['recieve'] } }, noBranches: ['fix-typo'], clean: true }),
        gitCheck('A separate commit made the fix, and its message explains it', { commitCount: 2, meaningfulMessages: 'required' }),
        gitCheck('The work was done on a branch first', { used: ['(switch\\s+-c|checkout\\s+-b|git\\s+branch\\s+[a-z])', 'merge'], noDirectCommitsOn: 'main' }, { visible: false }),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'git-03-fix-branch-b', objectiveId: 'git-obj-branch-merge', title: 'Correct the Limit on a Branch', mode: 'challenge', language: 'git', skillIds: ['git.branches'], concepts: ['branch', 'merge'], difficulty: 2, context: 'manufacturing',
      prompt: text('`line.cfg` sets the conveyor speed limit to 80, but the safety review says it must be 60. Change it on a new branch named `safety-limit`, merge it into `main`, and delete the branch once it is merged.'),
      expectedBehavior: 'main has limit = 60, the change was merged, and safety-limit no longer exists.',
      starterCode: '', git: { start: { commits: [{ message: 'Add line configuration', files: { 'line.cfg': 'name = packing\nlimit = 80\n' } }] } },
      hints: ['The edit belongs on its own branch, not on main.', 'After committing there, go back to main before merging.', 'Delete the branch only after it has been merged.'],
      checks: [
        gitCheck('main has the new limit', { branch: 'main', files: { 'line.cfg': { includes: ['limit = 60'], excludes: ['limit = 80'] } }, noBranches: ['safety-limit'], clean: true }),
        gitCheck('A separate commit made the change, and its message explains it', { commitCount: 2, meaningfulMessages: 'required' }),
        gitCheck('The work was done on a branch first', { used: ['(switch\\s+-c|checkout\\s+-b|git\\s+branch\\s+[a-z])', 'merge'], noDirectCommitsOn: 'main' }, { visible: false }),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'git-03-isolated', title: 'Experiments Stay Separate', mode: 'challenge', language: 'git', skillIds: ['git.branches'], concepts: ['branch isolation'], difficulty: 3, context: 'research',
      prompt: text('A results file `analysis.txt` is final on `main`. You want to try a different method, but **`main` must not change** until you are sure.', 'Create a branch called `new-method`, change `analysis.txt` there to say “method: bootstrap”, commit it, and then go back to `main` so you can show the colleague who is about to look at the folder the approved version.'),
      expectedBehavior: 'You are on main; main’s analysis.txt is unchanged; the new-method branch has the new method and is not merged.',
      starterCode: '', git: { start: { commits: [{ message: 'Finalise analysis', files: { 'analysis.txt': 'method: t-test\nresult: significant\n' } }] } },
      hints: ['The experiment needs its own line of commits.', 'After committing the experiment, which branch should you be standing on?', 'Do not merge: the point is that main stays as it was.'],
      checks: [
        gitCheck('You are on main, and main is untouched', { branch: 'main', working: { 'analysis.txt': { includes: ['t-test'], excludes: ['bootstrap'] } }, clean: true }),
        gitCheck('The experiment is committed on new-method but not merged', { onBranch: { 'new-method': { files: { 'analysis.txt': { includes: ['bootstrap'] } }, minCommits: 2 } }, notMerged: [{ branch: 'new-method', into: 'main' }] }),
      ],
      xpReward: 65, coinReward: 10,
    },
  ],
  objectives: [
    { id: 'git-obj-branch-merge', title: 'Work on a branch, merge, clean up', summary: 'Make a change on its own branch, merge it into main and delete the branch.' },
  ],
};
