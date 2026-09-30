import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { buildSandboxPage } from './src/learning/web/sandboxPage';

/**
 * Production-only Content-Security-Policy (dev needs inline scripts for hot reload).
 * Blocks third-party scripts and network calls from the page. NOTE: a <meta> CSP does not apply
 * to Web Workers, so the Python worker is hardened separately (see ARCHITECTURE.md, Security model).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // CodeMirror injects <style> elements
  "img-src 'self' data:",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

export default defineConfig({
  // Relative base so the built app works from any path (GitHub Pages, a subfolder, or file hosting).
  base: './',
  plugins: [
    preact(),
    {
      // The web sandbox page is generated from the runtime sources: served in dev, emitted in the build.
      name: 'codequest-web-sandbox',
      configureServer: (server) => {
        server.middlewares.use('/web-sandbox.html', (_req, res) => {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(buildSandboxPage());
        });
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'web-sandbox.html', source: buildSandboxPage() });
      },
    },
    {
      name: 'codequest-csp',
      apply: 'build',
      transformIndexHtml: (html) => html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
    },
  ],
  worker: { format: 'es' },
  test: { environment: 'node', include: ['src/**/*.test.ts'], testTimeout: 30_000 },
});
