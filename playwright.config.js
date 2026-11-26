// Test framework for the wick-ag-lens npm package (cli/).
// Lives at the repo root, so it is NOT part of the extension/ or cli/ build outputs.
const { defineConfig } = require('@playwright/test');

// The fixtures are served on PORT (the app) and PORT + 1 (the fake identity provider used by the SSO tests).
// Set FIXTURE_PORT to use another pair, e.g. when 4173/4174 are taken.
const PORT = Number(process.env.FIXTURE_PORT || 4173);
// The sample server SHIPPED in the package (cli/samples/server.mjs), used by the sample-journey tests. SAMPLES_PORT changes it.
const SAMPLES_PORT = Number(process.env.SAMPLES_PORT || 4310);

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 90_000,              // each audit launches a real browser
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: './test-results',
  use: { baseURL: `http://127.0.0.1:${PORT}` },

  // Local fixture pages with known, deterministic accessibility problems.
  webServer: [{
    command: 'node tests/fixtures/server.js',
    // Readiness is checked on a route that only the CURRENT server.js serves (it carries a version).
    // An outdated server left running on the app port (e.g. by an open Playwright UI session) answers 404 there,
    // so Playwright tries to start a fresh one and fails loudly (port in use) instead of silently reusing old routes.
    url: `http://127.0.0.1:${PORT}/__fixture-server-v3`,
    env: { FIXTURE_PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
  }, {
    command: 'node cli/samples/server.mjs',        // the packaged copy, so the shipped files are what gets tested
    url: `http://127.0.0.1:${SAMPLES_PORT}/steps-demo.html`,
    env: { SAMPLES_PORT: String(SAMPLES_PORT) },
    reuseExistingServer: !process.env.CI,
  }],

  projects: [
    // Everything that runs the tools: the journeys (CLI, MCP, agent-browser, with and without a login), the login showcase, the audit
    // checks and the report viewer. Pick a surface with its tag (@cli, @mcp, @agent-browser, @viewer), see tests/README.md.
    { name: 'regression', testMatch: 'tests/regression/**/*.spec.js', use: { browserName: 'chromium' } },
    { name: 'package', testMatch: 'tests/package/**/*.spec.js' },
    // Opt-in checks against a real public site (skipped unless WICK_LIVE=1)
    { name: 'cli', testMatch: 'tests/cli/**/*.spec.js' },
  ],
});
