const { test, expect } = require('@playwright/test');
const { AgentBrowser, available } = require('../helpers/agent-browser');
const { audit, selectorsFor } = require('../helpers/cli');
const { connectMcp, callTool } = require('../helpers/mcp');
const { CREDS, isBouncedToLogin } = require('../helpers/auth');
const { toMcpSteps } = require('../helpers/auth');
const { AUDITS, STEPS, defineJourneyTests } = require('../helpers/journey-suite');

// WORKED EXAMPLE + SESSION CHECK: the full multi-step journey, on a page that REQUIRES A LOGIN (/app/journey.html).
//   1. agent-browser signs in through the real UI and runs `state save`            (the only thing it hands over)
//   2. wick-ag-lens audits the protected journey with that state, step after step  (CLI: -a / --step ; MCP: authState / interact_and_diff)
//   3. a final step clicks "Home", which navigates to ANOTHER protected page (/account.html): if the session had
//      been lost anywhere along the 9 steps, that last page would be the sign-in page instead of the dashboard.
// The 9 journey steps are checked with exactly the same expectations as the unprotected CLI and MCP journeys.
test.skip(!available, 'agent-browser is not installed (npm install in the repo root)');
test.describe.configure({ mode: 'serial' });

const FINAL_STEP = 'click::#home';

test.describe('agent-browser session -> multi-step journey', { tag: ['@journey', '@a11y-auth', '@agent-browser'] }, () => {
  let baseURL; let stateFile; let protectedUrl;

  test.beforeAll(async () => {
    baseURL = test.info().project.use.baseURL;
    protectedUrl = `${baseURL}/app/journey.html`;
    const ab = new AgentBrowser();
    try {
      await ab.run(['open', `${baseURL}/login-2field.html`]);
      await ab.run(['fill', '#user', CREDS.user]);
      await ab.run(['fill', '#password', CREDS.password]);
      await ab.run(['click', 'button[type=submit]']);
      await ab.run(['wait', '--url', '**/account.html']);
      stateFile = test.info().outputPath('state.json');
      await ab.run(['state', 'save', stateFile]);
    } finally {
      await ab.close();           // agent-browser is done: from here on, ONLY the saved file carries the session
    }
  });

  test('control: without the saved state the protected journey page bounces to the sign-in page', async () => {
    const { report } = await audit(protectedUrl, ['--audits', 'v-missing-alt']);
    expect(isBouncedToLogin(report.audit_trail[0])).toBe(true);
  });

  test.describe('CLI: -a <state> + 9 --step interactions + a final navigation', () => {
    let report;
    test.beforeAll(async () => {
      ({ report } = await audit(protectedUrl, [
        '-s', '-a', stateFile, '--audits', AUDITS.join(','), ...[...STEPS, FINAL_STEP].flatMap((s) => ['--step', s]),
      ]));
    });

    defineJourneyTests(() => report, { extraSteps: [FINAL_STEP] });

    test('step 10 - the session survived the whole journey: "Home" lands on the logged-in dashboard', () => {
      const trail = report.audit_trail;
      expect(trail).toHaveLength(10);
      expect(trail.slice(0, 9).every((t) => t.url.endsWith('/app/journey.html'))).toBe(true);   // never bounced mid-journey
      expect(trail[9].url).toBe(`${baseURL}/account.html`);
      expect(selectorsFor(trail[9], 'v-missing-alt')).toContain('#private-img');              // exists only on the logged-in page
    });
  });

  test.describe('MCP: authState + interact_and_diff x9 + a final navigation', () => {
    let client; let report;
    test.beforeAll(async () => {
      client = await connectMcp({ WICK_FIXTURE_URL: baseURL });
      const first = await callTool(client, 'audit_baseline', {
        url: protectedUrl, authState: stateFile, requestedAudits: AUDITS, includeScreenshot: true,
      });
      expect(first.isError, first.text).toBe(false);
      for (const s of toMcpSteps([...STEPS, FINAL_STEP])) {
        const res = await callTool(client, 'interact_and_diff', { ...s, requestedAudits: AUDITS, includeScreenshot: true });
        expect(res.isError, res.text).toBe(false);
      }
      report = (await callTool(client, 'get_audit_trail', {})).json;
    });
    test.afterAll(async () => { await client?.close(); });

    defineJourneyTests(() => report, { extraSteps: [FINAL_STEP] });

    test('step 10 - the session survived the whole journey: "Home" lands on the logged-in dashboard', () => {
      const trail = report.audit_trail;
      expect(trail).toHaveLength(10);
      expect(trail.slice(0, 9).every((t) => t.url.endsWith('/app/journey.html'))).toBe(true);
      expect(trail[9].url).toBe(`${baseURL}/account.html`);
      expect(selectorsFor(trail[9], 'v-missing-alt')).toContain('#private-img');
    });
  });
});
