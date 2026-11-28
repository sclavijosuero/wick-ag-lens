---
name: wick-ag-lens
description: Run deterministic, real-time SPA accessibility audits, step-by-step delta diffs, and token-efficient browser workflows using WICK-AG-Lens (MCP/CLI), agent-browser, and Playwright MCP. Use when auditing webpages, testing WCAG compliance, checking focus order, or navigating authenticated user journeys.
---

# WICK-AG-Lens & Token-Efficient Browser Orchestration

Follow this exact routing hierarchy and token-hygiene protocol for all web auditing and browser automation tasks.

## 1. Strict Token-Efficiency Guardrails (ALWAYS ENFORCE)
1. **No Base64 Screenshots in Context:**
   - **NEVER** set `includeScreenshot: true` in `wick-ag-lens` or call `browser_take_screenshot` in Playwright MCP unless the user explicitly requests a visual report or layout inspection.
   - If a visual report is requested, redirect CLI output directly to disk (`-s > ./wick-report.json`) rather than loading Base64 strings into LLM context.
2. **Scope the Analysis by Default (WCAG 2.0 and 2.1, levels A and AA):**
   - Pass `wcagVersions: ["2.0", "2.1"]` and `wcagLevels: ["A", "AA"]`. The filters apply per rule **and per result type** (for example, text contrast reports only AA failures, not AAA ones), exactly like the extension's version and level checkboxes. Add `"2.2"` or `"AAA"` only when the user asks for them.
   - To cut noise further, pass targeted `requestedAudits` (e.g., `["v-heading-errors", "v-unlabeled-inputs", "v-placeholder-label", "v-label-in-name"]`).
3. **Never Dump Raw JSON or Full DOM Trees:**
   - In Playwright MCP, never call `browser_snapshot` repeatedly without a state change; prefer targeted `browser_evaluate` queries.
   - Parse WICK-AG-Lens delta logs internally and output only the structured Markdown summary below.

---

## 2. Tool Routing Strategy (Choose the Lightest Path)

**How to choose.** Check what you have, in this order, and take the first match:
1. **`wick-ag-lens:*` MCP tools are available, and the URL and selectors are known** (or can be read with one baseline audit): **Tier 1**.
2. **A terminal (bash) is available, and the page or its login is unknown to you** (you must explore it first): **Tier 2**. Scout and log in with `agent-browser`, save the session, then audit with the `wick-ag-lens:*` MCP tools if they are available, or with the **CLI Fallback** below if they are not.
3. **No terminal, but Playwright MCP and the `wick-ag-lens:*` MCP tools are available**: **Tier 3**.
4. **Only a terminal, with the selectors known**: skip scouting and use the **CLI Fallback** directly.
5. **None of these**: tell the user which tool is missing; do not guess selectors.

State the tier you chose and why, in one line, before you start.

### Tier 1: Direct WICK-AG-Lens MCP (Fastest — Known URLs & Selectors)
Use this first whenever the target URL and CSS selectors (including login forms) are known:
1. Call `wick-ag-lens:audit_baseline` with `url`, `includeScreenshot: false`, `wcagVersions: ["2.0", "2.1"]` and `wcagLevels: ["A", "AA"]`.
   - For protected pages, pass `loginUrl` + `authSteps` (`[{ action, target, value }]`), `user`/`pass`, `authScript`, or an existing `authState` JSON path directly into `audit_baseline`. To log in only once, add `saveAuthState: "<file>"` to that first call (it needs a login method) and pass the file as `authState` in later calls instead of the credentials; the reply's `auth_state.saved` confirms the write.
2. Chain `wick-ag-lens:interact_and_diff` (`click`, `fill`, `select`, `press`, `hover`, `wait`) to step through the SPA and inspect only `new_findings` and `resolved_findings` per step.

### Tier 2: `agent-browser` CLI + WICK-AG-Lens (Best for Unknown SPAs & Complex Auth)
When bash/terminal access is available and selectors are unknown or require dynamic exploration:
1. **Scout & Authenticate with `agent-browser`:** Use `agent-browser` CLI commands (`open`, `snapshot -i`, `click @e1`, `fill @e2 "..."`), `agent-browser auth login <profile>`, or `agent-browser --auto-connect` to navigate and authenticate using compact `@e` accessibility-tree references (fewer tokens than Playwright MCP: about 35% in our benchmark of the two browsing tools alone, without this skill, on a 15-step journey; it varies with page size and task length).
2. **Hand Off to WICK-AG-Lens:**
   - Export session state via `agent-browser state save ./auth-state.json`, then call `wick-ag-lens:audit_baseline` with `authState: "./auth-state.json"` (or CLI `-a ./auth-state.json`) to run the deep deterministic DOM audit.
   - *Blind-Spot Fallback:* If `agent-browser` cannot see an interactive element because it lacks ARIA roles/labels, run `wick-ag-lens:audit_baseline` on that URL to extract the raw `selector` and `htmlSnippet` of the unlabeled element.

### Tier 3: Playwright MCP + WICK-AG-Lens MCP (Fallback When No Bash Access Exists)
Use only in sandboxed environments without terminal access (e.g., Claude Desktop) when dynamic page discovery is needed before auditing:
1. Use Playwright MCP (`--caps=core,storage`) minimally to navigate or extract selectors.
2. If the page needs a login, sign in with Playwright MCP, then export the session with `browser_storage_state(filename: "state.json")` (needs `--caps=storage`) and pass it to `wick-ag-lens:audit_baseline` as `authState: "state.json"`.
3. Immediately hand off to `wick-ag-lens:audit_baseline` and `wick-ag-lens:interact_and_diff` for all accessibility assertions and delta tracking.

### CLI Fallback (When MCP Is Not Configured)
If MCP tools are unavailable, execute the CLI via bash and write output to a temporary JSON file so stdout stays clean:
```bash
npx wick-ag-lens audit "<URL>" \
  --wcag-version "2.0,2.1" --wcag-level "A,AA" \
  --login-url "<LOGIN_URL>" \
  --auth-step "fill::#user::<USER>" \
  --auth-step "fill::#password::<PASS>" \
  --auth-step "click::#btn-login" \
  --step "click::<SELECTOR>" > ./wick-report.json
```
- **Logged-in session from Tier 2:** replace the `--login-url` and `--auth-step` lines with `-a ./auth-state.json` (saved by `agent-browser state save ./auth-state.json`).
- **Keep files inside the project folder.** Under Git Bash on Windows, `/tmp` in a shell command and in Node can be different folders; use `./` paths, or the path that `agent-browser state save` prints.
- **Steps:** `--step` takes any Playwright selector (`#id`, `text=Brand`, `button:has-text("Brand")`). For `select`, the value can be the option's visible text. If a step fails (for example a timeout because an earlier step already closed the dialog), the CLI prints an error and writes **no JSON**, so earlier steps are lost: scout the page first (`agent-browser snapshot -i`) and add only steps that apply at that point.
- **`@e` refs are not selectors.** Refs such as `@e12` exist only inside the `agent-browser` session and cannot be used in `--step`. Turn each snapshot line into a Playwright selector from its role and name: `textbox "Email"` becomes `role=textbox[name="Email"]`, `button "Sign in"` becomes `role=button[name="Sign in"]`, or use `text=Sign in`.
- **Names that change with state.** Some names change after an action (for example a cart button named by its item count), so a name-based selector may only match after an earlier step. Prefer a stable CSS selector: run one baseline audit with no `--step` and copy the ids from its `new_findings` (for example `#cart-btn`).
- **The saved file is not pure JSON:** stdout starts with `[Audit]` progress lines, and the JSON begins at the first line that is exactly `{`. Cut everything above it before parsing (for example `JSON.parse(text.slice(text.search(/^\{$/m)))`).
- **Structure of the report:** each step has `new_findings` and `resolved_findings`: tab (`Violations & Warnings`, `Informative & Structure`) -> category (for example `Forms & Controls`) -> a list of audits `{ auditId, audit, severity, totalElemsNew, elements: [{ selector, htmlSnippet, issueText, legend }] }`. Walk it recursively to find the objects that have an `auditId`.
- **Read it without loading it:** parse the file with a short script (Node is available) that prints only, per step, the audit ids and selectors of `new_findings` and `resolved_findings`, plus `global_summary`. Never print the whole file.

If the user wants a visual report, tell them to open `node_modules/wick-ag-lens/report-template/wick-ag-lens-viewer.html` in a browser and drop the saved JSON file onto it (leading `[Audit]` log lines are tolerated).

---

## 3. Required Output Format
Present all audit results to the user in this exact layout:
- **Health Summary:** The report's `global_summary`: the issues still active when the last step finished (each counted once, even if it persisted across steps), for each severity the audits use, in this order: `Critical`, `Serious`, `Moderate`, `Minor`, and `Manual` (needs a human check; the tool cannot decide pass or fail, e.g. focus-ring visibility or contrast over images). Show a count for every level, including `0`. Do not count `Informative` items: they describe page structure (headings, landmarks, focus order) and are context, not issues. Say that the counts describe the final state: issues that appeared and were fixed earlier are not in them, so cover those in the delta highlights.
- **Step-by-Step Delta Highlights:** Briefly note which user actions introduced new accessibility barriers or resolved existing ones.
- **Prioritized Remediation Table:** Group by severity (`Critical` → `Serious` → `Moderate` → `Minor`) with columns: `Severity | Audit ID | Step | Selector | Fix`. Include the `htmlSnippet` for each issue. Take the `Fix` text from the report's `audit_dictionary`, not from memory: look up the finding's `auditId` and use `info.fix` (it is HTML, so strip the tags), adding `info.why` and its WCAG link when the user needs the reason. Then show the corrected code for that specific `htmlSnippet` as an example. `interact_and_diff` returns only one step and no dictionary, so call `get_audit_trail` (or read the final report) before writing the table, because audits first seen in later steps are added to the dictionary then. List `Manual` findings in a separate "Needs manual review" list after the table, saying what a person must verify; do not present them as confirmed failures.
- **Detection Confidence:** Each audit in `audit_dictionary` has `info.detection` (`rule`, `pattern` or `best-effort`) and, when it is not `rule`, `info.detection_note` with its known limit. Findings from `rule` audits apply a defined rule, so they are the most dependable, though they still do not prove the page is fully accessible. For `pattern` and `best-effort` findings, add a `Needs confirmation` mark in the table (or a `Confidence` column) and quote the `detection_note` so the user knows what to verify before acting. Do not present them as proven failures, and do not treat an empty result from these audits as proof the page is clean (for example, `v-unfocusable` cannot see click handlers added in JavaScript).