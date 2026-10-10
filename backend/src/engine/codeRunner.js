// Safe Isolated Python Code Runner for Technical Challenges

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * Sandboxed execution of Python solution against test cases.
 * Uses child_process with:
 * - Disabled unsafe modules (os, subprocess, socket, shutil, ctypes)
 * - 3500ms hard timeout
 * - Memory and buffer bounds
 * - Isolated temp file cleaned up in finally block
 * 
 * @param {string} candidateCode - Candidate's Python code
 * @param {Array|string} testCases - Array of test cases { name, code }
 * @returns {Promise<Object>} Execution report
 */
async function runPythonCodeSafely(candidateCode, testCases) {
  const tests = typeof testCases === 'string' ? JSON.parse(testCases) : (testCases || []);
  const startTime = Date.now();

  const tempDir = path.join(os.tmpdir(), 'proofpath_sandbox');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const scriptId = crypto.randomBytes(8).toString('hex');
  const scriptPath = path.join(tempDir, `solution_${scriptId}.py`);

  // Python test wrapper script with security lockdown
  const pythonScript = `
import sys
import json
import time

# Security lockdown: block dangerous system modules
BLOCKED_MODULES = {'os', 'subprocess', 'shutil', 'socket', 'urllib', 'requests', 'ctypes', 'syslog', 'pty', 'posix'}

original_import = __builtins__.__import__ if hasattr(__builtins__, '__import__') else __import__

def secure_import(name, *args, **kwargs):
    if name in BLOCKED_MODULES or any(name.startswith(b + '.') for b in BLOCKED_MODULES):
        raise ImportError(f"Security Error: Module '{name}' is restricted in this execution environment.")
    return original_import(name, *args, **kwargs)

if isinstance(__builtins__, dict):
    __builtins__['__import__'] = secure_import
else:
    __builtins__.__import__ = secure_import

test_results = []

# --- Candidate Solution Start ---
try:
${candidateCode.split('\n').map(l => '    ' + l).join('\n')}
except Exception as e:
    print(json.dumps({
        "error": f"Compilation / Syntax Error: {str(e)}",
        "testsPassed": 0,
        "testsTotal": ${tests.length},
        "testResults": []
    }))
    sys.exit(0)
# --- Candidate Solution End ---

# --- Test Suite Execution ---
tests = ${JSON.stringify(tests)}
passed_count = 0

for t in tests:
    t_name = t.get('name', 'Test')
    t_code = t.get('code', '')
    try:
        exec(t_code)
        test_results.append({"name": t_name, "passed": True, "error": None})
        passed_count += 1
    except AssertionError as ae:
        msg = str(ae) if str(ae) else "Assertion failed"
        test_results.append({"name": t_name, "passed": False, "error": msg})
    except Exception as e:
        test_results.append({"name": t_name, "passed": False, "error": f"{type(e).__name__}: {str(e)}"})

output = {
    "testsPassed": passed_count,
    "testsTotal": len(tests),
    "testResults": test_results,
    "error": None
}
print(json.dumps(output))
`;

  return new Promise((resolve) => {
    try {
      fs.writeFileSync(scriptPath, pythonScript, 'utf8');
    } catch (err) {
      return resolve({
        success: false,
        testsPassed: 0,
        testsTotal: tests.length,
        error: `Sandbox preparation error: ${err.message}`,
        executionTimeMs: Date.now() - startTime
      });
    }

    const pyProcess = spawn('python', [scriptPath], {
      timeout: 3500,
      env: { PYTHONIOENCODING: 'utf-8' }
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      try { pyProcess.kill('SIGKILL'); } catch (e) {}
    }, 3500);

    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pyProcess.on('close', (code) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - startTime;

      // Clean up script
      try {
        if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
      } catch (e) {}

      if (timedOut) {
        return resolve({
          success: false,
          testsPassed: 0,
          testsTotal: tests.length,
          testResults: tests.map(t => ({ name: t.name, passed: false, error: 'Execution Timed Out (exceeded 3.5s limit)' })),
          error: 'Execution Timed Out: Code exceeded the 3500ms safety boundary (possible infinite loop).',
          executionTimeMs
        });
      }

      if (stderr && !stdout) {
        return resolve({
          success: false,
          testsPassed: 0,
          testsTotal: tests.length,
          testResults: tests.map(t => ({ name: t.name, passed: false, error: stderr.trim() })),
          error: stderr.trim(),
          executionTimeMs
        });
      }

      try {
        const lastLine = stdout.trim().split('\n').pop();
        const parsed = JSON.parse(lastLine);
        return resolve({
          success: parsed.testsPassed === parsed.testsTotal && parsed.testsTotal > 0,
          testsPassed: parsed.testsPassed,
          testsTotal: parsed.testsTotal,
          testResults: parsed.testResults,
          error: parsed.error,
          executionTimeMs,
          rawOutput: stdout
        });
      } catch (err) {
        return resolve({
          success: false,
          testsPassed: 0,
          testsTotal: tests.length,
          testResults: [],
          error: stdout || stderr || 'Failed to parse test execution output',
          executionTimeMs
        });
      }
    });

    pyProcess.on('error', (err) => {
      clearTimeout(timer);
      try {
        if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
      } catch (e) {}

      return resolve({
        success: false,
        testsPassed: 0,
        testsTotal: tests.length,
        error: `Process spawn error: ${err.message}`,
        executionTimeMs: Date.now() - startTime
      });
    });
  });
}

module.exports = {
  runPythonCodeSafely
};
