/**
 * Messages between the game (host) and the sandboxed web page. Everything coming FROM the sandbox is untrusted
 * data: the host reads only the fields below, caps sizes, and ignores anything without the nonce announced in the
 * first `hello`.
 */
import type { WebFiles } from '../../content/schema';

export type SandboxIn = {
  cq: 'run';
  files: WebFiles;
  config: {
    mode: 'run' | 'grade';
    /** In-game API dataset (see apiData.ts / apiServer.js). */
    api?: { collections: Record<string, unknown[]>; required: Record<string, string[]>; latency: number };
    /** Grade mode: the authored check to run against the loaded page. */
    check?: { script: string; timeoutMs?: number; errorsOk?: boolean };
    /** localStorage contents to seed before the page's scripts run. */
    storage?: Record<string, string>;
  };
};

export type SandboxOut =
  | { cq: true; nonce: string; type: 'hello' }
  | { cq: true; nonce: string; type: 'ready' }
  | { cq: true; nonce: string; type: 'console'; level: string; text: string }
  | { cq: true; nonce: string; type: 'error'; text: string; where?: string }
  | { cq: true; nonce: string; type: 'result'; passed: boolean; message: string };

export const isSandboxOut = (d: unknown): d is SandboxOut => typeof d === 'object' && d !== null && (d as { cq?: unknown }).cq === true && typeof (d as { type?: unknown }).type === 'string' && typeof (d as { nonce?: unknown }).nonce === 'string';
