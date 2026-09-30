import { runLine } from './commands';
import { cloneRepo, fromSnapshot } from './repo';
import type { Repo, RepoSnapshot } from './types';

export interface Step { line: string; out: string; err: string; ok: boolean }

/** Replays a transcript from a start state. Deterministic: the same transcript always gives the same repository and the same output. */
export function replay(start: RepoSnapshot | Repo, transcript: string): { repo: Repo; steps: Step[] } {
  const repo = 'commits' in start && 'index' in start && 'counter' in start ? cloneRepo(start as Repo) : fromSnapshot(start as RepoSnapshot);
  const steps: Step[] = [];
  for (const line of transcript.split('\n')) {
    if (!line.trim()) continue;
    const r = runLine(repo, line);
    steps.push({ line, ...r });
  }
  return { repo, steps };
}
