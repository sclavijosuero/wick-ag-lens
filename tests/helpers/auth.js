const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { selectorsFor } = require('./cli');

// Demo credentials of the local fixture login (tests/fixtures/server.js). Not real secrets.
const CREDS = { company: 'Northwind', user: 'jdoe', password: 'Admin+123' };

// Absolute path of the custom login module used by --auth-script / authScript
const LOGIN_SCRIPT = path.join(__dirname, '..', 'fixtures', 'auth', 'login-script.mjs');

// Same pre-audit steps for the CLI (`--auth-step` flags) ...
const COMPANY_STEPS = [
  'fill::#company::' + CREDS.company,
  'fill::#user::' + CREDS.user,
  'fill::#password::' + CREDS.password,
  'click::#btn-login',
];
const cliAuthSteps = (steps) => steps.flatMap((s) => ['--auth-step', s]);

// ... and for the MCP server (`authSteps` array of { action, target, value })
const toMcpSteps = (steps) => steps.map((s) => {
  const [action, target, value] = s.split('::');
  return value === undefined ? { action, target } : { action, target, value };
});

// A storage-state file in the standard Playwright format (cookies + origins), exactly what
// `agent-browser state save` or Playwright's context.storageState() produces. Handwritten here
// so the handoff contract is tested without needing either tool to log in first.
function writeHandmadeState(file, { valid = true } = {}) {
  const state = {
    cookies: [{
      name: 'wick_session', value: valid ? 'ok' : 'expired', domain: '127.0.0.1', path: '/',
      expires: -1, httpOnly: true, secure: false, sameSite: 'Lax',
    }],
    origins: [],
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
  return file;
}

// Logs in through a real browser with plain Playwright and saves the session, the way an
// external tool (Playwright, agent-browser) would before handing it to wick-ag-lens.
async function recordState(file, { loginUrl, fill, submit, waitUrl }) {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(loginUrl);
    for (const [selector, value] of Object.entries(fill)) await page.fill(selector, value);
    await page.click(submit);
    await page.waitForURL(waitUrl, { timeout: 30_000 });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await context.storageState({ path: file });
  } finally {
    await browser.close();
  }
  return file;
}

// The step was audited on the protected page, logged in (#private-img only exists there)
const isLoggedIn = (step) =>
  step.url.endsWith('/account.html') && selectorsFor(step, 'v-missing-alt').includes('#private-img');
// The audit was bounced to the sign-in page instead
const isBouncedToLogin = (step) =>
  step.url.includes('/login-2field.html') && !selectorsFor(step, 'v-missing-alt').includes('#private-img');

module.exports = {
  CREDS, LOGIN_SCRIPT, COMPANY_STEPS, cliAuthSteps, toMcpSteps,
  writeHandmadeState, recordState, isLoggedIn, isBouncedToLogin,
};
