// The shared, worked example of a MULTI-STEP audit. The same journey (tests/fixtures/pages/journey.html) is driven
// through the CLI, the MCP server and agent-browser (session handoff), and every surface must produce the SAME trail.
// So the expectations live here, once, and each spec file only decides HOW the journey is run.
//
// What the journey shows at each step (see the comments in journey.html):
//   1 baseline        one violation that stays all the way through, the page structure, the tab order
//   2 open menu       NEW violations + NEW structure, tab order grows
//   3 close menu      those RESOLVED, tab order shrinks back
//   4 open sign-up    NEW violations of four kinds
//   5 fix form        several RESOLVED and one NEW in the same step; a positive tabindex jumps the tab order
//   6 submit          one NEW violation; the earlier one is still active but not repeated
//   7 open dialog     aria-hidden -> NEW "focusable in aria-hidden"; the focus order flags them
//   8 close dialog    those RESOLVED
//   9 open menu again the same findings REAPPEAR as new
const { test, expect } = require('@playwright/test');
const { focusMap, attachScreenshots } = require('./cli');
const { delta, replay, summarize, isViolation, isStructure, labels } = require('./journey');
const { JOURNEY, compareWithReference } = require('./references');

// Violations + structural/informative audits + focus order, chosen so every step has something to say.
const AUDITS = [
  'v-missing-alt', 'v-empty-links', 'v-empty-buttons', 'v-unlabeled-inputs', 'v-placeholder-label',
  'v-heading-errors', 'v-unfocusable', 'v-tabindex', 'v-aria-invalid', 'v-aria-hidden-focus',
  'i-landmarks', 'i-valid-headings', 'i-lists', 'i-aria-roles', 'i-aria-expanded', 'i-focus-order',
];

// The 8 interactions after the baseline, in the CLI --step syntax "action::target[::value]"
const STEPS = [
  'click::#open-menu', 'click::#close-menu', 'click::#open-signup', 'click::#fix-signup',
  'click::#submit-signup', 'click::#open-dialog', 'click::#close-dialog', 'click::#open-menu',
];

const BASELINE_TAB_ORDER = ['#home', '#open-menu', '#open-signup', '#cat-link', '#cat-btn', '#open-dialog'];
const MENU_TAB_STOPS = ['#menu-empty-link', '#menu-icon', '#close-menu'];

// Registers one test per step plus the whole-trail checks.
//   getReport()          returns the full audit JSON ({ audit_trail, global_summary, audit_dictionary })
//   extraSteps           interactions run after the 9 above (e.g. a final navigation), only checked for the trail shape
function defineJourneyTests(getReport, { extraSteps = [] } = {}) {
  const ctx = () => {
    const report = getReport();
    const trail = report.audit_trail;
    return {
      report, trail,
      tabOrder: (n) => focusMap(trail[n - 1]).map((e) => e.selector),
      step: (n) => ({ ...delta(trail[n - 1]), raw: trail[n - 1] }),
    };
  };
  const has = (list, auditId, issueText) => list.some((r) => r.auditId === auditId && r.issueText === issueText);

  test('step 1 - baseline: one violation, the page structure, and the tab order', () => {
    const { step, tabOrder } = ctx();
    const s = step(1);
    expect(labels(s.added.filter(isViolation))).toEqual(['v-missing-alt #promo']);
    expect(s.resolved).toEqual([]);
    expect(s.added.filter((r) => r.auditId === 'i-landmarks').map((r) => r.selector).sort())
      .toEqual(['html > body > header', 'html > body > header > nav', 'html > body > main']);
    expect(s.added.filter((r) => r.auditId === 'i-valid-headings')).toHaveLength(2);       // h1 + h2
    expect(tabOrder(1)).toEqual(BASELINE_TAB_ORDER);
  });

  test('step 2 - open menu: NEW violations and structure; the baseline one is not repeated', () => {
    const { step, tabOrder } = ctx();
    const s = step(2);
    expect(labels(s.added.filter(isViolation))).toEqual(['v-empty-buttons #menu-icon', 'v-empty-links #menu-empty-link']);
    expect(s.added.some((r) => r.auditId === 'v-missing-alt')).toBe(false);                 // #promo is still there, but not new
    expect(s.added.filter(isStructure).map((r) => r.auditId)).toEqual(expect.arrayContaining(['i-lists', 'i-aria-roles']));
    expect(has(s.resolved, 'i-aria-expanded', 'aria-expanded="false"')).toBe(true);        // the toggle's state flipped:
    expect(has(s.added, 'i-aria-expanded', 'aria-expanded="true"')).toBe(true);            //   old result out, new result in
    expect(tabOrder(2)).toEqual([...BASELINE_TAB_ORDER, ...MENU_TAB_STOPS]);               // the focus order is a full snapshot
  });

  test('step 3 - close menu: everything the menu brought is RESOLVED; focus order shrinks back', () => {
    const { step, tabOrder } = ctx();
    const s = step(3);
    expect(labels(s.resolved.filter(isViolation))).toEqual(['v-empty-buttons #menu-icon', 'v-empty-links #menu-empty-link']);
    expect(s.resolved.filter(isStructure).map((r) => r.auditId)).toEqual(expect.arrayContaining(['i-lists', 'i-aria-roles']));
    expect(s.added.filter(isViolation)).toEqual([]);
    expect(s.added.map((r) => `${r.auditId} ${r.issueText}`)).toEqual(['i-aria-expanded aria-expanded="false"']);
    expect(tabOrder(3)).toEqual(BASELINE_TAB_ORDER);
  });

  test('step 4 - open sign-up: NEW violations of four different kinds', () => {
    const { step, tabOrder } = ctx();
    expect(labels(step(4).added.filter(isViolation))).toEqual([
      'v-heading-errors #signup-title',     // <h4> straight after <h2>: a skipped level
      'v-placeholder-label #email',         // placeholder used as the only label
      'v-unfocusable #terms',               // clickable <div> without role/tabindex
      'v-unlabeled-inputs #email',
    ]);
    expect(tabOrder(4)).not.toContain('#terms');                                            // the unfocusable div is not in the tab order
    expect(tabOrder(4)).toEqual(expect.arrayContaining(['#email', '#submit-signup', '#fix-signup']));
  });

  test('step 5 - fix form: several RESOLVED and one NEW in the same step; a positive tabindex jumps the queue', () => {
    const { step, tabOrder } = ctx();
    const s = step(5);
    expect(labels(s.resolved.filter(isViolation))).toEqual([
      'v-heading-errors #signup-title', 'v-placeholder-label #email', 'v-unfocusable #terms', 'v-unlabeled-inputs #email',
    ]);
    expect(labels(s.added.filter(isViolation))).toEqual(['v-tabindex #submit-signup']);
    expect(has(s.resolved, 'i-valid-headings', '<h4>')).toBe(true);                         // same element, new structural result
    expect(has(s.added, 'i-valid-headings', '<h2>')).toBe(true);
    expect(tabOrder(5)[0]).toBe('#submit-signup');                                          // tabindex="3" -> first in the sequence
    expect(tabOrder(5)).toContain('#terms');                                                // the repaired div is now reachable
  });

  test('step 6 - submit: one new violation; the tabindex problem is still active but NOT repeated', () => {
    const { report, step } = ctx();
    const s = step(6);
    expect(labels(s.added.filter(isViolation))).toEqual(['v-aria-invalid #email']);
    expect(s.resolved).toEqual([]);
    expect(replay(report).steps[5].active.has('v-tabindex|#submit-signup|tabindex="3"')).toBe(true);
  });

  test('step 7 - dialog opens: aria-hidden turns background controls into violations, and the focus order marks them', () => {
    const { step, tabOrder } = ctx();
    const s = step(7);
    expect(labels(s.added.filter(isViolation))).toEqual([
      'v-aria-hidden-focus #cat-btn', 'v-aria-hidden-focus #cat-link', 'v-aria-hidden-focus #open-dialog',
    ]);
    expect(focusMap(s.raw).filter((e) => e.legend === 'Focusable in Aria-Hidden').map((e) => e.selector).sort())
      .toEqual(['#cat-btn', '#cat-link', '#open-dialog']);
    expect(tabOrder(7)).toContain('#close-dialog');
  });

  test('step 8 - dialog closes: those violations are RESOLVED and the focus order is clean again', () => {
    const { step, tabOrder } = ctx();
    const s = step(8);
    expect(labels(s.resolved.filter(isViolation))).toEqual([
      'v-aria-hidden-focus #cat-btn', 'v-aria-hidden-focus #cat-link', 'v-aria-hidden-focus #open-dialog',
    ]);
    expect(s.added).toEqual([]);
    expect(focusMap(s.raw).every((e) => e.legend === 'Valid Focus')).toBe(true);
    expect(tabOrder(8)).not.toContain('#close-dialog');
  });

  test('step 9 - menu opened again: the same findings REAPPEAR as new', () => {
    const { step, tabOrder } = ctx();
    expect(labels(step(9).added.filter(isViolation))).toEqual(['v-empty-buttons #menu-icon', 'v-empty-links #menu-empty-link']);
    expect(tabOrder(9)).toEqual(expect.arrayContaining(MENU_TAB_STOPS));
  });

  test('findings per step: how many, of which type, new and resolved, match the reference table (helpers/references.js)', () => {
    const { trail } = ctx();
    const { problems } = compareWithReference(trail, JOURNEY);
    expect(problems).toEqual([]);
  });

  test('the violation counts tell the story, step by step', () => {
    const { trail } = ctx();
    const first9 = trail.slice(0, 9);
    expect(first9.map((t) => t.health_scores.Critical)).toEqual([1, 3, 1, 3, 1, 1, 4, 1, 3]);
    expect(first9.map((t) => t.health_scores.Serious)).toEqual([0, 0, 0, 1, 1, 2, 2, 2, 2]);
  });

  test('the JSON is coherent: replaying the deltas reproduces every health score and the final summary', () => {
    const { report, trail } = ctx();
    const { steps, problems } = replay(report);
    expect(problems).toEqual([]);                                                           // no inconsistent step, any severity
    const total = 1 + STEPS.length + extraSteps.length;
    expect(steps).toHaveLength(total);

    const last = trail[trail.length - 1].health_scores;                                     // global_summary = state after the LAST step
    for (const k of Object.keys(last)) expect(report.global_summary[k]).toBe(last[k]);

    expect(trail.map((t) => t.step)).toEqual(Array.from({ length: total }, (_, i) => i + 1));
    expect(trail[0].interaction).toEqual({ action: 'navigate', selector: 'Initial Page Load' });
    expect(trail.slice(1).map((t) => `${t.interaction.action}::${t.interaction.selector}`)).toEqual([...STEPS, ...extraSteps]);

    // the baseline violation stayed active through the first 9 steps without ever being re-reported
    expect(steps.slice(0, 9).every((s) => s.active.has('v-missing-alt|#promo|Missing alt'))).toBe(true);
    expect(steps.slice(1, 9).some((s) => s.added.concat(s.resolved).some((r) => r.selector === '#promo'))).toBe(false);

    const used = new Set(steps.flatMap((s) => [...s.added, ...s.resolved].map((r) => r.auditId)));
    for (const id of used) expect(report.audit_dictionary, `dictionary entry for ${id}`).toHaveProperty(id);
  });

  test('output: attach the full JSON, a summary table and one screenshot per step', async () => {
    const { report, trail } = ctx();
    await test.info().attach('journey-summary', { body: summarize(report), contentType: 'text/plain' });
    await test.info().attach('journey-report.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
    expect(await attachScreenshots(report, 'journey')).toHaveLength(trail.length);
  });
}

// The short version of the above, for running the SAME journey through many login mechanisms (see login-matrix.js):
// four checks that together prove every step reports exactly the same findings no matter how the session was obtained.
function defineJourneyCompactTests(getReport, { pageSuffix = '/app/journey.html' } = {}) {
  const trailOf = () => getReport().audit_trail;

  test('logged in: every step audits the protected journey page, never the sign-in page', () => {
    const trail = trailOf();
    expect(trail).toHaveLength(1 + STEPS.length);
    expect(trail.every((t) => t.url.endsWith(pageSuffix))).toBe(true);
  });

  test('findings per step (count, type, new and resolved) match the reference table', () => {
    expect(compareWithReference(trailOf(), JOURNEY).problems).toEqual([]);
  });

  test('violations per step: exactly which elements were added and which were resolved', () => {
    const per = trailOf().map((t) => {
      const d = delta(t);
      return { step: t.step, added: labels(d.added.filter(isViolation)), resolved: labels(d.resolved.filter(isViolation)) };
    });
    expect(per.map((p) => [p.step, p.added, p.resolved])).toEqual([
      [1, ['v-missing-alt #promo'], []],
      [2, ['v-empty-buttons #menu-icon', 'v-empty-links #menu-empty-link'], []],
      [3, [], ['v-empty-buttons #menu-icon', 'v-empty-links #menu-empty-link']],
      [4, ['v-heading-errors #signup-title', 'v-placeholder-label #email', 'v-unfocusable #terms', 'v-unlabeled-inputs #email'], []],
      [5, ['v-tabindex #submit-signup'], ['v-heading-errors #signup-title', 'v-placeholder-label #email', 'v-unfocusable #terms', 'v-unlabeled-inputs #email']],
      [6, ['v-aria-invalid #email'], []],
      [7, ['v-aria-hidden-focus #cat-btn', 'v-aria-hidden-focus #cat-link', 'v-aria-hidden-focus #open-dialog'], []],
      [8, [], ['v-aria-hidden-focus #cat-btn', 'v-aria-hidden-focus #cat-link', 'v-aria-hidden-focus #open-dialog']],
      [9, ['v-empty-buttons #menu-icon', 'v-empty-links #menu-empty-link'], []],
    ].slice(0, per.length));
  });

  test('focus order checkpoints: baseline, menu open, tabindex jump, dialog open (aria-hidden stops flagged)', () => {
    const trail = trailOf();
    const tabs = (n) => focusMap(trail[n - 1]).map((e) => e.selector);
    expect(tabs(1)).toEqual(BASELINE_TAB_ORDER);
    expect(tabs(2)).toEqual([...BASELINE_TAB_ORDER, ...MENU_TAB_STOPS]);
    expect(tabs(5)[0]).toBe('#submit-signup');
    expect(focusMap(trail[6]).filter((e) => e.legend === 'Focusable in Aria-Hidden').map((e) => e.selector).sort())
      .toEqual(['#cat-btn', '#cat-link', '#open-dialog']);
  });

  test('the JSON is coherent: replaying the deltas reproduces every health score', () => {
    expect(replay(getReport()).problems).toEqual([]);
  });
}

module.exports = { AUDITS, STEPS, BASELINE_TAB_ORDER, MENU_TAB_STOPS, defineJourneyTests, defineJourneyCompactTests };
