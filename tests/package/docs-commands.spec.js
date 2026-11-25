// Documentation drift check: every command the docs tell users (or an agent) to run must actually exist.
//  - `wick-ag-lens audit ...` / `node index.js audit ...`: every --flag used must be in `audit --help`.
//  - `agent-browser <command> ...`: the command must be one agent-browser's own --help knows.
// Only fenced code blocks and inline `code` are scanned, so ordinary prose cannot cause false alarms.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { repoRoot } = require('../helpers/paths');
const { runCli } = require('../helpers/cli');
const { AgentBrowser, available } = require('../helpers/agent-browser');

const DOCS = ['README.md', 'cli/README.md', 'cli/docs/auth-examples.md', 'cli/docs/sample-journeys.md', 'extension/README.md', 'skills/wick-ag-lens/SKILL.md'];

// Code snippets of a markdown file: fenced blocks (with "\" line continuations joined) + inline code spans
function codeSnippets(md) {
  const out = [];
  const withoutFences = md.replace(/```[^\n]*\n([\s\S]*?)```/g, (_, body) => {
    // join "\" continuations, and drop trailing shell comments ("cmd   # explanation") which are prose, not commands
    out.push(...body.replace(/\\\r?\n\s*/g, ' ').split(/\r?\n/).map((l) => l.replace(/\s+#\s.*$/, '')));
    return '\n';
  });
  for (const m of withoutFences.matchAll(/`([^`\n]+)`/g)) out.push(m[1]);
  return out;
}

const snippets = DOCS.flatMap((file) => {
  const full = path.join(repoRoot, file);
  return fs.existsSync(full) ? codeSnippets(fs.readFileSync(full, 'utf8')).map((s) => ({ file, s })) : [];
});

test.describe('docs: commands match the real tools', { tag: '@docs' }, () => {
  test('every --flag in documented `audit` commands exists in `audit --help`', async () => {
    const help = (await runCli(['audit', '--help'])).stdout;
    const known = new Set(help.match(/--[a-z][a-z-]*/g));
    expect(known.size).toBeGreaterThan(10);

    const bad = [];
    let checked = 0;
    for (const { file, s } of snippets) {
      if (!/(wick-ag-lens|index\.js)\s+audit\b/.test(s)) continue;
      for (const flag of s.match(/(?<![\w-])--[a-z][a-z-]*/g) ?? []) {
        checked++;
        if (!known.has(flag)) bad.push(`${file}: ${flag}   in: ${s.trim().slice(0, 100)}`);
      }
    }
    expect(checked, 'sanity: the scan should find documented flags').toBeGreaterThan(20);
    expect(bad, 'documented flags that `audit --help` does not list').toEqual([]);
  });

  test('every `agent-browser <command>` in the docs is a command agent-browser knows', async () => {
    test.skip(!available, 'agent-browser is not installed');
    const help = (await new AgentBrowser().exec(['--help'], 30_000)).stdout;
    expect(help).toContain('Core Commands');

    const bad = [];
    let checked = 0;
    for (const { file, s } of snippets) {
      const m = s.match(/(?:^|[\s`$])agent-browser\s+([a-z][\w-]*)/);
      if (!m) continue;                                   // `agent-browser --flag ...` or prose-like snippets
      checked++;
      if (!new RegExp(`(^|[^\\w-])${m[1]}([^\\w-]|$)`, 'm').test(help)) {
        bad.push(`${file}: "${m[1]}"   in: ${s.trim().slice(0, 100)}`);
      }
    }
    expect(checked, 'sanity: the scan should find documented agent-browser commands').toBeGreaterThan(5);
    expect(bad, 'documented agent-browser commands missing from `agent-browser --help`').toEqual([]);
  });
});
