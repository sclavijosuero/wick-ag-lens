// Runs ONE evaluation run headlessly and records it. Costs real money (the model API), capped per run and in total.
//   node tests/benchmark/skill-eval/run.js <arm>-<n>        e.g. node tests/benchmark/skill-eval/run.js A-1
// Output: tests/benchmark/skill-eval-runs/<DATE>/<arm>-<n>/ (run.jsonl, agent-summary.md, audit-report.json when one was saved, meta.json)
// and one more row in the ledger.json of that folder. The run does not start if the ledger would pass the hard limit.
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const { spawn, spawnSync } = require('child_process');
const { ARMS, SCHEDULE, prompts, PLAYWRIGHT_MCP } = require('./arms');
const { cloneProject, WORK, REPO } = require('./make-project');

const DATE = process.env.EVAL_DATE || '2026-11-27';
const OUT_ROOT = path.join(REPO, 'tests', 'benchmark', 'skill-eval-runs', DATE);
const LEDGER = path.join(OUT_ROOT, 'ledger.json');
const HARD_LIMIT = 30;     // USD, all runs together (non negotiable)
const RUN_CAP = 1.5;       // USD per run (--max-budget-usd)
const TIMEOUT_MS = 20 * 60 * 1000;

const readLedger = () => (fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : { hardLimitUsd: HARD_LIMIT, runCapUsd: RUN_CAP, runs: [] });
const total = (l) => l.runs.reduce((a, r) => a + (r.costUsd || 0), 0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitPort(port, ms = 10000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function tryOnce() {
      const s = net.connect(port, '127.0.0.1');
      s.on('connect', () => { s.destroy(); resolve(); });
      s.on('error', () => { s.destroy(); Date.now() - t0 > ms ? reject(new Error('shop did not start')) : setTimeout(tryOnce, 150); });
    })();
  });
}

async function main() {
  const id = process.argv[2];
  const [armName] = id.split('-');
  const arm = ARMS[armName];
  if (!arm) throw new Error(`unknown arm in "${id}"`);
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  const ledger = readLedger();
  if (total(ledger) + RUN_CAP > HARD_LIMIT) throw new Error(`budget: ledger ${total(ledger).toFixed(2)} + cap ${RUN_CAP} would pass the hard limit of ${HARD_LIMIT} USD. Not started.`);
  if (ledger.runs.some((r) => r.id === id && !r.discarded)) throw new Error(`${id} is already in the ledger`);

  const outDir = path.join(OUT_ROOT, id);
  fs.mkdirSync(outDir, { recursive: true });
  const project = cloneProject(path.join(WORK, 'runs', id), armName);
  const slot = SCHEDULE.indexOf(id) >= 0 ? SCHEDULE.indexOf(id) : 20 + (Date.now() % 20);
  const port = 4600 + slot * 2; // the shop and its (unused) IdP use port and port + 1
  const url = `http://127.0.0.1:${port}/app/bench-shop.html`;

  const server = spawn(process.execPath, [path.join(REPO, 'tests', 'fixtures', 'server.js')], { env: { ...process.env, FIXTURE_PORT: String(port) }, stdio: 'ignore', windowsHide: true });
  try {
    await waitPort(port);

    // MCP servers of this arm (and none of the user's own: --strict-mcp-config).
    const mcpServers = {};
    if (arm.wick) mcpServers['wick-ag-lens'] = { command: process.execPath, args: [path.join(project, 'node_modules', 'wick-ag-lens', 'mcp-server.js')] };
    if (arm.playwright) mcpServers.playwright = { command: 'cmd', args: ['/c', 'npx', '-y', PLAYWRIGHT_MCP, '--headless', '--caps=core,storage', '--output-dir', project] };
    const mcpFile = path.join(WORK, 'runs', `${id}.mcp.json`);
    fs.writeFileSync(mcpFile, JSON.stringify({ mcpServers }, null, 2));

    const allowed = [...arm.tools.split(','), ...Object.keys(mcpServers).map((s) => `mcp__${s}`)].join(',');
    const args = ['-p', '--model', arm.model, '--tools', arm.tools, '--allowedTools', allowed, '--strict-mcp-config', '--mcp-config', mcpFile,
      '--setting-sources', 'project', '--max-budget-usd', String(RUN_CAP), '--no-session-persistence', '--permission-mode', 'dontAsk',
      '--output-format', 'stream-json', '--verbose'];
    const prompt = prompts[arm.prompt](url);
    fs.writeFileSync(path.join(outDir, 'prompt.txt'), prompt);

    const t0 = Date.now();
    const jsonl = fs.createWriteStream(path.join(outDir, 'run.jsonl'));
    const child = spawn('claude', args, { cwd: project, shell: true, windowsHide: true });
    child.stdin.end(prompt);
    child.stdout.pipe(jsonl);
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    const timer = setTimeout(() => { stderr += '\n[timeout]'; spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F']); }, TIMEOUT_MS);
    const code = await new Promise((r) => child.on('close', r));
    clearTimeout(timer);
    await new Promise((r) => jsonl.end(r));
    const wallSec = Math.round((Date.now() - t0) / 1000);

    // The result record (cost, usage, turns, final text).
    const lines = fs.readFileSync(path.join(outDir, 'run.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean);
    let result = null;
    for (const l of lines) { try { const o = JSON.parse(l); if (o.type === 'result') result = o; } catch { /* not JSON */ } }
    fs.writeFileSync(path.join(outDir, 'agent-summary.md'), result && result.result ? String(result.result) : '(no result record)');

    // Report JSON(s) the agent left in the project folder.
    const skipDirs = new Set(['node_modules', '.claude']);
    const found = [];
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (!skipDirs.has(e.name)) walk(p); } else if (e.name.endsWith('.json') && !/^package(-lock)?\.json$/.test(e.name)) found.push(p);
      }
    })(project);
    const reports = found.filter((p) => /"audit_trail"/.test(fs.readFileSync(p, 'utf8').slice(0, 4000000)));
    reports.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
    if (reports[0]) fs.copyFileSync(reports[0], path.join(outDir, 'audit-report.json'));

    const cost = result ? result.total_cost_usd : null;
    const meta = {
      id, arm: armName, model: arm.model, expectedRoute: arm.route, exitCode: code, wallSec, port,
      costUsd: cost, numTurns: result && result.num_turns, durationMs: result && result.duration_ms,
      subtype: result && result.subtype, isError: result && result.is_error, usage: result && result.usage,
      reportFile: reports[0] ? path.relative(project, reports[0]) : null, otherJson: found.map((p) => path.relative(project, p)), stderr: stderr.slice(-2000),
    };
    fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
    ledger.runs = ledger.runs.filter((r) => r.id !== id);
    ledger.runs.push({ id, arm: armName, model: arm.model, costUsd: cost || 0, subtype: meta.subtype, exitCode: code, wallSec, at: new Date().toISOString() });
    ledger.totalUsd = Number(total(ledger).toFixed(4));
    fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2));
    console.log(`${id}: cost $${(cost || 0).toFixed(3)} | ${meta.subtype} | turns ${meta.numTurns} | ${wallSec}s | ledger $${ledger.totalUsd} of ${HARD_LIMIT}`);
  } finally {
    server.kill();
    // The default agent-browser session is shared: close it so the next run starts clean.
    spawnSync(process.execPath, [path.join(WORK, 'base', 'node_modules', 'agent-browser', 'bin', 'agent-browser.js'), 'close'], { stdio: 'ignore' });
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
