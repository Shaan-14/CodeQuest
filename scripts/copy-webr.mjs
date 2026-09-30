// Copies the webR runtime (real R compiled to WebAssembly; self-hosted, no CDN) from node_modules into public/webr/.
// Runs on postinstall/predev/prebuild. public/webr/ is gitignored (derived from the npm package) and loaded only when an R lesson opens.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'webr', 'dist');
const dest = join(root, 'public', 'webr');
const entries = ['R.js', 'R.wasm', 'libRblas.so', 'libRlapack.so', 'webr-worker.js', 'vfs'];

if (!existsSync(src)) {
  console.warn('[copy-webr] node_modules/webr not found; run npm install first.');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const f of entries) if (existsSync(join(src, f))) cpSync(join(src, f), join(dest, f), { recursive: true });
console.log(`[copy-webr] copied ${entries.length} entries to public/webr/`);
