const { test, expect } = require('@playwright/test');
const { runCli, audit, idsOf } = require('../helpers/cli');

test.describe('wick-ag-lens audit', () => {
  test('reports known violations on an inaccessible page', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/bad.html`);
    const ids = idsOf(report.audit_trail[0]);
    for (const id of ['v-doc-title', 'v-missing-alt', 'v-empty-links', 'v-empty-buttons', 'v-unlabeled-inputs']) {
      expect(ids, `expected ${id}`).toContain(id);
    }
    expect(report.global_summary.Critical).toBeGreaterThan(0);
  });

  test('reports none of those violations on an accessible page', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/good.html`);
    const ids = idsOf(report.audit_trail[0]);
    for (const id of ['v-doc-title', 'v-missing-alt', 'v-empty-links', 'v-empty-buttons', 'v-unlabeled-inputs']) {
      expect(ids).not.toContain(id);
    }
  });

  test('--audits limits the rules that run', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/bad.html`, ['--audits', 'v-doc-title']);
    expect(new Set(idsOf(report.audit_trail[0]))).toEqual(new Set(['v-doc-title']));
  });

  test('--step click audits the DOM change and reports only new findings', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/interactive.html`, ['--step', 'click::#add']);
    expect(report.audit_trail).toHaveLength(2);
    expect(idsOf(report.audit_trail[0])).not.toContain('v-missing-alt');
    expect(idsOf(report.audit_trail[1])).toContain('v-missing-alt');
  });

  test('-s embeds a JPEG screenshot', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/good.html`, ['-s']);
    expect(report.audit_trail[0].screenshot_base64).toBeTruthy();
  });

  test('--help lists the audit command', async () => {
    const res = await runCli(['--help']);
    expect(res.code).toBe(0);
    expect(res.stdout).toContain('audit');
  });
});
