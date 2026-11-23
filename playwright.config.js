// Test framework for the wick-ag-lens npm package (cli/).
// Lives at the repo root, so it is NOT part of the extension/ or cli/ build outputs.
const { defineConfig } = require('@playwright/test');

const PORT = Number(process.env.FIXTURE_PORT || 4173);

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
  webServer: {
    command: 'node tests/fixtures/server.js',
    url: `http://127.0.0.1:${PORT}/good.html`,
    env: { FIXTURE_PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    { name: 'cli', testMatch: 'tests/cli/**/*.spec.js' },
    { name: 'mcp', testMatch: 'tests/mcp/**/*.spec.js' },
    { name: 'package', testMatch: 'tests/package/**/*.spec.js' },
    { name: 'viewer', testMatch: 'tests/viewer/**/*.spec.js', use: { browserName: 'chromium' } },
  ],
});
