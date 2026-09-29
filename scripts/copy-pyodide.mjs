// Copies the Pyodide runtime (self-hosted; no CDN dependency) from node_modules into public/pyodide/.
// Runs on postinstall/predev/prebuild. public/pyodide/ is gitignored (~14MB, derived from the npm package).
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'pyodide');
const dest = join(root, 'public', 'pyodide');
const files = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];

if (!existsSync(src)) {
  console.warn('[copy-pyodide] node_modules/pyodide not found; run npm install first.');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const f of files) cpSync(join(src, f), join(dest, f));
console.log(`[copy-pyodide] copied ${files.length} files to public/pyodide/`);
