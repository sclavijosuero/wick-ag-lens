// Collects one benchmark run from its subagent transcript.
//   node collect.js <agentId> <label> <outDir>
// Writes <outDir>/answer-<label>.md (the agent's final table), prints token usage (input/cache/output),
// tool names used, and checks: screenshots, forbidden repo files, other runs' folders, page-source dumps, wcag flags.
const fs = require('fs'); const path = require('path');
const [id, label, outDir] = process.argv.slice(2);
const f = `C:/Users/sclavijosuero/.claude/projects/c--Personal-GitHub-Repos-wick-ag-lens/49c9da22-a40b-4a32-aa23-f2d4d2829295/subagents/agent-${id}.jsonl`;
const msgs = fs.readFileSync(f, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const u = { calls: 0, input: 0, cacheRead: 0, cacheWrite: 0, output: 0 }; const seen = new Set(); const names = {}; const hits = []; let final = '';
for (const o of msgs) {
  const m = o.message || o;
  if (m.role === 'assistant' && m.usage) { const k = m.id || o.uuid; if (!seen.has(k)) { seen.add(k); u.calls++; u.input += m.usage.input_tokens || 0; u.cacheRead += m.usage.cache_read_input_tokens || 0; u.cacheWrite += m.usage.cache_creation_input_tokens || 0; u.output += m.usage.output_tokens || 0; } }
  if (!Array.isArray(m.content)) continue;
  for (const b of m.content) {
    if (b.type === 'tool_use') {
      names[b.name] = (names[b.name] || 0) + 1;
      const s = b.name + ' ' + JSON.stringify(b.input);
      if (b.name === 'SubagentHandback') { const strs = []; (function w(x) { if (typeof x === 'string') strs.push(x); else if (x && typeof x === 'object') Object.values(x).forEach(w); })(b.input); final = strs.sort((a, c) => c.length - a.length)[0] || final; }
      for (const [n, re] of [['screenshot', /screenshot/i], ['journey/reference/tests-benchmark', /journey\.js|reference\.js|tests[\/]+benchmark|fixtures[\/]/i], ['other-run-folder', /scratchpad[\/]+(bench2-|r\d-)(?!REPLACE)/i], ['wcag-flag', /--wcag-/], ['skill', /^Skill /]]) if (re.test(s)) hits.push(n);
    }
  }
}
const own = label.replace(/^.*?(\d+-[ab])$/, '$1');
fs.writeFileSync(path.join(outDir, `answer-${label}.md`), final);
console.log(JSON.stringify({ label, usage: u, tools: names }));
console.log('flags:', JSON.stringify(hits.reduce((a, h) => (a[h] = (a[h] || 0) + 1, a), {})), '(other-run-folder includes the run\'s own folder; check manually if >0)');
