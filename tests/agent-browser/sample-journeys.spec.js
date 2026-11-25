const { test, expect } = require('@playwright/test');
const { AgentBrowser, available } = require('../helpers/agent-browser');
const { audit } = require('../helpers/cli');
const { connectMcp, callTool } = require('../helpers/mcp');
const { toMcpSteps } = require('../helpers/auth');
const { AUDITS, STEPS, defineStepsDemoTests } = require('../helpers/steps-demo');
const { PUBLIC_URL, PROTECTED_URL, LOGIN_URL, USER, PASSWORD } = require('../helpers/sample-journeys');

// SAMPLE JOURNEY, agent-browser: the same journey as cli/ and mcp/sample-journeys, with agent-browser doing the part it is
// good at: looking at the page (accessibility snapshot) and, for the protected page, SIGNING IN and saving the session
// (`state save`), which wick-ag-lens then loads (CLI -a / MCP authState). The audit expectations are the shared ones.
test.skip(!available, 'agent-browser is not installed (npm install in the repo root)');
test.describe.configure({ mode: 'serial' });

// The audit half, shared by both blocks below: the same journey through the CLI and through MCP.
// `getState` is the session file agent-browser saved (passed as -a / authState), or undefined for the public page.
function describeAudits(getUrl, getState) {
  test.describe('then audited through the CLI', () => {
    let report;
    test.beforeAll(async () => {
      const state = getState();
      ({ report } = await audit(getUrl(), [...(state ? ['-a', state] : []), '-s', '--audits', AUDITS.join(','), ...STEPS.flatMap((s) => ['--step', s])]));
    });
    test('the audit starts on the target page', () => { expect(report.audit_trail[0].url).toBe(getUrl()); });
    defineStepsDemoTests(() => report);
  });

  test.describe('then audited through MCP', () => {
    let client; let report;
    test.beforeAll(async () => {
      const state = getState();
      client = await connectMcp();
      const first = await callTool(client, 'audit_baseline', { url: getUrl(), requestedAudits: AUDITS, includeScreenshot: true, ...(state ? { authState: state } : {}) });
      expect(first.isError, first.text).toBe(false);
      for (const s of toMcpSteps(STEPS)) {
        const res = await callTool(client, 'interact_and_diff', { ...s, requestedAudits: AUDITS, includeScreenshot: true });
        expect(res.isError, res.text).toBe(false);
      }
      report = (await callTool(client, 'get_audit_trail', {})).json;
    });
    test.afterAll(async () => { await client?.close(); });
    test('the audit starts on the target page', () => { expect(report.audit_trail[0].url).toBe(getUrl()); });
    defineStepsDemoTests(() => report);
  });
}

// No login: agent-browser only looks at the page (accessibility snapshot); wick-ag-lens audits it.
test.describe('agent-browser sample journey - no login (public page)', { tag: ['@samples', '@sample-journeys', '@agent-browser'] }, () => {
  test('agent-browser sees the controls the journey starts from', async () => {
    const ab = new AgentBrowser();
    try {
      await ab.run(['open', PUBLIC_URL]);
      const snapshot = await ab.run(['snapshot', '-i']);
      expect(snapshot).toContain('"Open panel"');
    } finally { await ab.close(); }
  });
  describeAudits(() => PUBLIC_URL, () => undefined);
});

test.describe('agent-browser sample journey - method 5: agent-browser signs in, wick-ag-lens loads the session', { tag: ['@samples', '@sample-journeys', '@a11y-auth', '@agent-browser'] }, () => {
  let state;
  // agent-browser signs in through the real page and saves the session (`state save`), then closes:
  // from here on only the saved file carries the login.
  test.beforeAll(async () => {
    const ab = new AgentBrowser();
    try {
      await ab.run(['open', LOGIN_URL]);
      await ab.run(['fill', '#user', USER]);
      await ab.run(['fill', '#password', PASSWORD]);
      await ab.run(['click', '#login']);
      await ab.run(['wait', '--url', '**/app/steps-demo.html']);
      state = test.info().outputPath('state.json');
      await ab.run(['state', 'save', state]);
    } finally { await ab.close(); }                                     // from here on ONLY the saved file carries the session
  });

  // Control: without the saved file the protected page bounces to sign-in.
  test('control: without the saved session the protected page bounces to the sign-in page', async () => {
    const { report } = await audit(PROTECTED_URL, ['--audits', 'v-empty-buttons']);
    expect(report.audit_trail[0].url).toContain('/login.html');
  });
  // Audit the protected page with the handed-over session (CLI: -a, MCP: authState).
  describeAudits(() => PROTECTED_URL, () => state);
});
