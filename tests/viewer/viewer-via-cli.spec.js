const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');
const { audit } = require('../helpers/cli');
const { pkgDir } = require('../helpers/paths');
const { COMPANY_STEPS, cliAuthSteps } = require('../helpers/auth');

const viewerUrl = pathToFileURL(path.join(pkgDir, 'report-template', 'wick-ag-lens-viewer.html')).href;

const load = async (page, stdout, name = 'report.json') => {
  await page.goto(viewerUrl);
  await page.setInputFiles('#fileInput', { name, mimeType: 'application/json', buffer: Buffer.from(stdout) });
};
const attachShot = async (page, testInfo, name) =>
  testInfo.attach(name, { body: await page.screenshot(), contentType: 'image/png' });

test.describe('HTML report viewer', () => {
  test('renders raw CLI stdout (log lines + JSON) from a real audit', async ({ page, baseURL }) => {
    const { stdout } = await audit(`${baseURL}/bad.html`, ['--audits', 'v-doc-title,v-missing-alt']);
    expect(stdout).toMatch(/^\[Audit\]/); // proves the file really has leading log lines

    await load(page, stdout);
    await expect(page.locator('#meta')).toContainText('report.json');
    await expect(page.locator('#meta')).toContainText('1 steps');
    await expect(page.locator('#app')).toContainText(/Missing Alt Text|v-missing-alt/);
  });

  test('multi-step report: timeline, per-step screenshots and findings', async ({ page, baseURL }, testInfo) => {
    const { stdout } = await audit(`${baseURL}/interactive.html`, [
      '-s', '--audits', 'v-missing-alt,v-empty-links',
      '--step', 'click::#add', '--step', 'click::#add-link',
    ]);
    await load(page, stdout);

    // 3 steps in the timeline: baseline + 2 clicks
    await expect(page.locator('#meta')).toContainText('3 steps');
    const steps = page.locator('button.step');
    await expect(steps).toHaveCount(3);

    // every step shows a real, decoded screenshot
    for (let i = 0; i < 3; i++) {
      await steps.nth(i).click();
      const img = page.locator('#main img').first();
      await expect(img).toBeVisible();
      await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
      await expect(page.locator('.noimg')).toHaveCount(0);
      await attachShot(page, testInfo, `viewer-step-${i + 1}`);
    }

    // findings appear at the step where they were introduced
    await steps.nth(0).click();
    await expect(page.locator('#tabBody')).not.toContainText('v-missing-alt');
    await steps.nth(1).click();
    await expect(page.locator('#tabBody')).toContainText(/Missing Alt|v-missing-alt/);
    await steps.nth(2).click();
    await expect(page.locator('#tabBody')).toContainText(/Empty Link|v-empty-links/);
  });

  test('shows a placeholder when the report has no screenshot', async ({ page, baseURL }, testInfo) => {
    const { stdout } = await audit(`${baseURL}/good.html`);
    await load(page, stdout);
    await expect(page.locator('.noimg')).toHaveText('No screenshot for this step.');
    await attachShot(page, testInfo, 'viewer-no-screenshot');
  });

  test('shows an error for a file without audit_trail', async ({ page }) => {
    await page.goto(viewerUrl);
    await page.setInputFiles('#fileInput', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"a":1}') });
    await expect(page.locator('#err')).toContainText('audit_trail');
  });
});

test.describe('HTML report viewer: focus order map', () => {
  // Sized for promo-ready screenshots: the whole report is visible at once (step screenshot, totals,
  // timeline, tabs) with just the first 4 rows of the results table. 2x pixel density keeps it crisp.
  test.use({ viewport: { width: 1400, height: 1165 }, deviceScaleFactor: 2 });

  // A realistic storefront page: step 1 is clean for the audited rules, step 2 ("Show more options")
  // reveals a panel with two defects (an unnamed icon button and an image without alt text).
  test('shows the focus-order tab per step with the full tab sequence', async ({ page, baseURL }, testInfo) => {
    const { stdout } = await audit(`${baseURL}/focus-demo.html`, [
      '-s', '--audits', 'i-focus-order,v-empty-buttons,v-missing-alt,v-empty-links',
      '--step', 'click::#show-more',
      '--step', 'click::#get-started',
    ]);
    await load(page, stdout);

    const steps = page.locator('button.step');
    const mapTab = page.locator('button.tab.map');
    const findingsTab = page.locator('button.tab.new');
    const rows = page.locator('#tableHost tbody tr');

    // step 1: page as loaded - 14 tab stops, nothing wrong yet
    await expect(steps).toHaveCount(3);
    await expect(page.locator('#main img').first()).toBeVisible();
    await attachShot(page, testInfo, 'viewer-demo-step-1-overview');
    await expect(page.locator('#tabBody')).not.toContainText(/Empty Button|Missing Alt|Empty Link|v-empty-buttons|v-missing-alt|v-empty-links/);

    await expect(mapTab).toContainText('Display Focus Order');
    await expect(mapTab.locator('.count')).toHaveText('14');
    await mapTab.click();
    await expect(rows).toHaveCount(14);
    await expect(rows.first()).toContainText('#logo');
    await expect(rows.last()).toContainText('#subscribe');
    await expect(page.locator('select[aria-label="Filter by severity"]')).toHaveCount(0); // maps have no severity filter
    await attachShot(page, testInfo, 'viewer-demo-step-1-focus-order');

    // step 2: new findings introduced by the revealed panel
    await steps.nth(1).click();
    await expect(page.locator('#main img').first()).toBeVisible();
    await findingsTab.click();
    await expect(page.locator('#tabBody')).toContainText(/Empty Button|v-empty-buttons/);
    await expect(page.locator('#tabBody')).toContainText(/Missing Alt|v-missing-alt/);
    await expect(page.locator('#tabBody')).not.toContainText(/Empty Link|v-empty-links/);
    await attachShot(page, testInfo, 'viewer-demo-step-2-new-findings');

    // step 2: full tab snapshot - the panel adds two stops (wishlist button, compare link)
    await expect(mapTab.locator('.count')).toHaveText('16');
    await mapTab.click();
    await expect(rows).toHaveCount(16);
    await expect(page.locator('#tableHost')).toContainText('#wishlist');
    await expect(page.locator('#tableHost')).toContainText('#compare');
    await attachShot(page, testInfo, 'viewer-demo-step-2-focus-order');

    // step 3: "Shop new arrivals" reveals a banner with an unnamed icon link; only that one is new
    await steps.nth(2).click();
    await expect(page.locator('#main img').first()).toBeVisible();
    await findingsTab.click();
    await expect(page.locator('#tabBody')).toContainText(/Empty Link|v-empty-links/);
    await expect(page.locator('#tabBody')).not.toContainText(/Empty Button|Missing Alt|v-empty-buttons|v-missing-alt/);
    await attachShot(page, testInfo, 'viewer-demo-step-3-new-findings');

    // step 3: two more tab stops (icon link, "View all"), 18 in total, in DOM order after #compare
    await expect(mapTab.locator('.count')).toHaveText('18');
    await mapTab.click();
    await expect(rows).toHaveCount(18);
    await expect(rows.nth(11)).toContainText('#arrivals-icon');
    await expect(rows.nth(12)).toContainText('#arrivals-all');
    await attachShot(page, testInfo, 'viewer-demo-step-3-focus-order');
  });
});

test.describe('HTML report viewer: frames and aria-hidden in the focus map', () => {
  test('lists elements from nested iframes', async ({ page, baseURL }, testInfo) => {
    const { stdout } = await audit(`${baseURL}/frames.html`, ['-s', '--audits', 'i-focus-order,v-empty-buttons']);
    await load(page, stdout);
    const mapTab = page.locator('button.tab.map');
    await expect(mapTab.locator('.count')).toHaveText('8');
    await mapTab.click();
    await expect(page.locator('#tableHost tbody tr')).toHaveCount(8);
    await expect(page.locator('#tableHost')).toContainText('[Iframe] #F2.2');
    await attachShot(page, testInfo, 'viewer-focus-order-iframes');
  });

  test('shows "Hidden from AT" stops', async ({ page, baseURL }, testInfo) => {
    const { stdout } = await audit(`${baseURL}/aria-hidden.html`, ['-s', '--audits', 'i-focus-order,v-aria-hidden-focus']);
    await load(page, stdout);
    await page.locator('button.tab.map').click();
    await expect(page.locator('#tableHost tbody tr', { hasText: '(Hidden from AT)' })).toHaveCount(2);
    await attachShot(page, testInfo, 'viewer-focus-order-aria-hidden');
  });
});

test.describe('HTML report viewer: authenticated audit', { tag: '@auth' }, () => {
  // An audit of a login-protected page (multi-field login via --auth-step), then one interaction.
  // The viewer must show the protected page's URL, its screenshot and the findings of both steps.
  test('shows an audit taken behind a login, with its findings and screenshot', async ({ page, baseURL }, testInfo) => {
    const { stdout } = await audit(`${baseURL}/account.html`, [
      '-s', '--audits', 'v-missing-alt,v-empty-buttons',
      '--login-url', `${baseURL}/login-company.html`, ...cliAuthSteps(COMPANY_STEPS),
      '--step', 'click::#open-settings',
    ]);
    await load(page, stdout);

    const steps = page.locator('button.step');
    await expect(steps).toHaveCount(2);

    // step 1: the protected page itself (not the sign-in page), with its baseline finding
    await expect(page.locator('#main .head.url')).toContainText('/account.html');
    await expect(page.locator('#main img').first()).toBeVisible();
    await expect(page.locator('#tabBody')).toContainText(/Missing Alt|v-missing-alt/);
    await expect(page.locator('#tabBody')).toContainText('#private-img');
    await attachShot(page, testInfo, 'viewer-auth-step-1-baseline');

    // step 2: still logged in after the click, and only the new finding is listed
    await steps.nth(1).click();
    await expect(page.locator('#main .head.url')).toContainText('/account.html');
    await expect(page.locator('#tabBody')).toContainText(/Empty Button|v-empty-buttons/);
    await expect(page.locator('#tabBody')).toContainText('#icon-only');
    await expect(page.locator('#tabBody')).not.toContainText('#private-img');
    await attachShot(page, testInfo, 'viewer-auth-step-2-new-finding');
  });
});
