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
2. **Filter Noisy Informative Audits by Default:**
   - Pass `wcagLevels: ["A", "AA"]` or targeted `requestedAudits` (e.g., `["v-heading-errors", "v-unlabeled-inputs", "v-placeholder-label", "v-label-in-name"]`) unless the user specifically asks for `i-focus-order` or `AAA` informative checks.
3. **Never Dump Raw JSON or Full DOM Trees:**
   - In Playwright MCP, never call `browser_snapshot` repeatedly without a state change; prefer targeted `browser_evaluate` queries.
   - Parse WICK-AG-Lens delta logs internally and output only the structured Markdown summary below.

---

## 2. Tool Routing Strategy (Choose the Lightest Path)

### Tier 1: Direct WICK-AG-Lens MCP (Fastest — Known URLs & Selectors)
Use this first whenever the target URL and CSS selectors (including login forms) are known:
1. Call `wick-ag-lens:audit_baseline` with `url`, `includeScreenshot: false`, and `wcagLevels: ["A", "AA"]`.
   - For protected pages, pass `loginUrl` + `authSteps` (`[{ action, target, value }]`), `user`/`pass`, `authScript`, or an existing `authState` JSON path directly into `audit_baseline`.
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
  --wcag-level "A,AA" \
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
- **Health Summary:** Total distinct `Critical`, `Serious`, and `Moderate` issues across the journey.
- **Step-by-Step Delta Highlights:** Briefly note which user actions introduced new accessibility barriers or resolved existing ones.
- **Prioritized Remediation Table:** Group by severity (`Critical` → `Serious` → `Moderate`) with columns: `Severity | Audit ID | Step | Selector | Fix`. Include the `htmlSnippet` and exact code fix for each issue.