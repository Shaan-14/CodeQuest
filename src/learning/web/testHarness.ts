/**
 * TEST-ONLY: drives the REAL sandbox page in headless Chromium (playwright-core) to grade web challenges in
 * Node, exactly as the game does in the browser. The sandbox page is loaded as a top-level page from a temp
 * file; the same postMessage protocol is exercised (the harness plays the host).
 */
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Browser } from 'playwright-core';
import type { Check, WebCheck, WebFiles } from '../../content/schema';
import type { GradeResult } from '../runner';
import { apiConfig } from './apiData';
import { buildSandboxPage } from './sandboxPage';

export function findChromium(): string | undefined {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(root)) {
    const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
    if (dir) return `${root}/${dir}/chrome-linux/chrome`;
  }
  return undefined;
}

export interface RunOutcome {
  messages: Record<string, unknown>[];
  result?: { passed: boolean; message: string };
}

export interface WebHarness {
  /** Run one web check against files in a fresh page. */
  check(files: WebFiles, check: Pick<WebCheck, 'script' | 'viewport' | 'api' | 'errorsOk' | 'storage'>): Promise<{ passed: boolean; message: string }>;
  /** Run in "run" mode and report console/error messages (what the Run button would show). */
  run(files: WebFiles, opts?: { api?: 'a' | 'b'; waitMs?: number; viewport?: { width: number; height?: number } }): Promise<{ logs: { level: string; text: string }[]; errors: string[]; html: string }>;
  grade(files: WebFiles, checks: Check[]): Promise<GradeResult>;
  close(): Promise<void>;
}

export async function startWebHarness(): Promise<WebHarness> {
  const browser: Browser = await chromium.launch({ executablePath: findChromium(), args: ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const dir = mkdtempSync(join(tmpdir(), 'cq-web-'));
  const file = join(dir, 'web-sandbox.html');
  writeFileSync(file, buildSandboxPage());
  const url = pathToFileURL(file).href;

  // One browser context; a small pool of pages so checks of a challenge can run concurrently and cheaply.
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await ctx.addInitScript(() => {
    const w = window as unknown as { __msgs: Record<string, unknown>[]; __orig: (m: unknown, t: string) => void };
    w.__msgs = [];
    w.__orig = window.postMessage.bind(window);
    (window as unknown as { postMessage: unknown }).postMessage = (m: { cq?: unknown }) => {
      if (m && m.cq === true) w.__msgs.push(m as Record<string, unknown>);
    };
  });
  const idle: import('playwright-core').Page[] = [];
  const POOL = 6;
  let inUse = 0;
  const waiters: (() => void)[] = [];
  async function acquire(): Promise<import('playwright-core').Page> {
    while (inUse >= POOL) await new Promise<void>((r) => waiters.push(r));
    inUse++;
    return idle.pop() ?? (await ctx.newPage());
  }
  function release(p: import('playwright-core').Page) {
    inUse--;
    idle.push(p);
    waiters.shift()?.();
  }

  async function session<T>(files: WebFiles, config: Record<string, unknown>, viewport: { width: number; height?: number } | undefined, until: 'result' | 'ready', extraWaitMs: number, after: (page: import('playwright-core').Page, msgs: Record<string, unknown>[]) => Promise<T>): Promise<T> {
    const page = await acquire();
    try {
      await page.setViewportSize({ width: viewport?.width ?? 1024, height: viewport?.height ?? 768 });
      await page.goto(url);
      await page.waitForFunction(() => (window as unknown as { __msgs: { type: string }[] }).__msgs.some((m) => m.type === 'hello'), undefined, { timeout: 10000, polling: 10 });
      await page.evaluate(([f, c]) => (window as unknown as { __orig: (m: unknown, t: string) => void }).__orig({ cq: 'run', files: f, config: c }, '*'), [files, config] as const);
      await page.waitForFunction((u) => (window as unknown as { __msgs: { type: string }[] }).__msgs.some((m) => m.type === u), until, { timeout: 15000, polling: 10 });
      if (extraWaitMs) await page.waitForTimeout(extraWaitMs);
      const msgs = await page.evaluate(() => (window as unknown as { __msgs: Record<string, unknown>[] }).__msgs);
      return await after(page, msgs);
    } finally {
      release(page);
    }
  }

  const harness: WebHarness = {
    async check(files, check) {
      const config = { mode: 'grade', api: apiConfig(check.api ?? 'a'), check: { script: check.script, errorsOk: check.errorsOk }, storage: check.storage };
      try {
        return await session(files, config, check.viewport, 'result', 0, async (_p, msgs) => {
          const r = msgs.find((m) => m.type === 'result') as { passed: boolean; message: string } | undefined;
          return r ? { passed: r.passed, message: r.message } : { passed: false, message: 'no result' };
        });
      } catch (e) {
        return { passed: false, message: `harness: ${String(e).split('\n')[0]}` };
      }
    },
    async run(files, opts = {}) {
      const config = { mode: 'run', api: apiConfig(opts.api ?? 'a', 20) };
      return session(files, config, opts.viewport, 'ready', opts.waitMs ?? 300, async (page, msgs) => ({
        logs: msgs.filter((m) => m.type === 'console').map((m) => ({ level: String(m.level), text: String(m.text) })),
        errors: msgs.filter((m) => m.type === 'error').map((m) => String(m.text)),
        html: await page.evaluate(() => document.body.innerHTML),
      }));
    },
    async grade(files, checks) {
      const web = checks.filter((c): c is WebCheck => c.kind === 'web');
      const results = await Promise.all(web.map((c) => harness.check(files, c)));
      const outcomes = web.map((c, i) => ({ name: c.name, passed: results[i]!.passed, visible: c.visible !== false, message: results[i]!.passed ? '' : results[i]!.message }));
      return { passed: outcomes.length > 0 && outcomes.every((o) => o.passed), error: '', timedOut: false, checks: outcomes, constraints: [] };
    },
    async close() {
      await ctx.close();
      await browser.close();
    },
  };
  return harness;
}
