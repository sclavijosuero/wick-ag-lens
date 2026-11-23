const { execFile } = require('child_process');
const { test } = require('@playwright/test');
const { cliEntry, pkgDir } = require('./paths');

// The CLI prints "[Audit] ..." progress lines, then pretty-printed JSON.
function extractJson(stdout) {
  const start = stdout.search(/^\{$/m);
  if (start === -1) throw new Error(`No JSON found in CLI output:\n${stdout}`);
  return JSON.parse(stdout.slice(start));
}

function exec(args, timeout) {
  return new Promise((resolve) => {
    execFile(process.execPath, [cliEntry, ...args],
      { cwd: pkgDir, timeout, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => resolve({
        code: error ? (error.code ?? 1) : 0, stdout, stderr,
      }));
  });
}

// Shown as a step in the Playwright UI / HTML report, with the full output attached.
function runCli(args, { timeout = 80_000 } = {}) {
  return test.step(`wick-ag-lens ${args.join(' ')}`, async () => {
    const res = await exec(args, timeout);
    const info = test.info();
    await info.attach('cli-command', { body: `wick-ag-lens ${args.join(' ')}\nexit code: ${res.code}`, contentType: 'text/plain' });
    await info.attach('cli-stdout', { body: res.stdout || '(empty)', contentType: 'text/plain' });
    if (res.stderr) await info.attach('cli-stderr', { body: res.stderr, contentType: 'text/plain' });
    return res;
  });
}

async function audit(url, extraArgs = []) {
  const res = await runCli(['audit', url, ...extraArgs]);
  if (res.code !== 0) throw new Error(`CLI exited ${res.code}\n${res.stderr}\n${res.stdout}`);
  return { ...res, report: extractJson(res.stdout) };
}

// Flatten an audit step's findings into [{auditId, severity, elements, ...}]
function findingsOf(step) {
  return Object.values(step.new_findings || {})
    .flatMap((groups) => Object.values(groups).flat());
}
const idsOf = (step) => findingsOf(step).map((f) => f.auditId);

// Selectors reported for one audit in a step's findings
const selectorsFor = (step, auditId) =>
  findingsOf(step).filter((f) => f.auditId === auditId).flatMap((f) => f.elements.map((e) => e.selector));

// Elements of the focus-order state map for a step
const focusMap = (step) => step.page_state_maps?.focus_order?.elements ?? [];

// Decodes every step's screenshot_base64, checks it is a real JPEG, and attaches it to the
// current test (Attachments tab in the Playwright UI / HTML report). Returns the decoded buffers.
async function attachScreenshots(report, prefix = 'page') {
  const info = test.info();
  const buffers = [];
  for (const step of report.audit_trail) {
    if (!step.screenshot_base64) continue;
    const buf = Buffer.from(step.screenshot_base64, 'base64');
    buffers.push(buf);
    await info.attach(`${prefix}-step-${step.step}`, { body: buf, contentType: 'image/jpeg' });
  }
  return buffers;
}
const isJpeg = (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;

module.exports = { runCli, audit, extractJson, findingsOf, idsOf, selectorsFor, focusMap, attachScreenshots, isJpeg };
