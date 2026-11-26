const path = require('path');
const { pathToFileURL } = require('url');

const repoRoot = path.resolve(__dirname, '..', '..');
// Package under test. Defaults to the built ./cli folder; override to point at
// an extracted tarball, e.g. WICK_PKG_DIR=/tmp/extracted/package
const pkgDir = process.env.WICK_PKG_DIR
  ? path.resolve(process.env.WICK_PKG_DIR)
  : path.join(repoRoot, 'cli');

// file:// URL of a sample page shipped inside the package under test (cli/samples/<name>)
const sampleUrl = (name) => pathToFileURL(path.join(pkgDir, 'samples', name)).href;

// file:// URL of a fixture page (tests/fixtures/pages/<name>), for pages that must be opened from disk (no server headers)
const fixtureFileUrl = (name) => pathToFileURL(path.join(repoRoot, 'tests', 'fixtures', 'pages', name)).href;

module.exports = {
  sampleUrl,
  fixtureFileUrl,
  repoRoot,
  pkgDir,
  cliEntry: path.join(pkgDir, 'index.js'),
  mcpEntry: path.join(pkgDir, 'mcp-server.js'),
};
