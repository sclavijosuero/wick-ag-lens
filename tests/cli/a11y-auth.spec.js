const { test } = require('@playwright/test');
const { audit } = require('../helpers/cli');
const { METHODS } = require('../helpers/login-matrix');
const { AUDITS, STEPS, defineJourneyCompactTests } = require('../helpers/journey-suite');

// ACCESSIBILITY AUDITS BEHIND A LOGIN, one login mechanism at a time (CLI).
// Every block runs the SAME 9-step journey on the SAME protected page (/app/journey.html, reachable only with a session)
// and checks the SAME expectations: findings per step (count, type, new, resolved), the violations that came and went, and
// the focus order. The only thing that changes is HOW the session was obtained, so the blocks can be compared side by side:
// the audit results must not depend on the login mechanism. (Pure authentication, with no accessibility, is tagged @auth.)
// Each block's Attachments show the exact command line that was run.
for (const method of METHODS) {
  test.describe(`CLI audits behind a login - ${method.title}`, { tag: '@a11y-auth' }, () => {
    test.describe.configure({ mode: 'serial' });          // one shared run per login mechanism
    let report;

    test.beforeAll(async () => {
      const info = test.info();
      const base = info.project.use.baseURL;
      process.env.WICK_FIXTURE_URL = base;                // read by the --auth-script module; the CLI child process inherits it
      const state = method.prepare ? await method.prepare(base, info) : undefined;
      await info.attach('login-method', { body: `${method.title}\n\n${method.how}`, contentType: 'text/plain' });
      ({ report } = await audit(`${base}/app/journey.html`, [
        ...method.cli(base, state), '--audits', AUDITS.join(','), ...STEPS.flatMap((s) => ['--step', s]),
      ]));
    });

    defineJourneyCompactTests(() => report);
  });
}
