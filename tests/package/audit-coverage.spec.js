const { test, expect } = require('@playwright/test');
const { ALL_AUDIT_IDS } = require('../helpers/wcag');
const { auditsCovered } = require('../helpers/golden');

// Which audits the regression journeys actually exercise: an audit is covered when it reports (new or resolved) in at least one
// golden file (tests/golden/*.json), or, for the focus order, when a golden file freezes focus stops.
//
// Every audit is covered today: the short, medium and long journeys reach 31 of them, and the coverage journey
// (tests/fixtures/pages/coverage.html) plants a finding for each of the other 24. A NEW audit must be added to one of the journeys
// (usually the coverage page), regenerating its golden file on purpose (WICK_UPDATE_GOLDEN=1); otherwise it fails here, so an audit
// cannot ship that no test would notice changing or breaking.
test.describe('audit coverage of the regression journeys', { tag: '@docs' }, () => {
  test('every audit is exercised by at least one golden file', () => {
    const covered = auditsCovered();
    expect(ALL_AUDIT_IDS.length, 'the audits found in core/a11y-config.js').toBeGreaterThanOrEqual(55);
    expect(ALL_AUDIT_IDS.filter((id) => !covered.has(id)), 'audits with no regression coverage: add them to a journey (tests/fixtures/pages/coverage.html)').toEqual([]);
  });

  test('the golden files only mention audits that exist', () => {
    expect([...auditsCovered()].filter((id) => !ALL_AUDIT_IDS.includes(id)), 'audits in a golden file that no longer exist').toEqual([]);
  });
});
