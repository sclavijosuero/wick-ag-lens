// Keeps tests/README.md honest: the "What runs what" tables must match the real tags and npm scripts.
//  - every tag used in a spec file has a row in the Tags table, and every row's tag is still used
//  - each row names the files that carry the tag (either the file itself, or its folder for "all files in `dir/`")
//  - every npm "test" script is mentioned in the README
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { repoRoot } = require('../helpers/paths');

const testsDir = path.join(repoRoot, 'tests');
const readme = fs.readFileSync(path.join(testsDir, 'README.md'), 'utf8');

function specFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'fixtures' ? [] : specFiles(full);
    return e.name.endsWith('.spec.js') ? [full] : [];
  });
}

// tag -> Set of "folder/name" (e.g. "cli/auth", no .spec.js), read from the Playwright `tag` option (a string or an array)
const usedTags = new Map();
for (const file of specFiles(testsDir)) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(testsDir, file).split(path.sep).join('/').replace(/\.spec\.js$/, '');
  for (const m of src.matchAll(/\btag:\s*(\[[^\]]*\]|'[^']*'|"[^"]*")/g)) {
    for (const t of m[1].match(/@[\w-]+/g) ?? []) {
      if (!usedTags.has(t)) usedTags.set(t, new Set());
      usedTags.get(t).add(rel);
    }
  }
}

// Rows of the Tags table: | `@tag` | where | notes |
const docRows = new Map();
for (const line of readme.split(/\r?\n/)) {
  const m = line.match(/^\|\s*`(@[\w-]+)`\s*\|(.*)$/);
  if (m) docRows.set(m[1], m[2]);
}

test.describe('tests/README.md matches the tests', { tag: '@docs' }, () => {
  test('every tag used in a spec file has a row in the Tags table', () => {
    const missing = [...usedTags.keys()].filter((t) => !docRows.has(t));
    expect(missing, 'tags used in tests but missing from the Tags table in tests/README.md').toEqual([]);
  });

  test('every tag in the Tags table is still used by a test', () => {
    const stale = [...docRows.keys()].filter((t) => !usedTags.has(t));
    expect(stale, 'tags in the README table that no test uses any more').toEqual([]);
  });

  test('each tag row lists the files that carry the tag', () => {
    const problems = [];
    for (const [tag, files] of usedTags) {
      const row = docRows.get(tag);
      if (!row) continue;                                  // reported by the first test
      for (const rel of files) {
        const dir = rel.split('/')[0];
        if (!row.includes(`\`${rel}\``) && !row.includes(`\`${dir}/\``)) {
          problems.push(`${tag}: row does not mention \`${rel}\` (or \`${dir}/\`)`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  test('every npm test script is documented', () => {
    const scripts = Object.keys(require(path.join(repoRoot, 'package.json')).scripts)
      .filter((s) => s === 'test' || s.startsWith('test:'));
    expect(scripts.length).toBeGreaterThan(8);
    const undocumented = scripts.filter((s) => !readme.includes(s === 'test' ? 'npm test' : s));
    expect(undocumented, 'npm scripts that tests/README.md never mentions').toEqual([]);
  });

  test('every environment variable the tests read is documented', () => {
    const used = new Set();
    for (const file of [...specFiles(testsDir), ...fs.readdirSync(path.join(testsDir, 'helpers')).map((f) => path.join(testsDir, 'helpers', f)),
      path.join(repoRoot, 'playwright.config.js'), path.join(testsDir, 'fixtures', 'server.js')]) {
      for (const m of fs.readFileSync(file, 'utf8').matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) used.add(m[1]);
    }
    const ignore = new Set(['PATH', 'HOME', 'USERPROFILE', 'TEMP', 'TMP']);
    const undocumented = [...used].filter((v) => !ignore.has(v) && !readme.includes(v));
    expect(undocumented, 'environment variables read by the tests but missing from tests/README.md').toEqual([]);
  });
});
