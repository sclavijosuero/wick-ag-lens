const { test } = require('@playwright/test');
const { available } = require('../helpers/agent-browser');
const { SCENARIOS } = require('../helpers/scenarios');
const { expectGolden } = require('../helpers/golden');
const { runCli, runMcp, runAgentBrowser } = require('../helpers/runners');

// THE REGRESSION JOURNEYS. This is where the accuracy of the audits is guarded between runs.
//
// Four journeys (short, medium, long, coverage: see helpers/scenarios.js), each run
//   - through the CLI, the MCP server and agent-browser (it signs in and saves the session, wick-ag-lens audits with it),
//   - without a login (public page) and with a login (the protected copy of the same page; the coverage journey has no login mode).
// Every run is compared with the SAME frozen file, tests/golden/<journey>.json: per step, which findings are new and resolved
// (every element for the short and medium journeys, counts per audit for the long one), the health scores and the focus order.
// So a change in the audits, in the step diff, or in how a tool reports shows up as a precise difference, and the three tools
// and the two modes must agree with each other. The viewer shows the same journeys in viewer.spec.js.
//
// If a bug fix changes what an audit reports on purpose: WICK_UPDATE_GOLDEN=1 npx playwright test --grep @journeys, then read
// the diff of tests/golden/ before committing it.
for (const scenario of SCENARIOS) {
  for (const mode of scenario.modes ?? ['public', 'auth']) {
    const where = mode === 'public' ? 'no login' : 'behind a login';
    const tags = ['@journeys', ...(scenario.id === 'long' ? ['@benchmark'] : []), ...(mode === 'auth' ? ['@a11y-auth'] : [])];

    test.describe(`${scenario.title}, ${where}`, () => {
      test.setTimeout(scenario.slow ? 240_000 : 120_000);
      const target = (baseURL) => scenario.target(mode, baseURL);
      const check = (report) => expectGolden(report, scenario.id, { detail: scenario.detail });

      test('CLI', { tag: [...tags, '@cli'] }, async ({ baseURL }) => {
        const { report } = await runCli(scenario, target(baseURL));
        check(report);
      });

      test('MCP', { tag: [...tags, '@mcp'] }, async ({ baseURL }) => {
        const { report } = await runMcp(scenario, target(baseURL));
        check(report);
      });

      test('agent-browser, then CLI', { tag: [...tags, '@agent-browser'] }, async ({ baseURL }, testInfo) => {
        test.skip(!available, 'agent-browser is not installed (npm install in the repo root)');
        const { report } = await runAgentBrowser(scenario, target(baseURL), testInfo);
        check(report);
      });
    });
  }
}
