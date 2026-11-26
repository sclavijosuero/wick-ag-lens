const { test } = require('@playwright/test');
const { audit } = require('../helpers/cli');
const { defineBenchmarkTests } = require('../helpers/benchmark');
const { SHOP_PATH, LOGIN_PATH, CREDENTIALS, AUDITS, STEPS } = require('../benchmark/journey');

// BENCHMARK JOURNEY, CLI: log in with -u / -p, then the 15 steps with the 30 audits on the benchmark shop (tests/benchmark/README.md).
// The same journey is the task given to the agent runs (agent-browser, Playwright MCP); this run is their reference.
test.describe('CLI benchmark journey: 15 steps, 30 audits, behind a login', { tag: ['@benchmark', '@a11y-auth'] }, () => {
  test.describe.configure({ mode: 'serial' });
  let report; let shopUrl;

  // One run for the whole block. The login (method 1: --login-url -u -p) happens before the baseline; the steps then use that session.
  test.beforeAll(async ({ baseURL }) => {
    shopUrl = `${baseURL}${SHOP_PATH}`;
    const args = ['--login-url', `${baseURL}${LOGIN_PATH}`, '-u', CREDENTIALS.user, '-p', CREDENTIALS.password,
      '-s', '--audits', AUDITS.join(','), ...STEPS.flatMap((s) => ['--step', s])];
    await test.info().attach('command', { body: `node index.js audit ${shopUrl} ${args.join(' ')}`, contentType: 'text/plain' });
    ({ report } = await audit(shopUrl, args));
  });

  defineBenchmarkTests(() => report, () => shopUrl);
});
