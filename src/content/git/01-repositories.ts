import { text } from '../helpers';
import type { LessonBundle } from '../schema';
import { gitCheck } from './helpers';

export const bundle: LessonBundle = {
  lesson: {
    id: 'git-01-repositories', title: 'A Memory for Your Work', language: 'git', skillId: 'git.basics',
    blurb: 'Repositories, staging, commits, status and log: how Git remembers every version.', prerequisites: [], xpReward: 45,
    reference: {
      title: 'The Git basics loop',
      body: text('Work happens in your **working folder**. `git add` puts changes in the **staging area** (what the next snapshot will contain). `git commit` saves the staged changes as a **commit**: a permanent snapshot with a message.', '`git status` shows where everything is. `git log --oneline` lists the commits, newest first.'),
      example: 'git init\ngit add notes.txt\ngit commit -m "Add project notes"\ngit status\ngit log --oneline',
    },
    steps: [
      {
        kind: 'teach', title: 'Why professionals use version control',
        body: text(
          'Imagine a report with twenty versions called `final`, `final2` and `really-final`. Nobody knows what changed between them, and going back to last Tuesday’s version means hoping you kept it. Software teams cannot work like that: dozens of people change the same project every day.',
          '**Git** is the tool almost every team uses instead. It remembers every saved version of your project (each one is a *commit*), who made it and why, and lets you compare, undo and combine work safely. It works on code, but also on documents, data files and configuration.',
        ),
      },
      {
        kind: 'teach', title: 'Three places your work can be',
        body: text(
          'Git moves your work through three places. The **working folder** is the files you see and edit. The **staging area** is a holding shelf: you choose which changes go on it with `git add`. The **repository** is the permanent history: `git commit` takes everything on the shelf and saves it as one snapshot with a message.',
          'Why the shelf? Because one piece of work is often several unrelated edits. Staging lets you commit them as separate, well-described snapshots. A good message says *what changed and why*: “Add robot arm calibration notes”, not “update”.',
        ),
      },
      {
        kind: 'demo', title: 'The everyday loop', language: 'git',
        body: text('This terminal runs a simulated Git on a tiny folder. Read each command before you run the script, and predict what `git status` will say after the `echo` and again after the `add`.'),
        git: { files: {} },
        code: 'git init\necho "Calibrate the arm weekly" > notes.txt\ngit status\ngit add notes.txt\ngit status\ngit commit -m "Add calibration notes"\ngit status\ngit log --oneline',
        notice: 'The new file started as **untracked**, became **staged** after `git add`, and after the commit the working tree was **clean**. `git log --oneline` now shows one commit with its short id and message.',
      },
      { kind: 'challenge', challengeId: 'git-01-first-repo' },
      { kind: 'challenge', challengeId: 'git-01-two-commits' },
      { kind: 'challenge', challengeId: 'git-01-selective' },
    ],
  },
  challenges: [
    {
      id: 'git-01-first-repo', title: 'Start Tracking a Project', mode: 'learning', language: 'git', skillIds: ['git.basics'], concepts: ['init', 'add', 'commit'], difficulty: 1, context: 'engineering',
      prompt: text('The folder on screen holds one file, `notes.txt`, with ideas for a robot arm. It is not a Git repository yet.', 'Turn the folder into a repository and save `notes.txt` as its first commit, with a message that says what the commit contains.'),
      expectedBehavior: 'The folder is a repository, `notes.txt` is in the first commit, the working tree is clean, and the commit message describes the change.',
      guidedSteps: ['Create the repository with `git init`.', 'Stage the file with `git add notes.txt`.', 'Save it with `git commit -m "your message"`.', 'Check with `git status` that nothing is left over.'],
      starterCode: '', git: { start: { files: { 'notes.txt': 'Ideas for the robot arm\n- longer reach\n- quieter motors\n' } } },
      hints: ['A folder becomes a repository with one command.', 'Nothing is saved until you stage the file and commit it.', 'The message goes in quotes after `-m`.'],
      checks: [
        gitCheck('notes.txt is saved in the first commit', { branch: 'main', files: { 'notes.txt': { includes: ['robot arm'] } }, clean: true }),
        gitCheck('The commit message says what changed', { meaningfulMessages: 'required' }, { visible: false }),
      ],
      xpReward: 30, coinReward: 5,
    },
    {
      id: 'git-01-two-commits', objectiveId: 'git-obj-separate-commits', title: 'Two Changes, Two Commits', mode: 'challenge', language: 'git', skillIds: ['git.basics'], concepts: ['staging', 'commit message'], difficulty: 2, context: 'software',
      prompt: text('A new project folder has two unrelated files: `README.md` (what the project is) and `todo.txt` (tasks for next week). It is not a repository yet.', 'Start tracking it so that the history has exactly two commits: the first contains only `README.md`, the second adds `todo.txt`. Each commit needs a message that says what it adds.'),
      expectedBehavior: 'Two commits in the history; the first has only README.md; HEAD has both files; the working tree is clean.',
      starterCode: '', git: { start: { files: { 'README.md': '# Pump monitor\nReads pump pressure every minute.\n', 'todo.txt': '- add alarm threshold\n- write the wiring guide\n' } } },
      hints: ['Staging decides what goes into each snapshot: you do not have to add everything at once.', 'Stage one file, commit, then stage the other and commit again.', 'Use `git add <file>` for each file instead of `git add .`.'],
      checks: [
        gitCheck('Exactly two commits', { branch: 'main', commitCount: 2, clean: true }),
        gitCheck('The first commit holds only README.md', { rootFiles: { 'README.md': { includes: ['Pump monitor'] }, 'todo.txt': null } }),
        gitCheck('Both files are in the latest commit', { files: { 'README.md': { includes: ['Pump'] }, 'todo.txt': { includes: ['alarm'] } } }, { visible: false }),
        gitCheck('Messages say what each commit adds', { meaningfulMessages: 'required' }, { visible: false }),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'git-01-two-commits-b', objectiveId: 'git-obj-separate-commits', title: 'Lab Notebook, Two Entries', mode: 'challenge', language: 'git', skillIds: ['git.basics'], concepts: ['staging', 'commit message'], difficulty: 2, context: 'research',
      prompt: text('A research group keeps `protocol.md` (how the experiment is run) and `results.csv` (today’s measurements) in a new folder. It is not a repository yet.', 'Track it so the history has exactly two commits: first the protocol alone, then the results. Write a message for each that says what it adds.'),
      expectedBehavior: 'Two commits; the first has only protocol.md; HEAD has both files; nothing left uncommitted.',
      starterCode: '', git: { start: { files: { 'protocol.md': '# Growth protocol\nMeasure plant height at 9:00 daily.\n', 'results.csv': 'day,height_cm\n1,4.2\n2,4.9\n' } } },
      hints: ['Two commits means two separate rounds of staging.', 'Stage the protocol first, commit it, then deal with the results file.', 'Name each file in `git add` so only that file is staged.'],
      checks: [
        gitCheck('Exactly two commits', { branch: 'main', commitCount: 2, clean: true }),
        gitCheck('The first commit holds only protocol.md', { rootFiles: { 'protocol.md': { includes: ['Growth protocol'] }, 'results.csv': null } }),
        gitCheck('Both files are in the latest commit', { files: { 'protocol.md': { includes: ['Growth'] }, 'results.csv': { includes: ['height_cm'] } } }, { visible: false }),
        gitCheck('Messages say what each commit adds', { meaningfulMessages: 'required' }, { visible: false }),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'git-01-selective', objectiveId: 'git-obj-selective-commit', title: 'Commit Only the Fix', mode: 'challenge', language: 'git', skillIds: ['git.basics'], concepts: ['status', 'staging'], difficulty: 2, context: 'operations',
      prompt: text('In a monitoring project you fixed the alert limit in `alerts.cfg`. You also created `scratch.txt` while experimenting: it must not be saved into the project history.', 'Commit the fix with a message that explains it, and leave `scratch.txt` alone (it should stay in your folder, uncommitted).'),
      expectedBehavior: 'The latest commit contains the corrected alerts.cfg and not scratch.txt; scratch.txt is still in the folder.',
      starterCode: '',
      git: { start: { commits: [{ message: 'Add alert configuration', files: { 'alerts.cfg': 'limit = 50\nnotify = ops\n' } }], files: { 'alerts.cfg': 'limit = 80\nnotify = ops\n', 'scratch.txt': 'try a bigger limit?\n' } } },
      hints: ['`git status` shows which files changed and which are new.', 'Staging is per file: you choose what the commit contains.', 'Avoid adding everything with a dot; name the file you want.'],
      checks: [
        gitCheck('The fix is committed', { files: { 'alerts.cfg': { includes: ['limit = 80'] }, 'scratch.txt': null }, commitCount: 2 }),
        gitCheck('scratch.txt is still in the folder, uncommitted', { working: { 'scratch.txt': { includes: ['bigger limit'] } } }),
        gitCheck('The message explains the fix', { meaningfulMessages: 'required' }, { visible: false }),
      ],
      xpReward: 50, coinReward: 8,
    },
    {
      id: 'git-01-selective-b', objectiveId: 'git-obj-selective-commit', title: 'Commit Only the Correction', mode: 'challenge', language: 'git', skillIds: ['git.basics'], concepts: ['status', 'staging'], difficulty: 2, context: 'education',
      prompt: text('A teacher’s course repository has `schedule.md`, where you just corrected a room number, and `draft-quiz.md`, a half-written file you are not ready to share.', 'Commit the correction with a clear message, and keep `draft-quiz.md` out of the history (but still in your folder).'),
      expectedBehavior: 'The latest commit has the corrected schedule and not the draft; the draft is still in the folder.',
      starterCode: '',
      git: { start: { commits: [{ message: 'Add term schedule', files: { 'schedule.md': 'Monday: room 12\nWednesday: room 12\n' } }], files: { 'schedule.md': 'Monday: room 21\nWednesday: room 12\n', 'draft-quiz.md': 'Q1: ???\n' } } },
      hints: ['First look at what Git says has changed.', 'Only staged changes go into a commit.', 'Stage the one file you are committing by name.'],
      checks: [
        gitCheck('The correction is committed', { files: { 'schedule.md': { includes: ['Monday: room 21'] }, 'draft-quiz.md': null }, commitCount: 2 }),
        gitCheck('The draft stays in the folder, uncommitted', { working: { 'draft-quiz.md': { includes: ['Q1'] } } }),
        gitCheck('The message explains the change', { meaningfulMessages: 'required' }, { visible: false }),
      ],
      xpReward: 50, coinReward: 8,
    },
  ],
  objectives: [
    { id: 'git-obj-separate-commits', title: 'Separate commits for separate changes', summary: 'Stage files selectively to build a clean, meaningful history.' },
    { id: 'git-obj-selective-commit', title: 'Commit only what belongs', summary: 'Use status and staging to keep unfinished work out of a commit.' },
  ],
};
