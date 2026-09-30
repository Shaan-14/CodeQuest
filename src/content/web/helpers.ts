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
  return { ...rest, language: 'web', starterCode: '', starterFiles: starterFiles ?? blank, web: { tabs: tabs ?? ['html', 'css', 'js'], api } };
}

export function webDemo(d: { title: string; body: string; files: WebFiles; notice: string; api?: boolean }): DemoStep {
  return { kind: 'demo', title: d.title, body: d.body, code: '', language: 'web', files: d.files, api: d.api, notice: d.notice };
}

/**
 * Function checks for JavaScript challenges: the player's function is compared with a REFERENCE implementation
 * embedded in the check, over many inputs (cases are JS argument lists as source text, e.g. `'[1, 2, 3], 2'`).
 * Each group of cases is its own check. `pure` also verifies that the function did not change its inputs.
 */
export function jsCalls(fn: string, ref: string, cases: string[], opts: { pure?: boolean; visibleFirst?: boolean; group?: number } = {}): WebCheck[] {
  const size = opts.group ?? 4;
  const out: WebCheck[] = [];
  for (let i = 0; i < cases.length; i += size) {
    const chunk = cases.slice(i, i + size);
    const script = `
      const _ref = (${ref});
      const cases = [${chunk.map((c) => `() => [${c}]`).join(', ')}];
      for (const mk of cases) {
        const args = mk();
        const before = JSON.stringify(args);
        const want = _ref(...mk());
        let got;
        try { got = ${fn}(...args); } catch (e) { throw new Error('${fn}(' + before.slice(1, -1) + ') threw ' + (e && e.message ? e.message : e)); }
        h.eq(got, want, '${fn}(' + before.slice(1, -1) + ') should return ' + JSON.stringify(want));
        ${opts.pure ? "h.eq(JSON.stringify(args), before, '" + fn + " must not change the data it is given');" : ''}
      }`;
    out.push(web(i === 0 ? 'Typical inputs' : `More inputs (${i / size})`, script, { visible: !!opts.visibleFirst && i === 0 }));
  }
  return out;
}

/** A check that the page logs exactly these lines to the console. */
export const logs = (name: string, expected: string[], visible = true): WebCheck => web(name, `h.eq(h.logs.map((l) => l.text), ${JSON.stringify(expected)}, 'What your program printed to the console');`, { visible });
