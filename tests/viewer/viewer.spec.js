const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');
const { audit } = require('../helpers/cli');
const { pkgDir } = require('../helpers/paths');

const viewerUrl = pathToFileURL(path.join(pkgDir, 'report-template', 'wick-ag-lens-viewer.html')).href;

test.describe('HTML report viewer', () => {
  test('renders raw CLI stdout (log lines + JSON) from a real audit', async ({ page, baseURL }) => {
    const { stdout } = await audit(`${baseURL}/bad.html`, ['--audits', 'v-doc-title,v-missing-alt']);
    expect(stdout).toMatch(/^\[Audit\]/); // proves the file really has leading log lines

    await page.goto(viewerUrl);
    await page.setInputFiles('#fileInput', { name: 'report.json', mimeType: 'application/json', buffer: Buffer.from(stdout) });

    await expect(page.locator('#meta')).toContainText('report.json');
    await expect(page.locator('#meta')).toContainText('1 steps');
    await expect(page.locator('#app')).toContainText(/Missing Alt Text|v-missing-alt/);
    await expect(page.locator('#err')).toHaveCount(0); // welcome/drop area replaced by the report
  });

  test('shows an error for a file without audit_trail', async ({ page }) => {
    await page.goto(viewerUrl);
    await page.setInputFiles('#fileInput', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"a":1}') });
    await expect(page.locator('#err')).toContainText('audit_trail');
  });
});
