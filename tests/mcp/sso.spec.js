const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { connectMcp, callTool } = require('../helpers/mcp');
const { selectorsFor, attachScreenshots } = require('../helpers/cli');
const {
  toMcpSteps, ssoOrigins, SSO_STEPS, SSO_STEPS_WRONG_PASSWORD, isLoggedInSso, isBouncedToIdp,
} = require('../helpers/auth');

// SSO through the MCP tools. Same fixture and flow as tests/cli/sso.spec.js: the protected page is on the app
// origin and redirects to an identity provider on another origin. loginUrl is the protected page itself.
const AUDITS = ['v-missing-alt'];

test.describe('MCP single sign-on (redirect to another origin)', { tag: ['@auth', '@sso'] }, () => {
  let client;
  test.beforeEach(async () => { client = await connectMcp(); });
  test.afterEach(async () => { await client?.close(); });

  const protectedUrl = (baseURL) => `${baseURL}/sso/account.html`;
  const baseline = (args) => callTool(client, 'audit_baseline', { requestedAudits: AUDITS, ...args });
  const firstStep = (res) => res.json.audit_trail[0];

  test('control: without logging in, the protected page redirects to the identity provider', async ({ baseURL }) => {
    const res = await baseline({ url: protectedUrl(baseURL) });
    expect(res.isError).toBe(false);
    expect(isBouncedToIdp(firstStep(res), baseURL)).toBe(true);
  });

  // Method 2 applied to SSO: loginUrl is the protected page, authSteps run on the IdP pages and end back on the app.
  test('SSO login: loginUrl + authSteps walk through the IdP and come back logged in', async ({ baseURL }) => {
    const res = await baseline({
      url: protectedUrl(baseURL), loginUrl: protectedUrl(baseURL),
      authSteps: toMcpSteps(SSO_STEPS), includeScreenshot: true,
    });
    expect(res.isError).toBe(false);
    await attachScreenshots(res.json, 'sso-mcp');
    expect(isLoggedInSso(firstStep(res), baseURL)).toBe(true);
    expect(firstStep(res).url.startsWith(ssoOrigins(baseURL).app)).toBe(true);
  });

  test('wrong password: the IdP keeps the user, so the app page is never reached', async ({ baseURL }) => {
    const res = await baseline({
      url: protectedUrl(baseURL), loginUrl: protectedUrl(baseURL), authSteps: toMcpSteps(SSO_STEPS_WRONG_PASSWORD),
    });
    expect(isBouncedToIdp(firstStep(res), baseURL)).toBe(true);
  });

  test('SSO login, then interact_and_diff keeps the session and reports only the new finding', async ({ baseURL }) => {
    const filters = { requestedAudits: ['v-missing-alt', 'v-empty-buttons'] };
    const base = await baseline({
      url: protectedUrl(baseURL), loginUrl: protectedUrl(baseURL), authSteps: toMcpSteps(SSO_STEPS), ...filters,
    });
    expect(isLoggedInSso(firstStep(base), baseURL)).toBe(true);

    const diff = await callTool(client, 'interact_and_diff', { action: 'click', target: '#open-settings', ...filters });
    expect(diff.isError).toBe(false);
    expect(selectorsFor(diff.json, 'v-empty-buttons')).toEqual(['#icon-only']);
    expect(selectorsFor(diff.json, 'v-missing-alt')).toEqual([]); // already reported at the baseline
  });

  // Method 5 for SSO: saveAuthState keeps both origins, then authState alone replaces the login.
  test('saveAuthState after SSO keeps the cookies of both origins; authState alone then replaces the login', async ({ baseURL }, testInfo) => {
    const state = testInfo.outputPath('sso-state.json');

    const first = await baseline({
      url: protectedUrl(baseURL), loginUrl: protectedUrl(baseURL),
      authSteps: toMcpSteps(SSO_STEPS), saveAuthState: state,
    });
    expect(isLoggedInSso(firstStep(first), baseURL)).toBe(true);
    expect(first.json.auth_state).toMatchObject({ saved: true });
    expect(first.json.auth_state.cookies).toBeGreaterThanOrEqual(2); // app session + identity provider session

    const cookies = JSON.parse(fs.readFileSync(state, 'utf8')).cookies;
    expect(cookies.map((c) => c.name)).toEqual(expect.arrayContaining(['wick_session', 'idp_session']));

    // a brand-new baseline with just the file: no login arguments, the IdP is never visited
    const second = await baseline({ url: protectedUrl(baseURL), authState: state });
    expect(isLoggedInSso(firstStep(second), baseURL)).toBe(true);
  });
});
