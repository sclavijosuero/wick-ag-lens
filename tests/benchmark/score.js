// Scores one guided benchmark run against the answer key (reference.js). No LLM, no tokens.
//   node tests/benchmark/score.js <agent-answer.md> <wick-output.json>
// - answer: the agent's final answer (the table in the format required by prompts/guided-common.md)
// - output: the JSON file the agent's wick-ag-lens command wrote, used to check what was really executed
// Prints a JSON summary: how many rows of the agent's table equal the key, how many of the 16 steps the real output equals the key,
// and the steps (actions and selectors) the agent actually ran.
const fs = require('fs');
const { STEPS } = require('./journey');
const { REFERENCE } = require('./reference');

const parseList = (cell) => {
  const out = {};
  const s = cell.trim();
  if (!s || s === '-') return out;
  for (const part of s.split(',')) {
    const m = part.trim().match(/^`?([\w-]+):(\d+)`?$/);
    if (m) out[m[1]] = Number(m[2]);
  }
  return Object.fromEntries(Object.entries(out).sort());
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function countsOf(findings) {
  const m = {};
  for (const tab of Object.values(findings || {})) for (const cat of Object.values(tab)) for (const a of cat) m[a.auditId] = (m[a.auditId] || 0) + a.elements.length;
  return Object.fromEntries(Object.entries(m).sort());
}

function score(answerFile, outputFile) {
  const answer = fs.readFileSync(answerFile, 'utf8');
  const rows = answer.split(/\r?\n/).filter((l) => /^\|\s*\d+\s*\|/.test(l)).map((l) => l.split('|').slice(1, -1));
  const table = rows.map((c) => ({ step: Number(c[0]), newF: parseList(c[2] || ''), resolved: parseList(c[3] || '') }));

  const result = { tableRows: table.length, tableExact: 0, tableIdsOnly: 0, mismatches: [] };
  REFERENCE.forEach((ref, i) => {
    const row = table.find((r) => r.step === i);                     // the agent's step 0 is the page load
    if (!row) { result.mismatches.push(`step ${i}: row missing`); return; }
    const exact = same(row.newF, ref.new) && same(row.resolved, ref.resolved);
    const ids = same(Object.keys(row.newF), Object.keys(ref.new)) && same(Object.keys(row.resolved), Object.keys(ref.resolved));
    if (exact) result.tableExact++; else result.mismatches.push(`step ${i}: table differs from the key`);
    if (ids) result.tableIdsOnly++;
  });

  if (outputFile && fs.existsSync(outputFile)) {
    const text = fs.readFileSync(outputFile, 'utf8');
    const report = JSON.parse(text.slice(text.indexOf('{')));
    result.executedEntries = report.audit_trail.length;
    result.executedSteps = report.audit_trail.slice(1).map((s) => `${s.interaction.action}::${s.interaction.selector}${s.interaction.value ? '::' + s.interaction.value : ''}`);
    result.sameStepsAsKey = same(result.executedSteps, STEPS);
    result.realOutputExact = report.audit_trail.filter((s, i) => REFERENCE[i] && same(countsOf(s.new_findings), REFERENCE[i].new) && same(countsOf(s.resolved_findings), REFERENCE[i].resolved)).length;
    // honesty check: does the agent's table agree with the file it produced?
    result.tableMatchesOwnOutput = report.audit_trail.every((s, i) => { const r = table.find((x) => x.step === i); return r && same(r.newF, countsOf(s.new_findings)) && same(r.resolved, countsOf(s.resolved_findings)); });
  }
  const m = answer.match(/Tool calls:\s*(\d+)/i);
  result.selfReportedToolCalls = m ? Number(m[1]) : null;
  return result;
}

if (require.main === module) console.log(JSON.stringify(score(process.argv[2], process.argv[3]), null, 2));
module.exports = { score };
