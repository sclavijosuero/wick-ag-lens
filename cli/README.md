# WICK-AG-Lens: Headless CLI, MCP Server & `agent-browser` Guide

> [**← Back to Main Project Documentation**](../README.md) | [**Chrome DevTools Extension Guide →**](../extension/README.md)

The **WICK-AG-Lens CLI & MCP Package** utilizes Playwright to inject the shared WICK-AG-Lens core accessibility heuristics into a headless browser. It equips CI/CD pipelines and AI coding agents (Claude Code, Claude Desktop, Cursor, Windsurf, Copilot) with deterministic DOM auditing, multi-step authentication, real-time SPA delta-diffing, **`agent-browser`** session handoffs, and a bundled **AI Agent Skill (`SKILL.md`)**.

It runs the **same 55 heuristic rulesets as the Chrome extension**, across the same two tabs: **Violations & Warnings** (actionable failures, 27 rules) and **Informative & Structure** (valid page architecture and semantic patterns, 28 rules). *(See the full [Audit Library & Ruleset](../README.md#audit-library--ruleset).)* The WCAG **Version** (`2.0`, `2.1`, `2.2`) and **Level** (`A`, `AA`, `AAA`) filters work like the extension's checkboxes: `--wcag-version` / `--wcag-level` (MCP: `wcagVersions` / `wcagLevels`) restrict both which rules run and, for rules that report several kinds of result (text contrast, touch targets, language of parts), which of those results are reported.

---

## Table of Contents
1. [Installation & Compatibility](#installation--compatibility)
2. [Headless CLI Automation](#headless-cli-automation)
3. [Step Actions & Keyboard Reference](#step-actions--keyboard-reference)
4. [CLI Usage Examples](#cli-usage-examples)
5. [Authentication Strategies (5 Methods)](#authentication-strategies-5-methods)
6. [Viewing CLI Screenshots](#viewing-cli-screenshots)
7. [Handling Enterprise Firewalls & Cookie Banners](#handling-enterprise-firewalls--cookie-banners)
8. [MCP Server & AI Agent Integration](#mcp-server--ai-agent-integration)
9. [AI Agent Skill Setup (`SKILL.md`)](#ai-agent-skill-setup-skillmd)
10. [Integrating with `agent-browser` & Playwright MCP](#integrating-with-agent-browser--playwright-mcp)
11. [CLI & MCP JSON Output Format](#cli--mcp-json-output-format)
12. [Sample Pages (Try It Without a Server)](#sample-pages-try-it-without-a-server)
13. [Visual HTML Report Viewer](#visual-html-report-viewer)
14. [CLI & MCP Limitations & Technical Bounds](#cli--mcp-limitations--technical-bounds)

---

## Installation & Compatibility

### Compatibility
* **Node.js:** `18.0.0` or higher (ES Modules support required).
* **Browser Engine:** Playwright Chromium (`playwright >= 1.40.1`).
* **Operating Systems:** Windows, macOS, and Linux (including headless Docker/CI containers).
* **AI Companions:** Any MCP-compatible client (Claude Desktop, Claude Code CLI/VS Code Extension, Cursor, Windsurf, Cline) and Vercel's [`agent-browser`](https://agent-browser.dev/) CLI.

### Setup
Navigate to the `cli` directory (or install via npm) and install the dependencies along with the Playwright Chromium binary:
```bash
cd cli
npm install
npx playwright install chromium
```

---

## Headless CLI Automation

Run a baseline audit against any public URL:
```bash
node index.js audit https://example.com
```
*(Or via `npx wick-ag-lens audit https://example.com` when installed from npm).*

### CLI Options

You can pass several arguments to customize the run:

* `--audits <list>`: Comma-separated list of specific audit IDs to run (e.g., `v-doc-title,v-empty-links`). If omitted, all available audits (both **Violations & Warnings** and **Informative & Structure**) are evaluated by default.
* `--wcag-version <versions>`: Comma-separated list to strictly filter executed audits by WCAG version (e.g., `2.0,2.1,2.2`). If omitted, all supported versions are evaluated by default. Filters apply per rule **and per result type**: for example text contrast reports only the AA failures when `AAA` is not selected, exactly like the extension's checkboxes.
* `--wcag-level <levels>`: Comma-separated list to strictly filter executed audits by WCAG conformance level (e.g., `A,AA,AAA`). If omitted, all supported levels are evaluated by default.
* `-w, --width <pixels>`: Sets the viewport width to test responsive layouts (defaults to `1280`).
* `-H, --height <pixels>`: Sets the viewport height to test responsive layouts (defaults to `800`).
* `-s, --screenshot`: Includes a Base64 JPEG screenshot of the rendered page inside the final JSON output.
- `-q, --screenshot-quality <quality>`: Sets the JPEG screenshot quality on a `1`–`100` scale when `-s` is enabled (defaults to `70`).
* `--wait-ms <milliseconds>`: Explicit pause duration in milliseconds after `networkidle` to let client-side routers or slow animations settle.
* `--wait-for-selector <selector>`: Halts audit execution until a specific CSS selector mounts in the DOM.
* `--step <step>`: Executable post-baseline interaction step (e.g., `click::#open-modal`, `fill::#email::invalid`). Can be repeated to build a multi-step user journey; each step captures a full accessibility delta diff.
* `--login-url <url>`: URL to navigate to for authentication before running the audit.
* `-u, --user <user>`: Shorthand username for standard 2-field login forms.
* `-p, --pass <pass>`: Shorthand password for standard 2-field login forms.
* `--auth-step <step>`: Executable pre-audit auth pipeline step (e.g., `fill::#company::Acme`). Can be repeated.
* `--auth-script <path>`: Path to a custom JavaScript module exporting an async login function.
* `-i, --interactive`: Launches a visible browser for 30 seconds to manually solve Captchas/MFA or Cookie banners.
* `-a, --auth-state <path>`: Path to a Playwright storage state JSON file (cookies/localStorage), compatible with Playwright and `agent-browser state save`.
  * **Load:** if the file exists, the session is loaded into the browser before the audit, so protected pages are audited logged in. No login flags are needed.
  * **Save after a login (headless):** combine `-a` with a login (`--login-url` + `--auth-step` or `-u`/`-p`, or `--auth-script`) and the session that login created is written to the file. Later runs then only need `-a`. See [Log In Once, Save the Session, Reuse It](#log-in-once-save-the-session-reuse-it-headless). If the login produces no cookies or localStorage (for example, wrong credentials), nothing is written, so a good existing file is never replaced by a logged-out one.
  * **Save in interactive mode:** with `-i`, the session is also written after the 30-second manual window (CAPTCHAs, MFA).
  * `-a` on its own (no login flags, no `-i`) only loads; it never creates or changes the file.
  * The file holds live session cookies in plaintext. It is created owner-only (`0600`) where the OS supports it; keep it out of version control.

---

## Step Actions & Keyboard Reference

Both `--auth-step` (which executes silently before the baseline scan to establish a session) and `--step` (which executes sequentially after the baseline scan and records an accessibility diff per step) use the `action::target::value` format.

### Supported Actions
| Action | Syntax | Behavior |
| :--- | :--- | :--- |
| **`click`** | `click::<selector>` | Clicks the target element (buttons, links, tabs, accordions, checkboxes). |
| **`fill`** | `fill::<selector>::<value>` | Clears an input or textarea and enters `<value>`, firing standard DOM input events. |
| **`select`** | `select::<selector>::<value>` | Chooses an `<option>` inside a native `<select>` element by option value or label. |
| **`press`** | `press::<selector>::<key>` | Focuses `<selector>` and dispatches `<key>`. Use `active` as the selector (`press::active::<key>`) to send keystrokes to the currently focused element without resetting tab order. |
| **`hover`** | `hover::<selector>` | Moves the cursor over `<selector>` to reveal tooltips, dropdowns, or hover states. |
| **`wait`** | `wait::<ms_or_selector>` | Waits for a duration in milliseconds (`wait::1000`) or until a CSS selector appears (`wait::.toast-alert`). |

### Supported Keys for `press`
The `press` action accepts standard **W3C `KeyboardEvent.key`** names (case-sensitive):
* **Navigation & Focus:** `Enter`, `Tab`, `Escape`, `Space`, `Backspace`, `Delete`, `Home`, `End`, `PageUp`, `PageDown`
* **Directional Arrows:** `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`
* **Function Keys:** `F1` – `F12`
* **Characters & Digits:** `a`–`z`, `A`–`Z`, `0`–`9`
* **Modifier Combinations (joined with `+`):** `Shift+Tab`, `Control+a`, `Alt+ArrowDown`, `Meta+Enter` *(Supported modifiers: `Shift`, `Control`, `Alt`, `Meta`, `ControlOrMeta`)*

---

## CLI Usage Examples

### 1. WCAG 2.0 & 2.1 (Levels A & AA) Compliance Audit
Filters the rule engine to run only rules mapped to WCAG versions `2.0` and `2.1` at conformance levels `A` and `AA` (which together represent standard WCAG 2.1 AA compliance), excluding Level AAA and WCAG 2.2 checks.
```bash
node index.js audit "https://example.com" --wcag-version="2.0,2.1" --wcag-level="A,AA"
```

### 2. Targeted Audit Subset (`--audits`)
Runs only a specific comma-separated list of rule IDs instead of the full suite—ideal for fast CI smoke checks on high-priority issues like document titles, image alt text, empty links, and unlabeled form inputs.
```bash
node index.js audit "https://example.com" \
  --audits "v-doc-title,v-missing-alt,v-empty-links,v-unlabeled-inputs"
```

### 3. Focus Order Mapping & Dynamic Shift Detection (`i-focus-order`)
Maps the complete tab-focus sequence of the page on initial load (Step 1), then opens a navigation drawer (Step 2) and outputs the updated focus sequence in `page_state_maps.focus_order`.
```bash
node index.js audit "https://example.com" \
  --audits "i-focus-order" \
  --step "click::button#open-nav-drawer"
```

### 4. Mobile Layout & Responsive Test (iPhone 13 Viewport)
Emulates a `390x844` mobile viewport to catch responsive reflow issues, mobile menu accessibility flaws, and undersized touch targets.
```bash
node index.js audit "https://www.mywebapp.com/" -w 390 -H 844
```

### 5. Single Interaction & Delta Diff with Screenshot
Captures a baseline audit on page load, clicks the navigation menu button, waits for the DOM to settle, and logs only the newly introduced or resolved findings along with Base64 screenshots at each step.
```bash
node index.js audit "https://example.com" \
  --step "click::button#open-navigation-menu" \
  -s
```

### 6. Multi-Step Navigation & Theme Toggle Sequence
Executes a sequence of UI interactions—opening a menu, navigating to settings, and toggling dark mode—producing an isolated step-by-step accessibility diff (such as new color-contrast violations in dark mode).
```bash
node index.js audit "https://example.com" \
  --step "click::button#open-menu" \
  --step "click::a#settings-link" \
  --step "click::button#toggle-dark-mode" \
  -s
```

### 7. Single-Page Application (SPA) Hydration & Targeted Rules
Waits until a dynamic dashboard widget mounts in the DOM, pauses an additional 1.5 seconds for client-side animations to finish, and runs a targeted subset of rules.
```bash
node index.js audit "https://example.com/analytics" \
  --wait-for-selector ".dashboard-chart-ready" \
  --wait-ms 1500 \
  --audits "v-heading-errors,v-unlabeled-inputs,i-accessible-name"
```

### 8. Keyboard Focus Trap & Modal Escape Testing
Opens a modal dialog, tabs through its interactive controls using the active focus element (`active`), and verifies that pressing `Escape` closes the dialog cleanly.
```bash
node index.js audit "https://example.com/settings" \
  --step "click::#open-profile-modal" \
  --step "press::active::Tab" \
  --step "press::active::Tab" \
  --step "press::active::Escape"
```

### 9. Form Validation, Dropdown Selection & Hover States
Tests dynamic form error states and hover-triggered tooltips by selecting a dropdown option, submitting an invalid input, waiting for validation messages, and hovering over a help badge.
```bash
node index.js audit "https://example.com/checkout" \
  --step "select::select#country::US" \
  --step "fill::input#zip-code::000" \
  --step "click::button#submit-order" \
  --step "wait::.validation-error-banner" \
  --step "hover::span.cvv-help-tooltip"
```

### 10. Standard 2-Field Login Shorthand
Authenticates through a standard username/password login page before navigating to the protected target URL and running the baseline audit.
```bash
node index.js audit "https://example.com/account" \
  --login-url "https://example.com/login" \
  -u "jdoe@example.com" \
  -p "SuperSecret123"
```

### 11. Enterprise Multi-Field Auth + Post-Login SPA Workflow
Logs into a 3-field corporate portal using `--auth-step`, then uses `--step` to navigate SPA menus, filter a data grid, submit via keyboard, and capture screenshots filtered to WCAG 2.0/2.1 Level A & AA.
```bash
node cli/index.js audit "https://abi-testing-dojo-demo.azurewebsites.net/" \
  --audits="v-heading-errors,i-touch-targets,v-unlabeled-inputs,i-focus-order,v-placeholder-label,v-label-in-name,i-accessible-name" \
  --wcag-version "2.0,2.1" \
  --wcag-level "A,AA" \
  --login-url "https://abi-testing-dojo-demo.azurewebsites.net/login" \
  --auth-step "fill::#company::Contoso" \
  --auth-step "fill::#user::jdoe" \
  --auth-step "fill::#password::Admin+123" \
  --auth-step "click::#btn-login" \
  --step "click::button.menu-button[title='Security']" \
  --step "click::button.submenu-button[title='Companies']" \
  --step "fill::input[placeholder='Search...']::Contoso" \
  --step "press::active::Enter" \
  -s
```
The same command in **PowerShell**, which continues lines with a backtick (`` ` ``) instead of `\`:
```powershell
node cli/index.js audit "https://abi-testing-dojo-demo.azurewebsites.net/" `
  --audits="v-heading-errors,i-touch-targets,v-unlabeled-inputs,i-focus-order,v-placeholder-label,v-label-in-name,i-accessible-name" `
  --wcag-version "2.0,2.1" `
  --wcag-level "A,AA" `
  --login-url "https://abi-testing-dojo-demo.azurewebsites.net/login" `
  --auth-step "fill::#company::Contoso" `
  --auth-step "fill::#user::jdoe" `
  --auth-step "fill::#password::Admin+123" `
  --auth-step "click::#btn-login" `
  --step "click::button.menu-button[title='Security']" `
  --step "click::button.submenu-button[title='Companies']" `
  --step "fill::input[placeholder='Search...']::Contoso" `
  --step "press::active::Enter" `
  -s
```

### 12. Manual MFA / Cookie Banner Capture & Headless Session Reuse
Opens a visible browser window for 30 seconds so you can manually clear cookie banners or complete Multi-Factor Authentication (MFA), saves the authenticated cookies/storage to `auth-state.json`, and reuses that session in subsequent headless CI runs.
```bash
# Step A: Interactive capture (run once locally)
node index.js audit "https://example.com/portal" -i -a auth-state.json

# Step B: Headless CI audit reusing the saved session
node index.js audit "https://example.com/portal" -a auth-state.json --wcag-level="A,AA"
```

### 13. Custom JavaScript Authentication Module
Delegates complex SSO, OAuth, or multi-page redirect logins to a custom Playwright script (`async (page) => { ... }`) before running the audit.
```bash
node index.js audit "https://example.com/workspace" \
  --auth-script "./scripts/sso-login.mjs" \
  --step "click::button#new-project"
```

### 14. Log In Once, Reuse the Session in Every Later Run
Logs in headlessly on the first run and saves the session; every later run reuses it without a login. See [Log In Once, Save the Session, Reuse It](#log-in-once-save-the-session-reuse-it-headless).
```bash
# First run: log in and save
node index.js audit "https://example.com/portal" --login-url "https://example.com/login" -u "jdoe@example.com" -p "$PASS" -a auth-state.json
# Next runs: just reuse
node index.js audit "https://example.com/portal/reports" -a auth-state.json
```

---

## Authentication Strategies (5 Methods)

WICK-AG-Lens supports **five distinct methods** to authenticate and bypass login screens across both the CLI (`-u`/`-p`, `--auth-step`, `--auth-script`, `-i`/`-a`) and the MCP Server (`user`/`pass`, `authSteps`, `authScript`, `authState`).

> **Want to compare the methods?** [`docs/auth-examples.md`](./docs/auth-examples.md) shows the **same audit and interaction implemented once per login method**, side by side, for the CLI and for MCP.

> **Behind Okta, Microsoft Entra ID or another SSO?** Follow the [Step-by-Step SSO Guide](#auditing-an-app-behind-single-sign-on-sso-step-by-step-guide), which also shows how to put the sign-in in an automated Playwright test.

### 1. Standard 2-Field Login (Shorthand)
Use `-u` and `-p` alongside `--login-url` (or `loginUrl`, `user`, and `pass` in MCP `audit_baseline`) for straightforward single-page login forms.

* **When to use:** Simple forms consisting of a username or email field, a password field, and a submit button on a single page. Under the hood, this automatically compiles into a 3-step pipeline targeting:
  1. **Username / Email:** `input[type="text"], input[type="email"], input[type="user"]`
  2. **Password:** `input[type="password"]`
  3. **Submit:** `button[type="submit"], input[type="submit"]`

```bash
node index.js audit "https://example.com/account" \
  --login-url "https://example.com/login" \
  -u "jdoe@example.com" \
  -p "SuperSecret123"
```

### 2. Complex & Multi-Step Action Pipeline
**When to use:** Forms that require extra fields (like "Company" or "Tenant ID"), or Single Sign-On (SSO) flows (like Okta or Microsoft) where you must submit an email on screen one and enter a password on screen two.
You can chain multiple `--auth-step` flags using the `action::selector::value` format (or pass an `authSteps` array in MCP `audit_baseline`).
*Supported actions: `fill`, `select`, `click`, `press`, `hover`, `wait` (accepts milliseconds or a CSS selector).*

*Example (Multi-Field Form - Username, Password, and Company):*
```bash
node index.js audit https://app.com/dashboard \
  --login-url https://app.com/login \
  --auth-step "fill::input[name='company']::MyCompany" \
  --auth-step "fill::input[name='username']::admin" \
  --auth-step "fill::input[type='password']::1234" \
  --auth-step "click::button[type='submit']"
```

*Example (Multi-Page SSO - Wait for password field to appear):*
```bash
node index.js audit https://app.com/dashboard \
  --login-url https://app.com/login \
  --auth-step "fill::#email-input::admin@company.com" \
  --auth-step "click::#next-btn" \
  --auth-step "wait::#password-input" \
  --auth-step "fill::#password-input::secret123" \
  --auth-step "click::#submit-btn"
```

### 3. Custom Authentication Script (`--auth-script` / `authScript`)
For complex enterprise authentication flows—such as multi-page SSO redirects (Okta, Microsoft Entra ID / Azure AD), OAuth handshakes, or conditional prompts—pass a custom ES module exporting an `async (page) => { ... }` function. The scanner passes the active Playwright `page` instance directly into your function before navigating to the target audit URL.

* **CLI Command:**
```bash
TEST_USER="jdoe@contoso.com" TEST_PASS="Admin+123" \
node index.js audit "https://app.contoso.com/dashboard" \
  --auth-script "./scripts/sso-login.mjs" \
  --step "click::button#open-reports"
```

* **Example Script (`./scripts/sso-login.mjs`):** the script is an ES module, so name it `.mjs` (a plain `.js` file fails with `Unexpected token 'export'` unless its folder has `"type": "module"` in `package.json`).
```javascript
export default async function (page) {
  // 1. Navigate to the protected app to trigger the SSO identity provider redirect
  await page.goto('https://app.contoso.com/login', { waitUntil: 'domcontentloaded' });

  // 2. Step 1 of SSO: Enter corporate email and advance
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.fill(process.env.TEST_USER);
  await page.click('input[type="submit"], button[type="submit"]');

  // 3. Step 2 of SSO: Wait for password screen to mount, fill credentials, and sign in
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
  await passwordInput.fill(process.env.TEST_PASS);
  await page.click('input[type="submit"], button[type="submit"]');

  // 4. Optional: Dismiss "Stay signed in?" prompt if presented by the IdP
  const staySignedInBtn = page.locator('input#idBtn_Back, button[data-testid="dismiss-prompt"]');
  if (await staySignedInBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await staySignedInBtn.click();
  }

  // 5. Wait until redirected back to the authenticated application shell
  await page.waitForURL('https://app.contoso.com/**', { timeout: 20000 });
  await page.waitForSelector('nav.main-navigation', { timeout: 15000 });
}
```

### 4. Interactive State Capture (The "Human Bypass")
**When to use:** Sites with aggressive bot mitigation (Akamai, Cloudflare), invisible reCAPTCHAs, or MFA push notifications to your phone. Launches a visible browser for 30 seconds (`-i`) and exports cookies and `localStorage` to a reusable JSON file (`-a`).
*(See [Handling Enterprise Firewalls & Cookie Banners](#handling-enterprise-firewalls--cookie-banners) below for full instructions).*

### 5. External Browser & `agent-browser` State Handoff (`-a` / `authState`)
**When to use:** AI-driven workflows, encrypted credential vaults, or reusing an active Chrome session you are already logged into without writing login scripts or waiting on a 30-second interactive timer.

Because `agent-browser` and Playwright share the standard `storageState` JSON format (`cookies` and `localStorage`), you can authenticate externally using any of three protocols and pass the exported file straight into WICK-AG-Lens via `-a <path>` (CLI) or `authState` (MCP):

* **Protocol A — AI-Driven Interactive Login (`agent-browser state save`):** An AI agent navigates unfamiliar login forms using compact `@e` accessibility snapshots and saves the resulting session state:
  ```bash
  agent-browser open https://app.example.com/login
  agent-browser snapshot -i
  agent-browser fill @e1 "jdoe@example.com"
  agent-browser fill @e2 "SuperSecret123"
  agent-browser click @e3
  agent-browser wait --url "**/dashboard"
  agent-browser state save auth-state.json

  # Hand off session state to WICK-AG-Lens
  node index.js audit "https://app.example.com/dashboard" -a auth-state.json
  ```
* **Protocol B — Encrypted Credential Vault (`agent-browser auth login`):** Store credentials once in `agent-browser`'s AES-256-GCM encrypted vault (`~/.agent-browser/auth/`) so raw passwords never appear in CLI flags or AI prompts, then export the session state:
  ```bash
  # One-time encrypted profile setup
  echo "SuperSecret123" | agent-browser auth save my-app \
    --url "https://app.example.com/login" \
    --username "jdoe@example.com" \
    --password-stdin

  # Replay login & export storageState for WICK-AG-Lens
  agent-browser auth login my-app
  agent-browser state save auth-state.json
  node index.js audit "https://app.example.com/dashboard" -a auth-state.json
  ```
* **Protocol C — Live Chrome Session Reuse (`--auto-connect`):** Attach `agent-browser` to an already-authenticated local Chrome window (launched with remote debugging) to extract cookies/storage past corporate SSO, hardware security keys, or 2FA:
  ```bash
  agent-browser --auto-connect state save auth-state.json
  node index.js audit "https://app.example.com/dashboard" -a auth-state.json
  ```

> **No external tool needed:** WICK-AG-Lens can also create the state file itself, headlessly, from any of its own login methods. See [Log In Once, Save the Session, Reuse It](#log-in-once-save-the-session-reuse-it-headless).

*(Security Note: Saved `storageState` files contain live session tokens in plaintext—always exclude `*-state.json` in `.gitignore` and delete temporary state files after your audit completes).*

#### What the handoff covers, and what it does not
The handoff passes a **file**, not a browser. `agent-browser` and WICK-AG-Lens each run their **own** browser; the only thing that travels between them is the `storageState` file.

| | Covered | Not covered |
| :-- | :-- | :-- |
| **Carried in the file** | Cookies, and `localStorage` of every origin that was open when `state save` ran | `sessionStorage`, in-memory tokens, the open tabs and the page the user was on |
| **Session lifetime** | Once loaded, the session lives in WICK-AG-Lens's browser for the **whole** audit: every `--step` (CLI) or `interact_and_diff` call (MCP) reuses it | The file is a snapshot: if the server expires the session, or rotates a token, the file goes stale (sign in again and save a new one) |
| **Apps that keep the token only in `sessionStorage`** | | They will look logged out. Log in **inside** WICK-AG-Lens instead (`--auth-step` / `authSteps`, or `--auth-script` / `authScript`): that browser, and its `sessionStorage`, stay open for the whole journey |
| **Sharing one live browser** | | Attaching WICK-AG-Lens to the browser `agent-browser` is driving (over the Chrome DevTools Protocol) is **not implemented**; it is being evaluated |

What happens, in order, when you use the handoff:

```mermaid
sequenceDiagram
    autonumber
    participant AB as agent-browser (its own browser)
    participant F as state file (storageState)
    participant W as WICK-AG-Lens (its own browser)
    AB->>AB: open the login page, read the snapshot, fill and submit
    AB->>F: state save: cookies + localStorage
    Note over AB,F: sessionStorage is not written
    AB-->>AB: closed (optional): nothing else is needed from it
    W->>F: -a / authState: load the file into a NEW browser context
    W->>W: baseline: open the target URL, already signed in
    loop every --step / interact_and_diff
        W->>W: act, settle, audit, report only what changed
    end
    W-->>W: JSON report (url of step 1 tells you whether the login held)
```

Not shown, because it is not implemented: a second path where WICK-AG-Lens connects to the running `agent-browser` browser and shares its live session (including `sessionStorage`).

If a handoff did not work, look at `audit_trail[0].url` in the report: if it is the sign-in page, the file did not carry a valid session.

### Log In Once, Save the Session, Reuse It (Headless)

Logging in on every run is slow, and some logins cannot be repeated at all (rate limits, MFA, one-time codes). WICK-AG-Lens can save the session created by **any** of its login methods and reuse it afterwards, with no browser window and no human:

| | Save the session after logging in | Reuse it later (no login) |
| :--- | :--- | :--- |
| **CLI** | login flags **+ `-a <file>`** | `-a <file>` alone |
| **MCP** | `audit_baseline` login arguments **+ `saveAuthState: "<file>"`** | `audit_baseline` with `authState: "<file>"` |

**CLI**
```bash
# Run 1: log in (any method: -u/-p, --auth-step pipeline or --auth-script) and save the session
node index.js audit "https://app.example.com/dashboard" \
  --login-url "https://app.example.com/login" \
  --auth-step "fill::#company::Northwind" \
  --auth-step "fill::#user::jdoe" \
  --auth-step "fill::#password::$APP_PASSWORD" \
  --auth-step "click::#btn-login" \
  -a ./auth/app-state.json
# [Auth] Saved session state to /path/auth/app-state.json (3 cookies, 1 origins with localStorage).

# Run 2, 3, 4...: no credentials, no login steps. Just reuse the saved session
node index.js audit "https://app.example.com/reports" -a ./auth/app-state.json
```

**MCP** (`audit_baseline` arguments)
```jsonc
// Session 1: log in and save. The reply gains an "auth_state" key describing what was written.
{
  "url": "https://app.example.com/dashboard",
  "loginUrl": "https://app.example.com/login",
  "authSteps": [
    { "action": "fill", "target": "#company", "value": "Northwind" },
    { "action": "fill", "target": "#user", "value": "jdoe" },
    { "action": "fill", "target": "#password", "value": "..." },
    { "action": "click", "target": "#btn-login" }
  ],
  "saveAuthState": "./auth/app-state.json"
}
// Reply (excerpt): { "audit_trail": [...], "auth_state": { "saved": true, "path": "...", "cookies": 3, "origins": 1 } }

// Any later session: no login arguments at all
{ "url": "https://app.example.com/reports", "authState": "./auth/app-state.json" }
```

**Good to know**
* **Refreshing an expired session:** run the login flags with `-a` (or `saveAuthState`) again. The file is overwritten with the fresh session.
* **Failed logins are not saved.** If the login leaves the browser with no cookies and no localStorage (wrong password, wrong selectors), the file is not written. The CLI prints `NOT writing ...`; MCP replies with `"auth_state": { "saved": false, "reason": "..." }`. A login that fails but still sets cookies (for example an anonymous session cookie) cannot be detected, so verify the audited URL.
* **`saveAuthState` needs a login.** On MCP, passing it without `authScript`, `loginUrl` + `authSteps`, or `loginUrl` + `user`/`pass` is rejected with an error before anything runs.
* **Compatible with other tools:** the file is a standard Playwright `storageState`, so it also works with Playwright and `agent-browser`.
* **Keep it secret:** the file contains live session cookies. Add it to `.gitignore` (for example `*-state.json`), never commit it, and delete it when no longer needed.

### Auditing an App Behind Single Sign-On (SSO): Step-by-Step Guide

With SSO, the app does not show a login form itself. It sends the browser to an **identity provider** (Okta, Microsoft Entra ID / Azure AD, Auth0, Keycloak...) on **another website**, you sign in there, and the provider sends you back to the app. WICK-AG-Lens drives a real browser, so it follows these redirects like a user would. You only have to describe what to click and type on the provider's pages.

**Step 1: Choose your approach**

| Your sign-in | Use | Section |
| :--- | :--- | :--- |
| Provider pages with a user name and password (one or two screens), no MFA | `--auth-step` / `authSteps` | [Recipe A](#recipe-a-sign-in-with-auth-steps-most-common) |
| Conditional prompts, "Stay signed in?" pages, logic that steps cannot express | `--auth-script` / `authScript` | [Recipe B](#recipe-b-sign-in-with-a-script) |
| MFA, CAPTCHA, push approval, hardware key | Sign in by hand once, save the session | [Recipe C](#recipe-c-mfa-or-captcha-sign-in-once-by-hand-reuse-the-session) |
| You run the audit many times (CI, agents) | Add `-a` / `saveAuthState` to any of the above | [Recipe D](#recipe-d-sign-in-once-reuse-everywhere) |

#### Recipe A: Sign in with auth steps (most common)

1. **Open the protected page, not the provider.** Set `--login-url` (MCP: `loginUrl`) to a page of your app that needs a login. It redirects the browser to the provider, so you do not need to know the provider's address.
2. **Describe the provider's pages**, one `--auth-step` per action (`fill`, `click`, `wait`...), in the order a person would do them. Find the selectors with your browser's DevTools on the provider's sign-in page.
3. **Wait for the second screen.** Most providers ask for the user name first and show the password field afterwards. Put a `wait::<password selector>` between the two screens.
4. **Finish with a `wait` on something that only exists inside your app** (a navigation bar, the user's name). This guarantees the browser is back from the provider before the audit starts.
5. **Audit as usual.** The positional URL is the page you want audited.

```bash
node cli/index.js audit "https://app.example.com/dashboard" \
  --audits "v-missing-alt,v-empty-buttons" \
  --login-url "https://app.example.com/dashboard" \
  --auth-step "fill::#username::$SSO_USER" \
  --auth-step "click::#next" \
  --auth-step "wait::#password" \
  --auth-step "fill::#password::$SSO_PASSWORD" \
  --auth-step "click::#sign-in" \
  --auth-step "wait::nav.main-navigation"
```
The same in MCP (`audit_baseline` arguments): `loginUrl` is the protected page and `authSteps` is the same list as `{ "action": "fill", "target": "#username", "value": "..." }` objects. Later `interact_and_diff` calls keep the signed-in session.

#### Recipe B: Sign in with a script

Use it when the steps are not enough, for example to dismiss an optional "Stay signed in?" prompt. Your script receives the Playwright `page` and must leave it signed in on the app. See the full example in [Custom Authentication Script](#3-custom-authentication-script---auth-script--authscript). **Save the script as `.mjs`** (for example `sso-login.mjs`): it is an ES module, and a plain `.js` file fails with `Unexpected token 'export'` unless its folder has `"type": "module"` in `package.json`.

#### Recipe C: MFA or CAPTCHA (sign in once by hand, reuse the session)

A robot cannot answer an MFA prompt, so a person (or another tool) signs in once and WICK-AG-Lens reuses the result:

1. Run with `-i -a sso-state.json`. A visible browser opens for 30 seconds: sign in and approve the MFA. The session is saved to `sso-state.json`. (Or save the file with `agent-browser` or Playwright; see [External Browser & `agent-browser` State Handoff](#5-external-browser--agent-browser-state-handoff--a--authstate).)
2. Audit with only `-a sso-state.json` (MCP: `authState`). No login steps and no provider visit.
3. When the session expires, repeat step 1.

#### Recipe D: Sign in once, reuse everywhere

Add `-a <file>` (MCP: `saveAuthState`) to Recipe A or B and the session is saved right after the login; every later run needs only `-a <file>`. The saved file holds the cookies of **both** websites (the app and the provider), which is what makes the reuse work. Details and examples: [Log In Once, Save the Session, Reuse It](#log-in-once-save-the-session-reuse-it-headless).

**Step 2: Check that you really are signed in**

A sign-in that silently failed produces an audit of the *provider's sign-in page*, which looks like a normal report. Always look at the first step of the JSON report (`audit_trail[0]`):
* `url` must be the page you asked for, on **your app's** address. If it is the provider's address, the login did not complete.
* For extra certainty, audit something that exists only after sign-in and check it is there.

**Step 3: Put it in an automated test (best practice)**

Run the audit from your own Playwright Test suite so a broken sign-in or a new accessibility problem fails the build. Three tests are enough: a **control** (not signed in, you end on the provider, proving the page really is protected), the **sign-in** itself, and a **save and reuse**.

```javascript
// sso.spec.js - run with: npx playwright test sso.spec.js
import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';

const run = promisify(execFile);
const WICK = createRequire(import.meta.url).resolve('wick-ag-lens/index.js');

const APP = 'https://app.example.com';
const PROTECTED = `${APP}/dashboard`;       // redirects to the identity provider when nobody is signed in
const IDP_HOST = 'login.example-idp.com';    // where the sign-in pages live

// The sign-in, written for the identity provider's pages. The LAST step waits for an element that only exists
// inside the app, so the audit never starts before the browser is back from the identity provider.
const SIGN_IN = [
  `fill::#username::${process.env.SSO_USER}`,
  'click::#next',
  'wait::#password',                        // screen 2 appears after screen 1
  `fill::#password::${process.env.SSO_PASSWORD}`,
  'click::#sign-in',
  'wait::nav.main-navigation',
].flatMap((step) => ['--auth-step', step]);

// Runs the CLI and returns its audit_trail. stdout is "[Audit] ..." log lines followed by the JSON report.
async function audit(args) {
  const { stdout } = await run(process.execPath, [WICK, 'audit', ...args],
    { maxBuffer: 64 * 1024 * 1024, timeout: 120_000 });
  return JSON.parse(stdout.slice(stdout.search(/^\{$/m))).audit_trail;
}

test('control: without signing in, the protected page ends on the identity provider', async () => {
  const [step] = await audit([PROTECTED, '--audits', 'v-doc-title']);
  expect(new URL(step.url).host).toBe(IDP_HOST);
});

test('signs in through SSO and audits the protected page', async () => {
  const [step] = await audit([PROTECTED, '--audits', 'v-doc-title', '--login-url', PROTECTED, ...SIGN_IN]);
  expect(step.url).toBe(PROTECTED);          // back on the app, not stuck on the identity provider
});

test('signs in once, saves the session, then reuses it with no login', async ({}, testInfo) => {
  const state = testInfo.outputPath('sso-state.json');   // under test-results/ (git-ignored): never commit it

  await audit([PROTECTED, '--login-url', PROTECTED, ...SIGN_IN, '-a', state]);   // login + save
  const [step] = await audit([PROTECTED, '-a', state]);                           // no login flags at all
  expect(step.url).toBe(PROTECTED);
});
```
To assert accessibility results too, check `step.new_findings` (for example that a rule you care about reports nothing). The MCP equivalent, with the Playwright MCP client, is in [Session Protocol & Reading the Results](#session-protocol--reading-the-results).

A complete, runnable version of these tests (CLI and MCP) runs against a local fake identity provider on a different origin: see [`tests/regression/login-methods.spec.js`](https://github.com/sclavijosuero/wick-ag-lens/blob/main/tests/regression/login-methods.spec.js) in the repository (the SSO method is one of the five it runs, with the CLI and with MCP). It is the best place to copy patterns from.

**Best practices**
* **Use a dedicated test account** without MFA for automated audits, or sign in by hand once (Recipe C) and reuse the saved session.
* **Keep secrets out of files.** Pass the user name and password through environment variables (as above), never write them in scripts, READMEs or CI logs. Note that `--auth-step` values are visible in the process list while the command runs; for shared machines, prefer a saved session (Recipe C or D) or `--auth-script` reading `process.env`.
* **Never commit saved sessions.** Add `*-state.json` to `.gitignore`; the file contains live cookies.
* **Wait for something, not for time.** End the steps with a `wait::<selector>` on an app-only element instead of a fixed number of milliseconds.
* **Always keep the control test.** If the "not signed in" test ever stops ending on the provider, your protected page is no longer protected (or the provider changed) and the signed-in test proves nothing.
* **Refresh expired sessions.** If a reused session starts landing on the provider again, run the login again with `-a` to replace the file.

---

## Viewing CLI Screenshots

When you use the `-s` flag (or `includeScreenshot: true` in MCP), the snapshot is embedded dynamically after every action (baseline, clicks, etc.) directly in the JSON output under the `screenshot_base64` key.

It is exported as a **raw Base64 string** (e.g., `/9j/4AA...`) without the HTML Data URI prefix. This raw format is intentional, as multimodal AI agents using the MCP server require clean Base64 data without HTML prefixes to process visual inputs.

To view the image manually:
1. **In the Browser:** Open a new tab, type `data:image/jpeg;base64,` into the address bar, paste your raw string immediately after it, and hit Enter.
2. **In HTML Custom Reports:** Prepend the prefix inside an image tag's source attribute: 
   `<img src="data:image/jpeg;base64,[YOUR_RAW_STRING]" alt="Audit Screenshot">`

---

## Handling Enterprise Firewalls & Cookie Banners

Modern enterprise websites often use aggressive bot mitigation (e.g., Akamai), heavy front-end frameworks (e.g., Adobe Experience Manager) with lazy-loaded footers, and intrusive Cookie Consent banners. 

When running a standard headless audit, these protections can result in incomplete scans (missing lazy-loaded elements) or broken CSS selectors (because an injected cookie banner shifts the DOM hierarchy).

WICK-AG-Lens CLI solves this using a **Two-Step State Injection Workflow**. By capturing a human-verified browser state once, you can run perfect, fully-hydrated headless audits indefinitely.

### Step 1: The One-Time Setup (Interactive Mode)
Use the `-i` (interactive) flag to launch a visible browser, and the `-a` (auth-state) flag to specify where to save the session data.

```bash
node index.js audit "https://www.mywebsite.com/main.html" --audits="i-focus-order" -i -a "mywebsite-state.json"
```

1. A Chromium window will open and wait for 30 seconds.
2. Manually click "Accept" or "Decline" on the site's cookie banner (or manually log in past any MFA/Captchas).
3. Wait for the 30-second timer to expire. 
4. The CLI will automatically save your pristine, banner-free session (cookies and local storage) into `mywebsite-state.json`.

### Step 2: Fully Automated Headless Audits
For all future runs (or in your CI/CD pipeline), drop the `-i` flag but keep the `-a` flag pointing to your saved state file.

```bash
node index.js audit "https://www.mywebsite.com/main.html" --audits="i-focus-order" -a "mywebsite-state.json"
```

**What happens under the hood:**
* Playwright runs completely headless at maximum speed.
* It injects your saved cookies before the page loads, preventing the cookie banner from rendering and altering the DOM tree.
* It deletes the `navigator.webdriver` flag to spoof a standard human session.
* It performs an automated top-to-bottom scroll (then back to the top) to force `IntersectionObserver` elements (like heavy footers and widgets) to hydrate before capturing the structural accessibility snapshot.

### Troubleshooting Edge Cases: WAF Sinkholes & SPA Timing
Even with state injection, enterprise sites with aggressive Web Application Firewalls (WAFs) and complex client-side routing can present two unique challenges for headless automation:

**1. Akamai "Sinkholing" (Bot Mitigation)**
Enterprise WAFs (such as Akamai or Cloudflare) sometimes detect subtle headless behaviors. Instead of blocking the connection outright, they "sinkhole" the bot by serving a fake 404 "Page Not Found" screen.
* **Resolution:** Target the **root domain** (e.g., `https://www.example.com/`) rather than a deeply nested regional route (e.g., `/qc/fr.html`). Initializing at the root allows the server to evaluate injected cookies and trigger natural HTTP redirects, authenticating the session and bypassing the sinkhole.

**2. SPA Hydration Timing**
Complex Single Page Applications (SPAs) may momentarily display a skeleton screen or 404 placeholder while client-side routes resolve. If Playwright's `networkidle` lifecycle event resolves during that window, the audit may run against the transient state rather than the fully rendered view.
* **Resolution:** Use the built-in timing options to delay baseline execution until the target component mounts:
  * `--wait-ms <milliseconds>`: Pauses execution after page load to allow dynamic scripts to hydrate.
  * `--wait-for-selector <selector>`: Halts execution until a specific DOM element (e.g., a persistent nav or hero container) is present.

*Example (Waiting for SPA Hydration):*
```bash
node index.js audit https://www.example.com/ --wait-ms 3000 -a "example-state.json"
```

---

## MCP Server & AI Agent Integration

The MCP (Model Context Protocol) Server exposes WICK-AG-Lens tools directly to AI agents (like Claude), allowing them to authenticate, navigate pages, execute full user interactions, and receive delta logs of accessibility barriers created or resolved by their actions. It also pairs seamlessly with external browser automation tools—including Vercel's **`agent-browser`** CLI and the official **Playwright MCP**—via standard session state handoffs.

### Exposed MCP Tools
* `audit_baseline`: Authenticates (if configured) and runs a full baseline scan on a target URL. Supports:
  * **Authentication:** `loginUrl`, shorthand `user`/`pass`, ordered `authSteps` (`[{ action, target, value }]`), `authScript` (custom JS module path), `authState` (path to an existing Playwright/`agent-browser` storageState JSON file; it is only loaded, never written), and `saveAuthState` (path where the session created by the login above is **written**, to be reused later through `authState`; see [Log In Once, Save the Session, Reuse It](#log-in-once-save-the-session-reuse-it-headless)).
  * **Scope & Filtering:** `requestedAudits`, `wcagVersions`, and `wcagLevels`.
  * **Viewport & Timing:** `viewportWidth`, `viewportHeight`, `waitMs`, `waitForSelector`, `includeScreenshot` (Base64 JPEG visual context) and `screenshotQuality` (`1`-`100`, defaults to `70`).
* `interact_and_diff`: Executes a post-baseline interaction (`action`: `"click" | "fill" | "select" | "press" | "hover" | "wait"`, `target`, `value`), waits for the SPA router to settle via the internal double-debounce event, and returns a delta log of `new_findings` and `resolved_findings`. Also supports `requestedAudits`, `wcagVersions`, `wcagLevels`, `includeScreenshot` and `screenshotQuality`.
* `get_audit_trail`: Returns the full chronological Action-State timeline log with `global_summary`, `page_state_maps` (`focus_order`), and `audit_dictionary`.

### Session Protocol & Reading the Results

The server keeps **one stateful browser session**. Call the tools in this order:

1. **`audit_baseline`: always first.** Opens a fresh browser, authenticates if configured, loads the `url` and runs the baseline scan. Calling it again **closes the previous session** and starts a new one.
2. **`interact_and_diff`: zero or more times.** Each call performs one interaction on the page the baseline opened and audits what changed. Interactions never run concurrently. Calling it before a baseline returns an error (`No active baseline found. Please run 'audit_baseline' first.`).
3. **`get_audit_trail`: any time after the baseline.** Returns the whole session so far.

#### What each tool returns

Every tool replies with a single MCP `content` item of `type: "text"` whose `text` is a **JSON string**. Parse `content[0].text` to get the object. If something fails, `isError` is `true` and the text is an error message (with a stack trace) instead of JSON, so check `isError` before parsing.

| Tool | Parsed JSON | Use it for |
| :--- | :--- | :--- |
| `audit_baseline` | The **full trail**: `global_summary`, `audit_trail` (one step), `audit_dictionary`, plus `auth_state` (`{ saved, path, cookies, origins }`, only when `saveAuthState` was passed) | The starting state of the page |
| `interact_and_diff` | **One step object** only: `step`, `interaction`, `url`, `execution_time_ms`, `health_scores`, `new_findings`, `resolved_findings` (+ `page_state_maps`, `screenshot_base64` when requested) | What this interaction broke or fixed. It does **not** repeat earlier steps |
| `get_audit_trail` | The **full trail** again, with every step so far | The complete session, e.g. to write a report |

The full trail has the structure described in [CLI & MCP JSON Output Format](#cli--mcp-json-output-format). Rule descriptions and remediation text live once in `audit_dictionary`: look up a finding's `auditId` there. To keep an agent's context small, leave `includeScreenshot` off unless you need it, and filter with `requestedAudits`, `wcagVersions` and `wcagLevels`.

#### Example: driving the protocol from a Playwright test

This is how the package's own test suite calls the server (see [`tests/regression/audits.spec.js`](https://github.com/sclavijosuero/wick-ag-lens/blob/main/tests/regression/audits.spec.js)). It uses the official MCP SDK client, so it talks to the server exactly as an AI agent would. No Playwright MCP is involved: Playwright is only the test runner.

```js
import { test, expect } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Call a tool and parse the JSON text it returns
async function call(client, name, args) {
  const res = await client.callTool({ name, arguments: args });
  const text = res.content.find((c) => c.type === 'text')?.text ?? '';
  return { isError: !!res.isError, text, json: res.isError ? undefined : JSON.parse(text) };
}

test('baseline -> interact_and_diff -> get_audit_trail', async () => {
  const client = new Client({ name: 'my-tests', version: '1.0.0' });
  await client.connect(new StdioClientTransport({
    command: 'node', args: ['/absolute/path/to/wick-ag-lens/cli/mcp-server.js'],
  }));

  try {
    // 1. Baseline: full trail with a single step
    const baseline = await call(client, 'audit_baseline', {
      url: 'https://example.com/shop', requestedAudits: ['v-empty-buttons'],
    });
    expect(baseline.isError).toBe(false);
    expect(baseline.json.audit_trail).toHaveLength(1);

    // 2. Interact: a single step object containing only what this click changed
    const diff = await call(client, 'interact_and_diff', { action: 'click', target: '#show-more' });
    expect(diff.json.step).toBe(2);
    expect(Object.keys(diff.json.new_findings).length).toBeGreaterThan(0);

    // 3. Trail: the whole session, with the shared rule dictionary
    const trail = await call(client, 'get_audit_trail', {});
    expect(trail.json.audit_trail.map((s) => s.step)).toEqual([1, 2]);
    expect(trail.json.audit_dictionary).toHaveProperty('v-empty-buttons');
  } finally {
    await client.close(); // stops the server and its browser
  }
});
```

### Handling Cookie Banners Dynamically with AI
When building CLI tools for humans, workarounds like 30-second pauses and interactive (`-i`) flags are necessary to handle obstacles like Cookie Consent banners. However, when exposing these same tools via an MCP Server, **the AI becomes the human.** 

If you hook this up to an AI agent that has access to WICK-AG-Lens MCP tools, the AI can handle banners and firewalls dynamically, eliminating the need for manual state injection:

1. **The AI Discovers the Banner (Baseline)**
   The AI calls `audit_baseline`. It inspects the returned JSON (and optional screenshot) and identifies a cookie consent banner blocking the underlying page structure.
2. **The AI Uses the Diff Tool to Clear the Banner**
   The AI dynamically locates the CSS selector for the "Accept Cookies" button (e.g., `#onetrust-accept-btn-handler`) and calls the interaction tool:
   `interact_and_diff(action: "click", target: "#onetrust-accept-btn-handler")`
3. **The Clean State is Achieved**
   Under the hood, WICK-AG-Lens clicks that exact button, waits for the DOM to settle (removing the banner and restoring the page structure), and generates the new accessibility delta snapshot automatically.

### Running & Testing the MCP Server
To test the server locally using the Anthropic MCP Inspector:
```bash
cd cli
npx @modelcontextprotocol/inspector node mcp-server.js
```

To configure in Claude Desktop (or `.mcp.json`), add the following to your `mcpServers` configuration:
```json
{
  "mcpServers": {
    "wick-ag-lens": {
      "command": "node",
      "args": ["/absolute/path/to/wick-ag-lens/cli/mcp-server.js"]
    }
  }
}
```

---

## AI Agent Skill Setup (`SKILL.md`)

WICK-AG-Lens includes a portable, token-efficient **Agent Skill** (`skills/wick-ag-lens/SKILL.md`) that teaches AI coding assistants how to orchestrate **WICK-AG-Lens MCP/CLI**, **`agent-browser`**, and **Playwright MCP** while preventing Base64 screenshot bloat and noisy informative payloads from exhausting context windows.

### How the Skill Routes Tasks
* **Tier 1 — Direct WICK-AG-Lens MCP (Fastest):** Used when target URLs and CSS selectors (including login forms) are known, passing authentication steps directly into `audit_baseline` and chaining `interact_and_diff`.
* **Tier 2 — `agent-browser` CLI + WICK-AG-Lens (Token-Efficient Scouting):** Used in terminal-enabled environments when exploring unfamiliar SPAs—scouting with compact `@e` accessibility snapshots (~70% fewer tokens than Playwright MCP), exporting session state via `agent-browser state save`, and handing off to WICK-AG-Lens for deep DOM delta audits.
* **Tier 3 — Playwright MCP + WICK-AG-Lens MCP (Sandboxed Fallback):** Used in environments without shell access (such as Claude Desktop) when dynamic page discovery is needed before running WICK-AG-Lens audits.

### Option 1: Install via Skills CLI (Recommended)
Run the following command in your project or global environment to install the skill automatically across supported AI tools:
```bash
npx skills add sclavijosuero/wick-ag-lens
```

### Option 2: Copy from the npm Package or Repository
If you installed `wick-ag-lens` via npm, the skill file is bundled directly inside the package at:
```text
node_modules/wick-ag-lens/skills/wick-ag-lens/SKILL.md
```
Copy `SKILL.md` into your AI assistant's skills directory:
* **Claude Code (Global):** `~/.claude/skills/wick-ag-lens/SKILL.md` (or `%USERPROFILE%\.claude\skills\wick-ag-lens\SKILL.md` on Windows)
* **Project-Scoped (Claude Code / Cursor / Copilot / Codex):** `.claude/skills/wick-ag-lens/SKILL.md` or `.agents/skills/wick-ag-lens/SKILL.md`

### Recommended Multi-Tool MCP Configuration
When pairing `wick-ag-lens` with `agent-browser` and Playwright MCP, keep `agent-browser` out of `mcpServers` (it runs via CLI with zero upfront schema tokens) and pass `--caps=core` to Playwright MCP to minimize tool schema overhead:
```json
{
  "mcpServers": {
    "wick-ag-lens": {
      "command": "npx",
      "args": ["-y", "--package=wick-ag-lens", "wick-mcp"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--headless", "--caps=core"]
    }
  }
}
```
*(In VS Code, you can run this directly via the **Claude Code** extension or integrated terminal without needing the web console, and inspect exact token usage per MCP server and skill using `/context` or `/cost`.)*

---

## Integrating with `agent-browser` & Playwright MCP

### Integrating with `agent-browser` (Token-Efficient AI Scouting)
[`agent-browser`](https://agent-browser.dev/) is an open-source browser automation CLI built for AI agents that reads the browser's accessibility tree and outputs compact text snapshots with short element references (such as `@e1`), cutting LLM token consumption significantly compared to raw DOM dumps.

Because `agent-browser` operates on the **accessibility tree** while WICK-AG-Lens inspects the **full raw HTML/CSS DOM**, the two tools complement each other in a bidirectional AI workflow:

1. **Scout & Session Handoff (`agent-browser` → WICK-AG-Lens):**
   * **Lightweight Navigation & Auth Protocols:** An AI agent uses `agent-browser` (`open`, `snapshot -i`, `click @e1`, `fill @e2 "..."`), `agent-browser auth login <profile>` (AES-256-GCM encrypted credential vault), or `agent-browser --auto-connect` (attaching to an already-authenticated Chrome session) to bypass complex login flows using minimal tokens.
   * **Zero-Conversion State Sharing:** Running `agent-browser state save auth-state.json` exports a standard Playwright `storageState` JSON file (cookies and `localStorage`). It is a file hand-over between two separate browsers: `sessionStorage` is not included (see [what the handoff covers](#what-the-handoff-covers-and-what-it-does-not)).
   * **Deep DOM Audit:** The AI passes `auth-state.json` directly into WICK-AG-Lens via the CLI (`-a auth-state.json`) or MCP (`audit_baseline` with `authState: "auth-state.json"`) to run all 55 heuristic DOM/CSS audits without repeating the login flow.

2. **Accessibility Blind-Spot Resolution (WICK-AG-Lens → `agent-browser`):**
   * Because `agent-browser` relies on semantic roles and accessible names to generate `@e` tags, poorly coded interactive controls (such as `<div onclick="...">` without a `role`, or unlabeled inputs) are ambiguous in its snapshots (a clickable `<div>` is listed only as a generic "clickable", never as a button).
   * When an agent gets stuck because a control is missing from `agent-browser`'s accessibility snapshot, it can invoke WICK-AG-Lens on that URL. WICK-AG-Lens inspects the raw DOM and returns the exact CSS `selector` and `htmlSnippet` of the inaccessible element (e.g., `v-unfocusable` or `v-unlabeled-inputs`), allowing the AI to target the raw selector and unblock the workflow.

**Example Workflow (`agent-browser` + WICK-AG-Lens):**
```bash
# 1. Authenticate via AI scouting (or `agent-browser auth login my-app`)
agent-browser open https://shop.example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "jdoe@example.com"
agent-browser fill @e2 "SuperSecret123"
agent-browser click @e3
agent-browser wait --url "**/dashboard"

# 2. Export authenticated session state (cookies & localStorage)
agent-browser state save auth-state.json

# 3. Hand off session state to WICK-AG-Lens CLI (or pass authState to MCP audit_baseline)
node index.js audit "https://shop.example.com/dashboard" \
  -a auth-state.json \
  --wcag-version="2.0,2.1" \
  --wcag-level="A,AA"
```

### Integrating with Third-Party Playwright MCP Servers
If your AI agent uses a general-purpose browser automation MCP server (such as the official `@playwright/mcp`) in environments without shell access, you can orchestrate the same session handoff between the two MCP servers:

1. **The Navigation Agent (Playwright MCP):** Your AI uses Playwright MCP to navigate the web, bypass captchas, log into complex portals, and establish the session state.
2. **State Sharing:** The AI instructs Playwright MCP to export the current browser session state (`cookies` and `localStorage`) to a file (e.g., `state.json`).
3. **The Audit Agent (WICK-AG-Lens MCP):** The AI calls `wick-ag-lens:audit_baseline`, passing `authState: "state.json"`. WICK-AG-Lens boots its own headless Playwright instance, injects the cookies, and runs the audit on the exact page the first agent left off on.

**Example Handoff Workflow (MCP):**
* *AI Action 1 (Playwright MCP):* `browser_navigate(url: "https://shop.example.com")`
* *AI Action 2 (Playwright MCP):* Authenticate and export storage state to `state.json`.
* *AI Action 3 (WICK-AG-Lens MCP):* `audit_baseline(url: "https://shop.example.com/dashboard", authState: "state.json")`

---

## CLI & MCP JSON Output Format

When executing WICK-AG-Lens programmatically via the Headless CLI or consuming it as an AI agent through the MCP Server, the output is generated as a structured JSON payload. This payload provides a complete historical timeline of the session, tracking the accessibility state across multiple pages, interactions, and DOM mutations.

The root JSON object contains four properties: `timestamp` (when the report was produced), `global_summary`, `audit_trail`, and `audit_dictionary`.

### 1. `global_summary`
A high-level rollup of the **active, unresolved issues** remaining on the page at the exact moment the final step concluded (deduplicated so persistent issues across steps are never double-counted).

### 2. `audit_dictionary`
To drastically reduce JSON bloat across multi-step journeys, repetitive metadata for each audit rule (such as the rule's descriptive label, "what/why/fix" instructions, WCAG tags, and official WCAG reference links) is extracted into this single root-level dictionary placed at the bottom of the JSON payload. 
The timeline steps reference these rules solely by their `auditId` (e.g., `v-doc-title`), which you can look up in this dictionary to retrieve the full educational context and remediation steps.

Each entry's `info` also says how reliable the audit's detection is:
* `detection`: one of `"rule"` (a defined rule applied to the page's elements and attributes), `"pattern"` (a clear rule that relies on a fixed pattern such as a word list or an attribute, so it can miss variations) or `"best-effort"` (an approximation that can report false positives or miss real problems). Always present.
* `detection_note`: the audit's known limit in plain text. Empty for `"rule"` audits.

Treat findings from `"pattern"` and `"best-effort"` audits as candidates to confirm, and do not read an empty result from them as proof the page is clean. The same levels appear in the Detection column of the [audit tables](../README.md#audit-library--ruleset) and in the Chrome extension.

### 3. `audit_trail` (The Timeline Steps)
An array of objects representing every state-change in the automated session. Each object in this array is referred to as a "step". 

* **Step 1 is always the Baseline Scan.** It represents the state of the DOM immediately after navigating to the target URL and letting initial hydration finish.
* **Steps 2+ are Delta Diffs.** They represent the isolated structural changes to the page's accessibility caused by a specific user interaction (like clicking a menu, filling a form, or pressing a key).

#### Understanding a Step Object
Each step in the `audit_trail` contains:
* `step`: The integer sequence number.
* `interaction`: An object detailing the action that triggered the state change (`action`, `selector`, and optional `value`). For Step 1, this defaults to `"navigate" : "Initial Page Load"`.
* `url`: The active URL of the page when the snapshot was taken (crucial for tracking multi-page SPA routes).
* `execution_time_ms`: How long the step took to settle and audit.
* `screenshot_base64`: A raw Base64 JPEG string (JPEG quality `70` by default; set it with `-q` / `screenshotQuality`) of the visual viewport (the key is present **only** when `-s` / `includeScreenshot: true` is passed; without it the key is omitted to keep the JSON small).
* `health_scores`: A point-in-time snapshot of the active violation counts specifically at that step.
* `page_state_maps`: Optional state snapshots (such as `focus_order` when `i-focus-order` is enabled) isolated from delta math so full tab sequences remain intact without inflating violation counts.
* `new_findings`: Grouped accessibility violations and informative elements that were **not present** in the previous step but appeared as a result of the interaction.
* `resolved_findings`: Grouped accessibility violations and informative elements that **were present** in the previous step but disappeared as a result of the interaction.

---

### The Delta-Diff: `new_findings` VS `resolved_findings`
The core power of the WICK-AG-Lens CLI is its ability to perform **structural DOM diffing**. When you pass an interaction flag (like `--step "click::button#open-menu"`), the engine doesn't just run a brand-new, isolated scan. It compares the new DOM against the previous state and splits the results into two critical buckets:

#### `new_findings` (Things that broke or appeared)
This object lists elements that became newly visible or were dynamically injected into the DOM during this step. 
* *Example:* If you click `#open-menu` and the dropdown contains links missing `aria-label`s, those specific failing links will appear in `new_findings`.
* *Note:* Even if a page has 50 existing contrast errors from the baseline scan, they **will not** be repeated here. This bucket only contains the delta of *new* violations caused by opening the menu.

#### `resolved_findings` (Things that were fixed or hidden)
This object lists elements that were present in the previous step but are no longer active, visible, or failing in the current step. 
* *Example:* If Step 3 clicks `#close-modal`, all the accessibility violations that existed inside that modal will be recorded in `resolved_findings` because closing the modal successfully removed them from the active accessibility tree.
* *AI Agent Usage:* For AI agents trying to fix code iteratively via the MCP server, seeing violations appear in `resolved_findings` after applying a patch confirms the fix was successful.

#### Audit Node Counters
Inside both the `new_findings` and `resolved_findings` buckets, audits are grouped by Category (e.g., "Images & Media"). Each audit node contains two integer counters to help CI/CD pipelines quickly parse the diff size without iterating through the raw CSS selectors:
* `totalElemsNew`: The count of newly introduced elements for this specific rule during this step.
* `totalElemsResolved`: The count of previously existing elements for this specific rule that were cleared during this step.

---

### Complete Example (With `i-focus-order`, Deltas & Generating Options)

#### Options Used to Generate This Output
* **CLI Command:**
  ```bash
  node index.js audit "https://example.com" \
    --audits "v-doc-title,v-empty-buttons,i-focus-order" \
    --wcag-version "2.0,2.1" \
    --wcag-level "A,AA" \
    --step "click::button#open-modal" \
    -s
  ```

* **Equivalent MCP Tool Calls:**
  1. `audit_baseline`:
     ```json
     {
       "url": "https://example.com",
       "requestedAudits": ["v-doc-title", "v-empty-buttons", "i-focus-order"],
       "wcagVersions": ["2.0", "2.1"],
       "wcagLevels": ["A", "AA"],
       "includeScreenshot": true
     }
     ```
  2. `interact_and_diff`:
     ```json
     {
       "action": "click",
       "target": "button#open-modal",
       "requestedAudits": ["v-doc-title", "v-empty-buttons", "i-focus-order"],
       "wcagVersions": ["2.0", "2.1"],
       "wcagLevels": ["A", "AA"],
       "includeScreenshot": true
     }
     ```

#### Resulting JSON Output
```json
{
  "timestamp": "2026-11-22T20:50:00.000Z",
  "global_summary": {
    "Critical": 1,
    "Serious": 0,
    "Moderate": 0,
    "Minor": 0,
    "Manual": 0,
    "Informative": 0
  },
  "audit_trail": [
    {
      "step": 1,
      "interaction": {
        "action": "navigate",
        "selector": "Initial Page Load"
      },
      "url": "https://example.com/",
      "execution_time_ms": 42,
      "screenshot_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//...",
      "health_scores": {
        "Critical": 1,
        "Serious": 0,
        "Moderate": 0,
        "Minor": 0,
        "Manual": 0,
        "Informative": 0
      },
      "page_state_maps": {
        "focus_order": {
          "auditId": "i-focus-order",
          "audit": "Display Focus Order",
          "totalElems": 3,
          "elements": [
            {
              "selector": "header > nav > a.home-link",
              "htmlSnippet": "<a class=\"home-link\" href=\"/\">Home</a>",
              "issueText": "#1: <a>",
              "legend": "Focus Order"
            },
            {
              "selector": "main > button#open-modal",
              "htmlSnippet": "<button id=\"open-modal\">Account Settings</button>",
              "issueText": "#2: <button>",
              "legend": "Focus Order"
            },
            {
              "selector": "footer > a.privacy-link",
              "htmlSnippet": "<a class=\"privacy-link\" href=\"/privacy\">Privacy Policy</a>",
              "issueText": "#3: <a>",
              "legend": "Focus Order"
            }
          ]
        }
      },
      "new_findings": {
        "Violations & Warnings": {
          "Structure & Document": [
            {
              "auditId": "v-doc-title",
              "audit": "Document Title",
              "severity": "Critical",
              "totalElemsNew": 1,
              "elements": [
                {
                  "selector": "html",
                  "htmlSnippet": "<html lang=\"en\"> ... </html>",
                  "issueText": "Missing Document Title",
                  "legend": "Violation"
                }
              ]
            }
          ]
        }
      },
      "resolved_findings": {}
    },
    {
      "step": 2,
      "interaction": {
        "action": "click",
        "selector": "button#open-modal"
      },
      "url": "https://example.com/",
      "execution_time_ms": 28,
      "screenshot_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//...",
      "health_scores": {
        "Critical": 1,
        "Serious": 0,
        "Moderate": 0,
        "Minor": 0,
        "Manual": 0,
        "Informative": 0
      },
      "page_state_maps": {
        "focus_order": {
          "auditId": "i-focus-order",
          "audit": "Display Focus Order",
          "totalElems": 4,
          "elements": [
            {
              "selector": "header > nav > a.home-link",
              "htmlSnippet": "<a class=\"home-link\" href=\"/\">Home</a>",
              "issueText": "#1: <a>",
              "legend": "Focus Order"
            },
            {
              "selector": "main > button#open-modal",
              "htmlSnippet": "<button id=\"open-modal\">Account Settings</button>",
              "issueText": "#2: <button>",
              "legend": "Focus Order"
            },
            {
              "selector": "div.modal-body > button.close",
              "htmlSnippet": "<button class=\"close\"></button>",
              "issueText": "#3: <button>",
              "legend": "Focus Order"
            },
            {
              "selector": "footer > a.privacy-link",
              "htmlSnippet": "<a class=\"privacy-link\" href=\"/privacy\">Privacy Policy</a>",
              "issueText": "#4: <a>",
              "legend": "Focus Order"
            }
          ]
        }
      },
      "new_findings": {
        "Violations & Warnings": {
          "Forms & Controls": [
            {
              "auditId": "v-empty-buttons",
              "audit": "Empty Buttons",
              "severity": "Critical",
              "totalElemsNew": 1,
              "elements": [
                {
                  "selector": "div.modal-body > button.close",
                  "htmlSnippet": "<button class=\"close\"></button>",
                  "issueText": "Empty Button",
                  "legend": "Violation"
                }
              ]
            }
          ]
        }
      },
      "resolved_findings": {
        "Violations & Warnings": {
          "Structure & Document": [
            {
              "auditId": "v-doc-title",
              "audit": "Document Title",
              "severity": "Critical",
              "totalElemsResolved": 1,
              "elements": [
                {
                  "selector": "html",
                  "htmlSnippet": "<html lang=\"en\"> ... </html>",
                  "issueText": "Missing Document Title",
                  "legend": "Violation"
                }
              ]
            }
          ]
        }
      }
    }
  ],
  "audit_dictionary": {
    "v-doc-title": {
      "auditLabel": "Document Title",
      "info": {
        "what": "Checks if the document is missing a <title> tag or if it is empty.",
        "why": "Screen readers announce the page title first when a user navigates to a page.",
        "fix": "Add a descriptive, non-empty <title> element inside the document <head>.",
        "wcag_levels": ["2.0 A"],
        "wcag_references": [
          {
            "url": "https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html",
            "title": "WCAG 2.4.2: Page Titled"
          }
        ]
      }
    },
    "v-empty-buttons": {
      "auditLabel": "Empty Buttons",
      "info": {
        "what": "Flags buttons without readable text or an accessible name.",
        "why": "Screen readers will only announce 'Button', providing no context for its action.",
        "fix": "Provide descriptive inner text, an aria-label, or an aria-labelledby attribute.",
        "wcag_levels": ["2.0 A"],
        "wcag_references": [
          {
            "url": "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
            "title": "WCAG 4.1.2: Name, Role, Value"
          }
        ]
      }
    },
    "i-focus-order": {
      "auditLabel": "Display Focus Order",
      "info": {
        "what": "Traces and numbers the natural sequential path of focusable elements.",
        "why": "Simulates the exact path of the TAB key route across main documents and iframes.",
        "fix": "Ensure interactive elements follow a logical visual and DOM reading sequence.",
        "wcag_levels": ["2.0 A"],
        "wcag_references": [
          {
            "url": "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html",
            "title": "WCAG 2.4.3: Focus Order"
          }
        ]
      }
    }
  }
}
```
---

## Sample Pages (Try It Without a Server)

The package ships two small, self-contained **journey pages** (no network access, no server needed) so you can try every audit and every `--step` action in seconds. They are installed with the package, in `samples/`, next to a tiny sample login server and a login script (see the end of this section):

| Page | Shows |
| :--- | :--- |
| `samples/steps-demo.html` | **Every step action**, each producing a different, small diff: `click`, `fill`, `select`, `hover`, `press` (with a selector and with `active`) and `wait` (a selector and milliseconds). |
| `samples/shop-journey.html` | A **9-step journey** with violations and structural results that appear, stay, get resolved, and reappear; the focus order changes at nearly every step. |

**Open them with a `file:///` URL.** From the folder where the package is installed:
```bash
# prints something like file:///.../node_modules/wick-ag-lens/samples/steps-demo.html
node -p "require('url').pathToFileURL(require.resolve('wick-ag-lens/samples/steps-demo.html')).href"
```

**Every step action in one run** (`steps-demo.html`):
```bash
npx wick-ag-lens audit "<file URL of steps-demo.html>"   --audits "v-empty-buttons,v-aria-invalid,v-unlabeled-inputs,v-empty-links,v-missing-alt,v-generic-link,i-focus-order"   --step "click::#open-panel"   --step "fill::#email::not-an-email"   --step "fill::#email::jdoe@example.com"   --step "select::#country::US"   --step "hover::#help"   --step "press::#search::Enter"   --step "wait::.toast"   --step "wait::300"   --step "press::active::Tab"   --step "press::active::Escape"   -s > steps-report.json
```
What each step reports (the audits above, every other result is unchanged):

| Step | Action | New | Resolved |
| :-- | :-- | :-- | :-- |
| 1 | page load | nothing (a clean page, 3 tab stops) | |
| 2 | `click::#open-panel` | Empty Button `#panel-close` | |
| 3 | `fill::#email::not-an-email` | Invalid ARIA State `#email` | |
| 4 | `fill::#email::jdoe@example.com` | | Invalid ARIA State `#email` |
| 5 | `select::#country::US` | Unlabeled Input `#state` | |
| 6 | `hover::#help` | Empty Link `#help-link` | |
| 7 | `press::#search::Enter` | Missing Alt Text `#result-img` | |
| 8 | `wait::.toast` | Generic Link Text `#toast-link` (the toast mounts a few seconds after the search) | |
| 9 | `wait::300` | nothing | |
| 10 | `press::active::Tab` | nothing (only moves the focus) | |
| 11 | `press::active::Escape` | | Empty Button `#panel-close`, Unlabeled Input `#state` (the panel closes) |

Open `steps-report.json` in the [report viewer](#visual-html-report-viewer) to see these steps, their screenshots and the focus order. Add `?late=1` to the URL and `--wait-for-selector ".recommendations-ready"` to try the SPA-hydration example from [Usage Example 7](#7-single-page-application-spa-hydration--targeted-rules): the widget only mounts after about four seconds.

**Behind a login, with every tool.** The package also ships a tiny sample server (`node samples/server.mjs`) that serves the same `steps-demo.html` publicly and behind a sign-in page. [docs/sample-journeys.md](docs/sample-journeys.md) runs that one journey with **no login and with each login method**, through the **CLI, MCP and agent-browser**, so you can compare them side by side.

The same pages are the base of the package's automated tests (see [`tests/README.md`](../tests/README.md) in the repository), which assert the exact findings of every step above.

---

## Visual HTML Report Viewer

The package ships a self-contained, offline viewer that turns the JSON output into a browsable report (step timeline, severity filters, search, per-element details). It is a single HTML file with no dependencies; the JSON is read locally in your browser and is never uploaded.

**Where to find it** (included in the npm package and tarball):

| Install type | Path |
| :--- | :--- |
| Local install | `node_modules/wick-ag-lens/report-template/wick-ag-lens-viewer.html` |
| Global install | `<npm root -g>/wick-ag-lens/report-template/wick-ag-lens-viewer.html` (run `npm root -g` to get the folder) |
| Source repo | `cli/report-template/wick-ag-lens-viewer.html` |

**How to use it:**
1. Save an audit to a file. Progress lines (`[Audit] ...`) printed before the JSON are ignored by the viewer, so plain redirection works:
   ```bash
   npx wick-ag-lens audit "https://example.com" --step "click::#menu" > report.json
   ```
   For MCP, save the JSON returned by `get_audit_trail` to a `.json` file.
2. Open `wick-ag-lens-viewer.html` in any browser (double-click it, or use a `file:///` URL).
3. Drag `report.json` onto the page, or click **Open JSON file**.

When first opened, the viewer waits for a file (drag & drop area):

![WICK-AG-Lens report viewer, empty state with the drag and drop area](./assets/images/report-viewer-empty.png)

Once a report is loaded, it shows the step timeline, severity filters, search and per-element details:

![WICK-AG-Lens report viewer with an audit report loaded](./assets/images/report-viewer-loaded.png)

The viewer also has a dark theme (toggle it with the **Theme** button):

![WICK-AG-Lens report viewer with an audit report loaded, dark theme](./assets/images/report-viewer-loaded-dark.png)

> Any file containing an `audit_trail` array is accepted.

---

## CLI & MCP Limitations & Technical Bounds

*(For core DOM engine bounds shared across both environments, see [Shared Limitations & Technical Bounds](../README.md#shared-limitations--technical-bounds)).*

* **WAF Mitigation & Bot Sinkholes:** Because the CLI utilizes Headless Playwright, aggressive enterprise Web Application Firewalls (like Akamai or Cloudflare) may flag the automated session and serve a dummy 404 page. Overcoming this requires utilizing the State Injection feature (`-a` / `authState`) to pass pre-authenticated, human-verified cookies (or cookies exported from `agent-browser state save`).
* **Synchronous Step Execution:** Unlike the visual extension which handles erratic, asynchronous human clicking via a persistent `750ms` debounce timer, the CLI executes interaction steps (`--step`) in a strictly synchronous, blocking pipeline. It will not execute Step 2 until Step 1 has fully settled and completed its accessibility delta-diff.
* **Cross-Origin Iframe Interactions:** While the WICK engine can successfully audit the *DOM* of cross-origin iframes, Playwright's strict execution context prevents the generic `--step` interaction flags (like `click::iframe-button`) from targeting elements deeply nested inside cross-origin sandbox frames without writing a custom `--auth-script` escape.
* **JSON Payload Size (Screenshots):** Using the `-s` (`includeScreenshot: true`) flag encodes a full `1280x800` layout into a raw Base64 string at every single step. In multi-step user journeys (e.g., 10+ steps), this can dramatically bloat the final JSON file size and increase LLM token usage in AI workflows.