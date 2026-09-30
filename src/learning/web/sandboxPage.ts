/**
 * Builds web-sandbox.html: the static page the game loads in a sandboxed iframe (sandbox="allow-scripts", no
 * allow-same-origin). Node-only (reads the runtime sources from disk): used by the Vite plugin (dev server + build
 * output) and by tests. The app itself only needs the page's URL.
 *
 * The page carries its own strict CSP so it works under the game's production CSP (an iframe loaded from a URL gets
 * its own policy; an about:srcdoc iframe would inherit the game's and lose inline scripts).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (name: string) => fileURLToPath(new URL(`./${name}`, import.meta.url));

/** The sandbox page's own policy: inline scripts only (its runtime), no network at all. */
const PAGE_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";

export function buildSandboxPage(): string {
  const api = readFileSync(here('apiServer.js'), 'utf8');
  const runtime = readFileSync(here('sandboxRuntime.js'), 'utf8');
  for (const [name, src] of [['apiServer.js', api], ['sandboxRuntime.js', runtime]] as const) {
    if (/<\/script/i.test(src)) throw new Error(`${name} must not contain a closing script tag (it is inlined into HTML)`);
  }
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${PAGE_CSP}"><title>CodeQuest web sandbox</title></head>
<body>
<script>${api}</script>
<script>${runtime}</script>
</body></html>
`;
}
