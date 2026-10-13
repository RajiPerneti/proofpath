const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function findTestFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findTestFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const testFiles = findTestFiles(__dirname);
if (testFiles.length === 0) {
  console.log('No test files found in tests directory.');
  process.exit(0);
}

const child = spawn(process.execPath, ['--test', ...testFiles], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'test' }
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
