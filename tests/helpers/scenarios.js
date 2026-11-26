// THE REGRESSION JOURNEYS (short, medium, long, and the coverage journey at the bottom). Each one is defined ONCE here, and its expected result is frozen ONCE
// in tests/golden/<id>.json. The same journey is then run through every surface (CLI, MCP, agent-browser, viewer), with and
// without a login, and every run must reproduce the same golden file: the audit results must not depend on how the page was
// reached, nor on the tool that ran the audit.
//
//   short   samples/steps-demo.html   10 steps, every step action (click, fill, select, hover, press, wait), 7 audits
//   medium  samples/shop-journey.html  8 steps, violations + structure + focus order, aria-hidden dialog, 16 audits
//   long    benchmark shop            15 steps, 30 audits, about 640 findings (the benchmark of tests/benchmark/)
//   coverage fixtures/pages/coverage.html   6 steps, the 24 audits the three above never reach
//
// `target(mode, baseURL)` gives where and how each journey is reached:
//   mode 'public'  no login
//   mode 'auth'    the protected copy of the same page, behind the login described in `login`
const { sampleUrl, fixtureFileUrl } = require('./paths');
const sample = require('./sample-journeys');
const bench = require('../benchmark/journey');
const { CREDS } = require('./auth');

const SHORT = {
  id: 'short', title: 'short journey (every step action)',
  audits: ['v-empty-buttons', 'v-aria-invalid', 'v-unlabeled-inputs', 'v-empty-links', 'v-missing-alt', 'v-generic-link', 'i-focus-order'],
  steps: [
    'click::#open-panel', 'fill::#email::not-an-email', 'fill::#email::jdoe@example.com', 'select::#country::US',
    'hover::#help', 'press::#search::Enter', 'wait::.toast', 'wait::300', 'press::active::Tab', 'press::active::Escape',
  ],
  detail: 'elements',
  scout: '"Open panel"',                                             // what agent-browser sees on the page before the first step
  target: (mode) => (mode === 'public'
    ? { url: sample.PUBLIC_URL }
    : {
      url: sample.PROTECTED_URL,
      login: { url: sample.LOGIN_URL, user: sample.USER, pass: sample.PASSWORD, fill: { '#user': sample.USER, '#password': sample.PASSWORD }, submit: '#login', waitUrl: '**/app/steps-demo.html' },
    }),
};

const MEDIUM = {
  id: 'medium', title: 'medium journey (shop app, aria-hidden dialog)',
  audits: [
    'v-missing-alt', 'v-empty-links', 'v-empty-buttons', 'v-unlabeled-inputs', 'v-placeholder-label',
    'v-heading-errors', 'v-unfocusable', 'v-tabindex', 'v-aria-invalid', 'v-aria-hidden-focus',
    'i-landmarks', 'i-valid-headings', 'i-lists', 'i-aria-roles', 'i-aria-expanded', 'i-focus-order',
  ],
  steps: [
    'click::#open-menu', 'click::#close-menu', 'click::#open-signup', 'click::#fix-signup',
    'click::#submit-signup', 'click::#open-dialog', 'click::#close-dialog', 'click::#open-menu',
  ],
  detail: 'elements',
  scout: '"Menu"',
  target: (mode, base) => (mode === 'public'
    ? { url: sampleUrl('shop-journey.html') }
    : {
      url: `${base}/app/journey.html`,
      login: { url: `${base}/login-2field.html`, user: CREDS.user, pass: CREDS.password, fill: { '#user': CREDS.user, '#password': CREDS.password }, submit: 'button[type="submit"]', waitUrl: '**/account.html' },
    }),
};

const LONG = {
  id: 'long', title: 'long journey (benchmark shop, 30 audits)',
  audits: bench.AUDITS,
  steps: bench.STEPS,
  detail: 'counts',                                                  // about 640 findings: per-audit counts and focus stops are frozen, not every element
  scout: 'Northwind',
  slow: true,
  target: (mode, base) => (mode === 'public'
    ? { url: `${base}/bench-shop.html` }
    : {
      url: `${base}${bench.SHOP_PATH}`,
      login: { url: `${base}${bench.LOGIN_PATH}`, user: bench.CREDENTIALS.user, pass: bench.CREDENTIALS.password, fill: { '#user': bench.CREDENTIALS.user, '#password': bench.CREDENTIALS.password }, submit: '#login', waitUrl: `**${bench.SHOP_PATH}` },
    }),
};

// The coverage journey: ONE page (tests/fixtures/pages/coverage.html) that plants a finding for each audit the other three
// journeys never reach, and six buttons that make some of them appear and some be resolved. Public only: logins and tools are
// already covered by the journeys above, this one is about the audits themselves.
const COVERAGE = {
  id: 'coverage', title: 'coverage journey (one page, the audits no other journey reaches)',
  audits: [
    'v-doc-title', 'v-page-encoding', 'v-autoplay-media', 'v-uncaptioned-video', 'v-redundant-alt', 'v-suspicious-links',
    'v-unwarned-window', 'v-autocomplete-invalid', 'v-accesskey', 'v-disabled-focus', 'v-prohibited-names', 'v-label-in-name',
    'i-tables', 'i-language', 'i-captioned-video', 'i-iframes', 'i-warned-window', 'i-readonly-fields',
    'i-aria-roledescription', 'i-aria-details', 'i-aria-owns', 'i-aria-setsize', 'i-aria-value', 'i-aria-haspopup',
  ],
  steps: [
    'click::#caption-video', 'click::#stop-autoplay', 'click::#add-title', 'click::#fix-autocomplete', 'click::#warn-links', 'click::#show-extras',
  ],
  detail: 'elements',
  scout: '"Add captions"',
  modes: ['public'],
  target: () => ({ url: fixtureFileUrl('coverage.html') }),
};

const SCENARIOS = [SHORT, MEDIUM, LONG, COVERAGE];

module.exports = { SHORT, MEDIUM, LONG, COVERAGE, SCENARIOS };
