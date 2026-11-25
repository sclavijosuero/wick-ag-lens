const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { AgentBrowser, available } = require('../helpers/agent-browser');
const { audit, attachScreenshots, selectorsFor } = require('../helpers/cli');
const {
  CREDS, ssoOrigins, isLoggedIn, isBouncedToLogin, isLoggedInSso, isBouncedToIdp,
} = require('../helpers/auth');

// The documented workflow (cli/README.md "Integrating with agent-browser"):
//   1. agent-browser signs in through the real UI and runs `state save`
//   2. wick-ag-lens audits the protected page with `-a <state file>` and lands on the logged-in page
// The session cookie is the ONLY thing handed over: wick-ag-lens starts its own browser and loads the URL again.
test.skip(!available, 'agent-browser is not installed (npm install in the repo root)');

const AUDITS = ['--audits', 'v-missing-alt']; // #private-img (no alt) exists only on the logged-in page

test.describe('agent-browser -> CLI session handoff', { tag: ['@auth', '@agent-browser'] }, () => {
  let ab;
  test.beforeEach(() => { ab = new AgentBrowser(); });
  test.afterEach(async () => { await ab.close(); });

  // Helper: agent-browser signs in through the real 2-field page (same form as login method 1).
  const signIn2Field = async (baseURL, password = CREDS.password) => {
    await ab.run(['open', `${baseURL}/login-2field.html`]);
    await ab.run(['fill', '#user', CREDS.user]);
    await ab.run(['fill', '#password', password]);
    await ab.run(['click', 'button[type=submit]']);
  };

  // Control: no saved state -> the protected page bounces to sign-in.
  test('control: without the saved state the protected page bounces to the sign-in page', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/account.html`, AUDITS);
    expect(isBouncedToLogin(report.audit_trail[0])).toBe(true);
  });

  // agent-browser logs in and runs `state save`; the CLI then loads that file with -a (method 5).
  test('2-field login in agent-browser, then audit the dashboard with -a', async ({ baseURL }, testInfo) => {
    await signIn2Field(baseURL);
    await ab.run(['wait', '--url', '**/account.html']);

    // what agent-browser sees (attached to the report)
    const shot = testInfo.outputPath('agent-browser-dashboard.png');
    await ab.run(['screenshot', shot]);
    await testInfo.attach('agent-browser-dashboard', { path: shot, contentType: 'image/png' });

    const stateFile = testInfo.outputPath('state.json');
    await ab.run(['state', 'save', stateFile]);

    const { report } = await audit(`${baseURL}/account.html`, [...AUDITS, '-s', '-a', stateFile]);
    await attachScreenshots(report, 'wick-dashboard');          // what wick-ag-lens audited
    expect(isLoggedIn(report.audit_trail[0])).toBe(true);
  });

  // The loaded session must also survive --step interactions.
  test('the handed-over session survives --step interactions', async ({ baseURL }, testInfo) => {
    await signIn2Field(baseURL);
    await ab.run(['wait', '--url', '**/account.html']);
    const stateFile = testInfo.outputPath('state.json');
    await ab.run(['state', 'save', stateFile]);

    const { report } = await audit(`${baseURL}/account.html`, [
      '--audits', 'v-missing-alt,v-empty-buttons', '-a', stateFile, '--step', 'click::#open-settings',
    ]);
    expect(report.audit_trail).toHaveLength(2);
    expect(isLoggedIn(report.audit_trail[0])).toBe(true);
    expect(selectorsFor(report.audit_trail[1], 'v-empty-buttons')).toEqual(['#icon-only']);
  });

  // Same handoff for the 3-field form (the form method 2 pipelines handle).
  test('multi-field (company + user + password) login in agent-browser', async ({ baseURL }, testInfo) => {
    await ab.run(['open', `${baseURL}/login-company.html`]);
    await ab.run(['fill', '#company', CREDS.company]);
    await ab.run(['fill', '#user', CREDS.user]);
    await ab.run(['fill', '#password', CREDS.password]);
    await ab.run(['click', '#btn-login']);
    await ab.run(['wait', '--url', '**/account.html']);
    const stateFile = testInfo.outputPath('state.json');
    await ab.run(['state', 'save', stateFile]);

    const { report } = await audit(`${baseURL}/account.html`, [...AUDITS, '-a', stateFile]);
    expect(isLoggedIn(report.audit_trail[0])).toBe(true);
  });

  // Same handoff after an SSO round trip through the identity provider (cookies of the app origin are kept).
  test('SSO: agent-browser follows the redirect to the identity provider and back, then hands over', async ({ baseURL }, testInfo) => {
    const url = `${baseURL}/sso/account.html`;
    await ab.run(['open', url]);                                   // redirected to the IdP (another origin)
    await ab.run(['fill', '#idp-user', CREDS.user]);
    await ab.run(['click', '#idp-next']);
    await ab.run(['wait', '#idp-password']);
    await ab.run(['fill', '#idp-password', CREDS.password]);
    await ab.run(['click', '#idp-signin']);
    await ab.run(['wait', '#welcome']);                            // only exists on the app page after the round trip
    const stateFile = testInfo.outputPath('state.json');
    await ab.run(['state', 'save', stateFile]);

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    expect(state.cookies.map((c) => c.domain)).toContain(new URL(ssoOrigins(baseURL).app).hostname);

    const { report } = await audit(url, [...AUDITS, '-a', stateFile]);
    expect(isLoggedInSso(report.audit_trail[0], baseURL)).toBe(true);
  });

  test('SSO control: without the saved state the audit ends on the identity provider', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/sso/account.html`, AUDITS);
    expect(isBouncedToIdp(report.audit_trail[0], baseURL)).toBe(true);
  });

  // Negative: a session saved after a failed login must not grant access.
  test('a state saved after a FAILED login does not grant access', async ({ baseURL }, testInfo) => {
    await signIn2Field(baseURL, 'not-the-password');
    await ab.run(['wait', '--url', '**/login-failed.html']);
    const stateFile = testInfo.outputPath('state.json');
    await ab.run(['state', 'save', stateFile]);

    const { report } = await audit(`${baseURL}/account.html`, [...AUDITS, '-a', stateFile]);
    expect(isBouncedToLogin(report.audit_trail[0])).toBe(true);
  });
});
