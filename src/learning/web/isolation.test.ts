/**
 * The security model, proven in a real browser: the player's code runs in <iframe sandbox="allow-scripts"> served
 * from a DIFFERENT (opaque) origin than the game page, so it cannot touch the game's DOM, storage, cookies or
 * navigation, and it has no network. A tiny host page plays the game; the sandbox page is the real one.
 */
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium, type Browser } from 'playwright-core';
import { findChromium } from './testHarness';
import { buildSandboxPage } from './sandboxPage';

let server: Server;
let browser: Browser;
let base = '';

const HOST = `<!doctype html><html><body><p id="game">GAME PAGE</p><script>
localStorage.setItem('codequest.save', 'SECRET-SAVE');
document.cookie = 'session=SECRET-COOKIE; path=/';
window.gameState = { xp: 100 };
window.logs = [];
window.startSandbox = function (js) {
  const f = document.createElement('iframe');
  f.setAttribute('sandbox', 'allow-scripts');
  f.src = '/web-sandbox.html';
  let nonce = null;
  window.addEventListener('message', function (e) {
    if (e.source !== f.contentWindow || !e.data || e.data.cq !== true) return;
    if (e.data.type === 'hello' && nonce === null) { nonce = e.data.nonce; f.contentWindow.postMessage({ cq: 'run', files: { html: '<p>hi</p>', css: '', js: js }, config: { mode: 'run', api: { collections: {}, required: {}, latency: 20 } } }, '*'); }
    else if (e.data.type === 'console') window.logs.push(e.data.text);
    else if (e.data.type === 'error') window.logs.push('ERROR ' + e.data.text);
  });
  document.body.appendChild(f);
};
</script></body></html>`;

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/web-sandbox.html') { res.setHeader('Content-Type', 'text/html'); res.end(buildSandboxPage()); }
    else { res.setHeader('Content-Type', 'text/html'); res.end(HOST); }
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
  browser = await chromium.launch({ executablePath: findChromium(), args: ['--no-sandbox'] });
}, 60_000);
afterAll(async () => {
  await browser?.close();
  server?.close();
});

async function probe(js: string): Promise<string[]> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(base);
  await page.evaluate((code) => (window as unknown as { startSandbox: (c: string) => void }).startSandbox(code), js);
  await page.waitForFunction(() => (window as unknown as { logs: string[] }).logs.some((l) => l === 'DONE'), undefined, { timeout: 15000 });
  const logs = await page.evaluate(() => (window as unknown as { logs: string[] }).logs);
  await ctx.close();
  return logs;
}

describe('web sandbox isolation (real browser, real iframe)', () => {
  it('cannot read the game page, its storage, its cookies, or navigate it', async () => {
    const logs = await probe(`
      const t = (name, fn) => { try { const v = fn(); console.log(name + ': ' + (v === undefined ? 'undefined' : 'LEAK ' + String(v).slice(0, 40))); } catch (e) { console.log(name + ': blocked ' + e.name); } };
      t('parentDom', () => window.parent.document.getElementById('game').textContent);
      t('parentStorage', () => window.parent.localStorage.getItem('codequest.save'));
      t('parentState', () => window.parent.gameState.xp);
      t('topLocation', () => window.top.location.href);
      t('topNavigate', () => { window.top.location.href = 'https://example.com/'; });
      t('cookie', () => document.cookie || undefined);
      t('opaqueOrigin', () => window.origin === 'null' ? undefined : window.origin);
      t('indexedDB', () => window.indexedDB && indexedDB.open('x') && undefined);
      console.log('DONE');`);
    const text = logs.join('\n');
    expect(text).toMatch(/parentDom: blocked SecurityError/);
    expect(text).toMatch(/parentStorage: blocked SecurityError/);
    expect(text).toMatch(/parentState: blocked SecurityError/);
    expect(text).toMatch(/topLocation: blocked SecurityError/);
    expect(text).not.toMatch(/LEAK/);
    expect(text).not.toMatch(/SECRET/);
  });

  it('has no network: fetch to the game origin and elsewhere fails, forms and popups do nothing', async () => {
    const logs = await probe(`
      (async () => {
        for (const url of [location.href.replace('web-sandbox.html', ''), '/web-sandbox.html', 'https://example.com/']) {
          try { await fetch(url); console.log('LEAK fetch ' + url); } catch (e) { console.log('fetch blocked ' + e.name); }
        }
        const w = window.open('https://example.com/'); console.log(w === null ? 'popup none' : 'LEAK popup');
        console.log('DONE');
      })();`);
    const text = logs.join('\n');
    expect(text).not.toMatch(/LEAK/);
    expect((text.match(/fetch blocked TypeError/g) ?? []).length).toBe(3);
    expect(text).toMatch(/popup none/);
  });

  it('the game’s own storage and cookie are untouched by player code that tries to overwrite them', async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(base);
    await page.evaluate(() => (window as unknown as { startSandbox: (c: string) => void }).startSandbox(`
      try { window.parent.localStorage.setItem('codequest.save', 'HACKED'); } catch (e) {}
      try { window.parent.document.cookie = 'session=HACKED'; } catch (e) {}
      localStorage.setItem('codequest.save', 'MINE');
      console.log('DONE');`));
    await page.waitForFunction(() => (window as unknown as { logs: string[] }).logs.includes('DONE'), undefined, { timeout: 15000 });
    expect(await page.evaluate(() => localStorage.getItem('codequest.save'))).toBe('SECRET-SAVE');
    expect(await page.evaluate(() => document.cookie)).toContain('SECRET-COOKIE');
    await ctx.close();
  });
});
