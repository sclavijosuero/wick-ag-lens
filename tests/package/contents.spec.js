// Guards the "tests are never shipped" requirement by inspecting what `npm pack` would publish.
const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { repoRoot } = require('../helpers/paths');

test.describe('npm package contents', () => {
  let files;
  test.beforeAll(() => {
    // One constant command string (no user input): on Windows `npm` is a .cmd shim that needs a shell,
    // and passing an args array together with `shell: true` triggers Node's DEP0190 deprecation warning.
    const out = execSync('npm pack ./cli --dry-run --json --ignore-scripts',
      { cwd: repoRoot, encoding: 'utf8' });
    files = JSON.parse(out)[0].files.map((f) => f.path.split('\\').join('/'));
  });

  test('includes runtime files, core and skill', () => {
    for (const f of ['index.js', 'mcp-server.js', 'scanner.js', 'cli-adapter.js',
      'core/a11y-config.js', 'core/shared-utils.js', 'skills/wick-ag-lens/SKILL.md',
      'report-template/wick-ag-lens-viewer.html', 'package.json']) {
      expect(files, f).toContain(f);
    }
  });

  test('excludes tests, extension, and dev tooling', () => {
    const banned = /^(assets\/|tests?\/|extension\/|node_modules\/|playwright\.config|test-results|playwright-report|\.github\/)/;
    expect(files.filter((f) => banned.test(f))).toEqual([]);
  });

  test('extension folder contains no test artifacts', () => {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
    const hits = walk(path.join(repoRoot, 'extension')).filter((f) => /\.(spec|test)\.[jt]s$|playwright/i.test(f));
    expect(hits).toEqual([]);
  });
});
