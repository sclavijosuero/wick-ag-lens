const { test, expect } = require('@playwright/test');
const { connectMcp, parseToolResult } = require('../helpers/mcp');

test.describe('wick-mcp server', () => {
  let client;
  test.beforeEach(async () => { client = await connectMcp(); });
  test.afterEach(async () => { await client?.close(); });

  test('exposes the expected tools', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(
      expect.arrayContaining(['audit_baseline', 'interact_and_diff', 'get_audit_trail']));
  });

  test('audit_baseline finds violations', async ({ baseURL }) => {
    const res = parseToolResult(await client.callTool({
      name: 'audit_baseline',
      arguments: { url: `${baseURL}/bad.html`, requestedAudits: ['v-doc-title', 'v-missing-alt'] },
    }));
    expect(res.isError).toBe(false);
    expect(res.text).toContain('v-doc-title');
    expect(res.text).toContain('v-missing-alt');
  });

  test('get_audit_trail returns the accumulated trail', async ({ baseURL }) => {
    await client.callTool({ name: 'audit_baseline', arguments: { url: `${baseURL}/bad.html`, requestedAudits: ['v-doc-title'] } });
    const res = parseToolResult(await client.callTool({ name: 'get_audit_trail', arguments: {} }));
    expect(res.isError).toBe(false);
    expect(res.text).toContain('v-doc-title');
  });
});
