// Login module for --auth-script (CLI) / authScript (MCP): the default export receives the Playwright `page`.
// It signs in to the sample server (node server.js). Set SAMPLES_URL if the server is not on the default port.
export default async function login(page) {
  const base = process.env.SAMPLES_URL || `http://127.0.0.1:${process.env.SAMPLES_PORT || 4300}`;
  await page.goto(`${base}/login.html`);
  await page.fill('#user', 'jdoe');
  await page.fill('#password', 'Admin+123');
  await page.click('#login');
  await page.waitForURL('**/app/steps-demo.html');
}
