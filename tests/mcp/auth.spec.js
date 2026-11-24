const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { connectMcp, callTool } = require('../helpers/mcp');
const { selectorsFor } = require('../helpers/cli');
const {
  CREDS, LOGIN_SCRIPT, COMPANY_STEPS, toMcpSteps,
  writeHandmadeState, recordState, isLoggedIn, isBouncedToLogin,
} = require('../helpers/auth');

// Same scenarios as tests/cli/auth.spec.js, driven through the MCP tool arguments of audit_baseline:
//   loginUrl + user/pass | loginUrl + authSteps | authScript | authState
// The protected /account.html only serves a session cookie holder, and #private-img (no alt) lives only there.
const AUDITS = ['v-missing-alt'];

test.describe('MCP authentication (audit_baseline)', { tag: '@auth' }, () => {
  let client;
  test.beforeEach(async ({ baseURL }) => { client = await connectMcp({ WICK_FIXTURE_URL: baseURL }); });
  test.afterEach(async () => { await client?.close(); });

  const baseline = (args) => callTool(client, 'audit_baseline', { requestedAudits: AUDITS, ...args });
  const firstStep = (res) => res.json.audit_trail[0];

  test('control: without credentials the protected page bounces to the sign-in page', async ({ baseURL }) => {
    const res = await baseline({ url: `${baseURL}/account.html` });
    expect(res.isError).toBe(false);
    expect(isBouncedToLogin(firstStep(res))).toBe(true);
  });

  test('1. standard 2-field login (loginUrl + user + pass)', async ({ baseURL }) => {
    const res = await baseline({
      url: `${baseURL}/account.html`, loginUrl: `${baseURL}/login-2field.html`,
      user: CREDS.user, pass: CREDS.password,
    });
    expect(res.isError).toBe(false);
    expect(isLoggedIn(firstStep(res))).toBe(true);
  });

  test('2a. multi-field form with an authSteps pipeline', async ({ baseURL }) => {
    const res = await baseline({
      url: `${baseURL}/account.html`, loginUrl: `${baseURL}/login-company.html`,
      authSteps: toMcpSteps(COMPANY_STEPS),
    });
    expect(res.isError).toBe(false);
    expect(isLoggedIn(firstStep(res))).toBe(true);
  });

  test('2b. SSO-style two-screen flow waits for the password field to appear', async ({ baseURL }) => {
    const res = await baseline({
      url: `${baseURL}/account.html`, loginUrl: `${baseURL}/login-sso.html`,
      authSteps: toMcpSteps([
        'fill::#sso-user::' + CREDS.user,
        'click::#next',
        'wait::#sso-password',
        'fill::#sso-password::' + CREDS.password,
        'click::#signin',
      ]),
    });
    expect(res.isError).toBe(false);
    expect(isLoggedIn(firstStep(res))).toBe(true);
  });

  test('3. custom login module (authScript)', async ({ baseURL }) => {
    const res = await baseline({ url: `${baseURL}/account.html`, authScript: LOGIN_SCRIPT });
    expect(res.isError).toBe(false);
    expect(isLoggedIn(firstStep(res))).toBe(true);
  });

  test('5a. auth-state handoff: a handwritten Playwright/agent-browser storage state (authState)', async ({ baseURL }, testInfo) => {
    const state = writeHandmadeState(testInfo.outputPath('auth-state.json'));
    const res = await baseline({ url: `${baseURL}/account.html`, authState: state });
    expect(res.isError).toBe(false);
    expect(isLoggedIn(firstStep(res))).toBe(true);
  });

  test('5b. auth-state handoff: a session recorded by a real Playwright login (authState)', async ({ baseURL }, testInfo) => {
    const state = await recordState(testInfo.outputPath('recorded-state.json'), {
      loginUrl: `${baseURL}/login-2field.html`,
      fill: { '#user': CREDS.user, '#password': CREDS.password },
      submit: 'button[type="submit"]',
      waitUrl: '**/account.html',
    });
    const res = await baseline({ url: `${baseURL}/account.html`, authState: state });
    expect(res.isError).toBe(false);
    expect(isLoggedIn(firstStep(res))).toBe(true);
  });

  test('an expired/invalid auth state does not log in', async ({ baseURL }, testInfo) => {
    const state = writeHandmadeState(testInfo.outputPath('expired-state.json'), { valid: false });
    const res = await baseline({ url: `${baseURL}/account.html`, authState: state });
    expect(isBouncedToLogin(firstStep(res))).toBe(true);
  });

  test('wrong password does not log in', async ({ baseURL }) => {
    const res = await baseline({
      url: `${baseURL}/account.html`, loginUrl: `${baseURL}/login-2field.html`,
      user: CREDS.user, pass: 'not-the-password',
    });
    expect(isBouncedToLogin(firstStep(res))).toBe(true);
  });

  test('a missing authScript file is reported as a tool error', async ({ baseURL }) => {
    const res = await baseline({ url: `${baseURL}/account.html`, authScript: 'C:/definitely/not/here.mjs' });
    expect(res.isError).toBe(true);
    expect(res.text).toContain('Error executing audit_baseline');
  });

  // ---- Headless save (saveAuthState): log in once, reuse the session later through authState ----

  test('6. save once, reuse later: saveAuthState writes the state, then authState alone is logged in', async ({ baseURL }, testInfo) => {
    const state = testInfo.outputPath('saved-state.json');
    expect(fs.existsSync(state)).toBe(false);

    // Session 1: log in and save. The reply reports what was written (additive "auth_state" key).
    const first = await baseline({
      url: `${baseURL}/account.html`, loginUrl: `${baseURL}/login-2field.html`,
      user: CREDS.user, pass: CREDS.password, saveAuthState: state,
    });
    expect(first.isError).toBe(false);
    expect(isLoggedIn(firstStep(first))).toBe(true);
    expect(first.json.auth_state).toMatchObject({ saved: true });
    expect(first.json.auth_state.cookies).toBeGreaterThan(0);
    expect(JSON.parse(fs.readFileSync(state, 'utf8')).cookies.map((c) => c.name)).toContain('wick_session');

    // Session 2: a brand-new baseline, no login arguments, just the saved file
    const second = await baseline({ url: `${baseURL}/account.html`, authState: state });
    expect(second.isError).toBe(false);
    expect(isLoggedIn(firstStep(second))).toBe(true);
    expect(second.json.auth_state).toBeUndefined(); // only present when saveAuthState was requested
  });

  test('6b. saveAuthState works with authSteps and with authScript', async ({ baseURL }, testInfo) => {
    const bySteps = testInfo.outputPath('by-steps.json');
    const a = await baseline({
      url: `${baseURL}/account.html`, loginUrl: `${baseURL}/login-company.html`,
      authSteps: toMcpSteps(COMPANY_STEPS), saveAuthState: bySteps,
    });
    expect(a.json.auth_state.saved).toBe(true);
    expect(isLoggedIn(firstStep(await baseline({ url: `${baseURL}/account.html`, authState: bySteps })))).toBe(true);

    const byScript = testInfo.outputPath('by-script.json');
    const b = await baseline({ url: `${baseURL}/account.html`, authScript: LOGIN_SCRIPT, saveAuthState: byScript });
    expect(b.json.auth_state.saved).toBe(true);
    expect(isLoggedIn(firstStep(await baseline({ url: `${baseURL}/account.html`, authState: byScript })))).toBe(true);
  });

  test('6c. a failed login reports saved:false and writes nothing', async ({ baseURL }, testInfo) => {
    const state = testInfo.outputPath('never-written.json');
    const res = await baseline({
      url: `${baseURL}/account.html`, loginUrl: `${baseURL}/login-2field.html`,
      user: CREDS.user, pass: 'not-the-password', saveAuthState: state,
    });
    expect(res.isError).toBe(false);
    expect(isBouncedToLogin(firstStep(res))).toBe(true);
    expect(res.json.auth_state).toMatchObject({ saved: false });
    expect(res.json.auth_state.reason).toContain('no cookies');
    expect(fs.existsSync(state)).toBe(false);
  });

  test('6d. saveAuthState without any login method is rejected before anything runs', async ({ baseURL }, testInfo) => {
    const state = testInfo.outputPath('not-created.json');
    const res = await baseline({ url: `${baseURL}/account.html`, saveAuthState: state });
    expect(res.isError).toBe(true);
    expect(res.text).toContain('saveAuthState needs a login to save');
    expect(fs.existsSync(state)).toBe(false);
  });

  test('authState only loads: it never creates or writes a file', async ({ baseURL }, testInfo) => {
    const state = testInfo.outputPath('load-only.json');
    await baseline({ url: `${baseURL}/account.html`, authState: state });
    expect(fs.existsSync(state)).toBe(false);
  });

  test('login, then interact_and_diff keeps the session and reports only the new finding', async ({ baseURL }) => {
    const base = await baseline({
      url: `${baseURL}/account.html`, requestedAudits: ['v-missing-alt', 'v-empty-buttons'],
      loginUrl: `${baseURL}/login-company.html`, authSteps: toMcpSteps(COMPANY_STEPS),
    });
    expect(isLoggedIn(firstStep(base))).toBe(true);

    const diff = await callTool(client, 'interact_and_diff', {
      action: 'click', target: '#open-settings', requestedAudits: ['v-missing-alt', 'v-empty-buttons'],
    });
    expect(diff.isError).toBe(false);
    expect(diff.json.step).toBe(2);
    expect(diff.json.url).toMatch(/\/account\.html$/);
    expect(selectorsFor(diff.json, 'v-empty-buttons')).toEqual(['#icon-only']);
    expect(selectorsFor(diff.json, 'v-missing-alt')).toEqual([]); // already reported at the baseline
  });
});
