const { test, expect } = require('@playwright/test');
const { audit, selectorsFor, focusMap } = require('../helpers/cli');

test.describe('iframes', () => {
  const run = (baseURL, audits) => audit(`${baseURL}/frames.html`, ['--audits', audits]);

  test('focus order includes every frame level, tagged [Iframe]', async ({ baseURL }) => {
    const { report } = await run(baseURL, 'i-focus-order');
    console.log('------------------------- REPORT')
    console.log(report)

    expect(report.audit_trail[0].page_state_maps.focus_order.totalElems).toBe(8);

    // CLI numbering today: top document first (#1..#3; the <iframe> itself is a tab stop),
    // then each frame in turn as F<frameIndex>.<n>. The grandchild is "F2", tagged [Iframe] (not [Nested]).
    expect(focusMap(report.audit_trail[0]).map((e) => [e.selector, e.issueText])).toEqual([
      ['#top-link', '#1: <a>'],
      ['#child', '#2: <iframe>'],
      ['#top-button', '#3: <button>'],
      ['#child-button', '[Iframe] #F1.1: <button>'],
      ['#grandchild', '[Iframe] #F1.2: <iframe>'],
      ['#child-link', '[Iframe] #F1.3: <a>'],
      ['#grand-button', '[Iframe] #F2.1: <button>'],
      ['#grand-empty', '[Iframe] #F2.2: <button>'],
    ]);
  });

  test('findings are detected inside the child and the nested grandchild frame', async ({ baseURL }) => {
    const { report } = await run(baseURL, 'v-missing-alt,v-empty-buttons');
    console.log('------------------------- REPORT')
    console.log(report)

    const step = report.audit_trail[0];
    expect(selectorsFor(step, 'v-missing-alt')).toEqual(['#child-img']);      // child frame
    expect(selectorsFor(step, 'v-empty-buttons')).toEqual(['#grand-empty']);  // grandchild frame
  });
});

test.describe('shadow DOM', () => {
  const run = (baseURL, audits) => audit(`${baseURL}/shadow.html`, ['--audits', audits]);

  test('focus order walks into open shadow roots in DOM order', async ({ baseURL }) => {
    const { report } = await run(baseURL, 'i-focus-order');
    console.log('------------------------- REPORT')
    console.log(report)

    expect(focusMap(report.audit_trail[0]).map((e) => [e.selector, e.issueText])).toEqual([
      ['#light-before', '#1: <button>'],
      ['#shadow-empty', '#2: <button>'],
      ['#shadow-ok', '#3: <button>'],
      ['#shadow-hidden-btn', '#4: <button> (Hidden from AT)'],
      ['#light-after', '#5: <button>'],
    ]);
  });

  test('findings are detected inside shadow roots (and only on the bad elements)', async ({ baseURL }) => {
    const { report } = await run(baseURL, 'v-missing-alt,v-empty-buttons');
    console.log('------------------------- REPORT')
    console.log(report)

    const step = report.audit_trail[0];
    expect(selectorsFor(step, 'v-missing-alt')).toEqual(['#shadow-img']);
    expect(selectorsFor(step, 'v-empty-buttons')).toEqual(['#shadow-empty']);
  });

  test('aria-hidden on a shadow host reaches the controls inside its shadow root', async ({ baseURL }) => {
    const { report } = await run(baseURL, 'v-aria-hidden-focus,i-focus-order');
    console.log('------------------------- REPORT')
    console.log(report)

    const step = report.audit_trail[0];
    expect(selectorsFor(step, 'v-aria-hidden-focus')).toEqual(['#shadow-hidden-btn']);
    const row = focusMap(step).find((e) => e.selector === '#shadow-hidden-btn');
    expect(row.legend).toBe('Focusable in Aria-Hidden');
  });
});
