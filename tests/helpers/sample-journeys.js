// The SAME journey (samples/steps-demo.html: one click, fill, select, hover, press and wait) for every way of reaching
// the page, using the sample server that ships in the package (cli/samples/server.mjs, started by playwright.config.js).
// Each login is described ONCE (CLI arguments + MCP arguments) so the CLI, MCP and agent-browser specs line up 1-to-1,
// and cli/docs/sample-journeys.md shows the same commands. The expectations are the shared ones in helpers/steps-demo.js.
const path = require('path');
const { pkgDir } = require('./paths');
const { recordState, cliAuthSteps, toMcpSteps } = require('./auth');

const PORT = Number(process.env.SAMPLES_PORT || 4310);
const BASE = `http://127.0.0.1:${PORT}`;
const PUBLIC_URL = `${BASE}/steps-demo.html`;
const PROTECTED_URL = `${BASE}/app/steps-demo.html`;
const LOGIN_URL = `${BASE}/login.html`;
const USER = 'jdoe';
const PASSWORD = 'Admin+123';                                         // demo credentials of the sample server
const LOGIN_SCRIPT = path.join(pkgDir, 'samples', 'login-script.mjs');

const PIPELINE = [`fill::#user::${USER}`, `fill::#password::${PASSWORD}`, 'click::#login'];

// One entry per way in. `cli` / `mcp` return the extra arguments of the audit command / audit_baseline call;
// `prepare` (method 5 only) records the session file first. Method 4 (-i) needs a person, so it is not here.
const LOGINS = [
  { id: 'none', title: 'no login (public page)', url: PUBLIC_URL,
    how: 'No authentication: the page is public.',
    cli: () => [], mcp: () => ({}) },
  { id: '1-two-field', title: 'method 1: 2-field login (-u / -p)', url: PROTECTED_URL,
    how: '--login-url plus -u and -p (MCP: loginUrl, user, pass).',
    cli: () => ['--login-url', LOGIN_URL, '-u', USER, '-p', PASSWORD],
    mcp: () => ({ loginUrl: LOGIN_URL, user: USER, pass: PASSWORD }) },
  { id: '2-auth-steps', title: 'method 2: pipeline of steps (--auth-step)', url: PROTECTED_URL,
    how: 'The login written as steps: fill, fill, click. (MCP: authSteps.)',
    cli: () => ['--login-url', LOGIN_URL, ...cliAuthSteps(PIPELINE)],
    mcp: () => ({ loginUrl: LOGIN_URL, authSteps: toMcpSteps(PIPELINE) }) },
  { id: '3-auth-script', title: 'method 3: login script (--auth-script)', url: PROTECTED_URL,
    how: 'A JavaScript module that receives the Playwright page (samples/login-script.mjs). (MCP: authScript.)',
    cli: () => ['--auth-script', LOGIN_SCRIPT], mcp: () => ({ authScript: LOGIN_SCRIPT }) },
  { id: '5-saved-state', title: 'method 5: saved session (-a / authState)', url: PROTECTED_URL,
    how: 'A session file recorded earlier (here by Playwright; agent-browser does the same, see the agent-browser spec). (MCP: authState.)',
    prepare: (info) => recordState(info.outputPath('state.json'), {
      loginUrl: LOGIN_URL, fill: { '#user': USER, '#password': PASSWORD }, submit: '#login', waitUrl: '**/app/steps-demo.html',
    }),
    cli: (state) => ['-a', state], mcp: (state) => ({ authState: state }) },
];

module.exports = { BASE, PUBLIC_URL, PROTECTED_URL, LOGIN_URL, USER, PASSWORD, LOGINS };
