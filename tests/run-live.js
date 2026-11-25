// Runs Playwright with WICK_LIVE=1 set (enables the @live tests against the public Abi's Testing Dojo site), on any OS.
//   npm run test:live              only the @live tests, headless, terminal output
//   npm run test:live -- --ui      only the @live tests, in the Playwright UI
//   npm run test:ui:all            EVERY test (fixtures, agent-browser, AND live) in the Playwright UI
// A leading --all means "do not restrict to @live". All other arguments are passed straight to `playwright test`.
const { spawnSync } = require('child_process');

const playwrightCli = require.resolve('@playwright/test/cli');
const args = process.argv.slice(2);
const all = args[0] === '--all';
const rest = all ? args.slice(1) : args;

const result = spawnSync(
  process.execPath,
  [playwrightCli, 'test', ...(all ? [] : ['--grep', '@live']), ...rest],
  { stdio: 'inherit', env: { ...process.env, WICK_LIVE: '1' } },
);
process.exit(result.status ?? 1);
