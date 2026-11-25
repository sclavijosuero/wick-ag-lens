const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { AgentBrowser, available } = require('../helpers/agent-browser');
const { CREDS } = require('../helpers/auth');

// The contract wick-ag-lens relies on: `agent-browser state save` writes standard Playwright storageState
// (cookies + origins). If agent-browser changes that format, these tests fail before any user is affected.
// Note: a state file holds live session cookies in plaintext. It is written to the test output folder (git-ignored).
test.skip(!available, 'agent-browser is not installed (npm install in the repo root)');

test.describe('agent-browser state file format', { tag: '@agent-browser' }, () => {
  let ab;
  test.beforeEach(() => { ab = new AgentBrowser(); });
  test.afterEach(async () => { await ab.close(); });

  const saveLoggedInState = async (baseURL, testInfo) => {
    await ab.run(['open', `${baseURL}/login-2field.html`]);
    await ab.run(['fill', '#user', CREDS.user]);
    await ab.run(['fill', '#password', CREDS.password]);
    await ab.run(['click', 'button[type=submit]']);
    await ab.run(['wait', '--url', '**/account.html']);
    const file = testInfo.outputPath('state.json');
    await ab.run(['state', 'save', file]);
    return file;
  };

  test('is Playwright storageState: cookies[] and origins[], with the full cookie shape', async ({ baseURL }, testInfo) => {
    const state = JSON.parse(fs.readFileSync(await saveLoggedInState(baseURL, testInfo), 'utf8'));
    expect(Array.isArray(state.cookies)).toBe(true);
    expect(Array.isArray(state.origins)).toBe(true);

    const cookie = state.cookies.find((c) => c.name === 'wick_session');
    expect(cookie).toBeTruthy();
    expect(cookie).toMatchObject({
      domain: new URL(baseURL).hostname, path: '/',
      httpOnly: expect.any(Boolean), secure: expect.any(Boolean),
    });
    expect(cookie.value).toBeTruthy();
    expect(typeof cookie.expires).toBe('number');
  });

  test('plain Playwright accepts the file as storageState and is logged in', async ({ browser, baseURL }, testInfo) => {
    const file = await saveLoggedInState(baseURL, testInfo);
    const context = await browser.newContext({ storageState: file });
    const page = await context.newPage();
    await page.goto(`${baseURL}/account.html`);
    await expect(page).toHaveTitle('Account dashboard');   // not redirected to the sign-in page
    await testInfo.attach('dashboard-with-saved-state', { body: await page.screenshot(), contentType: 'image/png' });
    await context.close();
  });
});
