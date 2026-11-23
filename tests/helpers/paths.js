const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
// Package under test. Defaults to the built ./cli folder; override to point at
// an extracted tarball, e.g. WICK_PKG_DIR=/tmp/extracted/package
const pkgDir = process.env.WICK_PKG_DIR
  ? path.resolve(process.env.WICK_PKG_DIR)
  : path.join(repoRoot, 'cli');

module.exports = {
  repoRoot,
  pkgDir,
  cliEntry: path.join(pkgDir, 'index.js'),
  mcpEntry: path.join(pkgDir, 'mcp-server.js'),
};
