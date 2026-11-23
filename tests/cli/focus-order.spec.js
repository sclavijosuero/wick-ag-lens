const { test, expect } = require('@playwright/test');
const { audit, idsOf } = require('../helpers/cli');

// i-focus-order is a "state map": the full tab sequence is reported at every step
// under page_state_maps.focus_order, separate from new_findings / health scores.
const selectors = (step) => step.page_state_maps.focus_order.elements.map((e) => e.selector);

test.describe('i-focus-order', () => {
  test('maps the full tab sequence in order at the baseline', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/focus.html`, ['--audits', 'i-focus-order']);
    const map = report.audit_trail[0].page_state_maps.focus_order;

    expect(map.auditId).toBe('i-focus-order');
    expect(map.totalElems).toBe(4);
    expect(selectors(report.audit_trail[0])).toEqual(['#first', '#second', '#third', '#reveal']);
    expect(map.elements.map((e) => e.issueText)).toEqual(['#1: <a>', '#2: <button>', '#3: <input>', '#4: <button>']);
    expect(map.elements.every((e) => e.legend === 'Valid Focus')).toBe(true);
  });

  test('is isolated from findings and health scores', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/focus.html`, ['--audits', 'i-focus-order']);
    expect(idsOf(report.audit_trail[0])).not.toContain('i-focus-order');
    expect(report.global_summary.Critical).toBe(0);
  });

  test('re-maps the whole sequence after a step reveals a control', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/focus.html`, ['--audits', 'i-focus-order', '--step', 'click::#reveal']);
    expect(report.audit_trail).toHaveLength(2);

    expect(selectors(report.audit_trail[0])).toEqual(['#first', '#second', '#third', '#reveal']);
    // step 2 is a full snapshot (5 stops, new one last), not just the new element
    expect(report.audit_trail[1].page_state_maps.focus_order.totalElems).toBe(5);
    expect(selectors(report.audit_trail[1])).toEqual(['#first', '#second', '#third', '#reveal', '#extra']);
  });

  test('only maps stops the Tab key can actually reach', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/focus-rules.html`, ['--audits', 'i-focus-order']);
    // excluded: display:none, visibility:hidden, input[type=hidden], inert, tabindex="-1"
    expect(selectors(report.audit_trail[0])).toEqual(['#first', '#editable', '#summary', '#audio', '#last']);
  });

  test('is not reported when the audit is not requested', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/focus.html`, ['--audits', 'v-doc-title']);
    expect(report.audit_trail[0].page_state_maps).toBeUndefined();
  });
});
