// Scores one subagent run from its transcript and its saved report. No LLM.
//   node tests/benchmark/skill-eval/score-subagent.js <agentId> <runId> <model: sonnet|haiku|opus>
// Writes tests/benchmark/skill-eval-runs/<DATE>/<runId>/score.json and prints one line.
// Cost = transcript tokens x list prices (cache write assumed 1.25 x input): an estimate, not a bill.
const fs = require('fs');
const path = require('path');

const DATE = process.env.EVAL_DATE || '2026-11-27';
const SESSION = process.env.EVAL_SESSION || '4bbadb2b-1fa9-40ae-933e-d6cec20ce97e';
const PROJECTS = 'C:/Users/sclavijosuero/.claude/projects/c--Personal-GitHub-Repos-wick-ag-lens';
const PRICE = { // USD per million tokens: input, output, cache read
  opus: [4, 20, 0.2], sonnet: [2, 10, 0.1], haiku: [0.1, 0.5, 0.01],
};

const [agentId, runId, model] = process.argv.slice(2);
const dir = path.resolve(__dirname, '..', 'skill-eval-runs', DATE, runId);
fs.mkdirSync(dir, { recursive: true });

const file = `${PROJECTS}/${SESSION}/subagents/agent-${agentId}.jsonl`;
const msgs = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const u = { calls: 0, input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
const seen = new Set(); const seenTool = new Set(); const tools = {}; const cmds = []; const flags = {};
let first = null; let last = null; let maxResult = 0; let finalText = '';
const sizeOf = (c) => (typeof c === 'string' ? c.length : Array.isArray(c) ? c.reduce((a, x) => a + (x.text ? x.text.length : x.type === 'image' ? 100000 : 0), 0) : 0);
for (const o of msgs) {
  const m = o.message || o;
  if (o.timestamp) { first = first || o.timestamp; last = o.timestamp; }
  if (m.role === 'assistant' && m.usage) {
    const k = m.id || o.uuid;
    if (!seen.has(k)) { seen.add(k); u.calls++; u.input += m.usage.input_tokens || 0; u.cacheRead += m.usage.cache_read_input_tokens || 0; u.cacheWrite += m.usage.cache_creation_input_tokens || 0; u.output += m.usage.output_tokens || 0; }
  }
  if (!Array.isArray(m.content)) continue;
  for (const b of m.content) {
    if (b.type === 'tool_use' && !seenTool.has(b.id)) {
      seenTool.add(b.id);
      if (b.name === 'SubagentHandback') { const strs = []; (function w(x) { if (typeof x === 'string') strs.push(x); else if (x && typeof x === 'object') Object.values(x).forEach(w); })(b.input); finalText = strs.sort((a, c) => c.length - a.length)[0] || finalText; continue; }
      tools[b.name] = (tools[b.name] || 0) + 1;
      const s = JSON.stringify(b.input || {});
      if (b.name === 'Bash') cmds.push(String(b.input && b.input.command || ''));
      if (/screenshot/i.test(b.name) || (b.name === 'Bash' && /screenshot|s-s(s|$)/i.test(String(b.input.command)))) flags.screenshot = (flags.screenshot || 0) + 1;
      if (/(^|[^\w-])tests[\/](?!benchmark[\/]skill-eval-runs)|output-samples[\/]/i.test(s)) flags.readForbidden = (flags.readForbidden || 0) + 1;
      if (/SKILL\.md/.test(s)) flags.readSkill = (flags.readSkill || 0) + 1;
    }
    if (b.type === 'tool_result') maxResult = Math.max(maxResult, sizeOf(b.content));
    
  }
}
const [pi, po, pc] = PRICE[model];
const cost = (u.input * pi + u.cacheWrite * pi * 1.25 + u.output * po + u.cacheRead * pc) / 1e6;
const tokens = u.input + u.cacheRead + u.cacheWrite + u.output;
const toolUses = Object.values(tools).reduce((a, b) => a + b, 0);
const bashFailedApprox = 0;

// The report the agent saved.
let rep = null;
const repFile = path.join(dir, 'audit-report.json');
if (fs.existsSync(repFile)) {
  const t = fs.readFileSync(repFile, 'utf8');
  try { rep = JSON.parse(t.slice(Math.max(0, t.search(/^\{$/m)))); } catch { rep = null; }
}
let reportInfo = { saved: false };
if (rep) {
  const ids = new Set(); let findings = 0;
  const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { if (x.auditId && Array.isArray(x.elements)) { ids.add(x.auditId); findings += x.elements.length; } Object.values(x).forEach(walk); } };
  (rep.audit_trail || []).forEach((s) => walk(s.new_findings));
  const trail = (rep.audit_trail || []).map((s) => `${s.interaction && s.interaction.action}:${s.interaction && s.interaction.selector}`);
  reportInfo = { saved: true, steps: trail.length, trail, distinctAudits: ids.size, findings, globalSummary: rep.global_summary };
}

// Fidelity: every `v-`/`i-` audit id named in the final answer must exist in the report dictionary.
if (!fs.existsSync(path.join(dir, 'agent-summary.md'))) fs.writeFileSync(path.join(dir, 'agent-summary.md'), finalText);
const answer = fs.readFileSync(path.join(dir, 'agent-summary.md'), 'utf8');
let fidelity = null;
if (rep && rep.audit_dictionary) {
  const named = [...new Set(answer.match(/\b[vi]-[a-z][a-z-]+\b/g) || [])];
  const bad = named.filter((id) => !rep.audit_dictionary[id]);
  fidelity = { named: named.length, notInReport: bad };
}
const checks = {
  statesTier: /Tier\s*[123]|CLI Fallback/i.test(answer),
  healthSummary: /Health Summary/i.test(answer),
  deltaHighlights: /Delta/i.test(answer),
  remediationTable: /Remediation/i.test(answer) && /Audit ID/i.test(answer),
  manualList: /manual review/i.test(answer),
  confidence: /Confidence|Needs confirmation/i.test(answer),
};
const out = {
  runId, model, agentId, usage: u, tokens, estCostUsd: Number(cost.toFixed(4)), toolUses, tools, wallSec: first && last ? Math.round((new Date(last) - new Date(first)) / 1000) : null,
  flags, largestToolResultChars: maxResult, report: reportInfo, fidelity, formatChecks: checks, formatScore: Object.values(checks).filter(Boolean).length,
  usedAgentBrowser: cmds.some((c) => /agent-browser/.test(c)), usedCli: cmds.some((c) => /cli[\\/]index\.js|wick-ag-lens audit/.test(c)), bashFailedApprox,
};
fs.writeFileSync(path.join(dir, 'score.json'), JSON.stringify(out, null, 2));
console.log(`${runId} (${model}): est $${out.estCostUsd} | ${tokens} tok | ${u.calls} calls | ${toolUses} tools | ${out.wallSec}s | report steps ${reportInfo.steps} audits ${reportInfo.distinctAudits} | format ${out.formatScore}/6 | fidelity bad ${fidelity ? fidelity.notInReport.length : 'n/a'} | flags ${JSON.stringify(flags)}`);
