import { Command } from 'commander';
import { WICKScanner } from './scanner.js';

const program = new Command();

program
  .name('wick-ag-lens')
  .description('Headless CLI for WICK-AG-Lens with Hierarchical Action-State Timeline')
  .version('3.0.0');

program.command('audit <url>')
  .description('Run an accessibility baseline audit against a URL')
  .option('-a, --auth-state <path>', 'Path to Playwright storage state JSON')
  .option('-i, --interactive', 'Run browser visibly for manual MFA bypass or Cookie consent')
  .option('-s, --screenshot', 'Include Base64 JPEG screenshots at each step')
  .option('-w, --width <pixels>', 'Viewport width in pixels (e.g., 375 for mobile)', parseInt)
  .option('-H, --height <pixels>', 'Viewport height in pixels (e.g., 812 for mobile)', parseInt)
  .option('--wait-ms <milliseconds>', 'Explicit wait duration in ms after networkidle', parseInt)
  .option('--wait-for-selector <selector>', 'CSS selector to wait for before auditing')
  .option('--login-url <url>', 'URL to navigate to for authentication before running the audit')
  .option('-u, --user <user>', 'Credentials username for login-url')
  .option('-p, --pass <pass>', 'Credentials password for login-url')
  .option('--click <selector>', 'CSS selector to interact with after baseline scan')
  .option('--audits <list>', 'Comma separated list of specific audit IDs to run')
  .action(async (url, options) => {
      const scanner = new WICKScanner();
      
      // Initialize scanner with responsive dimensions and auth configuration
      await scanner.init({
          ...options,
          width: options.width,
          height: options.height
      });

      console.log(`[Audit] Preparing scan on ${url} at ${options.width || 1280}x${options.height || 800}...`);
      
      if (options.loginUrl && options.user && options.pass) {
          await scanner.authenticate(options.loginUrl, options.user, options.pass);
      }

      if (options.interactive) {
          console.log("Interactive mode: Loading page. You have 30 seconds to clear cookie banners...");
          await scanner.page.goto(url, { waitUntil: 'networkidle' });
          await scanner.page.waitForTimeout(30000); 
          
          if (options.authState) {
              await scanner.context.storageState({ path: options.authState });
              console.log(`[Auth] Saved cookie/session state to ${options.authState}`);
          }
      }

      const requestedAudits = options.audits ? options.audits.split(',') : [];
      
      // Execute baseline scan with timing options passed cleanly
      await scanner.runBaseline(url, requestedAudits, options.screenshot, {
          waitMs: options.waitMs,
          waitForSelector: options.waitForSelector
      });
      
      if (options.click) {
          console.log(`[Audit] Interacting with element: ${options.click}...`);
          await scanner.interactAndAudit(`Click: ${options.click}`, options.click, requestedAudits, options.screenshot);
      }

      console.log(JSON.stringify(scanner.getAuditTrail(), null, 2));
      await scanner.close();
  });

program.parse();