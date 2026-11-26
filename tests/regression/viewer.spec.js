const { test, expect } = require('@playwright/test');
const { audit } = require('../helpers/cli');
const { SCENARIOS, MEDIUM } = require('../helpers/scenarios');
const { runCli } = require('../helpers/runners');
const { viewerUrl, openReport, expectViewerMatchesJson } = require('../helpers/viewer');

// THE HTML REPORT VIEWER. It is the way people READ an audit, so it must show exactly what the JSON says.
// Each journey (short, medium, long) is audited with screenshots, loaded into the viewer, and for every step the New / Still
// present / Resolved badges are compared with the numbers the JSON itself gives (the JSON is frozen by journeys.spec.js), and
// the screenshot must load. A screenshot of the viewer per step is attached to the test.
test.describe.configure({ timeout: 240_000 });

for (const scenario of SCENARIOS) {
  test(`viewer: ${scenario.title}, every step matches the JSON`, { tag: '@viewer' }, async ({ page, baseURL }, testInfo) => {
    const { report, stdout } = await runCli(scenario, scenario.target('public', baseURL), { screenshots: true });
    await openReport(page, stdout, report.audit_trail.length);
    await expect(page.locator('button.step')).toHaveCount(report.audit_trail.length);
    await expectViewerMatchesJson(page, report, testInfo, `viewer-${scenario.id}`);

    // the focus-order tab shows the tab sequence of each step
    for (const n of scenario.audits.includes('i-focus-order') ? [1, Math.ceil(report.audit_trail.length / 2), report.audit_trail.length] : []) {
      await page.locator('button.step').nth(n - 1).click();
      await expect(page.locator('button.tab.map .count')).toHaveText(String(report.audit_trail[n - 1].page_state_maps.focus_order.elements.length));
    }
  });
}

test('viewer: the medium journey shows resolved and new findings together, the reappearing ones, and the aria-hidden stops', { tag: '@viewer' }, async ({ page, baseURL }, testInfo) => {
  const { stdout } = await runCli(MEDIUM, MEDIUM.target('public', baseURL), { screenshots: true });
  await openReport(page, stdout, 9);
  const steps = page.locator('button.step');
  await expect(steps.nth(0)).toContainText('navigate');
  await expect(steps.nth(1)).toContainText('#open-menu');
  await expect(steps.nth(6)).toContainText('#open-dialog');

  await steps.nth(4).click();                                                         // fix form: one new, four resolved
  await expect(page.locator('.pill.new')).toContainText('1 new');
  await expect(page.locator('.pill.res')).toContainText('4 resolved');
  await page.locator('button.tab.resolved').click();
  await expect(page.locator('#tableHost')).toContainText('Unfocusable Clickable');

  await steps.nth(8).click();                                                         // menu opened again
  await expect(page.locator('.pill.re')).toContainText('2 reappeared');

  await steps.nth(6).click();                                                         // dialog open: three stops hidden from assistive technology
  await page.locator('button.tab.map').click();
  await expect(page.locator('#tableHost tbody tr', { hasText: '(Hidden from AT)' })).toHaveCount(3);
  await testInfo.attach('viewer-focus-order-step-7', { body: await page.screenshot(), contentType: 'image/png' });
});

test('viewer: raw CLI output (log lines + JSON), no-screenshot placeholder, and an invalid file', { tag: '@viewer' }, async ({ page, baseURL }) => {
  const { stdout } = await audit(`${baseURL}/good.html`);
  expect(stdout).toMatch(/^\[Audit\]/);                                               // the file really has leading log lines
  await openReport(page, stdout, 1);
  await expect(page.locator('#meta')).toContainText('1 steps');
  await expect(page.locator('.noimg')).toHaveText('No screenshot for this step.');

  await page.goto(viewerUrl);
  await page.setInputFiles('#fileInput', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"a":1}') });
  await expect(page.locator('#err')).toContainText('audit_trail');
});

// The promo screenshots of the viewer (documentation) on a realistic storefront: step 2 reveals two defects, step 3 one more.
test.describe('viewer: the focus-order tab on a storefront', () => {
  test.use({ viewport: { width: 1400, height: 1165 }, deviceScaleFactor: 2 });

  test('the full tab sequence of each step, and the findings that arrive with it', { tag: '@viewer' }, async ({ page, baseURL }, testInfo) => {
    const shot = async (name) => testInfo.attach(name, { body: await page.screenshot(), contentType: 'image/png' });
    const { stdout } = await audit(`${baseURL}/focus-demo.html`, [
      '-s', '--audits', 'i-focus-order,v-empty-buttons,v-missing-alt,v-empty-links', '--step', 'click::#show-more', '--step', 'click::#get-started',
    ]);
    await page.goto(viewerUrl);
    await page.setInputFiles('#fileInput', { name: 'report.json', mimeType: 'application/json', buffer: Buffer.from(stdout) });
    const steps = page.locator('button.step'); const mapTab = page.locator('button.tab.map');
    const findingsTab = page.locator('button.tab.new'); const rows = page.locator('#tableHost tbody tr');

    await expect(steps).toHaveCount(3);
    await expect(page.locator('#main img').first()).toBeVisible();
    await expect(page.locator('#tabBody')).not.toContainText(/Empty Button|Missing Alt|Empty Link|v-empty-buttons|v-missing-alt|v-empty-links/);
    await expect(mapTab.locator('.count')).toHaveText('14');
    await mapTab.click();
    await expect(rows).toHaveCount(14);
    await expect(rows.first()).toContainText('#logo');
    await expect(rows.last()).toContainText('#subscribe');
    await shot('viewer-demo-step-1-focus-order');

    await steps.nth(1).click();
    await findingsTab.click();
    await expect(page.locator('#tabBody')).toContainText(/Empty Button|v-empty-buttons/);
    await expect(page.locator('#tabBody')).toContainText(/Missing Alt|v-missing-alt/);
    await expect(page.locator('#tabBody')).not.toContainText(/Empty Link|v-empty-links/);
    await shot('viewer-demo-step-2-new-findings');
    await mapTab.click();
    await expect(rows).toHaveCount(16);
    await expect(page.locator('#tableHost')).toContainText('#wishlist');
    await shot('viewer-demo-step-2-focus-order');

    await steps.nth(2).click();
    await findingsTab.click();
    await expect(page.locator('#tabBody')).toContainText(/Empty Link|v-empty-links/);
    await expect(page.locator('#tabBody')).not.toContainText(/Empty Button|Missing Alt|v-empty-buttons|v-missing-alt/);
    await mapTab.click();
    await expect(rows).toHaveCount(18);
    await expect(rows.nth(11)).toContainText('#arrivals-icon');
    await shot('viewer-demo-step-3-focus-order');
  });
});
