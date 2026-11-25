const { test, expect } = require('@playwright/test');
const { audit, focusMap, selectorsFor, attachScreenshots } = require('../helpers/cli');
const { sampleUrl } = require('../helpers/paths');
const { AUDITS, STEPS, defineStepsDemoTests } = require('../helpers/steps-demo');

// The sample pages SHIPPED INSIDE THE PACKAGE (cli/samples/, built from /samples) opened with a file:/// URL, no server.
// 1. steps-demo.html with every --step action, one diff per action (shared with the MCP and viewer versions).
// 2. The documented README examples (3, 5, 6, 7, 8), run against the samples, with the same flags as the docs.
const STEPS_DEMO = sampleUrl('steps-demo.html');
const SHOP = sampleUrl('shop-journey.html');

test.describe.configure({ mode: 'serial' });

test.describe('CLI sample: every step action (samples/steps-demo.html)', { tag: '@samples' }, () => {
  let report;
  test.beforeAll(async () => {
    ({ report } = await audit(STEPS_DEMO, ['-s', '--audits', AUDITS.join(','), ...STEPS.flatMap((s) => ['--step', s])]));
  });
  defineStepsDemoTests(() => report);
});

test.describe('CLI: the examples from the README, run against the samples', { tag: '@samples' }, () => {
  test('example 3 - focus order mapping: the tab sequence is re-mapped after a step', async () => {
    const { report } = await audit(SHOP, ['--audits', 'i-focus-order', '--step', 'click::#open-menu']);
    const [before, after] = report.audit_trail.map((s) => focusMap(s).map((e) => e.selector));
    expect(before).toHaveLength(6);
    expect(after).toEqual([...before, '#menu-empty-link', '#menu-icon', '#close-menu']);
    expect(report.audit_trail[1].new_findings).toEqual({});                    // focus order is a state map, never a finding
  });

  test('example 5 - single interaction and delta, with screenshots at each step (all audits)', async () => {
    const { report } = await audit(STEPS_DEMO, ['--step', 'click::#open-panel', '-s']);   // no --audits: the full suite runs
    expect(report.audit_trail).toHaveLength(2);
    expect(selectorsFor(report.audit_trail[1], 'v-empty-buttons')).toEqual(['#panel-close']);
    expect(selectorsFor(report.audit_trail[0], 'v-empty-buttons')).toEqual([]);   // not there before the click
    expect(await attachScreenshots(report, 'example-5')).toHaveLength(2);
  });

  test('example 6 - multi-step sequence: each step is an isolated diff', async () => {
    const { report } = await audit(SHOP, [
      '--audits', 'v-empty-links,v-empty-buttons,v-unlabeled-inputs',
      '--step', 'click::#open-menu', '--step', 'click::#close-menu', '--step', 'click::#open-signup', '-s',
    ]);
    const added = report.audit_trail.map((s) => ['v-empty-links', 'v-empty-buttons', 'v-unlabeled-inputs'].flatMap((id) => selectorsFor(s, id)));
    expect(added).toEqual([[], ['#menu-empty-link', '#menu-icon'], [], ['#email']]);   // the menu's problems appear once, and the form's later
    expect(report.audit_trail[2].resolved_findings).not.toEqual({});                      // closing the menu resolved them
    await attachScreenshots(report, 'example-6');
  });

  test('example 7 - SPA hydration: --wait-for-selector and --wait-ms catch content that mounts late', async () => {
    const late = `${STEPS_DEMO}?late=1`;
    const waited = await audit(late, ['--wait-for-selector', '.recommendations-ready', '--wait-ms', '500', '--audits', 'v-missing-alt']);
    expect(selectorsFor(waited.report.audit_trail[0], 'v-missing-alt')).toEqual(['#late-img']);

    const notWaited = await audit(late, ['--audits', 'v-missing-alt']);                    // control: the widget is not there yet
    expect(selectorsFor(notWaited.report.audit_trail[0], 'v-missing-alt')).toEqual([]);
  });

  test('example 8 - keyboard: open the panel, Tab, Tab, Escape closes it', async () => {
    const { report } = await audit(STEPS_DEMO, [
      '--audits', 'v-empty-buttons,i-focus-order',
      '--step', 'click::#open-panel', '--step', 'press::active::Tab', '--step', 'press::active::Tab', '--step', 'press::active::Escape',
    ]);
    const t = report.audit_trail;
    expect(selectorsFor(t[1], 'v-empty-buttons')).toEqual(['#panel-close']);               // opened: new violation
    for (const n of [2, 3]) expect(t[n].new_findings).toEqual({}) && expect(t[n].resolved_findings).toEqual({});   // Tab only moves focus
    expect(Object.values(t[4].resolved_findings).flatMap((c) => Object.values(c).flat()).map((a) => a.auditId)).toEqual(['v-empty-buttons']);
    expect(focusMap(t[4]).map((e) => e.selector)).toEqual(focusMap(t[0]).map((e) => e.selector));   // back to the baseline tab order
  });
});
