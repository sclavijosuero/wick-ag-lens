// Helpers to read a multi-step audit trail the way a person would: what was ADDED, what was RESOLVED, what is
// still ACTIVE after each step, and whether the whole JSON is internally consistent.

const SEVERITIES = ['Critical', 'Serious', 'Moderate', 'Minor', 'Manual', 'Informative'];

// { Tab: { Category: [ { auditId, severity, elements: [...] } ] } }  ->  flat rows
function rows(findings) {
  const out = [];
  for (const cats of Object.values(findings || {})) {
    for (const audits of Object.values(cats)) {
      for (const a of audits) {
        for (const e of a.elements) {
          out.push({
            auditId: a.auditId, severity: a.severity, selector: e.selector, issueText: e.issueText,
            key: `${a.auditId}|${e.selector}|${e.issueText}`,     // same identity the scanner uses to diff steps (plus its occurrence number)
          });
        }
      }
    }
  }
  return out;
}

const isViolation = (r) => r.auditId.startsWith('v-');          // v-* = violations, i-* = informative / structure
const isStructure = (r) => r.auditId.startsWith('i-');

// What changed at one step
function delta(step) {
  return { added: rows(step.new_findings), resolved: rows(step.resolved_findings) };
}

// "v-empty-links #menu-empty-link" lists, sorted, for readable exact comparisons
const label = (r) => `${r.auditId} ${r.selector}`;
const labels = (list) => list.map(label).sort();

// Rebuilds the set of findings active on the page after every step:  active(n) = active(n-1) - resolved(n) + added(n)
// and checks the trail is self-consistent. Returns one entry per step; `problems` lists anything inconsistent.
function replay(report) {
  const problems = [];
  let active = new Map();
  // Several elements can share the SAME key (audit + selector + text): v-duplicate-id lists every element sharing an id, and the root `html` of
  // each frame reports as `html`. Those are counted, not collapsed, so a key can be active several times (and gain occurrences later).
  const times = new Map();
  const steps = report.audit_trail.map((step) => {
    const { added, resolved } = delta(step);
    // every audit entry states how many elements it lists: the number must agree with the list
    for (const [side, key] of [['new_findings', 'totalElemsNew'], ['resolved_findings', 'totalElemsResolved']]) {
      for (const cats of Object.values(step[side] || {})) {
        for (const audits of Object.values(cats)) {
          for (const a of audits) {
            if (a[key] !== a.elements.length) problems.push(`step ${step.step}: ${a.auditId} ${key}=${a[key]} but lists ${a.elements.length}`);
          }
        }
      }
    }
    for (const r of resolved) {
      if (!active.has(r.key)) problems.push(`step ${step.step}: resolved "${r.key}" was never active`);
      const left = (times.get(r.key) ?? 1) - 1;
      if (left > 0) times.set(r.key, left); else { times.delete(r.key); active.delete(r.key); }
    }
    for (const r of added) {
      times.set(r.key, (times.get(r.key) ?? 0) + 1);
      active.set(r.key, r);
    }
    const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0]));
    for (const [key, r] of active) counts[r.severity] = (counts[r.severity] ?? 0) + (times.get(key) ?? 1);
    for (const s of SEVERITIES) {
      if (counts[s] !== step.health_scores[s]) problems.push(`step ${step.step}: ${s} replayed=${counts[s]} health_scores=${step.health_scores[s]}`);
    }
    return { step: step.step, active: new Map(active), counts, added, resolved };
  });
  return { steps, problems };
}

module.exports = { SEVERITIES, rows, delta, replay, isViolation, isStructure, label, labels };
