import { defineConfig } from 'vite';
import { resolve } from 'path';

// Two HTML entry points: the control window (laptop) and the output window (projector).
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        output: resolve(__dirname, 'output.html'),
      },
    },
  },
});
