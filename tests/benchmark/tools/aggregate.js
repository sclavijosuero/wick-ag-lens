// Aggregates the 10 benchmark runs: usage per run from the transcripts, metrics from the completion notifications, checks on tool calls.
const fs = require('fs');
const D = 'C:/Users/sclavijosuero/.claude/projects/c--Personal-GitHub-Repos-wick-ag-lens/49c9da22-a40b-4a32-aa23-f2d4d2829295/subagents/';
// id, label, notification metrics: tokens, toolUses, durationMs
const RUNS = [
  ['ae22a31826f6a428a', 'A1', 'bench2-a', 76219, 22, 433363], ['ab6308680986235fc', 'A2', 'r2-a', 74935, 15, 235873],
  ['a74f167a0f9a3a17b', 'A3', 'r3-a', 70675, 16, 236427], ['a515c8d4ff045dd82', 'A4', 'r4n-a', 72758, 16, 258834], ['a2c6fb669561dcc51', 'A5', 'r5-a', 69692, 11, 203939],
  ['aa0b717d46907a38b', 'B1', 'bench2-b', 117508, 32, 212052], ['a0cdbad6180fd4779', 'B2', 'r2-b', 101578, 25, 417534],
  ['a408b9ba863bc9694', 'B3', 'r3-b', 116109, 30, 210720], ['a6ec837f71ad52bc2', 'B4', 'r4-b', 109890, 28, 2233968], ['ac82aabe2a214b4f1', 'B5', 'r5-b', 112315, 30, 216585],
];
const out = [];
for (const [id, label, own, tokens, uses, ms] of RUNS) {
  const msgs = fs.readFileSync(D + `agent-${id}.jsonl`, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const u = { calls: 0, input: 0, cacheRead: 0, cacheWrite: 0, output: 0 }; const seen = new Set(); const flags = {}; let maxGap = 0; let prev = null; let signedInAtStart = null;
  for (const o of msgs) {
    const t = o.timestamp ? Date.parse(o.timestamp) : null; if (t && prev) maxGap = Math.max(maxGap, t - prev); if (t) prev = t;
    const m = o.message || o;
    if (m.role === 'assistant' && m.usage) { const k = m.id || o.uuid; if (!seen.has(k)) { seen.add(k); u.calls++; u.input += m.usage.input_tokens || 0; u.cacheRead += m.usage.cache_read_input_tokens || 0; u.cacheWrite += m.usage.cache_creation_input_tokens || 0; u.output += m.usage.output_tokens || 0; } }
    if (!Array.isArray(m.content)) continue;
    for (const b of m.content) if (b.type === 'tool_use') {
      const s = b.name + ' ' + JSON.stringify(b.input);
      const others = (s.match(/scratchpad[\/]+([\w-]+)/g) || []).map((x) => x.split(/[\/]+/).pop()).filter((x) => x !== own);
      const tests = [['screenshot', /screenshot/i], ['repoFile', /journey\.js|reference\.js|score\.js|tests[\/]+benchmark|fixtures[\/]|bench-shop\.html['"]?\s*(\||>|;|\))/i], ['wcagFlag', /--wcag-/], ['skill', /^Skill /]];
      for (const [n, re] of tests) if (re.test(s)) flags[n] = (flags[n] || 0) + 1;
      if (others.length) flags.otherRunFolder = (flags.otherRunFolder || 0) + 1;
    }
  }
  out.push({ label, tokens, uses, sec: Math.round(ms / 1000), maxGapSec: Math.round(maxGap / 1000), ...u, flags });
}
console.log(JSON.stringify(out));
