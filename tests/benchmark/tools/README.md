# Benchmark helper scripts (dev only, no LLM, no tokens)

They read the transcripts of the subagents that ran the benchmark (`~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl`).
The transcript folder and the agent ids are hardcoded: edit the `D` path and the run table at the top of each script for a new session.

| Script | What it does |
| :-- | :-- |
| `collect.js <agentId> <label> <outDir>` | writes `answer-<label>.md` (the agent's final table) and prints its token usage (output, cache read, cache write), tools used and checks (screenshots, forbidden files, other runs' folders, WCAG flags, skill) |
| `watch.js <agentId> <seconds>` | stall watchdog: prints `STALLED` if a tool call has had no result for that long (for example a permission prompt nobody answered) |
| `timesplit.js` | splits each run's time into audit command, browsing tool calls and model turns |
| `aggregate.js` | per-run usage and checks for a list of runs |
| `annexc.js <scratchDir>` | builds Annex C of the report (findings per step, focus path, JSON size) |

Scoring an answer: `node tests/benchmark/score.js <answer.md> <out.json>`.
