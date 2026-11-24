# Tests (dev only — never published)

Playwright Test suite for the `wick-ag-lens` npm package. Lives at the repo root, outside
`cli/` and `extension/`, and `cli/package.json#files` is a whitelist, so nothing here ships.
`tests/package/contents.spec.js` enforces that.

```
npm run setup          # one-time: root deps + cli deps + chromium
npm test               # builds (pretest), then runs everything
npm run test:cli | test:mcp | test:package | test:viewer
npm run test:auth      # only the @auth tests (CLI + MCP + viewer)
WICK_LIVE=1 npm run test:auth   # also the opt-in live checks against Abi's Testing Dojo
npm run test:ui        # interactive Playwright UI
npx playwright show-report
npm run pack:tarball   # builds and writes dist/wick-ag-lens-<version>.tgz
```

- `images/playwright-ui.png` — screenshot of the Playwright UI used in the root `README.md` (currently a placeholder: replace it, keeping the file name).
- `fixtures/pages/` — static pages with known a11y problems, served locally (offline, deterministic).
- `fixtures/server.js` — also hosts a fake cookie login (`POST /login`, protected `/account.html`; demo creds `Northwind` / `jdoe` / `Admin+123`) used by the `@auth` tests. `fixtures/auth/login-script.mjs` is the custom module for `--auth-script`.
- `helpers/` — CLI runner, MCP stdio client, auth helpers (storage-state builders, login steps), path resolution.
- `FIXTURE_PORT=<port>` serves the fixtures on another port (use it if a stale server from an open Playwright UI holds 4173).
- `WICK_PKG_DIR=<dir>` runs the CLI/MCP projects against another copy of the package (e.g. an extracted tarball).
