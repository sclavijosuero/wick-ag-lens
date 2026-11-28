# Skill run by model: Sonnet 5.5 x3, Haiku 5.5 x3, Opus 5.5 x3 (2026-11-27)

Same frozen skill (`skills/wick-ag-lens/SKILL.md`, sha256 `883405bd...ac0e`), same prompt, same shop (`bench-shop`, purchase journey + invalid email), one run at a time as in-session subagents.
Each agent was told to read the skill file (so this does **not** test automatic discovery) and was never told the route.
Per-run data: [`../skill-eval-runs/2026-11-27/`](../skill-eval-runs/2026-11-27/) (`S-n` = Sonnet, `H-n` = Haiku, `O-n` = Opus). Each run has the agent's final answer (`agent-summary.md`) and its token and cost scoring (`score.json`); only S-1 keeps its saved audit report (the others were near-identical, about 300 KB each). Paths inside the agents' answers are as they wrote them at the time. The scorer is [`../skill-eval/score-subagent.js`](../skill-eval/score-subagent.js), and the run definitions are in [`../skill-eval/arms.js`](../skill-eval/arms.js).

## Route
All 9 runs chose **Tier 2 + CLI Fallback** and said so with the reason (no `wick-ag-lens:*` MCP tools, terminal available, page and login unknown): rule 2 of "How to choose". Only this route was reachable in this session.

## Per run (cost is an estimate: transcript tokens x list prices, cache write at 1.25x input)
| Run | Est. cost | Model calls | Tool calls | Wall s | Audit steps | Distinct audits | Final C/S/Mo/Mi | Format 6/6 | Ids not in report |
| :-- | --: | --: | --: | --: | --: | --: | :-- | :-: | :-: |
| S-1 | $0.37 | 15 | 15 | 166 | 11 | 33 | 64/5/6/0 | yes | 0 |
| S-2 | $0.35 | 13 | 12 | 142 | 11 | 33 | 64/5/6/0 | yes | 0 |
| S-3 | $0.36 | 14 | 14 | 164 | 10 | 33 | 122/5/6/1 (*) | yes | 0 |
| H-1 | $0.04 | 25 | 24 | 234 | 12 | 33 | 64/5/6/0 | yes | 0 |
| H-2 | $0.05 | 31 | 31 | 296 | 20 | 33 | 115/4/5/1 (**) | yes | 0 |
| H-3 | $0.04 | 24 | 23 | 277 | 11 | 33 | 64/5/6/0 | yes | 0 |
| O-1 | $0.91 | 19 | 18 | 241 | 11 | 33 | 64/5/6/0 | yes | 0 |
| O-2 | $0.85 | 16 | 16 | 223 | 11 | 33 | 64/5/6/0 | yes | 0 |
| O-3 | $0.87 | 17 | 17 | 219 | 11 | 33 | 64/5/6/0 | yes | 0 |

(*) S-3 filled the search but did not press Enter, so the grid never filtered and the counts differ.
(**) H-2 ran 19 steps including waits and ended on a different state (native validation blocked the submit).

## By model (3 runs each)
| Model | Est. cost per run (range) | Total | Model calls | Tool calls | Output tokens |
| :-- | :-- | --: | :-- | :-- | :-- |
| Sonnet 5.5 | $0.35-0.37 | $1.08 | 13-15 | 12-15 | 8.7-9.7K |
| Haiku 5.5 | $0.04-0.05 | $0.13 | 24-31 | 23-31 | 22-26K |
| Opus 5.5 | $0.85-0.91 | $2.63 | 16-19 | 16-18 | 11.2-12.1K |

Total for the nine runs: about $3.8 (estimate).

## Reading
- Opus costs about 2.4x Sonnet and Sonnet about 8x Haiku per run, in line with the price ratios.
- Haiku needs about twice the calls and about 2.5x the output tokens of Sonnet for the same result, yet stays the cheapest by far. Its range is wide (H-2 doubled the steps).
- Opus did not need fewer calls than Sonnet (16-19 vs 13-15) and found the same 33 audits: no result difference worth its extra cost on this task.
- Same final counts (64/5/6/0) in 7 of 9 runs; the two exceptions are explained above and are agent choices, not tool noise.
- Limits: N=3, one page, one skill version, agents ran inside the repo (told not to read `tests/` or `output-samples/`), costs estimated from transcripts, only Tier 2 + CLI exercised. Run-to-run ranges overlap for Sonnet, but not between models for cost.
