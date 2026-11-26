const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { runCli, audit } = require('../helpers/cli');

// Every audit declares how reliable its detection is (core/a11y-config.js): "rule", "pattern" or "best-effort".
// It is disclosed in the extension, in audit_dictionary[auditId].info.detection / detection_note, and in README.md.
const ROOT = path.resolve(__dirname, '..', '..');
const LEVELS = ['rule', 'pattern', 'best-effort'];

function loadConfig() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'core', 'a11y-config.js'), 'utf8'), sandbox);
  return sandbox.window.A11Y_CONFIG;
}
const featuresOf = (cfg) => cfg.tabs.flatMap((t) => t.categories.flatMap((c) => c.features));

test.describe('audit detection levels', () => {
  test('every audit declares a valid level, and every level that is not rule-based explains its limit', () => {
    const cfg = loadConfig();
    const features = featuresOf(cfg);
    expect(features.length).toBeGreaterThan(50);
    expect(Object.keys(cfg.detectionLevels).sort()).toEqual([...LEVELS].sort());
    for (const f of features) {
      expect(LEVELS, `${f.id} needs a valid detection`).toContain(f.detection);
      if (f.detection === 'rule') expect(f.detectionNote, `${f.id} is rule-based, so it needs no note`).toBeUndefined();
      else expect((f.detectionNote || '').length, `${f.id} needs a detectionNote`).toBeGreaterThan(20);
    }
  });

  test('the root README has a Detection column on every audit row and lists every audit that is not rule-based', () => {
    const cfg = loadConfig();
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
    const rows = readme.split('\n').filter((l) => /\| \[View\]\(#[^)]+\) \| (Rule-based|Pattern-based|Best-effort) \|$/.test(l));
    expect(rows).toHaveLength(featuresOf(cfg).length);
    for (const f of featuresOf(cfg).filter((x) => x.detection !== 'rule')) {
      expect(readme, `README should list ${f.id}`).toContain(`\`${f.id}\``);
    }
  });

  test('the JSON report carries detection and detection_note in audit_dictionary', async ({ baseURL }) => {
    const { report } = await audit(`${baseURL}/bad.html`, ['--audits', 'v-doc-title,i-focus-order']);
    const dict = report.audit_dictionary;
    expect(dict['v-doc-title'].info).toMatchObject({ detection: 'rule', detection_note: '' });
    expect(dict['i-focus-order'].info.detection).toBe('pattern');
    expect(dict['i-focus-order'].info.detection_note.length).toBeGreaterThan(20);
  });
});
