const { test, expect } = require('@playwright/test');
const { runCli, audit, idsOf, selectorsFor, focusMap, attachScreenshots, isJpeg } = require('../helpers/cli');
const { connectMcp, callTool } = require('../helpers/mcp');
const { extensionLegendLabels, FEATURES, COMBOS, legendsByAudit } = require('../helpers/wcag');

// SMALL CHECKS OF SPECIFIC AUDIT BEHAVIOUR on small fixture pages, one test per area. They are about WHAT an audit reports on
// one tricky page (aria-hidden, focus order, iframes, shadow DOM, WCAG filters, the options of the tools), where the journeys of
// journeys.spec.js are about the whole trail. Keep them few: a new case belongs in a journey page if it can.
test.describe.configure({ timeout: 120_000 });

test('CLI: bad page vs good page, --audits, --step, and screenshots only with -s', { tag: '@cli' }, async ({ baseURL }) => {
  const known = ['v-doc-title', 'v-missing-alt', 'v-empty-links', 'v-empty-buttons', 'v-unlabeled-inputs'];
  const bad = (await audit(`${baseURL}/bad.html`)).report;
  for (const id of known) expect(idsOf(bad.audit_trail[0]), `expected ${id}`).toContain(id);
  expect(bad.global_summary.Critical).toBeGreaterThan(0);
  for (const step of bad.audit_trail) expect(Object.keys(step), 'no screenshot key without -s').not.toContain('screenshot_base64');

  for (const id of known) expect((idsOf((await audit(`${baseURL}/good.html`)).report.audit_trail[0]))).not.toContain(id);

  const only = (await audit(`${baseURL}/bad.html`, ['--audits', 'v-doc-title'])).report;
  expect(new Set(idsOf(only.audit_trail[0]))).toEqual(new Set(['v-doc-title']));

  // --step click: only the new image is reported, and with -s every step carries a real JPEG
  const { report } = await audit(`${baseURL}/interactive.html`, [
    '-s', '--audits', 'v-missing-alt,v-empty-links,i-image-alts', '--step', 'click::#add', '--step', 'click::#add-link',
  ]);
  const [baseline, addImage, addLink] = report.audit_trail;
  expect(idsOf(baseline)).toEqual([]);
  expect(selectorsFor(addImage, 'v-missing-alt')).toEqual(['#out > img']);
  expect(selectorsFor(addImage, 'i-image-alts')).toEqual(['#out > img']);
  expect(selectorsFor(addLink, 'v-empty-links')).toEqual(['#out > a']);
  expect(selectorsFor(addLink, 'v-missing-alt')).toEqual([]);                    // the earlier image is not new again
  const shots = await attachScreenshots(report, 'interactive-page');
  expect(shots).toHaveLength(3);
  shots.forEach((s) => expect(isJpeg(s)).toBe(true));
  expect(report.audit_trail[0].screenshot_base64).not.toMatch(/^data:/);          // raw base64, no data-URI prefix

  const help = await runCli(['--help']);
  expect(help.code).toBe(0);
  expect(help.stdout).toContain('audit');
});

test('CLI: aria-hidden controls are flagged, marked in the focus order, and tabindex="-1" or inert ones are not', { tag: '@cli' }, async ({ baseURL }) => {
  const { report } = await audit(`${baseURL}/aria-hidden.html`, ['--audits', 'v-aria-hidden-focus,i-focus-order']);
  const step = report.audit_trail[0];
  const flagged = selectorsFor(step, 'v-aria-hidden-focus');
  expect(flagged.sort()).toEqual(['#hidden-btn', '#hidden-link']);                // not #visible, #last or the tabindex="-1" #hidden-safe
  expect(focusMap(step).map((e) => [e.selector, e.issueText, e.legend])).toEqual([
    ['#visible', '#1: <button>', 'Valid Focus'],
    ['#hidden-btn', '#2: <button> (Hidden from AT)', 'Focusable in Aria-Hidden'],
    ['#hidden-link', '#3: <a> (Hidden from AT)', 'Focusable in Aria-Hidden'],
    ['#last', '#4: <a>', 'Valid Focus'],
  ]);                                                                              // #hidden-safe (tabindex="-1") is left out of the order

  const rules = await audit(`${baseURL}/aria-hidden-focus.html`, ['--audits', 'v-aria-hidden-focus']);
  expect(selectorsFor(rules.report.audit_trail[0], 'v-aria-hidden-focus').sort())
    .toEqual(['#v-button', '#v-editable', '#v-link', '#v-summary', '#v-tabindex0']);   // none of the ok-* ones (disabled, inert, display:none, ...)
});

test('CLI: the focus order is a state map: full sequence per step, only reachable stops, isolated from findings', { tag: '@cli' }, async ({ baseURL }) => {
  const selectors = (s) => s.page_state_maps.focus_order.elements.map((e) => e.selector);
  const { report } = await audit(`${baseURL}/focus.html`, ['--audits', 'i-focus-order', '--step', 'click::#reveal']);
  const [before, after] = report.audit_trail;
  expect(before.page_state_maps.focus_order.totalElems).toBe(4);
  expect(selectors(before)).toEqual(['#first', '#second', '#third', '#reveal']);
  expect(before.page_state_maps.focus_order.elements.map((e) => e.issueText)).toEqual(['#1: <a>', '#2: <button>', '#3: <input>', '#4: <button>']);
  expect(after.page_state_maps.focus_order.totalElems).toBe(5);                    // a full snapshot, the new stop last
  expect(selectors(after)).toEqual(['#first', '#second', '#third', '#reveal', '#extra']);
  expect(idsOf(before)).not.toContain('i-focus-order');                            // never a finding
  expect(report.global_summary.Critical).toBe(0);

  const rules = await audit(`${baseURL}/focus-rules.html`, ['--audits', 'i-focus-order']);
  expect(selectors(rules.report.audit_trail[0])).toEqual(['#first', '#editable', '#summary', '#audio', '#last']);   // not display:none, hidden, inert, tabindex="-1"

  const off = await audit(`${baseURL}/focus.html`, ['--audits', 'v-doc-title']);
  expect(off.report.audit_trail[0].page_state_maps).toBeUndefined();               // not requested, not reported
});

test('CLI: iframes (two levels) and shadow DOM: findings and focus order inside them', { tag: '@cli' }, async ({ baseURL }) => {
  const frames = (await audit(`${baseURL}/frames.html`, ['--audits', 'i-focus-order,v-missing-alt,v-empty-buttons'])).report.audit_trail[0];
  expect(selectorsFor(frames, 'v-missing-alt')).toEqual(['#child-img']);
  expect(selectorsFor(frames, 'v-empty-buttons')).toEqual(['#grand-empty']);
  expect(frames.page_state_maps.focus_order.totalElems).toBe(8);
  expect(focusMap(frames).map((e) => [e.selector, e.issueText])).toEqual([     // the same numbering as the extension
    ['#top-link', '#1: <a>'], ['#child', '#2: <iframe>'], ['#top-button', '#3: <button>'],
    ['#child-button', '[Iframe] #2.1: <button>'], ['#grandchild', '[Iframe] #2.2: <iframe>'], ['#child-link', '[Iframe] #2.3: <a>'],
    ['#grand-button', '[Nested] #2.2.1: <button>'], ['#grand-empty', '[Nested] #2.2.2: <button>'],
  ]);

  const shadow = (await audit(`${baseURL}/shadow.html`, ['--audits', 'i-focus-order,v-missing-alt,v-empty-buttons,v-aria-hidden-focus'])).report.audit_trail[0];
  expect(selectorsFor(shadow, 'v-missing-alt')).toEqual(['#shadow-img']);
  expect(selectorsFor(shadow, 'v-empty-buttons')).toEqual(['#shadow-empty']);
  expect(selectorsFor(shadow, 'v-aria-hidden-focus')).toEqual(['#shadow-hidden-btn']);   // aria-hidden on the host reaches its shadow root
  expect(focusMap(shadow).map((e) => [e.selector, e.issueText])).toEqual([
    ['#light-before', '#1: <button>'], ['#shadow-empty', '#2: <button>'], ['#shadow-ok', '#3: <button>'],
    ['#shadow-hidden-btn', '#4: <button> (Hidden from AT)'], ['#light-after', '#5: <button>'],
  ]);
});

// The WCAG filters must give exactly the legends the extension shows (helpers/wcag.js applies the extension's own rule to the core config).
const expectLegends = (got, combo, unfiltered) => {
  for (const id of FEATURES) {
    const active = extensionLegendLabels(id, combo.versions, combo.levels);
    expect(got[id] ?? [], `${id} with ${combo.name}`).toEqual((unfiltered[id] ?? []).filter((l) => active.includes(l)).sort());
  }
};

test('CLI: --wcag-version / --wcag-level report exactly the legends the extension shows', { tag: '@cli' }, async ({ baseURL }) => {
  test.setTimeout(240_000);
  const results = new Map();
  for (const combo of COMBOS) {
    const { report } = await audit(`${baseURL}/wcag-filters.html`, ['--audits', FEATURES.join(','), ...combo.args]);
    results.set(combo.name, legendsByAudit(report.audit_trail[0]));
  }
  const all = results.get('no filter (everything)');
  expect(all['v-text-contrast']).toEqual(expect.arrayContaining(['AA Fail', 'AAA Fail']));
  expect(all['i-touch-targets']).toHaveLength(3);
  for (const combo of COMBOS) expectLegends(results.get(combo.name), combo, all);
  expect(results.get('AAA only')['v-text-contrast']).toEqual(['AAA Fail']);        // the check above is not vacuous
});

test('MCP: wcagVersions / wcagLevels report exactly the legends the extension shows', { tag: '@mcp' }, async ({ baseURL }) => {
  const client = await connectMcp();
  try {
    const results = new Map();
    for (const combo of COMBOS) {
      const res = await callTool(client, 'audit_baseline', { url: `${baseURL}/wcag-filters.html`, requestedAudits: FEATURES, ...combo.mcp });
      expect(res.isError, res.text).toBe(false);
      results.set(combo.name, legendsByAudit(res.json.audit_trail[0]));
    }
    const all = results.get('no filter (everything)');
    for (const combo of COMBOS) expectLegends(results.get(combo.name), combo, all);
    expect(results.get('2.0 + 2.1, A + AA (the recommended default)')['v-text-contrast']).toEqual(['AA Fail']);
  } finally { await client.close(); }
});

test('MCP: the tools, the session protocol, and the screenshot option', { tag: '@mcp' }, async ({ baseURL }) => {
  const client = await connectMcp();
  try {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(expect.arrayContaining(['audit_baseline', 'interact_and_diff', 'get_audit_trail']));

    // interact_and_diff before any baseline is an error
    const early = await callTool(client, 'interact_and_diff', { action: 'click', target: '#x' });
    expect(early.isError).toBe(true);
    expect(early.text).toContain("Please run 'audit_baseline' first");

    // baseline (1 step) -> interact_and_diff (ONE step, only what changed) -> get_audit_trail (the whole session)
    const audits = ['v-empty-buttons', 'v-missing-alt'];
    const baseline = await callTool(client, 'audit_baseline', { url: `${baseURL}/focus-demo.html`, requestedAudits: audits });
    expect(baseline.isError).toBe(false);
    expect(baseline.json.audit_trail).toHaveLength(1);
    expect(Object.keys(baseline.json.audit_trail[0])).not.toContain('screenshot_base64');   // only with includeScreenshot
    const diff = await callTool(client, 'interact_and_diff', { action: 'click', target: '#show-more', requestedAudits: audits });
    expect(diff.json.step).toBe(2);
    expect(diff.json.interaction).toMatchObject({ action: 'click', selector: '#show-more' });
    expect(selectorsFor(diff.json, 'v-empty-buttons')).toEqual(['#wishlist']);
    expect(selectorsFor(diff.json, 'v-missing-alt')).toEqual(['#promo']);
    const trail = await callTool(client, 'get_audit_trail', {});
    expect(trail.json.audit_trail.map((s) => s.step)).toEqual([1, 2]);
    expect(selectorsFor(trail.json.audit_trail[0], 'v-empty-buttons')).toEqual([]);
    expect(selectorsFor(trail.json.audit_trail[1], 'v-empty-buttons')).toEqual(['#wishlist']);
    expect(trail.json.audit_dictionary).toHaveProperty('v-empty-buttons');

    const shot = await callTool(client, 'audit_baseline', { url: `${baseURL}/good.html`, requestedAudits: ['v-doc-title'], includeScreenshot: true });
    expect(shot.json.audit_trail[0].screenshot_base64).toMatch(/^\/9j\//);        // raw JPEG, base64
  } finally { await client.close(); }
});
