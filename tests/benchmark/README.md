# Benchmark journey

A realistic, deliberately inaccessible web shop and a fixed 15-step journey, used to **compare tools doing exactly the same work**: agent-browser and Playwright MCP driven by an AI agent, and the wick-ag-lens CLI and MCP server. Dev only, never published.

| What | Where |
| :-- | :-- |
| The page: an outdoor-gear store ("Northwind Outfitters"), about 40 deliberate accessibility problems of 30 kinds | `tests/fixtures/pages/bench-shop.html` |
| Its sign-in page (a real server form that sets a session cookie and lands on the shop) | `tests/fixtures/pages/bench-login.html` |
| Served by the fixture server; the shop is **protected**, so the session has to be handled | `tests/fixtures/server.js` (`/app/bench-shop.html`) |
| The journey, the 30 audits and the login, defined once | `tests/benchmark/journey.js` |
| The **answer key** used to score an agent's result: per step, counts per audit (new and resolved) and focus stops. The regression tests do not use this file: they compare with `tests/golden/long.json` (same content in another shape), so if one changes on purpose, regenerate the other | `tests/benchmark/reference.js` |
| The journey as the **long regression journey**: 6 tests (CLI, MCP, agent-browser; public copy and behind the login), each compared with `tests/golden/long.json` (findings per audit and step, focus stops, health scores). They run no LLM, so they cost no tokens, and they are part of the full regression | `tests/regression/journeys.spec.js` (tag `@benchmark`), `tests/helpers/scenarios.js` |
| The exact **prompts** given to the agents: one shared template and one tools section per approach | `tests/benchmark/prompts/` (`guided-common.md`, `tools-agent-browser.md`, `tools-playwright-mcp.md`) |
| The **scoring script**: compares an agent's answer table and its real output file with the answer key. No LLM, no tokens | `tests/benchmark/score.js` |
| The script that regenerates the answer key from real runs | `tests/benchmark/regenerate-reference.js` |
| The **reports** of the benchmark runs (method, prompts, results, token use) | `tests/benchmark/reports/` |
| The **skill evaluation** (the wick-ag-lens skill run by Haiku, Sonnet and Opus): its scripts and its per-run data | `tests/benchmark/skill-eval/`, `tests/benchmark/skill-eval-runs/` (see "Skill evaluation" below) |

## The page

A commerce page of normal size: header with search and icon buttons, a main menu with a hover menu, a hero banner, a filter sidebar with an accordion, a sort select, a grid of 8 products, a quick-view dialog, a cart drawer with a checkout form, a toast, and a footer. It behaves like a single-page app without any framework: menus, dialogs, drawers and forms open and close, search results and sorting re-render the grid, and the toast arrives a few seconds after adding to the cart.

The comment at the top of `bench-shop.html` lists the planted problem families. Two of them are planted *bugs* that real pages have: the page behind a dialog is hidden with `aria-hidden` but stays focusable, and the page is **left** hidden after the drawer closes with Escape.

## The journey: login, then 15 steps

Login: `jdoe` / `Admin+123` on `/bench-login.html` (demo credentials of the fixture server, not real secrets). The audited page is `/app/bench-shop.html`.

| # | Step | What changes |
| :-- | :-- | :-- |
| 1 | `click::#menu-toggle` | the category panel opens (hamburger) |
| 2 | `hover::#nav-shop` | the mega menu appears |
| 3 | `click::#menu-toggle` | the panel closes, and the mega menu with it |
| 4 | `fill::#search::tent` | search suggestions appear |
| 5 | `press::#search::Enter` | the grid becomes the search results |
| 6 | `select::#sort::price-asc` | the results are sorted |
| 7 | `click::#filter-brand` | the Brand accordion opens |
| 8 | `click::#qv-1` | the quick-view dialog opens |
| 9 | `fill::#qv-qty::0` | an invalid quantity |
| 10 | `click::#qv-add` | added to the cart, the dialog closes |
| 11 | `wait::.toast` | the toast arrives (about 4 s after the click) |
| 12 | `click::#cart-btn` | the cart drawer opens |
| 13 | `click::#checkout-btn` | the checkout form opens |
| 14 | `fill::#co-email::not-an-email` | an invalid e-mail |
| 15 | `press::active::Escape` | the drawer closes |

It uses all six step types (click, fill, select, press, hover, wait). The report has 16 entries: the page load (**step 0**) plus these 15 (**steps 1 to 15**). The same numbering is used by `reference.js`, `score.js`, the prompts and the reports.

**30 audits**: 15 violations or warnings (`v-missing-alt`, `v-empty-buttons`, `v-empty-links`, `v-generic-link`, `v-unlabeled-inputs`, `v-placeholder-label`, `v-aria-invalid`, `v-broken-aria-ref`, `v-duplicate-id`, `v-heading-errors`, `v-unfocusable`, `v-tabindex`, `v-aria-hidden-focus`, `v-text-contrast`, `v-svg-accessible`) and 15 structural (`i-focus-order`, `i-landmarks`, `i-valid-headings`, `i-image-alts`, `i-aria-roles`, `i-accessible-name`, `i-aria-expanded`, `i-aria-controls`, `i-aria-live`, `i-required-fields`, `i-field-desc`, `i-fieldsets`, `i-touch-targets`, `i-tabindex-all`, `i-aria-pressed`). When this was built, every one reported something after the baseline, and every one (except the focus order, which is a map, not a finding) was resolved at some step; the test run attaches how the current run compares.

## Running the checks

```bash
npm run test:benchmark                         # the 6 tests of the long journey, about 2 minutes
```

If the Playwright UI is open and holds the usual ports, use others: `FIXTURE_PORT=4450 SAMPLES_PORT=4460 npx playwright test --grep @benchmark`.

## The guided benchmark (agent-browser vs Playwright MCP)

An LLM agent gets the journey **in plain words** (never the selectors) and has to discover the selectors by browsing the running page. Tokens, tool calls and time therefore include the discovery. Each run is a separate agent with its own browser session and scratch folder, and the runs are done one after the other (never in parallel), so the timings are comparable. A single run is only indicative: repeat each approach several times.

1. Start the fixture server: `FIXTURE_PORT=4470 node tests/fixtures/server.js` (shop on `http://127.0.0.1:4470`).
2. Build each prompt from `prompts/guided-common.md` by replacing `{BASE_URL}`, `{SCRATCH_DIR}` and `{TOOLS}` (the content of `tools-agent-browser.md` or `tools-playwright-mcp.md`, where `{SESSION}` is a unique session name). Nothing else is added to the prompt. The prompt forbids reading the page source, the answer key or the journey file.
3. Tool paths: **A** only the `agent-browser` CLI for browsing, handing the login to wick-ag-lens with `state save` and `-a`; **B** only the Playwright MCP tools for browsing, letting wick-ag-lens log in with `-u` / `-p`. Both then run the same wick-ag-lens command with the 15 steps and the 30 audits, and answer with a table: step, action, new and resolved audit ids with counts.
4. Record per run: total tokens, tool uses and wall-clock time (from the agent's completion notification); and score it: `node tests/benchmark/score.js <answer.md> <wick-output.json>`.
5. After each run, check its transcript for screenshots, reads of repository files it was not allowed to read, and use of another run's folder.
6. Write the results in a report in `reports/` (see the existing one for the structure).

No WCAG version or level filter is passed (all versions and levels are evaluated), and the wick-ag-lens skill is not used; the prompts are the only instructions.

`score.js` reports how many rows of the agent's table equal the answer key (step 0 is the page load, as in the agent's table), whether its real output file equals the key, and which steps it ran. It does not require the agent to pick the same selectors as `journey.js`: any selector that works gives the same result.

The same journey and key can be used for other analyses: the CLI, MCP, the report viewer, and the packaged samples. A second, open-ended mode (the agent decides the steps) is not defined yet.

## Regenerating the reference

If the page, the journey or the tool is changed on purpose, start the fixture server and run `node tests/benchmark/regenerate-reference.js http://127.0.0.1:4470`. It runs the journey twice with the CLI, refuses to write if the two runs differ, and rewrites `reference.js` (step 0 = page load, steps 1 to 15). The step and audit definitions live only in `journey.js`.

## Skill evaluation (the skill run by different models)

A second, separate measurement: the same purchase journey on this shop, run through the `wick-ag-lens` skill by agents on different models, to see which route the skill picks and what each model costs. Results: [`reports/skill-eval-2026-11-27.md`](reports/skill-eval-2026-11-27.md). Per-run data (agent answer and scoring): [`skill-eval-runs/`](skill-eval-runs/).

| Piece | File |
| :-- | :-- |
| The runs (arms), prompts and expected routes, defined once | `skill-eval/arms.js` |
| Scores one finished in-session subagent run from its transcript and saved report (route, tokens, estimated cost, steps, format checklist, fidelity). No LLM: `node tests/benchmark/skill-eval/score-subagent.js <agentId> <runId> <sonnet\|haiku\|opus>` | `skill-eval/score-subagent.js` |
| Headless runner (`claude -p` in a clean scratch project, exact tool sets per arm, cost cap and ledger) and its project builder. **Not used yet**: Claude Code refused `--strict-mcp-config` under an enterprise MCP policy, so the first evaluation ran as in-session subagents | `skill-eval/run.js`, `skill-eval/make-project.js` |

Limits of the first evaluation: only the route reachable in that session (Tier 2 + CLI) was exercised, the agents were told to read the skill file, and costs are estimated from transcripts.
