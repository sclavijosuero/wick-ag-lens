// The evaluation matrix, defined once (see tests/benchmark/README.md, "Skill evaluation"). No LLM here.
const SONNET = 'claude-sonnet-5-5';
const HAIKU = 'claude-haiku-5-5';
const PLAYWRIGHT_MCP = '@playwright/mcp@0.0.85'; // pinned: older than two weeks at the time of the evaluation
const AGENT_BROWSER = 'agent-browser@0.44.0';

const TERMINAL = 'Bash,Read,Write,Edit,Glob,Grep,Skill'; // what a coding agent normally has
const NO_TERMINAL = 'Read,Skill';                          // a chat client without a shell

const JOURNEY = [
  'search for "tent"',
  'open the Brand filter and pick one brand',
  'open the quick view of the first product and add it to the cart',
  'open the cart and go to checkout',
  'check the checkout form with invalid data: enter a malformed email (for example "not-an-email") and submit it (Place order)',
].join('; ');

const base = (url) =>
  `Audit the accessibility of the Northwind Outfitters shop at ${url}. It is behind a login (demo account: user jdoe, password Admin+123). ` +
  `Audit the page after each step of this purchase journey: ${JOURNEY}. ` +
  'Scope: WCAG 2.0 and 2.1, levels A and AA. Work in the current folder only.';

const SKILL_SENTENCE = ' Use the wick-ag-lens skill for the audit.';
const DOCS_SENTENCE = ' Use wick-ag-lens for the audit; its documentation is in node_modules/wick-ag-lens/README.md.';
const KNOWN =
  ' You know this app: the sign-in page has #user, #password and #login; on the shop the controls are #search (Enter submits), #filter-brand, ' +
  '#qv-1 (quick view of the first product), #qv-add, #cart-btn, #checkout-btn, #co-email and #co-submit.';

const prompts = {
  named: (url) => base(url) + SKILL_SENTENCE,
  plain: (url) => base(url),
  docs: (url) => base(url) + DOCS_SENTENCE,
  known: (url) => base(url) + SKILL_SENTENCE + KNOWN,
};

// route: what the skill's "How to choose" list should lead to (pre-registered).
const ARMS = {
  A:  { model: SONNET, skill: true,  prompt: 'named', tools: TERMINAL,    wick: false, playwright: false, agentBrowser: true,  route: 'T2-CLI' },
  B:  { model: SONNET, skill: true,  prompt: 'named', tools: TERMINAL,    wick: true,  playwright: false, agentBrowser: true,  route: 'T2-MCP' },
  K:  { model: SONNET, skill: true,  prompt: 'known', tools: TERMINAL,    wick: true,  playwright: false, agentBrowser: true,  route: 'T1' },
  F:  { model: SONNET, skill: true,  prompt: 'known', tools: TERMINAL,    wick: false, playwright: false, agentBrowser: false, route: 'CLI-direct' },
  C:  { model: SONNET, skill: true,  prompt: 'named', tools: NO_TERMINAL, wick: true,  playwright: true,  agentBrowser: false, route: 'T3' },
  D:  { model: SONNET, skill: true,  prompt: 'named', tools: NO_TERMINAL, wick: false, playwright: true,  agentBrowser: false, route: 'REFUSE' },
  E:  { model: SONNET, skill: false, prompt: 'docs',  tools: TERMINAL,    wick: false, playwright: false, agentBrowser: true,  route: 'NONE' },
  T:  { model: SONNET, skill: true,  prompt: 'plain', tools: TERMINAL,    wick: false, playwright: false, agentBrowser: true,  route: 'T2-CLI' },
  H:  { model: HAIKU,  skill: true,  prompt: 'named', tools: TERMINAL,    wick: false, playwright: false, agentBrowser: true,  route: 'T2-CLI' },
  HE: { model: HAIKU,  skill: false, prompt: 'docs',  tools: TERMINAL,    wick: false, playwright: false, agentBrowser: true,  route: 'NONE' },
};

// Interleaved order of the 17 core runs, as arm-run (K = known selectors + wick MCP, the Tier 1 test; F = known selectors, CLI only).
const SCHEDULE = ['A-1','E-1','T-1','H-1','HE-1','B-1','K-1','F-1','D-1','C-1','A-2','E-2','T-2','H-2','HE-2','B-2','D-2'];

module.exports = { ARMS, prompts, SCHEDULE, PLAYWRIGHT_MCP, AGENT_BROWSER, SONNET, HAIKU };
