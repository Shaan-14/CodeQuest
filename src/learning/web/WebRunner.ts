/**
 * Host side of the web sandbox (runs in the game page). A player's HTML/CSS/JS is only ever executed inside an
 * <iframe sandbox="allow-scripts"> (opaque origin: no access to the game's DOM, storage, cookies or save) that loads
 * web-sandbox.html, which carries its own strict CSP (no network). The two sides talk by postMessage only.
 *
 *  - `mountSandbox` shows a live page (the Run button / previews).
 *  - `gradeWeb` runs each authored check in its OWN fresh hidden iframe (state never leaks between checks).
 */
import type { Check, WebCheck, WebFiles } from '../../content/schema';
import type { CheckOutcome, CodeRunner, GradeRequest, GradeResult, Language, RunRequest, RunResult } from '../runner';
import { apiConfig, type ApiVariant } from './apiData';
import { isSandboxOut, type SandboxIn, type SandboxOut } from './protocol';

const START_TIMEOUT_MS = 8000;
const CHECK_TIMEOUT_MS = 12000;
export const SANDBOX_URL = `${import.meta.env.BASE_URL}web-sandbox.html`;

export interface SandboxEvents {
  onConsole?: (level: string, text: string) => void;
  onError?: (text: string) => void;
  onReady?: () => void;
}

export interface SandboxHandle {
  iframe: HTMLIFrameElement;
  destroy(): void;
}

export interface MountOptions extends SandboxEvents {
  mode?: 'run' | 'grade';
  /** Serve the in-game API (dataset variant). Omit for no API. */
  api?: ApiVariant | null;
  check?: { script: string; errorsOk?: boolean };
  storage?: Record<string, string>;
  onResult?: (passed: boolean, message: string) => void;
  onStartFailure?: () => void;
}

/** Create the sandbox iframe inside `parent` and run `files` in it. The caller owns sizing/styling via CSS. */
export function mountSandbox(parent: HTMLElement, files: WebFiles, opts: MountOptions = {}): SandboxHandle {
  const iframe = document.createElement('iframe');
  // Only allow-scripts. NEVER add allow-same-origin: that would give player code the game's origin.
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.setAttribute('title', 'Your page');
  iframe.src = SANDBOX_URL;
  let nonce: string | null = null;
  let started = false;
  let gone = false;

  const startTimer = setTimeout(() => {
    if (!started && !gone) opts.onStartFailure?.();
  }, START_TIMEOUT_MS);

  const onMessage = (e: MessageEvent) => {
    if (e.source !== iframe.contentWindow || !isSandboxOut(e.data)) return;
    const m: SandboxOut = e.data;
    if (m.type === 'hello') {
      if (nonce !== null) return; // only the first hello counts: later ones could come from player code
      nonce = m.nonce;
      started = true;
      clearTimeout(startTimer);
      const msg: SandboxIn = {
        cq: 'run',
        files,
        config: {
          mode: opts.mode ?? 'run',
          api: opts.api ? apiConfig(opts.api) : { collections: {}, required: {}, latency: 20 },
          check: opts.check,
          storage: opts.storage,
        },
      };
      iframe.contentWindow?.postMessage(msg, '*');
      return;
    }
    if (m.nonce !== nonce) return;
    if (m.type === 'console') opts.onConsole?.(String(m.level).slice(0, 12), String(m.text).slice(0, 2000));
    else if (m.type === 'error') opts.onError?.(String(m.text).slice(0, 2000));
    else if (m.type === 'ready') opts.onReady?.();
    else if (m.type === 'result') opts.onResult?.(m.passed === true, String(m.message ?? '').slice(0, 2000));
  };
  window.addEventListener('message', onMessage);
  parent.appendChild(iframe);
  return {
    iframe,
    destroy() {
      gone = true;
      clearTimeout(startTimer);
      window.removeEventListener('message', onMessage);
      iframe.remove();
    },
  };
}

/** Run one check in a fresh hidden iframe. Never rejects: failures become a failed outcome. */
function runCheck(files: WebFiles, check: WebCheck): Promise<{ passed: boolean; message: string }> {
  return new Promise((resolve) => {
    const holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:fixed;left:-20000px;top:0;visibility:hidden;pointer-events:none;';
    document.body.appendChild(holder);
    let handle: SandboxHandle | null = null;
    let settled = false;
    const finish = (passed: boolean, message: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      handle?.destroy();
      holder.remove();
      resolve({ passed, message });
    };
    const timer = setTimeout(() => finish(false, 'The check did not finish in time.'), CHECK_TIMEOUT_MS);
    handle = mountSandbox(holder, files, {
      mode: 'grade',
      api: check.api ?? 'a',
      check: { script: check.script, errorsOk: check.errorsOk },
      storage: check.storage,
      onResult: finish,
      onStartFailure: () => finish(false, 'The web sandbox could not start. Try reloading the page.'),
    });
    const w = check.viewport?.width ?? 1024;
    const h = check.viewport?.height ?? 768;
    handle.iframe.style.cssText = `width:${w}px;height:${h}px;border:0;`;
  });
}

export const isWebCheck = (c: Check): c is WebCheck => c.kind === 'web';

/** Grade a web project: every check in its own sandbox. `code` is the JSON of the three files. */
export async function gradeWeb(files: WebFiles, checks: Check[]): Promise<GradeResult> {
  const outcomes: CheckOutcome[] = [];
  for (const c of checks) {
    if (!isWebCheck(c)) continue;
    const r = await runCheck(files, c);
    outcomes.push({ name: c.name, passed: r.passed, visible: c.visible !== false, message: r.passed ? '' : c.feedback ? `${r.message} ${c.feedback}`.trim() : r.message });
  }
  return { passed: outcomes.length > 0 && outcomes.every((o) => o.passed), error: '', timedOut: false, checks: outcomes, constraints: [] };
}

export function parseWebFiles(code: string): WebFiles {
  try {
    const v = JSON.parse(code) as Partial<WebFiles>;
    return { html: String(v.html ?? ''), css: String(v.css ?? ''), js: String(v.js ?? '') };
  } catch {
    return { html: '', css: '', js: '' };
  }
}

/** CodeRunner adapter so the web language plugs into the same grading contract as Python and SQL. */
export class WebRunner implements CodeRunner {
  supports(language: Language): boolean {
    return language === 'web';
  }
  run(_request: RunRequest): Promise<RunResult> {
    return Promise.reject(new Error('Web projects are run by mounting the sandbox (see mountSandbox).'));
  }
  grade(request: GradeRequest): Promise<GradeResult> {
    return gradeWeb(parseWebFiles(request.code), request.checks);
  }
}
