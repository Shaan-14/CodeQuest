/** Git simulator state. Plain JSON: a challenge's start repository and the player's replayed repository are the same shape. */
export interface Commit {
  id: string;
  parents: string[];
  message: string;
  /** The full snapshot of tracked files at this commit. */
  tree: Record<string, string>;
  author: string;
  /** Creation order, used for stable ids and for `git log` ordering. */
  order: number;
}

export interface PullRequest {
  number: number;
  title: string;
  head: string;
  base: string;
  state: 'open' | 'merged' | 'closed';
  reviews: string[];
}

export interface Repo {
  initialized: boolean;
  /** Working tree. */
  files: Record<string, string>;
  /** Staged snapshot (full tree), as in `git add`. */
  index: Record<string, string>;
  /** Every commit ever made, local or remote (one shared object store keeps the simulation simple). */
  commits: Record<string, Commit>;
  /** Local branches and remote-tracking refs (`origin/main`). */
  branches: Record<string, string>;
  head: { branch: string } | { detached: string };
  tags: Record<string, string>;
  /** A merge stopped by conflicts. */
  merging?: { branch: string; theirs: string; conflicts: string[] };
  stash: { files: Record<string, string>; index: Record<string, string> }[];
  remotes: Record<string, string>;
  /** The simulated server: branches on `origin` and pull requests. */
  origin: { branches: Record<string, string>; prs: PullRequest[] };
  config: Record<string, string>;
  counter: number;
}

/** Author-facing start state: commits in creation order; later commits default to parent = the previous one on the same branch. */
export interface RepoSnapshot {
  files?: Record<string, string>;
  /** Commits in creation order. `files` is the full tree at that commit (or use `edit` to change the previous one). */
  commits?: { id?: string; branch?: string; parent?: string; parents?: string[]; message: string; files?: Record<string, string>; edit?: Record<string, string | null> }[];
  /** Branch -> commit id (or the index into `commits`), plus which is checked out. */
  branches?: Record<string, string | number>;
  head?: string;
  /** Branches on the server (`origin`), as commit ids or `commits` indexes. Local `origin/<b>` refs mirror them. */
  origin?: Record<string, string | number>;
  remote?: string;
  prs?: Omit<PullRequest, 'reviews'>[];
}

export interface CmdResult { out: string; err: string; ok: boolean }
