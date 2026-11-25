const { test, expect } = require('@playwright/test');
const { connectMcp, callTool } = require('../helpers/mcp');
const { toMcpSteps } = require('../helpers/auth');
const { sampleUrl } = require('../helpers/paths');
const { AUDITS, STEPS, defineStepsDemoTests } = require('../helpers/steps-demo');

// The step-actions sample through MCP: audit_baseline, then one interact_and_diff per action. The tool accepts exactly the
// six actions of the documentation (click, fill, select, press, hover, wait), and every call must return the same diff the
// CLI reports for the same step (shared expectations, helpers/steps-demo.js).
test.describe.configure({ mode: 'serial' });

test.describe('MCP sample: every step action (samples/steps-demo.html)', { tag: '@samples' }, () => {
  let client; let report; let returned;

  test.beforeAll(async () => {
    client = await connectMcp();
    const first = await callTool(client, 'audit_baseline', { url: sampleUrl('steps-demo.html'), requestedAudits: AUDITS, includeScreenshot: true });
    expect(first.isError, first.text).toBe(false);
    returned = [first.json.audit_trail[0]];
    for (const s of toMcpSteps(STEPS)) {
      const res = await callTool(client, 'interact_and_diff', { ...s, requestedAudits: AUDITS, includeScreenshot: true });
      expect(res.isError, res.text).toBe(false);
      returned.push(res.json);
    }
    report = (await callTool(client, 'get_audit_trail', {})).json;
  });
  test.afterAll(async () => { await client?.close(); });

  defineStepsDemoTests(() => report);

  test('each interact_and_diff call returns the step that get_audit_trail later lists', () => {
    expect(returned).toHaveLength(1 + STEPS.length);
    returned.forEach((r, i) => {
      const listed = report.audit_trail[i];
      expect(r.interaction).toEqual(listed.interaction);
      expect(r.new_findings).toEqual(listed.new_findings);
      expect(r.resolved_findings).toEqual(listed.resolved_findings);
      expect(r.health_scores).toEqual(listed.health_scores);
    });
  });

  test('an unknown action is rejected by the tool schema, and no step is added', async () => {
    const before = report.audit_trail.length;
    const result = await client.callTool({ name: 'interact_and_diff', arguments: { action: 'drag', target: '#open-panel', requestedAudits: AUDITS } })
      .catch((e) => ({ isError: true, content: [{ type: 'text', text: String(e.message) }] }));
    expect(result.isError).toBe(true);
    const trail = (await callTool(client, 'get_audit_trail', {})).json;
    expect(trail.audit_trail).toHaveLength(before);
  });
});
