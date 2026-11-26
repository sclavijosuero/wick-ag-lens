// Shared steps for the HTML report viewer tests.
const path = require('path');
const { pathToFileURL } = require('url');
const { expect } = require('@playwright/test');
const { pkgDir } = require('./paths');
const { replay, isViolation } = require('./journey');

const viewerUrl = pathToFileURL(path.join(pkgDir, 'report-template', 'wick-ag-lens-viewer.html')).href;

// Opens the viewer and loads raw CLI stdout (log lines + JSON) or any report JSON text
async function openReport(page, text, steps) {
  await page.goto(viewerUrl);
  await page.setInputFiles('#fileInput', { name: 'report.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.locator('#meta')).toContainText(`${steps} steps`);
}

// The tab badge reads "<violations>" or "<violations> +<n> info"
const badge = (page, tab) => page.locator(`button.tab.${tab} .count`);
const startsWith = (n) => new RegExp(`^${n}( |$)`);

// For every step: the New / Still present / Resolved badges equal what the JSON itself says, and the screenshot loads.
// One screenshot of the viewer per step is attached to the test.
async function expectViewerMatchesJson(page, report, testInfo, prefix = 'viewer-step') {
  // All three badges count ELEMENTS: still present = on the page after the previous step - resolved now (running total from the JSON).
  const { steps } = replay(report);
  let onPage = 0;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const nNew = s.added.filter(isViolation).length;
    const nResolved = s.resolved.filter(isViolation).length;
    const nStill = onPage - nResolved;        // elements active after the previous step that did not leave
    onPage = nStill + nNew;

    await page.locator('button.step').nth(i).click();
    await expect(badge(page, 'new'), `step ${i + 1} new`).toContainText(startsWith(nNew));
    await expect(badge(page, 'persist'), `step ${i + 1} still present`).toContainText(startsWith(nStill));
    await expect(badge(page, 'resolved'), `step ${i + 1} resolved`).toContainText(startsWith(nResolved));

    const img = page.locator('#main img').first();
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    await testInfo.attach(`${prefix}-${i + 1}`, { body: await page.screenshot(), contentType: 'image/png' });
  }
}

module.exports = { viewerUrl, openReport, expectViewerMatchesJson, badge, startsWith };
