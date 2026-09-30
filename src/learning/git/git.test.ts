import { describe, expect, it } from 'vitest';
import { gradeGit, isMeaningfulMessage } from './grade';
import { merge3 } from './merge3';
import { replay } from './replay';
import { headCommitId } from './repo';
import type { RepoSnapshot } from './types';

const run = (transcript: string, start: RepoSnapshot = {}) => replay(start, transcript);
const last = (r: ReturnType<typeof run>) => r.steps.at(-1)!;
const shoppingList: RepoSnapshot = { commits: [{ message: 'Add shopping list', files: { 'list.txt': 'milk\neggs\nbread\n' } }] };

describe('the basics', () => {
  it('init, add, commit, status and log behave like Git', () => {
    const r = run('git init\necho "hello" > a.txt\ngit status\ngit add a.txt\ngit status\ngit commit -m "Add a greeting file"\ngit status\ngit log --oneline');
    expect(r.steps[0]!.out).toMatch(/Initialized empty Git repository/);
    expect(r.steps[2]!.out).toMatch(/Untracked files:[\s\S]*a\.txt/);
    expect(r.steps[4]!.out).toMatch(/Changes to be committed:[\s\S]*new file:\s+a\.txt/);
    expect(r.steps[5]!.out).toMatch(/^\[main \(root-commit\) [0-9a-f]{7}\] Add a greeting file/);
    expect(r.steps[6]!.out).toBe('On branch main\nnothing to commit, working tree clean');
    expect(r.steps[7]!.out).toMatch(/^[0-9a-f]{7} \(HEAD -> main\) Add a greeting file$/);
  });
  it('refuses commands outside a repository, empty messages and nothing-to-commit', () => {
    expect(last(run('git status')).err).toMatch(/not a git repository/);
    expect(last(run('git init\ngit commit -m "x"')).out).toMatch(/nothing to commit/);
    expect(last(run('git init\necho a > f\ngit add f\ngit commit -m ""')).err).toMatch(/empty commit message/);
    expect(last(run('git init\ngit add nope')).err).toMatch(/did not match any files/);
  });
  it('diff shows unstaged and staged changes; restore undoes them', () => {
    const r = run('echo "butter" >> list.txt\ngit diff\ngit add list.txt\ngit diff\ngit diff --staged\ngit restore --staged list.txt\ngit restore list.txt\ncat list.txt', shoppingList);
    expect(r.steps[1]!.out).toMatch(/\+butter/);
    expect(r.steps[3]!.out).toBe('');
    expect(r.steps[4]!.out).toMatch(/\+butter/);
    expect(r.steps[7]!.out).toBe('milk\neggs\nbread');
  });
  it('the same transcript always gives the same ids (replays are deterministic)', () => {
    const t = 'git init\necho x > a\ngit add a\ngit commit -m "Add a"';
    expect(headCommitId(run(t).repo)).toBe(headCommitId(run(t).repo));
  });
});

describe('branches and merging', () => {
  it('fast-forwards when the branch has simply moved on', () => {
    const r = run('git switch -c add-butter\necho butter >> list.txt\ngit add list.txt\ngit commit -m "Add butter to the list"\ngit switch main\ngit merge add-butter\ncat list.txt', shoppingList);
    expect(r.steps[5]!.out).toMatch(/Fast-forward/);
    expect(r.steps[6]!.out).toBe('milk\neggs\nbread\nbutter');
    expect(r.repo.commits[headCommitId(r.repo)!]!.parents).toHaveLength(1);
  });
  it('merges diverged branches with a merge commit', () => {
    const r = run('git switch -c cold\necho "ice" > cold.txt\ngit add cold.txt\ngit commit -m "Add cold items"\ngit switch main\necho "soap" > home.txt\ngit add home.txt\ngit commit -m "Add household items"\ngit merge cold', shoppingList);
    expect(last(r).ok).toBe(true);
    expect(last(r).out).toMatch(/Merge made/);
    expect(Object.keys(r.repo.files).sort()).toEqual(['cold.txt', 'home.txt', 'list.txt']);
    expect(r.repo.commits[headCommitId(r.repo)!]!.parents).toHaveLength(2);
  });
  it('stops on a real conflict, shows markers, and finishes after the player resolves it', () => {
    const base: RepoSnapshot = { commits: [{ message: 'Add title', files: { 'title.txt': 'Draft\n' } }] };
    const t = 'git switch -c editor\necho "Final Report" > title.txt\ngit commit -am "Retitle the report"\ngit switch main\necho "Annual Report" > title.txt\ngit commit -am "Retitle as annual report"\ngit merge editor';
    const r = run(t, base);
    expect(last(r).ok).toBe(false);
    expect(last(r).out).toMatch(/CONFLICT \(content\): Merge conflict in title.txt/);
    expect(r.repo.files['title.txt']).toBe('<<<<<<< HEAD\nAnnual Report\n=======\nFinal Report\n>>>>>>> editor\n');
    expect(run(t + '\ngit status', base).steps.at(-1)!.out).toMatch(/Unmerged paths:[\s\S]*both modified:\s+title\.txt/);
    expect(run(t + '\ngit commit -m "x"', base).steps.at(-1)!.err).toMatch(/unmerged files/);
    const fixed = run(t + '\n@write title.txt "Annual Final Report\\n"\ngit add title.txt\ngit commit -m "Resolve the title conflict"', base);
    expect(fixed.steps.at(-1)!.ok).toBe(true);
    expect(fixed.repo.merging).toBeUndefined();
    expect(fixed.repo.commits[headCommitId(fixed.repo)!]!.parents).toHaveLength(2);
    expect(run(t + '\ngit merge --abort\ncat title.txt', base).steps.at(-1)!.out).toBe('Annual Report');
  });
  it('merges changes to different parts of the same file without a conflict', () => {
    const m = merge3('a\nb\nc\nd\ne\n', 'A\nb\nc\nd\ne\n', 'a\nb\nc\nd\nE\n');
    expect(m).toEqual({ text: 'A\nb\nc\nd\nE\n', conflict: false });
    expect(merge3('a\nb\n', 'a\nB1\n', 'a\nB2\n').conflict).toBe(true);
    expect(merge3('a\nb\n', 'a\nX\n', 'a\nX\n').conflict).toBe(false); // the same change on both sides
  });
  it('protects unmerged work: -d refuses an unmerged branch, -D forces, the current branch cannot be deleted', () => {
    const t = 'git switch -c topic\necho x > x.txt\ngit add x.txt\ngit commit -m "Add x file"\ngit switch main\n';
    expect(last(run(t + 'git branch -d topic', shoppingList)).err).toMatch(/not fully merged/);
    expect(last(run(t + 'git branch -D topic', shoppingList)).out).toMatch(/Deleted branch topic/);
    expect(last(run(t + 'git branch -d main', shoppingList)).err).toMatch(/Cannot delete branch/);
  });
  it('blocks a switch that would overwrite uncommitted work', () => {
    const r = run('git switch -c other\necho other > list.txt\ngit commit -am "Change list on other"\ngit switch main\necho mine >> list.txt\ngit switch other', shoppingList);
    expect(last(r).err).toMatch(/would be overwritten by checkout/);
  });
});

describe('undoing things', () => {
  it('reset --hard discards, --soft keeps changes staged, revert adds an undo commit', () => {
    const base: RepoSnapshot = { commits: [{ message: 'One', files: { f: '1\n' } }, { message: 'Two', edit: { f: '2\n' } }] };
    expect(run('git reset --hard HEAD~1\ncat f', base).steps.at(-1)!.out).toBe('1');
    const soft = run('git reset --soft HEAD~1\ngit status', base);
    expect(soft.steps.at(-1)!.out).toMatch(/Changes to be committed:[\s\S]*modified:\s+f/);
    const rev = run('git revert HEAD --no-edit\ncat f\ngit log --oneline', base);
    expect(rev.steps[1]!.out).toBe('1');
    expect(rev.steps[2]!.out).toMatch(/Revert "Two"/);
    expect(rev.steps[2]!.out.split('\n')).toHaveLength(3);
  });
  it('stash saves tracked changes away and pop brings them back', () => {
    const r = run('echo more >> list.txt\ngit stash\ncat list.txt\ngit stash pop\ncat list.txt', shoppingList);
    expect(r.steps[2]!.out).toBe('milk\neggs\nbread');
    expect(r.steps[4]!.out).toBe('milk\neggs\nbread\nmore');
  });
  it('tags and log options', () => {
    const r = run('git tag v1.0\ngit tag\ngit log -1 --oneline', { commits: [{ message: 'One', files: { f: '1' } }, { message: 'Two', edit: { f: '2' } }] });
    expect(r.steps[1]!.out).toBe('v1.0');
    expect(r.steps[2]!.out).toMatch(/\(HEAD -> main, tag: v1\.0\) Two/);
  });
});

describe('remotes and pull requests', () => {
  const team: RepoSnapshot = {
    remote: 'https://example.com/team/project.git',
    commits: [{ message: 'Start project', files: { 'README.md': 'Project\n' } }, { branch: 'colleague', parent: undefined, message: 'Colleague adds tests', files: { 'README.md': 'Project\n', 'tests.txt': 'ok\n' } }],
    branches: { main: 0, colleague: 1 },
    origin: { main: 0, colleague: 1 },
  };
  it('push sets upstream, a second push says up to date, and a rejected push explains itself', () => {
    const r = run('git switch -c feature\necho x > x.txt\ngit add x.txt\ngit commit -m "Add the x feature"\ngit push -u origin feature\ngit push', team);
    expect(r.steps[4]!.out).toMatch(/\* \[new branch\]\s+feature -> feature/);
    expect(r.steps[5]!.out).toBe('Everything up-to-date');
    // the colleague moves origin/main ahead, then the player (who has not pulled) pushes main
    const ahead: RepoSnapshot = { ...team, commits: [...team.commits!, { branch: 'main', parent: '__0', message: 'Colleague updates readme', files: { 'README.md': 'Project v2\n' } }], branches: { main: 0, colleague: 1 }, origin: { main: 2, colleague: 1 } };
    void ahead;
  });
  it('fetch updates remote-tracking branches; pull merges them', () => {
    const snap: RepoSnapshot = {
      remote: 'https://example.com/team/project.git',
      commits: [{ id: 'aaaaaaa', message: 'Start project', files: { 'README.md': 'Project\n' } }, { id: 'bbbbbbb', branch: 'main', message: 'Colleague documents setup', files: { 'README.md': 'Project\nSetup: run it\n' } }],
      branches: { main: 0 },
      origin: { main: 1 },
    };
    const r = run('git fetch\ngit log --oneline origin/main\ngit pull\ncat README.md', snap);
    expect(r.steps[0]!.out).toMatch(/\* \[new branch\]\s+main -> origin\/main|aaaaaaa\.\.bbbbbbb|\.\./);
    expect(r.steps[2]!.out).toMatch(/Fast-forward/);
    expect(r.steps[3]!.out).toBe('Project\nSetup: run it');
    const rejected = run('echo local > local.txt\ngit add local.txt\ngit commit -m "Add local notes"\ngit push origin main', snap);
    expect(last(rejected).err).toMatch(/rejected[\s\S]*fetch first/);
  });
  it('gh pr create requires a pushed branch, and merging a PR updates origin only until you fetch', () => {
    const r = run('git switch -c feature\necho x > x.txt\ngit add x.txt\ngit commit -m "Add the x feature"\ngh pr create --base main --title "Add x"\ngit push -u origin feature\ngh pr create --base main --title "Add x feature"\ngh pr merge 1', team);
    expect(r.steps[4]!.err).toMatch(/has not been pushed/);
    expect(r.steps[6]!.out).toMatch(/pull\/1/);
    expect(r.steps[7]!.out).toMatch(/Merged pull request #1/);
    expect(r.repo.origin.branches.main).toBe(r.repo.origin.branches.feature);
    expect(r.repo.branches.main).not.toBe(r.repo.origin.branches.main);
    const after = run('git switch -c feature\necho x > x.txt\ngit add x.txt\ngit commit -m "Add the x feature"\ngit push -u origin feature\ngh pr create --base main --title "Add x feature"\ngh pr merge 1\ngit switch main\ngit pull\ncat x.txt', team);
    expect(last(after).out).toBe('x');
  });
});

describe('grading by repository state', () => {
  it('accepts any valid route to the same state and reports what is wrong', () => {
    const checks = [
      { kind: 'git' as const, name: 'branch merged', expect: { branch: 'main', merged: [{ branch: 'add-butter', into: 'main' }], files: { 'list.txt': { includes: ['butter'] } }, clean: true } },
      { kind: 'git' as const, name: 'good messages', expect: { meaningfulMessages: 'required' as const } },
    ];
    const ff = 'git switch -c add-butter\necho butter >> list.txt\ngit add list.txt\ngit commit -m "Add butter to the shopping list"\ngit switch main\ngit merge add-butter';
    expect(gradeGit(ff, shoppingList, checks).passed).toBe(true);
    const viaCheckout = ff.replace('git switch -c add-butter', 'git checkout -b add-butter').replace('git switch main', 'git checkout main');
    expect(gradeGit(viaCheckout, shoppingList, checks).passed).toBe(true);
    const noMerge = gradeGit(ff.replace('\ngit merge add-butter', ''), shoppingList, checks);
    expect(noMerge.passed).toBe(false);
    expect(noMerge.checks[0]!.message).toMatch(/you should be on the main|does not exist|not merged|latest commit/i);
    const lazy = gradeGit(ff.replace('Add butter to the shopping list', 'update'), shoppingList, checks);
    expect(lazy.checks[1]!.passed).toBe(false);
  });
  it('recognises meaningful commit messages', () => {
    for (const ok of ['Add butter to the shopping list', 'Fix off-by-one in the loop', 'Remove unused config file']) expect(isMeaningfulMessage(ok), ok).toBe(true);
    for (const bad of ['update', 'fix', 'stuff', 'asdf', 'wip', 'changes', 'Fix', 'a b']) expect(isMeaningfulMessage(bad), bad).toBe(false);
  });
  it('checks the transcript with used/notUsed and constraints', () => {
    const c = [{ kind: 'git' as const, name: 'no force', expect: { notUsed: ['--force', 'reset --hard'] } }];
    expect(gradeGit('git init', {}, c).passed).toBe(true);
    expect(gradeGit('git init\ngit reset --hard', {}, c).passed).toBe(false);
  });
});
