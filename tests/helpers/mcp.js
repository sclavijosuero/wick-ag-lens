const { pathToFileURL } = require('url');
const { test } = require('@playwright/test');
const { mcpEntry, pkgDir } = require('./paths');

// Use the MCP SDK shipped with the package under test (its own node_modules).
async function connectMcp() {
  const sdk = (p) => import(pathToFileURL(
    require.resolve(`@modelcontextprotocol/sdk/${p}`, { paths: [pkgDir] })).href);
  const { Client } = await sdk('client/index.js');
  const { StdioClientTransport } = await sdk('client/stdio.js');

  const client = new Client({ name: 'wick-tests', version: '0.0.0' });
  await client.connect(new StdioClientTransport({
    command: process.execPath, args: [mcpEntry], cwd: pkgDir,
  }));
  return client;
}

// Calls a tool as a visible step, attaching the request and response.
function callTool(client, name, args) {
  return test.step(`MCP ${name}`, async () => {
    const info = test.info();
    await info.attach(`${name}-request`, { body: JSON.stringify(args, null, 2), contentType: 'application/json' });
    const result = await client.callTool({ name, arguments: args });
    const text = result.content.find((c) => c.type === 'text')?.text ?? '';
    await info.attach(`${name}-response`, { body: text || '(empty)', contentType: 'text/plain' });
    return { isError: !!result.isError, text, json: safeJson(text) };
  });
}
const safeJson = (t) => { try { return JSON.parse(t); } catch { return undefined; } };

module.exports = { connectMcp, callTool };
