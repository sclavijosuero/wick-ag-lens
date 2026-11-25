const { test, expect } = require('@playwright/test');
const { audit } = require('../helpers/cli');
const { AUDITS, STEPS, defineStepsDemoTests } = require('../helpers/steps-demo');
const { LOGINS, PROTECTED_URL, LOGIN_URL, BASE } = require('../helpers/sample-journeys');

// SAMPLE JOURNEY, CLI: one journey with every step type (click, fill, select, hover, press, wait) on the sample page that
// ships in the package, run once per way of reaching it. Only the login arguments differ between the blocks, and the
// results must be identical. The exact command is attached to each block. Same journey: mcp/ and agent-browser/ versions.
// Control: with no login, the protected page redirects to the sign-in page (proves the logins above really matter).
test.describe('CLI: the control - the protected sample page without a login', { tag: ['@samples', '@sample-journeys'] }, () => {
  test('is bounced to the sign-in page', async () => {
    const { report } = await audit(PROTECTED_URL, ['--audits', 'v-empty-buttons']);
    expect(report.audit_trail[0].url).toContain('/login.html');
  });
});

// One block per login (none, methods 1, 2, 3, 5 - see helpers/sample-journeys.js). Everything below is identical for all of them.
function defineJourney(login, options) {
  test.describe(`CLI sample journey - ${login.title}`, options, () => {
    test.describe.configure({ mode: 'serial' });
    let report;

    // Run the whole journey ONCE for this login; the tests below only read the report.
    //   method 5 first records a session file (`prepare`), the others log in inside the audit command (login.cli).
    test.beforeAll(async () => {
      const info = test.info();
      process.env.SAMPLES_URL = BASE;                                  // read by samples/login-script.mjs (method 3)
      const state = login.prepare ? await login.prepare(info) : undefined;
      const args = [...login.cli(state), '-s', '--audits', AUDITS.join(','), ...STEPS.flatMap((s) => ['--step', s])];
      await info.attach('how', { body: `${login.title}\n${login.how}\n\nnode index.js audit ${login.url} ${args.join(' ')}`, contentType: 'text/plain' });
      ({ report } = await audit(login.url, args));
    });

    // Login worked: step 1 is the target page, not the sign-in page.
    test('the audit starts on the target page, signed in (not on the sign-in page)', () => {
      expect(report.audit_trail[0].url).toBe(login.url);
      expect(report.audit_trail[0].url).not.toBe(LOGIN_URL);
    });
    // Shared expectations (helpers/steps-demo.js): findings per step, resolved ones, focus order, JSON coherence.
    defineStepsDemoTests(() => report);
  });
}

// No login: not an authentication test. Every login method: an accessibility audit behind a login (@a11y-auth).
const [PUBLIC, ...WITH_LOGIN] = LOGINS;
defineJourney(PUBLIC, { tag: ['@samples', '@sample-journeys'] });
for (const login of WITH_LOGIN) defineJourney(login, { tag: ['@samples', '@sample-journeys', '@a11y-auth'] });
