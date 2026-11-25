const { test } = require('@playwright/test');
const { audit } = require('../helpers/cli');
const { sampleUrl } = require('../helpers/paths');
const { AUDITS, STEPS, defineJourneyTests } = require('../helpers/journey-suite');

// WORKED EXAMPLE (CLI): one run over several page states, with violations, structural audits and the focus order at
// every step. The expectations live in helpers/journey-suite.js and are shared with the MCP and agent-browser versions,
// so all three surfaces must give the same story. Open the last test's Attachments for the JSON, a summary table and
// one screenshot per step.
//
//   node cli/index.js audit file:///.../samples/shop-journey.html -s --audits "<AUDITS>" --step click::#open-menu --step click::#close-menu ...
test.describe.configure({ mode: 'serial' });          // one shared audit run; a failed step skips the ones after it

test.describe('CLI multi-step journey: shop app', { tag: '@journey' }, () => {
  let report;
  test.beforeAll(async () => {
    // the page shipped in the package (cli/samples/shop-journey.html), opened with a file:/// URL: no server involved
    ({ report } = await audit(sampleUrl('shop-journey.html'), [
      '-s', '--audits', AUDITS.join(','), ...STEPS.flatMap((s) => ['--step', s]),
    ]));
  });

  defineJourneyTests(() => report);
});
