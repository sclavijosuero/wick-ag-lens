// REFERENCE TABLES: the exact findings every step of the two sample journeys must report.
// They pin down, per step: how many findings are NEW and RESOLVED, of which audit (type), the violation/health counts,
// and how many stops the focus order has. They were generated from real runs, read through, and frozen here, so a change in
// how the audits or the diff behave shows up as a precise, readable failure instead of a silent difference.
//
//   newV / resV   violations (v-* audits)  added / resolved at that step, as { auditId: number of elements }
//   newI / resI   structural + informative (i-* audits) added / resolved, same shape
//   health        [Critical, Serious, Moderate, Informative] active on the page AFTER the step
//   focus         number of stops in the focus order after the step (a full snapshot, not a delta)

const step = (n, newV, resV, newI, resI, health, focus) => ({ step: n, newV, resV, newI, resI, health, focus });

// samples/shop-journey.html  (also /app/journey.html behind a login)
const JOURNEY = [
  step(1, { 'v-missing-alt': 1 }, {}, { 'i-valid-headings': 2, 'i-landmarks': 3, 'i-aria-roles': 1, 'i-aria-expanded': 1 }, {}, [1, 0, 0, 7], 6),
  step(2, { 'v-empty-links': 1, 'v-empty-buttons': 1 }, {}, { 'i-lists': 4, 'i-aria-roles': 7, 'i-aria-expanded': 1 }, { 'i-aria-expanded': 1 }, [3, 0, 0, 18], 9),
  step(3, {}, { 'v-empty-links': 1, 'v-empty-buttons': 1 }, { 'i-aria-expanded': 1 }, { 'i-aria-roles': 7, 'i-aria-expanded': 1, 'i-lists': 4 }, [1, 0, 0, 7], 6),
  step(4, { 'v-heading-errors': 1, 'v-unlabeled-inputs': 1, 'v-placeholder-label': 1, 'v-unfocusable': 1 }, {}, { 'i-valid-headings': 1 }, {}, [3, 1, 1, 8], 9),
  step(5, { 'v-tabindex': 1 }, { 'v-heading-errors': 1, 'v-unlabeled-inputs': 1, 'v-placeholder-label': 1, 'v-unfocusable': 1 }, { 'i-valid-headings': 1, 'i-aria-roles': 1 }, { 'i-valid-headings': 1 }, [1, 1, 0, 9], 10),
  step(6, { 'v-aria-invalid': 1 }, {}, {}, {}, [1, 2, 0, 9], 10),
  step(7, { 'v-aria-hidden-focus': 3 }, {}, { 'i-aria-roles': 1 }, {}, [4, 2, 0, 10], 11),
  step(8, {}, { 'v-aria-hidden-focus': 3 }, {}, { 'i-aria-roles': 1 }, [1, 2, 0, 9], 10),
  step(9, { 'v-empty-links': 1, 'v-empty-buttons': 1 }, {}, { 'i-lists': 4, 'i-aria-roles': 7, 'i-aria-expanded': 1 }, { 'i-aria-expanded': 1 }, [3, 2, 0, 20], 13),
];

// samples/steps-demo.html  (every step action; only violations and the focus order are audited)
const STEPS_DEMO = [
  step(1, {}, {}, {}, {}, [0, 0, 0, 0], 3),
  step(2, { 'v-empty-buttons': 1 }, {}, {}, {}, [1, 0, 0, 0], 6),
  step(3, { 'v-aria-invalid': 1 }, {}, {}, {}, [1, 1, 0, 0], 6),
  step(4, {}, { 'v-aria-invalid': 1 }, {}, {}, [1, 0, 0, 0], 6),
  step(5, { 'v-unlabeled-inputs': 1 }, {}, {}, {}, [2, 0, 0, 0], 7),
  step(6, { 'v-empty-links': 1 }, {}, {}, {}, [3, 0, 0, 0], 8),
  step(7, { 'v-missing-alt': 1 }, {}, {}, {}, [4, 0, 0, 0], 8),
  step(8, { 'v-generic-link': 1 }, {}, {}, {}, [4, 0, 1, 0], 9),
  step(9, {}, {}, {}, {}, [4, 0, 1, 0], 9),
  step(10, {}, {}, {}, {}, [4, 0, 1, 0], 9),
  step(11, {}, { 'v-unlabeled-inputs': 1, 'v-empty-buttons': 1 }, {}, {}, [2, 0, 1, 0], 5),
];

// { auditId: number of elements } for one side (new_findings / resolved_findings) of a step, split in v-* and i-*.
// Also verifies the totals the JSON states itself (totalElemsNew / totalElemsResolved) against the elements listed.
function countByAudit(findings, totalKey, problems, where) {
  const out = { v: {}, i: {} };
  for (const cats of Object.values(findings || {})) {
    for (const audits of Object.values(cats)) {
      for (const a of audits) {
        if (a[totalKey] !== a.elements.length) problems.push(`${where}: ${a.auditId} says ${totalKey}=${a[totalKey]} but lists ${a.elements.length}`);
        const bucket = a.auditId.startsWith('v-') ? out.v : out.i;
        bucket[a.auditId] = (bucket[a.auditId] ?? 0) + a.elements.length;
      }
    }
  }
  return out;
}

// What a real trail step reports, in the same shape as a reference row
function actualRow(trailStep, problems = []) {
  const n = countByAudit(trailStep.new_findings, 'totalElemsNew', problems, `step ${trailStep.step} new`);
  const r = countByAudit(trailStep.resolved_findings, 'totalElemsResolved', problems, `step ${trailStep.step} resolved`);
  const h = trailStep.health_scores;
  return {
    step: trailStep.step, newV: n.v, resV: r.v, newI: n.i, resI: r.i,
    health: [h.Critical, h.Serious, h.Moderate, h.Informative],
    focus: trailStep.page_state_maps?.focus_order?.totalElems ?? 0,
  };
}

// Compares the first reference.length steps of a trail with the reference table. Returns { actual, problems } where
// `problems` lists every difference (empty when the trail matches).
function compareWithReference(trail, reference) {
  const problems = [];
  const norm = (v) => JSON.stringify(v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v);
  const actual = reference.map((_, i) => actualRow(trail[i], problems));
  reference.forEach((expected, i) => {
    for (const key of ['newV', 'resV', 'newI', 'resI', 'health', 'focus']) {
      if (norm(expected[key]) !== norm(actual[i][key])) {
        problems.push(`step ${expected.step} ${key}: expected ${JSON.stringify(expected[key])} but got ${JSON.stringify(actual[i][key])}`);
      }
    }
  });
  return { actual, problems };
}

module.exports = { JOURNEY, STEPS_DEMO, compareWithReference, actualRow };
