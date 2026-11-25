const { test, expect } = require('@playwright/test');
const { audit, attachScreenshots, idsOf, findingsOf } = require('../helpers/cli');
const { connectMcp, callTool } = require('../helpers/mcp');
const { cliAuthSteps, toMcpSteps, recordState } = require('../helpers/auth');

// OPT-IN live checks against a public training site with a real login and real accessibility problems:
//   "Abi's Testing Dojo"  https://abi-testing-dojo-demo.azurewebsites.net/
// Its login page publishes the demo credentials for exactly this purpose (company / user / password).
// Skipped by default: it needs internet access, the site can change or be down, and it resets every Monday 00:00 UTC.
//   Run:  npm run test:live            (UI mode: npm run test:live -- --ui)     see tests/README.md
//
// The workflow is README example 11: multi-field login, then SPA navigation (Security > Companies > search),
// each step audited. Assertions are deliberately loose (kinds of findings, not exact counts), because the
// site is not ours and its content can change. Every step's screenshot is attached to the test.
const LIVE = !!process.env.WICK_LIVE;
const SITE = process.env.WICK_LIVE_ABI_URL || 'https://abi-testing-dojo-demo.azurewebsites.net';
const CREDS = {
  company: process.env.WICK_LIVE_ABI_COMPANY || 'Contoso',
  user: process.env.WICK_LIVE_ABI_USER || 'jdoe',
  password: process.env.WICK_LIVE_ABI_PASSWORD || 'Admin+123',
};
const DASHBOARD = '/accounts-receivable/dashboard';
const COMPANIES = '/security/companies';

const AUDITS = ['v-heading-errors', 'i-touch-targets', 'v-unlabeled-inputs', 'i-focus-order',
  'v-placeholder-label', 'v-label-in-name', 'i-accessible-name'];
const LOGIN_STEPS = [
  `fill::#company::${CREDS.company}`,
  `fill::#user::${CREDS.user}`,
  `fill::#password::${CREDS.password}`,
  'click::#btn-login',
];
// The Companies search box has no id on the current site (only placeholder "Search..."); the
// first alternative keeps the selector working if an id is ever added back.
const SEARCH_BOX = "input#search-company, input[placeholder='Search...']";
const NAVIGATION = [
  { action: 'click', target: "button.menu-button[title='Security']" },
  { action: 'click', target: "button.submenu-button[title='Companies']" },
  { action: 'fill', target: SEARCH_BOX, value: CREDS.company },
  { action: 'press', target: 'active', value: 'Enter' },
];

// What the whole walk-through must show, regardless of CLI or MCP.
function expectWorkflowResult(trail) {
  expect(trail).toHaveLength(5); // baseline + 4 interactions
  expect(trail.map((s) => s.interaction.action)).toEqual(['navigate', 'click', 'click', 'fill', 'press']);

  // logged in: the baseline of "/" lands on the dashboard (the login page would be /login)
  expect(trail[0].url).toContain(DASHBOARD);
  // the Companies click navigated inside the SPA
  expect(trail[2].url).toContain(COMPANIES);
  expect(trail[4].url).toContain(COMPANIES);

  // real WCAG problems are found, and attributed to the step that revealed them
  expect(idsOf(trail[0])).toEqual(expect.arrayContaining(['v-heading-errors', 'i-accessible-name']));
  expect(idsOf(trail[2])).toEqual(expect.arrayContaining(['v-unlabeled-inputs', 'v-placeholder-label']));
  for (const step of trail) {
    expect(step.screenshot_base64, `step ${step.step} has a screenshot`).toBeTruthy();
    expect(step.page_state_maps.focus_order.elements.length).toBeGreaterThan(0);
  }
  // the findings of a step are not repeated at the next one
  const seen = new Set();
  for (const step of trail) {
    for (const f of findingsOf(step)) for (const e of f.elements) {
      const key = `${f.auditId}|${e.selector}`;
      expect(seen.has(key), `${key} reported twice`).toBe(false);
      seen.add(key);
    }
  }
}

test.describe('Live: Abi\'s Testing Dojo', { tag: ['@auth', '@live'] }, () => {
  test.skip(!LIVE, 'Opt-in: run with npm run test:live (sets WICK_LIVE=1) to check against the public Abi\'s Testing Dojo site');
  test.setTimeout(180_000);

  test('CLI: enterprise login + post-login SPA workflow finds WCAG issues step by step', async () => {
    const { report } = await audit(`${SITE}/`, [
      '--audits', AUDITS.join(','), '--wcag-version', '2.0,2.1', '--wcag-level', 'A,AA',
      '--login-url', `${SITE}/login`, ...cliAuthSteps(LOGIN_STEPS),
      ...NAVIGATION.flatMap((s) => ['--step', [s.action, s.target, s.value].filter((x) => x !== undefined).join('::')]),
      '-s',
    ]);
    await attachScreenshots(report, 'abi-cli'); // Attachments tab: what the CLI's browser saw at each step
    expectWorkflowResult(report.audit_trail);
  });

  test('MCP: the same workflow as audit_baseline + interact_and_diff calls', async () => {
    const client = await connectMcp();
    const trail = [];
    try {
      const filters = { requestedAudits: AUDITS, wcagVersions: ['2.0', '2.1'], wcagLevels: ['A', 'AA'], includeScreenshot: true };
      const base = await callTool(client, 'audit_baseline', {
        url: `${SITE}/`, loginUrl: `${SITE}/login`, authSteps: toMcpSteps(LOGIN_STEPS), ...filters,
      });
      expect(base.isError).toBe(false);
      trail.push(base.json.audit_trail[0]);

      for (const step of NAVIGATION) {
        const res = await callTool(client, 'interact_and_diff', { ...step, ...filters });
        expect(res.isError, res.text.slice(0, 300)).toBe(false);
        trail.push(res.json);
      }
      // the server's own timeline matches what the calls returned
      const full = await callTool(client, 'get_audit_trail', {});
      expect(full.json.audit_trail).toHaveLength(5);
    } finally {
      await attachScreenshots({ audit_trail: trail }, 'abi-mcp');
      await client.close();
    }
    expectWorkflowResult(trail);
  });

  test('CLI: a session recorded by Playwright (-a) audits the protected dashboard, no login flags', async ({}, testInfo) => {
    const state = await recordState(testInfo.outputPath('abi-state.json'), {
      loginUrl: `${SITE}/login`,
      fill: { '#company': CREDS.company, '#user': CREDS.user, '#password': CREDS.password },
      submit: '#btn-login',
      waitUrl: `**${DASHBOARD}`,
    });
    const { report } = await audit(`${SITE}${DASHBOARD}`, [
      '--audits', 'v-heading-errors,i-accessible-name', '--wait-ms', '3000', '-a', state, '-s',
    ]);
    const shots = await attachScreenshots(report, 'abi-cli-auth-state'); // Attachments tab
    expect(shots).toHaveLength(1);
    expect(report.audit_trail[0].url).toContain(DASHBOARD);
    expect(idsOf(report.audit_trail[0])).toEqual(expect.arrayContaining(['v-heading-errors', 'i-accessible-name']));
  });
});
