const { test, expect } = require('@playwright/test');
const { connectMcp, callTool } = require('../helpers/mcp');
const { extensionLegendLabels, FEATURES, COMBOS, legendsByAudit } = require('../helpers/wcag');

// The MCP twin of cli/wcag-filters.spec.js: audit_baseline with wcagVersions / wcagLevels must give exactly the legends the
// extension would show (helpers/wcag.js applies the extension's own rule to the core config), per legend, not per audit.
test.describe('MCP: WCAG filters apply per legend, like the extension', () => {
  test.describe.configure({ mode: 'serial' });
  const results = new Map();
  let client;

  // One audit_baseline per combination of versions and levels (each call starts a fresh baseline).
  test.beforeAll(async ({ baseURL }) => {
    client = await connectMcp();
    for (const combo of COMBOS) {
      const res = await callTool(client, 'audit_baseline', { url: `${baseURL}/wcag-filters.html`, requestedAudits: FEATURES, ...combo.mcp });
      expect(res.isError, res.text).toBe(false);
      results.set(combo.name, legendsByAudit(res.json.audit_trail[0]));
    }
  });
  test.afterAll(async () => { await client?.close(); });

  for (const combo of COMBOS) {
    test(`${combo.name}: the legends reported are exactly the ones the extension shows`, () => {
      const unfiltered = results.get('no filter (everything)');
      for (const id of FEATURES) {
        const active = extensionLegendLabels(id, combo.versions, combo.levels);
        const expected = (unfiltered[id] ?? []).filter((label) => active.includes(label)).sort();
        expect(results.get(combo.name)[id] ?? [], `${id} with ${combo.name}`).toEqual(expected);
      }
    });
  }

  test('the filters really remove something (the check above is not vacuous)', () => {
    expect(results.get('2.0 + 2.1, A + AA (the recommended default)')['v-text-contrast']).toEqual(['AA Fail']);
    expect(results.get('AAA only')['v-text-contrast']).toEqual(['AAA Fail']);
  });
});
