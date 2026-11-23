const { execFile } = require('child_process');
const { cliEntry, pkgDir } = require('./paths');

// The CLI prints "[Audit] ..." progress lines, then pretty-printed JSON.
function extractJson(stdout) {
  const start = stdout.search(/^\{$/m);
  if (start === -1) throw new Error(`No JSON found in CLI output:\n${stdout}`);
  return JSON.parse(stdout.slice(start));
}

function runCli(args, { timeout = 80_000 } = {}) {
  return new Promise((resolve) => {
    execFile(process.execPath, [cliEntry, ...args],
      { cwd: pkgDir, timeout, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => resolve({
        code: error ? (error.code ?? 1) : 0, stdout, stderr,
      }));
  });
}

async function audit(url, extraArgs = []) {
  const res = await runCli(['audit', url, ...extraArgs]);
  if (res.code !== 0) throw new Error(`CLI exited ${res.code}\n${res.stderr}\n${res.stdout}`);
  return { ...res, report: extractJson(res.stdout) };
}

module.exports = { runCli, audit, extractJson };

// Flatten an audit step's findings into [{auditId, severity, elements, ...}]
function findingsOf(step) {
  return Object.values(step.new_findings || {})
    .flatMap((groups) => Object.values(groups).flat());
}
const idsOf = (step) => findingsOf(step).map((f) => f.auditId);

module.exports.findingsOf = findingsOf;
module.exports.idsOf = idsOf;
