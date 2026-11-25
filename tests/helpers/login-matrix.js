// The documented login mechanisms (cli/README.md "Authentication Strategies"), each described ONCE as
//   - how the CLI is called            (cli:  extra command-line arguments)
//   - how the MCP tool is called       (mcp:  extra audit_baseline arguments)
// so the exact same accessibility journey can be run through every one of them and compared side by side:
// the audit results must NOT depend on how the session was obtained. Pure authentication tests (no accessibility)
// live apart, in tests/cli/auth.spec.js, mcp/auth.spec.js and the sso specs (tag @auth).
//
// Not here: method 4, interactive capture (-i), needs a person at a visible browser. Its saved-state result is the
// same file that method 5 consumes.
const { CREDS, LOGIN_SCRIPT, COMPANY_STEPS, SSO_STEPS, cliAuthSteps, toMcpSteps, recordState } = require('./auth');

const METHODS = [
  {
    id: '1-two-field',
    title: '1. standard 2-field login (-u / -p)',
    how: 'The shorthand: --login-url plus -u and -p (MCP: loginUrl, user, pass). It fills the first text input and the password input and presses submit.',
    cli: (base) => ['--login-url', `${base}/login-2field.html`, '-u', CREDS.user, '-p', CREDS.password],
    mcp: (base) => ({ loginUrl: `${base}/login-2field.html`, user: CREDS.user, pass: CREDS.password }),
  },
  {
    id: '2-auth-steps',
    title: '2. multi-field login (--auth-step pipeline)',
    how: 'An explicit pipeline for a 3-field form: fill company, user and password, then click. (MCP: authSteps.)',
    cli: (base) => ['--login-url', `${base}/login-company.html`, ...cliAuthSteps(COMPANY_STEPS)],
    mcp: (base) => ({ loginUrl: `${base}/login-company.html`, authSteps: toMcpSteps(COMPANY_STEPS) }),
  },
  {
    id: '2s-sso',
    title: '2. single sign-on (--auth-step through an identity provider on another origin)',
    how: 'The same pipeline syntax, but the login page redirects to an identity provider on a different origin and back. (MCP: authSteps.)',
    cli: (base) => ['--login-url', `${base}/sso/account.html`, ...cliAuthSteps(SSO_STEPS)],
    mcp: (base) => ({ loginUrl: `${base}/sso/account.html`, authSteps: toMcpSteps(SSO_STEPS) }),
  },
  {
    id: '3-auth-script',
    title: '3. custom login module (--auth-script)',
    how: 'A JavaScript module that receives the Playwright page and logs in however it needs to. (MCP: authScript.)',
    cli: () => ['--auth-script', LOGIN_SCRIPT],
    mcp: () => ({ authScript: LOGIN_SCRIPT }),
  },
  {
    id: '5-saved-state',
    title: '5. saved session handed over (-a / authState)',
    how: 'No login at audit time: a state file recorded earlier by Playwright (or agent-browser, see tests/agent-browser) is loaded. (MCP: authState.)',
    prepare: (base, testInfo) => recordState(testInfo.outputPath('recorded-state.json'), {
      loginUrl: `${base}/login-2field.html`,
      fill: { '#user': CREDS.user, '#password': CREDS.password },
      submit: 'button[type="submit"]',
      waitUrl: '**/account.html',
    }),
    cli: (base, state) => ['-a', state],
    mcp: (base, state) => ({ authState: state }),
  },
];

module.exports = { METHODS };
