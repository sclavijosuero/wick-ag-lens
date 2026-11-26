---
name: wick-ag-lens
description: Run deterministic, real-time SPA accessibility audits, step-by-step delta diffs, and token-efficient browser workflows using WICK-AG-Lens (MCP/CLI), agent-browser, and Playwright MCP. Use when auditing webpages, testing WCAG compliance, checking focus order, or navigating authenticated user journeys.
---

# WICK-AG-Lens & Token-Efficient Browser Orchestration

Follow this exact routing hierarchy and token-hygiene protocol for all web auditing and browser automation tasks.

## 1. Strict Token-Efficiency Guardrails (ALWAYS ENFORCE)
1. **No Base64 Screenshots in Context:**
   - **NEVER** set `includeScreenshot: true` in `wick-ag-lens` or call `browser_take_screenshot` in Playwright MCP unless the user explicitly requests a visual report or layout inspection.
   - If a visual report is requested, redirect CLI output directly to disk (`-s > /tmp/wick-report.json`) rather than loading Base64 strings into LLM context.
2. **Scope the Analysis by Default (WCAG 2.0 and 2.1, levels A and AA):**
   - Pass `wcagVersions: ["2.0", "2.1"]` and `wcagLevels: ["A", "AA"]`. The filters apply per rule **and per result type** (for example, text contrast reports only AA failures, not AAA ones), exactly like the extension's version and level checkboxes. Add `"2.2"` or `"AAA"` only when the user asks for them.
   - To cut noise further, pass targeted `requestedAudits` (e.g., `["v-heading-errors", "v-unlabeled-inputs", "v-placeholder-label", "v-label-in-name"]`).
3. **Never Dump Raw JSON or Full DOM Trees:**
   - In Playwright MCP, never call `browser_snapshot` repeatedly without a state change; prefer targeted `browser_evaluate` queries.
   - Parse WICK-AG-Lens delta logs internally and output only the structured Markdown summary below.

---

## 2. Tool Routing Strategy (Choose the Lightest Path)

### Tier 1: Direct WICK-AG-Lens MCP (Fastest — Known URLs & Selectors)
Use this first whenever the target URL and CSS selectors (including login forms) are known:
1. Call `wick-ag-lens:audit_baseline` with `url`, `includeScreenshot: false`, `wcagVersions: ["2.0", "2.1"]` and `wcagLevels: ["A", "AA"]`.
   - For protected pages, pass `loginUrl` + `authSteps` (`[{ action, target, value }]`), `user`/`pass`, `authScript`, or an existing `authState` JSON path directly into `audit_baseline`. To log in only once, add `saveAuthState: "<file>"` to that first call (it needs a login method) and pass the file as `authState` in later calls instead of the credentials; the reply's `auth_state.saved` confirms the write.
2. Chain `wick-ag-lens:interact_and_diff` (`click`, `fill`, `select`, `press`, `hover`, `wait`) to step through the SPA and inspect only `new_findings` and `resolved_findings` per step.

### Tier 2: `agent-browser` CLI + WICK-AG-Lens (Best for Unknown SPAs & Complex Auth)
When bash/terminal access is available and selectors are unknown or require dynamic exploration:
1. **Scout & Authenticate with `agent-browser`:** Use `agent-browser` CLI commands (`open`, `snapshot -i`, `click @e1`, `fill @e2 "..."`), `agent-browser auth login <profile>`, or `agent-browser --auto-connect` to navigate and authenticate using compact `@e` accessibility-tree references (~70% fewer tokens than Playwright MCP).
2. **Hand Off to WICK-AG-Lens:**
   - Export session state via `agent-browser state save /tmp/auth-state.json`, then call `wick-ag-lens:audit_baseline` with `authState: "/tmp/auth-state.json"` (or CLI `-a /tmp/auth-state.json`) to run the deep deterministic DOM audit.
   - *Blind-Spot Fallback:* If `agent-browser` cannot see an interactive element because it lacks ARIA roles/labels, run `wick-ag-lens:audit_baseline` on that URL to extract the raw `selector` and `htmlSnippet` of the unlabeled element.

### Tier 3: Playwright MCP + WICK-AG-Lens MCP (Fallback When No Bash Access Exists)
Use only in sandboxed environments without terminal access (e.g., Claude Desktop) when dynamic page discovery is needed before auditing:
1. Use Playwright MCP (`--caps=core`) minimally to navigate or extract selectors.
2. Immediately hand off to `wick-ag-lens:audit_baseline` and `wick-ag-lens:interact_and_diff` for all accessibility assertions and delta tracking.

### CLI Fallback (When MCP Is Not Configured)
If MCP tools are unavailable, execute the CLI via bash and write output to a temporary JSON file so stdout stays clean:
```bash
npx wick-ag-lens audit "<URL>" \
  --wcag-version "2.0,2.1" --wcag-level "A,AA" \
  --login-url "<LOGIN_URL>" \
  --auth-step "fill::#user::<USER>" \
  --auth-step "fill::#password::<PASS>" \
  --auth-step "click::#btn-login" \
  --step "click::<SELECTOR>" > /tmp/wick-report.json
```
If the user wants a visual report, tell them to open `node_modules/wick-ag-lens/report-template/wick-ag-lens-viewer.html` in a browser and drop the saved JSON file onto it (leading `[Audit]` log lines are tolerated).

---

## 3. Required Output Format
Present all audit results to the user in this exact layout:
- **Health Summary:** Total distinct issues across the journey for each severity the audits use, in this order: `Critical`, `Serious`, `Moderate`, `Minor`, and `Manual` (needs a human check; the tool cannot decide pass or fail, e.g. focus-ring visibility or contrast over images). Show a count for every level, including `0`. Do not count `Informative` items: they describe page structure (headings, landmarks, focus order) and are context, not issues.
- **Step-by-Step Delta Highlights:** Briefly note which user actions introduced new accessibility barriers or resolved existing ones.
- **Prioritized Remediation Table:** Group by severity (`Critical` → `Serious` → `Moderate` → `Minor`) with columns: `Severity | Audit ID | Step | Selector | Fix`. Include the `htmlSnippet` for each issue. Take the `Fix` text from the report's `audit_dictionary`, not from memory: look up the finding's `auditId` and use `info.fix` (it is HTML, so strip the tags), adding `info.why` and its WCAG link when the user needs the reason. Then show the corrected code for that specific `htmlSnippet` as an example. `interact_and_diff` returns only one step and no dictionary, so call `get_audit_trail` (or read the final report) before writing the table, because audits first seen in later steps are added to the dictionary then. List `Manual` findings in a separate "Needs manual review" list after the table, saying what a person must verify; do not present them as confirmed failures.
- **Detection Confidence:** Each audit in `audit_dictionary` has `info.detection` (`rule`, `pattern` or `best-effort`) and, when it is not `rule`, `info.detection_note` with its known limit. Findings from `rule` audits apply a defined rule, so they are the most dependable, though they still do not prove the page is fully accessible. For `pattern` and `best-effort` findings, add a `Needs confirmation` mark in the table (or a `Confidence` column) and quote the `detection_note` so the user knows what to verify before acting. Do not present them as proven failures, and do not treat an empty result from these audits as proof the page is clean (for example, `v-unfocusable` cannot see click handlers added in JavaScript).