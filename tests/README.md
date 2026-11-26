# Tests (dev only — never published)

Playwright Test suite for the `wick-ag-lens` npm package. Lives at the repo root, outside
`cli/` and `extension/`, and `cli/package.json#files` is a whitelist, so nothing here ships.
`tests/package/contents.spec.js` enforces that.

The suite is small on purpose, and every test has a reason to exist. Its job is to make sure that **the audits give the same
answer from one run to the next** (unless a bug was fixed on purpose), whatever tool runs them and however the page was reached.

```
npm run setup          # one-time: root deps + cli deps + chromium
npm test               # builds (pretest), then runs everything (about 5 minutes)
npm run test:regression | test:package
npm run test:journeys  # the four regression journeys: CLI, MCP, agent-browser, with and without a login
npm run test:logins    # the login showcase: every way to log in, in the CLI and in MCP
npm run test:cli | test:mcp | test:agent-browser | test:viewer   # one surface, across all the groups
npm run test:auth      # everything about logging in (the login showcase; the live Abi tests stay skipped)
npm run test:a11y-auth # the journeys and the showcase that run behind a login
npm run test:benchmark # the long journey (15 steps, 30 audits): the benchmark page, see benchmark/README.md
npm run test:live      # only the opt-in live checks against Abi's Testing Dojo (needs internet)
npm run test:ui        # interactive Playwright UI (the Abi live tests are listed but skipped)
npm run test:ui:all    # same UI with WICK_LIVE=1: EVERYTHING runs, including the live tests (needs internet)
npx playwright show-report
npm run pack:tarball   # builds and writes dist/wick-ag-lens-<version>.tgz
```

## The four groups

| Group | Where | What it answers |
| :-- | :-- | :-- |
| **Regression journeys** | `regression/journeys.spec.js` | Does every step of a user journey still report exactly the findings it reported before? Three journeys (short, medium, long), each through the CLI, the MCP server and agent-browser, with and without a login (18 tests), plus the coverage journey (3 tests), all compared with the same frozen file per journey. |
| **Login showcase** | `regression/login-methods.spec.js` | Does each documented way to log in work, with the same audit result as with no login? One short journey through all 5 methods, in the CLI and in MCP, plus agent-browser, the failures, and saving the session. It is also the model to copy when configuring a login. |
| **Viewer and audit checks** | `regression/viewer.spec.js`, `regression/audits.spec.js` | Does the report viewer show what the JSON says, and do the options and the special cases (aria-hidden, focus order, iframes, shadow DOM, WCAG filters, MCP session protocol) behave? |
| **Package** | `package/` | Is the right thing published, and is the documentation true? Also: does every audit have regression coverage? |

### The four journeys

Defined once in `helpers/scenarios.js`; the result of each one is frozen in `golden/<journey>.json`.

| Journey | Page | Steps | Audits | Frozen in the golden file |
| :-- | :-- | :-- | :-- | :-- |
| **short** | `samples/steps-demo.html` | 10: every step action (click, fill, select, hover, press, wait) | 7 | every finding of every step, the focus order, the health scores |
| **medium** | `samples/shop-journey.html` | 8: menu, sign-up form, an `aria-hidden` dialog, findings that appear, resolve and reappear | 16 | every finding of every step, the focus order, the health scores |
| **long** | the benchmark shop (`fixtures/pages/bench-shop.html`) | 15 | 30 | findings per audit (about 640 elements in total), focus stops, health scores. Also the benchmark of [`benchmark/`](benchmark/README.md) |
| **coverage** | `fixtures/pages/coverage.html` | 6 buttons: findings that appear and findings that are resolved | the 24 audits no other journey reaches | every finding of every step, the health scores. No login (the logins are already covered above) |

"No login" runs the public copy of the page; "behind a login" runs the protected copy (`/app/...` on the fixture server, or
`/app/steps-demo.html` on the sample server) after signing in. Both must give the **same** golden result. (The coverage journey has no login mode.) With agent-browser,
the tool looks at the page (no login) or signs in and saves the session (`state save`), and wick-ag-lens audits with that file.

### Golden files and how to change them

A golden file is rewritten **only on purpose**: after fixing a bug or changing an audit, run

```bash
WICK_UPDATE_GOLDEN=1 npx playwright test --project=regression --grep "no login CLI"     # PowerShell: $env:WICK_UPDATE_GOLDEN=1
```

then **read the diff of `tests/golden/`** before committing it. A test failure prints one line per step and field, with what is
missing and what is unexpected, so a changed audit is easy to find. The long journey also has the answer key of the benchmark
(`benchmark/reference.js`); if the long golden file changes, regenerate that key too (`benchmark/README.md`).

**Audit coverage.** `package/audit-coverage.spec.js` checks that every audit appears in at least one golden file. The short, medium
and long journeys reach 31 of the 55 audits; the **coverage journey** plants a finding for each of the other 24 on one page
(`fixtures/pages/coverage.html`). A new audit with no coverage fails the test: add it to that page (or to another journey), run the
journey with `WICK_UPDATE_GOLDEN=1`, and read the diff.

The coverage page is opened from disk (`file://`), not from the fixture server, because its page-encoding finding needs a page
whose character set is declared only in the file (the server always sends `charset=utf-8`). It has no title, no `lang` and two
`<iframe>` elements, so the root-level audits (document title, language) also report once per frame document, with the selector
`html`: the golden file freezes that behaviour.

## Tags

Tests are selected by **project** (`regression`, `package`, `cli` for the live tests) and by **tag**. The scripts above are
shortcuts for `npx playwright test` with `--project` or `--grep`. `--grep-invert` removes matches, `--list` shows what would run.

| Tag | Where it is used | Notes |
| :-- | :-- | :-- |
| `@journeys` | all files in `regression/journeys` | The four regression journeys, every surface, with and without a login (the coverage journey has no login mode). |
| `@logins` | `regression/login-methods` | The login showcase and the login failures and session saving. |
| `@auth` | `regression/login-methods`, `cli/auth-live-abi` | Logging in. |
| `@a11y-auth` | `regression/journeys`, `regression/login-methods` | An accessibility audit behind a login (the journeys behind a login, and the showcase). |
| `@benchmark` | `regression/journeys` | The long journey, the same page and journey as the agent benchmark. Part of the full regression. |
| `@cli` | all files in `regression/` | Runs through the CLI. |
| `@mcp` | all files in `regression/` | Runs through the MCP server. |
| `@agent-browser` | all files in `regression/` | Uses the real `agent-browser` CLI (a dev dependency; skips itself if not installed). The slowest tests. |
| `@viewer` | `regression/viewer` | The offline HTML report viewer, in a real browser. |
| `@docs` | all files in `package/` | Checks that the documentation, the package contents and the audit list are true. |
| `@live` | `cli/auth-live-abi` | Real public site. Skipped unless `WICK_LIVE=1`. Also tagged `@auth`. |

When you add a test, give it a tag only if it belongs to one of these groups, and update the table above.
`package/tags-doc.spec.js` (tag `@docs`) fails if a tag, an npm test script or an environment variable used by the tests is
missing from this README, or if a documented tag is no longer used.

### Combining tags

| Goal | Command |
| :-- | :-- |
| Everything except agent-browser and live (fast run) | `npx playwright test --grep-invert "@agent-browser\|@live"` |
| The CLI journeys only | `npx playwright test --grep "@journeys.*@cli\|@cli.*@journeys"` |
| One journey | `npx playwright test -g "medium journey"` |
| Login methods without the slow agent-browser ones | `npx playwright test --grep @logins --grep-invert @agent-browser` |
| One test by name | `npx playwright test -g "wrong password"` |

## What the tests verify

| Area | What it verifies |
| :-- | :-- |
| **Journeys** | Per step: which findings are new and resolved, how many are active (health scores), the exact focus order, the interaction as recorded; the JSON is coherent (replaying the deltas reproduces every health score; every audit that reported has a dictionary entry). The MCP run also checks that what each `interact_and_diff` returned is what `get_audit_trail` lists. |
| **Login showcase** | `-u`/`-p`; a company + user + password pipeline (`--auth-step`); single sign-on through an identity provider on another origin (`--auth-step`); `--auth-script`; a saved session (`-a` / `authState`) recorded by Playwright or by agent-browser. No credentials, a wrong password (at the identity provider too, for single sign-on), an expired session and a missing script do **not** log in. A login plus `-a` (MCP: `saveAuthState`) saves the session; `-a` alone reuses it and never creates a file. |
| **Viewer** | For every step of each journey, the New / Still present / Resolved badges equal the JSON and the screenshot loads; the focus-order tab; raw CLI output (log lines + JSON); an invalid file; a storefront walkthrough that produces the documentation screenshots. |
| **Audit checks** | Known violations on a bad page and none on a good one; `--audits`; `--step`; screenshots only with `-s`; `v-aria-hidden-focus` flags only controls a keyboard user can reach; the focus order is a full snapshot per step and maps only reachable stops; iframes and shadow DOM; `--wcag-version` / `--wcag-level` (MCP: `wcagVersions` / `wcagLevels`) report exactly the legends the extension shows; the MCP tools and session protocol. |
| **Package** | Runtime files, `core` and `SKILL.md` are included, tests and dev tooling are not; the samples are up to date and self-contained; documented `audit` flags and `agent-browser` commands exist; every audit declares its detection level; tags, scripts and variables are documented; every audit has regression coverage. |

## Fixtures and the fake login system

The fixture server (`fixtures/server.js`) is small, offline and deterministic, so the tests need no internet or real accounts:

* `login-2field.html`: user + password (the `-u`/`-p` shorthand). `login-company.html`: company + user + password.
* `account.html`: the protected page. It holds an image without alt text that exists nowhere else, so "that finding was reported" proves the audit ran **logged in**.
* `/app/journey.html` and `/app/bench-shop.html`: protected copies of the medium and long journey pages. The shop has its own sign-in page, `bench-login.html`.
* A fake **identity provider** for single sign-on, on `localhost:<FIXTURE_PORT + 1>` while the app is on `127.0.0.1:<FIXTURE_PORT>`: a different host and port, its own cookie, and an authorization-code redirect back to `/sso/callback`. The sign-in has two screens (user, then password). Starting point: `/sso/account.html`; demo credentials `jdoe` / `Admin+123`.

The shipped sample server (`cli/samples/server.mjs`) plays the same role for the short journey behind a login.

Other files: `fixtures/pages/coverage.html` is the page of the coverage journey; `images/playwright-ui.png` is a screenshot used in the root `README.md`; `fixtures/auth/login-script.mjs` is the custom module for `--auth-script`; `helpers/` has the CLI runner, the MCP stdio client, the `agent-browser` wrapper, the login-method definitions (`login-matrix.js`), the journeys (`scenarios.js`), how each tool runs one (`runners.js`) and the golden-file comparison (`golden.js`).

### Live checks (opt-in)

Three tests (tagged `@auth @live`) run the package against a public training site with a real login and real accessibility problems, [Abi's Testing Dojo](https://abi-testing-dojo-demo.azurewebsites.net/), whose login page publishes its demo credentials. They follow the CLI README's *Enterprise Multi-Field Auth + Post-Login SPA Workflow* example, once through the CLI and once through MCP. Assertions are loose by design (kinds of findings, not counts) because the site is not ours. They are skipped unless `WICK_LIVE=1`:

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
| `WICK_UPDATE_GOLDEN` | Any non-empty value rewrites the golden file of each journey run, instead of comparing with it. Use it only on purpose, then read the diff of `tests/golden/`. | unset |
| `FIXTURE_PORT` | Port of the local fixture app. The fake identity provider uses this + 1. Use it when 4173/4174 are taken. | `4173` |
| `SAMPLES_PORT` | Port of the sample server shipped in the package (`cli/samples/server.mjs`), used by the short journey behind a login. | `4310` (the server alone defaults to `4300`) |
| `WICK_PKG_DIR` | Run the tests against another copy of the package (for example an extracted tarball) instead of `./cli`. | `./cli` |
| `WICK_FIXTURE_URL` | Set by the tests themselves so the custom login script and the MCP server know the fixture URL. You don't set it. | set per test |
| `CI` | Enables Playwright's CI mode: 1 retry, 2 workers, `test.only` forbidden, and no reuse of an already-running fixture server. | unset |

- **Ports.** The fixtures use `4173` (the app) and `4174` (the fake identity provider). If a stale fixture server from an old Playwright UI session still holds 4173, the run stops with `EADDRINUSE` instead of silently using it: close that session, or pick another pair with `FIXTURE_PORT=<port>` and `SAMPLES_PORT=<port>`.
- **One run at a time.** Every Playwright run empties `test-results/` when it starts, so a terminal run started while the Playwright UI is open deletes the UI's traces (the `ENOENT ... .trace` error). Close the UI, or run the terminal command with `--output=<other folder>`.
- **agent-browser.** Its state files hold a live session cookie, so they are written only under `test-results/` (git-ignored). It needs an installed Chrome/Chromium that agent-browser can find (`npx agent-browser doctor`).
- `package/docs-commands.spec.js` (tag `@docs`) fails when the docs mention an `audit` flag or an `agent-browser` command that does not exist.
- The browser of each audit is launched by the CLI or the MCP server in the background (headless), so the Playwright UI shows no live browser for these tests. Attachments hold the exact command or tool arguments, and the viewer tests attach screenshots.
