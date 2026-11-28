# Skill run by model: Sonnet 5.5 x3, Haiku 5.5 x3, Opus 5.5 x3 (2026-11-27)

What does the same job cost on different models, and which route does the skill pick? Nine runs of the same task, three per model.

## Tested here
- **Route choice:** given a terminal and an unknown page, does the skill lead each model to Tier 2 + CLI and say why? Yes, 9 of 9 (see Route).
- **Cost and effort by model:** what the same job costs on Haiku, Sonnet and Opus, and how many model calls it takes (see By model).
- **Result quality:** the same 33 audits found in every run, the skill's output format followed, no invented audit ids, no screenshots or JSON dumps in context (see Per run).
- **Consistency:** 7 of 9 runs ended on identical final counts; the two exceptions were the agents' own choices (see Per run).

### Conditions
- **Task:** audit the benchmark shop (`bench-shop`) through a purchase journey that ends with an invalid email at checkout.
- **Held the same in all 9 runs:** the skill (`skills/wick-ag-lens/SKILL.md`, frozen, sha256 `883405bd...ac0e`), the prompt, the shop and its login. After the runs, one sentence of the skill was reworded to say that the "about 35% fewer tokens" figure comes from the two browsing tools alone, without the skill (file now sha256 `8b6e92ba...59ea`). No routing or output rule changed.
- **How they ran:** one at a time, as in-session subagents.
- **What the agents were told:** to read the skill file, and nothing about which route to take.

## Not tested here
- **Skill discovery:** whether an agent finds and loads the skill by itself, from its description, when the user does not mention it. Here the agents were told to read the skill file, so the skill was always loaded.
- **Routes other than Tier 2 + CLI:** this session had no wick-ag-lens MCP tools, so Tier 1, Tier 3 and the "tool missing" case were not exercised.
- **A real application:** one demo shop only.

### Estimated extra token cost of what was not tested
These are rough estimates from the nine runs, to give an order of magnitude. None was tested.

| What | Estimated extra cost |
| :-- | :-- |
| **Skill discovery** (the agent finds the skill itself) | Small, about 1–3% of a run: the skill's description line (about 80 tokens) on every call, plus one extra model call to invoke the skill (about $0.006 on Sonnet, $0.012 on Opus, under $0.001 on Haiku). The skill body is the same 2.8K tokens either way. The real risk is that it does not trigger and the agent works without the skill, which changes the result more than the cost. |
| **The agent or skill choosing the model** | The skill does not choose models today. Deciding would cost one or two extra calls (about $0.01–0.03 on Sonnet), but could save much more: Haiku ran $0.04 against $0.36 (Sonnet) and $0.87 (Opus) for the same 33 audits, though with about twice the calls and one run that wandered (H-2). Handing only the scouting to a cheaper subagent adds a fresh context of tens of thousands of cached tokens per call. |
| **Tier 3** (Playwright MCP) | About 50% more on the browsing part, since `agent-browser` used about 35% fewer tokens in the [benchmark](guided-2026-11-25.md), plus the Playwright tool schemas on every turn. |
| **MCP routes** (Tier 1, Tier 2 with MCP) | Each tool reply lands in context, where the CLI route keeps the report in a file: perhaps 20–100K extra input tokens over a 10-step journey, plus about 1–2K of tool schemas per turn. |
| **Real applications** | Larger pages mean larger snapshots and reports; SSO or MFA means more scouting calls; a user who does not spell out the journey means more exploring; a failed `--step` writes no report and forces a rerun. |

**Baseline caveat:** each call carried about 63–73K tokens of context, mostly cached. Most of that is probably this session's own system prompt and tool listings (the agents ran as in-session subagents); the skill itself is about 4%. In a clean project the absolute costs would likely be lower, while the ratios between models should hold.

## Where the files are
- **Per-run data:** [`../skill-eval-runs/2026-11-27/`](../skill-eval-runs/2026-11-27/), one folder per run (`S-n` = Sonnet, `H-n` = Haiku, `O-n` = Opus), each with the agent's final answer (`agent-summary.md`) and its token and cost scoring (`score.json`).
- **Audit reports:** only S-1 keeps its saved report (the others were near-identical, about 300 KB each). Paths inside the agents' answers are as they wrote them at the time.
- **Scorer and run definitions:** [`score-subagent.js`](../skill-eval/score-subagent.js) and [`arms.js`](../skill-eval/arms.js).

## Route
All 9 runs chose **Tier 2 + CLI Fallback** and said so with the reason (no `wick-ag-lens:*` MCP tools, terminal available, page and login unknown): rule 2 of "How to choose". Only this route was reachable in this session.

## What was audited (order of magnitude)
The page is the benchmark shop (`bench-shop.html`), a realistic outdoor-gear store that is **deliberately full of accessibility problems**, so the counts below are far higher than a normal page would give. Figures are from S-1's saved report; all 9 runs found the same 33 audits, and 7 of 9 ended on the same final counts.

- **Standard and scope:** WCAG **2.0 and 2.1**, levels **A and AA** (the skill's default; 2.2 and AAA are not included), no screenshots. The tool has **55 audits** in two tabs: Violations & Warnings, and Informative & Structure (page structure, such as headings, landmarks and focus order, that is context and not an issue).
- **Journey:** 11 audit points: the page load after login, then search "tent" (type, Enter), open the Brand filter, tick a brand, open the quick view, add to cart, open the cart, go to checkout, type an invalid email, and click Place order. Each step reports only what is new or resolved, so the report is a timeline and not 11 separate full audits.
- **Final state (issues still active after the last step):** **64 Critical, 5 Serious, 6 Moderate, 0 Minor, 0 Manual**, about 75 issues in total, plus 93 Informative items that are not counted as issues.
- **Which audits reported something:** 33 of the 55: 17 violation audits (11 Critical, 3 Serious, 2 Moderate, 1 Minor) and 16 informative ones. Detection quality of those 33: 25 `rule` (a defined rule), 5 `best-effort` and 3 `pattern` (these need confirmation by a person).
- **Where most of the volume is** (elements reported over the journey): inaccessible SVGs (43), focusable elements behind `aria-hidden` (22), duplicate ids (20), text contrast (14), then missing alt, unlabeled inputs and broken ARIA references (9 each).
- **How the Critical count moves:** 84 on page load; 40 after the search results replace the product grid; 63 with the quick view open; 41 once it closes; 64 at the end, after the cart drawer, checkout form and the invalid email.
- **What the invalid email shows:** the field gets `aria-invalid="true"` but points to an error message id that does not exist, so a screen reader is not told what is wrong.

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

**Columns**
| Column | Meaning |
| :-- | :-- |
| Run | Model and run number (S = Sonnet 5.5, H = Haiku 5.5, O = Opus 5.5). |
| Est. cost | Estimated cost in USD: the tokens in the run's transcript (input, cached input, cache writes, output) times the models' list prices. Not a bill. |
| Model calls | How many times the model was called (one per turn). More calls mean more back-and-forth to finish the job. |
| Tool calls | How many tools the agent used (shell commands, file reads...). |
| Wall s | Seconds from the first to the last message of the run. |
| Audit steps | Entries in the saved report's audit trail: the page load plus each action the audit ran. |
| Distinct audits | Different audits that reported at least one new finding over the journey (of the 55 in the tool). |
| Final C/S/Mo/Mi | Issues still active after the last step, by severity: Critical / Serious / Moderate / Minor (the report's `global_summary`). Manual and Informative are not shown. |
| Format 6/6 | Whether the agent's final answer has the six parts the skill requires: the tier and why, Health Summary, step-by-step highlights, remediation table, manual-review list and detection confidence. Checked by keywords, not by reading. |
| Ids not in report | Audit ids named in the answer that do not exist in the saved report. 0 means the answer invented none. |

In the "By model" table, **Output tokens** are the tokens the model wrote (answers and commands), not the text it read.

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
- Limits: skill discovery was not tested (the agents were told to read the skill file), N=3, one page, one skill version, agents ran inside the repo (told not to read `tests/` or `output-samples/`), costs estimated from transcripts, only Tier 2 + CLI exercised. Run-to-run ranges overlap for Sonnet, but not between models for cost.
