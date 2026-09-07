import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

function gitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'uncommitted-lab';
  }
}

export default defineConfig({
  define: {
    __GIT_HASH__: JSON.stringify(gitHash()),
    __NULL_BUS_VERSION__: JSON.stringify('0.1.0-lab'),
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.monkeycode-ai.live'],
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
