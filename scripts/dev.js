// Development launcher for ProofPath: runs backend and frontend concurrently
const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('----------------------------------------------------');
console.log(' Starting ProofPath Backend & Frontend...');
console.log('----------------------------------------------------');

const backend = spawn('node', ['backend/server.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

const frontend = spawn(npmCmd, ['--prefix', 'frontend', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});
