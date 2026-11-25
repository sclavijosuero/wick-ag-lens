// Drives the real `agent-browser` CLI (a dev dependency of this workspace) the way an AI agent would,
// but with fixed commands, so the documented agent-browser <-> wick-ag-lens workflow can be asserted exactly.
//
// Each command runs as a visible step with its output attached (Playwright UI / HTML report).
// agent-browser keeps a background daemon per --session, so every test gets its own session and closes it.
const { execFile } = require('child_process');
const { test } = require('@playwright/test');

let bin = null;
try { bin = require.resolve('agent-browser/bin/agent-browser.js'); } catch { /* not installed */ }

const available = bin !== null;
let counter = 0;

class AgentBrowser {
  constructor(session = `wick-t-${process.pid}-${++counter}`) {
    this.session = session;
  }

  exec(args, timeout) {
    return new Promise((resolve) => {
      execFile(process.execPath, [bin, ...args], {
        timeout, maxBuffer: 32 * 1024 * 1024,
        env: { ...process.env, AGENT_BROWSER_SESSION: this.session },
      }, (error, stdout, stderr) => resolve({ code: error ? (error.code ?? 1) : 0, stdout, stderr }));
    });
  }

  // Runs one command, e.g. ab.run(['fill', '#user', 'jdoe']). Returns trimmed stdout; throws on a non-zero exit.
  run(args, { timeout = 60_000 } = {}) {
    return test.step(`agent-browser ${args.join(' ')}`, async () => {
      const res = await this.exec(args, timeout);
      await test.info().attach(`agent-browser ${args[0]}`, {
        body: `$ agent-browser ${args.join(' ')}\nexit code: ${res.code}\n\n${res.stdout}${res.stderr ? `\n[stderr]\n${res.stderr}` : ''}`,
        contentType: 'text/plain',
      });
      if (res.code !== 0) throw new Error(`agent-browser ${args.join(' ')} exited ${res.code}\n${res.stdout}\n${res.stderr}`);
      return res.stdout.trim();
    });
  }

  // Never throws: used from afterEach so a failed test still releases its browser/daemon.
  async close() {
    await this.exec(['close'], 30_000).catch(() => {});
  }
}

module.exports = { AgentBrowser, available };
