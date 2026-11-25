const { test, expect } = require('@playwright/test');
const { audit } = require('../helpers/cli');
const { sampleUrl } = require('../helpers/paths');
const { AUDITS, STEPS } = require('../helpers/steps-demo');
const { openReport, expectViewerMatchesJson, badge, startsWith } = require('../helpers/viewer');

// The step-actions sample (samples/steps-demo.html: click, fill, select, hover, press, wait) in the HTML viewer.
// Every step's New / Still present / Resolved badges must equal what the JSON says, and each step has its screenshot.
test.describe.configure({ mode: 'serial' });

test.describe('HTML viewer: every step action (samples/steps-demo.html)', { tag: '@samples' }, () => {
  let report; let stdout;
  test.beforeAll(async () => {
    ({ report, stdout } = await audit(sampleUrl('steps-demo.html'), [
      '-s', '--audits', AUDITS.join(','), ...STEPS.flatMap((s) => ['--step', s]),
    ]));
  });
  test.beforeEach(async ({ page }) => { await openReport(page, stdout, 11); });

  test('the timeline shows each action with its target', async ({ page }) => {
    const steps = page.locator('button.step');
    await expect(steps).toHaveCount(11);
    const expected = ['navigate', 'click', 'fill', 'fill', 'select', 'hover', 'press', 'wait', 'wait', 'press', 'press'];
    for (let i = 0; i < expected.length; i++) await expect(steps.nth(i)).toContainText(expected[i]);
  });

  test('for every step the badges match the JSON, and the screenshot is shown', async ({ page }, testInfo) => {
    await expectViewerMatchesJson(page, report, testInfo, 'steps-demo');
  });

  test('a fill that fixes the field resolves it; Escape resolves what the panel held', async ({ page }) => {
    await page.locator('button.step').nth(3).click();                                  // fill a valid email
    await expect(badge(page, 'new')).toContainText(startsWith(0));
    await expect(badge(page, 'resolved')).toContainText(startsWith(1));
    await page.locator('button.tab.resolved').click();
    await expect(page.locator('#tableHost')).toContainText('#email');

    await page.locator('button.step').nth(10).click();                                 // Escape closes the panel
    await expect(badge(page, 'resolved')).toContainText(startsWith(2));
    await expect(page.locator('.pill.res')).toContainText('2 resolved');
  });

  test('steps that change nothing are shown as such (wait for milliseconds, Tab)', async ({ page }) => {
    for (const i of [8, 9]) {
      await page.locator('button.step').nth(i).click();
      await expect(page.locator('.pill.new')).toContainText('0 new');
      await expect(page.locator('.pill.res')).toContainText('0 resolved');
    }
  });
});
