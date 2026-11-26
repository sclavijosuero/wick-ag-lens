// What the Chrome EXTENSION would show for a given selection of WCAG versions and levels, computed from the same core
// config the extension uses, using the extension's own rule (panel.js: isWcagMatch / getActiveLegends):
//   a feature, or one of its legends, is active when ANY of its { version, level } pairs has its version AND its level
//   selected; a legend without its own mapping uses its feature's. The CLI and MCP must give the same legends.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { repoRoot } = require('./paths');

function loadConfig() {
  const win = { addEventListener() {} };
  const ctx = vm.createContext({ window: win, document: {}, console });
  for (const f of ['core/shared-utils.js', 'core/a11y-config.js']) {
    try { vm.runInContext(fs.readFileSync(path.join(repoRoot, f), 'utf8'), ctx); } catch (e) { /* DOM-only parts of shared-utils are not needed */ }
  }
  return win.A11Y_CONFIG;
}

const config = loadConfig();
const features = config.tabs.flatMap((t) => t.categories.flatMap((c) => c.features));

const isWcagMatch = (pairs, versions, levels) => (!pairs || pairs.length === 0)
  ? true
  : pairs.some((w) => versions.includes(w.version) && levels.includes(w.level));

// Labels of the legends the extension would show for this feature ([] = the feature is switched off)
function extensionLegendLabels(featureId, versions, levels) {
  const f = features.find((x) => x.id === featureId);
  if (!f) throw new Error(`unknown feature ${featureId}`);
  if (!f.legends) return isWcagMatch(f.wcag, versions, levels) ? ['Violation'] : [];
  return f.legends.filter((l) => isWcagMatch(l.wcag || f.wcag, versions, levels)).map((l) => l.label);
}

// ---- shared by tests/cli/wcag-filters.spec.js and tests/mcp/wcag-filters.spec.js ----
const FEATURES = ['v-text-contrast', 'i-touch-targets', 'i-language'];
const ALL = { versions: ['2.0', '2.1', '2.2'], levels: ['A', 'AA', 'AAA'] };

const COMBOS = [
  { name: 'no filter (everything)', ...ALL, args: [], mcp: {} },
  { name: '2.0 + 2.1, A + AA (the recommended default)', versions: ['2.0', '2.1'], levels: ['A', 'AA'], args: ['--wcag-version', '2.0,2.1', '--wcag-level', 'A,AA'], mcp: { wcagVersions: ['2.0', '2.1'], wcagLevels: ['A', 'AA'] } },
  { name: 'all versions, A + AA', versions: ALL.versions, levels: ['A', 'AA'], args: ['--wcag-level', 'A,AA'], mcp: { wcagLevels: ['A', 'AA'] } },
  { name: 'AAA only', versions: ALL.versions, levels: ['AAA'], args: ['--wcag-level', 'AAA'], mcp: { wcagLevels: ['AAA'] } },
  { name: '2.2 only', versions: ['2.2'], levels: ALL.levels, args: ['--wcag-version', '2.2'], mcp: { wcagVersions: ['2.2'] } },
  { name: '2.0 only, AA', versions: ['2.0'], levels: ['AA'], args: ['--wcag-version', '2.0', '--wcag-level', 'AA'], mcp: { wcagVersions: ['2.0'], wcagLevels: ['AA'] } },
];

// audit id -> the legend labels present in a step of the report (sorted)
function legendsByAudit(step) {
  const out = {};
  for (const tab of Object.values(step.new_findings)) {
    for (const cat of Object.values(tab)) {
      for (const a of cat) out[a.auditId] = [...new Set(a.elements.map((e) => e.legend))].sort();
    }
  }
  return out;
}

module.exports = { extensionLegendLabels, FEATURES, ALL, COMBOS, legendsByAudit };
