# Tests (dev only — never published)

Playwright Test suite for the `wick-ag-lens` npm package. Lives at the repo root, outside
`cli/` and `extension/`, and `cli/package.json#files` is a whitelist, so nothing here ships.
`tests/package/contents.spec.js` enforces that.

```
npm run setup          # one-time: root deps + cli deps + chromium
npm test               # builds (pretest), then runs everything
npm run test:cli | test:mcp | test:package | test:viewer | test:agent-browser
npm run test:auth      # only the @auth tests (CLI + MCP + viewer + agent-browser handoff; the Abi ones stay skipped)
npm run test:a11y-auth # accessibility audits behind each login method
npm run test:journey   # the multi-step journeys (no login)
npm run test:samples   # the pages shipped in the package, every step type
npm run test:sample-journeys # the shipped sample journey, with and without login, in each tool
npm run test:sso       # only the @sso tests (login through a redirect to another origin)
npm run test:live      # only the opt-in live checks against Abi's Testing Dojo (needs internet)
npm run test:live -- --ui   # same, in the Playwright UI
npm run test:ui        # interactive Playwright UI (the Abi live tests are listed but skipped)
npm run test:ui:all    # same UI with WICK_LIVE=1: EVERYTHING runs, including the live tests (needs internet)
npm run test:agent-browser   # only the agent-browser project
npx playwright show-report
npm run pack:tarball   # builds and writes dist/wick-ag-lens-<version>.tgz
```

## What runs what

Tests are selected in two independent ways: by **project** (which folder under `tests/`) and by **tag** (a label in the
test file, e.g. `@auth`). The scripts below are just shortcuts for `npx playwright test` with those options.

### The test groups

| Group | Tag | What it answers | Runs through |
| :-- | :-- | :-- | :-- |
| **Authentication only** | `@auth` (+ `@sso`) | Does each documented way to log in work? No accessibility result is the point. | CLI, MCP, agent-browser handoff |
| **Accessibility behind a login** | `@a11y-auth` | Does the SAME accessibility journey give the SAME findings whatever the login method? (See [how it differs from `@sample-journeys`](#a11y-auth-or-sample-journeys).) | CLI and MCP (5 login methods each), agent-browser session |
| **Sample journeys** | `@sample-journeys` | The packaged sample page (every step type) with no login and with each login method: do the CLI, MCP and agent-browser give the same result? Side by side in `cli/docs/sample-journeys.md`. | CLI, MCP, agent-browser |
| **Journeys** | `@journey` | Does a 9-step journey report the right new, resolved and persisting findings and focus order at every step? No login. | CLI, MCP, viewer, agent-browser (public page) |
| **Samples** | `@samples` | Do the pages shipped in the package work, and does every `--step` action (click, fill, select, hover, press, wait) give its diff? Plus the README examples. | CLI, MCP, viewer, package |
| **agent-browser** | `@agent-browser` | The real `agent-browser` CLI: login handoff, state file format, blind-spot comparison, scouting. | agent-browser |

The side-by-side guide to the login methods, with the same scenario for each one, is
[`cli/docs/auth-examples.md`](../cli/docs/auth-examples.md) (shipped in the package). The findings expected at every step
are frozen in `helpers/references.js` (counts, types, new and resolved), so a change in the audits or the diff shows up as a
precise failure.

### `@a11y-auth` or `@sample-journeys`?

They overlap on purpose, but they answer different questions. **`@sample-journeys` is about *what* is tested** (the page and examples that ship in the package); **`@a11y-auth` is about *what kind* of test it is** (an accessibility audit behind a login, on any page).

| | `@sample-journeys` | `@a11y-auth` |
| :-- | :-- | :-- |
| Question it answers | Do the packaged examples work, and do CLI, MCP and agent-browser give the same result? | Do the audit results stay the same whatever the login method? |
| Page | The shipped `steps-demo.html`, served by the shipped `server.mjs` | The shipped sample **and** the 9-step shop journey on the test-only fixture server (`/app/journey.html`) |
| No-login run | Yes | No (it is not an auth test) |
| Login methods | 1, 2, 3, 5 | 1, 2, 2 (SSO), 3, 5 |
| `cli/a11y-auth`, `mcp/a11y-auth`, `agent-browser/journey` | No | Yes |
| Viewer "authenticated audit" | No | Yes |
| Login blocks of `*/sample-journeys` | Yes | Yes (the overlap) |
| Run it with | `npm run test:sample-journeys` | `npm run test:a11y-auth` |

Rule of thumb: check the examples users will copy with `@sample-journeys`; check that a login never changes the audit with `@a11y-auth`; check only that logging in works with `@auth`.

### Scripts

| Script | What it runs |
| :-- | :-- |
| `npm test` | Builds first, then **every** test in all projects. The `@live` tests are skipped unless `WICK_LIVE` is set. |
| `test:cli` / `test:mcp` / `test:package` / `test:viewer` / `test:agent-browser` | One project (one folder), whatever the tags. |
| `test:auth` | Everything tagged `@auth`: authentication only, CLI, MCP, SSO and the agent-browser handoff. The `@live` ones stay skipped. |
| `test:a11y-auth` | Everything tagged `@a11y-auth`: the same accessibility journey through each login method (CLI and MCP), and with a session saved by agent-browser. |
| `test:journey` | Everything tagged `@journey`: the 9-step shop journey through CLI, MCP, the viewer and agent-browser (with and without a login). |
| `test:sample-journeys` | Everything tagged `@sample-journeys`: the shipped sample journey with no login and each login method, through CLI, MCP and agent-browser. |
| `test:samples` | Everything tagged `@samples`: the pages shipped in the package, every step action, and the README examples. |
| `test:sso` | Only `@sso`: the CLI and MCP single-sign-on tests. |
| `test:live` | Sets `WICK_LIVE=1` and runs only `@live`: the Abi's Testing Dojo tests (internet needed). |
| `test:ui` | Opens the Playwright UI listing everything. The `@live` tests are listed but skipped. |
| `test:ui:all` | Same UI with `WICK_LIVE=1`: **everything** runs, including `@live`. |

### Tags

| Tag | Where it is used | Notes |
| :-- | :-- | :-- |
| `@auth` | `cli/auth`, `mcp/auth`, `cli/sso`, `mcp/sso`, `cli/auth-live-abi`, `agent-browser/handoff-cli`, `agent-browser/handoff-mcp` | Logging in; authentication mechanics. |
| `@a11y-auth` | `cli/a11y-auth`, `mcp/a11y-auth`, `agent-browser/journey`, `agent-browser/sample-journeys`, `cli/sample-journeys`, `mcp/sample-journeys`, the last `describe` of `viewer/viewer-via-cli` | An accessibility audit behind a login (everything except the pure-login tests of `@auth`): the same journey behind each login method. See [`@a11y-auth` or `@sample-journeys`?](#a11y-auth-or-sample-journeys). Login methods are defined once in `helpers/login-matrix.js`. |
| `@journey` | `cli/journey`, `mcp/journey`, `viewer/journey-viewer`, `agent-browser/journey`, `agent-browser/journey-public` | The 9-step shop journey; expectations shared in `helpers/journey-suite.js`. |
| `@sample-journeys` | `cli/sample-journeys`, `mcp/sample-journeys`, `agent-browser/sample-journeys` | The packaged sample journey (every step type) with no login and with each login method, in each tool, for 1-to-1 comparison. Logins defined once in `helpers/sample-journeys.js`; documented in `cli/docs/sample-journeys.md`. See [`@a11y-auth` or `@sample-journeys`?](#a11y-auth-or-sample-journeys). |
| `@samples` | `cli/samples`, `mcp/samples`, `viewer/samples-viewer`, `package/samples`, `cli/sample-journeys`, `mcp/sample-journeys`, `agent-browser/sample-journeys` | The pages shipped in `cli/samples/`. |
| `@sso` | `cli/sso`, `mcp/sso` | Login through a redirect to another origin. Also tagged `@auth`. |
| `@live` | `cli/auth-live-abi` | Real public site. Skipped unless `WICK_LIVE=1`. Also tagged `@auth`. |
| `@agent-browser` | all files in `agent-browser/` | Needs the `agent-browser` dev dependency. Slowest tests (10-30 s each). |
| `@docs` | `package/docs-commands`, `package/tags-doc` | Check that the documented commands, flags, tags, scripts and environment variables exist. |
| *(no tag)* | `cli/audit`, `cli/focus-order`, `cli/aria-hidden`, `cli/frames-and-shadow`, `cli/wcag-filters`, `mcp/wcag-filters`, `mcp/server`, `package/contents`, and the rest of `viewer/viewer-via-cli` | Core behaviour of the audits, the MCP tools, the viewer and the package contents. |

### Combining tags and projects

`--grep` takes a regular expression, `--grep-invert` removes matches, and `--project` limits the folders. They combine
with each other. Add `--ui` to any of them to use the Playwright UI, and `--list` to see what would run without running it.
(In bash, keep the quotes around expressions that contain `|`.)

| Goal | Command | Tests |
| :-- | :-- | :-- |
| Auth, without the slow agent-browser ones | `npx playwright test --grep @auth --grep-invert @agent-browser` | 45 |
| Auth, without agent-browser or live | `npx playwright test --grep @auth --grep-invert "@agent-browser\|@live"` | 42 |
| Auth **or** docs | `npx playwright test --grep "@auth\|@docs"` | 60 |
| Auth through the CLI only | `npx playwright test --project=cli --grep @auth` | 24 |
| SSO through CLI and MCP | `npx playwright test --project=cli --project=mcp --grep @sso` | 10 |
| Everything except agent-browser and live (fast CI run) | `npx playwright test --grep-invert "@agent-browser\|@live"` | 381 |
| Only the agent-browser tests | `npm run test:agent-browser` or `--grep @agent-browser` | 131 |
| Accessibility journeys through every login method | `npm run test:a11y-auth` | 231 |
| Multi-step journeys (CLI, MCP, viewer, agent-browser) | `npm run test:journey` | 87 |
| Packaged sample pages | `npm run test:samples` | 256 |
| Sample journeys: every step type, each login method, CLI, MCP and agent-browser | `npm run test:sample-journeys` | 213 |
| One test by name | `npx playwright test --grep @sso -g "wrong password"` | 1-2 |

The counts were checked with `--list` when this was written and will change as tests are added. `@live` tests need
`WICK_LIVE=1` to run (it is set for you by `test:live` and `test:ui:all`); with the plain `npx playwright test` they are
listed but skipped.

When you add a test, give it a tag only if it belongs to one of these groups, and update the Tags table above.
`package/tags-doc.spec.js` (tag `@docs`) fails if a tag, an npm test script or an environment variable used by the tests is
missing from this README, or if a documented tag is no longer used.

## What the tests verify

Each row says what is checked and gives examples. Which tag selects which tests is in [What runs what](#what-runs-what).

| Area | What it verifies | Examples |
| :-- | :-- | :-- |
| **CLI: audits** (`cli/audit`) | The headless CLI end to end: flags, rule results and multi-step delta reporting. | Known violations are reported on an inaccessible page and **none** on an accessible one; `--audits` limits the rules; `--step click::#btn` reports only the *new* findings; `-s` embeds a valid JPEG per step. |
| **CLI: focus order** (`cli/focus-order`) | `i-focus-order` maps the exact Tab sequence, as a full snapshot at every step. | A step that reveals a control re-maps the whole sequence (4 stops, then 5); only stops the Tab key can reach are listed (no `display:none`, `inert`, `input[type=hidden]` or `tabindex="-1"`). |
| **CLI: `v-aria-hidden-focus`** (`cli/aria-hidden`) | The rule flags only controls a keyboard user can really reach inside `aria-hidden`. | Flags `button`, `a[href]`, `contenteditable`, `summary` and `tabindex="0"`; skips `tabindex="-1"`, disabled, `inert` and non-rendered controls; sees through shadow hosts. |
| **CLI: frames and shadow DOM** (`cli/frames-and-shadow`) | Findings and focus order cross iframe and shadow boundaries. | The focus order numbers frame content like the extension (`[Iframe] #2.1`, `[Nested] #2.2.1`); violations are found in a child and a nested grandchild frame, and inside open shadow roots. |
| **WCAG filters** (`cli/wcag-filters`, `mcp/wcag-filters`) | `--wcag-version` / `--wcag-level` (MCP: `wcagVersions` / `wcagLevels`) behave like the extension's checkboxes, **per legend**: text contrast (AA fail / AAA fail), touch targets (small / medium / large) and language of parts. | On one page with an element for each legend, the legends reported match, for six version/level combinations, what the extension's own rule shows (`helpers/wcag.js` applies it to the core config). E.g. 2.0 + 2.1 with A + AA keeps "AA Fail" and drops "AAA Fail". |
| **MCP** (`mcp/server`) | The MCP server over stdio, driven by the official MCP SDK client (the same wire protocol an AI agent uses; Playwright is only the runner). | The expected tools are listed; the full `audit_baseline` → `interact_and_diff` → `get_audit_trail` session returns the documented JSON; `interact_and_diff` without a baseline is an error. |
| **Authentication only** (`@auth`, `@sso`) | Every documented way to log in, through the CLI flags and the MCP arguments, against a local fake login system. No accessibility result is the point. | `-u`/`-p`; a company + user + password pipeline (`--auth-step`); an SSO-style flow through an identity provider on another origin; `--auth-script`; saved state (`-a` / `authState`) from Playwright and from `agent-browser`; saving the session headlessly; wrong password and expired state do **not** log in. |
| **Accessibility behind a login** (`@a11y-auth`) | The **same** accessibility journey gives the **same** findings whatever the login method. | One run per method (CLI and MCP), the same expectations in each block, so the blocks can be compared. |
| **Journeys** (`@journey`) | A 9-step journey reports the right new, resolved and persisting findings, and the right focus order, at every step. | Through CLI, MCP, the viewer, and agent-browser (public page); the findings per step are frozen in `helpers/references.js`. |
| **Samples** (`@samples`, `@sample-journeys`) | The pages shipped in the package work, and every `--step` type (click, fill, select, hover, press, wait) gives its diff. | The README CLI examples (3, 5, 6, 7, 8) run against the samples; the packaged copy equals `/samples`; the sample journey with no login and with each login method, in each tool. |
| **Viewer** (`viewer/`) | The offline HTML report viewer, driven in a real browser from real CLI output. | Per-step screenshots, the timeline, the **Display Focus Order** tab (including "Hidden from AT" stops), and an audit taken behind a login. |
| **agent-browser** (`@agent-browser`) | The real `agent-browser` CLI: it signs in, saves the session, and the session survives a whole audit. | The saved-state file format; the handoff to the CLI and to MCP; the blind-spot comparison; the public and the signed-in journey. |
| **Package** (`package/`) | What is published to npm, and that the documentation is true. | Runtime files, `core`, `SKILL.md`, the samples and docs are included; tests, the extension and dev tooling are not; documented `audit` flags and `agent-browser` commands exist; tags, scripts and variables are documented. |

### Showcase: focus order across steps

One viewer test audits a realistic storefront page (`fixtures/pages/focus-demo.html`) through three steps and checks the report after each one:

| Step | Interaction | New findings | Tab stops |
| :-- | :-- | :-- | :-- |
| 1 | Page as loaded | none | 14 |
| 2 | Click **Show more options** | an icon-only button with no name, an image with no alt text | 16 |
| 3 | Click **Shop new arrivals** | an icon-only link with no name | 18 |

Each step attaches a screenshot of the rendered report to the Playwright report.

### The fake login system

The fixture server (`fixtures/server.js`) is a small, offline, deterministic login system, so the tests need no internet or real accounts:

* `login-2field.html`: user + password (the `-u`/`-p` shorthand).
* `login-company.html`: company + user + password, like multi-tenant apps.
* `login-sso.html`: a two-screen flow where the password field appears asynchronously.
* `account.html`: the protected page. It is only served with the session cookie and holds an image without alt text that exists nowhere else, so "that finding was reported" proves the audit ran **logged in**.
* `/app/journey.html`: a protected copy of the multi-step journey page, used to prove a session survives a whole journey.
* A fake **identity provider** on another origin for the SSO tests (see [Running the SSO tests](#running-the-sso-tests-in-playwright-step-by-step)).

The shipped sample server (`cli/samples/server.mjs`) plays the same role for the `@sample-journeys` tests.

### Live checks (opt-in)

Three tests (tagged `@auth @live`) run the package against a public training site with a real login and real accessibility problems, [Abi's Testing Dojo](https://abi-testing-dojo-demo.azurewebsites.net/), whose login page publishes its demo credentials. They follow the CLI README's *Enterprise Multi-Field Auth + Post-Login SPA Workflow* example, once through the CLI and once through MCP. They are skipped unless `WICK_LIVE=1`:

```bash
npm run test:live              # headless, terminal output
npm run test:live -- --ui      # in the Playwright UI (screenshots in each test's Attachments tab)
```

## Environment variables

None are needed for a normal run. These change what runs or where it runs. Set them in the shell before the command
(bash: `WICK_LIVE=1 npx playwright test`, PowerShell: `$env:WICK_LIVE=1; npx playwright test`).

| Variable | Effect | Default |
| :-- | :-- | :-- |
| `WICK_LIVE` | Any non-empty value enables the `@live` tests (real requests to the public Abi's Testing Dojo site). Without it they are listed but skipped. `test:live` and `test:ui:all` set it for you. Note the name: it is `WICK_LIVE`, not `WICK`. | unset |
| `WICK_LIVE_ABI_URL`, `WICK_LIVE_ABI_COMPANY`, `WICK_LIVE_ABI_USER`, `WICK_LIVE_ABI_PASSWORD` | Site and demo credentials used by the `@live` tests. | the public demo site and its demo account |
| `FIXTURE_PORT` | Port of the local fixture app. The fake identity provider uses this + 1. Use it when 4173/4174 are taken. | `4173` |
| `SAMPLES_PORT` | Port of the sample server shipped in the package (`cli/samples/server.mjs`), used by the `@sample-journeys` tests. | `4310` (the server alone defaults to `4300`) |
| `SAMPLES_URL` | Base URL the sample login script (`samples/login-script.mjs`) signs in to. Set by the tests; set it yourself only when running the script by hand. | `http://127.0.0.1:4300` |
| `WICK_PKG_DIR` | Run the CLI/MCP tests against another copy of the package (for example an extracted tarball) instead of `./cli`. | `./cli` |
| `WICK_FIXTURE_URL` | Set by the tests themselves so the custom login script and the MCP server know the fixture URL. You don't set it. | set per test |
| `CI` | Enables Playwright's CI mode: 1 retry, 2 workers, `test.only` forbidden, and no reuse of an already-running fixture server. | unset |

- `images/playwright-ui.png` — screenshot of the Playwright UI used in the root `README.md` (currently a placeholder: replace it, keeping the file name).
- `fixtures/pages/` — static pages with known a11y problems, served locally (offline, deterministic).
- `fixtures/server.js` — also hosts a fake cookie login (`POST /login`, protected `/account.html`; demo creds `Northwind` / `jdoe` / `Admin+123`) used by the `@auth` tests. `fixtures/auth/login-script.mjs` is the custom module for `--auth-script`.
- `helpers/` — CLI runner, MCP stdio client, `agent-browser` wrapper, auth and login-method definitions (`login-matrix.js`, `sample-journeys.js`), the shared journey expectations (`journey-suite.js`, `steps-demo.js`, `references.js`), the viewer helper and path resolution.
- `cli/auth-live-abi.spec.js` — the `@live` tests. They run README example 11 (login + Security > Companies > search) through the CLI and through MCP against <https://abi-testing-dojo-demo.azurewebsites.net>. `npm run test:live` (runs `run-live.js`) sets `WICK_LIVE=1` for you on any OS; without it these tests are skipped. They attach one screenshot per step (Attachments tab in the UI). Override the site or demo credentials with `WICK_LIVE_ABI_URL`, `WICK_LIVE_ABI_COMPANY`, `WICK_LIVE_ABI_USER`, `WICK_LIVE_ABI_PASSWORD`. Assertions are loose by design (kinds of findings, not counts) because the site is not ours.
- `fixtures/server.js` also runs a fake **identity provider** on `localhost:<FIXTURE_PORT + 1>` (the app is on `127.0.0.1:<FIXTURE_PORT>`): different host and port, its own cookie (`idp_session`), authorization-code redirect back to `/sso/callback`. Page: `fixtures/pages/idp-login.html`. Used by `cli/sso.spec.js` and `mcp/sso.spec.js` (tag `@sso`).
- **Ports.** The fixtures use `4173` (the app) and `4174` (the fake identity provider). If a stale fixture server from an old Playwright UI session still holds 4173, the run stops with `EADDRINUSE` instead of silently using it: close that session, or pick another pair with `FIXTURE_PORT=<port>` (the identity provider is then `<port> + 1`), e.g. `$env:FIXTURE_PORT=4300` in PowerShell.
- **One run at a time.** Every Playwright run empties `test-results/` when it starts, so a terminal run started while the Playwright UI is open deletes the UI's traces (the `ENOENT ... .trace` error). Close the UI, or run the terminal command with `--output=<other folder>`.
- `agent-browser/` — tests that drive the real [`agent-browser`](https://agent-browser.dev/) CLI (a root dev dependency) with fixed commands, like an agent would: log in (2-field, company, SSO), `state save`, then audit with `-a` (CLI) or `authState` (MCP); the saved file is checked to be Playwright storageState; and the clickable-`<div>` "blind spot" (agent-browser sees a `generic ... clickable`, wick-ag-lens flags `v-unfocusable`). Each command is a step with its output attached. They skip themselves if agent-browser is not installed. A state file holds a live session cookie, so it is written only under `test-results/` (git-ignored). Needs an installed Chrome/Chromium that agent-browser can find (`npx agent-browser doctor`).
- `package/docs-commands.spec.js` (tag `@docs`) — fails when the docs mention an `audit` flag or an `agent-browser` command that does not exist.
- `WICK_PKG_DIR=<dir>` runs the CLI/MCP projects against another copy of the package (e.g. an extracted tarball).

## Running the SSO tests in Playwright (step by step)

The SSO tests (`@sso`, 5 for the CLI + 5 for MCP) log in through a redirect to another origin. Everything is local, so no internet or credentials are needed.

**What happens in the main test** (`SSO login: app -> IdP sign-in (2 screens) -> back to the app, logged in`):

| # | Where | What |
|---|---|---|
| 1 | app `127.0.0.1:4173` | the browser opens `/sso/account.html`; there is no session, so the app redirects to the IdP |
| 2 | IdP `localhost:4174` | sign-in screen 1: `fill #idp-user`, `click #idp-next` |
| 3 | IdP | `wait #idp-password` (it appears after a short delay), `fill #idp-password`, `click #idp-signin` |
| 4 | IdP -> app | the IdP sets its own cookie and redirects to `/sso/callback?code=...`; the app sets its session cookie |
| 5 | app | `wait #welcome` (only exists on the protected page), then the audit runs and finds `#private-img`, which proves it ran **logged in** |

**To run them in the Playwright UI:**

1. One-time: `npm run setup` (installs dependencies and Chromium).
2. Close any other Playwright UI or terminal run first (see "One run at a time" above). Ports `4173` and `4174` must be free; if they are not, you get an `EADDRINUSE` error, and you can start with another pair: `$env:FIXTURE_PORT=4300` (PowerShell) or `FIXTURE_PORT=4300` (bash).
3. Start the UI with the SSO tests only:
   ```
   npm run test:sso -- --ui
   ```
   or open the UI normally with `npm run test:ui` and type `@sso` in the **Filter** box.
4. Keep the `cli` and `mcp` projects ticked (`viewer` and `package` have no SSO tests).
5. Press the run button (▶) at the top of the test list to run all of them, or hover one test and press its own ▶.
6. Click a test to inspect it. For `SSO login: ...` look at:
   * **Attachments**: `sso-cli-step-1` / `sso-mcp-step-1` is a screenshot of the protected page after the round trip; `cli-stdout` shows the `[Auth]` lines and the JSON; for MCP, `audit_baseline-request` shows the `loginUrl` + `authSteps` that were sent.
   * **Log / Call**: the exact `wick-ag-lens ...` command that ran.
7. Compare with `control: without logging in...`, which audits the same URL with no login and must end on the identity provider (`localhost:4174/authorize`), and with `wrong password...`, which must never reach the app.

The browser itself is launched by the CLI/MCP server in the background (headless), so the UI shows no live browser or timeline for these tests; the screenshots in Attachments are what it saw.

**Without the UI:** `npm run test:sso`. One test only: `npx playwright test --grep @sso -g "wrong password"`.

**In the VS Code Playwright panel:** type `@sso` in the filter and run the filtered tests. There is no tag picker in the panel; you type the tag.

**See what the fake identity provider does** by hand: `node tests/fixtures/server.js` (it listens on 4173 and 4174 by default), then open `http://127.0.0.1:4173/sso/account.html` in a browser and sign in with `jdoe` / `Admin+123`.
