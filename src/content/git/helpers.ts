import type { GitCheck, GitExpect } from '../schema';

/** One state check on the repository the player's commands produce. */
export const gitCheck = (name: string, expect: GitExpect, extra: Partial<GitCheck> = {}): GitCheck => ({ kind: 'git', name, expect, ...extra });
