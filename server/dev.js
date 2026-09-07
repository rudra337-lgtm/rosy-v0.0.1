// @ts-check
import { spawn } from 'node:child_process';

const isWin = process.platform === 'win32';
const npx = isWin ? 'npx.cmd' : 'npx';

const procs: ReturnType<typeof spawn>[] = [];

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  const p = spawn(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env }, shell: false });
  procs.push(p);
  p.on('error', (e) => console.error(`[dev] spawn error:`, e));
  return p;
}

const api = run(npx, ['tsx', 'watch', 'server/index.ts'], { API_DEV: '1', PORT: '8787' });
const web = run(npx, ['vite']);

function shutdown() {
  console.log('[dev] shutting down...');
  for (const p of procs) p.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);