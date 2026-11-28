// Builds the scratch "user project" for one evaluation run. No LLM.
//   node tests/benchmark/skill-eval/make-project.js base            (once: npm pack of cli/ + npm install into a base folder)
//   node tests/benchmark/skill-eval/make-project.js clone <dest> <arm>
// The project holds only what a real user would have: the installed wick-ag-lens package, agent-browser (when the arm has it),
// and the skill under .claude/skills (when the arm has it). No tests/, no fixtures, no repo sources.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { ARMS, AGENT_BROWSER } = require('./arms');

const REPO = path.resolve(__dirname, '..', '..', '..');
const WORK = path.join(os.tmpdir(), 'wick-eval');
const BASE = path.join(WORK, 'base');
const SKILL_SRC = path.join(REPO, 'skills', 'wick-ag-lens', 'SKILL.md');

function ensureBase() {
  if (fs.existsSync(path.join(BASE, 'node_modules', 'wick-ag-lens'))) return BASE;
  fs.rmSync(BASE, { recursive: true, force: true });
  fs.mkdirSync(BASE, { recursive: true });
  const out = execSync(`npm pack "${path.join(REPO, 'cli')}" --pack-destination "${WORK}" --silent`, { encoding: 'utf8' }).trim().split(/\r?\n/).pop();
  const tgz = path.join(WORK, out);
  fs.writeFileSync(path.join(BASE, 'package.json'), JSON.stringify({ name: 'user-project', version: '1.0.0', private: true }, null, 2));
  execSync(`npm install --no-audit --no-fund "${tgz}" ${AGENT_BROWSER}`, { cwd: BASE, stdio: 'inherit' });
  return BASE;
}

function cloneProject(dest, armName) {
  const arm = ARMS[armName];
  ensureBase();
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(BASE, dest, { recursive: true });
  // The package ships its own copy of the skill (cli/skills/). It is removed so that (a) the no-skill arms cannot read it and
  // (b) the skill arms use exactly the frozen skills/wick-ag-lens/SKILL.md, as `npx skills add` would install it.
  fs.rmSync(path.join(dest, 'node_modules', 'wick-ag-lens', 'skills'), { recursive: true, force: true });
  if (!arm.agentBrowser) {
    fs.rmSync(path.join(dest, 'node_modules', 'agent-browser'), { recursive: true, force: true });
    for (const f of fs.readdirSync(path.join(dest, 'node_modules', '.bin'))) if (f.startsWith('agent-browser')) fs.rmSync(path.join(dest, 'node_modules', '.bin', f));
  }
  if (arm.skill) {
    const d = path.join(dest, '.claude', 'skills', 'wick-ag-lens');
    fs.mkdirSync(d, { recursive: true });
    fs.copyFileSync(SKILL_SRC, path.join(d, 'SKILL.md'));
  }
  return dest;
}

module.exports = { ensureBase, cloneProject, WORK, BASE, REPO };

if (require.main === module) {
  const [cmd, dest, arm] = process.argv.slice(2);
  if (cmd === 'base') console.log(ensureBase());
  else if (cmd === 'clone') console.log(cloneProject(path.resolve(dest), arm));
  else console.log('usage: make-project.js base | clone <dest> <arm>');
}
