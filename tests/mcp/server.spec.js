const { test, expect } = require('@playwright/test');
const { connectMcp, callTool } = require('../helpers/mcp');
const { selectorsFor } = require('../helpers/cli');

test.describe('wick-mcp server', () => {
  let client;
  test.beforeEach(async () => { client = await connectMcp(); });
  test.afterEach(async () => { await client?.close(); });

  test('exposes the expected tools', async () => {
    const { tools } = await test.step('MCP listTools', () => client.listTools());
    console.log('------------------------- TOOLS')
    console.log(tools)

    await test.info().attach('tools', { body: tools.map((t) => t.name).join('\n'), contentType: 'text/plain' });
    expect(tools.map((t) => t.name)).toEqual(
      expect.arrayContaining(['audit_baseline', 'interact_and_diff', 'get_audit_trail']));
  });

  test('audit_baseline finds violations', async ({ baseURL }) => {
    const res = await callTool(client, 'audit_baseline',
      { url: `${baseURL}/bad.html`, requestedAudits: ['v-doc-title', 'v-missing-alt'] });
    console.log('------------------------- AUDIT BASELINE')
    console.log(res)

    expect(res.isError).toBe(false);
    expect(res.text).toContain('v-doc-title');
    expect(res.text).toContain('v-missing-alt');
  });

  test('get_audit_trail returns the accumulated trail', async ({ baseURL }) => {
    await callTool(client, 'audit_baseline', { url: `${baseURL}/bad.html`, requestedAudits: ['v-doc-title'] });
    const res = await callTool(client, 'get_audit_trail', {});
    console.log('------------------------- AUDIT TRAIL')
    console.log(res)

    expect(res.isError).toBe(false);
    expect(res.text).toContain('v-doc-title');
  });

  // The documented session protocol: audit_baseline -> interact_and_diff (repeat) -> get_audit_trail.
  test('baseline -> interact_and_diff -> get_audit_trail follows the session protocol', async ({ baseURL }) => {
    const ids = (step) => Object.values(step.new_findings || {})
      .flatMap((groups) => Object.values(groups).flat()).map((f) => f.auditId);

    // 1. Baseline: returns the full trail (1 step). Nothing is wrong on the page yet.
    const audits = ['v-empty-buttons', 'v-missing-alt'];
    const baseline = await callTool(client, 'audit_baseline',
      { url: `${baseURL}/focus-demo.html`, requestedAudits: audits });
    console.log('------------------------- AUDIT BASELINE')
    console.log(baseline)    

    expect(baseline.isError).toBe(false);
    expect(baseline.json.audit_trail).toHaveLength(1);
    expect(ids(baseline.json.audit_trail[0])).toEqual([]);

    // 2. Interaction: returns ONE step object (not the whole trail) with only what changed.
    //    "Show more options" reveals a panel with exactly two deliberate defects: an image without alt
    //    (#promo) and an icon-only button without a name (#wishlist).
    const diff = await callTool(client, 'interact_and_diff',
      { action: 'click', target: '#show-more', requestedAudits: audits });
    console.log('------------------------- INTERACT AND DIFF')
    console.log(diff)

    expect(diff.isError).toBe(false);
    expect(diff.json.step).toBe(2);
    expect(diff.json.interaction).toMatchObject({ action: 'click', selector: '#show-more' });
    expect(selectorsFor(diff.json, 'v-empty-buttons')).toEqual(['#wishlist']);
    expect(selectorsFor(diff.json, 'v-missing-alt')).toEqual(['#promo']);
    expect(new Set(ids(diff.json))).toEqual(new Set(audits)); // nothing else is reported

    // 3. Trail: the whole session, baseline plus the interaction, with the shared dictionary.
    const trail = await callTool(client, 'get_audit_trail', {});
    console.log('------------------------- AUDIT TRAIL')
    console.log(trail)

    expect(trail.json.audit_trail.map((s) => s.step)).toEqual([1, 2]);
    // the trail holds the same findings the interaction returned, attributed to step 2 and not to the baseline
    expect(selectorsFor(trail.json.audit_trail[0], 'v-empty-buttons')).toEqual([]);
    expect(selectorsFor(trail.json.audit_trail[1], 'v-empty-buttons')).toEqual(['#wishlist']);
    expect(selectorsFor(trail.json.audit_trail[1], 'v-missing-alt')).toEqual(['#promo']);
    expect(trail.json.audit_dictionary).toHaveProperty('v-empty-buttons');
  });

  test('interact_and_diff without a baseline returns an error', async () => {
    const res = await callTool(client, 'interact_and_diff', { action: 'click', target: '#x' });
    console.log('------------------------- ERROR')
    console.log(res)

    expect(res.isError).toBe(true);
    expect(res.text).toContain("Please run 'audit_baseline' first");
  });
});
