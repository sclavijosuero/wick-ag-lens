const { test, expect } = require('@playwright/test');
const { audit } = require('../helpers/cli');
const { connectMcp, callTool } = require('../helpers/mcp');
const { cliAuthSteps, toMcpSteps, recordState } = require('../helpers/auth');

// OPT-IN live checks against a public training site that has a real login:
//   "Abi's Testing Dojo"  https://abi-testing-dojo-demo.azurewebsites.net/
// Its login page publishes the demo credentials for exactly this purpose (company / user / password).
// Skipped by default: it needs internet access, the site can be down, and it resets every Monday 00:00 UTC.
//   Run:  WICK_LIVE=1 npm run test:auth        (PowerShell: $env:WICK_LIVE=1; npm run test:auth)
const LIVE = !!process.env.WICK_LIVE;
const SITE = process.env.WICK_LIVE_ABI_URL || 'https://abi-testing-dojo-demo.azurewebsites.net';
const CREDS = {
  company: process.env.WICK_LIVE_ABI_COMPANY || 'Northwind',
  user: process.env.WICK_LIVE_ABI_USER || 'jdoe',
  password: process.env.WICK_LIVE_ABI_PASSWORD || 'Admin+123',
};
const STEPS = [
  `fill::#company::${CREDS.company}`,
  `fill::#user::${CREDS.user}`,
  `fill::#password::${CREDS.password}`,
  'click::#btn-login',
];
const DASHBOARD = '/accounts-receivable/dashboard';

test.describe('Live auth: Abi\'s Testing Dojo', { tag: ['@auth', '@live'] }, () => {
  test.skip(!LIVE, 'Opt-in: set WICK_LIVE=1 to run the checks against the public Abi\'s Testing Dojo site');
  test.setTimeout(150_000);

  test('CLI: multi-field login (company, user, password) lands on the dashboard', async () => {
    const { report } = await audit(`${SITE}/`, [
      '--audits', 'v-doc-title', '--login-url', `${SITE}/login`, ...cliAuthSteps(STEPS), '--wait-ms', '3000',
    ]);
    expect(report.audit_trail[0].url).toContain(DASHBOARD);
  });

  test('CLI: without logging in, the dashboard is not reachable', async () => {
    const { report } = await audit(`${SITE}${DASHBOARD}`, ['--audits', 'v-doc-title', '--wait-ms', '3000']);
    expect(report.audit_trail[0].url).not.toContain(DASHBOARD);
  });

  test('CLI: auth-state handoff from a session recorded by Playwright (-a)', async ({}, testInfo) => {
    const state = await recordState(testInfo.outputPath('abi-state.json'), {
      loginUrl: `${SITE}/login`,
      fill: { '#company': CREDS.company, '#user': CREDS.user, '#password': CREDS.password },
      submit: '#btn-login',
      waitUrl: `**${DASHBOARD}`,
    });
    const { report } = await audit(`${SITE}${DASHBOARD}`, ['--audits', 'v-doc-title', '--wait-ms', '3000', '-a', state]);
    expect(report.audit_trail[0].url).toContain(DASHBOARD);
  });

  test('MCP: audit_baseline with authSteps lands on the dashboard', async () => {
    const client = await connectMcp();
    try {
      const res = await callTool(client, 'audit_baseline', {
        url: `${SITE}/`, loginUrl: `${SITE}/login`, authSteps: toMcpSteps(STEPS),
        requestedAudits: ['v-doc-title'], waitMs: 3000,
      });
      expect(res.isError).toBe(false);
      expect(res.json.audit_trail[0].url).toContain(DASHBOARD);
    } finally {
      await client.close();
    }
  });
});
