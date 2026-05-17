import { defineConfig } from 'vite';

export default defineConfig({
  base: '/manic-miner/',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
