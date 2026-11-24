const { test, expect } = require('@playwright/test');
const { runCli, audit, idsOf, attachScreenshots, isJpeg } = require('../helpers/cli');

test.describe('wick-ag-lens audit', () => {
  test('reports known violations on an inaccessible page', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/bad.html`);
    console.log('------------------------- REPORT')
    console.log(report)

    const ids = idsOf(report.audit_trail[0]);
    for (const id of ['v-doc-title', 'v-missing-alt', 'v-empty-links', 'v-empty-buttons', 'v-unlabeled-inputs']) {
      expect(ids, `expected ${id}`).toContain(id);
    }
    expect(report.global_summary.Critical).toBeGreaterThan(0);
  });

  test('reports none of those violations on an accessible page', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/good.html`);
    console.log('------------------------- REPORT')
    console.log(report)

    const ids = idsOf(report.audit_trail[0]);
    for (const id of ['v-doc-title', 'v-missing-alt', 'v-empty-links', 'v-empty-buttons', 'v-unlabeled-inputs']) {
      expect(ids).not.toContain(id);
    }
  });

  test('--audits limits the rules that run', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/bad.html`, ['--audits', 'v-doc-title']);
    console.log('------------------------- REPORT')
    console.log(report)

    expect(new Set(idsOf(report.audit_trail[0]))).toEqual(new Set(['v-doc-title']));
  });

  test('--step click audits the DOM change and reports only new findings', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/interactive.html`, ['--step', 'click::#add']);
    console.log('------------------------- REPORT')
    console.log(report)

    expect(report.audit_trail).toHaveLength(2);
    expect(idsOf(report.audit_trail[0])).not.toContain('v-missing-alt');
    expect(idsOf(report.audit_trail[1])).toContain('v-missing-alt');
  });

  test('-s embeds a valid JPEG screenshot of the page', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/good.html`, ['-s']);
    console.log('------------------------- REPORT')
    console.log(report)

    const [shot] = await attachScreenshots(report, 'good-page'); // visible in the Attachments tab
    expect(shot).toBeTruthy();
    expect(isJpeg(shot)).toBe(true);
    expect(report.audit_trail[0].screenshot_base64).not.toMatch(/^data:/); // raw base64, no data-URI prefix
  });

  test('-s adds one screenshot per step, showing the page change', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/interactive.html`, [
      '-s', '--audits', 'v-missing-alt', '--step', 'click::#add', '--step', 'click::#add-link',
    ]);
    console.log('------------------------- REPORT')
    console.log(report)

    const shots = await attachScreenshots(report, 'interactive-page');
    expect(shots).toHaveLength(3);
    shots.forEach((s) => expect(isJpeg(s)).toBe(true));
    expect(report.audit_trail.map((s) => s.screenshot_base64)).toHaveLength(3);
  });

  test('--help lists the audit command', async () => {
    const res = await runCli(['--help']);
    expect(res.code).toBe(0);
    expect(res.stdout).toContain('audit');
  });
});
