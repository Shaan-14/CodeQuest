/**
 * A faithful-enough Git for teaching: real semantics for the commands the curriculum uses (init, add, commit, status, log,
 * diff, branch, switch/checkout, merge with real three-way conflicts, restore, reset, revert, stash, tag, remote, fetch,
 * push, pull) plus a simulated `gh` for pull requests and a tiny shell (echo > file, cat, ls, rm, touch, mv).
 * Everything is deterministic and pure JSON, so a player's transcript can be replayed and graded by repository STATE.
 */
import { ancestors, currentBranch, headCommitId, isAncestor, makeCommit, mergeBase, resolveRev } from './repo';
import { joinLines, merge3, splitLines, unifiedDiff } from './merge3';
import type { CmdResult, Repo } from './types';

const ok = (out = ''): CmdResult => ({ out, err: '', ok: true });
const fail = (err: string): CmdResult => ({ out: '', err, ok: false });
const NOT_REPO = 'fatal: not a git repository (or any of the parent directories): .git';

/** Splits a shell line into words, honouring quotes, and separates unquoted `>` / `>>` redirections. */
export function tokenize(line: string): { words: string[]; redirect?: { op: '>' | '>>'; path: string } } | string {
  const words: string[] = [];
  let cur = ''; let has = false; let q: '"' | "'" | null = null;
  const push = () => { if (has) { words.push(cur); cur = ''; has = false; } };
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (q) { if (ch === q) q = null; else if (ch === '\\' && q === '"' && '"\\'.includes(line[i + 1] ?? '')) cur += line[++i]; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { q = ch; has = true; continue; }
    if (/\s/.test(ch)) { push(); continue; }
    if (ch === '>') { push(); if (line[i + 1] === '>') { words.push('>>'); i++; } else words.push('>'); continue; }
    cur += ch; has = true;
  }
  if (q) return 'unterminated quote';
  push();
  const ri = words.findIndex((w) => w === '>' || w === '>>');
  if (ri >= 0) {
    const path = words[ri + 1];
    if (!path) return 'syntax error: expected a file name after >';
    return { words: [...words.slice(0, ri), ...words.slice(ri + 2)], redirect: { op: words[ri] as '>' | '>>', path } };
  }
  return { words };
}

const treeOfHead = (r: Repo): Record<string, string> => { const id = headCommitId(r); return id ? r.commits[id]!.tree : {}; };
const eq = (a: Record<string, string>, b: Record<string, string>): boolean => { const ka = Object.keys(a); return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]); };
const short = (id: string) => id.slice(0, 7);
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

function refsAt(r: Repo, id: string): string {
  const names: string[] = [];
  const cur = currentBranch(r);
  if (headCommitId(r) === id) names.push(cur ? `HEAD -> ${cur}` : 'HEAD');
  for (const [b, tip] of Object.entries(r.branches)) if (tip === id && b !== cur) names.push(b);
  for (const [t, tip] of Object.entries(r.tags)) if (tip === id) names.push(`tag: ${t}`);
  return names.length ? ` (${names.join(', ')})` : '';
}

/** Changes between two trees: path -> 'A' | 'M' | 'D'. */
function changes(from: Record<string, string>, to: Record<string, string>): Record<string, 'A' | 'M' | 'D'> {
  const out: Record<string, 'A' | 'M' | 'D'> = {};
  for (const p of new Set([...Object.keys(from), ...Object.keys(to)])) {
    if (!(p in from)) out[p] = 'A'; else if (!(p in to)) out[p] = 'D'; else if (from[p] !== to[p]) out[p] = 'M';
  }
  return out;
}

function statusText(r: Repo, short_ = false): string {
  const head = treeOfHead(r);
  const staged = changes(head, r.index);
  const unstaged = changes(r.index, Object.fromEntries(Object.entries(r.files).filter(([p]) => p in r.index)));
  for (const p of Object.keys(r.index)) if (!(p in r.files)) unstaged[p] = 'D';
  const untracked = Object.keys(r.files).filter((p) => !(p in r.index)).sort();
  const conflicts = r.merging?.conflicts ?? [];
  const lines: string[] = [];
  const branch = currentBranch(r);
  if (short_) {
    const all = new Set([...Object.keys(staged), ...Object.keys(unstaged), ...untracked, ...conflicts]);
    for (const p of [...all].sort()) {
      if (conflicts.includes(p)) lines.push(`UU ${p}`);
      else if (untracked.includes(p)) lines.push(`?? ${p}`);
      else lines.push(`${staged[p] ?? ' '}${unstaged[p] ?? ' '} ${p}`);
    }
    return lines.join('\n');
  }
  lines.push(branch ? `On branch ${branch}` : `HEAD detached at ${short(headCommitId(r) ?? '')}`);
  if (r.merging) {
    lines.push('You have unmerged paths.', '  (fix conflicts and run "git commit")', '  (use "git merge --abort" to abort the merge)', '');
  }
  const stagedPaths = Object.keys(staged).filter((p) => !conflicts.includes(p)).sort();
  if (stagedPaths.length) {
    lines.push('Changes to be committed:', '  (use "git restore --staged <file>..." to unstage)');
    for (const p of stagedPaths) lines.push(`\t${staged[p] === 'A' ? 'new file:   ' : staged[p] === 'D' ? 'deleted:    ' : 'modified:   '}${p}`);
    lines.push('');
  }
  if (conflicts.length) {
    lines.push('Unmerged paths:', '  (use "git add <file>..." to mark resolution)');
    for (const p of conflicts.slice().sort()) lines.push(`\tboth modified:   ${p}`);
    lines.push('');
  }
  const unstagedPaths = Object.keys(unstaged).filter((p) => !conflicts.includes(p)).sort();
  if (unstagedPaths.length) {
    lines.push('Changes not staged for commit:', '  (use "git add <file>..." to update what will be committed)', '  (use "git restore <file>..." to discard changes in working directory)');
    for (const p of unstagedPaths) lines.push(`\t${unstaged[p] === 'D' ? 'deleted:    ' : 'modified:   '}${p}`);
    lines.push('');
  }
  if (untracked.length) { lines.push('Untracked files:', '  (use "git add <file>..." to include in what will be committed)'); for (const p of untracked) lines.push(`\t${p}`); lines.push(''); }
  if (!stagedPaths.length && !unstagedPaths.length && !untracked.length && !conflicts.length) lines.push(headCommitId(r) ? 'nothing to commit, working tree clean' : 'nothing to commit (create/copy files and use "git add" to track)');
  else if (!stagedPaths.length && !conflicts.length) lines.push(unstagedPaths.length ? 'no changes added to commit (use "git add" and/or "git commit -a")' : 'nothing added to commit but untracked files present (use "git add" to track)');
  return lines.join('\n').replace(/\n+$/, '');
}

/** Puts `target` into the working tree and index, carrying local changes that do not touch differing files. */
function checkoutTree(r: Repo, target: Record<string, string>): string | null {
  const cur = treeOfHead(r);
  const blocked: string[] = [];
  for (const p of new Set([...Object.keys(cur), ...Object.keys(target)])) {
    if (cur[p] === target[p]) continue;
    const dirty = (r.files[p] !== cur[p]) || (r.index[p] !== cur[p]);
    if (dirty && p in cur) blocked.push(p);
    else if (p in r.files && !(p in cur) && r.files[p] !== target[p]) blocked.push(p); // an untracked file would be overwritten
  }
  if (blocked.length) return `error: Your local changes to the following files would be overwritten by checkout:\n${blocked.sort().map((p) => `\t${p}`).join('\n')}\nPlease commit your changes or stash them before you switch branches.\nAborting`;
  const files = { ...r.files }; const index: Record<string, string> = {};
  for (const p of new Set([...Object.keys(cur), ...Object.keys(target)])) {
    if (cur[p] === target[p]) { if (p in r.index) index[p] = r.index[p]!; continue; }
    if (p in target) { files[p] = target[p]!; index[p] = target[p]!; } else delete files[p];
  }
  for (const p of Object.keys(target)) if (!(p in index) && cur[p] === target[p] && p in r.files) index[p] = target[p]!;
  r.files = files; r.index = index;
  return null;
}

function commitLine(r: Repo, id: string, root: boolean, msg: string, before: Record<string, string>, after: Record<string, string>): string {
  const ch = changes(before, after);
  let ins = 0; let del = 0;
  for (const [p, k] of Object.entries(ch)) {
    const a = splitLines(before[p] ?? ''); const b = splitLines(after[p] ?? '');
    if (k === 'A') ins += b.length; else if (k === 'D') del += a.length; else { const set = new Set(a); ins += b.filter((l) => !set.has(l)).length; const sb = new Set(b); del += a.filter((l) => !sb.has(l)).length; }
  }
  const n = Object.keys(ch).length;
  const parts = [plural(n, 'file') + ' changed']; if (ins) parts.push(plural(ins, 'insertion') + '(+)'); if (del) parts.push(plural(del, 'deletion') + '(-)');
  return `[${currentBranch(r) ?? 'detached HEAD'}${root ? ' (root-commit)' : ''} ${short(id)}] ${msg.split('\n')[0]}\n ${parts.join(', ')}`;
}

function logLines(r: Repo, tips: string[], opts: { oneline: boolean; n?: number; graph: boolean; exclude?: string }): string {
  const seen = new Set<string>();
  const excl = new Set(opts.exclude ? ancestors(r, opts.exclude) : []);
  for (const t of tips) for (const id of ancestors(r, t)) if (!excl.has(id)) seen.add(id);
  let list = [...seen].map((id) => r.commits[id]!).sort((a, b) => b.order - a.order);
  if (opts.n !== undefined) list = list.slice(0, opts.n);
  const out: string[] = [];
  for (const c of list) {
    const mark = opts.graph ? (c.parents.length > 1 ? '*   ' : '* ') : '';
    if (opts.oneline) out.push(`${mark}${short(c.id)}${refsAt(r, c.id)} ${c.message.split('\n')[0]}`);
    else {
      out.push(`${mark}commit ${c.id.padEnd(40, '0')}${refsAt(r, c.id)}`);
      if (c.parents.length > 1) out.push(`Merge: ${c.parents.map(short).join(' ')}`);
      out.push(`Author: ${c.author} <${c.author.toLowerCase().replace(/\s+/g, '.')}@example.com>`, `Date:   Mon Jan ${String(1 + (c.order % 28)).padStart(2, ' ')} 10:${String(c.order % 60).padStart(2, '0')}:00 2024 +0000`, '', ...c.message.split('\n').map((l) => `    ${l}`), '');
    }
  }
  return out.join('\n').replace(/\n+$/, '');
}

function conflictText(path: string, repoBranch: string, theirs: string): string { void path; void repoBranch; return theirs; }

/** Three-way merge of `theirs` into HEAD. Returns messages; leaves `r.merging` when conflicts remain. */
function doMerge(r: Repo, theirsRef: string, label: string, noFf: boolean, message?: string): CmdResult {
  const ours = headCommitId(r);
  const theirs = resolveRev(r, theirsRef);
  if (!theirs) return fail(`merge: ${theirsRef} - not something we can merge`);
  if (!ours) return fail('fatal: cannot merge into an empty branch in this simulator: make a first commit');
  if (ours === theirs || isAncestor(r, theirs, ours)) return ok('Already up to date.');
  const dirtyTracked = !eq(r.index, treeOfHead(r)) || Object.keys(r.index).some((p) => r.files[p] !== r.index[p]);
  if (isAncestor(r, ours, theirs) && !noFf) {
    if (dirtyTracked) return fail('error: Your local changes would be overwritten by merge.\nPlease commit your changes or stash them before you merge.\nAborting');
    const err = checkoutTree(r, r.commits[theirs]!.tree);
    if (err) return fail(err);
    if ('branch' in r.head) r.branches[r.head.branch] = theirs; else r.head = { detached: theirs };
    const ch = Object.keys(changes(r.commits[ours]!.tree, r.commits[theirs]!.tree)).length;
    return ok(`Updating ${short(ours)}..${short(theirs)}\nFast-forward\n ${plural(ch, 'file')} changed`);
  }
  if (dirtyTracked) return fail('error: Your local changes would be overwritten by merge.\nPlease commit your changes or stash them before you merge.\nAborting');
  const base = mergeBase(r, ours, theirs);
  const B = base ? r.commits[base]!.tree : {}; const O = r.commits[ours]!.tree; const T = r.commits[theirs]!.tree;
  const tree: Record<string, string> = {}; const files = { ...r.files }; const conflicts: string[] = []; const msgs: string[] = [];
  for (const p of [...new Set([...Object.keys(B), ...Object.keys(O), ...Object.keys(T)])].sort()) {
    const b = B[p]; const o = O[p]; const t = T[p];
    if (o === t) { if (o !== undefined) tree[p] = o; continue; }
    if (b === o) { if (t === undefined) { delete files[p]; } else { tree[p] = t; files[p] = t; } continue; }
    if (b === t) { if (o !== undefined) tree[p] = o; continue; }
    if (o === undefined || t === undefined) { // modify/delete
      const kept = (o ?? t)!; tree[p] = o ?? kept; files[p] = kept; conflicts.push(p); msgs.push(`CONFLICT (modify/delete): ${p} deleted in ${o === undefined ? 'HEAD' : label} and modified in ${o === undefined ? label : 'HEAD'}.`); continue;
    }
    msgs.push(`Auto-merging ${p}`);
    const m = merge3(b ?? '', o, t, 'HEAD', label);
    files[p] = m.text; tree[p] = m.conflict ? o : m.text;
    if (m.conflict) { conflicts.push(p); msgs.push(`CONFLICT (content): Merge conflict in ${p}`); }
  }
  r.files = files;
  if (conflicts.length) {
    r.index = { ...tree };
    r.merging = { branch: label, theirs, conflicts };
    return { out: msgs.join('\n'), err: 'Automatic merge failed; fix conflicts and then commit the result.', ok: false };
  }
  r.index = { ...tree };
  const into = currentBranch(r);
  const msg = message ?? `Merge ${label.includes('/') ? `remote-tracking branch '${label}'` : `branch '${label}'`}${into && into !== 'main' ? ` into ${into}` : ''}`;
  const c = makeCommit(r, [ours, theirs], msg, tree);
  if ('branch' in r.head) r.branches[r.head.branch] = c.id; else r.head = { detached: c.id };
  return ok(`${msgs.join('\n')}${msgs.length ? '\n' : ''}Merge made by the 'ort' strategy.\n ${plural(Object.keys(changes(O, tree)).length, 'file')} changed`);
}

function pathspecs(r: Repo, args: string[]): string[] | string {
  const out: string[] = [];
  for (const a of args) {
    if (a === '.' || a === ':/') { out.push(...new Set([...Object.keys(r.files), ...Object.keys(r.index)])); continue; }
    const hit = a in r.files || a in r.index || Object.keys(r.files).some((p) => p.startsWith(a.endsWith('/') ? a : a + '/'));
    if (!hit) return `fatal: pathspec '${a}' did not match any files`;
    out.push(...[...new Set([...Object.keys(r.files), ...Object.keys(r.index)])].filter((p) => p === a || p.startsWith(a.endsWith('/') ? a : a + '/')));
  }
  return out;
}

function gitCommand(r: Repo, argv: string[]): CmdResult {
  const [sub, ...args] = argv;
  if (!sub) return ok('usage: git <command> [<args>]\nCommands: init add commit status log diff show branch switch checkout merge restore reset revert stash tag remote fetch push pull config');
  if (sub === 'init') { if (r.initialized) return ok('Reinitialized existing Git repository in /work/project/.git/'); r.initialized = true; r.head = { branch: args.includes('-b') ? (args[args.indexOf('-b') + 1] ?? 'main') : 'main' }; return ok('Initialized empty Git repository in /work/project/.git/'); }
  if (sub === 'config') {
    const rest = args.filter((a) => !a.startsWith('--'));
    if (args.includes('--list') || args.includes('-l')) return ok(Object.entries(r.config).map(([k, v]) => `${k}=${v}`).join('\n'));
    if (rest.length >= 2) { r.config[rest[0]!] = rest[1]!; return ok(); }
    return ok(r.config[rest[0] ?? ''] ?? '');
  }
  if (!r.initialized) return fail(NOT_REPO);
  const head = headCommitId(r);
  switch (sub) {
    case 'status': return ok(statusText(r, args.includes('-s') || args.includes('--short')));
    case 'add': {
      const paths = args.filter((a) => !a.startsWith('-') || a === '-A');
      const all = args.includes('-A') || args.includes('--all');
      if (!paths.length && !all) return fail('Nothing specified, nothing added.\nhint: Maybe you wanted to say \'git add .\'?');
      const list = all ? [...new Set([...Object.keys(r.files), ...Object.keys(r.index)])] : pathspecs(r, paths.filter((p) => p !== '-A'));
      if (typeof list === 'string') return fail(list);
      for (const p of list) { if (p in r.files) r.index[p] = r.files[p]!; else delete r.index[p]; }
      if (r.merging) r.merging.conflicts = r.merging.conflicts.filter((p) => !list.includes(p));
      return ok();
    }
    case 'commit': {
      let msg: string | undefined; let amend = false; let all = false;
      for (let i = 0; i < args.length; i++) { const a = args[i]!; if (a === '-m' || a === '--message') msg = args[++i]; else if (a.startsWith('-m') && a.length > 2) msg = a.slice(2); else if (a === '-am' || a === '-ma') { all = true; msg = args[++i]; } else if (a === '-a' || a === '--all') all = true; else if (a === '--amend') amend = true; else if (a === '--no-edit') msg ??= undefined; }
      if (all) for (const p of Object.keys(r.index)) { if (p in r.files) r.index[p] = r.files[p]!; else delete r.index[p]; }
      if (r.merging) {
        if (r.merging.conflicts.length) return fail(`error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add <file>'\nfatal: Exiting because of an unresolved conflict.`);
        const m = r.merging; const label = m.branch;
        const c = makeCommit(r, [head!, m.theirs], msg ?? `Merge branch '${label}'`, r.index);
        if ('branch' in r.head) r.branches[r.head.branch] = c.id; else r.head = { detached: c.id };
        delete r.merging;
        return ok(`[${currentBranch(r) ?? 'detached HEAD'} ${short(c.id)}] ${c.message}`);
      }
      const headTree = treeOfHead(r);
      if (amend) {
        if (!head) return fail('fatal: You have nothing to amend.');
        const old = r.commits[head]!;
        const c = makeCommit(r, old.parents, msg ?? old.message, r.index);
        if ('branch' in r.head) r.branches[r.head.branch] = c.id; else r.head = { detached: c.id };
        return ok(`[${currentBranch(r) ?? 'detached HEAD'} ${short(c.id)}] ${c.message.split('\n')[0]}`);
      }
      if (eq(r.index, headTree)) return { out: statusText(r), err: '', ok: false };
      if (msg === undefined) return fail('Aborting commit: this simulator has no editor. Use git commit -m "message".');
      if (!msg.trim()) return fail('Aborting commit due to empty commit message.');
      const c = makeCommit(r, head ? [head] : [], msg, r.index);
      if ('branch' in r.head) r.branches[r.head.branch] = c.id; else r.head = { detached: c.id };
      return ok(commitLine(r, c.id, !head, msg, headTree, c.tree));
    }
    case 'log': {
      const oneline = args.includes('--oneline'); const graph = args.includes('--graph'); const all = args.includes('--all');
      let n: number | undefined; const revs: string[] = [];
      for (let i = 0; i < args.length; i++) { const a = args[i]!; if (a === '-n') n = Number(args[++i]); else if (/^-\d+$/.test(a)) n = Number(a.slice(1)); else if (a.startsWith('--max-count=')) n = Number(a.split('=')[1]); else if (!a.startsWith('-')) revs.push(a); }
      let exclude: string | undefined; const tips: string[] = [];
      for (const rv of revs) {
        if (rv.includes('..')) { const [a, b] = rv.split('..'); const ia = resolveRev(r, a!); const ib = resolveRev(r, b || 'HEAD'); if (!ia || !ib) return fail(`fatal: ambiguous argument '${rv}': unknown revision`); exclude = ia; tips.push(ib); }
        else { const id = resolveRev(r, rv); if (!id) return fail(`fatal: ambiguous argument '${rv}': unknown revision or path not in the working tree.`); tips.push(id); }
      }
      if (all) tips.push(...Object.values(r.branches));
      if (!tips.length) { if (!head) return fail(`fatal: your current branch '${currentBranch(r) ?? 'main'}' does not have any commits yet`); tips.push(head); }
      return ok(logLines(r, tips, { oneline, n, graph, exclude }));
    }
    case 'diff': {
      const staged = args.includes('--staged') || args.includes('--cached');
      const revs = args.filter((a) => !a.startsWith('-'));
      let from: Record<string, string>; let to: Record<string, string>;
      const files = revs.filter((a) => !resolveRev(r, a.split('..')[0]!) || a in r.files);
      const commitsArgs = revs.filter((a) => !files.includes(a));
      if (commitsArgs.length === 1 && commitsArgs[0]!.includes('..')) { const [a, b] = commitsArgs[0]!.split('..'); const ia = resolveRev(r, a!); const ib = resolveRev(r, b!); if (!ia || !ib) return fail('fatal: bad revision'); from = r.commits[ia]!.tree; to = r.commits[ib]!.tree; }
      else if (commitsArgs.length >= 2) { const ia = resolveRev(r, commitsArgs[0]!); const ib = resolveRev(r, commitsArgs[1]!); if (!ia || !ib) return fail('fatal: bad revision'); from = r.commits[ia]!.tree; to = r.commits[ib]!.tree; }
      else if (commitsArgs.length === 1) { const ia = resolveRev(r, commitsArgs[0]!); if (!ia) return fail('fatal: bad revision'); from = r.commits[ia]!.tree; to = Object.fromEntries(Object.entries(r.files).filter(([p]) => p in r.index)); }
      else if (staged) { from = treeOfHead(r); to = r.index; }
      else { from = r.index; to = Object.fromEntries(Object.entries(r.files).filter(([p]) => p in r.index)); for (const p of Object.keys(r.index)) if (!(p in r.files)) delete to[p]; }
      const out: string[] = [];
      for (const p of new Set([...Object.keys(from), ...Object.keys(to)])) { if (files.length && !files.includes(p)) continue; const d = unifiedDiff(p, from[p], to[p]); if (d) out.push(d); }
      return ok(out.join('\n'));
    }
    case 'show': {
      const id = resolveRev(r, args.find((a) => !a.startsWith('-')) ?? 'HEAD');
      if (!id) return fail('fatal: bad revision');
      const c = r.commits[id]!;
      const parent = c.parents[0] ? r.commits[c.parents[0]]!.tree : {};
      const diffs = [...new Set([...Object.keys(parent), ...Object.keys(c.tree)])].map((p) => unifiedDiff(p, parent[p], c.tree[p])).filter(Boolean);
      return ok(`commit ${c.id.padEnd(40, '0')}${refsAt(r, c.id)}\nAuthor: ${c.author}\n\n    ${c.message}\n\n${diffs.join('\n')}`);
    }
    case 'branch': {
      const flags = args.filter((a) => a.startsWith('-')); const names = args.filter((a) => !a.startsWith('-'));
      if (flags.includes('-d') || flags.includes('-D') || flags.includes('--delete')) {
        const name = names[0]; if (!name) return fail('fatal: branch name required');
        if (!(name in r.branches)) return fail(`error: branch '${name}' not found.`);
        if (name === currentBranch(r)) return fail(`error: Cannot delete branch '${name}' checked out`);
        if (!flags.includes('-D') && head && !isAncestor(r, r.branches[name]!, head)) return fail(`error: The branch '${name}' is not fully merged.\nIf you are sure you want to delete it, run 'git branch -D ${name}'.`);
        const was = r.branches[name]!; delete r.branches[name];
        return ok(`Deleted branch ${name} (was ${short(was)}).`);
      }
      if (flags.includes('-m') || flags.includes('-M')) {
        const [a, b] = names.length === 2 ? names : [currentBranch(r), names[0]];
        if (!a || !b || !(a in r.branches)) return fail('error: no such branch');
        r.branches[b] = r.branches[a]!; delete r.branches[a]; if (currentBranch(r) === a) r.head = { branch: b };
        return ok();
      }
      if (!names.length) {
        const cur = currentBranch(r);
        const rows = Object.keys(r.branches).filter((b) => flags.includes('-a') || flags.includes('-r') ? true : !b.startsWith('origin/')).filter((b) => (flags.includes('-r') ? b.startsWith('origin/') : true)).sort();
        if (cur && !(cur in r.branches)) rows.push(cur);
        const v = flags.includes('-v') || flags.includes('-vv');
        return ok([...new Set(rows)].sort().map((b) => `${b === cur ? '* ' : '  '}${b}${v && r.branches[b] ? ` ${short(r.branches[b]!)} ${r.commits[r.branches[b]!]?.message.split('\n')[0] ?? ''}` : ''}`).join('\n'));
      }
      const [name, start] = names; const at = start ? resolveRev(r, start) : head;
      if (!at) return fail(`fatal: not a valid object name: '${start ?? 'HEAD'}'`);
      if (name! in r.branches) return fail(`fatal: a branch named '${name}' already exists`);
      r.branches[name!] = at;
      return ok();
    }
    case 'switch': case 'checkout': {
      const create = args.includes('-c') || args.includes('-b') || args.includes('-C') || args.includes('-B');
      const rest = args.filter((a) => !['-c', '-b', '-C', '-B', '--detach', '-f'].includes(a));
      const dd = rest.indexOf('--');
      if (sub === 'checkout' && (dd >= 0 || (rest.length && !(rest[0]! in r.branches) && !resolveRev(r, rest[0]!) && (rest[0]! in r.index || rest[0]! in r.files)))) {
        // restore files
        const src = dd > 0 ? resolveRev(r, rest[0]!) : undefined;
        const paths = dd >= 0 ? rest.slice(dd + 1) : rest;
        for (const p of paths) {
          const tree = src ? r.commits[src]!.tree : r.index;
          if (!(p in tree)) return fail(`error: pathspec '${p}' did not match any file(s) known to git`);
          r.files[p] = tree[p]!; if (src) r.index[p] = tree[p]!;
        }
        return ok();
      }
      const name = rest[0]; if (!name) return fail(`fatal: missing branch or commit argument`);
      if (create) {
        if (name in r.branches) return fail(`fatal: a branch named '${name}' already exists`);
        const start = rest[1] ? resolveRev(r, rest[1]) : head; if (!start && head) return fail(`fatal: invalid reference: ${rest[1]}`);
        if (start) r.branches[name] = start;
        r.head = { branch: name };
        return ok(`Switched to a new branch '${name}'`);
      }
      if (name in r.branches) {
        if (currentBranch(r) === name) return ok(`Already on '${name}'`);
        const err = checkoutTree(r, r.commits[r.branches[name]!]!.tree);
        if (err) return fail(err);
        r.head = { branch: name };
        return ok(`Switched to branch '${name}'`);
      }
      // `git switch feature` when only origin/feature exists: create a tracking branch
      if (`origin/${name}` in r.branches) { const err = checkoutTree(r, r.commits[r.branches[`origin/${name}`]!]!.tree); if (err) return fail(err); r.branches[name] = r.branches[`origin/${name}`]!; r.head = { branch: name }; return ok(`branch '${name}' set up to track 'origin/${name}'.\nSwitched to a new branch '${name}'`); }
      const id = resolveRev(r, name);
      if (id && (sub === 'checkout' || args.includes('--detach'))) { const err = checkoutTree(r, r.commits[id]!.tree); if (err) return fail(err); r.head = { detached: id }; return ok(`HEAD is now at ${short(id)} ${r.commits[id]!.message.split('\n')[0]}`); }
      return fail(sub === 'switch' ? `fatal: invalid reference: ${name}` : `error: pathspec '${name}' did not match any file(s) known to git`);
    }
    case 'merge': {
      if (args.includes('--abort')) {
        if (!r.merging) return fail('fatal: There is no merge to abort (MERGE_HEAD missing).');
        r.files = { ...treeOfHead(r) }; r.index = { ...treeOfHead(r) }; delete r.merging; return ok();
      }
      if (r.merging) return fail('error: You have not concluded your merge (MERGE_HEAD exists).\nPlease, commit your changes before you merge.');
      let message: string | undefined; const names: string[] = [];
      for (let i = 0; i < args.length; i++) { if (args[i] === '-m') message = args[++i]; else if (!args[i]!.startsWith('-')) names.push(args[i]!); }
      if (!names[0]) return fail('fatal: No commit specified and merge.defaultToUpstream not set.');
      return doMerge(r, names[0]!, names[0]!, args.includes('--no-ff'), message);
    }
    case 'restore': {
      const staged = args.includes('--staged') || args.includes('-S'); const worktree = args.includes('--worktree') || args.includes('-W') || !staged;
      const srcArg = args.find((a) => a.startsWith('--source='))?.split('=')[1] ?? (args.includes('-s') ? args[args.indexOf('-s') + 1] : undefined);
      const paths = args.filter((a) => !a.startsWith('-') && a !== srcArg); if (!paths.length) return fail('fatal: you must specify path(s) to restore');
      const src = srcArg ? resolveRev(r, srcArg) : undefined; if (srcArg && !src) return fail(`fatal: could not resolve ${srcArg}`);
      const list = paths.flatMap((p) => (p === '.' ? [...new Set([...Object.keys(r.files), ...Object.keys(r.index), ...Object.keys(treeOfHead(r))])] : [p]));
      for (const p of list) {
        const fromTree = src ? r.commits[src]!.tree : staged ? treeOfHead(r) : r.index;
        if (!(p in fromTree) && !(p in r.files) && !(p in r.index)) return fail(`error: pathspec '${p}' did not match any file(s) known to git`);
        if (staged) { if (p in fromTree) r.index[p] = fromTree[p]!; else delete r.index[p]; }
        if (worktree && !staged) { if (p in fromTree) r.files[p] = fromTree[p]!; else delete r.files[p]; }
        if (staged && worktree && args.includes('--worktree')) { if (p in fromTree) r.files[p] = fromTree[p]!; }
      }
      return ok();
    }
    case 'reset': {
      const mode = args.includes('--hard') ? 'hard' : args.includes('--soft') ? 'soft' : 'mixed';
      const rest = args.filter((a) => !a.startsWith('-'));
      const first = rest[0];
      if (first && !resolveRev(r, first) && (first in r.index || first in r.files || first === '.')) { // unstage paths
        for (const p of first === '.' ? Object.keys(r.index) : rest) { const t = treeOfHead(r); if (p in t) r.index[p] = t[p]!; else delete r.index[p]; }
        return ok();
      }
      const id = resolveRev(r, first ?? 'HEAD'); if (!id) return fail(`fatal: ambiguous argument '${first}': unknown revision or path not in the working tree.`);
      if ('branch' in r.head) r.branches[r.head.branch] = id; else r.head = { detached: id };
      if (mode !== 'soft') {
        const oldIndex = r.index;
        r.index = { ...r.commits[id]!.tree };
        // --hard also rewrites the working tree (untracked files are left alone); --mixed only resets the index
        if (mode === 'hard') r.files = { ...Object.fromEntries(Object.entries(r.files).filter(([p]) => !(p in oldIndex))), ...r.commits[id]!.tree };
      }
      delete r.merging;
      return ok(mode === 'hard' ? `HEAD is now at ${short(id)} ${r.commits[id]!.message.split('\n')[0]}` : '');
    }
    case 'revert': {
      const rv = args.find((a) => !a.startsWith('-')); if (!rv) return fail('fatal: revert needs a commit');
      const id = resolveRev(r, rv); if (!id) return fail(`fatal: bad revision '${rv}'`);
      if (!head) return fail('fatal: cannot revert on an empty branch');
      const dirty = !eq(r.index, treeOfHead(r)) || Object.keys(r.index).some((p) => r.files[p] !== r.index[p]);
      if (dirty) return fail('error: your local changes would be overwritten by revert.\nhint: Commit your changes or stash them to proceed.\nfatal: revert failed');
      const c = r.commits[id]!; const parent = c.parents[0] ? r.commits[c.parents[0]]!.tree : {}; const cur = treeOfHead(r);
      const tree: Record<string, string> = {}; let conflict = false;
      for (const p of new Set([...Object.keys(c.tree), ...Object.keys(parent), ...Object.keys(cur)])) {
        const m = merge3(c.tree[p] ?? '', cur[p] ?? '', parent[p] ?? '', 'HEAD', `parent of ${short(id)}`);
        if (m.conflict) { conflict = true; r.files[p] = m.text; tree[p] = cur[p] ?? ''; }
        else if (!(p in c.tree) && !(p in parent)) { if (p in cur) tree[p] = cur[p]!; }
        else if (p in parent || m.text !== '') tree[p] = m.text; else if (!(p in parent)) { /* file added by the reverted commit: removed */ }
        if (!m.conflict) { if (p in tree) r.files[p] = tree[p]!; else delete r.files[p]; }
      }
      if (conflict) return { out: '', err: 'error: could not revert: conflicts. Fix them and commit (or git reset --hard to abort).', ok: false };
      const revMsg = `Revert "${c.message.split('\n')[0]}"\n\nThis reverts commit ${c.id.padEnd(40, '0')}.`;
      const nc = makeCommit(r, [head], revMsg, tree);
      r.index = { ...tree };
      if ('branch' in r.head) r.branches[r.head.branch] = nc.id; else r.head = { detached: nc.id };
      return ok(`[${currentBranch(r) ?? 'detached HEAD'} ${short(nc.id)}] Revert "${c.message.split('\n')[0]}"`);
    }
    case 'tag': {
      const names = args.filter((a) => !a.startsWith('-'));
      if (args.includes('-d')) { delete r.tags[names[0] ?? '']; return ok(); }
      if (!names.length) return ok(Object.keys(r.tags).sort().join('\n'));
      const at = names[1] && !args.includes('-m') ? resolveRev(r, names[1]) : head; if (!at) return fail('fatal: Failed to resolve HEAD as a valid ref.');
      if (names[0]! in r.tags) return fail(`fatal: tag '${names[0]}' already exists`);
      r.tags[names[0]!] = at; return ok();
    }
    case 'stash': {
      const op = args[0] ?? 'push';
      if (op === 'list') return ok(r.stash.map((_, i) => `stash@{${i}}: WIP on ${currentBranch(r) ?? 'HEAD'}`).reverse().join('\n'));
      if (op === 'pop' || op === 'apply') {
        const s = op === 'pop' ? r.stash.pop() : r.stash[r.stash.length - 1]; if (!s) return fail('No stash entries found.');
        r.files = { ...r.files, ...s.files }; r.index = { ...r.index, ...s.index }; return ok('Dropped refs/stash@{0}');
      }
      const head_ = treeOfHead(r); const mods: Record<string, string> = {};
      for (const p of Object.keys(head_)) if (r.files[p] !== head_[p] && p in r.files) mods[p] = r.files[p]!;
      const staged: Record<string, string> = {}; for (const p of Object.keys(r.index)) if (r.index[p] !== head_[p]) { staged[p] = r.index[p]!; if (!(p in mods)) mods[p] = r.files[p] ?? r.index[p]!; }
      if (!Object.keys(mods).length) return ok('No local changes to save');
      r.stash.push({ files: mods, index: staged });
      r.files = { ...Object.fromEntries(Object.entries(r.files).filter(([p]) => !(p in head_) && !(p in r.index))), ...head_ }; r.index = { ...head_ };
      return ok(`Saved working directory and index state WIP on ${currentBranch(r) ?? 'HEAD'}: ${short(head ?? '')} ${r.commits[head ?? '']?.message.split('\n')[0] ?? ''}`);
    }
    case 'remote': {
      if (args[0] === 'add') { if (!args[1] || !args[2]) return fail('usage: git remote add <name> <url>'); if (args[1] in r.remotes) return fail(`error: remote ${args[1]} already exists.`); r.remotes[args[1]] = args[2]; return ok(); }
      if (args[0] === 'remove' || args[0] === 'rm') { delete r.remotes[args[1] ?? '']; return ok(); }
      if (args.includes('-v')) return ok(Object.entries(r.remotes).flatMap(([n, u]) => [`${n}\t${u} (fetch)`, `${n}\t${u} (push)`]).join('\n'));
      return ok(Object.keys(r.remotes).join('\n'));
    }
    case 'fetch': case 'pull': case 'push': {
      const flags = args.filter((a) => a.startsWith('-')); const rest = args.filter((a) => !a.startsWith('-'));
      const remote = rest[0] ?? 'origin';
      if (!(remote in r.remotes)) return fail(`fatal: '${remote}' does not appear to be a git repository\nfatal: Could not read from remote repository.`);
      const url = r.remotes[remote]!;
      if (sub === 'push') {
        const branch = rest[1] === 'HEAD' || !rest[1] ? currentBranch(r) : rest[1]!.split(':')[0];
        if (!branch || !(branch in r.branches)) return fail(`error: src refspec ${rest[1] ?? 'HEAD'} does not match any`);
        const local = r.branches[branch]!; const remoteTip = r.origin.branches[branch];
        if (remoteTip && remoteTip !== local && !isAncestor(r, remoteTip, local) && !flags.includes('--force') && !flags.includes('-f')) return fail(`To ${url}\n ! [rejected]        ${branch} -> ${branch} (fetch first)\nerror: failed to push some refs to '${url}'\nhint: Updates were rejected because the remote contains work that you do not have locally. Integrate the remote changes (git pull) before pushing again.`);
        const line = remoteTip ? `   ${short(remoteTip)}..${short(local)}  ${branch} -> ${branch}` : ` * [new branch]      ${branch} -> ${branch}`;
        if (remoteTip === local) return ok('Everything up-to-date');
        r.origin.branches[branch] = local; r.branches[`origin/${branch}`] = local;
        return ok(`To ${url}\n${line}${flags.includes('-u') || flags.includes('--set-upstream') ? `\nbranch '${branch}' set up to track 'origin/${branch}'.` : ''}`);
      }
      const newRefs: string[] = [];
      for (const [b, id] of Object.entries(r.origin.branches)) { if (r.branches[`origin/${b}`] !== id) newRefs.push(r.branches[`origin/${b}`] ? `   ${short(r.branches[`origin/${b}`]!)}..${short(id)}  ${b} -> origin/${b}` : ` * [new branch]      ${b} -> origin/${b}`); r.branches[`origin/${b}`] = id; }
      const fetchOut = newRefs.length ? `From ${url}\n${newRefs.join('\n')}` : '';
      if (sub === 'fetch') return ok(fetchOut);
      if (flags.includes('--rebase')) return fail('This simulator supports merge-style pulls only: use git pull (merge) or fetch + merge.');
      const b = rest[1] ?? currentBranch(r); if (!b) return fail('You are not currently on a branch.');
      if (!(`origin/${b}` in r.branches)) return fail(`fatal: couldn't find remote ref ${b}`);
      const merged = doMerge(r, `origin/${b}`, `origin/${b}`, false);
      return { out: [fetchOut, merged.out].filter(Boolean).join('\n'), err: merged.err, ok: merged.ok };
    }
    default: return fail(`git: '${sub}' is not a git command. See 'git --help'.`);
  }
}

/** The simulated GitHub CLI: pull requests live on `origin`. */
function ghCommand(r: Repo, argv: string[]): CmdResult {
  const [area, action, ...args] = argv;
  if (area !== 'pr') return fail("gh: this simulator supports 'gh pr create | list | view | review | merge | checkout'.");
  if (!r.initialized) return fail(NOT_REPO);
  const flag = (n: string): string | undefined => { const i = args.findIndex((a) => a === n || a.startsWith(`${n}=`)); return i < 0 ? undefined : args[i]!.includes('=') ? args[i]!.split('=')[1] : args[i + 1]; };
  const pr = (n: string | undefined) => r.origin.prs.find((p) => p.number === Number(n));
  switch (action) {
    case 'create': {
      const head = flag('--head') ?? currentBranch(r); const base = flag('--base') ?? 'main'; const title = flag('--title') ?? flag('-t');
      if (!head || !title) return fail('gh pr create: a --title is required (and you must be on the branch to open a PR for).');
      if (!(head in r.origin.branches)) return fail(`pull request create failed: the branch '${head}' has not been pushed to origin. Run git push -u origin ${head} first.`);
      if (!(base in r.origin.branches)) return fail(`pull request create failed: base branch '${base}' does not exist on origin`);
      if (head === base) return fail('pull request create failed: head and base branch are the same');
      if (isAncestor(r, r.origin.branches[head]!, r.origin.branches[base]!)) return fail(`pull request create failed: there are no commits between ${base} and ${head}`);
      const number = r.origin.prs.reduce((m, p) => Math.max(m, p.number), 0) + 1;
      r.origin.prs.push({ number, title, head, base, state: 'open', reviews: [] });
      return ok(`https://github.com/example/project/pull/${number}`);
    }
    case 'list': return ok(r.origin.prs.map((p) => `#${p.number}\t${p.title}\t${p.head} → ${p.base}\t${p.state.toUpperCase()}`).join('\n') || 'no pull requests');
    case 'view': { const p = pr(args[0]); return p ? ok(`#${p.number} ${p.title}\n${p.state.toUpperCase()}  ${p.head} → ${p.base}${p.reviews.length ? `\nReviews: ${p.reviews.join('; ')}` : ''}`) : fail('no pull request found'); }
    case 'review': { const p = pr(args[0]); if (!p) return fail('no pull request found'); const body = flag('--body') ?? flag('-b') ?? ''; p.reviews.push(`${args.includes('--approve') ? 'approved' : args.includes('--request-changes') ? 'changes requested' : 'commented'}${body ? `: ${body}` : ''}`); return ok(`Reviewed pull request #${p.number}`); }
    case 'checkout': { const p = pr(args[0]); if (!p) return fail('no pull request found'); const id = r.origin.branches[p.head]; if (!id) return fail('the branch no longer exists'); r.branches[`origin/${p.head}`] = id; if (!(p.head in r.branches)) r.branches[p.head] = id; return gitCommand(r, ['switch', p.head]); }
    case 'merge': {
      const p = pr(args[0]); if (!p) return fail('no pull request found');
      if (p.state !== 'open') return fail(`Pull request #${p.number} is already ${p.state}`);
      const baseTip = r.origin.branches[p.base]!; const headTip = r.origin.branches[p.head]!;
      if (isAncestor(r, baseTip, headTip) && !args.includes('--merge')) { r.origin.branches[p.base] = headTip; }
      else if (isAncestor(r, headTip, baseTip)) { /* nothing new */ }
      else {
        const base = mergeBase(r, baseTip, headTip); const B = base ? r.commits[base]!.tree : {}; const O = r.commits[baseTip]!.tree; const T = r.commits[headTip]!.tree; const tree: Record<string, string> = {};
        for (const path of new Set([...Object.keys(B), ...Object.keys(O), ...Object.keys(T)])) {
          const m = merge3(B[path] ?? '', O[path] ?? '', T[path] ?? '', p.base, p.head);
          if (m.conflict) return fail(`Pull request #${p.number} is not mergeable: the branches have conflicts. Merge ${p.base} into ${p.head} locally, resolve them, and push.`);
          if (!(path in B) && !(path in O) && !(path in T)) continue;
          if (m.text !== '' || path in O || path in T) { if (!(path in O) && !(path in T)) continue; tree[path] = m.text; }
        }
        const c = makeCommit(r, [baseTip, headTip], `Merge pull request #${p.number} from ${p.head}`, tree, 'GitHub');
        r.origin.branches[p.base] = c.id;
      }
      p.state = 'merged';
      return ok(`Merged pull request #${p.number} (${p.head} into ${p.base}) on origin. Run git fetch to see it locally.`);
    }
    default: return fail('gh pr: unknown action');
  }
}

function shellCommand(r: Repo, words: string[], redirect?: { op: '>' | '>>'; path: string }): CmdResult {
  const [cmd, ...args] = words;
  switch (cmd) {
    case 'echo': case 'printf': {
      const text = (cmd === 'printf' || args[0] === '-e' ? args.filter((a) => a !== '-e').join(' ').replace(/\\n/g, '\n').replace(/\\t/g, '\t') : args.filter((a) => a !== '-n').join(' '));
      const body = cmd === 'echo' && !args.includes('-n') ? text + '\n' : text.endsWith('\n') || cmd === 'printf' ? text : text;
      if (redirect) { r.files[redirect.path] = redirect.op === '>>' ? (r.files[redirect.path] ?? '') + body : body; return ok(); }
      return ok(body.replace(/\n$/, ''));
    }
    case 'cat': { if (!args.length) return fail('cat: missing file operand'); const out: string[] = []; for (const a of args) { if (!(a in r.files)) return fail(`cat: ${a}: No such file or directory`); out.push(r.files[a]!.replace(/\n$/, '')); } return ok(out.join('\n')); }
    case 'ls': return ok(Object.keys(r.files).sort().join('\n'));
    case 'rm': { const list = args.filter((a) => !a.startsWith('-')); for (const a of list) { if (!(a in r.files)) return fail(`rm: cannot remove '${a}': No such file or directory`); delete r.files[a]; } return ok(); }
    case 'touch': for (const a of args) if (!(a in r.files)) r.files[a] = ''; return ok();
    case 'mv': { const [a, b] = args; if (!a || !b || !(a in r.files)) return fail(`mv: cannot stat '${a ?? ''}': No such file or directory`); r.files[b] = r.files[a]!; delete r.files[a]; return ok(); }
    case 'pwd': return ok('/work/project');
    case 'mkdir': case 'clear': case 'cd': return ok();
    case 'help': return ok('Commands: git …, gh pr …, echo "text" > file, echo "more" >> file, cat file, ls, rm file, touch file, mv a b');
    case undefined: return ok();
    default: return fail(`bash: ${cmd}: command not found`);
  }
}

/** Runs ONE line of the transcript against the repository (mutating it). `@write <path> <json-string>` is the editor's save. */
export function runLine(r: Repo, line: string): CmdResult {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return ok();
  if (trimmed.startsWith('@write ')) {
    const m = /^@write\s+(\S+)\s+([\s\S]*)$/.exec(trimmed);
    if (!m) return fail('bad editor command');
    try { r.files[m[1]!] = JSON.parse(m[2]!) as string; return ok(); } catch { return fail('bad editor command'); }
  }
  const t = tokenize(trimmed);
  if (typeof t === 'string') return fail(`bash: ${t}`);
  if (t.words[0] === 'git') return t.redirect ? fail('bash: redirecting git output is not supported here') : gitCommand(r, t.words.slice(1));
  if (t.words[0] === 'gh') return ghCommand(r, t.words.slice(1));
  return shellCommand(r, t.words, t.redirect);
}

void conflictText; void joinLines;
