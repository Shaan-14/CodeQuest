/** Grades a Git task by REPOSITORY STATE after replaying the player's commands: which branches exist, what HEAD contains, how history is shaped, what was merged, whether commit messages say something. */
import type { Constraint, GitCheck, GitExpect } from '../../content/schema';
import type { CheckOutcome, GradeResult } from '../runner';
import { replay } from './replay';
import { ancestors, currentBranch, headCommitId, isAncestor } from './repo';
import type { Repo, RepoSnapshot } from './types';

const GENERIC = /^(update|updates|fix|fixes|changes?|stuff|wip|asdf|test|commit|misc|\.+|initial|edit|final|new)( ?\d*)?$/i;

/** A commit message that says WHAT changed: at least 10 characters, more than a single generic word. */
export const isMeaningfulMessage = (m: string): boolean => {
  const first = m.split('\n')[0]!.trim();
  return first.length >= 10 && !GENERIC.test(first) && first.split(/\s+/).length >= 2;
};

function filesMatch(actual: Record<string, string>, expect: NonNullable<GitExpect['files']>): string | null {
  for (const [p, want] of Object.entries(expect)) {
    const got = actual[p];
    if (want === null) { if (got !== undefined) return `${p} should not exist`; continue; }
    if (got === undefined) return `${p} is missing`;
    if (typeof want === 'string') { if (got.trim() !== want.trim()) return `${p} does not have the expected content`; continue; }
    if (want.includes !== undefined && !want.includes.every((s) => got.includes(s))) return `${p} is missing expected content`;
    if (want.excludes !== undefined && want.excludes.some((s) => got.includes(s))) return `${p} still contains ${want.excludes.find((s) => got.includes(s))}`;
  }
  return null;
}

function evaluate(repo: Repo, e: GitExpect, steps: { line: string }[]): string | null {
  const head = headCommitId(repo);
  if (e.branch !== undefined && currentBranch(repo) !== e.branch) return `you should be on the ${e.branch} branch`;
  for (const b of e.branches ?? []) if (!(b in repo.branches)) return `the branch ${b} does not exist`;
  for (const b of e.noBranches ?? []) if (b in repo.branches) return `the branch ${b} should not exist any more`;
  if (e.clean) { const t = head ? repo.commits[head]!.tree : {}; const same = JSON.stringify(Object.entries(repo.index).sort()) === JSON.stringify(Object.entries(t).sort()) && Object.entries(repo.files).every(([p, v]) => repo.index[p] === v) && !repo.merging; if (!same) return 'the working tree is not clean'; }
  if (e.noMergeInProgress && repo.merging) return 'a merge is still in progress';
  if (e.rootFiles) { const root = head ? ancestors(repo, head).map((id) => repo.commits[id]!).find((c) => c.parents.length === 0) : undefined; if (!root) return 'there is no first commit yet'; const bad = filesMatch(root.tree, e.rootFiles); if (bad) return `in the very first commit: ${bad}`; }
  if (e.files) { const t = head ? repo.commits[head]!.tree : {}; const bad = filesMatch(t, e.files); if (bad) return `in the latest commit: ${bad}`; }
  if (e.working) { const bad = filesMatch(repo.files, e.working); if (bad) return `in your working files: ${bad}`; }
  for (const [branch, want] of Object.entries(e.onBranch ?? {})) {
    const tip = repo.branches[branch]; if (!tip) return `the branch ${branch} does not exist`;
    const tree = repo.commits[tip]!.tree;
    if (want.files) { const bad = filesMatch(tree, want.files); if (bad) return `on ${branch}: ${bad}`; }
    const list = ancestors(repo, tip).map((id) => repo.commits[id]!);
    if (want.commits !== undefined && list.length !== want.commits) return `${branch} should have ${want.commits} commits, it has ${list.length}`;
    if (want.minCommits !== undefined && list.length < want.minCommits) return `${branch} should have at least ${want.minCommits} commits`;
    for (const re of want.messages ?? []) if (!list.some((c) => new RegExp(re, 'i').test(c.message))) return `no commit on ${branch} has a message matching /${re}/`;
  }
  for (const m of e.merged ?? []) { const a = repo.branches[m.branch]; const b = repo.branches[m.into]; if (!a || !b) return `${!a ? m.branch : m.into} does not exist`; if (!isAncestor(repo, a, b)) return `${m.branch} is not merged into ${m.into}`; }
  for (const m of e.notMerged ?? []) { const a = repo.branches[m.branch]; const b = repo.branches[m.into]; if (a && b && isAncestor(repo, a, b)) return `${m.branch} should not be merged into ${m.into} yet`; }
  if (e.mergeCommitOn) { const tip = repo.branches[e.mergeCommitOn]; if (!tip || !ancestors(repo, tip).some((id) => repo.commits[id]!.parents.length > 1)) return `${e.mergeCommitOn} should contain a merge commit`; }
  if (e.noMergeCommitOn) { const tip = repo.branches[e.noMergeCommitOn]; if (tip && ancestors(repo, tip).some((id) => repo.commits[id]!.parents.length > 1)) return `${e.noMergeCommitOn} should have a linear history (no merge commit)`; }
  if (e.noConflictMarkers) { const bad = Object.entries(repo.files).find(([, v]) => /^(<<<<<<<|=======|>>>>>>>)/m.test(v)); if (bad) return `${bad[0]} still has conflict markers`; const t = head ? repo.commits[head]!.tree : {}; const bt = Object.entries(t).find(([, v]) => /^(<<<<<<<|>>>>>>>)/m.test(v)); if (bt) return `${bt[0]} was committed with conflict markers`; }
  for (const t of e.tags ?? []) if (!(t in repo.tags)) return `the tag ${t} does not exist`;
  for (const t of e.tagAtHead ?? []) if (!head || repo.tags[t] !== head) return `the tag ${t} should label the current latest commit`;
  if (e.noDirectCommitsOn) { const direct = Object.values(repo.commits).find((c) => c.author === 'You' && c.parents.length <= 1 && c.onBranch === e.noDirectCommitsOn); if (direct) return `you committed directly on ${e.noDirectCommitsOn}: “${direct.message.split('\n')[0]}”`; }
  if (e.meaningfulMessages) { const own = Object.values(repo.commits).filter((c) => c.author === 'You' && !/^Merge /.test(c.message) && !/^Revert /.test(c.message)); const bad = own.find((c) => !isMeaningfulMessage(c.message)); if (bad) return `the commit message “${bad.message.split('\n')[0]}” does not say what changed`; if (!own.length && e.meaningfulMessages === 'required') return 'make at least one commit with a message that says what changed'; }
  for (const [branch, want] of Object.entries(e.remote ?? {})) {
    const tip = repo.origin.branches[branch];
    if (want === false) { if (tip) return `${branch} should not be on origin`; continue; }
    if (!tip) return `${branch} has not been pushed to origin`;
    if (want === 'synced' && repo.branches[branch] !== tip) return `${branch} on origin is different from your local ${branch}`;
  }
  if (e.prs) {
    const prs = repo.origin.prs.filter((p) => !e.prs!.onlyNew || p.number > (e.prs!.after ?? 0));
    if (e.prs.count !== undefined && prs.length !== e.prs.count) return `expected ${e.prs.count} pull request(s), found ${prs.length}`;
    for (const want of e.prs.any ?? []) { const hit = prs.find((p) => (!want.head || p.head === want.head) && (!want.base || p.base === want.base) && (!want.state || p.state === want.state) && (!want.title || new RegExp(want.title, 'i').test(p.title)) && (!want.reviewed || p.reviews.length > 0)); if (!hit) return `no pull request matches ${JSON.stringify(want)}`; }
  }
  for (const re of e.used ?? []) if (!steps.some((s) => new RegExp(re, 'i').test(s.line))) return `you did not use a command matching /${re}/`;
  for (const re of e.notUsed ?? []) if (steps.some((s) => new RegExp(re, 'i').test(s.line))) return `you should not use a command matching /${re}/`;
  if (e.headMessage && !(head && new RegExp(e.headMessage, 'i').test(repo.commits[head]!.message))) return 'the latest commit message is not what is expected';
  if (e.headParents !== undefined && (head ? repo.commits[head]!.parents.length : 0) !== e.headParents) return `HEAD should have ${e.headParents} parent(s)`;
  if (e.commitCount !== undefined) { const n = head ? ancestors(repo, head).length : 0; if (n !== e.commitCount) return `there should be ${e.commitCount} commits in the current history, there are ${n}`; }
  return null;
}

export function gradeGit(code: string, start: RepoSnapshot, checks: GitCheck[], constraints: Constraint[] = []): GradeResult {
  const { repo, steps } = replay(start, code);
  const outcomes: CheckOutcome[] = checks.map((c) => {
    const base = { name: c.name, visible: c.visible !== false };
    try {
      const err = evaluate(repo, c.expect, steps);
      return err === null ? { ...base, passed: true, message: '' } : { ...base, passed: false, message: c.feedback ?? `Not yet: ${err}.` };
    } catch (e) { return { ...base, passed: false, message: `This check could not run: ${String(e)}` }; }
  });
  const cons = constraints.map((k) => {
    const m = /^git:(.*)$/.exec(k.node);
    const used = m ? steps.some((s) => new RegExp(m[1]!, 'i').test(s.line)) : true;
    return { message: k.message, passed: k.type === 'requires' ? used : !used };
  });
  return { passed: outcomes.every((o) => o.passed) && cons.every((k) => k.passed), error: '', timedOut: false, checks: outcomes, constraints: cons };
}
