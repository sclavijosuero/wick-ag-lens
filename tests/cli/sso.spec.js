const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { audit, attachScreenshots, selectorsFor } = require('../helpers/cli');
const {
  cliAuthSteps, ssoOrigins, SSO_STEPS, SSO_STEPS_WRONG_PASSWORD, isLoggedInSso, isBouncedToIdp,
} = require('../helpers/auth');

// SSO through the CLI. The protected page lives on the APP origin (127.0.0.1:<port>); when you are not signed in
// it redirects to a different IDENTITY PROVIDER origin (localhost:<port+1>), which sets its own cookie and sends
// the browser back to the app with an authorization code. See tests/fixtures/server.js.
//
// --login-url points at the protected page itself, so the browser is redirected to the IdP, exactly as a user's
// browser would be. The auth steps then run on the IdP's sign-in page and end back on the app.
const AUDITS = ['--audits', 'v-missing-alt'];
const protectedUrl = (baseURL) => `${baseURL}/sso/account.html`;

test.describe('CLI single sign-on (redirect to another origin)', { tag: ['@auth', '@sso'] }, () => {
  test('control: without logging in, the protected page redirects to the identity provider', async ({ baseURL }) => {
    const { report } = await audit(protectedUrl(baseURL), AUDITS);
    expect(isBouncedToIdp(report.audit_trail[0], baseURL)).toBe(true);
  });

  // Method 2 applied to SSO: --login-url is the protected page, --auth-step runs on the IdP pages and ends back on the app.
  test('SSO login: app -> IdP sign-in (2 screens) -> back to the app, logged in', async ({ baseURL }) => {
    const { report } = await audit(protectedUrl(baseURL), [
      ...AUDITS, '-s', '--login-url', protectedUrl(baseURL), ...cliAuthSteps(SSO_STEPS),
    ]);
    await attachScreenshots(report, 'sso-cli'); // the protected page after the round trip
    expect(isLoggedInSso(report.audit_trail[0], baseURL)).toBe(true);
    expect(report.audit_trail[0].url.startsWith(ssoOrigins(baseURL).app)).toBe(true); // back on the app origin
  });

  test('wrong password: the IdP keeps the user, so the app page is never reached', async ({ baseURL }) => {
    const { report } = await audit(protectedUrl(baseURL), [
      ...AUDITS, '--login-url', protectedUrl(baseURL), ...cliAuthSteps(SSO_STEPS_WRONG_PASSWORD),
    ]);
    expect(isBouncedToIdp(report.audit_trail[0], baseURL)).toBe(true);
  });

  test('SSO login, then --step: the session survives and only the new finding is reported', async ({ baseURL }) => {
    const { report } = await audit(protectedUrl(baseURL), [
      '--audits', 'v-missing-alt,v-empty-buttons',
      '--login-url', protectedUrl(baseURL), ...cliAuthSteps(SSO_STEPS),
      '--step', 'click::#open-settings',
    ]);
    expect(report.audit_trail).toHaveLength(2);
    expect(isLoggedInSso(report.audit_trail[0], baseURL)).toBe(true);
    expect(selectorsFor(report.audit_trail[1], 'v-empty-buttons')).toEqual(['#icon-only']);
    expect(selectorsFor(report.audit_trail[1], 'v-missing-alt')).toEqual([]); // not repeated
  });

  // Method 5 for SSO: -a saves the session of both origins, then -a alone replaces the whole SSO login.
  test('save once, reuse later: the saved state holds the cookies of BOTH origins and replaces the SSO login', async ({ baseURL }, testInfo) => {
    const state = testInfo.outputPath('sso-state.json');

    // Run 1: full SSO login, saved with -a
    const first = await audit(protectedUrl(baseURL), [
      ...AUDITS, '--login-url', protectedUrl(baseURL), ...cliAuthSteps(SSO_STEPS), '-a', state,
    ]);
    expect(isLoggedInSso(first.report.audit_trail[0], baseURL)).toBe(true);
    expect(first.stdout).toContain('[Auth] Saved session state to');

    // The app's session cookie AND the identity provider's own cookie are in the file (two different hosts)
    const cookies = JSON.parse(fs.readFileSync(state, 'utf8')).cookies;
    expect(cookies.map((c) => c.name)).toEqual(expect.arrayContaining(['wick_session', 'idp_session']));
    expect(new Set(cookies.map((c) => c.domain)).size).toBeGreaterThanOrEqual(2);

    // Run 2: no login at all, just the file. The app accepts the session, so the IdP is never visited.
    const second = await audit(protectedUrl(baseURL), [...AUDITS, '-a', state]);
    expect(isLoggedInSso(second.report.audit_trail[0], baseURL)).toBe(true);
    expect(second.stdout).not.toContain('[Auth]');
  });
});
