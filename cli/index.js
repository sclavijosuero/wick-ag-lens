import { Command } from 'commander';
import { WICKScanner } from './scanner.js';

const program = new Command();

// Helper to collect repeatable step flags into an array
const collectSteps = (val, prev) => prev.concat([val]);

// Parses "action::target::value" while preserving "::" if present inside a value/password
const parseStep = (raw) => {
  const parts = raw.split('::');
  const action = parts[0]?.trim().toLowerCase();
  const target = parts[1]?.trim();
  const value = parts.length > 2 ? parts.slice(2).join('::') : undefined;
  return { action, target, value };
};

program
  .name('wick-ag-lens')
  .description('Headless CLI for WICK-AG-Lens with Hierarchical Action-State Timeline')
  .version('3.0.0');

program.command('audit <url>')
  .description('Run an accessibility baseline audit against a URL')
  .option('--audits <list>', 'Comma-separated list of specific audit IDs to run (e.g., v-doc-title,v-empty-links). Defaults to all audits (violations and informative/structure).')
  .option('--wcag-version <versions>', 'Comma-separated list to strictly filter executed audits by WCAG version (e.g., 2.0,2.1,2.2). Defaults to all.')
  .option('--wcag-level <levels>', 'Comma-separated list to strictly filter executed audits by WCAG conformance level (e.g., A,AA,AAA). Defaults to all.')
  .option('-w, --width <pixels>', 'Sets the viewport width to test responsive layouts (defaults to 1280)', parseInt)
  .option('-H, --height <pixels>', 'Sets the viewport height to test responsive layouts (defaults to 800)', parseInt)
  .option('-s, --screenshot', 'Includes a Base64 JPEG screenshot of the rendered page inside the final JSON output')
  .option('--wait-ms <milliseconds>', 'Explicit pause duration in milliseconds after networkidle to let client-side routers or slow animations settle', parseInt)
  .option('--wait-for-selector <selector>', 'Halts audit execution until a specific CSS selector mounts in the DOM')
  .option('--step <step>', 'Repeatable post-baseline interaction step (e.g., "click::#btn", "fill::#q::text"). Can be repeated', collectSteps, [])
  .option('--login-url <url>', 'URL to navigate to for authentication before running the audit')
  .option('-u, --user <user>', 'Shorthand username for standard 2-field login forms')
  .option('-p, --pass <pass>', 'Shorthand password for standard 2-field login forms')
  .option('--auth-step <step>', 'Executable pre-audit auth pipeline step (e.g., "fill::#company::Acme"). Can be repeated', collectSteps, [])
  .option('--auth-script <path>', 'Path to a custom JavaScript module exporting an async login function')
  .option('-i, --interactive', 'Launches a visible browser for 30 seconds to manually solve Captchas/MFA or Cookie banners')
  .option('-a, --auth-state <path>', 'Path to save (or load) a Playwright storage state JSON file (cookies/localStorage)')
  .action(async (url, options) => {
      const scanner = new WICKScanner();
      
      await scanner.init({
          ...options,
          width: options.width,
          height: options.height
      });

      console.log(`[Audit] Preparing scan on ${url} at ${options.width || 1280}x${options.height || 800}...`);
      
      // 1. Pre-Audit Authentication Pipeline
      if (options.authScript) {
          await scanner.authenticateWithScript(options.authScript);
      } else if (options.loginUrl) {
          let authSteps = options.authStep.map(parseStep);

          if (authSteps.length === 0 && options.user && options.pass) {
              authSteps = [
                  { action: 'fill', target: 'input[type="text"], input[type="email"]', value: options.user },
                  { action: 'fill', target: 'input[type="password"]', value: options.pass },
                  { action: 'click', target: 'button[type="submit"], input[type="submit"]' }
              ];
          }

          if (authSteps.length > 0) {
              await scanner.authenticate(options.loginUrl, authSteps);
          }
      }

      if (options.interactive) {
          console.log("Interactive mode: Loading page. You have 30 seconds to clear cookie banners...");
          await scanner.navigateSafely(url);
          await scanner.page.waitForTimeout(30000); 
          
          if (options.authState) {
              await scanner.context.storageState({ path: options.authState });
              console.log(`[Auth] Saved cookie/session state to ${options.authState}`);
          }
      }

      // 2. Build Rule & WCAG Scope Filters
      const filters = {
          requestedAudits: options.audits ? options.audits.split(',').map(s => s.trim()).filter(Boolean) : [],
          wcagVersions: options.wcagVersion ? options.wcagVersion.split(',').map(s => s.trim().toUpperCase()) : [],
          wcagLevels: options.wcagLevel ? options.wcagLevel.split(',').map(s => s.trim().toUpperCase()) : []
      };
      
      // 3. Execute Baseline Audit (Step 1)
      await scanner.runBaseline(url, filters, options.screenshot, {
          waitMs: options.waitMs,
          waitForSelector: options.waitForSelector
      });
      
      // 4. Execute Post-Baseline Audited Interaction Steps (Step 2+)
      if (options.step && options.step.length > 0) {
          const interactionSteps = options.step.map(parseStep);
          for (const step of interactionSteps) {
              console.log(`[Audit] Executing step (${step.action}): ${step.target || 'active'}...`);
              await scanner.interactAndAudit(step, filters, options.screenshot);
          }
      }

      console.log(JSON.stringify(scanner.getAuditTrail(), null, 2));
      await scanner.close();
  });

program.parse();