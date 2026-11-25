// The sample pages are shipped in the npm package (cli/samples/, built from /samples by build.js) and the tests run
// against that packaged copy. These checks keep the pieces in step.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { repoRoot, pkgDir } = require('../helpers/paths');

const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');
const SAMPLES = ['steps-demo.html', 'shop-journey.html'];
// Files of the sample server + login examples (cli/docs/sample-journeys.md); they must ship too
const LOGIN_SAMPLES = ['server.mjs', 'login.html', 'login-script.mjs'];

test.describe('sample pages', { tag: '@samples' }, () => {
  test('the packaged copy (cli/samples) is up to date with /samples', () => {
    for (const f of SAMPLES) {
      expect(fs.existsSync(path.join(pkgDir, 'samples', f)), `${f} must be built into the package (run node build.js)`).toBe(true);
      expect(read(pkgDir, 'samples', f)).toBe(read(repoRoot, 'samples', f));
    }
  });

  test('the sample server and login examples ship in the package, up to date', () => {
    for (const f of LOGIN_SAMPLES) {
      expect(fs.existsSync(path.join(pkgDir, 'samples', f)), `${f} must be built into the package`).toBe(true);
      expect(read(pkgDir, 'samples', f)).toBe(read(repoRoot, 'samples', f));
    }
  });

  test('the samples are self-contained: no network, no external scripts, styles or images', () => {
    for (const f of SAMPLES) {
      const html = read(repoRoot, 'samples', f).replace(/<!--[\s\S]*?-->/g, '');          // ignore comments
      expect(html, `${f} must not load anything over the network`).not.toMatch(/<(script|link|img|iframe)\b[^>]*\b(src|href)\s*=\s*["']https?:/i);
      expect(html).not.toMatch(/<script\b[^>]*\bsrc=/i);
    }
  });

  test('the server-backed copy used behind a login (tests/fixtures/pages/journey.html) only differs in the Home link', () => {
    const shipped = read(repoRoot, 'samples', 'shop-journey.html');
    const fixture = read(repoRoot, 'tests', 'fixtures', 'pages', 'journey.html');
    const normalise = (s) => s
      .replace(/<!--[\s\S]*?-->/g, '')                                         // header comments differ on purpose
      .replace(/href="(#home|\/account\.html)"/, 'href="HOME"')
      .replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{2,}/g, '\n');
    expect(normalise(fixture)).toBe(normalise(shipped));
  });
});
