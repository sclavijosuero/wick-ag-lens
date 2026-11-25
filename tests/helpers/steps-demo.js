// Shared expectations for the packaged sample page samples/steps-demo.html: ONE run that uses every --step action
// (click, fill, select, hover, press with a selector and with `active`, wait by selector and by milliseconds), where
// each action produces a small, different diff. The CLI, the MCP server and the viewer must all tell the same story.
const { test, expect } = require('@playwright/test');
const { focusMap, attachScreenshots } = require('./cli');
const { delta, replay, summarize, isViolation, labels } = require('./journey');
const { STEPS_DEMO, compareWithReference } = require('./references');

const AUDITS = [
  'v-empty-buttons', 'v-aria-invalid', 'v-unlabeled-inputs', 'v-empty-links', 'v-missing-alt', 'v-generic-link', 'i-focus-order',
];

// "action::target[::value]", exactly as written on the command line
const STEPS = [
  'click::#open-panel',
  'fill::#email::not-an-email',
  'fill::#email::jdoe@example.com',
  'select::#country::US',
  'hover::#help',
  'press::#search::Enter',
  'wait::.toast',
  'wait::300',
  'press::active::Tab',
  'press::active::Escape',
];

const BASE_TABS = ['#open-panel', '#help', '#search'];

function defineStepsDemoTests(getReport) {
  const ctx = () => {
    const report = getReport();
    const trail = report.audit_trail;
    return {
      report, trail,
      step: (n) => ({ ...delta(trail[n - 1]), raw: trail[n - 1] }),
      tabs: (n) => focusMap(trail[n - 1]).map((e) => e.selector),
    };
  };
  const violations = (s) => labels(s.added.filter(isViolation));
  const fixed = (s) => labels(s.resolved.filter(isViolation));

  test('baseline: the page is clean, with three tab stops', () => {
    const { step, tabs, trail } = ctx();
    expect(step(1).added).toEqual([]);
    expect(trail[0].health_scores).toMatchObject({ Critical: 0, Serious: 0, Moderate: 0 });
    expect(tabs(1)).toEqual(BASE_TABS);
  });

  test('click: opening the panel adds an unnamed button, and three tab stops', () => {
    const { step, tabs } = ctx();
    expect(violations(step(2))).toEqual(['v-empty-buttons #panel-close']);
    expect(tabs(2)).toEqual([...BASE_TABS, '#panel-close', '#email', '#country']);
  });

  test('fill (bad value): a NEW invalid-field violation', () => {
    expect(violations(ctx().step(3))).toEqual(['v-aria-invalid #email']);
  });

  test('fill (good value): the same violation is RESOLVED, nothing new', () => {
    const s = ctx().step(4);
    expect(fixed(s)).toEqual(['v-aria-invalid #email']);
    expect(s.added).toEqual([]);
  });

  test('select: choosing a country reveals an unlabeled field', () => {
    const { step, tabs } = ctx();
    expect(violations(step(5))).toEqual(['v-unlabeled-inputs #state']);
    expect(tabs(5)).toContain('#state');
  });

  test('hover: the tooltip brings an empty link, which joins the tab order right after the trigger', () => {
    const { step, tabs } = ctx();
    expect(violations(step(6))).toEqual(['v-empty-links #help-link']);
    expect(tabs(6).slice(0, 3)).toEqual(['#open-panel', '#help', '#help-link']);
  });

  test('press with a selector: Enter in the search box shows a result image without alt', () => {
    expect(violations(ctx().step(7))).toEqual(['v-missing-alt #result-img']);
  });

  test('wait for a selector: the audit runs once .toast has mounted, and reports its link', () => {
    const { step, trail } = ctx();
    expect(violations(step(8))).toEqual(['v-generic-link #toast-link']);
    expect(trail[7].interaction).toEqual({ action: 'wait', selector: '.toast' });
  });

  test('wait for milliseconds, and press Tab on the active element: no change at all', () => {
    const { step, tabs } = ctx();
    for (const n of [9, 10]) {
      expect(step(n).added).toEqual([]);
      expect(step(n).resolved).toEqual([]);
      expect(tabs(n)).toEqual(tabs(8));
    }
  });

  test('press Escape on the active element: the panel closes and everything it contained is RESOLVED', () => {
    const { step, tabs } = ctx();
    const s = step(11);
    expect(fixed(s)).toEqual(['v-empty-buttons #panel-close', 'v-unlabeled-inputs #state']);
    expect(s.added).toEqual([]);
    expect(tabs(11)).toEqual(['#open-panel', '#help', '#help-link', '#search', '#toast-link']);
  });

  test('findings per step: how many, of which type, new and resolved, match the reference table (helpers/references.js)', () => {
    expect(compareWithReference(ctx().trail, STEPS_DEMO).problems).toEqual([]);
  });

  test('the trail records every action exactly as it was requested', () => {
    const { trail } = ctx();
    expect(trail.map((t) => t.interaction)).toEqual([
      { action: 'navigate', selector: 'Initial Page Load' },
      { action: 'click', selector: '#open-panel' },
      { action: 'fill', selector: '#email', value: 'not-an-email' },
      { action: 'fill', selector: '#email', value: 'jdoe@example.com' },
      { action: 'select', selector: '#country', value: 'US' },
      { action: 'hover', selector: '#help' },
      { action: 'press', selector: '#search', value: 'Enter' },
      { action: 'wait', selector: '.toast' },
      { action: 'wait', selector: '300' },
      { action: 'press', selector: 'active', value: 'Tab' },
      { action: 'press', selector: 'active', value: 'Escape' },
    ]);
  });

  test('the JSON is coherent: replaying the deltas reproduces every health score', () => {
    const { report, trail } = ctx();
    const { steps, problems } = replay(report);
    expect(problems).toEqual([]);
    expect(steps).toHaveLength(1 + STEPS.length);
    expect(trail.map((t) => t.health_scores.Critical)).toEqual([0, 1, 1, 1, 2, 3, 4, 4, 4, 4, 2]);
    expect(trail.map((t) => t.health_scores.Serious)).toEqual([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(trail.map((t) => t.health_scores.Moderate)).toEqual([0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]);
    for (const k of Object.keys(trail[10].health_scores)) expect(report.global_summary[k]).toBe(trail[10].health_scores[k]);
  });

  test('output: attach the JSON, a summary table and one screenshot per step', async () => {
    const { report, trail } = ctx();
    await test.info().attach('steps-summary', { body: summarize(report), contentType: 'text/plain' });
    await test.info().attach('steps-report.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
    expect(await attachScreenshots(report, 'steps-demo')).toHaveLength(trail.length);
  });
}

module.exports = { AUDITS, STEPS, defineStepsDemoTests };
