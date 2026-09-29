import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  // Relative base so the built app works from any path (GitHub Pages, a subfolder, or file hosting).
  base: './',
  plugins: [preact()],
  worker: { format: 'es' },
  test: { environment: 'node', include: ['src/**/*.test.ts'], testTimeout: 30_000 },
});
