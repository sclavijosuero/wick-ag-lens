const { test, expect } = require('@playwright/test');
const { connectMcp, callTool } = require('../helpers/mcp');
const { toMcpSteps } = require('../helpers/auth');
const { sampleUrl } = require('../helpers/paths');
const { AUDITS, STEPS, defineJourneyTests } = require('../helpers/journey-suite');

// WORKED EXAMPLE (MCP): the same journey as cli/journey.spec.js, driven the way an AI agent would drive it:
//   audit_baseline(url, requestedAudits, includeScreenshot)      -> step 1
//   interact_and_diff(action, target, requestedAudits, ...)      -> steps 2..9, one call each
//   get_audit_trail()                                            -> the whole timeline in one JSON
// Note that requestedAudits is passed on EVERY interact_and_diff call: the filters are per call, so a step that
// omits them would run all the audits and its delta would no longer be comparable with the previous step.
// The expectations are shared with the CLI and agent-browser versions (helpers/journey-suite.js).
test.describe.configure({ mode: 'serial' });

test.describe('MCP multi-step journey: shop app', { tag: '@journey' }, () => {
  let client; let report; let perCall;

  test.beforeAll(async () => {
    client = await connectMcp();

    const baseline = await callTool(client, 'audit_baseline', {
      url: sampleUrl('shop-journey.html'), requestedAudits: AUDITS, includeScreenshot: true,
    });
    expect(baseline.isError).toBe(false);

    perCall = [baseline.json.audit_trail[0]];                       // what each call returned about ITS step
    for (const s of toMcpSteps(STEPS)) {
      const res = await callTool(client, 'interact_and_diff', { ...s, requestedAudits: AUDITS, includeScreenshot: true });
      expect(res.isError, res.text).toBe(false);
      perCall.push(res.json);
    }
    const trail = await callTool(client, 'get_audit_trail', {});
    report = trail.json;
  });
  test.afterAll(async () => { await client?.close(); });

  defineJourneyTests(() => report);

  test('each interact_and_diff call returns exactly the step that get_audit_trail later lists', () => {
    expect(perCall).toHaveLength(1 + STEPS.length);
    perCall.forEach((returned, i) => {
      const listed = report.audit_trail[i];
      expect(returned.step).toBe(listed.step);
      expect(returned.interaction).toEqual(listed.interaction);
      expect(returned.health_scores).toEqual(listed.health_scores);
      expect(returned.new_findings).toEqual(listed.new_findings);
      expect(returned.resolved_findings).toEqual(listed.resolved_findings);
    });
  });
});
