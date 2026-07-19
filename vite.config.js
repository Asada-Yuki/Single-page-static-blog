import { defineConfig } from 'vite';

// 凪 — Slumber in Blue
// Single-page static site. Relative base so the build can be hosted anywhere.
export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2020',
    cssMinify: true,
  },
});
