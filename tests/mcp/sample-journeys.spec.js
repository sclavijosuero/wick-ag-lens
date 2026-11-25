const { test, expect } = require('@playwright/test');
const { connectMcp, callTool } = require('../helpers/mcp');
const { toMcpSteps } = require('../helpers/auth');
const { AUDITS, STEPS, defineStepsDemoTests } = require('../helpers/steps-demo');
const { LOGINS, LOGIN_URL, BASE } = require('../helpers/sample-journeys');

// SAMPLE JOURNEY, MCP: the twin of cli/sample-journeys.spec.js. The login goes into audit_baseline; each step is one
// interact_and_diff call on the session audit_baseline opened. Same page, same steps, same expectations as the CLI.
function defineJourney(login, options) {
  test.describe(`MCP sample journey - ${login.title}`, options, () => {
    test.describe.configure({ mode: 'serial' });
    let client; let report;

    // Run the journey ONCE for this login: audit_baseline carries the login arguments (login.mcp), then one
    // interact_and_diff call per step on the same open session. Method 5 first records a session file.
    test.beforeAll(async () => {
      const info = test.info();
      const state = login.prepare ? await login.prepare(info) : undefined;
      const baseline = { url: login.url, requestedAudits: AUDITS, includeScreenshot: true, ...login.mcp(state) };
      await info.attach('how', {
        body: `${login.title}\n${login.how}\n\n1. audit_baseline ${JSON.stringify(baseline)}\n2. interact_and_diff once per step: ${STEPS.join('  ')}`,
        contentType: 'text/plain',
      });

      client = await connectMcp({ SAMPLES_URL: BASE });                // read by samples/login-script.mjs
      const first = await callTool(client, 'audit_baseline', baseline);
      expect(first.isError, first.text).toBe(false);
      for (const s of toMcpSteps(STEPS)) {
        const res = await callTool(client, 'interact_and_diff', { ...s, requestedAudits: AUDITS, includeScreenshot: true });
        expect(res.isError, res.text).toBe(false);
      }
      report = (await callTool(client, 'get_audit_trail', {})).json;
    });
    test.afterAll(async () => { await client?.close(); });

    // Login worked: step 1 is the target page, not the sign-in page.
    test('the audit starts on the target page, signed in (not on the sign-in page)', () => {
      expect(report.audit_trail[0].url).toBe(login.url);
      expect(report.audit_trail[0].url).not.toBe(LOGIN_URL);
    });
    // Same shared expectations as the CLI version (helpers/steps-demo.js).
    defineStepsDemoTests(() => report);
  });
}

// No login: not an authentication test. Every login method: an accessibility audit behind a login (@a11y-auth).
const [PUBLIC, ...WITH_LOGIN] = LOGINS;
defineJourney(PUBLIC, { tag: ['@samples', '@sample-journeys'] });
for (const login of WITH_LOGIN) defineJourney(login, { tag: ['@samples', '@sample-journeys', '@a11y-auth'] });
