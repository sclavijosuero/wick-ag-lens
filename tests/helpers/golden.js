// GOLDEN FILES: the frozen, step-by-step result of a journey (tests/golden/<id>.json).
//
// One file per journey. For every step it records what the audits must report:
//   action   the interaction as it was requested ("click::#open-menu")
//   health   [Critical, Serious, Moderate, Informative] active on the page AFTER the step
//   focus    the focus order after the step (a full snapshot): "selector" or "selector|legend" for flagged stops
//   new / resolved
//     detail 'elements'  every finding, as "audit-id selector | issue text" (sorted)
//     detail 'counts'    how many elements per audit ({ "v-missing-alt": 3 }): used for the long journey (about 640 findings)
//
// Every surface (CLI, MCP, agent-browser, with or without a login) is compared with the SAME file, so a change in what the
// audits report shows up as a precise, readable difference, and a difference between two tools shows up as a failure.
//
// A golden file is rewritten ONLY on purpose: WICK_UPDATE_GOLDEN=1 npx playwright test --grep @journeys ...
// (do it after fixing a bug or changing an audit, and read the diff before committing it).
const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');
const { delta, replay } = require('./journey');

const GOLDEN_DIR = path.join(__dirname, '..', 'golden');
const fileOf = (id) => path.join(GOLDEN_DIR, `${id}.json`);

const focusOf = (step) => (step.page_state_maps?.focus_order?.elements ?? [])
  .map((e) => (e.legend && e.legend !== 'Valid Focus' ? `${e.selector}|${e.legend}` : e.selector));

const entry = (r) => `${r.auditId} ${r.selector} | ${r.issueText}`;
const countBy = (rows) => {
  const m = {};
  for (const r of rows) m[r.auditId] = (m[r.auditId] || 0) + 1;
  return Object.fromEntries(Object.entries(m).sort());
};

// The frozen shape of a report
function snapshot(report, detail = 'elements') {
  return report.audit_trail.map((s) => {
    const { added, resolved } = delta(s);
    const h = s.health_scores;
    const i = s.interaction;
    return {
      step: s.step,
      action: i.action === 'navigate' ? 'navigate' : [i.action, i.selector, i.value].filter((x) => x !== undefined).join('::'),
      health: [h.Critical, h.Serious, h.Moderate, h.Informative],
      focus: detail === 'counts' ? (s.page_state_maps?.focus_order?.totalElems ?? 0) : focusOf(s),
      new: detail === 'counts' ? countBy(added) : added.map(entry).sort(),
      resolved: detail === 'counts' ? countBy(resolved) : resolved.map(entry).sort(),
    };
  });
}

// Readable differences between two snapshots: one line per step and field, with what is missing and what is unexpected
function differences(expected, actual) {
  const out = [];
  if (expected.length !== actual.length) out.push(`expected ${expected.length} steps, got ${actual.length}`);
  for (let n = 0; n < Math.min(expected.length, actual.length); n++) {
    const e = expected[n]; const a = actual[n];
    for (const key of ['action', 'health', 'focus', 'new', 'resolved']) {
      if (JSON.stringify(e[key]) === JSON.stringify(a[key])) continue;
      if (Array.isArray(e[key]) && Array.isArray(a[key]) && key !== 'health') {
        const missing = e[key].filter((x) => !a[key].includes(x)); const extra = a[key].filter((x) => !e[key].includes(x));
        out.push(`step ${e.step} ${key}: missing ${JSON.stringify(missing)} unexpected ${JSON.stringify(extra)}${missing.length + extra.length === 0 ? ' (same items, different order)' : ''}`);
      } else {
        out.push(`step ${e.step} ${key}: expected ${JSON.stringify(e[key])} but got ${JSON.stringify(a[key])}`);
      }
    }
  }
  return out;
}

// Compares a report with the golden file of a journey. `steps` limits the check to the first N trail entries (for
// shorter runs of the same journey, e.g. the login showcase). Also checks the JSON is coherent: replaying the deltas
// reproduces every health score, and every audit that reported has an entry in the dictionary.
function expectGolden(report, id, { detail = 'elements', steps } = {}) {
  const actual = snapshot(report, detail);
  const file = fileOf(id);
  if (process.env.WICK_UPDATE_GOLDEN && steps === undefined) {
    fs.mkdirSync(GOLDEN_DIR, { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify({ journey: id, detail, steps: actual }, null, 1)}\n`);
  }
  if (!fs.existsSync(file)) throw new Error(`No golden file ${file}. Create it on purpose with WICK_UPDATE_GOLDEN=1.`);
  const golden = JSON.parse(fs.readFileSync(file, 'utf8')).steps;
  const expected = steps === undefined ? golden : golden.slice(0, steps);
  expect(differences(expected, actual), `findings differ from tests/golden/${id}.json`).toEqual([]);

  const { problems } = replay(report);
  expect(problems, 'the JSON is not coherent').toEqual([]);
  const used = new Set(report.audit_trail.flatMap((s) => [...delta(s).added, ...delta(s).resolved].map((r) => r.auditId)));
  for (const a of used) expect(report.audit_dictionary, `dictionary entry for ${a}`).toHaveProperty(a);
}

// Every audit id that appears (new or resolved) in at least one golden file
function auditsCovered() {
  const ids = new Set();
  for (const f of fs.readdirSync(GOLDEN_DIR).filter((x) => x.endsWith('.json'))) {
    const { detail, steps } = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, f), 'utf8'));
    for (const s of steps) {
      if (detail === 'counts' ? s.focus > 0 : s.focus.length > 0) ids.add('i-focus-order');   // a state map, frozen in `focus`, never a finding
      for (const side of [s.new, s.resolved]) {
      if (detail === 'counts') Object.keys(side).forEach((k) => ids.add(k));
      else side.forEach((x) => ids.add(x.split(' ')[0]));
      }
    }
  }
  return ids;
}

module.exports = { snapshot, differences, expectGolden, auditsCovered, GOLDEN_DIR };
