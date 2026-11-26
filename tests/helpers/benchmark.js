// Light checks for the benchmark journey (tests/benchmark/). The benchmark is about LLM usage, speed and effectiveness, so these tests
// only make sure the page and the journey still work, and attach what happened. They run no LLM, so they cost no tokens.
//   - tests/benchmark/reference.js is the ANSWER KEY used to score an agent's result. Here it is only compared informatively.
const { test, expect } = require('@playwright/test');
const { STEPS, AUDITS } = require('../benchmark/journey');
const { REFERENCE } = require('../benchmark/reference');
const { attachScreenshots } = require('./cli');

// audit id -> number of elements, for the new or resolved findings of one step
function counts(findings) {
  const m = {};
  for (const tab of Object.values(findings || {})) for (const cat of Object.values(tab)) for (const a of cat) m[a.auditId] = (m[a.auditId] || 0) + a.elements.length;
  return Object.fromEntries(Object.entries(m).sort());
}

function defineBenchmarkTests(getReport, getShopUrl) {
  const trail = () => getReport().audit_trail;

  // Smoke check: the login held, all 15 steps ran, and the audits found things (the page is still full of problems).
  test('the journey runs: signed in, baseline plus 15 steps, and the audits report findings', () => {
    expect(trail()).toHaveLength(16);
    expect(trail()[0].url).toBe(getShopUrl());
    expect(trail().slice(1).map((s) => `${s.interaction.action}::${s.interaction.selector}`)).toEqual(STEPS.map((s) => s.split('::').slice(0, 2).join('::')));
    const reported = new Set();
    trail().forEach((s) => Object.keys(counts(s.new_findings)).forEach((k) => reported.add(k)));
    expect(AUDITS.filter((a) => a !== 'i-focus-order' && !reported.has(a)), 'audits that reported nothing').toEqual([]);
  });

  // Not an assertion: attaches the per-step summary and, for information, where the run differs from the answer key.
  test('output: attach the summary, the differences from the answer key (informative), the JSON and the screenshots', async () => {
    const report = getReport();
    const sum = (o) => String(Object.values(o).reduce((a, b) => a + b, 0)).padStart(3);
    const rows = []; const drift = [];
    REFERENCE.forEach((ref, i) => {
      const n = counts(trail()[i].new_findings); const z = counts(trail()[i].resolved_findings);
      rows.push(`${String(ref.step).padStart(2)}  ${ref.does.padEnd(36)} new ${sum(n)}  resolved ${sum(z)}  stops ${trail()[i].page_state_maps.focus_order.totalElems}`);
      if (JSON.stringify(n) !== JSON.stringify(ref.new) || JSON.stringify(z) !== JSON.stringify(ref.resolved)) drift.push(`step ${ref.step} (${ref.does}) differs from tests/benchmark/reference.js`);
    });
    await test.info().attach('benchmark-summary', { body: rows.join('\n'), contentType: 'text/plain' });
    await test.info().attach('differences-from-answer-key', { body: drift.join('\n') || 'none: identical to tests/benchmark/reference.js', contentType: 'text/plain' });
    await test.info().attach('benchmark-report.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
    if (report.audit_trail[0].screenshot_base64) await attachScreenshots(report, 'benchmark');
  });
}

module.exports = { defineBenchmarkTests, counts };
