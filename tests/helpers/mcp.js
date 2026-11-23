const path = require('path');
const { pathToFileURL } = require('url');
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

// MCP tools return JSON as a text content block.
function parseToolResult(result) {
  const text = result.content.find((c) => c.type === 'text')?.text ?? '';
  return { isError: !!result.isError, text, json: safeJson(text) };
}
const safeJson = (t) => { try { return JSON.parse(t); } catch { return undefined; } };

module.exports = { connectMcp, parseToolResult };
