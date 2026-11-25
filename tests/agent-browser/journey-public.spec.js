const { test, expect } = require('@playwright/test');
const { AgentBrowser, available } = require('../helpers/agent-browser');
const { audit } = require('../helpers/cli');
const { connectMcp, callTool } = require('../helpers/mcp');
const { toMcpSteps } = require('../helpers/auth');
const { sampleUrl } = require('../helpers/paths');
const { AUDITS, STEPS, defineJourneyTests } = require('../helpers/journey-suite');

// THE SAME JOURNEY AS THE LOGIN VERSION, WITHOUT ANY LOGIN (samples/shop-journey.html, a public page).
// agent-browser plays the "scout": it opens the page and reads the accessibility snapshot to learn which controls exist
// (the cheap, token-efficient part of the documented workflow). wick-ag-lens then audits the same page step by step.
// The expectations are exactly the ones used for the CLI and MCP journeys and for the logged-in journey
// (helpers/journey-suite.js), so the only difference between all of these runs is how the page was reached.
test.skip(!available, 'agent-browser is not installed (npm install in the repo root)');
test.describe.configure({ mode: 'serial' });

test.describe('agent-browser scouting (no login) -> multi-step journey', { tag: ['@journey', '@agent-browser'] }, () => {
  const url = sampleUrl('shop-journey.html');

  test('agent-browser sees the controls the journey will use, and none of the dialog or menu yet', async () => {
    const ab = new AgentBrowser();
    try {
      await ab.run(['open', url]);
      const snapshot = await ab.run(['snapshot', '-i']);
      for (const name of ['Home', 'Menu', 'Sign up', 'Filter', 'Newsletter']) {
        expect(snapshot, `the snapshot should list "${name}"`).toContain(`"${name}"`);
      }
      expect(snapshot).not.toContain('Close menu');          // the menu is not open yet
      expect(snapshot).not.toContain('Create account');      // nor is the sign-up form
    } finally {
      await ab.close();
    }
  });

  test.describe('CLI', () => {
    let report;
    test.beforeAll(async () => {
      ({ report } = await audit(url, ['-s', '--audits', AUDITS.join(','), ...STEPS.flatMap((s) => ['--step', s])]));
    });
    defineJourneyTests(() => report);
  });

  test.describe('MCP', () => {
    let client; let report;
    test.beforeAll(async () => {
      client = await connectMcp();
      const first = await callTool(client, 'audit_baseline', { url, requestedAudits: AUDITS, includeScreenshot: true });
      expect(first.isError, first.text).toBe(false);
      for (const s of toMcpSteps(STEPS)) {
        const res = await callTool(client, 'interact_and_diff', { ...s, requestedAudits: AUDITS, includeScreenshot: true });
        expect(res.isError, res.text).toBe(false);
      }
      report = (await callTool(client, 'get_audit_trail', {})).json;
    });
    test.afterAll(async () => { await client?.close(); });
    defineJourneyTests(() => report);
  });
});
