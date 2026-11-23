# Tests (dev only — never published)

Playwright Test suite for the `wick-ag-lens` npm package. Lives at the repo root, outside
`cli/` and `extension/`, and `cli/package.json#files` is a whitelist, so nothing here ships.
`tests/package/contents.spec.js` enforces that.

```
npm run setup          # one-time: root deps + cli deps + chromium
npm test               # builds (pretest), then runs everything
npm run test:cli | test:mcp | test:package | test:viewer
npm run pack:tarball   # builds and writes dist/wick-ag-lens-<version>.tgz
```

- `fixtures/pages/` — static pages with known a11y problems, served locally (offline, deterministic).
- `helpers/` — CLI runner, MCP stdio client, path resolution.
- `WICK_PKG_DIR=<dir>` runs the CLI/MCP projects against another copy of the package (e.g. an extracted tarball).
