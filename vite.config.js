import { defineConfig } from 'vite';
import { resolve } from 'path';

// Two HTML entry points: the control window (laptop) and the output window (projector).
export default defineConfig({
  // Relative asset paths, so a build runs from any location — the root of a domain,
  // a GitHub Pages sub-path like /live-visuals/, or a plain folder behind any static
  // host. Without this, a sub-path deploy 404s on every asset.
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        output: resolve(__dirname, 'output.html'),
      },
    },
  },
});
