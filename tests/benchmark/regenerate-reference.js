// Regenerates tests/benchmark/reference.js (the answer key) from real runs of the journey with the wick-ag-lens CLI. No LLM, no tokens.
//   node tests/benchmark/regenerate-reference.js [baseUrl]      (default http://127.0.0.1:4470; the fixture server must be running:
//                                                                 FIXTURE_PORT=4470 node tests/fixtures/server.js)
// It runs the journey twice, checks both runs give identical per-step counts, and rewrites reference.js. Step 0 is the page load and steps
// 1 to 15 are the journey steps, the same numbering as journey.js, the README and the agents' tables. The "does" labels are kept from the old key.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { AUDITS, STEPS, SHOP_PATH, LOGIN_PATH, CREDENTIALS } = require('./journey');

const base = process.argv[2] || 'http://127.0.0.1:4470';
const cli = path.join(__dirname, '..', '..', 'cli', 'index.js');
const refFile = path.join(__dirname, 'reference.js');

const countsOf = (findings) => {
  const m = {};
  for (const tab of Object.values(findings || {})) for (const cat of Object.values(tab)) for (const a of cat) m[a.auditId] = (m[a.auditId] || 0) + a.elements.length;
  return Object.fromEntries(Object.entries(m).sort());
};

function run() {
  const args = ['index.js', 'audit', base + SHOP_PATH, '--audits', AUDITS.join(','), '--login-url', base + LOGIN_PATH, '-u', CREDENTIALS.user, '-p', CREDENTIALS.password];
  for (const s of STEPS) args.push('--step', s);
  const out = execFileSync('node', args, { cwd: path.dirname(cli), maxBuffer: 1 << 28 }).toString();
  const report = JSON.parse(out.slice(out.indexOf('{')));
  return report.audit_trail.map((s) => ({ new: countsOf(s.new_findings), resolved: countsOf(s.resolved_findings), focusStops: s.page_state_maps.focus_order.totalElems }));
}

const a = run();
const b = run();
if (JSON.stringify(a) !== JSON.stringify(b)) { console.error('The two runs differ: not freezing a reference. Check the page for non-determinism.'); process.exit(1); }

const old = fs.existsSync(refFile) ? require(refFile).REFERENCE : [];
const rows = a.map((r, i) => {
  const does = old[i] ? old[i].does : (i === 0 ? 'page load (signed in)' : STEPS[i - 1]);
  return `  { step: ${i}, does: ${JSON.stringify(does)}, focusStops: ${r.focusStops},\n    new: ${JSON.stringify(r.new).replace(/"([\w-]+)":/g, "'$1':").replace(/,/g, ', ').replace(/:/g, ': ').replace(/'([\w-]+)': /g, "'$1': ")},\n    resolved: ${JSON.stringify(r.resolved).replace(/"([\w-]+)":/g, "'$1':").replace(/,/g, ', ').replace(/:/g, ': ').replace(/'([\w-]+)': /g, "'$1': ")} }`;
});

const header = `// THE EXPECTED RESULT of the benchmark journey (journey.js) on bench-shop.html, FROZEN from real runs (two identical runs, including
// element counts) by regenerate-reference.js. One row per entry of the audit trail: step 0 is the page load, steps 1 to 15 are the journey
// steps (the same numbers as journey.js and the README). Each row lists how many elements each audit reported as NEW and as RESOLVED, and
// how many tab stops the focus order lists afterwards. Persisting findings are not repeated (the report is a diff against the previous step).
// Use it to check that a run (CLI, MCP, an agent driving agent-browser or Playwright MCP...) did the same work: see the spec and the README.
// If you change the page, the journey or the tool on purpose, regenerate it (README, "Regenerating the reference").
`;
fs.writeFileSync(refFile, `${header}const REFERENCE = [\n${rows.join(',\n')},\n];\n\nmodule.exports = { REFERENCE };\n`);
console.log(`reference.js rewritten: ${a.length} rows (steps 0 to ${a.length - 1}).`);
