const { test, expect } = require('@playwright/test');
const { connectMcp, callTool } = require('../helpers/mcp');
const { toMcpSteps } = require('../helpers/auth');
const { METHODS } = require('../helpers/login-matrix');
const { AUDITS, STEPS, defineJourneyCompactTests } = require('../helpers/journey-suite');

// The MCP twin of cli/a11y-auth.spec.js: the same journey, the same protected page, the same expectations, once per
// login mechanism. The login arguments go into audit_baseline; every later step is an interact_and_diff call on the
// session that audit_baseline opened, so the session has to survive all 9 steps. (Pure authentication: tag @auth.)
for (const method of METHODS) {
  test.describe(`MCP audits behind a login - ${method.title}`, { tag: '@a11y-auth' }, () => {
    test.describe.configure({ mode: 'serial' });
    let client; let report;

    test.beforeAll(async () => {
      const info = test.info();
      const base = info.project.use.baseURL;
      const state = method.prepare ? await method.prepare(base, info) : undefined;
      await info.attach('login-method', { body: `${method.title}\n\n${method.how}`, contentType: 'text/plain' });

      client = await connectMcp({ WICK_FIXTURE_URL: base });
      const first = await callTool(client, 'audit_baseline', {
        url: `${base}/app/journey.html`, requestedAudits: AUDITS, ...method.mcp(base, state),
      });
      expect(first.isError, first.text).toBe(false);
      for (const s of toMcpSteps(STEPS)) {
        const res = await callTool(client, 'interact_and_diff', { ...s, requestedAudits: AUDITS });
        expect(res.isError, res.text).toBe(false);
      }
      report = (await callTool(client, 'get_audit_trail', {})).json;
    });
    test.afterAll(async () => { await client?.close(); });

    defineJourneyCompactTests(() => report);
  });
}
