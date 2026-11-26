// Splits each run's wall-clock time: audit command (wick-ag-lens), browsing tool calls, other tools, and the model's own turns.
const fs = require('fs');
const D = 'C:/Users/sclavijosuero/.claude/projects/c--Personal-GitHub-Repos-wick-ag-lens/49c9da22-a40b-4a32-aa23-f2d4d2829295/subagents/';
const RUNS = { A1: 'ae22a31826f6a428a', A2: 'ab6308680986235fc', A3: 'a74f167a0f9a3a17b', A4: 'a515c8d4ff045dd82', A5: 'a2c6fb669561dcc51', B1: 'aa0b717d46907a38b', B2: 'a0cdbad6180fd4779', B3: 'a408b9ba863bc9694', B4: 'a6ec837f71ad52bc2', B5: 'ac82aabe2a214b4f1' };
const res = {};
for (const [label, id] of Object.entries(RUNS)) {
  const ev = fs.readFileSync(D + `agent-${id}.jsonl`, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((o) => o && o.timestamp);
  const t = { audit: 0, browse: 0, other: 0, model: 0, stall: 0 };
  let firstT = Date.parse(ev[0].timestamp); let lastEnd = firstT; let lastT = Date.parse(ev.at(-1).timestamp);
  const pending = new Map(); // tool_use id -> {t0, kind}
  let open = 0, openStart = null, openKind = null;
  for (let i = 0; i < ev.length; i++) {
    const o = ev[i]; const ts = Date.parse(o.timestamp); const m = o.message || {}; const c = Array.isArray(m.content) ? m.content : [];
    const uses = c.filter((b) => b.type === 'tool_use'); const results = c.filter((b) => b.type === 'tool_result');
    if (m.role === 'assistant' && uses.length && !uses.every((b) => b.name === 'SubagentHandback')) {
      if (lastEnd !== null) t.model += ts - lastEnd;     // thinking + writing before this call
      const kind = uses.some((b) => /index\.js audit/.test(JSON.stringify(b.input))) ? 'audit' : uses.some((b) => b.name.startsWith('mcp__playwright')) ? 'browse' : uses.some((b) => b.name === 'Bash') ? 'browse' : 'other';
      uses.forEach((b) => pending.set(b.id, { t0: ts, kind }));
      lastEnd = null; open = uses.length; openStart = ts; openKind = kind;
    }
    for (const r of results) if (pending.has(r.tool_use_id)) { const p = pending.get(r.tool_use_id); pending.delete(r.tool_use_id); open--; if (open === 0) { const d = ts - openStart; t[openKind === 'other' ? 'other' : openKind] += d; lastEnd = ts; } }
  }
  const total = lastT - firstT;
  res[label] = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, Math.round(v / 1000)])); res[label].total = Math.round(total / 1000);
}
console.log(JSON.stringify(res));
