// Watchdog: prints STALLED if the latest tool call of a subagent has had no result for more than N seconds. Usage: node watch.js <agentId> <seconds>
const fs = require('fs');
const f = `C:/Users/sclavijosuero/.claude/projects/c--Personal-GitHub-Repos-wick-ag-lens/d8a7fd39-2fdf-4513-9aac-015db91ed80d/subagents/agent-${process.argv[2]}.jsonl`;
const limit = Number(process.argv[3]) * 1000;
const open = new Map(); let last = 0;
if (fs.existsSync(f)) for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/).filter(Boolean)) {
  let o; try { o = JSON.parse(l); } catch { continue; }
  const ts = Date.parse(o.timestamp || 0); if (ts) last = ts;
  const c = (o.message || {}).content; if (!Array.isArray(c)) continue;
  for (const b of c) { if (b.type === 'tool_use') open.set(b.id, { name: b.name, ts }); if (b.type === 'tool_result') open.delete(b.tool_use_id); }
}
const stuck = [...open.values()].filter((x) => Date.now() - x.ts > limit);
console.log(stuck.length ? `STALLED: ${stuck.map((x) => x.name + ' for ' + Math.round((Date.now() - x.ts) / 1000) + 's').join(', ')}` : `ok (open calls: ${open.size}, last event ${Math.round((Date.now() - last) / 1000)}s ago)`);
