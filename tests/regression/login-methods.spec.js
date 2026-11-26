const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { available } = require('../helpers/agent-browser');
const { MEDIUM } = require('../helpers/scenarios');
const { METHODS } = require('../helpers/login-matrix');
const { expectGolden } = require('../helpers/golden');
const { runCli, runMcp, runAgentBrowser } = require('../helpers/runners');
const { audit } = require('../helpers/cli');
const { connectMcp, callTool } = require('../helpers/mcp');
const { CREDS, LOGIN_SCRIPT, COMPANY_STEPS, SSO_STEPS, SSO_STEPS_WRONG_PASSWORD, cliAuthSteps, toMcpSteps, isLoggedIn, isBouncedToLogin, isLoggedInSso, isBouncedToIdp } = require('../helpers/auth');

// THE LOGIN SHOWCASE: the model to copy when configuring a login. One short journey (the first 3 steps of the medium journey, on
// the protected copy of the shop page), run through each way of logging in, in the CLI and in the MCP server. Each run must give
// exactly the same findings as the same journey without a login (tests/golden/medium.json, first 4 entries): the login must
// never change the audit. Each test attaches the exact command or tool arguments, and the method list is defined once in
// helpers/login-matrix.js; cli/docs/auth-examples.md shows the same commands.
//
//   1  standard 2-field login          --login-url -u -p              (MCP: loginUrl, user, pass)
//   2  multi-field form                --auth-step pipeline           (MCP: authSteps)
//   2  single sign-on, another origin  --auth-step pipeline           (MCP: authSteps)
//   3  custom login module             --auth-script                  (MCP: authScript)
//   5  saved session                   -a state.json                  (MCP: authState); recorded by Playwright or agent-browser
//   (4, interactive capture with -i, needs a person at a visible browser, so it is not here.)
const STEPS = MEDIUM.steps.slice(0, 3);
const SHOWN = STEPS.length + 1;                                       // the baseline plus the steps
const protectedUrl = (base) => `${base}/app/journey.html`;
const loggedIn = (report) => expect(report.audit_trail.every((s) => s.url.endsWith('/app/journey.html'))).toBe(true);

for (const method of METHODS) {
  test.describe(`login ${method.title}`, { tag: ['@logins', '@auth', '@a11y-auth'] }, () => {
    let state; let base;
    test.beforeAll(async ({ baseURL }, info) => {
      base = baseURL;
      process.env.WICK_FIXTURE_URL = baseURL;                         // read by the --auth-script module
      state = method.prepare ? await method.prepare(baseURL, info) : undefined;
      await info.attach('login-method', { body: `${method.title}\n\n${method.how}`, contentType: 'text/plain' });
    });

    test('CLI', { tag: '@cli' }, async () => {
      const { report } = await runCli(MEDIUM, { url: protectedUrl(base) }, { extra: method.cli(base, state), steps: STEPS });
      loggedIn(report);
      expectGolden(report, 'medium', { steps: SHOWN });
    });

    test('MCP', { tag: '@mcp' }, async () => {
      const { report } = await runMcp(MEDIUM, { url: protectedUrl(base) }, { loginArgs: method.mcp(base, state), steps: STEPS });
      loggedIn(report);
      expectGolden(report, 'medium', { steps: SHOWN });
    });
  });
}

// Method 5 with agent-browser doing the sign-in: the session it saves (`state save`) is audited by the CLI and by MCP.
test.describe('login 5. saved session recorded by agent-browser', { tag: ['@logins', '@auth', '@a11y-auth', '@agent-browser'] }, () => {
  test.skip(!available, 'agent-browser is not installed (npm install in the repo root)');
  for (const via of ['cli', 'mcp']) {
    test(via.toUpperCase(), async ({ baseURL }, testInfo) => {
      const target = MEDIUM.target('auth', baseURL);
      const { report } = await runAgentBrowser(MEDIUM, target, testInfo, { steps: STEPS, via });
      loggedIn(report);
      expectGolden(report, 'medium', { steps: SHOWN });
    });
  }
});

// What must NOT log in: no credentials, a wrong password, an expired session. The audit lands on the sign-in page instead.
test.describe('login failures', { tag: ['@logins', '@auth'] }, () => {
  test('CLI: no credentials, a wrong password and an expired session all bounce to the sign-in page', { tag: '@cli' }, async ({ baseURL }, testInfo) => {
    const url = `${baseURL}/account.html`;
    const A = ['--audits', 'v-missing-alt'];
    expect(isBouncedToLogin((await audit(url, A)).report.audit_trail[0])).toBe(true);
    const wrong = await audit(url, [...A, '--login-url', `${baseURL}/login-2field.html`, '-u', CREDS.user, '-p', 'not-the-password']);
    expect(isBouncedToLogin(wrong.report.audit_trail[0])).toBe(true);
    const { writeHandmadeState } = require('../helpers/auth');
    const expired = writeHandmadeState(testInfo.outputPath('expired-state.json'), { valid: false });
    expect(isBouncedToLogin((await audit(url, [...A, '-a', expired])).report.audit_trail[0])).toBe(true);
  });

  test('MCP: no credentials, a wrong password and a missing login script', { tag: '@mcp' }, async ({ baseURL }) => {
    const client = await connectMcp();
    try {
      const url = `${baseURL}/account.html`;
      const base = (args) => callTool(client, 'audit_baseline', { requestedAudits: ['v-missing-alt'], url, ...args });
      expect(isBouncedToLogin((await base({})).json.audit_trail[0])).toBe(true);
      const wrong = await base({ loginUrl: `${baseURL}/login-2field.html`, user: CREDS.user, pass: 'not-the-password' });
      expect(isBouncedToLogin(wrong.json.audit_trail[0])).toBe(true);
      const missing = await base({ authScript: 'C:/definitely/not/here.mjs' });
      expect(missing.isError).toBe(true);
    } finally { await client.close(); }
  });

  test('CLI: single sign-on with a wrong password stays on the identity provider (a different origin), the right one gets in', { tag: '@cli' }, async ({ baseURL }) => {
    const url = `${baseURL}/sso/account.html`;
    const A = ['--audits', 'v-missing-alt', '--login-url', url];
    const wrong = await audit(url, [...A, ...cliAuthSteps(SSO_STEPS_WRONG_PASSWORD)]);
    expect(isBouncedToIdp(wrong.report.audit_trail[0], baseURL)).toBe(true);
    const right = await audit(url, [...A, ...cliAuthSteps(SSO_STEPS)]);
    expect(isLoggedInSso(right.report.audit_trail[0], baseURL)).toBe(true);
  });
});

// Save once, reuse later: any login plus -a (MCP: saveAuthState) writes the session file, and later runs use it alone.
test.describe('save the session once, reuse it later', { tag: ['@logins', '@auth'] }, () => {
  test('CLI: login + -a writes the file; -a alone reuses it; a failed login and -a alone write nothing', { tag: '@cli' }, async ({ baseURL }, testInfo) => {
    const url = `${baseURL}/account.html`;
    const A = ['--audits', 'v-missing-alt'];
    const state = testInfo.outputPath('saved-state.json');
    const first = await audit(url, [...A, '--login-url', `${baseURL}/login-2field.html`, '-u', CREDS.user, '-p', CREDS.password, '-a', state]);
    expect(isLoggedIn(first.report.audit_trail[0])).toBe(true);
    expect(first.stdout).toContain('[Auth] Saved session state to');
    expect(JSON.parse(fs.readFileSync(state, 'utf8')).cookies.map((c) => c.name)).toContain('wick_session');

    const second = await audit(url, [...A, '-a', state]);                           // no credentials at all
    expect(isLoggedIn(second.report.audit_trail[0])).toBe(true);
    expect(second.stdout).not.toContain('[Auth]');

    const failed = testInfo.outputPath('never-written.json');                       // a failed login saves nothing
    const bad = await audit(url, [...A, '--login-url', `${baseURL}/login-2field.html`, '-u', CREDS.user, '-p', 'not-the-password', '-a', failed]);
    expect(isBouncedToLogin(bad.report.audit_trail[0])).toBe(true);
    expect(bad.stdout).toContain('NOT writing');
    expect(fs.existsSync(failed)).toBe(false);

    const loadOnly = testInfo.outputPath('not-created.json');                       // -a alone never creates a file
    await audit(url, [...A, '-a', loadOnly]);
    expect(fs.existsSync(loadOnly)).toBe(false);

    process.env.WICK_FIXTURE_URL = baseURL;                                         // the other methods can save too
    const byScript = testInfo.outputPath('by-script.json');
    await audit(url, [...A, '--auth-script', LOGIN_SCRIPT, '-a', byScript]);
    expect(isLoggedIn((await audit(url, [...A, '-a', byScript])).report.audit_trail[0])).toBe(true);
    const bySteps = testInfo.outputPath('by-steps.json');
    await audit(url, [...A, '--login-url', `${baseURL}/login-company.html`, ...cliAuthSteps(COMPANY_STEPS), '-a', bySteps]);
    expect(isLoggedIn((await audit(url, [...A, '-a', bySteps])).report.audit_trail[0])).toBe(true);
  });

  test('MCP: saveAuthState writes the file; authState alone reuses it; a failed login and a missing login are reported', { tag: '@mcp' }, async ({ baseURL }, testInfo) => {
    const client = await connectMcp({ WICK_FIXTURE_URL: baseURL });
    try {
      const url = `${baseURL}/account.html`;
      const base = (args) => callTool(client, 'audit_baseline', { requestedAudits: ['v-missing-alt'], url, ...args });
      const state = testInfo.outputPath('saved-state.json');
      const first = await base({ loginUrl: `${baseURL}/login-2field.html`, user: CREDS.user, pass: CREDS.password, saveAuthState: state });
      expect(isLoggedIn(first.json.audit_trail[0])).toBe(true);
      expect(first.json.auth_state).toMatchObject({ saved: true });
      expect(JSON.parse(fs.readFileSync(state, 'utf8')).cookies.map((c) => c.name)).toContain('wick_session');

      const second = await base({ authState: state });                              // no login arguments
      expect(isLoggedIn(second.json.audit_trail[0])).toBe(true);
      expect(second.json.auth_state).toBeUndefined();

      const failed = testInfo.outputPath('never-written.json');
      const bad = await base({ loginUrl: `${baseURL}/login-2field.html`, user: CREDS.user, pass: 'not-the-password', saveAuthState: failed });
      expect(bad.json.auth_state).toMatchObject({ saved: false });
      expect(fs.existsSync(failed)).toBe(false);

      const noLogin = await base({ saveAuthState: testInfo.outputPath('not-created.json') });   // nothing to save: rejected before anything runs
      expect(noLogin.isError).toBe(true);
      expect(noLogin.text).toContain('saveAuthState needs a login to save');

      const byScript = testInfo.outputPath('by-script.json');
      expect((await base({ authScript: LOGIN_SCRIPT, saveAuthState: byScript })).json.auth_state.saved).toBe(true);
      expect(isLoggedIn((await base({ authState: byScript })).json.audit_trail[0])).toBe(true);
      const bySteps = testInfo.outputPath('by-steps.json');
      await base({ loginUrl: `${baseURL}/login-company.html`, authSteps: toMcpSteps(COMPANY_STEPS), saveAuthState: bySteps });
      expect(isLoggedIn((await base({ authState: bySteps })).json.audit_trail[0])).toBe(true);
    } finally { await client.close(); }
  });
});
