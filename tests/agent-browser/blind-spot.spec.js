const { test, expect } = require('@playwright/test');
const { AgentBrowser, available } = require('../helpers/agent-browser');
const { audit, selectorsFor } = require('../helpers/cli');

// "Accessibility blind-spot resolution" (cli/README.md): agent-browser works from the accessibility tree,
// wick-ag-lens from the raw DOM. A clickable <div> with no role is the classic case where they differ.
//
// Verified behaviour: agent-browser does NOT lose the control (it lists it as a `generic ... clickable` and
// the agent can still click it by @ref), but it cannot tell the agent it is a button. wick-ag-lens reports
// the raw selector and the keyboard-access violation.
test.skip(!available, 'agent-browser is not installed (npm install in the repo root)');

test.describe('agent-browser vs wick-ag-lens: the clickable <div> blind spot', { tag: '@agent-browser' }, () => {
  let ab;
  test.beforeEach(() => { ab = new AgentBrowser(); });
  test.afterEach(async () => { await ab.close(); });

  test('agent-browser lists the div only as a generic "clickable"; the real button gets its role', async ({ baseURL }) => {
    await ab.run(['open', `${baseURL}/blind-spot.html`]);
    const snapshot = await ab.run(['snapshot', '-i']);
    expect(snapshot).toMatch(/button "Buy now \(button\)" \[ref=e\d+\]/);
    expect(snapshot).toMatch(/generic "Buy now \(div\)" \[ref=e\d+\] clickable/);
    expect(snapshot).not.toMatch(/button "Buy now \(div\)"/);           // never presented as a button
  });

  test('the agent can still click the div by @ref (so the page works for mouse, not keyboard, users)', async ({ baseURL }) => {
    await ab.run(['open', `${baseURL}/blind-spot.html`]);
    const snapshot = await ab.run(['snapshot', '-i']);
    const ref = snapshot.match(/generic "Buy now \(div\)" \[ref=(e\d+)\]/)?.[1];
    expect(ref, 'the div should have a ref').toBeTruthy();
    await ab.run(['click', `@${ref}`]);
    expect(await ab.run(['get', 'text', '#result'])).toBe('fake');
  });

  test('wick-ag-lens flags the div (v-unfocusable) with its raw selector, and not the real button', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/blind-spot.html`, ['--audits', 'v-unfocusable']);
    expect(selectorsFor(report.audit_trail[0], 'v-unfocusable')).toEqual(['#fake-buy']);
  });
});
