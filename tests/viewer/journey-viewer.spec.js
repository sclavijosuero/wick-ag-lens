const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');
const { audit } = require('../helpers/cli');
const { sampleUrl } = require('../helpers/paths');
const { pkgDir } = require('../helpers/paths');
const { AUDITS, STEPS } = require('../helpers/journey-suite');
const { replay, isViolation } = require('../helpers/journey');

// WORKED EXAMPLE (viewer): the 9-step journey from journey-suite, loaded into the HTML report viewer. The numbers the
// viewer shows for every step (New / Still present / Resolved tabs, focus-order tab) are compared with what the JSON
// itself says, so the viewer cannot silently drift from the data. One screenshot of the viewer per step is attached.
const viewerUrl = pathToFileURL(path.join(pkgDir, 'report-template', 'wick-ag-lens-viewer.html')).href;
test.describe.configure({ mode: 'serial' });

test.describe('HTML viewer: multi-step journey', { tag: '@journey' }, () => {
  let report; let stdout;
  test.beforeAll(async () => {
    const baseURL = test.info().project.use.baseURL;
    ({ report, stdout } = await audit(`${baseURL}/journey.html`, [
      '-s', '--audits', AUDITS.join(','), ...STEPS.flatMap((s) => ['--step', s]),
    ]));
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(viewerUrl);
    await page.setInputFiles('#fileInput', { name: 'journey.json', mimeType: 'application/json', buffer: Buffer.from(stdout) });
    await expect(page.locator('#meta')).toContainText('9 steps');
  });

  // the tab badge reads "<violations>" or "<violations> +<n> info"
  const badge = (page, tab) => page.locator(`button.tab.${tab} .count`);
  const startsWith = (n) => new RegExp(`^${n}( |$)`);

  test('the timeline lists every step with the interaction that caused it', async ({ page }) => {
    const steps = page.locator('button.step');
    await expect(steps).toHaveCount(9);
    await expect(steps.nth(0)).toContainText('navigate');
    await expect(steps.nth(1)).toContainText('#open-menu');
    await expect(steps.nth(4)).toContainText('#fix-signup');
    await expect(steps.nth(6)).toContainText('#open-dialog');
  });

  test('for every step, New / Still present / Resolved match the JSON, and a screenshot is shown', async ({ page }, testInfo) => {
    const { steps } = replay(report);
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const nNew = s.added.filter(isViolation).length;
      const nResolved = s.resolved.filter(isViolation).length;
      const nStill = [...s.active.values()].filter(isViolation).length - nNew;

      await page.locator('button.step').nth(i).click();
      await expect(badge(page, 'new')).toContainText(startsWith(nNew));
      await expect(badge(page, 'persist')).toContainText(startsWith(nStill));
      await expect(badge(page, 'resolved')).toContainText(startsWith(nResolved));

      const img = page.locator('#main img').first();
      await expect(img).toBeVisible();
      await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
      await testInfo.attach(`viewer-step-${i + 1}`, { body: await page.screenshot(), contentType: 'image/png' });
    }
  });

  test('step 5 shows resolved and new findings together; step 9 shows them as reappeared', async ({ page }) => {
    await page.locator('button.step').nth(4).click();                                  // fix form
    await expect(page.locator('.pill.new')).toContainText('1 new');
    await expect(page.locator('.pill.res')).toContainText('4 resolved');
    await page.locator('button.tab.resolved').click();
    await expect(page.locator('#tableHost')).toContainText('Unfocusable Clickable');

    await page.locator('button.step').nth(8).click();                                  // menu opened again
    await expect(page.locator('.pill.re')).toContainText('2 reappeared');
  });

  test('the focus order tab shows the tab sequence of the selected step, and flags aria-hidden stops', async ({ page }, testInfo) => {
    const focus = (n) => report.audit_trail[n - 1].page_state_maps.focus_order.elements.length;
    for (const n of [1, 2, 3, 7]) {
      await page.locator('button.step').nth(n - 1).click();
      await expect(page.locator('button.tab.map .count')).toHaveText(String(focus(n)));
    }
    await page.locator('button.step').nth(6).click();                                  // dialog open
    await page.locator('button.tab.map').click();
    await expect(page.locator('#tableHost tbody tr', { hasText: '(Hidden from AT)' })).toHaveCount(3);
    await testInfo.attach('viewer-focus-order-step-7', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
