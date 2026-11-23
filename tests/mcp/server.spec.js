const { test, expect } = require('@playwright/test');
const { connectMcp, callTool } = require('../helpers/mcp');

test.describe('wick-mcp server', () => {
  let client;
  test.beforeEach(async () => { client = await connectMcp(); });
  test.afterEach(async () => { await client?.close(); });

  test('exposes the expected tools', async () => {
    const { tools } = await test.step('MCP listTools', () => client.listTools());
    await test.info().attach('tools', { body: tools.map((t) => t.name).join('\n'), contentType: 'text/plain' });
    expect(tools.map((t) => t.name)).toEqual(
      expect.arrayContaining(['audit_baseline', 'interact_and_diff', 'get_audit_trail']));
  });

  test('audit_baseline finds violations', async ({ baseURL }) => {
    const res = await callTool(client, 'audit_baseline',
      { url: `${baseURL}/bad.html`, requestedAudits: ['v-doc-title', 'v-missing-alt'] });
    expect(res.isError).toBe(false);
    expect(res.text).toContain('v-doc-title');
    expect(res.text).toContain('v-missing-alt');
  });

  test('get_audit_trail returns the accumulated trail', async ({ baseURL }) => {
    await callTool(client, 'audit_baseline', { url: `${baseURL}/bad.html`, requestedAudits: ['v-doc-title'] });
    const res = await callTool(client, 'get_audit_trail', {});
    expect(res.isError).toBe(false);
    expect(res.text).toContain('v-doc-title');
  });
});
