const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { audit, selectorsFor } = require('../helpers/cli');
const {
  CREDS, LOGIN_SCRIPT, COMPANY_STEPS, cliAuthSteps,
  writeHandmadeState, recordState, isLoggedIn, isBouncedToLogin,
} = require('../helpers/auth');

// Every test audits the protected /account.html. The server only serves it with a session cookie,
// and #private-img (no alt) only exists there, so "v-missing-alt on #private-img" == "audited logged in".
const AUDITS = ['--audits', 'v-missing-alt'];
const protectedUrl = (baseURL) => `${baseURL}/account.html`;

test.describe('CLI authentication', { tag: '@auth' }, () => {
  test('control: without credentials the protected page bounces to the sign-in page', async ({ baseURL }) => {
    const { report } = await audit(protectedUrl(baseURL), AUDITS);
    expect(isBouncedToLogin(report.audit_trail[0])).toBe(true);
  });

  // --- The login methods, one test each (flags in parentheses). Each audits /account.html and must land logged in. ---
  test('1. standard 2-field login (--login-url, -u, -p)', async ({ baseURL }) => {
    const { report } = await audit(protectedUrl(baseURL), [
      ...AUDITS, '--login-url', `${baseURL}/login-2field.html`, '-u', CREDS.user, '-p', CREDS.password,
    ]);
    expect(isLoggedIn(report.audit_trail[0])).toBe(true);
  });

  test('2a. multi-field form with an --auth-step pipeline (company, user, password)', async ({ baseURL }) => {
    const { report } = await audit(protectedUrl(baseURL), [
      ...AUDITS, '--login-url', `${baseURL}/login-company.html`, ...cliAuthSteps(COMPANY_STEPS),
    ]);
    expect(isLoggedIn(report.audit_trail[0])).toBe(true);
  });

  test('2b. SSO-style two-screen flow waits for the password field to appear', async ({ baseURL }) => {
    const { report } = await audit(protectedUrl(baseURL), [
      ...AUDITS, '--login-url', `${baseURL}/login-sso.html`,
      ...cliAuthSteps([
        'fill::#sso-user::' + CREDS.user,
        'click::#next',
        'wait::#sso-password',
        'fill::#sso-password::' + CREDS.password,
        'click::#signin',
      ]),
    ]);
    expect(isLoggedIn(report.audit_trail[0])).toBe(true);
  });

  test('3. custom login module (--auth-script)', async ({ baseURL }) => {
    process.env.WICK_FIXTURE_URL = baseURL; // read by the script; the CLI child process inherits it
    const { report } = await audit(protectedUrl(baseURL), [...AUDITS, '--auth-script', LOGIN_SCRIPT]);
    expect(isLoggedIn(report.audit_trail[0])).toBe(true);
  });

  // Method 5: no login at audit time, a session file recorded earlier is loaded (-a). 5a = handwritten file, 5b = real recording.
  test('5a. auth-state handoff: a handwritten Playwright/agent-browser storage state (-a)', async ({ baseURL }, testInfo) => {
    const state = writeHandmadeState(testInfo.outputPath('auth-state.json'));
    const { report } = await audit(protectedUrl(baseURL), [...AUDITS, '-a', state]);
    expect(isLoggedIn(report.audit_trail[0])).toBe(true);
  });

  test('5b. auth-state handoff: a session recorded by a real Playwright login (-a)', async ({ baseURL }, testInfo) => {
    const state = await recordState(testInfo.outputPath('recorded-state.json'), {
      loginUrl: `${baseURL}/login-2field.html`,
      fill: { '#user': CREDS.user, '#password': CREDS.password },
      submit: 'button[type="submit"]',
      waitUrl: '**/account.html',
    });
    const { report } = await audit(protectedUrl(baseURL), [...AUDITS, '-a', state]);
    expect(isLoggedIn(report.audit_trail[0])).toBe(true);
  });

  // --- Negative cases: a bad session or password must NOT end up logged in. ---
  test('an expired/invalid auth state does not log in', async ({ baseURL }, testInfo) => {
    const state = writeHandmadeState(testInfo.outputPath('expired-state.json'), { valid: false });
    const { report } = await audit(protectedUrl(baseURL), [...AUDITS, '-a', state]);
    expect(isBouncedToLogin(report.audit_trail[0])).toBe(true);
  });

  test('wrong password does not log in', async ({ baseURL }) => {
    const { report } = await audit(protectedUrl(baseURL), [
      ...AUDITS, '--login-url', `${baseURL}/login-2field.html`, '-u', CREDS.user, '-p', 'not-the-password',
    ]);
    expect(isBouncedToLogin(report.audit_trail[0])).toBe(true);
  });

  // Method 5 from the other side: any login method plus -a WRITES the session file, which later runs reuse with -a alone.
  // ---- Headless save (-a together with a login): log in once, reuse the session later with no login ----

  test('6. save once, reuse later: login + -a writes the state, then -a alone is logged in', async ({ baseURL }, testInfo) => {
    const state = testInfo.outputPath('saved-state.json');
    expect(fs.existsSync(state)).toBe(false);

    // Run 1: log in with credentials and save the session
    const first = await audit(protectedUrl(baseURL), [
      ...AUDITS, '--login-url', `${baseURL}/login-2field.html`, '-u', CREDS.user, '-p', CREDS.password, '-a', state,
    ]);
    expect(isLoggedIn(first.report.audit_trail[0])).toBe(true);
    expect(first.stdout).toContain('[Auth] Saved session state to');

    const saved = JSON.parse(fs.readFileSync(state, 'utf8'));
    expect(saved.cookies.map((c) => c.name)).toContain('wick_session');

    // Run 2: no credentials at all, just the saved file
    const second = await audit(protectedUrl(baseURL), [...AUDITS, '-a', state]);
    expect(isLoggedIn(second.report.audit_trail[0])).toBe(true);
    expect(second.stdout).not.toContain('[Auth]'); // no login was performed
  });

  test('6b. every login method can save: --auth-step pipeline and --auth-script', async ({ baseURL }, testInfo) => {
    const bySteps = testInfo.outputPath('by-steps.json');
    await audit(protectedUrl(baseURL), [
      ...AUDITS, '--login-url', `${baseURL}/login-company.html`, ...cliAuthSteps(COMPANY_STEPS), '-a', bySteps,
    ]);
    const reuseSteps = await audit(protectedUrl(baseURL), [...AUDITS, '-a', bySteps]);
    expect(isLoggedIn(reuseSteps.report.audit_trail[0])).toBe(true);

    process.env.WICK_FIXTURE_URL = baseURL;
    const byScript = testInfo.outputPath('by-script.json');
    await audit(protectedUrl(baseURL), [...AUDITS, '--auth-script', LOGIN_SCRIPT, '-a', byScript]);
    const reuseScript = await audit(protectedUrl(baseURL), [...AUDITS, '-a', byScript]);
    expect(isLoggedIn(reuseScript.report.audit_trail[0])).toBe(true);
  });

  test('6c. refresh: logging in again replaces an expired state file', async ({ baseURL }, testInfo) => {
    const state = writeHandmadeState(testInfo.outputPath('expired.json'), { valid: false });
    const stale = await audit(protectedUrl(baseURL), [...AUDITS, '-a', state]);
    expect(isBouncedToLogin(stale.report.audit_trail[0])).toBe(true);

    // login flags + -a: the expired session is replaced with a fresh one
    await audit(protectedUrl(baseURL), [
      ...AUDITS, '--login-url', `${baseURL}/login-2field.html`, '-u', CREDS.user, '-p', CREDS.password, '-a', state,
    ]);
    expect(JSON.parse(fs.readFileSync(state, 'utf8')).cookies.map((c) => c.value)).toContain('ok');

    const fresh = await audit(protectedUrl(baseURL), [...AUDITS, '-a', state]);
    expect(isLoggedIn(fresh.report.audit_trail[0])).toBe(true);
  });

  test('6d. a failed login saves nothing, so no logged-out file is written', async ({ baseURL }, testInfo) => {
    const state = testInfo.outputPath('never-written.json');
    const { stdout, report } = await audit(protectedUrl(baseURL), [
      ...AUDITS, '--login-url', `${baseURL}/login-2field.html`, '-u', CREDS.user, '-p', 'not-the-password', '-a', state,
    ]);
    expect(isBouncedToLogin(report.audit_trail[0])).toBe(true);
    expect(stdout).toContain('NOT writing');
    expect(fs.existsSync(state)).toBe(false);
  });

  test('6e. -a alone, without a login, never creates a file', async ({ baseURL }, testInfo) => {
    const state = testInfo.outputPath('not-created.json');
    await audit(protectedUrl(baseURL), [...AUDITS, '-a', state]);
    expect(fs.existsSync(state)).toBe(false);
  });

  test('6f. the saved file is owner-only on POSIX systems', async ({ baseURL }, testInfo) => {
    test.skip(process.platform === 'win32', 'POSIX file modes do not apply on Windows');
    const state = testInfo.outputPath('private.json');
    await audit(protectedUrl(baseURL), [
      ...AUDITS, '--login-url', `${baseURL}/login-2field.html`, '-u', CREDS.user, '-p', CREDS.password, '-a', state,
    ]);
    expect(fs.statSync(state).mode & 0o777).toBe(0o600);
  });

  // --- A login followed by --step: the session must survive the interaction. ---
  test('auth then --step: the session survives and only the new finding is reported', async ({ baseURL }) => {
    const { report } = await audit(protectedUrl(baseURL), [
      '--audits', 'v-missing-alt,v-empty-buttons',
      '--login-url', `${baseURL}/login-company.html`, ...cliAuthSteps(COMPANY_STEPS),
      '--step', 'click::#open-settings',
    ]);
    expect(report.audit_trail).toHaveLength(2);
    expect(isLoggedIn(report.audit_trail[0])).toBe(true);
    expect(report.audit_trail[1].url).toMatch(/\/account\.html$/);
    expect(selectorsFor(report.audit_trail[1], 'v-empty-buttons')).toEqual(['#icon-only']);
    expect(selectorsFor(report.audit_trail[1], 'v-missing-alt')).toEqual([]); // not repeated
  });
});
