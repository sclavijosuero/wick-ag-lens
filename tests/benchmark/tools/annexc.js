// Builds Annex C (size and complexity of the audit output) from reference.js and the real output files of the 10 runs, and appends it to the report.
const fs = require('fs'); const path = require('path');
const S = process.argv[2];
const { REFERENCE } = require(path.resolve('tests/benchmark/reference.js'));
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const sumBy = (o, p) => Object.entries(o).filter(([k]) => k.startsWith(p)).reduce((a, [, v]) => a + v, 0);
const kb = (n) => (n / 1024).toFixed(0);

// per step table (from the answer key = what every run reported)
const rows = REFERENCE.map((r, i) => `| ${i} | ${r.does} | ${sumBy(r.new, 'v-')} | ${sumBy(r.new, 'i-')} | ${Object.keys(r.new).length} | ${sumBy(r.resolved, 'v-')} | ${sumBy(r.resolved, 'i-')} | ${Object.keys(r.resolved).length} | ${r.focusStops} |`);
const tot = { nv: 0, ni: 0, rv: 0, ri: 0 };
REFERENCE.forEach((r) => { tot.nv += sumBy(r.new, 'v-'); tot.ni += sumBy(r.new, 'i-'); tot.rv += sumBy(r.resolved, 'v-'); tot.ri += sumBy(r.resolved, 'i-'); });

// real output files of the 10 runs
const dirs = { A1: 'bench2-a', A2: 'r2-a', A3: 'r3-a', A4: 'r4n-a', A5: 'r5-a', B1: 'bench2-b', B2: 'r2-b', B3: 'r3-b', B4: 'r4-b', B5: 'r5-b' };
const files = [];
for (const [label, d] of Object.entries(dirs)) {
  const f = path.join(S, d, 'out.json');
  const text = fs.readFileSync(f, 'utf8'); const start = text.indexOf('{'); const json = text.slice(start);
  const rep = JSON.parse(json);
  const keys = Object.keys(rep);
  let elems = 0;
  for (const s of rep.audit_trail) for (const side of ['new_findings', 'resolved_findings']) for (const tab of Object.values(s[side] || {})) for (const cat of Object.values(tab)) for (const a of cat) elems += a.elements.length;
  const dictBytes = rep.audit_dictionary ? Buffer.byteLength(JSON.stringify(rep.audit_dictionary)) : 0;
  const trailBytes = Buffer.byteLength(JSON.stringify(rep.audit_trail));
  const focusBytes = rep.audit_trail.reduce((a, s) => a + Buffer.byteLength(JSON.stringify((s.page_state_maps || {}))), 0);
  const shots = rep.audit_trail.filter((s) => s.screenshot_base64).length;
  files.push({ label, bytes: Buffer.byteLength(text), jsonBytes: Buffer.byteLength(json), entries: rep.audit_trail.length, elems, dictBytes, trailBytes, focusBytes, shots, keys });
}
const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const fileRows = files.map((f) => `| ${f.label} | ${kb(f.jsonBytes)} KB | ${f.entries} | ${f.elems} | ${kb(f.focusBytes)} KB | ${kb(f.dictBytes)} KB |`);
const A = files.filter((f) => f.label[0] === 'A'), B = files.filter((f) => f.label[0] === 'B');
const mean = (x, k) => avg(x.map((f) => f[k]));

const md = `
## Annex C. Size and complexity of the audit

This annex shows how much the 30 audits report on this journey: how many findings are new and resolved at each step, how long the focus path is, and how big the JSON file written by wick-ag-lens is. It explains why the agents are told never to print the JSON and to read only a compact summary of it.

### C.1 What each step reports

Counts of **elements** (one finding is one element), taken from the answer key, which every run reproduced (section 5). "Violations" are the \`v-*\` audits and "structure" the \`i-*\` audits. "Audits" is how many of the 30 audits had something new or resolved at that step. "Focus stops" is the length of the keyboard focus path (the tab order, audit \`i-focus-order\`) after the step; the tab order itself is part of the JSON of every step.

| Step | What happens | New: violations | New: structure | New: audits | Resolved: violations | Resolved: structure | Resolved: audits | Focus stops |
|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}
| **Total** | | **${tot.nv}** | **${tot.ni}** | | **${tot.rv}** | **${tot.ri}** | | |

At the page load, ${sumBy(REFERENCE[0].new, 'v-')} violations and ${sumBy(REFERENCE[0].new, 'i-')} structural findings are reported across ${Object.keys(REFERENCE[0].new).length} of the 30 audits; later steps report only what changed. The focus path goes from ${Math.min(...REFERENCE.map((r) => r.focusStops))} to ${Math.max(...REFERENCE.map((r) => r.focusStops))} stops depending on what is open (menus, dialog, drawer).

### C.2 Size of the JSON file of each run

Measured on the output file each agent produced (JSON part only; the CLI prints a few log lines before it). "Elements listed" counts the elements in all new and resolved findings of the 16 entries. "Focus maps" is the part of the file that holds the focus-order map of every step. "Audit dictionary" is the rule descriptions and remediation text, stored once.

| Run | JSON size | Entries | Elements listed | Focus maps | Audit dictionary |
|---|---|---|---|---|---|
${fileRows.join('\n')}
| **A, mean** | ${kb(mean(A, 'jsonBytes'))} KB | | ${mean(A, 'elems').toFixed(0)} | ${kb(mean(A, 'focusBytes'))} KB | ${kb(mean(A, 'dictBytes'))} KB |
| **B, mean** | ${kb(mean(B, 'jsonBytes'))} KB | | ${mean(B, 'elems').toFixed(0)} | ${kb(mean(B, 'focusBytes'))} KB | ${kb(mean(B, 'dictBytes'))} KB |

Screenshots were not requested, so none of the files contains one (${files.reduce((a, f) => a + f.shots, 0)} screenshots in the 10 files).

### C.3 What this means for the token numbers

- The JSON is about ${kb(mean(files, 'jsonBytes'))} KB per run, and it is about the same for A and B because both run the same journey with the same tool.
- **The JSON never enters the model's context in full**: the prompt tells the agent to write it to a file and read only a compact summary (a few lines per step). That is why the audit's size does not appear in the token totals of section 5.
- As an order of magnitude, a file of this size printed in one tool result would be roughly ${(mean(files, 'jsonBytes') / 3.5 / 1000).toFixed(0)},000 tokens (assuming about 3.5 bytes per token, an estimate, not measured), more than the whole of a typical run (70,000 to 117,000 tokens). An agent that read the JSON directly would therefore cost several times more than the runs reported here, and the cost would grow with the size and complexity of the page.
- The size depends on the page and on the audits requested: more elements, more steps, more audits, a longer focus path, or screenshots (\`-s\`) make the file larger. Narrowing the audits (\`--audits\`) and the WCAG scope (\`--wcag-version\`, \`--wcag-level\`) reduces it.
`;
fs.appendFileSync('tests/benchmark/reports/guided-2026-11-25.md', md);
console.log(files.map((f) => `${f.label} ${kb(f.jsonBytes)}KB entries=${f.entries} elems=${f.elems} focus=${kb(f.focusBytes)}KB dict=${kb(f.dictBytes)}KB shots=${f.shots}`).join('\n'));
