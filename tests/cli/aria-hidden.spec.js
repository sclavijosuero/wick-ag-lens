const { test, expect } = require('@playwright/test');
const { audit, selectorsFor, focusMap } = require('../helpers/cli');

const AUDITS = ['--audits', 'v-aria-hidden-focus,i-focus-order'];

test.describe('aria-hidden + focus order', () => {
  test('v-aria-hidden-focus flags focusable controls inside aria-hidden="true"', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/aria-hidden.html`, AUDITS);
    console.log('------------------------- REPORT')
    console.log(report)

    const flagged = selectorsFor(report.audit_trail[0], 'v-aria-hidden-focus');
    console.log('------------------------- FLAGGED')
    console.log(flagged)

    expect(flagged).toEqual(expect.arrayContaining(['#hidden-btn', '#hidden-link']));
    expect(flagged).not.toContain('#visible');
    expect(flagged).not.toContain('#last');
  });

  test('focus order marks those stops as "Focusable in Aria-Hidden" and keeps numbering', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/aria-hidden.html`, AUDITS);
    console.log('------------------------- REPORT')
    console.log(report)

    const rows = focusMap(report.audit_trail[0]).map((e) => [e.selector, e.issueText, e.legend]);
    expect(rows).toEqual([
      ['#visible', '#1: <button>', 'Valid Focus'],
      ['#hidden-btn', '#2: <button> (Hidden from AT)', 'Focusable in Aria-Hidden'],
      ['#hidden-link', '#3: <a> (Hidden from AT)', 'Focusable in Aria-Hidden'],
      ['#last', '#4: <a>', 'Valid Focus'],
    ]);
  });

  test('tabindex="-1" control is left out of the focus order', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/aria-hidden.html`, AUDITS);
    console.log('------------------------- REPORT')
    console.log(report)

    expect(focusMap(report.audit_trail[0]).map((e) => e.selector)).not.toContain('#hidden-safe');
  });

  test('tabindex="-1" control is NOT flagged by v-aria-hidden-focus', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/aria-hidden.html`, AUDITS);
    console.log('------------------------- REPORT')
    console.log(report)

    expect(selectorsFor(report.audit_trail[0], 'v-aria-hidden-focus')).not.toContain('#hidden-safe');
  });
});

test.describe('v-aria-hidden-focus rule logic', () => {
  const flaggedOn = async (baseURL) => {
    const { report } = await audit(`${baseURL}/aria-hidden-focus.html`, ['--audits', 'v-aria-hidden-focus']);
    console.log('------------------------- REPORT')
    console.log(report)

    return selectorsFor(report.audit_trail[0], 'v-aria-hidden-focus');
  };

  test('flags every rendered, tabbable control inside aria-hidden', async ({ baseURL }) => {
    const flagged = await flaggedOn(baseURL);
    console.log('------------------------- FLAGGED')
    console.log(flagged)

    expect(flagged).toEqual(expect.arrayContaining([
      '#v-button', '#v-link', '#v-editable', '#v-summary', '#v-tabindex0',
    ]));
  });

  test('does not flag controls that cannot be reached by keyboard', async ({ baseURL }) => {
    const flagged = await flaggedOn(baseURL);
    console.log('------------------------- FLAGGED')
    console.log(flagged)

    for (const id of [
      'ok-tabindex-neg1', 'ok-link-neg2', 'ok-div-neg1', 'ok-hidden-input', 'ok-disabled',
      'ok-aria-disabled', 'ok-display-none', 'ok-visibility-hidden', 'ok-not-editable',
      'ok-no-href', 'ok-inert', 'visible',
    ]) {
      expect(flagged, `#${id} should not be flagged`).not.toContain(`#${id}`);
    }
  });

  test('flags exactly the expected set', async ({ baseURL }) => {
    const flagged = await flaggedOn(baseURL);
    console.log('------------------------- FLAGGED')
    console.log(flagged)

    expect([...flagged].sort()).toEqual(
      ['#v-button', '#v-editable', '#v-link', '#v-summary', '#v-tabindex0'].sort()
    );
  });
});
