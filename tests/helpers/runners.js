// How one journey is run through each surface. Every runner returns the full report ({ audit_trail, global_summary, audit_dictionary }),
// which the callers compare with the golden file. `target` comes from scenarios.js: { url, login? }.
const { expect } = require('@playwright/test');
const { audit } = require('./cli');
const { connectMcp, callTool } = require('./mcp');
const { toMcpSteps } = require('./auth');
const { AgentBrowser } = require('./agent-browser');

const stepArgs = (steps) => steps.flatMap((s) => ['--step', s]);

// CLI: node index.js audit <url> [--login-url .. -u .. -p ..] --audits .. --step ..
async function runCli(scenario, target, { extra, steps = scenario.steps, screenshots = false } = {}) {
  const login = target.login ? ['--login-url', target.login.url, '-u', target.login.user, '-p', target.login.pass] : [];
  const { report, stdout } = await audit(target.url, [
    ...(extra ?? login), ...(screenshots ? ['-s'] : []), '--audits', scenario.audits.join(','), ...stepArgs(steps),
  ]);
  return { report, stdout };
}

// MCP: audit_baseline, then one interact_and_diff per step, then get_audit_trail. Also checks that what each call returned is
// exactly what the trail lists afterwards. `loginArgs` replaces the default login (loginUrl + user + pass).
async function runMcp(scenario, target, { loginArgs, steps = scenario.steps } = {}) {
  const client = await connectMcp();
  try {
    const login = loginArgs ?? (target.login ? { loginUrl: target.login.url, user: target.login.user, pass: target.login.pass } : {});
    const base = await callTool(client, 'audit_baseline', { url: target.url, requestedAudits: scenario.audits, ...login });
    expect(base.isError, base.text).toBe(false);
    const perCall = [base.json.audit_trail[0]];
    for (const s of toMcpSteps(steps)) {
      const res = await callTool(client, 'interact_and_diff', { ...s, requestedAudits: scenario.audits });   // filters go on EVERY call
      expect(res.isError, res.text).toBe(false);
      perCall.push(res.json);
    }
    const report = (await callTool(client, 'get_audit_trail', {})).json;
    perCall.forEach((returned, i) => {
      const listed = report.audit_trail[i];
      expect(returned.step).toBe(listed.step);
      expect(returned.interaction).toEqual(listed.interaction);
      expect(returned.health_scores).toEqual(listed.health_scores);
      expect(returned.new_findings).toEqual(listed.new_findings);
      expect(returned.resolved_findings).toEqual(listed.resolved_findings);
    });
    return { report };
  } finally { await client.close(); }
}

// agent-browser: it does what an agent uses it for (look at the page, and sign in and save the session with `state save`);
// wick-ag-lens then audits with that file (CLI -a). Only the saved file carries the login into the audit.
async function runAgentBrowser(scenario, target, testInfo, { steps = scenario.steps, via = 'cli' } = {}) {
  const ab = new AgentBrowser();
  let state;
  try {
    if (target.login) {
      await ab.run(['open', target.login.url]);
      for (const [selector, value] of Object.entries(target.login.fill)) await ab.run(['fill', selector, value]);
      await ab.run(['click', target.login.submit]);
      await ab.run(['wait', '--url', target.login.waitUrl]);
      state = testInfo.outputPath('state.json');
      await ab.run(['state', 'save', state]);
    } else {
      await ab.run(['open', target.url]);
      expect(await ab.run(['snapshot', '-i'])).toContain(scenario.scout);              // it sees the controls the journey starts from
    }
  } finally { await ab.close(); }
  if (via === 'mcp') return runMcp(scenario, target, { loginArgs: state ? { authState: state } : {}, steps });
  return runCli(scenario, target, { extra: state ? ['-a', state] : [], steps });
}

module.exports = { runCli, runMcp, runAgentBrowser };
