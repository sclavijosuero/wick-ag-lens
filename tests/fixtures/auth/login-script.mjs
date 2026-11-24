// Custom auth module for --auth-script / authScript: an ES module whose default export receives the Playwright page.
// Fixture credentials only (see tests/fixtures/server.js). The target origin is passed in through WICK_FIXTURE_URL.
export default async function login(page) {
  const base = process.env.WICK_FIXTURE_URL || 'http://127.0.0.1:' + (process.env.FIXTURE_PORT || 4173);
  await page.goto(`${base}/login-company.html`, { waitUntil: 'domcontentloaded' });
  await page.fill('#company', 'Northwind');
  await page.fill('#user', 'jdoe');
  await page.fill('#password', 'Admin+123');
  await page.click('#btn-login');
  await page.waitForURL('**/account.html', { timeout: 15000 });
}
