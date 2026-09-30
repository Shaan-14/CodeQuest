import type { Commit, Repo, RepoSnapshot } from './types';

export function emptyRepo(): Repo {
  return { initialized: false, files: {}, index: {}, commits: {}, branches: {}, head: { branch: 'main' }, tags: {}, stash: [], remotes: {}, origin: { branches: {}, prs: [] }, config: {}, counter: 0 };
}

/** FNV-1a: a stable 7-hex id from the content, so a replay always produces the same ids. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0').slice(0, 7);
}

export function makeCommit(repo: Repo, parents: string[], message: string, tree: Record<string, string>, author = 'You'): Commit {
  const order = ++repo.counter;
  let id = hash(JSON.stringify([parents, message, tree, order]));
  while (repo.commits[id]) id = hash(id + order);
  const c: Commit = { id, parents, message, tree: { ...tree }, author, order, onBranch: 'branch' in repo.head ? repo.head.branch : undefined };
  repo.commits[id] = c;
  return c;
}

export const headCommitId = (repo: Repo): string | undefined => ('branch' in repo.head ? repo.branches[repo.head.branch] : repo.head.detached);
export const currentBranch = (repo: Repo): string | undefined => ('branch' in repo.head ? repo.head.branch : undefined);

/** Builds a repository from an author-written snapshot. */
export function fromSnapshot(snap: RepoSnapshot): Repo {
  const repo = emptyRepo();
  // A snapshot with history is a repository; one with only files is a plain folder (the player runs git init).
  repo.initialized = !!(snap.commits?.length || snap.branches);
  const byIndex: string[] = [];
  const lastOnBranch: Record<string, string> = {};
  let prevId: string | undefined;
  for (const [i, c] of (snap.commits ?? []).entries()) {
    const branch = c.branch ?? 'main';
    const ref = (v: string | number): string => (typeof v === 'number' ? byIndex[v]! : v);
    const explicit = c.parents ? c.parents.map(ref) : c.parent !== undefined ? [ref(c.parent)] : undefined;
    const parentId = explicit?.[0] ?? (c.branch === undefined ? prevId : lastOnBranch[branch] ?? prevId);
    const parents = explicit ?? (parentId ? [parentId] : []);
    const base = parents[0] ? { ...repo.commits[parents[0]]!.tree } : {};
    let tree = c.files ? { ...c.files } : base;
    for (const [p, v] of Object.entries(c.edit ?? {})) { if (v === null) delete tree[p]; else tree[p] = v; }
    const commit = makeCommit(repo, parents, c.message, tree, 'Teammate');
    if (c.id) { delete repo.commits[commit.id]; commit.id = c.id; repo.commits[c.id] = commit; }
    byIndex[i] = commit.id;
    lastOnBranch[branch] = commit.id;
    prevId = commit.id;
  }
  const resolve = (v: string | number): string => (typeof v === 'number' ? byIndex[v]! : v);
  for (const [b, v] of Object.entries(snap.branches ?? (byIndex.length ? { main: byIndex.length - 1 } : {}))) repo.branches[b] = resolve(v);
  repo.head = { branch: snap.head ?? 'main' };
  const tip = headCommitId(repo);
  repo.files = tip ? { ...repo.commits[tip]!.tree } : { ...(snap.files ?? {}) };
  if (snap.files && tip) repo.files = { ...repo.files, ...snap.files };
  repo.index = tip ? { ...repo.commits[tip]!.tree } : {};
  for (const p of snap.staged ?? []) { if (p in repo.files) repo.index[p] = repo.files[p]!; else delete repo.index[p]; }
  if (snap.remote) repo.remotes.origin = snap.remote;
  for (const [b, v] of Object.entries(snap.origin ?? {})) { repo.origin.branches[b] = resolve(v); }
  // Remote-tracking refs start as what the player last fetched: origin branches that point at commits they already have locally.
  for (const [b, id] of Object.entries(repo.origin.branches)) if (snap.remote && repo.branches[b] === id) repo.branches[`origin/${b}`] = id;
  repo.origin.prs = (snap.prs ?? []).map((p) => ({ ...p, reviews: [] }));
  return repo;
}

/** Commits reachable from `id`, nearest first (breadth-first over parents). */
export function ancestors(repo: Repo, id: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const queue = [id];
  while (queue.length) {
    const cur = queue.shift()!;
    if (seen.has(cur) || !repo.commits[cur]) continue;
    seen.add(cur); out.push(cur);
    queue.push(...repo.commits[cur]!.parents);
  }
  return out;
}
export const isAncestor = (repo: Repo, maybe: string, of: string): boolean => ancestors(repo, of).includes(maybe);

export function mergeBase(repo: Repo, a: string, b: string): string | undefined {
  const aa = new Set(ancestors(repo, a));
  return ancestors(repo, b).find((c) => aa.has(c));
}

/** Resolves `HEAD`, `HEAD~n`, a branch, a tag, a full id or a unique id prefix. */
export function resolveRev(repo: Repo, rev: string): string | undefined {
  const m = /^(.*?)((?:[~^]\d*)*)$/.exec(rev)!;
  let base = m[1]!;
  let id: string | undefined;
  if (base === 'HEAD' || base === '@') id = headCommitId(repo);
  else if (repo.branches[base]) id = repo.branches[base];
  else if (repo.tags[base]) id = repo.tags[base];
  else if (repo.commits[base]) id = base;
  else { const hits = Object.keys(repo.commits).filter((k) => k.startsWith(base)); if (base.length >= 4 && hits.length === 1) id = hits[0]; }
  for (const step of m[2]!.match(/[~^]\d*/g) ?? []) {
    if (!id) return undefined;
    const n = step.length > 1 ? Number(step.slice(1)) : 1;
    for (let i = 0; i < n; i++) { id = repo.commits[id!]?.parents[0]; if (!id) return undefined; }
  }
  void base;
  return id;
}

export const cloneRepo = (r: Repo): Repo => JSON.parse(JSON.stringify(r)) as Repo;
