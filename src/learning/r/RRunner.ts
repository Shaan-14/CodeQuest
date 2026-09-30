/**
 * REAL R, compiled to WebAssembly (webR). Code runs in webR's own worker; each run and each check gets a FRESH environment,
 * so a program cannot pass because an earlier run defined something. Graded by behaviour: printed output, values of
 * variables, and authored R assertions run in the player's environment (function results on hidden inputs).
 * A runaway program is stopped by closing webR and starting a new one, like the Python worker.
 */
import type { Check, Constraint, Fixtures, Json } from '../../content/schema';
import type { CheckOutcome, CodeRunner, GradeRequest, GradeResult, Language, RunRequest, RunResult } from '../runner';

/** The slice of webR this runner uses (kept structural so tests can run it in Node and the UI can load it lazily). */
interface WebRLike {
  init(): Promise<void>;
  close(): void | Promise<void>;
  Shelter: new () => Promise<ShelterLike>;
  REnvironment: new (x: object) => Promise<EnvLike>;
  FS: { mkdir(p: string): Promise<unknown>; writeFile(p: string, data: Uint8Array): Promise<unknown> };
  evalRVoid(code: string): Promise<void>;
}
interface EnvLike { get(name: string): Promise<{ toJs(): Promise<unknown> } | unknown>; bind?(n: string, v: unknown): Promise<void> }
interface ShelterLike {
  captureR(code: string, opts: { env?: EnvLike; captureStreams?: boolean; captureConditions?: boolean; captureGraphics?: boolean }): Promise<{ result: { toJs(): Promise<unknown> }; output: { type: string; data: unknown }[] }>;
  purge(): Promise<void>;
}

export interface RRunnerOptions {
  /** Where webR's files are served from (browser). Omit in Node: the npm package is used directly. */
  baseUrl?: string;
  loadWebR?: () => Promise<{ WebR: new (o: object) => WebRLike; ChannelType?: Record<string, number> }>;
}

const RUN_DIR = '/home/web_user/cq';

export class RRunner implements CodeRunner {
  private webR: WebRLike | null = null;
  private shelter: ShelterLike | null = null;
  private booting: Promise<void> | null = null;
  status: 'idle' | 'loading' | 'ready' | 'restarting' = 'idle';

  constructor(private opts: RRunnerOptions = {}) {}
  supports(language: Language): boolean { return language === 'r'; }

  private async boot(): Promise<void> {
    this.status = 'loading';
    const mod = await (this.opts.loadWebR ? this.opts.loadWebR() : import('webr').then((m) => m as unknown as { WebR: new (o: object) => WebRLike; ChannelType?: Record<string, number> }));
    const config: Record<string, unknown> = { interactive: false };
    if (this.opts.baseUrl) { config.baseUrl = this.opts.baseUrl; config.channelType = mod.ChannelType?.PostMessage; }
    const webR = new mod.WebR(config);
    await webR.init();
    this.webR = webR;
    this.shelter = await new webR.Shelter();
    this.status = 'ready';
  }
  warmUp(): Promise<void> { return (this.booting ??= this.boot().catch((e) => { this.booting = null; this.status = 'idle'; throw e; })); }

  private async restart(): Promise<void> {
    this.status = 'restarting';
    try { await this.webR?.close(); } catch { /* already gone */ }
    this.webR = null; this.shelter = null; this.booting = null;
    await this.warmUp();
  }

  /** Runs code in a fresh environment. Output and errors are captured, never thrown. */
  private async exec(code: string, env: EnvLike): Promise<{ out: string; err: string }> {
    const r = await this.shelter!.captureR(code, { env, captureStreams: true, captureConditions: false, captureGraphics: false });
    const join = (t: string) => r.output.filter((o) => o.type === t).map((o) => String(o.data)).join('\n');
    return { out: join('stdout'), err: join('stderr') };
  }

  private async freshEnv(fixtures?: Fixtures): Promise<EnvLike> {
    const webR = this.webR!;
    const env = await new webR.REnvironment({});
    try { await webR.FS.mkdir(RUN_DIR); } catch { /* exists */ }
    for (const [name, content] of Object.entries(fixtures?.files ?? {})) await webR.FS.writeFile(`${RUN_DIR}/${name}`, new TextEncoder().encode(content));
    await this.exec(`setwd("${RUN_DIR}")`, env);
    return env;
  }

  private withTimeout<T>(p: Promise<T>, ms: number): Promise<T | 'timeout'> {
    let timer: ReturnType<typeof setTimeout>;
    const t = new Promise<'timeout'>((res) => { timer = setTimeout(() => res('timeout'), ms); });
    return Promise.race([p, t]).finally(() => clearTimeout(timer));
  }

  async run(req: RunRequest): Promise<RunResult> {
    await this.warmUp();
    const go = async (): Promise<RunResult> => {
      const env = await this.freshEnv(req.fixtures);
      const { out, err } = await this.exec(req.code, env);
      const errorLine = /<text>:(\d+):/.exec(err)?.[1];
      const isErr = /^Error/m.test(err);
      return { ok: !isErr, stdout: out, error: isErr ? tidy(err) : '', errorLine: errorLine ? Number(errorLine) : undefined, timedOut: false, truncated: false };
    };
    const res = await this.withTimeout(go(), req.timeoutMs);
    if (res === 'timeout') { await this.restart(); return { ok: false, stdout: '', error: 'Your program ran for too long, so it was stopped. That usually means a loop that never ends.', timedOut: true, truncated: false }; }
    return res;
  }

  async grade(req: GradeRequest): Promise<GradeResult> {
    await this.warmUp();
    const code = req.code;
    const outcomes: CheckOutcome[] = [];
    let fatal = '';
    const work = async (): Promise<void> => {
      for (const c of req.checks) outcomes.push(await this.check(c, code, req.fixtures));
    };
    const res = await this.withTimeout(work(), req.timeoutMs);
    if (res === 'timeout') { await this.restart(); return { passed: false, error: 'Your program ran for too long, so it was stopped. That usually means a loop that never ends.', timedOut: true, checks: [], constraints: [] }; }
    const stripped = code.replace(/#.*$/gm, '').replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
    const cons = (req.constraints ?? []).map((k: Constraint) => {
      const m = /^r:(.*)$/.exec(k.node);
      const has = m ? new RegExp(m[1]!, 'i').test(stripped) : true;
      return { message: k.message, passed: k.type === 'requires' ? has : !has };
    });
    const firstError = outcomes.find((o) => o.message.startsWith('Your code could not run'));
    if (firstError) fatal = firstError.message;
    return { passed: outcomes.every((o) => o.passed) && cons.every((k) => k.passed), error: fatal, timedOut: false, checks: fatal ? [] : outcomes, constraints: cons };
  }

  private async check(c: Check, code: string, baseFixtures?: Fixtures): Promise<CheckOutcome> {
    const k = c as { kind: string; name: string; visible?: boolean; feedback?: string; files?: Record<string, string> };
    const base = { name: k.name, visible: k.visible !== false };
    const fixtures: Fixtures = { ...baseFixtures, files: { ...(baseFixtures?.files ?? {}), ...(k.files ?? {}) } };
    const env = await this.freshEnv(fixtures);
    const fail = (message: string, expected?: string, actual?: string): CheckOutcome => ({ ...base, passed: false, message: k.feedback ?? message, expected, actual });
    const prelude = (c as { prelude?: string }).prelude;
    if (prelude) await this.exec(prelude, env);
    const { out, err } = await this.exec(code, env);
    if (/^Error/m.test(err)) return { ...base, passed: false, message: `Your code could not run: ${tidy(err)}` };
    switch (k.kind) {
      case 'output': {
        const expect = (c as { expect: string }).expect;
        const ignoreCase = (c as { ignoreCase?: boolean }).ignoreCase;
        // Trailing spaces on a line are not part of the answer (cat("x", "\n") leaves one before the newline).
        const norm = (t: string) => t.split('\n').map((l) => l.trimEnd()).join('\n').trim();
        const a = norm(out); const e = norm(expect);
        return (ignoreCase ? a.toLowerCase() === e.toLowerCase() : a === e) ? { ...base, passed: true, message: '' } : fail('The printed output is not what the task asks for.', e, a);
      }
      case 'variable': {
        const { variable, expect, approx } = c as { variable: string; expect: Json; approx?: number };
        let got: unknown;
        try { const v = await env.get(variable) as { toJs(): Promise<unknown> } | undefined; got = v && typeof (v as { toJs?: unknown }).toJs === 'function' ? await v.toJs() : undefined; } catch { got = undefined; }
        if (got === undefined) return fail(`The variable ${variable} was not created.`);
        const vals = (got as { values?: unknown[] }).values ?? got;
        const actual = Array.isArray(vals) && vals.length === 1 && !Array.isArray(expect) ? vals[0] : vals;
        return sameJson(actual, expect, approx) ? { ...base, passed: true, message: '' } : fail(`${variable} does not hold the expected value.`, JSON.stringify(expect), JSON.stringify(actual));
      }
      case 'script': {
        const s = (c as { code: string }).code;
        const r = await this.exec(`.cq_ok <- tryCatch({ ${s}\nTRUE }, error = function(e) conditionMessage(e))\nif (!isTRUE(.cq_ok)) cat("@@FAIL@@", .cq_ok)`, env);
        const m = /@@FAIL@@ ?([\s\S]*)/.exec(r.out);
        return m ? fail(m[1]!.trim() || 'A check on your result did not pass.') : { ...base, passed: true, message: '' };
      }
      default: return fail('This kind of check is not available for R.');
    }
  }
}

function tidy(err: string): string {
  return err.replace(/^Error in eval\(.*?\) : /m, 'Error: ').replace(/<text>:/g, 'line ').replace(/^Error: /m, 'Error: ').split('\n').slice(0, 6).join('\n');
}

function sameJson(a: unknown, b: unknown, approx = 1e-9): boolean {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= approx;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => sameJson(x, b[i], approx));
  return a === b;
}
