const { test, expect } = require('@playwright/test');
const { connectMcp, callTool } = require('../helpers/mcp');
const { toMcpSteps } = require('../helpers/auth');
const { defineBenchmarkTests } = require('../helpers/benchmark');
const { SHOP_PATH, LOGIN_PATH, CREDENTIALS, AUDITS, STEPS } = require('../benchmark/journey');

// BENCHMARK JOURNEY, MCP: the twin of cli/benchmark-journey.spec.js. The login arguments go into audit_baseline, then one
// interact_and_diff per step on the same session. Same page, same 30 audits, same frozen result.
test.describe('MCP benchmark journey: 15 steps, 30 audits, behind a login', { tag: ['@benchmark', '@a11y-auth'] }, () => {
  test.describe.configure({ mode: 'serial' });
  let client; let report; let shopUrl;

  test.beforeAll(async ({ baseURL }) => {
    shopUrl = `${baseURL}${SHOP_PATH}`;
    client = await connectMcp();
    // filters such as requestedAudits must be sent on every call
    const first = await callTool(client, 'audit_baseline', {
      url: shopUrl, loginUrl: `${baseURL}${LOGIN_PATH}`, user: CREDENTIALS.user, pass: CREDENTIALS.password,
      requestedAudits: AUDITS, includeScreenshot: true,
    });
    expect(first.isError, first.text).toBe(false);
    for (const s of toMcpSteps(STEPS)) {
      const res = await callTool(client, 'interact_and_diff', { ...s, requestedAudits: AUDITS, includeScreenshot: true });
      expect(res.isError, res.text).toBe(false);
    }
    report = (await callTool(client, 'get_audit_trail', {})).json;
  });
  test.afterAll(async () => { await client?.close(); });

  defineBenchmarkTests(() => report, () => shopUrl);
});
