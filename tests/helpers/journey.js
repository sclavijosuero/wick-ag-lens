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
            key: `${a.auditId}|${e.selector}|${e.issueText}`,     // same identity the scanner uses to diff steps
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
      active.delete(r.key);
    }
    for (const r of added) {
      if (active.has(r.key)) problems.push(`step ${step.step}: "${r.key}" reported as new but already active`);
      active.set(r.key, r);
    }
    const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0]));
    for (const r of active.values()) counts[r.severity] = (counts[r.severity] ?? 0) + 1;
    for (const s of SEVERITIES) {
      if (counts[s] !== step.health_scores[s]) problems.push(`step ${step.step}: ${s} replayed=${counts[s]} health_scores=${step.health_scores[s]}`);
    }
    return { step: step.step, active: new Map(active), counts, added, resolved };
  });
  return { steps, problems };
}

// A short human-readable table of the whole journey (attached to the test report)
function summarize(report) {
  const { steps } = replay(report);
  const lines = ['step  action                              health (C/S/M)    +violations  +structure  -resolved'];
  for (const s of steps) {
    const st = report.audit_trail[s.step - 1];
    const action = `${st.interaction.action} ${st.interaction.selector}`.slice(0, 34).padEnd(34);
    const h = st.health_scores;
    lines.push(
      `${String(s.step).padEnd(5)} ${action}  ${`${h.Critical}/${h.Serious}/${h.Moderate}`.padEnd(16)}  ` +
      `${String(s.added.filter(isViolation).length).padEnd(12)} ${String(s.added.filter(isStructure).length).padEnd(11)} ${s.resolved.length}`);
  }
  return lines.join('\n');
}

module.exports = { SEVERITIES, rows, delta, replay, summarize, isViolation, isStructure, label, labels };
