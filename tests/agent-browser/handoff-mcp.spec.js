const { test, expect } = require('@playwright/test');
const { AgentBrowser, available } = require('../helpers/agent-browser');
const { connectMcp, callTool } = require('../helpers/mcp');
const { CREDS, isLoggedIn, isBouncedToLogin } = require('../helpers/auth');

// Same handoff as handoff-cli.spec.js, through the MCP tool: audit_baseline({ authState }).
test.skip(!available, 'agent-browser is not installed (npm install in the repo root)');

test.describe('agent-browser -> MCP session handoff', { tag: ['@auth', '@agent-browser'] }, () => {
  let ab; let client;
  test.beforeEach(async ({ baseURL }) => {
    ab = new AgentBrowser();
    client = await connectMcp({ WICK_FIXTURE_URL: baseURL });
  });
  test.afterEach(async () => { await ab.close(); await client?.close(); });

  const baseline = (args) => callTool(client, 'audit_baseline', { requestedAudits: ['v-missing-alt'], ...args });

  // Same handoff as the CLI one: agent-browser saves the session, audit_baseline loads it with authState.
  test('audit_baseline with authState audits the logged-in dashboard; without it, the sign-in page', async ({ baseURL }, testInfo) => {
    await ab.run(['open', `${baseURL}/login-2field.html`]);
    await ab.run(['fill', '#user', CREDS.user]);
    await ab.run(['fill', '#password', CREDS.password]);
    await ab.run(['click', 'button[type=submit]']);
    await ab.run(['wait', '--url', '**/account.html']);
    const stateFile = testInfo.outputPath('state.json');
    await ab.run(['state', 'save', stateFile]);

    const withState = await baseline({ url: `${baseURL}/account.html`, authState: stateFile });
    expect(withState.isError).toBe(false);
    expect(isLoggedIn(withState.json.audit_trail[0])).toBe(true);

    const without = await baseline({ url: `${baseURL}/account.html` });
    expect(isBouncedToLogin(without.json.audit_trail[0])).toBe(true);
  });
});
