import type { Challenge, DemoStep, WebCheck, WebFiles } from '../schema';

export const files = (html: string, css = '', js = ''): WebFiles => ({ html, css, js });
export const blank: WebFiles = { html: '', css: '', js: '' };

/**
 * A web check. `script` is the body of an async function run inside the sandbox page (see WebCheck in schema.ts):
 * helpers `h.*` read the DOM/styles, click, type, submit, wait for the in-game API, and assert.
 */
export const web = (name: string, script: string, opts: Partial<Omit<WebCheck, 'kind' | 'name' | 'script'>> = {}): WebCheck => ({ kind: 'web', name, script: script.trim(), ...opts });

/** Reusable check snippets. */
export const S = {
  doctype: "h.assert(/^\\s*<!doctype html>/i.test(h.files.html), 'Start the document with the doctype declaration.');",
  lang: "h.assert(/^[a-z]{2}(-[A-Za-z]{2})?$/.test(document.documentElement.getAttribute('lang') || ''), 'Tell browsers and screen readers the page language on the html element.');",
  title: "h.assert(document.title.trim().length > 0, 'The page needs a title (it appears in the browser tab).');",
  noErrors: "h.eq(h.errors.length, 0, 'The page produced JavaScript errors');",
};

export type WebChallenge = Omit<Challenge, 'language' | 'starterCode' | 'starterFiles' | 'web' | 'checks'> & {
  checks: WebCheck[];
  starterFiles?: WebFiles;
  tabs?: ('html' | 'css' | 'js')[];
  api?: boolean;
};

/** Builds a web challenge (language 'web', starter files instead of starter code). */
export function wc(c: WebChallenge): Challenge {
  const { starterFiles, tabs, api, ...rest } = c;
  return { ...rest, language: 'web', starterCode: starterFiles ? JSON.stringify(starterFiles) : '', starterFiles: starterFiles ?? blank, web: { tabs: tabs ?? ['html', 'css', 'js'], api } };
}

export function webDemo(d: { title: string; body: string; files: WebFiles; notice: string; api?: boolean }): DemoStep {
  return { kind: 'demo', title: d.title, body: d.body, code: '', language: 'web', files: d.files, api: d.api, notice: d.notice };
}
