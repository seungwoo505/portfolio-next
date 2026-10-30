const path = require('node:path');
const fs = require('node:fs');
const { spawn, execFileSync } = require('node:child_process');
const { startFixtureApi } = require('./isolated-api');
const { getGuardNodeOptions } = require('./isolated-network');

const root = path.resolve(__dirname, '..');
const apiPort = Number(process.env.ISOLATED_API_PORT) || 4319;
const appPort = Number(process.env.ISOLATED_APP_PORT) || 4318;
const apiUrl = `http://127.0.0.1:${apiPort}`;
const guard = path.join(__dirname, 'isolated-network.js');
const env = {
  ...process.env,
  NEXT_PUBLIC_ISOLATED_PREVIEW: '1',
  NEXT_PUBLIC_API_URL: apiUrl,
  INTERNAL_API_URL: apiUrl,
  SERVER_PUBLIC_API_FALLBACK_URL: apiUrl,
  NEXT_TELEMETRY_DISABLED: '1',
  // Do not inherit unrelated preload modules or proxy settings into verification.
  NODE_OPTIONS: getGuardNodeOptions(guard),
  HTTP_PROXY: '', HTTPS_PROXY: '', ALL_PROXY: '',
  http_proxy: '', https_proxy: '', all_proxy: '',
  NO_PROXY: '127.0.0.1,localhost,::1',
};
Object.assign(process.env, env);
require('./isolated-network').installNetworkGuard();
const server = startFixtureApi({ port: apiPort });
const next = require.resolve('next/dist/bin/next');
const children = new Set();
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (process.platform === 'win32') {
      try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { child.kill(); }
    } else child.kill('SIGTERM');
  }
  server.close(() => process.exit(code));
  setTimeout(() => process.exit(code), 3000).unref();
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
server.on('error', (error) => { console.error(error); stop(1); });
function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [next, ...args], { cwd: root, env, stdio: 'inherit', windowsHide: true });
    children.add(child);
    fs.mkdirSync(path.join(root, '.verification'), { recursive: true });
    fs.writeFileSync(path.join(root, '.verification', 'isolated-preview-processes.json'), JSON.stringify({ launcherPid: process.pid, nextPid: child.pid, appUrl: `http://127.0.0.1:${appPort}`, apiUrl, fixture: true }, null, 2));
    child.on('error', (error) => { console.error(error); resolve(1); });
    child.on('exit', (code) => { children.delete(child); resolve(code ?? 1); });
  });
}
server.on('listening', async () => {
  console.log(`Isolated preview: http://127.0.0.1:${appPort}; fixture API: ${apiUrl}`);
  console.log('Synthetic credentials: fixture-admin / fixture-only-password. Stop: Ctrl+C (owned children only).');
  if (process.argv.includes('--build') || process.argv.includes('--build-only')) {
    const code = await run(['build', '--webpack']);
    if (code !== 0 || process.argv.includes('--build-only')) { stop(code); return; }
  }
  const mode = process.argv.includes('--start') || process.argv.includes('--build') ? 'start' : 'dev';
  stop(await run([mode, ...(mode === 'dev' ? ['--webpack'] : []), '--hostname', '127.0.0.1', '--port', String(appPort)]));
});
