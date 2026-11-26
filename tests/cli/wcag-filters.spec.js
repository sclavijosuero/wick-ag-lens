const { test, expect } = require('@playwright/test');
const { audit } = require('../helpers/cli');
const { extensionLegendLabels, FEATURES, COMBOS, legendsByAudit } = require('../helpers/wcag');

// WCAG VERSION / LEVEL FILTERS (--wcag-version, --wcag-level) must behave like the extension's checkboxes, including the
// features that filter PER LEGEND: text contrast (AA fail / AAA fail), touch targets (small / medium / large) and
// language of parts. The page has one element for each legend. For every combination, the legends the CLI reports must be
// exactly the ones the extension would show (helpers/wcag.js applies the extension's own rule to the core config).
test.describe('WCAG filters apply per legend, like the extension', () => {
  test.describe.configure({ mode: 'serial' });
  const results = new Map();

  test.beforeAll(async ({ baseURL }) => {
    for (const combo of COMBOS) {
      const { report } = await audit(`${baseURL}/wcag-filters.html`, ['--audits', FEATURES.join(','), ...combo.args]);
      results.set(combo.name, legendsByAudit(report.audit_trail[0]));
    }
  });

  test('unfiltered, the page shows every legend once: both contrast failures, the three target sizes, the language shift', () => {
    const all = results.get('no filter (everything)');
    expect(all['v-text-contrast']).toEqual(expect.arrayContaining(['AA Fail', 'AAA Fail']));
    expect(all['i-touch-targets']).toHaveLength(3);
    expect(all['i-language']).toEqual(expect.arrayContaining(['Inline Shift']));
  });

  for (const combo of COMBOS) {
    test(`${combo.name}: the legends reported are exactly the ones the extension shows`, () => {
      const unfiltered = results.get('no filter (everything)');
      const got = results.get(combo.name);
      for (const id of FEATURES) {
        const active = extensionLegendLabels(id, combo.versions, combo.levels);
        const expected = (unfiltered[id] ?? []).filter((label) => active.includes(label)).sort();
        expect(got[id] ?? [], `${id} with ${combo.name}`).toEqual(expected);
      }
    });
  }

  test('a selection that excludes AAA hides the AAA-only legends; one that excludes AA hides the AA ones', () => {
    expect(results.get('2.0 + 2.1, A + AA (the recommended default)')['v-text-contrast']).not.toContain('AAA Fail');
    expect(results.get('AAA only')['v-text-contrast']).not.toContain('AA Fail');
    expect(results.get('AAA only')['v-text-contrast']).toContain('AAA Fail');
  });
});
